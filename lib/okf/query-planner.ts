import { detectNamedPapers, extractQueryCriteria, inferRequestedTypes, normalizeText, unique } from "./policy.ts";
import { isOkfConceptType, type OkfChatIntent, type OkfConceptType, type OkfKnowledgeBase } from "./schema.ts";

export type QueryPlanConfidence = "high" | "medium" | "low";
export type QueryPlanOutputShape =
  | "paper_list"
  | "exact_elements"
  | "flow_graph"
  | "design_recommendation"
  | "comparison"
  | "evidence"
  | "counts"
  | "lifecycle"
  | "clarification";

export type QueryPlan = {
  intent: OkfChatIntent;
  confidence: QueryPlanConfidence;
  requested_element_types: string[];
  named_papers: string[];
  themes: string[];
  must_have_criteria: string[];
  optional_criteria: string[];
  requested_output_shape: QueryPlanOutputShape;
  requires_graph: boolean;
  requires_cross_paper: boolean;
  clarification_question?: string;
};

const allowedIntents: OkfChatIntent[] = [
  "LIBRARY_STATS_QUERY",
  "LIBRARY_OVERVIEW_QUERY",
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

export async function planOkfQuery(query: string, deterministicIntent: OkfChatIntent, kb: OkfKnowledgeBase): Promise<QueryPlan> {
  const base = buildDeterministicQueryPlan(query, deterministicIntent, kb);
  if (!shouldUseLlmPlanner(query, base)) return base;
  const llmPlan = await requestGroqQueryPlan(query, base, kb).catch(() => undefined);
  return validateQueryPlan(llmPlan, base, kb);
}

export function buildDeterministicQueryPlan(query: string, intent: OkfChatIntent, kb: OkfKnowledgeBase): QueryPlan {
  const criteria = extractQueryCriteria(query, kb);
  const namedPapers = detectNamedPapers(query, kb).map((paper) => paper.paper_id);
  const requestedTypes = criteria.requestedTypes.length ? criteria.requestedTypes : inferRequestedTypes(query);
  const confidence = deterministicConfidence(query, intent, namedPapers, requestedTypes);
  return {
    intent,
    confidence,
    requested_element_types: unique(requestedTypes).filter((type) => type !== "Paper"),
    named_papers: namedPapers,
    themes: criteria.themes,
    must_have_criteria: criteria.mustHaveTerms,
    optional_criteria: criteria.optionalTerms,
    requested_output_shape: outputShapeForIntent(intent),
    requires_graph: intent === "DSR_FLOW_QUERY" || intent === "DESIGN_REUSE_FLOW_QUERY",
    requires_cross_paper: !namedPapers.length && ["PAPER_DISCOVERY_QUERY", "DESIGN_REUSE_QUERY", "DESIGN_REUSE_FLOW_QUERY", "COMPARISON_QUERY", "EVALUATION_PLANNING_QUERY"].includes(intent),
    clarification_question: intent === "CLARIFICATION_QUERY" ? "Do you want to find papers, extract exact paper elements, build a DSR flow graph, or get design reuse guidance?" : undefined
  };
}

function deterministicConfidence(query: string, intent: OkfChatIntent, namedPapers: string[], requestedTypes: OkfConceptType[]): QueryPlanConfidence {
  const q = normalizeText(query);
  if (!q) return "low";
  if (intent === "CLARIFICATION_QUERY") return "low";
  if (intent === "LIBRARY_STATS_QUERY" || intent === "LIBRARY_OVERVIEW_QUERY") return "high";
  if (intent === "PAPER_ELEMENT_QUERY" && namedPapers.length && requestedTypes.length) return "high";
  if (intent === "PAPER_DISCOVERY_QUERY" && /find papers|which papers|papers that|papers with|papers about/.test(q)) return "high";
  if ((intent === "DSR_FLOW_QUERY" || intent === "DESIGN_REUSE_FLOW_QUERY") && /flow|graph|path|requirement.*principle.*feature/.test(q)) return "high";
  if (intent === "NEGATIVE_OR_EXISTENCE_QUERY" || intent === "IMPLEMENTATION_LIFECYCLE_QUERY") return "high";
  if (intent === "EVIDENCE_QUERY" || intent === "COMPARISON_QUERY" || intent === "EVALUATION_PLANNING_QUERY") return "medium";
  if (intent === "DESIGN_REUSE_QUERY") return "medium";
  return "medium";
}

function outputShapeForIntent(intent: OkfChatIntent): QueryPlanOutputShape {
  if (intent === "LIBRARY_STATS_QUERY") return "counts";
  if (intent === "PAPER_ELEMENT_QUERY") return "exact_elements";
  if (intent === "PAPER_DISCOVERY_QUERY" || intent === "LIBRARY_OVERVIEW_QUERY" || intent === "NEGATIVE_OR_EXISTENCE_QUERY") return "paper_list";
  if (intent === "DSR_FLOW_QUERY" || intent === "DESIGN_REUSE_FLOW_QUERY") return "flow_graph";
  if (intent === "DESIGN_REUSE_QUERY" || intent === "EVALUATION_PLANNING_QUERY") return "design_recommendation";
  if (intent === "EVIDENCE_QUERY") return "evidence";
  if (intent === "COMPARISON_QUERY") return "comparison";
  if (intent === "IMPLEMENTATION_LIFECYCLE_QUERY") return "lifecycle";
  return "clarification";
}

function shouldUseLlmPlanner(query: string, base: QueryPlan) {
  if (base.confidence === "high") return false;
  if (String(process.env.OKF_ENABLE_LLM_QUERY_PLANNER ?? "false").toLowerCase() !== "true") return false;
  if (!process.env.GROQ_API_KEY || !process.env.GROQ_MODEL) return false;
  return query.trim().length > 40 || base.confidence === "low";
}

async function requestGroqQueryPlan(query: string, base: QueryPlan, kb: OkfKnowledgeBase): Promise<Partial<QueryPlan> | undefined> {
  const baseUrl = process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number(process.env.GROQ_QUERY_PLANNER_TIMEOUT_MS ?? 12000));
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
          { role: "system", content: "Return only strict JSON for an OKF QueryPlan. You may enrich themes and criteria for ambiguous questions. Do not invent papers, OKF nodes, evidence, relations, or facts." },
          { role: "user", content: JSON.stringify({ user_query: query, deterministic_base_plan: base, allowed_intents: allowedIntents, known_papers: kb.papers.map((paper) => ({ paper_id: paper.paper_id, title: paper.title })).slice(0, 50), known_element_types: ["Problem", "ResearchQuestion", "DesignRequirement", "DesignPrinciple", "DesignFeature", "Artifact", "Evaluation", "OutputKnowledge", "KernelTheory", "Limitation"] }) }
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

function validateQueryPlan(candidate: Partial<QueryPlan> | undefined, base: QueryPlan, kb: OkfKnowledgeBase): QueryPlan {
  if (!candidate) return base;
  const paperIds = new Set(kb.papers.map((paper) => paper.paper_id));
  const candidateIntent = typeof candidate.intent === "string" && allowedIntents.includes(candidate.intent as OkfChatIntent) ? candidate.intent as OkfChatIntent : base.intent;
  const intent = base.confidence === "high" ? base.intent : candidateIntent;
  const named_papers = unique([...base.named_papers, ...arrayOfStrings(candidate.named_papers).flatMap((value) => matchKnownPaper(value, kb))]).filter((paperId) => paperIds.has(paperId));
  const requested_element_types = unique([...base.requested_element_types, ...arrayOfStrings(candidate.requested_element_types)]).filter((type) => isOkfConceptType(type) && type !== "Paper");
  return {
    intent,
    confidence: validateConfidence(candidate.confidence) ?? base.confidence,
    requested_element_types,
    named_papers,
    themes: unique([...base.themes, ...arrayOfStrings(candidate.themes)]).slice(0, 12),
    must_have_criteria: unique([...base.must_have_criteria, ...arrayOfStrings(candidate.must_have_criteria)]).slice(0, 12),
    optional_criteria: unique([...base.optional_criteria, ...arrayOfStrings(candidate.optional_criteria)]).slice(0, 18),
    requested_output_shape: validateOutputShape(candidate.requested_output_shape) ?? outputShapeForIntent(intent),
    requires_graph: Boolean(candidate.requires_graph ?? base.requires_graph) || intent === "DSR_FLOW_QUERY" || intent === "DESIGN_REUSE_FLOW_QUERY",
    requires_cross_paper: Boolean(candidate.requires_cross_paper ?? base.requires_cross_paper) && !named_papers.length,
    clarification_question: typeof candidate.clarification_question === "string" && candidate.clarification_question.trim() ? candidate.clarification_question.trim() : base.clarification_question
  };
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
  const allowed: QueryPlanOutputShape[] = ["paper_list", "exact_elements", "flow_graph", "design_recommendation", "comparison", "evidence", "counts", "lifecycle", "clarification"];
  return typeof value === "string" && allowed.includes(value as QueryPlanOutputShape) ? value as QueryPlanOutputShape : undefined;
}
