import { z } from "zod";

export const designMoveSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  what_to_build: z.string().min(1),
  reused_requirement: z.string().optional(),
  reused_principle: z.string().optional(),
  candidate_feature: z.string().optional(),
  artifact_pattern: z.string().optional(),
  supporting_paper_ids: z.array(z.string()).default([]),
  evidence_ids: z.array(z.string()).default([]),
  adaptation_status: z.enum(["stored", "mixed", "query_generated"]),
  adaptation_note: z.string().min(1),
  confidence: z.enum(["high", "medium-high", "medium", "low"])
});

export const paperSupportSchema = z.object({
  paper_id: z.string().min(1),
  title: z.string().min(1),
  reason: z.string().min(1),
  score: z.number().default(0)
});

export const evidenceRefSchema = z.object({
  evidence_id: z.string().min(1),
  paper_id: z.string().min(1),
  concept_id: z.string().optional(),
  excerpt: z.string().min(1),
  section: z.string().optional(),
  page_number: z.number().optional(),
  confidence: z.enum(["high", "medium-high", "medium", "low"]),
  relation_path: z.string().optional()
});

export const decisionSupportAnswerSchema = z.object({
  synthesis_mode: z.enum(["featherless", "groq", "structured_okf_answer"]),
  title: z.string().min(1),
  direct_answer: z.string().min(1),
  design_moves: z.array(designMoveSchema).max(7),
  architecture_direction: z.string().optional(),
  limitations: z.array(z.string()),
  source_papers: z.array(paperSupportSchema).max(8),
  evidence_refs: z.array(evidenceRefSchema).max(30),
  query_generated_notes: z.array(z.string()),
  debug: z.record(z.string(), z.unknown()).optional()
});

export type LlmAnswerPayload = z.infer<typeof decisionSupportAnswerSchema>;

export const dsrReuseSystemPrompt = "You are an evidence-grounded DSR decision-support assistant. Your job is to help a researcher reuse design knowledge from a curated OKF library. Do not summarize papers generically. Convert retrieved requirements, principles, features, artifacts, evaluations, and evidence into actionable design guidance for the user's design problem. Use only the retrieved context. When adapting a stored concept to the user's domain, mark it as query_generated or mixed. Do not invent papers, citations, evidence IDs, or OKF concepts. Do not use healthcare/HIE-specific labels unless the user asks about healthcare, HIE, or consent. Keep the default answer concise and readable. Return valid JSON only.";
export function parseDecisionSupportJson(content: string) {
  const raw = JSON.parse(content);
  const candidate = raw?.DecisionSupportAnswer ?? raw?.decisionSupportAnswer ?? raw?.decision_support_answer ?? raw?.answer_payload ?? raw?.answer ?? raw;
  return decisionSupportAnswerSchema.parse(normalizeDecisionSupportCandidate(candidate));
}

function normalizeDecisionSupportCandidate(value: Record<string, unknown>) {
  const normalized = { ...value };
  if (normalized.synthesis_mode !== "featherless" && normalized.synthesis_mode !== "groq" && normalized.synthesis_mode !== "structured_okf_answer") normalized.synthesis_mode = "featherless";
  normalized.limitations = arrayOfStrings(normalized.limitations);
  normalized.query_generated_notes = arrayOfStrings(normalized.query_generated_notes);
  normalized.design_moves = Array.isArray(normalized.design_moves) ? normalized.design_moves.map(normalizeDesignMove) : [];
  normalized.source_papers = Array.isArray(normalized.source_papers) ? normalized.source_papers.map(normalizeSourcePaper).filter(Boolean) : [];
  normalized.evidence_refs = Array.isArray(normalized.evidence_refs) ? normalized.evidence_refs.map(normalizeEvidenceRef).filter(Boolean) : [];
  return normalized;
}

function normalizeDesignMove(value: unknown, index: number) {
  const move = typeof value === "object" && value ? { ...(value as Record<string, unknown>) } : {};
  const fallbackTitle = stringValue(move.title) ?? stringValue(move.id) ?? `design-move-${index + 1}`;
  move.id = stringValue(move.id) ?? `design-move-${index + 1}`;
  move.title = fallbackTitle;
  move.what_to_build = stringValue(move.what_to_build) ?? stringValue(move.description) ?? stringValue(move.candidate_feature) ?? stringValue(move.artifact_pattern) ?? fallbackTitle;
  move.supporting_paper_ids = arrayOfStrings(move.supporting_paper_ids);
  move.evidence_ids = arrayOfStrings(move.evidence_ids);
  if (move.adaptation_status !== "stored" && move.adaptation_status !== "mixed" && move.adaptation_status !== "query_generated") move.adaptation_status = "mixed";
  move.adaptation_note = stringValue(move.adaptation_note) ?? "Synthesized from retrieved OKF context; query-specific interpretation is treated as mixed unless directly stored.";
  if (move.confidence !== "high" && move.confidence !== "medium-high" && move.confidence !== "medium" && move.confidence !== "low") move.confidence = "medium";
  return move;
}

function normalizeSourcePaper(value: unknown) {
  const paper = typeof value === "object" && value ? { ...(value as Record<string, unknown>) } : {};
  const paperId = stringValue(paper.paper_id);
  if (!paperId) return undefined;
  paper.paper_id = paperId;
  paper.title = stringValue(paper.title) ?? paperId;
  paper.reason = stringValue(paper.reason) ?? stringValue(paper.why_selected) ?? "selected from retrieved OKF context";
  if (typeof paper.score !== "number") paper.score = 0;
  return paper;
}
function normalizeEvidenceRef(value: unknown) {
  const evidence = typeof value === "object" && value ? { ...(value as Record<string, unknown>) } : {};
  const evidenceId = stringValue(evidence.evidence_id);
  const paperId = stringValue(evidence.paper_id);
  if (!evidenceId || !paperId) return undefined;
  evidence.evidence_id = evidenceId;
  evidence.paper_id = paperId;
  evidence.excerpt = stringValue(evidence.excerpt) ?? stringValue(evidence.description) ?? stringValue(evidence.paraphrase) ?? stringValue(evidence.quote) ?? "Selected evidence from retrieved OKF context.";
  if (evidence.confidence !== "high" && evidence.confidence !== "medium-high" && evidence.confidence !== "medium" && evidence.confidence !== "low") evidence.confidence = "medium";
  return evidence;
}
function arrayOfStrings(value: unknown) {
  if (Array.isArray(value)) return value.map((item) => String(item)).filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value];
  return [];
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}
export function decisionSupportUserPrompt(context: unknown) {
  return JSON.stringify({
    instruction: "Return exactly one JSON object. Do not wrap it in another object. The top-level object must be DecisionSupportAnswer with these exact keys: synthesis_mode, title, direct_answer, design_moves, architecture_direction, limitations, source_papers, evidence_refs, query_generated_notes. Use only IDs present in context. The direct answer should be 3-5 recommendation-first sentences. Include 5-7 design moves with concrete what_to_build text, reused OKF requirement/principle/feature, supporting papers, short evidence summary in adaptation_note, and adaptation_status. Do not expose raw IDs in prose fields.",
    response_schema: "DecisionSupportAnswer",
    context
  });
}
