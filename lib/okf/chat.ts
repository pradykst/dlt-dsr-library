import { buildOkfFlow } from "./flow.ts";
import { getConceptsByType, getOkfKnowledgeBase, getRelevantPapers, retrieveForDesignQuery, tokenize } from "./retrieval.ts";
import type { OkfAnswerPayload, OkfChatIntent, OkfConcept, OkfConceptType, OkfKnowledgeBase, OkfPaper, OkfReuseFlowRow, LlmSynthesisResult, OkfRuntimeMetadata, OkfTaskType } from "./schema.ts";
import { validateChatResponse } from "./validator.ts";
import { buildReuseFlowResponse, selectSourcePapers } from "./reuse.ts";

export { selectSourcePapers };

export type OkfRecommendationCard = { title: string; concept_id?: string; evidence_ids: string[]; confidence: string; paper_id?: string };
export type OkfSourcePaper = { paper_id: string; title: string; role: string; reason: string; requirements_count: number; principles_count: number; features_count: number; evidence_count: number; score?: number };
export type OkfQueryPlan = { intent: OkfChatIntent; task_type: OkfTaskType; output_shape: "Requirement -> Principle -> Feature -> Artifact" | "element_list" | "paper_list" | "evidence" | "open"; targetPaper?: OkfPaper; requestedTypes: OkfConceptType[]; isCrossPaper: boolean; domainTerms: string[] };
export type OkfChatResponse = { intent: OkfChatIntent; task_type?: OkfTaskType; answer: string; interpreted_problem?: string; requirements: OkfRecommendationCard[]; principles: OkfRecommendationCard[]; features: OkfRecommendationCard[]; artifact_direction: OkfRecommendationCard[]; source_papers: OkfSourcePaper[]; retrieved_concepts: OkfConcept[]; evidence: { evidence_id: string; paper_id: string; concept_id?: string; paraphrase: string; quote?: string; confidence: string; section?: string; page_number?: number }[]; flow: ReturnType<typeof buildOkfFlow>; flow_rows?: OkfReuseFlowRow[]; answer_payload?: OkfAnswerPayload; assumptions: string[]; limitations: string[]; warnings: string[]; runtime?: OkfRuntimeMetadata; llm_synthesis?: LlmSynthesisResult };

const reusePattern = /reuse|okf library|support each part|artifact patterns|which reusable|which papers|evidence|recommendation|recommend/i;
const crossPaperPattern = /which papers|papers support|support each part|reuse|okf library|evidence|artifact patterns|cross-paper|cross paper|multi-paper/i;
const flowPattern = /flow|graph|map|trace|connect|pathway|build a flow|show pathway|requirement\s*(?:\u2192|->|to)\s*principle\s*(?:\u2192|->|to)\s*feature/i;
const orderedTypes: OkfConceptType[] = ["Problem", "ResearchQuestion", "DesignRequirement", "DesignPrinciple", "DesignFeature", "Artifact", "Evaluation", "OutputKnowledge", "KernelTheory", "Limitation"];

export function routeOkfQuery(query: string): OkfChatIntent {
  const q = query.toLowerCase();
  if ((flowPattern.test(query) || reusePattern.test(q)) && /requirement|principle|feature|artifact|design/.test(q) && crossPaperPattern.test(q)) return "DESIGN_REUSE_FLOW_QUERY";
  if (flowPattern.test(query)) return "DSR_FLOW_QUERY";
  if (/which papers|what papers|papers use|papers mention/.test(q)) return "PAPER_LIST_QUERY";
  if (/explain paper|summarize paper|paper detail|tell me about paper/.test(q)) return "PAPER_DETAIL_QUERY";
  if (/evidence|quote|citation|support/.test(q) && !/design|reuse|requirement|principle|feature|artifact/.test(q)) return "EVIDENCE_QUERY";
  if (/compare|difference|across papers/.test(q)) return "COMPARE_QUERY";
  if (/requirements|design principles|principles|features|artifacts|evaluations|output knowledge|kernel theor|limitations/.test(q) && !crossPaperPattern.test(q)) return "DSR_ELEMENT_QUERY";
  if (/design|recommend|reuse|should|system|architecture|artifact|marketplace|prevent|protocol/.test(q)) return "DESIGN_RECOMMENDATION_QUERY";
  return "UNKNOWN_QUERY";
}

export function analyzeOkfQuery(query: string, intent: OkfChatIntent = routeOkfQuery(query), kb: OkfKnowledgeBase = getOkfKnowledgeBase()): OkfQueryPlan {
  const isCrossPaper = crossPaperPattern.test(query.toLowerCase()) || intent === "DESIGN_REUSE_FLOW_QUERY";
  return { intent, task_type: intent === "DESIGN_REUSE_FLOW_QUERY" ? "design_reuse_flow" : intent === "DESIGN_RECOMMENDATION_QUERY" || intent === "DSR_FLOW_QUERY" ? "design_recommendation" : intent === "DSR_ELEMENT_QUERY" ? "element_lookup" : intent === "PAPER_LIST_QUERY" ? "paper_lookup" : intent === "EVIDENCE_QUERY" ? "evidence_lookup" : "unknown", output_shape: intent === "DESIGN_REUSE_FLOW_QUERY" || flowPattern.test(query) ? "Requirement -> Principle -> Feature -> Artifact" : intent === "DSR_ELEMENT_QUERY" ? "element_list" : intent === "PAPER_LIST_QUERY" ? "paper_list" : intent === "EVIDENCE_QUERY" ? "evidence" : "open", targetPaper: isCrossPaper ? undefined : detectTargetPaper(query, kb), requestedTypes: inferRequestedTypes(query), isCrossPaper, domainTerms: detectDomainTerms(query) };
}

export async function answerOkfChat(query: string, kb: OkfKnowledgeBase = getOkfKnowledgeBase()): Promise<OkfChatResponse> {
  const plan = analyzeOkfQuery(query, routeOkfQuery(query), kb);
  const response = buildDeterministicResponse(query, plan, kb);
  const validation = validateChatResponse(response, kb);
  return { ...response, warnings: [...response.warnings, ...validation.warnings] };
}

function buildDeterministicResponse(query: string, plan: OkfQueryPlan, kb: OkfKnowledgeBase): OkfChatResponse {
  if (plan.intent === "DESIGN_REUSE_FLOW_QUERY") return buildReuseFlowResponse(query, plan, kb);
  if (plan.intent === "PAPER_LIST_QUERY") return paperListResponse(query, plan, kb);
  if (plan.intent === "DSR_ELEMENT_QUERY") return elementResponse(query, plan, kb);
  if (plan.intent === "DSR_FLOW_QUERY") return flowResponse(query, plan, kb);
  if (plan.intent === "EVIDENCE_QUERY") return evidenceResponse(query, plan, kb);
  return designResponse(query, plan, kb);
}
function designResponse(query: string, plan: OkfQueryPlan, kb: OkfKnowledgeBase): OkfChatResponse {
  if (plan.isCrossPaper || /marketplace|product|review|credential|commercial|identity/.test(query.toLowerCase())) {
    const reuse = buildReuseFlowResponse(query, { ...plan, intent: "DESIGN_REUSE_FLOW_QUERY", task_type: "design_reuse_flow", output_shape: "Requirement -> Principle -> Feature -> Artifact", isCrossPaper: true }, kb);
    return plan.intent === "DESIGN_RECOMMENDATION_QUERY" ? { ...reuse, intent: plan.intent } : reuse;
  }
  const retrieved = retrieveForDesignQuery(query, kb, plan.targetPaper?.paper_id);
  const concepts = orderConcepts(uniqueConcepts(retrieved.concepts));
  const flow = buildOkfFlow(query, concepts, kb, { includeQueryProblem: true });
  const byType = (type: OkfConceptType) => concepts.filter((concept) => concept.type === type).slice(0, 6).map((concept) => cardForConcept(concept, kb));
  const requirements = byType("DesignRequirement");
  const principles = byType("DesignPrinciple");
  const features = byType("DesignFeature");
  const artifacts = concepts.length ? [queryGeneratedArtifactCard(query, concepts, kb), ...byType("Artifact")].slice(0, 4) : [];
  const evidence = evidenceForConcepts(concepts, kb);
  const answer = [`Interpreted design problem: ${query}`, sectionList("Recommended requirements", requirements), sectionList("Recommended design principles", principles), sectionList("Candidate features", features), sectionList("Suggested artifact direction", artifacts), `Evidence-backed reuse rationale: ${evidence.length ? `The recommendations are linked to ${evidence.length} parsed OKF evidence item(s) and ${flow.edges.length} stored relation edge(s).` : "The current OKF match has limited evidence coverage."}`, "Boundary conditions / limitations: Treat query-generated problem framing as an input assumption. Paper concepts and citations come only from parsed OKF files."].join("\n\n");
  return baseResponse(plan.intent, answer, concepts, evidence, flow, sourcePaperRoles(concepts, kb, plan.targetPaper ? "matched paper title" : "cross-paper reuse candidate"), { task_type: plan.task_type, interpreted_problem: query, requirements, principles, features, artifact_direction: artifacts, assumptions: ["The design problem is query-generated unless it matches a stored OKF problem concept."], limitations: concepts.filter((concept) => concept.type === "Limitation").map((concept) => concept.title).slice(0, 4) });
}

function paperListResponse(query: string, plan: OkfQueryPlan, kb: OkfKnowledgeBase): OkfChatResponse {
  const papers = plan.targetPaper ? [plan.targetPaper] : getRelevantPapers(query, kb);
  const concepts = papers.flatMap((paper) => kb.concepts.filter((concept) => concept.paper_id === paper.paper_id)).slice(0, 60);
  const flow = buildOkfFlow(query, concepts, kb);
  const answer = papers.length ? `Matched ${papers.length} OKF paper(s): ${papers.map((paper) => `${paper.title} (${paper.paper_id})`).join("; ")}.` : "No OKF papers matched this query.";
  return baseResponse(plan.intent, answer, concepts, [], flow, sourcePaperRoles(concepts, kb, "matched paper title"), { task_type: plan.task_type });
}

function elementResponse(query: string, plan: OkfQueryPlan, kb: OkfKnowledgeBase): OkfChatResponse {
  const concepts = getElementConcepts(query, plan, kb);
  const evidence = evidenceForConcepts(concepts, kb);
  const flow = buildOkfFlow(query, concepts, kb);
  const paperLabel = plan.targetPaper?.title ?? "the matched OKF library";
  const requirements = concepts.filter((concept) => concept.type === "DesignRequirement").map((concept) => cardForConcept(concept, kb));
  const principles = concepts.filter((concept) => concept.type === "DesignPrinciple").map((concept) => cardForConcept(concept, kb));
  const features = concepts.filter((concept) => concept.type === "DesignFeature").map((concept) => cardForConcept(concept, kb));
  const artifacts = concepts.filter((concept) => concept.type === "Artifact").map((concept) => cardForConcept(concept, kb));
  const answer = [summarizeElementDirectAnswer(paperLabel, concepts, plan.requestedTypes), ...plan.requestedTypes.map((type) => formatConceptSection(labelForType(type), concepts.filter((concept) => concept.type === type))), `Evidence note: ${evidence.length} evidence item(s) are linked to the retrieved concepts.`, flow.edges.length ? `Flow preview: ${flow.edges.length} stored OKF relation edge(s) connect retrieved concepts. Open the Flow tab for the relation graph.` : "Flow preview: no stored OKF relation edge connects the retrieved concepts directly."].filter(Boolean).join("\n\n");
  return baseResponse(plan.intent, answer, concepts, evidence, flow, sourcePaperRoles(concepts, kb, plan.targetPaper ? "matched paper title" : "matched concept metadata"), { task_type: plan.task_type, requirements, principles, features, artifact_direction: artifacts });
}

function flowResponse(query: string, plan: OkfQueryPlan, kb: OkfKnowledgeBase): OkfChatResponse {
  const seed = getFlowSeedConcepts(query, plan, kb);
  const concepts = expandFlowConcepts(seed, kb, plan.targetPaper?.paper_id);
  const flow = buildOkfFlow(query, concepts, kb);
  const evidence = evidenceForConcepts(concepts, kb);
  const branches = summarizeFlowBranches(concepts, flow);
  const answer = [`Flow purpose: trace the stored Requirement -> Principle -> Feature pathway for ${query}.`, branches.length ? `Summarized Requirement -> Principle -> Feature mapping:\n${branches.map((item, index) => `${index + 1}. ${item}`).join("\n")}` : "Summarized Requirement -> Principle -> Feature mapping: no stored relation path matched the query terms.", `Evidence / coverage note: ${flow.nodes.length} flow node(s), ${flow.edges.length} stored OKF edge(s), and ${evidence.length} linked evidence item(s). Full relation detail is available in the Flow tab.`, flow.edges.length ? "Missing / uncertain links: no extra links were inferred between unrelated retrieved concepts." : "Missing / uncertain links: add or review OKF relations if this pathway should exist."].join("\n\n");
  return baseResponse(plan.intent, answer, concepts, evidence, flow, sourcePaperRoles(concepts, kb, plan.targetPaper ? "matched paper title" : "matched flow terms"), { task_type: plan.task_type });
}

function evidenceResponse(query: string, plan: OkfQueryPlan, kb: OkfKnowledgeBase): OkfChatResponse {
  const terms = tokenize(query);
  const evidenceItems = kb.evidence_items.filter((item) => !plan.targetPaper || item.paper_id === plan.targetPaper.paper_id).filter((item) => terms.some((term) => [item.paraphrase, item.quote, item.section].join(" ").toLowerCase().includes(term))).slice(0, 12);
  const conceptIds = new Set(evidenceItems.map((item) => item.concept_id).filter(Boolean));
  const concepts = kb.concepts.filter((concept) => conceptIds.has(concept.concept_id));
  const flow = buildOkfFlow(query, concepts, kb);
  const evidence = evidenceItems.map(toEvidenceDto);
  const answer = evidence.length ? evidence.map((item) => `${item.evidence_id}: ${item.paraphrase}`).join("\n") : "No evidence item matched this query.";
  return baseResponse(plan.intent, answer, concepts, evidence, flow, sourcePaperRoles(concepts, kb, "matched evidence"), { task_type: plan.task_type });
}
function getElementConcepts(query: string, plan: OkfQueryPlan, kb: OkfKnowledgeBase) {
  const base = plan.targetPaper ? kb.concepts.filter((concept) => concept.paper_id === plan.targetPaper?.paper_id && plan.requestedTypes.includes(concept.type)) : getConceptsByType(plan.requestedTypes, { query }, kb);
  return orderConcepts(base).slice(0, plan.targetPaper ? 80 : 30);
}

function getFlowSeedConcepts(query: string, plan: OkfQueryPlan, kb: OkfKnowledgeBase) {
  if (plan.targetPaper) {
    const terms = tokenize(query);
    const paperConcepts = kb.concepts.filter((concept) => concept.paper_id === plan.targetPaper?.paper_id);
    const matched = paperConcepts.filter((concept) => scoreConceptForQuery(concept, terms) > 0);
    return matched.length ? matched : paperConcepts.filter((concept) => ["Problem", "DesignRequirement"].includes(concept.type));
  }
  return getConceptsByType(["Problem", "DesignRequirement", "DesignPrinciple", "DesignFeature", "Artifact"], { query }, kb).slice(0, 12);
}

function expandFlowConcepts(seed: OkfConcept[], kb: OkfKnowledgeBase, paperId?: string) {
  const ids = new Set(seed.map((concept) => concept.concept_id));
  let changed = true;
  while (changed && ids.size < 40) {
    changed = false;
    for (const relation of kb.relations) {
      if (paperId && !relation.source_concept_id.startsWith(`${paperId}:`)) continue;
      if (ids.has(relation.source_concept_id) && !ids.has(relation.target_concept_id)) { ids.add(relation.target_concept_id); changed = true; }
      if (ids.has(relation.target_concept_id) && !ids.has(relation.source_concept_id)) { ids.add(relation.source_concept_id); changed = true; }
    }
  }
  return orderConcepts(kb.concepts.filter((concept) => ids.has(concept.concept_id))).slice(0, 32);
}

function baseResponse(intent: OkfChatIntent, answer: string, concepts: OkfConcept[], evidence: OkfChatResponse["evidence"], flow: OkfChatResponse["flow"], source_papers: OkfChatResponse["source_papers"], extra: Partial<OkfChatResponse> = {}): OkfChatResponse {
  return { intent, answer, requirements: [], principles: [], features: [], artifact_direction: [], source_papers, retrieved_concepts: concepts, evidence, flow, assumptions: [], limitations: [], warnings: [], ...extra };
}

function cardForConcept(concept: OkfConcept, kb: OkfKnowledgeBase): OkfRecommendationCard {
  const evidenceIds = kb.evidence_items.filter((item) => item.concept_id === concept.concept_id).map((item) => item.evidence_id);
  return { title: concept.title, concept_id: concept.concept_id, paper_id: concept.paper_id, evidence_ids: evidenceIds, confidence: concept.confidence };
}

function sourcePaperRoles(concepts: OkfConcept[], kb: OkfKnowledgeBase, fallbackReason: string) {
  const byPaper = new Map<string, OkfConcept[]>();
  for (const concept of concepts) byPaper.set(concept.paper_id, [...(byPaper.get(concept.paper_id) ?? []), concept]);
  return [...byPaper.entries()].map(([paper_id, paperConcepts]) => {
    const paper = kb.papers.find((item) => item.paper_id === paper_id);
    const roleParts = [...new Set(paperConcepts.map((concept) => roleLabel(concept.type)))];
    const evidenceCount = kb.evidence_items.filter((item) => item.paper_id === paper_id && item.concept_id && paperConcepts.some((concept) => concept.concept_id === item.concept_id)).length;
    return { paper_id, title: paper?.title ?? paper_id, role: roleParts.join(", ") || "Matched source", reason: reasonForPaper(paperConcepts, fallbackReason), requirements_count: paperConcepts.filter((concept) => concept.type === "DesignRequirement").length, principles_count: paperConcepts.filter((concept) => concept.type === "DesignPrinciple").length, features_count: paperConcepts.filter((concept) => concept.type === "DesignFeature").length, evidence_count: evidenceCount };
  });
}

function reasonForPaper(concepts: OkfConcept[], fallbackReason: string) {
  if (concepts.some((concept) => concept.type === "DesignRequirement")) return "matched requirement";
  if (concepts.some((concept) => concept.type === "DesignPrinciple")) return "matched design principle";
  if (concepts.some((concept) => concept.type === "DesignFeature")) return "matched feature";
  return fallbackReason;
}

function roleLabel(type: string) {
  if (type === "DesignRequirement") return "Requirement";
  if (type === "DesignPrinciple") return "Design principle";
  if (type === "DesignFeature") return "Feature";
  if (type === "Artifact") return "Architecture pattern";
  if (type === "Evaluation") return "Evidence";
  return type;
}
function inferRequestedTypes(query: string): OkfConceptType[] {
  const q = query.toLowerCase();
  const types: OkfConceptType[] = [];
  if (/problem/.test(q)) types.push("Problem");
  if (/research question|rq\b/.test(q)) types.push("ResearchQuestion");
  if (/requirements?/.test(q)) types.push("DesignRequirement");
  if (/principles?/.test(q)) types.push("DesignPrinciple");
  if (/features?/.test(q)) types.push("DesignFeature");
  if (/artifacts?|architecture|pattern/.test(q)) types.push("Artifact");
  if (/evaluations?|criteria|evidence/.test(q)) types.push("Evaluation");
  if (/output knowledge|contribution/.test(q)) types.push("OutputKnowledge");
  if (/kernel theor/.test(q)) types.push("KernelTheory");
  if (/limitation|boundary/.test(q)) types.push("Limitation");
  if (/requirement\s*(?:\u2192|->|to)\s*principle\s*(?:\u2192|->|to)\s*feature/.test(q)) return ["DesignRequirement", "DesignPrinciple", "DesignFeature", "Artifact"];
  return types.length ? [...new Set(types)] : ["DesignRequirement", "DesignPrinciple", "DesignFeature", "Artifact"];
}

function detectTargetPaper(query: string, kb: OkfKnowledgeBase) {
  const q = normalizeText(query);
  const aliases: Record<string, string[]> = { BLOCKCHAIN_IOT_SDPS_2019: ["blockchain for the iot", "blockchain iot", "sensor data protection", "sdps", "certificar"], SHORT_END_STICK_2025: ["short end of the stick", "two-sided opportunism", "two sided opportunism", "machine tool leasing", "bossler buchwald spohrer"] };
  for (const paper of kb.papers) {
    const candidates = [paper.paper_id, paper.title, ...(aliases[paper.paper_id] ?? [])].map(normalizeText);
    if (candidates.some((candidate) => candidate.length > 4 && q.includes(candidate))) return paper;
  }
  return undefined;
}

function evidenceForConcepts(concepts: OkfConcept[], kb: OkfKnowledgeBase) {
  const conceptIds = new Set(concepts.map((concept) => concept.concept_id));
  return kb.evidence_items.filter((item) => item.concept_id && conceptIds.has(item.concept_id)).map(toEvidenceDto);
}

function toEvidenceDto(item: OkfKnowledgeBase["evidence_items"][number]) {
  return { evidence_id: item.evidence_id, paper_id: item.paper_id, concept_id: item.concept_id, paraphrase: item.paraphrase, quote: item.quote, confidence: item.confidence, section: item.section, page_number: item.page_number };
}

function summarizeElementDirectAnswer(paperLabel: string, concepts: OkfConcept[], requestedTypes: OkfConceptType[]) {
  const parts = requestedTypes.map((type) => { const count = concepts.filter((concept) => concept.type === type).length; return count ? `${count} ${readableType(type, count)}` : undefined; }).filter(Boolean);
  return parts.length ? `${paperLabel} uses ${parts.join(" and ")} in the requested OKF scope.` : `${paperLabel} has no matching OKF elements for the requested type.`;
}

function readableType(type: OkfConceptType, count: number) {
  const plural = count === 1 ? "" : "s";
  if (type === "DesignRequirement") return `design requirement${plural}`;
  if (type === "DesignPrinciple") return `design principle${plural}`;
  if (type === "DesignFeature") return `design feature${plural}`;
  if (type === "Artifact") return `artifact pattern${plural}`;
  if (type === "Evaluation") return `evaluation item${plural}`;
  if (type === "OutputKnowledge") return `output knowledge item${plural}`;
  return `${type}${plural}`;
}

function summarizeFlowBranches(concepts: OkfConcept[], flow: ReturnType<typeof buildOkfFlow>) {
  const byId = new Map(concepts.map((concept) => [concept.concept_id, concept]));
  const outgoing = new Map<string, string[]>();
  for (const edge of flow.edges) if (edge.relation_id) outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge.target]);
  const branches: string[] = [];
  for (const requirement of concepts.filter((concept) => concept.type === "DesignRequirement")) {
    const principles = (outgoing.get(requirement.concept_id) ?? []).map((id) => byId.get(id)).filter((concept): concept is OkfConcept => concept?.type === "DesignPrinciple");
    for (const principle of principles) {
      const features = (outgoing.get(principle.concept_id) ?? []).map((id) => byId.get(id)).filter((concept): concept is OkfConcept => concept?.type === "DesignFeature");
      branches.push(`${shortConceptLabel(requirement)} -> ${shortConceptLabel(principle)} -> ${features.length ? features.map(shortConceptLabel).join(", ") : "no directly linked feature in current OKF flow"}`);
    }
  }
  return branches.slice(0, 8);
}

function shortConceptLabel(concept: OkfConcept) {
  const localId = concept.concept_id.split(":").pop() ?? concept.concept_id;
  const code = localId.match(/^(dr\d+|dp\d+|df\d+|dr_\d+|dp_\d+|df_\d+)/i)?.[1]?.toUpperCase();
  return code ? `${code}: ${concept.title}` : concept.title;
}

function queryGeneratedArtifactCard(query: string, concepts: OkfConcept[], kb: OkfKnowledgeBase): OkfRecommendationCard {
  const title = "Query-generated DSR artifact pattern";
  const evidenceIds = concepts.flatMap((concept) => kb.evidence_items.filter((item) => item.concept_id === concept.concept_id).map((item) => item.evidence_id)).slice(0, 6);
  return { title, evidence_ids: evidenceIds, confidence: "low", paper_id: "query_generated" };
}

function sectionList(title: string, cards: OkfRecommendationCard[]) {
  return cards.length ? `${title}:\n${cards.map((item, index) => `${index + 1}. ${item.title}`).join("\n")}` : `${title}: no directly matched OKF concepts.`;
}

function formatConceptSection(title: string, concepts: OkfConcept[]) {
  return concepts.length ? `${title}:\n${concepts.map((concept, index) => `${index + 1}. ${concept.title}`).join("\n")}` : `${title}: none retrieved.`;
}

function labelForType(type: OkfConceptType) {
  if (type === "DesignFeature") return "Design features";
  if (type === "Artifact") return "Artifacts";
  if (type === "Evaluation") return "Evaluation";
  if (type === "OutputKnowledge") return "Output knowledge";
  if (type === "KernelTheory") return "Kernel theories";
  return type;
}

function orderConcepts(concepts: OkfConcept[]) {
  return [...concepts].sort((a, b) => orderedTypes.indexOf(a.type) - orderedTypes.indexOf(b.type) || a.concept_id.localeCompare(b.concept_id));
}

function uniqueConcepts(concepts: OkfConcept[]) {
  const seen = new Set<string>();
  return concepts.filter((concept) => { if (seen.has(concept.concept_id)) return false; seen.add(concept.concept_id); return true; });
}

function scoreConceptForQuery(concept: OkfConcept, terms: string[]) {
  const haystack = [concept.title, concept.description, concept.body_text, concept.tags.join(" ")].join(" ").toLowerCase();
  return terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0);
}

function detectDomainTerms(query: string) {
  const terms = ["product identity", "marketplace listing", "seller relisting", "verified purchase", "product review", "seller review", "raw commercial data", "privacy", "credential", "canonical product", "gtin", "gs1", "eclass", "dispute", "governance"];
  const q = normalizeText(query);
  return terms.filter((term) => q.includes(normalizeText(term)) || normalizeText(term).split(" ").some((piece) => q.includes(piece)));
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}



