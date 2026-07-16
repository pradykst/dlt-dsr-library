import { parseOkfLibrary } from "./parser.ts";
import { buildOkfFlow } from "./flow.ts";
import { resolveSupabaseServerCredential, serviceRoleRestHeaders, type SupabaseServerCredential } from "../supabase/server.ts";
import { OKF_PRESENTATION_VERSION, okfGraphSourceReferenceTypes, okfGraphValidationStatuses, okfRelationPredicates, type ConfidenceLabel, type OkfAuthorCheckStatus, type OkfConcept, type OkfConceptType, type OkfEvidenceType, type OkfExtractionStatus, type OkfExtractionType, type OkfGraphSourceReference, type OkfKnowledgeBase, type OkfPresentation, type OkfRelation, type OkfRelationPredicate, type OkfRelationScope, type OkfSourceView } from "./schema.ts";
import { parseOkfSourceViews } from "./source-view.ts";
import { normalizeCanonicalText, normalizeSourceLocation } from "./text-hygiene.ts";

export type ConceptFilters = { paper_id?: string; tags?: string[]; query?: string; review_status?: string };
export type OkfSupabaseLoadOptions = { env?: Record<string, string | undefined>; fetchImpl?: typeof fetch };
export type OkfKnowledgeBaseLoadMetadata = {
  db_loaded_from: "supabase" | "local_okf_fallback";
  key_type: "service_role" | "anon" | "unavailable";
  row_count?: number;
  warning?: string;
  db_error_code?: string;
  db_error_message?: string;
};

let cachedKb: OkfKnowledgeBase | null = null;
let cachedDbKb: OkfKnowledgeBase | null = null;
let lastKbLoadMetadata: OkfKnowledgeBaseLoadMetadata = {
  db_loaded_from: "local_okf_fallback",
  key_type: "unavailable"
};

export function getOkfKnowledgeBaseLoadMetadata(): OkfKnowledgeBaseLoadMetadata {
  return lastKbLoadMetadata;
}

export function getOkfKnowledgeBase(force = false) {
  if (!cachedKb || force) cachedKb = parseOkfLibrary();
  return cachedKb;
}

export async function getOkfKnowledgeBaseForChat(force = false) {
  if (!force && cachedDbKb) {
    lastKbLoadMetadata = {
      db_loaded_from: "supabase",
      key_type: "service_role",
      row_count: cachedDbKb.papers.length
    };
    return cachedDbKb;
  }
  const dbKb = await loadOkfKnowledgeBaseFromSupabase();
  if (dbKb) {
    cachedDbKb = dbKb;
    return dbKb;
  }
  return getOkfKnowledgeBase(force);
}

export async function loadOkfKnowledgeBaseFromSupabase(
  options: OkfSupabaseLoadOptions = {}
): Promise<OkfKnowledgeBase | null> {
  const credential = resolveSupabaseServerCredential(options.env ?? process.env);
  if (credential.key_type !== "service_role") {
    const anonOnly = credential.key_type === "anon";
    lastKbLoadMetadata = {
      db_loaded_from: "local_okf_fallback",
      key_type: credential.key_type,
      row_count: 0,
      warning: credential.warning,
      db_error_code: anonOnly ? "SERVICE_ROLE_REQUIRED" : "SUPABASE_UNAVAILABLE",
      db_error_message: anonOnly
        ? "Anon Supabase access is not used for server OKF reads and may be hidden by RLS. Configure SUPABASE_SERVICE_ROLE_KEY."
        : credential.warning
    };
    return null;
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  try {
    const local = getOkfKnowledgeBase();
    const [papersResult, conceptsResult, evidenceResult, relationsResult] = await Promise.all([
      selectOkfRowsWithLegacyFallback(
        credential,
        fetchImpl,
        "okf_papers",
        "paper_id,schema_version,slug,title,short_title,authors,year,venue,doi,doi_url,source_url,source_pdf_path,abstract,domain_context,research_problem,research_objective,research_questions,artifact_type,dlt_role,methodology,theoretical_foundations,evaluation_method,key_contributions,design_knowledge_output,limitations,notes,extraction_status,review_status,author_check_status,reviewed_by,reviewed_at,last_indexed_at,paper_metadata,presentation",
        "paper_id,title,authors,year,source_pdf_path,review_status"
      ),
      selectOkfRowsWithLegacyFallback(
        credential,
        fetchImpl,
        "okf_concepts",
        "concept_id,paper_id,okf_path,type,dsr_layer,title,description,body_text,evidence,tags,confidence,extraction_type,review_status,reviewed_by,reviewed_at",
        "concept_id,paper_id,okf_path,type,dsr_layer,title,description,body_text,tags,confidence,extraction_type,review_status"
      ),
      selectOkfRowsWithLegacyFallback(
        credential,
        fetchImpl,
        "okf_evidence_items",
        "evidence_id,paper_id,concept_id,supports,page_number,section,quote,paraphrase,quote_or_summary,evidence_type,source_location,confidence",
        "evidence_id,paper_id,concept_id,page_number,section,quote,paraphrase,source_location,confidence"
      ),
      selectOkfRowsWithLegacyFallback(
        credential,
        fetchImpl,
        "okf_relations",
        "relation_id,source_concept_id,predicate,target_concept_id,evidence_id,evidence,confidence,extraction_type,relation_scope",
        "relation_id,source_concept_id,predicate,target_concept_id,evidence_id,confidence,relation_scope"
      )
    ]);

    const localPapers = new Map(local.papers.map((paper) => [paper.paper_id, paper]));
    const localConcepts = new Map(local.concepts.map((concept) => [concept.concept_id, concept]));
    const localEvidence = new Map(local.evidence_items.map((item) => [item.evidence_id, item]));
    const localRelations = new Map(local.relations.map((relation) => [relation.relation_id, relation]));

    const papers: OkfKnowledgeBase["papers"] = papersResult.rows.map((row) => {
      const paperMetadata = jsonObjectValue(row.paper_metadata);
      const paperId = String(row.paper_id);
      const fallback = localPapers.get(paperId);
      const resolvedAuthorCheckStatus = authorCheckStatus(row.author_check_status, fallback?.author_check_status);
      const resolvedReviewStatus = safeReviewStatus(row.review_status, row.reviewed_by, row.reviewed_at, resolvedAuthorCheckStatus);
      return {
        schema_version: fallback?.schema_version ?? "okf-dsr-v1" as const,
        paper_id: paperId,
        slug: stringValue(row.slug) ?? fallback?.slug ?? paperId.toLowerCase().replace(/_+/g, "-"),
        title: String(row.title),
        short_title: nullableString(row.short_title) ?? fallback?.short_title ?? null,
        authors: stringArray(row.authors, fallback?.authors),
        year: numberValue(row.year) ?? fallback?.year,
        venue: nullableString(row.venue) ?? fallback?.venue ?? null,
        doi: nullableString(row.doi) ?? fallback?.doi ?? null,
        doi_url: nullableString(row.doi_url) ?? fallback?.doi_url ?? null,
        source_url: nullableString(row.source_url) ?? fallback?.source_url ?? null,
        source_pdf_path: stringValue(row.source_pdf_path) ?? fallback?.source_pdf_path,
        domain_context: nullableString(row.domain_context) ?? fallback?.domain_context ?? null,
        abstract: nullableString(row.abstract) ?? fallback?.abstract ?? null,
        research_problem: stringArray(row.research_problem, fallback?.research_problem),
        research_objective: stringArray(row.research_objective, fallback?.research_objective),
        research_questions: stringArray(row.research_questions, fallback?.research_questions),
        artifact_type: nullableString(row.artifact_type) ?? fallback?.artifact_type ?? null,
        blockchain_dlt_role: nullableString(row.dlt_role) ?? fallback?.blockchain_dlt_role ?? null,
        methodology: nullableString(row.methodology) ?? fallback?.methodology ?? null,
        theoretical_foundations: stringArray(row.theoretical_foundations, fallback?.theoretical_foundations),
        evaluation_method: stringArray(row.evaluation_method, fallback?.evaluation_method),
        key_contributions: stringArray(row.key_contributions, fallback?.key_contributions),
        design_knowledge_output: stringArray(row.design_knowledge_output, fallback?.design_knowledge_output),
        presentation: presentationValue(row.presentation, paperId, fallback?.presentation),
        graph_source_reference: graphSourceReferenceValue(paperMetadata?.graph_source_reference, fallback?.graph_source_reference),
        source_views: sourceViewsValue(paperMetadata?.source_views, fallback?.source_views),
        limitations: stringArray(row.limitations, fallback?.limitations),
        notes: nullableString(row.notes) ?? fallback?.notes ?? null,
        extraction_status: extractionStatus(row.extraction_status, "indexed_from_canonical_okf"),
        review_status: resolvedReviewStatus,
        author_check_status: resolvedAuthorCheckStatus,
        reviewed_by: nullableString(row.reviewed_by),
        reviewed_at: nullableString(row.reviewed_at),
        last_indexed_at: nullableString(row.last_indexed_at) ?? fallback?.last_indexed_at ?? null,
        source_file: "supabase:okf_papers",
        body_text: fallback?.body_text
      };
    });
    if (!papers.length) {
      lastKbLoadMetadata = {
        db_loaded_from: "local_okf_fallback",
        key_type: "service_role",
        row_count: 0,
        warning: "The service-role REST read succeeded but returned zero OKF papers.",
        db_error_code: "NO_ROWS",
        db_error_message: "Supabase returned no OKF papers for the service-role read."
      };
      return null;
    }

    const paperIds = new Set(papers.map((paper) => paper.paper_id));
    const paperReviewStatusById = new Map(papers.map((paper) => [paper.paper_id, paper.review_status]));
    const concepts: OkfKnowledgeBase["concepts"] = conceptsResult.rows.flatMap((row) => {
      const type = canonicalConceptType(String(row.type ?? ""));
      const paperId = String(row.paper_id ?? "");
      if (!type || !paperIds.has(paperId)) return [];
      const conceptId = String(row.concept_id);
      const fallback = localConcepts.get(conceptId);
      return [{
        concept_id: conceptId,
        paper_id: paperId,
        type,
        dsr_layer: type,
        title: normalizeCanonicalText(String(row.title ?? fallback?.title ?? "")),
        description: normalizeCanonicalText(String(row.description ?? fallback?.description ?? "")),
        body_text: String(row.body_text ?? fallback?.body_text ?? ""),
        evidence_ids: stringArray(row.evidence, fallback?.evidence_ids),
        tags: stringArray(row.tags, fallback?.tags),
        confidence: confidenceLabel(String(row.confidence ?? fallback?.confidence ?? "low")),
        extraction_type: extractionType(row.extraction_type, fallback?.extraction_type),
        review_status: safeConceptReviewStatus(row.review_status, row.reviewed_by, row.reviewed_at, paperReviewStatusById.get(paperId)),
        source_file: "supabase:okf_concepts",
        okf_path: stringValue(row.okf_path) ?? fallback?.okf_path
      }];
    });
    const conceptIds = new Set(concepts.map((concept) => concept.concept_id));

    const evidence_items: OkfKnowledgeBase["evidence_items"] = evidenceResult.rows.flatMap((row) => {
      const evidenceId = String(row.evidence_id);
      const fallback = localEvidence.get(evidenceId);
      const paperId = String(row.paper_id ?? fallback?.paper_id ?? "");
      const supports = stringArray(row.supports, fallback?.supports)
        .concat(stringValue(row.concept_id) ?? [])
        .filter((id, index, values) => (id === paperId || conceptIds.has(id)) && values.indexOf(id) === index);
      if (!paperIds.has(paperId)) return [];
      const quote = nullableString(row.quote) ?? fallback?.quote;
      const kind = evidenceType(row.evidence_type, quote, fallback?.evidence_type);
      const sourceText = String(row.paraphrase ?? row.quote_or_summary ?? fallback?.paraphrase ?? quote ?? "");
      const paraphrase = kind === "quote" ? sourceText : normalizeCanonicalText(sourceText);
      return [{
        evidence_id: evidenceId,
        paper_id: paperId,
        concept_id: supports.find((id) => conceptIds.has(id)),
        supports,
        page_number: numberValue(row.page_number) ?? fallback?.page_number,
        section: normalizeOptionalCanonicalText(stringValue(row.section) ?? fallback?.section),
        quote: quote || undefined,
        paraphrase,
        evidence_type: kind,
        confidence: confidenceLabel(String(row.confidence ?? fallback?.confidence ?? "low")),
        source_location: normalizeOptionalSourceLocation(stringValue(row.source_location) ?? fallback?.source_location),
        source_file: "supabase:okf_evidence_items"
      }];
    });
    const evidenceIds = new Set(evidence_items.map((item) => item.evidence_id));

    const relations: OkfKnowledgeBase["relations"] = relationsResult.rows.flatMap((row) => {
      const source = String(row.source_concept_id ?? "");
      const target = String(row.target_concept_id ?? "");
      const predicate = String(row.predicate ?? "");
      if (!conceptIds.has(source) || !conceptIds.has(target) || !canonicalRelationPredicate(predicate)) return [];
      const relationId = String(row.relation_id);
      const fallback = localRelations.get(relationId);
      const evidenceId = stringArray(row.evidence, fallback?.evidence_id ? [fallback.evidence_id] : undefined)
        .concat(stringValue(row.evidence_id) ?? [])
        .find((id) => evidenceIds.has(id));
      return [{
        relation_id: relationId,
        source_concept_id: source,
        predicate,
        target_concept_id: target,
        evidence_id: evidenceId,
        confidence: confidenceLabel(String(row.confidence ?? fallback?.confidence ?? "low")),
        extraction_type: extractionType(row.extraction_type, fallback?.extraction_type),
        relation_scope: relationScope(row.relation_scope, fallback?.relation_scope),
        source_file: "supabase:okf_relations"
      }];
    });

    const usedLegacySchema = [papersResult, conceptsResult, evidenceResult, relationsResult].some((result) => result.usedLegacy);
    lastKbLoadMetadata = {
      db_loaded_from: "supabase",
      key_type: "service_role",
      row_count: papers.length,
      warning: usedLegacySchema
        ? "Supabase served the legacy OKF column projection; rich canonical metadata was completed from local OKF files. Apply the OKF DSR v1 migration."
        : undefined
    };
    return { papers, concepts, evidence_items, relations, warnings: [] };
  } catch (error) {
    const db_error_code = supabaseErrorCode(error);
    const db_error_message = db_error_code === "PGRST303" ? supabaseClockSkewMessage() : supabaseErrorMessage(error);
    lastKbLoadMetadata = {
      db_loaded_from: "local_okf_fallback",
      key_type: "service_role",
      row_count: 0,
      db_error_code,
      db_error_message
    };
    console.warn("Unable to load OKF knowledge base from Supabase; falling back to local OKF files.", error);
    return null;
  }
}
export async function getOkfDatabaseHealthStatus(options: OkfSupabaseLoadOptions = {}) {
  const kb = await loadOkfKnowledgeBaseFromSupabase(options);
  const metadata = getOkfKnowledgeBaseLoadMetadata();
  if (!kb) {
    const message = metadata.db_error_code === "PGRST303"
      ? supabaseClockSkewMessage()
      : metadata.db_error_message ?? "Supabase OKF knowledge base unavailable or not configured.";
    return { ok: false as const, connected: false as const, ...metadata, message };
  }
  return {
    ok: true as const,
    connected: true as const,
    ...metadata,
    db_loaded_from: "supabase" as const,
    key_type: "service_role" as const,
    row_count: kb.papers.length,
    papers: kb.papers.length,
    concepts: kb.concepts.length,
    evidence_items: kb.evidence_items.length,
    relations: kb.relations.length
  };
}

type OkfSelectProjection = {
  rows: Record<string, unknown>[];
  usedLegacy: boolean;
};

async function selectOkfRowsWithLegacyFallback(
  credential: SupabaseServerCredential,
  fetchImpl: typeof fetch,
  table: string,
  richSelect: string,
  legacySelect: string
): Promise<OkfSelectProjection> {
  try {
    return { rows: await selectOkfRows(credential, fetchImpl, table, richSelect), usedLegacy: false };
  } catch (error) {
    if (!isSchemaCompatibilityError(error)) throw error;
    return { rows: await selectOkfRows(credential, fetchImpl, table, legacySelect), usedLegacy: true };
  }
}

function isSchemaCompatibilityError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const record = error as { code?: unknown; message?: unknown; details?: unknown };
  const code = String(record.code ?? "");
  const text = [record.message, record.details].filter(Boolean).join(" ");
  return code === "PGRST204" || /column|schema cache|does not exist/i.test(text);
}

function canonicalConceptType(value: string): OkfConceptType | undefined {
  const mappings: Record<string, OkfConceptType> = {
    Problem: "Problem",
    DesignRequirement: "Design Requirement",
    "Design Requirement": "Design Requirement",
    DesignPrinciple: "Design Principle",
    "Design Principle": "Design Principle",
    DesignFeature: "Design Feature",
    "Design Feature": "Design Feature",
    Artifact: "Artifact",
    Evaluation: "Evaluation",
    OutputKnowledge: "Output Knowledge",
    "Output Knowledge": "Output Knowledge"
  };
  return mappings[value];
}

function canonicalRelationPredicate(value: string): value is OkfRelationPredicate {
  return (okfRelationPredicates as readonly string[]).includes(value);
}

function stringArray(value: unknown, fallback: readonly string[] | undefined = []): string[] {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value.trim()];
  return [...(fallback ?? [])];
}

function normalizeOptionalCanonicalText(value: string | undefined) {
  return value ? normalizeCanonicalText(value) : undefined;
}

function normalizeOptionalSourceLocation(value: string | undefined) {
  return value ? normalizeSourceLocation(value) : undefined;
}

function nullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized || null;
}
function presentationValue(
  value: unknown,
  paperId: string,
  fallback: OkfPresentation | undefined
): OkfPresentation | undefined {
  const parsed = typeof value === "string" ? parseJsonRecord(value) : value;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return fallback;
  const record = parsed as Record<string, unknown>;
  if (record.presentation_version !== OKF_PRESENTATION_VERSION || record.paper_id !== paperId) return fallback;
  const card = objectValue(record.card);
  const overview = objectValue(record.overview);
  const grid = objectValue(record.dsr_summary_grid);
  const additional = objectValue(record.additional_context);
  const provenance = objectValue(record.provenance);
  if (!card || !overview || !grid || !additional || !provenance) return fallback;
  if (typeof card.domain_label !== "string" || typeof overview.research_problem !== "string") return fallback;
  if (typeof grid.problem !== "string" || typeof grid.input_knowledge !== "string"
    || typeof grid.research_process !== "string" || !Array.isArray(grid.key_concepts)
    || typeof grid.solution !== "string" || typeof grid.output_knowledge !== "string") return fallback;
  return record as OkfPresentation;
}

function objectValue(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function parseJsonValue(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function parseJsonRecord(value: string): Record<string, unknown> | undefined {
  return objectValue(parseJsonValue(value));
}

function graphSourceReferenceValue(
  value: unknown,
  fallback: OkfGraphSourceReference | undefined
): OkfGraphSourceReference | undefined {
  const record = typeof value === "string" ? parseJsonRecord(value) : objectValue(value);
  if (!record) return fallback;
  const type = String(record.type ?? "");
  const validationStatus = String(record.validation_status ?? "");
  if (!(okfGraphSourceReferenceTypes as readonly string[]).includes(type)
    || !(okfGraphValidationStatuses as readonly string[]).includes(validationStatus)) return fallback;
  const label = nullableString(record.label);
  const page = record.page === null ? null : numberValue(record.page) ?? null;
  const caption = nullableString(record.caption);
  const validationNotes = nullableString(record.validation_notes);
  return {
    type: type as OkfGraphSourceReference["type"],
    label,
    page,
    caption,
    validation_status: validationStatus as OkfGraphSourceReference["validation_status"],
    validation_notes: validationNotes
  };
}

export function sourceViewsValue(
  value: unknown,
  fallback: OkfSourceView[] | undefined
): OkfSourceView[] | undefined {
  if (value === undefined || value === null) return fallback;
  const parsedValue = typeof value === "string" ? parseJsonValue(value) : value;
  if (!Array.isArray(parsedValue)) return fallback;
  const warnings: Array<{ file: string; message: string }> = [];
  const parsed = parseOkfSourceViews(parsedValue, "supabase:okf_papers.paper_metadata.source_views", warnings);
  return warnings.length ? fallback : parsed;
}

function jsonObjectValue(value: unknown): Record<string, unknown> | undefined {
  if (typeof value === "string") return parseJsonRecord(value);
  return objectValue(value);
}


function stringValue(value: unknown): string | undefined {
  return nullableString(value) ?? undefined;
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}

function safeReviewStatus(status: unknown, reviewedBy: unknown, reviewedAt: unknown, authorCheckStatusValue: unknown) {
  const normalized = String(status ?? "");
  const hasReviewRecord = Boolean(nullableString(reviewedBy) && nullableString(reviewedAt));
  if (hasReviewRecord && normalized === "author_verified" && authorCheckStatusValue === "verified") return "author_verified" as const;
  if (hasReviewRecord && normalized === "internally_reviewed") return "internally_reviewed" as const;
  return "unreviewed" as const;
}

function safeConceptReviewStatus(
  status: unknown,
  reviewedBy: unknown,
  reviewedAt: unknown,
  paperReviewStatus: unknown
) {
  const normalized = String(status ?? "");
  const hasReviewRecord = Boolean(nullableString(reviewedBy) && nullableString(reviewedAt));
  if (!hasReviewRecord) return "unreviewed" as const;
  if (normalized === "author_verified" && paperReviewStatus === "author_verified") return "author_verified" as const;
  if (normalized === "internally_reviewed" && (paperReviewStatus === "internally_reviewed" || paperReviewStatus === "author_verified")) return "internally_reviewed" as const;
  return "unreviewed" as const;
}

function extractionStatus(value: unknown, fallback: unknown): OkfExtractionStatus {
  const normalized = String(value ?? fallback ?? "");
  return normalized === "indexed_from_canonical_okf"
    ? "indexed_from_canonical_okf" as const
    : "okf_draft" as const;
}

function authorCheckStatus(value: unknown, fallback: unknown): OkfAuthorCheckStatus {
  const normalized = String(value ?? fallback ?? "");
  if (normalized === "requested" || normalized === "verified" || normalized === "disputed") return normalized as OkfAuthorCheckStatus;
  return "not_requested" as const;
}

function extractionType(value: unknown, fallback: unknown): OkfExtractionType {
  const normalized = String(value ?? fallback ?? "");
  if (normalized === "explicit" || normalized === "explicit-in-artifact") return normalized as OkfExtractionType;
  return "inferred" as const;
}

function evidenceType(value: unknown, quote: string | undefined, fallback: unknown): OkfEvidenceType {
  const normalized = String(value ?? fallback ?? "");
  if (normalized === "quote" || normalized === "paraphrase" || normalized === "summary") return normalized as OkfEvidenceType;
  return quote ? "quote" as const : "summary" as const;
}

function relationScope(value: unknown, fallback: unknown): OkfRelationScope {
  const normalized = String(value ?? fallback ?? "");
  if (normalized === "cross_paper" || normalized === "query_generated") return normalized as OkfRelationScope;
  return "paper_level" as const;
}
async function selectOkfRows(
  credential: SupabaseServerCredential,
  fetchImpl: typeof fetch,
  table: string,
  select: string
): Promise<Record<string, unknown>[]> {
  if (!credential.url || !credential.service_role_key) {
    throw new Error("Supabase service-role REST configuration is incomplete.");
  }
  const endpoint = new URL(`/rest/v1/${table}`, credential.url);
  endpoint.searchParams.set("select", select);
  const response = await fetchImpl(endpoint, {
    method: "GET",
    credentials: "omit",
    cache: "no-store",
    headers: serviceRoleRestHeaders(credential.service_role_key)
  });
  const payload = await response.json().catch(() => undefined);
  if (!response.ok) throw supabaseRestError(payload, response.status);
  if (!Array.isArray(payload)) throw new Error(`Supabase ${table} response was not an array.`);
  return payload as Record<string, unknown>[];
}

function supabaseRestError(payload: unknown, status: number) {
  const record = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
  const message = String(record.message ?? record.details ?? `Supabase OKF REST request failed with HTTP ${status}.`);
  const error = new Error(message) as Error & { code?: string; details?: string; status?: number };
  if (record.code) error.code = String(record.code);
  if (record.details) error.details = String(record.details);
  error.status = status;
  return error;
}

function supabaseErrorCode(error: unknown) {
  if (!error || typeof error !== "object") return undefined;
  const record = error as { code?: unknown; details?: unknown; message?: unknown };
  if (record.code) return String(record.code);
  const text = [record.message, record.details].filter(Boolean).join(" ");
  return text.includes("PGRST303") ? "PGRST303" : undefined;
}

function supabaseErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (error && typeof error === "object") {
    const record = error as { message?: unknown; details?: unknown };
    return String(record.message ?? record.details ?? "Supabase OKF knowledge base unavailable.");
  }
  return "Supabase OKF knowledge base unavailable.";
}

export function supabaseClockSkewMessage() {
  return "Supabase rejected JWT: local system clock may be out of sync.";
}
export function getRelevantPapers(query: string, kb = getOkfKnowledgeBase()) {
  const terms = tokenize(query);
  return kb.papers
    .map((paper) => {
      const concepts = kb.concepts.filter((concept) => concept.paper_id === paper.paper_id);
      const haystack = [paper.title, paper.body_text, ...concepts.flatMap((concept) => [concept.title, concept.description, concept.body_text, concept.tags.join(" ")])].join(" ").toLowerCase();
      return { paper, score: scoreText(haystack, terms) };
    })
    .filter((item) => item.score > 0 || terms.length === 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.paper);
}

export function getConceptsByType(types: OkfConceptType[], filters: ConceptFilters = {}, kb = getOkfKnowledgeBase()) {
  const terms = tokenize(filters.query ?? "");
  return kb.concepts
    .filter((concept) => types.includes(concept.type))
    .filter((concept) => !filters.paper_id || concept.paper_id === filters.paper_id)
    .filter((concept) => !filters.review_status || concept.review_status === filters.review_status)
    .filter((concept) => !filters.tags?.length || filters.tags.some((tag) => concept.tags.includes(tag)))
    .map((concept) => ({ concept, score: scoreConcept(concept, terms) }))
    .filter((item) => terms.length === 0 || item.score > 0)
    .sort((a, b) => b.score - a.score || confidenceRank(b.concept.confidence) - confidenceRank(a.concept.confidence))
    .map((item) => item.concept);
}

export function getConceptsByPaper(paper_id: string, kb = getOkfKnowledgeBase()) {
  return kb.concepts.filter((concept) => concept.paper_id === paper_id);
}

export function getEvidenceForConcept(concept_id: string, kb = getOkfKnowledgeBase()) {
  return kb.evidence_items.filter((item) => item.concept_id === concept_id);
}

export function getRelationsForConcept(concept_id: string, kb = getOkfKnowledgeBase()) {
  return kb.relations.filter((relation) => relation.source_concept_id === concept_id || relation.target_concept_id === concept_id);
}

export function traverseDsrPath(startConcepts: OkfConcept[], allowedPredicates: OkfRelationPredicate[], kb = getOkfKnowledgeBase()) {
  const visited = new Set(startConcepts.map((concept) => concept.concept_id));
  const queue = [...startConcepts.map((concept) => concept.concept_id)];
  const relations: OkfRelation[] = [];
  while (queue.length && visited.size < 60) {
    const id = queue.shift()!;
    for (const relation of kb.relations) {
      if (relation.source_concept_id !== id || !allowedPredicates.includes(relation.predicate)) continue;
      relations.push(relation);
      if (!visited.has(relation.target_concept_id)) {
        visited.add(relation.target_concept_id);
        queue.push(relation.target_concept_id);
      }
    }
  }
  return {
    concepts: kb.concepts.filter((concept) => visited.has(concept.concept_id)),
    relations
  };
}

export function buildQuerySpecificFlow(query: string, selectedConcepts: OkfConcept[], kb = getOkfKnowledgeBase()) {
  return buildOkfFlow(query, selectedConcepts, kb);
}

export function retrieveForDesignQuery(query: string, kb = getOkfKnowledgeBase(), paperId?: string) {
  const requirementMatches = getConceptsByType(["Design Requirement", "Problem"], { query, paper_id: paperId }, kb).slice(0, 8);
  const paperMatches = paperId ? kb.papers.filter((paper) => paper.paper_id === paperId) : getRelevantPapers(query, kb).slice(0, 4);
  const paperIds = new Set(paperMatches.map((paper) => paper.paper_id));
  const seed = requirementMatches.length ? requirementMatches : kb.concepts.filter((concept) => paperIds.has(concept.paper_id) && ["Design Requirement", "Design Principle", "Design Feature", "Artifact"].includes(concept.type)).slice(0, 12);
  const traversed = traverseDsrPath(seed, ["motivates", "requires", "addressed_by", "satisfies", "instantiates", "instantiated_by", "implements", "evaluated_by", "supported_by", "supports", "derived_from", "contributes_to"], kb);
  const concepts = uniqueConcepts([...seed, ...traversed.concepts]).slice(0, 24);
  const conceptIds = new Set(concepts.map((concept) => concept.concept_id));
  const relations = kb.relations.filter((relation) => conceptIds.has(relation.source_concept_id) && conceptIds.has(relation.target_concept_id));
  const evidence = kb.evidence_items.filter((item) => item.concept_id && conceptIds.has(item.concept_id));
  return { papers: paperMatches, concepts, relations, evidence };
}

export function tokenize(value: string) {
  return value.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2 && !["the", "and", "for", "with", "that", "what", "which", "use", "from", "prior", "paper", "papers"].includes(term));
}

function scoreConcept(concept: OkfConcept, terms: string[]) {
  const metadata = [concept.title, concept.type, concept.dsr_layer, concept.tags.join(" ")].join(" ").toLowerCase();
  const body = [concept.description, concept.body_text].join(" ").toLowerCase();
  return scoreText(metadata, terms) * 3 + scoreText(body, terms);
}

function scoreText(text: string, terms: string[]) {
  if (!terms.length) return 1;
  return terms.reduce((sum, term) => sum + (text.includes(term) ? 1 : 0), 0);
}

function uniqueConcepts(concepts: OkfConcept[]) {
  const seen = new Set<string>();
  return concepts.filter((concept) => {
    if (seen.has(concept.concept_id)) return false;
    seen.add(concept.concept_id);
    return true;
  });
}

function confidenceRank(value: string) {
  return value === "high" ? 3 : value === "medium" ? 2 : 1;
}







function confidenceLabel(value: string): ConfidenceLabel {
  if (value === "high" || value === "medium-high" || value === "medium" || value === "low") return value;
  return "low";
}








