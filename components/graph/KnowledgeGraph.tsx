"use client";

import { useMemo, useState } from "react";
import ReactFlow, { Background, Controls, MarkerType, MiniMap, Panel, useReactFlow, ReactFlowProvider, type Edge, type Node } from "reactflow";
import "reactflow/dist/style.css";
import { Maximize2, Minimize2 } from "lucide-react";
import { GraphFilters } from "@/components/graph/GraphFilters";
import { GraphNode } from "@/components/graph/GraphNode";
import { getGraphForFilters } from "@/lib/knowledge";
import type { KnowledgeEdge, KnowledgeNode, NodeType } from "@/lib/types";
import { edgeColor, nodeTypeColors } from "@/lib/colors";

const nodeTypes = { knowledge: GraphNode };
const columns: NodeType[] = ["problem", "requirement", "principle", "feature", "capability", "pattern"];
type ActiveSelection = { type: "node"; id: string } | { type: "edge"; id: string } | null;

function getColumnForType(type: NodeType, useSparseLayout: boolean) {
  if (useSparseLayout) {
    if (type === "problem") return 0;
    if (type === "requirement") return 1;
    if (type === "principle") return 2;
    if (type === "feature") return 3;
    if (type === "capability") return 4;
    if (type === "pattern") return 5;
  }
  return columns.indexOf(type);
}

function InnerGraph({ onSelect }: { onSelect: (node?: KnowledgeNode) => void }) {
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [paperId, setPaperId] = useState("all");
  const [capabilityId, setCapabilityId] = useState("all");
  const [problemId, setProblemId] = useState("all");
  const [expanded, setExpanded] = useState(false);
  const [activeSelection, setActiveSelection] = useState<ActiveSelection>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { fitView } = useReactFlow();

  const graph = useMemo(() => getGraphForFilters({
    query,
    includeExpanded: expanded,
    nodeTypes: selectedType === "all" ? undefined : [selectedType as NodeType],
    paperIds: paperId === "all" ? undefined : [paperId],
    capabilityIds: capabilityId === "all" ? undefined : [capabilityId],
    problemIds: problemId === "all" ? undefined : [problemId]
  }), [query, expanded, selectedType, paperId, capabilityId, problemId]);

  const useSparseLayout = !expanded && selectedType === "all";

  const focus = useMemo(() => {
    if (!activeSelection) return { nodeIds: new Set<string>(), edgeIds: new Set<string>(), isActive: false };
    if (activeSelection.type === "edge") {
      const edge = graph.edges.find((item) => item.id === activeSelection.id);
      return {
        nodeIds: new Set(edge ? [edge.source, edge.target] : []),
        edgeIds: new Set(edge ? [edge.id] : []),
        isActive: true
      };
    }

    const edgeIds = new Set<string>();
    const nodeIds = new Set<string>([activeSelection.id]);
    for (const edge of graph.edges) {
      if (edge.source === activeSelection.id || edge.target === activeSelection.id) {
        edgeIds.add(edge.id);
        nodeIds.add(edge.source);
        nodeIds.add(edge.target);
      }
    }
    return { nodeIds, edgeIds, isActive: true };
  }, [activeSelection, graph.edges]);

  const nodes: Node<KnowledgeNode>[] = useMemo(() => {
    const rowCount = new Map<NodeType, number>();
    return graph.nodes.map((node) => {
      const column = Math.max(0, getColumnForType(node.type, useSparseLayout));
      const row = rowCount.get(node.type) ?? 0;
      rowCount.set(node.type, row + 1);
      const isHighlighted = focus.nodeIds.has(node.id);
      return {
        id: node.id,
        type: "knowledge",
        position: { x: column * 300, y: row * 136 },
        data: {
          ...node,
          isHighlighted,
          isDimmed: focus.isActive && !isHighlighted
        }
      };
    });
  }, [focus, graph.nodes, useSparseLayout]);

  const edges: Edge[] = useMemo(() => graph.edges.map((edge) => {
    const isHighlighted = focus.edgeIds.has(edge.id);
    const isDimmed = focus.isActive && !isHighlighted;
    return buildEdge(edge, isHighlighted, isDimmed);
  }), [focus, graph.edges]);

  const graphCanvas = (
    <div className={isFullscreen ? "fixed inset-4 z-50 border border-line bg-white shadow-2xl" : "relative"}>
      {isFullscreen && (
        <button
          type="button"
          aria-label="Close graph fullscreen"
          className="fixed inset-0 -z-10 bg-ink/25"
          onClick={() => setIsFullscreen(false)}
        />
      )}
      <div className="absolute right-3 top-3 z-10 flex gap-2">
        <button className="border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink shadow-sm" onClick={() => fitView({ padding: 0.18 })}>Fit view</button>
        <button className="border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink shadow-sm" onClick={() => { setQuery(""); setSelectedType("all"); setPaperId("all"); setCapabilityId("all"); setProblemId("all"); setExpanded(false); setActiveSelection(null); onSelect(undefined); }}>Reset view</button>
        {activeSelection && <button className="border border-line bg-white px-3 py-1.5 text-xs font-medium text-blue shadow-sm" onClick={() => { setActiveSelection(null); onSelect(undefined); }}>Clear focus</button>}
        {paperId !== "all" && <button className="border border-line bg-white px-3 py-1.5 text-xs font-medium text-blue shadow-sm" onClick={() => setExpanded(true)}>Show only selected paper</button>}
        <button
          className="inline-flex items-center gap-1 border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink shadow-sm hover:border-blue"
          onClick={() => {
            setIsFullscreen((current) => !current);
            window.setTimeout(() => fitView({ padding: 0.18 }), 80);
          }}
        >
          {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          {isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        </button>
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{ type: "smoothstep" }}
        onNodeClick={(_, node) => {
          setActiveSelection({ type: "node", id: node.id });
          onSelect(node.data);
        }}
        onEdgeClick={(_, edge) => {
          setActiveSelection({ type: "edge", id: edge.id });
        }}
        onPaneClick={() => {
          setActiveSelection(null);
          onSelect(undefined);
        }}
        fitView
        minZoom={0.2}
      >
        <Background color="#d8d6cc" gap={28} />
        <Controls />
        <Panel position="bottom-left" className="border border-line bg-white px-2 py-1 text-xs text-muted shadow-sm">
          Click a node or edge to focus its local chain.
        </Panel>
        <MiniMap nodeColor={(node) => nodeTypeColors[(node.data as KnowledgeNode).type].dot} />
      </ReactFlow>
    </div>
  );

  return (
    <div className="grid h-[760px] grid-cols-[280px_1fr] border border-line bg-white shadow-research">
      <GraphFilters query={query} setQuery={setQuery} selectedType={selectedType} setSelectedType={setSelectedType} paperId={paperId} setPaperId={setPaperId} capabilityId={capabilityId} setCapabilityId={setCapabilityId} problemId={problemId} setProblemId={setProblemId} />
      {graphCanvas}
    </div>
  );
}

export function KnowledgeGraph({ onSelect }: { onSelect: (node?: KnowledgeNode) => void }) {
  return (
    <ReactFlowProvider>
      <InnerGraph onSelect={onSelect} />
    </ReactFlowProvider>
  );
}

function buildEdge(edge: KnowledgeEdge, isHighlighted: boolean, isDimmed: boolean): Edge {
  const stroke = isHighlighted ? "#2f5f85" : edgeColor;
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: "smoothstep",
    label: isHighlighted ? edge.label : undefined,
    interactionWidth: 24,
    zIndex: isHighlighted ? 20 : 0,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: stroke,
      width: 14,
      height: 14
    },
    style: {
      stroke,
      strokeWidth: isHighlighted ? 3.5 : Math.max(1.4, edge.strength),
      opacity: isDimmed ? 0.12 : isHighlighted ? 0.95 : 0.42
    },
    labelStyle: { fill: "#2f3a44", fontSize: 10, fontWeight: 600 },
    labelBgStyle: { fill: "#ffffff", fillOpacity: 0.9 },
    labelBgPadding: [4, 3]
  };
}
