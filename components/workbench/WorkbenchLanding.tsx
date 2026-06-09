"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, FileUp, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { Paper } from "@/lib/workbench/types";

export function WorkbenchLanding() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    fetch("/api/workbench/papers")
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error([result.error, result.details].filter(Boolean).join(" "));
        setPapers(result.papers);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <Badge>Workbench</Badge>
          <h1 className="mt-3 font-serif text-4xl text-ink">Paper Review Workspace</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Inspect imported DSR grids and flows, then collect reviewer corrections in one place.</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          <Link className="inline-flex items-center justify-center gap-2 border border-ink/20 bg-ink px-3 py-2 text-sm font-medium text-white hover:bg-blue" href="/workbench/import"><FileUp className="h-4 w-4" />Import CSVs</Link>
          <Link className="inline-flex items-center justify-center gap-2 border border-line bg-white px-3 py-2 text-sm font-medium text-ink hover:border-blue" href="/workbench/admin"><Settings2 className="h-4 w-4" />Review Changes</Link>
        </div>
      </div>
      {loading && <Card className="p-5 text-sm text-muted">Loading imported papers...</Card>}
      {error && <Card className="border-red-200 p-5 text-sm text-red-700">{error}</Card>}
      {!loading && !error && (
        <div className="grid gap-5 md:grid-cols-2">
          {papers.map((paper) => (
            <Card key={paper.paper_id} className="overflow-hidden bg-white">
              <div className="h-1 bg-blue/70" />
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{paper.domain ? primaryPhrase(paper.domain) : "Imported paper"}</p>
                    <h2 className="mt-2 break-words font-serif text-2xl leading-tight text-ink">{paper.short_title ?? paper.paper_id}</h2>
                    <p className="mt-3 text-sm leading-6 text-muted">{compactCitation(paper)}</p>
                  </div>
                  {paper.year && <span className="shrink-0 border border-line bg-paper px-2 py-1 text-xs font-semibold tracking-[0.12em] text-muted">{paper.year}</span>}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {paper.artifact_type && <InfoPill label="Artifact" value={shorten(paper.artifact_type.split(";").map(s => s.trim()).filter(Boolean).join("; "), 92)} />}
                  {paper.blockchain_dlt_role && <InfoPill label="DLT Role" value={shorten(paper.blockchain_dlt_role, 92)} />}
                </div>

                <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-end">
                  <Link className="inline-flex items-center justify-center gap-2 border border-line bg-paper px-3 py-2 text-sm font-medium text-ink hover:border-blue" href={`/workbench/${encodeURIComponent(paper.paper_id)}`}>
                    Open Workbench <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </Card>
          ))}
          {papers.length === 0 && <Card className="p-5 text-sm text-muted">No imported papers yet. Start with the CSV importer.</Card>}
        </div>
      )}
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line bg-paper p-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</div>
      <div className="mt-1 text-sm leading-5 text-ink">{value}</div>
    </div>
  );
}

function compactCitation(paper: Paper) {
  const authors = paper.authors ? paper.authors.split(";").map((item) => item.trim()).filter(Boolean) : [];
  const authorText = authors.length > 2 ? `${authors[0]} et al.` : authors.join("; ");
  return [authorText || paper.authors, paper.year].filter(Boolean).join(" / ");
}

function primaryPhrase(value: string) {
  return value.split(";")[0]?.trim() || value;
}

function shorten(value: string, maxLength: number) {
  const clean = value.trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 3).trim()}...`;
}
