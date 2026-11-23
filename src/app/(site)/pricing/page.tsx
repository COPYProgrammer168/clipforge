import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Infinity as InfinityIcon } from "lucide-react";
import { CtaBand } from "@/components/site/cta-band";
import { Faq } from "@/components/site/faq";
import { Reveal } from "@/components/site/reveal";

export const metadata: Metadata = {
  title: "Access",
  description:
    "ClipForge is unlimited and account-free: no processing caps, no watermark, no sign-up.",
};

const included = [
  "Unlimited processing minutes",
  "Up to 10 scored clips per video",
  "9:16, 1:1 and 16:9 exports",
  "Bold, clean, boxed and karaoke captions",
  "1080p MP4, SRT and thumbnails",
  "No watermark or export cap",
  "No account or credit card",
];

export default function PricingPage() {
  return (
    <div className="overflow-hidden">
      <section className="relative pt-16 sm:pt-24">
        <div className="lime-glow pointer-events-none absolute inset-x-0 top-0 h-[420px]" />
        <div className="site-container relative text-center">
          <Reveal>
            <p className="eyebrow-lime inline-flex items-center gap-2">
              Unlimited access
              <span className="h-px w-6 bg-white/10" />
            </p>
            <h1 className="display mx-auto mt-5 max-w-3xl text-[clamp(40px,6vw,72px)] leading-[0.96]">
              The whole forge.
              <span className="text-lime"> Unlimited.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-[15px] leading-relaxed text-white/50 sm:text-base">
              No account. No processing cap. No watermark. Open the studio, drop
              in your footage and keep every clip worth posting.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="site-container mt-12">
        <Reveal>
          <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="lime-ring relative flex flex-col overflow-hidden rounded-3xl border border-lime/40 bg-[#0f1409] p-7 sm:p-9">
              <div className="absolute -right-16 -top-20 size-64 rounded-full bg-lime/10 blur-3xl" />
              <span className="relative inline-flex w-fit items-center gap-1.5 rounded-full bg-lime px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-lime-ink">
                <InfinityIcon className="size-3" />
                Unlimited forge
              </span>
              <h2 className="display relative mt-6 text-3xl sm:text-4xl">
                Everything on.
              </h2>
              <p className="relative mt-3 max-w-lg text-sm leading-relaxed text-white/50">
                Every feature is available to everyone while ClipForge is in
                public beta. There is no paid tier hiding the useful parts.
              </p>
              <div className="relative mt-8 flex items-end gap-2">
                <span className="display text-6xl leading-none">$0</span>
                <span className="pb-1.5 text-xs text-white/40">
                  no account required
                </span>
              </div>
              <Link
                href="/studio"
                className="relative mt-8 inline-flex h-12 w-fit items-center gap-2 rounded-full bg-lime px-6 text-sm font-semibold text-lime-ink transition-transform hover:-translate-y-0.5"
              >
                Open the studio
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="panel rounded-3xl p-7 sm:p-9">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
                Included
              </p>
              <h2 className="display mt-4 text-2xl">No asterisks.</h2>
              <ul className="mt-6 space-y-3.5">
                {included.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2.5 text-sm text-white/60"
                  >
                    <Check className="mt-0.5 size-4 shrink-0 text-lime" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="site-container mt-20 sm:mt-24">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <Reveal>
            <div>
              <p className="eyebrow-lime">Questions</p>
              <h2 className="display mt-4 max-w-sm text-[clamp(28px,3.6vw,44px)] leading-[1.02]">
                Open access, explained.
              </h2>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <Faq />
          </Reveal>
        </div>
      </section>

      <CtaBand
        title="No login. No cap. Start clipping."
        description="Open the studio, upload a recording and keep every export. ClipForge is unlimited while it is in beta."
      />
    </div>
  );
}
