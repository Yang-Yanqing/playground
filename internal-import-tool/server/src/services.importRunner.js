// Why this file exists:
// Business logic should not live inside routes.
// This service runs the job and updates status + error handling consistently.

const db = require("../db");
const { cleanText } = require("../utils");

// Parse raw text lines like:
// "apple, 12.5"
// "banana, 9"
function parseRecords(raw) {
  const lines = raw.split("\n").map(l => l.trim()).filter(Boolean);

  return lines.map((line, idx) => {
    const parts = line.split(",").map(p => p.trim());
    const name = cleanText(parts[0]);
    const value = parts[1] ? Number(parts[1]) : null;

    if (!name) {
      throw new Error(`Invalid record at line ${idx + 1}: missing name`);
    }
    if (parts[1] && Number.isNaN(value)) {
      throw new Error(`Invalid record at line ${idx + 1}: value is not a number`);
    }
    return { name, value };
  });
}

async function runImportJob(jobId) {
  // Mark RUNNING (and store started_at)
  await db.query(
    `UPDATE import_jobs SET status='RUNNING', started_at=now(), error_message=NULL WHERE id=$1`,
    [jobId]
  );

  try {
    // Get job payload
    const { rows } = await db.query(
      `SELECT id, source_url, raw_text FROM import_jobs WHERE id=$1`,
      [jobId]
    );
    if (rows.length === 0) throw new Error("Job not found");

    const job = rows[0];

    // Data source: either raw_text or source_url (simple fetch by backend)
    let raw = job.raw_text || "";
    if (!raw && job.source_url) {
      // Node 18+ has global fetch
      const res = await fetch(job.source_url);
      if (!res.ok) throw new Error(`Failed to fetch source_url: ${res.status}`);
      raw = await res.text();
    }

    raw = cleanText(raw);
    if (!raw) throw new Error("Empty input (no raw_text and fetch returned empty)");

    // Parse + validate
    const records = parseRecords(raw);

    // Insert imported records in a transaction
    await db.query("BEGIN");
    for (const r of records) {
      await db.query(
        `INSERT INTO imported_records(job_id, name, value) VALUES($1, $2, $3)`,
        [jobId, r.name, r.value]
      );
    }
    await db.query("COMMIT");

    // Mark SUCCESS
    await db.query(
      `UPDATE import_jobs SET status='SUCCESS', finished_at=now() WHERE id=$1`,
      [jobId]
    );

    return { inserted: records.length };
  } catch (err) {
    await db.query("ROLLBACK").catch(() => {});
    await db.query(
      `UPDATE import_jobs SET status='FAILED', finished_at=now(), error_message=$2 WHERE id=$1`,
      [jobId, String(err.message || err)]
    );
    throw err;
  }
}

module.exports = { runImportJob };
