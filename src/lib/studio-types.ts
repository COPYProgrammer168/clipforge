import type {
  AspectRatio,
  BackgroundMode,
  CaptionColors,
  CaptionSize,
  CaptionStyle,
  ClipTime,
} from "@/lib/plans";

export type JobStatus =
  | "queued"
  | "processing"
  | "done"
  | "failed"
  | "canceled";

export type StudioUsage = {
  used: number;
};

export type StudioOptions = {
  clipCount: number;
  aspectRatio: AspectRatio;
  clipTime?: ClipTime;
  background?: BackgroundMode;
  captionStyle: CaptionStyle;
  captionSize?: CaptionSize;
  captionColors?: CaptionColors;
  language: string;
};

export type StudioJob = {
  id: string;
  status: JobStatus;
  stage: string;
  progress: number;
  error: string | null;
  options: StudioOptions;
  createdAt: string;
  updatedAt: string;
  title: string;
  sourceType: "upload" | "url";
  sourceUrl: string | null;
  durationSeconds: number | null;
  blobUrl: string | null;
  clipCount: number;
};

export type StudioClip = {
  id: string;
  index: number;
  title: string;
  startSeconds: number;
  endSeconds: number;
  score: number;
  aspectRatio: AspectRatio;
  captionStyle: CaptionStyle;
  blobUrl: string;
  thumbnailUrl: string | null;
  srtUrl: string | null;
  captionText: string | null;
};

export type JobListResponse = {
  jobs: StudioJob[];
  usage: StudioUsage;
};

export type JobDetailResponse = {
  job: Omit<StudioJob, "clipCount">;
  source: {
    title: string;
    blobUrl: string | null;
    sourceUrl: string | null;
    durationSeconds: number | null;
  };
  clips: StudioClip[];
  usage: StudioUsage;
};
