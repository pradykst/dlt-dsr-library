"use client";

import { useMemo, useState, type CSSProperties } from "react";
import ReactFlow, { Background, Controls, MarkerType, ReactFlowProvider, useReactFlow, type Edge, type Node } from "reactflow";
import "reactflow/dist/style.css";
import { Badge } from "@/components/ui/Badge";
import type { WorkbenchElement, WorkbenchEvidence, WorkbenchFlowGraph, WorkbenchRelation } from "@/lib/workbench/types";
import { trackFlowInteraction } from "@/utils/analytics";

type Selection =
  | { kind: "node"; element: WorkbenchElement }
  | { kind: "edge"; relation: WorkbenchRelation }
  | null;

type FlowMode = "recommended" | "focused" | "full";

const fullLayers = ["Problem", "Design Requirement", "Design Principle", "Design Feature", "Artifact", "Evaluation", "Output Knowledge"] as const;
const focusedLayers = ["Design Requirement", "Design Principle", "Design Feature"] as const;
const colors: Record<string, string> = {
  Problem: "#f4d6dc",
  "Design Requirement": "#ded5eb",
  "Design Principle": "#d9eadc",
  "Design Feature": "#ead7b9",
  Artifact: "#cfe7e2",
  Evaluation: "#e5e7eb",
  "Output Knowledge": "#b8d1bf"
};

export function WorkbenchFlow({
  flowGraph,
  elements,
  evidence,
  onSuggest
}: {
  flowGraph: WorkbenchFlowGraph;
  elements: WorkbenchElement[];
  relations: WorkbenchRelation[];
  evidence: WorkbenchEvidence[];
  onSuggest: (target: { table: "elements" | "relations"; rowKey: string; field: string; oldValue: string; targetOkfPath?: string }) => void;
}) {
  const { fitView } = useReactFlow();
  const paperId = elements[0]?.paper_id;
  const [mode, setMode] = useState<FlowMode>("recommended");
  const [selection, setSelection] = useState<Selection>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

  const graph = useMemo(() => graphForMode(flowGraph, mode), [flowGraph, mode]);
  const activeLayerCounts = useMemo(() => countVisibleLayers(graph.nodes), [graph.nodes]);
  const elementById = useMemo(() => new Map(graph.nodes.map((element) => [element.element_id, element])), [graph.nodes]);
  const relationById = useMemo(() => new Map(graph.relations.map((relation) => [relation.relation_id, relation])), [graph.relations]);
  const visibleLayers = useMemo(() => mode === "focused" ? [...focusedLayers] : [...fullLayers], [mode]);
  const selectedEdgeId = selection?.kind === "edge" ? selection.relation.relation_id : null;

  const nodes: Node[] = useMemo(() => {
    const rowByLayer = new Map<string, number>();
    const horizontalGap = mode === "focused" ? 300 : 260;
    return graph.nodes
      .slice()
      .sort((left, right) => (left.display_order ?? 0) - (right.display_order ?? 0) || left.element_id.localeCompare(right.element_id))
      .map((element) => {
        const layer = canonicalLayer(element);
        const column = Math.max(0, visibleLayers.indexOf(layer as never));
        const row = rowByLayer.get(layer) ?? 0;
        rowByLayer.set(layer, row + 1);
        return {
          id: element.element_id,
          className: `flow-node--${nodeClass(layer)}`,
          position: { x: column * horizontalGap, y: row * 150 },
          data: {
            label: (
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">{shortLayerLabel(layer)}</div>
                <div
                  className="mt-1 line-clamp-4 text-xs font-semibold leading-4 text-ink"
                  title={element.short_label ?? element.element_name ?? element.element_id}
                >
                  {element.short_label ?? element.element_name ?? element.element_id}
                </div>
                <div className="mt-2 text-[10px] text-muted">{element.evidence_count ?? 0} evidence item{element.evidence_count === 1 ? "" : "s"}</div>
              </div>
            )
          },
          style: nodeStyle(colors[layer] ?? "#ffffff")
        };
      });
  }, [graph.nodes, mode, visibleLayers]);

  const edges: Edge[] = useMemo(() => graph.relations.map((relation) => {
    const focused = relation.relation_id === hoveredEdgeId || relation.relation_id === selectedEdgeId;
    const color = relation.provenance === "graph_json" ? "#365f87" : "#687785";
    return {
      id: relation.relation_id,
      source: relation.source_node_id,
      target: relation.target_node_id,
      type: "smoothstep",
      className: `flow-edge--${relation.provenance === "graph_json" ? "graph-json" : "okf-relation"}`,
      label: focused ? relation.relation_type ?? undefined : undefined,
      markerEnd: { type: MarkerType.ArrowClosed, color: focused ? "#20242a" : color },
      style: {
        stroke: focused ? "#20242a" : color,
        strokeWidth: focused ? 3 : Math.max(1.5, relation.confidence ?? 1),
        opacity: focused ? 0.95 : 0.66
      },
      labelStyle: { fill: "#20242a", fontSize: 10, fontWeight: 600 },
      labelBgStyle: { fill: "#ffffff", fillOpacity: 0.94 },
      labelBgPadding: [4, 3] as [number, number]
    };
  }), [graph.relations, hoveredEdgeId, selectedEdgeId]);

  function switchMode(nextMode: FlowMode) {
    setMode(nextMode);
    setSelection(null);
    setHoveredEdgeId(null);
    window.setTimeout(() => fitView({ padding: 0.18, duration: 250 }), 80);
  }

  return (
    <div>
      <div className="mb-3 border border-line bg-white p-4 shadow-research">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
          <div>
            <p className="text-sm leading-6 text-muted">Only stored OKF relations are rendered. The UI never creates missing links.</p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted">
              <span>Source: <strong className="text-ink">{flowGraph.stored_flow_source === "graph_json" ? "graph.json recommendation" : "OKF relations fallback"}</strong></span>
              <span>Nodes: <strong className="text-ink">{graph.nodes.length}</strong></span>
              <span>Relations: <strong className="text-ink">{graph.relations.length}</strong></span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ModeButton active={mode === "recommended"} onClick={() => switchMode("recommended")}>Recommended Flow</ModeButton>
            <ModeButton active={mode === "focused"} onClick={() => switchMode("focused")}>Requirement → Principle → Feature</ModeButton>
            <ModeButton active={mode === "full"} onClick={() => switchMode("full")}>Full Relations</ModeButton>
            <button className="border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink hover:border-blue" onClick={() => fitView({ padding: 0.18, duration: 250 })}>Fit view</button>
          </div>
        </div>
        <LayerLegend layers={visibleLayers} counts={activeLayerCounts} />
        {mode === "recommended" && flowGraph.warnings.length > 0 && (
          <details className="mt-3 text-xs text-muted">
            <summary className="cursor-pointer">Projection notes ({flowGraph.warnings.length})</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5">{flowGraph.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul>
          </details>
        )}
      </div>

      {graph.relations.length === 0 ? (
        <div className="border border-line bg-white p-6 text-sm text-muted">No stored relations are available for this view.</div>
      ) : (
        <div className="grid min-w-0 gap-0 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="h-[72vh] min-h-[650px] min-w-0 border border-line bg-white shadow-research">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              fitView
              minZoom={0.12}
              onNodeClick={(_, node) => {
                const element = elementById.get(node.id);
                if (!element) return;
                trackFlowInteraction("node_clicked", paperId);
                setSelection({ kind: "node", element });
              }}
              onEdgeClick={(_, edge) => {
                const relation = relationById.get(edge.id);
                if (!relation) return;
                trackFlowInteraction("edge_clicked", paperId);
                setSelection({ kind: "edge", relation });
              }}
              onEdgeMouseEnter={(_, edge) => setHoveredEdgeId(edge.id)}
              onEdgeMouseLeave={() => setHoveredEdgeId(null)}
              onPaneClick={() => setSelection(null)}
            >
              <Background color="#d8d6cc" gap={28} />
              <Controls />
            </ReactFlow>
          </div>
          <FlowPanel selection={selection} evidence={evidence} onSuggest={onSuggest} />
        </div>
      )}
    </div>
  );
}

export function WorkbenchFlowProvider(props: Parameters<typeof WorkbenchFlow>[0]) {
  return (
    <ReactFlowProvider>
      <WorkbenchFlow {...props} />
    </ReactFlowProvider>
  );
}

function graphForMode(flowGraph: WorkbenchFlowGraph, mode: FlowMode) {
  if (mode === "recommended") return connectedGraph(flowGraph.recommended.nodes, flowGraph.recommended.relations);
  if (mode === "full") return connectedGraph(flowGraph.full.nodes, flowGraph.full.relations);
  return connectedGraph(flowGraph.focused.nodes, flowGraph.focused.relations);
}

function connectedGraph(nodes: WorkbenchElement[], relations: WorkbenchRelation[]) {
  const connectedIds = new Set(relations.flatMap((relation) => [relation.source_node_id, relation.target_node_id]));
  return {
    nodes: nodes.filter((node) => connectedIds.has(node.element_id)),
    relations: relations.filter((relation) => connectedIds.has(relation.source_node_id) && connectedIds.has(relation.target_node_id))
  };
}

function FlowPanel({
  selection,
  evidence,
  onSuggest
}: {
  selection: Selection;
  evidence: WorkbenchEvidence[];
  onSuggest: (target: { table: "elements" | "relations"; rowKey: string; field: string; oldValue: string; targetOkfPath?: string }) => void;
}) {
  if (!selection) {
    return <aside className="min-h-40 border border-line bg-white p-5 text-sm text-muted lg:min-h-[650px] lg:border-l-0">Click a node or relation to inspect its canonical OKF details, provenance, and evidence.</aside>;
  }

  if (selection.kind === "node") {
    const element = selection.element;
    const relatedEvidence = evidence.filter((item) => item.concept_id === element.element_id || splitTokens(item.element_ids_supported).includes(element.element_id));
    return (
      <aside className="max-h-[72vh] min-h-40 overflow-y-auto border border-line bg-white p-5 lg:min-h-[650px] lg:border-l-0">
        <Badge>{canonicalLayer(element)}</Badge>
        <h2 className="mt-3 break-words font-serif text-2xl text-ink">{element.element_name ?? element.element_id}</h2>
        <Details rows={[
          ["Concept ID", element.element_id],
          ["Description", element.normalized_text ?? element.element_text],
          ["Extraction type", element.source_status],
          ["Review status", element.review_status],
          ["Confidence", element.confidence_label ?? element.confidence?.toString()],
          ["Canonical file", element.okf_path]
        ]} />
        <button
          className="mt-4 border border-line bg-paper px-3 py-2 text-sm font-medium text-ink hover:border-blue"
          onClick={() => onSuggest({
            table: "elements",
            rowKey: element.element_id,
            field: element.canonical_field ?? "description",
            oldValue: element.normalized_text ?? "",
            targetOkfPath: element.okf_path
          })}
        >
          Report issue
        </button>
        <EvidenceList evidence={relatedEvidence} />
      </aside>
    );
  }

  const relation = selection.relation;
  const relatedEvidence = evidence.filter((item) => item.evidence_id === relation.evidence_id || splitTokens(item.relation_ids_supported).includes(relation.relation_id));
  return (
    <aside className="max-h-[72vh] min-h-40 overflow-y-auto border border-line bg-white p-5 lg:min-h-[650px] lg:border-l-0">
      <Badge>{relation.provenance === "graph_json" ? "graph.json" : "OKF relation"}</Badge>
      <h2 className="mt-3 break-words font-serif text-2xl text-ink">{relation.relation_type}</h2>
      <Details rows={[
        ["Relation ID", relation.relation_id],
        ["Source concept", relation.source_node_id],
        ["Predicate", relation.relation_type],
        ["Target concept", relation.target_node_id],
        ["Evidence ID", relation.evidence_id],
        ["Provenance", relation.provenance],
        ["Confidence", relation.confidence?.toString()],
        ["Canonical file", relation.okf_path]
      ]} />
      <button
        className="mt-4 border border-line bg-paper px-3 py-2 text-sm font-medium text-ink hover:border-blue"
        onClick={() => onSuggest({
          table: "relations",
          rowKey: relation.relation_id,
          field: "predicate",
          oldValue: relation.relation_type ?? "",
          targetOkfPath: relation.okf_path
        })}
      >
        Report issue
      </button>
      <EvidenceList evidence={relatedEvidence} />
    </aside>
  );
}

function LayerLegend({ layers, counts }: { layers: readonly string[]; counts: WorkbenchFlowGraph["layer_counts"] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {layers.map((layer) => (
        <span key={layer} className="inline-flex items-center gap-2 border border-line bg-paper px-2 py-1 text-[11px] uppercase tracking-[0.12em] text-muted">
          <span className="h-2.5 w-2.5 border border-ink/20" style={{ background: colors[layer] }} />
          {shortLayerLabel(layer)} <strong className="text-ink">{counts[layer as keyof typeof counts] ?? 0}</strong>
        </span>
      ))}
    </div>
  );
}

function Details({ rows }: { rows: Array<[string, string | null | undefined]> }) {
  return (
    <dl className="mt-4 space-y-3">
      {rows.map(([label, value]) => value ? (
        <div key={label}>
          <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</dt>
          <dd className="mt-1 break-words text-sm leading-6 text-ink"><LinkedText text={value} /></dd>
        </div>
      ) : null)}
    </dl>
  );
}

function EvidenceList({ evidence }: { evidence: WorkbenchEvidence[] }) {
  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold text-ink">Related Evidence</h3>
      <div className="mt-2 space-y-2">
        {evidence.map((item) => (
          <div key={item.evidence_id} className="max-w-full overflow-hidden border border-line bg-paper p-3">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{item.evidence_id} {item.page ? `Page ${item.page}` : ""}</div>
            <p className="mt-2 break-words text-sm leading-6 text-ink"><LinkedText text={item.exact_quote_or_description ?? ""} /></p>
            {item.section && <p className="mt-2 text-xs text-muted">Section: {item.section}</p>}
          </div>
        ))}
        {evidence.length === 0 && <p className="text-sm text-muted">No directly linked evidence found.</p>}
      </div>
    </div>
  );
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button className={active ? "border border-ink bg-ink px-3 py-1.5 text-xs font-medium text-white" : "border border-line bg-white px-3 py-1.5 text-xs font-medium text-muted hover:border-blue hover:text-ink"} onClick={onClick}>
      {children}
    </button>
  );
}

function countVisibleLayers(nodes: WorkbenchElement[]): WorkbenchFlowGraph["layer_counts"] {
  const counts: WorkbenchFlowGraph["layer_counts"] = {};
  for (const node of nodes) {
    const layer = canonicalLayer(node) as keyof WorkbenchFlowGraph["layer_counts"];
    counts[layer] = (counts[layer] ?? 0) + 1;
  }
  return counts;
}
function nodeStyle(background: string): CSSProperties {
  return {
    width: 220,
    height: 120,
    border: "1px solid #aaa597",
    borderRadius: 0,
    background,
    color: "#20242a",
    padding: 10,
    overflow: "hidden",
    overflowWrap: "anywhere",
    boxShadow: "0 0 0 4px rgba(255, 255, 255, 0.72)"
  };
}

function canonicalLayer(element: WorkbenchElement) {
  return element.canonical_type ?? element.element_type ?? "Problem";
}

function shortLayerLabel(layer: string) {
  if (layer === "Design Requirement") return "Requirement";
  if (layer === "Design Principle") return "Principle";
  if (layer === "Design Feature") return "Feature";
  return layer;
}

function nodeClass(layer: string) {
  return layer.toLowerCase().replace(/^design /, "").replace(/\s+/g, "-");
}

function splitTokens(value: string | null | undefined) {
  return (value ?? "").split(/[;,]/).map((token) => token.trim()).filter(Boolean);
}

function LinkedText({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s)\]}>"']+)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;
        if (/^https?:\/\//.test(part)) {
          const { href, trailing } = splitTrailingPunctuation(part);
          return (
            <span key={`${part}-${index}`}>
              <a href={href} target="_blank" rel="noreferrer" className="break-all text-blue underline decoration-blue/30 underline-offset-2 hover:text-ink">{href}</a>
              {trailing}
            </span>
          );
        }
        return <span key={`${part}-${index}`}>{part}</span>;
      })}
    </>
  );
}

function splitTrailingPunctuation(value: string) {
  const match = value.match(/^(.*?)([.,;:!?]+)$/);
  if (!match) return { href: value, trailing: "" };
  return { href: match[1], trailing: match[2] };
}
