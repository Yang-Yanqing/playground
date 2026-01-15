import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import { pool } from "./db.js";
import { parseCsv } from "./ingest/parseCsv.js";
import { parseJson } from "./ingest/parseJson.js";
import { cleanRow } from "./ingest/clean.js";

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json());

// Health check for quick debugging
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

/**
 * MUST-HAVE: Ingest endpoint
 * - Accepts CSV/JSON file upload
 * - Cleans rows
 * - Upserts into Postgres with UNIQUE(source, external_id)
 * - Returns run statistics
 */
app.post("/api/ingest", upload.single("file"), async (req, res) => {
  try {
    const source = String(req.body.source || "").trim();
    if (!source) return res.status(400).json({ error: "source is required" });
    if (!req.file) return res.status(400).json({ error: "file is required" });

    const filename = req.file.originalname || "upload";
    const ext = filename.toLowerCase().endsWith(".csv")
      ? "csv"
      : filename.toLowerCase().endsWith(".json")
      ? "json"
      : null;

    if (!ext) return res.status(400).json({ error: "Only .csv or .json supported" });

    const rows = ext === "csv" ? parseCsv(req.file.buffer) : parseJson(req.file.buffer);

    let total = 0,
      inserted = 0,
      updated = 0,
      skipped = 0,
      errorRows = 0;

    // Single transaction per ingest run (simple and safe).
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      for (const r of rows) {
        total += 1;

        // Attach source into raw row for consistent cleaning
        const input = { ...r, source };

        const cleaned = cleanRow(input);
        if (!cleaned.ok) {
          skipped += 1;
          continue;
        }

        const v = cleaned.value;

        // UPSERT ensures repeatable imports (idempotency).
        // We count insert vs update using xmax trick (simple approach).
        const q = `
          INSERT INTO items (source, external_id, name, price_cents, currency, raw)
          VALUES ($1, $2, $3, $4, $5, $6::jsonb)
          ON CONFLICT (source, external_id)
          DO UPDATE SET
            name = EXCLUDED.name,
            price_cents = EXCLUDED.price_cents,
            currency = EXCLUDED.currency,
            raw = EXCLUDED.raw,
            updated_at = NOW()
          RETURNING (xmax = 0) AS inserted;
        `;

        const result = await client.query(q, [
          v.source,
          v.external_id,
          v.name,
          v.price_cents,
          v.currency,
          JSON.stringify(v.raw)
        ]);

        if (result.rows[0]?.inserted) inserted += 1;
        else updated += 1;
      }

      // Persist ingest run summary for traceability.
      await client.query(
        `
        INSERT INTO ingest_runs (source, filename, total_rows, inserted_rows, updated_rows, skipped_rows, error_rows)
        VALUES ($1,$2,$3,$4,$5,$6,$7)
        `,
        [source, filename, total, inserted, updated, skipped, errorRows]
      );

      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      // In a fuller system, we might log per-row errors; keep it simple for a 1-day task.
      throw e;
    } finally {
      client.release();
    }

    res.json({
      source,
      filename,
      total_rows: total,
      inserted_rows: inserted,
      updated_rows: updated,
      skipped_rows: skipped,
      error_rows: errorRows
    });
  } catch (err) {
    res.status(500).json({ error: "ingest_failed", message: err.message });
  }
});

/**
 * MUST-HAVE: Query endpoint
 * - Simple pagination + optional source filter
 */
app.get("/api/items", async (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.min(100, Math.max(1, Number(req.query.limit || 20)));
  const offset = (page - 1) * limit;

  const source = req.query.source ? String(req.query.source).trim() : null;

  const where = source ? "WHERE source = $1" : "";
  const params = source ? [source, limit, offset] : [limit, offset];

  const sql = `
    SELECT id, source, external_id, name, price_cents, currency, created_at, updated_at
    FROM items
    ${where}
    ORDER BY updated_at DESC
    LIMIT $${source ? 2 : 1} OFFSET $${source ? 3 : 2};
  `;

  const countSql = `SELECT COUNT(*)::int AS count FROM items ${where};`;

  try {
    const [listResult, countResult] = await Promise.all([
      pool.query(sql, params),
      pool.query(countSql, source ? [source] : [])
    ]);

    res.json({
      page,
      limit,
      total: countResult.rows[0].count,
      items: listResult.rows
    });
  } catch (err) {
    res.status(500).json({ error: "query_failed", message: err.message });
  }
});

// NICE-TO-HAVE: ingest run history (optional)
app.get("/api/ingest/runs", async (_req, res) => {
  try {
    const r = await pool.query(
      `SELECT * FROM ingest_runs ORDER BY created_at DESC LIMIT 50;`
    );
    res.json({ runs: r.rows });
  } catch (err) {
    res.status(500).json({ error: "runs_failed", message: err.message });
  }
});

const port = Number(process.env.PORT || 5000);
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});


// Why it exists：这里体现“可重复导入 + 去重 + 错误处理 + run 统计”。