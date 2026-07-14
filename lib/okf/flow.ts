import type { ConfidenceLabel, DesignMove, FlowGraphLayer, FlowGraphMode, FlowGraphProvenance, OkfConcept, OkfConceptType, OkfEvidenceRef, OkfFlow, OkfFlowEdge, OkfFlowNode, OkfKnowledgeBase, OkfRelation, OkfRelationPredicate, OkfReuseFlowRow } from "./schema.ts";
import { projectStoredOkfFlow } from "./stored-flow.ts";

const graphLayers: FlowGraphLayer[] = ["Problem", "Requirement", "Principle", "Feature", "Artifact", "Evaluation", "OutputKnowledge"];
const preferredTypes = ["Problem", "ResearchQuestion", "DesignRequirement", "DesignPrinciple", "DesignFeature", "Artifact", "Evaluation", "OutputKnowledge", "KernelTheory", "Limitation"];
const flowPredicates: OkfRelationPredicate[] = [
  "motivates",
  "requires",
  "addressed_by",
  "satisfies",
  "instantiates",
  "instantiated_by",
  "implements",
  "evaluated_by",
  "supported_by",
  "supports",
  "derived_from",
  "contributes_to"
];

export type FlowOptions = {
  includeQueryProblem?: boolean;
  mode?: FlowGraphMode;
  title?: string;
  flowRows?: OkfReuseFlowRow[];
  designMoves?: DesignMove[];
  storedOnly?: boolean;
  includeQuerySpecificNodes?: boolean;
  layers?: FlowGraphLayer[];
};

export function buildOkfFlow(query: string, selectedConcepts: OkfConcept[], kb: OkfKnowledgeBase, options: FlowOptions = {}): OkfFlow {
  const mode = options.mode ?? (options.includeQueryProblem || options.flowRows?.some((row) => row.adaptation_status !== "stored") ? "mixed_reuse_flow" : "stored_paper_flow");
  if (mode !== "stored_paper_flow" && options.designMoves?.length) {
    return buildMoveProjectedFlow(query, options.designMoves, selectedConcepts, kb, options, mode);
  }
  const storedProjection = mode === "stored_paper_flow" ? projectStoredOkfFlow(selectedConcepts, kb, flowPredicates, true) : undefined;
  const projectedConcepts = storedProjection?.concepts ?? selectedConcepts;
  const selectedIds = new Set(projectedConcepts.map((concept) => concept.concept_id));
  const candidateRelations = storedProjection?.relations ?? kb.relations.filter((relation) => {
    if (!selectedIds.has(relation.source_concept_id) || !selectedIds.has(relation.target_concept_id)) return false;
    if (!flowPredicates.includes(relation.predicate)) return false;
    return !options.storedOnly || relation.relation_scope !== "query_generated";
  });
  const connectedIds = new Set<string>();
  for (const relation of candidateRelations) {
    connectedIds.add(relation.source_concept_id);
    connectedIds.add(relation.target_concept_id);
  }

  const nodesById = new Map<string, OkfFlowNode>();
  const ordered = orderConceptsForFlow(projectedConcepts.filter((concept) => connectedIds.has(concept.concept_id) || projectedConcepts.length <= 8 || hasPrimaryFlowType(concept.type)));
  for (const concept of ordered) addConceptNode(nodesById, concept, kb);

  if (options.includeQueryProblem) {
    const id = `query_problem:${stableSlug(query)}`;
    if (!nodesById.has(id)) {
      nodesById.set(id, {
        id,
        label: query.slice(0, 120),
        type: "Problem",
        layer: "Problem",
        confidence: "low",
        evidence_ids: [],
        provenance: "query_generated",
        query_generated: true,
        short_description: "User-provided design problem."
      });
    }
  }

  const edgesById = new Map<string, OkfFlowEdge>();
  for (const relation of candidateRelations) {
    if (!nodesById.has(relation.source_concept_id) || !nodesById.has(relation.target_concept_id)) continue;
    addRelationEdge(edgesById, relation);
  }

  if (options.flowRows?.length) addRowDerivedFlow(query, options.flowRows, selectedConcepts, kb, nodesById, edgesById, mode);

  const queryProblem = [...nodesById.values()].find((node) => node.id.startsWith("query_problem:"));
  if (queryProblem) {
    const firstStored = [...nodesById.values()].find((node) => !node.query_generated && (node.type === "DesignRequirement" || node.type === "Problem" || node.type === "ResearchQuestion"));
    if (firstStored) addGeneratedEdge(edgesById, queryProblem.id, firstStored.id, "motivates", "query_generated", "low", []);
  }

  const orderedNodes = orderNodesForFlow([...nodesById.values()]);
  const limitedNodes = mode === "stored_paper_flow" ? orderedNodes : orderedNodes.slice(0, 56);
  const limitedNodeIds = new Set(limitedNodes.map((node) => node.id));
  const connectedEdges = [...edgesById.values()].filter((edge) => limitedNodeIds.has(edge.source) && limitedNodeIds.has(edge.target));
  const limitedEdges = mode === "stored_paper_flow" ? connectedEdges : connectedEdges.slice(0, 120);
  const warnings = [...(storedProjection?.warnings ?? [])];
  if (limitedEdges.length === 0 && limitedNodes.length > 0) warnings.push("No stored relation edge connected the selected OKF nodes.");
  const evidence_refs = evidenceRefsForGraph(limitedNodes, limitedEdges, kb);
  const graph_id = `flow:${stableSlug(query)}:${limitedNodes.length}:${limitedEdges.length}`;
  const stored_flow_source = storedProjection
    ? Object.values(storedProjection.sources).some((source) => source !== "stored_relations")
      ? "graph_json" as const
      : "okf_relations_fallback" as const
    : undefined;

  return {
    graph_id,
    flow_id: graph_id,
    title: options.title ?? (mode === "stored_paper_flow" ? "Stored OKF relation flow" : "Query-specific DSR reuse flow"),
    mode,
    layers: options.layers ?? graphLayers,
    nodes: limitedNodes,
    edges: limitedEdges,
    stored_flow_source,
    evidence_refs,
    warnings
  };
}

function buildMoveProjectedFlow(query: string, designMoves: DesignMove[], selectedConcepts: OkfConcept[], kb: OkfKnowledgeBase, options: FlowOptions, mode: FlowGraphMode): OkfFlow {
  const moves = designMoves
    .filter((move) => move.reused_requirement && move.reused_principle && move.candidate_feature && move.artifact_pattern)
    .slice(0, 7);
  const conceptByProjectionKey = new Map<string, OkfConcept[]>();
  for (const concept of selectedConcepts) {
    const layer = layerForConceptType(concept.type);
    if (!layer || !["Requirement", "Principle", "Feature", "Artifact"].includes(layer)) continue;
    const key = `${layer}:${normalizeText(concept.title)}`;
    conceptByProjectionKey.set(key, [...(conceptByProjectionKey.get(key) ?? []), concept]);
  }

  const nodesById = new Map<string, OkfFlowNode>();
  const edgesById = new Map<string, OkfFlowEdge>();

  for (const move of moves) {
    const supportingPapers = new Set(move.supporting_paper_ids);
    const pathSpecs: Array<{ layer: FlowGraphLayer; type: OkfConceptType; label: string }> = [
      { layer: "Requirement", type: "DesignRequirement", label: move.reused_requirement },
      { layer: "Principle", type: "DesignPrinciple", label: move.reused_principle },
      { layer: "Feature", type: "DesignFeature", label: move.candidate_feature },
      { layer: "Artifact", type: "Artifact", label: move.artifact_pattern }
    ];
    const path = pathSpecs.map((spec) => {
      const candidates = conceptByProjectionKey.get(`${spec.layer}:${normalizeText(spec.label)}`) ?? [];
      const concept = candidates.find((candidate) => supportingPapers.has(candidate.paper_id)) ?? candidates[0];
      if (concept) {
        const evidenceIds = evidenceIdsForConcept(concept.concept_id, kb).filter((id) => move.evidence_ids.includes(id));
        const existing = nodesById.get(concept.concept_id);
        if (existing) {
          existing.evidence_ids = uniqueStrings([...existing.evidence_ids, ...evidenceIds]);
          return existing;
        }
        const node: OkfFlowNode = {
          id: concept.concept_id,
          label: concept.title,
          type: concept.type,
          layer: spec.layer,
          concept_id: concept.concept_id,
          paper_id: concept.paper_id,
          confidence: concept.confidence,
          evidence_ids: evidenceIds,
          provenance: "stored",
          query_generated: false,
          short_description: concept.description || concept.body_text || undefined
        };
        nodesById.set(node.id, node);
        return node;
      }
      const provenance: FlowGraphProvenance = move.adaptation_status === "stored" ? "mixed" : move.adaptation_status;
      const id = `move_node:${stableSlug(move.id)}:${spec.layer.toLowerCase()}`;
      const node: OkfFlowNode = {
        id,
        label: spec.label,
        type: spec.type,
        layer: spec.layer,
        confidence: move.confidence,
        evidence_ids: uniqueStrings(move.evidence_ids).slice(0, 3),
        provenance,
        query_generated: true,
        short_description: move.what_to_build
      };
      nodesById.set(id, node);
      return node;
    });

    for (let index = 0; index < path.length - 1; index += 1) {
      const source = path[index];
      const target = path[index + 1];
      const relation = source.concept_id && target.concept_id ? findStoredRelation(source.concept_id, target.concept_id, kb) : undefined;
      if (relation) {
        addRelationEdge(edgesById, relation);
        const edge = edgesById.get(relation.relation_id);
        if (edge) edge.evidence_ids = relation.evidence_id && move.evidence_ids.includes(relation.evidence_id) ? [relation.evidence_id] : [];
      }
      else {
        const provenance: FlowGraphProvenance = move.adaptation_status === "query_generated" ? "query_generated" : "mixed";
        addGeneratedEdge(edgesById, source.id, target.id, "adapted_to", provenance, move.confidence, move.evidence_ids, `${move.id}-${index + 1}`);
      }
    }
  }

  const nodes = orderNodesForFlow([...nodesById.values()]);
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = [...edgesById.values()].filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target));
  const layerCounts = new Map<FlowGraphLayer, number>();
  for (const node of nodes) layerCounts.set(node.layer, (layerCounts.get(node.layer) ?? 0) + 1);
  const warnings: string[] = [];
  if (moves.length < 5) warnings.push(`Only ${moves.length} validated design move(s) were available for this query-generated flow.`);
  if ([...layerCounts.entries()].some(([layer, count]) => layer !== "Problem" && count > 7)) warnings.push("The move projection exceeded the seven-node-per-layer bound.");
  if (nodes.some((node) => !edges.some((edge) => edge.source === node.id || edge.target === node.id))) warnings.push("The move projection contains an orphan node.");
  const evidence_refs = evidenceRefsForGraph(nodes, edges, kb);
  const graph_id = `flow:${stableSlug(query)}:${nodes.length}:${edges.length}`;
  return {
    graph_id,
    flow_id: graph_id,
    title: options.title ?? "Query-specific DSR reuse flow",
    mode,
    layers: options.layers ?? graphLayers,
    nodes,
    edges,
    evidence_refs,
    warnings
  };
}

function addConceptNode(nodesById: Map<string, OkfFlowNode>, concept: OkfConcept, kb: OkfKnowledgeBase) {
  const layer = layerForConceptType(concept.type);
  if (!layer) return;
  nodesById.set(concept.concept_id, {
    id: concept.concept_id,
    label: concept.title,
    type: concept.type,
    layer,
    concept_id: concept.concept_id,
    paper_id: concept.paper_id,
    confidence: concept.confidence,
    evidence_ids: evidenceIdsForConcept(concept.concept_id, kb),
    provenance: concept.query_generated ? "query_generated" : "stored",
    query_generated: concept.query_generated,
    short_description: concept.description || concept.body_text || undefined
  });
}

function addRelationEdge(edgesById: Map<string, OkfFlowEdge>, relation: OkfRelation) {
  edgesById.set(relation.relation_id, {
    id: relation.relation_id,
    source: relation.source_concept_id,
    target: relation.target_concept_id,
    predicate: relation.predicate,
    relation_id: relation.relation_id,
    confidence: relation.confidence,
    evidence_ids: relation.evidence_id ? [relation.evidence_id] : [],
    provenance: relation.relation_scope === "query_generated" ? "query_generated" : "stored"
  });
}

function addRowDerivedFlow(query: string, rows: OkfReuseFlowRow[], selectedConcepts: OkfConcept[], kb: OkfKnowledgeBase, nodesById: Map<string, OkfFlowNode>, edgesById: Map<string, OkfFlowEdge>, mode: FlowGraphMode) {
  const conceptById = new Map(selectedConcepts.map((concept) => [concept.concept_id, concept]));
  for (const row of rows) {
    const requirement = ensureRowNode(query, row, "DesignRequirement", "Requirement", row.requirement_label, conceptById, kb, nodesById, mode);
    const principle = ensureRowNode(query, row, "DesignPrinciple", "Principle", row.principle_label, conceptById, kb, nodesById, mode);
    const feature = ensureRowNode(query, row, "DesignFeature", "Feature", row.feature_label, conceptById, kb, nodesById, mode);
    const artifact = ensureRowNode(query, row, "Artifact", "Artifact", row.artifact_pattern, conceptById, kb, nodesById, mode);
    const chain = [requirement, principle, feature, artifact].filter((node): node is OkfFlowNode => Boolean(node));
    for (let index = 0; index < chain.length - 1; index += 1) {
      const source = chain[index];
      const target = chain[index + 1];
      const relation = findStoredRelation(source.id, target.id, kb);
      if (relation) {
        addRelationEdge(edgesById, relation);
        continue;
      }
      const provenance: FlowGraphProvenance = row.adaptation_status === "stored" && mode === "stored_paper_flow" ? "stored" : row.adaptation_status === "stored" ? "mixed" : row.adaptation_status;
      addGeneratedEdge(edgesById, source.id, target.id, "adapted_to", provenance, row.confidence, row.evidence_ids, row.row_id);
    }
  }
}

function ensureRowNode(query: string, row: OkfReuseFlowRow, type: OkfConceptType, layer: FlowGraphLayer, label: string | undefined, conceptById: Map<string, OkfConcept>, kb: OkfKnowledgeBase, nodesById: Map<string, OkfFlowNode>, mode: FlowGraphMode) {
  const concept = row.concept_ids.map((id) => conceptById.get(id)).find((item) => item?.type === type);
  if (concept) {
    addConceptNode(nodesById, concept, kb);
    return nodesById.get(concept.concept_id);
  }
  const trimmed = label?.trim();
  if (!trimmed) return undefined;
  const provenance: FlowGraphProvenance = mode === "stored_paper_flow" ? "mixed" : row.adaptation_status === "stored" ? "mixed" : row.adaptation_status;
  const id = `query_node:${stableSlug(row.row_id)}:${stableSlug(type)}:${stableSlug(trimmed || query)}`;
  if (!nodesById.has(id)) {
    nodesById.set(id, {
      id,
      label: trimmed,
      type,
      layer,
      confidence: row.confidence,
      evidence_ids: row.evidence_ids,
      provenance,
      query_generated: true,
      short_description: row.adaptation_text
    });
  }
  return nodesById.get(id);
}

function addGeneratedEdge(edgesById: Map<string, OkfFlowEdge>, source: string, target: string, predicate: string, provenance: FlowGraphProvenance, confidence: ConfidenceLabel, evidenceIds: string[], rowId?: string) {
  const id = `edge:${rowId ? stableSlug(rowId) : stableSlug(`${source}-${target}-${predicate}`)}:${stableSlug(source)}:${stableSlug(target)}`;
  if (edgesById.has(id) || [...edgesById.values()].some((edge) => edge.source === source && edge.target === target && edge.predicate === predicate)) return;
  edgesById.set(id, { id, source, target, predicate, confidence, evidence_ids: uniqueStrings(evidenceIds).slice(0, 8), provenance });
}

function findStoredRelation(source: string, target: string, kb: OkfKnowledgeBase) {
  return kb.relations.find((relation) => relation.source_concept_id === source && relation.target_concept_id === target && relation.relation_scope !== "query_generated" && flowPredicates.includes(relation.predicate));
}

function evidenceRefsForGraph(nodes: OkfFlowNode[], edges: OkfFlowEdge[], kb: OkfKnowledgeBase): OkfEvidenceRef[] {
  const ids = new Set([...nodes.flatMap((node) => node.evidence_ids), ...edges.flatMap((edge) => edge.evidence_ids)]);
  return kb.evidence_items
    .filter((item) => ids.has(item.evidence_id))
    .map((item) => ({ evidence_id: item.evidence_id, paper_id: item.paper_id, concept_id: item.concept_id, excerpt: item.quote ?? item.paraphrase, section: item.section, page_number: item.page_number, confidence: item.confidence }));
}

function evidenceIdsForConcept(conceptId: string, kb: OkfKnowledgeBase) {
  return kb.evidence_items.filter((item) => item.concept_id === conceptId).map((item) => item.evidence_id).slice(0, 8);
}

function orderConceptsForFlow(concepts: OkfConcept[]) {
  return [...concepts].sort((a, b) => {
    const typeDelta = preferredTypes.indexOf(a.type) - preferredTypes.indexOf(b.type);
    if (typeDelta !== 0) return typeDelta;
    return a.concept_id.localeCompare(b.concept_id);
  });
}

function orderNodesForFlow(nodes: OkfFlowNode[]) {
  return [...nodes].sort((a, b) => graphLayers.indexOf(a.layer) - graphLayers.indexOf(b.layer) || Number(a.query_generated ?? false) - Number(b.query_generated ?? false) || a.id.localeCompare(b.id));
}

function layerForConceptType(type: OkfConceptType): FlowGraphLayer | undefined {
  if (type === "Problem" || type === "ResearchQuestion") return "Problem";
  if (type === "DesignRequirement") return "Requirement";
  if (type === "DesignPrinciple") return "Principle";
  if (type === "DesignFeature") return "Feature";
  if (type === "Artifact") return "Artifact";
  if (type === "Evaluation") return "Evaluation";
  if (type === "OutputKnowledge" || type === "KernelTheory" || type === "Limitation") return "OutputKnowledge";
  return undefined;
}


function hasPrimaryFlowType(type: OkfConceptType) {
  return type === "DesignRequirement" || type === "DesignPrinciple" || type === "DesignFeature" || type === "Artifact";
}


function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function stableSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64) || "okf-query";
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
