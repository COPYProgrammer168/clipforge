import type { Metadata } from "next";
import { JobDetail } from "@/components/studio/job-detail";

export const metadata: Metadata = {
  title: "Job",
  description: "Track a ClipForge processing job and download its clips.",
};

export const dynamic = "force-dynamic";

export default async function JobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <JobDetail jobId={id} />;
}
