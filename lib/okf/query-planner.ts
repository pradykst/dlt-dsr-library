import { isGeminiRateLimit, queryPlannerSystemPrompt, requestGeminiQueryPlanJson, type GeminiQueryPlanRequestResult } from "../llm/gemini.ts";
import { isProviderResponseReachable } from "../llm/provider.ts";
import { getLlmRuntimePolicy, isLiveLlmWorkAllowed, logLlmUsage, summarizeLlmUsage } from "../llm/runtime-policy.ts";
import { detectNamedPapers, extractQueryCriteria, inferRequestedTypes, normalizeText, unique } from "./policy.ts";
import { detectDeterministicIntent, hasMeaningfulActionAndTheme, isMessyNaturalLanguageQuery } from "./query-interpreter.ts";
import { getOkfKnowledgeBase } from "./retrieval.ts";
import { isOkfConceptType, type OkfChatIntent, type OkfConceptType, type OkfKnowledgeBase } from "./schema.ts";

export type QueryPlanConfidence = "high" | "medium" | "low";
export type QueryPlanOutputShape =
  | "counts"
  | "library_coverage"
  | "paper_list"
  | "exact_elements"
  | "flow_graph"
  | "design_recommendation"
  | "evidence"
  | "comparison"
  | "lifecycle"
  | "evaluation_plan"
  | "clarification";

export type QueryPlannerStatus = {
  provider: "gemini" | "groq";
  configured: boolean;
  reachable: boolean;
  attempted: boolean;
  http_status?: number;
  outcome: "success" | "rate_limited" | "validation_error" | "provider_error";
  error_type?: string;
  fallback_reason?: string;
  model?: string;
  finish_reason?: string;
  prompt_chars: number;
  completion_chars: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  prompt_tokens_estimated: boolean;
  completion_tokens_estimated: boolean;
  estimated_cost_usd?: number;
};

export type QueryPlan = {

  intent: OkfChatIntent;
  confidence: QueryPlanConfidence;
  requested_output_shape: QueryPlanOutputShape;
  named_papers: string[];
  requested_element_types: string[];
  themes: string[];
  must_have_criteria: string[];
  optional_criteria: string[];
  requires_cross_paper: boolean;
  requires_graph: boolean;
  requires_llm_synthesis: boolean;
  clarification_question?: string;
  planner_status?: QueryPlannerStatus;
};

const allowedIntents: OkfChatIntent[] = [
  "LIBRARY_STATS_QUERY",
  "LIBRARY_OVERVIEW_QUERY",
  "LIBRARY_COVERAGE_QUERY",
  "PAPER_DISCOVERY_QUERY",
  "PAPER_ELEMENT_QUERY",
  "DSR_FLOW_QUERY",
  "DESIGN_REUSE_QUERY",
  "DESIGN_REUSE_FLOW_QUERY",
  "EVIDENCE_QUERY",
  "COMPARISON_QUERY",
  "IMPLEMENTATION_LIFECYCLE_QUERY",
  "EVALUATION_PLANNING_QUERY",
  "NEGATIVE_OR_EXISTENCE_QUERY",
  "CLARIFICATION_QUERY"
];

export async function planOkfQuery(query: string, deterministicIntent: OkfChatIntent = detectDeterministicIntent(query, getOkfKnowledgeBase()), kb: OkfKnowledgeBase = getOkfKnowledgeBase()): Promise<QueryPlan> {
  const base = buildDeterministicQueryPlan(query, deterministicIntent, kb);
  if (!shouldUseLlmPlanner(query, base, kb)) return base;
  const plannerResult = await requestLlmQueryPlan(query, base, kb);
  if (!plannerResult) return base;
  const validated = validateQueryPlan(plannerResult.candidate, base, kb, query);
  return { ...validated, planner_status: plannerResult.plannerStatus };
}

export function buildDeterministicQueryPlan(query: string, intent: OkfChatIntent = detectDeterministicIntent(query, getOkfKnowledgeBase()), kb: OkfKnowledgeBase = getOkfKnowledgeBase()): QueryPlan {
  const criteria = extractQueryCriteria(query, kb);
  const namedPapers = detectNamedPapers(query, kb).map((paper) => paper.paper_id);
  const requestedTypes = criteria.requestedTypes.length ? criteria.requestedTypes : inferRequestedTypes(query);
  const confidence = deterministicConfidence(query, intent, namedPapers, requestedTypes);
  return {
    intent,
    confidence,
    requested_output_shape: outputShapeForIntent(intent),
    named_papers: namedPapers,
    requested_element_types: unique(requestedTypes).filter((type) => type !== "Paper"),
    themes: criteria.themes,
    must_have_criteria: criteria.mustHaveTerms,
    optional_criteria: criteria.optionalTerms,
    requires_cross_paper: requiresCrossPaper(intent, namedPapers),
    requires_graph: intent === "DSR_FLOW_QUERY" || intent === "DESIGN_REUSE_FLOW_QUERY",
    requires_llm_synthesis: requiresLlmSynthesis(intent),
    clarification_question: intent === "CLARIFICATION_QUERY" ? "Do you want to find papers, extract exact paper elements, build a DSR flow graph, or get design reuse guidance?" : undefined
  };
}

function deterministicConfidence(query: string, intent: OkfChatIntent, namedPapers: string[], requestedTypes: OkfConceptType[]): QueryPlanConfidence {
  const q = normalizeText(query);
  if (!q) return "low";
  if (intent === "CLARIFICATION_QUERY") return "low";
  if (intent === "LIBRARY_STATS_QUERY" || intent === "LIBRARY_OVERVIEW_QUERY" || intent === "LIBRARY_COVERAGE_QUERY") return "high";
  if (intent === "PAPER_ELEMENT_QUERY" && namedPapers.length && requestedTypes.length) return "high";
  if (intent === "PAPER_DISCOVERY_QUERY" && /find (?:me )?(?:a )?papers?|which papers?|which paper has|papers? (?:with|about|that|which)|what papers do we have/.test(q)) return "high";
  if ((intent === "DSR_FLOW_QUERY" || intent === "DESIGN_REUSE_FLOW_QUERY") && /flow|graph|path|trace|map|requirement.*principle.*feature|rpf/.test(q)) return "high";
  if (intent === "NEGATIVE_OR_EXISTENCE_QUERY" || intent === "IMPLEMENTATION_LIFECYCLE_QUERY") return "high";
  if (intent === "DESIGN_REUSE_QUERY" && /i want to|create .*application|build .*system|design .*system|solve(?:s)? the problem|what .*reuse|guide me|principles?.*things?.*reuse/.test(q)) return "high";
  if (intent === "EVIDENCE_QUERY" || intent === "COMPARISON_QUERY" || intent === "EVALUATION_PLANNING_QUERY") return "medium";
  if (intent === "DESIGN_REUSE_QUERY") return "medium";
  return "medium";
}

function outputShapeForIntent(intent: OkfChatIntent): QueryPlanOutputShape {
  if (intent === "LIBRARY_STATS_QUERY") return "counts";
  if (intent === "LIBRARY_COVERAGE_QUERY") return "library_coverage";
  if (intent === "PAPER_ELEMENT_QUERY") return "exact_elements";
  if (intent === "PAPER_DISCOVERY_QUERY" || intent === "LIBRARY_OVERVIEW_QUERY" || intent === "NEGATIVE_OR_EXISTENCE_QUERY") return "paper_list";
  if (intent === "DSR_FLOW_QUERY" || intent === "DESIGN_REUSE_FLOW_QUERY") return "flow_graph";
  if (intent === "DESIGN_REUSE_QUERY") return "design_recommendation";
  if (intent === "EVIDENCE_QUERY") return "evidence";
  if (intent === "COMPARISON_QUERY") return "comparison";
  if (intent === "IMPLEMENTATION_LIFECYCLE_QUERY") return "lifecycle";
  if (intent === "EVALUATION_PLANNING_QUERY") return "evaluation_plan";
  return "clarification";
}

function shouldUseLlmPlanner(query: string, base: QueryPlan, kb: OkfKnowledgeBase) {
  if (base.confidence === "high") return false;
  if (!isLiveLlmWorkAllowed("planning", base.intent)) return false;
  if (String(process.env.OKF_DISABLE_LLM_QUERY_PLANNER ?? "false").toLowerCase() === "true") return false;
  const provider = queryPlannerProvider();
  if (!provider) return false;
  if (isTestRun() && !isLivePlannerTestEnabled(provider)) return false;
  if (!hasMeaningfulActionAndTheme(query, kb)) return false;
  return isMessyNaturalLanguageQuery(query) || base.confidence === "low" || base.confidence === "medium";
}

type PlannerTransportResult = GeminiQueryPlanRequestResult;
type PlannerRequestResult = { candidate?: Partial<QueryPlan>; plannerStatus: QueryPlannerStatus };

async function requestLlmQueryPlan(query: string, base: QueryPlan, kb: OkfKnowledgeBase): Promise<PlannerRequestResult | undefined> {
  const provider = queryPlannerProvider();
  if (!provider) return undefined;
  const payload = plannerPromptPayload(query, base, kb);
  const promptChars = queryPlannerSystemPrompt.length + JSON.stringify(payload).length;
  if (promptChars > getLlmRuntimePolicy().maxPromptChars) return undefined;
  const model = provider === "gemini"
    ? process.env.GEMINI_PLANNER_MODEL ?? process.env.GEMINI_MODEL
    : process.env.GROQ_MODEL;
  let transport: PlannerTransportResult;
  try {
    transport = provider === "gemini"
      ? await requestGeminiQueryPlanJson(payload)
      : await requestGroqQueryPlan(payload);
  } catch (error) {
    transport = {
      attempted: true,
      errorType: "planner_request_error",
      errorMessage: error instanceof Error ? error.message : "Unknown query planner request error.",
      outputChars: 0
    };
  }
  if (!transport.attempted) return undefined;
  const candidate = isQueryPlanCandidate(transport.candidate)
    ? transport.candidate as Partial<QueryPlan>
    : undefined;
  const plannerStatus = buildPlannerStatus(provider, model, promptChars, transport, Boolean(candidate));
  return {
    candidate: plannerStatus.outcome === "success" ? candidate : undefined,
    plannerStatus
  };
}

function isQueryPlanCandidate(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function queryPlannerProvider(): "gemini" | "groq" | undefined {
  const requested = (process.env.LLM_PROVIDER ?? process.env.CHAT_PROVIDER ?? "none").toLowerCase();
  if (requested === "gemini" && process.env.GEMINI_API_KEY && (process.env.GEMINI_PLANNER_MODEL || process.env.GEMINI_MODEL)) return "gemini";
  if (requested === "groq" && process.env.GROQ_API_KEY && process.env.GROQ_MODEL) return "groq";
  return undefined;
}

function isTestRun() {
  return process.env.npm_lifecycle_event === "test" || process.argv.some((arg) => /okf\.test\.ts|node:test|--test/.test(arg));
}

function plannerPromptPayload(query: string, base: QueryPlan, kb: OkfKnowledgeBase) {
  return {
    user_query: query,
    deterministic_base_plan: base,
    allowed_intents: allowedIntents,
    query_plan_schema: { intent: "allowed intent", confidence: "high|medium|low", requested_output_shape: "counts|library_coverage|paper_list|exact_elements|flow_graph|design_recommendation|evidence|comparison|lifecycle|evaluation_plan|clarification", named_papers: [], requested_element_types: [], themes: [], must_have_criteria: [], optional_criteria: [], requires_cross_paper: true, requires_graph: false, requires_llm_synthesis: false, clarification_question: "optional" },
    known_papers: kb.papers.map((paper) => ({ paper_id: paper.paper_id, title: paper.title })).slice(0, 50),
    known_element_types: ["Problem", "ResearchQuestion", "DesignRequirement", "DesignPrinciple", "DesignFeature", "Artifact", "Evaluation", "OutputKnowledge", "KernelTheory", "Limitation"],
    rules: ["Do not choose facts, citations, evidence, final sources, or claims.", "If the user asks which paper has a theme, classify as PAPER_DISCOVERY_QUERY.", "If the user asks to create/build/design an application/system and asks what to reuse, classify as DESIGN_REUSE_QUERY unless a graph/flow is requested.", "Clarification should be rare; use it only for greetings or underspecified queries without domain/action."]
  };
}
async function requestGroqQueryPlan(payload: ReturnType<typeof plannerPromptPayload>): Promise<PlannerTransportResult> {
  const baseUrl = process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number(process.env.GROQ_QUERY_PLANNER_TIMEOUT_MS ?? 4000));
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.GROQ_MODEL,
        temperature: 0,
        max_tokens: 700,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: queryPlannerSystemPrompt },
          { role: "user", content: JSON.stringify(payload) }
        ]
      })
    });
    const data = await response.json().catch(() => undefined);
    const usage = data?.usage;
    const finishReason = data?.choices?.[0]?.finish_reason;
    if (!response.ok) {
      const error = plannerProviderErrorInfo(data);
      return {
        attempted: true,
        status: response.status,
        finishReason,
        errorType: error.type,
        errorMessage: error.message ?? "Groq query planner request failed: " + response.status,
        outputChars: error.message?.length ?? 0,
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
        totalTokens: usage?.total_tokens
      };
    }
    const content = data?.choices?.[0]?.message?.content;
    if (typeof finishReason !== "string" || finishReason.toLowerCase() !== "stop") {
      return {
        attempted: true,
        status: response.status,
        finishReason,
        errorType: "incomplete_finish_reason",
        errorMessage: "Groq query planner returned finish reason " + (finishReason ?? "missing") + ".",
        outputChars: typeof content === "string" ? content.length : 0,
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
        totalTokens: usage?.total_tokens
      };
    }
    if (typeof content !== "string" || !content.trim()) {
      return {
        attempted: true,
        status: response.status,
        finishReason,
        errorType: "empty_planner_output",
        errorMessage: "Groq query planner returned an empty response.",
        outputChars: 0,
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
        totalTokens: usage?.total_tokens
      };
    }
    try {
      return {
        attempted: true,
        status: response.status,
        candidate: JSON.parse(content),
        finishReason,
        outputChars: content.length,
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
        totalTokens: usage?.total_tokens
      };
    } catch {
      return {
        attempted: true,
        status: response.status,
        finishReason,
        errorType: "planner_json_parse_failed",
        errorMessage: "Groq query planner returned malformed JSON.",
        outputChars: content.length,
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
        totalTokens: usage?.total_tokens
      };
    }
  } catch (error) {
    return {
      attempted: true,
      errorType: error instanceof DOMException && error.name === "AbortError" ? "planner_timeout" : "planner_request_error",
      errorMessage: error instanceof Error ? error.message : "Unknown Groq query planner error.",
      outputChars: 0
    };
  } finally {
    clearTimeout(timer);
  }
}

function buildPlannerStatus(
  provider: "gemini" | "groq",
  model: string | undefined,
  promptChars: number,
  transport: PlannerTransportResult,
  hasCandidate: boolean
): QueryPlannerStatus {
  const errorType = transport.errorType ?? (hasCandidate ? undefined : "planner_schema_validation_failed");
  const rateLimited = isPlannerRateLimit(provider, transport.errorMessage ?? "", transport.status, errorType);
  const outcome: QueryPlannerStatus["outcome"] = rateLimited
    ? "rate_limited"
    : errorType
      ? transport.status !== undefined && transport.status >= 200 && transport.status < 300
        ? "validation_error"
        : "provider_error"
      : hasCandidate
        ? "success"
        : "validation_error";
  const usage = summarizeLlmUsage({
    promptChars,
    outputChars: transport.outputChars,
    promptTokens: transport.promptTokens,
    outputTokens: transport.completionTokens
  });
  logLlmUsage(provider, model, usage, false);
  return {
    provider,
    configured: true,
    reachable: isProviderResponseReachable(transport.status, errorType),
    attempted: true,
    http_status: transport.status,
    outcome,
    error_type: errorType,
    fallback_reason: outcome === "success" ? undefined : plannerFailureReason(provider, outcome, transport.status, errorType),
    model,
    finish_reason: transport.finishReason,
    prompt_chars: usage.prompt_chars,
    completion_chars: usage.output_chars,
    prompt_tokens: usage.input_tokens,
    completion_tokens: usage.output_tokens,
    total_tokens: transport.totalTokens ?? usage.total_tokens,
    prompt_tokens_estimated: usage.input_tokens_estimated,
    completion_tokens_estimated: usage.output_tokens_estimated,
    estimated_cost_usd: usage.estimated_cost_usd
  };
}

function isPlannerRateLimit(provider: "gemini" | "groq", reason: string, status?: number, errorType?: string) {
  if (provider === "gemini") return isGeminiRateLimit(reason, status, errorType);
  return status === 429 || status === 503 || /rate.?limit|quota|429|503|unavailable|high demand|overload/i.test((errorType ?? "") + " " + reason);
}

function plannerFailureReason(provider: "gemini" | "groq", outcome: QueryPlannerStatus["outcome"], status?: number, errorType?: string) {
  const label = provider === "gemini" ? "Gemini" : "Groq";
  const detail = [status ? "HTTP " + status : undefined, errorType].filter(Boolean).join(", ");
  const suffix = detail ? " (" + detail + ")" : "";
  if (outcome === "rate_limited") return label + " query planner was rate-limited" + suffix + "; live synthesis skipped to enforce one provider call per request.";
  if (outcome === "validation_error") return label + " query planner response was rejected" + suffix + "; live synthesis skipped to enforce one provider call per request.";
  return label + " query planner request failed" + suffix + "; live synthesis skipped to enforce one provider call per request.";
}

function plannerProviderErrorInfo(data: unknown): { message?: string; type?: string } {
  if (!data || typeof data !== "object") return {};
  const record = data as Record<string, unknown>;
  const error = record.error;
  if (error && typeof error === "object") {
    const typed = error as { message?: unknown; type?: unknown; code?: unknown };
    return {
      message: typed.message ? String(typed.message) : undefined,
      type: typed.type ? String(typed.type) : typed.code ? String(typed.code) : undefined
    };
  }
  return {
    message: typeof record.message === "string" ? record.message : undefined,
    type: typeof record.type === "string" ? record.type : undefined
  };
}

function validateQueryPlan(candidate: Partial<QueryPlan> | undefined, base: QueryPlan, kb: OkfKnowledgeBase, query: string): QueryPlan {
  if (!candidate) return base;
  const paperIds = new Set(kb.papers.map((paper) => paper.paper_id));
  const candidateIntent = typeof candidate.intent === "string" && allowedIntents.includes(candidate.intent as OkfChatIntent) ? candidate.intent as OkfChatIntent : base.intent;
  const meaningfulDeterministic = hasMeaningfulActionAndTheme(query, kb) && base.intent !== "CLARIFICATION_QUERY";
  const intent = base.confidence === "high"
    ? base.intent
    : candidateIntent === "CLARIFICATION_QUERY" && meaningfulDeterministic
      ? base.intent
      : candidateIntent;
  const named_papers = unique([...base.named_papers, ...arrayOfStrings(candidate.named_papers).flatMap((value) => matchKnownPaper(value, kb))]).filter((paperId) => paperIds.has(paperId));
  const requested_element_types = unique([...base.requested_element_types, ...arrayOfStrings(candidate.requested_element_types)]).filter((type) => isOkfConceptType(type) && type !== "Paper");
  return {
    intent,
    confidence: base.confidence === "high" ? base.confidence : validateConfidence(candidate.confidence) ?? base.confidence,
    requested_output_shape: validateOutputShape(candidate.requested_output_shape) ?? outputShapeForIntent(intent),
    named_papers,
    requested_element_types,
    themes: unique([...base.themes, ...arrayOfStrings(candidate.themes)]).slice(0, 12),
    must_have_criteria: unique([...base.must_have_criteria, ...arrayOfStrings(candidate.must_have_criteria)]).slice(0, 12),
    optional_criteria: unique([...base.optional_criteria, ...arrayOfStrings(candidate.optional_criteria)]).slice(0, 18),
    requires_cross_paper: Boolean(candidate.requires_cross_paper ?? base.requires_cross_paper) || requiresCrossPaper(intent, named_papers),
    requires_graph: Boolean(candidate.requires_graph ?? base.requires_graph) || intent === "DSR_FLOW_QUERY" || intent === "DESIGN_REUSE_FLOW_QUERY",
    requires_llm_synthesis: Boolean(candidate.requires_llm_synthesis ?? base.requires_llm_synthesis) || requiresLlmSynthesis(intent),
    clarification_question: intent === "CLARIFICATION_QUERY" && typeof candidate.clarification_question === "string" && candidate.clarification_question.trim() ? candidate.clarification_question.trim() : base.clarification_question
  };
}

function requiresCrossPaper(intent: OkfChatIntent, namedPapers: string[]) {
  return !namedPapers.length && ["LIBRARY_COVERAGE_QUERY", "PAPER_DISCOVERY_QUERY", "DESIGN_REUSE_QUERY", "DESIGN_REUSE_FLOW_QUERY", "COMPARISON_QUERY", "EVALUATION_PLANNING_QUERY"].includes(intent);
}

function requiresLlmSynthesis(intent: OkfChatIntent) {
  return ["DESIGN_REUSE_QUERY", "DESIGN_REUSE_FLOW_QUERY", "COMPARISON_QUERY", "EVALUATION_PLANNING_QUERY"].includes(intent);
}

function matchKnownPaper(value: string, kb: OkfKnowledgeBase) {
  const normalized = normalizeText(value);
  return kb.papers
    .filter((paper) => normalizeText(paper.paper_id) === normalized || normalizeText(paper.title) === normalized || normalizeText(paper.title).includes(normalized))
    .map((paper) => paper.paper_id);
}

function arrayOfStrings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim()) : [];
}

function validateConfidence(value: unknown): QueryPlanConfidence | undefined {
  return value === "high" || value === "medium" || value === "low" ? value : undefined;
}

function validateOutputShape(value: unknown): QueryPlanOutputShape | undefined {
  const allowed: QueryPlanOutputShape[] = ["counts", "library_coverage", "paper_list", "exact_elements", "flow_graph", "design_recommendation", "evidence", "comparison", "lifecycle", "evaluation_plan", "clarification"];
  return typeof value === "string" && allowed.includes(value as QueryPlanOutputShape) ? value as QueryPlanOutputShape : undefined;
}

function isLivePlannerTestEnabled(provider: "gemini" | "groq") {
  if (String(process.env.OKF_LLM_QUERY_PLANNER_LIVE_TEST ?? "false").toLowerCase() === "true") return true;
  const providerFlag = provider === "gemini" ? process.env.GEMINI_LIVE_TEST : process.env.GROQ_LIVE_TEST;
  return String(providerFlag ?? "false").toLowerCase() === "true";
}

