import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import app from "./app";
import { logger } from "./lib/logger";

const apiDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rootDir = path.resolve(apiDir, "../..");
dotenv.config({ path: path.join(apiDir, ".env") });
dotenv.config({ path: path.join(rootDir, ".env") });

const rawPort = process.env["PORT"] ?? (process.env.NODE_ENV === "development" ? "8080" : undefined);
if (!rawPort) {
  throw new Error(
    "PORT environment variable is required. Copy .env.example to apps/api/.env (or repo root .env) and set PORT=8080.",
  );
}
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}
app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");
});