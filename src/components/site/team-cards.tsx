import { ArrowUpRight, Code2, Palette, Users } from "lucide-react";

import { Reveal } from "@/components/site/reveal";

export function TeamCards() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Reveal className="group panel flex flex-col overflow-hidden p-6 transition-colors hover:border-lime/25">
        <div className="flex items-center justify-between">
          <span className="flex size-9 items-center justify-center rounded-full border border-lime/25 bg-lime/10 text-lime">
            <Palette className="size-4" />
          </span>
          <ArrowUpRight className="size-4 text-white/20 transition-colors group-hover:text-lime" />
        </div>
        <h3 className="mt-6 font-display text-xl font-medium tracking-[-0.02em]">Brand kits</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/45">Fonts, colours, logo and end cards stored once. Every render follows the rules automatically.</p>
        <div className="mt-6 rounded-2xl border border-white/[0.08] bg-[#0a0c08] p-3">
          <div className="flex items-center gap-1.5">
            <span className="size-5 rounded-full border border-white/15" style={{ backgroundColor: "#c7ff3e" }} />
            <span className="size-5 rounded-full border border-white/15" style={{ backgroundColor: "#f2f5ee" }} />
            <span className="size-5 rounded-full border border-white/15" style={{ backgroundColor: "#8fbf24" }} />
            <span className="size-5 rounded-full border border-white/15" style={{ backgroundColor: "#1a2014" }} />
          </div>
          <div className="mt-3 flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
            <span className="font-display text-lg font-semibold">Aa</span>
            <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-white/30">Space Grotesk</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span className="flex size-5 items-center justify-center rounded bg-lime font-mono text-[7px] font-bold text-lime-ink">CF</span>
            <span className="h-1.5 flex-1 rounded-full bg-white/10" />
            <span className="h-1.5 w-6 rounded-full bg-lime/50" />
          </div>
        </div>
      </Reveal>
      <Reveal delay={70} className="group panel flex flex-col overflow-hidden p-6 transition-colors hover:border-lime/25">
        <div className="flex items-center justify-between">
          <span className="flex size-9 items-center justify-center rounded-full border border-lime/25 bg-lime/10 text-lime">
            <Users className="size-4" />
          </span>
          <ArrowUpRight className="size-4 text-white/20 transition-colors group-hover:text-lime" />
        </div>
        <h3 className="mt-6 font-display text-xl font-medium tracking-[-0.02em]">Shared workspace</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/45">A single queue for producers, editors and approvers. No more &quot;which cut is final?&quot; threads.</p>
        <div className="mt-6 space-y-1.5">
          <div className="flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-[#c7ff3e] to-[#4d6b12] font-mono text-[8px] font-semibold text-black/70">MC</span>
            <span className="text-[11px] text-white/65">Maya Chen</span>
            <span className="ml-auto rounded-full bg-white/[0.05] px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.08em] text-white/30">Producer</span>
          </div>
          <div className="flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-[#7ef9c1] to-[#1f6a54] font-mono text-[8px] font-semibold text-black/70">DP</span>
            <span className="text-[11px] text-white/65">Dev Patel</span>
            <span className="ml-auto rounded-full bg-white/[0.05] px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.08em] text-white/30">Editor</span>
          </div>
          <div className="flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-[#ffcf7a] to-[#8a5a18] font-mono text-[8px] font-semibold text-black/70">LO</span>
            <span className="text-[11px] text-white/65">Lena Ortiz</span>
            <span className="ml-auto rounded-full bg-white/[0.05] px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.08em] text-white/30">Approver</span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-dashed border-white/10 px-2.5 py-2">
            <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-white/25">Draft → review → approved</span>
            <span className="size-1.5 rounded-full bg-lime" />
          </div>
        </div>
      </Reveal>
      <Reveal delay={140} className="group panel flex flex-col overflow-hidden p-6 transition-colors hover:border-lime/25">
        <div className="flex items-center justify-between">
          <span className="flex size-9 items-center justify-center rounded-full border border-lime/25 bg-lime/10 text-lime">
            <Code2 className="size-4" />
          </span>
          <ArrowUpRight className="size-4 text-white/20 transition-colors group-hover:text-lime" />
        </div>
        <h3 className="mt-6 font-display text-xl font-medium tracking-[-0.02em]">API + automations</h3>
        <p className="mt-2 text-sm leading-relaxed text-white/45">Trigger jobs from your CMS or publishing pipeline. Webhooks fire the moment clips are ready.</p>
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#080a07]">
          <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-3 py-2">
            <span className="size-1.5 rounded-full bg-white/15" />
            <span className="size-1.5 rounded-full bg-white/15" />
            <span className="size-1.5 rounded-full bg-lime/60" />
            <span className="ml-auto font-mono text-[8px] text-white/25">POST /v1/jobs</span>
          </div>
          <pre className="overflow-x-auto p-3 font-mono text-[9px] leading-relaxed text-white/45">
            <code>{`{
  "source": "https://…",
  "clips": 10,
  "ratios": ["9:16", "1:1"],
  "captions": "brand-kit"
}`}</code>
          </pre>
          <div className="flex items-center gap-1.5 border-t border-white/[0.06] px-3 py-2">
            <span className="size-1.5 rounded-full bg-lime" />
            <span className="font-mono text-[8px] text-lime/80">202 · job queued</span>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
