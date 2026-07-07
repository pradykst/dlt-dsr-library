---
type: PaperDSRProfile
paper_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024
title: DSR profile for integrated blockchain ISDM framework paper
review_status: reviewed
confidence: high
source_pdf: Towards an integrated framework for developing blockchain systems.pdf
---

# DSR-OKF Profile

## Paper-level summary

The paper designs and evaluates an integrated framework for developing blockchain systems. It treats the framework as a method-engineering artifact that organizes blockchain-specific method fragments under development process, role, and modeling aspects. The framework is validated through literature review, expert review, and case-study applications in Food Trust and Token Exchanger.


---

## Concept: prob_001_lack_integrated_blockchain_isdm

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:prob_001_lack_integrated_blockchain_isdm
type: Problem
dsr_layer: Problem
title: Lack of an integrated ISDM framework for blockchain systems
description: The paper frames blockchain system development as lacking a cohesive
  information-systems development method that organizes lifecycle tasks, roles, and
  models for blockchain-specific work.
tags:
- blockchain
- ISDM
- method-engineering
- development-lifecycle
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_001_abstract_gap
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_003_theoretical_framework_gap
```

### Explanation

The paper frames blockchain system development as lacking a cohesive information-systems development method that organizes lifecycle tasks, roles, and models for blockchain-specific work.


---

## Concept: prob_002_blockchain_development_complexity_and_failures

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:prob_002_blockchain_development_complexity_and_failures
type: Problem
dsr_layer: Problem
title: Complexity and failures in blockchain system implementation
description: Organizations face security, privacy, scalability, interoperability,
  maintainability, language, and governance complexities when implementing blockchain
  systems; high-profile attacks and losses illustrate the stakes.
tags:
- blockchain
- complexity
- security
- implementation-risk
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_002_intro_attacks_complexity
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_006_unique_requirements
```

### Explanation

Organizations face security, privacy, scalability, interoperability, maintainability, language, and governance complexities when implementing blockchain systems; high-profile attacks and losses illustrate the stakes.


---

## Concept: prob_003_fragmented_technical_and_partial_method_knowledge

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:prob_003_fragmented_technical_and_partial_method_knowledge
type: Problem
dsr_layer: Problem
title: Fragmented and overly technical blockchain development knowledge
description: Existing literature often provides only partial, technical, platform-specific,
  or phase-specific development guidance rather than an end-to-end ISDM view.
tags:
- fragmentation
- smart-contracts
- method-fragments
- literature-gap
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_005_prior_literature_streams
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_014_framework_purpose
```

### Explanation

Existing literature often provides only partial, technical, platform-specific, or phase-specific development guidance rather than an end-to-end ISDM view.


---

## Concept: rq_001_design_integrated_framework_for_blockchain_isdms

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rq_001_design_integrated_framework_for_blockchain_isdms
type: ResearchQuestion
dsr_layer: ResearchQuestion
title: Design an integrated framework for blockchain system development methods
description: The research seeks to create a conceptual framework that organizes development
  process, role, and modeling method fragments for blockchain systems.
tags:
- research-objective
- framework
- blockchain-ISDM
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_004_research_objective
```

### Explanation

The research seeks to create a conceptual framework that organizes development process, role, and modeling method fragments for blockchain systems.


---

## Concept: rq_002_validate_framework_with_experts_and_case_studies

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rq_002_validate_framework_with_experts_and_case_studies
type: ResearchQuestion
dsr_layer: ResearchQuestion
title: Validate the framework through experts and real-world blockchain cases
description: The study validates and refines the framework through domain expert review
  and two case studies in supply chain and finance.
tags:
- validation
- expert-review
- case-study
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_009_dsr_iterations
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_011_case_study_purpose
```

### Explanation

The study validates and refines the framework through domain expert review and two case studies in supply chain and finance.


---

## Concept: rq_003_support_evaluation_and_design_of_in_house_isdms

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:rq_003_support_evaluation_and_design_of_in_house_isdms
type: ResearchQuestion
dsr_layer: ResearchQuestion
title: Use the framework to evaluate and design in-house blockchain ISDMs
description: The framework is intended as a yardstick to compare, evaluate, extend,
  or design ISDMs for blockchain development.
tags:
- ISDM-evaluation
- method-tailoring
- practitioner-guidance
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_004_research_objective
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_025_framework_practical_yardstick
```

### Explanation

The framework is intended as a yardstick to compare, evaluate, extend, or design ISDMs for blockchain development.


---

## Concept: dr_001_comprehensiveness

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_001_comprehensiveness
type: DesignRequirement
dsr_layer: Requirement
title: Comprehensiveness of blockchain ISDM coverage
description: A useful framework must cover critical method fragments across development
  process, modeling, and roles for blockchain system development.
tags:
- quality-criterion
- comprehensiveness
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_007_quality_criteria
```

### Explanation

A useful framework must cover critical method fragments across development process, modeling, and roles for blockchain system development.


---

## Concept: dr_002_generality

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_002_generality
type: DesignRequirement
dsr_layer: Requirement
title: Generality across platforms and implementations
description: A useful framework should be abstract and independent of particular blockchain
  platforms, protocols, standards, implementation languages, or technical details.
tags:
- quality-criterion
- generality
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_007_quality_criteria
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_010_generality_refinement
```

### Explanation

A useful framework should be abstract and independent of particular blockchain platforms, protocols, standards, implementation languages, or technical details.


---

## Concept: dr_003_soundness

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_003_soundness
type: DesignRequirement
dsr_layer: Requirement
title: Soundness and semantic link to real blockchain development
description: A useful framework must be meaningful and semantically connected to real-world
  blockchain system development.
tags:
- quality-criterion
- soundness
- real-world-fit
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_007_quality_criteria
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_011_case_study_purpose
```

### Explanation

A useful framework must be meaningful and semantically connected to real-world blockchain system development.


---

## Concept: dr_004_security_and_privacy

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_004_security_and_privacy
type: DesignRequirement
dsr_layer: Requirement
title: Address security and privacy in blockchain development
description: Blockchain ISDMs must include method fragments that guide choices and
  safeguards for smart-contract vulnerabilities, consensus attacks, privacy breaches,
  and access control.
tags:
- security
- privacy
- smart-contracts
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_006_unique_requirements
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_034_security_privacy_requirement
```

### Explanation

Blockchain ISDMs must include method fragments that guide choices and safeguards for smart-contract vulnerabilities, consensus attacks, privacy breaches, and access control.


---

## Concept: dr_005_scalability_and_performance

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_005_scalability_and_performance
type: DesignRequirement
dsr_layer: Requirement
title: Address scalability and performance
description: Blockchain ISDMs must address scalability and performance as networks,
  storage demands, transactions, and participant nodes increase.
tags:
- scalability
- performance
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_006_unique_requirements
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_035_scalability_requirement
```

### Explanation

Blockchain ISDMs must address scalability and performance as networks, storage demands, transactions, and participant nodes increase.


---

## Concept: dr_006_interoperability

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_006_interoperability
type: DesignRequirement
dsr_layer: Requirement
title: Address interoperability across chains and legacy systems
description: Blockchain ISDMs must guide cross-chain communication, interaction design,
  and integration with existing systems.
tags:
- interoperability
- legacy-systems
- cross-chain
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_006_unique_requirements
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_036_interoperability_requirement
```

### Explanation

Blockchain ISDMs must guide cross-chain communication, interaction design, and integration with existing systems.


---

## Concept: dr_007_energy_and_gas_efficiency

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_007_energy_and_gas_efficiency
type: DesignRequirement
dsr_layer: Requirement
title: Address energy and gas consumption
description: Blockchain ISDMs must provide guidance for estimating and optimizing
  smart-contract computational cost and selecting suitable consensus mechanisms.
tags:
- gas
- energy
- optimization
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_006_unique_requirements
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_027_food_trust_deficiency
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_037_energy_requirement
```

### Explanation

Blockchain ISDMs must provide guidance for estimating and optimizing smart-contract computational cost and selecting suitable consensus mechanisms.


---

## Concept: dr_008_maintainability

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_008_maintainability
type: DesignRequirement
dsr_layer: Requirement
title: Address maintainability and lifecycle updates
description: Blockchain ISDMs must support updating, improving, correcting, and eventually
  retiring deployed smart contracts and blockchain components.
tags:
- maintenance
- smart-contract-lifecycle
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_006_unique_requirements
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_017_framework_lifecycle
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_038_maintenance_requirement
```

### Explanation

Blockchain ISDMs must support updating, improving, correcting, and eventually retiring deployed smart contracts and blockchain components.


---

## Concept: dr_009_platform_and_language_fit

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dr_009_platform_and_language_fit
type: DesignRequirement
dsr_layer: Requirement
title: Address platform and programming-language fit
description: Blockchain ISDMs must align development choices with the selected blockchain
  platform and supported smart-contract programming languages.
tags:
- programming-language
- platform-fit
- Solidity
- Hyperledger
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_006_unique_requirements
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_039_language_requirement
```

### Explanation

Blockchain ISDMs must align development choices with the selected blockchain platform and supported smart-contract programming languages.


---

## Concept: dp_001_organize_isdm_by_process_roles_models

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dp_001_organize_isdm_by_process_roles_models
type: DesignPrinciple
dsr_layer: Design Principle
title: Organize blockchain ISDMs by development process, roles, and modeling
description: 'Design blockchain ISDM knowledge around three core aspects: development
  lifecycle tasks, participating roles, and modeling outputs.'
tags:
- process
- roles
- models
- ISDM
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_008_isdm_core_aspects
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_013_framework_structure
```

### Explanation

Design blockchain ISDM knowledge around three core aspects: development lifecycle tasks, participating roles, and modeling outputs.


---

## Concept: dp_002_conduct_blockchain_specific_analysis_before_design

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dp_002_conduct_blockchain_specific_analysis_before_design
type: DesignPrinciple
dsr_layer: Design Principle
title: Conduct blockchain-specific analysis before design
description: Before design, analyze organizational readiness, technology, participants,
  use cases, and agreements to justify blockchain system development.
tags:
- analysis
- readiness
- use-case
- participants
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_015_analysis_phase
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_040_analysis_case_logic
```

### Explanation

Before design, analyze organizational readiness, technology, participants, use cases, and agreements to justify blockchain system development.


---

## Concept: dp_003_separate_preliminary_architecture_from_detailed_design

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dp_003_separate_preliminary_architecture_from_detailed_design
type: DesignPrinciple
dsr_layer: Design Principle
title: Separate preliminary blockchain architecture decisions from detailed design
description: Treat on/off-chain partitioning, blockchain type, smart-contract skeletons,
  and platform selection as preliminary design decisions before detailed protocol
  and interaction design.
tags:
- preliminary-design
- architecture
- on-chain
- off-chain
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_016_preliminary_design
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_041_preliminary_and_detailed_design_logic
```

### Explanation

Treat on/off-chain partitioning, blockchain type, smart-contract skeletons, and platform selection as preliminary design decisions before detailed protocol and interaction design.


---

## Concept: dp_004_design_blockchain_specific_protocols_and_contract_details

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dp_004_design_blockchain_specific_protocols_and_contract_details
type: DesignPrinciple
dsr_layer: Design Principle
title: Design blockchain-specific protocols and smart-contract details explicitly
description: Detailed blockchain design should define consensus, incentives, smart-contract
  change mechanisms, interactions, security, gas, disputes, permissions, and replication.
tags:
- detailed-design
- consensus
- incentives
- security
- permissions
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_017_framework_lifecycle
```

### Explanation

Detailed blockchain design should define consensus, incentives, smart-contract change mechanisms, interactions, security, gas, disputes, permissions, and replication.


---

## Concept: dp_005_construct_test_integrate_and_transition_smart_contracts

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dp_005_construct_test_integrate_and_transition_smart_contracts
type: DesignPrinciple
dsr_layer: Design Principle
title: Construct, test, integrate, configure, and publish smart contracts before operation
description: The framework separates smart-contract implementation/testing/integration
  from later transition tasks such as system configuration and smart-contract publication.
tags:
- construction
- testing
- transition
- smart-contracts
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_017_framework_lifecycle
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_042_construction_transition_logic
```

### Explanation

The framework separates smart-contract implementation/testing/integration from later transition tasks such as system configuration and smart-contract publication.


---

## Concept: dp_006_plan_operation_maintenance_and_retirement

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dp_006_plan_operation_maintenance_and_retirement
type: DesignPrinciple
dsr_layer: Design Principle
title: Plan blockchain operation, maintenance, and retirement
description: Blockchain ISDMs should include postdeployment node monitoring, contract-correctness
  evaluation, and retirement/termination tasks.
tags:
- maintenance
- retirement
- operations
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_017_framework_lifecycle
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_043_maintenance_retirement_logic
```

### Explanation

Blockchain ISDMs should include postdeployment node monitoring, contract-correctness evaluation, and retirement/termination tasks.


---

## Concept: dp_007_evaluate_isdms_using_comprehensiveness_generality_soundness

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:dp_007_evaluate_isdms_using_comprehensiveness_generality_soundness
type: DesignPrinciple
dsr_layer: Design Principle
title: Evaluate blockchain ISDMs using comprehensiveness, generality, and soundness
description: The framework should be designed and validated using criteria that check
  coverage, abstraction, and real-world semantic fit.
tags:
- evaluation
- criteria
- DSR
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_007_quality_criteria
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_009_dsr_iterations
```

### Explanation

The framework should be designed and validated using criteria that check coverage, abstraction, and real-world semantic fit.


---

## Concept: df_001_assess_readiness

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_001_assess_readiness
type: DesignFeature
dsr_layer: Feature
title: Assess readiness
description: Analysis task to assess organizational and technical readiness for blockchain
  development.
tags:
- analysis
- readiness
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_015_analysis_phase
```

### Explanation

Analysis task to assess organizational and technical readiness for blockchain development.


---

## Concept: df_002_analyze_technology

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_002_analyze_technology
type: DesignFeature
dsr_layer: Feature
title: Analyze technology
description: Analysis task to evaluate candidate blockchain technologies and their
  fit to the problem.
tags:
- analysis
- technology-selection
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_027_food_trust_deficiency
```

### Explanation

Analysis task to evaluate candidate blockchain technologies and their fit to the problem.


---

## Concept: df_003_identify_participants

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_003_identify_participants
type: DesignFeature
dsr_layer: Feature
title: Identify participants
description: Analysis task to identify blockchain users, stakeholders, organizations,
  and systems involved.
tags:
- analysis
- stakeholders
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_015_analysis_phase
```

### Explanation

Analysis task to identify blockchain users, stakeholders, organizations, and systems involved.


---

## Concept: df_004_develop_use_cases

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_004_develop_use_cases
type: DesignFeature
dsr_layer: Feature
title: Develop use cases
description: Analysis task to develop blockchain use cases and business scenarios.
tags:
- analysis
- use-case
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_015_analysis_phase
```

### Explanation

Analysis task to develop blockchain use cases and business scenarios.


---

## Concept: df_005_approve_agreement

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_005_approve_agreement
type: DesignFeature
dsr_layer: Feature
title: Approve agreement
description: Analysis task to approve the agreement or business arrangement before
  further design.
tags:
- analysis
- agreement
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_015_analysis_phase
```

### Explanation

Analysis task to approve the agreement or business arrangement before further design.


---

## Concept: df_006_decide_on_off_blockchain

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_006_decide_on_off_blockchain
type: DesignFeature
dsr_layer: Feature
title: Decide on/off blockchain
description: Preliminary design task to decide which components and data stay on-chain
  or off-chain.
tags:
- preliminary-design
- on-chain
- off-chain
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_016_preliminary_design
```

### Explanation

Preliminary design task to decide which components and data stay on-chain or off-chain.


---

## Concept: df_007_decide_blockchain_type

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_007_decide_blockchain_type
type: DesignFeature
dsr_layer: Feature
title: Decide on blockchain type
description: Preliminary design task to select permissioned/private/public blockchain
  configuration.
tags:
- preliminary-design
- blockchain-type
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_016_preliminary_design
```

### Explanation

Preliminary design task to select permissioned/private/public blockchain configuration.


---

## Concept: df_008_define_smart_contract_skeleton

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_008_define_smart_contract_skeleton
type: DesignFeature
dsr_layer: Feature
title: Define smart contract skeleton
description: Preliminary design task to define the initial smart-contract structure
  from contractual and business logic.
tags:
- preliminary-design
- smart-contracts
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_016_preliminary_design
```

### Explanation

Preliminary design task to define the initial smart-contract structure from contractual and business logic.


---

## Concept: df_009_select_platform

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_009_select_platform
type: DesignFeature
dsr_layer: Feature
title: Select platform
description: Preliminary design task to select a blockchain platform such as Ethereum,
  Hyperledger Fabric, or a cross-chain tool.
tags:
- preliminary-design
- platform-selection
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_016_preliminary_design
```

### Explanation

Preliminary design task to select a blockchain platform such as Ethereum, Hyperledger Fabric, or a cross-chain tool.


---

## Concept: df_010_create_consensus_protocols

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_010_create_consensus_protocols
type: DesignFeature
dsr_layer: Feature
title: Create consensus protocols
description: Detailed design task to define consensus mechanisms or consensus-related
  design choices.
tags:
- detailed-design
- consensus
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_017_framework_lifecycle
```

### Explanation

Detailed design task to define consensus mechanisms or consensus-related design choices.


---

## Concept: df_011_define_incentive_protocols

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_011_define_incentive_protocols
type: DesignFeature
dsr_layer: Feature
title: Define incentive protocols
description: Detailed design task to specify incentive protocols relevant to blockchain
  participation and validation.
tags:
- detailed-design
- incentives
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_017_framework_lifecycle
```

### Explanation

Detailed design task to specify incentive protocols relevant to blockchain participation and validation.


---

## Concept: df_012_define_smart_contract_changes

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_012_define_smart_contract_changes
type: DesignFeature
dsr_layer: Feature
title: Define smart contract changes
description: Detailed design task to decide how smart contracts can be changed, upgraded,
  or governed.
tags:
- detailed-design
- smart-contract-change
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_017_framework_lifecycle
```

### Explanation

Detailed design task to decide how smart contracts can be changed, upgraded, or governed.


---

## Concept: df_013_define_interactions

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_013_define_interactions
type: DesignFeature
dsr_layer: Feature
title: Define interactions
description: Detailed design task to specify interactions among blockchain actors,
  smart contracts, off-chain systems, and chains.
tags:
- detailed-design
- interactions
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_017_framework_lifecycle
```

### Explanation

Detailed design task to specify interactions among blockchain actors, smart contracts, off-chain systems, and chains.


---

## Concept: df_014_design_security

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_014_design_security
type: DesignFeature
dsr_layer: Feature
title: Design security
description: Detailed design task to address security, access control, vulnerabilities,
  and auditability.
tags:
- detailed-design
- security
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_017_framework_lifecycle
```

### Explanation

Detailed design task to address security, access control, vulnerabilities, and auditability.


---

## Concept: df_015_optimize_gas_consumption

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_015_optimize_gas_consumption
type: DesignFeature
dsr_layer: Feature
title: Optimize gas consumption
description: Detailed design task to reduce smart-contract computational cost and
  gas fees.
tags:
- detailed-design
- gas
- cost
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_027_food_trust_deficiency
```

### Explanation

Detailed design task to reduce smart-contract computational cost and gas fees.


---

## Concept: df_016_resolve_disputes

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_016_resolve_disputes
type: DesignFeature
dsr_layer: Feature
title: Resolve disputes
description: Detailed design task to define dispute-resolution mechanisms around smart-contract
  and blockchain workflows.
tags:
- detailed-design
- disputes
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_017_framework_lifecycle
```

### Explanation

Detailed design task to define dispute-resolution mechanisms around smart-contract and blockchain workflows.


---

## Concept: df_017_design_permissions

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_017_design_permissions
type: DesignFeature
dsr_layer: Feature
title: Design permissions
description: Detailed design task to specify roles, access rights, and permission
  structures.
tags:
- detailed-design
- permissions
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_017_framework_lifecycle
```

### Explanation

Detailed design task to specify roles, access rights, and permission structures.


---

## Concept: df_018_design_replications

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_018_design_replications
type: DesignFeature
dsr_layer: Feature
title: Design replications
description: Detailed design task to specify replication and ledger-data distribution
  design.
tags:
- detailed-design
- replication
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_017_framework_lifecycle
```

### Explanation

Detailed design task to specify replication and ledger-data distribution design.


---

## Concept: df_019_implement_smart_contracts

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_019_implement_smart_contracts
type: DesignFeature
dsr_layer: Feature
title: Implement smart contracts
description: Construction task to implement executable smart-contract code.
tags:
- construction
- smart-contracts
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_017_framework_lifecycle
```

### Explanation

Construction task to implement executable smart-contract code.


---

## Concept: df_020_test_smart_contracts

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_020_test_smart_contracts
type: DesignFeature
dsr_layer: Feature
title: Test smart contracts
description: Construction task to test smart contracts before deployment.
tags:
- construction
- testing
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_017_framework_lifecycle
```

### Explanation

Construction task to test smart contracts before deployment.


---

## Concept: df_021_integrate_with_off_blockchain

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_021_integrate_with_off_blockchain
type: DesignFeature
dsr_layer: Feature
title: Integrate with off blockchain
description: Construction task to integrate smart contracts with off-chain systems
  and components.
tags:
- construction
- integration
- off-chain
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_017_framework_lifecycle
```

### Explanation

Construction task to integrate smart contracts with off-chain systems and components.


---

## Concept: df_022_configure_system

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_022_configure_system
type: DesignFeature
dsr_layer: Feature
title: Configure system
description: Transition task to configure the blockchain system before operation.
tags:
- transition
- configuration
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_017_framework_lifecycle
```

### Explanation

Transition task to configure the blockchain system before operation.


---

## Concept: df_023_publish_smart_contracts

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_023_publish_smart_contracts
type: DesignFeature
dsr_layer: Feature
title: Publish smart contracts
description: Transition task to deploy or publish validated smart contracts to the
  target blockchain platform.
tags:
- transition
- deployment
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_017_framework_lifecycle
```

### Explanation

Transition task to deploy or publish validated smart contracts to the target blockchain platform.


---

## Concept: df_024_monitor_nodes

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_024_monitor_nodes
type: DesignFeature
dsr_layer: Feature
title: Monitor nodes
description: Maintenance task to monitor blockchain nodes in operation.
tags:
- maintenance
- nodes
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_017_framework_lifecycle
```

### Explanation

Maintenance task to monitor blockchain nodes in operation.


---

## Concept: df_025_evaluate_contract_correctness

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_025_evaluate_contract_correctness
type: DesignFeature
dsr_layer: Feature
title: Evaluate contract correctness
description: Maintenance task to evaluate smart-contract correctness after delivery.
tags:
- maintenance
- correctness
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_017_framework_lifecycle
```

### Explanation

Maintenance task to evaluate smart-contract correctness after delivery.


---

## Concept: df_026_terminate

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_026_terminate
type: DesignFeature
dsr_layer: Feature
title: Terminate
description: Retirement task to terminate the blockchain system or move data back
  off-chain.
tags:
- retirement
- termination
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_017_framework_lifecycle
```

### Explanation

Retirement task to terminate the blockchain system or move data back off-chain.


---

## Concept: df_027_model_use_case_prototype_requirements

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_027_model_use_case_prototype_requirements
type: DesignFeature
dsr_layer: Feature
title: Model use cases, prototypes, and requirements
description: Modeling output from analysis that captures use cases, prototypes, and
  requirements.
tags:
- modeling
- use-case
- requirements
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_018_modeling_outputs
```

### Explanation

Modeling output from analysis that captures use cases, prototypes, and requirements.


---

## Concept: df_028_model_smart_contract_architecture_forking

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_028_model_smart_contract_architecture_forking
type: DesignFeature
dsr_layer: Feature
title: Model smart contracts, base architecture, and forking
description: Modeling output from preliminary design that captures smart contracts,
  base architecture, and forking decisions.
tags:
- modeling
- architecture
- smart-contracts
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_018_modeling_outputs
```

### Explanation

Modeling output from preliminary design that captures smart contracts, base architecture, and forking decisions.


---

## Concept: df_029_model_data_flow_interactions_consensus_transactions

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_029_model_data_flow_interactions_consensus_transactions
type: DesignFeature
dsr_layer: Feature
title: Model data flow, interactions, consensus, and transactions
description: Modeling output from detailed design that captures data flow, interactions,
  consensus, and transactions.
tags:
- modeling
- data-flow
- consensus
- transactions
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_018_modeling_outputs
```

### Explanation

Modeling output from detailed design that captures data flow, interactions, consensus, and transactions.


---

## Concept: df_030_model_executable_smart_contracts

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_030_model_executable_smart_contracts
type: DesignFeature
dsr_layer: Feature
title: Model executable smart contracts
description: Modeling output from construction that captures executable smart contracts.
tags:
- modeling
- executable-contracts
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_018_modeling_outputs
```

### Explanation

Modeling output from construction that captures executable smart contracts.


---

## Concept: df_031_include_blockchain_user_and_legal_professional_roles

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_031_include_blockchain_user_and_legal_professional_roles
type: DesignFeature
dsr_layer: Feature
title: Include blockchain user and legal professional roles
description: Role method fragment for blockchain users and legal professionals participating
  in blockchain system development.
tags:
- roles
- blockchain-user
- legal
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_019_role_aspect
```

### Explanation

Role method fragment for blockchain users and legal professionals participating in blockchain system development.


---

## Concept: df_032_include_architect_role

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_032_include_architect_role
type: DesignFeature
dsr_layer: Feature
title: Include architect role
description: Role method fragment for system or blockchain architects.
tags:
- roles
- architect
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_019_role_aspect
```

### Explanation

Role method fragment for system or blockchain architects.


---

## Concept: df_033_include_security_core_and_contract_developer_roles

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_033_include_security_core_and_contract_developer_roles
type: DesignFeature
dsr_layer: Feature
title: Include security, core blockchain developer, and smart-contract developer roles
description: Role method fragment for security specialists, core blockchain developers,
  and smart-contract developers.
tags:
- roles
- security
- core-blockchain
- smart-contract-developer
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_019_role_aspect
```

### Explanation

Role method fragment for security specialists, core blockchain developers, and smart-contract developers.


---

## Concept: df_034_include_smart_contract_developer_role

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_034_include_smart_contract_developer_role
type: DesignFeature
dsr_layer: Feature
title: Include smart-contract developer role
description: Role method fragment focused on smart-contract development.
tags:
- roles
- smart-contract-developer
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_019_role_aspect
```

### Explanation

Role method fragment focused on smart-contract development.


---

## Concept: df_035_include_integrator_and_auditor_roles

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_035_include_integrator_and_auditor_roles
type: DesignFeature
dsr_layer: Feature
title: Include integrator and auditor roles
description: Role method fragment for blockchain integration and audit responsibilities.
tags:
- roles
- integrator
- auditor
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_019_role_aspect
```

### Explanation

Role method fragment for blockchain integration and audit responsibilities.


---

## Concept: df_036_include_miner_and_node_operator_roles

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:df_036_include_miner_and_node_operator_roles
type: DesignFeature
dsr_layer: Feature
title: Include miner and node operator roles
description: Role method fragment for node operation, mining, or validation responsibilities.
tags:
- roles
- miner
- node-operator
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_019_role_aspect
```

### Explanation

Role method fragment for node operation, mining, or validation responsibilities.


---

## Concept: art_001_integrated_blockchain_isdm_framework

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:art_001_integrated_blockchain_isdm_framework
type: Artifact
dsr_layer: Artifact
title: Integrated blockchain ISDM framework
description: A framework organizing blockchain system development method fragments
  into development process, role, and modeling aspects across lifecycle phases.
tags:
- framework
- ISDM
- method-fragments
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_013_framework_structure
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_014_framework_purpose
```

### Explanation

A framework organizing blockchain system development method fragments into development process, role, and modeling aspects across lifecycle phases.


---

## Concept: art_002_blockchain_method_fragment_repository

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:art_002_blockchain_method_fragment_repository
type: Artifact
dsr_layer: Artifact
title: Repository of blockchain development method fragments
description: The framework functions as a reusable repository of method fragments
  that can be used to build, tailor, or evaluate blockchain ISDMs.
tags:
- method-fragments
- repository
- method-engineering
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_024_theoretical_contribution
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_044_method_engineering_artifact
```

### Explanation

The framework functions as a reusable repository of method fragments that can be used to build, tailor, or evaluate blockchain ISDMs.


---

## Concept: art_003_food_trust_case_framework_instantiation

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:art_003_food_trust_case_framework_instantiation
type: Artifact
dsr_layer: Artifact
title: Food Trust case framework instantiation
description: Application of the framework to a permissioned private food-traceability
  blockchain project.
tags:
- case-study
- supply-chain
- Food-Trust
- Hyperledger-Fabric
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_020_food_trust_case
```

### Explanation

Application of the framework to a permissioned private food-traceability blockchain project.


---

## Concept: art_004_token_exchanger_case_framework_instantiation

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:art_004_token_exchanger_case_framework_instantiation
type: Artifact
dsr_layer: Artifact
title: Token Exchanger case framework instantiation
description: Application of the framework to a permissioned public cross-chain token-exchange
  blockchain service.
tags:
- case-study
- finance
- cross-chain
- Token-Exchanger
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_021_token_exchanger_case
```

### Explanation

Application of the framework to a permissioned public cross-chain token-exchange blockchain service.


---

## Concept: art_005_isdm_evaluation_yardstick

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:art_005_isdm_evaluation_yardstick
type: Artifact
dsr_layer: Artifact
title: Blockchain ISDM evaluation yardstick
description: The framework is used as a yardstick to identify omissions and deficiencies
  in in-house ISDMs.
tags:
- evaluation
- yardstick
- in-house-ISDM
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_025_framework_practical_yardstick
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_026_case_comparison
```

### Explanation

The framework is used as a yardstick to identify omissions and deficiencies in in-house ISDMs.


---

## Concept: eval_001_systematic_literature_review_iteration

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:eval_001_systematic_literature_review_iteration
type: Evaluation
dsr_layer: Evaluation
title: Systematic literature review iteration
description: The first DSR iteration derives method fragments from selected blockchain-development
  literature.
tags:
- evaluation
- literature-review
- iteration-1
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_009_dsr_iterations
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_012_literature_iteration
```

### Explanation

The first DSR iteration derives method fragments from selected blockchain-development literature.


---

## Concept: eval_002_domain_expert_review_iteration

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:eval_002_domain_expert_review_iteration
type: Evaluation
dsr_layer: Evaluation
title: Domain expert review iteration
description: The second DSR iteration validates, refines, and extends the framework
  using qualitative feedback from blockchain domain experts.
tags:
- evaluation
- expert-review
- iteration-2
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_009_dsr_iterations
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_010_expert_review
```

### Explanation

The second DSR iteration validates, refines, and extends the framework using qualitative feedback from blockchain domain experts.


---

## Concept: eval_003_case_study_application_iteration

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:eval_003_case_study_application_iteration
type: Evaluation
dsr_layer: Evaluation
title: Case study application iteration
description: The third DSR iteration applies the framework to real blockchain projects
  to evaluate and refine it.
tags:
- evaluation
- case-study
- iteration-3
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_009_dsr_iterations
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_011_case_study_purpose
```

### Explanation

The third DSR iteration applies the framework to real blockchain projects to evaluate and refine it.


---

## Concept: eval_004_food_trust_case_evaluation

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:eval_004_food_trust_case_evaluation
type: Evaluation
dsr_layer: Evaluation
title: Food Trust case evaluation
description: The framework identifies instantiated and missing method fragments in
  the Food Trust blockchain-traceability case.
tags:
- evaluation
- Food-Trust
- deficiency-analysis
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_020_food_trust_case
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_027_food_trust_deficiency
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_022_food_trust_blue_labels
```

### Explanation

The framework identifies instantiated and missing method fragments in the Food Trust blockchain-traceability case.


---

## Concept: eval_005_token_exchanger_case_evaluation

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:eval_005_token_exchanger_case_evaluation
type: Evaluation
dsr_layer: Evaluation
title: Token Exchanger case evaluation
description: The framework identifies instantiated and missing method fragments in
  the Token Exchanger cross-chain token exchange case.
tags:
- evaluation
- Token-Exchanger
- deficiency-analysis
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_021_token_exchanger_case
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_028_token_exchanger_deficiency
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_023_token_exchanger_blue_labels
```

### Explanation

The framework identifies instantiated and missing method fragments in the Token Exchanger cross-chain token exchange case.


---

## Concept: ok_001_framework_elevates_blockchain_isdm_to_managerial_level

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ok_001_framework_elevates_blockchain_isdm_to_managerial_level
type: OutputKnowledge
dsr_layer: Output Knowledge
title: Framework elevates blockchain ISDM from technical to managerial level
description: The framework shifts discussion beyond smart-contract programming toward
  lifecycle, roles, and modeling aspects of blockchain system development.
tags:
- contribution
- managerial-level
- ISDM
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_024_theoretical_contribution
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_046_what_how_separation
```

### Explanation

The framework shifts discussion beyond smart-contract programming toward lifecycle, roles, and modeling aspects of blockchain system development.


---

## Concept: ok_002_framework_integrates_fragmented_blockchain_method_knowledge

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ok_002_framework_integrates_fragmented_blockchain_method_knowledge
type: OutputKnowledge
dsr_layer: Output Knowledge
title: Framework integrates fragmented blockchain method knowledge
description: The framework consolidates multiple partial views of blockchain development
  into a shared method-fragment structure.
tags:
- contribution
- knowledge-integration
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_024_theoretical_contribution
```

### Explanation

The framework consolidates multiple partial views of blockchain development into a shared method-fragment structure.


---

## Concept: ok_003_framework_identifies_in_house_isdm_deficiencies

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ok_003_framework_identifies_in_house_isdm_deficiencies
type: OutputKnowledge
dsr_layer: Output Knowledge
title: Framework identifies deficiencies in in-house blockchain ISDMs
description: The framework can reveal unsupported or weakly supported method fragments
  in real development methods, such as missing technology analysis or gas optimization.
tags:
- practical-contribution
- deficiency-analysis
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_025_framework_practical_yardstick
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_027_food_trust_deficiency
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_045_case_study_results_summary
```

### Explanation

The framework can reveal unsupported or weakly supported method fragments in real development methods, such as missing technology analysis or gas optimization.


---

## Concept: ok_004_conventional_isd_fragments_can_be_reused_but_must_be_extended

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ok_004_conventional_isd_fragments_can_be_reused_but_must_be_extended
type: OutputKnowledge
dsr_layer: Output Knowledge
title: Conventional ISD fragments can be reused but must be extended
description: The framework shows that conventional ISD fragments such as prototypes
  and architecture can connect with blockchain development, while blockchain-specific
  fragments are still needed.
tags:
- output-knowledge
- conventional-ISD
- extension
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_029_conventional_isd_reuse
```

### Explanation

The framework shows that conventional ISD fragments such as prototypes and architecture can connect with blockchain development, while blockchain-specific fragments are still needed.


---

## Concept: ok_005_framework_supports_new_isdm_design_evaluation_and_tailoring

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ok_005_framework_supports_new_isdm_design_evaluation_and_tailoring
type: OutputKnowledge
dsr_layer: Output Knowledge
title: Framework supports new ISDM design, evaluation, and tailoring
description: The framework offers a repository of fragments to create bespoke ISDMs
  or augment existing ones for blockchain projects.
tags:
- output-knowledge
- method-tailoring
- evaluation
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_025_framework_practical_yardstick
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_030_tailoring_future_work
```

### Explanation

The framework offers a repository of fragments to create bespoke ISDMs or augment existing ones for blockchain projects.


---

## Concept: kt_001_information_system_development_methods

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:kt_001_information_system_development_methods
type: KernelTheory
dsr_layer: Kernel Theory
title: Information systems development methods
description: 'The paper builds on ISDM theory: methods organize lifecycle activities,
  roles, and models for creating information systems.'
tags:
- kernel-theory
- ISDM
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_008_isdm_core_aspects
```

### Explanation

The paper builds on ISDM theory: methods organize lifecycle activities, roles, and models for creating information systems.


---

## Concept: kt_002_method_engineering

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:kt_002_method_engineering
type: KernelTheory
dsr_layer: Kernel Theory
title: Method engineering and method fragments
description: The framework borrows from method engineering by assembling reusable
  method fragments into an integrated blockchain ISDM framework.
tags:
- kernel-theory
- method-engineering
- method-fragments
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_004_research_objective
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_012_literature_iteration
```

### Explanation

The framework borrows from method engineering by assembling reusable method fragments into an integrated blockchain ISDM framework.


---

## Concept: kt_003_design_science_research

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:kt_003_design_science_research
type: KernelTheory
dsr_layer: Kernel Theory
title: Design science research
description: The study follows DSR, creating and validating a framework artifact through
  build-validate-refine iterations.
tags:
- kernel-theory
- DSR
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_009_dsr_iterations
```

### Explanation

The study follows DSR, creating and validating a framework artifact through build-validate-refine iterations.


---

## Concept: kt_004_blockchain_unique_requirements

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:kt_004_blockchain_unique_requirements
type: KernelTheory
dsr_layer: Kernel Theory
title: Unique blockchain system requirements
description: The paper grounds its framework in blockchain-specific requirements such
  as security/privacy, scalability, interoperability, gas/energy, maintainability,
  and programming-language fit.
tags:
- kernel-theory
- blockchain-requirements
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_006_unique_requirements
```

### Explanation

The paper grounds its framework in blockchain-specific requirements such as security/privacy, scalability, interoperability, gas/energy, maintainability, and programming-language fit.


---

## Concept: kt_005_classificatory_framework_quality_criteria

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:kt_005_classificatory_framework_quality_criteria
type: KernelTheory
dsr_layer: Kernel Theory
title: Quality criteria for classificatory frameworks
description: 'The framework is designed using criteria for classificatory artifacts:
  comprehensiveness, generality, and soundness.'
tags:
- kernel-theory
- taxonomy
- framework-quality
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_007_quality_criteria
```

### Explanation

The framework is designed using criteria for classificatory artifacts: comprehensiveness, generality, and soundness.


---

## Concept: lim_001_tailoring_and_boundary_conditions_not_defined

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:lim_001_tailoring_and_boundary_conditions_not_defined
type: Limitation
dsr_layer: Limitation
title: Tailoring and boundary conditions are not fully defined
description: The framework does not yet specify how to tailor method fragments to
  situational blockchain project factors and boundary conditions.
tags:
- limitation
- tailoring
- boundary-conditions
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_030_tailoring_future_work
```

### Explanation

The framework does not yet specify how to tailor method fragments to situational blockchain project factors and boundary conditions.


---

## Concept: lim_002_limited_domain_experts_and_case_studies

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:lim_002_limited_domain_experts_and_case_studies
type: Limitation
dsr_layer: Limitation
title: Limited number of experts and case studies
description: The authors note that limited technical maturity made it challenging
  to find comprehensive expert and case-study evidence.
tags:
- limitation
- sample-size
- case-studies
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_031_limited_experts_cases
```

### Explanation

The authors note that limited technical maturity made it challenging to find comprehensive expert and case-study evidence.


---

## Concept: lim_003_retrospective_case_interviews

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:lim_003_retrospective_case_interviews
type: Limitation
dsr_layer: Limitation
title: Retrospective case interviews may affect recall precision
description: The third DSR iteration relies on retrospective interviews, creating
  possible recall and post-hoc rationalization limitations.
tags:
- limitation
- retrospective-interview
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_032_retrospective_interviews
```

### Explanation

The third DSR iteration relies on retrospective interviews, creating possible recall and post-hoc rationalization limitations.


---

## Concept: lim_004_no_longitudinal_project_lifecycle_evaluation

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:lim_004_no_longitudinal_project_lifecycle_evaluation
type: Limitation
dsr_layer: Limitation
title: No full longitudinal project-lifecycle evaluation
description: The framework has not been observed across an entire blockchain development
  project lifecycle over time.
tags:
- limitation
- longitudinal-evaluation
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_033_longitudinal_evaluation
```

### Explanation

The framework has not been observed across an entire blockchain development project lifecycle over time.


---

## Concept: lim_005_not_exhaustive_for_all_blockchain_projects

```yaml
concept_id: INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:lim_005_not_exhaustive_for_all_blockchain_projects
type: Limitation
dsr_layer: Limitation
title: Not exhaustive for all blockchain projects and domains
description: The authors do not claim that the framework covers all practitioner opinions,
  application domains, or blockchain project contexts.
tags:
- limitation
- generalizability
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024:ev_031_limited_experts_cases
```

### Explanation

The authors do not claim that the framework covers all practitioner opinions, application domains, or blockchain project contexts.
