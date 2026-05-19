import { PageShell } from "@/components/layout/PageShell";
import { MiniFlowStrip } from "@/components/visuals/MiniFlowStrip";
import { Card } from "@/components/ui/Card";

const nodeTypes = [
  ["Problem context", "The situated design challenge, such as consent fragmentation or two-sided opportunism."],
  ["Design requirements", "Normative and functional needs motivated by the problem context."],
  ["Design principles", "Generalized design logic that explains how requirements can be satisfied."],
  ["Design features", "Concrete mechanisms such as wallet login, hash anchoring, tokens, or private data collections."],
  ["Artifact", "The instantiated DLT system, architecture, framework, or method."],
  ["Evaluation", "Interviews, field tests, experiments, surveys, case studies, or technical validation."],
  ["Pattern", "Reusable abstraction observed across one or more design-science papers."]
];

const edges = ["addresses", "motivates", "satisfies", "implements", "instantiated in", "evaluated by", "observed in", "supports", "grounded in", "generalizes to"];

export default function MethodologyPage() {
  return (
    <PageShell className="space-y-8">
      <section className="border border-line bg-white p-6 shadow-research">
        <h1 className="font-serif text-3xl text-ink">Methodology</h1>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-700">
          The library structures DLT design-science knowledge as a traceable chain: problem context to design requirements, design principles, design features, artifact, evaluation, and reusable pattern. This makes design logic inspectable without reducing the corpus to a flat table.
        </p>
        <div className="mt-6"><MiniFlowStrip /></div>
      </section>
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <Card className="p-5">
          <h2 className="font-serif text-2xl text-ink">Node Types</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {nodeTypes.map(([title, description]) => (
              <div key={title} className="border border-line bg-paper p-4">
                <h3 className="text-sm font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-serif text-2xl text-ink">Edge Types</h2>
          <p className="mt-2 text-sm leading-6 text-muted">Edges describe the design-science relationship between nodes and preserve the direction of design reasoning.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {edges.map((edge) => <span key={edge} className="border border-line bg-paper px-2 py-1 text-xs uppercase tracking-[0.12em] text-muted">{edge}</span>)}
          </div>
          <h3 className="mt-7 text-xs font-semibold uppercase tracking-[0.12em] text-muted">V1 scope</h3>
          <p className="mt-2 text-sm leading-6 text-slate-700">Version 1 is seeded from selected DLT design science papers. All paper chains and patterns are concise synthesized abstractions intended for research demonstration and extension.</p>
        </Card>
      </div>
    </PageShell>
  );
}
