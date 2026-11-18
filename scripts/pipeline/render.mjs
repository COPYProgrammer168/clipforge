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
    background,
    captionStyle,
    captionColors,
    language,
    words,
    captionTextFallback,
  } = options;

  const duration = Math.max(2, Math.round(durationSeconds));
  const cues = buildCues(words ?? [], startSeconds, startSeconds + duration, language);

  const srtName = `${baseName}.srt`;
  const assName = `${baseName}.ass`;
  const videoName = `${baseName}.mp4`;
  const thumbName = `${baseName}.jpg`;

  await writeFile(path.join(outDir, srtName), cuesToSrt(cues), "utf8");
  await writeFile(
    path.join(outDir, assName),
    cuesToAss(cues, {
      width,
      height,
      captionStyle,
      captionColors,
      language,
    }),
    "utf8"
  );

  const args = [
    "-y",
    "-v",
    "error",
    "-ss",
    String(startSeconds),
    "-t",
    String(duration),
    "-i",
    sourcePath,
  ];

  if (background === "blur") {
    const sigma = Math.max(16, Math.round(Math.min(width, height) / 20));
    const graph = [
      "[0:v]split=2[background][foreground]",
      `[background]scale=${width}:${height}:force_original_aspect_ratio=increase:flags=lanczos,crop=${width}:${height},gblur=sigma=${sigma}[blurred]`,
      `[foreground]scale=${width}:${height}:force_original_aspect_ratio=decrease:flags=lanczos,setsar=1[front]`,
      "[blurred][front]overlay=(W-w)/2:(H-h)/2,setsar=1[composed]",
    ];
    if (cues.length > 0) {
      graph.push(`[composed]ass=${assName}[vout]`);
    } else {
      graph.push("[composed]null[vout]");
    }
    args.push(
      "-filter_complex",
      graph.join(";"),
      "-map",
      "[vout]"
    );
  } else {
    const filters = [
      `scale=${width}:${height}:force_original_aspect_ratio=increase:flags=lanczos`,
      `crop=${width}:${height}`,
      "setsar=1",
    ];
    if (cues.length > 0) {
      filters.push(`ass=${assName}`);
    }
    args.push("-vf", filters.join(","), "-map", "0:v:0");
  }

  args.push(
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
    videoName
  );

  await runProcess("ffmpeg", args, { cwd: outDir });

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
