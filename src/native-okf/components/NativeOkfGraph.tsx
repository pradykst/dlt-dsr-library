"use client";

import { useCallback, useMemo, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
} from "reactflow";

import type {
  GraphDto,
  GraphEdgeDto,
  GraphNodeDto,
} from "../shared/types.ts";
import { titleWithoutRepeatedProducerLabel } from "../shared/presentation.ts";
import ConceptDrawer from "./ConceptDrawer.tsx";
import GraphLegend, {
  colorsForGraphType,
  type GraphTypeColors,
} from "./GraphLegend.tsx";

const NODE_WIDTH = 232;
const NODE_X_GAP = 278;
const NODE_Y_GAP = 116;
const LAYER_GAP = 70;
const MAX_ROWS_PER_COLUMN = 10;

interface ConceptFlowNodeData {
  concept: GraphNodeDto;
  colors: GraphTypeColors;
}

export interface NativeOkfGraphProps {
  graphOneHop: GraphDto;
  graphTwoHops: GraphDto;
  selectedId?: string;
  onSelect?: (id: string) => void;
  className?: string;
}

function compareNodes(left: GraphNodeDto, right: GraphNodeDto): number {
  if (left.seed !== right.seed) return left.seed ? -1 : 1;
  return left.title.localeCompare(right.title) || left.id.localeCompare(right.id);
}

function compareEdges(left: GraphEdgeDto, right: GraphEdgeDto): number {
  return (
    left.sourceId.localeCompare(right.sourceId) ||
    left.targetId.localeCompare(right.targetId) ||
    left.rawTarget.localeCompare(right.rawTarget) ||
    left.label.localeCompare(right.label)
  );
}

function graphDistances(graph: GraphDto): Map<string, number> {
  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  const adjacency = new Map<string, Set<string>>(
    graph.nodes.map((node) => [node.id, new Set<string>()]),
  );

  for (const edge of graph.edges) {
    if (
      !edge.resolved ||
      edge.broken ||
      edge.external ||
      !nodeIds.has(edge.sourceId) ||
      !nodeIds.has(edge.targetId)
    ) {
      continue;
    }
    adjacency.get(edge.sourceId)?.add(edge.targetId);
    adjacency.get(edge.targetId)?.add(edge.sourceId);
  }

  const seeds = graph.nodes.filter((node) => node.seed).sort(compareNodes);
  const queue = seeds.map((seed) => seed.id);
  const distances = new Map(queue.map((id) => [id, 0]));

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const id = queue[cursor];
    if (!id) continue;
    const distance = distances.get(id) ?? 0;
    const neighbors = [...(adjacency.get(id) ?? [])].sort();

    for (const neighbor of neighbors) {
      if (distances.has(neighbor)) continue;
      distances.set(neighbor, distance + 1);
      queue.push(neighbor);
    }
  }

  return distances;
}

/**
 * Stable hop-distance columns, then title/ID order within each column.
 * The layout deliberately carries no assumptions about producer-defined types.
 */
function layoutGraphNodes(graph: GraphDto): Node<ConceptFlowNodeData>[] {
  const distances = graphDistances(graph);
  const fallbackDistance = graph.depth + 1;
  const layers = new Map<number, GraphNodeDto[]>();

  for (const concept of graph.nodes) {
    const distance = distances.get(concept.id) ?? fallbackDistance;
    const layer = layers.get(distance) ?? [];
    layer.push(concept);
    layers.set(distance, layer);
  }

  let layerStartX = 0;
  const flowNodes: Node<ConceptFlowNodeData>[] = [];

  for (const distance of [...layers.keys()].sort((left, right) => left - right)) {
    const concepts = (layers.get(distance) ?? []).sort(compareNodes);
    const columnCount = Math.max(1, Math.ceil(concepts.length / MAX_ROWS_PER_COLUMN));

    concepts.forEach((concept, index) => {
      const column = Math.floor(index / MAX_ROWS_PER_COLUMN);
      const row = index % MAX_ROWS_PER_COLUMN;
      const columnSize = Math.min(
        MAX_ROWS_PER_COLUMN,
        concepts.length - column * MAX_ROWS_PER_COLUMN,
      );

      flowNodes.push({
        id: concept.id,
        type: "concept",
        position: {
          x: layerStartX + column * NODE_X_GAP,
          y: (row - (columnSize - 1) / 2) * NODE_Y_GAP,
        },
        data: {
          concept,
          colors: colorsForGraphType(concept.type),
        },
        draggable: false,
        selectable: true,
      });
    });

    layerStartX += columnCount * NODE_X_GAP + LAYER_GAP;
  }

  return flowNodes;
}

function ConceptFlowNode({ data, selected }: NodeProps<ConceptFlowNodeData>) {
  const { concept, colors } = data;
  const displayTitle = titleWithoutRepeatedProducerLabel(
    concept.title,
    concept.label,
  );

  return (
    <div
      className="rounded-lg border-2 px-3.5 py-3 shadow-md transition-shadow"
      style={{
        width: NODE_WIDTH,
        backgroundColor: concept.seed ? "#ffffff" : colors.background,
        borderColor: selected ? "#20242a" : colors.border,
        boxShadow: selected
          ? "0 0 0 3px rgba(79, 111, 145, 0.2), 0 10px 24px rgba(32, 36, 42, 0.14)"
          : "0 6px 16px rgba(32, 36, 42, 0.09)",
      }}
      title={concept.id}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !border-2 !bg-white"
        style={{ borderColor: colors.border }}
      />

      <div className="flex items-center justify-between gap-2">
        <span
          className="truncate text-[10px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: colors.text }}
        >
          {concept.typeLabel}
        </span>
        {concept.seed ? (
          <span className="rounded-full bg-ink px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">
            Seed
          </span>
        ) : null}
      </div>
      <div className="mt-2 line-clamp-3 text-sm font-semibold leading-5 text-ink">{displayTitle}</div>
      {concept.label ? (
        <div className="mt-2 font-mono text-[10px] text-muted">{concept.label}</div>
      ) : null}

      <Handle
        type="source"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !border-2 !bg-white"
        style={{ borderColor: colors.border }}
      />
    </div>
  );
}

const NODE_TYPES = { concept: ConceptFlowNode } satisfies NodeTypes;

function flowEdges(graph: GraphDto, visibleIds: ReadonlySet<string>): Edge[] {
  return [...graph.edges]
    .sort(compareEdges)
    .filter(
      (edge) =>
        edge.resolved &&
        !edge.broken &&
        !edge.external &&
        visibleIds.has(edge.sourceId) &&
        visibleIds.has(edge.targetId),
    )
    .map((edge, index) => ({
      id: `${edge.sourceId}->${edge.targetId}:${index}`,
      source: edge.sourceId,
      target: edge.targetId,
      type: "smoothstep",
      label: edge.relationHint,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#667085",
        width: 18,
        height: 18,
      },
      style: { stroke: "#667085", strokeWidth: 1.35 },
      labelStyle: { fill: "#4b5563", fontSize: 10, fontWeight: 500 },
      labelBgStyle: { fill: "#f7f6f1", fillOpacity: 0.9 },
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 3,
    }));
}

export function NativeOkfGraph({
  graphOneHop,
  graphTwoHops,
  selectedId,
  onSelect,
  className = "",
}: NativeOkfGraphProps) {
  const [depth, setDepth] = useState<1 | 2>(1);
  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(() => new Set());
  const [selectedNodeId, setSelectedNodeId] = useState<string | undefined>(selectedId);
  const activeGraph = depth === 1 ? graphOneHop : graphTwoHops;

  const allFlowNodes = useMemo(() => layoutGraphNodes(activeGraph), [activeGraph]);
  const visibleFlowNodesWithoutSelection = useMemo(
    () => allFlowNodes.filter((node) => !hiddenTypes.has(node.data.concept.type)),
    [allFlowNodes, hiddenTypes],
  );
  const visibleIds = useMemo(
    () => new Set(visibleFlowNodesWithoutSelection.map((node) => node.id)),
    [visibleFlowNodesWithoutSelection],
  );
  const visibleSelectedId =
    selectedNodeId && visibleIds.has(selectedNodeId) ? selectedNodeId : undefined;
  const visibleFlowNodes = useMemo(
    () => visibleFlowNodesWithoutSelection.map((node) => ({ ...node, selected: node.id === visibleSelectedId })),
    [visibleFlowNodesWithoutSelection, visibleSelectedId],
  );
  const visibleEdges = useMemo(
    () => flowEdges(activeGraph, visibleIds),
    [activeGraph, visibleIds],
  );
  const selectedConcept = useMemo(
    () => activeGraph.nodes.find((node) => node.id === visibleSelectedId) ?? null,
    [activeGraph.nodes, visibleSelectedId],
  );

  const toggleType = useCallback((type: string) => {
    setHiddenTypes((current) => {
      const next = new Set(current);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const selectNode = useCallback(
    (id: string) => {
      setSelectedNodeId(id);
      onSelect?.(id);
    },
    [onSelect],
  );

  const layoutKey = `${depth}:${[...visibleIds].sort().join("|")}`;

  return (
    <section
      className={`overflow-hidden rounded-xl border border-line bg-white shadow-research ${className}`.trim()}
      aria-label="Native OKF relationship graph"
    >
      <div className="border-b border-line bg-paper px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-lg font-semibold text-ink">Knowledge graph</h2>
            <p className="mt-1 text-xs text-muted">
              {visibleFlowNodes.length} of {activeGraph.nodes.length} concepts · {visibleEdges.length}{" "}
              directed relationships
            </p>
          </div>

          <div
            role="group"
            aria-label="Graph traversal depth"
            className="inline-flex rounded-lg border border-line bg-white p-1"
          >
            {([1, 2] as const).map((hopDepth) => (
              <button
                key={hopDepth}
                type="button"
                aria-pressed={depth === hopDepth}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  depth === hopDepth
                    ? "bg-ink text-white shadow-sm"
                    : "text-muted hover:bg-paper hover:text-ink"
                }`}
                onClick={() => setDepth(hopDepth)}
              >
                {hopDepth} {hopDepth === 1 ? "hop" : "hops"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 border-t border-line pt-4">
          <GraphLegend
            nodes={activeGraph.nodes}
            hiddenTypes={hiddenTypes}
            onToggleType={toggleType}
            onShowAll={() => setHiddenTypes(new Set())}
          />
        </div>

        {activeGraph.truncated ? (
          <p
            role="status"
            className="mt-4 rounded-md border border-amber/30 bg-amber/10 px-3 py-2 text-xs leading-5 text-ink"
          >
            This graph reached its node limit. Some concepts and relationships are not shown.
          </p>
        ) : null}
      </div>

      <div className="relative h-[620px] min-h-[440px] bg-paper research-grid">
        {visibleFlowNodes.length > 0 ? (
          <ReactFlow
            key={layoutKey}
            nodes={visibleFlowNodes}
            edges={visibleEdges}
            nodeTypes={NODE_TYPES}
            fitView
            fitViewOptions={{ padding: 0.16, maxZoom: 1 }}
            minZoom={0.08}
            maxZoom={1.5}
            nodesDraggable={false}
            nodesConnectable={false}
            edgesFocusable={false}
            zoomOnDoubleClick={false}
            onNodeClick={(_event, node) => selectNode(node.id)}
            onPaneClick={() => setSelectedNodeId(undefined)}
            proOptions={{ hideAttribution: true }}
          >
            <Background color="#d8d6cc" gap={28} size={1} />
            <Controls showInteractive={false} />
          </ReactFlow>
        ) : (
          <div className="grid h-full place-items-center px-6 text-center">
            <div>
              <p className="font-serif text-lg font-semibold text-ink">No visible concepts</p>
              <p className="mt-2 text-sm text-muted">
                Re-enable a concept type in the legend to restore the graph.
              </p>
              <button
                type="button"
                className="mt-4 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white"
                onClick={() => setHiddenTypes(new Set())}
              >
                Show all types
              </button>
            </div>
          </div>
        )}

        <ConceptDrawer
          concept={selectedConcept}
          onClose={() => setSelectedNodeId(undefined)}
        />
      </div>
    </section>
  );
}

export default NativeOkfGraph;
