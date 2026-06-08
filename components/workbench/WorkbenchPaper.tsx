"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { SuggestionForm } from "@/components/workbench/SuggestionForm";
import { WorkbenchFlowProvider } from "@/components/workbench/WorkbenchFlow";
import type { PaperBundle, WorkbenchElement, WorkbenchEvidence } from "@/lib/workbench/types";
import { trackGeneratedFlowViewed, trackPaperOpened } from "@/utils/analytics";

const tabs = ["Overview", "DSR Grid", "Flow", "Elements", "Evidence", "Suggestions"];
const gridElementGroups = [
  { title: "Problem", types: ["Problem"], field: "normalized_text" },
  { title: "Requirement", types: ["Design Requirement", "Requirement"], field: "normalized_text" },
  { title: "Principle", types: ["Design Principle", "Principle"], field: "normalized_text" },
  { title: "Feature", types: ["Design Feature", "Feature"], field: "normalized_text" },
  { title: "Artifact", types: ["Artifact"], field: "normalized_text" },
  { title: "Evaluation", types: ["Evaluation"], field: "normalized_text" },
  { title: "Output Knowledge", types: ["Output Claim", "Output Knowledge"], field: "normalized_text" }
] as const;
const additionalContextCells = [
  ["Summary", "evaluation_summary"],
  ["Limitations", "boundary_conditions"]
] as const;

type SuggestTarget = {
  table: "papers" | "elements" | "relations" | "evidence";
  rowKey: string;
  field: string;
  oldValue: string;
};

export function WorkbenchPaper({ paperId }: { paperId: string }) {
  const [bundle, setBundle] = useState<PaperBundle>();
  const [tab, setTab] = useState("Overview");
  const [error, setError] = useState<string>();
  const [suggestTarget, setSuggestTarget] = useState<SuggestTarget>();
  const trackedPaperId = useRef<string>();
  const trackedFlowForPaperId = useRef<string>();

  const load = useCallback(() => {
    fetch(`/api/workbench/paper/${encodeURIComponent(paperId)}`)
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok) throw new Error([json.error, json.details].filter(Boolean).join(" "));
        setBundle(json);
      })
      .catch((err: Error) => setError(err.message));
  }, [paperId]);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 15000);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!bundle) return;
    const { paper } = bundle;
    if (trackedPaperId.current === paper.paper_id) return;
    trackedPaperId.current = paper.paper_id;
    trackPaperOpened(paper.paper_id, paper.short_title ?? undefined);
  }, [bundle]);

  useEffect(() => {
    if (!bundle || tab !== "Flow") return;
    const { paper, elements, relations } = bundle;
    if (trackedFlowForPaperId.current === paper.paper_id) return;
    trackedFlowForPaperId.current = paper.paper_id;
    trackGeneratedFlowViewed({
      route: "/workbench/[paperId]",
      paper_id: paper.paper_id,
      node_count: elements.length,
      edge_count: relations.length
    });
  }, [bundle, tab]);

  if (error) return <Card className="p-5 text-sm text-red-700">{error}</Card>;
  if (!bundle) return <Card className="p-5 text-sm text-muted">Loading paper workbench...</Card>;
  const { paper, elements, relations, evidence } = bundle;

  return (
    <div>
      <div className="mb-6">
        <Link href="/workbench" className="text-sm text-muted hover:text-ink">Back to Workbench</Link>
        <div className="mt-3 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <Badge>{paper.paper_id}</Badge>
            <h1 className="mt-3 break-words font-serif text-3xl text-ink sm:text-4xl">{paper.short_title ?? paper.paper_id}</h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-muted">{paper.full_citation}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {paper.year && <Badge>{paper.year}</Badge>}
            {paper.domain && <Badge>{paper.domain}</Badge>}
            {paper.overall_extraction_status && <StatusBadge label="Extraction" value={paper.overall_extraction_status} />}
            {paper.review_status && <StatusBadge label="Review" value={paper.review_status} />}
            <Badge>{bundle.changeRequestsCount} suggestions</Badge>
          </div>
        </div>
      </div>
      <Tabs tabs={tabs} active={tab} onChange={setTab} />
      <div className="mt-5">
        {tab === "Overview" && <Overview bundle={bundle} />}
        {tab === "DSR Grid" && <DsrGrid bundle={bundle} onSuggest={setSuggestTarget} />}
        {tab === "Flow" && <WorkbenchFlowProvider elements={elements} relations={relations} evidence={evidence} onSuggest={setSuggestTarget} />}
        {tab === "Elements" && <ElementsTable elements={elements} onSuggest={setSuggestTarget} />}
        {tab === "Evidence" && <EvidenceTable evidence={evidence} onSuggest={setSuggestTarget} />}
        {tab === "Suggestions" && <Suggestions paperId={paper.paper_id} onSuggest={() => setSuggestTarget({ table: "papers", rowKey: paper.paper_id, field: "notes", oldValue: paper.notes ?? "" })} />}
      </div>
      {suggestTarget && (
        <SuggestionForm
          paperId={paper.paper_id}
          targetTable={suggestTarget.table}
          targetRowKey={suggestTarget.rowKey}
          targetField={suggestTarget.field}
          oldValue={suggestTarget.oldValue}
          onClose={() => setSuggestTarget(undefined)}
          onSubmitted={load}
        />
      )}
    </div>
  );
}

function Overview({ bundle }: { bundle: PaperBundle }) {
  const { paper, elements, relations, evidence } = bundle;
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Metric label="Elements" value={elements.length} />
      <Metric label="Relations" value={relations.length} />
      <Metric label="Evidence" value={evidence.length} />
      <Metric label="Confidence" value={paper.overall_confidence ?? "NA"} />
      <Card className="p-5 md:col-span-4">
        <h2 className="font-serif text-2xl text-ink">Paper Summary</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Summary label="Authors" value={paper.authors} />
          <Summary label="DOI or URL" value={paper.doi_or_url} />
          <Summary label="Artifact Type" value={paper.artifact_type} />
          <Summary label="DLT Role" value={paper.blockchain_dlt_role} />
          <Summary label="Extraction Status" value={paper.overall_extraction_status} />
          <Summary label="Review Status" value={paper.review_status} />
          <Summary label="Notes" value={paper.notes} />
        </div>
      </Card>
    </div>
  );
}

function DsrGrid({ bundle, onSuggest }: { bundle: PaperBundle; onSuggest: (target: SuggestTarget) => void }) {
  const { paper, elements } = bundle;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {gridElementGroups.map((group) => {
          const groupElements = elements.filter((element) => group.types.some((type) => type === element.element_type));
          return (
            <Card key={group.title} className="p-5">
              <h2 className="font-serif text-2xl text-ink">{group.title}</h2>
              <div className="mt-3 space-y-3">
                {groupElements.length ? groupElements.map((element) => {
                  const value = element.normalized_text ?? element.element_text ?? "";
                  return (
                    <div key={element.element_id} className="border border-line bg-paper p-3">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-sm font-semibold leading-5 text-ink">{element.element_name ?? element.short_label ?? element.element_id}</h3>
                        <button className="shrink-0 border border-line bg-white px-2 py-1 text-xs text-muted hover:text-ink" onClick={() => onSuggest({ table: "elements", rowKey: `${element.paper_id}:${element.element_id}`, field: group.field, oldValue: value })}>Suggest edit</button>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-ink">{value || "No content imported."}</p>
                    </div>
                  );
                }) : (
                  <p className="text-sm leading-6 text-muted">No imported {group.title.toLowerCase()} element.</p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <details className="border border-line bg-white shadow-research">
        <summary className="cursor-pointer px-5 py-4 font-serif text-xl text-ink">Additional extracted context</summary>
        <div className="grid gap-4 border-t border-line p-5 md:grid-cols-2">
          {additionalContextCells.map(([title, field]) => {
            const value = String(paper[field] ?? "");
            return (
              <div key={field} className="border border-line bg-paper p-4">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-serif text-2xl text-ink">{title}</h2>
                  <button className="shrink-0 border border-line bg-white px-2 py-1 text-xs text-muted hover:text-ink" onClick={() => onSuggest({ table: "papers", rowKey: paper.paper_id, field, oldValue: value })}>Suggest edit</button>
                </div>
                <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-ink">{value || "No content imported."}</p>
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}

function ElementsTable({ elements, onSuggest }: { elements: WorkbenchElement[]; onSuggest: (target: SuggestTarget) => void }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [sourceStatus, setSourceStatus] = useState("all");
  const [confidence, setConfidence] = useState("all");
  const filtered = useMemo(() => elements.filter((element) => {
    const haystack = `${element.element_id} ${element.element_type} ${element.element_name} ${element.normalized_text}`.toLowerCase();
    return haystack.includes(query.toLowerCase()) && (type === "all" || element.element_type === type) && (sourceStatus === "all" || element.source_status === sourceStatus) && (confidence === "all" || String(element.confidence) === confidence);
  }), [confidence, elements, query, sourceStatus, type]);
  const types = unique(elements.map((element) => element.element_type));
  const sourceStatuses = unique(elements.map((element) => element.source_status));
  return (
    <Card className="overflow-hidden">
      <div className="grid gap-3 border-b border-line p-4 md:grid-cols-4">
        <Input placeholder="Search elements" value={query} onChange={(event) => setQuery(event.target.value)} />
        <Select value={type} onChange={(event) => setType(event.target.value)}><option value="all">All types</option>{types.map((item) => <option key={item}>{item}</option>)}</Select>
        <Select value={sourceStatus} onChange={(event) => setSourceStatus(event.target.value)}><option value="all">All source statuses</option>{sourceStatuses.map((item) => <option key={item}>{item}</option>)}</Select>
        <Select value={confidence} onChange={(event) => setConfidence(event.target.value)}><option value="all">All confidence</option><option>1</option><option>2</option><option>3</option></Select>
      </div>
      <DataTable headers={["ID", "Type", "Name", "Normalized Text", "Source", "Confidence", "Review", "Quote", ""]}>
        {filtered.map((element) => (
          <tr key={element.element_id} className="border-t border-line align-top">
            <Cell>{element.element_id}</Cell><Cell>{displayElementType(element.element_type)}</Cell><Cell>{element.element_name}</Cell><Cell>{element.normalized_text}</Cell><Cell>{element.source_status}</Cell><Cell>{element.confidence}</Cell><Cell>{element.review_status}</Cell><Cell>{element.source_quote_id}</Cell>
            <Cell><button className="text-xs text-blue hover:text-ink" onClick={() => onSuggest({ table: "elements", rowKey: `${element.paper_id}:${element.element_id}`, field: "normalized_text", oldValue: element.normalized_text ?? "" })}>Suggest edit</button></Cell>
          </tr>
        ))}
      </DataTable>
    </Card>
  );
}

function EvidenceTable({ evidence, onSuggest }: { evidence: WorkbenchEvidence[]; onSuggest: (target: SuggestTarget) => void }) {
  const [query, setQuery] = useState("");
  const filtered = evidence.filter((item) => `${item.evidence_id} ${item.evidence_type} ${item.exact_quote_or_description} ${item.element_ids_supported} ${item.relation_ids_supported}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-line p-4"><Input placeholder="Search evidence" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
      <DataTable headers={["ID", "Type", "Quote / Description", "Page", "Section", "Source", "Strength", "Elements", "Relations", ""]}>
        {filtered.map((item) => (
          <tr key={item.evidence_id} className="border-t border-line align-top">
            <Cell>{item.evidence_id}</Cell><Cell>{item.evidence_type}</Cell><Cell>{item.exact_quote_or_description}</Cell><Cell>{item.page}</Cell><Cell>{item.section}</Cell><Cell>{item.source_status}</Cell><Cell>{item.evidence_strength}</Cell><Cell>{item.element_ids_supported}</Cell><Cell>{item.relation_ids_supported}</Cell>
            <Cell><button className="text-xs text-blue hover:text-ink" onClick={() => onSuggest({ table: "evidence", rowKey: `${item.paper_id}:${item.evidence_id}`, field: "exact_quote_or_description", oldValue: item.exact_quote_or_description ?? "" })}>Suggest edit</button></Cell>
          </tr>
        ))}
      </DataTable>
    </Card>
  );
}

function Suggestions({ paperId, onSuggest }: { paperId: string; onSuggest: () => void }) {
  return (
    <Card className="p-5">
      <h2 className="font-serif text-2xl text-ink">Suggestions</h2>
      <p className="mt-2 text-sm leading-6 text-muted">Public suggestion details are kept minimal in this MVP. Use the correction buttons throughout the workbench to submit a proposed change; admins can review the full queue from the admin page.</p>
      <button className="mt-4 border border-line bg-paper px-3 py-2 text-sm font-medium text-ink hover:border-blue" onClick={onSuggest}>Suggest paper-level correction</button>
      <p className="mt-4 text-sm text-muted">Paper ID: {paperId}</p>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return <Card className="p-5"><div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</div><div className="mt-2 font-serif text-3xl text-ink">{value}</div></Card>;
}

function StatusBadge({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center border border-line bg-paper text-[11px] font-medium uppercase tracking-[0.12em]">
      <span className="border-r border-line px-2 py-0.5 text-muted">{label}</span>
      <span className="px-2 py-0.5 text-ink">{value}</span>
    </span>
  );
}

function Summary({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (!value) return null;
  return <div><div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</div><div className="mt-1 break-words text-sm leading-6 text-ink"><LinkedText text={String(value)} /></div></div>;
}

function DataTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return <div className="overflow-x-auto"><table className="min-w-[1100px] text-left text-sm"><thead className="bg-paper text-xs uppercase tracking-[0.12em] text-muted"><tr>{headers.map((header) => <th key={header} className="px-3 py-3 font-semibold">{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}

function Cell({ children }: { children: React.ReactNode }) {
  return <td className="max-w-[320px] break-words px-3 py-3 text-sm leading-6 text-ink">{typeof children === "string" ? <LinkedText text={children} /> : children}</td>;
}

function displayElementType(value: string | null | undefined) {
  return value === "Boundary Condition" || value === "Boundary Conditions" ? "Limitations" : value;
}

function unique(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))].sort();
}

function LinkedText({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s)\]}>"']+)/g);
  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;
        if (/^https?:\/\//.test(part)) {
          const { href, trailing } = splitTrailingPunctuation(part);
          return (
            <span key={`${part}-${index}`}>
              <a href={href} target="_blank" rel="noreferrer" className="break-all text-blue underline decoration-blue/30 underline-offset-2 hover:text-ink">
                {href}
              </a>
              {trailing}
            </span>
          );
        }
        return <span key={`${part}-${index}`}>{part}</span>;
      })}
    </>
  );
}

function splitTrailingPunctuation(value: string) {
  const match = value.match(/^(.*?)([.,;:!?]+)$/);
  if (!match) return { href: value, trailing: "" };
  return { href: match[1], trailing: match[2] };
}
