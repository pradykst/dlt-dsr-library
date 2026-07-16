---
schema_version: "okf-dsr-v1"
type: "Paper"
paper_id: "SHORT_END_STICK_2025"
slug: "short-end-stick-2025"
title: "And No One Gets the Short End of the Stick: A Blockchain-Based Approach to Solving the Two-Sided Opportunism Problem in Interorganizational Information Sharing"
short_title: "And No One Gets the Short End of the Stick: A Blockchain-Based Approach to Solving the Two-Sided Opportunism Problem in Interorganizational Information Sharing"
authors: ["Lukas Florian Bossler","Arne Buchwald","Kai Spohrer"]
year: 2025
venue: "Information Systems Research"
doi: "10.1287/isre.2022.0065"
doi_url: "https://doi.org/10.1287/isre.2022.0065"
source_url: null
source_pdf_filename: "And No One Gets the Short End of the Stick.pdf"
domain_context: "Two-sided opportunism in interorganizational information sharing"
abstract: null
research_problem: ["Two-sided opportunism in interorganizational information sharing"]
research_objective: []
research_questions: ["Design of an IS for simultaneous prevention of poaching and manipulation"]
artifact_type: "Hyperledger Fabric system for confidential and verifiable information sharing"
blockchain_dlt_role: null
methodology: "Design science research"
theoretical_foundations: ["Transaction cost economics and opportunism","Information poaching and information manipulation literature","Blockchain governance, smart contracts, and private data collections"]
evaluation_method: ["Proof-of-concept demonstration through expert interviews","Proof-of-value vignette survey with machine tool users and lessors"]
key_contributions: ["Information poaching and manipulation as two sides of one problem","Design blueprint for reliable information sharing without revealing underlying data","Recombination of private data collections, smart contracts, and joint governance"]
design_knowledge_output: ["Information poaching and manipulation as two sides of one problem","Design blueprint for reliable information sharing without revealing underlying data","Recombination of private data collections, smart contracts, and joint governance"]
limitations: ["Most effective when both parties fear opportunism","Nonreversible functions can be costly to define","Dependency on blockchain network integrity","First-mile problem before data enter the shared IS","Artificial utility evaluation"]
notes: null
extraction_status: "okf_draft"
review_status: "unreviewed"
author_check_status: "not_requested"
reviewed_by: null
reviewed_at: null
---

# Paper Scope

This paper develops, instantiates, demonstrates, and evaluates a blockchain-based information system that addresses a **two-sided opportunism problem** in interorganizational information sharing based on sensitive data.

The paper's central design challenge is that information providers fear **information poaching**, while information recipients fear **information manipulation**. Solving only one side creates risk for the other side. The paper therefore proposes an information system that allows business partners to share verifiably truthful information derived from sensitive data without revealing the underlying data.

# Research Question

How should an information system be designed to enable interorganizational information sharing based on sensitive data while simultaneously preventing both information poaching and information manipulation?

# Contribution Type

- Problem conceptualization: information poaching and information manipulation as two sides of the same opportunism problem.
- Design principles: three design principles for reliable information sharing without revealing underlying sensitive data.
- Artifact instantiation: Hyperledger Fabric implementation using private data collections, smart contracts, and joint governance.
- Evaluation: proof-of-concept interviews and proof-of-value vignette survey.

# DSR Extraction Status

This extraction is suitable for the OKF decision-support chatbot, especially for design problems involving:

- cross-organizational information sharing,
- sensitive data disclosure risks,
- manipulation-resistant storage,
- reliable derived information,
- blockchain-based shared governance,
- product, asset, sensor, or performance-data attestations.

## Preserved paper-level context
These records are retained as paper metadata/prose under `okf-dsr-v1`; they are not canonical seven-layer DSR concepts and do not create canonical graph nodes or edges.
### Research questions and objectives

#### SHORT_END_STICK_2025:rq_001: Design of an IS for simultaneous prevention of poaching and manipulation

How should an information system be designed to enable interorganizational information sharing based on sensitive data while simultaneously preventing both information poaching and information manipulation?

How should an information system be designed to enable interorganizational information sharing based on sensitive data while simultaneously preventing both information poaching and information manipulation?
### Theoretical foundations

#### SHORT_END_STICK_2025:kt_001_transaction_cost_economics_and_opportunism: Transaction cost economics and opportunism

The paper builds on transaction cost economics and the concept of opportunism, especially selfish behavior with guile in interorganizational relationships.

The paper builds on transaction cost economics and the concept of opportunism, especially selfish behavior with guile in interorganizational relationships.

#### SHORT_END_STICK_2025:kt_002_information_poaching_and_information_manipulation_literature: Information poaching and information manipulation literature

Prior literature on information poaching, manipulation, governance, and interorganizational information sharing grounds the problem identification.

Prior literature on information poaching, manipulation, governance, and interorganizational information sharing grounds the problem identification.

#### SHORT_END_STICK_2025:kt_003_blockchain_governance_and_smart_contracts: Blockchain governance, smart contracts, and private data collections

The artifact is grounded in blockchain literature on manipulation-resistant storage, smart contract execution, governance, and Hyperledger Fabric confidentiality mechanisms.

The artifact is grounded in blockchain literature on manipulation-resistant storage, smart contract execution, governance, and Hyperledger Fabric confidentiality mechanisms.
### Limitations

#### SHORT_END_STICK_2025:lim_001_best_when_both_sides_fear_opportunism: Most effective when both parties fear opportunism

The solution is most useful when both the information provider and information recipient simultaneously fear opportunistic behavior. If only one party faces opportunism risk, simpler systems may suffice.

The solution is most useful when both the information provider and information recipient simultaneously fear opportunistic behavior. If only one party faces opportunism risk, simpler systems may suffice.

#### SHORT_END_STICK_2025:lim_002_nonreversible_function_definition_cost: Nonreversible functions can be costly to define

Jointly defining and approving appropriate nonreversible functions can be time-consuming and costly, so the approach fits better in relatively stable contexts where computation logic does not change frequently.

Jointly defining and approving appropriate nonreversible functions can be time-consuming and costly, so the approach fits better in relatively stable contexts where computation logic does not change frequently.

#### SHORT_END_STICK_2025:lim_003_blockchain_network_integrity_dependency: Dependency on blockchain network integrity

The solution relies on the integrity and governance of the underlying permissioned blockchain network.

The solution relies on the integrity and governance of the underlying permissioned blockchain network.

#### SHORT_END_STICK_2025:lim_004_first_mile_problem: First-mile problem before data enter the shared IS

The artifact prevents manipulation only after data have entered the shared system. Hardware or upstream systems could still be manipulated before ingestion.

The artifact prevents manipulation only after data have entered the shared system. Hardware or upstream systems could still be manipulated before ingestion.

#### SHORT_END_STICK_2025:lim_005_artificial_utility_evaluation: Artificial utility evaluation

The wider proof-of-value evaluation uses a vignette-based survey rather than a naturalistic deployment across many organizations.

The wider proof-of-value evaluation uses a vignette-based survey rather than a naturalistic deployment across many organizations.
### Contextual links excluded from the canonical graph

These source-preserved legacy links touch a research question/objective, theoretical foundation, limitation, or unresolved legacy record. They remain human-readable context only and are not canonical graph edges.

- `SHORT_END_STICK_2025:rel_027`: `SHORT_END_STICK_2025:kt_001_transaction_cost_economics_and_opportunism` — **derived from** → `SHORT_END_STICK_2025:problem_two_sided_opportunism`; evidence `SHORT_END_STICK_2025:ev_001_paper_problem_two_sided_opportunism`; confidence high.
- `SHORT_END_STICK_2025:rel_028`: `SHORT_END_STICK_2025:kt_003_blockchain_governance_and_smart_contracts` — **derived from** → `SHORT_END_STICK_2025:artifact_001_hyperledger_fabric_two_sided_opportunism_solution`; evidence `SHORT_END_STICK_2025:ev_026_online_appendix_blockchain_mechanisms`; confidence medium-high.
