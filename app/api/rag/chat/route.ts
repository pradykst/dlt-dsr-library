import { NextResponse } from "next/server";
import { createQueryEmbedding } from "@/lib/rag/embeddings";
import { createChatCompletion } from "@/lib/rag/llm";
import { formatRetrievedContext, matchRagChunks, toRagSources } from "@/lib/rag/retrieval";
import type { RagChatMessage, RagFilters } from "@/lib/rag/types";
import { jsonError, readableError } from "@/lib/workbench/api";

const SYSTEM_PROMPT = "You are a DSR knowledge assistant for a curated blockchain/DLT design science research library.\nAnswer only from retrieved context.\nWhen evidence is insufficient, say that the corpus does not contain enough evidence.\nAlways cite paper title and element/evidence identifiers when making claims.\nDistinguish Problem, Requirement, Design Principle, Design Feature, Artifact, Evaluation, and Output Knowledge.\nDo not invent links between elements unless a relation exists in the retrieved workbench data.";
const ANSWER_INSTRUCTIONS = "Write the final answer directly. Do not include a thinking process, hidden reasoning, or analysis transcript. Use concise bullets when multiple papers or elements are involved. Cite sources as [S1], [S2], etc.";

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
    const queryEmbedding = await runStage("embedding", () => createQueryEmbedding(latestQuestion));
    const retrieved = await runStage("retrieval", () => matchRagChunks(queryEmbedding, filters));
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
        content: `Retrieved context:\n\n${formatRetrievedContext(retrieved)}\n\n${ANSWER_INSTRUCTIONS}\nUse only the retrieved context above. If a relation is not explicitly present in the retrieved relation fields or content, say it is not present in the current corpus.`
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
