const DIAGRAM_INTENT_PATTERN =
  /\b(?:decision[\s-]+support[\s-]+flow|flowchart|diagram|flow|graph|architecture|visuali[sz]e|depict|illustrate)\b/iu;

const MAP_ACTION_PATTERN =
  /^\s*(?:please\s+|(?:can|could|would)\s+you\s+)?map\s+(?:(?:the|this|that|what|how|all|every)\s+|represented\s+|stored\s+|canonical\s+)*(?:design\s+knowledge|concepts?|relationships?|relations?|connections?|flow|evidence|requirements?|principles?|features?|what|how)\b/iu;

const SHOW_VISUAL_OBJECT_PATTERN =
  /\b(?:show|display|draw|render|chart|lay\s+out)\b[^.!?]{0,100}\b(?:relationships?|relations?|connections?|links?|formal\s+layers?|flow|diagram|graph|map|architecture|design\s+knowledge)\b/iu;

const STORED_PAPER_MAP_INTENT_PATTERN =
  /(?:\b(?:show|display|visuali[sz]e|generate|create|draw|render|chart|lay\s+out|depict|illustrate|give)\b|^\s*(?:please\s+)?map\b)[^.!?]{0,160}\b(?:requirements?\s*,?\s*principles?\s*,?\s*(?:and\s+)?features?|rpf|rfp|paper(?:'s)?\s+(?:design\s+)?map|(?:represented|canonical|stored|complete)\s+(?:design\s+)?(?:map|knowledge|relations?|relationships?)|design\s+knowledge|formal\s+layers?\s+and\s+links?|this\s+paper|that\s+paper)\b/iu;

const PAPER_VISUAL_ACTION_PATTERN =
  /\b(?:show|display|draw|render|chart|lay\s+out|map|visuali[sz]e|depict|illustrate|give)\b/iu;
const PAPER_VISUAL_OBJECT_PATTERN =
  /\b(?:diagram|map|graph|grid|flow|relationships?|connections?|links?|formal\s+layers?|visual\s+structure|architecture|whole\s+thing)\b|\b(?:rpf|rfp|dsr)\b/iu;
const PAPER_VISUAL_SUBJECT_PATTERN =
  /\b(?:paper|study|article|work|publication|this|that|it|its|whole\s+thing|design\s+knowledge|complete|full)\b/iu;
const EXPLICIT_PAPER_STRUCTURE_OBJECT_PATTERN =
  /\b(?:dsr\s+grid|design\s+grid|design(?:[\s-]+knowledge)?\s+map|paper\s+map|rpf|rfp|complete\s+graph|full\s+graph)\b/iu;
const SHOW_LAYER_RELATIONSHIP_PATTERN =
  /\b(?:show|display|visuali[sz]e|map)\b[^.!?]{0,160}\b(?:requirements?|meta[\s-]+requirements?|principles?|features?)\b[^.!?]{0,120}\b(?:connect|relat|address|implement|support|link)/iu;

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
  const normalized = question.normalize("NFKC");
  return STORED_PAPER_MAP_INTENT_PATTERN.test(normalized) ||
    PAPER_VISUAL_ACTION_PATTERN.test(normalized) &&
      EXPLICIT_PAPER_STRUCTURE_OBJECT_PATTERN.test(normalized) ||
    SHOW_LAYER_RELATIONSHIP_PATTERN.test(normalized) ||
    PAPER_VISUAL_ACTION_PATTERN.test(normalized) &&
      PAPER_VISUAL_OBJECT_PATTERN.test(normalized) &&
      PAPER_VISUAL_SUBJECT_PATTERN.test(normalized);
}

/** Visual follow-up that can inherit one already validated paper focus. */
export function inferFocusedPaperMapFollowUpIntent(question: string): boolean {
  const normalized = question.normalize("NFKC");
  return PAPER_VISUAL_ACTION_PATTERN.test(normalized) &&
    (
      PAPER_VISUAL_OBJECT_PATTERN.test(normalized) ||
      /\bvisuali[sz]e\b/iu.test(normalized)
    ) &&
    PAPER_VISUAL_SUBJECT_PATTERN.test(normalized);
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

/** Converts UI suggestion state into the tri-state request contract. */
export function diagramPreferenceForRequest(
  state: DiagramIntentToggleState,
  question: string,
): "auto" | "requested" | "suppressed" {
  if (state.enabled) return "requested";
  if (
    state.manuallyDisabledFor !== null &&
    !diagramQuestionChangedMaterially(state.manuallyDisabledFor, question)
  ) {
    return "suppressed";
  }
  return "auto";
}
