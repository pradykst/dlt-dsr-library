import "server-only";

import type { Response } from "openai/resources/responses/responses";

import type {
  DiagramStage,
  GeneratedDiagram,
  GeneratedDiagramEdge,
  GeneratedDiagramNode,
  SynthesisDraftState,
} from "../../shared/chat-types.ts";
import {
  MAX_NATIVE_OKF_SYNTHESIS_DIAGRAM_EDGES,
  MAX_NATIVE_OKF_SYNTHESIS_DIAGRAM_NODES,
} from "../../shared/chat-types.ts";
import { sanitizeGeneratedProse } from "../../shared/generated-prose.ts";
import { formatConceptType } from "../../shared/presentation.ts";
import {
  synthesisProblemNodeDisplay,
  synthesisProblemSummaryPhrase,
} from "../../shared/synthesis-problem-display.ts";
import type { NativeOpenAiClient } from "./client.ts";
import type {
  NativeOkfDiagramGrounding,
} from "./diagram-grounding.ts";
import type { NativeOpenAiEnvironment } from "./env.ts";
import { validateGeneratedDiagram } from "./diagram-validation.ts";

export const SYNTHESIS_PLAN_LIMITS = Object.freeze({
  maxTitleCharacters: 120,
  maxProblemSummaryCharacters: 300,
  maxKeyCharacters: 48,
  maxLabelCharacters: 90,
  maxDescriptionCharacters: 300,
  maxSupportConceptIds: 3,
  maxRelationships: MAX_NATIVE_OKF_SYNTHESIS_DIAGRAM_EDGES,
  maxRenderedNodes: MAX_NATIVE_OKF_SYNTHESIS_DIAGRAM_NODES,
  maxNodesPerStage: MAX_NATIVE_OKF_SYNTHESIS_DIAGRAM_NODES - 1,
  maxRelationshipLabelCharacters: 32,
});

export interface SynthesisPlanNode {
  key: string;
  label: string;
  description: string;
  supportConceptIds: string[];
  reuseStoredConceptId: string | null;
}

export interface SynthesisPlanRelationship {
  sourceKey: string;
  targetKey: string;
  label: string;
  supportConceptIds: string[];
}

export interface SynthesisPlan {
  title: string;
  problemSummary: string;
  requirements: SynthesisPlanNode[];
  principles: SynthesisPlanNode[];
  features: SynthesisPlanNode[];
  artifact: SynthesisPlanNode[];
  evaluation: SynthesisPlanNode[];
  outcome: SynthesisPlanNode[];
  relationships: SynthesisPlanRelationship[];
}

export interface GenerateNativeOkfSynthesisPlanOptions {
  client: NativeOpenAiClient;
  environment: NativeOpenAiEnvironment;
  problemStatement: string;
  refinementRequest: string;
  domain: string | null;
  objective: string | null;
  constraints: readonly string[];
  grounding: NativeOkfDiagramGrounding;
  priorDraft: SynthesisDraftState | null;
  requireRpfPath?: boolean;
}

export interface GeneratedNativeOkfSynthesisPlan {
  diagram?: GeneratedDiagram;
  plan?: SynthesisPlan;
  usedSupportConceptIds: string[];
  deterministicSummary?: string;
  warnings: string[];
  diagnosticCode?: "synthesis-plan-repair-failed";
}

const PLAN_KEYS = new Set([
  "title",
  "problemSummary",
  "requirements",
  "principles",
  "features",
  "artifact",
  "evaluation",
  "outcome",
  "relationships",
]);
const NODE_KEYS = new Set([
  "key",
  "label",
  "description",
  "supportConceptIds",
  "reuseStoredConceptId",
]);
const RELATIONSHIP_KEYS = new Set([
  "sourceKey",
  "targetKey",
  "label",
  "supportConceptIds",
]);
const KEY_PATTERN = /^[a-z][a-z0-9-]*$/u;
const MAX_REPAIR_ERRORS = 12;

const PLAN_NODE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "key",
    "label",
    "description",
    "supportConceptIds",
    "reuseStoredConceptId",
  ],
  properties: {
    key: {
      type: "string",
      minLength: 1,
      maxLength: SYNTHESIS_PLAN_LIMITS.maxKeyCharacters,
      pattern: "^[a-z][a-z0-9-]*$",
    },
    label: {
      type: "string",
      minLength: 1,
      maxLength: SYNTHESIS_PLAN_LIMITS.maxLabelCharacters,
    },
    description: {
      type: "string",
      minLength: 1,
      maxLength: SYNTHESIS_PLAN_LIMITS.maxDescriptionCharacters,
    },
    supportConceptIds: {
      type: "array",
      minItems: 1,
      maxItems: SYNTHESIS_PLAN_LIMITS.maxSupportConceptIds,
      items: { type: "string", minLength: 1, maxLength: 320 },
    },
    reuseStoredConceptId: {
      anyOf: [
        { type: "null" },
        { type: "string", minLength: 1, maxLength: 320 },
      ],
    },
  },
} as const;

export const SYNTHESIS_PLAN_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "title",
    "problemSummary",
    "requirements",
    "principles",
    "features",
    "artifact",
    "evaluation",
    "outcome",
    "relationships",
  ],
  properties: {
    title: {
      type: "string",
      minLength: 1,
      maxLength: SYNTHESIS_PLAN_LIMITS.maxTitleCharacters,
    },
    problemSummary: {
      type: "string",
      minLength: 1,
      maxLength: SYNTHESIS_PLAN_LIMITS.maxProblemSummaryCharacters,
    },
    requirements: {
      type: "array",
      minItems: 0,
      maxItems: SYNTHESIS_PLAN_LIMITS.maxNodesPerStage,
      items: PLAN_NODE_SCHEMA,
    },
    principles: {
      type: "array",
      minItems: 0,
      maxItems: SYNTHESIS_PLAN_LIMITS.maxNodesPerStage,
      items: PLAN_NODE_SCHEMA,
    },
    features: {
      type: "array",
      minItems: 0,
      maxItems: SYNTHESIS_PLAN_LIMITS.maxNodesPerStage,
      items: PLAN_NODE_SCHEMA,
    },
    artifact: {
      type: "array",
      minItems: 0,
      maxItems: SYNTHESIS_PLAN_LIMITS.maxNodesPerStage,
      items: PLAN_NODE_SCHEMA,
    },
    evaluation: {
      type: "array",
      minItems: 0,
      maxItems: SYNTHESIS_PLAN_LIMITS.maxNodesPerStage,
      items: PLAN_NODE_SCHEMA,
    },
    outcome: {
      type: "array",
      minItems: 0,
      maxItems: SYNTHESIS_PLAN_LIMITS.maxNodesPerStage,
      items: PLAN_NODE_SCHEMA,
    },
    relationships: {
      type: "array",
      minItems: 1,
      maxItems: SYNTHESIS_PLAN_LIMITS.maxRelationships,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "sourceKey",
          "targetKey",
          "label",
          "supportConceptIds",
        ],
        properties: {
          sourceKey: {
            type: "string",
            minLength: 1,
            maxLength: SYNTHESIS_PLAN_LIMITS.maxKeyCharacters,
          },
          targetKey: {
            type: "string",
            minLength: 1,
            maxLength: SYNTHESIS_PLAN_LIMITS.maxKeyCharacters,
          },
          label: {
            type: "string",
            minLength: 1,
            maxLength: SYNTHESIS_PLAN_LIMITS.maxRelationshipLabelCharacters,
          },
          supportConceptIds: {
            type: "array",
            minItems: 1,
            maxItems: SYNTHESIS_PLAN_LIMITS.maxSupportConceptIds,
            items: { type: "string", minLength: 1, maxLength: 320 },
          },
        },
      },
    },
  },
} as const;

export const SYNTHESIS_PLAN_RESPONSE_FORMAT = {
  type: "json_schema",
  name: "native_okf_synthesis_plan",
  description:
    "A grounded synthesis plan. Rendering, provenance, layout, and source paths are server-derived.",
  strict: true,
  schema: SYNTHESIS_PLAN_JSON_SCHEMA,
} as const;

export const NATIVE_OKF_SYNTHESIS_PLAN_INSTRUCTIONS = `Return only a grounded SynthesisPlan matching the strict schema. Do not emit diagram coordinates, layout, paths, stages, ordering, groups, provenance, renderer fields, Markdown, or prose outside the response.

Use only the supplied current-turn allowlisted stored concepts. Each proposed node and relationship needs one to three allowlisted supportConceptIds. Set reuseStoredConceptId only when the node should reuse that exact canonical stored concept; otherwise use null. Derive the number and distribution of nodes from the design problem and evidence. Unequal stage sizes, omitted irrelevant stages, one-to-many, many-to-one, and many-to-many relationships are valid. Do not add filler, duplicate, or weakly rephrased concepts to balance the stages. The schema ceilings are emergency safety guards, not output targets.

Use the reserved relationship endpoint key "problem" for the user problem. Produce one connected acyclic forward flow. Include a complete problem -> requirement -> principle -> feature path only when the request actually requires all of those stages. The plan is a proposal grounded by stored knowledge, not stored knowledge itself. Do not use em dashes in generated prose. Use commas, semicolons, colons, parentheses, or ordinary hyphens.`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function onlyKeys(value: Record<string, unknown>, allowed: ReadonlySet<string>): boolean {
  return Object.keys(value).every((key) => allowed.has(key));
}

function bounded(value: unknown, maximum: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value
    .replace(/\u0000/gu, "")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/gu, "")
    .replace(/\s+/gu, " ")
    .trim();
  return normalized !== "" && normalized.length <= maximum ? normalized : null;
}

function normalize(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/gu, " ");
}

function allowedStages(kind: "requirement" | "principle" | "feature" | "artifact" | "evaluation" | "outcome"): ReadonlySet<DiagramStage> {
  if (kind === "requirement") return new Set(["meta-requirement", "design-requirement", "requirements"]);
  if (kind === "principle") return new Set(["design-principle", "principles"]);
  if (kind === "feature") return new Set(["design-feature", "features"]);
  return new Set([kind]);
}

function parsePlanNode(
  value: unknown,
  kind: "requirement" | "principle" | "feature" | "artifact" | "evaluation" | "outcome",
  grounding: NativeOkfDiagramGrounding,
  errors: string[],
  path: string,
): SynthesisPlanNode | null {
  if (!isRecord(value) || !onlyKeys(value, NODE_KEYS)) {
    errors.push(`${path}:invalid-node-shape`);
    return null;
  }
  const key = bounded(value.key, SYNTHESIS_PLAN_LIMITS.maxKeyCharacters);
  const label = bounded(value.label, SYNTHESIS_PLAN_LIMITS.maxLabelCharacters);
  const description = bounded(value.description, SYNTHESIS_PLAN_LIMITS.maxDescriptionCharacters);
  const supports = Array.isArray(value.supportConceptIds)
    ? [...new Set(value.supportConceptIds.flatMap((item) => {
        const id = bounded(item, 320);
        return id ? [id] : [];
      }))]
    : [];
  const reuse = value.reuseStoredConceptId === null
    ? null
    : bounded(value.reuseStoredConceptId, 320);
  if (!key || !KEY_PATTERN.test(key) || key === "problem") errors.push(`${path}:invalid-key`);
  if (!label) errors.push(`${path}:invalid-label`);
  if (!description) errors.push(`${path}:invalid-description`);
  if (
    supports.length < 1 ||
    supports.length > SYNTHESIS_PLAN_LIMITS.maxSupportConceptIds ||
    !supports.every((id) => grounding.eligibleStoredConceptIds.has(id))
  ) {
    errors.push(`${path}:invalid-support`);
  }
  if (value.reuseStoredConceptId !== null && !reuse) {
    errors.push(`${path}:invalid-reuse-id`);
  }
  if (reuse) {
    const concept = grounding.conceptsById.get(reuse);
    if (
      !concept ||
      !grounding.eligibleStoredConceptIds.has(reuse) ||
      !supports.includes(reuse) ||
      !allowedStages(kind).has(concept.stage)
    ) {
      errors.push(`${path}:invalid-reuse`);
    }
  }
  return key && label && description
    ? { key, label, description, supportConceptIds: supports, reuseStoredConceptId: reuse }
    : null;
}

function parsePlanArray(
  value: unknown,
  kind: "requirement" | "principle" | "feature" | "artifact" | "evaluation" | "outcome",
  minimum: number,
  maximum: number,
  grounding: NativeOkfDiagramGrounding,
  errors: string[],
  path: string,
): SynthesisPlanNode[] {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum) {
    errors.push(`${path}:invalid-count`);
    return [];
  }
  return value.flatMap((node, index) => {
    const parsed = parsePlanNode(node, kind, grounding, errors, `${path}[${index}]`);
    return parsed ? [parsed] : [];
  });
}

function graphErrors(
  plan: SynthesisPlan,
  errors: string[],
  requireRpfPath: boolean,
): void {
  const nodes = [
    ...plan.requirements,
    ...plan.principles,
    ...plan.features,
    ...plan.artifact,
    ...plan.evaluation,
    ...plan.outcome,
  ];
  const keys = new Set(["problem", ...nodes.map((node) => node.key)]);
  if (nodes.length === 0) errors.push("plan:missing-design-node");
  if (keys.size !== nodes.length + 1) errors.push("plan:duplicate-node-key");
  const semanticLabels = new Set<string>();
  for (const node of nodes) {
    const semanticLabel = normalize(node.label);
    if (semanticLabels.has(semanticLabel)) {
      errors.push("plan:duplicate-semantic-node");
    }
    semanticLabels.add(semanticLabel);
  }
  if (nodes.length + 1 > SYNTHESIS_PLAN_LIMITS.maxRenderedNodes) {
    errors.push("plan:too-many-rendered-nodes");
  }
  const adjacency = new Map([...keys].map((key) => [key, new Set<string>()]));
  const outgoing = new Map([...keys].map((key) => [key, new Set<string>()]));
  const stageRank = new Map<string, number>([["problem", 0]]);
  plan.requirements.forEach((node) => stageRank.set(node.key, 1));
  plan.principles.forEach((node) => stageRank.set(node.key, 2));
  plan.features.forEach((node) => stageRank.set(node.key, 3));
  plan.artifact.forEach((node) => stageRank.set(node.key, 4));
  plan.evaluation.forEach((node) => stageRank.set(node.key, 5));
  plan.outcome.forEach((node) => stageRank.set(node.key, 6));
  const relationshipKeys = new Set<string>();
  for (const relationship of plan.relationships) {
    if (!keys.has(relationship.sourceKey) || !keys.has(relationship.targetKey)) {
      errors.push("relationships:unknown-endpoint");
      continue;
    }
    if (relationship.sourceKey === relationship.targetKey) {
      errors.push("relationships:self-loop");
      continue;
    }
    const relationshipKey = JSON.stringify([
      relationship.sourceKey,
      relationship.targetKey,
      normalize(relationship.label),
    ]);
    if (relationshipKeys.has(relationshipKey)) {
      errors.push("relationships:duplicate");
      continue;
    }
    relationshipKeys.add(relationshipKey);
    const sourceRank = stageRank.get(relationship.sourceKey);
    const targetRank = stageRank.get(relationship.targetKey);
    if (
      sourceRank !== undefined &&
      targetRank !== undefined &&
      targetRank < sourceRank
    ) {
      errors.push("relationships:backward-stage-jump");
      continue;
    }
    adjacency.get(relationship.sourceKey)?.add(relationship.targetKey);
    adjacency.get(relationship.targetKey)?.add(relationship.sourceKey);
    outgoing.get(relationship.sourceKey)?.add(relationship.targetKey);
  }
  const visited = new Set(["problem"]);
  const queue = ["problem"];
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    for (const next of adjacency.get(queue[cursor]!) ?? []) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }
  if (visited.size !== keys.size) errors.push("plan:disconnected");
  const visiting = new Set<string>();
  const complete = new Set<string>();
  const cyclic = (key: string): boolean => {
    if (visiting.has(key)) return true;
    if (complete.has(key)) return false;
    visiting.add(key);
    for (const next of outgoing.get(key) ?? []) if (cyclic(next)) return true;
    visiting.delete(key);
    complete.add(key);
    return false;
  };
  if ([...keys].some(cyclic)) errors.push("plan:cycle");
  if (requireRpfPath) {
    const requirementKeys = new Set(plan.requirements.map((node) => node.key));
    const principleKeys = new Set(plan.principles.map((node) => node.key));
    const featureKeys = new Set(plan.features.map((node) => node.key));
    const hasPath = [...(outgoing.get("problem") ?? [])].some((requirement) =>
      requirementKeys.has(requirement) &&
      [...(outgoing.get(requirement) ?? [])].some((principle) =>
        principleKeys.has(principle) &&
        [...(outgoing.get(principle) ?? [])].some((feature) => featureKeys.has(feature))
      )
    );
    if (!hasPath) errors.push("plan:missing-rpf-path");
  }
}

export function validateNativeOkfSynthesisPlan(
  value: unknown,
  grounding: NativeOkfDiagramGrounding,
  options: { requireRpfPath?: boolean } = {},
): { ok: true; plan: SynthesisPlan } | { ok: false; errors: string[] } {
  const errors: string[] = [];
  if (!isRecord(value) || !onlyKeys(value, PLAN_KEYS)) {
    return { ok: false, errors: ["plan:invalid-shape"] };
  }
  const title = bounded(value.title, SYNTHESIS_PLAN_LIMITS.maxTitleCharacters);
  const problemSummary = bounded(
    value.problemSummary,
    SYNTHESIS_PLAN_LIMITS.maxProblemSummaryCharacters,
  );
  if (!title) errors.push("plan:invalid-title");
  if (!problemSummary) errors.push("plan:invalid-problem-summary");
  const requirements = parsePlanArray(
    value.requirements,
    "requirement",
    0,
    SYNTHESIS_PLAN_LIMITS.maxNodesPerStage,
    grounding,
    errors,
    "requirements",
  );
  const principles = parsePlanArray(
    value.principles,
    "principle",
    0,
    SYNTHESIS_PLAN_LIMITS.maxNodesPerStage,
    grounding,
    errors,
    "principles",
  );
  const features = parsePlanArray(
    value.features,
    "feature",
    0,
    SYNTHESIS_PLAN_LIMITS.maxNodesPerStage,
    grounding,
    errors,
    "features",
  );
  const artifact = parsePlanArray(
    value.artifact,
    "artifact",
    0,
    SYNTHESIS_PLAN_LIMITS.maxNodesPerStage,
    grounding,
    errors,
    "artifact",
  );
  const evaluation = parsePlanArray(
    value.evaluation,
    "evaluation",
    0,
    SYNTHESIS_PLAN_LIMITS.maxNodesPerStage,
    grounding,
    errors,
    "evaluation",
  );
  const outcome = parsePlanArray(
    value.outcome,
    "outcome",
    0,
    SYNTHESIS_PLAN_LIMITS.maxNodesPerStage,
    grounding,
    errors,
    "outcome",
  );
  const relationships: SynthesisPlanRelationship[] = [];
  if (
    !Array.isArray(value.relationships) ||
    value.relationships.length < 1 ||
    value.relationships.length > SYNTHESIS_PLAN_LIMITS.maxRelationships
  ) {
    errors.push("relationships:invalid-count");
  } else {
    value.relationships.forEach((item, index) => {
      if (!isRecord(item) || !onlyKeys(item, RELATIONSHIP_KEYS)) {
        errors.push(`relationships[${index}]:invalid-shape`);
        return;
      }
      const sourceKey = bounded(item.sourceKey, SYNTHESIS_PLAN_LIMITS.maxKeyCharacters);
      const targetKey = bounded(item.targetKey, SYNTHESIS_PLAN_LIMITS.maxKeyCharacters);
      const label = bounded(item.label, SYNTHESIS_PLAN_LIMITS.maxRelationshipLabelCharacters);
      const supportConceptIds = Array.isArray(item.supportConceptIds)
        ? [...new Set(item.supportConceptIds.flatMap((support) => {
            const id = bounded(support, 320);
            return id ? [id] : [];
          }))]
        : [];
      if (
        !sourceKey ||
        !targetKey ||
        !label ||
        supportConceptIds.length < 1 ||
        supportConceptIds.length > SYNTHESIS_PLAN_LIMITS.maxSupportConceptIds ||
        !supportConceptIds.every((id) =>
          grounding.eligibleStoredConceptIds.has(id)
        )
      ) {
        errors.push(`relationships[${index}]:invalid-value`);
        return;
      }
      relationships.push({
        sourceKey,
        targetKey,
        label,
        supportConceptIds,
      });
    });
  }
  if (!title || !problemSummary) return { ok: false, errors };
  const plan: SynthesisPlan = {
    title,
    problemSummary,
    requirements,
    principles,
    features,
    artifact,
    evaluation,
    outcome,
    relationships,
  };
  graphErrors(plan, errors, options.requireRpfPath === true);
  return errors.length > 0
    ? { ok: false, errors: [...new Set(errors)] }
    : { ok: true, plan };
}

function truncate(value: string, maximum: number): string {
  const normalized = sanitizeGeneratedProse(value).replace(/\s+/gu, " ").trim();
  return normalized.length <= maximum
    ? normalized
    : normalized.slice(0, maximum - 3).trimEnd() + "...";
}

function planNodes(plan: SynthesisPlan): Array<{
  node: SynthesisPlanNode;
  stage: DiagramStage;
  order: number;
  category: string;
}> {
  return [
    ...plan.requirements.map((node) => ({
      node,
      stage: "design-requirement" as const,
      order: 20,
      category: "Design requirement",
    })),
    ...plan.principles.map((node) => ({
      node,
      stage: "design-principle" as const,
      order: 40,
      category: "Design principle",
    })),
    ...plan.features.map((node) => ({
      node,
      stage: "design-feature" as const,
      order: 60,
      category: "Design feature",
    })),
    ...plan.artifact.map((node) => ({ node, stage: "artifact" as const, order: 75, category: "Artifact" })),
    ...plan.evaluation.map((node) => ({ node, stage: "evaluation" as const, order: 85, category: "Evaluation" })),
    ...plan.outcome.map((node) => ({ node, stage: "outcome" as const, order: 95, category: "Outcome" })),
  ];
}

function convertedNode(
  entry: ReturnType<typeof planNodes>[number],
  grounding: NativeOkfDiagramGrounding,
): GeneratedDiagramNode {
  const stored = entry.node.reuseStoredConceptId
    ? grounding.conceptsById.get(entry.node.reuseStoredConceptId)
    : undefined;
  if (stored) {
    return {
      id: `plan-${entry.node.key}`,
      label: truncate(stored.title, 90),
      description: truncate(stored.description || stored.title, 300),
      category: truncate(formatConceptType(stored.type), 40),
      stage: stored.stage,
      order: entry.order,
      group: null,
      provenance: "stored",
      sourcePaths: [stored.conceptId],
      supportConceptIds: [stored.conceptId],
      synthesisRationale: null,
      synthesis: false,
    };
  }
  const supportingTitles = entry.node.supportConceptIds
    .flatMap((id) => {
      const concept = grounding.conceptsById.get(id);
      return concept ? [concept.title] : [];
    })
    .slice(0, 3);
  return {
    id: `plan-${entry.node.key}`,
    label: truncate(entry.node.label, 90),
    description: truncate(entry.node.description, 300),
    category: entry.category,
    stage: entry.stage,
    order: entry.order,
    group: null,
    provenance: "synthesized",
    sourcePaths: [...entry.node.supportConceptIds],
    supportConceptIds: [...entry.node.supportConceptIds],
    synthesisRationale:
      truncate(
        supportingTitles.length > 0
          ? `This problem-specific proposal adapts the stored concepts ${supportingTitles.join("; ")}.`
          : "This problem-specific proposal is grounded by the listed stored concepts.",
        240,
      ),
    synthesis: true,
  };
}

function exactStoredRelation(
  source: GeneratedDiagramNode,
  target: GeneratedDiagramNode,
  grounding: NativeOkfDiagramGrounding,
) {
  if (source.provenance !== "stored" || target.provenance !== "stored") return undefined;
  return grounding.storedRelations.find((relation) =>
    relation.sourceId === source.supportConceptIds[0] &&
    relation.targetId === target.supportConceptIds[0]
  );
}

function uniqueSupport(...groups: readonly string[][]): string[] {
  return [...new Set(groups.flat())].slice(0, SYNTHESIS_PLAN_LIMITS.maxSupportConceptIds);
}

export function createNativeOkfSynthesisProblemNode(
  validatedProblemStatement: string,
): GeneratedDiagramNode {
  const display = synthesisProblemNodeDisplay(validatedProblemStatement);
  return {
    id: "user-problem",
    label: display.label,
    description: display.description,
    category: "User problem",
    stage: "problem",
    order: 0,
    group: null,
    provenance: "user-provided",
    sourcePaths: [],
    supportConceptIds: [],
    synthesisRationale: null,
    synthesis: false,
  };
}

export function convertNativeOkfSynthesisPlan(
  plan: SynthesisPlan,
  grounding: NativeOkfDiagramGrounding,
  validatedProblemStatement: string = plan.problemSummary,
  requireRpfPath = false,
): { diagram: GeneratedDiagram; usedSupportConceptIds: string[] } | null {
  const problem = createNativeOkfSynthesisProblemNode(
    validatedProblemStatement,
  );
  const problemDisplay = synthesisProblemNodeDisplay(
    validatedProblemStatement,
  );
  const nodes = [problem, ...planNodes(plan).map((entry) => convertedNode(entry, grounding))];
  const byKey = new Map<string, GeneratedDiagramNode>([["problem", problem]]);
  planNodes(plan).forEach((entry, index) => byKey.set(entry.node.key, nodes[index + 1]!));
  const edges: GeneratedDiagramEdge[] = plan.relationships.flatMap<GeneratedDiagramEdge>((relationship) => {
    const source = byKey.get(relationship.sourceKey);
    const target = byKey.get(relationship.targetKey);
    if (!source || !target) return [];
    const stored = exactStoredRelation(source, target, grounding);
    if (stored) {
      return [{
        source: source.id,
        target: target.id,
        label: truncate(stored.label, 32),
        provenance: "stored" as const,
        supportConceptIds: [source.supportConceptIds[0]!, target.supportConceptIds[0]!],
      }];
    }
    const supportConceptIds = uniqueSupport(
      relationship.supportConceptIds,
      source.supportConceptIds,
      target.supportConceptIds,
    );
    if (supportConceptIds.length === 0) return [];
    return [{
      source: source.id,
      target: target.id,
      label: truncate(relationship.label, 32),
      provenance: "synthesized" as const,
      supportConceptIds,
    }];
  });
  const candidate: GeneratedDiagram = {
    title: `Grounded proposal: ${problemDisplay.label}`,
    explanation:
      "A problem-specific grounded synthesis. Dashed elements are proposed adaptations; solid elements are exact stored native OKF knowledge.",
    nodes,
    edges,
  };
  const validation = validateGeneratedDiagram(candidate, grounding, {
    mode: "synthesized",
    requireRpfPath,
    requireDisplayedStoredSupport: false,
  });
  if (!validation.ok) return null;
  const frequency = new Map<string, number>();
  for (const node of validation.diagram.nodes) {
    for (const id of node.supportConceptIds) frequency.set(id, (frequency.get(id) ?? 0) + 1);
  }
  for (const edge of validation.diagram.edges) {
    for (const id of edge.supportConceptIds) frequency.set(id, (frequency.get(id) ?? 0) + 1);
  }
  const usedSupportConceptIds = [...frequency]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0], "en"))
    .map(([id]) => id);
  return { diagram: validation.diagram, usedSupportConceptIds };
}

export function deterministicNativeOkfSynthesisSummary(
  plan: SynthesisPlan,
  diagram: GeneratedDiagram,
): string {
  const stored = diagram.nodes.filter((node) => node.provenance === "stored").length;
  const proposed = diagram.nodes.filter((node) => node.provenance === "synthesized").length;
  const supportCount = new Set(
    diagram.nodes.flatMap((node) => node.supportConceptIds),
  ).size;
  const optional = plan.artifact.length + plan.evaluation.length + plan.outcome.length;
  const boundedProblem = synthesisProblemSummaryPhrase(plan.problemSummary)
    .split(/\s+/u)
    .slice(0, 20)
    .join(" ");
  return `This grounded proposal addresses ${boundedProblem}. It connects ${plan.requirements.length} requirements, ${plan.principles.length} principles, and ${plan.features.length} features${optional > 0 ? ` with ${optional} downstream artifact, evaluation, or outcome element${optional === 1 ? "" : "s"}` : ""}. ${stored} element${stored === 1 ? " reuses" : "s reuse"} exact stored knowledge; ${proposed} ${proposed === 1 ? "is a synthesized adaptation" : "are synthesized adaptations"}. Dashed elements are proposals supported by the listed sources, not claims of stored theory. The flow uses ${supportCount} current-turn stored support concept${supportCount === 1 ? "" : "s"}.`;
}

function compactGrounding(grounding: NativeOkfDiagramGrounding) {
  return [...grounding.conceptsById.values()]
    .filter((concept) => grounding.eligibleStoredConceptIds.has(concept.conceptId))
    .sort((left, right) => left.conceptId.localeCompare(right.conceptId, "en"))
    .map((concept) => ({
      conceptId: concept.conceptId,
      title: truncate(concept.title, 90),
      description: truncate(concept.description, 300),
      type: concept.type,
    }));
}

function compactPriorDraft(draft: SynthesisDraftState | null) {
  if (!draft) return null;
  return {
    problemStatement: truncate(draft.problemStatement, 300),
    domain: draft.domain,
    objective: draft.objective,
    constraints: draft.constraints,
    nodes: draft.nodes.map((node) => ({
      label: truncate(node.label, 90),
      description: truncate(node.description, 300),
      supportConceptIds: node.supportConceptIds,
      reuseStoredConceptId: node.provenance === "stored"
        ? node.supportConceptIds[0] ?? null
        : null,
    })),
    relationships: draft.edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
      label: edge.label,
    })),
  };
}

export function buildNativeOkfSynthesisPlanInput(
  options: GenerateNativeOkfSynthesisPlanOptions,
  repairErrors?: readonly string[],
): string {
  const payload = {
    problem: truncate(options.problemStatement, 300),
    refinementRequest: truncate(options.refinementRequest, 500),
    domain: options.domain,
    objective: options.objective,
    constraints: options.constraints.slice(0, 6).map((value) => truncate(value, 200)),
    allowlistedConcepts: compactGrounding(options.grounding),
    priorValidatedDraft: repairErrors ? undefined : compactPriorDraft(options.priorDraft),
    ...(repairErrors
      ? { validationErrors: [...new Set(repairErrors)].slice(0, MAX_REPAIR_ERRORS) }
      : {}),
  };
  return JSON.stringify(payload);
}

function refused(response: Response): boolean {
  return response.output.some((item) =>
    item.type === "message" && item.content.some((part) => part.type === "refusal")
  );
}

function parseResponse(
  response: Response,
  grounding: NativeOkfDiagramGrounding,
  requireRpfPath: boolean,
): { ok: true; plan: SynthesisPlan } | { ok: false; errors: string[] } {
  if (refused(response)) return { ok: false, errors: ["response:refused"] };
  if (response.status === "incomplete") return { ok: false, errors: ["response:incomplete"] };
  const raw = response.output_text?.trim() ?? "";
  if (!raw) return { ok: false, errors: ["response:empty"] };
  try {
    return validateNativeOkfSynthesisPlan(
      JSON.parse(raw) as unknown,
      grounding,
      { requireRpfPath },
    );
  } catch {
    return { ok: false, errors: ["response:invalid-json"] };
  }
}

async function createPlanResponse(
  options: GenerateNativeOkfSynthesisPlanOptions,
  repairErrors?: readonly string[],
): Promise<Response> {
  return options.client.responses.create({
    model: options.environment.model,
    instructions: NATIVE_OKF_SYNTHESIS_PLAN_INSTRUCTIONS,
    input: buildNativeOkfSynthesisPlanInput(options, repairErrors),
    reasoning: { effort: options.environment.reasoningEffort },
    max_output_tokens: options.environment.diagramMaxOutputTokens,
    text: { format: SYNTHESIS_PLAN_RESPONSE_FORMAT },
    tools: [],
    tool_choice: "none",
    parallel_tool_calls: false,
    store: false,
  });
}

export async function generateNativeOkfSynthesisPlan(
  options: GenerateNativeOkfSynthesisPlanOptions,
): Promise<GeneratedNativeOkfSynthesisPlan> {
  if (options.priorDraft) {
    const { generateNativeOkfSynthesisRefinement } = await import(
      "./synthesis-refinement.ts"
    );
    const refinement = await generateNativeOkfSynthesisRefinement({
      client: options.client,
      environment: options.environment,
      refinementRequest: options.refinementRequest,
      problemStatement: options.problemStatement,
      grounding: options.grounding,
      priorDraft: options.priorDraft,
      requireRpfPath: options.requireRpfPath === true,
    });
    if ("diagram" in refinement) {
      return {
        diagram: refinement.diagram,
        usedSupportConceptIds: refinement.usedSupportConceptIds,
        deterministicSummary: refinement.deterministicSummary,
        warnings: refinement.warnings,
      };
    }
    return {
      usedSupportConceptIds: [],
      warnings: [],
      diagnosticCode: "synthesis-plan-repair-failed",
    };
  }
  const first = parseResponse(
    await createPlanResponse(options),
    options.grounding,
    options.requireRpfPath === true,
  );
  if (first.ok) {
    const acceptedPlan = {
      ...first.plan,
      problemSummary: truncate(options.problemStatement, 300),
    };
    const converted = convertNativeOkfSynthesisPlan(
      acceptedPlan,
      options.grounding,
      options.problemStatement,
      options.requireRpfPath === true,
    );
    if (converted) {
      return {
        plan: acceptedPlan,
        diagram: converted.diagram,
        usedSupportConceptIds: converted.usedSupportConceptIds,
        deterministicSummary: deterministicNativeOkfSynthesisSummary(acceptedPlan, converted.diagram),
        warnings: [],
      };
    }
  }
  const firstErrors = first.ok ? ["plan:conversion-invalid"] : first.errors;
  const second = parseResponse(
    await createPlanResponse(options, firstErrors),
    options.grounding,
    options.requireRpfPath === true,
  );
  if (second.ok) {
    const acceptedPlan = {
      ...second.plan,
      problemSummary: truncate(options.problemStatement, 300),
    };
    const converted = convertNativeOkfSynthesisPlan(
      acceptedPlan,
      options.grounding,
      options.problemStatement,
      options.requireRpfPath === true,
    );
    if (converted) {
      return {
        plan: acceptedPlan,
        diagram: converted.diagram,
        usedSupportConceptIds: converted.usedSupportConceptIds,
        deterministicSummary: deterministicNativeOkfSynthesisSummary(acceptedPlan, converted.diagram),
        warnings: ["The synthesis plan required one bounded repair."],
      };
    }
  }
  return {
    usedSupportConceptIds: [],
    warnings: [],
    diagnosticCode: "synthesis-plan-repair-failed",
  };
}
