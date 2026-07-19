export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | JsonObject;

export interface JsonObject {
  [key: string]: JsonValue;
}

export interface TypeCountDto {
  type: string;
  label: string;
  count: number;
}

export interface ConceptSummaryDto {
  id: string;
  filePath: string;
  type: string;
  typeLabel: string;
  title: string;
  description?: string;
  tags: string[];
}

export interface PaperSearchFieldsDto {
  title: string;
  description: string;
  authors: string[];
  year: string;
  venue: string;
  tags: string[];
}

export interface PaperCardDto extends ConceptSummaryDto {
  authors: string[];
  year?: string;
  venue?: string;
  search: PaperSearchFieldsDto;
  linkedConcepts: ConceptSummaryDto[];
  linkedTypeCounts: TypeCountDto[];
}

export interface LibraryFilterOptionsDto {
  types: TypeCountDto[];
  tags: string[];
  years: string[];
  venues: string[];
}

export interface LibraryViewModel {
  title: string;
  version?: string;
  paperCount: number;
  designKnowledgeCount: number;
  typeCounts: TypeCountDto[];
  filterOptions: LibraryFilterOptionsDto;
  papers: PaperCardDto[];
}

export interface ConceptDetailDto extends ConceptSummaryDto {
  resource?: string;
  timestamp?: string;
  frontmatter: JsonObject;
  markdownBody: string;
}

export interface LinkedConceptGroupDto {
  type: string;
  typeLabel: string;
  count: number;
  concepts: ConceptSummaryDto[];
}

export type RelationshipDirection = "incoming" | "outgoing";

export interface RelationshipDto {
  direction: RelationshipDirection;
  sourceId: string;
  sourceTitle: string;
  sourceType?: string;
  targetId?: string;
  targetTitle: string;
  targetType?: string;
  targetPath?: string;
  rawTarget: string;
  label: string;
  relationHint?: string;
  resolved: boolean;
  broken: boolean;
  external: boolean;
  /** The opposite endpoint's title from the selected concept's perspective. */
  displayTitle: string;
  displayType?: string;
}

export interface GraphNodeDto {
  id: string;
  filePath: string;
  type: string;
  typeLabel: string;
  title: string;
  description?: string;
  label?: string;
  tags: string[];
  /** Plain-text, bounded preview for client-side drawers. */
  markdownSummary?: string;
  seed: boolean;
}

export interface GraphEdgeDto {
  sourceId: string;
  sourceTitle: string;
  targetId: string;
  targetTitle: string;
  rawTarget: string;
  label: string;
  relationHint?: string;
  resolved: boolean;
  broken: boolean;
  external: boolean;
}

export interface GraphDto {
  depth: 1 | 2;
  nodes: GraphNodeDto[];
  edges: GraphEdgeDto[];
  truncated: boolean;
}

export interface PaperDesignMapColumnDto {
  key: string;
  type: string;
  title: string;
  nodeIds: string[];
}

export interface PaperDesignMapEdgeDto {
  id: string;
  sourceId: string;
  targetId: string;
  label: "addresses" | "implements" | "supports" | "satisfies";
  /** Number of raw links represented by this canonical semantic edge. */
  sourceRelationshipCount: number;
}

export interface PaperDesignMapDto {
  paperId: string;
  columns: PaperDesignMapColumnDto[];
  nodes: GraphNodeDto[];
  edges: PaperDesignMapEdgeDto[];
}

export interface WorkbenchViewModel {
  kind: "paper" | "concept";
  concept: ConceptDetailDto;
  linkedGroups: LinkedConceptGroupDto[];
  outgoing: RelationshipDto[];
  incoming: RelationshipDto[];
  graphOneHop: GraphDto;
  graphTwoHops: GraphDto;
  paperDesignMap?: PaperDesignMapDto;
}

export type PaperWorkbenchViewModel = WorkbenchViewModel;
export type ConceptWorkbenchViewModel = WorkbenchViewModel;
