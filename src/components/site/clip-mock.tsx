import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

const aspectClasses = {
  vertical: "aspect-[9/16]",
  square: "aspect-square",
  wide: "aspect-video",
} as const;

export function Waveform({
  bars = 14,
  className,
}: {
  bars?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex h-6 items-end gap-[3px]", className)} aria-hidden="true">
      {Array.from({ length: bars }).map((_, index) => (
        <span
          key={index}
          className="w-[3px] origin-bottom rounded-full bg-lime/70 animate-waveform"
          style={{
            height: `${28 + Math.round(Math.abs(Math.sin(index * 1.7)) * 72)}%`,
            animationDelay: `${index * 90}ms`,
            animationDuration: `${1200 + (index % 4) * 220}ms`,
          }}
        />
      ))}
    </div>
  );
}

export function ClipMock({
  label,
  caption,
  highlight,
  gradient,
  timecode = "00:00",
  aspect = "vertical",
  className,
  playing = false,
}: {
  label: string;
  caption: string;
  highlight: string;
  gradient: string;
  timecode?: string;
  aspect?: keyof typeof aspectClasses;
  className?: string;
  playing?: boolean;
}) {
  const [before, ...rest] = caption.split(highlight);

  return (
    <div
      className={cn(
        "noise-card clip-shadow relative isolate select-none overflow-hidden rounded-[26px] border border-white/10 bg-[#0c0e0b]",
        aspectClasses[aspect],
        className
      )}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-95", gradient)} />
      <div className="absolute inset-0 bg-[radial-gradient(85%_60%_at_50%_10%,transparent_20%,rgba(4,5,3,0.72)_100%)]" />
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/35 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-white/75 backdrop-blur">
          <span className="size-1.5 rounded-full bg-lime" />
          {label}
        </span>
        <span className="rounded-full border border-white/10 bg-black/35 px-2 py-1 font-mono text-[9px] tabular-nums text-white/60 backdrop-blur">
          {timecode}
        </span>
      </div>

      {!playing ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex size-14 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white backdrop-blur-md transition-transform duration-300 group-hover:scale-105">
            <Play className="ml-0.5 size-5 fill-white" />
          </span>
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-lime backdrop-blur">
            <span className="size-1.5 animate-pulse-dot rounded-full bg-lime" />
            Rendering
          </span>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-4 pt-16">
        <p className="font-display text-[clamp(15px,1.5vw,22px)] font-semibold leading-tight tracking-[-0.02em] text-white">
          {before}
          <span className="text-lime">{highlight}</span>
          {rest.join(highlight)}
        </p>
        <div className="mt-3 flex items-end justify-between gap-3">
          <Waveform bars={12} className="h-4 opacity-80" />
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/40">
            1080 × 1920
          </span>
        </div>
        <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-white/15">
          <span className="block h-full w-[46%] rounded-full bg-lime" />
        </div>
      </div>
    </div>
  );
}
