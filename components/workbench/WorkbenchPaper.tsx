"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { WorkbenchErrorPanel } from "@/components/workbench/WorkbenchErrorPanel";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { SuggestionForm } from "@/components/workbench/SuggestionForm";
import { WorkbenchFlowProvider } from "@/components/workbench/WorkbenchFlow";
import { fetchWorkbenchJson } from "@/lib/workbench/client";
import type { WorkbenchDsrMatrix, WorkbenchDsrMatrixConcept, WorkbenchDsrMatrixRow } from "@/lib/okf/workbench-matrix";
import type { ChangeRequest, Paper, PaperBundle, WorkbenchChangeTargetType, WorkbenchElement, WorkbenchEvidence, WorkbenchRelation, WorkbenchReviewStatus } from "@/lib/workbench/types";
import { trackGeneratedFlowViewed, trackPaperOpened } from "@/utils/analytics";

const tabs = ["Overview", "DSR Grid", "Flow", "Corrections"];

type SuggestTarget = {
  targetType: WorkbenchChangeTargetType | "presentation";
  targetId: string;
  field: string;
  currentValue: string;
  targetOkfPath?: string;
  allowTargetEdit?: boolean;
};

type CorrectionRow = {
  id: string;
  category: "Paper" | "Concept" | "Relation" | "Evidence";
  itemType: string;
  itemId: string;
  field: string;
  currentValue: string;
  sourceStatus: string;
  reviewStatus: string;
  confidence: string;
  sortOrder: number;
};

type WorkbenchPresentation = {
  presentation_version?: string;
  paper_id?: string;
  card?: {
    domain_label?: string | null;
    artifact_summary?: string | null;
    dlt_role?: string | null;
  } | null;
  overview?: {
    abstract_summary?: string | null;
    research_problem?: string | null;
    research_objective?: string | null;
    methodology?: string | null;
    evaluation_method?: string[] | null;
    key_contributions?: string[] | null;
    design_knowledge_output?: string[] | null;
  } | null;
  dsr_summary_grid?: {
    problem?: string | null;
    input_knowledge?: string | null;
    research_process?: string | null;
    key_concepts?: string[] | null;
    solution?: string | null;
    output_knowledge?: string | null;
  } | null;
  additional_context?: {
    summary?: string | null;
    limitations?: string[] | null;
  } | null;
};

type MatrixBundle = PaperBundle & {
  dsrMatrix?: WorkbenchDsrMatrix;
  changeRequests?: ChangeRequest[];
  presentation?: WorkbenchPresentation | null;
  design_summary?: WorkbenchPresentation["dsr_summary_grid"] | null;
};

export function WorkbenchPaper({ paperId }: { paperId: string }) {
  const [bundle, setBundle] = useState<MatrixBundle>();
  const [tab, setTab] = useState("Overview");
  const [error, setError] = useState<unknown>();
  const [suggestTarget, setSuggestTarget] = useState<SuggestTarget>();
  const [correctionsVersion, setCorrectionsVersion] = useState(0);
  const trackedPaperId = useRef<string>();
  const trackedFlowForPaperId = useRef<string>();
  const requestBundle = useCallback(() => fetchWorkbenchJson<MatrixBundle>("/api/workbench/paper/" + encodeURIComponent(paperId)), [paperId]);
  const load = useCallback(() => requestBundle().then((next) => { setError(undefined); setBundle(next); }).catch(setError), [requestBundle]);

  useEffect(() => {
    let cancelled = false;
    requestBundle().then((next) => { if (!cancelled) setBundle(next); }).catch((nextError) => { if (!cancelled) setError(nextError); });
    return () => { cancelled = true; };
  }, [requestBundle]);

  useEffect(() => {
    if (!bundle || trackedPaperId.current === bundle.paper.paper_id) return;
    trackedPaperId.current = bundle.paper.paper_id;
    trackPaperOpened(bundle.paper.paper_id, bundle.paper.short_title ?? undefined);
  }, [bundle]);

  useEffect(() => {
    if (!bundle || tab !== "Flow" || trackedFlowForPaperId.current === bundle.paper.paper_id) return;
    trackedFlowForPaperId.current = bundle.paper.paper_id;
    trackGeneratedFlowViewed({ route: "/workbench/[paperId]", paper_id: bundle.paper.paper_id, node_count: bundle.elements.length, edge_count: bundle.relations.length });
  }, [bundle, tab]);

  if (error) return <WorkbenchErrorPanel error={error} />;
  if (!bundle) return <Card className="p-5 text-sm text-muted">Loading paper workbench...</Card>;
  const { paper, elements, relations, evidence } = bundle;
  const headerDomain = nonempty(getPresentation(bundle)?.card?.domain_label ?? paper.domain);

  return (
    <div>
      <div className="mb-6">
        <Link href="/workbench" aria-label="Back to Workbench" title="Back to Workbench" className="inline-flex h-9 w-9 items-center justify-center border border-line bg-white text-muted shadow-research hover:border-blue hover:text-ink"><ArrowLeft className="h-4 w-4" /></Link>
        <div className="mt-3 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="flex flex-wrap gap-2"><Badge>{reviewStatusLabel(paper.review_status)}</Badge></div>
            <h1 className="mt-3 break-words font-serif text-3xl text-ink sm:text-4xl">{paper.title}</h1>
            {nonempty(paper.full_citation) && <p className="mt-2 max-w-4xl text-sm leading-6 text-muted">{paper.full_citation}</p>}
          </div>
          <div className="flex flex-wrap gap-2">{paper.year && <Badge>{paper.year}</Badge>}{headerDomain && <Badge>{humanizeMachineValue(headerDomain)}</Badge>}</div>
        </div>
      </div>
      <Tabs tabs={tabs} active={tab} onChange={setTab} />
      <div className="mt-5">
        {tab === "Overview" && <Overview bundle={bundle} />}
        {tab === "DSR Grid" && <DsrGrid bundle={bundle} onSuggest={setSuggestTarget} />}
        {tab === "Flow" && bundle.flowGraph && <WorkbenchFlowProvider flowGraph={bundle.flowGraph} elements={elements} relations={relations} evidence={evidence} onSuggest={setSuggestTarget} />}
        {tab === "Corrections" && <CorrectionsPanel bundle={bundle} refreshVersion={correctionsVersion} onSuggest={setSuggestTarget} />}
      </div>
      {suggestTarget && <SuggestionForm paperId={paper.paper_id} targetType={suggestTarget.targetType} targetId={suggestTarget.targetId} field={suggestTarget.field} currentValue={suggestTarget.currentValue} targetOkfPath={suggestTarget.targetOkfPath} allowTargetEdit={suggestTarget.allowTargetEdit} onClose={() => setSuggestTarget(undefined)} onSubmitted={() => { load(); setCorrectionsVersion((version) => version + 1); }} />}
    </div>
  );
}

function Overview({ bundle }: { bundle: MatrixBundle }) {
  const { paper } = bundle;
  const presentation = getPresentation(bundle);
  const overview = presentation?.overview;
  const card = presentation?.card;
  const limitations = presentation?.additional_context?.limitations ?? paper.limitations;
  const gaps = metadataGaps(bundle);
  const doiHref = normalizeDoiUrl(nonempty(paper.doi_url) ?? paper.doi);

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-2">
        <OverviewSection title="Bibliographic metadata" description="Publication and source identifiers retained in the canonical paper bundle.">
          <Summary label="Title" value={paper.title} wide />
          <Summary label="Authors" value={paper.authors_list?.join("; ") || paper.authors} />
          <Summary label="Year" value={paper.year} />
          <Summary label="Venue / publication outlet" value={paper.venue} />
          <LinkedSummary label="DOI" value={paper.doi ?? "Open DOI"} href={doiHref} />
          <LinkedSummary label="Source link" value="Open source" href={paper.source_url} />
          <Summary label="Source PDF" value={paper.source_document} />
          <Summary label="Abstract" value={overview?.abstract_summary ?? paper.abstract} wide />
        </OverviewSection>

        <OverviewSection title="DSR summary" description="Human-readable research framing and designed intervention from the canonical presentation profile.">
          <Summary label="Domain / context" value={humanizeOptionalMachineValue(card?.domain_label ?? paper.domain)} />
          <Summary label="Research problem" value={overview?.research_problem ?? paper.research_problem ?? paper.problem_description} wide />
          <Summary label="Research objective" value={overview?.research_objective ?? paper.research_objective} wide />
          <Summary label="Artifact" value={humanizeOptionalMachineValue(card?.artifact_summary ?? paper.artifact_type)} />
          <Summary label="DLT / blockchain role" value={card?.dlt_role ?? paper.blockchain_dlt_role} wide />
          <Summary label="Methodology / design science method" value={humanizeOptionalMachineValue(overview?.methodology ?? paper.methodology ?? paper.research_process)} wide />
        </OverviewSection>

        <OverviewSection title="Evaluation and contribution" description="How the design was evaluated and what reusable knowledge it contributes.">
          <Summary label="Evaluation method" value={joinValues(overview?.evaluation_method) ?? paper.evaluation_method ?? paper.evaluation_summary} wide />
          <Summary label="Key contributions" value={joinValues(overview?.key_contributions) ?? joinValues(paper.key_contributions)} wide />
          <Summary label="Design knowledge output" value={joinValues(overview?.design_knowledge_output) ?? paper.design_knowledge_output ?? paper.output_knowledge} wide />
          <Summary label="Limitations" value={joinValues(limitations) ?? paper.boundary_conditions} wide />
        </OverviewSection>

        <OverviewSection title="Curation state" description="Machine extraction state is separate from human review or author verification.">
          <Summary label="Schema version" value={paper.schema_version} />
          <Summary label="Presentation version" value={presentation?.presentation_version} />
          <Summary label="Extraction status" value={extractionStatusLabel(paper.extraction_status ?? paper.overall_extraction_status)} />
          <Summary label="Review status" value={reviewStatusLabel(paper.review_status)} />
          <Summary label="Author check" value={authorCheckStatusLabel(paper.author_check_status)} />
          <Summary label="Reviewed by" value={paper.reviewed_by} />
          <Summary label="Reviewed at" value={paper.reviewed_at} />
          <Summary label="Last indexed" value={paper.last_indexed_at} />
          <Summary label="Notes" value={paper.notes} wide />
          <CanonicalPaths paper={paper} />
          <div className="border border-blue/20 bg-blue/5 p-3 text-sm leading-6 text-ink md:col-span-2">Canonical changes are made by editing OKF files in Git and re-indexing.</div>
        </OverviewSection>
      </div>

      {gaps.length > 0 && (
        <div className="border border-line bg-paper px-4 py-3 text-sm leading-6 text-muted">
          <strong className="text-ink">Metadata not yet curated:</strong> {gaps.join(", ")}.
        </div>
      )}
    </div>
  );
}
function OverviewSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <Card className="p-5"><h2 className="font-serif text-2xl text-ink">{title}</h2><p className="mt-1 text-sm leading-6 text-muted">{description}</p><div className="mt-5 grid gap-x-6 gap-y-5 md:grid-cols-2">{children}</div></Card>;
}

function DsrGrid({ bundle, onSuggest }: { bundle: MatrixBundle; onSuggest: (target: SuggestTarget) => void }) {
  const [view, setView] = useState<"summary" | "matrix" | "catalog">("summary");
  const matrix = bundle.dsrMatrix;
  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
          <div>
            <h2 className="font-serif text-2xl text-ink">DSR Grid</h2>
            <p className="mt-1 max-w-4xl text-sm leading-6 text-muted">
              Begin with the researcher-facing design synthesis, then inspect machine-grounded pathways and canonical concepts when needed.
            </p>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="DSR Grid view">
            <ViewButton active={view === "summary"} onClick={() => setView("summary")}>Design Summary</ViewButton>
            <ViewButton active={view === "matrix"} onClick={() => setView("matrix")}>Pathway Matrix</ViewButton>
            <ViewButton active={view === "catalog"} onClick={() => setView("catalog")}>Concept Catalog</ViewButton>
          </div>
        </div>
        {view !== "summary" && matrix && (
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
            <span>Source: <strong className="text-ink">{matrixSourceLabel(matrix.source)}</strong></span>
            <span>Rows: <strong className="text-ink">{matrix.stats.primary_row_count}</strong></span>
            <span>Primary concepts: <strong className="text-ink">{matrix.stats.primary_concept_count}</strong></span>
            <span>Additional concepts: <strong className="text-ink">{matrix.stats.additional_concept_count}</strong></span>
            {(matrix.stats.rows_truncated || matrix.stats.candidates_truncated) && <span className="font-medium text-amber">Primary pathways are capped; inspect Concept Catalog and Full Relations for the remainder.</span>}
          </div>
        )}
      </Card>

      {view === "summary" && <DesignSummary bundle={bundle} onSuggest={onSuggest} />}
      {view !== "summary" && !matrix && <Card className="p-5 text-sm leading-6 text-muted">The canonical matrix projection is not available for this paper. The Flow tab still exposes stored relations.</Card>}
      {view === "matrix" && matrix && <MatrixView matrix={matrix} evidence={bundle.evidence} onSuggest={onSuggest} />}
      {view === "catalog" && matrix && <ConceptCatalog matrix={matrix} evidence={bundle.evidence} onSuggest={onSuggest} />}
    </div>
  );
}

function DesignSummary({ bundle, onSuggest }: { bundle: MatrixBundle; onSuggest: (target: SuggestTarget) => void }) {
  const summary = getDesignSummary(bundle);
  const additional = getPresentation(bundle)?.additional_context;
  const targetOkfPath = canonicalPresentationPath(bundle.paper);
  const cards: Array<{ key: string; title: string; value: string | string[] | null | undefined }> = [
    { key: "problem", title: "Problem", value: summary?.problem },
    { key: "input_knowledge", title: "Input Knowledge", value: summary?.input_knowledge },
    { key: "research_process", title: "Research Process", value: summary?.research_process },
    { key: "key_concepts", title: "Key Concepts", value: summary?.key_concepts },
    { key: "solution", title: "Solution", value: summary?.solution },
    { key: "output_knowledge", title: "Output Knowledge", value: summary?.output_knowledge }
  ];

  return (
    <div className="space-y-5" data-workbench-dsr-default="design-summary">
      <div className="grid gap-4 lg:grid-cols-3">
        {cards.map((item) => (
          <SummaryCard
            key={item.key}
            title={item.title}
            value={item.value}
            onSuggest={() => onSuggest({
              targetType: "presentation",
              targetId: bundle.paper.paper_id,
              field: `dsr_summary_grid.${item.key}`,
              currentValue: presentationValue(item.value),
              targetOkfPath
            })}
          />
        ))}
      </div>

      <Card className="p-5">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Additional extracted context</p>
            <h3 className="mt-1 font-serif text-2xl text-ink">Summary and limitations</h3>
          </div>

        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <div>
            <div className="flex items-center justify-between gap-3"><h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Summary</h4><button className="text-xs font-medium text-blue hover:text-ink" onClick={() => onSuggest({ targetType: "presentation", targetId: bundle.paper.paper_id, field: "additional_context.summary", currentValue: additional?.summary ?? "", targetOkfPath })}>Suggest edit</button></div>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-ink">{nonempty(additional?.summary) ?? "No additional summary is available in the presentation profile."}</p>
          </div>
          <div>
            <div className="flex items-center justify-between gap-3"><h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Limitations</h4><button className="text-xs font-medium text-blue hover:text-ink" onClick={() => onSuggest({ targetType: "presentation", targetId: bundle.paper.paper_id, field: "additional_context.limitations", currentValue: (additional?.limitations ?? []).join("\n"), targetOkfPath })}>Suggest edit</button></div>
            {additional?.limitations?.length ? <ReadableList values={additional.limitations} /> : <p className="mt-2 text-sm leading-6 text-muted">No limitations are recorded in the presentation profile.</p>}
          </div>
        </div>
      </Card>
    </div>
  );
}

function SummaryCard({ title, value, onSuggest }: { title: string; value: string | string[] | null | undefined; onSuggest: () => void }) {
  const values = Array.isArray(value) ? value.filter(nonemptyBoolean) : [];
  const text = Array.isArray(value) ? null : nonempty(value);
  return (
    <Card className="flex min-h-64 flex-col p-5">
      <h3 className="font-serif text-2xl text-ink">{title}</h3>
      <div className="mt-3 flex-1 text-sm leading-6 text-ink">
        {values.length > 0 ? <ReadableList values={values} /> : text ? <p className="whitespace-pre-line">{text}</p> : <p className="text-muted">This presentation section has not yet been curated.</p>}
      </div>
      <button className="mt-4 self-start border-t border-line pt-3 text-xs font-medium text-blue hover:text-ink" onClick={onSuggest}>Suggest edit / Report issue</button>
    </Card>
  );
}

function ReadableList({ values }: { values: string[] }) {
  return <ul className="mt-2 list-disc space-y-2 pl-5">{values.filter(nonemptyBoolean).map((value, index) => <li key={`${value}-${index}`}>{value}</li>)}</ul>;
}
function MatrixView({ matrix, evidence, onSuggest }: { matrix: WorkbenchDsrMatrix; evidence: WorkbenchEvidence[]; onSuggest: (target: SuggestTarget) => void }) {
  return (
    <div className="space-y-5">
      {matrix.rows.length > 0 ? (
        <Card className="overflow-hidden"><div className="overflow-x-auto"><table className="min-w-[1680px] table-fixed text-left"><thead className="bg-paper"><tr>{matrix.columns.map((column) => <th key={column.key} className="w-60 border-b border-r border-line px-3 py-3 text-xs font-semibold uppercase tracking-[0.1em] text-muted last:border-r-0">{column.label}</th>)}</tr></thead><tbody>{matrix.rows.map((row, rowIndex) => <MatrixRow key={row.row_id} row={row} rowIndex={rowIndex} evidence={evidence} onSuggest={onSuggest} />)}</tbody></table></div></Card>
      ) : <Card className="p-5 text-sm leading-6 text-muted">No coherent pathway can be rendered without inventing an edge. All canonical concepts remain available in the Concept catalog.</Card>}
      {matrix.additional_concepts.length > 0 && (
        <section><div className="mb-3"><h3 className="font-serif text-2xl text-ink">Additional concepts not in primary matrix</h3><p className="mt-1 text-sm leading-6 text-muted">These concepts are canonical, but are not part of the selected stored pathways.</p></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{matrix.additional_concepts.map((concept) => <MatrixConceptCard key={concept.concept_id} concept={concept} evidence={evidence} onSuggest={onSuggest} />)}</div></section>
      )}
      {matrix.warnings.length > 0 && <details className="border border-line bg-white p-4 text-sm text-muted"><summary className="cursor-pointer font-medium text-ink">Matrix validation notes ({matrix.warnings.length})</summary><ul className="mt-3 list-disc space-y-1 pl-5">{matrix.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></details>}
    </div>
  );
}
function MatrixRow({ row, rowIndex, evidence, onSuggest }: { row: WorkbenchDsrMatrixRow; rowIndex: number; evidence: WorkbenchEvidence[]; onSuggest: (target: SuggestTarget) => void }) {
  return (
    <>
      <tr className="align-top">{row.cells.map((cell) => <td key={`${row.row_id}-${cell.column}`} className="border-r border-t border-line p-2 last:border-r-0"><div className="space-y-2">{cell.concepts.map((concept) => <MatrixConceptCard key={concept.concept_id} concept={concept} evidence={evidence} compact onSuggest={onSuggest} />)}{cell.concepts.length === 0 && <div className="min-h-24 border border-dashed border-line p-3 text-xs text-muted">Not present in this stored pathway</div>}</div></td>)}</tr>
      <tr className="border-t border-line bg-paper/60"><td colSpan={7} className="px-3 py-2 text-xs text-muted"><details><summary className="cursor-pointer">Path {rowIndex + 1} · {row.origin === "recommended_path" ? "recommended graph path" : "stored relation path"} · {provenanceLabel(row.provenance)}</summary><div className="mt-2 grid gap-2 md:grid-cols-2 xl:grid-cols-3">{row.segments.map((segment) => <div key={segment.segment_id} className="border border-line bg-white p-2 leading-5"><div className="font-medium text-ink">{localId(segment.source_concept_id)} → {localId(segment.target_concept_id)}</div><div>Predicate: {segment.predicates.join(", ") || "Stored edge"}</div><div>Provenance: {provenanceLabel(segment.provenance)}</div>{segment.relation_ids.length > 0 && <div>Relation: {segment.relation_ids.join(", ")}</div>}{segment.evidence_ids.length > 0 && <div>Evidence: {segment.evidence_ids.join(", ")}</div>}</div>)}</div></details></td></tr>
    </>
  );
}

function MatrixConceptCard({ concept, evidence, onSuggest, compact = false }: { concept: WorkbenchDsrMatrixConcept; evidence: WorkbenchEvidence[]; onSuggest: (target: SuggestTarget) => void; compact?: boolean }) {
  const relatedEvidence = evidenceForConcept(concept, evidence);
  return (
    <div className={`border border-line bg-white ${compact ? "p-3" : "p-4"}`}>
      <h4 className={`break-words font-serif leading-tight text-ink ${compact ? "text-base" : "text-lg"}`}>{concept.title}</h4>
      {nonempty(concept.description) ? (
        <p className={`mt-2 break-words text-sm leading-5 text-ink ${compact ? "line-clamp-4" : "line-clamp-5"}`} title={concept.description ?? undefined}>{concept.description}</p>
      ) : <p className="mt-2 text-sm leading-5 text-muted">No description is recorded.</p>}
      <details className="mt-3 border-t border-line pt-2 text-xs text-muted">
        <summary className="cursor-pointer font-medium text-ink">Details, evidence, and provenance</summary>
        <div className="mt-2 space-y-2">
          <div><strong className="text-ink">Canonical ID:</strong> {concept.concept_id}</div>
          <div><strong className="text-ink">Evidence count:</strong> {concept.evidence_count}</div>
          <div><strong className="text-ink">Confidence:</strong> {displayValue(concept.confidence)}</div>
          <div><strong className="text-ink">Review status:</strong> {reviewStatusLabel(concept.review_status)}</div>
          <div><strong className="text-ink">Canonical file:</strong> {displayValue(concept.okf_path ?? concept.source_file)}</div>
          <div><strong className="text-ink">Extraction:</strong> {extractionStatusLabel(concept.extraction_type)}</div>
          {relatedEvidence.map((item) => (
            <div key={item.evidence_id} className="border border-line bg-paper p-2">
              <div className="font-medium text-ink">{item.evidence_id}</div>
              <div className="mt-1 leading-5">{displayValue(item.exact_quote_or_description)}</div>
              {(item.page || item.section) && <div className="mt-1">{[item.page ? `Page ${item.page}` : null, item.section].filter(Boolean).join(" / ")}</div>}
            </div>
          ))}
          {relatedEvidence.length === 0 && <div>No directly linked evidence item was found.</div>}
        </div>
      </details>
      <button className="mt-3 text-xs font-medium text-blue hover:text-ink" onClick={() => onSuggest({ targetType: "concept", targetId: concept.concept_id, field: "description", currentValue: concept.description ?? "", targetOkfPath: concept.okf_path ?? concept.source_file ?? undefined })}>Report issue</button>
    </div>
  );
}
function ConceptCatalog({ matrix, evidence, onSuggest }: { matrix: WorkbenchDsrMatrix; evidence: WorkbenchEvidence[]; onSuggest: (target: SuggestTarget) => void }) {
  return <div className="space-y-6">{matrix.catalog.map((group) => <section key={group.column}><div className="mb-3 flex items-end justify-between gap-3"><h3 className="font-serif text-2xl text-ink">{group.column}</h3><span className="text-xs uppercase tracking-[0.1em] text-muted">{group.concepts.length} concept{group.concepts.length === 1 ? "" : "s"}</span></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{group.concepts.map((concept) => <MatrixConceptCard key={concept.concept_id} concept={concept} evidence={evidence} onSuggest={onSuggest} />)}{group.concepts.length === 0 && <Card className="p-4 text-sm text-muted">No canonical concepts in this layer.</Card>}</div></section>)}</div>;
}
function CorrectionsPanel({ bundle, refreshVersion, onSuggest }: { bundle: MatrixBundle; refreshVersion: number; onSuggest: (target: SuggestTarget) => void }) {
  const { paper, elements, relations, evidence } = bundle;
  const [requests, setRequests] = useState<ChangeRequest[]>(bundle.changeRequests ?? []);
  const [requestError, setRequestError] = useState<string>();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [itemType, setItemType] = useState("all");
  const [field, setField] = useState("all");
  const rows = useMemo(() => buildCorrectionRows(paper, elements, relations, evidence), [elements, evidence, paper, relations]);
  const itemTypes = unique(rows.map((row) => row.itemType));
  const fields = unique(rows.map((row) => row.field));
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return rows.filter((row) => {
      const haystack = `${row.category} ${row.itemType} ${row.itemId} ${row.field} ${row.currentValue}`.toLowerCase();
      return (!normalizedQuery || haystack.includes(normalizedQuery)) && (category === "all" || row.category === category) && (itemType === "all" || row.itemType === itemType) && (field === "all" || row.field === field);
    });
  }, [category, field, itemType, query, rows]);

  useEffect(() => {
    let cancelled = false;
    fetchWorkbenchJson<{ ok: true; changeRequests: ChangeRequest[] }>(`/api/workbench/change-requests?paperId=${encodeURIComponent(paper.paper_id)}`)
      .then((result) => { if (!cancelled) { setRequests(result.changeRequests); setRequestError(undefined); } })
      .catch((nextError) => { if (!cancelled) setRequestError(nextError instanceof Error ? nextError.message : "Could not load submitted requests."); });
    return () => { cancelled = true; };
  }, [paper.paper_id, refreshVersion]);

  return (
    <div className="space-y-5">
      <Card className="p-5"><div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start"><div><h2 className="font-serif text-2xl text-ink">Issue and change requests</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Accepted reports produce a Git change to OKF files and re-indexing. They do not overwrite canonical facts in Supabase.</p></div><button className="border border-ink bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-blue" onClick={() => onSuggest({ targetType: "paper", targetId: paper.paper_id, field: "notes", currentValue: paper.notes ?? "", targetOkfPath: paper.canonical_paths?.index, allowTargetEdit: true })}>Report issue</button></div></Card>
      <Card className="overflow-hidden">
        <div className="border-b border-line p-4"><h3 className="font-serif text-xl text-ink">Submitted requests</h3><p className="mt-1 text-sm text-muted">Open and resolved review reports for this paper.</p></div>
        <div className="divide-y divide-line">
          {requests.map((request) => <div key={request.id ?? `${request.target_type}-${request.target_id}-${request.field}`} className="p-4"><div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start"><div><div className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">{request.target_type} · {request.field}</div><div className="mt-1 break-words text-sm font-medium text-ink">{request.target_id}</div></div><Badge>{changeStatusLabel(request.status)}</Badge></div><div className="mt-3 grid gap-3 md:grid-cols-2"><RequestValue label="Proposed change" value={request.proposed_value} /><RequestValue label="Reason" value={request.reason} /><RequestValue label="Target OKF file" value={request.target_okf_path} /><RequestValue label="Submitted" value={request.created_at} /></div></div>)}
          {requests.length === 0 && !requestError && <div className="p-5 text-sm text-muted">No change requests have been submitted for this paper.</div>}
          {requestError && <div className="p-5 text-sm text-muted">Submitted requests could not be loaded: {requestError}</div>}
        </div>
      </Card>
      <details className="border border-line bg-white shadow-research">
        <summary className="cursor-pointer p-4 font-medium text-ink">Advanced indexed-field audit <span className="font-normal text-muted">({rows.length} read-only fields)</span></summary>
        <div className="border-t border-line">
          <div className="grid gap-3 border-b border-line p-4 md:grid-cols-2 xl:grid-cols-4"><Input placeholder="Search indexed fields" value={query} onChange={(event) => setQuery(event.target.value)} /><Select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option><option>Paper</option><option>Concept</option><option>Relation</option><option>Evidence</option></Select><Select value={itemType} onChange={(event) => setItemType(event.target.value)}><option value="all">All item types</option>{itemTypes.map((item) => <option key={item}>{item}</option>)}</Select><Select value={field} onChange={(event) => setField(event.target.value)}><option value="all">All fields</option>{fields.map((item) => <option key={item}>{humanizeField(item)}</option>)}</Select></div>
          <p className="border-b border-line bg-paper px-4 py-3 text-xs leading-5 text-muted">Read-only indexed projection. Use “Report issue” above to request a canonical Git change.</p>
          <DataTable headers={["Category", "ID", "Type", "Field", "Current value", "Extraction", "Review", "Confidence"]}>{filtered.map((row) => <tr key={row.id} className="border-t border-line align-top"><Cell><Badge>{row.category}</Badge></Cell><Cell>{row.itemId}</Cell><Cell>{row.itemType}</Cell><Cell>{humanizeField(row.field)}</Cell><Cell>{row.currentValue || "Not recorded"}</Cell><Cell>{extractionStatusLabel(row.sourceStatus)}</Cell><Cell>{row.reviewStatus ? reviewStatusLabel(row.reviewStatus) : "Not applicable"}</Cell><Cell>{row.confidence || "Not recorded"}</Cell></tr>)}</DataTable>
        </div>
      </details>
    </div>
  );
}
function Summary({ label, value, wide = false }: { label: string; value: string | number | null | undefined; wide?: boolean }) {
  const displayed = typeof value === "number" ? String(value) : nonempty(value);
  if (!displayed) return null;
  return <div className={wide ? "md:col-span-2" : undefined}><div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</div><div className="mt-1 whitespace-pre-line break-words text-sm leading-6 text-ink"><LinkedText text={displayed} /></div></div>;
}

function LinkedSummary({ label, value, href }: { label: string; value: string | null | undefined; href: string | null | undefined }) {
  const safeHref = nonempty(href);
  if (!safeHref) return null;
  return <div><div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</div><div className="mt-1 break-words text-sm leading-6 text-ink"><a href={safeHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue underline decoration-blue/30 underline-offset-2 hover:text-ink">{nonempty(value) ?? `Open ${label}`}<ExternalLink className="h-3.5 w-3.5" /></a></div></div>;
}

function CanonicalPaths({ paper }: { paper: Paper }) {
  const paths = paper.canonical_paths as (Paper["canonical_paths"] & { presentation?: string }) | undefined;
  if (!paths) return null;
  return <div className="md:col-span-2"><div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Canonical OKF files</div><div className="mt-2 grid gap-1 text-xs leading-5 text-ink sm:grid-cols-2">{Object.entries(paths).filter(([, path]) => nonempty(path)).map(([label, path]) => <div key={label}><span className="font-medium">{humanizeField(label)}:</span> <span className="break-all text-muted">{path}</span></div>)}</div></div>;
}
function RequestValue({ label, value }: { label: string; value: string | null | undefined }) {
  return <div><div className="text-xs font-semibold uppercase tracking-[0.1em] text-muted">{label}</div><div className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-ink">{displayValue(value)}</div></div>;
}

function DataTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return <div className="max-h-[70vh] overflow-auto"><table className="min-w-[1180px] text-left text-sm xl:min-w-full"><thead className="sticky top-0 z-10 bg-paper text-xs uppercase tracking-[0.12em] text-muted"><tr>{headers.map((header) => <th key={header} className="px-3 py-3 font-semibold">{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}

function Cell({ children }: { children: React.ReactNode }) {
  return <td className="max-w-[360px] break-words px-3 py-3 text-sm leading-6 text-ink">{typeof children === "string" ? <LinkedText text={children} /> : children}</td>;
}

function buildCorrectionRows(paper: Paper, elements: WorkbenchElement[], relations: WorkbenchRelation[], evidence: WorkbenchEvidence[]) {
  const rows: CorrectionRow[] = [];
  const paperFields: Array<{ field: string; value: string | number | null | undefined }> = [
    { field: "title", value: paper.title }, { field: "authors", value: paper.authors }, { field: "year", value: paper.year }, { field: "venue", value: paper.venue }, { field: "doi", value: paper.doi }, { field: "source_pdf_filename", value: paper.source_document }, { field: "review_status", value: paper.review_status }
  ];
  paperFields.forEach(({ field, value }, index) => rows.push({ id: `paper:${field}`, category: "Paper", itemType: "Paper metadata", itemId: paper.paper_id, field, currentValue: value == null ? "" : String(value), sourceStatus: paper.extraction_status ?? paper.overall_extraction_status ?? "", reviewStatus: paper.review_status ?? "", confidence: paper.overall_confidence == null ? "" : String(paper.overall_confidence), sortOrder: index }));
  elements.forEach((element, index) => rows.push({ id: `concept:${element.element_id}`, category: "Concept", itemType: element.canonical_type ?? element.element_type ?? "Concept", itemId: element.element_id, field: element.canonical_field ?? "description", currentValue: element.normalized_text ?? element.element_text ?? "", sourceStatus: element.source_status ?? "", reviewStatus: element.review_status ?? "", confidence: element.confidence_label ?? (element.confidence == null ? "" : String(element.confidence)), sortOrder: 1000 + index }));
  relations.forEach((relation, index) => rows.push({ id: `relation:${relation.relation_id}`, category: "Relation", itemType: relation.relation_type ?? "Relation", itemId: relation.relation_id, field: "predicate", currentValue: relation.relation_type ?? "", sourceStatus: relation.source_status ?? "", reviewStatus: relation.review_status ?? "", confidence: relation.confidence == null ? "" : String(relation.confidence), sortOrder: 2000 + index }));
  evidence.forEach((item, index) => rows.push({ id: `evidence:${item.evidence_id}`, category: "Evidence", itemType: item.evidence_type ?? "Evidence", itemId: item.evidence_id, field: "quote_or_summary", currentValue: item.exact_quote_or_description ?? "", sourceStatus: item.source_status ?? "", reviewStatus: "", confidence: item.confidence_label ?? (item.evidence_strength == null ? "" : String(item.evidence_strength)), sortOrder: 3000 + index }));
  return rows.sort((left, right) => left.sortOrder - right.sortOrder);
}
function evidenceForConcept(concept: WorkbenchDsrMatrixConcept, evidence: WorkbenchEvidence[]) {
  const ids = new Set(concept.evidence_ids);
  return evidence.filter((item) => ids.has(item.evidence_id) || item.concept_id === concept.concept_id || splitTokens(item.element_ids_supported).includes(concept.concept_id));
}

function getPresentation(bundle: MatrixBundle): WorkbenchPresentation | null {
  const paperPresentation = (bundle.paper as Paper & { presentation?: WorkbenchPresentation | null }).presentation;
  return bundle.presentation ?? paperPresentation ?? null;
}

function getDesignSummary(bundle: MatrixBundle) {
  return bundle.design_summary ?? getPresentation(bundle)?.dsr_summary_grid ?? null;
}

function canonicalPresentationPath(paper: Paper) {
  const paths = paper.canonical_paths as (Paper["canonical_paths"] & { presentation?: string }) | undefined;
  return paths?.presentation ?? `library/okf/papers/${paper.slug ?? paper.paper_id}/presentation.yaml`;
}

function metadataGaps(bundle: MatrixBundle) {
  const presentation = getPresentation(bundle);
  const paper = bundle.paper;
  const overview = presentation?.overview;
  const checks: Array<[string, unknown]> = [
    ["venue", paper.venue],
    ["DOI", paper.doi ?? paper.doi_url],
    ["source URL", paper.source_url],
    ["source PDF", paper.source_document],
    ["abstract summary", overview?.abstract_summary ?? paper.abstract],
    ["research objective", overview?.research_objective ?? paper.research_objective],
    ["methodology", overview?.methodology ?? paper.methodology ?? paper.research_process],
    ["evaluation method", overview?.evaluation_method ?? paper.evaluation_method],
    ["key contributions", overview?.key_contributions ?? paper.key_contributions],
    ["design knowledge output", overview?.design_knowledge_output ?? paper.design_knowledge_output]
  ];
  return checks.filter(([, value]) => !hasPresentationValue(value)).map(([label]) => label);
}

function hasPresentationValue(value: unknown): boolean {
  if (Array.isArray(value)) return value.some((item) => typeof item === "string" && Boolean(nonempty(item)));
  return typeof value === "number" || (typeof value === "string" && Boolean(nonempty(value)));
}

function normalizeDoiUrl(value: string | null | undefined) {
  const normalized = nonempty(value);
  if (!normalized) return null;
  const doi = normalized.replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, "");
  return `https://doi.org/${doi}`;
}

function presentationValue(value: string | string[] | null | undefined) {
  return Array.isArray(value) ? value.join("\n") : value ?? "";
}

function nonempty(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized && !/^(?:not recorded|n\/a|unknown|todo|-)$/i.test(normalized) ? normalized : null;
}

function nonemptyBoolean(value: string): value is string {
  return Boolean(nonempty(value));
}
function reviewStatusLabel(status: WorkbenchReviewStatus | string | null | undefined) {
  if (status === "author_verified") return "Author verified";
  if (status === "internally_reviewed") return "Internally reviewed";
  return "Needs review";
}

function extractionStatusLabel(status: string | null | undefined) {
  if (status === "indexed_from_canonical_okf") return "Indexed from canonical OKF";
  if (status === "okf_draft" || status === "draft") return "OKF draft";
  if (status === "explicit-in-artifact") return "Explicit in artifact";
  return status ? humanizeField(status) : "Not recorded";
}

function authorCheckStatusLabel(status: string | null | undefined) {
  if (status === "not_requested" || !status) return "Not requested";
  return humanizeField(status);
}

function changeStatusLabel(status: string) {
  if (status === "accepted_for_git_change") return "Accepted for Git change";
  if (status === "resolved_after_reindex") return "Resolved after re-index";
  return humanizeField(status);
}

function matrixSourceLabel(source: WorkbenchDsrMatrix["source"]) {
  if (source === "graph_json_recommended_paths") return "graph.json recommended paths";
  if (source === "stored_relations_fallback") return "OKF relations fallback";
  return "No coherent stored path";
}

function provenanceLabel(value: string) {
  if (value === "graph_json") return "graph.json";
  if (value === "okf_relation") return "OKF relation";
  if (value === "graph_json+okf_relation") return "graph.json + OKF relation";
  return "Mixed stored provenance";
}

function ViewButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button className={active ? "border border-ink bg-ink px-3 py-2 text-sm font-medium text-white" : "border border-line bg-white px-3 py-2 text-sm font-medium text-muted hover:border-blue hover:text-ink"} onClick={onClick}>{children}</button>;
}

function displayValue(value: string | number | null | undefined) {
  if (typeof value === "number") return String(value);
  return value?.trim() || "Not recorded";
}

function joinValues(values: string[] | null | undefined) { return values?.filter(Boolean).join("\n") || null; }
function localId(id: string) { return id.split(":").at(-1) ?? id; }
function humanizeMachineValue(value: string) {
  return /^[a-z0-9]+(?:_[a-z0-9]+)+$/.test(value) ? value.replace(/_/g, " ").replace(/^\w/, (letter) => letter.toUpperCase()) : value;
}
function humanizeOptionalMachineValue(value: string | null | undefined) { return value ? humanizeMachineValue(value) : value; }
function humanizeField(value: string) { return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function unique(values: Array<string | null | undefined>) { return [...new Set(values.filter((value): value is string => Boolean(value)))].sort(); }
function splitTokens(value: string | null | undefined) { return (value ?? "").split(/[;,]/).map((token) => token.trim()).filter(Boolean); }

function LinkedText({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s)\]}>"']+)/g);
  return <>{parts.map((part, index) => {
    if (!part) return null;
    if (/^https?:\/\//.test(part)) {
      const { href, trailing } = splitTrailingPunctuation(part);
      return <span key={`${part}-${index}`}><a href={href} target="_blank" rel="noreferrer" className="break-all text-blue underline decoration-blue/30 underline-offset-2 hover:text-ink">{href}</a>{trailing}</span>;
    }
    return <span key={`${part}-${index}`}>{part}</span>;
  })}</>;
}

function splitTrailingPunctuation(value: string) {
  const match = value.match(/^(.*?)([.,;:!?]+)$/);
  if (!match) return { href: value, trailing: "" };
  return { href: match[1], trailing: match[2] };
}