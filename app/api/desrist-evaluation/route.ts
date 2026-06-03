import { NextResponse } from "next/server";
import { jsonError, readableError } from "@/lib/workbench/api";
import { getSupabaseAdmin } from "@/lib/workbench/supabase-admin";
import { validateDesristEvaluationPayload, type DesristEvaluationPayload } from "@/lib/desrist-evaluation/survey";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<DesristEvaluationPayload>;
    const errors = validateDesristEvaluationPayload(body);
    if (errors.length) return jsonError("Survey validation failed.", 400, errors);

    const payload = {
      role: body.role,
      dsr_experience: body.dsr_experience,
      dlt_experience: body.dlt_experience,
      used_sections: body.used_sections,
      q_usefulness: body.q_usefulness,
      q_ease_understanding: body.q_ease_understanding,
      q_traceability: body.q_traceability,
      q_visual_clarity: body.q_visual_clarity,
      q_comparison_value: body.q_comparison_value,
      q_trust_credibility: body.q_trust_credibility,
      q_reuse_intention: body.q_reuse_intention,
      q_ecommerce_relevance: body.q_ecommerce_relevance,
      q_completeness: body.q_completeness,
      q_recommendation: body.q_recommendation,
      improvement_priorities: body.improvement_priorities,
      most_valuable_use_case: body.most_valuable_use_case,
      most_useful_part: cleanOptional(body.most_useful_part),
      confusing_or_missing: cleanOptional(body.confusing_or_missing),
      feature_suggestion: cleanOptional(body.feature_suggestion),
      user_agent: request.headers.get("user-agent"),
      page_path: cleanOptional(body.page_path) ?? "/desrist-evaluation",
      submitted_at: new Date().toISOString()
    };

    const { error } = await getSupabaseAdmin().from("desrist_evaluation_responses").insert(payload);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError("Could not submit survey response.", 500, readableError(error));
  }
}

function cleanOptional(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}
