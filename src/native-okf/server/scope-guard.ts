import "server-only";

/**
 * A small, conservative, deterministic gate that catches requests which are
 * unmistakably outside the blockchain-related Design Science Research knowledge
 * library — arbitrary arithmetic, weather, recipes, and a few obvious
 * general-knowledge categories — before any retrieval, citation, or model call.
 *
 * It is deliberately NOT a general-purpose intent classifier. It only matches
 * narrow, high-precision shapes; anything ambiguous (including research
 * questions that merely use general language) passes straight through to the
 * normal routing and retrieval path, where the existing no-match / weak-evidence
 * handling still applies. Prompt-injection phrasing such as "forget all previous
 * instructions" is ignored here — only the actual task being requested matters.
 */

export const NATIVE_OKF_LIBRARY_SCOPE_BOUNDARY_RESPONSE =
  "This assistant is limited to the blockchain-related Design Science Research knowledge library. " +
  "It can help with the stored papers, their design knowledge (requirements, principles, and features), " +
  "comparisons across papers, and evidence-grounded design proposals — not general-purpose questions.";

export const NATIVE_OKF_OUT_OF_SCOPE_CATEGORIES = [
  "arithmetic",
  "weather",
  "recipe",
  "general-knowledge",
] as const;

export type NativeOkfOutOfScopeCategory =
  (typeof NATIVE_OKF_OUT_OF_SCOPE_CATEGORIES)[number];

/** Leading conversational / prompt-injection preamble that does not change the task. */
const PREAMBLE = new RegExp(
  "^\\s*(?:" +
    "(?:please|hey|hi|hello|ok(?:ay)?|so|now|also|and|but)\\b[\\s,:-]*|" +
    "(?:ignore|disregard|forget)\\b[^.?!]*?\\b(?:instructions?|prompts?|rules?|context)\\b[\\s,.:;!-]*|" +
    "(?:you are|act as|pretend|from now on)\\b[^.?!]*?[.?!,:-]\\s*" +
  ")+",
  "iu",
);

const ARITHMETIC_LEAD =
  /^(?:what(?:'s| is| are)?|calculate|compute|evaluate|solve|how much is|whats)\b[\s:]*/iu;

/** A bare arithmetic expression: digits and operators only, with a real operator. */
const ARITHMETIC_EXPRESSION =
  /^[\s\d.,]*\d[\s\d.,()]*[+\-*/×÷^%][\s\d.,()+\-*/×÷^%]*\d[\s\d.,()]*=?\s*\??$/u;

/**
 * A live weather lookup, and only that. The pattern is anchored to the start of
 * the question so that "weather" used as an application domain — weather
 * oracles, weather-derivative contracts, weather data on a distributed ledger —
 * is never caught: those questions are *about* weather, they do not *ask for*
 * it.
 */
const WEATHER = new RegExp(
  "^(?:" +
    "what(?:'s| is| was| will)?\\s+(?:the\\s+)?weather\\b|" +
    "how(?:'s| is)\\s+the\\s+weather\\b|" +
    "(?:will|is)\\s+it\\s+(?:going\\s+to\\s+)?(?:rain|snow)\\b|" +
    "weather\\s+(?:forecast|report)\\s+(?:for|in)\\b" +
  ")",
  "iu",
);

const RECIPE = new RegExp(
  "\\brecipe\\s+for\\b|" +
    "\\bhow\\s+(?:do\\s+i|to)\\b[^.?!]{0,40}\\b(?:bake|cook|fry|roast|grill)\\b[^.?!]{0,40}" +
    "\\b(?:cake|bread|cookies?|brownies?|pasta|pizza|soup|stew|curry|omelette?|pancakes?|dish|meal)\\b|" +
    "\\bpreheat\\s+the\\s+oven\\b",
  "iu",
);

const GENERAL_KNOWLEDGE = new RegExp(
  "\\bwhat(?:'s| is)\\s+the\\s+capital\\s+of\\b|" +
    "\\bhow\\s+(?:tall|old|far|big|heavy|deep)\\s+is\\s+(?:the\\s+)?(?:mount|mt\\.?|moon|sun|earth|eiffel|everest|" +
    "burj\\s+khalifa|nile|amazon|sahara|pacific|atlantic)\\b|" +
    "\\bhow\\s+many\\s+(?:planets|continents|oceans|countries|states|bones|players|days\\s+in)\\b|" +
    "\\btranslate\\b[^.?!]{0,60}\\b(?:to|into)\\s+(?:english|french|german|spanish|italian|latin|chinese|japanese|portuguese)\\b",
  "iu",
);

function withoutPreamble(question: string): string {
  return question.replace(PREAMBLE, "").trim();
}

export function nativeOkfOutOfScopeCategory(
  question: string,
): NativeOkfOutOfScopeCategory | null {
  const normalized = question.replace(/\s+/gu, " ").trim();
  if (normalized === "") return null;
  const core = withoutPreamble(normalized);
  const arithmeticCore = core.replace(ARITHMETIC_LEAD, "").trim();

  if (
    ARITHMETIC_EXPRESSION.test(core) ||
    ARITHMETIC_EXPRESSION.test(arithmeticCore)
  ) {
    return "arithmetic";
  }
  if (WEATHER.test(core)) return "weather";
  if (RECIPE.test(core)) return "recipe";
  if (GENERAL_KNOWLEDGE.test(core)) return "general-knowledge";
  return null;
}

export function isNativeOkfOutOfScopeRequest(question: string): boolean {
  return nativeOkfOutOfScopeCategory(question) !== null;
}
