"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { WorkbenchErrorPanel } from "@/components/workbench/WorkbenchErrorPanel";
import { fetchWorkbenchJson } from "@/lib/workbench/client";
import type { Paper, WorkbenchReviewStatus } from "@/lib/workbench/types";

type PresentationCard = {
  domain_label?: string | null;
  artifact_summary?: string | null;
  dlt_role?: string | null;
};

type PresentationAwarePaper = Paper & {
  presentation?: { card?: PresentationCard | null } | null;
};

type PaperListResponse = {
  ok: true;
  papers: PresentationAwarePaper[];
};

export function WorkbenchLanding() {
  const [papers, setPapers] = useState<PresentationAwarePaper[]>([]);
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
          Review the human synthesis, canonical design knowledge, stored flows, and evidence for each OKF paper. Canonical changes are made in Git and then re-indexed.
        </p>
      </div>

      {loading && <Card className="p-5 text-sm text-muted">Loading canonical OKF papers...</Card>}
      {Boolean(error) && <WorkbenchErrorPanel error={error} />}
      {!loading && !error && (
        <div className="grid gap-5 md:grid-cols-2">
          {papers.map((paper) => <PaperCard key={paper.paper_id} paper={paper} />)}
          {papers.length === 0 && <Card className="p-5 text-sm text-muted">No OKF papers are currently available.</Card>}
        </div>
      )}
    </div>
  );
}

function PaperCard({ paper }: { paper: PresentationAwarePaper }) {
  const counts = paperCounts(paper);
  const card = paper.presentation?.card;
  const domain = nonempty(card?.domain_label) ?? nonempty(paper.domain);
  const artifact = nonempty(card?.artifact_summary) ?? nonempty(paper.artifact_type);
  const dltRole = nonempty(card?.dlt_role) ?? nonempty(paper.blockchain_dlt_role);
  const doiHref = normalizeDoiUrl(nonempty(paper.doi_url) ?? paper.doi);
  const citation = compactCitation(paper);

  return (
    <Card className="overflow-hidden bg-white">
      <div className="h-1 bg-blue/70" />
      <div className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {domain && <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{primaryPhrase(humanizeMachineValue(domain))}</p>}
            <h2 className="mt-2 line-clamp-3 break-words font-serif text-2xl leading-tight text-ink" title={paper.title}>{paper.title}</h2>
            {citation && <p className="mt-3 text-sm leading-6 text-muted">{citation}</p>}
            {(nonempty(paper.venue) || doiHref) && (
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs leading-5 text-muted">
                {nonempty(paper.venue) && <span>{paper.venue}</span>}
                {doiHref && (
                  <a className="inline-flex items-center gap-1 text-blue underline decoration-blue/30 underline-offset-2 hover:text-ink" href={doiHref} target="_blank" rel="noreferrer">
                    Open DOI <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}
          </div>
          <div className="shrink-0"><Badge>{reviewStatusLabel(paper.review_status)}</Badge></div>
        </div>

        {(artifact || dltRole) && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {artifact && <InfoPill label="Artifact" value={artifact} />}
            {dltRole && <InfoPill label="DLT role" value={dltRole} />}
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden border border-line bg-line sm:grid-cols-6">
          <Count label="Requirements" value={counts.requirements} />
          <Count label="Principles" value={counts.principles} />
          <Count label="Features" value={counts.features} />
          <Count label="Concepts" value={counts.concepts} />
          <Count label="Evidence" value={counts.evidence} />
          <Count label="Relations" value={counts.relations} />
        </div>

        <div className="mt-auto flex border-t border-line pt-4 sm:justify-end">
          <Link className="inline-flex w-full items-center justify-center gap-2 border border-line bg-paper px-3 py-2 text-sm font-medium text-ink hover:border-blue sm:w-auto" href={`/workbench/${encodeURIComponent(paper.slug ?? paper.paper_id)}`}>
            Open Workbench <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </Card>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-h-28 border border-line bg-paper p-3">
      <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</div>
      <div className="mt-1 line-clamp-4 text-sm leading-5 text-ink" title={value}>{value}</div>
    </div>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-paper px-2 py-3 text-center">
      <div className="font-serif text-xl text-ink">{value}</div>
      <div className="mt-0.5 text-[10px] uppercase tracking-[0.08em] text-muted">{label}</div>
    </div>
  );
}

function paperCounts(paper: Paper) {
  if (paper.counts) return paper.counts;
  const conceptCounts = paper.concept_counts ?? {};
  return {
    requirements: conceptCounts["Design Requirement"] ?? 0,
    principles: conceptCounts["Design Principle"] ?? 0,
    features: conceptCounts["Design Feature"] ?? 0,
    concepts: Object.values(conceptCounts).reduce((sum, count) => sum + (count ?? 0), 0),
    evidence: 0,
    relations: 0
  };
}

function compactCitation(paper: Paper) {
  const authors = paper.authors_list?.length
    ? paper.authors_list
    : paper.authors?.split(/[;|]/).map((item) => item.trim()).filter(Boolean) ?? [];
  const authorText = authors.length > 2 ? `${authors[0]} et al.` : authors.join("; ");
  return [authorText, paper.year].filter(Boolean).join(" · ");
}

function reviewStatusLabel(status: WorkbenchReviewStatus | null | undefined) {
  if (status === "author_verified") return "Author verified";
  if (status === "internally_reviewed") return "Internally reviewed";
  return "Needs review";
}

function normalizeDoiUrl(value: string | null | undefined) {
  const normalized = nonempty(value);
  if (!normalized) return null;
  const doi = normalized.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "");
  return `https://doi.org/${doi}`;
}

function nonempty(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized && !/^(?:not recorded|n\/a|unknown|todo|-)$/i.test(normalized) ? normalized : null;
}

function humanizeMachineValue(value: string) {
  return /^[a-z0-9]+(?:_[a-z0-9]+)+$/.test(value) ? value.replace(/_/g, " ").replace(/^\w/, (letter) => letter.toUpperCase()) : value;
}

function primaryPhrase(value: string) {
  return value.split(";")[0]?.trim() || value;
}
