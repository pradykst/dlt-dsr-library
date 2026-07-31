export const MAX_SYNTHESIS_DISPLAY_PROBLEM_CHARACTERS = 300;
export const MAX_SYNTHESIS_PROBLEM_LABEL_CHARACTERS = 90;

const POLITE_PREFIX = /^(?:(?:please|can you|could you|would you|help me)\b[\s,:-]*)+/iu;
const CONSTRUCTION_PREFIX = /^(?:(?:generate|create|design|propose|build|construct|develop|formulate|make|produce|give me|show me)\b[\s,:-]*)+/iu;
const OUTPUT_WRAPPER = /^(?:a|an|the)?\s*((?:(?!design\s+flow\b|flow\b|framework\b|design\s+solution\b|solution\b|architecture\b|theory\b|approach\b|model\b|diagram\b)[\p{L}\p{N}][\p{L}\p{N}'\u2019-]*\s+){0,3})(?:design\s+flow|flow|framework|design\s+solution|solution\b|architecture|theory|approach|model|diagram)\s+for\s+(.+)$/iu;

function clean(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/\u0000/gu, "")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/gu, "")
    .replace(/\s+/gu, " ")
    .trim();
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
  let candidate = original.replace(POLITE_PREFIX, "");
  candidate = candidate.replace(CONSTRUCTION_PREFIX, "");
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
