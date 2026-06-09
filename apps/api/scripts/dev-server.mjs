/**
 * Waits for esbuild output, runs the API, and restarts safely after rebuilds.
 * Avoids Node --watch racing esbuild when dist/index.mjs is briefly missing.
 */
import { spawn } from "node:child_process";
import { existsSync, statSync, watch } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const apiDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rootDir = path.resolve(apiDir, "../..");
const entry = path.join(apiDir, "dist/index.mjs");

dotenv.config({ path: path.join(apiDir, ".env") });
dotenv.config({ path: path.join(rootDir, ".env") });

if (!process.env.PORT) {
  process.env.PORT = "8080";
}

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function waitForBuild(deadlineMs = 60_000) {
  const deadline = Date.now() + deadlineMs;
  let lastSize = -1;
  let stable = 0;

  while (Date.now() < deadline) {
    if (!existsSync(entry)) {
      stable = 0;
      await sleep(100);
      continue;
    }

    try {
      const size = statSync(entry).size;
      if (size > 0 && size === lastSize) {
        stable += 1;
        if (stable >= 2) return;
      } else {
        stable = 0;
        lastSize = size;
      }
    } catch {
      stable = 0;
    }

    await sleep(100);
  }

  throw new Error("[api] Timed out waiting for dist/index.mjs — run pnpm run build first.");
}

let child = null;
let restarting = false;
let restartQueued = false;
let watcherReady = false;

async function stopChild() {
  if (!child || child.killed) return;

  const proc = child;
  child = null;

  await new Promise((resolve) => {
    const forceKill = setTimeout(() => {
      try {
        proc.kill("SIGKILL");
      } catch {
        /* already exited */
      }
      resolve();
    }, 2000);

    proc.once("exit", () => {
      clearTimeout(forceKill);
      resolve();
    });

    try {
      proc.kill("SIGTERM");
    } catch {
      clearTimeout(forceKill);
      resolve();
    }
  });

  await sleep(300);
}

function runServer() {
  console.log(`[api] Starting server on port ${process.env.PORT}…`);

  child = spawn(process.execPath, ["--enable-source-maps", entry], {
    stdio: "inherit",
    env: process.env,
    cwd: apiDir,
  });

  child.on("exit", (code, signal) => {
    if (child?.pid === undefined) return;
    child = null;
    if (restarting) return;
    if (signal === "SIGTERM" || signal === "SIGINT") return;
    console.error(`[api] Server exited (${code ?? signal ?? "unknown"})`);
  });
}

async function scheduleRestart(reason) {
  if (!watcherReady) return;

  if (restarting) {
    restartQueued = true;
    return;
  }

  restarting = true;
  restartQueued = false;
  await stopChild();
  console.log(`[api] Rebuild detected (${reason}) — waiting for dist/index.mjs…`);

  try {
    await waitForBuild();
    runServer();
    console.log("[api] Server restarted.");
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
  } finally {
    restarting = false;
    if (restartQueued) {
      void scheduleRestart("queued change");
    }
  }
}

try {
  await waitForBuild();
  runServer();
  // esbuild --watch emits an initial rebuild event; ignore it briefly.
  setTimeout(() => {
    watcherReady = true;
  }, 2000);
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}

const distDir = path.join(apiDir, "dist");
let debounce = null;

watch(distDir, { recursive: false }, (event, filename) => {
  if (!watcherReady) return;
  if (filename && filename !== "index.mjs") return;
  clearTimeout(debounce);
  debounce = setTimeout(() => {
    void scheduleRestart(`${event} on ${filename ?? "dist"}`);
  }, 250);
});

process.on("SIGINT", async () => {
  await stopChild();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await stopChild();
  process.exit(0);
});
