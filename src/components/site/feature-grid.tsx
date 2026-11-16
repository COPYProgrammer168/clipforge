import { ArrowUpRight, Link2, Share2, Sparkles } from "lucide-react";
import { Reveal } from "@/components/site/reveal";

const STEP_ICONS = [Link2, Sparkles, Share2];

export function FeatureGrid({
  features,
}: {
  features: { title: string; description: string }[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {features.map((feature, index) => (
        <Reveal
          key={feature.title}
          delay={index * 70}
          className="group relative flex flex-col rounded-3xl border border-white/[0.08] bg-[#0c0e0b] p-6 transition-colors hover:border-lime/25 sm:p-7"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/25">
              0{index + 1}
            </span>
            <ArrowUpRight className="size-4 text-white/20 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-lime" />
          </div>
          <h3 className="mt-8 font-display text-xl font-medium tracking-[-0.02em] text-white/90">
            {feature.title}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-white/45">
            {feature.description}
          </p>
          <div className="mt-6 h-px w-full bg-gradient-to-r from-lime/30 via-white/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        </Reveal>
      ))}
    </div>
  );
}

export function Steps({
  steps,
}: {
  steps: { title: string; description: string }[];
}) {
  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-[16.666%] top-12 hidden h-px bg-white/10 md:block"
      />
      <div className="relative grid gap-12 md:grid-cols-3 md:gap-8">
        {steps.map((step, index) => {
          const Icon = STEP_ICONS[index % STEP_ICONS.length];
          return (
            <Reveal
              key={step.title}
              delay={index * 90}
              className="flex flex-col items-center text-center"
            >
              <div className="flex size-24 items-center justify-center rounded-full border border-white/[0.08] bg-[#0c0e0b]">
                <Icon className="size-7 text-white/45" strokeWidth={1.5} />
              </div>
              <h3 className="mt-6 font-display text-lg font-medium tracking-[-0.02em] text-white/90 sm:text-xl">
                {step.title}
              </h3>
              <p className="mt-2.5 max-w-xs text-sm leading-relaxed text-white/45">
                {step.description}
              </p>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
