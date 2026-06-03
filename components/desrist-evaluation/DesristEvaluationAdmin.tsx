"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { improvementPriorityOptions } from "@/lib/desrist-evaluation/survey";

type PriorityRow = {
  priority: string;
  votes: number;
};

const labels = new Map(improvementPriorityOptions.map((option) => [option.value, option.label]));

export function DesristEvaluationAdmin() {
  const [adminSecret, setAdminSecret] = useState("");
  const [rows, setRows] = useState<PriorityRow[]>([]);
  const [responseCount, setResponseCount] = useState<number>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  async function loadPriorities() {
    setLoading(true);
    setError(undefined);
    const response = await fetch("/api/desrist-evaluation/priorities", {
      headers: { "x-admin-secret": adminSecret }
    });
    const result = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError([result.error, result.details].filter(Boolean).join(" "));
      return;
    }
    setRows(result.priorities);
    setResponseCount(result.responseCount);
  }

  const maxVotes = Math.max(1, ...rows.map((row) => row.votes));

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <Link href="/desrist-evaluation" className="text-sm text-muted hover:text-ink">Back to survey</Link>
        <h1 className="mt-3 font-serif text-4xl text-ink">DESRIST Evaluation Priorities</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Admin-only helper for summarizing requested feature improvements after formative evaluation.</p>
      </div>

      <Card className="mb-5 p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <Input type="password" placeholder="Admin secret" value={adminSecret} onChange={(event) => setAdminSecret(event.target.value)} />
          <Button type="button" disabled={!adminSecret || loading} onClick={loadPriorities}>{loading ? "Loading..." : "Load priorities"}</Button>
        </div>
        {error && <p className="mt-3 border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      </Card>

      <Card className="p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="font-serif text-2xl text-ink">Most Requested Improvements</h2>
          {typeof responseCount === "number" && <span className="text-xs uppercase tracking-[0.12em] text-muted">{responseCount} responses</span>}
        </div>
        <div className="mt-5 space-y-3">
          {rows.map((row) => (
            <div key={row.priority} className="border border-line bg-paper p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-ink">{labels.get(row.priority) ?? row.priority}</span>
                <span className="text-sm text-muted">{row.votes}</span>
              </div>
              <div className="mt-2 h-2 border border-line bg-white">
                <div className="h-full bg-blue" style={{ width: `${(row.votes / maxVotes) * 100}%` }} />
              </div>
            </div>
          ))}
          {rows.length === 0 && <p className="text-sm text-muted">No priority data loaded.</p>}
        </div>
      </Card>
    </div>
  );
}
