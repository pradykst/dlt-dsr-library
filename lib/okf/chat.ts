import { buildOkfFlow } from "./flow.ts";
import { getAvailableSourceViews, resolveFlowView, type CanonicalFlowBundle, type ProjectedFlow } from "./flow-projection.ts";
import { getOkfKnowledgeBase } from "./retrieval.ts";
import type { ConfidenceLabel, DesignMove, OkfAnswerPayload, OkfChatIntent, OkfConcept, OkfConceptType, OkfEvidenceItem, OkfFlow, OkfKnowledgeBase, OkfPaper, OkfReuseFlowRow, LlmSynthesisResult, OkfRuntimeMetadata, OkfTaskType } from "./schema.ts";
import { loadRecommendedStoredFlowPaths } from "./stored-flow.ts";
import { validateChatResponse } from "./validator.ts";
import { buildAuthoritativeReuseAnswerPlan, buildReuseFlowResponse } from "./reuse.ts";
import { buildDeterministicQueryPlan, detectRequestedContextFields, detectRequestedFlowView, planOkfQuery, type PaperContextField, type QueryPlan, type RequestedFlowView } from "./query-planner.ts";
import { detectDeterministicIntent } from "./query-interpreter.ts";
import { validateAuthoritativeReuseAnswerPlan } from "./answer-plan-validator.ts";
export { selectSourcePapers } from "./reuse.ts";
import { expandPolicyTerms, extractQueryCriteria, normalizeText, paperContribution, paperRoleLabel, paperRoleReason, selectPolicySourcePapers, tokenizePolicy, unique, type PolicyThemeId, type QueryCriteria } from "./policy.ts";

export type OkfRecommendationCard = { title: string; concept_id?: string; evidence_ids: string[]; confidence: string; paper_id?: string };
export type OkfSourcePaper = { paper_id: string; title: string; role: string; reason: string; requirements_count: number; principles_count: number; features_count: number; evidence_count: number; score?: number; match_strength?: "strong" | "partial" | "weak" };
export type LibraryStatsAnswer = { intent: "LIBRARY_STATS_QUERY"; direct_answer: string; counts: { papers: number; concepts_total: number; by_type: Record<string, number>; relations: number; evidence_items: number; by_review_status: Record<string, { papers: number; concepts: number }>; by_paper: Array<{ paper_id: string; title: string; concepts: number; evidence_items: number; relations: number; by_type: Record<string, number> }> }; caveats: string[] };
export type LibraryCoverageAnswer = { intent: "LIBRARY_COVERAGE_QUERY"; direct_answer: string; categories: Array<{ category: string; papers: Array<{ paper_id: string; title: string; reason: string }>; count: number }>; no_match_note?: string };
export type OkfQueryPlan = { intent: OkfChatIntent; task_type: OkfTaskType; output_shape: "Requirement -> Principle -> Feature -> Artifact" | "element_list" | "paper_list" | "evidence" | "comparison" | "lifecycle" | "overview" | "stats" | "library_coverage" | "clarification" | "open"; targetPaper?: OkfPaper; requestedTypes: OkfConceptType[]; isCrossPaper: boolean; domainTerms: string[]; criteria: QueryCriteria; query_plan: QueryPlan };
export type OkfPaperMatch = { paper_id: string; title: string; match_strength: "strong" | "partial" | "weak"; matched_criteria: string[]; matched_element_types: OkfConceptType[]; top_relevant_concepts: string[]; evidence_count: number; short_reason: string };
export type OkfAnswerPlan = { intent: OkfChatIntent; user_query: string; query_plan: QueryPlan; answer_shape: OkfQueryPlan["output_shape"]; selected_papers: Array<{ paper_id: string; title: string; role_for_query: string; reason_for_selection: string; relevance_score: number; matched_criteria: string[]; top_concepts: string[]; top_evidence: string[] }>; required_sections: string[]; extraction_items: Array<{ concept_id: string; paper_id: string; type: OkfConceptType; title: string }>; paper_matches: OkfPaperMatch[]; design_moves: DesignMove[]; flow_rows: OkfReuseFlowRow[]; comparison_rows: Array<{ paper_id: string; title: string; element_type: string; summary: string }>; evidence_pack: Array<{ evidence_id: string; paper_id: string; concept_id?: string; excerpt: string; confidence: ConfidenceLabel }>; constraints: string[]; things_to_avoid: string[]; synthesis_policy: "deterministic" | "llm_optional" | "llm_preferred"; criteria: QueryCriteria };
export type OkfFlowViewMetadata = { requested_mode: RequestedFlowView; resolution: "resolved" | "unavailable" | "ambiguous"; resolved_mode?: ProjectedFlow["mode"]; projection_source?: ProjectedFlow["projection_source"]; source_view_id?: string | null; source_reference?: ProjectedFlow["source_reference"]; available_source_views: Array<{ source_view_id: string; title: string; label: string; page: number; type: string }> };
export type OkfChatResponse = { intent: OkfChatIntent; task_type?: OkfTaskType; answer: string; interpreted_problem?: string; requirements: OkfRecommendationCard[]; principles: OkfRecommendationCard[]; features: OkfRecommendationCard[]; artifact_direction: OkfRecommendationCard[]; source_papers: OkfSourcePaper[]; retrieved_concepts: OkfConcept[]; evidence: { evidence_id: string; paper_id: string; concept_id?: string; paraphrase: string; quote?: string; confidence: string; section?: string; page_number?: number }[]; flow: ReturnType<typeof buildOkfFlow>; flow_graph: ReturnType<typeof buildOkfFlow>; flow_view?: OkfFlowViewMetadata; flow_rows?: OkfReuseFlowRow[]; library_stats?: LibraryStatsAnswer; library_coverage?: LibraryCoverageAnswer; answer_payload?: OkfAnswerPayload; answer_plan?: OkfAnswerPlan; assumptions: string[]; limitations: string[]; warnings: string[]; runtime?: OkfRuntimeMetadata; llm_synthesis?: LlmSynthesisResult };

const knownPolicyThemeIds = new Set<PolicyThemeId>(["integrity", "commercial_privacy", "identity_credentials", "trust_reputation", "auditability_status", "consent_control", "token_incentives", "fair_marketplace", "implementation_lifecycle", "iot_sensor_protection", "forecasting_oracle_payment", "scalability_hybrid_storage", "governance_dispute", "evaluation"]);

function isPolicyThemeId(value: string): value is PolicyThemeId {
  return knownPolicyThemeIds.has(value as PolicyThemeId);
}
const orderedTypes: OkfConceptType[] = ["Problem", "Design Requirement", "Design Principle", "Design Feature", "Artifact", "Evaluation", "Output Knowledge"];

export function routeOkfQuery(query: string, kb: OkfKnowledgeBase = getOkfKnowledgeBase()): OkfChatIntent {
  const extracted = extractQueryCriteria(query, kb);
  const hasNamedPaper = unique([
    ...extracted.namedPaperIds,
    ...resolvePaperIdsFromCanonicalNames(query, kb)
  ]).length > 0;
  if (hasNamedPaper && detectRequestedContextFields(query).length) return "PAPER_ELEMENT_QUERY";
  if (hasNamedPaper && isExplicitStoredFlowViewRequest(query)) return "DSR_FLOW_QUERY";
  if (hasNamedPaper && detectDeterministicIntent(query, kb) === "DSR_FLOW_QUERY") return "DSR_FLOW_QUERY";
  const asksExactElements = extracted.requestedTypes.length > 0
    && /\b(?:show|list|what|which|extract|give me)\b/i.test(query)
    && !/\b(?:reuse|recommend|compare|versus|vs|build|create|design an?|design the)\b/i.test(query);
  if (hasNamedPaper && asksExactElements) return "PAPER_ELEMENT_QUERY";
  return detectDeterministicIntent(query, kb);
}
export function analyzeOkfQuery(query: string, intent: OkfChatIntent = routeOkfQuery(query), kb: OkfKnowledgeBase = getOkfKnowledgeBase(), queryPlan: QueryPlan = buildDeterministicQueryPlan(query, intent, kb)): OkfQueryPlan {
  const extracted = extractQueryCriteria(query, kb);
  const plannedPaperIds = queryPlan.named_papers.filter((paperId) => kb.papers.some((paper) => paper.paper_id === paperId));
  const namedPaperIds = unique([...plannedPaperIds, ...extracted.namedPaperIds, ...resolvePaperIdsFromCanonicalNames(query, kb)]);
  const targetPaper = namedPaperIds[0] ? kb.papers.find((paper) => paper.paper_id === namedPaperIds[0]) : undefined;
  const plannedTypes = queryPlan.requested_element_types.filter((type): type is OkfConceptType => orderedTypes.includes(type as OkfConceptType));
  const requestedTypes = queryPlan.requested_context_fields.length ? [] : plannedTypes.length ? plannedTypes : extracted.requestedTypes.length ? extracted.requestedTypes : defaultRequestedTypes(intent);
  const criteria: QueryCriteria = {
    ...extracted,
    themes: unique([...extracted.themes, ...queryPlan.themes.filter(isPolicyThemeId)]),
    requestedTypes,
    namedPaperIds,
    mustHaveTerms: unique([...queryPlan.must_have_criteria, ...extracted.mustHaveTerms]).slice(0, 12),
    optionalTerms: unique([...queryPlan.optional_criteria, ...extracted.optionalTerms]).slice(0, 18)
  };
  const task_type = taskTypeForIntent(intent);
  const resolvedQueryPlan = namedPaperIds.length === queryPlan.named_papers.length
    ? queryPlan
    : { ...queryPlan, named_papers: namedPaperIds };
  return { intent, task_type, output_shape: outputShapeForIntent(intent), targetPaper, requestedTypes, isCrossPaper: resolvedQueryPlan.requires_cross_paper || (!targetPaper && ["LIBRARY_COVERAGE_QUERY", "PAPER_DISCOVERY_QUERY", "DESIGN_REUSE_QUERY", "DESIGN_REUSE_FLOW_QUERY", "COMPARISON_QUERY", "EVALUATION_PLANNING_QUERY"].includes(intent)), domainTerms: criteria.mustHaveTerms, criteria, query_plan: resolvedQueryPlan };
}

function resolvePaperIdsFromCanonicalNames(query: string, kb: OkfKnowledgeBase) {
  const normalizedQuery = normalizeText(query);
  return kb.papers.flatMap((paper) => {
    const titlePrefix = paper.title.includes(":") ? paper.title.split(":")[0] : undefined;
    const candidates = unique([
      paper.paper_id,
      paper.slug,
      paper.title,
      paper.short_title,
      titlePrefix
    ].filter((value): value is string => Boolean(value?.trim())).map(normalizeText))
      .filter((value) => value.length >= 5 && value.split(/\s+/).length >= 2);
    return candidates.some((candidate) => normalizedQuery.includes(candidate)) ? [paper.paper_id] : [];
  });
}

export async function answerOkfChat(query: string, kb: OkfKnowledgeBase = getOkfKnowledgeBase()): Promise<OkfChatResponse> {
  const deterministicIntent = routeOkfQuery(query, kb);
  const queryPlan = await planOkfQuery(query, deterministicIntent, kb);
  const plan = analyzeOkfQuery(query, queryPlan.intent, kb, queryPlan);
  const answerPlan = buildAnswerPlan(query, plan, kb);
  const authoritativeValidation = validateAuthoritativeReuseAnswerPlan(answerPlan);
  if (!authoritativeValidation.valid) return invalidReuseAnswerPlanResponse(query, plan, answerPlan, authoritativeValidation.errors);
  const response = attachAnswerPlan(buildDeterministicResponse(query, plan, answerPlan, kb), answerPlan, kb);
  const validation = validateChatResponse(response, kb);
  const answerPlanValidation = validateAnswerPlanResponse(response, kb);
  return { ...response, warnings: [...response.warnings, ...validation.warnings, ...answerPlanValidation] };
}

function invalidReuseAnswerPlanResponse(query: string, plan: OkfQueryPlan, answerPlan: OkfAnswerPlan, errors: string[]): OkfChatResponse {
  const safePlan: OkfAnswerPlan = {
    ...answerPlan,
    selected_papers: [],
    paper_matches: [],
    extraction_items: [],
    design_moves: [],
    flow_rows: [],
    evidence_pack: [],
    synthesis_policy: "deterministic"
  };
  const answer = [
    "# Recommendation",
    "I could not construct a valid 5-7-move, evidence-consistent reuse plan from the selected OKF material, so no architecture recommendation was emitted.",
    "## Design moves to reuse",
    "No canonical move set passed server-side plan validation.",
    "## Suggested architecture direction",
    "- Refine the design scope or add stronger OKF coverage before generating a reuse flow.",
    "## What not to overclaim",
    "- Do not treat a partial or internally inconsistent plan as grounded design guidance."
  ].join("\n\n");
  return baseResponse(plan.intent, answer, [], [], emptyFlow("invalid-reuse-answer-plan"), [], {
    task_type: plan.task_type,
    interpreted_problem: query,
    answer_plan: safePlan,
    limitations: ["The server rejected the candidate AnswerPlan before rendering or LLM synthesis."],
    warnings: [`Authoritative AnswerPlan validation failed with ${errors.length} invariant violation(s).`, ...errors]
  });
}

function buildDeterministicResponse(query: string, plan: OkfQueryPlan, answerPlan: OkfAnswerPlan, kb: OkfKnowledgeBase): OkfChatResponse {
  if (plan.intent === "LIBRARY_STATS_QUERY") return libraryStatsResponse(query, plan, answerPlan, kb);
  if (plan.intent === "LIBRARY_COVERAGE_QUERY") return libraryCoverageResponse(query, plan, answerPlan, kb);
  if (plan.intent === "LIBRARY_OVERVIEW_QUERY") return libraryOverviewResponse(query, plan, answerPlan, kb);
  if (plan.intent === "PAPER_ELEMENT_QUERY") return paperElementResponse(query, plan, answerPlan, kb);
  if (plan.intent === "PAPER_DISCOVERY_QUERY") return paperDiscoveryResponse(query, plan, answerPlan, kb);
  if (plan.intent === "NEGATIVE_OR_EXISTENCE_QUERY") return negativeResponse(query, plan, answerPlan, kb);
  if (plan.intent === "DSR_FLOW_QUERY") return flowResponse(query, plan, answerPlan, kb);
  if (plan.intent === "EVIDENCE_QUERY") return evidenceResponse(query, plan, answerPlan, kb);
  if (plan.intent === "COMPARISON_QUERY") return comparisonResponse(query, plan, answerPlan, kb);
  if (plan.intent === "IMPLEMENTATION_LIFECYCLE_QUERY") return lifecycleResponse(query, plan, answerPlan, kb);
  if (plan.intent === "EVALUATION_PLANNING_QUERY") return evaluationPlanningResponse(query, plan, answerPlan, kb);
  if (plan.intent === "CLARIFICATION_QUERY") return clarificationResponse(query, plan, answerPlan, kb);
  return designReuseResponse(query, plan, answerPlan, kb);
}

function buildAnswerPlan(query: string, plan: OkfQueryPlan, kb: OkfKnowledgeBase): OkfAnswerPlan {
  const supports = selectedPaperSupports(query, plan, kb);
  const selectedPaperIds = supports.map((paper) => paper.paper_id);
  const concepts = conceptsForPlan(query, plan, selectedPaperIds, kb);
  const evidence = evidenceForConcepts(concepts, kb);
  const topSupportScore = Math.max(0, ...supports.map((support) => support.score ?? 0));
  const paperMatches = supports.map((support) => paperMatchForSupport(support, query, plan, kb, topSupportScore));
  const selected_papers = supports.map((support) => {
    const paperConcepts = concepts.filter((concept) => concept.paper_id === support.paper_id);
    const paperEvidence = evidence.filter((item) => item.paper_id === support.paper_id);
    return { paper_id: support.paper_id, title: support.title, role_for_query: paperRoleLabel(support.paper_id, support.title, kb, query), reason_for_selection: support.reason, relevance_score: support.score ?? 0, matched_criteria: paperMatches.find((match) => match.paper_id === support.paper_id)?.matched_criteria ?? [], top_concepts: paperConcepts.slice(0, 8).map((concept) => concept.title), top_evidence: paperEvidence.slice(0, 5).map((item) => item.paraphrase) };
  });
  const answerPlan: OkfAnswerPlan = {
    intent: plan.intent,
    user_query: query,
    query_plan: plan.query_plan,
    answer_shape: plan.output_shape,
    selected_papers,
    required_sections: requiredSectionsForIntent(plan.intent),
    extraction_items: concepts.map((concept) => ({ concept_id: concept.concept_id, paper_id: concept.paper_id, type: concept.type, title: concept.title })),
    paper_matches: paperMatches,
    design_moves: [],
    flow_rows: [],
    comparison_rows: [],
    evidence_pack: evidence.map((item) => ({ evidence_id: item.evidence_id, paper_id: item.paper_id, concept_id: item.concept_id, excerpt: item.quote ?? item.paraphrase, confidence: item.confidence })),
    constraints: constraintsForIntent(plan.intent),
    things_to_avoid: thingsToAvoidForIntent(plan.intent),
    synthesis_policy: synthesisPolicyForIntent(plan.intent),
    criteria: plan.criteria
  };
  return buildAuthoritativeReuseAnswerPlan(answerPlan, kb);
}

function selectedPaperSupports(query: string, plan: OkfQueryPlan, kb: OkfKnowledgeBase) {
  if (plan.intent === "LIBRARY_STATS_QUERY") return [];
  if (plan.intent === "LIBRARY_OVERVIEW_QUERY" || plan.intent === "LIBRARY_COVERAGE_QUERY") return kb.papers.map((paper) => ({ paper_id: paper.paper_id, title: paper.title, reason: paperContribution(paper.paper_id, paper.title, kb), score: 100 }));
  if (plan.targetPaper) return [{ paper_id: plan.targetPaper.paper_id, title: plan.targetPaper.title, reason: "Named paper hard filter.", score: 1000 }];
  if (plan.intent === "IMPLEMENTATION_LIFECYCLE_QUERY") return selectPolicySourcePapers(query, kb, 1, plan.criteria);
  if (plan.intent === "NEGATIVE_OR_EXISTENCE_QUERY") return selectPolicySourcePapers(query, kb, 6, plan.criteria);
  if (plan.intent === "EVIDENCE_QUERY") return selectPolicySourcePapers(query, kb, 6, plan.criteria);
  if (plan.intent === "DSR_FLOW_QUERY") return selectPolicySourcePapers(query, kb, 4, plan.criteria);
  if (plan.intent === "PAPER_DISCOVERY_QUERY") return selectPolicySourcePapers(query, kb, 8, plan.criteria);
  if (plan.intent === "EVALUATION_PLANNING_QUERY") return selectPolicySourcePapers(query, kb, 8, plan.criteria);
  if (plan.intent === "COMPARISON_QUERY") return selectPolicySourcePapers(query, kb, 6, plan.criteria);
  return selectPolicySourcePapers(query, kb, 8, plan.criteria);
}

function conceptsForPlan(query: string, plan: OkfQueryPlan, paperIds: string[], kb: OkfKnowledgeBase) {
  if (plan.intent === "LIBRARY_OVERVIEW_QUERY" || plan.intent === "LIBRARY_STATS_QUERY" || plan.intent === "LIBRARY_COVERAGE_QUERY") return [];
  const paperSet = new Set(paperIds);
  if (plan.intent === "PAPER_ELEMENT_QUERY") return orderConcepts(kb.concepts.filter((concept) => paperSet.has(concept.paper_id) && plan.requestedTypes.includes(concept.type)));
  if (plan.intent === "IMPLEMENTATION_LIFECYCLE_QUERY") return orderConcepts(kb.concepts.filter((concept) => paperSet.has(concept.paper_id) && ["Design Requirement", "Design Principle", "Design Feature", "Artifact", "Evaluation", "Output Knowledge"].includes(concept.type))).slice(0, 80);
  if (plan.intent === "DSR_FLOW_QUERY") return flowConcepts(query, paperIds, kb);
  const terms = expandPolicyTerms(tokenizePolicy(query));
  const scored = kb.concepts
    .filter((concept) => paperSet.has(concept.paper_id) && (!plan.requestedTypes.length || plan.requestedTypes.includes(concept.type) || plan.intent !== "PAPER_DISCOVERY_QUERY"))
    .map((concept) => ({ concept, score: scoreConcept(concept, terms, kb) }))
    .filter((item) => item.score > 0 || plan.intent === "COMPARISON_QUERY" || plan.intent === "EVALUATION_PLANNING_QUERY")
    .sort((a, b) => b.score - a.score || orderedTypes.indexOf(a.concept.type) - orderedTypes.indexOf(b.concept.type));
  const selected: OkfConcept[] = [];
  for (const paperId of paperIds) {
    const paperScored = scored.filter((item) => item.concept.paper_id === paperId);
    const typeLimit = plan.intent === "PAPER_DISCOVERY_QUERY" ? 3 : 4;
    for (const type of selectedTypesForIntent(plan.intent, plan.requestedTypes)) selected.push(...paperScored.filter((item) => item.concept.type === type).slice(0, typeLimit).map((item) => item.concept));
    if (!paperScored.length && plan.intent !== "PAPER_DISCOVERY_QUERY") selected.push(...kb.concepts.filter((concept) => concept.paper_id === paperId && selectedTypesForIntent(plan.intent, plan.requestedTypes).includes(concept.type)).slice(0, 6));
  }
  return orderConcepts(uniqueConcepts(selected.length ? selected : scored.slice(0, 40).map((item) => item.concept))).slice(0, 96);
}

function designReuseResponse(query: string, plan: OkfQueryPlan, answerPlan: OkfAnswerPlan, kb: OkfKnowledgeBase): OkfChatResponse {
  return buildReuseFlowResponse(query, plan, answerPlan, kb);
}

function libraryCoverageResponse(_query: string, plan: OkfQueryPlan, answerPlan: OkfAnswerPlan, kb: OkfKnowledgeBase): OkfChatResponse {
  const coverage = buildLibraryCoverageAnswer(kb);
  const categoryLines = coverage.categories.map((category) => {
    const paperLines = category.papers.length
      ? category.papers.map((paper, index) => `${index + 1}. ${paper.title} - ${paper.reason}`).join("\n")
      : "None in the loaded OKF library.";
    return `${category.category} (${category.count}):\n${paperLines}`;
  });
  const sections = [coverage.direct_answer, "Coverage categories:", ...categoryLines];
  if (coverage.no_match_note) sections.push(coverage.no_match_note);
  return baseResponse(plan.intent, sections.join("\n\n"), [], [], emptyFlow("library-coverage"), sourcePapersForIds(kb.papers.map((paper) => paper.paper_id), [], kb), { task_type: plan.task_type, library_coverage: coverage, answer_plan: answerPlan, assumptions: coverage.no_match_note ? [coverage.no_match_note] : [] });
}

function buildLibraryCoverageAnswer(kb: OkfKnowledgeBase): LibraryCoverageAnswer {
  const categories = [
    "blockchain/DLT-specific artifact/design paper",
    "blockchain/DLT methodological/framework paper",
    "domain-specific blockchain case paper",
    "general DSR/methodology/theory paper",
    "non-blockchain general literature"
  ].map((category) => ({ category, papers: [] as Array<{ paper_id: string; title: string; reason: string }>, count: 0 }));
  const byCategory = new Map(categories.map((category) => [category.category, category]));
  const classifications = kb.papers.map((paper) => classifyPaperCoverage(paper, kb));
  for (const item of classifications) {
    const category = byCategory.get(item.category);
    if (!category) continue;
    category.papers.push({ paper_id: item.paper.paper_id, title: item.paper.title, reason: item.reason });
    category.count = category.papers.length;
  }
  const blockchainRelated = classifications.filter((item) => item.blockchainRelated).length;
  const nonBlockchain = byCategory.get("non-blockchain general literature")?.papers ?? [];
  const methodological = byCategory.get("blockchain/DLT methodological/framework paper")?.papers ?? [];
  const direct_answer = blockchainRelated === kb.papers.length
    ? `Based on the loaded OKF titles, metadata, and extracted concepts, all ${kb.papers.length} paper(s) are blockchain/DLT-related. I do not find a clearly non-blockchain general-literature paper in the current library.`
    : `Based on the loaded OKF titles, metadata, and extracted concepts, ${blockchainRelated} of ${kb.papers.length} paper(s) are blockchain/DLT-related and ${kb.papers.length - blockchainRelated} are not clearly blockchain-specific.`;
  const notes: string[] = [];
  if (!nonBlockchain.length) notes.push("No clearly non-blockchain general literature paper is loaded; do not treat blockchain use-case papers as non-blockchain matches.");
  if (methodological.length) notes.push(`${methodological.map((paper) => paper.title).join("; ")} is methodological/framework-oriented, but it is still blockchain-related rather than non-blockchain literature.`);
  return { intent: "LIBRARY_COVERAGE_QUERY", direct_answer, categories, no_match_note: notes.join(" ") || undefined };
}

function classifyPaperCoverage(paper: OkfPaper, kb: OkfKnowledgeBase) {
  const concepts = kb.concepts.filter((concept) => concept.paper_id === paper.paper_id);
  const text = normalizeText([paper.paper_id, paper.title, paper.body_text, ...concepts.flatMap((concept) => [concept.title, concept.description, concept.body_text, concept.tags.join(" "), concept.type, concept.dsr_layer])].join(" "));
  const blockchainRelated = /blockchain|dlt|distributed ledger|smart contract|token|nft|ssi|self sovereign identity|decentralized identity|did/.test(text);
  const methodological = /framework|methodology|method fragments|isdm|lifecycle|development process|design science|method paper/.test(text);
  const generalTheory = /kernel theory|theory|methodology|framework|evaluation method/.test(text);
  const domainSpecific = /iot|sensor|kyc|health|hie|consent|capacity|marketplace|peer review|reviewer|newsvendor|forecast|commercial|machine tool|nil|nft|product|data sharing|identity/.test(text);
  if (!blockchainRelated && generalTheory) return { paper, category: "general DSR/methodology/theory paper", reason: "General methodological/theory cues without clear blockchain/DLT specificity.", blockchainRelated };
  if (!blockchainRelated) return { paper, category: "non-blockchain general literature", reason: "No clear blockchain/DLT-specific cue in loaded metadata or concepts.", blockchainRelated };
  if (methodological) return { paper, category: "blockchain/DLT methodological/framework paper", reason: "Framework, lifecycle, method-fragment, or methodology-oriented blockchain/DLT contribution.", blockchainRelated };
  if (domainSpecific) return { paper, category: "domain-specific blockchain case paper", reason: "Blockchain/DLT design knowledge tied to a concrete domain or use-case artifact.", blockchainRelated };
  return { paper, category: "blockchain/DLT-specific artifact/design paper", reason: "Blockchain/DLT artifact or design paper without a broader methodology classification.", blockchainRelated };
}
function libraryStatsResponse(query: string, plan: OkfQueryPlan, answerPlan: OkfAnswerPlan, kb: OkfKnowledgeBase): OkfChatResponse {
  const stats = buildLibraryStatsAnswer(query, kb);
  const typeSummary = orderedTypes.map((type) => `${type}: ${stats.counts.by_type[type] ?? 0}`).join("; ");
  const sections = [
    stats.direct_answer,
    `Snapshot: ${stats.counts.papers} paper(s), ${stats.counts.concepts_total} concept(s), ${stats.counts.relations} relation(s), and ${stats.counts.evidence_items} evidence item(s).`,
    `Concepts by type: ${typeSummary}.`
  ];
  if (stats.caveats.length) sections.push(`Caveat: ${stats.caveats.join(" ")}`);
  return baseResponse(plan.intent, sections.join("\n\n"), [], [], emptyFlow("library-stats"), [], { task_type: plan.task_type, library_stats: stats, answer_plan: answerPlan, assumptions: stats.caveats });
}

function buildLibraryStatsAnswer(query: string, kb: OkfKnowledgeBase): LibraryStatsAnswer {
  const q = normalizeText(query);
  const by_type = countBy(kb.concepts, (concept) => concept.type);
  const reviewStatuses = ["unreviewed", "internally_reviewed", "author_verified"] as const;
  const by_review_status = Object.fromEntries(reviewStatuses.map((status) => [
    status,
    {
      papers: kb.papers.filter((paper) => paper.review_status === status).length,
      concepts: kb.concepts.filter((concept) => concept.review_status === status).length
    }
  ])) as Record<string, { papers: number; concepts: number }>;
  const by_paper = kb.papers.map((paper) => {
    const concepts = kb.concepts.filter((concept) => concept.paper_id === paper.paper_id);
    const conceptIds = new Set(concepts.map((concept) => concept.concept_id));
    return { paper_id: paper.paper_id, title: paper.title, concepts: concepts.length, evidence_items: kb.evidence_items.filter((item) => item.paper_id === paper.paper_id).length, relations: kb.relations.filter((relation) => conceptIds.has(relation.source_concept_id) || conceptIds.has(relation.target_concept_id)).length, by_type: countBy(concepts, (concept) => concept.type) };
  });
  const counts = { papers: kb.papers.length, concepts_total: kb.concepts.length, by_type, relations: kb.relations.length, evidence_items: kb.evidence_items.length, by_review_status, by_paper };
  const caveats: string[] = [];
  const researchQuestionMetadata = /\bresearch questions?\b/.test(q);
  const ambiguousQuestions = /\bquestions?\b/.test(q) && !researchQuestionMetadata;
  const requestedType = statsConceptTypeForQuery(q);
  let direct_answer: string;

  if (researchQuestionMetadata || ambiguousQuestions) {
    const recorded = kb.papers.filter((paper) => paper.research_objective.length > 0).length;
    direct_answer = `Research questions are not a canonical DSR concept type in okf-dsr-v1. ${recorded} paper(s) currently record a research objective in paper metadata.`;
    caveats.push("The word questions is ambiguous; research objectives are paper metadata, while DSR concepts use the seven canonical types.");
  } else if (requestedType && /reviewed|unreviewed|draft|verified/.test(q)) {
    const concepts = kb.concepts.filter((concept) => concept.type === requestedType);
    const unreviewed = concepts.filter((concept) => concept.review_status === "unreviewed").length;
    const internallyReviewed = concepts.filter((concept) => concept.review_status === "internally_reviewed").length;
    const authorVerified = concepts.filter((concept) => concept.review_status === "author_verified").length;
    direct_answer = `The OKF library currently contains ${concepts.length} ${readableType(requestedType, concepts.length)}: ${unreviewed} unreviewed, ${internallyReviewed} internally reviewed, and ${authorVerified} author verified.`;
  } else if (requestedType) {
    const count = by_type[requestedType] ?? 0;
    direct_answer = `The OKF library currently contains ${count} ${readableType(requestedType, count)}.`;
  } else if (/papers?/.test(q) && /evaluation|evaluations|evaluated|evaluation evidence/.test(q)) {
    const paperIds = new Set(kb.concepts.filter((concept) => concept.type === "Evaluation" && kb.evidence_items.some((item) => item.concept_id === concept.concept_id)).map((concept) => concept.paper_id));
    direct_answer = `${paperIds.size} paper(s) currently have Evaluation concepts with linked evidence in the OKF library.`;
  } else if (/papers?/.test(q) && /reviewed|unreviewed|draft|verified/.test(q)) {
    direct_answer = `The OKF library currently contains ${by_review_status.unreviewed.papers} unreviewed paper(s), ${by_review_status.internally_reviewed.papers} internally reviewed paper(s), and ${by_review_status.author_verified.papers} author-verified paper(s).`;
  } else if (/papers?/.test(q) && /discuss|about|address|include|includes|have|has|with/.test(q)) {
    const terms = statsTopicTerms(query);
    if (terms.length) {
      const matches = kb.papers.filter((paper) => paperMatchesTopic(paper, terms, kb));
      direct_answer = `${matches.length} paper(s) in the OKF library match the topic term(s): ${terms.join(", ")}.`;
    } else {
      direct_answer = `The OKF library currently contains ${kb.papers.length} paper(s).`;
    }
  } else if (/papers?/.test(q)) {
    direct_answer = `The OKF library currently contains ${kb.papers.length} paper(s).`;
  } else if (/evidence/.test(q)) {
    direct_answer = `The OKF library currently contains ${kb.evidence_items.length} evidence item(s).`;
  } else if (/relations?|edges?/.test(q)) {
    direct_answer = `The OKF library currently contains ${kb.relations.length} relation(s).`;
  } else if (/concepts?|elements?/.test(q)) {
    direct_answer = `The OKF library currently contains ${kb.concepts.length} OKF concept(s).`;
  } else {
    direct_answer = `The OKF library currently contains ${kb.papers.length} paper(s), ${kb.concepts.length} concept(s), ${kb.relations.length} relation(s), and ${kb.evidence_items.length} evidence item(s).`;
  }

  return { intent: "LIBRARY_STATS_QUERY", direct_answer, counts, caveats };
}

function statsConceptTypeForQuery(q: string): OkfConceptType | undefined {
  if (/design requirements?|\brequirements?\b/.test(q)) return "Design Requirement";
  if (/design principles?|\bprinciples?\b/.test(q)) return "Design Principle";
  if (/design features?|\bfeatures?\b/.test(q)) return "Design Feature";
  if (/artifacts?|artifact patterns?/.test(q)) return "Artifact";
  if (/evaluations?|evaluation criteria/.test(q) && !/papers?/.test(q)) return "Evaluation";
  if (/output knowledge/.test(q)) return "Output Knowledge";
  return undefined;
}

function statsTopicTerms(query: string) {
  const stop = new Set(["how", "many", "paper", "papers", "okf", "library", "libraries", "discuss", "about", "address", "addresses", "include", "includes", "have", "has", "with", "that", "the", "are", "is", "in", "current", "currently", "loaded"]);
  return tokenizePolicy(query).filter((term) => term.length > 2 && !stop.has(term)).slice(0, 8);
}

function paperMatchesTopic(paper: OkfPaper, terms: string[], kb: OkfKnowledgeBase) {
  const concepts = kb.concepts.filter((concept) => concept.paper_id === paper.paper_id);
  const evidence = kb.evidence_items.filter((item) => item.paper_id === paper.paper_id);
  const text = normalizeText([paper.title, paper.body_text, ...concepts.flatMap((concept) => [concept.title, concept.description, concept.body_text, concept.tags.join(" ")]), ...evidence.flatMap((item) => [item.paraphrase, item.quote ?? "", item.section ?? ""])].join(" "));
  return terms.every((term) => text.includes(normalizeText(term)));
}

function countBy<T>(items: T[], keyFor: (item: T) => string) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = keyFor(item);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}
function libraryOverviewResponse(_query: string, plan: OkfQueryPlan, answerPlan: OkfAnswerPlan, kb: OkfKnowledgeBase): OkfChatResponse {
  const lines = [`The loaded OKF library currently contains ${kb.papers.length} paper(s):`, ...kb.papers.map((paper, index) => `${index + 1}. ${paper.title} - ${paperContribution(paper.paper_id, paper.title, kb)}`)];
  return baseResponse(plan.intent, lines.join("\n"), [], [], emptyFlow("library-overview"), sourcePapersForIds(kb.papers.map((paper) => paper.paper_id), [], kb), { task_type: plan.task_type, answer_plan: answerPlan });
}

function paperDiscoveryResponse(_query: string, plan: OkfQueryPlan, answerPlan: OkfAnswerPlan, kb: OkfKnowledgeBase): OkfChatResponse {
  const rankedMatches = rankPaperMatches(answerPlan.paper_matches, answerPlan);
  const nonWeakMatches = rankedMatches.filter((match) => match.match_strength !== "weak");
  const matches = nonWeakMatches.length ? nonWeakMatches : rankedMatches.slice(0, 3);
  const strong = matches.filter((match) => match.match_strength === "strong");
  const partial = matches.filter((match) => match.match_strength === "partial");
  const weak = matches.filter((match) => match.match_strength === "weak");
  const concepts = conceptsFromPlan(answerPlan, kb);
  const evidence = evidenceForConcepts(concepts, kb);
  const sections = [`I found ${strong.length} strong match(es) and ${partial.length} partial match(es) for the requested papers. This is a paper discovery answer, so I am ranking sources rather than recommending an architecture.`];
  if (strong.length) sections.push(`Strong matches:\n${strong.map((match, index) => `${index + 1}. ${match.title} - ${match.short_reason}`).join("\n")}`);
  if (partial.length) sections.push(`Partial matches:\n${partial.map((match, index) => `${index + 1}. ${match.title} - ${match.short_reason}`).join("\n")}`);
  if (weak.length && !nonWeakMatches.length) sections.push(`Weak lexical matches:\n${weak.map((match, index) => `${index + 1}. ${match.title} - ${match.short_reason}`).join("\n")}`);
  if (!matches.length) sections.push("No loaded OKF paper matched the criteria strongly enough. I did not infer unsupported papers or mechanisms.");
  return baseResponse(plan.intent, sections.join("\n\n"), concepts, evidence.map(toEvidenceDto), buildOkfFlow("paper-discovery", concepts, kb), sourcePapersForIds(matches.map((match) => match.paper_id), concepts, kb, answerPlan), { task_type: plan.task_type, answer_plan: answerPlan });
}

function paperElementResponse(query: string, plan: OkfQueryPlan, answerPlan: OkfAnswerPlan, kb: OkfKnowledgeBase): OkfChatResponse {
  const target = plan.targetPaper ?? kb.papers.find((paper) => paper.paper_id === answerPlan.selected_papers[0]?.paper_id);
  const contextFields = plan.query_plan.requested_context_fields.length
    ? plan.query_plan.requested_context_fields
    : detectRequestedContextFields(query);
  if (contextFields.length) {
    const answer = target
      ? renderPaperContextAnswer(target, contextFields)
      : "No named paper could be resolved for the requested paper-context metadata.";
    return baseResponse(
      plan.intent,
      answer,
      [],
      [],
      emptyFlow("paper-context"),
      sourcePapersForIds(target ? [target.paper_id] : [], [], kb, answerPlan),
      { task_type: plan.task_type, answer_plan: { ...answerPlan, extraction_items: [], evidence_pack: [] } }
    );
  }
  const concepts = orderConcepts(kb.concepts.filter((concept) => concept.paper_id === target?.paper_id && plan.requestedTypes.includes(concept.type)));
  const evidence = evidenceForConcepts(concepts, kb);
  const counts = plan.requestedTypes.map((type) => `${concepts.filter((concept) => concept.type === type).length} ${readableType(type, concepts.filter((concept) => concept.type === type).length)}`).join(" and ");
  const answer = [`${target?.title ?? "The named paper"} contributes ${counts} in the requested OKF scope.`, ...plan.requestedTypes.map((type) => formatConceptSection(labelForType(type), concepts.filter((concept) => concept.type === type))), `Evidence note: ${evidence.length} evidence item(s) are linked to these extracted elements.`].filter(Boolean).join("\n\n");
  return baseResponse(plan.intent, answer, concepts, evidence.map(toEvidenceDto), buildOkfFlow("paper-elements", concepts, kb), sourcePapersForIds(target ? [target.paper_id] : [], concepts, kb, answerPlan), { task_type: plan.task_type, requirements: concepts.filter((concept) => concept.type === "Design Requirement").map((concept) => cardForConcept(concept, kb)), principles: concepts.filter((concept) => concept.type === "Design Principle").map((concept) => cardForConcept(concept, kb)), features: concepts.filter((concept) => concept.type === "Design Feature").map((concept) => cardForConcept(concept, kb)), artifact_direction: concepts.filter((concept) => concept.type === "Artifact").map((concept) => cardForConcept(concept, kb)), answer_plan: { ...answerPlan, extraction_items: concepts.map((concept) => ({ concept_id: concept.concept_id, paper_id: concept.paper_id, type: concept.type, title: concept.title })) } });
}

function renderPaperContextAnswer(paper: OkfPaper, fields: PaperContextField[]) {
  const sections = fields.map((field) => paperContextSection(paper, field));
  return [
    `# Recorded paper context: ${paper.title}`,
    ...sections
  ].join("\n\n");
}

function paperContextSection(paper: OkfPaper, field: PaperContextField) {
  if (field === "research_questions") return formatRecordedSection("Research questions", paper.research_questions);
  if (field === "theoretical_foundations") {
    return formatRecordedSection("Theoretical foundations", unique([
      ...paper.theoretical_foundations,
      paper.presentation?.dsr_summary_grid.input_knowledge
    ].filter((value): value is string => Boolean(value?.trim()))));
  }
  if (field === "limitations") {
    return formatRecordedSection("Limitations and boundary conditions", unique([
      ...paper.limitations,
      ...(paper.presentation?.additional_context.limitations ?? [])
    ]));
  }
  if (field === "methodology") {
    return formatRecordedSection("Methodology and research process", unique([
      paper.methodology,
      paper.presentation?.overview.methodology,
      paper.presentation?.dsr_summary_grid.research_process
    ].filter((value): value is string => Boolean(value?.trim()))));
  }
  if (field === "evaluation") {
    return formatRecordedSection("Evaluation", unique([
      ...paper.evaluation_method,
      ...(paper.presentation?.overview.evaluation_method ?? []),
      paper.presentation?.additional_context.summary
    ].filter((value): value is string => Boolean(value?.trim()))));
  }
  const presentation = paper.presentation;
  if (!presentation) return "## Presentation metadata\n\nNot recorded.";
  return [
    "## Presentation metadata",
    formatRecordedSection("Problem", [presentation.dsr_summary_grid.problem], 3),
    formatRecordedSection("Input knowledge", [presentation.dsr_summary_grid.input_knowledge], 3),
    formatRecordedSection("Research process", [presentation.dsr_summary_grid.research_process], 3),
    formatRecordedSection("Solution", [presentation.dsr_summary_grid.solution], 3),
    formatRecordedSection("Output knowledge", [presentation.dsr_summary_grid.output_knowledge], 3)
  ].join("\n\n");
}

function formatRecordedSection(title: string, values: Array<string | null | undefined>, headingLevel = 2) {
  const recorded = unique(values.filter((value): value is string => Boolean(value?.trim())).map((value) => value.trim()));
  const heading = `${"#".repeat(headingLevel)} ${title}`;
  if (!recorded.length) return `${heading}\n\nNot recorded.`;
  if (recorded.length === 1) return `${heading}\n\n${recorded[0]}`;
  return `${heading}\n\n${recorded.map((value) => `- ${value}`).join("\n")}`;
}

function negativeResponse(query: string, plan: OkfQueryPlan, answerPlan: OkfAnswerPlan, kb: OkfKnowledgeBase): OkfChatResponse {
  const terms = strictMechanismTerms(query);
  const strict = kb.concepts.filter((concept) => concept.type === "Design Principle" && concept.extraction_type !== "inferred" && terms.some((term) => conceptText(concept, kb).includes(normalizeText(term))));
  const related = conceptsForPlan(query, { ...plan, intent: "PAPER_DISCOVERY_QUERY" }, answerPlan.selected_papers.map((paper) => paper.paper_id), kb).slice(0, 12);
  const evidence = evidenceForConcepts(related, kb);
  const answer = strict.length
    ? `The loaded OKF library has ${strict.length} formal stored design principle match(es):\n${strict.map((concept, index) => `${index + 1}. ${concept.title} (${paperTitle(concept.paper_id, kb)})`).join("\n")}`
    : [`I did not find a formal stored Design Principle in the loaded OKF library that matches ${plan.criteria.mustHaveTerms.slice(0, 3).join(", ") || "the requested mechanism"}.`, related.length ? `Related stored OKF material exists, but it is not a formal design principle match:\n${related.slice(0, 5).map((concept, index) => `${index + 1}. ${concept.title} (${concept.type}, ${paperTitle(concept.paper_id, kb)})`).join("\n")}` : "I did not find a grounded related mechanism either."].join("\n\n");
  return baseResponse(plan.intent, answer, related, evidence.map(toEvidenceDto), buildOkfFlow("negative-query", related, kb), sourcePapersForIds(unique(related.map((concept) => concept.paper_id)), related, kb, answerPlan), { task_type: plan.task_type, answer_plan: { ...answerPlan, extraction_items: related.map((concept) => ({ concept_id: concept.concept_id, paper_id: concept.paper_id, type: concept.type, title: concept.title })) } });
}

function flowResponse(query: string, plan: OkfQueryPlan, answerPlan: OkfAnswerPlan, kb: OkfKnowledgeBase): OkfChatResponse {
  const requestedMode = plan.query_plan.requested_flow_view ?? detectRequestedFlowView(query);
  if (requestedMode === "source_figure" && !plan.targetPaper) {
    const empty = emptyFlow("source-view-paper-unresolved", "Source Figure paper unresolved");
    return baseResponse(
      plan.intent,
      "Source Figure mode needs a named paper before it can resolve a stored figure or table. Identify the paper and, if needed, its stored source label or title. I did not select a ranked paper or invent a mapping.",
      [],
      [],
      empty,
      [],
      {
        task_type: plan.task_type,
        answer_plan: { ...answerPlan, extraction_items: [], flow_rows: [], evidence_pack: [] },
        flow_view: { requested_mode: requestedMode, resolution: "ambiguous", available_source_views: [] },
        warnings: ["A Source Figure request did not identify a paper."]
      }
    );
  }
  const paperLimit = plan.targetPaper || requestedMode !== "full" ? 1 : 3;
  const paperIds = answerPlan.selected_papers.map((paper) => paper.paper_id).slice(0, paperLimit);
  const bundle = canonicalFlowBundle(paperIds, kb);
  const availableViews = getAvailableSourceViews(bundle);
  const availableSourceViews = availableViews.map((view) => ({
    source_view_id: view.source_view_id,
    title: view.title,
    label: view.source_reference.label,
    page: view.source_reference.page,
    type: view.view_type
  }));

  if (requestedMode === "source_figure") {
    const selection = selectRequestedSourceView(availableViews, query, plan.query_plan.source_view_selector, Boolean(plan.targetPaper));
    if (!selection.sourceViewId) {
      const resolution = selection.ambiguous ? "ambiguous" : "unavailable";
      const choices = availableSourceViews.length
        ? availableSourceViews.map((view) => `${view.label} - ${view.title} (page ${view.page})`).join("; ")
        : "none";
      const answer = selection.ambiguous
        ? `The Source Figure request is ambiguous. Specify one stored source-view label or title. Available source views: ${choices}.`
        : `No source-view-grounded mapping is available for the requested paper and selector. Available source views: ${choices}. I did not substitute a Recommended Flow or invent a source mapping.`;
      const empty = emptyFlow("source-view-unresolved", "No source-view-grounded mapping");
      return baseResponse(plan.intent, answer, [], [], empty, sourcePapersForIds(paperIds, [], kb, answerPlan), {
        task_type: plan.task_type,
        answer_plan: { ...answerPlan, extraction_items: [], flow_rows: [], evidence_pack: [] },
        flow_view: { requested_mode: requestedMode, resolution, available_source_views: availableSourceViews },
        warnings: selection.reason ? [selection.reason] : []
      });
    }
    return resolvedProjectedFlowResponse(query, plan, answerPlan, kb, paperIds, bundle, {
      mode: "source_figure",
      source_view_id: selection.sourceViewId
    }, availableSourceViews);
  }

  return resolvedProjectedFlowResponse(
    query,
    plan,
    answerPlan,
    kb,
    paperIds,
    bundle,
    { mode: requestedMode },
    availableSourceViews
  );
}

function canonicalFlowBundle(paperIds: string[], kb: OkfKnowledgeBase): CanonicalFlowBundle {
  const selectedPapers = kb.papers.filter((paper) => paperIds.includes(paper.paper_id));
  const concepts = kb.concepts.filter((concept) => paperIds.includes(concept.paper_id));
  const conceptIds = new Set(concepts.map((concept) => concept.concept_id));
  return {
    paper_id: selectedPapers.length === 1 ? selectedPapers[0].paper_id : "selected_okf_papers",
    concepts,
    relations: kb.relations.filter((relation) => conceptIds.has(relation.source_concept_id) && conceptIds.has(relation.target_concept_id)),
    recommended_paths: selectedPapers.flatMap((paper) => loadRecommendedStoredFlowPaths(paper.paper_id)),
    source_views: selectedPapers.flatMap((paper) => paper.source_views ?? []),
    graph_source_reference: selectedPapers.length === 1 ? selectedPapers[0].graph_source_reference : null
  };
}

function selectRequestedSourceView(
  views: ReturnType<typeof getAvailableSourceViews>,
  query: string,
  selector: string | undefined,
  namedPaper: boolean
): { sourceViewId?: string; ambiguous: boolean; reason?: string } {
  if (!views.length) return { ambiguous: false, reason: "The selected OKF paper set has no structurally valid source_view." };
  const queryText = normalizeText(query);
  const selectorText = normalizeText(selector ?? "");
  const scored = views.map((view) => {
    const values = sourceViewSearchValues(view);
    let score = 0;
    if (selectorText) {
      if (values.some((value) => value === selectorText)) score = 100;
      else if (values.some((value) => value.includes(selectorText) || selectorText.includes(value))) score = 80;
    }
    if (values.some((value) => value.length >= 4 && queryText.includes(value))) score = Math.max(score, 60);
    return { view, score };
  }).filter((item) => item.score > 0).sort((left, right) => right.score - left.score || left.view.source_view_id.localeCompare(right.view.source_view_id));

  if (scored.length) {
    const top = scored.filter((item) => item.score === scored[0].score);
    if (top.length === 1) return { sourceViewId: top[0].view.source_view_id, ambiguous: false };
    return { ambiguous: true, reason: "More than one stored source view matched the requested selector." };
  }
  if (namedPaper && views.length === 1 && !selectorText) return { sourceViewId: views[0].source_view_id, ambiguous: false };
  if (views.length > 1) return { ambiguous: true, reason: "The request did not uniquely identify one of the available stored source views." };
  if (selectorText) return { ambiguous: false, reason: "The requested source-view selector did not match the available stored source view." };
  if (!namedPaper) return { ambiguous: true, reason: "A Source Figure request must identify a paper or stored source-view label/title." };
  return { sourceViewId: views[0].source_view_id, ambiguous: false };
}

function sourceViewSearchValues(view: ReturnType<typeof getAvailableSourceViews>[number]) {
  return unique([
    view.source_view_id,
    view.title,
    view.source_reference.label,
    view.source_reference.caption,
    `${view.source_reference.type} ${view.source_reference.page}`
  ].map(normalizeText).filter(Boolean));
}

function resolvedProjectedFlowResponse(
  query: string,
  plan: OkfQueryPlan,
  answerPlan: OkfAnswerPlan,
  kb: OkfKnowledgeBase,
  requestedPaperIds: string[],
  bundle: CanonicalFlowBundle,
  request: { mode: "source_figure"; source_view_id: string } | { mode: "recommended" | "full" },
  availableSourceViews: OkfFlowViewMetadata["available_source_views"]
): OkfChatResponse {
  let projected: ProjectedFlow;
  try {
    projected = resolveFlowView(bundle, request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "The stored flow view could not be projected.";
    const empty = emptyFlow("flow-projection-unavailable", "Stored flow projection unavailable");
    return baseResponse(
      plan.intent,
      `The requested stored flow view is unavailable. ${message} I did not substitute another flow mode or invent links.`,
      [],
      [],
      empty,
      sourcePapersForIds(requestedPaperIds, [], kb, answerPlan),
      {
        task_type: plan.task_type,
        flow_view: { requested_mode: request.mode, resolution: "unavailable", available_source_views: availableSourceViews },
        warnings: [message]
      }
    );
  }

  const flow = projectedFlowToOkfFlow(projected, kb);
  const projectedIds = new Set(projected.nodes.map((node) => node.id));
  const concepts = kb.concepts.filter((concept) => projectedIds.has(concept.concept_id));
  const evidenceIds = new Set(projected.evidence_ids);
  const evidence = kb.evidence_items.filter((item) => evidenceIds.has(item.evidence_id));
  const rows = buildStoredFlowRows(concepts, kb, new Set(projected.edges.map((edge) => edge.id))).slice(0, 12);
  const selectedPaperIds = unique(concepts.map((concept) => concept.paper_id));
  const paperIds = selectedPaperIds.length ? selectedPaperIds : requestedPaperIds;
  const counts = countFlowGraphLayers(flow);
  const reference = projected.source_reference
    ? `${projected.source_reference.label ?? projected.title}, page ${projected.source_reference.page ?? "not recorded"}${projected.source_reference.caption ? `: ${projected.source_reference.caption}` : ""}`
    : undefined;
  const answer = [
    flowProjectionIntroduction(projected),
    "The layered graph is in the Flow tab.",
    reference ? `Source reference: ${reference}` : undefined,
    `The graph contains ${counts.Requirement} requirement(s), ${counts.Principle} principle(s), ${counts.Feature} feature(s), and ${counts.Artifact} artifact node(s), connected by ${flow.edges.length} stored relation edge(s).`,
    rows.length ? `Short branch summary:\n${flowBranchSummary(rows)}` : "This stored projection has no complete Requirement -> Principle -> Feature row; the graph preserves the available stored layers and edges without filling gaps.",
    `Evidence coverage: ${evidence.length} linked evidence item(s).`
  ].filter(Boolean).join("\n\n");
  const flowView: OkfFlowViewMetadata = {
    requested_mode: request.mode,
    resolution: "resolved",
    resolved_mode: projected.mode,
    projection_source: projected.projection_source,
    source_view_id: projected.source_view_id,
    source_reference: projected.source_reference,
    available_source_views: availableSourceViews
  };
  return baseResponse(plan.intent, answer, concepts, evidence.map(toEvidenceDto), flow, sourcePapersForIds(paperIds, concepts, kb, answerPlan), {
    task_type: plan.task_type,
    flow_rows: rows,
    flow_view: flowView,
    answer_plan: {
      ...answerPlan,
      extraction_items: concepts.map((concept) => ({ concept_id: concept.concept_id, paper_id: concept.paper_id, type: concept.type, title: concept.title })),
      flow_rows: rows,
      evidence_pack: evidence.map((item) => ({ evidence_id: item.evidence_id, paper_id: item.paper_id, concept_id: item.concept_id, excerpt: item.quote ?? item.paraphrase, confidence: item.confidence }))
    },
    warnings: projected.warnings
  });
}

function projectedFlowToOkfFlow(projected: ProjectedFlow, kb: OkfKnowledgeBase): OkfFlow {
  const graphId = `flow:${projected.mode}:${projected.source_view_id ?? "stored"}:${projected.nodes.length}:${projected.edges.length}`;
  return {
    graph_id: graphId,
    flow_id: graphId,
    title: projected.title,
    mode: "stored_paper_flow",
    layers: projected.layers.map(projectedLayer),
    nodes: projected.nodes.map((node) => ({
      id: node.id,
      label: node.title,
      type: node.type,
      layer: projectedLayer(node.type),
      paper_id: node.paper_id,
      concept_id: node.id,
      provenance: "stored",
      confidence: node.confidence,
      evidence_ids: node.evidence_ids,
      short_description: node.description,
      query_generated: false
    })),
    edges: projected.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      predicate: edge.predicate,
      relation_id: edge.id,
      provenance: "stored",
      stored_provenance: edge.provenance === "query_generated" ? undefined : edge.provenance,
      source_view_ids: edge.source_view_ids,
      confidence: edge.confidence,
      evidence_ids: edge.evidence_ids
    })),
    stored_flow_source: projected.projection_source === "source_view" || projected.projection_source === "graph_json_recommended_paths"
      ? "graph_json"
      : "okf_relations_fallback",
    evidence_refs: projected.evidence_ids.flatMap((evidenceId) => {
      const item = kb.evidence_items.find((candidate) => candidate.evidence_id === evidenceId);
      return item ? [{
        evidence_id: item.evidence_id,
        paper_id: item.paper_id,
        concept_id: item.concept_id,
        excerpt: item.quote ?? item.paraphrase,
        section: item.section,
        page_number: item.page_number,
        confidence: item.confidence
      }] : [];
    }),
    warnings: projected.warnings
  };
}

function projectedLayer(type: OkfConceptType): OkfFlow["layers"][number] {
  if (type === "Design Requirement") return "Requirement";
  if (type === "Design Principle") return "Principle";
  if (type === "Design Feature") return "Feature";
  if (type === "Output Knowledge") return "OutputKnowledge";
  return type;
}

function flowProjectionIntroduction(projected: ProjectedFlow) {
  if (projected.mode === "source_figure") {
    return `This Source Figure view reproduces the stored mapping for ${projected.title}. Only source-view-listed concepts and canonical stored relation edges are shown. Validation status: ${projected.validation.semantic_status}; visual parity: ${projected.validation.visual_parity}. The automatic layout is not a pixel replica of the paper figure.`;
  }
  if (projected.mode === "full") {
    return "This Full Relations / Advanced view shows all canonical stored relations in the selected OKF paper scope. It is intentionally separate from the compact Recommended Flow.";
  }
  return projected.projection_source === "graph_json_recommended_paths"
    ? "This Recommended Flow follows the stored graph.json recommended paths."
    : "This Recommended Flow is a deterministic compact projection of canonical stored OKF relations because no usable recommended path was available.";
}

function isExplicitStoredFlowViewRequest(query: string) {
  const normalized = normalizeText(query);
  return /\b(?:source|paper|original|exact|stored)\b.*\b(?:figure|table|diagram|mapping)\b|\b(?:figure|table|diagram)\s+[a-z0-9][a-z0-9.-]*\b|\b(?:recommended|main|full|advanced|all)\b.*\b(?:flow|graph|relations?|mapping)\b/.test(normalized);
}

function evidenceResponse(query: string, plan: OkfQueryPlan, answerPlan: OkfAnswerPlan, kb: OkfKnowledgeBase): OkfChatResponse {
  const terms = expandPolicyTerms(tokenizePolicy(query));
  const paperIds = new Set(answerPlan.selected_papers.map((paper) => paper.paper_id));
  const evidenceItems = kb.evidence_items.filter((item) => (!paperIds.size || paperIds.has(item.paper_id)) && terms.some((term) => normalizeText([item.paraphrase, item.quote, item.section].join(" ")).includes(normalizeText(term)))).slice(0, 24);
  const concepts = kb.concepts.filter((concept) => evidenceItems.some((item) => item.concept_id === concept.concept_id));
  const grouped = groupBy(evidenceItems, (item) => item.paper_id);
  const answer = evidenceItems.length ? [`Evidence grouped by paper:`, ...[...grouped.entries()].map(([paperId, items]) => `${paperTitle(paperId, kb)}:\n${items.slice(0, 6).map((item, index) => `${index + 1}. ${item.paraphrase}`).join("\n")}`)].join("\n\n") : "No evidence item matched this query. I did not generate an architecture recommendation.";
  return baseResponse(plan.intent, answer, concepts, evidenceItems.map(toEvidenceDto), buildOkfFlow(query, concepts, kb), sourcePapersForIds([...paperIds], concepts, kb, answerPlan), { task_type: plan.task_type, answer_plan: { ...answerPlan, evidence_pack: evidenceItems.map((item) => ({ evidence_id: item.evidence_id, paper_id: item.paper_id, concept_id: item.concept_id, excerpt: item.quote ?? item.paraphrase, confidence: item.confidence })) } });
}

function comparisonResponse(query: string, plan: OkfQueryPlan, answerPlan: OkfAnswerPlan, kb: OkfKnowledgeBase): OkfChatResponse {
  const paperIds = answerPlan.selected_papers.map((paper) => paper.paper_id).slice(0, 4);
  const types = plan.requestedTypes.length ? plan.requestedTypes : ["Design Principle", "Design Feature", "Artifact", "Evaluation"];
  const concepts = conceptsForPlan(query, plan, paperIds, kb);
  const evidence = evidenceForConcepts(concepts, kb);
  const rows = paperIds.flatMap((paperId) => types.map((type) => ({ paper_id: paperId, title: paperTitle(paperId, kb), element_type: type, summary: concepts.filter((concept) => concept.paper_id === paperId && concept.type === type).slice(0, 3).map((concept) => concept.title).join("; ") || "No direct retrieved element." })));
  const answer = [`Comparison by paper and DSR element type:`, ...rows.map((row) => `- ${row.title} / ${row.element_type}: ${row.summary}`), `Reuse implication: use the similarities as reusable patterns and treat paper-specific mechanisms as context-bound unless the same criteria appear in your design problem.`].join("\n");
  return baseResponse(plan.intent, answer, concepts, evidence.map(toEvidenceDto), buildOkfFlow(query, concepts, kb), sourcePapersForIds(paperIds, concepts, kb, answerPlan), { task_type: plan.task_type, answer_plan: { ...answerPlan, comparison_rows: rows } });
}

function lifecycleResponse(query: string, plan: OkfQueryPlan, answerPlan: OkfAnswerPlan, kb: OkfKnowledgeBase): OkfChatResponse {
  const selected = answerPlan.selected_papers[0];
  const paper = selected ? kb.papers.find((item) => item.paper_id === selected.paper_id) : undefined;
  const concepts = paper
    ? orderConcepts(kb.concepts.filter((concept) => concept.paper_id === paper.paper_id && ["Design Requirement", "Design Principle", "Design Feature", "Artifact", "Evaluation", "Output Knowledge"].includes(concept.type)))
    : [];
  const evidence = evidenceForConcepts(concepts, kb);
  if (!paper) {
    return baseResponse(plan.intent, "No loaded OKF paper provided grounded implementation-lifecycle material for this query.", [], [], emptyFlow("lifecycle-unavailable"), [], { task_type: plan.task_type, answer_plan: answerPlan });
  }
  const process = unique([
    paper.presentation?.dsr_summary_grid.solution,
    paper.presentation?.dsr_summary_grid.research_process,
    paper.methodology,
    paper.presentation?.overview.methodology
  ].filter((value): value is string => Boolean(value?.trim())));
  const lifecycleConcepts = concepts.filter((concept) => ["Design Principle", "Design Feature", "Artifact"].includes(concept.type)).slice(0, 14);
  const roleConcepts = concepts.filter((concept) => concept.type === "Design Feature" && /\b(role|roles|participant|stakeholder|actor)\b/i.test(concept.title)).slice(0, 12);
  const modelConcepts = concepts.filter((concept) => concept.type === "Design Feature" && /\b(model|modeling|prototype|use case|architecture|data flow|interaction|consensus|transaction|executable smart contract)\b/i.test(concept.title)).slice(0, 12);
  const evaluation = unique([
    ...paper.evaluation_method,
    ...(paper.presentation?.overview.evaluation_method ?? [])
  ]);
  const limitations = unique([
    ...paper.limitations,
    ...(paper.presentation?.additional_context.limitations ?? [])
  ]);
  const answer = [
    `Use the recorded lifecycle and method material from ${paper.title} as the grounded process backbone.`,
    formatRecordedSection("Recorded process", process),
    formatRecordedSection("Lifecycle design knowledge", lifecycleConcepts.map((concept) => concept.title)),
    formatRecordedSection("Recorded roles and responsibilities", roleConcepts.map((concept) => concept.title)),
    formatRecordedSection("Recorded models and deliverables", modelConcepts.map((concept) => concept.title)),
    formatRecordedSection("Recorded evaluation", evaluation),
    formatRecordedSection("Boundary conditions", limitations),
    "## Adaptation boundary\n\nTreat domain-specific controls as adaptations layered onto the stored process, role, and modeling structure. Do not present an adaptation as a stored fact unless it has separate canonical support."
  ].filter(Boolean).join("\n\n");
  return baseResponse(plan.intent, answer, concepts, evidence.map(toEvidenceDto), buildOkfFlow(query, concepts, kb), sourcePapersForIds([paper.paper_id], concepts, kb, answerPlan), { task_type: plan.task_type, answer_plan: answerPlan });
}

function evaluationPlanningResponse(query: string, plan: OkfQueryPlan, answerPlan: OkfAnswerPlan, kb: OkfKnowledgeBase): OkfChatResponse {
  const paperIds = answerPlan.selected_papers.map((paper) => paper.paper_id).slice(0, 8);
  const concepts = orderConcepts(kb.concepts.filter((concept) => paperIds.includes(concept.paper_id) && ["Evaluation", "Output Knowledge", "Artifact"].includes(concept.type)));
  const evidence = evidenceForConcepts(concepts, kb);
  const byPaper = groupBy(concepts.filter((concept) => concept.type === "Evaluation"), (concept) => concept.paper_id);
  const answer = [`Use the retrieved Evaluation concepts as options, then choose by artifact maturity and domain fit.`, ...[...byPaper.entries()].map(([paperId, items]) => `${paperTitle(paperId, kb)}: ${items.map((item) => item.title).join("; ")}`), `Fit guidance: early artifacts need demonstration/prototype evaluation; mature artifacts need scenario, stakeholder, operational, or field-style evaluation. Recorded paper limitations should become risks to validate.`].join("\n\n");
  return baseResponse(plan.intent, answer, concepts, evidence.map(toEvidenceDto), buildOkfFlow(query, concepts, kb), sourcePapersForIds(paperIds, concepts, kb, answerPlan), { task_type: plan.task_type, answer_plan: answerPlan });
}

function clarificationResponse(_query: string, plan: OkfQueryPlan, answerPlan: OkfAnswerPlan, _kb: OkfKnowledgeBase): OkfChatResponse {
  void _kb;
  const answer = "I need one more constraint to answer this reliably. Do you want to find papers, extract exact elements from a named paper, build a relation-backed DSR flow, or get reusable design guidance for a design problem?";
  return baseResponse(plan.intent, answer, [], [], emptyFlow("clarification"), [], { task_type: plan.task_type, answer_plan: answerPlan, assumptions: ["The query was too broad to choose a grounded OKF answer type."] });
}

function validateAnswerPlanResponse(response: OkfChatResponse, kb: OkfKnowledgeBase) {
  const warnings: string[] = [];
  const paperIds = new Set(kb.papers.map((paper) => paper.paper_id));
  const conceptIds = new Set(kb.concepts.map((concept) => concept.concept_id));
  for (const paper of response.answer_plan?.selected_papers ?? []) if (!paperIds.has(paper.paper_id)) warnings.push(`AnswerPlan selected missing paper ${paper.paper_id}.`);
  if (response.intent === "PAPER_ELEMENT_QUERY") {
    const retrievedPaperIds = unique(response.retrieved_concepts.map((concept) => concept.paper_id));
    if (retrievedPaperIds.length > 1) warnings.push("AnswerPlan validation: named-paper extraction retrieved more than one paper.");
  }
  if (response.intent === "DSR_FLOW_QUERY") {
    for (const row of response.flow_rows ?? []) {
      if (!row.concept_ids.length || row.concept_ids.some((id) => !conceptIds.has(id))) warnings.push(`AnswerPlan validation: flow row ${row.row_id} is missing stored concept support.`);
    }
  }
  if (/\b[A-Z][A-Z0-9_]{2,}:[A-Za-z0-9_.:-]+\b|\bev[_-][A-Za-z0-9_.:-]+\b/i.test(response.answer)) warnings.push("AnswerPlan validation: main answer contains raw OKF identifiers.");
  return warnings;
}
function attachAnswerPlan(response: OkfChatResponse, answerPlan: OkfAnswerPlan, kb: OkfKnowledgeBase): OkfChatResponse {
  const existing = response.answer_plan ?? answerPlan;
  const concepts = response.retrieved_concepts;
  const evidence = response.evidence.map((item) => ({ evidence_id: item.evidence_id, paper_id: item.paper_id, concept_id: item.concept_id, excerpt: item.quote ?? item.paraphrase, confidence: item.confidence as ConfidenceLabel }));
  return { ...response, answer_plan: { ...existing, extraction_items: concepts.map((concept) => ({ concept_id: concept.concept_id, paper_id: concept.paper_id, type: concept.type, title: concept.title })), selected_papers: response.source_papers.map((paper) => ({ paper_id: paper.paper_id, title: paper.title, role_for_query: paper.role, reason_for_selection: paper.reason, relevance_score: paper.score ?? 0, matched_criteria: existing.paper_matches.find((match) => match.paper_id === paper.paper_id)?.matched_criteria ?? [], top_concepts: concepts.filter((concept) => concept.paper_id === paper.paper_id).slice(0, 8).map((concept) => concept.title), top_evidence: response.evidence.filter((item) => item.paper_id === paper.paper_id).slice(0, 5).map((item) => item.paraphrase) })), evidence_pack: evidence.length ? evidence : existing.evidence_pack, paper_matches: existing.paper_matches.length ? existing.paper_matches : response.source_papers.map((paper) => paperMatchForSupport({ paper_id: paper.paper_id, title: paper.title, reason: paper.reason, score: paper.score ?? 0 }, response.interpreted_problem ?? existing.user_query, { ...analyzeOkfQuery(existing.user_query, existing.intent, kb), requestedTypes: existing.criteria.requestedTypes }, kb)) } };
}

function baseResponse(intent: OkfChatIntent, answer: string, concepts: OkfConcept[], evidence: OkfChatResponse["evidence"], flow: OkfChatResponse["flow"], source_papers: OkfSourcePaper[], extra: Partial<OkfChatResponse> = {}): OkfChatResponse {
  return { intent, answer, requirements: [], principles: [], features: [], artifact_direction: [], source_papers, retrieved_concepts: concepts, evidence, flow, flow_graph: flow, assumptions: [], limitations: [], warnings: [], ...extra };
}

function sourcePapersForIds(paperIds: string[], concepts: OkfConcept[], kb: OkfKnowledgeBase, answerPlan?: OkfAnswerPlan): OkfSourcePaper[] {
  return unique(paperIds).map((paperId) => {
    const paper = kb.papers.find((item) => item.paper_id === paperId);
    const paperConcepts = concepts.filter((concept) => concept.paper_id === paperId);
    const evidenceCount = kb.evidence_items.filter((item) => item.paper_id === paperId && (!item.concept_id || !paperConcepts.length || paperConcepts.some((concept) => concept.concept_id === item.concept_id))).length;
    const planned = answerPlan?.selected_papers.find((item) => item.paper_id === paperId);
    const match = answerPlan?.paper_matches.find((item) => item.paper_id === paperId);
    return { paper_id: paperId, title: paper?.title ?? paperId, role: paperRoleLabel(paperId, paper?.title, kb, answerPlan?.user_query), reason: planned?.reason_for_selection ?? paperRoleReason(paperId, kb, answerPlan?.user_query), requirements_count: paperConcepts.filter((concept) => concept.type === "Design Requirement").length, principles_count: paperConcepts.filter((concept) => concept.type === "Design Principle").length, features_count: paperConcepts.filter((concept) => concept.type === "Design Feature").length, evidence_count: evidenceCount, score: planned?.relevance_score, match_strength: match?.match_strength };
  }).sort(compareSourcePapers);
}

function emptyFlow(id: string, title = "No flow requested") {
  const graph_id = `flow:${id}:0:0`;
  return { graph_id, flow_id: graph_id, title, mode: "stored_paper_flow" as const, layers: ["Problem", "Requirement", "Principle", "Feature", "Artifact", "Evaluation", "Output Knowledge"] as ReturnType<typeof buildOkfFlow>["layers"], nodes: [], edges: [], evidence_refs: [], warnings: [] };
}

function flowConcepts(query: string, paperIds: string[], kb: OkfKnowledgeBase) {
  const terms = expandPolicyTerms(tokenizePolicy(query));
  const paperSet = new Set(paperIds.length ? paperIds : selectPolicySourcePapers(query, kb, 3).map((paper) => paper.paper_id));
  const initial = kb.concepts.filter((concept) => paperSet.has(concept.paper_id) && ["Design Requirement", "Design Principle", "Design Feature", "Artifact"].includes(concept.type));
  const matched = initial.filter((concept) => scoreConcept(concept, terms, kb) > 0);
  const ids = new Set((matched.length ? matched : initial.filter((concept) => concept.type === "Design Requirement")).map((concept) => concept.concept_id));
  let changed = true;
  while (changed && ids.size < 80) {
    changed = false;
    for (const relation of kb.relations) {
      const source = kb.concepts.find((concept) => concept.concept_id === relation.source_concept_id);
      const target = kb.concepts.find((concept) => concept.concept_id === relation.target_concept_id);
      if (!source || !target || (!paperSet.has(source.paper_id) && !paperSet.has(target.paper_id))) continue;
      if (ids.has(source.concept_id) && !ids.has(target.concept_id)) { ids.add(target.concept_id); changed = true; }
      if (ids.has(target.concept_id) && !ids.has(source.concept_id)) { ids.add(source.concept_id); changed = true; }
    }
  }
  return orderConcepts(kb.concepts.filter((concept) => ids.has(concept.concept_id))).slice(0, 80);
}

function buildStoredFlowRows(concepts: OkfConcept[], kb: OkfKnowledgeBase, allowedRelationIds?: Set<string>): OkfReuseFlowRow[] {
  const byId = new Map(concepts.map((concept) => [concept.concept_id, concept]));
  const outgoing = new Map<string, typeof kb.relations>();
  for (const relation of kb.relations) if ((!allowedRelationIds || allowedRelationIds.has(relation.relation_id)) && byId.has(relation.source_concept_id) && byId.has(relation.target_concept_id)) outgoing.set(relation.source_concept_id, [...(outgoing.get(relation.source_concept_id) ?? []), relation]);
  const rows: OkfReuseFlowRow[] = [];
  for (const requirement of concepts.filter((concept) => concept.type === "Design Requirement")) {
    const principleRelations = (outgoing.get(requirement.concept_id) ?? []).filter((relation) => byId.get(relation.target_concept_id)?.type === "Design Principle");
    for (const pr of principleRelations) {
      const principle = byId.get(pr.target_concept_id);
      if (!principle) continue;
      const featureRelations = (outgoing.get(principle.concept_id) ?? []).filter((relation) => byId.get(relation.target_concept_id)?.type === "Design Feature");
      for (const fr of featureRelations.length ? featureRelations : [undefined]) {
        const feature = fr ? byId.get(fr.target_concept_id) : undefined;
        const artifactRelation = feature ? (outgoing.get(feature.concept_id) ?? []).find((relation) => byId.get(relation.target_concept_id)?.type === "Artifact") : undefined;
        const artifact = artifactRelation ? byId.get(artifactRelation.target_concept_id) : undefined;
        const selected = [requirement, principle, feature, artifact].filter((concept): concept is OkfConcept => Boolean(concept));
        const evidenceIds = evidenceForConcepts(selected, kb).map((item) => item.evidence_id).slice(0, 8);
        rows.push({ row_id: `stored-flow-${rows.length + 1}`, requirement_label: requirement.title, principle_label: principle.title, feature_label: feature?.title ?? "No directly linked feature in stored OKF relations", artifact_pattern: artifact?.title ?? "", supporting_papers: unique(selected.map((concept) => concept.paper_id)), evidence_ids: evidenceIds, concept_ids: selected.map((concept) => concept.concept_id), adaptation_text: "Stored OKF relation path.", adaptation_status: "stored", confidence: evidenceIds.length >= 2 ? "medium" : "low" });
      }
    }
  }
  return rows;
}

function paperMatchForSupport(support: { paper_id: string; title: string; reason: string; score?: number }, query: string, plan: OkfQueryPlan, kb: OkfKnowledgeBase, topSupportScore = support.score ?? 0): OkfPaperMatch {
  const terms = expandPolicyTerms(tokenizePolicy(query));
  const concepts = kb.concepts.filter((concept) => concept.paper_id === support.paper_id);
  const matched = concepts.filter((concept) => (!plan.requestedTypes.length || plan.requestedTypes.includes(concept.type)) && scoreConcept(concept, terms, kb) > 0);
  const matchedCriteria = plan.criteria.mustHaveTerms.filter((term) => conceptPoolText(concepts, kb).includes(normalizeText(term)));
  const matchedTypes = unique(matched.map((concept) => concept.type));
  const evidenceCount = kb.evidence_items.filter((item) => item.paper_id === support.paper_id && (!item.concept_id || matched.some((concept) => concept.concept_id === item.concept_id))).length;
  const strength = paperMatchStrength({ support, plan, matchedCriteria, matchedTypes, matchedCount: matched.length, evidenceCount, topSupportScore });
  return { paper_id: support.paper_id, title: support.title, match_strength: strength, matched_criteria: matchedCriteria.slice(0, 6), matched_element_types: matchedTypes.slice(0, 6), top_relevant_concepts: matched.slice(0, 5).map((concept) => concept.title), evidence_count: evidenceCount, short_reason: support.reason };
}

function paperMatchStrength({ support, plan, matchedCriteria, matchedTypes, matchedCount, evidenceCount, topSupportScore }: { support: { paper_id: string; score?: number }; plan: OkfQueryPlan; matchedCriteria: string[]; matchedTypes: OkfConceptType[]; matchedCount: number; evidenceCount: number; topSupportScore: number }): OkfPaperMatch["match_strength"] {
  if (plan.targetPaper?.paper_id === support.paper_id) return "strong";
  const mustHaveTarget = plan.criteria.mustHaveTerms.length ? Math.max(1, Math.ceil(plan.criteria.mustHaveTerms.length * 0.65)) : 0;
  const matchesMostCriteria = mustHaveTarget > 0 && matchedCriteria.length >= mustHaveTarget;
  const requestedTypeSatisfied = !plan.requestedTypes.length || plan.requestedTypes.some((type) => matchedTypes.includes(type));
  const isTopRankedGroundedMatch = topSupportScore > 0 && (support.score ?? 0) === topSupportScore && requestedTypeSatisfied && evidenceCount > 0 && (matchedCriteria.length > 0 || matchedCount >= 2);
  if (matchesMostCriteria || isTopRankedGroundedMatch) return "strong";
  if (matchedCriteria.length > 0 || matchedTypes.length > 0 || matchedCount > 0 || (support.score ?? 0) > 20) return "partial";
  return "weak";
}

function rankPaperMatches(matches: OkfPaperMatch[], answerPlan: OkfAnswerPlan) {
  const scoreByPaper = new Map(answerPlan.selected_papers.map((paper) => [paper.paper_id, paper.relevance_score]));
  return [...matches].sort((a, b) => strengthRank(b.match_strength) - strengthRank(a.match_strength) || (scoreByPaper.get(b.paper_id) ?? 0) - (scoreByPaper.get(a.paper_id) ?? 0) || a.title.localeCompare(b.title));
}

function compareSourcePapers(a: OkfSourcePaper, b: OkfSourcePaper) {
  return strengthRank(b.match_strength) - strengthRank(a.match_strength) || (b.score ?? 0) - (a.score ?? 0) || a.title.localeCompare(b.title);
}

function strengthRank(strength: OkfPaperMatch["match_strength"] | undefined) {
  if (strength === "strong") return 3;
  if (strength === "partial") return 2;
  if (strength === "weak") return 1;
  return 0;
}

function countFlowGraphLayers(flow: ReturnType<typeof buildOkfFlow>) {
  const base = { Requirement: 0, Principle: 0, Feature: 0, Artifact: 0 };
  for (const node of flow.nodes) {
    if (node.layer === "Requirement" || node.layer === "Principle" || node.layer === "Feature" || node.layer === "Artifact") base[node.layer] += 1;
  }
  return base;
}

function flowBranchSummary(rows: OkfReuseFlowRow[]) {
  const grouped = groupBy(rows, (row) => row.requirement_label);
  return [...grouped.entries()].slice(0, 6).map(([requirement, branchRows]) => {
    const principles = unique(branchRows.map((row) => row.principle_label).filter(Boolean)).map(compactFlowLabel);
    const features = unique(branchRows.map((row) => row.feature_label).filter(Boolean)).map(compactFlowLabel).slice(0, 4);
    const artifacts = unique(branchRows.map((row) => row.artifact_pattern).filter(Boolean)).map(compactFlowLabel).slice(0, 2);
    const target = [principles.join(" / "), features.join(", "), artifacts.join(", ")].filter(Boolean).join(" -> ");
    return `- ${compactFlowLabel(requirement)}: ${target || "stored relation branch"}`;
  }).join("\n");
}

function compactFlowLabel(value: string) {
  return value.replace(/^(?:Enable|Ensure)\s+/i, "").replace(/\.$/, "").trim();
}

function conceptsFromPlan(answerPlan: OkfAnswerPlan, kb: OkfKnowledgeBase) {
  const ids = new Set(answerPlan.extraction_items.map((item) => item.concept_id));
  return orderConcepts(kb.concepts.filter((concept) => ids.has(concept.concept_id)));
}

function selectedTypesForIntent(intent: OkfChatIntent, requested: OkfConceptType[]) {
  if (intent === "DESIGN_REUSE_QUERY" || intent === "DESIGN_REUSE_FLOW_QUERY") return ["Design Requirement", "Design Principle", "Design Feature", "Artifact"] as OkfConceptType[];
  if (requested.length) return requested;
  if (intent === "EVALUATION_PLANNING_QUERY") return ["Evaluation", "Output Knowledge", "Artifact"] as OkfConceptType[];
  if (intent === "PAPER_DISCOVERY_QUERY") return ["Design Requirement", "Design Principle", "Design Feature", "Artifact", "Evaluation"] as OkfConceptType[];
  return ["Design Requirement", "Design Principle", "Design Feature", "Artifact", "Evaluation", "Output Knowledge"] as OkfConceptType[];
}

function defaultRequestedTypes(intent: OkfChatIntent): OkfConceptType[] {
  if (intent === "PAPER_ELEMENT_QUERY") return ["Design Requirement", "Design Principle", "Design Feature", "Artifact"];
  if (intent === "EVALUATION_PLANNING_QUERY") return ["Evaluation"];
  return [];
}

function taskTypeForIntent(intent: OkfChatIntent): OkfTaskType {
  const map: Record<OkfChatIntent, OkfTaskType> = { LIBRARY_STATS_QUERY: "library_stats", LIBRARY_COVERAGE_QUERY: "library_coverage", PAPER_DISCOVERY_QUERY: "paper_discovery", PAPER_ELEMENT_QUERY: "paper_element", DSR_FLOW_QUERY: "dsr_flow", DESIGN_REUSE_QUERY: "design_reuse", DESIGN_REUSE_FLOW_QUERY: "design_reuse_flow", EVIDENCE_QUERY: "evidence", COMPARISON_QUERY: "comparison", IMPLEMENTATION_LIFECYCLE_QUERY: "implementation_lifecycle", EVALUATION_PLANNING_QUERY: "evaluation_planning", LIBRARY_OVERVIEW_QUERY: "library_overview", NEGATIVE_OR_EXISTENCE_QUERY: "existence", CLARIFICATION_QUERY: "clarification" };
  return map[intent];
}

function outputShapeForIntent(intent: OkfChatIntent): OkfQueryPlan["output_shape"] {
  if (intent === "DESIGN_REUSE_FLOW_QUERY" || intent === "DSR_FLOW_QUERY") return "Requirement -> Principle -> Feature -> Artifact";
  if (intent === "PAPER_ELEMENT_QUERY") return "element_list";
  if (intent === "LIBRARY_STATS_QUERY") return "stats";
  if (intent === "LIBRARY_COVERAGE_QUERY") return "library_coverage";
  if (intent === "PAPER_DISCOVERY_QUERY" || intent === "NEGATIVE_OR_EXISTENCE_QUERY") return "paper_list";
  if (intent === "EVIDENCE_QUERY") return "evidence";
  if (intent === "COMPARISON_QUERY") return "comparison";
  if (intent === "IMPLEMENTATION_LIFECYCLE_QUERY") return "lifecycle";
  if (intent === "LIBRARY_OVERVIEW_QUERY") return "overview";
  if (intent === "CLARIFICATION_QUERY") return "clarification";
  return "open";
}

function requiredSectionsForIntent(intent: OkfChatIntent) {
  const map: Record<OkfChatIntent, string[]> = { LIBRARY_STATS_QUERY: ["direct_answer", "counts"], LIBRARY_COVERAGE_QUERY: ["direct_answer", "categories"], PAPER_DISCOVERY_QUERY: ["strong_matches", "partial_matches"], PAPER_ELEMENT_QUERY: ["exact_elements"], DSR_FLOW_QUERY: ["relation_backed_rows"], DESIGN_REUSE_QUERY: ["design_moves", "architecture_direction", "limitations"], DESIGN_REUSE_FLOW_QUERY: ["design_moves", "flow_rows", "evidence"], EVIDENCE_QUERY: ["evidence_by_paper"], COMPARISON_QUERY: ["comparison_rows", "reuse_implications"], IMPLEMENTATION_LIFECYCLE_QUERY: ["lifecycle_stages", "roles_models"], EVALUATION_PLANNING_QUERY: ["evaluation_options", "limitations"], LIBRARY_OVERVIEW_QUERY: ["loaded_papers"], NEGATIVE_OR_EXISTENCE_QUERY: ["strict_result", "related_caveat"], CLARIFICATION_QUERY: ["clarification"] };
  return map[intent];
}

function constraintsForIntent(intent: OkfChatIntent) {
  const generic = ["Use only loaded OKF papers, concepts, relations, and evidence."];
  if (intent === "LIBRARY_STATS_QUERY") return [...generic, "Return exact counts from the loaded OKF index."];
  if (intent === "LIBRARY_COVERAGE_QUERY") return [...generic, "Classify only loaded papers and do not invent non-blockchain literature."];
  if (intent === "PAPER_DISCOVERY_QUERY") return [...generic, "Return ranked papers, not a design recommendation."];
  if (intent === "PAPER_ELEMENT_QUERY") return [...generic, "Hard-filter to named paper and requested element types."];
  if (intent === "DSR_FLOW_QUERY") return [...generic, "Use stored relations first; mark only genuine bridge nodes as query-generated."];
  if (intent === "NEGATIVE_OR_EXISTENCE_QUERY") return [...generic, "Do not turn related mechanisms into formal stored principles."];
  return generic;
}

function thingsToAvoidForIntent(intent: OkfChatIntent) {
  if (intent === "LIBRARY_STATS_QUERY") return ["generic estimates", "architecture recommendation"];
  if (intent === "LIBRARY_COVERAGE_QUERY") return ["generic retrieval ranking", "inventing non-loaded non-blockchain papers", "architecture recommendation"];
  if (intent === "PAPER_DISCOVERY_QUERY") return ["architecture recommendation", "generic blockchain/privacy advice"];
  if (intent === "PAPER_ELEMENT_QUERY") return ["unrelated papers", "recommendation prose"];
  if (intent === "DSR_FLOW_QUERY") return ["raw graph dump", "generic design moves"];
  if (intent === "IMPLEMENTATION_LIFECYCLE_QUERY") return ["unrequested domain-specific patterns", "invented lifecycle stages"];
  if (intent === "NEGATIVE_OR_EXISTENCE_QUERY") return ["inventing a formal design principle"];
  return ["unsupported claims", "raw IDs in final prose"];
}

function synthesisPolicyForIntent(intent: OkfChatIntent): OkfAnswerPlan["synthesis_policy"] {
  if (["DESIGN_REUSE_QUERY", "DESIGN_REUSE_FLOW_QUERY", "COMPARISON_QUERY", "EVALUATION_PLANNING_QUERY"].includes(intent)) return "llm_optional";
  return "deterministic";
}

function strictMechanismTerms(query: string) {
  const q = normalizeText(query);
  if (/zero knowledge|zero-knowledge|\bzkp\b/.test(q)) return ["zero knowledge", "zero-knowledge", "zkp"];
  if (/tokenization/.test(q)) return ["tokenization"];
  return tokenizePolicy(query).filter((term) => !["formal", "stored", "explicit", "named", "design", "principle", "principles", "paper", "papers", "uses", "use"].includes(term));
}
function evidenceForConcepts(concepts: OkfConcept[], kb: OkfKnowledgeBase) {
  const ids = new Set(concepts.map((concept) => concept.concept_id));
  return kb.evidence_items.filter((item) => item.concept_id && ids.has(item.concept_id));
}

function toEvidenceDto(item: OkfEvidenceItem) {
  return { evidence_id: item.evidence_id, paper_id: item.paper_id, concept_id: item.concept_id, paraphrase: item.paraphrase, quote: item.quote, confidence: item.confidence, section: item.section, page_number: item.page_number };
}

function cardForConcept(concept: OkfConcept, kb: OkfKnowledgeBase): OkfRecommendationCard {
  return { title: concept.title, concept_id: concept.concept_id, paper_id: concept.paper_id, evidence_ids: kb.evidence_items.filter((item) => item.concept_id === concept.concept_id).map((item) => item.evidence_id), confidence: concept.confidence };
}

function scoreConcept(concept: OkfConcept, terms: string[], kb: OkfKnowledgeBase) {
  const text = conceptText(concept, kb);
  return terms.reduce((sum, term) => sum + (text.includes(normalizeText(term)) ? 1 : 0), 0);
}

function conceptText(concept: OkfConcept, kb: OkfKnowledgeBase) {
  const evidence = kb.evidence_items.filter((item) => item.concept_id === concept.concept_id).map((item) => `${item.paraphrase} ${item.quote ?? ""}`).join(" ");
  return normalizeText([concept.title, concept.description, concept.body_text, concept.tags.join(" "), concept.type, concept.dsr_layer, evidence].join(" "));
}

function conceptPoolText(concepts: OkfConcept[], kb: OkfKnowledgeBase) {
  return normalizeText(concepts.map((concept) => conceptText(concept, kb)).join(" "));
}

function orderConcepts(concepts: OkfConcept[]) {
  return uniqueConcepts(concepts).sort((a, b) => orderedTypes.indexOf(a.type) - orderedTypes.indexOf(b.type) || a.concept_id.localeCompare(b.concept_id));
}

function uniqueConcepts(concepts: OkfConcept[]) {
  const seen = new Set<string>();
  return concepts.filter((concept) => { if (seen.has(concept.concept_id)) return false; seen.add(concept.concept_id); return true; });
}

function formatConceptSection(title: string, concepts: OkfConcept[]) {
  return concepts.length ? `${title}:\n${concepts.map((concept, index) => `${index + 1}. ${concept.title}`).join("\n")}` : `${title}: none stored in the requested scope.`;
}

function labelForType(type: OkfConceptType) {
  if (type === "Design Requirement") return "Design requirements";
  if (type === "Design Principle") return "Design principles";
  if (type === "Design Feature") return "Design features";
  if (type === "Artifact") return "Artifacts";
  if (type === "Evaluation") return "Evaluation";
  if (type === "Output Knowledge") return "Output knowledge";
  return type;
}

function readableType(type: OkfConceptType, count: number) {
  const plural = count === 1 ? "" : "s";
  if (type === "Design Requirement") return `design requirement${plural}`;
  if (type === "Design Principle") return `design principle${plural}`;
  if (type === "Design Feature") return `design feature${plural}`;
  if (type === "Artifact") return `artifact pattern${plural}`;
  if (type === "Evaluation") return `evaluation item${plural}`;
  return `${type}${plural}`;
}

function paperTitle(paperId: string, kb: OkfKnowledgeBase) {
  return kb.papers.find((paper) => paper.paper_id === paperId)?.title ?? paperId;
}

function groupBy<T, K>(items: T[], key: (item: T) => K) {
  const grouped = new Map<K, T[]>();
  for (const item of items) grouped.set(key(item), [...(grouped.get(key(item)) ?? []), item]);
  return grouped;
}









