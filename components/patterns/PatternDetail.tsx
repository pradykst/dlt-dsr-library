import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { getNodeById, getPaperById } from "@/lib/knowledge";
import type { Pattern } from "@/lib/types";

export function PatternDetail({ pattern }: { pattern: Pattern }) {
  return (
    <section className="border border-line bg-white p-6 shadow-research">
      <Badge>Synthesized from paper</Badge>
      <h2 className="mt-4 font-serif text-3xl text-ink">{pattern.title}</h2>
      <p className="mt-3 text-base leading-7 text-slate-700">{pattern.summary}</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Info title="Problem addressed" items={[pattern.problemAddressed]} />
        <Info title="When to use" items={pattern.whenToUse} />
        <Info title="Design logic" items={pattern.designLogic} />
        <Info title="Implementation features" items={pattern.implementationFeatures} />
        <Info title="Limitations or cautions" items={pattern.limitations} />
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Papers where observed</h3>
          <div className="mt-3 space-y-2">
            {pattern.observedInPaperIds.map((id) => {
              const paper = getPaperById(id);
              return paper ? <Link key={id} href={`/papers/${id}`} className="block border border-line bg-paper px-3 py-2 text-sm text-blue hover:border-blue">{paper.shortTitle}</Link> : null;
            })}
          </div>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Related capabilities</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {pattern.relatedCapabilityIds.map((id) => <Badge key={id}>{getNodeById(id)?.label ?? id}</Badge>)}
          </div>
        </div>
      </div>
    </section>
  );
}

function Info({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
        {items.map((item) => <li key={item} className="border-l border-line pl-3">{item}</li>)}
      </ul>
    </div>
  );
}
