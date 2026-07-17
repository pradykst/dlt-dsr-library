import "server-only";

import OpenAI from "openai";
import type {
  ModerationCreateParams,
  ModerationCreateResponse,
} from "openai/resources/moderations";
import type {
  Response,
  ResponseCreateParamsNonStreaming,
} from "openai/resources/responses/responses";


import { readOpenAiEnvironment, type NativeOpenAiEnvironment } from "./env.ts";

export interface NativeOpenAiClient {
  responses: {
    create(body: ResponseCreateParamsNonStreaming): Promise<Response>;
  };
  moderations: {
    create(body: ModerationCreateParams): Promise<ModerationCreateResponse>;
  };
}

export const OPENAI_REQUEST_TIMEOUT_MS = 45_000;
export const OPENAI_MAX_RETRIES = 2;

const silentLogger = Object.freeze({
  error: () => undefined,
  warn: () => undefined,
  info: () => undefined,
  debug: () => undefined,
});

let cachedClient: NativeOpenAiClient | undefined;
let testClient: NativeOpenAiClient | undefined;

/** Returns the one process-local, server-only official OpenAI SDK client. */
export function getOpenAiClient(
  environment: NativeOpenAiEnvironment = readOpenAiEnvironment(),
): NativeOpenAiClient {
  if (testClient) return testClient;
  if (cachedClient) return cachedClient;

  cachedClient = new OpenAI({
    apiKey: environment.apiKey,
    baseURL: "https://api.openai.com/v1",
    organization: null,
    project: null,
    timeout: OPENAI_REQUEST_TIMEOUT_MS,
    maxRetries: OPENAI_MAX_RETRIES,
    logLevel: "off",
    logger: silentLogger,
  }) as NativeOpenAiClient;
  return cachedClient;
}

export function setOpenAiClientForTests(client: NativeOpenAiClient | undefined): void {
  testClient = client;
}

export function clearOpenAiClientForTests(): void {
  testClient = undefined;
  cachedClient = undefined;
}
