import {
  allowedDsrTransitionPredicates,
  hasCanonicalDsrLayerTransition,
  isCanonicalDsrTransition
} from "./dsr-transition-contract.ts";
/**
 * Pure projection of stored OKF concepts and relations into a seven-column
 * Workbench review matrix.
 *
 * This module deliberately does not read files, query Supabase, or infer
 * relationships. A matrix segment exists only when the caller supplies an
 * exact graph.json edge or an exact stored OKF relation for that pair.
 */

export const WORKBENCH_DSR_MATRIX_TYPES = [
  "Problem",
  "Design Requirement",
  "Design Principle",
  "Design Feature",
  "Artifact",
  "Evaluation",
  "Output Knowledge"
] as const;

export type WorkbenchDsrMatrixType = (typeof WORKBENCH_DSR_MATRIX_TYPES)[number];

export type WorkbenchDsrMatrixColumn = {
  key: WorkbenchDsrMatrixType;
  label: WorkbenchDsrMatrixType;
  rank: number;
};

export const WORKBENCH_DSR_MATRIX_COLUMNS: readonly WorkbenchDsrMatrixColumn[] =
  WORKBENCH_DSR_MATRIX_TYPES.map((key, rank) => ({ key, label: key, rank }));

type CanonicalConceptId = { id: string; concept_id?: string } | { id?: string; concept_id: string };

export type WorkbenchDsrMatrixConceptInput = CanonicalConceptId & {
  type: string;
  title: string;
  description?: string | null;
  evidence?: readonly string[] | null;
  evidence_ids?: readonly string[] | null;
  evidence_count?: number | null;
  confidence?: string | number | null;
  extraction_type?: string | null;
  review_status?: string | null;
  source_file?: string | null;
  okf_path?: string | null;
};

type CanonicalRelationId = { id: string; relation_id?: string } | { id?: string; relation_id: string };

export type WorkbenchDsrMatrixRelationInput = CanonicalRelationId & {
  source?: string;
  target?: string;
  source_concept_id?: string;
  target_concept_id?: string;
  predicate: string;
  evidence?: string | readonly string[] | null;
  evidence_id?: string | null;
  confidence?: string | number | null;
  extraction_type?: string | null;
  relation_scope?: string | null;
  stored?: boolean;
};

export type WorkbenchStoredGraphNodeInput = string | {
  id: string;
  type?: string | null;
};

export type WorkbenchStoredGraphEdgeInput = {
  id?: string;
  relation_id?: string;
  source: string;
  target: string;
  predicate?: string | null;
  evidence?: string | readonly string[] | null;
};

/**
 * `recommended_paths` is the canonical field. The two `recommended_main_*`
 * fields are accepted here so the adapter can consume already-stored v0 graph
 * metadata during migration without changing its meaning.
 */
export type WorkbenchStoredGraphInput = {
  nodes?: readonly WorkbenchStoredGraphNodeInput[];
  edges?: readonly WorkbenchStoredGraphEdgeInput[];
  recommended_paths?: readonly (readonly string[])[];
  recommended_main_paths?: readonly (readonly string[])[];
  recommended_main_flow?: readonly string[];
};

export type WorkbenchDsrMatrixOptions = {
  /** Maximum recommended-path rows. Defaults to 40 and is clamped to 1..200. */
  maxRows?: number;
  /** Maximum representative relation-fallback rows. Defaults to 12 and is clamped to 1..40. */
  maxFallbackRows?: number;
  /** Maximum fallback paths examined before ranking. Defaults to 512. */
  maxCandidatePaths?: number;
  /** Maximum stored branches followed from one concept. Defaults to 12. */
  maxBranchesPerConcept?: number;
  /** Maximum concepts in one row. Defaults to the seven canonical layers. */
  maxConceptsPerRow?: number;
};

export type WorkbenchDsrMatrixInput = {
  paper_id: string;
  concepts: readonly WorkbenchDsrMatrixConceptInput[];
  relations: readonly WorkbenchDsrMatrixRelationInput[];
  graph?: WorkbenchStoredGraphInput | null;
  options?: WorkbenchDsrMatrixOptions;
};

export type WorkbenchDsrMatrixConcept = {
  concept_id: string;
  type: WorkbenchDsrMatrixType;
  title: string;
  description: string | null;
  evidence_ids: string[];
  evidence_count: number;
  confidence: string | number | null;
  extraction_type: string | null;
  review_status: string | null;
  source_file: string | null;
  okf_path: string | null;
};

export type WorkbenchDsrMatrixSegmentProvenance =
  | "graph_json"
  | "okf_relation"
  | "graph_json+okf_relation";

export type WorkbenchDsrMatrixSegment = {
  segment_id: string;
  source_concept_id: string;
  target_concept_id: string;
  predicates: string[];
  provenance: WorkbenchDsrMatrixSegmentProvenance;
  graph_edge_ids: string[];
  relation_ids: string[];
  evidence_ids: string[];
};

export type WorkbenchDsrMatrixRowCell = {
  column: WorkbenchDsrMatrixType;
  concepts: WorkbenchDsrMatrixConcept[];
};

export type WorkbenchDsrMatrixRow = {
  row_id: string;
  origin: "recommended_path" | "stored_relation_fallback";
  recommended_path_index: number | null;
  concept_ids: string[];
  segment_ids: string[];
  cells: WorkbenchDsrMatrixRowCell[];
  segments: WorkbenchDsrMatrixSegment[];
  provenance: "graph_json" | "okf_relation" | "mixed";
  start_column: WorkbenchDsrMatrixType;
  end_column: WorkbenchDsrMatrixType;
  is_complete_seven_layer_path: boolean;
  is_complete_requirement_principle_feature_path: boolean;
};

export type WorkbenchDsrMatrixCatalogGroup = {
  column: WorkbenchDsrMatrixType;
  concepts: WorkbenchDsrMatrixConcept[];
};

export type WorkbenchDsrMatrix = {
  paper_id: string;
  columns: readonly WorkbenchDsrMatrixColumn[];
  source: "graph_json_recommended_paths" | "stored_relations_fallback" | "none";
  rows: WorkbenchDsrMatrixRow[];
  additional_concepts: WorkbenchDsrMatrixConcept[];
  catalog: WorkbenchDsrMatrixCatalogGroup[];
  warnings: string[];
  stats: {
    canonical_concept_count: number;
    primary_concept_count: number;
    additional_concept_count: number;
    stored_segment_count: number;
    primary_row_count: number;
    candidate_path_count: number;
    omitted_candidate_path_count: number;
    selected_row_limit: number;
    selection_strategy: "recommended_paths" | "coverage_representative" | "none";
    rows_truncated: boolean;
    candidates_truncated: boolean;
  };
};

type NormalizedOptions = {
  maxRows: number;
  maxFallbackRows: number;
  maxCandidatePaths: number;
  maxBranchesPerConcept: number;
  maxConceptsPerRow: number;
};

type MutableStoredSegment = {
  sourceId: string;
  targetId: string;
  predicates: Set<string>;
  graphEdgeIds: Set<string>;
  relationIds: Set<string>;
  evidenceIds: Set<string>;
};

type PathCandidate = {
  nodeIds: string[];
  segments: WorkbenchDsrMatrixSegment[];
  origin: WorkbenchDsrMatrixRow["origin"];
  recommendedPathIndex: number | null;
};

type ConceptResolution = {
  canonicalById: Map<string, WorkbenchDsrMatrixConcept>;
  canonicalIdsByLocalId: Map<string, string[]>;
  allTypesById: Map<string, string>;
  allIdsByLocalId: Map<string, string[]>;
};

const layerRank = new Map<WorkbenchDsrMatrixType, number>(
  WORKBENCH_DSR_MATRIX_TYPES.map((type, rank) => [type, rank])
);

export function isWorkbenchDsrMatrixType(value: string): value is WorkbenchDsrMatrixType {
  return (WORKBENCH_DSR_MATRIX_TYPES as readonly string[]).includes(value);
}

/**
 * Build a reviewer-oriented matrix without mutating the supplied concepts,
 * relations, or graph metadata.
 */
export function buildWorkbenchDsrMatrix(input: WorkbenchDsrMatrixInput): WorkbenchDsrMatrix {
  const warnings: string[] = [];
  const warningKeys = new Set<string>();
  const warn = (key: string, message: string) => {
    if (warningKeys.has(key)) return;
    warningKeys.add(key);
    warnings.push(message);
  };
  const options = normalizeOptions(input.options);
  const concepts = normalizeConcepts(input.concepts, warn);
  const resolution = buildConceptResolution(input.concepts, concepts);
  validateGraphNodeReferences(input.graph, resolution, warn);
  const segments = collectStoredSegments(input.relations, input.graph, resolution, warn);
  const segmentByPair = new Map(segments.map((segment) => [pairKey(segment.source_concept_id, segment.target_concept_id), segment]));

  const recommendedPaths = collectRecommendedPaths(input.graph);
  let candidates = recommendedPaths.flatMap((path, pathIndex) => buildRecommendedCandidates(
    path,
    pathIndex,
    segmentByPair,
    resolution,
    options,
    warn
  ));
  let source: WorkbenchDsrMatrix["source"] = "none";
  let candidatesTruncated = false;

  if (candidates.length > 0) {
    source = "graph_json_recommended_paths";
  } else {
    const relationBackedSegments = segments.filter((segment) => segment.relation_ids.length > 0);
    if (relationBackedSegments.length > 0) {
      const fallback = buildFallbackCandidates(concepts, relationBackedSegments, options, warn);
      candidates = fallback.candidates;
      candidatesTruncated = fallback.truncated;
      if (candidates.length > 0) source = "stored_relations_fallback";
    }
    if (recommendedPaths.length > 0) {
      warn(
        "recommended-paths-unusable",
        "Stored recommended paths did not contain a complete consecutive canonical DSR segment; the matrix uses valid adjacent stored DSR relations instead."
      );
    }
  }

  const rankedCandidates = rankAndDeduplicateCandidates(candidates, concepts);
  const selectionStrategy: WorkbenchDsrMatrix["stats"]["selection_strategy"] = source === "stored_relations_fallback"
    ? "coverage_representative"
    : source === "graph_json_recommended_paths"
      ? "recommended_paths"
      : "none";
  const selectedRowLimit = source === "stored_relations_fallback" ? options.maxFallbackRows : options.maxRows;
  const selectedCandidates = source === "stored_relations_fallback"
    ? selectRepresentativeFallbackCandidates(rankedCandidates, concepts, selectedRowLimit)
    : rankedCandidates.slice(0, selectedRowLimit);
  const rowsTruncated = rankedCandidates.length > selectedCandidates.length;
  if (rowsTruncated) {
    const omitted = rankedCandidates.length - selectedCandidates.length;
    warn("row-limit", source === "stored_relations_fallback"
      ? `Primary relation-fallback matrix uses ${selectedCandidates.length} representative path(s) selected for complete DSR chains and stored concept/edge coverage; ${omitted} additional stored path candidate(s) remain available through the concept catalog and full-relations view.`
      : `Primary recommended-path matrix was limited to ${selectedRowLimit} row(s); ${omitted} additional stored recommended-path candidate(s) were omitted from the primary matrix.`);
  }
  const rows = selectedCandidates.map((candidate) => candidateToRow(candidate, concepts));
  const primaryConceptIds = new Set(rows.flatMap((row) => row.concept_ids));
  const additionalConcepts = concepts.filter((concept) => !primaryConceptIds.has(concept.concept_id));

  if (rows.length === 0) {
    warn(
      "no-primary-rows",
      "No coherent primary matrix row could be constructed from exact stored graph edges or OKF relations; all concepts remain in the catalog."
    );
  }

  return {
    paper_id: input.paper_id,
    columns: WORKBENCH_DSR_MATRIX_COLUMNS,
    source,
    rows,
    additional_concepts: additionalConcepts,
    catalog: WORKBENCH_DSR_MATRIX_TYPES.map((column) => ({
      column,
      concepts: concepts.filter((concept) => concept.type === column)
    })),
    warnings,
    stats: {
      canonical_concept_count: concepts.length,
      primary_concept_count: primaryConceptIds.size,
      additional_concept_count: additionalConcepts.length,
      stored_segment_count: segments.length,
      primary_row_count: rows.length,
      candidate_path_count: rankedCandidates.length,
      omitted_candidate_path_count: Math.max(0, rankedCandidates.length - selectedCandidates.length),
      selected_row_limit: selectedRowLimit,
      selection_strategy: selectionStrategy,
      rows_truncated: rowsTruncated,
      candidates_truncated: candidatesTruncated
    }
  };
}

function normalizeOptions(options: WorkbenchDsrMatrixOptions | undefined): NormalizedOptions {
  return {
    maxRows: boundedInteger(options?.maxRows, 40, 1, 200),
    maxFallbackRows: boundedInteger(options?.maxFallbackRows, 12, 1, 40),
    maxCandidatePaths: boundedInteger(options?.maxCandidatePaths, 512, 1, 5_000),
    maxBranchesPerConcept: boundedInteger(options?.maxBranchesPerConcept, 12, 1, 100),
    maxConceptsPerRow: boundedInteger(
      options?.maxConceptsPerRow,
      WORKBENCH_DSR_MATRIX_TYPES.length,
      2,
      WORKBENCH_DSR_MATRIX_TYPES.length
    )
  };
}

function boundedInteger(value: number | undefined, fallback: number, minimum: number, maximum: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(minimum, Math.min(maximum, Math.floor(value as number)));
}

function normalizeConcepts(
  inputs: readonly WorkbenchDsrMatrixConceptInput[],
  warn: (key: string, message: string) => void
) {
  const result: WorkbenchDsrMatrixConcept[] = [];
  const seen = new Set<string>();
  const noncanonical: string[] = [];

  for (const input of inputs) {
    const id = conceptInputId(input).trim();
    if (!id) {
      warn("concept-without-id", "A concept without an ID was omitted from the Workbench matrix.");
      continue;
    }
    if (seen.has(id)) {
      warn(`duplicate-concept:${id}`, `Duplicate concept ID '${id}' was omitted from the Workbench matrix.`);
      continue;
    }
    seen.add(id);
    if (!isWorkbenchDsrMatrixType(input.type)) {
      noncanonical.push(`${id} (${input.type || "empty type"})`);
      continue;
    }
    const evidenceIds = uniqueStrings([...(input.evidence ?? []), ...(input.evidence_ids ?? [])]);
    result.push({
      concept_id: id,
      type: input.type,
      title: input.title.trim() || id,
      description: cleanOptionalString(input.description),
      evidence_ids: evidenceIds,
      evidence_count: Math.max(evidenceIds.length, nonnegativeInteger(input.evidence_count)),
      confidence: input.confidence ?? null,
      extraction_type: cleanOptionalString(input.extraction_type),
      review_status: cleanOptionalString(input.review_status),
      source_file: cleanOptionalString(input.source_file),
      okf_path: cleanOptionalString(input.okf_path)
    });
  }

  if (noncanonical.length > 0) {
    const preview = noncanonical.slice(0, 6).join(", ");
    const remainder = noncanonical.length > 6 ? ` and ${noncanonical.length - 6} more` : "";
    warn(
      "noncanonical-concept-types",
      `Omitted ${noncanonical.length} concept(s) outside the seven canonical Workbench types: ${preview}${remainder}.`
    );
  }

  return result.sort(compareConcepts);
}

function buildConceptResolution(
  inputs: readonly WorkbenchDsrMatrixConceptInput[],
  concepts: readonly WorkbenchDsrMatrixConcept[]
): ConceptResolution {
  const canonicalById = new Map(concepts.map((concept) => [concept.concept_id, concept]));
  const canonicalIdsByLocalId = idsByLocalId([...canonicalById.keys()]);
  const allTypesById = new Map<string, string>();
  for (const input of inputs) {
    const id = conceptInputId(input).trim();
    if (id && !allTypesById.has(id)) allTypesById.set(id, input.type);
  }
  return {
    canonicalById,
    canonicalIdsByLocalId,
    allTypesById,
    allIdsByLocalId: idsByLocalId([...allTypesById.keys()])
  };
}

function validateGraphNodeReferences(
  graph: WorkbenchStoredGraphInput | null | undefined,
  resolution: ConceptResolution,
  warn: (key: string, message: string) => void
) {
  for (const node of graph?.nodes ?? []) {
    const rawId = typeof node === "string" ? node : node.id;
    resolveCanonicalId(rawId, resolution, warn, "graph node");
  }
}

function collectStoredSegments(
  relations: readonly WorkbenchDsrMatrixRelationInput[],
  graph: WorkbenchStoredGraphInput | null | undefined,
  resolution: ConceptResolution,
  warn: (key: string, message: string) => void
) {
  const byPair = new Map<string, MutableStoredSegment>();

  for (const relation of relations) {
    if (relation.stored === false || relation.relation_scope === "query_generated") continue;
    const sourceRaw = relation.source ?? relation.source_concept_id ?? "";
    const targetRaw = relation.target ?? relation.target_concept_id ?? "";
    const sourceId = resolveCanonicalId(sourceRaw, resolution, warn, "relation source");
    const targetId = resolveCanonicalId(targetRaw, resolution, warn, "relation target");
    if (!sourceId || !targetId) continue;
    const sourceType = resolution.canonicalById.get(sourceId)?.type;
    const targetType = resolution.canonicalById.get(targetId)?.type;
    const predicate = relation.predicate.trim();
    if (!sourceType || !targetType || !isCanonicalDsrTransition(sourceType, targetType, predicate)) {
      warnInvalidPrimaryTransition(
        warn,
        `relation:${relationInputId(relation)}`,
        `Stored relation '${relationInputId(relation)}'`,
        sourceType,
        targetType,
        predicate
      );
      continue;
    }
    const segment = mutableSegment(byPair, sourceId, targetId);
    const relationId = relationInputId(relation).trim();
    if (relationId) segment.relationIds.add(relationId);
    segment.predicates.add(predicate);
    collectEvidenceIds(relation.evidence, relation.evidence_id).forEach((id) => segment.evidenceIds.add(id));
  }

  for (const [index, edge] of (graph?.edges ?? []).entries()) {
    const sourceId = resolveCanonicalId(edge.source, resolution, warn, "graph edge source");
    const targetId = resolveCanonicalId(edge.target, resolution, warn, "graph edge target");
    if (!sourceId || !targetId) continue;
    const graphEdgeId = cleanOptionalString(edge.id)
      ?? cleanOptionalString(edge.relation_id)
      ?? `graph.json#edges[${index}]`;
    const sourceType = resolution.canonicalById.get(sourceId)?.type;
    const targetType = resolution.canonicalById.get(targetId)?.type;
    const predicate = edge.predicate?.trim() ?? "";
    if (!sourceType || !targetType || !isCanonicalDsrTransition(sourceType, targetType, predicate)) {
      warnInvalidPrimaryTransition(
        warn,
        `graph-edge:${graphEdgeId}`,
        `Stored graph edge '${graphEdgeId}'`,
        sourceType,
        targetType,
        predicate
      );
      continue;
    }
    const segment = mutableSegment(byPair, sourceId, targetId);
    segment.graphEdgeIds.add(graphEdgeId);
    segment.predicates.add(predicate);
    collectEvidenceIds(edge.evidence, null).forEach((id) => segment.evidenceIds.add(id));
  }

  return [...byPair.values()]
    .map(freezeStoredSegment)
    .sort((left, right) => {
      const sourceRankDifference = rankOf(resolution.canonicalById.get(left.source_concept_id)?.type)
        - rankOf(resolution.canonicalById.get(right.source_concept_id)?.type);
      return sourceRankDifference
        || left.source_concept_id.localeCompare(right.source_concept_id)
        || left.target_concept_id.localeCompare(right.target_concept_id);
    });
}

function mutableSegment(byPair: Map<string, MutableStoredSegment>, sourceId: string, targetId: string) {
  const key = pairKey(sourceId, targetId);
  const existing = byPair.get(key);
  if (existing) return existing;
  const created: MutableStoredSegment = {
    sourceId,
    targetId,
    predicates: new Set(),
    graphEdgeIds: new Set(),
    relationIds: new Set(),
    evidenceIds: new Set()
  };
  byPair.set(key, created);
  return created;
}

function freezeStoredSegment(segment: MutableStoredSegment): WorkbenchDsrMatrixSegment {
  const graphEdgeIds = [...segment.graphEdgeIds].sort();
  const relationIds = [...segment.relationIds].sort();
  const provenance: WorkbenchDsrMatrixSegmentProvenance = graphEdgeIds.length > 0 && relationIds.length > 0
    ? "graph_json+okf_relation"
    : graphEdgeIds.length > 0
      ? "graph_json"
      : "okf_relation";
  return {
    segment_id: `stored-segment-${stableHash(pairKey(segment.sourceId, segment.targetId))}`,
    source_concept_id: segment.sourceId,
    target_concept_id: segment.targetId,
    predicates: [...segment.predicates].sort(),
    provenance,
    graph_edge_ids: graphEdgeIds,
    relation_ids: relationIds,
    evidence_ids: [...segment.evidenceIds].sort()
  };
}

function collectRecommendedPaths(graph: WorkbenchStoredGraphInput | null | undefined) {
  if (!graph) return [];
  const candidates: string[][] = [];
  for (const path of graph.recommended_paths ?? []) candidates.push([...path]);
  for (const path of graph.recommended_main_paths ?? []) candidates.push([...path]);
  if (graph.recommended_main_flow?.length) candidates.push([...graph.recommended_main_flow]);
  const seen = new Set<string>();
  return candidates.filter((path) => {
    const key = path.join("\u0000");
    if (path.length < 2 || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildRecommendedCandidates(
  rawPath: readonly string[],
  pathIndex: number,
  segmentByPair: ReadonlyMap<string, WorkbenchDsrMatrixSegment>,
  resolution: ConceptResolution,
  options: NormalizedOptions,
  warn: (key: string, message: string) => void
) {
  const resolved = rawPath.map((id) => resolveCanonicalId(id, resolution, warn, "recommended path node"));
  const candidates: PathCandidate[] = [];
  let nodeIds: string[] = [];
  let segments: WorkbenchDsrMatrixSegment[] = [];

  const flush = () => {
    if (segments.length > 0 && nodeIds.length === segments.length + 1) {
      candidates.push({
        nodeIds,
        segments,
        origin: "recommended_path",
        recommendedPathIndex: pathIndex
      });
    }
    nodeIds = [];
    segments = [];
  };

  for (let index = 0; index < rawPath.length - 1; index += 1) {
    const sourceId = resolved[index];
    const targetId = resolved[index + 1];
    const segment = sourceId && targetId ? segmentByPair.get(pairKey(sourceId, targetId)) : undefined;
    if (!sourceId || !targetId || !segment) {
      if (sourceId && targetId) {
        warn(
          `recommended-pair-missing:${pathIndex}:${sourceId}:${targetId}`,
          `Recommended path ${pathIndex + 1} has no exact stored edge or relation for consecutive pair '${sourceId}' -> '${targetId}'; no link was invented.`
        );
      }
      flush();
      continue;
    }

    if (nodeIds.length === 0) nodeIds.push(sourceId);
    if (nodeIds[nodeIds.length - 1] !== sourceId) {
      flush();
      nodeIds.push(sourceId);
    }
    segments.push(segment);
    nodeIds.push(targetId);
    if (nodeIds.length >= options.maxConceptsPerRow && index < rawPath.length - 2) flush();
  }
  flush();
  return candidates;
}

function buildFallbackCandidates(
  concepts: readonly WorkbenchDsrMatrixConcept[],
  segments: readonly WorkbenchDsrMatrixSegment[],
  options: NormalizedOptions,
  warn: (key: string, message: string) => void
) {
  const outgoing = new Map<string, WorkbenchDsrMatrixSegment[]>();
  const incomingIds = new Set<string>();
  for (const segment of segments) {
    outgoing.set(segment.source_concept_id, [...(outgoing.get(segment.source_concept_id) ?? []), segment]);
    incomingIds.add(segment.target_concept_id);
  }
  for (const [sourceId, branches] of outgoing) {
    branches.sort((left, right) => left.target_concept_id.localeCompare(right.target_concept_id));
    if (branches.length > options.maxBranchesPerConcept) {
      warn(
        `branch-limit:${sourceId}`,
        `Stored branches from '${sourceId}' were limited to ${options.maxBranchesPerConcept} while building primary matrix candidates.`
      );
      outgoing.set(sourceId, branches.slice(0, options.maxBranchesPerConcept));
    }
  }

  const roots = concepts
    .filter((concept) => outgoing.has(concept.concept_id) && !incomingIds.has(concept.concept_id))
    .sort(compareConcepts);
  const starts = roots.length > 0
    ? roots
    : concepts.filter((concept) => outgoing.has(concept.concept_id)).sort(compareConcepts);
  const candidates: PathCandidate[] = [];
  let truncated = false;

  const visit = (
    nodeId: string,
    nodeIds: string[],
    pathSegments: WorkbenchDsrMatrixSegment[],
    visited: ReadonlySet<string>
  ) => {
    if (candidates.length >= options.maxCandidatePaths) {
      truncated = true;
      return;
    }
    const branches = outgoing.get(nodeId) ?? [];
    if (branches.length === 0 || nodeIds.length >= options.maxConceptsPerRow) {
      if (pathSegments.length > 0) {
        candidates.push({
          nodeIds,
          segments: pathSegments,
          origin: "stored_relation_fallback",
          recommendedPathIndex: null
        });
      }
      return;
    }

    let extended = false;
    for (const segment of branches) {
      if (visited.has(segment.target_concept_id)) {
        warn(
          `cycle:${segment.segment_id}`,
          `Cycle guard skipped stored segment '${segment.segment_id}' while building fallback matrix paths.`
        );
        continue;
      }
      extended = true;
      visit(
        segment.target_concept_id,
        [...nodeIds, segment.target_concept_id],
        [...pathSegments, segment],
        new Set([...visited, segment.target_concept_id])
      );
      if (candidates.length >= options.maxCandidatePaths) {
        truncated = true;
        break;
      }
    }
    if (!extended && pathSegments.length > 0) {
      candidates.push({
        nodeIds,
        segments: pathSegments,
        origin: "stored_relation_fallback",
        recommendedPathIndex: null
      });
    }
  };

  for (const start of starts) {
    visit(start.concept_id, [start.concept_id], [], new Set([start.concept_id]));
    if (candidates.length >= options.maxCandidatePaths) {
      truncated = true;
      break;
    }
  }
  if (truncated) {
    warn(
      "candidate-limit",
      `Fallback path enumeration stopped at ${options.maxCandidatePaths} candidates; rows were ranked without inventing or extending links.`
    );
  }
  return { candidates, truncated };
}

function rankAndDeduplicateCandidates(
  candidates: readonly PathCandidate[],
  concepts: readonly WorkbenchDsrMatrixConcept[]
) {
  const conceptById = new Map(concepts.map((concept) => [concept.concept_id, concept]));
  const seen = new Set<string>();
  return candidates
    .filter((candidate) => {
      const key = candidate.nodeIds.join("\u0000");
      if (candidate.segments.length === 0 || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((left, right) => {
      const layerDifference = right.nodeIds.length - left.nodeIds.length;
      if (layerDifference) return layerDifference;
      const evidenceDifference = pathEvidenceCount(right, conceptById) - pathEvidenceCount(left, conceptById);
      if (evidenceDifference) return evidenceDifference;
      return left.nodeIds.join("|").localeCompare(right.nodeIds.join("|"));
    });
}

function selectRepresentativeFallbackCandidates(
  candidates: readonly PathCandidate[],
  concepts: readonly WorkbenchDsrMatrixConcept[],
  limit: number
) {
  if (candidates.length <= limit) return [...candidates];
  const conceptById = new Map(concepts.map((concept) => [concept.concept_id, concept]));
  const remaining = [...candidates].sort((left, right) => compareAnchorCandidates(left, right, conceptById));
  const selected: PathCandidate[] = [];
  const coveredConceptIds = new Set<string>();
  const coveredSegmentIds = new Set<string>();

  const select = (candidate: PathCandidate) => {
    selected.push(candidate);
    candidate.nodeIds.forEach((id) => coveredConceptIds.add(id));
    candidate.segments.forEach((segment) => coveredSegmentIds.add(segment.segment_id));
    remaining.splice(remaining.indexOf(candidate), 1);
  };

  if (remaining[0]) select(remaining[0]);
  while (selected.length < limit && remaining.length > 0) {
    remaining.sort((left, right) => compareCoverageCandidates(
      left,
      right,
      coveredConceptIds,
      coveredSegmentIds,
      conceptById
    ));
    const next = remaining[0];
    if (!next || candidateCoverage(next, coveredConceptIds, coveredSegmentIds).total === 0) break;
    select(next);
  }
  return selected;
}

function compareAnchorCandidates(
  left: PathCandidate,
  right: PathCandidate,
  conceptById: ReadonlyMap<string, WorkbenchDsrMatrixConcept>
) {
  const leftShape = candidateShape(left, conceptById);
  const rightShape = candidateShape(right, conceptById);
  return Number(rightShape.completeSevenLayers) - Number(leftShape.completeSevenLayers)
    || Number(rightShape.completeRpf) - Number(leftShape.completeRpf)
    || right.nodeIds.length - left.nodeIds.length
    || pathEvidenceCount(right, conceptById) - pathEvidenceCount(left, conceptById)
    || left.nodeIds.join("|").localeCompare(right.nodeIds.join("|"));
}

function compareCoverageCandidates(
  left: PathCandidate,
  right: PathCandidate,
  coveredConceptIds: ReadonlySet<string>,
  coveredSegmentIds: ReadonlySet<string>,
  conceptById: ReadonlyMap<string, WorkbenchDsrMatrixConcept>
) {
  const leftCoverage = candidateCoverage(left, coveredConceptIds, coveredSegmentIds);
  const rightCoverage = candidateCoverage(right, coveredConceptIds, coveredSegmentIds);
  return rightCoverage.total - leftCoverage.total
    || rightCoverage.newConcepts - leftCoverage.newConcepts
    || rightCoverage.newSegments - leftCoverage.newSegments
    || compareAnchorCandidates(left, right, conceptById);
}

function candidateCoverage(
  candidate: PathCandidate,
  coveredConceptIds: ReadonlySet<string>,
  coveredSegmentIds: ReadonlySet<string>
) {
  const newConcepts = candidate.nodeIds.filter((id) => !coveredConceptIds.has(id)).length;
  const newSegments = candidate.segments.filter((segment) => !coveredSegmentIds.has(segment.segment_id)).length;
  return { newConcepts, newSegments, total: newConcepts * 4 + newSegments * 3 };
}

function candidateShape(
  candidate: PathCandidate,
  conceptById: ReadonlyMap<string, WorkbenchDsrMatrixConcept>
) {
  const types = candidate.nodeIds.flatMap((id) => {
    const type = conceptById.get(id)?.type;
    return type ? [type] : [];
  });
  const presentTypes = new Set(types);
  const requirementIndex = types.indexOf("Design Requirement");
  const principleIndex = types.indexOf("Design Principle");
  const featureIndex = types.indexOf("Design Feature");
  return {
    completeSevenLayers: WORKBENCH_DSR_MATRIX_TYPES.every((type) => presentTypes.has(type)),
    completeRpf: requirementIndex >= 0
      && principleIndex === requirementIndex + 1
      && featureIndex === principleIndex + 1
  };
}
function pathEvidenceCount(
  candidate: PathCandidate,
  conceptById: ReadonlyMap<string, WorkbenchDsrMatrixConcept>
) {
  return candidate.nodeIds.reduce((total, id) => total + (conceptById.get(id)?.evidence_count ?? 0), 0)
    + candidate.segments.reduce((total, segment) => total + segment.evidence_ids.length, 0);
}

function candidateToRow(
  candidate: PathCandidate,
  concepts: readonly WorkbenchDsrMatrixConcept[]
): WorkbenchDsrMatrixRow {
  const conceptById = new Map(concepts.map((concept) => [concept.concept_id, concept]));
  const pathConcepts = candidate.nodeIds.flatMap((id) => {
    const concept = conceptById.get(id);
    return concept ? [concept] : [];
  });
  const provenanceValues = new Set(candidate.segments.map((segment) => segment.provenance));
  const provenance: WorkbenchDsrMatrixRow["provenance"] = provenanceValues.size === 1
    ? provenanceValues.has("graph_json")
      ? "graph_json"
      : provenanceValues.has("okf_relation")
        ? "okf_relation"
        : "mixed"
    : "mixed";
  const presentTypes = new Set(pathConcepts.map((concept) => concept.type));
  const requirementIndex = pathConcepts.findIndex((concept) => concept.type === "Design Requirement");
  const principleIndex = pathConcepts.findIndex((concept) => concept.type === "Design Principle");
  const featureIndex = pathConcepts.findIndex((concept) => concept.type === "Design Feature");

  return {
    row_id: `matrix-row-${stableHash(`${candidate.origin}\u0000${candidate.nodeIds.join("\u0000")}`)}`,
    origin: candidate.origin,
    recommended_path_index: candidate.recommendedPathIndex,
    concept_ids: [...candidate.nodeIds],
    segment_ids: candidate.segments.map((segment) => segment.segment_id),
    cells: WORKBENCH_DSR_MATRIX_TYPES.map((column) => ({
      column,
      concepts: pathConcepts.filter((concept) => concept.type === column)
    })),
    segments: candidate.segments.map((segment) => ({ ...segment })),
    provenance,
    start_column: pathConcepts[0].type,
    end_column: pathConcepts[pathConcepts.length - 1].type,
    is_complete_seven_layer_path: WORKBENCH_DSR_MATRIX_TYPES.every((type) => presentTypes.has(type)),
    is_complete_requirement_principle_feature_path: requirementIndex >= 0
      && principleIndex === requirementIndex + 1
      && featureIndex === principleIndex + 1
  };
}

function resolveCanonicalId(
  rawId: string,
  resolution: ConceptResolution,
  warn: (key: string, message: string) => void,
  referenceKind: string
) {
  const id = rawId.trim();
  if (!id) {
    warn(`empty-reference:${referenceKind}`, `An empty ${referenceKind} reference was ignored.`);
    return undefined;
  }
  if (resolution.canonicalById.has(id)) return id;
  const localId = localConceptId(id);
  const canonicalMatches = resolution.canonicalIdsByLocalId.get(localId) ?? [];
  if (canonicalMatches.length === 1) {
    return canonicalMatches[0];
  }
  if (canonicalMatches.length > 1) {
    warn(
      `ambiguous-reference:${referenceKind}:${id}`,
      `Stored ${referenceKind} '${id}' is ambiguous across canonical concepts (${canonicalMatches.join(", ")}) and was ignored.`
    );
    return undefined;
  }

  const exactType = resolution.allTypesById.get(id);
  const allMatches = resolution.allIdsByLocalId.get(localId) ?? [];
  if (exactType || allMatches.length === 1) {
    return undefined;
  }
  if (allMatches.length > 1) {
    warn(
      `ambiguous-noncanonical-reference:${referenceKind}:${id}`,
      `Stored ${referenceKind} '${id}' is ambiguous (${allMatches.join(", ")}) and was ignored.`
    );
    return undefined;
  }
  warn(
    `unknown-reference:${referenceKind}:${id}`,
    `Stored ${referenceKind} '${id}' does not resolve to a supplied canonical concept and was ignored.`
  );
  return undefined;
}

function warnInvalidPrimaryTransition(
  warn: (key: string, message: string) => void,
  key: string,
  label: string,
  sourceType: WorkbenchDsrMatrixType | undefined,
  targetType: WorkbenchDsrMatrixType | undefined,
  predicate: string
) {
  const transition = `${sourceType ?? "unknown"} -> ${targetType ?? "unknown"}`;
  if (!sourceType || !targetType || !hasCanonicalDsrLayerTransition(sourceType, targetType)) {
    warn(
      `non-primary-layer-transition:${key}`,
      `${label} uses ${transition}; only adjacent canonical DSR layer transitions are eligible for primary matrix pathways.`
    );
    return;
  }
  const allowed = allowedDsrTransitionPredicates(sourceType, targetType);
  warn(
    `non-primary-predicate:${key}`,
    `${label} uses predicate '${predicate || "<missing>"}' for ${transition}; primary matrix pathways allow only: ${allowed.join(", ")}.`
  );
}

function rankOf(type: WorkbenchDsrMatrixType | undefined) {
  return type ? layerRank.get(type) ?? Number.MAX_SAFE_INTEGER : Number.MAX_SAFE_INTEGER;
}

function compareConcepts(left: WorkbenchDsrMatrixConcept, right: WorkbenchDsrMatrixConcept) {
  return rankOf(left.type) - rankOf(right.type)
    || left.title.localeCompare(right.title)
    || left.concept_id.localeCompare(right.concept_id);
}

function conceptInputId(input: WorkbenchDsrMatrixConceptInput) {
  return input.id ?? input.concept_id ?? "";
}

function relationInputId(input: WorkbenchDsrMatrixRelationInput) {
  return input.id ?? input.relation_id ?? "";
}

function cleanOptionalString(value: string | null | undefined) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

function nonnegativeInteger(value: number | null | undefined) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value as number));
}

function collectEvidenceIds(
  evidence: string | readonly string[] | null | undefined,
  evidenceId: string | null | undefined
) {
  const values = Array.isArray(evidence) ? [...evidence] : typeof evidence === "string" ? [evidence] : [];
  if (evidenceId) values.push(evidenceId);
  return uniqueStrings(values);
}

function uniqueStrings(values: readonly string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].sort();
}

function idsByLocalId(ids: readonly string[]) {
  const result = new Map<string, string[]>();
  for (const id of ids) {
    const localId = localConceptId(id);
    result.set(localId, [...(result.get(localId) ?? []), id]);
  }
  return result;
}

function localConceptId(id: string) {
  const separator = id.lastIndexOf(":");
  return separator >= 0 ? id.slice(separator + 1) : id;
}

function pairKey(sourceId: string, targetId: string) {
  return `${sourceId}\u0000${targetId}`;
}

/** Stable, non-cryptographic ID for deterministic UI keys. */
function stableHash(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}
