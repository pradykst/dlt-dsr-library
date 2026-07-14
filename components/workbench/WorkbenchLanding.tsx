"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { WorkbenchErrorPanel } from "@/components/workbench/WorkbenchErrorPanel";
import { fetchWorkbenchJson } from "@/lib/workbench/client";
import type { Paper } from "@/lib/workbench/types";

type PaperListResponse = {
  ok: true;
  papers: Paper[];
};

export function WorkbenchLanding() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>();

  useEffect(() => {
    fetchWorkbenchJson<PaperListResponse>("/api/workbench/papers")
      .then((result) => setPapers(result.papers))
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <Badge>OKF Workbench</Badge>
        <h1 className="mt-3 font-serif text-4xl text-ink">Paper Review Workspace</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          Inspect canonical OKF paper metadata, DSR concept grids, stored relations, and evidence. Canonical changes are made in Git and then re-indexed.
        </p>
      </div>

      {loading && <Card className="p-5 text-sm text-muted">Loading canonical OKF papers...</Card>}
      {Boolean(error) && <WorkbenchErrorPanel error={error} />}
      {!loading && !error && (
        <div className="grid gap-5 md:grid-cols-2">
          {papers.map((paper) => (
            <Card key={paper.paper_id} className="overflow-hidden bg-white">
              <div className="h-1 bg-blue/70" />
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{paper.domain ? primaryPhrase(paper.domain) : "Design science research"}</p>
                    <h2 className="mt-2 break-words font-serif text-2xl leading-tight text-ink">{paper.short_title ?? paper.paper_id}</h2>
                    <p className="mt-3 text-sm leading-6 text-muted">{compactCitation(paper)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {paper.year && <span className="border border-line bg-paper px-2 py-1 text-xs font-semibold tracking-[0.12em] text-muted">{paper.year}</span>}
                    {paper.review_status && <Badge>{paper.review_status}</Badge>}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {paper.artifact_type && <InfoPill label="Artifact" value={shorten(paper.artifact_type, 120)} />}
                  {paper.blockchain_dlt_role && <InfoPill label="DLT Role" value={shorten(paper.blockchain_dlt_role, 120)} />}
                </div>

                <ConceptCounts paper={paper} />

                <div className="mt-5 flex border-t border-line pt-4 sm:justify-end">
                  <Link className="inline-flex w-full items-center justify-center gap-2 border border-line bg-paper px-3 py-2 text-sm font-medium text-ink hover:border-blue sm:w-auto" href={`/workbench/${encodeURIComponent(paper.slug ?? paper.paper_id)}`}>
                    Open Workbench <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </Card>
          ))}
          {papers.length === 0 && <Card className="p-5 text-sm text-muted">No OKF papers are currently available.</Card>}
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

function ConceptCounts({ paper }: { paper: Paper }) {
  const counts = paper.concept_counts;
  if (!counts) return null;
  const items = [
    ["Requirements", counts["Design Requirement"] ?? 0],
    ["Principles", counts["Design Principle"] ?? 0],
    ["Features", counts["Design Feature"] ?? 0],
    ["Concepts", Object.values(counts).reduce((sum, count) => sum + (count ?? 0), 0)]
  ] as const;
  return (
    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
      {items.map(([label, count]) => <span key={label}><strong className="text-ink">{count}</strong> {label}</span>)}
    </div>
  );
}

function compactCitation(paper: Paper) {
  const authors = paper.authors ? paper.authors.split(";").map((item) => item.trim()).filter(Boolean) : [];
  const authorText = authors.length > 2 ? `${authors[0]} et al.` : authors.join("; ");
  return [authorText || "Authors not indexed", paper.year].filter(Boolean).join(" / ");
}

function primaryPhrase(value: string) {
  return value.split(";")[0]?.trim() || value;
}

function shorten(value: string, maxLength: number) {
  const clean = value.trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 3).trim()}...`;
}
