import type { OkfConcept, OkfFlow, OkfFlowEdge, OkfFlowNode, OkfKnowledgeBase, OkfRelation, OkfRelationPredicate } from "./schema.ts";

const preferredTypes = ["Problem", "DesignRequirement", "DesignPrinciple", "DesignFeature", "Artifact"];
const preferredPredicates: OkfRelationPredicate[] = ["motivates", "requires", "addressed_by", "satisfies", "instantiates", "implements", "contributes_to"];

export function buildOkfFlow(query: string, selectedConcepts: OkfConcept[], kb: OkfKnowledgeBase): OkfFlow {
  const selectedIds = new Set(selectedConcepts.map((concept) => concept.concept_id));
  const candidateRelations = kb.relations.filter((relation) => selectedIds.has(relation.source_concept_id) && selectedIds.has(relation.target_concept_id) && preferredPredicates.includes(relation.predicate));
  const ordered = orderConceptsForFlow(selectedConcepts, candidateRelations);
  const nodes: OkfFlowNode[] = ordered.map((concept) => ({
    id: concept.concept_id,
    label: concept.title,
    type: concept.type,
    concept_id: concept.concept_id,
    paper_id: concept.paper_id,
    confidence: concept.confidence,
    query_generated: concept.query_generated
  }));

  if (!nodes.some((node) => node.type === "Problem")) {
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
      predicate: flowPredicate(relation),
      relation_id: relation.relation_id,
      confidence: relation.confidence
    }));

  if (nodes[0]?.query_generated) {
    const firstRequirement = nodes.find((node) => node.type === "DesignRequirement") ?? nodes.find((node) => node.type !== "Problem");
    if (firstRequirement) {
      edges.unshift({ source: nodes[0].id, target: firstRequirement.id, predicate: "motivates", confidence: "low" });
    }
  }

  for (let index = 0; index < nodes.length - 1; index += 1) {
    const source = nodes[index];
    const target = nodes[index + 1];
    if (!edges.some((edge) => edge.source === source.id && edge.target === target.id) && source.type !== target.type) {
      edges.push({ source: source.id, target: target.id, predicate: inferredPredicate(source.type, target.type), confidence: "low" });
    }
  }

  return {
    flow_id: `flow:${stableSlug(query)}:${nodes.length}:${edges.length}`,
    title: "Query-specific DSR recommendation flow",
    nodes: nodes.slice(0, 12),
    edges: edges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target)).slice(0, 14)
  };
}

function orderConceptsForFlow(concepts: OkfConcept[], relations: OkfRelation[]) {
  const relationTargets = new Set(relations.map((relation) => relation.target_concept_id));
  return [...concepts].sort((a, b) => {
    const typeDelta = preferredTypes.indexOf(a.type) - preferredTypes.indexOf(b.type);
    if (typeDelta !== 0) return typeDelta;
    const aSourceBias = relationTargets.has(a.concept_id) ? 1 : 0;
    const bSourceBias = relationTargets.has(b.concept_id) ? 1 : 0;
    return aSourceBias - bSourceBias || a.title.localeCompare(b.title);
  });
}

function flowPredicate(relation: OkfRelation): OkfRelationPredicate {
  if (["motivates", "addressed_by", "instantiates", "contributes_to"].includes(relation.predicate)) return relation.predicate;
  if (relation.predicate === "requires") return "motivates";
  if (relation.predicate === "implements") return "instantiates";
  return "contributes_to";
}

function inferredPredicate(sourceType: string, targetType: string): OkfRelationPredicate {
  if (sourceType === "Problem") return "motivates";
  if (targetType === "DesignPrinciple") return "addressed_by";
  if (targetType === "DesignFeature") return "instantiates";
  return "contributes_to";
}

function stableSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 64) || "okf-query";
}

