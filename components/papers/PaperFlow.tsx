import { ArrowRight } from "lucide-react";
import { getPaperFlow } from "@/lib/knowledge";

const sections = [
  ["Problem", "problems"],
  ["Requirements", "requirements"],
  ["Principles", "principles"],
  ["Features", "features"],
  ["Artifact", "artifacts"],
  ["Evaluation", "evaluations"],
  ["Pattern", "patterns"]
] as const;

export function PaperFlow({ paperId }: { paperId: string }) {
  const flow = getPaperFlow(paperId);
  return (
    <section className="border border-line bg-white p-5 shadow-research">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-serif text-2xl text-ink">Synthesized Design Chain</h2>
        <span className="text-xs uppercase tracking-[0.12em] text-muted">Problem to pattern</span>
      </div>
      <div className="overflow-x-auto">
        <div className="flex min-w-[1100px] items-stretch gap-2">
          {sections.map(([label, key], index) => (
            <div key={key} className="flex flex-1 items-center gap-2">
              <div className="h-full flex-1 border border-line bg-paper p-3">
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</div>
                <div className="mt-3 space-y-2">
                  {flow[key].slice(0, 4).map((node) => <div key={node.id} className="border border-line bg-white px-2 py-2 text-xs leading-5 text-ink">{node.label}</div>)}
                </div>
              </div>
              {index < sections.length - 1 && <ArrowRight className="h-4 w-4 shrink-0 text-muted" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
