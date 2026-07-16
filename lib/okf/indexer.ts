import { OKF_SCHEMA_VERSION, type OkfEvidenceItem, type OkfKnowledgeBase, type OkfPaper } from "./schema.ts";
import { normalizeCanonicalText, normalizeSourceLocation } from "./text-hygiene.ts";

export async function indexOkfKnowledgeBase(kb: OkfKnowledgeBase) {
  if (kb.warnings.length) {
    const details = kb.warnings.map((warning) => `${warning.file}: ${warning.message}`).join("\n");
    throw new Error(`Refusing to index an OKF knowledge base with parser warnings.\n${details}`);
  }
  const summary = {
    schema_version: OKF_SCHEMA_VERSION,
    papers: kb.papers.length,
    concepts: kb.concepts.length,
    relations: kb.relations.length,
    evidence_items: kb.evidence_items.length,
    warnings: kb.warnings.map((warning) => warning.file + ": " + warning.message),
    indexed_to_database: false,
    database_schema: "not_attempted" as "not_attempted" | "okf-dsr-v1" | "okf-dsr-v1_without_presentation" | "legacy_compatibility",
    stale_rows_removed: { papers: 0, concepts: 0, relations: 0, evidence_items: 0 }
  };

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    summary.warnings.push("Supabase env vars are not set; parsed OKF only and skipped database upsert.");
    return summary;
  }

  const adminModule = await import("../workbench/supabase-admin.ts");
  const getAdmin = adminModule.getSupabaseAdmin as () => unknown;
  const supabase = getAdmin() as SupabaseLike;
  const indexedAt = new Date().toISOString();
  const canonicalConceptIds = new Set(kb.concepts.map((concept) => concept.concept_id));
  const reviewByPaperId = new Map(kb.papers.map((paper) => [paper.paper_id, paper]));

  const baseRichPaperRows = kb.papers.map((paper) => ({
    paper_id: paper.paper_id,
    schema_version: paper.schema_version,
    slug: paper.slug,
    title: paper.title,
    short_title: paper.short_title ?? null,
    authors: paper.authors ?? null,
    year: paper.year ?? null,
    venue: paper.venue ?? null,
    doi: paper.doi ?? null,
    doi_url: paper.doi_url ?? null,
    source_url: paper.source_url ?? null,
    source_pdf_path: paper.source_pdf_path ?? null,
    abstract: paper.abstract ?? null,
    domain_context: paper.domain_context ?? null,
    research_problem: paper.research_problem,
    research_objective: paper.research_objective,
    research_questions: paper.research_questions,
    artifact_type: paper.artifact_type ?? null,
    dlt_role: paper.blockchain_dlt_role ?? null,
    methodology: paper.methodology ?? null,
    theoretical_foundations: paper.theoretical_foundations,
    evaluation_method: paper.evaluation_method,
    key_contributions: paper.key_contributions,
    design_knowledge_output: paper.design_knowledge_output,
    limitations: paper.limitations,
    notes: paper.notes ?? null,
    extraction_status: "indexed_from_canonical_okf",
    review_status: paper.review_status,
    author_check_status: paper.author_check_status,
    reviewed_by: paper.reviewed_by ?? null,
    reviewed_at: paper.reviewed_at ?? null,
    last_indexed_at: indexedAt,
    updated_at: indexedAt
  }));
  const presentationPaperRows = baseRichPaperRows.map((row, index) => {
    const paper = kb.papers[index];
    return {
      ...row,
      presentation_version: paper.presentation?.presentation_version ?? null,
      paper_metadata: serializeOkfPaperMetadata(paper),
      presentation: paper.presentation ?? null
    };
  });


  let useRichSchema = true;
  try {
    await upsertRows(supabase, "okf_papers", presentationPaperRows, "paper_id");
    summary.database_schema = "okf-dsr-v1";
  } catch (error) {
    if (!isSchemaCompatibilityError(error)) throw error;
    try {
      await upsertRows(supabase, "okf_papers", baseRichPaperRows, "paper_id");
      summary.database_schema = "okf-dsr-v1_without_presentation";
      summary.warnings.push("Supabase presentation columns are not migrated yet; rich OKF metadata was indexed without presentation JSON. Apply the Workbench presentation migration before the final remote re-index.");
    } catch (baseSchemaError) {
      if (!isSchemaCompatibilityError(baseSchemaError)) throw baseSchemaError;
      useRichSchema = false;
      summary.database_schema = "legacy_compatibility";
      summary.warnings.push("Supabase OKF v1 columns are not migrated yet; indexed through the legacy-compatible projection. Apply the OKF DSR v1 migration to persist rich metadata.");
      await upsertRows(supabase, "okf_papers", kb.papers.map((paper) => ({
        paper_id: paper.paper_id,
        title: paper.title,
        authors: paper.authors ?? null,
        year: paper.year ?? null,
        source_pdf_path: paper.source_pdf_path ?? null,
        review_status: legacyReviewStatus(paper.review_status),
        updated_at: indexedAt
      })), "paper_id");
    }
  }

  await upsertRows(supabase, "okf_concepts", kb.concepts.map((concept) => useRichSchema ? ({
    concept_id: concept.concept_id,
    paper_id: concept.paper_id,
    okf_path: concept.okf_path ?? concept.source_file,
    type: concept.type,
    dsr_layer: concept.dsr_layer,
    title: normalizeCanonicalText(concept.title),
    description: normalizeCanonicalText(concept.description),
    body_text: concept.body_text,
    evidence: concept.evidence_ids,
    tags: concept.tags,
    confidence: concept.confidence,
    extraction_type: concept.extraction_type,
    review_status: concept.review_status,
    reviewed_by: reviewByPaperId.get(concept.paper_id)?.reviewed_by ?? null,
    reviewed_at: reviewByPaperId.get(concept.paper_id)?.reviewed_at ?? null,
    updated_at: indexedAt
  }) : ({
    concept_id: concept.concept_id,
    paper_id: concept.paper_id,
    okf_path: concept.okf_path ?? concept.source_file,
    type: concept.type,
    dsr_layer: concept.dsr_layer,
    title: normalizeCanonicalText(concept.title),
    description: normalizeCanonicalText(concept.description),
    body_text: concept.body_text,
    tags: concept.tags,
    confidence: concept.confidence,
    extraction_type: concept.extraction_type,
    review_status: legacyReviewStatus(concept.review_status),
    updated_at: indexedAt
  })), "concept_id");

  await upsertRows(supabase, "okf_evidence_items", kb.evidence_items.map((item) => useRichSchema ? ({
    evidence_id: item.evidence_id,
    paper_id: item.paper_id,
    concept_id: selectIndexedEvidenceConceptId(item, canonicalConceptIds),
    supports: item.supports,
    page_number: item.page_number ?? null,
    section: item.section ? normalizeCanonicalText(item.section) : null,
    quote: item.quote ?? null,
    paraphrase: indexedEvidenceSummary(item),
    quote_or_summary: item.quote ?? indexedEvidenceSummary(item),
    evidence_type: item.evidence_type,
    source_location: item.source_location ? normalizeSourceLocation(item.source_location) : null,
    confidence: item.confidence
  }) : ({
    evidence_id: item.evidence_id,
    paper_id: item.paper_id,
    concept_id: selectIndexedEvidenceConceptId(item, canonicalConceptIds),
    page_number: item.page_number ?? null,
    section: item.section ? normalizeCanonicalText(item.section) : null,
    quote: item.quote ?? null,
    paraphrase: indexedEvidenceSummary(item),
    source_location: item.source_location ? normalizeSourceLocation(item.source_location) : null,
    confidence: item.confidence
  })), "evidence_id");

  await upsertRows(supabase, "okf_relations", kb.relations.map((relation) => useRichSchema ? ({
    relation_id: relation.relation_id,
    source_concept_id: relation.source_concept_id,
    predicate: relation.predicate,
    target_concept_id: relation.target_concept_id,
    evidence_id: relation.evidence_id ?? null,
    evidence: relation.evidence_id ? [relation.evidence_id] : [],
    confidence: relation.confidence,
    extraction_type: relation.extraction_type,
    relation_scope: relation.relation_scope
  }) : ({
    relation_id: relation.relation_id,
    source_concept_id: relation.source_concept_id,
    predicate: relation.predicate,
    target_concept_id: relation.target_concept_id,
    evidence_id: relation.evidence_id ?? null,
    confidence: relation.confidence,
    relation_scope: relation.relation_scope
  })), "relation_id");

  summary.stale_rows_removed = await removeStaleRuntimeRows(supabase, kb);
  summary.indexed_to_database = true;
  return summary;
}

type SupabaseResult = {
  data?: Array<Record<string, unknown>> | null;
  error?: { message: string; code?: string } | null;
};

type SupabaseTable = {
  upsert: (rows: Record<string, unknown>[], options: { onConflict: string }) => PromiseLike<SupabaseResult>;
  select?: (columns: string) => PromiseLike<SupabaseResult>;
  delete?: () => { in: (column: string, values: string[]) => PromiseLike<SupabaseResult> };
};

type SupabaseLike = {
  from: (table: string) => SupabaseTable;
};

async function upsertRows(
  supabase: SupabaseLike,
  table: string,
  rows: Record<string, unknown>[],
  key: string
) {
  if (!rows.length) return;
  const { error } = await supabase.from(table).upsert(rows, { onConflict: key });
  if (error) throw new Error(table + " upsert failed: " + error.message);
}

async function removeStaleRuntimeRows(supabase: SupabaseLike, kb: OkfKnowledgeBase) {
  const removed = { papers: 0, concepts: 0, relations: 0, evidence_items: 0 };
  const specs = [
    { table: "okf_relations", key: "relation_id", current: new Set(kb.relations.map((item) => item.relation_id)), summaryKey: "relations" as const },
    { table: "okf_evidence_items", key: "evidence_id", current: new Set(kb.evidence_items.map((item) => item.evidence_id)), summaryKey: "evidence_items" as const },
    { table: "okf_concepts", key: "concept_id", current: new Set(kb.concepts.map((item) => item.concept_id)), summaryKey: "concepts" as const },
    { table: "okf_papers", key: "paper_id", current: new Set(kb.papers.map((item) => item.paper_id)), summaryKey: "papers" as const }
  ];

  for (const spec of specs) {
    const table = supabase.from(spec.table);
    if (!table.select || !table.delete) continue;
    const result = await table.select(spec.key);
    if (result.error) throw new Error(spec.table + " stale-row scan failed: " + result.error.message);
    const stale = (result.data ?? [])
      .map((row) => String(row[spec.key] ?? ""))
      .filter((id) => id && !spec.current.has(id));
    for (let offset = 0; offset < stale.length; offset += 100) {
      const chunk = stale.slice(offset, offset + 100);
      const deletion = await supabase.from(spec.table).delete!().in(spec.key, chunk);
      if (deletion.error) throw new Error(spec.table + " stale-row cleanup failed: " + deletion.error.message);
    }
    removed[spec.summaryKey] = stale.length;
  }

  return removed;
}

export function serializeOkfPaperMetadata(paper: OkfPaper) {
  return {
    schema_version: paper.schema_version,
    paper_id: paper.paper_id,
    slug: paper.slug,
    title: paper.title,
    short_title: paper.short_title ?? null,
    authors: paper.authors ?? [],
    year: paper.year ?? null,
    venue: paper.venue ?? null,
    doi: paper.doi ?? null,
    doi_url: paper.doi_url ?? null,
    source_url: paper.source_url ?? null,
    source_pdf_filename: paper.source_pdf_path ?? null,
    domain_context: paper.domain_context ?? null,
    abstract: paper.abstract ?? null,
    research_problem: paper.research_problem,
    research_objective: paper.research_objective,
    research_questions: paper.research_questions,
    artifact_type: paper.artifact_type ?? null,
    blockchain_dlt_role: paper.blockchain_dlt_role ?? null,
    methodology: paper.methodology ?? null,
    theoretical_foundations: paper.theoretical_foundations,
    evaluation_method: paper.evaluation_method,
    key_contributions: paper.key_contributions,
    design_knowledge_output: paper.design_knowledge_output,
    limitations: paper.limitations,
    notes: paper.notes ?? null,
    extraction_status: paper.extraction_status,
    review_status: paper.review_status,
    author_check_status: paper.author_check_status,
    reviewed_by: paper.reviewed_by ?? null,
    reviewed_at: paper.reviewed_at ?? null,
    graph_source_reference: paper.graph_source_reference ?? null,
    source_views: paper.source_views ?? []
  };
}

export function selectIndexedEvidenceConceptId(
  item: Pick<OkfEvidenceItem, "concept_id" | "supports">,
  canonicalConceptIds: ReadonlySet<string>
) {
  if (item.concept_id && canonicalConceptIds.has(item.concept_id)) return item.concept_id;
  return item.supports.find((target) => canonicalConceptIds.has(target)) ?? null;
}

function indexedEvidenceSummary(item: OkfEvidenceItem) {
  return item.evidence_type === "quote" ? item.paraphrase : normalizeCanonicalText(item.paraphrase);
}

function legacyReviewStatus(status: string) {
  return status === "internally_reviewed" || status === "author_verified" ? "reviewed" : "draft";
}

function isSchemaCompatibilityError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /column|schema cache|PGRST204|does not exist|review_status.*check/i.test(message);
}