const DIAGRAM_INTENT_PATTERN =
  /\b(?:decision[\s-]+support[\s-]+flow|r[\s-]*p[\s-]*f|flowchart|diagram|flow|graph|architecture|visuali[sz]e|depict|illustrate|sketch)\b/iu;

const MAP_ACTION_PATTERN =
  /^\s*(?:please\s+|(?:can|could|would)\s+you\s+)?map\s+(?:(?:the|this|that|what|how|all|every)\s+|represented\s+|stored\s+|canonical\s+)*(?:design\s+knowledge|concepts?|relationships?|relations?|connections?|flow|evidence|requirements?|principles?|features?|what|how)\b/iu;

const SHOW_VISUAL_OBJECT_PATTERN =
  /\b(?:show|display|draw|render|chart|lay\s+out)\b[^.!?]{0,100}\b(?:relationships?|relations?|connections?|links?|formal\s+layers?|flow|diagram|graph|maps?|architecture|design\s+knowledge)\b/iu;

const STORED_PAPER_MAP_INTENT_PATTERN =
  /(?:\b(?:show|display|visuali[sz]e|generate|create|draw|render|chart|lay\s+out|depict|illustrate|give)\b|^\s*(?:please\s+)?map\b)[^.!?]{0,160}\b(?:requirements?\s*,?\s*principles?\s*,?\s*(?:and\s+)?features?|rpf|rfp|paper(?:'s)?\s+(?:design\s+)?map|(?:represented|canonical|stored|complete)\s+(?:design\s+)?(?:map|knowledge|relations?|relationships?)|design\s+knowledge|formal\s+layers?\s+and\s+links?|this\s+paper|that\s+paper)\b/iu;

const PAPER_VISUAL_ACTION_PATTERN =
  /\b(?:show|display|draw|render|chart|lay\s+out|map|visuali[sz]e|depict|illustrate|give)\b/iu;
const PAPER_VISUAL_OBJECT_PATTERN =
  /\b(?:diagram|maps?|graph|grid|flow|relationships?|connections?|links?|formal\s+layers?|visual\s+structure|architecture|whole\s+thing)\b|\b(?:rpf|rfp|dsr)\b/iu;
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

// A visual action plus R/P/F vocabulary does not establish a stored subject.
const STORED_EVIDENCE_SUBJECT_PATTERN =
  /\b(?:paper|study|article|publication|stored|canonical|represented|source|library|corpus|evidence)\b/iu;

/** Task vocabulary, deliberately independent of the application domain. */
const DESIGN_OUTPUT = /\b(?:requirements?|principles?|features?|mechanisms?|artifact|solution|system|architecture|design(?:\s+ideas?)?)\b/iu;
const DESIGN_GUIDANCE = /\b(?:which|what|any)\b[^.!?]{0,140}\b(?:requirements?|principles?|features?|mechanisms?|architecture|design\s+ideas?)\b[^.!?]{0,100}\b(?:can|could|may|might|should|would|useful|help|needed)\b|\bany\s+(?:requirements?|principles?|features?)\b/iu;
const NEW_DESIGN = /\b(?:suggest|recommend|propose|devise|outline|sketch|design|develop|create|build|adapt|configure|customi[sz]e)\b[^.!?]{0,100}\b(?:new\s+(?:design|solution|system|artifact)|(?:a|an|my|our)\s+(?:[\p{L}\p{N}-]+\s+){0,8}(?:system|solution|artifact|architecture|service|platform|process|tool|application)|design\s+(?:a|an)\s+\S+)\b/iu;
const STATED_NEED = /\b(?:want|need|needs|would\s+like|plan|intend|aim|trying|trouble|struggl\w*|problem|challenge|difficulty|unable|cannot|can['’]t|too\s+(?:much|little|many|few)|better\s+way)\b/iu;
const INSPECTION = /\b(?:i|we)\s+(?:want|need|would\s+like)\s+(?:to\s+(?:see|inspect|read|understand|know|view|find|list|compare)|(?:an?\s+)?(?:explanation|summary|overview|comparison))\b|\b(?:stored|canonical|source|represented)\s+(?:design\s+)?(?:map|diagram|graph|knowledge)\b|\b(?:diagram|map)\s+(?:of|from|for)\s+(?:this|that|the)\s+paper\b|\bwhat\s+(?:this|that|the)\s+paper\s+(?:contains|reports|represents)\b/iu;

/**
 * Enough substantive purpose to distinguish a new problem from a bare request
 * for output or an unresolved edit ("make this safer"). These are task words,
 * not an ontology of supported research domains.
 */
export function hasConcreteDesignPurpose(question: string): boolean {
  const taskWords = /^(?:i|we|you|our|my|their|the|a|an|this|that|it|its|these|those|and|or|to|of|for|in|on|as|by|with|from|me|us|can|could|may|might|should|would|what|which|any|all|please|pls|show|draw|explain|give|suggest|recommend|propose|design|designs|requirements?|principles?|features?|mechanisms?|system|solution|artifact|architecture|diagram|flow|graph|map|theory|stage|evaluation|make|create|build|generate|add|update|remove|same|again|new|more|better|use|useful|help|have|has|need|needs|want|not|be|so|how|papers?|research|supporting|evidence)$/iu;
  const ownedPurpose = question.match(/\bfor\s+(?:my|our)\s+([^.!?]+)/iu)?.[1];
  if (ownedPurpose?.match(/[\p{L}\p{N}]+/gu)?.some(term => term.length >= 3 && !taskWords.test(term))) return true;
  return question.normalize('NFKC').split(/[.!?\n]/u).some((clause) => {
    // An edit referent alone does not establish a fresh problem.
    if (/^\s*(?:now\s+)?(?:make|update|change|simplify)\s+(?:this|it|the\s+(?:flow|diagram|proposal))\b/iu.test(clause)) return false;
    const terms = clause.match(/[\p{L}\p{N}]+/gu) ?? [];
    return terms.filter((term) => term.length >= 3 && !taskWords.test(term)).length >= 3;
  });
}

/** Resolve the requested purpose before considering its evidence subject. */
export function inferProposedDesignIntent(question: string): boolean {
  const normalized = question.normalize("NFKC");
  const designOutput = DESIGN_OUTPUT.test(normalized);
  const adaptation = /\b(?:adapt|configure|improve|customize|customise)\b[^.!?]{0,140}\b(?:for\s+(?:my|our)|to\s+(?:enable|allow|support|achieve|address))\b/iu.test(normalized);
  const newDesign = NEW_DESIGN.test(normalized) || hasConcreteDesignPurpose(normalized) &&
    /\b(?:can|could|should|might|would)\s+(?:i|we|you)\b[^.!?]{0,100}\b(?:a|an)\s+(?:new|different|alternative)\s+(?:solution|system|artifact|architecture|service|platform|process|tool|application|design)\b/iu.test(normalized);
  const guidance = DESIGN_GUIDANCE.test(normalized) || hasConcreteDesignPurpose(normalized) &&
    /\bwhat\s+(?:can|could|should|might)\s+(?:i|we)\s+(?:build|create|develop)\b|\b(?:any|some)\s+(?:design\s+)?(?:ideas|suggestions)\b/iu.test(normalized);
  const scholarlyDescription = /\b(?:papers?|studies|authors?)\s+(?:design(?:ed)?|propos(?:e|ed)|implement(?:ed)?|build|built|creat(?:e|ed))\b/iu.test(normalized) && !STATED_NEED.test(normalized);
  if (scholarlyDescription) return false;
  const sourceInspection = /\b(?:extract|retrieve|list|identify)\b[^.!?]{0,100}\b(?:from|in)\s+(?:this|that|the|selected)\s+paper\b|\b(?:from|in|of)\s+(?:this|that|the|selected)\s+paper\b/iu.test(normalized);
  const ownPurpose = /\b(?:for\s+(?:my|our)|to\s+(?:enable|achieve|support|solve))\b/iu.test(normalized);
  if (sourceInspection && !newDesign && !adaptation && !ownPurpose) return false;
  if (INSPECTION.test(normalized) && !guidance && !adaptation && !newDesign) return false;
  if (newDesign) return true;
  if (guidance && !/\b(?:represented|stored|reported|formally\s+connected)\b/iu.test(normalized)) return true;
  if (STATED_NEED.test(normalized) && designOutput && hasConcreteDesignPurpose(normalized) &&
      !/\b(?:explain|describe|summari[sz]e|definition|literature\s+review)\b/iu.test(normalized)) return true;
  return adaptation && (designOutput || DIAGRAM_INTENT_PATTERN.test(normalized));
}

/** Stored-map intent requires an affirmative source/evidence subject. */
export function inferStoredPaperMapIntent(question: string): boolean {
  const normalized = question.normalize("NFKC");
  if (inferProposedDesignIntent(normalized)) return false;
  return STORED_EVIDENCE_SUBJECT_PATTERN.test(normalized) && (
    STORED_PAPER_MAP_INTENT_PATTERN.test(normalized) ||
    PAPER_VISUAL_ACTION_PATTERN.test(normalized) &&
      EXPLICIT_PAPER_STRUCTURE_OBJECT_PATTERN.test(normalized) ||
    SHOW_LAYER_RELATIONSHIP_PATTERN.test(normalized) ||
    PAPER_VISUAL_ACTION_PATTERN.test(normalized) &&
      PAPER_VISUAL_OBJECT_PATTERN.test(normalized) &&
      PAPER_VISUAL_SUBJECT_PATTERN.test(normalized));
}

/** A corpus evidence visualization must be requested, never inferred from a toggle. */
export function inferEvidenceMapIntent(question: string): boolean {
  return !inferProposedDesignIntent(question) &&
    /\b(?:evidence|library|corpus|stored|retrieved|source)\b/iu.test(question) &&
    (MAP_ACTION_PATTERN.test(question) || SHOW_VISUAL_OBJECT_PATTERN.test(question) ||
      PAPER_VISUAL_ACTION_PATTERN.test(question) && PAPER_VISUAL_OBJECT_PATTERN.test(question));
}

/** Visual follow-up that can inherit one already validated paper focus. */
export function inferFocusedPaperMapFollowUpIntent(question: string): boolean {
  const normalized = question.normalize("NFKC");
  return PAPER_VISUAL_ACTION_PATTERN.test(normalized) &&
    (
      PAPER_VISUAL_OBJECT_PATTERN.test(normalized) ||
      /\bvisuali[sz]e\b/iu.test(normalized)
    ) &&
    (PAPER_VISUAL_SUBJECT_PATTERN.test(normalized) ||
      // An established paper focus can resolve a short visual reference without
      // the literal word "paper". A newly named purpose still needs routing.
      !/\b(?:for|about|to)\b/iu.test(normalized));
}

export function inferDiagramIntent(question: string): boolean {
  const normalized = question.normalize("NFKC");
  return DIAGRAM_INTENT_PATTERN.test(normalized) ||
    MAP_ACTION_PATTERN.test(normalized) ||
    SHOW_VISUAL_OBJECT_PATTERN.test(normalized) ||
    // Keep visual recognition independent from stored/proposed classification.
    STORED_PAPER_MAP_INTENT_PATTERN.test(normalized) ||
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
