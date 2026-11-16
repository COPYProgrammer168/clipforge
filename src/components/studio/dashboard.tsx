"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Clapperboard,
  Clock3,
  Film,
  Infinity as InfinityIcon,
  Link2,
  Loader2,
  Plus,
  RefreshCw,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewClipDialog } from "@/components/studio/new-clip-dialog";
import type { JobListResponse, StudioJob } from "@/lib/studio-types";
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatMinutes(seconds: number) {
  return Math.round(seconds / 60);
}

function formatDuration(seconds?: number | null) {
  if (!seconds || seconds <= 0) return "—";
  const total = Math.round(seconds);
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

function StatCard({
  label,
  value,
  detail,
  children,
}: {
  label: string;
  value: string;
  detail: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="panel-soft relative overflow-hidden p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>
      <p className="display mt-3 text-3xl leading-none">{value}</p>
      <p className="mt-2 text-[11px] text-white/35">{detail}</p>
      {children}
    </div>
  );
}

function JobRow({ job }: { job: StudioJob }) {
  const active = job.status === "queued" || job.status === "processing";

  return (
    <Link
      href={`/studio/jobs/${job.id}`}
      className="group flex flex-col gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.015] p-4 transition-colors hover:border-white/[0.12] hover:bg-white/[0.035] sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex min-w-0 items-start gap-3.5">
        <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-white/45">
          {job.sourceType === "url" ? (
            <Link2 className="size-4" />
          ) : (
            <Upload className="size-4" />
          )}
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="max-w-[420px] truncate font-display text-sm font-medium text-white/85">
              {job.title}
            </p>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em]",
                statusStyles[job.status] ?? statusStyles.queued
              )}
            >
              {active ? (
                <Loader2 className="size-2.5 animate-spin" />
              ) : (
                <span className="size-1.5 rounded-full bg-current" />
              )}
              {statusLabels[job.status] ?? job.status}
              {job.status === "processing" ? ` ${job.progress}%` : ""}
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.08em] text-white/30">
            <span>{formatDate(job.createdAt)}</span>
            <span className="hidden size-0.5 rounded-full bg-white/20 sm:block" />
            <span>{formatDuration(job.durationSeconds)} source</span>
            <span className="hidden size-0.5 rounded-full bg-white/20 sm:block" />
            <span>
              {job.options.clipCount} × {job.options.aspectRatio}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 pl-[54px] sm:justify-end sm:pl-0">
        <div className="text-left sm:text-right">
          <p className="font-display text-sm tabular-nums text-white/75">
            {job.status === "done" ? `${job.clipCount} clips` : `${job.progress}%`}
          </p>
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/25">
            {job.status === "done" ? "Exported" : job.stage}
          </p>
        </div>
        <ArrowUpRight className="size-4 text-white/20 transition-colors group-hover:text-lime" />
      </div>
    </Link>
  );
}

function JobsSkeleton() {
  return (
    <div className="space-y-2.5">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="h-[84px] animate-pulse rounded-2xl border border-white/[0.05] bg-white/[0.02]"
          style={{ animationDelay: `${index * 120}ms` }}
        />
      ))}
    </div>
  );
}

export function StudioDashboard({
  initialLink,
  autoOpenUpload,
}: {
  initialLink?: string;
  autoOpenUpload?: boolean;
}) {
  const [data, setData] = useState<JobListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{
    tab: "upload" | "link";
    link?: string;
  } | null>(
    initialLink
      ? { tab: "link", link: initialLink }
      : autoOpenUpload
        ? { tab: "upload" }
        : null
  );

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setRefreshing(true);
      try {
        const response = await fetch("/api/jobs", { cache: "no-store" });
        const payload = (await response.json()) as JobListResponse & {
          error?: string;
        };
        if (!response.ok) {
          throw new Error(payload.error ?? "Could not load your jobs.");
        }
        setData(payload);
        setError(null);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load your jobs. Check the database connection."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void load(true);
    }, 6000);
    return () => window.clearInterval(interval);
  }, [load]);

  const usage = data?.usage;
  const jobs = data?.jobs ?? [];

  const activeJobs = jobs.filter(
    (job) => job.status === "queued" || job.status === "processing"
  );
  const clipsReady = jobs.reduce(
    (total, job) => total + (job.status === "done" ? job.clipCount : 0),
    0
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow-lime">Studio</p>
          <h1 className="display mt-3 text-3xl sm:text-[2.4rem]">
            Your clip queue.
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/45">
            No account, no processing cap. Upload a long recording or paste a
            link and the worker handles the rest.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-10 gap-2 border-white/12 bg-white/[0.02] text-white/65"
            onClick={() => void load()}
            disabled={refreshing}
            aria-label="Refresh jobs"
          >
            <RefreshCw
              className={cn("size-4", refreshing && "animate-spin")}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button
            type="button"
            className="h-10 gap-2 bg-lime px-4 text-[#0b0f03] hover:bg-lime-soft"
            onClick={() => setDialog({ tab: "upload" })}
          >
            <Plus className="size-4" />
            New clip
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Processing minutes"
          value="Unlimited"
          detail={
            usage
              ? `${formatMinutes(usage.used)} processed this month · no cap`
              : "Loading usage"
          }
        >
          <div className="mt-4 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-white/25">
            <InfinityIcon className="size-3 text-lime/60" />
            No monthly limit
          </div>
        </StatCard>

        <StatCard
          label="Jobs in flight"
          value={loading ? "—" : String(activeJobs.length)}
          detail={
            activeJobs.length > 0
              ? activeJobs.map((job) => `${job.progress}%`).join(" · ")
              : "Nothing rendering right now"
          }
        >
          <div className="mt-4 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-white/25">
            <span
              className={cn(
                "size-1.5 rounded-full",
                activeJobs.length > 0
                  ? "animate-pulse-dot bg-lime"
                  : "bg-white/20"
              )}
            />
            {activeJobs.length > 0 ? "Worker active" : "Queue idle"}
          </div>
        </StatCard>

        <StatCard
          label="Clips exported"
          value={loading ? "—" : String(clipsReady)}
          detail={`Across ${jobs.filter((job) => job.status === "done").length} finished jobs`}
        >
          <div className="mt-4 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-white/25">
            <Clapperboard className="size-3 text-lime/60" />
            Ready to download
          </div>
        </StatCard>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-medium text-white/85">
            Recent jobs
          </h2>
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/25">
            {jobs.length} total
          </span>
        </div>

        {loading ? (
          <JobsSkeleton />
        ) : error ? (
          <div className="panel-soft flex flex-col items-center gap-4 px-6 py-12 text-center">
            <Film className="size-8 text-white/20" />
            <div>
              <p className="font-display text-sm font-medium text-white/75">
                Your jobs could not load.
              </p>
              <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-white/40">
                {error}
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-9 border-white/12"
              onClick={() => void load()}
            >
              Try again
            </Button>
          </div>
        ) : jobs.length === 0 ? (
          <div className="panel-soft flex flex-col items-center px-6 py-16 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl border border-lime/20 bg-lime/[0.06] text-lime">
              <Film className="size-6" />
            </span>
            <h3 className="display mt-5 text-xl">No source videos yet.</h3>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/40">
              Drop in a podcast, stream or interview and ClipForge will surface
              the moments worth posting.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button
                type="button"
                className="h-10 gap-2 bg-lime text-[#0b0f03] hover:bg-lime-soft"
                onClick={() => setDialog({ tab: "upload" })}
              >
                <Upload className="size-4" />
                Upload a video
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10 gap-2 border-white/12 bg-white/[0.02]"
                onClick={() => setDialog({ tab: "link" })}
              >
                <Link2 className="size-4" />
                Paste a link
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {jobs.map((job) => (
              <JobRow key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>

      {data === null && !loading && !error ? (
        <div className="flex items-center gap-2 text-xs text-white/30">
          <Clock3 className="size-3.5" />
          Waiting for the worker…
        </div>
      ) : null}

      <NewClipDialog
        key={`${dialog?.tab ?? "closed"}-${dialog?.link ?? ""}`}
        open={dialog !== null}
        defaultTab={dialog?.tab ?? "upload"}
        initialLink={dialog?.link}
        onOpenChange={(open) => {
          if (!open) setDialog(null);
        }}
      />
    </div>
  );
}
