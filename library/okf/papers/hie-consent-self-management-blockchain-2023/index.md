---
schema_version: "okf-dsr-v1"
type: "Paper"
paper_id: "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023"
slug: "hie-consent-self-management-blockchain-2023"
title: "Blockchain innovation for consent self-management in health information exchanges"
short_title: "Blockchain innovation for consent self-management in health information exchanges"
authors: ["Chad Anderson","Arthur Carvalho","Mala Kaul","Jeffrey W. Merhout"]
year: 2023
venue: "Decision Support Systems"
doi: "10.1016/j.dss.2023.114021"
doi_url: "https://doi.org/10.1016/j.dss.2023.114021"
source_url: null
source_pdf_filename: "Blockchain innovation for consent self-management in health information exchanges.pdf"
domain_context: "health information exchange consent self-management"
abstract: null
research_problem: ["Fragmented HIE consent management limits patient self-management, trust, interoperability, and auditability"]
research_objective: []
research_questions: ["How to enable patient consent self-management across distributed HIE systems","How blockchain can support private, trusted, and auditable consent changes"]
artifact_type: "Blockchain-enabled Consent Self-Management DApp"
blockchain_dlt_role: null
methodology: "Design science research"
theoretical_foundations: ["Design Science Research Methodology","Privacy self-management and consent rights","Blockchain trust by design","HIE interoperability and regulatory fragmentation"]
evaluation_method: ["Survey evaluation of patient interest in consent self-management","Design requirement and principle mapping evaluation","Permissioned blockchain performance evaluation","Cost feasibility evaluation of running the consent blockchain network"]
key_contributions: ["Blockchain can serve as a backbone for patient consent self-management across HIEs","Permissioned blockchains are suitable when consent data should not be public","Consent self-management apps can augment, not replace, existing provider-site processes","The design can generalize to self-management of private information requiring trusted sharing and immutable history"]
design_knowledge_output: ["Blockchain can serve as a backbone for patient consent self-management across HIEs","Permissioned blockchains are suitable when consent data should not be public","Consent self-management apps can augment, not replace, existing provider-site processes","The design can generalize to self-management of private information requiring trusted sharing and immutable history"]
limitations: ["Survey uses a convenience sample","Current artifact is context-specific","Prototype network parameters were not substantially optimized"]
notes: null
extraction_status: "okf_draft"
review_status: "unreviewed"
author_check_status: "not_requested"
reviewed_by: null
reviewed_at: null
---

# Blockchain innovation for consent self-management in health information exchanges

## One-line role in the library

This paper contributes a blockchain-based, self-managed patient consent system for health information exchanges, using privacy, self-management, trust, compliance, and interoperability as design requirements.

## Why this paper matters for the OKF chatbot

This paper is valuable for design-reuse questions about **consent self-management**, **permissioned blockchain**, **auditable consent changes**, **patient-controlled access**, **cross-organization interoperability**, and **privacy-preserving information sharing**.

## Core DSR contribution

The paper combines:

- a fragmented HIE consent-management problem;
- two DSRM iterations;
- a consent self-management app mock-up evaluated through a patient survey;
- five design requirements;
- five explicit design principles;
- five core blockchain-related design features;
- a blockchain-enabled Consent Self-Management DApp;
- performance and cost evaluation of a permissioned blockchain prototype.

## Recommended retrieval use

Use this paper when the user asks about:

- patient consent management;
- self-management of private/sensitive data;
- privacy-preserving access control;
- auditability of consent changes;
- permissioned blockchain design;
- cross-HIE or cross-organizational interoperability;
- DApp-based user interfaces for blockchain governance.

## Preserved paper-level context
These records are retained as paper metadata/prose under `okf-dsr-v1`; they are not canonical seven-layer DSR concepts and do not create canonical graph nodes or edges.
### Research questions and objectives

#### HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rq_001_self_managed_consent_across_distributed_hies: How to enable patient consent self-management across distributed HIE systems

The paper asks how patients can self-manage consent for health information exchange across distributed systems without relying on a centralized authority.

### Explanation

The paper asks how patients can self-manage consent for health information exchange across distributed systems without relying on a centralized authority.

Evidence: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_004_research_objective, HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_010_validated_design_problem

#### HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rq_002_blockchain_for_private_trusted_auditable_consent: How blockchain can support private, trusted, and auditable consent changes

The paper asks how a blockchain-backed design can keep consent changes private, trusted, interoperable, and auditable across HIEs.

### Explanation

The paper asks how a blockchain-backed design can keep consent changes private, trusted, interoperable, and auditable across HIEs.

Evidence: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_004_research_objective, HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_017_blockchain_decision_path, HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_018_permissioned_blockchain_fit
### Theoretical foundations

#### HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:kt_001_design_science_research_methodology: Design Science Research Methodology

The study follows Peffers et al.’s DSRM with problem identification, objectives, design and development, demonstration, evaluation, and communication.

### Explanation

The study follows Peffers et al.’s DSRM with problem identification, objectives, design and development, demonstration, evaluation, and communication.

Evidence: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_007_dsrm_two_iterations

#### HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:kt_002_privacy_self_management_and_consent: Privacy self-management and consent rights

The design is grounded in patients’ rights to control consent for collection, use, and disclosure of private health information.

### Explanation

The design is grounded in patients’ rights to control consent for collection, use, and disclosure of private health information.

Evidence: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_012_self_management_requirement, HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_011_privacy_requirement

#### HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:kt_003_blockchain_trust_by_design: Blockchain trust by design

The paper draws on blockchain’s decentralized authority, immutability, distributed ledger, and authentication to support trust and interoperability.

### Explanation

The paper draws on blockchain’s decentralized authority, immutability, distributed ledger, and authentication to support trust and interoperability.

Evidence: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_004_research_objective, HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_017_blockchain_decision_path

#### HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:kt_004_hie_interoperability_and_regulatory_fragmentation: HIE interoperability and regulatory fragmentation

The design problem is shaped by disconnected HIEs, heterogeneous consent regulations, and the need to share consent status across organizations.

### Explanation

The design problem is shaped by disconnected HIEs, heterogeneous consent regulations, and the need to share consent status across organizations.

Evidence: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_006_current_hie_fragmentation, HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_014_compliance_requirement, HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_015_interoperability_requirement
### Limitations

#### HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:lim_001_convenience_sample_survey: Survey uses a convenience sample

The authors note that the MTurk participant demographics are not a perfect representation of the U.S. population.

### Explanation

The authors note that the MTurk participant demographics are not a perfect representation of the U.S. population.

Evidence: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_026_limitations

#### HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:lim_002_context_specific_artifact: Current artifact is context-specific

The authors acknowledge that the research produced a context-specific artifact and identify generalization as future work.

### Explanation

The authors acknowledge that the research produced a context-specific artifact and identify generalization as future work.

Evidence: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_025_conclusion_design_knowledge, HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_026_limitations

#### HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:lim_003_prototype_not_fully_optimized: Prototype network parameters were not substantially optimized

The technical evaluation reports useful throughput/cost figures but notes that no substantial effort was made to optimize blockchain network parameters.

### Explanation

The technical evaluation reports useful throughput/cost figures but notes that no substantial effort was made to optimize blockchain network parameters.

Evidence: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_024_cost_evaluation
### Contextual links excluded from the canonical graph

These source-preserved legacy links touch a research question/objective, theoretical foundation, limitation, or unresolved legacy record. They remain human-readable context only and are not canonical graph edges.

- `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_001`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:prob_001_fragmented_hie_consent_self_management_problem` — **motivates** → `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rq_001_self_managed_consent_across_distributed_hies`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_004_research_objective`; confidence high.
- `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_002`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:prob_001_fragmented_hie_consent_self_management_problem` — **motivates** → `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rq_002_blockchain_for_private_trusted_auditable_consent`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_004_research_objective`; confidence high.
- `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_008`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rq_001_self_managed_consent_across_distributed_hies` — **requires** → `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_001_privacy_of_consent_status`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_011_privacy_requirement`; confidence high.
- `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_009`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rq_001_self_managed_consent_across_distributed_hies` — **requires** → `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_002_patient_self_management`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_012_self_management_requirement`; confidence high.
- `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_010`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rq_001_self_managed_consent_across_distributed_hies` — **requires** → `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_003_patient_and_hie_trust`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_013_trust_requirement`; confidence high.
- `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_011`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rq_001_self_managed_consent_across_distributed_hies` — **requires** → `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_004_regulatory_compliance_and_auditability`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_014_compliance_requirement`; confidence high.
- `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_012`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rq_001_self_managed_consent_across_distributed_hies` — **requires** → `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_005_interoperability_across_fragmented_hies`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_015_interoperability_requirement`; confidence high.
- `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_061`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:kt_001_design_science_research_methodology` — **derived from** → `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:art_002_blockchain_consent_self_management_dapp`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_007_dsrm_two_iterations`; confidence high.
- `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_062`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:kt_002_privacy_self_management_and_consent` — **derived from** → `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_002_patient_self_management`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_012_self_management_requirement`; confidence high.
- `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_063`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:kt_003_blockchain_trust_by_design` — **derived from** → `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dp_003_auditable_consent_transaction_history`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_017_blockchain_decision_path`; confidence high.
- `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_064`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:kt_004_hie_interoperability_and_regulatory_fragmentation` — **derived from** → `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_005_interoperability_across_fragmented_hies`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_015_interoperability_requirement`; confidence high.
- `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_065`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:lim_001_convenience_sample_survey` — **contrasts with** → `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:eval_001_patient_survey_evaluation`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_026_limitations`; confidence medium-high.
- `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_066`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:lim_002_context_specific_artifact` — **contrasts with** → `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ok_004_design_generalizes_to_private_information_sharing_with_auditable_history`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_025_conclusion_design_knowledge`; confidence medium-high.
- `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_067`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:lim_003_prototype_not_fully_optimized` — **contrasts with** → `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:eval_003_blockchain_performance_evaluation`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_024_cost_evaluation`; confidence medium-high.
