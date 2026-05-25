"use client";

import { useMemo, useState } from "react";
import type { DesignFlowExtraction, DsrField } from "@/lib/ingest/parser-types";
import { ingestFlowStages } from "@/lib/ingest/flow-builder";

export function IngestSankeyFlow({ flow, selectedId, onSelect }: { flow?: DesignFlowExtraction; selectedId?: string; onSelect: (field: DsrField) => void }) {
  const [tooltip, setTooltip] = useState<{ field: DsrField; x: number; y: number } | null>(null);
  const layout = useMemo(() => {
    if (!flow) return { nodes: [], edges: [] };
    const nodes = ingestFlowStages.flatMap((stage, stageIndex) => {
      const fields = flow[stage.key];
      return fields.map((field, index) => ({
        field,
        color: stage.color,
        stageIndex,
        x: 24 + stageIndex * 154,
        y: 42 + index * 78,
        width: 126,
        height: 46
      }));
    });
    const byId = new Map(nodes.map((node) => [node.field.id, node]));
    const edges = flow.edges.flatMap((edge) => {
      const source = byId.get(edge.sourceId);
      const target = byId.get(edge.targetId);
      return source && target ? [{ edge, source, target }] : [];
    });
    return { nodes, edges };
  }, [flow]);

  const height = Math.max(260, Math.max(...layout.nodes.map((node) => node.y + node.height + 24), 260));

  return (
    <section className="border border-line bg-white p-5 shadow-research">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-serif text-2xl text-ink">Generated Design-Science Flow</h2>
          <p className="mt-1 text-sm text-muted">Problem to pattern flow extracted from the uploaded paper text.</p>
        </div>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 border border-line bg-paper px-3 py-2 text-xs text-muted">
        {ingestFlowStages.map((stage, index) => (
          <div key={stage.key} className="flex items-center gap-2">
            <span className="h-3 w-3 border border-white" style={{ background: stage.color }} />
            <span>{stage.label}</span>
            {index < ingestFlowStages.length - 1 && <span className="text-line">-&gt;</span>}
          </div>
        ))}
      </div>
      {!flow ? (
        <div className="border border-line bg-paper p-6 text-sm text-muted">Upload and parse a PDF to render the flow.</div>
      ) : (
        <div className="relative overflow-x-auto border border-line bg-paper/40">
          <svg viewBox={`0 0 1080 ${height}`} className="min-w-[1000px]">
            {layout.edges.map(({ edge, source, target }) => {
              const x1 = source.x + source.width;
              const y1 = source.y + source.height / 2;
              const x2 = target.x;
              const y2 = target.y + target.height / 2;
              const mid = (x1 + x2) / 2;
              return <path key={`${edge.sourceId}-${edge.targetId}`} d={`M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`} fill="none" stroke="#9aa8b0" strokeOpacity={0.28} strokeWidth={Math.max(1, edge.confidence * 2)} />;
            })}
            {layout.nodes.map((node) => {
              const active = selectedId === node.field.id;
              return (
                <g
                  key={node.field.id}
                  tabIndex={0}
                  className="cursor-pointer"
                  onClick={() => onSelect(node.field)}
                  onMouseEnter={(event) => setTooltip({ field: node.field, x: event.clientX, y: event.clientY })}
                  onMouseMove={(event) => setTooltip({ field: node.field, x: event.clientX, y: event.clientY })}
                  onMouseLeave={() => setTooltip(null)}
                >
                  <rect x={node.x} y={node.y} width={node.width} height={node.height} fill="#fff" stroke={active ? node.color : "#d8d6cc"} strokeWidth={active ? 2 : 1} />
                  <rect x={node.x} y={node.y} width={5} height={node.height} fill={node.color} />
                  <text x={node.x + 12} y={node.y + 18} className="fill-ink text-[10px] font-semibold">
                    {node.field.label.length > 30 ? `${node.field.label.slice(0, 28)}...` : node.field.label}
                  </text>
                  <text x={node.x + 12} y={node.y + 34} className="fill-muted text-[9px]">
                    {Math.round(node.field.confidence * 100)}% confidence
                  </text>
                </g>
              );
            })}
          </svg>
          {tooltip && (
            <div className="pointer-events-none fixed z-50 max-w-sm border border-ink/20 bg-ink px-3 py-2 text-xs leading-5 text-white shadow-research" style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}>
              <div className="font-semibold">{tooltip.field.label}</div>
              <div className="mt-1 opacity-85">{tooltip.field.sourceQuote}</div>
              <div className="mt-1 opacity-70">Page {tooltip.field.pageNumber ?? "n/a"} · confidence {tooltip.field.confidence.toFixed(2)}</div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
