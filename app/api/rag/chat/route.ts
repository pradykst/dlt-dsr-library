import { NextResponse } from "next/server";
import { createQueryEmbedding } from "@/lib/rag/embeddings";
import { createChatCompletion } from "@/lib/rag/llm";
import {
  classifyDesignFeatureQuery,
  curateRetrievedChunks,
  formatRetrievedContext,
  lookupDesignFeatureChunks,
  lookupDirectSupportChunks,
  matchRagChunks,
  toRagSources
} from "@/lib/rag/retrieval";
import type { RagChatMessage, RagChunk, RagFilters } from "@/lib/rag/types";
import { jsonError, readableError } from "@/lib/workbench/api";

const SYSTEM_PROMPT = "You are a DSR knowledge assistant for a curated blockchain/DLT design science research library.\nAnswer only from retrieved context.\nWhen evidence is insufficient, say that the corpus does not contain enough evidence.\nAlways cite paper title and element/evidence identifiers when making claims.\nDistinguish Problem, Requirement, Design Principle, Design Feature, Artifact, Evaluation, and Output Knowledge.\nDo not invent links between elements unless a relation exists in the retrieved workbench data.";
const ANSWER_INSTRUCTIONS = "Write the final answer directly. Do not include a thinking process, hidden reasoning, or analysis transcript. Use these sections exactly: Direct answer, Explicit matches, Related matches, Notes/limitations, Sources. Cite sources as [S1], [S2], etc. Preserve relation direction: if context says DP1 instantiated_by DF1, phrase it as \"The workbench maps DP1 to DF1 via instantiated_by,\" not as \"DF1 is instantiated by DP1.\"";

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
        retrieved: []
      });
    }

    const filters = parseFilters(payload.filters);
    const retrievalPlan = classifyDesignFeatureQuery(latestQuestion);
    const retrieved = await retrieveChunks(latestQuestion, filters, retrievalPlan);
    const sources = toRagSources(retrieved);

    if (retrieved.length === 0) {
      return NextResponse.json({
        answer: "The corpus does not contain enough evidence to answer this question.",
        sources: [],
        retrieved: []
      });
    }

    const conversation = messages
      .filter((message) => message.role === "user" || message.role === "assistant")
      .slice(-8);

    const answer = await runStage("llm", () => createChatCompletion([
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `${formatRetrievalPlan(retrievalPlan)}Retrieved context:\n\n${formatRetrievedContext(retrieved)}\n\n${ANSWER_INSTRUCTIONS}\nUse only the retrieved context above. Treat chunks marked explicit as explicit matches. Treat vector-only or related chunks as related but not explicitly labeled matches unless their element_type and element_label explicitly support the claim. If a relation is not explicitly present in the retrieved relation fields or content, say it is not present in the current corpus.`
      },
      ...conversation
    ]));

    return NextResponse.json({ answer, sources, retrieved });
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
  retrievalPlan: ReturnType<typeof classifyDesignFeatureQuery>
) {
  if (!retrievalPlan) {
    const queryEmbedding = await runStage("embedding", () => createQueryEmbedding(question));
    const vectorMatches = await runStage("retrieval", () => matchRagChunks(queryEmbedding, filters));
    return curateRetrievedChunks(vectorMatches.map((chunk) => ({ ...chunk, retrievalKind: "related" as const })));
  }

  const explicitMatches = await runStage("structured retrieval", () => lookupDesignFeatureChunks(retrievalPlan.term, filters));
  const supportMatches = await runStage("support retrieval", () => lookupDirectSupportChunks(explicitMatches, retrievalPlan.term, filters));
  const explicitElementIds = explicitMatches.map((chunk) => chunk.element_id).filter((value): value is string => Boolean(value));
  let vectorMatches: RagChunk[] = [];

  try {
    const queryEmbedding = await runStage("embedding", () => createQueryEmbedding(question));
    vectorMatches = (await runStage("vector retrieval", () => matchRagChunks(queryEmbedding, filters)))
      .map((chunk) => ({ ...chunk, retrievalKind: "related" as const }));
  } catch (error) {
    if (explicitMatches.length === 0) throw error;
  }

  return curateRetrievedChunks(
    [...explicitMatches, ...supportMatches, ...vectorMatches],
    { term: retrievalPlan.term, explicitElementIds }
  );
}

function formatRetrievalPlan(retrievalPlan: ReturnType<typeof classifyDesignFeatureQuery>) {
  if (!retrievalPlan) return "";
  return [
    `Query classification: asks which papers use "${retrievalPlan.term}" as a Design Feature.`,
    "First use explicit Design Feature chunks matching that term. Use direct relation/evidence chunks only as support. Separate conceptually related vector matches from explicit labels.",
    ""
  ].join("\n");
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
