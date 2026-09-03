import "server-only";

import type { RetrievalResult } from "../retrieval-types.ts";

/**
 * Grounded follow-up derivation for a recoverable DESIGN_SYNTHESIS validation
 * failure.
 *
 * This is deliberately deterministic and generic: it never hardcodes a domain,
 * paper, or example.
 *
 * The follow-up question is anchored, in priority order, to
 *   1. the researcher's active design problem,
 *   2. its normalized display label, and
 *   3. any constraints already supplied in conversation state.
 *
 * Retrieved native OKF evidence is **secondary support only**. A retrieved
 * concept title is offered as a candidate option exclusively when SEVERAL
 * retrieved concepts are demonstrably relevant to that problem anchor — i.e.
 * they share meaningful (non-generic) terminology with it. A single noisy hit,
 * or a mixed / off-domain result set, can never re-frame the follow-up around a
 * domain the researcher did not ask about: in that case the question falls back
 * to a problem-centred one about scope, priorities, coordination and evaluation.
 */

export interface SynthesisClarificationNeed {
  /** Which under-specified design dimension the follow-up targets. */
  missingDimension: string;
  /** Safe internal reason the plan could not be validated (for logs, not the user). */
  reason: string;
  /** 2-4 concrete grounded options offered to the researcher; empty for a problem-centred follow-up. */
  candidateOptions: string[];
  /** Deterministic short label of the design problem being resumed. */
  originalProblemLabel: string;
  /** Whether the follow-up's framing came from relevant retrieved evidence or from the problem itself. */
  evidenceScope: "problem" | "retrieval";
  /** Clarification rounds already issued for this problem (0-based). */
  attemptCount: number;
  /** The single researcher-facing follow-up question. */
  question: string;
}

export interface DeriveSynthesisClarificationInput {
  problem: string;
  displayProblem: string | null;
  retrieval: RetrievalResult;
  /** A safe internal validator reason, when one is available. */
  validationReason: string | null;
  /** Clarification rounds already issued for this problem (0-based). */
  round: number;
  priorConstraints: readonly string[];
}

const MIN_GROUNDED_CONCEPTS = 2;
/** Relevant retrieved concepts required before retrieval may supply candidate options. */
const MIN_RELEVANT_CONCEPTS = 2;
const MAX_OPTIONS = 3;
const MAX_OPTION_CHARACTERS = 72;
const MIN_TOKEN_LENGTH = 4;
const MAX_PROBLEM_PHRASE_CHARACTERS = 128;

const PRIVACY_VOCAB =
  /\b(privacy|private|confidential|disclosure|consent|anonym|pseudonym|encrypt|selective)\b/iu;

/**
 * Generic design-science and discourse vocabulary that carries no domain signal
 * on its own. Two texts that share only these words are not "about the same
 * thing", so they are excluded when measuring problem/evidence relevance. This
 * list is intentionally about DSR scaffolding and function words only — never a
 * domain term — so it does not hardcode any subject matter.
 */
const RELEVANCE_STOPWORDS = new Set<string>([
  "design", "flow", "flows", "decision", "decisions", "support", "solution",
  "solutions", "system", "systems", "framework", "frameworks", "approach",
  "model", "models", "method", "methods", "mechanism", "mechanisms", "process",
  "processes", "problem", "problems", "requirement", "requirements", "principle",
  "principles", "objective", "objectives", "feature", "features", "artifact",
  "artefact", "evaluation", "evaluations", "outcome", "outcomes", "concept",
  "concepts", "stage", "stages", "step", "steps", "layer", "layers",
  "generate", "create", "build", "propose", "provide", "produce", "develop",
  "draft", "enable", "enabling", "using", "help", "make", "want", "need",
  "needs", "address", "handle", "solve", "show", "explain", "give", "sketch",
  "outline", "across", "between", "among", "within", "into", "onto", "from",
  "with", "that", "this", "these", "those", "which", "what", "should", "would",
  "could", "will", "must", "first", "main", "more", "less", "also", "about",
  "over", "under", "when", "where", "while", "each", "every", "other",
  "another", "such", "some", "many", "still", "just", "really",
  "independent", "organization", "organizations", "organizational", "cross",
  "party", "parties", "participant", "participants", "platform", "platforms",
  "user", "users", "actor", "actors", "stakeholder", "stakeholders",
  "trust", "trusted", "confused", "unsure", "uncertain",
]);

const TOKEN_SPLIT = /[^\p{L}\p{N}]+/u;

function normalizeToken(raw: string): string {
  const token = raw.toLocaleLowerCase("en");
  return token.length > MIN_TOKEN_LENGTH && token.endsWith("s")
    ? token.slice(0, -1)
    : token;
}

/**
 * Domain-bearing tokens in a string: length >= 4, not generic DSR/function
 * vocabulary, lightly singularized so "platforms"/"platform" and
 * "credentials"/"credential" match.
 */
function meaningfulTokens(text: string): Set<string> {
  const tokens = new Set<string>();
  for (const part of text.split(TOKEN_SPLIT)) {
    if (part.length < MIN_TOKEN_LENGTH) continue;
    const token = normalizeToken(part);
    if (token.length < MIN_TOKEN_LENGTH) continue;
    if (RELEVANCE_STOPWORDS.has(token)) continue;
    tokens.add(token);
  }
  return tokens;
}

function anchorTokens(input: DeriveSynthesisClarificationInput): Set<string> {
  const anchor = new Set<string>();
  for (const source of [
    input.problem ?? "",
    input.displayProblem ?? "",
    ...input.priorConstraints,
  ]) {
    for (const token of meaningfulTokens(source)) anchor.add(token);
  }
  return anchor;
}

function sharesMeaningfulTerminology(
  title: string,
  anchor: ReadonlySet<string>,
): boolean {
  if (anchor.size === 0) return false;
  for (const token of meaningfulTokens(title)) {
    if (anchor.has(token)) return true;
  }
  return false;
}

interface DesignDimension {
  key: string;
  needsOptions: boolean;
  /** Evidence-informed phrasing: `options` are relevant retrieved concept titles. */
  build: (options: readonly string[]) => string;
  /**
   * Problem-anchored phrasing, used when retrieval cannot supply enough relevant
   * options. `problem` is the researcher's own normalized problem phrase, so no
   * domain terminology is ever imported from elsewhere.
   */
  buildFromProblem: (problem: string) => string;
}

/**
 * Ordered catalogue of generic DSR under-specification dimensions. Round N picks
 * `DIMENSIONS[N]` (privacy-aware substitution aside), so each follow-up is
 * materially different from the last.
 */
const DIMENSIONS: readonly DesignDimension[] = [
  {
    key: "primary sub-problem",
    needsOptions: true,
    build: (options) =>
      `To make the design concrete, which part of the problem should the shared layer address first: ${orList(options)}?`,
    buildFromProblem: (problem) =>
      `To make the design concrete, which aspect of ${problem} should the shared layer address first: the capability it must provide, the way the parties coordinate, or the safeguards it must guarantee?`,
  },
  {
    key: "priority trade-off",
    needsOptions: false,
    build: () =>
      "Which priority should the design favour: keeping information shared and interoperable across the platforms, or keeping it private and controlled by each participant?",
    buildFromProblem: (problem) =>
      `For ${problem}, which priority should the design favour: keeping information shared and interoperable across the platforms, or keeping it private and controlled by each participant?`,
  },
  {
    key: "coordination model",
    needsOptions: false,
    build: () =>
      "Should the solution coordinate through a central authority that all platforms trust, or stay decentralized with peer-to-peer agreement between platforms?",
    buildFromProblem: (problem) =>
      `For ${problem}, should the solution coordinate through a central authority that all parties trust, or stay decentralized with peer-to-peer agreement between the parties?`,
  },
  {
    key: "evaluation objective",
    needsOptions: true,
    build: (options) =>
      `What outcome should count as success for the evaluation: ${orList(options)}?`,
    buildFromProblem: (problem) =>
      `What outcome should count as success for ${problem}: the capability working end to end, the safeguards holding for every party, or adoption by the parties the design is meant to serve?`,
  },
];

function orList(items: readonly string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0]!;
  return `${items.slice(0, -1).join(", ")}, or ${items.at(-1)}`;
}

function shorten(value: string): string {
  const collapsed = value.replace(/\s+/gu, " ").trim();
  return collapsed.length <= MAX_OPTION_CHARACTERS
    ? collapsed
    : `${collapsed.slice(0, MAX_OPTION_CHARACTERS - 1).trimEnd()}…`;
}

function groundedConceptTitles(retrieval: RetrievalResult): string[] {
  return [
    ...new Set(
      retrieval.finalConcepts
        .filter(
          (concept) => concept.type !== "paper" && concept.type !== "reference",
        )
        .sort((left, right) => right.score - left.score)
        .map((concept) => shorten(concept.title ?? ""))
        .filter((title) => title.length > 0),
    ),
  ];
}

function problemLabel(input: DeriveSynthesisClarificationInput): string {
  const source = (input.displayProblem ?? input.problem).replace(/\s+/gu, " ").trim();
  return source.length <= 120 ? source : `${source.slice(0, 119).trimEnd()}…`;
}

/**
 * A generic leading request frame ("Generate a design flow for …", "Help me
 * build a solution for …"). Stripping it leaves the substantive problem, and the
 * verb list contains no domain terms.
 */
const REQUEST_FRAME_PREFIX =
  /^(?:please\s+)?(?:can\s+you\s+|could\s+you\s+|i\s+(?:want|need)\s+(?:you\s+)?to\s+|help\s+me\s+(?:to\s+)?)?(?:generate|create|build|propose|produce|develop|draft|design|make|sketch|outline|give\s+me|show\s+me|come\s+up\s+with)\b[^.?!]*?\bfor\s+(?=\p{L})/iu;

/**
 * The researcher's problem, cleaned for embedding inside a sentence: the generic
 * request frame removed, trailing punctuation trimmed, length-bounded, and the
 * first letter lowercased unless it opens with an acronym. No domain vocabulary
 * is added or substituted.
 */
function problemPhrase(input: DeriveSynthesisClarificationInput): string {
  let phrase = (input.displayProblem ?? input.problem ?? "")
    .replace(/\s+/gu, " ")
    .trim()
    .replace(REQUEST_FRAME_PREFIX, "")
    .replace(/[.?!,;:\s]+$/u, "")
    .trim();
  if (phrase.length === 0) {
    phrase = (input.problem ?? "").replace(/\s+/gu, " ").trim();
  }
  if (phrase.length === 0) return "this design problem";
  if (phrase.length > MAX_PROBLEM_PHRASE_CHARACTERS) {
    phrase = `${phrase.slice(0, MAX_PROBLEM_PHRASE_CHARACTERS - 1).trimEnd()}…`;
  }
  if (!/^\p{Lu}{2,}/u.test(phrase)) {
    phrase = phrase.charAt(0).toLocaleLowerCase("en") + phrase.slice(1);
  }
  return phrase;
}

/**
 * Picks the dimension for this round. Rounds map to `DIMENSIONS` in order; if the
 * researcher has already stated a privacy priority (via a prior constraint), the
 * priority-trade-off round is swapped for the next unused dimension so the
 * follow-up stays materially new.
 */
function dimensionForRound(
  round: number,
  priorConstraints: readonly string[],
): DesignDimension {
  const alreadyPrivacyScoped = priorConstraints.some((constraint) =>
    PRIVACY_VOCAB.test(constraint),
  );
  if (round === 1 && alreadyPrivacyScoped) return DIMENSIONS[2]!;
  return DIMENSIONS[Math.min(round, DIMENSIONS.length - 1)]!;
}

export function deriveNativeOkfSynthesisClarification(
  input: DeriveSynthesisClarificationInput,
): SynthesisClarificationNeed | null {
  if (input.round < 0) return null;

  const anchor = anchorTokens(input);
  const groundedTitles = groundedConceptTitles(input.retrieval);
  const relevantTitles = groundedTitles.filter((title) =>
    sharesMeaningfulTerminology(title, anchor),
  );

  // Nothing to anchor a follow-up to — neither a usable problem statement nor
  // any grounded evidence — so there is no honest question to ask.
  if (anchor.size === 0 && groundedTitles.length < MIN_GROUNDED_CONCEPTS) {
    return null;
  }

  const dimension = dimensionForRound(input.round, input.priorConstraints);
  const phrase = problemPhrase(input);

  // Retrieval may supply candidate options ONLY when it is demonstrably about
  // the researcher's problem: several concepts share meaningful terminology with
  // the anchor. Otherwise the follow-up stays problem-centred, so a single noisy
  // concept or an off-domain result set never redefines the question's subject.
  // With no usable anchor at all, fall back to the prior evidence-count rule.
  const evidenceMayInform =
    anchor.size > 0
      ? relevantTitles.length >= MIN_RELEVANT_CONCEPTS
      : groundedTitles.length >= MIN_GROUNDED_CONCEPTS;
  const optionPool = anchor.size > 0 ? relevantTitles : groundedTitles;

  let question: string;
  let candidateOptions: string[];
  if (dimension.needsOptions && evidenceMayInform) {
    candidateOptions = optionPool.slice(0, MAX_OPTIONS);
    question = dimension.build(candidateOptions);
  } else if (dimension.needsOptions) {
    candidateOptions = [];
    question = dimension.buildFromProblem(phrase);
  } else {
    candidateOptions = [];
    question =
      anchor.size > 0
        ? dimension.buildFromProblem(phrase)
        : dimension.build([]);
  }

  return {
    missingDimension: dimension.key,
    reason:
      input.validationReason?.slice(0, 240) ??
      "the proposed design structure could not be validated against the grounded native OKF evidence",
    candidateOptions,
    originalProblemLabel: problemLabel(input),
    evidenceScope: candidateOptions.length > 0 ? "retrieval" : "problem",
    attemptCount: input.round,
    question,
  };
}
