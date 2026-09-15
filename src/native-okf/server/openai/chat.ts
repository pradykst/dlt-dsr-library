import "server-only";

import type { Response } from "openai/resources/responses/responses";

import {
  normalizeNativeOkfChatScope,
  MAX_NATIVE_OKF_MODEL_HISTORY_MESSAGE_CHARACTERS,
  MAX_NATIVE_OKF_MODEL_HISTORY_MESSAGES,
  MAX_NATIVE_OKF_PENDING_QUESTION_CHARACTERS,
  MAX_NATIVE_OKF_SYNTHESIS_CLARIFICATION_ROUNDS,
  type GeneratedDiagram,
  type NativeOkfChatHistoryMessage,
  type NativeOkfChatRequest,
  type NativeOkfChatResponse,
  type NativeOkfChatScope,
  type NativeOkfDiagramMode,
  type NativeOkfSafeDiagnosticCode,
  type SynthesisDraftState,
} from "../../shared/chat-types.ts";
import { sanitizeGeneratedProse } from "../../shared/generated-prose.ts";
import { parseNativeOkfConversationState } from "../../shared/conversation-state.ts";
import type {
  NativeOkfConversationCatalog,
  PreparedNativeOkfChatRequest,
} from "../conversation.ts";
import {
  NATIVE_OKF_LIVE_DATA_BOUNDARY_RESPONSE,
} from "../live-data-gate.ts";
import {
  NATIVE_OKF_LIBRARY_SCOPE_BOUNDARY_RESPONSE,
} from "../scope-guard.ts";
import {
  assembleCompletePapersContext,
  nativeOkfRequestedKindForType,
  retrieveOkfContext,
} from "../retrieval.ts";
import type { RetrievalResult } from "../retrieval-types.ts";
import {
  assembleNativeOkfContextualRetrieval,
  hardNativeOkfConceptKinds,
  clarificationConversationState,
  completedConversationState,
  hasSufficientNativeOkfSynthesisGrounding,
  nativeOkfSynthesisClarificationState,
  nativeOkfSynthesisRequiresRpfPath,
  prepareNativeOkfChatRequest,
} from "../conversation.ts";
import { synthesisGrammarDiagnostics } from "./synthesis-grammar.ts";
import { deriveNativeOkfSynthesisClarification } from "./synthesis-clarification.ts";
import {
  type NativeOpenAiClient,
  getOpenAiClient,
} from "./client.ts";
import {
  buildNativeOkfGroundedContext,
  buildNativeOkfModelInput,
  type NativeOkfGroundedContext,
} from "./context.ts";
import { validateAnswerCitations } from "./citations.ts";
import {
  buildNativeOkfDiagramGrounding,
  type NativeOkfDiagramGrounding,
} from "./diagram-grounding.ts";
import {
  NATIVE_OKF_INTERNAL_SOURCE_REQUEST_ERROR,
  validateNativeOkfAnswerPolicy,
} from "./answer-policy.ts";
import {
  type NativeOpenAiEnvironment,
  readOpenAiEnvironment,
} from "./env.ts";
import {
  AiProviderUnavailableError,
  ModelOutputInvalidError,
  NativeOkfRequestError,
  normalizeOpenAiError,
  OpenAiRefusalError,
} from "./errors.ts";
import { moderateNativeOkfText } from "./moderation.ts";
import {
  NATIVE_OKF_ACTIVE_DIAGRAM_QA_INSTRUCTION,
  NATIVE_OKF_CITATION_REPAIR_INSTRUCTION,
  NATIVE_OKF_COMPARISON_ANSWER_INSTRUCTION,
  NATIVE_OKF_DIAGRAM_TEXT_ANSWER_INSTRUCTION,
  NATIVE_OKF_DETAILED_ANSWER_INSTRUCTION,
  NATIVE_OKF_SYSTEM_PROMPT,
  NATIVE_OKF_NORMAL_ANSWER_INSTRUCTION,
  NATIVE_OKF_PRESENTATION_REPAIR_INSTRUCTION,
  NATIVE_OKF_SYNTHESIS_OUTLINE_INSTRUCTION,
  NATIVE_OKF_TEXT_ONLY_ANSWER_INSTRUCTION,
} from "./prompts.ts";
import {
  buildGroundedStoredSourceMap,
  buildStoredPaperDesignMap,
  storedPaperMapPresentation,
} from "./stored-source-map.ts";

export const MAX_NATIVE_OKF_QUESTION_CHARACTERS = 2_000;
export const MAX_NATIVE_OKF_HISTORY_MESSAGES =
  MAX_NATIVE_OKF_MODEL_HISTORY_MESSAGES;
export const MAX_NATIVE_OKF_HISTORY_MESSAGE_CHARACTERS =
  MAX_NATIVE_OKF_MODEL_HISTORY_MESSAGE_CHARACTERS;
/** Hard transport guard; valid compact history plus a maximum proposal stays below it. */
export const MAX_NATIVE_OKF_REQUEST_BYTES = 96_000;

const MIN_MEANINGFUL_QUESTION_CHARACTERS = 3;
const ALLOWED_REQUEST_KEYS = new Set([
  "question",
  "history",
  "scope",
  "diagramPreference",
  "visibleHistoryMessageCount",
  "includeDiagram",
  "conversationState",
]);
function validateChatScope(value: unknown): NativeOkfChatScope {
  const scope = normalizeNativeOkfChatScope(value);
  if (!scope) throw new NativeOkfRequestError("Select between 1 and 5 valid, unique paper IDs, or All papers.");
  return scope;
}
const ALLOWED_HISTORY_KEYS = new Set(["role", "content"]);

export interface NativeOkfDiagramGenerationResult {
  diagram?: GeneratedDiagram;
  warnings: string[];
  usedSupportConceptIds?: string[];
  deterministicSummary?: string;
  diagnosticCode?: NativeOkfSafeDiagnosticCode;
}

export type NativeOkfDiagramGenerator = (input: {
  client: NativeOpenAiClient;
  environment: NativeOpenAiEnvironment;
  context: NativeOkfGroundedContext;
  question: string;
  answerMarkdown: string;
  mode: Exclude<NativeOkfDiagramMode, "comparative">;
  grounding: NativeOkfDiagramGrounding;
  priorDraft: SynthesisDraftState | null;
  requireRpfPath: boolean;
  synthesisProblem: string | null;
  synthesisDomain: string | null;
}) => Promise<NativeOkfDiagramGenerationResult>;

export interface NativeOkfChatDependencies {
  retrieve?: (question: string) => Promise<RetrievalResult>;
  conversationCatalog?: NativeOkfConversationCatalog;
  prepared?: PreparedNativeOkfChatRequest;
  environment?: NativeOpenAiEnvironment;
  client?: NativeOpenAiClient;
  generateDiagram?: NativeOkfDiagramGenerator;
  buildStoredPaperMap?: (
    paperConceptId: string,
    requestedKinds?: readonly import("../retrieval.ts").NativeOkfRequestedConceptKind[],
  ) => Promise<GeneratedDiagram | undefined>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Removes null bytes and unsupported controls while retaining newlines and tabs. */
export function sanitizeNativeOkfChatText(value: string): string {
  return value
    .replace(/\u0000/gu, "")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/gu, "")
    .replace(/\r\n?/gu, "\n")
    .trim();
}

function validateKnownKeys(
  value: Record<string, unknown>,
  allowed: ReadonlySet<string>,
  label: string,
): void {
  const unknown = Object.keys(value).filter((key) => !allowed.has(key));
  if (unknown.length > 0) {
    throw new NativeOkfRequestError(
      `${label} contains unsupported fields: ${unknown.join(", ")}.`,
    );
  }
}

function validateHistoryMessage(value: unknown): NativeOkfChatHistoryMessage {
  if (!isRecord(value)) {
    throw new NativeOkfRequestError("Each history item must be an object.");
  }
  validateKnownKeys(value, ALLOWED_HISTORY_KEYS, "A history item");
  if (value.role !== "user" && value.role !== "assistant") {
    throw new NativeOkfRequestError(
      "History roles must be either user or assistant.",
    );
  }
  if (typeof value.content !== "string") {
    throw new NativeOkfRequestError("History content must be a string.");
  }
  const content = sanitizeNativeOkfChatText(value.content);
  if (content === "") {
    throw new NativeOkfRequestError("History content must not be empty.");
  }
  if (content.length > MAX_NATIVE_OKF_HISTORY_MESSAGE_CHARACTERS) {
    throw new NativeOkfRequestError(
      `History messages must not exceed ${MAX_NATIVE_OKF_HISTORY_MESSAGE_CHARACTERS} characters.`,
    );
  }
  return { role: value.role, content };
}

export function validateNativeOkfChatRequest(input: unknown): NativeOkfChatRequest {
  if (!isRecord(input)) {
    throw new NativeOkfRequestError("The request body must be an object.");
  }
  validateKnownKeys(input, ALLOWED_REQUEST_KEYS, "The request");
  if (typeof input.question !== "string") {
    throw new NativeOkfRequestError("Question must be a string.");
  }

  const question = sanitizeNativeOkfChatText(input.question);
  const meaningfulCharacters = question.match(/[\p{L}\p{N}]/gu)?.length ?? 0;
  if (meaningfulCharacters < MIN_MEANINGFUL_QUESTION_CHARACTERS) {
    throw new NativeOkfRequestError("Question is too short to search the library.");
  }
  if (question.length > MAX_NATIVE_OKF_QUESTION_CHARACTERS) {
    throw new NativeOkfRequestError(
      `Question must not exceed ${MAX_NATIVE_OKF_QUESTION_CHARACTERS} characters.`,
    );
  }

  if (input.history !== undefined && !Array.isArray(input.history)) {
    throw new NativeOkfRequestError("History must be an array.");
  }
  const recentHistory = (input.history ?? [])
    .map(validateHistoryMessage)
    .slice(-MAX_NATIVE_OKF_HISTORY_MESSAGES);

  const scope = input.scope === undefined
    ? undefined
    : validateChatScope(input.scope);

  if (input.includeDiagram !== undefined && typeof input.includeDiagram !== "boolean") {
    throw new NativeOkfRequestError("includeDiagram must be a boolean.");
  }
  if (
    input.diagramPreference !== undefined &&
    input.diagramPreference !== "auto" &&
    input.diagramPreference !== "requested" &&
    input.diagramPreference !== "suppressed"
  ) {
    throw new NativeOkfRequestError(
      "diagramPreference must be auto, requested, or suppressed.",
    );
  }
  if (
    input.visibleHistoryMessageCount !== undefined &&
    (!Number.isInteger(input.visibleHistoryMessageCount) ||
      (input.visibleHistoryMessageCount as number) < 0 ||
      (input.visibleHistoryMessageCount as number) > 10_000)
  ) {
    throw new NativeOkfRequestError(
      "visibleHistoryMessageCount must be an integer between 0 and 10000.",
    );
  }

  let conversationState;
  if (input.conversationState !== undefined) {
    const parsedState = parseNativeOkfConversationState(
      input.conversationState,
    );
    if (!parsedState) {
      throw new NativeOkfRequestError(
        "Conversation state is invalid or uses an unsupported version.",
      );
    }
    const pendingOriginal =
      parsedState.pendingClarification?.originalQuestion;
    const pendingMatchesHistory = pendingOriginal === undefined ||
      recentHistory.some(
        (message) =>
          message.role === "user" &&
          message.content.slice(
            0,
            MAX_NATIVE_OKF_PENDING_QUESTION_CHARACTERS,
          ) === pendingOriginal,
      );
    conversationState = pendingMatchesHistory
      ? parsedState
      : { ...parsedState, pendingClarification: null };
  }
  return {
    question,
    ...(recentHistory.length > 0 ? { history: recentHistory } : {}),
    ...(scope === undefined ? {} : { scope }),
    ...(input.includeDiagram === undefined
      ? {}
      : { includeDiagram: input.includeDiagram }),
    ...(input.diagramPreference === undefined
      ? {}
      : { diagramPreference: input.diagramPreference }),
    ...(input.visibleHistoryMessageCount === undefined
      ? {}
      : { visibleHistoryMessageCount: input.visibleHistoryMessageCount as number }),
    ...(conversationState === undefined
      ? {}
      : { conversationState }),
  };
}


function responseRefused(response: Response): boolean {
  return response.output.some(
    (item) =>
      item.type === "message" &&
      item.content.some((content) => content.type === "refusal"),
  );
}

export function extractNativeOkfResponseText(response: Response): string {
  if (responseRefused(response)) throw new OpenAiRefusalError();
  // The Responses API reported a structured failure or non-completion in the response
  // body itself (not as a thrown HTTP error) — this is a verified provider-side condition,
  // not a defect in how we parsed a successful response.
  if (response.error || response.status === "failed" || response.status === "cancelled") {
    throw new AiProviderUnavailableError();
  }
  if (response.status === "incomplete" || response.incomplete_details) {
    const reason = response.incomplete_details?.reason;
    throw new ModelOutputInvalidError(
      reason === "max_output_tokens"
        ? "The model's response was cut off before it finished. Try a narrower question or ask for less detail."
        : "The model's response ended before it could be used. Please try again.",
    );
  }
  const answer = response.output_text.trim();
  if (!answer) throw new ModelOutputInvalidError();
  return answer;
}

async function createTextResponse(
  client: NativeOpenAiClient,
  environment: NativeOpenAiEnvironment,
  instructions: string,
  input: ReturnType<typeof buildNativeOkfModelInput>,
  protectedStoredTitles: readonly string[] = [],
): Promise<string> {
  try {
    const response = await client.responses.create({
      model: environment.model,
      instructions,
      input,
      reasoning: { effort: environment.reasoningEffort },
      max_output_tokens: environment.maxOutputTokens,
      store: false,
      tools: [],
      tool_choice: "none",
      parallel_tool_calls: false,
      text: { verbosity: "medium" },
    });
    return sanitizeGeneratedProse(
      extractNativeOkfResponseText(response),
      protectedStoredTitles,
    );
  } catch (error) {
    throw normalizeOpenAiError(error);
  }
}

function escapePromptData(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function developmentRetrievalDebug(retrieval: RetrievalResult): unknown {
  if (process.env.NODE_ENV === "production") return undefined;
  return {
    confidence: retrieval.confidence,
    noMatch: retrieval.noMatch,
    contextCharacterEstimate: retrieval.contextCharacterEstimate,
    seedResults: retrieval.seedResults,
    expandedResults: retrieval.expandedResults,
    debug: retrieval.debug,
  };
}

async function defaultDiagramGenerator(
  input: Parameters<NativeOkfDiagramGenerator>[0],
): Promise<NativeOkfDiagramGenerationResult> {
  const { generateNativeOkfDiagram } = await import("./diagram.ts");
  return generateNativeOkfDiagram(input);
}

const INSUFFICIENT_CONTEXT_ANSWER =
  "The native OKF retrieval did not find enough supported library context to answer this question. Try naming a paper, concept, mechanism, or design-knowledge topic represented in the library.";
function answerModeInstruction(
  mode: PreparedNativeOkfChatRequest["answerMode"],
): string {
  if (mode === "comparison") {
    return NATIVE_OKF_COMPARISON_ANSWER_INSTRUCTION;
  }
  if (mode === "detailed") {
    return NATIVE_OKF_DETAILED_ANSWER_INSTRUCTION;
  }
  return NATIVE_OKF_NORMAL_ANSWER_INSTRUCTION;
}

function nextAvailableSourceId(usedSourceIds: ReadonlySet<string>): string {
  let candidate = 1;
  while (usedSourceIds.has(`S${candidate}`)) candidate += 1;
  return `S${candidate}`;
}

/**
 * Merges source-card groups into one list with globally unique source IDs.
 *
 * The FIRST group is authoritative and is never renumbered: for every call
 * site here, that group is the exact source-card set already validated
 * against the citation context the model was prompted with (see
 * validateAnswerCitations / context.ts), so its IDs are precisely what
 * answerMarkdown's [[S#]] tokens already reference and must not change. Any
 * later group (e.g. a deterministic diagram's own independently-numbered
 * source cards) is deduplicated by conceptId as before, but if a card's own
 * sourceId collides with an ID already used by a *different* concept, it is
 * given a fresh unused ID rather than silently sharing the collided label —
 * this is what previously allowed two independent "S1, S2, ..." numbering
 * schemes to be concatenated and produce duplicate, ambiguous source IDs.
 */
function mergeSourceCards(
  ...groups: ReadonlyArray<NativeOkfChatResponse["sources"]>
): NativeOkfChatResponse["sources"] {
  const merged: NativeOkfChatResponse["sources"] = [];
  const seenConceptIds = new Set<string>();
  const usedSourceIds = new Set<string>();
  for (const source of groups.flat()) {
    if (seenConceptIds.has(source.conceptId)) continue;
    seenConceptIds.add(source.conceptId);
    const sourceId = usedSourceIds.has(source.sourceId)
      ? nextAvailableSourceId(usedSourceIds)
      : source.sourceId;
    usedSourceIds.add(sourceId);
    merged.push(sourceId === source.sourceId ? source : { ...source, sourceId });
  }
  return merged;
}

const SAFE_PRESENTATION_ERROR =
  "The answer could not be presented safely. The validated retrieved source cards remain available below.";
const SAFE_INTERNAL_GROUNDING_FAILURE =
  "The relevant library records could not be assembled for this request.";

function safeAnswerPolicyFailure(errors: readonly string[]): string {
  return errors.includes(NATIVE_OKF_INTERNAL_SOURCE_REQUEST_ERROR)
    ? SAFE_INTERNAL_GROUNDING_FAILURE
    : SAFE_PRESENTATION_ERROR;
}

function synthesisDraftFromDiagram(
  prepared: PreparedNativeOkfChatRequest,
  diagram: GeneratedDiagram,
): SynthesisDraftState {
  return {
    version: 1,
    problemStatement:
      prepared.synthesisProblem ??
      prepared.effectiveQuestion.slice(0, 800),
    domain:
      prepared.synthesisDomain ??
      prepared.priorSynthesisDraft?.domain ??
      null,
    objective: prepared.priorSynthesisDraft?.objective ?? null,
    constraints: prepared.priorSynthesisDraft?.constraints ?? [],
    nodes: diagram.nodes,
    edges: diagram.edges,
  };
}

function proposalDiagramFromDraft(draft: SynthesisDraftState): GeneratedDiagram {
  return {
    title: "Design proposal",
    explanation:
      "This diagram translates the current design proposal into a decision-support flow. Every node is a proposed design concept grounded in cited stored native OKF evidence; primary design-flow relationships and secondary dependencies are shown distinctly.",
    nodes: draft.nodes,
    edges: draft.edges,
  };
}

function proposalStageHeading(stage: GeneratedDiagram["nodes"][number]["stage"]): string {
  return stage
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const MAX_NARRATIVE_HIGHLIGHT_BULLETS = 6;
const MAX_NARRATIVE_BULLET_DESCRIPTION_CHARS = 160;
/** Preference order for which stage's nodes best explain the proposal's rationale —
 *  principles generalize the "how" a requirement is addressed, so they lead when present. */
const NARRATIVE_HIGHLIGHT_STAGE_PREFERENCE: readonly GeneratedDiagram["nodes"][number]["stage"][] = [
  "design-principle",
  "design-requirement",
  "meta-requirement",
  "design-goal",
  "design-objective",
  "design-feature",
  "artifact",
  "evaluation",
  "outcome",
];

function firstSentence(text: string, maxChars: number): string {
  const trimmed = text.trim();
  const sentenceEndMatch = /[.!?](?:\s|$)/u.exec(trimmed);
  const candidate = sentenceEndMatch
    ? trimmed.slice(0, sentenceEndMatch.index + 1)
    : trimmed;
  return candidate.length > maxChars
    ? `${candidate.slice(0, maxChars).trimEnd()}…`
    : candidate;
}

function pluralStageLabel(
  stage: GeneratedDiagram["nodes"][number]["stage"],
  count: number,
): string {
  const heading = proposalStageHeading(stage);
  return count === 1 ? heading : `${heading}s`;
}

/** Small-number words, so the summary lead-in reads as prose rather than a tally. */
const SMALL_NUMBER_WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
  "nine", "ten",
] as const;

function numberWord(value: number): string {
  return SMALL_NUMBER_WORDS[value] ?? String(value);
}

/**
 * The problem label as it reads inside a sentence. Only a plainly capitalized
 * opening word is lowered, so an acronym or a proper noun keeps its casing.
 */
function problemPhrase(diagram: GeneratedDiagram): string {
  const label = diagram.nodes.find((node) => node.stage === "problem")?.label ?? "";
  if (label === "") return "the research problem";
  return /^[A-Z][a-z]/u.test(label)
    ? label[0]!.toLocaleLowerCase("en") + label.slice(1)
    : label;
}

/**
 * Concise deterministic prose alongside the same validated proposal graph.
 *
 * Deliberately does not restate every node under every stage — the diagram already
 * shows that in full. This surfaces a short introduction, a handful of the most
 * explanatory nodes (never every node), and one sentence distinguishing stored from
 * synthesized content.
 */
function designProposalNarrative(
  diagram: GeneratedDiagram,
  sources: NativeOkfChatResponse["sources"],
  refined: boolean,
): string {
  const sourceIdByConceptId = new Map(
    sources.map((source) => [source.conceptId, source.sourceId]),
  );
  const proposalNodes = diagram.nodes.filter((node) => node.stage !== "problem");

  // The introduction states the PROBLEM the proposal addresses, never the
  // proposed artifact: the problem node carries the problem label, and problem
  // space and solution space stay distinct in the prose as well as the graph.
  const introduction = refined
    ? "This refinement updates the existing design proposal while preserving all unmentioned elements."
    : `This design proposal addresses ${problemPhrase(diagram)}.`;

  const highlightStage = NARRATIVE_HIGHLIGHT_STAGE_PREFERENCE.find((stage) =>
    proposalNodes.some((node) => node.stage === stage)
  );
  const highlightNodes = highlightStage
    ? proposalNodes.filter((node) => node.stage === highlightStage)
    : [];
  const shownNodes = highlightNodes.slice(0, MAX_NARRATIVE_HIGHLIGHT_BULLETS);
  // Only one concept layer is summarized below, so the lead-in names exactly
  // that layer instead of claiming every design concept is listed.
  const highlightLead = highlightStage && shownNodes.length > 0
    ? `The proposal is organized around ${
      numberWord(highlightNodes.length)
    } ${
      pluralStageLabel(highlightStage, highlightNodes.length)
        .toLocaleLowerCase("en")
    }${
      shownNodes.length === highlightNodes.length
        ? ""
        : `, ${numberWord(shownNodes.length)} of which are summarized here`
    }:`
    : null;
  const bullets = shownNodes
    .map((node) => {
      const citations = [...new Set(
        node.supportConceptIds.flatMap((conceptId) => {
          const sourceId = sourceIdByConceptId.get(conceptId);
          return sourceId ? [`[[${sourceId}]]`] : [];
        }),
      )].join(" ");
      const description = firstSentence(
        node.description,
        MAX_NARRATIVE_BULLET_DESCRIPTION_CHARS,
      );
      return `- **${node.label}:** ${description}${citations ? ` ${citations}` : ""}`;
    });

  const stageCounts = [...new Set(proposalNodes.map((node) => node.stage))]
    .map((stage) => {
      const count = proposalNodes.filter((node) => node.stage === stage).length;
      return `${count} ${pluralStageLabel(stage, count).toLocaleLowerCase("en")}`;
    })
    .join(", ");
  const proposedCount = proposalNodes.filter(
    (node) => node.provenance === "synthesized",
  ).length;
  const groundingConceptCount = new Set(
    proposalNodes.flatMap((node) => node.supportConceptIds),
  ).size;
  const provenanceSentence = proposedCount > 0
    ? `This problem-specific proposal contains ${proposedCount} proposed design concept${
        proposedCount === 1 ? "" : "s"
      } (${stageCounts})${
        groundingConceptCount > 0
          ? `, grounded in ${groundingConceptCount} stored native OKF concept${
              groundingConceptCount === 1 ? "" : "s"
            }`
          : ""
      }. The stored concepts are cited as evidence, not reproduced as diagram nodes.`
    : `The diagram below shows ${stageCounts}, drawn directly from stored knowledge.`;

  return [
    introduction,
    ...(highlightLead ? [highlightLead] : []),
    ...(bullets.length > 0 ? [bullets.join("\n")] : []),
    provenanceSentence,
  ].join("\n\n");
}

function sourceCardsForConceptIds(
  context: NativeOkfGroundedContext,
  conceptIds: readonly string[],
): NativeOkfChatResponse["sources"] {
  const byConceptId = new Map(
    context.sources.map((source) => [source.conceptId, source.card]),
  );
  return [...new Set(conceptIds)]
    .flatMap((conceptId) => {
      const card = byConceptId.get(conceptId);
      return card ? [card] : [];
    });
}

const TECHNICAL_CONTEXT_WARNINGS = new Set([
  "One or more Markdown bodies were truncated to fit the context limit.",
  "One or more concepts were omitted because the context limit was exhausted.",
]);

const ACTIONABLE_REQUESTED_CONTEXT_WARNING =
  "Some directly requested stored records could not fit within the bounded answer context; narrow the paper or concept category and try again.";

function directlyRequestedConceptIds(
  prepared: PreparedNativeOkfChatRequest,
): string[] {
  const paperSlugs = prepared.explicitPaperSlugs.length > 0
    ? prepared.explicitPaperSlugs
    : prepared.restrictedPaperSlugs;
  if (
    paperSlugs.length === 0 ||
    prepared.requestedConceptKinds.length === 0
  ) {
    return [];
  }
  const allowedPapers = new Set(paperSlugs);
  const requestedKinds = new Set(prepared.requestedConceptKinds);
  return prepared.catalog.concepts
    .filter((concept) => {
      const kind = nativeOkfRequestedKindForType(concept.type);
      return (
        concept.paperSlug !== undefined &&
        allowedPapers.has(concept.paperSlug) &&
        kind !== null &&
        requestedKinds.has(kind)
      );
    })
    .map((concept) => concept.conceptId);
}

function directlyScopedEvidenceIds(
  prepared: PreparedNativeOkfChatRequest,
  requestedConceptIds: readonly string[],
): string[] {
  if (hardNativeOkfConceptKinds(prepared).length > 0) return [...requestedConceptIds];
  const paperSlugs = prepared.explicitPaperSlugs.length > 0
    ? prepared.explicitPaperSlugs
    : prepared.restrictedPaperSlugs;
  const allowedPapers = new Set(paperSlugs);
  return [...new Set([
    ...prepared.catalog.papers
      .filter((paper) => allowedPapers.has(paper.slug))
      .map((paper) => paper.conceptId),
    ...requestedConceptIds,
  ])];
}

export function userFacingRetrievalWarnings(
  retrieval: RetrievalResult,
  requestedConceptIds: readonly string[],
  retainedConceptIds: ReadonlySet<string> = new Set(
    retrieval.finalConcepts.map((concept) => concept.conceptId),
  ),
): string[] {
  const missingRequestedSources = requestedConceptIds.filter(
    (conceptId) => !retainedConceptIds.has(conceptId),
  );
  const technicalWarnings = retrieval.warnings.filter((warning) =>
    TECHNICAL_CONTEXT_WARNINGS.has(warning)
  );
  const userFacing = retrieval.warnings.filter(
    (warning) => !TECHNICAL_CONTEXT_WARNINGS.has(warning),
  );
  if (technicalWarnings.length === 0) return userFacing;
  if (missingRequestedSources.length > 0) {
    return [...userFacing, ACTIONABLE_REQUESTED_CONTEXT_WARNING];
  }
  return userFacing;
}

function deterministicSynthesisFailureSummary(hasEvidenceMap: boolean): string {
  return hasEvidenceMap
    ? "A validated synthesized flow could not be produced. The diagram below is a deterministic supporting evidence map, not the requested synthesized flow. Its solid nodes and relationships come from current-turn retrieved native OKF knowledge; no failed or unvalidated synthesis content is displayed."
    : "A validated synthesized flow could not be produced from the current-turn native OKF evidence. No failed or unvalidated synthesis content is displayed. Refine the problem or constraints and try the synthesis request again.";
}

function assertResolvedTurnPlan(prepared: PreparedNativeOkfChatRequest): void {
  const plan = prepared.turnPlan;
  if (
    plan.effectiveQuestion !== prepared.effectiveQuestion ||
    plan.includeDiagram !== prepared.includeDiagram ||
    plan.diagramMode !== prepared.diagramMode ||
    plan.queryMode !== prepared.queryMode ||
    plan.diagramConceptKinds.join(",") !== prepared.diagramConceptKinds.join(",") ||
    (plan.mode === "STORED_FULL_MAP" && plan.diagramConceptKinds.length > 0) ||
    (plan.mode === "STORED_FILTERED_MAP" && plan.diagramConceptKinds.length === 0) ||
    plan.focusedPaperSlugs.join("\u0000") !==
      prepared.focusedPaperSlugs.join("\u0000") ||
    plan.requestedConceptKinds.join("\u0000") !==
      prepared.requestedConceptKinds.join("\u0000") ||
    plan.resolvedPaperSlugs.join("\u0000") !==
      plan.focusedPaperSlugs.join("\u0000") ||
    plan.resolvedPaperSlug !==
      (plan.resolvedPaperSlugs.length === 1 ? plan.resolvedPaperSlugs[0]! : null) ||
    (["STORED_FULL_MAP", "STORED_FILTERED_MAP"].includes(plan.mode) &&
      (plan.resolvedPaperSlug === null || plan.diagramMode !== "stored")) ||
    (plan.mode === "STORED_COMPARISON" && (plan.includeDiagram || plan.diagramMode !== null)) ||
    (plan.mode === "DESIGN_REFINEMENT" && !plan.refinementIntent) ||
    (plan.mode === "ACTIVE_DIAGRAM_QA" && plan.diagramAction !== "NONE") ||
    (plan.diagramAction === "NONE" && plan.includeDiagram) ||
    (plan.diagramAction !== "NONE" && !plan.includeDiagram)
  ) {
    throw new Error("Native OKF resolved turn plan is inconsistent.");
  }
}

/**
 * Every response's sources must carry globally unique source IDs — the model's
 * [[S#]] citations and any deterministic diagram's own source cards are merged
 * by mergeSourceCards, which is the single place that must never let two
 * independently-numbered "S1, S2, ..." schemes collide. This is a defense-in-
 * depth check on the final response, and it FAILS CLOSED in every environment,
 * production included: a response whose [[S#]] citations cannot each resolve to
 * exactly one source card is ambiguous evidence attribution, and serving it
 * would silently mis-cite. The throw is caught by the route layer
 * (handlePublicNativeOkfChat → publicNativeOkfChatError) and returned as a
 * handled error, so an ambiguous response is never successfully serialized to a
 * client. Production additionally logs first, for observability.
 */
export function assertUniqueSourceIds(response: NativeOkfChatResponse): void {
  const sourceIds = response.sources.map((source) => source.sourceId);
  if (new Set(sourceIds).size === sourceIds.length) return;
  const message =
    `Native OKF response contains duplicate source IDs: ${sourceIds.join(", ")}`;
  if (process.env.NODE_ENV === "production") {
    console.error(message);
  }
  throw new Error(message);
}

/** Final serialization boundary: exactly one canonical paper or a new proposal. */
export async function assertNativeOkfResponseBoundary(
  prepared: PreparedNativeOkfChatRequest,
  response: NativeOkfChatResponse,
): Promise<void> {
  const fail = (): never => { throw new NativeOkfRequestError("The response could not be verified within the selected papers and concept kinds. Please try again."); };
  const allowedPapers = new Set(prepared.scopePaperSlugs);
  const kinds = hardNativeOkfConceptKinds(prepared);
  if (allowedPapers.size > 0 || kinds.length > 0) {
    const canonical = new Map(prepared.catalog.concepts.map((concept) => [concept.conceptId, concept]));
    const accepts = (id: string, fallbackType?: string): boolean => {
      const concept = canonical.get(id);
      if (allowedPapers.size > 0 && (!concept?.paperSlug || !allowedPapers.has(concept.paperSlug))) return false;
      return kinds.length === 0 || kinds.includes(nativeOkfRequestedKindForType(concept?.type ?? fallbackType ?? "")!);
    };
    if (response.sources.some((source) => !accepts(source.conceptId, source.type)) ||
      [...(response.diagram?.nodes ?? []), ...(response.diagram?.edges ?? [])]
        .some((item) => item.supportConceptIds.some((id) => !accepts(id)))) {
      throw new NativeOkfRequestError("The response could not be verified within the selected papers and concept kinds. Please try again.");
    }
  }
  if (prepared.turnPlan.mode === "STORED_COMPARISON" && response.diagram) fail();
  if (!response.diagram || allowedPapers.size === 0) return;
  const diagram = response.diagram;
  const canonical = new Map(prepared.catalog.concepts.map((concept) => [concept.conceptId, concept]));
  if (diagram.nodes.some((node) => node.sourcePaths.some((id) => {
    const owner = canonical.get(id)?.paperSlug;
    return !owner || !allowedPapers.has(owner);
  }))) fail();
  if (response.diagramMode === "synthesized") {
    if (!["DESIGN_SYNTHESIS", "DESIGN_REFINEMENT"].includes(prepared.turnPlan.mode) ||
      synthesisGrammarDiagnostics(diagram, { requireFullProposal: true }).length > 0) fail();
    return;
  }
  if (response.diagramMode !== "stored" ||
    !["STORED_FULL_MAP", "STORED_FILTERED_MAP"].includes(prepared.turnPlan.mode) ||
    prepared.focusedPaperSlugs.length !== 1 || !allowedPapers.has(prepared.focusedPaperSlugs[0]!)) fail();
  const paper = prepared.catalog.papers.find((item) => item.slug === prepared.focusedPaperSlugs[0]);
  if (!paper) return fail();
  const expected = await buildStoredPaperDesignMap(paper.conceptId, kinds.length ? kinds : prepared.turnPlan.diagramConceptKinds);
  if (!expected) return fail();
  const topology = (map: GeneratedDiagram) => JSON.stringify({
    nodes: map.nodes.map((node) => [node.id, node.provenance, [...node.supportConceptIds].sort(), [...node.sourcePaths].sort()]).sort(),
    edges: map.edges.map((edge) => [edge.source, edge.target, edge.label, edge.provenance, [...edge.supportConceptIds].sort()]).sort(),
  });
  if (topology(diagram) !== topology(expected)) fail();
}

export async function answerNativeOkfChat(
  input: unknown,
  dependencies: NativeOkfChatDependencies = {},
): Promise<NativeOkfChatResponse> {
  const prepared = dependencies.prepared ??
    (await prepareNativeOkfChatRequest(
      validateNativeOkfChatRequest(input),
      dependencies.conversationCatalog,
    ));
  const response = await answerNativeOkfChatUnchecked(input, {
    ...dependencies,
    prepared,
  });
  assertUniqueSourceIds(response);
  await assertNativeOkfResponseBoundary(prepared, response);
  const warnings = response.warnings ?? [];
  // Echo the resolved boundary on every response, including clarification and no evidence.
  return {
    ...response,
    scope: prepared.resolvedScope,
    ...(prepared.scopeWarning && !warnings.includes(prepared.scopeWarning)
      ? { warnings: [prepared.scopeWarning, ...warnings] }
      : {}),
  };
}

async function answerNativeOkfChatUnchecked(
  input: unknown,
  dependencies: NativeOkfChatDependencies = {},
): Promise<NativeOkfChatResponse> {
  const request = validateNativeOkfChatRequest(input);
  const prepared =
    dependencies.prepared ??
    (await prepareNativeOkfChatRequest(
      request,
      dependencies.conversationCatalog,
    ));
  assertResolvedTurnPlan(prepared);

  if (prepared.clarification) {
    return {
      kind: "clarification",
      presentationMode: "clarification",
      answerMarkdown: prepared.clarification.question,
      sources: [],
      insufficientContext: false,
      clarification: prepared.clarification,
      conversationState: clarificationConversationState(prepared),
      diagramMode: null,
      diagramStatus: null,
    };
  }

  if (prepared.turnPlan.mode === "SCOPE_GUARDRAIL") {
    return {
      kind: "answer",
      presentationMode: "no-match",
      answerMarkdown: prepared.turnPlan.scopeGuardrail === "out-of-scope"
        ? NATIVE_OKF_LIBRARY_SCOPE_BOUNDARY_RESPONSE
        : NATIVE_OKF_LIVE_DATA_BOUNDARY_RESPONSE,
      sources: [],
      insufficientContext: false,
      diagramMode: null,
      diagramStatus: null,
      conversationState: {
        ...prepared.validatedState,
        scope: prepared.turnPlan.scope,
        lastIntent: "answer",
        lastDiagramRequested: false,
        pendingClarification: null,
        synthesisClarificationRounds: 0,
      },
    };
  }

  const turnPlan = prepared.turnPlan;
  const includeDiagram = turnPlan.includeDiagram;
  const hardKinds = hardNativeOkfConceptKinds(prepared);
  const paperBySlug = new Map(prepared.catalog.papers.map((paper) => [paper.slug, paper.conceptId]));
  const scopePaperConceptIds = prepared.scopePaperSlugs.map((slug) => paperBySlug.get(slug)!);
  const rawRetrieval = dependencies.retrieve
    ? await dependencies.retrieve(prepared.retrievalQuestion)
    : scopePaperConceptIds.length > 0
      ? await assembleCompletePapersContext(scopePaperConceptIds, prepared.retrievalQuestion)
      : await retrieveOkfContext(prepared.retrievalQuestion, {}, hardKinds);
  const retrieval = await assembleNativeOkfContextualRetrieval(
    prepared,
    rawRetrieval,
  );
  const insufficientSynthesisGrounding =
    prepared.intent === "synthesized-flow" &&
    !hasSufficientNativeOkfSynthesisGrounding(retrieval);
  const retrievalDebug = developmentRetrievalDebug(retrieval);

  if (
    (hardKinds.length > 0 && retrieval.finalConcepts.length === 0) || (![
      "STORED_FULL_MAP",
      "STORED_FILTERED_MAP",
    ].includes(turnPlan.mode) &&
    (
      retrieval.noMatch ||
      retrieval.finalConcepts.length === 0 ||
      insufficientSynthesisGrounding
    ))
  ) {
    return {
      kind: "answer",
      presentationMode: "no-match",
      answerMarkdown: hardKinds.length > 0
        ? "No relevant concepts of the requested kind were found within the current paper scope. Try another topic or change the selected papers."
        : INSUFFICIENT_CONTEXT_ANSWER,
      sources: [],
      insufficientContext: true,
      diagramMode: null,
      diagramStatus: null,
      conversationState: completedConversationState(
        prepared,
        retrieval,
        [],
      ),
      ...(retrievalDebug === undefined ? {} : { retrievalDebug }),
    };
  }

  // For STORED_FULL_MAP / STORED_FILTERED_MAP, the diagram
  // itself is always built deterministically here (zero LLM involvement, guaranteed
  // canonical-complete) and fails closed exactly as before. What changed: on success
  // we no longer substitute the graph's count summary as the entire answer — the turn
  // falls through into the normal grounded-answer pipeline below so the user's actual
  // question gets a real, specific answer, with this deterministic diagram attached
  // (see "earlyDeterministicDiagram" near the diagram-attachment step further down).
  // Text must never be replaced by "here is what the diagram contains."
  let earlyDeterministicDiagram:
    | {
      diagram: GeneratedDiagram;
      sources: NativeOkfChatResponse["sources"];
      mode: "stored";
      summary: string;
    }
    | undefined;

  if (
    turnPlan.mode === "STORED_FULL_MAP" ||
    turnPlan.mode === "STORED_FILTERED_MAP"
  ) {
    const focusedSlug = turnPlan.focusedPaperSlugs[0];
    const focusedPaper = prepared.catalog.papers.find(
      (paper) => paper.slug === focusedSlug,
    );
    let builtDiagram: GeneratedDiagram | undefined;
    if (focusedPaper) {
      try {
        builtDiagram = await (
          dependencies.buildStoredPaperMap ?? buildStoredPaperDesignMap
        )(focusedPaper.conceptId, hardKinds.length ? hardKinds : turnPlan.diagramConceptKinds);
      } catch {
        builtDiagram = undefined;
      }
    }
    if (!builtDiagram) {
      return {
        kind: "answer",
        presentationMode: "safe-error",
        answerMarkdown:
          "The exact stored paper map could not be assembled safely. No model-generated substitute was used.",
        sources: [],
        diagramMode: "stored",
        diagramStatus: "failed",
        diagnosticCode: "stored-map-unavailable",
        insufficientContext: false,
        conversationState: completedConversationState(prepared, retrieval, []),
        ...(retrievalDebug === undefined ? {} : { retrievalDebug }),
      };
    }
    const presentation = await storedPaperMapPresentation(
      focusedPaper!.conceptId,
      builtDiagram,
    );
    earlyDeterministicDiagram = {
      diagram: builtDiagram,
      sources: presentation.sources,
      mode: "stored",
      summary: presentation.summary,
    };
  }

  const expectedRequestedConceptIds = directlyRequestedConceptIds(prepared);
  const expectedScopedEvidenceIds = directlyScopedEvidenceIds(
    prepared,
    expectedRequestedConceptIds,
  );
  const requestedKinds = new Set(turnPlan.requestedConceptKinds);
  const expectedRequestedConceptIdSet = new Set(expectedRequestedConceptIds);
  const activeProposalSupportIds = turnPlan.mode === "ACTIVE_DIAGRAM_QA" &&
      turnPlan.activeProposalDraft
    ? [
        ...turnPlan.activeProposalDraft.nodes.flatMap((node) =>
          node.supportConceptIds
        ),
        ...turnPlan.activeProposalDraft.edges.flatMap((edge) =>
          edge.supportConceptIds
        ),
      ]
    : [];
  const requiredConceptIds = [...new Set([
    ...retrieval.finalConcepts
    .filter((concept) => {
      if (expectedRequestedConceptIds.length > 0) {
        return expectedRequestedConceptIdSet.has(concept.conceptId);
      }
      const kind = nativeOkfRequestedKindForType(concept.type);
      return kind !== null && requestedKinds.has(kind);
    })
    .map((concept) => concept.conceptId),
    ...activeProposalSupportIds,
    // In paper scope the whole paper record is the evidence set: keep every
    // canonical design-knowledge concept protected from context trimming, and
    // require the answer to cite at least one concept from this paper.
    ...(prepared.scopePaperSlugs.length > 0
      ? retrieval.finalConcepts
          .filter(
            (concept) =>
              concept.type !== "paper" && concept.type !== "reference",
          )
          .map((concept) => concept.conceptId)
      : []),
  ])];
  const context = buildNativeOkfGroundedContext(
    retrieval,
    turnPlan.effectiveQuestion,
    requiredConceptIds,
    turnPlan.mode === "ACTIVE_DIAGRAM_QA"
      ? turnPlan.activeProposalDraft
      : null,
  );

  const environment =
    dependencies.environment ?? readOpenAiEnvironment();
  const client =
    dependencies.client ?? getOpenAiClient(environment);
  const priorScope = normalizeNativeOkfChatScope(request.conversationState?.scope);
  const history = JSON.stringify(priorScope) === JSON.stringify(prepared.resolvedScope)
    ? request.history ?? [] : [];
  const userConversation = [
    ...history.map(
      (message) => `${message.role}: ${message.content}`,
    ),
    `user: ${request.question}`,
  ].join("\n");
  await moderateNativeOkfText(
    userConversation,
    environment,
    client,
  );


  if (prepared.intent === "synthesized-flow") {
    const grounding = await buildNativeOkfDiagramGrounding(retrieval);
    let diagramResult: NativeOkfDiagramGenerationResult;
    if (
      prepared.priorSynthesisDraft &&
      includeDiagram &&
      !turnPlan.refinementIntent
    ) {
      diagramResult = {
        diagram: proposalDiagramFromDraft(prepared.priorSynthesisDraft),
        usedSupportConceptIds: [...new Set(
          prepared.priorSynthesisDraft.nodes.flatMap((node) =>
            node.supportConceptIds
          ),
        )],
        warnings: [],
      };
    } else {
      try {
        diagramResult = await (
          dependencies.generateDiagram ?? defaultDiagramGenerator
        )({
          client,
          environment,
          context,
          question: turnPlan.effectiveQuestion,
          answerMarkdown: "",
          mode: "synthesized",
          grounding,
          priorDraft: turnPlan.refinementIntent
            ? prepared.priorSynthesisDraft
            : null,
          // A synthesized-flow diagram turn is a request for a complete design
          // proposal: the mandatory core coverage Problem -> Requirement ->
          // Design Principle -> Design Feature -> Artifact is always enforced.
          // Evaluation and Outcome remain optional and never affect validity.
          requireRpfPath: nativeOkfSynthesisRequiresRpfPath(
            turnPlan.effectiveQuestion,
          ),
          synthesisProblem: prepared.synthesisProblem,
          synthesisDomain: prepared.synthesisDomain,
        });
      } catch (error) {
        // A thrown error here is an infrastructure failure (the plan generator
        // returns a diagnostic code for recoverable validation failures, it does
        // not throw). Keep it truthfully differentiated — an AI provider outage,
        // rate limit, quota, network, or size error must never be presented as a
        // design follow-up question.
        throw normalizeOpenAiError(error);
      }
    }

    if (diagramResult.diagram) {
      await moderateNativeOkfText(
        JSON.stringify(diagramResult.diagram),
        environment,
        client,
      );
      const usedSupportConceptIds = diagramResult.usedSupportConceptIds ??
        [...new Set(
          diagramResult.diagram.nodes.flatMap((node) => node.supportConceptIds),
        )];
      const sourceCards = sourceCardsForConceptIds(
        context,
        usedSupportConceptIds,
      );
      const synthesisDraft = synthesisDraftFromDiagram(
        prepared,
        diagramResult.diagram,
      );
      const deterministicSummary = designProposalNarrative(
        diagramResult.diagram,
        sourceCards,
        turnPlan.refinementIntent,
      );
      return {
        kind: "answer",
        presentationMode: includeDiagram ? "diagram-primary" : "text-primary",
        answerMarkdown: deterministicSummary,
        deterministicSummary,
        sources: sourceCards,
        ...(includeDiagram ? { diagram: diagramResult.diagram } : {}),
        diagramMode: includeDiagram ? "synthesized" : null,
        diagramStatus: includeDiagram ? "success" : null,
        synthesisDraft,
        insufficientContext: false,
        conversationState: completedConversationState(
          prepared,
          retrieval,
          sourceCards,
          synthesisDraft,
        ),
        ...(retrievalDebug === undefined ? {} : { retrievalDebug }),
      };
    }

    // A recoverable synthesis-plan / scholarly-validation failure with enough
    // grounded evidence becomes a conversational follow-up instead of a terminal
    // synthesis error. The failed attempt keeps the researcher's design problem
    // in conversation state so the next turn resumes it; it never establishes a
    // validated draft or active diagram because no valid proposal exists yet.
    if (
      includeDiagram &&
      !diagramResult.diagram &&
      hasSufficientNativeOkfSynthesisGrounding(retrieval)
    ) {
      const priorRounds =
        prepared.validatedState.synthesisClarificationRounds ?? 0;
      const clarificationNeed =
        priorRounds < MAX_NATIVE_OKF_SYNTHESIS_CLARIFICATION_ROUNDS
          ? deriveNativeOkfSynthesisClarification({
              problem:
                prepared.turnPlan.activeDesignProblem ??
                prepared.synthesisProblem ??
                prepared.effectiveQuestion,
              displayProblem: prepared.synthesisDisplayProblem,
              retrieval,
              validationReason: diagramResult.warnings[0] ?? null,
              round: priorRounds,
              priorConstraints:
                prepared.priorSynthesisDraft?.constraints ??
                prepared.validatedState.lastSynthesisProblem?.constraints ??
                [],
            })
          : null;
      if (clarificationNeed) {
        // Safe server-side diagnostic only: correlation is carried by the route
        // layer's request id, and `synthesis-plan-repair-failed` is never shown
        // to the researcher once the turn becomes a clarification dialogue.
        console.warn(
          "native-okf synthesis clarification fallback",
          JSON.stringify({
            diagnosticCode:
              diagramResult.diagnosticCode ?? "synthesis-plan-repair-failed",
            missingDimension: clarificationNeed.missingDimension,
            validationReason: clarificationNeed.reason,
            round: priorRounds,
          }),
        );
        return {
          kind: "clarification",
          presentationMode: "clarification",
          answerMarkdown: clarificationNeed.question,
          sources: [],
          insufficientContext: false,
          clarification: {
            kind: "synthesis-constraint",
            question: clarificationNeed.question,
          },
          conversationState: nativeOkfSynthesisClarificationState(
            prepared,
            priorRounds + 1,
          ),
          diagramMode: null,
          diagramStatus: null,
        };
      }
    }

    if (includeDiagram) {
      const sourceCards = sourceCardsForConceptIds(
        context,
        retrieval.finalConcepts
          .filter(
            (concept) =>
              concept.type !== "paper" && concept.type !== "reference",
          )
          .map((concept) => concept.conceptId),
      );
      const deterministicSummary = deterministicSynthesisFailureSummary(false);
      return {
        kind: "answer",
        presentationMode: "safe-error",
        answerMarkdown: deterministicSummary,
        deterministicSummary,
        sources: sourceCards,
        diagramMode: "synthesized",
        diagramStatus: "failed",
        diagnosticCode:
          diagramResult.diagnosticCode ?? "synthesis-plan-repair-failed",
        insufficientContext: false,
        conversationState: completedConversationState(
          prepared,
          retrieval,
          sourceCards,
        ),
        ...(retrievalDebug === undefined ? {} : { retrievalDebug }),
      };
    }
  }

  const answerPolicyMode = prepared.answerMode;
  const answerInstructions = [
    NATIVE_OKF_SYSTEM_PROMPT,
    answerModeInstruction(prepared.answerMode),
    turnPlan.mode === "ACTIVE_DIAGRAM_QA" && turnPlan.activeProposalDraft
      ? NATIVE_OKF_ACTIVE_DIAGRAM_QA_INSTRUCTION
      : prepared.intent === "synthesized-flow" && !includeDiagram
        ? NATIVE_OKF_SYNTHESIS_OUTLINE_INSTRUCTION
      : includeDiagram
        ? NATIVE_OKF_DIAGRAM_TEXT_ANSWER_INSTRUCTION
        : NATIVE_OKF_TEXT_ONLY_ANSWER_INSTRUCTION,
  ].join("\n\n");
  const modelInput = buildNativeOkfModelInput(history, context);
  const protectedStoredTitles = context.sources.flatMap((source) => [
    source.card.title,
    ...(source.card.sourcePaper ? [source.card.sourcePaper] : []),
  ]);
  const draftAnswer = await createTextResponse(
    client,
    environment,
    answerInstructions,
    modelInput,
    protectedStoredTitles,
  );

  let citationResult = validateAnswerCitations(
    draftAnswer,
    context,
  );
  let answerMarkdown = citationResult.answerMarkdown;
  let sourceCards = citationResult.sources;
  let presentationSafe = true;
  const draftPolicy = validateNativeOkfAnswerPolicy(
    answerMarkdown,
    answerPolicyMode,
  );
  const validationErrors = [
    ...(citationResult.needsRepair
      ? ["The draft has no valid required current-turn source citation."]
      : []),
    ...draftPolicy.errors,
  ];
  // A dropped paper scope is reported once, centrally, by answerNativeOkfChat.
  const warnings = userFacingRetrievalWarnings(
    retrieval,
    expectedScopedEvidenceIds,
    context.allowedConceptIds,
  );

  if (validationErrors.length > 0) {
    const repairInput = [
      {
        role: "user" as const,
        content: `${context.prompt}\n\n<DRAFT_ANSWER>\n${escapePromptData(
          answerMarkdown,
        )}\n</DRAFT_ANSWER>\n\n<VALIDATION_ERRORS>\n${escapePromptData(
          validationErrors
            .map((error) => `- ${error}`)
            .join("\n"),
        )}\n</VALIDATION_ERRORS>`,
      },
    ];
    try {
      const repairedAnswer = await createTextResponse(
        client,
        environment,
        [
          answerInstructions,
          NATIVE_OKF_PRESENTATION_REPAIR_INSTRUCTION,
          ...(citationResult.needsRepair
            ? [NATIVE_OKF_CITATION_REPAIR_INSTRUCTION]
            : []),
        ].join("\n\n"),
        repairInput,
        protectedStoredTitles,
      );
      const repairedCitations = validateAnswerCitations(
        repairedAnswer,
        context,
      );
      const repairedPolicy = validateNativeOkfAnswerPolicy(
        repairedCitations.answerMarkdown,
        answerPolicyMode,
      );
      sourceCards = mergeSourceCards(
        citationResult.sources,
        repairedCitations.sources,
      );
      if (!repairedPolicy.valid) {
        answerMarkdown = safeAnswerPolicyFailure(repairedPolicy.errors);
        presentationSafe = false;
      } else {
        citationResult = repairedCitations;
        answerMarkdown = repairedCitations.answerMarkdown;
        if (repairedCitations.needsRepair) {
          warnings.push(
            "The answer could not attach every required current-turn citation; use the validated source cards below.",
          );
        }
      }
    } catch {
      if (!draftPolicy.valid) {
        answerMarkdown = safeAnswerPolicyFailure(draftPolicy.errors);
        presentationSafe = false;
      } else {
        warnings.push(
          "The citation repair could not be completed; use the validated source cards below.",
        );
      }
    }
  }

  await moderateNativeOkfText(
    answerMarkdown,
    environment,
    client,
  );

  let diagram: GeneratedDiagram | undefined;
  let responseDiagramMode: NativeOkfDiagramMode | null = null;
  let diagramStatus: NativeOkfChatResponse["diagramStatus"] = null;
  if (earlyDeterministicDiagram) {
    // Already built deterministically above (guaranteed canonical-complete, zero LLM
    // node/edge selection). Never re-derive it from evidence or an LLM call, and never
    // let it depend on presentationSafe — the diagram's correctness never depended on
    // the LLM's prose validating cleanly.
    diagram = earlyDeterministicDiagram.diagram;
    responseDiagramMode = earlyDeterministicDiagram.mode;
    diagramStatus = "success";
    await moderateNativeOkfText(
      JSON.stringify(diagram),
      environment,
      client,
    );
  } else if (presentationSafe && includeDiagram && prepared.diagramMode === "stored") {
    try {
      diagram = await buildGroundedStoredSourceMap(retrieval, {
        allowNarrowExactRelationship: hardKinds.length > 0 || prepared.scopePaperSlugs.length > 0 ||
          (turnPlan.requestedConceptKinds.length === 2 &&
          retrieval.structuredAnalysis?.relationshipCheckComplete === true),
      });
      if (diagram) {
        responseDiagramMode = "stored";
        diagramStatus = "success";
      }
    } catch {
      diagram = undefined;
    }
    if (!diagram) {
      try {
        const grounding = await buildNativeOkfDiagramGrounding(retrieval);
        const diagramResult = await (
          dependencies.generateDiagram ?? defaultDiagramGenerator
        )({
          client,
          environment,
          context,
          question: turnPlan.effectiveQuestion,
          answerMarkdown,
          mode: "stored",
          grounding,
          priorDraft: null,
          requireRpfPath: false,
          synthesisProblem: null,
          synthesisDomain: null,
        });
        diagram = diagramResult.diagram;
        if (diagram) {
          responseDiagramMode = "stored";
          diagramStatus = "success";
        }
      } catch {
        diagram = undefined;
      }
    }
    if (diagram) {
      await moderateNativeOkfText(
        JSON.stringify(diagram),
        environment,
        client,
      );
    }
  }
  if (presentationSafe) {
    sourceCards = citationResult.sources;
  }
  if (earlyDeterministicDiagram) {
    // The deterministic diagram's own source set is guaranteed complete for what it
    // shows; the LLM's cited sources answer the user's specific question and may be a
    // subset (or, rarely, reference a related concept the diagram doesn't include).
    // Keep both so source disclosure never shows less than the diagram itself does.
    // sourceCards (citation-derived) must be the FIRST/authoritative group: its IDs
    // are exactly what answerMarkdown's [[S#]] tokens already reference and must
    // never be renumbered. The diagram's independently-numbered sources are merged
    // in after, getting a fresh non-colliding ID for any concept the diagram alone
    // introduces (see mergeSourceCards).
    sourceCards = mergeSourceCards(sourceCards, earlyDeterministicDiagram.sources);
    if (presentationSafe) {
      // The wording must match what was actually returned: "complete" is only true
      // for the unfiltered canonical map. A STORED_FILTERED_MAP only exists when the
      // user explicitly asked for an exclusively filtered subset (see
      // explicitlyFilteredDiagramConceptKinds), so it must never be described as
      // "the complete stored...map".
      const provenanceSentence = turnPlan.mode === "STORED_FILTERED_MAP" || hardKinds.length > 0
          ? "The diagram below shows the stored design-knowledge concepts in the explicitly requested category and the canonical relationships among them from the paper. No synthesized design knowledge was added."
          : "The diagram below shows the complete stored design-knowledge concepts and canonical relationships from the paper. No synthesized design knowledge was added.";
      answerMarkdown = `${answerMarkdown}\n\n${provenanceSentence}`;
    }
  }
  const conversationState = completedConversationState(
    prepared,
    retrieval,
    sourceCards,
  );
  const presentationMode = presentationSafe
    ? diagram
      ? "diagram-primary" as const
      : "text-primary" as const
    : "safe-error" as const;
  return {
    kind: "answer",
    presentationMode,
    answerMarkdown,
    sources: sourceCards,
    ...(diagram ? { diagram } : {}),
    diagramMode: responseDiagramMode,
    diagramStatus,
    ...(earlyDeterministicDiagram
      ? { deterministicSummary: earlyDeterministicDiagram.summary }
      : {}),
    ...(!presentationSafe
      ? { diagnosticCode: "answer-presentation-invalid" as const }
      : {}),
    insufficientContext: false,
    conversationState,
    ...(warnings.length > 0
      ? { warnings: [...new Set(warnings)] }
      : {}),
    ...(retrievalDebug === undefined ? {} : { retrievalDebug }),
  };
}
