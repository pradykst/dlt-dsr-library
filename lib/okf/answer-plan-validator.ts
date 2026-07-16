import type { OkfAnswerPlan } from "./chat.ts";
import type { ConfidenceLabel, DesignMove, OkfReuseFlowRow } from "./schema.ts";

export type ReuseAnswerPlanValidation = {
  valid: boolean;
  errors: string[];
};

const confidenceValues = new Set<ConfidenceLabel>(["high", "medium-high", "medium", "low"]);
const adaptationValues = new Set<DesignMove["adaptation_status"]>(["stored", "mixed", "query_generated"]);

/**
 * Validates the canonical reuse plan before either deterministic rendering or
 * optional provider synthesis. Provider guards deliberately repeat the
 * boundary check, but they are not the first line of defence.
 */
export function validateAuthoritativeReuseAnswerPlan(answerPlan: OkfAnswerPlan): ReuseAnswerPlanValidation {
  if (answerPlan.intent !== "DESIGN_REUSE_QUERY" && answerPlan.intent !== "DESIGN_REUSE_FLOW_QUERY") {
    return { valid: true, errors: [] };
  }

  const errors: string[] = [];
  const moves = answerPlan.design_moves;
  const selectedPaperIds = new Set(answerPlan.selected_papers.map((paper) => paper.paper_id));
  const extractionById = new Map(answerPlan.extraction_items.map((item) => [item.concept_id, item]));
  const flowRowById = new Map(answerPlan.flow_rows.map((row) => [row.row_id, row]));
  const evidenceById = new Map(answerPlan.evidence_pack.map((item) => [item.evidence_id, item]));
  const usedEvidenceIds = new Set<string>();
  const usedPaperIds = new Set<string>();
  const moveIds = new Set<string>();
  const movePaths = new Set<string>();

  if (moves.length < 5 || moves.length > 7) errors.push(`Canonical reuse plans require 5-7 moves; received ${moves.length}.`);
  if (new Set(answerPlan.selected_papers.map((paper) => paper.paper_id)).size !== answerPlan.selected_papers.length) {
    errors.push("The canonical reuse plan contains duplicate selected papers.");
  }
  if (evidenceById.size !== answerPlan.evidence_pack.length) errors.push("The canonical reuse plan contains duplicate evidence-pack IDs.");

  for (const [index, move] of moves.entries()) validateMove(move, index, {
    errors,
    selectedPaperIds,
    evidenceById,
    extractionById,
    flowRowById,
    usedEvidenceIds,
    usedPaperIds,
    moveIds,
    movePaths
  });

  for (const evidence of answerPlan.evidence_pack) {
    if (!usedEvidenceIds.has(evidence.evidence_id)) errors.push("The canonical evidence pack contains evidence that is not assigned to a selected move.");
  }
  for (const paper of answerPlan.selected_papers) {
    if (!usedPaperIds.has(paper.paper_id)) errors.push("A selected source paper is not used by any canonical move.");
  }

  validateFlowRows(answerPlan.flow_rows, moves, errors);
  return { valid: errors.length === 0, errors: unique(errors) };
}

type MoveValidationState = {
  errors: string[];
  selectedPaperIds: Set<string>;
  evidenceById: Map<string, OkfAnswerPlan["evidence_pack"][number]>;
  usedEvidenceIds: Set<string>;
  extractionById: Map<string, OkfAnswerPlan["extraction_items"][number]>;
  flowRowById: Map<string, OkfReuseFlowRow>;
  usedPaperIds: Set<string>;
  moveIds: Set<string>;
  movePaths: Set<string>;
};

function validateMove(move: DesignMove, index: number, state: MoveValidationState) {
  const label = `Move ${index + 1}`;
  const required = [move.id, move.title, move.what_to_build, move.reused_requirement, move.reused_principle, move.candidate_feature, move.artifact_pattern];
  if (required.some((value) => typeof value !== "string" || !value.trim())) state.errors.push(`${label} is missing a required canonical field.`);
  if (state.moveIds.has(move.id)) state.errors.push("Canonical move IDs must be unique.");
  state.moveIds.add(move.id);

  const path = normalize(`${move.reused_requirement}|${move.reused_principle}|${move.candidate_feature}|${move.artifact_pattern}`);
  if (state.movePaths.has(path)) state.errors.push("Canonical move paths must be unique.");
  state.movePaths.add(path);

  if (!adaptationValues.has(move.adaptation_status)) state.errors.push(`${label} has an invalid adaptation status.`);
  if (!confidenceValues.has(move.confidence)) state.errors.push(`${label} has an invalid confidence value.`);
  if (new Set(move.supporting_paper_ids).size !== move.supporting_paper_ids.length) state.errors.push(`${label} contains duplicate supporting-paper IDs.`);
  if (new Set(move.evidence_ids).size !== move.evidence_ids.length) state.errors.push(`${label} contains duplicate evidence IDs.`);
  if (move.evidence_summaries.length !== move.evidence_ids.length) state.errors.push(`${label} evidence summaries do not align with its evidence IDs.`);

  for (const paperId of move.supporting_paper_ids) {
    if (!state.selectedPaperIds.has(paperId)) state.errors.push(`${label} references a paper outside the selected source set.`);
    state.usedPaperIds.add(paperId);
  }

  if (!move.evidence_ids.length) {
    const allowedUngrounded = move.adaptation_status === "query_generated" && (move.confidence === "low" || move.confidence === "medium");
    if (!allowedUngrounded) state.errors.push(`${label} has no evidence and is not an explicit low/medium-confidence query-generated move.`);
  }

  for (const [evidenceIndex, evidenceId] of move.evidence_ids.entries()) {
    const evidence = state.evidenceById.get(evidenceId);
    if (!evidence) {
      state.errors.push(`${label} references evidence outside the canonical evidence pack.`);
      continue;
    }
    state.usedEvidenceIds.add(evidenceId);
    if (!move.supporting_paper_ids.includes(evidence.paper_id)) state.errors.push(`${label} evidence comes from a paper that does not support the move.`);
    if (move.evidence_summaries[evidenceIndex]?.trim() !== evidence.excerpt.trim()) state.errors.push(`${label} rewrites or misaligns stored evidence text.`);
    if (!evidence.concept_id) {
      state.errors.push(`${label} evidence lacks a canonical concept link.`);
    } else {
      const row = state.flowRowById.get(move.id);
      if (!row?.concept_ids.includes(evidence.concept_id)) {
        state.errors.push(`${label} evidence is not linked to a concept in its canonical flow row.`);
      }
      const concept = state.extractionById.get(evidence.concept_id);
      if (!concept) {
        state.errors.push(`${label} evidence references a concept outside the canonical extraction set.`);
      } else {
        if (concept.paper_id !== evidence.paper_id) state.errors.push(`${label} evidence and concept papers do not match.`);
        if (!conceptMatchesMove(concept, move)) state.errors.push(`${label} evidence concept does not match the move labels.`);
      }
    }
  }
}

function validateFlowRows(rows: OkfReuseFlowRow[], moves: DesignMove[], errors: string[]) {
  if (rows.length !== moves.length) {
    errors.push("Canonical flow rows must have a one-to-one mapping with design moves.");
    return;
  }
  const rowById = new Map(rows.map((row) => [row.row_id, row]));
  if (rowById.size !== rows.length) errors.push("Canonical flow-row IDs must be unique.");
  for (const move of moves) {
    const row = rowById.get(move.id);
    if (!row) {
      errors.push("A canonical design move has no matching flow row.");
      continue;
    }
    if (row.requirement_label !== move.reused_requirement || row.principle_label !== move.reused_principle || row.feature_label !== move.candidate_feature || row.artifact_pattern !== move.artifact_pattern) {
      errors.push("A canonical flow row diverges from its design move labels.");
    }
    if (!sameValues(row.supporting_papers, move.supporting_paper_ids) || !sameValues(row.evidence_ids, move.evidence_ids)) {
      errors.push("A canonical flow row diverges from its design move grounding.");
    }
    if (row.adaptation_status !== move.adaptation_status || row.confidence !== move.confidence) errors.push("A canonical flow row diverges from its design move status.");
  }
}

function conceptMatchesMove(concept: OkfAnswerPlan["extraction_items"][number], move: DesignMove) {
  const expected = concept.type === "Design Requirement"
    ? move.reused_requirement
    : concept.type === "Design Principle"
      ? move.reused_principle
      : concept.type === "Design Feature"
        ? move.candidate_feature
        : concept.type === "Artifact"
          ? move.artifact_pattern
          : undefined;
  return expected !== undefined && normalize(concept.title) === normalize(expected);
}
function sameValues(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function normalize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function unique(values: string[]) {
  return [...new Set(values)];
}
