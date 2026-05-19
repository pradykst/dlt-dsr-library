import { FlowBuilder } from "@/components/flow-builder/FlowBuilder";
import { PageShell } from "@/components/layout/PageShell";

export default function FlowBuilderPage() {
  return (
    <PageShell>
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-ink">Build a Design Path</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">A rule-based assistant that composes candidate design logic from seeded papers, reusable patterns, and DLT capabilities.</p>
      </div>
      <FlowBuilder />
    </PageShell>
  );
}
