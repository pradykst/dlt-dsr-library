import "server-only";

import { isAbsolute, win32 } from "node:path";

import { retrieveOkfContext } from "../../../../src/native-okf/server/retrieval.ts";
import type { RetrievalOptions } from "../../../../src/native-okf/server/retrieval-types.ts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_QUESTION_CHARACTERS = 4_000;
const NUMERIC_OPTION_KEYS = [
  "lexicalSeedLimit",
  "firstHopLimit",
  "secondHopLimit",
  "maxConcepts",
  "maxContextCharacters",
  "maxGraphDepth",
] as const satisfies readonly (keyof RetrievalOptions)[];
const BOOLEAN_OPTION_KEYS = [
  "includeIncoming",
  "includeOutgoing",
] as const satisfies readonly (keyof RetrievalOptions)[];

function jsonResponse(value: unknown, status = 200): Response {
  return Response.json(value, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function disabledResponse(): Response {
  return jsonResponse({ error: "Not found" }, 404);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseOptions(value: unknown): RetrievalOptions | undefined {
  if (value === undefined) return undefined;
  if (!isRecord(value)) {
    throw new TypeError("options must be an object");
  }

  const options: RetrievalOptions = {};
  for (const key of NUMERIC_OPTION_KEYS) {
    const candidate = value[key];
    if (candidate === undefined) continue;
    if (typeof candidate !== "number" || !Number.isFinite(candidate)) {
      throw new TypeError(`${key} must be a finite number`);
    }
    options[key] = candidate;
  }
  for (const key of BOOLEAN_OPTION_KEYS) {
    const candidate = value[key];
    if (candidate === undefined) continue;
    if (typeof candidate !== "boolean") {
      throw new TypeError(`${key} must be a boolean`);
    }
    options[key] = candidate;
  }
  return options;
}

function isFilesystemAbsolute(value: string): boolean {
  return isAbsolute(value) || win32.isAbsolute(value);
}

/** Prevent diagnostics from ever exposing host filesystem locations. */
function debugSafeValue(value: unknown, seen = new WeakSet<object>()): unknown {
  if (typeof value === "string") {
    return isFilesystemAbsolute(value) ? "[redacted absolute path]" : value;
  }
  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === undefined
  ) {
    return value;
  }
  if (typeof value !== "object") return undefined;
  if (seen.has(value)) return "[circular]";

  seen.add(value);
  if (Array.isArray(value)) {
    const result = value.map((item) => debugSafeValue(item, seen));
    seen.delete(value);
    return result;
  }

  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    const normalizedKey = key.toLowerCase();
    if (normalizedKey === "absolutepath" || normalizedKey === "rootpath") continue;
    result[key] = debugSafeValue(item, seen);
  }
  seen.delete(value);
  return result;
}

async function retrieve(questionValue: unknown, optionsValue?: unknown): Promise<Response> {
  if (typeof questionValue !== "string") {
    return jsonResponse({ error: "question must be a string" }, 400);
  }

  const question = questionValue.trim();
  if (question === "") {
    return jsonResponse({ error: "question is required" }, 400);
  }
  if (question.length > MAX_QUESTION_CHARACTERS) {
    return jsonResponse({ error: "question is too long" }, 400);
  }

  let options: RetrievalOptions | undefined;
  try {
    options = parseOptions(optionsValue);
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "invalid options" },
      400,
    );
  }

  try {
    const result = await retrieveOkfContext(question, options);
    return jsonResponse(debugSafeValue(result));
  } catch (error) {
    if (error instanceof TypeError || error instanceof RangeError) {
      return jsonResponse({ error: error.message }, 400);
    }
    return jsonResponse({ error: "Retrieval failed" }, 500);
  }
}

export async function GET(request: Request): Promise<Response> {
  if (process.env.NODE_ENV === "production") return disabledResponse();

  const url = new URL(request.url);
  return retrieve(url.searchParams.get("q"));
}

export async function POST(request: Request): Promise<Response> {
  if (process.env.NODE_ENV === "production") return disabledResponse();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "request body must be valid JSON" }, 400);
  }
  if (!isRecord(body)) {
    return jsonResponse({ error: "request body must be an object" }, 400);
  }

  return retrieve(body.question, body.options);
}
