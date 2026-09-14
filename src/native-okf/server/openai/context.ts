import "server-only";

import type {
  NativeOkfChatHistoryMessage,
  NativeOkfSourceCard,
  SynthesisDraftState,
} from "../../shared/chat-types.ts";
import type {
  CorpusPaperOverview,
  FinalContextConcept,
  NativeOkfStructuredAnalysis,
  RetrievalResult,
} from "../retrieval-types.ts";
import { InternalNativeOkfError, RequestTooLargeError } from "./errors.ts";
import { compactCompletePaperMarkdown } from "../complete-paper-packing.ts";

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
  packing?: {
    overviewDropped: boolean;
    optionalConceptsDropped: number;
    markdownTruncated: boolean;
    sourceDetailsDropped: boolean;
  };
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
  completePaper = false,
  representedDescriptions: ReadonlySet<string> = new Set(),
  sourceIdByConceptId: ReadonlyMap<string, string> = new Map(),
): string {
  if (completePaper) {
    const body = compactCompletePaperMarkdown(concept.markdownBody, concept.selectedMetadata, representedDescriptions, sourceIdByConceptId);
    const content = [
      `TITLE: ${concept.title ?? concept.conceptId}`,
      `TYPE: ${concept.type}`,
      concept.description && !body.includes(concept.description) ? `DESCRIPTION: ${concept.description}` : "",
      concept.type === "paper" ? `PUBLICATION: ${JSON.stringify(concept.selectedMetadata)}` : "",
      body,
    ].filter(Boolean).join("\n");
    return `<OKF_SOURCE id="${sourceId}" path="${escapeXmlAttribute(concept.conceptId)}">\n${escapeXmlText(content)}\n</OKF_SOURCE>`;
  }
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
  activeProposalDraft: SynthesisDraftState | null = null,
): NativeOkfGroundedContext {
  const maximumCharacters = retrieval.debug.limits.maxContextCharacters;
  const requiredIds = new Set(requiredConceptIds);
  const structuredIds = structuredEvidenceIds(retrieval.structuredAnalysis);
  const protectedIds = new Set([...requiredIds, ...structuredIds]);
  let selectedConcepts = [...retrieval.finalConcepts];
  let includeOverview = true;
  let includeDetails = true;
  let optionalConceptsDropped = 0;
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
    activeProposalDraft,
  );

  let rendered = render();
  if (retrieval.completePaperContext) {
    if (rendered.prompt.length > maximumCharacters) {
      throw new RequestTooLargeError(
        "These selected papers contain more complete design knowledge than fits one response context. Remove a paper or narrow the concept kinds and try again. No selected knowledge was truncated.",
      );
    }
    return {
      sources: rendered.sources,
      sourceById: new Map(rendered.sources.map((source) => [source.sourceId, source])),
      allowedConceptIds: new Set(rendered.sources.map((source) => source.conceptId)),
      requiredConceptIds: requiredIds,
      prompt: rendered.prompt,
      packing: { overviewDropped: false, optionalConceptsDropped: 0, markdownTruncated: false, sourceDetailsDropped: false },
    };
  }
  if (rendered.prompt.length > maximumCharacters) {
    includeOverview = false;
    rendered = render();
  }
  while (rendered.prompt.length > maximumCharacters) {
    const removableIndex = selectedConcepts.findLastIndex(
      (concept) =>
        !protectedIds.has(concept.conceptId) &&
        concept.expansionDepth >= 2,
    );
    if (removableIndex < 0) break;
    selectedConcepts.splice(removableIndex, 1);
    optionalConceptsDropped += 1;
    rendered = render();
  }
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
    includeDetails = false;
    rendered = render();
  }
  while (rendered.prompt.length > maximumCharacters) {
    const removableIndex = selectedConcepts.findLastIndex(
      (concept) => !protectedIds.has(concept.conceptId),
    );
    if (removableIndex < 0) break;
    selectedConcepts.splice(removableIndex, 1);
    optionalConceptsDropped += 1;
    rendered = render();
  }
  if (rendered.prompt.length > maximumCharacters) {
    // Our own context-packing budget, not a provider failure — must not surface as
    // "the model did not return a usable response" or any AI-provider-shaped error.
    throw new InternalNativeOkfError(
      "This request references more required stored evidence than the assistant can safely include at once. Narrow the papers or categories and try again.",
    );
  }

  const sources = rendered.sources;
  return {
    sources,
    sourceById: new Map(sources.map((source) => [source.sourceId, source])),
    allowedConceptIds: new Set(sources.map((source) => source.conceptId)),
    requiredConceptIds: requiredIds,
    prompt: rendered.prompt,
    packing: {
      overviewDropped: !includeOverview,
      optionalConceptsDropped,
      markdownTruncated: selectedConcepts.some(
        (concept) => concept.markdownBody.length > markdownLimit,
      ),
      sourceDetailsDropped: !includeDetails,
    },
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
  completePapers = false,
): string {
  if (completePapers) return JSON.stringify({
    scope: analysis.scope,
    checkedPaperCount: analysis.checkedPaperCount,
    exhaustiveForScope: analysis.exhaustiveForScope,
    requestedKinds: analysis.requestedKinds,
    exactTerm: analysis.exactTerm,
    relationshipCheckComplete: analysis.relationshipCheckComplete,
    absenceCheckComplete: analysis.absenceCheckComplete,
    papers: analysis.papers.map((paper) => ({
      paperConceptId: paper.paperConceptId,
      representedTypeCounts: paper.representedTypeCounts,
      relevantConceptCount: paper.relevantConceptCount,
      ...(analysis.exactTerm ? { relevantSourceIds: paper.relevantConcepts.flatMap((concept) => sourceIdByConceptId.get(concept.conceptId) ?? []) } : {}),
      relevantRelationshipCount: paper.relevantRelationshipCount,
      relationshipStatus: paper.relationshipStatus,
      explicitTermMatchCount: paper.explicitTermMatchCount,
    })),
  });
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
  activeProposalDraft: SynthesisDraftState | null,
): { sources: NativeOkfGroundedSource[]; prompt: string } {
  const representedDescriptions = new Set(concepts.flatMap((concept) => concept.description ? [concept.description] : []));
  const sourceIdByConceptId = new Map(concepts.map((concept, index) => [concept.conceptId, `S${index + 1}`]));
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
      block: sourceBlock(promptConcept, sourceId, includeDetails, Boolean(retrieval.completePaperContext), representedDescriptions, sourceIdByConceptId),
    } satisfies NativeOkfGroundedSource;
  });

  const overview = includeOverview
    ? retrieval.corpusOverview.papers
    .map(overviewLine)
      .map(escapeXmlText)
      .join("\n")
    : "";
  const sourceText = sources.map((source) => source.block).join("\n\n");
  const selectedBlock = retrieval.completePaperContext
    ? `<OKF_SELECTED_PAPERS>\n${escapeXmlText(JSON.stringify({
        notice: "Selection order is authoritative for first/second/third/fourth/fifth and paper 1 through paper 5. Only current OKF_SOURCE records are citable evidence. Absence refers only to the curated records, not proof of absence in the original publications. Relationships are stored within papers; do not invent cross-paper links.",
        papers: retrieval.completePaperContext.paperConceptIds.map((id, index) => ({
          ordinal: index + 1, conceptId: id,
          title: retrieval.corpusOverview.papers.find((paper) => paper.conceptId === id)?.title,
          sourceIds: (retrieval.completePaperContext!.conceptIdsByPaper[id] ?? []).flatMap((conceptId) => sourceIdByConceptId.get(conceptId) ?? []),
        })),
        relationshipSchema: ["sourceCitationId", "targetCitationId", "canonicalLabel"],
        relationships: retrieval.completePaperContext.relationships.flatMap((edge) => {
          const source = sourceIdByConceptId.get(edge.sourceId);
          const target = sourceIdByConceptId.get(edge.targetId);
          return source && target ? [[source, target, edge.label]] : [];
        }),
      }))}\n</OKF_SELECTED_PAPERS>\n\n`
    : "";
  const structured = retrieval.structuredAnalysis
    ? compactStructuredAnalysis(retrieval.structuredAnalysis, sourceIdByConceptId, Boolean(retrieval.completePaperContext))
    : null;
  const structuredBlock = structured
    ? `<OKF_STRUCTURED_ANALYSIS>\n${escapeXmlText(structured)}\n</OKF_STRUCTURED_ANALYSIS>\n\n`
    : "";
  const overviewBlock = includeOverview && !retrieval.completePaperContext
    ? `<OKF_CORPUS_OVERVIEW>\n${overview}\n</OKF_CORPUS_OVERVIEW>\n\n`
    : "";
  const activeProposalBlock = activeProposalDraft
    ? `<ACTIVE_VALIDATED_PROPOSAL>\n${escapeXmlText(JSON.stringify({
        notice:
          "This validated proposal is conversation design context, not scholarly evidence. Explain only its existing nodes and edges; do not redesign it.",
        problemStatement: activeProposalDraft.problemStatement,
        domain: activeProposalDraft.domain,
        objective: activeProposalDraft.objective,
        constraints: activeProposalDraft.constraints,
        nodes: activeProposalDraft.nodes.map((node) => ({
          id: node.id,
          label: node.label,
          description: node.description,
          stage: node.stage,
          provenance: node.provenance,
          supportSourceIds: node.supportConceptIds.flatMap((conceptId) => {
            const sourceId = sourceIdByConceptId.get(conceptId);
            return sourceId ? [sourceId] : [];
          }),
          synthesisRationale: node.synthesisRationale,
        })),
        edges: activeProposalDraft.edges.map((edge) => ({
          source: edge.source,
          target: edge.target,
          label: edge.label,
          provenance: edge.provenance,
          supportSourceIds: edge.supportConceptIds.flatMap((conceptId) => {
            const sourceId = sourceIdByConceptId.get(conceptId);
            return sourceId ? [sourceId] : [];
          }),
        })),
      }))}\n</ACTIVE_VALIDATED_PROPOSAL>\n\n`
    : "";
  const prompt = `${selectedBlock}${overviewBlock}${structuredBlock}${sourceText}\n\n${activeProposalBlock}<USER_QUESTION>\n${escapeXmlText(question)}\n</USER_QUESTION>`;
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
