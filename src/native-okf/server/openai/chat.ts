import "server-only";

import type { Response } from "openai/resources/responses/responses";

import {
  MAX_NATIVE_OKF_PENDING_QUESTION_CHARACTERS,
  type GeneratedDiagram,
  type NativeOkfChatHistoryMessage,
  type NativeOkfChatRequest,
  type NativeOkfChatResponse,
  type NativeOkfDiagramMode,
  type SynthesisDraftState,
} from "../../shared/chat-types.ts";
import { parseNativeOkfConversationState } from "../../shared/conversation-state.ts";
import type {
  NativeOkfConversationCatalog,
  PreparedNativeOkfChatRequest,
} from "../conversation.ts";
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
  NATIVE_OKF_CITATION_REPAIR_INSTRUCTION,
  NATIVE_OKF_COMPARISON_ANSWER_INSTRUCTION,
  NATIVE_OKF_DIAGRAM_TEXT_ANSWER_INSTRUCTION,
  NATIVE_OKF_DETAILED_ANSWER_INSTRUCTION,
  NATIVE_OKF_SYSTEM_PROMPT,
  NATIVE_OKF_NORMAL_ANSWER_INSTRUCTION,
  NATIVE_OKF_PRESENTATION_REPAIR_INSTRUCTION,
  NATIVE_OKF_SYNTHESIS_ANSWER_INSTRUCTION,
  NATIVE_OKF_TEXT_ONLY_ANSWER_INSTRUCTION,
} from "./prompts.ts";
import {
  buildGroundedStoredSourceMap,
  buildStoredPaperDesignMap,
} from "./stored-source-map.ts";

export const MAX_NATIVE_OKF_QUESTION_CHARACTERS = 2_000;
export const MAX_NATIVE_OKF_HISTORY_MESSAGES = 8;
export const MAX_NATIVE_OKF_HISTORY_MESSAGE_CHARACTERS = 2_000;
export const MAX_NATIVE_OKF_REQUEST_BYTES = 32_000;

const MIN_MEANINGFUL_QUESTION_CHARACTERS = 3;
const ALLOWED_REQUEST_KEYS = new Set([
  "question",
  "history",
  "includeDiagram",
  "conversationState",
]);
const ALLOWED_HISTORY_KEYS = new Set(["role", "content"]);

export interface NativeOkfDiagramGenerationResult {
  diagram?: GeneratedDiagram;
  warnings: string[];
}

export type NativeOkfDiagramGenerator = (input: {
  client: NativeOpenAiClient;
  environment: NativeOpenAiEnvironment;
  context: NativeOkfGroundedContext;
  question: string;
  answerMarkdown: string;
  mode: NativeOkfDiagramMode;
  grounding: NativeOkfDiagramGrounding;
  priorDraft: SynthesisDraftState | null;
  requireRpfPath: boolean;
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

  if (input.includeDiagram !== undefined && typeof input.includeDiagram !== "boolean") {
    throw new NativeOkfRequestError("includeDiagram must be a boolean.");
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
    return extractNativeOkfResponseText(response);
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
  "The native OKF retrieval did not find enough grounded library context to answer this question. Try naming a paper, concept, mechanism, or design-knowledge topic represented in the library.";
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
  "The grounded answer could not be presented safely. The validated retrieved source cards remain available below.";
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

  if (prepared.clarification) {
    return {
      kind: "clarification",
      answerMarkdown: prepared.clarification.question,
      sources: [],
      insufficientContext: false,
      clarification: prepared.clarification,
      conversationState: clarificationConversationState(prepared),
      diagramMode: null,
    };
  }

  const includeDiagram = prepared.includeDiagram;
  const answerInstructions = [
    NATIVE_OKF_SYSTEM_PROMPT,
    answerModeInstruction(prepared.answerMode),
    ...(prepared.intent === "synthesized-flow"
      ? [NATIVE_OKF_SYNTHESIS_ANSWER_INSTRUCTION]
      : []),
    includeDiagram
      ? NATIVE_OKF_DIAGRAM_TEXT_ANSWER_INSTRUCTION
      : NATIVE_OKF_TEXT_ONLY_ANSWER_INSTRUCTION,
  ].join("\n\n");

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

  // This branch deliberately occurs before configuration, moderation, or SDK access.
  if (
    retrieval.noMatch ||
    retrieval.finalConcepts.length === 0 ||
    insufficientSynthesisGrounding
  ) {
    return {
      kind: "answer",
      answerMarkdown: INSUFFICIENT_CONTEXT_ANSWER,
      sources: [],
      insufficientContext: true,
      diagramMode: null,
      conversationState: completedConversationState(
        prepared,
        retrieval,
        [],
      ),
      warnings: [
        ...retrieval.warnings,
        ...(insufficientSynthesisGrounding
          ? ["At least two relevant stored native concepts are required for synthesis."]
          : []),
        "No model request was made.",
      ],
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

  const requestedKinds = new Set(prepared.requestedConceptKinds);
  const requiredConceptIds = retrieval.finalConcepts
    .filter((concept) => {
      const kind = nativeOkfRequestedKindForType(concept.type);
      return kind !== null && requestedKinds.has(kind);
    })
    .map((concept) => concept.conceptId);
  const context = buildNativeOkfGroundedContext(
    retrieval,
    prepared.effectiveQuestion,
    requiredConceptIds,
  );
  const modelInput = buildNativeOkfModelInput(history, context);
  const draftAnswer = await createTextResponse(
    client,
    environment,
    answerInstructions,
    modelInput,
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
    prepared.answerMode,
  );
  const validationErrors = [
    ...(citationResult.needsRepair
      ? ["The draft has no valid required current-turn source citation."]
      : []),
    ...draftPolicy.errors,
  ];
  const warnings = [...retrieval.warnings];

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
      );
      const repairedCitations = validateAnswerCitations(
        repairedAnswer,
        context,
      );
      const repairedPolicy = validateNativeOkfAnswerPolicy(
        repairedCitations.answerMarkdown,
        prepared.answerMode,
      );
      sourceCards = mergeSourceCards(
        citationResult.sources,
        repairedCitations.sources,
      );
      if (!repairedPolicy.valid) {
        answerMarkdown = safeAnswerPolicyFailure(repairedPolicy.errors);
        presentationSafe = false;
        warnings.push(
          "The bounded prose repair remained outside the safe presentation policy; invalid text was withheld.",
        );
      } else {
        citationResult = repairedCitations;
        answerMarkdown = repairedCitations.answerMarkdown;
        warnings.push("A bounded answer repair was applied.");
        if (repairedCitations.needsRepair) {
          warnings.push(
            "The bounded citation repair did not produce a valid current-turn citation.",
          );
        }
        warnings.push(...repairedCitations.warnings);
      }
    } catch {
      if (!draftPolicy.valid) {
        answerMarkdown = safeAnswerPolicyFailure(draftPolicy.errors);
        presentationSafe = false;
        warnings.push(
          "The bounded prose repair could not be completed; invalid text was withheld.",
        );
      } else {
        warnings.push(...citationResult.warnings);
        warnings.push(
          "The bounded citation repair could not be completed.",
        );
      }
    }
  } else {
    warnings.push(...citationResult.warnings);
  }

  await moderateNativeOkfText(
    answerMarkdown,
    environment,
    client,
  );

  let diagram: GeneratedDiagram | undefined;
  let responseDiagramMode: NativeOkfDiagramMode | null = null;
  let synthesisDraft: SynthesisDraftState | null =
    prepared.validatedState.synthesisDraft;
  if (includeDiagram && prepared.diagramMode) {
    if (prepared.preferDeterministicPaperMap) {
      const focusedSlug = prepared.focusedPaperSlugs[0];
      const focusedPaper = prepared.catalog.papers.find(
        (paper) => paper.slug === focusedSlug,
      );
      if (focusedPaper) {
        try {
          diagram = await (
            dependencies.buildStoredPaperMap ?? buildStoredPaperDesignMap
          )(focusedPaper.conceptId);
          if (diagram) responseDiagramMode = "stored";
        } catch {
          warnings.push(
            "The exact stored paper map could not be assembled; the bounded structured diagram path was used instead.",
          );
        }
      }
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
          question: prepared.effectiveQuestion,
          answerMarkdown,
          mode: prepared.diagramMode,
          grounding,
          priorDraft: prepared.priorSynthesisDraft,
          requireRpfPath:
            prepared.diagramMode === "synthesized" &&
            nativeOkfSynthesisRequiresRpfPath(prepared.effectiveQuestion),
        });
        diagram = diagramResult.diagram;
        responseDiagramMode = diagram ? prepared.diagramMode : null;
        warnings.push(...diagramResult.warnings);
        if (diagram && prepared.diagramMode === "synthesized") {
          synthesisDraft = synthesisDraftFromDiagram(prepared, diagram);
        }
      } catch {
        warnings.push(
          "The diagram request could not be completed; the grounded text answer is still available.",
        );
      }
    }

    if (!diagram) {
      try {
        diagram = await buildGroundedStoredSourceMap(retrieval);
        if (diagram) {
          responseDiagramMode = "stored";
          warnings.push(
            prepared.diagramMode === "synthesized"
              ? "The synthesized decision-support diagram was unavailable, so the stored source relationships are shown instead."
              : "The requested stored diagram was unavailable, so a connected grounded source map is shown instead.",
          );
        }
      } catch {
        // The existing safe text-only behavior remains the final fallback.
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
    synthesisDraft,
  );
  return {
    kind: "answer",
    answerMarkdown,
    sources: sourceCards,
    ...(diagram ? { diagram } : {}),
    diagramMode: responseDiagramMode,
    ...(prepared.intent === "synthesized-flow" && synthesisDraft
      ? { synthesisDraft }
      : {}),
    insufficientContext: false,
    conversationState,
    ...(warnings.length > 0
      ? { warnings: [...new Set(warnings)] }
      : {}),
    ...(retrievalDebug === undefined ? {} : { retrievalDebug }),
  };
}
