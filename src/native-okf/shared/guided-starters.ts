export const NATIVE_OKF_GUIDED_STARTER_KINDS = [
  "paper-map",
  "design-knowledge",
  "paper-comparison",
  "grounded-solution",
] as const;

export type NativeOkfGuidedStarterKind =
  (typeof NATIVE_OKF_GUIDED_STARTER_KINDS)[number];

export const NATIVE_OKF_GUIDED_CATEGORY_TYPES = [
  "design-requirement",
  "design-principle",
  "design-feature",
  "design-objective",
  "meta-requirement",
  "design-goal",
] as const;

export type NativeOkfGuidedCategoryType =
  (typeof NATIVE_OKF_GUIDED_CATEGORY_TYPES)[number];

export interface NativeOkfGuidedStarterCategory {
  type: NativeOkfGuidedCategoryType;
  label: string;
}

export interface NativeOkfGuidedStarterPaper {
  id: string;
  title: string;
  categories: NativeOkfGuidedStarterCategory[];
}

export const NATIVE_OKF_GUIDED_CATEGORY_LABELS: Record<
  NativeOkfGuidedCategoryType,
  string
> = {
  "design-requirement": "design requirements",
  "design-principle": "design principles",
  "design-feature": "design features",
  "design-objective": "design objectives",
  "meta-requirement": "meta-requirements",
  "design-goal": "design goals",
};

export const MIN_GUIDED_PROBLEM_CHARACTERS = 12;
export const MAX_GUIDED_QUESTION_CHARACTERS = 2_000;

function boundedTitle(title: string): string {
  return title.replace(/[\u0000-\u001f\u007f]/gu, " ").replace(/\s+/gu, " ").trim();
}

export function paperMapStarterQuestion(title: string): string {
  return `Show the stored design map for "${boundedTitle(title)}".`;
}

export function designKnowledgeStarterQuestion(
  title: string,
  categoryLabel: string,
): string {
  return `What ${categoryLabel} are represented in "${boundedTitle(title)}", and how are they related?`;
}

export function paperComparisonStarterQuestion(
  firstTitle: string,
  secondTitle: string,
): string {
  return `Compare "${boundedTitle(firstTitle)}" and "${boundedTitle(secondTitle)}", focusing on their represented design knowledge, important differences, and reusable mechanisms.`;
}

export function validateDistinctGuidedPapers(
  firstPaperId: string,
  secondPaperId: string,
): string | null {
  if (!firstPaperId || !secondPaperId) return "Select two papers to compare.";
  if (firstPaperId === secondPaperId) {
    return "Choose two distinct papers for the comparison.";
  }
  return null;
}

export function groundedSolutionStarterQuestion(problem: string): string {
  const trimmed = problem.trim();
  const ending = /[.!?]$/u.test(trimmed) ? "" : ".";
  return `Generate a grounded decision-support flow for ${trimmed}${ending}`;
}

export function isGuidedQuestionWithinBounds(question: string): boolean {
  const length = question.trim().length;
  return length >= 3 && length <= MAX_GUIDED_QUESTION_CHARACTERS;
}

export function hasMeaningfulGuidedProblem(problem: string): boolean {
  const normalized = problem.trim();
  return normalized.length >= MIN_GUIDED_PROBLEM_CHARACTERS &&
    /[\p{L}\p{N}]/u.test(normalized);
}
