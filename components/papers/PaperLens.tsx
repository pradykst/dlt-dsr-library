import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { getNodeById, getPaperFlow, patterns } from "@/lib/knowledge";
import type { Paper } from "@/lib/types";
import { EvidenceBadge } from "@/components/papers/EvidenceBadge";
import { PaperFlow } from "@/components/papers/PaperFlow";

export function PaperLens({ paper }: { paper: Paper }) {
  const flow = getPaperFlow(paper.id);
  const relatedPatterns = patterns.filter((pattern) => pattern.observedInPaperIds.includes(paper.id));
  const capabilityIds = Array.from(new Set(relatedPatterns.flatMap((pattern) => pattern.relatedCapabilityIds)));

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <Badge>Synthesized design chain</Badge>
        <h1 className="mt-4 max-w-4xl font-serif text-3xl leading-tight text-ink">{paper.title}</h1>
        <p className="mt-3 text-sm text-muted">{paper.authors} · {paper.year} · {paper.venue}</p>
        <div className="mt-5 flex flex-wrap gap-2">{paper.tags.map((tag) => <EvidenceBadge key={tag}>{tag}</EvidenceBadge>)}</div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Info title="Domain and problem statement" text={`${paper.domain}. ${paper.problemFocus}`} />
          <Info title="Artifact" text={paper.artifact} />
          <Info title="Evaluation" text={paper.evaluation} />
          <Info title="Contribution" text={paper.contribution} />
        </div>
      </Card>
      <PaperFlow paperId={paper.id} />
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <Card className="p-5">
          <h2 className="font-serif text-2xl text-ink">Related Patterns</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {relatedPatterns.map((pattern) => (
              <Link key={pattern.id} href="/patterns" className="border border-line bg-paper p-4 transition hover:border-blue">
                <h3 className="text-sm font-semibold text-ink">{pattern.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{pattern.summary}</p>
              </Link>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-serif text-2xl text-ink">Evidence Panel</h2>
          <p className="mt-2 text-sm leading-6 text-muted">The chain is an abstraction of design-science knowledge, not a verbatim extraction.</p>
          <div className="mt-4 space-y-3 text-sm">
            <div><strong>{flow.requirements.length}</strong> requirements identified</div>
            <div><strong>{flow.principles.length}</strong> principles linked</div>
            <div><strong>{flow.features.length}</strong> features mapped</div>
            <div><strong>{relatedPatterns.length}</strong> reusable patterns observed</div>
          </div>
          <h3 className="mt-6 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Related DLT capabilities</h3>
          <div className="mt-3 flex flex-wrap gap-2">{capabilityIds.map((id) => <Badge key={id}>{getNodeById(id)?.label ?? id}</Badge>)}</div>
        </Card>
      </div>
    </div>
  );
}

function Info({ title, text }: { title: string; text: string }) {
  return (
    <div className="border-l border-line pl-4">
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{title}</div>
      <p className="mt-2 text-sm leading-6 text-slate-700">{text}</p>
    </div>
  );
}
