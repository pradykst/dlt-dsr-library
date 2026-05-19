"use client";

import { useMemo, useState } from "react";
import ReactFlow, { Background, Controls, MiniMap, useReactFlow, ReactFlowProvider, type Edge, type Node } from "reactflow";
import "reactflow/dist/style.css";
import { GraphNode } from "@/components/graph/GraphNode";
import { getGraphForFilters } from "@/lib/knowledge";
import type { KnowledgeNode, NodeType } from "@/lib/types";
import { edgeColor, nodeTypeColors } from "@/lib/colors";

const nodeTypes = { knowledge: GraphNode };
const columns: NodeType[] = ["paper", "problem", "requirement", "principle", "feature", "artifact", "evaluation", "capability", "pattern"];

function InnerGraph({ onSelect }: { onSelect: (node?: KnowledgeNode) => void }) {
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [paperId, setPaperId] = useState("all");
  const [capabilityId, setCapabilityId] = useState("all");
  const [problemId, setProblemId] = useState("all");
  const [expanded, setExpanded] = useState(false);
  const { fitView } = useReactFlow();

  const graph = useMemo(() => getGraphForFilters({
    query,
    includeExpanded: expanded,
    nodeTypes: selectedType === "all" ? undefined : [selectedType as NodeType],
    paperIds: paperId === "all" ? undefined : [paperId],
    capabilityIds: capabilityId === "all" ? undefined : [capabilityId],
    problemIds: problemId === "all" ? undefined : [problemId]
  }), [query, expanded, selectedType, paperId, capabilityId, problemId]);

  const nodes: Node<KnowledgeNode>[] = useMemo(() => {
    const rowCount = new Map<NodeType, number>();
    return graph.nodes.map((node) => {
      const column = Math.max(0, columns.indexOf(node.type));
      const row = rowCount.get(node.type) ?? 0;
      rowCount.set(node.type, row + 1);
      return {
        id: node.id,
        type: "knowledge",
        position: { x: column * 270, y: row * 126 },
        data: node
      };
    });
  }, [graph.nodes]);

  const edges: Edge[] = useMemo(() => graph.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    animated: false,
    style: { stroke: edgeColor, strokeWidth: edge.strength },
    labelStyle: { fill: "#667085", fontSize: 10 },
    labelBgStyle: { fill: "#f7f6f1", fillOpacity: 0.8 }
  })), [graph.edges]);

  return (
    <div className="grid h-[760px] grid-cols-[280px_1fr] border border-line bg-white shadow-research">
      <GraphFilters query={query} setQuery={setQuery} selectedType={selectedType} setSelectedType={setSelectedType} paperId={paperId} setPaperId={setPaperId} capabilityId={capabilityId} setCapabilityId={setCapabilityId} problemId={problemId} setProblemId={setProblemId} expanded={expanded} setExpanded={setExpanded} />
      <div className="relative">
        <div className="absolute right-3 top-3 z-10 flex gap-2">
          <button className="border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink shadow-sm" onClick={() => fitView({ padding: 0.18 })}>Fit view</button>
          <button className="border border-line bg-white px-3 py-1.5 text-xs font-medium text-ink shadow-sm" onClick={() => { setQuery(""); setSelectedType("all"); setPaperId("all"); setCapabilityId("all"); setProblemId("all"); setExpanded(false); onSelect(undefined); }}>Reset view</button>
          {paperId !== "all" && <button className="border border-line bg-white px-3 py-1.5 text-xs font-medium text-blue shadow-sm" onClick={() => setExpanded(true)}>Show only selected paper</button>}
        </div>
        <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodeClick={(_, node) => onSelect(node.data)} fitView minZoom={0.2}>
          <Background color="#d8d6cc" gap={28} />
          <Controls />
          <MiniMap nodeColor={(node) => nodeTypeColors[(node.data as KnowledgeNode).type].dot} />
        </ReactFlow>
      </div>
    </div>
  );
}

import { GraphFilters } from "@/components/graph/GraphFilters";

export function KnowledgeGraph({ onSelect }: { onSelect: (node?: KnowledgeNode) => void }) {
  return (
    <ReactFlowProvider>
      <InnerGraph onSelect={onSelect} />
    </ReactFlowProvider>
  );
}
