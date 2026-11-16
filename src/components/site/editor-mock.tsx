import {
  Captions,
  Clapperboard,
  Play,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

import { ClipMock, Waveform } from "@/components/site/clip-mock";

export function EditorMock() {
  return (
    <div className="panel overflow-hidden">
      <div className="flex h-11 items-center justify-between border-b border-white/[0.08] px-4">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-[#ff5a4e]/70" />
          <span className="size-2 rounded-full bg-[#ffd02f]/70" />
          <span className="size-2 rounded-full bg-lime/70" />
          <span className="ml-3 font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">mayamakes_ep42.mp4</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-white/35">autosaved</span>
          <span className="rounded-full bg-lime/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-lime">1080p</span>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] lg:grid-cols-[200px_1fr_180px]">
        <aside className="hidden border-r border-white/[0.07] p-3 sm:block">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">AI picks</p>
            <span className="rounded-full bg-lime/10 px-1.5 py-0.5 font-mono text-[9px] text-lime">10</span>
          </div>
          <div className="mt-3 space-y-1.5">
            <div className="rounded-xl border p-2.5 border-lime/30 bg-lime/[0.06]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] tabular-nums text-white/35">00:14 · 0:42</span>
                <span className="font-mono text-[9px] tabular-nums text-lime">98</span>
              </div>
              <p className="mt-1 truncate text-[11px] text-white/65">The three-second rule</p>
            </div>
            <div className="rounded-xl border p-2.5 border-white/[0.06] bg-white/[0.015]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] tabular-nums text-white/35">03:22 · 0:37</span>
                <span className="font-mono text-[9px] tabular-nums text-white/35">94</span>
              </div>
              <p className="mt-1 truncate text-[11px] text-white/65">Why hooks fail</p>
            </div>
            <div className="rounded-xl border p-2.5 border-white/[0.06] bg-white/[0.015]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] tabular-nums text-white/35">07:10 · 0:51</span>
                <span className="font-mono text-[9px] tabular-nums text-white/35">91</span>
              </div>
              <p className="mt-1 truncate text-[11px] text-white/65">Ship before perfect</p>
            </div>
          </div>
          <button type="button" className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/10 py-1.5 text-[10px] text-white/45">
            <Sparkles className="size-3" />
            Re-score
          </button>
        </aside>
        <div className="relative flex min-h-[280px] items-center justify-center overflow-hidden bg-[#080a07] p-4 sm:min-h-[340px]">
          <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_45%,rgba(199,255,62,0.07),transparent_70%)]" />
          <div className="relative">
            <ClipMock label="Live preview" caption="The first three seconds decide whether anyone" highlight="keeps watching" gradient="from-[#2f4212] via-[#152008] to-[#070a04]" timecode="00:14" className="w-[190px] sm:w-[210px]" />
            <div className="absolute -left-3 top-6 flex size-8 items-center justify-center rounded-full border border-lime/40 bg-lime/15 text-lime backdrop-blur">
              <Play className="ml-0.5 size-3 fill-current" />
            </div>
          </div>
          <span className="absolute bottom-3 left-4 font-mono text-[9px] uppercase tracking-[0.14em] text-white/25">9:16 · safe area on</span>
        </div>
        <aside className="hidden border-l border-white/[0.07] p-3 lg:block">
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">Caption style</p>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            <div className="flex h-10 items-center justify-center rounded-lg border text-[9px] border-lime/40 bg-lime/10 text-lime">Bold pop</div>
            <div className="flex h-10 items-center justify-center rounded-lg border text-[9px] border-white/10 bg-white/[0.02] text-white/40">Clean</div>
            <div className="flex h-10 items-center justify-center rounded-lg border text-[9px] border-white/10 bg-white/[0.02] text-white/40">Boxed</div>
          </div>
          <div className="mt-5 space-y-3">
            <div>
              <div className="flex items-center justify-between text-[9px] text-white/35">
                <span>Size</span>
                <span className="font-mono">44px</span>
              </div>
              <div className="mt-1.5 h-1 rounded-full bg-white/10">
                <div className="h-full w-2/3 rounded-full bg-lime" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-[9px] text-white/35">
                <span>Emphasis</span>
                <span className="font-mono text-lime">lime</span>
              </div>
              <div className="mt-1.5 flex gap-1.5">
                <span className="size-4 rounded-full border border-white/20" style={{ backgroundColor: "#c7ff3e" }} />
                <span className="size-4 rounded-full border border-white/20" style={{ backgroundColor: "#f2f5ee" }} />
                <span className="size-4 rounded-full border border-white/20" style={{ backgroundColor: "#ff8ea8" }} />
              </div>
            </div>
          </div>
          <div className="mt-5 space-y-2 border-t border-white/[0.07] pt-3 text-[10px] text-white/40">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5">
                <Captions className="size-3" />
                 Burn in
              </span>
              <span className="rounded-full bg-lime/20 px-1.5 py-0.5 font-mono text-[8px] text-lime">ON</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5">
                <SlidersHorizontal className="size-3" />
                 Loudness
              </span>
              <span className="font-mono text-white/30">-14 LUFS</span>
            </div>
          </div>
        </aside>
      </div>
      <div className="border-t border-white/[0.07] p-3">
        <div className="mb-2 flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.14em] text-white/25">
          <span className="inline-flex items-center gap-1.5">
            <Clapperboard className="size-3" />
             Timeline
          </span>
          <span>00:07:12 / 00:14:08</span>
        </div>
        <div className="relative space-y-1.5">
          <div className="relative h-7 overflow-hidden rounded-md bg-white/[0.03]">
            <div className="absolute inset-y-0 left-[6%] w-[14%] rounded-sm bg-lime/25" />
            <div className="absolute inset-y-0 left-[34%] w-[22%] rounded-sm bg-[#4b6a18]/50" />
            <div className="absolute inset-y-0 left-[62%] w-[18%] rounded-sm bg-lime/20" />
          </div>
          <div className="relative flex h-6 items-center overflow-hidden rounded-md bg-white/[0.02] px-2">
            <Waveform bars={64} className="h-3 w-full opacity-50" />
          </div>
          <div className="absolute -top-1 bottom-0 left-[28%] w-px bg-lime">
            <span className="absolute -left-[3px] top-0 size-[7px] rounded-full bg-lime" />
          </div>
        </div>
      </div>
    </div>
  );
}
