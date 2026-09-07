import "server-only";
import { buildPaperDesignMapFromBundle } from "./paper-design-map.ts";

import { getOkfBundle } from "./cache.ts";
import {
  getAllConcepts,
  getAllPapers,
  getConceptByPath,
  getLinkedConcepts,
  getPaperByPath,
  getSubgraph,
} from "./repository.ts";
import type { OkfConcept, OkfLink } from "./types.ts";
import {
  compareDisplayStrings,
  fallbackTitleFromId,
  formatConceptType,
  normalizeCatchAllSegments,
} from "../shared/presentation.ts";
import { compareNumberedConceptOrder } from "../shared/natural-order.ts";
import type { CatchAllSegments } from "../shared/presentation.ts";
import type {
  ConceptDetailDto,
  ConceptSummaryDto,
  GraphDto,
  GraphEdgeDto,
  GraphNodeDto,
  JsonObject,
  JsonValue,
  LibraryViewModel,
  LinkedConceptGroupDto,
  PaperCardDto,
  RelationshipDirection,
  RelationshipDto,
  TypeCountDto,
  WorkbenchViewModel,
} from "../shared/types.ts";

export { normalizeCatchAllSegments } from "../shared/presentation.ts";
export type { CatchAllSegments } from "../shared/presentation.ts";

export const WORKBENCH_GRAPH_MAX_NODES = 120;
const GRAPH_MARKDOWN_SUMMARY_LIMIT = 700;
const GRAPH_DESCRIPTION_LIMIT = 400;
const BLOCKED_JSON_KEYS = new Set([
  "__proto__",
  "prototype",
  "constructor",
  "absolutepath",
  "rootpath",
  "rawmarkdown",
]);

function compareStrings(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function optionalString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
}

function stringList(value: unknown): string[] {
  const values = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/\s*[,;]\s*/u)
      : [];

  return [...new Set(
    values
      .map(optionalString)
      .filter((item): item is string => item !== undefined),
  )];
}

function displayTitle(concept: OkfConcept): string {
  return concept.title?.trim() ||
    optionalString(concept.frontmatter.label) ||
    concept.headings.find((heading) => heading.depth === 1)?.text.trim() ||
    fallbackTitleFromId(concept.id);
}

function conceptSummary(concept: OkfConcept): ConceptSummaryDto {
  return {
    id: concept.id,
    filePath: concept.filePath,
    type: concept.type,
    typeLabel: formatConceptType(concept.type),
    title: displayTitle(concept),
    ...(concept.description === undefined ? {} : { description: concept.description }),
    tags: [...(concept.tags ?? [])].sort(compareDisplayStrings),
  };
}

function compareConceptSummaries(
  left: ConceptSummaryDto,
  right: ConceptSummaryDto,
): number {
  // Within a design-knowledge category, order numbered concepts naturally so
  // "DR2" precedes "DR10". Label-free titles keep their previous lexical order
  // because the natural comparator falls back to a display-string comparison.
  return compareStrings(left.type, right.type) ||
    compareNumberedConceptOrder(left, right) ||
    compareStrings(left.id, right.id);
}

function typeCounts(concepts: readonly OkfConcept[]): TypeCountDto[] {
  const counts = new Map<string, number>();
  for (const concept of concepts) {
    counts.set(concept.type, (counts.get(concept.type) ?? 0) + 1);
  }

  return [...counts]
    .sort(([left], [right]) => compareStrings(left, right))
    .map(([type, count]) => ({ type, label: formatConceptType(type), count }));
}

function sanitizeJsonValue(
  value: unknown,
  seen: WeakSet<object>,
): JsonValue | undefined {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "bigint") {
    return String(value);
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  if (typeof value !== "object") return undefined;
  if (seen.has(value)) return null;

  seen.add(value);
  if (Array.isArray(value)) {
    const result = value.map((item) => sanitizeJsonValue(item, seen) ?? null);
    seen.delete(value);
    return result;
  }

  const result: JsonObject = {};
  for (const [key, item] of Object.entries(value)) {
    if (BLOCKED_JSON_KEYS.has(key.toLowerCase())) continue;
    const sanitized = sanitizeJsonValue(item, seen);
    if (sanitized !== undefined) result[key] = sanitized;
  }
  seen.delete(value);
  return result;
}

function sanitizeFrontmatter(frontmatter: Record<string, unknown>): JsonObject {
  const sanitized = sanitizeJsonValue(frontmatter, new WeakSet<object>());
  return sanitized && !Array.isArray(sanitized) && typeof sanitized === "object"
    ? sanitized
    : {};
}

function conceptDetail(concept: OkfConcept): ConceptDetailDto {
  return {
    ...conceptSummary(concept),
    ...(concept.resource === undefined ? {} : { resource: concept.resource }),
    ...(concept.timestamp === undefined ? {} : { timestamp: concept.timestamp }),
    frontmatter: sanitizeFrontmatter(concept.frontmatter),
    markdownBody: concept.markdownBody,
  };
}

function boundedText(value: string | undefined, maximum: number): string | undefined {
  if (value === undefined) return undefined;
  const normalized = value.replace(/\s+/gu, " ").trim();
  if (normalized === "") return undefined;
  if (normalized.length <= maximum) return normalized;

  const prefix = normalized.slice(0, Math.max(0, maximum - 1));
  const wordBoundary = prefix.lastIndexOf(" ");
  const truncated = wordBoundary >= Math.floor(maximum * 0.7)
    ? prefix.slice(0, wordBoundary)
    : prefix;
  return `${truncated.trimEnd()}…`;
}

function markdownSummary(markdownBody: string): string | undefined {
  const plainText = markdownBody
    .replace(/```[\s\S]*?```/gu, " ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/gu, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/gu, "$1")
    .replace(/<[^>]+>/gu, " ")
    .replace(/^\s{0,3}#{1,6}\s+/gmu, "")
    .replace(/^\s*[-+*>]\s*/gmu, "")
    .replace(/[*_~`|]/gu, " ");
  return boundedText(plainText, GRAPH_MARKDOWN_SUMMARY_LIMIT);
}

function linkedGroups(concepts: readonly OkfConcept[]): LinkedConceptGroupDto[] {
  const groups = new Map<string, ConceptSummaryDto[]>();

  for (const concept of concepts) {
    const group = groups.get(concept.type) ?? [];
    group.push(conceptSummary(concept));
    groups.set(concept.type, group);
  }

  return [...groups]
    .sort(([left], [right]) => compareStrings(left, right))
    .map(([type, summaries]) => {
      summaries.sort(compareConceptSummaries);
      return {
        type,
        typeLabel: formatConceptType(type),
        count: summaries.length,
        concepts: summaries,
      };
    });
}

function relationshipDto(
  link: OkfLink,
  direction: RelationshipDirection,
  conceptsById: ReadonlyMap<string, OkfConcept>,
): RelationshipDto {
  const source = conceptsById.get(link.sourceId);
  const target = link.targetId ? conceptsById.get(link.targetId) : undefined;
  const sourceTitle = source ? displayTitle(source) : fallbackTitleFromId(link.sourceId);
  const targetTitle = target
    ? displayTitle(target)
    : link.label.trim() || fallbackTitleFromId(link.targetId ?? link.targetPath ?? link.rawTarget);
  const displayConcept = direction === "outgoing" ? target : source;

  return {
    direction,
    sourceId: link.sourceId,
    sourceTitle,
    ...(source === undefined ? {} : { sourceType: source.type }),
    ...(link.targetId === undefined ? {} : { targetId: link.targetId }),
    targetTitle,
    ...(target === undefined ? {} : { targetType: target.type }),
    ...(link.targetPath === undefined ? {} : { targetPath: link.targetPath }),
    rawTarget: link.rawTarget,
    label: link.label,
    ...(link.relationHint === undefined ? {} : { relationHint: link.relationHint }),
    resolved: link.resolved,
    broken: link.broken,
    external: link.external,
    displayTitle: direction === "outgoing" ? targetTitle : sourceTitle,
    ...(displayConcept === undefined ? {} : { displayType: displayConcept.type }),
  };
}

function compareRelationships(left: RelationshipDto, right: RelationshipDto): number {
  return compareDisplayStrings(left.displayTitle, right.displayTitle) ||
    compareStrings(left.sourceId, right.sourceId) ||
    compareStrings(left.targetId ?? "", right.targetId ?? "") ||
    compareStrings(left.rawTarget, right.rawTarget) ||
    compareStrings(left.label, right.label);
}

function graphNode(concept: OkfConcept, seedId: string): GraphNodeDto {
  return {
    id: concept.id,
    filePath: concept.filePath,
    type: concept.type,
    typeLabel: formatConceptType(concept.type),
    title: displayTitle(concept),
    ...(boundedText(concept.description, GRAPH_DESCRIPTION_LIMIT) === undefined
      ? {}
      : { description: boundedText(concept.description, GRAPH_DESCRIPTION_LIMIT) }),
    ...(optionalString(concept.frontmatter.label) === undefined
      ? {}
      : { label: optionalString(concept.frontmatter.label) }),
    tags: [...(concept.tags ?? [])].sort(compareDisplayStrings),
    ...(markdownSummary(concept.markdownBody) === undefined
      ? {}
      : { markdownSummary: markdownSummary(concept.markdownBody) }),
    seed: concept.id === seedId,
  };
}

function graphEdge(
  link: OkfLink,
  conceptsById: ReadonlyMap<string, OkfConcept>,
): GraphEdgeDto | undefined {
  if (!link.targetId) return undefined;
  const source = conceptsById.get(link.sourceId);
  const target = conceptsById.get(link.targetId);
  if (!source || !target) return undefined;

  return {
    sourceId: link.sourceId,
    sourceTitle: displayTitle(source),
    targetId: link.targetId,
    targetTitle: displayTitle(target),
    rawTarget: link.rawTarget,
    label: link.label,
    ...(link.relationHint === undefined ? {} : { relationHint: link.relationHint }),
    resolved: link.resolved,
    broken: link.broken,
    external: link.external,
  };
}

async function buildGraphViewModel(seedId: string, depth: 1 | 2): Promise<GraphDto> {
  const subgraph = await getSubgraph([seedId], {
    depth,
    maxNodes: WORKBENCH_GRAPH_MAX_NODES,
    includeIncoming: true,
    includeOutgoing: true,
  });
  const conceptsById = new Map(subgraph.concepts.map((concept) => [concept.id, concept]));
  const nodes = subgraph.concepts
    .map((concept) => graphNode(concept, seedId))
    .sort((left, right) => compareStrings(left.id, right.id));
  const edges = subgraph.links
    .map((link) => graphEdge(link, conceptsById))
    .filter((edge): edge is GraphEdgeDto => edge !== undefined);

  return { depth, nodes, edges, truncated: subgraph.truncated };
}

function yearDescending(left: string, right: string): number {
  const leftNumber = Number(left);
  const rightNumber = Number(right);
  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber) && leftNumber !== rightNumber) {
    return rightNumber - leftNumber;
  }
  return compareDisplayStrings(right, left);
}

async function paperCard(paper: OkfConcept): Promise<PaperCardDto> {
  const linked = (await getLinkedConcepts(paper.id))
    .filter((concept) => concept.type !== "paper" && concept.type !== "reference");
  const linkedConcepts = linked.map(conceptSummary).sort(compareConceptSummaries);
  const authors = stringList(paper.frontmatter.authors);
  const year = optionalString(paper.frontmatter.year);
  const venue = optionalString(paper.frontmatter.venue);
  const summary = conceptSummary(paper);

  return {
    ...summary,
    authors,
    ...(year === undefined ? {} : { year }),
    ...(venue === undefined ? {} : { venue }),
    search: {
      title: summary.title,
      description: summary.description ?? "",
      authors,
      year: year ?? "",
      venue: venue ?? "",
      tags: [...summary.tags],
    },
    linkedConcepts,
    linkedTypeCounts: typeCounts(linked),
  };
}

export async function getLibraryViewModel(): Promise<LibraryViewModel> {
  const [bundle, concepts, papers] = await Promise.all([
    getOkfBundle(),
    getAllConcepts(),
    getAllPapers(),
  ]);
  const cards = await Promise.all(papers.map(paperCard));
  cards.sort(
    (left, right) =>
      compareDisplayStrings(left.title, right.title) || compareStrings(left.id, right.id),
  );

  const allTypeCounts = typeCounts(concepts);
  const designConcepts = concepts.filter(
    (concept) => concept.type !== "paper" && concept.type !== "reference",
  );
  const tags = [...new Set(cards.flatMap((card) => card.tags))].sort(compareDisplayStrings);
  const years = [...new Set(cards.flatMap((card) => card.year ? [card.year] : []))]
    .sort(yearDescending);
  const venues = [...new Set(cards.flatMap((card) => card.venue ? [card.venue] : []))]
    .sort(compareDisplayStrings);
  const rootIndex = bundle.reservedDocuments.find((document) => document.filePath === "index.md");
  const title = rootIndex?.headings.find((heading) => heading.depth === 1)?.text.trim() ||
    "Open Knowledge Library";

  return {
    title,
    ...(bundle.okfVersion === undefined ? {} : { version: bundle.okfVersion }),
    paperCount: cards.length,
    designKnowledgeCount: designConcepts.length,
    typeCounts: allTypeCounts,
    filterOptions: {
      types: typeCounts(designConcepts),
      tags,
      years,
      venues,
    },
    papers: cards,
  };
}

async function buildWorkbenchViewModel(concept: OkfConcept): Promise<WorkbenchViewModel> {
  const [bundle, linked, graphOneHop, graphTwoHops] = await Promise.all([
    getOkfBundle(),
    getLinkedConcepts(concept.id),
    buildGraphViewModel(concept.id, 1),
    buildGraphViewModel(concept.id, 2),
  ]);
  const visibleLinked = concept.type === "paper"
    ? linked.filter((item) => item.type !== "paper" && item.type !== "reference")
    : linked;
  const paperDesignMap = concept.type === "paper"
    ? buildPaperDesignMapFromBundle(bundle, concept)
    : undefined;

  const outgoing = concept.outgoingLinks
    .map((link) => relationshipDto(link, "outgoing", bundle.conceptsById))
    .sort(compareRelationships);
  const incoming = concept.incomingLinks
    .map((link) => relationshipDto(link, "incoming", bundle.conceptsById))
    .sort(compareRelationships);

  return {
    kind: concept.type === "paper" ? "paper" : "concept",
    concept: conceptDetail(concept),
    linkedGroups: linkedGroups(visibleLinked),
    outgoing,
    incoming,
    graphOneHop,
    graphTwoHops,
    ...(paperDesignMap ? { paperDesignMap } : {}),
  };
}

export async function getGraphViewModel(
  path: CatchAllSegments,
  depth: 1 | 2,
): Promise<GraphDto | undefined> {
  const normalized = normalizeCatchAllSegments(path);
  if (normalized === undefined) return undefined;
  const concept = await getConceptByPath(normalized);
  if (!concept) return undefined;
  return buildGraphViewModel(concept.id, depth);
}

export async function getWorkbenchViewModel(
  path: CatchAllSegments,
): Promise<WorkbenchViewModel | undefined> {
  const normalized = normalizeCatchAllSegments(path);
  if (normalized === undefined) return undefined;
  const concept = await getConceptByPath(normalized);
  return concept ? buildWorkbenchViewModel(concept) : undefined;
}

export async function getPaperWorkbenchViewModel(
  path: CatchAllSegments,
): Promise<WorkbenchViewModel | undefined> {
  const normalized = normalizeCatchAllSegments(path);
  if (normalized === undefined) return undefined;
  const paper = await getPaperByPath(normalized);
  return paper ? buildWorkbenchViewModel(paper) : undefined;
}

export async function getConceptWorkbenchViewModel(
  path: CatchAllSegments,
): Promise<WorkbenchViewModel | undefined> {
  return getWorkbenchViewModel(path);
}
