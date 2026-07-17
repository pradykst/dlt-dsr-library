import "server-only";

import type { Response } from "openai/resources/responses/responses";

import type {
  GeneratedDiagram,
  NativeOkfChatHistoryMessage,
  NativeOkfChatRequest,
  NativeOkfChatResponse,
} from "../../shared/chat-types.ts";
import { retrieveOkfContext } from "../retrieval.ts";
import type { RetrievalResult } from "../retrieval-types.ts";
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
  NATIVE_OKF_SYSTEM_PROMPT,
} from "./prompts.ts";

export const MAX_NATIVE_OKF_QUESTION_CHARACTERS = 2_000;
export const MAX_NATIVE_OKF_HISTORY_MESSAGES = 8;
export const MAX_NATIVE_OKF_HISTORY_MESSAGE_CHARACTERS = 2_000;
export const MAX_NATIVE_OKF_REQUEST_BYTES = 32_000;

const MIN_MEANINGFUL_QUESTION_CHARACTERS = 3;
const ALLOWED_REQUEST_KEYS = new Set(["question", "history", "includeDiagram"]);
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
}) => Promise<NativeOkfDiagramGenerationResult>;

export interface NativeOkfChatDependencies {
  retrieve?: (question: string) => Promise<RetrievalResult>;
  environment?: NativeOpenAiEnvironment;
  client?: NativeOpenAiClient;
  generateDiagram?: NativeOkfDiagramGenerator;
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

  return {
    question,
    ...(recentHistory.length > 0 ? { history: recentHistory } : {}),
    ...(input.includeDiagram === undefined
      ? {}
      : { includeDiagram: input.includeDiagram }),
  };
}

/** This helper decides only whether a diagram call is requested. */
export function questionRequestsDiagram(question: string): boolean {
  return /\b(?:diagram|graph|flow|architecture|visuali[sz]e|decision[\s-]+support[\s-]+flow)\b/iu
    .test(question);
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

export async function answerNativeOkfChat(
  input: unknown,
  dependencies: NativeOkfChatDependencies = {},
): Promise<NativeOkfChatResponse> {
  const request = validateNativeOkfChatRequest(input);
  const retrieve = dependencies.retrieve ?? retrieveOkfContext;
  const retrieval = await retrieve(request.question);
  const retrievalDebug = developmentRetrievalDebug(retrieval);

  // This branch deliberately occurs before configuration, moderation, or SDK access.
  if (retrieval.noMatch || retrieval.finalConcepts.length === 0) {
    return {
      answerMarkdown: INSUFFICIENT_CONTEXT_ANSWER,
      sources: [],
      insufficientContext: true,
      warnings: [...retrieval.warnings, "No model request was made."],
      ...(retrievalDebug === undefined ? {} : { retrievalDebug }),
    };
  }

  const environment = dependencies.environment ?? readOpenAiEnvironment();
  const client = dependencies.client ?? getOpenAiClient(environment);
  const history = request.history ?? [];
  const userConversation = [
    ...history.map((message) => `${message.role}: ${message.content}`),
    `user: ${request.question}`,
  ].join("\n");
  await moderateNativeOkfText(userConversation, environment, client);

  const context = buildNativeOkfGroundedContext(retrieval, request.question);
  const modelInput = buildNativeOkfModelInput(history, context);
  const draftAnswer = await createTextResponse(
    client,
    environment,
    NATIVE_OKF_SYSTEM_PROMPT,
    modelInput,
  );

  let citationResult = validateAnswerCitations(draftAnswer, context);
  const warnings = [...retrieval.warnings];
  if (citationResult.needsRepair) {
    const repairInput = [
      {
        role: "user" as const,
        content: `${context.prompt}\n\n<DRAFT_ANSWER>\n${escapePromptData(citationResult.answerMarkdown)}\n</DRAFT_ANSWER>`,
      },
    ];
    try {
      const repairedAnswer = await createTextResponse(
        client,
        environment,
        `${NATIVE_OKF_SYSTEM_PROMPT}\n\n${NATIVE_OKF_CITATION_REPAIR_INSTRUCTION}`,
        repairInput,
      );
      const repairedCitations = validateAnswerCitations(repairedAnswer, context);
      if (repairedCitations.needsRepair) {
        warnings.push(...citationResult.warnings);
        warnings.push("The bounded citation repair did not produce a valid citation.");
      } else {
        citationResult = repairedCitations;
        warnings.push("A bounded citation repair was applied.");
        warnings.push(...repairedCitations.warnings);
      }
    } catch {
      warnings.push(...citationResult.warnings);
      warnings.push("The bounded citation repair could not be completed.");
    }
  } else {
    warnings.push(...citationResult.warnings);
  }

  await moderateNativeOkfText(citationResult.answerMarkdown, environment, client);

  const includeDiagram = request.includeDiagram === true ||
    (request.includeDiagram === undefined && questionRequestsDiagram(request.question));
  let diagram: GeneratedDiagram | undefined;
  if (includeDiagram) {
    try {
      const diagramResult = await (
        dependencies.generateDiagram ?? defaultDiagramGenerator
      )({
        client,
        environment,
        context,
        question: request.question,
        answerMarkdown: citationResult.answerMarkdown,
      });
      diagram = diagramResult.diagram;
      warnings.push(...diagramResult.warnings);
    } catch {
      warnings.push("The diagram request could not be completed; the grounded text answer is still available.");
    }
    if (diagram) {
      await moderateNativeOkfText(JSON.stringify(diagram), environment, client);
    }
  }

  return {
    answerMarkdown: citationResult.answerMarkdown,
    sources: citationResult.sources,
    ...(diagram ? { diagram } : {}),
    insufficientContext: false,
    ...(warnings.length > 0 ? { warnings: [...new Set(warnings)] } : {}),
    ...(retrievalDebug === undefined ? {} : { retrievalDebug }),
  };
}
