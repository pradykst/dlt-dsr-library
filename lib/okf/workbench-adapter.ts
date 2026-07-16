import { buildWorkbenchDsrMatrix, type WorkbenchDsrMatrix } from "./workbench-matrix.ts";
import { loadStoredPaperFlowMetadata } from "./stored-flow.ts";
import {
  getAvailableSourceViews,
  projectFullRelations,
  projectRecommendedFlow,
  projectSourceView,
  type ProjectedFlow,
  type ProjectedFlowEdge
} from "./flow-projection.ts";
import { getOkfKnowledgeBaseForChat, getOkfKnowledgeBaseLoadMetadata } from "./retrieval.ts";
import { normalizeCanonicalText, normalizeSourceLocation, selectOkfDisplayText } from "./text-hygiene.ts";
import {
  type ConfidenceLabel,
  type OkfConcept,
  type OkfEvidenceItem,
  type OkfKnowledgeBase,
  type OkfPaper,
  type OkfRelation
} from "./schema.ts";
import type {
  Paper,
  PaperBundle,
  WorkbenchDsrGroup,
  WorkbenchDsrGroupKey,
  WorkbenchChangeTargetType,
  WorkbenchElement,
  WorkbenchEvidence,
  WorkbenchFlowGraph,
  WorkbenchFlowView,
  WorkbenchRelation
} from "../workbench/types.ts";

export const canonicalWorkbenchChangeNotice =
  "Canonical changes are made by editing OKF files in Git and re-indexing.";


const dsrGroups: Array<{ key: WorkbenchDsrGroupKey; conceptType: OkfConcept["type"] }> = [
  { key: "Problem", conceptType: "Problem" },
  { key: "Design Requirement", conceptType: "Design Requirement" },
  { key: "Design Principle", conceptType: "Design Principle" },
  { key: "Design Feature", conceptType: "Design Feature" },
  { key: "Artifact", conceptType: "Artifact" },
  { key: "Evaluation", conceptType: "Evaluation" },
  { key: "Output Knowledge", conceptType: "Output Knowledge" }
];

const flowConceptTypes = new Set(dsrGroups.map((group) => group.conceptType));

export type WorkbenchAdapterOptions = {
  knowledgeBase?: OkfKnowledgeBase;
};

export async function getWorkbenchPapers(options: WorkbenchAdapterOptions = {}): Promise<Paper[]> {
  const kb = await loadWorkbenchKnowledgeBase(options);
  return kb.papers
    .map((paper) => adaptPaper(paper, kb))
    .sort((left, right) => (right.year ?? 0) - (left.year ?? 0)
      || (left.short_title ?? "").localeCompare(right.short_title ?? ""));
}

export async function getWorkbenchPaper(
  paperIdOrSlug: string,
  options: WorkbenchAdapterOptions = {}
): Promise<PaperBundle | null> {
  const kb = await loadWorkbenchKnowledgeBase(options);
  const paper = resolveWorkbenchPaper(paperIdOrSlug, kb);
  if (!paper) return null;

  const concepts = conceptsForPaper(paper.paper_id, kb);
  const relations = relationsForPaper(paper.paper_id, kb);
  const evidenceItems = kb.evidence_items.filter((item) => item.paper_id === paper.paper_id);
  const elements = adaptElements(concepts, evidenceItems);
  const evidence = adaptEvidence(evidenceItems, relations, paper.paper_id);
  const dsrMatrix = buildPaperMatrix(paper, concepts, relations);
  const flowGraph = buildWorkbenchFlowGraph(paper, concepts, elements, relations, kb, dsrMatrix);
  const recommendedRelationIds = new Set(flowGraph.recommended.relations.map((relation) => relation.relation_id));
  const adaptedRelations = relations.map((relation) => adaptRelation(
    relation,
    concepts,
    paper.paper_id,
    recommendedRelationIds.has(relation.relation_id),
    flowGraph.stored_flow_source
  ));
  const metadata = options.knowledgeBase
    ? { db_loaded_from: "local_okf_fallback" as const, key_type: "unavailable" as const }
    : getOkfKnowledgeBaseLoadMetadata();

  return {
    ok: true,
    paper: adaptPaper(paper, kb),
    presentation: paper.presentation,
    elements,
    relations: adaptedRelations,
    evidence,
    dsrGrid: groupWorkbenchConcepts(elements),
    dsrMatrix,
    flowGraph,
    runtime: {
      db_loaded_from: metadata.db_loaded_from,
      key_type: metadata.key_type
    },
    canonical_change_notice: canonicalWorkbenchChangeNotice
  };
}

export async function getWorkbenchDsrGrid(
  paperIdOrSlug: string,
  options: WorkbenchAdapterOptions = {}
): Promise<WorkbenchDsrGroup[] | null> {
  const kb = await loadWorkbenchKnowledgeBase(options);
  const paper = resolveWorkbenchPaper(paperIdOrSlug, kb);
  if (!paper) return null;
  const concepts = conceptsForPaper(paper.paper_id, kb);
  const evidence = kb.evidence_items.filter((item) => item.paper_id === paper.paper_id);
  return groupWorkbenchConcepts(adaptElements(concepts, evidence));
}

export async function getWorkbenchDsrMatrix(
  paperIdOrSlug: string,
  options: WorkbenchAdapterOptions = {}
): Promise<WorkbenchDsrMatrix | null> {
  const kb = await loadWorkbenchKnowledgeBase(options);
  const paper = resolveWorkbenchPaper(paperIdOrSlug, kb);
  if (!paper) return null;
  return buildPaperMatrix(paper, conceptsForPaper(paper.paper_id, kb), relationsForPaper(paper.paper_id, kb));
}

export async function getWorkbenchFlowGraph(
  paperIdOrSlug: string,
  options: WorkbenchAdapterOptions = {}
): Promise<WorkbenchFlowGraph | null> {
  const kb = await loadWorkbenchKnowledgeBase(options);
  const paper = resolveWorkbenchPaper(paperIdOrSlug, kb);
  if (!paper) return null;
  const concepts = conceptsForPaper(paper.paper_id, kb);
  const relations = relationsForPaper(paper.paper_id, kb);
  const evidence = kb.evidence_items.filter((item) => item.paper_id === paper.paper_id);
  const elements = adaptElements(concepts, evidence);
  const matrix = buildPaperMatrix(paper, concepts, relations);
  return buildWorkbenchFlowGraph(paper, concepts, elements, relations, kb, matrix);
}

export async function getWorkbenchEvidence(
  paperIdOrSlug: string,
  options: WorkbenchAdapterOptions = {}
): Promise<WorkbenchEvidence[] | null> {
  const kb = await loadWorkbenchKnowledgeBase(options);
  const paper = resolveWorkbenchPaper(paperIdOrSlug, kb);
  if (!paper) return null;
  const relations = relationsForPaper(paper.paper_id, kb);
  return adaptEvidence(
    kb.evidence_items.filter((item) => item.paper_id === paper.paper_id),
    relations,
    paper.paper_id
  );
}

export function resolveWorkbenchPaper(paperIdOrSlug: string, kb: OkfKnowledgeBase): OkfPaper | undefined {
  const raw = safeDecode(paperIdOrSlug).trim();
  const requested = normalizePaperRoute(raw);
  if (!requested) return undefined;

  const exact = kb.papers.find((paper) => canonicalPaperRouteValues(paper).includes(requested));
  if (exact) return exact;

  // Historical Workbench links used human-readable `paper-*` aliases. Resolve
  // those aliases against canonical identity, metadata, concepts, and evidence
  // instead of maintaining a corpus-specific routing table.
  if (!/^paper(?:\s|$)/.test(requested)) return undefined;
  const alias = requested.replace(/^paper\s+/, "").trim();
  const aliasTokens = tokenizePaperRoute(alias);
  if (!aliasTokens.length) return undefined;

  const candidates = kb.papers
    .map((paper) => scoreLegacyPaperAlias(paper, alias, aliasTokens, kb))
    .filter((candidate) => candidate.matchedAll)
    .sort((left, right) => right.score - left.score || left.paper.title.localeCompare(right.paper.title));
  if (!candidates.length) return undefined;
  if (candidates[1] && candidates[1].score === candidates[0].score) return undefined;
  return candidates[0].paper;
}

function scoreLegacyPaperAlias(
  paper: OkfPaper,
  alias: string,
  aliasTokens: string[],
  kb: OkfKnowledgeBase
) {
  const identity = canonicalPaperRouteValues(paper).join(" ");
  const concepts = kb.concepts.filter((concept) => concept.paper_id === paper.paper_id);
  const evidence = kb.evidence_items.filter((item) => item.paper_id === paper.paper_id);
  const semantic = normalizePaperRoute([
    identity,
    paper.domain_context,
    paper.abstract,
    paper.research_problem.join(" "),
    paper.research_objective.join(" "),
    paper.research_questions.join(" "),
    paper.artifact_type,
    paper.blockchain_dlt_role,
    paper.methodology,
    paper.theoretical_foundations.join(" "),
    paper.evaluation_method.join(" "),
    paper.key_contributions.join(" "),
    paper.design_knowledge_output.join(" "),
    paper.limitations.join(" "),
    paper.notes,
    paper.presentation ? JSON.stringify(paper.presentation) : "",
    ...concepts.flatMap((concept) => [concept.title, concept.description, concept.tags.join(" ")]),
    ...evidence.flatMap((item) => [item.paraphrase, item.quote])
  ].filter(Boolean).join(" "));
  const semanticTokens = new Set(tokenizePaperRoute(semantic));
  const identityTokens = new Set(tokenizePaperRoute(identity));
  const matchedAll = aliasTokens.every((token) => semanticTokens.has(token));
  const identityHits = aliasTokens.filter((token) => identityTokens.has(token)).length;
  const exactPhraseBoost = identity.includes(alias) ? 40 : 0;
  return { paper, matchedAll, score: exactPhraseBoost + identityHits * 10 + aliasTokens.length * 2 };
}

function canonicalPaperRouteValues(paper: OkfPaper) {
  return unique([
    paper.paper_id,
    paper.slug,
    workbenchPaperSlug(paper.paper_id),
    paper.title,
    paper.short_title ?? ""
  ].map(normalizePaperRoute));
}

function normalizePaperRoute(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function tokenizePaperRoute(value: string) {
  return normalizePaperRoute(value)
    .split(/\s+/)
    .filter((token) => token.length > 2 && token !== "paper" && !/^\d{4}$/.test(token));
}

export function availableWorkbenchPapers(kb: OkfKnowledgeBase) {
  return kb.papers
    .map((paper) => ({ paper_id: paper.paper_id, slug: paper.slug, title: paper.title }))
    .sort((left, right) => left.title.localeCompare(right.title));
}

export function workbenchPaperSlug(paperId: string) {
  return paperId.toLowerCase().replace(/_+/g, "-");
}

export function workbenchTargetOkfPath(
  paperId: string,
  targetType: string,
  explicitPath?: string | null
) {
  const root = "library/okf/papers/" + workbenchPaperSlug(paperId);
  const normalized = explicitPath?.replace(/\\/g, "/");
  if (normalized) {
    const marker = normalized.lastIndexOf("library/okf/papers/");
    const relative = marker >= 0 ? normalized.slice(marker) : normalized;
    if (relative.startsWith(root + "/") && !relative.includes("..") && !relative.startsWith("supabase:")) {
      return relative;
    }
  }
  if (targetType === "paper" || targetType === "papers") return root + "/index.md";
  if (targetType === "presentation") return root + "/presentation.yaml";
  if (targetType === "relation" || targetType === "relations") return root + "/relations.yaml";
  if (targetType === "evidence") return root + "/evidence.md";
  if (targetType === "graph") return root + "/graph.json";
  return root + "/dsr.md";
}

export function workbenchChangeTargetExists(
  bundle: PaperBundle,
  targetType: WorkbenchChangeTargetType,
  targetId: string
) {
  const id = targetId.trim();
  if (!id) return false;
  if (targetType === "paper" || targetType === "presentation" || targetType === "graph") {
    return id === bundle.paper.paper_id || id === bundle.paper.slug;
  }
  if (targetType === "concept") return bundle.elements.some((item) => item.element_id === id);
  if (targetType === "relation") return bundle.relations.some((item) => item.relation_id === id);
  return bundle.evidence.some((item) => item.evidence_id === id);
}

export function workbenchCanonicalTargetPath(
  bundle: PaperBundle,
  targetType: WorkbenchChangeTargetType
) {
  const paths = bundle.paper.canonical_paths;
  if (paths) {
    if (targetType === "paper") return paths.index;
    if (targetType === "presentation") return paths.presentation;
    if (targetType === "relation") return paths.relations;
    if (targetType === "evidence") return paths.evidence;
    if (targetType === "graph") return paths.graph;
    return paths.dsr;
  }
  return workbenchTargetOkfPath(bundle.paper.paper_id, targetType);
}
function buildPaperMatrix(paper: OkfPaper, concepts: OkfConcept[], relations: OkfRelation[]) {
  const metadata = loadStoredPaperFlowMetadata(paper.paper_id);
  const graph = metadata ? {
    nodes: metadata.graphNodes,
    edges: metadata.graphEdges,
    recommended_paths: metadata.recommendedPaths
  } : undefined;
  const recommended = buildWorkbenchDsrMatrix({
    paper_id: paper.paper_id,
    concepts,
    relations,
    graph
  });
  if (!metadata?.recommendedPaths.length
    || recommended.rows.some((row) => row.is_complete_requirement_principle_feature_path)) {
    return recommended;
  }

  const storedFallback = buildWorkbenchDsrMatrix({
    paper_id: paper.paper_id,
    concepts,
    relations,
    graph: graph ? { ...graph, recommended_paths: [] } : undefined
  });
  return {
    ...storedFallback,
    warnings: unique([
      ...recommended.warnings,
      "The stored recommendation is valid but incomplete for a Requirement → Principle → Feature review row; the primary matrix uses exact stored-relation branches.",
      ...storedFallback.warnings
    ])
  };
}

function buildWorkbenchFlowGraph(
  paper: OkfPaper,
  concepts: OkfConcept[],
  elements: WorkbenchElement[],
  relations: OkfRelation[],
  _kb: OkfKnowledgeBase,
  matrix: WorkbenchDsrMatrix
): WorkbenchFlowGraph {
  const metadata = loadStoredPaperFlowMetadata(paper.paper_id);
  const eligibleConcepts = concepts.filter((concept) => flowConceptTypes.has(concept.type));
  const eligibleIds = new Set(eligibleConcepts.map((concept) => concept.concept_id));
  const eligibleRelations = relations.filter((relation) => (
    relation.relation_scope !== "query_generated"
    && eligibleIds.has(relation.source_concept_id)
    && eligibleIds.has(relation.target_concept_id)
  ));
  const projectionBundle = {
    paper_id: paper.paper_id,
    concepts: eligibleConcepts,
    relations: eligibleRelations,
    recommended_paths: metadata?.recommendedPaths ?? [],
    source_views: paper.source_views ?? [],
    graph_source_reference: paper.graph_source_reference ?? null
  };
  const elementById = new Map(elements.map((element) => [element.element_id, element]));
  const relationById = new Map(eligibleRelations.map((relation) => [relation.relation_id, relation]));
  const recommendedProjection = projectRecommendedFlow(projectionBundle);
  const fullProjection = projectFullRelations(projectionBundle);
  const recommended = adaptWorkbenchFlowView(recommendedProjection, elementById, relationById, concepts, paper.paper_id);
  const full = adaptWorkbenchFlowView(fullProjection, elementById, relationById, concepts, paper.paper_id);
  const sourceViews = getAvailableSourceViews(projectionBundle).map((sourceView) => adaptWorkbenchFlowView(
    projectSourceView(projectionBundle, sourceView.source_view_id),
    elementById,
    relationById,
    concepts,
    paper.paper_id
  ));
  const storedFlowSource: WorkbenchFlowGraph["stored_flow_source"] = recommendedProjection.projection_source === "graph_json_recommended_paths"
    ? "graph_json"
    : "okf_relations_fallback";
  const warnings = unique([
    ...matrix.warnings,
    ...recommendedProjection.warnings,
    ...(paper.source_views && sourceViews.length !== paper.source_views.length
      ? ["One or more source views were withheld because their canonical references are structurally invalid."]
      : [])
  ]);

  const focusedTypes = new Set<WorkbenchDsrGroupKey>([
    "Design Requirement",
    "Design Principle",
    "Design Feature"
  ]);
  let focusedRelations = recommended.relations.filter((relation) => {
    const source = elementById.get(relation.source_node_id);
    const target = elementById.get(relation.target_node_id);
    return Boolean(source?.canonical_type && target?.canonical_type
      && focusedTypes.has(source.canonical_type) && focusedTypes.has(target.canonical_type));
  });
  let focusedIds = new Set(focusedRelations.flatMap((relation) => [relation.source_node_id, relation.target_node_id]));
  let focusedNodes = elements.filter((element) => focusedIds.has(element.element_id));

  if (!hasCompleteRequirementPrincipleFeaturePath(focusedNodes, focusedRelations)) {
    const matrixFallbackRelationIds = matrix.rows
      .filter((row) => row.is_complete_requirement_principle_feature_path)
      .slice(0, 2)
      .flatMap((row) => row.segments.flatMap((segment) => segment.relation_ids));
    const fallbackRelationIds = new Set(matrixFallbackRelationIds.length > 0
      ? matrixFallbackRelationIds
      : focusedStoredRpfRelationIds(elements, full.relations));
    focusedRelations = full.relations.filter((relation) => {
      if (!fallbackRelationIds.has(relation.relation_id)) return false;
      const source = elementById.get(relation.source_node_id);
      const target = elementById.get(relation.target_node_id);
      return Boolean(source?.canonical_type && target?.canonical_type
        && focusedTypes.has(source.canonical_type) && focusedTypes.has(target.canonical_type));
    });
    focusedIds = new Set(focusedRelations.flatMap((relation) => [relation.source_node_id, relation.target_node_id]));
    focusedNodes = elements.filter((element) => focusedIds.has(element.element_id));
    if (!hasCompleteRequirementPrincipleFeaturePath(focusedNodes, focusedRelations)) {
      warnings.push("No complete stored Requirement → Principle → Feature path is available for compatibility mode.");
    }
  }

  const layerCounts: Partial<Record<WorkbenchDsrGroupKey, number>> = {};
  for (const group of dsrGroups) {
    layerCounts[group.key] = elements.filter((element) => element.canonical_type === group.key).length;
  }

  return {
    stored_flow_source: storedFlowSource,
    source_reference: paper.graph_source_reference ?? null,
    source_views: sourceViews,
    recommended,
    focused: { nodes: focusedNodes, relations: focusedRelations },
    full,
    layer_counts: layerCounts,
    warnings: unique(warnings)
  };
}

function adaptWorkbenchFlowView(
  projection: ProjectedFlow,
  elementById: Map<string, WorkbenchElement>,
  relationById: Map<string, OkfRelation>,
  concepts: OkfConcept[],
  paperId: string
): WorkbenchFlowView {
  const nodes = projection.ordered_node_ids.map((id) => elementById.get(id)).filter(isPresent);
  const relations = projection.edges.flatMap((edge) => {
    const relation = relationById.get(edge.id);
    if (!relation) return [];
    return [adaptProjectedRelation(edge, relation, concepts, paperId, projection)];
  });
  return {
    mode: projection.mode,
    title: projection.title,
    subtitle: projection.subtitle,
    projection_source: projection.projection_source,
    source_view_id: projection.source_view_id,
    source_reference: projection.source_reference,
    nodes,
    relations,
    layers: [...projection.layers],
    ordered_node_ids: [...projection.ordered_node_ids],
    evidence_ids: [...projection.evidence_ids],
    validation: { ...projection.validation },
    warnings: [...projection.warnings],
    layout_hints: { ...projection.layout_hints }
  };
}

function adaptProjectedRelation(
  edge: ProjectedFlowEdge,
  relation: OkfRelation,
  concepts: OkfConcept[],
  paperId: string,
  projection: ProjectedFlow
): WorkbenchRelation {
  const adapted = adaptRelation(
    relation,
    concepts,
    paperId,
    projection.mode === "recommended",
    projection.projection_source === "graph_json_recommended_paths" ? "graph_json" : "okf_relations_fallback"
  );
  return {
    ...adapted,
    provenance: projection.mode === "source_figure"
      ? "source_view"
      : adapted.provenance,
    extraction_type: edge.extraction_type,
    source_view_ids: [...edge.source_view_ids]
  };
}

function isPresent<T>(value: T | undefined): value is T {
  return value !== undefined;
}
function adaptPaper(paper: OkfPaper, kb: OkfKnowledgeBase): Paper {
  const concepts = conceptsForPaper(paper.paper_id, kb);
  const countsByType = Object.fromEntries(dsrGroups.map((group) => [
    group.key,
    concepts.filter((concept) => concept.type === group.conceptType).length
  ])) as Partial<Record<WorkbenchDsrGroupKey, number>>;
  const evidenceCount = kb.evidence_items.filter((item) => item.paper_id === paper.paper_id).length;
  const relationCount = relationsForPaper(paper.paper_id, kb).length;
  const presentation = paper.presentation;
  const problemSummary = presentation?.overview.research_problem
    ?? joinRecorded(paper.research_problem)
    ?? summarizeConcepts(concepts.filter((concept) => concept.type === "Problem"));
  const artifactSummary = presentation?.card.artifact_summary
    ?? paper.artifact_type
    ?? summarizeTitles(concepts.filter((concept) => concept.type === "Artifact"), null);
  const evaluationSummary = (presentation ? joinRecorded(presentation.overview.evaluation_method) : null)
    ?? joinRecorded(paper.evaluation_method)
    ?? summarizeConcepts(concepts.filter((concept) => concept.type === "Evaluation"));
  const outputSummary = (presentation ? joinRecorded(presentation.overview.design_knowledge_output) : null)
    ?? joinRecorded(paper.design_knowledge_output)
    ?? summarizeConcepts(concepts.filter((concept) => concept.type === "Output Knowledge"));
  const root = "library/okf/papers/" + paper.slug;

  return {
    paper_id: paper.paper_id,
    slug: paper.slug,
    canonical_source: "okf",
    schema_version: paper.schema_version,
    title: paper.title,
    short_title: paper.short_title ?? paper.title,
    full_citation: compactCitation(paper),
    year: paper.year ?? null,
    authors: paper.authors?.join("; ") || null,
    authors_list: paper.authors ?? [],
    venue: paper.venue ?? null,
    doi: paper.doi ?? null,
    doi_url: paper.doi_url ?? null,
    source_url: paper.source_url ?? null,
    doi_or_url: paper.doi_url ?? paper.source_url ?? null,
    source_document: paper.source_pdf_path ?? null,
    domain: presentation?.card.domain_label ?? paper.domain_context ?? null,
    abstract: presentation?.overview.abstract_summary ?? paper.abstract ?? null,
    research_problem: problemSummary,
    research_objective: presentation?.overview.research_objective ?? joinRecorded(paper.research_objective),
    artifact_type: artifactSummary,
    blockchain_dlt_role: presentation?.card.dlt_role ?? paper.blockchain_dlt_role ?? null,
    methodology: presentation?.overview.methodology ?? paper.methodology ?? null,
    evaluation_method: evaluationSummary,
    key_contributions: presentation?.overview.key_contributions ?? paper.key_contributions,
    design_knowledge_output: outputSummary,
    limitations: presentation?.additional_context.limitations ?? paper.limitations,
    problem_description: presentation?.dsr_summary_grid.problem ?? problemSummary,
    input_knowledge: presentation?.dsr_summary_grid.input_knowledge ?? joinRecorded(paper.theoretical_foundations),
    research_process: presentation?.dsr_summary_grid.research_process ?? paper.methodology ?? null,
    key_concepts: presentation?.dsr_summary_grid.key_concepts.join("\n") ?? summarizeTitles(
      concepts.filter((concept) => [
        "Design Requirement",
        "Design Principle",
        "Design Feature"
      ].includes(concept.type)),
      null,
      6
    ),
    solution_description: presentation?.dsr_summary_grid.solution ?? summarizeConcepts(concepts.filter((concept) => concept.type === "Artifact")),
    output_knowledge: presentation?.dsr_summary_grid.output_knowledge ?? outputSummary,
    evaluation_summary: evaluationSummary,
    boundary_conditions: presentation ? joinRecorded(presentation.additional_context.limitations) : joinRecorded(paper.limitations),
    overall_extraction_status: paper.extraction_status,
    overall_confidence: confidenceNumber(highestConfidence(concepts.map((concept) => concept.confidence))),
    coder: null,
    date_coded: null,
    reviewer: paper.reviewed_by ?? null,
    extraction_status: paper.extraction_status,
    review_status: paper.review_status,
    author_check_status: paper.author_check_status,
    reviewed_by: paper.reviewed_by ?? null,
    reviewed_at: paper.reviewed_at ?? null,
    last_indexed_at: paper.last_indexed_at ?? null,
    notes: paper.notes ?? null,
    presentation,
    concept_counts: countsByType,
    counts: {
      requirements: countsByType["Design Requirement"] ?? 0,
      principles: countsByType["Design Principle"] ?? 0,
      features: countsByType["Design Feature"] ?? 0,
      concepts: concepts.length,
      evidence: evidenceCount,
      relations: relationCount
    },
    canonical_paths: {
      index: root + "/index.md",
      presentation: root + "/presentation.yaml",
      dsr: root + "/dsr.md",
      evidence: root + "/evidence.md",
      relations: root + "/relations.yaml",
      aliases: root + "/aliases.yaml",
      graph: root + "/graph.json"
    }
  };
}

function adaptElements(concepts: OkfConcept[], evidence: OkfEvidenceItem[]): WorkbenchElement[] {
  const evidenceByConcept = new Map<string, OkfEvidenceItem[]>();
  for (const item of evidence) {
    for (const conceptId of item.supports) {
      evidenceByConcept.set(conceptId, [...(evidenceByConcept.get(conceptId) ?? []), item]);
    }
  }

  return concepts.map((concept, index) => {
    const linkedEvidence = evidenceByConcept.get(concept.concept_id) ?? [];
    return {
      paper_id: concept.paper_id,
      element_id: concept.concept_id,
      element_type: concept.type,
      element_name: normalizeCanonicalText(concept.title),
      element_text: concept.description || null,
      normalized_text: selectOkfDisplayText({ canonicalDescription: concept.description, canonicalTitle: concept.title }) || null,
      source_status: concept.extraction_type,
      source_quote_id: linkedEvidence[0]?.evidence_id ?? null,
      page_or_section: linkedEvidence[0]?.source_location ? normalizeSourceLocation(linkedEvidence[0].source_location) : null,
      linked_problem_id: null,
      linked_requirement_id: null,
      linked_principle_id: null,
      kernel_theory_or_rationale: null,
      evaluation_support: concept.type === "Evaluation" ? normalizeCanonicalText(concept.description) : null,
      confidence: confidenceNumber(concept.confidence),
      coder: null,
      review_status: concept.review_status,
      notes: "Canonical OKF " + concept.type + "; " + concept.extraction_type + ".",
      short_label: normalizeCanonicalText(concept.title),
      display_order: index,
      main_diagram_include: null,
      extended_diagram_include: true,
      canonical_type: concept.type,
      confidence_label: concept.confidence,
      evidence_count: linkedEvidence.length,
      evidence_ids: linkedEvidence.map((item) => item.evidence_id),
      okf_path: workbenchTargetOkfPath(concept.paper_id, "concept", concept.okf_path),
      canonical_field: "description"
    };
  });
}

function adaptRelation(
  relation: OkfRelation,
  concepts: OkfConcept[],
  paperId: string,
  recommended: boolean,
  projectionSource: WorkbenchFlowGraph["stored_flow_source"]
): WorkbenchRelation {
  const conceptById = new Map(concepts.map((concept) => [concept.concept_id, concept]));
  const provenance = recommended && projectionSource === "graph_json" ? "graph_json" : "okf_relation";
  return {
    paper_id: paperId,
    relation_id: relation.relation_id,
    source_node_id: relation.source_concept_id,
    source_node_type: conceptById.get(relation.source_concept_id)?.type ?? null,
    relation_type: relation.predicate,
    target_node_id: relation.target_concept_id,
    target_node_type: conceptById.get(relation.target_concept_id)?.type ?? null,
    evidence_id: relation.evidence_id ?? null,
    source_status: provenance,
    confidence: confidenceNumber(relation.confidence),
    diagram_include: recommended,
    diagram_view: recommended ? "Main" : "Extended",
    review_status: null,
    notes: "Stored OKF relation (" + provenance + "; " + relation.extraction_type + ").",
    extraction_type: relation.extraction_type,
    source_view_ids: [],
    provenance,
    okf_path: workbenchTargetOkfPath(paperId, "relation")
  };
}

function adaptEvidence(
  items: OkfEvidenceItem[],
  relations: OkfRelation[],
  paperId: string
): WorkbenchEvidence[] {
  const relationsByEvidence = new Map<string, OkfRelation[]>();
  for (const relation of relations) {
    if (!relation.evidence_id) continue;
    relationsByEvidence.set(
      relation.evidence_id,
      [...(relationsByEvidence.get(relation.evidence_id) ?? []), relation]
    );
  }
  return items.map((item) => ({
    paper_id: item.paper_id,
    evidence_id: item.evidence_id,
    evidence_type: item.evidence_type,
    exact_quote_or_description: item.quote ?? normalizeCanonicalText(item.paraphrase),
    page: item.page_number ? String(item.page_number) : null,
    section: item.section ? normalizeCanonicalText(item.section) : null,
    element_ids_supported: item.supports.join("; ") || null,
    relation_ids_supported: (relationsByEvidence.get(item.evidence_id) ?? [])
      .map((relation) => relation.relation_id)
      .join("; ") || null,
    citation_note: item.source_location ? normalizeSourceLocation(item.source_location) : null,
    source_status: "canonical OKF",
    evidence_strength: confidenceNumber(item.confidence),
    coder: null,
    notes: null,
    concept_id: item.concept_id ?? null,
    confidence_label: item.confidence,
    okf_path: workbenchTargetOkfPath(paperId, "evidence"),
    canonical_field: "quote_or_summary"
  }));
}

function groupWorkbenchConcepts(elements: WorkbenchElement[]): WorkbenchDsrGroup[] {
  return dsrGroups.map((group) => ({
    key: group.key,
    label: group.key,
    concepts: elements.filter((element) => element.canonical_type === group.key)
  }));
}

function conceptsForPaper(paperId: string, kb: OkfKnowledgeBase) {
  return kb.concepts.filter((concept) => concept.paper_id === paperId);
}

function relationsForPaper(paperId: string, kb: OkfKnowledgeBase) {
  const conceptIds = new Set(conceptsForPaper(paperId, kb).map((concept) => concept.concept_id));
  return kb.relations.filter((relation) => (
    conceptIds.has(relation.source_concept_id)
    && conceptIds.has(relation.target_concept_id)
  ));
}

function focusedStoredRpfRelationIds(
  elements: WorkbenchElement[],
  relations: WorkbenchRelation[],
  maxBranches = 2
) {
  const typeById = new Map(elements.map((element) => [element.element_id, element.canonical_type]));
  const result: string[] = [];
  let branches = 0;
  for (const principle of elements.filter((element) => element.canonical_type === "Design Principle")) {
    const incoming = relations.find((relation) => (
      relation.target_node_id === principle.element_id
      && typeById.get(relation.source_node_id) === "Design Requirement"
    ));
    const outgoing = relations.find((relation) => (
      relation.source_node_id === principle.element_id
      && typeById.get(relation.target_node_id) === "Design Feature"
    ));
    if (!incoming || !outgoing) continue;
    result.push(incoming.relation_id, outgoing.relation_id);
    branches += 1;
    if (branches >= maxBranches) break;
  }
  return unique(result);
}
function hasCompleteRequirementPrincipleFeaturePath(
  nodes: WorkbenchElement[],
  relations: WorkbenchRelation[]
) {
  const typeById = new Map(nodes.map((node) => [node.element_id, node.canonical_type]));
  return nodes.some((node) => {
    if (node.canonical_type !== "Design Principle") return false;
    const hasRequirement = relations.some((relation) => (
      relation.target_node_id === node.element_id
      && typeById.get(relation.source_node_id) === "Design Requirement"
    ));
    const hasFeature = relations.some((relation) => (
      relation.source_node_id === node.element_id
      && typeById.get(relation.target_node_id) === "Design Feature"
    ));
    return hasRequirement && hasFeature;
  });
}

function joinRecorded(values: string[]) {
  const clean = values.map((value) => value.trim()).filter(Boolean);
  return clean.length ? clean.join("\n\n") : null;
}

function summarizeTitles(concepts: OkfConcept[], fallback: string | null, limit = 3) {
  const titles = concepts.map((concept) => concept.title.trim()).filter(Boolean).slice(0, limit);
  return titles.length ? titles.join("; ") : fallback;
}

function summarizeConcepts(concepts: OkfConcept[], limit = 3) {
  const values = concepts
    .map((concept) => concept.description || concept.title)
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, limit);
  return values.length ? values.join("\n\n") : null;
}

function compactCitation(paper: OkfPaper) {
  const authors = paper.authors?.length ? paper.authors.join("; ") : undefined;
  return [authors, paper.year ? "(" + paper.year + ")" : undefined, paper.title, paper.venue]
    .filter(Boolean)
    .join(" ");
}

function confidenceNumber(value: ConfidenceLabel) {
  if (value === "high") return 3;
  if (value === "medium-high" || value === "medium") return 2;
  return 1;
}

function highestConfidence(values: ConfidenceLabel[]): ConfidenceLabel {
  if (values.includes("high")) return "high";
  if (values.includes("medium-high")) return "medium-high";
  if (values.includes("medium")) return "medium";
  return "low";
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

async function loadWorkbenchKnowledgeBase(options: WorkbenchAdapterOptions) {
  return options.knowledgeBase ?? getOkfKnowledgeBaseForChat();
}