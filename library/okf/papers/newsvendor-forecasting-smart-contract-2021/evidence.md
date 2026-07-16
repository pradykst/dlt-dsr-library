---
schema_version: "okf-dsr-v1"
type: "EvidenceCollection"
paper_id: "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021"
extraction_status: "okf_draft"
review_status: "unreviewed"
---

# Canonical Evidence Items

## Evidence: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_001_abstract_problem

```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_001_abstract_problem",
  "supports": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:prob_001_forecast_incentive_trust_problem"
  ],
  "source_location": "Aligning the interests of newsvendors and forecasters through blockchain-based smart contracts and proper scoring rules.PDF · page 1 · Abstract",
  "quote_or_summary": "The abstract states that the paper considers a newsvendor who elicits a demand forecast from an expert, proposes a tailored proper scoring rule, and shows that coding it as a blockchain smart contract can signal trustworthiness and induce effort.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_002_incentive_trust_setting

```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_002_incentive_trust_setting",
  "supports": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:prob_001_forecast_incentive_trust_problem"
  ],
  "source_location": "Aligning the interests of newsvendors and forecasters through blockchain-based smart contracts and proper scoring rules.PDF · page 1 · Introduction",
  "quote_or_summary": "The introduction explains that organizations requesting forecasts care about inventory and profit, whereas forecast providers may care about maximizing payment; trust issues arise when payments depend on a future outcome.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_003_two_major_challenges

```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_003_two_major_challenges",
  "supports": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:prob_001_forecast_incentive_trust_problem",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dr_003_make_outcome_contingent_payment_enforceable"
  ],
  "source_location": "Aligning the interests of newsvendors and forecasters through blockchain-based smart contracts and proper scoring rules.PDF · page 2 · Selling forecasts to a newsvendor",
  "quote_or_summary": "The paper identifies two major challenges: expert effort may not match newsvendor profit, and the newsvendor may be the only party observing the realized outcome, creating trust and payment-manipulation concerns.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_004_normative_contributions

```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_004_normative_contributions",
  "supports": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021"
  ],
  "source_location": "Aligning the interests of newsvendors and forecasters through blockchain-based smart contracts and proper scoring rules.PDF · page 2 · Selling forecasts to a newsvendor",
  "quote_or_summary": "The paper states three contributions: a tailored scoring rule aligning expert effort and newsvendor profit, a formal explanation of blockchain’s trust-mitigation role, and a prototype/design for the smart contract.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_005_proper_scoring_rules

```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_005_proper_scoring_rules",
  "supports": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dr_002_induce_truthful_forecast_reporting"
  ],
  "source_location": "Aligning the interests of newsvendors and forecasters through blockchain-based smart contracts and proper scoring rules.PDF · page 2 · Proper scoring rules",
  "quote_or_summary": "The literature review defines proper scoring rules as mechanisms that promote honest belief reporting and score forecast accuracy after outcome realization.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_006_newsvendor_model

```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_006_newsvendor_model",
  "supports": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021"
  ],
  "source_location": "Aligning the interests of newsvendors and forecasters through blockchain-based smart contracts and proper scoring rules.PDF · page 4 · Newsvendor model",
  "quote_or_summary": "The model defines a newsvendor who relies on an expert forecast, chooses an inventory order quantity, and receives profit according to demand, underage, overage, revenue, and cost parameters.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_007_tailored_scoring_rule

```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_007_tailored_scoring_rule",
  "supports": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_001_tailored_proper_scoring_rule",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dr_001_align_expert_effort_with_newsvendor_profit",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dr_002_induce_truthful_forecast_reporting",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:art_003_tailored_scoring_rule_model",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ok_001_tailored_scoring_aligns_incentives"
  ],
  "source_location": "Aligning the interests of newsvendors and forecasters through blockchain-based smart contracts and proper scoring rules.PDF · page 5 · Incentive alignment",
  "quote_or_summary": "Proposition 1 defines the tailored proper scoring rule as a positive affine function of the newsvendor profit under the forecast-induced order quantity.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_008_corollary_high_effort_profit

```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_008_corollary_high_effort_profit",
  "supports": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ok_001_tailored_scoring_aligns_incentives",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dr_001_align_expert_effort_with_newsvendor_profit",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:eval_001_formal_proofs_and_game_theoretic_analysis"
  ],
  "source_location": "Aligning the interests of newsvendors and forecasters through blockchain-based smart contracts and proper scoring rules.PDF · page 5 · Incentive alignment",
  "quote_or_summary": "Corollary 1 states that, under the tailored scoring rule, if the expert exerts higher effort, the newsvendor’s expected profit increases.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_009_trust_in_forecast_sharing

```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_009_trust_in_forecast_sharing",
  "supports": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021"
  ],
  "source_location": "Aligning the interests of newsvendors and forecasters through blockchain-based smart contracts and proper scoring rules.PDF · page 3 · Trust and trustworthiness",
  "quote_or_summary": "The paper reviews trust and trustworthiness in forecast sharing and explains that a newsvendor observing the outcome is expected to behave benevolently when paying the expert.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_010_blockchain_transparency_high_effort

```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_010_blockchain_transparency_high_effort",
  "supports": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ok_002_blockchain_smart_contracts_mitigate_trust_issue",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dp_004_supply_chain_transparency_for_forecast_contracts",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:eval_001_formal_proofs_and_game_theoretic_analysis"
  ],
  "source_location": "Aligning the interests of newsvendors and forecasters through blockchain-based smart contracts and proper scoring rules.PDF · page 6 · Forecast acquisition in the presence of a blockchain-based system",
  "quote_or_summary": "The paper argues that the smart contract transparently defines the scoring rule, determines the outcome source, and automates payment settlement, forcing even a dishonest newsvendor to pay in full.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_011_design_principles_escrow_immutable

```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_011_design_principles_escrow_immutable",
  "supports": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dp_001_decentralized_escrow_for_payments",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dr_003_make_outcome_contingent_payment_enforceable",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dr_004_remove_unilateral_payment_control",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dp_002_contracts_as_enforceable_immutable_algorithms",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ok_003_design_blueprint_for_blockchain_forecasting_contracts"
  ],
  "source_location": "Aligning the interests of newsvendors and forecasters through blockchain-based smart contracts and proper scoring rules.PDF · page 7 · Design principles",
  "quote_or_summary": "The paper explicitly defines Design Principle 1 as escrow accounts controlled by no individual entity and Design Principle 2 as contracts defined as enforceable and immutable algorithms.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_012_design_principle_oracle

```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_012_design_principle_oracle",
  "supports": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dp_003_unambiguous_outcome_oracle",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dr_005_define_unambiguous_realized_outcome_source"
  ],
  "source_location": "Aligning the interests of newsvendors and forecasters through blockchain-based smart contracts and proper scoring rules.PDF · page 7 · Design principles",
  "quote_or_summary": "The paper explicitly defines Design Principle 3 as requiring the source of the realized outcome to be unambiguous, because the oracle determines the payment-relevant outcome.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_013_smart_contract_attributes

```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_013_smart_contract_attributes",
  "supports": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:art_001_blockchain_forecasting_smart_contract",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dp_002_contracts_as_enforceable_immutable_algorithms",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_002_funded_smart_contract_escrow",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_003_contract_metadata_and_deadlines",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ok_003_design_blueprint_for_blockchain_forecasting_contracts"
  ],
  "source_location": "Aligning the interests of newsvendors and forecasters through blockchain-based smart contracts and proper scoring rules.PDF · page 7 · Design and development",
  "quote_or_summary": "The smart contract publicly defines participant addresses, maximum expert payment, a forecast-submission deadline, and the date the realized outcome becomes available.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_014_contract_deployment_validation

```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_014_contract_deployment_validation",
  "supports": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_004_contract_deployment_validation",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_002_funded_smart_contract_escrow",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:art_001_blockchain_forecasting_smart_contract"
  ],
  "source_location": "Aligning the interests of newsvendors and forecasters through blockchain-based smart contracts and proper scoring rules.PDF · page 8 · Requirements 1: Contract Deployment",
  "quote_or_summary": "The deployment requirements specify that deposited funds must cover the maximum payment, the creator must match the newsvendor address, and deployment must occur before forecast and outcome deadlines.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_015_report_forecast_validation

```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_015_report_forecast_validation",
  "supports": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_005_report_forecast_function",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_008_role_authentication_with_blockchain_addresses"
  ],
  "source_location": "Aligning the interests of newsvendors and forecasters through blockchain-based smart contracts and proper scoring rules.PDF · page 8 · Requirements 2: reportForecast",
  "quote_or_summary": "The reportForecast requirements validate that probabilities sum to one, remain between zero and one, are submitted by the expert address, and arrive before the forecast deadline.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_016_retrieve_outcome_validation

```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_016_retrieve_outcome_validation",
  "supports": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_006_retrieve_realized_outcome_function",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dr_005_define_unambiguous_realized_outcome_source",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dp_003_unambiguous_outcome_oracle"
  ],
  "source_location": "Aligning the interests of newsvendors and forecasters through blockchain-based smart contracts and proper scoring rules.PDF · page 8 · Requirements 3: retrieveRealizedOutcome",
  "quote_or_summary": "The retrieveRealizedOutcome function can be called by the newsvendor or expert after the outcome availability date and stores the realized outcome in the blockchain.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_017_payment_validation

```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_017_payment_validation",
  "supports": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_007_issue_payment_function",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dr_004_remove_unilateral_payment_control",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dp_001_decentralized_escrow_for_payments",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:art_001_blockchain_forecasting_smart_contract",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:eval_002_design_principle_functionality_evaluation"
  ],
  "source_location": "Aligning the interests of newsvendors and forecasters through blockchain-based smart contracts and proper scoring rules.PDF · page 9 · Requirements 4: issuePayment",
  "quote_or_summary": "The issuePayment function can be called by either party after outcome availability and pays the expert according to the scoring rule while returning surplus to the newsvendor.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_018_dapp_demonstration

```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_018_dapp_demonstration",
  "supports": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:art_002_blockchain_based_forecasting_dapp",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dr_006_preserve_auditability_of_forecast_contract_events",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dp_004_supply_chain_transparency_for_forecast_contracts",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_003_contract_metadata_and_deadlines",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_005_report_forecast_function",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_009_dapp_interaction_interface",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:eval_004_prototype_demonstration"
  ],
  "source_location": "Aligning the interests of newsvendors and forecasters through blockchain-based smart contracts and proper scoring rules.PDF · page 15 · Appendix D: DApp Demonstration",
  "quote_or_summary": "The DApp supports reading contract information, reporting forecasts, retrieving outcomes, issuing payments, and retrieving forecasts, demonstrating how users interact with the smart contract.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_019_oracles_and_disputes

```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_019_oracles_and_disputes",
  "supports": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dr_005_define_unambiguous_realized_outcome_source",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_006_retrieve_realized_outcome_function",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_010_decentralized_oracle_or_dispute_extension",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:eval_002_design_principle_functionality_evaluation",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ok_004_deployment_fit_requires_cost_privacy_and_oracle_choices"
  ],
  "source_location": "Aligning the interests of newsvendors and forecasters through blockchain-based smart contracts and proper scoring rules.PDF · page 9 · Oracles and realized outcomes",
  "quote_or_summary": "The evaluation discusses centralized oracles, decentralized oracles such as Chainlink, and an independent third-party dispute resolver when the outcome is not public.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_020_cost_public_blockchain

```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_020_cost_public_blockchain",
  "supports": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:eval_003_cost_and_deployment_evaluation",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dr_007_manage_deployment_cost_and_privacy_fit",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ok_004_deployment_fit_requires_cost_privacy_and_oracle_choices"
  ],
  "source_location": "Aligning the interests of newsvendors and forecasters through blockchain-based smart contracts and proper scoring rules.PDF · page 10 · Cost and deployment strategies",
  "quote_or_summary": "The paper estimates the cost of deploying and interacting with the Ethereum prototype and discusses volatility of public-chain transaction costs.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_021_permissioned_private_forecasts

```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_021_permissioned_private_forecasts",
  "supports": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_011_permissioned_channel_for_private_forecasts",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dr_007_manage_deployment_cost_and_privacy_fit",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:eval_003_cost_and_deployment_evaluation",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ok_004_deployment_fit_requires_cost_privacy_and_oracle_choices"
  ],
  "source_location": "Aligning the interests of newsvendors and forecasters through blockchain-based smart contracts and proper scoring rules.PDF · page 10 · Cost and deployment strategies",
  "quote_or_summary": "The paper states that when reported forecasts should not be public, a permissioned blockchain with channel support, such as Hyperledger Fabric, can provide data isolation and confidentiality.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_022_transaction_hash_dispute

```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_022_transaction_hash_dispute",
  "supports": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dr_006_preserve_auditability_of_forecast_contract_events",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_008_role_authentication_with_blockchain_addresses",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_009_dapp_interaction_interface",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:art_002_blockchain_based_forecasting_dapp"
  ],
  "source_location": "Aligning the interests of newsvendors and forecasters through blockchain-based smart contracts and proper scoring rules.PDF · page 17 · Appendix D: DApp Demonstration",
  "quote_or_summary": "The DApp returns block numbers and transaction hashes that can be used to verify successful transactions and support dispute resolution.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_023_appendix_example_scoring_rule

```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_023_appendix_example_scoring_rule",
  "supports": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:art_003_tailored_scoring_rule_model",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_001_tailored_proper_scoring_rule"
  ],
  "source_location": "Aligning the interests of newsvendors and forecasters through blockchain-based smart contracts and proper scoring rules.PDF · page 13 · Appendix B: Newsvendor example",
  "quote_or_summary": "Appendix B gives a numerical two-state demand example and constructs the corresponding tailored scoring rule used in the smart contract.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_024_smart_contract_code_settlement

```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_024_smart_contract_code_settlement",
  "supports": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_007_issue_payment_function",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:eval_004_prototype_demonstration"
  ],
  "source_location": "Aligning the interests of newsvendors and forecasters through blockchain-based smart contracts and proper scoring rules.PDF · page 15 · Appendix C: Sample smart contract",
  "quote_or_summary": "The sample smart contract includes transfer logic in which the expert receives the computed payment and the newsvendor receives the remaining contract balance.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_025_proposition_3_equilibrium

```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_025_proposition_3_equilibrium",
  "supports": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:eval_001_formal_proofs_and_game_theoretic_analysis",
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ok_002_blockchain_smart_contracts_mitigate_trust_issue"
  ],
  "source_location": "Aligning the interests of newsvendors and forecasters through blockchain-based smart contracts and proper scoring rules.PDF · page 6 · Proposition 3",
  "quote_or_summary": "Proposition 3 characterizes equilibria and implies that with the blockchain-based system, the expert exerts high effort in equilibrium whether trust is initially an issue or not.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_026_future_work_limitations

```json
{
  "id": "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_026_future_work_limitations",
  "supports": [
    "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021"
  ],
  "source_location": "Aligning the interests of newsvendors and forecasters through blockchain-based smart contracts and proper scoring rules.PDF · page 11 · Conclusion and future work",
  "quote_or_summary": "The authors state that the solution does not apply when the expert determines the realized outcome and note future work for richer outcome-determination and dispute settings.",
  "evidence_type": "paraphrase"
}
```
