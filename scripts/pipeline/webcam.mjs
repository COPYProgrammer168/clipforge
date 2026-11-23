import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runProcess } from "./media.mjs";

const pipelineDir = path.dirname(fileURLToPath(import.meta.url));
const bridgePath = path.join(pipelineDir, "webcam_bridge.py");

const pythonEnv = {
  PYTHONUTF8: "1",
  PYTHONIOENCODING: "utf-8",
  PYTHONUNBUFFERED: "1",
  OMP_NUM_THREADS: "4",
};

export async function detectWebcam(sourcePath, outDir) {
  const outputPath = path.join(outDir, "webcam.json");

  try {
    await runProcess(
      "python",
      [
        bridgePath,
        sourcePath,
        "--output",
        outputPath,
      ],
      { env: pythonEnv }
    );

    const payload = JSON.parse(await readFile(outputPath, "utf8"));
    if (
      payload.hasWebcam &&
      payload.box &&
      payload.box.width > 0 &&
      payload.box.height > 0
    ) {
      return payload;
    }
  } catch (error) {
    console.warn(`[webcam] detection failed: ${error.message}`);
  }

  return null;
}
