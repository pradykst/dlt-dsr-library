import "server-only";

/**
 * OKF deliberately leaves concept types and producer metadata open-ended.
 * The index signature is therefore part of the format boundary, not an escape
 * hatch for a closed application schema.
 */
export interface OkfFrontmatter {
  type: string;
  title?: string;
  description?: string;
  resource?: string;
  tags?: string[];
  timestamp?: string;
  [field: string]: unknown;
}

export interface OkfHeading {
  depth: number;
  text: string;
  line?: number;
}

export interface OkfLink {
  sourceId: string;
  targetId?: string;
  rawTarget: string;
  label: string;
  relationHint?: string;
  resolved: boolean;
  external: boolean;
  broken: boolean;
  /** Normalized, bundle-relative Markdown path for an internal target. */
  targetPath?: string;
}

export interface OkfConcept {
  id: string;
  /** Normalized POSIX path relative to the bundle root, including `.md`. */
  filePath: string;
  absolutePath: string;
  type: string;
  title?: string;
  description?: string;
  resource?: string;
  tags?: string[];
  timestamp?: string;
  frontmatter: OkfFrontmatter;
  /** Complete source text, including YAML frontmatter. */
  rawMarkdown: string;
  /** Markdown after YAML frontmatter has been removed. */
  markdownBody: string;
  headings: OkfHeading[];
  outgoingLinks: OkfLink[];
  incomingLinks: OkfLink[];
}

export interface OkfReservedDocument {
  /** Normalized POSIX path relative to the bundle root. */
  filePath: string;
  absolutePath: string;
  frontmatter: Record<string, unknown>;
  rawMarkdown: string;
  markdownBody: string;
  headings: OkfHeading[];
}

export type OkfFatalErrorCode =
  | "unreadable-file"
  | "invalid-utf8"
  | "missing-frontmatter"
  | "malformed-yaml"
  | "empty-type"
  | "duplicate-concept-id"
  | "path-escape";

export type OkfWarningCode = "broken-link";

export type OkfValidationIssueCode = OkfFatalErrorCode | OkfWarningCode;

export interface OkfValidationIssue {
  severity: "warning" | "fatal";
  code: OkfValidationIssueCode;
  message: string;
  filePath?: string;
  sourceId?: string;
  rawTarget?: string;
}

export interface OkfBundle {
  rootPath: string;
  okfVersion?: string;
  markdownFileCount: number;
  concepts: OkfConcept[];
  conceptsById: Map<string, OkfConcept>;
  conceptsByType: Map<string, OkfConcept[]>;
  outgoing: Map<string, OkfLink[]>;
  incoming: Map<string, OkfLink[]>;
  reservedDocuments: OkfReservedDocument[];
  warnings: OkfValidationIssue[];
  fatalErrors: OkfValidationIssue[];
}

export interface OkfSubgraphOptions {
  depth?: number;
  maxNodes?: number;
  includeIncoming?: boolean;
  includeOutgoing?: boolean;
}

export interface OkfSubgraph {
  concepts: OkfConcept[];
  links: OkfLink[];
  truncated: boolean;
}

export interface OkfValidationReport {
  bundleRoot: string;
  okfVersion?: string;
  markdownFileCount: number;
  reservedFileCount: number;
  conceptCount: number;
  countsByType: Record<string, number>;
  paperCount: number;
  internalLinkCount: number;
  externalLinkCount: number;
  brokenLinkWarningCount: number;
  fatalValidationErrorCount: number;
  warnings: OkfValidationIssue[];
  fatalErrors: OkfValidationIssue[];
}

export interface LoadOkfBundleOptions {
  /** Overrides OKF_BUNDLE_PATH. Relative values are resolved from `cwd`. */
  bundlePath?: string;
  /** Primarily useful for deterministic tests. Defaults to process.cwd(). */
  cwd?: string;
}
