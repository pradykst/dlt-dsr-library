---
schema_version: "okf-dsr-v1"
type: "Paper"
paper_id: "SSI_KYC_FRAMEWORK_2022"
slug: "ssi-kyc-framework-2022"
title: "Designing a Framework for Digital KYC Processes Built on Blockchain-Based Self-Sovereign Identity"
short_title: "Designing a Framework for Digital KYC Processes Built on Blockchain-Based Self-Sovereign Identity"
authors: ["Vincent Schlatt","Johannes Sedlmeir","Simon Feulner","Nils Urbach"]
year: 2022
venue: "Information & Management"
doi: "10.1016/j.im.2021.103553"
doi_url: "https://doi.org/10.1016/j.im.2021.103553"
source_url: null
source_pdf_filename: "Designing a framework.pdf"
domain_context: "Costly, inefficient, repetitive, privacy-sensitive KYC processes"
abstract: null
research_problem: ["Costly, inefficient, repetitive, privacy-sensitive KYC processes","Centralized eKYC utilities create data-silo, surveillance, and market-power risks","Blockchain transparency conflicts with personal-data privacy in eKYC"]
research_objective: []
research_questions: ["How can blockchain-based SSI support the complete digital KYC process?","What generic design principles guide blockchain-based SSI systems?"]
artifact_type: "SSI-based eKYC framework"
blockchain_dlt_role: null
methodology: "Peffers et al. design science research methodology"
theoretical_foundations: ["Peffers et al. design science research methodology","Self-sovereign identity","DID and verifiable credential standards","GDPR, AML/KYC, and eIDAS regulatory context","Blockchain as neutral cross-organizational infrastructure"]
evaluation_method: ["Formative expert evaluation of design objectives","Criteria-based expert evaluation of the SSI-based eKYC framework","Regulatory and privacy fit assessment","Practical feasibility and utility assessment"]
key_contributions: ["Blockchain’s role in SSI should be restrictive and public-data-oriented","SSI enables reusable identity without centralized identity providers","Fast onboarding pattern for reusable KYC credentials","Bilateral verifiable presentation exchange as a privacy pattern","SSI interoperability requires standards and cross-ledger governance"]
design_knowledge_output: ["Blockchain’s role in SSI should be restrictive and public-data-oriented","SSI enables reusable identity without centralized identity providers","Fast onboarding pattern for reusable KYC credentials","Bilateral verifiable presentation exchange as a privacy pattern","SSI interoperability requires standards and cross-ledger governance"]
limitations: ["Governance and adoption challenges remain unresolved","No real-world deployment evaluation yet","Regulatory interpretation uncertainty","Wallet usability and recovery risk","Interbank trust and credential acceptance require governance"]
notes: null
extraction_status: "okf_draft"
review_status: "unreviewed"
author_check_status: "not_requested"
reviewed_by: null
reviewed_at: null
---

# Designing a Framework for Digital KYC Processes Built on Blockchain-Based Self-Sovereign Identity

This OKF bundle captures the paper's DSR contribution: an SSI-based framework for digital KYC processes, evaluated through expert interviews and generalized into nascent design principles for blockchain-based SSI.

## Core contribution

The paper argues that KYC can be improved through a customer-centered SSI architecture: customers hold KYC credentials in wallets, banks verify verifiable presentations, and blockchain is restricted to public trust anchors such as issuer keys, schemas, and revocation registries.

## Preserved paper-level context
These records are retained as paper metadata/prose under `okf-dsr-v1`; they are not canonical seven-layer DSR concepts and do not create canonical graph nodes or edges.
### Research questions and objectives

#### SSI_KYC_FRAMEWORK_2022:rq_001_design_ssi_based_ekyc_framework: How can blockchain-based SSI support the complete digital KYC process?

The paper designs and evaluates an architecture and process framework for eKYC built on blockchain-based self-sovereign identity.

### Explanation

The paper designs and evaluates an architecture and process framework for eKYC built on blockchain-based self-sovereign identity.

Evidence: SSI_KYC_FRAMEWORK_2022:ev_005_ssi_as_alternative, SSI_KYC_FRAMEWORK_2022:ev_006_research_goal

#### SSI_KYC_FRAMEWORK_2022:rq_002_derive_design_principles_for_blockchain_based_ssi: What generic design principles guide blockchain-based SSI systems?

Beyond KYC, the paper derives nascent design principles for how blockchain should be used in SSI architectures.

### Explanation

Beyond KYC, the paper derives nascent design principles for how blockchain should be used in SSI architectures.

Evidence: SSI_KYC_FRAMEWORK_2022:ev_006_research_goal, SSI_KYC_FRAMEWORK_2022:ev_041_conclusion_contributions
### Theoretical foundations

#### SSI_KYC_FRAMEWORK_2022:kt_001_peffers_dsrm: Peffers et al. design science research methodology

The study uses Peffers et al. DSRM to structure problem identification, objectives, design and development, demonstration, evaluation, and communication.

### Explanation

The study uses Peffers et al. DSRM to structure problem identification, objectives, design and development, demonstration, evaluation, and communication.

Evidence: SSI_KYC_FRAMEWORK_2022:ev_014_dsrm_process

#### SSI_KYC_FRAMEWORK_2022:kt_002_self_sovereign_identity: Self-sovereign identity

SSI provides the conceptual foundation for customer-controlled digital identities, DIDs, wallets, credentials, and selective disclosure.

### Explanation

SSI provides the conceptual foundation for customer-controlled digital identities, DIDs, wallets, credentials, and selective disclosure.

Evidence: SSI_KYC_FRAMEWORK_2022:ev_011_ssi_roles_components, SSI_KYC_FRAMEWORK_2022:ev_012_vc_and_revocation_capabilities

#### SSI_KYC_FRAMEWORK_2022:kt_003_verifiable_credentials_and_dids_standards: DID and verifiable credential standards

The framework builds on DID and VC standards to create portable identifiers, attestations, and verifiable presentations for cross-organizational identity management.

### Explanation

The framework builds on DID and VC standards to create portable identifiers, attestations, and verifiable presentations for cross-organizational identity management.

Evidence: SSI_KYC_FRAMEWORK_2022:ev_011_ssi_roles_components, SSI_KYC_FRAMEWORK_2022:ev_012_vc_and_revocation_capabilities

#### SSI_KYC_FRAMEWORK_2022:kt_004_gdpr_and_eidas_regulatory_context: GDPR, AML/KYC, and eIDAS regulatory context

The framework is shaped by AML/KYC due diligence obligations, GDPR privacy requirements, and eIDAS-compatible digital identification and trust services.

### Explanation

The framework is shaped by AML/KYC due diligence obligations, GDPR privacy requirements, and eIDAS-compatible digital identification and trust services.

Evidence: SSI_KYC_FRAMEWORK_2022:ev_017_regulatory_compliance_objective, SSI_KYC_FRAMEWORK_2022:ev_032_evaluation_regulatory

#### SSI_KYC_FRAMEWORK_2022:kt_005_blockchain_as_neutral_cross_organizational_infrastructure: Blockchain as neutral cross-organizational infrastructure

Blockchain is treated as a neutral infrastructure for public trust anchors and cross-organizational coordination, not as a general storage medium for personal data.

### Explanation

Blockchain is treated as a neutral infrastructure for public trust anchors and cross-organizational coordination, not as a general storage medium for personal data.

Evidence: SSI_KYC_FRAMEWORK_2022:ev_004_blockchain_privacy_tension, SSI_KYC_FRAMEWORK_2022:ev_024_public_ledger_role
### Limitations

#### SSI_KYC_FRAMEWORK_2022:lim_001_governance_and_adoption_challenges: Governance and adoption challenges remain unresolved

The framework requires standards, credential issuers, bank cooperation, trusted issuers, governance frameworks, and sufficient adoption to overcome chicken-and-egg dynamics.

### Explanation

The framework requires standards, credential issuers, bank cooperation, trusted issuers, governance frameworks, and sufficient adoption to overcome chicken-and-egg dynamics.

Evidence: SSI_KYC_FRAMEWORK_2022:ev_040_adoption_and_governance_challenges

#### SSI_KYC_FRAMEWORK_2022:lim_002_no_real_world_deployment_yet: No real-world deployment evaluation yet

The framework is conceptually and expert-evaluated but has not yet been used in practice or evaluated in a real-world operational KYC setting.

### Explanation

The framework is conceptually and expert-evaluated but has not yet been used in practice or evaluated in a real-world operational KYC setting.

Evidence: SSI_KYC_FRAMEWORK_2022:ev_042_limitations_real_world_eval

#### SSI_KYC_FRAMEWORK_2022:lim_003_regulatory_interpretation_uncertainty: Regulatory interpretation uncertainty

The design is aligned with GDPR and eIDAS objectives, but detailed legal assessment remains necessary because interpretations of encrypted, hashed, and identity-related data are still uncertain.

### Explanation

The design is aligned with GDPR and eIDAS objectives, but detailed legal assessment remains necessary because interpretations of encrypted, hashed, and identity-related data are still uncertain.

Evidence: SSI_KYC_FRAMEWORK_2022:ev_032_evaluation_regulatory

#### SSI_KYC_FRAMEWORK_2022:lim_004_wallet_usability_and_recovery_risk: Wallet usability and recovery risk

SSI places more responsibility on users for wallets, keys, backups, and recovery, creating usability and support challenges.

### Explanation

SSI places more responsibility on users for wallets, keys, backups, and recovery, creating usability and support challenges.

Evidence: SSI_KYC_FRAMEWORK_2022:ev_021_user_experience_objective, SSI_KYC_FRAMEWORK_2022:ev_036_evaluation_user_experience

#### SSI_KYC_FRAMEWORK_2022:lim_005_interbank_trust_and_standard_acceptance: Interbank trust and credential acceptance require governance

Banks must agree on which credentials, schemas, issuers, and revocation registries they accept; the technical framework alone does not settle institutional trust rules.

### Explanation

Banks must agree on which credentials, schemas, issuers, and revocation registries they accept; the technical framework alone does not settle institutional trust rules.

Evidence: SSI_KYC_FRAMEWORK_2022:ev_034_evaluation_trust, SSI_KYC_FRAMEWORK_2022:ev_040_adoption_and_governance_challenges
### Contextual links excluded from the canonical graph

These source-preserved legacy links touch a research question/objective, theoretical foundation, limitation, or unresolved legacy record. They remain human-readable context only and are not canonical graph edges.

- `SSI_KYC_FRAMEWORK_2022:rel_001`: `SSI_KYC_FRAMEWORK_2022:prob_001_costly_inefficient_privacy_sensitive_kyc` — **motivates** → `SSI_KYC_FRAMEWORK_2022:rq_001_design_ssi_based_ekyc_framework`; evidence `SSI_KYC_FRAMEWORK_2022:ev_006_research_goal`; confidence high.
- `SSI_KYC_FRAMEWORK_2022:rel_002`: `SSI_KYC_FRAMEWORK_2022:prob_001_costly_inefficient_privacy_sensitive_kyc` — **motivates** → `SSI_KYC_FRAMEWORK_2022:rq_002_derive_design_principles_for_blockchain_based_ssi`; evidence `SSI_KYC_FRAMEWORK_2022:ev_006_research_goal`; confidence high.
- `SSI_KYC_FRAMEWORK_2022:rel_003`: `SSI_KYC_FRAMEWORK_2022:prob_002_centralized_ekyc_data_silos_and_market_power` — **motivates** → `SSI_KYC_FRAMEWORK_2022:rq_001_design_ssi_based_ekyc_framework`; evidence `SSI_KYC_FRAMEWORK_2022:ev_005_ssi_as_alternative`; confidence high.
- `SSI_KYC_FRAMEWORK_2022:rel_004`: `SSI_KYC_FRAMEWORK_2022:prob_003_blockchain_transparency_vs_personal_data_privacy` — **motivates** → `SSI_KYC_FRAMEWORK_2022:rq_002_derive_design_principles_for_blockchain_based_ssi`; evidence `SSI_KYC_FRAMEWORK_2022:ev_006_research_goal`; confidence high.
- `SSI_KYC_FRAMEWORK_2022:rel_006`: `SSI_KYC_FRAMEWORK_2022:rq_001_design_ssi_based_ekyc_framework` — **requires** → `SSI_KYC_FRAMEWORK_2022:dr_001_efficiency`; evidence `SSI_KYC_FRAMEWORK_2022:ev_016_efficiency_objective`; confidence high.
- `SSI_KYC_FRAMEWORK_2022:rel_008`: `SSI_KYC_FRAMEWORK_2022:rq_001_design_ssi_based_ekyc_framework` — **requires** → `SSI_KYC_FRAMEWORK_2022:dr_002_regulatory_compliance`; evidence `SSI_KYC_FRAMEWORK_2022:ev_017_regulatory_compliance_objective`; confidence high.
- `SSI_KYC_FRAMEWORK_2022:rel_010`: `SSI_KYC_FRAMEWORK_2022:rq_001_design_ssi_based_ekyc_framework` — **requires** → `SSI_KYC_FRAMEWORK_2022:dr_003_decentralization`; evidence `SSI_KYC_FRAMEWORK_2022:ev_018_decentralization_objective`; confidence high.
- `SSI_KYC_FRAMEWORK_2022:rel_012`: `SSI_KYC_FRAMEWORK_2022:rq_001_design_ssi_based_ekyc_framework` — **requires** → `SSI_KYC_FRAMEWORK_2022:dr_004_trust_in_reusable_kyc_documents`; evidence `SSI_KYC_FRAMEWORK_2022:ev_019_trust_objective`; confidence high.
- `SSI_KYC_FRAMEWORK_2022:rel_014`: `SSI_KYC_FRAMEWORK_2022:rq_001_design_ssi_based_ekyc_framework` — **requires** → `SSI_KYC_FRAMEWORK_2022:dr_005_privacy`; evidence `SSI_KYC_FRAMEWORK_2022:ev_020_privacy_objective`; confidence high.
- `SSI_KYC_FRAMEWORK_2022:rel_016`: `SSI_KYC_FRAMEWORK_2022:rq_001_design_ssi_based_ekyc_framework` — **requires** → `SSI_KYC_FRAMEWORK_2022:dr_006_user_experience`; evidence `SSI_KYC_FRAMEWORK_2022:ev_021_user_experience_objective`; confidence high.
- `SSI_KYC_FRAMEWORK_2022:rel_096`: `SSI_KYC_FRAMEWORK_2022:dr_001_efficiency` — **derived from** → `SSI_KYC_FRAMEWORK_2022:kt_001_peffers_dsrm`; evidence `SSI_KYC_FRAMEWORK_2022:ev_014_dsrm_process`; confidence high.
- `SSI_KYC_FRAMEWORK_2022:rel_097`: `SSI_KYC_FRAMEWORK_2022:dr_002_regulatory_compliance` — **derived from** → `SSI_KYC_FRAMEWORK_2022:kt_001_peffers_dsrm`; evidence `SSI_KYC_FRAMEWORK_2022:ev_014_dsrm_process`; confidence high.
- `SSI_KYC_FRAMEWORK_2022:rel_098`: `SSI_KYC_FRAMEWORK_2022:dr_003_decentralization` — **derived from** → `SSI_KYC_FRAMEWORK_2022:kt_001_peffers_dsrm`; evidence `SSI_KYC_FRAMEWORK_2022:ev_014_dsrm_process`; confidence high.
- `SSI_KYC_FRAMEWORK_2022:rel_099`: `SSI_KYC_FRAMEWORK_2022:dr_004_trust_in_reusable_kyc_documents` — **derived from** → `SSI_KYC_FRAMEWORK_2022:kt_001_peffers_dsrm`; evidence `SSI_KYC_FRAMEWORK_2022:ev_014_dsrm_process`; confidence high.
- `SSI_KYC_FRAMEWORK_2022:rel_100`: `SSI_KYC_FRAMEWORK_2022:dr_005_privacy` — **derived from** → `SSI_KYC_FRAMEWORK_2022:kt_001_peffers_dsrm`; evidence `SSI_KYC_FRAMEWORK_2022:ev_014_dsrm_process`; confidence high.
- `SSI_KYC_FRAMEWORK_2022:rel_101`: `SSI_KYC_FRAMEWORK_2022:dr_006_user_experience` — **derived from** → `SSI_KYC_FRAMEWORK_2022:kt_001_peffers_dsrm`; evidence `SSI_KYC_FRAMEWORK_2022:ev_014_dsrm_process`; confidence high.
- `SSI_KYC_FRAMEWORK_2022:rel_102`: `SSI_KYC_FRAMEWORK_2022:dp_004_customer_centered_ssi_control` — **derived from** → `SSI_KYC_FRAMEWORK_2022:kt_002_self_sovereign_identity`; evidence `SSI_KYC_FRAMEWORK_2022:ev_011_ssi_roles_components`; confidence high.
- `SSI_KYC_FRAMEWORK_2022:rel_103`: `SSI_KYC_FRAMEWORK_2022:df_001_dids_and_did_documents` — **derived from** → `SSI_KYC_FRAMEWORK_2022:kt_002_self_sovereign_identity`; evidence `SSI_KYC_FRAMEWORK_2022:ev_011_ssi_roles_components`; confidence high.
- `SSI_KYC_FRAMEWORK_2022:rel_104`: `SSI_KYC_FRAMEWORK_2022:df_002_user_agents_and_digital_wallets` — **derived from** → `SSI_KYC_FRAMEWORK_2022:kt_002_self_sovereign_identity`; evidence `SSI_KYC_FRAMEWORK_2022:ev_011_ssi_roles_components`; confidence high.
- `SSI_KYC_FRAMEWORK_2022:rel_105`: `SSI_KYC_FRAMEWORK_2022:df_003_verifiable_credentials_and_presentations` — **derived from** → `SSI_KYC_FRAMEWORK_2022:kt_002_self_sovereign_identity`; evidence `SSI_KYC_FRAMEWORK_2022:ev_011_ssi_roles_components`; confidence high.
- `SSI_KYC_FRAMEWORK_2022:rel_106`: `SSI_KYC_FRAMEWORK_2022:df_001_dids_and_did_documents` — **derived from** → `SSI_KYC_FRAMEWORK_2022:kt_003_verifiable_credentials_and_dids_standards`; evidence `SSI_KYC_FRAMEWORK_2022:ev_012_vc_and_revocation_capabilities`; confidence high.
- `SSI_KYC_FRAMEWORK_2022:rel_107`: `SSI_KYC_FRAMEWORK_2022:df_003_verifiable_credentials_and_presentations` — **derived from** → `SSI_KYC_FRAMEWORK_2022:kt_003_verifiable_credentials_and_dids_standards`; evidence `SSI_KYC_FRAMEWORK_2022:ev_012_vc_and_revocation_capabilities`; confidence high.
- `SSI_KYC_FRAMEWORK_2022:rel_108`: `SSI_KYC_FRAMEWORK_2022:df_006_credential_schemas_and_definitions` — **derived from** → `SSI_KYC_FRAMEWORK_2022:kt_003_verifiable_credentials_and_dids_standards`; evidence `SSI_KYC_FRAMEWORK_2022:ev_012_vc_and_revocation_capabilities`; confidence high.
- `SSI_KYC_FRAMEWORK_2022:rel_109`: `SSI_KYC_FRAMEWORK_2022:dr_002_regulatory_compliance` — **derived from** → `SSI_KYC_FRAMEWORK_2022:kt_004_gdpr_and_eidas_regulatory_context`; evidence `SSI_KYC_FRAMEWORK_2022:ev_032_evaluation_regulatory`; confidence high.
- `SSI_KYC_FRAMEWORK_2022:rel_110`: `SSI_KYC_FRAMEWORK_2022:dp_001_use_blockchain_only_for_public_data` — **derived from** → `SSI_KYC_FRAMEWORK_2022:kt_004_gdpr_and_eidas_regulatory_context`; evidence `SSI_KYC_FRAMEWORK_2022:ev_032_evaluation_regulatory`; confidence high.
- `SSI_KYC_FRAMEWORK_2022:rel_111`: `SSI_KYC_FRAMEWORK_2022:eval_003_regulatory_privacy_fit_assessment` — **derived from** → `SSI_KYC_FRAMEWORK_2022:kt_004_gdpr_and_eidas_regulatory_context`; evidence `SSI_KYC_FRAMEWORK_2022:ev_032_evaluation_regulatory`; confidence high.
- `SSI_KYC_FRAMEWORK_2022:rel_112`: `SSI_KYC_FRAMEWORK_2022:dp_001_use_blockchain_only_for_public_data` — **derived from** → `SSI_KYC_FRAMEWORK_2022:kt_005_blockchain_as_neutral_cross_organizational_infrastructure`; evidence `SSI_KYC_FRAMEWORK_2022:ev_024_public_ledger_role`; confidence high.
- `SSI_KYC_FRAMEWORK_2022:rel_113`: `SSI_KYC_FRAMEWORK_2022:df_008_public_data_registry_on_ledger` — **derived from** → `SSI_KYC_FRAMEWORK_2022:kt_005_blockchain_as_neutral_cross_organizational_infrastructure`; evidence `SSI_KYC_FRAMEWORK_2022:ev_024_public_ledger_role`; confidence high.
- `SSI_KYC_FRAMEWORK_2022:rel_114`: `SSI_KYC_FRAMEWORK_2022:art_001_ssi_based_ekyc_framework` — **derived from** → `SSI_KYC_FRAMEWORK_2022:kt_005_blockchain_as_neutral_cross_organizational_infrastructure`; evidence `SSI_KYC_FRAMEWORK_2022:ev_024_public_ledger_role`; confidence high.
- `SSI_KYC_FRAMEWORK_2022:rel_115`: `SSI_KYC_FRAMEWORK_2022:lim_001_governance_and_adoption_challenges` — **supported by** → `SSI_KYC_FRAMEWORK_2022:eval_004_practical_feasibility_and_utility_assessment`; evidence `SSI_KYC_FRAMEWORK_2022:ev_040_adoption_and_governance_challenges`; confidence medium-high.
- `SSI_KYC_FRAMEWORK_2022:rel_116`: `SSI_KYC_FRAMEWORK_2022:lim_002_no_real_world_deployment_yet` — **supported by** → `SSI_KYC_FRAMEWORK_2022:eval_004_practical_feasibility_and_utility_assessment`; evidence `SSI_KYC_FRAMEWORK_2022:ev_042_limitations_real_world_eval`; confidence medium-high.
- `SSI_KYC_FRAMEWORK_2022:rel_117`: `SSI_KYC_FRAMEWORK_2022:lim_003_regulatory_interpretation_uncertainty` — **supported by** → `SSI_KYC_FRAMEWORK_2022:eval_004_practical_feasibility_and_utility_assessment`; evidence `SSI_KYC_FRAMEWORK_2022:ev_032_evaluation_regulatory`; confidence medium-high.
- `SSI_KYC_FRAMEWORK_2022:rel_118`: `SSI_KYC_FRAMEWORK_2022:lim_004_wallet_usability_and_recovery_risk` — **supported by** → `SSI_KYC_FRAMEWORK_2022:eval_004_practical_feasibility_and_utility_assessment`; evidence `SSI_KYC_FRAMEWORK_2022:ev_036_evaluation_user_experience`; confidence medium-high.
- `SSI_KYC_FRAMEWORK_2022:rel_119`: `SSI_KYC_FRAMEWORK_2022:lim_005_interbank_trust_and_standard_acceptance` — **supported by** → `SSI_KYC_FRAMEWORK_2022:eval_004_practical_feasibility_and_utility_assessment`; evidence `SSI_KYC_FRAMEWORK_2022:ev_034_evaluation_trust`; confidence medium-high.
