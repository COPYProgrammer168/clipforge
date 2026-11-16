import type { Metadata } from "next";
import { ProductPageView } from "@/components/site/product-page-view";
import { TeamVisual } from "@/components/site/product-visuals";
import { TeamCards } from "@/components/site/team-cards";
import { productPages } from "@/lib/content";

export const metadata: Metadata = {
  title: "Team Workspace",
  description:
    "A shared clipping workspace with brand kits, review states, API access and predictable usage limits.",
};

export default function TeamWorkspacePage() {
  return (
    <ProductPageView
      page={productPages["team-workspace"]}
      index="06"
      visual={<TeamVisual />}
      featureVisual={<TeamCards />}
      featureEyebrow="Built for teams"
      featureTitle="Consistency without micromanagement."
      featureDescription="Lock the brand kit, set the approval flow and let the queue handle the rest. Everyone sees the same cuts, the same rules and the same usage."
    />
  );
}
