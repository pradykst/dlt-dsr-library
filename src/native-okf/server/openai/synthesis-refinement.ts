import "server-only";

import type { Response } from "openai/resources/responses/responses";

import {
  MAX_NATIVE_OKF_SYNTHESIS_DIAGRAM_EDGES,
  MAX_NATIVE_OKF_SYNTHESIS_DIAGRAM_NODES,
  SYNTHESIS_DIAGRAM_STAGES,
  SYNTHESIS_RELATIONSHIP_TYPES,
  type DiagramStage,
  type GeneratedDiagram,
  type GeneratedDiagramEdge,
  type GeneratedDiagramNode,
  type SynthesisDraftState,
  type SynthesisRelationshipType,
} from "../../shared/chat-types.ts";
import { sanitizeGeneratedProse } from "../../shared/generated-prose.ts";
import type { NativeOpenAiClient } from "./client.ts";
import {
  extendNativeOkfDiagramGrounding,
  type NativeOkfDiagramGrounding,
} from "./diagram-grounding.ts";
import type { NativeOpenAiEnvironment } from "./env.ts";
import { validateGeneratedDiagram } from "./diagram-validation.ts";
import { nativeOkfModelCallOptions } from "./request-budget.ts";

const MAX_KEY_CHARACTERS = 48;
const MAX_LABEL_CHARACTERS = 90;
const MAX_DESCRIPTION_CHARACTERS = 300;
const MAX_CATEGORY_CHARACTERS = 40;
const MAX_RATIONALE_CHARACTERS = 240;
const MAX_EDGE_LABEL_CHARACTERS = 32;
const MAX_SUPPORT_IDS = 3;
const MAX_SUPPORT_ID_CHARACTERS = 320;
const MAX_REPAIR_ERRORS = 12;
const KEY_PATTERN = /^[a-z][a-z0-9-]*$/u;
const REMOVE_REQUEST_PATTERN =
  /\b(?:remove|delete|drop|exclude|without|replace|simplify|reduce|prune)\b/iu;
const UPDATE_REQUEST_PATTERN =
  /\b(?:update|change|revise|rename|relabel|replace|make|refine|adjust|constraint|context|must|needs?|add|include|introduce)\b/iu;

export interface SynthesisRefinementNode {
  key: string;
  label: string;
  description: string;
  category: string;
  stage: DiagramStage;
  supportConceptIds: string[];
  synthesisRationale: string;
}

export interface SynthesisRefinementNodeUpdate {
  nodeId: string;
  label: string;
  description: string;
  category: string;
  stage: DiagramStage;
  supportConceptIds: string[];
  synthesisRationale: string;
}

export interface SynthesisRefinementEdge {
  source: string;
  target: string;
  label: SynthesisRelationshipType;
  rationale: string;
  supportConceptIds: string[];
}

export interface SynthesisRefinementEdgeRemoval {
  source: string;
  target: string;
  label: string;
}

export interface SynthesisRefinementPatch {
  addNodes: SynthesisRefinementNode[];
  updateNodes: SynthesisRefinementNodeUpdate[];
  removeNodeIds: string[];
  addEdges: SynthesisRefinementEdge[];
  removeEdges: SynthesisRefinementEdgeRemoval[];
}

const SUPPORT_SCHEMA = {
  type: "array",
  minItems: 1,
  maxItems: MAX_SUPPORT_IDS,
  items: { type: "string", minLength: 1, maxLength: MAX_SUPPORT_ID_CHARACTERS },
} as const;

const ADD_NODE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "key",
    "label",
    "description",
    "category",
    "stage",
    "supportConceptIds",
    "synthesisRationale",
  ],
  properties: {
    key: {
      type: "string",
      minLength: 1,
      maxLength: MAX_KEY_CHARACTERS,
      pattern: "^[a-z][a-z0-9-]*$",
    },
    label: { type: "string", minLength: 1, maxLength: MAX_LABEL_CHARACTERS },
    description: {
      type: "string",
      minLength: 1,
      maxLength: MAX_DESCRIPTION_CHARACTERS,
    },
    category: {
      type: "string",
      minLength: 1,
      maxLength: MAX_CATEGORY_CHARACTERS,
    },
    stage: { type: "string", enum: SYNTHESIS_DIAGRAM_STAGES },
    supportConceptIds: SUPPORT_SCHEMA,
    synthesisRationale: {
      type: "string",
      minLength: 1,
      maxLength: MAX_RATIONALE_CHARACTERS,
    },
  },
} as const;

const UPDATE_NODE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "nodeId",
    "label",
    "description",
    "category",
    "stage",
    "supportConceptIds",
    "synthesisRationale",
  ],
  properties: {
    nodeId: { type: "string", minLength: 1, maxLength: 64 },
    label: { type: "string", minLength: 1, maxLength: MAX_LABEL_CHARACTERS },
    description: {
      type: "string",
      minLength: 1,
      maxLength: MAX_DESCRIPTION_CHARACTERS,
    },
    category: {
      type: "string",
      minLength: 1,
      maxLength: MAX_CATEGORY_CHARACTERS,
    },
    stage: { type: "string", enum: SYNTHESIS_DIAGRAM_STAGES },
    supportConceptIds: SUPPORT_SCHEMA,
    synthesisRationale: {
      type: "string",
      minLength: 1,
      maxLength: MAX_RATIONALE_CHARACTERS,
    },
  },
} as const;

const EDGE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["source", "target", "label", "rationale", "supportConceptIds"],
  properties: {
    source: { type: "string", minLength: 1, maxLength: 64 },
    target: { type: "string", minLength: 1, maxLength: 64 },
    label: { enum: SYNTHESIS_RELATIONSHIP_TYPES },
    rationale: {
      type: "string",
      minLength: 1,
      maxLength: MAX_RATIONALE_CHARACTERS,
    },
    supportConceptIds: SUPPORT_SCHEMA,
  },
} as const;

const REMOVE_EDGE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["source", "target", "label"],
  properties: {
    source: { type: "string", minLength: 1, maxLength: 64 },
    target: { type: "string", minLength: 1, maxLength: 64 },
    label: {
      type: "string",
      minLength: 0,
      maxLength: MAX_EDGE_LABEL_CHARACTERS,
    },
  },
} as const;

export const SYNTHESIS_REFINEMENT_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "addNodes",
    "updateNodes",
    "removeNodeIds",
    "addEdges",
    "removeEdges",
  ],
  properties: {
    addNodes: {
      type: "array",
      maxItems: MAX_NATIVE_OKF_SYNTHESIS_DIAGRAM_NODES,
      items: ADD_NODE_SCHEMA,
    },
    updateNodes: {
      type: "array",
      maxItems: MAX_NATIVE_OKF_SYNTHESIS_DIAGRAM_NODES,
      items: UPDATE_NODE_SCHEMA,
    },
    removeNodeIds: {
      type: "array",
      maxItems: MAX_NATIVE_OKF_SYNTHESIS_DIAGRAM_NODES,
      items: { type: "string", minLength: 1, maxLength: 64 },
    },
    addEdges: {
      type: "array",
      maxItems: MAX_NATIVE_OKF_SYNTHESIS_DIAGRAM_EDGES,
      items: EDGE_SCHEMA,
    },
    removeEdges: {
      type: "array",
      maxItems: MAX_NATIVE_OKF_SYNTHESIS_DIAGRAM_EDGES,
      items: REMOVE_EDGE_SCHEMA,
    },
  },
} as const;

export const SYNTHESIS_REFINEMENT_RESPONSE_FORMAT = {
  type: "json_schema",
  name: "native_okf_synthesis_refinement_patch",
  description:
    "A grounded patch that edits the prior validated synthesis diagram without replacing it.",
  strict: true,
  schema: SYNTHESIS_REFINEMENT_JSON_SCHEMA,
} as const;

export const NATIVE_OKF_SYNTHESIS_REFINEMENT_INSTRUCTIONS = `Return only a graph patch matching the strict schema. Edit the supplied prior validated draft; never return a replacement graph.

By default preserve every existing node and edge. Add only requested information. Use updateNodes only when the user explicitly asks to change or replace a node. Use removeNodeIds or removeEdges only when the user explicitly asks to remove, exclude, delete, or replace something. An added node ID is "refine-" followed by its key; use that ID in added edges.

Natural refinements and new constraints should edit the relevant existing concepts first. Do not add a parallel branch when a local content update suffices. Simplifying may remove redundant or optional elements, but must retain the core design path. Preserve the stage, category, support IDs, and wording of fields that the request does not affect. Additional context can justify a local update, never a wholesale redesign. If no justified valid edit exists, return five empty operation arrays.

Every added or updated node and every added edge must use one to three supportConceptIds from the fresh current-turn allowlist as evidence bindings. Every added or updated node is a PROPOSED design concept; never import a stored concept as a node and never reproduce a stored source relation. Give each added edge a schema-defined relationshipType and a concise evidence-linked rationale. The prior draft is design context, never scholarly evidence for a new operation.

A PRIMARY relationship connects adjacent semantic roles only (problem -> requirement -> principle -> feature -> artifact); never add a requirement -> feature, principle -> artifact, backward, or same-role primary relationship. A SECONDARY dependency uses relationshipType "depends on" (principle -> principle or feature -> feature) or "interoperates with" (feature -> feature) and never substitutes for a primary parent. Evaluation and Outcome remain optional.

Preserve connectedness, acyclicity, provenance, and all unmentioned elements. Unequal role sizes and real fan-in or fan-out are valid. Do not add filler or balance roles. The schema ceilings are emergency safety guards. Every domain adjective modifies node content, not the stage. A requested thematic requirement remains a design-requirement. Never create a thematic or application-domain stage. Do not use em dashes in generated prose.`;

const PATCH_KEYS = new Set([
  "addNodes",
  "updateNodes",
  "removeNodeIds",
  "addEdges",
  "removeEdges",
]);
const ADD_NODE_KEYS = new Set(Object.keys(ADD_NODE_SCHEMA.properties));
const UPDATE_NODE_KEYS = new Set(Object.keys(UPDATE_NODE_SCHEMA.properties));
const EDGE_KEYS = new Set(Object.keys(EDGE_SCHEMA.properties));
const REMOVE_EDGE_KEYS = new Set(Object.keys(REMOVE_EDGE_SCHEMA.properties));

export const NATIVE_OKF_REFINEMENT_REVIEW_INSTRUCTIONS = `Review a proposed patch to the authoritative validated design proposal. Return only the strict review verdict, never a replacement diagram.
Approve only if EVERY operation is necessary for the latest refinementRequest and supported by the fresh allowlisted evidence. Identify the specific requested target or constraint for every addition, update, removal, and relationship change. Reject unrelated edits even when the resulting graph is valid. Reject filler, balance-driven branches, mechanically copied source concepts, unsupported domain claims, changes to unaffected provenance or stages, and unnecessary rewiring. New context should normally refine relevant existing nodes, not grow a new parallel solution. Removing or simplifying a component justifies only its removal and necessary local reconnections. A request to display the diagram justifies no edits. An empty patch is acceptable when no safe evidence-grounded change can be justified. Do not treat the prior proposal or user constraints as scholarly evidence. approved must be false if any operation fails these checks; errors must explain what to remove or correct.`;

const REFINEMENT_REVIEW_FORMAT = {
  type: "json_schema", name: "native_okf_refinement_review", strict: true,
  schema: {
    type: "object", additionalProperties: false, required: ["approved", "errors"],
    properties: {
      approved: { type: "boolean" },
      errors: { type: "array", maxItems: 6, items: { type: "string", minLength: 1, maxLength: 240 } },
    },
  },
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function onlyKeys(value: Record<string, unknown>, keys: ReadonlySet<string>): boolean {
  return Object.keys(value).every((key) => keys.has(key));
}

function bounded(value: unknown, maximum: number, allowEmpty = false): string | null {
  if (typeof value !== "string") return null;
  const result = sanitizeGeneratedProse(value)
    .replace(/\u0000/gu, "")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/gu, "")
    .replace(/\s+/gu, " ")
    .trim();
  return (allowEmpty || result !== "") && result.length <= maximum
    ? result
    : null;
}

function supportIds(
  value: unknown,
  grounding: NativeOkfDiagramGrounding,
): string[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > MAX_SUPPORT_IDS) {
    return null;
  }
  const ids = [...new Set(value.flatMap((item) => {
    const id = bounded(item, MAX_SUPPORT_ID_CHARACTERS);
    return id ? [id] : [];
  }))];
  return value.every((item) => bounded(item, MAX_SUPPORT_ID_CHARACTERS) !== null) && ids.length > 0 && ids.every((id) =>
    grounding.eligibleStoredConceptIds.has(id)
  )
    ? ids
    : null;
}

function stage(value: unknown): DiagramStage | null {
  return typeof value === "string" &&
      SYNTHESIS_DIAGRAM_STAGES.some((candidate) => candidate === value)
    ? value as DiagramStage
    : null;
}

function parseAddNode(
  value: unknown,
  grounding: NativeOkfDiagramGrounding,
): SynthesisRefinementNode | null {
  if (!isRecord(value) || !onlyKeys(value, ADD_NODE_KEYS)) return null;
  const key = bounded(value.key, MAX_KEY_CHARACTERS);
  const label = bounded(value.label, MAX_LABEL_CHARACTERS);
  const description = bounded(value.description, MAX_DESCRIPTION_CHARACTERS);
  const category = bounded(value.category, MAX_CATEGORY_CHARACTERS);
  const parsedStage = stage(value.stage);
  const supports = supportIds(value.supportConceptIds, grounding);
  const rationale = bounded(value.synthesisRationale, MAX_RATIONALE_CHARACTERS);
  if (
    !key ||
    !KEY_PATTERN.test(key) ||
    !label ||
    !description ||
    !category ||
    !parsedStage ||
    !supports ||
    !rationale
  ) return null;
  return {
    key,
    label,
    description,
    category,
    stage: parsedStage,
    supportConceptIds: supports,
    synthesisRationale: rationale,
  };
}

function parseUpdateNode(
  value: unknown,
  grounding: NativeOkfDiagramGrounding,
): SynthesisRefinementNodeUpdate | null {
  if (!isRecord(value) || !onlyKeys(value, UPDATE_NODE_KEYS)) return null;
  const nodeId = bounded(value.nodeId, 64);
  const label = bounded(value.label, MAX_LABEL_CHARACTERS);
  const description = bounded(value.description, MAX_DESCRIPTION_CHARACTERS);
  const category = bounded(value.category, MAX_CATEGORY_CHARACTERS);
  const parsedStage = stage(value.stage);
  const supports = supportIds(value.supportConceptIds, grounding);
  const rationale = bounded(value.synthesisRationale, MAX_RATIONALE_CHARACTERS);
  return nodeId && label && description && category && parsedStage && supports && rationale
    ? {
        nodeId,
        label,
        description,
        category,
        stage: parsedStage,
        supportConceptIds: supports,
        synthesisRationale: rationale,
      }
    : null;
}

function parseEdge(
  value: unknown,
  grounding: NativeOkfDiagramGrounding,
): SynthesisRefinementEdge | null {
  if (!isRecord(value) || !onlyKeys(value, EDGE_KEYS)) return null;
  const source = bounded(value.source, 64);
  const target = bounded(value.target, 64);
  const label = bounded(value.label, MAX_EDGE_LABEL_CHARACTERS);
  const rationale = bounded(value.rationale, MAX_RATIONALE_CHARACTERS);
  const supports = supportIds(value.supportConceptIds, grounding);
  return source && target && source !== target && label &&
      SYNTHESIS_RELATIONSHIP_TYPES.includes(label as SynthesisRelationshipType) &&
      rationale && supports
    ? {
        source,
        target,
        label: label as SynthesisRelationshipType,
        rationale,
        supportConceptIds: supports,
      }
    : null;
}

function parseEdgeRemoval(value: unknown): SynthesisRefinementEdgeRemoval | null {
  if (!isRecord(value) || !onlyKeys(value, REMOVE_EDGE_KEYS)) return null;
  const source = bounded(value.source, 64);
  const target = bounded(value.target, 64);
  const label = bounded(value.label, MAX_EDGE_LABEL_CHARACTERS, true);
  return source && target && source !== target && label !== null
    ? { source, target, label }
    : null;
}

export function validateNativeOkfSynthesisRefinementPatch(
  value: unknown,
  grounding: NativeOkfDiagramGrounding,
  refinementRequest: string,
): { ok: true; patch: SynthesisRefinementPatch } | { ok: false; errors: string[] } {
  if (!isRecord(value) || !onlyKeys(value, PATCH_KEYS)) {
    return { ok: false, errors: ["patch:invalid-shape"] };
  }
  const errors: string[] = [];
  const parseArray = <T>(
    input: unknown,
    maximum: number,
    parser: (item: unknown) => T | null,
    path: string,
  ): T[] => {
    if (!Array.isArray(input) || input.length > maximum) {
      errors.push(`${path}:invalid-count`);
      return [];
    }
    return input.flatMap((item, index) => {
      const parsed = parser(item);
      if (!parsed) errors.push(`${path}[${index}]:invalid`);
      return parsed ? [parsed] : [];
    });
  };
  const addNodes = parseArray(
    value.addNodes,
    MAX_NATIVE_OKF_SYNTHESIS_DIAGRAM_NODES,
    (item) => parseAddNode(item, grounding),
    "addNodes",
  );
  const updateNodes = parseArray(
    value.updateNodes,
    MAX_NATIVE_OKF_SYNTHESIS_DIAGRAM_NODES,
    (item) => parseUpdateNode(item, grounding),
    "updateNodes",
  );
  const removeNodeIds = parseArray(
    value.removeNodeIds,
    MAX_NATIVE_OKF_SYNTHESIS_DIAGRAM_NODES,
    (item) => bounded(item, 64),
    "removeNodeIds",
  );
  const addEdges = parseArray(
    value.addEdges,
    MAX_NATIVE_OKF_SYNTHESIS_DIAGRAM_EDGES,
    (item) => parseEdge(item, grounding),
    "addEdges",
  );
  const removeEdges = parseArray(
    value.removeEdges,
    MAX_NATIVE_OKF_SYNTHESIS_DIAGRAM_EDGES,
    parseEdgeRemoval,
    "removeEdges",
  );
  if (
    (removeNodeIds.length > 0 || removeEdges.length > 0) &&
    !REMOVE_REQUEST_PATTERN.test(refinementRequest)
  ) {
    errors.push("patch:unrequested-removal");
  }
  if (updateNodes.length > 0 && !UPDATE_REQUEST_PATTERN.test(refinementRequest)) {
    errors.push("patch:unrequested-update");
  }
  const keyIds = addNodes.map((node) => `refine-${node.key}`);
  if (new Set(keyIds).size !== keyIds.length) errors.push("patch:duplicate-add-node");
  const updateIds = updateNodes.map((node) => node.nodeId);
  if (new Set(updateIds).size !== updateIds.length) errors.push("patch:duplicate-update-node");
  if (new Set(removeNodeIds).size !== removeNodeIds.length) errors.push("patch:duplicate-remove-node");
  if (updateIds.some((id) => removeNodeIds.includes(id))) errors.push("patch:conflicting-node-operations");
  return errors.length > 0
    ? { ok: false, errors: [...new Set(errors)] }
    : {
        ok: true,
        patch: { addNodes, updateNodes, removeNodeIds, addEdges, removeEdges },
      };
}

function normalizeLabel(value: string): string {
  return value.normalize("NFKC").toLocaleLowerCase("en").replace(/\s+/gu, " ").trim();
}

function orderForStage(value: DiagramStage): number {
  const ranks: Readonly<Record<DiagramStage, number>> = {
    problem: 0,
    "design-goal": 10,
    "design-objective": 15,
    "meta-requirement": 20,
    "design-requirement": 20,
    requirements: 20,
    "design-principle": 40,
    principles: 40,
    "design-feature": 60,
    features: 60,
    artifact: 70,
    evaluation: 85,
    outcome: 95,
    other: 50,
  };
  return ranks[value];
}

function convertedAddedNode(
  patchNode: SynthesisRefinementNode,
): GeneratedDiagramNode {
  // Every refinement-added node is a PROPOSED design concept. Its
  // supportConceptIds are evidence bindings, never a claim of stored identity,
  // so a refinement can never stitch a source paper's topology into the
  // active proposal.
  return {
    id: `refine-${patchNode.key}`,
    label: patchNode.label,
    description: patchNode.description,
    category: patchNode.category,
    stage: patchNode.stage,
    order: orderForStage(patchNode.stage),
    group: null,
    provenance: "synthesized",
    sourcePaths: [...patchNode.supportConceptIds],
    supportConceptIds: [...patchNode.supportConceptIds],
    synthesisRationale: patchNode.synthesisRationale,
    synthesis: true,
  };
}

function forwardStageOrder(
  nodes: readonly GeneratedDiagramNode[],
  edges: readonly GeneratedDiagramEdge[],
): boolean {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  return edges.every((edge) => {
    const source = byId.get(edge.source);
    const target = byId.get(edge.target);
    return Boolean(source && target && orderForStage(target.stage) >= orderForStage(source.stage));
  });
}

export async function applyNativeOkfSynthesisRefinementPatch(
  priorDraft: SynthesisDraftState,
  patch: SynthesisRefinementPatch,
  currentTurnGrounding: NativeOkfDiagramGrounding,
  problemStatement: string,
  requireRpfPath: boolean,
): Promise<
  | { ok: true; diagram: GeneratedDiagram; usedSupportConceptIds: string[] }
  | { ok: false; errors: string[] }
> {
  const existingIds = new Set(priorDraft.nodes.map((node) => node.id));
  if (priorDraft.nodes.some((node) => node.stage === "problem" && patch.removeNodeIds.includes(node.id))) {
    return { ok: false, errors: ["patch:cannot-remove-problem"] };
  }
  if (patch.removeNodeIds.some((id) => !existingIds.has(id))) {
    return { ok: false, errors: ["patch:unknown-remove-node"] };
  }
  if (patch.updateNodes.some((update) => {
    const node = priorDraft.nodes.find((candidate) => candidate.id === update.nodeId);
    return !node || node.provenance !== "synthesized";
  })) {
    return { ok: false, errors: ["patch:update-target-must-be-synthesized"] };
  }
  const removed = new Set(patch.removeNodeIds);
  let nodes = priorDraft.nodes.filter((node) => !removed.has(node.id));
  const updates = new Map(patch.updateNodes.map((update) => [update.nodeId, update]));
  nodes = nodes.map((node) => {
    const update = updates.get(node.id);
    return update
      ? {
          ...node,
          label: update.label,
          description: update.description,
          category: update.category,
          stage: update.stage,
          order: update.stage === node.stage ? node.order : orderForStage(update.stage),
          sourcePaths: [...update.supportConceptIds],
          supportConceptIds: [...update.supportConceptIds],
          synthesisRationale: update.synthesisRationale,
        }
      : node;
  });
  const addedNodes = patch.addNodes.map(convertedAddedNode);
  if (addedNodes.some((node) => existingIds.has(node.id))) {
    return { ok: false, errors: ["patch:add-node-id-collision"] };
  }
  nodes = [...nodes, ...addedNodes];
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  let edges = priorDraft.edges.filter(
    (edge) => !removed.has(edge.source) && !removed.has(edge.target),
  );
  for (const removal of patch.removeEdges) {
    const before = edges.length;
    edges = edges.filter((edge) => !(
      edge.source === removal.source &&
      edge.target === removal.target &&
      normalizeLabel(edge.label) === normalizeLabel(removal.label)
    ));
    if (edges.length === before) {
      return { ok: false, errors: ["patch:unknown-remove-edge"] };
    }
  }
  for (const addition of patch.addEdges) {
    const source = nodeById.get(addition.source);
    const target = nodeById.get(addition.target);
    if (!source || !target) return { ok: false, errors: ["patch:unknown-add-edge-endpoint"] };
    // Every refinement-added relationship is a proposed design relation. Stored
    // source-paper relations are never imported.
    edges.push({
      source: source.id,
      target: target.id,
      label: addition.label,
      provenance: "synthesized",
      supportConceptIds: [...addition.supportConceptIds],
    });
  }
  if (nodes.length > MAX_NATIVE_OKF_SYNTHESIS_DIAGRAM_NODES) {
    return { ok: false, errors: ["patch:node-safety-ceiling"] };
  }
  if (edges.length > MAX_NATIVE_OKF_SYNTHESIS_DIAGRAM_EDGES) {
    return { ok: false, errors: ["patch:edge-safety-ceiling"] };
  }
  if (!forwardStageOrder(nodes, edges)) {
    return { ok: false, errors: ["patch:backward-stage-edge"] };
  }
  const preservedSupport = [...priorDraft.nodes, ...priorDraft.edges].flatMap((element) => element.supportConceptIds);
  const validationGrounding = await extendNativeOkfDiagramGrounding(
    currentTurnGrounding,
    preservedSupport,
  );
  const candidate: GeneratedDiagram = {
    title: priorDraft.title ?? "Design proposal refinement",
    explanation:
      priorDraft.explanation ?? "A validated edit of the prior design proposal. Unmentioned nodes and relationships are preserved; new or changed elements use fresh current-turn stored support.",
    nodes,
    edges,
  };
  const validation = validateGeneratedDiagram(candidate, validationGrounding, {
    mode: "synthesized",
    requireRpfPath,
    requireDisplayedStoredSupport: false,
  });
  if (!validation.ok) return { ok: false, errors: validation.errors };
  // Validation may normalize fields. Never accept collateral changes to baseline elements.
  const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
  if (priorDraft.nodes.some((node) => !removed.has(node.id) && !updates.has(node.id) &&
      !same(node, validation.diagram.nodes.find((candidate) => candidate.id === node.id))) ||
      edges.slice(0, edges.length - patch.addEdges.length).some((edge, index) =>
        !same(edge, validation.diagram.edges[index]))) {
    return { ok: false, errors: ["patch:changed-unaffected-element"] };
  }
  const freshSupportIds = [...new Set([
    ...patch.addNodes.flatMap((node) => node.supportConceptIds),
    ...patch.updateNodes.flatMap((node) => node.supportConceptIds),
    ...patch.addEdges.flatMap((edge) => edge.supportConceptIds),
  ])];
  return {
    ok: true,
    diagram: validation.diagram,
    usedSupportConceptIds: [...new Set([
      ...[...validation.diagram.nodes, ...validation.diagram.edges].flatMap((element) => element.supportConceptIds),
      ...freshSupportIds,
    ])],
  };
}

export interface GenerateNativeOkfSynthesisRefinementOptions {
  client: NativeOpenAiClient;
  environment: NativeOpenAiEnvironment;
  refinementRequest: string;
  problemStatement: string;
  grounding: NativeOkfDiagramGrounding;
  priorDraft: SynthesisDraftState;
  requireRpfPath: boolean;
}

function compactGrounding(grounding: NativeOkfDiagramGrounding) {
  return [...grounding.conceptsById.values()]
    .filter((concept) => grounding.eligibleStoredConceptIds.has(concept.conceptId))
    .sort((left, right) => left.conceptId.localeCompare(right.conceptId, "en"))
    .map((concept) => ({
      conceptId: concept.conceptId,
      title: concept.title,
      description: concept.description,
      type: concept.type,
      stage: concept.stage,
    }));
}

export function buildNativeOkfSynthesisRefinementInput(
  options: GenerateNativeOkfSynthesisRefinementOptions,
  repairErrors?: readonly string[],
): string {
  return JSON.stringify({
    problemStatement: options.problemStatement,
    refinementRequest: options.refinementRequest,
    priorValidatedDraft: {
      nodes: options.priorDraft.nodes,
      edges: options.priorDraft.edges,
    },
    freshAllowlistedConcepts: compactGrounding(options.grounding),
    ...(repairErrors
      ? { validationErrors: [...new Set(repairErrors)].slice(0, MAX_REPAIR_ERRORS) }
      : {}),
  });
}

function refused(response: Response): boolean {
  return response.output.some((item) =>
    item.type === "message" && item.content.some((part) => part.type === "refusal")
  );
}

function parseResponse(
  response: Response,
  options: GenerateNativeOkfSynthesisRefinementOptions,
): { ok: true; patch: SynthesisRefinementPatch } | { ok: false; errors: string[] } {
  if (refused(response)) return { ok: false, errors: ["response:refused"] };
  if (response.status === "incomplete") return { ok: false, errors: ["response:incomplete"] };
  const raw = response.output_text?.trim() ?? "";
  if (!raw) return { ok: false, errors: ["response:empty"] };
  try {
    return validateNativeOkfSynthesisRefinementPatch(
      JSON.parse(raw) as unknown,
      options.grounding,
      options.refinementRequest,
    );
  } catch {
    return { ok: false, errors: ["response:invalid-json"] };
  }
}

async function createResponse(
  options: GenerateNativeOkfSynthesisRefinementOptions,
  repairErrors?: readonly string[],
): Promise<Response> {
  return options.client.responses.create({
    model: options.environment.model,
    instructions: NATIVE_OKF_SYNTHESIS_REFINEMENT_INSTRUCTIONS,
    input: buildNativeOkfSynthesisRefinementInput(options, repairErrors),
    reasoning: { effort: options.environment.reasoningEffort },
    max_output_tokens: options.environment.diagramMaxOutputTokens,
    text: { format: SYNTHESIS_REFINEMENT_RESPONSE_FORMAT },
    tools: [],
    tool_choice: "none",
    parallel_tool_calls: false,
    store: false,
  }, nativeOkfModelCallOptions(repairErrors ? "refinement-repair" : "refinement-patch"));
}

async function reviewPatch(
  options: GenerateNativeOkfSynthesisRefinementOptions,
  patch: SynthesisRefinementPatch,
): Promise<string[]> {
  const response = await options.client.responses.create({
    model: options.environment.model,
    instructions: NATIVE_OKF_REFINEMENT_REVIEW_INSTRUCTIONS,
    input: JSON.stringify({ ...JSON.parse(buildNativeOkfSynthesisRefinementInput(options)), proposedPatch: patch }),
    reasoning: { effort: options.environment.reasoningEffort },
    max_output_tokens: options.environment.diagramMaxOutputTokens,
    text: { format: REFINEMENT_REVIEW_FORMAT },
    tools: [], tool_choice: "none", parallel_tool_calls: false, store: false,
  }, nativeOkfModelCallOptions("refinement-review"));
  if (refused(response) || response.status === "incomplete") return ["patch:review-unavailable"];
  try {
    const verdict: unknown = JSON.parse(response.output_text ?? "");
    if (!isRecord(verdict) || !onlyKeys(verdict, new Set(["approved", "errors"])) ||
        typeof verdict.approved !== "boolean" || !Array.isArray(verdict.errors) ||
        verdict.errors.length > 6 || verdict.errors.some((error) => !bounded(error, 240))) {
      return ["patch:invalid-review"];
    }
    if (verdict.approved && verdict.errors.length === 0) return [];
    return verdict.errors.length > 0 ? verdict.errors as string[] : ["patch:unjustified-operations"];
  } catch { return ["patch:invalid-review"]; }
}

export async function generateNativeOkfSynthesisRefinement(
  options: GenerateNativeOkfSynthesisRefinementOptions,
): Promise<
  | {
      diagram: GeneratedDiagram;
      usedSupportConceptIds: string[];
      deterministicSummary: string;
      warnings: string[];
    }
  | { errors: string[] }
> {
  const accepted = (
    result: { diagram: GeneratedDiagram; usedSupportConceptIds: string[] },
    warnings: string[],
  ) => ({
    ...result,
    deterministicSummary:
      "This diagram applies the requested refinement to the existing design proposal. Unmentioned elements are preserved, and new or changed elements use current-turn stored support.",
    warnings,
  });
  let errors: string[] | undefined;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    let parsed: ReturnType<typeof parseResponse>;
    try { parsed = parseResponse(await createResponse(options, errors), options); }
    catch { return { errors: ["patch:provider-unavailable"] }; }
    if (!parsed.ok) { errors = parsed.errors; continue; }
    const applied = await applyNativeOkfSynthesisRefinementPatch(
      options.priorDraft, parsed.patch, options.grounding, options.problemStatement, options.requireRpfPath,
    );
    if (!applied.ok) { errors = applied.errors; continue; }
    try { errors = await reviewPatch(options, parsed.patch); }
    catch {
      // Review is mandatory for accepting a patch. A transport failure cannot
      // authorize it and does not justify another paid patch generation.
      return { errors: ["patch:review-unavailable"] };
    }
    if (errors.length > 0) continue;
    const noChanges = Object.values(parsed.patch).every((operations) => operations.length === 0);
    return accepted(applied, noChanges
      ? ["No safe evidence-grounded changes were justified; the prior proposal is preserved."]
      : attempt > 0 ? ["The synthesis refinement required one bounded repair."] : []);
  }
  return { errors: errors ?? ["patch:review-unavailable"] };
}
