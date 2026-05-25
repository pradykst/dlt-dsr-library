import { Badge } from "@/components/ui/Badge";
import type { DsrField } from "@/lib/ingest/parser-types";
import { confidenceBadge } from "@/lib/ingest/text-utils";

export function ExtractedEvidencePanel({ field }: { field?: DsrField }) {
  return (
    <section className="border border-line bg-white p-5 shadow-research">
      <h2 className="font-serif text-xl text-ink">Evidence Snippet</h2>
      {!field ? (
        <p className="mt-3 text-sm leading-6 text-muted">Select a generated grid item or flow node to inspect the source quote and extraction rule.</p>
      ) : (
        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            <Badge>{field.section ?? "field"}</Badge>
            <Badge>{confidenceBadge(field.confidence)} confidence</Badge>
            {field.pageNumber && <Badge>page {field.pageNumber}</Badge>}
          </div>
          <h3 className="mt-4 text-base font-semibold text-ink">{field.label}</h3>
          <p className="mt-3 text-sm leading-6 text-slate-700">{field.sourceQuote}</p>
          <div className="mt-4 border border-line bg-paper p-3 text-xs leading-5 text-muted">
            <div><span className="font-semibold text-ink">Rule:</span> {field.extractionRule}</div>
            <div><span className="font-semibold text-ink">Confidence:</span> {field.confidence.toFixed(2)}</div>
            {field.confidence < 0.55 && <div className="mt-2 text-amber">Warning: low confidence extraction. Interpret carefully.</div>}
          </div>
        </div>
      )}
    </section>
  );
}
