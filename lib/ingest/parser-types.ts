export interface PdfPageText {
  pageNumber: number;
  text: string;
}

export interface PdfExtractionResult {
  pages: PdfPageText[];
  fullText: string;
  pageCount: number;
  extractionWarnings: string[];
}

export interface ExtractedMetadata {
  title?: string;
  authors: string[];
  year?: number;
  doi?: string;
  abstract?: string;
  keywords: string[];
}

export interface CrossrefMetadata {
  doi: string;
  title?: string;
  authors: string[];
  year?: number;
  venue?: string;
  publisher?: string;
  url?: string;
}

export interface VerificationResult {
  status: "verified" | "likely-match" | "partial-match" | "not-found" | "not-checked" | "mismatch";
  doi?: string;
  titleScore?: number;
  authorScore?: number;
  yearMatch?: boolean;
  message: string;
  crossref?: CrossrefMetadata;
}

export interface DsrField {
  id: string;
  label: string;
  synthesizedText: string;
  sourceQuote: string;
  pageNumber?: number;
  section?: string;
  confidence: number;
  extractionRule: string;
}

export interface DsrGridExtraction {
  problem: DsrField[];
  inputKnowledge: DsrField[];
  researchProcess: DsrField[];
  concepts: DsrField[];
  solution: DsrField[];
  outputKnowledge: DsrField[];
}

export interface ExtractedFlowEdge {
  sourceId: string;
  targetId: string;
  label: "motivates" | "satisfies" | "implements" | "instantiates" | "evaluated by" | "generalizes to";
  confidence: number;
}

export interface DesignFlowExtraction {
  problems: DsrField[];
  requirements: DsrField[];
  principles: DsrField[];
  features: DsrField[];
  artifacts: DsrField[];
  evaluations: DsrField[];
  patterns: DsrField[];
  edges: ExtractedFlowEdge[];
}

export interface ParserDiagnostic {
  level: "info" | "warning" | "error";
  message: string;
}

export interface DsrParseResult {
  metadata: ExtractedMetadata;
  dsrGrid: DsrGridExtraction;
  designFlow: DesignFlowExtraction;
  diagnostics: ParserDiagnostic[];
  overallConfidence: number;
}

export interface PaperSection {
  title: string;
  normalizedTitle: string;
  text: string;
  startPage?: number;
  endPage?: number;
}

export interface GeneratedIngestJson {
  metadata: ExtractedMetadata;
  verification: VerificationResult;
  dsrGrid: DsrGridExtraction;
  designFlow: DesignFlowExtraction;
  diagnostics: ParserDiagnostic[];
  generatedAt: string;
}
