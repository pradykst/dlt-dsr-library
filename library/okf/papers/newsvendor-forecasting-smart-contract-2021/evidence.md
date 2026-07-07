---
type: EvidenceCollection
paper_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021
title: "Evidence for newsvendor-forecaster blockchain smart contract paper"
review_status: reviewed
confidence: high
source_pdf: "Aligning the interests of newsvendors and forecasters through blockchain-based smart contracts and proper scoring rules.PDF"
---

# Evidence Items

> Evidence is paraphrased rather than copied verbatim. PDF pages refer to the uploaded PDF page numbers.


---

## Evidence: ev_001_abstract_problem

```yaml
evidence_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_001_abstract_problem
paper_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:prob_001_forecast_incentive_trust_problem
pdf_page: 1
section: Abstract
quote: null
paraphrase: The abstract states that the paper considers a newsvendor who elicits
  a demand forecast from an expert, proposes a tailored proper scoring rule, and shows
  that coding it as a blockchain smart contract can signal trustworthiness and induce
  effort.
confidence: high
```


---

## Evidence: ev_002_incentive_trust_setting

```yaml
evidence_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_002_incentive_trust_setting
paper_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:prob_001_forecast_incentive_trust_problem
pdf_page: 1
section: Introduction
quote: null
paraphrase: The introduction explains that organizations requesting forecasts care
  about inventory and profit, whereas forecast providers may care about maximizing
  payment; trust issues arise when payments depend on a future outcome.
confidence: high
```


---

## Evidence: ev_003_two_major_challenges

```yaml
evidence_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_003_two_major_challenges
paper_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:prob_001_forecast_incentive_trust_problem
pdf_page: 2
section: Selling forecasts to a newsvendor
quote: null
paraphrase: 'The paper identifies two major challenges: expert effort may not match
  newsvendor profit, and the newsvendor may be the only party observing the realized
  outcome, creating trust and payment-manipulation concerns.'
confidence: high
```


---

## Evidence: ev_004_normative_contributions

```yaml
evidence_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_004_normative_contributions
paper_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:rq_001_align_forecaster_and_newsvendor_interests
pdf_page: 2
section: Selling forecasts to a newsvendor
quote: null
paraphrase: "The paper states three contributions: a tailored scoring rule aligning\
  \ expert effort and newsvendor profit, a formal explanation of blockchain\u2019\
  s trust-mitigation role, and a prototype/design for the smart contract."
confidence: high
```


---

## Evidence: ev_005_proper_scoring_rules

```yaml
evidence_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_005_proper_scoring_rules
paper_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:kt_002_proper_scoring_rules
pdf_page: 2
section: Proper scoring rules
quote: null
paraphrase: The literature review defines proper scoring rules as mechanisms that
  promote honest belief reporting and score forecast accuracy after outcome realization.
confidence: high
```


---

## Evidence: ev_006_newsvendor_model

```yaml
evidence_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_006_newsvendor_model
paper_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:kt_001_newsvendor_model
pdf_page: 4
section: Newsvendor model
quote: null
paraphrase: The model defines a newsvendor who relies on an expert forecast, chooses
  an inventory order quantity, and receives profit according to demand, underage,
  overage, revenue, and cost parameters.
confidence: high
```


---

## Evidence: ev_007_tailored_scoring_rule

```yaml
evidence_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_007_tailored_scoring_rule
paper_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_001_tailored_proper_scoring_rule
pdf_page: 5
section: Incentive alignment
quote: null
paraphrase: Proposition 1 defines the tailored proper scoring rule as a positive affine
  function of the newsvendor profit under the forecast-induced order quantity.
confidence: high
```


---

## Evidence: ev_008_corollary_high_effort_profit

```yaml
evidence_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_008_corollary_high_effort_profit
paper_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ok_001_tailored_scoring_aligns_incentives
pdf_page: 5
section: Incentive alignment
quote: null
paraphrase: "Corollary 1 states that, under the tailored scoring rule, if the expert\
  \ exerts higher effort, the newsvendor\u2019s expected profit increases."
confidence: high
```


---

## Evidence: ev_009_trust_in_forecast_sharing

```yaml
evidence_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_009_trust_in_forecast_sharing
paper_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:kt_003_trust_and_trustworthiness
pdf_page: 3
section: Trust and trustworthiness
quote: null
paraphrase: The paper reviews trust and trustworthiness in forecast sharing and explains
  that a newsvendor observing the outcome is expected to behave benevolently when
  paying the expert.
confidence: high
```


---

## Evidence: ev_010_blockchain_transparency_high_effort

```yaml
evidence_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_010_blockchain_transparency_high_effort
paper_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ok_002_blockchain_smart_contracts_mitigate_trust_issue
pdf_page: 6
section: Forecast acquisition in the presence of a blockchain-based system
quote: null
paraphrase: The paper argues that the smart contract transparently defines the scoring
  rule, determines the outcome source, and automates payment settlement, forcing even
  a dishonest newsvendor to pay in full.
confidence: high
```


---

## Evidence: ev_011_design_principles_escrow_immutable

```yaml
evidence_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_011_design_principles_escrow_immutable
paper_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dp_001_decentralized_escrow_for_payments
pdf_page: 7
section: Design principles
quote: null
paraphrase: The paper explicitly defines Design Principle 1 as escrow accounts controlled
  by no individual entity and Design Principle 2 as contracts defined as enforceable
  and immutable algorithms.
confidence: high
```


---

## Evidence: ev_012_design_principle_oracle

```yaml
evidence_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_012_design_principle_oracle
paper_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dp_003_unambiguous_outcome_oracle
pdf_page: 7
section: Design principles
quote: null
paraphrase: The paper explicitly defines Design Principle 3 as requiring the source
  of the realized outcome to be unambiguous, because the oracle determines the payment-relevant
  outcome.
confidence: high
```


---

## Evidence: ev_013_smart_contract_attributes

```yaml
evidence_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_013_smart_contract_attributes
paper_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:art_001_blockchain_forecasting_smart_contract
pdf_page: 7
section: Design and development
quote: null
paraphrase: The smart contract publicly defines participant addresses, maximum expert
  payment, a forecast-submission deadline, and the date the realized outcome becomes
  available.
confidence: high
```


---

## Evidence: ev_014_contract_deployment_validation

```yaml
evidence_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_014_contract_deployment_validation
paper_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_004_contract_deployment_validation
pdf_page: 8
section: 'Requirements 1: Contract Deployment'
quote: null
paraphrase: The deployment requirements specify that deposited funds must cover the
  maximum payment, the creator must match the newsvendor address, and deployment must
  occur before forecast and outcome deadlines.
confidence: high
```


---

## Evidence: ev_015_report_forecast_validation

```yaml
evidence_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_015_report_forecast_validation
paper_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_005_report_forecast_function
pdf_page: 8
section: 'Requirements 2: reportForecast'
quote: null
paraphrase: The reportForecast requirements validate that probabilities sum to one,
  remain between zero and one, are submitted by the expert address, and arrive before
  the forecast deadline.
confidence: high
```


---

## Evidence: ev_016_retrieve_outcome_validation

```yaml
evidence_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_016_retrieve_outcome_validation
paper_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_006_retrieve_realized_outcome_function
pdf_page: 8
section: 'Requirements 3: retrieveRealizedOutcome'
quote: null
paraphrase: The retrieveRealizedOutcome function can be called by the newsvendor or
  expert after the outcome availability date and stores the realized outcome in the
  blockchain.
confidence: high
```


---

## Evidence: ev_017_payment_validation

```yaml
evidence_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_017_payment_validation
paper_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_007_issue_payment_function
pdf_page: 9
section: 'Requirements 4: issuePayment'
quote: null
paraphrase: The issuePayment function can be called by either party after outcome
  availability and pays the expert according to the scoring rule while returning surplus
  to the newsvendor.
confidence: high
```


---

## Evidence: ev_018_dapp_demonstration

```yaml
evidence_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_018_dapp_demonstration
paper_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:art_002_blockchain_based_forecasting_dapp
pdf_page: 15
section: 'Appendix D: DApp Demonstration'
quote: null
paraphrase: The DApp supports reading contract information, reporting forecasts, retrieving
  outcomes, issuing payments, and retrieving forecasts, demonstrating how users interact
  with the smart contract.
confidence: high
```


---

## Evidence: ev_019_oracles_and_disputes

```yaml
evidence_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_019_oracles_and_disputes
paper_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:lim_001_outcome_oracle_dependence
pdf_page: 9
section: Oracles and realized outcomes
quote: null
paraphrase: The evaluation discusses centralized oracles, decentralized oracles such
  as Chainlink, and an independent third-party dispute resolver when the outcome is
  not public.
confidence: high
```


---

## Evidence: ev_020_cost_public_blockchain

```yaml
evidence_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_020_cost_public_blockchain
paper_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:eval_003_cost_and_deployment_evaluation
pdf_page: 10
section: Cost and deployment strategies
quote: null
paraphrase: The paper estimates the cost of deploying and interacting with the Ethereum
  prototype and discusses volatility of public-chain transaction costs.
confidence: high
```


---

## Evidence: ev_021_permissioned_private_forecasts

```yaml
evidence_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_021_permissioned_private_forecasts
paper_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_011_permissioned_channel_for_private_forecasts
pdf_page: 10
section: Cost and deployment strategies
quote: null
paraphrase: The paper states that when reported forecasts should not be public, a
  permissioned blockchain with channel support, such as Hyperledger Fabric, can provide
  data isolation and confidentiality.
confidence: high
```


---

## Evidence: ev_022_transaction_hash_dispute

```yaml
evidence_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_022_transaction_hash_dispute
paper_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:dr_006_preserve_auditability_of_forecast_contract_events
pdf_page: 17
section: 'Appendix D: DApp Demonstration'
quote: null
paraphrase: The DApp returns block numbers and transaction hashes that can be used
  to verify successful transactions and support dispute resolution.
confidence: high
```


---

## Evidence: ev_023_appendix_example_scoring_rule

```yaml
evidence_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_023_appendix_example_scoring_rule
paper_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:art_003_tailored_scoring_rule_model
pdf_page: 13
section: 'Appendix B: Newsvendor example'
quote: null
paraphrase: Appendix B gives a numerical two-state demand example and constructs the
  corresponding tailored scoring rule used in the smart contract.
confidence: high
```


---

## Evidence: ev_024_smart_contract_code_settlement

```yaml
evidence_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_024_smart_contract_code_settlement
paper_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:df_007_issue_payment_function
pdf_page: 15
section: 'Appendix C: Sample smart contract'
quote: null
paraphrase: The sample smart contract includes transfer logic in which the expert
  receives the computed payment and the newsvendor receives the remaining contract
  balance.
confidence: high
```


---

## Evidence: ev_025_proposition_3_equilibrium

```yaml
evidence_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_025_proposition_3_equilibrium
paper_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:eval_001_formal_proofs_and_game_theoretic_analysis
pdf_page: 6
section: Proposition 3
quote: null
paraphrase: Proposition 3 characterizes equilibria and implies that with the blockchain-based
  system, the expert exerts high effort in equilibrium whether trust is initially
  an issue or not.
confidence: high
```


---

## Evidence: ev_026_future_work_limitations

```yaml
evidence_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_026_future_work_limitations
paper_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021
concept_id: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:lim_002_expert_controlled_outcome_not_addressed
pdf_page: 11
section: Conclusion and future work
quote: null
paraphrase: The authors state that the solution does not apply when the expert determines
  the realized outcome and note future work for richer outcome-determination and dispute
  settings.
confidence: high
```
