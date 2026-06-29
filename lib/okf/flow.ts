import type { OkfConcept, OkfFlow, OkfFlowEdge, OkfFlowNode, OkfKnowledgeBase, OkfRelationPredicate } from "./schema.ts";

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

type FlowOptions = { includeQueryProblem?: boolean };

export function buildOkfFlow(query: string, selectedConcepts: OkfConcept[], kb: OkfKnowledgeBase, options: FlowOptions = {}): OkfFlow {
  const selectedIds = new Set(selectedConcepts.map((concept) => concept.concept_id));
  const candidateRelations = kb.relations.filter((relation) => selectedIds.has(relation.source_concept_id) && selectedIds.has(relation.target_concept_id) && flowPredicates.includes(relation.predicate));
  const connectedIds = new Set<string>();
  for (const relation of candidateRelations) {
    connectedIds.add(relation.source_concept_id);
    connectedIds.add(relation.target_concept_id);
  }

  const ordered = orderConceptsForFlow(selectedConcepts.filter((concept) => connectedIds.has(concept.concept_id) || selectedConcepts.length <= 8));
  const nodes: OkfFlowNode[] = ordered.map((concept) => ({
    id: concept.concept_id,
    label: concept.title,
    type: concept.type,
    concept_id: concept.concept_id,
    paper_id: concept.paper_id,
    confidence: concept.confidence,
    query_generated: concept.query_generated
  }));

  if (options.includeQueryProblem && !nodes.some((node) => node.id === `query_problem:${stableSlug(query)}`)) {
    nodes.unshift({
      id: `query_problem:${stableSlug(query)}`,
      label: query.slice(0, 120),
      type: "Problem",
      confidence: "low",
      query_generated: true
    });
  }

  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges: OkfFlowEdge[] = candidateRelations
    .filter((relation) => nodeIds.has(relation.source_concept_id) && nodeIds.has(relation.target_concept_id))
    .map((relation) => ({
      source: relation.source_concept_id,
      target: relation.target_concept_id,
      predicate: relation.predicate,
      relation_id: relation.relation_id,
      confidence: relation.confidence
    }));

  if (nodes[0]?.query_generated) {
    const firstStored = nodes.find((node) => !node.query_generated && (node.type === "DesignRequirement" || node.type === "Problem" || node.type === "ResearchQuestion"));
    if (firstStored) edges.unshift({ source: nodes[0].id, target: firstStored.id, predicate: "motivates", confidence: "low" });
  }

  return {
    flow_id: `flow:${stableSlug(query)}:${nodes.length}:${edges.length}`,
    title: "Query-specific DSR recommendation flow",
    nodes: nodes.slice(0, 40),
    edges: edges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)).slice(0, 80)
  };
}

function orderConceptsForFlow(concepts: OkfConcept[]) {
  return [...concepts].sort((a, b) => {
    const typeDelta = preferredTypes.indexOf(a.type) - preferredTypes.indexOf(b.type);
    if (typeDelta !== 0) return typeDelta;
    return a.concept_id.localeCompare(b.concept_id);
  });
}

function stableSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64) || "okf-query";
}
