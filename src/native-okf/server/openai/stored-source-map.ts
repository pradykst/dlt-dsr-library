import "server-only";

import type {
  DiagramStage,
  GeneratedDiagram,
  GeneratedDiagramEdge,
  GeneratedDiagramNode,
} from "../../shared/chat-types.ts";
import { fallbackTitleFromId, formatConceptType } from "../../shared/presentation.ts";
import { getOkfBundle } from "../cache.ts";
import { projectSemanticLink } from "../paper-design-map.ts";
import type { RetrievalResult } from "../retrieval-types.ts";
import type { OkfBundle, OkfConcept, OkfLink } from "../types.ts";
import { validateGeneratedDiagram } from "./diagram-validation.ts";
import { buildNativeOkfDiagramGrounding } from "./diagram-grounding.ts";

const MAX_FALLBACK_NODES = 14;
const MAX_FALLBACK_EDGES = 20;

const STAGE_BY_TYPE: Readonly<Record<string, DiagramStage>> = {
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

interface StoredEdge {
  sourceId: string;
  targetId: string;
  label: string;
}

function compareStrings(left: string, right: string): number {
  return left.localeCompare(right, "en");
}

function boundedText(value: string, maximum: number): string {
  const normalized = value.replace(/\s+/gu, " ").trim();
  if (normalized.length <= maximum) return normalized;
  return `${normalized.slice(0, maximum - 1).trimEnd()}?`;
}

function displayTitle(concept: OkfConcept): string {
  const producerLabel =
    typeof concept.frontmatter.label === "string"
      ? concept.frontmatter.label.trim()
      : "";
  return concept.title?.trim() ||
    producerLabel ||
    concept.headings.find((heading) => heading.depth === 1)?.text.trim() ||
    fallbackTitleFromId(concept.id);
}

function descriptionFor(concept: OkfConcept): string {
  const description = concept.description?.trim() ||
    concept.markdownBody
      .replace(/```[\s\S]*?```/gu, " ")
      .replace(/!\[([^\]]*)\]\([^)]*\)/gu, "$1")
      .replace(/\[([^\]]+)\]\([^)]*\)/gu, "$1")
      .replace(/^\s{0,3}#{1,6}\s+/gmu, "")
      .replace(/[\*_~`|]/gu, " ")
      .replace(/\s+/gu, " ")
      .trim() ||
    displayTitle(concept);
  return boundedText(description, 280);
}

function stageFor(concept: OkfConcept): DiagramStage {
  return STAGE_BY_TYPE[concept.type] ?? "other";
}

function numericOrder(concept: OkfConcept, fallback: number): number {
  const label =
    typeof concept.frontmatter.label === "string"
      ? concept.frontmatter.label
      : "";
  const match = label.match(/\d+/u);
  if (!match) return Math.min(fallback, 100);
  return Math.min(Number(match[0]), 100);
}

function isTechnicalLink(link: OkfLink): boolean {
  const hint = link.relationHint?.trim() ?? "";
  return /^(?:source[\s-]*paper|design[\s-]*knowledge|references?)$/iu.test(hint);
}

function storedEdges(
  bundle: OkfBundle,
  concepts: readonly OkfConcept[],
): StoredEdge[] {
  const ids = new Set(concepts.map((concept) => concept.id));
  const edges = new Map<string, StoredEdge>();

  for (const concept of [...concepts].sort((left, right) =>
    compareStrings(left.id, right.id)
  )) {
    const links = [...(bundle.outgoing.get(concept.id) ?? [])].sort(
      (left, right) =>
        compareStrings(left.targetId ?? "", right.targetId ?? "") ||
        compareStrings(left.relationHint ?? "", right.relationHint ?? ""),
    );
    for (const link of links) {
      if (!link.targetId || !ids.has(link.targetId) || isTechnicalLink(link)) {
        continue;
      }
      const semantic = projectSemanticLink(link, bundle);
      const edge: StoredEdge = semantic ?? {
        sourceId: link.sourceId,
        targetId: link.targetId,
        label: boundedText(
          link.relationHint?.trim() || link.label.trim() || "relates to",
          32,
        ),
      };
      if (edge.sourceId === edge.targetId) continue;
      const key = `${edge.sourceId}\0${edge.targetId}\0${edge.label}`;
      edges.set(key, edge);
    }
  }

  return [...edges.values()].sort(
    (left, right) =>
      compareStrings(left.sourceId, right.sourceId) ||
      compareStrings(left.targetId, right.targetId) ||
      compareStrings(left.label, right.label),
  );
}

function largestConnectedComponent(
  concepts: readonly OkfConcept[],
  edges: readonly StoredEdge[],
  retrievalRank: ReadonlyMap<string, number>,
): OkfConcept[] {
  const byId = new Map(concepts.map((concept) => [concept.id, concept]));
  const adjacency = new Map<string, Set<string>>();
  for (const edge of edges) {
    const sourceNeighbors = adjacency.get(edge.sourceId) ?? new Set<string>();
    sourceNeighbors.add(edge.targetId);
    adjacency.set(edge.sourceId, sourceNeighbors);
    const targetNeighbors = adjacency.get(edge.targetId) ?? new Set<string>();
    targetNeighbors.add(edge.sourceId);
    adjacency.set(edge.targetId, targetNeighbors);
  }

  const visited = new Set<string>();
  const components: OkfConcept[][] = [];
  for (const startId of [...adjacency.keys()].sort(compareStrings)) {
    if (visited.has(startId)) continue;
    const ids: string[] = [];
    const queue = [startId];
    visited.add(startId);
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const id = queue[cursor]!;
      ids.push(id);
      for (const neighbor of [...(adjacency.get(id) ?? [])].sort(compareStrings)) {
        if (visited.has(neighbor)) continue;
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
    components.push(
      ids.flatMap((id) => {
        const concept = byId.get(id);
        return concept ? [concept] : [];
      }),
    );
  }

  components.sort(
    (left, right) =>
      right.length - left.length ||
      Math.min(...left.map((item) => retrievalRank.get(item.id) ?? 10_000)) -
        Math.min(...right.map((item) => retrievalRank.get(item.id) ?? 10_000)) ||
      compareStrings(left[0]?.id ?? "", right[0]?.id ?? ""),
  );
  return components[0] ?? [];
}

function selectConnectedNodes(
  component: readonly OkfConcept[],
  edges: readonly StoredEdge[],
  retrievalRank: ReadonlyMap<string, number>,
): OkfConcept[] {
  if (component.length <= MAX_FALLBACK_NODES) return [...component];

  const componentIds = new Set(component.map((concept) => concept.id));
  const adjacency = new Map<string, Set<string>>();
  for (const edge of edges) {
    if (!componentIds.has(edge.sourceId) || !componentIds.has(edge.targetId)) {
      continue;
    }
    const source = adjacency.get(edge.sourceId) ?? new Set<string>();
    source.add(edge.targetId);
    adjacency.set(edge.sourceId, source);
    const target = adjacency.get(edge.targetId) ?? new Set<string>();
    target.add(edge.sourceId);
    adjacency.set(edge.targetId, target);
  }

  const ordered = [...component].sort(
    (left, right) =>
      (retrievalRank.get(left.id) ?? 10_000) -
        (retrievalRank.get(right.id) ?? 10_000) ||
      compareStrings(left.id, right.id),
  );
  const selected = new Set<string>();
  const queue = [ordered[0]!.id];
  selected.add(ordered[0]!.id);
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    for (const neighbor of [...(adjacency.get(queue[cursor]!) ?? [])].sort(
      (left, right) =>
        (retrievalRank.get(left) ?? 10_000) -
          (retrievalRank.get(right) ?? 10_000) ||
        compareStrings(left, right),
    )) {
      if (selected.has(neighbor)) continue;
      selected.add(neighbor);
      queue.push(neighbor);
      if (selected.size >= MAX_FALLBACK_NODES) break;
    }
    if (selected.size >= MAX_FALLBACK_NODES) break;
  }
  return ordered.filter((concept) => selected.has(concept.id));
}

export async function buildGroundedStoredSourceMap(
  retrieval: RetrievalResult,
): Promise<GeneratedDiagram | undefined> {
  const bundle = await getOkfBundle();
  const retrievalRank = new Map(
    retrieval.finalConcepts.map((concept, index) => [concept.conceptId, index]),
  );
  const allowlist = new Set(retrievalRank.keys());
  const concepts = [...allowlist]
    .flatMap((id) => {
      const concept = bundle.conceptsById.get(id);
      return concept &&
          concept.type !== "paper" &&
          concept.type !== "reference"
        ? [concept]
        : [];
    })
    .sort(
      (left, right) =>
        (retrievalRank.get(left.id) ?? 10_000) -
          (retrievalRank.get(right.id) ?? 10_000) ||
        compareStrings(left.id, right.id),
    );

  const allEdges = storedEdges(bundle, concepts);
  const component = largestConnectedComponent(concepts, allEdges, retrievalRank);
  if (component.length < 2) return undefined;

  const selectedConcepts = selectConnectedNodes(component, allEdges, retrievalRank);
  const selectedIds = new Set(selectedConcepts.map((concept) => concept.id));
  const selectedEdges = allEdges
    .filter(
      (edge) =>
        selectedIds.has(edge.sourceId) && selectedIds.has(edge.targetId),
    )
    .slice(0, MAX_FALLBACK_EDGES);
  const connectedIds = new Set(
    selectedEdges.flatMap((edge) => [edge.sourceId, edge.targetId]),
  );
  const connectedConcepts = selectedConcepts.filter((concept) =>
    connectedIds.has(concept.id)
  );
  if (connectedConcepts.length < 2 || selectedEdges.length === 0) return undefined;

  const nodeIdByConceptId = new Map(
    connectedConcepts.map((concept, index) => [concept.id, `stored-${index + 1}`]),
  );
  const nodes: GeneratedDiagramNode[] = connectedConcepts.map((concept, index) => ({
    id: nodeIdByConceptId.get(concept.id)!,
    label: boundedText(displayTitle(concept), 72),
    description: descriptionFor(concept),
    category: boundedText(formatConceptType(concept.type), 40),
    stage: stageFor(concept),
    order: numericOrder(concept, index),
    group: null,
    provenance: "stored",
    sourcePaths: [concept.id],
    supportConceptIds: [concept.id],
    synthesisRationale: null,
    synthesis: false,
  }));
  const edges: GeneratedDiagramEdge[] = selectedEdges.flatMap((edge) => {
    const source = nodeIdByConceptId.get(edge.sourceId);
    const target = nodeIdByConceptId.get(edge.targetId);
    return source && target
      ? [{
          source,
          target,
          label: boundedText(edge.label, 32),
          provenance: "stored",
          supportConceptIds: [edge.sourceId, edge.targetId],
        }]
      : [];
  });

  const candidate: GeneratedDiagram = {
    title: "Grounded source map",
    explanation:
      "A deterministic view of connected relationships stored in the retrieved native OKF sources.",
    nodes,
    edges,
  };
  const grounding = await buildNativeOkfDiagramGrounding(retrieval);
  const validation = validateGeneratedDiagram(
    candidate,
    grounding,
    { mode: "stored" },
  );
  return validation.ok ? validation.diagram : undefined;
}

