import type { OkfConcept, OkfConceptType, OkfKnowledgeBase, OkfPaper, OkfPaperSupport } from "./schema.ts";

export type PolicyThemeId = "integrity" | "commercial_privacy" | "identity_credentials" | "trust_reputation" | "auditability_status" | "consent_control" | "token_incentives" | "fair_marketplace" | "implementation_lifecycle" | "iot_sensor_protection" | "forecasting_oracle_payment" | "scalability_hybrid_storage" | "governance_dispute" | "evaluation";
export type PolicyTheme = { id: PolicyThemeId; label: string; queryTerms: string[]; matchTerms: string[] };
export type QueryCriteria = { themes: PolicyThemeId[]; requestedTypes: OkfConceptType[]; namedPaperIds: string[]; mustHaveTerms: string[]; optionalTerms: string[]; logic: "AND" | "OR"; formalOnly: boolean };

export const policyThemes: PolicyTheme[] = [
  { id: "integrity", label: "integrity / tamper resistance / manipulation prevention", queryTerms: ["integrity", "tamper", "tamper resistant", "tamper-resistant", "manipulation", "manipulated", "proof of integrity", "proof-of-integrity", "authenticity", "fragmented", "fragmentation", "inconsistent", "consistency", "data quality", "product data", "product identity", "verification", "verify", "verified", "privacy-preserving"], matchTerms: ["integrity", "tamper", "manipulation", "hash", "proof", "certification", "cross-validation", "authentic", "nonreversible", "independently executed", "source-to-sink", "consistent", "consistency", "provenance", "quality"] },
  { id: "commercial_privacy", label: "commercial-data privacy / sensitive raw data / information poaching", queryTerms: ["commercial", "sensitive", "raw data", "competitor", "competitors", "confidential", "information poaching", "poaching", "without exposing", "private data", "privacy", "privacy-preserving", "cross-marketplace", "cross marketplace", "multi-marketplace", "manufacturer", "manufacturers", "seller", "sellers", "information provider", "information recipient", "cross-organization", "multi-party", "product data"], matchTerms: ["commercial", "sensitive", "raw data", "confidential", "poaching", "provider-held", "private", "nonreversible", "joint approval", "off-chain"] },
  { id: "identity_credentials", label: "decentralized identity / credentials / issuer-verifier-holder", queryTerms: ["identity", "decentralized identity", "credentials", "credential", "did", "vc", "vp", "wallet", "issuer", "verifier", "holder", "revocation", "kyc", "product identity", "product data", "seller identity", "canonical product", "identifier"], matchTerms: ["identity", "credential", "credentials", "issuer", "verifier", "holder", "wallet", "did", "vc", "vp", "revocation", "status", "proof request", "non-revocation", "public data", "product", "identifier", "canonical", "registry"] },
  { id: "trust_reputation", label: "trust / reputation / screening / authority / fairness / deterrence", queryTerms: ["trust", "reputation", "screening", "signaling", "deterrence", "authority", "fairness", "b2b", "capacity", "marketplace trust", "marketplace", "review", "reviews", "review continuity", "verified purchase", "product data"], matchTerms: ["trust", "reputation", "screening", "signaling", "deterrence", "authority", "fairness", "persistent identity", "capacity exchange", "reputation mechanism"] },
  { id: "auditability_status", label: "auditability / status history / immutable log / permissioning", queryTerms: ["audit", "auditability", "status", "history", "immutable log", "transaction log", "permission", "permissioning", "traceability", "provenance", "lineage", "product history"], matchTerms: ["audit", "auditable", "status", "history", "transaction log", "immutable", "permission", "trace", "revocation", "monitoring"] },
  { id: "consent_control", label: "consent self-management / user control / permission status", queryTerms: ["consent", "self-management", "user control", "patient", "health", "hie", "permission status"], matchTerms: ["consent", "self-management", "user control", "patient", "health information exchange", "permissioned", "interoperability"] },
  { id: "token_incentives", label: "token incentives / rewards / reviewer motivation / compensation", queryTerms: ["token", "tokens", "tokenization", "incentive", "incentives", "reward", "rewards", "reviewer", "peer review", "compensation", "soulbound", "fungible"], matchTerms: ["token", "tokenization", "incentive", "reward", "reviewer", "peer review", "soulbound", "fungible", "motivation", "flexibility"] },
  { id: "fair_marketplace", label: "fair marketplace / inclusiveness / meritocratic allocation / random minting / royalties", queryTerms: ["fair", "inclusive", "inclusiveness", "meritocratic", "nft", "royalty", "royalties", "random minting", "minting", "market thickness", "congestion", "market safety"], matchTerms: ["fair", "inclusive", "inclusiveness", "meritocratic", "nft", "royalty", "random minting", "market thickness", "no congestion", "market safety"] },
  { id: "implementation_lifecycle", label: "implementation lifecycle / roles / models / smart-contract lifecycle", queryTerms: ["implementation lifecycle", "development lifecycle", "method fragments", "roles", "models", "smart contracts", "smart contract", "deployment", "deploy", "monitoring", "maintenance", "testing", "retirement", "from requirements", "build", "create", "application", "develop", "development process", "lifecycle"], matchTerms: ["implementation", "lifecycle", "method fragment", "analysis", "preliminary design", "detailed design", "construction", "transition", "maintenance", "retirement", "roles", "models", "testing", "deployment", "monitoring"] },
  { id: "iot_sensor_protection", label: "IoT sensor data protection / source-to-sink / cross-validation / certification", queryTerms: ["iot", "sensor", "sensor data", "source-to-sink", "cross-validation", "certification"], matchTerms: ["iot", "sensor", "source-to-sink", "cross-validation", "certification", "data owner", "tamper-resistant", "collection"] },
  { id: "forecasting_oracle_payment", label: "forecasting / oracle / outcome-contingent payment / proper scoring / escrow", queryTerms: ["forecast", "forecasting", "oracle", "payment", "proper scoring", "scoring rule", "escrow", "outcome-contingent", "inventory"], matchTerms: ["forecast", "forecasting", "oracle", "payment", "proper scoring", "scoring rule", "escrow", "realized outcome"] },
  { id: "scalability_hybrid_storage", label: "scalability / economic feasibility / off-chain storage / on-chain hashes", queryTerms: ["scalability", "scalable", "economic feasibility", "off-chain", "off chain", "on-chain hash", "on chain hash", "hash storage", "raw storage", "hybrid storage"], matchTerms: ["scalability", "scalable", "economic feasibility", "off-chain", "off chain", "on-chain", "hash storage", "raw storage", "storage coordination"] },
  { id: "governance_dispute", label: "governance / dispute / joint approval / correction lifecycle", queryTerms: ["governance", "dispute", "correction", "joint approval", "approval", "authority", "appeal", "rules", "lifecycle", "standard", "standards", "data governance"], matchTerms: ["governance", "dispute", "correction", "joint approval", "authority", "fairness", "approval", "rules", "committee"] },
  { id: "evaluation", label: "evaluation planning / criteria / demonstration / limitations", queryTerms: ["evaluate", "evaluation", "criteria", "demonstration", "validation", "limitations", "artifact maturity", "ex-ante", "ex ante", "ex-post", "ex post", "experiment"], matchTerms: ["evaluation", "criteria", "demonstration", "validation", "prototype", "case", "limitations", "artifact", "ex-ante", "ex-post", "experiment"] }
];


const roleExplanationTerms = ["proof", "integrity", "verification", "hash", "storage", "credential", "status", "audit", "governance", "reputation", "screening", "revocation", "off-chain"];

const stopwords = new Set(["the", "and", "for", "with", "that", "what", "which", "use", "uses", "using", "from", "paper", "papers", "should", "where", "need", "needs", "into", "same", "exact", "show", "list", "find", "give", "have", "has", "about", "their", "your", "mine", "does", "this", "there", "currently", "loaded", "library", "okf", "dsr", "design", "requirement", "requirements", "principle", "principles", "feature", "features", "artifact", "artifacts", "flow", "graph", "evidence", "element", "elements"]);

type ScoredPaper = OkfPaperSupport & { themeHits: Map<PolicyThemeId, number> };

export function selectPolicySourcePapers(
  query: string,
  kb: OkfKnowledgeBase,
  maxPapers = 8,
  criteria: QueryCriteria = extractQueryCriteria(query, kb)
): OkfPaperSupport[] {
  if (criteria.namedPaperIds.length) {
    return criteria.namedPaperIds
      .map((paperId) => paperSupportFromId(paperId, kb, 1000))
      .filter((item): item is OkfPaperSupport => Boolean(item))
      .slice(0, maxPapers);
  }
  const terms = expandPolicyTerms(tokenizePolicy(query));
  const activeThemes = criteria.themes
    .map((themeId) => policyThemes.find((theme) => theme.id === themeId))
    .filter((theme): theme is PolicyTheme => Boolean(theme));
  const scored: ScoredPaper[] = kb.papers
    .map((paper) => scorePaperForCriteria(paper, query, terms, criteria, activeThemes, kb))
    .filter((paper) => paper.score > 0)
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title));

  const selected: ScoredPaper[] = [];
  for (const theme of activeThemes) {
    const anchor = scored
      .filter((paper) => (paper.themeHits.get(theme.id) ?? 0) > 0)
      .sort((left, right) => {
        const hitDelta = (right.themeHits.get(theme.id) ?? 0) - (left.themeHits.get(theme.id) ?? 0);
        return hitDelta || right.score - left.score || left.title.localeCompare(right.title);
      })[0];
    if (anchor && !selected.some((paper) => paper.paper_id === anchor.paper_id)) selected.push(anchor);
    if (selected.length >= maxPapers) break;
  }
  const targetCount = activeThemes.length
    ? Math.min(maxPapers, Math.max(7, selected.length))
    : maxPapers;
  for (const paper of scored) {
    if (!selected.some((item) => item.paper_id === paper.paper_id)) selected.push(paper);
    if (selected.length >= targetCount) break;
  }
  return selected
    .slice(0, maxPapers)
    .map((paper) => ({
      paper_id: paper.paper_id,
      title: paper.title,
      reason: paper.reason,
      score: paper.score
    }));
}

export function extractQueryCriteria(query: string, kb: OkfKnowledgeBase): QueryCriteria {
  const q = normalizeText(query);
  const themes = inferPolicyThemes(query).map((theme) => theme.id);
  const requestedTypes = inferRequestedTypes(query);
  const namedPaperIds = detectNamedPapers(query, kb).map((paper) => paper.paper_id);
  const formalOnly = /formal|explicit|stored|named/.test(q) && requestedTypes.includes("Design Principle");
  const logic = /\bor\b/.test(q) && !/\band\b/.test(q) ? "OR" : "AND";
  const themeTerms = inferPolicyThemes(query).flatMap((theme) => theme.queryTerms.filter((term) => q.includes(normalizeText(term))));
  const fallbackTerms = tokenizePolicy(query).filter((term) => !["paper", "papers", "design", "principle", "principles", "requirement", "requirements", "feature", "features"].includes(term));
  const mustHaveTerms = unique(themeTerms.length ? themeTerms : fallbackTerms).slice(0, 8);
  const optionalTerms = unique(expandPolicyTerms(fallbackTerms)).filter((term) => !mustHaveTerms.includes(term)).slice(0, 16);
  return { themes: unique(themes), requestedTypes, namedPaperIds, mustHaveTerms, optionalTerms, logic, formalOnly };
}

export function inferPolicyThemes(query: string): PolicyTheme[] {
  const q = normalizeText(query);
  return policyThemes
    .map((theme) => ({ theme, score: theme.queryTerms.reduce((sum, term) => sum + (q.includes(normalizeText(term)) ? 1 : 0), 0) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.theme.label.localeCompare(b.theme.label))
    .map((item) => item.theme);
}

export function inferRequestedTypes(query: string): OkfConceptType[] {
  const q = normalizeText(query);
  const types: OkfConceptType[] = [];
  if (/problem/.test(q)) types.push("Problem");

  if (/requirements?/.test(q)) types.push("Design Requirement");
  if (/principles?/.test(q)) types.push("Design Principle");
  if (/features?|mechanisms?/.test(q)) types.push("Design Feature");
  if (/artifacts?|architectures?|patterns?/.test(q)) types.push("Artifact");
  if (/evaluations?|criteria|evidence|demonstration/.test(q)) types.push("Evaluation");
  if (/output knowledge|contribution/.test(q)) types.push("Output Knowledge");


  if (/requirement\s*(?:-|>|to|principle)|principle\s*(?:-|>|to|feature)|requirement principle feature/.test(q)) return ["Design Requirement", "Design Principle", "Design Feature", "Artifact"];
  return unique(types);
}

export function detectNamedPapers(query: string, kb: OkfKnowledgeBase): OkfPaper[] {
  const q = normalizeText(query);
  if (!q) return [];
  const phraseMatches = kb.papers.filter((paper) => canonicalPaperPhrases(paper).some((phrase) => (
    phrase.length > 3 && containsWholePhrase(q, phrase)
  )));
  if (phraseMatches.length) return phraseMatches;

  const matches: OkfPaper[] = [];
  for (const reference of explicitPaperReferenceSegments(q)) {
    const queryTokens = new Set(tokenizeIdentity(reference));
    const candidates = kb.papers
      .map((paper) => ({ paper, score: paperIdentityScore(paper, queryTokens) }))
      .filter((item) => item.score >= 2)
      .sort((left, right) => right.score - left.score || left.paper.title.localeCompare(right.paper.title));
    if (!candidates.length || (candidates[1] && candidates[1].score === candidates[0].score)) continue;
    matches.push(candidates[0].paper);
  }
  return unique(matches);
}

function explicitPaperReferenceSegments(query: string) {
  const segments: string[] = [];
  const trailingReference = /\b(?:from|within|according to|in)\s+([^?!.;,]+)/g;
  for (const match of query.matchAll(trailingReference)) segments.push(match[1]);
  const namedReference = /\b(?:paper|study|article)\s+(?:called|titled|named)\s+([^?!.;,]+)/g;
  for (const match of query.matchAll(namedReference)) segments.push(match[1]);
  return unique(segments.map((segment) => segment.trim()).filter(Boolean));
}

export function paperRoleLabel(
  paperId: string,
  title?: string,
  kb?: OkfKnowledgeBase,
  query?: string
) {
  const paper = kb?.papers.find((item) => item.paper_id === paperId);
  const theme = paper && kb ? dominantPolicyTheme(paper, kb, query) : undefined;
  return theme?.label.split("/")[0].trim().toUpperCase() ?? firstRecordedText([
    paper?.presentation?.card.dlt_role,
    paper?.blockchain_dlt_role,
    paper?.artifact_type,
    paper?.short_title,
    title?.split(":")[0]
  ]) ?? "Matched source";
}

export function paperRoleReason(paperId: string, kb?: OkfKnowledgeBase, query?: string) {
  const paper = kb?.papers.find((item) => item.paper_id === paperId);
  if (!kb || !paper) return "Matched canonical OKF concept metadata and evidence.";
  const theme = dominantPolicyTheme(paper, kb, query);
  const queryTerms = expandPolicyTerms(tokenizePolicy(query ?? ""));
  const relevanceTerms = unique([...(theme?.matchTerms ?? []), ...queryTerms, ...roleExplanationTerms]);
  const evidenceCandidates = kb.evidence_items
    .filter((item) => item.paper_id === paper.paper_id)
    .map((item) => item.paraphrase)
    .filter((value) => Boolean(value.trim()));
  const fallbackCandidates = [
    ...kb.concepts
      .filter((concept) => concept.paper_id === paper.paper_id)
      .flatMap((concept) => [concept.description, concept.title]),
    paper.presentation?.card.artifact_summary,
    ...paper.key_contributions,
    ...paper.design_knowledge_output,
    ...paper.research_problem
  ].filter((value): value is string => Boolean(value?.trim()));
  const candidates = evidenceCandidates.length ? evidenceCandidates : fallbackCandidates;
  const basis = candidates
    .map((value, index) => ({ value: value.trim(), index, score: textMatchCount(value, relevanceTerms) }))
    .sort((left, right) => right.score - left.score || left.index - right.index)[0]?.value;
  return basis
    ? `Supports ${basis.replace(/\bproof of integrity\b/gi, "proof-of-integrity").replace(/^the\s+/i, "")}`
    : "Matched canonical OKF concept metadata and evidence.";
}

export function paperContribution(paperId: string, title?: string, kb?: OkfKnowledgeBase) {
  const paper = kb?.papers.find((item) => item.paper_id === paperId);
  return firstRecordedText([
    paper?.key_contributions[0],
    paper?.presentation?.overview.key_contributions[0],
    paper?.design_knowledge_output[0],
    paper?.presentation?.card.artifact_summary,
    paper?.abstract
  ]) ?? `${title ?? paper?.title ?? "This paper"} is available in the loaded OKF library.`;
}

export function tokenizePolicy(value: string) {
  return normalizeText(value).split(/\s+/).filter((term) => term.length > 2 && !stopwords.has(term));
}

export function expandPolicyTerms(terms: string[]) {
  const expansions: Record<string, string[]> = {
    identity: ["credential", "issuer", "verifier", "holder", "wallet", "did", "revocation", "status"], identities: ["identity", "credential", "issuer", "verifier"], credential: ["credentials", "identity", "issuer", "verifier", "revocation", "status", "wallet"], credentials: ["credential", "identity", "issuer", "verifier", "revocation"],
    privacy: ["private", "confidential", "sensitive", "permission", "access", "off-chain", "hash", "disclosure"], preserving: ["privacy", "confidential"], decentralized: ["blockchain", "distributed", "wallet", "did", "smart contract"], auditability: ["audit", "status", "history", "log", "trace", "monitoring"], audit: ["auditability", "status", "history", "log", "trace"],
    reputation: ["trust", "screening", "signaling", "deterrence"], screening: ["reputation", "trust", "signaling", "deterrence"], trust: ["reputation", "screening", "signaling", "authority", "fairness"], marketplace: ["exchange", "seller", "buyer", "trust", "reputation"], marketplaces: ["marketplace", "exchange", "seller", "buyer"],
    commercial: ["sensitive", "confidential", "privacy", "poaching"], competitor: ["commercial", "sensitive", "poaching"], competitors: ["commercial", "sensitive", "poaching"], manipulation: ["tamper", "integrity", "proof", "hash"], manipulated: ["manipulation", "tamper", "integrity"], tamper: ["integrity", "hash", "certification"],
    token: ["tokenization", "incentive", "reward"], tokens: ["token", "tokenization", "incentive", "reward"], incentives: ["incentive", "reward", "motivation"], rewards: ["reward", "incentive", "motivation"], fair: ["fairness", "inclusive", "meritocratic"], inclusive: ["inclusiveness", "fair", "meritocratic"],
    forecast: ["forecasting", "oracle", "payment", "scoring"], forecasting: ["forecast", "oracle", "payment", "scoring"], lifecycle: ["implementation", "analysis", "design", "construction", "transition", "maintenance", "retirement"], implementation: ["lifecycle", "testing", "deployment", "monitoring", "maintenance"], evaluation: ["criteria", "demonstration", "validation", "limitations", "ex-ante", "ex-post", "experiment"]
  };
  return unique(terms.flatMap((term) => [term, ...(expansions[term] ?? [])]));
}

export function normalizeText(value: string | undefined) {
  return (value ?? "").toLowerCase()
    .replace(/\btokenisation\b/g, "tokenization")
    .replace(/\btokenised\b/g, "tokenized")
    .replace(/\btokenising\b/g, "tokenizing")
    .replace(/\bsbts?\b/g, "soulbound token")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function scorePaperForCriteria(
  paper: OkfPaper,
  query: string,
  terms: string[],
  criteria: QueryCriteria,
  activeThemes: PolicyTheme[],
  kb: OkfKnowledgeBase
): ScoredPaper {
  const concepts = kb.concepts.filter((concept) => concept.paper_id === paper.paper_id);
  const haystack = paperSearchText(paper, kb, concepts);
  const identityText = normalizeText([
    paper.title,
    paper.short_title,
    paper.slug,
    paper.domain_context,
    paper.artifact_type,
    paper.blockchain_dlt_role
  ].filter(Boolean).join(" "));
  const textScore = terms.reduce((sum, term) => sum + (haystack.includes(normalizeText(term)) ? 2 : 0), 0);
  const identityScore = terms.reduce((sum, term) => sum + (identityText.includes(normalizeText(term)) ? 3 : 0), 0);
  const themeHits = new Map<PolicyThemeId, number>();
  let themeScore = 0;
  for (const theme of activeThemes) {
    const hits = themeMatchCount(theme, haystack);
    themeHits.set(theme.id, hits);
    themeScore += Math.min(10, hits) * 5;
  }
  const requestedTypeScore = criteria.requestedTypes.length
    ? new Set(concepts
      .filter((concept) => criteria.requestedTypes.includes(concept.type) && scoreConceptForTerms(concept, terms, kb) > 0)
      .map((concept) => concept.type)).size * 8
    : 0;
  const relationScore = relationConnectivityScore(concepts, terms, kb);
  const allThemeHits = [...themeHits.values()].reduce((sum, count) => sum + count, 0);
  const mismatchPenalty = activeThemes.length > 0 && allThemeHits === 0 ? -80 : 0;
  const domainMismatchPenalty = semanticDomainMismatchPenalty(query, haystack);
  const score = textScore + identityScore + themeScore + requestedTypeScore + relationScore + mismatchPenalty + domainMismatchPenalty;
  return {
    paper_id: paper.paper_id,
    title: paper.title,
    reason: paperRoleReason(paper.paper_id, kb, query),
    score,
    themeHits
  };
}

function paperSupportFromId(
  paperId: string,
  kb: OkfKnowledgeBase,
  score: number
): OkfPaperSupport | undefined {
  const paper = kb.papers.find((item) => item.paper_id === paperId);
  return paper
    ? { paper_id: paper.paper_id, title: paper.title, reason: paperRoleReason(paper.paper_id, kb), score }
    : undefined;
}

function relationConnectivityScore(concepts: OkfConcept[], terms: string[], kb: OkfKnowledgeBase) {
  const matchedIds = new Set(concepts
    .filter((concept) => scoreConceptForTerms(concept, terms, kb) > 0)
    .map((concept) => concept.concept_id));
  if (!matchedIds.size) return 0;
  const paperConceptIds = new Set(concepts.map((concept) => concept.concept_id));
  const connected = kb.relations.filter((relation) => (
    paperConceptIds.has(relation.source_concept_id)
    && paperConceptIds.has(relation.target_concept_id)
    && (matchedIds.has(relation.source_concept_id) || matchedIds.has(relation.target_concept_id))
  )).length;
  return Math.min(20, connected / 2);
}

function scoreConceptForTerms(concept: OkfConcept, terms: string[], kb: OkfKnowledgeBase) {
  const evidenceText = kb.evidence_items
    .filter((item) => item.paper_id === concept.paper_id && (
      item.concept_id === concept.concept_id || item.supports.includes(concept.concept_id)
    ))
    .map((item) => `${item.paraphrase} ${item.quote ?? ""}`)
    .join(" ");
  const text = normalizeText([
    concept.title,
    concept.description,
    concept.body_text,
    concept.tags.join(" "),
    evidenceText
  ].join(" "));
  return terms.reduce((sum, term) => sum + (text.includes(normalizeText(term)) ? 1 : 0), 0);
}

function paperSearchText(paper: OkfPaper, kb: OkfKnowledgeBase, knownConcepts?: OkfConcept[]) {
  const concepts = knownConcepts ?? kb.concepts.filter((concept) => concept.paper_id === paper.paper_id);
  const evidence = kb.evidence_items.filter((item) => item.paper_id === paper.paper_id);
  return normalizeText([
    paper.paper_id,
    paper.slug,
    paper.title,
    paper.short_title,
    paper.body_text,
    paper.domain_context,
    paper.abstract,
    paper.research_problem.join(" "),
    paper.research_objective.join(" "),
    paper.research_questions.join(" "),
    paper.artifact_type,
    paper.blockchain_dlt_role,
    paper.methodology,
    paper.theoretical_foundations.join(" "),
    paper.evaluation_method.join(" "),
    paper.key_contributions.join(" "),
    paper.design_knowledge_output.join(" "),
    paper.limitations.join(" "),
    paper.notes,
    paper.presentation ? JSON.stringify(paper.presentation) : "",
    ...concepts.flatMap((concept) => [
      concept.title,
      concept.description,
      concept.body_text,
      concept.tags.join(" "),
      concept.type,
      concept.dsr_layer
    ]),
    ...evidence.flatMap((item) => [item.paraphrase, item.quote, item.section, item.source_location])
  ].filter(Boolean).join(" "));
}

function semanticDomainMismatchPenalty(query: string, paperText: string) {
  const normalizedQuery = normalizeText(query);
  const commerceReviewIntent = /\b(?:product|purchase|customer|buyer|seller|marketplace|listing|relist)\b/.test(normalizedQuery)
    && /\breviews?\b/.test(normalizedQuery);
  const academicReviewIntent = /\b(?:peer review|reviewer|journal|manuscript|academic|token|incentive|reward)\b/.test(normalizedQuery);
  const academicReviewPaper = /\b(?:peer review|reviewer|journal|manuscript|academic)\b/.test(paperText);
  const commerceReviewPaper = /\b(?:product|purchase|customer|buyer|seller|marketplace|listing|relist)\b/.test(paperText);
  return commerceReviewIntent && !academicReviewIntent && academicReviewPaper && !commerceReviewPaper ? -240 : 0;
}
function themeMatchCount(theme: PolicyTheme, haystack: string) {
  return theme.matchTerms.reduce((count, term) => (
    count + (haystack.includes(normalizeText(term)) ? 1 : 0)
  ), 0);
}

function dominantPolicyTheme(paper: OkfPaper, kb: OkfKnowledgeBase, query?: string) {
  const haystack = paperSearchText(paper, kb);
  const inferred = query ? inferPolicyThemes(query) : [];
  const candidates = inferred.length ? inferred : policyThemes;
  return candidates
    .map((theme) => ({ theme, score: themeMatchCount(theme, haystack) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.theme.label.localeCompare(right.theme.label))[0]?.theme;
}

function textMatchCount(value: string, terms: string[]) {
  const normalized = normalizeText(value);
  return terms.reduce((score, term) => score + (normalized.includes(normalizeText(term)) ? 1 : 0), 0);
}

function canonicalPaperPhrases(paper: OkfPaper) {
  return unique([
    paper.paper_id,
    paper.slug,
    paper.title,
    paper.short_title ?? ""
  ].map(normalizeText).filter(Boolean));
}

function containsWholePhrase(haystack: string, phrase: string) {
  return (` ${haystack} `).includes(` ${phrase} `);
}

function tokenizeIdentity(value: string) {
  return normalizeText(value)
    .split(/\s+/)
    .filter((term) => term.length > 2 && !stopwords.has(term) && !/^\d{4}$/.test(term));
}

function paperIdentityScore(paper: OkfPaper, queryTokens: Set<string>) {
  const identityTokens = new Set(tokenizeIdentity([
    paper.paper_id,
    paper.slug,
    paper.title,
    paper.short_title
  ].filter(Boolean).join(" ")));
  const overlap = [...queryTokens].filter((term) => identityTokens.has(term));
  if (overlap.length < 2) return 0;
  return overlap.length;
}

function firstRecordedText(values: Array<string | null | undefined>) {
  return values.find((value): value is string => Boolean(value?.trim()))?.trim();
}
