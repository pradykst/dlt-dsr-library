import { ClusterOverview } from "@/components/home/ClusterOverview";
import { FeaturedPatterns } from "@/components/home/FeaturedPatterns";
import { Hero } from "@/components/home/Hero";
import { ResearchStats } from "@/components/home/ResearchStats";
import { SankeyExplorer } from "@/components/sankey/SankeyExplorer";
import { CoverageHeatmap } from "@/components/visuals/CoverageHeatmap";
import { PageShell } from "@/components/layout/PageShell";

export default function HomePage() {
  return (
    <PageShell className="space-y-10">
      <Hero />
      <ResearchStats />
      <ClusterOverview />
      <SankeyExplorer compact />
      <CoverageHeatmap />
      <FeaturedPatterns />
    </PageShell>
  );
}
