export const OKF_TEXT_TECHNICAL_ALLOWLIST = new Set([
  "blockchain",
  "database",
  "dataset",
  "healthcare",
  "lifecycle",
  "marketplace",
  "metadata",
  "microgrid",
  "newsvendor",
  "offchain",
  "onchain",
  "smartphone",
  "stakeholder",
  "timestamp",
  "throughput",
  "workflow"
]);

const joinedWordTokens = new Set([
  "artifact",
  "contract",
  "data",
  "design",
  "evidence",
  "feature",
  "figure",
  "flow",
  "knowledge",
  "output",
  "page",
  "paper",
  "principle",
  "problem",
  "product",
  "question",
  "relation",
  "requirement",
  "research",
  "review",
  "source",
  "status",
  "system",
  "table",
  "user",
  "view"
]);

const literalPlaceholderPattern = /(?:\{\{[^{}]+\}\}|<\s*(?:todo|placeholder|replace[-_ ]?me)[^>]*>|\b(?:todo|tbd|lorem ipsum|placeholder|replace[-_ ]?me)\b)/i;
const mojibakePattern = /(?:\uFFFD|Ã.|Â(?=\s*[·•])|â(?:€|†|‡|€™|€œ|€))/u;

export type OkfTextIssueCode =
  | "NONCANONICAL_WHITESPACE"
  | "MISSING_SENTENCE_SPACE"
  | "MISSING_SEPARATOR_SPACE"
  | "PAGE_NUMBER_SPACING"
  | "CONCATENATED_CANONICAL_LABEL"
  | "PLACEHOLDER_TEXT"
  | "RAW_SNAKE_CASE"
  | "SUSPICIOUS_LOWERCASE_JOIN"
  | "MALFORMED_SOURCE_LOCATION"
  | "MOJIBAKE";

export type OkfTextInspectionOptions = {
  visible?: boolean;
  sourceLocation?: boolean;
};

export type OkfTextFinding = {
  code: OkfTextIssueCode;
  reason: string;
  suggestedText?: string;
};

/**
 * Conservative normalization for canonical, non-verbatim human text.
 * This deliberately does not perform spelling fixes or semantic rewrites.
 */
export function normalizeCanonicalText(value: string) {
  return value
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(/[\t\u00a0]+/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/[ ]*\n[ ]*/g, "\n")
    .trim();
}

/** Normalize only the syntax of a source locator; never call this for a quote. */
export function normalizeSourceLocation(value: string) {
  return normalizeCanonicalText(value)
    .replace(/\.pdf\s*#page\s*=\s*(\d+)/gi, ".pdf · page $1")
    .replace(/\.pdf\s*\?\s*page\s*(\d+)/gi, ".pdf · page $1")
    .replace(/\s*·\s*/g, " · ")
    .replace(/\b(page|pages)\s*(?=\d)/gi, "$1 ")
    .replace(/[ ]{2,}/g, " ")
    .trim();
}

/** Human-facing precedence: cleaned canonical text first, raw text last. */
export function selectOkfDisplayText(input: {
  normalizedText?: string | null;
  canonicalDescription?: string | null;
  canonicalTitle?: string | null;
  rawSourceText?: string | null;
}) {
  const candidates = [input.normalizedText, input.canonicalDescription, input.canonicalTitle, input.rawSourceText];
  for (const candidate of candidates) {
    if (typeof candidate !== "string" || !candidate.trim()) continue;
    return normalizeCanonicalText(candidate);
  }
  return "";
}

export function inspectOkfHumanText(value: string, options: OkfTextInspectionOptions = {}): OkfTextFinding[] {
  const findings: OkfTextFinding[] = [];
  const visible = options.visible !== false;
  const canonical = normalizeCanonicalText(value);

  if (canonical !== value) {
    findings.push({
      code: "NONCANONICAL_WHITESPACE",
      reason: "Canonical human text contains noncanonical whitespace.",
      suggestedText: canonical
    });
  }

  if (literalPlaceholderPattern.test(value)) {
    findings.push({ code: "PLACEHOLDER_TEXT", reason: "Canonical human text contains a placeholder marker." });
  }
  if (mojibakePattern.test(value)) {
    findings.push({ code: "MOJIBAKE", reason: "Canonical human text contains a likely character-decoding artifact." });
  }

  const masked = maskTechnicalTokens(value);
  const missingSentenceSpace = masked.match(/[!?](?=[A-Za-z])|\.(?=[A-Z][a-z])/u);
  if (missingSentenceSpace) {
    findings.push({
      code: "MISSING_SENTENCE_SPACE",
      reason: `Sentence punctuation is immediately followed by text near ${JSON.stringify(missingSentenceSpace[0])}.`,
      suggestedText: value.replace(/([!?])(?=[A-Za-z])/g, "$1 ").replace(/\.(?=[A-Z][a-z])/g, ". ")
    });
  }

  if (/(?:(?<=\S)[·|→←↔]|[·|→←↔](?=\S))/u.test(value)) {
    findings.push({
      code: "MISSING_SEPARATOR_SPACE",
      reason: "A human-readable separator is missing surrounding spacing.",
      suggestedText: value.replace(/\s*([·|→←↔])\s*/gu, " $1 ")
    });
  }

  if (/\bpages?\d+\b/i.test(value) || /\b(?:fig|figure|table|section)\.(?=\d)/i.test(value)) {
    findings.push({
      code: "PAGE_NUMBER_SPACING",
      reason: "A page, figure, table, or section label is directly followed by a number.",
      suggestedText: value
        .replace(/\b(page|pages)(?=\d)/gi, "$1 ")
        .replace(/\b(fig|figure|table|section)\.(?=\d)/gi, "$1. ")
    });
  }

  if (/\b(?:DesignRequirement|DesignPrinciple|DesignFeature|OutputKnowledge|ResearchQuestion|ResearchObjective|ResearchProblem)\b/i.test(value)) {
    findings.push({
      code: "CONCATENATED_CANONICAL_LABEL",
      reason: "A canonical DSR or research label is concatenated.",
      suggestedText: value
        .replace(/\bDesign(Requirement|Principle|Feature)\b/gi, "Design $1")
        .replace(/\bOutputKnowledge\b/gi, "Output Knowledge")
        .replace(/\bResearch(Question|Objective|Problem)\b/gi, "Research $1")
    });
  }

  if (visible && /\b[a-z][a-z0-9]*_[a-z0-9_]+\b/.test(masked)) {
    findings.push({
      code: "RAW_SNAKE_CASE",
      reason: "Presentation-visible text exposes a raw snake_case token.",
      suggestedText: value.replace(/\b([a-z][a-z0-9]*_[a-z0-9_]+)\b/g, (token) => token.replace(/_/g, " "))
    });
  }

  const joined = findSuspiciousJoinedWord(masked);
  if (joined) {
    findings.push({
      code: "SUSPICIOUS_LOWERCASE_JOIN",
      reason: `The lower-case token ${JSON.stringify(joined.word)} appears to join two display words.`,
      suggestedText: replaceWholeWord(value, joined.word, `${joined.left} ${joined.right}`)
    });
  }

  if (options.sourceLocation) {
    const normalizedLocation = normalizeSourceLocation(value);
    if (normalizedLocation !== value) {
      findings.push({
        code: "MALFORMED_SOURCE_LOCATION",
        reason: "Source-location separators or page syntax are not in canonical display form.",
        suggestedText: normalizedLocation
      });
    }
  }

  return deduplicateFindings(findings);
}

function maskTechnicalTokens(value: string) {
  return value
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/\bdoi:\s*\S+/gi, " ")
    .replace(/\b10\.\d{4,9}\/\S+/g, " ")
    .replace(/\b\S+@\S+\.\S+\b/g, " ")
    .replace(/\b\S+\.(?:pdf|json|ya?ml|md|csv)\b/gi, " ")
    .replace(/\b(?:[A-Z]\.){2,}/g, " ")
    .replace(/\b\d+\.\d+\b/g, " ");
}

function findSuspiciousJoinedWord(value: string) {
  for (const word of value.toLowerCase().match(/\b[a-z]{8,30}\b/g) ?? []) {
    if (OKF_TEXT_TECHNICAL_ALLOWLIST.has(word)) continue;
    for (let index = 4; index <= word.length - 4; index += 1) {
      const left = word.slice(0, index);
      const right = word.slice(index);
      if (joinedWordTokens.has(left) && joinedWordTokens.has(right)) return { word, left, right };
    }
  }
  return undefined;
}

function replaceWholeWord(value: string, word: string, replacement: string) {
  return value.replace(new RegExp(`\\b${escapeRegExp(word)}\\b`, "gi"), replacement);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function deduplicateFindings(findings: OkfTextFinding[]) {
  const seen = new Set<OkfTextIssueCode>();
  return findings.filter((finding) => {
    if (seen.has(finding.code)) return false;
    seen.add(finding.code);
    return true;
  });
}
