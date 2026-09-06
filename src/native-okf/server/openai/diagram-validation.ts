import "server-only";

import {
  DIAGRAM_EDGE_PROVENANCE,
  DIAGRAM_NODE_PROVENANCE,
  GENERATED_DIAGRAM_STAGES,
  SYNTHESIS_DIAGRAM_STAGES,
  SYNTHESIS_RELATIONSHIP_TYPES,
  synthesisPrimaryLayer,
  type DiagramEdgeProvenance,
  type DiagramNodeProvenance,
  type DiagramStage,
  type GeneratedDiagram,
  type GeneratedDiagramEdge,
  type GeneratedDiagramNode,
} from "../../shared/chat-types.ts";
import type { NativeOkfDiagramGrounding } from "./diagram-grounding.ts";
import { DIAGRAM_LIMITS } from "./diagram-schema.ts";
import { synthesisGrammarDiagnostics } from "./synthesis-grammar.ts";

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

export interface DiagramValidationOptions {
  mode?: "stored" | "synthesized";
  /**
   * The researcher asked for a complete proposed solution / diagram. Enforces
   * the mandatory core coverage Problem -> Requirement -> Design Principle ->
   * Design Feature -> Artifact. Evaluation and Outcome are never part of this
   * check. Kept as `requireRpfPath` for call-site compatibility.
   */
  requireRpfPath?: boolean;
  /** @deprecated No longer read. Stored evidence is never proposal topology. */
  requireDisplayedStoredSupport?: boolean;
}

const DIAGRAM_KEYS = new Set(["title", "explanation", "nodes", "edges"]);
const NODE_KEYS = new Set([
  "id",
  "label",
  "description",
  "category",
  "stage",
  "order",
  "group",
  "provenance",
  "sourcePaths",
  "supportConceptIds",
  "synthesisRationale",
  "synthesis",
]);
const LEGACY_NODE_KEYS = new Set([
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
const EDGE_KEYS = new Set([
  "source",
  "target",
  "label",
  "provenance",
  "supportConceptIds",
]);
const LEGACY_EDGE_KEYS = new Set(["source", "target", "label"]);
const STAGES = new Set<string>(GENERATED_DIAGRAM_STAGES);
const SYNTHESIS_STAGES = new Set<string>(SYNTHESIS_DIAGRAM_STAGES);
const SYNTHESIS_RELATIONSHIPS = new Set<string>(SYNTHESIS_RELATIONSHIP_TYPES);
const NODE_PROVENANCE = new Set<string>(DIAGRAM_NODE_PROVENANCE);
const EDGE_PROVENANCE = new Set<string>(DIAGRAM_EDGE_PROVENANCE);

interface ValidationContext {
  grounding: NativeOkfDiagramGrounding;
  strictProvenance: boolean;
  options: DiagramValidationOptions;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rejectUnknownKeys(
  value: Record<string, unknown>,
  keys: ReadonlySet<string>,
  path: string,
  errors: string[],
): void {
  for (const key of Object.keys(value)) {
    if (!keys.has(key)) {
      errors.push(path + " contains an unsupported field.");
    }
  }
}

function bounded(
  value: unknown,
  path: string,
  maximum: number,
  errors: string[],
  allowEmpty = false,
): string | undefined {
  if (typeof value !== "string") {
    errors.push(path + " must be a string.");
    return undefined;
  }
  const normalized = value.trim();
  if ((!allowEmpty && normalized === "") || normalized.length > maximum) {
    errors.push(
      path + (normalized === ""
        ? " must not be empty."
        : " must not exceed " + maximum + " characters."),
    );
    return undefined;
  }
  return normalized;
}

function nullableBounded(
  value: unknown,
  path: string,
  maximum: number,
  errors: string[],
): string | null | undefined {
  if (value === null) return null;
  return bounded(value, path, maximum, errors);
}

function stringIds(
  value: unknown,
  path: string,
  maximumItems: number,
  maximumCharacters: number,
  errors: string[],
): string[] {
  if (!Array.isArray(value)) {
    errors.push(path + " must be an array.");
    return [];
  }
  if (value.length > maximumItems) {
    errors.push(path + " must contain at most " + maximumItems + " entries.");
  }
  const result: string[] = [];
  const seen = new Set<string>();
  for (let index = 0; index < value.length; index += 1) {
    const item = bounded(
      value[index],
      path + "[" + index + "]",
      maximumCharacters,
      errors,
    );
    if (item && !seen.has(item)) {
      seen.add(item);
      result.push(item);
    }
  }
  return result;
}

function normalizeLabel(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/gu, " ");
}

function faithfulStoredLabel(label: string, storedTitle: string): boolean {
  const normalizedLabel = normalizeLabel(label);
  const normalizedTitle = normalizeLabel(storedTitle);
  if (
    normalizedLabel === normalizedTitle ||
    normalizedTitle.includes(normalizedLabel)
  ) {
    return true;
  }
  const titleTerms = new Set(normalizedTitle.split(" "));
  const labelTerms = normalizedLabel.split(" ").filter(Boolean);
  return labelTerms.length > 0 &&
    labelTerms.every((term) => titleTerms.has(term));
}

function sameIds(left: readonly string[], right: readonly string[]): boolean {
  return [...left].sort().join("\0") === [...right].sort().join("\0");
}

function legacyGrounding(
  allowed: ReadonlySet<string> | readonly string[],
): NativeOkfDiagramGrounding {
  const ids = allowed instanceof Set ? allowed : new Set(allowed);
  return {
    allowedConceptIds: ids,
    eligibleStoredConceptIds: ids,
    conceptsById: new Map(),
    storedRelations: [],
  };
}

function validationContext(
  value: NativeOkfDiagramGrounding | ReadonlySet<string> | readonly string[],
  options: DiagramValidationOptions,
): ValidationContext {
  const strictProvenance = !(
    value instanceof Set ||
    Array.isArray(value)
  );
  return {
    grounding: strictProvenance
      ? value as NativeOkfDiagramGrounding
      : legacyGrounding(value as ReadonlySet<string> | readonly string[]),
    strictProvenance,
    options,
  };
}

function stageValue(
  value: unknown,
  path: string,
  errors: string[],
): DiagramStage | undefined {
  if (typeof value !== "string" || !STAGES.has(value)) {
    errors.push(
      path + " must be one of: " + GENERATED_DIAGRAM_STAGES.join(", ") + ".",
    );
    return undefined;
  }
  return value as DiagramStage;
}

function nodeProvenance(
  value: Record<string, unknown>,
  path: string,
  context: ValidationContext,
  errors: string[],
): DiagramNodeProvenance | undefined {
  if (!context.strictProvenance && value.provenance === undefined) {
    return value.synthesis === true ? "synthesized" : "stored";
  }
  if (
    typeof value.provenance !== "string" ||
    !NODE_PROVENANCE.has(value.provenance)
  ) {
    errors.push(path + ".provenance is invalid.");
    return undefined;
  }
  return value.provenance as DiagramNodeProvenance;
}

function validateNode(
  value: unknown,
  index: number,
  context: ValidationContext,
  errors: string[],
): GeneratedDiagramNode | undefined {
  const path = "nodes[" + index + "]";
  if (!isRecord(value)) {
    errors.push(path + " must be an object.");
    return undefined;
  }
  rejectUnknownKeys(
    value,
    context.strictProvenance ? NODE_KEYS : new Set([...NODE_KEYS, ...LEGACY_NODE_KEYS]),
    path,
    errors,
  );
  const id = bounded(
    value.id,
    path + ".id",
    DIAGRAM_LIMITS.maxNodeIdCharacters,
    errors,
  );
  const label = bounded(
    value.label,
    path + ".label",
    DIAGRAM_LIMITS.maxNodeLabelCharacters,
    errors,
  );
  const description = bounded(
    value.description,
    path + ".description",
    DIAGRAM_LIMITS.maxNodeDescriptionCharacters,
    errors,
  );
  const category = bounded(
    value.category,
    path + ".category",
    DIAGRAM_LIMITS.maxCategoryCharacters,
    errors,
  );
  const stage = stageValue(value.stage, path + ".stage", errors);
  if (
    stage &&
    context.options.mode === "synthesized" &&
    !SYNTHESIS_STAGES.has(stage)
  ) {
    errors.push(path + ".stage is not part of the proposal stage ontology.");
  }
  const order = value.order;
  if (
    !Number.isInteger(order) ||
    (order as number) < DIAGRAM_LIMITS.minOrder ||
    (order as number) > DIAGRAM_LIMITS.maxOrder
  ) {
    errors.push(path + ".order must be an integer from 0 to 100.");
  }
  const group = nullableBounded(
    value.group,
    path + ".group",
    DIAGRAM_LIMITS.maxGroupCharacters,
    errors,
  );
  const provenance = nodeProvenance(value, path, context, errors);
  const sourcePaths = stringIds(
    value.sourcePaths,
    path + ".sourcePaths",
    context.strictProvenance
      ? DIAGRAM_LIMITS.maxSourcePathsPerNode
      : 20,
    DIAGRAM_LIMITS.maxSourcePathCharacters,
    errors,
  );
  const supportConceptIds = context.strictProvenance
    ? stringIds(
        value.supportConceptIds,
        path + ".supportConceptIds",
        DIAGRAM_LIMITS.maxSupportConceptIds,
        DIAGRAM_LIMITS.maxSourcePathCharacters,
        errors,
      )
    : [...sourcePaths].slice(0, DIAGRAM_LIMITS.maxSupportConceptIds);
  const rationale = context.strictProvenance
    ? nullableBounded(
        value.synthesisRationale,
        path + ".synthesisRationale",
        DIAGRAM_LIMITS.maxSynthesisRationaleCharacters,
        errors,
      )
    : null;
  const synthesis = value.synthesis;
  if (
    typeof synthesis !== "boolean" ||
    (provenance && synthesis !== (provenance === "synthesized"))
  ) {
    errors.push(path + ".synthesis must agree with provenance.");
  }

  for (const sourcePath of sourcePaths) {
    if (!context.grounding.allowedConceptIds.has(sourcePath)) {
      errors.push(path + ".sourcePaths contains a non-allowlisted concept.");
    }
  }
  for (const supportId of supportConceptIds) {
    if (!context.grounding.eligibleStoredConceptIds.has(supportId)) {
      errors.push(path + ".supportConceptIds contains unsupported concept " + JSON.stringify(supportId) + ".");
    }
  }

  if (provenance === "user-provided") {
    if (sourcePaths.length > 0 || supportConceptIds.length > 0) {
      errors.push(path + " is user-provided and must not claim native sources.");
    }
    if (
      stage &&
      !["problem", "design-goal", "design-objective"].includes(stage)
    ) {
      errors.push(path + " is user-provided and must occupy an initial problem or goal stage.");
    }
  } else if (provenance === "stored") {
    if (
      sourcePaths.length !== 1 ||
      supportConceptIds.length !== 1 ||
      sourcePaths[0] !== supportConceptIds[0]
    ) {
      errors.push(path + " must identify exactly one matching stored concept.");
    } else if (
      context.strictProvenance &&
      !context.grounding.eligibleStoredConceptIds.has(sourcePaths[0]!)
    ) {
      errors.push(path + " does not identify an eligible retrieved stored concept.");
    } else if (context.strictProvenance) {
      const concept = context.grounding.conceptsById.get(sourcePaths[0]!);
      if (!concept || (label && !faithfulStoredLabel(label, concept.title))) {
        errors.push(path + ".label does not faithfully identify its stored concept.");
      }
      if (concept && stage !== concept.stage) {
        errors.push(path + ".stage does not match the stored concept type.");
      }
    }
  } else if (provenance === "synthesized") {
    if (
      context.strictProvenance &&
      (
        supportConceptIds.length === 0 ||
        !sameIds(sourcePaths, supportConceptIds)
      )
    ) {
      errors.push(path + " must use one to three matching allowlisted support IDs and source paths.");
    } else if (!context.strictProvenance && sourcePaths.length === 0) {
      errors.push(path + " must be grounded in at least one retrieved concept.");
    }
    if (label && context.strictProvenance) {
      // A proposed node may adopt a stored concept's exact wording only as an
      // honest adaptation, i.e. when it cites that concept as evidence. Matching
      // an uncited stored concept's title is a provenance error.
      for (const concept of context.grounding.conceptsById.values()) {
        if (
          normalizeLabel(label) === normalizeLabel(concept.title) &&
          !supportConceptIds.includes(concept.conceptId)
        ) {
          errors.push(
            path + " reproduces an uncited stored concept's exact title.",
          );
          break;
        }
      }
    }
  }

  if (
    !id ||
    !label ||
    !description ||
    !category ||
    !stage ||
    !Number.isInteger(order) ||
    group === undefined ||
    !provenance ||
    rationale === undefined ||
    typeof synthesis !== "boolean"
  ) {
    return undefined;
  }
  return {
    id,
    label,
    description,
    category,
    stage,
    order: order as number,
    group,
    provenance,
    sourcePaths,
    supportConceptIds,
    synthesisRationale: rationale,
    synthesis,
  };
}

function edgeProvenance(
  value: Record<string, unknown>,
  sourceNode: GeneratedDiagramNode | undefined,
  targetNode: GeneratedDiagramNode | undefined,
  context: ValidationContext,
  path: string,
  errors: string[],
): DiagramEdgeProvenance | undefined {
  if (!context.strictProvenance && value.provenance === undefined) {
    return sourceNode?.provenance === "stored" &&
        targetNode?.provenance === "stored"
      ? "stored"
      : "synthesized";
  }
  if (
    typeof value.provenance !== "string" ||
    !EDGE_PROVENANCE.has(value.provenance)
  ) {
    errors.push(path + ".provenance is invalid.");
    return undefined;
  }
  return value.provenance as DiagramEdgeProvenance;
}

function validateEdge(
  value: unknown,
  index: number,
  nodesById: ReadonlyMap<string, GeneratedDiagramNode>,
  context: ValidationContext,
  errors: string[],
): GeneratedDiagramEdge | undefined {
  const path = "edges[" + index + "]";
  if (!isRecord(value)) {
    errors.push(path + " must be an object.");
    return undefined;
  }
  rejectUnknownKeys(
    value,
    context.strictProvenance ? EDGE_KEYS : new Set([...EDGE_KEYS, ...LEGACY_EDGE_KEYS]),
    path,
    errors,
  );
  const source = bounded(
    value.source,
    path + ".source",
    DIAGRAM_LIMITS.maxNodeIdCharacters,
    errors,
  );
  const target = bounded(
    value.target,
    path + ".target",
    DIAGRAM_LIMITS.maxNodeIdCharacters,
    errors,
  );
  const label = bounded(
    value.label,
    path + ".label",
    DIAGRAM_LIMITS.maxEdgeLabelCharacters,
    errors,
    true,
  );
  const sourceNode = source ? nodesById.get(source) : undefined;
  const targetNode = target ? nodesById.get(target) : undefined;
  if (source && !sourceNode) {
    errors.push(path + ".source does not identify an existing node.");
  }
  if (target && !targetNode) {
    errors.push(path + ".target does not identify an existing node.");
  }
  if (source && target && source === target) {
    errors.push(path + " must not be a self-loop.");
  }
  const provenance = edgeProvenance(
    value,
    sourceNode,
    targetNode,
    context,
    path,
    errors,
  );
  if (
    context.options.mode === "synthesized" &&
    provenance === "synthesized" &&
    label !== undefined &&
    !SYNTHESIS_RELATIONSHIPS.has(label)
  ) {
    errors.push(path + ".label is not a supported synthesis relationship type.");
  }
  const legacySupport = [
    ...(sourceNode?.supportConceptIds ?? []),
    ...(targetNode?.supportConceptIds ?? []),
  ].filter((id, position, all) => all.indexOf(id) === position).slice(0, 3);
  const supportConceptIds = context.strictProvenance
    ? stringIds(
        value.supportConceptIds,
        path + ".supportConceptIds",
        DIAGRAM_LIMITS.maxSupportConceptIds,
        DIAGRAM_LIMITS.maxSourcePathCharacters,
        errors,
      )
    : legacySupport;
  for (const supportId of supportConceptIds) {
    if (!context.grounding.eligibleStoredConceptIds.has(supportId)) {
      errors.push(path + " has a non-allowlisted support concept.");
    }
  }
  if (provenance === "stored" && context.strictProvenance) {
    if (
      sourceNode?.provenance !== "stored" ||
      targetNode?.provenance !== "stored"
    ) {
      errors.push(path + " marks a relation stored without two stored endpoint nodes.");
    } else {
      const expectedSupport = [
        sourceNode.supportConceptIds[0]!,
        targetNode.supportConceptIds[0]!,
      ];
      if (!sameIds(supportConceptIds, expectedSupport)) {
        errors.push(path + " stored support IDs must agree with its endpoint concepts.");
      }
      const exists = context.grounding.storedRelations.some((relation) =>
        relation.sourceId === expectedSupport[0] &&
        relation.targetId === expectedSupport[1] &&
        normalizeLabel(relation.label) === normalizeLabel(label ?? "")
      );
      if (!exists) errors.push(path + " does not match an exact resolved native relation.");
    }
  }
  if (provenance === "synthesized" && supportConceptIds.length === 0) {
    errors.push(path + " synthesized relation requires allowlisted support.");
  }
  if (!source || !target || label === undefined || !provenance) return undefined;
  return { source, target, label, provenance, supportConceptIds };
}

function semanticStem(token: string): string {
  if (token.length >= 9 && token.endsWith("ification")) {
    return token.slice(0, -7) + "y";
  }
  if (token.length >= 8 && token.endsWith("ation")) return token.slice(0, -5);
  if (token.length >= 7 && token.endsWith("ment")) return token.slice(0, -4);
  if (token.length >= 6 && token.endsWith("ing")) return token.slice(0, -3);
  if (token.length >= 5 && token.endsWith("ed")) return token.slice(0, -2);
  return token;
}

function semanticTokens(value: string): string[] {
  return [
    ...new Set(
      normalizeLabel(value)
        .split(" ")
        .filter(Boolean)
        .map(semanticStem),
    ),
  ].sort((left, right) => left.localeCompare(right, "en"));
}

function semanticOverlap(
  left: readonly string[],
  right: readonly string[],
): boolean {
  if (left.join(" ") === right.join(" ")) return true;
  const rightSet = new Set(right);
  const intersection = left.filter((token) => rightSet.has(token)).length;
  return intersection >= 2 &&
    (2 * intersection) / (left.length + right.length) >= 0.8;
}

function validateGraph(
  nodes: readonly GeneratedDiagramNode[],
  edges: readonly GeneratedDiagramEdge[],
  context: ValidationContext,
  errors: string[],
  warnings: string[],
): void {
  const labels: Array<{ nodeId: string; tokens: string[] }> = [];
  for (const node of nodes) {
    const tokens = semanticTokens(node.label);
    const prior = labels.find((candidate) =>
      semanticOverlap(tokens, candidate.tokens)
    );
    if (prior) {
      errors.push(
        "Node " +
          JSON.stringify(node.id) +
          " near-duplicates the semantic label of node " +
          JSON.stringify(prior.nodeId) +
          ".",
      );
    }
    labels.push({ nodeId: node.id, tokens });
  }
  const userNodes = nodes.filter((node) => node.provenance === "user-provided");
  if (userNodes.length > 2) errors.push("At most two user-provided nodes are allowed.");
  if (context.options.mode === "stored") {
    if (nodes.some((node) => node.provenance !== "stored")) {
      errors.push("Stored source maps may contain only stored nodes.");
    }
    if (edges.some((edge) => edge.provenance !== "stored")) {
      errors.push("Stored source maps may contain only stored edges.");
    }
  }
  if (context.options.mode === "synthesized") {
    // Evidence is not topology. A synthesized proposal graph contains proposal
    // nodes and proposal edges only. Every non-problem node is a proposed or
    // adapted design concept ("synthesized"); the single problem node is
    // user-provided. Retrieved stored concepts remain fully inspectable as
    // evidence bindings (citations, source cards, evidence drawer), but are
    // never structural vertices or edges of the new proposal, so the system
    // cannot stitch a source paper's topology into the researcher's design.
    for (const node of nodes) {
      if (synthesisPrimaryLayer(node.stage) === "problem") {
        if (node.provenance !== "user-provided") {
          errors.push(
            "A synthesized proposal problem node must be user-provided.",
          );
        }
        continue;
      }
      if (node.provenance !== "synthesized") {
        errors.push(
          "Synthesized proposal node " +
            JSON.stringify(node.id) +
            " must be a proposed or adapted design concept, not imported stored knowledge.",
        );
      }
    }
    for (const edge of edges) {
      if (edge.provenance !== "synthesized") {
        errors.push(
          "Synthesized proposal relationship " +
            JSON.stringify(edge.label) +
            " must be a proposed design relation, not an imported stored-paper edge.",
        );
      }
    }
  }
  if (nodes.length <= 1) return;

  const adjacency = new Map(nodes.map((node) => [node.id, new Set<string>()]));
  const outgoing = new Map(nodes.map((node) => [node.id, new Set<string>()]));
  for (const edge of edges) {
    adjacency.get(edge.source)?.add(edge.target);
    adjacency.get(edge.target)?.add(edge.source);
    outgoing.get(edge.source)?.add(edge.target);
  }
  if (context.options.mode === "synthesized") {
    // The deterministic PRIMARY/SECONDARY design-knowledge grammar and the
    // mandatory core connectivity invariants (Problem -> Requirement ->
    // Principle -> Feature -> Artifact). `requireRpfPath` here means the
    // researcher asked for a complete proposed solution.
    for (const code of synthesisGrammarDiagnostics(
      { nodes, edges },
      { requireFullProposal: context.options.requireRpfPath === true },
    )) {
      errors.push("synthesis-grammar:" + code);
    }
  }
  for (const [nodeId, neighbors] of adjacency) {
    if (neighbors.size === 0) {
      errors.push("Node " + JSON.stringify(nodeId) + " is isolated and orphaned.");
    }
  }
  const start = [...adjacency.keys()].sort((left, right) =>
    left.localeCompare(right, "en")
  )[0]!;
  const visited = new Set([start]);
  const queue = [start];
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    for (const neighbor of adjacency.get(queue[cursor]!) ?? []) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  if (visited.size !== nodes.length) {
    const disconnected = nodes
      .map((node) => node.id)
      .filter((nodeId) => !visited.has(nodeId))
      .sort((left, right) => left.localeCompare(right, "en"));
    errors.push(
      "Diagram contains disconnected flow components; connect these nodes to the main flow: " +
        disconnected.map((nodeId) => JSON.stringify(nodeId)).join(", ") +
        ".",
    );
  }

  if (context.options.mode === "synthesized") {
    const visiting = new Set<string>();
    const complete = new Set<string>();
    const hasCycle = (nodeId: string): boolean => {
      if (visiting.has(nodeId)) return true;
      if (complete.has(nodeId)) return false;
      visiting.add(nodeId);
      for (const target of outgoing.get(nodeId) ?? []) {
        if (hasCycle(target)) return true;
      }
      visiting.delete(nodeId);
      complete.add(nodeId);
      return false;
    };
    if (nodes.some((node) => hasCycle(node.id))) {
      errors.push("Synthesis flow must not contain cycles.");
    }
  }

  if (!context.strictProvenance && edges.length === 0) {
    warnings.push("Legacy diagram has no directed relationships.");
  }
}

export function validateGeneratedDiagram(
  value: unknown,
  groundingOrAllowlist:
    | NativeOkfDiagramGrounding
    | ReadonlySet<string>
    | readonly string[],
  options: DiagramValidationOptions = {},
): DiagramValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const context = validationContext(groundingOrAllowlist, options);
  if (!isRecord(value)) {
    return { ok: false, errors: ["The generated diagram must be an object."], warnings };
  }
  rejectUnknownKeys(value, DIAGRAM_KEYS, "diagram", errors);
  const title = bounded(value.title, "title", DIAGRAM_LIMITS.maxTitleCharacters, errors);
  const explanation = bounded(
    value.explanation,
    "explanation",
    DIAGRAM_LIMITS.maxExplanationCharacters,
    errors,
  );
  const nodes: GeneratedDiagramNode[] = [];
  if (!Array.isArray(value.nodes)) {
    errors.push("nodes must be an array.");
  } else {
    if (value.nodes.length === 0) errors.push("nodes must not be empty.");
    if (value.nodes.length > DIAGRAM_LIMITS.maxNodes) {
      errors.push("nodes must contain at most " + DIAGRAM_LIMITS.maxNodes + " entries.");
    }
    value.nodes.forEach((node, index) => {
      const parsed = validateNode(node, index, context, errors);
      if (parsed) nodes.push(parsed);
    });
  }
  const nodesById = new Map<string, GeneratedDiagramNode>();
  for (const node of nodes) {
    if (nodesById.has(node.id)) {
      errors.push("Node duplicates the node ID " + JSON.stringify(node.id) + ".");
    }
    nodesById.set(node.id, node);
  }
  const edges: GeneratedDiagramEdge[] = [];
  if (!Array.isArray(value.edges)) {
    errors.push("edges must be an array.");
  } else {
    if (value.edges.length > DIAGRAM_LIMITS.maxEdges) {
      errors.push("edges must contain at most " + DIAGRAM_LIMITS.maxEdges + " entries.");
    }
    const seen = new Set<string>();
    value.edges.forEach((edge, index) => {
      const parsed = validateEdge(edge, index, nodesById, context, errors);
      if (!parsed) return;
      const key = JSON.stringify([
        parsed.source,
        parsed.target,
        normalizeLabel(parsed.label),
      ]);
      if (seen.has(key)) {
        if (context.strictProvenance) {
          errors.push("edges[" + index + "] duplicates an existing edge.");
        } else {
          warnings.push("Removed duplicate edge at edges[" + index + "].");
        }
        return;
      }
      seen.add(key);
      edges.push(parsed);
    });
  }
  validateGraph(nodes, edges, context, errors, warnings);
  if (errors.length > 0 || !title || !explanation) {
    return { ok: false, errors, warnings };
  }
  return {
    ok: true,
    diagram: { title, explanation, nodes, edges },
    warnings,
  };
}
