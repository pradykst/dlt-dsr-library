import type { DsrParseResult, PdfExtractionResult, VerificationResult } from "@/lib/ingest/parser-types";

export function ParserDiagnostics({ extraction, parseResult, verification }: { extraction?: PdfExtractionResult; parseResult?: DsrParseResult; verification?: VerificationResult }) {
  const nodeCount = parseResult ? Object.entries(parseResult.designFlow).filter(([key]) => key !== "edges").flatMap(([, value]) => value as unknown[]).length : 0;
  return (
    <section className="border border-line bg-white p-5 shadow-research">
      <h2 className="font-serif text-xl text-ink">Parser Diagnostics</h2>
      <div className="mt-4 grid gap-3 text-sm text-muted sm:grid-cols-2 lg:grid-cols-3">
        <Metric label="PDF pages" value={extraction?.pageCount ?? "n/a"} />
        <Metric label="Extracted characters" value={extraction?.fullText.length.toLocaleString() ?? "n/a"} />
        <Metric label="Sections detected" value={parseResult?.diagnostics.find((item) => item.message.includes("sections detected"))?.message.split(" ")[0] ?? "n/a"} />
        <Metric label="DOI detected" value={parseResult?.metadata.doi ?? "none"} />
        <Metric label="DOI status" value={verification?.status ?? "not run"} />
        <Metric label="Generated nodes" value={nodeCount} />
        <Metric label="Generated edges" value={parseResult?.designFlow.edges.length ?? "n/a"} />
      </div>
      <div className="mt-5 space-y-2">
        {parseResult?.diagnostics.length ? parseResult.diagnostics.map((diagnostic, index) => (
          <div key={`${diagnostic.message}-${index}`} className="border border-line bg-paper px-3 py-2 text-sm text-muted">
            <span className="font-semibold uppercase tracking-[0.12em] text-ink">{diagnostic.level}</span> · {diagnostic.message}
          </div>
        )) : <p className="text-sm text-muted">Diagnostics will appear after parsing.</p>}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-line bg-paper p-3">
      <div className="text-xs uppercase tracking-[0.12em] text-muted">{label}</div>
      <div className="mt-1 text-sm font-medium text-ink">{value}</div>
    </div>
  );
}
