import "server-only";

import {
  GENERATED_DIAGRAM_STAGES,
  type DiagramStage,
  type GeneratedDiagram,
  type GeneratedDiagramEdge,
  type GeneratedDiagramNode,
} from "../../shared/chat-types.ts";
import { DIAGRAM_LIMITS } from "./diagram-schema.ts";

export interface ValidDiagramResult {
  ok: true;
  diagram: GeneratedDiagram;
  warnings: string[];
}

export interface InvalidDiagramResult {
  ok: false;
  errors: string[];
  warnings: string[];
}

export type DiagramValidationResult =
  | ValidDiagramResult
  | InvalidDiagramResult;

const DIAGRAM_KEYS = new Set(["title", "explanation", "nodes", "edges"]);
const NODE_KEYS = new Set([
  "id",
  "label",
  "description",
  "category",
  "stage",
  "order",
  "group",
  "sourcePaths",
  "synthesis",
]);
const EDGE_KEYS = new Set(["source", "target", "label"]);
const DIAGRAM_STAGE_SET: ReadonlySet<string> = new Set(GENERATED_DIAGRAM_STAGES);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rejectUnknownKeys(
  value: Record<string, unknown>,
  allowedKeys: ReadonlySet<string>,
  path: string,
  errors: string[],
): void {
  for (const key of Object.keys(value)) {
    if (!allowedKeys.has(key)) errors.push(`${path}.${key} is not allowed.`);
  }
}

function readBoundedString(
  value: unknown,
  path: string,
  maximum: number,
  errors: string[],
): string | undefined {
  if (typeof value !== "string") {
    errors.push(`${path} must be a string.`);
    return undefined;
  }

  const normalized = value.trim();
  if (normalized.length === 0) {
    errors.push(`${path} must not be empty.`);
    return undefined;
  }
  if (normalized.length > maximum) {
    errors.push(`${path} must not exceed ${maximum} characters.`);
    return undefined;
  }
  return normalized;
}

function readPossiblyEmptyBoundedString(
  value: unknown,
  path: string,
  maximum: number,
  errors: string[],
): string | undefined {
  if (typeof value !== "string") {
    errors.push(`${path} must be a string.`);
    return undefined;
  }
  const normalized = value.trim();
  if (normalized.length > maximum) {
    errors.push(`${path} must not exceed ${maximum} characters.`);
    return undefined;
  }
  return normalized;
}

function validateStage(
  value: unknown,
  path: string,
  errors: string[],
): DiagramStage | undefined {
  if (typeof value !== "string" || !DIAGRAM_STAGE_SET.has(value)) {
    errors.push(
      `${path} must be one of: ${GENERATED_DIAGRAM_STAGES.join(", ")}.`,
    );
    return undefined;
  }
  return value as DiagramStage;
}

function validateOrder(
  value: unknown,
  path: string,
  errors: string[],
): number | undefined {
  if (
    !Number.isInteger(value) ||
    (value as number) < DIAGRAM_LIMITS.minOrder ||
    (value as number) > DIAGRAM_LIMITS.maxOrder
  ) {
    errors.push(
      `${path} must be an integer from ${DIAGRAM_LIMITS.minOrder} to ${DIAGRAM_LIMITS.maxOrder}.`,
    );
    return undefined;
  }
  return value as number;
}

function validateGroup(
  value: unknown,
  path: string,
  errors: string[],
): string | null | undefined {
  if (value === null) return null;
  return readBoundedString(
    value,
    path,
    DIAGRAM_LIMITS.maxGroupCharacters,
    errors,
  );
}

function validateSourcePaths(
  value: unknown,
  nodeIndex: number,
  synthesis: boolean | undefined,
  allowlist: ReadonlySet<string>,
  errors: string[],
): string[] {
  const path = `nodes[${nodeIndex}].sourcePaths`;
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array.`);
    return [];
  }
  if (value.length === 0) {
    errors.push(
      synthesis
        ? `${path} must ground a synthesis node in at least one retrieved concept.`
        : `${path} must ground a stored-knowledge node in at least one retrieved concept.`,
    );
  }
  if (value.length > DIAGRAM_LIMITS.maxSourcePathsPerNode) {
    errors.push(
      `${path} must contain at most ${DIAGRAM_LIMITS.maxSourcePathsPerNode} entries.`,
    );
  }

  const sourcePaths: string[] = [];
  const seen = new Set<string>();
  for (let index = 0; index < value.length; index += 1) {
    const sourcePath = readBoundedString(
      value[index],
      `${path}[${index}]`,
      DIAGRAM_LIMITS.maxSourcePathCharacters,
      errors,
    );
    if (!sourcePath) continue;
    if (!allowlist.has(sourcePath)) {
      errors.push(
        `${path}[${index}] is not in the retrieved concept allowlist.`,
      );
      continue;
    }
    if (!seen.has(sourcePath)) {
      seen.add(sourcePath);
      sourcePaths.push(sourcePath);
    }
  }
  return sourcePaths;
}

function validateNode(
  value: unknown,
  index: number,
  allowlist: ReadonlySet<string>,
  errors: string[],
): GeneratedDiagramNode | undefined {
  const path = `nodes[${index}]`;
  if (!isRecord(value)) {
    errors.push(`${path} must be an object.`);
    return undefined;
  }
  rejectUnknownKeys(value, NODE_KEYS, path, errors);

  const id = readBoundedString(
    value.id,
    `${path}.id`,
    DIAGRAM_LIMITS.maxNodeIdCharacters,
    errors,
  );
  const label = readBoundedString(
    value.label,
    `${path}.label`,
    DIAGRAM_LIMITS.maxNodeLabelCharacters,
    errors,
  );
  const description = readBoundedString(
    value.description,
    `${path}.description`,
    DIAGRAM_LIMITS.maxNodeDescriptionCharacters,
    errors,
  );

  const category = readBoundedString(
    value.category,
    `${path}.category`,
    DIAGRAM_LIMITS.maxCategoryCharacters,
    errors,
  );
  const stage = validateStage(value.stage, `${path}.stage`, errors);
  const order = validateOrder(value.order, `${path}.order`, errors);
  const group = validateGroup(value.group, `${path}.group`, errors);

  const synthesis =
    typeof value.synthesis === "boolean" ? value.synthesis : undefined;
  if (synthesis === undefined) {
    errors.push(`${path}.synthesis must be a boolean.`);
  }
  const sourcePaths = validateSourcePaths(
    value.sourcePaths,
    index,
    synthesis,
    allowlist,
    errors,
  );

  if (
    !id ||
    !label ||
    !description ||
    !category ||
    !stage ||
    order === undefined ||
    group === undefined ||
    synthesis === undefined
  ) {
    return undefined;
  }
  return {
    id,
    label,
    description,
    category,
    stage,
    order,
    group,
    sourcePaths,
    synthesis,
  };
}

function validateEdge(
  value: unknown,
  index: number,
  nodeIds: ReadonlySet<string>,
  errors: string[],
): GeneratedDiagramEdge | undefined {
  const path = `edges[${index}]`;
  if (!isRecord(value)) {
    errors.push(`${path} must be an object.`);
    return undefined;
  }
  rejectUnknownKeys(value, EDGE_KEYS, path, errors);

  const source = readBoundedString(
    value.source,
    `${path}.source`,
    DIAGRAM_LIMITS.maxNodeIdCharacters,
    errors,
  );
  const target = readBoundedString(
    value.target,
    `${path}.target`,
    DIAGRAM_LIMITS.maxNodeIdCharacters,
    errors,
  );
  const label = readPossiblyEmptyBoundedString(
    value.label,
    `${path}.label`,
    DIAGRAM_LIMITS.maxEdgeLabelCharacters,
    errors,
  );
  if (source && !nodeIds.has(source)) {
    errors.push(`${path}.source does not identify an existing node.`);
  }
  if (target && !nodeIds.has(target)) {
    errors.push(`${path}.target does not identify an existing node.`);
  }
  if (source && target && source === target) {
    errors.push(`${path} must not connect a node to itself.`);
  }
  if (!source || !target || label === undefined) return undefined;
  return { source, target, label };
}

function stemSemanticToken(token: string): string {
  if (token.length >= 9 && token.endsWith("ication")) return token.slice(0, -7);
  if (token.length >= 8 && token.endsWith("ation")) return token.slice(0, -5);
  if (token.length >= 7 && token.endsWith("ment")) return token.slice(0, -4);
  if (token.length >= 6 && token.endsWith("ing")) return token.slice(0, -3);
  if (token.length >= 6 && token.endsWith("ate")) return token.slice(0, -3);
  if (token.length >= 5 && token.endsWith("ed")) return token.slice(0, -2);
  if (token.length >= 5 && token.endsWith("y")) return token.slice(0, -1);
  return token;
}

function semanticLabelTokens(value: string): string[] {
  return [
    ...new Set(
      value
        .normalize("NFKC")
        .toLocaleLowerCase("en")
        .match(/[\p{L}\p{N}]+/gu)
        ?.map(stemSemanticToken) ?? [],
    ),
  ].sort((left, right) => left.localeCompare(right, "en"));
}

function semanticLabelsOverlap(
  left: readonly string[],
  right: readonly string[],
): boolean {
  if (left.join(" ") === right.join(" ")) return true;
  const rightTokens = new Set(right);
  const intersection = left.filter((token) => rightTokens.has(token)).length;
  return (
    intersection >= 2 &&
    (2 * intersection) / (left.length + right.length) >= 0.8
  );
}

function validateCompactStructure(
  nodes: readonly GeneratedDiagramNode[],
  edges: readonly GeneratedDiagramEdge[],
  errors: string[],
): void {
  const semanticLabels: Array<{ nodeId: string; tokens: string[] }> = [];
  for (let index = 0; index < nodes.length; index += 1) {
    const node = nodes[index]!;
    const tokens = semanticLabelTokens(node.label);
    const previous = semanticLabels.find((candidate) =>
      semanticLabelsOverlap(tokens, candidate.tokens),
    );
    if (previous) {
      errors.push(
        `nodes[${index}].label near-duplicates the semantic label of node ${JSON.stringify(previous.nodeId)}.`,
      );
    }
    semanticLabels.push({ nodeId: node.id, tokens });
  }

  const groups = new Set(
    nodes
      .map((node) => node.group)
      .filter((group): group is string => group !== null),
  );
  if (groups.size > DIAGRAM_LIMITS.maxParallelBranches) {
    errors.push(
      `nodes use ${groups.size} groups; consolidate them into at most ${DIAGRAM_LIMITS.maxParallelBranches} major branches.`,
    );
  }

  if (nodes.length <= 1) return;

  const nodeIds = [...new Set(nodes.map((node) => node.id))].sort((left, right) =>
    left.localeCompare(right, "en"),
  );
  const degreeByNode = new Map(nodeIds.map((nodeId) => [nodeId, 0]));
  const adjacencyByNode = new Map(
    nodeIds.map((nodeId) => [nodeId, new Set<string>()]),
  );
  const targetsBySource = new Map<string, Set<string>>();

  for (const edge of edges) {
    if (!degreeByNode.has(edge.source) || !degreeByNode.has(edge.target)) {
      continue;
    }
    degreeByNode.set(edge.source, (degreeByNode.get(edge.source) ?? 0) + 1);
    degreeByNode.set(edge.target, (degreeByNode.get(edge.target) ?? 0) + 1);
    adjacencyByNode.get(edge.source)?.add(edge.target);
    adjacencyByNode.get(edge.target)?.add(edge.source);

    const targets = targetsBySource.get(edge.source) ?? new Set<string>();
    targets.add(edge.target);
    targetsBySource.set(edge.source, targets);
  }

  for (const [nodeId, degree] of degreeByNode) {
    if (degree === 0) {
      errors.push(
        `Node ${JSON.stringify(nodeId)} is isolated; connect it or consolidate it into a decision-relevant node.`,
      );
    }
  }

  const startNodeId = nodeIds[0]!;
  const visited = new Set([startNodeId]);
  const queue = [startNodeId];
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const nodeId = queue[cursor]!;
    const neighbors = [...(adjacencyByNode.get(nodeId) ?? [])].sort(
      (left, right) => left.localeCompare(right, "en"),
    );
    for (const neighbor of neighbors) {
      if (visited.has(neighbor)) continue;
      visited.add(neighbor);
      queue.push(neighbor);
    }
  }
  const disconnectedNodeIds = nodeIds.filter((nodeId) => !visited.has(nodeId));
  if (disconnectedNodeIds.length > 0) {
    errors.push(
      `Diagram contains disconnected flow components; connect these nodes to the main flow: ${disconnectedNodeIds
        .map((nodeId) => JSON.stringify(nodeId))
        .join(", ")}.`,
    );
  }

  for (const [nodeId, targets] of targetsBySource) {
    if (targets.size > DIAGRAM_LIMITS.maxParallelBranches) {
      errors.push(
        `Node ${JSON.stringify(nodeId)} creates ${targets.size} parallel branches; consolidate them into at most ${DIAGRAM_LIMITS.maxParallelBranches}.`,
      );
    }
  }
}

export function validateGeneratedDiagram(
  value: unknown,
  allowedSourcePaths: ReadonlySet<string> | readonly string[],
): DiagramValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const allowlist =
    allowedSourcePaths instanceof Set
      ? allowedSourcePaths
      : new Set(allowedSourcePaths);

  if (!isRecord(value)) {
    return {
      ok: false,
      errors: ["The generated diagram must be an object."],
      warnings,
    };
  }
  rejectUnknownKeys(value, DIAGRAM_KEYS, "diagram", errors);

  const title = readBoundedString(
    value.title,
    "title",
    DIAGRAM_LIMITS.maxTitleCharacters,
    errors,
  );
  const explanation = readBoundedString(
    value.explanation,
    "explanation",
    DIAGRAM_LIMITS.maxExplanationCharacters,
    errors,
  );

  const rawNodes = value.nodes;
  const nodes: GeneratedDiagramNode[] = [];
  if (!Array.isArray(rawNodes)) {
    errors.push("nodes must be an array.");
  } else {
    if (rawNodes.length === 0) errors.push("nodes must not be empty.");
    if (rawNodes.length > DIAGRAM_LIMITS.maxNodes) {
      errors.push(`nodes must contain at most ${DIAGRAM_LIMITS.maxNodes} entries.`);
    }
    for (let index = 0; index < rawNodes.length; index += 1) {
      const node = validateNode(rawNodes[index], index, allowlist, errors);
      if (node) nodes.push(node);
    }
  }

  const nodeIds = new Set<string>();
  for (let index = 0; index < nodes.length; index += 1) {
    const nodeId = nodes[index]?.id;
    if (!nodeId) continue;
    if (nodeIds.has(nodeId)) {
      errors.push(`nodes[${index}].id duplicates the node ID ${JSON.stringify(nodeId)}.`);
    }
    nodeIds.add(nodeId);
  }

  const rawEdges = value.edges;
  const edges: GeneratedDiagramEdge[] = [];
  if (!Array.isArray(rawEdges)) {
    errors.push("edges must be an array.");
  } else {
    if (rawEdges.length > DIAGRAM_LIMITS.maxEdges) {
      errors.push(`edges must contain at most ${DIAGRAM_LIMITS.maxEdges} entries.`);
    }
    const seenEdges = new Set<string>();
    for (let index = 0; index < rawEdges.length; index += 1) {
      const edge = validateEdge(rawEdges[index], index, nodeIds, errors);
      if (!edge) continue;
      const edgeKey = JSON.stringify([edge.source, edge.target, edge.label]);
      if (seenEdges.has(edgeKey)) {
        warnings.push(`Removed duplicate edge at edges[${index}].`);
        continue;
      }
      seenEdges.add(edgeKey);
      edges.push(edge);
    }
  }
  validateCompactStructure(nodes, edges, errors);

  if (errors.length > 0 || !title || !explanation) {
    return { ok: false, errors, warnings };
  }

  return {
    ok: true,
    diagram: { title, explanation, nodes, edges },
    warnings,
  };
}
