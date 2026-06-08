import { ArrowRight } from "lucide-react";

export function DemoFlow({ nodes, visibleCount = nodes.length, compact }: { nodes: string[]; visibleCount?: number; compact?: boolean }) {
  const visible = nodes.slice(0, Math.max(1, visibleCount));

  return (
    <div className="max-w-full overflow-x-auto">
      <div className={compact ? "flex min-w-[720px] items-stretch gap-2" : "flex min-w-[860px] items-stretch gap-2"}>
        {visible.map((node, index) => (
          <div key={node} className="flex flex-1 items-center gap-2">
            <div className="demo-flow-node flex min-h-20 flex-1 items-center border border-line bg-white px-3 py-3 text-sm font-medium leading-5 text-ink">
              {node}
            </div>
            {index < visible.length - 1 && <ArrowRight className="h-4 w-4 shrink-0 text-blue" />}
          </div>
        ))}
      </div>
    </div>
  );
}
