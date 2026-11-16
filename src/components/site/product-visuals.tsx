import { Play, Sparkles } from "lucide-react";
import { ClipMock, Waveform } from "@/components/site/clip-mock";

export function SmartClipsVisual() {
  return (
    <div className="relative mx-auto h-[400px] max-w-[440px]">
      <div className="absolute inset-x-6 inset-y-0 rounded-[32px] border border-white/[0.08] bg-[#0a0c08]">
        <div className="absolute inset-0 rounded-[32px] bg-[radial-gradient(70%_60%_at_50%_0%,rgba(199,255,62,0.14),transparent_70%)]" />
        <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-white/45">
          <Sparkles className="size-3 text-lime" />
          10 picks · scored
        </div>
        <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/[0.08] bg-black/40 p-3 backdrop-blur">
          <div className="flex items-center justify-between text-[10px] text-white/45">
            <span>Hook strength</span>
            <span className="font-mono text-lime">98 / 100</span>
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-[98%] rounded-full bg-lime" />
          </div>
        </div>
      </div>

      <ClipMock
        label="Pick 03"
        caption="Everyone gets the first three"
        highlight="seconds wrong"
        gradient="from-[#3c5514] via-[#1a2609] to-[#070a04]"
        timecode="03:22"
        className="absolute left-0 top-10 w-[150px] -rotate-6 sm:w-[165px]"
      />
      <ClipMock
        label="Pick 01"
        caption="The one thing nobody tells you about"
        highlight="going viral"
        gradient="from-[#446016] via-[#21310c] to-[#080b05]"
        timecode="00:14"
        className="absolute left-1/2 top-4 w-[170px] -translate-x-1/2 rotate-1 sm:w-[185px]"
        playing
      />
      <ClipMock
        label="Pick 07"
        caption="Ship before it feels"
        highlight="finished"
        gradient="from-[#31470f] via-[#172208] to-[#070a04]"
        timecode="07:10"
        className="absolute right-0 top-14 w-[150px] rotate-6 sm:w-[165px]"
      />
    </div>
  );
}

export function EditorVisual() {
  return (
    <div className="panel overflow-hidden">
      <div className="flex h-10 items-center justify-between border-b border-white/[0.08] px-3">
        <div className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-white/15" />
          <span className="size-1.5 rounded-full bg-white/15" />
          <span className="size-1.5 rounded-full bg-lime/70" />
          <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.12em] text-white/30">
            timeline / clip 01
          </span>
        </div>
        <span className="rounded-full bg-lime/15 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-lime">
          editable
        </span>
      </div>
      <div className="grid grid-cols-[1fr_120px] gap-3 p-3 sm:grid-cols-[1fr_140px]">
        <div className="relative flex min-h-[240px] items-center justify-center overflow-hidden rounded-xl bg-[#080a07]">
          <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_45%,rgba(199,255,62,0.08),transparent_70%)]" />
          <ClipMock
            label="Preview"
            caption="Cut on the sentence, not the"
            highlight="frame count"
            gradient="from-[#30450f] via-[#172208] to-[#070a04]"
            timecode="00:14"
            className="w-[150px]"
          />
          <span className="absolute bottom-2 left-2 font-mono text-[8px] uppercase tracking-[0.12em] text-white/25">
            9:16 · 30fps
          </span>
        </div>
        <div className="space-y-2">
          <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/30">
            Style
          </p>
          {["Bold pop", "Clean", "Boxed"].map((style, index) => (
            <div
              key={style}
              className={`rounded-lg border px-2 py-1.5 text-[9px] ${
                index === 0
                  ? "border-lime/35 bg-lime/10 text-lime"
                  : "border-white/10 text-white/40"
              }`}
            >
              {style}
            </div>
          ))}
          <div className="rounded-lg border border-white/10 p-2">
            <div className="flex items-center justify-between text-[8px] text-white/30">
              <span>Size</span>
              <span className="font-mono text-lime">44</span>
            </div>
            <div className="mt-1.5 h-1 rounded-full bg-white/10">
              <div className="h-full w-2/3 rounded-full bg-lime" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            {["#c7ff3e", "#f2f5ee", "#ff8ea8"].map((color) => (
              <span
                key={color}
                className="size-3.5 rounded-full border border-white/20"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-white/[0.07] p-3">
        <div className="relative space-y-1.5">
          <div className="relative h-6 overflow-hidden rounded bg-white/[0.03]">
            <div className="absolute inset-y-0 left-[4%] w-[18%] rounded-sm bg-lime/25" />
            <div className="absolute inset-y-0 left-[28%] w-[26%] rounded-sm bg-[#4b6a18]/50" />
            <div className="absolute inset-y-0 left-[60%] w-[20%] rounded-sm bg-lime/20" />
          </div>
          <div className="flex h-5 items-center overflow-hidden rounded bg-white/[0.02] px-2">
            <Waveform bars={48} className="h-2.5 w-full opacity-40" />
          </div>
          <div className="absolute -top-1 bottom-0 left-[31%] w-px bg-lime">
            <span className="absolute -left-[3px] top-0 size-[7px] rounded-full bg-lime" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ReframeVisual() {
  return (
    <div className="panel overflow-hidden p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/35">
          Source → vertical
        </span>
        <div className="flex gap-1 rounded-full border border-white/10 p-0.5">
          {["9:16", "1:1", "16:9"].map((ratio, index) => (
            <span
              key={ratio}
              className={`rounded-full px-2 py-0.5 font-mono text-[8px] ${
                index === 0 ? "bg-lime text-lime-ink" : "text-white/35"
              }`}
            >
              {ratio}
            </span>
          ))}
        </div>
      </div>

      <div className="relative mt-4 aspect-[4/5] w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#3c5514] via-[#22340c] to-[#0a0d05] sm:aspect-[5/4]">
        <div className="absolute inset-0 bg-[radial-gradient(45%_55%_at_52%_42%,rgba(242,245,238,0.2),transparent_70%)]" />
        <div className="absolute left-1/2 top-[46%] size-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40 bg-white/10 backdrop-blur-sm" />
        <div className="absolute left-[calc(50%-17px)] top-[calc(50%-30px)] size-3.5 rounded-full bg-white/70" />
        <div className="absolute left-[calc(50%-28px)] top-[calc(50%+8px)] h-10 w-14 rounded-t-full bg-white/50" />

        <div className="absolute inset-y-0 left-[42%] w-[16%] border-x-2 border-lime bg-lime/[0.05]">
          <span className="absolute -top-px left-1/2 -translate-x-1/2 rounded-b bg-lime px-1.5 py-0.5 font-mono text-[8px] font-semibold text-lime-ink">
            9:16
          </span>
          <span className="absolute bottom-3 left-1/2 w-[88%] -translate-x-1/2 rounded bg-black/55 px-1 py-1 text-center text-[8px] font-semibold leading-tight text-white">
            the frame <span className="text-lime">follows</span> the story
          </span>
        </div>

        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 font-mono text-[8px] text-white/50 backdrop-blur">
          <span className="size-1 rounded-full bg-lime" />
          subject locked
        </div>
        <span className="absolute bottom-3 left-3 font-mono text-[8px] uppercase tracking-[0.12em] text-white/35">
          crop path smoothed
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { label: "Face track", value: "auto" },
          { label: "Safe area", value: "on" },
          { label: "Override", value: "manual" },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-lg border border-white/[0.07] bg-white/[0.02] px-2 py-1.5"
          >
            <p className="font-mono text-[8px] uppercase tracking-[0.08em] text-white/25">
              {item.label}
            </p>
            <p className="mt-0.5 text-[10px] text-white/60">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CaptionsVisual() {
  return (
    <div className="panel space-y-3 p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/35">
          Caption styles
        </span>
        <span className="flex items-center gap-1 font-mono text-[8px] text-lime">
          <span className="size-1 rounded-full bg-lime" />
          99% accuracy
        </span>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#33490f] via-[#1b270a] to-[#080b05] p-5">
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_20%,rgba(199,255,62,0.12),transparent_70%)]" />
        <div className="relative flex h-[190px] flex-col items-center justify-center gap-4 text-center">
          <p className="font-display text-[26px] font-bold leading-[1.05] tracking-[-0.03em] text-white">
            Readable is <span className="rounded bg-lime px-1 text-lime-ink">table stakes</span>
          </p>
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-lime/70">
            ← word-level emphasis →
          </p>
          <div className="flex items-center gap-2">
            <Waveform bars={18} className="h-3 opacity-50" />
            <span className="font-mono text-[8px] text-white/35">-14 LUFS</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { name: "Bold pop", className: "font-display font-bold text-white" },
          { name: "Clean", className: "font-sans text-white/85" },
          { name: "Boxed", className: "font-mono text-lime" },
        ].map((style, index) => (
          <div
            key={style.name}
            className={`rounded-xl border p-2 text-center ${
              index === 0
                ? "border-lime/35 bg-lime/[0.06]"
                : "border-white/[0.07] bg-white/[0.02]"
            }`}
          >
            <p className={`text-[10px] ${style.className}`}>
              {index === 2 ? (
                <span className="rounded bg-black/60 px-1 py-0.5">{style.name}</span>
              ) : (
                style.name
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TeamVisual() {
  return (
    <div className="panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
        <span className="font-display text-sm font-medium">Northbeam Studio</span>
        <span className="rounded-full border border-lime/25 bg-lime/10 px-2 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-lime">
          brand kit locked
        </span>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-2">
        <div className="rounded-xl border border-white/[0.07] bg-[#0a0c08] p-3">
          <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/30">
            Palette
          </p>
          <div className="mt-2 flex gap-1.5">
            {["#c7ff3e", "#f2f5ee", "#8fbf24", "#1a2014", "#ff8ea8"].map((color) => (
              <span
                key={color}
                className="size-5 rounded-full border border-white/15"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <p className="mt-3 font-mono text-[8px] uppercase tracking-[0.14em] text-white/30">
            Type
          </p>
          <div className="mt-1.5 flex items-baseline justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-2 py-1.5">
            <span className="font-display text-base font-semibold">Aa</span>
            <span className="font-mono text-[8px] text-white/30">Space Grotesk</span>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.07] bg-[#0a0c08] p-3">
          <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-white/30">
            Team
          </p>
          <div className="mt-2 space-y-1.5">
            {[
              { initials: "MC", name: "Maya", role: "Producer" },
              { initials: "DP", name: "Dev", role: "Editor" },
              { initials: "LO", name: "Lena", role: "Approver" },
            ].map((member) => (
              <div key={member.initials} className="flex items-center gap-2">
                <span className="flex size-5 items-center justify-center rounded-full bg-lime/20 font-mono text-[7px] text-lime">
                  {member.initials}
                </span>
                <span className="text-[10px] text-white/60">{member.name}</span>
                <span className="ml-auto font-mono text-[8px] text-white/25">
                  {member.role}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-dashed border-lime/20 px-2 py-1.5">
            <span className="flex size-4 items-center justify-center rounded-full bg-lime text-lime-ink">
              <Play className="ml-px size-2 fill-current" />
            </span>
            <span className="font-mono text-[8px] uppercase tracking-[0.08em] text-lime/70">
              queue rendering · 3 jobs
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between border-t border-white/[0.07] px-4 py-2.5">
        <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-white/25">
          Unlimited processing · shared workspace
        </span>
        <span className="font-mono text-[8px] text-white/35">API enabled</span>
      </div>
    </div>
  );
}
