import Link from "next/link";
import { getEdgesForNode, getNodeById, getPaperById, getPaperFlow } from "@/lib/knowledge";
import type { KnowledgeNode } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";

export function DetailPanel({ node }: { node?: KnowledgeNode }) {
  if (!node) {
    return (
      <aside className="h-full border-l border-line bg-white p-5">
        <h2 className="font-serif text-xl text-ink">Evidence lens</h2>
        <p className="mt-3 text-sm leading-6 text-muted">Select a node to inspect its description, immediate relationships, source papers, and synthesized design role.</p>
      </aside>
    );
  }

  const edges = getEdgesForNode(node.id);
  const sourcePaperIds = Array.from(new Set([
    ...(node.paperIds ?? []),
    ...edges.flatMap((edge) => edge.paperIds ?? [])
  ]));
  const evidence = sourcePaperIds.map((id) => {
    const paper = getPaperById(id);
    const flow = getPaperFlow(id);
    return paper ? { paper, artifact: flow.artifacts[0], evaluation: flow.evaluations[0] } : null;
  }).filter(Boolean) as Array<{
    paper: NonNullable<ReturnType<typeof getPaperById>>;
    artifact?: KnowledgeNode;
    evaluation?: KnowledgeNode;
  }>;
  return (
    <aside className="h-full overflow-y-auto border-l border-line bg-white p-5">
      <Badge>{node.type}</Badge>
      <h2 className="mt-4 font-serif text-2xl leading-tight text-ink">{node.label}</h2>
      {node.subtitle && <p className="mt-1 text-sm text-muted">{node.subtitle}</p>}
      <p className="mt-4 text-sm leading-6 text-slate-700">{node.description}</p>
      {evidence.length ? (
        <div className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Evidence provenance</h3>
          <div className="mt-3 space-y-3">
            {evidence.map(({ paper, artifact, evaluation }) => (
              <div key={paper.id} className="border border-line bg-paper p-3">
                <Link className="text-sm font-semibold text-blue hover:underline" href={`/papers/${paper.id}`}>{paper.shortTitle}</Link>
                <div className="mt-2 space-y-1 text-xs leading-5 text-muted">
                  <div><span className="font-semibold text-ink">Artifact:</span> {artifact?.label ?? paper.artifact}</div>
                  <div><span className="font-semibold text-ink">Evaluation:</span> {evaluation?.label ?? paper.evaluation}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <div className="mt-6">
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Immediate relationships</h3>
        <div className="mt-3 space-y-2">
          {edges.slice(0, 12).map((edge) => {
            const other = getNodeById(edge.source === node.id ? edge.target : edge.source);
            return (
              <div key={edge.id} className="border border-line bg-paper p-2">
                <div className="text-[11px] uppercase tracking-[0.12em] text-muted">{edge.label}</div>
                <div className="text-sm font-medium text-ink">{other?.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
