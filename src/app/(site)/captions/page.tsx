import type { Metadata } from "next";
import { EditorMock } from "@/components/site/editor-mock";
import { ProductPageView } from "@/components/site/product-page-view";
import { CaptionsVisual } from "@/components/site/product-visuals";
import { productPages } from "@/lib/content";

export const metadata: Metadata = {
  title: "Captions",
  description:
    "Word-accurate captions with deliberate typography and emphasis. Export burned-in or as clean SRT.",
};

export default function CaptionsPage() {
  return (
    <ProductPageView
      page={productPages["captions"]}
      index="05"
      visual={<CaptionsVisual />}
      featureVisual={<EditorMock />}
      featureEyebrow="Caption studio"
      featureTitle="Type, emphasis and timing under one roof."
      featureDescription="Caption styling lives where the edit lives. Change the font, colour and emphasis words, then re-render without leaving the timeline."
    />
  );
}
