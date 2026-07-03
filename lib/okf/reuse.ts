import { buildOkfFlow } from "./flow.ts";
import type { OkfAnswerPayload, OkfConcept, OkfEvidenceRef, OkfKnowledgeBase, OkfPaperSupport, OkfReuseFlowRow } from "./schema.ts";
import type { OkfChatResponse, OkfQueryPlan } from "./chat.ts";

const sourceProfiles = [
  { key: "sdps", aliases: ["blockchain for the iot", "sensor data", "sdps", "privacy-preserving protection"], reason: "tamper resistance, privacy, off-chain/on-chain hash storage, scalable architecture", terms: ["tamper", "privacy", "hash", "off-chain", "on-chain", "sensor", "scalable", "integrity", "manipulation"] },
  { key: "short_end", aliases: ["short end of the stick", "opportunism", "machine tool", "confidential"], reason: "confidential commercial data and two-sided opportunism controls", terms: ["confidential", "commercial", "competitor", "raw data", "opportunism", "poaching", "manipulation", "shared information"] },
  { key: "ssi_kyc", aliases: ["kyc", "self-sovereign", "ssi", "decentralized identity", "credential"], reason: "credentials, issuers, verifiable identity, revocation, and privacy-preserving proof", terms: ["credential", "issuer", "revocation", "status", "identity", "did", "wallet", "kyc", "ssi"] },
  { key: "trust", aliases: ["trust-enabling", "inter-organizational exchange of capacity", "capacity"], reason: "persistent identity, reputation, screening, authority, fairness, and deterrence", terms: ["trust", "identity", "reputation", "screening", "authority", "fairness", "deterrence", "review", "seller"] },
  { key: "consent", aliases: ["consent", "health information", "hie", "self-management"], reason: "auditable status changes, controlled sharing, and interoperability", terms: ["consent", "status", "sharing", "interoperability", "audit", "user-controlled"] },
  { key: "integrated", aliases: ["integrated framework", "developing blockchain systems", "isdm", "lifecycle"], reason: "blockchain implementation, evaluation lifecycle, roles, testing, deployment, and monitoring", terms: ["lifecycle", "development", "implementation", "evaluation", "testing", "smart contract", "monitoring", "roles"] },
  { key: "gs1", aliases: ["gs1", "gtin", "gln", "eclass", "pallet", "standards", "governance"], reason: "standards, identifiers, data-sharing architecture, governance, and use-case-first design", terms: ["gs1", "gtin", "gln", "eclass", "standard", "identifier", "governance", "pallet", "variant"] },
  { key: "token", aliases: ["token", "peer review", "incentiv"], reason: "reviewer incentives and tokenized review participation", terms: ["token", "incentive", "reward", "reviewer"] }
];

const rowTemplates = [
  { id: "canonical_identity", requirement: "Prevent product/listing/review manipulation", principle: "Create claim-to-verification integrity for records that may be stored off-chain", feature: "Canonicalization, signed claims, hash commitments, and event log", artifact: "Hybrid off-chain record store plus on-chain registry/indexer", adaptation: "Product records, listing claims, relisting events, and review commitments are product-identity-specific query-generated adaptations.", themes: ["sdps", "short_end", "gs1"] },
  { id: "privacy", requirement: "Prevent commercial-data leakage", principle: "Keep sensitive data with the owner and expose proof, commitment, or permissioned evidence only", feature: "Off-chain object storage, salted commitments, evidence roots, and access control", artifact: "Privacy-preserving evidence vault with blockchain commitments", adaptation: "Raw commercial data suppression for marketplace competitors is query-generated unless the OKF stores marketplace-specific nodes.", themes: ["short_end", "sdps", "consent"] },
  { id: "actor_identity", requirement: "Establish persistent actor identity", principle: "Use decentralized identity and verified identity signalling", feature: "DID or wallet identity, issuer registry, credential status, revocation, and GLN/KYB mapping", artifact: "Credential-backed marketplace actor identity service", adaptation: "Seller, marketplace, issuer, and auditor mappings are query-generated product-marketplace adaptations.", themes: ["ssi_kyc", "trust", "gs1"] },
  { id: "verified_purchase", requirement: "Gate reviews by verified purchase", principle: "Apply screening and validity checks before accepting a trust event", feature: "Purchase attestation, role checks, replay protection, and review commitment", artifact: "Verified-purchase review gate", adaptation: "Verified-purchase review eligibility is query-generated unless directly represented in OKF nodes.", themes: ["trust", "ssi_kyc", "sdps"] },
  { id: "continuity", requirement: "Preserve review and seller-history continuity", principle: "Tie reputation to persistent identity and canonical product variant rather than disposable listings", feature: "Product review attached to canonical variant and seller review attached to persistent seller id", artifact: "Review-continuity ledger/read model", adaptation: "Review follows canonical variant and seller relisting continuity are query-generated adaptations.", themes: ["trust", "ssi_kyc", "gs1"] },
  { id: "governance", requirement: "Resolve false mappings and abuse", principle: "Use authority, fairness, joint governance, and auditable challenge lifecycles", feature: "Dispute registry, auditor decision, challenge lifecycle, and status transitions", artifact: "Governed dispute and correction workflow", adaptation: "False product mapping challenge and dispute paths are query-generated product-identity adaptations.", themes: ["short_end", "trust", "gs1", "consent"] },
  { id: "scalability", requirement: "Keep the system scalable and economically feasible", principle: "Use a linearly scalable hybrid architecture", feature: "Off-chain storage, on-chain hashes/status only, event indexer, and read model", artifact: "Hybrid blockchain application architecture", adaptation: "Marketplace event indexer and canonical variant read model are query-generated adaptations.", themes: ["sdps", "integrated"] },
  { id: "lifecycle", requirement: "Build and evaluate as a blockchain system", principle: "Apply lifecycle-aware blockchain information-system development", feature: "Use cases, actor identification, off/on-chain design, smart contract skeleton, testing, deployment, and monitoring", artifact: "Blockchain ISDM implementation and evaluation plan", adaptation: "Evaluation scenarios for relisting, review continuity, disputes, and privacy leakage are query-generated adaptations.", themes: ["integrated", "gs1", "sdps"] }
];

export function selectSourcePapers(query: string, kb: OkfKnowledgeBase, maxPapers = 8): OkfPaperSupport[] {
  const q = normalizeText(query);
  const terms = tokenize(query);
  const asksReviewIncentives = /token|incentive|reward|reviewer/.test(q);
  return kb.papers.map((paper) => {
    const concepts = kb.concepts.filter((concept) => concept.paper_id === paper.paper_id);
    const haystack = normalizeText([paper.paper_id, paper.title, paper.body_text, ...concepts.flatMap((concept) => [concept.title, concept.description, concept.body_text, concept.tags.join(" "), concept.type])].join(" "));
    const matchedProfiles = sourceProfiles.filter((profile) => profile.aliases.some((alias) => haystack.includes(normalizeText(alias))) || profile.terms.some((term) => haystack.includes(normalizeText(term)) && q.includes(normalizeText(term))));
    let score = terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0);
    for (const profile of matchedProfiles) score += profile.key === "token" && !asksReviewIncentives ? -8 : 8 + profile.terms.filter((term) => q.includes(normalizeText(term))).length * 2;
    return { paper_id: paper.paper_id, title: paper.title, reason: matchedProfiles[0]?.reason ?? "matched OKF concept metadata", score };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, maxPapers);
}

export function buildReuseFlowResponse(query: string, plan: OkfQueryPlan, kb: OkfKnowledgeBase): OkfChatResponse {
  const paperSupport = selectSourcePapers(query, kb, 8);
  const concepts = retrieveConcepts(query, kb, paperSupport.map((paper) => paper.paper_id));
  const evidenceRefs = evidenceForConcepts(concepts, kb);
  const rows = buildRows(query, paperSupport, concepts, evidenceRefs, kb);
  const payload = buildPayload(rows, paperSupport, evidenceRefs, plan, kb);
  const flow = buildOkfFlow(query, concepts, kb, { includeQueryProblem: true });
  const sourcePapers = sourceRoles(concepts, kb, paperSupport);
  const warnings = sourcePapers.length < 5 ? [`Cross-paper reuse was requested, but only ${sourcePapers.length} source paper(s) are available in the loaded OKF knowledge base.`] : [];
  return {
    intent: "DESIGN_REUSE_FLOW_QUERY",
    task_type: "design_reuse_flow",
    answer: renderPayload(payload),
    interpreted_problem: query,
    requirements: rows.map((row) => card(row.requirement_label, row, 0)),
    principles: rows.map((row) => card(row.principle_label, row, 1)),
    features: rows.map((row) => card(row.feature_label, row, 2)),
    artifact_direction: rows.map((row) => card(`Artifact pattern: ${row.artifact_pattern} (${row.adaptation_status})`, row, 3)),
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

function retrieveConcepts(query: string, kb: OkfKnowledgeBase, paperIds: string[]) {
  const terms = tokenize(query);
  const paperSet = new Set(paperIds);
  const direct = kb.concepts.filter((concept) => paperSet.has(concept.paper_id)).map((concept) => ({ concept, score: scoreConcept(concept, terms) })).filter((item) => item.score > 0).sort((a, b) => b.score - a.score).map((item) => item.concept);
  const fallback = paperIds.flatMap((paperId) => kb.concepts.filter((concept) => concept.paper_id === paperId && ["Problem", "DesignRequirement", "DesignPrinciple", "DesignFeature", "Artifact", "Evaluation", "OutputKnowledge", "KernelTheory"].includes(concept.type)).slice(0, 14));
  const ids = new Set(unique([...direct, ...fallback]).map((concept) => concept.concept_id));
  let changed = true;
  while (changed && ids.size < 100) {
    changed = false;
    for (const relation of kb.relations) {
      if (ids.has(relation.source_concept_id) && !ids.has(relation.target_concept_id)) { ids.add(relation.target_concept_id); changed = true; }
      if (ids.has(relation.target_concept_id) && !ids.has(relation.source_concept_id)) { ids.add(relation.source_concept_id); changed = true; }
    }
  }
  return order(kb.concepts.filter((concept) => ids.has(concept.concept_id))).slice(0, 100);
}
function buildRows(query: string, papers: OkfPaperSupport[], concepts: OkfConcept[], evidence: OkfEvidenceRef[], kb: OkfKnowledgeBase): OkfReuseFlowRow[] {
  return rowTemplates.map((template) => {
    const supporting = papers.filter((paper) => template.themes.some((theme) => paperMatchesTheme(paper, theme, kb))).slice(0, 3);
    const fallback = supporting.length ? supporting : papers.slice(0, 2);
    const selected = pickConcepts(template, concepts.filter((concept) => fallback.some((paper) => paper.paper_id === concept.paper_id)), query);
    const conceptIds = new Set(selected.map((concept) => concept.concept_id));
    const linkedEvidence = evidence.filter((item) => item.concept_id && conceptIds.has(item.concept_id)).map((item) => item.evidence_id);
    const fallbackEvidence = evidence.filter((item) => fallback.some((paper) => paper.paper_id === item.paper_id)).map((item) => item.evidence_id);
    const evidenceIds = [...new Set([...linkedEvidence, ...fallbackEvidence])].slice(0, 8);
    return {
      row_id: template.id,
      requirement_label: template.requirement,
      principle_label: bestTitle(selected, "DesignPrinciple", template.principle),
      feature_label: bestTitle(selected, "DesignFeature", template.feature),
      artifact_pattern: bestTitle(selected, "Artifact", template.artifact),
      supporting_papers: fallback.map((paper) => paper.paper_id),
      evidence_ids: evidenceIds,
      concept_ids: selected.map((concept) => concept.concept_id).slice(0, 10),
      adaptation_text: template.adaptation,
      adaptation_status: selected.length ? "mixed" : "query_generated",
      confidence: evidenceIds.length >= 3 ? "medium-high" : evidenceIds.length ? "medium" : "low"
    };
  });
}

function buildPayload(rows: OkfReuseFlowRow[], papers: OkfPaperSupport[], evidence: OkfEvidenceRef[], plan: OkfQueryPlan, kb: OkfKnowledgeBase): OkfAnswerPayload {
  const evidenceIds = new Set(rows.flatMap((row) => row.evidence_ids));
  return {
    direct_answer: "Do not reuse only the SDPS flow. Reuse a multi-paper pattern where the loaded OKF library supports it: hybrid off-chain/on-chain commitments, confidential-data protection and opportunism controls, identity and credential mechanisms, trust/reputation/screening mechanisms, standards/governance, and blockchain lifecycle guidance. Product-identity-specific mappings are query-generated adaptations.",
    flow_rows: rows,
    paper_support: papers,
    evidence: evidence.filter((item) => evidenceIds.has(item.evidence_id)).slice(0, 50),
    query_generated_notes: rows.filter((row) => row.adaptation_status !== "stored").map((row) => `${row.row_id}: ${row.adaptation_text}`),
    limitations: [`Loaded OKF source count: ${papers.length}. Missing expected paper bundles cannot be cited until they exist in okf_papers/okf_concepts.`, "The assistant uses stored OKF nodes/evidence for support and separates product-identity-specific adaptations from stored claims."],
    debug: { task_type: plan.task_type, source_paper_count: papers.length, concept_count: kb.concepts.length }
  };
}

function renderPayload(payload: OkfAnswerPayload) {
  const rows = payload.flow_rows.map((row, index) => `${index + 1}. Requirement: ${row.requirement_label}\n   Principle: ${row.principle_label}\n   Feature: ${row.feature_label}\n   Artifact pattern: ${row.artifact_pattern}\n   Papers: ${row.supporting_papers.join(", ") || "available OKF support not found"}\n   Evidence: ${row.evidence_ids.slice(0, 4).join(", ") || "no linked evidence"}\n   Adaptation (${row.adaptation_status}): ${row.adaptation_text}`).join("\n\n");
  return [payload.direct_answer, `Requirement -> Principle -> Feature -> Artifact flow:\n${rows}`, `Evidence note: ${payload.evidence.length} supporting evidence reference(s) are linked inline by evidence id. Use the Evidence tab or row buttons to inspect exact source excerpts.`, `Boundary conditions / limitations:\n${payload.limitations.map((item) => `- ${item}`).join("\n")}`].join("\n\n");
}

function sourceRoles(concepts: OkfConcept[], kb: OkfKnowledgeBase, ranked: OkfPaperSupport[]) {
  return ranked.map((paper) => {
    const paperConcepts = concepts.filter((concept) => concept.paper_id === paper.paper_id);
    const evidenceCount = kb.evidence_items.filter((item) => item.paper_id === paper.paper_id && (!item.concept_id || paperConcepts.some((concept) => concept.concept_id === item.concept_id))).length;
    const roles = [...new Set(paperConcepts.map((concept) => roleLabel(concept.type)))].join(", ") || "Matched source";
    return { paper_id: paper.paper_id, title: paper.title, role: roles, reason: paper.reason, requirements_count: paperConcepts.filter((concept) => concept.type === "DesignRequirement").length, principles_count: paperConcepts.filter((concept) => concept.type === "DesignPrinciple").length, features_count: paperConcepts.filter((concept) => concept.type === "DesignFeature").length, evidence_count: evidenceCount, score: paper.score };
  });
}

function pickConcepts(template: (typeof rowTemplates)[number], concepts: OkfConcept[], query: string) {
  const terms = tokenize([template.requirement, template.principle, template.feature, query].join(" "));
  const byType = (type: string) => concepts.filter((concept) => concept.type === type).map((concept) => ({ concept, score: scoreConcept(concept, terms) })).sort((a, b) => b.score - a.score).slice(0, 2).filter((item) => item.score > 0).map((item) => item.concept);
  return unique([...byType("DesignRequirement"), ...byType("DesignPrinciple"), ...byType("DesignFeature"), ...byType("Artifact"), ...byType("Evaluation"), ...byType("KernelTheory")]).slice(0, 8);
}

function evidenceForConcepts(concepts: OkfConcept[], kb: OkfKnowledgeBase): OkfEvidenceRef[] {
  const conceptIds = new Set(concepts.map((concept) => concept.concept_id));
  return kb.evidence_items.filter((item) => item.concept_id && conceptIds.has(item.concept_id)).map((item) => ({ evidence_id: item.evidence_id, paper_id: item.paper_id, concept_id: item.concept_id, excerpt: item.quote ?? item.paraphrase, section: item.section, page_number: item.page_number, confidence: item.confidence }));
}

function paperMatchesTheme(paper: OkfPaperSupport, theme: string, kb: OkfKnowledgeBase) {
  const profile = sourceProfiles.find((item) => item.key === theme);
  const concepts = kb.concepts.filter((concept) => concept.paper_id === paper.paper_id);
  const haystack = normalizeText([paper.paper_id, paper.title, paper.reason, ...concepts.flatMap((concept) => [concept.title, concept.description, concept.body_text, concept.tags.join(" ")])].join(" "));
  return Boolean(profile && (profile.aliases.some((alias) => haystack.includes(normalizeText(alias))) || profile.terms.some((term) => haystack.includes(normalizeText(term)))));
}

function bestTitle(concepts: OkfConcept[], type: string, fallback: string) {
  return concepts.find((concept) => concept.type === type)?.title ?? fallback;
}

function card(title: string, row: OkfReuseFlowRow, conceptIndex: number) {
  return { title, evidence_ids: row.evidence_ids, confidence: row.confidence, paper_id: row.supporting_papers[0] ?? "query_generated", concept_id: row.concept_ids[conceptIndex] ?? row.concept_ids[0] };
}

function roleLabel(type: string) {
  if (type === "DesignRequirement") return "Requirement";
  if (type === "DesignPrinciple") return "Design Principle";
  if (type === "DesignFeature") return "Feature";
  if (type === "Artifact") return "Artifact Pattern";
  if (type === "Evaluation") return "Evidence";
  return type;
}
function scoreConcept(concept: OkfConcept, terms: string[]) {
  const haystack = normalizeText([concept.title, concept.description, concept.body_text, concept.tags.join(" "), concept.type, concept.dsr_layer].join(" "));
  return terms.reduce((sum, term) => sum + (haystack.includes(normalizeText(term)) ? 1 : 0), 0);
}

function tokenize(value: string) {
  return normalizeText(value).split(/\s+/).filter((term) => term.length > 2 && !["the", "and", "for", "with", "that", "what", "which", "use", "from", "prior", "paper", "papers", "should", "where"].includes(term));
}

function order(concepts: OkfConcept[]) {
  const typeOrder = ["Problem", "ResearchQuestion", "DesignRequirement", "DesignPrinciple", "DesignFeature", "Artifact", "Evaluation", "OutputKnowledge", "KernelTheory", "Limitation"];
  return unique(concepts).sort((a, b) => typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type) || a.concept_id.localeCompare(b.concept_id));
}

function unique(concepts: OkfConcept[]) {
  const seen = new Set<string>();
  return concepts.filter((concept) => {
    if (seen.has(concept.concept_id)) return false;
    seen.add(concept.concept_id);
    return true;
  });
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}


