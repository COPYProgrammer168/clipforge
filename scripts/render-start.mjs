import { spawn } from "node:child_process";

const port = process.env.PORT ?? "3000";
let shuttingDown = false;
let web = null;
let worker = null;
let restartTimer = null;

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

console.log(`[render] web on :${port}, worker starting`);
startWorker();
