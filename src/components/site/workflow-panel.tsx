import {
  AudioLines,
  Check,
  Film,
  Loader2,
  Sparkles,
  UploadCloud,
} from "lucide-react";

const queue = [
  {
    title: "mayamakes_ep42.mp4",
    meta: "14:08 · source",
    status: "Rendering 3/10",
    progress: 72,
    active: true,
  },
  {
    title: "founder_interview.mov",
    meta: "38:20 · source",
    status: "Transcribing",
    progress: 34,
    active: false,
  },
  {
    title: "team_standup.webm",
    meta: "06:12 · source",
    status: "Ready · 10 clips",
    progress: 100,
    active: false,
    done: true,
  },
];

const stages = [
  { icon: UploadCloud, label: "Ingest", detail: "upload or link", time: "0:12" },
  { icon: AudioLines, label: "Transcribe", detail: "word-level timing", time: "1:08" },
  { icon: Sparkles, label: "Score", detail: "10 best windows", time: "0:04" },
  { icon: Film, label: "Render", detail: "3 ratios + captions", time: "0:41" },
];

export function WorkflowPanel() {
  return (
    <div className="panel overflow-hidden">
      <div className="flex h-11 items-center justify-between border-b border-white/[0.08] px-4">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">
          <span className="size-1.5 rounded-full bg-lime" />
          forge.pipeline
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-white/35">
            <Loader2 className="size-2.5 animate-spin" />
            live
          </span>
          <span className="hidden rounded-full border border-white/10 px-2 py-0.5 font-mono text-[9px] text-white/30 sm:inline">
            worker-01
          </span>
        </div>
      </div>

      <div className="grid gap-0 md:grid-cols-[1.15fr_0.85fr]">
        <div className="border-b border-white/[0.07] p-4 md:border-b-0 md:border-r">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">
              Queue
            </p>
            <span className="font-mono text-[9px] text-white/25">3 jobs</span>
          </div>
          <div className="mt-3 space-y-2">
            {queue.map((job) => (
              <div
                key={job.title}
                className={`rounded-xl border p-3 ${
                  job.active
                    ? "border-lime/25 bg-lime/[0.05]"
                    : "border-white/[0.06] bg-white/[0.015]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-xs text-white/75">{job.title}</p>
                  <span
                    className={`shrink-0 font-mono text-[9px] uppercase tracking-[0.08em] ${
                      job.done
                        ? "text-lime"
                        : job.active
                          ? "text-lime/80"
                          : "text-white/35"
                    }`}
                  >
                    {job.status}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="font-mono text-[9px] text-white/25">{job.meta}</span>
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className={`h-full rounded-full ${
                        job.done ? "bg-lime/70" : "bg-lime"
                      }`}
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { value: "10", label: "clips" },
              { value: "3", label: "ratios" },
              { value: "SRT", label: "captions" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-white/[0.06] bg-white/[0.015] px-2 py-1.5 text-center"
              >
                <p className="font-display text-sm font-semibold text-white/80">
                  {stat.value}
                </p>
                <p className="font-mono text-[8px] uppercase tracking-[0.1em] text-white/25">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">
            Pipeline
          </p>
          <div className="mt-3 space-y-1">
            {stages.map((stage, index) => {
              const Icon = stage.icon;
              const complete = index < 2;
              const active = index === 2;
              return (
                <div key={stage.label} className="relative flex gap-3 pb-4 last:pb-0">
                  {index < stages.length - 1 ? (
                    <span
                      aria-hidden="true"
                      className={`absolute left-[13px] top-7 h-[calc(100%-16px)] w-px ${
                        complete ? "bg-lime/30" : "bg-white/10"
                      }`}
                    />
                  ) : null}
                  <span
                    className={`relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full border ${
                      complete
                        ? "border-lime/40 bg-lime/15 text-lime"
                        : active
                          ? "border-lime/50 bg-lime text-lime-ink"
                          : "border-white/10 bg-white/[0.03] text-white/35"
                    }`}
                  >
                    {complete ? (
                      <Check className="size-3.5" />
                    ) : (
                      <Icon className="size-3.5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-white/75">
                        {stage.label}
                      </p>
                      <span className="font-mono text-[9px] text-white/25">
                        {stage.time}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/35">{stage.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 rounded-xl border border-lime/20 bg-lime/[0.05] p-3">
            <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-lime">
              Estimated finish
            </p>
            <p className="mt-1 font-display text-lg font-semibold text-white/85">
              1m 48s <span className="text-xs font-normal text-white/35">remaining</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
