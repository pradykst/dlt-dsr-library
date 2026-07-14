import { parseOkfLibrary } from "./parser.ts";
import { buildOkfFlow } from "./flow.ts";
import { resolveSupabaseServerCredential, serviceRoleRestHeaders, type SupabaseServerCredential } from "../supabase/server.ts";
import type { ConfidenceLabel, OkfConcept, OkfConceptType, OkfKnowledgeBase, OkfRelation, OkfRelationPredicate } from "./schema.ts";

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
    const papersResult = await selectOkfRows(credential, fetchImpl, "okf_papers", "paper_id,title,authors,year,source_pdf_path,review_status");
    const conceptsResult = await selectOkfRows(credential, fetchImpl, "okf_concepts", "concept_id,paper_id,okf_path,type,dsr_layer,title,description,body_text,tags,confidence,extraction_type,review_status");
    const evidenceResult = await selectOkfRows(credential, fetchImpl, "okf_evidence_items", "evidence_id,paper_id,concept_id,page_number,section,quote,paraphrase,source_location,confidence");
    const relationsResult = await selectOkfRows(credential, fetchImpl, "okf_relations", "relation_id,source_concept_id,predicate,target_concept_id,evidence_id,confidence,relation_scope");
    const papers = papersResult.map((paper) => ({ paper_id: String(paper.paper_id), title: String(paper.title), authors: Array.isArray(paper.authors) ? paper.authors.map(String) : undefined, year: typeof paper.year === "number" ? paper.year : undefined, source_pdf_path: paper.source_pdf_path ? String(paper.source_pdf_path) : undefined, review_status: paper.review_status === "reviewed" ? "reviewed" as const : "draft" as const, source_file: "supabase:okf_papers" }));
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
    const concepts = conceptsResult.map((concept) => ({ concept_id: String(concept.concept_id), paper_id: String(concept.paper_id), type: String(concept.type) as OkfConceptType, dsr_layer: String(concept.dsr_layer ?? ""), title: String(concept.title), description: String(concept.description ?? ""), body_text: String(concept.body_text ?? ""), tags: Array.isArray(concept.tags) ? concept.tags.map(String) : [], confidence: confidenceLabel(String(concept.confidence ?? "low")), extraction_type: concept.extraction_type === "explicit-in-artifact" ? "explicit-in-artifact" as const : concept.extraction_type === "explicit" ? "explicit" as const : "inferred" as const, review_status: concept.review_status === "reviewed" ? "reviewed" as const : "draft" as const, source_file: "supabase:okf_concepts", okf_path: concept.okf_path ? String(concept.okf_path) : undefined }));
    const evidence_items = evidenceResult.map((item) => ({ evidence_id: String(item.evidence_id), paper_id: String(item.paper_id), concept_id: item.concept_id ? String(item.concept_id) : undefined, page_number: typeof item.page_number === "number" ? item.page_number : undefined, section: item.section ? String(item.section) : undefined, quote: item.quote ? String(item.quote) : undefined, paraphrase: String(item.paraphrase ?? ""), source_location: item.source_location ? String(item.source_location) : undefined, confidence: confidenceLabel(String(item.confidence ?? "low")), source_file: "supabase:okf_evidence_items" }));
    const relations = relationsResult.map((relation) => ({ relation_id: String(relation.relation_id), source_concept_id: String(relation.source_concept_id), predicate: String(relation.predicate) as OkfRelationPredicate, target_concept_id: String(relation.target_concept_id), evidence_id: relation.evidence_id ? String(relation.evidence_id) : undefined, confidence: confidenceLabel(String(relation.confidence ?? "low")), relation_scope: relation.relation_scope === "cross_paper" ? "cross_paper" as const : relation.relation_scope === "query_generated" ? "query_generated" as const : "paper_level" as const, source_file: "supabase:okf_relations" }));
    lastKbLoadMetadata = {
      db_loaded_from: "supabase",
      key_type: "service_role",
      row_count: papers.length
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
  const requirementMatches = getConceptsByType(["DesignRequirement", "Problem"], { query, paper_id: paperId }, kb).slice(0, 8);
  const paperMatches = paperId ? kb.papers.filter((paper) => paper.paper_id === paperId) : getRelevantPapers(query, kb).slice(0, 4);
  const paperIds = new Set(paperMatches.map((paper) => paper.paper_id));
  const seed = requirementMatches.length ? requirementMatches : kb.concepts.filter((concept) => paperIds.has(concept.paper_id) && ["DesignRequirement", "DesignPrinciple", "DesignFeature", "Artifact"].includes(concept.type)).slice(0, 12);
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








