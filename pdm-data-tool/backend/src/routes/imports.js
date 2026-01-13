import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";

const router = Router();

const CreateImportSchema = z.object({
  sourceId: z.number().int(),
  // A very simple ingestion payload for a 1-day task:
  // caller sends an array of records; each record must have externalId and raw JSON.
  records: z.array(
    z.object({
      externalId: z.string().min(1),
      raw: z.record(z.any())
    })
  ).min(1)
});

// Why this exists:
// Import run creates traceability and supports operational questions like:
// "Did the run succeed? How many duplicates? Which ones failed?"
router.post("/", async (req, res) => {
  const parsed = CreateImportSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { sourceId, records } = parsed.data;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const run = await client.query(
      `INSERT INTO import_runs(source_id, status, total_count)
       VALUES ($1, 'RUNNING', $2)
       RETURNING *`,
      [sourceId, records.length]
    );
    const runId = run.rows[0].id;

    let inserted = 0;
    let duplicates = 0;
    let failed = 0;

    // Minimal validation/normalization:
    // - If raw has "name" and it's a string => OK, store normalized = { name }
    // - Otherwise mark FAILED with error_message
    for (const r of records) {
      const name = r.raw?.name;
      const isValid = typeof name === "string" && name.trim().length > 0;

      const status = isValid ? "OK" : "FAILED";
      const errorMessage = isValid ? null : "Missing or invalid field: name";

      // ON CONFLICT implements idempotent ingestion.
      // We do NOT overwrite raw by default; we just count as duplicate.
      const upsert = await client.query(
        `INSERT INTO records(source_id, import_run_id, external_id, raw, normalized, status, error_message)
         VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6, $7)
         ON CONFLICT (source_id, external_id) DO NOTHING
         RETURNING id`,
        [
          sourceId,
          runId,
          r.externalId,
          JSON.stringify(r.raw),
          isValid ? JSON.stringify({ name: name.trim() }) : null,
          status,
          errorMessage
        ]
      );

      if (upsert.rowCount === 1) {
        inserted += 1;
        if (!isValid) failed += 1;
      } else {
        duplicates += 1;
      }
    }

    // If you want "failed_count" to reflect only newly inserted failures, this is correct.
    // If you want to include existing failed duplicates, that requires different logic.
    const finalStatus = "DONE";

    await client.query(
      `UPDATE import_runs
       SET status=$1,
           inserted_count=$2,
           duplicate_count=$3,
           failed_count=$4,
           updated_at=NOW()
       WHERE id=$5`,
      [finalStatus, inserted, duplicates, failed, runId]
    );

    await client.query("COMMIT");

    res.json({
      importRunId: runId,
      status: finalStatus,
      total: records.length,
      inserted,
      duplicates,
      failed
    });
  } catch (e) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: String(e) });
  } finally {
    client.release();
  }
});

router.get("/", async (req, res) => {
  const result = await pool.query(
    `SELECT ir.*, s.name AS source_name
     FROM import_runs ir
     JOIN sources s ON s.id = ir.source_id
     ORDER BY ir.id DESC
     LIMIT 50`
  );
  res.json(result.rows);
});

router.get("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const run = await pool.query(
    `SELECT ir.*, s.name AS source_name
     FROM import_runs ir
     JOIN sources s ON s.id = ir.source_id
     WHERE ir.id=$1`,
    [id]
  );
  if (run.rowCount === 0) return res.status(404).json({ error: "Import run not found" });

  const records = await pool.query(
    `SELECT id, external_id, status, retry_count, error_message, created_at
     FROM records
     WHERE import_run_id=$1
     ORDER BY id DESC
     LIMIT 200`,
    [id]
  );

  res.json({ run: run.rows[0], records: records.rows });
});

export default router;
