import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const nextBin = require.resolve("next/dist/bin/next");

const children = [];
let shuttingDown = false;

function start(command, args, label) {
  const child = spawn(command, args, { stdio: "inherit" });
  child.label = label;
  children.push(child);
  return child;
}

function stopAll(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) {
      try {
        child.kill();
      } catch {
        // Process already exited.
      }
    }
  }
  process.exit(code);
}

const next = start(process.execPath, [nextBin, "dev", ...process.argv.slice(2)], "next");
const worker = start(process.execPath, ["scripts/worker.mjs"], "worker");

next.on("exit", (code) => stopAll(code ?? 0));
worker.on("exit", (code) => {
  if (!shuttingDown) {
    console.error(`[dev] worker exited with code ${code ?? 1}; stopping next`);
  }
  stopAll(code ?? 1);
});

process.on("SIGINT", () => stopAll(0));
process.on("SIGTERM", () => stopAll(0));
