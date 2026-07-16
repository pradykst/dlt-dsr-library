---
schema_version: "okf-dsr-v1"
type: "Paper"
paper_id: "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024"
slug: "trust-capacity-exchange-blockchain-2024"
title: "Designing trust-enabling blockchain systems for the inter-organizational exchange of capacity"
short_title: "Designing trust-enabling blockchain systems for the inter-organizational exchange of capacity"
authors: ["Nick Große","Frederik Möller","Thorsten Schoormann","Michael Henke"]
year: 2024
venue: "Decision Support Systems"
doi: "10.1016/j.dss.2024.114182"
doi_url: "https://doi.org/10.1016/j.dss.2024.114182"
source_url: null
source_pdf_filename: "designing trust enabling blockchain systems.pdf"
domain_context: "Low inter-organizational trust hinders virtual capacity exchange"
abstract: null
research_problem: ["Low inter-organizational trust hinders virtual capacity exchange","Capacity volatility creates transaction-cost pressure in industrial networks"]
research_objective: []
research_questions: ["How to design an artifact that establishes trust in inter-organizational capacity exchange?","How and why can blockchain affect perceived inter-organizational trust?"]
artifact_type: "Blockchain-based capacity exchange prototype"
blockchain_dlt_role: null
methodology: null
theoretical_foundations: ["Transaction cost theory and inter-organizational trust","Agency theory and behavioral uncertainty","Cooperation designs: signaling, screening, authority, incentives, and reputation","Blockchain as trust-enabling infrastructure","Design principles as reusable prescriptive knowledge"]
evaluation_method: ["Two-iteration DSR design and evaluation process","Ex-ante evaluation of design principles","Pretest-posttest experiment with control and test groups","Pretest shows high perceived trust for full design-principle implementation","Control-group posttest shows steady perceived trust","Manipulated prototype sharply reduces perceived trust"]
key_contributions: ["Nineteen meta-requirements for trust-enabling capacity exchange","Six design principles for inter-organizational trust","Blockchain design features instantiate trust principles","Blockchain does not automatically create trust","Trust-enabling design principles are interdependent"]
design_knowledge_output: ["Nineteen meta-requirements for trust-enabling capacity exchange","Six design principles for inter-organizational trust","Blockchain design features instantiate trust principles","Blockchain does not automatically create trust","Trust-enabling design principles are interdependent"]
limitations: ["Artificial setting, small sample, and single instantiation limit generalization","Blockchain alone is insufficient for trust","Design-principle interdependencies complicate isolated causal claims","Controlled testnet differs from a real public blockchain environment","Further experiments need more variables, participants, and domains"]
notes: null
extraction_status: "okf_draft"
review_status: "unreviewed"
author_check_status: "not_requested"
reviewed_by: null
reviewed_at: null
---

# Designing trust-enabling blockchain systems for the inter-organizational exchange of capacity

This OKF bundle captures the paper's design-science contribution on trust-enabling blockchain systems for inter-organizational capacity exchange. It represents the paper's problem framing, transaction-cost and agency-theory grounding, 19 meta-requirements, six design principles, blockchain-based smart-contract features, prototype artifact, ex-ante and ex-post evaluations, output knowledge, and limitations.

## Preserved paper-level context
These records are retained as paper metadata/prose under `okf-dsr-v1`; they are not canonical seven-layer DSR concepts and do not create canonical graph nodes or edges.
### Research questions and objectives

#### TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact: How to design an artifact that establishes trust in inter-organizational capacity exchange?

The central research question asks how an artifact can be designed to establish trust in inter-organizational capacity exchange.

### Explanation

The central research question asks how an artifact can be designed to establish trust in inter-organizational capacity exchange.

Evidence: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_004_intro_research_question

#### TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_002_generate_design_knowledge_on_blockchain_trust: How and why can blockchain affect perceived inter-organizational trust?

The research also investigates how and why blockchain-based implementations affect perceived trust, responding to calls for empirical blockchain-trust research.

### Explanation

The research also investigates how and why blockchain-based implementations affect perceived trust, responding to calls for empirical blockchain-trust research.

Evidence: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_005_research_gap_empirical_blockchain_trust
### Theoretical foundations

#### TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_001_transaction_costs_and_interorganizational_trust: Transaction cost theory and inter-organizational trust

The paper uses transaction-cost theory to frame information, negotiation, implementation, monitoring, and enforcement costs as affected by perceived trust.

### Explanation

The paper uses transaction-cost theory to frame information, negotiation, implementation, monitoring, and enforcement costs as affected by perceived trust.

Evidence: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_006_network_trust_theory, TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_009_research_model

#### TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_002_agency_theory_behavioral_uncertainty: Agency theory and behavioral uncertainty

The paper uses agency theory to frame behavioral uncertainties, opportunism, and information asymmetry between exchange participants.

### Explanation

The paper uses agency theory to frame behavioral uncertainties, opportunism, and information asymmetry between exchange participants.

Evidence: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_003_intro_transaction_costs, TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_009_research_model

#### TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_003_signaling_screening_authority_reputation: Cooperation designs: signaling, screening, authority, incentives, and reputation

The design principles are grounded in cooperation designs that reduce behavioral uncertainty, including signaling, screening, authority and fairness, incentives, and reputation.

### Explanation

The design principles are grounded in cooperation designs that reduce behavioral uncertainty, including signaling, screening, authority and fairness, incentives, and reputation.

Evidence: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_018_dp1_table, TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_022_dp5_table, TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_023_dp6_table

#### TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_004_blockchain_as_trust_enabling_infrastructure: Blockchain as trust-enabling infrastructure

The blockchain background grounds the artifact in immutability, transparency, decentralized data storage, cryptographic protocols, consensus mechanisms, and smart contracts.

### Explanation

The blockchain background grounds the artifact in immutability, transparency, decentralized data storage, cryptographic protocols, consensus mechanisms, and smart contracts.

Evidence: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_007_blockchain_triad, TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_025_instantiation_smart_contracts

#### TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_005_design_principle_reusability: Design principles as reusable prescriptive knowledge

The DSR framing treats design principles as codified prescriptive knowledge for building artifacts beyond a single success story.

### Explanation

The DSR framing treats design principles as codified prescriptive knowledge for building artifacts beyond a single success story.

Evidence: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_008_research_design_overview
### Limitations

#### TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:lim_001_artificial_small_sample_single_case: Artificial setting, small sample, and single instantiation limit generalization

The ex-post evaluation is artificial, uses a small number of participants, and relies on a single 3D-printer capacity-exchange instantiation.

### Explanation

The ex-post evaluation is artificial, uses a small number of participants, and relies on a single 3D-printer capacity-exchange instantiation.

Evidence: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_036_limitations

#### TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:lim_002_blockchain_not_sufficient_without_design_principles: Blockchain alone is insufficient for trust

The paper explicitly warns that applying blockchain does not immediately create trust; weak implementation of design principles can reduce trust.

### Explanation

The paper explicitly warns that applying blockchain does not immediately create trust; weak implementation of design principles can reduce trust.

Evidence: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_037_conclusion

#### TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:lim_003_design_principle_interdependencies_complicate_causality: Design-principle interdependencies complicate isolated causal claims

Because principles affect each other, the experiment cannot easily isolate the independent cause-effect relation of each principle.

### Explanation

Because principles affect each other, the experiment cannot easily isolate the independent cause-effect relation of each principle.

Evidence: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_034_principle_interdependence

#### TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:lim_004_permissioned_testnet_not_mainnet: Controlled testnet differs from a real public blockchain environment

The implementation uses a controlled test network to preserve internal validity, which differs from a naturalistic public mainnet deployment.

### Explanation

The implementation uses a controlled test network to preserve internal validity, which differs from a naturalistic public mainnet deployment.

Evidence: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_026_permissioned_testnet, TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_036_limitations

#### TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:lim_005_need_for_broader_variables_and_domains: Further experiments need more variables, participants, and domains

The authors call for extended experiments with additional control variables, more participants, and broader implementation scenarios.

### Explanation

The authors call for extended experiments with additional control variables, more participants, and broader implementation scenarios.

Evidence: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_036_limitations
### Contextual links excluded from the canonical graph

These source-preserved legacy links touch a research question/objective, theoretical foundation, limitation, or unresolved legacy record. They remain human-readable context only and are not canonical graph edges.

- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_001`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:prob_001_low_trust_in_capacity_exchange` — **motivates** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_004_intro_research_question`; confidence high.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_002`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:prob_002_capacity_volatility_and_transaction_costs` — **motivates** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_004_intro_research_question`; confidence high.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_003`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:prob_001_low_trust_in_capacity_exchange` — **motivates** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_002_generate_design_knowledge_on_blockchain_trust`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_005_research_gap_empirical_blockchain_trust`; confidence high.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_004`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact` — **requires** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_001_creation_and_management_of_tender`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_011_meta_requirements_overview`; confidence high.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_005`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact` — **requires** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_002_cross_domain_management`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_011_meta_requirements_overview`; confidence high.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_006`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact` — **requires** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_003_search_functions`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_011_meta_requirements_overview`; confidence high.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_007`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact` — **requires** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_004_identity_management_and_verification`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_011_meta_requirements_overview`; confidence high.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_008`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact` — **requires** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_005_initiation_support_services`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_011_meta_requirements_overview`; confidence high.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_009`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact` — **requires** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_006_intermediate_connection`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_011_meta_requirements_overview`; confidence high.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_010`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact` — **requires** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_007_contract_heterogeneity`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_011_meta_requirements_overview`; confidence high.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_011`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact` — **requires** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_008_final_award_function`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_011_meta_requirements_overview`; confidence high.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_012`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact` — **requires** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_009_payment_fulfilment_conditions`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_011_meta_requirements_overview`; confidence high.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_013`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact` — **requires** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_010_legal_framework_compliance`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_011_meta_requirements_overview`; confidence high.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_014`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact` — **requires** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_011_serious_rating`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_011_meta_requirements_overview`; confidence high.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_015`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact` — **requires** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_012_decision_relevant_kpis`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_011_meta_requirements_overview`; confidence high.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_016`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact` — **requires** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_013_transaction_transparency_completeness`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_011_meta_requirements_overview`; confidence high.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_017`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact` — **requires** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_014_decentralization_and_simultaneity`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_011_meta_requirements_overview`; confidence high.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_018`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact` — **requires** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_015_communication_services`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_011_meta_requirements_overview`; confidence high.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_019`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact` — **requires** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_016_equality_of_participants`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_011_meta_requirements_overview`; confidence high.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_020`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact` — **requires** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_017_interface_compatibility_and_standards`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_011_meta_requirements_overview`; confidence high.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_021`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact` — **requires** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_018_human_interaction_and_role_models`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_011_meta_requirements_overview`; confidence high.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_022`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact` — **requires** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_019_encryption_concepts`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_011_meta_requirements_overview`; confidence high.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_118`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_001_transaction_costs_and_interorganizational_trust` — **derived from** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_002_generate_design_knowledge_on_blockchain_trust`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_005_research_gap_empirical_blockchain_trust`; confidence medium-high.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_119`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_002_agency_theory_behavioral_uncertainty` — **derived from** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_002_generate_design_knowledge_on_blockchain_trust`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_005_research_gap_empirical_blockchain_trust`; confidence medium-high.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_120`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_003_signaling_screening_authority_reputation` — **derived from** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_002_generate_design_knowledge_on_blockchain_trust`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_005_research_gap_empirical_blockchain_trust`; confidence medium-high.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_121`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_004_blockchain_as_trust_enabling_infrastructure` — **derived from** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_002_generate_design_knowledge_on_blockchain_trust`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_005_research_gap_empirical_blockchain_trust`; confidence medium-high.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_122`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_005_design_principle_reusability` — **derived from** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_002_generate_design_knowledge_on_blockchain_trust`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_005_research_gap_empirical_blockchain_trust`; confidence medium-high.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_123`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_003_signaling_screening_authority_reputation` — **supports** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_001_signaling_tender_information`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_018_dp1_table`; confidence high.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_124`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_004_blockchain_as_trust_enabling_infrastructure` — **supports** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_001_signaling_tender_information`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_025_instantiation_smart_contracts`; confidence high.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_125`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_003_signaling_screening_authority_reputation` — **supports** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_002_signaling_identity_information`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_018_dp1_table`; confidence high.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_126`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_004_blockchain_as_trust_enabling_infrastructure` — **supports** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_002_signaling_identity_information`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_025_instantiation_smart_contracts`; confidence high.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_127`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_003_signaling_screening_authority_reputation` — **supports** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_003_authority_and_fairness`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_018_dp1_table`; confidence high.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_128`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_004_blockchain_as_trust_enabling_infrastructure` — **supports** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_003_authority_and_fairness`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_025_instantiation_smart_contracts`; confidence high.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_129`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_003_signaling_screening_authority_reputation` — **supports** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_004_incentive_mechanisms`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_018_dp1_table`; confidence high.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_130`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_004_blockchain_as_trust_enabling_infrastructure` — **supports** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_004_incentive_mechanisms`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_025_instantiation_smart_contracts`; confidence high.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_131`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_003_signaling_screening_authority_reputation` — **supports** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_005_screening_functionality`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_018_dp1_table`; confidence high.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_132`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_004_blockchain_as_trust_enabling_infrastructure` — **supports** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_005_screening_functionality`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_025_instantiation_smart_contracts`; confidence high.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_133`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_003_signaling_screening_authority_reputation` — **supports** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_006_reputation_mechanism`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_018_dp1_table`; confidence high.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_134`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_004_blockchain_as_trust_enabling_infrastructure` — **supports** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_006_reputation_mechanism`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_025_instantiation_smart_contracts`; confidence high.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_135`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:eval_003_pretest_posttest_experiment` — **supported by** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:lim_001_artificial_small_sample_single_case`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_036_limitations`; confidence medium.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_136`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:eval_003_pretest_posttest_experiment` — **supported by** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:lim_002_blockchain_not_sufficient_without_design_principles`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_036_limitations`; confidence medium.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_137`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:eval_003_pretest_posttest_experiment` — **supported by** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:lim_003_design_principle_interdependencies_complicate_causality`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_036_limitations`; confidence medium.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_138`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:eval_003_pretest_posttest_experiment` — **supported by** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:lim_004_permissioned_testnet_not_mainnet`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_036_limitations`; confidence medium.
- `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rel_139`: `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:eval_003_pretest_posttest_experiment` — **supported by** → `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:lim_005_need_for_broader_variables_and_domains`; evidence `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_036_limitations`; confidence medium.
