# OKF Schema Normalization Data-Preservation Audit

**Audit date:** 2026-07-15  
**Before:** commit `c4940e4`  
**After:** current uncommitted working tree  
**Scope:** the nine canonical bundles under `library/okf/papers/`

## Executive conclusion

The count reduction is deliberate schema normalization, not deletion of canonical DSR knowledge. The historical 443 concepts consist of 351 concepts in the seven `okf-dsr-v1` canonical DSR types plus 92 paper-context records: 17 research questions, 39 kernel theories, and 36 limitations. All 351 canonical concepts remain under the same IDs with the same titles, descriptions, and source-preserved explanations. The audit found 23 historically dangling concept-to-evidence reference occurrences; 22 were repaired to unique existing evidence IDs with the same semantic suffix, while one reference pointed to no evidence record and was deliberately not fabricated. The 92 context records were removed only from the machine-readable concept/graph type system and preserved in each paper's `index.md` as typed metadata and full human-readable context.

The 183 removed relations all touch at least one of those 92 context records. They therefore cannot remain canonical graph relations once those endpoints become paper metadata. Every removed relation ID, endpoint, predicate, evidence reference, and confidence statement remains in the paper's **Contextual links excluded from the canonical graph** section. No canonical-to-canonical relation was removed or changed.

No substantive claim loss was found. No concept or relation required restoration, but 22 evidence-link occurrences were restored bidirectionally in the Blockchain IoT bundle and the normalizer was hardened to preserve uniquely resolvable legacy links. No commit was made.

## Method

The audit used three independent checks:

1. Reconstructed `library/okf` and the historical parser directly from commit `c4940e4`, reproducing the original **443 concepts / 758 relations / 304 evidence items** with zero parser warnings.
2. Parsed the current strict source records directly from `dsr.md`, `evidence.md`, `relations.yaml`, and `graph.json`.
3. Compared exact IDs and normalized record content, then checked metadata/prose preservation for every record removed from the canonical graph model.

The generated comparison artifacts were written only to `.okf-cache/debug/` and are not tracked.

## Per-paper before/after counts

| Paper | Concepts before | Concepts after | Relations before | Relations after | Evidence before | Evidence after | Graph nodes before | Graph nodes after | Graph edges before | Graph edges after |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| blockchain-iot-sdps-2019 | 30 | 24 | 40 | 32 | 29 | 29 | 20 | 23 | 40 | 32 |
| hie-consent-self-management-blockchain-2023 | 42 | 33 | 67 | 53 | 30 | 30 | 42 | 33 | 67 | 53 |
| integrated-blockchain-isdm-framework-2024 | 83 | 70 | 145 | 105 | 46 | 46 | 83 | 67 | 145 | 105 |
| newsvendor-forecasting-smart-contract-2021 | 43 | 34 | 60 | 51 | 26 | 26 | 34 | 34 | 60 | 51 |
| nil-nft-marketplace-2026 | 42 | 31 | 80 | 60 | 33 | 33 | 42 | 31 | 80 | 60 |
| peer-review-token-incentives-2025 | 48 | 37 | 80 | 68 | 32 | 32 | 48 | 37 | 80 | 68 |
| short-end-stick-2025 | 29 | 20 | 28 | 26 | 26 | 26 | 17 | 17 | 23 | 23 |
| ssi-kyc-framework-2022 | 56 | 44 | 119 | 85 | 42 | 42 | 56 | 41 | 119 | 85 |
| trust-capacity-exchange-blockchain-2024 | 70 | 58 | 139 | 95 | 40 | 40 | 70 | 55 | 139 | 95 |
| **Total** | **443** | **351** | **758** | **575** | **304** | **304** | **412** | **338** | **753** | **572** |

Two graph-count details are important:

- Blockchain IoT gains three node declarations because old stored edges already referenced those canonical concepts while the old `nodes` array omitted them. No new semantic edge was introduced.
- Nine canonical concepts that were old graph nodes became orphaned when their only contextual edges were removed. They remain canonical concepts and appear in the Workbench's **Additional concepts not in primary matrix** catalog; they were not deleted.

## Canonical type preservation

| Historical type | Before | `okf-dsr-v1` disposition | After |
|---|---:|---|---:|
| Problem | 14 | Canonical type `Problem` | 14 |
| DesignRequirement | 64 | Canonical type `Design Requirement` | 64 |
| DesignPrinciple | 41 | Canonical type `Design Principle` | 41 |
| DesignFeature | 129 | Canonical type `Design Feature` | 129 |
| Artifact | 31 | Canonical type `Artifact` | 31 |
| Evaluation | 36 | Canonical type `Evaluation` | 36 |
| OutputKnowledge | 36 | Canonical type `Output Knowledge` | 36 |
| ResearchQuestion | 17 | Converted to paper metadata and preserved prose; not a canonical concept type | 0 |
| KernelTheory | 39 | Converted to paper metadata and preserved prose; not a canonical concept type | 0 |
| Limitation | 36 | Converted to paper metadata and preserved prose; not a canonical concept type | 0 |

Every remaining concept uses exactly one of:

- `Problem`
- `Design Requirement`
- `Design Principle`
- `Design Feature`
- `Artifact`
- `Evaluation`
- `Output Knowledge`

Current type counts are 14 problems, 64 requirements, 41 principles, 129 features, 31 artifacts, 36 evaluations, and 36 output-knowledge concepts: **351 total**. Strict validation found zero noncanonical current types.

## Removed concept classification

| Classification requested | Count | Finding |
|---|---:|---|
| Duplicate | 0 | No concept was removed as a duplicate. |
| Noncanonical type | 92 | All removed records used `ResearchQuestion`, `KernelTheory`, or `Limitation`, which are outside the frozen seven-type concept enum. |
| Converted to metadata | 92 | These same 92 records were moved to `research_questions`, `theoretical_foundations`, or `limitations` and copied in full to preserved paper context. |
| Merged into another canonical concept | 0 | No IDs or claims were merged. |
| Invalid/unreferenced | 0 | No concept was discarded as invalid or unreferenced. |
| Accidental / needs restoration | 0 | Exact content checks found no accidental loss. |

### Removed concept counts by paper

| Paper | Research questions | Kernel theories | Limitations | Total |
|---|---:|---:|---:|---:|
| blockchain-iot-sdps-2019 | 3 | 3 | 0 | 6 |
| hie-consent-self-management-blockchain-2023 | 2 | 4 | 3 | 9 |
| integrated-blockchain-isdm-framework-2024 | 3 | 5 | 5 | 13 |
| newsvendor-forecasting-smart-contract-2021 | 2 | 4 | 3 | 9 |
| nil-nft-marketplace-2026 | 1 | 5 | 5 | 11 |
| peer-review-token-incentives-2025 | 1 | 5 | 5 | 11 |
| short-end-stick-2025 | 1 | 3 | 5 | 9 |
| ssi-kyc-framework-2022 | 2 | 5 | 5 | 12 |
| trust-capacity-exchange-blockchain-2024 | 2 | 5 | 5 | 12 |

### Complete removed concept ID inventory

Every item below has disposition **noncanonical context type ? converted to metadata and preserved prose**.

<details><summary><strong>blockchain-iot-sdps-2019</strong> ? 6 records</summary>

- `BLOCKCHAIN_IOT_SDPS_2019:rq_001_challenges_requirements` ? **ResearchQuestion** ? RQ1: SDPS challenges and requirements
- `BLOCKCHAIN_IOT_SDPS_2019:rq_002_principles_features` ? **ResearchQuestion** ? RQ2: Design principles and design features for SDPS
- `BLOCKCHAIN_IOT_SDPS_2019:rq_003_blockchain_value_implications` ? **ResearchQuestion** ? RQ3: Blockchain value proposition and design implications
- `BLOCKCHAIN_IOT_SDPS_2019:kt1_information_asymmetry_certification` ? **KernelTheory** ? Information asymmetry and certification
- `BLOCKCHAIN_IOT_SDPS_2019:kt2_westin_privacy` ? **KernelTheory** ? Westin's theory of privacy
- `BLOCKCHAIN_IOT_SDPS_2019:kt3_delone_mclean_is_success` ? **KernelTheory** ? DeLone and McLean IS success model

</details>

<details><summary><strong>hie-consent-self-management-blockchain-2023</strong> ? 9 records</summary>

- `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rq_001_self_managed_consent_across_distributed_hies` ? **ResearchQuestion** ? How to enable patient consent self-management across distributed HIE systems
- `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rq_002_blockchain_for_private_trusted_auditable_consent` ? **ResearchQuestion** ? How blockchain can support private, trusted, and auditable consent changes
- `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:kt_001_design_science_research_methodology` ? **KernelTheory** ? Design Science Research Methodology
- `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:kt_002_privacy_self_management_and_consent` ? **KernelTheory** ? Privacy self-management and consent rights
- `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:kt_003_blockchain_trust_by_design` ? **KernelTheory** ? Blockchain trust by design
- `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:kt_004_hie_interoperability_and_regulatory_fragmentation` ? **KernelTheory** ? HIE interoperability and regulatory fragmentation
- `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:lim_001_convenience_sample_survey` ? **Limitation** ? Survey uses a convenience sample
- `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:lim_002_context_specific_artifact` ? **Limitation** ? Current artifact is context-specific
- `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:lim_003_prototype_not_fully_optimized` ? **Limitation** ? Prototype network parameters were not substantially optimized

</details>

<details><summary><strong>integrated-blockchain-isdm-framework-2024</strong> ? 13 records</summary>

- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rq_001_design_integrated_framework_for_blockchain_isdms` ? **ResearchQuestion** ? Design an integrated framework for blockchain system development methods
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rq_002_validate_framework_with_experts_and_case_studies` ? **ResearchQuestion** ? Validate the framework through experts and real-world blockchain cases
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rq_003_support_evaluation_and_design_of_in_house_isdms` ? **ResearchQuestion** ? Use the framework to evaluate and design in-house blockchain ISDMs
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:kt_001_information_system_development_methods` ? **KernelTheory** ? Information systems development methods
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:kt_002_method_engineering` ? **KernelTheory** ? Method engineering and method fragments
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:kt_003_design_science_research` ? **KernelTheory** ? Design science research
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:kt_004_blockchain_unique_requirements` ? **KernelTheory** ? Unique blockchain system requirements
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:kt_005_classificatory_framework_quality_criteria` ? **KernelTheory** ? Quality criteria for classificatory frameworks
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:lim_001_tailoring_and_boundary_conditions_not_defined` ? **Limitation** ? Tailoring and boundary conditions are not fully defined
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:lim_002_limited_domain_experts_and_case_studies` ? **Limitation** ? Limited number of experts and case studies
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:lim_003_retrospective_case_interviews` ? **Limitation** ? Retrospective case interviews may affect recall precision
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:lim_004_no_longitudinal_project_lifecycle_evaluation` ? **Limitation** ? No full longitudinal project-lifecycle evaluation
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:lim_005_not_exhaustive_for_all_blockchain_projects` ? **Limitation** ? Not exhaustive for all blockchain projects and domains

</details>

<details><summary><strong>newsvendor-forecasting-smart-contract-2021</strong> ? 9 records</summary>

- `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:rq_001_align_forecaster_and_newsvendor_interests` ? **ResearchQuestion** ? How to align newsvendor and forecaster interests under forecast-based inventory decisions
- `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:rq_002_blockchain_for_forecast_payment_trust` ? **ResearchQuestion** ? How blockchain smart contracts can mitigate trust problems in outcome-contingent forecast payments
- `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:kt_001_newsvendor_model` ? **KernelTheory** ? Newsvendor inventory model
- `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:kt_002_proper_scoring_rules` ? **KernelTheory** ? Proper scoring rules for truthful forecast elicitation
- `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:kt_003_trust_and_trustworthiness` ? **KernelTheory** ? Trust and trustworthiness in forecast sharing and supply chains
- `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:kt_004_blockchain_and_smart_contracts` ? **KernelTheory** ? Blockchain and smart contracts as distributed execution and immutable state infrastructure
- `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:lim_001_outcome_oracle_dependence` ? **Limitation** ? Outcome oracle dependence and manipulation risk
- `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:lim_002_expert_controlled_outcome_not_addressed` ? **Limitation** ? Expert-controlled outcome settings are outside the solution scope
- `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:lim_003_public_chain_cost_and_privacy_constraints` ? **Limitation** ? Public-chain cost volatility and public forecast visibility constraints

</details>

<details><summary><strong>nil-nft-marketplace-2026</strong> ? 11 records</summary>

- `NIL_NFT_MARKETPLACE_2026:rq_001_design_fair_inclusive_nil_marketplace` ? **ResearchQuestion** ? How can a digital-asset marketplace allocate NIL resources fairly and inclusively?
- `NIL_NFT_MARKETPLACE_2026:kt_001_aristotle_equality_principle` ? **KernelTheory** ? Aristotle’s proportional equality principle
- `NIL_NFT_MARKETPLACE_2026:kt_002_roth_market_design` ? **KernelTheory** ? Roth’s market-design conditions
- `NIL_NFT_MARKETPLACE_2026:kt_003_distributive_justice_and_fair_division` ? **KernelTheory** ? Distributive justice and fair-division concepts
- `NIL_NFT_MARKETPLACE_2026:kt_004_possibility_effect` ? **KernelTheory** ? Possibility effect under uncertainty
- `NIL_NFT_MARKETPLACE_2026:kt_005_design_science_methodology` ? **KernelTheory** ? Peffers et al. design science research methodology
- `NIL_NFT_MARKETPLACE_2026:lim_001_requires_players_and_fan_demand` ? **Limitation** ? Boundary condition: requires players and fan demand
- `NIL_NFT_MARKETPLACE_2026:lim_002_technology_adoption_trust_and_usability` ? **Limitation** ? Blockchain/NFT adoption, trust, and usability barriers
- `NIL_NFT_MARKETPLACE_2026:lim_003_community_and_stakeholder_participation_needed` ? **Limitation** ? Need for fan community and institutional stakeholder participation
- `NIL_NFT_MARKETPLACE_2026:lim_004_privacy_regulatory_and_speculation_risks` ? **Limitation** ? Privacy, regulatory, speculation, and exploitation risks
- `NIL_NFT_MARKETPLACE_2026:lim_005_qualitative_evaluation_only` ? **Limitation** ? Need for quantitative and behavioral validation

</details>

<details><summary><strong>peer-review-token-incentives-2025</strong> ? 11 records</summary>

- `PEER_REVIEW_TOKEN_INCENTIVES_2025:rq_001_design_peer_review_incentive_systems` ? **ResearchQuestion** ? How can peer review systems be effectively designed to better incentivize reviewers?
- `PEER_REVIEW_TOKEN_INCENTIVES_2025:kt_001_organismic_integration_theory` ? **KernelTheory** ? Organismic Integration Theory for reviewer motivation
- `PEER_REVIEW_TOKEN_INCENTIVES_2025:kt_002_expectancy_theory` ? **KernelTheory** ? Expectancy theory for flexible reward preferences
- `PEER_REVIEW_TOKEN_INCENTIVES_2025:kt_003_information_systems_success_model` ? **KernelTheory** ? Information Systems Success Model for adoption evaluation
- `PEER_REVIEW_TOKEN_INCENTIVES_2025:kt_004_gregor_jones_design_theory` ? **KernelTheory** ? Gregor and Jones design theory anatomy
- `PEER_REVIEW_TOKEN_INCENTIVES_2025:kt_005_blockchain_adoption_decision_model` ? **KernelTheory** ? Blockchain adoption decision model
- `PEER_REVIEW_TOKEN_INCENTIVES_2025:lim_001_adoption_and_usability_resistance` ? **Limitation** ? Adoption and usability resistance from nontechnical stakeholders
- `PEER_REVIEW_TOKEN_INCENTIVES_2025:lim_002_funding_model_uncertainty` ? **Limitation** ? Uncertain funding model for reviewer compensation
- `PEER_REVIEW_TOKEN_INCENTIVES_2025:lim_003_review_quality_gaming_risk` ? **Limitation** ? Risk of quantity-over-quality review behavior
- `PEER_REVIEW_TOKEN_INCENTIVES_2025:lim_004_token_volatility_and_revocation_challenges` ? **Limitation** ? Token volatility and soulbound-token revocation challenges
- `PEER_REVIEW_TOKEN_INCENTIVES_2025:lim_005_no_live_peer_review_deployment_yet` ? **Limitation** ? Lack of live peer-review deployment validation

</details>

<details><summary><strong>short-end-stick-2025</strong> ? 9 records</summary>

- `SHORT_END_STICK_2025:rq_001` ? **ResearchQuestion** ? Design of an IS for simultaneous prevention of poaching and manipulation
- `SHORT_END_STICK_2025:kt_001_transaction_cost_economics_and_opportunism` ? **KernelTheory** ? Transaction cost economics and opportunism
- `SHORT_END_STICK_2025:kt_002_information_poaching_and_information_manipulation_literature` ? **KernelTheory** ? Information poaching and information manipulation literature
- `SHORT_END_STICK_2025:kt_003_blockchain_governance_and_smart_contracts` ? **KernelTheory** ? Blockchain governance, smart contracts, and private data collections
- `SHORT_END_STICK_2025:lim_001_best_when_both_sides_fear_opportunism` ? **Limitation** ? Most effective when both parties fear opportunism
- `SHORT_END_STICK_2025:lim_002_nonreversible_function_definition_cost` ? **Limitation** ? Nonreversible functions can be costly to define
- `SHORT_END_STICK_2025:lim_003_blockchain_network_integrity_dependency` ? **Limitation** ? Dependency on blockchain network integrity
- `SHORT_END_STICK_2025:lim_004_first_mile_problem` ? **Limitation** ? First-mile problem before data enter the shared IS
- `SHORT_END_STICK_2025:lim_005_artificial_utility_evaluation` ? **Limitation** ? Artificial utility evaluation

</details>

<details><summary><strong>ssi-kyc-framework-2022</strong> ? 12 records</summary>

- `SSI_KYC_FRAMEWORK_2022:rq_001_design_ssi_based_ekyc_framework` ? **ResearchQuestion** ? How can blockchain-based SSI support the complete digital KYC process?
- `SSI_KYC_FRAMEWORK_2022:rq_002_derive_design_principles_for_blockchain_based_ssi` ? **ResearchQuestion** ? What generic design principles guide blockchain-based SSI systems?
- `SSI_KYC_FRAMEWORK_2022:kt_001_peffers_dsrm` ? **KernelTheory** ? Peffers et al. design science research methodology
- `SSI_KYC_FRAMEWORK_2022:kt_002_self_sovereign_identity` ? **KernelTheory** ? Self-sovereign identity
- `SSI_KYC_FRAMEWORK_2022:kt_003_verifiable_credentials_and_dids_standards` ? **KernelTheory** ? DID and verifiable credential standards
- `SSI_KYC_FRAMEWORK_2022:kt_004_gdpr_and_eidas_regulatory_context` ? **KernelTheory** ? GDPR, AML/KYC, and eIDAS regulatory context
- `SSI_KYC_FRAMEWORK_2022:kt_005_blockchain_as_neutral_cross_organizational_infrastructure` ? **KernelTheory** ? Blockchain as neutral cross-organizational infrastructure
- `SSI_KYC_FRAMEWORK_2022:lim_001_governance_and_adoption_challenges` ? **Limitation** ? Governance and adoption challenges remain unresolved
- `SSI_KYC_FRAMEWORK_2022:lim_002_no_real_world_deployment_yet` ? **Limitation** ? No real-world deployment evaluation yet
- `SSI_KYC_FRAMEWORK_2022:lim_003_regulatory_interpretation_uncertainty` ? **Limitation** ? Regulatory interpretation uncertainty
- `SSI_KYC_FRAMEWORK_2022:lim_004_wallet_usability_and_recovery_risk` ? **Limitation** ? Wallet usability and recovery risk
- `SSI_KYC_FRAMEWORK_2022:lim_005_interbank_trust_and_standard_acceptance` ? **Limitation** ? Interbank trust and credential acceptance require governance

</details>

<details><summary><strong>trust-capacity-exchange-blockchain-2024</strong> ? 12 records</summary>

- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact` ? **ResearchQuestion** ? How to design an artifact that establishes trust in inter-organizational capacity exchange?
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_002_generate_design_knowledge_on_blockchain_trust` ? **ResearchQuestion** ? How and why can blockchain affect perceived inter-organizational trust?
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_001_transaction_costs_and_interorganizational_trust` ? **KernelTheory** ? Transaction cost theory and inter-organizational trust
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_002_agency_theory_behavioral_uncertainty` ? **KernelTheory** ? Agency theory and behavioral uncertainty
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_003_signaling_screening_authority_reputation` ? **KernelTheory** ? Cooperation designs: signaling, screening, authority, incentives, and reputation
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_004_blockchain_as_trust_enabling_infrastructure` ? **KernelTheory** ? Blockchain as trust-enabling infrastructure
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_005_design_principle_reusability` ? **KernelTheory** ? Design principles as reusable prescriptive knowledge
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:lim_001_artificial_small_sample_single_case` ? **Limitation** ? Artificial setting, small sample, and single instantiation limit generalization
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:lim_002_blockchain_not_sufficient_without_design_principles` ? **Limitation** ? Blockchain alone is insufficient for trust
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:lim_003_design_principle_interdependencies_complicate_causality` ? **Limitation** ? Design-principle interdependencies complicate isolated causal claims
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:lim_004_permissioned_testnet_not_mainnet` ? **Limitation** ? Controlled testnet differs from a real public blockchain environment
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:lim_005_need_for_broader_variables_and_domains` ? **Limitation** ? Further experiments need more variables, participants, and domains

</details>

## Removed relation classification

| Classification requested | Count | Finding |
|---|---:|---|
| Duplicate | 0 | No relation was removed as a duplicate. |
| Invalid endpoint after schema freeze | 183 | Every removed relation touches a record converted from a concept endpoint into paper metadata. |
| Noncanonical predicate | 0 | No relation was removed because of its predicate. |
| Replaced by `graph.json` edge | 0 | Relations remain canonical; `graph.json` is only a stored projection and never replaces relation facts. |
| Accidental / needs restoration | 0 | Every canonical-to-canonical relation remains unchanged. |

The phrase **invalid endpoint** is schema-relative: these relations were valid in the broader pre-v1 graph, but one or both endpoints are no longer canonical DSR concepts. The relation statements are retained in paper context rather than silently discarded.

### Removed relation counts by paper

| Paper | Removed contextual relations |
|---|---:|
| blockchain-iot-sdps-2019 | 8 |
| hie-consent-self-management-blockchain-2023 | 14 |
| integrated-blockchain-isdm-framework-2024 | 40 |
| newsvendor-forecasting-smart-contract-2021 | 9 |
| nil-nft-marketplace-2026 | 20 |
| peer-review-token-incentives-2025 | 12 |
| short-end-stick-2025 | 2 |
| ssi-kyc-framework-2022 | 34 |
| trust-capacity-exchange-blockchain-2024 | 44 |

### Complete removed relation ID inventory

Each entry is preserved in the corresponding paper's contextual-links section.

<details><summary><strong>blockchain-iot-sdps-2019</strong> ? 8 relations</summary>

- `BLOCKCHAIN_IOT_SDPS_2019:rel_001`: `BLOCKCHAIN_IOT_SDPS_2019:prob_001_iot_sensor_data_protection_problem` ? **motivates** ? `BLOCKCHAIN_IOT_SDPS_2019:rq_001_challenges_requirements`; evidence `BLOCKCHAIN_IOT_SDPS_2019:ev_002_research_questions`
- `BLOCKCHAIN_IOT_SDPS_2019:rel_002`: `BLOCKCHAIN_IOT_SDPS_2019:prob_001_iot_sensor_data_protection_problem` ? **motivates** ? `BLOCKCHAIN_IOT_SDPS_2019:rq_002_principles_features`; evidence `BLOCKCHAIN_IOT_SDPS_2019:ev_002_research_questions`
- `BLOCKCHAIN_IOT_SDPS_2019:rel_003`: `BLOCKCHAIN_IOT_SDPS_2019:prob_001_iot_sensor_data_protection_problem` ? **motivates** ? `BLOCKCHAIN_IOT_SDPS_2019:rq_003_blockchain_value_implications`; evidence `BLOCKCHAIN_IOT_SDPS_2019:ev_002_research_questions`
- `BLOCKCHAIN_IOT_SDPS_2019:rel_036`: `BLOCKCHAIN_IOT_SDPS_2019:rq_003_blockchain_value_implications` ? **contributes_to** ? `BLOCKCHAIN_IOT_SDPS_2019:ok2_blockchain_sdps_usage_implications`; evidence `BLOCKCHAIN_IOT_SDPS_2019:ev_024_blockchain_usage_implications`
- `BLOCKCHAIN_IOT_SDPS_2019:rel_037`: `BLOCKCHAIN_IOT_SDPS_2019:kt1_information_asymmetry_certification` ? **derived_from** ? `BLOCKCHAIN_IOT_SDPS_2019:dp1_source_to_sink_certification`; evidence `BLOCKCHAIN_IOT_SDPS_2019:ev_010_dp1`
- `BLOCKCHAIN_IOT_SDPS_2019:rel_038`: `BLOCKCHAIN_IOT_SDPS_2019:kt1_information_asymmetry_certification` ? **derived_from** ? `BLOCKCHAIN_IOT_SDPS_2019:dp2_cross_validation_certification`; evidence `BLOCKCHAIN_IOT_SDPS_2019:ev_011_dp2`
- `BLOCKCHAIN_IOT_SDPS_2019:rel_039`: `BLOCKCHAIN_IOT_SDPS_2019:kt2_westin_privacy` ? **derived_from** ? `BLOCKCHAIN_IOT_SDPS_2019:dp3_data_owner_controlled_disclosure`; evidence `BLOCKCHAIN_IOT_SDPS_2019:ev_012_dp3`
- `BLOCKCHAIN_IOT_SDPS_2019:rel_040`: `BLOCKCHAIN_IOT_SDPS_2019:kt3_delone_mclean_is_success` ? **derived_from** ? `BLOCKCHAIN_IOT_SDPS_2019:dp4_linearly_scalable_architecture`; evidence `BLOCKCHAIN_IOT_SDPS_2019:ev_013_dp4`

</details>

<details><summary><strong>hie-consent-self-management-blockchain-2023</strong> ? 14 relations</summary>

- `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_001`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:prob_001_fragmented_hie_consent_self_management_problem` ? **motivates** ? `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rq_001_self_managed_consent_across_distributed_hies`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_004_research_objective`
- `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_002`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:prob_001_fragmented_hie_consent_self_management_problem` ? **motivates** ? `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rq_002_blockchain_for_private_trusted_auditable_consent`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_004_research_objective`
- `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_008`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rq_001_self_managed_consent_across_distributed_hies` ? **requires** ? `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_001_privacy_of_consent_status`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_011_privacy_requirement`
- `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_009`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rq_001_self_managed_consent_across_distributed_hies` ? **requires** ? `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_002_patient_self_management`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_012_self_management_requirement`
- `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_010`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rq_001_self_managed_consent_across_distributed_hies` ? **requires** ? `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_003_patient_and_hie_trust`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_013_trust_requirement`
- `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_011`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rq_001_self_managed_consent_across_distributed_hies` ? **requires** ? `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_004_regulatory_compliance_and_auditability`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_014_compliance_requirement`
- `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_012`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rq_001_self_managed_consent_across_distributed_hies` ? **requires** ? `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_005_interoperability_across_fragmented_hies`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_015_interoperability_requirement`
- `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_061`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:kt_001_design_science_research_methodology` ? **derived_from** ? `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:art_002_blockchain_consent_self_management_dapp`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_007_dsrm_two_iterations`
- `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_062`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:kt_002_privacy_self_management_and_consent` ? **derived_from** ? `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_002_patient_self_management`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_012_self_management_requirement`
- `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_063`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:kt_003_blockchain_trust_by_design` ? **derived_from** ? `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dp_003_auditable_consent_transaction_history`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_017_blockchain_decision_path`
- `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_064`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:kt_004_hie_interoperability_and_regulatory_fragmentation` ? **derived_from** ? `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_005_interoperability_across_fragmented_hies`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_015_interoperability_requirement`
- `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_065`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:lim_001_convenience_sample_survey` ? **contrasts_with** ? `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:eval_001_patient_survey_evaluation`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_026_limitations`
- `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_066`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:lim_002_context_specific_artifact` ? **contrasts_with** ? `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ok_004_design_generalizes_to_private_information_sharing_with_auditable_history`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_025_conclusion_design_knowledge`
- `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rel_067`: `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:lim_003_prototype_not_fully_optimized` ? **contrasts_with** ? `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:eval_003_blockchain_performance_evaluation`; evidence `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_024_cost_evaluation`

</details>

<details><summary><strong>integrated-blockchain-isdm-framework-2024</strong> ? 40 relations</summary>

- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_001`: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:prob_001_lack_integrated_blockchain_isdm` ? **motivates** ? `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rq_001_design_integrated_framework_for_blockchain_isdms`; evidence `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_004_research_objective`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_002`: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:prob_001_lack_integrated_blockchain_isdm` ? **motivates** ? `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rq_003_support_evaluation_and_design_of_in_house_isdms`; evidence `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_025_framework_practical_yardstick`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_003`: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:prob_002_blockchain_development_complexity_and_failures` ? **motivates** ? `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rq_001_design_integrated_framework_for_blockchain_isdms`; evidence `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_004_research_objective`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_004`: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:prob_002_blockchain_development_complexity_and_failures` ? **motivates** ? `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rq_003_support_evaluation_and_design_of_in_house_isdms`; evidence `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_025_framework_practical_yardstick`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_005`: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:prob_003_fragmented_technical_and_partial_method_knowledge` ? **motivates** ? `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rq_001_design_integrated_framework_for_blockchain_isdms`; evidence `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_004_research_objective`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_006`: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:prob_003_fragmented_technical_and_partial_method_knowledge` ? **motivates** ? `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rq_003_support_evaluation_and_design_of_in_house_isdms`; evidence `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_025_framework_practical_yardstick`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_007`: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rq_001_design_integrated_framework_for_blockchain_isdms` ? **requires** ? `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rq_002_validate_framework_with_experts_and_case_studies`; evidence `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_009_dsr_iterations`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_008`: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rq_001_design_integrated_framework_for_blockchain_isdms` ? **requires** ? `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_001_comprehensiveness`; evidence `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_007_quality_criteria`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_009`: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rq_001_design_integrated_framework_for_blockchain_isdms` ? **requires** ? `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_002_generality`; evidence `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_007_quality_criteria`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_010`: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rq_001_design_integrated_framework_for_blockchain_isdms` ? **requires** ? `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_003_soundness`; evidence `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_007_quality_criteria`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_011`: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rq_001_design_integrated_framework_for_blockchain_isdms` ? **requires** ? `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_004_security_and_privacy`; evidence `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_006_unique_requirements`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_012`: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rq_001_design_integrated_framework_for_blockchain_isdms` ? **requires** ? `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_005_scalability_and_performance`; evidence `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_006_unique_requirements`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_013`: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rq_001_design_integrated_framework_for_blockchain_isdms` ? **requires** ? `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_006_interoperability`; evidence `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_006_unique_requirements`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_014`: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rq_001_design_integrated_framework_for_blockchain_isdms` ? **requires** ? `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_007_energy_and_gas_efficiency`; evidence `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_006_unique_requirements`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_015`: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rq_001_design_integrated_framework_for_blockchain_isdms` ? **requires** ? `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_008_maintainability`; evidence `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_006_unique_requirements`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_016`: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rq_001_design_integrated_framework_for_blockchain_isdms` ? **requires** ? `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_009_platform_and_language_fit`; evidence `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_006_unique_requirements`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_122`: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dp_001_organize_isdm_by_process_roles_models` ? **derived_from** ? `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:kt_001_information_system_development_methods`; evidence `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_008_isdm_core_aspects`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_123`: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dp_001_organize_isdm_by_process_roles_models` ? **derived_from** ? `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:kt_002_method_engineering`; evidence `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_044_method_engineering_artifact`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_124`: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dp_002_conduct_blockchain_specific_analysis_before_design` ? **derived_from** ? `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:kt_001_information_system_development_methods`; evidence `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_008_isdm_core_aspects`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_125`: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dp_002_conduct_blockchain_specific_analysis_before_design` ? **derived_from** ? `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:kt_002_method_engineering`; evidence `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_044_method_engineering_artifact`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_126`: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dp_003_separate_preliminary_architecture_from_detailed_design` ? **derived_from** ? `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:kt_001_information_system_development_methods`; evidence `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_008_isdm_core_aspects`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_127`: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dp_003_separate_preliminary_architecture_from_detailed_design` ? **derived_from** ? `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:kt_002_method_engineering`; evidence `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_044_method_engineering_artifact`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_128`: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dp_004_design_blockchain_specific_protocols_and_contract_details` ? **derived_from** ? `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:kt_001_information_system_development_methods`; evidence `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_008_isdm_core_aspects`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_129`: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dp_004_design_blockchain_specific_protocols_and_contract_details` ? **derived_from** ? `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:kt_002_method_engineering`; evidence `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_044_method_engineering_artifact`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_130`: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dp_005_construct_test_integrate_and_transition_smart_contracts` ? **derived_from** ? `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:kt_001_information_system_development_methods`; evidence `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_008_isdm_core_aspects`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_131`: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dp_005_construct_test_integrate_and_transition_smart_contracts` ? **derived_from** ? `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:kt_002_method_engineering`; evidence `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_044_method_engineering_artifact`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_132`: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dp_006_plan_operation_maintenance_and_retirement` ? **derived_from** ? `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:kt_001_information_system_development_methods`; evidence `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_008_isdm_core_aspects`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_133`: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dp_006_plan_operation_maintenance_and_retirement` ? **derived_from** ? `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:kt_002_method_engineering`; evidence `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_044_method_engineering_artifact`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_134`: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dp_007_evaluate_isdms_using_comprehensiveness_generality_soundness` ? **derived_from** ? `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:kt_005_classificatory_framework_quality_criteria`; evidence `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_007_quality_criteria`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_135`: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_004_security_and_privacy` ? **derived_from** ? `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:kt_004_blockchain_unique_requirements`; evidence `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_006_unique_requirements`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_136`: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_005_scalability_and_performance` ? **derived_from** ? `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:kt_004_blockchain_unique_requirements`; evidence `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_006_unique_requirements`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_137`: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_006_interoperability` ? **derived_from** ? `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:kt_004_blockchain_unique_requirements`; evidence `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_006_unique_requirements`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_138`: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_007_energy_and_gas_efficiency` ? **derived_from** ? `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:kt_004_blockchain_unique_requirements`; evidence `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_006_unique_requirements`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_139`: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_008_maintainability` ? **derived_from** ? `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:kt_004_blockchain_unique_requirements`; evidence `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_006_unique_requirements`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_140`: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_009_platform_and_language_fit` ? **derived_from** ? `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:kt_004_blockchain_unique_requirements`; evidence `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_006_unique_requirements`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_141`: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:art_001_integrated_blockchain_isdm_framework` ? **supported_by** ? `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:lim_001_tailoring_and_boundary_conditions_not_defined`; evidence `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_030_tailoring_future_work`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_142`: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:art_001_integrated_blockchain_isdm_framework` ? **supported_by** ? `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:lim_002_limited_domain_experts_and_case_studies`; evidence `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_031_limited_experts_cases`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_143`: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:art_001_integrated_blockchain_isdm_framework` ? **supported_by** ? `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:lim_003_retrospective_case_interviews`; evidence `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_032_retrospective_interviews`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_144`: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:art_001_integrated_blockchain_isdm_framework` ? **supported_by** ? `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:lim_004_no_longitudinal_project_lifecycle_evaluation`; evidence `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_033_longitudinal_evaluation`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rel_145`: `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:art_001_integrated_blockchain_isdm_framework` ? **supported_by** ? `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:lim_005_not_exhaustive_for_all_blockchain_projects`; evidence `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_031_limited_experts_cases`

</details>

<details><summary><strong>newsvendor-forecasting-smart-contract-2021</strong> ? 9 relations</summary>

- `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:rel_001`: `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:prob_001_forecast_incentive_trust_problem` ? **motivates** ? `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:rq_001_align_forecaster_and_newsvendor_interests`; evidence `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_004_normative_contributions`
- `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:rel_002`: `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:prob_001_forecast_incentive_trust_problem` ? **motivates** ? `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:rq_002_blockchain_for_forecast_payment_trust`; evidence `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_004_normative_contributions`
- `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:rel_010`: `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:kt_001_newsvendor_model` ? **derived_from** ? `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:prob_001_forecast_incentive_trust_problem`; evidence `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_006_newsvendor_model`
- `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:rel_011`: `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:kt_002_proper_scoring_rules` ? **derived_from** ? `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:prob_001_forecast_incentive_trust_problem`; evidence `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_005_proper_scoring_rules`
- `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:rel_012`: `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:kt_003_trust_and_trustworthiness` ? **derived_from** ? `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:prob_001_forecast_incentive_trust_problem`; evidence `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_009_trust_in_forecast_sharing`
- `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:rel_013`: `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:kt_004_blockchain_and_smart_contracts` ? **derived_from** ? `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:prob_001_forecast_incentive_trust_problem`; evidence `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_010_blockchain_transparency_high_effort`
- `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:rel_058`: `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:lim_001_outcome_oracle_dependence` ? **contributes_to** ? `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ok_004_deployment_fit_requires_cost_privacy_and_oracle_choices`; evidence `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_019_oracles_and_disputes`
- `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:rel_059`: `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:lim_002_expert_controlled_outcome_not_addressed` ? **contributes_to** ? `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ok_004_deployment_fit_requires_cost_privacy_and_oracle_choices`; evidence `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_026_future_work_limitations`
- `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:rel_060`: `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:lim_003_public_chain_cost_and_privacy_constraints` ? **contributes_to** ? `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ok_004_deployment_fit_requires_cost_privacy_and_oracle_choices`; evidence `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_020_cost_public_blockchain`

</details>

<details><summary><strong>nil-nft-marketplace-2026</strong> ? 20 relations</summary>

- `NIL_NFT_MARKETPLACE_2026:rel_001`: `NIL_NFT_MARKETPLACE_2026:prob_001_nil_fairness_inclusiveness_problem` ? **motivates** ? `NIL_NFT_MARKETPLACE_2026:rq_001_design_fair_inclusive_nil_marketplace`; evidence `NIL_NFT_MARKETPLACE_2026:ev_001_abstract_problem_solution`
- `NIL_NFT_MARKETPLACE_2026:rel_003`: `NIL_NFT_MARKETPLACE_2026:rq_001_design_fair_inclusive_nil_marketplace` ? **requires** ? `NIL_NFT_MARKETPLACE_2026:dr_001_inclusiveness`; evidence `NIL_NFT_MARKETPLACE_2026:ev_013_design_requirements_overview`
- `NIL_NFT_MARKETPLACE_2026:rel_005`: `NIL_NFT_MARKETPLACE_2026:rq_001_design_fair_inclusive_nil_marketplace` ? **requires** ? `NIL_NFT_MARKETPLACE_2026:dr_002_meritocratic_allocation`; evidence `NIL_NFT_MARKETPLACE_2026:ev_013_design_requirements_overview`
- `NIL_NFT_MARKETPLACE_2026:rel_007`: `NIL_NFT_MARKETPLACE_2026:rq_001_design_fair_inclusive_nil_marketplace` ? **requires** ? `NIL_NFT_MARKETPLACE_2026:dr_003_market_thickness`; evidence `NIL_NFT_MARKETPLACE_2026:ev_013_design_requirements_overview`
- `NIL_NFT_MARKETPLACE_2026:rel_009`: `NIL_NFT_MARKETPLACE_2026:rq_001_design_fair_inclusive_nil_marketplace` ? **requires** ? `NIL_NFT_MARKETPLACE_2026:dr_004_no_congestion`; evidence `NIL_NFT_MARKETPLACE_2026:ev_013_design_requirements_overview`
- `NIL_NFT_MARKETPLACE_2026:rel_011`: `NIL_NFT_MARKETPLACE_2026:rq_001_design_fair_inclusive_nil_marketplace` ? **requires** ? `NIL_NFT_MARKETPLACE_2026:dr_005_market_safety`; evidence `NIL_NFT_MARKETPLACE_2026:ev_013_design_requirements_overview`
- `NIL_NFT_MARKETPLACE_2026:rel_063`: `NIL_NFT_MARKETPLACE_2026:kt_001_aristotle_equality_principle` ? **derived_from** ? `NIL_NFT_MARKETPLACE_2026:dr_002_meritocratic_allocation`; evidence `NIL_NFT_MARKETPLACE_2026:ev_015_meritocratic_requirement`
- `NIL_NFT_MARKETPLACE_2026:rel_064`: `NIL_NFT_MARKETPLACE_2026:kt_001_aristotle_equality_principle` ? **derived_from** ? `NIL_NFT_MARKETPLACE_2026:dp_002_market_royalties`; evidence `NIL_NFT_MARKETPLACE_2026:ev_018_market_royalties_principle`
- `NIL_NFT_MARKETPLACE_2026:rel_065`: `NIL_NFT_MARKETPLACE_2026:kt_002_roth_market_design` ? **derived_from** ? `NIL_NFT_MARKETPLACE_2026:dr_003_market_thickness`; evidence `NIL_NFT_MARKETPLACE_2026:ev_009_market_design_conditions`
- `NIL_NFT_MARKETPLACE_2026:rel_066`: `NIL_NFT_MARKETPLACE_2026:kt_002_roth_market_design` ? **derived_from** ? `NIL_NFT_MARKETPLACE_2026:dr_004_no_congestion`; evidence `NIL_NFT_MARKETPLACE_2026:ev_009_market_design_conditions`
- `NIL_NFT_MARKETPLACE_2026:rel_067`: `NIL_NFT_MARKETPLACE_2026:kt_002_roth_market_design` ? **derived_from** ? `NIL_NFT_MARKETPLACE_2026:dr_005_market_safety`; evidence `NIL_NFT_MARKETPLACE_2026:ev_009_market_design_conditions`
- `NIL_NFT_MARKETPLACE_2026:rel_068`: `NIL_NFT_MARKETPLACE_2026:kt_002_roth_market_design` ? **derived_from** ? `NIL_NFT_MARKETPLACE_2026:dp_003_blockchain_based_marketplace`; evidence `NIL_NFT_MARKETPLACE_2026:ev_019_blockchain_marketplace_principle`
- `NIL_NFT_MARKETPLACE_2026:rel_069`: `NIL_NFT_MARKETPLACE_2026:kt_003_distributive_justice_and_fair_division` ? **derived_from** ? `NIL_NFT_MARKETPLACE_2026:ok_001_inclusive_meritocratic_fairness_criterion`; evidence `NIL_NFT_MARKETPLACE_2026:ev_005_inclusive_meritocratic_definition`
- `NIL_NFT_MARKETPLACE_2026:rel_070`: `NIL_NFT_MARKETPLACE_2026:kt_004_possibility_effect` ? **derived_from** ? `NIL_NFT_MARKETPLACE_2026:dp_001_plausible_events`; evidence `NIL_NFT_MARKETPLACE_2026:ev_017_plausible_events_principle`
- `NIL_NFT_MARKETPLACE_2026:rel_071`: `NIL_NFT_MARKETPLACE_2026:kt_005_design_science_methodology` ? **derived_from** ? `NIL_NFT_MARKETPLACE_2026:eval_001_problem_validation_interviews`; evidence `NIL_NFT_MARKETPLACE_2026:ev_011_dsrm_process`
- `NIL_NFT_MARKETPLACE_2026:rel_076`: `NIL_NFT_MARKETPLACE_2026:lim_001_requires_players_and_fan_demand` ? **contrasts_with** ? `NIL_NFT_MARKETPLACE_2026:art_001_fair_inclusive_nil_nft_marketplace`; evidence `NIL_NFT_MARKETPLACE_2026:ev_029_design_theory_boundary_conditions`
- `NIL_NFT_MARKETPLACE_2026:rel_077`: `NIL_NFT_MARKETPLACE_2026:lim_002_technology_adoption_trust_and_usability` ? **contrasts_with** ? `NIL_NFT_MARKETPLACE_2026:art_002_student_athlete_collectibles_dapp`; evidence `NIL_NFT_MARKETPLACE_2026:ev_033_quantitative_validation_needed`
- `NIL_NFT_MARKETPLACE_2026:rel_078`: `NIL_NFT_MARKETPLACE_2026:lim_003_community_and_stakeholder_participation_needed` ? **contrasts_with** ? `NIL_NFT_MARKETPLACE_2026:art_001_fair_inclusive_nil_nft_marketplace`; evidence `NIL_NFT_MARKETPLACE_2026:ev_029_design_theory_boundary_conditions`
- `NIL_NFT_MARKETPLACE_2026:rel_079`: `NIL_NFT_MARKETPLACE_2026:lim_004_privacy_regulatory_and_speculation_risks` ? **contrasts_with** ? `NIL_NFT_MARKETPLACE_2026:df_006_public_blockchain_nft_marketplace`; evidence `NIL_NFT_MARKETPLACE_2026:ev_032_ethical_regulatory_risks`
- `NIL_NFT_MARKETPLACE_2026:rel_080`: `NIL_NFT_MARKETPLACE_2026:lim_005_qualitative_evaluation_only` ? **contrasts_with** ? `NIL_NFT_MARKETPLACE_2026:eval_003_student_athlete_interview_evaluation`; evidence `NIL_NFT_MARKETPLACE_2026:ev_033_quantitative_validation_needed`

</details>

<details><summary><strong>peer-review-token-incentives-2025</strong> ? 12 relations</summary>

- `PEER_REVIEW_TOKEN_INCENTIVES_2025:rel_001`: `PEER_REVIEW_TOKEN_INCENTIVES_2025:prob_001_peer_review_incentive_shortage_problem` ? **motivates** ? `PEER_REVIEW_TOKEN_INCENTIVES_2025:rq_001_design_peer_review_incentive_systems`; evidence `PEER_REVIEW_TOKEN_INCENTIVES_2025:ev_003_research_question`
- `PEER_REVIEW_TOKEN_INCENTIVES_2025:rel_009`: `PEER_REVIEW_TOKEN_INCENTIVES_2025:kt_001_organismic_integration_theory` ? **derived_from** ? `PEER_REVIEW_TOKEN_INCENTIVES_2025:dp_001_incentives`; evidence `PEER_REVIEW_TOKEN_INCENTIVES_2025:ev_009_incentives_design_principle`
- `PEER_REVIEW_TOKEN_INCENTIVES_2025:rel_010`: `PEER_REVIEW_TOKEN_INCENTIVES_2025:kt_002_expectancy_theory` ? **derived_from** ? `PEER_REVIEW_TOKEN_INCENTIVES_2025:dp_002_flexibility`; evidence `PEER_REVIEW_TOKEN_INCENTIVES_2025:ev_010_flexibility_design_principle`
- `PEER_REVIEW_TOKEN_INCENTIVES_2025:rel_011`: `PEER_REVIEW_TOKEN_INCENTIVES_2025:kt_003_information_systems_success_model` ? **derived_from** ? `PEER_REVIEW_TOKEN_INCENTIVES_2025:eval_004_field_survey_system_users`; evidence `PEER_REVIEW_TOKEN_INCENTIVES_2025:ev_026_survey_results`
- `PEER_REVIEW_TOKEN_INCENTIVES_2025:rel_012`: `PEER_REVIEW_TOKEN_INCENTIVES_2025:kt_004_gregor_jones_design_theory` ? **derived_from** ? `PEER_REVIEW_TOKEN_INCENTIVES_2025:ok_004_formal_design_theory_for_peer_review_incentives`; evidence `PEER_REVIEW_TOKEN_INCENTIVES_2025:ev_029_design_theory_components`
- `PEER_REVIEW_TOKEN_INCENTIVES_2025:rel_013`: `PEER_REVIEW_TOKEN_INCENTIVES_2025:kt_005_blockchain_adoption_decision_model` ? **derived_from** ? `PEER_REVIEW_TOKEN_INCENTIVES_2025:df_004_public_blockchain_reward_infrastructure`; evidence `PEER_REVIEW_TOKEN_INCENTIVES_2025:ev_016_public_blockchain_decision`
- `PEER_REVIEW_TOKEN_INCENTIVES_2025:rel_033`: `PEER_REVIEW_TOKEN_INCENTIVES_2025:dr_007_mitigate_review_quality_gaming` ? **addressed_by** ? `PEER_REVIEW_TOKEN_INCENTIVES_2025:lim_003_review_quality_gaming_risk`; evidence `PEER_REVIEW_TOKEN_INCENTIVES_2025:ev_031_limitations_quality_and_gaming`
- `PEER_REVIEW_TOKEN_INCENTIVES_2025:rel_076`: `PEER_REVIEW_TOKEN_INCENTIVES_2025:lim_001_adoption_and_usability_resistance` ? **contrasts_with** ? `PEER_REVIEW_TOKEN_INCENTIVES_2025:art_001_token_based_peer_review_incentive_system`; evidence `PEER_REVIEW_TOKEN_INCENTIVES_2025:ev_030_limitations_adoption_and_usability`
- `PEER_REVIEW_TOKEN_INCENTIVES_2025:rel_077`: `PEER_REVIEW_TOKEN_INCENTIVES_2025:lim_002_funding_model_uncertainty` ? **contrasts_with** ? `PEER_REVIEW_TOKEN_INCENTIVES_2025:df_008_fungible_reward_tokens`; evidence `PEER_REVIEW_TOKEN_INCENTIVES_2025:ev_030_limitations_adoption_and_usability`
- `PEER_REVIEW_TOKEN_INCENTIVES_2025:rel_078`: `PEER_REVIEW_TOKEN_INCENTIVES_2025:lim_003_review_quality_gaming_risk` ? **contrasts_with** ? `PEER_REVIEW_TOKEN_INCENTIVES_2025:df_008_fungible_reward_tokens`; evidence `PEER_REVIEW_TOKEN_INCENTIVES_2025:ev_031_limitations_quality_and_gaming`
- `PEER_REVIEW_TOKEN_INCENTIVES_2025:rel_079`: `PEER_REVIEW_TOKEN_INCENTIVES_2025:lim_004_token_volatility_and_revocation_challenges` ? **contrasts_with** ? `PEER_REVIEW_TOKEN_INCENTIVES_2025:df_007_soulbound_reputation_tokens`; evidence `PEER_REVIEW_TOKEN_INCENTIVES_2025:ev_030_limitations_adoption_and_usability`
- `PEER_REVIEW_TOKEN_INCENTIVES_2025:rel_080`: `PEER_REVIEW_TOKEN_INCENTIVES_2025:lim_005_no_live_peer_review_deployment_yet` ? **contrasts_with** ? `PEER_REVIEW_TOKEN_INCENTIVES_2025:eval_005_qualitative_editor_reviewer_evaluation`; evidence `PEER_REVIEW_TOKEN_INCENTIVES_2025:ev_032_limitations_real_world_implementation`

</details>

<details><summary><strong>short-end-stick-2025</strong> ? 2 relations</summary>

- `SHORT_END_STICK_2025:rel_027`: `SHORT_END_STICK_2025:kt_001_transaction_cost_economics_and_opportunism` ? **derived_from** ? `SHORT_END_STICK_2025:problem_two_sided_opportunism`; evidence `SHORT_END_STICK_2025:ev_001_paper_problem_two_sided_opportunism`
- `SHORT_END_STICK_2025:rel_028`: `SHORT_END_STICK_2025:kt_003_blockchain_governance_and_smart_contracts` ? **derived_from** ? `SHORT_END_STICK_2025:artifact_001_hyperledger_fabric_two_sided_opportunism_solution`; evidence `SHORT_END_STICK_2025:ev_026_online_appendix_blockchain_mechanisms`

</details>

<details><summary><strong>ssi-kyc-framework-2022</strong> ? 34 relations</summary>

- `SSI_KYC_FRAMEWORK_2022:rel_001`: `SSI_KYC_FRAMEWORK_2022:prob_001_costly_inefficient_privacy_sensitive_kyc` ? **motivates** ? `SSI_KYC_FRAMEWORK_2022:rq_001_design_ssi_based_ekyc_framework`; evidence `SSI_KYC_FRAMEWORK_2022:ev_006_research_goal`
- `SSI_KYC_FRAMEWORK_2022:rel_002`: `SSI_KYC_FRAMEWORK_2022:prob_001_costly_inefficient_privacy_sensitive_kyc` ? **motivates** ? `SSI_KYC_FRAMEWORK_2022:rq_002_derive_design_principles_for_blockchain_based_ssi`; evidence `SSI_KYC_FRAMEWORK_2022:ev_006_research_goal`
- `SSI_KYC_FRAMEWORK_2022:rel_003`: `SSI_KYC_FRAMEWORK_2022:prob_002_centralized_ekyc_data_silos_and_market_power` ? **motivates** ? `SSI_KYC_FRAMEWORK_2022:rq_001_design_ssi_based_ekyc_framework`; evidence `SSI_KYC_FRAMEWORK_2022:ev_005_ssi_as_alternative`
- `SSI_KYC_FRAMEWORK_2022:rel_004`: `SSI_KYC_FRAMEWORK_2022:prob_003_blockchain_transparency_vs_personal_data_privacy` ? **motivates** ? `SSI_KYC_FRAMEWORK_2022:rq_002_derive_design_principles_for_blockchain_based_ssi`; evidence `SSI_KYC_FRAMEWORK_2022:ev_006_research_goal`
- `SSI_KYC_FRAMEWORK_2022:rel_006`: `SSI_KYC_FRAMEWORK_2022:rq_001_design_ssi_based_ekyc_framework` ? **requires** ? `SSI_KYC_FRAMEWORK_2022:dr_001_efficiency`; evidence `SSI_KYC_FRAMEWORK_2022:ev_016_efficiency_objective`
- `SSI_KYC_FRAMEWORK_2022:rel_008`: `SSI_KYC_FRAMEWORK_2022:rq_001_design_ssi_based_ekyc_framework` ? **requires** ? `SSI_KYC_FRAMEWORK_2022:dr_002_regulatory_compliance`; evidence `SSI_KYC_FRAMEWORK_2022:ev_017_regulatory_compliance_objective`
- `SSI_KYC_FRAMEWORK_2022:rel_010`: `SSI_KYC_FRAMEWORK_2022:rq_001_design_ssi_based_ekyc_framework` ? **requires** ? `SSI_KYC_FRAMEWORK_2022:dr_003_decentralization`; evidence `SSI_KYC_FRAMEWORK_2022:ev_018_decentralization_objective`
- `SSI_KYC_FRAMEWORK_2022:rel_012`: `SSI_KYC_FRAMEWORK_2022:rq_001_design_ssi_based_ekyc_framework` ? **requires** ? `SSI_KYC_FRAMEWORK_2022:dr_004_trust_in_reusable_kyc_documents`; evidence `SSI_KYC_FRAMEWORK_2022:ev_019_trust_objective`
- `SSI_KYC_FRAMEWORK_2022:rel_014`: `SSI_KYC_FRAMEWORK_2022:rq_001_design_ssi_based_ekyc_framework` ? **requires** ? `SSI_KYC_FRAMEWORK_2022:dr_005_privacy`; evidence `SSI_KYC_FRAMEWORK_2022:ev_020_privacy_objective`
- `SSI_KYC_FRAMEWORK_2022:rel_016`: `SSI_KYC_FRAMEWORK_2022:rq_001_design_ssi_based_ekyc_framework` ? **requires** ? `SSI_KYC_FRAMEWORK_2022:dr_006_user_experience`; evidence `SSI_KYC_FRAMEWORK_2022:ev_021_user_experience_objective`
- `SSI_KYC_FRAMEWORK_2022:rel_096`: `SSI_KYC_FRAMEWORK_2022:dr_001_efficiency` ? **derived_from** ? `SSI_KYC_FRAMEWORK_2022:kt_001_peffers_dsrm`; evidence `SSI_KYC_FRAMEWORK_2022:ev_014_dsrm_process`
- `SSI_KYC_FRAMEWORK_2022:rel_097`: `SSI_KYC_FRAMEWORK_2022:dr_002_regulatory_compliance` ? **derived_from** ? `SSI_KYC_FRAMEWORK_2022:kt_001_peffers_dsrm`; evidence `SSI_KYC_FRAMEWORK_2022:ev_014_dsrm_process`
- `SSI_KYC_FRAMEWORK_2022:rel_098`: `SSI_KYC_FRAMEWORK_2022:dr_003_decentralization` ? **derived_from** ? `SSI_KYC_FRAMEWORK_2022:kt_001_peffers_dsrm`; evidence `SSI_KYC_FRAMEWORK_2022:ev_014_dsrm_process`
- `SSI_KYC_FRAMEWORK_2022:rel_099`: `SSI_KYC_FRAMEWORK_2022:dr_004_trust_in_reusable_kyc_documents` ? **derived_from** ? `SSI_KYC_FRAMEWORK_2022:kt_001_peffers_dsrm`; evidence `SSI_KYC_FRAMEWORK_2022:ev_014_dsrm_process`
- `SSI_KYC_FRAMEWORK_2022:rel_100`: `SSI_KYC_FRAMEWORK_2022:dr_005_privacy` ? **derived_from** ? `SSI_KYC_FRAMEWORK_2022:kt_001_peffers_dsrm`; evidence `SSI_KYC_FRAMEWORK_2022:ev_014_dsrm_process`
- `SSI_KYC_FRAMEWORK_2022:rel_101`: `SSI_KYC_FRAMEWORK_2022:dr_006_user_experience` ? **derived_from** ? `SSI_KYC_FRAMEWORK_2022:kt_001_peffers_dsrm`; evidence `SSI_KYC_FRAMEWORK_2022:ev_014_dsrm_process`
- `SSI_KYC_FRAMEWORK_2022:rel_102`: `SSI_KYC_FRAMEWORK_2022:dp_004_customer_centered_ssi_control` ? **derived_from** ? `SSI_KYC_FRAMEWORK_2022:kt_002_self_sovereign_identity`; evidence `SSI_KYC_FRAMEWORK_2022:ev_011_ssi_roles_components`
- `SSI_KYC_FRAMEWORK_2022:rel_103`: `SSI_KYC_FRAMEWORK_2022:df_001_dids_and_did_documents` ? **derived_from** ? `SSI_KYC_FRAMEWORK_2022:kt_002_self_sovereign_identity`; evidence `SSI_KYC_FRAMEWORK_2022:ev_011_ssi_roles_components`
- `SSI_KYC_FRAMEWORK_2022:rel_104`: `SSI_KYC_FRAMEWORK_2022:df_002_user_agents_and_digital_wallets` ? **derived_from** ? `SSI_KYC_FRAMEWORK_2022:kt_002_self_sovereign_identity`; evidence `SSI_KYC_FRAMEWORK_2022:ev_011_ssi_roles_components`
- `SSI_KYC_FRAMEWORK_2022:rel_105`: `SSI_KYC_FRAMEWORK_2022:df_003_verifiable_credentials_and_presentations` ? **derived_from** ? `SSI_KYC_FRAMEWORK_2022:kt_002_self_sovereign_identity`; evidence `SSI_KYC_FRAMEWORK_2022:ev_011_ssi_roles_components`
- `SSI_KYC_FRAMEWORK_2022:rel_106`: `SSI_KYC_FRAMEWORK_2022:df_001_dids_and_did_documents` ? **derived_from** ? `SSI_KYC_FRAMEWORK_2022:kt_003_verifiable_credentials_and_dids_standards`; evidence `SSI_KYC_FRAMEWORK_2022:ev_012_vc_and_revocation_capabilities`
- `SSI_KYC_FRAMEWORK_2022:rel_107`: `SSI_KYC_FRAMEWORK_2022:df_003_verifiable_credentials_and_presentations` ? **derived_from** ? `SSI_KYC_FRAMEWORK_2022:kt_003_verifiable_credentials_and_dids_standards`; evidence `SSI_KYC_FRAMEWORK_2022:ev_012_vc_and_revocation_capabilities`
- `SSI_KYC_FRAMEWORK_2022:rel_108`: `SSI_KYC_FRAMEWORK_2022:df_006_credential_schemas_and_definitions` ? **derived_from** ? `SSI_KYC_FRAMEWORK_2022:kt_003_verifiable_credentials_and_dids_standards`; evidence `SSI_KYC_FRAMEWORK_2022:ev_012_vc_and_revocation_capabilities`
- `SSI_KYC_FRAMEWORK_2022:rel_109`: `SSI_KYC_FRAMEWORK_2022:dr_002_regulatory_compliance` ? **derived_from** ? `SSI_KYC_FRAMEWORK_2022:kt_004_gdpr_and_eidas_regulatory_context`; evidence `SSI_KYC_FRAMEWORK_2022:ev_032_evaluation_regulatory`
- `SSI_KYC_FRAMEWORK_2022:rel_110`: `SSI_KYC_FRAMEWORK_2022:dp_001_use_blockchain_only_for_public_data` ? **derived_from** ? `SSI_KYC_FRAMEWORK_2022:kt_004_gdpr_and_eidas_regulatory_context`; evidence `SSI_KYC_FRAMEWORK_2022:ev_032_evaluation_regulatory`
- `SSI_KYC_FRAMEWORK_2022:rel_111`: `SSI_KYC_FRAMEWORK_2022:eval_003_regulatory_privacy_fit_assessment` ? **derived_from** ? `SSI_KYC_FRAMEWORK_2022:kt_004_gdpr_and_eidas_regulatory_context`; evidence `SSI_KYC_FRAMEWORK_2022:ev_032_evaluation_regulatory`
- `SSI_KYC_FRAMEWORK_2022:rel_112`: `SSI_KYC_FRAMEWORK_2022:dp_001_use_blockchain_only_for_public_data` ? **derived_from** ? `SSI_KYC_FRAMEWORK_2022:kt_005_blockchain_as_neutral_cross_organizational_infrastructure`; evidence `SSI_KYC_FRAMEWORK_2022:ev_024_public_ledger_role`
- `SSI_KYC_FRAMEWORK_2022:rel_113`: `SSI_KYC_FRAMEWORK_2022:df_008_public_data_registry_on_ledger` ? **derived_from** ? `SSI_KYC_FRAMEWORK_2022:kt_005_blockchain_as_neutral_cross_organizational_infrastructure`; evidence `SSI_KYC_FRAMEWORK_2022:ev_024_public_ledger_role`
- `SSI_KYC_FRAMEWORK_2022:rel_114`: `SSI_KYC_FRAMEWORK_2022:art_001_ssi_based_ekyc_framework` ? **derived_from** ? `SSI_KYC_FRAMEWORK_2022:kt_005_blockchain_as_neutral_cross_organizational_infrastructure`; evidence `SSI_KYC_FRAMEWORK_2022:ev_024_public_ledger_role`
- `SSI_KYC_FRAMEWORK_2022:rel_115`: `SSI_KYC_FRAMEWORK_2022:lim_001_governance_and_adoption_challenges` ? **supported_by** ? `SSI_KYC_FRAMEWORK_2022:eval_004_practical_feasibility_and_utility_assessment`; evidence `SSI_KYC_FRAMEWORK_2022:ev_040_adoption_and_governance_challenges`
- `SSI_KYC_FRAMEWORK_2022:rel_116`: `SSI_KYC_FRAMEWORK_2022:lim_002_no_real_world_deployment_yet` ? **supported_by** ? `SSI_KYC_FRAMEWORK_2022:eval_004_practical_feasibility_and_utility_assessment`; evidence `SSI_KYC_FRAMEWORK_2022:ev_042_limitations_real_world_eval`
- `SSI_KYC_FRAMEWORK_2022:rel_117`: `SSI_KYC_FRAMEWORK_2022:lim_003_regulatory_interpretation_uncertainty` ? **supported_by** ? `SSI_KYC_FRAMEWORK_2022:eval_004_practical_feasibility_and_utility_assessment`; evidence `SSI_KYC_FRAMEWORK_2022:ev_032_evaluation_regulatory`
- `SSI_KYC_FRAMEWORK_2022:rel_118`: `SSI_KYC_FRAMEWORK_2022:lim_004_wallet_usability_and_recovery_risk` ? **supported_by** ? `SSI_KYC_FRAMEWORK_2022:eval_004_practical_feasibility_and_utility_assessment`; evidence `SSI_KYC_FRAMEWORK_2022:ev_036_evaluation_user_experience`
- `SSI_KYC_FRAMEWORK_2022:rel_119`: `SSI_KYC_FRAMEWORK_2022:lim_005_interbank_trust_and_standard_acceptance` ? **supported_by** ? `SSI_KYC_FRAMEWORK_2022:eval_004_practical_feasibility_and_utility_assessment`; evidence `SSI_KYC_FRAMEWORK_2022:ev_034_evaluation_trust`

</details>

<details><summary><strong>trust-capacity-exchange-blockchain-2024</strong> ? 44 relations</summary>

- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_001`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:prob_001_low_trust_in_capacity_exchange` ? **motivates** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_004_intro_research_question`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_002`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:prob_002_capacity_volatility_and_transaction_costs` ? **motivates** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_004_intro_research_question`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_003`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:prob_001_low_trust_in_capacity_exchange` ? **motivates** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_002_generate_design_knowledge_on_blockchain_trust`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_005_research_gap_empirical_blockchain_trust`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_004`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact` ? **requires** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_001_creation_and_management_of_tender`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_011_meta_requirements_overview`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_005`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact` ? **requires** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_002_cross_domain_management`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_011_meta_requirements_overview`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_006`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact` ? **requires** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_003_search_functions`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_011_meta_requirements_overview`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_007`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact` ? **requires** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_004_identity_management_and_verification`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_011_meta_requirements_overview`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_008`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact` ? **requires** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_005_initiation_support_services`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_011_meta_requirements_overview`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_009`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact` ? **requires** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_006_intermediate_connection`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_011_meta_requirements_overview`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_010`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact` ? **requires** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_007_contract_heterogeneity`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_011_meta_requirements_overview`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_011`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact` ? **requires** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_008_final_award_function`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_011_meta_requirements_overview`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_012`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact` ? **requires** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_009_payment_fulfilment_conditions`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_011_meta_requirements_overview`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_013`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact` ? **requires** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_010_legal_framework_compliance`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_011_meta_requirements_overview`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_014`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact` ? **requires** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_011_serious_rating`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_011_meta_requirements_overview`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_015`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact` ? **requires** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_012_decision_relevant_kpis`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_011_meta_requirements_overview`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_016`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact` ? **requires** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_013_transaction_transparency_completeness`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_011_meta_requirements_overview`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_017`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact` ? **requires** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_014_decentralization_and_simultaneity`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_011_meta_requirements_overview`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_018`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact` ? **requires** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_015_communication_services`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_011_meta_requirements_overview`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_019`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact` ? **requires** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_016_equality_of_participants`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_011_meta_requirements_overview`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_020`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact` ? **requires** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_017_interface_compatibility_and_standards`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_011_meta_requirements_overview`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_021`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact` ? **requires** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_018_human_interaction_and_role_models`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_011_meta_requirements_overview`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_022`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact` ? **requires** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_019_encryption_concepts`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_011_meta_requirements_overview`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_118`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_001_transaction_costs_and_interorganizational_trust` ? **derived_from** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_002_generate_design_knowledge_on_blockchain_trust`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_005_research_gap_empirical_blockchain_trust`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_119`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_002_agency_theory_behavioral_uncertainty` ? **derived_from** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_002_generate_design_knowledge_on_blockchain_trust`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_005_research_gap_empirical_blockchain_trust`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_120`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_003_signaling_screening_authority_reputation` ? **derived_from** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_002_generate_design_knowledge_on_blockchain_trust`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_005_research_gap_empirical_blockchain_trust`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_121`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_004_blockchain_as_trust_enabling_infrastructure` ? **derived_from** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_002_generate_design_knowledge_on_blockchain_trust`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_005_research_gap_empirical_blockchain_trust`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_122`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_005_design_principle_reusability` ? **derived_from** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_002_generate_design_knowledge_on_blockchain_trust`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_005_research_gap_empirical_blockchain_trust`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_123`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_003_signaling_screening_authority_reputation` ? **supports** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_001_signaling_tender_information`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_018_dp1_table`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_124`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_004_blockchain_as_trust_enabling_infrastructure` ? **supports** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_001_signaling_tender_information`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_025_instantiation_smart_contracts`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_125`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_003_signaling_screening_authority_reputation` ? **supports** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_002_signaling_identity_information`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_018_dp1_table`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_126`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_004_blockchain_as_trust_enabling_infrastructure` ? **supports** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_002_signaling_identity_information`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_025_instantiation_smart_contracts`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_127`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_003_signaling_screening_authority_reputation` ? **supports** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_003_authority_and_fairness`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_018_dp1_table`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_128`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_004_blockchain_as_trust_enabling_infrastructure` ? **supports** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_003_authority_and_fairness`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_025_instantiation_smart_contracts`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_129`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_003_signaling_screening_authority_reputation` ? **supports** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_004_incentive_mechanisms`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_018_dp1_table`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_130`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_004_blockchain_as_trust_enabling_infrastructure` ? **supports** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_004_incentive_mechanisms`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_025_instantiation_smart_contracts`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_131`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_003_signaling_screening_authority_reputation` ? **supports** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_005_screening_functionality`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_018_dp1_table`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_132`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_004_blockchain_as_trust_enabling_infrastructure` ? **supports** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_005_screening_functionality`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_025_instantiation_smart_contracts`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_133`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_003_signaling_screening_authority_reputation` ? **supports** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_006_reputation_mechanism`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_018_dp1_table`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_134`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_004_blockchain_as_trust_enabling_infrastructure` ? **supports** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_006_reputation_mechanism`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_025_instantiation_smart_contracts`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_135`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:eval_003_pretest_posttest_experiment` ? **supported_by** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:lim_001_artificial_small_sample_single_case`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_036_limitations`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_136`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:eval_003_pretest_posttest_experiment` ? **supported_by** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:lim_002_blockchain_not_sufficient_without_design_principles`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_036_limitations`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_137`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:eval_003_pretest_posttest_experiment` ? **supported_by** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:lim_003_design_principle_interdependencies_complicate_causality`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_036_limitations`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_138`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:eval_003_pretest_posttest_experiment` ? **supported_by** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:lim_004_permissioned_testnet_not_mainnet`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_036_limitations`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_139`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:eval_003_pretest_posttest_experiment` ? **supported_by** ? `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:lim_005_need_for_broader_variables_and_domains`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_036_limitations`

</details>

## Evidence preservation

Evidence did not decrease: **304 before and 304 after**. Exact comparison found:

- zero removed evidence IDs;
- zero changed evidence text payloads;
- all evidence formerly attached only to a context record remains as paper-level evidence and is referenced from the preserved context;
- all evidence references on the 351 canonical concepts are now valid;
- 22 uniquely resolvable dangling legacy references were restored to the corresponding existing evidence items;
- one dangling reference, `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_010_generality_refinement`, had no evidence item at `c4940e4` and remains omitted rather than invented; the concept still retains valid `ev_007_quality_criteria` support.

## Evidence-reference repair discovered by this audit

The historical source contained 23 concept-level references to evidence IDs that did not exist. The old parser did not retain or validate concept evidence arrays, so `c4940e4` reported zero warnings despite these dangling IDs.

Twenty-two occurrences had exactly one current evidence item with the same semantic suffix and a shifted numeric prefix. Those links were restored on both sides (`concept.evidence` and `evidence.supports`):

| Dangling historical ID | Restored canonical evidence ID |
|---|---|
| `BLOCKCHAIN_IOT_SDPS_2019:ev_016_iteration_1_end_to_end` | `BLOCKCHAIN_IOT_SDPS_2019:ev_017_iteration_1_end_to_end` |
| `BLOCKCHAIN_IOT_SDPS_2019:ev_017_iteration_2_cross_validation` | `BLOCKCHAIN_IOT_SDPS_2019:ev_018_iteration_2_cross_validation` |
| `BLOCKCHAIN_IOT_SDPS_2019:ev_018_iteration_3_usability_privacy` | `BLOCKCHAIN_IOT_SDPS_2019:ev_019_iteration_3_usability_privacy` |
| `BLOCKCHAIN_IOT_SDPS_2019:ev_019_ex_post_dp1` | `BLOCKCHAIN_IOT_SDPS_2019:ev_020_ex_post_dp1` |
| `BLOCKCHAIN_IOT_SDPS_2019:ev_020_ex_post_dp2` | `BLOCKCHAIN_IOT_SDPS_2019:ev_021_ex_post_dp2` |
| `BLOCKCHAIN_IOT_SDPS_2019:ev_021_ex_post_dp3` | `BLOCKCHAIN_IOT_SDPS_2019:ev_022_ex_post_dp3` |
| `BLOCKCHAIN_IOT_SDPS_2019:ev_022_ex_post_dp4` | `BLOCKCHAIN_IOT_SDPS_2019:ev_023_ex_post_dp4` |
| `BLOCKCHAIN_IOT_SDPS_2019:ev_023_blockchain_usage_implications` | `BLOCKCHAIN_IOT_SDPS_2019:ev_024_blockchain_usage_implications` |
| `BLOCKCHAIN_IOT_SDPS_2019:ev_025_certification_process` | `BLOCKCHAIN_IOT_SDPS_2019:ev_026_certification_process` |
| `BLOCKCHAIN_IOT_SDPS_2019:ev_026_table_2_prototype_evaluation` | `BLOCKCHAIN_IOT_SDPS_2019:ev_027_table_2_prototype_evaluation` |
| `BLOCKCHAIN_IOT_SDPS_2019:ev_027_design_theory_components` | `BLOCKCHAIN_IOT_SDPS_2019:ev_028_design_theory_components` |

The mapping is generic and conservative: the normalizer repairs a dangling ID only when removing its `ev_<number>_` prefix yields exactly one evidence suffix match in the same paper. Ambiguous or unmatched references are not guessed.

The sole unmatched ID, `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_010_generality_refinement`, never existed in the historical evidence file. It was not restored. Its concept, `dr_002_generality`, retains the valid `ev_007_quality_criteria` evidence item containing the generality claim, so no evidence text or DSR claim is lost.

## Graph preservation and validity

The graph changed from 412 declared nodes / 753 edges to 338 declared nodes / 572 edges.

- **181 graph edges were removed.** All 181 touch context records converted to metadata. The other two of the 183 removed contextual relations were not graph edges at `c4940e4` either.
- **572 current graph edges remain.** Every one exists both as an old stored graph edge and as a current canonical OKF relation. There are zero invented graph edges.
- Every current graph node ID exists in `dsr.md`.
- Every current graph edge source and target exists as a current canonical concept.
- No canonical old graph edge was lost.
- Three Blockchain IoT node declarations were added solely to declare concepts already referenced by old edges: `eval1_iterative_prototype_evaluation`, `eval2_ex_post_evaluation`, and `ok1_sdps_design_theory`.

Nine old canonical graph node declarations were omitted because they have no surviving canonical stored edge:

- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:prob_001_lack_integrated_blockchain_isdm`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:prob_002_blockchain_development_complexity_and_failures`
- `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:prob_003_fragmented_technical_and_partial_method_knowledge`
- `SSI_KYC_FRAMEWORK_2022:df_012_ongoing_monitoring_via_secure_channel`
- `SSI_KYC_FRAMEWORK_2022:df_013_local_bank_records_with_privacy_options`
- `SSI_KYC_FRAMEWORK_2022:eval_001_design_objectives_formative_interviews`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:prob_001_low_trust_in_capacity_exchange`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:prob_002_capacity_volatility_and_transaction_costs`
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:eval_001_two_iteration_dsr_design`

All nine remain in `dsr.md` and were verified in the Workbench matrix's `additional_concepts` collection. Omitting orphan node declarations from the stored flow does not remove the underlying claim and prevents the primary diagram from implying unsupported links.

## Workbench matrix provenance

`buildWorkbenchDsrMatrix()` in `lib/okf/workbench-matrix.ts` constructs segments only through `collectStoredSegments()`:

- stored, non-query-generated OKF relations;
- stored `graph.json` edges;
- stored `recommended_paths`, `recommended_main_paths`, or `recommended_main_flow` for path selection.

Every segment must resolve both IDs to canonical concepts and pass the shared adjacent-layer/predicate transition contract. When no usable recommended path exists, fallback rows are traversals over those same stored relation-backed segments. Ranking, deduplication, and row limits select among stored paths; they do not create edges. Concepts not selected for primary rows remain in `additional_concepts` and the complete catalog.

Therefore the Workbench matrix contains no LLM-generated, inferred-by-UI, or synthetic relationship.

## Data-preservation verdict

- **Canonical DSR concepts:** 351/351 preserved.
- **Context claims:** 92/92 preserved as metadata and full prose.
- **Canonical relations:** 575/575 preserved unchanged.
- **Contextual relation statements:** 183/183 preserved as contextual links.
- **Evidence:** 304/304 IDs and text preserved; 22 dangling link occurrences repaired.
- **Current graph endpoint validity:** passed.
- **Invented current graph edges:** zero.
- **Accidental concept or relation removals:** zero.
- **Required restorations:** 22 concept/evidence link occurrences repaired; no concept, relation, evidence record, or evidence text restoration required.

This audit supports the normalization as data-preserving, subject to the separate human-review warnings already documented in `docs/FLOW_VALIDATION_REPORT.md`.

## Presentation-architecture addendum

The subsequent Workbench presentation pass adds `presentation.yaml` as the eighth canonical bundle file and an optional provenance-only `graph.json.source_reference`. This does not alter the normalization verdict above.

### Machine-graph preservation after presentation migration

| Measure | Before presentation pass | After presentation pass | Change |
|---|---:|---:|---:|
| Canonical concepts | 351 | 351 | 0 |
| Canonical relations | 575 | 575 | 0 |
| Evidence records | 304 | 304 | 0 |
| Context claims | 92 | 92 | 0 |
| Contextual relation statements | 183 | 183 | 0 |

- The one-time legacy migration writes researcher-facing synthesis only to `presentation.yaml`.
- It backfills only exact missing DOI/DOI URL metadata for Integrated ISDM, SSI KYC, and Trust Capacity from archived source rows. It does not infer a DOI, venue, abstract, objective, or method.
- All nine legacy DLT-role descriptions and six-section Workbench summaries are preserved with per-field provenance.
- No `dsr.md`, `evidence.md`, `relations.yaml`, or `aliases.yaml` record is modified by the presentation migration.
- `graph.json.source_reference` records figure/table provenance and an unreviewed semantic status. It adds no node or edge and changes no recommended path.
- All nine paper review states remain `unreviewed`; legacy workflow labels are provenance only.
- The migration is deterministic: two consecutive runs reported zero changed files.
- Supabase remains an indexed runtime copy. The additive presentation-column migration must be deployed before remote presentation JSON can be re-indexed.

The exact presentation field migration is recorded in `docs/WORKBENCH_PRESENTATION_MIGRATION_AUDIT.md`; source-flow provenance and remaining manual review are recorded in `docs/FLOW_SEMANTIC_VALIDATION_AUDIT.md`.

## Source-view curation addendum

The later source-view pass retains the normalization checkpoint above and adds only paper-figure facts that were independently visible in the cited PDFs.

| Measure | After schema normalization | After source-view curation | Change |
|---|---:|---:|---:|
| Canonical concepts | 351 | 351 | 0 |
| Canonical relations | 575 | 577 | +2 |
| Evidence records | 304 | 305 | +1 |
| Context claims | 92 | 92 | 0 |
| Contextual relation statements | 183 | 183 | 0 |

- Two missing arrows visible in the NIL marketplace paper's Figure 1 were added as NIL_NFT_MARKETPLACE_2026:rel_081 and NIL_NFT_MARKETPLACE_2026:rel_082.
- Both relations use instantiated_by, high confidence, and explicit-in-artifact, with the figure-specific evidence record NIL_NFT_MARKETPLACE_2026:ev_034_figure_1_source_mapping.
- IDs rel_081 and rel_082 avoid reusing historical contextual-relation IDs removed from the canonical graph during schema normalization.
- No concept, existing relation, evidence record, context claim, or substantive DSR statement was removed or rewritten by this correction.
- Twenty-five pre-existing relations included in the three curated source views had provenance corrected to explicit-in-artifact; their endpoints, predicates, and evidence links were unchanged.
- Structural validation does not elevate human review: all three production source views remain unreviewed.

The exact inventories and remaining transcription gaps are recorded in docs/OKF_SOURCE_VIEW_AUDIT.md.

## Complete nine-paper source-view curation addendum

The 2026-07-16 completion pass re-inspected all nine source PDFs and finalized an explicit Outcome A or Outcome B for every runtime bundle. It preserves the schema-normalization verdict above.

| Measure | Before completion pass | After completion pass | Change |
|---|---:|---:|---:|
| Canonical concepts | 351 | 351 | 0 |
| Canonical relations | 577 | 577 | 0 |
| Evidence records | 305 | 306 | +1 |
| Graph nodes | 338 | 338 | 0 |
| Graph edges | 574 | 574 | 0 |
| Runtime exact source views | 3 | 8 | +5 |
| Explicit recommended paths | 8 | 21 | +13 |

- The only new evidence record is `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_041_figure_3_requirement_principle_mapping`, which records the complete Figure 3 node/arrow inventory. The 31 pre-existing Figure 3 relations now reference it.
- No relation was added, removed, reversed, or assigned a new endpoint or predicate in this completion pass.
- Sixty-nine pre-existing source-visible relations changed provenance from `inferred` to `explicit-in-artifact`: HIE 13, Short End 11, and Trust Capacity 45.
- Five exact runtime source views were added: HIE Figure 3, Short End Figure 1, Short End Table 3, Trust Figure 3, and Trust Figure 6. The three existing views were revalidated against their PDFs.
- Integrated ISDM, Newsvendor, and SSI/KYC retain zero exact source views because an exact transcription would require noncanonical grouping, actor, agent, lifeline, or message concepts and/or relations not present in the canonical graph. Their design claims remain available through Recommended Flow, Full Relations, concepts, evidence, and context metadata.
- Every paper now has at least one explicit stored Recommended Flow. These paths select existing relations only and do not claim source-figure parity.
- No substantive DSR claim was removed or weakened. All source-view semantic statuses remain `unreviewed` pending named human review.

The final nine-paper inventories and decisions are in `docs/OKF_SOURCE_VIEW_AUDIT.md`.
