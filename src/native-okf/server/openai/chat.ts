import "server-only";

import type { Response } from "openai/resources/responses/responses";

import {
  MAX_NATIVE_OKF_MODEL_HISTORY_MESSAGE_CHARACTERS,
  MAX_NATIVE_OKF_MODEL_HISTORY_MESSAGES,
  MAX_NATIVE_OKF_PENDING_QUESTION_CHARACTERS,
  type GeneratedDiagram,
  type NativeOkfChatHistoryMessage,
  type NativeOkfChatRequest,
  type NativeOkfChatResponse,
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
  nativeOkfRequestedKindForType,
  retrieveOkfContext,
} from "../retrieval.ts";
import type { RetrievalResult } from "../retrieval-types.ts";
import {
  assembleNativeOkfContextualRetrieval,
  clarificationConversationState,
  completedConversationState,
  hasSufficientNativeOkfSynthesisGrounding,
  nativeOkfSynthesisRequiresRpfPath,
  prepareNativeOkfChatRequest,
} from "../conversation.ts";
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
  NativeOkfRequestError,
  normalizeOpenAiError,
  OpenAiGenerationError,
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
  NATIVE_OKF_TEXT_ONLY_ANSWER_INSTRUCTION,
} from "./prompts.ts";
import {
  buildComparativePaperDesignMap,
  buildGroundedStoredSourceMap,
  buildStoredPaperDesignMap,
  storedPaperMapPresentation,
} from "./stored-source-map.ts";

export const MAX_NATIVE_OKF_QUESTION_CHARACTERS = 2_000;
export const MAX_NATIVE_OKF_HISTORY_MESSAGES =
  MAX_NATIVE_OKF_MODEL_HISTORY_MESSAGES;
export const MAX_NATIVE_OKF_HISTORY_MESSAGE_CHARACTERS =
  MAX_NATIVE_OKF_MODEL_HISTORY_MESSAGE_CHARACTERS;
export const MAX_NATIVE_OKF_REQUEST_BYTES = 32_000;

const MIN_MEANINGFUL_QUESTION_CHARACTERS = 3;
const ALLOWED_REQUEST_KEYS = new Set([
  "question",
  "history",
  "diagramPreference",
  "visibleHistoryMessageCount",
  "includeDiagram",
  "conversationState",
]);
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
  buildComparativePaperMap?: typeof buildComparativePaperDesignMap;
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
  if (
    response.error ||
    response.status === "failed" ||
    response.status === "cancelled" ||
    response.status === "incomplete" ||
    response.incomplete_details
  ) {
    throw new OpenAiGenerationError();
  }
  const answer = response.output_text.trim();
  if (!answer) throw new OpenAiGenerationError();
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

function mergeSourceCards(
  ...groups: ReadonlyArray<NativeOkfChatResponse["sources"]>
): NativeOkfChatResponse["sources"] {
  const merged: NativeOkfChatResponse["sources"] = [];
  const seen = new Set<string>();
  for (const source of groups.flat()) {
    if (seen.has(source.conceptId)) continue;
    seen.add(source.conceptId);
    merged.push(source);
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
      "This diagram translates the current design proposal into a decision-support flow. Stored concepts are reused where applicable; proposed adaptations are distinguished visually.",
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

/** Deterministic prose projection of the same validated proposal graph. */
function designProposalNarrative(
  diagram: GeneratedDiagram,
  sources: NativeOkfChatResponse["sources"],
  refined: boolean,
): string {
  const sourceIdByConceptId = new Map(
    sources.map((source) => [source.conceptId, source.sourceId]),
  );
  const proposalNodes = diagram.nodes.filter((node) => node.stage !== "problem");
  const stages = [...new Set(proposalNodes.map((node) => node.stage))];
  const sections = stages.flatMap((stage) => {
    const nodes = proposalNodes.filter((node) => node.stage === stage);
    if (nodes.length === 0) return [];
    const bullets = nodes.map((node) => {
      const citations = [...new Set(
        node.supportConceptIds.flatMap((conceptId) => {
          const sourceId = sourceIdByConceptId.get(conceptId);
          return sourceId ? [`[[${sourceId}]]`] : [];
        }),
      )].join(" ");
      return `- **${node.label}:** ${node.description}${citations ? ` ${citations}` : ""}`;
    });
    return [`### ${proposalStageHeading(stage)}\n\n${bullets.join("\n")}`];
  });
  const introduction = refined
    ? "This refinement updates the existing design proposal while preserving all unmentioned elements."
    : `This design proposal addresses ${diagram.nodes.find((node) => node.stage === "problem")?.label ?? "the research problem"}. Exact stored concepts are reused where applicable, and problem-specific adaptations remain visibly distinct.`;
  return [introduction, ...sections].join("\n\n");
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
    (plan.mode === "STORED_COMPARISON_MAP" &&
      (plan.resolvedPaperSlugs.length < 2 || plan.diagramMode !== "comparative")) ||
    (plan.mode === "DESIGN_REFINEMENT" && !plan.refinementIntent) ||
    (plan.mode === "ACTIVE_DIAGRAM_QA" && plan.diagramAction !== "NONE") ||
    (plan.diagramAction === "NONE" && plan.includeDiagram) ||
    (plan.diagramAction !== "NONE" && !plan.includeDiagram)
  ) {
    throw new Error("Native OKF resolved turn plan is inconsistent.");
  }
}

export async function answerNativeOkfChat(
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
      answerMarkdown: NATIVE_OKF_LIVE_DATA_BOUNDARY_RESPONSE,
      sources: [],
      insufficientContext: false,
      diagramMode: null,
      diagramStatus: null,
      conversationState: {
        ...prepared.validatedState,
        lastIntent: "answer",
        lastDiagramRequested: false,
        pendingClarification: null,
      },
    };
  }

  const turnPlan = prepared.turnPlan;
  const includeDiagram = turnPlan.includeDiagram;
  const retrieve = dependencies.retrieve ?? retrieveOkfContext;
  const rawRetrieval = await retrieve(prepared.retrievalQuestion);
  const retrieval = await assembleNativeOkfContextualRetrieval(
    prepared,
    rawRetrieval,
  );
  const insufficientSynthesisGrounding =
    prepared.intent === "synthesized-flow" &&
    !hasSufficientNativeOkfSynthesisGrounding(retrieval);
  const retrievalDebug = developmentRetrievalDebug(retrieval);

  if (
    ![
      "STORED_FULL_MAP",
      "STORED_FILTERED_MAP",
      "STORED_COMPARISON_MAP",
    ].includes(turnPlan.mode) &&
    (
      retrieval.noMatch ||
      retrieval.finalConcepts.length === 0 ||
      insufficientSynthesisGrounding
    )
  ) {
    return {
      kind: "answer",
      presentationMode: "no-match",
      answerMarkdown: INSUFFICIENT_CONTEXT_ANSWER,
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

  if (
    turnPlan.mode === "STORED_FULL_MAP" ||
    turnPlan.mode === "STORED_FILTERED_MAP"
  ) {
    const focusedSlug = turnPlan.focusedPaperSlugs[0];
    const focusedPaper = prepared.catalog.papers.find(
      (paper) => paper.slug === focusedSlug,
    );
    if (focusedPaper) {
      try {
        const diagram = await (
          dependencies.buildStoredPaperMap ?? buildStoredPaperDesignMap
        )(focusedPaper.conceptId, turnPlan.requestedConceptKinds);
        if (diagram) {
          const presentation = await storedPaperMapPresentation(
            focusedPaper.conceptId,
            diagram,
          );
          return {
            kind: "answer",
            presentationMode: "diagram-primary",
            answerMarkdown: presentation.summary,
            deterministicSummary: presentation.summary,
            sources: presentation.sources,
            diagram,
            diagramMode: "stored",
            diagramStatus: "success",
            insufficientContext: false,
            conversationState: completedConversationState(
              prepared,
              retrieval,
              presentation.sources,
            ),
            ...(retrievalDebug === undefined ? {} : { retrievalDebug }),
          };
        }
      } catch {
        // The content-free diagnostic below is the only client-visible detail.
      }
    }
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

  if (turnPlan.mode === "STORED_COMPARISON_MAP") {
    const paperBySlug = new Map(
      prepared.catalog.papers.map((paper) => [paper.slug, paper]),
    );
    const paperConceptIds = turnPlan.focusedPaperSlugs.flatMap((slug) => {
      const paper = paperBySlug.get(slug);
      return paper ? [paper.conceptId] : [];
    });
    try {
      const presentation = await (
        dependencies.buildComparativePaperMap ?? buildComparativePaperDesignMap
      )(paperConceptIds);
      if (presentation) {
        return {
          kind: "answer",
          presentationMode: "diagram-primary",
          answerMarkdown: presentation.summary,
          deterministicSummary: presentation.summary,
          sources: presentation.sources,
          diagram: presentation.diagram,
          diagramMode: "comparative",
          diagramStatus: "success",
          insufficientContext: false,
          conversationState: completedConversationState(
            prepared,
            retrieval,
            presentation.sources,
          ),
          ...(retrievalDebug === undefined ? {} : { retrievalDebug }),
        };
      }
    } catch {
      // The content-free diagnostic below is the only client-visible detail.
    }
    return {
      kind: "answer",
      presentationMode: "safe-error",
      answerMarkdown:
        "The comparative stored evidence map could not be assembled safely. No model-generated substitute was used.",
      sources: [],
      diagramMode: "comparative",
      diagramStatus: "failed",
      diagnosticCode: "stored-map-unavailable",
      insufficientContext: false,
      conversationState: completedConversationState(prepared, retrieval, []),
      ...(retrievalDebug === undefined ? {} : { retrievalDebug }),
    };
  }

  const environment =
    dependencies.environment ?? readOpenAiEnvironment();
  const client =
    dependencies.client ?? getOpenAiClient(environment);
  const history = request.history ?? [];
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
  ])];
  const context = buildNativeOkfGroundedContext(
    retrieval,
    turnPlan.effectiveQuestion,
    requiredConceptIds,
    turnPlan.mode === "ACTIVE_DIAGRAM_QA"
      ? turnPlan.activeProposalDraft
      : null,
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
          requireRpfPath: nativeOkfSynthesisRequiresRpfPath(
            turnPlan.effectiveQuestion,
          ),
          synthesisProblem: prepared.synthesisProblem,
          synthesisDomain: prepared.synthesisDomain,
        });
      } catch {
        diagramResult = {
          warnings: [],
          diagnosticCode: "synthesis-plan-repair-failed",
        };
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

    let evidenceMap: GeneratedDiagram | undefined;
    try {
      evidenceMap = includeDiagram
        ? await buildGroundedStoredSourceMap(retrieval)
        : undefined;
    } catch {
      evidenceMap = undefined;
    }
    const evidenceIds = evidenceMap
      ? [...new Set(evidenceMap.nodes.flatMap((node) => node.supportConceptIds))]
      : [];
    const fallbackEvidenceIds = evidenceIds.length > 0
      ? evidenceIds
      : retrieval.finalConcepts
          .filter(
            (concept) =>
              concept.type !== "paper" && concept.type !== "reference",
          )
          .map((concept) => concept.conceptId);
    const sourceCards = sourceCardsForConceptIds(
      context,
      fallbackEvidenceIds,
    );
    const deterministicSummary = deterministicSynthesisFailureSummary(
      evidenceMap !== undefined,
    );
    return {
      kind: "answer",
      presentationMode: includeDiagram ? "diagram-primary" : "safe-error",
      answerMarkdown: deterministicSummary,
      deterministicSummary,
      sources: sourceCards,
      ...(evidenceMap ? { diagram: evidenceMap } : {}),
      diagramMode: includeDiagram ? "synthesized" : null,
      diagramStatus: includeDiagram
        ? evidenceMap ? "evidence-fallback" : "failed"
        : null,
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

  const answerPolicyMode = prepared.answerMode;
  const answerInstructions = [
    NATIVE_OKF_SYSTEM_PROMPT,
    answerModeInstruction(prepared.answerMode),
    turnPlan.mode === "ACTIVE_DIAGRAM_QA" && turnPlan.activeProposalDraft
      ? NATIVE_OKF_ACTIVE_DIAGRAM_QA_INSTRUCTION
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
  if (presentationSafe && includeDiagram && prepared.diagramMode === "stored") {
    try {
      diagram = await buildGroundedStoredSourceMap(retrieval, {
        allowNarrowExactRelationship:
          turnPlan.requestedConceptKinds.length === 2 &&
          retrieval.structuredAnalysis?.relationshipCheckComplete === true,
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
