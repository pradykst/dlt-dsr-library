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
  const llmPlan = await requestGroqQueryPlan(query, base, kb).catch(() => undefined);
  return validateQueryPlan(llmPlan, base, kb, query);
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
  if (String(process.env.OKF_DISABLE_LLM_QUERY_PLANNER ?? "false").toLowerCase() === "true") return false;
  if (!process.env.GROQ_API_KEY || !process.env.GROQ_MODEL) return false;
  if (!hasMeaningfulActionAndTheme(query, kb)) return false;
  return isMessyNaturalLanguageQuery(query) || base.confidence === "low" || base.confidence === "medium";
}

async function requestGroqQueryPlan(query: string, base: QueryPlan, kb: OkfKnowledgeBase): Promise<Partial<QueryPlan> | undefined> {
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
          { role: "system", content: "You are a query interpreter for a DSR OKF library assistant. Classify the user's request into one of the allowed intents. Extract requested element types, named papers, themes, criteria, and output shape. Do not answer the question. Return JSON only." },
          { role: "user", content: JSON.stringify({ user_query: query, deterministic_base_plan: base, allowed_intents: allowedIntents, query_plan_schema: { intent: "allowed intent", confidence: "high|medium|low", requested_output_shape: "counts|library_coverage|paper_list|exact_elements|flow_graph|design_recommendation|evidence|comparison|lifecycle|evaluation_plan|clarification", named_papers: [], requested_element_types: [], themes: [], must_have_criteria: [], optional_criteria: [], requires_cross_paper: true, requires_graph: false, requires_llm_synthesis: false, clarification_question: "optional" }, known_papers: kb.papers.map((paper) => ({ paper_id: paper.paper_id, title: paper.title })).slice(0, 50), known_element_types: ["Problem", "ResearchQuestion", "DesignRequirement", "DesignPrinciple", "DesignFeature", "Artifact", "Evaluation", "OutputKnowledge", "KernelTheory", "Limitation"], rules: ["Do not choose facts, citations, evidence, final sources, or claims.", "If the user asks which paper has a theme, classify as PAPER_DISCOVERY_QUERY.", "If the user asks to create/build/design an application/system and asks what to reuse, classify as DESIGN_REUSE_QUERY unless a graph/flow is requested.", "Clarification should be rare; use it only for greetings or underspecified queries without domain/action."] }) }
        ]
      })
    });
    if (!response.ok) return undefined;
    const data = await response.json().catch(() => undefined);
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return undefined;
    return JSON.parse(content) as Partial<QueryPlan>;
  } finally {
    clearTimeout(timer);
  }
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

