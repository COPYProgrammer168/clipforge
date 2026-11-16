"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Film,
  Infinity as InfinityIcon,
  Loader2,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LANGUAGES } from "@/lib/plans";
import type { JobDetailResponse, StudioClip } from "@/lib/studio-types";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  queued: "border-white/15 bg-white/[0.04] text-white/60",
  processing: "border-lime/30 bg-lime/[0.08] text-lime",
  done: "border-lime/25 bg-lime/[0.06] text-lime/90",
  failed: "border-red-400/30 bg-red-400/10 text-red-300",
  canceled: "border-white/10 bg-white/[0.02] text-white/35",
};

const statusLabels: Record<string, string> = {
  queued: "Queued",
  processing: "Processing",
  done: "Ready",
  failed: "Failed",
  canceled: "Canceled",
};

const pipeline = [
  { key: "source", label: "Source ready", detail: "Fetched and probed" },
  { key: "transcribing", label: "Transcribing audio", detail: "Word-level timing" },
  { key: "scoring", label: "Scoring highlights", detail: "Hooks, pacing, keywords" },
  { key: "rendering", label: "Rendering clips", detail: "Cuts, reframes, captions" },
  { key: "uploading", label: "Publishing exports", detail: "Blob storage + thumbnails" },
];

function activeStep(stage: string) {
  switch (stage) {
    case "queued":
      return -1;
    case "downloading":
    case "probing":
      return 0;
    case "transcribing":
      return 1;
    case "scoring":
      return 2;
    case "rendering":
      return 3;
    case "uploading":
      return 4;
    case "done":
      return 5;
    default:
      return -1;
  }
}

function useSmoothNumber(target: number, duration = 900) {
  const [value, setValue] = useState(target);
  const current = useRef(target);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const from = current.current;
    if (from === target) return;

    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (target - from) * eased;
      current.current = next;
      setValue(next);

      if (t < 1) {
        frame.current = requestAnimationFrame(tick);
      } else {
        current.current = target;
        setValue(target);
        frame.current = null;
      }
    };

    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [target, duration]);

  return value;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatRange(start: number, end: number) {
  const total = Math.max(0, Math.round(end - start));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function timecode(seconds: number) {
  const total = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(total / 60);
  return `${minutes}:${String(total % 60).padStart(2, "0")}`;
}

function frameClass(aspectRatio: string) {
  if (aspectRatio === "9:16") return "aspect-[9/16]";
  if (aspectRatio === "1:1") return "aspect-square";
  if (aspectRatio === "16:9") return "aspect-video";
  return "aspect-[4/5]";
}

function StatusPill({ status }: { status: string }) {
  const active = status === "queued" || status === "processing";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em]",
        statusStyles[status] ?? statusStyles.queued
      )}
    >
      {active ? (
        <Loader2 className="size-3 animate-spin" />
      ) : (
        <span className="size-1.5 rounded-full bg-current" />
      )}
      {statusLabels[status] ?? status}
    </span>
  );
}

function ClipCard({
  clip,
  onCopy,
}: {
  clip: StudioClip;
  onCopy: (clip: StudioClip) => void;
}) {
  return (
    <article className="panel-soft flex flex-col overflow-hidden">
      <div
        className={cn(
          "relative w-full bg-black",
          frameClass(clip.aspectRatio)
        )}
      >
        <video
          src={clip.blobUrl}
          poster={clip.thumbnailUrl ?? undefined}
          controls
          playsInline
          preload="metadata"
          className="h-full w-full object-contain"
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-3">
          <span className="rounded-full border border-white/15 bg-black/55 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-white/70 backdrop-blur">
            {String(clip.index + 1).padStart(2, "0")} · {clip.aspectRatio}
          </span>
          <span
            className={cn(
              "rounded-full border border-white/10 bg-black/55 px-2 py-0.5 font-mono text-[9px] tabular-nums backdrop-blur",
              clip.score >= 80 ? "text-lime" : "text-white/60"
            )}
          >
            {clip.score} score
          </span>
        </div>
        <span className="pointer-events-none absolute bottom-14 left-3 rounded-full border border-white/10 bg-black/55 px-2 py-0.5 font-mono text-[9px] tabular-nums text-white/60 backdrop-blur">
          {timecode(clip.startSeconds)} → {timecode(clip.endSeconds)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-sm font-medium leading-snug text-white/85">
            {clip.title}
          </h3>
          <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.12em] text-white/30">
            {formatRange(clip.startSeconds, clip.endSeconds)}
          </span>
        </div>
        {clip.captionText ? (
          <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-white/35">
            {clip.captionText}
          </p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
          <a
            href={clip.blobUrl}
            download
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-lime/25 bg-lime/[0.08] px-2.5 text-xs font-medium text-lime transition-colors hover:bg-lime/[0.14]"
          >
            <Download className="size-3.5" />
            Download
          </a>
          {clip.srtUrl ? (
            <a
              href={clip.srtUrl}
              download
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 text-xs text-white/55 transition-colors hover:border-white/20 hover:text-white"
            >
              <FileText className="size-3.5" />
              SRT
            </a>
          ) : null}
          <button
            type="button"
            onClick={() => onCopy(clip)}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 text-xs text-white/55 transition-colors hover:border-white/20 hover:text-white"
          >
            <Copy className="size-3.5" />
            Caption
          </button>
        </div>
      </div>
    </article>
  );
}

function JobSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-9 w-40 animate-pulse rounded-lg bg-white/[0.04]" />
      <div className="h-24 animate-pulse rounded-2xl bg-white/[0.03]" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="aspect-[4/5] animate-pulse rounded-2xl bg-white/[0.03]"
          />
        ))}
      </div>
    </div>
  );
}

export function JobDetail({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [data, setData] = useState<JobDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });

      if (response.status === 404) {
        setError("This job does not exist or was deleted.");
        return;
      }

      const payload = (await response.json()) as JobDetailResponse & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Could not load this job.");
      }

      setData(payload);
      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load this job."
      );
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    void load();
  }, [load]);

  const status = data?.job.status;
  const displayProgress = useSmoothNumber(data?.job.progress ?? 0);
  const polling =
    !error &&
    (!data || status === "queued" || status === "processing");

  useEffect(() => {
    if (!polling) return;
    const interval = window.setInterval(() => {
      void load();
    }, 4000);
    return () => window.clearInterval(interval);
  }, [polling, load]);

  async function handleDelete() {
    if (
      !window.confirm(
        "Delete this job and every rendered clip? This cannot be undone."
      )
    ) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error ?? "Could not delete the job.");
      }
      toast.success("Job deleted.");
      router.push("/studio");
      router.refresh();
    } catch (deleteError) {
      toast.error(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete the job."
      );
    } finally {
      setDeleting(false);
    }
  }

  async function copyCaption(clip: StudioClip) {
    try {
      await navigator.clipboard.writeText(
        clip.captionText ?? clip.title
      );
      toast.success("Caption copied.");
    } catch {
      toast.error("Clipboard access was blocked.");
    }
  }

  if (loading) {
    return <JobSkeleton />;
  }

  if (error || !data) {
    return (
      <div className="panel-soft mx-auto flex max-w-lg flex-col items-center px-6 py-16 text-center">
        <AlertTriangle className="size-8 text-amber-200/70" />
        <h1 className="display mt-5 text-xl">This job could not open.</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/40">
          {error ?? "The job may have been deleted."}
        </p>
        <div className="mt-6 flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-9 border-white/12"
            onClick={() => {
              setError(null);
              setLoading(true);
              void load();
            }}
          >
            Try again
          </Button>
          <Button
            type="button"
            className="h-9 bg-lime text-[#0b0f03] hover:bg-lime-soft"
            onClick={() => router.push("/studio")}
          >
            Back to studio
          </Button>
        </div>
      </div>
    );
  }

  const { job, clips, source } = data;
  const step = activeStep(job.stage);
  const languageLabel =
    LANGUAGES.find((option) => option.value === job.options.language)?.label ??
    job.options.language;
  const isProcessing = job.status === "queued" || job.status === "processing";

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/studio"
          className="inline-flex items-center gap-1.5 text-xs text-white/40 transition-colors hover:text-white"
        >
          <ArrowLeft className="size-3.5" />
          Studio
        </Link>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <StatusPill status={job.status} />
              {isProcessing ? (
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/25">
                  {Math.round(displayProgress)}% · updates every few seconds
                </span>
              ) : null}
            </div>
            <h1 className="display mt-3 max-w-2xl break-words text-balance text-2xl sm:text-3xl">
              {job.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-white/35">
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="size-3" />
                {formatDate(job.createdAt)}
              </span>
              <span>
                {job.options.clipCount} clips · {job.options.aspectRatio} ·{" "}
                {job.options.captionStyle} captions
              </span>
              <span>{languageLabel}</span>
              {job.sourceType === "url" && source.sourceUrl ? (
                <a
                  href={source.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-white/40 transition-colors hover:text-white"
                >
                  <ExternalLink className="size-3" />
                  Source link
                </a>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden h-9 items-center gap-1.5 rounded-lg border border-lime/20 bg-lime/[0.04] px-3 font-mono text-[10px] uppercase tracking-[0.12em] text-lime/70 sm:inline-flex">
              <InfinityIcon className="size-3" />
              Unlimited
            </span>
            <Button
              type="button"
              variant="destructive"
              className="h-9 gap-1.5 border border-red-400/20"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
              Delete
            </Button>
          </div>
        </div>
      </div>

      {job.status === "failed" ? (
        <div className="rounded-2xl border border-red-400/25 bg-red-400/[0.06] p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-300" />
            <div>
              <p className="font-display text-sm font-medium text-red-200/90">
                Processing stopped
              </p>
              <p className="mt-1 text-xs leading-relaxed text-white/45">
                {job.error ??
                  "The worker could not finish this job. Try a shorter source or a different link."}
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-4 h-8 border-white/12"
                onClick={() => router.push("/studio?upload=1")}
              >
                Start another job
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isProcessing || job.status === "failed" ? (
        <section className="panel p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-lime/80" />
              <h2 className="font-display text-sm font-medium text-white/80">
                Pipeline
              </h2>
            </div>
            <span className="font-mono text-[10px] tabular-nums text-white/30">
              {Math.round(displayProgress)}%
            </span>
          </div>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
            <div
              className="relative h-full rounded-full bg-lime shadow-[0_0_12px_rgba(199,255,62,0.35)]"
              style={{ width: `${Math.max(2, displayProgress)}%` }}
            >
              {isProcessing ? (
                <span className="absolute inset-y-0 right-0 w-6 rounded-full bg-gradient-to-r from-transparent to-white/40" />
              ) : null}
            </div>
          </div>

          <ol className="mt-6">
            {pipeline.map((stepItem, index) => {
              const complete = job.status === "done" || step > index;
              const current =
                job.status !== "done" &&
                step === index &&
                job.status !== "failed";
              const failedHere = job.status === "failed" && step === index;
              const connectorLit = complete || current;

              return (
                <li key={stepItem.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "flex size-6 shrink-0 items-center justify-center rounded-full border text-[10px] transition-colors duration-500",
                        complete
                          ? "border-lime/40 bg-lime/10 text-lime"
                          : current
                            ? "border-lime/50 bg-lime/[0.08] text-lime shadow-[0_0_0_4px_rgba(199,255,62,0.05)]"
                            : failedHere
                              ? "border-red-400/40 bg-red-400/10 text-red-300"
                              : "border-white/10 text-white/25"
                      )}
                    >
                      {complete ? (
                        <Check className="size-3 animate-in fade-in zoom-in-50 duration-300" />
                      ) : current ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : failedHere ? (
                        <AlertTriangle className="size-3" />
                      ) : (
                        index + 1
                      )}
                    </span>
                    {index < pipeline.length - 1 ? (
                      <span
                        className={cn(
                          "mt-1.5 w-px flex-1 rounded-full transition-colors duration-700",
                          connectorLit ? "bg-lime/30" : "bg-white/10"
                        )}
                      />
                    ) : null}
                  </div>
                  <div
                    className={cn(
                      "min-w-0",
                      index < pipeline.length - 1 && "pb-4"
                    )}
                  >
                    <p
                      className={cn(
                        "text-sm transition-colors duration-300",
                        complete || current
                          ? "text-white/80"
                          : "text-white/35"
                      )}
                    >
                      {stepItem.label}
                    </p>
                    <p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-white/25">
                      {stepItem.detail}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      {job.status === "done" ? (
        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-medium text-white/85">
                {clips.length} clips ready
              </h2>
              <p className="mt-1 text-xs text-white/35">
                Every export is rendered at {job.options.aspectRatio} with burned
                captions. Download the MP4 or the SRT.
              </p>
            </div>
            <span className="hidden items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-lime/60 sm:inline-flex">
              <span className="size-1.5 rounded-full bg-lime" />
              Final
            </span>
          </div>

          {clips.length === 0 ? (
            <div className="panel-soft flex flex-col items-center px-6 py-14 text-center">
              <Film className="size-8 text-white/20" />
              <p className="mt-4 font-display text-sm text-white/70">
                No clips survived the cut.
              </p>
              <p className="mt-1.5 max-w-md text-xs leading-relaxed text-white/35">
                The source may be too short or too quiet for highlight scoring.
                Try a longer recording with clear speech.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {clips.map((clip) => (
                <ClipCard key={clip.id} clip={clip} onCopy={copyCaption} />
              ))}
            </div>
          )}
        </section>
      ) : null}

      <div className="panel-soft flex flex-col gap-3 p-4 text-[11px] text-white/35 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Source: {source.title}
          {source.durationSeconds
            ? ` · ${timecode(source.durationSeconds)} duration`
            : ""}
        </span>
        <span className="font-mono uppercase tracking-[0.12em]">
          Job {job.id.slice(0, 8)}
        </span>
      </div>
    </div>
  );
}


