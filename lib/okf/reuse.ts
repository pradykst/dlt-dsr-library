import { buildOkfFlow } from "./flow.ts";
import type { ConfidenceLabel, DecisionSupportAnswer, DesignMove, OkfConcept, OkfConceptType, OkfEvidenceRef, OkfKnowledgeBase, OkfPaperSupport, OkfReuseFlowRow } from "./schema.ts";
import type { OkfChatResponse, OkfQueryPlan } from "./chat.ts";

const relationExpansionTypes = new Set(["Problem", "ResearchQuestion", "DesignRequirement", "DesignPrinciple", "DesignFeature", "Artifact", "Evaluation", "OutputKnowledge", "KernelTheory", "Limitation"]);
const rowTypes: OkfConceptType[] = ["DesignRequirement", "DesignPrinciple", "DesignFeature", "Artifact"];
const answerConceptTypes: OkfConceptType[] = ["DesignRequirement", "DesignPrinciple", "DesignFeature", "Artifact", "Evaluation", "OutputKnowledge", "KernelTheory", "Limitation"];
const compactConceptTypes: OkfConceptType[] = ["DesignRequirement", "DesignPrinciple", "DesignFeature", "Artifact", "Evaluation", "OutputKnowledge", "KernelTheory", "Limitation"];

type DesignTheme = {
  id: string;
  label: string;
  queryTerms: string[];
  matchTerms: string[];
};

const designThemes: DesignTheme[] = [
  { id: "integrity", label: "integrity / manipulation prevention", queryTerms: ["manipulation", "manipulated", "inconsistent", "integrity", "authenticity", "proof", "tamper", "description", "descriptions", "opportunism"], matchTerms: ["manipulation", "manipulated", "integrity", "tamper", "proof", "hash", "authentic", "certification", "provenance", "truthful", "opportunism", "description"] },
  { id: "privacy", label: "privacy / data minimization / sensitive data protection", queryTerms: ["privacy", "private", "sensitive", "raw", "commercial", "competitor", "competitors", "expose", "confidential", "poaching", "records", "data minimization"], matchTerms: ["privacy", "private", "sensitive", "confidential", "poaching", "raw data", "off chain", "off-chain", "disclosure", "permission", "access", "commercial", "protected"] },
  { id: "identity", label: "identity / credentials / issuer-verifier-holder", queryTerms: ["identity", "identities", "credential", "credentials", "issuer", "verifier", "holder", "verified", "purchase", "buyer", "seller", "relisting", "variant", "product"], matchTerms: ["identity", "credential", "credentials", "issuer", "verifier", "holder", "wallet", "did", "revocation", "status", "proof request", "non revocation", "authentication", "product", "variant", "seller", "buyer"] },
  { id: "trust", label: "screening / reputation / trust", queryTerms: ["review", "reviews", "verified purchase", "reputation", "trust", "screening", "seller", "buyer", "marketplace", "marketplaces", "deterrence"], matchTerms: ["review", "reviews", "reputation", "trust", "screening", "signaling", "deterrence", "seller", "buyer", "identity signaling", "persistent identity", "authority"] },
  { id: "auditability", label: "auditability / status history", queryTerms: ["audit", "auditability", "history", "continuity", "status", "trace", "traceability", "relist", "relisting", "listed", "listing"], matchTerms: ["audit", "auditable", "history", "status", "trace", "transaction log", "append only", "append-only", "continuity", "monitoring", "provenance", "revocation"] },
  { id: "governance", label: "governance / authority / fairness", queryTerms: ["governance", "authority", "fairness", "dispute", "correction", "appeal", "marketplace", "marketplaces", "competitors"], matchTerms: ["governance", "authority", "fairness", "joint", "dispute", "correction", "committee", "rules", "compliance", "interorganizational"] },
  { id: "lifecycle", label: "implementation lifecycle / evaluation", queryTerms: ["implementation", "lifecycle", "evaluation", "testing", "maintenance", "architecture", "artifact", "prototype", "build"], matchTerms: ["implementation", "lifecycle", "evaluation", "testing", "maintenance", "artifact", "prototype", "modeling", "roles", "architecture", "design cycle"] }
];

export function selectSourcePapers(query: string, kb: OkfKnowledgeBase, maxPapers = 8): OkfPaperSupport[] {
  const terms = expandQueryTerms(tokenize(query));
  const themes = inferDesignThemes(query);
  return kb.papers
    .map((paper) => {
      const concepts = kb.concepts.filter((concept) => concept.paper_id === paper.paper_id);
      const evidence = kb.evidence_items.filter((item) => item.paper_id === paper.paper_id);
      const haystack = normalizeText([
        paper.paper_id,
        paper.title,
        paper.body_text,
        ...concepts.flatMap((concept) => [concept.title, concept.description, concept.body_text, concept.tags.join(" "), concept.type, concept.dsr_layer]),
        ...evidence.flatMap((item) => [item.paraphrase, item.quote, item.section])
      ].join(" "));
      const themeScore = scoreThemes(haystack, themes) + paperThemeRoleBoost(paper.paper_id, themes);
      const score = scoreText(haystack, terms) + conceptCoverageScore(concepts, terms, kb, themes) + titlePhraseScore(paper.title, query) + themeScore + paperRelevanceAdjustment(paper.paper_id, paper.title, query, themes);
      const reason = reasonForPaper(concepts, terms, kb, themes, paper.paper_id);
      return { paper_id: paper.paper_id, title: paper.title, reason, score };
    })
    .filter((paper) => paper.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, maxPapers);
}

export function buildReuseFlowResponse(query: string, plan: OkfQueryPlan, kb: OkfKnowledgeBase): OkfChatResponse {
  const paperSupport = selectSourcePapers(query, kb, 8);
  const concepts = retrieveConcepts(query, kb, paperSupport.map((paper) => paper.paper_id));
  const evidenceRefs = evidenceForConcepts(concepts, kb);
  const rows = buildRows(query, paperSupport, concepts, evidenceRefs, kb).slice(0, 8);
  const flow = buildOkfFlow(query, concepts, kb, { includeQueryProblem: true });
  const sourcePapers = sourceRoles(concepts, kb, paperSupport);
  const payload = buildFallbackAnswer(query, rows, sourcePapers, evidenceRefs, plan, undefined);
  const warnings = sourcePapers.length === 0 ? ["No OKF source paper matched the query strongly enough for grounded reuse guidance."] : [];

  return {
    intent: "DESIGN_REUSE_FLOW_QUERY",
    task_type: "design_reuse_flow",
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
    flow_rows: rows,
    answer_payload: payload,
    assumptions: payload.query_generated_notes,
    limitations: payload.limitations,
    warnings
  };
}

export function buildFallbackAnswer(query: string, rows: OkfReuseFlowRow[], papers: OkfChatResponse["source_papers"], evidence: OkfEvidenceRef[], plan: OkfQueryPlan | undefined, fallbackReason?: string): DecisionSupportAnswer {
  const usedEvidenceIds = new Set(rows.flatMap((row) => row.evidence_ids));
  const evidenceRefs = evidence.filter((item) => usedEvidenceIds.has(item.evidence_id)).slice(0, 30);
  const source_papers = papers.slice(0, 8).map((paper) => ({ paper_id: paper.paper_id, title: paper.title, reason: paper.reason, score: paper.score ?? 0 }));
  const thematicMoves = thematicDesignMoves(query, rows, papers);
  const designMoves = thematicMoves.length >= 5 ? thematicMoves.slice(0, 7) : rows.slice(0, 7).map((row, index) => designMoveFromRow(row, index));
  const direct = fallbackReason
    ? "I retrieved relevant OKF knowledge, but LLM synthesis failed. Here is a compact evidence-backed summary."
    : compactDirectAnswer(query, source_papers.length, designMoves.length, evidenceRefs.length);
  return {
    synthesis_mode: "deterministic_fallback",
    title: fallbackReason ? "Compact OKF fallback summary" : "OKF decision-support summary",
    direct_answer: direct,
    design_moves: designMoves,
    architecture_direction: thematicMoves.length >= 5 ? thematicArchitectureDirection(query) : architectureDirection(rows),
    limitations: compactLimitations(source_papers.length, evidenceRefs.length),
    source_papers,
    evidence_refs: evidenceRefs,
    query_generated_notes: rows.filter((row) => row.adaptation_status !== "stored").map((row) => `${row.row_id}: ${row.adaptation_text}`).slice(0, 8),
    debug: { task_type: plan?.task_type, requested_output_shape: plan?.output_shape, fallback_reason: fallbackReason, source_paper_count: papers.length, retrieved_evidence_count: evidence.length }
  };
}

export function renderDecisionSupportMarkdown(payload: DecisionSupportAnswer) {
  const moves = payload.design_moves.map((move, index) => `${index + 1}. ${move.title}: ${move.what_to_build}`).join("\n");
  const papers = payload.source_papers.map((paper) => paper.title).join("; ") || "No source papers selected";
  return [payload.direct_answer, moves ? `Design moves:\n${moves}` : "Design moves: no grounded moves were available.", payload.architecture_direction ? `Architecture direction: ${payload.architecture_direction}` : undefined, `Source papers: ${papers}`, `Evidence coverage: ${payload.evidence_refs.length} selected evidence snippet(s).`].filter(Boolean).join("\n\n");
}

function retrieveConcepts(query: string, kb: OkfKnowledgeBase, paperIds: string[]) {
  const terms = expandQueryTerms(tokenize(query));
  const themes = inferDesignThemes(query);
  const paperSet = new Set(paperIds);
  const scored = kb.concepts
    .filter((concept) => paperSet.has(concept.paper_id) && relationExpansionTypes.has(concept.type))
    .map((concept) => ({ concept, score: scoreConceptWithEvidence(concept, terms, kb, themes) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || confidenceRank(b.concept.confidence) - confidenceRank(a.concept.confidence));
  const selected: OkfConcept[] = [];
  for (const paperId of paperIds) {
    const paperScored = scored.filter((item) => item.concept.paper_id === paperId);
    for (const type of compactConceptTypes) {
      const limit = type === "DesignRequirement" || type === "DesignPrinciple" || type === "DesignFeature" ? 3 : 2;
      selected.push(...paperScored.filter((item) => item.concept.type === type).slice(0, limit).map((item) => item.concept));
    }
    if (!paperScored.length) selected.push(...answerConceptTypes.flatMap((type) => kb.concepts.filter((concept) => concept.paper_id === paperId && concept.type === type).slice(0, 1)));
  }
  selected.push(...scored.slice(0, 24).map((item) => item.concept));
  const ids = new Set(unique(selected).map((concept) => concept.concept_id));
  expandRelationNeighborhood(ids, kb, paperSet, 1, 96);
  return order(kb.concepts.filter((concept) => ids.has(concept.concept_id))).slice(0, 96);
}

function buildRows(query: string, papers: OkfPaperSupport[], concepts: OkfConcept[], evidence: OkfEvidenceRef[], kb: OkfKnowledgeBase): OkfReuseFlowRow[] {
  const relationRows = buildRelationRows(concepts, evidence, kb);
  const paperRows = papers.map((paper, index) => buildPaperRow(query, paper, concepts.filter((concept) => concept.paper_id === paper.paper_id), evidence, index)).filter((row): row is OkfReuseFlowRow => Boolean(row));
  const crossPaperRows = buildCrossPaperRows(query, papers, concepts, evidence, kb);
  return rankRowsForQuery(query, papers, dedupeRows([...paperRows, ...crossPaperRows, ...relationRows])).slice(0, 8);
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
  return rowFromConcepts(`paper-${paper.paper_id}-${index + 1}`, selected, evidence, selected.length >= 3 ? "stored" : "mixed");
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
    if (selected.length >= 8) break;
  }
  return selected;
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
    principle_label: byType("DesignPrinciple")?.title ?? "Use the selected source paper's reusable design principle",
    feature_label: byType("DesignFeature")?.title ?? "Translate the principle into a query-specific feature",
    artifact_pattern: byType("Artifact")?.title ?? "Query-specific artifact pattern grounded in retrieved OKF concepts",
    supporting_papers: papers,
    evidence_ids: evidenceIds,
    concept_ids: conceptIds,
    adaptation_text: adaptationStatus === "stored" ? "This move follows stored OKF concepts and relation-connected evidence." : "This move adapts retrieved OKF concepts to the user's design context; unstored adaptations are marked as mixed or query_generated.",
    adaptation_status: adaptationStatus,
    confidence: confidenceFromEvidence(evidenceIds.length, selected)
  };
}

function thematicDesignMoves(query: string, rows: OkfReuseFlowRow[], papers: OkfChatResponse["source_papers"]): DesignMove[] {
  const q = normalizeText(query);
  const themes = new Set(inferDesignThemes(query).map((theme) => theme.id));
  const has = (terms: string[]) => terms.some((term) => q.includes(normalizeText(term)));
  const evidenceFor = (paperTerms: string[]) => rows.filter((row) => row.supporting_papers.some((paperId) => paperTerms.some((term) => normalizeText(paperId).includes(term)))).flatMap((row) => row.evidence_ids).slice(0, 6);
  const paperIdsFor = (paperTerms: string[]) => papers.filter((paper) => paperTerms.some((term) => normalizeText(`${paper.paper_id} ${paper.title} ${paper.role}`).includes(term))).map((paper) => paper.paper_id).slice(0, 3);
  const moves: DesignMove[] = [];
  const add = (title: string, what: string, reused: string, terms: string[], status: DesignMove["adaptation_status"]) => {
    moves.push({
      id: `theme-${moves.length + 1}-${normalizeText(title).replace(/\s+/g, "-").slice(0, 36)}`,
      title,
      what_to_build: what,
      reused_requirement: reused,
      reused_principle: reused,
      candidate_feature: what,
      artifact_pattern: what,
      supporting_paper_ids: paperIdsFor(terms),
      evidence_ids: evidenceFor(terms),
      adaptation_status: status,
      adaptation_note: "Theme-derived fallback move synthesized from selected OKF papers; validate the domain adaptation in the target project.",
      confidence: evidenceFor(terms).length >= 2 ? "medium" : "low"
    });
  };
  if (themes.has("identity") && (themes.has("integrity") || themes.has("auditability") || has(["product", "listing", "variant", "relist", "relisting"]))) add(has(["product", "listing", "variant"]) ? "Canonical product identity and listing mapping integrity" : "Canonical entity identity mapping integrity", "Build a canonical mapping component that links equivalent entities across participating systems and records integrity proofs for changes.", "identity credentials plus manipulation-resistant proof of integrity", ["short end", "ssi", "trust capacity", "iot"], "mixed");
  if (themes.has("privacy")) add(has(["commercial", "raw", "sensitive", "competitor"]) ? "Privacy-preserving commercial evidence handling" : "Privacy-preserving evidence handling", "Keep raw sensitive records under the data owner's control while sharing hashes, attestations, or minimal proofs needed for verification.", "private sensitive-data storage with public proof and data minimization", ["short end", "iot", "ssi"], "mixed");
  if (themes.has("identity")) add(has(["seller", "buyer", "marketplace", "credential", "verified"]) ? "Persistent seller, marketplace, and buyer credentials" : "Persistent actor credentials and status checks", "Issue reusable credentials for participating actors and verify status, revocation, and authority before accepting claims or actions.", "issuer-verifier-holder credentials, proof requests, and status/revocation checks", ["ssi", "trust capacity"], "mixed");
  if (themes.has("trust")) add(has(["review", "purchase"]) ? "Verified-purchase review gate and reputation continuity" : "Screening and reputation continuity", "Accept reputation events only when an eligible actor credential and qualifying action can be verified without exposing unnecessary raw data.", "screening, reputation, persistent identity, and deterrence patterns", ["trust capacity", "ssi"], has(["review", "purchase"]) ? "query_generated" : "mixed");
  if (themes.has("auditability")) add("Status-history continuity and audit trail", "Maintain append-only status history for identity mappings, relisting events, verification decisions, and corrections.", "auditability, status history, and tamper-resistant proof patterns", ["iot", "ssi", "short end"], "mixed");
  if (themes.has("governance")) add("Dispute and correction governance", "Define authority rules, correction workflows, and fairness controls for false mappings, manipulated descriptions, or contested reputation events.", "authority/fairness and joint-governance design knowledge", ["trust capacity", "short end", "isdm"], "mixed");
  if (themes.has("lifecycle")) add("Implementation and evaluation lifecycle", "Model roles, data flows, verification transactions, tests, deployment, and maintenance before committing to a blockchain architecture.", "implementation lifecycle, modeling, testing, and maintenance guidance", ["isdm"], "mixed");
  return moves.filter((move) => move.supporting_paper_ids.length || move.evidence_ids.length);
}

function thematicArchitectureDirection(query: string) {
  const q = normalizeText(query);
  if (q.includes("privacy") || q.includes("commercial") || q.includes("raw")) return "Use a hybrid architecture: keep raw sensitive data off shared infrastructure, publish only minimal proofs or status records, verify actor credentials at decision points, and govern corrections through explicit authority rules.";
  return "Use a layered architecture that separates private records, shared verification proofs, actor credentials, reputation/status services, governance workflows, and implementation/evaluation activities.";
}

function designMoveFromRow(row: OkfReuseFlowRow, index: number): DesignMove {
  return {
    id: row.row_id || `design-move-${index + 1}`,
    title: cleanMoveTitle(row.principle_label || row.requirement_label || row.feature_label, index),
    what_to_build: row.artifact_pattern || row.feature_label,
    reused_requirement: row.requirement_label,
    reused_principle: row.principle_label,
    candidate_feature: row.feature_label,
    artifact_pattern: row.artifact_pattern,
    supporting_paper_ids: row.supporting_papers,
    evidence_ids: row.evidence_ids,
    adaptation_status: row.adaptation_status,
    adaptation_note: row.adaptation_text,
    confidence: row.confidence
  };
}

function compactDirectAnswer(_query: string, paperCount: number, moveCount: number, evidenceCount: number) {
  if (!paperCount) return "I could not find a sufficiently grounded OKF match for this question. Try naming a paper, DSR element type, or design domain from the library.";
  return `I found ${paperCount} relevant OKF source paper(s), ${moveCount} reusable design move(s), and ${evidenceCount} selected evidence snippet(s). Use these as decision support: reuse stored requirements/principles/features where they match, and treat domain-specific adaptations as mixed or query_generated.`;
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

function evidenceForConcepts(concepts: OkfConcept[], kb: OkfKnowledgeBase): OkfEvidenceRef[] {
  const conceptIds = new Set(concepts.map((concept) => concept.concept_id));
  return kb.evidence_items
    .filter((item) => item.concept_id && conceptIds.has(item.concept_id))
    .map((item) => ({ evidence_id: item.evidence_id, paper_id: item.paper_id, concept_id: item.concept_id, excerpt: item.quote ?? item.paraphrase, section: item.section, page_number: item.page_number, confidence: item.confidence }));
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

function reasonForPaper(concepts: OkfConcept[], terms: string[], kb: OkfKnowledgeBase, themes: DesignTheme[], paperId: string) {
  const role = paperDomainRole(paperId, "");
  if (role) return role;
  const typeScores = answerConceptTypes.map((type) => ({ type, score: concepts.filter((concept) => concept.type === type).reduce((sum, concept) => sum + scoreConceptWithEvidence(concept, terms, kb, themes), 0) })).sort((a, b) => b.score - a.score);
  const best = typeScores.find((item) => item.score > 0);
  const theme = themes[0]?.label;
  return best ? `matched ${theme ?? roleLabel(best.type).toLowerCase()}` : "matched OKF concept metadata";
}

function conceptCoverageScore(concepts: OkfConcept[], terms: string[], kb: OkfKnowledgeBase, themes: DesignTheme[]) {
  const matchedTypes = new Set(concepts.filter((concept) => scoreConceptWithEvidence(concept, terms, kb, themes) > 0).map((concept) => concept.type));
  const usefulTypes = [...matchedTypes].filter((type) => answerConceptTypes.includes(type));
  return usefulTypes.length * 3;
}


function paperRelevanceAdjustment(paperId: string, title: string, query: string, themes: DesignTheme[]) {
  const paperKey = normalizeText(`${paperId} ${title}`);
  const q = normalizeText(query);
  const hasAny = (terms: string[]) => terms.some((term) => q.includes(normalizeText(term)));
  if ((paperKey.includes("peer review") || paperKey.includes("token incentive")) && !hasAny(["token", "incentive", "reward", "reviewer", "journal", "peer review", "academic review"])) return -120;
  if ((paperKey.includes("nil") || paperKey.includes("nft") || paperKey.includes("marketplace")) && !hasAny(["nft", "royalty", "royalties", "fairness", "minting", "random", "market design", "student athlete", "nil"])) return -80;
  if ((paperKey.includes("newsvendor") || paperKey.includes("forecasting")) && !hasAny(["forecast", "forecasting", "newsvendor", "oracle", "payment", "inventory", "supply"])) return -80;
  if (paperKey.includes("hie") && !hasAny(["health", "healthcare", "patient", "consent", "medical", "hie"]) && themes.some((theme) => ["privacy", "auditability"].includes(theme.id))) return -35;
  return 0;
}
function titlePhraseScore(title: string, query: string) {
  const titleTerms = new Set(tokenize(title));
  return tokenize(query).filter((term) => titleTerms.has(term)).length * 3;
}

function scoreConceptWithEvidence(concept: OkfConcept, terms: string[], kb: OkfKnowledgeBase, themes: DesignTheme[]) {
  const evidenceText = kb.evidence_items.filter((item) => item.concept_id === concept.concept_id).map((item) => [item.paraphrase, item.quote, item.section].join(" ")).join(" ");
  const withEvidence = { ...concept, body_text: `${concept.body_text} ${evidenceText}` };
  return scoreConcept(withEvidence, terms) + scoreThemes(normalizeConceptText(withEvidence), themes) * 2;
}

function scoreConcept(concept: OkfConcept, terms: string[]) {
  const metadata = normalizeText([concept.title, concept.type, concept.dsr_layer, concept.tags.join(" ")].join(" "));
  const body = normalizeText([concept.description, concept.body_text].join(" "));
  return scoreText(metadata, terms) * 3 + scoreText(body, terms);
}

function normalizeConceptText(concept: OkfConcept) {
  return normalizeText([concept.title, concept.description, concept.body_text, concept.tags.join(" "), concept.type, concept.dsr_layer].join(" "));
}

function scoreText(text: string, terms: string[]) {
  if (!terms.length) return 1;
  return terms.reduce((sum, term) => sum + (text.includes(normalizeText(term)) ? 1 : 0), 0);
}

function expandRelationNeighborhood(ids: Set<string>, kb: OkfKnowledgeBase, paperSet: Set<string>, depth: number, maxIds: number) {
  const conceptMap = new Map(kb.concepts.map((concept) => [concept.concept_id, concept]));
  for (let step = 0; step < depth && ids.size < maxIds; step += 1) {
    let changed = false;
    for (const relation of kb.relations) {
      const source = conceptMap.get(relation.source_concept_id);
      const target = conceptMap.get(relation.target_concept_id);
      if (!source || !target || (!paperSet.has(source.paper_id) && !paperSet.has(target.paper_id))) continue;
      if (ids.has(source.concept_id) && isUsefulAdjacentType(source.type, target.type) && !ids.has(target.concept_id)) { ids.add(target.concept_id); changed = true; }
      if (ids.has(target.concept_id) && isUsefulAdjacentType(target.type, source.type) && !ids.has(source.concept_id)) { ids.add(source.concept_id); changed = true; }
      if (ids.size >= maxIds) break;
    }
    if (!changed) break;
  }
}

function isUsefulAdjacentType(from: string, to: string) {
  if (from === "Problem") return ["DesignRequirement", "DesignPrinciple", "Evidence"].includes(to);
  if (from === "DesignRequirement") return ["Problem", "DesignPrinciple", "DesignFeature", "Evidence"].includes(to);
  if (from === "DesignPrinciple") return ["DesignRequirement", "DesignFeature", "KernelTheory", "Evidence"].includes(to);
  if (from === "DesignFeature") return ["DesignPrinciple", "Artifact", "Evidence"].includes(to);
  if (from === "Artifact") return ["DesignFeature", "Evaluation", "Evidence"].includes(to);
  return relationExpansionTypes.has(to);
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

function unique(concepts: OkfConcept[]) {
  const seen = new Set<string>();
  return concepts.filter((concept) => {
    if (seen.has(concept.concept_id)) return false;
    seen.add(concept.concept_id);
    return true;
  });
}

function order(concepts: OkfConcept[]) {
  const typeOrder = ["Problem", "ResearchQuestion", "DesignRequirement", "DesignPrinciple", "DesignFeature", "Artifact", "Evaluation", "OutputKnowledge", "KernelTheory", "Limitation"];
  return unique(concepts).sort((a, b) => typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type) || a.concept_id.localeCompare(b.concept_id));
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

function scoreThemes(text: string, themes: DesignTheme[]) {
  return themes.reduce((sum, theme) => sum + Math.min(6, theme.matchTerms.reduce((hits, term) => hits + (text.includes(normalizeText(term)) ? 1 : 0), 0)), 0);
}

function paperThemeRoleBoost(paperId: string, themes: DesignTheme[]) {
  const ids = new Set(themes.map((theme) => theme.id));
  const paperRoles: Record<string, string[]> = {
    SHORT_END_STICK_2025: ["integrity", "privacy", "privacy", "governance"],
    SSI_KYC_FRAMEWORK_2022: ["identity", "privacy", "auditability"],
    TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024: ["trust", "identity", "governance"],
    BLOCKCHAIN_IOT_SDPS_2019: ["integrity", "integrity", "privacy", "auditability"],
    INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024: ["lifecycle", "governance"],
    HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023: ["privacy", "auditability"]
  };
  return (paperRoles[paperId] ?? []).reduce((score, themeId) => score + (ids.has(themeId) ? 10 : 0), 0);
}

function paperDomainRole(paperId: string, title: string) {
  const key = normalizeText(`${paperId} ${title}`);
  if (key.includes("short end stick")) return "commercial-data privacy";
  if (key.includes("ssi kyc")) return "identity credentials";
  if (key.includes("trust capacity")) return "trust/reputation";
  if (key.includes("blockchain iot")) return "tamper-resistant storage";
  if (key.includes("integrated blockchain isdm")) return "implementation lifecycle";
  if (key.includes("hie consent")) return "permissioned status sharing";
  if (key.includes("peer review token")) return "token incentives";
  if (key.includes("nil nft")) return "NFT marketplace governance";
  if (key.includes("newsvendor")) return "oracle/payment coordination";
  return undefined;
}

function tokenize(value: string) {
  return normalizeText(value).split(/\s+/).filter((term) => term.length > 2 && !["the", "and", "for", "with", "that", "what", "which", "use", "from", "prior", "paper", "papers", "should", "where", "need", "needs", "into", "same", "exact"].includes(term));
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
