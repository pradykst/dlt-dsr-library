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
  const paperTitles = new Map(payload.source_papers.map((paper) => [paper.paper_id, paper.title]));
  const moves = payload.design_moves.map((move, index) => {
    const supportingPapers = move.supporting_paper_ids.map((paperId) => paperTitles.get(paperId)).filter(Boolean).join("; ") || "Retrieved OKF source papers";
    const reuse = [...new Set([move.reused_requirement, move.reused_principle, move.candidate_feature].filter(Boolean))].join("; ") || "Retrieved OKF design knowledge";
    return [
      `### ${index + 1}. ${move.title}`,
      `- **What to build:** ${move.what_to_build}`,
      `- **Reuse from OKF:** ${reuse}`,
      `- **Supporting papers:** ${supportingPapers}`,
      `- **Evidence:** ${move.adaptation_note}`,
      `- **Adaptation status:** ${move.adaptation_status}`
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
  const add = (title: string, what: string, reused: string, terms: string[], status: DesignMove["adaptation_status"], evidenceSummary: string) => {
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
      adaptation_note: evidenceSummary,
      confidence: evidenceFor(terms).length >= 2 ? "medium" : "low"
    });
  };
  if (themes.has("identity") && (themes.has("integrity") || themes.has("auditability") || has(["product", "listing", "variant", "relist", "relisting"]))) add(has(["product", "listing", "variant"]) ? "Canonical product identity and listing mapping integrity" : "Canonical entity identity mapping integrity", has(["product", "listing", "variant"]) ? "Build a canonical product and variant registry that maps marketplace listings to the same underlying item, records listing changes, and keeps relisting continuity visible." : "Build a canonical mapping component that links equivalent entities across participating systems and records integrity proofs for changes.", "identity credentials, manipulation-resistant proof of integrity, and independently executed verification logic", ["short end", "ssi", "trust capacity", "iot"], "mixed", "OKF evidence supports combining identity signaling with provider-held records, public integrity proofs, and tamper-resistant status records; the canonical registry/listing map is a target-domain adaptation.");
  if (themes.has("privacy")) add(has(["commercial", "raw", "sensitive", "competitor"]) ? "Privacy-preserving commercial evidence handling" : "Privacy-preserving evidence handling", "Keep raw sensitive records with the information provider while exposing hashes, attestations, or minimal proofs that allow integrity checks without revealing commercial details.", "store sensitive data only with the provider, create proof of integrity, and use nonreversible reliable independently executed computation", ["short end", "iot", "ssi"], "mixed", "OKF evidence from commercial-data sharing and hybrid storage supports provider-held sensitive data, proof-of-integrity sharing, and off-chain raw data with on-chain or shared verification proofs.");
  if (themes.has("identity")) add(has(["seller", "buyer", "marketplace", "credential", "verified"]) ? "Persistent seller, marketplace, and buyer credentials" : "Persistent actor credentials and status checks", "Issue reusable credentials for participating actors and verify wallet-held proofs, issuer authority, and revocation/status before accepting identity claims, listings, purchases, or reviews.", "DID/wallet, issuer, verifier, verifiable credential, verifiable presentation, revocation registry, and privacy-preserving proof patterns", ["ssi", "trust capacity"], "mixed", "OKF evidence supports holder-controlled credentials, verifier proof requests, issuer trust anchors, revocation/status checks, and keeping blockchain use to public trust data.");
  if (themes.has("trust")) add(has(["review", "purchase"]) ? "Verified-purchase review gate and reputation continuity" : "Screening and reputation continuity", "Accept reputation events only when an eligible actor credential and qualifying action can be verified, then bind the event to persistent reputation history without exposing unnecessary raw data.", "signal information relevant to identity, screening functionality, reputation mechanism, authority/fairness, and incentive/deterrence mechanisms", ["trust capacity", "ssi"], has(["review", "purchase"]) ? "query_generated" : "mixed", "OKF evidence supports screening, identity signaling, reputation, authority, and deterrence as trust-building mechanisms; verified-purchase review gates are target-domain adaptations.");
  if (themes.has("auditability")) add(has(["review", "seller", "relist", "relisting"]) ? "Review and seller-history continuity" : "Status-history continuity and audit trail", "Maintain append-only status history for identity mappings, relisting events, verification decisions, reviews, seller history, and corrections.", "off-chain raw data storage, hash-based integrity records, status history, and tamper-resistant retrieval/certification services", ["iot", "ssi", "short end"], "mixed", "OKF evidence supports hybrid off-chain/on-chain integrity records and auditable status histories; review-continuity ledgers and seller relisting continuity are target-domain adaptations.");
  if (themes.has("governance")) add("Dispute and correction governance", "Define authority rules, correction workflows, fairness controls, and joint approval for changes to computation or verification mechanisms.", "authority/fairness, joint approval for computation-mechanism changes, and governance over shared rules", ["trust capacity", "short end", "isdm"], "mixed", "OKF evidence supports authority and fairness controls plus joint governance so no party can unilaterally change verification logic or correct contested records without review.");
  if (themes.has("lifecycle")) add("Implementation and evaluation lifecycle", "Run analysis, actor identification, off-chain/on-chain design, smart-contract skeletoning, testing, deployment, and monitoring before committing to the production architecture.", "analysis, actor identification, off/on-chain design, smart contract skeleton, testing, deployment, and monitoring stages", ["isdm"], "mixed", "OKF evidence supports a lifecycle sequence for blockchain systems, including analysis, actors, off/on-chain design, smart contracts, tests, deployment, and monitoring.");
  return moves.filter((move) => move.supporting_paper_ids.length || move.evidence_ids.length);
}

function thematicArchitectureDirection(query: string) {
  const q = normalizeText(query);
  if (q.includes("privacy") || q.includes("commercial") || q.includes("raw")) return "Use a coherent hybrid protocol architecture: maintain a canonical identity and variant registry; map marketplace listings and seller relistings to that canonical identity; keep raw commercial records off-chain with the data provider; publish integrity hashes, status proofs, and credential trust anchors only; gate reviews through verified purchase proofs; maintain review and seller-history continuity; govern disputes and corrections through explicit authority and joint-change rules.";
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
  const domainReason = paperDomainReason(paperId);
  if (domainReason) return domainReason;
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
    SHORT_END_STICK_2025: ["integrity", "integrity", "privacy", "privacy", "privacy", "privacy", "governance", "governance"],
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

function paperDomainReason(paperId: string) {
  if (paperId === "SHORT_END_STICK_2025") return "Supports proof-of-integrity sharing without exposing provider-held sensitive data, with independent computation and joint mechanism governance.";
  if (paperId === "SSI_KYC_FRAMEWORK_2022") return "Supports reusable actor credentials, verifier proof checks, revocation/status handling, and blockchain use only for public trust data.";
  if (paperId === "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024") return "Supports identity signaling, screening, reputation, authority/fairness, and deterrence mechanisms for trusted exchange.";
  if (paperId === "BLOCKCHAIN_IOT_SDPS_2019") return "Supports hybrid raw-data storage, hash-based integrity proofs, certification/retrieval services, and access-key management.";
  if (paperId === "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024") return "Supports the lifecycle from analysis and actor identification through off/on-chain design, smart contracts, testing, deployment, and monitoring.";
  if (paperId === "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023") return "Supports auditable permission/status sharing, interoperability, and permissioned access when adapted outside healthcare.";
  if (paperId === "PEER_REVIEW_TOKEN_INCENTIVES_2025") return "Supports token incentives only when reviewer rewards or tokenized contribution mechanisms are part of the design problem.";
  if (paperId === "NIL_NFT_MARKETPLACE_2026") return "Supports NFT marketplace fairness, royalties, and allocation mechanisms only when those themes are part of the design problem.";
  if (paperId === "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021") return "Supports oracle and payment coordination when forecasting, inventory, or settlement are part of the design problem.";
  return undefined;
}
function tokenize(value: string) {
  return normalizeText(value).split(/\s+/).filter((term) => term.length > 2 && !["the", "and", "for", "with", "that", "what", "which", "use", "from", "prior", "paper", "papers", "should", "where", "need", "needs", "into", "same", "exact"].includes(term));
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
