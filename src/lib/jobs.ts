import { and, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { clips, jobs, usageEvents, videos } from "@/lib/db/schema";

export type JobRow = typeof jobs.$inferSelect;
export type VideoRow = typeof videos.$inferSelect;
export type ClipRow = typeof clips.$inferSelect;

export function startOfMonth() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function getUsage(userId: string) {
  const usage = await db
    .select({ seconds: usageEvents.secondsProcessed })
    .from(usageEvents)
    .where(
      and(
        eq(usageEvents.userId, userId),
        gte(usageEvents.createdAt, startOfMonth())
      )
    );

  const used = usage.reduce((total, row) => total + (row.seconds ?? 0), 0);

  return { used };
}

export async function getOwnedJob(userId: string, jobId: string) {
  const rows = await db
    .select({ job: jobs, video: videos })
    .from(jobs)
    .innerJoin(videos, eq(jobs.videoId, videos.id))
    .where(and(eq(jobs.id, jobId), eq(jobs.userId, userId)))
    .limit(1);

  return rows[0] ?? null;
}

export async function getJobClips(userId: string, jobId: string) {
  return db
    .select()
    .from(clips)
    .where(and(eq(clips.jobId, jobId), eq(clips.userId, userId)))
    .orderBy(clips.clipIndex);
}

export function serializeJob(job: JobRow, video: VideoRow) {
  return {
    id: job.id,
    status: job.status,
    stage: job.stage,
    progress: job.progress,
    error: job.error,
    options: job.options,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    title: video.title,
    sourceType: video.sourceType,
    sourceUrl: video.sourceUrl,
    durationSeconds: video.durationSeconds,
    blobUrl: video.blobUrl,
  };
}

export function serializeClip(clip: ClipRow) {
  return {
    id: clip.id,
    index: clip.clipIndex,
    title: clip.title,
    startSeconds: clip.startSeconds,
    endSeconds: clip.endSeconds,
    score: clip.score,
    aspectRatio: clip.aspectRatio,
    captionStyle: clip.captionStyle,
    blobUrl: clip.blobUrl,
    thumbnailUrl: clip.thumbnailUrl,
    srtUrl: clip.srtUrl,
    captionText: clip.captionText,
  };
}

export function formatDuration(seconds?: number | null) {
  if (!seconds || seconds <= 0) return "—";
  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

export function formatClipRange(start: number, end: number) {
  const total = Math.max(0, Math.round(end - start));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}
