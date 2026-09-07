export const MAX_SYNTHESIS_DISPLAY_PROBLEM_CHARACTERS = 300;
export const MAX_SYNTHESIS_PROBLEM_LABEL_CHARACTERS = 90;

// "help me with" is one polite unit (stripping "help me" alone would leave a
// dangling "with"); "can/could/would you" also covers the texting shorthand
// "u" once clean() below normalizes it to "you".
const POLITE_PREFIX =
  /^(?:(?:please|can\s+you|could\s+you|would\s+you|help\s+me(?:\s+with)?)\b[\s,:-]*)+/iu;
const CONSTRUCTION_PREFIX =
  /^(?:(?:generate|create|design|propose|build|construct|develop|formulate|make|produce|give me|show me)\b[\s,:-]*)+/iu;
// A leading "how do/can/could/should/might I/we/you solve" is the requester's
// own framing, not part of the problem itself (distinct from POLITE_PREFIX,
// which only covers the shorter "help me" family).
const HOW_DO_I_SOLVE_PREFIX =
  /^how\s+(?:do|can|could|should|might)\s+(?:i|we|you)\s+(?:solve|design|build)\b[\s,:-]*/iu;
const OUTPUT_WRAPPER =
  /^(?:a|an|the)?\s*((?:(?!design\s+flow\b|flow\b|framework\b|design\s+solution\b|solution\b|architecture\b|theory\b|approach\b|model\b|diagram\b|system\b|tool\b|platform\b|app\b)[\p{L}\p{N}][\p{L}\p{N}'’-]*\s+){0,3})(?:design\s+flow|flow|framework|design\s+solution|solution\b|architecture|theory|approach|model|diagram|system|tool|platform|app)\s+for\s+(.+)$/iu;

// A sentence that is *entirely* a meta-request about the answer's form (not
// about the problem itself) is dropped outright rather than left dangling at
// the end of the display label -- "How do I solve this problem?" and
// "Explain with a diagram." carry no problem content on their own. Anchored
// on both ends so a sentence that also states real content is never dropped.
const META_ONLY_SENTENCE_PATTERN =
  /^(?:how\s+(?:do|can|could|should|might)\s+(?:i|we|you)\s+(?:solve|design|build)\s+(?:this|it)(?:\s+problem)?|(?:please\s+)?explain\s+(?:this\s+)?(?:with|using)\s+(?:a\s+)?diagram|(?:please\s+)?(?:show|give|draw|generate|create)\s+(?:me\s+)?(?:a\s+|the\s+)?diagram|can\s+you\s+help(?:\s+me)?|help\s+me(?:\s+with\s+this)?)$/iu;

const CONTROL_CHARACTER_PATTERN = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/gu;

function clean(value: string): string {
  return value
    .normalize("NFKC")
    .replace(CONTROL_CHARACTER_PATTERN, "")
    // Common texting shorthand ("can u", "make u") reads as "you" for every
    // purpose this module cares about; normalizing it here lets every prefix
    // pattern above stay written in plain English.
    .replace(/\bu\b/gu, "you")
    .replace(/\s+/gu, " ")
    .trim();
}

function stripMetaOnlySentences(value: string): string {
  const sentences = value.split(/(?<=[.!?])\s+/u).filter((part) => part.trim() !== "");
  if (sentences.length <= 1) return value;
  const kept = sentences.filter((sentence) =>
    !META_ONLY_SENTENCE_PATTERN.test(sentence.trim().replace(/[.!?]+$/u, "").trim())
  );
  const joined = kept.join(" ").trim();
  return joined === "" ? value : joined;
}

// A comma-joined run-on ("...distributors, how do i solve this, explain with
// diagram") carries the same trailing meta clauses as a full sentence would,
// just without terminal punctuation for stripMetaOnlySentences to split on.
// Peel purely-meta clauses off the end, one comma-delimited clause at a time.
function stripTrailingMetaClauses(value: string): string {
  let current = value;
  for (let iterations = 0; iterations < 6; iterations += 1) {
    const lastComma = current.lastIndexOf(",");
    if (lastComma < 1) break;
    const trailing = current.slice(lastComma + 1).trim().replace(/[.!?]+$/u, "").trim();
    if (!META_ONLY_SENTENCE_PATTERN.test(trailing)) break;
    current = current.slice(0, lastComma).trim();
  }
  return current === "" ? value : current;
}

export function boundSynthesisDisplayText(
  value: string,
  maximum: number,
): string {
  const normalized = clean(value);
  if (normalized.length <= maximum) return normalized;
  const candidate = normalized.slice(0, maximum + 1);
  const boundary = candidate.lastIndexOf(" ");
  if (boundary < 1) return "Problem statement";
  return candidate.slice(0, boundary).replace(/[\s,;:.!?-]+$/gu, "").trim();
}

function capitalize(value: string): string {
  const [first, ...rest] = [...value];
  return first ? first.toLocaleUpperCase("en") + rest.join("") : value;
}

export function normalizeSynthesisProblemDisplay(
  question: string,
  maximum = MAX_SYNTHESIS_DISPLAY_PROBLEM_CHARACTERS,
): string {
  const original = clean(question);
  if (original === "") return "Problem statement";
  let candidate = stripMetaOnlySentences(original);
  candidate = stripTrailingMetaClauses(candidate);
  candidate = candidate.replace(POLITE_PREFIX, "");
  candidate = candidate.replace(CONSTRUCTION_PREFIX, "");
  candidate = candidate.replace(HOW_DO_I_SOLVE_PREFIX, "");
  const wrapper = OUTPUT_WRAPPER.exec(candidate);
  if (wrapper?.[2]) {
    candidate = `${wrapper[1] ?? ""}${wrapper[2]}`;
  }
  candidate = clean(candidate).replace(/[\s.!?;:]+$/gu, "").trim();
  if (candidate === "") candidate = original.replace(/[\s.!?;:]+$/gu, "").trim();
  return capitalize(boundSynthesisDisplayText(candidate, maximum));
}

export function synthesisProblemSummaryPhrase(question: string): string {
  const display = normalizeSynthesisProblemDisplay(question);
  return /^[A-Z][a-z]/u.test(display)
    ? display[0]!.toLocaleLowerCase("en") + display.slice(1)
    : display;
}

export function synthesisProblemNodeDisplay(question: string): {
  displayProblem: string;
  label: string;
  description: string;
} {
  const displayProblem = normalizeSynthesisProblemDisplay(question);
  return {
    displayProblem,
    label: boundSynthesisDisplayText(
      displayProblem,
      MAX_SYNTHESIS_PROBLEM_LABEL_CHARACTERS,
    ),
    description: boundSynthesisDisplayText(
      question,
      MAX_SYNTHESIS_DISPLAY_PROBLEM_CHARACTERS,
    ),
  };
}

/**
 * The single normalized problem label shared by the diagram title, the
 * user-problem node, deterministicSummary, and the prose introduction.
 *
 * Prefers a bounded, model-produced PROBLEM label when one is available and
 * non-empty -- a genuine semantic statement of the user's challenge rather than
 * a substring of their raw phrasing, which naturally handles the full range of
 * natural-language framings without depending on any one exact phrase. Falls
 * back to the conservative deterministic cleanup above only when no such label
 * was produced.
 *
 * The argument is a DesignProposalPlan's `problemLabel`, never its `title`. A
 * proposal title may legitimately name the proposed solution, so wiring one
 * into this slot is precisely how a Problem node ends up carrying an artifact's
 * name. Problem space and solution space are distinct fields end to end, and
 * the deterministic grammar rejects a Problem label that restates the Artifact.
 */
export function resolveSynthesisProblemLabel(
  modelProducedProblemLabel: string | null | undefined,
  fallbackProblemStatement: string,
): string {
  const bounded = modelProducedProblemLabel
    ? boundSynthesisDisplayText(
        modelProducedProblemLabel,
        MAX_SYNTHESIS_PROBLEM_LABEL_CHARACTERS,
      )
    : "";
  if (bounded !== "" && bounded !== "Problem statement") return bounded;
  return synthesisProblemNodeDisplay(fallbackProblemStatement).label;
}
