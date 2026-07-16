---
schema_version: "okf-dsr-v1"
type: "EvidenceCollection"
paper_id: "SSI_KYC_FRAMEWORK_2022"
extraction_status: "okf_draft"
review_status: "unreviewed"
---

# Canonical Evidence Items

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_001_abstract_problem_objective

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_001_abstract_problem_objective",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022:prob_001_costly_inefficient_privacy_sensitive_kyc"
  ],
  "source_location": "Designing a framework.pdf · page 1 · Abstract",
  "quote_or_summary": "The abstract frames KYC as costly, inefficient, and inconvenient, while noting that blockchain must be used without violating data protection and customer privacy.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_002_intro_kyc_burden

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_002_intro_kyc_burden",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022:prob_001_costly_inefficient_privacy_sensitive_kyc"
  ],
  "source_location": "Designing a framework.pdf · page 1 · Introduction",
  "quote_or_summary": "The introduction explains that KYC due diligence typically requires customers to provide identifying information in branch or by video call and is cost-intensive, time-consuming, repetitive, and inconvenient.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_003_central_utility_limits

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_003_central_utility_limits",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022:prob_002_centralized_ekyc_data_silos_and_market_power"
  ],
  "source_location": "Designing a framework.pdf · page 1 · Introduction",
  "quote_or_summary": "The paper explains that central eKYC utilities can reduce costs but create data-silo risks, misuse/leak concerns, political or market power concentration, and reduced trust.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_004_blockchain_privacy_tension

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_004_blockchain_privacy_tension",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022:prob_003_blockchain_transparency_vs_personal_data_privacy"
  ],
  "source_location": "Designing a framework.pdf · page 1 · Introduction",
  "quote_or_summary": "The paper notes that blockchain offers neutral cross-organizational platforms and digital trust, but its transparency and append-only structure aggravate privacy and GDPR right-to-erasure problems.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_005_ssi_as_alternative

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_005_ssi_as_alternative",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022:ok_002_ssi_can_decouple_identity_reuse_from_centralized_identity_providers"
  ],
  "source_location": "Designing a framework.pdf · page 2 · Introduction",
  "quote_or_summary": "The authors motivate SSI as a way to store KYC information with the customer, while using blockchain as a neutral platform for governance, standards, and public information required to validate attestations.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_006_research_goal

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_006_research_goal",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022"
  ],
  "source_location": "Designing a framework.pdf · page 2 · Introduction",
  "quote_or_summary": "The paper states its goal of designing a framework for an eKYC process built on blockchain-based SSI and deriving initial generic design principles for blockchain-based SSI.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_007_kyc_process_steps

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_007_kyc_process_steps",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022:prob_001_costly_inefficient_privacy_sensitive_kyc"
  ],
  "source_location": "Designing a framework.pdf · page 3 · Figure 1 / KYC process",
  "quote_or_summary": "Figure 1 presents KYC as a process moving from customer identification to data verification, name screening, risk assessment, enhanced due diligence, ongoing monitoring, and records keeping.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_008_repeated_kyc_costs

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_008_repeated_kyc_costs",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022:dr_001_efficiency",
    "SSI_KYC_FRAMEWORK_2022:prob_001_costly_inefficient_privacy_sensitive_kyc"
  ],
  "source_location": "Designing a framework.pdf · page 2 · KYC process and centralized attempts at eKYC",
  "quote_or_summary": "The paper reports that KYC must be repeated for each bank and cites poor user experience, high annual KYC costs, and costly manual work as major drivers for improvement.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_009_centralized_eKYC_risks

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_009_centralized_eKYC_risks",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022:dr_003_decentralization",
    "SSI_KYC_FRAMEWORK_2022:prob_002_centralized_ekyc_data_silos_and_market_power"
  ],
  "source_location": "Designing a framework.pdf · page 3 · KYC process and centralized attempts at eKYC",
  "quote_or_summary": "Central eKYC systems such as Aadhaar can accelerate onboarding but raise concerns around privacy, surveillance, market power, data breaches, and the security of centralized stores of sensitive information.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_010_dlt_limitations_for_personal_data

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_010_dlt_limitations_for_personal_data",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022:dp_001_use_blockchain_only_for_public_data",
    "SSI_KYC_FRAMEWORK_2022:prob_003_blockchain_transparency_vs_personal_data_privacy"
  ],
  "source_location": "Designing a framework.pdf · page 3 · Blockchain technology and decentralized approaches to eKYC",
  "quote_or_summary": "The paper argues that storing personal data on ledgers does not make sense because on-chain data is visible to nodes and practically impossible to delete, complicating GDPR compliance.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_011_ssi_roles_components

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_011_ssi_roles_components",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022:df_001_dids_and_did_documents",
    "SSI_KYC_FRAMEWORK_2022:dp_004_customer_centered_ssi_control",
    "SSI_KYC_FRAMEWORK_2022:df_002_user_agents_and_digital_wallets"
  ],
  "source_location": "Designing a framework.pdf · page 4 · SSI and its proposed application to eKYC / Figure 2",
  "quote_or_summary": "The SSI section and Figure 2 describe holders, issuers, verifiers, agents, wallets, verifiable data registries, pairwise peer DIDs, global DIDs, registries, and distributed ledgers.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_012_vc_and_revocation_capabilities

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_012_vc_and_revocation_capabilities",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022:df_003_verifiable_credentials_and_presentations",
    "SSI_KYC_FRAMEWORK_2022:df_005_revocation_registries"
  ],
  "source_location": "Designing a framework.pdf · page 4 · SSI and its proposed application to eKYC",
  "quote_or_summary": "The paper explains that verifiable credentials are digital certificates whose validity and revocation status can be verified without contacting the issuer, using signatures and privacy-preserving revocation registries.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_013_pairwise_dids_privacy

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_013_pairwise_dids_privacy",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022:dr_005_privacy",
    "SSI_KYC_FRAMEWORK_2022:df_004_pairwise_dids_for_customer_bank_relationships"
  ],
  "source_location": "Designing a framework.pdf · page 4 · SSI and its proposed application to eKYC",
  "quote_or_summary": "The paper explains that pairwise DIDs can be used for different interactions and that global DIDs are needed only for public entities such as credential issuers, improving privacy.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_014_dsrm_process

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_014_dsrm_process",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022:eval_001_design_objectives_formative_interviews"
  ],
  "source_location": "Designing a framework.pdf · page 5 · Method / Figure 3",
  "quote_or_summary": "The paper follows Peffers et al. DSRM and Figure 3 maps problem identification, objectives, design and development, demonstration, evaluation, and communication for the SSI-based KYC framework.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_015_design_objectives_overview

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_015_design_objectives_overview",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022:dr_001_efficiency"
  ],
  "source_location": "Designing a framework.pdf · page 6 · Design objectives",
  "quote_or_summary": "The paper derives six main objectives for the eKYC framework: efficiency, regulatory compliance, decentralization, trust, privacy, and user experience, with associated requirements.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_016_efficiency_objective

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_016_efficiency_objective",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022:dr_001_efficiency"
  ],
  "source_location": "Designing a framework.pdf · page 6 · Objective 1: Efficiency",
  "quote_or_summary": "The efficiency objective requires end-to-end digital document processing, automation of manual processes, and standardized exchange of eKYC documents to reduce friction and enable reuse.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_017_regulatory_compliance_objective

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_017_regulatory_compliance_objective",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022:dr_002_regulatory_compliance",
    "SSI_KYC_FRAMEWORK_2022:df_007_qualified_electronic_certificates_and_eidas_bridge"
  ],
  "source_location": "Designing a framework.pdf · page 6 · Objective 2: Regulatory compliance",
  "quote_or_summary": "The regulatory compliance objective covers AML/KYC regulation, GDPR requirements, and eIDAS requirements for electronic identification, authentication, and trust services.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_018_decentralization_objective

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_018_decentralization_objective",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022:dr_003_decentralization"
  ],
  "source_location": "Designing a framework.pdf · page 6 · Objective 3: Decentralization",
  "quote_or_summary": "The decentralization objective requires avoiding central storage of customer data and preventing lock-in effects or market-power aggregation by centralized eKYC providers.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_019_trust_objective

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_019_trust_objective",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022:dr_004_trust_in_reusable_kyc_documents"
  ],
  "source_location": "Designing a framework.pdf · page 6 · Objective 4: Trust",
  "quote_or_summary": "The trust objective requires acceptance of KYC documents attested by other banks, validity checks of those documents, and authenticity checks to prevent sharing or selling credentials among customers.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_020_privacy_objective

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_020_privacy_objective",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022:dr_005_privacy"
  ],
  "source_location": "Designing a framework.pdf · page 6 · Objective 5: Privacy",
  "quote_or_summary": "The privacy objective requires compliance with need-to-know principles and data minimization so that only relevant KYC parties and necessary attributes are exposed.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_021_user_experience_objective

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_021_user_experience_objective",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022:dr_006_user_experience",
    "SSI_KYC_FRAMEWORK_2022:df_014_backup_recovery_and_support"
  ],
  "source_location": "Designing a framework.pdf · page 6 · Objective 6: User experience",
  "quote_or_summary": "The user-experience objective requires low complexity, multiple user interfaces, and backup, recovery, and support capabilities for device loss or theft.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_022_objective_evaluation_interviews

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_022_objective_evaluation_interviews",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022:eval_001_design_objectives_formative_interviews",
    "SSI_KYC_FRAMEWORK_2022:df_007_qualified_electronic_certificates_and_eidas_bridge"
  ],
  "source_location": "Designing a framework.pdf · page 7 · Evaluation of design objectives",
  "quote_or_summary": "The experts confirmed the relevance of the derived objectives, especially process efficiency, privacy, regulation, user experience, backup and recovery, and trust relationships between banks.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_023_architecture_overview

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_023_architecture_overview",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022:art_001_ssi_based_ekyc_framework",
    "SSI_KYC_FRAMEWORK_2022:df_003_verifiable_credentials_and_presentations",
    "SSI_KYC_FRAMEWORK_2022:art_005_ssi_kyc_architecture_model"
  ],
  "source_location": "Designing a framework.pdf · page 8 · SSI-based eKYC architecture / Figure 4",
  "quote_or_summary": "Figure 4 presents the SSI-based KYC architecture with credential issuer, customer, bank, agents and wallets, verifiable credentials, verifiable presentations, KYC interface, storage, name screening, risk engine, and distributed ledger.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_024_public_ledger_role

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_024_public_ledger_role",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022:df_008_public_data_registry_on_ledger",
    "SSI_KYC_FRAMEWORK_2022:df_006_credential_schemas_and_definitions"
  ],
  "source_location": "Designing a framework.pdf · page 8 · SSI-based eKYC architecture",
  "quote_or_summary": "The architecture uses the blockchain as neutral infrastructure for VC issuer public keys, institutional information, credential schemas, and privacy-preserving revocation registries.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_025_customer_control_wallets

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_025_customer_control_wallets",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022:df_002_user_agents_and_digital_wallets",
    "SSI_KYC_FRAMEWORK_2022:dp_004_customer_centered_ssi_control"
  ],
  "source_location": "Designing a framework.pdf · page 8 · SSI-based eKYC architecture",
  "quote_or_summary": "Customers manage DIDs, keys, credentials, backups, and permissions through user agents and digital wallets, retaining control over their KYC-related documents represented by VCs.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_026_completely_new_onboarding

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_026_completely_new_onboarding",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022:art_002_completely_new_onboarding_process",
    "SSI_KYC_FRAMEWORK_2022:df_001_dids_and_did_documents",
    "SSI_KYC_FRAMEWORK_2022:df_009_secure_connection_protocol"
  ],
  "source_location": "Designing a framework.pdf · page 8 · Figure 5 / Completely New Onboarding",
  "quote_or_summary": "Figure 5 details a completely new onboarding sequence where the bank registers issuer data on the ledger, sends an agent download link, establishes a pairwise DID connection, verifies identity documents, opens an account, and issues a credential.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_027_fast_onboarding

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_027_fast_onboarding",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022:art_003_fast_onboarding_process",
    "SSI_KYC_FRAMEWORK_2022:dp_005_reuse_verifiable_kyc_credentials",
    "SSI_KYC_FRAMEWORK_2022:df_004_pairwise_dids_for_customer_bank_relationships",
    "SSI_KYC_FRAMEWORK_2022:df_005_revocation_registries",
    "SSI_KYC_FRAMEWORK_2022:df_006_credential_schemas_and_definitions",
    "SSI_KYC_FRAMEWORK_2022:df_009_secure_connection_protocol",
    "SSI_KYC_FRAMEWORK_2022:df_010_proof_request_and_non_revocation_proof",
    "SSI_KYC_FRAMEWORK_2022:art_004_new_to_kyc_hybrid_onboarding_process",
    "SSI_KYC_FRAMEWORK_2022:ok_003_fast_onboarding_pattern_for_reusable_credentials"
  ],
  "source_location": "Designing a framework.pdf · page 10 · Figure 6 / Fast Onboarding",
  "quote_or_summary": "Figure 6 details fast onboarding where a customer already has a wallet and accepted VCs, establishes a pairwise DID connection, receives a proof request, sends a verifiable presentation with non-revocation proof, and the bank verifies it and opens the account.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_028_name_screening_and_risk

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_028_name_screening_and_risk",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022:df_011_kyc_interface_name_screening_risk_engine"
  ],
  "source_location": "Designing a framework.pdf · page 10 · Name screening, risk assessment, enhanced due diligence",
  "quote_or_summary": "After identity data is exchanged and cryptographically verified, name screening checks blacklists, the risk engine classifies customers, and further checks or documents can be requested through the secure channel.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_029_ongoing_monitoring

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_029_ongoing_monitoring",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022:df_012_ongoing_monitoring_via_secure_channel"
  ],
  "source_location": "Designing a framework.pdf · page 11 · Ongoing monitoring",
  "quote_or_summary": "The paper explains ongoing monitoring through risk-engine checks, expiration-date checks, proof refresh requests, and requests for updated credentials or additional documents over the secure channel.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_030_record_keeping

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_030_record_keeping",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022:df_013_local_bank_records_with_privacy_options"
  ],
  "source_location": "Designing a framework.pdf · page 11 · Record keeping",
  "quote_or_summary": "The paper notes that SSI could let banks avoid storing personal data technically, but regulations may require local records; ZKP-oriented VCs can support tamper-proof documentation while preserving privacy where possible.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_031_evaluation_efficiency

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_031_evaluation_efficiency",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022:eval_002_framework_criteria_based_evaluation",
    "SSI_KYC_FRAMEWORK_2022:dp_005_reuse_verifiable_kyc_credentials",
    "SSI_KYC_FRAMEWORK_2022:eval_004_practical_feasibility_and_utility_assessment",
    "SSI_KYC_FRAMEWORK_2022:ok_003_fast_onboarding_pattern_for_reusable_credentials"
  ],
  "source_location": "Designing a framework.pdf · page 11 · Evaluation: Efficiency",
  "quote_or_summary": "Experts stated that reusable VCs, revocation registries, and fully digital cryptographic proofs can reduce face-to-face verification, manual processing, repeated KYC work, and periodic confirmation effort.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_032_evaluation_regulatory

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_032_evaluation_regulatory",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022:eval_002_framework_criteria_based_evaluation",
    "SSI_KYC_FRAMEWORK_2022:dp_006_bilateral_secure_disclosure",
    "SSI_KYC_FRAMEWORK_2022:eval_003_regulatory_privacy_fit_assessment"
  ],
  "source_location": "Designing a framework.pdf · page 11 · Evaluation: Regulatory compliance",
  "quote_or_summary": "The evaluation states that natural persons only use pairwise DIDs and exchange information bilaterally without ledger writes, aligning the framework with GDPR objectives such as data minimization.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_033_evaluation_decentralization

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_033_evaluation_decentralization",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022:eval_002_framework_criteria_based_evaluation",
    "SSI_KYC_FRAMEWORK_2022:dr_003_decentralization",
    "SSI_KYC_FRAMEWORK_2022:ok_002_ssi_can_decouple_identity_reuse_from_centralized_identity_providers"
  ],
  "source_location": "Designing a framework.pdf · page 11 · Evaluation: Decentralization",
  "quote_or_summary": "The evaluation states that identity-related data are stored in the customer wallet and cloud agents store only encrypted user-managed data, avoiding new central data silos.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_034_evaluation_trust

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_034_evaluation_trust",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022:eval_002_framework_criteria_based_evaluation",
    "SSI_KYC_FRAMEWORK_2022:dr_004_trust_in_reusable_kyc_documents"
  ],
  "source_location": "Designing a framework.pdf · page 12 · Evaluation: Trust",
  "quote_or_summary": "The evaluation explains that VCs, digital signatures, revocation registries, and blockchain-stored issuer signing keys let banks verify KYC documents issued by other institutions.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_035_evaluation_privacy

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_035_evaluation_privacy",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022:eval_002_framework_criteria_based_evaluation",
    "SSI_KYC_FRAMEWORK_2022:dr_005_privacy",
    "SSI_KYC_FRAMEWORK_2022:dp_006_bilateral_secure_disclosure",
    "SSI_KYC_FRAMEWORK_2022:ok_004_bilateral_vp_exchange_as_privacy_pattern"
  ],
  "source_location": "Designing a framework.pdf · page 12 · Evaluation: Privacy",
  "quote_or_summary": "The evaluation emphasizes bilateral communication, user control, selective disclosure, and data minimization as privacy benefits of SSI-based eKYC.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_036_evaluation_user_experience

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_036_evaluation_user_experience",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022:eval_002_framework_criteria_based_evaluation",
    "SSI_KYC_FRAMEWORK_2022:dr_006_user_experience",
    "SSI_KYC_FRAMEWORK_2022:df_014_backup_recovery_and_support"
  ],
  "source_location": "Designing a framework.pdf · page 12 · Evaluation: User experience",
  "quote_or_summary": "The evaluation states that onboarding can be carried out on a smartphone through simple steps such as scanning QR codes and accepting invitation links and proof requests, while backup and recovery remain a challenge.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_037_dp1_public_data_only

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_037_dp1_public_data_only",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022:dp_001_use_blockchain_only_for_public_data",
    "SSI_KYC_FRAMEWORK_2022:df_008_public_data_registry_on_ledger",
    "SSI_KYC_FRAMEWORK_2022:eval_003_regulatory_privacy_fit_assessment",
    "SSI_KYC_FRAMEWORK_2022:ok_001_blockchain_role_in_ssi_should_be_restrictive"
  ],
  "source_location": "Designing a framework.pdf · page 12 · Discussion: Design principle 1",
  "quote_or_summary": "The first nascent design principle states that blockchain should be used only for public data, such as VC issuer information and revocation registries, not natural persons’ DIDs, VCs, credential hashes, or personal data.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_038_dp2_multiple_ledgers

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_038_dp2_multiple_ledgers",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022:dp_002_anticipate_ecosystem_of_various_ledgers",
    "SSI_KYC_FRAMEWORK_2022:df_015_universal_resolvers_and_cross_ledger_interoperability",
    "SSI_KYC_FRAMEWORK_2022:ok_005_multi_ledger_ssi_interoperability_challenge"
  ],
  "source_location": "Designing a framework.pdf · page 13 · Discussion: Design principle 2",
  "quote_or_summary": "The second nascent design principle states that designers should anticipate an SSI ecosystem with multiple distributed ledgers and design for cross-ledger interoperability through standards and universal resolvers.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_039_dp3_decentralization_at_edge

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_039_dp3_decentralization_at_edge",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022:dp_003_enable_decentralization_at_the_edge",
    "SSI_KYC_FRAMEWORK_2022:df_014_backup_recovery_and_support",
    "SSI_KYC_FRAMEWORK_2022:ok_004_bilateral_vp_exchange_as_privacy_pattern"
  ],
  "source_location": "Designing a framework.pdf · page 13 · Discussion: Design principle 3",
  "quote_or_summary": "The third nascent design principle states that SSI architectures must enable decentralization at the edge by letting users store VCs on infrastructure of their choice, with cloud storage only if encrypted and user-controlled.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_040_adoption_and_governance_challenges

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_040_adoption_and_governance_challenges",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022:eval_004_practical_feasibility_and_utility_assessment",
    "SSI_KYC_FRAMEWORK_2022:ok_005_multi_ledger_ssi_interoperability_challenge"
  ],
  "source_location": "Designing a framework.pdf · page 13 · Discussion / Crossing the chasm",
  "quote_or_summary": "The authors describe SSI adoption as a chicken-and-egg problem requiring credential issuers, user adoption, standards, bank cooperation, and governance frameworks.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_041_conclusion_contributions

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_041_conclusion_contributions",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022:ok_001_blockchain_role_in_ssi_should_be_restrictive",
    "SSI_KYC_FRAMEWORK_2022:art_001_ssi_based_ekyc_framework"
  ],
  "source_location": "Designing a framework.pdf · page 14 · Conclusion",
  "quote_or_summary": "The conclusion states that the framework improves KYC through end-to-end digital blockchain-based SSI and that blockchain’s role should be restricted to public information to avoid privacy and scalability issues.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SSI_KYC_FRAMEWORK_2022:ev_042_limitations_real_world_eval

```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ev_042_limitations_real_world_eval",
  "supports": [
    "SSI_KYC_FRAMEWORK_2022"
  ],
  "source_location": "Designing a framework.pdf · page 14 · Conclusion / limitations",
  "quote_or_summary": "The authors acknowledge that the framework has not yet been used in practice and lacks evaluation in a real-world setting.",
  "evidence_type": "paraphrase"
}
```
