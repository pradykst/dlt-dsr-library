import "server-only";

import type { DiagramStage } from "../../shared/chat-types.ts";
import { fallbackTitleFromId } from "../../shared/presentation.ts";
import { getOkfBundle } from "../cache.ts";
import { projectSemanticLink } from "../paper-design-map.ts";
import type { RetrievalResult } from "../retrieval-types.ts";
import type { OkfBundle, OkfConcept, OkfLink } from "../types.ts";

export interface DiagramGroundingConcept {
  conceptId: string;
  title: string;
  description: string;
  type: string;
  stage: DiagramStage;
}

export interface DiagramStoredRelation {
  sourceId: string;
  targetId: string;
  label: string;
}

export interface NativeOkfDiagramGrounding {
  allowedConceptIds: ReadonlySet<string>;
  eligibleStoredConceptIds: ReadonlySet<string>;
  conceptsById: ReadonlyMap<string, DiagramGroundingConcept>;
  storedRelations: readonly DiagramStoredRelation[];
}

const STAGE_BY_TYPE: Readonly<Record<string, DiagramStage>> = {
  problem: "problem",
  "design-goal": "design-goal",
  "design-objective": "design-objective",
  "meta-requirement": "meta-requirement",
  "design-requirement": "design-requirement",
  "design-principle": "design-principle",
  "design-feature": "design-feature",
  artifact: "artifact",
  evaluation: "evaluation",
  outcome: "outcome",
};

function boundedText(value: string, maximum: number): string {
  const normalized = value.replace(/\s+/gu, " ").trim();
  return normalized.length <= maximum
    ? normalized
    : normalized.slice(0, maximum - 3).trimEnd() + "...";
}

function displayTitle(concept: OkfConcept): string {
  const label = typeof concept.frontmatter.label === "string"
    ? concept.frontmatter.label.trim()
    : "";
  return concept.title?.trim() ||
    label ||
    concept.headings.find((heading) => heading.depth === 1)?.text.trim() ||
    fallbackTitleFromId(concept.id);
}

function descriptionFor(concept: OkfConcept): string {
  return boundedText(
    concept.description?.trim() ||
      concept.markdownBody
        .replace(/\x60{3}[\s\S]*?\x60{3}/gu, " ")
        .replace(/!\[([^\]]*)\]\([^)]*\)/gu, "$1")
        .replace(/\[([^\]]+)\]\([^)]*\)/gu, "$1")
        .replace(/^\s{0,3}#{1,6}\s+/gmu, "")
        .replace(/[\*_~\x60|]/gu, " ")
        .replace(/\s+/gu, " ")
        .trim() ||
      displayTitle(concept),
    360,
  );
}

export function diagramStageForConceptType(type: string): DiagramStage {
  return STAGE_BY_TYPE[type] ?? "other";
}

function isTechnicalLink(link: OkfLink): boolean {
  const hint = link.relationHint?.trim() ?? "";
  return /^(?:source[\s-]*paper|design[\s-]*knowledge|references?)$/iu.test(
    hint,
  );
}

export function storedRelationsForConcepts(
  bundle: OkfBundle,
  conceptIds: ReadonlySet<string>,
): DiagramStoredRelation[] {
  const relations = new Map<string, DiagramStoredRelation>();
  for (const sourceId of [...conceptIds].sort((left, right) =>
    left.localeCompare(right, "en")
  )) {
    for (const link of bundle.outgoing.get(sourceId) ?? []) {
      if (
        !link.targetId ||
        !conceptIds.has(link.targetId) ||
        isTechnicalLink(link)
      ) {
        continue;
      }
      const semantic = projectSemanticLink(link, bundle);
      const relation = semantic ?? {
        sourceId: link.sourceId,
        targetId: link.targetId,
        label: boundedText(
          link.relationHint?.trim() || link.label.trim() || "relates to",
          32,
        ),
      };
      if (relation.sourceId === relation.targetId) continue;
      const key = JSON.stringify([
        relation.sourceId,
        relation.targetId,
        relation.label,
      ]);
      relations.set(key, relation);
    }
  }
  return [...relations.values()].sort(
    (left, right) =>
      left.sourceId.localeCompare(right.sourceId, "en") ||
      left.targetId.localeCompare(right.targetId, "en") ||
      left.label.localeCompare(right.label, "en"),
  );
}

export async function buildNativeOkfDiagramGrounding(
  retrieval: RetrievalResult,
): Promise<NativeOkfDiagramGrounding> {
  const bundle = await getOkfBundle();
  const allowedConceptIds = new Set(
    retrieval.finalConcepts.map((concept) => concept.conceptId),
  );
  const eligibleStoredConceptIds = new Set(
    retrieval.finalConcepts
      .filter(
        (concept) =>
          concept.type !== "paper" && concept.type !== "reference",
      )
      .map((concept) => concept.conceptId),
  );
  const conceptsById = new Map<string, DiagramGroundingConcept>();
  for (const conceptId of allowedConceptIds) {
    const concept = bundle.conceptsById.get(conceptId);
    if (!concept) continue;
    conceptsById.set(conceptId, {
      conceptId,
      title: displayTitle(concept),
      description: descriptionFor(concept),
      type: concept.type,
      stage: diagramStageForConceptType(concept.type),
    });
  }
  return {
    allowedConceptIds,
    eligibleStoredConceptIds,
    conceptsById,
    storedRelations: storedRelationsForConcepts(
      bundle,
      eligibleStoredConceptIds,
    ),
  };
}

