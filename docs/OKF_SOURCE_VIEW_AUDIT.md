# OKF Source View Audit

This report inventories formal figure/table references and optional canonical `source_views`. Structural validity is not semantic human verification. Legacy CSV data is a comparison source only and is never promoted to canonical truth by this audit.

## Summary

- Runtime papers: 9
- Canonical source views: 3
- Structurally valid source views: 3
- Papers with a figure/table reference but no exact source view: 6
- Papers requiring manual transcription or semantic review: 9
- Existing canonical relations referenced by source views: 27
- Source-view relations marked explicit-in-artifact: 27
- Canonical relations synthesized or added by projection: 0
- Parser/root-level issues: 0

No source view is generated from recommended paths, all relations, PDF proximity, or legacy CSV. A paper without a complete curated mapping exposes Recommended Flow and Full Relations only.

## Canonical curation performed in this pass

- Added 2 visibly supported NIL Figure 1 relations: `NIL_NFT_MARKETPLACE_2026:rel_081` and `NIL_NFT_MARKETPLACE_2026:rel_082`.
- Added 1 supporting evidence record: `NIL_NFT_MARKETPLACE_2026:ev_034_figure_1_source_mapping`.
- Corrected provenance on 25 existing source-visible relations from inferred to explicit-in-artifact; their endpoints, predicates, and substantive DSR semantics were not changed.
- The shared projector adds 0 nodes and 0 relations to Source Figure views.

## Per-paper inventory

| Paper ID | Referenced sources | Reference gaps | Source views | Nodes by layer | Edges | Provenance | Structural result | Semantic state | Manual work |
|---|---|---:|---:|---|---:|---|---|---|---|
| BLOCKCHAIN_IOT_SDPS_2019 | Figure 1; Figure 3; Figure 3, page 13; Figure 4; Figure 5; Table 1; Table 2; Table 4; Table 5; Table 6 | 8 | 1 | Design Feature: 9; Design Principle: 4; Design Requirement: 4 | 14 | explicit-in-artifact: 14 | 1/1 valid | unreviewed: 1 | Required |
| HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023 | Figure 1; Figure 3; Figure 3, page 8; Figure 4; Figures 5-8; Table 4 | 6 | 0 | None | 0 | None | 0/0 valid | None | Required |
| INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024 | Figure 2, page 7 | 1 | 0 | None | 0 | None | 0/0 valid | None | Required |
| NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021 | Figure 3, page 8 | 1 | 0 | None | 0 | None | 0/0 valid | None | Required |
| NIL_NFT_MARKETPLACE_2026 | Figure 1; Figure 1, page 5; Figure 2; Figure 3; Figure 4; Table 1; Table 2; Table 3; Table 4 | 7 | 1 | Design Feature: 2; Design Principle: 3; Design Requirement: 5 | 9 | explicit-in-artifact: 9 | 1/1 valid | unreviewed: 1 | Required |
| PEER_REVIEW_TOKEN_INCENTIVES_2025 | Figure 1; Figure 2; Figure 2, page 6; Figures 4 and 5; Table 2; Table 3; Table 4; Table 5; Table 6; Table 7; Table 8 | 9 | 1 | Design Feature: 3; Design Principle: 3 | 4 | explicit-in-artifact: 4 | 1/1 valid | unreviewed: 1 | Required |
| SHORT_END_STICK_2025 | Figure 1; Figure 2; Figure 3; Figures 1 and 2, page 9; Table 3; Table 4; Tables 7 and 8 | 7 | 0 | None | 0 | None | 0/0 valid | None | Required |
| SSI_KYC_FRAMEWORK_2022 | Figure 1; Figure 2; Figure 3; Figure 4; Figure 4, page 8; Figure 5; Figure 6 | 7 | 0 | None | 0 | None | 0/0 valid | None | Required |
| TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024 | Figures 3 and 6 | 1 | 0 | None | 0 | None | 0/0 valid | None | Required |

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
  - `Figure 3`: gap - no complete canonical source_view mapping is recorded.
  - `Figure 3, page 8`: gap - no complete canonical source_view mapping is recorded.
  - `Figure 4`: gap - no complete canonical source_view mapping is recorded.
  - `Figures 5-8`: gap - no complete canonical source_view mapping is recorded.
  - `Table 4`: gap - no complete canonical source_view mapping is recorded.
- Root-level source-view validation issues: 0
- Source views: 0
- Missing node references: 0
- Missing edge references: 0
- Inferred/query-generated edges incorrectly included: 0
- Unresolved aliases: 0
- Source-order completeness: Complete for declared source views
- Result: no exact source view is currently curated.
- Manual action: inspect the source figure/table and transcribe only complete, visibly supported canonical nodes and relations; otherwise leave Source Figure unavailable.

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
- Figure/table references: Figure 1; Figure 2; Figure 3; Figures 1 and 2, page 9; Table 3; Table 4; Tables 7 and 8
- Per-reference coverage:
  - `Figure 1`: gap - no complete canonical source_view mapping is recorded.
  - `Figure 2`: gap - no complete canonical source_view mapping is recorded.
  - `Figure 3`: gap - no complete canonical source_view mapping is recorded.
  - `Figures 1 and 2, page 9`: gap - no complete canonical source_view mapping is recorded.
  - `Table 3`: gap - no complete canonical source_view mapping is recorded.
  - `Table 4`: gap - no complete canonical source_view mapping is recorded.
  - `Tables 7 and 8`: gap - no complete canonical source_view mapping is recorded.
- Root-level source-view validation issues: 0
- Source views: 0
- Missing node references: 0
- Missing edge references: 0
- Inferred/query-generated edges incorrectly included: 0
- Unresolved aliases: 0
- Source-order completeness: Complete for declared source views
- Result: no exact source view is currently curated.
- Manual action: inspect the source figure/table and transcribe only complete, visibly supported canonical nodes and relations; otherwise leave Source Figure unavailable.

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
- Figure/table references: Figures 3 and 6
- Per-reference coverage:
  - `Figures 3 and 6`: gap - no complete canonical source_view mapping is recorded.
- Root-level source-view validation issues: 0
- Source views: 0
- Missing node references: 0
- Missing edge references: 0
- Inferred/query-generated edges incorrectly included: 0
- Unresolved aliases: 0
- Source-order completeness: Complete for declared source views
- Result: no exact source view is currently curated.
- Manual action: inspect the source figure/table and transcribe only complete, visibly supported canonical nodes and relations; otherwise leave Source Figure unavailable.

## Parser/root-level issues

No parser-level OKF issues were reported while constructing the audit inventory.

## Interpretation

- Structurally valid means the mapping obeys the canonical schema and references stored concepts/relations.
- Unreviewed means semantic parity has not been established by a recorded human reviewer.
- Internal validation and author verification require explicit reviewer metadata.
- Automatic approximation describes layout only; it is not exact visual reproduction.
