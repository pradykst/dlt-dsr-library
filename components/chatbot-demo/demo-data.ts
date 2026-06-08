export type DemoPaper = {
  code: string;
  title: string;
  href?: string;
  matchedElement: string;
  evidenceSnippet: string;
  relationUsed: string;
};

export type RecommendationCard = {
  label: string;
  body: string;
  linkedTo?: string;
  sources: string[];
  evidence: string;
};

export const demoSteps = [
  "Understanding query",
  "Clarifying desired output",
  "Searching reviewed library",
  "Traversing paper flows",
  "Building temporary global flow",
  "Checking answer quality",
  "Final recommendation"
];

export const selectedOutputs = ["Requirements", "Design principles", "Features", "Artifact direction"];

export const searchStatuses = [
  "Interpreting design problem",
  "Searching paper elements",
  "Traversing paper-level relations",
  "Grouping related concepts",
  "Checking evidence support",
  "Building query-specific flow"
];

export const demoPapers: DemoPaper[] = [
  {
    code: "P1",
    title: "And No One Gets the Short End of the Stick",
    href: "/papers/paper-opportunism",
    matchedElement: "Requirement",
    evidenceSnippet: "Interorganizational information sharing needs protection against manipulation and poaching.",
    relationUsed: "Problem -> Requirement -> Design principle"
  },
  {
    code: "P2",
    title: "Blockchain innovation for consent self-management in health information exchanges",
    href: "/papers/paper-consent-hie",
    matchedElement: "Design principle",
    evidenceSnippet: "Consent changes should be auditable and visible only to authorized actors.",
    relationUsed: "Requirement -> Principle -> Feature"
  },
  {
    code: "P3",
    title: "Blockchain for the IoT",
    href: "/papers/paper-iot-sdps",
    matchedElement: "Feature",
    evidenceSnippet: "Raw sensor data can remain off-chain while hashes provide tamper evidence.",
    relationUsed: "Principle -> Feature -> Artifact"
  },
  {
    code: "P4",
    title: "Designing a framework for digital KYC processes built on blockchain-based self-sovereign identity",
    href: "/papers/paper-ssi-kyc",
    matchedElement: "Design principle",
    evidenceSnippet: "Identity data should avoid direct on-chain storage while retaining verifiable trust anchors.",
    relationUsed: "Requirement -> Principle -> Feature"
  },
  {
    code: "P5",
    title: "Designing trust-enabling blockchain systems",
    href: "/papers/paper-trust-capacity",
    matchedElement: "Requirement",
    evidenceSnippet: "Shared records and traceable transactions can reduce behavioral uncertainty between actors.",
    relationUsed: "Problem -> Requirement -> Feature"
  },
  {
    code: "P6",
    title: "Blockchain-based token system for incentivizing peer review",
    href: "/papers/paper-peer-review-token",
    matchedElement: "Architecture pattern",
    evidenceSnippet: "Confidential workflow data can remain off-chain while public reward records remain verifiable.",
    relationUsed: "Principle -> Feature -> Artifact"
  }
];

export const retrievedElements = {
  requirements: [
    "Prevent information manipulation",
    "Support trustworthy shared records",
    "Preserve sensitive data where needed",
    "Enable cross-party verification",
    "Maintain traceable updates"
  ],
  principles: [
    "Use tamper-resistant auditability",
    "Separate public verification from sensitive data disclosure",
    "Make update actions attributable and reviewable",
    "Use shared validation rules across participating actors"
  ],
  features: [
    "On-chain hash anchoring for product master records",
    "Off-chain storage for large or sensitive product descriptions",
    "Marketplace attestations for product identity claims",
    "Smart-contract or rule-based update approval",
    "Evidence-linked audit trail for disputed changes"
  ],
  groupedConcepts: [
    "Prevent manipulation",
    "Tamper-resistant auditability",
    "Off-chain sensitive data",
    "On-chain verification",
    "Attestation and review"
  ]
};

export const recommendedRequirements: RecommendationCard[] = [
  {
    label: "Prevent information manipulation",
    body: "Treat inconsistent product descriptions as a manipulation risk across marketplaces.",
    sources: ["P1", "P5"],
    evidence: "Information recipients need confidence that shared information has not been altered opportunistically."
  },
  {
    label: "Support trustworthy shared records",
    body: "Create a shared record layer that lets different actors check the same product identity state.",
    sources: ["P2", "P5"],
    evidence: "Shared state and traceability can reduce uncertainty between organizations."
  },
  {
    label: "Preserve sensitive data where needed",
    body: "Keep detailed descriptions, commercial notes, and large data off-chain when public disclosure is not appropriate.",
    sources: ["P3", "P4", "P6"],
    evidence: "Prior DSR papers separate private details from public verification infrastructure."
  },
  {
    label: "Enable cross-party verification",
    body: "Let participating marketplaces verify product identity claims without relying on a single platform owner.",
    sources: ["P1", "P4"],
    evidence: "Verification should be possible across actors while limiting exposure of sensitive data."
  },
  {
    label: "Maintain traceable updates",
    body: "Record who changed product identity claims, when changes happened, and which evidence supported them.",
    sources: ["P2", "P5"],
    evidence: "Auditability and attributable state changes support trust in shared systems."
  }
];

export const recommendedPrinciples: RecommendationCard[] = [
  {
    label: "Use tamper-resistant auditability",
    body: "Design for an update history that can be inspected when a product record is disputed.",
    linkedTo: "Prevent information manipulation",
    sources: ["P1", "P2", "P5"],
    evidence: "Prior flows link manipulation risks to auditability, traceability, and shared records."
  },
  {
    label: "Separate verification from disclosure",
    body: "Anchor proofs publicly or across the consortium while keeping detailed descriptions in controlled storage.",
    linkedTo: "Preserve sensitive data where needed",
    sources: ["P3", "P4", "P6"],
    evidence: "Several papers use off-chain data with on-chain proofs to balance verification and privacy."
  },
  {
    label: "Make update actions attributable",
    body: "Require updates to product identity claims to be connected to actors, rules, and reviewable evidence.",
    linkedTo: "Maintain traceable updates",
    sources: ["P2", "P5"],
    evidence: "Attributable changes and auditable histories are reusable design logic for trust-sensitive systems."
  },
  {
    label: "Use shared validation rules",
    body: "Define update approval rules that participating marketplaces can inspect and apply consistently.",
    linkedTo: "Enable cross-party verification",
    sources: ["P1", "P5"],
    evidence: "Shared rule execution helps reduce behavioral uncertainty in multi-party settings."
  }
];

export const recommendedFeatures: RecommendationCard[] = [
  {
    label: "On-chain hash anchoring",
    body: "Store hashes of product master records so later changes can be checked against an immutable reference.",
    linkedTo: "Separate verification from disclosure",
    sources: ["P3", "P4"],
    evidence: "Hash anchoring supports integrity checks without storing raw data directly on-chain."
  },
  {
    label: "Off-chain product information store",
    body: "Keep long descriptions and sensitive product data in governed storage outside the ledger.",
    linkedTo: "Preserve sensitive data where needed",
    sources: ["P3", "P6"],
    evidence: "Hybrid on-chain and off-chain architectures appear across privacy-sensitive DLT designs."
  },
  {
    label: "Marketplace attestations",
    body: "Let marketplaces submit signed claims about product identity, provenance, and description changes.",
    linkedTo: "Enable cross-party verification",
    sources: ["P4", "P5"],
    evidence: "Verifiable credentials and trust-signaling features support accountable cross-party claims."
  },
  {
    label: "Rule-based update approval",
    body: "Use smart-contract or workflow rules to accept, reject, or flag disputed product updates.",
    linkedTo: "Use shared validation rules",
    sources: ["P1", "P2", "P5"],
    evidence: "Prior artifacts encode shared rules for state changes and cross-actor governance."
  },
  {
    label: "Evidence-linked audit trail",
    body: "Attach evidence previews to disputed changes so reviewers can inspect why a product record changed.",
    linkedTo: "Use tamper-resistant auditability",
    sources: ["P1", "P2"],
    evidence: "Evidence-backed relations help reviewers trace claims back to source elements."
  }
];

export const artifactDirection = {
  title: "DLT-backed Product Identity Registry",
  description: "A DLT-backed product identity registry where marketplaces submit product identity claims, store product record hashes on-chain, keep detailed descriptions off-chain, and use reviewable update rules to prevent manipulation.",
  architecture: [
    "Product identity claim layer",
    "Off-chain product information store",
    "On-chain hash and attestation layer",
    "Marketplace update approval workflow",
    "Evidence and audit trail interface"
  ]
};

export const demoFlowNodes = [
  "Fragmented product identity",
  "Prevent information manipulation",
  "Tamper-resistant auditability",
  "On-chain hash anchoring",
  "Product identity registry",
  "Evidence-backed dispute review"
];

export const qualityCriteria = [
  {
    label: "Comprehensiveness",
    body: "Retrieved multiple relevant requirements, principles, and features across several papers."
  },
  {
    label: "Generality",
    body: "Avoided copying one paper's artifact directly and abstracted reusable design knowledge."
  },
  {
    label: "Soundness",
    body: "Every recommendation is linked to paper-level elements, relations, and evidence snippets."
  }
];
