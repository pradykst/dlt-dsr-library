import "server-only";

import { getOkfBundle } from "./cache.ts";
import { getPaperByPath } from "./repository.ts";
import type { OkfBundle, OkfConcept, OkfLink } from "./types.ts";
import {
  compareDisplayStrings,
  fallbackTitleFromId,
  formatConceptType,
} from "../shared/presentation.ts";
import type {
  GraphNodeDto,
  PaperDesignMapColumnDto,
  PaperDesignMapDto,
  PaperDesignMapEdgeDto,
} from "../shared/types.ts";

const KNOWN_TYPE_ORDER = new Map<string, number>([
  ["design-goal", 0],
  ["design-objective", 1],
  ["meta-requirement", 2],
  ["design-requirement", 3],
  ["design-principle", 4],
  ["design-feature", 5],
  ["artifact", 6],
  ["evaluation", 7],
  ["outcome", 8],
]);

const KNOWN_COLUMN_TITLES = new Map<string, string>([
  ["design-goal", "Design Goals"],
  ["design-objective", "Design Objectives"],
  ["meta-requirement", "Meta-Requirements"],
  ["design-requirement", "Design Requirements"],
  ["design-principle", "Design Principles"],
  ["design-feature", "Design Features"],
  ["artifact", "Artifacts"],
  ["evaluation", "Evaluation"],
  ["outcome", "Outcomes"],
]);

const SUMMARY_LIMIT = 700;
const DESCRIPTION_LIMIT = 400;

function compareStrings(left: string, right: string): number {
  return left.localeCompare(right, "en");
}

function optionalString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim() !== "") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

function boundedText(value: string | undefined, limit: number): string | undefined {
  const normalized = value?.replace(/\s+/gu, " ").trim();
  if (!normalized) return undefined;
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit - 1).trimEnd()}?`;
}

function markdownSummary(markdown: string): string | undefined {
  return boundedText(
    markdown
      .replace(/```[\s\S]*?```/gu, " ")
      .replace(/!\[([^\]]*)\]\([^)]*\)/gu, "$1")
      .replace(/\[([^\]]+)\]\([^)]*\)/gu, "$1")
      .replace(/<[^>]+>/gu, " ")
      .replace(/^\s{0,3}#{1,6}\s+/gmu, "")
      .replace(/^\s*[-+*>]\s*/gmu, "")
      .replace(/[*_~`|]/gu, " "),
    SUMMARY_LIMIT,
  );
}

function displayTitle(concept: OkfConcept): string {
  return concept.title?.trim() ||
    optionalString(concept.frontmatter.label) ||
    concept.headings.find((heading) => heading.depth === 1)?.text.trim() ||
    fallbackTitleFromId(concept.id);
}

function normalizedReference(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/\.md$/u, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function sourcePaperMetadataMatches(
  concept: OkfConcept,
  paper: OkfConcept,
): boolean {
  const sourcePaper = optionalString(concept.frontmatter.source_paper);
  if (!sourcePaper) return false;
  const normalized = normalizedReference(sourcePaper);
  const candidates = [
    paper.id,
    paper.filePath,
    paper.id.split("/").at(-1) ?? "",
    displayTitle(paper),
    optionalString(paper.frontmatter.title) ?? "",
  ];
  return candidates.some((candidate) =>
    candidate !== "" && normalizedReference(candidate) === normalized
  );
}

function isSourcePaperLink(link: OkfLink): boolean {
  return /^source[\s-]*paper$/iu.test(link.relationHint?.trim() ?? "");
}

function isRenderableDesignConcept(concept: OkfConcept): boolean {
  return concept.type !== "paper" && concept.type !== "reference";
}

export function associatedConceptsForPaper(
  bundle: OkfBundle,
  paper: OkfConcept,
): OkfConcept[] {
  const associatedIds = new Set<string>();

  for (const link of bundle.outgoing.get(paper.id) ?? []) {
    if (link.targetId) associatedIds.add(link.targetId);
  }
  for (const link of bundle.incoming.get(paper.id) ?? []) {
    if (isSourcePaperLink(link)) associatedIds.add(link.sourceId);
  }
  for (const concept of bundle.concepts) {
    if (sourcePaperMetadataMatches(concept, paper)) associatedIds.add(concept.id);
  }

  return [...associatedIds]
    .flatMap((id) => {
      const concept = bundle.conceptsById.get(id);
      return concept && isRenderableDesignConcept(concept) ? [concept] : [];
    })
    .sort((left, right) => compareStrings(left.id, right.id));
}

export function semanticTypeRank(type: string): number {
  return KNOWN_TYPE_ORDER.get(type) ?? 100;
}

export function semanticColumnTitle(type: string): string {
  const known = KNOWN_COLUMN_TITLES.get(type);
  if (known) return known;
  const formatted = formatConceptType(type);
  return /s$/iu.test(formatted) ? formatted : `${formatted}s`;
}

interface NaturalLabel {
  prefix: string;
  number: number;
}

function naturalLabel(value: string | undefined): NaturalLabel | undefined {
  const match = value?.trim().match(/^([\p{L}]+)[\s-]*0*(\d+)\b/iu);
  if (!match?.[1] || !match[2]) return undefined;
  return { prefix: match[1].toLocaleLowerCase("en"), number: Number(match[2]) };
}

export function compareSemanticConcepts(
  left: OkfConcept,
  right: OkfConcept,
): number {
  const leftLabel = naturalLabel(optionalString(left.frontmatter.label));
  const rightLabel = naturalLabel(optionalString(right.frontmatter.label));
  if (leftLabel && rightLabel && leftLabel.prefix === rightLabel.prefix) {
    const numeric = leftLabel.number - rightLabel.number;
    if (numeric !== 0) return numeric;
  } else if (leftLabel && !rightLabel) {
    return -1;
  } else if (!leftLabel && rightLabel) {
    return 1;
  }
  return compareDisplayStrings(displayTitle(left), displayTitle(right)) ||
    compareStrings(left.id, right.id);
}

function graphNode(concept: OkfConcept): GraphNodeDto {
  const description = boundedText(concept.description, DESCRIPTION_LIMIT);
  const summary = markdownSummary(concept.markdownBody);
  const label = optionalString(concept.frontmatter.label);
  return {
    id: concept.id,
    filePath: concept.filePath,
    type: concept.type,
    typeLabel: formatConceptType(concept.type),
    title: displayTitle(concept),
    ...(description ? { description } : {}),
    ...(label ? { label } : {}),
    tags: [...(concept.tags ?? [])].sort(compareDisplayStrings),
    ...(summary ? { markdownSummary: summary } : {}),
    seed: false,
  };
}

function directionByRank(
  source: OkfConcept,
  target: OkfConcept,
): { sourceId: string; targetId: string } | undefined {
  const sourceRank = semanticTypeRank(source.type);
  const targetRank = semanticTypeRank(target.type);
  if (sourceRank === targetRank) return undefined;
  return sourceRank < targetRank
    ? { sourceId: source.id, targetId: target.id }
    : { sourceId: target.id, targetId: source.id };
}

export function projectSemanticLink(
  link: OkfLink,
  bundle: OkfBundle,
): Omit<PaperDesignMapEdgeDto, "id" | "sourceRelationshipCount"> | undefined {
  if (!link.targetId || isSourcePaperLink(link)) return undefined;
  const source = bundle.conceptsById.get(link.sourceId);
  const target = bundle.conceptsById.get(link.targetId);
  if (!source || !target || !isRenderableDesignConcept(source) || !isRenderableDesignConcept(target)) {
    return undefined;
  }

  const hint = link.relationHint?.trim().toLocaleLowerCase("en") ?? "";
  if (/^address(?:es|ed|ing)?$/u.test(hint)) {
    const direction = directionByRank(source, target);
    return direction ? { ...direction, label: "addresses" } : undefined;
  }
  if (/^implement(?:s|ed|ing)?(?:\s+by)?$/u.test(hint)) {
    if (
      (source.type === "design-principle" && target.type === "design-feature") ||
      (source.type === "design-feature" && target.type === "design-principle")
    ) {
      return source.type === "design-principle"
        ? { sourceId: source.id, targetId: target.id, label: "implements" }
        : { sourceId: target.id, targetId: source.id, label: "implements" };
    }
    const direction = directionByRank(source, target);
    return direction ? { ...direction, label: "implements" } : undefined;
  }
  if (/^support(?:s|ed|ing)?$/u.test(hint)) {
    const direction = directionByRank(source, target);
    return direction ? { ...direction, label: "supports" } : undefined;
  }
  if (/^satisf(?:y|ies|ied|ying)$/u.test(hint)) {
    const direction = directionByRank(source, target);
    return direction ? { ...direction, label: "satisfies" } : undefined;
  }
  return undefined;
}

export function projectSemanticEdges(
  bundle: OkfBundle,
  concepts: readonly OkfConcept[],
): PaperDesignMapEdgeDto[] {
  const conceptIds = new Set(concepts.map((concept) => concept.id));
  const projected = new Map<string, PaperDesignMapEdgeDto>();

  for (const concept of [...concepts].sort((left, right) => compareStrings(left.id, right.id))) {
    for (const link of [...(bundle.outgoing.get(concept.id) ?? [])].sort((left, right) =>
      compareStrings(left.targetId ?? "", right.targetId ?? "") ||
      compareStrings(left.relationHint ?? "", right.relationHint ?? "")
    )) {
      if (!link.targetId || !conceptIds.has(link.targetId)) continue;
      const semantic = projectSemanticLink(link, bundle);
      if (!semantic) continue;
      const key = `${semantic.sourceId}\0${semantic.targetId}\0${semantic.label}`;
      const existing = projected.get(key);
      if (existing) {
        existing.sourceRelationshipCount += 1;
      } else {
        projected.set(key, {
          id: `semantic:${semantic.sourceId}->${semantic.targetId}:${semantic.label}`,
          ...semantic,
          sourceRelationshipCount: 1,
        });
      }
    }
  }

  return [...projected.values()].sort((left, right) =>
    compareStrings(left.sourceId, right.sourceId) ||
    compareStrings(left.targetId, right.targetId) ||
    compareStrings(left.label, right.label)
  );
}

export function buildPaperDesignMapFromBundle(
  bundle: OkfBundle,
  paper: OkfConcept,
): PaperDesignMapDto {
  const concepts = associatedConceptsForPaper(bundle, paper);
  const conceptsByType = new Map<string, OkfConcept[]>();
  for (const concept of concepts) {
    const group = conceptsByType.get(concept.type) ?? [];
    group.push(concept);
    conceptsByType.set(concept.type, group);
  }

  const orderedTypes = [...conceptsByType.keys()].sort((left, right) =>
    semanticTypeRank(left) - semanticTypeRank(right) || compareStrings(left, right)
  );
  const columns: PaperDesignMapColumnDto[] = orderedTypes.map((type) => {
    const columnConcepts = [...(conceptsByType.get(type) ?? [])].sort(compareSemanticConcepts);
    return {
      key: type,
      type,
      title: semanticColumnTitle(type),
      nodeIds: columnConcepts.map((concept) => concept.id),
    };
  });

  return {
    paperId: paper.id,
    columns,
    nodes: columns.flatMap((column) =>
      column.nodeIds.flatMap((id) => {
        const concept = bundle.conceptsById.get(id);
        return concept ? [graphNode(concept)] : [];
      })
    ),
    edges: projectSemanticEdges(bundle, concepts),
  };
}

export async function buildPaperDesignMap(
  paperId: string,
): Promise<PaperDesignMapDto | undefined> {
  const [bundle, paper] = await Promise.all([getOkfBundle(), getPaperByPath(paperId)]);
  return paper ? buildPaperDesignMapFromBundle(bundle, paper) : undefined;
}
