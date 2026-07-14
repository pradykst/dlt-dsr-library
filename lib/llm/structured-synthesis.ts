import { z } from "zod";

import type { OkfChatResponse } from "../okf/chat.ts";
import { getOkfKnowledgeBase } from "../okf/retrieval.ts";
import type { DesignMove, OkfAnswerPayload, OkfProviderName } from "../okf/schema.ts";
import { isProviderResponseReachable, type LlmProviderStatus } from "./provider.ts";
import {
  DEFAULT_LLM_MAX_EVIDENCE_PER_MOVE,
  DEFAULT_LLM_MAX_PROMPT_CHARS,
  getLlmRuntimePolicy
} from "./runtime-policy.ts";

const synthesisTextSchema = z.string().trim().min(1).max(2_400);

export const llmMoveExplanationSchema = z.object({
  move_id: z.string().trim().min(1).max(160),
  what_to_build: synthesisTextSchema,
  reuse_logic: synthesisTextSchema,
  adaptation_boundary: synthesisTextSchema
}).strict();

export const structuredLlmSynthesisSchema = z.object({
  opening_recommendation: synthesisTextSchema,
  move_explanations: z.array(llmMoveExplanationSchema).min(1).max(7),
  architecture_direction: z.array(synthesisTextSchema).min(1).max(8),
  limitations: z.array(synthesisTextSchema).min(1).max(8)
}).strict();

export type StructuredLlmSynthesis = z.infer<typeof structuredLlmSynthesisSchema>;

type CanonicalDesignMove = DesignMove & { evidence_summaries?: string[] };

export type CompactSelectedMove = {
  move_id: string;
  stored_okf_reuse: {
    requirement?: string;
    principle?: string;
    feature?: string;
  };
  target_domain_adaptation: {
    title?: string;
    what_to_build: string;
    artifact_pattern?: string;
  };
  supporting_paper_ids: string[];
  adaptation_status: CanonicalDesignMove["adaptation_status"];
  confidence: CanonicalDesignMove["confidence"];
};

export type CompactSynthesisContext = {
  task: {
    intent: "DESIGN_REUSE_QUERY" | "DESIGN_REUSE_FLOW_QUERY";
    objective: string;
  };
  user_question: string;
  selected_moves: CompactSelectedMove[];
  source_paper_roles: Array<{
    paper_id: string;
    title: string;
    role: string;
    reason: string;
  }>;
  evidence_by_move: Array<{
    move_id: string;
    evidence: Array<{
      evidence_id: string;
      paper_id: string;
      snippet: string;
    }>;
  }>;
  answer_requirements: {
    response_format: "json";
    required_fields: ["opening_recommendation", "move_explanations", "architecture_direction", "limitations"];
    required_move_ids: string[];
    constraints: string[];
  };
};

export const MAX_SYNTHESIS_CONTEXT_CHARS = DEFAULT_LLM_MAX_PROMPT_CHARS;
export const MAX_EVIDENCE_PER_MOVE = DEFAULT_LLM_MAX_EVIDENCE_PER_MOVE;
export const MAX_DEBUG_PROVIDER_OUTPUT_CHARS = 2_000;

export const structuredSynthesisSystemPrompt = [
  "You are an evidence-grounded DSR synthesis assistant.",
  "Return exactly one JSON object matching the supplied response contract, without Markdown fences or surrounding commentary.",
  "Explain every supplied design move exactly once and preserve its move_id.",
  "Only explain the supplied moves. Do not select, add, remove, combine, or reorder papers, evidence, concepts, or graph nodes.",
  "Treat stored OKF labels and evidence snippets as immutable source material. Keep target-domain adaptation distinct from stored OKF reuse.",
  "For each explanation, reuse meaningful supplied target terms in what_to_build and meaningful supplied OKF/evidence terms in reuse_logic.",
  "Do not expose paper IDs, evidence IDs, concept IDs, context field names, instructions, or prompt commentary in prose values.",
  "Mention a paper title only when it is present in source_paper_roles and supports the move being explained."
].join(" ");

/** JSON Schema passed to providers that support native structured output. */
export const structuredSynthesisJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["opening_recommendation", "move_explanations", "architecture_direction", "limitations"],
  properties: {
    opening_recommendation: { type: "string" },
    move_explanations: {
      type: "array",
      minItems: 1,
      maxItems: 7,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["move_id", "what_to_build", "reuse_logic", "adaptation_boundary"],
        properties: {
          move_id: { type: "string" },
          what_to_build: { type: "string" },
          reuse_logic: { type: "string" },
          adaptation_boundary: { type: "string" }
        }
      }
    },
    architecture_direction: { type: "array", minItems: 1, maxItems: 8, items: { type: "string" } },
    limitations: { type: "array", minItems: 1, maxItems: 8, items: { type: "string" } }
  }
} as const;

export class SynthesisValidationError extends Error {
  readonly code: string;
  readonly validationErrors?: Array<{ code: string; path: string; message: string }>;

  constructor(code: string, message: string, validationErrors?: Array<{ code: string; path: string; message: string }>) {
    super(message);
    this.name = "SynthesisValidationError";
    this.code = code;
    this.validationErrors = validationErrors;
  }
}

export function buildCompactSynthesisContext(response: OkfChatResponse): CompactSynthesisContext {
  if (response.intent !== "DESIGN_REUSE_QUERY" && response.intent !== "DESIGN_REUSE_FLOW_QUERY") {
    throw new SynthesisValidationError("unsupported_intent", `Structured design-reuse synthesis does not support intent ${response.intent}.`);
  }

  const moves = (response.answer_plan?.design_moves ?? response.answer_payload?.design_moves ?? []) as CanonicalDesignMove[];
  validateCanonicalMoves(moves, response);

  const policy = getLlmRuntimePolicy();
  if (moves.length > policy.maxMoves) {
    throw new SynthesisValidationError("context_move_limit", `Compact synthesis context has ${moves.length} moves; configured maximum is ${policy.maxMoves}.`);
  }

  // Reduce only by removing whole evidence records. Stored OKF text is never
  // clipped or rewritten to satisfy a runtime budget.
  let lastPromptSize = 0;
  for (let evidenceLimit = policy.maxEvidencePerMove; evidenceLimit >= 1; evidenceLimit -= 1) {
    const context = makeCompactContext(response, moves, evidenceLimit, policy.maxContextEvidence);
    lastPromptSize = compactPromptSize(context);
    if (lastPromptSize <= policy.maxPromptChars) return context;
  }

  throw new SynthesisValidationError(
    "context_too_large",
    `Structured synthesis prompt is ${lastPromptSize} characters after safe compression; configured maximum is ${policy.maxPromptChars}.`
  );
}

function makeCompactContext(response: OkfChatResponse, moves: CanonicalDesignMove[], evidenceLimit: number, totalEvidenceLimit: number): CompactSynthesisContext {
  const answerPlanEvidence = response.answer_plan?.evidence_pack ?? [];
  const evidenceById = new Map(answerPlanEvidence.map((item) => [item.evidence_id, item]));
  const responseEvidenceById = new Map(response.evidence.map((item) => [item.evidence_id, {
    evidence_id: item.evidence_id,
    paper_id: item.paper_id,
    excerpt: item.quote ?? item.paraphrase
  }]));
  const paperById = new Map([
    ...(response.answer_plan?.selected_papers ?? []).map((paper) => [paper.paper_id, {
      paper_id: paper.paper_id,
      title: paper.title,
      role: paper.role_for_query,
      reason: paper.reason_for_selection
    }] as const),
    ...response.source_papers.map((paper) => [paper.paper_id, {
      paper_id: paper.paper_id,
      title: paper.title,
      role: paper.role,
      reason: paper.reason
    }] as const)
  ]);
  const usedPaperIds = unique(moves.flatMap((move) => move.supporting_paper_ids));

  const seenEvidenceIds = new Set<string>();
  const seenEvidenceSnippets = new Set<string>();
  let retainedEvidenceCount = 0;
  // Canonical move order is already ranked; assign each evidence record to its first eligible move.
  const compactEvidenceByMove: CompactSynthesisContext["evidence_by_move"] = moves.map((move) => {
    const retained: CompactSynthesisContext["evidence_by_move"][number]["evidence"] = [];
    for (const [evidenceIndex, evidenceId] of move.evidence_ids.entries()) {
      if (retained.length >= evidenceLimit || retainedEvidenceCount >= totalEvidenceLimit) break;
      const evidence = evidenceById.get(evidenceId) ?? responseEvidenceById.get(evidenceId);
      if (!evidence) throw new SynthesisValidationError("unknown_evidence", `Move ${move.id} references unknown evidence ${evidenceId}.`);
      if (!move.supporting_paper_ids.includes(evidence.paper_id)) {
        throw new SynthesisValidationError("evidence_paper_mismatch", `Evidence ${evidenceId} is not from a supporting paper for move ${move.id}.`);
      }
      const paper = paperById.get(evidence.paper_id);
      if (!paper) throw new SynthesisValidationError("unknown_evidence_paper", `Evidence ${evidenceId} references unknown paper ${evidence.paper_id}.`);
      const summary = move.evidence_summaries?.[evidenceIndex]?.trim();
      const snippet = summary || evidence.excerpt;
      const evidenceKey = evidence.evidence_id.toLowerCase();
      const snippetKey = normalizeComparable(snippet) || snippet.trim().toLowerCase();
      if (seenEvidenceIds.has(evidenceKey) || seenEvidenceSnippets.has(snippetKey)) continue;
      seenEvidenceIds.add(evidenceKey);
      seenEvidenceSnippets.add(snippetKey);
      retained.push({ evidence_id: evidence.evidence_id, paper_id: evidence.paper_id, snippet });
      retainedEvidenceCount += 1;
    }
    return { move_id: move.id, evidence: retained };
  });
  for (const [index, entry] of compactEvidenceByMove.entries()) {
    if (entry.evidence.length) continue;
    const move = moves[index];
    const hasStoredBasis = Boolean(move.reused_requirement || move.reused_principle || move.candidate_feature);
    const safeQueryGeneratedMove = move.adaptation_status === "query_generated" && (move.confidence === "low" || move.confidence === "medium");
    if (!hasStoredBasis && !safeQueryGeneratedMove) {
      throw new SynthesisValidationError("deduplicated_move_ungrounded", `Evidence deduplication left move ${move.id} without a reusable basis.`);
    }
  }

  return {
    task: {
      intent: response.intent as "DESIGN_REUSE_QUERY" | "DESIGN_REUSE_FLOW_QUERY",
      objective: "Explain the supplied canonical design moves as a concise, evidence-grounded recommendation without selecting new facts."
    },
    user_question: response.answer_plan?.user_query ?? response.interpreted_problem ?? "",
    selected_moves: moves.map((move) => ({
      move_id: move.id,
      stored_okf_reuse: compactObject({
        requirement: move.reused_requirement,
        principle: move.reused_principle,
        feature: move.candidate_feature
      }),
      target_domain_adaptation: compactObject({
        what_to_build: move.what_to_build,
        title: [move.reused_requirement, move.reused_principle, move.candidate_feature]
          .some((label) => label && normalizeComparable(label) === normalizeComparable(move.title))
          ? undefined : move.title,
        artifact_pattern: move.artifact_pattern
      }) as CompactSelectedMove["target_domain_adaptation"],
      supporting_paper_ids: [...move.supporting_paper_ids],
      adaptation_status: move.adaptation_status,
      confidence: move.confidence
    })),
    source_paper_roles: usedPaperIds.map((paperId) => {
      const paper = paperById.get(paperId);
      if (!paper) throw new SynthesisValidationError("unknown_supporting_paper", `Move references unknown supporting paper ${paperId}.`);
      return { paper_id: paper.paper_id, title: paper.title, role: paper.role, reason: paper.reason };
    }),
    evidence_by_move: compactEvidenceByMove,
    answer_requirements: {
      response_format: "json",
      required_fields: ["opening_recommendation", "move_explanations", "architecture_direction", "limitations"],
      required_move_ids: moves.map((move) => move.id),
      constraints: [
        "Explain every required move exactly once.",
        "Use only supplied source roles and evidence.",
        "Keep stored OKF reuse distinct from target-domain adaptation.",
        "Do not expose internal IDs except move_id in its schema field."
      ]
    }
  };
}

function validateCanonicalMoves(moves: CanonicalDesignMove[], response: OkfChatResponse) {
  if (moves.length < 5 || moves.length > 7) {
    throw new SynthesisValidationError("invalid_move_count", `Design-reuse synthesis requires 5-7 canonical moves; received ${moves.length}.`);
  }

  const moveIds = new Set<string>();
  const evidenceById = new Map((response.answer_plan?.evidence_pack ?? response.evidence).map((item) => [item.evidence_id, item]));
  const knownPaperIds = new Set([
    ...(response.answer_plan?.selected_papers ?? []).map((paper) => paper.paper_id),
    ...response.source_papers.map((paper) => paper.paper_id)
  ]);

  for (const move of moves) {
    if (!move.id.trim() || moveIds.has(move.id)) throw new SynthesisValidationError("duplicate_move_id", `Canonical move id is empty or duplicated: ${move.id}.`);
    moveIds.add(move.id);
    if (!move.title.trim() || !move.what_to_build.trim()) throw new SynthesisValidationError("incomplete_move", `Canonical move ${move.id} is missing its title or build direction.`);
    if (move.supporting_paper_ids.some((paperId) => !knownPaperIds.has(paperId))) throw new SynthesisValidationError("unknown_supporting_paper", `Canonical move ${move.id} references an unknown supporting paper.`);

    const uniqueEvidenceIds = new Set(move.evidence_ids);
    if (uniqueEvidenceIds.size !== move.evidence_ids.length) throw new SynthesisValidationError("duplicate_move_evidence", `Canonical move ${move.id} contains duplicate evidence ids.`);
    if (!move.evidence_ids.length && !(move.adaptation_status === "query_generated" && (move.confidence === "low" || move.confidence === "medium"))) {
      throw new SynthesisValidationError("ungrounded_move", `Canonical move ${move.id} has no evidence and is not an explicitly low/medium-confidence query-generated move.`);
    }
    for (const evidenceId of move.evidence_ids) {
      const evidence = evidenceById.get(evidenceId);
      if (!evidence) throw new SynthesisValidationError("unknown_evidence", `Canonical move ${move.id} references unknown evidence ${evidenceId}.`);
      if (!move.supporting_paper_ids.includes(evidence.paper_id)) throw new SynthesisValidationError("evidence_paper_mismatch", `Evidence ${evidenceId} is not from a supporting paper for move ${move.id}.`);
    }
  }
}

export function compactContextSize(context: CompactSynthesisContext) {
  return JSON.stringify(context).length;
}

export function structuredSynthesisUserPrompt(context: CompactSynthesisContext) {
  return JSON.stringify(context);
}

export function compactPromptSize(context: CompactSynthesisContext) {
  return structuredSynthesisSystemPrompt.length + structuredSynthesisUserPrompt(context).length;
}


function compactMoveHeading(move: CompactSelectedMove) {
  return move.target_domain_adaptation.title
    ?? move.stored_okf_reuse.principle
    ?? move.stored_okf_reuse.requirement
    ?? move.stored_okf_reuse.feature
    ?? move.target_domain_adaptation.what_to_build;
}

/** Deterministic in-process provider used by tests; it still crosses the production schema and guard. */
export function buildDeterministicMockSynthesis(context: CompactSynthesisContext): StructuredLlmSynthesis {
  const evidenceByMove = new Map(context.evidence_by_move.map((item) => [item.move_id, item.evidence]));
  return structuredLlmSynthesisSchema.parse({
    opening_recommendation: "Implement the supplied canonical moves as one evidence-grounded architecture and keep target-specific choices explicit.",
    move_explanations: context.selected_moves.map((move) => {
      const heading = compactMoveHeading(move);
      const reuseBasis = [
        move.stored_okf_reuse.requirement,
        move.stored_okf_reuse.principle,
        move.stored_okf_reuse.feature,
        ...(evidenceByMove.get(move.move_id) ?? []).slice(0, 1).map((evidence) => evidence.snippet)
      ].filter((value): value is string => Boolean(value));
      return {
        move_id: move.move_id,
        what_to_build: `Implement ${move.target_domain_adaptation.what_to_build} as the bounded ${heading} capability.`,
        reuse_logic: `Ground this move in the supplied OKF basis: ${reuseBasis.join("; ")}.`,
        adaptation_boundary: `Preserve the stored basis for ${heading}; validate target-domain behavior separately.`
      };
    }),
    architecture_direction: [
      "Connect the supplied move-level capabilities through explicit verification, governance, and operational boundaries.",
      "Keep every implementation decision traceable to its canonical move and evidence."
    ],
    limitations: ["The selected evidence supports reusable design logic, not a completed or evaluated target-domain artifact."]
  });
}

export type AnswerGuardOptions = {
  provider: "gemini" | "groq" | "mock";
  finishReason?: string;
  context: CompactSynthesisContext;
  response: OkfChatResponse;
  /** All papers loaded for this request. Omit only when the local KB is the request KB. */
  knownPaperSources?: Array<{ paper_id: string; title: string }>;
};

export function guardStructuredSynthesis(rawOutput: string, options: AnswerGuardOptions): StructuredLlmSynthesis {
  validateFinishReason(options.provider, options.finishReason);
  const parsed = parseStructuredSynthesisJson(rawOutput);
  validateMoveCoverage(parsed, options.context);

  const prose = synthesisProse(parsed);
  validateNoLeakage(prose);
  validateNoRawIds(prose, options.response);
  validateNoUnsupportedSources(prose, options.context, options.response, options.knownPaperSources);
  validateNoCitationLikeReferences(prose, options.context);
  validateMoveGrounding(parsed, options.context);
  validateMoveSourceAlignment(parsed, options.context);
  validateNotQuoteOnly(parsed, options.context, options.response);
  validateNoSourceTitleTail(parsed, options.context);
  return parsed;
}

function validateFinishReason(provider: AnswerGuardOptions["provider"], finishReason: string | undefined) {
  const normalized = finishReason?.trim().toUpperCase();
  if (normalized !== "STOP") {
    throw new SynthesisValidationError(
      "incomplete_finish_reason",
      `${provider} synthesis finish reason was ${finishReason || "missing"}; expected STOP.`
    );
  }
}

export function parseStructuredSynthesisJson(content: string): StructuredLlmSynthesis {
  if (!content.trim()) throw new SynthesisValidationError("empty_output", "Provider returned an empty synthesis response.");
  const stripped = stripJsonFence(content);
  let candidate: unknown;
  try {
    candidate = JSON.parse(stripped);
  } catch {
    throw new SynthesisValidationError("invalid_json", "Provider response was not valid JSON.");
  }
  const result = structuredLlmSynthesisSchema.safeParse(candidate);
  if (!result.success) {
    const validationErrors = result.error.issues.map((issue) => ({
      code: issue.code,
      path: issue.path.length ? issue.path.join(".") : "response",
      message: issue.message
    }));
    const first = validationErrors[0];
    throw new SynthesisValidationError("schema_validation_failed", `Structured synthesis is invalid at ${first?.path ?? "response"}: ${first?.message ?? "schema mismatch"}.`, validationErrors);
  }
  return result.data;
}

function validateMoveCoverage(synthesis: StructuredLlmSynthesis, context: CompactSynthesisContext) {
  const required = context.answer_requirements.required_move_ids;
  const actual = synthesis.move_explanations.map((move) => move.move_id);
  const actualSet = new Set(actual);
  if (actualSet.size !== actual.length) throw new SynthesisValidationError("duplicate_move_explanation", "Provider returned duplicate move explanations.");
  const missing = required.filter((moveId) => !actualSet.has(moveId));
  const unsupported = actual.filter((moveId) => !required.includes(moveId));
  if (missing.length || unsupported.length || actual.length !== required.length) {
    throw new SynthesisValidationError("move_coverage_mismatch", `Provider must explain all ${required.length} supplied moves exactly once.`);
  }
}

function validateNoLeakage(prose: string) {
  const leakagePatterns: Array<[RegExp, string]> = [
    [/\bprompt\s+context\b/i, "prompt context"],
    [/\bthe\s+(?:prompt\s+)?context\s+(?:has|contains|says|provides)\b/i, "context commentary"],
    [/\bI\s+will\s+use\b/i, "planning commentary"],
    [/\buse\s+exact\s+text\b/i, "instruction commentary"],
    [/\bsystem\s+prompt\b/i, "system prompt"],
    [/\bdesign\s+moves?\s*(?:\/|and)\s*flow\s+rows?\b/i, "design moves/flow rows"],
    [/\b(?:answer_plan|evidence_pack|flow_rows|retrieved_context_json|selected_moves|source_paper_roles|evidence_by_move|answer_requirements|opening_recommendation|move_explanations|architecture_direction|move_id|paper_ids?|paper_title|supporting_paper_ids|concept_ids?|evidence_ids?|adaptation_status|stored_okf_reuse|target_domain_adaptation|raw_graph)\b/i, "internal field name"],
    [/(?:^|\n)\s*Note\s*:/i, "meta note"]
  ];
  const matched = leakagePatterns.find(([pattern]) => pattern.test(prose));
  if (matched) throw new SynthesisValidationError("prompt_leakage", `Provider output contains prohibited ${matched[1]} language.`);
}

function validateNoRawIds(prose: string, response: OkfChatResponse) {
  const ids = unique([
    ...response.evidence.map((item) => item.evidence_id),
    ...response.retrieved_concepts.map((concept) => concept.concept_id),
    ...response.source_papers.map((paper) => paper.paper_id),
    ...(response.answer_plan?.selected_papers ?? []).map((paper) => paper.paper_id)
  ]).filter((id) => id.length >= 4);
  const containsKnownId = ids.some((id) => containsToken(prose, id));
  const containsIdShape = /\b(?:ev|evidence)[_:][A-Za-z0-9_.:-]+\b|\b[A-Z][A-Z0-9_]{2,}:[A-Za-z0-9_.:-]+\b|\b(?:[A-Z][A-Z0-9]+_){2,}(?:19|20)\d{2}\b/i.test(prose);
  if (containsKnownId || containsIdShape) throw new SynthesisValidationError("raw_internal_id", "Provider prose contains a raw paper, evidence, or concept id.");
}

function validateNoUnsupportedSources(
  prose: string,
  context: CompactSynthesisContext,
  response: OkfChatResponse,
  suppliedKnownPapers?: Array<{ paper_id: string; title: string }>
) {
  const allowedIds = new Set(context.source_paper_roles.map((paper) => paper.paper_id));
  const knownPapers = uniqueBy(
    [
      ...response.source_papers.map((paper) => ({ paper_id: paper.paper_id, title: paper.title })),
      ...(response.answer_plan?.selected_papers ?? []).map((paper) => ({ paper_id: paper.paper_id, title: paper.title })),
      ...(suppliedKnownPapers ?? getOkfKnowledgeBase().papers.map((paper) => ({ paper_id: paper.paper_id, title: paper.title })))
    ],
    (paper) => paper.paper_id
  );
  const unsupported = knownPapers.find((paper) => !allowedIds.has(paper.paper_id) && containsNormalizedPhrase(prose, paper.title));
  if (unsupported) throw new SynthesisValidationError("unsupported_source", `Provider mentioned an unsupported source paper: ${unsupported.title}.`);
}


function validateNoCitationLikeReferences(prose: string, context: CompactSynthesisContext) {
  const allowedTitles = context.source_paper_roles.flatMap((paper) => [paper.title, shortPaperTitle(paper.title)]);
  const suppliedMaterial = [
    ...context.selected_moves.flatMap((move) => [
      move.target_domain_adaptation.title,
      move.target_domain_adaptation.what_to_build,
      move.target_domain_adaptation.artifact_pattern,
      move.stored_okf_reuse.requirement,
      move.stored_okf_reuse.principle,
      move.stored_okf_reuse.feature
    ]),
    ...context.evidence_by_move.flatMap((item) => item.evidence.map((evidence) => evidence.snippet))
  ].filter((value): value is string => Boolean(value));
  const prohibitedPatterns: Array<[RegExp, string]> = [
    [/https?:\/\/|\bwww\./i, "external URL"],
    [/\b(?:doi\s*:|arxiv\s*:|10\.\d{4,9}\/[A-Za-z0-9./_-]+)/i, "external citation identifier"],
    [/(?:^|\n)\s*(?:sources?|references?|citations?|bibliography)\s*:/i, "source/reference annotation"],
    [/\[\s*\d+(?:\s*[-,]\s*\d+)*\s*\]/, "numeric citation"],
    [/\([A-Z][A-Za-z\x27.-]+(?:\s+et\s+al\.)?,?\s*(?:19|20)\d{2}[a-z]?\)/, "author-year citation"],
  ];
  const prohibited = prohibitedPatterns.find(([pattern]) => pattern.test(prose));
  if (prohibited) throw new SynthesisValidationError("unsupported_citation", `Provider output contains a prohibited ${prohibited[1]}.`);


  const titleYearPattern = /\b([A-Z][A-Za-z0-9\x27&:-]+(?:\s+(?:(?:a|an|and|for|in|of|on|the|to|with)|[A-Z][A-Za-z0-9\x27&:-]+)){2,15})\s*\((?:19|20)\d{2}\)/g;
  for (const match of prose.matchAll(titleYearPattern)) {
    if (!isAllowedCitationTarget(match[1], allowedTitles)) {
      throw new SynthesisValidationError("unsupported_citation", "Provider output contains an unknown title-year paper or source reference.");
    }
  }

  for (const match of prose.matchAll(/[\u201c"]([^\u201d"\n]{4,160})[\u201d"]/g)) {
    const candidate = match[1].trim();
    const titleCaseWords = candidate.split(/\s+/).filter((word) => /^[A-Z]/.test(word)).length;
    const looksLikeTitle = titleCaseWords >= 3 || /\b(?:study|paper|article|framework|architecture)\b/i.test(candidate);
    if (looksLikeTitle && !isAllowedCitationTarget(candidate, allowedTitles) && !isSuppliedQuotedMaterial(candidate, suppliedMaterial)) {
      throw new SynthesisValidationError("unsupported_citation", "Provider output contains an unknown quoted paper or source title.");
    }
  }

  const attributionPattern = /\b(?:according to|as (?:reported|described|shown|argued) in|from the (?:paper|study|article)|the (?:paper|study|article)(?: titled)?)\s+([^,.;\n]{4,120})/gi;
  for (const match of prose.matchAll(attributionPattern)) {
    const candidate = match[1].trim();
    const genericGrounding = /^(?:the\s+)?(?:supplied|selected|retrieved|provided|current|this)\s+(?:evidence|paper|study|context|move)/i.test(candidate);
    if (!genericGrounding && !isAllowedCitationTarget(candidate, allowedTitles)) {
      throw new SynthesisValidationError("unsupported_citation", "Provider output attributes a claim to an unknown paper or source.");
    }
  }
}

function isAllowedCitationTarget(value: string, allowedTitles: string[]) {
  const normalized = normalizeComparable(value).replace(/^the\s+/, "");
  return allowedTitles.some((title) => {
    const allowed = normalizeComparable(title);
    return allowed.length >= 8 && (normalized === allowed || normalized.includes(allowed));
  });
}

function isSuppliedQuotedMaterial(value: string, suppliedMaterial: string[]) {
  const candidate = normalizeComparable(value);
  return candidate.length >= 8 && suppliedMaterial.some((item) => normalizeComparable(item).includes(candidate));
}

function validateMoveGrounding(synthesis: StructuredLlmSynthesis, context: CompactSynthesisContext) {

  const moveById = new Map(context.selected_moves.map((move) => [move.move_id, move]));
  const evidenceByMove = new Map(context.evidence_by_move.map((item) => [item.move_id, item.evidence]));
  for (const explanation of synthesis.move_explanations) {
    const move = moveById.get(explanation.move_id);
    if (!move) continue;
    requireGroundedField(
      explanation.what_to_build,
      [compactMoveHeading(move), move.target_domain_adaptation.what_to_build, move.target_domain_adaptation.artifact_pattern],
      "what_to_build",
      move.move_id
    );
    const reuseBasis = [
      move.stored_okf_reuse.requirement,
      move.stored_okf_reuse.principle,
      move.stored_okf_reuse.feature,
      ...(evidenceByMove.get(move.move_id) ?? []).map((evidence) => evidence.snippet)
    ];
    if (meaningfulGroundingTokens(reuseBasis).size) {
      requireGroundedField(explanation.reuse_logic, reuseBasis, "reuse_logic", move.move_id);
    }
  }
}

function requireGroundedField(output: string, basis: Array<string | undefined>, field: string, moveId: string) {
  const basisTokens = meaningfulGroundingTokens(basis);
  const outputTokens = meaningfulGroundingTokens([output]);
  const requiredOverlap = Math.min(2, basisTokens.size);
  const overlap = [...basisTokens].filter((token) => outputTokens.has(token)).length;
  if (!requiredOverlap || overlap < requiredOverlap) {
    throw new SynthesisValidationError("move_grounding_insufficient", `Provider ${field} for ${moveId} is not grounded in the supplied move.`);
  }
}

const groundingStopWords = new Set([
  "about", "adaptation", "and", "architecture", "bounded", "build", "component", "design", "domain",
  "evidence", "feature", "from", "grounded", "implement", "implementation", "into", "logic", "move",
  "moves", "only", "paper", "principle", "provided", "requirement", "reuse", "reused", "selected",
  "source", "stored", "supplied", "system", "target", "that", "their", "these", "this", "through",
  "using", "with", "without"
]);

function meaningfulGroundingTokens(values: Array<string | undefined>) {
  return new Set(
    values
      .filter((value): value is string => Boolean(value))
      .flatMap((value) => normalizeComparable(value).split(/\s+/))
      .filter((token) => token.length >= 4 && !groundingStopWords.has(token))
  );
}

function validateMoveSourceAlignment(synthesis: StructuredLlmSynthesis, context: CompactSynthesisContext) {
  const moveById = new Map(context.selected_moves.map((move) => [move.move_id, move]));
  for (const explanation of synthesis.move_explanations) {
    const move = moveById.get(explanation.move_id);
    if (!move) continue;
    const allowedPaperIds = new Set(move.supporting_paper_ids);
    const explanationText = [explanation.what_to_build, explanation.reuse_logic, explanation.adaptation_boundary].join(" ");
    const misplaced = context.source_paper_roles.find((paper) => {
      if (allowedPaperIds.has(paper.paper_id)) return false;
      return [paper.title, shortPaperTitle(paper.title)]
        .filter((title) => normalizeComparable(title).length >= 12)
        .some((title) => containsNormalizedPhrase(explanationText, title));
    });
    if (misplaced) throw new SynthesisValidationError("move_source_mismatch", `Provider attributed ${misplaced.title} to a move it does not support.`);
  }
}

function validateNotQuoteOnly(synthesis: StructuredLlmSynthesis, context: CompactSynthesisContext, response: OkfChatResponse) {
  const labels = unique([
    ...context.selected_moves.flatMap((move) => [
      compactMoveHeading(move),
      move.stored_okf_reuse.requirement,
      move.stored_okf_reuse.principle,
      move.stored_okf_reuse.feature
    ]),
    ...context.evidence_by_move.flatMap((item) => item.evidence.map((evidence) => evidence.snippet)),
    ...response.retrieved_concepts.map((concept) => concept.title)
  ].filter((value): value is string => Boolean(value)));
  const normalizedLabels = new Set(labels.map(normalizeComparable));
  const proseFields = [
    synthesis.opening_recommendation,
    ...synthesis.move_explanations.flatMap((move) => [move.what_to_build, move.reuse_logic, move.adaptation_boundary]),
    ...synthesis.architecture_direction,
    ...synthesis.limitations
  ];
  const copiedLabel = proseFields.find((field) => normalizedLabels.has(normalizeComparable(field)));
  if (copiedLabel) {
    throw new SynthesisValidationError("quote_only_output", "A provider response field is only a copied concept or design-move label.");
  }
  if (proseFields.some(isOnlyQuotedFragment)) {
    throw new SynthesisValidationError("quote_only_output", "A provider response field is only a quoted fragment.");
  }
}
function validateNoSourceTitleTail(synthesis: StructuredLlmSynthesis, context: CompactSynthesisContext) {
  const titles = context.source_paper_roles.flatMap((paper) => [paper.title, shortPaperTitle(paper.title)]);
  const proseFields = [
    synthesis.opening_recommendation,
    ...synthesis.move_explanations.flatMap((move) => [move.what_to_build, move.reuse_logic, move.adaptation_boundary]),
    ...synthesis.architecture_direction,
    ...synthesis.limitations
  ];
  if (proseFields.some((field) => hasNakedSourceTitleTail(field, titles))) {
    throw new SynthesisValidationError("source_title_tail", "Provider output ends with a naked or annotated source-paper title.");
  }
}

export function hasNakedSourceTitleTail(value: string, paperTitles: string[]) {
  const tail = value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).at(-1);
  if (!tail) return false;
  const normalizedTail = normalizeComparable(
    tail
      .replace(/^[-*\d.)\s]+/, "")
      .replace(/^(?:source(?:\s+paper)?|paper|from)\s*:\s*/i, "")
      .replace(/\s*(?:[-–—:]\s*)?(?:\((?:source\s+paper|source|paper)\)|\[(?:source\s+paper|source|paper)\]|(?:source\s+paper|source|paper))\s*$/i, "")
      .replace(/^\*+|\*+$/g, "")
  );
  return paperTitles.some((title) => normalizeComparable(title) === normalizedTail);
}

export function renderStructuredSynthesisMarkdown(synthesis: StructuredLlmSynthesis, context: CompactSynthesisContext) {
  const explanationById = new Map(synthesis.move_explanations.map((move) => [move.move_id, move]));
  const paperTitleById = new Map(context.source_paper_roles.map((paper) => [paper.paper_id, paper.title]));
  const moveSections = context.selected_moves.map((move, index) => {
    const explanation = explanationById.get(move.move_id);
    if (!explanation) throw new SynthesisValidationError("missing_move_explanation", `Missing explanation for move ${move.move_id}.`);
    const storedBasis = [
      move.stored_okf_reuse.requirement ? `Requirement: ${move.stored_okf_reuse.requirement}` : undefined,
      move.stored_okf_reuse.principle ? `Principle: ${move.stored_okf_reuse.principle}` : undefined,
      move.stored_okf_reuse.feature ? `Feature: ${move.stored_okf_reuse.feature}` : undefined
    ].filter((value): value is string => Boolean(value)).join(" → ");
    const papers = move.supporting_paper_ids.map((paperId) => paperTitleById.get(paperId)).filter((title): title is string => Boolean(title));
    return [
      `### ${index + 1}. ${cleanInline(compactMoveHeading(move))}`,
      `- **What to build:** ${cleanInline(explanation.what_to_build)}`,
      storedBasis ? `- **Stored OKF basis:** ${cleanInline(storedBasis)}` : undefined,
      `- **Reuse logic:** ${cleanInline(explanation.reuse_logic)}`,
      `- **Adaptation boundary:** ${cleanInline(explanation.adaptation_boundary)}`,
      papers.length ? `- **Supported by:** ${papers.map(cleanInline).join("; ")}` : undefined,
      `- **Adaptation status:** ${humanizeAdaptationStatus(move.adaptation_status)}; confidence ${move.confidence}.`
    ].filter(Boolean).join("\n");
  });

  return [
    "# Recommendation",
    cleanBlock(synthesis.opening_recommendation),
    "## Design moves to reuse",
    moveSections.join("\n\n"),
    "## Suggested architecture direction",
    synthesis.architecture_direction.map((item) => `- ${cleanInline(item)}`).join("\n"),
    "## What not to overclaim",
    synthesis.limitations.map((item) => `- ${cleanInline(item)}`).join("\n")
  ].join("\n\n");
}

export function mergeSynthesisIntoAnswerPayload(
  response: OkfChatResponse,
  synthesis: StructuredLlmSynthesis,
  provider: "gemini" | "groq" | "mock"
): OkfAnswerPayload {
  const canonicalMoves = (response.answer_plan?.design_moves ?? response.answer_payload?.design_moves ?? []) as DesignMove[];
  const existing = response.answer_payload;
  return {
    synthesis_mode: provider,
    title: existing?.title ?? "OKF design-reuse recommendation",
    direct_answer: synthesis.opening_recommendation,
    design_moves: canonicalMoves,
    architecture_direction: synthesis.architecture_direction.join(" "),
    limitations: synthesis.limitations,
    source_papers: existing?.source_papers ?? response.source_papers.map((paper) => ({
      paper_id: paper.paper_id,
      title: paper.title,
      reason: paper.reason,
      score: paper.score ?? 0
    })),
    evidence_refs: existing?.evidence_refs ?? response.evidence.map((item) => ({
      evidence_id: item.evidence_id,
      paper_id: item.paper_id,
      concept_id: item.concept_id,
      excerpt: item.quote ?? item.paraphrase,
      section: item.section,
      page_number: item.page_number,
      confidence: item.confidence as "high" | "medium-high" | "medium" | "low"
    })),
    query_generated_notes: existing?.query_generated_notes ?? []
  };
}

export type SynthesisFallbackOptions = {
  provider: Extract<OkfProviderName, "gemini" | "groq">;
  reason: string;
  validationError: boolean;
  configured: boolean;
  connected: boolean;
  attempted: boolean;
  status?: number;
  errorType?: string;
  model?: string;
  baseUrl?: string;
  rawProviderError?: string;
  rawProviderOutput?: string;
  finishReason?: string;
  synthesisAttempted?: boolean;
  plannerStatus?: unknown;
  compactContext?: CompactSynthesisContext;
  validationErrors?: Array<{ code: string; path: string; message: string }>;
};

export function applySynthesisFallback(response: OkfChatResponse, options: SynthesisFallbackOptions): OkfChatResponse {
  const rateLimited = !options.validationError && isRateLimit(options.reason, options.status, options.errorType);
  const synthesisMode = options.validationError
    ? "fallback_validation_error" as const
    : rateLimited
      ? "fallback_rate_limited" as const
      : "fallback_provider_error" as const;
  const answerPayload = response.answer_payload ? { ...response.answer_payload, synthesis_mode: synthesisMode } : response.answer_payload;
  const providerStatus = {
    provider: options.provider,
    configured: options.configured,
    reachable: isProviderResponseReachable(options.status, options.errorType),
    attempted: options.attempted,
    http_status: options.status,
    outcome: !options.configured ? "not_configured" : options.validationError ? "validation_error" : rateLimited ? "rate_limited" : "provider_error",
    error_type: options.errorType ?? (options.validationError ? "answer_validation_error" : undefined),
    fallback_reason: options.reason
  } satisfies LlmProviderStatus;
  return {
    ...response,
    // The provider output is diagnostic only. The deterministic, already structured answer remains canonical.
    answer: response.answer,
    answer_payload: answerPayload,
    llm_synthesis: {
      synthesis_mode: synthesisMode,
      answer_markdown: response.answer,
      provider_metadata: {
        provider: options.provider,
        model: options.model,
        status: options.status,
        error_type: options.errorType ?? (options.validationError ? "answer_validation_error" : undefined),
        base_url: options.baseUrl
      },
      debug: {
        fallback_reason: options.reason,
        guard_outcome: options.validationError ? "rejected" : "not_validated",
        planner_status: options.plannerStatus,
        provider_response_status: options.status,
        provider_error_type: options.errorType,
        finish_reason: options.finishReason,
        validation_errors: options.validationErrors,
        raw_provider_error: redactAndTruncate(options.rawProviderError),
        raw_provider_output: redactAndTruncate(options.rawProviderOutput),
        compact_context: options.compactContext,
        compact_context_chars: options.compactContext ? compactContextSize(options.compactContext) : undefined
      }
    },
    runtime: {
      ...response.runtime,
      provider_configured: options.configured,
      provider_connected: options.connected,
      synthesis_attempted: options.synthesisAttempted ?? options.attempted,
      synthesis_mode: synthesisMode,
      provider: options.provider,
      fallback_reason: options.reason,
      provider_status_code: options.status,
      provider_error_type: options.errorType ?? (options.validationError ? "answer_validation_error" : undefined),
      provider_status: providerStatus
    },
    warnings: [...response.warnings, `${providerLabel(options.provider)} synthesis was not used. ${options.reason}`]
  };
}

export function redactAndTruncate(value: string | undefined, limit = MAX_DEBUG_PROVIDER_OUTPUT_CHARS) {
  if (!value) return undefined;
  const redacted = value
    .replace(/([?&](?:key|api_key|token)=)[^&\s"']+/gi, "$1[REDACTED]")
    .replace(/\bBearer\s+[A-Za-z0-9._~+\/-]+=*/gi, "Bearer [REDACTED]")
    .replace(/\b(?:AIza|gsk_)[A-Za-z0-9_-]{12,}\b/g, "[REDACTED]");
  return redacted.length > limit ? `${redacted.slice(0, limit)}…[truncated]` : redacted;
}

function synthesisProse(synthesis: StructuredLlmSynthesis) {
  return [
    synthesis.opening_recommendation,
    ...synthesis.move_explanations.flatMap((move) => [move.what_to_build, move.reuse_logic, move.adaptation_boundary]),
    ...synthesis.architecture_direction,
    ...synthesis.limitations
  ].join("\n");
}

function stripJsonFence(value: string) {
  return value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

function compactObject<T extends Record<string, string | undefined>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].length > 0)) as T;
}

function cleanInline(value: string) {
  return value.replace(/\s+/g, " ").trim().replace(/([\\`*_\[\]<>#])/g, "\\$1");
}

function cleanBlock(value: string) {
  return cleanInline(value);
}

function humanizeAdaptationStatus(status: CanonicalDesignMove["adaptation_status"]) {
  return status === "query_generated" ? "query-generated" : status;
}

function providerLabel(provider: "gemini" | "groq") {
  return provider === "gemini" ? "Gemini" : "Groq";
}

function isRateLimit(reason: string, status?: number, errorType?: string) {
  return status === 429 || status === 503 || /RESOURCE_EXHAUSTED|UNAVAILABLE|rate.?limit|quota|429|503|high demand|overload/i.test(`${errorType ?? ""} ${reason}`);
}

function containsToken(haystack: string, token: string) {
  const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^A-Za-z0-9_.:-])${escaped}(?:$|[^A-Za-z0-9_.:-])`, "i").test(haystack);
}

function containsNormalizedPhrase(haystack: string, phrase: string) {
  const normalizedHaystack = ` ${normalizeComparable(haystack)} `;
  const normalizedPhrase = normalizeComparable(phrase);
  return normalizedPhrase.length >= 8 && normalizedHaystack.includes(` ${normalizedPhrase} `);
}

function normalizeComparable(value: string) {
  return value.toLowerCase().replace(/[“”"'`*_#]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
}

function isOnlyQuotedFragment(value: string) {
  const trimmed = value.trim();
  if (trimmed.length > 500) return false;
  return /^(?:[>\s]*[“"'])[^\n]+(?:[”"'])\s*[.!?]?$/.test(trimmed);
}

function shortPaperTitle(title: string) {
  return title.includes(":") ? title.split(":")[0].trim() : title;
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function uniqueBy<T>(values: T[], key: (value: T) => string) {
  const seen = new Set<string>();
  return values.filter((value) => {
    const itemKey = key(value);
    if (seen.has(itemKey)) return false;
    seen.add(itemKey);
    return true;
  });
}
