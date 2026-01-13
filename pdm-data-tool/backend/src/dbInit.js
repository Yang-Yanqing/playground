import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { pool } from "./db.js";

// Why this exists:
// A one-command DB bootstrap is perfect for take-home tasks and demo environments.
async function main() {
  const schemaPath = path.resolve("src/schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf-8");

  await pool.query(sql);
  console.log("DB schema initialized.");
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
