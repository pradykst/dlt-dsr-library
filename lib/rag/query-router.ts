import type { RagChatMessage, RagQueryPlan, RagQueryType } from "@/lib/rag/types";
import { createChatCompletionResult } from "@/lib/rag/llm";

export type RoutedQuestion = {
  queryType: RagQueryType;
  concepts: string[];
  aspects: string[];
  paperHint?: string;
  elementType?: string;
  rationale: string;
  usedLlm: boolean;
};

const QUERY_TYPES: Array<{ type: RagQueryType; description: string }> = [
  { type: "corpus_count", description: "Count papers or rows matching corpus-level criteria." },
  { type: "paper_lookup", description: "Find papers by title, topic, author, domain, or metadata." },
  { type: "concept_usage", description: "Find which papers use a concept, mechanism, technology, or design feature." },
  { type: "element_type_lookup", description: "Find concepts explicitly used as a specific DSR element type such as design feature, principle, requirement, artifact, evaluation, or output claim." },
  { type: "comparison", description: "Compare two or more concepts, groups, mechanisms, papers, or design approaches." },
  { type: "relation_flow", description: "Explain paths or flows between DSR elements, such as principle to feature to artifact." },
  { type: "paper_summary", description: "Summarize one paper or a paper subset." },
  { type: "evidence_check", description: "Check whether a claim/concept is present and what evidence supports it." },
  { type: "gap_analysis", description: "Identify weak, missing, indirect, or insufficient evidence/data coverage." },
  { type: "decision_support", description: "Synthesize retrieved papers to support a research or design decision." }
];

export async function routeQuestion(question: string, fallbackPlan: RagQueryPlan, conversation: RagChatMessage[] = []): Promise<RoutedQuestion> {
  const heuristic = routeQuestionHeuristically(question, fallbackPlan);
  try {
    const prompt = [
      "Classify this DSR workbench question for retrieval routing.",
      "Return JSON only with keys: queryType, concepts, aspects, paperHint, elementType, rationale.",
      "Valid queryType values:",
      QUERY_TYPES.map((item) => `- ${item.type}: ${item.description}`).join("\n"),
      "Rules:",
      "- concepts are searchable concepts/technologies/mechanisms, not filler words.",
      "- aspects are comparison sides when present, e.g. one side and another side.",
      "- paperHint is a title/alias phrase if the user points to a specific paper.",
      "- elementType is a DSR element type if explicitly requested.",
      "- Do not answer the question.",
      "",
      conversation.length ? `Recent context: ${conversation.slice(-2).map((m) => `${m.role}: ${m.content}`).join(" | ")}` : "Recent context: none",
      `Question: ${question}`
    ].join("\n");

    const result = await createChatCompletionResult([
      { role: "system", content: "You classify research questions for retrieval. Output strict JSON only." },
      { role: "user", content: prompt }
    ], { maxTokens: 260, conciseRetryMaxTokens: 260 });
    const parsed = parseRouterJson(result.content);
    if (!parsed) return heuristic;
    return normalizeRoute(parsed, heuristic, true);
  } catch {
    return heuristic;
  }
}

export function routeQuestionHeuristically(question: string, plan: RagQueryPlan): RoutedQuestion {
  const lowerQuestion = question.toLowerCase();
  const concepts = extractConcepts(question);
  const aspects = extractComparisonAspects(question);
  const elementType = extractElementType(question);
  const paperHint = extractPaperHint(question);
  let queryType = plan.queryType;

  if (/\bhow many\b|\bnumber of\b|\bcount\b/i.test(lowerQuestion) && /\bpaper|papers\b/i.test(lowerQuestion)) queryType = "corpus_count";
  else if (/\bcompare|versus|\bvs\b|difference|similarit/i.test(lowerQuestion)) queryType = "comparison";
  else if (/\bflow|path|map|maps|mapped|link|links|linked|relation|from .* to |between .* and /i.test(lowerQuestion)) queryType = "relation_flow";
  else if (/\bweak|indirect|missing|gap|insufficient|not enough|limitations?\b/i.test(lowerQuestion)) queryType = "gap_analysis";
  else if (/\bshould|recommend|best|decision|choose|trade[- ]?off|implication|literature review section\b/i.test(lowerQuestion)) queryType = "decision_support";
  else if (/\bis .* present\b|\balready present\b|\bevidence|quote|support|prove\b/i.test(lowerQuestion)) queryType = "evidence_check";
  else if (/\bsummary|summarize|overview|tell me about\b/i.test(lowerQuestion)) queryType = "paper_summary";
  else if (elementType) queryType = "element_type_lookup";
  else if (/\bwhich papers\b|\bwhat papers\b|\bpapers use\b|\buse\b|\buses\b/i.test(lowerQuestion)) queryType = "concept_usage";

  return {
    queryType,
    concepts,
    aspects,
    paperHint,
    elementType,
    rationale: "Heuristic routing fallback.",
    usedLlm: false
  };
}

function parseRouterJson(value: string) {
  const match = value.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]) as Partial<RoutedQuestion>;
  } catch {
    return null;
  }
}

function normalizeRoute(value: Partial<RoutedQuestion>, fallback: RoutedQuestion, usedLlm: boolean): RoutedQuestion {
  const validTypes = new Set(QUERY_TYPES.map((item) => item.type));
  const queryType = validTypes.has(value.queryType as RagQueryType) ? value.queryType as RagQueryType : fallback.queryType;
  return {
    queryType,
    concepts: cleanList(value.concepts).length ? cleanList(value.concepts) : fallback.concepts,
    aspects: cleanList(value.aspects).length ? cleanList(value.aspects) : fallback.aspects,
    paperHint: typeof value.paperHint === "string" && value.paperHint.trim() ? value.paperHint.trim() : fallback.paperHint,
    elementType: typeof value.elementType === "string" && value.elementType.trim() ? value.elementType.trim() : fallback.elementType,
    rationale: typeof value.rationale === "string" && value.rationale.trim() ? value.rationale.trim() : fallback.rationale,
    usedLlm
  };
}

function extractComparisonAspects(question: string) {
  const cleaned = question.replace(/[?!.]+$/g, "");
  const match = cleaned.match(/(?:compare|comparison of)?\s*(.+?)\s+(?:versus|vs\.?|against|compared with)\s+(.+)/i);
  if (!match) return [];
  return [cleanupAspect(match[1]), cleanupAspect(match[2])].filter(Boolean).slice(0, 4);
}

function cleanupAspect(value: string) {
  return value
    .replace(/^papers?\s+(?:that\s+)?(?:use|uses|using)\s+/i, "")
    .replace(/^blockchain\s+for\s+/i, "")
    .replace(/^for\s+/i, "")
    .replace(/\b(papers?|blockchain|dlt|that|use|uses|using|for|the|a|an)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractElementType(question: string) {
  const types = [
    "Design Feature",
    "Design Principle",
    "Design Requirement",
    "Requirement",
    "Artifact",
    "Evaluation",
    "Output Knowledge",
    "Output Claim",
    "Problem",
    "Kernel Theory"
  ];
  const lowerQuestion = question.toLowerCase();
  return types.find((type) => lowerQuestion.includes(type.toLowerCase()));
}

function extractPaperHint(question: string) {
  const quoted = [...question.matchAll(/["']([^"']{4,120})["']/g)].map((match) => match[1].trim())[0];
  if (quoted) return quoted;
  const match = question.match(/\b(?:in|from|for|summarize|explain|describe|analyze)\s+the\s+(.+?\s+paper)\b/i);
  return match?.[1]?.trim();
}

function extractConcepts(question: string) {
  const quoted = [...question.matchAll(/["']([^"']{2,100})["']/g)].map((match) => match[1].trim());
  const phraseMatches = [...question.matchAll(/\b(?:use|uses|using|include|includes|about|for|with|of)\s+([A-Za-z0-9][A-Za-z0-9\s/-]{2,80}?)(?:\?|\.|,| as | in | across | versus | vs\.?| compared |$)/gi)]
    .map((match) => cleanupConcept(match[1]));
  const tokens = question
    .replace(/[^\p{L}\p{N}\s/-]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => isSearchableToken(word));
  return unique([...quoted, ...phraseMatches, ...tokens]).slice(0, 8);
}

function cleanupConcept(value: string) {
  return value
    .replace(/\b(as|a|an|the|design|feature|principle|requirement|paper|papers|something)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isSearchableToken(value: string) {
  const lower = value.toLowerCase();
  const stopwords = new Set(["which", "what", "where", "when", "why", "how", "many", "number", "count", "paper", "papers", "compare", "versus", "with", "that", "this", "these", "those", "use", "uses", "using", "used", "for", "from", "into", "between", "based", "design", "feature", "principle", "flow", "explain", "present", "already", "database"]);
  return (value.length > 3 || /^[A-Z0-9]{2,}$/.test(value)) && !stopwords.has(lower);
}

function cleanList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, 8);
}

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
