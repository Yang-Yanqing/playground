import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";

const router = Router();

const CreateSourceSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});

// Why this exists:
// Source is a first-class concept. It anchors uniqueness and ownership of records.
router.post("/", async (req, res) => {
  const parsed = CreateSourceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { name, description } = parsed.data;

  try {
    const result = await pool.query(
      `INSERT INTO sources(name, description)
       VALUES ($1, $2)
       ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
       RETURNING *`,
      [name, description ?? null]
    );
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

router.get("/", async (req, res) => {
  const result = await pool.query(`SELECT * FROM sources ORDER BY id DESC`);
  res.json(result.rows);
});

export default router;
