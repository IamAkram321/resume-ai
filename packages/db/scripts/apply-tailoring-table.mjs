/**
 * Creates only the tailored_resumes table — does not touch users or other tables.
 * Usage (from repo root): pnpm --filter @resume-ai/db run migrate:tailoring
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

const sql = readFileSync(path.join(root, "drizzle/0001_tailored_resumes.sql"), "utf8");

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query(sql);
  console.log("✓ tailored_resumes table is ready.");
} finally {
  await client.end();
}
