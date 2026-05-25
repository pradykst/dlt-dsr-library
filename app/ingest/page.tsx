import { DsrPaperFlowGenerator } from "@/components/ingest/DsrPaperFlowGenerator";
import { PageShell } from "@/components/layout/PageShell";

export default function IngestPage() {
  return (
    <PageShell className="space-y-6">
      <section className="border border-line bg-white p-6 shadow-research">
        <div className="max-w-4xl">
          <h1 className="font-serif text-3xl text-ink">DSR Paper Flow Generator</h1>
          <p className="mt-3 text-base leading-7 text-slate-700">
            Upload a design-science paper, verify scholarly metadata, and generate a deterministic problem-to-pattern flow from the PDF text.
          </p>
          <p className="mt-4 border-l border-line pl-4 text-sm leading-6 text-muted">
            Upload a design-science paper to generate a structured DSR project grid and a problem-to-pattern flow. The V1 parser is deterministic and rule-based. It does not use an LLM, does not upload the PDF externally, and does not add the paper to the shared library.
          </p>
        </div>
      </section>
      <DsrPaperFlowGenerator />
    </PageShell>
  );
}
