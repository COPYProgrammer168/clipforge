import { Check } from "lucide-react";
import { UrlCapture } from "@/components/site/url-capture";
import { Reveal } from "@/components/site/reveal";

const bullets = [
  "Unlimited processing, no account",
  "Up to ten clips per source video",
  "Captions, thumbnails and SRT included",
];

export function CtaBand({
  title = "Your next ten clips are already in the footage.",
  description = "Drop the recording. ClipForge finds complete moments, captions them and exports the aspect ratio you choose.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <section className="site-container mt-24">
      <Reveal>
        <div className="relative overflow-hidden rounded-[32px] border border-lime/15 bg-[#0a0d07] px-6 py-14 sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_120%_at_50%_0%,rgba(199,255,62,0.16),transparent_65%)]" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(199,255,62,0.05)_1px,transparent_1px)] bg-[size:56px_100%] opacity-40 [mask-image:radial-gradient(70%_100%_at_50%_0%,black,transparent)]"
          />
          <span className="absolute left-6 top-6 font-mono text-[10px] uppercase tracking-[0.18em] text-lime/40">
            Forge / 09
          </span>
          <span className="absolute right-6 top-6 font-mono text-[10px] uppercase tracking-[0.18em] text-white/20">
            No account required
          </span>

          <div className="relative mt-6 grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-center">
            <div>
              <p className="eyebrow-lime">Start clipping</p>
              <h2 className="display mt-4 text-[clamp(32px,4.5vw,52px)] leading-[1.02]">
                {title}
              </h2>
              <p className="mt-5 max-w-lg text-sm leading-relaxed text-white/50 sm:text-base">
                {description}
              </p>
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
                {bullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="inline-flex items-center gap-1.5 text-xs text-white/45"
                  >
                    <Check className="size-3.5 text-lime" />
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-white/10 bg-[#0d100a]/80 p-5 backdrop-blur sm:p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/35">
                New project
              </p>
              <p className="mt-2 font-display text-lg font-medium tracking-[-0.02em]">
                Bring the footage. We&apos;ll bring the cuts.
              </p>
              <UrlCapture className="mt-5" variant="band" />
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
