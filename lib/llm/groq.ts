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
  const maxTokens = Number(process.env.GROQ_MAX_TOKENS ?? 1600);
  const temperature = Number(process.env.GROQ_TEMPERATURE ?? 0.2);
  const context = buildMarkdownSynthesisContext(deterministic);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let status: number | undefined;
  let rawProviderError: string | undefined;
  let rawProviderErrorType: string | undefined;
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
      const errorInfo = providerErrorInfo(data);
      rawProviderError = errorInfo.message ?? `Groq request failed: ${response.status}`;
      rawProviderErrorType = errorInfo.type;
      throw new Error(rawProviderError);
    }
    const content = data?.choices?.[0]?.message?.content;
    rawProviderOutput = typeof content === "string" ? content : JSON.stringify(data).slice(0, 2000);
    if (typeof content !== "string" || !content.trim()) throw new Error("Groq response did not contain Markdown content.");
    const answerMarkdown = scrubDefaultAnswerMarkdown(content.trim(), deterministic.source_papers.map((paper) => paper.title));
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
      runtime: { ...deterministic.runtime, provider_configured: true, provider_connected: true, synthesis_attempted: true, synthesis_mode: "groq", provider: "groq" },
      warnings: [...deterministic.warnings, "Groq Markdown synthesis used for the default answer."]
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown Groq synthesis error";
    return groqFallback(deterministic, reason, status, rawProviderOutput, providerErrorStillConnected(reason, status, rawProviderErrorType), rawProviderError, context, rawProviderErrorType);
  } finally {
    clearTimeout(timer);
  }
}

export function buildMarkdownSynthesisContext(response: OkfChatResponse) {
  const query = response.interpreted_problem ?? "";
  const themes = inferDesignThemes(query).map((theme) => ({ id: theme.id, label: theme.label }));
  const relationConceptIds = new Set(response.flow.edges.flatMap((edge) => [nodeConceptId(response, edge.source), nodeConceptId(response, edge.target)]).filter((id): id is string => Boolean(id)));
  const evidenceConceptIds = new Set(response.evidence.map((item) => item.concept_id).filter((id): id is string => Boolean(id)));
  const selectedPapers = response.source_papers.slice(0, 6);
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
    .slice(0, 12)
    .map((item) => ({ paper_title: clip(paperTitle(response, item.paper_id), 70), element_title: item.concept_id ? clip(adaptSourceDomainLabel(conceptTitle(response, item.concept_id), query), 70) : undefined, snippet: clip(adaptSourceDomainLabel(item.quote ?? item.paraphrase, query), 140) }));
  const paperContexts = selectedPapers.map((paper) => {
    const paperConcepts = concepts.filter((concept) => concept.paper_id === paper.paper_id).sort((a, b) => conceptScore(b) - conceptScore(a));
    const topByType = (types: string[], limit: number) => paperConcepts
      .filter((concept) => types.includes(concept.type))
      .slice(0, limit)
      .map((concept) => ({ title: clip(adaptSourceDomainLabel(concept.title, query), 90), why_relevant: relevantTo(concept).join("; ") || clip(adaptSourceDomainLabel(concept.description || concept.body_text, query), 120) || "matched retrieved OKF concept" }));
    const paperEvidence = response.evidence
      .filter((item) => item.paper_id === paper.paper_id)
      .map((item) => ({ ...item, relation_connected: item.concept_id ? relationConceptIds.has(item.concept_id) : false }))
      .sort((a, b) => Number(b.relation_connected) - Number(a.relation_connected))
      .slice(0, 3)
      .map((item) => ({ element_title: item.concept_id ? clip(adaptSourceDomainLabel(conceptTitle(response, item.concept_id), query), 80) : undefined, snippet: clip(adaptSourceDomainLabel(item.quote ?? item.paraphrase, query), 160) }));
    return {
      paper_id: paper.paper_id,
      title: clip(paper.title, 110),
      role_for_this_query: paper.role,
      reason_for_selection: clip(paper.reason, 180),
      top_relevant_requirements: topByType(["DesignRequirement"], 2),
      top_relevant_principles: topByType(["DesignPrinciple"], 2),
      top_relevant_features_artifacts: topByType(["DesignFeature", "Artifact", "OutputKnowledge"], 3),
      top_evidence_snippets: paperEvidence
    };
  });
  return {
    answer_plan: response.answer_plan ? { intent: response.answer_plan.intent, answer_shape: response.answer_plan.answer_shape, selected_papers: response.answer_plan.selected_papers, paper_matches: response.answer_plan.paper_matches, design_moves: response.answer_plan.design_moves, flow_rows: response.answer_plan.flow_rows, comparison_rows: response.answer_plan.comparison_rows, evidence_pack: response.answer_plan.evidence_pack, constraints: response.answer_plan.constraints, things_to_avoid: response.answer_plan.things_to_avoid, synthesis_policy: response.answer_plan.synthesis_policy, criteria: response.answer_plan.criteria } : undefined,
    user_query: clip(query, 320),
    intent: response.intent,
    inferred_design_themes: themes,
    selected_source_papers: paperContexts,
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

const markdownSystemPrompt = "You are an evidence-grounded DSR decision-support assistant. You receive a validated deterministic AnswerPlan plus compact OKF context. Use only that plan, its papers, concepts, relation rows, and evidence. Never add papers, citations, evidence, concepts, or unsupported mechanisms. Do not output raw evidence IDs or concept IDs in the default answer. Follow the answer-type prompt exactly and keep Markdown concise.";

function markdownUserPrompt(context: ReturnType<typeof buildMarkdownSynthesisContext>) {
  return [
    promptTemplateForIntent(context.intent),
    "AnswerPlan rules: use only answer_plan and compact retrieved OKF context; do not add papers, evidence, concepts, relation rows, or unsupported mechanisms; do not expose raw evidence IDs, concept IDs, or paper IDs; opening paragraph must reference the actual task and dominant source(s).",
    "Domain adaptation rules: mark adapted target-domain constructs as mixed or query-generated. Do not use HIE/healthcare labels unless the query asks about healthcare, HIE, or consent. Do not use NIL/NFT allocation unless the query asks about NFTs, royalties, fairness, or random allocation. Do not use peer-review tokenization unless the query asks about token incentives or reviewer rewards.",
    "Validated AnswerPlan and compact OKF context:",
    JSON.stringify(context)
  ].join("\n\n");
}

function promptTemplateForIntent(intent: string) {
  const templates: Record<string, string> = {
    PAPER_DISCOVERY_QUERY: "Write concise Markdown for a paper discovery answer. Start with 'I found <n> strong matches and <n> partial matches'. Return ranked papers grouped into strong and partial matches. Do not recommend an architecture.",
    PAPER_ELEMENT_QUERY: "Write concise Markdown for exact extraction from the named paper. Group by requested element type. Do not mention unrelated papers and do not provide architecture guidance.",
    DSR_FLOW_QUERY: "Write concise Markdown for a relation-backed DSR flow. Say the layered graph is in the Flow tab, include only a short branch summary from answer_plan.flow_rows, and do not output generic design moves or a raw graph dump.",
    DESIGN_REUSE_QUERY: "Write Markdown with sections # Recommendation, ## Design moves to reuse, ## Suggested architecture direction, ## What not to overclaim. Provide 5-7 grounded design moves from answer_plan.design_moves.",
    DESIGN_REUSE_FLOW_QUERY: "Write Markdown with sections # Recommendation, ## Design moves to reuse, ## Flow graph, ## Suggested architecture direction, ## What not to overclaim. State that the graph is a mixed reuse flow and that product/problem-specific nodes are query_generated or mixed.",
    EVIDENCE_QUERY: "Write concise Markdown grouped by paper and concept evidence. Do not generate architecture recommendations. Say when evidence is related but not exact.",
    COMPARISON_QUERY: "Write concise Markdown with a comparison table by paper and DSR element type, then similarities, differences, and reuse implications. Do not collapse it into generic design advice.",
    IMPLEMENTATION_LIFECYCLE_QUERY: "Write concise Markdown centered on Integrated Blockchain ISDM. Include analysis -> preliminary design -> detailed design -> construction -> transition -> maintenance -> retirement, plus roles and models. Avoid IoT/HIE/privacy content unless requested.",
    EVALUATION_PLANNING_QUERY: "Write concise Markdown with evaluation design options, what retrieved papers did, limitations, and fit to artifact maturity.",
    LIBRARY_OVERVIEW_QUERY: "Write a deterministic-style loaded-paper overview with one-line contribution per paper. No extra recommendations.",
    LIBRARY_STATS_QUERY: "Write a deterministic-style statistics answer. Preserve exact counts from answer_plan and do not estimate.",
    NEGATIVE_OR_EXISTENCE_QUERY: "Write a strict existence/no-match answer. If no formal stored DesignPrinciple matches, say so. Related mechanisms must be clearly marked as related, not formal.",
    CLARIFICATION_QUERY: "Ask one concise clarification or give 2-3 possible interpretations. Do not retrieve broadly."
  };
  return templates[intent] ?? templates.DESIGN_REUSE_QUERY;
}

function groqFallback(response: OkfChatResponse, reason: string, status?: number, rawProviderOutput?: string, connected = false, rawProviderError?: string, compactContext?: ReturnType<typeof buildMarkdownSynthesisContext>, errorType?: string): OkfChatResponse {
  const baseUrl = process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1";
  const evidenceRefs: OkfEvidenceRef[] = response.evidence.map((item) => ({ evidence_id: item.evidence_id, paper_id: item.paper_id, concept_id: item.concept_id, excerpt: item.quote ?? item.paraphrase, section: item.section, page_number: item.page_number, confidence: item.confidence as OkfEvidenceRef["confidence"] }));
  const rateLimited = status === 429 || /429|rate limit/i.test(reason) || errorType === "rate_limit_exceeded";
  const fallbackMode = rateLimited ? "fallback_rate_limited" as const : "fallback_provider_error" as const;
  const providerErrorType = errorType ?? (rateLimited ? "rate_limit_exceeded" : undefined);
  const prefix = rateLimited ? "Groq rate limit reached; showing structured OKF answer." : "LLM synthesis failed; showing structured OKF answer.";
  const shouldUseReuseFallback = response.intent === "DESIGN_REUSE_QUERY" || response.intent === "DESIGN_REUSE_FLOW_QUERY";
  const fallbackPayload = shouldUseReuseFallback ? { ...buildFallbackAnswer(response.interpreted_problem ?? "OKF query", (response.flow_rows ?? []).slice(0, 7), response.source_papers, evidenceRefs, undefined, reason), synthesis_mode: fallbackMode } : response.answer_payload ? { ...response.answer_payload, synthesis_mode: fallbackMode } : undefined;
  const answer = shouldUseReuseFallback && fallbackPayload ? `${prefix}\n\n${renderDecisionSupportMarkdown(fallbackPayload)}` : `${prefix}\n\n${response.answer}`;
  return {
    ...response,
    answer,
    answer_payload: fallbackPayload,
    llm_synthesis: {
      synthesis_mode: fallbackMode,
      answer_markdown: answer,
      provider_metadata: { provider: "groq", model: process.env.GROQ_MODEL, status, error_type: providerErrorType, base_url: safeBaseUrl(baseUrl) },
      debug: { fallback_reason: reason, provider_response_status: status, provider_error_type: providerErrorType, raw_provider_error: rawProviderError, raw_provider_output: rawProviderOutput, compact_context: compactContext }
    },
    runtime: { ...response.runtime, provider_configured: Boolean(process.env.GROQ_API_KEY && process.env.GROQ_MODEL), provider_connected: rateLimited || connected, synthesis_attempted: true, synthesis_mode: fallbackMode, provider: "groq", fallback_reason: reason, provider_status_code: status, provider_error_type: providerErrorType },
    warnings: [...response.warnings, `Groq Markdown synthesis fell back. ${reason}`]
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

function scrubDefaultAnswerMarkdown(value: string, paperTitles: string[] = []) {
  return stripNakedPaperTitleTail(value, paperTitles)
    .replace(/\n+#{1,3}\s*(?:Source papers|Sources|Bibliography)\s*\n[\s\S]*$/i, "")
    .replace(/\n+Source papers:\s*[\s\S]*$/i, "")
    .replace(/\b[A-Z][A-Z0-9_]{2,}:[A-Za-z0-9_.:-]+\b/g, "stored OKF concept")
    .replace(/\bev[_-][A-Za-z0-9_.:-]+\b/gi, "evidence snippet")
    .replace(/\b[A-Z][A-Z0-9_]{2,}_(?:19|20)\d{2}\b/g, "the retrieved paper")
    .trim();
}

function stripNakedPaperTitleTail(value: string, paperTitles: string[]) {
  const lines = value.replace(/\s+$/g, "").split(/\r?\n/);
  let index = lines.length - 1;
  while (index >= 0 && !lines[index].trim()) index -= 1;
  const tail: string[] = [];
  while (index >= 0 && isBarePaperTitleLine(lines[index], paperTitles)) {
    tail.unshift(lines[index]);
    index -= 1;
    while (index >= 0 && !lines[index].trim()) index -= 1;
  }
  if (tail.length < 2) return value;
  return lines.slice(0, index + 1).join("\n");
}

function isBarePaperTitleLine(line: string, paperTitles: string[]) {
  const normalized = normalizePaperTitle(line.replace(/^\s*(?:[-*]|\d+[.)])\s+/, ""));
  return paperTitles.some((title) => {
    const full = normalizePaperTitle(title);
    const short = normalizePaperTitle(title.includes(":") ? title.split(":")[0] : title);
    return normalized === full || normalized === short;
  });
}

function normalizePaperTitle(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function providerErrorInfo(data: unknown): { message?: string; type?: string } {
  if (!data || typeof data !== "object") return {};
  const record = data as Record<string, unknown>;
  const error = record.error;
  if (error && typeof error === "object") {
    const err = error as { message?: unknown; type?: unknown; code?: unknown };
    return { message: err.message ? String(err.message) : undefined, type: err.type ? String(err.type) : err.code ? String(err.code) : undefined };
  }
  if (typeof record.message === "string") return { message: record.message, type: typeof record.type === "string" ? record.type : undefined };
  if (typeof record.raw === "string") return { message: record.raw.slice(0, 500) };
  return {};
}
function safeBaseUrl(value: string) {
  try {
    const url = new URL(value);
    return `${url.hostname}${url.pathname.replace(/\/$/, "")}`;
  } catch {
    return value.replace(/^https?:\/\//, "").replace(/\?.*$/, "");
  }
}

function providerErrorStillConnected(reason: string, status?: number, errorType?: string) {
  if (status === 429 || errorType === "rate_limit_exceeded" || /rate limit|429/i.test(reason)) return true;
  if (status === 401 || status === 403) return false;
  return !/(request failed:\s*(401|403)|fetch failed|network|abort|timeout|ECONN|ENOTFOUND|ETIMEDOUT)/i.test(reason);
}



