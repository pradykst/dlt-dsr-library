"use client";

import { useMemo, useState } from "react";
import { PatternCard } from "@/components/patterns/PatternCard";
import { PatternDetail } from "@/components/patterns/PatternDetail";
import { PageShell } from "@/components/layout/PageShell";
import { DataDisclaimer } from "@/components/ui/DataDisclaimer";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { getPatternCards, knowledgeNodes, papers } from "@/lib/knowledge";

const capabilities = knowledgeNodes.filter((node) => node.type === "capability");

export default function PatternsPage() {
  const [query, setQuery] = useState("");
  const [capability, setCapability] = useState("all");
  const [paper, setPaper] = useState("all");
  const filtered = useMemo(() => getPatternCards({ query, capabilityIds: capability === "all" ? undefined : [capability], paperIds: paper === "all" ? undefined : [paper] }), [query, capability, paper]);
  const [activeId, setActiveId] = useState("pattern-offchain-onchain-proof");
  const active = filtered.find((pattern) => pattern.id === activeId) ?? filtered[0];

  return (
    <PageShell>
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-ink">Reusable Patterns</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">A pattern library for recurring DLT design logics observed across the seeded design-science corpus.</p>
        <DataDisclaimer />
      </div>
      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <Input placeholder="Search patterns..." value={query} onChange={(event) => setQuery(event.target.value)} />
        <Select value={capability} onChange={(event) => setCapability(event.target.value)}>
          <option value="all">All capabilities</option>
          {capabilities.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </Select>
        <Select value={paper} onChange={(event) => setPaper(event.target.value)}>
          <option value="all">All papers</option>
          {papers.map((item) => <option key={item.id} value={item.id}>{item.shortTitle}</option>)}
        </Select>
      </div>
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <div className="space-y-3">
          {filtered.map((pattern) => <PatternCard key={pattern.id} pattern={pattern} active={pattern.id === active?.id} onSelect={() => setActiveId(pattern.id)} />)}
        </div>
        {active && <PatternDetail pattern={active} />}
      </div>
    </PageShell>
  );
}
