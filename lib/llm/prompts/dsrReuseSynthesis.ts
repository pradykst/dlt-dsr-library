import { z } from "zod";

export const flowRowSchema = z.object({
  row_id: z.string(),
  requirement_label: z.string(),
  principle_label: z.string(),
  feature_label: z.string(),
  artifact_pattern: z.string(),
  supporting_papers: z.array(z.string()),
  evidence_ids: z.array(z.string()),
  concept_ids: z.array(z.string()).default([]),
  adaptation_text: z.string(),
  adaptation_status: z.enum(["stored", "query_generated", "mixed"]),
  confidence: z.enum(["high", "medium-high", "medium", "low"])
});

export const answerPayloadSchema = z.object({
  direct_answer: z.string(),
  flow_rows: z.array(flowRowSchema),
  paper_support: z.array(z.object({ paper_id: z.string(), title: z.string(), reason: z.string(), score: z.number().default(0) })),
  evidence: z.array(z.object({ evidence_id: z.string(), paper_id: z.string(), concept_id: z.string().optional(), excerpt: z.string(), section: z.string().optional(), page_number: z.number().optional(), confidence: z.enum(["high", "medium-high", "medium", "low"]), relation_path: z.string().optional() })),
  query_generated_notes: z.array(z.string()),
  limitations: z.array(z.string()),
  debug: z.record(z.string(), z.unknown()).optional()
});

export type LlmAnswerPayload = z.infer<typeof answerPayloadSchema>;

export const dsrReuseSystemPrompt = "You are an evidence-grounded DSR assistant. Use only the retrieved OKF elements, relations, and evidence. Build a concise Requirement -> Principle -> Feature -> Artifact flow. Mark any domain-specific adaptation that is not directly stored as query_generated. Never claim that a paper supports something unless an evidence item or relation supports it. Return valid JSON only.";

