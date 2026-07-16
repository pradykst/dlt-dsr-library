"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import ReactFlow, {
  Background,
  BaseEdge,
  Controls,
  EdgeLabelRenderer,
  Handle,
  MarkerType,
  Position,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps
} from "reactflow";
import "reactflow/dist/style.css";
import { Badge } from "@/components/ui/Badge";
import { flowEdgePathGeometry, layoutProjectedFlow, type FlowLayout, type FlowLayoutEdge, type FlowLayoutHandle } from "@/lib/okf/flow-layout";
import type {
  WorkbenchElement,
  WorkbenchEvidence,
  WorkbenchFlowGraph,
  WorkbenchFlowView,
  WorkbenchRelation
} from "@/lib/workbench/types";
import { trackFlowInteraction } from "@/utils/analytics";

export type WorkbenchVisibleFlowMode = "source" | "recommended" | "full";
type Selection = { kind: "node" | "edge"; id: string } | null;
type FlowNodeData = {
  element: WorkbenchElement;
  handles: FlowLayoutHandle[];
  selected: boolean;
  related: boolean;
  dimmed: boolean;
};
type DirectEdgeData = { pathKind: FlowLayoutEdge["path_kind"]; controlPoints: FlowLayoutEdge["control_points"]; curveSegments: FlowLayoutEdge["curve_segments"]; showLabel: boolean; label: string };

const colors: Record<string, string> = {
  Problem: "#f4d6dc",
  "Design Requirement": "#ded5eb",
  "Design Principle": "#d9eadc",
  "Design Feature": "#ead7b9",
  Artifact: "#cfe7e2",
  Evaluation: "#e5e7eb",
  "Output Knowledge": "#b8d1bf"
};
const nodeTypes = { okfFlowNode: FlowNode };
const edgeTypes = { directFlow: DirectFlowEdge };

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
  onSuggest: (target: { targetType: "concept" | "relation"; targetId: string; field: string; currentValue: string; targetOkfPath?: string }) => void;
}) {
  const { fitView, setViewport } = useReactFlow();
  const sourceViews = useMemo(() => flowGraph.source_views ?? [], [flowGraph.source_views]);
  const [mode, setMode] = useState<WorkbenchVisibleFlowMode>(sourceViews.length ? "source" : "recommended");
  const [sourceViewId, setSourceViewId] = useState(sourceViews[0]?.source_view_id ?? "");
  const [selection, setSelection] = useState<Selection>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const paperId = elements[0]?.paper_id;
  const view = useMemo(() => {
    if (mode === "source") return sourceViews.find((candidate) => candidate.source_view_id === sourceViewId) ?? sourceViews[0] ?? flowGraph.recommended;
    return mode === "full" ? flowGraph.full : flowGraph.recommended;
  }, [flowGraph.full, flowGraph.recommended, mode, sourceViewId, sourceViews]);
  const elementById = useMemo(() => new Map(view.nodes.map((element) => [element.element_id, element])), [view.nodes]);
  const nodeOrder = useMemo(() => Object.fromEntries(view.layers.map((layer) => [
    layer,
    view.ordered_node_ids.filter((id) => elementById.get(id)?.canonical_type === layer)
  ])), [elementById, view.layers, view.ordered_node_ids]);
  const layoutInput = useMemo(() => ({
    nodes: view.nodes.map((element) => ({
      id: element.element_id,
      type: canonicalLayer(element),
      title: element.short_label ?? element.element_name ?? element.element_id
    })),
    edges: view.relations.map((relation) => ({
      id: relation.relation_id,
      source: relation.source_node_id,
      target: relation.target_node_id
    })),
    layers: view.layers,
    node_order: nodeOrder,
    layout_hints: view.layout_hints
  }), [nodeOrder, view]);
  const [layoutResult, setLayoutResult] = useState<{
    input: typeof layoutInput;
    layout: FlowLayout | null;
    error: string | null;
  } | null>(null);
  useEffect(() => {
    let cancelled = false;
    void layoutProjectedFlow(layoutInput)
      .then((nextLayout) => {
        if (!cancelled) setLayoutResult({ input: layoutInput, layout: nextLayout, error: null });
      })
      .catch((error: unknown) => {
        if (!cancelled) setLayoutResult({
          input: layoutInput,
          layout: null,
          error: error instanceof Error ? error.message : "The stored graph could not be arranged."
        });
      });
    return () => {
      cancelled = true;
    };
  }, [layoutInput]);
  const layout = layoutResult?.input === layoutInput ? layoutResult.layout : null;
  const layoutError = layoutResult?.input === layoutInput ? layoutResult.error : null;
  const focus = useMemo(() => selectionFocus(view, selection), [selection, view]);
  const layoutNodes = useMemo(() => layout?.nodes ?? [], [layout]);
  const layoutEdges = useMemo(() => layout?.edges ?? [], [layout]);
  const handlesByNode = useMemo(() => layout?.handles_by_node ?? {}, [layout]);
  const layoutNodeById = useMemo(() => new Map(layoutNodes.map((node) => [node.id, node])), [layoutNodes]);
  const layoutEdgeById = useMemo(() => new Map(layoutEdges.map((edge) => [edge.id, edge])), [layoutEdges]);

  const nodes: Node<FlowNodeData>[] = useMemo(() => view.nodes.flatMap((element) => {
    const positioned = layoutNodeById.get(element.element_id);
    if (!positioned) return [];
    const selected = selection?.kind === "node" && selection.id === element.element_id;
    const related = Boolean(selection && focus.nodeIds.has(element.element_id));
    return [{
      id: element.element_id,
      type: "okfFlowNode",
      className: `flow-node--${nodeClass(canonicalLayer(element))}`,
      position: { x: positioned.x, y: positioned.y },
      data: {
        element,
        handles: handlesByNode[element.element_id] ?? [],
        selected,
        related,
        dimmed: Boolean(selection && !related)
      },
      style: {
        width: positioned.width,
        height: positioned.height,
        opacity: selection && !related ? 0.32 : 1,
        transition: "opacity 140ms ease"
      },
      draggable: false,
      selectable: true
    }];
  }), [focus.nodeIds, handlesByNode, layoutNodeById, selection, view.nodes]);

  const edges: Edge<DirectEdgeData>[] = useMemo(() => view.relations.flatMap((relation) => {
    const positioned = layoutEdgeById.get(relation.relation_id);
    if (!positioned) return [];
    const selected = selection?.kind === "edge" && selection.id === relation.relation_id;
    const related = Boolean(selection && focus.edgeIds.has(relation.relation_id));
    const hovered = hoveredEdgeId === relation.relation_id;
    const dimmed = Boolean(selection && !related);
    const color = edgeColor(relation);
    return [{
      id: relation.relation_id,
      source: relation.source_node_id,
      target: relation.target_node_id,
      sourceHandle: positioned.source_handle,
      targetHandle: positioned.target_handle,
      type: "directFlow",
      className: `flow-edge--stored flow-edge--${edgeClass(relation)}`,
      markerEnd: { type: MarkerType.ArrowClosed, color: selected || hovered ? "#20242a" : color },
      data: {
        pathKind: positioned.path_kind,
        controlPoints: positioned.control_points,
        curveSegments: positioned.curve_segments,
        showLabel: showLabels || selected || hovered,
        label: relation.relation_type ?? "related to"
      },
      style: {
        stroke: selected || hovered ? "#20242a" : color,
        strokeWidth: selected ? 3.2 : hovered || related ? 2.5 : 1.8,
        strokeDasharray: relation.extraction_type === "inferred" || relation.provenance === "inferred" ? "7 5" : undefined,
        opacity: dimmed ? 0.12 : selected || hovered ? 1 : 0.76
      }
    }];
  }), [focus.edgeIds, hoveredEdgeId, layoutEdgeById, selection, showLabels, view.relations]);

  function switchMode(nextMode: WorkbenchVisibleFlowMode) {
    setMode(nextMode);
    setSelection(null);
    setHoveredEdgeId(null);
    window.setTimeout(() => fitView({ padding: 0.14, duration: 250, minZoom: 0.32, maxZoom: 1 }), 60);
  }

  function resetView() {
    setSelection(null);
    setHoveredEdgeId(null);
    void setViewport({ x: 32, y: 32, zoom: 0.85 }, { duration: 250 });
  }

  async function toggleFullscreen() {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await canvasRef.current?.requestFullscreen();
    window.setTimeout(() => fitView({ padding: 0.14, duration: 250, minZoom: 0.32, maxZoom: 1 }), 80);
  }

  return (
    <div className="w-full min-w-0" data-flow-full-width="true">
      <div className="mb-3 border border-line bg-white p-4 shadow-research">
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="font-serif text-2xl text-ink">{view.title}</h2>
              <span className="text-sm text-muted">{view.subtitle}</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-muted">Only stored canonical concepts and relations are rendered. This view never creates missing links.</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
              <span>Projection: <strong className="text-ink">{projectionSourceLabel(view)}</strong></span>
              <span>Nodes: <strong className="text-ink">{view.nodes.length}</strong></span>
              <span>Relations: <strong className="text-ink">{view.relations.length}</strong></span>
              {view.mode === "source_figure" && <span>Semantic status: <strong className="text-ink">{validationLabel(view.validation.semantic_status)}</strong></span>}
            </div>
            {view.mode === "source_figure" && view.source_reference && <SourceReference view={view} />}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {sourceViews.length > 0 && <ModeButton active={mode === "source"} onClick={() => switchMode("source")}>Source Figure</ModeButton>}
            <ModeButton active={mode === "recommended"} onClick={() => switchMode("recommended")}>Recommended Flow</ModeButton>
            <ModeButton active={mode === "full"} onClick={() => switchMode("full")}>Full Relations / Advanced</ModeButton>
          </div>
        </div>
        {mode === "source" && sourceViews.length > 1 && (
          <label className="mt-4 block max-w-xl text-xs font-semibold uppercase tracking-[0.1em] text-muted">
            Source view
            <select
              className="mt-1 block w-full border border-line bg-white px-3 py-2 text-sm normal-case tracking-normal text-ink"
              value={view.source_view_id ?? sourceViewId}
              onChange={(event) => { setSourceViewId(event.target.value); setSelection(null); }}
            >
              {sourceViews.map((candidate) => <option key={candidate.source_view_id ?? candidate.title} value={candidate.source_view_id ?? ""}>{candidate.title}</option>)}
            </select>
          </label>
        )}
        <LayerLegend layers={view.layers} nodes={view.nodes} />
        <EdgeLegend />
        {(view.warnings.length > 0 || (mode === "recommended" && flowGraph.warnings.length > 0)) && (
          <details className="mt-3 text-xs text-muted">
            <summary className="cursor-pointer">Projection notes</summary>
            <ul className="mt-2 list-disc space-y-1 pl-5">{[...new Set([...view.warnings, ...(mode === "recommended" ? flowGraph.warnings : [])])].map((warning) => <li key={warning}>{warning}</li>)}</ul>
          </details>
        )}
      </div>

      {view.relations.length === 0 ? (
        <div className="border border-line bg-white p-6 text-sm text-muted">No stored relations are available for this view.</div>
      ) : layoutError ? (
        <div className="border border-line bg-white p-6 text-sm text-muted">The stored graph could not be arranged: {layoutError}</div>
      ) : !layout ? (
        <div className="flex h-[720px] min-h-[720px] w-full items-center justify-center border border-line bg-white text-sm text-muted">Arranging the stored graph…</div>
      ) : (
        <div
          ref={canvasRef}
          className="relative h-[720px] min-h-[720px] w-full min-w-0 overflow-hidden border border-line bg-white shadow-research xl:h-[min(82vh,850px)] xl:min-h-[760px]"
          data-flow-canvas="full-width"
        >
          <div className="absolute left-3 top-3 z-20 flex flex-wrap gap-2 rounded-sm border border-line bg-white/95 p-2 shadow-research">
            <ToolbarButton onClick={() => fitView({ padding: 0.14, duration: 250, minZoom: 0.32, maxZoom: 1 })}>Fit view</ToolbarButton>
            <ToolbarButton onClick={resetView}>Reset view</ToolbarButton>
            <ToolbarButton disabled={!selection} onClick={() => setSelection(null)}>Reset selection</ToolbarButton>
            <ToolbarButton onClick={() => void toggleFullscreen()}>Fullscreen</ToolbarButton>
            <ToolbarButton active={showLabels} onClick={() => setShowLabels((value) => !value)}>Relation labels</ToolbarButton>
          </div>
          <ReactFlow
            className="h-full w-full"
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.14, minZoom: 0.32, maxZoom: 1 }}
            minZoom={0.32}
            maxZoom={1.8}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable
            onNodeClick={(_, node) => {
              trackFlowInteraction("node_clicked", paperId);
              setSelection({ kind: "node", id: node.id });
            }}
            onEdgeClick={(_, edge) => {
              trackFlowInteraction("edge_clicked", paperId);
              setSelection({ kind: "edge", id: edge.id });
            }}
            onEdgeMouseEnter={(_, edge) => setHoveredEdgeId(edge.id)}
            onEdgeMouseLeave={() => setHoveredEdgeId(null)}
            onPaneClick={() => setSelection(null)}
          >
            <Background color="#d8d6cc" gap={28} />
            <Controls position="bottom-left" />
          </ReactFlow>
          {selection && (
            <div className="absolute bottom-3 right-3 top-16 z-30 w-[min(390px,calc(100%-24px))] overflow-y-auto border border-line bg-white/98 p-5 shadow-xl">
              <button type="button" className="float-right border border-line px-2 py-1 text-xs text-muted hover:border-blue hover:text-ink" onClick={() => setSelection(null)}>Close</button>
              <FlowPanel selection={selection} view={view} evidence={evidence} onSuggest={onSuggest} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function WorkbenchFlowProvider(props: Parameters<typeof WorkbenchFlow>[0]) {
  return <ReactFlowProvider><WorkbenchFlow {...props} /></ReactFlowProvider>;
}

function FlowNode({ data }: NodeProps<FlowNodeData>) {
  const element = data.element;
  const layer = canonicalLayer(element);
  return (
    <div
      className="h-full w-full border p-3 text-ink shadow-[0_0_0_4px_rgba(255,255,255,0.72)]"
      style={{
        background: colors[layer] ?? "#ffffff",
        borderColor: data.selected ? "#20242a" : data.related ? "#365f87" : "#aaa597",
        borderWidth: data.selected ? 2 : 1
      }}
    >
      {data.handles.map((handle) => (
        <Handle
          key={handle.id}
          id={handle.id}
          type={handle.side}
          position={reactFlowPosition(handle.position)}
          isConnectable={false}
          className="!h-2 !w-2 !border !border-white !bg-slate-600"
          style={handleOffsetStyle(handle)}
        />
      ))}
      <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">{shortLayerLabel(layer)}</div>
      <div className="mt-1 line-clamp-4 text-xs font-semibold leading-4" title={element.short_label ?? element.element_name ?? element.element_id}>
        {element.short_label ?? element.element_name ?? element.element_id}
      </div>
      <div className="mt-2 text-[10px] text-muted">{element.evidence_count ?? 0} evidence item{element.evidence_count === 1 ? "" : "s"}</div>
    </div>
  );
}

function DirectFlowEdge(props: EdgeProps<DirectEdgeData>) {
  const geometry = flowEdgePathGeometry(
    {
      path_kind: props.data?.pathKind ?? "straight",
      control_points: props.data?.controlPoints ?? null,
      curve_segments: props.data?.curveSegments ?? null
    },
    { x: props.sourceX, y: props.sourceY },
    { x: props.targetX, y: props.targetY }
  );
  return (
    <>
      <BaseEdge path={geometry.path} markerEnd={props.markerEnd} style={props.style} interactionWidth={props.interactionWidth ?? 18} />
      {props.data?.showLabel && (
        <EdgeLabelRenderer>
          <div
            className="pointer-events-none absolute border border-line bg-white/95 px-2 py-1 text-[10px] font-semibold text-ink shadow-sm"
            style={{ transform: `translate(-50%, -50%) translate(${geometry.label_x}px, ${geometry.label_y}px)` }}
          >
            {props.data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

function FlowPanel({
  selection,
  view,
  evidence,
  onSuggest
}: {
  selection: NonNullable<Selection>;
  view: WorkbenchFlowView;
  evidence: WorkbenchEvidence[];
  onSuggest: (target: { targetType: "concept" | "relation"; targetId: string; field: string; currentValue: string; targetOkfPath?: string }) => void;
}) {
  if (selection.kind === "node") {
    const element = view.nodes.find((candidate) => candidate.element_id === selection.id);
    if (!element) return null;
    const relatedEvidence = evidence.filter((item) => item.concept_id === element.element_id || splitTokens(item.element_ids_supported).includes(element.element_id));
    return (
      <div>
        <Badge>{canonicalLayer(element)}</Badge>
        <h3 className="mt-3 break-words font-serif text-2xl text-ink">{element.element_name ?? element.element_id}</h3>
        <Details rows={[
          ["Description", element.normalized_text ?? element.element_text],
          ["Extraction type", element.source_status],
          ["Review status", reviewStatusLabel(element.review_status)],
          ["Confidence", element.confidence_label ?? element.confidence?.toString()],
          ["Canonical file", element.okf_path]
        ]} />
        <AdvancedId label="Concept ID" value={element.element_id} />
        <button className="mt-4 border border-line bg-paper px-3 py-2 text-sm font-medium text-ink hover:border-blue" onClick={() => onSuggest({
          targetType: "concept",
          targetId: element.element_id,
          field: element.canonical_field ?? "description",
          currentValue: element.normalized_text ?? "",
          targetOkfPath: element.okf_path
        })}>Report issue</button>
        <EvidenceList evidence={relatedEvidence} />
      </div>
    );
  }

  const relation = view.relations.find((candidate) => candidate.relation_id === selection.id);
  if (!relation) return null;
  const source = view.nodes.find((node) => node.element_id === relation.source_node_id);
  const target = view.nodes.find((node) => node.element_id === relation.target_node_id);
  const relatedEvidence = evidence.filter((item) => item.evidence_id === relation.evidence_id || splitTokens(item.relation_ids_supported).includes(relation.relation_id));
  return (
    <div>
      <Badge>{edgeProvenanceLabel(relation)}</Badge>
      <h3 className="mt-3 break-words font-serif text-xl text-ink">{source?.element_name ?? "Source"} → {target?.element_name ?? "Target"}</h3>
      <Details rows={[
        ["Predicate", relation.relation_type],
        ["Extraction type", relation.extraction_type],
        ["Confidence", relation.confidence?.toString()],
        ["Source-view membership", relation.source_view_ids?.join(", ")],
        ["Source reference", view.mode === "source_figure" ? sourceReferenceText(view) : null],
        ["Canonical file", relation.okf_path]
      ]} />
      <AdvancedId label="Relation ID" value={relation.relation_id} />
      <button className="mt-4 border border-line bg-paper px-3 py-2 text-sm font-medium text-ink hover:border-blue" onClick={() => onSuggest({
        targetType: "relation",
        targetId: relation.relation_id,
        field: "predicate",
        currentValue: relation.relation_type ?? "",
        targetOkfPath: relation.okf_path
      })}>Report issue</button>
      <EvidenceList evidence={relatedEvidence} />
    </div>
  );
}

function SourceReference({ view }: { view: WorkbenchFlowView }) {
  const reference = view.source_reference;
  if (!reference) return null;
  return (
    <div className="mt-3 border-l-2 border-blue/30 pl-3 text-xs leading-5 text-muted">
      <span className="font-medium text-ink">Source:</span> {sourceReferenceText(view)}
      {reference.caption && <span className="mt-1 block text-ink">{reference.caption}</span>}
      <span className="mt-1 block">Visual status: {visualParityLabel(view.validation.visual_parity)}. Layout is a deterministic rendering, not a claim of pixel-exact reproduction.</span>
    </div>
  );
}

function LayerLegend({ layers, nodes }: { layers: WorkbenchFlowView["layers"]; nodes: WorkbenchElement[] }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {layers.map((layer) => (
        <span key={layer} className="inline-flex items-center gap-2 border border-line bg-paper px-2 py-1 text-[11px] uppercase tracking-[0.12em] text-muted">
          <span className="h-2.5 w-2.5 border border-ink/20" style={{ background: colors[layer] }} />
          {shortLayerLabel(layer)} <strong className="text-ink">{nodes.filter((node) => canonicalLayer(node) === layer).length}</strong>
        </span>
      ))}
    </div>
  );
}

function EdgeLegend() {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted" aria-label="Relation provenance legend">
      <LegendLine color="#20242a" label="Source-view explicit" />
      <LegendLine color="#365f87" label="Explicit stored" />
      <LegendLine color="#7292a6" label="Explicit in artifact" />
      <LegendLine color="#687785" dashed label="Inferred stored" />
    </div>
  );
}

function LegendLine({ color, label, dashed = false }: { color: string; label: string; dashed?: boolean }) {
  return <span className="inline-flex items-center gap-2"><span className="w-8 border-t-2" style={{ borderColor: color, borderTopStyle: dashed ? "dashed" : "solid" }} />{label}</span>;
}

function Details({ rows }: { rows: Array<[string, string | null | undefined]> }) {
  return <dl className="mt-4 space-y-3">{rows.map(([label, value]) => value ? <div key={label}><dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</dt><dd className="mt-1 break-words text-sm leading-6 text-ink"><LinkedText text={value} /></dd></div> : null)}</dl>;
}

function AdvancedId({ label, value }: { label: string; value: string }) {
  return <details className="mt-4 text-xs text-muted"><summary className="cursor-pointer font-medium text-ink">Advanced identity</summary><p className="mt-2 break-all"><strong>{label}:</strong> {value}</p></details>;
}

function EvidenceList({ evidence }: { evidence: WorkbenchEvidence[] }) {
  return (
    <div className="mt-6">
      <h4 className="text-sm font-semibold text-ink">Related evidence</h4>
      <div className="mt-2 space-y-2">
        {evidence.map((item) => <div key={item.evidence_id} className="max-w-full overflow-hidden border border-line bg-paper p-3"><p className="break-words text-sm leading-6 text-ink"><LinkedText text={item.exact_quote_or_description ?? ""} /></p>{(item.page || item.section) && <p className="mt-2 text-xs text-muted">{[item.page ? `Page ${item.page}` : null, item.section].filter(Boolean).join(" · ")}</p>}<AdvancedId label="Evidence ID" value={item.evidence_id} /></div>)}
        {evidence.length === 0 && <p className="text-sm text-muted">No directly linked evidence found.</p>}
      </div>
    </div>
  );
}

function ModeButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" className={active ? "border border-ink bg-ink px-3 py-1.5 text-xs font-medium text-white" : "border border-line bg-white px-3 py-1.5 text-xs font-medium text-muted hover:border-blue hover:text-ink"} onClick={onClick}>{children}</button>;
}

function ToolbarButton({ active = false, disabled = false, onClick, children }: { active?: boolean; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button type="button" disabled={disabled} className={active ? "border border-blue bg-blue px-2.5 py-1.5 text-xs font-medium text-white" : "border border-line bg-white px-2.5 py-1.5 text-xs font-medium text-ink hover:border-blue disabled:cursor-not-allowed disabled:opacity-40"} onClick={onClick}>{children}</button>;
}

function selectionFocus(view: WorkbenchFlowView, selection: Selection) {
  if (!selection) return { nodeIds: new Set(view.nodes.map((node) => node.element_id)), edgeIds: new Set(view.relations.map((edge) => edge.relation_id)) };
  if (selection.kind === "edge") {
    const edge = view.relations.find((candidate) => candidate.relation_id === selection.id);
    return { nodeIds: new Set(edge ? [edge.source_node_id, edge.target_node_id] : []), edgeIds: new Set(edge ? [edge.relation_id] : []) };
  }
  const incident = view.relations.filter((edge) => edge.source_node_id === selection.id || edge.target_node_id === selection.id);
  return { nodeIds: new Set([selection.id, ...incident.flatMap((edge) => [edge.source_node_id, edge.target_node_id])]), edgeIds: new Set(incident.map((edge) => edge.relation_id)) };
}

function edgeColor(relation: WorkbenchRelation) {
  if (relation.provenance === "source_view") return "#20242a";
  if (relation.extraction_type === "explicit-in-artifact") return "#7292a6";
  if (relation.extraction_type === "inferred" || relation.provenance === "inferred") return "#687785";
  return "#365f87";
}

function edgeClass(relation: WorkbenchRelation) {
  if (relation.provenance === "source_view") return "source-view-explicit";
  if (relation.extraction_type === "explicit-in-artifact") return "explicit-in-artifact";
  if (relation.extraction_type === "inferred" || relation.provenance === "inferred") return "inferred";
  return "explicit";
}

function edgeProvenanceLabel(relation: WorkbenchRelation) {
  if (relation.provenance === "source_view") return "Source-view explicit";
  if (relation.extraction_type === "explicit-in-artifact") return "Explicit in artifact";
  if (relation.extraction_type === "inferred" || relation.provenance === "inferred") return "Inferred stored relation";
  return "Explicit stored relation";
}

function projectionSourceLabel(view: WorkbenchFlowView) {
  if (view.projection_source === "source_view") return "Curated graph.json source view";
  if (view.projection_source === "graph_json_recommended_paths") return "Stored recommended paths from graph.json";
  if (view.projection_source === "okf_stored_relations_projection") return "OKF stored-relations projection";
  return "All canonical OKF relations";
}

function sourceReferenceText(view: WorkbenchFlowView) {
  const reference = view.source_reference;
  if (!reference) return "Not recorded";
  return [reference.type === "paper_table" ? "Paper table" : "Paper figure", reference.label, reference.page != null ? `page ${reference.page}` : null].filter(Boolean).join(" · ");
}

function validationLabel(status: WorkbenchFlowView["validation"]["semantic_status"]) {
  if (status === "author_verified") return "Author verified";
  if (status === "internally_validated") return "Internally validated";
  return status === "not_applicable" ? "Not applicable" : "Semantically unreviewed";
}

function visualParityLabel(status: WorkbenchFlowView["validation"]["visual_parity"]) {
  if (status === "manually_validated") return "manually validated approximation";
  return status === "not_applicable" ? "not applicable" : "automatic approximation";
}

function canonicalLayer(element: WorkbenchElement) {
  return element.canonical_type ?? element.element_type as WorkbenchFlowView["layers"][number] ?? "Problem";
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

function reactFlowPosition(position: FlowLayoutHandle["position"]) {
  if (position === "left") return Position.Left;
  if (position === "top") return Position.Top;
  if (position === "bottom") return Position.Bottom;
  return Position.Right;
}

function handleOffsetStyle(handle: FlowLayoutHandle): CSSProperties {
  return handle.position === "left" || handle.position === "right"
    ? { top: `${handle.offset_percent}%` }
    : { left: `${handle.offset_percent}%` };
}

function splitTokens(value: string | null | undefined) {
  return (value ?? "").split(/[;,]/).map((token) => token.trim()).filter(Boolean);
}

function LinkedText({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s)\]}>"']+)/g);
  return <>{parts.map((part, index) => /^https?:\/\//.test(part) ? <a key={`${part}-${index}`} href={part} target="_blank" rel="noreferrer" className="break-all text-blue underline decoration-blue/30 underline-offset-2 hover:text-ink">{part}</a> : <span key={`${part}-${index}`}>{part}</span>)}</>;
}

function reviewStatusLabel(status: string | null | undefined) {
  if (status === "author_verified") return "Author verified";
  if (status === "internally_reviewed") return "Internally reviewed";
  return "Needs review";
}
