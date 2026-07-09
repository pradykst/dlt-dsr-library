import { decisionSupportUserPrompt, dsrReuseSystemPrompt, parseDecisionSupportJson } from "./prompts/dsrReuseSynthesis.ts";
import type { OkfChatResponse } from "../okf/chat.ts";
import type { DecisionSupportAnswer, OkfConcept, OkfEvidenceRef, OkfReuseFlowRow } from "../okf/schema.ts";
import { buildFallbackAnswer, renderDecisionSupportMarkdown } from "../okf/reuse.ts";
import type { LlmProviderName } from "./provider.ts";

export async function synthesizeWithFeatherless(deterministic: OkfChatResponse): Promise<OkfChatResponse> {
  const apiKey = process.env.FEATHERLESS_API_KEY;
  const model = process.env.FEATHERLESS_MODEL;
  const configured = Boolean(apiKey && model);
  if (!configured) return synthesizeWithCompactFallback(deterministic, "Featherless is not configured.", false, false, "featherless");

  const baseUrl = process.env.FEATHERLESS_BASE_URL ?? "https://api.featherless.ai/v1";
  const timeoutMs = Number(process.env.FEATHERLESS_TIMEOUT_MS ?? 60000);
  const maxTokens = Number(process.env.FEATHERLESS_MAX_TOKENS ?? 2200);
  const temperature = Number(process.env.FEATHERLESS_TEMPERATURE ?? 0.2);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const context = buildSynthesisContext(deterministic);
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: dsrReuseSystemPrompt },
          { role: "user", content: decisionSupportUserPrompt(context) }
        ]
      })
    });
    if (!response.ok) throw new Error(`Featherless request failed: ${response.status}`);
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw new Error("Featherless response did not contain message content.");
    const parsed = parseDecisionSupportJson(content);
    const answer: DecisionSupportAnswer = { ...parsed, synthesis_mode: "featherless" };
    validateGrounding(answer, deterministic);
    return {
      ...deterministic,
      answer_payload: answer,
      answer: renderDecisionSupportMarkdown(answer),
      runtime: { ...deterministic.runtime, provider_configured: true, provider_connected: true, synthesis_attempted: true, synthesis_mode: "featherless", provider: "featherless" },
      warnings: [...deterministic.warnings, "Featherless synthesis applied and validated against retrieved OKF paper/evidence ids."]
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown Featherless synthesis error";
    return synthesizeWithCompactFallback(deterministic, reason, true, featherlessErrorStillConnected(reason), "featherless");
  } finally {
    clearTimeout(timer);
  }
}

export function buildSynthesisContext(response: OkfChatResponse) {
  const sourcePapers = response.source_papers.slice(0, 8).map((paper) => ({ paper_id: paper.paper_id, title: paper.title, why_selected: paper.reason, role: paper.role, evidence_count: paper.evidence_count, score: paper.score ?? 0 }));
  const selectedPaperIds = new Set(sourcePapers.map((paper) => paper.paper_id));
  const relationPaths = relationPathsForContext(response).slice(0, 25);
  const relationConceptIds = new Set(relationPaths.flatMap((path) => path.concept_ids));
  const evidence = response.evidence
    .map((item) => ({ ...item, relation_connected: item.concept_id ? relationConceptIds.has(item.concept_id) : false }))
    .sort((a, b) => Number(b.relation_connected) - Number(a.relation_connected))
    .slice(0, 30)
    .map((item) => ({ evidence_id: item.evidence_id, paper_id: item.paper_id, concept_id: item.concept_id, excerpt: item.quote ?? item.paraphrase, section: item.section, page_number: item.page_number, confidence: item.confidence }));

  return {
    user_query: response.interpreted_problem ?? response.answer.split("\n")[0] ?? "",
    detected_intent: response.intent,
    requested_output_shape: response.task_type === "design_reuse_flow" ? "Requirement -> Principle -> Feature -> Artifact" : response.task_type ?? "open",
    selected_source_papers: sourcePapers,
    top_requirements: conceptsForContext(response.retrieved_concepts, "DesignRequirement", selectedPaperIds),
    top_design_principles: conceptsForContext(response.retrieved_concepts, "DesignPrinciple", selectedPaperIds),
    top_design_features: conceptsForContext(response.retrieved_concepts, "DesignFeature", selectedPaperIds),
    top_artifacts: conceptsForContext(response.retrieved_concepts, "Artifact", selectedPaperIds),
    top_evaluations_output_knowledge: response.retrieved_concepts.filter((concept) => ["Evaluation", "OutputKnowledge", "KernelTheory", "Limitation"].includes(concept.type)).slice(0, 12).map(conceptForContext),
    relation_paths: relationPaths,
    evidence_snippets: evidence,
    query_generated_candidates: (response.flow_rows ?? rowsFromResponse(response)).slice(0, 8).map((row) => ({ id: row.row_id, requirement: row.requirement_label, principle: row.principle_label, feature: row.feature_label, artifact: row.artifact_pattern, supporting_paper_ids: row.supporting_papers, evidence_ids: row.evidence_ids, adaptation_status: row.adaptation_status, adaptation_note: row.adaptation_text }))
  };
}

export function synthesizeWithCompactFallback(response: OkfChatResponse, reason: string, attempted = false, connected = false, provider: LlmProviderName = "none"): OkfChatResponse {
  const rows = (response.flow_rows?.length ? response.flow_rows : rowsFromResponse(response)).slice(0, 7);
  const evidenceRefs = toEvidenceRefs(response.evidence);
  const mode = attempted ? "fallback_provider_error" as const : "structured_okf_answer" as const;
  const fallback = { ...buildFallbackAnswer(response.interpreted_problem ?? "OKF query", rows, response.source_papers, evidenceRefs, undefined, reason), synthesis_mode: mode };
  return {
    ...response,
    answer_payload: fallback,
    answer: renderDecisionSupportMarkdown(fallback),
    runtime: { ...response.runtime, provider_configured: isProviderConfigured(provider), provider_connected: connected, synthesis_attempted: attempted, synthesis_mode: mode, provider, fallback_reason: reason },
    warnings: [...response.warnings, `${providerLabel(provider)} synthesis unavailable; compact deterministic fallback used. ${reason}`]
  };
}



function isProviderConfigured(provider: LlmProviderName) {
  if (provider === "mock") return true;
  if (provider === "featherless") return Boolean(process.env.FEATHERLESS_API_KEY && process.env.FEATHERLESS_MODEL);
  if (provider === "groq") return Boolean(process.env.GROQ_API_KEY && process.env.GROQ_MODEL);
  if (provider === "openai") return Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_MODEL);
  return false;
}

function providerLabel(provider: LlmProviderName) {
  if (provider === "groq") return "Groq";
  if (provider === "openai") return "OpenAI";
  if (provider === "mock") return "Mock";
  if (provider === "featherless") return "Featherless";
  return "LLM";
}

function featherlessErrorStillConnected(reason: string) {
  return !/(request failed:\s*(401|403)|fetch failed|network|abort|timeout|ECONN|ENOTFOUND|ETIMEDOUT)/i.test(reason);
}

function validateGrounding(answer: DecisionSupportAnswer, response: OkfChatResponse) {
  const evidenceIds = new Set(response.evidence.map((item) => item.evidence_id));
  const paperIds = new Set(response.source_papers.map((paper) => paper.paper_id));
  const unsupportedMoveEvidence = answer.design_moves.flatMap((move) => move.evidence_ids).filter((id) => !evidenceIds.has(id));
  const unsupportedMovePapers = answer.design_moves.flatMap((move) => move.supporting_paper_ids).filter((id) => !paperIds.has(id));
  const unsupportedPaperSupport = answer.source_papers.map((paper) => paper.paper_id).filter((id) => !paperIds.has(id));
  const unsupportedEvidenceRefs = answer.evidence_refs.map((item) => item.evidence_id).filter((id) => !evidenceIds.has(id));
  const unsupportedEvidencePapers = answer.evidence_refs.map((item) => item.paper_id).filter((id) => !paperIds.has(id));
  if (unsupportedMoveEvidence.length || unsupportedMovePapers.length || unsupportedPaperSupport.length || unsupportedEvidenceRefs.length || unsupportedEvidencePapers.length) {
    throw new Error("Featherless output introduced unsupported paper or evidence ids.");
  }
}

function conceptsForContext(concepts: OkfConcept[], type: OkfConcept["type"], selectedPaperIds: Set<string>) {
  return concepts.filter((concept) => concept.type === type && selectedPaperIds.has(concept.paper_id)).slice(0, 12).map(conceptForContext);
}

function conceptForContext(concept: OkfConcept) {
  return { concept_id: concept.concept_id, paper_id: concept.paper_id, type: concept.type, title: concept.title, description: concept.description, tags: concept.tags, confidence: concept.confidence, query_generated: concept.query_generated === true };
}

function relationPathsForContext(response: OkfChatResponse) {
  const nodesById = new Map(response.flow.nodes.map((node) => [node.id, node]));
  return response.flow.edges.map((edge) => {
    const source = nodesById.get(edge.source);
    const target = nodesById.get(edge.target);
    return {
      relation_id: edge.relation_id,
      predicate: edge.predicate,
      source_concept_id: source?.concept_id,
      source_label: source?.label,
      target_concept_id: target?.concept_id,
      target_label: target?.label,
      confidence: edge.confidence,
      concept_ids: [source?.concept_id, target?.concept_id].filter((id): id is string => Boolean(id))
    };
  }).filter((path) => path.source_concept_id || path.target_concept_id);
}

function rowsFromResponse(response: OkfChatResponse): OkfReuseFlowRow[] {
  const conceptsByType = new Map<string, OkfConcept[]>();
  for (const concept of response.retrieved_concepts) conceptsByType.set(concept.type, [...(conceptsByType.get(concept.type) ?? []), concept]);
  const papers = response.source_papers.slice(0, 5);
  return papers.map((paper, index) => {
    const paperConcepts = response.retrieved_concepts.filter((concept) => concept.paper_id === paper.paper_id);
    const get = (type: string) => paperConcepts.find((concept) => concept.type === type) ?? conceptsByType.get(type)?.[index] ?? conceptsByType.get(type)?.[0];
    const selected = [get("DesignRequirement"), get("DesignPrinciple"), get("DesignFeature"), get("Artifact")].filter((concept): concept is OkfConcept => Boolean(concept));
    const conceptIds = selected.map((concept) => concept.concept_id);
    const evidenceIds = response.evidence.filter((item) => item.concept_id && conceptIds.includes(item.concept_id)).map((item) => item.evidence_id).slice(0, 6);
    return {
      row_id: `fallback-${paper.paper_id}-${index + 1}`,
      requirement_label: selected.find((concept) => concept.type === "DesignRequirement")?.title ?? selected[0]?.title ?? "Retrieved OKF requirement",
      principle_label: selected.find((concept) => concept.type === "DesignPrinciple")?.title ?? "Retrieved OKF principle",
      feature_label: selected.find((concept) => concept.type === "DesignFeature")?.title ?? "Query-specific feature candidate",
      artifact_pattern: selected.find((concept) => concept.type === "Artifact")?.title ?? "Query-specific artifact candidate",
      supporting_papers: [paper.paper_id],
      evidence_ids: evidenceIds,
      concept_ids: conceptIds,
      adaptation_text: "Compact fallback row generated from retrieved OKF concepts; query-specific gaps are adaptations, not stored OKF claims.",
      adaptation_status: selected.length >= 3 ? "mixed" : "query_generated",
      confidence: evidenceIds.length >= 2 ? "medium" : "low"
    };
  });
}

function toEvidenceRefs(evidence: OkfChatResponse["evidence"]): OkfEvidenceRef[] {
  return evidence.map((item) => ({ evidence_id: item.evidence_id, paper_id: item.paper_id, concept_id: item.concept_id, excerpt: item.quote ?? item.paraphrase, section: item.section, page_number: item.page_number, confidence: item.confidence as OkfEvidenceRef["confidence"] }));
}


