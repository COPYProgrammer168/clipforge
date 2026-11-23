import { NextResponse } from "next/server";
import { count, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { clips, jobs, videos } from "@/lib/db/schema";
import { getUsage, serializeJob } from "@/lib/jobs";
import { isManagedUploadUrl } from "@/lib/storage";
import { getWorkspaceUserId } from "@/lib/workspace";
import {
  ASPECT_RATIOS,
  BACKGROUND_MODES,
  CAPTION_SIZES,
  CAPTION_STYLES,
  CLIP_TIMES,
  DEFAULT_CAPTION_COLORS,
  DEFAULT_CAPTION_SIZE,
  MAX_SOURCE_SECONDS,
} from "@/lib/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const hexColor = z
  .string()
  .regex(/^#[0-9a-f]{6}$/i, "Use a hex color like #c7ff3e.");

const captionColorsSchema = z
  .object({
    text: hexColor.default(DEFAULT_CAPTION_COLORS.text),
    highlight: hexColor.default(DEFAULT_CAPTION_COLORS.highlight),
  })
  .default(DEFAULT_CAPTION_COLORS);

const jobSchema = z
  .object({
    sourceType: z.enum(["upload", "url"]),
    sourceUrl: z.string().url().optional(),
    blobUrl: z.string().url().optional(),
    title: z.string().trim().min(1).max(160).optional(),
    sizeBytes: z.number().int().positive().optional(),
    options: z
      .object({
        clipCount: z.number().int().min(1).max(10).default(10),
        aspectRatio: z.enum(ASPECT_RATIOS).default("9:16"),
        clipTime: z.enum(CLIP_TIMES).default("auto"),
        background: z.enum(BACKGROUND_MODES).default("crop"),
        captionStyle: z.enum(CAPTION_STYLES).default("bold"),
        captionSize: z.enum(CAPTION_SIZES).default(DEFAULT_CAPTION_SIZE),
        captionColors: captionColorsSchema,
        language: z.enum(["en", "km"]).default("en"),
      })
      .default({
        clipCount: 10,
        aspectRatio: "9:16",
        clipTime: "auto",
        background: "crop",
        captionStyle: "bold",
        captionSize: DEFAULT_CAPTION_SIZE,
        captionColors: DEFAULT_CAPTION_COLORS,
        language: "en",
      }),
  })
  .superRefine((value, ctx) => {
    if (value.sourceType === "url" && !value.sourceUrl) {
      ctx.addIssue({
        code: "custom",
        message: "A source URL is required.",
        path: ["sourceUrl"],
      });
    }
    if (value.sourceType === "upload" && !value.blobUrl) {
      ctx.addIssue({
        code: "custom",
        message: "An uploaded video is required.",
        path: ["blobUrl"],
      });
    }
  });

function isSafeHttpUrl(value: string) {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return false;

    const host = url.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "0.0.0.0" ||
      host.endsWith(".local") ||
      /^127\./.test(host) ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^169\.254\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
      host === "[::1]"
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function GET() {
  const userId = await getWorkspaceUserId();

  const rows = await db
    .select({ job: jobs, video: videos })
    .from(jobs)
    .innerJoin(videos, eq(jobs.videoId, videos.id))
    .where(eq(jobs.userId, userId))
    .orderBy(desc(jobs.createdAt))
    .limit(50);

  const counts = await db
    .select({ jobId: clips.jobId, total: count(clips.id) })
    .from(clips)
    .where(eq(clips.userId, userId))
    .groupBy(clips.jobId);

  const countsByJob = new Map(counts.map((row) => [row.jobId, row.total]));
  const usage = await getUsage(userId);

  return NextResponse.json({
    jobs: rows.map(({ job, video }) => ({
      ...serializeJob(job, video),
      clipCount: countsByJob.get(job.id) ?? 0,
    })),
    usage,
  });
}

export async function POST(request: Request) {
  const userId = await getWorkspaceUserId();

  let parsed: z.infer<typeof jobSchema>;
  try {
    parsed = jobSchema.parse(await request.json());
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid request." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (parsed.sourceType === "url") {
    if (!parsed.sourceUrl || !isSafeHttpUrl(parsed.sourceUrl)) {
      return NextResponse.json(
        { error: "That link is not a supported public video URL." },
        { status: 400 }
      );
    }
  }

  if (parsed.sourceType === "upload") {
    if (!parsed.blobUrl || !isManagedUploadUrl(parsed.blobUrl, userId)) {
      return NextResponse.json(
        { error: "The uploaded file could not be verified." },
        { status: 400 }
      );
    }
  }

  const fallbackTitle =
    parsed.title ??
    (parsed.sourceType === "url"
      ? "Linked video"
      : "Uploaded video");

  const [video] = await db
    .insert(videos)
    .values({
      userId,
      title: fallbackTitle,
      sourceType: parsed.sourceType,
      sourceUrl: parsed.sourceUrl,
      blobUrl: parsed.blobUrl,
      sizeBytes: parsed.sizeBytes,
    })
    .returning();

  try {
    const [job] = await db
      .insert(jobs)
      .values({
        userId,
        videoId: video.id,
        options: {
          clipCount: parsed.options.clipCount,
          aspectRatio: parsed.options.aspectRatio,
          clipTime: parsed.options.clipTime,
          background: parsed.options.background,
          captionStyle: parsed.options.captionStyle,
          captionSize: parsed.options.captionSize,
          captionColors: parsed.options.captionColors,
          language: parsed.options.language,
        },
      })
      .returning();

    return NextResponse.json(
      {
        jobId: job.id,
        maxSourceSeconds: MAX_SOURCE_SECONDS,
      },
      { status: 201 }
    );
  } catch (error) {
    await db.delete(videos).where(eq(videos.id, video.id));
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not create the job.",
      },
      { status: 500 }
    );
  }
}
