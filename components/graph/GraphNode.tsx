import type { NodeProps } from "reactflow";
import { Handle, Position } from "reactflow";
import { nodeTypeColors } from "@/lib/colors";
import type { KnowledgeNode } from "@/lib/types";

type GraphNodeData = KnowledgeNode & {
  isDimmed?: boolean;
  isHighlighted?: boolean;
};

export function GraphNode({ data, selected }: NodeProps<GraphNodeData>) {
  const colors = nodeTypeColors[data.type];
  return (
    <div
      className="w-52 border bg-white p-3 text-left shadow-sm transition"
      style={{
        borderColor: selected || data.isHighlighted ? colors.dot : colors.border,
        background: colors.bg,
        boxShadow: data.isHighlighted ? `0 0 0 2px ${colors.dot}33, 0 14px 28px rgba(32, 36, 42, 0.12)` : undefined,
        opacity: data.isDimmed ? 0.28 : 1
      }}
    >
      <Handle id="left-target" type="target" position={Position.Left} className="!h-2.5 !w-2.5 !border-2 !border-white" style={{ background: colors.dot }} />
      <Handle id="left-source" type="source" position={Position.Left} className="!h-2.5 !w-2.5 !border-2 !border-white" style={{ background: colors.dot, top: "68%" }} />
      <div className="mb-2 flex items-center gap-2">
        <span className="h-2 w-2" style={{ background: colors.dot }} />
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: colors.text }}>{data.type}</span>
      </div>
      <div className="text-sm font-semibold leading-5" style={{ color: colors.text }}>{data.label}</div>
      {data.subtitle && <div className="mt-1 text-xs leading-4 text-muted">{data.subtitle}</div>}
      <Handle id="right-source" type="source" position={Position.Right} className="!h-2.5 !w-2.5 !border-2 !border-white" style={{ background: colors.dot }} />
      <Handle id="right-target" type="target" position={Position.Right} className="!h-2.5 !w-2.5 !border-2 !border-white" style={{ background: colors.dot, top: "68%" }} />
    </div>
  );
}
