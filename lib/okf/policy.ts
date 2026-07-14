import type { OkfConcept, OkfConceptType, OkfKnowledgeBase, OkfPaper, OkfPaperSupport } from "./schema.ts";

export type PolicyThemeId = "integrity" | "commercial_privacy" | "identity_credentials" | "trust_reputation" | "auditability_status" | "consent_control" | "token_incentives" | "fair_marketplace" | "implementation_lifecycle" | "iot_sensor_protection" | "forecasting_oracle_payment" | "scalability_hybrid_storage" | "governance_dispute" | "evaluation";
export type PolicyTheme = { id: PolicyThemeId; label: string; queryTerms: string[]; matchTerms: string[]; primaryPaperIds: string[]; secondaryPaperIds: string[] };
export type PaperRoleProfile = { paper_id: string; role: string; aliases: string[]; themeIds: PolicyThemeId[]; keywords: string[]; contribution: string; reason: string };
export type QueryCriteria = { themes: PolicyThemeId[]; requestedTypes: OkfConceptType[]; namedPaperIds: string[]; mustHaveTerms: string[]; optionalTerms: string[]; logic: "AND" | "OR"; formalOnly: boolean };

export const policyThemes: PolicyTheme[] = [
  { id: "integrity", label: "integrity / tamper resistance / manipulation prevention", queryTerms: ["integrity", "tamper", "tamper resistant", "tamper-resistant", "manipulation", "manipulated", "proof of integrity", "proof-of-integrity", "authenticity", "fragmented", "fragmentation", "inconsistent", "consistency", "data quality", "product data"], matchTerms: ["integrity", "tamper", "manipulation", "hash", "proof", "certification", "cross-validation", "authentic", "nonreversible", "independently executed", "source-to-sink", "consistent", "consistency", "provenance", "quality"], primaryPaperIds: ["BLOCKCHAIN_IOT_SDPS_2019", "SHORT_END_STICK_2025"], secondaryPaperIds: ["SSI_KYC_FRAMEWORK_2022", "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023"] },
  { id: "commercial_privacy", label: "commercial-data privacy / sensitive raw data / information poaching", queryTerms: ["commercial", "sensitive", "raw data", "competitor", "competitors", "confidential", "information poaching", "poaching", "without exposing", "private data"], matchTerms: ["commercial", "sensitive", "raw data", "confidential", "poaching", "provider-held", "private", "nonreversible", "joint approval", "off-chain"], primaryPaperIds: ["SHORT_END_STICK_2025"], secondaryPaperIds: ["BLOCKCHAIN_IOT_SDPS_2019", "SSI_KYC_FRAMEWORK_2022"] },
  { id: "identity_credentials", label: "decentralized identity / credentials / issuer-verifier-holder", queryTerms: ["identity", "decentralized identity", "credentials", "credential", "did", "vc", "vp", "wallet", "issuer", "verifier", "holder", "revocation", "kyc", "product identity", "product data", "seller identity", "canonical product", "identifier"], matchTerms: ["identity", "credential", "credentials", "issuer", "verifier", "holder", "wallet", "did", "vc", "vp", "revocation", "status", "proof request", "non-revocation", "public data", "product", "identifier", "canonical", "registry"], primaryPaperIds: ["SSI_KYC_FRAMEWORK_2022"], secondaryPaperIds: ["HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023", "SHORT_END_STICK_2025", "BLOCKCHAIN_IOT_SDPS_2019"] },
  { id: "trust_reputation", label: "trust / reputation / screening / authority / fairness / deterrence", queryTerms: ["trust", "reputation", "screening", "signaling", "deterrence", "authority", "fairness", "b2b", "capacity", "marketplace trust", "verified purchase"], matchTerms: ["trust", "reputation", "screening", "signaling", "deterrence", "authority", "fairness", "persistent identity", "capacity exchange", "reputation mechanism"], primaryPaperIds: ["TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024"], secondaryPaperIds: ["SHORT_END_STICK_2025", "SSI_KYC_FRAMEWORK_2022"] },
  { id: "auditability_status", label: "auditability / status history / immutable log / permissioning", queryTerms: ["audit", "auditability", "status", "history", "immutable log", "transaction log", "permission", "permissioning", "traceability", "continuity", "provenance", "lineage", "product history"], matchTerms: ["audit", "auditable", "status", "history", "transaction log", "immutable", "permission", "trace", "revocation", "monitoring"], primaryPaperIds: ["HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023"], secondaryPaperIds: ["SSI_KYC_FRAMEWORK_2022", "BLOCKCHAIN_IOT_SDPS_2019"] },
  { id: "consent_control", label: "consent self-management / user control / permission status", queryTerms: ["consent", "self-management", "user control", "patient", "health", "hie", "permission status"], matchTerms: ["consent", "self-management", "user control", "patient", "health information exchange", "permissioned", "interoperability"], primaryPaperIds: ["HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023"], secondaryPaperIds: ["SSI_KYC_FRAMEWORK_2022"] },
  { id: "token_incentives", label: "token incentives / rewards / reviewer motivation / compensation", queryTerms: ["token", "tokens", "tokenization", "incentive", "incentives", "reward", "rewards", "reviewer", "peer review", "compensation", "soulbound", "fungible"], matchTerms: ["token", "tokenization", "incentive", "reward", "reviewer", "peer review", "soulbound", "fungible", "motivation", "flexibility"], primaryPaperIds: ["PEER_REVIEW_TOKEN_INCENTIVES_2025"], secondaryPaperIds: ["TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024"] },
  { id: "fair_marketplace", label: "fair marketplace / inclusiveness / meritocratic allocation / random minting / royalties", queryTerms: ["fair", "inclusive", "inclusiveness", "meritocratic", "nft", "nil", "royalty", "royalties", "random minting", "minting", "market thickness", "congestion", "market safety"], matchTerms: ["fair", "inclusive", "inclusiveness", "meritocratic", "nft", "nil", "royalty", "random minting", "market thickness", "no congestion", "market safety"], primaryPaperIds: ["NIL_NFT_MARKETPLACE_2026"], secondaryPaperIds: ["TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024"] },
  { id: "implementation_lifecycle", label: "blockchain implementation lifecycle / ISDM / roles / models / smart contract lifecycle", queryTerms: ["implementation lifecycle", "development lifecycle", "isdm", "method fragments", "roles", "models", "smart contracts", "smart contract", "deployment", "deploy", "monitoring", "maintenance", "testing", "retirement", "from requirements"], matchTerms: ["implementation", "lifecycle", "isdm", "method fragment", "analysis", "preliminary design", "detailed design", "construction", "transition", "maintenance", "retirement", "roles", "models", "testing", "deployment", "monitoring"], primaryPaperIds: ["INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024"], secondaryPaperIds: [] },
  { id: "iot_sensor_protection", label: "IoT sensor data protection / source-to-sink / cross-validation / certification", queryTerms: ["iot", "sensor", "sensor data", "source-to-sink", "cross-validation", "certification", "sdps"], matchTerms: ["iot", "sensor", "source-to-sink", "cross-validation", "certification", "data owner", "tamper-resistant", "collection"], primaryPaperIds: ["BLOCKCHAIN_IOT_SDPS_2019"], secondaryPaperIds: [] },
  { id: "forecasting_oracle_payment", label: "forecasting / oracle / outcome-contingent payment / proper scoring / escrow", queryTerms: ["forecast", "forecasting", "oracle", "payment", "proper scoring", "scoring rule", "escrow", "newsvendor", "outcome-contingent", "inventory"], matchTerms: ["forecast", "forecasting", "oracle", "payment", "proper scoring", "scoring rule", "escrow", "newsvendor", "realized outcome"], primaryPaperIds: ["NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021"], secondaryPaperIds: ["INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024"] },
  { id: "scalability_hybrid_storage", label: "scalability / economic feasibility / off-chain storage / on-chain hashes", queryTerms: ["scalability", "scalable", "economic feasibility", "off-chain", "off chain", "on-chain hash", "on chain hash", "hash storage", "raw storage", "hybrid storage"], matchTerms: ["scalability", "scalable", "economic feasibility", "off-chain", "off chain", "on-chain", "hash storage", "raw storage", "storage coordination"], primaryPaperIds: ["BLOCKCHAIN_IOT_SDPS_2019"], secondaryPaperIds: ["SHORT_END_STICK_2025", "SSI_KYC_FRAMEWORK_2022"] },
  { id: "governance_dispute", label: "governance / dispute / joint approval / correction lifecycle", queryTerms: ["governance", "dispute", "correction", "joint approval", "approval", "authority", "appeal", "rules", "lifecycle", "standard", "standards", "data governance"], matchTerms: ["governance", "dispute", "correction", "joint approval", "authority", "fairness", "approval", "rules", "committee"], primaryPaperIds: ["SHORT_END_STICK_2025", "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024"], secondaryPaperIds: ["HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023"] },
  { id: "evaluation", label: "evaluation planning / criteria / demonstration / limitations", queryTerms: ["evaluate", "evaluation", "criteria", "demonstration", "validation", "limitations", "artifact maturity", "ex-ante", "ex ante", "ex-post", "ex post", "experiment"], matchTerms: ["evaluation", "criteria", "demonstration", "validation", "prototype", "case", "limitations", "artifact", "ex-ante", "ex-post", "experiment"], primaryPaperIds: [], secondaryPaperIds: [] }
];

export const paperRoleProfiles: Record<string, PaperRoleProfile> = {
  BLOCKCHAIN_IOT_SDPS_2019: { paper_id: "BLOCKCHAIN_IOT_SDPS_2019", role: "TAMPER-RESISTANT EVIDENCE", aliases: ["blockchain for the iot", "blockchain iot", "sensor data protection", "privacy-preserving protection of sensor data", "sdps", "certification", "source-to-sink"], themeIds: ["integrity", "iot_sensor_protection", "scalability_hybrid_storage", "commercial_privacy", "auditability_status"], keywords: ["IoT sensor data protection", "tamper resistance", "privacy-preserving data exchange", "source-to-sink protection", "cross-validation", "off-chain raw data", "on-chain hash storage", "certification", "scalability"], contribution: "IoT sensor data protection with source-to-sink protection, cross-validation, certification, off-chain raw data, and on-chain hashes.", reason: "Supports hybrid raw-data storage, hash-based integrity proofs, certification/retrieval services, and access-key management." },
  SHORT_END_STICK_2025: { paper_id: "SHORT_END_STICK_2025", role: "COMMERCIAL-DATA PRIVACY", aliases: ["short end", "short end of the stick", "two-sided opportunism", "two sided opportunism", "commercial data", "information manipulation", "information poaching", "machine tool leasing"], themeIds: ["commercial_privacy", "integrity", "governance_dispute", "trust_reputation"], keywords: ["two-sided opportunism", "information manipulation", "information poaching", "confidential commercial data", "private data collection", "proof of integrity", "nonreversible computation", "joint approval", "interorganizational information sharing"], contribution: "Commercial information sharing pattern for proof-of-integrity, nonreversible computation, sensitive data control, and joint approval.", reason: "Supports proof-of-integrity sharing without exposing provider-held sensitive data, with independent computation and joint mechanism governance." },
  SSI_KYC_FRAMEWORK_2022: { paper_id: "SSI_KYC_FRAMEWORK_2022", role: "IDENTITY CREDENTIALS", aliases: ["ssi", "kyc", "ssi kyc", "self-sovereign identity", "digital kyc", "decentralized identity", "did", "verifiable credential", "verifiable presentation", "revocation registry"], themeIds: ["identity_credentials", "commercial_privacy", "auditability_status"], keywords: ["decentralized identity", "KYC", "DID", "wallet", "verifiable credentials", "verifiable presentations", "issuer", "verifier", "holder", "revocation registries", "blockchain only for public data", "off-chain personal data"], contribution: "SSI/KYC credential architecture using DIDs, wallets, VCs/VPs, proof requests, revocation/status registries, and public-data-only blockchain anchoring.", reason: "Supports reusable actor credentials, verifier proof checks, revocation/status handling, and blockchain use only for public trust data." },
  HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023: { paper_id: "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023", role: "PERMISSIONED STATUS SHARING", aliases: ["hie consent", "consent self-management", "health information exchange", "permission status", "patient consent", "status history", "auditability"], themeIds: ["consent_control", "auditability_status", "identity_credentials"], keywords: ["consent self-management", "user control", "auditability", "permissioned access", "interoperability", "immutable consent transaction log", "status history"], contribution: "Consent and permission-status self-management with user control, permissioned access, interoperability, and immutable status logs.", reason: "Supports auditable permission/status sharing, interoperability, and permissioned access when adapted outside healthcare." },
  TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024: { paper_id: "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024", role: "TRUST / REPUTATION", aliases: ["trust capacity", "capacity exchange", "trust-enabling", "screening", "reputation", "authority fairness", "signaling", "b2b marketplace"], themeIds: ["trust_reputation", "governance_dispute", "identity_credentials", "token_incentives", "fair_marketplace"], keywords: ["interorganizational trust", "signaling", "identity verification", "screening", "reputation mechanism", "authority", "fairness", "incentive", "deterrence", "capacity exchange"], contribution: "Trust-enabling exchange design with signaling, identity verification, screening, reputation, authority/fairness, and incentive/deterrence mechanisms.", reason: "Supports identity signaling, screening, reputation, authority/fairness, and deterrence mechanisms for trusted exchange." },
  INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024: { paper_id: "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024", role: "IMPLEMENTATION LIFECYCLE", aliases: ["integrated blockchain isdm", "isdm", "integrated framework", "blockchain systems", "implementation lifecycle", "development lifecycle", "method fragments"], themeIds: ["implementation_lifecycle", "evaluation", "governance_dispute"], keywords: ["blockchain development lifecycle", "method fragments", "analysis", "preliminary design", "detailed design", "construction", "transition", "maintenance", "retirement", "roles", "models"], contribution: "Integrated blockchain ISDM with stages from analysis through preliminary/detailed design, construction, transition, maintenance, and retirement.", reason: "Supports the lifecycle from analysis and actor identification through off/on-chain design, smart contracts, testing, deployment, and monitoring." },
  PEER_REVIEW_TOKEN_INCENTIVES_2025: { paper_id: "PEER_REVIEW_TOKEN_INCENTIVES_2025", role: "TOKEN INCENTIVES", aliases: ["peer review token", "token incentives", "reviewer rewards", "reviewer motivation", "soulbound tokens", "fungible tokens", "peer review"], themeIds: ["token_incentives", "trust_reputation"], keywords: ["token incentives", "reviewer motivation", "flexibility", "trust in peer review", "soulbound tokens", "fungible tokens", "reward policies", "tokenization"], contribution: "Peer-review token incentive system with tokenization, incentives, flexibility, reviewer motivation, and trust/reputation mechanisms.", reason: "Supports token incentives only when reviewer rewards or tokenized contribution mechanisms are part of the design problem." },
  NIL_NFT_MARKETPLACE_2026: { paper_id: "NIL_NFT_MARKETPLACE_2026", role: "NFT MARKETPLACE GOVERNANCE", aliases: ["nil nft", "nft marketplace", "inclusive marketplace", "fair marketplace", "random minting", "market royalties", "market exchanges", "name image likeness"], themeIds: ["fair_marketplace", "trust_reputation"], keywords: ["fair marketplace", "inclusive marketplace", "inclusive-meritocratic fairness", "random minting", "market royalties", "market exchanges", "market thickness", "no congestion", "market safety", "NFTs"], contribution: "Fair and inclusive NIL/NFT marketplace design with random minting, royalties, market exchanges, thickness, congestion avoidance, and market safety.", reason: "Supports NFT marketplace fairness, royalties, and allocation mechanisms only when those themes are part of the design problem." },
  NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021: { paper_id: "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021", role: "ORACLE / PAYMENT COORDINATION", aliases: ["newsvendor", "forecasting smart contract", "forecaster", "proper scoring", "oracle", "outcome contingent payment", "escrow"], themeIds: ["forecasting_oracle_payment", "implementation_lifecycle"], keywords: ["forecasting", "proper scoring rules", "incentive alignment", "smart contract escrow", "oracle-based realized outcome retrieval", "automated payment", "trustworthiness signaling"], contribution: "Forecasting smart contract design with proper scoring, oracle-based outcome retrieval, escrow, automated payment, and trustworthiness signaling.", reason: "Supports oracle and payment coordination when forecasting, inventory, or settlement are part of the design problem." }
};

const stopwords = new Set(["the", "and", "for", "with", "that", "what", "which", "use", "uses", "using", "from", "paper", "papers", "should", "where", "need", "needs", "into", "same", "exact", "show", "list", "find", "give", "have", "has", "about", "their", "your", "mine", "does", "this", "there", "currently", "loaded", "library", "okf", "dsr"]);

export function selectPolicySourcePapers(query: string, kb: OkfKnowledgeBase, maxPapers = 8, criteria: QueryCriteria = extractQueryCriteria(query, kb)): OkfPaperSupport[] {
  if (criteria.namedPaperIds.length) return criteria.namedPaperIds.map((paperId) => paperSupportFromId(paperId, kb, 1000)).filter((item): item is OkfPaperSupport => Boolean(item)).slice(0, maxPapers);
  const terms = expandPolicyTerms(tokenizePolicy(query));
  const themeSet = new Set(criteria.themes);
  const forced = forcedPaperIdsForCriteria(criteria, query);
  const forceIndex = new Map(forced.map((paperId, index) => [paperId, index]));
  const scored = kb.papers
    .map((paper) => {
      const concepts = kb.concepts.filter((concept) => concept.paper_id === paper.paper_id);
      const evidence = kb.evidence_items.filter((item) => item.paper_id === paper.paper_id);
      const haystack = normalizeText([paper.paper_id, paper.title, paper.body_text, paperRoleProfiles[paper.paper_id]?.keywords.join(" "), paperRoleProfiles[paper.paper_id]?.aliases.join(" "), ...concepts.flatMap((concept) => [concept.title, concept.description, concept.body_text, concept.tags.join(" "), concept.type, concept.dsr_layer]), ...evidence.flatMap((item) => [item.paraphrase, item.quote, item.section])].join(" "));
      const textScore = terms.reduce((sum, term) => sum + (haystack.includes(normalizeText(term)) ? 1 : 0), 0);
      const themeScore = policyThemes.reduce((sum, theme) => {
        if (!themeSet.has(theme.id)) return sum;
        const hits = theme.matchTerms.reduce((count, term) => count + (haystack.includes(normalizeText(term)) ? 1 : 0), 0);
        const profileBoost = paperRoleProfiles[paper.paper_id]?.themeIds.includes(theme.id) ? 12 : 0;
        const primaryBoost = theme.primaryPaperIds.includes(paper.paper_id) ? 18 : 0;
        const secondaryBoost = theme.secondaryPaperIds.includes(paper.paper_id) ? 8 : 0;
        return sum + Math.min(8, hits) * 2 + profileBoost + primaryBoost + secondaryBoost;
      }, 0);
      const requestedTypeScore = criteria.requestedTypes.length ? new Set(concepts.filter((concept) => criteria.requestedTypes.includes(concept.type) && scoreConceptForTerms(concept, terms, kb) > 0).map((concept) => concept.type)).size * 8 : 0;
      const relationScore = relationConnectivityScore(paper.paper_id, concepts, terms, kb);
      const forcedBoost = forceIndex.has(paper.paper_id) ? 300 - (forceIndex.get(paper.paper_id) ?? 0) * 5 : 0;
      const score = textScore + themeScore + requestedTypeScore + relationScore + forcedBoost + paperPolicyAdjustment(paper.paper_id, query, criteria);
      return { paper_id: paper.paper_id, title: paper.title, reason: paperRoleProfiles[paper.paper_id]?.reason ?? "Matched OKF concept metadata and evidence.", score };
    })
    .filter((paper) => paper.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
  const selected: OkfPaperSupport[] = [];
  for (const paperId of forced) {
    const found = scored.find((paper) => paper.paper_id === paperId) ?? paperSupportFromId(paperId, kb, 250);
    if (found && !selected.some((paper) => paper.paper_id === found.paper_id)) selected.push(found);
  }
  for (const paper of scored) {
    if (!selected.some((item) => item.paper_id === paper.paper_id)) selected.push(paper);
    if (selected.length >= maxPapers) break;
  }
  return selected.slice(0, maxPapers);
}

export function extractQueryCriteria(query: string, kb: OkfKnowledgeBase): QueryCriteria {
  const q = normalizeText(query);
  const themes = inferPolicyThemes(query).map((theme) => theme.id);
  const requestedTypes = inferRequestedTypes(query);
  const namedPaperIds = detectNamedPapers(query, kb).map((paper) => paper.paper_id);
  const formalOnly = /formal|explicit|stored|named/.test(q) && requestedTypes.includes("DesignPrinciple");
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
  if (/research question|\brq\b/.test(q)) types.push("ResearchQuestion");
  if (/requirements?/.test(q)) types.push("DesignRequirement");
  if (/principles?/.test(q)) types.push("DesignPrinciple");
  if (/features?|mechanisms?/.test(q)) types.push("DesignFeature");
  if (/artifacts?|architectures?|patterns?/.test(q)) types.push("Artifact");
  if (/evaluations?|criteria|evidence|demonstration/.test(q)) types.push("Evaluation");
  if (/output knowledge|contribution/.test(q)) types.push("OutputKnowledge");
  if (/kernel theor/.test(q)) types.push("KernelTheory");
  if (/limitation|boundary/.test(q)) types.push("Limitation");
  if (/requirement\s*(?:-|>|to|principle)|principle\s*(?:-|>|to|feature)|requirement principle feature/.test(q)) return ["DesignRequirement", "DesignPrinciple", "DesignFeature", "Artifact"];
  return unique(types);
}

export function detectNamedPapers(query: string, kb: OkfKnowledgeBase): OkfPaper[] {
  const q = normalizeText(query);
  return kb.papers.filter((paper) => {
    const profile = paperRoleProfiles[paper.paper_id];
    const candidates = [paper.paper_id, paper.title, ...(profile?.aliases ?? []).filter((alias) => isStrongPaperAlias(alias))].map(normalizeText).filter((item) => item.length > 3);
    return candidates.some((candidate) => q.includes(candidate));
  });
}

function isStrongPaperAlias(alias: string) {
  const value = normalizeText(alias);
  return /blockchain for the iot|blockchain iot|sdps|short end|stick|ssi kyc|digital kyc|hie consent|health information exchange|trust capacity|capacity exchange|integrated blockchain isdm|\bisdm\b|peer review token|nil nft|nft marketplace|newsvendor|forecasting smart contract/.test(value);
}

export function paperRoleLabel(paperId: string, title?: string) {
  return paperRoleProfiles[paperId]?.role ?? title?.split(":")[0] ?? "Matched source";
}

export function paperRoleReason(paperId: string) {
  return paperRoleProfiles[paperId]?.reason ?? "Matched OKF concept metadata and evidence.";
}

export function paperContribution(paperId: string, title?: string) {
  return paperRoleProfiles[paperId]?.contribution ?? `${title ?? paperId} is available in the loaded OKF library.`;
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

function forcedPaperIdsForCriteria(criteria: QueryCriteria, query: string) {
  const q = normalizeText(query);
  const forced: string[] = [];
  const themes = new Set(criteria.themes);
  const hasProductReuse = /product|variant|listing|seller|buyer|marketplace/.test(q) && /commercial|raw|privacy|credential|identity|review|continuity|fragmented|fragmentation|data|integrity|quality|consistency|governance|standard|standards/.test(q);
  if (hasProductReuse) forced.push("SHORT_END_STICK_2025", "SSI_KYC_FRAMEWORK_2022", "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024", "BLOCKCHAIN_IOT_SDPS_2019", "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024");
  for (const theme of policyThemes) if (themes.has(theme.id)) forced.push(...theme.primaryPaperIds);
  if (themes.has("identity_credentials") && (themes.has("auditability_status") || /audit|status|revocation/.test(q))) forced.push("HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023");
  if (themes.has("implementation_lifecycle")) forced.push("INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024");
  if (themes.has("token_incentives")) forced.push("PEER_REVIEW_TOKEN_INCENTIVES_2025");
  if (themes.has("fair_marketplace")) forced.push("NIL_NFT_MARKETPLACE_2026");
  if (themes.has("forecasting_oracle_payment")) forced.push("NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021");
  if (themes.has("consent_control") || (/consent|permission status|hie|patient/.test(q) && themes.has("auditability_status"))) forced.push("HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023");
  return unique(forced);
}

function paperSupportFromId(paperId: string, kb: OkfKnowledgeBase, score: number) {
  const paper = kb.papers.find((item) => item.paper_id === paperId);
  return paper ? { paper_id: paper.paper_id, title: paper.title, reason: paperRoleReason(paper.paper_id), score } : undefined;
}

function paperPolicyAdjustment(paperId: string, query: string, criteria: QueryCriteria) {
  const q = normalizeText(query);
  const hasAny = (terms: string[]) => terms.some((term) => q.includes(normalizeText(term)));
  const themes = new Set(criteria.themes);
  if (themes.has("token_incentives") && !["PEER_REVIEW_TOKEN_INCENTIVES_2025", "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024"].includes(paperId)) return -120;
  if (themes.has("fair_marketplace") && !["NIL_NFT_MARKETPLACE_2026", "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024"].includes(paperId)) return -120;
  if (themes.has("forecasting_oracle_payment") && !["NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021", "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024"].includes(paperId)) return -120;
  if (themes.has("implementation_lifecycle") && !hasAny(["privacy", "identity", "marketplace", "commercial", "trust", "token", "fair", "forecast", "oracle", "consent"]) && paperId !== "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024") return -120;
  if (paperId === "PEER_REVIEW_TOKEN_INCENTIVES_2025" && !hasAny(["token", "incentive", "reward", "reviewer", "peer review", "compensation", "soulbound", "fungible"])) return -160;
  if (paperId === "NIL_NFT_MARKETPLACE_2026" && !hasAny(["nft", "nil", "royalty", "royalties", "fair", "inclusive", "meritocratic", "minting", "random", "market thickness", "congestion", "market safety"])) return -120;
  if (paperId === "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021" && !hasAny(["forecast", "forecasting", "newsvendor", "oracle", "payment", "scoring", "escrow", "inventory"])) return -120;
  if (paperId === "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023" && !hasAny(["health", "healthcare", "patient", "consent", "hie", "permission", "status", "audit", "revocation"]) && themes.has("commercial_privacy")) return -45;
  if (paperId === "BLOCKCHAIN_IOT_SDPS_2019" && themes.has("identity_credentials") && !themes.has("iot_sensor_protection") && !themes.has("scalability_hybrid_storage") && !hasAny(["hash", "off-chain", "off chain", "proof", "tamper", "sensor", "iot"])) return -25;
  return 0;
}

function relationConnectivityScore(paperId: string, concepts: OkfConcept[], terms: string[], kb: OkfKnowledgeBase) {
  const matchedIds = new Set(concepts.filter((concept) => scoreConceptForTerms(concept, terms, kb) > 0).map((concept) => concept.concept_id));
  if (!matchedIds.size) return 0;
  const connected = kb.relations.filter((relation) => relation.source_concept_id.startsWith(`${paperId}:`) && (matchedIds.has(relation.source_concept_id) || matchedIds.has(relation.target_concept_id))).length;
  return Math.min(20, connected / 2);
}

function scoreConceptForTerms(concept: OkfConcept, terms: string[], kb: OkfKnowledgeBase) {
  const evidenceText = kb.evidence_items.filter((item) => item.concept_id === concept.concept_id).map((item) => `${item.paraphrase} ${item.quote ?? ""}`).join(" ");
  const text = normalizeText([concept.title, concept.description, concept.body_text, concept.tags.join(" "), evidenceText].join(" "));
  return terms.reduce((sum, term) => sum + (text.includes(normalizeText(term)) ? 1 : 0), 0);
}


