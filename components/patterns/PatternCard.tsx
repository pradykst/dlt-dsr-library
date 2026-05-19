import { Badge } from "@/components/ui/Badge";
import type { Pattern } from "@/lib/types";

export function PatternCard({ pattern, active, onSelect }: { pattern: Pattern; active: boolean; onSelect: () => void }) {
  return (
    <button onClick={onSelect} className="w-full border bg-white p-4 text-left transition hover:border-blue" style={{ borderColor: active ? "#4f6f91" : "#d8d6cc" }}>
      <Badge>{pattern.observedInPaperIds.length} papers</Badge>
      <h3 className="mt-3 text-base font-semibold text-ink">{pattern.title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{pattern.summary}</p>
    </button>
  );
}
