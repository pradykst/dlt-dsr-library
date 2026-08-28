"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactFlow, {
  Background,
  MarkerType,
  ReactFlowProvider,
  type Edge,
  type EdgeTypes,
  type Node,
  type NodeTypes,
  useReactFlow,
} from "reactflow";

import type {
  GeneratedDiagram,
  GeneratedDiagramNode as DiagramNode,
  NativeOkfSourceCard,
} from "../../shared/chat-types.ts";
import { conceptHref } from "../../shared/links.ts";
import {
  equivalentSemanticLabels,
  formatConceptType,
} from "../../shared/presentation.ts";
import { SemanticColumnHeadings } from "../SemanticColumnHeadings.tsx";
import {
  ElkFlowEdge,
  type ElkFlowEdgeData,
} from "./ElkFlowEdge.tsx";
import {
  GeneratedDiagramNodeRenderer,
  type GeneratedDiagramNodeData,
} from "./GeneratedDiagramNode.tsx";
import {
  layoutGeneratedDiagram,
  type DiagramOrientation,
  type GeneratedDiagramLayout,
} from "./diagram-layout.ts";
import {
  calculateDiagramViewport,
  GENERATED_DIAGRAM_FIT_MAX_ZOOM,
  GENERATED_DIAGRAM_FIT_MIN_ZOOM,
  GENERATED_DIAGRAM_FIT_SCREEN_PADDING,
} from "./diagram-viewport.ts";

const NODE_TYPES = {
  generatedDiagram: GeneratedDiagramNodeRenderer,
} satisfies NodeTypes;

const EDGE_TYPES = {
  routed: ElkFlowEdge,
} satisfies EdgeTypes;

const MANUAL_MAX_ZOOM = 1.7;

type EdgeLabelMode = "decision" | "all" | "none";

function formatStage(stage: DiagramNode["stage"]): string {
  return stage
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatProvenance(node: DiagramNode): string {
  if (node.provenance === "user-provided") {
    return "Provided in the research question";
  }
  return node.provenance === "synthesized"
    ? "Synthesized proposal"
    : "Stored knowledge";
}

function relatedNodeIds(
  diagram: GeneratedDiagram,
  selectedId: string | undefined,
): Set<string> {
  if (!selectedId) return new Set();
  const related = new Set([selectedId]);
  for (const edge of diagram.edges) {
    if (edge.source === selectedId) related.add(edge.target);
    if (edge.target === selectedId) related.add(edge.source);
  }
  return related;
}

export function GeneratedDiagramDetailsPanel({
  node,
  sourcesByConceptId,
  onClose,
}: {
  node: DiagramNode;
  sourcesByConceptId: ReadonlyMap<string, NativeOkfSourceCard>;
  onClose: () => void;
}) {
  return (
    <aside
      aria-label={`Details for ${node.label}`}
      className="absolute isolate inset-x-2 bottom-2 z-40 max-h-[72%] overflow-y-auto rounded-xl border border-slate-300 bg-white p-5 opacity-100 shadow-2xl ring-1 ring-slate-900/10 motion-reduce:transition-none sm:inset-y-2 sm:left-auto sm:right-2 sm:max-h-none sm:w-[22rem]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
            Selected node
          </p>
          <h4 className="mt-2 text-base font-semibold leading-6 text-ink">
            {node.label}
          </h4>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close node details"
          title="Close node details"
          className="nodrag nopan grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line bg-paper text-lg leading-none text-muted transition hover:border-slate-400 hover:text-ink focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 motion-reduce:transition-none"
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </div>

      {node.provenance === "synthesized" ? (
        <div className="mt-4 rounded-lg border border-purple/30 bg-purple/10 px-3 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-purple">
            Synthesized proposal
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-700">
            This node is generated for the current design problem. It is not stored
            directly in the source corpus.
          </p>
        </div>
      ) : null}

      <p className="mt-4 text-sm leading-6 text-slate-700">{node.description}</p>

      <dl className="mt-5 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 text-xs">
        <dt className="font-bold uppercase tracking-wide text-muted">Stage</dt>
        <dd className="font-semibold text-ink">{formatStage(node.stage)}</dd>
        {!equivalentSemanticLabels(node.category, node.stage) ? (
          <>
            <dt className="font-bold uppercase tracking-wide text-muted">Category</dt>
            <dd className="break-words font-semibold text-ink">{node.category}</dd>
          </>
        ) : null}
        {node.group ? (
          <>
            <dt className="font-bold uppercase tracking-wide text-muted">Group</dt>
            <dd className="break-words font-semibold text-ink">{node.group}</dd>
          </>
        ) : null}
        <dt className="font-bold uppercase tracking-wide text-muted">Provenance</dt>
        <dd className="font-semibold text-ink">{formatProvenance(node)}</dd>
      </dl>

      {node.provenance === "user-provided" ? (
        <p className="mt-5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
          Provided in the research question; no paper source is claimed.
        </p>
      ) : (
        <>
          {node.provenance === "stored" ? (
            <>
              <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                Exact stored knowledge
              </p>
              <ul className="mt-2 space-y-2">
                {node.sourcePaths.map((sourcePath) => (
                  <li key={sourcePath}>
                    <Link
                      href={conceptHref(sourcePath)}
                      className="break-all font-mono text-xs leading-5 text-blue underline decoration-blue/30 underline-offset-2 hover:text-ink focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2"
                    >
                      {sourcePath}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </>
      )}
      {node.provenance === "synthesized" ? (
        <>
          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
            Supporting stored concepts
          </p>
          <ul className="mt-2 space-y-3">
            {node.supportConceptIds.map((conceptId) => {
              const source = sourcesByConceptId.get(conceptId);
              return (
                <li key={conceptId} className="rounded-lg border border-line bg-paper p-3">
                  <p className="text-xs font-semibold leading-5 text-ink">
                    {source?.title ?? conceptId}
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-muted">
                    {source ? formatConceptType(source.type) : "Stored concept"}
                    {source?.sourcePaper ? ` · ${source.sourcePaper}` : ""}
                  </p>
                  <Link
                    href={conceptHref(conceptId)}
                    className="mt-1 block break-all font-mono text-[0.68rem] leading-5 text-blue underline decoration-blue/30 underline-offset-2 hover:text-ink focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2"
                  >
                    {conceptId}
                  </Link>
                </li>
              );
            })}
          </ul>
          {node.synthesisRationale ? (
            <>
              <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
                Synthesis rationale
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-700">
                {node.synthesisRationale}
              </p>
            </>
          ) : null}
        </>
      ) : null}
    </aside>
  );
}

function DiagramToolbar({
  orientation,
  edgeLabelMode,
  fullscreenAvailable,
  fullscreen,
  onOrientationChange,
  onEdgeLabelModeChange,
  onFit,
  onToggleFullscreen,
  onZoomIn,
  onZoomOut,
}: {
  orientation: DiagramOrientation;
  edgeLabelMode: EdgeLabelMode;
  fullscreenAvailable: boolean;
  fullscreen: boolean;
  onOrientationChange: (orientation: DiagramOrientation) => void;
  onEdgeLabelModeChange: (mode: EdgeLabelMode) => void;
  onFit: () => void;
  onToggleFullscreen: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
}) {
  const buttonClass =
    "nodrag nopan rounded-md border border-line bg-white/95 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm transition hover:border-blue/40 hover:text-ink focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none";

  return (
    <div
      aria-label="Diagram controls"
      className="z-20 flex w-full flex-wrap gap-1.5 border-b border-line bg-white/95 px-3 py-2"
    >
      <button
        type="button"
        onClick={onFit}
        aria-label="Fit diagram in view"
        title="Fit diagram"
        className={buttonClass}
      >
        Fit diagram
      </button>
      <div role="group" aria-label="Diagram zoom" className="flex rounded-md shadow-sm">
        <button
          type="button"
          onClick={onZoomOut}
          aria-label="Zoom out of diagram"
          title="Zoom out"
          className={`${buttonClass} rounded-r-none`}
        >
          Zoom out
        </button>
        <button
          type="button"
          onClick={onZoomIn}
          aria-label="Zoom into diagram"
          title="Zoom in"
          className={`${buttonClass} rounded-l-none`}
        >
          Zoom in
        </button>
      </div>
      <div
        role="group"
        aria-label="Diagram orientation"
        className="flex rounded-md shadow-sm"
      >
        {(["horizontal", "vertical"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onOrientationChange(value)}
            aria-pressed={orientation === value}
            aria-label={`Use ${value} diagram orientation`}
            className={`${buttonClass} first:rounded-r-none last:rounded-l-none ${
              orientation === value ? "border-blue bg-blue/10 text-blue" : ""
            }`}
          >
            {value === "horizontal" ? "Horizontal" : "Vertical"}
          </button>
        ))}
      </div>
      <label className="nodrag nopan">
        <span className="sr-only">Relationship label visibility</span>
        <select
          value={edgeLabelMode}
          onChange={(event) =>
            onEdgeLabelModeChange(event.target.value as EdgeLabelMode)
          }
          aria-label="Relationship label visibility"
          className={buttonClass}
        >
          <option value="decision">Decision labels</option>
          <option value="all">All labels</option>
          <option value="none">No labels</option>
        </select>
      </label>
      <button
        type="button"
        onClick={onToggleFullscreen}
        disabled={!fullscreenAvailable}
        aria-pressed={fullscreen}
        aria-label={fullscreen ? "Exit diagram fullscreen" : "Open diagram fullscreen"}
        title={
          fullscreenAvailable
            ? fullscreen
              ? "Exit fullscreen"
              : "Open fullscreen"
            : "Fullscreen is not available"
        }
        className={buttonClass}
      >
        {fullscreen ? "Exit fullscreen" : "Fullscreen"}
      </button>
    </div>
  );
}

function GeneratedDiagramCanvas({
  diagram,
  sourcesByConceptId,
  layout,
  orientation,
  selectedId,
  edgeLabelMode,
  fullscreen,
  fullscreenAvailable,
  onSelect,
  onOrientationChange,
  onEdgeLabelModeChange,
  onToggleFullscreen,
}: {
  diagram: GeneratedDiagram;
  sourcesByConceptId: ReadonlyMap<string, NativeOkfSourceCard>;
  layout: GeneratedDiagramLayout;
  orientation: DiagramOrientation;
  selectedId: string | undefined;
  edgeLabelMode: EdgeLabelMode;
  fullscreen: boolean;
  fullscreenAvailable: boolean;
  onSelect: (id: string | undefined) => void;
  onOrientationChange: (orientation: DiagramOrientation) => void;
  onEdgeLabelModeChange: (mode: EdgeLabelMode) => void;
  onToggleFullscreen: () => void;
}) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [flowReady, setFlowReady] = useState(false);
  const { setViewport, zoomIn, zoomOut } = useReactFlow<
    GeneratedDiagramNodeData,
    ElkFlowEdgeData
  >();
  const connectedIds = useMemo(
    () => relatedNodeIds(diagram, selectedId),
    [diagram, selectedId],
  );

  const nodes = useMemo<Node<GeneratedDiagramNodeData>[]>(
    () =>
      layout.nodes.map((layoutNode) => ({
        id: layoutNode.id,
        type: "generatedDiagram",
        position: layoutNode.position,
        width: layoutNode.width,
        height: layoutNode.height,
        style: {
          width: layoutNode.width,
          height: layoutNode.height,
        },
        data: {
          diagramNode: layoutNode.node,
          orientation,
          dimmed: Boolean(selectedId && !connectedIds.has(layoutNode.id)),
        },
        draggable: false,
        selectable: true,
        connectable: false,
        focusable: true,
        selected: layoutNode.id === selectedId,
        ariaLabel: `Select ${layoutNode.node.label}`,
      })),
    [connectedIds, layout.nodes, orientation, selectedId],
  );

  const edges = useMemo<Edge<ElkFlowEdgeData>[]>(
    () =>
      layout.edges.map((layoutEdge) => {
        const highlighted = Boolean(
          selectedId &&
            (layoutEdge.source === selectedId || layoutEdge.target === selectedId),
        );
        const dimmed = Boolean(selectedId && !highlighted);
        return {
          id: layoutEdge.id,
          source: layoutEdge.source,
          target: layoutEdge.target,
          type: "routed",
          data: {
            points: layoutEdge.points,
            label: layoutEdge.label,
            labelPoint: layoutEdge.labelPosition,
            showLabel:
              edgeLabelMode === "all" ||
              (edgeLabelMode === "decision" &&
                /^(?:yes|no)$/iu.test(layoutEdge.label.trim())),
            highlighted,
            dimmed,
            dashed: layoutEdge.provenance === "synthesized",
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
    [layout.edges, selectedId, edgeLabelMode],
  );

  const fitDiagram = useCallback((): boolean => {
    if (!flowReady || !canvasRef.current) return false;

    const canvasBounds = canvasRef.current.getBoundingClientRect();
    if (canvasBounds.width <= 0 || canvasBounds.height <= 0) return false;

    const transform = calculateDiagramViewport(
      layout.bounds,
      { width: canvasBounds.width, height: canvasBounds.height },
      GENERATED_DIAGRAM_FIT_SCREEN_PADDING,
      {
        minZoom: GENERATED_DIAGRAM_FIT_MIN_ZOOM,
        maxZoom: GENERATED_DIAGRAM_FIT_MAX_ZOOM,
      },
    );

    setViewport(
      { x: transform.x, y: transform.y, zoom: transform.zoom },
      { duration: 0 },
    );
    return true;
  }, [flowReady, layout.bounds, setViewport]);

  const zoomInDiagram = useCallback(() => {
    zoomIn({ duration: 0 });
  }, [zoomIn]);

  const zoomOutDiagram = useCallback(() => {
    zoomOut({ duration: 0 });
  }, [zoomOut]);

  useEffect(() => {
    if (!flowReady) return;

    let frame = 0;
    let attempts = 0;
    const fitAfterMount = () => {
      if (fitDiagram() || attempts >= 3) return;
      attempts += 1;
      frame = window.requestAnimationFrame(fitAfterMount);
    };

    frame = window.requestAnimationFrame(fitAfterMount);
    return () => window.cancelAnimationFrame(frame);
  }, [fitDiagram, flowReady, layout]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === "undefined") return;
    let frame = 0;
    const observer = new ResizeObserver(() => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        fitDiagram();
      });
    });
    observer.observe(canvas);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [fitDiagram]);

  const selectedNode = selectedId
    ? diagram.nodes.find((node) => node.id === selectedId)
    : undefined;
  const responsiveHeight = Math.max(
    480,
    Math.min(720, Math.ceil(layout.bounds.height + 150)),
  );

  return (
    <div
      className={`relative flex w-full flex-col overflow-hidden bg-paper research-grid ${
        fullscreen
          ? "h-[calc(100vh-10rem)] min-h-[26rem]"
          : "min-h-[30rem]"
      }`}
      style={fullscreen ? undefined : { height: responsiveHeight }}
    >
      <DiagramToolbar
        orientation={orientation}
        edgeLabelMode={edgeLabelMode}
        fullscreenAvailable={fullscreenAvailable}
        fullscreen={fullscreen}
        onOrientationChange={onOrientationChange}
        onEdgeLabelModeChange={onEdgeLabelModeChange}
        onFit={fitDiagram}
        onZoomIn={zoomInDiagram}
        onZoomOut={zoomOutDiagram}
        onToggleFullscreen={onToggleFullscreen}
      />

      <div ref={canvasRef} className="relative min-h-0 flex-1">
        <ReactFlow
          aria-label="Generated decision-support flow"
          nodes={nodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
          edgeTypes={EDGE_TYPES}
          minZoom={GENERATED_DIAGRAM_FIT_MIN_ZOOM}
          maxZoom={MANUAL_MAX_ZOOM}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          nodesFocusable
          edgesFocusable={false}
          zoomOnDoubleClick={false}
          onInit={() => setFlowReady(true)}
          onNodeClick={(_event, node) => onSelect(node.id)}
          onPaneClick={() => onSelect(undefined)}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#d8d6cc" gap={28} size={1} />
          <SemanticColumnHeadings
            orientation={orientation}
            columns={layout.lanes.map((lane) => ({
              key: lane.stage,
              title: lane.label,
              nodeIds: lane.nodeIds,
              bounds: lane.bounds,
              headingPosition: lane.headingPosition,
            }))}
          />
        </ReactFlow>

        {layout.warning ? (
          <p
            role="status"
            className="pointer-events-none absolute bottom-3 left-1/2 z-20 max-w-[70%] -translate-x-1/2 rounded-md border border-amber-300 bg-amber-50/95 px-3 py-2 text-center text-xs font-medium text-amber-900 shadow-sm"
          >
            {layout.warning}
          </p>
        ) : null}

        {selectedNode ? (
          <GeneratedDiagramDetailsPanel
            node={selectedNode}
            sourcesByConceptId={sourcesByConceptId}
            onClose={() => onSelect(undefined)}
          />
        ) : null}
      </div>

      <span className="sr-only">
        Diagram bounds: {Math.round(layout.bounds.width)} by {Math.round(layout.bounds.height)}.
        {layout.usedFallback ? " Deterministic fallback layout active." : ""}
      </span>
    </div>
  );
}

export function GeneratedDiagramPresentation({
  diagram,
  sources = [],
}: {
  diagram: GeneratedDiagram;
  sources?: readonly NativeOkfSourceCard[];
}) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const orientationTouched = useRef(false);
  const [orientation, setOrientation] =
    useState<DiagramOrientation>("horizontal");
  const [edgeLabelMode, setEdgeLabelMode] = useState<EdgeLabelMode>("decision");
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [layout, setLayout] = useState<GeneratedDiagramLayout | null>(null);
  const [layoutPending, setLayoutPending] = useState(true);
  const [layoutError, setLayoutError] = useState<string | null>(null);
  const [fullscreenAvailable, setFullscreenAvailable] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);


  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 767px)");
    if (narrow.matches && !orientationTouched.current) {
      setOrientation("vertical");
    }
  }, []);

  useEffect(() => {
    let active = true;

    void layoutGeneratedDiagram(diagram, {
      orientation,
      edgeLabelsVisible: true,
    })
      .then((nextLayout) => {
        if (!active) return;
        setLayout(nextLayout);
      })
      .catch(() => {
        if (!active) return;
        setLayoutError(
          "The diagram layout could not be rendered. The answer and sources remain available.",
        );
      })
      .finally(() => {
        if (active) setLayoutPending(false);
      });

    return () => {
      active = false;
    };
  }, [diagram, orientation]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setFullscreenAvailable(Boolean(document.fullscreenEnabled));
    });
    const updateFullscreen = () => {
      setFullscreen(document.fullscreenElement === sectionRef.current);
    };
    document.addEventListener("fullscreenchange", updateFullscreen);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("fullscreenchange", updateFullscreen);
    };
  }, []);

  function changeOrientation(nextOrientation: DiagramOrientation) {
    if (nextOrientation === orientation) return;
    orientationTouched.current = true;
    setOrientation(nextOrientation);
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement === sectionRef.current) {
        await document.exitFullscreen();
      } else if (sectionRef.current) {
        await sectionRef.current.requestFullscreen();
      }
    } catch {
      setLayoutError("Fullscreen could not be opened in this browser.");
    }
  }

  const presentStages = useMemo(
    () => [
      ...new Set(
        [...diagram.nodes]
          .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id))
          .map((node) => node.stage),
      ),
    ],
    [diagram.nodes],
  );
  const sourcesByConceptId = useMemo(
    () => new Map(sources.map((source) => [source.conceptId, source])),
    [sources],
  );

  return (
    <section
      ref={sectionRef}
      aria-label="Generated decision-support diagram"
      className="overflow-hidden rounded-2xl border border-line bg-white shadow-research fullscreen:rounded-none fullscreen:border-0"
    >
      <div className="border-b border-line bg-paper px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue">
              Decision-support flow
            </p>
            <h3 className="mt-1 font-serif text-xl font-semibold text-ink">
              {diagram.title}
            </h3>
          </div>
          <div
            aria-label="Diagram provenance legend"
            className="flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wide"
          >
            <span className="rounded-full border-2 border-double border-slate-500 bg-slate-100 px-2.5 py-1 text-slate-700">
              Double: user-provided
            </span>
            <span className="rounded-full border border-blue/30 bg-blue/10 px-2.5 py-1 text-blue">
              Solid: stored knowledge
            </span>
            <span className="rounded-full border border-dashed border-purple/40 bg-purple/10 px-2.5 py-1 text-purple">
              Dashed: synthesized proposal
            </span>
          </div>
        </div>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-muted">
          {diagram.explanation}
        </p>
        {presentStages.length > 1 ? (
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
            Stages shown: {presentStages.map(formatStage).join(" / ")}
          </p>
        ) : null}
      </div>

      {diagram.nodes.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-muted">
          No diagram nodes were returned.
        </div>
      ) : layout ? (
        <ReactFlowProvider>
          <GeneratedDiagramCanvas
            diagram={diagram}
            sourcesByConceptId={sourcesByConceptId}
            layout={layout}
            orientation={orientation}
            selectedId={selectedId}
            edgeLabelMode={edgeLabelMode}
            fullscreen={fullscreen}
            fullscreenAvailable={fullscreenAvailable}
            onSelect={setSelectedId}
            onOrientationChange={changeOrientation}
            onEdgeLabelModeChange={setEdgeLabelMode}
            onToggleFullscreen={() => void toggleFullscreen()}
          />
        </ReactFlowProvider>
      ) : (
        <div
          role={layoutError ? "alert" : "status"}
          className="grid h-[30rem] place-items-center bg-paper px-6 text-center text-sm text-muted"
        >
          {layoutError ??
            (layoutPending
              ? "Arranging a readable diagram..."
              : "The diagram could not be arranged.")}
        </div>
      )}

      {layoutError && layout ? (
        <p role="alert" className="border-t border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {layoutError}
        </p>
      ) : null}
    </section>
  );
}

