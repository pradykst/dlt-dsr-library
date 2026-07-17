# OKF Source View Audit

This report inventories formal figure/table references and optional canonical `source_views`. Structural validity is not semantic human verification. Legacy CSV data is a comparison source only and is never promoted to canonical truth by this audit.

## Summary

- Runtime papers: 9
- Canonical source views: 8
- Structurally valid source views: 8
- Papers with a figure/table reference but no exact source view: 3
- Papers requiring manual transcription or semantic review: 9
- Existing canonical relations referenced by source views: 96
- Source-view relations marked explicit-in-artifact: 96
- Canonical relations synthesized or added by projection: 0
- Parser/root-level issues: 0

No source view is generated from recommended paths, all relations, PDF proximity, or legacy CSV. A paper without a complete curated mapping exposes Recommended Flow and Full Relations only.

## Per-paper inventory

| Paper ID | Referenced sources | Reference gaps | Source views | Nodes by layer | Edges | Provenance | Structural result | Semantic state | Manual work |
|---|---|---:|---:|---|---:|---|---|---|---|
| BLOCKCHAIN_IOT_SDPS_2019 | Figure 1; Figure 3; Figure 3, page 13; Figure 4; Figure 5; Table 1; Table 2; Table 4; Table 5; Table 6 | 8 | 1 | Design Feature: 9; Design Principle: 4; Design Requirement: 4 | 14 | explicit-in-artifact: 14 | 1/1 valid | unreviewed: 1 | Required |
| HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023 | Figure 1; Figure 3; Figure 3, page 8; Figure 4; Figures 5-8; Table 4 | 4 | 1 | Design Feature: 5; Design Principle: 5; Design Requirement: 5 | 13 | explicit-in-artifact: 13 | 1/1 valid | unreviewed: 1 | Required |
| INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024 | Figure 2, page 7 | 1 | 0 | None | 0 | None | 0/0 valid | None | Required |
| NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021 | Figure 3, page 8 | 1 | 0 | None | 0 | None | 0/0 valid | None | Required |
| NIL_NFT_MARKETPLACE_2026 | Figure 1; Figure 1, page 5; Figure 2; Figure 3; Figure 4; Table 1; Table 2; Table 3; Table 4 | 7 | 1 | Design Feature: 2; Design Principle: 3; Design Requirement: 5 | 9 | explicit-in-artifact: 9 | 1/1 valid | unreviewed: 1 | Required |
| PEER_REVIEW_TOKEN_INCENTIVES_2025 | Figure 1; Figure 2; Figure 2, page 6; Figures 4 and 5; Table 2; Table 3; Table 4; Table 5; Table 6; Table 7; Table 8 | 9 | 1 | Design Feature: 3; Design Principle: 3 | 4 | explicit-in-artifact: 4 | 1/1 valid | unreviewed: 1 | Required |
| SHORT_END_STICK_2025 | Figure 1; Figure 1, page 9; Figure 2; Figure 3; Figures 1 and 2, page 9; Table 3; Table 3, page 12; Table 4; Tables 7 and 8 | 5 | 2 | Design Feature: 5; Design Principle: 6; Design Requirement: 2 | 11 | explicit-in-artifact: 11 | 2/2 valid | unreviewed: 2 | Required |
| SSI_KYC_FRAMEWORK_2022 | Figure 1; Figure 2; Figure 3; Figure 4; Figure 4, page 8; Figure 5; Figure 6 | 7 | 0 | None | 0 | None | 0/0 valid | None | Required |
| TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024 | Figure 3; Figure 3, page 5; Figure 6, page 8; Figures 3 and 6 | 1 | 2 | Design Feature: 14; Design Principle: 12; Design Requirement: 19 | 45 | explicit-in-artifact: 45 | 2/2 valid | unreviewed: 2 | Required |

## Detailed validation

### BLOCKCHAIN_IOT_SDPS_2019

- Bundle: `blockchain-iot-sdps-2019`
- Figure/table references: Figure 1; Figure 3; Figure 3, page 13; Figure 4; Figure 5; Table 1; Table 2; Table 4; Table 5; Table 6
- Per-reference coverage:
  - `Figure 1`: gap - no complete canonical source_view mapping is recorded.
  - `Figure 3`: mapped by `figure_3_design_requirements_principles_features`.
  - `Figure 3, page 13`: mapped by `figure_3_design_requirements_principles_features`.
  - `Figure 4`: gap - no complete canonical source_view mapping is recorded.
  - `Figure 5`: gap - no complete canonical source_view mapping is recorded.
  - `Table 1`: gap - no complete canonical source_view mapping is recorded.
  - `Table 2`: gap - no complete canonical source_view mapping is recorded.
  - `Table 4`: gap - no complete canonical source_view mapping is recorded.
  - `Table 5`: gap - no complete canonical source_view mapping is recorded.
  - `Table 6`: gap - no complete canonical source_view mapping is recorded.
- Root-level source-view validation issues: 0
- Source views: 1
- Missing node references: 0
- Missing edge references: 0
- Inferred/query-generated edges incorrectly included: 0
- Unresolved aliases: 0
- Source-order completeness: Complete for declared source views
- `figure_3_design_requirements_principles_features`: structurally valid; semantic status `unreviewed`.

#### Design requirements, principles, and features

- Source view ID: `figure_3_design_requirements_principles_features`
- Source: Figure 3, page 13
- Caption: Design Requirements, Principles, and Features.
- Candidate node inventory and stored source order:
  - Design Requirement: `BLOCKCHAIN_IOT_SDPS_2019:dr1_tamper_resistant_pipeline`, `BLOCKCHAIN_IOT_SDPS_2019:dr2_privacy_preserving_pipeline`, `BLOCKCHAIN_IOT_SDPS_2019:dr3_large_data_volume_throughput`, `BLOCKCHAIN_IOT_SDPS_2019:dr4_economic_feasibility`
  - Design Principle: `BLOCKCHAIN_IOT_SDPS_2019:dp1_source_to_sink_certification`, `BLOCKCHAIN_IOT_SDPS_2019:dp2_cross_validation_certification`, `BLOCKCHAIN_IOT_SDPS_2019:dp3_data_owner_controlled_disclosure`, `BLOCKCHAIN_IOT_SDPS_2019:dp4_linearly_scalable_architecture`
  - Design Feature: `BLOCKCHAIN_IOT_SDPS_2019:df1_sensor_data_collection`, `BLOCKCHAIN_IOT_SDPS_2019:df2_cross_validation_data_collection`, `BLOCKCHAIN_IOT_SDPS_2019:df3_blockchain_transaction_data_transmission`, `BLOCKCHAIN_IOT_SDPS_2019:df4_data_storage_coordination`, `BLOCKCHAIN_IOT_SDPS_2019:df5_raw_sensor_data_storage`, `BLOCKCHAIN_IOT_SDPS_2019:df6_independent_verification_storage`, `BLOCKCHAIN_IOT_SDPS_2019:df7_access_right_management`, `BLOCKCHAIN_IOT_SDPS_2019:df8_sensor_data_certification`, `BLOCKCHAIN_IOT_SDPS_2019:df9_sensor_data_output`
- Candidate edge inventory (all must already exist as canonical relations):
  - `BLOCKCHAIN_IOT_SDPS_2019:rel_008`: `BLOCKCHAIN_IOT_SDPS_2019:dr1_tamper_resistant_pipeline` -> `BLOCKCHAIN_IOT_SDPS_2019:dp1_source_to_sink_certification`; provenance `explicit-in-artifact`; evidence `BLOCKCHAIN_IOT_SDPS_2019:ev_010_dp1`; canonical relation exists: yes.
  - `BLOCKCHAIN_IOT_SDPS_2019:rel_009`: `BLOCKCHAIN_IOT_SDPS_2019:dr1_tamper_resistant_pipeline` -> `BLOCKCHAIN_IOT_SDPS_2019:dp2_cross_validation_certification`; provenance `explicit-in-artifact`; evidence `BLOCKCHAIN_IOT_SDPS_2019:ev_011_dp2`; canonical relation exists: yes.
  - `BLOCKCHAIN_IOT_SDPS_2019:rel_010`: `BLOCKCHAIN_IOT_SDPS_2019:dr2_privacy_preserving_pipeline` -> `BLOCKCHAIN_IOT_SDPS_2019:dp3_data_owner_controlled_disclosure`; provenance `explicit-in-artifact`; evidence `BLOCKCHAIN_IOT_SDPS_2019:ev_012_dp3`; canonical relation exists: yes.
  - `BLOCKCHAIN_IOT_SDPS_2019:rel_011`: `BLOCKCHAIN_IOT_SDPS_2019:dr3_large_data_volume_throughput` -> `BLOCKCHAIN_IOT_SDPS_2019:dp4_linearly_scalable_architecture`; provenance `explicit-in-artifact`; evidence `BLOCKCHAIN_IOT_SDPS_2019:ev_013_dp4`; canonical relation exists: yes.
  - `BLOCKCHAIN_IOT_SDPS_2019:rel_012`: `BLOCKCHAIN_IOT_SDPS_2019:dr4_economic_feasibility` -> `BLOCKCHAIN_IOT_SDPS_2019:dp4_linearly_scalable_architecture`; provenance `explicit-in-artifact`; evidence `BLOCKCHAIN_IOT_SDPS_2019:ev_013_dp4`; canonical relation exists: yes.
  - `BLOCKCHAIN_IOT_SDPS_2019:rel_013`: `BLOCKCHAIN_IOT_SDPS_2019:dp1_source_to_sink_certification` -> `BLOCKCHAIN_IOT_SDPS_2019:df1_sensor_data_collection`; provenance `explicit-in-artifact`; evidence `BLOCKCHAIN_IOT_SDPS_2019:ev_014_design_features_mapping`; canonical relation exists: yes.
  - `BLOCKCHAIN_IOT_SDPS_2019:rel_014`: `BLOCKCHAIN_IOT_SDPS_2019:dp1_source_to_sink_certification` -> `BLOCKCHAIN_IOT_SDPS_2019:df3_blockchain_transaction_data_transmission`; provenance `explicit-in-artifact`; evidence `BLOCKCHAIN_IOT_SDPS_2019:ev_014_design_features_mapping`; canonical relation exists: yes.
  - `BLOCKCHAIN_IOT_SDPS_2019:rel_015`: `BLOCKCHAIN_IOT_SDPS_2019:dp2_cross_validation_certification` -> `BLOCKCHAIN_IOT_SDPS_2019:df2_cross_validation_data_collection`; provenance `explicit-in-artifact`; evidence `BLOCKCHAIN_IOT_SDPS_2019:ev_014_design_features_mapping`; canonical relation exists: yes.
  - `BLOCKCHAIN_IOT_SDPS_2019:rel_016`: `BLOCKCHAIN_IOT_SDPS_2019:dp2_cross_validation_certification` -> `BLOCKCHAIN_IOT_SDPS_2019:df8_sensor_data_certification`; provenance `explicit-in-artifact`; evidence `BLOCKCHAIN_IOT_SDPS_2019:ev_014_design_features_mapping`; canonical relation exists: yes.
  - `BLOCKCHAIN_IOT_SDPS_2019:rel_017`: `BLOCKCHAIN_IOT_SDPS_2019:dp3_data_owner_controlled_disclosure` -> `BLOCKCHAIN_IOT_SDPS_2019:df7_access_right_management`; provenance `explicit-in-artifact`; evidence `BLOCKCHAIN_IOT_SDPS_2019:ev_014_design_features_mapping`; canonical relation exists: yes.
  - `BLOCKCHAIN_IOT_SDPS_2019:rel_018`: `BLOCKCHAIN_IOT_SDPS_2019:dp3_data_owner_controlled_disclosure` -> `BLOCKCHAIN_IOT_SDPS_2019:df9_sensor_data_output`; provenance `explicit-in-artifact`; evidence `BLOCKCHAIN_IOT_SDPS_2019:ev_014_design_features_mapping`; canonical relation exists: yes.
  - `BLOCKCHAIN_IOT_SDPS_2019:rel_019`: `BLOCKCHAIN_IOT_SDPS_2019:dp4_linearly_scalable_architecture` -> `BLOCKCHAIN_IOT_SDPS_2019:df4_data_storage_coordination`; provenance `explicit-in-artifact`; evidence `BLOCKCHAIN_IOT_SDPS_2019:ev_014_design_features_mapping`; canonical relation exists: yes.
  - `BLOCKCHAIN_IOT_SDPS_2019:rel_020`: `BLOCKCHAIN_IOT_SDPS_2019:dp4_linearly_scalable_architecture` -> `BLOCKCHAIN_IOT_SDPS_2019:df5_raw_sensor_data_storage`; provenance `explicit-in-artifact`; evidence `BLOCKCHAIN_IOT_SDPS_2019:ev_014_design_features_mapping`; canonical relation exists: yes.
  - `BLOCKCHAIN_IOT_SDPS_2019:rel_021`: `BLOCKCHAIN_IOT_SDPS_2019:dp4_linearly_scalable_architecture` -> `BLOCKCHAIN_IOT_SDPS_2019:df6_independent_verification_storage`; provenance `explicit-in-artifact`; evidence `BLOCKCHAIN_IOT_SDPS_2019:ev_014_design_features_mapping`; canonical relation exists: yes.
- Runtime projection adds no relations; this source view references canonical relation IDs only.
- Remaining provenance correction needed: none.
- Manual action: independently review the curated mapping before elevating its semantic validation status.

### HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023

- Bundle: `hie-consent-self-management-blockchain-2023`
- Figure/table references: Figure 1; Figure 3; Figure 3, page 8; Figure 4; Figures 5-8; Table 4
- Per-reference coverage:
  - `Figure 1`: gap - no complete canonical source_view mapping is recorded.
  - `Figure 3`: mapped by `figure_3_design_requirements_principles_features`.
  - `Figure 3, page 8`: mapped by `figure_3_design_requirements_principles_features`.
  - `Figure 4`: gap - no complete canonical source_view mapping is recorded.
  - `Figures 5-8`: gap - no complete canonical source_view mapping is recorded.
  - `Table 4`: gap - no complete canonical source_view mapping is recorded.
- Root-level source-view validation issues: 0
- Source views: 1
- Missing node references: 0
- Missing edge references: 0
- Inferred/query-generated edges incorrectly included: 0
- Unresolved aliases: 0
- Source-order completeness: Complete for declared source views
- `figure_3_design_requirements_principles_features`: structurally valid; semantic status `unreviewed`.

#### Design requirements, principles, and features

- Source view ID: `figure_3_design_requirements_principles_features`
- Source: Figure 3, page 8
- Caption: Design requirements, principles, and features.
- Candidate node inventory and stored source order:
  - Design Requirement: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_001_privacy_of_consent_status`, `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_002_patient_self_management`, `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_003_patient_and_hie_trust`, `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_004_regulatory_compliance_and_auditability`, `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_005_interoperability_across_fragmented_hies`
  - Design Principle: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dp_001_permissioned_view_of_consent_status`, `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dp_002_patient_only_changes_consent_status`, `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dp_003_auditable_consent_transaction_history`, `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dp_004_cross_hie_communication_without_central_authority`, `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dp_005_patient_shares_consent_changes_across_hies`
  - Design Feature: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_001_encryption`, `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_002_key_management`, `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_003_immutable_consent_log`, `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_004_decentralized_hie_network`, `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_005_distributed_consent_status_replication`
- Candidate edge inventory (all must already exist as canonical relations):
  - `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_013`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_001_privacy_of_consent_status` -> `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dp_001_permissioned_view_of_consent_status`; provenance `explicit-in-artifact`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_016_design_principles_mapping`; canonical relation exists: yes.
  - `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_014`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_002_patient_self_management` -> `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dp_002_patient_only_changes_consent_status`; provenance `explicit-in-artifact`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_016_design_principles_mapping`; canonical relation exists: yes.
  - `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_015`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_003_patient_and_hie_trust` -> `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dp_002_patient_only_changes_consent_status`; provenance `explicit-in-artifact`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_016_design_principles_mapping`; canonical relation exists: yes.
  - `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_016`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_003_patient_and_hie_trust` -> `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dp_003_auditable_consent_transaction_history`; provenance `explicit-in-artifact`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_016_design_principles_mapping`; canonical relation exists: yes.
  - `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_017`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_004_regulatory_compliance_and_auditability` -> `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dp_003_auditable_consent_transaction_history`; provenance `explicit-in-artifact`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_016_design_principles_mapping`; canonical relation exists: yes.
  - `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_018`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_005_interoperability_across_fragmented_hies` -> `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dp_004_cross_hie_communication_without_central_authority`; provenance `explicit-in-artifact`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_016_design_principles_mapping`; canonical relation exists: yes.
  - `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_019`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_005_interoperability_across_fragmented_hies` -> `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dp_005_patient_shares_consent_changes_across_hies`; provenance `explicit-in-artifact`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_016_design_principles_mapping`; canonical relation exists: yes.
  - `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_020`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dp_001_permissioned_view_of_consent_status` -> `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_001_encryption`; provenance `explicit-in-artifact`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_016_design_principles_mapping`; canonical relation exists: yes.
  - `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_021`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dp_001_permissioned_view_of_consent_status` -> `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_002_key_management`; provenance `explicit-in-artifact`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_016_design_principles_mapping`; canonical relation exists: yes.
  - `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_023`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dp_002_patient_only_changes_consent_status` -> `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_002_key_management`; provenance `explicit-in-artifact`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_020_wallet_encryption_key_management`; canonical relation exists: yes.
  - `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_028`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dp_003_auditable_consent_transaction_history` -> `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_003_immutable_consent_log`; provenance `explicit-in-artifact`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_021_wallet_control_and_immutability`; canonical relation exists: yes.
  - `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_030`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dp_004_cross_hie_communication_without_central_authority` -> `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_004_decentralized_hie_network`; provenance `explicit-in-artifact`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_022_distribution_and_decentralization`; canonical relation exists: yes.
  - `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_032`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dp_005_patient_shares_consent_changes_across_hies` -> `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_005_distributed_consent_status_replication`; provenance `explicit-in-artifact`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_022_distribution_and_decentralization`; canonical relation exists: yes.
- Runtime projection adds no relations; this source view references canonical relation IDs only.
- Remaining provenance correction needed: none.
- Manual action: independently review the curated mapping before elevating its semantic validation status.

### INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024

- Bundle: `integrated-blockchain-isdm-framework-2024`
- Figure/table references: Figure 2, page 7
- Per-reference coverage:
  - `Figure 2, page 7`: gap - no complete canonical source_view mapping is recorded.
- Root-level source-view validation issues: 0
- Source views: 0
- Missing node references: 0
- Missing edge references: 0
- Inferred/query-generated edges incorrectly included: 0
- Unresolved aliases: 0
- Source-order completeness: Complete for declared source views
- Result: no exact source view is currently curated.
- Manual action: inspect the source figure/table and transcribe only complete, visibly supported canonical nodes and relations; otherwise leave Source Figure unavailable.

### NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021

- Bundle: `newsvendor-forecasting-smart-contract-2021`
- Figure/table references: Figure 3, page 8
- Per-reference coverage:
  - `Figure 3, page 8`: gap - no complete canonical source_view mapping is recorded.
- Root-level source-view validation issues: 0
- Source views: 0
- Missing node references: 0
- Missing edge references: 0
- Inferred/query-generated edges incorrectly included: 0
- Unresolved aliases: 0
- Source-order completeness: Complete for declared source views
- Result: no exact source view is currently curated.
- Manual action: inspect the source figure/table and transcribe only complete, visibly supported canonical nodes and relations; otherwise leave Source Figure unavailable.

### NIL_NFT_MARKETPLACE_2026

- Bundle: `nil-nft-marketplace-2026`
- Figure/table references: Figure 1; Figure 1, page 5; Figure 2; Figure 3; Figure 4; Table 1; Table 2; Table 3; Table 4
- Per-reference coverage:
  - `Figure 1`: mapped by `figure_1_design_requirements_principles_features`.
  - `Figure 1, page 5`: mapped by `figure_1_design_requirements_principles_features`.
  - `Figure 2`: gap - no complete canonical source_view mapping is recorded.
  - `Figure 3`: gap - no complete canonical source_view mapping is recorded.
  - `Figure 4`: gap - no complete canonical source_view mapping is recorded.
  - `Table 1`: gap - no complete canonical source_view mapping is recorded.
  - `Table 2`: gap - no complete canonical source_view mapping is recorded.
  - `Table 3`: gap - no complete canonical source_view mapping is recorded.
  - `Table 4`: gap - no complete canonical source_view mapping is recorded.
- Root-level source-view validation issues: 0
- Source views: 1
- Missing node references: 0
- Missing edge references: 0
- Inferred/query-generated edges incorrectly included: 0
- Unresolved aliases: 0
- Source-order completeness: Complete for declared source views
- `figure_1_design_requirements_principles_features`: structurally valid; semantic status `unreviewed`.

#### Design requirements, principles, and features

- Source view ID: `figure_1_design_requirements_principles_features`
- Source: Figure 1, page 5
- Caption: Design requirements (DR), principles (DP), and features (DF).
- Candidate node inventory and stored source order:
  - Design Requirement: `NIL_NFT_MARKETPLACE_2026:dr_001_inclusiveness`, `NIL_NFT_MARKETPLACE_2026:dr_002_meritocratic_allocation`, `NIL_NFT_MARKETPLACE_2026:dr_003_market_thickness`, `NIL_NFT_MARKETPLACE_2026:dr_004_no_congestion`, `NIL_NFT_MARKETPLACE_2026:dr_005_market_safety`
  - Design Principle: `NIL_NFT_MARKETPLACE_2026:dp_001_plausible_events`, `NIL_NFT_MARKETPLACE_2026:dp_002_market_royalties`, `NIL_NFT_MARKETPLACE_2026:dp_003_blockchain_based_marketplace`
  - Design Feature: `NIL_NFT_MARKETPLACE_2026:df_001_random_minting`, `NIL_NFT_MARKETPLACE_2026:df_002_market_exchanges`
- Candidate edge inventory (all must already exist as canonical relations):
  - `NIL_NFT_MARKETPLACE_2026:rel_012`: `NIL_NFT_MARKETPLACE_2026:dr_001_inclusiveness` -> `NIL_NFT_MARKETPLACE_2026:dp_001_plausible_events`; provenance `explicit-in-artifact`; evidence `NIL_NFT_MARKETPLACE_2026:ev_017_plausible_events_principle`; canonical relation exists: yes.
  - `NIL_NFT_MARKETPLACE_2026:rel_013`: `NIL_NFT_MARKETPLACE_2026:dr_002_meritocratic_allocation` -> `NIL_NFT_MARKETPLACE_2026:dp_002_market_royalties`; provenance `explicit-in-artifact`; evidence `NIL_NFT_MARKETPLACE_2026:ev_018_market_royalties_principle`; canonical relation exists: yes.
  - `NIL_NFT_MARKETPLACE_2026:rel_014`: `NIL_NFT_MARKETPLACE_2026:dr_003_market_thickness` -> `NIL_NFT_MARKETPLACE_2026:dp_003_blockchain_based_marketplace`; provenance `explicit-in-artifact`; evidence `NIL_NFT_MARKETPLACE_2026:ev_019_blockchain_marketplace_principle`; canonical relation exists: yes.
  - `NIL_NFT_MARKETPLACE_2026:rel_015`: `NIL_NFT_MARKETPLACE_2026:dr_004_no_congestion` -> `NIL_NFT_MARKETPLACE_2026:dp_003_blockchain_based_marketplace`; provenance `explicit-in-artifact`; evidence `NIL_NFT_MARKETPLACE_2026:ev_019_blockchain_marketplace_principle`; canonical relation exists: yes.
  - `NIL_NFT_MARKETPLACE_2026:rel_016`: `NIL_NFT_MARKETPLACE_2026:dr_005_market_safety` -> `NIL_NFT_MARKETPLACE_2026:dp_003_blockchain_based_marketplace`; provenance `explicit-in-artifact`; evidence `NIL_NFT_MARKETPLACE_2026:ev_019_blockchain_marketplace_principle`; canonical relation exists: yes.
  - `NIL_NFT_MARKETPLACE_2026:rel_017`: `NIL_NFT_MARKETPLACE_2026:dp_001_plausible_events` -> `NIL_NFT_MARKETPLACE_2026:df_001_random_minting`; provenance `explicit-in-artifact`; evidence `NIL_NFT_MARKETPLACE_2026:ev_020_random_minting_feature`; canonical relation exists: yes.
  - `NIL_NFT_MARKETPLACE_2026:rel_021`: `NIL_NFT_MARKETPLACE_2026:dp_002_market_royalties` -> `NIL_NFT_MARKETPLACE_2026:df_002_market_exchanges`; provenance `explicit-in-artifact`; evidence `NIL_NFT_MARKETPLACE_2026:ev_021_market_exchanges_feature`; canonical relation exists: yes.
  - `NIL_NFT_MARKETPLACE_2026:rel_081`: `NIL_NFT_MARKETPLACE_2026:dp_003_blockchain_based_marketplace` -> `NIL_NFT_MARKETPLACE_2026:df_001_random_minting`; provenance `explicit-in-artifact`; evidence `NIL_NFT_MARKETPLACE_2026:ev_034_figure_1_source_mapping`; canonical relation exists: yes.
  - `NIL_NFT_MARKETPLACE_2026:rel_082`: `NIL_NFT_MARKETPLACE_2026:dp_003_blockchain_based_marketplace` -> `NIL_NFT_MARKETPLACE_2026:df_002_market_exchanges`; provenance `explicit-in-artifact`; evidence `NIL_NFT_MARKETPLACE_2026:ev_034_figure_1_source_mapping`; canonical relation exists: yes.
- Runtime projection adds no relations; this source view references canonical relation IDs only.
- Remaining provenance correction needed: none.
- Manual action: independently review the curated mapping before elevating its semantic validation status.

### PEER_REVIEW_TOKEN_INCENTIVES_2025

- Bundle: `peer-review-token-incentives-2025`
- Figure/table references: Figure 1; Figure 2; Figure 2, page 6; Figures 4 and 5; Table 2; Table 3; Table 4; Table 5; Table 6; Table 7; Table 8
- Per-reference coverage:
  - `Figure 1`: gap - no complete canonical source_view mapping is recorded.
  - `Figure 2`: mapped by `figure_2_design_principles_features`.
  - `Figure 2, page 6`: mapped by `figure_2_design_principles_features`.
  - `Figures 4 and 5`: gap - no complete canonical source_view mapping is recorded.
  - `Table 2`: gap - no complete canonical source_view mapping is recorded.
  - `Table 3`: gap - no complete canonical source_view mapping is recorded.
  - `Table 4`: gap - no complete canonical source_view mapping is recorded.
  - `Table 5`: gap - no complete canonical source_view mapping is recorded.
  - `Table 6`: gap - no complete canonical source_view mapping is recorded.
  - `Table 7`: gap - no complete canonical source_view mapping is recorded.
  - `Table 8`: gap - no complete canonical source_view mapping is recorded.
- Root-level source-view validation issues: 0
- Source views: 1
- Missing node references: 0
- Missing edge references: 0
- Inferred/query-generated edges incorrectly included: 0
- Unresolved aliases: 0
- Source-order completeness: Complete for declared source views
- `figure_2_design_principles_features`: structurally valid; semantic status `unreviewed`.

#### Relationships between design principles and features

- Source view ID: `figure_2_design_principles_features`
- Source: Figure 2, page 6
- Caption: Relationships between design principles and features.
- Candidate node inventory and stored source order:
  - Design Principle: `PEER_REVIEW_TOKEN_INCENTIVES_2025:dp_001_incentives`, `PEER_REVIEW_TOKEN_INCENTIVES_2025:dp_002_flexibility`, `PEER_REVIEW_TOKEN_INCENTIVES_2025:dp_003_trust`
  - Design Feature: `PEER_REVIEW_TOKEN_INCENTIVES_2025:df_001_tokenization`, `PEER_REVIEW_TOKEN_INCENTIVES_2025:df_002_immutability`, `PEER_REVIEW_TOKEN_INCENTIVES_2025:df_003_decentralization`
- Candidate edge inventory (all must already exist as canonical relations):
  - `PEER_REVIEW_TOKEN_INCENTIVES_2025:rel_035`: `PEER_REVIEW_TOKEN_INCENTIVES_2025:dp_001_incentives` -> `PEER_REVIEW_TOKEN_INCENTIVES_2025:df_001_tokenization`; provenance `explicit-in-artifact`; evidence `PEER_REVIEW_TOKEN_INCENTIVES_2025:ev_012_dp_df_mapping`; canonical relation exists: yes.
  - `PEER_REVIEW_TOKEN_INCENTIVES_2025:rel_038`: `PEER_REVIEW_TOKEN_INCENTIVES_2025:dp_002_flexibility` -> `PEER_REVIEW_TOKEN_INCENTIVES_2025:df_001_tokenization`; provenance `explicit-in-artifact`; evidence `PEER_REVIEW_TOKEN_INCENTIVES_2025:ev_012_dp_df_mapping`; canonical relation exists: yes.
  - `PEER_REVIEW_TOKEN_INCENTIVES_2025:rel_040`: `PEER_REVIEW_TOKEN_INCENTIVES_2025:dp_003_trust` -> `PEER_REVIEW_TOKEN_INCENTIVES_2025:df_002_immutability`; provenance `explicit-in-artifact`; evidence `PEER_REVIEW_TOKEN_INCENTIVES_2025:ev_012_dp_df_mapping`; canonical relation exists: yes.
  - `PEER_REVIEW_TOKEN_INCENTIVES_2025:rel_041`: `PEER_REVIEW_TOKEN_INCENTIVES_2025:dp_003_trust` -> `PEER_REVIEW_TOKEN_INCENTIVES_2025:df_003_decentralization`; provenance `explicit-in-artifact`; evidence `PEER_REVIEW_TOKEN_INCENTIVES_2025:ev_012_dp_df_mapping`; canonical relation exists: yes.
- Runtime projection adds no relations; this source view references canonical relation IDs only.
- Remaining provenance correction needed: none.
- Manual action: independently review the curated mapping before elevating its semantic validation status.

### SHORT_END_STICK_2025

- Bundle: `short-end-stick-2025`
- Figure/table references: Figure 1; Figure 1, page 9; Figure 2; Figure 3; Figures 1 and 2, page 9; Table 3; Table 3, page 12; Table 4; Tables 7 and 8
- Per-reference coverage:
  - `Figure 1`: mapped by `figure_1_requirements_to_design_principles`.
  - `Figure 1, page 9`: mapped by `figure_1_requirements_to_design_principles`.
  - `Figure 2`: gap - no complete canonical source_view mapping is recorded.
  - `Figure 3`: gap - no complete canonical source_view mapping is recorded.
  - `Figures 1 and 2, page 9`: gap - no complete canonical source_view mapping is recorded.
  - `Table 3`: mapped by `table_3_design_principle_implementations`.
  - `Table 3, page 12`: mapped by `table_3_design_principle_implementations`.
  - `Table 4`: gap - no complete canonical source_view mapping is recorded.
  - `Tables 7 and 8`: gap - no complete canonical source_view mapping is recorded.
- Root-level source-view validation issues: 0
- Source views: 2
- Missing node references: 0
- Missing edge references: 0
- Inferred/query-generated edges incorrectly included: 0
- Unresolved aliases: 0
- Source-order completeness: Complete for declared source views
- `figure_1_requirements_to_design_principles`: structurally valid; semantic status `unreviewed`.
- `table_3_design_principle_implementations`: structurally valid; semantic status `unreviewed`.

#### Requirements and design principles for two-sided opportunism

- Source view ID: `figure_1_requirements_to_design_principles`
- Source: Figure 1, page 9
- Caption: Summary of the Design Principles.
- Candidate node inventory and stored source order:
  - Design Requirement: `SHORT_END_STICK_2025:dr_001_prevent_information_manipulation`, `SHORT_END_STICK_2025:dr_002_prevent_information_poaching`
  - Design Principle: `SHORT_END_STICK_2025:dp_001_manipulation_resistant_private_storage_with_integrity_proof`, `SHORT_END_STICK_2025:dp_002_nonreversible_reliable_independent_computation`, `SHORT_END_STICK_2025:dp_003_joint_approval_for_computation_mechanism_changes`
- Candidate edge inventory (all must already exist as canonical relations):
  - `SHORT_END_STICK_2025:rel_003`: `SHORT_END_STICK_2025:dr_001_prevent_information_manipulation` -> `SHORT_END_STICK_2025:dp_001_manipulation_resistant_private_storage_with_integrity_proof`; provenance `explicit-in-artifact`; evidence `SHORT_END_STICK_2025:ev_005_dp1_storage_principle`; canonical relation exists: yes.
  - `SHORT_END_STICK_2025:rel_004`: `SHORT_END_STICK_2025:dr_002_prevent_information_poaching` -> `SHORT_END_STICK_2025:dp_001_manipulation_resistant_private_storage_with_integrity_proof`; provenance `explicit-in-artifact`; evidence `SHORT_END_STICK_2025:ev_005_dp1_storage_principle`; canonical relation exists: yes.
  - `SHORT_END_STICK_2025:rel_005`: `SHORT_END_STICK_2025:dr_001_prevent_information_manipulation` -> `SHORT_END_STICK_2025:dp_002_nonreversible_reliable_independent_computation`; provenance `explicit-in-artifact`; evidence `SHORT_END_STICK_2025:ev_006_dp2_processing_principle`; canonical relation exists: yes.
  - `SHORT_END_STICK_2025:rel_006`: `SHORT_END_STICK_2025:dr_002_prevent_information_poaching` -> `SHORT_END_STICK_2025:dp_002_nonreversible_reliable_independent_computation`; provenance `explicit-in-artifact`; evidence `SHORT_END_STICK_2025:ev_006_dp2_processing_principle`; canonical relation exists: yes.
  - `SHORT_END_STICK_2025:rel_007`: `SHORT_END_STICK_2025:dr_001_prevent_information_manipulation` -> `SHORT_END_STICK_2025:dp_003_joint_approval_for_computation_mechanism_changes`; provenance `explicit-in-artifact`; evidence `SHORT_END_STICK_2025:ev_007_dp3_governance_principle`; canonical relation exists: yes.
  - `SHORT_END_STICK_2025:rel_008`: `SHORT_END_STICK_2025:dr_002_prevent_information_poaching` -> `SHORT_END_STICK_2025:dp_003_joint_approval_for_computation_mechanism_changes`; provenance `explicit-in-artifact`; evidence `SHORT_END_STICK_2025:ev_007_dp3_governance_principle`; canonical relation exists: yes.
- Runtime projection adds no relations; this source view references canonical relation IDs only.
- Remaining provenance correction needed: none.

#### Implementation of the design principles

- Source view ID: `table_3_design_principle_implementations`
- Source: Table 3, page 12
- Caption: Implementation of the Design Principles.
- Candidate node inventory and stored source order:
  - Design Principle: `SHORT_END_STICK_2025:dp_001_manipulation_resistant_private_storage_with_integrity_proof`, `SHORT_END_STICK_2025:dp_002_nonreversible_reliable_independent_computation`, `SHORT_END_STICK_2025:dp_003_joint_approval_for_computation_mechanism_changes`
  - Design Feature: `SHORT_END_STICK_2025:df_001_private_data_collection_as_provider_only_sensitive_data_store`, `SHORT_END_STICK_2025:df_002_public_hash_integrity_proof`, `SHORT_END_STICK_2025:df_003_smart_contract_stress_factor_computation`, `SHORT_END_STICK_2025:df_004_nonreversible_aggregation_function`, `SHORT_END_STICK_2025:df_005_joint_governance_policy`
- Candidate edge inventory (all must already exist as canonical relations):
  - `SHORT_END_STICK_2025:rel_009`: `SHORT_END_STICK_2025:dp_001_manipulation_resistant_private_storage_with_integrity_proof` -> `SHORT_END_STICK_2025:df_001_private_data_collection_as_provider_only_sensitive_data_store`; provenance `explicit-in-artifact`; evidence `SHORT_END_STICK_2025:ev_012_private_data_collection_implementation`; canonical relation exists: yes.
  - `SHORT_END_STICK_2025:rel_010`: `SHORT_END_STICK_2025:dp_001_manipulation_resistant_private_storage_with_integrity_proof` -> `SHORT_END_STICK_2025:df_002_public_hash_integrity_proof`; provenance `explicit-in-artifact`; evidence `SHORT_END_STICK_2025:ev_012_private_data_collection_implementation`; canonical relation exists: yes.
  - `SHORT_END_STICK_2025:rel_011`: `SHORT_END_STICK_2025:dp_002_nonreversible_reliable_independent_computation` -> `SHORT_END_STICK_2025:df_003_smart_contract_stress_factor_computation`; provenance `explicit-in-artifact`; evidence `SHORT_END_STICK_2025:ev_013_smart_contract_implementation`; canonical relation exists: yes.
  - `SHORT_END_STICK_2025:rel_012`: `SHORT_END_STICK_2025:dp_002_nonreversible_reliable_independent_computation` -> `SHORT_END_STICK_2025:df_004_nonreversible_aggregation_function`; provenance `explicit-in-artifact`; evidence `SHORT_END_STICK_2025:ev_013_smart_contract_implementation`; canonical relation exists: yes.
  - `SHORT_END_STICK_2025:rel_013`: `SHORT_END_STICK_2025:dp_003_joint_approval_for_computation_mechanism_changes` -> `SHORT_END_STICK_2025:df_005_joint_governance_policy`; provenance `explicit-in-artifact`; evidence `SHORT_END_STICK_2025:ev_014_joint_governance_implementation`; canonical relation exists: yes.
- Runtime projection adds no relations; this source view references canonical relation IDs only.
- Remaining provenance correction needed: none.
- Manual action: independently review the curated mapping before elevating its semantic validation status.

### SSI_KYC_FRAMEWORK_2022

- Bundle: `ssi-kyc-framework-2022`
- Figure/table references: Figure 1; Figure 2; Figure 3; Figure 4; Figure 4, page 8; Figure 5; Figure 6
- Per-reference coverage:
  - `Figure 1`: gap - no complete canonical source_view mapping is recorded.
  - `Figure 2`: gap - no complete canonical source_view mapping is recorded.
  - `Figure 3`: gap - no complete canonical source_view mapping is recorded.
  - `Figure 4`: gap - no complete canonical source_view mapping is recorded.
  - `Figure 4, page 8`: gap - no complete canonical source_view mapping is recorded.
  - `Figure 5`: gap - no complete canonical source_view mapping is recorded.
  - `Figure 6`: gap - no complete canonical source_view mapping is recorded.
- Root-level source-view validation issues: 0
- Source views: 0
- Missing node references: 0
- Missing edge references: 0
- Inferred/query-generated edges incorrectly included: 0
- Unresolved aliases: 0
- Source-order completeness: Complete for declared source views
- Result: no exact source view is currently curated.
- Manual action: inspect the source figure/table and transcribe only complete, visibly supported canonical nodes and relations; otherwise leave Source Figure unavailable.

### TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024

- Bundle: `trust-capacity-exchange-blockchain-2024`
- Figure/table references: Figure 3; Figure 3, page 5; Figure 6, page 8; Figures 3 and 6
- Per-reference coverage:
  - `Figure 3`: mapped by `figure_3_meta_requirements_to_design_principles`.
  - `Figure 3, page 5`: mapped by `figure_3_meta_requirements_to_design_principles`.
  - `Figure 6, page 8`: mapped by `figure_6_design_principles_to_features`.
  - `Figures 3 and 6`: gap - no complete canonical source_view mapping is recorded.
- Root-level source-view validation issues: 0
- Source views: 2
- Missing node references: 0
- Missing edge references: 0
- Inferred/query-generated edges incorrectly included: 0
- Unresolved aliases: 0
- Source-order completeness: Complete for declared source views
- `figure_3_meta_requirements_to_design_principles`: structurally valid; semantic status `unreviewed`.
- `figure_6_design_principles_to_features`: structurally valid; semantic status `unreviewed`.

#### Meta-requirements and design principles

- Source view ID: `figure_3_meta_requirements_to_design_principles`
- Source: Figure 3, page 5
- Caption: Formulation and categorization of meta-requirements and design principles.
- Candidate node inventory and stored source order:
  - Design Requirement: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_001_creation_and_management_of_tender`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_002_cross_domain_management`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_003_search_functions`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_004_identity_management_and_verification`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_005_initiation_support_services`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_006_intermediate_connection`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_007_contract_heterogeneity`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_008_final_award_function`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_009_payment_fulfilment_conditions`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_010_legal_framework_compliance`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_011_serious_rating`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_012_decision_relevant_kpis`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_013_transaction_transparency_completeness`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_014_decentralization_and_simultaneity`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_015_communication_services`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_016_equality_of_participants`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_017_interface_compatibility_and_standards`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_018_human_interaction_and_role_models`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_019_encryption_concepts`
  - Design Principle: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_001_signaling_tender_information`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_002_signaling_identity_information`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_003_authority_and_fairness`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_004_incentive_mechanisms`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_005_screening_functionality`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_006_reputation_mechanism`
- Candidate edge inventory (all must already exist as canonical relations):
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_023`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_001_creation_and_management_of_tender` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_001_signaling_tender_information`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_041_figure_3_requirement_principle_mapping`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_024`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_002_cross_domain_management` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_001_signaling_tender_information`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_041_figure_3_requirement_principle_mapping`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_025`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_013_transaction_transparency_completeness` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_001_signaling_tender_information`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_041_figure_3_requirement_principle_mapping`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_026`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_014_decentralization_and_simultaneity` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_001_signaling_tender_information`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_041_figure_3_requirement_principle_mapping`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_027`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_016_equality_of_participants` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_001_signaling_tender_information`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_041_figure_3_requirement_principle_mapping`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_028`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_017_interface_compatibility_and_standards` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_001_signaling_tender_information`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_041_figure_3_requirement_principle_mapping`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_029`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_004_identity_management_and_verification` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_002_signaling_identity_information`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_041_figure_3_requirement_principle_mapping`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_030`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_013_transaction_transparency_completeness` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_002_signaling_identity_information`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_041_figure_3_requirement_principle_mapping`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_031`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_014_decentralization_and_simultaneity` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_002_signaling_identity_information`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_041_figure_3_requirement_principle_mapping`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_032`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_019_encryption_concepts` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_002_signaling_identity_information`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_041_figure_3_requirement_principle_mapping`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_033`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_006_intermediate_connection` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_003_authority_and_fairness`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_041_figure_3_requirement_principle_mapping`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_034`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_007_contract_heterogeneity` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_003_authority_and_fairness`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_041_figure_3_requirement_principle_mapping`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_035`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_008_final_award_function` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_003_authority_and_fairness`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_041_figure_3_requirement_principle_mapping`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_036`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_010_legal_framework_compliance` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_003_authority_and_fairness`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_041_figure_3_requirement_principle_mapping`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_037`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_016_equality_of_participants` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_003_authority_and_fairness`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_041_figure_3_requirement_principle_mapping`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_038`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_018_human_interaction_and_role_models` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_003_authority_and_fairness`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_041_figure_3_requirement_principle_mapping`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_039`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_009_payment_fulfilment_conditions` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_004_incentive_mechanisms`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_041_figure_3_requirement_principle_mapping`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_040`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_010_legal_framework_compliance` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_004_incentive_mechanisms`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_041_figure_3_requirement_principle_mapping`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_041`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_013_transaction_transparency_completeness` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_004_incentive_mechanisms`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_041_figure_3_requirement_principle_mapping`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_042`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_014_decentralization_and_simultaneity` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_004_incentive_mechanisms`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_041_figure_3_requirement_principle_mapping`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_043`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_003_search_functions` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_005_screening_functionality`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_041_figure_3_requirement_principle_mapping`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_044`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_004_identity_management_and_verification` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_005_screening_functionality`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_041_figure_3_requirement_principle_mapping`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_045`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_005_initiation_support_services` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_005_screening_functionality`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_041_figure_3_requirement_principle_mapping`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_046`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_013_transaction_transparency_completeness` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_005_screening_functionality`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_041_figure_3_requirement_principle_mapping`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_047`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_015_communication_services` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_005_screening_functionality`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_041_figure_3_requirement_principle_mapping`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_048`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_017_interface_compatibility_and_standards` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_005_screening_functionality`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_041_figure_3_requirement_principle_mapping`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_049`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_019_encryption_concepts` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_005_screening_functionality`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_041_figure_3_requirement_principle_mapping`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_050`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_011_serious_rating` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_006_reputation_mechanism`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_041_figure_3_requirement_principle_mapping`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_051`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_012_decision_relevant_kpis` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_006_reputation_mechanism`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_041_figure_3_requirement_principle_mapping`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_052`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_013_transaction_transparency_completeness` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_006_reputation_mechanism`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_041_figure_3_requirement_principle_mapping`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_053`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_014_decentralization_and_simultaneity` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_006_reputation_mechanism`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_041_figure_3_requirement_principle_mapping`; canonical relation exists: yes.
- Runtime projection adds no relations; this source view references canonical relation IDs only.
- Remaining provenance correction needed: none.

#### Design principles and blockchain design features

- Source view ID: `figure_6_design_principles_to_features`
- Source: Figure 6, page 8
- Caption: Design features and their consideration in a blockchain-based instantiation using Solidity.
- Candidate node inventory and stored source order:
  - Design Principle: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_001_signaling_tender_information`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_002_signaling_identity_information`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_003_authority_and_fairness`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_004_incentive_mechanisms`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_005_screening_functionality`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_006_reputation_mechanism`
  - Design Feature: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_001_creating_a_tender`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_002_distributing_tender_information`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_003_creating_an_identity`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_004_distributing_identity_information`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_005_ensuring_authorized_access`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_006_configuring_permissions`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_007_prevention_of_fraud`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_008_enforcing_rewards_and_incentive`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_009_traceability_of_rewards_and_incentives`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_010_permitted_access_tender_information`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_011_permitted_access_identity_information`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_012_permitted_access_reputation_information`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_013_creating_individual_assessment`, `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_014_distributing_assessment_information`
- Candidate edge inventory (all must already exist as canonical relations):
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_054`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_001_signaling_tender_information` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_001_creating_a_tender`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_055`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_001_signaling_tender_information` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_002_distributing_tender_information`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_057`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_002_signaling_identity_information` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_003_creating_an_identity`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_058`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_002_signaling_identity_information` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_004_distributing_identity_information`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_060`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_003_authority_and_fairness` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_005_ensuring_authorized_access`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_061`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_003_authority_and_fairness` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_006_configuring_permissions`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_062`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_003_authority_and_fairness` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_007_prevention_of_fraud`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_064`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_004_incentive_mechanisms` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_008_enforcing_rewards_and_incentive`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_065`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_004_incentive_mechanisms` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_009_traceability_of_rewards_and_incentives`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_067`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_005_screening_functionality` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_010_permitted_access_tender_information`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_068`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_005_screening_functionality` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_011_permitted_access_identity_information`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_069`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_005_screening_functionality` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_012_permitted_access_reputation_information`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_071`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_006_reputation_mechanism` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_013_creating_individual_assessment`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure`; canonical relation exists: yes.
  - `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_072`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_006_reputation_mechanism` -> `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_014_distributing_assessment_information`; provenance `explicit-in-artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure`; canonical relation exists: yes.
- Runtime projection adds no relations; this source view references canonical relation IDs only.
- Remaining provenance correction needed: none.
- Manual action: independently review the curated mapping before elevating its semantic validation status.

## Parser/root-level issues

No parser-level OKF issues were reported while constructing the audit inventory.

## Interpretation

- Structurally valid means the mapping obeys the canonical schema and references stored concepts/relations.
- Unreviewed means semantic parity has not been established by a recorded human reviewer.
- Internal validation and author verification require explicit reviewer metadata.
- Automatic approximation describes layout only; it is not exact visual reproduction.

<!-- CURATED_NINE_PAPER_AUDIT_START -->
## Final nine-paper curation outcomes

This section records the completed PDF-level curation decision for every runtime paper. Every PDF page was text-extracted and rendered; all pages containing candidate formal figures or tables were inspected at high resolution. Structural validation is deterministic. Semantic status remains `unreviewed` because no author or expert review record exists.

| Paper | Figures/tables inspected | Exact source views | Source nodes | Source edges | Recommended flow | Full relations | Semantic status | Remaining action |
|---|---|---:|---:|---:|---|---|---|---|
| blockchain-iot-sdps-2019 | Figs. 1-6; Tables 1, 2, 4, 5, 6 | 1 | 17 | 14 | 3 stored paths | 32 stored relations | unreviewed | Independent semantic comparison with Figure 3 |
| short-end-stick-2025 | Tables 1-3, 6-8; Figs. 1-3 | 2 | 13 across views | 11 | 3 stored paths | 26 stored relations | unreviewed | Independent semantic comparison with Figure 1 and Table 3 |
| newsvendor-forecasting-smart-contract-2021 | Figs. 1-3 and D.1-D.4; Requirements 1-4 | 0 | 0 | 0 | 1 stored path | 51 stored relations | unreviewed | Author/expert decision on whether actor-message process steps should become canonical concepts |
| hie-consent-self-management-blockchain-2023 | Figs. 1-8; Table 4 | 1 | 15 | 13 | 1 stored path | 53 stored relations | unreviewed | Independent semantic comparison with Figure 3 |
| peer-review-token-incentives-2025 | Fig. 1; Tables 2-8; Figs. 2-5 | 1 | 6 | 4 | 4 stored paths | 68 stored relations | unreviewed | Independent semantic comparison with Figure 2 |
| nil-nft-marketplace-2026 | Fig. 1; Tables 2-4; Figs. 2-4 | 1 | 10 | 9 | 2 stored paths | 62 stored relations | unreviewed | Independent semantic comparison with Figure 1 |
| ssi-kyc-framework-2022 | Figs. 1-6; Table 1 | 0 | 0 | 0 | 1 stored path | 85 stored relations | unreviewed | Author/expert decision on canonical treatment of roles, messages, and architecture components |
| trust-capacity-exchange-blockchain-2024 | Figs. 1-9; Tables 1-3 | 2 | 45 across views | 45 | 3 stored paths | 95 stored relations | unreviewed | Independent semantic comparison with Figures 3 and 6 |
| integrated-blockchain-isdm-framework-2024 | Figs. 1-3; Tables 1-5; Appendix A | 0 | 0 | 0 | 3 stored paths | 105 stored relations | unreviewed | Author/expert decision on a source-view contract for multi-axis framework diagrams |

### blockchain-iot-sdps-2019 - Outcome A

Candidate inventory:

| Source | PDF page | Formal content | Explicit relations/order | Complete exact view? |
|---|---:|---|---|---|
| Figure 1, "Structure of the Core of the Paper" | 4 | Research-section sequence | Ordered sections and research questions | No; section navigation is not canonical DSR graph data |
| Figure 2, "Design Cycles..." | 9 | DSR lifecycle and iterations | Explicit process order | No; process stages are research metadata, not the paper's design-knowledge mapping |
| Table 1, "General SDPS Challenges and Design Requirements" | 11 | Challenge-to-requirement rows | Row pairing, no graph arrows | No; individual challenges are not canonical concepts |
| Figure 3, "Design Requirements, Principles, and Features" | 13 | 4 requirements, 4 principles, 9 features | Explicit arrows and stable source order | Yes |
| Figure 4, "Artifact Architecture" | 14 | Feature-level architecture and data movement | Explicit component flow | No; it contains feature-to-feature/data-flow semantics and infrastructure annotations not represented by stored canonical relations |
| Figure 5, "A Detailed View of the Certification Process" | 15 | DF8 substeps | Explicit sequence | No; DF8.a-DF8.g are not separate canonical concepts |
| Figure 6, "Prototype Architecture" | 16 | Implementation components | Explicit technical flow | No; prototype-specific nodes are not canonical DSR concepts |
| Tables 2, 4, 5, 6 | 20, 24, 26, 27 | Evaluation cycles, design-theory components, usage/design implications | Tabular grouping | No; they summarize evaluation or contextual knowledge rather than a complete canonical relation view |

Selected source view: `figure_3_design_requirements_principles_features`. Ordered canonical node IDs and all 14 exact relation IDs are listed in the generated inventory above. The PDF confirms the source order and the mappings DR1->DP1/DP2, DR2->DP3, DR3/DR4->DP4, and the corresponding DP-to-feature branches. No extra or missing relation was found. All 14 relations remain `explicit-in-artifact`; semantic status remains `unreviewed`.

Recommended Flow now uses three complete stored Problem->Requirement->Principle->Feature->Artifact paths instead of two disconnected fragments. Full Relations remains available with all 32 canonical relations.

### short-end-stick-2025 - Outcome A

Candidate inventory:

| Source | PDF page | Formal content | Explicit relations/order | Complete exact view? |
|---|---:|---|---|---|
| Table 1, "Opportunistic Behaviors..." | 5 | Problem definitions | Row pairing only | No; contextual problem taxonomy |
| Table 2, "Research Overview" | 8 | Research process | Ordered DSR stages | No; research metadata |
| Figure 1, "Summary of the Design Principles" | 9 | 2 requirements across storage, processing, governance; 3 principles | Explicit many-to-many mapping | Yes |
| Figure 2, "System Architecture with Design Principles" | 9 | Provider, recipient, data, proof, shared information, governance | Explicit architecture/data flow | No; actor/data-object nodes and several flow arrows are not canonical concepts/relations |
| Table 3, "Implementation of the Design Principles" | 12 | 3 principles and 5 implementation features | Exact row-to-implementation mapping | Yes |
| Figure 3, "The Artifact" | 12 | Hyperledger networks, peers, orderers, channel, sensor data, hashes | Explicit deployment/data flow | No; implementation topology is not fully represented by canonical concepts |
| Tables 6-8 | 17-18 | Evaluation statistics and model results | Statistical relationships | No; evaluation results, not stored DSR design mappings |

Selected source views:

- `figure_1_requirements_to_design_principles`: 2 requirements, 3 principles, 6 exact relations (`rel_003`-`rel_008`).
- `table_3_design_principle_implementations`: 3 principles, 5 features, 5 exact relations (`rel_009`-`rel_013`).

The exact ordered node IDs and edge IDs are listed in the generated inventories above. No canonical relation was added. Eleven existing relations were corrected from `inferred` to `explicit-in-artifact`. Figure 2 and Figure 3 remain documented partial architecture mappings and are not exposed as exact Source Figure views. Recommended Flow retains three complete stored paths; Full Relations retains all 26 canonical relations.

### newsvendor-forecasting-smart-contract-2021 - Outcome B

Candidate inventory:

| Source | PDF page | Formal content | Explicit relations/order | Complete exact view? |
|---|---:|---|---|---|
| Figure 1, "Illustration of the interaction..." | 4 | Newsvendor-expert interaction | Explicit message order | No; actor/message nodes are not canonical DSR concepts |
| Figure 2, expert indifference curves | 6 | Evaluation/economic model | Mathematical curves | No; not a DSR relation view |
| Figure 3, "Graphical description of the proposed solution" | 8 | Newsvendor, expert, blockchain network, oracle, seven messages | Explicit sequence and direction | No; the complete actor-message inventory cannot be resolved to existing canonical concepts and relations without inventing process edges |
| Requirements 1-4 | 8-9 | Smart-contract preconditions/postconditions | Ordered pseudocode conditions | No; not a figure/table node-edge mapping |
| Figures D.1-D.4 | 16-17 | DApp screens and user actions | UI sequence | No; screenshots are implementation evidence |

Figure 3 is a complete process diagram, but its formal nodes are participants and request/payment messages. The canonical bundle models requirements, principles, features, artifacts, and evaluations, not every actor and message. Exposing only the subset that resembles current features would falsely claim figure parity. Therefore Source Figure is unavailable. Recommended Flow remains a stored six-node design pathway, and Full Relations exposes all 51 canonical relations. A later author/expert review could authorize new canonical process concepts and explicit message relations; none were added here.

### hie-consent-self-management-blockchain-2023 - Outcome A

Candidate inventory:

| Source | PDF page | Formal content | Explicit relations/order | Complete exact view? |
|---|---:|---|---|---|
| Figure 1, current patient-consent structure | 3 | Providers, HIEs, patients, consent flow | Explicit architecture/data flow | No; actors and exchange links are not canonical concepts |
| Figure 2, two DSR iterations | 3-4 | Research lifecycle | Explicit stages | No; research metadata |
| Figure 3, "Design requirements, principles, and features" | 8 | 5 requirements, 5 principles, 5 features | Explicit branching arrows and stable order | Yes |
| Figure 4 and Table 4 | 8 | Blockchain decision path and case-specific answers | Decision-tree branches | No; generic decision questions are not canonical DSR concepts |
| Figure 5, DApp-enabled consent structure | 9 | Patient/HIE/provider architecture | Explicit flow | No; actor and data-flow inventory is not canonical |
| Figures 6-8 | 9-10 | Wallet and DApp screens | UI sequence | No; screenshots are implementation evidence |

Selected source view: `figure_3_design_requirements_principles_features`. It includes the exact 5+5+5 ordered node inventory and 13 stored relations: `rel_013`-`rel_021`, `rel_023`, `rel_028`, `rel_030`, and `rel_032`. The figure and adjacent text confirm the branching requirement mappings and the five feature mappings. No relation was added. Thirteen existing relations were corrected from `inferred` to `explicit-in-artifact`. Recommended Flow and all 53 Full Relations remain available.

### peer-review-token-incentives-2025 - Outcome A

Candidate inventory:

| Source | PDF page | Formal content | Explicit relations/order | Complete exact view? |
|---|---:|---|---|---|
| Figure 1, applied DSR framework | 3 | Research stages | Explicit process order | No; research metadata |
| Tables 3-5 | 4-5 | Three design-principle formulations | One principle per table | No; no cross-node mapping |
| Figure 2, "Relationships between design principles and features" | 6 | 3 principles, 3 features | Four explicit arrows | Yes |
| Figure 3 and Table 6 | 6 | Blockchain adoption decision tree and answers | Explicit decision branches | No; generic decision nodes are not canonical concepts |
| Figures 4-5 | 8 | Editor/reviewer UI | UI screens | No; implementation evidence |
| Tables 7-8 | 8, 10 | Cost evaluation and design-theory components | Tabular evaluation/theory | No; not a canonical relation view |

Selected source view: `figure_2_design_principles_features`. The PDF confirms DP1->DF1, DP2->DF1, and DP3->DF2/DF3 with source order preserved. The exact six node IDs and four relation IDs are listed above. No extra, missing, inferred, or query-generated edge occurs. Recommended Flow now contains four stored DP->DF->Artifact paths. Full Relations retains all 68 relations.

### nil-nft-marketplace-2026 - Outcome A

Candidate inventory:

| Source | PDF page | Formal content | Explicit relations/order | Complete exact view? |
|---|---:|---|---|---|
| Figure 1, "Design requirements (DR), principles (DP), and features (DF)" | 5 | 5 requirements, 3 principles, 2 features | Nine explicit arrows | Yes |
| Tables 2-4 | 6 | Design-principle schema entries | Principle definitions and rationales | No; no additional node-edge inventory |
| Figure 2, high-level proposed solution | 7 | Fans, athletes, marketplace, smart contract, royalty flow | Explicit actor/transaction flow | No; actors and transaction messages are not all canonical concepts/relations |
| Figures 3-4 | 7-8 | DApp screens and transaction interaction | UI/process evidence | No; not a canonical design mapping |

Selected source view: `figure_1_design_requirements_principles_features`. Reinspection confirmed the 10-node order and all nine edges, including both DP3->DF1 and DP3->DF2. No extra or missing edge was found. The two relations added during the earlier architecture pass (`rel_081`, `rel_082`) remain source-grounded; this pass added no relations. Recommended Flow now has two complete stored Problem->Requirement->Principle->Feature->Artifact paths. Full Relations retains all 62 relations.

### ssi-kyc-framework-2022 - Outcome B

Candidate inventory:

| Source | PDF page | Formal content | Explicit relations/order | Complete exact view? |
|---|---:|---|---|---|
| Figure 1, KYC process | 3 | KYC activities and sequence | Explicit process order | No; activities are contextual metadata rather than canonical concepts |
| Figure 2, layers of SSI identity management | 4 | Holder, issuer, verifier, wallet, credentials, ledger | Architecture/trust relationships | No; role nodes and trust links are not canonical graph nodes |
| Figure 3, applied DSR process | 5 | Six DSR stages | Explicit sequence | No; research metadata |
| Figure 4, SSI-based KYC architecture | 8 | Customer, bank, agents/wallets, VC/VP, storage, issuer, DID document, ledger, KYC services | Explicit architecture/data flow | No; the complete role/component inventory and its communication arrows cannot be resolved to existing canonical concepts/relations |
| Figures 5-6, onboarding UML diagrams | 8, 10 | Lifelines and messages for new/fast onboarding | Explicit message order | No; most lifelines/messages are not canonical concepts/relations |

The architecture and UML diagrams are formal and complete, but a partial projection of wallet/credential/ledger features would omit participant lifelines and message semantics. That would falsely claim exact parity. Source Figure therefore remains unavailable. The stored SSI recommended path and all 85 Full Relations remain available. Later author/expert review could approve a canonical process/role extension; none was inferred here.

### trust-capacity-exchange-blockchain-2024 - Outcome A

Candidate inventory:

| Source | PDF page | Formal content | Explicit relations/order | Complete exact view? |
|---|---:|---|---|---|
| Figure 1, overall research design | 3 | DSR iterations and grounding | Explicit research sequence | No; research metadata |
| Figure 2, research model | 4 | Problem/solution theory model | Abstract theoretical links | No; theory/context is not canonical DSR graph data |
| Figure 3, "Formulation and categorization of meta-requirements and design principles" | 5 | 19 meta-requirements, 6 principles | 31 explicit many-to-many links and stable order | Yes |
| Table 2, design-principle overview | 6 | Six formal principle statements | One row per principle | No additional cross-node mapping |
| Figure 4, ex-ante evaluation results | 6 | Evaluation criteria and scores | Evaluation visualization | No; not a design relation view |
| Figure 5, smart contracts in blockchain framework | 7 | Infrastructure layers and contracts | Architecture placement | No; external framework layers are not canonical concepts |
| Figure 6, "Design features and their consideration..." | 8 | DP1-DP6 and DF1.1-DF6.2 | 14 explicit principle-to-feature links and stable order | Yes |
| Figures 7-9 and Table 3 | 8-10 | Experimental design and trust results | Evaluation relationships | No; evaluation evidence rather than design mapping |

Selected source views:

- `figure_3_meta_requirements_to_design_principles`: 19 requirements, 6 principles, 31 exact relations (`rel_023`-`rel_053`). Transaction-stage labels are grouping annotations, not extra canonical nodes.
- `figure_6_design_principles_to_features`: 6 principles, 14 features, 14 exact relations (`rel_054`, `rel_055`, `rel_057`, `rel_058`, `rel_060`-`rel_062`, `rel_064`, `rel_065`, `rel_067`-`rel_069`, `rel_071`, `rel_072`). Prototype screenshots/code remain annotations.

No relation was added. One figure-specific evidence record was added for the complete Figure 3 mapping, and its 31 relations now reference that record. Forty-five existing relations were corrected from `inferred` to `explicit-in-artifact`. Recommended Flow now contains three stored Requirement->Principle->Feature->Artifact paths. Full Relations retains all 95 relations.

### integrated-blockchain-isdm-framework-2024 - Outcome B

Candidate inventory:

| Source | PDF page | Formal content | Explicit relations/order | Complete exact view? |
|---|---:|---|---|---|
| Figure 1, core aspects of a typical ISDM | 3 | Development process, roles, modeling | Conceptual grouping | No; grouping/context rather than a canonical relation inventory |
| Table 1, framework quality criteria | 4 | Comprehensiveness, generality, soundness | Criterion definitions | No; requirements without a source arrow mapping |
| Tables 2-4 | 5-6 | Framework iterations, coding examples, expert review | Research/evidence structure | No; not a design graph |
| Figure 2, integrated framework backbone | 7 | Seven lifecycle phases, 36 task/role/model fragments, sequence and generated-output arrows | Explicit multi-axis framework | No; the current source-view contract groups by canonical concept type and cannot preserve three simultaneous dimensions, phase groupings, role/model lanes, and generated-output arrows without adding noncanonical grouping nodes or new semantics |
| Table 5 and Figure 3 | 8-10 | Case details and colored framework instantiations | Comparative status overlays | No; case-specific status/color semantics are not canonical relations |
| Appendix A | 11-15 | Literature-to-fragment provenance | Tabular evidence mapping | No; evidence provenance, not a graph view |

Figure 2 is the central paper figure, but exposing a one-layer dump of Design Feature concepts would destroy its process/role/model structure and imply parity the renderer cannot express. Adding phase/grouping nodes or sequence edges solely for display would change the canonical semantics. Source Figure remains unavailable. Three stored Recommended Flow paths now cover framework organization, security design, and lifecycle maintenance. Full Relations retains all 105 relations. A future schema revision reviewed by the authors or a domain expert could introduce a generic dimension/grouping contract; this pass does not redesign runtime architecture.

## Curation delta

- Exact source views: 3 -> 8.
- Papers with exact Source Figure availability: 3 -> 6.
- Recommended paths: 8 -> 21; every paper now has at least one explicit stored path.
- Concepts: 351 -> 351.
- Relations: 577 -> 577.
- Evidence items: 305 -> 306.
- Graph nodes: 338 -> 338.
- Graph edges: 574 -> 574.
- Relations added in this pass: 0.
- Evidence added in this pass: 1 (`TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_041_figure_3_requirement_principle_mapping`, grounding the exact Figure 3 arrow inventory).
- Provenance corrections in this pass: 69 existing relations changed from `inferred` to `explicit-in-artifact` (HIE 13, Short End 11, Trust Capacity 45).
- Source-view projector additions: 0 nodes, 0 edges.
- Unresolved aliases were not promoted from legacy data; they remain comparison warnings in the flow report.

## Manual semantic-review boundary

All eight source views are structurally valid and deterministically projected, but all remain semantically `unreviewed`. A recorded reviewer must still compare each ordered node and arrow inventory against its cited figure/table before any status can change to `internally_reviewed` or `author_verified`. Outcome B papers require an explicit reviewer decision before the canonical schema is extended to actor-message processes, role/lifeline diagrams, or multi-axis framework groupings.
<!-- CURATED_NINE_PAPER_AUDIT_END -->
