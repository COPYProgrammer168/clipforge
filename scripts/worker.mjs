import { randomUUID } from "node:crypto";
import os from "node:os";
import path from "node:path";
import { mkdir, rm } from "node:fs/promises";
import { createClient } from "@libsql/client";
import {
  downloadVideo,
  extractAudio,
  fetchToFile,
  probeDuration,
} from "./pipeline/media.mjs";
import { transcribe } from "./pipeline/transcribe.mjs";
import { planClips, transcriptUsable } from "./pipeline/score.mjs";
import { aspectSize, renderClip } from "./pipeline/render.mjs";
import {
  deleteJobBlobs,
  publishClipArtifacts,
  usesBlobStorage,
} from "./pipeline/storage.mjs";

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

const DATABASE_URL = process.env.DATABASE_URL ?? "file:./clipforge.db";
const WHISPER_MODEL = process.env.WHISPER_MODEL ?? "base";
const POLL_MS = Number(process.env.POLL_SECONDS ?? 3) * 1000;
const MAX_SOURCE_SECONDS = 2 * 60 * 60;
const STALE_LOCK_SECONDS = 30 * 60;
const ONCE = process.argv.includes("--once");
const workerId = `worker-${os.hostname()}-${process.pid}`;

const root = process.cwd();
const workRoot = path.resolve(
  root,
  process.env.WORK_ROOT ?? path.join(".work", "jobs")
);
const outRoot = path.resolve(
  root,
  process.env.CLIPS_ROOT ?? path.join("public", "clips")
);
const clipLimits = {
  minSeconds: Number(process.env.MIN_CLIP_SECONDS ?? 16),
  maxSeconds: Number(process.env.MAX_CLIP_SECONDS ?? 52),
  targetSeconds: Number(process.env.TARGET_CLIP_SECONDS ?? 30),
};

const db = createClient({
  url: DATABASE_URL,
  ...(process.env.DATABASE_AUTH_TOKEN
    ? { authToken: process.env.DATABASE_AUTH_TOKEN }
    : {}),
});

await db.execute("PRAGMA busy_timeout = 5000");
try {
  await db.execute("PRAGMA journal_mode = WAL");
} catch {
  // Another connection may hold the file; the default journal still works.
}

let stopping = false;
let activeJob = null;
const progressState = new Map();

function log(message) {
  console.log(`[worker] ${new Date().toISOString()} ${message}`);
}

async function setStage(jobId, stage, progress) {
  const previous = progressState.get(jobId);
  if (previous && progress <= previous.progress && stage === previous.stage) {
    return;
  }
  if (
    previous &&
    previous.stage === stage &&
    progress - previous.progress < 2 &&
    Date.now() - previous.at < 1500
  ) {
    return;
  }
  progressState.set(jobId, { stage, progress, at: Date.now() });
  await db.execute({
    sql: "UPDATE job SET stage = ?, progress = ?, updatedAt = unixepoch() WHERE id = ?",
    args: [stage, Math.max(0, Math.min(99, Math.round(progress))), jobId],
  });
}

async function requeueStaleJobs() {
  await db.execute({
    sql: `UPDATE job
          SET status = CASE WHEN attempts >= 3 THEN 'failed' ELSE 'queued' END,
              stage = CASE WHEN attempts >= 3 THEN 'failed' ELSE 'queued' END,
              error = CASE WHEN attempts >= 3 THEN COALESCE(error, 'Worker stopped before finishing.') ELSE error END,
              workerId = NULL,
              lockedAt = NULL,
              updatedAt = unixepoch()
          WHERE status = 'processing'
            AND (lockedAt IS NULL OR lockedAt < unixepoch() - ?)`,
    args: [STALE_LOCK_SECONDS],
  });
}

async function claimNextJob() {
  const queued = await db.execute(
    "SELECT id FROM job WHERE status = 'queued' ORDER BY createdAt ASC LIMIT 1"
  );
  if (queued.rows.length === 0) return null;

  const id = String(queued.rows[0].id);
  const claimed = await db.execute({
    sql: `UPDATE job
          SET status = 'processing', stage = 'starting', progress = 1,
              workerId = ?, lockedAt = unixepoch(), attempts = attempts + 1,
              updatedAt = unixepoch()
          WHERE id = ? AND status = 'queued'
          RETURNING id`,
    args: [workerId, id],
  });

  return claimed.rows.length > 0 ? id : null;
}

async function loadJob(jobId) {
  const result = await db.execute({
    sql: `SELECT j.id AS jobId, j.userId, j.videoId, j.options,
                 v.title, v.sourceType, v.sourceUrl, v.blobUrl, v.durationSeconds
          FROM job j
          JOIN video v ON v.id = j.videoId
          WHERE j.id = ?`,
    args: [jobId],
  });
  if (result.rows.length === 0) {
    throw new Error("The queued job no longer exists.");
  }
  return result.rows[0];
}

async function insertClip(jobId, userId, index, clip, options) {
  const id = randomUUID();
  await db.execute({
    sql: `INSERT INTO clip
            (id, jobId, userId, clipIndex, title, startSeconds, endSeconds,
             score, aspectRatio, captionStyle, blobUrl, thumbnailUrl, srtUrl, captionText)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      jobId,
      userId,
      index,
      clip.title,
      clip.start,
      clip.end,
      clip.score,
      options.aspectRatio,
      options.captionStyle,
      clip.blobUrl,
      clip.thumbnailUrl,
      clip.srtUrl,
      clip.captionText,
    ],
  });
}

function genericTitle(title) {
  return (
    !title ||
    title === "Linked video" ||
    title === "Uploaded video" ||
    /^[A-Za-z0-9_-]{11}$/.test(title)
  );
}

function resolveBackground(mode, jobId, clipNumber) {
  const value = mode ?? "crop";
  if (value !== "random") return value;

  let hash = 2166136261;
  for (const character of `${jobId}:${clipNumber}`) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 2 === 0 ? "blur" : "crop";
}

async function processJob(jobId) {
  const job = await loadJob(jobId);
  const options = JSON.parse(String(job.options));
  const workDir = path.join(workRoot, jobId);
  const outDir = path.join(outRoot, jobId);

  await mkdir(workDir, { recursive: true });
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  try {
    await setStage(jobId, "downloading", 3);

    let sourcePath;
    if (job.sourceType === "url") {
      const downloaded = await downloadVideo(
        String(job.sourceUrl ?? ""),
        workDir,
        (fraction) => {
          void setStage(jobId, "downloading", 3 + fraction * 22);
        }
      );
      sourcePath = downloaded.file;

      if (downloaded.title && genericTitle(String(job.title))) {
        await db.execute({
          sql: "UPDATE video SET title = ? WHERE id = ?",
          args: [downloaded.title, job.videoId],
        });
      }
    } else {
      sourcePath = await fetchToFile(
        String(job.blobUrl ?? ""),
        path.join(workDir, "source.upload")
      );
      await setStage(jobId, "downloading", 25);
    }

    await setStage(jobId, "probing", 27);
    const duration = await probeDuration(sourcePath);
    if (duration > MAX_SOURCE_SECONDS + 1) {
      throw new Error(
        `Source is ${Math.round(duration)} seconds long; the limit is ${MAX_SOURCE_SECONDS} seconds.`
      );
    }

    await db.execute({
      sql: "UPDATE video SET durationSeconds = ? WHERE id = ?",
      args: [Math.round(duration), job.videoId],
    });

    await setStage(jobId, "extracting", 30);
    const audioPath = path.join(workDir, "audio.wav");
    await extractAudio(sourcePath, audioPath);

    await setStage(jobId, "transcribing", 34);
    let transcript = { language: null, words: [] };
    try {
      transcript = await transcribe(audioPath, workDir, {
        model: WHISPER_MODEL,
        language: options.language,
        duration,
        onProgress: (fraction) => {
          void setStage(jobId, "transcribing", 34 + fraction * 28);
        },
      });
      log(
        `transcribed ${jobId}: ${transcript.words.length} words (${transcript.language ?? "unknown"})`
      );
      if (!transcriptUsable(transcript.words, duration)) {
        log(
          `transcript for ${jobId} looks unreliable (music or noise); using evenly spaced highlights`
        );
        transcript.words = [];
      }
    } catch (error) {
      log(
        `transcription failed for ${jobId}; falling back to evenly spaced clips: ${error.message}`
      );
    }

    await setStage(jobId, "scoring", 64);
    const plan = planClips(
      transcript.words,
      duration,
      Number(options.clipCount) || 10,
      clipLimits
    );
    if (plan.length === 0) {
      throw new Error("Could not find any usable clip windows in the source.");
    }

    const { width, height } = aspectSize(options.aspectRatio);
    await setStage(jobId, "rendering", 70);

    const renderedClips = [];
    for (let index = 0; index < plan.length; index += 1) {
      const item = plan[index];
      const baseName = `clip-${String(index + 1).padStart(2, "0")}`;
      const rendered = await renderClip({
        sourcePath,
        outDir,
        baseName,
        startSeconds: item.start,
        durationSeconds: item.end - item.start,
        width,
        height,
        background: resolveBackground(options.background, jobId, index + 1),
        captionStyle: options.captionStyle,
        captionColors: options.captionColors,
        language:
          options.language && options.language !== "auto"
            ? options.language
            : transcript.language,
        words: transcript.words,
        captionTextFallback: item.title,
      });

      renderedClips.push({ item, rendered });

      await setStage(
        jobId,
        "rendering",
        70 + ((index + 1) / plan.length) * 22
      );
    }

    const publishToBlob = usesBlobStorage();
    if (publishToBlob) {
      await setStage(jobId, "uploading", 93);
    }

    for (let index = 0; index < renderedClips.length; index += 1) {
      const { item, rendered } = renderedClips[index];
      const urls = await publishClipArtifacts({ jobId, outDir, rendered });

      await insertClip(
        jobId,
        job.userId,
        index + 1,
        { ...item, ...rendered, ...urls },
        options
      );

      if (publishToBlob) {
        await setStage(
          jobId,
          "uploading",
          93 + ((index + 1) / renderedClips.length) * 6
        );
      }
    }

    await db.execute({
      sql: "INSERT INTO usage_event (id, userId, jobId, secondsProcessed) VALUES (?, ?, ?, ?)",
      args: [randomUUID(), job.userId, jobId, Math.round(duration)],
    });

    await db.execute({
      sql: `UPDATE job
            SET status = 'done', stage = 'done', progress = 100, error = NULL,
                workerId = ?, lockedAt = NULL, updatedAt = unixepoch()
            WHERE id = ?`,
      args: [workerId, jobId],
    });

    progressState.delete(jobId);
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
    if (publishToBlob) {
      await rm(outDir, { recursive: true, force: true }).catch(() => {});
    }
    log(`done ${jobId} with ${plan.length} clips`);
  } catch (error) {
    const message = String(error?.message ?? error).slice(0, 800);
    await db.execute({
      sql: `UPDATE job
            SET status = 'failed', stage = 'failed', error = ?,
                workerId = ?, lockedAt = NULL, updatedAt = unixepoch()
            WHERE id = ?`,
      args: [message, workerId, jobId],
    });
    progressState.delete(jobId);
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
    await deleteJobBlobs(jobId).catch(() => {});
    log(`failed ${jobId}: ${message}`);
  }
}

async function loop() {
  log(`started ${workerId} (model ${WHISPER_MODEL}, db ${DATABASE_URL})`);
  await mkdir(workRoot, { recursive: true }).catch(() => {});
  await mkdir(outRoot, { recursive: true }).catch(() => {});
  await requeueStaleJobs().catch((error) => {
    log(`could not requeue stale jobs: ${error.message}`);
  });

  while (!stopping) {
    let jobId = null;
    try {
      jobId = await claimNextJob();
    } catch (error) {
      log(`claim failed: ${error.message}`);
    }

    if (!jobId) {
      if (ONCE) break;
      await new Promise((resolve) => setTimeout(resolve, POLL_MS));
      continue;
    }

    activeJob = jobId;
    log(`claim ${jobId}`);
    try {
      await processJob(jobId);
    } catch (error) {
      log(`unhandled error for ${jobId}: ${error.message}`);
    } finally {
      activeJob = null;
    }

    if (ONCE) break;
  }

  log("stopped");
  db.close();
  process.exit(0);
}

function shutdown(signal) {
  if (stopping) return;
  stopping = true;
  log(`received ${signal}; finishing current job before exit`);
  if (!activeJob) {
    db.close();
    process.exit(0);
  }
  const timer = setInterval(() => {
    if (!activeJob) {
      clearInterval(timer);
      db.close();
      process.exit(0);
    }
  }, 500);
  timer.unref?.();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

loop().catch((error) => {
  log(`fatal: ${error.stack ?? error.message}`);
  process.exit(1);
});
