"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { SuggestionForm } from "@/components/workbench/SuggestionForm";
import { WorkbenchFlowProvider } from "@/components/workbench/WorkbenchFlow";
import type { Paper, PaperBundle, WorkbenchElement, WorkbenchEvidence, WorkbenchRelation } from "@/lib/workbench/types";
import { trackGeneratedFlowViewed, trackPaperOpened } from "@/utils/analytics";

const tabs = ["Overview", "DSR Grid", "Flow", "Corrections"];
const gridCells = [
  ["Problem", "problem_description"],
  ["Input Knowledge", "input_knowledge"],
  ["Research Process", "research_process"],
  ["Key Concepts", "key_concepts"],
  ["Solution", "solution_description"],
  ["Output Knowledge", "output_knowledge"]
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

type CorrectionRow = {
  id: string;
  category: "Paper" | "Element" | "Relation" | "Evidence";
  itemType: string;
  itemId: string;
  field: string;
  currentValue: string;
  sourceStatus: string;
  reviewStatus: string;
  confidence: string;
  sortOrder: number;
  target: SuggestTarget;
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
        <Link href="/workbench" aria-label="Back to Workbench" title="Back to Workbench" className="inline-flex h-9 w-9 items-center justify-center border border-line bg-white text-muted shadow-research hover:border-blue hover:text-ink">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="mt-3 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <Badge>{paper.paper_id}</Badge>
            <h1 className="mt-3 break-words font-serif text-3xl text-ink sm:text-4xl">{paper.short_title ?? paper.paper_id}</h1>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-muted">{paper.full_citation}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {paper.year && <Badge>{paper.year}</Badge>}
            {paper.domain && <Badge>{paper.domain}</Badge>}
          </div>
        </div>
      </div>
      <Tabs tabs={tabs} active={tab} onChange={setTab} />
      <div className="mt-5">
        {tab === "Overview" && <Overview bundle={bundle} />}
        {tab === "DSR Grid" && <DsrGrid bundle={bundle} onSuggest={setSuggestTarget} />}
        {tab === "Flow" && <WorkbenchFlowProvider elements={elements} relations={relations} evidence={evidence} onSuggest={setSuggestTarget} />}
        {tab === "Corrections" && <CorrectionsPanel bundle={bundle} onSuggest={setSuggestTarget} />}
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
  const { paper } = bundle;
  return (
    <div>
      <Card className="p-5">
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
  const { paper } = bundle;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {gridCells.map(([title, field]) => {
          const value = String(paper[field] ?? "");
          return (
            <Card key={field} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-serif text-2xl text-ink">{title}</h2>
                <button className="shrink-0 border border-line bg-paper px-2 py-1 text-xs text-muted hover:text-ink" onClick={() => onSuggest({ table: "papers", rowKey: paper.paper_id, field, oldValue: value })}>Suggest edit</button>
              </div>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-ink">{value || "No content imported."}</p>
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

function CorrectionsPanel({ bundle, onSuggest }: { bundle: PaperBundle; onSuggest: (target: SuggestTarget) => void }) {
  const { paper, elements, relations, evidence } = bundle;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [itemType, setItemType] = useState("all");
  const [field, setField] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("category");
  const rows = useMemo(() => buildCorrectionRows(paper, elements, relations, evidence), [elements, evidence, paper, relations]);
  const itemTypes = unique(rows.map((row) => row.itemType));
  const fields = unique(rows.map((row) => row.field));
  const statuses = unique(rows.flatMap((row) => [row.sourceStatus, row.reviewStatus]));
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return rows
      .filter((row) => {
        const haystack = `${row.category} ${row.itemType} ${row.itemId} ${row.field} ${row.currentValue} ${row.sourceStatus} ${row.reviewStatus}`.toLowerCase();
        return (!normalizedQuery || haystack.includes(normalizedQuery))
          && (category === "all" || row.category === category)
          && (itemType === "all" || row.itemType === itemType)
          && (field === "all" || row.field === field)
          && (status === "all" || row.sourceStatus === status || row.reviewStatus === status);
      })
      .sort((a, b) => compareCorrectionRows(a, b, sort));
  }, [category, field, itemType, query, rows, sort, status]);

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-line p-4">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
          <div>
            <h2 className="font-serif text-2xl text-ink">Corrections</h2>
            <p className="mt-1 text-sm leading-6 text-muted">Review paper fields, extracted elements, relations, and evidence in one place before committing a change request.</p>
          </div>
          <Badge>{filtered.length} shown / {rows.length} editable fields</Badge>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <Input placeholder="Search corrections" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="all">All categories</option>
            <option>Paper</option>
            <option>Element</option>
            <option>Relation</option>
            <option>Evidence</option>
          </Select>
          <Select value={itemType} onChange={(event) => setItemType(event.target.value)}>
            <option value="all">All item types</option>
            {itemTypes.map((item) => <option key={item}>{item}</option>)}
          </Select>
          <Select value={field} onChange={(event) => setField(event.target.value)}>
            <option value="all">All fields</option>
            {fields.map((item) => <option key={item}>{item}</option>)}
          </Select>
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">All statuses</option>
            {statuses.map((item) => <option key={item}>{item}</option>)}
          </Select>
          <Select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="category">Sort by category</option>
            <option value="type">Sort by item type</option>
            <option value="field">Sort by field</option>
            <option value="confidence">Sort by confidence</option>
            <option value="id">Sort by ID</option>
          </Select>
        </div>
      </div>
      <DataTable headers={["Category", "ID", "Type", "Field", "Current Value", "Status", "Confidence", ""]}>
        {filtered.map((row) => (
          <tr key={row.id} className="border-t border-line align-top">
            <Cell><Badge>{row.category}</Badge></Cell>
            <Cell>{row.itemId}</Cell>
            <Cell>{displayElementType(row.itemType)}</Cell>
            <Cell>{humanizeField(row.field)}</Cell>
            <Cell>{row.currentValue}</Cell>
            <Cell>{[row.sourceStatus, row.reviewStatus].filter(Boolean).join(" / ")}</Cell>
            <Cell>{row.confidence}</Cell>
            <Cell><button className="whitespace-nowrap text-xs font-medium text-blue hover:text-ink" onClick={() => onSuggest(row.target)}>Request change</button></Cell>
          </tr>
        ))}
        {filtered.length === 0 && (
          <tr className="border-t border-line">
            <td colSpan={8} className="px-3 py-6 text-center text-sm text-muted">No correction targets match the current filters.</td>
          </tr>
        )}
      </DataTable>
    </Card>
  );
}

function Summary({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (!value) return null;
  return <div><div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</div><div className="mt-1 break-words text-sm leading-6 text-ink"><LinkedText text={String(value)} /></div></div>;
}

function DataTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  const widths = ["8rem", "7rem", "12rem", "11rem", "34%", "10rem", "7rem", "9rem"];
  return (
    <div className="max-h-[70vh] overflow-auto">
      <table className="min-w-[1180px] text-left text-sm xl:min-w-full">
        <colgroup>{widths.map((width, index) => <col key={index} style={{ width }} />)}</colgroup>
        <thead className="sticky top-0 z-10 bg-paper text-xs uppercase tracking-[0.12em] text-muted">
          <tr>{headers.map((header) => <th key={header} className="px-3 py-3 font-semibold">{header}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Cell({ children }: { children: React.ReactNode }) {
  return <td className="max-w-[320px] break-words px-3 py-3 text-sm leading-6 text-ink">{typeof children === "string" ? <LinkedText text={children} /> : children}</td>;
}

function buildCorrectionRows(paper: Paper, elements: WorkbenchElement[], relations: WorkbenchRelation[], evidence: WorkbenchEvidence[]) {
  const rows: CorrectionRow[] = [];
  const paperFields: Array<[keyof Paper, string]> = [
    ["short_title", "Title"],
    ["full_citation", "Citation"],
    ["authors", "Authors"],
    ["doi_or_url", "DOI or URL"],
    ["domain", "Domain"],
    ["artifact_type", "Artifact Type"],
    ["blockchain_dlt_role", "DLT Role"],
    ["problem_description", "Problem"],
    ["input_knowledge", "Input Knowledge"],
    ["research_process", "Research Process"],
    ["key_concepts", "Key Concepts"],
    ["solution_description", "Solution"],
    ["output_knowledge", "Output Knowledge"],
    ["evaluation_summary", "Evaluation Summary"],
    ["boundary_conditions", "Limitations"],
    ["notes", "Notes"]
  ];

  paperFields.forEach(([field, label], index) => {
    const value = paper[field];
    rows.push({
      id: `paper:${field}`,
      category: "Paper",
      itemType: label,
      itemId: paper.paper_id,
      field,
      currentValue: value == null ? "" : String(value),
      sourceStatus: paper.overall_extraction_status ?? "",
      reviewStatus: paper.review_status ?? "",
      confidence: paper.overall_confidence == null ? "" : String(paper.overall_confidence),
      sortOrder: index,
      target: { table: "papers", rowKey: paper.paper_id, field, oldValue: value == null ? "" : String(value) }
    });
  });

  elements.forEach((element, index) => {
    const field = "normalized_text";
    rows.push({
      id: `element:${element.element_id}:${field}`,
      category: "Element",
      itemType: displayElementType(element.element_type) ?? "Element",
      itemId: element.element_id,
      field,
      currentValue: element.normalized_text ?? element.element_text ?? "",
      sourceStatus: element.source_status ?? "",
      reviewStatus: element.review_status ?? "",
      confidence: element.confidence == null ? "" : String(element.confidence),
      sortOrder: 1000 + index,
      target: { table: "elements", rowKey: `${element.paper_id}:${element.element_id}`, field, oldValue: element.normalized_text ?? "" }
    });
  });

  relations.forEach((relation, index) => {
    const field = "notes";
    rows.push({
      id: `relation:${relation.relation_id}:${field}`,
      category: "Relation",
      itemType: relation.relation_type ?? "Relation",
      itemId: relation.relation_id,
      field,
      currentValue: relation.notes ?? `${relation.source_node_id} -> ${relation.target_node_id}`,
      sourceStatus: relation.source_status ?? "",
      reviewStatus: relation.review_status ?? "",
      confidence: relation.confidence == null ? "" : String(relation.confidence),
      sortOrder: 2000 + index,
      target: { table: "relations", rowKey: `${relation.paper_id}:${relation.relation_id}`, field, oldValue: relation.notes ?? "" }
    });
  });

  evidence.forEach((item, index) => {
    const field = "exact_quote_or_description";
    rows.push({
      id: `evidence:${item.evidence_id}:${field}`,
      category: "Evidence",
      itemType: item.evidence_type ?? "Evidence",
      itemId: item.evidence_id,
      field,
      currentValue: item.exact_quote_or_description ?? "",
      sourceStatus: item.source_status ?? "",
      reviewStatus: "",
      confidence: item.evidence_strength == null ? "" : String(item.evidence_strength),
      sortOrder: 3000 + index,
      target: { table: "evidence", rowKey: `${item.paper_id}:${item.evidence_id}`, field, oldValue: item.exact_quote_or_description ?? "" }
    });
  });

  return rows;
}

function compareCorrectionRows(a: CorrectionRow, b: CorrectionRow, sort: string) {
  if (sort === "type") return compareText(a.itemType, b.itemType) || a.sortOrder - b.sortOrder;
  if (sort === "field") return compareText(a.field, b.field) || a.sortOrder - b.sortOrder;
  if (sort === "confidence") return compareText(b.confidence, a.confidence) || a.sortOrder - b.sortOrder;
  if (sort === "id") return compareText(a.itemId, b.itemId) || a.sortOrder - b.sortOrder;
  return categoryRank(a.category) - categoryRank(b.category) || a.sortOrder - b.sortOrder;
}

function compareText(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function humanizeField(value: string) {
  const labels: Record<string, string> = {
    artifact_type: "Artifact Type",
    blockchain_dlt_role: "DLT Role",
    boundary_conditions: "Limitations",
    doi_or_url: "DOI or URL",
    evaluation_summary: "Evaluation Summary",
    exact_quote_or_description: "Quote / Description",
    full_citation: "Citation",
    input_knowledge: "Input Knowledge",
    key_concepts: "Key Concepts",
    normalized_text: "Normalized Text",
    output_knowledge: "Output Knowledge",
    problem_description: "Problem",
    research_process: "Research Process",
    short_title: "Title",
    solution_description: "Solution"
  };
  if (labels[value]) return labels[value];
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function categoryRank(category: CorrectionRow["category"]) {
  if (category === "Paper") return 0;
  if (category === "Element") return 1;
  if (category === "Relation") return 2;
  return 3;
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

