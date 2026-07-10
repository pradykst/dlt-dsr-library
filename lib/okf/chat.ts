import { buildOkfFlow } from "./flow.ts";
import { getOkfKnowledgeBase } from "./retrieval.ts";
import type { ConfidenceLabel, DesignMove, OkfAnswerPayload, OkfChatIntent, OkfConcept, OkfConceptType, OkfEvidenceItem, OkfKnowledgeBase, OkfPaper, OkfReuseFlowRow, LlmSynthesisResult, OkfRuntimeMetadata, OkfTaskType } from "./schema.ts";
import { validateChatResponse } from "./validator.ts";
import { buildReuseFlowResponse } from "./reuse.ts";
import { buildDeterministicQueryPlan, planOkfQuery, type QueryPlan } from "./query-planner.ts";
import { detectDeterministicIntent } from "./query-interpreter.ts";
export { selectSourcePapers } from "./reuse.ts";
import { expandPolicyTerms, extractQueryCriteria, normalizeText, paperContribution, paperRoleLabel, paperRoleReason, selectPolicySourcePapers, tokenizePolicy, unique, type PolicyThemeId, type QueryCriteria } from "./policy.ts";

export type OkfRecommendationCard = { title: string; concept_id?: string; evidence_ids: string[]; confidence: string; paper_id?: string };
export type OkfSourcePaper = { paper_id: string; title: string; role: string; reason: string; requirements_count: number; principles_count: number; features_count: number; evidence_count: number; score?: number; match_strength?: "strong" | "partial" | "weak" };
export type LibraryStatsAnswer = { intent: "LIBRARY_STATS_QUERY"; direct_answer: string; counts: { papers: number; concepts_total: number; by_type: Record<string, number>; relations: number; evidence_items: number; by_review_status: Record<string, { papers: number; concepts: number }>; by_paper: Array<{ paper_id: string; title: string; concepts: number; evidence_items: number; relations: number; by_type: Record<string, number> }> }; caveats: string[] };
export type LibraryCoverageAnswer = { intent: "LIBRARY_COVERAGE_QUERY"; direct_answer: string; categories: Array<{ category: string; papers: Array<{ paper_id: string; title: string; reason: string }>; count: number }>; no_match_note?: string };
export type OkfQueryPlan = { intent: OkfChatIntent; task_type: OkfTaskType; output_shape: "Requirement -> Principle -> Feature -> Artifact" | "element_list" | "paper_list" | "evidence" | "comparison" | "lifecycle" | "overview" | "stats" | "library_coverage" | "clarification" | "open"; targetPaper?: OkfPaper; requestedTypes: OkfConceptType[]; isCrossPaper: boolean; domainTerms: string[]; criteria: QueryCriteria; query_plan: QueryPlan };
export type OkfPaperMatch = { paper_id: string; title: string; match_strength: "strong" | "partial" | "weak"; matched_criteria: string[]; matched_element_types: OkfConceptType[]; top_relevant_concepts: string[]; evidence_count: number; short_reason: string };
export type OkfAnswerPlan = { intent: OkfChatIntent; user_query: string; query_plan: QueryPlan; answer_shape: OkfQueryPlan["output_shape"]; selected_papers: Array<{ paper_id: string; title: string; role_for_query: string; reason_for_selection: string; relevance_score: number; matched_criteria: string[]; top_concepts: string[]; top_evidence: string[] }>; required_sections: string[]; extraction_items: Array<{ concept_id: string; paper_id: string; type: OkfConceptType; title: string }>; paper_matches: OkfPaperMatch[]; design_moves: DesignMove[]; flow_rows: OkfReuseFlowRow[]; comparison_rows: Array<{ paper_id: string; title: string; element_type: string; summary: string }>; evidence_pack: Array<{ evidence_id: string; paper_id: string; concept_id?: string; excerpt: string; confidence: ConfidenceLabel }>; constraints: string[]; things_to_avoid: string[]; synthesis_policy: "deterministic" | "groq_optional" | "groq_preferred"; criteria: QueryCriteria };
export type OkfChatResponse = { intent: OkfChatIntent; task_type?: OkfTaskType; answer: string; interpreted_problem?: string; requirements: OkfRecommendationCard[]; principles: OkfRecommendationCard[]; features: OkfRecommendationCard[]; artifact_direction: OkfRecommendationCard[]; source_papers: OkfSourcePaper[]; retrieved_concepts: OkfConcept[]; evidence: { evidence_id: string; paper_id: string; concept_id?: string; paraphrase: string; quote?: string; confidence: string; section?: string; page_number?: number }[]; flow: ReturnType<typeof buildOkfFlow>; flow_graph: ReturnType<typeof buildOkfFlow>; flow_rows?: OkfReuseFlowRow[]; library_stats?: LibraryStatsAnswer; library_coverage?: LibraryCoverageAnswer; answer_payload?: OkfAnswerPayload; answer_plan?: OkfAnswerPlan; assumptions: string[]; limitations: string[]; warnings: string[]; runtime?: OkfRuntimeMetadata; llm_synthesis?: LlmSynthesisResult };

const knownPolicyThemeIds = new Set<PolicyThemeId>(["integrity", "commercial_privacy", "identity_credentials", "trust_reputation", "auditability_status", "consent_control", "token_incentives", "fair_marketplace", "implementation_lifecycle", "iot_sensor_protection", "forecasting_oracle_payment", "scalability_hybrid_storage", "governance_dispute", "evaluation"]);

function isPolicyThemeId(value: string): value is PolicyThemeId {
  return knownPolicyThemeIds.has(value as PolicyThemeId);
}
const orderedTypes: OkfConceptType[] = ["Problem", "ResearchQuestion", "DesignRequirement", "DesignPrinciple", "DesignFeature", "Artifact", "Evaluation", "OutputKnowledge", "KernelTheory", "Limitation"];

export function routeOkfQuery(query: string, kb: OkfKnowledgeBase = getOkfKnowledgeBase()): OkfChatIntent {
  return detectDeterministicIntent(query, kb);
}
export function analyzeOkfQuery(query: string, intent: OkfChatIntent = routeOkfQuery(query), kb: OkfKnowledgeBase = getOkfKnowledgeBase(), queryPlan: QueryPlan = buildDeterministicQueryPlan(query, intent, kb)): OkfQueryPlan {
  const extracted = extractQueryCriteria(query, kb);
  const plannedPaperIds = queryPlan.named_papers.filter((paperId) => kb.papers.some((paper) => paper.paper_id === paperId));
  const namedPaperIds = unique([...plannedPaperIds, ...extracted.namedPaperIds]);
  const targetPaper = namedPaperIds[0] ? kb.papers.find((paper) => paper.paper_id === namedPaperIds[0]) : undefined;
  const plannedTypes = queryPlan.requested_element_types.filter((type): type is OkfConceptType => orderedTypes.includes(type as OkfConceptType));
  const requestedTypes = plannedTypes.length ? plannedTypes : extracted.requestedTypes.length ? extracted.requestedTypes : defaultRequestedTypes(intent);
  const criteria: QueryCriteria = {
    ...extracted,
    themes: unique([...extracted.themes, ...queryPlan.themes.filter(isPolicyThemeId)]),
    requestedTypes,
    namedPaperIds,
    mustHaveTerms: unique([...queryPlan.must_have_criteria, ...extracted.mustHaveTerms]).slice(0, 12),
    optionalTerms: unique([...queryPlan.optional_criteria, ...extracted.optionalTerms]).slice(0, 18)
  };
  const task_type = taskTypeForIntent(intent);
  return { intent, task_type, output_shape: outputShapeForIntent(intent), targetPaper, requestedTypes, isCrossPaper: queryPlan.requires_cross_paper || (!targetPaper && ["LIBRARY_COVERAGE_QUERY", "PAPER_DISCOVERY_QUERY", "DESIGN_REUSE_QUERY", "DESIGN_REUSE_FLOW_QUERY", "COMPARISON_QUERY", "EVALUATION_PLANNING_QUERY"].includes(intent)), domainTerms: criteria.mustHaveTerms, criteria, query_plan: queryPlan };
}

export async function answerOkfChat(query: string, kb: OkfKnowledgeBase = getOkfKnowledgeBase()): Promise<OkfChatResponse> {
  const deterministicIntent = routeOkfQuery(query, kb);
  const queryPlan = await planOkfQuery(query, deterministicIntent, kb);
  const plan = analyzeOkfQuery(query, queryPlan.intent, kb, queryPlan);
  const answerPlan = buildAnswerPlan(query, plan, kb);
  const response = attachAnswerPlan(buildDeterministicResponse(query, plan, answerPlan, kb), answerPlan, kb);
  const validation = validateChatResponse(response, kb);
  const answerPlanValidation = validateAnswerPlanResponse(response, kb);
  return { ...response, warnings: [...response.warnings, ...validation.warnings, ...answerPlanValidation] };
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
  const paperMatches = supports.map((support) => paperMatchForSupport(support, query, plan, kb));
  const selected_papers = supports.map((support) => {
    const paperConcepts = concepts.filter((concept) => concept.paper_id === support.paper_id);
    const paperEvidence = evidence.filter((item) => item.paper_id === support.paper_id);
    return { paper_id: support.paper_id, title: support.title, role_for_query: paperRoleLabel(support.paper_id, support.title), reason_for_selection: support.reason, relevance_score: support.score ?? 0, matched_criteria: paperMatches.find((match) => match.paper_id === support.paper_id)?.matched_criteria ?? [], top_concepts: paperConcepts.slice(0, 8).map((concept) => concept.title), top_evidence: paperEvidence.slice(0, 5).map((item) => item.paraphrase) };
  });
  return {
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
}

function selectedPaperSupports(query: string, plan: OkfQueryPlan, kb: OkfKnowledgeBase) {
  if (plan.intent === "LIBRARY_STATS_QUERY") return [];
  if (plan.intent === "LIBRARY_OVERVIEW_QUERY" || plan.intent === "LIBRARY_COVERAGE_QUERY") return kb.papers.map((paper) => ({ paper_id: paper.paper_id, title: paper.title, reason: paperContribution(paper.paper_id, paper.title), score: 100 }));
  if (plan.targetPaper) return [{ paper_id: plan.targetPaper.paper_id, title: plan.targetPaper.title, reason: "Named paper hard filter.", score: 1000 }];
  if (plan.intent === "IMPLEMENTATION_LIFECYCLE_QUERY") return forcePapers(["INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024"], kb);
  if (plan.intent === "NEGATIVE_OR_EXISTENCE_QUERY") return selectPolicySourcePapers(query, kb, 6, plan.criteria);
  if (plan.intent === "EVIDENCE_QUERY") return selectPolicySourcePapers(query, kb, 6, plan.criteria);
  if (plan.intent === "DSR_FLOW_QUERY" && (plan.criteria.themes.includes("iot_sensor_protection") || /sensor|iot|source-to-sink|cross-validation/i.test(query))) return forcePapers(["BLOCKCHAIN_IOT_SDPS_2019"], kb);
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
  if (plan.intent === "IMPLEMENTATION_LIFECYCLE_QUERY") return orderConcepts(kb.concepts.filter((concept) => paperSet.has(concept.paper_id) && ["DesignRequirement", "DesignPrinciple", "DesignFeature", "Artifact", "Evaluation", "OutputKnowledge", "Limitation"].includes(concept.type))).slice(0, 80);
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
  const reuse = buildReuseFlowResponse(query, { ...plan, intent: "DESIGN_REUSE_FLOW_QUERY", task_type: "design_reuse_flow", output_shape: "Requirement -> Principle -> Feature -> Artifact", isCrossPaper: true }, kb);
  const intent = plan.intent === "DESIGN_REUSE_QUERY" ? "DESIGN_REUSE_QUERY" : "DESIGN_REUSE_FLOW_QUERY";
  return { ...reuse, intent, task_type: plan.task_type, answer_plan: { ...answerPlan, design_moves: reuse.answer_payload?.design_moves ?? [], flow_rows: reuse.flow_rows ?? [], evidence_pack: reuse.evidence.map((item) => ({ evidence_id: item.evidence_id, paper_id: item.paper_id, concept_id: item.concept_id, excerpt: item.quote ?? item.paraphrase, confidence: item.confidence as ConfidenceLabel })) } };
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
  const by_review_status: Record<string, { papers: number; concepts: number }> = {
    reviewed: { papers: kb.papers.filter((paper) => paper.review_status === "reviewed").length, concepts: kb.concepts.filter((concept) => concept.review_status === "reviewed").length },
    draft: { papers: kb.papers.filter((paper) => paper.review_status === "draft").length, concepts: kb.concepts.filter((concept) => concept.review_status === "draft").length }
  };
  const by_paper = kb.papers.map((paper) => {
    const concepts = kb.concepts.filter((concept) => concept.paper_id === paper.paper_id);
    const conceptIds = new Set(concepts.map((concept) => concept.concept_id));
    return { paper_id: paper.paper_id, title: paper.title, concepts: concepts.length, evidence_items: kb.evidence_items.filter((item) => item.paper_id === paper.paper_id).length, relations: kb.relations.filter((relation) => conceptIds.has(relation.source_concept_id) || conceptIds.has(relation.target_concept_id)).length, by_type: countBy(concepts, (concept) => concept.type) };
  });
  const counts = { papers: kb.papers.length, concepts_total: kb.concepts.length, by_type, relations: kb.relations.length, evidence_items: kb.evidence_items.length, by_review_status, by_paper };
  const caveats: string[] = [];
  const ambiguousQuestions = /\bquestions?\b/.test(q) && !/\bresearch questions?\b/.test(q);
  const requestedType = statsConceptTypeForQuery(q);
  let direct_answer: string;

  if (ambiguousQuestions) {
    const count = by_type.ResearchQuestion ?? 0;
    direct_answer = `Do you mean research questions extracted from papers, or example/user questions? Interpreting it as ResearchQuestion concepts, the OKF library currently contains ${count} ResearchQuestion concept(s).`;
    caveats.push("The word questions is ambiguous; the likely OKF interpretation is ResearchQuestion concepts.");
  } else if (requestedType && /reviewed|draft/.test(q)) {
    const concepts = kb.concepts.filter((concept) => concept.type === requestedType);
    const reviewed = concepts.filter((concept) => concept.review_status === "reviewed").length;
    const draft = concepts.filter((concept) => concept.review_status === "draft").length;
    direct_answer = `The OKF library currently contains ${concepts.length} ${readableType(requestedType, concepts.length)}: ${reviewed} reviewed and ${draft} draft.`;
  } else if (requestedType) {
    const count = by_type[requestedType] ?? 0;
    direct_answer = `The OKF library currently contains ${count} ${readableType(requestedType, count)}.`;
  } else if (/papers?/.test(q) && /evaluation|evaluations|evaluated|evaluation evidence/.test(q)) {
    const paperIds = new Set(kb.concepts.filter((concept) => concept.type === "Evaluation" && kb.evidence_items.some((item) => item.concept_id === concept.concept_id)).map((concept) => concept.paper_id));
    direct_answer = `${paperIds.size} paper(s) currently have Evaluation concepts with linked evidence in the OKF library.`;
  } else if (/papers?/.test(q) && /reviewed|draft/.test(q)) {
    direct_answer = `The OKF library currently contains ${by_review_status.reviewed.papers} reviewed paper(s) and ${by_review_status.draft.papers} draft paper(s).`;
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
  if (/research questions?/.test(q)) return "ResearchQuestion";
  if (/design requirements?|\brequirements?\b/.test(q)) return "DesignRequirement";
  if (/design principles?|\bprinciples?\b/.test(q)) return "DesignPrinciple";
  if (/design features?|\bfeatures?\b/.test(q)) return "DesignFeature";
  if (/artifacts?|artifact patterns?/.test(q)) return "Artifact";
  if (/evaluations?|evaluation criteria/.test(q) && !/papers?/.test(q)) return "Evaluation";
  if (/output knowledge/.test(q)) return "OutputKnowledge";
  if (/kernel theor/.test(q)) return "KernelTheory";
  if (/limitations?/.test(q)) return "Limitation";
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
  const lines = [`The loaded OKF library currently contains ${kb.papers.length} paper(s):`, ...kb.papers.map((paper, index) => `${index + 1}. ${paper.title} - ${paperContribution(paper.paper_id, paper.title)}`)];
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

function paperElementResponse(_query: string, plan: OkfQueryPlan, answerPlan: OkfAnswerPlan, kb: OkfKnowledgeBase): OkfChatResponse {
  const target = plan.targetPaper ?? kb.papers.find((paper) => paper.paper_id === answerPlan.selected_papers[0]?.paper_id);
  const concepts = orderConcepts(kb.concepts.filter((concept) => concept.paper_id === target?.paper_id && plan.requestedTypes.includes(concept.type)));
  const evidence = evidenceForConcepts(concepts, kb);
  const counts = plan.requestedTypes.map((type) => `${concepts.filter((concept) => concept.type === type).length} ${readableType(type, concepts.filter((concept) => concept.type === type).length)}`).join(" and ");
  const answer = [`${target?.title ?? "The named paper"} contributes ${counts} in the requested OKF scope.`, ...plan.requestedTypes.map((type) => formatConceptSection(labelForType(type), concepts.filter((concept) => concept.type === type))), `Evidence note: ${evidence.length} evidence item(s) are linked to these extracted elements.`].filter(Boolean).join("\n\n");
  return baseResponse(plan.intent, answer, concepts, evidence.map(toEvidenceDto), buildOkfFlow("paper-elements", concepts, kb), sourcePapersForIds(target ? [target.paper_id] : [], concepts, kb, answerPlan), { task_type: plan.task_type, requirements: concepts.filter((concept) => concept.type === "DesignRequirement").map((concept) => cardForConcept(concept, kb)), principles: concepts.filter((concept) => concept.type === "DesignPrinciple").map((concept) => cardForConcept(concept, kb)), features: concepts.filter((concept) => concept.type === "DesignFeature").map((concept) => cardForConcept(concept, kb)), artifact_direction: concepts.filter((concept) => concept.type === "Artifact").map((concept) => cardForConcept(concept, kb)), answer_plan: { ...answerPlan, extraction_items: concepts.map((concept) => ({ concept_id: concept.concept_id, paper_id: concept.paper_id, type: concept.type, title: concept.title })) } });
}

function negativeResponse(query: string, plan: OkfQueryPlan, answerPlan: OkfAnswerPlan, kb: OkfKnowledgeBase): OkfChatResponse {
  const terms = strictMechanismTerms(query);
  const strict = kb.concepts.filter((concept) => concept.type === "DesignPrinciple" && concept.extraction_type !== "inferred" && terms.some((term) => conceptText(concept, kb).includes(normalizeText(term))));
  const related = conceptsForPlan(query, { ...plan, intent: "PAPER_DISCOVERY_QUERY" }, answerPlan.selected_papers.map((paper) => paper.paper_id), kb).slice(0, 12);
  const evidence = evidenceForConcepts(related, kb);
  const answer = strict.length
    ? `The loaded OKF library has ${strict.length} formal stored design principle match(es):\n${strict.map((concept, index) => `${index + 1}. ${concept.title} (${paperTitle(concept.paper_id, kb)})`).join("\n")}`
    : [`I did not find a formal stored DesignPrinciple in the loaded OKF library that matches ${plan.criteria.mustHaveTerms.slice(0, 3).join(", ") || "the requested mechanism"}.`, related.length ? `Related stored OKF material exists, but it is not a formal design principle match:\n${related.slice(0, 5).map((concept, index) => `${index + 1}. ${concept.title} (${concept.type}, ${paperTitle(concept.paper_id, kb)})`).join("\n")}` : "I did not find a grounded related mechanism either."].join("\n\n");
  return baseResponse(plan.intent, answer, related, evidence.map(toEvidenceDto), buildOkfFlow("negative-query", related, kb), sourcePapersForIds(unique(related.map((concept) => concept.paper_id)), related, kb, answerPlan), { task_type: plan.task_type, answer_plan: { ...answerPlan, extraction_items: related.map((concept) => ({ concept_id: concept.concept_id, paper_id: concept.paper_id, type: concept.type, title: concept.title })) } });
}

function flowResponse(query: string, plan: OkfQueryPlan, answerPlan: OkfAnswerPlan, kb: OkfKnowledgeBase): OkfChatResponse {
  const paperIds = answerPlan.selected_papers.map((paper) => paper.paper_id).slice(0, plan.targetPaper ? 1 : 3);
  const concepts = flowConcepts(query, paperIds, kb);
  const rows = buildStoredFlowRows(concepts, kb).slice(0, 12);
  const evidence = evidenceForConcepts(concepts, kb);
  const subject = humanReadableFlowSubject(query);
  const flow = buildOkfFlow(query, concepts, kb, { mode: "stored_paper_flow", storedOnly: true, title: "Stored OKF relation flow" });
  const paperTitleText = paperIds.length === 1 ? ` in ${shortPaperTitle(paperTitle(paperIds[0], kb))}` : "";
  const subjectPhrase = subject.toLowerCase().startsWith("from ") ? subject : `for ${subject}`;
  const layerCounts = countFlowGraphLayers(flow);
  const answer = [
    `The relation-backed flow ${subjectPhrase} is built from stored OKF relations${paperTitleText}. The graph connects ${layerCounts.Requirement} requirement(s) to ${layerCounts.Principle} principle(s), ${layerCounts.Feature} feature(s), and ${layerCounts.Artifact} artifact node(s).`,
    "The layered graph is in the Flow tab.",
    rows.length ? `Short branch summary:\n${flowBranchSummary(rows)}` : "No stored Requirement -> Principle -> Feature path matched the query. I did not infer extra links.",
    `Coverage note: ${flow.edges.length} stored relation edge(s), ${evidence.length} linked evidence item(s).`
  ].join("\n\n");
  return baseResponse(plan.intent, answer, concepts, evidence.map(toEvidenceDto), flow, sourcePapersForIds(paperIds, concepts, kb, answerPlan), { task_type: plan.task_type, flow_rows: rows, answer_plan: { ...answerPlan, flow_rows: rows, evidence_pack: evidence.map((item) => ({ evidence_id: item.evidence_id, paper_id: item.paper_id, concept_id: item.concept_id, excerpt: item.quote ?? item.paraphrase, confidence: item.confidence })) } });
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
  const types = plan.requestedTypes.length ? plan.requestedTypes : ["DesignPrinciple", "DesignFeature", "Artifact", "Evaluation"];
  const concepts = conceptsForPlan(query, plan, paperIds, kb);
  const evidence = evidenceForConcepts(concepts, kb);
  const rows = paperIds.flatMap((paperId) => types.map((type) => ({ paper_id: paperId, title: paperTitle(paperId, kb), element_type: type, summary: concepts.filter((concept) => concept.paper_id === paperId && concept.type === type).slice(0, 3).map((concept) => concept.title).join("; ") || "No direct retrieved element." })));
  const answer = [`Comparison by paper and DSR element type:`, ...rows.map((row) => `- ${row.title} / ${row.element_type}: ${row.summary}`), `Reuse implication: use the similarities as reusable patterns and treat paper-specific mechanisms as context-bound unless the same criteria appear in your design problem.`].join("\n");
  return baseResponse(plan.intent, answer, concepts, evidence.map(toEvidenceDto), buildOkfFlow(query, concepts, kb), sourcePapersForIds(paperIds, concepts, kb, answerPlan), { task_type: plan.task_type, answer_plan: { ...answerPlan, comparison_rows: rows } });
}

function lifecycleResponse(query: string, plan: OkfQueryPlan, answerPlan: OkfAnswerPlan, kb: OkfKnowledgeBase): OkfChatResponse {
  const paperId = "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024";
  const concepts = orderConcepts(kb.concepts.filter((concept) => concept.paper_id === paperId && ["DesignRequirement", "DesignPrinciple", "DesignFeature", "Artifact", "Evaluation", "OutputKnowledge", "Limitation"].includes(concept.type)));
  const evidence = evidenceForConcepts(concepts, kb);
  const stages = [
    "1. Analysis - assess readiness, analyze technology, identify participants, develop use cases, and approve the agreement.",
    "2. Preliminary design - decide on/off-chain partitioning, blockchain type, smart-contract skeleton, and platform.",
    "3. Detailed design - define consensus, interactions, security, permissions, gas/cost, dispute handling, and replication.",
    "4. Construction - implement and test smart contracts; integrate off-chain systems.",
    "5. Transition - configure the system and publish/deploy smart contracts.",
    "6. Maintenance - monitor nodes and evaluate contract correctness.",
    "7. Retirement - terminate or migrate/retire contracts and data when needed."
  ];
  const answer = [
    "Use the integrated blockchain ISDM framework as the backbone.",
    "Lifecycle stages: analysis -> preliminary design -> detailed design -> construction -> transition -> maintenance -> retirement.",
    `Lifecycle stages:\n${stages.join("\n")}`,
    "Roles: blockchain user, legal professional, architect, security/core blockchain developer, smart contract developer, integrator/auditor, and node operator/miner where relevant.",
    "Models: use case, prototype, requirements, smart contract/base architecture, data flow/interactions/consensus/transactions, and executable smart contracts.",
    "Boundary: add domain-specific privacy, IoT, or identity patterns only after the lifecycle framing is in place."
  ].join("\n\n");
  return baseResponse(plan.intent, answer, concepts, evidence.map(toEvidenceDto), buildOkfFlow(query, concepts, kb), sourcePapersForIds([paperId], concepts, kb, answerPlan), { task_type: plan.task_type, answer_plan: answerPlan });
}

function evaluationPlanningResponse(query: string, plan: OkfQueryPlan, answerPlan: OkfAnswerPlan, kb: OkfKnowledgeBase): OkfChatResponse {
  const paperIds = answerPlan.selected_papers.map((paper) => paper.paper_id).slice(0, 8);
  const concepts = orderConcepts(kb.concepts.filter((concept) => paperIds.includes(concept.paper_id) && ["Evaluation", "OutputKnowledge", "Limitation", "Artifact"].includes(concept.type)));
  const evidence = evidenceForConcepts(concepts, kb);
  const byPaper = groupBy(concepts.filter((concept) => concept.type === "Evaluation"), (concept) => concept.paper_id);
  const answer = [`Use the retrieved Evaluation concepts as options, then choose by artifact maturity and domain fit.`, ...[...byPaper.entries()].map(([paperId, items]) => `${paperTitle(paperId, kb)}: ${items.map((item) => item.title).join("; ")}`), `Fit guidance: early artifacts need demonstration/prototype evaluation; mature artifacts need scenario, stakeholder, operational, or field-style evaluation. Limitations in the retrieved papers should become risks to validate.`].join("\n\n");
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
    return { paper_id: paperId, title: paper?.title ?? paperId, role: paperRoleLabel(paperId, paper?.title), reason: planned?.reason_for_selection ?? paperRoleReason(paperId), requirements_count: paperConcepts.filter((concept) => concept.type === "DesignRequirement").length, principles_count: paperConcepts.filter((concept) => concept.type === "DesignPrinciple").length, features_count: paperConcepts.filter((concept) => concept.type === "DesignFeature").length, evidence_count: evidenceCount, score: planned?.relevance_score, match_strength: match?.match_strength };
  }).sort(compareSourcePapers);
}

function emptyFlow(id: string) {
  const graph_id = `flow:${id}:0:0`;
  return { graph_id, flow_id: graph_id, title: "No flow requested", mode: "stored_paper_flow" as const, layers: ["Problem", "Requirement", "Principle", "Feature", "Artifact", "Evaluation", "OutputKnowledge"] as ReturnType<typeof buildOkfFlow>["layers"], nodes: [], edges: [], evidence_refs: [], warnings: [] };
}

function flowConcepts(query: string, paperIds: string[], kb: OkfKnowledgeBase) {
  const terms = expandPolicyTerms(tokenizePolicy(query));
  const paperSet = new Set(paperIds.length ? paperIds : selectPolicySourcePapers(query, kb, 3).map((paper) => paper.paper_id));
  const initial = kb.concepts.filter((concept) => paperSet.has(concept.paper_id) && ["DesignRequirement", "DesignPrinciple", "DesignFeature", "Artifact"].includes(concept.type));
  const matched = initial.filter((concept) => scoreConcept(concept, terms, kb) > 0);
  const ids = new Set((matched.length ? matched : initial.filter((concept) => concept.type === "DesignRequirement")).map((concept) => concept.concept_id));
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

function buildStoredFlowRows(concepts: OkfConcept[], kb: OkfKnowledgeBase): OkfReuseFlowRow[] {
  const byId = new Map(concepts.map((concept) => [concept.concept_id, concept]));
  const outgoing = new Map<string, typeof kb.relations>();
  for (const relation of kb.relations) if (byId.has(relation.source_concept_id) && byId.has(relation.target_concept_id)) outgoing.set(relation.source_concept_id, [...(outgoing.get(relation.source_concept_id) ?? []), relation]);
  const rows: OkfReuseFlowRow[] = [];
  for (const requirement of concepts.filter((concept) => concept.type === "DesignRequirement")) {
    const principleRelations = (outgoing.get(requirement.concept_id) ?? []).filter((relation) => byId.get(relation.target_concept_id)?.type === "DesignPrinciple");
    for (const pr of principleRelations) {
      const principle = byId.get(pr.target_concept_id);
      if (!principle) continue;
      const featureRelations = (outgoing.get(principle.concept_id) ?? []).filter((relation) => byId.get(relation.target_concept_id)?.type === "DesignFeature");
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

function paperMatchForSupport(support: { paper_id: string; title: string; reason: string; score?: number }, query: string, plan: OkfQueryPlan, kb: OkfKnowledgeBase): OkfPaperMatch {
  const terms = expandPolicyTerms(tokenizePolicy(query));
  const concepts = kb.concepts.filter((concept) => concept.paper_id === support.paper_id);
  const matched = concepts.filter((concept) => (!plan.requestedTypes.length || plan.requestedTypes.includes(concept.type)) && scoreConcept(concept, terms, kb) > 0);
  const matchedCriteria = plan.criteria.mustHaveTerms.filter((term) => conceptPoolText(concepts, kb).includes(normalizeText(term)));
  const matchedTypes = unique(matched.map((concept) => concept.type));
  const evidenceCount = kb.evidence_items.filter((item) => item.paper_id === support.paper_id && (!item.concept_id || matched.some((concept) => concept.concept_id === item.concept_id))).length;
  const strength = paperMatchStrength({ support, plan, matchedCriteria, matchedTypes, matchedCount: matched.length, evidenceCount });
  return { paper_id: support.paper_id, title: support.title, match_strength: strength, matched_criteria: matchedCriteria.slice(0, 6), matched_element_types: matchedTypes.slice(0, 6), top_relevant_concepts: matched.slice(0, 5).map((concept) => concept.title), evidence_count: evidenceCount, short_reason: support.reason };
}

function paperMatchStrength({ support, plan, matchedCriteria, matchedTypes, matchedCount, evidenceCount }: { support: { paper_id: string; score?: number }; plan: OkfQueryPlan; matchedCriteria: string[]; matchedTypes: OkfConceptType[]; matchedCount: number; evidenceCount: number }): OkfPaperMatch["match_strength"] {
  if (plan.targetPaper?.paper_id === support.paper_id) return "strong";
  if (support.paper_id === "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024" && !plan.criteria.themes.includes("implementation_lifecycle")) return matchedCriteria.length ? "partial" : "weak";
  const mustHaveTarget = plan.criteria.mustHaveTerms.length ? Math.max(1, Math.ceil(plan.criteria.mustHaveTerms.length * 0.65)) : 0;
  const matchesMostCriteria = mustHaveTarget > 0 && matchedCriteria.length >= mustHaveTarget;
  const requestedTypeSatisfied = !plan.requestedTypes.length || plan.requestedTypes.some((type) => matchedTypes.includes(type));
  const isExplicitThemePrimary = answerPlanPrimaryPaper(plan, support.paper_id) && requestedTypeSatisfied && evidenceCount > 0;
  if (matchesMostCriteria || isExplicitThemePrimary) return "strong";
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
  return value.replace(/^Enable\s+/i, "").replace(/^Ensure\s+/i, "").replace(/^Data are certified on the basis of\s+/i, "").replace(/^Sensor data are certified on the basis of\s+/i, "").replace(/\.$/, "").trim();
}

function shortPaperTitle(title: string) {
  return title.includes(":") ? title.split(":")[0] : title;
}
function humanReadableFlowSubject(query: string) {
  const cleaned = query
    .replace(/[→]/g, "->")
    .replace(/^\s*(?:build|show me|show|create|generate|make|give me)\s+(?:a|an|the)?\s*/i, "")
    .replace(/^\s*(?:requirement\s*(?:->|to|\?)\s*principle\s*(?:->|to|\?)\s*feature(?:\s*(?:->|to)\s*artifact)?\s*)?(?:dsr\s*)?(?:flow|path|map|graph)\s*(?:for|about|around|of)?\s*/i, "")
    .replace(/\bsensor data\b/gi, "sensor-data")
    .replace(/\s+/g, " ")
    .replace(/[.?!]\s*$/, "")
    .trim();
  return cleaned || "the requested DSR subject";
}

function answerPlanPrimaryPaper(plan: OkfQueryPlan, paperId: string) {
  const themes = new Set(plan.criteria.themes);
  if (themes.has("commercial_privacy") && paperId === "SHORT_END_STICK_2025") return true;
  if (themes.has("identity_credentials") && paperId === "SSI_KYC_FRAMEWORK_2022") return true;
  if (themes.has("trust_reputation") && paperId === "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024") return true;
  if ((themes.has("iot_sensor_protection") || themes.has("scalability_hybrid_storage")) && paperId === "BLOCKCHAIN_IOT_SDPS_2019") return true;
  if (themes.has("implementation_lifecycle") && paperId === "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024") return true;
  if (themes.has("token_incentives") && paperId === "PEER_REVIEW_TOKEN_INCENTIVES_2025") return true;
  if (themes.has("fair_marketplace") && paperId === "NIL_NFT_MARKETPLACE_2026") return true;
  if (themes.has("consent_control") && paperId === "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023") return true;
  if (themes.has("forecasting_oracle_payment") && paperId === "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021") return true;
  return false;
}

function forcePapers(ids: string[], kb: OkfKnowledgeBase) {
  return ids.flatMap((paperId) => {
    const paper = kb.papers.find((item) => item.paper_id === paperId);
    return paper ? [{ paper_id: paper.paper_id, title: paper.title, reason: paperRoleReason(paper.paper_id), score: 1000 }] : [];
  });
}

function conceptsFromPlan(answerPlan: OkfAnswerPlan, kb: OkfKnowledgeBase) {
  const ids = new Set(answerPlan.extraction_items.map((item) => item.concept_id));
  return orderConcepts(kb.concepts.filter((concept) => ids.has(concept.concept_id)));
}

function selectedTypesForIntent(intent: OkfChatIntent, requested: OkfConceptType[]) {
  if (requested.length) return requested;
  if (intent === "EVALUATION_PLANNING_QUERY") return ["Evaluation", "OutputKnowledge", "Limitation", "Artifact"] as OkfConceptType[];
  if (intent === "PAPER_DISCOVERY_QUERY") return ["DesignRequirement", "DesignPrinciple", "DesignFeature", "Artifact", "Evaluation"] as OkfConceptType[];
  return ["DesignRequirement", "DesignPrinciple", "DesignFeature", "Artifact", "Evaluation", "OutputKnowledge", "Limitation"] as OkfConceptType[];
}

function defaultRequestedTypes(intent: OkfChatIntent): OkfConceptType[] {
  if (intent === "PAPER_ELEMENT_QUERY") return ["DesignRequirement", "DesignPrinciple", "DesignFeature", "Artifact"];
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
  if (intent === "IMPLEMENTATION_LIFECYCLE_QUERY") return ["IoT/HIE/privacy answer unless requested"];
  if (intent === "NEGATIVE_OR_EXISTENCE_QUERY") return ["inventing a formal design principle"];
  return ["unsupported claims", "raw IDs in final prose"];
}

function synthesisPolicyForIntent(intent: OkfChatIntent): OkfAnswerPlan["synthesis_policy"] {
  if (["DESIGN_REUSE_QUERY", "DESIGN_REUSE_FLOW_QUERY", "COMPARISON_QUERY", "EVALUATION_PLANNING_QUERY"].includes(intent)) return "groq_optional";
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
  if (type === "DesignRequirement") return "Design requirements";
  if (type === "DesignPrinciple") return "Design principles";
  if (type === "DesignFeature") return "Design features";
  if (type === "Artifact") return "Artifacts";
  if (type === "Evaluation") return "Evaluation";
  if (type === "OutputKnowledge") return "Output knowledge";
  if (type === "KernelTheory") return "Kernel theories";
  if (type === "Limitation") return "Limitations";
  return type;
}

function readableType(type: OkfConceptType, count: number) {
  const plural = count === 1 ? "" : "s";
  if (type === "DesignRequirement") return `design requirement${plural}`;
  if (type === "DesignPrinciple") return `design principle${plural}`;
  if (type === "DesignFeature") return `design feature${plural}`;
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









