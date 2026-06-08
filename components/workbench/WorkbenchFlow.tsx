"use client";

import { useMemo, useState } from "react";
import ReactFlow, { Background, Controls, MarkerType, ReactFlowProvider, useReactFlow, type Edge, type Node } from "reactflow";
import "reactflow/dist/style.css";
import { Badge } from "@/components/ui/Badge";
import { includesToken } from "@/lib/workbench/csv";
import type { WorkbenchElement, WorkbenchEvidence, WorkbenchRelation } from "@/lib/workbench/types";
import { trackFlowInteraction } from "@/utils/analytics";

type Selection = { kind: "node"; element: WorkbenchElement } | { kind: "edge"; relation: WorkbenchRelation } | null;
type FlowMode = "main" | "extended";

const columns = ["Problem", "Design Requirement", "Design Principle", "Design Feature", "Artifact", "Evaluation", "Output Claim"];
const extendedColumns = [...columns, "Kernel Theory", "Boundary Condition", "Future Work"];
const colors: Record<string, string> = {
  Problem: "#f4d6dc",
  "Design Requirement": "#ded5eb",
  "Design Principle": "#d9eadc",
  "Design Feature": "#ead7b9",
  Artifact: "#cfe7e2",
  Evaluation: "#e5e7eb",
  "Output Claim": "#b8d1bf",
  "Kernel Theory": "#d5e2ef",
  "Boundary Condition": "#f0d6bd",
  "Future Work": "#d8dde5"
};

export function WorkbenchFlow({ elements, relations, evidence, onSuggest }: {
  elements: WorkbenchElement[];
  relations: WorkbenchRelation[];
  evidence: WorkbenchEvidence[];
  onSuggest: (target: { table: "elements" | "relations"; rowKey: string; field: string; oldValue: string }) => void;
}) {
  const { fitView } = useReactFlow();
  const paperId = elements[0]?.paper_id ?? relations[0]?.paper_id;
  const [mode, setMode] = useState<FlowMode>("main");
  const [selection, setSelection] = useState<Selection>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const elementById = useMemo(() => new Map(elements.map((element) => [element.element_id, element])), [elements]);
  const relationStats = useMemo(() => {
    let main = 0;
    let extended = 0;
    let extendedOnly = 0;
    for (const relation of relations) {
      if (relation.diagram_include !== true) continue;
      const view = normalizeDiagramView(relation.diagram_view);
      if (view === "Hidden") continue;
      const canRenderMain = relationCanRender(relation, columns, elementById);
      const canRenderExtended = relationCanRender(relation, extendedColumns, elementById);
      if (view === "Main" && canRenderMain) main += 1;
      if ((view === "Main" || view === "Extended") && canRenderExtended) extended += 1;
      if (view === "Extended" && canRenderExtended) extendedOnly += 1;
    }
    return { main, extended, extendedOnly };
  }, [elementById, relations]);
  const visibleRelations = useMemo(() => relations.filter((relation) => {
    if (relation.diagram_include !== true) return false;
    const view = normalizeDiagramView(relation.diagram_view);
    if (view === "Hidden") return false;
    if (mode === "main") return view === "Main";
    return view === "Main" || view === "Extended";
  }), [mode, relations]);
  const visibleColumns = mode === "main" ? columns : extendedColumns;
  const renderedRelations = useMemo(() => visibleRelations.filter((relation) => {
    const source = elementById.get(relation.source_node_id);
    const target = elementById.get(relation.target_node_id);
    return source && target && visibleColumns.includes(source.element_type ?? "") && visibleColumns.includes(target.element_type ?? "");
  }), [elementById, visibleColumns, visibleRelations]);
  const visibleNodeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const relation of renderedRelations) {
      ids.add(relation.source_node_id);
      ids.add(relation.target_node_id);
    }
    return ids;
  }, [renderedRelations]);
  const nodes: Node[] = useMemo(() => {
    const rowCount = new Map<string, number>();
    return elements
      .filter((element) => visibleNodeIds.has(element.element_id))
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
      .map((element) => {
        const column = Math.max(0, visibleColumns.indexOf(element.element_type ?? ""));
        const row = rowCount.get(element.element_type ?? "") ?? 0;
        rowCount.set(element.element_type ?? "", row + 1);
        return {
          id: element.element_id,
          position: { x: column * 250, y: row * 126 },
          data: { label: element.short_label ?? element.element_name ?? element.element_id },
          style: {
            width: 180,
            minHeight: 70,
            border: "1px solid #bdb8aa",
            borderRadius: 0,
            background: colors[element.element_type ?? ""] ?? "#ffffff",
            color: "#20242a",
            fontSize: 12,
            lineHeight: 1.4,
            whiteSpace: "normal",
            overflowWrap: "anywhere",
            padding: 10
          }
        };
      });
  }, [elements, visibleColumns, visibleNodeIds]);
  const selectedEdgeId = selection?.kind === "edge" ? selection.relation.relation_id : null;
  const edges: Edge[] = useMemo(() => renderedRelations.map((relation) => {
    const isFocused = relation.relation_id === hoveredEdgeId || relation.relation_id === selectedEdgeId;
    return {
      id: relation.relation_id,
      source: relation.source_node_id,
      target: relation.target_node_id,
      type: "smoothstep",
      label: isFocused ? relation.relation_type ?? undefined : undefined,
      markerEnd: { type: MarkerType.ArrowClosed, color: isFocused ? "#20242a" : "#4f6f91" },
      style: {
        stroke: isFocused ? "#20242a" : "#4f6f91",
        strokeWidth: isFocused ? 3 : Math.max(1.4, relation.confidence ?? 1),
        opacity: isFocused ? 0.95 : 0.56
      },
      labelStyle: { fill: "#20242a", fontSize: 10, fontWeight: 600 },
      labelBgStyle: { fill: "#ffffff", fillOpacity: 0.94 },
      labelBgPadding: [4, 3] as [number, number]
    };
  }), [hoveredEdgeId, renderedRelations, selectedEdgeId]);

  return (
    <div>
      <div className="mb-3 border border-line bg-white p-4 shadow-research">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
          <p className="text-sm leading-6 text-muted">This graph renders only approved stored relations. It does not infer links automatically.</p>
          <div className="flex flex-wrap items-center gap-2">
            <ModeButton active={mode === "main"} onClick={() => { setMode("main"); setSelection(null); window.setTimeout(() => fitView({ padding: 0.2 }), 80); }}>Main Flow ({relationStats.main})</ModeButton>
            <ModeButton active={mode === "extended"} onClick={() => { setMode("extended"); setSelection(null); window.setTimeout(() => fitView({ padding: 0.2 }), 80); }}>Extended Flow ({relationStats.extended})</ModeButton>
            <button className="border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink hover:border-blue" onClick={() => fitView({ padding: 0.2 })}>Fit view</button>
            <button className="border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink hover:border-blue" onClick={() => { setSelection(null); setHoveredEdgeId(null); fitView({ padding: 0.2 }); }}>Reset view</button>
          </div>
        </div>
        {mode === "extended" && relationStats.extendedOnly === 0 && (
          <p className="mt-2 text-xs text-muted">No Extended-only relations are stored for this paper, so Extended Flow currently matches Main Flow.</p>
        )}
        <Legend />
      </div>
      <div className="grid min-w-0 gap-0 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="h-[70vh] min-h-[520px] min-w-0 border border-line bg-white shadow-research lg:min-h-[650px]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            fitView
            minZoom={0.2}
            onNodeClick={(_, node) => {
              const element = elementById.get(node.id);
              if (element) {
                trackFlowInteraction("node_clicked", paperId);
                setSelection({ kind: "node", element });
              }
            }}
            onEdgeClick={(_, edge) => {
              const relation = renderedRelations.find((item) => item.relation_id === edge.id);
              if (relation) {
                trackFlowInteraction("edge_clicked", paperId);
                setSelection({ kind: "edge", relation });
              }
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

function FlowPanel({ selection, evidence, onSuggest }: {
  selection: Selection;
  evidence: WorkbenchEvidence[];
  onSuggest: (target: { table: "elements" | "relations"; rowKey: string; field: string; oldValue: string }) => void;
}) {
  if (!selection) return <aside className="min-h-40 border border-line bg-white p-5 text-sm text-muted lg:min-h-[650px] lg:border-l-0">Click a node or edge to inspect source details and evidence.</aside>;
  if (selection.kind === "node") {
    const element = selection.element;
    const relatedEvidence = evidence.filter((item) => item.evidence_id === element.source_quote_id || includesToken(item.element_ids_supported, element.element_id));
    return (
      <aside className="max-h-[70vh] min-h-40 overflow-y-auto border border-line bg-white p-5 lg:min-h-[650px] lg:border-l-0">
        <Badge>{displayElementType(element.element_type)}</Badge>
        <h2 className="mt-3 font-serif text-2xl text-ink">{element.element_name ?? element.element_id}</h2>
        <Details rows={[
          ["Element ID", element.element_id],
          ["Element Type", displayElementType(element.element_type)],
          ["Element Name", element.element_name],
          ["Element Text", element.element_text],
          ["Normalized Text", element.normalized_text],
          ["Source Status", element.source_status],
          ["Source Quote ID", element.source_quote_id],
          ["Page/Section", element.page_or_section],
          ["Kernel Theory/Rationale", element.kernel_theory_or_rationale],
          ["Evaluation Support", element.evaluation_support],
          ["Confidence", element.confidence?.toString()],
          ["Notes", element.notes]
        ]} />
        <button className="mt-4 border border-line bg-paper px-3 py-2 text-sm font-medium text-ink hover:border-blue" onClick={() => onSuggest({ table: "elements", rowKey: `${element.paper_id}:${element.element_id}`, field: "normalized_text", oldValue: element.normalized_text ?? "" })}>Suggest correction</button>
        <EvidenceList evidence={relatedEvidence} />
      </aside>
    );
  }
  const relation = selection.relation;
  const relatedEvidence = evidence.filter((item) => item.evidence_id === relation.evidence_id || includesToken(item.relation_ids_supported, relation.relation_id));
  return (
    <aside className="max-h-[70vh] min-h-40 overflow-y-auto border border-line bg-white p-5 lg:min-h-[650px] lg:border-l-0">
      <Badge>{relation.relation_type}</Badge>
      <h2 className="mt-3 font-serif text-2xl text-ink">{relation.relation_id}</h2>
      <Details rows={[
        ["Relation ID", relation.relation_id],
        ["Source node", relation.source_node_id],
        ["Relation type", relation.relation_type],
        ["Target node", relation.target_node_id],
        ["Evidence ID", relation.evidence_id],
        ["Source Status", relation.source_status],
        ["Confidence", relation.confidence?.toString()],
        ["Notes", relation.notes]
      ]} />
      <button className="mt-4 border border-line bg-paper px-3 py-2 text-sm font-medium text-ink hover:border-blue" onClick={() => onSuggest({ table: "relations", rowKey: `${relation.paper_id}:${relation.relation_id}`, field: "notes", oldValue: relation.notes ?? "" })}>Suggest correction</button>
      <EvidenceList evidence={relatedEvidence} />
    </aside>
  );
}

function Details({ rows }: { rows: [string, string | null | undefined][] }) {
  return <dl className="mt-4 space-y-3">{rows.map(([label, value]) => value ? <div key={label}><dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</dt><dd className="mt-1 break-words text-sm leading-6 text-ink"><LinkedText text={value} /></dd></div> : null)}</dl>;
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button className={active ? "border border-ink bg-ink px-3 py-1.5 text-xs font-medium text-white" : "border border-line bg-white px-3 py-1.5 text-xs font-medium text-muted hover:border-blue hover:text-ink"} onClick={onClick}>
      {children}
    </button>
  );
}

function Legend() {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {columns.map((label) => (
        <span key={label} className="inline-flex items-center gap-2 border border-line bg-paper px-2 py-1 text-[11px] uppercase tracking-[0.12em] text-muted">
          <span className="h-2.5 w-2.5 border border-ink/20" style={{ background: colors[label] }} />
          {displayElementType(label) === "Design Requirement" ? "Requirement" : displayElementType(label)}
        </span>
      ))}
    </div>
  );
}

function normalizeDiagramView(value: string | null | undefined) {
  if (!value) return "Main";
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === "main") return "Main";
  if (normalized === "extended") return "Extended";
  if (normalized === "hidden") return "Hidden";
  return value;
}

function displayElementType(value: string | null | undefined) {
  return value === "Boundary Condition" || value === "Boundary Conditions" ? "Limitations" : value;
}

function relationCanRender(relation: WorkbenchRelation, allowedColumns: string[], elementById: Map<string, WorkbenchElement>) {
  const source = elementById.get(relation.source_node_id);
  const target = elementById.get(relation.target_node_id);
  return Boolean(source && target && allowedColumns.includes(source.element_type ?? "") && allowedColumns.includes(target.element_type ?? ""));
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
          </div>
        ))}
        {evidence.length === 0 && <p className="text-sm text-muted">No linked evidence found.</p>}
      </div>
    </div>
  );
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
              <a href={href} target="_blank" rel="noreferrer" className="break-all text-blue underline decoration-blue/30 underline-offset-2 hover:text-ink">
                {href}
              </a>
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
