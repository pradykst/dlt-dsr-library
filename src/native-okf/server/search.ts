import "server-only";

import MiniSearch from "minisearch";

import { getOkfBundle } from "./cache.ts";
import {
  DEFAULT_SEARCH_LIMIT,
  MAX_SEARCH_RESULTS,
  SEARCH_EMBEDDED_PATH_MULTIPLIER,
  SEARCH_EMBEDDED_TITLE_MULTIPLIER,
  SEARCH_EXACT_PATH_MULTIPLIER,
  SEARCH_EXACT_TITLE_MULTIPLIER,
  SEARCH_FIELD_BOOSTS,
  SEARCH_FUZZY_DISTANCE,
  SEARCH_FUZZY_MIN_TERM_LENGTH,
  SEARCH_MAX_FUZZY_DISTANCE,
  SEARCH_PREFIX_MIN_TERM_LENGTH,
  SEARCH_QUOTED_PHRASE_MULTIPLIER,
} from "./retrieval-config.ts";
import type {
  SearchDiagnostics,
  SearchMatchSource,
  SearchOptions,
  SearchResponse,
  SearchResult,
} from "./retrieval-types.ts";
import type { OkfBundle, OkfConcept } from "./types.ts";

const INDEX_FIELDS = [
  "conceptId",
  "path",
  "type",
  "title",
  "description",
  "tags",
  "headings",
  "body",
  "resource",
  "authors",
  "year",
  "venue",
  "methodology",
  "sourcePaper",
  "label",
] as const;

type IndexField = (typeof INDEX_FIELDS)[number];

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "been",
  "being",
  "but",
  "by",
  "can",
  "could",
  "did",
  "do",
  "does",
  "for",
  "from",
  "had",
  "has",
  "have",
  "how",
  "i",
  "in",
  "into",
  "is",
  "it",
  "its",
  "may",
  "might",
  "of",
  "on",
  "or",
  "our",
  "should",
  "that",
  "the",
  "their",
  "them",
  "there",
  "these",
  "they",
  "this",
  "those",
  "to",
  "was",
  "we",
  "were",
  "what",
  "when",
  "where",
  "which",
  "who",
  "will",
  "with",
  "would",
  "you",
  "your",
  // Corpus-navigation language carries little discriminating information.
  "about",
  "address",
  "addressed",
  "contain",
  "contains",
  "discuss",
  "design",
  "knowledge",
  "library",
  "paper",
  "papers",
  "say",
  "use",
  "using",
]);

const MATCH_SOURCE_ORDER: readonly SearchMatchSource[] = [
  "exact-path",
  "exact-title",
  "quoted-phrase",
  "title",
  "description",
  "tags",
  "type",
  "sourcePaper",
  "headings",
  "authors",
  "venue",
  "label",
  "methodology",
  "year",
  "resource",
  "conceptId",
  "path",
  "body",
];

const MATCH_SOURCE_RANK = new Map(
  MATCH_SOURCE_ORDER.map((source, index) => [source, index] as const),
);

interface SearchDocument extends Record<string, string> {
  id: string;
  conceptId: string;
  path: string;
  type: string;
  title: string;
  description: string;
  tags: string;
  headings: string;
  body: string;
  resource: string;
  authors: string;
  year: string;
  venue: string;
  methodology: string;
  sourcePaper: string;
  label: string;
}

interface IndexedDocument {
  document: SearchDocument;
  normalizedTitle: string;
  normalizedPath: string;
  normalizedFilePath: string;
  normalizedSearchableText: string;
  terms: Set<string>;
}

interface SearchSnapshot {
  bundle: OkfBundle;
  index: MiniSearch<SearchDocument>;
  documentsById: Map<string, IndexedDocument>;
}

type RawSearchResult = ReturnType<MiniSearch<SearchDocument>["search"]>[number];

interface RankedCandidate {
  raw: RawSearchResult;
  indexed: IndexedDocument;
  score: number;
  exactOverlapCount: number;
  evidence: "exact" | "prefix" | "fuzzy";
  exactTitle: boolean;
  exactPath: boolean;
  phraseMatch: boolean;
}

let cachedSnapshot: SearchSnapshot | undefined;

function compareStrings(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

/** Normalizes search text without introducing domain-specific stemming or synonyms. */
export function normalizeOkfSearchQuery(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/gu, " ");
}

function tokenize(value: string): string[] {
  return value.match(/[\p{L}\p{N}]+/gu) ?? [];
}

function canonicalizePlural(term: string): string {
  if (term.length > 5 && /[^aeiou]ies$/u.test(term)) {
    return `${term.slice(0, -3)}y`;
  }
  if (term.length > 5 && /(?:sses|xes|zes|ches|shes)$/u.test(term)) {
    return term.slice(0, -2);
  }
  if (term.length > 4 && term.endsWith("s") && !/(?:ss|us|is)$/u.test(term)) {
    return term.slice(0, -1);
  }
  return term;
}

function processTerm(term: string): string | null {
  const normalized = canonicalizePlural(normalizeOkfSearchQuery(term));
  if (normalized.length < 2 || STOP_WORDS.has(normalized)) return null;
  return normalized;
}

function meaningfulTerms(value: string): string[] {
  const seen = new Set<string>();
  const terms: string[] = [];

  for (const token of tokenize(normalizeOkfSearchQuery(value))) {
    const processed = processTerm(token);
    if (!processed || seen.has(processed)) continue;
    seen.add(processed);
    terms.push(processed);
  }

  return terms;
}

function quotedPhrases(value: string): string[] {
  const phrases: string[] = [];
  const seen = new Set<string>();
  const expression = /"([^"\r\n]+)"/gu;

  for (const match of value.matchAll(expression)) {
    const phrase = normalizeOkfSearchQuery(match[1] ?? "");
    if (phrase.length < 2 || seen.has(phrase)) continue;
    seen.add(phrase);
    phrases.push(phrase);
  }

  return phrases;
}

function boundedScalar(value: unknown, maximum = 4_000): string {
  if (typeof value === "string") return value.slice(0, maximum);
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value).slice(0, maximum);
  }
  return "";
}

function boundedScalarList(value: unknown): string {
  if (!Array.isArray(value)) return boundedScalar(value);

  return value
    .slice(0, 32)
    .map((item) => boundedScalar(item, 256))
    .filter(Boolean)
    .join(" ")
    .slice(0, 4_000);
}

function conceptToSearchDocument(concept: OkfConcept): SearchDocument {
  return {
    id: concept.id,
    conceptId: concept.id,
    path: concept.filePath,
    type: concept.type,
    title: concept.title ?? "",
    description: concept.description ?? "",
    tags: (concept.tags ?? []).slice(0, 64).join(" ").slice(0, 4_000),
    headings: concept.headings.map((heading) => heading.text).join(" \n"),
    body: concept.markdownBody,
    resource: concept.resource ?? "",
    authors: boundedScalarList(concept.frontmatter.authors),
    year: boundedScalar(concept.frontmatter.year, 64),
    venue: boundedScalar(concept.frontmatter.venue),
    methodology: boundedScalar(concept.frontmatter.methodology),
    sourcePaper: boundedScalar(concept.frontmatter.source_paper),
    label: boundedScalar(concept.frontmatter.label),
  };
}

function searchableValues(document: SearchDocument): string[] {
  return INDEX_FIELDS.map((field) => document[field]);
}

function indexDocument(document: SearchDocument): IndexedDocument {
  const allText = searchableValues(document).join(" \n");
  return {
    document,
    normalizedTitle: normalizeOkfSearchQuery(document.title),
    normalizedPath: normalizeOkfSearchQuery(document.conceptId),
    normalizedFilePath: normalizeOkfSearchQuery(document.path),
    normalizedSearchableText: normalizeOkfSearchQuery(allText),
    terms: new Set(meaningfulTerms(allText)),
  };
}

function buildSearchSnapshot(bundle: OkfBundle): SearchSnapshot {
  const documents = bundle.concepts.map(conceptToSearchDocument);
  const index = new MiniSearch<SearchDocument>({
    idField: "id",
    fields: [...INDEX_FIELDS],
    storeFields: ["conceptId", "path", "type", "title", "description", "sourcePaper"],
    tokenize,
    processTerm,
  });
  index.addAll(documents);

  return {
    bundle,
    index,
    documentsById: new Map(
      documents.map((document) => [document.id, indexDocument(document)] as const),
    ),
  };
}

async function getSearchSnapshot(): Promise<SearchSnapshot> {
  const bundle = await getOkfBundle();
  if (cachedSnapshot?.bundle === bundle) return cachedSnapshot;

  cachedSnapshot = buildSearchSnapshot(bundle);
  return cachedSnapshot;
}

/** Explicit invalidation for deterministic tests; bundle identity also invalidates naturally. */
export function clearOkfSearchCacheForTests(): void {
  cachedSnapshot = undefined;
}

function boundedLimit(limit: number | undefined): number {
  if (limit === undefined) return DEFAULT_SEARCH_LIMIT;
  if (!Number.isFinite(limit) || limit < 0) {
    throw new RangeError("Search limit must be a finite, non-negative number.");
  }
  return Math.min(Math.floor(limit), MAX_SEARCH_RESULTS);
}

function containsWholeNormalizedValue(haystack: string, needle: string): boolean {
  if (needle === "") return false;
  return ` ${haystack} `.includes(` ${needle} `);
}

function exactValueEvidence(
  query: string,
  value: string,
  minimumEmbeddedLength: number,
): "equal" | "embedded" | undefined {
  if (!value) return undefined;
  if (query === value) return "equal";
  if (
    value.length >= minimumEmbeddedLength &&
    containsWholeNormalizedValue(query, value)
  ) {
    return "embedded";
  }
  return undefined;
}

function filterByTypes(
  results: RawSearchResult[],
  allowedTypes: Set<string> | undefined,
): RawSearchResult[] {
  if (!allowedTypes) return results;
  return results.filter((result) => allowedTypes.has(String(result.type)));
}

function searchOptions(prefix: boolean, fuzzy: boolean) {
  return {
    boost: { ...SEARCH_FIELD_BOOSTS },
    combineWith: "OR" as const,
    prefix: prefix
      ? (term: string) => term.length >= SEARCH_PREFIX_MIN_TERM_LENGTH
      : false,
    fuzzy: fuzzy
      ? (term: string) =>
          term.length >= SEARCH_FUZZY_MIN_TERM_LENGTH
            ? SEARCH_FUZZY_DISTANCE
            : false
      : false,
    maxFuzzy: SEARCH_MAX_FUZZY_DISTANCE,
    weights: { prefix: 0.8, fuzzy: 0.35 },
  };
}

function matchSources(candidate: RankedCandidate): SearchMatchSource[] {
  const sources = new Set<SearchMatchSource>();
  if (candidate.exactPath) sources.add("exact-path");
  if (candidate.exactTitle) sources.add("exact-title");
  if (candidate.phraseMatch) sources.add("quoted-phrase");

  for (const fields of Object.values(candidate.raw.match)) {
    for (const field of fields) {
      if ((INDEX_FIELDS as readonly string[]).includes(field)) {
        sources.add(field as IndexField);
      }
    }
  }

  return [...sources].sort(
    (left, right) =>
      (MATCH_SOURCE_RANK.get(left) ?? Number.MAX_SAFE_INTEGER) -
        (MATCH_SOURCE_RANK.get(right) ?? Number.MAX_SAFE_INTEGER) ||
      compareStrings(left, right),
  );
}

function roundScore(value: number): number {
  return Number(value.toFixed(6));
}

function emptyDiagnostics(indexedConceptCount: number): SearchDiagnostics {
  return {
    indexedConceptCount,
    candidateCount: 0,
    meaningfulTermCount: 0,
    meaningfulOverlapCount: 0,
    meaningfulOverlapRatio: 0,
    exactResultCount: 0,
    prefixOnlyResultCount: 0,
    fuzzyOnlyResultCount: 0,
    hasExactMatch: false,
    hasExactTitleMatch: false,
    hasExactPathMatch: false,
    hasPrefixMatch: false,
    hasFuzzyMatch: false,
    topScore: 0,
    secondScore: 0,
    topScoreSeparation: 0,
  };
}

/**
 * Searches every native concept with field-aware BM25 ranking.
 *
 * No-match policy is intentionally not collapsed to a score threshold here:
 * diagnostics separately expose meaningful exact overlap, prefix evidence,
 * fuzzy-only candidates, title/path evidence, and score separation so the
 * retrieval layer can calculate an explainable conservative confidence.
 */
export async function searchOkf(
  query: string,
  options: SearchOptions = {},
): Promise<SearchResponse> {
  if (typeof query !== "string") {
    throw new TypeError("Search query must be a string.");
  }

  const snapshot = await getSearchSnapshot();
  const normalizedQuery = normalizeOkfSearchQuery(query);
  const terms = meaningfulTerms(query);
  const phrases = quotedPhrases(query);
  const limit = boundedLimit(options.limit);

  if (normalizedQuery === "" || terms.length === 0 || limit === 0) {
    const diagnostics = emptyDiagnostics(snapshot.bundle.concepts.length);
    diagnostics.meaningfulTermCount = terms.length;
    return {
      normalizedQuery,
      meaningfulTerms: terms,
      quotedPhrases: phrases,
      results: [],
      diagnostics,
    };
  }

  const allowedTypes = options.types
    ? new Set(options.types.map((type) => type.trim()).filter(Boolean))
    : undefined;
  const usePrefix = options.prefix ?? true;
  const useFuzzy = options.fuzzy ?? true;

  const exactRaw = filterByTypes(
    snapshot.index.search(normalizedQuery, searchOptions(false, false)),
    allowedTypes,
  );
  const prefixRaw = usePrefix
    ? filterByTypes(
        snapshot.index.search(normalizedQuery, searchOptions(true, false)),
        allowedTypes,
      )
    : exactRaw;
  const combinedRaw = filterByTypes(
    snapshot.index.search(normalizedQuery, searchOptions(usePrefix, useFuzzy)),
    allowedTypes,
  );

  const exactIds = new Set(exactRaw.map((result) => String(result.id)));
  const prefixIds = new Set(prefixRaw.map((result) => String(result.id)));
  const candidates: RankedCandidate[] = [];

  for (const raw of combinedRaw) {
    const id = String(raw.id);
    const indexed = snapshot.documentsById.get(id);
    if (!indexed) continue;

    const titleEvidence = exactValueEvidence(normalizedQuery, indexed.normalizedTitle, 18);
    const idEvidence = exactValueEvidence(normalizedQuery, indexed.normalizedPath, 8);
    const filePathEvidence = exactValueEvidence(
      normalizedQuery,
      indexed.normalizedFilePath,
      8,
    );
    const pathEvidence = idEvidence === "equal" || filePathEvidence === "equal"
      ? "equal"
      : idEvidence ?? filePathEvidence;
    const matchingPhraseCount = phrases.filter((phrase) =>
      containsWholeNormalizedValue(indexed.normalizedSearchableText, phrase),
    ).length;
    const exactOverlapCount = terms.filter((term) => indexed.terms.has(term)).length;
    let score = raw.score;

    if (titleEvidence === "equal") score *= SEARCH_EXACT_TITLE_MULTIPLIER;
    else if (titleEvidence === "embedded") score *= SEARCH_EMBEDDED_TITLE_MULTIPLIER;

    if (pathEvidence === "equal") score *= SEARCH_EXACT_PATH_MULTIPLIER;
    else if (pathEvidence === "embedded") score *= SEARCH_EMBEDDED_PATH_MULTIPLIER;

    if (matchingPhraseCount > 0) {
      score *= Math.min(
        2.8,
        SEARCH_QUOTED_PHRASE_MULTIPLIER + (matchingPhraseCount - 1) * 0.2,
      );
    }

    candidates.push({
      raw,
      indexed,
      score,
      exactOverlapCount,
      evidence: exactIds.has(id) ? "exact" : prefixIds.has(id) ? "prefix" : "fuzzy",
      exactTitle: titleEvidence !== undefined,
      exactPath: pathEvidence !== undefined,
      phraseMatch: matchingPhraseCount > 0,
    });
  }

  candidates.sort(
    (left, right) =>
      right.score - left.score ||
      right.exactOverlapCount - left.exactOverlapCount ||
      compareStrings(left.indexed.document.conceptId, right.indexed.document.conceptId),
  );

  const selected = candidates.slice(0, limit);
  const results: SearchResult[] = selected.map((candidate, index) => {
    const document = candidate.indexed.document;
    const matchedTerms = [...new Set(candidate.raw.queryTerms)]
      .map(String)
      .sort(compareStrings);

    return {
      conceptId: document.conceptId,
      type: document.type,
      ...(document.title ? { title: document.title } : {}),
      ...(document.description ? { description: document.description } : {}),
      path: document.path,
      score: roundScore(candidate.score),
      matchedTerms,
      matchSource: matchSources(candidate),
      ...(document.sourcePaper ? { sourcePaper: document.sourcePaper } : {}),
      seedRank: index + 1,
    };
  });

  const exactResultCount = candidates.filter((candidate) => candidate.evidence === "exact").length;
  const prefixOnlyResultCount = candidates.filter(
    (candidate) => candidate.evidence === "prefix",
  ).length;
  const fuzzyOnlyResultCount = candidates.filter(
    (candidate) => candidate.evidence === "fuzzy",
  ).length;
  const meaningfulOverlapCount = candidates.reduce(
    (maximum, candidate) => Math.max(maximum, candidate.exactOverlapCount),
    0,
  );
  const topScore = results[0]?.score ?? 0;
  const secondScore = results[1]?.score ?? 0;
  const diagnostics: SearchDiagnostics = {
    indexedConceptCount: snapshot.bundle.concepts.length,
    candidateCount: candidates.length,
    meaningfulTermCount: terms.length,
    meaningfulOverlapCount,
    meaningfulOverlapRatio: terms.length === 0 ? 0 : meaningfulOverlapCount / terms.length,
    exactResultCount,
    prefixOnlyResultCount,
    fuzzyOnlyResultCount,
    hasExactMatch: exactResultCount > 0,
    hasExactTitleMatch: candidates.some((candidate) => candidate.exactTitle),
    hasExactPathMatch: candidates.some((candidate) => candidate.exactPath),
    hasPrefixMatch: prefixOnlyResultCount > 0,
    hasFuzzyMatch: fuzzyOnlyResultCount > 0,
    topScore,
    secondScore,
    topScoreSeparation:
      topScore === 0 ? 0 : secondScore === 0 ? 1 : roundScore(topScore / secondScore),
  };

  return {
    normalizedQuery,
    meaningfulTerms: terms,
    quotedPhrases: phrases,
    results,
    diagnostics,
  };
}
