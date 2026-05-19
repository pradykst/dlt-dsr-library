"use client";

import { useMemo, useState } from "react";
import { sankey, sankeyLinkHorizontal } from "d3-sankey";
import { knowledgeEdges, getNodeById, papers } from "@/lib/knowledge";
import { Select } from "@/components/ui/Select";

const stages = ["problem", "requirement", "principle", "feature", "artifact", "evaluation", "pattern"];

export function SankeyExplorer({ compact = false }: { compact?: boolean }) {
  const [paperId, setPaperId] = useState("all");
  const graph = useMemo(() => {
    const stageNodes = new Map<string, { name: string; id: string; stage: number }>();
    const links: { source: string; target: string; value: number }[] = [];
    const candidateEdges = knowledgeEdges.filter((edge) => paperId === "all" || edge.paperIds?.includes(paperId));

    for (const edge of candidateEdges) {
      const source = getNodeById(edge.source);
      const target = getNodeById(edge.target);
      if (!source || !target) continue;
      const sourceStage = stages.indexOf(source.type);
      const targetStage = stages.indexOf(target.type);
      if (sourceStage === -1 || targetStage === -1) continue;
      stageNodes.set(source.id, { id: source.id, name: source.label, stage: sourceStage });
      stageNodes.set(target.id, { id: target.id, name: target.label, stage: targetStage });
      links.push({ source: source.id, target: target.id, value: edge.strength });
    }

    const nodes = Array.from(stageNodes.values());
    const index = new Map(nodes.map((node, i) => [node.id, i]));
    const sankeyGraph = sankey<{ name: string; id: string; stage: number }, { source: number; target: number; value: number }>()
      .nodeWidth(10)
      .nodePadding(compact ? 8 : 12)
      .extent([[1, 1], [1060, compact ? 260 : 340]])({
        nodes: nodes.map((node) => ({ ...node })),
        links: links.map((link) => ({ source: index.get(link.source) ?? 0, target: index.get(link.target) ?? 0, value: link.value }))
      });
    return sankeyGraph;
  }, [paperId, compact]);

  return (
    <section className="border border-line bg-white p-5 shadow-research">
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_260px] sm:items-end">
        <div>
          <h2 className="font-serif text-2xl text-ink">Design-Science Flow</h2>
          <p className="mt-1 text-sm text-muted">Problem to pattern flow across the seeded DLT design-science corpus.</p>
        </div>
        <Select value={paperId} onChange={(event) => setPaperId(event.target.value)} aria-label="Select paper for sankey flow">
          <option value="all">All papers</option>
          {papers.map((paper) => <option key={paper.id} value={paper.id}>{paper.shortTitle}</option>)}
        </Select>
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 1080 ${compact ? 280 : 370}`} className="min-w-[900px]">
          {graph.links.map((link, index) => (
            <path key={index} d={sankeyLinkHorizontal()(link) ?? undefined} fill="none" stroke="#9aa8b0" strokeOpacity={0.22} strokeWidth={Math.max(1, link.width ?? 1)} />
          ))}
          {graph.nodes.map((node) => (
            <g key={node.id}>
              <rect x={node.x0} y={node.y0} width={(node.x1 ?? 0) - (node.x0 ?? 0)} height={Math.max(3, (node.y1 ?? 0) - (node.y0 ?? 0))} fill={["#9b636d", "#77658f", "#5f7f67", "#a77b37", "#4d7a84", "#77766f", "#6f8a5d"][node.stage] ?? "#667085"} />
              <text x={(node.x0 ?? 0) + 14} y={(node.y0 ?? 0) + 12} className="fill-ink text-[10px]">
                {node.name.length > 36 ? `${node.name.slice(0, 34)}...` : node.name}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </section>
  );
}
