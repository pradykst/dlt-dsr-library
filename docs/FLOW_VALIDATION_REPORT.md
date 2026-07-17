# OKF Flow Validation Report

Schema: `okf-dsr-v1`

This report is generated deterministically from canonical OKF bundles and the repository's explicit legacy aliases. Legacy data is comparison-only and never changes canonical DSR facts. Source Figure validation is reported separately by `okf:validate:source-views`; this report checks Recommended Flow, Pathway Matrix, and Full Relations inputs.

## Summary

- Papers: 9
- Passed: 0
- Manual review: 9
- Failed: 0
- Structural errors: 0
- Warnings: 19

**Outcome:** All canonical graph and Workbench projection structural checks passed. Manual-review status reflects non-blocking recommendation or legacy-comparison gaps.

| Paper | Status | Graph | Recommended paths | Stored R->P->F matrix chains | Source reference | Legacy |
| --- | --- | ---: | ---: | ---: | --- | --- |
| BLOCKCHAIN_IOT_SDPS_2019 | manual review | 23 nodes / 32 edges | 3 | 12 | Figure 3 (unreviewed) | 2 node / 0 edge matches |
| HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023 | manual review | 33 nodes / 53 edges | 1 | 21 | Figure 3 (unreviewed) | 2 node / 0 edge matches |
| INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024 | manual review | 67 nodes / 105 edges | 3 | 73 | Figure 2 (unreviewed) | Not available |
| NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021 | manual review | 34 nodes / 51 edges | 1 | 23 | Figure 3 (unreviewed) | Not available |
| NIL_NFT_MARKETPLACE_2026 | manual review | 31 nodes / 62 edges | 2 | 32 | Figure 1 (unreviewed) | 1 node / 0 edge matches |
| PEER_REVIEW_TOKEN_INCENTIVES_2025 | manual review | 37 nodes / 68 edges | 4 | 14 | Figure 2 (unreviewed) | 0 node / 0 edge matches |
| SHORT_END_STICK_2025 | manual review | 17 nodes / 23 edges | 3 | 12 | Figures 1 and 2 (unreviewed) | 2 node / 1 edge matches |
| SSI_KYC_FRAMEWORK_2022 | manual review | 41 nodes / 85 edges | 1 | 46 | Figure 4 (unreviewed) | 1 node / 0 edge matches |
| TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024 | manual review | 55 nodes / 95 edges | 3 | 106 | Figures 3 and 6 (unreviewed) | 0 node / 0 edge matches |

## Paper results

### BLOCKCHAIN_IOT_SDPS_2019

- Graph: `library/okf/papers/blockchain-iot-sdps-2019/graph.json`
- Status: **manual review**
- Stored Workbench source: graph_json
- Stored relation checks: 12 recommended-flow, 6 R->P->F matrix, 32 full-relations

- Source reference: Figure 3, page 13 - Design Requirements, Principles, and Features.
- Semantic validation: unreviewed

Recommended paths:

- Path 1: `BLOCKCHAIN_IOT_SDPS_2019:prob_001_iot_sensor_data_protection_problem` -> `BLOCKCHAIN_IOT_SDPS_2019:dr1_tamper_resistant_pipeline` -> `BLOCKCHAIN_IOT_SDPS_2019:dp1_source_to_sink_certification` -> `BLOCKCHAIN_IOT_SDPS_2019:df1_sensor_data_collection` -> `BLOCKCHAIN_IOT_SDPS_2019:art1_sdps_general_architecture`
  - Stored relations: `BLOCKCHAIN_IOT_SDPS_2019:rel_004`, `BLOCKCHAIN_IOT_SDPS_2019:rel_008`, `BLOCKCHAIN_IOT_SDPS_2019:rel_013`, `BLOCKCHAIN_IOT_SDPS_2019:rel_022`
- Path 2: `BLOCKCHAIN_IOT_SDPS_2019:prob_001_iot_sensor_data_protection_problem` -> `BLOCKCHAIN_IOT_SDPS_2019:dr2_privacy_preserving_pipeline` -> `BLOCKCHAIN_IOT_SDPS_2019:dp3_data_owner_controlled_disclosure` -> `BLOCKCHAIN_IOT_SDPS_2019:df7_access_right_management` -> `BLOCKCHAIN_IOT_SDPS_2019:art1_sdps_general_architecture`
  - Stored relations: `BLOCKCHAIN_IOT_SDPS_2019:rel_005`, `BLOCKCHAIN_IOT_SDPS_2019:rel_010`, `BLOCKCHAIN_IOT_SDPS_2019:rel_017`, `BLOCKCHAIN_IOT_SDPS_2019:rel_028`
- Path 3: `BLOCKCHAIN_IOT_SDPS_2019:prob_001_iot_sensor_data_protection_problem` -> `BLOCKCHAIN_IOT_SDPS_2019:dr3_large_data_volume_throughput` -> `BLOCKCHAIN_IOT_SDPS_2019:dp4_linearly_scalable_architecture` -> `BLOCKCHAIN_IOT_SDPS_2019:df6_independent_verification_storage` -> `BLOCKCHAIN_IOT_SDPS_2019:art1_sdps_general_architecture`
  - Stored relations: `BLOCKCHAIN_IOT_SDPS_2019:rel_006`, `BLOCKCHAIN_IOT_SDPS_2019:rel_011`, `BLOCKCHAIN_IOT_SDPS_2019:rel_021`, `BLOCKCHAIN_IOT_SDPS_2019:rel_027`

Issues:

- **WARNING LEGACY_ALIAS_UNRESOLVED:** 13 legacy node alias(es) are unresolved.
  - IDs: `artifact-certificar`, `eval-iot-field-test`, `feature-cross-validation-data`, `feature-data-signature`, `feature-hash-storage`, `feature-raw-data-offchain`, `principle-cross-validation`, `principle-linearly-scalable-certification`, `principle-privacy-preserving-provision`, `principle-sensor-certification`, `problem-iot-sensor-integrity`, `req-economic-feasibility`, `req-privacy`
- **WARNING SOURCE_REFERENCE_UNREVIEWED:** Figure 3 is recorded but still requires manual semantic review.

Legacy comparison:

- Source: `data/knowledge-base.ts` (paper-iot-sdps)
- Matched node mappings: 2
  - `req-scalability -> BLOCKCHAIN_IOT_SDPS_2019:dr3_large_data_volume_throughput (explicit_alias)`
  - `req-tamper-resistance -> BLOCKCHAIN_IOT_SDPS_2019:dr1_tamper_resistant_pipeline (explicit_alias)`
- Matched edges: 0
- Unresolved aliases / missing mapped OKF nodes: 13
  - `artifact-certificar`
  - `eval-iot-field-test`
  - `feature-cross-validation-data`
  - `feature-data-signature`
  - `feature-hash-storage`
  - `feature-raw-data-offchain`
  - `principle-cross-validation`
  - `principle-linearly-scalable-certification`
  - `principle-privacy-preserving-provision`
  - `principle-sensor-certification`
  - `problem-iot-sensor-integrity`
  - `req-economic-feasibility`
  - `req-privacy`
- Ambiguous aliases: 0
- Predicate mismatches: 0
- Missing OKF edges: 0
- Extra OKF edges among mapped nodes: 0

### HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023

- Graph: `library/okf/papers/hie-consent-self-management-blockchain-2023/graph.json`
- Status: **manual review**
- Stored Workbench source: graph_json
- Stored relation checks: 4 recommended-flow, 2 R->P->F matrix, 53 full-relations

- Source reference: Figure 3, page 8 - Design requirements, principles, and features.
- Semantic validation: unreviewed

Recommended paths:

- Path 1: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:prob_001_fragmented_hie_consent_self_management_problem` -> `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_002_patient_self_management` -> `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dp_002_patient_only_changes_consent_status` -> `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_008_patient_facing_consent_dapp` -> `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:art_002_blockchain_consent_self_management_dapp`
  - Stored relations: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_004`, `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_014`, `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_025`, `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_043`

Issues:

- **WARNING LEGACY_ALIAS_UNRESOLVED:** 16 legacy node alias(es) are unresolved.
  - IDs: `eval-consent-survey-technical`, `feature-encryption`, `feature-immutable-ledger`, `feature-permissioned-consent-chain`, `feature-smart-contract-consent`, `feature-wallet-login`, `principle-auditable-consent-history`, `principle-authorized-consent-visibility`, `principle-consent-change-propagation`, `principle-cross-hie-communication`, `principle-patient-controlled-consent`, `problem-fragmented-consent`, `req-compliance`, `req-interoperability`, `req-privacy`, `req-trust`
- **WARNING SOURCE_REFERENCE_UNREVIEWED:** Figure 3 is recorded but still requires manual semantic review.

Legacy comparison:

- Source: `data/knowledge-base.ts` (paper-consent-hie)
- Matched node mappings: 2
  - `artifact-consent-dapp -> HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:art_002_blockchain_consent_self_management_dapp (explicit_alias)`
  - `req-self-management -> HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_002_patient_self_management (explicit_alias)`
- Matched edges: 0
- Unresolved aliases / missing mapped OKF nodes: 16
  - `eval-consent-survey-technical`
  - `feature-encryption`
  - `feature-immutable-ledger`
  - `feature-permissioned-consent-chain`
  - `feature-smart-contract-consent`
  - `feature-wallet-login`
  - `principle-auditable-consent-history`
  - `principle-authorized-consent-visibility`
  - `principle-consent-change-propagation`
  - `principle-cross-hie-communication`
  - `principle-patient-controlled-consent`
  - `problem-fragmented-consent`
  - `req-compliance`
  - `req-interoperability`
  - `req-privacy`
  - `req-trust`
- Ambiguous aliases: 0
- Predicate mismatches: 0
- Missing OKF edges: 0
- Extra OKF edges among mapped nodes: 0

### INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024

- Graph: `library/okf/papers/integrated-blockchain-isdm-framework-2024/graph.json`
- Status: **manual review**
- Stored Workbench source: graph_json
- Stored relation checks: 9 recommended-flow, 6 R->P->F matrix, 105 full-relations

- Source reference: Figure 2, page 7 - Framework as a backbone providing constituent method fragments classified under development process, modeling, and role aspects.
- Semantic validation: unreviewed

Recommended paths:

- Path 1: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_001_comprehensiveness` -> `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dp_001_organize_isdm_by_process_roles_models` -> `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_027_model_use_case_prototype_requirements` -> `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:art_001_integrated_blockchain_isdm_framework`
  - Stored relations: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_017`, `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_055`, `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_091`
- Path 2: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_004_security_and_privacy` -> `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dp_004_design_blockchain_specific_protocols_and_contract_details` -> `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_014_design_security` -> `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:art_001_integrated_blockchain_isdm_framework`
  - Stored relations: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_023`, `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_042`, `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_078`
- Path 3: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_008_maintainability` -> `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dp_006_plan_operation_maintenance_and_retirement` -> `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_024_monitor_nodes` -> `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:art_001_integrated_blockchain_isdm_framework`
  - Stored relations: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_027`, `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_052`, `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_088`

Issues:

- **WARNING LEGACY_SOURCE_UNAVAILABLE:** No deterministic legacy static-flow source is mapped for this paper.
- **WARNING SOURCE_REFERENCE_UNREVIEWED:** Figure 2 is recorded but still requires manual semantic review.

Legacy comparison:

- No deterministic repository legacy source is mapped.

### NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021

- Graph: `library/okf/papers/newsvendor-forecasting-smart-contract-2021/graph.json`
- Status: **manual review**
- Stored Workbench source: graph_json
- Stored relation checks: 5 recommended-flow, 2 R->P->F matrix, 51 full-relations

- Source reference: Figure 3, page 8 - Graphical description of the proposed solution.
- Semantic validation: unreviewed

Recommended paths:

- Path 1: `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:prob_001_forecast_incentive_trust_problem` -> `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dr_003_make_outcome_contingent_payment_enforceable` -> `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dp_001_decentralized_escrow_for_payments` -> `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_002_funded_smart_contract_escrow` -> `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:art_001_blockchain_forecasting_smart_contract` -> `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:eval_002_design_principle_functionality_evaluation`
  - Stored relations: `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:rel_005`, `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:rel_017`, `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:rel_023`, `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:rel_039`, `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:rel_050`

Issues:

- **WARNING LEGACY_SOURCE_UNAVAILABLE:** No deterministic legacy static-flow source is mapped for this paper.
- **WARNING SOURCE_REFERENCE_UNREVIEWED:** Figure 3 is recorded but still requires manual semantic review.

Legacy comparison:

- No deterministic repository legacy source is mapped.

### NIL_NFT_MARKETPLACE_2026

- Graph: `library/okf/papers/nil-nft-marketplace-2026/graph.json`
- Status: **manual review**
- Stored Workbench source: graph_json
- Stored relation checks: 8 recommended-flow, 4 R->P->F matrix, 62 full-relations

- Source reference: Figure 1, page 5 - Design requirements (DR), principles (DP), and features (DF).
- Semantic validation: unreviewed

Recommended paths:

- Path 1: `NIL_NFT_MARKETPLACE_2026:prob_001_nil_fairness_inclusiveness_problem` -> `NIL_NFT_MARKETPLACE_2026:dr_001_inclusiveness` -> `NIL_NFT_MARKETPLACE_2026:dp_001_plausible_events` -> `NIL_NFT_MARKETPLACE_2026:df_001_random_minting` -> `NIL_NFT_MARKETPLACE_2026:art_001_fair_inclusive_nil_nft_marketplace`
  - Stored relations: `NIL_NFT_MARKETPLACE_2026:rel_002`, `NIL_NFT_MARKETPLACE_2026:rel_012`, `NIL_NFT_MARKETPLACE_2026:rel_017`, `NIL_NFT_MARKETPLACE_2026:rel_031`
- Path 2: `NIL_NFT_MARKETPLACE_2026:prob_001_nil_fairness_inclusiveness_problem` -> `NIL_NFT_MARKETPLACE_2026:dr_002_meritocratic_allocation` -> `NIL_NFT_MARKETPLACE_2026:dp_002_market_royalties` -> `NIL_NFT_MARKETPLACE_2026:df_002_market_exchanges` -> `NIL_NFT_MARKETPLACE_2026:art_001_fair_inclusive_nil_nft_marketplace`
  - Stored relations: `NIL_NFT_MARKETPLACE_2026:rel_004`, `NIL_NFT_MARKETPLACE_2026:rel_013`, `NIL_NFT_MARKETPLACE_2026:rel_021`, `NIL_NFT_MARKETPLACE_2026:rel_033`

Issues:

- **WARNING LEGACY_ALIAS_AMBIGUOUS:** 1 legacy node alias(es) are ambiguous.
  - IDs: `feature-nft-collectibles`
- **WARNING LEGACY_ALIAS_UNRESOLVED:** 11 legacy node alias(es) are unresolved.
  - IDs: `artifact-nil-marketplace`, `eval-interviews-athletes`, `feature-secondary-market`, `feature-smart-contract-royalties`, `principle-blockchain-market-infrastructure`, `principle-market-royalties`, `principle-random-primary-market`, `problem-fair-inclusive-nil`, `req-inclusiveness`, `req-market-soundness`, `req-meritocratic-fairness`
- **WARNING SOURCE_REFERENCE_UNREVIEWED:** Figure 1 is recorded but still requires manual semantic review.

Legacy comparison:

- Source: `data/knowledge-base.ts` (paper-nil-marketplace)
- Matched node mappings: 1
  - `feature-random-minting -> NIL_NFT_MARKETPLACE_2026:df_001_random_minting (explicit_alias)`
- Matched edges: 0
- Unresolved aliases / missing mapped OKF nodes: 11
  - `artifact-nil-marketplace`
  - `eval-interviews-athletes`
  - `feature-secondary-market`
  - `feature-smart-contract-royalties`
  - `principle-blockchain-market-infrastructure`
  - `principle-market-royalties`
  - `principle-random-primary-market`
  - `problem-fair-inclusive-nil`
  - `req-inclusiveness`
  - `req-market-soundness`
  - `req-meritocratic-fairness`
- Ambiguous aliases: 1
  - `feature-nft-collectibles`
- Predicate mismatches: 0
- Missing OKF edges: 0
- Extra OKF edges among mapped nodes: 0

### PEER_REVIEW_TOKEN_INCENTIVES_2025

- Graph: `library/okf/papers/peer-review-token-incentives-2025/graph.json`
- Status: **manual review**
- Stored Workbench source: graph_json
- Stored relation checks: 7 recommended-flow, 4 R->P->F matrix, 68 full-relations

- Source reference: Figure 2, page 6 - Relationships between design principles and features.
- Semantic validation: unreviewed

Recommended paths:

- Path 1: `PEER_REVIEW_TOKEN_INCENTIVES_2025:dp_001_incentives` -> `PEER_REVIEW_TOKEN_INCENTIVES_2025:df_001_tokenization` -> `PEER_REVIEW_TOKEN_INCENTIVES_2025:art_001_token_based_peer_review_incentive_system`
  - Stored relations: `PEER_REVIEW_TOKEN_INCENTIVES_2025:rel_035`, `PEER_REVIEW_TOKEN_INCENTIVES_2025:rel_044`
- Path 2: `PEER_REVIEW_TOKEN_INCENTIVES_2025:dp_002_flexibility` -> `PEER_REVIEW_TOKEN_INCENTIVES_2025:df_001_tokenization` -> `PEER_REVIEW_TOKEN_INCENTIVES_2025:art_001_token_based_peer_review_incentive_system`
  - Stored relations: `PEER_REVIEW_TOKEN_INCENTIVES_2025:rel_038`, `PEER_REVIEW_TOKEN_INCENTIVES_2025:rel_044`
- Path 3: `PEER_REVIEW_TOKEN_INCENTIVES_2025:dp_003_trust` -> `PEER_REVIEW_TOKEN_INCENTIVES_2025:df_002_immutability` -> `PEER_REVIEW_TOKEN_INCENTIVES_2025:art_003_polygon_token_smart_contracts`
  - Stored relations: `PEER_REVIEW_TOKEN_INCENTIVES_2025:rel_040`, `PEER_REVIEW_TOKEN_INCENTIVES_2025:rel_046`
- Path 4: `PEER_REVIEW_TOKEN_INCENTIVES_2025:dp_003_trust` -> `PEER_REVIEW_TOKEN_INCENTIVES_2025:df_003_decentralization` -> `PEER_REVIEW_TOKEN_INCENTIVES_2025:art_003_polygon_token_smart_contracts`
  - Stored relations: `PEER_REVIEW_TOKEN_INCENTIVES_2025:rel_041`, `PEER_REVIEW_TOKEN_INCENTIVES_2025:rel_047`

Issues:

- **WARNING LEGACY_ALIAS_UNRESOLVED:** 13 legacy node alias(es) are unresolved.
  - IDs: `artifact-peer-review-platform`, `eval-peer-review-cost-survey`, `feature-batch-reward-processing`, `feature-fungible-review-tokens`, `feature-offchain-review-data`, `feature-sbt`, `principle-flexible-token-policy`, `principle-reviewer-trust-preservation`, `principle-token-incentives`, `problem-reviewer-shortage`, `req-flexibility`, `req-incentives`, `req-trust`
- **WARNING SOURCE_REFERENCE_UNREVIEWED:** Figure 2 is recorded but still requires manual semantic review.

Legacy comparison:

- Source: `data/knowledge-base.ts` (paper-peer-review-token)
- Matched node mappings: 0
- Matched edges: 0
- Unresolved aliases / missing mapped OKF nodes: 13
  - `artifact-peer-review-platform`
  - `eval-peer-review-cost-survey`
  - `feature-batch-reward-processing`
  - `feature-fungible-review-tokens`
  - `feature-offchain-review-data`
  - `feature-sbt`
  - `principle-flexible-token-policy`
  - `principle-reviewer-trust-preservation`
  - `principle-token-incentives`
  - `problem-reviewer-shortage`
  - `req-flexibility`
  - `req-incentives`
  - `req-trust`
- Ambiguous aliases: 0
- Predicate mismatches: 0
- Missing OKF edges: 0
- Extra OKF edges among mapped nodes: 0

### SHORT_END_STICK_2025

- Graph: `library/okf/papers/short-end-stick-2025/graph.json`
- Status: **manual review**
- Stored Workbench source: graph_json
- Stored relation checks: 11 recommended-flow, 6 R->P->F matrix, 26 full-relations

- Source reference: Figures 1 and 2, page 9 - Summary of the Design Principles; System Architecture with Design Principles.
- Semantic validation: unreviewed

Recommended paths:

- Path 1: `SHORT_END_STICK_2025:problem_two_sided_opportunism` -> `SHORT_END_STICK_2025:dr_001_prevent_information_manipulation` -> `SHORT_END_STICK_2025:dp_001_manipulation_resistant_private_storage_with_integrity_proof` -> `SHORT_END_STICK_2025:df_002_public_hash_integrity_proof` -> `SHORT_END_STICK_2025:artifact_001_hyperledger_fabric_two_sided_opportunism_solution`
  - Stored relations: `SHORT_END_STICK_2025:rel_001`, `SHORT_END_STICK_2025:rel_003`, `SHORT_END_STICK_2025:rel_010`, `SHORT_END_STICK_2025:rel_018`
- Path 2: `SHORT_END_STICK_2025:problem_two_sided_opportunism` -> `SHORT_END_STICK_2025:dr_002_prevent_information_poaching` -> `SHORT_END_STICK_2025:dp_002_nonreversible_reliable_independent_computation` -> `SHORT_END_STICK_2025:df_004_nonreversible_aggregation_function` -> `SHORT_END_STICK_2025:artifact_001_hyperledger_fabric_two_sided_opportunism_solution`
  - Stored relations: `SHORT_END_STICK_2025:rel_002`, `SHORT_END_STICK_2025:rel_006`, `SHORT_END_STICK_2025:rel_012`, `SHORT_END_STICK_2025:rel_020`
- Path 3: `SHORT_END_STICK_2025:problem_two_sided_opportunism` -> `SHORT_END_STICK_2025:dr_001_prevent_information_manipulation` -> `SHORT_END_STICK_2025:dp_003_joint_approval_for_computation_mechanism_changes` -> `SHORT_END_STICK_2025:df_005_joint_governance_policy` -> `SHORT_END_STICK_2025:artifact_001_hyperledger_fabric_two_sided_opportunism_solution`
  - Stored relations: `SHORT_END_STICK_2025:rel_001`, `SHORT_END_STICK_2025:rel_007`, `SHORT_END_STICK_2025:rel_013`, `SHORT_END_STICK_2025:rel_021`

Issues:

- **WARNING LEGACY_ALIAS_UNRESOLVED:** 10 legacy node alias(es) are unresolved.
  - IDs: `artifact-confidential-sharing`, `eval-opportunism-survey-interviews`, `feature-joint-governance-rules`, `feature-private-data-collections`, `feature-smart-contract-processing`, `principle-confidential-processing`, `principle-joint-rule-governance`, `principle-verifiable-output`, `req-confidentiality`, `req-trust`
- **WARNING SOURCE_REFERENCE_UNREVIEWED:** Figures 1 and 2 is recorded but still requires manual semantic review.

Legacy comparison:

- Source: `data/knowledge-base.ts` (paper-opportunism)
- Matched node mappings: 2
  - `problem-two-sided-opportunism -> SHORT_END_STICK_2025:problem_two_sided_opportunism (exact_id)`
  - `req-verifiable-truthfulness -> SHORT_END_STICK_2025:dr_001_prevent_information_manipulation (explicit_alias)`
- Matched edges: 1
  - `problem-two-sided-opportunism --motivates--> req-verifiable-truthfulness`
- Unresolved aliases / missing mapped OKF nodes: 10
  - `artifact-confidential-sharing`
  - `eval-opportunism-survey-interviews`
  - `feature-joint-governance-rules`
  - `feature-private-data-collections`
  - `feature-smart-contract-processing`
  - `principle-confidential-processing`
  - `principle-joint-rule-governance`
  - `principle-verifiable-output`
  - `req-confidentiality`
  - `req-trust`
- Ambiguous aliases: 0
- Predicate mismatches: 0
- Missing OKF edges: 0
- Extra OKF edges among mapped nodes: 0

### SSI_KYC_FRAMEWORK_2022

- Graph: `library/okf/papers/ssi-kyc-framework-2022/graph.json`
- Status: **manual review**
- Stored Workbench source: graph_json
- Stored relation checks: 5 recommended-flow, 2 R->P->F matrix, 85 full-relations

- Source reference: Figure 4, page 8 - SSI-based KYC architecture.
- Semantic validation: unreviewed

Recommended paths:

- Path 1: `SSI_KYC_FRAMEWORK_2022:prob_001_costly_inefficient_privacy_sensitive_kyc` -> `SSI_KYC_FRAMEWORK_2022:dr_004_trust_in_reusable_kyc_documents` -> `SSI_KYC_FRAMEWORK_2022:dp_005_reuse_verifiable_kyc_credentials` -> `SSI_KYC_FRAMEWORK_2022:df_003_verifiable_credentials_and_presentations` -> `SSI_KYC_FRAMEWORK_2022:art_003_fast_onboarding_process` -> `SSI_KYC_FRAMEWORK_2022:eval_002_framework_criteria_based_evaluation`
  - Stored relations: `SSI_KYC_FRAMEWORK_2022:rel_011`, `SSI_KYC_FRAMEWORK_2022:rel_025`, `SSI_KYC_FRAMEWORK_2022:rel_047`, `SSI_KYC_FRAMEWORK_2022:rel_067`, `SSI_KYC_FRAMEWORK_2022:rel_083`

Issues:

- **WARNING LEGACY_ALIAS_UNRESOLVED:** 8 legacy node alias(es) are unresolved.
  - IDs: `artifact-ssi-ekyc`, `eval-ssi-expert-interviews`, `feature-wallet-login`, `principle-reusable-credentials`, `problem-repetitive-kyc`, `req-interoperability`, `req-privacy`, `req-self-management`
- **WARNING SOURCE_REFERENCE_UNREVIEWED:** Figure 4 is recorded but still requires manual semantic review.

Legacy comparison:

- Source: `data/knowledge-base.ts` (paper-ssi-kyc)
- Matched node mappings: 1
  - `req-compliance -> SSI_KYC_FRAMEWORK_2022:dr_002_regulatory_compliance (explicit_alias)`
- Matched edges: 0
- Unresolved aliases / missing mapped OKF nodes: 8
  - `artifact-ssi-ekyc`
  - `eval-ssi-expert-interviews`
  - `feature-wallet-login`
  - `principle-reusable-credentials`
  - `problem-repetitive-kyc`
  - `req-interoperability`
  - `req-privacy`
  - `req-self-management`
- Ambiguous aliases: 0
- Predicate mismatches: 0
- Missing OKF edges: 0
- Extra OKF edges among mapped nodes: 0

### TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024

- Graph: `library/okf/papers/trust-capacity-exchange-blockchain-2024/graph.json`
- Status: **manual review**
- Stored Workbench source: graph_json
- Stored relation checks: 9 recommended-flow, 6 R->P->F matrix, 95 full-relations

- Source reference: Figures 3 and 6 - Formulation and categorization of meta-requirements and design principles; design features.
- Semantic validation: unreviewed

Recommended paths:

- Path 1: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_001_creation_and_management_of_tender` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_001_signaling_tender_information` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_001_creating_a_tender` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:art_001_blockchain_based_capacity_exchange_prototype`
  - Stored relations: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_023`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_054`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_074`
- Path 2: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_006_intermediate_connection` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_003_authority_and_fairness` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_005_ensuring_authorized_access` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:art_001_blockchain_based_capacity_exchange_prototype`
  - Stored relations: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_033`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_060`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_078`
- Path 3: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_011_serious_rating` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_006_reputation_mechanism` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_013_creating_individual_assessment` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:art_001_blockchain_based_capacity_exchange_prototype`
  - Stored relations: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_050`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_071`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_086`

Issues:

- **WARNING LEGACY_ALIAS_UNRESOLVED:** 8 legacy node alias(es) are unresolved.
  - IDs: `artifact-capacity-exchange`, `eval-trust-experiments`, `feature-immutable-ledger`, `principle-reputation-screening`, `principle-trust-signaling`, `problem-trust-capacity`, `req-traceability`, `req-trust`
- **WARNING SOURCE_REFERENCE_UNREVIEWED:** Figures 3 and 6 is recorded but still requires manual semantic review.

Legacy comparison:

- Source: `data/knowledge-base.ts` (paper-trust-capacity)
- Matched node mappings: 0
- Matched edges: 0
- Unresolved aliases / missing mapped OKF nodes: 8
  - `artifact-capacity-exchange`
  - `eval-trust-experiments`
  - `feature-immutable-ledger`
  - `principle-reputation-screening`
  - `principle-trust-signaling`
  - `problem-trust-capacity`
  - `req-traceability`
  - `req-trust`
- Ambiguous aliases: 0
- Predicate mismatches: 0
- Missing OKF edges: 0
- Extra OKF edges among mapped nodes: 0

## Interpretation rules

- `graph.json` edges must identify exact stored OKF relations; the validator never infers or repairs edges.
- Recommended paths are ordered edge sequences. Every adjacent pair must have an exact graph edge and stored relation.
- Pathway Matrix Requirement -> Principle -> Feature cells may use stored graph/relation edges only.
- Legacy matches require exact IDs or terms explicitly recorded in `aliases.yaml`; fuzzy matches are deliberately excluded.
- Source Figure, Recommended Flow, and Full Relations share one canonical projector; deterministic ELK layout and direct border-to-border edges do not alter graph semantics.
- Legacy differences are manual-review signals, not instructions to rewrite canonical OKF facts.
