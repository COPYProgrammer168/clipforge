import { writeFile } from "node:fs/promises";
import path from "node:path";
import { buildCues, cuesToAss, cuesToSrt } from "./captions.mjs";
import { runProcess } from "./media.mjs";

export function aspectSize(ratio) {
  if (ratio === "1:1") return { width: 1080, height: 1080 };
  if (ratio === "16:9") return { width: 1920, height: 1080 };
  return { width: 1080, height: 1920 };
}

export async function renderClip(options) {
  const {
    sourcePath,
    outDir,
    baseName,
    startSeconds,
    durationSeconds,
    width,
    height,
    captionStyle,
    language,
    words,
    captionTextFallback,
  } = options;

  const duration = Math.max(2, Math.round(durationSeconds));
  const cues = buildCues(words ?? [], startSeconds, startSeconds + duration);

  const srtName = `${baseName}.srt`;
  const assName = `${baseName}.ass`;
  const videoName = `${baseName}.mp4`;
  const thumbName = `${baseName}.jpg`;

  await writeFile(path.join(outDir, srtName), cuesToSrt(cues), "utf8");
  await writeFile(
    path.join(outDir, assName),
    cuesToAss(cues, { width, height, captionStyle, language }),
    "utf8"
  );

  const filters = [
    `scale=${width}:${height}:force_original_aspect_ratio=increase:flags=lanczos`,
    `crop=${width}:${height}`,
    "setsar=1",
  ];
  if (cues.length > 0) {
    filters.push(`ass=${assName}`);
  }

  await runProcess(
    "ffmpeg",
    [
      "-y",
      "-v",
      "error",
      "-ss",
      String(startSeconds),
      "-t",
      String(duration),
      "-i",
      sourcePath,
      "-vf",
      filters.join(","),
      "-map",
      "0:v:0",
      "-map",
      "0:a:0?",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "21",
      "-pix_fmt",
      "yuv420p",
      "-r",
      "30",
      "-c:a",
      "aac",
      "-b:a",
      "160k",
      "-movflags",
      "+faststart",
      videoName,
    ],
    { cwd: outDir }
  );

  await runProcess(
    "ffmpeg",
    [
      "-y",
      "-v",
      "error",
      "-ss",
      "1",
      "-i",
      videoName,
      "-frames:v",
      "1",
      "-vf",
      "scale=540:-2",
      "-q:v",
      "3",
      thumbName,
    ],
    { cwd: outDir }
  );

  const captionText =
    cues.length > 0
      ? cues.map((cue) => cue.text).join(" ").trim()
      : (captionTextFallback ?? "");

  return {
    videoFile: videoName,
    thumbnailFile: thumbName,
    srtFile: srtName,
    captionText,
  };
}
