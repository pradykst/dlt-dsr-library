import { answerPayloadSchema, dsrReuseSystemPrompt } from "./prompts/dsrReuseSynthesis.ts";
import type { OkfChatResponse } from "../okf/chat.ts";

export async function synthesizeWithFeatherless(deterministic: OkfChatResponse): Promise<OkfChatResponse> {
  const apiKey = process.env.FEATHERLESS_API_KEY;
  const model = process.env.FEATHERLESS_MODEL;
  if (!apiKey || !model || !deterministic.answer_payload) return deterministic;

  const baseUrl = process.env.FEATHERLESS_BASE_URL ?? "https://api.featherless.ai/v1";
  const timeoutMs = Number(process.env.FEATHERLESS_TIMEOUT_MS ?? 60000);
  const maxTokens = Number(process.env.FEATHERLESS_MAX_TOKENS ?? 1800);
  const temperature = Number(process.env.FEATHERLESS_TEMPERATURE ?? 0.2);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: dsrReuseSystemPrompt },
          { role: "user", content: JSON.stringify({ deterministic_answer: deterministic.answer_payload, retrieved_concepts: deterministic.retrieved_concepts, evidence: deterministic.evidence, flow: deterministic.flow }) }
        ]
      })
    });
    if (!response.ok) throw new Error(`Featherless request failed: ${response.status}`);
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw new Error("Featherless response did not contain message content.");
    const parsed = answerPayloadSchema.parse(JSON.parse(content));
    const evidenceIds = new Set(deterministic.evidence.map((item) => item.evidence_id));
    const paperIds = new Set(deterministic.source_papers.map((paper) => paper.paper_id));
    const conceptIds = new Set(deterministic.retrieved_concepts.map((concept) => concept.concept_id));
    const unsupportedEvidence = parsed.flow_rows.flatMap((row) => row.evidence_ids).filter((id) => !evidenceIds.has(id));
    const unsupportedPapers = parsed.flow_rows.flatMap((row) => row.supporting_papers).filter((id) => !paperIds.has(id));
    const unsupportedConcepts = parsed.flow_rows.flatMap((row) => row.concept_ids).filter((id) => !conceptIds.has(id));
    if (unsupportedEvidence.length || unsupportedPapers.length || unsupportedConcepts.length) throw new Error("Featherless output introduced unsupported evidence, paper, or concept ids.");
    return { ...deterministic, answer_payload: parsed, flow_rows: parsed.flow_rows, answer: renderPayload(parsed), warnings: [...deterministic.warnings, "LLM synthesis applied with Featherless and validated against retrieved OKF ids."] };
  } catch (error) {
    return { ...deterministic, warnings: [...deterministic.warnings, `Featherless synthesis failed; deterministic output used. ${error instanceof Error ? error.message : "Unknown error"}`] };
  } finally {
    clearTimeout(timer);
  }
}

function renderPayload(payload: NonNullable<OkfChatResponse["answer_payload"]>) {
  const rows = payload.flow_rows.map((row, index) => `${index + 1}. Requirement: ${row.requirement_label}\n   Principle: ${row.principle_label}\n   Feature: ${row.feature_label}\n   Artifact pattern: ${row.artifact_pattern}\n   Papers: ${row.supporting_papers.join(", ")}\n   Evidence: ${row.evidence_ids.slice(0, 4).join(", ")}\n   Adaptation (${row.adaptation_status}): ${row.adaptation_text}`).join("\n\n");
  return [payload.direct_answer, `Requirement -> Principle -> Feature -> Artifact flow:\n${rows}`, `Evidence note: ${payload.evidence.length} supporting evidence reference(s) are linked inline by evidence id.`, `Boundary conditions / limitations:\n${payload.limitations.map((item) => `- ${item}`).join("\n")}`].join("\n\n");
}

