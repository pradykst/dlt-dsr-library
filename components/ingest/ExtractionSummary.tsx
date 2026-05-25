import type { ExtractedMetadata, PdfExtractionResult } from "@/lib/ingest/parser-types";

export function ExtractionSummary({ extraction, metadata }: { extraction?: PdfExtractionResult; metadata?: ExtractedMetadata }) {
  return (
    <section className="border border-line bg-white p-5 shadow-research">
      <h2 className="font-serif text-xl text-ink">Extraction Summary</h2>
      <div className="mt-4 grid gap-3 text-sm text-muted">
        <Info label="Title" value={metadata?.title ?? "Not extracted"} />
        <Info label="Authors" value={metadata?.authors.length ? metadata.authors.join(", ") : "Not extracted"} />
        <Info label="Year" value={metadata?.year?.toString() ?? "Not extracted"} />
        <Info label="Pages" value={extraction?.pageCount.toString() ?? "n/a"} />
        <Info label="Characters" value={extraction ? extraction.fullText.length.toLocaleString() : "n/a"} />
        <Info label="Keywords" value={metadata?.keywords.length ? metadata.keywords.join(", ") : "Not extracted"} />
      </div>
      {metadata?.abstract && (
        <p className="mt-4 border-l border-line pl-3 text-sm leading-6 text-slate-700">{metadata.abstract}</p>
      )}
    </section>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</div>
      <div className="mt-1 text-ink">{value}</div>
    </div>
  );
}
