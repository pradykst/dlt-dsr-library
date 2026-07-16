---
schema_version: "okf-dsr-v1"
type: "Paper"
paper_id: "BLOCKCHAIN_IOT_SDPS_2019"
slug: "blockchain-iot-sdps-2019"
title: "Blockchain for the IoT: Privacy-Preserving Protection of Sensor Data"
short_title: "Blockchain for the IoT: Privacy-Preserving Protection of Sensor Data"
authors: ["Mathieu Chanson","Andreas Bogner","Dominik Bilgeri","Elgar Fleisch","Felix Wortmann"]
year: 2019
venue: "Journal of the Association for Information Systems"
doi: "10.17705/1jais.00567"
doi_url: "https://doi.org/10.17705/1jais.00567"
source_url: null
source_pdf_filename: "Blockchain for the IoT.pdf"
domain_context: "IoT sensor data protection"
abstract: null
research_problem: ["IoT sensor data protection under integrity, privacy, scalability, and cost constraints"]
research_objective: []
research_questions: ["RQ1: SDPS challenges and requirements","RQ2: Design principles and design features for SDPS","RQ3: Blockchain value proposition and design implications"]
artifact_type: "Sensor Data Protection System (SDPS) / CertifiCar"
blockchain_dlt_role: null
methodology: null
theoretical_foundations: ["Information asymmetry and certification","Westin's theory of privacy","DeLone and McLean IS success model"]
evaluation_method: ["Three-cycle prototype evaluation","Ex-post design evaluation across additional use cases"]
key_contributions: ["SDPS design theory","Blockchain-based SDPS usage implications"]
design_knowledge_output: ["SDPS design theory","Blockchain-based SDPS usage implications"]
limitations: []
notes: null
extraction_status: "okf_draft"
review_status: "unreviewed"
author_check_status: "not_requested"
reviewed_by: null
reviewed_at: null
---

# Blockchain for the IoT: Privacy-Preserving Protection of Sensor Data

## One-line role in the library

This paper contributes a design theory for blockchain-based sensor data protection systems (SDPSs), with explicit design requirements, design principles, design features, an instantiated prototype called CertifiCar, and iterative plus ex-post evaluation.

## Why this paper matters for the OKF chatbot

This is one of the cleanest papers in the library for Requirement → Design Principle → Design Feature graph construction. The paper explicitly defines:

- four design requirements: tamper resistance, privacy preservation, large data volume throughput, and economic feasibility;
- four design principles: source-to-sink certification, cross-validation certification, data-owner-controlled disclosure, and linearly scalable architecture;
- nine design features grouped into capture data, store data, and provide data capabilities;
- an artifact architecture combining IoT sensors, off-chain/cloud storage, access management, certification, retrieval, and blockchain-based hash storage;
- an evaluated instantiation, CertifiCar, for odometer-fraud prevention.

## Recommended retrieval use

Use this paper when the user asks about:

- IoT sensor-data integrity
- tamper-resistant data pipelines
- privacy-preserving DLT/blockchain systems
- hybrid on-chain/off-chain architectures
- hash anchoring
- data certification
- cross-validation
- scalable blockchain system design
- data owner access control
- DSR design theory structure
- Requirement → Principle → Feature mapping

## Preserved paper-level context
These records are retained as paper metadata/prose under `okf-dsr-v1`; they are not canonical seven-layer DSR concepts and do not create canonical graph nodes or edges.
### Research questions and objectives

#### BLOCKCHAIN_IOT_SDPS_2019:rq_001_challenges_requirements: RQ1: SDPS challenges and requirements

Identifies the fundamental IoT sensor-data protection challenges and derives system design requirements.

Evidence: BLOCKCHAIN_IOT_SDPS_2019:ev_002_research_questions

#### BLOCKCHAIN_IOT_SDPS_2019:rq_002_principles_features: RQ2: Design principles and design features for SDPS

Derives actionable guidelines in the form of design principles and design features for SDPS development.

Evidence: BLOCKCHAIN_IOT_SDPS_2019:ev_002_research_questions

#### BLOCKCHAIN_IOT_SDPS_2019:rq_003_blockchain_value_implications: RQ3: Blockchain value proposition and design implications

Clarifies when blockchain is valuable for SDPSs and what implications must be considered.

Evidence: BLOCKCHAIN_IOT_SDPS_2019:ev_002_research_questions, BLOCKCHAIN_IOT_SDPS_2019:ev_023_blockchain_usage_implications, BLOCKCHAIN_IOT_SDPS_2019:ev_024_design_implications
### Theoretical foundations

#### BLOCKCHAIN_IOT_SDPS_2019:kt1_information_asymmetry_certification: Information asymmetry and certification

Information asymmetry theory is used to justify certification as a mechanism for reducing opportunistic manipulation and information deficits.

Evidence: BLOCKCHAIN_IOT_SDPS_2019:ev_010_dp1, BLOCKCHAIN_IOT_SDPS_2019:ev_011_dp2

#### BLOCKCHAIN_IOT_SDPS_2019:kt2_westin_privacy: Westin's theory of privacy

Westin's theory is used to justify data-owner control over when, how, and to what extent data are communicated.

Evidence: BLOCKCHAIN_IOT_SDPS_2019:ev_012_dp3

#### BLOCKCHAIN_IOT_SDPS_2019:kt3_delone_mclean_is_success: DeLone and McLean IS success model

The notion of net benefits is used to justify the need for scalable and economically feasible SDPS design.

Evidence: BLOCKCHAIN_IOT_SDPS_2019:ev_013_dp4
### Contextual links excluded from the canonical graph

These source-preserved legacy links touch a research question/objective, theoretical foundation, limitation, or unresolved legacy record. They remain human-readable context only and are not canonical graph edges.

- `BLOCKCHAIN_IOT_SDPS_2019:rel_001`: `BLOCKCHAIN_IOT_SDPS_2019:prob_001_iot_sensor_data_protection_problem` — **motivates** → `BLOCKCHAIN_IOT_SDPS_2019:rq_001_challenges_requirements`; evidence `BLOCKCHAIN_IOT_SDPS_2019:ev_002_research_questions`; confidence high.
- `BLOCKCHAIN_IOT_SDPS_2019:rel_002`: `BLOCKCHAIN_IOT_SDPS_2019:prob_001_iot_sensor_data_protection_problem` — **motivates** → `BLOCKCHAIN_IOT_SDPS_2019:rq_002_principles_features`; evidence `BLOCKCHAIN_IOT_SDPS_2019:ev_002_research_questions`; confidence high.
- `BLOCKCHAIN_IOT_SDPS_2019:rel_003`: `BLOCKCHAIN_IOT_SDPS_2019:prob_001_iot_sensor_data_protection_problem` — **motivates** → `BLOCKCHAIN_IOT_SDPS_2019:rq_003_blockchain_value_implications`; evidence `BLOCKCHAIN_IOT_SDPS_2019:ev_002_research_questions`; confidence high.
- `BLOCKCHAIN_IOT_SDPS_2019:rel_036`: `BLOCKCHAIN_IOT_SDPS_2019:rq_003_blockchain_value_implications` — **contributes to** → `BLOCKCHAIN_IOT_SDPS_2019:ok2_blockchain_sdps_usage_implications`; evidence `BLOCKCHAIN_IOT_SDPS_2019:ev_024_blockchain_usage_implications`; confidence high.
- `BLOCKCHAIN_IOT_SDPS_2019:rel_037`: `BLOCKCHAIN_IOT_SDPS_2019:kt1_information_asymmetry_certification` — **derived from** → `BLOCKCHAIN_IOT_SDPS_2019:dp1_source_to_sink_certification`; evidence `BLOCKCHAIN_IOT_SDPS_2019:ev_010_dp1`; confidence high.
- `BLOCKCHAIN_IOT_SDPS_2019:rel_038`: `BLOCKCHAIN_IOT_SDPS_2019:kt1_information_asymmetry_certification` — **derived from** → `BLOCKCHAIN_IOT_SDPS_2019:dp2_cross_validation_certification`; evidence `BLOCKCHAIN_IOT_SDPS_2019:ev_011_dp2`; confidence high.
- `BLOCKCHAIN_IOT_SDPS_2019:rel_039`: `BLOCKCHAIN_IOT_SDPS_2019:kt2_westin_privacy` — **derived from** → `BLOCKCHAIN_IOT_SDPS_2019:dp3_data_owner_controlled_disclosure`; evidence `BLOCKCHAIN_IOT_SDPS_2019:ev_012_dp3`; confidence high.
- `BLOCKCHAIN_IOT_SDPS_2019:rel_040`: `BLOCKCHAIN_IOT_SDPS_2019:kt3_delone_mclean_is_success` — **derived from** → `BLOCKCHAIN_IOT_SDPS_2019:dp4_linearly_scalable_architecture`; evidence `BLOCKCHAIN_IOT_SDPS_2019:ev_013_dp4`; confidence high.
