import fs from "node:fs";
import path from "node:path";
import { isStoredMainElementType, projectStoredMainFlow, type StoredFlowProjection } from "./stored-flow-projection.ts";
import type { OkfConcept, OkfKnowledgeBase, OkfRelation, OkfRelationPredicate } from "./schema.ts";

type StoredGraphMetadata = {
  schema_version?: unknown;
  paper_id?: unknown;
  recommended_paths?: unknown;
  nodes?: unknown;
  edges?: unknown;
};

export type StoredGraphNodeMetadata = { id: string; type?: string };
export type StoredGraphEdgeMetadata = { id?: string; source: string; target: string; predicate?: string };
export type StoredPaperFlowMetadata = {
  paper_id: string;
  recommendedPaths: string[][];
  graphNodes: StoredGraphNodeMetadata[];
  graphEdges: StoredGraphEdgeMetadata[];
};

let storedGraphMetadataByPaperId: Map<string, StoredGraphMetadata> | undefined;

export type StoredOkfFlowProjection = {
  concepts: OkfConcept[];
  relations: OkfRelation[];
  sources: Record<string, StoredFlowProjection["source"]>;
  warnings: string[];
};

export function projectStoredOkfFlow(
  selectedConcepts: OkfConcept[],
  kb: OkfKnowledgeBase,
  predicates: readonly OkfRelationPredicate[],
  storedOnly = true
): StoredOkfFlowProjection {
  const selectedPaperIds = unique(selectedConcepts.map((concept) => concept.paper_id));
  const selectedIds = new Set(selectedConcepts.map((concept) => concept.concept_id));
  const projectedNodeIds = new Set<string>();
  const projectedRelationIds = new Set<string>();
  const sources: Record<string, StoredFlowProjection["source"]> = {};
  const warnings: string[] = [];

  for (const paperId of selectedPaperIds) {
    const paperConcepts = kb.concepts.filter((concept) => concept.paper_id === paperId);
    const storedMetadata = loadStoredPaperFlowMetadata(paperId);
    const recommendedPaths = storedMetadata?.recommendedPaths ?? [];
    const useGraphMainLayerFallback = recommendedPaths.length === 0 && Boolean(storedMetadata?.graphNodes.length && storedMetadata.graphEdges.length);
    const graphNodeIds = new Set((storedMetadata?.graphNodes ?? []).map((node) => scopedGraphId(paperId, node.id)));
    const graphEdgeKeys = new Set((storedMetadata?.graphEdges ?? []).map((edge) => graphEdgeKey(paperId, edge.source, edge.target, edge.predicate)));
    const recommendedNodeIds = new Set(recommendedPaths.flat().map((id) => scopedGraphId(paperId, id)));
    const candidateConcepts = recommendedPaths.length
      ? paperConcepts.filter((concept) => recommendedNodeIds.has(concept.concept_id))
      : useGraphMainLayerFallback
        ? paperConcepts.filter((concept) => graphNodeIds.has(concept.concept_id))
        : paperConcepts.filter((concept) => selectedIds.has(concept.concept_id));
    const candidateIds = new Set(candidateConcepts.map((concept) => concept.concept_id));
    const candidateRelations = kb.relations.filter((relation) => {
      if (!candidateIds.has(relation.source_concept_id) || !candidateIds.has(relation.target_concept_id)) return false;
      if (!predicates.includes(relation.predicate)) return false;
      if (storedMetadata && !graphEdgeKeys.has(graphEdgeKey(paperId, relation.source_concept_id, relation.target_concept_id, relation.predicate))) return false;
      return !storedOnly || relation.relation_scope !== "query_generated";
    });
    const projection = projectStoredMainFlow({
      nodes: candidateConcepts.map((concept) => ({ id: concept.concept_id, type: concept.type, include: !useGraphMainLayerFallback || isStoredMainElementType(concept.type) })),
      relations: candidateRelations.map((relation) => {
        const diagram = relation as OkfRelation & { diagram_include?: boolean | null; diagram_view?: string | null };
        return {
          id: relation.relation_id,
          source: relation.source_concept_id,
          target: relation.target_concept_id,
          diagramInclude: diagram.diagram_include,
          diagramView: diagram.diagram_view
        };
      }),
      recommendedPaths,
      fallbackSource: useGraphMainLayerFallback ? "graph_main_layers" : "stored_relations"
    });
    sources[paperId] = projection.source;
    projection.nodeIds.forEach((id) => projectedNodeIds.add(id));
    projection.relationIds.forEach((id) => projectedRelationIds.add(id));
    if (projection.unresolvedRecommendedNodeIds.length) {
      warnings.push(`${paperId} stored-flow metadata references unresolved node(s): ${projection.unresolvedRecommendedNodeIds.join(", ")}.`);
    }
    if (projection.unresolvedRecommendedEdges.length) {
      warnings.push(`${paperId} recommended path references unresolved stored edge(s): ${projection.unresolvedRecommendedEdges.map((edge) => `${edge.source} -> ${edge.target}`).join(", ")}.`);
    }
    if (useGraphMainLayerFallback) {
      warnings.push(`${paperId} graph metadata has no recommended main flow; using the shared stored Requirement/Principle/Feature fallback because OKF relations do not carry Workbench diagram flags.`);
    }
  }

  return {
    concepts: kb.concepts.filter((concept) => projectedNodeIds.has(concept.concept_id)),
    relations: kb.relations.filter((relation) => projectedRelationIds.has(relation.relation_id)),
    sources,
    warnings
  };
}

export function loadRecommendedStoredFlowPaths(paperId: string) {
  return loadStoredPaperFlowMetadata(paperId)?.recommendedPaths ?? [];
}

export function loadStoredPaperFlowMetadata(paperId: string): StoredPaperFlowMetadata | undefined {
  const metadata = readStoredGraphMetadata(paperId);
  if (!metadata) return undefined;
  const recommendedPaths = Array.isArray(metadata.recommended_paths)
    ? metadata.recommended_paths.map(stringArray).filter((candidate) => candidate.length > 0)
    : [];
  const graphNodes = recordArray(metadata.nodes).flatMap((node) => {
    if (typeof node.id !== "string" || !node.id.trim()) return [];
    return [{ id: node.id, type: typeof node.type === "string" ? node.type : undefined }];
  });
  const graphEdges = recordArray(metadata.edges).flatMap((edge) => {
    if (typeof edge.source !== "string" || typeof edge.target !== "string") return [];
    const idValue = typeof edge.id === "string" ? edge.id : typeof edge.relation_id === "string" ? edge.relation_id : undefined;
    return [{ id: idValue, source: edge.source, target: edge.target, predicate: typeof edge.predicate === "string" ? edge.predicate : undefined }];
  });
  return { paper_id: paperId, recommendedPaths, graphNodes, graphEdges };
}

function readStoredGraphMetadata(paperId: string) {
  if (!storedGraphMetadataByPaperId) {
    storedGraphMetadataByPaperId = new Map();
    const papersRoot = path.join(process.cwd(), "library", "okf", "papers");
    if (fs.existsSync(papersRoot)) {
      for (const entry of fs.readdirSync(papersRoot, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const metadata = parseGraphMetadata(path.join(papersRoot, entry.name, "graph.json"));
        const metadataPaperId = String(metadata?.paper_id ?? "");
        if (metadata && metadataPaperId) storedGraphMetadataByPaperId.set(metadataPaperId, metadata);
      }
    }
  }
  return storedGraphMetadataByPaperId.get(paperId);
}


function parseGraphMetadata(file: string): StoredGraphMetadata | undefined {
  if (!fs.existsSync(file)) return undefined;
  try {
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    return parsed && typeof parsed === "object" ? parsed as StoredGraphMetadata : undefined;
  } catch {
    return undefined;
  }
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())) : [];
}

function recordArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object") : [];
}

function scopedGraphId(paperId: string, id: string) {
  return id.includes(":") ? id : `${paperId}:${id}`;
}

function graphEdgeKey(paperId: string, source: string, target: string, predicate: string | undefined) {
  return [
    scopedGraphId(paperId, source),
    scopedGraphId(paperId, target),
    predicate ?? ""
  ].join("\u0000");
}


function unique(values: string[]) {
  return [...new Set(values)];
}
