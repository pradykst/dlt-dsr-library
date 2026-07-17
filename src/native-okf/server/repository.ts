import "server-only";

import { posix } from "node:path";

import { getOkfBundle } from "./cache.ts";
import type {
  OkfConcept,
  OkfLink,
  OkfSubgraph,
  OkfSubgraphOptions,
} from "./types.ts";

export const MAX_SUBGRAPH_DEPTH = 5;
export const MAX_SUBGRAPH_NODES = 500;

const DEFAULT_SUBGRAPH_DEPTH = 1;
const DEFAULT_SUBGRAPH_MAX_NODES = 100;

function compareStrings(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function normalizeLookup(pathOrId: string): string {
  if (typeof pathOrId !== "string" || pathOrId.trim() === "") {
    throw new TypeError("A non-empty bundle-relative concept path or ID is required.");
  }

  let candidate = pathOrId.trim();
  if (candidate.includes("\0")) {
    throw new RangeError("Concept paths may not contain null bytes.");
  }

  try {
    candidate = decodeURIComponent(candidate);
  } catch {
    throw new RangeError("Concept paths must use valid URL encoding.");
  }

  candidate = candidate.replaceAll("\\", "/");

  if (/^[a-z][a-z\d+.-]*:/i.test(candidate) || candidate.startsWith("//")) {
    throw new RangeError("Concept lookups must be bundle-relative paths or IDs.");
  }

  const pathOnly = candidate.split(/[?#]/u, 1)[0] ?? "";
  const withoutBundleSlash = pathOnly.startsWith("/") ? pathOnly.slice(1) : pathOnly;
  const segments = withoutBundleSlash.split("/");

  if (segments.includes("..")) {
    throw new RangeError("Concept path traversal is not allowed.");
  }

  let normalized = posix.normalize(withoutBundleSlash);
  while (normalized.startsWith("./")) normalized = normalized.slice(2);

  if (
    normalized === "" ||
    normalized === "." ||
    normalized === ".." ||
    normalized.startsWith("../") ||
    posix.isAbsolute(normalized)
  ) {
    throw new RangeError("Concept path traversal is not allowed.");
  }

  if (normalized.toLowerCase().endsWith(".md")) {
    normalized = normalized.slice(0, -3);
  }

  return normalized;
}

function boundedInteger(
  value: number | undefined,
  fallback: number,
  maximum: number,
  name: string,
): number {
  if (value === undefined) return fallback;
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a finite, non-negative number.`);
  }

  return Math.min(Math.floor(value), maximum);
}

export async function getAllConcepts(): Promise<OkfConcept[]> {
  const bundle = await getOkfBundle();
  return [...bundle.concepts];
}

export async function getAllPapers(): Promise<OkfConcept[]> {
  return getConceptsByType("paper");
}

export async function getConceptByPath(pathOrId: string): Promise<OkfConcept | undefined> {
  const conceptId = normalizeLookup(pathOrId);
  const bundle = await getOkfBundle();
  return bundle.conceptsById.get(conceptId);
}

export async function getPaperByPath(pathOrId: string): Promise<OkfConcept | undefined> {
  const conceptId = normalizeLookup(pathOrId);
  const bundle = await getOkfBundle();
  const direct = bundle.conceptsById.get(conceptId);

  if (direct?.type === "paper") return direct;
  if (conceptId.includes("/")) return undefined;

  const suffix = `/${conceptId}`;
  const matches = (bundle.conceptsByType.get("paper") ?? []).filter((paper) =>
    paper.id.endsWith(suffix),
  );
  return matches.length === 1 ? matches[0] : undefined;
}

export async function getConceptsByType(type: string): Promise<OkfConcept[]> {
  if (typeof type !== "string" || type === "") {
    throw new TypeError("A non-empty concept type is required.");
  }

  const bundle = await getOkfBundle();
  return [...(bundle.conceptsByType.get(type) ?? [])];
}

export async function getOutgoingLinks(pathOrId: string): Promise<OkfLink[]> {
  const conceptId = normalizeLookup(pathOrId);
  const bundle = await getOkfBundle();
  return [...(bundle.outgoing.get(conceptId) ?? [])];
}

export async function getIncomingLinks(pathOrId: string): Promise<OkfLink[]> {
  const conceptId = normalizeLookup(pathOrId);
  const bundle = await getOkfBundle();
  return [...(bundle.incoming.get(conceptId) ?? [])];
}

export async function getLinkedConcepts(pathOrId: string): Promise<OkfConcept[]> {
  const conceptId = normalizeLookup(pathOrId);
  const bundle = await getOkfBundle();
  const linkedIds = new Set<string>();

  for (const link of bundle.outgoing.get(conceptId) ?? []) {
    if (link.targetId) linkedIds.add(link.targetId);
  }
  for (const link of bundle.incoming.get(conceptId) ?? []) {
    linkedIds.add(link.sourceId);
  }

  return [...linkedIds]
    .sort(compareStrings)
    .flatMap((id) => {
      const concept = bundle.conceptsById.get(id);
      return concept ? [concept] : [];
    });
}

export async function getSubgraph(
  seedIds: Iterable<string>,
  options: OkfSubgraphOptions = {},
): Promise<OkfSubgraph> {
  const depth = boundedInteger(
    options.depth,
    DEFAULT_SUBGRAPH_DEPTH,
    MAX_SUBGRAPH_DEPTH,
    "Subgraph depth",
  );
  const maxNodes = boundedInteger(
    options.maxNodes,
    DEFAULT_SUBGRAPH_MAX_NODES,
    MAX_SUBGRAPH_NODES,
    "Subgraph maxNodes",
  );
  const includeIncoming = options.includeIncoming ?? true;
  const includeOutgoing = options.includeOutgoing ?? true;
  const bundle = await getOkfBundle();

  const normalizedSeeds = [...new Set([...seedIds].map(normalizeLookup))].sort(compareStrings);
  const selectedIds = new Set<string>();
  const queue: Array<{ id: string; distance: number }> = [];
  let truncated = false;

  for (const id of normalizedSeeds) {
    if (!bundle.conceptsById.has(id) || selectedIds.has(id)) continue;
    if (selectedIds.size >= maxNodes) {
      truncated = true;
      break;
    }

    selectedIds.add(id);
    queue.push({ id, distance: 0 });
  }

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor];
    if (!current || current.distance >= depth) continue;

    const neighborIds = new Set<string>();
    if (includeOutgoing) {
      for (const link of bundle.outgoing.get(current.id) ?? []) {
        if (link.targetId) neighborIds.add(link.targetId);
      }
    }
    if (includeIncoming) {
      for (const link of bundle.incoming.get(current.id) ?? []) {
        neighborIds.add(link.sourceId);
      }
    }

    for (const neighborId of [...neighborIds].sort(compareStrings)) {
      if (selectedIds.has(neighborId) || !bundle.conceptsById.has(neighborId)) continue;
      if (selectedIds.size >= maxNodes) {
        truncated = true;
        continue;
      }

      selectedIds.add(neighborId);
      queue.push({ id: neighborId, distance: current.distance + 1 });
    }
  }

  const concepts = bundle.concepts.filter((concept) => selectedIds.has(concept.id));
  const links = concepts
    .flatMap((concept) => bundle.outgoing.get(concept.id) ?? [])
    .filter((link) => Boolean(link.targetId && selectedIds.has(link.targetId)))
    .sort(
      (left, right) =>
        compareStrings(left.sourceId, right.sourceId) ||
        compareStrings(left.targetId ?? "", right.targetId ?? "") ||
        compareStrings(left.rawTarget, right.rawTarget) ||
        compareStrings(left.label, right.label),
    );

  return { concepts, links, truncated };
}
