"use client";

import { useState } from "react";
import { DetailPanel } from "@/components/graph/DetailPanel";
import { KnowledgeGraph } from "@/components/graph/KnowledgeGraph";
import { PageShell } from "@/components/layout/PageShell";
import { DataDisclaimer } from "@/components/ui/DataDisclaimer";
import type { KnowledgeNode } from "@/lib/types";

export default function ExplorePage() {
  const [selected, setSelected] = useState<KnowledgeNode | undefined>();
  return (
    <PageShell>
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-ink">Explore Design Knowledge</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Interactively inspect how DLT design knowledge flows from problems to requirements, principles, features, capabilities, and reusable patterns. Source papers, artifacts, and evaluations appear in the evidence lens.</p>
        <DataDisclaimer />
      </div>
      <div className="grid gap-0 lg:grid-cols-[1fr_340px]">
        <KnowledgeGraph onSelect={setSelected} />
        <DetailPanel node={selected} />
      </div>
    </PageShell>
  );
}
