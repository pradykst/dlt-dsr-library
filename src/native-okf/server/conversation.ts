import "server-only";

import type {
  NativeOkfChatRequest,
  NativeOkfClarification,
  NativeOkfConversationIntent,
  NativeOkfConversationState,
  NativeOkfSourceCard,
} from "../shared/chat-types.ts";
import {
  createInitialNativeOkfConversationState,
  MAX_NATIVE_OKF_ACTIVE_CONCEPTS,
  MAX_NATIVE_OKF_ACTIVE_PAPERS,
  MAX_NATIVE_OKF_ACTIVE_SOURCES,
  MAX_NATIVE_OKF_PENDING_QUESTION_CHARACTERS,
} from "../shared/chat-types.ts";
import { inferDiagramIntent } from "../shared/diagram-intent.ts";
import { getAllConcepts, getAllPapers } from "./repository.ts";
import type { RetrievalResult } from "./retrieval-types.ts";
import type { OkfConcept } from "./types.ts";

const COMPARISON_PATTERN =
  /\b(?:compare|comparison|contrast|differences?|versus|vs\.?)\b/iu;
const DETAIL_PATTERN =
  /\b(?:in detail|detailed|exhaustive|step[\s-]*by[\s-]*step|literature review|full methodological discussion)\b/iu;
const IMPLEMENTS_REFERENCE_PATTERN =
  /\b(?:what|which)\s+(?:design\s+)?features?\s+(?:implement|implements|realize|realizes|support|supports)\s+(?:it|this|that|the first one|the second one|this principle|that principle)\b/iu;
const GENERIC_IMPLEMENTATION_REFERENCE_PATTERN =
  /\bwhat\s+(?:implements?|realizes?|supports?)\s+(?:it|this|that)\b/iu;
const FIRST_PAPER_PATTERN = /\b(?:the\s+)?first\s+(?:paper|one)\b/iu;
const SECOND_PAPER_PATTERN = /\b(?:the\s+)?second\s+(?:paper|one)\b/iu;
const FIRST_CONCEPT_PATTERN =
  /\b(?:the\s+)?first\s+(?:principle|feature|requirement|concept|one)\b/iu;
const SECOND_CONCEPT_PATTERN =
  /\b(?:the\s+)?second\s+(?:principle|feature|requirement|concept|one)\b/iu;
const PAPER_REFERENCE_PATTERN = /\b(?:this|that|the previous)\s+paper\b/iu;
const PRINCIPLE_REFERENCE_PATTERN = /\b(?:this|that)\s+principle\b/iu;
const FEATURES_REFERENCE_PATTERN = /\bthose\s+features\b/iu;
const GENERIC_DIAGRAM_PATTERN =
  /^\s*(?:please\s+)?(?:generate|create|show|draw|visuali[sz]e)\s+(?:a\s+)?(?:grounded\s+)?(?:decision[\s-]+support\s+)?(?:flow|flowchart|diagram|graph|architecture)(?:\s+for\s+(?:a\s+)?(?:proposed\s+)?artifact)?[?.!\s]*$/iu;

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "approach",
  "based",
  "design",
  "for",
  "in",
  "of",
  "paper",
  "science",
  "system",
  "the",
  "to",
  "using",
  "with",
]);

export type NativeOkfAnswerMode = "normal" | "comparison" | "detailed";

export interface NativeOkfConversationPaper {
  slug: string;
  conceptId: string;
  title: string;
}

export interface NativeOkfConversationConcept {
  conceptId: string;
  title: string;
  type: string;
  paperSlug?: string;
}

export interface NativeOkfConversationCatalog {
  papers: readonly NativeOkfConversationPaper[];
  concepts: readonly NativeOkfConversationConcept[];
}

export interface PreparedNativeOkfChatRequest {
  request: NativeOkfChatRequest;
  catalog: NativeOkfConversationCatalog;
  validatedState: NativeOkfConversationState;
  effectiveQuestion: string;
  retrievalQuestion: string;
  explicitPaperSlugs: string[];
  focusedPaperSlugs: string[];
  focusedConceptIds: string[];
  includeDiagram: boolean;
  answerMode: NativeOkfAnswerMode;
  intent: NativeOkfConversationIntent;
  clarification: NativeOkfClarification | null;
}

function normalize(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/gu, " ");
}

function uniqueBounded(values: Iterable<string>, maximum: number): string[] {
  const result: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) continue;
    seen.add(value);
    result.push(value);
    if (result.length >= maximum) break;
  }
  return result;
}

function paperSlug(conceptId: string): string {
  return conceptId.split("/").at(-1) ?? conceptId;
}

function stringMetadata(concept: OkfConcept, key: string): string | undefined {
  const value = concept.frontmatter[key];
  if (typeof value === "string") return value.trim() || undefined;
  if (!Array.isArray(value)) return undefined;
  return value.find(
    (item): item is string =>
      typeof item === "string" && item.trim() !== "",
  )?.trim();
}

function paperForReference(
  reference: string | undefined,
  papers: readonly NativeOkfConversationPaper[],
): string | undefined {
  if (!reference) return undefined;
  const normalized = normalize(reference.replace(/\.md$/iu, ""));
  return papers.find((paper) => {
    const id = normalize(paper.conceptId);
    return (
      normalized === id ||
      normalized === normalize(paper.slug) ||
      normalized === normalize(paper.title) ||
      id.endsWith(` ${normalized}`)
    );
  })?.slug;
}

function linkedPaperSlug(
  concept: OkfConcept,
  paperIdToSlug: ReadonlyMap<string, string>,
): string | undefined {
  for (const link of [...concept.outgoingLinks, ...concept.incomingLinks]) {
    const slug =
      (link.targetId ? paperIdToSlug.get(link.targetId) : undefined) ??
      paperIdToSlug.get(link.sourceId);
    if (slug) return slug;
  }
  return undefined;
}

export async function loadNativeOkfConversationCatalog(): Promise<NativeOkfConversationCatalog> {
  const [paperConcepts, allConcepts] = await Promise.all([
    getAllPapers(),
    getAllConcepts(),
  ]);
  const papers = paperConcepts.map((paper) => ({
    slug: paperSlug(paper.id),
    conceptId: paper.id,
    title: paper.title?.trim() || paper.id,
  }));
  const paperIdToSlug = new Map(
    papers.map((paper) => [paper.conceptId, paper.slug]),
  );
  const concepts = allConcepts.map((concept) => ({
    conceptId: concept.id,
    title: concept.title?.trim() || concept.id,
    type: concept.type,
    ...(concept.type === "paper"
      ? { paperSlug: paperIdToSlug.get(concept.id) }
      : {
          paperSlug:
            paperForReference(
              stringMetadata(concept, "source_paper"),
              papers,
            ) ?? linkedPaperSlug(concept, paperIdToSlug),
        }),
  }));
  return { papers, concepts };
}

export function validateNativeOkfConversationState(
  state: NativeOkfConversationState | undefined,
  catalog: NativeOkfConversationCatalog,
): NativeOkfConversationState {
  const initial = createInitialNativeOkfConversationState();
  if (!state) return initial;
  const paperSlugs = new Set(catalog.papers.map((paper) => paper.slug));
  const conceptIds = new Set(
    catalog.concepts.map((concept) => concept.conceptId),
  );
  return {
    version: 1,
    activePaperSlugs: uniqueBounded(
      state.activePaperSlugs.filter((slug) => paperSlugs.has(slug)),
      MAX_NATIVE_OKF_ACTIVE_PAPERS,
    ),
    activeConceptIds: uniqueBounded(
      state.activeConceptIds.filter((id) => conceptIds.has(id)),
      MAX_NATIVE_OKF_ACTIVE_CONCEPTS,
    ),
    activeSourceIds: uniqueBounded(
      state.activeSourceIds.filter((id) => conceptIds.has(id)),
      MAX_NATIVE_OKF_ACTIVE_SOURCES,
    ),
    lastIntent: state.lastIntent,
    lastDiagramRequested: state.lastDiagramRequested,
    pendingClarification: state.pendingClarification,
  };
}

function titleTerms(title: string): string[] {
  return normalize(title)
    .split(" ")
    .filter((term) => term.length >= 3 && !STOP_WORDS.has(term));
}

function paperMentionScore(
  question: string,
  paper: NativeOkfConversationPaper,
): number {
  const normalizedQuestion = normalize(question);
  const normalizedTitle = normalize(paper.title);
  const normalizedSlug = normalize(paper.slug);
  const titlePrefix = normalize(paper.title.split(":", 1)[0] ?? "");
  if (normalizedQuestion.includes(normalizedTitle)) {
    return 10_000 + normalizedTitle.length;
  }
  if (titlePrefix.length >= 10 && normalizedQuestion.includes(titlePrefix)) {
    return 9_000 + titlePrefix.length;
  }
  if (normalizedQuestion.includes(normalizedSlug)) {
    return 8_000 + normalizedSlug.length;
  }

  const questionTerms = new Set(normalizedQuestion.split(" "));
  const terms = titleTerms(paper.title);
  const matches = terms.filter((term) => questionTerms.has(term));
  if (matches.length < 2) return 0;
  return matches.length * 100 +
    matches.reduce((sum, term) => sum + term.length, 0);
}

export function findExplicitNativeOkfPaperSlugs(
  question: string,
  catalog: NativeOkfConversationCatalog,
): string[] {
  return catalog.papers
    .map((paper) => ({
      paper,
      score: paperMentionScore(question, paper),
      position: orderedPaperMentionPosition(question, paper),
    }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => {
      if (
        left.position >= 0 &&
        right.position >= 0 &&
        left.position !== right.position
      ) {
        return left.position - right.position;
      }
      if (left.position >= 0) return -1;
      if (right.position >= 0) return 1;
      return (
        right.score - left.score ||
        left.paper.slug.localeCompare(right.paper.slug, "en")
      );
    })
    .map(({ paper }) => paper.slug)
    .slice(0, MAX_NATIVE_OKF_ACTIVE_PAPERS);
}
function orderedPaperMentionPosition(
  question: string,
  paper: NativeOkfConversationPaper,
): number {
  const normalizedQuestion = normalize(question);
  const exactCandidates = [
    normalize(paper.title),
    normalize(paper.title.split(":", 1)[0] ?? ""),
    normalize(paper.slug),
  ]
    .filter((candidate) => candidate.length >= 3)
    .map((candidate) => normalizedQuestion.indexOf(candidate))
    .filter((position) => position >= 0);
  if (exactCandidates.length > 0) return Math.min(...exactCandidates);
  const termPositions = titleTerms(paper.title)
    .map((term) => normalizedQuestion.indexOf(term))
    .filter((position) => position >= 0);
  return termPositions.length > 0 ? Math.min(...termPositions) : -1;
}

function findExplicitConceptIds(
  question: string,
  catalog: NativeOkfConversationCatalog,
): string[] {
  const normalizedQuestion = normalize(question);
  return catalog.concepts
    .filter((concept) => {
      const title = normalize(concept.title);
      const id = normalize(concept.conceptId);
      return (
        (title.length >= 8 && normalizedQuestion.includes(title)) ||
        normalizedQuestion.includes(id)
      );
    })
    .filter((concept) => concept.type !== "paper")
    .map((concept) => concept.conceptId)
    .slice(0, MAX_NATIVE_OKF_ACTIVE_CONCEPTS);
}

function conceptKind(
  type: string,
): "principle" | "feature" | "requirement" | "other" {
  const normalizedType = normalize(type);
  if (normalizedType.includes("principle")) return "principle";
  if (normalizedType.includes("feature")) return "feature";
  if (normalizedType.includes("requirement")) return "requirement";
  return "other";
}

function requestedConceptKind(
  question: string,
): ReturnType<typeof conceptKind> | null {
  if (/\bprinciples?\b/iu.test(question)) return "principle";
  if (/\bfeatures?\b/iu.test(question)) return "feature";
  if (/\brequirements?\b/iu.test(question)) return "requirement";
  return null;
}

function selectConceptIds(
  question: string,
  state: NativeOkfConversationState,
  catalog: NativeOkfConversationCatalog,
): string[] {
  const byId = new Map(
    catalog.concepts.map((concept) => [concept.conceptId, concept]),
  );
  const active = state.activeConceptIds.filter((id) => byId.has(id));
  const ordinalReferenceKind =
    /\b(?:first|second)\s+principle\b/iu.test(question)
      ? "principle"
      : /\b(?:first|second)\s+feature\b/iu.test(question)
        ? "feature"
        : /\b(?:first|second)\s+requirement\b/iu.test(question)
          ? "requirement"
          : null;
  const ordinalConcepts = ordinalReferenceKind
    ? active.filter(
        (id) =>
          conceptKind(byId.get(id)?.type ?? "") ===
          ordinalReferenceKind,
      )
    : active;
  if (FIRST_CONCEPT_PATTERN.test(question)) {
    return ordinalConcepts.slice(0, 1);
  }
  if (SECOND_CONCEPT_PATTERN.test(question)) {
    return ordinalConcepts.slice(1, 2);
  }
  const requestedKind = requestedConceptKind(question);
  const ofKind = requestedKind
    ? active.filter(
        (id) => conceptKind(byId.get(id)?.type ?? "") === requestedKind,
      )
    : active;

  if (FIRST_CONCEPT_PATTERN.test(question)) return ofKind.slice(0, 1);
  if (SECOND_CONCEPT_PATTERN.test(question)) return ofKind.slice(1, 2);
  if (FEATURES_REFERENCE_PATTERN.test(question)) {
    return active.filter(
      (id) => conceptKind(byId.get(id)?.type ?? "") === "feature",
    );
  }
  if (PRINCIPLE_REFERENCE_PATTERN.test(question)) {
    return active
      .filter(
        (id) => conceptKind(byId.get(id)?.type ?? "") === "principle",
      )
      .slice(0, 1);
  }
  if (
    IMPLEMENTS_REFERENCE_PATTERN.test(question) ||
    GENERIC_IMPLEMENTATION_REFERENCE_PATTERN.test(question)
  ) {
    return active.slice(0, 1);
  }
  return [];
}

function resolvePaperFocus(
  question: string,
  explicitPaperSlugs: readonly string[],
  state: NativeOkfConversationState,
): string[] {
  if (explicitPaperSlugs.length > 0) return [...explicitPaperSlugs];
  if (FIRST_PAPER_PATTERN.test(question)) {
    return state.activePaperSlugs.slice(0, 1);
  }
  if (SECOND_PAPER_PATTERN.test(question)) {
    return state.activePaperSlugs.slice(1, 2);
  }
  if (
    PAPER_REFERENCE_PATTERN.test(question) &&
    state.activePaperSlugs.length === 1
  ) {
    return state.activePaperSlugs.slice(0, 1);
  }
  return [...state.activePaperSlugs];
}

function clarificationFor(
  question: string,
  explicitPaperSlugs: readonly string[],
  explicitConceptIds: readonly string[],
  focusedConceptIds: readonly string[],
  state: NativeOkfConversationState,
): NativeOkfClarification | null {
  if (
    SECOND_PAPER_PATTERN.test(question) &&
    explicitPaperSlugs.length === 0 &&
    state.activePaperSlugs.length < 2
  ) {
    return {
      kind: "missing-comparison-target",
      question: "Which of the two papers should remain in the diagram?",
    };
  }
  if (
    (IMPLEMENTS_REFERENCE_PATTERN.test(question) ||
      GENERIC_IMPLEMENTATION_REFERENCE_PATTERN.test(question)) &&
    explicitPaperSlugs.length === 0 &&
    explicitConceptIds.length === 0 &&
    focusedConceptIds.length === 0
  ) {
    return {
      kind: "ambiguous-reference",
      question: "Which paper or design principle are you referring to?",
    };
  }
  if (
    (FIRST_CONCEPT_PATTERN.test(question) ||
      SECOND_CONCEPT_PATTERN.test(question)) &&
    explicitConceptIds.length === 0 &&
    focusedConceptIds.length === 0
  ) {
    return {
      kind: "ambiguous-reference",
      question: "Which paper or design principle are you referring to?",
    };
  }
  if (
    GENERIC_DIAGRAM_PATTERN.test(question) &&
    state.activePaperSlugs.length === 0
  ) {
    return {
      kind: "missing-domain",
      question: "What application domain should the flow address?",
    };
  }
  return null;
}

function contextualRetrievalQuestion(
  question: string,
  paperSlugs: readonly string[],
  conceptIds: readonly string[],
  catalog: NativeOkfConversationCatalog,
): string {
  if (paperSlugs.length === 0 && conceptIds.length === 0) return question;
  const papersBySlug = new Map(
    catalog.papers.map((paper) => [paper.slug, paper]),
  );
  const conceptsById = new Map(
    catalog.concepts.map((concept) => [concept.conceptId, concept]),
  );
  const focus = [
    ...paperSlugs.flatMap((slug) => {
      const paper = papersBySlug.get(slug);
      return paper ? [`paper ${paper.title} ${paper.conceptId}`] : [];
    }),
    ...conceptIds.flatMap((id) => {
      const concept = conceptsById.get(id);
      return concept
        ? [`concept ${concept.title} ${concept.conceptId}`]
        : [];
    }),
  ];
  return `${question}\nContextual native OKF focus: ${focus.join("; ")}`;
}

export async function prepareNativeOkfChatRequest(
  request: NativeOkfChatRequest,
  catalogInput?: NativeOkfConversationCatalog,
): Promise<PreparedNativeOkfChatRequest> {
  const catalog =
    catalogInput ?? (await loadNativeOkfConversationCatalog());
  const validatedState = validateNativeOkfConversationState(
    request.conversationState,
    catalog,
  );
  const pendingOriginal =
    validatedState.pendingClarification?.originalQuestion;
  const effectiveQuestion = pendingOriginal
    ? `${pendingOriginal}\nClarification response: ${request.question}`
    : request.question;
  const explicitPaperSlugs = findExplicitNativeOkfPaperSlugs(
    effectiveQuestion,
    catalog,
  );
  const paperBySlug = new Map(
    catalog.papers.map((paper) => [paper.slug, paper]),
  );
  explicitPaperSlugs.sort((left, right) => {
    const leftPaper = paperBySlug.get(left);
    const rightPaper = paperBySlug.get(right);
    const leftMentionPosition = leftPaper
      ? orderedPaperMentionPosition(effectiveQuestion, leftPaper)
      : -1;
    const rightMentionPosition = rightPaper
      ? orderedPaperMentionPosition(effectiveQuestion, rightPaper)
      : -1;
    const leftPosition = leftMentionPosition >= 0
      ? leftMentionPosition
      : Number.MAX_SAFE_INTEGER;
    const rightPosition = rightMentionPosition >= 0
      ? rightMentionPosition
      : Number.MAX_SAFE_INTEGER;
    return leftPosition - rightPosition;
  });
  const explicitConceptIds = findExplicitConceptIds(
    effectiveQuestion,
    catalog,
  );
  const contextBase =
    explicitPaperSlugs.length > 0
      ? {
          ...validatedState,
          activePaperSlugs: [],
          activeConceptIds: [],
          activeSourceIds: [],
        }
      : validatedState;
  const focusedPaperSlugs = resolvePaperFocus(
    effectiveQuestion,
    explicitPaperSlugs,
    contextBase,
  );
  const focusedConceptIds =
    explicitConceptIds.length > 0
      ? explicitConceptIds
      : selectConceptIds(effectiveQuestion, contextBase, catalog);
  const includeDiagram =
    request.includeDiagram === true ||
    (request.includeDiagram === undefined &&
      inferDiagramIntent(effectiveQuestion));
  const answerMode: NativeOkfAnswerMode = DETAIL_PATTERN.test(
    effectiveQuestion,
  )
    ? "detailed"
    : COMPARISON_PATTERN.test(effectiveQuestion)
      ? "comparison"
      : "normal";
  const intent: NativeOkfConversationIntent = includeDiagram
    ? "stored-diagram"
    : answerMode === "comparison"
      ? "comparison"
      : "answer";
  const clarification = clarificationFor(
    effectiveQuestion,
    explicitPaperSlugs,
    explicitConceptIds,
    focusedConceptIds,
    contextBase,
  );
  return {
    request,
    catalog,
    validatedState,
    effectiveQuestion,
    retrievalQuestion: contextualRetrievalQuestion(
      effectiveQuestion,
      focusedPaperSlugs,
      focusedConceptIds,
      catalog,
    ),
    explicitPaperSlugs,
    focusedPaperSlugs,
    focusedConceptIds,
    includeDiagram,
    answerMode,
    intent,
    clarification,
  };
}

export function clarificationConversationState(
  prepared: PreparedNativeOkfChatRequest,
): NativeOkfConversationState {
  const clarification = prepared.clarification;
  if (!clarification) return prepared.validatedState;
  return {
    ...prepared.validatedState,
    lastIntent: "clarification",
    lastDiagramRequested: prepared.includeDiagram,
    pendingClarification: {
      kind: clarification.kind,
      originalQuestion: prepared.effectiveQuestion.slice(
        0,
        MAX_NATIVE_OKF_PENDING_QUESTION_CHARACTERS,
      ),
    },
  };
}

function paperSlugsFromRetrieval(
  retrieval: RetrievalResult,
  catalog: NativeOkfConversationCatalog,
): string[] {
  const conceptsById = new Map(
    catalog.concepts.map((concept) => [concept.conceptId, concept]),
  );
  return uniqueBounded(
    retrieval.finalConcepts.flatMap((concept) => {
      const catalogConcept = conceptsById.get(concept.conceptId);
      return catalogConcept?.paperSlug
        ? [catalogConcept.paperSlug]
        : [];
    }),
    MAX_NATIVE_OKF_ACTIVE_PAPERS,
  );
}

function relevantConceptIds(
  question: string,
  retrieval: RetrievalResult,
): string[] {
  const requestedKind = requestedConceptKind(question);
  const concepts = requestedKind
    ? retrieval.finalConcepts.filter(
        (concept) => conceptKind(concept.type) === requestedKind,
      )
    : retrieval.finalConcepts.filter(
        (concept) => concept.type !== "paper",
      );
  return concepts.map((concept) => concept.conceptId);
}

export function completedConversationState(
  prepared: PreparedNativeOkfChatRequest,
  retrieval: RetrievalResult,
  sources: readonly NativeOkfSourceCard[],
): NativeOkfConversationState {
  const explicitTopic = prepared.explicitPaperSlugs.length > 0;
  const papers = explicitTopic
    ? prepared.focusedPaperSlugs
    : uniqueBounded(
        [
          ...prepared.focusedPaperSlugs,
          ...paperSlugsFromRetrieval(retrieval, prepared.catalog),
        ],
        MAX_NATIVE_OKF_ACTIVE_PAPERS,
      );
  const concepts = uniqueBounded(
    [
      ...relevantConceptIds(prepared.effectiveQuestion, retrieval),
      ...prepared.focusedConceptIds,
    ],
    MAX_NATIVE_OKF_ACTIVE_CONCEPTS,
  );
  const sourceIds = uniqueBounded(
    sources.map((source) => source.conceptId),
    MAX_NATIVE_OKF_ACTIVE_SOURCES,
  );
  const catalogConceptIds = new Set(
    prepared.catalog.concepts.map((concept) => concept.conceptId),
  );
  concepts.splice(
    0,
    concepts.length,
    ...concepts.filter((id) => catalogConceptIds.has(id)),
  );
  sourceIds.splice(
    0,
    sourceIds.length,
    ...sourceIds.filter((id) => catalogConceptIds.has(id)),
  );
  return {
    version: 1,
    activePaperSlugs: papers,
    activeConceptIds: concepts,
    activeSourceIds: sourceIds,
    lastIntent: prepared.intent,
    lastDiagramRequested: prepared.includeDiagram,
    pendingClarification: null,
  };
}
