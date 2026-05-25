import { Badge } from "@/components/ui/Badge";
import type { DsrField, DsrGridExtraction } from "@/lib/ingest/parser-types";
import { confidenceBadge } from "@/lib/ingest/text-utils";

const boxes: Array<{ key: keyof DsrGridExtraction; title: string }> = [
  { key: "problem", title: "Problem" },
  { key: "researchProcess", title: "Research Process" },
  { key: "solution", title: "Solution" },
  { key: "inputKnowledge", title: "Input Knowledge" },
  { key: "concepts", title: "Concepts" },
  { key: "outputKnowledge", title: "Output Knowledge" }
];

export function DsrGridPreview({ grid, selectedId, onSelect }: { grid?: DsrGridExtraction; selectedId?: string; onSelect: (field: DsrField) => void }) {
  return (
    <section className="border border-line bg-white p-5 shadow-research">
      <div className="mb-4 flex items-end justify-between">
        <h2 className="font-serif text-2xl text-ink">Generated DSR Project Grid</h2>
        <span className="text-xs uppercase tracking-[0.12em] text-muted">Rule-based extraction</span>
      </div>
      {!grid ? (
        <div className="border border-line bg-paper p-6 text-sm text-muted">Upload and parse a PDF to generate the grid.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {boxes.map((box) => (
            <div key={box.key} className="min-h-56 border border-line bg-paper p-4">
              <h3 className="text-sm font-semibold text-ink">{box.title}</h3>
              <div className="mt-3 space-y-2">
                {grid[box.key].length ? grid[box.key].slice(0, 3).map((field) => (
                  <button
                    key={field.id}
                    type="button"
                    onClick={() => onSelect(field)}
                    className="w-full border bg-white p-3 text-left text-sm transition hover:border-blue"
                    style={{ borderColor: selectedId === field.id ? "#4f6f91" : "#d8d6cc" }}
                  >
                    <div className="font-medium leading-5 text-ink">{field.label}</div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Badge>{confidenceBadge(field.confidence)}</Badge>
                      {field.pageNumber && <Badge>p. {field.pageNumber}</Badge>}
                    </div>
                  </button>
                )) : (
                  <div className="border border-dashed border-line bg-white p-3 text-sm text-muted">No explicit extraction in V1.</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
