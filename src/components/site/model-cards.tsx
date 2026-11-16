import Link from "next/link";
import { ArrowUpRight, Crop, Play, Sparkles } from "lucide-react";
import { ClipMock, Waveform } from "@/components/site/clip-mock";

export function ModelCards() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Link
        href="/smart-clips"
        className="group panel relative overflow-hidden p-6 transition-colors hover:border-lime/25 sm:p-7"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow-lime inline-flex items-center gap-1.5">
              <Sparkles className="size-3" />
              Smart Clips
            </p>
            <h3 className="display mt-4 text-[clamp(24px,3vw,34px)]">
              Clip by prompt or by transcript.
            </h3>
          </div>
          <ArrowUpRight className="size-5 text-white/20 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-lime" />
        </div>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-white/45">
          The model reads pacing, topic flow and hook strength across the whole
          recording, then returns complete moments — not mid-sentence slices.
        </p>

        <div className="relative mt-6 h-[286px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0c08]">
          <div className="absolute inset-0 bg-[radial-gradient(80%_100%_at_30%_0%,rgba(199,255,62,0.12),transparent_65%)]" />
          <div className="relative p-4">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-2 text-[10px] text-white/55">
              <Sparkles className="size-3 text-lime" />
              Find the moment most likely to go viral
              <span className="ml-auto flex size-6 items-center justify-center rounded-full bg-lime text-lime-ink">
                <Play className="ml-px size-2.5 fill-current" />
              </span>
            </div>

            <div className="mt-4 flex gap-3">
              <div className="flex-1 space-y-2">
                {[
                  { label: "Cold open", time: "00:14", active: true },
                  { label: "Contrarian take", time: "03:22", active: false },
                  { label: "The payoff", time: "07:10", active: false },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${
                      item.active
                        ? "border-lime/30 bg-lime/[0.07]"
                        : "border-white/[0.06] bg-white/[0.015]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex size-6 items-center justify-center rounded-md ${
                          item.active ? "bg-lime text-lime-ink" : "bg-white/[0.06] text-white/30"
                        }`}
                      >
                        <Play className="ml-px size-2.5 fill-current" />
                      </span>
                      <span className="text-[11px] text-white/65">{item.label}</span>
                    </div>
                    <span className="font-mono text-[9px] text-white/25">
                      {item.time}
                    </span>
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-1">
                  <Waveform bars={22} className="h-5 flex-1 opacity-40" />
                  <span className="font-mono text-[9px] text-white/25">10 cuts</span>
                </div>
              </div>

              <div className="hidden sm:block">
                <ClipMock
                  label="Viral pick"
                  caption="Your first line is doing"
                  highlight="all the work"
                  gradient="from-[#3c5514] via-[#1a2609] to-[#070a04]"
                  timecode="00:14"
                  className="w-[132px]"
                  playing
                />
              </div>
            </div>
          </div>
        </div>
      </Link>

      <Link
        href="/smart-reframe"
        className="group panel relative overflow-hidden p-6 transition-colors hover:border-lime/25 sm:p-7"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow-lime inline-flex items-center gap-1.5">
              <Crop className="size-3" />
              Smart Reframe
            </p>
            <h3 className="display mt-4 text-[clamp(24px,3vw,34px)]">
              One source, every frame size.
            </h3>
          </div>
          <ArrowUpRight className="size-5 text-white/20 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-lime" />
        </div>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-white/45">
          Change the ratio without losing the speaker. Subject-aware cropping
          keeps faces and action inside the safe area for each platform.
        </p>

        <div className="relative mt-6 h-[286px] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0a0c08]">
          <div className="absolute inset-0 bg-[radial-gradient(90%_100%_at_50%_0%,rgba(199,255,62,0.1),transparent_70%)]" />
          <div className="relative flex h-full items-center justify-center p-4">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-[#3c5514] via-[#22340c] to-[#0a0d05]">
              <div className="absolute inset-0 bg-[radial-gradient(45%_60%_at_55%_45%,rgba(242,245,238,0.22),transparent_70%)]" />
              <div className="absolute left-1/2 top-1/2 size-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40 bg-white/10 backdrop-blur-sm" />
              <div className="absolute left-[calc(50%-14px)] top-[calc(50%-24px)] size-3 rounded-full bg-white/70" />
              <div className="absolute left-[calc(50%-24px)] top-[calc(50%+6px)] h-8 w-12 rounded-t-full bg-white/50" />

              <div className="absolute inset-y-0 left-[38%] w-[24%] border-x-2 border-lime bg-lime/[0.04]">
                <span className="absolute -top-px left-1/2 -translate-x-1/2 rounded-b bg-lime px-1.5 py-0.5 font-mono text-[8px] font-semibold text-lime-ink">
                  9:16
                </span>
                <span className="absolute bottom-2 left-1/2 w-[86%] -translate-x-1/2 rounded bg-black/50 px-1 py-0.5 text-center text-[7px] font-semibold leading-tight text-white">
                  the frame <span className="text-lime">follows</span> the story
                </span>
              </div>

              <span className="absolute bottom-2 left-3 font-mono text-[8px] uppercase tracking-[0.12em] text-white/40">
                Source 16:9
              </span>
            </div>
          </div>

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/10 bg-black/45 px-2.5 py-1 backdrop-blur">
            {["9:16", "1:1", "16:9"].map((ratio, index) => (
              <span
                key={ratio}
                className={`rounded-full px-2 py-0.5 font-mono text-[8px] ${
                  index === 0 ? "bg-lime text-lime-ink" : "text-white/40"
                }`}
              >
                {ratio}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </div>
  );
}
