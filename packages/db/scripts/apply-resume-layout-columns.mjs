/**
 * Adds resume_layout JSON columns to analyses and tailored_resumes.
 * Usage: pnpm --filter @resume-ai/db run migrate:resume-layout
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import pg from "pg";
import dotenv from "dotenv";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: path.resolve(root, "../../.env") });
dotenv.config({ path: path.resolve(root, ".env") });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const sql = readFileSync(path.join(root, "drizzle/0003_resume_layout.sql"), "utf8");

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query(sql);
  console.log("✓ resume_layout columns are ready.");
} finally {
  await client.end();
}
