import { spawn, spawnSync } from "node:child_process";
import path from "node:path";

try {
  process.loadEnvFile(".env.local");
} catch {
  // No .env.local present.
}
try {
  process.loadEnvFile(".env");
} catch {
  // No .env present.
}

const port = process.env.PORT ?? "3000";
const workerDisabled = ["1", "true", "yes"].includes(
  (process.env.WORKER_DISABLED ?? "").trim().toLowerCase()
);
const autoSetup = !["0", "false", "no"].includes(
  (process.env.DB_AUTO_SETUP ?? "1").trim().toLowerCase()
);
let shuttingDown = false;
let web = null;
let worker = null;
let restartTimer = null;

if (process.env.RENDER && !process.env.DATABASE_URL) {
  console.error(
    "[render] DATABASE_URL is not set. Configure a Turso/libSQL URL instead of using ephemeral SQLite."
  );
  process.exit(1);
}

if (
  process.env.RENDER &&
  process.env.DATABASE_URL?.startsWith("libsql://") &&
  !process.env.DATABASE_AUTH_TOKEN
) {
  console.error(
    "[render] DATABASE_AUTH_TOKEN is required for a libsql:// database."
  );
  process.exit(1);
}

const storage = (process.env.CLIP_STORAGE ?? "local").trim().toLowerCase();

if (storage === "r2") {
  const required = [
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET",
    "R2_PUBLIC_BASE_URL",
  ];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    console.warn(
      `[render] CLIP_STORAGE=r2 is missing ${missing.join(", ")}; uploads and clip publishing will fail until they are set.`
    );
  }
} else if (
  (storage === "blob" || storage === "vercel") &&
  !process.env.BLOB_READ_WRITE_TOKEN
) {
  console.warn(
    "[render] CLIP_STORAGE=blob but BLOB_READ_WRITE_TOKEN is not set; uploads and clip publishing will fail until it is set."
  );
}

if (autoSetup) {
  console.log("[render] applying database migrations");
  const result = spawnSync(
    process.execPath,
    [path.join(process.cwd(), "scripts", "migrate.mjs")],
    { stdio: "inherit", env: process.env }
  );
  if (result.error) {
    console.error(`[render] database migration failed: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(
      `[render] database migration failed (${result.status ?? result.signal})`
    );
    process.exit(result.status ?? 1);
  }
  console.log("[render] database schema ready");
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  if (restartTimer) clearTimeout(restartTimer);
  for (const child of [web, worker]) {
    if (child && !child.killed) child.kill("SIGTERM");
  }
  setTimeout(() => process.exit(code), 4000);
}

function startWorker() {
  worker = spawn(process.execPath, ["scripts/worker.mjs"], {
    stdio: "inherit",
    env: process.env,
  });
  worker.on("exit", (code, signal) => {
    worker = null;
    if (shuttingDown) return;
    console.error(
      `[render] worker exited (${code ?? signal}); restarting in 5s`
    );
    restartTimer = setTimeout(startWorker, 5000);
  });
}

process.on("SIGTERM", () => shutdown(0));
process.on("SIGINT", () => shutdown(0));

web = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "-p", port],
  { stdio: "inherit", env: process.env }
);
web.on("exit", (code) => {
  if (!shuttingDown) {
    console.error(`[render] next exited (${code ?? 1}); stopping`);
    shutdown(code ?? 1);
  }
});

if (workerDisabled) {
  console.log(`[render] web on :${port}, worker disabled`);
} else {
  console.log(`[render] web on :${port}, worker starting`);
  startWorker();
}
