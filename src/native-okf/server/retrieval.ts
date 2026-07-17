import "server-only";

import { buildCorpusOverview } from "./corpus-overview.ts";
import { getOkfBundle } from "./cache.ts";
import {
  DEFAULT_RETRIEVAL_LIMITS,
  MAX_SEARCH_RESULTS,
  MAX_RETRIEVAL_LIMITS,
} from "./retrieval-config.ts";
import { searchOkf } from "./search.ts";
import type {
  DroppedConcept,
  ExpandedResult,
  FinalContextConcept,
  RetrievalDebug,
  RetrievalExpansionPath,
  RetrievalOptions,
  RetrievalResult,
  SearchResult,
} from "./retrieval-types.ts";
import type { OkfBundle, OkfConcept, OkfLink } from "./types.ts";

const SPARSE_FIRST_HOP_THRESHOLD = 6;
const LEXICAL_CANDIDATE_MULTIPLIER = 5;
const MAX_CONTEXT_MARKDOWN_CHARACTERS = 2_400;
const SCORE_SATURATION_PIVOT = 10;
const MAX_HEADING_COUNT = 24;
const MAX_HEADING_CHARACTERS = 300;
const MAX_METADATA_SCALARS = 16;
const MAX_METADATA_SCALAR_CHARACTERS = 1_000;
const MAX_METADATA_ARRAY_ITEMS = 20;
const MAX_METADATA_ARRAY_ITEM_CHARACTERS = 300;

const CONTEXT_METADATA_FIELDS = [
  "authors",
  "year",
  "venue",
  "methodology",
  "source_paper",
  "label",
  "resource",
  "timestamp",
] as const;

type Direction = "incoming" | "outgoing";

interface Neighbor {
  concept: OkfConcept;
  direction: Direction;
  link: OkfLink;
}

interface ExpansionCandidate {
  concept: OkfConcept;
  result: ExpandedResult;
  path: RetrievalExpansionPath;
}

interface ContextCandidate {
  concept: OkfConcept;
  score: number;
  depth: 0 | 1 | 2;
  seedRank?: number;
  expansion?: ExpandedResult;
}

interface FittedContext {
  concept: FinalContextConcept;
  truncated: boolean;
}

function compareStrings(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function rounded(value: number, digits = 6): number {
  const scale = 10 ** digits;
  return Math.round(value * scale) / scale;
}

function boundedInteger(
  value: number | undefined,
  fallback: number,
  maximum: number,
  name: string,
): number {
  if (value === undefined) return fallback;
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`${name} must be a finite, non-negative number.`);
  }
  return Math.min(Math.floor(value), maximum);
}

function resolveLimits(options: RetrievalOptions): Required<RetrievalOptions> {
  return {
    lexicalSeedLimit: boundedInteger(
      options.lexicalSeedLimit,
      DEFAULT_RETRIEVAL_LIMITS.lexicalSeedLimit,
      MAX_RETRIEVAL_LIMITS.lexicalSeedLimit,
      "lexicalSeedLimit",
    ),
    firstHopLimit: boundedInteger(
      options.firstHopLimit,
      DEFAULT_RETRIEVAL_LIMITS.firstHopLimit,
      MAX_RETRIEVAL_LIMITS.firstHopLimit,
      "firstHopLimit",
    ),
    secondHopLimit: boundedInteger(
      options.secondHopLimit,
      DEFAULT_RETRIEVAL_LIMITS.secondHopLimit,
      MAX_RETRIEVAL_LIMITS.secondHopLimit,
      "secondHopLimit",
    ),
    maxConcepts: boundedInteger(
      options.maxConcepts,
      DEFAULT_RETRIEVAL_LIMITS.maxConcepts,
      MAX_RETRIEVAL_LIMITS.maxConcepts,
      "maxConcepts",
    ),
    maxContextCharacters: boundedInteger(
      options.maxContextCharacters,
      DEFAULT_RETRIEVAL_LIMITS.maxContextCharacters,
      MAX_RETRIEVAL_LIMITS.maxContextCharacters,
      "maxContextCharacters",
    ),
    maxGraphDepth: boundedInteger(
      options.maxGraphDepth,
      DEFAULT_RETRIEVAL_LIMITS.maxGraphDepth,
      MAX_RETRIEVAL_LIMITS.maxGraphDepth,
      "maxGraphDepth",
    ),
    includeIncoming: options.includeIncoming ?? DEFAULT_RETRIEVAL_LIMITS.includeIncoming,
    includeOutgoing: options.includeOutgoing ?? DEFAULT_RETRIEVAL_LIMITS.includeOutgoing,
  };
}

function scalarString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

function sourcePaper(concept: OkfConcept): string | undefined {
  return scalarString(concept.frontmatter.source_paper);
}

function typeHasRole(type: string, role: string): boolean {
  return type
    .toLocaleLowerCase("en")
    .split(/[^a-z\d]+/u)
    .some((part) => part === role || part.startsWith(role));
}

function metadataRefersTo(concept: OkfConcept, other: OkfConcept): boolean {
  const value = sourcePaper(concept)?.toLocaleLowerCase("en");
  if (!value) return false;

  const candidates = [
    other.id,
    other.filePath,
    other.title,
    other.id.split("/").at(-1),
  ]
    .filter((item): item is string => Boolean(item))
    .map((item) => item.toLocaleLowerCase("en"));
  return candidates.some((candidate) => value.includes(candidate));
}

function normalizedTokens(value: string): string[] {
  return value
    .toLocaleLowerCase("en")
    .split(/[^a-z\d]+/u)
    .filter((token) => token.length >= 3);
}

function tokensLooselyMatch(left: string, right: string): boolean {
  return left === right ||
    (left.length >= 4 && right.length >= 4 &&
      (left.startsWith(right) || right.startsWith(left)));
}

function conceptFamilyId(bundle: OkfBundle, result: SearchResult): string {
  const concept = bundle.conceptsById.get(result.conceptId);
  if (!concept) return result.conceptId;
  if (typeHasRole(concept.type, "paper")) return concept.id;

  const linkedPapers = new Set<string>();
  for (const link of bundle.outgoing.get(concept.id) ?? []) {
    if (!link.targetId) continue;
    const target = bundle.conceptsById.get(link.targetId);
    if (target && typeHasRole(target.type, "paper")) linkedPapers.add(target.id);
  }
  for (const link of bundle.incoming.get(concept.id) ?? []) {
    const source = bundle.conceptsById.get(link.sourceId);
    if (source && typeHasRole(source.type, "paper")) linkedPapers.add(source.id);
  }

  const linkedPaper = [...linkedPapers].sort(compareStrings)[0];
  if (linkedPaper) return linkedPaper;
  const producerSource = result.sourcePaper
    ? result.sourcePaper.toLocaleLowerCase("en")
    : undefined;
  return producerSource ? `source-paper:${producerSource}` : result.conceptId;
}


function selectLexicalSeeds(
  bundle: OkfBundle,
  candidates: readonly SearchResult[],
  limit: number,
): SearchResult[] {
  if (limit === 0 || candidates.length === 0) return [];

  const diversitySlots = limit >= 4 ? Math.min(2, Math.floor(limit / 4)) : 0;
  const coreLimit = Math.max(0, limit - diversitySlots);
  const selected = candidates.slice(0, coreLimit);
  const selectedIds = new Set(selected.map((candidate) => candidate.conceptId));
  const selectedFamilies = new Set(
    selected.map((candidate) => conceptFamilyId(bundle, candidate)),
  );

  const candidatesByFamily = new Map<string, SearchResult[]>();
  for (const candidate of candidates) {
    const familyId = conceptFamilyId(bundle, candidate);
    const family = candidatesByFamily.get(familyId) ?? [];
    family.push(candidate);
    candidatesByFamily.set(familyId, family);
  }

  const familyLeaders = [...candidatesByFamily.entries()]
    .filter(([familyId]) => !selectedFamilies.has(familyId))
    .map(([familyId, family]) => ({
      familyId,
      leader: family[0]!,
      // Two bounded diversity slots reward corroborated graph families without
      // displacing the strongest lexical anchors or favoring large families.
      supportScore:
        (family[0]?.score ?? 0) +
        family
          .slice(1, 5)
          .reduce((sum, candidate) => sum + candidate.score * 0.25, 0),
    }))
    .sort(
      (left, right) =>
        right.supportScore - left.supportScore ||
        right.leader.score - left.leader.score ||
        compareStrings(left.familyId, right.familyId),
    );

  for (const family of familyLeaders) {
    if (selected.length >= limit) break;
    if (selectedIds.has(family.leader.conceptId)) continue;
    selected.push(family.leader);
    selectedIds.add(family.leader.conceptId);
  }

  // A narrow query can have fewer graph families than seed slots. Fill any
  // remaining slots in unmodified lexical rank order.
  for (const candidate of candidates) {
    if (selected.length >= limit) break;
    if (selectedIds.has(candidate.conceptId)) continue;
    selected.push(candidate);
    selectedIds.add(candidate.conceptId);
  }

  return selected.map((candidate, index) => ({ ...candidate, seedRank: index + 1 }));
}

function queryAffinity(
  concept: OkfConcept,
  link: OkfLink,
  meaningfulTerms: readonly string[],
): number {
  const typeTerms = normalizedTokens(concept.type);
  const linkTerms = normalizedTokens(`${link.relationHint ?? ""} ${link.label}`);
  const contentTerms = new Set(normalizedTokens(
    `${concept.title ?? ""} ${concept.description ?? ""} ${(concept.tags ?? []).join(" ")}`,
  ));
  const typeMatches = typeTerms.filter((term) =>
    meaningfulTerms.some((queryTerm) => tokensLooselyMatch(term, queryTerm))
  ).length;
  const linkMatches = linkTerms.filter((term) =>
    meaningfulTerms.some((queryTerm) => tokensLooselyMatch(term, queryTerm))
  ).length;
  const contentMatches = meaningfulTerms.filter((queryTerm) =>
    [...contentTerms].some((term) => tokensLooselyMatch(term, queryTerm))
  ).length;
  return Math.min(
    6,
    typeMatches * 1.25 + linkMatches + contentMatches * 0.75,
  );
}

/**
 * Soft graph ranking only. Type families and heading language improve useful
 * paths, but never classify or reject a concept, and relationHint remains
 * derived consumer metadata rather than an OKF predicate.
 */
function relationshipPriority(
  from: OkfConcept,
  to: OkfConcept,
  link: OkfLink,
): number {
  let priority = 1;
  const fromPaper = typeHasRole(from.type, "paper");
  const toPaper = typeHasRole(to.type, "paper");
  const fromRequirement = typeHasRole(from.type, "requirement");
  const toRequirement = typeHasRole(to.type, "requirement");
  const fromPrinciple = typeHasRole(from.type, "principle");
  const toPrinciple = typeHasRole(to.type, "principle");
  const fromFeature = typeHasRole(from.type, "feature");
  const toFeature = typeHasRole(to.type, "feature");

  if (fromPaper !== toPaper) priority += 2.5;
  if (metadataRefersTo(from, to) || metadataRefersTo(to, from)) priority += 1.5;
  if ((fromRequirement && toPrinciple) || (fromPrinciple && toRequirement)) priority += 3;
  if ((fromFeature && toPrinciple) || (fromPrinciple && toFeature)) priority += 3;

  const context = `${link.relationHint ?? ""} ${link.label}`.toLocaleLowerCase("en");
  if (/\bsource[\s-]*paper\b/u.test(context)) priority += 1;
  if (/\bimplement(?:s|ed|ing|ation)?\b/u.test(context)) priority += 1;
  if (/\baddress(?:es|ed|ing)?\b/u.test(context)) priority += 0.75;

  return priority;
}

function compareLinks(left: OkfLink, right: OkfLink): number {
  return compareStrings(left.sourceId, right.sourceId) ||
    compareStrings(left.targetId ?? "", right.targetId ?? "") ||
    compareStrings(left.rawTarget, right.rawTarget) ||
    compareStrings(left.label, right.label) ||
    compareStrings(left.relationHint ?? "", right.relationHint ?? "");
}

function neighbors(
  bundle: OkfBundle,
  conceptId: string,
  limits: Required<RetrievalOptions>,
): Neighbor[] {
  const result: Neighbor[] = [];

  if (limits.includeOutgoing) {
    for (const link of [...(bundle.outgoing.get(conceptId) ?? [])].sort(compareLinks)) {
      if (!link.targetId) continue;
      const concept = bundle.conceptsById.get(link.targetId);
      if (concept) result.push({ concept, direction: "outgoing", link });
    }
  }

  if (limits.includeIncoming) {
    for (const link of [...(bundle.incoming.get(conceptId) ?? [])].sort(compareLinks)) {
      const concept = bundle.conceptsById.get(link.sourceId);
      if (concept) result.push({ concept, direction: "incoming", link });
    }
  }

  return result.sort(
    (left, right) =>
      compareStrings(left.concept.id, right.concept.id) ||
      compareStrings(left.direction, right.direction) ||
      compareLinks(left.link, right.link),
  );
}

function expansionCandidate(
  from: OkfConcept,
  neighbor: Neighbor,
  parentScore: number,
  depth: 1 | 2,
  rankInfluence: number,
  meaningfulTerms: readonly string[],
): ExpansionCandidate {
  const relationPriority = relationshipPriority(from, neighbor.concept, neighbor.link);
  const affinity = queryAffinity(neighbor.concept, neighbor.link, meaningfulTerms);
  const priority = rounded(relationPriority + affinity + rankInfluence + (depth === 1 ? 0.5 : 0));
  const score = rounded(parentScore * (depth === 1 ? 0.55 : 0.35) + priority);
  const source = sourcePaper(neighbor.concept);

  return {
    concept: neighbor.concept,
    result: {
      conceptId: neighbor.concept.id,
      type: neighbor.concept.type,
      ...(neighbor.concept.title === undefined ? {} : { title: neighbor.concept.title }),
      ...(neighbor.concept.description === undefined
        ? {}
        : { description: neighbor.concept.description }),
      path: neighbor.concept.filePath,
      score,
      depth,
      discoveredFrom: from.id,
      direction: neighbor.direction,
      ...(neighbor.link.relationHint === undefined
        ? {}
        : { relationHint: neighbor.link.relationHint }),
      ...(neighbor.link.label === "" ? {} : { linkLabel: neighbor.link.label }),
      ...(source === undefined ? {} : { sourcePaper: source }),
      priority,
    },
    path: {
      sourceId: from.id,
      targetId: neighbor.concept.id,
      depth,
      direction: neighbor.direction,
      ...(neighbor.link.relationHint === undefined
        ? {}
        : { relationHint: neighbor.link.relationHint }),
      ...(neighbor.link.label === "" ? {} : { linkLabel: neighbor.link.label }),
    },
  };
}

function compareExpansionCandidates(
  left: ExpansionCandidate,
  right: ExpansionCandidate,
): number {
  return right.result.priority - left.result.priority ||
    right.result.score - left.result.score ||
    compareStrings(left.result.conceptId, right.result.conceptId) ||
    compareStrings(left.result.discoveredFrom, right.result.discoveredFrom) ||
    compareStrings(left.result.direction, right.result.direction) ||
    compareStrings(left.result.linkLabel ?? "", right.result.linkLabel ?? "");
}

function addDropped(
  dropped: DroppedConcept[],
  seen: Set<string>,
  conceptId: string,
  reason: DroppedConcept["reason"],
): void {
  const key = `${conceptId}\0${reason}`;
  if (seen.has(key)) return;
  seen.add(key);
  dropped.push({ conceptId, reason });
}

function selectExpansionCandidates(
  candidates: ExpansionCandidate[],
  excludedIds: Set<string>,
  limit: number,
  dropped: DroppedConcept[],
  droppedKeys: Set<string>,
): ExpansionCandidate[] {
  const bestById = new Map<string, ExpansionCandidate>();

  for (const candidate of candidates.sort(compareExpansionCandidates)) {
    const id = candidate.result.conceptId;
    if (excludedIds.has(id)) {
      addDropped(dropped, droppedKeys, id, "deduplicated");
      continue;
    }
    if (bestById.has(id)) {
      addDropped(dropped, droppedKeys, id, "deduplicated");
      continue;
    }
    bestById.set(id, candidate);
  }

  const ranked = [...bestById.values()].sort(compareExpansionCandidates);
  const selected = ranked.slice(0, limit);
  for (const candidate of ranked.slice(limit)) {
    addDropped(dropped, droppedKeys, candidate.result.conceptId, "hop-limit");
  }
  return selected;
}

function hasExplicitGraphLanguage(question: string): boolean {
  return /\b(?:graphs?|relationships?|links?|linked|connections?|connected|neighbou?rs?)\b/iu
    .test(question);
}

function safeMetadataValue(value: unknown): string | string[] | undefined {
  const scalar = scalarString(value);
  if (scalar !== undefined) return scalar.slice(0, MAX_METADATA_SCALAR_CHARACTERS);
  if (!Array.isArray(value)) return undefined;

  const items = value
    .flatMap((item) => {
      const text = scalarString(item);
      return text === undefined
        ? []
        : [text.slice(0, MAX_METADATA_ARRAY_ITEM_CHARACTERS)];
    })
    .slice(0, MAX_METADATA_ARRAY_ITEMS);
  return items.length === 0 ? undefined : items;
}

function selectedMetadata(concept: OkfConcept): Record<string, string | string[]> {
  const metadata: Record<string, string | string[]> = {};
  for (const field of CONTEXT_METADATA_FIELDS.slice(0, MAX_METADATA_SCALARS)) {
    const value = safeMetadataValue(concept.frontmatter[field]);
    if (value !== undefined) metadata[field] = value;
  }
  return metadata;
}

function contextBase(candidate: ContextCandidate, markdownBody: string): FinalContextConcept {
  const expansion = candidate.expansion;
  const paper = sourcePaper(candidate.concept);
  return {
    conceptId: candidate.concept.id,
    type: candidate.concept.type,
    ...(candidate.concept.title === undefined ? {} : { title: candidate.concept.title }),
    ...(candidate.concept.description === undefined
      ? {}
      : { description: candidate.concept.description }),
    path: candidate.concept.filePath,
    tags: [...new Set(candidate.concept.tags ?? [])].sort(compareStrings),
    ...(paper === undefined ? {} : { sourcePaper: paper }),
    headings: candidate.concept.headings
      .slice(0, MAX_HEADING_COUNT)
      .map((heading) => heading.text.slice(0, MAX_HEADING_CHARACTERS)),
    markdownBody,
    selectedMetadata: selectedMetadata(candidate.concept),
    ...(candidate.seedRank === undefined ? {} : { seedRank: candidate.seedRank }),
    score: rounded(candidate.score),
    expansionDepth: candidate.depth,
    ...(expansion === undefined ? {} : { discoveredFrom: expansion.discoveredFrom }),
    ...(expansion === undefined ? {} : { direction: expansion.direction }),
    ...(expansion?.relationHint === undefined ? {} : { relationHint: expansion.relationHint }),
    ...(expansion?.linkLabel === undefined ? {} : { linkLabel: expansion.linkLabel }),
    characterEstimate: 0,
  };
}

function stabilizeEstimate(concept: FinalContextConcept): FinalContextConcept {
  let estimate = JSON.stringify(concept).length;
  let current = concept;
  for (let index = 0; index < 3; index += 1) {
    current = { ...current, characterEstimate: estimate };
    const next = JSON.stringify(current).length;
    if (next === estimate) break;
    estimate = next;
  }
  return { ...current, characterEstimate: JSON.stringify(current).length };
}

function truncatedBody(body: string, maximum: number): string {
  if (body.length <= maximum) return body;
  if (maximum <= 1) return "";
  return `${body.slice(0, maximum - 1).trimEnd()}\u2026`;
}

function fitContextConcept(
  candidate: ContextCandidate,
  remainingCharacters: number,
): FittedContext | undefined {
  const empty = stabilizeEstimate(contextBase(candidate, ""));
  if (empty.characterEstimate > remainingCharacters) return undefined;

  const boundedMarkdown = truncatedBody(
    candidate.concept.markdownBody,
    MAX_CONTEXT_MARKDOWN_CHARACTERS,
  );
  const full = stabilizeEstimate(contextBase(candidate, boundedMarkdown));
  if (full.characterEstimate <= remainingCharacters) {
    return {
      concept: full,
      truncated: boundedMarkdown.length < candidate.concept.markdownBody.length,
    };
  }

  let low = 0;
  let high = boundedMarkdown.length;
  let best = empty;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const fitted = stabilizeEstimate(
      contextBase(candidate, truncatedBody(boundedMarkdown, middle)),
    );
    if (fitted.characterEstimate <= remainingCharacters) {
      best = fitted;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return { concept: best, truncated: true };
}

function confidenceSignals(
  meaningfulTermCount: number,
  overlapRatio: number,
  topScore: number,
  hasTitleOrPathAnchor: boolean,
  expandedCount: number,
): { confidence: number; scoreSignal: number; graphSignal: number } {
  const scoreSignal = topScore <= 0
    ? 0
    : topScore / (topScore + SCORE_SATURATION_PIVOT);
  const graphSignal = meaningfulTermCount === 0 ? 0 : Math.min(1, expandedCount / 4);
  const confidence =
    Math.min(1, Math.max(0, overlapRatio)) * 0.5 +
    (hasTitleOrPathAnchor ? 1 : 0) * 0.2 +
    scoreSignal * 0.2 +
    graphSignal * 0.1;
  return { confidence: rounded(confidence, 4), scoreSignal, graphSignal };
}

function compareDropped(left: DroppedConcept, right: DroppedConcept): number {
  return compareStrings(left.conceptId, right.conceptId) ||
    compareStrings(left.reason, right.reason);
}

/**
 * Retrieves inspectable, bounded native OKF context without embeddings or
 * answer-generation behavior.
 *
 * Confidence combines four documented signals: meaningful-token coverage
 * (50%), exact title/path anchoring (20%), a saturating lexical score (20%),
 * and resolved graph support (10%). No-match uses conjunctions of those
 * signals. In particular, a long query matching only one common corpus token
 * cannot be rescued merely because that weak seed has graph neighbors.
 */
export async function retrieveOkfContext(
  question: string,
  options: RetrievalOptions = {},
): Promise<RetrievalResult> {
  if (typeof question !== "string") throw new TypeError("A retrieval question is required.");

  const limits = resolveLimits(options);
  const lexicalCandidateLimit = Math.min(
    MAX_SEARCH_RESULTS,
    limits.lexicalSeedLimit * LEXICAL_CANDIDATE_MULTIPLIER,
  );
  const [bundle, searchResponse, corpusOverview] = await Promise.all([
    getOkfBundle(),
    searchOkf(question, { limit: lexicalCandidateLimit }),
    buildCorpusOverview(),
  ]);
  const droppedConcepts: DroppedConcept[] = [];
  const droppedKeys = new Set<string>();
  const warnings: string[] = [];

  const seedResults = selectLexicalSeeds(
    bundle,
    searchResponse.results,
    limits.lexicalSeedLimit,
  );
  const seedIds = new Set(seedResults.map((seed) => seed.conceptId));
  for (const candidate of searchResponse.results) {
    if (seedIds.has(candidate.conceptId)) continue;
    addDropped(droppedConcepts, droppedKeys, candidate.conceptId, "seed-limit");
  }
  const diagnostics = searchResponse.diagnostics;
  const hasTitleOrPathAnchor = diagnostics.hasExactTitleMatch || diagnostics.hasExactPathMatch;
  const broadSingleTermMismatch =
    diagnostics.meaningfulTermCount >= 4 &&
    diagnostics.meaningfulOverlapCount <= 1 &&
    !hasTitleOrPathAnchor &&
    searchResponse.quotedPhrases.length === 0;
  const hardNoMatch =
    diagnostics.meaningfulTermCount === 0 ||
    seedResults.length === 0 ||
    broadSingleTermMismatch;

  const firstHopCandidates: ExpansionCandidate[] = [];
  if (!hardNoMatch && limits.maxGraphDepth >= 1) {
    for (const seed of seedResults) {
      const concept = bundle.conceptsById.get(seed.conceptId);
      if (!concept) {
        addDropped(droppedConcepts, droppedKeys, seed.conceptId, "unresolved");
        continue;
      }
      const rankInfluence = Math.max(0, seedResults.length - seed.seedRank) * 0.15;
      for (const neighbor of neighbors(bundle, concept.id, limits)) {
        firstHopCandidates.push(
          expansionCandidate(concept, neighbor, seed.score, 1, rankInfluence, searchResponse.meaningfulTerms),
        );
      }
    }
  }

  const firstHop = selectExpansionCandidates(
    firstHopCandidates,
    seedIds,
    limits.firstHopLimit,
    droppedConcepts,
    droppedKeys,
  );
  const sparseThreshold = Math.min(SPARSE_FIRST_HOP_THRESHOLD, limits.firstHopLimit);
  const sparseFirstHop =
    sparseThreshold > 0 &&
    firstHop.length < sparseThreshold &&
    seedResults.length + firstHop.length < DEFAULT_RETRIEVAL_LIMITS.lexicalSeedLimit;
  const explicitGraphRequest = hasExplicitGraphLanguage(searchResponse.normalizedQuery);
  const secondHopEligible =
    !hardNoMatch &&
    limits.maxGraphDepth >= 2 &&
    limits.secondHopLimit > 0 &&
    firstHop.length > 0 &&
    (sparseFirstHop || explicitGraphRequest);

  let secondHopReason = "first-hop context was sufficient";
  if (hardNoMatch) secondHopReason = "lexical evidence was insufficient";
  else if (limits.maxGraphDepth < 2) secondHopReason = "disabled by maxGraphDepth";
  else if (limits.secondHopLimit === 0) secondHopReason = "disabled by secondHopLimit";
  else if (firstHop.length === 0) secondHopReason = "no resolved first-hop concepts";
  else if (explicitGraphRequest) secondHopReason = "explicit relationship or graph language";
  else if (sparseFirstHop) secondHopReason = "first-hop context was sparse";

  const secondHopCandidates: ExpansionCandidate[] = [];
  if (secondHopEligible) {
    const excluded = new Set([...seedIds, ...firstHop.map((item) => item.result.conceptId)]);
    for (const parent of firstHop) {
      for (const neighbor of neighbors(bundle, parent.concept.id, limits)) {
        if (excluded.has(neighbor.concept.id)) {
          addDropped(droppedConcepts, droppedKeys, neighbor.concept.id, "deduplicated");
          continue;
        }
        secondHopCandidates.push(
          expansionCandidate(
            parent.concept,
            neighbor,
            parent.result.score,
            2,
            parent.result.priority * 0.1,
            searchResponse.meaningfulTerms,
          ),
        );
      }
    }
  }
  const secondHop = selectExpansionCandidates(
    secondHopCandidates,
    new Set([...seedIds, ...firstHop.map((item) => item.result.conceptId)]),
    limits.secondHopLimit,
    droppedConcepts,
    droppedKeys,
  );
  if (secondHopEligible && secondHop.length === 0) {
    secondHopReason = `${secondHopReason}; no additional concepts were selected`;
  }

  const selectedExpansions = [...firstHop, ...secondHop];
  const confidenceParts = confidenceSignals(
    diagnostics.meaningfulTermCount,
    diagnostics.meaningfulOverlapRatio,
    diagnostics.topScore,
    hasTitleOrPathAnchor,
    selectedExpansions.length,
  );
  const highValueFieldEvidence = seedResults.slice(0, 3).some((seed) =>
    seed.matchSource.some((source) =>
      [
        "exact-title",
        "exact-path",
        "title",
        "description",
        "tags",
        "sourcePaper",
        "label",
      ].includes(source)
    )
  );
  const weakCombinedEvidence =
    !hasTitleOrPathAnchor &&
    !highValueFieldEvidence &&
    diagnostics.meaningfulTermCount >= 2 &&
    diagnostics.meaningfulOverlapRatio < 0.34 &&
    confidenceParts.scoreSignal < 0.3 &&
    selectedExpansions.length === 0;
  const noMatch = hardNoMatch || weakCombinedEvidence;
  const confidence = noMatch
    ? Math.min(confidenceParts.confidence, 0.24)
    : confidenceParts.confidence;

  if (diagnostics.meaningfulTermCount === 0) {
    warnings.push("The question contained no meaningful searchable terms.");
  } else if (broadSingleTermMismatch) {
    warnings.push("Only one meaningful term from a broad query overlapped the corpus.");
  } else if (weakCombinedEvidence) {
    warnings.push("Lexical, field, and graph evidence were jointly too weak for context selection.");
  } else if (seedResults.length === 0) {
    warnings.push("No lexical seeds matched the native OKF corpus.");
  }

  const finalConcepts: FinalContextConcept[] = [];
  let contextCharacterEstimate = 0;
  let contextWasTruncated = false;
  if (!noMatch) {
    const contextCandidates: ContextCandidate[] = [];
    for (const seed of seedResults) {
      const concept = bundle.conceptsById.get(seed.conceptId);
      if (!concept) continue;
      contextCandidates.push({
        concept,
        score: seed.score,
        depth: 0,
        seedRank: seed.seedRank,
      });
    }
    for (const expanded of selectedExpansions) {
      contextCandidates.push({
        concept: expanded.concept,
        score: expanded.result.score,
        depth: expanded.result.depth,
        expansion: expanded.result,
      });
    }

    const selectedIds = new Set<string>();
    for (const [candidateIndex, candidate] of contextCandidates.entries()) {
      if (selectedIds.has(candidate.concept.id)) {
        addDropped(droppedConcepts, droppedKeys, candidate.concept.id, "deduplicated");
        continue;
      }
      selectedIds.add(candidate.concept.id);
      if (finalConcepts.length >= limits.maxConcepts) {
        addDropped(droppedConcepts, droppedKeys, candidate.concept.id, "concept-limit");
        continue;
      }

      const remaining = limits.maxContextCharacters - contextCharacterEstimate;
      const remainingCandidates = contextCandidates.length - candidateIndex;
      const remainingSlots = limits.maxConcepts - finalConcepts.length;
      const fairDivisor = Math.max(1, Math.min(remainingCandidates, remainingSlots));
      const fairBudget = Math.floor(remaining / fairDivisor);
      const fitted = fitContextConcept(candidate, fairBudget);
      if (!fitted) {
        addDropped(droppedConcepts, droppedKeys, candidate.concept.id, "context-limit");
        continue;
      }
      finalConcepts.push(fitted.concept);
      contextCharacterEstimate += fitted.concept.characterEstimate;
      contextWasTruncated ||= fitted.truncated;
    }
  }

  if (contextWasTruncated) {
    warnings.push("One or more Markdown bodies were truncated to fit the context limit.");
  }
  if (droppedConcepts.some((item) => item.reason === "context-limit")) {
    warnings.push("One or more concepts were omitted because the context limit was exhausted.");
  }

  const visibleExpansions = noMatch ? [] : selectedExpansions;
  const expansionPaths = visibleExpansions.map((candidate) => candidate.path);
  const debug: RetrievalDebug = {
    limits,
    meaningfulTokens: [...searchResponse.meaningfulTerms],
    searchDiagnostics: diagnostics,
    expansionPaths,
    droppedConcepts: droppedConcepts.sort(compareDropped),
    secondHopUsed: secondHop.length > 0 && !noMatch,
    secondHopReason,
    candidateCount:
      seedResults.length + firstHopCandidates.length + secondHopCandidates.length,
  };

  return {
    normalizedQuestion: searchResponse.normalizedQuery,
    seedResults,
    expandedResults: visibleExpansions.map((candidate) => candidate.result),
    finalConcepts,
    corpusOverview,
    warnings,
    confidence: rounded(confidence, 4),
    noMatch,
    debug,
    contextCharacterEstimate,
  };
}
