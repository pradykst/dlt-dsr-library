export type NodeType =
  | "paper"
  | "domain"
  | "problem"
  | "requirement"
  | "principle"
  | "feature"
  | "artifact"
  | "evaluation"
  | "capability"
  | "pattern"
  | "theory"
  | "stakeholder";

export type EdgeType =
  | "addresses"
  | "motivates"
  | "derives"
  | "satisfies"
  | "implements"
  | "instantiated_in"
  | "evaluated_by"
  | "observed_in"
  | "supports"
  | "uses"
  | "grounded_in"
  | "mitigates"
  | "conflicts_with"
  | "generalizes_to";

export interface KnowledgeNode {
  id: string;
  type: NodeType;
  label: string;
  subtitle?: string;
  description: string;
  domain?: string;
  tags: string[];
  paperIds?: string[];
  capabilityIds?: string[];
  confidence: "high" | "medium" | "low";
}

export interface KnowledgeEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  label: string;
  strength: 1 | 2 | 3;
  paperIds?: string[];
}

export interface Paper {
  id: string;
  title: string;
  shortTitle: string;
  authors: string;
  year: number;
  venue: string;
  domain: string;
  problemFocus: string;
  artifact: string;
  evaluation: string;
  contribution: string;
  tags: string[];
}

export interface Pattern {
  id: string;
  title: string;
  summary: string;
  problemAddressed: string;
  whenToUse: string[];
  designLogic: string[];
  implementationFeatures: string[];
  observedInPaperIds: string[];
  relatedCapabilityIds: string[];
  limitations: string[];
}

export interface DesignGoal {
  id: string;
  label: string;
  description: string;
  relatedRequirementIds: string[];
  relatedPrincipleIds: string[];
  relatedFeatureIds: string[];
  relatedPatternIds: string[];
}

export interface GraphFilters {
  query?: string;
  nodeTypes?: NodeType[];
  domains?: string[];
  paperIds?: string[];
  capabilityIds?: string[];
  problemIds?: string[];
  includeExpanded?: boolean;
}

export interface PaperFlow {
  paper?: KnowledgeNode;
  problems: KnowledgeNode[];
  requirements: KnowledgeNode[];
  principles: KnowledgeNode[];
  features: KnowledgeNode[];
  artifacts: KnowledgeNode[];
  evaluations: KnowledgeNode[];
  patterns: KnowledgeNode[];
  capabilities: KnowledgeNode[];
}

export interface GeneratedFlow {
  goals: DesignGoal[];
  requirements: KnowledgeNode[];
  principles: KnowledgeNode[];
  features: KnowledgeNode[];
  artifacts: KnowledgeNode[];
  evaluations: KnowledgeNode[];
  patterns: Pattern[];
  papers: Paper[];
}
