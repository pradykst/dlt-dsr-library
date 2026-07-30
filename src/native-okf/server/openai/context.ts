import "server-only";

import type {
  NativeOkfChatHistoryMessage,
  NativeOkfSourceCard,
} from "../../shared/chat-types.ts";
import type {
  CorpusPaperOverview,
  FinalContextConcept,
  RetrievalResult,
} from "../retrieval-types.ts";

export interface NativeOkfGroundedSource {
  sourceId: string;
  conceptId: string;
  card: NativeOkfSourceCard;
  block: string;
}

export interface NativeOkfGroundedContext {
  sources: NativeOkfGroundedSource[];
  sourceById: ReadonlyMap<string, NativeOkfGroundedSource>;
  allowedConceptIds: ReadonlySet<string>;
  requiredConceptIds?: ReadonlySet<string>;
  prompt: string;
}

export interface NativeOkfModelMessage {
  role: "user" | "assistant";
  content: string;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function metadataString(
  metadata: Record<string, string | string[]>,
  key: string,
): string | undefined {
  const value = metadata[key];
  if (typeof value === "string") return value.trim() || undefined;
  return value?.find((item) => item.trim() !== "")?.trim();
}

function safeResource(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

function displayTitle(concept: FinalContextConcept): string {
  return concept.title?.trim() || concept.conceptId;
}

function sourceCard(
  concept: FinalContextConcept,
  sourceId: string,
): NativeOkfSourceCard {
  const resource = safeResource(
    metadataString(concept.selectedMetadata, "resource"),
  );
  return {
    sourceId,
    conceptId: concept.conceptId,
    title: displayTitle(concept),
    type: concept.type,
    ...(concept.description ? { description: concept.description } : {}),
    ...(concept.sourcePaper ? { sourcePaper: concept.sourcePaper } : {}),
    ...(resource ? { resource } : {}),
  };
}

function sourceBlock(concept: FinalContextConcept, sourceId: string): string {
  const metadata = JSON.stringify(concept.selectedMetadata);
  const content = [
    `TITLE: ${concept.title ?? concept.conceptId}`,
    `TYPE: ${concept.type}`,
    concept.description ? `DESCRIPTION: ${concept.description}` : "",
    concept.sourcePaper ? `SOURCE_PAPER: ${concept.sourcePaper}` : "",
    concept.tags.length > 0 ? `TAGS: ${concept.tags.join(", ")}` : "",
    concept.headings.length > 0 ? `HEADINGS: ${concept.headings.join(" | ")}` : "",
    metadata === "{}" ? "" : `PRODUCER_METADATA: ${metadata}`,
    "MARKDOWN_BODY:",
    concept.markdownBody,
  ]
    .filter(Boolean)
    .join("\n");

  return `<OKF_SOURCE id="${sourceId}" path="${escapeXml(concept.conceptId)}">\n${escapeXml(content)}\n</OKF_SOURCE>`;
}

function overviewLine(paper: CorpusPaperOverview): string {
  const counts = Object.entries(paper.linkedConceptCounts)
    .sort(([left], [right]) => left.localeCompare(right, "en"))
    .map(([type, count]) => `${type}:${count}`)
    .join(", ");
  return [
    paper.conceptId,
    paper.title,
    paper.year,
    paper.venue,
    paper.tags.join(", "),
    counts,
  ]
    .filter(Boolean)
    .join(" | ");
}

export function buildNativeOkfGroundedContext(
  retrieval: RetrievalResult,
  question: string,
  requiredConceptIds: readonly string[] = [],
): NativeOkfGroundedContext {
  const sources = retrieval.finalConcepts.map((concept, index) => {
    const sourceId = `S${index + 1}`;
    return {
      sourceId,
      conceptId: concept.conceptId,
      card: sourceCard(concept, sourceId),
      block: sourceBlock(concept, sourceId),
    } satisfies NativeOkfGroundedSource;
  });

  const overview = retrieval.corpusOverview.papers
    .map(overviewLine)
    .map(escapeXml)
    .join("\n");
  const sourceText = sources.map((source) => source.block).join("\n\n");
  const prompt = `<OKF_CORPUS_OVERVIEW>\n${overview}\n</OKF_CORPUS_OVERVIEW>\n\n${sourceText}\n\n<USER_QUESTION>\n${escapeXml(question)}\n</USER_QUESTION>`;

  return {
    sources,
    sourceById: new Map(sources.map((source) => [source.sourceId, source])),
    allowedConceptIds: new Set(sources.map((source) => source.conceptId)),
    requiredConceptIds: new Set(requiredConceptIds),
    prompt,
  };
}

export function buildNativeOkfModelInput(
  history: readonly NativeOkfChatHistoryMessage[],
  groundedContext: NativeOkfGroundedContext,
): NativeOkfModelMessage[] {
  return [
    ...history.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    { role: "user", content: groundedContext.prompt },
  ];
}
