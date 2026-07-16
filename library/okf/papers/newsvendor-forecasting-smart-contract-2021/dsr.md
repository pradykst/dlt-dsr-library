---
schema_version: "okf-dsr-v1"
type: "ConceptCollection"
paper_id: "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021"
extraction_status: "okf_draft"
review_status: "unreviewed"
---

# Canonical DSR Concepts

## Concept: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:prob_001_forecast_incentive_trust_problem
```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:prob_001_forecast_incentive_trust_problem",
  "type": "Problem",
  "title": "Forecast acquisition with incentive misalignment and payment-trust risk",
  "description": "A newsvendor depends on an expert forecast to choose inventory, but the expert wants to maximize payment while the newsvendor wants to maximize profit; because payment depends on a future realized outcome that may only be visible to the newsvendor, the expert may distrust outcome-contingent payment.",
  "evidence": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_001_abstract_problem",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_002_incentive_trust_setting",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_003_two_major_challenges"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

A newsvendor depends on an expert forecast to choose inventory, but the expert wants to maximize payment while the newsvendor wants to maximize profit; because payment depends on a future realized outcome that may only be visible to the newsvendor, the expert may distrust outcome-contingent payment.

---

## Concept: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dr_001_align_expert_effort_with_newsvendor_profit
```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dr_001_align_expert_effort_with_newsvendor_profit",
  "type": "Design Requirement",
  "title": "Align expert effort with newsvendor profit",
  "description": "The system should make higher expert forecasting effort beneficial not only to the expert but also to the newsvendor’s expected profit.",
  "evidence": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_007_tailored_scoring_rule",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_008_corollary_high_effort_profit"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The system should make higher expert forecasting effort beneficial not only to the expert but also to the newsvendor’s expected profit.

---

## Concept: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dr_002_induce_truthful_forecast_reporting
```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dr_002_induce_truthful_forecast_reporting",
  "type": "Design Requirement",
  "title": "Induce truthful probabilistic forecast reporting",
  "description": "The payment rule should be incentive-compatible so the expert maximizes expected score by reporting the forecast corresponding to his belief.",
  "evidence": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_005_proper_scoring_rules",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_007_tailored_scoring_rule"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The payment rule should be incentive-compatible so the expert maximizes expected score by reporting the forecast corresponding to his belief.

---

## Concept: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dr_003_make_outcome_contingent_payment_enforceable
```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dr_003_make_outcome_contingent_payment_enforceable",
  "type": "Design Requirement",
  "title": "Make outcome-contingent expert payment enforceable",
  "description": "The system should prevent the newsvendor from strategically underpaying the expert after the realized outcome becomes known.",
  "evidence": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_003_two_major_challenges",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_011_design_principles_escrow_immutable"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The system should prevent the newsvendor from strategically underpaying the expert after the realized outcome becomes known.

---

## Concept: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dr_004_remove_unilateral_payment_control
```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dr_004_remove_unilateral_payment_control",
  "type": "Design Requirement",
  "title": "Remove unilateral newsvendor control over escrowed funds and settlement",
  "description": "Funds for the expert payment should not remain under the unilateral control of the newsvendor after the contract is deployed and conditions are met.",
  "evidence": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_011_design_principles_escrow_immutable",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_017_payment_validation"
  ],
  "confidence": "medium-high",
  "extraction_type": "inferred",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Funds for the expert payment should not remain under the unilateral control of the newsvendor after the contract is deployed and conditions are met.

---

## Concept: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dr_005_define_unambiguous_realized_outcome_source
```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dr_005_define_unambiguous_realized_outcome_source",
  "type": "Design Requirement",
  "title": "Define the source of the realized outcome unambiguously",
  "description": "Because forecast accuracy and payment depend on the realized outcome, the system must clearly define the data source or oracle used to determine the outcome.",
  "evidence": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_012_design_principle_oracle",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_016_retrieve_outcome_validation",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_019_oracles_and_disputes"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Because forecast accuracy and payment depend on the realized outcome, the system must clearly define the data source or oracle used to determine the outcome.

---

## Concept: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dr_006_preserve_auditability_of_forecast_contract_events
```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dr_006_preserve_auditability_of_forecast_contract_events",
  "type": "Design Requirement",
  "title": "Preserve auditable records of forecast submission, outcome retrieval, and payment",
  "description": "The system should keep verifiable records of contract deployment, forecast reporting, outcome retrieval, and payment settlement so that participants can inspect or dispute transactions.",
  "evidence": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_018_dapp_demonstration",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_022_transaction_hash_dispute"
  ],
  "confidence": "medium-high",
  "extraction_type": "inferred",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The system should keep verifiable records of contract deployment, forecast reporting, outcome retrieval, and payment settlement so that participants can inspect or dispute transactions.

---

## Concept: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dr_007_manage_deployment_cost_and_privacy_fit
```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dr_007_manage_deployment_cost_and_privacy_fit",
  "type": "Design Requirement",
  "title": "Manage deployment cost and privacy fit of blockchain implementation",
  "description": "The blockchain configuration should be selected with attention to deployment costs, transaction-cost volatility, and whether forecasts can be public or need privacy-preserving channels.",
  "evidence": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_020_cost_public_blockchain",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_021_permissioned_private_forecasts"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The blockchain configuration should be selected with attention to deployment costs, transaction-cost volatility, and whether forecasts can be public or need privacy-preserving channels.

---

## Concept: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dp_001_decentralized_escrow_for_payments
```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dp_001_decentralized_escrow_for_payments",
  "type": "Design Principle",
  "title": "Handle expert payments through escrow controlled by no individual entity",
  "description": "Forecast payments should be held in an escrow-like account not controlled by either the newsvendor or the expert, so payment release depends on the encoded contract rather than unilateral discretion.",
  "evidence": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_011_design_principles_escrow_immutable",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_017_payment_validation"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Forecast payments should be held in an escrow-like account not controlled by either the newsvendor or the expert, so payment release depends on the encoded contract rather than unilateral discretion.

---

## Concept: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dp_002_contracts_as_enforceable_immutable_algorithms
```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dp_002_contracts_as_enforceable_immutable_algorithms",
  "type": "Design Principle",
  "title": "Define the forecast contract as an enforceable and immutable algorithm",
  "description": "The payment scheme, forecast validation, outcome source, and settlement rules should be encoded in an immutable smart contract with automated enforcement.",
  "evidence": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_011_design_principles_escrow_immutable",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_013_smart_contract_attributes"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The payment scheme, forecast validation, outcome source, and settlement rules should be encoded in an immutable smart contract with automated enforcement.

---

## Concept: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dp_003_unambiguous_outcome_oracle
```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dp_003_unambiguous_outcome_oracle",
  "type": "Design Principle",
  "title": "Use an unambiguous realized-outcome source",
  "description": "The source of realized demand should be specified clearly enough that both parties know how forecast accuracy and payment will be determined.",
  "evidence": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_012_design_principle_oracle",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_016_retrieve_outcome_validation"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The source of realized demand should be specified clearly enough that both parties know how forecast accuracy and payment will be determined.

---

## Concept: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dp_004_supply_chain_transparency_for_forecast_contracts
```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dp_004_supply_chain_transparency_for_forecast_contracts",
  "type": "Design Principle",
  "title": "Use blockchain transparency to signal forecast-contract trustworthiness",
  "description": "A blockchain-based implementation should make the scoring rule, outcome source, forecast submission, and payment logic transparent and stored beyond the control of either party.",
  "evidence": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_010_blockchain_transparency_high_effort",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_018_dapp_demonstration"
  ],
  "confidence": "medium-high",
  "extraction_type": "inferred",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

A blockchain-based implementation should make the scoring rule, outcome source, forecast submission, and payment logic transparent and stored beyond the control of either party.

---

## Concept: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_001_tailored_proper_scoring_rule
```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_001_tailored_proper_scoring_rule",
  "type": "Design Feature",
  "title": "Tailored proper scoring rule based on newsvendor profit",
  "description": "The expert payment is defined as a positive affine function of the newsvendor profit obtained under the order quantity induced by the reported forecast.",
  "evidence": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_007_tailored_scoring_rule",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_023_appendix_example_scoring_rule"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The expert payment is defined as a positive affine function of the newsvendor profit obtained under the order quantity induced by the reported forecast.

---

## Concept: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_002_funded_smart_contract_escrow
```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_002_funded_smart_contract_escrow",
  "type": "Design Feature",
  "title": "Funded smart contract escrow with maximum expert payment",
  "description": "The newsvendor deposits funds into the smart contract during deployment; the deposit must be at least the maximum payment the expert can receive.",
  "evidence": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_013_smart_contract_attributes",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_014_contract_deployment_validation"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The newsvendor deposits funds into the smart contract during deployment; the deposit must be at least the maximum payment the expert can receive.

---

## Concept: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_003_contract_metadata_and_deadlines
```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_003_contract_metadata_and_deadlines",
  "type": "Design Feature",
  "title": "Public contract metadata: participant addresses, maximum payment, forecast deadline, outcome date",
  "description": "The deployed contract exposes the newsvendor address, expert address, maximum payment, forecast-submission deadline, and date the realized outcome becomes available.",
  "evidence": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_013_smart_contract_attributes",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_018_dapp_demonstration"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The deployed contract exposes the newsvendor address, expert address, maximum payment, forecast-submission deadline, and date the realized outcome becomes available.

---

## Concept: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_004_contract_deployment_validation
```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_004_contract_deployment_validation",
  "type": "Design Feature",
  "title": "Contract-deployment validation rules",
  "description": "Deployment succeeds only if escrowed money covers the maximum payment, the creator is the stated newsvendor, and the forecast deadline precedes the outcome-availability date.",
  "evidence": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_014_contract_deployment_validation"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Deployment succeeds only if escrowed money covers the maximum payment, the creator is the stated newsvendor, and the forecast deadline precedes the outcome-availability date.

---

## Concept: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_005_report_forecast_function
```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_005_report_forecast_function",
  "type": "Design Feature",
  "title": "reportForecast function for forecast validation and storage",
  "description": "The expert reports a probability vector; the smart contract validates that probabilities are feasible, checks the caller’s role and deadline, and stores the forecast on-chain.",
  "evidence": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_015_report_forecast_validation",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_018_dapp_demonstration"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The expert reports a probability vector; the smart contract validates that probabilities are feasible, checks the caller’s role and deadline, and stores the forecast on-chain.

---

## Concept: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_006_retrieve_realized_outcome_function
```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_006_retrieve_realized_outcome_function",
  "type": "Design Feature",
  "title": "retrieveRealizedOutcome function using a predefined oracle",
  "description": "Either authorized party can request outcome retrieval after the outcome date; the smart contract queries the predefined oracle/API endpoint and stores the realized outcome.",
  "evidence": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_016_retrieve_outcome_validation",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_019_oracles_and_disputes"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Either authorized party can request outcome retrieval after the outcome date; the smart contract queries the predefined oracle/API endpoint and stores the realized outcome.

---

## Concept: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_007_issue_payment_function
```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_007_issue_payment_function",
  "type": "Design Feature",
  "title": "issuePayment function for automated forecast scoring and settlement",
  "description": "After the realized outcome is available, the smart contract computes payment from the scoring rule and forecast, pays the expert, returns surplus to the newsvendor, and deactivates the contract.",
  "evidence": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_017_payment_validation",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_024_smart_contract_code_settlement"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

After the realized outcome is available, the smart contract computes payment from the scoring rule and forecast, pays the expert, returns surplus to the newsvendor, and deactivates the contract.

---

## Concept: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_008_role_authentication_with_blockchain_addresses
```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_008_role_authentication_with_blockchain_addresses",
  "type": "Design Feature",
  "title": "Role authentication with blockchain addresses and digital signatures",
  "description": "The contract uses blockchain addresses to identify newsvendor and expert, while private keys/signatures prove that submitted transactions came from the stated address owner.",
  "evidence": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_022_transaction_hash_dispute",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_015_report_forecast_validation"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The contract uses blockchain addresses to identify newsvendor and expert, while private keys/signatures prove that submitted transactions came from the stated address owner.

---

## Concept: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_009_dapp_interaction_interface
```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_009_dapp_interaction_interface",
  "type": "Design Feature",
  "title": "Blockchain-based Forecasting DApp interface",
  "description": "The DApp lets users retrieve contract information, report forecasts, retrieve outcomes, issue payments, and inspect forecasts without directly handling smart contract complexity.",
  "evidence": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_018_dapp_demonstration",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_022_transaction_hash_dispute"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The DApp lets users retrieve contract information, report forecasts, retrieve outcomes, issue payments, and inspect forecasts without directly handling smart contract complexity.

---

## Concept: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_010_decentralized_oracle_or_dispute_extension
```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_010_decentralized_oracle_or_dispute_extension",
  "type": "Design Feature",
  "title": "Decentralized oracle or dispute-resolution extension for contested outcomes",
  "description": "When the realized outcome is not public or could be manipulated, the design can be extended with decentralized oracles or an independent dispute resolver.",
  "evidence": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_019_oracles_and_disputes"
  ],
  "confidence": "medium",
  "extraction_type": "inferred",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

When the realized outcome is not public or could be manipulated, the design can be extended with decentralized oracles or an independent dispute resolver.

---

## Concept: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_011_permissioned_channel_for_private_forecasts
```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_011_permissioned_channel_for_private_forecasts",
  "type": "Design Feature",
  "title": "Permissioned blockchain channel for confidential forecasts",
  "description": "When reported forecasts should not be public, the authors suggest permissioned blockchain infrastructure with private channels, such as Hyperledger Fabric-style channels.",
  "evidence": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_021_permissioned_private_forecasts"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

When reported forecasts should not be public, the authors suggest permissioned blockchain infrastructure with private channels, such as Hyperledger Fabric-style channels.

---

## Concept: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:art_001_blockchain_forecasting_smart_contract
```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:art_001_blockchain_forecasting_smart_contract",
  "type": "Artifact",
  "title": "Blockchain-based smart contract for forecast acquisition and payment",
  "description": "A smart contract mediates the newsvendor-expert relationship by holding escrowed funds, storing forecasts, retrieving outcomes, calculating scores, and settling payments.",
  "evidence": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_013_smart_contract_attributes",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_014_contract_deployment_validation",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_017_payment_validation"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

A smart contract mediates the newsvendor-expert relationship by holding escrowed funds, storing forecasts, retrieving outcomes, calculating scores, and settling payments.

---

## Concept: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:art_002_blockchain_based_forecasting_dapp
```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:art_002_blockchain_based_forecasting_dapp",
  "type": "Artifact",
  "title": "Blockchain-Based Forecasting DApp prototype",
  "description": "A web DApp demonstrates how the newsvendor and expert interact with the deployed smart contract through contract information retrieval, forecast reporting, outcome retrieval, payment issue, and forecast retrieval screens.",
  "evidence": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_018_dapp_demonstration",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_022_transaction_hash_dispute"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

A web DApp demonstrates how the newsvendor and expert interact with the deployed smart contract through contract information retrieval, forecast reporting, outcome retrieval, payment issue, and forecast retrieval screens.

---

## Concept: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:art_003_tailored_scoring_rule_model
```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:art_003_tailored_scoring_rule_model",
  "type": "Artifact",
  "title": "Tailored newsvendor proper scoring rule model",
  "description": "The formal scoring-rule model defines the expert’s score as a scaled function of the newsvendor’s realized profit under the forecast-induced order quantity.",
  "evidence": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_007_tailored_scoring_rule",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_023_appendix_example_scoring_rule"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The formal scoring-rule model defines the expert’s score as a scaled function of the newsvendor’s realized profit under the forecast-induced order quantity.

---

## Concept: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:eval_001_formal_proofs_and_game_theoretic_analysis
```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:eval_001_formal_proofs_and_game_theoretic_analysis",
  "type": "Evaluation",
  "title": "Formal proof and game-theoretic evaluation",
  "description": "The authors evaluate incentive alignment and trust effects through propositions, corollaries, proofs, and a dynamic game with incomplete information.",
  "evidence": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_008_corollary_high_effort_profit",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_010_blockchain_transparency_high_effort",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_025_proposition_3_equilibrium"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The authors evaluate incentive alignment and trust effects through propositions, corollaries, proofs, and a dynamic game with incomplete information.

---

## Concept: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:eval_002_design_principle_functionality_evaluation
```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:eval_002_design_principle_functionality_evaluation",
  "type": "Evaluation",
  "title": "Design-principle functionality evaluation",
  "description": "The authors evaluate whether the smart-contract artifact satisfies the design objectives, including escrow, immutable enforcement, oracle source, and payment automation.",
  "evidence": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_017_payment_validation",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_019_oracles_and_disputes"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The authors evaluate whether the smart-contract artifact satisfies the design objectives, including escrow, immutable enforcement, oracle source, and payment automation.

---

## Concept: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:eval_003_cost_and_deployment_evaluation
```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:eval_003_cost_and_deployment_evaluation",
  "type": "Evaluation",
  "title": "Cost and deployment-strategy evaluation",
  "description": "The paper evaluates public blockchain deployment and interaction costs and discusses public, dedicated public, and permissioned deployment strategies.",
  "evidence": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_020_cost_public_blockchain",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_021_permissioned_private_forecasts"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The paper evaluates public blockchain deployment and interaction costs and discusses public, dedicated public, and permissioned deployment strategies.

---

## Concept: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:eval_004_prototype_demonstration
```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:eval_004_prototype_demonstration",
  "type": "Evaluation",
  "title": "Ethereum smart contract and DApp prototype demonstration",
  "description": "The paper demonstrates a working Ethereum smart contract and DApp with screens for contract retrieval, forecast reporting, outcome retrieval, payment, and forecast retrieval.",
  "evidence": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_018_dapp_demonstration",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_024_smart_contract_code_settlement"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The paper demonstrates a working Ethereum smart contract and DApp with screens for contract retrieval, forecast reporting, outcome retrieval, payment, and forecast retrieval.

---

## Concept: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ok_001_tailored_scoring_aligns_incentives
```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ok_001_tailored_scoring_aligns_incentives",
  "type": "Output Knowledge",
  "title": "Tailored proper scoring rules can align expert and newsvendor incentives",
  "description": "A scoring rule tailored to the newsvendor’s profit objective can induce truthful reporting and make higher expert effort increase both the expert’s expected payment and the newsvendor’s expected profit.",
  "evidence": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_007_tailored_scoring_rule",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_008_corollary_high_effort_profit"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

A scoring rule tailored to the newsvendor’s profit objective can induce truthful reporting and make higher expert effort increase both the expert’s expected payment and the newsvendor’s expected profit.

---

## Concept: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ok_002_blockchain_smart_contracts_mitigate_trust_issue
```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ok_002_blockchain_smart_contracts_mitigate_trust_issue",
  "type": "Output Knowledge",
  "title": "Blockchain smart contracts can mitigate outcome-contingent forecast-payment trust issues",
  "description": "When trust is an issue, putting the forecast contract on a blockchain forces full payment according to the encoded rule and can induce high expert effort in equilibrium.",
  "evidence": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_010_blockchain_transparency_high_effort",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_025_proposition_3_equilibrium"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

When trust is an issue, putting the forecast contract on a blockchain forces full payment according to the encoded rule and can induce high expert effort in equilibrium.

---

## Concept: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ok_003_design_blueprint_for_blockchain_forecasting_contracts
```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ok_003_design_blueprint_for_blockchain_forecasting_contracts",
  "type": "Output Knowledge",
  "title": "Design blueprint for blockchain-based forecast acquisition contracts",
  "description": "The paper contributes design principles and system requirements for smart contracts that handle forecast submission, outcome retrieval, and payment settlement.",
  "evidence": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_011_design_principles_escrow_immutable",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_013_smart_contract_attributes"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The paper contributes design principles and system requirements for smart contracts that handle forecast submission, outcome retrieval, and payment settlement.

---

## Concept: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ok_004_deployment_fit_requires_cost_privacy_and_oracle_choices
```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ok_004_deployment_fit_requires_cost_privacy_and_oracle_choices",
  "type": "Output Knowledge",
  "title": "Deployment fit depends on cost, privacy, and oracle design choices",
  "description": "A practical blockchain forecasting contract must account for public-chain costs, private forecast confidentiality, and trustworthy outcome-oracle/dispute mechanisms.",
  "evidence": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_019_oracles_and_disputes",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_020_cost_public_blockchain",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_021_permissioned_private_forecasts"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

A practical blockchain forecasting contract must account for public-chain costs, private forecast confidentiality, and trustworthy outcome-oracle/dispute mechanisms.
