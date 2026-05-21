import { capabilityCoverage, designGoals, knowledgeEdges, knowledgeNodes, papers, patterns } from "@/data/knowledge-base";
import type { GeneratedFlow, GraphFilters, KnowledgeNode, NodeType, PaperFlow } from "@/lib/types";

const byId = new Map(knowledgeNodes.map((node) => [node.id, node]));
const paperById = new Map(papers.map((paper) => [paper.id, paper]));
const patternById = new Map(patterns.map((pattern) => [pattern.id, pattern]));

export function getNodeById(id: string) {
  return byId.get(id);
}

export function getPaperById(id: string) {
  return paperById.get(id);
}

export function getPatternById(id: string) {
  return patternById.get(id);
}

export function getEdgesForNode(nodeId: string) {
  return knowledgeEdges.filter((edge) => edge.source === nodeId || edge.target === nodeId);
}

export function getRelatedNodes(nodeId: string) {
  return getEdgesForNode(nodeId)
    .map((edge) => (edge.source === nodeId ? edge.target : edge.source))
    .map((id) => byId.get(id))
    .filter(Boolean) as KnowledgeNode[];
}

const defaultTypes: NodeType[] = ["problem", "requirement", "principle", "feature", "capability", "pattern"];
const expandedTypes: NodeType[] = ["problem", "requirement", "principle", "feature", "capability", "pattern"];

export function getGraphForFilters(filters: GraphFilters = {}) {
  const activeTypes = filters.nodeTypes?.length ? filters.nodeTypes : filters.includeExpanded || filters.capabilityIds?.length ? expandedTypes : defaultTypes;
  const query = filters.query?.trim().toLowerCase();

  let nodes = knowledgeNodes.filter((node) => activeTypes.includes(node.type));

  if (query) {
    nodes = nodes.filter((node) => `${node.label} ${node.description} ${node.tags.join(" ")}`.toLowerCase().includes(query));
  }
  if (filters.domains?.length) nodes = nodes.filter((node) => !node.domain || filters.domains?.includes(node.domain));
  if (filters.paperIds?.length) {
    nodes = nodes.filter((node) => {
      const directPaperMatch = node.paperIds?.some((id) => filters.paperIds?.includes(id));
      const edgePaperMatch = getEdgesForNode(node.id).some((edge) => edge.paperIds?.some((id) => filters.paperIds?.includes(id)));
      return directPaperMatch || edgePaperMatch;
    });
  }
  if (filters.capabilityIds?.length) nodes = nodes.filter((node) => node.type === "capability" ? filters.capabilityIds?.includes(node.id) : node.capabilityIds?.some((id) => filters.capabilityIds?.includes(id)));
  if (filters.problemIds?.length) nodes = nodes.filter((node) => filters.problemIds?.includes(node.id) || getEdgesForNode(node.id).some((edge) => filters.problemIds?.includes(edge.source) || filters.problemIds?.includes(edge.target)));

  const nodeIds = new Set(nodes.map((node) => node.id));
  const visibleEdges = knowledgeEdges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target));
  const featurePatternEdges = createFeaturePatternEdges(nodeIds);
  const edges = [...visibleEdges, ...featurePatternEdges];

  return { nodes, edges };
}

function createFeaturePatternEdges(nodeIds: Set<string>) {
  const featureNodes = knowledgeNodes.filter((node) => node.type === "feature" && nodeIds.has(node.id));
  return patterns.flatMap((pattern) => {
    if (!nodeIds.has(pattern.id)) return [];
    return featureNodes
      .filter((feature) => pattern.implementationFeatures.includes(feature.label))
      .map((feature) => ({
        id: `${feature.id}-generalizes_to-${pattern.id}`,
        source: feature.id,
        target: pattern.id,
        type: "generalizes_to" as const,
        label: "generalizes to",
        strength: 1 as const,
        paperIds: pattern.observedInPaperIds
      }));
  });
}

const typePlural: Record<string, keyof PaperFlow> = {
  paper: "paper",
  problem: "problems",
  requirement: "requirements",
  principle: "principles",
  feature: "features",
  artifact: "artifacts",
  evaluation: "evaluations",
  pattern: "patterns",
  capability: "capabilities"
};

export function getPaperFlow(paperId: string): PaperFlow {
  const relatedEdgeIds = new Set<string>();
  const relatedNodeIds = new Set<string>([paperId]);
  let changed = true;

  while (changed) {
    changed = false;
    for (const edge of knowledgeEdges) {
      const belongsToPaper = edge.paperIds?.includes(paperId) || edge.source === paperId || edge.target === paperId;
      if (belongsToPaper && (relatedNodeIds.has(edge.source) || relatedNodeIds.has(edge.target) || edge.paperIds?.includes(paperId))) {
        relatedEdgeIds.add(edge.id);
        if (!relatedNodeIds.has(edge.source)) changed = true;
        if (!relatedNodeIds.has(edge.target)) changed = true;
        relatedNodeIds.add(edge.source);
        relatedNodeIds.add(edge.target);
      }
    }
  }

  const flow: PaperFlow = { paper: byId.get(paperId), problems: [], requirements: [], principles: [], features: [], artifacts: [], evaluations: [], patterns: [], capabilities: [] };
  for (const id of relatedNodeIds) {
    const node = byId.get(id);
    if (!node) continue;
    const key = typePlural[node.type];
    if (key && key !== "paper") (flow[key] as KnowledgeNode[]).push(node);
  }
  return flow;
}

export function getPatternCards(filters: { query?: string; capabilityIds?: string[]; paperIds?: string[] } = {}) {
  const query = filters.query?.toLowerCase();
  return patterns.filter((pattern) => {
    const matchesQuery = !query || `${pattern.title} ${pattern.summary} ${pattern.problemAddressed}`.toLowerCase().includes(query);
    const matchesCapability = !filters.capabilityIds?.length || pattern.relatedCapabilityIds.some((id) => filters.capabilityIds?.includes(id));
    const matchesPaper = !filters.paperIds?.length || pattern.observedInPaperIds.some((id) => filters.paperIds?.includes(id));
    return matchesQuery && matchesCapability && matchesPaper;
  });
}

export function getCapabilityCoverage() {
  return capabilityCoverage;
}

const uniqueNodes = (ids: string[]) => Array.from(new Set(ids)).map((id) => byId.get(id)).filter(Boolean) as KnowledgeNode[];

export function getFlowForGoals(goalIds: string[]): GeneratedFlow {
  const goals = designGoals.filter((goal) => goalIds.includes(goal.id));
  const requirementIds = goals.flatMap((goal) => goal.relatedRequirementIds);
  const principleIds = goals.flatMap((goal) => goal.relatedPrincipleIds);
  const featureIds = goals.flatMap((goal) => goal.relatedFeatureIds);
  const patternIds = goals.flatMap((goal) => goal.relatedPatternIds);

  const connectedArtifactIds = knowledgeEdges
    .filter((edge) => edge.type === "instantiated_in" && featureIds.includes(edge.source))
    .map((edge) => edge.target);
  const connectedEvaluationIds = knowledgeEdges
    .filter((edge) => edge.type === "evaluated_by" && connectedArtifactIds.includes(edge.source))
    .map((edge) => edge.target);
  const selectedPatterns = Array.from(new Set(patternIds)).map((id) => patternById.get(id)).filter(Boolean) as typeof patterns;
  const paperIds = Array.from(new Set(selectedPatterns.flatMap((pattern) => pattern.observedInPaperIds)));

  return {
    goals,
    requirements: uniqueNodes(requirementIds),
    principles: uniqueNodes(principleIds),
    features: uniqueNodes(featureIds),
    artifacts: uniqueNodes(connectedArtifactIds),
    evaluations: uniqueNodes(connectedEvaluationIds),
    patterns: selectedPatterns,
    papers: paperIds.map((id) => paperById.get(id)).filter(Boolean) as typeof papers
  };
}

export { designGoals, knowledgeEdges, knowledgeNodes, papers, patterns };
