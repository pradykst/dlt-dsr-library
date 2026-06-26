import { buildOkfFlow } from "./flow.ts";
import { getConceptsByType, getOkfKnowledgeBase, getRelevantPapers, retrieveForDesignQuery, tokenize } from "./retrieval.ts";
import type { OkfChatIntent, OkfConcept, OkfConceptType, OkfKnowledgeBase } from "./schema.ts";
import { validateChatResponse } from "./validator.ts";

export type OkfRecommendationCard = {
  title: string;
  concept_id?: string;
  evidence_ids: string[];
  confidence: string;
  paper_id?: string;
};

export type OkfChatResponse = {
  intent: OkfChatIntent;
  answer: string;
  interpreted_problem?: string;
  requirements: OkfRecommendationCard[];
  principles: OkfRecommendationCard[];
  features: OkfRecommendationCard[];
  artifact_direction: OkfRecommendationCard[];
  source_papers: { paper_id: string; title: string; role: string }[];
  retrieved_concepts: OkfConcept[];
  evidence: { evidence_id: string; paper_id: string; concept_id?: string; paraphrase: string; quote?: string; confidence: string }[];
  flow: ReturnType<typeof buildOkfFlow>;
  assumptions: string[];
  limitations: string[];
  warnings: string[];
};

export function routeOkfQuery(query: string): OkfChatIntent {
  const q = query.toLowerCase();
  if (/which papers|what papers|papers use|papers mention/.test(q)) return "PAPER_LIST_QUERY";
  if (/explain paper|summarize paper|paper detail|tell me about paper/.test(q)) return "PAPER_DETAIL_QUERY";
  if (/evidence|quote|citation|support/.test(q)) return "EVIDENCE_QUERY";
  if (/compare|difference|across papers/.test(q)) return "COMPARE_QUERY";
  if (/requirements|design principles|principles|features|artifacts|evaluations/.test(q)) return "DSR_ELEMENT_QUERY";
  if (/design|recommend|reuse|should|system|architecture|artifact|marketplace|prevent/.test(q)) return "DESIGN_RECOMMENDATION_QUERY";
  return "UNKNOWN_QUERY";
}

export async function answerOkfChat(query: string, kb: OkfKnowledgeBase = getOkfKnowledgeBase()): Promise<OkfChatResponse> {
  const intent = routeOkfQuery(query);
  const response = buildDeterministicResponse(query, intent, kb);
  const validation = validateChatResponse(response, kb);
  return { ...response, warnings: [...response.warnings, ...validation.warnings] };
}

function buildDeterministicResponse(query: string, intent: OkfChatIntent, kb: OkfKnowledgeBase): OkfChatResponse {
  if (intent === "PAPER_LIST_QUERY") return paperListResponse(query, intent, kb);
  if (intent === "DSR_ELEMENT_QUERY") return elementResponse(query, intent, kb);
  if (intent === "EVIDENCE_QUERY") return evidenceResponse(query, intent, kb);
  return designResponse(query, intent, kb);
}

function designResponse(query: string, intent: OkfChatIntent, kb: OkfKnowledgeBase): OkfChatResponse {
  const retrieved = retrieveForDesignQuery(query, kb);
  const flow = buildOkfFlow(query, retrieved.concepts, kb);
  const byType = (type: string) => retrieved.concepts.filter((concept) => concept.type === type).slice(0, 5).map((concept) => cardForConcept(concept, kb));
  const requirements = byType("DesignRequirement");
  const principles = byType("DesignPrinciple");
  const features = byType("DesignFeature");
  const artifacts = byType("Artifact");
  const sourcePapers = sourcePaperRoles(retrieved.concepts, kb);
  const evidence = retrieved.evidence.map((item) => ({ evidence_id: item.evidence_id, paper_id: item.paper_id, concept_id: item.concept_id, paraphrase: item.paraphrase, quote: item.quote, confidence: item.confidence }));
  const answer = [
    `I interpret the design problem as: ${query}`,
    requirements.length ? `Recommended requirements: ${requirements.map((item) => item.title).join("; ")}.` : "No reviewed requirement match was found; draft or query-generated nodes are marked as low confidence.",
    principles.length ? `Reusable design principles: ${principles.map((item) => item.title).join("; ")}.` : "No matching design principles were retrieved from OKF yet.",
    features.length ? `Candidate features: ${features.map((item) => item.title).join("; ")}.` : "No matching features were retrieved from OKF yet.",
    artifacts.length ? `Suggested artifact direction: ${artifacts.map((item) => item.title).join("; ")}.` : "Artifact direction is provisional until reviewed OKF artifact concepts are added."
  ].join("\n\n");
  return baseResponse(intent, answer, retrieved.concepts, evidence, flow, sourcePapers, {
    interpreted_problem: query,
    requirements,
    principles,
    features,
    artifact_direction: artifacts,
    assumptions: ["Draft OKF seed data is low confidence until paper evidence is manually reviewed."],
    limitations: ["The backend only uses parsed OKF concepts, evidence, and relations; no vector database is required for this MVP."]
  });
}

function paperListResponse(query: string, intent: OkfChatIntent, kb: OkfKnowledgeBase): OkfChatResponse {
  const papers = getRelevantPapers(query, kb);
  const concepts = papers.flatMap((paper) => kb.concepts.filter((concept) => concept.paper_id === paper.paper_id)).slice(0, 16);
  const flow = buildOkfFlow(query, concepts, kb);
  const answer = papers.length ? `Matched papers: ${papers.map((paper) => `${paper.title} (${paper.paper_id})`).join("; ")}.` : "No OKF papers matched this query.";
  return baseResponse(intent, answer, concepts, [], flow, papers.map((paper) => ({ paper_id: paper.paper_id, title: paper.title, role: "matched paper" })));
}

function elementResponse(query: string, intent: OkfChatIntent, kb: OkfKnowledgeBase): OkfChatResponse {
  const types = inferRequestedTypes(query);
  const concepts = getConceptsByType(types, { query }, kb).slice(0, 20);
  const evidence = kb.evidence_items.filter((item) => item.concept_id && concepts.some((concept) => concept.concept_id === item.concept_id)).map((item) => ({ evidence_id: item.evidence_id, paper_id: item.paper_id, concept_id: item.concept_id, paraphrase: item.paraphrase, quote: item.quote, confidence: item.confidence }));
  const flow = buildOkfFlow(query, concepts, kb);
  const answer = concepts.length ? concepts.map((concept) => `${concept.type}: ${concept.title} [${concept.concept_id}]`).join("\n") : "No matching DSR elements were found in the local OKF library.";
  return baseResponse(intent, answer, concepts, evidence, flow, sourcePaperRoles(concepts, kb));
}

function evidenceResponse(query: string, intent: OkfChatIntent, kb: OkfKnowledgeBase): OkfChatResponse {
  const terms = tokenize(query);
  const evidenceItems = kb.evidence_items.filter((item) => terms.some((term) => [item.paraphrase, item.quote, item.section].join(" ").toLowerCase().includes(term))).slice(0, 12);
  const conceptIds = new Set(evidenceItems.map((item) => item.concept_id).filter(Boolean));
  const concepts = kb.concepts.filter((concept) => conceptIds.has(concept.concept_id));
  const flow = buildOkfFlow(query, concepts, kb);
  const evidence = evidenceItems.map((item) => ({ evidence_id: item.evidence_id, paper_id: item.paper_id, concept_id: item.concept_id, paraphrase: item.paraphrase, quote: item.quote, confidence: item.confidence }));
  const answer = evidence.length ? evidence.map((item) => `${item.evidence_id}: ${item.paraphrase}`).join("\n") : "No evidence item matched this query.";
  return baseResponse(intent, answer, concepts, evidence, flow, sourcePaperRoles(concepts, kb));
}

function baseResponse(intent: OkfChatIntent, answer: string, concepts: OkfConcept[], evidence: OkfChatResponse["evidence"], flow: OkfChatResponse["flow"], source_papers: OkfChatResponse["source_papers"], extra: Partial<OkfChatResponse> = {}): OkfChatResponse {
  return {
    intent,
    answer,
    requirements: [],
    principles: [],
    features: [],
    artifact_direction: [],
    source_papers,
    retrieved_concepts: concepts,
    evidence,
    flow,
    assumptions: [],
    limitations: [],
    warnings: [],
    ...extra
  };
}

function cardForConcept(concept: OkfConcept, kb: OkfKnowledgeBase): OkfRecommendationCard {
  const evidenceIds = kb.evidence_items.filter((item) => item.concept_id === concept.concept_id).map((item) => item.evidence_id);
  return { title: concept.title, concept_id: concept.concept_id, paper_id: concept.paper_id, evidence_ids: evidenceIds, confidence: concept.confidence };
}

function sourcePaperRoles(concepts: OkfConcept[], kb: OkfKnowledgeBase) {
  const roleByPaper = new Map<string, Set<string>>();
  for (const concept of concepts) {
    const roles = roleByPaper.get(concept.paper_id) ?? new Set<string>();
    roles.add(roleLabel(concept.type));
    roleByPaper.set(concept.paper_id, roles);
  }
  return [...roleByPaper.entries()].map(([paper_id, roles]) => {
    const paper = kb.papers.find((item) => item.paper_id === paper_id);
    return { paper_id, title: paper?.title ?? paper_id, role: [...roles].join(", ") };
  });
}

function roleLabel(type: string) {
  if (type === "DesignRequirement") return "Requirement";
  if (type === "DesignPrinciple") return "Design principle";
  if (type === "DesignFeature") return "Feature";
  if (type === "Artifact") return "Architecture pattern";
  return "Evidence";
}

function inferRequestedTypes(query: string): OkfConceptType[] {
  const q = query.toLowerCase();
  if (q.includes("requirement")) return ["DesignRequirement"];
  if (q.includes("principle")) return ["DesignPrinciple"];
  if (q.includes("feature")) return ["DesignFeature"];
  if (q.includes("artifact")) return ["Artifact"];
  return ["DesignRequirement", "DesignPrinciple", "DesignFeature", "Artifact"];
}

