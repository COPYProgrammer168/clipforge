import Link from "next/link";
import { Captions, Crop, FileText, Scissors, Sparkles } from "lucide-react";
import { ClipMock } from "@/components/site/clip-mock";
import { Reveal } from "@/components/site/reveal";
import { RotatingHeadline } from "@/components/site/rotating-headline";
import { UrlCapture } from "@/components/site/url-capture";

const capabilities = [
  { label: "Clipping engine", icon: Scissors },
  { label: "Captions", icon: Captions },
  { label: "Aspect ratios", icon: Crop },
  { label: "SRT + thumbnails", icon: FileText },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-10 pt-12 sm:pt-16">
      <div className="lime-glow pointer-events-none absolute inset-x-0 top-0 h-[680px]" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(242,245,238,0.035)_1px,transparent_1px)] bg-[size:120px_100%] opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent_75%)]"
      />
      <div className="pointer-events-none absolute left-4 top-1/2 hidden -translate-y-1/2 lg:block">
        <span className="eyebrow [writing-mode:vertical-rl]">Forge / 01</span>
      </div>
      <div className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 lg:block">
        <span className="eyebrow [writing-mode:vertical-rl]">
          Source → ten cuts
        </span>
      </div>

      <div className="site-container relative">
        <Reveal className="flex justify-center">
          <Link
            href="/pricing"
            className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] py-1 pl-1.5 pr-3 text-xs text-white/65 transition-colors hover:border-white/20 hover:text-white"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-lime/15 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-lime">
              <Sparkles className="size-3" />
              Beta
            </span>
            Unlimited processing, no account
            <span className="text-white/30 transition-transform group-hover:translate-x-0.5">
              ↗
            </span>
          </Link>
        </Reveal>

        <Reveal delay={60} className="mt-7">
          <RotatingHeadline />
        </Reveal>

        <Reveal delay={140}>
          <p className="mx-auto mt-7 max-w-2xl text-center text-[15px] leading-relaxed text-white/50 sm:text-[17px]">
            Paste a public link or drop a recording. ClipForge finds complete
            moments, captions them, crops to the ratio you choose and queues the
            exports while you work.
          </p>
        </Reveal>

        <Reveal delay={200}>
          <UrlCapture className="mx-auto mt-9 max-w-[660px]" />
        </Reveal>

        <Reveal delay={260} className="mt-14">
          <div className="relative mx-auto max-w-[1060px]">
            <div className="pointer-events-none absolute inset-x-10 bottom-0 h-40 rounded-[50%] bg-lime/10 blur-3xl" />
            <div className="flex snap-x snap-mandatory items-center justify-center gap-4 overflow-x-auto px-4 pb-8 pt-4 sm:gap-6 sm:overflow-visible">
              <ClipMock
                label="Smart cut"
                caption="Nobody tells you this about the first 3 seconds of a"
                highlight="clip"
                gradient="from-[#3d5314] via-[#1d2a0b] to-[#0a0d05]"
                timecode="00:14"
                className="hidden w-[190px] -rotate-6 snap-center opacity-80 transition-transform duration-500 hover:rotate-0 hover:opacity-100 md:block"
              />
              <ClipMock
                label="9:16 crop"
                caption="One ratio per job, chosen"
                highlight="before rendering"
                gradient="from-[#243c12] via-[#142008] to-[#080b05]"
                timecode="00:03"
                className="w-[230px] shrink-0 snap-center rotate-1 transition-transform duration-500 hover:rotate-0 sm:w-[280px] lg:w-[300px]"
              />
              <ClipMock
                label="Caption pass"
                caption="Captions that land the emphasis on every"
                highlight="word that matters"
                gradient="from-[#35470f] via-[#1a260a] to-[#0a0d05]"
                timecode="00:41"
                playing
                className="hidden w-[190px] rotate-6 snap-center opacity-80 transition-transform duration-500 hover:rotate-0 hover:opacity-100 md:block"
              />
            </div>

            <div className="pointer-events-none absolute -left-4 top-8 hidden rounded-2xl border border-white/10 bg-[#0d0f0c]/90 p-3 shadow-xl backdrop-blur lg:block">
              <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">
                Clips found
              </p>
              <p className="mt-1 font-display text-2xl font-semibold">
                10<span className="text-lime">.</span>
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal delay={380}>
          <div className="mx-auto mt-2 flex max-w-4xl flex-wrap items-center justify-center gap-2">
            {capabilities.map(({ label, icon: Icon }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.09] bg-white/[0.025] px-3 py-1.5 text-[11px] text-white/55 transition-colors hover:border-lime/30 hover:text-white/85"
              >
                <Icon className="size-3.5 text-lime/80" />
                {label}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
