import "server-only";

import type {
  NativeOkfChatHistoryMessage,
  NativeOkfSourceCard,
} from "../../shared/chat-types.ts";
import type {
  CorpusPaperOverview,
  FinalContextConcept,
  NativeOkfStructuredAnalysis,
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

function escapeXmlText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeXmlAttribute(value: string): string {
  return escapeXmlText(value)
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

function sourceBlock(
  concept: FinalContextConcept,
  sourceId: string,
  includeDetails: boolean,
): string {
  const metadata = JSON.stringify(concept.selectedMetadata);
  const content = [
    `TITLE: ${concept.title ?? concept.conceptId}`,
    `TYPE: ${concept.type}`,
    includeDetails && concept.description
      ? `DESCRIPTION: ${concept.description}`
      : "",
    includeDetails && concept.sourcePaper
      ? `SOURCE_PAPER: ${concept.sourcePaper}`
      : "",
    includeDetails && concept.tags.length > 0
      ? `TAGS: ${concept.tags.join(", ")}`
      : "",
    includeDetails && concept.headings.length > 0
      ? `HEADINGS: ${concept.headings.join(" | ")}`
      : "",
    includeDetails && metadata !== "{}"
      ? `PRODUCER_METADATA: ${metadata}`
      : "",
    concept.markdownBody ? "MARKDOWN_BODY:" : "",
    concept.markdownBody,
  ]
    .filter(Boolean)
    .join("\n");

  return `<OKF_SOURCE id="${sourceId}" path="${escapeXmlAttribute(concept.conceptId)}">\n${escapeXmlText(content)}\n</OKF_SOURCE>`;
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
  const maximumCharacters = retrieval.debug.limits.maxContextCharacters;
  const requiredIds = new Set(requiredConceptIds);
  const structuredIds = structuredEvidenceIds(retrieval.structuredAnalysis);
  const protectedIds = new Set([...requiredIds, ...structuredIds]);
  let selectedConcepts = [...retrieval.finalConcepts];
  let includeOverview = true;
  let includeDetails = true;
  let markdownLimit = selectedConcepts.reduce(
    (maximum, concept) => Math.max(maximum, concept.markdownBody.length),
    0,
  );

  const render = (): {
    sources: NativeOkfGroundedSource[];
    prompt: string;
  } => renderGroundedPrompt(
    retrieval,
    question,
    selectedConcepts,
    markdownLimit,
    includeDetails,
    includeOverview,
  );

  let rendered = render();
  if (rendered.prompt.length > maximumCharacters && markdownLimit > 0) {
    let low = 0;
    let high = markdownLimit;
    let best = 0;
    while (low <= high) {
      const middle = Math.floor((low + high) / 2);
      markdownLimit = middle;
      const candidate = render();
      if (candidate.prompt.length <= maximumCharacters) {
        best = middle;
        low = middle + 1;
      } else {
        high = middle - 1;
      }
    }
    markdownLimit = best;
    rendered = render();
  }

  if (rendered.prompt.length > maximumCharacters) {
    includeOverview = false;
    rendered = render();
  }
  if (rendered.prompt.length > maximumCharacters) {
    includeDetails = false;
    rendered = render();
  }
  while (rendered.prompt.length > maximumCharacters) {
    const removableIndex = selectedConcepts.findLastIndex(
      (concept) => !protectedIds.has(concept.conceptId),
    );
    if (removableIndex < 0) break;
    selectedConcepts.splice(removableIndex, 1);
    rendered = render();
  }
  if (rendered.prompt.length > maximumCharacters) {
    throw new Error(
      `Native OKF grounded context cannot fit its required canonical evidence within ${maximumCharacters} characters.`,
    );
  }

  const sources = rendered.sources;
  return {
    sources,
    sourceById: new Map(sources.map((source) => [source.sourceId, source])),
    allowedConceptIds: new Set(sources.map((source) => source.conceptId)),
    requiredConceptIds: requiredIds,
    prompt: rendered.prompt,
  };
}

function truncatedMarkdown(value: string, maximum: number): string {
  if (value.length <= maximum) return value;
  if (maximum <= 0) return "";
  return `${value.slice(0, Math.max(0, maximum - 1)).trimEnd()}\u2026`;
}

function structuredEvidenceIds(
  analysis: NativeOkfStructuredAnalysis | undefined,
): Set<string> {
  const ids = new Set<string>();
  for (const paper of analysis?.papers ?? []) {
    ids.add(paper.paperConceptId);
    for (const concept of paper.relevantConcepts) ids.add(concept.conceptId);
    for (const relationship of paper.relevantRelationships) {
      ids.add(relationship.sourceId);
      ids.add(relationship.targetId);
    }
  }
  return ids;
}

function compactStructuredAnalysis(
  analysis: NativeOkfStructuredAnalysis,
  sourceIdByConceptId: ReadonlyMap<string, string>,
): string {
  return JSON.stringify({
    scope: analysis.scope,
    checkedPaperCount: analysis.checkedPaperCount,
    exhaustiveForScope: analysis.exhaustiveForScope,
    requestedKinds: analysis.requestedKinds,
    exactTerm: analysis.exactTerm,
    relationshipCheckComplete: analysis.relationshipCheckComplete,
    absenceCheckComplete: analysis.absenceCheckComplete,
    paperSchema: [
      "paperConceptId",
      "title",
      "representedTypeCounts",
      "relevantConceptCount",
      "relevantConcepts",
      "relevantRelationshipCount",
      "relevantRelationships",
      "relationshipStatus",
      "explicitTermMatchCount",
      "citationSourceIds",
    ],
    conceptSchema: ["conceptId", "title", "producerType", "explicitTermMatch"],
    relationshipSchema: [
      "sourceId",
      "sourceProducerType",
      "targetId",
      "targetProducerType",
      "canonicalLabel",
    ],
    papers: analysis.papers.map((paper) => [
      paper.paperConceptId,
      paper.title,
      paper.representedTypeCounts,
      paper.relevantConceptCount,
      paper.relevantConcepts.map((concept) => [
        concept.conceptId,
        concept.title,
        concept.type,
        concept.explicitTermMatch,
      ]),
      paper.relevantRelationshipCount,
      paper.relevantRelationships.map((relationship) => [
        relationship.sourceId,
        relationship.sourceType,
        relationship.targetId,
        relationship.targetType,
        relationship.label,
      ]),
      paper.relationshipStatus,
      paper.explicitTermMatchCount,
      [
        sourceIdByConceptId.get(paper.paperConceptId),
        ...paper.relevantConcepts.map((concept) =>
          sourceIdByConceptId.get(concept.conceptId)
        ),
      ].filter((sourceId): sourceId is string => Boolean(sourceId)),
    ]),
  });
}

function renderGroundedPrompt(
  retrieval: RetrievalResult,
  question: string,
  concepts: readonly FinalContextConcept[],
  markdownLimit: number,
  includeDetails: boolean,
  includeOverview: boolean,
): { sources: NativeOkfGroundedSource[]; prompt: string } {
  const sources = concepts.map((concept, index) => {
    const sourceId = `S${index + 1}`;
    const promptConcept = {
      ...concept,
      markdownBody: truncatedMarkdown(concept.markdownBody, markdownLimit),
    };
    return {
      sourceId,
      conceptId: concept.conceptId,
      card: sourceCard(concept, sourceId),
      block: sourceBlock(promptConcept, sourceId, includeDetails),
    } satisfies NativeOkfGroundedSource;
  });

  const overview = includeOverview
    ? retrieval.corpusOverview.papers
    .map(overviewLine)
      .map(escapeXmlText)
      .join("\n")
    : "";
  const sourceText = sources.map((source) => source.block).join("\n\n");
  const sourceIdByConceptId = new Map(
    sources.map((source) => [source.conceptId, source.sourceId]),
  );
  const structured = retrieval.structuredAnalysis
    ? compactStructuredAnalysis(retrieval.structuredAnalysis, sourceIdByConceptId)
    : null;
  const structuredBlock = structured
    ? `<OKF_STRUCTURED_ANALYSIS>\n${escapeXmlText(structured)}\n</OKF_STRUCTURED_ANALYSIS>\n\n`
    : "";
  const overviewBlock = includeOverview
    ? `<OKF_CORPUS_OVERVIEW>\n${overview}\n</OKF_CORPUS_OVERVIEW>\n\n`
    : "";
  const prompt = `${overviewBlock}${structuredBlock}${sourceText}\n\n<USER_QUESTION>\n${escapeXmlText(question)}\n</USER_QUESTION>`;
  return {
    sources,
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
