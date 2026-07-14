import { buildOkfFlow } from "./flow.ts";
import { loadStoredPaperFlowMetadata } from "./stored-flow.ts";
import { getOkfKnowledgeBaseForChat, getOkfKnowledgeBaseLoadMetadata } from "./retrieval.ts";
import type { ConfidenceLabel, OkfConcept, OkfEvidenceItem, OkfKnowledgeBase, OkfPaper, OkfRelation } from "./schema.ts";
import type {
  Paper,
  PaperBundle,
  WorkbenchDsrGroup,
  WorkbenchDsrGroupKey,
  WorkbenchElement,
  WorkbenchEvidence,
  WorkbenchFlowGraph,
  WorkbenchRelation
} from "../workbench/types.ts";

export const canonicalWorkbenchChangeNotice =
  "Canonical changes are made by editing OKF files in Git and re-indexing.";

const legacyPaperIds: Record<string, string> = {
  "paper-iot-sdps": "BLOCKCHAIN_IOT_SDPS_2019",
  "paper-consent-hie": "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023",
  "paper-nil-marketplace": "NIL_NFT_MARKETPLACE_2026",
  "paper-peer-review-token": "PEER_REVIEW_TOKEN_INCENTIVES_2025",
  "paper-opportunism": "SHORT_END_STICK_2025",
  "paper-ssi-kyc": "SSI_KYC_FRAMEWORK_2022",
  "paper-trust-capacity": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024"
};

const dsrGroups: Array<{ key: WorkbenchDsrGroupKey; conceptType: OkfConcept["type"] }> = [
  { key: "Problem", conceptType: "Problem" },
  { key: "Design Requirement", conceptType: "DesignRequirement" },
  { key: "Design Principle", conceptType: "DesignPrinciple" },
  { key: "Design Feature", conceptType: "DesignFeature" },
  { key: "Artifact", conceptType: "Artifact" },
  { key: "Evaluation", conceptType: "Evaluation" },
  { key: "Output Knowledge", conceptType: "OutputKnowledge" }
];

const flowConceptTypes = new Set(dsrGroups.map((group) => group.conceptType));

export type WorkbenchAdapterOptions = {
  knowledgeBase?: OkfKnowledgeBase;
};

export async function getWorkbenchPapers(options: WorkbenchAdapterOptions = {}): Promise<Paper[]> {
  const kb = await loadWorkbenchKnowledgeBase(options);
  return kb.papers
    .map((paper) => adaptPaper(paper, kb))
    .sort((left, right) => (right.year ?? 0) - (left.year ?? 0) || (left.short_title ?? "").localeCompare(right.short_title ?? ""));
}

export async function getWorkbenchPaper(
  paperIdOrSlug: string,
  options: WorkbenchAdapterOptions = {}
): Promise<PaperBundle | null> {
  const kb = await loadWorkbenchKnowledgeBase(options);
  const paper = resolveWorkbenchPaper(paperIdOrSlug, kb);
  if (!paper) return null;

  const concepts = conceptsForPaper(paper.paper_id, kb);
  const evidenceItems = kb.evidence_items.filter((item) => item.paper_id === paper.paper_id);
  const relations = relationsForPaper(paper.paper_id, kb);
  const evidence = adaptEvidence(evidenceItems, relations, paper.paper_id);
  const elements = adaptElements(concepts, evidenceItems);
  const flowGraph = buildWorkbenchFlowGraph(paper, concepts, elements, relations, kb);
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
    elements,
    relations: adaptedRelations,
    evidence,
    dsrGrid: groupWorkbenchConcepts(elements),
    flowGraph,
    changeRequestsCount: 0,
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

export async function getWorkbenchFlowGraph(
  paperIdOrSlug: string,
  options: WorkbenchAdapterOptions = {}
): Promise<WorkbenchFlowGraph | null> {
  const kb = await loadWorkbenchKnowledgeBase(options);
  const paper = resolveWorkbenchPaper(paperIdOrSlug, kb);
  if (!paper) return null;
  const concepts = conceptsForPaper(paper.paper_id, kb);
  const evidence = kb.evidence_items.filter((item) => item.paper_id === paper.paper_id);
  const elements = adaptElements(concepts, evidence);
  return buildWorkbenchFlowGraph(paper, concepts, elements, relationsForPaper(paper.paper_id, kb), kb);
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
  const requested = safeDecode(paperIdOrSlug).trim().toLowerCase();
  if (!requested) return undefined;
  const legacyPaperId = legacyPaperIds[requested];
  if (legacyPaperId) return kb.papers.find((paper) => paper.paper_id === legacyPaperId);
  return kb.papers.find((paper) => {
    return paper.paper_id.toLowerCase() === requested || workbenchPaperSlug(paper.paper_id) === requested;
  });
}

export function availableWorkbenchPapers(kb: OkfKnowledgeBase) {
  return kb.papers
    .map((paper) => ({
      paper_id: paper.paper_id,
      slug: workbenchPaperSlug(paper.paper_id),
      title: paper.title
    }))
    .sort((left, right) => left.title.localeCompare(right.title));
}

export function workbenchPaperSlug(paperId: string) {
  return paperId.toLowerCase().replace(/_+/g, "-");
}

export function workbenchTargetOkfPath(paperId: string, targetType: string, explicitPath?: string | null) {
  if (explicitPath && !explicitPath.startsWith("supabase:")) return explicitPath.replace(/\\/g, "/");
  const root = `library/okf/papers/${workbenchPaperSlug(paperId)}`;
  if (targetType === "paper" || targetType === "papers") return `${root}/index.md`;
  if (targetType === "relation" || targetType === "relations") return `${root}/relations.yaml`;
  if (targetType === "evidence") return `${root}/evidence.md`;
  return `${root}/dsr.md`;
}

function buildWorkbenchFlowGraph(
  paper: OkfPaper,
  concepts: OkfConcept[],
  elements: WorkbenchElement[],
  relations: OkfRelation[],
  kb: OkfKnowledgeBase
): WorkbenchFlowGraph {
  const metadata = loadStoredPaperFlowMetadata(paper.paper_id);
  const hasGraphRecommendation = Boolean(metadata?.recommendedPaths.length);
  const fullCandidates = concepts.filter((concept) => flowConceptTypes.has(concept.type));
  const fullCandidateIds = new Set(fullCandidates.map((concept) => concept.concept_id));
  const fullRelations = relations.filter((relation) => {
    return relation.relation_scope !== "query_generated"
      && fullCandidateIds.has(relation.source_concept_id)
      && fullCandidateIds.has(relation.target_concept_id);
  });
  const fullConnectedIds = new Set(fullRelations.flatMap((relation) => [relation.source_concept_id, relation.target_concept_id]));
  const fullNodes = elements.filter((element) => fullConnectedIds.has(element.element_id) && isDsrGroupKey(element.canonical_type));
  const baseFullRelations = fullRelations.map((relation) => adaptRelation(
    relation,
    concepts,
    paper.paper_id,
    false,
    "okf_relations_fallback"
  ));

  let storedFlowSource: WorkbenchFlowGraph["stored_flow_source"] = "okf_relations_fallback";
  let recommendedNodeIds = new Set<string>();
  let recommendedRelationIds = new Set<string>();
  const warnings: string[] = [];

  if (hasGraphRecommendation) {
    const recommendedFlow = buildOkfFlow(paper.paper_id, concepts, kb, {
      mode: "stored_paper_flow",
      storedOnly: true,
      title: paper.title + ": recommended stored flow"
    });
    recommendedNodeIds = new Set(recommendedFlow.nodes.map((node) => node.id));
    recommendedRelationIds = new Set(
      recommendedFlow.edges
        .map((edge) => edge.relation_id ?? edge.id)
        .filter((relationId) => fullRelations.some((relation) => relation.relation_id === relationId))
    );
    warnings.push(...recommendedFlow.warnings);
    if (recommendedRelationIds.size > 0) {
      storedFlowSource = "graph_json";
    } else {
      warnings.push("The graph.json recommendation did not resolve to visible stored relations; using a compact OKF-relations fallback.");
    }
  }

  if (storedFlowSource === "okf_relations_fallback") {
    const compact = compactStoredRelationPaths(fullNodes, baseFullRelations);
    recommendedNodeIds = new Set(compact.nodes.map((node) => node.element_id));
    recommendedRelationIds = new Set(compact.relations.map((relation) => relation.relation_id));
    warnings.push(
      metadata
        ? "graph.json has no recommended main path; showing up to two longest stored OKF relation paths. Full Relations contains the complete stored graph."
        : "No graph.json recommendation is available; showing up to two longest stored OKF relation paths. Full Relations contains the complete stored graph."
    );
  }

  const fullAdaptedRelations = fullRelations.map((relation) => adaptRelation(
    relation,
    concepts,
    paper.paper_id,
    recommendedRelationIds.has(relation.relation_id),
    storedFlowSource
  ));
  const recommendedRelations = fullAdaptedRelations.filter((relation) => recommendedRelationIds.has(relation.relation_id));
  const connectedRecommendedIds = new Set(recommendedRelations.flatMap((relation) => [relation.source_node_id, relation.target_node_id]));
  const recommendedNodes = elements.filter((element) => (
    recommendedNodeIds.has(element.element_id)
    && connectedRecommendedIds.has(element.element_id)
    && isDsrGroupKey(element.canonical_type)
  ));

  const focusedLayerKeys = new Set<WorkbenchDsrGroupKey>(["Design Requirement", "Design Principle", "Design Feature"]);
  const recommendedFocusedNodes = recommendedNodes.filter((node) => node.canonical_type && focusedLayerKeys.has(node.canonical_type as WorkbenchDsrGroupKey));
  const recommendedFocusedNodeIds = new Set(recommendedFocusedNodes.map((node) => node.element_id));
  const recommendedFocusedRelations = recommendedRelations.filter((relation) => (
    recommendedFocusedNodeIds.has(relation.source_node_id)
    && recommendedFocusedNodeIds.has(relation.target_node_id)
  ));
  const focused = hasCompleteRequirementPrincipleFeaturePath(recommendedFocusedNodes, recommendedFocusedRelations)
    ? connectedStoredGraph(recommendedFocusedNodes, recommendedFocusedRelations)
    : compactStoredRelationPaths(
        fullNodes.filter((node) => node.canonical_type && focusedLayerKeys.has(node.canonical_type as WorkbenchDsrGroupKey)),
        fullAdaptedRelations.filter((relation) => {
          const source = fullNodes.find((node) => node.element_id === relation.source_node_id);
          const target = fullNodes.find((node) => node.element_id === relation.target_node_id);
          return Boolean(
            source?.canonical_type
            && target?.canonical_type
            && focusedLayerKeys.has(source.canonical_type as WorkbenchDsrGroupKey)
            && focusedLayerKeys.has(target.canonical_type as WorkbenchDsrGroupKey)
          );
        })
      );
  if (!hasCompleteRequirementPrincipleFeaturePath(recommendedFocusedNodes, recommendedFocusedRelations)) {
    warnings.push("The recommended projection has no complete Requirement → Principle → Feature chain; focused mode uses compact stored OKF relations without inventing links.");
  }

  const layerCounts: Partial<Record<WorkbenchDsrGroupKey, number>> = {};
  for (const group of dsrGroups) layerCounts[group.key] = elements.filter((element) => element.canonical_type === group.key).length;

  return {
    stored_flow_source: storedFlowSource,
    recommended: {
      nodes: recommendedNodes,
      relations: recommendedRelations
    },
    focused,
    full: {
      nodes: fullNodes,
      relations: fullAdaptedRelations
    },
    layer_counts: layerCounts,
    warnings
  };
}

type StoredPathCandidate = {
  nodeIds: string[];
  relationIds: string[];
  score: number;
};

const flowLayerRanks: Record<WorkbenchDsrGroupKey, number> = {
  Problem: 0,
  "Design Requirement": 1,
  "Design Principle": 2,
  "Design Feature": 3,
  Artifact: 4,
  Evaluation: 5,
  "Output Knowledge": 6
};

function compactStoredRelationPaths(
  nodes: WorkbenchElement[],
  relations: WorkbenchRelation[],
  maxPaths = 2
) {
  const nodeById = new Map(nodes.map((node) => [node.element_id, node]));
  const outgoing = new Map<string, WorkbenchRelation[]>();

  for (const relation of relations) {
    const source = nodeById.get(relation.source_node_id);
    const target = nodeById.get(relation.target_node_id);
    if (!source || !target || !isDsrGroupKey(source.canonical_type) || !isDsrGroupKey(target.canonical_type)) continue;
    if (flowLayerRanks[target.canonical_type] <= flowLayerRanks[source.canonical_type]) continue;
    outgoing.set(source.element_id, [...(outgoing.get(source.element_id) ?? []), relation]);
  }
  for (const edges of outgoing.values()) {
    edges.sort((left, right) => {
      const leftTarget = nodeById.get(left.target_node_id);
      const rightTarget = nodeById.get(right.target_node_id);
      return (leftTarget?.display_order ?? 0) - (rightTarget?.display_order ?? 0)
        || left.relation_id.localeCompare(right.relation_id);
    });
  }

  const memo = new Map<string, StoredPathCandidate[]>();
  const bestFrom = (nodeId: string): StoredPathCandidate[] => {
    const cached = memo.get(nodeId);
    if (cached) return cached;
    const edges = outgoing.get(nodeId) ?? [];
    const candidates: StoredPathCandidate[] = [];

    for (const edge of edges) {
      const suffixes = bestFrom(edge.target_node_id);
      if (suffixes.length === 0) {
        candidates.push(scoreStoredPath([nodeId, edge.target_node_id], [edge.relation_id], nodeById));
        continue;
      }
      for (const suffix of suffixes) {
        candidates.push(scoreStoredPath(
          [nodeId, ...suffix.nodeIds],
          [edge.relation_id, ...suffix.relationIds],
          nodeById
        ));
      }
    }

    const ranked = uniqueStoredPaths(candidates)
      .sort((left, right) => right.score - left.score || left.relationIds.join("|").localeCompare(right.relationIds.join("|")))
      .slice(0, 4);
    memo.set(nodeId, ranked);
    return ranked;
  };

  const ranked = uniqueStoredPaths(nodes.flatMap((node) => bestFrom(node.element_id)))
    .filter((candidate) => candidate.relationIds.length > 0)
    .sort((left, right) => right.score - left.score || left.relationIds.join("|").localeCompare(right.relationIds.join("|")));

  const selected: StoredPathCandidate[] = [];
  const selectedNodeIds = new Set<string>();
  for (const candidate of ranked) {
    const newNodeCount = candidate.nodeIds.filter((nodeId) => !selectedNodeIds.has(nodeId)).length;
    if (selected.length > 0 && newNodeCount < 2) continue;
    selected.push(candidate);
    candidate.nodeIds.forEach((nodeId) => selectedNodeIds.add(nodeId));
    if (selected.length >= maxPaths) break;
  }

  if (selected.length === 0 && relations[0]) {
    selected.push(scoreStoredPath(
      [relations[0].source_node_id, relations[0].target_node_id],
      [relations[0].relation_id],
      nodeById
    ));
  }

  const selectedRelationIds = new Set(selected.flatMap((candidate) => candidate.relationIds));
  const compactRelations = relations.filter((relation) => selectedRelationIds.has(relation.relation_id));
  const connectedIds = new Set(compactRelations.flatMap((relation) => [relation.source_node_id, relation.target_node_id]));
  return {
    nodes: nodes.filter((node) => connectedIds.has(node.element_id)),
    relations: compactRelations
  };
}

function connectedStoredGraph(nodes: WorkbenchElement[], relations: WorkbenchRelation[]) {
  const connectedIds = new Set(relations.flatMap((relation) => [relation.source_node_id, relation.target_node_id]));
  return {
    nodes: nodes.filter((node) => connectedIds.has(node.element_id)),
    relations: relations.filter((relation) => connectedIds.has(relation.source_node_id) && connectedIds.has(relation.target_node_id))
  };
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
function scoreStoredPath(
  nodeIds: string[],
  relationIds: string[],
  nodeById: Map<string, WorkbenchElement>
): StoredPathCandidate {
  const layers = new Set(nodeIds.map((nodeId) => nodeById.get(nodeId)?.canonical_type).filter(Boolean));
  const evidenceCount = nodeIds.reduce((sum, nodeId) => sum + (nodeById.get(nodeId)?.evidence_count ?? 0), 0);
  const confidence = nodeIds.reduce((sum, nodeId) => sum + (nodeById.get(nodeId)?.confidence ?? 0), 0);
  return {
    nodeIds,
    relationIds,
    score: layers.size * 10_000 + relationIds.length * 1_000 + evidenceCount * 10 + confidence
  };
}

function uniqueStoredPaths(candidates: StoredPathCandidate[]) {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = candidate.relationIds.join("|");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
function adaptPaper(paper: OkfPaper, kb: OkfKnowledgeBase): Paper {
  const concepts = conceptsForPaper(paper.paper_id, kb);
  const problems = concepts.filter((concept) => concept.type === "Problem");
  const artifacts = concepts.filter((concept) => concept.type === "Artifact");
  const evaluations = concepts.filter((concept) => concept.type === "Evaluation");
  const outputs = concepts.filter((concept) => concept.type === "OutputKnowledge");
  const limitations = concepts.filter((concept) => concept.type === "Limitation");
  const kernelTheories = concepts.filter((concept) => concept.type === "KernelTheory");
  const counts = Object.fromEntries(dsrGroups.map((group) => [
    group.key,
    concepts.filter((concept) => concept.type === group.conceptType).length
  ])) as Partial<Record<WorkbenchDsrGroupKey, number>>;

  return {
    paper_id: paper.paper_id,
    slug: workbenchPaperSlug(paper.paper_id),
    canonical_source: "okf",
    short_title: paper.title,
    full_citation: compactCitation(paper),
    year: paper.year ?? null,
    authors: paper.authors?.join("; ") || null,
    doi_or_url: null,
    source_document: paper.source_pdf_path ?? null,
    domain: problems[0]?.title ?? primaryTag(concepts) ?? "Design science research",
    artifact_type: summarizeTitles(artifacts, "No explicit artifact stored in OKF."),
    blockchain_dlt_role: summarizeDltRole(concepts),
    problem_description: summarizeConcepts(problems),
    input_knowledge: summarizeTitles(kernelTheories, null),
    research_process: summarizeTitles(evaluations, null),
    key_concepts: summarizeTitles(concepts.filter((concept) => ["DesignRequirement", "DesignPrinciple", "DesignFeature"].includes(concept.type)), null, 6),
    solution_description: summarizeConcepts(artifacts),
    output_knowledge: summarizeConcepts(outputs),
    evaluation_summary: summarizeConcepts(evaluations),
    boundary_conditions: summarizeConcepts(limitations),
    overall_extraction_status: "Indexed from canonical OKF",
    overall_confidence: confidenceNumber(highestConfidence(concepts.map((concept) => concept.confidence))),
    coder: null,
    date_coded: null,
    reviewer: null,
    review_status: paper.review_status,
    notes: canonicalWorkbenchChangeNotice,
    concept_counts: counts
  };
}

function adaptElements(concepts: OkfConcept[], evidence: OkfEvidenceItem[]): WorkbenchElement[] {
  const evidenceByConcept = groupBy(evidence.filter((item) => item.concept_id), (item) => item.concept_id as string);
  return concepts.map((concept, index) => {
    const linkedEvidence = evidenceByConcept.get(concept.concept_id) ?? [];
    return {
      paper_id: concept.paper_id,
      element_id: concept.concept_id,
      element_type: displayConceptType(concept.type) ?? concept.type,
      element_name: concept.title,
      element_text: concept.body_text || concept.description || null,
      normalized_text: concept.description || concept.body_text || null,
      source_status: concept.extraction_type,
      source_quote_id: linkedEvidence[0]?.evidence_id ?? null,
      page_or_section: linkedEvidence[0]?.section ?? (linkedEvidence[0]?.page_number ? `Page ${linkedEvidence[0].page_number}` : null),
      linked_problem_id: null,
      linked_requirement_id: null,
      linked_principle_id: null,
      kernel_theory_or_rationale: concept.type === "KernelTheory" ? concept.description || concept.body_text : null,
      evaluation_support: concept.type === "Evaluation" ? concept.description || concept.body_text : null,
      confidence: confidenceNumber(concept.confidence),
      coder: null,
      review_status: concept.review_status,
      notes: `Canonical OKF ${concept.type}; ${concept.extraction_type}.`,
      short_label: concept.title,
      display_order: index,
      main_diagram_include: null,
      extended_diagram_include: true,
      canonical_type: displayConceptType(concept.type),
      confidence_label: concept.confidence,
      evidence_count: linkedEvidence.length,
      evidence_ids: linkedEvidence.map((item) => item.evidence_id),
      okf_path: workbenchTargetOkfPath(concept.paper_id, "concept", concept.okf_path),
      canonical_field: concept.description ? "description" : "body_text"
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
    source_node_type: displayConceptType(conceptById.get(relation.source_concept_id)?.type) ?? conceptById.get(relation.source_concept_id)?.type ?? null,
    relation_type: relation.predicate,
    target_node_id: relation.target_concept_id,
    target_node_type: displayConceptType(conceptById.get(relation.target_concept_id)?.type) ?? conceptById.get(relation.target_concept_id)?.type ?? null,
    evidence_id: relation.evidence_id ?? null,
    source_status: provenance,
    confidence: confidenceNumber(relation.confidence),
    diagram_include: recommended,
    diagram_view: recommended ? "Main" : "Extended",
    review_status: "reviewed",
    notes: `Stored OKF relation (${provenance}).`,
    provenance,
    okf_path: workbenchTargetOkfPath(paperId, "relation")
  };
}

function adaptEvidence(items: OkfEvidenceItem[], relations: OkfRelation[], paperId: string): WorkbenchEvidence[] {
  const relationIdsByEvidence = groupBy(relations.filter((relation) => relation.evidence_id), (relation) => relation.evidence_id as string);
  return items.map((item) => ({
    paper_id: item.paper_id,
    evidence_id: item.evidence_id,
    evidence_type: item.quote ? "OKF source quote" : "OKF paraphrase",
    exact_quote_or_description: item.quote ?? item.paraphrase,
    page: item.page_number ? String(item.page_number) : null,
    section: item.section ?? null,
    element_ids_supported: item.concept_id ?? null,
    relation_ids_supported: (relationIdsByEvidence.get(item.evidence_id) ?? []).map((relation) => relation.relation_id).join("; ") || null,
    citation_note: item.source_location ?? null,
    source_status: "canonical OKF",
    evidence_strength: confidenceNumber(item.confidence),
    coder: null,
    notes: item.quote ? item.paraphrase : null,
    concept_id: item.concept_id ?? null,
    confidence_label: item.confidence,
    okf_path: workbenchTargetOkfPath(paperId, "evidence"),
    canonical_field: item.quote ? "quote" : "paraphrase"
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
  return kb.relations.filter((relation) => conceptIds.has(relation.source_concept_id) && conceptIds.has(relation.target_concept_id));
}

function displayConceptType(type: OkfConcept["type"] | undefined): WorkbenchElement["canonical_type"] {
  if (!type) return undefined;
  if (type === "DesignRequirement") return "Design Requirement";
  if (type === "DesignPrinciple") return "Design Principle";
  if (type === "DesignFeature") return "Design Feature";
  if (type === "OutputKnowledge") return "Output Knowledge";
  if (type === "ResearchQuestion") return "Research Question";
  if (type === "KernelTheory") return "Kernel Theory";
  if (type === "Limitation") return "Limitation";
  if (type === "Paper") return undefined;
  return type;
}

function isDsrGroupKey(value: WorkbenchElement["canonical_type"]): value is WorkbenchDsrGroupKey {
  return dsrGroups.some((group) => group.key === value);
}

function summarizeDltRole(concepts: OkfConcept[]) {
  const candidates = concepts.filter((concept) => {
    if (!["DesignPrinciple", "DesignFeature", "Artifact"].includes(concept.type)) return false;
    return /blockchain|distributed ledger|smart contract|on-chain|off-chain|token|self-sovereign|\bssi\b|\bnft\b/i.test(
      [concept.title, concept.description, concept.body_text, concept.tags.join(" ")].join(" ")
    );
  });
  return summarizeTitles(candidates, "DLT role is described in the stored design concepts.", 2);
}

function summarizeTitles(concepts: OkfConcept[], fallback: string | null, limit = 3) {
  const titles = concepts.map((concept) => concept.title.trim()).filter(Boolean).slice(0, limit);
  return titles.length ? titles.join("; ") : fallback;
}

function summarizeConcepts(concepts: OkfConcept[], limit = 3) {
  const values = concepts
    .map((concept) => concept.description || firstSentence(concept.body_text) || concept.title)
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, limit);
  return values.length ? values.join("\n\n") : null;
}

function primaryTag(concepts: OkfConcept[]) {
  return concepts.flatMap((concept) => concept.tags).find(Boolean);
}

function compactCitation(paper: OkfPaper) {
  const authors = paper.authors?.length ? paper.authors.join("; ") : undefined;
  return [authors, paper.year ? `(${paper.year})` : undefined, paper.title].filter(Boolean).join(" ");
}

function firstSentence(value: string) {
  return value.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim() ?? value.trim();
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

function groupBy<T>(items: T[], key: (item: T) => string) {
  const grouped = new Map<string, T[]>();
  for (const item of items) {
    const itemKey = key(item);
    grouped.set(itemKey, [...(grouped.get(itemKey) ?? []), item]);
  }
  return grouped;
}

async function loadWorkbenchKnowledgeBase(options: WorkbenchAdapterOptions) {
  return options.knowledgeBase ?? getOkfKnowledgeBaseForChat();
}
