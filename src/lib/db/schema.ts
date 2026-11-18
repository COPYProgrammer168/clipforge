import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import type {
  AspectRatio,
  BackgroundMode,
  CaptionColors,
  CaptionStyle,
} from "@/lib/plans";

export type JobStatus =
  | "queued"
  | "processing"
  | "done"
  | "failed"
  | "canceled";

export type JobOptions = {
  clipCount: number;
  aspectRatio: AspectRatio;
  background?: BackgroundMode;
  captionStyle: CaptionStyle;
  captionColors?: CaptionColors;
  language: string;
};

const timestamp = (name: string) =>
  integer(name, { mode: "timestamp" }).default(sql`(unixepoch())`);

export const users = sqliteTable("user", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp" }),
  image: text("image"),
  plan: text("plan").notNull().default("free"),
  createdAt: timestamp("createdAt").notNull(),
});

export const videos = sqliteTable(
  "video",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    sourceType: text("sourceType").$type<"upload" | "url">().notNull(),
    sourceUrl: text("sourceUrl"),
    blobUrl: text("blobUrl"),
    durationSeconds: integer("durationSeconds"),
    sizeBytes: integer("sizeBytes"),
    createdAt: timestamp("createdAt").notNull(),
  },
  (video) => [index("video_user_idx").on(video.userId)]
);

export const jobs = sqliteTable(
  "job",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    videoId: text("videoId")
      .notNull()
      .references(() => videos.id, { onDelete: "cascade" }),
    status: text("status").$type<JobStatus>().notNull().default("queued"),
    stage: text("stage").notNull().default("queued"),
    progress: integer("progress").notNull().default(0),
    error: text("error"),
    attempts: integer("attempts").notNull().default(0),
    workerId: text("workerId"),
    lockedAt: integer("lockedAt", { mode: "timestamp" }),
    options: text("options", { mode: "json" }).$type<JobOptions>().notNull(),
    createdAt: timestamp("createdAt").notNull(),
    updatedAt: timestamp("updatedAt").notNull(),
  },
  (job) => [
    index("job_status_idx").on(job.status, job.createdAt),
    index("job_user_idx").on(job.userId, job.createdAt),
  ]
);

export const clips = sqliteTable(
  "clip",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    jobId: text("jobId")
      .notNull()
      .references(() => jobs.id, { onDelete: "cascade" }),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clipIndex: integer("clipIndex").notNull(),
    title: text("title").notNull(),
    startSeconds: integer("startSeconds").notNull(),
    endSeconds: integer("endSeconds").notNull(),
    score: integer("score").notNull().default(0),
    aspectRatio: text("aspectRatio").$type<AspectRatio>().notNull(),
    captionStyle: text("captionStyle").$type<CaptionStyle>().notNull(),
    blobUrl: text("blobUrl").notNull(),
    thumbnailUrl: text("thumbnailUrl"),
    srtUrl: text("srtUrl"),
    captionText: text("captionText"),
    createdAt: timestamp("createdAt").notNull(),
  },
  (clip) => [index("clip_job_idx").on(clip.jobId, clip.clipIndex)]
);

export const usageEvents = sqliteTable(
  "usage_event",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    jobId: text("jobId"),
    secondsProcessed: integer("secondsProcessed").notNull().default(0),
    createdAt: timestamp("createdAt").notNull(),
  },
  (usageEvent) => [
    index("usage_user_idx").on(usageEvent.userId, usageEvent.createdAt),
  ]
);
