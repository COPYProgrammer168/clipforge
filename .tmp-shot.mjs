import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const [url, widthArg = "393", heightArg = "852", outArg = ".tmp-shot.png"] =
  process.argv.slice(2);
const width = Number(widthArg);
const height = Number(heightArg);
const port = 9300 + Math.floor(Math.random() * 500);
const userDataDir = path.join(os.tmpdir(), `clipforge-cdp-${Date.now()}`);

const chrome = spawn(
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    "about:blank",
  ],
  { stdio: "ignore" }
);

async function waitForDebugger() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json`);
      const pages = await response.json();
      const page = pages.find((item) => item.type === "page");
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {
      // Chrome is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Chrome debugger did not start.");
}

let socket;
try {
  const debuggerUrl = await waitForDebugger();
  socket = new WebSocket(debuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  let nextId = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id) return;
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
  });

  function send(method, params = {}) {
    const id = ++nextId;
    socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
    });
  }

  await send("Page.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await send("Page.navigate", { url });
  await new Promise((resolve) => setTimeout(resolve, 3500));

  const metrics = await send("Runtime.evaluate", {
    expression: `JSON.stringify({
      innerWidth,
      innerHeight,
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth
    })`,
    returnByValue: true,
  });
  console.log(metrics.result.value);

  const screenshot = await send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  fs.writeFileSync(outArg, Buffer.from(screenshot.data, "base64"));
  console.log(outArg);
} finally {
  socket?.close();
  chrome.kill();
  await new Promise((resolve) => setTimeout(resolve, 500));
  try {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  } catch {
    // Chrome may still hold profile files.
  }
}
