import { NextResponse } from "next/server";
import { createQueryEmbedding } from "@/lib/rag/embeddings";
import { createChatCompletion } from "@/lib/rag/llm";
import {
  curateDesignFeatureQueryChunks,
  curateRetrievedChunks,
  formatRetrievedContext,
  formatQueryPlan,
  lookupDesignFeatureChunks,
  lookupDirectSupportChunks,
  lookupElementChunks,
  lookupKeywordChunks,
  lookupRelatedDesignFeatureChunks,
  lookupRelatedElementChunks,
  matchRagChunks,
  planRagQuery,
  toRagSources
} from "@/lib/rag/retrieval";
import type { RagChatMessage, RagChunk, RagFilters, RagQueryPlan } from "@/lib/rag/types";
import { jsonError, readableError } from "@/lib/workbench/api";

const SYSTEM_PROMPT = "You are a DSR research assistant for a curated blockchain/DLT design science research workbench.\nAnswer only from retrieved sources.\nUse source IDs like [S1].\nSeparate explicit matches from related or conceptual matches.\nDo not claim a paper has an element unless the source metadata supports it.\nDo not invent relations. Preserve relation direction exactly.\nIf evidence is incomplete, say so.\nPrefer concise, structured answers suitable for researchers.";
const BASE_ANSWER_INSTRUCTIONS = "Write the final answer only. Do not include hidden reasoning, chain-of-thought, or analysis transcript. Use concise bullets. Cite every factual claim with [S#]. If a source is marked explicit, it can support an explicit label claim. If a source is marked related or semantic, treat it as related/conceptual unless the metadata label directly supports the claim. For relations, phrase direction as from_element_id to to_element_id via relation_type.";

export async function POST(request: Request) {
  try {
    const payload = await request.json() as { messages?: unknown; filters?: unknown };
    const messages = parseMessages(payload.messages);
    if (messages.length === 0) return jsonError("At least one user message is required.");

    const latestQuestion = [...messages].reverse().find((message) => message.role === "user")?.content;
    if (!latestQuestion) return jsonError("A user question is required.");

    if (isGreeting(latestQuestion)) {
      return NextResponse.json({
        answer: "Hi. Ask me a question about DSR papers, elements, relations, artifacts, evaluations, or evidence, and I will answer from retrieved corpus context.",
        sources: [],
        retrieved: [],
        retrievalMode: "greeting",
        answerMode: "greeting"
      });
    }

    const filters = parseFilters(payload.filters);
    const queryPlan = planRagQuery(latestQuestion, filters);
    const retrieved = await retrieveChunks(latestQuestion, filters, queryPlan);
    const sources = toRagSources(retrieved);

    if (retrieved.length === 0) {
      return NextResponse.json({
        answer: "The corpus does not contain enough evidence to answer this question.",
        sources: [],
        retrieved: [],
        queryPlan,
        retrievalMode: "no_evidence",
        answerMode: "no_evidence"
      });
    }

    const conversation = messages
      .filter((message) => message.role === "user" || message.role === "assistant")
      .slice(0, -1)
      .slice(-6);
    const answerMode = queryPlan.intents.includes("design_feature_lookup") ? "structured_plus_vector_llm" : "hybrid_rag_llm";
    const finalPrompt = [
      `User question: ${latestQuestion}`,
      "",
      "Query plan:",
      formatQueryPlan(queryPlan),
      "",
      "Retrieved sources:",
      formatRetrievedContext(retrieved, 650),
      "",
      sectionInstructions(queryPlan),
      BASE_ANSWER_INSTRUCTIONS,
      "Keep the answer concise. For this response, use at most 180 words unless the question explicitly asks for detail.",
      "For design-feature lookup queries, put exact label matches under Explicit matches and token/concept-adjacent matches under Related/conceptual matches. Do not call Soulbound reputation tokens or Fungible reward tokens explicit Tokenization matches unless their element_label is Tokenization. If direct_relation sources are present for the explicit element, summarize them in the Explicit matches section with citations. For relation claims, copy the provided Direction statement wording; do not paraphrase instantiated_by as 'X instantiates Y' or 'Y is instantiated by X'."
    ].join("\n");

    const answer = await runStage("llm", () => createChatCompletion([
      { role: "system", content: SYSTEM_PROMPT },
      ...conversation,
      { role: "user", content: finalPrompt }
    ], answerMode === "structured_plus_vector_llm" ? { conciseRetryMaxTokens: 6144 } : undefined));

    return NextResponse.json({
      answer,
      sources,
      retrieved,
      queryPlan,
      retrievalMode: answerMode,
      answerMode
    });
  } catch (error) {
    return jsonError("RAG chat request failed.", 500, readableError(error));
  }
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

async function retrieveChunks(
  question: string,
  filters: RagFilters,
  queryPlan: RagQueryPlan
) {
  const primaryTerm = queryPlan.searchTerms[0] ?? question;
  let explicitMatches: RagChunk[] = [];
  let relatedMatches: RagChunk[] = [];
  let supportMatches: RagChunk[] = [];
  let keywordMatches: RagChunk[] = [];

  if (queryPlan.intents.includes("design_feature_lookup")) {
    explicitMatches = await runStage("structured retrieval", () => lookupDesignFeatureChunks(primaryTerm, filters));
    relatedMatches = await runStage("related retrieval", () => lookupRelatedDesignFeatureChunks(primaryTerm, filters, explicitMatches));
  } else if (queryPlan.requestedElementType && queryPlan.searchTerms.length > 0) {
    const elementFilters = { ...filters, element_type: queryPlan.requestedElementType };
    explicitMatches = await runStage("structured retrieval", () => lookupElementChunks(primaryTerm, elementFilters, queryPlan.explicitLabelsOnly));
    relatedMatches = await runStage("related retrieval", () => lookupRelatedElementChunks(primaryTerm, elementFilters, explicitMatches));
  }

  const explicitElementIds = explicitMatches.map((chunk) => chunk.element_id).filter((value): value is string => Boolean(value));
  if (explicitMatches.length > 0 || queryPlan.intents.includes("relation_traversal")) {
    supportMatches = await runStage("relation traversal", () => lookupDirectSupportChunks(explicitMatches, primaryTerm, filters));
  }
  if (queryPlan.searchTerms.length > 0) {
    keywordMatches = await runStage("keyword retrieval", () => lookupKeywordChunks(queryPlan.searchTerms, filters));
  }

  const queryEmbedding = await runStage("embedding", () => createQueryEmbedding(question));
  const vectorMatches = (await runStage("vector retrieval", () => matchRagChunks(queryEmbedding, filters)))
    .map((chunk) => ({ ...chunk, retrievalKind: "semantic" as const }));

  if (queryPlan.intents.includes("design_feature_lookup")) {
    return curateDesignFeatureQueryChunks({
      explicitMatches,
      directRelations: supportMatches,
      relatedMatches: [...relatedMatches, ...keywordMatches, ...vectorMatches]
    });
  }

  return curateRetrievedChunks(
    [...explicitMatches, ...supportMatches, ...relatedMatches, ...keywordMatches, ...vectorMatches],
    { term: primaryTerm, explicitElementIds }
  );
}

function sectionInstructions(queryPlan: RagQueryPlan) {
  if (queryPlan.intents.includes("cross_paper_comparison")) {
    return "Use sections: Direct answer, Cross-paper comparison, Evidence table or bullets, Notes/limitations.";
  }
  if (queryPlan.intents.includes("element_lookup") || queryPlan.intents.includes("design_feature_lookup") || queryPlan.intents.includes("requirement_lookup")) {
    return "Use sections: Direct answer, Explicit matches, Related/conceptual matches, Notes/limitations.";
  }
  return "Use sections: Direct answer, Evidence, Notes/limitations.";
}

async function runStage<T>(stage: string, action: () => Promise<T>) {
  try {
    return await action();
  } catch (error) {
    throw new Error(`${stage} failed: ${readableError(error)}`);
  }
}

function isGreeting(value: string) {
  return /^(hi|hello|hey|yo|hallo|servus|moin)[!. ]*$/i.test(value.trim());
}
