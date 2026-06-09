import { NextResponse } from "next/server";
import { jsonError, readableError } from "@/lib/workbench/api";
import { getSupabaseAdmin } from "@/lib/workbench/supabase-admin";
import { validateDesristEvaluationPayload, type DesristEvaluationPayload } from "@/lib/desrist-evaluation/survey";

export async function POST(request: Request) {
  try {
    const body = await readJsonBody(request);
    const errors = validateDesristEvaluationPayload(body);
    if (errors.length) return jsonError("Survey validation failed.", 400, errors);
    const improvementSuggestion = cleanOptional(body.improvement_suggestion);

    const payload = {
      role: body.role,
      dsr_experience: body.dsr_experience,
      dlt_experience: body.dlt_experience,
      used_sections: normalizedArray(body.used_sections),
      q_usefulness: body.q_usefulness,
      q_ease_understanding: body.q_ease_understanding,
      q_traceability: body.q_traceability,
      q_visual_clarity: body.q_visual_clarity,
      q_comparison_value: nullableLikert(body.q_comparison_value),
      q_trust_credibility: nullableLikert(body.q_trust_credibility),
      q_reuse_intention: body.q_reuse_intention,
      q_ecommerce_relevance: nullableLikert(body.q_ecommerce_relevance),
      q_completeness: nullableLikert(body.q_completeness),
      q_recommendation: nullableLikert(body.q_recommendation),
      improvement_priorities: normalizedArray(body.improvement_priorities),
      most_valuable_use_case: cleanOptional(body.most_valuable_use_case),
      most_useful_part: cleanOptional(body.most_useful_part),
      confusing_or_missing: cleanOptional(body.confusing_or_missing),
      improvement_suggestion: improvementSuggestion,
      user_agent: request.headers.get("user-agent"),
      page_path: cleanOptional(body.page_path) ?? "/desrist-evaluation",
      submitted_at: new Date().toISOString()
    };

    const supabase = getSupabaseAdmin();
    const { error } = await retryInsert(() => supabase.from("desrist_evaluation_responses").insert(payload));
    if (isMissingImprovementSuggestionColumn(error)) {
      const legacyPayload: Record<string, unknown> = { ...payload };
      delete legacyPayload.improvement_suggestion;
      const { error: legacyError } = await retryInsert(() => supabase
        .from("desrist_evaluation_responses")
        .insert({ ...legacyPayload, feature_suggestion: improvementSuggestion }));
      if (isNotNullConstraintError(legacyError)) {
        const { error: defaultedLegacyError } = await retryInsert(() => supabase
          .from("desrist_evaluation_responses")
          .insert(withLegacyDefaults({ ...legacyPayload, feature_suggestion: improvementSuggestion })));
        if (defaultedLegacyError) throw defaultedLegacyError;
        return NextResponse.json({ ok: true });
      }
      if (legacyError) throw legacyError;
      return NextResponse.json({ ok: true });
    }
    if (isNotNullConstraintError(error)) {
      const { error: defaultedError } = await retryInsert(() => supabase.from("desrist_evaluation_responses").insert(withLegacyDefaults(payload)));
      if (defaultedError) throw defaultedError;
      return NextResponse.json({ ok: true });
    }
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof InvalidJsonError) return jsonError(error.message, 400);
    return jsonError("Could not submit survey response.", 500, readableError(error));
  }
}

async function readJsonBody(request: Request): Promise<Partial<DesristEvaluationPayload>> {
  try {
    return (await request.json()) as Partial<DesristEvaluationPayload>;
  } catch {
    throw new InvalidJsonError();
  }
}

class InvalidJsonError extends Error {
  constructor() {
    super("Request body must be valid JSON.");
  }
}

async function retryInsert<T extends { error: unknown }>(insert: () => PromiseLike<T>) {
  let result = await insert();
  for (let attempt = 1; attempt < 3 && isTransientInsertError(result.error); attempt += 1) {
    await delay(250 * attempt);
    result = await insert();
  }
  return result;
}

function cleanOptional(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizedArray(value: unknown) {
  if (!Array.isArray(value)) return null;
  const strings = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  return strings.length ? strings : null;
}

function nullableLikert(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5 ? value : null;
}

function isMissingImprovementSuggestionColumn(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const message = "message" in error && typeof error.message === "string" ? error.message : "";
  return message.includes("improvement_suggestion") && message.includes("column");
}

function isNotNullConstraintError(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && error.code === "23502");
}

function isTransientInsertError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error && typeof error.code === "string" ? error.code : "";
  const status = "status" in error && typeof error.status === "number" ? error.status : 0;
  const message = "message" in error && typeof error.message === "string" ? error.message.toLowerCase() : "";
  return status >= 500
    || code.startsWith("08")
    || message.includes("timeout")
    || message.includes("temporarily")
    || message.includes("connection")
    || message.includes("network");
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withLegacyDefaults(payload: Record<string, unknown>) {
  return {
    ...payload,
    used_sections: payload.used_sections ?? ["not_collected"],
    q_comparison_value: payload.q_comparison_value ?? 3,
    q_trust_credibility: payload.q_trust_credibility ?? 3,
    q_ecommerce_relevance: payload.q_ecommerce_relevance ?? 3,
    q_completeness: payload.q_completeness ?? 3,
    q_recommendation: payload.q_recommendation ?? 3,
    improvement_priorities: payload.improvement_priorities ?? ["not_collected"],
    most_valuable_use_case: payload.most_valuable_use_case ?? "not_collected"
  };
}
