import {
  okfConceptTypes,
  type OkfConcept,
  type OkfConceptType,
  type OkfGraphSourceReference,
  type OkfRelation,
  type OkfSourceView
} from "./schema.ts";
import { validateSourceViews } from "./source-view-validator.ts";

export type CanonicalFlowProjectionMode = "source_figure" | "recommended" | "full";
export type CanonicalFlowProjectionSource =
  | "source_view"
  | "graph_json_recommended_paths"
  | "okf_stored_relations_projection"
  | "okf_stored_relations";

export type CanonicalFlowBundle = {
  paper_id: string;
  concepts: readonly OkfConcept[];
  relations: readonly OkfRelation[];
  recommended_paths?: readonly (readonly string[])[];
  source_views?: readonly OkfSourceView[];
  graph_source_reference?: OkfGraphSourceReference | null;
};

export type ProjectedFlowNode = {
  id: string;
  paper_id: string;
  type: OkfConceptType;
  title: string;
  description: string;
  evidence_ids: string[];
  confidence: OkfConcept["confidence"];
  extraction_type: OkfConcept["extraction_type"];
  review_status: OkfConcept["review_status"];
};

export type ProjectedFlowEdgeProvenance =
  | "source_view_explicit"
  | "explicit"
  | "explicit_in_artifact"
  | "inferred"
  | "query_generated";

export type ProjectedFlowEdge = {
  id: string;
  source: string;
  target: string;
  predicate: string;
  evidence_ids: string[];
  confidence: OkfRelation["confidence"];
  extraction_type: OkfRelation["extraction_type"];
  relation_scope: OkfRelation["relation_scope"];
  provenance: ProjectedFlowEdgeProvenance;
  source_view_ids: string[];
};

export type ProjectedFlow = {
  mode: CanonicalFlowProjectionMode;
  title: string;
  subtitle: string;
  projection_source: CanonicalFlowProjectionSource;
  source_view_id: string | null;
  source_reference: OkfSourceView["source_reference"] | OkfGraphSourceReference | null;
  nodes: ProjectedFlowNode[];
  edges: ProjectedFlowEdge[];
  layers: OkfConceptType[];
  ordered_node_ids: string[];
  node_order: Partial<Record<OkfConceptType, string[]>>;
  evidence_ids: string[];
  validation: {
    structurally_valid: boolean;
    semantic_status: OkfSourceView["source_reference"]["validation_status"] | "not_applicable";
    visual_parity: OkfSourceView["layout"]["visual_parity"] | "not_applicable";
  };
  warnings: string[];
  layout_hints: {
    direction: OkfSourceView["layout"]["direction"];
    preserve_source_order: boolean;
  };
};

export type FlowViewRequest =
  | { mode: "source_figure"; source_view_id?: string }
  | { mode: "recommended" }
  | { mode: "full" };

const conceptTypeOrder = new Map(okfConceptTypes.map((type, index) => [type, index]));

export function getAvailableSourceViews(bundle: CanonicalFlowBundle): OkfSourceView[] {
  return (bundle.source_views ?? [])
    .filter((view) => sourceViewInputErrors(bundle, view).length === 0)
    .map(cloneSourceView);
}

export function projectSourceView(bundle: CanonicalFlowBundle, sourceViewId?: string): ProjectedFlow {
  const available = getAvailableSourceViews(bundle);
  const sourceView = sourceViewId
    ? available.find((candidate) => candidate.source_view_id === sourceViewId)
    : available[0];
  if (!sourceView) {
    throw new Error(sourceViewId
      ? `Source view ${sourceViewId} is unavailable or structurally invalid.`
      : "No structurally valid source view is available.");
  }

  const conceptById = new Map(bundle.concepts.map((concept) => [concept.concept_id, concept]));
  const relationById = new Map(bundle.relations.map((relation) => [relation.relation_id, relation]));
  const orderedNodeIds = sourceView.ordering.layer_order.flatMap(
    (layer) => sourceView.ordering.node_order[layer] ?? []
  );
  const relations = sourceView.edge_ids.map((id) => relationById.get(id)).filter(isPresent);
  const nodes = orderedNodeIds.map((id) => conceptById.get(id)).filter(isPresent).map(projectNode);

  const projected: ProjectedFlow = {
    mode: "source_figure",
    title: sourceView.title,
    subtitle: "Stored formal source mapping",
    projection_source: "source_view",
    source_view_id: sourceView.source_view_id,
    source_reference: structuredClone(sourceView.source_reference),
    nodes,
    edges: relations.map((relation) => projectEdge(relation, bundle.source_views ?? [], sourceView.source_view_id)),
    layers: [...sourceView.ordering.layer_order],
    ordered_node_ids: [...orderedNodeIds],
    node_order: cloneNodeOrder(sourceView.ordering.node_order),
    evidence_ids: unique([...nodes.flatMap((node) => node.evidence_ids), ...relations.flatMap(relationEvidenceIds)]),
    validation: {
      structurally_valid: true,
      semantic_status: sourceView.source_reference.validation_status,
      visual_parity: sourceView.layout.visual_parity
    },
    warnings: [],
    layout_hints: {
      direction: sourceView.layout.direction,
      preserve_source_order: true
    }
  };
  const projectionErrors = validateProjectedFlow(projected);
  if (projectionErrors.length) {
    throw new Error(`Source view ${sourceView.source_view_id} is unavailable because its projection is invalid: ${projectionErrors.join(" ")}`);
  }
  return projected;
}

export function projectRecommendedFlow(bundle: CanonicalFlowBundle): ProjectedFlow {
  const storedRelations = storedRelationsForBundle(bundle);
  const conceptById = new Map(bundle.concepts.map((concept) => [concept.concept_id, concept]));
  const relationByPair = groupRelationsByPair(storedRelations);
  const warnings: string[] = [];
  let selectedRelations: OkfRelation[] = [];
  let projectionSource: CanonicalFlowProjectionSource = "okf_stored_relations_projection";

  if (bundle.recommended_paths?.length) {
    projectionSource = "graph_json_recommended_paths";
    const selectedIds = new Set<string>();
    for (const path of bundle.recommended_paths) {
      for (let index = 0; index < path.length - 1; index += 1) {
        const source = resolveConceptId(path[index], conceptById);
        const target = resolveConceptId(path[index + 1], conceptById);
        if (!source || !target) {
          warnings.push(`Recommended path contains an unresolved concept pair: ${path[index]} -> ${path[index + 1]}.`);
          continue;
        }
        const matches = relationByPair.get(pairKey(source, target)) ?? [];
        if (!matches.length) {
          warnings.push(`Recommended path has no stored relation for ${source} -> ${target}.`);
          continue;
        }
        matches.forEach((relation) => selectedIds.add(relation.relation_id));
      }
    }
    selectedRelations = storedRelations.filter((relation) => selectedIds.has(relation.relation_id));
  }

  if (!selectedRelations.length) {
    selectedRelations = selectReadableStoredPathways(bundle.concepts, storedRelations);
    projectionSource = "okf_stored_relations_projection";
    if (bundle.recommended_paths?.length) {
      warnings.push("Stored recommended paths could not be projected completely; using a deterministic stored-relations pathway.");
    }
  }

  return projectionFromRelations({
    bundle,
    relations: selectedRelations,
    mode: "recommended",
    title: "Recommended Flow",
    subtitle: "Recommended stored pathway",
    projectionSource,
    sourceReference: null,
    warnings,
    preserveSourceOrder: false
  });
}

export function projectFullRelations(bundle: CanonicalFlowBundle): ProjectedFlow {
  return projectionFromRelations({
    bundle,
    relations: storedRelationsForBundle(bundle),
    mode: "full",
    title: "Full Relations / Advanced",
    subtitle: "Canonical OKF relations",
    projectionSource: "okf_stored_relations",
    sourceReference: null,
    warnings: [],
    preserveSourceOrder: false
  });
}

export function resolveFlowView(bundle: CanonicalFlowBundle, request: FlowViewRequest): ProjectedFlow {
  if (request.mode === "source_figure") return projectSourceView(bundle, request.source_view_id);
  if (request.mode === "full") return projectFullRelations(bundle);
  return projectRecommendedFlow(bundle);
}

export function validateProjectedFlow(flow: ProjectedFlow): string[] {
  const errors: string[] = [];
  const nodeIds = new Set(flow.nodes.map((node) => node.id));
  if (nodeIds.size !== flow.nodes.length) errors.push("Projection contains duplicate node IDs.");
  const edgeIds = new Set(flow.edges.map((edge) => edge.id));
  if (edgeIds.size !== flow.edges.length) errors.push("Projection contains duplicate edge IDs.");
  for (const edge of flow.edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      errors.push(`Projection edge ${edge.id} has an endpoint outside the projected node set.`);
    }
    if (flow.mode === "source_figure" && ["inferred", "query_generated"].includes(edge.provenance)) {
      errors.push(`Source Figure edge ${edge.id} has unsupported provenance ${edge.provenance}.`);
    }
  }
  if (flow.ordered_node_ids.length !== nodeIds.size || flow.ordered_node_ids.some((id) => !nodeIds.has(id))) {
    errors.push("Projection ordering does not contain each projected node exactly once.");
  }
  return unique(errors);
}

function projectionFromRelations(input: {
  bundle: CanonicalFlowBundle;
  relations: OkfRelation[];
  mode: "recommended" | "full";
  title: string;
  subtitle: string;
  projectionSource: CanonicalFlowProjectionSource;
  sourceReference: OkfGraphSourceReference | null;
  warnings: string[];
  preserveSourceOrder: boolean;
}): ProjectedFlow {
  const connectedIds = new Set(input.relations.flatMap((relation) => [relation.source_concept_id, relation.target_concept_id]));
  const concepts = input.bundle.concepts
    .filter((concept) => connectedIds.has(concept.concept_id))
    .slice()
    .sort(compareConcepts);
  const layers = unique(concepts.map((concept) => concept.type)).sort(compareConceptTypes);
  const nodeOrder = Object.fromEntries(layers.map((layer) => [
    layer,
    concepts.filter((concept) => concept.type === layer).map((concept) => concept.concept_id)
  ])) as Partial<Record<OkfConceptType, string[]>>;
  const nodes = concepts.map(projectNode);
  const edges = input.relations.slice().sort(compareRelations).map((relation) => projectEdge(relation, input.bundle.source_views ?? []));
  const projected: ProjectedFlow = {
    mode: input.mode,
    title: input.title,
    subtitle: input.subtitle,
    projection_source: input.projectionSource,
    source_view_id: null,
    source_reference: input.sourceReference,
    nodes,
    edges,
    layers,
    ordered_node_ids: layers.flatMap((layer) => nodeOrder[layer] ?? []),
    node_order: nodeOrder,
    evidence_ids: unique([...nodes.flatMap((node) => node.evidence_ids), ...input.relations.flatMap(relationEvidenceIds)]),
    validation: {
      structurally_valid: true,
      semantic_status: "not_applicable",
      visual_parity: "not_applicable"
    },
    warnings: [...input.warnings],
    layout_hints: {
      direction: "LEFT_TO_RIGHT",
      preserve_source_order: input.preserveSourceOrder
    }
  };
  const errors = validateProjectedFlow(projected);
  if (errors.length) {
    projected.validation.structurally_valid = false;
    projected.warnings.push(...errors);
  }
  return projected;
}

function sourceViewInputErrors(bundle: CanonicalFlowBundle, view: OkfSourceView): string[] {
  const result = validateSourceViews([view], {
    paper_id: bundle.paper_id,
    concepts: bundle.concepts,
    relations: bundle.relations
  });
  return result.issues.map((issue) => `${issue.code} at ${issue.path}: ${issue.message}`);
}

function selectReadableStoredPathways(concepts: readonly OkfConcept[], relations: readonly OkfRelation[]): OkfRelation[] {
  if (!relations.length) return [];
  const conceptById = new Map(concepts.map((concept) => [concept.concept_id, concept]));
  const outgoing = new Map<string, OkfRelation[]>();
  const incomingCount = new Map<string, number>();
  for (const relation of relations) {
    outgoing.set(relation.source_concept_id, [...(outgoing.get(relation.source_concept_id) ?? []), relation]);
    incomingCount.set(relation.target_concept_id, (incomingCount.get(relation.target_concept_id) ?? 0) + 1);
  }
  for (const list of outgoing.values()) list.sort((left, right) => compareTraversalRelations(left, right, conceptById));
  const starts = unique(relations.map((relation) => relation.source_concept_id))
    .filter((id) => !incomingCount.get(id))
    .sort((left, right) => compareConceptIds(left, right, conceptById));
  if (!starts.length) starts.push(...unique(relations.map((relation) => relation.source_concept_id)).sort((left, right) => compareConceptIds(left, right, conceptById)));

  const candidates: OkfRelation[][] = [];
  const walk = (nodeId: string, path: OkfRelation[], visited: Set<string>) => {
    if (candidates.length >= 500) return;
    const next = (outgoing.get(nodeId) ?? []).filter((relation) => !visited.has(relation.target_concept_id));
    if (!next.length || path.length >= okfConceptTypes.length - 1) {
      if (path.length) candidates.push(path);
      return;
    }
    for (const relation of next) {
      const sourceLayer = conceptTypeOrder.get(conceptById.get(relation.source_concept_id)?.type ?? "Problem") ?? 0;
      const targetLayer = conceptTypeOrder.get(conceptById.get(relation.target_concept_id)?.type ?? "Problem") ?? 0;
      if (targetLayer < sourceLayer) continue;
      walk(relation.target_concept_id, [...path, relation], new Set([...visited, relation.target_concept_id]));
    }
    if (path.length && !next.some((relation) => {
      const sourceLayer = conceptTypeOrder.get(conceptById.get(relation.source_concept_id)?.type ?? "Problem") ?? 0;
      const targetLayer = conceptTypeOrder.get(conceptById.get(relation.target_concept_id)?.type ?? "Problem") ?? 0;
      return targetLayer >= sourceLayer;
    })) candidates.push(path);
  };
  starts.forEach((start) => walk(start, [], new Set([start])));
  if (!candidates.length) return relations.slice(0, Math.min(relations.length, 3));

  candidates.sort((left, right) => pathwayScore(right, conceptById) - pathwayScore(left, conceptById)
    || relationPathKey(left).localeCompare(relationPathKey(right)));
  const selectedIds = new Set<string>();
  for (const path of candidates) {
    if (selectedIds.size && path.every((relation) => selectedIds.has(relation.relation_id))) continue;
    path.forEach((relation) => selectedIds.add(relation.relation_id));
    if (selectedIds.size >= 18 || selectedPathCount(selectedIds, candidates) >= 3) break;
  }
  return relations.filter((relation) => selectedIds.has(relation.relation_id));
}

function selectedPathCount(selected: Set<string>, paths: OkfRelation[][]) {
  return paths.filter((path) => path.every((relation) => selected.has(relation.relation_id))).length;
}

function pathwayScore(path: OkfRelation[], conceptById: Map<string, OkfConcept>) {
  const nodeIds = unique(path.flatMap((relation) => [relation.source_concept_id, relation.target_concept_id]));
  const distinctLayers = new Set(nodeIds.map((id) => conceptById.get(id)?.type).filter(Boolean)).size;
  const provenance = path.reduce((score, relation) => score + (relation.extraction_type === "explicit" ? 3 : relation.extraction_type === "explicit-in-artifact" ? 2 : 0), 0);
  return distinctLayers * 100 + path.length * 10 + provenance;
}

function projectNode(concept: OkfConcept): ProjectedFlowNode {
  return {
    id: concept.concept_id,
    paper_id: concept.paper_id,
    type: concept.type,
    title: concept.title,
    description: concept.description,
    evidence_ids: [...concept.evidence_ids],
    confidence: concept.confidence,
    extraction_type: concept.extraction_type,
    review_status: concept.review_status
  };
}

function projectEdge(relation: OkfRelation, sourceViews: readonly OkfSourceView[], activeSourceViewId?: string): ProjectedFlowEdge {
  const memberships = sourceViews.filter((view) => view.edge_ids.includes(relation.relation_id)).map((view) => view.source_view_id).sort();
  return {
    id: relation.relation_id,
    source: relation.source_concept_id,
    target: relation.target_concept_id,
    predicate: relation.predicate,
    evidence_ids: relationEvidenceIds(relation),
    confidence: relation.confidence,
    extraction_type: relation.extraction_type,
    relation_scope: relation.relation_scope,
    provenance: activeSourceViewId
      ? "source_view_explicit"
      : relation.relation_scope === "query_generated"
        ? "query_generated"
        : relation.extraction_type === "explicit-in-artifact"
          ? "explicit_in_artifact"
          : relation.extraction_type,
    source_view_ids: memberships
  };
}

function storedRelationsForBundle(bundle: CanonicalFlowBundle) {
  const conceptIds = new Set(bundle.concepts.map((concept) => concept.concept_id));
  return bundle.relations.filter((relation) => relation.relation_scope !== "query_generated"
    && conceptIds.has(relation.source_concept_id)
    && conceptIds.has(relation.target_concept_id));
}

function groupRelationsByPair(relations: readonly OkfRelation[]) {
  const result = new Map<string, OkfRelation[]>();
  for (const relation of relations) {
    const key = pairKey(relation.source_concept_id, relation.target_concept_id);
    result.set(key, [...(result.get(key) ?? []), relation]);
  }
  for (const list of result.values()) list.sort(compareRelations);
  return result;
}

function resolveConceptId(id: string, conceptById: Map<string, OkfConcept>) {
  if (conceptById.has(id)) return id;
  const matches = [...conceptById.keys()].filter((candidate) => candidate.endsWith(`:${id}`));
  return matches.length === 1 ? matches[0] : undefined;
}

function compareConcepts(left: OkfConcept, right: OkfConcept) {
  return compareConceptTypes(left.type, right.type) || left.concept_id.localeCompare(right.concept_id);
}

function compareConceptTypes(left: OkfConceptType, right: OkfConceptType) {
  return (conceptTypeOrder.get(left) ?? Number.MAX_SAFE_INTEGER) - (conceptTypeOrder.get(right) ?? Number.MAX_SAFE_INTEGER);
}

function compareRelations(left: OkfRelation, right: OkfRelation) {
  return left.source_concept_id.localeCompare(right.source_concept_id)
    || left.target_concept_id.localeCompare(right.target_concept_id)
    || left.relation_id.localeCompare(right.relation_id);
}

function compareTraversalRelations(left: OkfRelation, right: OkfRelation, conceptById: Map<string, OkfConcept>) {
  const leftTarget = conceptById.get(left.target_concept_id);
  const rightTarget = conceptById.get(right.target_concept_id);
  return compareConceptTypes(leftTarget?.type ?? "Problem", rightTarget?.type ?? "Problem")
    || extractionRank(left.extraction_type) - extractionRank(right.extraction_type)
    || left.target_concept_id.localeCompare(right.target_concept_id)
    || left.relation_id.localeCompare(right.relation_id);
}

function compareConceptIds(left: string, right: string, conceptById: Map<string, OkfConcept>) {
  const leftConcept = conceptById.get(left);
  const rightConcept = conceptById.get(right);
  return compareConceptTypes(leftConcept?.type ?? "Problem", rightConcept?.type ?? "Problem") || left.localeCompare(right);
}

function extractionRank(value: OkfRelation["extraction_type"]) {
  return value === "explicit" ? 0 : value === "explicit-in-artifact" ? 1 : 2;
}

function relationEvidenceIds(relation: OkfRelation) {
  return relation.evidence_id ? [relation.evidence_id] : [];
}

function cloneSourceView(view: OkfSourceView): OkfSourceView {
  return structuredClone(view);
}

function cloneNodeOrder(order: OkfSourceView["ordering"]["node_order"]) {
  return Object.fromEntries(Object.entries(order).map(([layer, ids]) => [layer, [...(ids ?? [])]])) as Partial<Record<OkfConceptType, string[]>>;
}

function pairKey(source: string, target: string) {
  return `${source}\u0000${target}`;
}

function relationPathKey(path: OkfRelation[]) {
  return path.map((relation) => relation.relation_id).join("\u0000");
}

function unique<T>(values: readonly T[]) {
  return [...new Set(values)];
}

function isPresent<T>(value: T | undefined): value is T {
  return value !== undefined;
}
