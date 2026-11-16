import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CtaBand } from "@/components/site/cta-band";
import { Faq } from "@/components/site/faq";
import { FeatureGrid, Steps } from "@/components/site/feature-grid";
import { PageHero } from "@/components/site/page-hero";
import { Reveal } from "@/components/site/reveal";
import { SectionHeading } from "@/components/site/section-heading";
import type { ProductPage } from "@/lib/content";

export function ProductPageView({
  page,
  index,
  visual,
  featureVisual,
  featureEyebrow = "Inside the studio",
  featureTitle = "Built into every job.",
  featureDescription = "The same pipeline runs behind every job: download or upload, transcribe, score, render and upload the finished files.",
}: {
  page: ProductPage;
  index: string;
  visual: React.ReactNode;
  featureVisual?: React.ReactNode;
  featureEyebrow?: string;
  featureTitle?: string;
  featureDescription?: string;
}) {
  return (
    <div className="overflow-hidden">
      <PageHero
        eyebrow={page.eyebrow}
        index={index}
        title={page.title}
        description={page.description}
        stats={page.stats}
        secondaryHref="#how-it-works"
      >
        {visual}
      </PageHero>

      <section className="site-container mt-16 sm:mt-24">
        <Reveal>
          <SectionHeading
            index={`${index}A`}
            eyebrow="What it does"
            title="The details that make the difference."
            description="No single trick — a set of decisions that compound into clips people actually finish watching."
            action={
              <Link
                href="/studio"
                className="inline-flex items-center gap-1.5 text-sm text-white/55 transition-colors hover:text-lime"
              >
                Open studio
                <ArrowRight className="size-4" />
              </Link>
            }
          />
        </Reveal>
        <div className="mt-10">
          <FeatureGrid features={page.highlights} />
        </div>
      </section>

      <section id="how-it-works" className="site-container mt-20 scroll-mt-28 sm:mt-28">
        <Reveal>
          <SectionHeading
            index={`${index}B`}
            eyebrow="How it works"
            title="Three steps from raw footage to ready posts."
          />
        </Reveal>
        <div className="mt-10">
          <Steps steps={page.steps} />
        </div>
      </section>

      {featureVisual ? (
        <section className="site-container mt-20 sm:mt-28">
          <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
            <Reveal>
              <SectionHeading
                index={`${index}C`}
                eyebrow={featureEyebrow}
                title={featureTitle}
                description={featureDescription}
              />
              <Link
                href="/studio"
                className="mt-7 inline-flex h-10 items-center gap-2 rounded-full border border-white/15 px-4 text-sm text-white/70 transition-colors hover:border-lime/40 hover:text-white"
              >
                Open the studio
                <ArrowRight className="size-4" />
              </Link>
            </Reveal>
            <Reveal delay={100}>{featureVisual}</Reveal>
          </div>
        </section>
      ) : null}

      <section className="site-container mt-20 sm:mt-28">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <Reveal>
            <SectionHeading
              index={`${index}D`}
              eyebrow="Questions"
              title="The short answers."
              description="The full run-down lives in the studio. These are the things people ask before their first upload."
            />
          </Reveal>
          <Reveal delay={100}>
            <Faq limit={4} />
          </Reveal>
        </div>
      </section>

      <CtaBand
        title="Put it to work on your next recording."
        description={`${page.eyebrow} is included in the shared workspace. Processing is unlimited and every export is yours.`}
      />
    </div>
  );
}
