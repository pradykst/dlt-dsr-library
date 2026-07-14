export type StoredFlowProjectionNode = {
  id: string;
  type?: string | null;
  include?: boolean;
};

export type StoredFlowProjectionRelation = {
  id: string;
  source: string;
  target: string;
  diagramInclude?: boolean | null;
  diagramView?: string | null;
};

export type StoredFlowProjection = {
  nodeIds: string[];
  relationIds: string[];
  source: "diagram_main" | "recommended_paths" | "graph_main_layers" | "stored_relations";
  unresolvedRecommendedNodeIds: string[];
};

export function projectStoredMainFlow(input: {
  nodes: StoredFlowProjectionNode[];
  relations: StoredFlowProjectionRelation[];
  recommendedPaths?: string[][];
  requireDiagramMetadata?: boolean;
  fallbackSource?: "graph_main_layers" | "stored_relations";
}): StoredFlowProjection {
  const nodeById = new Map(input.nodes.map((node) => [node.id, node]));
  const relations = input.relations.filter((relation) => {
    const source = nodeById.get(relation.source);
    const target = nodeById.get(relation.target);
    return Boolean(source && target && source.include !== false && target.include !== false);
  });
  const hasDiagramMetadata = input.requireDiagramMetadata || input.relations.some((relation) => relation.diagramInclude != null || Boolean(relation.diagramView?.trim()));

  if (hasDiagramMetadata) {
    return resultFromRelations(
      relations.filter((relation) => relation.diagramInclude === true && normalizeDiagramView(relation.diagramView) === "Main"),
      "diagram_main"
    );
  }

  const unresolvedRecommendedNodeIds: string[] = [];
  const recommendedPaths = (input.recommendedPaths ?? [])
    .map((path) => path.map((id) => resolveNodeId(id, nodeById)).filter((id): id is string => Boolean(id)))
    .filter((path) => path.length > 0);
  for (const path of input.recommendedPaths ?? []) {
    for (const id of path) if (!resolveNodeId(id, nodeById)) unresolvedRecommendedNodeIds.push(id);
  }
  if (recommendedPaths.length) {
    const pathSets = recommendedPaths.map((path) => new Set(path));
    const selected = relations.filter((relation) => pathSets.some((path) => path.has(relation.source) && path.has(relation.target)));
    return { ...resultFromRelations(selected, "recommended_paths"), unresolvedRecommendedNodeIds: unique(unresolvedRecommendedNodeIds) };
  }

  return resultFromRelations(relations, input.fallbackSource ?? "stored_relations");
}

export function normalizeDiagramView(value: string | null | undefined) {
  if (!value) return "Main";
  const normalized = value.trim().toLowerCase();
  if (!normalized || normalized === "main") return "Main";
  if (normalized === "extended") return "Extended";
  if (normalized === "hidden") return "Hidden";
  return value;
}

export function isStoredMainElementType(value: string | null | undefined) {
  const normalized = String(value ?? "").trim().toLowerCase().replace(/[\s_-]+/g, "");
  return normalized === "requirement" || normalized === "designrequirement" || normalized === "principle" || normalized === "designprinciple" || normalized === "feature" || normalized === "designfeature";
}

function resolveNodeId(id: string, nodeById: Map<string, StoredFlowProjectionNode>) {
  if (nodeById.has(id)) return id;
  const matches = [...nodeById.keys()].filter((candidate) => candidate.endsWith(`:${id}`));
  return matches.length === 1 ? matches[0] : undefined;
}

function resultFromRelations(relations: StoredFlowProjectionRelation[], source: StoredFlowProjection["source"]): StoredFlowProjection {
  return {
    nodeIds: unique(relations.flatMap((relation) => [relation.source, relation.target])),
    relationIds: unique(relations.map((relation) => relation.id)),
    source,
    unresolvedRecommendedNodeIds: []
  };
}

function unique(values: string[]) {
  return [...new Set(values)];
}
