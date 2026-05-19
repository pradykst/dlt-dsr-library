"use client";

import { useMemo, useState } from "react";
import { Clipboard, Check } from "lucide-react";
import { designGoals, getFlowForGoals } from "@/lib/knowledge";
import { Button } from "@/components/ui/Button";

export function FlowBuilder() {
  const [selected, setSelected] = useState<string[]>(["goal-trust", "goal-privacy"]);
  const [copied, setCopied] = useState(false);
  const flow = useMemo(() => getFlowForGoals(selected), [selected]);
  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const summary = [
    `Goals: ${flow.goals.map((goal) => goal.label).join(", ")}`,
    `Requirements: ${flow.requirements.map((node) => node.label).join("; ")}`,
    `Principles: ${flow.principles.map((node) => node.label).join("; ")}`,
    `Features: ${flow.features.map((node) => node.label).join("; ")}`,
    `Artifacts: ${flow.artifacts.map((node) => node.label).join("; ")}`,
    `Evaluations: ${flow.evaluations.map((node) => node.label).join("; ")}`,
    `Patterns: ${flow.patterns.map((pattern) => pattern.title).join("; ")}`,
    `Papers: ${flow.papers.map((paper) => paper.shortTitle).join("; ")}`
  ].join("\n");

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <aside className="border border-line bg-white p-5 shadow-research">
        <h2 className="font-serif text-2xl text-ink">Design Goals</h2>
        <p className="mt-2 text-sm leading-6 text-muted">Rule-based synthesis from the library. Select goals to generate a design path from observed DLT design knowledge.</p>
        <div className="mt-5 space-y-2">
          {designGoals.map((goal) => (
            <label key={goal.id} className="flex cursor-pointer gap-3 border border-line bg-paper p-3 transition hover:border-blue">
              <input type="checkbox" checked={selected.includes(goal.id)} onChange={() => toggle(goal.id)} />
              <span>
                <span className="block text-sm font-semibold text-ink">{goal.label}</span>
                <span className="mt-1 block text-xs leading-5 text-muted">{goal.description}</span>
              </span>
            </label>
          ))}
        </div>
      </aside>
      <section className="border border-line bg-white p-5 shadow-research">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-serif text-2xl text-ink">Generated Design Path</h2>
            <p className="mt-1 text-sm text-muted">This is deterministic synthesis from seeded nodes and links.</p>
          </div>
          <Button onClick={async () => { await navigator.clipboard.writeText(summary); setCopied(true); setTimeout(() => setCopied(false), 1600); }}>
            {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
            Copy design path
          </Button>
        </div>
        <div className="grid gap-3">
          <Column title="Problem class" items={flow.goals.map((goal) => goal.label)} />
          <Column title="Requirements" items={flow.requirements.map((node) => node.label)} />
          <Column title="Candidate principles" items={flow.principles.map((node) => node.label)} />
          <Column title="Features" items={flow.features.map((node) => node.label)} />
          <Column title="Example artifacts" items={flow.artifacts.map((node) => node.label)} />
          <Column title="Evaluation methods" items={flow.evaluations.map((node) => node.label)} />
          <Column title="Reusable patterns" items={flow.patterns.map((pattern) => pattern.title)} />
          <Column title="Observed in papers" items={flow.papers.map((paper) => paper.shortTitle)} />
        </div>
      </section>
    </div>
  );
}

function Column({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="grid gap-2 border border-line bg-paper p-3 md:grid-cols-[180px_1fr]">
      <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {items.length ? items.map((item) => <span key={item} className="border border-line bg-white px-2 py-1 text-sm text-ink">{item}</span>) : <span className="text-sm text-muted">No direct match in selected goals</span>}
      </div>
    </div>
  );
}
