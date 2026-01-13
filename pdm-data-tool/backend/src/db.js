import pg from "pg";

const { Pool } = pg;

// Why this exists:
// Centralized DB access keeps routes clean and makes it easy to switch envs.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
