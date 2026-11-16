import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal",
  description: "ClipForge demo privacy, terms and content-rights notes.",
};

export default function LegalPage() {
  return (
    <div className="site-container max-w-3xl pb-10 pt-16 sm:pt-24">
      <p className="eyebrow-lime">Legal</p>
      <h1 className="display mt-5 text-[clamp(36px,5vw,56px)] leading-[1]">
        The short, readable version.
      </h1>
      <p className="mt-5 text-sm leading-relaxed text-white/45">
        ClipForge is a demonstration project. This page explains how the demo
        handles data and what you may upload. It is not a substitute for legal
        advice for a production deployment.
      </p>

      <div className="mt-12 space-y-10 text-sm leading-relaxed text-white/55">
        <section>
          <h2 className="font-display text-xl font-medium text-white/85">
            Privacy
          </h2>
          <p className="mt-3">
            ClipForge does not require an account. Uploaded videos, transcripts
            and rendered clips are stored in the configured object store and
            tied to a single shared studio workspace. Anyone who can reach a
            deployment can access that workspace, so run ClipForge privately or
            add your own access control before exposing it publicly. Processing
            metadata is kept so you can revisit a job. The demo does not sell
            personal data or run third-party ad trackers.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-medium text-white/85">
            Terms of use
          </h2>
          <p className="mt-3">
            The service is provided as-is for evaluation. There are no account
            quotas in beta, but access or processing capacity may be adjusted to
            keep the deployment available. Do not use the service to break the
            law, infringe rights or circumvent technical protections on content
            you do not own.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-medium text-white/85">
            Content rights
          </h2>
          <p className="mt-3">
            Upload only footage you created or have explicit permission to
            repurpose. Downloading third-party videos through platform links can
            violate that platform&apos;s terms even when the content is public.
            You are responsible for the rights to every source file you submit.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-medium text-white/85">
            Trademarks
          </h2>
          <p className="mt-3">
            ClipForge is an original demo brand. Product names and creator
            profiles on this site are fictional. This project is not affiliated
            with, endorsed by or sponsored by any other video tool.
          </p>
        </section>
      </div>
    </div>
  );
}
