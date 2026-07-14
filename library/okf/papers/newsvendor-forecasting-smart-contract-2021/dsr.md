---
type: PaperDSRProfile
paper_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021
title: "DSR profile for newsvendor-forecaster blockchain smart contract paper"
review_status: reviewed
confidence: high
source_pdf: "Aligning the interests of newsvendors and forecasters through blockchain-based smart contracts and proper scoring rules.PDF"
---

# DSR-OKF Profile

## Paper-level summary

The paper studies a newsvendor who hires an expert to provide a demand forecast. The authors identify two design problems: the expert's forecast effort may not align with the newsvendor's profit objective, and the newsvendor may be able to manipulate an outcome-contingent expert payment because the realized demand outcome may only be visible to the newsvendor. The paper develops a tailored proper scoring rule, argues that blockchain smart contracts mitigate the trust problem, and demonstrates a smart-contract/DApp prototype following a design science research framing.


---

## Concept: prob_001_forecast_incentive_trust_problem

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:prob_001_forecast_incentive_trust_problem
type: Problem
dsr_layer: Problem
title: Forecast acquisition with incentive misalignment and payment-trust risk
description: A newsvendor depends on an expert forecast to choose inventory, but the
  expert wants to maximize payment while the newsvendor wants to maximize profit;
  because payment depends on a future realized outcome that may only be visible to
  the newsvendor, the expert may distrust outcome-contingent payment.
tags:
- forecasting
- newsvendor
- trust
- incentives
- outcome-contingent-payment
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_001_abstract_problem
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_002_incentive_trust_setting
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_003_two_major_challenges
```

### Explanation

A newsvendor depends on an expert forecast to choose inventory, but the expert wants to maximize payment while the newsvendor wants to maximize profit; because payment depends on a future realized outcome that may only be visible to the newsvendor, the expert may distrust outcome-contingent payment.


---

## Concept: rq_001_align_forecaster_and_newsvendor_interests

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:rq_001_align_forecaster_and_newsvendor_interests
type: ResearchQuestion
dsr_layer: Problem
title: How to align newsvendor and forecaster interests under forecast-based inventory
  decisions
description: "The paper\u2019s central design question is how to construct a forecast-payment\
  \ mechanism that aligns the expert\u2019s effort and truthful reporting with the\
  \ newsvendor\u2019s inventory-profit objective."
tags:
- research-question
- forecasting
- incentive-alignment
confidence: medium-high
extraction_type: inferred
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_004_normative_contributions
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_007_tailored_scoring_rule
```

### Explanation

The paper’s central design question is how to construct a forecast-payment mechanism that aligns the expert’s effort and truthful reporting with the newsvendor’s inventory-profit objective.


---

## Concept: rq_002_blockchain_for_forecast_payment_trust

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:rq_002_blockchain_for_forecast_payment_trust
type: ResearchQuestion
dsr_layer: Problem
title: How blockchain smart contracts can mitigate trust problems in outcome-contingent
  forecast payments
description: The paper asks when trust becomes a problem in the interaction and how
  a blockchain-based smart contract can credibly signal trustworthiness and automate
  settlement.
tags:
- research-question
- blockchain
- smart-contracts
- trust
confidence: medium-high
extraction_type: inferred
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_004_normative_contributions
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_010_blockchain_transparency_high_effort
```

### Explanation

The paper asks when trust becomes a problem in the interaction and how a blockchain-based smart contract can credibly signal trustworthiness and automate settlement.


---

## Concept: dr_001_align_expert_effort_with_newsvendor_profit

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dr_001_align_expert_effort_with_newsvendor_profit
type: DesignRequirement
dsr_layer: Requirement
title: Align expert effort with newsvendor profit
description: "The system should make higher expert forecasting effort beneficial not\
  \ only to the expert but also to the newsvendor\u2019s expected profit."
tags:
- incentive-alignment
- expert-effort
- profit
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_007_tailored_scoring_rule
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_008_corollary_high_effort_profit
```

### Explanation

The system should make higher expert forecasting effort beneficial not only to the expert but also to the newsvendor’s expected profit.


---

## Concept: dr_002_induce_truthful_forecast_reporting

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dr_002_induce_truthful_forecast_reporting
type: DesignRequirement
dsr_layer: Requirement
title: Induce truthful probabilistic forecast reporting
description: The payment rule should be incentive-compatible so the expert maximizes
  expected score by reporting the forecast corresponding to his belief.
tags:
- truthful-reporting
- proper-scoring-rule
- forecast-elicitation
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_005_proper_scoring_rules
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_007_tailored_scoring_rule
```

### Explanation

The payment rule should be incentive-compatible so the expert maximizes expected score by reporting the forecast corresponding to his belief.


---

## Concept: dr_003_make_outcome_contingent_payment_enforceable

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dr_003_make_outcome_contingent_payment_enforceable
type: DesignRequirement
dsr_layer: Requirement
title: Make outcome-contingent expert payment enforceable
description: The system should prevent the newsvendor from strategically underpaying
  the expert after the realized outcome becomes known.
tags:
- enforceability
- payment
- forecast-accuracy
- trust
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_003_two_major_challenges
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_011_design_principles_escrow_immutable
```

### Explanation

The system should prevent the newsvendor from strategically underpaying the expert after the realized outcome becomes known.


---

## Concept: dr_004_remove_unilateral_payment_control

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dr_004_remove_unilateral_payment_control
type: DesignRequirement
dsr_layer: Requirement
title: Remove unilateral newsvendor control over escrowed funds and settlement
description: Funds for the expert payment should not remain under the unilateral control
  of the newsvendor after the contract is deployed and conditions are met.
tags:
- escrow
- decentralized-control
- settlement
confidence: medium-high
extraction_type: inferred
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_011_design_principles_escrow_immutable
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_017_payment_validation
```

### Explanation

Funds for the expert payment should not remain under the unilateral control of the newsvendor after the contract is deployed and conditions are met.


---

## Concept: dr_005_define_unambiguous_realized_outcome_source

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dr_005_define_unambiguous_realized_outcome_source
type: DesignRequirement
dsr_layer: Requirement
title: Define the source of the realized outcome unambiguously
description: Because forecast accuracy and payment depend on the realized outcome,
  the system must clearly define the data source or oracle used to determine the outcome.
tags:
- oracle
- realized-outcome
- data-source
- forecast-evaluation
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_012_design_principle_oracle
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_016_retrieve_outcome_validation
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_019_oracles_and_disputes
```

### Explanation

Because forecast accuracy and payment depend on the realized outcome, the system must clearly define the data source or oracle used to determine the outcome.


---

## Concept: dr_006_preserve_auditability_of_forecast_contract_events

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dr_006_preserve_auditability_of_forecast_contract_events
type: DesignRequirement
dsr_layer: Requirement
title: Preserve auditable records of forecast submission, outcome retrieval, and payment
description: The system should keep verifiable records of contract deployment, forecast
  reporting, outcome retrieval, and payment settlement so that participants can inspect
  or dispute transactions.
tags:
- auditability
- blockchain-record
- transaction-hash
- traceability
confidence: medium-high
extraction_type: inferred
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_018_dapp_demonstration
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_022_transaction_hash_dispute
```

### Explanation

The system should keep verifiable records of contract deployment, forecast reporting, outcome retrieval, and payment settlement so that participants can inspect or dispute transactions.


---

## Concept: dr_007_manage_deployment_cost_and_privacy_fit

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dr_007_manage_deployment_cost_and_privacy_fit
type: DesignRequirement
dsr_layer: Requirement
title: Manage deployment cost and privacy fit of blockchain implementation
description: The blockchain configuration should be selected with attention to deployment
  costs, transaction-cost volatility, and whether forecasts can be public or need
  privacy-preserving channels.
tags:
- cost
- deployment
- public-blockchain
- permissioned-blockchain
- privacy
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_020_cost_public_blockchain
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_021_permissioned_private_forecasts
```

### Explanation

The blockchain configuration should be selected with attention to deployment costs, transaction-cost volatility, and whether forecasts can be public or need privacy-preserving channels.


---

## Concept: dp_001_decentralized_escrow_for_payments

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dp_001_decentralized_escrow_for_payments
type: DesignPrinciple
dsr_layer: Design Principle
title: Handle expert payments through escrow controlled by no individual entity
description: Forecast payments should be held in an escrow-like account not controlled
  by either the newsvendor or the expert, so payment release depends on the encoded
  contract rather than unilateral discretion.
tags:
- escrow
- decentralized-control
- payment-assurance
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_011_design_principles_escrow_immutable
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_017_payment_validation
```

### Explanation

Forecast payments should be held in an escrow-like account not controlled by either the newsvendor or the expert, so payment release depends on the encoded contract rather than unilateral discretion.


---

## Concept: dp_002_contracts_as_enforceable_immutable_algorithms

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dp_002_contracts_as_enforceable_immutable_algorithms
type: DesignPrinciple
dsr_layer: Design Principle
title: Define the forecast contract as an enforceable and immutable algorithm
description: The payment scheme, forecast validation, outcome source, and settlement
  rules should be encoded in an immutable smart contract with automated enforcement.
tags:
- smart-contract
- immutability
- automated-enforcement
- algorithmic-contract
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_011_design_principles_escrow_immutable
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_013_smart_contract_attributes
```

### Explanation

The payment scheme, forecast validation, outcome source, and settlement rules should be encoded in an immutable smart contract with automated enforcement.


---

## Concept: dp_003_unambiguous_outcome_oracle

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dp_003_unambiguous_outcome_oracle
type: DesignPrinciple
dsr_layer: Design Principle
title: Use an unambiguous realized-outcome source
description: The source of realized demand should be specified clearly enough that
  both parties know how forecast accuracy and payment will be determined.
tags:
- oracle
- outcome-source
- data-feed
- forecast-evaluation
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_012_design_principle_oracle
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_016_retrieve_outcome_validation
```

### Explanation

The source of realized demand should be specified clearly enough that both parties know how forecast accuracy and payment will be determined.


---

## Concept: dp_004_supply_chain_transparency_for_forecast_contracts

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dp_004_supply_chain_transparency_for_forecast_contracts
type: DesignPrinciple
dsr_layer: Design Principle
title: Use blockchain transparency to signal forecast-contract trustworthiness
description: A blockchain-based implementation should make the scoring rule, outcome
  source, forecast submission, and payment logic transparent and stored beyond the
  control of either party.
tags:
- supply-chain-transparency
- trustworthiness
- blockchain
- forecast-sharing
confidence: medium-high
extraction_type: inferred
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_010_blockchain_transparency_high_effort
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_018_dapp_demonstration
```

### Explanation

A blockchain-based implementation should make the scoring rule, outcome source, forecast submission, and payment logic transparent and stored beyond the control of either party.


---

## Concept: df_001_tailored_proper_scoring_rule

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_001_tailored_proper_scoring_rule
type: DesignFeature
dsr_layer: Feature
title: Tailored proper scoring rule based on newsvendor profit
description: The expert payment is defined as a positive affine function of the newsvendor
  profit obtained under the order quantity induced by the reported forecast.
tags:
- proper-scoring-rule
- tailored-scoring-rule
- payment-function
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_007_tailored_scoring_rule
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_023_appendix_example_scoring_rule
```

### Explanation

The expert payment is defined as a positive affine function of the newsvendor profit obtained under the order quantity induced by the reported forecast.


---

## Concept: df_002_funded_smart_contract_escrow

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_002_funded_smart_contract_escrow
type: DesignFeature
dsr_layer: Feature
title: Funded smart contract escrow with maximum expert payment
description: The newsvendor deposits funds into the smart contract during deployment;
  the deposit must be at least the maximum payment the expert can receive.
tags:
- escrow
- smart-contract-funding
- maximum-payment
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_013_smart_contract_attributes
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_014_contract_deployment_validation
```

### Explanation

The newsvendor deposits funds into the smart contract during deployment; the deposit must be at least the maximum payment the expert can receive.


---

## Concept: df_003_contract_metadata_and_deadlines

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_003_contract_metadata_and_deadlines
type: DesignFeature
dsr_layer: Feature
title: 'Public contract metadata: participant addresses, maximum payment, forecast
  deadline, outcome date'
description: The deployed contract exposes the newsvendor address, expert address,
  maximum payment, forecast-submission deadline, and date the realized outcome becomes
  available.
tags:
- metadata
- deadline
- blockchain-address
- contract-info
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_013_smart_contract_attributes
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_018_dapp_demonstration
```

### Explanation

The deployed contract exposes the newsvendor address, expert address, maximum payment, forecast-submission deadline, and date the realized outcome becomes available.


---

## Concept: df_004_contract_deployment_validation

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_004_contract_deployment_validation
type: DesignFeature
dsr_layer: Feature
title: Contract-deployment validation rules
description: Deployment succeeds only if escrowed money covers the maximum payment,
  the creator is the stated newsvendor, and the forecast deadline precedes the outcome-availability
  date.
tags:
- deployment-validation
- role-authentication
- deadline-validation
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_014_contract_deployment_validation
```

### Explanation

Deployment succeeds only if escrowed money covers the maximum payment, the creator is the stated newsvendor, and the forecast deadline precedes the outcome-availability date.


---

## Concept: df_005_report_forecast_function

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_005_report_forecast_function
type: DesignFeature
dsr_layer: Feature
title: reportForecast function for forecast validation and storage
description: "The expert reports a probability vector; the smart contract validates\
  \ that probabilities are feasible, checks the caller\u2019s role and deadline, and\
  \ stores the forecast on-chain."
tags:
- reportForecast
- forecast-submission
- probability-validation
- on-chain-storage
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_015_report_forecast_validation
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_018_dapp_demonstration
```

### Explanation

The expert reports a probability vector; the smart contract validates that probabilities are feasible, checks the caller’s role and deadline, and stores the forecast on-chain.


---

## Concept: df_006_retrieve_realized_outcome_function

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_006_retrieve_realized_outcome_function
type: DesignFeature
dsr_layer: Feature
title: retrieveRealizedOutcome function using a predefined oracle
description: Either authorized party can request outcome retrieval after the outcome
  date; the smart contract queries the predefined oracle/API endpoint and stores the
  realized outcome.
tags:
- retrieveRealizedOutcome
- oracle
- outcome-retrieval
- api
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_016_retrieve_outcome_validation
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_019_oracles_and_disputes
```

### Explanation

Either authorized party can request outcome retrieval after the outcome date; the smart contract queries the predefined oracle/API endpoint and stores the realized outcome.


---

## Concept: df_007_issue_payment_function

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_007_issue_payment_function
type: DesignFeature
dsr_layer: Feature
title: issuePayment function for automated forecast scoring and settlement
description: After the realized outcome is available, the smart contract computes
  payment from the scoring rule and forecast, pays the expert, returns surplus to
  the newsvendor, and deactivates the contract.
tags:
- issuePayment
- automated-payment
- settlement
- scoring-rule
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_017_payment_validation
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_024_smart_contract_code_settlement
```

### Explanation

After the realized outcome is available, the smart contract computes payment from the scoring rule and forecast, pays the expert, returns surplus to the newsvendor, and deactivates the contract.


---

## Concept: df_008_role_authentication_with_blockchain_addresses

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_008_role_authentication_with_blockchain_addresses
type: DesignFeature
dsr_layer: Feature
title: Role authentication with blockchain addresses and digital signatures
description: The contract uses blockchain addresses to identify newsvendor and expert,
  while private keys/signatures prove that submitted transactions came from the stated
  address owner.
tags:
- digital-signature
- address
- authentication
- private-key
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_022_transaction_hash_dispute
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_015_report_forecast_validation
```

### Explanation

The contract uses blockchain addresses to identify newsvendor and expert, while private keys/signatures prove that submitted transactions came from the stated address owner.


---

## Concept: df_009_dapp_interaction_interface

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_009_dapp_interaction_interface
type: DesignFeature
dsr_layer: Feature
title: Blockchain-based Forecasting DApp interface
description: The DApp lets users retrieve contract information, report forecasts,
  retrieve outcomes, issue payments, and inspect forecasts without directly handling
  smart contract complexity.
tags:
- dapp
- user-interface
- web3
- react
- prototype
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_018_dapp_demonstration
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_022_transaction_hash_dispute
```

### Explanation

The DApp lets users retrieve contract information, report forecasts, retrieve outcomes, issue payments, and inspect forecasts without directly handling smart contract complexity.


---

## Concept: df_010_decentralized_oracle_or_dispute_extension

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_010_decentralized_oracle_or_dispute_extension
type: DesignFeature
dsr_layer: Feature
title: Decentralized oracle or dispute-resolution extension for contested outcomes
description: When the realized outcome is not public or could be manipulated, the
  design can be extended with decentralized oracles or an independent dispute resolver.
tags:
- decentralized-oracle
- dispute-resolution
- outcome-determination
- extension
confidence: medium
extraction_type: inferred
review_status: draft
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_019_oracles_and_disputes
```

### Explanation

When the realized outcome is not public or could be manipulated, the design can be extended with decentralized oracles or an independent dispute resolver.


---

## Concept: df_011_permissioned_channel_for_private_forecasts

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_011_permissioned_channel_for_private_forecasts
type: DesignFeature
dsr_layer: Feature
title: Permissioned blockchain channel for confidential forecasts
description: When reported forecasts should not be public, the authors suggest permissioned
  blockchain infrastructure with private channels, such as Hyperledger Fabric-style
  channels.
tags:
- permissioned-blockchain
- private-channel
- forecast-privacy
- confidentiality
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_021_permissioned_private_forecasts
```

### Explanation

When reported forecasts should not be public, the authors suggest permissioned blockchain infrastructure with private channels, such as Hyperledger Fabric-style channels.


---

## Concept: art_001_blockchain_forecasting_smart_contract

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:art_001_blockchain_forecasting_smart_contract
type: Artifact
dsr_layer: Artifact
title: Blockchain-based smart contract for forecast acquisition and payment
description: A smart contract mediates the newsvendor-expert relationship by holding
  escrowed funds, storing forecasts, retrieving outcomes, calculating scores, and
  settling payments.
tags:
- smart-contract
- forecast-acquisition
- automated-settlement
- escrow
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_013_smart_contract_attributes
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_014_contract_deployment_validation
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_017_payment_validation
```

### Explanation

A smart contract mediates the newsvendor-expert relationship by holding escrowed funds, storing forecasts, retrieving outcomes, calculating scores, and settling payments.


---

## Concept: art_002_blockchain_based_forecasting_dapp

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:art_002_blockchain_based_forecasting_dapp
type: Artifact
dsr_layer: Artifact
title: Blockchain-Based Forecasting DApp prototype
description: A web DApp demonstrates how the newsvendor and expert interact with the
  deployed smart contract through contract information retrieval, forecast reporting,
  outcome retrieval, payment issue, and forecast retrieval screens.
tags:
- prototype
- dapp
- web3
- ethereum
- forecasting-interface
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_018_dapp_demonstration
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_022_transaction_hash_dispute
```

### Explanation

A web DApp demonstrates how the newsvendor and expert interact with the deployed smart contract through contract information retrieval, forecast reporting, outcome retrieval, payment issue, and forecast retrieval screens.


---

## Concept: art_003_tailored_scoring_rule_model

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:art_003_tailored_scoring_rule_model
type: Artifact
dsr_layer: Artifact
title: Tailored newsvendor proper scoring rule model
description: "The formal scoring-rule model defines the expert\u2019s score as a scaled\
  \ function of the newsvendor\u2019s realized profit under the forecast-induced order\
  \ quantity."
tags:
- formal-model
- tailored-scoring-rule
- newsvendor-model
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_007_tailored_scoring_rule
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_023_appendix_example_scoring_rule
```

### Explanation

The formal scoring-rule model defines the expert’s score as a scaled function of the newsvendor’s realized profit under the forecast-induced order quantity.


---

## Concept: eval_001_formal_proofs_and_game_theoretic_analysis

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:eval_001_formal_proofs_and_game_theoretic_analysis
type: Evaluation
dsr_layer: Evaluation
title: Formal proof and game-theoretic evaluation
description: The authors evaluate incentive alignment and trust effects through propositions,
  corollaries, proofs, and a dynamic game with incomplete information.
tags:
- formal-evaluation
- game-theory
- proofs
- perfect-bayesian-equilibrium
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_008_corollary_high_effort_profit
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_010_blockchain_transparency_high_effort
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_025_proposition_3_equilibrium
```

### Explanation

The authors evaluate incentive alignment and trust effects through propositions, corollaries, proofs, and a dynamic game with incomplete information.


---

## Concept: eval_002_design_principle_functionality_evaluation

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:eval_002_design_principle_functionality_evaluation
type: Evaluation
dsr_layer: Evaluation
title: Design-principle functionality evaluation
description: The authors evaluate whether the smart-contract artifact satisfies the
  design objectives, including escrow, immutable enforcement, oracle source, and payment
  automation.
tags:
- design-science-evaluation
- design-principles
- artifact-functionality
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_017_payment_validation
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_019_oracles_and_disputes
```

### Explanation

The authors evaluate whether the smart-contract artifact satisfies the design objectives, including escrow, immutable enforcement, oracle source, and payment automation.


---

## Concept: eval_003_cost_and_deployment_evaluation

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:eval_003_cost_and_deployment_evaluation
type: Evaluation
dsr_layer: Evaluation
title: Cost and deployment-strategy evaluation
description: The paper evaluates public blockchain deployment and interaction costs
  and discusses public, dedicated public, and permissioned deployment strategies.
tags:
- cost-evaluation
- deployment-strategy
- ethereum
- permissioned-blockchain
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_020_cost_public_blockchain
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_021_permissioned_private_forecasts
```

### Explanation

The paper evaluates public blockchain deployment and interaction costs and discusses public, dedicated public, and permissioned deployment strategies.


---

## Concept: eval_004_prototype_demonstration

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:eval_004_prototype_demonstration
type: Evaluation
dsr_layer: Evaluation
title: Ethereum smart contract and DApp prototype demonstration
description: The paper demonstrates a working Ethereum smart contract and DApp with
  screens for contract retrieval, forecast reporting, outcome retrieval, payment,
  and forecast retrieval.
tags:
- prototype-demonstration
- ethereum
- dapp
- smart-contract
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_018_dapp_demonstration
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_024_smart_contract_code_settlement
```

### Explanation

The paper demonstrates a working Ethereum smart contract and DApp with screens for contract retrieval, forecast reporting, outcome retrieval, payment, and forecast retrieval.


---

## Concept: ok_001_tailored_scoring_aligns_incentives

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ok_001_tailored_scoring_aligns_incentives
type: OutputKnowledge
dsr_layer: Output Knowledge
title: Tailored proper scoring rules can align expert and newsvendor incentives
description: "A scoring rule tailored to the newsvendor\u2019s profit objective can\
  \ induce truthful reporting and make higher expert effort increase both the expert\u2019\
  s expected payment and the newsvendor\u2019s expected profit."
tags:
- design-knowledge
- incentive-alignment
- proper-scoring-rules
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_007_tailored_scoring_rule
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_008_corollary_high_effort_profit
```

### Explanation

A scoring rule tailored to the newsvendor’s profit objective can induce truthful reporting and make higher expert effort increase both the expert’s expected payment and the newsvendor’s expected profit.


---

## Concept: ok_002_blockchain_smart_contracts_mitigate_trust_issue

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ok_002_blockchain_smart_contracts_mitigate_trust_issue
type: OutputKnowledge
dsr_layer: Output Knowledge
title: Blockchain smart contracts can mitigate outcome-contingent forecast-payment
  trust issues
description: When trust is an issue, putting the forecast contract on a blockchain
  forces full payment according to the encoded rule and can induce high expert effort
  in equilibrium.
tags:
- design-knowledge
- blockchain
- trust
- forecast-payment
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_010_blockchain_transparency_high_effort
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_025_proposition_3_equilibrium
```

### Explanation

When trust is an issue, putting the forecast contract on a blockchain forces full payment according to the encoded rule and can induce high expert effort in equilibrium.


---

## Concept: ok_003_design_blueprint_for_blockchain_forecasting_contracts

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ok_003_design_blueprint_for_blockchain_forecasting_contracts
type: OutputKnowledge
dsr_layer: Output Knowledge
title: Design blueprint for blockchain-based forecast acquisition contracts
description: The paper contributes design principles and system requirements for smart
  contracts that handle forecast submission, outcome retrieval, and payment settlement.
tags:
- design-knowledge
- blueprint
- smart-contract
- forecasting
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_011_design_principles_escrow_immutable
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_013_smart_contract_attributes
```

### Explanation

The paper contributes design principles and system requirements for smart contracts that handle forecast submission, outcome retrieval, and payment settlement.


---

## Concept: ok_004_deployment_fit_requires_cost_privacy_and_oracle_choices

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ok_004_deployment_fit_requires_cost_privacy_and_oracle_choices
type: OutputKnowledge
dsr_layer: Output Knowledge
title: Deployment fit depends on cost, privacy, and oracle design choices
description: A practical blockchain forecasting contract must account for public-chain
  costs, private forecast confidentiality, and trustworthy outcome-oracle/dispute
  mechanisms.
tags:
- deployment
- privacy
- oracle
- cost
- limitations
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_019_oracles_and_disputes
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_020_cost_public_blockchain
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_021_permissioned_private_forecasts
```

### Explanation

A practical blockchain forecasting contract must account for public-chain costs, private forecast confidentiality, and trustworthy outcome-oracle/dispute mechanisms.


---

## Concept: kt_001_newsvendor_model

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:kt_001_newsvendor_model
type: KernelTheory
dsr_layer: Kernel Theory
title: Newsvendor inventory model
description: 'The newsvendor model provides the decision problem that the scoring
  rule is tailored to: the newsvendor chooses an inventory quantity before demand
  realization.'
tags:
- kernel-theory
- newsvendor
- inventory
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_006_newsvendor_model
```

### Explanation

The newsvendor model provides the decision problem that the scoring rule is tailored to: the newsvendor chooses an inventory quantity before demand realization.


---

## Concept: kt_002_proper_scoring_rules

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:kt_002_proper_scoring_rules
type: KernelTheory
dsr_layer: Kernel Theory
title: Proper scoring rules for truthful forecast elicitation
description: 'Proper scoring rules provide the forecast-elicitation foundation: experts
  maximize expected score by reporting their true beliefs.'
tags:
- kernel-theory
- proper-scoring-rule
- forecast-elicitation
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_005_proper_scoring_rules
```

### Explanation

Proper scoring rules provide the forecast-elicitation foundation: experts maximize expected score by reporting their true beliefs.


---

## Concept: kt_003_trust_and_trustworthiness

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:kt_003_trust_and_trustworthiness
type: KernelTheory
dsr_layer: Kernel Theory
title: Trust and trustworthiness in forecast sharing and supply chains
description: The trust literature explains why a forecast provider may distrust a
  requester who observes the outcome and controls outcome-contingent payment.
tags:
- kernel-theory
- trust
- supply-chain
- forecast-sharing
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_009_trust_in_forecast_sharing
```

### Explanation

The trust literature explains why a forecast provider may distrust a requester who observes the outcome and controls outcome-contingent payment.


---

## Concept: kt_004_blockchain_and_smart_contracts

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:kt_004_blockchain_and_smart_contracts
type: KernelTheory
dsr_layer: Kernel Theory
title: Blockchain and smart contracts as distributed execution and immutable state
  infrastructure
description: Blockchain and smart contracts provide the technical substrate for decentralized
  escrow, immutable algorithms, transparent execution, and automated payment.
tags:
- kernel-theory
- blockchain
- smart-contract
- distributed-ledger
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_010_blockchain_transparency_high_effort
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_011_design_principles_escrow_immutable
```

### Explanation

Blockchain and smart contracts provide the technical substrate for decentralized escrow, immutable algorithms, transparent execution, and automated payment.


---

## Concept: lim_001_outcome_oracle_dependence

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:lim_001_outcome_oracle_dependence
type: Limitation
dsr_layer: Limitation
title: Outcome oracle dependence and manipulation risk
description: If the newsvendor is the only entity with access to the realized outcome
  and is not obliged to report it, the oracle can still be manipulated unless the
  design adds dispute resolution or decentralized outcome determination.
tags:
- limitation
- oracle
- outcome-manipulation
- dispute-resolution
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_019_oracles_and_disputes
```

### Explanation

If the newsvendor is the only entity with access to the realized outcome and is not obliged to report it, the oracle can still be manipulated unless the design adds dispute resolution or decentralized outcome determination.


---

## Concept: lim_002_expert_controlled_outcome_not_addressed

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:lim_002_expert_controlled_outcome_not_addressed
type: Limitation
dsr_layer: Limitation
title: Expert-controlled outcome settings are outside the solution scope
description: The authors state that the solution does not apply when the expert determines
  or significantly influences the realized outcome.
tags:
- limitation
- expert-controlled-outcome
- forecasting
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_026_future_work_limitations
```

### Explanation

The authors state that the solution does not apply when the expert determines or significantly influences the realized outcome.


---

## Concept: lim_003_public_chain_cost_and_privacy_constraints

```yaml
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:lim_003_public_chain_cost_and_privacy_constraints
type: Limitation
dsr_layer: Limitation
title: Public-chain cost volatility and public forecast visibility constraints
description: Using a public general-purpose blockchain such as Ethereum can create
  transaction-cost volatility and may be unsuitable when forecasts should remain confidential.
tags:
- limitation
- public-blockchain
- cost-volatility
- privacy
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_020_cost_public_blockchain
- NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_021_permissioned_private_forecasts
```

### Explanation

Using a public general-purpose blockchain such as Ethereum can create transaction-cost volatility and may be unsuitable when forecasts should remain confidential.
