import { NextResponse } from "next/server";
import { createQueryEmbedding } from "@/lib/rag/embeddings";
import { createChatCompletionResult, getLlmProviderConfig, LlmProviderError } from "@/lib/rag/llm";
import {
  curateRetrievedChunks,
  formatQueryPlan,
  lookupDesignFeatureChunks,
  lookupDirectSupportChunks,
  lookupElementChunks,
  lookupExactLabelChunks,
  lookupKeywordChunks,
  lookupPaperMetadataChunks,
  lookupRelatedDesignFeatureChunks,
  lookupRelationFlowChunks,
  lookupRelatedElementChunks,
  lookupRelationExpansionChunks,
  matchRagChunks,
  planRagQuery,
  toRagSources
} from "@/lib/rag/retrieval";
import {
  attachPlanToSources,
  buildDeterministicSections,
  createEvidencePlan,
  formatEvidencePlanForPrompt
} from "@/lib/rag/evidence-plan";
import { routeQuestion, type RoutedQuestion } from "@/lib/rag/query-router";
import type { RagChatMessage, RagChatResponse, RagChunk, RagFilters, RagQueryPlan } from "@/lib/rag/types";
import { jsonError, readableError } from "@/lib/workbench/api";

const SYSTEM_PROMPT = "You are a DSR research assistant for a curated blockchain/DLT design science research workbench. Answer only from the provided sources. Cite factual claims with source IDs like [S1]. Do not invent papers, relations, labels, paper IDs, or citations. Separate direct evidence from related or weak evidence. If evidence is incomplete, say so clearly. Never mention internal terms such as evidence plan, query plan, prompt, retrieval pipeline, or context block.";
const ANSWER_INSTRUCTIONS = "Write only the visible final answer text. Use concise explanatory paragraphs or bullets. Help a researcher decide which papers match, why they match, whether evidence is formal/strong/partial/weak, and what the database cannot prove. Do not mention internal evidence plans or retrieval mechanics. Keep it under 220 words.";

export async function POST(request: Request) {
  const startedAt = Date.now();
  const providerConfig = safeProviderConfig();

  try {
    const payload = await request.json() as { messages?: unknown; filters?: unknown };
    const messages = parseMessages(payload.messages);
    if (messages.length === 0) return jsonError("At least one user message is required.");

    const latestQuestion = [...messages].reverse().find((message) => message.role === "user")?.content;
    if (!latestQuestion) return jsonError("A user question is required.");

    if (isGreeting(latestQuestion)) {
      const response: RagChatResponse = {
        answerText: "Hi. Ask me a question about DSR papers, elements, relations, artifacts, evaluations, or evidence, and I will answer from retrieved corpus context.",
        sections: [],
        sources: [],
        debug: {
          queryType: "greeting",
          provider: providerConfig.provider,
          model: providerConfig.model,
          retrievalCount: 0,
          latencyMs: Date.now() - startedAt,
          answerStatus: "greeting"
        }
      };
      return NextResponse.json(response);
    }

    const filters = parseFilters(payload.filters);
    const basePlan = planRagQuery(latestQuestion, filters);
    const conversation = messages
      .filter((message) => message.role === "user" || message.role === "assistant")
      .slice(0, -1)
      .slice(-4);
    const routedQuestion = await routeQuestion(latestQuestion, basePlan, conversation);
    const queryPlan = applyRouteToPlan(basePlan, routedQuestion, filters);
    const warnings: string[] = [];
    const retrieved = await retrieveChunks(latestQuestion, filters, queryPlan, warnings, routedQuestion);
    const evidencePlan = createEvidencePlan(retrieved, queryPlan);
    const deterministicSections = buildDeterministicSections(evidencePlan, queryPlan);
    const sources = attachPlanToSources(toRagSources(retrieved), evidencePlan);

    if (retrieved.length === 0) {
      const response: RagChatResponse = {
        answerText: "The database did not return enough evidence to answer this question. This should be treated as a retrieval, ingestion, or data coverage bottleneck rather than proof that no matching paper exists.",
        sections: deterministicSections,
        sources: [],
        retrieved,
        queryPlan,
        debug: {
          queryType: queryPlan.queryType,
          provider: providerConfig.provider,
          model: providerConfig.model,
          retrievalCount: 0,
          latencyMs: Date.now() - startedAt,
          answerStatus: "no_evidence",
          warnings
        }
      };
      logChat({ queryPlan, provider: providerConfig.provider, model: providerConfig.model, latencyMs: response.debug.latencyMs, retrievalCount: 0, answerStatus: "no_evidence", warnings });
      return NextResponse.json(response);
    }

    const finalPrompt = [
      `User question: ${latestQuestion}`,
      "",
      "Query understanding:",
      formatQueryPlan(queryPlan),
      `Route rationale: ${routedQuestion.rationale}`,
      `Comparison aspects: ${routedQuestion.aspects.length ? routedQuestion.aspects.join(", ") : "none"}`,
      "",
      "Retrieved source summaries:",
      formatEvidencePlanForPrompt(evidencePlan),
      "",
      ANSWER_INSTRUCTIONS
    ].join("\n");

    try {
      const llm = await createChatCompletionResult([
        { role: "system", content: SYSTEM_PROMPT },
        ...conversation,
        { role: "user", content: finalPrompt }
      ], { maxTokens: 900, conciseRetryMaxTokens: 1200 });

      const response: RagChatResponse = {
        answerText: llm.content,
        sections: deterministicSections,
        sources,
        retrieved,
        queryPlan,
        debug: {
          queryType: queryPlan.queryType,
          provider: llm.provider,
          model: llm.model,
          retrievalCount: retrieved.length,
          latencyMs: Date.now() - startedAt,
          answerStatus: "ok",
          warnings
        }
      };
      logChat({ queryPlan, provider: llm.provider, model: llm.model, latencyMs: response.debug.latencyMs, retrievalCount: retrieved.length, answerStatus: "ok", warnings });
      return NextResponse.json(response);
    } catch (error) {
      const message = readableError(error);
      const response: RagChatResponse = {
        answerText: deterministicSections[0]?.items[0] ?? "The model failed before composing a final answer, but retrieved evidence is available below.",
        sections: deterministicSections,
        sources,
        retrieved,
        queryPlan,
        error: {
          code: error instanceof LlmProviderError ? error.code : "llm_error",
          message: "The answer model failed. Retrieved evidence is still available for inspection.",
          details: message
        },
        debug: {
          queryType: queryPlan.queryType,
          provider: providerConfig.provider,
          model: providerConfig.model,
          retrievalCount: retrieved.length,
          latencyMs: Date.now() - startedAt,
          answerStatus: "llm_error",
          warnings
        }
      };
      logChat({ queryPlan, provider: providerConfig.provider, model: providerConfig.model, latencyMs: response.debug.latencyMs, retrievalCount: retrieved.length, answerStatus: "llm_error", warnings, error: message });
      return NextResponse.json(response, { status: 502 });
    }
  } catch (error) {
    const message = readableError(error);
    console.error("rag_chat_error", { provider: providerConfig.provider, model: providerConfig.model, latencyMs: Date.now() - startedAt, error: message });
    return jsonError("RAG chat request failed.", 500, message);
  }
}

function applyRouteToPlan(plan: RagQueryPlan, routedQuestion: RoutedQuestion, filters: RagFilters): RagQueryPlan {
  const routedTerms = [...routedQuestion.aspects, ...routedQuestion.concepts]
    .map((term) => term.trim())
    .filter(Boolean);
  return {
    ...plan,
    queryType: routedQuestion.queryType,
    searchTerms: uniqueStrings(routedTerms.length ? routedTerms : plan.searchTerms).slice(0, 8),
    requestedElementType: normalizeElementType(routedQuestion.elementType) ?? plan.requestedElementType ?? filters.element_type,
    paperIdOrTitle: routedQuestion.paperHint ?? plan.paperIdOrTitle
  };
}

async function retrieveComparisonChunks(
  filters: RagFilters,
  queryPlan: RagQueryPlan,
  warnings: string[],
  routedQuestion: RoutedQuestion
) {
  const aspects = routedQuestion.aspects.length >= 2 ? routedQuestion.aspects : queryPlan.searchTerms.slice(0, 2);
  const chunksByAspect = await Promise.all(aspects.map(async (aspect) => {
    const exact = await safeStage(`comparison exact retrieval ${aspect}`, warnings, () => lookupExactLabelChunks([aspect], filters));
    const keyword = await safeStage(`comparison keyword retrieval ${aspect}`, warnings, () => lookupKeywordChunks([aspect], filters));
    const metadata = await safeStage(`comparison metadata retrieval ${aspect}`, warnings, () => lookupPaperMetadataChunks([aspect], filters));
    const seeds = curateRetrievedChunks([...exact, ...keyword, ...metadata], { term: aspect }).slice(0, 4);
    const expanded = seeds.length
      ? await safeStage(`comparison relation expansion ${aspect}`, warnings, () => lookupRelationExpansionChunks(seeds, filters))
      : [];
    return curateRetrievedChunks([...seeds, ...expanded], { term: aspect })
      .slice(0, 5)
      .map((chunk) => ({
        ...chunk,
        retrievalScore: (chunk.retrievalScore ?? 0) + 45,
        matchReason: `Comparison bucket "${aspect}": ${chunk.matchReason ?? "matched retrieved source"}`
      }));
  }));

  return diversifyByPaper(chunksByAspect.flat(), 12);
}

function diversifyByPaper(chunks: RagChunk[], limit: number) {
  const sorted = [...chunks].sort((a, b) => (b.retrievalScore ?? 0) - (a.retrievalScore ?? 0));
  const result: RagChunk[] = [];
  const perPaper = new Map<string, number>();
  const seen = new Set<string>();

  for (const chunk of sorted) {
    if (seen.has(chunk.id)) continue;
    const paperKey = chunk.paper_id ?? chunk.paper_title ?? chunk.id;
    const count = perPaper.get(paperKey) ?? 0;
    if (count >= 3) continue;
    seen.add(chunk.id);
    perPaper.set(paperKey, count + 1);
    result.push(chunk);
    if (result.length >= limit) break;
  }

  if (result.length < limit) {
    for (const chunk of sorted) {
      if (seen.has(chunk.id)) continue;
      seen.add(chunk.id);
      result.push(chunk);
      if (result.length >= limit) break;
    }
  }

  return result;
}

function normalizeElementType(value: string | undefined) {
  if (!value) return undefined;
  const lower = value.toLowerCase();
  if (lower.includes("feature")) return "Design Feature";
  if (lower.includes("principle")) return "Design Principle";
  if (lower.includes("requirement")) return "Design Requirement";
  if (lower.includes("artifact")) return "Artifact";
  if (lower.includes("evaluation")) return "Evaluation";
  if (lower.includes("problem")) return "Problem";
  if (lower.includes("kernel")) return "Kernel Theory";
  if (lower.includes("output")) return "Output Knowledge";
  return value;
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
function parseMessages(value: unknown): RagChatMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map<RagChatMessage>((item) => ({
      role: item.role === "assistant" ? "assistant" : "user",
      content: typeof item.content === "string" ? item.content.trim() : ""
    }))
    .filter((message) => message.content.length > 0);
}

function parseFilters(value: unknown): RagFilters {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  return {
    paper_id: optionalString(record.paper_id),
    element_type: optionalString(record.element_type),
    chunk_type: optionalString(record.chunk_type)
  };
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

async function resolvePaperScopedFilters(filters: RagFilters, queryPlan: RagQueryPlan, warnings: string[]) {
  if (filters.paper_id || !queryPlan.paperIdOrTitle) return filters;
  if (!["paper_summary", "relation_flow", "relation_path_explanation", "evidence_check", "gap_analysis"].includes(queryPlan.queryType)) return filters;

  const candidates = await safeStage("paper hint resolution", warnings, () => lookupPaperMetadataChunks([queryPlan.paperIdOrTitle as string], filters));
  const top = candidates[0];
  if (!top?.paper_id) return filters;
  warnings.push(`Scoped retrieval to paper hint match: ${top.paper_title ?? top.paper_id}`);
  return { ...filters, paper_id: top.paper_id };
}
async function retrieveChunks(
  question: string,
  filters: RagFilters,
  queryPlan: RagQueryPlan,
  warnings: string[],
  routedQuestion: RoutedQuestion
) {
  if (queryPlan.queryType === "corpus_count") {
    return await safeStage("paper metadata retrieval", warnings, () => lookupPaperMetadataChunks(queryPlan.searchTerms, filters));
  }

  const scopedFilters = await resolvePaperScopedFilters(filters, queryPlan, warnings);

  if (queryPlan.queryType === "comparison") {
    return await retrieveComparisonChunks(scopedFilters, queryPlan, warnings, routedQuestion);
  }

  if (queryPlan.queryType === "relation_flow" || queryPlan.queryType === "relation_path_explanation") {
    return diversifyByPaper(await safeStage("relation-flow retrieval", warnings, () => lookupRelationFlowChunks(queryPlan.searchTerms, scopedFilters)), 12);
  }

  const primaryTerm = queryPlan.searchTerms[0] ?? question;
  let explicitMatches: RagChunk[] = [];
  let relatedMatches: RagChunk[] = [];
  let supportMatches: RagChunk[] = [];
  let keywordMatches: RagChunk[] = [];
  let exactLabelMatches: RagChunk[] = [];
  let relationExpansionMatches: RagChunk[] = [];
  let vectorMatches: RagChunk[] = [];

  exactLabelMatches = await safeStage("exact label retrieval", warnings, () => lookupExactLabelChunks(queryPlan.searchTerms, scopedFilters));

  if (queryPlan.intents.includes("design_feature_lookup")) {
    explicitMatches = await safeStage("structured design-feature retrieval", warnings, () => lookupDesignFeatureChunks(primaryTerm, scopedFilters));
    relatedMatches = await safeStage("related design-feature retrieval", warnings, () => lookupRelatedDesignFeatureChunks(primaryTerm, scopedFilters, explicitMatches));
  } else if (queryPlan.requestedElementType && queryPlan.searchTerms.length > 0) {
    const elementFilters = { ...scopedFilters, element_type: queryPlan.requestedElementType };
    explicitMatches = await safeStage("structured element retrieval", warnings, () => lookupElementChunks(primaryTerm, elementFilters, queryPlan.explicitLabelsOnly));
    relatedMatches = await safeStage("related element retrieval", warnings, () => lookupRelatedElementChunks(primaryTerm, elementFilters, explicitMatches));
  }

  const structuredSeeds = curateRetrievedChunks([...exactLabelMatches, ...explicitMatches, ...relatedMatches], { term: primaryTerm });
  if (structuredSeeds.length > 0) {
    supportMatches = await safeStage("direct support retrieval", warnings, () => lookupDirectSupportChunks(structuredSeeds, primaryTerm, scopedFilters));
    relationExpansionMatches = await safeStage("relation-aware expansion", warnings, () => lookupRelationExpansionChunks(structuredSeeds, scopedFilters));
  }

  if (queryPlan.searchTerms.length > 0) {
    keywordMatches = await safeStage("keyword retrieval", warnings, () => lookupKeywordChunks(queryPlan.searchTerms, scopedFilters));
  }

  const queryEmbedding = await safeStage("embedding", warnings, () => createQueryEmbedding(question), null);
  if (queryEmbedding) {
    vectorMatches = (await safeStage("vector retrieval", warnings, () => matchRagChunks(queryEmbedding, scopedFilters)))
      .map((chunk) => ({ ...chunk, retrievalKind: "semantic" as const, matchReason: "Vector similarity over indexed RAG chunks" }));
  }

  const explicitElementIds = [...exactLabelMatches, ...explicitMatches]
    .map((chunk) => chunk.element_id)
    .filter((value): value is string => Boolean(value));

  return curateRetrievedChunks(
    [...exactLabelMatches, ...explicitMatches, ...supportMatches, ...relationExpansionMatches, ...relatedMatches, ...keywordMatches, ...vectorMatches],
    { term: primaryTerm, explicitElementIds }
  );
}

async function safeStage<T>(stage: string, warnings: string[], action: () => Promise<T>, fallback?: T) {
  try {
    return await action();
  } catch (error) {
    warnings.push(`${stage} failed: ${readableError(error)}`);
    return arguments.length >= 4 ? fallback as T : ([] as T);
  }
}

function safeProviderConfig() {
  try {
    return getLlmProviderConfig();
  } catch {
    return {
      provider: process.env.CHAT_PROVIDER ?? "local",
      model: process.env.FEATHERLESS_MODEL ?? process.env.LLM_MODEL ?? "unconfigured"
    };
  }
}

function logChat({
  queryPlan,
  provider,
  model,
  latencyMs,
  retrievalCount,
  answerStatus,
  warnings,
  error
}: {
  queryPlan: RagQueryPlan;
  provider: string;
  model: string;
  latencyMs: number;
  retrievalCount: number;
  answerStatus: string;
  warnings?: string[];
  error?: string;
}) {
  console.info("rag_chat", {
    queryType: queryPlan.queryType,
    provider,
    model,
    latencyMs,
    retrievalCount,
    answerStatus,
    warningCount: warnings?.length ?? 0,
    error: error ? error.slice(0, 240) : undefined
  });
}

function isGreeting(value: string) {
  return /^(hi|hello|hey|yo|hallo|servus|moin)[!. ]*$/i.test(value.trim());
}
