import "server-only";

import type { RetrievalOptions } from "./retrieval-types.ts";

export const DEFAULT_SEARCH_LIMIT = 8;
export const MAX_SEARCH_RESULTS = 50;

export const SEARCH_FIELD_BOOSTS = Object.freeze({
  title: 10,
  description: 6,
  tags: 9,
  type: 4,
  sourcePaper: 3,
  headings: 3,
  authors: 2.5,
  venue: 2.5,
  label: 2.5,
  methodology: 2,
  year: 2,
  resource: 1.5,
  conceptId: 1,
  path: 1,
  body: 1,
});

export const SEARCH_PREFIX_MIN_TERM_LENGTH = 3;
export const SEARCH_FUZZY_MIN_TERM_LENGTH = 5;
export const SEARCH_FUZZY_DISTANCE = 0.18;
export const SEARCH_MAX_FUZZY_DISTANCE = 1;

export const SEARCH_EXACT_TITLE_MULTIPLIER = 4;
export const SEARCH_EMBEDDED_TITLE_MULTIPLIER = 2.5;
export const SEARCH_EXACT_PATH_MULTIPLIER = 5;
export const SEARCH_EMBEDDED_PATH_MULTIPLIER = 3;
export const SEARCH_QUOTED_PHRASE_MULTIPLIER = 1.6;

/** The bounded defaults requested for the local lexical + graph pipeline. */
export const DEFAULT_RETRIEVAL_LIMITS: Required<RetrievalOptions> = Object.freeze({
  lexicalSeedLimit: 8,
  firstHopLimit: 12,
  secondHopLimit: 6,
  maxConcepts: 20,
  maxContextCharacters: 35_000,
  maxGraphDepth: 2,
  includeIncoming: true,
  includeOutgoing: true,
});

/** Defensive ceilings for callers; defaults remain deliberately much smaller. */
export const MAX_RETRIEVAL_LIMITS: Readonly<Record<keyof RetrievalOptions, number>> =
  Object.freeze({
    lexicalSeedLimit: 20,
    firstHopLimit: 40,
    secondHopLimit: 20,
    maxConcepts: 50,
    maxContextCharacters: 80_000,
    maxGraphDepth: 2,
    includeIncoming: 1,
    includeOutgoing: 1,
  });
