import "server-only";

export type SearchMatchSource =
  | "exact-path"
  | "exact-title"
  | "quoted-phrase"
  | "conceptId"
  | "path"
  | "type"
  | "title"
  | "description"
  | "tags"
  | "headings"
  | "body"
  | "resource"
  | "authors"
  | "year"
  | "venue"
  | "methodology"
  | "sourcePaper"
  | "label";

export interface SearchOptions {
  /** Maximum ranked results returned. Values are clamped to a safe upper bound. */
  limit?: number;
  /** Optional native OKF type filter. Types remain open-ended strings. */
  types?: readonly string[];
  /** Enables prefix matching for meaningful terms. Defaults to true. */
  prefix?: boolean;
  /** Enables modest one-edit fuzzy matching for sufficiently long terms. */
  fuzzy?: boolean;
}

export interface SearchResult {
  conceptId: string;
  type: string;
  title?: string;
  description?: string;
  /** Bundle-relative Markdown path; never an absolute filesystem path. */
  path: string;
  score: number;
  matchedTerms: string[];
  matchSource: SearchMatchSource[];
  sourcePaper?: string;
  seedRank: number;
}

export type OkfSearchResult = SearchResult;

export interface SearchDiagnostics {
  indexedConceptCount: number;
  candidateCount: number;
  meaningfulTermCount: number;
  /** Largest number of query terms matched exactly by a returned document. */
  meaningfulOverlapCount: number;
  meaningfulOverlapRatio: number;
  exactResultCount: number;
  prefixOnlyResultCount: number;
  fuzzyOnlyResultCount: number;
  hasExactMatch: boolean;
  hasExactTitleMatch: boolean;
  hasExactPathMatch: boolean;
  hasPrefixMatch: boolean;
  hasFuzzyMatch: boolean;
  topScore: number;
  secondScore: number;
  /** Ratio of the top score to the second score; zero when no result exists. */
  topScoreSeparation: number;
}

export interface SearchResponse {
  normalizedQuery: string;
  meaningfulTerms: string[];
  quotedPhrases: string[];
  results: SearchResult[];
  diagnostics: SearchDiagnostics;
}

export interface RetrievalOptions {
  lexicalSeedLimit?: number;
  firstHopLimit?: number;
  secondHopLimit?: number;
  maxConcepts?: number;
  maxContextCharacters?: number;
  maxGraphDepth?: number;
  includeIncoming?: boolean;
  includeOutgoing?: boolean;
}

export interface CorpusPaperOverview {
  conceptId: string;
  title: string;
  year?: string;
  venue?: string;
  tags: string[];
  linkedConceptCounts: Record<string, number>;
}

export interface CorpusOverview {
  paperCount: number;
  papers: CorpusPaperOverview[];
}

export interface StructuredConceptEvidence {
  conceptId: string;
  title: string;
  type: string;
  paperConceptId: string;
  explicitTermMatch: boolean;
}

export interface StructuredRelationshipEvidence {
  sourceId: string;
  sourceType: string;
  targetId: string;
  targetType: string;
  label: string;
}

export interface StructuredPaperEvidence {
  paperConceptId: string;
  title: string;
  representedTypeCounts: Record<string, number>;
  relevantConceptCount: number;
  relevantConcepts: StructuredConceptEvidence[];
  relevantRelationshipCount: number;
  relevantRelationships: StructuredRelationshipEvidence[];
  relationshipStatus: "mapped" | "unmapped" | "missing-layer" | "not-requested";
  explicitTermMatchCount: number;
}

export interface NativeOkfStructuredAnalysis {
  scope: "paper" | "multi-paper" | "corpus";
  checkedPaperCount: number;
  exhaustiveForScope: boolean;
  requestedKinds: string[];
  exactTerm: string | null;
  relationshipCheckComplete: boolean;
  absenceCheckComplete: boolean;
  papers: StructuredPaperEvidence[];
}

export interface ExpandedResult {
  conceptId: string;
  type: string;
  title?: string;
  description?: string;
  path: string;
  score: number;
  depth: 1 | 2;
  discoveredFrom: string;
  direction: "incoming" | "outgoing";
  relationHint?: string;
  linkLabel?: string;
  sourcePaper?: string;
  priority: number;
}

export interface FinalContextConcept {
  conceptId: string;
  type: string;
  title?: string;
  description?: string;
  path: string;
  tags: string[];
  sourcePaper?: string;
  headings: string[];
  markdownBody: string;
  selectedMetadata: Record<string, string | string[]>;
  seedRank?: number;
  score: number;
  expansionDepth: 0 | 1 | 2;
  /** Immediate graph predecessor for expanded context; absent for lexical seeds. */
  discoveredFrom?: string;
  direction?: "incoming" | "outgoing";
  /** Derived heading context, retained only as a soft retrieval signal. */
  relationHint?: string;
  linkLabel?: string;
  characterEstimate: number;
}

export type DroppedConceptReason =
  | "seed-limit"
  | "hop-limit"
  | "deduplicated"
  | "context-limit"
  | "concept-limit"
  | "weak-match"
  | "unresolved";

export interface DroppedConcept {
  conceptId: string;
  reason: DroppedConceptReason;
}

export interface RetrievalExpansionPath {
  sourceId: string;
  targetId: string;
  depth: 1 | 2;
  direction: "incoming" | "outgoing";
  relationHint?: string;
  linkLabel?: string;
}

export interface RetrievalDebug {
  limits: Required<RetrievalOptions>;
  meaningfulTokens: string[];
  searchDiagnostics: SearchDiagnostics;
  expansionPaths: RetrievalExpansionPath[];
  droppedConcepts: DroppedConcept[];
  secondHopUsed: boolean;
  secondHopReason: string;
  candidateCount: number;
}

export interface RetrievalResult {
  normalizedQuestion: string;
  seedResults: SearchResult[];
  expandedResults: ExpandedResult[];
  finalConcepts: FinalContextConcept[];
  corpusOverview: CorpusOverview;
  warnings: string[];
  confidence: number;
  noMatch: boolean;
  debug: RetrievalDebug;
  contextCharacterEstimate: number;
  structuredAnalysis?: NativeOkfStructuredAnalysis;
}
