/**
 * Creates mock interview tables.
 * Usage: pnpm --filter @resume-ai/db run migrate:mock-interviews
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

const sql = readFileSync(path.join(root, "drizzle/0004_mock_interviews.sql"), "utf8");

const client = new pg.Client({ connectionString: url });
await client.connect();
try {
  await client.query(sql);
  console.log("✓ mock interview tables are ready.");
} finally {
  await client.end();
}
