import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

// Why this exists:
// Internal tooling often needs a quick way to find failures for debugging or retry workflows.
router.get("/failed", async (req, res) => {
  const result = await pool.query(
    `SELECT id, source_id, external_id, status, retry_count, error_message, updated_at
     FROM records
     WHERE status='FAILED'
     ORDER BY updated_at DESC
     LIMIT 200`
  );
  res.json(result.rows);
});

// Why this exists:
// Retry is an operational feature. We do not "magically fix" data here;
// we just move it back to PENDING and increment retry_count.
router.post("/:id/retry", async (req, res) => {
  const id = Number(req.params.id);

  const result = await pool.query(
    `UPDATE records
     SET status='PENDING',
         retry_count=retry_count+1,
         error_message=NULL,
         updated_at=NOW()
     WHERE id=$1
     RETURNING id, status, retry_count`,
    [id]
  );

  if (result.rowCount === 0) return res.status(404).json({ error: "Record not found" });
  res.json(result.rows[0]);
});

export default router;
