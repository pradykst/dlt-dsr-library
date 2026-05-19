import Link from "next/link";
import { getEdgesForNode, getNodeById, getPaperById } from "@/lib/knowledge";
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
  return (
    <aside className="h-full overflow-y-auto border-l border-line bg-white p-5">
      <Badge>{node.type}</Badge>
      <h2 className="mt-4 font-serif text-2xl leading-tight text-ink">{node.label}</h2>
      {node.subtitle && <p className="mt-1 text-sm text-muted">{node.subtitle}</p>}
      <p className="mt-4 text-sm leading-6 text-slate-700">{node.description}</p>
      {node.type === "paper" && <Link href={`/papers/${node.id}`} className="mt-4 inline-flex border border-line px-3 py-2 text-sm font-medium text-blue hover:border-blue">Open paper lens</Link>}
      {node.paperIds?.length ? (
        <div className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Synthesized from paper</h3>
          <div className="mt-2 space-y-2">
            {node.paperIds.map((id) => {
              const paper = getPaperById(id);
              return paper ? <Link className="block text-sm text-blue hover:underline" href={`/papers/${id}`} key={id}>{paper.shortTitle}</Link> : null;
            })}
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
