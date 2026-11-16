import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { Reveal } from "@/components/site/reveal";

export function PageHero({
  eyebrow,
  index = "01",
  title,
  description,
  stats,
  children,
  secondaryHref = "#how-it-works",
  secondaryLabel = "See how it works",
}: {
  eyebrow: string;
  index?: string;
  title: React.ReactNode;
  description: string;
  stats?: { value: string; label: string }[];
  children?: React.ReactNode;
  secondaryHref?: string;
  secondaryLabel?: string;
}) {
  return (
    <section className="relative overflow-hidden pb-14 pt-14 sm:pt-20">
      <div className="lime-glow pointer-events-none absolute inset-x-0 top-0 h-[520px] opacity-70" />
      <div className="site-container relative">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <div>
            <Reveal>
              <div className="mb-5 flex items-center gap-3">
                <span className="font-mono text-[11px] text-white/25">[{index}]</span>
                <span className="eyebrow-lime">{eyebrow}</span>
                <span className="h-px w-8 bg-white/10" />
              </div>
            </Reveal>
            <Reveal delay={60}>
              <h1 className="display text-[clamp(40px,6.4vw,76px)] leading-[0.96]">
                {title}
              </h1>
            </Reveal>
            <Reveal delay={120}>
              <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-white/50 sm:text-base">
                {description}
              </p>
            </Reveal>
            <Reveal delay={180} className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/studio"
                className="inline-flex h-11 items-center gap-2 rounded-full bg-lime px-5 text-sm font-semibold text-lime-ink transition-transform hover:-translate-y-0.5"
              >
                Open studio
                <ArrowRight className="size-4" />
              </Link>
              <Link
                href={secondaryHref}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-white/15 px-5 text-sm font-medium text-white/80 transition-colors hover:border-white/30 hover:text-white"
              >
                <Play className="size-3.5 fill-current" />
                {secondaryLabel}
              </Link>
            </Reveal>

            {stats?.length ? (
              <Reveal delay={240} className="mt-10 grid grid-cols-3 gap-4 border-t border-white/[0.08] pt-6">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <p className="font-display text-2xl font-semibold tracking-[-0.03em] text-lime sm:text-3xl">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-[11px] leading-snug text-white/40">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </Reveal>
            ) : null}
          </div>

          <Reveal delay={220} className="relative">
            {children}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
