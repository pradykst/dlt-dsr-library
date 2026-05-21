"use client";

import type { NodeType } from "@/lib/types";
import { knowledgeNodes, papers } from "@/lib/knowledge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

const types: NodeType[] = ["problem", "requirement", "principle", "feature", "capability", "pattern"];
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
  setProblemId
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
}) {
  return (
    <aside className="space-y-4 border-r border-line bg-white p-4">
      <div>
        <h2 className="font-serif text-xl text-ink">Explore Graph</h2>
        <p className="mt-1 text-xs leading-5 text-muted">The graph now shows design logic: problem, requirements, principles, features, capabilities, and reusable patterns. Papers, artifacts, and evaluations appear in the evidence lens when you click a node.</p>
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
        Evidence source
        <Select className="mt-2" value={paperId} onChange={(event) => setPaperId(event.target.value)}>
          <option value="all">All source papers</option>
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
      <div className="text-xs leading-5 text-muted">
        Domains represented: {domains.length}. Click any node or edge to inspect paper provenance, artifact context, and evaluation method.
      </div>
    </aside>
  );
}
