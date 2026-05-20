"use client";

import type { NodeType } from "@/lib/types";
import { knowledgeNodes, papers } from "@/lib/knowledge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const types: NodeType[] = ["paper", "problem", "requirement", "principle", "feature", "artifact", "evaluation", "capability", "pattern"];
const capabilities = knowledgeNodes.filter((node) => node.type === "capability");
const problems = knowledgeNodes.filter((node) => node.type === "problem");
const domains = Array.from(new Set(papers.map((paper) => paper.domain)));

export function GraphFilters({
  query,
  setQuery,
  selectedType,
  setSelectedType,
  paperId,
  setPaperId,
  capabilityId,
  setCapabilityId,
  problemId,
  setProblemId,
  expanded,
  setExpanded
}: {
  query: string;
  setQuery: (value: string) => void;
  selectedType: string;
  setSelectedType: (value: string) => void;
  paperId: string;
  setPaperId: (value: string) => void;
  capabilityId: string;
  setCapabilityId: (value: string) => void;
  problemId: string;
  setProblemId: (value: string) => void;
  expanded: boolean;
  setExpanded: (value: boolean) => void;
}) {
  return (
    <aside className="space-y-4 border-r border-line bg-white p-4">
      <div>
        <h2 className="font-serif text-xl text-ink">Explore Graph</h2>
        <p className="mt-1 text-xs leading-5 text-muted">Default view keeps the graph sparse: papers and reusable patterns. Expand the chain to inspect requirements, features, artifacts, evaluations, and capabilities.</p>
      </div>
      <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
        Search
        <Input className="mt-2" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Trace design logic..." />
      </label>
      <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
        Node type
        <Select className="mt-2" value={selectedType} onChange={(event) => setSelectedType(event.target.value)}>
          <option value="all">All visible types</option>
          {types.map((type) => <option key={type} value={type}>{type}</option>)}
        </Select>
      </label>
      <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
        Paper
        <Select className="mt-2" value={paperId} onChange={(event) => setPaperId(event.target.value)}>
          <option value="all">All papers</option>
          {papers.map((paper) => <option key={paper.id} value={paper.id}>{paper.shortTitle}</option>)}
        </Select>
      </label>
      <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
        DLT capability
        <Select className="mt-2" value={capabilityId} onChange={(event) => setCapabilityId(event.target.value)}>
          <option value="all">All capabilities</option>
          {capabilities.map((capability) => <option key={capability.id} value={capability.id}>{capability.label}</option>)}
        </Select>
      </label>
      <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
        Problem cluster
        <Select className="mt-2" value={problemId} onChange={(event) => setProblemId(event.target.value)}>
          <option value="all">All problem clusters</option>
          {problems.map((problem) => <option key={problem.id} value={problem.id}>{problem.label}</option>)}
        </Select>
      </label>
      <label className="flex items-center gap-2 border border-line bg-paper p-3 text-sm text-ink">
        <input type="checkbox" checked={expanded} onChange={(event) => setExpanded(event.target.checked)} />
        Expand requirements, principles, features, artifacts, and evaluations
      </label>
      <div className="text-xs leading-5 text-muted">
        Domains represented: {domains.length}. Clicking a paper node opens its synthesized design chain in the detail panel.
      </div>
    </aside>
  );
}
