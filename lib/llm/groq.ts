import type { OkfChatResponse } from "../okf/chat.ts";
import type { LlmSynthesisResult, OkfConcept, OkfEvidenceRef } from "../okf/schema.ts";
import { buildFallbackAnswer, inferDesignThemes, renderDecisionSupportMarkdown } from "../okf/reuse.ts";

export async function synthesizeWithGroq(deterministic: OkfChatResponse): Promise<OkfChatResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL;
  const configured = Boolean(apiKey && model);
  if (!configured) return groqFallback(deterministic, "Groq is not configured.", undefined, undefined, false);

  const baseUrl = process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1";
  const timeoutMs = Number(process.env.GROQ_TIMEOUT_MS ?? 60000);
  const maxTokens = Number(process.env.GROQ_MAX_TOKENS ?? 450);
  const temperature = Number(process.env.GROQ_TEMPERATURE ?? 0.2);
  const context = buildMarkdownSynthesisContext(deterministic);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let status: number | undefined;
  let rawProviderError: string | undefined;
  let rawProviderOutput: string | undefined;

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: markdownSystemPrompt },
          { role: "user", content: markdownUserPrompt(context) }
        ]
      })
    });
    status = response.status;
    const data = await response.json().catch(async () => ({ raw: await response.text().catch(() => "") }));
    if (!response.ok) {
      rawProviderError = providerErrorMessage(data) ?? `Groq request failed: ${response.status}`;
      throw new Error(rawProviderError);
    }
    const content = data?.choices?.[0]?.message?.content;
    rawProviderOutput = typeof content === "string" ? content : JSON.stringify(data).slice(0, 2000);
    if (typeof content !== "string" || !content.trim()) throw new Error("Groq response did not contain Markdown content.");
    const answerMarkdown = scrubDefaultAnswerMarkdown(content.trim());
    const synthesis: LlmSynthesisResult = {
      synthesis_mode: "groq",
      answer_markdown: answerMarkdown,
      provider_metadata: {
        provider: "groq",
        model,
        status,
        base_url: safeBaseUrl(baseUrl),
        prompt_tokens: data?.usage?.prompt_tokens,
        completion_tokens: data?.usage?.completion_tokens,
        total_tokens: data?.usage?.total_tokens
      },
      debug: { compact_context: context }
    };
    return {
      ...deterministic,
      answer: answerMarkdown,
      llm_synthesis: synthesis,
      runtime: { provider_configured: true, provider_connected: true, synthesis_attempted: true, synthesis_mode: "groq", provider: "groq" },
      warnings: [...deterministic.warnings, "Groq Markdown synthesis used for the default answer."]
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown Groq synthesis error";
    return groqFallback(deterministic, reason, status, rawProviderOutput, providerErrorStillConnected(reason), rawProviderError, context);
  } finally {
    clearTimeout(timer);
  }
}

export function buildMarkdownSynthesisContext(response: OkfChatResponse) {
  const query = response.interpreted_problem ?? "";
  const themes = inferDesignThemes(query).map((theme) => ({ id: theme.id, label: theme.label }));
  const relationConceptIds = new Set(response.flow.edges.flatMap((edge) => [nodeConceptId(response, edge.source), nodeConceptId(response, edge.target)]).filter((id): id is string => Boolean(id)));
  const evidenceConceptIds = new Set(response.evidence.map((item) => item.concept_id).filter((id): id is string => Boolean(id)));
  const selectedPapers = response.source_papers.slice(0, 5);
  const selectedPaperIds = new Set(selectedPapers.map((paper) => paper.paper_id));
  const concepts = response.retrieved_concepts.filter((concept) => selectedPaperIds.has(concept.paper_id));
  const conceptScore = (concept: OkfConcept) => (relationConceptIds.has(concept.concept_id) ? 3 : 0) + (evidenceConceptIds.has(concept.concept_id) ? 2 : 0) + confidenceScore(concept.confidence);
  const relevantTo = (concept: OkfConcept) => themes.filter((theme) => conceptText(concept).includes(theme.id) || conceptText(concept).includes(theme.label.split(" /")[0])).map((theme) => theme.label).slice(0, 2);
  const byType = (types: string[], limit: number) => concepts
    .filter((concept) => types.includes(concept.type))
    .sort((a, b) => conceptScore(b) - conceptScore(a) || a.paper_id.localeCompare(b.paper_id) || a.title.localeCompare(b.title))
    .slice(0, limit)
    .map((concept) => ({ paper_title: clip(paperTitle(response, concept.paper_id), 70), type: concept.type, title: clip(adaptSourceDomainLabel(concept.title, query), 70), why_relevant: relevantTo(concept).join("; ") || "matched OKF concept" }));
  const relationPaths = response.flow.edges.slice(0, 4).map((edge) => {
    const source = response.flow.nodes.find((node) => node.id === edge.source);
    const target = response.flow.nodes.find((node) => node.id === edge.target);
    return { predicate: edge.predicate, source: clip(source?.label, 120), target: clip(target?.label, 120), confidence: edge.confidence };
  });
  const evidence = response.evidence
    .filter((item) => selectedPaperIds.has(item.paper_id))
    .map((item) => ({ ...item, relation_connected: item.concept_id ? relationConceptIds.has(item.concept_id) : false, source_rank: selectedPapers.findIndex((paper) => paper.paper_id === item.paper_id) }))
    .sort((a, b) => Number(b.relation_connected) - Number(a.relation_connected) || a.source_rank - b.source_rank)
    .slice(0, 6)
    .map((item) => ({ paper_title: clip(paperTitle(response, item.paper_id), 70), element_title: item.concept_id ? clip(adaptSourceDomainLabel(conceptTitle(response, item.concept_id), query), 70) : undefined, snippet: clip(adaptSourceDomainLabel(item.quote ?? item.paraphrase, query), 90) }));

  return {
    user_query: clip(query, 320),
    intent: response.intent,
    inferred_design_themes: themes,
    selected_source_papers: selectedPapers.map((paper) => ({ title: clip(paper.title, 90), reason_for_selection: clip(paper.reason, 70), role: paper.role })),
    top_relevant_design_requirements: byType(["DesignRequirement"], 3),
    top_relevant_design_principles: byType(["DesignPrinciple"], 3),
    top_relevant_design_features: byType(["DesignFeature"], 3),
    top_artifacts_evaluations_output_knowledge: byType(["Artifact", "Evaluation", "OutputKnowledge", "KernelTheory", "Limitation"], 2),
    relation_paths: relationPaths.slice(0, 3),
    evidence_snippets: evidence,
    query_adaptation_targets: queryAdaptationTargets(query, themes.map((theme) => theme.id)),
    compact_design_move_candidates: (response.flow_rows ?? []).slice(0, 3).map((row) => ({ principle: clip(row.principle_label, 60), feature: clip(row.feature_label, 60), supporting_paper_titles: row.supporting_papers.map((paperId) => clip(paperTitle(response, paperId), 45)), adaptation_status: row.adaptation_status }))
  };
}

const markdownSystemPrompt = "You are an evidence-grounded DSR decision-support assistant for reusing a curated OKF library. Do not summarize papers generically. Convert retrieved requirements, principles, features, artifacts, evaluations, and evidence into actionable design guidance for the user's design problem. Use only retrieved context. Mark domain adaptations as mixed or query-generated. Do not invent papers or evidence. Do not output raw evidence IDs, raw concept IDs, or paper IDs. Do not use healthcare/HIE-specific labels unless the user asks about healthcare, HIE, or consent. Return concise Markdown only.";

function markdownUserPrompt(context: ReturnType<typeof buildMarkdownSynthesisContext>) {
  return [
    "Write concise Markdown with exactly: # Recommendation, ## Design moves to reuse, ## Suggested architecture direction, ## What not to overclaim.",
    "Recommendation: 3 sentences. Design moves: 5 numbered moves. Each move must include **What to build:**, **Reuse from OKF:**, **Supporting papers:**, **Evidence:**, **Adaptation status:**.",
    "Rules: mention paper names naturally, never raw evidence IDs, never raw concept IDs, never paper IDs, never naked source-paper lists. Exclude weakly relevant papers from design moves. Name design moves in the user's domain using inferred themes and query_adaptation_targets; source-domain labels such as capacity exchange, KYC onboarding, sensor data, token exchanger, or HIE consent are supporting patterns, not the thing to build, unless the user asked for that source domain. Prefer domain adaptation over literal copying. If a product-specific construct is not directly stored in OKF, mark it mixed or query-generated. Do not use HIE-specific labels directly unless the user asks about healthcare or consent.",
    "Compact retrieved OKF context:",
    JSON.stringify(context)
  ].join("\n\n");
}

function groqFallback(response: OkfChatResponse, reason: string, status?: number, rawProviderOutput?: string, connected = false, rawProviderError?: string, compactContext?: ReturnType<typeof buildMarkdownSynthesisContext>): OkfChatResponse {
  const baseUrl = process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1";
  const evidenceRefs: OkfEvidenceRef[] = response.evidence.map((item) => ({ evidence_id: item.evidence_id, paper_id: item.paper_id, concept_id: item.concept_id, excerpt: item.quote ?? item.paraphrase, section: item.section, page_number: item.page_number, confidence: item.confidence as OkfEvidenceRef["confidence"] }));
  const fallbackPayload = buildFallbackAnswer(response.interpreted_problem ?? "OKF query", (response.flow_rows ?? []).slice(0, 7), response.source_papers, evidenceRefs, undefined, reason);
  const answer = `LLM synthesis failed; showing compact retrieval summary.

${renderDecisionSupportMarkdown(fallbackPayload)}`;
  return {
    ...response,
    answer,
    answer_payload: fallbackPayload,
    llm_synthesis: {
      synthesis_mode: "fallback_error",
      answer_markdown: answer,
      provider_metadata: { provider: "groq", model: process.env.GROQ_MODEL, status, base_url: safeBaseUrl(baseUrl) },
      debug: { fallback_reason: reason, provider_response_status: status, raw_provider_error: rawProviderError, raw_provider_output: rawProviderOutput, compact_context: compactContext }
    },
    runtime: { provider_configured: Boolean(process.env.GROQ_API_KEY && process.env.GROQ_MODEL), provider_connected: connected, synthesis_attempted: true, synthesis_mode: "fallback_error", provider: "groq", fallback_reason: reason },
    warnings: [...response.warnings, `Groq Markdown synthesis failed. ${reason}`]
  };
}

function nodeConceptId(response: OkfChatResponse, nodeId: string) {
  return response.flow.nodes.find((node) => node.id === nodeId)?.concept_id;
}

function queryAdaptationTargets(query: string, themeIds: string[]) {
  const q = query.toLowerCase();
  const has = (terms: string[]) => terms.some((term) => q.includes(term));
  const themeSet = new Set(themeIds);
  const targets: Array<{ design_move: string; grounded_by: string[]; adaptation_status: "mixed" | "query-generated" }> = [];
  if (themeSet.has("identity") && themeSet.has("integrity")) targets.push({ design_move: has(["product", "listing", "variant"]) ? "canonical product/listing identity mapping integrity" : "canonical entity identity mapping integrity", grounded_by: ["identity / credentials / issuer-verifier-holder", "integrity / manipulation prevention"], adaptation_status: "mixed" });
  if (themeSet.has("privacy") && has(["raw", "commercial", "sensitive", "competitor", "competitors", "privacy"])) targets.push({ design_move: "privacy-preserving evidence handling with raw data minimization", grounded_by: ["privacy / data minimization / sensitive data protection", "integrity / manipulation prevention"], adaptation_status: "mixed" });
  if (themeSet.has("identity") && has(["credential", "seller", "buyer", "marketplace", "verifier", "verified"])) targets.push({ design_move: "persistent actor credentials, verifier checks, and revocation/status handling", grounded_by: ["identity / credentials / issuer-verifier-holder"], adaptation_status: "mixed" });
  if (themeSet.has("trust") && has(["review", "verified", "purchase", "reputation", "screening"])) targets.push({ design_move: has(["review"]) ? "verified-action review gate and reputation continuity" : "screening and reputation gate", grounded_by: ["screening / reputation / trust", "identity / credentials / issuer-verifier-holder"], adaptation_status: "query-generated" });
  if (themeSet.has("auditability") && has(["history", "continuity", "status", "relist", "relisting", "trace"])) targets.push({ design_move: "status-history continuity and audit trail", grounded_by: ["auditability / status history"], adaptation_status: "mixed" });
  if (themeSet.has("governance") && has(["governance", "dispute", "correction", "authority", "fairness", "competitor", "competitors"])) targets.push({ design_move: "dispute, correction, and authority governance", grounded_by: ["governance / authority / fairness"], adaptation_status: "mixed" });
  if (themeSet.has("lifecycle")) targets.push({ design_move: "implementation and evaluation lifecycle", grounded_by: ["implementation lifecycle / evaluation"], adaptation_status: "mixed" });
  return targets.slice(0, 7);
}

function adaptSourceDomainLabel(value: string | undefined, query: string) {
  let text = value ?? "";
  const q = query.toLowerCase();
  if (!/sensor|iot|device|measurement/.test(q)) text = text.replace(/sensor data/gi, "source data").replace(/sensor/gi, "source");
  if (!/health|healthcare|patient|consent|medical|hie/.test(q)) {
    text = text
      .replace(/patients?/gi, "authorized users")
      .replace(/providers?/gi, "authorized organizations")
      .replace(/HIEs?/g, "authorized networks")
      .replace(/health information exchanges?/gi, "authorized networks")
      .replace(/consent transactions?/gi, "permission-status records")
      .replace(/consent status/gi, "permission status")
      .replace(/consent/gi, "permission");
  }
  if (!/capacity|tender|supplier|procurement/.test(q)) text = text.replace(/capacity exchange/gi, "interorganizational exchange").replace(/tender/gi, "transaction");
  if (!/kyc|bank|customer/.test(q)) text = text.replace(/KYC/gi, "credential");
  return text;
}

function paperTitle(response: OkfChatResponse, paperId: string) {
  return response.source_papers.find((paper) => paper.paper_id === paperId)?.title ?? paperId;
}

function conceptTitle(response: OkfChatResponse, conceptId: string) {
  return response.retrieved_concepts.find((concept) => concept.concept_id === conceptId)?.title ?? "Retrieved OKF element";
}

function conceptText(concept: OkfConcept) {
  return [concept.title, concept.description, concept.body_text, concept.tags.join(" ")].join(" ").toLowerCase();
}

function confidenceScore(value: string) {
  if (value === "high") return 3;
  if (value === "medium-high") return 2.5;
  if (value === "medium") return 2;
  return 1;
}

function clip(value: string | undefined, limit: number) {
  const text = (value ?? "").replace(/\s+/g, " ").trim();
  return text.length > limit ? `${text.slice(0, limit - 1)}...` : text;
}

function scrubDefaultAnswerMarkdown(value: string) {
  return value
    .replace(/\b[A-Z][A-Z0-9_]{2,}:[A-Za-z0-9_.:-]+\b/g, "stored OKF concept")
    .replace(/\bev[_-][A-Za-z0-9_.:-]+\b/gi, "evidence snippet")
    .replace(/\b[A-Z][A-Z0-9_]{2,}_(?:19|20)\d{2}\b/g, "the retrieved paper")
    .trim();
}

function providerErrorMessage(data: unknown) {
  if (!data || typeof data !== "object") return undefined;
  const record = data as Record<string, unknown>;
  const error = record.error;
  if (error && typeof error === "object" && "message" in error) return String((error as { message?: unknown }).message);
  if (typeof record.message === "string") return record.message;
  if (typeof record.raw === "string") return record.raw.slice(0, 500);
  return undefined;
}

function safeBaseUrl(value: string) {
  try {
    const url = new URL(value);
    return `${url.hostname}${url.pathname.replace(/\/$/, "")}`;
  } catch {
    return value.replace(/^https?:\/\//, "").replace(/\?.*$/, "");
  }
}

function providerErrorStillConnected(reason: string) {
  return !/(request failed:\s*(401|403)|fetch failed|network|abort|timeout|ECONN|ENOTFOUND|ETIMEDOUT|rate limit|429)/i.test(reason);
}