const DIAGRAM_INTENT_PATTERN =
  /\b(?:decision[\s-]+support[\s-]+flow|flowchart|diagram|flow|graph|architecture|visuali[sz]e|depict|illustrate)\b/iu;

const MAP_ACTION_PATTERN =
  /^\s*(?:please\s+|(?:can|could|would)\s+you\s+)?map\s+(?:the\s+|this\s+|that\s+|what\s+|how\s+|represented\s+|stored\s+|canonical\s+)?(?:design\s+knowledge|relationships?|relations?|connections?|flow|evidence|requirements?|principles?|features?|what|how)\b/iu;

const SHOW_VISUAL_OBJECT_PATTERN =
  /\b(?:show|display|draw)\b[^.!?]{0,100}\b(?:relationships?|relations?|connections?|flow|diagram|graph|map|architecture)\b/iu;

const STORED_PAPER_MAP_INTENT_PATTERN =
  /(?:\b(?:show|display|visuali[sz]e|generate|create|draw|depict|illustrate)\b|^\s*(?:please\s+)?map\b)[^.!?]{0,140}\b(?:requirements?\s*,?\s*principles?\s*,?\s*(?:and\s+)?features?|paper(?:'s)?\s+(?:design\s+)?map|(?:represented|canonical|stored)\s+(?:design\s+)?(?:map|knowledge|relations?|relationships?)|design\s+knowledge)\b/iu;

const DIAGRAM_INTENT_WORDS = new Set([
  "architecture",
  "decision",
  "diagram",
  "flow",
  "flowchart",
  "graph",
  "illustrate",
  "map",
  "depict",
  "support",
  "visualise",
  "visualize",
]);

export interface DiagramIntentToggleState {
  enabled: boolean;
  autoEnabled: boolean;
  manuallyDisabledFor: string | null;
}

export const INITIAL_DIAGRAM_INTENT_TOGGLE_STATE: DiagramIntentToggleState = {
  enabled: false,
  autoEnabled: false,
  manuallyDisabledFor: null,
};

/** Detects only generic requests for a visual representation. */
export function inferStoredPaperMapIntent(question: string): boolean {
  return STORED_PAPER_MAP_INTENT_PATTERN.test(question.normalize("NFKC"));
}

export function inferDiagramIntent(question: string): boolean {
  const normalized = question.normalize("NFKC");
  return DIAGRAM_INTENT_PATTERN.test(normalized) ||
    MAP_ACTION_PATTERN.test(normalized) ||
    SHOW_VISUAL_OBJECT_PATTERN.test(normalized) ||
    inferStoredPaperMapIntent(normalized);
}

function normalizeQuestion(question: string): string {
  return question
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase("en")
    .replace(/\s+/gu, " ");
}

function subjectTerms(question: string): Set<string> {
  return new Set(
    normalizeQuestion(question)
      .match(/[a-z0-9]+/gu)
      ?.filter((term) => !DIAGRAM_INTENT_WORDS.has(term)) ?? [],
  );
}

/**
 * Treats case, spacing, punctuation, and a one-word refinement as the same
 * request, while allowing a genuinely different diagram question to be
 * suggested after a prior manual opt-out.
 */
export function diagramQuestionChangedMaterially(
  previousQuestion: string,
  nextQuestion: string,
): boolean {
  const previous = normalizeQuestion(previousQuestion);
  const next = normalizeQuestion(nextQuestion);
  if (previous === next) return false;

  const previousTerms = subjectTerms(previous);
  const nextTerms = subjectTerms(next);
  let differentTerms = 0;
  for (const term of previousTerms) {
    if (!nextTerms.has(term)) differentTerms += 1;
  }
  for (const term of nextTerms) {
    if (!previousTerms.has(term)) differentTerms += 1;
  }

  return differentTerms >= 2 || Math.abs(previous.length - next.length) >= 24;
}

export function reconcileDiagramIntentToggle(
  state: DiagramIntentToggleState,
  question: string,
  diagramAvailable = true,
): DiagramIntentToggleState {
  if (!diagramAvailable) {
    if (!state.enabled && !state.autoEnabled) return state;
    return { ...state, enabled: false, autoEnabled: false };
  }

  if (!inferDiagramIntent(question)) {
    if (!state.autoEnabled) return state;
    return { ...state, enabled: false, autoEnabled: false };
  }

  if (state.enabled) return state;
  if (
    state.manuallyDisabledFor !== null &&
    !diagramQuestionChangedMaterially(state.manuallyDisabledFor, question)
  ) {
    return state;
  }

  return {
    enabled: true,
    autoEnabled: true,
    manuallyDisabledFor: null,
  };
}

export function applyManualDiagramToggle(
  state: DiagramIntentToggleState,
  question: string,
  enabled: boolean,
): DiagramIntentToggleState {
  return {
    enabled,
    autoEnabled: false,
    manuallyDisabledFor: enabled ? null : normalizeQuestion(question),
  };
}
