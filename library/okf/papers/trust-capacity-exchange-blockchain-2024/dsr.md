---
type: PaperDSRProfile
paper_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024
title: DSR profile for trust-enabling blockchain systems paper
review_status: reviewed
confidence: high
source_pdf: designing trust enabling blockchain systems.pdf
---

# DSR-OKF Profile

## Paper-level summary

The paper designs and evaluates blockchain-enabled mechanisms for establishing perceived inter-organizational trust in capacity exchange platforms. It derives 19 meta-requirements and six design principles from theory and interviews, instantiates them using smart contracts in a 3D-printer capacity exchange prototype, and evaluates the implementation with ex-ante expert validation and ex-post experiments.



---

## Concept: prob_001_low_trust_in_capacity_exchange

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:prob_001_low_trust_in_capacity_exchange
type: Problem
dsr_layer: Problem
title: Low inter-organizational trust hinders virtual capacity exchange
description: Virtual capacity exchange platforms can mitigate capacity volatility,
  but behavioral uncertainties and lack of trust among anonymous market participants
  create coordination costs and limit platform effectiveness.
tags:
- capacity-exchange
- trust
- behavioral-uncertainty
- transaction-costs
- inter-organizational
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_001_abstract_problem_trust_capacity
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_003_intro_transaction_costs
```

### Explanation

Virtual capacity exchange platforms can mitigate capacity volatility, but behavioral uncertainties and lack of trust among anonymous market participants create coordination costs and limit platform effectiveness.


---

## Concept: prob_002_capacity_volatility_and_transaction_costs

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:prob_002_capacity_volatility_and_transaction_costs
type: Problem
dsr_layer: Problem
title: Capacity volatility creates transaction-cost pressure in industrial networks
description: Rapid environmental change and complex supply-chain networks create fluctuating
  capacity utilization and demand for market-like exchange mechanisms, but transaction
  costs must be controlled.
tags:
- capacity-utilization
- supply-chain
- transaction-costs
- industrial-networks
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_002_intro_capacity_volatility
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_003_intro_transaction_costs
```

### Explanation

Rapid environmental change and complex supply-chain networks create fluctuating capacity utilization and demand for market-like exchange mechanisms, but transaction costs must be controlled.


---

## Concept: rq_001_design_trust_enabling_capacity_exchange_artifact

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_001_design_trust_enabling_capacity_exchange_artifact
type: ResearchQuestion
dsr_layer: ResearchQuestion
title: How to design an artifact that establishes trust in inter-organizational capacity
  exchange?
description: The central research question asks how an artifact can be designed to
  establish trust in inter-organizational capacity exchange.
tags:
- research-question
- artifact-design
- trust
- capacity-exchange
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_004_intro_research_question
```

### Explanation

The central research question asks how an artifact can be designed to establish trust in inter-organizational capacity exchange.


---

## Concept: rq_002_generate_design_knowledge_on_blockchain_trust

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:rq_002_generate_design_knowledge_on_blockchain_trust
type: ResearchQuestion
dsr_layer: ResearchQuestion
title: How and why can blockchain affect perceived inter-organizational trust?
description: The research also investigates how and why blockchain-based implementations
  affect perceived trust, responding to calls for empirical blockchain-trust research.
tags:
- research-question
- blockchain
- empirical-evaluation
- trust
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_005_research_gap_empirical_blockchain_trust
```

### Explanation

The research also investigates how and why blockchain-based implementations affect perceived trust, responding to calls for empirical blockchain-trust research.


---

## Concept: dr_001_creation_and_management_of_tender

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_001_creation_and_management_of_tender
type: DesignRequirement
dsr_layer: Requirement
title: Creation and management of tender
description: The platform must support creating, storing, and managing precise tenders
  for requested or offered capacity.
tags:
- meta-requirement
- specification
- tender
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_012_mr_specification
```

### Explanation

The platform must support creating, storing, and managing precise tenders for requested or offered capacity.


---

## Concept: dr_002_cross_domain_management

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_002_cross_domain_management
type: DesignRequirement
dsr_layer: Requirement
title: Cross-domain management
description: The platform must support tender and capacity exchange across organizational
  and domain boundaries.
tags:
- meta-requirement
- specification
- cross-domain
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_012_mr_specification
```

### Explanation

The platform must support tender and capacity exchange across organizational and domain boundaries.


---

## Concept: dr_003_search_functions

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_003_search_functions
type: DesignRequirement
dsr_layer: Requirement
title: Search functions
description: The platform must enable participants to search for capacity offers,
  demand, or counterparties.
tags:
- meta-requirement
- information
- search
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_013_mr_information
```

### Explanation

The platform must enable participants to search for capacity offers, demand, or counterparties.


---

## Concept: dr_004_identity_management_and_verification

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_004_identity_management_and_verification
type: DesignRequirement
dsr_layer: Requirement
title: Identity management and verification
description: The platform must manage and verify participant identities to reduce
  uncertainty about counterparties.
tags:
- meta-requirement
- information
- identity
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_013_mr_information
```

### Explanation

The platform must manage and verify participant identities to reduce uncertainty about counterparties.


---

## Concept: dr_005_initiation_support_services

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_005_initiation_support_services
type: DesignRequirement
dsr_layer: Requirement
title: Services to support the initiation process
description: The platform must provide services that help participants initiate exchange
  relationships and begin negotiations.
tags:
- meta-requirement
- information
- initiation
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_013_mr_information
```

### Explanation

The platform must provide services that help participants initiate exchange relationships and begin negotiations.


---

## Concept: dr_006_intermediate_connection

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_006_intermediate_connection
type: DesignRequirement
dsr_layer: Requirement
title: Possibility for intermediate connection
description: The platform must allow intermediate connections and interaction options
  during negotiation.
tags:
- meta-requirement
- negotiation
- connection
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_014_mr_negotiation
```

### Explanation

The platform must allow intermediate connections and interaction options during negotiation.


---

## Concept: dr_007_contract_heterogeneity

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_007_contract_heterogeneity
type: DesignRequirement
dsr_layer: Requirement
title: Heterogeneity of contracts
description: The platform must support different contract structures and negotiation
  arrangements for capacity exchange.
tags:
- meta-requirement
- negotiation
- contracts
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_014_mr_negotiation
```

### Explanation

The platform must support different contract structures and negotiation arrangements for capacity exchange.


---

## Concept: dr_008_final_award_function

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_008_final_award_function
type: DesignRequirement
dsr_layer: Requirement
title: Function for final award of the contract
description: The platform must support final awarding and settlement of capacity-exchange
  contracts.
tags:
- meta-requirement
- negotiation
- award
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_014_mr_negotiation
```

### Explanation

The platform must support final awarding and settlement of capacity-exchange contracts.


---

## Concept: dr_009_payment_fulfilment_conditions

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_009_payment_fulfilment_conditions
type: DesignRequirement
dsr_layer: Requirement
title: Conditions for fulfilling the payment
description: The platform must specify, monitor, and enforce payment-fulfilment conditions.
tags:
- meta-requirement
- fulfilment
- payment
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_015_mr_fulfilment
```

### Explanation

The platform must specify, monitor, and enforce payment-fulfilment conditions.


---

## Concept: dr_010_legal_framework_compliance

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_010_legal_framework_compliance
type: DesignRequirement
dsr_layer: Requirement
title: Compliance with legal framework conditions
description: The platform must support legal and contractual compliance during fulfilment.
tags:
- meta-requirement
- fulfilment
- legal-compliance
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_015_mr_fulfilment
```

### Explanation

The platform must support legal and contractual compliance during fulfilment.


---

## Concept: dr_011_serious_rating

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_011_serious_rating
type: DesignRequirement
dsr_layer: Requirement
title: Serious rating
description: The platform must support serious and reliable rating after exchange
  completion.
tags:
- meta-requirement
- after-sales
- rating
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_016_mr_after_sales
```

### Explanation

The platform must support serious and reliable rating after exchange completion.


---

## Concept: dr_012_decision_relevant_kpis

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_012_decision_relevant_kpis
type: DesignRequirement
dsr_layer: Requirement
title: Provision of decision-relevant KPIs
description: The platform must provide KPIs that support future decisions and reputation
  assessment.
tags:
- meta-requirement
- after-sales
- KPI
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_016_mr_after_sales
```

### Explanation

The platform must provide KPIs that support future decisions and reputation assessment.


---

## Concept: dr_013_transaction_transparency_completeness

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_013_transaction_transparency_completeness
type: DesignRequirement
dsr_layer: Requirement
title: Transparency and completeness of transaction-relevant data
description: The platform must make transaction-relevant data transparent and complete
  for authorized participants.
tags:
- meta-requirement
- overlap
- transparency
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_017_mr_overlapping
```

### Explanation

The platform must make transaction-relevant data transparent and complete for authorized participants.


---

## Concept: dr_014_decentralization_and_simultaneity

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_014_decentralization_and_simultaneity
type: DesignRequirement
dsr_layer: Requirement
title: Decentralization and simultaneity
description: The platform must support decentralized and simultaneous availability
  of relevant transaction data.
tags:
- meta-requirement
- overlap
- decentralization
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_017_mr_overlapping
```

### Explanation

The platform must support decentralized and simultaneous availability of relevant transaction data.


---

## Concept: dr_015_communication_services

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_015_communication_services
type: DesignRequirement
dsr_layer: Requirement
title: Communication services
description: The platform must support communication services needed for exchange
  and coordination.
tags:
- meta-requirement
- overlap
- communication
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_017_mr_overlapping
```

### Explanation

The platform must support communication services needed for exchange and coordination.


---

## Concept: dr_016_equality_of_participants

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_016_equality_of_participants
type: DesignRequirement
dsr_layer: Requirement
title: Equality of participants
description: The platform must preserve equality among participants and avoid unfair
  privilege in exchange interactions.
tags:
- meta-requirement
- overlap
- fairness
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_017_mr_overlapping
```

### Explanation

The platform must preserve equality among participants and avoid unfair privilege in exchange interactions.


---

## Concept: dr_017_interface_compatibility_and_standards

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_017_interface_compatibility_and_standards
type: DesignRequirement
dsr_layer: Requirement
title: Interface compatibility and standards
description: The platform must support compatible interfaces and standards for practical
  adoption.
tags:
- meta-requirement
- overlap
- interfaces
- standards
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_017_mr_overlapping
```

### Explanation

The platform must support compatible interfaces and standards for practical adoption.


---

## Concept: dr_018_human_interaction_and_role_models

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_018_human_interaction_and_role_models
type: DesignRequirement
dsr_layer: Requirement
title: Depictability of human interaction and role models
description: The platform must represent human interactions and role models in a way
  participants can understand and evaluate.
tags:
- meta-requirement
- overlap
- role-models
- human-interaction
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_017_mr_overlapping
```

### Explanation

The platform must represent human interactions and role models in a way participants can understand and evaluate.


---

## Concept: dr_019_encryption_concepts

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_019_encryption_concepts
type: DesignRequirement
dsr_layer: Requirement
title: Encryption concepts
description: The platform must include encryption concepts for secure information
  handling.
tags:
- meta-requirement
- overlap
- encryption
- security
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_017_mr_overlapping
```

### Explanation

The platform must include encryption concepts for secure information handling.


---

## Concept: dp_001_signaling_tender_information

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_001_signaling_tender_information
type: DesignPrinciple
dsr_layer: Principle
title: Signal information relevant to the tender
description: Provide functions for customized tender creation, link the tender to
  verified identities, and reveal tender information simultaneously and distributively
  to authorized participants.
tags:
- design-principle
- signaling
- tender
- specification
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_018_dp1_table
```

### Explanation

Provide functions for customized tender creation, link the tender to verified identities, and reveal tender information simultaneously and distributively to authorized participants.


---

## Concept: dp_002_signaling_identity_information

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_002_signaling_identity_information
type: DesignPrinciple
dsr_layer: Principle
title: Signal information relevant to identity
description: Provide decentralized identity storage, configuration, and verification
  functions so participants can trust identity information during initiation and information
  stages.
tags:
- design-principle
- signaling
- identity
- verification
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_019_dp2_table
```

### Explanation

Provide decentralized identity storage, configuration, and verification functions so participants can trust identity information during initiation and information stages.


---

## Concept: dp_003_authority_and_fairness

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_003_authority_and_fairness
type: DesignPrinciple
dsr_layer: Principle
title: Maintain authority and fairness in cooperation
description: Provide decentralized contract storage, monitoring of agreed terms, and
  enforcement of sanctions or rewards so cooperation partners cannot be unfairly disadvantaged.
tags:
- design-principle
- authority
- fairness
- contract
- enforcement
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_020_dp3_table
```

### Explanation

Provide decentralized contract storage, monitoring of agreed terms, and enforcement of sanctions or rewards so cooperation partners cannot be unfairly disadvantaged.


---

## Concept: dp_004_incentive_mechanisms

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_004_incentive_mechanisms
type: DesignPrinciple
dsr_layer: Principle
title: Use incentive mechanisms to deter opportunism
description: Expose cooperation benefits and losses from violations through transparent
  data observable by participants, motivating cooperation and discouraging opportunistic
  behavior.
tags:
- design-principle
- incentives
- deterrence
- opportunism
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_021_dp4_table
```

### Explanation

Expose cooperation benefits and losses from violations through transparent data observable by participants, motivating cooperation and discouraging opportunistic behavior.


---

## Concept: dp_005_screening_functionality

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_005_screening_functionality
type: DesignPrinciple
dsr_layer: Principle
title: Provide screening functionality for trustworthy information retrieval
description: Provide functions for depositing information, distributed and verified
  access, checking validity, searching information, and contacting participants.
tags:
- design-principle
- screening
- validity
- information-retrieval
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_022_dp5_table
```

### Explanation

Provide functions for depositing information, distributed and verified access, checking validity, searching information, and contacting participants.


---

## Concept: dp_006_reputation_mechanism

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_006_reputation_mechanism
type: DesignPrinciple
dsr_layer: Principle
title: Provide a transparent reputation mechanism
description: Provide serious rating, decentralized collection of rating-relevant data,
  transparent processing, and distribution of reputation information to participants.
tags:
- design-principle
- reputation
- rating
- traceability
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_023_dp6_table
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_040_reputation_deterrence
```

### Explanation

Provide serious rating, decentralized collection of rating-relevant data, transparent processing, and distribution of reputation information to participants.


---

## Concept: df_001_creating_a_tender

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_001_creating_a_tender
type: DesignFeature
dsr_layer: Feature
title: Creating a tender
description: Support creation of a tender object for requested or offered capacity
  in the smart-contract-backed platform.
tags:
- tender
- smart-contract
- write-command
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_028_df_dp_mapping
```

### Explanation

Support creation of a tender object for requested or offered capacity in the smart-contract-backed platform.


---

## Concept: df_002_distributing_tender_information

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_002_distributing_tender_information
type: DesignFeature
dsr_layer: Feature
title: Distributing information relevant to tender
description: Distribute tender-relevant information to authorized participants through
  the platform and blockchain-backed data access pattern.
tags:
- tender
- distribution
- read-command
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure
```

### Explanation

Distribute tender-relevant information to authorized participants through the platform and blockchain-backed data access pattern.


---

## Concept: df_003_creating_an_identity

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_003_creating_an_identity
type: DesignFeature
dsr_layer: Feature
title: Creating an identity
description: Support identity creation and registration for platform participants.
tags:
- identity
- registration
- smart-contract
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure
```

### Explanation

Support identity creation and registration for platform participants.


---

## Concept: df_004_distributing_identity_information

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_004_distributing_identity_information
type: DesignFeature
dsr_layer: Feature
title: Distributing information relevant to identity
description: Distribute identity-relevant information so counterparties can verify
  who participates in a transaction.
tags:
- identity
- distribution
- verification
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure
```

### Explanation

Distribute identity-relevant information so counterparties can verify who participates in a transaction.


---

## Concept: df_005_ensuring_authorized_access

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_005_ensuring_authorized_access
type: DesignFeature
dsr_layer: Feature
title: Ensuring authorized access
description: Restrict access and execution rights so only authorized users can perform
  protected platform actions.
tags:
- authorization
- access-control
- require-statement
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_039_permission_require_statements
```

### Explanation

Restrict access and execution rights so only authorized users can perform protected platform actions.


---

## Concept: df_006_configuring_permissions

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_006_configuring_permissions
type: DesignFeature
dsr_layer: Feature
title: Configuring permissions
description: Configure permissions in smart contracts and platform functions to prevent
  unauthorized interactions.
tags:
- permissions
- access-control
- smart-contract
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_039_permission_require_statements
```

### Explanation

Configure permissions in smart contracts and platform functions to prevent unauthorized interactions.


---

## Concept: df_007_prevention_of_fraud

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_007_prevention_of_fraud
type: DesignFeature
dsr_layer: Feature
title: Prevention of fraud
description: Prevent fraudulent platform behavior such as bidding on one’s own tender
  or acting under a wrong identity.
tags:
- fraud-prevention
- integrity
- trust
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_032_test_posttest_results
```

### Explanation

Prevent fraudulent platform behavior such as bidding on one’s own tender or acting under a wrong identity.


---

## Concept: df_008_enforcing_rewards_and_incentive

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_008_enforcing_rewards_and_incentive
type: DesignFeature
dsr_layer: Feature
title: Enforcing rewards and incentive
description: Enforce rewards, sanctions, or incentive-relevant outcomes according
  to pre-defined platform rules.
tags:
- incentive
- enforcement
- smart-contract
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_021_dp4_table
```

### Explanation

Enforce rewards, sanctions, or incentive-relevant outcomes according to pre-defined platform rules.


---

## Concept: df_009_traceability_of_rewards_and_incentives

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_009_traceability_of_rewards_and_incentives
type: DesignFeature
dsr_layer: Feature
title: Ensuring traceability of enforced rewards and incentives
description: Make incentive enforcement and reward-relevant events traceable to support
  deterrence and accountability.
tags:
- traceability
- incentives
- accountability
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure
```

### Explanation

Make incentive enforcement and reward-relevant events traceable to support deterrence and accountability.


---

## Concept: df_010_permitted_access_tender_information

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_010_permitted_access_tender_information
type: DesignFeature
dsr_layer: Feature
title: Permitted access to tender information
description: Allow participants to read tender-relevant information when they have
  permitted access.
tags:
- screening
- tender
- permitted-access
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure
```

### Explanation

Allow participants to read tender-relevant information when they have permitted access.


---

## Concept: df_011_permitted_access_identity_information

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_011_permitted_access_identity_information
type: DesignFeature
dsr_layer: Feature
title: Permitted access to identity information
description: Allow participants to read identity-relevant information when they have
  permitted access.
tags:
- screening
- identity
- permitted-access
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure
```

### Explanation

Allow participants to read identity-relevant information when they have permitted access.


---

## Concept: df_012_permitted_access_reputation_information

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_012_permitted_access_reputation_information
type: DesignFeature
dsr_layer: Feature
title: Permitted access to reputation information
description: Allow participants to read reputation-relevant information when they
  have permitted access.
tags:
- screening
- reputation
- permitted-access
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure
```

### Explanation

Allow participants to read reputation-relevant information when they have permitted access.


---

## Concept: df_013_creating_individual_assessment

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_013_creating_individual_assessment
type: DesignFeature
dsr_layer: Feature
title: Creating an individual assessment
description: Enable participants to create individual ratings or assessments after
  an exchange.
tags:
- reputation
- rating
- assessment
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_040_reputation_deterrence
```

### Explanation

Enable participants to create individual ratings or assessments after an exchange.


---

## Concept: df_014_distributing_assessment_information

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_014_distributing_assessment_information
type: DesignFeature
dsr_layer: Feature
title: Distributing information relevant to the assessment
description: Distribute assessment and reputation data transparently to participants.
tags:
- reputation
- distribution
- assessment
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure
```

### Explanation

Distribute assessment and reputation data transparently to participants.


---

## Concept: df_015_smart_contract_tender_identity_reputation_modules

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_015_smart_contract_tender_identity_reputation_modules
type: DesignFeature
dsr_layer: Feature
title: Tender, identity, and reputation smart contracts
description: Implement tender, identity, and reputation modules as smart contracts
  embedded in the application layer.
tags:
- smart-contract
- tender
- identity
- reputation
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_025_instantiation_smart_contracts
```

### Explanation

Implement tender, identity, and reputation modules as smart contracts embedded in the application layer.


---

## Concept: df_016_blockchain_testnet_and_smart_contracts

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_016_blockchain_testnet_and_smart_contracts
type: DesignFeature
dsr_layer: Feature
title: Ethereum/Remix/Solidity test-network implementation
description: Use Ethereum-compatible smart contracts, Solidity, Remix IDE, proof-of-authority
  test network, Web3 frontend, and MetaMask accounts to instantiate and test the trust
  mechanisms.
tags:
- Ethereum
- Solidity
- Remix
- Web3
- MetaMask
- testnet
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_026_permissioned_testnet
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_038_ethereum_design_details
```

### Explanation

Use Ethereum-compatible smart contracts, Solidity, Remix IDE, proof-of-authority test network, Web3 frontend, and MetaMask accounts to instantiate and test the trust mechanisms.


---

## Concept: art_001_blockchain_based_capacity_exchange_prototype

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:art_001_blockchain_based_capacity_exchange_prototype
type: Artifact
dsr_layer: Artifact
title: Blockchain-based capacity exchange prototype
description: A blockchain-based prototype for inter-organizational exchange of capacity,
  instantiated in the paper through a 3D-printer capacity exchange scenario.
tags:
- artifact
- capacity-exchange
- blockchain
- prototype
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_025_instantiation_smart_contracts
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_029_ex_post_method
```

### Explanation

A blockchain-based prototype for inter-organizational exchange of capacity, instantiated in the paper through a 3D-printer capacity exchange scenario.


---

## Concept: art_002_decentralized_negotiation_platform

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:art_002_decentralized_negotiation_platform
type: Artifact
dsr_layer: Artifact
title: Decentralized negotiation platform for 3D-printer capacity
description: A Web3 frontend and smart-contract-backed demonstrator through which
  participants navigate a simplified transaction lifecycle for 3D-printer capacity
  exchange.
tags:
- artifact
- negotiation-platform
- 3D-printer
- Web3
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_025_instantiation_smart_contracts
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure
```

### Explanation

A Web3 frontend and smart-contract-backed demonstrator through which participants navigate a simplified transaction lifecycle for 3D-printer capacity exchange.


---

## Concept: art_003_smart_contract_modules

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:art_003_smart_contract_modules
type: Artifact
dsr_layer: Artifact
title: Tender, identity, and reputation smart-contract modules
description: Three smart-contract modules handle tender information, identity information,
  and reputation/assessment information.
tags:
- artifact
- smart-contract
- tender
- identity
- reputation
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_025_instantiation_smart_contracts
```

### Explanation

Three smart-contract modules handle tender information, identity information, and reputation/assessment information.


---

## Concept: art_004_experimental_manipulated_prototype

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:art_004_experimental_manipulated_prototype
type: Artifact
dsr_layer: Artifact
title: Manipulated prototype for trust-effect testing
description: A manipulated prototype version intentionally violates design principles
  to test whether perceived trust decreases when blockchain is poorly designed.
tags:
- artifact
- experiment
- manipulation
- trust-evaluation
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_032_test_posttest_results
```

### Explanation

A manipulated prototype version intentionally violates design principles to test whether perceived trust decreases when blockchain is poorly designed.


---

## Concept: eval_001_two_iteration_dsr_design

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:eval_001_two_iteration_dsr_design
type: Evaluation
dsr_layer: Evaluation
title: Two-iteration DSR design and evaluation process
description: The study uses a DSR process with requirements grounding, design-principle
  formulation, ex-ante evaluation, artifact instantiation, ex-post experimental evaluation,
  and reflection.
tags:
- evaluation
- DSR
- iteration
- Baustein
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_008_research_design_overview
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_010_interview_sampling
```

### Explanation

The study uses a DSR process with requirements grounding, design-principle formulation, ex-ante evaluation, artifact instantiation, ex-post experimental evaluation, and reflection.


---

## Concept: eval_002_ex_ante_design_principle_evaluation

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:eval_002_ex_ante_design_principle_evaluation
type: Evaluation
dsr_layer: Evaluation
title: Ex-ante evaluation of design principles
description: The design principles are evaluated before instantiation using accessibility,
  importance, novelty, actability, guidance, and effectiveness criteria.
tags:
- evaluation
- ex-ante
- design-principles
- reusability
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_024_ex_ante_evaluation
```

### Explanation

The design principles are evaluated before instantiation using accessibility, importance, novelty, actability, guidance, and effectiveness criteria.


---

## Concept: eval_003_pretest_posttest_experiment

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:eval_003_pretest_posttest_experiment
type: Evaluation
dsr_layer: Evaluation
title: Pretest-posttest experiment with control and test groups
description: A subject-based experiment uses control and test groups with non-manipulated
  and manipulated prototype variants to evaluate perceived trust.
tags:
- evaluation
- experiment
- pretest-posttest
- control-group
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_029_ex_post_method
```

### Explanation

A subject-based experiment uses control and test groups with non-manipulated and manipulated prototype variants to evaluate perceived trust.


---

## Concept: eval_004_pretest_high_trust_observation

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:eval_004_pretest_high_trust_observation
type: Evaluation
dsr_layer: Evaluation
title: Pretest shows high perceived trust for full design-principle implementation
description: In the pretest, participants using the full, non-manipulated design-principle
  implementation report high perceived trust.
tags:
- evaluation
- pretest
- trust
- experiment
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_030_pretest_results
```

### Explanation

In the pretest, participants using the full, non-manipulated design-principle implementation report high perceived trust.


---

## Concept: eval_005_control_group_steady_trust

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:eval_005_control_group_steady_trust
type: Evaluation
dsr_layer: Evaluation
title: Control-group posttest shows steady perceived trust
description: The control group repeats the non-manipulated prototype and reports stable
  trust ratings, supporting the consistency of the non-manipulated implementation.
tags:
- evaluation
- control-group
- trust
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_031_control_posttest_results
```

### Explanation

The control group repeats the non-manipulated prototype and reports stable trust ratings, supporting the consistency of the non-manipulated implementation.


---

## Concept: eval_006_manipulated_test_group_trust_collapse

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:eval_006_manipulated_test_group_trust_collapse
type: Evaluation
dsr_layer: Evaluation
title: Manipulated prototype sharply reduces perceived trust
description: The manipulated prototype version creates wrong identity, self-bidding,
  incorrect payment, and self-rating opportunities; perceived trust collapses in the
  test group.
tags:
- evaluation
- test-group
- manipulation
- trust-collapse
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_032_test_posttest_results
```

### Explanation

The manipulated prototype version creates wrong identity, self-bidding, incorrect payment, and self-rating opportunities; perceived trust collapses in the test group.


---

## Concept: ok_001_meta_requirements_for_capacity_exchange

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ok_001_meta_requirements_for_capacity_exchange
type: OutputKnowledge
dsr_layer: OutputKnowledge
title: Nineteen meta-requirements for trust-enabling capacity exchange
description: The paper contributes 19 meta-requirements organized across transaction
  lifecycle categories for inter-organizational capacity exchange platforms.
tags:
- output-knowledge
- meta-requirements
- capacity-exchange
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_011_meta_requirements_overview
```

### Explanation

The paper contributes 19 meta-requirements organized across transaction lifecycle categories for inter-organizational capacity exchange platforms.


---

## Concept: ok_002_six_design_principles_for_interorganizational_trust

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ok_002_six_design_principles_for_interorganizational_trust
type: OutputKnowledge
dsr_layer: OutputKnowledge
title: Six design principles for inter-organizational trust
description: The paper formulates six design principles around signaling, authority/fairness,
  incentives, screening, and reputation for trust-enabling exchange platforms.
tags:
- output-knowledge
- design-principles
- trust
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_035_research_contributions
```

### Explanation

The paper formulates six design principles around signaling, authority/fairness, incentives, screening, and reputation for trust-enabling exchange platforms.


---

## Concept: ok_003_blockchain_design_features_for_trust_principles

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ok_003_blockchain_design_features_for_trust_principles
type: OutputKnowledge
dsr_layer: OutputKnowledge
title: Blockchain design features instantiate trust principles
description: The paper contributes a mapping from design principles to blockchain-based
  design features and a smart-contract instantiation.
tags:
- output-knowledge
- design-features
- blockchain
- smart-contracts
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure
```

### Explanation

The paper contributes a mapping from design principles to blockchain-based design features and a smart-contract instantiation.


---

## Concept: ok_004_blockchain_does_not_automatically_create_trust

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ok_004_blockchain_does_not_automatically_create_trust
type: OutputKnowledge
dsr_layer: OutputKnowledge
title: Blockchain does not automatically create trust
description: The experiment shows that blockchain can reduce trust when design principles
  are violated; trust depends on correct design rather than mere blockchain use.
tags:
- output-knowledge
- blockchain
- trust
- design-quality
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_033_ex_post_summary
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_037_conclusion
```

### Explanation

The experiment shows that blockchain can reduce trust when design principles are violated; trust depends on correct design rather than mere blockchain use.


---

## Concept: ok_005_design_principles_are_interdependent

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ok_005_design_principles_are_interdependent
type: OutputKnowledge
dsr_layer: OutputKnowledge
title: Trust-enabling design principles are interdependent
description: The paper argues that the design principles affect each other and must
  be implemented holistically, not as isolated features.
tags:
- output-knowledge
- interdependence
- holistic-design
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_034_principle_interdependence
```

### Explanation

The paper argues that the design principles affect each other and must be implemented holistically, not as isolated features.


---

## Concept: kt_001_transaction_costs_and_interorganizational_trust

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_001_transaction_costs_and_interorganizational_trust
type: KernelTheory
dsr_layer: KernelTheory
title: Transaction cost theory and inter-organizational trust
description: The paper uses transaction-cost theory to frame information, negotiation,
  implementation, monitoring, and enforcement costs as affected by perceived trust.
tags:
- kernel-theory
- transaction-cost-economics
- trust
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_006_network_trust_theory
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_009_research_model
```

### Explanation

The paper uses transaction-cost theory to frame information, negotiation, implementation, monitoring, and enforcement costs as affected by perceived trust.


---

## Concept: kt_002_agency_theory_behavioral_uncertainty

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_002_agency_theory_behavioral_uncertainty
type: KernelTheory
dsr_layer: KernelTheory
title: Agency theory and behavioral uncertainty
description: The paper uses agency theory to frame behavioral uncertainties, opportunism,
  and information asymmetry between exchange participants.
tags:
- kernel-theory
- agency-theory
- behavioral-uncertainty
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_003_intro_transaction_costs
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_009_research_model
```

### Explanation

The paper uses agency theory to frame behavioral uncertainties, opportunism, and information asymmetry between exchange participants.


---

## Concept: kt_003_signaling_screening_authority_reputation

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_003_signaling_screening_authority_reputation
type: KernelTheory
dsr_layer: KernelTheory
title: 'Cooperation designs: signaling, screening, authority, incentives, and reputation'
description: The design principles are grounded in cooperation designs that reduce
  behavioral uncertainty, including signaling, screening, authority and fairness,
  incentives, and reputation.
tags:
- kernel-theory
- cooperation-design
- signaling
- screening
- reputation
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_018_dp1_table
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_022_dp5_table
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_023_dp6_table
```

### Explanation

The design principles are grounded in cooperation designs that reduce behavioral uncertainty, including signaling, screening, authority and fairness, incentives, and reputation.


---

## Concept: kt_004_blockchain_as_trust_enabling_infrastructure

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_004_blockchain_as_trust_enabling_infrastructure
type: KernelTheory
dsr_layer: KernelTheory
title: Blockchain as trust-enabling infrastructure
description: The blockchain background grounds the artifact in immutability, transparency,
  decentralized data storage, cryptographic protocols, consensus mechanisms, and smart
  contracts.
tags:
- kernel-theory
- blockchain
- trust
- smart-contracts
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_007_blockchain_triad
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_025_instantiation_smart_contracts
```

### Explanation

The blockchain background grounds the artifact in immutability, transparency, decentralized data storage, cryptographic protocols, consensus mechanisms, and smart contracts.


---

## Concept: kt_005_design_principle_reusability

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:kt_005_design_principle_reusability
type: KernelTheory
dsr_layer: KernelTheory
title: Design principles as reusable prescriptive knowledge
description: The DSR framing treats design principles as codified prescriptive knowledge
  for building artifacts beyond a single success story.
tags:
- kernel-theory
- DSR
- design-principles
- reusability
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_008_research_design_overview
```

### Explanation

The DSR framing treats design principles as codified prescriptive knowledge for building artifacts beyond a single success story.


---

## Concept: lim_001_artificial_small_sample_single_case

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:lim_001_artificial_small_sample_single_case
type: Limitation
dsr_layer: Limitation
title: Artificial setting, small sample, and single instantiation limit generalization
description: The ex-post evaluation is artificial, uses a small number of participants,
  and relies on a single 3D-printer capacity-exchange instantiation.
tags:
- limitation
- external-validity
- sample-size
- single-case
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_036_limitations
```

### Explanation

The ex-post evaluation is artificial, uses a small number of participants, and relies on a single 3D-printer capacity-exchange instantiation.


---

## Concept: lim_002_blockchain_not_sufficient_without_design_principles

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:lim_002_blockchain_not_sufficient_without_design_principles
type: Limitation
dsr_layer: Limitation
title: Blockchain alone is insufficient for trust
description: The paper explicitly warns that applying blockchain does not immediately
  create trust; weak implementation of design principles can reduce trust.
tags:
- limitation
- blockchain
- trust
- overclaiming
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_037_conclusion
```

### Explanation

The paper explicitly warns that applying blockchain does not immediately create trust; weak implementation of design principles can reduce trust.


---

## Concept: lim_003_design_principle_interdependencies_complicate_causality

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:lim_003_design_principle_interdependencies_complicate_causality
type: Limitation
dsr_layer: Limitation
title: Design-principle interdependencies complicate isolated causal claims
description: Because principles affect each other, the experiment cannot easily isolate
  the independent cause-effect relation of each principle.
tags:
- limitation
- causality
- interdependence
- experiment
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_034_principle_interdependence
```

### Explanation

Because principles affect each other, the experiment cannot easily isolate the independent cause-effect relation of each principle.


---

## Concept: lim_004_permissioned_testnet_not_mainnet

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:lim_004_permissioned_testnet_not_mainnet
type: Limitation
dsr_layer: Limitation
title: Controlled testnet differs from a real public blockchain environment
description: The implementation uses a controlled test network to preserve internal
  validity, which differs from a naturalistic public mainnet deployment.
tags:
- limitation
- testnet
- external-validity
- blockchain
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_026_permissioned_testnet
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_036_limitations
```

### Explanation

The implementation uses a controlled test network to preserve internal validity, which differs from a naturalistic public mainnet deployment.


---

## Concept: lim_005_need_for_broader_variables_and_domains

```yaml
concept_id: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:lim_005_need_for_broader_variables_and_domains
type: Limitation
dsr_layer: Limitation
title: Further experiments need more variables, participants, and domains
description: The authors call for extended experiments with additional control variables,
  more participants, and broader implementation scenarios.
tags:
- limitation
- future-research
- experiment
- domains
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_036_limitations
```

### Explanation

The authors call for extended experiments with additional control variables, more participants, and broader implementation scenarios.
