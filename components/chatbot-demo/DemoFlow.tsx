import { ArrowDown, ArrowRight } from "lucide-react";

export function DemoFlow({ nodes, visibleCount = nodes.length, compact }: { nodes: string[]; visibleCount?: number; compact?: boolean }) {
  const visible = nodes.slice(0, Math.max(1, visibleCount));

  return (
    <div className="max-w-full overflow-x-auto">
      <div className={compact ? "flex flex-col sm:flex-row sm:min-w-[720px] items-stretch gap-2" : "flex flex-col sm:flex-row sm:min-w-[860px] items-stretch gap-2"}>
        {visible.map((node, index) => (
          <div key={node} className="flex flex-col sm:flex-row flex-1 items-center gap-2">
            <div className="demo-flow-node flex min-h-16 w-full flex-1 items-center justify-center border border-line bg-white px-3 py-3 text-center text-sm font-medium leading-5 text-ink sm:min-h-20 sm:w-auto sm:justify-start sm:text-left">
              {node}
            </div>
            {index < visible.length - 1 && (
              <>
                <ArrowRight className="hidden h-4 w-4 shrink-0 text-blue sm:block" />
                <ArrowDown className="block h-4 w-4 shrink-0 text-blue sm:hidden" />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
