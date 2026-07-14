import { buildOkfFlow } from "./flow.ts";
import { selectPolicySourcePapers } from "./policy.ts";
import type { ConfidenceLabel, DecisionSupportAnswer, DesignMove, OkfConcept, OkfConceptType, OkfEvidenceRef, OkfKnowledgeBase, OkfPaperSupport, OkfReuseFlowRow } from "./schema.ts";
import type { OkfAnswerPlan, OkfChatResponse, OkfQueryPlan } from "./chat.ts";

const rowTypes: OkfConceptType[] = ["DesignRequirement", "DesignPrinciple", "DesignFeature", "Artifact"];

type DesignTheme = {
  id: string;
  label: string;
  queryTerms: string[];
  matchTerms: string[];
};

const designThemes: DesignTheme[] = [
  { id: "integrity", label: "integrity / manipulation prevention", queryTerms: ["manipulation", "manipulated", "inconsistent", "integrity", "authenticity", "proof", "tamper", "description", "descriptions", "opportunism", "fragmented", "fragmentation", "data quality", "consistency", "product data"], matchTerms: ["manipulation", "manipulated", "integrity", "tamper", "proof", "hash", "authentic", "certification", "provenance", "truthful", "opportunism", "description", "consistent", "quality"] },
  { id: "privacy", label: "privacy / data minimization / sensitive data protection", queryTerms: ["privacy", "private", "sensitive", "raw", "commercial", "competitor", "competitors", "expose", "confidential", "poaching", "records", "data minimization"], matchTerms: ["privacy", "private", "sensitive", "confidential", "poaching", "raw data", "off chain", "off-chain", "disclosure", "permission", "access", "commercial", "protected"] },
  { id: "identity", label: "identity / credentials / issuer-verifier-holder", queryTerms: ["identity", "identities", "credential", "credentials", "issuer", "verifier", "holder", "verified", "purchase", "buyer", "seller", "relisting", "variant", "product", "product data", "product identity", "canonical", "identifier", "standard"], matchTerms: ["identity", "credential", "credentials", "issuer", "verifier", "holder", "wallet", "did", "revocation", "status", "proof request", "non revocation", "authentication", "product", "variant", "seller", "buyer"] },
  { id: "trust", label: "screening / reputation / trust", queryTerms: ["review", "reviews", "verified purchase", "reputation", "trust", "screening", "seller", "buyer", "marketplace", "marketplaces", "deterrence"], matchTerms: ["review", "reviews", "reputation", "trust", "screening", "signaling", "deterrence", "seller", "buyer", "identity signaling", "persistent identity", "authority"] },
  { id: "auditability", label: "auditability / status history", queryTerms: ["audit", "auditability", "history", "continuity", "status", "trace", "traceability", "relist", "relisting", "listed", "listing", "provenance", "lineage", "fragmented", "fragmentation"], matchTerms: ["audit", "auditable", "history", "status", "trace", "transaction log", "append only", "append-only", "continuity", "monitoring", "provenance", "revocation"] },
  { id: "governance", label: "governance / authority / fairness", queryTerms: ["governance", "authority", "fairness", "dispute", "correction", "appeal", "marketplace", "marketplaces", "competitors", "standard", "standards", "data governance"], matchTerms: ["governance", "authority", "fairness", "joint", "dispute", "correction", "committee", "rules", "compliance", "interorganizational"] },
  { id: "lifecycle", label: "implementation lifecycle / evaluation", queryTerms: ["implementation", "lifecycle", "evaluation", "testing", "maintenance", "architecture", "artifact", "prototype", "build", "create", "application", "guide"], matchTerms: ["implementation", "lifecycle", "evaluation", "testing", "maintenance", "artifact", "prototype", "modeling", "roles", "architecture", "design cycle"] }
];

export function selectSourcePapers(query: string, kb: OkfKnowledgeBase, maxPapers = 8): OkfPaperSupport[] {
  return selectPolicySourcePapers(query, kb, maxPapers);
}

export function buildAuthoritativeReuseAnswerPlan(answerPlan: OkfAnswerPlan, kb: OkfKnowledgeBase): OkfAnswerPlan {
  if (answerPlan.intent !== "DESIGN_REUSE_QUERY" && answerPlan.intent !== "DESIGN_REUSE_FLOW_QUERY") return answerPlan;
  const selectedPaperIds = new Set(answerPlan.selected_papers.map((paper) => paper.paper_id));
  const extractionIds = new Set(answerPlan.extraction_items.map((item) => item.concept_id));
  const concepts = kb.concepts.filter((concept) => extractionIds.has(concept.concept_id) && selectedPaperIds.has(concept.paper_id));
  const availableEvidenceIds = new Set(answerPlan.evidence_pack.map((item) => item.evidence_id));
  const evidenceRefs: OkfEvidenceRef[] = kb.evidence_items
    .filter((item) => availableEvidenceIds.has(item.evidence_id) && selectedPaperIds.has(item.paper_id))
    .map((item) => ({ evidence_id: item.evidence_id, paper_id: item.paper_id, concept_id: item.concept_id, excerpt: item.quote ?? item.paraphrase, section: item.section, page_number: item.page_number, confidence: item.confidence }));
  const paperSupport = answerPlan.selected_papers.map((paper) => ({ paper_id: paper.paper_id, title: paper.title, reason: paper.reason_for_selection, score: paper.relevance_score }));
  const candidateRows = buildRows(answerPlan.user_query, paperSupport, concepts, evidenceRefs, kb);
  const selectedRows = selectDiverseGroundedRows(candidateRows, answerPlan, evidenceRefs);
  const rowMoves = selectedRows.map((row, index) => designMoveFromRow(row, index, evidenceRefs));
  let effectiveConcepts = concepts;
  let effectiveEvidenceRefs = evidenceRefs;
  let designMoves = validateDesignMoves(rowMoves, answerPlan, evidenceRefs).slice(0, 7);
  let backfillApplied = false;

  if (designMoves.length < 5) {
    const backfill = buildGroundedSamePaperBackfill(answerPlan, kb, designMoves, 5);
    if (backfill.rows.length) {
      backfillApplied = true;
      effectiveConcepts = [...new Map([...concepts, ...backfill.concepts].map((concept) => [concept.concept_id, concept])).values()];
      effectiveEvidenceRefs = [...new Map([...evidenceRefs, ...backfill.evidence].map((item) => [item.evidence_id, item])).values()];
      const backfillMoves = backfill.rows.map((row, index) => designMoveFromRow(row, designMoves.length + index, effectiveEvidenceRefs));
      designMoves = validateDesignMoves([...designMoves, ...backfillMoves], answerPlan, effectiveEvidenceRefs).slice(0, 7);
    }
  }

  const flowRows = designMoves.map((move) => rowFromDesignMove(move, effectiveConcepts, effectiveEvidenceRefs));
  const usedEvidenceIds = new Set(designMoves.flatMap((move) => move.evidence_ids));
  const usedPaperIds = new Set(designMoves.flatMap((move) => move.supporting_paper_ids));
  const usedConceptIds = new Set(flowRows.flatMap((row) => row.concept_ids));
  for (const item of effectiveEvidenceRefs) if (usedEvidenceIds.has(item.evidence_id) && item.concept_id) usedConceptIds.add(item.concept_id);

  const extractionItems = backfillApplied
    ? effectiveConcepts.map((concept) => ({ concept_id: concept.concept_id, paper_id: concept.paper_id, type: concept.type, title: concept.title }))
    : answerPlan.extraction_items;
  const effectiveEvidencePack = backfillApplied
    ? effectiveEvidenceRefs.map((item) => ({ evidence_id: item.evidence_id, paper_id: item.paper_id, concept_id: item.concept_id, excerpt: item.excerpt, confidence: item.confidence }))
    : answerPlan.evidence_pack;

  return {
    ...answerPlan,
    selected_papers: answerPlan.selected_papers.filter((paper) => usedPaperIds.has(paper.paper_id)),
    paper_matches: answerPlan.paper_matches.filter((paper) => usedPaperIds.has(paper.paper_id)),
    extraction_items: extractionItems.filter((item) => usedConceptIds.has(item.concept_id) && usedPaperIds.has(item.paper_id)),
    design_moves: designMoves,
    flow_rows: flowRows,
    evidence_pack: effectiveEvidencePack.filter((item) => usedEvidenceIds.has(item.evidence_id) && usedPaperIds.has(item.paper_id))
  };
}

export function buildReuseFlowResponse(query: string, plan: OkfQueryPlan, answerPlan: OkfAnswerPlan, kb: OkfKnowledgeBase): OkfChatResponse {
  const selectedConceptIds = new Set(answerPlan.extraction_items.map((item) => item.concept_id));
  const concepts = kb.concepts.filter((concept) => selectedConceptIds.has(concept.concept_id));
  const evidenceIds = new Set(answerPlan.evidence_pack.map((item) => item.evidence_id));
  const evidenceRefs: OkfEvidenceRef[] = kb.evidence_items
    .filter((item) => evidenceIds.has(item.evidence_id))
    .map((item) => ({ evidence_id: item.evidence_id, paper_id: item.paper_id, concept_id: item.concept_id, excerpt: item.quote ?? item.paraphrase, section: item.section, page_number: item.page_number, confidence: item.confidence }));
  const paperSupport = answerPlan.selected_papers.map((paper) => ({ paper_id: paper.paper_id, title: paper.title, reason: paper.reason_for_selection, score: paper.relevance_score }));
  const sourcePapers = sourceRoles(concepts, kb, paperSupport);
  const rows = answerPlan.flow_rows.slice(0, 7);
  const moves = answerPlan.design_moves.slice(0, 7);
  const flowMode = moves.some((move) => move.adaptation_status === "stored" || move.adaptation_status === "mixed") ? "mixed_reuse_flow" as const : "query_generated_flow" as const;
  const flow = buildOkfFlow(query, concepts, kb, { mode: flowMode, flowRows: rows, designMoves: moves, title: "Mixed OKF reuse flow" });
  const payload = buildFallbackAnswer(query, rows, sourcePapers, evidenceRefs, plan, undefined, moves);
  const warnings = sourcePapers.length === 0 ? ["No OKF source paper matched the query strongly enough for grounded reuse guidance."] : [];
  if (moves.length < 5) warnings.push(`Only ${moves.length} validated design move(s) were available.`);

  return {
    intent: plan.intent,
    task_type: plan.task_type,
    answer: renderDecisionSupportMarkdown(payload),
    interpreted_problem: query,
    requirements: dedupeCards(rows.map((row) => card(row.requirement_label, row, "DesignRequirement", concepts))),
    principles: dedupeCards(rows.map((row) => card(row.principle_label, row, "DesignPrinciple", concepts))),
    features: dedupeCards(rows.map((row) => card(row.feature_label, row, "DesignFeature", concepts))),
    artifact_direction: dedupeCards(rows.map((row) => card(row.artifact_pattern, row, "Artifact", concepts))),
    source_papers: sourcePapers,
    retrieved_concepts: concepts,
    evidence: evidenceRefs.map((item) => ({ evidence_id: item.evidence_id, paper_id: item.paper_id, concept_id: item.concept_id, paraphrase: item.excerpt, confidence: item.confidence, section: item.section, page_number: item.page_number })),
    flow,
    flow_graph: flow,
    flow_rows: rows,
    answer_payload: payload,
    answer_plan: answerPlan,
    assumptions: payload.query_generated_notes,
    limitations: payload.limitations,
    warnings
  };
}

export function buildFallbackAnswer(query: string, rows: OkfReuseFlowRow[], papers: OkfChatResponse["source_papers"], evidence: OkfEvidenceRef[], plan: OkfQueryPlan | undefined, fallbackReason?: string, authoritativeMoves?: DesignMove[]): DecisionSupportAnswer {
  const designMoves = (authoritativeMoves?.length ? authoritativeMoves : rows.map((row, index) => designMoveFromRow(row, index, evidence))).slice(0, 7);
  const usedEvidenceIds = new Set(designMoves.flatMap((move) => move.evidence_ids));
  const usedPaperIds = new Set(designMoves.flatMap((move) => move.supporting_paper_ids));
  const evidenceRefs = evidence.filter((item) => usedEvidenceIds.has(item.evidence_id) && usedPaperIds.has(item.paper_id)).slice(0, 21);
  const source_papers = papers.filter((paper) => usedPaperIds.has(paper.paper_id)).slice(0, 8).map((paper) => ({ paper_id: paper.paper_id, title: paper.title, reason: paper.reason, score: paper.score ?? 0 }));
  const direct = fallbackReason
    ? "I retrieved relevant OKF knowledge, but LLM synthesis failed. Here is a compact evidence-backed summary."
    : plan?.intent === "DESIGN_REUSE_FLOW_QUERY"
      ? compactFlowDirectAnswer(source_papers.length, designMoves.length, evidenceRefs.length)
      : compactDirectAnswer(query, source_papers.length, designMoves.length, evidenceRefs.length);
  return {
    synthesis_mode: "structured_okf_answer",
    title: fallbackReason ? "Compact OKF fallback summary" : "OKF decision-support summary",
    direct_answer: direct,
    design_moves: designMoves,
    architecture_direction: architectureDirection(rows),
    limitations: compactLimitations(source_papers.length, evidenceRefs.length),
    source_papers,
    evidence_refs: evidenceRefs,
    query_generated_notes: designMoves.filter((move) => move.adaptation_status !== "stored").map((move) => `${move.title}: ${move.adaptation_note}`).slice(0, 7),
    debug: { task_type: plan?.task_type, requested_output_shape: plan?.output_shape, fallback_reason: fallbackReason, source_paper_count: source_papers.length, selected_evidence_count: evidenceRefs.length }
  };
}

export function renderDecisionSupportMarkdown(payload: DecisionSupportAnswer) {
  const paperTitles = new Map(payload.source_papers.map((paper) => [paper.paper_id, paper.title]));
  const moves = payload.design_moves.map((move, index) => {
    const supportingPapers = move.supporting_paper_ids.map((paperId) => paperTitles.get(paperId)).filter(Boolean).join("; ") || "Retrieved OKF source papers";
    const evidenceBasis = move.evidence_summaries.slice(0, 2).join(" ") || "No direct evidence excerpt was selected for this query-generated move.";
    const adaptationStatus = move.adaptation_status.replace("_", "-");
    const reuse = [...new Set([move.reused_requirement, move.reused_principle, move.candidate_feature].filter(Boolean))].join("; ") || "Retrieved OKF design knowledge";
    return [
      `### ${index + 1}. ${move.title}`,
      `- **What to build:** ${move.what_to_build}`,
      `- **Reuse from OKF:** ${reuse}`,
      `- **Supporting papers:** ${supportingPapers}`,
      `- **Evidence basis:** ${evidenceBasis}`,
      `- **Adaptation:** ${move.adaptation_note}`,
      `- **Adaptation status:** ${adaptationStatus}`
    ].join("\n");
  }).join("\n\n");
  return [
    "# Recommendation",
    payload.direct_answer,
    "## Design moves to reuse",
    moves || "No grounded moves were available.",
    "## Suggested architecture direction",
    architectureBullets(payload.architecture_direction),
    "## What not to overclaim",
    payload.limitations.length ? payload.limitations.map((item) => `- ${item}`).join("\n") : "- The retrieved OKF context is decision support, not a complete evaluated target-domain artifact."
  ].filter(Boolean).join("\n\n");
}

function architectureBullets(direction: string | undefined) {
  if (!direction) return "- Use the retrieved OKF concepts to separate private records, shared proofs, actor credentials, governance rules, and evaluation activities.";
  const normalized = direction.replace(/^Use\s+/i, "").replace(/\.$/, "");
  const parts = normalized.split(/;\s+|,\s+(?=publish|verify|govern|keep|maintain|model|test|deploy|monitor)/i).map((item) => item.trim()).filter(Boolean);
  if (parts.length >= 3) return parts.slice(0, 6).map((item) => `- ${capitalizeFirst(item.replace(/^and\s+/i, ""))}.`).join("\n");
  return `- ${capitalizeFirst(normalized)}.`;
}

function capitalizeFirst(value: string) {
  return value ? `${value[0].toUpperCase()}${value.slice(1)}` : value;
}
function buildRows(query: string, papers: OkfPaperSupport[], concepts: OkfConcept[], evidence: OkfEvidenceRef[], kb: OkfKnowledgeBase): OkfReuseFlowRow[] {
  const relationRows = buildRelationRows(concepts, evidence, kb);
  const paperRows = papers.map((paper, index) => buildPaperRow(query, paper, concepts.filter((concept) => concept.paper_id === paper.paper_id), evidence, index)).filter((row): row is OkfReuseFlowRow => Boolean(row));
  const crossPaperRows = buildCrossPaperRows(query, papers, concepts, evidence, kb);
  return rankRowsForQuery(query, papers, dedupeRows([...paperRows, ...crossPaperRows, ...relationRows])).slice(0, 24);
}

function buildRelationRows(concepts: OkfConcept[], evidence: OkfEvidenceRef[], kb: OkfKnowledgeBase): OkfReuseFlowRow[] {
  const byId = new Map(concepts.map((concept) => [concept.concept_id, concept]));
  const outgoing = new Map<string, string[]>();
  for (const relation of kb.relations) {
    if (!byId.has(relation.source_concept_id) || !byId.has(relation.target_concept_id)) continue;
    outgoing.set(relation.source_concept_id, [...(outgoing.get(relation.source_concept_id) ?? []), relation.target_concept_id]);
  }
  const rows: OkfReuseFlowRow[] = [];
  for (const requirement of concepts.filter((concept) => concept.type === "DesignRequirement")) {
    for (const principle of (outgoing.get(requirement.concept_id) ?? []).map((id) => byId.get(id)).filter((concept): concept is OkfConcept => concept?.type === "DesignPrinciple")) {
      const features = (outgoing.get(principle.concept_id) ?? []).map((id) => byId.get(id)).filter((concept): concept is OkfConcept => concept?.type === "DesignFeature");
      for (const feature of features.length ? features : [undefined]) {
        const artifacts = feature ? (outgoing.get(feature.concept_id) ?? []).map((id) => byId.get(id)).filter((concept): concept is OkfConcept => concept?.type === "Artifact") : [];
        const selected = [requirement, principle, feature, artifacts[0]].filter((concept): concept is OkfConcept => Boolean(concept));
        rows.push(rowFromConcepts(`relation-${rows.length + 1}`, selected, evidence, "stored"));
      }
    }
  }
  return rows;
}

function buildPaperRow(query: string, paper: OkfPaperSupport, concepts: OkfConcept[], evidence: OkfEvidenceRef[], index: number) {
  if (!concepts.length) return undefined;
  const terms = expandQueryTerms(tokenize(query));
  const selected = rowTypes.map((type) => bestConcept(concepts, type, terms)).filter((concept): concept is OkfConcept => Boolean(concept));
  if (!selected.length) return undefined;
  return rowFromConcepts(`paper-${paper.paper_id}-${index + 1}`, selected, evidence, "mixed");
}

function buildCrossPaperRows(query: string, papers: OkfPaperSupport[], concepts: OkfConcept[], evidence: OkfEvidenceRef[], kb: OkfKnowledgeBase) {
  const terms = expandQueryTerms(tokenize(query));
  const rows: OkfReuseFlowRow[] = [];
  for (let index = 0; index < Math.min(5, papers.length - 1); index += 1) {
    const primary = concepts.filter((concept) => concept.paper_id === papers[index].paper_id);
    const secondary = concepts.filter((concept) => concept.paper_id === papers[index + 1].paper_id);
    const selected = [
      bestConcept(primary, "DesignRequirement", terms),
      bestConcept(primary, "DesignPrinciple", terms) ?? bestConcept(secondary, "DesignPrinciple", terms),
      bestConcept(secondary, "DesignFeature", terms),
      bestConcept(secondary, "Artifact", terms) ?? bestConcept(primary, "Artifact", terms)
    ].filter((concept): concept is OkfConcept => Boolean(concept));
    if (selected.length >= 2) rows.push(rowFromConcepts(`cross-paper-${index + 1}`, selected, evidence, relationConnected(selected, kb) ? "mixed" : "query_generated"));
  }
  return rows;
}

function rankRowsForQuery(query: string, papers: OkfPaperSupport[], rows: OkfReuseFlowRow[]) {
  const q = normalizeText(query);
  const paperRank = new Map(papers.map((paper, index) => [paper.paper_id, index]));
  const hasHealthIntent = /health|healthcare|patient|consent|medical|hie/.test(q);
  const hasSensorIntent = /sensor|iot|device|measurement/.test(q);
  const scored = rows.map((row, originalIndex) => {
    const bestPaperRank = Math.min(...row.supporting_papers.map((paperId) => paperRank.get(paperId) ?? 99));
    const text = normalizeText([row.requirement_label, row.principle_label, row.feature_label, row.artifact_pattern].join(" "));
    const domainPenalty = (!hasHealthIntent && /patient|hie|consent|health/.test(text) ? 45 : 0) + (!hasSensorIntent && /sensor|iot|device measurement/.test(text) ? 18 : 0);
    const adaptationBonus = row.adaptation_status === "mixed" ? 6 : row.adaptation_status === "query_generated" ? 3 : 0;
    const score = 120 - bestPaperRank * 12 + Math.min(row.evidence_ids.length, 6) + adaptationBonus - domainPenalty;
    return { row, score, originalIndex, primaryPaper: row.supporting_papers[0] ?? "query_generated" };
  }).sort((a, b) => b.score - a.score || a.originalIndex - b.originalIndex);
  const counts = new Map<string, number>();
  const seen = new Set<string>();
  const selected: OkfReuseFlowRow[] = [];
  for (const item of scored) {
    const key = normalizeText(`${item.row.requirement_label} ${item.row.principle_label} ${item.row.feature_label} ${item.row.artifact_pattern}`);
    if (seen.has(key)) continue;
    const count = counts.get(item.primaryPaper) ?? 0;
    if (count >= 2 && selected.length < Math.min(6, papers.length)) continue;
    seen.add(key);
    counts.set(item.primaryPaper, count + 1);
    selected.push(item.row);
    if (selected.length >= 24) break;
  }
  return selected;
}

function selectDiverseGroundedRows(rows: OkfReuseFlowRow[], answerPlan: OkfAnswerPlan, evidence: OkfEvidenceRef[]) {
  const evidenceById = new Map(evidence.map((item) => [item.evidence_id, item]));
  const strengthByPaper = new Map(answerPlan.paper_matches.map((paper) => [paper.paper_id, paper.match_strength]));
  const requestsBuildGuidance = /\b(build|implement|implementation|application|architecture|lifecycle|process|prototype)\b/i.test(answerPlan.user_query);
  const rankedPaperIds = answerPlan.selected_papers
    .filter((paper) => strengthByPaper.get(paper.paper_id) !== "weak" || (requestsBuildGuidance && normalizeText(paper.role_for_query).includes("implementation lifecycle")))
    .map((paper) => paper.paper_id);
  const selected: OkfReuseFlowRow[] = [];
  const seenPaths = new Set<string>();
  const pathKey = (row: OkfReuseFlowRow) => normalizeText(`${row.requirement_label}|${row.principle_label}|${row.feature_label}`);
  const add = (row: OkfReuseFlowRow | undefined) => {
    if (!row || !row.evidence_ids.some((id) => evidenceById.has(id))) return;
    const key = pathKey(row);
    if (seenPaths.has(key)) return;
    seenPaths.add(key);
    selected.push(row);
  };
  for (const paperId of rankedPaperIds) {
    const candidates = rows.filter((row) => row.supporting_papers.includes(paperId) && row.evidence_ids.some((id) => evidenceById.get(id)?.paper_id === paperId));
    const directPaperRow = candidates.find((row) => row.row_id.startsWith(`paper-${paperId}-`));
    add(directPaperRow ?? candidates.find((row) => row.adaptation_status === "stored") ?? candidates[0]);
    if (selected.length >= 5) return selected;
  }
  for (const row of rows) {
    add(row);
    if (selected.length >= 5) break;
  }
  return selected;
}

type GroundedBackfill = { rows: OkfReuseFlowRow[]; concepts: OkfConcept[]; evidence: OkfEvidenceRef[] };

function buildGroundedSamePaperBackfill(answerPlan: OkfAnswerPlan, kb: OkfKnowledgeBase, existingMoves: DesignMove[], targetMoveCount: number): GroundedBackfill {
  const needed = Math.max(0, targetMoveCount - existingMoves.length);
  if (!needed) return { rows: [], concepts: [], evidence: [] };

  const selectedPaperIds = new Set(answerPlan.selected_papers.map((paper) => paper.paper_id));
  const eligibleConcepts = kb.concepts.filter((concept) => selectedPaperIds.has(concept.paper_id) && rowTypes.includes(concept.type));
  const conceptById = new Map(eligibleConcepts.map((concept) => [concept.concept_id, concept]));
  const eligibleEvidence: OkfEvidenceRef[] = kb.evidence_items
    .filter((item) => item.concept_id && conceptById.get(item.concept_id)?.paper_id === item.paper_id)
    .map((item) => ({
      evidence_id: item.evidence_id,
      paper_id: item.paper_id,
      concept_id: item.concept_id as string,
      excerpt: item.quote ?? item.paraphrase,
      section: item.section,
      page_number: item.page_number,
      confidence: item.confidence
    }));
  const evidenceByConcept = new Map<string, OkfEvidenceRef[]>();
  for (const item of eligibleEvidence) evidenceByConcept.set(item.concept_id as string, [...(evidenceByConcept.get(item.concept_id as string) ?? []), item]);

  const usedEvidenceIds = new Set(existingMoves.flatMap((move) => move.evidence_ids));
  const usedEvidenceText = new Set(existingMoves.flatMap((move) => move.evidence_summaries.map(normalizeText)).filter(Boolean));
  const usedPaths = new Set(existingMoves.map((move) => normalizeText(`${move.reused_requirement}|${move.reused_principle}|${move.candidate_feature}`)));
  const usedConceptKeys = new Set<string>();
  for (const concept of eligibleConcepts) {
    const matchingLabel = existingMoves.some((move) => {
      if (!move.supporting_paper_ids.includes(concept.paper_id)) return false;
      const label = concept.type === "DesignRequirement" ? move.reused_requirement
        : concept.type === "DesignPrinciple" ? move.reused_principle
          : concept.type === "DesignFeature" ? move.candidate_feature
            : move.artifact_pattern;
      return normalizeText(label) === normalizeText(concept.title);
    });
    if (matchingLabel) usedConceptKeys.add(backfillConceptKey(concept));
  }

  const terms = expandQueryTerms(tokenize(answerPlan.user_query));
  const typeRank = new Map(rowTypes.map((type, index) => [type, index]));
  const rows: OkfReuseFlowRow[] = [];
  const includedConceptIds = new Set<string>();
  const includedEvidenceIds = new Set<string>();

  for (const paper of answerPlan.selected_papers) {
    if (rows.length >= needed) break;
    const paperConcepts = eligibleConcepts.filter((concept) => concept.paper_id === paper.paper_id);
    const pools = new Map(rowTypes.map((type) => [type, paperConcepts.filter((concept) => concept.type === type)]));
    if (rowTypes.some((type) => !(pools.get(type)?.length))) continue;
    const anchors = paperConcepts
      .filter((concept) => concept.type !== "Artifact" && (evidenceByConcept.get(concept.concept_id)?.length ?? 0) > 0)
      .sort((a, b) => scoreConcept(b, terms) - scoreConcept(a, terms)
        || confidenceRank(b.confidence) - confidenceRank(a.confidence)
        || (typeRank.get(a.type) ?? 99) - (typeRank.get(b.type) ?? 99)
        || a.concept_id.localeCompare(b.concept_id));

    for (const anchor of anchors) {
      if (rows.length >= needed) break;
      if (usedConceptKeys.has(backfillConceptKey(anchor))) continue;
      const anchorEvidence = (evidenceByConcept.get(anchor.concept_id) ?? []).filter((item) => {
        const textKey = normalizeText(item.excerpt);
        return !usedEvidenceIds.has(item.evidence_id) && (!textKey || !usedEvidenceText.has(textKey));
      });
      if (!anchorEvidence.length) continue;

      const selected = rowTypes.map((type) => {
        if (anchor.type === type) return anchor;
        return chooseBackfillCompanion(pools.get(type) ?? [], anchor, usedConceptKeys, terms, kb);
      }).filter((concept): concept is OkfConcept => Boolean(concept));
      if (selected.length !== rowTypes.length) continue;

      const selectedEvidence = uniqueEvidence([
        ...anchorEvidence,
        ...selected.flatMap((concept) => evidenceByConcept.get(concept.concept_id) ?? [])
      ]).filter((item) => {
        const textKey = normalizeText(item.excerpt);
        return !usedEvidenceIds.has(item.evidence_id) && (!textKey || !usedEvidenceText.has(textKey));
      }).slice(0, 3);
      if (!selectedEvidence.length) continue;

      const adaptationStatus: OkfReuseFlowRow["adaptation_status"] = relationConnected(selected, kb) ? "mixed" : "query_generated";
      const row = rowFromConcepts(`backfill-${paper.paper_id}-${rows.length + 1}`, selected, selectedEvidence, adaptationStatus);
      const path = normalizeText(`${row.requirement_label}|${row.principle_label}|${row.feature_label}`);
      if (usedPaths.has(path) || !row.evidence_ids.length) continue;

      usedPaths.add(path);
      for (const concept of selected) {
        usedConceptKeys.add(backfillConceptKey(concept));
        includedConceptIds.add(concept.concept_id);
      }
      for (const item of selectedEvidence) {
        usedEvidenceIds.add(item.evidence_id);
        const textKey = normalizeText(item.excerpt);
        if (textKey) usedEvidenceText.add(textKey);
        includedEvidenceIds.add(item.evidence_id);
      }
      rows.push(row);
    }
  }

  return {
    rows,
    concepts: eligibleConcepts.filter((concept) => includedConceptIds.has(concept.concept_id)),
    evidence: eligibleEvidence.filter((item) => includedEvidenceIds.has(item.evidence_id))
  };
}

function chooseBackfillCompanion(pool: OkfConcept[], anchor: OkfConcept, usedConceptKeys: Set<string>, terms: string[], kb: OkfKnowledgeBase) {
  return [...pool].sort((a, b) => {
    const related = Number(backfillConceptConnected(b, anchor, kb)) - Number(backfillConceptConnected(a, anchor, kb));
    if (related) return related;
    const alreadyUsed = Number(usedConceptKeys.has(backfillConceptKey(b))) - Number(usedConceptKeys.has(backfillConceptKey(a)));
    if (alreadyUsed) return alreadyUsed;
    return scoreConcept(b, terms) - scoreConcept(a, terms)
      || confidenceRank(b.confidence) - confidenceRank(a.confidence)
      || a.concept_id.localeCompare(b.concept_id);
  })[0];
}

function backfillConceptConnected(left: OkfConcept, right: OkfConcept, kb: OkfKnowledgeBase) {
  return kb.relations.some((relation) =>
    (relation.source_concept_id === left.concept_id && relation.target_concept_id === right.concept_id)
    || (relation.source_concept_id === right.concept_id && relation.target_concept_id === left.concept_id)
  );
}

function backfillConceptKey(concept: OkfConcept) {
  return `${concept.paper_id}|${concept.type}|${normalizeText(concept.title)}`;
}

function rowFromConcepts(rowId: string, selected: OkfConcept[], evidence: OkfEvidenceRef[], adaptationStatus: OkfReuseFlowRow["adaptation_status"]): OkfReuseFlowRow {
  const byType = (type: OkfConceptType) => selected.find((concept) => concept.type === type);
  const papers = [...new Set(selected.map((concept) => concept.paper_id))];
  const conceptIds = selected.map((concept) => concept.concept_id);
  const evidenceIds = evidence.filter((item) => item.concept_id && conceptIds.includes(item.concept_id)).map((item) => item.evidence_id).slice(0, 8);
  const titleFallback = selected[0]?.title ?? "Retrieved OKF concept";
  return {
    row_id: rowId,
    requirement_label: byType("DesignRequirement")?.title ?? titleFallback,
    principle_label: byType("DesignPrinciple")?.title ?? byType("DesignRequirement")?.title ?? titleFallback,
    feature_label: byType("DesignFeature")?.title ?? byType("DesignPrinciple")?.title ?? titleFallback,
    artifact_pattern: byType("Artifact")?.title ?? byType("DesignFeature")?.title ?? titleFallback,
    supporting_papers: papers,
    evidence_ids: evidenceIds,
    concept_ids: conceptIds,
    adaptation_text: adaptationStatus === "stored" ? "This move follows stored OKF concepts and relation-connected evidence." : "This move adapts retrieved OKF concepts to the user's design context; unstored adaptations are marked as mixed or query_generated.",
    adaptation_status: adaptationStatus,
    confidence: confidenceFromEvidence(evidenceIds.length, selected)
  };
}

function designMoveFromRow(row: OkfReuseFlowRow, index: number, evidence: OkfEvidenceRef[] = []): DesignMove {
  const evidenceById = new Map(evidence.map((item) => [item.evidence_id, item]));
  const selectedEvidence = uniqueEvidence(row.evidence_ids.map((id) => evidenceById.get(id)).filter((item): item is OkfEvidenceRef => Boolean(item))).slice(0, 3);
  const supportingPaperIds = selectedEvidence.length ? uniqueStrings(selectedEvidence.map((item) => item.paper_id)) : row.supporting_papers;
  return {
    id: row.row_id || `design-move-${index + 1}`,
    title: cleanMoveTitle(row.principle_label || row.requirement_label || row.feature_label, index),
    what_to_build: `Adapt the stored "${row.artifact_pattern || row.feature_label}" pattern into a target-domain component that implements "${row.principle_label}".`,
    reused_requirement: row.requirement_label,
    reused_principle: row.principle_label,
    candidate_feature: row.feature_label,
    artifact_pattern: row.artifact_pattern || row.feature_label,
    supporting_paper_ids: supportingPaperIds,
    evidence_ids: selectedEvidence.map((item) => item.evidence_id),
    evidence_summaries: selectedEvidence.map((item) => item.excerpt),
    adaptation_status: selectedEvidence.length ? row.adaptation_status : "query_generated",
    adaptation_note: row.adaptation_text,
    confidence: selectedEvidence.length ? row.confidence : "low"
  };
}


function validateDesignMoves(candidates: DesignMove[], answerPlan: OkfAnswerPlan, evidence: OkfEvidenceRef[]): DesignMove[] {
  const allowedPaperIds = new Set(answerPlan.selected_papers.map((paper) => paper.paper_id));
  const evidenceById = new Map(evidence.map((item) => [item.evidence_id, item]));
  const seen = new Set<string>();
  const validated: DesignMove[] = [];
  for (const candidate of candidates) {
    const requiredText = [candidate.id, candidate.title, candidate.what_to_build, candidate.reused_requirement, candidate.reused_principle, candidate.candidate_feature, candidate.artifact_pattern];
    if (requiredText.some((value) => !value?.trim())) continue;
    const key = normalizeText(`${candidate.reused_requirement}|${candidate.reused_principle}|${candidate.candidate_feature}`);
    if (seen.has(key)) continue;
    const candidateEvidence = uniqueEvidence(candidate.evidence_ids.map((id) => evidenceById.get(id)).filter((item): item is OkfEvidenceRef => item !== undefined && allowedPaperIds.has(item.paper_id))).slice(0, 3);
    const supportingPaperIds = uniqueStrings([
      ...candidate.supporting_paper_ids.filter((paperId) => allowedPaperIds.has(paperId)),
      ...candidateEvidence.map((item) => item.paper_id)
    ]);
    const consistentEvidence = candidateEvidence.filter((item) => supportingPaperIds.includes(item.paper_id));
    const adaptationStatus = consistentEvidence.length ? candidate.adaptation_status : "query_generated";
    if (!consistentEvidence.length && adaptationStatus !== "query_generated") continue;
    seen.add(key);
    validated.push({
      ...candidate,
      supporting_paper_ids: consistentEvidence.length ? supportingPaperIds : [],
      evidence_ids: consistentEvidence.map((item) => item.evidence_id),
      evidence_summaries: consistentEvidence.map((item) => item.excerpt),
      adaptation_status: adaptationStatus,
      confidence: consistentEvidence.length ? candidate.confidence : candidate.confidence === "high" || candidate.confidence === "medium-high" ? "medium" : candidate.confidence
    });
    if (validated.length >= 7) break;
  }
  return validated;
}

function rowFromDesignMove(move: DesignMove, concepts: OkfConcept[], evidence: OkfEvidenceRef[]): OkfReuseFlowRow {
  const supportingPaperIds = new Set(move.supporting_paper_ids);
  const findConcept = (type: OkfConceptType, label: string) => concepts.find((concept) => concept.type === type && supportingPaperIds.has(concept.paper_id) && normalizeText(concept.title) === normalizeText(label));
  const selected = [
    findConcept("DesignRequirement", move.reused_requirement),
    findConcept("DesignPrinciple", move.reused_principle),
    findConcept("DesignFeature", move.candidate_feature),
    findConcept("Artifact", move.artifact_pattern)
  ].filter((concept): concept is OkfConcept => Boolean(concept));
  const evidenceConceptIds = evidence
    .filter((item) => move.evidence_ids.includes(item.evidence_id) && item.concept_id && supportingPaperIds.has(item.paper_id))
    .map((item) => item.concept_id as string);
  return {
    row_id: move.id,
    requirement_label: move.reused_requirement,
    principle_label: move.reused_principle,
    feature_label: move.candidate_feature,
    artifact_pattern: move.artifact_pattern,
    supporting_papers: move.supporting_paper_ids,
    evidence_ids: move.evidence_ids,
    concept_ids: uniqueStrings([...selected.map((concept) => concept.concept_id), ...evidenceConceptIds]),
    adaptation_text: move.adaptation_note,
    adaptation_status: move.adaptation_status,
    confidence: move.confidence
  };
}

function compactFlowDirectAnswer(paperCount: number, moveCount: number, evidenceCount: number) {
  if (!paperCount) return "I could not find a sufficiently grounded OKF match for this flow request. Try naming a paper, DSR element type, or design domain from the library.";
  return `The graph is a mixed reuse flow. Stored OKF concepts support the design moves; product/problem-specific nodes are marked query_generated. This flow is partly query-generated from retrieved OKF design knowledge. I found ${paperCount} relevant OKF source paper(s), ${moveCount} reusable design move(s), and ${evidenceCount} selected evidence snippet(s).`;
}
function compactDirectAnswer(_query: string, paperCount: number, moveCount: number, evidenceCount: number) {
  if (!paperCount) return "I could not find a sufficiently grounded OKF match for this question. Try naming a paper, DSR element type, or design domain from the library.";
  return `Use the retrieved OKF knowledge as decision support for a domain-adapted architecture, not as a paper summary. I found ${paperCount} relevant OKF source paper(s), ${moveCount} reusable design move(s), and ${evidenceCount} selected evidence snippet(s); reuse stored requirements, principles, and features where they match, and treat target-domain constructs as mixed or query-generated adaptations.`;
}

function architectureDirection(rows: OkfReuseFlowRow[]) {
  const artifacts = rows.map((row) => row.artifact_pattern).filter(Boolean).slice(0, 3);
  return artifacts.length ? `Combine ${artifacts.join("; ")} into a relation-backed DSR architecture, keeping query-specific pieces explicitly marked.` : undefined;
}

function compactLimitations(paperCount: number, evidenceCount: number) {
  const limitations = ["Use only the retrieved OKF papers and evidence as support; query-specific adaptations still need project validation."];
  if (paperCount < 2) limitations.push("Cross-paper support is limited for this query in the loaded OKF library.");
  if (evidenceCount === 0) limitations.push("No selected evidence snippets were available for the compact fallback summary.");
  return limitations;
}

function sourceRoles(concepts: OkfConcept[], kb: OkfKnowledgeBase, ranked: OkfPaperSupport[]) {
  return ranked.map((paper) => {
    const paperConcepts = concepts.filter((concept) => concept.paper_id === paper.paper_id);
    const evidenceCount = kb.evidence_items.filter((item) => item.paper_id === paper.paper_id && (!item.concept_id || paperConcepts.some((concept) => concept.concept_id === item.concept_id))).length;
    const roles = paperDomainRole(paper.paper_id, paper.title) ?? ([...new Set(paperConcepts.map((concept) => roleLabel(concept.type)))].join(", ") || "Matched source");
    return { paper_id: paper.paper_id, title: paper.title, role: roles, reason: paper.reason, requirements_count: paperConcepts.filter((concept) => concept.type === "DesignRequirement").length, principles_count: paperConcepts.filter((concept) => concept.type === "DesignPrinciple").length, features_count: paperConcepts.filter((concept) => concept.type === "DesignFeature").length, evidence_count: evidenceCount, score: paper.score };
  });
}

function card(title: string, row: OkfReuseFlowRow, type: OkfConceptType, concepts: OkfConcept[]) {
  const conceptMap = new Map(concepts.map((concept) => [concept.concept_id, concept]));
  const concept = row.concept_ids.map((id) => conceptMap.get(id)).find((candidate) => candidate?.type === type);
  return { title, evidence_ids: row.evidence_ids, confidence: row.confidence, paper_id: concept?.paper_id ?? row.supporting_papers[0], concept_id: concept?.concept_id };
}

function bestConcept(concepts: OkfConcept[], type: OkfConceptType, terms: string[]) {
  return concepts
    .filter((concept) => concept.type === type)
    .map((concept) => ({ concept, score: scoreConcept(concept, terms) }))
    .sort((a, b) => b.score - a.score || confidenceRank(b.concept.confidence) - confidenceRank(a.concept.confidence))[0]?.concept;
}

function relationConnected(concepts: OkfConcept[], kb: OkfKnowledgeBase) {
  const ids = new Set(concepts.map((concept) => concept.concept_id));
  return kb.relations.some((relation) => ids.has(relation.source_concept_id) && ids.has(relation.target_concept_id));
}

function scoreConcept(concept: OkfConcept, terms: string[]) {
  const metadata = normalizeText([concept.title, concept.type, concept.dsr_layer, concept.tags.join(" ")].join(" "));
  const body = normalizeText([concept.description, concept.body_text].join(" "));
  return scoreText(metadata, terms) * 3 + scoreText(body, terms);
}

function scoreText(text: string, terms: string[]) {
  if (!terms.length) return 1;
  return terms.reduce((sum, term) => sum + (text.includes(normalizeText(term)) ? 1 : 0), 0);
}

function roleLabel(type: string) {
  if (type === "DesignRequirement") return "Requirement";
  if (type === "DesignPrinciple") return "Design principle";
  if (type === "DesignFeature") return "Feature";
  if (type === "Artifact") return "Artifact pattern";
  if (type === "Evaluation") return "Evaluation";
  if (type === "OutputKnowledge") return "Output knowledge";
  if (type === "KernelTheory") return "Kernel theory";
  if (type === "Limitation") return "Limitation";
  return type;
}

function confidenceFromEvidence(evidenceCount: number, concepts: OkfConcept[]): ConfidenceLabel {
  if (evidenceCount >= 4 && concepts.length >= 3) return "medium-high";
  if (evidenceCount >= 2) return "medium";
  if (evidenceCount === 1) return "medium";
  return "low";
}

function confidenceRank(value: ConfidenceLabel) {
  if (value === "high") return 4;
  if (value === "medium-high") return 3;
  if (value === "medium") return 2;
  return 1;
}

function dedupeRows(rows: OkfReuseFlowRow[]) {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = normalizeText(`${row.requirement_label} ${row.principle_label} ${row.feature_label} ${row.artifact_pattern}`);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeCards<T extends { concept_id?: string; paper_id?: string; title: string }>(cards: T[]) {
  const seen = new Set<string>();
  return cards.filter((card, index) => {
    const key = card.concept_id ?? `${card.paper_id ?? "unknown"}-${normalizeText(card.title)}-${index}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function cleanMoveTitle(title: string, index: number) {
  const trimmed = title.replace(/^Use\s+/i, "").trim();
  return trimmed || `Design move ${index + 1}`;
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function uniqueEvidence(items: OkfEvidenceRef[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.evidence_id)) return false;
    seen.add(item.evidence_id);
    return true;
  });
}

function expandQueryTerms(terms: string[]) {
  const expansions: Record<string, string[]> = {
    identity: ["credential", "issuer", "verifier", "wallet", "did", "actor", "authentication", "reputation"],
    identities: ["identity", "credential", "issuer", "verifier"],
    credential: ["identity", "issuer", "verifier", "revocation", "status", "wallet"],
    credentials: ["credential", "identity", "issuer", "verifier"],
    privacy: ["confidential", "sensitive", "consent", "permission", "access", "off", "chain", "hash", "disclosure"],
    preserving: ["privacy", "confidential", "permission"],
    decentralized: ["blockchain", "distributed", "smart", "contract", "wallet"],
    auditability: ["audit", "trace", "status", "log", "evidence", "monitoring", "provenance"],
    audit: ["auditability", "trace", "status", "log", "evidence", "monitoring"],
    review: ["reputation", "trust", "screening", "rating", "feedback", "verification"],
    reviews: ["review", "reputation", "trust", "screening"],
    product: ["identifier", "variant", "standard", "catalog", "listing", "gtin", "gln", "eclass"],
    variant: ["product", "identifier", "catalog", "listing"],
    listing: ["product", "catalog", "identity", "history", "status"],
    relisting: ["listing", "history", "status", "continuity", "identity"],
    marketplace: ["seller", "buyer", "exchange", "trust", "reputation", "capacity"],
    marketplaces: ["marketplace", "seller", "buyer", "exchange"],
    commercial: ["privacy", "sensitive", "poaching", "confidential", "data"],
    competitors: ["privacy", "sensitive", "poaching", "governance"],
    dispute: ["governance", "authority", "fairness", "correction"],
    manipulation: ["tamper", "integrity", "provenance", "hash", "authenticity", "certification"],
    manipulated: ["manipulation", "tamper", "integrity", "provenance"],
    integrity: ["tamper", "hash", "provenance", "authenticity", "certification"],
    system: ["architecture", "implementation", "evaluation", "testing", "lifecycle"],
    architecture: ["system", "implementation", "off", "chain", "on", "chain", "hybrid"]
  };
  return [...new Set(terms.flatMap((term) => [term, ...(expansions[term] ?? [])]))];
}

export function inferDesignThemes(query: string) {
  const q = normalizeText(query);
  const matched = designThemes
    .map((theme) => ({ theme, score: theme.queryTerms.reduce((sum, term) => sum + (q.includes(normalizeText(term)) ? 1 : 0), 0) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.theme.label.localeCompare(b.theme.label))
    .map((item) => item.theme);
  return matched.length ? matched : designThemes.filter((theme) => ["integrity", "privacy", "identity", "lifecycle"].includes(theme.id));
}

function paperDomainRole(paperId: string, title: string) {
  const key = normalizeText(`${paperId} ${title}`);
  if (key.includes("short end stick")) return "COMMERCIAL-DATA PRIVACY";
  if (key.includes("ssi kyc")) return "IDENTITY CREDENTIALS";
  if (key.includes("trust capacity")) return "TRUST / REPUTATION";
  if (key.includes("blockchain iot")) return "TAMPER-RESISTANT EVIDENCE";
  if (key.includes("integrated blockchain isdm")) return "IMPLEMENTATION LIFECYCLE";
  if (key.includes("hie consent")) return "PERMISSIONED STATUS SHARING";
  if (key.includes("peer review token")) return "TOKEN INCENTIVES";
  if (key.includes("nil nft")) return "NFT MARKETPLACE GOVERNANCE";
  if (key.includes("newsvendor")) return "ORACLE / PAYMENT COORDINATION";
  return undefined;
}

function tokenize(value: string) {
  return normalizeText(value).split(/\s+/).filter((term) => term.length > 2 && !["the", "and", "for", "with", "that", "what", "which", "use", "from", "prior", "paper", "papers", "should", "where", "need", "needs", "into", "same", "exact"].includes(term));
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}


