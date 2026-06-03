"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FileUp, Settings2 } from "lucide-react";
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
          <Badge>Single Paper DSR Workbench</Badge>
          <h1 className="mt-3 font-serif text-4xl text-ink">Imported Paper Datasets</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Upload structured CSV exports, inspect the DSR grid and relation flow, and manage author or reviewer corrections.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link className="inline-flex items-center gap-2 border border-ink/20 bg-ink px-3 py-2 text-sm font-medium text-white hover:bg-blue" href="/workbench/import"><FileUp className="h-4 w-4" />Import Paper CSVs</Link>
          <Link className="inline-flex items-center gap-2 border border-line bg-white px-3 py-2 text-sm font-medium text-ink hover:border-blue" href="/workbench/admin"><Settings2 className="h-4 w-4" />Admin Change Requests</Link>
        </div>
      </div>
      {loading && <Card className="p-5 text-sm text-muted">Loading imported papers...</Card>}
      {error && <Card className="border-red-200 p-5 text-sm text-red-700">{error}</Card>}
      {!loading && !error && (
        <div className="grid gap-4 md:grid-cols-2">
          {papers.map((paper) => (
            <Card key={paper.paper_id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-serif text-2xl text-ink">{paper.short_title ?? paper.paper_id}</h2>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted">{paper.full_citation ?? paper.authors}</p>
                </div>
                {paper.year && <Badge>{paper.year}</Badge>}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {paper.domain && <Badge>{paper.domain}</Badge>}
                {paper.artifact_type && <Badge>{paper.artifact_type}</Badge>}
                {paper.overall_extraction_status && <StatusBadge label="Extraction" value={paper.overall_extraction_status} />}
                {paper.review_status && <StatusBadge label="Review" value={paper.review_status} />}
              </div>
              <Link className="mt-5 inline-flex border border-line bg-paper px-3 py-2 text-sm font-medium text-ink hover:border-blue" href={`/workbench/${encodeURIComponent(paper.paper_id)}`}>Open Workbench</Link>
            </Card>
          ))}
          {papers.length === 0 && <Card className="p-5 text-sm text-muted">No imported papers yet. Start with the CSV importer.</Card>}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center border border-line bg-paper text-[11px] font-medium uppercase tracking-[0.12em]">
      <span className="border-r border-line px-2 py-0.5 text-muted">{label}</span>
      <span className="px-2 py-0.5 text-ink">{value}</span>
    </span>
  );
}
