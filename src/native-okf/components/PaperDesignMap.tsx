"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactFlow, {
  Background,
  Handle,
  MarkerType,
  Position,
  ReactFlowProvider,
  type Edge,
  type EdgeTypes,
  type Node,
  type NodeProps,
  type NodeTypes,
  useReactFlow,
} from "reactflow";

import type {
  GraphNodeDto,
  PaperDesignMapDto,
} from "../shared/types.ts";
import { titleWithoutRepeatedProducerLabel } from "../shared/presentation.ts";
import {
  PAPER_DESIGN_COLUMN_GAP,
  PAPER_DESIGN_NODE_GAP,
  PAPER_DESIGN_NODE_HEIGHT,
  PAPER_DESIGN_NODE_WIDTH,
  PAPER_DESIGN_OUTER_PADDING,
  paperDesignNodeHeight,
} from "./paper-design-metrics.ts";
import {
  calculateDiagramViewport,
  GENERATED_DIAGRAM_FIT_SCREEN_PADDING,
} from "./chat/diagram-viewport.ts";
import ConceptDrawer from "./ConceptDrawer.tsx";
import GraphLegend, { colorsForGraphType } from "./GraphLegend.tsx";
import { SemanticColumnHeadings } from "./SemanticColumnHeadings.tsx";
import {
  layoutSemanticColumns,
  PAPER_DESIGN_FIT_MIN_ZOOM,
  type SemanticColumnLayout,
} from "./semantic-column-layout.ts";
import {
  StraightFlowEdge,
  type StraightFlowEdgeData,
} from "./StraightFlowEdge.tsx";

export {
  PAPER_DESIGN_COLUMN_GAP,
  PAPER_DESIGN_NODE_GAP,
  PAPER_DESIGN_NODE_HEIGHT,
  PAPER_DESIGN_NODE_WIDTH,
  PAPER_DESIGN_OUTER_PADDING,
  paperDesignNodeHeight,
} from "./paper-design-metrics.ts";

interface PaperDesignNodeData {
  concept: GraphNodeDto;
  dimmed: boolean;
}

const NODE_TYPES = { paperDesignConcept: PaperDesignNode } satisfies NodeTypes;
const EDGE_TYPES = { straight: StraightFlowEdge } satisfies EdgeTypes;

function PaperDesignNode({ data, selected }: NodeProps<PaperDesignNodeData>) {
  const { concept, dimmed } = data;
  const colors = colorsForGraphType(concept.type);
  const displayTitle = titleWithoutRepeatedProducerLabel(
    concept.title,
    concept.label,
  );
  return (
    <div
      className={`flex rounded-xl border-2 px-3.5 py-3 text-left shadow-md motion-safe:transition-[border-color,box-shadow,opacity] motion-safe:duration-150 ${
        dimmed ? "opacity-40" : "opacity-100"
      } ${selected ? "ring-2 ring-blue/30 ring-offset-2" : ""}`}
      style={{
        width: PAPER_DESIGN_NODE_WIDTH,
        minHeight: PAPER_DESIGN_NODE_HEIGHT,
        height: "100%",
        backgroundColor: colors.background,
        borderColor: selected ? "#20242a" : colors.border,
      }}
      aria-label={`${concept.label ? `${concept.label}. ` : ""}${displayTitle}. ${concept.typeLabel}.`}
    >
      <Handle
        type="target"
        position={Position.Left}
        aria-label="Incoming semantic relationship"
        className="!h-2.5 !w-2.5 !border-2 !bg-white"
        style={{ borderColor: colors.border }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex min-h-3 min-w-0 items-center justify-end">
          {concept.label ? (
            <span
              className="shrink-0 font-mono text-[10px] font-bold"
              style={{ color: colors.text }}
            >
              {concept.label}
            </span>
          ) : null}
        </div>
        <p className="mt-2 whitespace-normal break-words [overflow-wrap:anywhere] text-sm font-semibold leading-5 text-ink">
          {displayTitle}
        </p>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        aria-label="Outgoing semantic relationship"
        className="!h-2.5 !w-2.5 !border-2 !bg-white"
        style={{ borderColor: colors.border }}
      />
    </div>
  );
}

function connectedNodeIds(map: PaperDesignMapDto, selectedId: string | undefined): Set<string> {
  if (!selectedId) return new Set();
  const ids = new Set([selectedId]);
  for (const edge of map.edges) {
    if (edge.sourceId === selectedId) ids.add(edge.targetId);
    if (edge.targetId === selectedId) ids.add(edge.sourceId);
  }
  return ids;
}

function PaperDesignCanvas({
  map,
  hiddenTypes,
  labelsVisible,
  selectedId,
  fullscreen,
  fullscreenAvailable,
  onSelect,
  onLabelsVisibleChange,
  onToggleFullscreen,
}: {
  map: PaperDesignMapDto;
  hiddenTypes: ReadonlySet<string>;
  labelsVisible: boolean;
  selectedId: string | undefined;
  fullscreen: boolean;
  fullscreenAvailable: boolean;
  onSelect: (id: string | undefined) => void;
  onLabelsVisibleChange: (visible: boolean) => void;
  onToggleFullscreen: () => void;
}) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [flowReady, setFlowReady] = useState(false);
  const { setViewport, zoomIn, zoomOut } = useReactFlow<
    PaperDesignNodeData,
    StraightFlowEdgeData
  >();
  const visibleNodes = useMemo(
    () => map.nodes.filter((node) => !hiddenTypes.has(node.type)),
    [hiddenTypes, map.nodes],
  );
  const visibleIds = useMemo(
    () => new Set(visibleNodes.map((node) => node.id)),
    [visibleNodes],
  );
  const visibleColumns = useMemo(
    () => map.columns
      .map((column) => ({
        ...column,
        nodeIds: column.nodeIds.filter((id) => visibleIds.has(id)),
      }))
      .filter((column) => column.nodeIds.length > 0),
    [map.columns, visibleIds],
  );
  const visibleEdges = useMemo(
    () => map.edges.filter((edge) =>
      visibleIds.has(edge.sourceId) && visibleIds.has(edge.targetId)
    ),
    [map.edges, visibleIds],
  );
  const layout = useMemo(() => layoutSemanticColumns(
    visibleNodes.map((concept) => ({
      id: concept.id,
      columnKey: concept.type,
      label: concept.title,
      ...(concept.label ? { producerLabel: concept.label } : {}),
      height: paperDesignNodeHeight(
        titleWithoutRepeatedProducerLabel(concept.title, concept.label),
      ),
      value: concept,
    })),
    visibleEdges.map((edge) => ({
      id: edge.id,
      source: edge.sourceId,
      target: edge.targetId,
      label: edge.label,
      value: edge,
    })),
    visibleColumns.map((column) => ({ key: column.key, title: column.title })),
    {
      nodeWidth: PAPER_DESIGN_NODE_WIDTH,
      nodeHeight: PAPER_DESIGN_NODE_HEIGHT,
      nodeGap: PAPER_DESIGN_NODE_GAP,
      columnGap: PAPER_DESIGN_COLUMN_GAP,
      outerPadding: PAPER_DESIGN_OUTER_PADDING,
    },
  ), [visibleColumns, visibleEdges, visibleNodes]);
  const related = useMemo(
    () => connectedNodeIds(map, selectedId),
    [map, selectedId],
  );
  const nodes = useMemo<Node<PaperDesignNodeData>[]>(() =>
    layout.nodes.map((positioned) => ({
      id: positioned.id,
      type: "paperDesignConcept",
      position: positioned.position,
      width: positioned.width,
      height: positioned.height,
      style: { width: positioned.width, height: positioned.height },
      data: {
        concept: positioned.value,
        dimmed: Boolean(selectedId && !related.has(positioned.id)),
      },
      draggable: false,
      selectable: true,
      connectable: false,
      focusable: true,
      selected: positioned.id === selectedId,
      ariaLabel: `Select ${positioned.value.title}`,
    })),
  [layout.nodes, related, selectedId]);
  const edges = useMemo<Edge<StraightFlowEdgeData>[]>(() =>
    layout.edges.map((positioned) => {
      const highlighted = Boolean(
        selectedId &&
        (positioned.source === selectedId || positioned.target === selectedId)
      );
      return {
        id: positioned.id,
        source: positioned.source,
        target: positioned.target,
        type: "straight",
        data: {
          points: positioned.points,
          label: positioned.label,
          labelPoint: positioned.labelPosition,
          showLabel: labelsVisible,
          highlighted,
          dimmed: Boolean(selectedId && !highlighted),
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: highlighted ? "#1f5f8b" : "#64748b",
          width: 17,
          height: 17,
        },
        zIndex: highlighted ? 3 : 1,
        focusable: false,
        selectable: false,
      };
    }),
  [labelsVisible, layout.edges, selectedId]);

  const fitDiagram = useCallback(() => {
    if (!flowReady || !canvasRef.current) return;
    const viewport = canvasRef.current.getBoundingClientRect();
    if (viewport.width <= 0 || viewport.height <= 0) return;
    const transform = calculateDiagramViewport(
      layout.bounds,
      { width: viewport.width, height: viewport.height },
      GENERATED_DIAGRAM_FIT_SCREEN_PADDING,
      { minZoom: PAPER_DESIGN_FIT_MIN_ZOOM, maxZoom: 1.05 },
    );
    setViewport(transform, { duration: 0 });
  }, [flowReady, layout.bounds, setViewport]);

  useEffect(() => {
    if (!flowReady) return;
    const frame = window.requestAnimationFrame(fitDiagram);
    return () => window.cancelAnimationFrame(frame);
  }, [fitDiagram, flowReady, layout]);

  const selectedConcept = selectedId
    ? map.nodes.find((node) => node.id === selectedId) ?? null
    : null;
  const buttonClass =
    "nodrag nopan rounded-md border border-line bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm transition hover:border-blue/40 hover:text-ink focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-1 disabled:opacity-45";

  return (
    <div className={`relative flex flex-col bg-paper research-grid ${
      fullscreen ? "h-screen" : "h-[700px] min-h-[520px]"
    }`}>
      <div className="z-20 flex flex-wrap gap-1.5 border-b border-line bg-white/95 px-3 py-2">
        <button type="button" className={buttonClass} onClick={fitDiagram}>
          Fit diagram
        </button>
        <button type="button" className={buttonClass} onClick={() => zoomOut({ duration: 0 })}>
          Zoom out
        </button>
        <button type="button" className={buttonClass} onClick={() => zoomIn({ duration: 0 })}>
          Zoom in
        </button>
        <label className={`${buttonClass} inline-flex items-center gap-2`}>
          <input
            type="checkbox"
            checked={labelsVisible}
            onChange={(event) => onLabelsVisibleChange(event.target.checked)}
          />
          Show relationship labels
        </label>
        <button
          type="button"
          className={buttonClass}
          onClick={onToggleFullscreen}
          disabled={!fullscreenAvailable}
          aria-pressed={fullscreen}
        >
          {fullscreen ? "Exit fullscreen" : "Fullscreen"}
        </button>
      </div>
      <div ref={canvasRef} className="relative min-h-0 flex-1">
        <ReactFlow
          aria-label="Paper design-knowledge map"
          nodes={nodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
          edgeTypes={EDGE_TYPES}
          minZoom={PAPER_DESIGN_FIT_MIN_ZOOM}
          maxZoom={1.6}
          nodesDraggable={false}
          nodesConnectable={false}
          nodesFocusable
          edgesFocusable={false}
          zoomOnDoubleClick={false}
          onInit={() => setFlowReady(true)}
          onNodeClick={(_event, node) => onSelect(node.id)}
          onPaneClick={() => onSelect(undefined)}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#d8d6cc" gap={28} size={1} />
          <SemanticColumnHeadings columns={layout.columns} orientation="horizontal" />
        </ReactFlow>
        <ConceptDrawer concept={selectedConcept} onClose={() => onSelect(undefined)} />
      </div>
    </div>
  );
}

export function PaperDesignMap({ map }: { map: PaperDesignMapDto }) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(() => new Set());
  const [labelsVisible, setLabelsVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [fullscreenAvailable, setFullscreenAvailable] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() =>
      setFullscreenAvailable(Boolean(document.fullscreenEnabled))
    );
    const update = () => setFullscreen(document.fullscreenElement === sectionRef.current);
    document.addEventListener("fullscreenchange", update);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("fullscreenchange", update);
    };
  }, []);

  const toggleType = useCallback((type: string) => {
    setHiddenTypes((current) => {
      const next = new Set(current);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  async function toggleFullscreen() {
    if (document.fullscreenElement === sectionRef.current) {
      await document.exitFullscreen();
    } else if (sectionRef.current) {
      await sectionRef.current.requestFullscreen();
    }
  }

  return (
    <section
      ref={sectionRef}
      className="overflow-hidden rounded-xl border border-line bg-white shadow-research fullscreen:rounded-none fullscreen:border-0"
      aria-label="Semantic paper design map"
    >
      <div className="border-b border-line bg-paper px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-lg font-semibold text-ink">Design-knowledge map</h2>
            <p className="mt-1 text-xs text-muted">
              {map.nodes.length} stored concepts / {map.edges.length} canonical semantic relationships
            </p>
          </div>
        </div>
        <div className="mt-4 border-t border-line pt-4">
          <GraphLegend
            nodes={map.nodes}
            hiddenTypes={hiddenTypes}
            onToggleType={toggleType}
            onShowAll={() => setHiddenTypes(new Set())}
          />
        </div>
      </div>
      {map.nodes.length > 0 ? (
        <ReactFlowProvider>
          <PaperDesignCanvas
            map={map}
            hiddenTypes={hiddenTypes}
            labelsVisible={labelsVisible}
            selectedId={selectedId}
            fullscreen={fullscreen}
            fullscreenAvailable={fullscreenAvailable}
            onSelect={setSelectedId}
            onLabelsVisibleChange={setLabelsVisible}
            onToggleFullscreen={() => void toggleFullscreen()}
          />
        </ReactFlowProvider>
      ) : (
        <div className="px-6 py-12 text-center text-sm text-muted">
          No stored design-knowledge concepts are associated with this paper.
        </div>
      )}
    </section>
  );
}

export type PaperDesignLayout = SemanticColumnLayout<GraphNodeDto, PaperDesignMapDto["edges"][number]>;
