import type { Metadata } from "next";
import { ProductPageView } from "@/components/site/product-page-view";
import { SmartClipsVisual } from "@/components/site/product-visuals";
import { WorkflowPanel } from "@/components/site/workflow-panel";
import { productPages } from "@/lib/content";

export const metadata: Metadata = {
  title: "Smart Clips",
  description:
    "ClipForge scores every moment of your recording and returns ten complete, ready-to-post clips — not random slices.",
};

export default function SmartClipsPage() {
  return (
    <ProductPageView
      page={productPages["smart-clips"]}
      index="02"
      visual={<SmartClipsVisual />}
      featureVisual={<WorkflowPanel />}
      featureEyebrow="Workflow"
      featureTitle="The queue does the boring part."
      featureDescription="Upload once. ClipForge transcribes, scores and renders in the background while you keep working. Ten clips land with captions, thumbnails and SRT files attached."
    />
  );
}
