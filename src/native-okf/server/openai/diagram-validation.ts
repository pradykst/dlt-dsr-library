import "server-only";

import type {
  GeneratedDiagram,
  GeneratedDiagramEdge,
  GeneratedDiagramNode,
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
  "category",
  "sourcePaths",
  "synthesis",
]);
const EDGE_KEYS = new Set(["source", "target", "label"]);

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
  const category = readBoundedString(
    value.category,
    `${path}.category`,
    DIAGRAM_LIMITS.maxCategoryCharacters,
    errors,
  );
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

  if (!id || !label || !category || synthesis === undefined) return undefined;
  return { id, label, category, sourcePaths, synthesis };
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
  const label = readBoundedString(
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
  if (!source || !target || !label) return undefined;
  return { source, target, label };
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

  if (errors.length > 0 || !title || !explanation) {
    return { ok: false, errors, warnings };
  }

  return {
    ok: true,
    diagram: { title, explanation, nodes, edges },
    warnings,
  };
}
