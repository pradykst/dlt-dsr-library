"use client";

import { useMemo, useState } from "react";
import { sankey, sankeyLinkHorizontal } from "d3-sankey";
import { Maximize2, Minimize2, Move, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { knowledgeEdges, getNodeById, papers } from "@/lib/knowledge";
import { Select } from "@/components/ui/Select";

const stages = ["problem", "requirement", "principle", "feature", "artifact", "evaluation", "pattern"];
const stageLegend = [
  { type: "Problem", color: "#9b636d" },
  { type: "Requirements", color: "#77658f" },
  { type: "Design principles", color: "#5f7f67" },
  { type: "Design features", color: "#a77b37" },
  { type: "Artifact", color: "#4d7a84" },
  { type: "Evaluation", color: "#77766f" },
  { type: "Reusable pattern", color: "#6f8a5d" }
];
const stageColors = stageLegend.map((item) => item.color);

export function SankeyExplorer({ compact = false }: { compact?: boolean }) {
  const [paperId, setPaperId] = useState("all");
  const [tooltip, setTooltip] = useState<{ label: string; x: number; y: number } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const [dragStart, setDragStart] = useState<{ x: number; y: number; viewX: number; viewY: number } | null>(null);
  const chartHeight = isFullscreen ? 760 : compact ? (paperId === "all" ? 420 : 280) : paperId === "all" ? 520 : 370;
  const layoutHeight = chartHeight - 30;
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
      .nodePadding(paperId === "all" ? 10 : compact ? 8 : 12)
      .extent([[1, 1], [1060, layoutHeight]])({
        nodes: nodes.map((node) => ({ ...node })),
        links: links.map((link) => ({ source: index.get(link.source) ?? 0, target: index.get(link.target) ?? 0, value: link.value }))
      });
    return sankeyGraph;
  }, [paperId, compact, layoutHeight]);

  const resetView = () => setView({ scale: 1, x: 0, y: 0 });
  const zoomBy = (delta: number) => setView((current) => ({ ...current, scale: Math.min(3, Math.max(0.65, Number((current.scale + delta).toFixed(2)))) }));
  const containerClassName = isFullscreen ? "fixed inset-4 z-50 overflow-hidden border border-line bg-white p-5 shadow-2xl" : "border border-line bg-white p-5 shadow-research";
  const svgClassName = isFullscreen ? "h-[calc(100vh-210px)] min-h-[560px] w-full cursor-grab active:cursor-grabbing" : "min-w-[900px] cursor-grab active:cursor-grabbing";

  return (
    <>
    {isFullscreen && (
      <button
        type="button"
        aria-label="Close fullscreen Sankey"
        className="fixed inset-0 z-40 bg-ink/25"
        onClick={() => setIsFullscreen(false)}
      />
    )}
    <section className={containerClassName}>
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_260px] sm:items-end">
        <div>
          <h2 className="font-serif text-2xl text-ink">Design-Science Flow</h2>
          <p className="mt-1 text-sm text-muted">
            Problem to pattern flow across the seeded DLT design-science corpus. Drag to pan and use zoom controls for dense all-paper views.
          </p>
        </div>
        <Select value={paperId} onChange={(event) => setPaperId(event.target.value)} aria-label="Select paper for sankey flow">
          <option value="all">All papers</option>
          {papers.map((paper) => <option key={paper.id} value={paper.id}>{paper.shortTitle}</option>)}
        </Select>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 border border-line bg-paper px-3 py-2 text-xs text-muted">
        {stageLegend.map((item, index) => (
          <div key={item.type} className="flex items-center gap-2">
            <span className="h-3 w-3 border border-white" style={{ background: item.color }} />
            <span>{item.type}</span>
            {index < stageLegend.length - 1 && <span className="text-line">-&gt;</span>}
          </div>
        ))}
      </div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted">
          <Move className="h-3.5 w-3.5" />
          Pan canvas, zoom for dense sections
        </div>
        <div className="flex items-center gap-1">
          <ControlButton label="Zoom out" onClick={() => zoomBy(-0.15)}><ZoomOut className="h-4 w-4" /></ControlButton>
          <span className="min-w-12 border border-line bg-paper px-2 py-1.5 text-center text-xs text-muted">{Math.round(view.scale * 100)}%</span>
          <ControlButton label="Zoom in" onClick={() => zoomBy(0.15)}><ZoomIn className="h-4 w-4" /></ControlButton>
          <ControlButton label="Reset view" onClick={resetView}><RotateCcw className="h-4 w-4" /></ControlButton>
          <ControlButton label={isFullscreen ? "Exit fullscreen" : "Open fullscreen"} onClick={() => { setIsFullscreen((current) => !current); resetView(); }}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </ControlButton>
        </div>
      </div>
      <div className={isFullscreen ? "relative overflow-hidden border border-line bg-paper" : "relative overflow-x-auto border border-line bg-paper/40"}>
        <svg
          viewBox={`0 0 1080 ${chartHeight}`}
          className={svgClassName}
          onWheel={(event) => {
            event.preventDefault();
            zoomBy(event.deltaY > 0 ? -0.08 : 0.08);
          }}
          onMouseDown={(event) => setDragStart({ x: event.clientX, y: event.clientY, viewX: view.x, viewY: view.y })}
          onMouseMove={(event) => {
            if (!dragStart) return;
            setTooltip(null);
            setView((current) => ({
              ...current,
              x: dragStart.viewX + (event.clientX - dragStart.x) / current.scale,
              y: dragStart.viewY + (event.clientY - dragStart.y) / current.scale
            }));
          }}
          onMouseUp={() => setDragStart(null)}
          onMouseLeave={() => {
            setDragStart(null);
            setTooltip(null);
          }}
        >
          <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
            {graph.links.map((link, index) => (
              <path key={index} d={sankeyLinkHorizontal()(link) ?? undefined} fill="none" stroke="#9aa8b0" strokeOpacity={0.22} strokeWidth={Math.max(1, link.width ?? 1)} />
            ))}
            {graph.nodes.map((node) => (
              <g
                key={node.id}
                className="cursor-help"
                tabIndex={0}
                onMouseEnter={(event) => setTooltip({ label: node.name, x: event.clientX, y: event.clientY })}
                onMouseMove={(event) => setTooltip({ label: node.name, x: event.clientX, y: event.clientY })}
                onMouseLeave={() => setTooltip(null)}
                onFocus={(event) => {
                  const box = event.currentTarget.getBoundingClientRect();
                  setTooltip({ label: node.name, x: box.left + box.width / 2, y: box.top });
                }}
                onBlur={() => setTooltip(null)}
              >
                <rect x={node.x0} y={node.y0} width={(node.x1 ?? 0) - (node.x0 ?? 0)} height={Math.max(3, (node.y1 ?? 0) - (node.y0 ?? 0))} fill={stageColors[node.stage] ?? "#667085"} />
                <text
                  x={(node.x0 ?? 0) > 930 ? (node.x0 ?? 0) - 8 : (node.x1 ?? 0) + 6}
                  y={(node.y0 ?? 0) + 12}
                  textAnchor={(node.x0 ?? 0) > 930 ? "end" : "start"}
                  className="fill-ink text-[10px]"
                >
                  {node.name.length > 36 ? `${node.name.slice(0, 34)}...` : node.name}
                </text>
              </g>
            ))}
          </g>
        </svg>
        {tooltip && (
          <div
            className="pointer-events-none fixed z-50 max-w-xs border border-ink/20 bg-ink px-3 py-2 text-xs leading-5 text-white shadow-research"
            style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
          >
            {tooltip.label}
          </div>
        )}
      </div>
    </section>
    </>
  );
}

function ControlButton({ children, label, onClick }: { children: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center border border-line bg-white text-muted transition hover:border-blue hover:text-ink"
    >
      {children}
    </button>
  );
}
