import type { NodeProps } from "reactflow";
import { Handle, Position } from "reactflow";
import { nodeTypeColors } from "@/lib/colors";
import type { KnowledgeNode } from "@/lib/types";

export function GraphNode({ data, selected }: NodeProps<KnowledgeNode>) {
  const colors = nodeTypeColors[data.type];
  return (
    <div className="w-52 border bg-white p-3 text-left shadow-sm transition" style={{ borderColor: selected ? colors.dot : colors.border, background: colors.bg }}>
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-0" style={{ background: colors.dot }} />
      <div className="mb-2 flex items-center gap-2">
        <span className="h-2 w-2" style={{ background: colors.dot }} />
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: colors.text }}>{data.type}</span>
      </div>
      <div className="text-sm font-semibold leading-5" style={{ color: colors.text }}>{data.label}</div>
      {data.subtitle && <div className="mt-1 text-xs leading-4 text-muted">{data.subtitle}</div>}
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-0" style={{ background: colors.dot }} />
    </div>
  );
}
