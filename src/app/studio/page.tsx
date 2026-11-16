import type { Metadata } from "next";
import { StudioDashboard } from "@/components/studio/dashboard";

export const metadata: Metadata = {
  title: "Studio",
  description: "Upload footage and track your ClipForge jobs.",
};

export const dynamic = "force-dynamic";

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ link?: string; upload?: string }>;
}) {
  const params = await searchParams;
  const initialLink = typeof params.link === "string" ? params.link : undefined;

  return (
    <StudioDashboard
      initialLink={initialLink}
      autoOpenUpload={params.upload === "1"}
    />
  );
}
