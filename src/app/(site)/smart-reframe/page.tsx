import type { Metadata } from "next";
import { ProductPageView } from "@/components/site/product-page-view";
import { ReframeVisual } from "@/components/site/product-visuals";
import { productPages } from "@/lib/content";

export const metadata: Metadata = {
  title: "Smart Reframe",
  description:
    "Subject-aware cropping keeps the speaker centred in 9:16, 1:1 and 16:9 — without manual keyframes.",
};

export default function SmartReframePage() {
  return (
    <ProductPageView
      page={productPages["smart-reframe"]}
      index="04"
      visual={<ReframeVisual />}
    />
  );
}
