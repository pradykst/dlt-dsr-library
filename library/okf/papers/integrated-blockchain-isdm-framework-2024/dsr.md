---
schema_version: "okf-dsr-v1"
type: "ConceptCollection"
paper_id: "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024"
extraction_status: "okf_draft"
review_status: "unreviewed"
---

# Canonical DSR Concepts

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:prob_001_lack_integrated_blockchain_isdm
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:prob_001_lack_integrated_blockchain_isdm",
  "type": "Problem",
  "title": "Lack of an integrated ISDM framework for blockchain systems",
  "description": "The paper frames blockchain system development as lacking a cohesive information-systems development method that organizes lifecycle tasks, roles, and models for blockchain-specific work.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_001_abstract_gap",
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_003_theoretical_framework_gap"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The paper frames blockchain system development as lacking a cohesive information-systems development method that organizes lifecycle tasks, roles, and models for blockchain-specific work.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:prob_002_blockchain_development_complexity_and_failures
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:prob_002_blockchain_development_complexity_and_failures",
  "type": "Problem",
  "title": "Complexity and failures in blockchain system implementation",
  "description": "Organizations face security, privacy, scalability, interoperability, maintainability, language, and governance complexities when implementing blockchain systems; high-profile attacks and losses illustrate the stakes.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_002_intro_attacks_complexity",
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_006_unique_requirements"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Organizations face security, privacy, scalability, interoperability, maintainability, language, and governance complexities when implementing blockchain systems; high-profile attacks and losses illustrate the stakes.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:prob_003_fragmented_technical_and_partial_method_knowledge
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:prob_003_fragmented_technical_and_partial_method_knowledge",
  "type": "Problem",
  "title": "Fragmented and overly technical blockchain development knowledge",
  "description": "Existing literature often provides only partial, technical, platform-specific, or phase-specific development guidance rather than an end-to-end ISDM view.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_005_prior_literature_streams",
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_014_framework_purpose"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Existing literature often provides only partial, technical, platform-specific, or phase-specific development guidance rather than an end-to-end ISDM view.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_001_comprehensiveness
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_001_comprehensiveness",
  "type": "Design Requirement",
  "title": "Comprehensiveness of blockchain ISDM coverage",
  "description": "A useful framework must cover critical method fragments across development process, modeling, and roles for blockchain system development.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_007_quality_criteria"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

A useful framework must cover critical method fragments across development process, modeling, and roles for blockchain system development.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_002_generality
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_002_generality",
  "type": "Design Requirement",
  "title": "Generality across platforms and implementations",
  "description": "A useful framework should be abstract and independent of particular blockchain platforms, protocols, standards, implementation languages, or technical details.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_007_quality_criteria"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

A useful framework should be abstract and independent of particular blockchain platforms, protocols, standards, implementation languages, or technical details.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_003_soundness
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_003_soundness",
  "type": "Design Requirement",
  "title": "Soundness and semantic link to real blockchain development",
  "description": "A useful framework must be meaningful and semantically connected to real-world blockchain system development.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_007_quality_criteria",
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_011_case_study_purpose"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

A useful framework must be meaningful and semantically connected to real-world blockchain system development.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_004_security_and_privacy
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_004_security_and_privacy",
  "type": "Design Requirement",
  "title": "Address security and privacy in blockchain development",
  "description": "Blockchain ISDMs must include method fragments that guide choices and safeguards for smart-contract vulnerabilities, consensus attacks, privacy breaches, and access control.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_006_unique_requirements",
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_034_security_privacy_requirement"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Blockchain ISDMs must include method fragments that guide choices and safeguards for smart-contract vulnerabilities, consensus attacks, privacy breaches, and access control.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_005_scalability_and_performance
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_005_scalability_and_performance",
  "type": "Design Requirement",
  "title": "Address scalability and performance",
  "description": "Blockchain ISDMs must address scalability and performance as networks, storage demands, transactions, and participant nodes increase.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_006_unique_requirements",
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_035_scalability_requirement"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Blockchain ISDMs must address scalability and performance as networks, storage demands, transactions, and participant nodes increase.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_006_interoperability
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_006_interoperability",
  "type": "Design Requirement",
  "title": "Address interoperability across chains and legacy systems",
  "description": "Blockchain ISDMs must guide cross-chain communication, interaction design, and integration with existing systems.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_006_unique_requirements",
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_036_interoperability_requirement"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Blockchain ISDMs must guide cross-chain communication, interaction design, and integration with existing systems.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_007_energy_and_gas_efficiency
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_007_energy_and_gas_efficiency",
  "type": "Design Requirement",
  "title": "Address energy and gas consumption",
  "description": "Blockchain ISDMs must provide guidance for estimating and optimizing smart-contract computational cost and selecting suitable consensus mechanisms.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_006_unique_requirements",
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_027_food_trust_deficiency",
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_037_energy_requirement"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Blockchain ISDMs must provide guidance for estimating and optimizing smart-contract computational cost and selecting suitable consensus mechanisms.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_008_maintainability
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_008_maintainability",
  "type": "Design Requirement",
  "title": "Address maintainability and lifecycle updates",
  "description": "Blockchain ISDMs must support updating, improving, correcting, and eventually retiring deployed smart contracts and blockchain components.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_006_unique_requirements",
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_017_framework_lifecycle",
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_038_maintenance_requirement"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Blockchain ISDMs must support updating, improving, correcting, and eventually retiring deployed smart contracts and blockchain components.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_009_platform_and_language_fit
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_009_platform_and_language_fit",
  "type": "Design Requirement",
  "title": "Address platform and programming-language fit",
  "description": "Blockchain ISDMs must align development choices with the selected blockchain platform and supported smart-contract programming languages.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_006_unique_requirements",
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_039_language_requirement"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Blockchain ISDMs must align development choices with the selected blockchain platform and supported smart-contract programming languages.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dp_001_organize_isdm_by_process_roles_models
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dp_001_organize_isdm_by_process_roles_models",
  "type": "Design Principle",
  "title": "Organize blockchain ISDMs by development process, roles, and modeling",
  "description": "Design blockchain ISDM knowledge around three core aspects: development lifecycle tasks, participating roles, and modeling outputs.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_008_isdm_core_aspects",
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_013_framework_structure"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Design blockchain ISDM knowledge around three core aspects: development lifecycle tasks, participating roles, and modeling outputs.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dp_002_conduct_blockchain_specific_analysis_before_design
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dp_002_conduct_blockchain_specific_analysis_before_design",
  "type": "Design Principle",
  "title": "Conduct blockchain-specific analysis before design",
  "description": "Before design, analyze organizational readiness, technology, participants, use cases, and agreements to justify blockchain system development.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_015_analysis_phase",
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_040_analysis_case_logic"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Before design, analyze organizational readiness, technology, participants, use cases, and agreements to justify blockchain system development.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dp_003_separate_preliminary_architecture_from_detailed_design
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dp_003_separate_preliminary_architecture_from_detailed_design",
  "type": "Design Principle",
  "title": "Separate preliminary blockchain architecture decisions from detailed design",
  "description": "Treat on/off-chain partitioning, blockchain type, smart-contract skeletons, and platform selection as preliminary design decisions before detailed protocol and interaction design.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_016_preliminary_design",
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_041_preliminary_and_detailed_design_logic"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Treat on/off-chain partitioning, blockchain type, smart-contract skeletons, and platform selection as preliminary design decisions before detailed protocol and interaction design.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dp_004_design_blockchain_specific_protocols_and_contract_details
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dp_004_design_blockchain_specific_protocols_and_contract_details",
  "type": "Design Principle",
  "title": "Design blockchain-specific protocols and smart-contract details explicitly",
  "description": "Detailed blockchain design should define consensus, incentives, smart-contract change mechanisms, interactions, security, gas, disputes, permissions, and replication.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_017_framework_lifecycle"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Detailed blockchain design should define consensus, incentives, smart-contract change mechanisms, interactions, security, gas, disputes, permissions, and replication.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dp_005_construct_test_integrate_and_transition_smart_contracts
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dp_005_construct_test_integrate_and_transition_smart_contracts",
  "type": "Design Principle",
  "title": "Construct, test, integrate, configure, and publish smart contracts before operation",
  "description": "The framework separates smart-contract implementation/testing/integration from later transition tasks such as system configuration and smart-contract publication.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_017_framework_lifecycle",
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_042_construction_transition_logic"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The framework separates smart-contract implementation/testing/integration from later transition tasks such as system configuration and smart-contract publication.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dp_006_plan_operation_maintenance_and_retirement
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dp_006_plan_operation_maintenance_and_retirement",
  "type": "Design Principle",
  "title": "Plan blockchain operation, maintenance, and retirement",
  "description": "Blockchain ISDMs should include postdeployment node monitoring, contract-correctness evaluation, and retirement/termination tasks.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_017_framework_lifecycle",
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_043_maintenance_retirement_logic"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Blockchain ISDMs should include postdeployment node monitoring, contract-correctness evaluation, and retirement/termination tasks.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dp_007_evaluate_isdms_using_comprehensiveness_generality_soundness
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dp_007_evaluate_isdms_using_comprehensiveness_generality_soundness",
  "type": "Design Principle",
  "title": "Evaluate blockchain ISDMs using comprehensiveness, generality, and soundness",
  "description": "The framework should be designed and validated using criteria that check coverage, abstraction, and real-world semantic fit.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_007_quality_criteria",
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_009_dsr_iterations"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The framework should be designed and validated using criteria that check coverage, abstraction, and real-world semantic fit.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_001_assess_readiness
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_001_assess_readiness",
  "type": "Design Feature",
  "title": "Assess readiness",
  "description": "Analysis task to assess organizational and technical readiness for blockchain development.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_015_analysis_phase"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Analysis task to assess organizational and technical readiness for blockchain development.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_002_analyze_technology
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_002_analyze_technology",
  "type": "Design Feature",
  "title": "Analyze technology",
  "description": "Analysis task to evaluate candidate blockchain technologies and their fit to the problem.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_027_food_trust_deficiency"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Analysis task to evaluate candidate blockchain technologies and their fit to the problem.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_003_identify_participants
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_003_identify_participants",
  "type": "Design Feature",
  "title": "Identify participants",
  "description": "Analysis task to identify blockchain users, stakeholders, organizations, and systems involved.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_015_analysis_phase"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Analysis task to identify blockchain users, stakeholders, organizations, and systems involved.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_004_develop_use_cases
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_004_develop_use_cases",
  "type": "Design Feature",
  "title": "Develop use cases",
  "description": "Analysis task to develop blockchain use cases and business scenarios.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_015_analysis_phase"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Analysis task to develop blockchain use cases and business scenarios.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_005_approve_agreement
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_005_approve_agreement",
  "type": "Design Feature",
  "title": "Approve agreement",
  "description": "Analysis task to approve the agreement or business arrangement before further design.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_015_analysis_phase"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Analysis task to approve the agreement or business arrangement before further design.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_006_decide_on_off_blockchain
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_006_decide_on_off_blockchain",
  "type": "Design Feature",
  "title": "Decide on/off blockchain",
  "description": "Preliminary design task to decide which components and data stay on-chain or off-chain.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_016_preliminary_design"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Preliminary design task to decide which components and data stay on-chain or off-chain.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_007_decide_blockchain_type
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_007_decide_blockchain_type",
  "type": "Design Feature",
  "title": "Decide on blockchain type",
  "description": "Preliminary design task to select permissioned/private/public blockchain configuration.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_016_preliminary_design"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Preliminary design task to select permissioned/private/public blockchain configuration.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_008_define_smart_contract_skeleton
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_008_define_smart_contract_skeleton",
  "type": "Design Feature",
  "title": "Define smart contract skeleton",
  "description": "Preliminary design task to define the initial smart-contract structure from contractual and business logic.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_016_preliminary_design"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Preliminary design task to define the initial smart-contract structure from contractual and business logic.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_009_select_platform
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_009_select_platform",
  "type": "Design Feature",
  "title": "Select platform",
  "description": "Preliminary design task to select a blockchain platform such as Ethereum, Hyperledger Fabric, or a cross-chain tool.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_016_preliminary_design"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Preliminary design task to select a blockchain platform such as Ethereum, Hyperledger Fabric, or a cross-chain tool.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_010_create_consensus_protocols
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_010_create_consensus_protocols",
  "type": "Design Feature",
  "title": "Create consensus protocols",
  "description": "Detailed design task to define consensus mechanisms or consensus-related design choices.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_017_framework_lifecycle"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Detailed design task to define consensus mechanisms or consensus-related design choices.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_011_define_incentive_protocols
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_011_define_incentive_protocols",
  "type": "Design Feature",
  "title": "Define incentive protocols",
  "description": "Detailed design task to specify incentive protocols relevant to blockchain participation and validation.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_017_framework_lifecycle"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Detailed design task to specify incentive protocols relevant to blockchain participation and validation.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_012_define_smart_contract_changes
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_012_define_smart_contract_changes",
  "type": "Design Feature",
  "title": "Define smart contract changes",
  "description": "Detailed design task to decide how smart contracts can be changed, upgraded, or governed.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_017_framework_lifecycle"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Detailed design task to decide how smart contracts can be changed, upgraded, or governed.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_013_define_interactions
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_013_define_interactions",
  "type": "Design Feature",
  "title": "Define interactions",
  "description": "Detailed design task to specify interactions among blockchain actors, smart contracts, off-chain systems, and chains.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_017_framework_lifecycle"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Detailed design task to specify interactions among blockchain actors, smart contracts, off-chain systems, and chains.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_014_design_security
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_014_design_security",
  "type": "Design Feature",
  "title": "Design security",
  "description": "Detailed design task to address security, access control, vulnerabilities, and auditability.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_017_framework_lifecycle"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Detailed design task to address security, access control, vulnerabilities, and auditability.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_015_optimize_gas_consumption
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_015_optimize_gas_consumption",
  "type": "Design Feature",
  "title": "Optimize gas consumption",
  "description": "Detailed design task to reduce smart-contract computational cost and gas fees.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_027_food_trust_deficiency"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Detailed design task to reduce smart-contract computational cost and gas fees.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_016_resolve_disputes
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_016_resolve_disputes",
  "type": "Design Feature",
  "title": "Resolve disputes",
  "description": "Detailed design task to define dispute-resolution mechanisms around smart-contract and blockchain workflows.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_017_framework_lifecycle"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Detailed design task to define dispute-resolution mechanisms around smart-contract and blockchain workflows.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_017_design_permissions
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_017_design_permissions",
  "type": "Design Feature",
  "title": "Design permissions",
  "description": "Detailed design task to specify roles, access rights, and permission structures.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_017_framework_lifecycle"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Detailed design task to specify roles, access rights, and permission structures.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_018_design_replications
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_018_design_replications",
  "type": "Design Feature",
  "title": "Design replications",
  "description": "Detailed design task to specify replication and ledger-data distribution design.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_017_framework_lifecycle"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Detailed design task to specify replication and ledger-data distribution design.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_019_implement_smart_contracts
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_019_implement_smart_contracts",
  "type": "Design Feature",
  "title": "Implement smart contracts",
  "description": "Construction task to implement executable smart-contract code.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_017_framework_lifecycle"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Construction task to implement executable smart-contract code.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_020_test_smart_contracts
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_020_test_smart_contracts",
  "type": "Design Feature",
  "title": "Test smart contracts",
  "description": "Construction task to test smart contracts before deployment.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_017_framework_lifecycle"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Construction task to test smart contracts before deployment.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_021_integrate_with_off_blockchain
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_021_integrate_with_off_blockchain",
  "type": "Design Feature",
  "title": "Integrate with off blockchain",
  "description": "Construction task to integrate smart contracts with off-chain systems and components.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_017_framework_lifecycle"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Construction task to integrate smart contracts with off-chain systems and components.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_022_configure_system
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_022_configure_system",
  "type": "Design Feature",
  "title": "Configure system",
  "description": "Transition task to configure the blockchain system before operation.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_017_framework_lifecycle"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Transition task to configure the blockchain system before operation.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_023_publish_smart_contracts
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_023_publish_smart_contracts",
  "type": "Design Feature",
  "title": "Publish smart contracts",
  "description": "Transition task to deploy or publish validated smart contracts to the target blockchain platform.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_017_framework_lifecycle"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Transition task to deploy or publish validated smart contracts to the target blockchain platform.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_024_monitor_nodes
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_024_monitor_nodes",
  "type": "Design Feature",
  "title": "Monitor nodes",
  "description": "Maintenance task to monitor blockchain nodes in operation.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_017_framework_lifecycle"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Maintenance task to monitor blockchain nodes in operation.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_025_evaluate_contract_correctness
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_025_evaluate_contract_correctness",
  "type": "Design Feature",
  "title": "Evaluate contract correctness",
  "description": "Maintenance task to evaluate smart-contract correctness after delivery.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_017_framework_lifecycle"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Maintenance task to evaluate smart-contract correctness after delivery.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_026_terminate
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_026_terminate",
  "type": "Design Feature",
  "title": "Terminate",
  "description": "Retirement task to terminate the blockchain system or move data back off-chain.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_017_framework_lifecycle"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Retirement task to terminate the blockchain system or move data back off-chain.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_027_model_use_case_prototype_requirements
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_027_model_use_case_prototype_requirements",
  "type": "Design Feature",
  "title": "Model use cases, prototypes, and requirements",
  "description": "Modeling output from analysis that captures use cases, prototypes, and requirements.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_018_modeling_outputs"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Modeling output from analysis that captures use cases, prototypes, and requirements.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_028_model_smart_contract_architecture_forking
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_028_model_smart_contract_architecture_forking",
  "type": "Design Feature",
  "title": "Model smart contracts, base architecture, and forking",
  "description": "Modeling output from preliminary design that captures smart contracts, base architecture, and forking decisions.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_018_modeling_outputs"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Modeling output from preliminary design that captures smart contracts, base architecture, and forking decisions.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_029_model_data_flow_interactions_consensus_transactions
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_029_model_data_flow_interactions_consensus_transactions",
  "type": "Design Feature",
  "title": "Model data flow, interactions, consensus, and transactions",
  "description": "Modeling output from detailed design that captures data flow, interactions, consensus, and transactions.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_018_modeling_outputs"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Modeling output from detailed design that captures data flow, interactions, consensus, and transactions.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_030_model_executable_smart_contracts
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_030_model_executable_smart_contracts",
  "type": "Design Feature",
  "title": "Model executable smart contracts",
  "description": "Modeling output from construction that captures executable smart contracts.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_018_modeling_outputs"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Modeling output from construction that captures executable smart contracts.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_031_include_blockchain_user_and_legal_professional_roles
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_031_include_blockchain_user_and_legal_professional_roles",
  "type": "Design Feature",
  "title": "Include blockchain user and legal professional roles",
  "description": "Role method fragment for blockchain users and legal professionals participating in blockchain system development.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_019_role_aspect"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Role method fragment for blockchain users and legal professionals participating in blockchain system development.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_032_include_architect_role
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_032_include_architect_role",
  "type": "Design Feature",
  "title": "Include architect role",
  "description": "Role method fragment for system or blockchain architects.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_019_role_aspect"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Role method fragment for system or blockchain architects.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_033_include_security_core_and_contract_developer_roles
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_033_include_security_core_and_contract_developer_roles",
  "type": "Design Feature",
  "title": "Include security, core blockchain developer, and smart-contract developer roles",
  "description": "Role method fragment for security specialists, core blockchain developers, and smart-contract developers.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_019_role_aspect"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Role method fragment for security specialists, core blockchain developers, and smart-contract developers.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_034_include_smart_contract_developer_role
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_034_include_smart_contract_developer_role",
  "type": "Design Feature",
  "title": "Include smart-contract developer role",
  "description": "Role method fragment focused on smart-contract development.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_019_role_aspect"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Role method fragment focused on smart-contract development.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_035_include_integrator_and_auditor_roles
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_035_include_integrator_and_auditor_roles",
  "type": "Design Feature",
  "title": "Include integrator and auditor roles",
  "description": "Role method fragment for blockchain integration and audit responsibilities.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_019_role_aspect"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Role method fragment for blockchain integration and audit responsibilities.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_036_include_miner_and_node_operator_roles
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_036_include_miner_and_node_operator_roles",
  "type": "Design Feature",
  "title": "Include miner and node operator roles",
  "description": "Role method fragment for node operation, mining, or validation responsibilities.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_019_role_aspect"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Role method fragment for node operation, mining, or validation responsibilities.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:art_001_integrated_blockchain_isdm_framework
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:art_001_integrated_blockchain_isdm_framework",
  "type": "Artifact",
  "title": "Integrated blockchain ISDM framework",
  "description": "A framework organizing blockchain system development method fragments into development process, role, and modeling aspects across lifecycle phases.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_013_framework_structure",
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_014_framework_purpose"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

A framework organizing blockchain system development method fragments into development process, role, and modeling aspects across lifecycle phases.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:art_002_blockchain_method_fragment_repository
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:art_002_blockchain_method_fragment_repository",
  "type": "Artifact",
  "title": "Repository of blockchain development method fragments",
  "description": "The framework functions as a reusable repository of method fragments that can be used to build, tailor, or evaluate blockchain ISDMs.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_024_theoretical_contribution",
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_044_method_engineering_artifact"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The framework functions as a reusable repository of method fragments that can be used to build, tailor, or evaluate blockchain ISDMs.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:art_003_food_trust_case_framework_instantiation
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:art_003_food_trust_case_framework_instantiation",
  "type": "Artifact",
  "title": "Food Trust case framework instantiation",
  "description": "Application of the framework to a permissioned private food-traceability blockchain project.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_020_food_trust_case"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Application of the framework to a permissioned private food-traceability blockchain project.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:art_004_token_exchanger_case_framework_instantiation
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:art_004_token_exchanger_case_framework_instantiation",
  "type": "Artifact",
  "title": "Token Exchanger case framework instantiation",
  "description": "Application of the framework to a permissioned public cross-chain token-exchange blockchain service.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_021_token_exchanger_case"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Application of the framework to a permissioned public cross-chain token-exchange blockchain service.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:art_005_isdm_evaluation_yardstick
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:art_005_isdm_evaluation_yardstick",
  "type": "Artifact",
  "title": "Blockchain ISDM evaluation yardstick",
  "description": "The framework is used as a yardstick to identify omissions and deficiencies in in-house ISDMs.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_025_framework_practical_yardstick",
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_026_case_comparison"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The framework is used as a yardstick to identify omissions and deficiencies in in-house ISDMs.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:eval_001_systematic_literature_review_iteration
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:eval_001_systematic_literature_review_iteration",
  "type": "Evaluation",
  "title": "Systematic literature review iteration",
  "description": "The first DSR iteration derives method fragments from selected blockchain-development literature.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_009_dsr_iterations",
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_012_literature_iteration"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The first DSR iteration derives method fragments from selected blockchain-development literature.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:eval_002_domain_expert_review_iteration
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:eval_002_domain_expert_review_iteration",
  "type": "Evaluation",
  "title": "Domain expert review iteration",
  "description": "The second DSR iteration validates, refines, and extends the framework using qualitative feedback from blockchain domain experts.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_009_dsr_iterations",
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_010_expert_review"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The second DSR iteration validates, refines, and extends the framework using qualitative feedback from blockchain domain experts.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:eval_003_case_study_application_iteration
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:eval_003_case_study_application_iteration",
  "type": "Evaluation",
  "title": "Case study application iteration",
  "description": "The third DSR iteration applies the framework to real blockchain projects to evaluate and refine it.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_009_dsr_iterations",
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_011_case_study_purpose"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The third DSR iteration applies the framework to real blockchain projects to evaluate and refine it.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:eval_004_food_trust_case_evaluation
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:eval_004_food_trust_case_evaluation",
  "type": "Evaluation",
  "title": "Food Trust case evaluation",
  "description": "The framework identifies instantiated and missing method fragments in the Food Trust blockchain-traceability case.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_020_food_trust_case",
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_027_food_trust_deficiency",
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_022_food_trust_blue_labels"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The framework identifies instantiated and missing method fragments in the Food Trust blockchain-traceability case.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:eval_005_token_exchanger_case_evaluation
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:eval_005_token_exchanger_case_evaluation",
  "type": "Evaluation",
  "title": "Token Exchanger case evaluation",
  "description": "The framework identifies instantiated and missing method fragments in the Token Exchanger cross-chain token exchange case.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_021_token_exchanger_case",
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_028_token_exchanger_deficiency",
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_023_token_exchanger_blue_labels"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The framework identifies instantiated and missing method fragments in the Token Exchanger cross-chain token exchange case.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ok_001_framework_elevates_blockchain_isdm_to_managerial_level
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ok_001_framework_elevates_blockchain_isdm_to_managerial_level",
  "type": "Output Knowledge",
  "title": "Framework elevates blockchain ISDM from technical to managerial level",
  "description": "The framework shifts discussion beyond smart-contract programming toward lifecycle, roles, and modeling aspects of blockchain system development.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_024_theoretical_contribution",
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_046_what_how_separation"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The framework shifts discussion beyond smart-contract programming toward lifecycle, roles, and modeling aspects of blockchain system development.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ok_002_framework_integrates_fragmented_blockchain_method_knowledge
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ok_002_framework_integrates_fragmented_blockchain_method_knowledge",
  "type": "Output Knowledge",
  "title": "Framework integrates fragmented blockchain method knowledge",
  "description": "The framework consolidates multiple partial views of blockchain development into a shared method-fragment structure.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_024_theoretical_contribution"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The framework consolidates multiple partial views of blockchain development into a shared method-fragment structure.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ok_003_framework_identifies_in_house_isdm_deficiencies
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ok_003_framework_identifies_in_house_isdm_deficiencies",
  "type": "Output Knowledge",
  "title": "Framework identifies deficiencies in in-house blockchain ISDMs",
  "description": "The framework can reveal unsupported or weakly supported method fragments in real development methods, such as missing technology analysis or gas optimization.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_025_framework_practical_yardstick",
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_027_food_trust_deficiency",
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_045_case_study_results_summary"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The framework can reveal unsupported or weakly supported method fragments in real development methods, such as missing technology analysis or gas optimization.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ok_004_conventional_isd_fragments_can_be_reused_but_must_be_extended
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ok_004_conventional_isd_fragments_can_be_reused_but_must_be_extended",
  "type": "Output Knowledge",
  "title": "Conventional ISD fragments can be reused but must be extended",
  "description": "The framework shows that conventional ISD fragments such as prototypes and architecture can connect with blockchain development, while blockchain-specific fragments are still needed.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_029_conventional_isd_reuse"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The framework shows that conventional ISD fragments such as prototypes and architecture can connect with blockchain development, while blockchain-specific fragments are still needed.

---

## Concept: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ok_005_framework_supports_new_isdm_design_evaluation_and_tailoring
```json
{
  "id": "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ok_005_framework_supports_new_isdm_design_evaluation_and_tailoring",
  "type": "Output Knowledge",
  "title": "Framework supports new ISDM design, evaluation, and tailoring",
  "description": "The framework offers a repository of fragments to create bespoke ISDMs or augment existing ones for blockchain projects.",
  "evidence": [
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_025_framework_practical_yardstick",
    "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_030_tailoring_future_work"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The framework offers a repository of fragments to create bespoke ISDMs or augment existing ones for blockchain projects.
