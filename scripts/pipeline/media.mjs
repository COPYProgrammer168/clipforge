import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const pythonEnv = {
  PYTHONUTF8: "1",
  PYTHONIOENCODING: "utf-8",
  PYTHONUNBUFFERED: "1",
};

export function runProcess(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: { ...process.env, ...(options.env ?? {}) },
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";
    let pendingOut = "";
    let pendingErr = "";

    const dispatch = (line, stream) => {
      if (options.onLine) {
        try {
          options.onLine(line, stream);
        } catch {
          // Ignore listener errors; process output still gets captured.
        }
      }
    };

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      const buffered = pendingOut + text;
      const lines = buffered.split(/\r?\n/);
      pendingOut = lines.pop() ?? "";
      for (const line of lines) dispatch(line, "stdout");
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      const buffered = pendingErr + text;
      const lines = buffered.split(/\r?\n/);
      pendingErr = lines.pop() ?? "";
      for (const line of lines) dispatch(line, "stderr");
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (pendingOut) dispatch(pendingOut, "stdout");
      if (pendingErr) dispatch(pendingErr, "stderr");
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        const detail = (stderr || stdout).trim().slice(-2000);
        const error = new Error(
          `${path.basename(command)} exited with code ${code}${detail ? `\n${detail}` : ""}`
        );
        reject(error);
      }
    });
  });
}

export async function downloadVideo(url, dir, onProgress, options = {}) {
  if (!url) {
    throw new Error("This job has no source URL.");
  }

  const langs = new Set(["km", "km-orig", "en", "en-orig"]);
  if (options.language) {
    langs.add(options.language);
    langs.add(`${options.language}-orig`);
  }
  const captionLangs = Array.from(langs).join(",");
  const captionArgs = [
    "--write-subs",
    "--write-auto-subs",
    "--sub-langs",
    captionLangs,
    "--sub-format",
    "vtt",
  ];

  let progress = 0;
  let destination = "";
  const { stderr } = await runProcess(
    "python",
    [
      "-m",
      "yt_dlp",
      "-f",
      "bv*[height<=1080]+ba/b[height<=1080]/b",
      "--no-playlist",
      "--newline",
      "--no-warnings",
      "--ignore-errors",
      "--sleep-subtitles",
      "1",
      "--retries",
      "10",
      "--fragment-retries",
      "10",
      "--extractor-retries",
      "3",
      "--socket-timeout",
      "30",
      "--retry-sleep",
      "2",
      "--write-info-json",
      ...captionArgs,
      "-o",
      "source.%(ext)s",
      url,
    ],
    {
      cwd: dir,
      env: pythonEnv,
      onLine: (line) => {
        const dest = line.match(/^\[download\]\s+Destination:\s+(.+)$/);
        if (dest) {
          destination = dest[1].trim();
          return;
        }
        if (/\.(vtt|srt|ass|json)$/i.test(destination)) return;
        const match = line.match(/\[download\]\s+(\d+(?:\.\d+)?)%/);
        if (!match) return;
        const value = Math.min(100, Number(match[1])) / 100;
        if (value > progress) {
          progress = value;
          onProgress?.(progress);
        }
      },
    }
  );

  const files = await readdir(dir);
  const candidates = files.filter(
    (file) =>
      file.startsWith("source.") &&
      !/\.(json|part|temp|vtt|srt|ass)$/i.test(file)
  );

  if (candidates.length === 0) {
    const detail = stderr.trim().slice(-600);
    throw new Error(
      `The download finished without producing a video file.${
        detail ? `\n${detail}` : ""
      }`
    );
  }

  let chosen = candidates[0];
  let chosenSize = 0;
  for (const file of candidates) {
    const info = await stat(path.join(dir, file)).catch(() => null);
    if (info && info.size > chosenSize) {
      chosen = file;
      chosenSize = info.size;
    }
  }

  let title = null;
  const infoFile = files.find((file) => file.endsWith(".info.json"));
  if (infoFile) {
    try {
      const parsed = JSON.parse(
        await readFile(path.join(dir, infoFile), "utf8")
      );
      if (typeof parsed.title === "string" && parsed.title.trim()) {
        title = parsed.title.trim().slice(0, 160);
      }
    } catch {
      title = null;
    }
  }

  const subtitles = files
    .filter((file) => file.startsWith("source.") && /\.vtt$/i.test(file))
    .map((file) => path.join(dir, file));

  return { file: path.join(dir, chosen), title, subtitles };
}

export async function fetchToFile(url, destination) {
  if (!url) {
    throw new Error("This job has no uploaded file URL.");
  }

  const response = await fetch(url);
  if (!response.ok || !response.body) {
    throw new Error(
      `Could not download the uploaded video (HTTP ${response.status}).`
    );
  }

  await pipeline(Readable.fromWeb(response.body), createWriteStream(destination));
  return destination;
}

export async function probeDuration(file) {
  const { stdout } = await runProcess("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    file,
  ]);

  const value = Number.parseFloat(stdout.trim());
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("ffprobe could not determine the video duration.");
  }

  return value;
}

export async function extractAudio(input, output) {
  await runProcess("ffmpeg", [
    "-y",
    "-v",
    "error",
    "-i",
    input,
    "-vn",
    "-ac",
    "1",
    "-ar",
    "16000",
    "-c:a",
    "pcm_s16le",
    output,
  ]);

  return output;
}
