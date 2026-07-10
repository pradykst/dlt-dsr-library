import type { ConfidenceLabel, FlowGraphLayer, FlowGraphMode, FlowGraphProvenance, OkfConcept, OkfConceptType, OkfEvidenceRef, OkfFlow, OkfFlowEdge, OkfFlowNode, OkfKnowledgeBase, OkfRelation, OkfRelationPredicate, OkfReuseFlowRow } from "./schema.ts";

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
  storedOnly?: boolean;
  includeQuerySpecificNodes?: boolean;
  layers?: FlowGraphLayer[];
};

export function buildOkfFlow(query: string, selectedConcepts: OkfConcept[], kb: OkfKnowledgeBase, options: FlowOptions = {}): OkfFlow {
  const mode = options.mode ?? (options.includeQueryProblem || options.flowRows?.some((row) => row.adaptation_status !== "stored") ? "mixed_reuse_flow" : "stored_paper_flow");
  const selectedIds = new Set(selectedConcepts.map((concept) => concept.concept_id));
  const candidateRelations = kb.relations.filter((relation) => {
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
  const ordered = orderConceptsForFlow(selectedConcepts.filter((concept) => connectedIds.has(concept.concept_id) || selectedConcepts.length <= 8 || hasPrimaryFlowType(concept.type)));
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
  if (options.includeQuerySpecificNodes ?? mode !== "stored_paper_flow") addQuerySpecificReuseNodes(query, nodesById, edgesById);

  const queryProblem = [...nodesById.values()].find((node) => node.id.startsWith("query_problem:"));
  if (queryProblem) {
    const firstStored = [...nodesById.values()].find((node) => !node.query_generated && (node.type === "DesignRequirement" || node.type === "Problem" || node.type === "ResearchQuestion"));
    if (firstStored) addGeneratedEdge(edgesById, queryProblem.id, firstStored.id, "motivates", "query_generated", "low", []);
  }

  const limitedNodes = orderNodesForFlow([...nodesById.values()]).slice(0, 56);
  const limitedNodeIds = new Set(limitedNodes.map((node) => node.id));
  const limitedEdges = [...edgesById.values()].filter((edge) => limitedNodeIds.has(edge.source) && limitedNodeIds.has(edge.target)).slice(0, 120);
  const warnings = limitedEdges.length === 0 && limitedNodes.length > 0 ? ["No stored relation edge connected the selected OKF nodes."] : [];
  const evidence_refs = evidenceRefsForGraph(limitedNodes, limitedEdges, kb);
  const graph_id = `flow:${stableSlug(query)}:${limitedNodes.length}:${limitedEdges.length}`;

  return {
    graph_id,
    flow_id: graph_id,
    title: options.title ?? (mode === "stored_paper_flow" ? "Stored OKF relation flow" : "Query-specific DSR reuse flow"),
    mode,
    layers: options.layers ?? graphLayers,
    nodes: limitedNodes,
    edges: limitedEdges,
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

function addQuerySpecificReuseNodes(query: string, nodesById: Map<string, OkfFlowNode>, edgesById: Map<string, OkfFlowEdge>) {
  const specs = querySpecificNodeSpecs(query);
  if (!specs.length) return;
  for (const spec of specs) {
    const id = `query_node:${spec.layer.toLowerCase()}:${stableSlug(spec.label)}`;
    if (!nodesById.has(id)) {
      nodesById.set(id, {
        id,
        label: spec.label,
        type: conceptTypeForLayer(spec.layer),
        layer: spec.layer,
        confidence: "low",
        evidence_ids: [],
        provenance: "query_generated",
        query_generated: true,
        short_description: "Target-domain node generated from the user query and grounded by retrieved OKF context."
      });
    }
  }
  const generatedNodes = [...nodesById.values()].filter((node) => node.id.startsWith("query_node:"));
  for (const node of generatedNodes) {
    const source = bestSourceForGeneratedNode(node, nodesById);
    if (source) addGeneratedEdge(edgesById, source.id, node.id, "adapted_to", source.provenance === "stored" ? "mixed" : "query_generated", "low", source.evidence_ids.slice(0, 4));
  }
}

function querySpecificNodeSpecs(query: string): Array<{ layer: FlowGraphLayer; label: string }> {
  const q = normalizeText(query);
  const specs: Array<{ layer: FlowGraphLayer; label: string }> = [];
  const has = (terms: string[]) => terms.some((term) => q.includes(normalizeText(term)));
  if (has(["product", "product data", "catalog"]) && has(["fragmented", "fragmentation", "quality", "consistency", "identity"])) {
    specs.push({ layer: "Requirement", label: "Create consistent product data identity across fragmented sources" });
    specs.push({ layer: "Feature", label: "Anchor product data changes with verification proofs and status history" });
    specs.push({ layer: "Artifact", label: "Product data registry with evidence, identity, and governance services" });
  }
  if (has(["product", "variant", "listing", "marketplace"]) && has(["identity", "review", "reputation", "relist", "continuity"])) {
    specs.push({ layer: "Requirement", label: "Maintain cross-marketplace product identity and review continuity" });
    specs.push({ layer: "Feature", label: "Gate reviews through verified-purchase and relisting-continuity checks" });
    specs.push({ layer: "Artifact", label: "Cross-marketplace product identity and review-continuity protocol" });
  }
  if (has(["raw", "commercial", "sensitive", "competitor", "privacy"])) {
    specs.push({ layer: "Requirement", label: "Minimize raw data exposure while preserving verifiability" });
  }
  if (has(["credential", "credentials", "identity", "revocation", "status"])) {
    specs.push({ layer: "Feature", label: "Verify actor credentials, issuer trust, and revocation status" });
  }
  return dedupeBy(specs, (spec) => `${spec.layer}:${normalizeText(spec.label)}`).slice(0, 5);
}

function bestSourceForGeneratedNode(node: OkfFlowNode, nodesById: Map<string, OkfFlowNode>) {
  const sourceLayer: Record<FlowGraphLayer, FlowGraphLayer[]> = {
    Problem: [],
    Requirement: ["Principle", "Feature", "Artifact"],
    Principle: ["Requirement"],
    Feature: ["Principle", "Requirement"],
    Artifact: ["Feature", "Principle"],
    Evaluation: ["Artifact"],
    OutputKnowledge: ["Evaluation", "Artifact"]
  };
  const candidates = [...nodesById.values()].filter((candidate) => !candidate.query_generated && sourceLayer[node.layer]?.includes(candidate.layer));
  return candidates.sort((a, b) => b.evidence_ids.length - a.evidence_ids.length || confidenceRank(b.confidence) - confidenceRank(a.confidence))[0];
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

function conceptTypeForLayer(layer: FlowGraphLayer): OkfConceptType {
  const map: Record<FlowGraphLayer, OkfConceptType> = {
    Problem: "Problem",
    Requirement: "DesignRequirement",
    Principle: "DesignPrinciple",
    Feature: "DesignFeature",
    Artifact: "Artifact",
    Evaluation: "Evaluation",
    OutputKnowledge: "OutputKnowledge"
  };
  return map[layer];
}

function hasPrimaryFlowType(type: OkfConceptType) {
  return type === "DesignRequirement" || type === "DesignPrinciple" || type === "DesignFeature" || type === "Artifact";
}

function confidenceRank(value: ConfidenceLabel) {
  if (value === "high") return 4;
  if (value === "medium-high") return 3;
  if (value === "medium") return 2;
  return 1;
}

function dedupeBy<T>(items: T[], keyFor: (item: T) => string) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = keyFor(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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
