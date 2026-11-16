import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { CtaBand } from "@/components/site/cta-band";
import { Faq } from "@/components/site/faq";
import { Steps } from "@/components/site/feature-grid";
import { Hero } from "@/components/site/hero";
import { ModelCards } from "@/components/site/model-cards";
import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import { WorkflowPanel } from "@/components/site/workflow-panel";

const workflowPoints = [
  {
    title: "Ingest and probe",
    description:
      "Upload a file or point the worker at a public link. It downloads the source, checks the duration and confirms there is an audio track.",
  },
  {
    title: "Transcribe and rank",
    description:
      "Whisper produces word-level timing. Sentence-aligned windows are then scored on hooks, keywords, pace, emotion and length.",
  },
  {
    title: "Render and upload",
    description:
      "Each pick is center-cropped to the selected ratio, captioned, thumbnailed and uploaded with its SRT sidecar.",
  },
];

const simpleSteps = [
  {
    title: "Paste a YouTube URL",
    description:
      "Drop any public YouTube link or upload a file up to 2 hours. The worker downloads the source and extracts the audio.",
  },
  {
    title: "AI finds the highlights",
    description:
      "Whisper transcribes every word, then each moment is scored on hooks, pace and payoffs before it is cut to your chosen ratio.",
  },
  {
    title: "Export and post anywhere",
    description:
      "Download finished clips with burned-in captions, thumbnails and SRT sidecars, ready for TikTok, Reels, Shorts or X.",
  },
];

const stats = [
  { value: "2h", label: "maximum source" },
  { value: "10", label: "maximum clips" },
  { value: "3", label: "aspect ratios" },
  { value: "3", label: "caption presets" },
];

export default function Home() {
  return (
    <div className="overflow-hidden">
      <Hero />

      <section className="site-container mt-20 sm:mt-28">
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow="How it works"
            title="From YouTube video to viral clips in 3 simple steps."
          />
        </Reveal>
        <div className="mt-12 sm:mt-16">
          <Steps steps={simpleSteps} />
        </div>
      </section>

      <section className="site-container mt-20 sm:mt-28">
        <Reveal>
          <SectionHeading
            index="02"
            eyebrow="The pipeline"
            title="Built from the pipeline up."
            description="ClipForge is two pieces: a Next.js studio that queues jobs and a Python worker that transcribes, scores and renders. Every claim below maps to code in this repository."
            action={
              <Link
                href="/smart-clips"
                className="inline-flex items-center gap-1.5 text-sm text-white/55 transition-colors hover:text-lime"
              >
                How clipping works
                <ArrowRight className="size-4" />
              </Link>
            }
          />
        </Reveal>
        <Reveal delay={100} className="mt-10">
          <ModelCards />
        </Reveal>
      </section>

      <section className="site-container mt-20 sm:mt-28">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <Reveal>
            <SectionHeading
              index="03"
              eyebrow="Workflow"
              title={
                <>
                  Queue it once.
                  <br className="hidden sm:block" /> The worker does the rest.
                </>
              }
              description="Uploads and links become SQLite jobs. The worker claims each job, moves it through named stages and writes finished clips back to the database."
            />
            <div className="mt-8 space-y-5">
              {workflowPoints.map((point) => (
                <div key={point.title} className="flex gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-lime/30 bg-lime/10 text-lime">
                    <Check className="size-3" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white/80">
                      {point.title}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-white/40">
                      {point.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/studio"
              className="mt-8 inline-flex h-10 items-center gap-2 rounded-full border border-white/15 px-4 text-sm text-white/70 transition-colors hover:border-lime/40 hover:text-white"
            >
              Open the studio
              <ArrowRight className="size-4" />
            </Link>
          </Reveal>

          <Reveal delay={120}>
            <WorkflowPanel />
          </Reveal>
        </div>
      </section>

      <section className="mt-20 border-y border-white/[0.06] bg-[#0a0c08]/50 py-8 sm:mt-28">
        <div className="site-container grid grid-cols-2 gap-6 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center sm:text-left">
              <p className="font-display text-3xl font-semibold tracking-[-0.04em] text-lime sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="site-container mt-20 sm:mt-28">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <Reveal>
            <SectionHeading
              index="04"
              eyebrow="Questions"
              title="What the studio actually does."
              description="No hidden model calls, no fake performance numbers. The limits and behavior below are the ones enforced by the code."
            />
            <Link
              href="/studio"
              className="mt-6 inline-flex items-center gap-1.5 text-sm text-lime transition-opacity hover:opacity-80"
            >
              Try it with your own footage
              <ArrowRight className="size-4" />
            </Link>
          </Reveal>
          <Reveal delay={100}>
            <Faq />
          </Reveal>
        </div>
      </section>

      <CtaBand />
    </div>
  );
}
