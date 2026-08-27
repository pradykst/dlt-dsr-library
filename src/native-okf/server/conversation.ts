import "server-only";

import type {
  NativeOkfChatRequest,
  NativeOkfClarification,
  NativeOkfConversationIntent,
  NativeOkfConversationState,
  NativeOkfDiagramPreference,
  NativeOkfDiagramMode,
  NativeOkfSourceCard,
  SynthesisDraftState,
  SynthesisProblemState,
} from "../shared/chat-types.ts";
import {
  createInitialNativeOkfConversationState,
  MAX_NATIVE_OKF_ACTIVE_CONCEPTS,
  MAX_NATIVE_OKF_ACTIVE_PAPERS,
  MAX_NATIVE_OKF_ACTIVE_SOURCES,
  nativeOkfVisibleHistoryExceedsModelContext,
  MAX_NATIVE_OKF_PENDING_QUESTION_CHARACTERS,
} from "../shared/chat-types.ts";
import { normalizeSynthesisProblemDisplay } from "../shared/synthesis-problem-display.ts";
import {
  inferDiagramIntent,
  inferStoredPaperMapIntent,
} from "../shared/diagram-intent.ts";
import { getAllConcepts, getAllPapers } from "./repository.ts";
import {
  nativeOkfRequestedKindForType,
  prioritizeExplicitPaperCategoryContext,
  type NativeOkfRequestedConceptKind,
} from "./retrieval.ts";
import { applyNativeOkfStructuredAnalysis } from "./structured-analysis.ts";
import type { RetrievalResult } from "./retrieval-types.ts";
import type { OkfConcept } from "./types.ts";

const COMPARISON_PATTERN =
  /\b(?:compar(?:e|es|ed|ing|ison|ative)|contrast|differences?|versus|vs\.?)\b/iu;
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
const SYNTHESIS_ACTION_PATTERN =
  /\b(?:propos(?:e|ing)|creat(?:e|ing)|generat(?:e|ing)|construct(?:ing)?|develop(?:ing)?|formulat(?:e|ing)|build(?:ing)?|combin(?:e|ing)|designing)\b|^\s*(?:please\s+)?design\b/iu;
const SYNTHESIS_OUTPUT_PATTERN =
  /\b(?:framework|solution|architecture|flow|theory|artifact|approach|design)\b/iu;
const SYNTHESIS_NOVELTY_PATTERN =
  /\b(?:new|my problem|this (?:new )?(?:idea|problem|use case)|problem-specific|how should .+ be solved|across|fragmented|privacy-preserving)\b/iu;
const SYNTHESIS_REFINEMENT_PATTERN =
  /\b(?:make|add|remove|keep|replace|simpl(?:e|er|ify)|revise|focus|use only|exclude|base (?:it|the revision))\b/iu;
const ACTIVE_DIAGRAM_EDIT_ACTION_PATTERN =
  /\b(?:add|include|insert|introduce|connect|link|attach|remove|delete|drop|exclude|rename|relabel|update|revise|replace|move)\b/iu;
const ACTIVE_DIAGRAM_EDIT_OBJECT_PATTERN =
  /\b(?:nodes?|edges?|relationships?|connections?|requirements?|meta[\s-]+requirements?|principles?|features?|goals?|objectives?|artifacts?|mechanisms?|evaluations?|outcomes?|steps?|stages?|branches?|elements?|labels?)\b/iu;
const ACTIVE_DIAGRAM_CONNECT_PATTERN =
  /\b(?:connect|link|attach)\b[^.!?]{0,160}\b(?:to|with|between|both|same)\b/iu;
const SYNTHESIS_STANDALONE_MUTATION_PATTERN =
  /\b(?:make|add|remove|replace|simpl(?:e|er|ify)|revise|focus|use only|exclude|base (?:it|the revision))\b/iu;
const DESIGN_PROBLEM_GUIDANCE_PATTERN =
  /\b(?:i|we)\s+(?:(?:want|need|would\s+like)\s+help\s+(?:to\s+)?(?:build(?:ing)?|design(?:ing)?|creat(?:e|ing)|develop(?:ing)?|construct(?:ing)?)|(?:am|are)\s+(?:building|designing|creating|developing|constructing)|(?:want|need|plan|intend|aim|am\s+trying|are\s+trying)\s+to\s+(?:build|design|create|develop|construct))\b|\b(?:can|could|would)\s+you\s+(?:guide|help)\s+(?:me|us)(?:\s+(?:in|with|to)\s+(?:build(?:ing)?|design(?:ing)?|creat(?:e|ing)|develop(?:ing)?|construct(?:ing)?))?\b|\bhow\s+should\s+(?:i|we)\s+(?:build|design|create|develop|construct)\b|\bguide\s+(?:me|us)\s+(?:in|with)\s+(?:building|designing|creating|developing|constructing)\b/iu;
const CORPUS_QUERY_PATTERN =
  /\b(?:which|what)\s+(?:of\s+the\s+)?(?:papers?|stud(?:y|ies)|articles?|works?|publications?)\b|\bfind\s+examples?\b|\bfind\s+(?:examples?\s+(?:of|from)\s+)?(?:papers?|stud(?:y|ies)|articles?|works?|publications?)\b|\b(?:all|every|each)\s+(?:papers?|stud(?:y|ies)|articles?|works?|publications?)\b|\bacross\s+(?:the\s+)?(?:library|corpus|papers?|studies|articles?|works?|publications?)\b/iu;
const STRUCTURED_QUERY_PATTERN =
  /\b(?:counts?|categories|types?|represented|formal|map(?:s|ped|ping)?|relationships?|links?|connect(?:s|ed|ing|ions?)?|unmapped|lack(?:s|ed|ing)?|without|absence|zero)\b/iu;
const COMPARISON_DIAGRAM_FOLLOW_UP_PATTERN =
  /\b(?:what\s+we\s+(?:just\s+)?discussed|the\s+(?:discussion|comparison)|this|that|it|those\s+(?:papers?|studies|works))\b/iu;
const STORED_DIAGRAM_REQUEST_PATTERN =
  /\b(?:from|in)\s+(?:this|that|the|a named)\s+paper\b|\bstored\s+(?:map|relations?|knowledge)|\bsource\s+map\b|\b(?:rpf|rfp)\s+(?:map|diagram)\b|\brequirements?\s*,?\s*principles?\s*(?:and|&)\s*features?\s+from\b|\b(?:show|visuali[sz]e|diagram|flow|map)\b[^.!?]{0,140}\bpaper\b/iu;
const OUTPUT_MISSING_PATTERN = /\b(?:something|anything)\b/iu;
const EXPLICIT_RPF_STRUCTURE_PATTERN =
  /\b(?:rpf|rfp)\b|\brequirements?\b[^.!?]{0,100}\bprinciples?\b[^.!?]{0,100}\bfeatures?\b/iu;
const ONLY_PAPER_PATTERN =
  /\b(?:use|show|keep|base\s+(?:it|the revision)\s+on)?\s*only\s+(?:the\s+)?(?:first|second|this|that|these two|[\p{L}\p{N}][^.!?]{0,160})\s+papers?\b/iu;
const EXCLUDE_PAPER_PATTERN = /\bexclude\b[^.!?]{0,180}\bpaper\b/iu;
const CATEGORY_STORED_MAP_FOLLOW_UP_PATTERN =
  /(?:^\s*(?:please\s+)?(?:show|display|draw|visuali[sz]e|map|give)(?:\s+me)?\b|^\s*(?:please\s+)?(?:just|only)\b|\b(?:only|layer)\s*[?.!]*$)/iu;
const AMBIGUOUS_MAP_AGAIN_PATTERN =
  /^\s*(?:please\s+)?(?:show|display|visuali[sz]e|give\s+me|map)?\s*(?:the\s+)?(?:complete|full)?\s*(?:design\s+)?(?:map|diagram)\s+again[?.!\s]*$/iu;

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

const PAPER_TITLE_MATCH_STOP_WORDS = new Set([
  ...STOP_WORDS,
  "application",
  "applications",
  "feature",
  "features",
  "principle",
  "principles",
  "requirement",
  "requirements",
]);

export type NativeOkfAnswerMode = "normal" | "comparison" | "detailed";

export type NativeOkfQueryMode =
  | "PAPER_QA"
  | "MULTI_PAPER_QA"
  | "CORPUS_SEARCH"
  | "STRUCTURED_CORPUS_ANALYSIS"
  | "DESIGN_PROBLEM_SYNTHESIS"
  | "STORED_PAPER_DIAGRAM"
  | "COMPARATIVE_EVIDENCE_DIAGRAM"
  | "SYNTHESIZED_DESIGN_DIAGRAM";

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
  restrictedPaperSlugs: string[];
  focusedConceptIds: string[];
  requestedConceptKinds: NativeOkfRequestedConceptKind[];
  queryMode: NativeOkfQueryMode;
  corpusQuery: boolean;
  includeDiagram: boolean;
  diagramMode: NativeOkfDiagramMode | null;
  preferDeterministicPaperMap: boolean;
  preferDeterministicComparativeMap: boolean;
  answerMode: NativeOkfAnswerMode;
  intent: NativeOkfConversationIntent;
  synthesisProblem: string | null;
  synthesisDisplayProblem: string | null;
  synthesisDomain: string | null;
  priorSynthesisDraft: SynthesisDraftState | null;
  clarification: NativeOkfClarification | null;
  turnPlan: ResolvedNativeOkfTurnPlan;
}

/** One authoritative subject/mode resolution shared by answer and diagram paths. */
export interface ResolvedNativeOkfTurnPlan {
  effectiveQuestion: string;
  focusedPaperSlugs: string[];
  requestedConceptKinds: NativeOkfRequestedConceptKind[];
  diagramPreference: NativeOkfDiagramPreference;
  includeDiagram: boolean;
  diagramMode: NativeOkfDiagramMode | null;
  queryMode: NativeOkfQueryMode;
  activeDraftRefinement: boolean;
  categoryStoredMapFollowUp: boolean;
  historyContextTruncated: boolean;
}

function normalize(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/gu, " ");
}

export function nativeOkfSynthesisRequiresRpfPath(question: string): boolean {
  return EXPLICIT_RPF_STRUCTURE_PATTERN.test(question);
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
          paperSlug: paperForReference(
            stringMetadata(concept, "source_paper"),
            papers,
          ),
        }),
  }));
  return { papers, concepts };
}

function validateSynthesisDraftAgainstCatalog(
  draft: SynthesisDraftState | null,
  catalog: NativeOkfConversationCatalog,
): SynthesisDraftState | null {
  if (!draft) return null;
  const conceptIds = new Set(
    catalog.concepts.map((concept) => concept.conceptId),
  );
  const nodes = draft.nodes.flatMap((node) => {
    if (node.provenance === "user-provided") {
      return node.sourcePaths.length === 0 &&
          node.supportConceptIds.length === 0
        ? [node]
        : [];
    }
    const sourcePaths = uniqueBounded(
      node.sourcePaths.filter((id) => conceptIds.has(id)),
      3,
    );
    const supportConceptIds = uniqueBounded(
      node.supportConceptIds.filter((id) => conceptIds.has(id)),
      3,
    );
    if (
      sourcePaths.length === 0 ||
      supportConceptIds.length === 0 ||
      sourcePaths.some((id) => !supportConceptIds.includes(id))
    ) {
      return [];
    }
    if (
      node.provenance === "stored" &&
      (sourcePaths.length !== 1 ||
        supportConceptIds.length !== 1 ||
        sourcePaths[0] !== supportConceptIds[0])
    ) {
      return [];
    }
    return [{ ...node, sourcePaths, supportConceptIds }];
  });
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = draft.edges.flatMap((edge) => {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) return [];
    const supportConceptIds = uniqueBounded(
      edge.supportConceptIds.filter((id) => conceptIds.has(id)),
      3,
    );
    if (
      (edge.provenance === "stored" && supportConceptIds.length !== 2) ||
      (edge.provenance === "synthesized" &&
        supportConceptIds.length === 0)
    ) {
      return [];
    }
    return [{ ...edge, supportConceptIds }];
  });
  return nodes.length > 0 ? { ...draft, nodes, edges } : null;
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
  const latestValidatedSynthesisDraft = validateSynthesisDraftAgainstCatalog(
    state.latestValidatedSynthesisDraft ?? state.synthesisDraft,
    catalog,
  );
  const lastSynthesisProblem = state.lastSynthesisProblem ??
    (latestValidatedSynthesisDraft
      ? {
          version: 1 as const,
          problemStatement: latestValidatedSynthesisDraft.problemStatement,
          displayProblem: normalizeSynthesisProblemDisplay(
            latestValidatedSynthesisDraft.problemStatement,
          ),
          domain: latestValidatedSynthesisDraft.domain,
          objective: latestValidatedSynthesisDraft.objective,
          outputType: "design-solution",
          constraints: latestValidatedSynthesisDraft.constraints,
          sourcePaperSlugs: [],
        }
      : null);
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
    lastSynthesisProblem,
    latestValidatedSynthesisDraft,
    synthesisDraft: null,
  };
}

function titleTerms(title: string): string[] {
  return normalize(title)
    .split(" ")
    .filter(
      (term) => term.length >= 3 && !PAPER_TITLE_MATCH_STOP_WORDS.has(term),
    );
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

const MULTI_PAPER_MENTION_PATTERN =
  /\b(?:compar(?:e|es|ed|ing|ison|ative)|between|versus|vs\.?)\b/iu;

function hasExplicitLoosePaperPhrase(
  question: string,
  paper: NativeOkfConversationPaper,
): boolean {
  const normalizedQuestion = normalize(question);
  const terms = titleTerms(paper.title);
  return terms.some((term, index) =>
    index > 0 && normalizedQuestion.includes(`${terms[index - 1]} ${term}`)
  );
}
interface RankedPaperMention {
  paper: NativeOkfConversationPaper;
  score: number;
  position: number;
}

function rankedPaperMentions(
  question: string,
  catalog: NativeOkfConversationCatalog,
): RankedPaperMention[] {
  const mentions = catalog.papers
    .map((paper) => ({
      paper,
      score: paperMentionScore(question, paper),
      position: orderedPaperMentionPosition(question, paper),
    }))
    .filter(({ score }) => score > 0);
  const anchored = mentions.filter(({ score }) => score >= 8_000);
  const hasPaperReferenceCue =
    /\b(?:papers?|stud(?:y|ies)|articles?|works?|publications?)\b/iu.test(question) ||
    MULTI_PAPER_MENTION_PATTERN.test(question);
  if (anchored.length === 0 && !hasPaperReferenceCue) return [];
  const candidates = anchored.length === 0
    ? mentions
    : MULTI_PAPER_MENTION_PATTERN.test(question)
      ? mentions.filter(({ paper, score }) =>
          score >= 8_000 || hasExplicitLoosePaperPhrase(question, paper)
        )
      : anchored;
  return candidates.sort((left, right) => {
    if (
      anchored.length > 0 &&
      left.position >= 0 &&
      right.position >= 0 &&
      left.position !== right.position
    ) {
      return left.position - right.position;
    }
    return (
      right.score - left.score ||
      (left.position < 0 ? Number.MAX_SAFE_INTEGER : left.position) -
        (right.position < 0 ? Number.MAX_SAFE_INTEGER : right.position) ||
      left.paper.slug.localeCompare(right.paper.slug, "en")
    );
  });
}
export function findExplicitNativeOkfPaperSlugs(
  question: string,
  catalog: NativeOkfConversationCatalog,
): string[] {
  return rankedPaperMentions(question, catalog)
    .map(({ paper }) => paper.slug)
    .slice(0, MAX_NATIVE_OKF_ACTIVE_PAPERS);
}

function hasAmbiguousPaperReference(
  question: string,
  catalog: NativeOkfConversationCatalog,
): boolean {
  const [first, second] = rankedPaperMentions(question, catalog);
  return first !== undefined &&
    second !== undefined &&
    first.position >= 0 &&
    first.position === second.position &&
    first.score === second.score;
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
): NativeOkfRequestedConceptKind | "other" {
  return nativeOkfRequestedKindForType(type) ?? "other";
}

const REQUESTED_CATEGORY_PATTERNS: ReadonlyArray<
  readonly [NativeOkfRequestedConceptKind, RegExp]
> = [
  ["goal", /\b(?:design\s+)?goals?\b/iu],
  ["objective", /\b(?:design\s+)?objectives?\b/iu],
  ["meta-requirement", /\bmeta[\s-]+requirements?\b/iu],
  ["requirement", /(?<!meta[\s-])\brequirements?\b/iu],
  ["principle", /\b(?:design\s+)?principles?\b/iu],
  ["feature", /\b(?:design\s+)?features?\b/iu],
];

function requestedConceptKind(
  question: string,
): ReturnType<typeof conceptKind> | null {
  return requestedConceptKinds(question)[0] ?? null;
}

function categoryResolutionQuestion(
  question: string,
  paperSlugs: readonly string[],
  catalog: NativeOkfConversationCatalog,
): string {
  let normalizedQuestion = normalize(question);
  const paperBySlug = new Map(
    catalog.papers.map((paper) => [paper.slug, paper]),
  );
  const mentions = paperSlugs.flatMap((slug) => {
    const paper = paperBySlug.get(slug);
    if (!paper) return [];
    return [paper.title, paper.title.split(":", 1)[0] ?? "", paper.slug]
      .map(normalize)
      .filter((candidate) => candidate.length >= 3);
  });
  for (const mention of [...new Set(mentions)].sort(
    (left, right) => right.length - left.length,
  )) {
    normalizedQuestion = normalizedQuestion.replaceAll(mention, " ");
  }
  return normalize(normalizedQuestion);
}
function requestedConceptKinds(
  question: string,
): NativeOkfRequestedConceptKind[] {
  return REQUESTED_CATEGORY_PATTERNS.flatMap(([kind, pattern]) => {
    const match = pattern.exec(question);
    return match?.index === undefined ? [] : [{ kind, position: match.index }];
  })
    .sort((left, right) => left.position - right.position)
    .map((match) => match.kind);
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

export function inferNativeOkfSynthesisIntent(
  question: string,
  state: NativeOkfConversationState,
): boolean {
  if (STORED_DIAGRAM_REQUEST_PATTERN.test(question)) return false;
  if (/\bhow should .+ be solved\b/iu.test(question)) return true;
  if (
    state.lastSynthesisProblem &&
    state.lastIntent === "synthesized-flow" &&
    inferDiagramIntent(question)
  ) {
    return true;
  }
  if (
    state.lastSynthesisProblem &&
    state.lastIntent === "synthesized-flow" &&
    SYNTHESIS_REFINEMENT_PATTERN.test(question)
  ) {
    return true;
  }
  if (
    SYNTHESIS_STANDALONE_MUTATION_PATTERN.test(question) &&
    SYNTHESIS_OUTPUT_PATTERN.test(question)
  ) {
    return true;
  }
  if (DESIGN_PROBLEM_GUIDANCE_PATTERN.test(question)) return true;
  return SYNTHESIS_ACTION_PATTERN.test(question) &&
    (
      SYNTHESIS_OUTPUT_PATTERN.test(question) ||
      SYNTHESIS_NOVELTY_PATTERN.test(question) ||
      OUTPUT_MISSING_PATTERN.test(question)
    );
}

/**
 * A mutation is a diagram refinement only when an editable validated draft is
 * active and the utterance combines an edit operation with graph/design
 * semantics. This deliberately excludes ordinary requests to edit prose.
 */
export function inferActiveSynthesisDiagramRefinement(
  question: string,
  state: NativeOkfConversationState,
): boolean {
  if (!state.latestValidatedSynthesisDraft) return false;
  if (!ACTIVE_DIAGRAM_EDIT_ACTION_PATTERN.test(question)) return false;
  return ACTIVE_DIAGRAM_EDIT_OBJECT_PATTERN.test(question) ||
    ACTIVE_DIAGRAM_CONNECT_PATTERN.test(question);
}

function inferCategoryStoredMapFollowUp(
  question: string,
  focusedPaperSlugs: readonly string[],
  requestedKinds: readonly NativeOkfRequestedConceptKind[],
): boolean {
  return focusedPaperSlugs.length === 1 &&
    requestedKinds.length > 0 &&
    CATEGORY_STORED_MAP_FOLLOW_UP_PATTERN.test(question);
}

function resolvedDiagramPreference(
  request: NativeOkfChatRequest,
): NativeOkfDiagramPreference {
  if (request.diagramPreference) return request.diagramPreference;
  if (request.includeDiagram === true) return "requested";
  if (request.includeDiagram === false) return "suppressed";
  return "auto";
}

function meaningfulDomainTerms(value: string): string[] {
  return normalize(value)
    .split(" ")
    .filter((term) =>
      term.length >= 3 &&
      !STOP_WORDS.has(term) &&
      ![
        "build",
        "combine",
        "construct",
        "create",
        "develop",
        "diagram",
        "flow",
        "formulate",
        "framework",
        "generate",
        "propose",
        "solution",
        "something",
        "theory",
      ].includes(term)
    );
}

function inferredSynthesisDomain(
  question: string,
  draft: SynthesisProblemState | SynthesisDraftState | null,
): string | null {
  const match = question.match(/\bfor\s+([^.!?]{1,160})/iu);
  if (match?.[1] && meaningfulDomainTerms(match[1]).length >= 2) {
    return match[1].trim().slice(0, 120);
  }
  if (
    /\b(?:across|within|fragmented|privacy-preserving|cross[\s-])\b/iu.test(
      question,
    ) &&
    meaningfulDomainTerms(question).length >= 2
  ) {
    return question.trim().slice(0, 120);
  }
  return draft?.domain ?? null;
}

function hasConcreteSynthesisProblem(
  question: string,
  draft: SynthesisProblemState | SynthesisDraftState | null,
): boolean {
  return inferredSynthesisDomain(question, draft) !== null ||
    meaningfulDomainTerms(question).length >= 3 ||
    Boolean(draft?.problemStatement);
}

function resolvedPaperRestriction(
  question: string,
  explicitPaperSlugs: readonly string[],
  focusedPaperSlugs: readonly string[],
  state: NativeOkfConversationState,
): string[] {
  if (EXCLUDE_PAPER_PATTERN.test(question)) {
    const excluded = new Set(explicitPaperSlugs);
    return state.activePaperSlugs.filter((slug) => !excluded.has(slug));
  }
  if (ONLY_PAPER_PATTERN.test(question)) return [...focusedPaperSlugs];
  if (
    /\bbase\b[^.!?]{0,80}\b(?:this|these|two|first|second)\s+papers?\b/iu.test(
      question,
    )
  ) {
    return [...focusedPaperSlugs];
  }
  return [];
}


function priorDraftForRequest(
  draft: SynthesisDraftState | null,
  restrictedPaperSlugs: readonly string[],
  catalog: NativeOkfConversationCatalog,
): SynthesisDraftState | null {
  if (!draft) return null;
  const allowedPapers = new Set(restrictedPaperSlugs);
  const paperByConceptId = new Map(
    catalog.concepts.map((concept) => [
      concept.conceptId,
      concept.paperSlug,
    ]),
  );
  const nodes = draft.nodes.filter((node) => {
    if (node.provenance === "user-provided") return true;
    if (allowedPapers.size === 0) return true;
    return node.supportConceptIds.some((id) => {
      const paperSlug = paperByConceptId.get(id);
      return typeof paperSlug === "string" && allowedPapers.has(paperSlug);
    });
  });
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = draft.edges.filter(
    (edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target),
  );
  return { ...draft, nodes, edges };
}

function clarificationFor(
  question: string,
  ambiguousPaperReference: boolean,
  historyBoundaryMapAmbiguity: boolean,
  explicitPaperSlugs: readonly string[],
  explicitConceptIds: readonly string[],
  focusedConceptIds: readonly string[],
  state: NativeOkfConversationState,
  synthesisIntent: boolean,
): NativeOkfClarification | null {
  if (
    synthesisIntent &&
    SYNTHESIS_REFINEMENT_PATTERN.test(question) &&
    !state.lastSynthesisProblem &&
    !state.latestValidatedSynthesisDraft
  ) {
    return {
      kind: "missing-domain",
      question: "What design problem should the synthesized flow address?",
    };
  }
  if (ambiguousPaperReference) {
    return {
      kind: "ambiguous-reference",
      question: "Which paper are you referring to?",
    };
  }
  if (historyBoundaryMapAmbiguity) {
    return {
      kind: "ambiguous-reference",
      question:
        "Which paper or active design diagram should the complete map use?",
    };
  }
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
    synthesisIntent &&
    !state.lastSynthesisProblem &&
    OUTPUT_MISSING_PATTERN.test(question)
  ) {
    return {
      kind: "missing-output-type",
      question:
        "Should the result be an explanatory theory or a design solution?",
    };
  }
  if (
    synthesisIntent &&
    !hasConcreteSynthesisProblem(question, state.lastSynthesisProblem ?? null)
  ) {
    return {
      kind: "missing-domain",
      question: "Which application domain should the proposed flow address?",
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

export async function assembleNativeOkfContextualRetrieval(
  prepared: PreparedNativeOkfChatRequest,
  retrieval: RetrievalResult,
): Promise<RetrievalResult> {
  const paperSlugs = prepared.explicitPaperSlugs.length > 0
    ? prepared.explicitPaperSlugs
    : prepared.restrictedPaperSlugs.length > 0
      ? prepared.restrictedPaperSlugs
      : [
          "PAPER_QA",
          "MULTI_PAPER_QA",
          "STORED_PAPER_DIAGRAM",
          "COMPARATIVE_EVIDENCE_DIAGRAM",
        ].includes(prepared.queryMode)
        ? prepared.focusedPaperSlugs
        : [];
  const paperBySlug = new Map(
    prepared.catalog.papers.map((paper) => [paper.slug, paper]),
  );
  const paperConceptIds = paperSlugs.flatMap((slug) => {
    const paper = paperBySlug.get(slug);
    return paper ? [paper.conceptId] : [];
  });
  const prioritized = await prioritizeExplicitPaperCategoryContext(
    retrieval,
    {
      paperConceptIds,
      requestedConceptKinds: prepared.requestedConceptKinds,
    },
  );
  const evidencePaperSlugs = prepared.restrictedPaperSlugs.length > 0
    ? prepared.restrictedPaperSlugs
    : prepared.explicitPaperSlugs.length > 0 &&
        prepared.requestedConceptKinds.length > 0
      ? prepared.explicitPaperSlugs
      : [];
  const scoped = restrictNativeOkfRetrievalToPaperSlugs(
    prepared,
    prioritized,
    evidencePaperSlugs,
  );
  return applyNativeOkfStructuredAnalysis(scoped, {
    question: prepared.effectiveQuestion,
    paperConceptIds,
    requestedConceptKinds: prepared.requestedConceptKinds,
    corpusQuery: prepared.corpusQuery,
    multiPaperComparison: prepared.queryMode === "MULTI_PAPER_QA",
  });
}

function restrictNativeOkfRetrievalToPaperSlugs(
  prepared: PreparedNativeOkfChatRequest,
  retrieval: RetrievalResult,
  paperSlugs: readonly string[],
): RetrievalResult {
  if (paperSlugs.length === 0) return retrieval;
  const allowedPapers = new Set(paperSlugs);
  const paperByConceptId = new Map(
    prepared.catalog.concepts.map((concept) => [
      concept.conceptId,
      concept.paperSlug,
    ]),
  );
  for (const paper of prepared.catalog.papers) {
    paperByConceptId.set(paper.conceptId, paper.slug);
  }
  const allowedConcept = (conceptId: string): boolean => {
    const paperSlug = paperByConceptId.get(conceptId);
    return typeof paperSlug === "string" && allowedPapers.has(paperSlug);
  };
  const finalConcepts = retrieval.finalConcepts.filter((concept) =>
    allowedConcept(concept.conceptId)
  );
  const finalIds = new Set(finalConcepts.map((concept) => concept.conceptId));
  return {
    ...retrieval,
    seedResults: retrieval.seedResults.filter((result) =>
      allowedConcept(result.conceptId)
    ),
    expandedResults: retrieval.expandedResults.filter((result) =>
      allowedConcept(result.conceptId)
    ),
    finalConcepts,
    corpusOverview: {
      ...retrieval.corpusOverview,
      papers: retrieval.corpusOverview.papers.filter((paper) =>
        allowedConcept(paper.conceptId)
      ),
    },
    noMatch: retrieval.noMatch || finalConcepts.length === 0,
    debug: {
      ...retrieval.debug,
      expansionPaths: retrieval.debug.expansionPaths.filter((path) =>
        finalIds.has(path.sourceId) && finalIds.has(path.targetId)
      ),
    },
  };
}

export function applyNativeOkfPaperRestriction(
  prepared: PreparedNativeOkfChatRequest,
  retrieval: RetrievalResult,
): RetrievalResult {
  return restrictNativeOkfRetrievalToPaperSlugs(
    prepared,
    retrieval,
    prepared.restrictedPaperSlugs,
  );
}
export function hasSufficientNativeOkfSynthesisGrounding(
  retrieval: RetrievalResult,
): boolean {
  return retrieval.finalConcepts.filter(
    (concept) => concept.type !== "paper" && concept.type !== "reference",
  ).length >= 2;
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
  const corpusQuery = CORPUS_QUERY_PATTERN.test(effectiveQuestion);
  const explicitPaperSlugs = findExplicitNativeOkfPaperSlugs(
    effectiveQuestion,
    catalog,
  );
  const ambiguousPaperReference = hasAmbiguousPaperReference(
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
    (corpusQuery ||
      explicitPaperSlugs.length > 0 &&
        !EXCLUDE_PAPER_PATTERN.test(effectiveQuestion))
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
  const requestedKinds = requestedConceptKinds(
    categoryResolutionQuestion(
      effectiveQuestion,
      explicitPaperSlugs,
      catalog,
    ),
  );
  const activeDraftRefinement = inferActiveSynthesisDiagramRefinement(
    effectiveQuestion,
    contextBase,
  );
  let synthesisIntent = activeDraftRefinement || inferNativeOkfSynthesisIntent(
    effectiveQuestion,
    contextBase,
  );
  if (corpusQuery) synthesisIntent = false;
  const restrictedPaperSlugs = resolvedPaperRestriction(
    effectiveQuestion,
    explicitPaperSlugs,
    focusedPaperSlugs,
    validatedState,
  );
  const retrievalPaperSlugs = restrictedPaperSlugs.length > 0
    ? restrictedPaperSlugs
    : focusedPaperSlugs;
  const priorSynthesisDraft = synthesisIntent
    ? priorDraftForRequest(
        contextBase.latestValidatedSynthesisDraft ?? null,
        restrictedPaperSlugs,
        catalog,
      )
    : null;

  const diagramPreference = resolvedDiagramPreference(request);
  const categoryStoredMapFollowUp = inferCategoryStoredMapFollowUp(
    effectiveQuestion,
    focusedPaperSlugs,
    requestedKinds,
  );
  const automaticDiagramIntent =
    inferDiagramIntent(effectiveQuestion) ||
    activeDraftRefinement ||
    categoryStoredMapFollowUp ||
    (synthesisIntent && contextBase.lastDiagramRequested);
  const includeDiagram = diagramPreference === "requested" ||
    (diagramPreference === "auto" && automaticDiagramIntent);
  const storedPaperDiagram =
    includeDiagram && focusedPaperSlugs.length === 1 &&
    (
      inferStoredPaperMapIntent(effectiveQuestion) ||
      categoryStoredMapFollowUp
    );
  const comparativeDiagram =
    includeDiagram &&
    focusedPaperSlugs.length >= 2 &&
    (
      COMPARISON_PATTERN.test(effectiveQuestion) ||
      explicitPaperSlugs.length === 0 &&
        (contextBase.lastIntent === "comparison" ||
          contextBase.lastIntent === "comparative-diagram") &&
        COMPARISON_DIAGRAM_FOLLOW_UP_PATTERN.test(effectiveQuestion)
    );
  if (storedPaperDiagram || comparativeDiagram) synthesisIntent = false;
  const answerMode: NativeOkfAnswerMode = DETAIL_PATTERN.test(
    effectiveQuestion,
  )
    ? "detailed"
    : COMPARISON_PATTERN.test(effectiveQuestion)
      ? "comparison"
      : "normal";
  const intent: NativeOkfConversationIntent = synthesisIntent
    ? "synthesized-flow"
    : comparativeDiagram
      ? "comparative-diagram"
    : includeDiagram
      ? "stored-diagram"
      : answerMode === "comparison"
        ? "comparison"
        : "answer";
  const diagramMode: NativeOkfDiagramMode | null = includeDiagram
    ? synthesisIntent
      ? "synthesized"
      : comparativeDiagram
        ? "comparative"
      : "stored"
    : null;
  const preferDeterministicPaperMap =
    diagramMode === "stored" &&
    focusedPaperSlugs.length === 1;
  const preferDeterministicComparativeMap =
    diagramMode === "comparative" && focusedPaperSlugs.length >= 2;
  const queryMode: NativeOkfQueryMode = diagramMode === "synthesized"
    ? "SYNTHESIZED_DESIGN_DIAGRAM"
    : preferDeterministicComparativeMap
      ? "COMPARATIVE_EVIDENCE_DIAGRAM"
      : preferDeterministicPaperMap
        ? "STORED_PAPER_DIAGRAM"
        : synthesisIntent
          ? "DESIGN_PROBLEM_SYNTHESIS"
          : corpusQuery &&
              (requestedKinds.length > 0 || STRUCTURED_QUERY_PATTERN.test(effectiveQuestion))
            ? "STRUCTURED_CORPUS_ANALYSIS"
            : corpusQuery
              ? "CORPUS_SEARCH"
              : focusedPaperSlugs.length >= 2
                ? "MULTI_PAPER_QA"
                : focusedPaperSlugs.length === 1
                  ? "PAPER_QA"
                  : "CORPUS_SEARCH";
  const historyContextTruncated = nativeOkfVisibleHistoryExceedsModelContext(
    request.visibleHistoryMessageCount ?? request.history?.length ?? 0,
  );
  const historyBoundaryMapAmbiguity =
    historyContextTruncated &&
    explicitPaperSlugs.length === 0 &&
    AMBIGUOUS_MAP_AGAIN_PATTERN.test(effectiveQuestion) &&
    (
      validatedState.activePaperSlugs.length > 1 ||
      validatedState.activePaperSlugs.length === 1 &&
        validatedState.latestValidatedSynthesisDraft !== null
    );
  const clarification = clarificationFor(
    effectiveQuestion,
    ambiguousPaperReference,
    historyBoundaryMapAmbiguity,
    explicitPaperSlugs,
    explicitConceptIds,
    focusedConceptIds,
    contextBase,
    synthesisIntent,
  );
  const synthesisProblem = synthesisIntent
    ? priorSynthesisDraft?.problemStatement ??
      contextBase.lastSynthesisProblem?.problemStatement ??
      effectiveQuestion.slice(0, 800)
    : null;
  const synthesisRetrievalQuestion =
    synthesisIntent && contextBase.lastSynthesisProblem
      ? `${effectiveQuestion}\nActive design problem: ${contextBase.lastSynthesisProblem.problemStatement}`
      : effectiveQuestion;
  return {
    request,
    catalog,
    validatedState,
    effectiveQuestion,
    retrievalQuestion: contextualRetrievalQuestion(
      synthesisRetrievalQuestion,
      retrievalPaperSlugs,
      focusedConceptIds,
      catalog,
    ),
    explicitPaperSlugs,
    focusedPaperSlugs,
    restrictedPaperSlugs,
    focusedConceptIds,
    requestedConceptKinds: requestedKinds,
    queryMode,
    corpusQuery,
    includeDiagram,
    diagramMode,
    preferDeterministicPaperMap,
    preferDeterministicComparativeMap,
    answerMode,
    intent,
    synthesisProblem,
    synthesisDisplayProblem: synthesisProblem
      ? normalizeSynthesisProblemDisplay(synthesisProblem)
      : null,
    synthesisDomain: synthesisIntent
      ? inferredSynthesisDomain(
          effectiveQuestion,
          priorSynthesisDraft ?? contextBase.lastSynthesisProblem ?? null,
        )
      : null,
    priorSynthesisDraft,
    clarification,
    turnPlan: {
      effectiveQuestion,
      focusedPaperSlugs: [...focusedPaperSlugs],
      requestedConceptKinds: [...requestedKinds],
      diagramPreference,
      includeDiagram,
      diagramMode,
      queryMode,
      activeDraftRefinement,
      categoryStoredMapFollowUp,
      historyContextTruncated,
    },
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
  requestedKinds: readonly NativeOkfRequestedConceptKind[],
  retrieval: RetrievalResult,
): string[] {
  const requested = new Set(requestedKinds);
  const concepts = requested.size > 0
    ? retrieval.finalConcepts.filter((concept) =>
        requested.has(conceptKind(concept.type) as NativeOkfRequestedConceptKind)
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
  latestValidatedSynthesisDraft: SynthesisDraftState | null =
    prepared.validatedState.latestValidatedSynthesisDraft ?? null,
): NativeOkfConversationState {
  const explicitTopic =
    prepared.explicitPaperSlugs.length > 0 &&
    !EXCLUDE_PAPER_PATTERN.test(prepared.effectiveQuestion);
  const authoritativeFocusedTurn =
    prepared.focusedPaperSlugs.length > 0 &&
    [
      "PAPER_QA",
      "MULTI_PAPER_QA",
      "STORED_PAPER_DIAGRAM",
      "COMPARATIVE_EVIDENCE_DIAGRAM",
    ].includes(prepared.turnPlan.queryMode);
  const papers = prepared.restrictedPaperSlugs.length > 0
    ? prepared.restrictedPaperSlugs
    : explicitTopic || authoritativeFocusedTurn
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
      ...relevantConceptIds(prepared.requestedConceptKinds, retrieval),
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
    lastSynthesisProblem: prepared.intent === "synthesized-flow"
      ? {
          version: 1,
          problemStatement: prepared.synthesisProblem ??
            prepared.effectiveQuestion.slice(0, 800),
          displayProblem: prepared.synthesisDisplayProblem ??
            normalizeSynthesisProblemDisplay(
              prepared.synthesisProblem ?? prepared.effectiveQuestion,
            ),
          domain: prepared.synthesisDomain,
          objective: prepared.priorSynthesisDraft?.objective ??
            prepared.validatedState.lastSynthesisProblem?.objective ?? null,
          outputType: "design-solution",
          constraints: uniqueBounded(
            [
              ...(prepared.priorSynthesisDraft?.constraints ??
                prepared.validatedState.lastSynthesisProblem?.constraints ?? []),
              ...(SYNTHESIS_REFINEMENT_PATTERN.test(prepared.effectiveQuestion)
                ? [prepared.effectiveQuestion.slice(0, 200)]
                : []),
            ],
            6,
          ),
          sourcePaperSlugs: prepared.restrictedPaperSlugs,
        }
      : prepared.validatedState.lastSynthesisProblem,
    latestValidatedSynthesisDraft,
    synthesisDraft: null,
  };
}
