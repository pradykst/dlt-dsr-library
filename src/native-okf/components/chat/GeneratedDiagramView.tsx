"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
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
  GeneratedDiagram,
  GeneratedDiagramNode,
} from "../../shared/chat-types.ts";
import { conceptHref } from "../../shared/links.ts";

interface DiagramNodeData {
  node: GeneratedDiagramNode;
}

const NODE_WIDTH = 220;
const COLUMN_GAP = 290;
const ROW_GAP = 126;

function compareDiagramNodes(
  left: GeneratedDiagramNode,
  right: GeneratedDiagramNode,
): number {
  return left.label.localeCompare(right.label) || left.id.localeCompare(right.id);
}

function diagramLayers(diagram: GeneratedDiagram): Map<string, number> {
  const nodeIds = new Set(diagram.nodes.map((node) => node.id));
  const outgoing = new Map<string, string[]>(
    diagram.nodes.map((node) => [node.id, []]),
  );
  const indegree = new Map<string, number>(
    diagram.nodes.map((node) => [node.id, 0]),
  );

  for (const edge of diagram.edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) continue;
    outgoing.get(edge.source)?.push(edge.target);
    indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
  }
  for (const targets of outgoing.values()) targets.sort();

  const queue = diagram.nodes
    .filter((node) => (indegree.get(node.id) ?? 0) === 0)
    .sort(compareDiagramNodes)
    .map((node) => node.id);
  const layers = new Map<string, number>(queue.map((id) => [id, 0]));

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const source = queue[cursor];
    if (!source) continue;
    const sourceLayer = layers.get(source) ?? 0;

    for (const target of outgoing.get(source) ?? []) {
      layers.set(target, Math.max(layers.get(target) ?? 0, sourceLayer + 1));
      const nextIndegree = (indegree.get(target) ?? 1) - 1;
      indegree.set(target, nextIndegree);
      if (nextIndegree === 0) queue.push(target);
    }
  }

  const fallbackLayer =
    Math.max(0, ...layers.values()) + (layers.size === diagram.nodes.length ? 0 : 1);
  for (const node of [...diagram.nodes].sort(compareDiagramNodes)) {
    if (!layers.has(node.id)) layers.set(node.id, fallbackLayer);
  }

  return layers;
}

function layoutDiagram(diagram: GeneratedDiagram): Node<DiagramNodeData>[] {
  const layers = diagramLayers(diagram);
  const grouped = new Map<number, GeneratedDiagramNode[]>();

  for (const node of diagram.nodes) {
    const layer = layers.get(node.id) ?? 0;
    const group = grouped.get(layer) ?? [];
    group.push(node);
    grouped.set(layer, group);
  }

  const result: Node<DiagramNodeData>[] = [];
  for (const layer of [...grouped.keys()].sort((left, right) => left - right)) {
    const group = (grouped.get(layer) ?? []).sort(compareDiagramNodes);
    group.forEach((diagramNode, row) => {
      result.push({
        id: diagramNode.id,
        type: "generated",
        position: {
          x: layer * COLUMN_GAP,
          y: (row - (group.length - 1) / 2) * ROW_GAP,
        },
        data: { node: diagramNode },
        draggable: false,
        selectable: true,
      });
    });
  }

  return result;
}

function GeneratedNode({ data, selected }: NodeProps<DiagramNodeData>) {
  const { node } = data;
  const border = node.synthesis ? "#7c5c99" : "#4f6f91";
  const background = node.synthesis ? "#f7f1fb" : "#f7fafc";

  return (
    <div
      className={`rounded-xl border-2 px-4 py-3 shadow-md ${
        node.synthesis ? "border-dashed" : ""
      }`}
      style={{
        width: NODE_WIDTH,
        borderColor: selected ? "#20242a" : border,
        backgroundColor: background,
        boxShadow: selected
          ? "0 0 0 3px rgba(79, 111, 145, 0.2), 0 10px 24px rgba(32, 36, 42, 0.14)"
          : "0 6px 16px rgba(32, 36, 42, 0.08)",
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2.5 !w-2.5 !border-2 !bg-white"
        style={{ borderColor: border }}
      />
      <div className="flex items-start justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
          {node.category}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
            node.synthesis
              ? "bg-purple/10 text-purple"
              : "bg-blue/10 text-blue"
          }`}
        >
          {node.synthesis ? "Synthesis" : "Stored"}
        </span>
      </div>
      <p className="mt-2 line-clamp-3 text-sm font-semibold leading-5 text-ink">
        {node.label}
      </p>
      <p className="mt-2 text-[10px] text-muted">
        {node.sourcePaths.length} source{node.sourcePaths.length === 1 ? "" : "s"}
      </p>
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2.5 !w-2.5 !border-2 !bg-white"
        style={{ borderColor: border }}
      />
    </div>
  );
}

const NODE_TYPES = { generated: GeneratedNode } satisfies NodeTypes;

function diagramEdges(diagram: GeneratedDiagram): Edge[] {
  const nodeIds = new Set(diagram.nodes.map((node) => node.id));

  return diagram.edges
    .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
    .map((edge, index) => ({
      id: `${edge.source}->${edge.target}:${index}`,
      source: edge.source,
      target: edge.target,
      type: "smoothstep",
      label: edge.label,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#667085",
        width: 18,
        height: 18,
      },
      style: { stroke: "#667085", strokeWidth: 1.4 },
      labelStyle: { fill: "#4b5563", fontSize: 10, fontWeight: 600 },
      labelBgStyle: { fill: "#f7f6f1", fillOpacity: 0.94 },
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 4,
    }));
}

export function GeneratedDiagramView({
  diagram,
}: {
  diagram: GeneratedDiagram;
}) {
  const [selectedId, setSelectedId] = useState<string | undefined>(
    diagram.nodes[0]?.id,
  );
  const flowNodes = useMemo(
    () =>
      layoutDiagram(diagram).map((node) => ({
        ...node,
        selected: node.id === selectedId,
      })),
    [diagram, selectedId],
  );
  const flowEdges = useMemo(() => diagramEdges(diagram), [diagram]);
  const selectedNode =
    diagram.nodes.find((node) => node.id === selectedId) ?? null;

  return (
    <section
      aria-label="Grounded generated diagram"
      className="overflow-hidden rounded-2xl border border-line bg-white shadow-research"
    >
      <div className="border-b border-line bg-paper px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue">
              Grounded diagram
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
      </div>

      {diagram.nodes.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-muted">
          No diagram nodes were returned.
        </div>
      ) : (
        <div className="grid lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="h-[520px] min-h-[420px] bg-paper research-grid">
            <ReactFlow
              nodes={flowNodes}
              edges={flowEdges}
              nodeTypes={NODE_TYPES}
              fitView
              fitViewOptions={{ padding: 0.18, maxZoom: 1 }}
              minZoom={0.1}
              maxZoom={1.5}
              nodesDraggable={false}
              nodesConnectable={false}
              edgesFocusable={false}
              zoomOnDoubleClick={false}
              onNodeClick={(_event, node) => setSelectedId(node.id)}
              onPaneClick={() => setSelectedId(undefined)}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#d8d6cc" gap={28} size={1} />
              <Controls showInteractive={false} />
            </ReactFlow>
          </div>

          <aside className="border-t border-line bg-white p-5 lg:border-l lg:border-t-0">
            {selectedNode ? (
              <>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted">
                  Selected node
                </p>
                <h4 className="mt-2 text-base font-semibold leading-6 text-ink">
                  {selectedNode.label}
                </h4>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-line bg-paper px-2.5 py-1 text-xs font-semibold text-muted">
                    {selectedNode.category}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      selectedNode.synthesis
                        ? "bg-purple/10 text-purple"
                        : "bg-blue/10 text-blue"
                    }`}
                  >
                    {selectedNode.synthesis ? "New synthesis" : "Directly grounded"}
                  </span>
                </div>
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-muted">
                  Grounding sources
                </p>
                <ul className="mt-2 space-y-2">
                  {selectedNode.sourcePaths.map((sourcePath) => (
                    <li key={sourcePath}>
                      <Link
                        href={conceptHref(sourcePath)}
                        className="break-all font-mono text-xs leading-5 text-blue underline decoration-blue/30 underline-offset-2 hover:text-ink"
                      >
                        {sourcePath}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-sm leading-6 text-muted">
                Select a node to inspect its grounding and whether it represents
                stored knowledge or a new synthesis.
              </p>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}
