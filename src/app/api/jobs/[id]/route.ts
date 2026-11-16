import { rm } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { jobs, videos } from "@/lib/db/schema";
import {
  getJobClips,
  getOwnedJob,
  serializeClip,
  serializeJob,
} from "@/lib/jobs";
import { getWorkspaceUserId } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getWorkspaceUserId();
  const { id } = await params;
  const owned = await getOwnedJob(userId, id);

  if (!owned) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  const clipRows = await getJobClips(userId, id);

  return NextResponse.json({
    job: serializeJob(owned.job, owned.video),
    source: {
      title: owned.video.title,
      blobUrl: owned.video.blobUrl,
      sourceUrl: owned.video.sourceUrl,
      durationSeconds: owned.video.durationSeconds,
    },
    clips: clipRows.map(serializeClip),
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getWorkspaceUserId();
  const { id } = await params;
  const owned = await getOwnedJob(userId, id);

  if (!owned) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  const clipRows = await getJobClips(userId, id);
  const urls = clipRows
    .flatMap((clip) => [clip.blobUrl, clip.thumbnailUrl, clip.srtUrl])
    .filter((url): url is string => Boolean(url));

  if (owned.video.blobUrl) {
    urls.push(owned.video.blobUrl);
  }

  try {
    if (urls.length > 0) {
      await del(urls);
    }
  } catch {
    // Blob cleanup is best effort; the database rows still get removed.
  }

  if (/^[0-9a-f-]{36}$/i.test(id)) {
    const clipsRoot = path.resolve(
      process.env.CLIPS_ROOT ?? path.join(process.cwd(), "public", "clips")
    );
    await rm(path.join(clipsRoot, id), {
      recursive: true,
      force: true,
    }).catch(() => {
      // Local cleanup is best effort too.
    });
  }

  await db
    .delete(jobs)
    .where(and(eq(jobs.id, id), eq(jobs.userId, userId)));

  const remainingJobs = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(eq(jobs.videoId, owned.video.id))
    .limit(1);

  if (remainingJobs.length === 0) {
    await db
      .delete(videos)
      .where(and(eq(videos.id, owned.video.id), eq(videos.userId, userId)));
  }

  return NextResponse.json({ ok: true });
}
