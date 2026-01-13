// Why this file exists:
// Routes define the internal API surface with minimal logic,
// delegating business work to services.

const express = require("express");
const { z } = require("zod");
const db = require("./db");
const { sha256, cleanText } = require("./utils");
const { runImportJob } = require("./services/importRunner");

const router = express.Router();

// Nice-to-have: simple internal auth
function requireApiKey(req, res, next) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) return next(); // If not set, skip auth (dev-friendly)
  if (req.headers["x-api-key"] !== apiKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

router.use(requireApiKey);

const createSchema = z.object({
  sourceUrl: z.string().url().optional(),
  rawText: z.string().min(1).optional()
}).refine(d => d.sourceUrl || d.rawText, {
  message: "Either sourceUrl or rawText is required"
});

// Create an import job (idempotent by checksum)
router.post("/", async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }

  const sourceUrl = parsed.data.sourceUrl || null;
  const rawText = parsed.data.rawText ? cleanText(parsed.data.rawText) : null;

  // checksum is computed from the effective content descriptor
  const checksumBase = sourceUrl ? `URL:${sourceUrl}` : `RAW:${rawText}`;
  const checksum = sha256(checksumBase);

  // If job already exists, return it (idempotency)
  const existing = await db.query(`SELECT * FROM import_jobs WHERE checksum=$1`, [checksum]);
  if (existing.rows.length > 0) {
    return res.status(200).json({ job: existing.rows[0], deduped: true });
  }

  const created = await db.query(
    `INSERT INTO import_jobs(status, source_url, raw_text, checksum)
     VALUES('PENDING', $1, $2, $3)
     RETURNING *`,
    [sourceUrl, rawText, checksum]
  );

  res.status(201).json({ job: created.rows[0], deduped: false });
});

// Run an import job
router.post("/:id/run", async (req, res) => {
  const jobId = Number(req.params.id);
  if (Number.isNaN(jobId)) return res.status(400).json({ error: "Invalid job id" });

  try {
    const result = await runImportJob(jobId);
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err.message || err) });
  }
});

// Retry (Nice-to-have, but small)
router.post("/:id/retry", async (req, res) => {
  const jobId = Number(req.params.id);
  if (Number.isNaN(jobId)) return res.status(400).json({ error: "Invalid job id" });

  const { rows } = await db.query(`SELECT status FROM import_jobs WHERE id=$1`, [jobId]);
  if (rows.length === 0) return res.status(404).json({ error: "Job not found" });
  if (rows[0].status !== "FAILED") {
    return res.status(400).json({ error: "Only FAILED jobs can be retried" });
  }

  try {
    const result = await runImportJob(jobId);
    res.json({ ok: true, retried: true, ...result });
  } catch (err) {
    res.status(500).json({ ok: false, retried: true, error: String(err.message || err) });
  }
});

// Get one job
router.get("/:id", async (req, res) => {
  const jobId = Number(req.params.id);
  if (Number.isNaN(jobId)) return res.status(400).json({ error: "Invalid job id" });

  const job = await db.query(`SELECT * FROM import_jobs WHERE id=$1`, [jobId]);
  if (job.rows.length === 0) return res.status(404).json({ error: "Job not found" });

  const count = await db.query(
    `SELECT COUNT(*)::int AS inserted FROM imported_records WHERE job_id=$1`,
    [jobId]
  );

  res.json({ job: job.rows[0], inserted: count.rows[0].inserted });
});

// List jobs (latest 20)
router.get("/", async (req, res) => {
  const { rows } = await db.query(
    `SELECT id, status, source_url, checksum, error_message, created_at, started_at, finished_at
     FROM import_jobs
     ORDER BY created_at DESC
     LIMIT 20`
  );
  res.json({ jobs: rows });
});

// Get logs (Nice-to-have, but essentially free)
router.get("/:id/logs", async (req, res) => {
  const jobId = Number(req.params.id);
  if (Number.isNaN(jobId)) return res.status(400).json({ error: "Invalid job id" });

  const job = await db.query(
    `SELECT id, status, error_message, started_at, finished_at FROM import_jobs WHERE id=$1`,
    [jobId]
  );
  if (job.rows.length === 0) return res.status(404).json({ error: "Job not found" });

  res.json({ log: job.rows[0] });
});

module.exports = router;
