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
  Controls,
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
} from "../../shared/chat-types.ts";
import { conceptHref } from "../../shared/links.ts";
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

const NODE_TYPES = {
  generatedDiagram: GeneratedDiagramNodeRenderer,
} satisfies NodeTypes;

const EDGE_TYPES = {
  elkOrthogonal: ElkFlowEdge,
} satisfies EdgeTypes;

const READABLE_FIT_MIN_ZOOM = 0.62;

const FIT_OPTIONS = {
  padding: 0.12,
  minZoom: READABLE_FIT_MIN_ZOOM,
  maxZoom: 1.08,
  duration: 0,
} as const;

type EdgeLabelMode = "decision" | "all" | "none";

function formatStage(stage: DiagramNode["stage"]): string {
  return stage.charAt(0).toUpperCase() + stage.slice(1);
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
  onClose,
}: {
  node: DiagramNode;
  onClose: () => void;
}) {
  return (
    <aside
      aria-label={`Details for ${node.label}`}
      className="absolute inset-x-2 bottom-2 z-30 max-h-[72%] overflow-y-auto rounded-xl border border-line bg-white/98 p-5 shadow-2xl motion-reduce:transition-none sm:inset-y-2 sm:left-auto sm:right-2 sm:max-h-none sm:w-[22rem]"
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

      <p className="mt-4 text-sm leading-6 text-slate-700">{node.description}</p>

      <dl className="mt-5 grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-2 text-xs">
        <dt className="font-bold uppercase tracking-wide text-muted">Stage</dt>
        <dd className="font-semibold text-ink">{formatStage(node.stage)}</dd>
        <dt className="font-bold uppercase tracking-wide text-muted">Category</dt>
        <dd className="break-words font-semibold text-ink">{node.category}</dd>
        {node.group ? (
          <>
            <dt className="font-bold uppercase tracking-wide text-muted">Group</dt>
            <dd className="break-words font-semibold text-ink">{node.group}</dd>
          </>
        ) : null}
        <dt className="font-bold uppercase tracking-wide text-muted">Grounding</dt>
        <dd className="font-semibold text-ink">
          {node.synthesis ? "New synthesis" : "Stored knowledge"}
        </dd>
        <dt className="font-bold uppercase tracking-wide text-muted">Sources</dt>
        <dd className="font-semibold text-ink">{node.sourcePaths.length}</dd>
      </dl>

      <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
        Grounding source paths
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
}: {
  orientation: DiagramOrientation;
  edgeLabelMode: EdgeLabelMode;
  fullscreenAvailable: boolean;
  fullscreen: boolean;
  onOrientationChange: (orientation: DiagramOrientation) => void;
  onEdgeLabelModeChange: (mode: EdgeLabelMode) => void;
  onFit: () => void;
  onToggleFullscreen: () => void;
}) {
  const buttonClass =
    "nodrag nopan rounded-md border border-line bg-white/95 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 shadow-sm transition hover:border-blue/40 hover:text-ink focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-45 motion-reduce:transition-none";

  return (
    <div
      aria-label="Diagram controls"
      className="absolute left-3 top-3 z-20 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-1.5"
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
  const { fitView } = useReactFlow<GeneratedDiagramNodeData, ElkFlowEdgeData>();
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
          type: "elkOrthogonal",
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

  const fitDiagram = useCallback(() => {
    fitView(FIT_OPTIONS);
  }, [fitView]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(fitDiagram);
    return () => window.cancelAnimationFrame(frame);
  }, [fitDiagram, layout]);

  const selectedNode = selectedId
    ? diagram.nodes.find((node) => node.id === selectedId)
    : undefined;

  return (
    <div
      className={`relative w-full overflow-hidden bg-paper research-grid ${
        fullscreen
          ? "h-[calc(100vh-10rem)] min-h-[26rem]"
          : "h-[min(68vh,620px)] min-h-[30rem]"
      }`}
    >
      <ReactFlow
        aria-label="Generated decision-support flow"
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        minZoom={0.5}
        maxZoom={1.7}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        nodesFocusable
        edgesFocusable={false}
        zoomOnDoubleClick={false}
        onNodeClick={(_event, node) => onSelect(node.id)}
        onPaneClick={() => onSelect(undefined)}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#d8d6cc" gap={28} size={1} />
        <Controls position="bottom-left" showInteractive={false} />
      </ReactFlow>

      <DiagramToolbar
        orientation={orientation}
        edgeLabelMode={edgeLabelMode}
        fullscreenAvailable={fullscreenAvailable}
        fullscreen={fullscreen}
        onOrientationChange={onOrientationChange}
        onEdgeLabelModeChange={onEdgeLabelModeChange}
        onFit={fitDiagram}
        onToggleFullscreen={onToggleFullscreen}
      />

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
          onClose={() => onSelect(undefined)}
        />
      ) : null}

      <span className="sr-only">
        Diagram bounds: {Math.round(layout.bounds.width)} by {Math.round(layout.bounds.height)}.
        {layout.usedFallback ? " Deterministic fallback layout active." : ""}
      </span>
    </div>
  );
}

export function GeneratedDiagramPresentation({
  diagram,
}: {
  diagram: GeneratedDiagram;
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
          "The diagram layout could not be rendered. The grounded answer and sources remain available.",
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

  return (
    <section
      ref={sectionRef}
      aria-label="Grounded generated diagram"
      className="overflow-hidden rounded-2xl border border-line bg-white shadow-research fullscreen:rounded-none fullscreen:border-0"
    >
      <div className="border-b border-line bg-paper px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue">
              Grounded decision-support flow
            </p>
            <h3 className="mt-1 font-serif text-xl font-semibold text-ink">
              {diagram.title}
            </h3>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] font-semibold uppercase tracking-wide">
            <span className="rounded-full border border-blue/30 bg-blue/10 px-2.5 py-1 text-blue">
              Solid: stored knowledge
            </span>
            <span className="rounded-full border border-dashed border-purple/40 bg-purple/10 px-2.5 py-1 text-purple">
              Dashed: synthesis
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
              ? "Arranging a readable grounded diagram..."
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

