import {
  DIAGRAM_EDGE_PROVENANCE,
  DIAGRAM_NODE_PROVENANCE,
  GENERATED_DIAGRAM_STAGES,
  MAX_NATIVE_OKF_SYNTHESIS_CONSTRAINT_CHARACTERS,
  MAX_NATIVE_OKF_SYNTHESIS_CONSTRAINTS,
  MAX_NATIVE_OKF_SYNTHESIS_DOMAIN_CHARACTERS,
  MAX_NATIVE_OKF_SYNTHESIS_OBJECTIVE_CHARACTERS,
  MAX_NATIVE_OKF_SYNTHESIS_PROBLEM_CHARACTERS,
  type DiagramEdgeProvenance,
  type DiagramNodeProvenance,
  type DiagramStage,
  type GeneratedDiagramEdge,
  type GeneratedDiagramNode,
  type SynthesisDraftState,
  type SynthesisProblemState,
} from "./chat-types.ts";

const DRAFT_KEYS = new Set([
  "version",
  "problemStatement",
  "domain",
  "objective",
  "constraints",
  "nodes",
  "edges",
]);
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
const EDGE_KEYS = new Set([
  "source",
  "target",
  "label",
  "provenance",
  "supportConceptIds",
]);

const MAX_DRAFT_NODES = 14;
const MAX_DRAFT_EDGES = 20;
const MAX_ID_CHARACTERS = 64;
const MAX_LABEL_CHARACTERS = 100;
const MAX_DESCRIPTION_CHARACTERS = 360;
const MAX_CATEGORY_CHARACTERS = 40;
const MAX_GROUP_CHARACTERS = 40;
const MAX_SOURCE_ID_CHARACTERS = 320;
const MAX_SUPPORT_IDS = 3;
const MAX_RATIONALE_CHARACTERS = 240;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(
  value: Record<string, unknown>,
  allowed: ReadonlySet<string>,
): boolean {
  return Object.keys(value).every((key) => allowed.has(key));
}

function sanitize(value: string): string {
  return value
    .replace(/\u0000/gu, "")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/gu, "")
    .replace(/\r\n?/gu, "\n")
    .trim();
}

function boundedString(value: unknown, maximum: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = sanitize(value);
  return normalized !== "" && normalized.length <= maximum ? normalized : null;
}

function nullableBoundedString(value: unknown, maximum: number): string | null | undefined {
  if (value === null) return null;
  return boundedString(value, maximum) ?? undefined;
}

function boundedStrings(
  value: unknown,
  maximumItems: number,
  maximumCharacters: number,
  allowEmpty = false,
): string[] | null {
  if (!Array.isArray(value) || value.length > maximumItems) return null;
  const result: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    const normalized = boundedString(item, maximumCharacters);
    if (!normalized) return null;
    if (!seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }
  return allowEmpty || result.length > 0 ? result : null;
}

function isStage(value: unknown): value is DiagramStage {
  return typeof value === "string" &&
    GENERATED_DIAGRAM_STAGES.some((candidate) => candidate === value);
}

function isNodeProvenance(value: unknown): value is DiagramNodeProvenance {
  return typeof value === "string" &&
    DIAGRAM_NODE_PROVENANCE.some((candidate) => candidate === value);
}

function isEdgeProvenance(value: unknown): value is DiagramEdgeProvenance {
  return typeof value === "string" &&
    DIAGRAM_EDGE_PROVENANCE.some((candidate) => candidate === value);
}

function parseNode(value: unknown): GeneratedDiagramNode | null {
  if (!isRecord(value) || !hasOnlyKeys(value, NODE_KEYS)) return null;
  const id = boundedString(value.id, MAX_ID_CHARACTERS);
  const label = boundedString(value.label, MAX_LABEL_CHARACTERS);
  const description = boundedString(value.description, MAX_DESCRIPTION_CHARACTERS);
  const category = boundedString(value.category, MAX_CATEGORY_CHARACTERS);
  const group = nullableBoundedString(value.group, MAX_GROUP_CHARACTERS);
  const rationale = nullableBoundedString(
    value.synthesisRationale,
    MAX_RATIONALE_CHARACTERS,
  );
  const sourcePaths = boundedStrings(
    value.sourcePaths,
    MAX_SUPPORT_IDS,
    MAX_SOURCE_ID_CHARACTERS,
    true,
  );
  const supportConceptIds = boundedStrings(
    value.supportConceptIds,
    MAX_SUPPORT_IDS,
    MAX_SOURCE_ID_CHARACTERS,
    true,
  );
  const order = value.order;
  if (
    !id ||
    !label ||
    !description ||
    !category ||
    !isStage(value.stage) ||
    !Number.isInteger(order) ||
    (order as number) < 0 ||
    (order as number) > 100 ||
    group === undefined ||
    !isNodeProvenance(value.provenance) ||
    sourcePaths === null ||
    supportConceptIds === null ||
    rationale === undefined ||
    typeof value.synthesis !== "boolean" ||
    value.synthesis !== (value.provenance === "synthesized")
  ) {
    return null;
  }
  if (
    value.provenance === "user-provided" &&
    (sourcePaths.length > 0 || supportConceptIds.length > 0)
  ) {
    return null;
  }
  if (
    value.provenance !== "user-provided" &&
    (sourcePaths.length === 0 || supportConceptIds.length === 0)
  ) {
    return null;
  }
  return {
    id,
    label,
    description,
    category,
    stage: value.stage,
    order: order as number,
    group,
    provenance: value.provenance,
    sourcePaths,
    supportConceptIds,
    synthesisRationale: rationale,
    synthesis: value.synthesis,
  };
}

function parseEdge(
  value: unknown,
  nodeIds: ReadonlySet<string>,
): GeneratedDiagramEdge | null {
  if (!isRecord(value) || !hasOnlyKeys(value, EDGE_KEYS)) return null;
  const source = boundedString(value.source, MAX_ID_CHARACTERS);
  const target = boundedString(value.target, MAX_ID_CHARACTERS);
  const label = typeof value.label === "string"
    ? sanitize(value.label)
    : "";
  const supportConceptIds = boundedStrings(
    value.supportConceptIds,
    MAX_SUPPORT_IDS,
    MAX_SOURCE_ID_CHARACTERS,
    true,
  );
  if (
    !source ||
    !target ||
    source === target ||
    !nodeIds.has(source) ||
    !nodeIds.has(target) ||
    label.length > 32 ||
    !isEdgeProvenance(value.provenance) ||
    supportConceptIds === null
  ) {
    return null;
  }
  if (
    (value.provenance === "stored" && supportConceptIds.length !== 2) ||
    (value.provenance === "synthesized" && supportConceptIds.length === 0)
  ) {
    return null;
  }
  return {
    source,
    target,
    label,
    provenance: value.provenance,
    supportConceptIds,
  };
}

export function parseSynthesisProblemState(
  value: unknown,
): SynthesisProblemState | null {
  if (!isRecord(value) || value.version !== 1) return null;
  const allowed = new Set([
    "version",
    "problemStatement",
    "domain",
    "objective",
    "outputType",
    "constraints",
    "sourcePaperSlugs",
  ]);
  if (!hasOnlyKeys(value, allowed)) return null;
  const problemStatement = boundedString(
    value.problemStatement,
    MAX_NATIVE_OKF_SYNTHESIS_PROBLEM_CHARACTERS,
  );
  const domain = nullableBoundedString(
    value.domain,
    MAX_NATIVE_OKF_SYNTHESIS_DOMAIN_CHARACTERS,
  );
  const objective = nullableBoundedString(
    value.objective,
    MAX_NATIVE_OKF_SYNTHESIS_OBJECTIVE_CHARACTERS,
  );
  const constraints = boundedStrings(
    value.constraints,
    MAX_NATIVE_OKF_SYNTHESIS_CONSTRAINTS,
    MAX_NATIVE_OKF_SYNTHESIS_CONSTRAINT_CHARACTERS,
    true,
  );
  const outputType = value.outputType === undefined || value.outputType === null
    ? null
    : value.outputType === "design-solution" ||
        value.outputType === "explanatory-theory"
      ? value.outputType
      : undefined;
  const sourcePaperSlugs = value.sourcePaperSlugs === undefined
    ? []
    : boundedStrings(value.sourcePaperSlugs, 3, 256, true);
  if (
    !problemStatement ||
    domain === undefined ||
    objective === undefined ||
    constraints === null ||
    outputType === undefined ||
    sourcePaperSlugs === null
  ) {
    return null;
  }
  return {
    version: 1,
    problemStatement,
    domain,
    objective,
    outputType,
    constraints,
    sourcePaperSlugs,
  };
}

export function parseSynthesisDraftState(
  value: unknown,
): SynthesisDraftState | null {
  if (!isRecord(value) || !hasOnlyKeys(value, DRAFT_KEYS) || value.version !== 1) {
    return null;
  }
  const problemStatement = boundedString(
    value.problemStatement,
    MAX_NATIVE_OKF_SYNTHESIS_PROBLEM_CHARACTERS,
  );
  const domain = nullableBoundedString(
    value.domain,
    MAX_NATIVE_OKF_SYNTHESIS_DOMAIN_CHARACTERS,
  );
  const objective = nullableBoundedString(
    value.objective,
    MAX_NATIVE_OKF_SYNTHESIS_OBJECTIVE_CHARACTERS,
  );
  const constraints = boundedStrings(
    value.constraints,
    MAX_NATIVE_OKF_SYNTHESIS_CONSTRAINTS,
    MAX_NATIVE_OKF_SYNTHESIS_CONSTRAINT_CHARACTERS,
    true,
  );
  if (
    !problemStatement ||
    domain === undefined ||
    objective === undefined ||
    constraints === null ||
    !Array.isArray(value.nodes) ||
    value.nodes.length > MAX_DRAFT_NODES ||
    !Array.isArray(value.edges) ||
    value.edges.length > MAX_DRAFT_EDGES
  ) {
    return null;
  }

  const nodes = value.nodes.flatMap((node) => {
    const parsed = parseNode(node);
    return parsed ? [parsed] : [];
  });
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = value.edges.flatMap((edge) => {
    const parsed = parseEdge(edge, nodeIds);
    return parsed ? [parsed] : [];
  });
  if (nodes.length === 0) return null;

  return {
    version: 1,
    problemStatement,
    domain,
    objective,
    constraints,
    nodes,
    edges,
  };
}

