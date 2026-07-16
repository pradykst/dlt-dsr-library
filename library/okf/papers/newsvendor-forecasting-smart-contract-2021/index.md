---
schema_version: "okf-dsr-v1"
type: "Paper"
paper_id: "NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021"
slug: "newsvendor-forecasting-smart-contract-2021"
title: "Aligning the interests of newsvendors and forecasters through blockchain-based smart contracts and proper scoring rules"
short_title: "Aligning the interests of newsvendors and forecasters through blockchain-based smart contracts and proper scoring rules"
authors: ["Arthur Carvalho","Majid Karimi"]
year: 2021
venue: "Decision Support Systems"
doi: "10.1016/j.dss.2021.113626"
doi_url: "https://doi.org/10.1016/j.dss.2021.113626"
source_url: null
source_pdf_filename: "Aligning the interests of newsvendors and forecasters through blockchain-based smart contracts and proper scoring rules.PDF"
domain_context: "forecast acquisition and supply-chain decision support"
abstract: null
research_problem: ["Forecast acquisition with incentive misalignment and payment-trust risk"]
research_objective: []
research_questions: ["How to align newsvendor and forecaster interests under forecast-based inventory decisions","How blockchain smart contracts can mitigate trust problems in outcome-contingent forecast payments"]
artifact_type: "Blockchain-based smart contract and DApp for forecast acquisition"
blockchain_dlt_role: null
methodology: "Design science research"
theoretical_foundations: ["Newsvendor inventory model","Proper scoring rules for truthful forecast elicitation","Trust and trustworthiness in forecast sharing and supply chains","Blockchain and smart contracts as distributed execution and immutable state infrastructure"]
evaluation_method: ["Formal proof and game-theoretic evaluation","Design-principle functionality evaluation","Cost and deployment-strategy evaluation","Ethereum smart contract and DApp prototype demonstration"]
key_contributions: ["Tailored proper scoring rules can align expert and newsvendor incentives","Blockchain smart contracts can mitigate outcome-contingent forecast-payment trust issues","Design blueprint for blockchain-based forecast acquisition contracts","Deployment fit depends on cost, privacy, and oracle design choices"]
design_knowledge_output: ["Tailored proper scoring rules can align expert and newsvendor incentives","Blockchain smart contracts can mitigate outcome-contingent forecast-payment trust issues","Design blueprint for blockchain-based forecast acquisition contracts","Deployment fit depends on cost, privacy, and oracle design choices"]
limitations: ["Outcome oracle dependence and manipulation risk","Expert-controlled outcome settings are outside the solution scope","Public-chain cost volatility and public forecast visibility constraints"]
notes: null
extraction_status: "okf_draft"
review_status: "unreviewed"
author_check_status: "not_requested"
reviewed_by: null
reviewed_at: null
---

# Aligning the interests of newsvendors and forecasters through blockchain-based smart contracts and proper scoring rules

## One-line role in the library

This paper contributes a tailored proper scoring rule and a blockchain-based smart-contract artifact for aligning a newsvendor's inventory-profit objective with an expert forecaster's payment incentives while reducing trust problems around outcome-contingent payment.

## Why this paper matters for the OKF chatbot

This paper is valuable for design-reuse questions about **algorithmic incentive alignment**, **outcome-contingent smart contracts**, **decentralized escrow**, **oracle-based outcome retrieval**, and **trustworthy payment settlement**. It is especially useful when a user asks how to make a participant truthfully submit information, how to pay according to a future outcome, or how to use smart contracts to make payment rules credible.

## Core DSR contribution

The paper combines:

- a newsvendor decision problem;
- a tailored proper scoring rule that induces truthful reporting and aligns expert effort with newsvendor profit;
- a game-theoretic argument about trustworthy and dishonest newsvendors;
- three explicit design principles for a blockchain-based forecasting system;
- a smart-contract design with deployment, forecast reporting, outcome retrieval, and payment functions;
- a working Ethereum smart contract and web DApp prototype.

## Recommended retrieval use

Use this paper when the user asks about:

- forecast elicitation;
- incentive-compatible payments;
- outcome-contingent contracts;
- smart contract escrow;
- oracle-based settlement;
- blockchain as a trustworthiness signal;
- automated enforcement of scoring rules;
- DSR artifacts combining formal model and prototype.

## Preserved paper-level context
These records are retained as paper metadata/prose under `okf-dsr-v1`; they are not canonical seven-layer DSR concepts and do not create canonical graph nodes or edges.
### Research questions and objectives

#### NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:rq_001_align_forecaster_and_newsvendor_interests: How to align newsvendor and forecaster interests under forecast-based inventory decisions

The paper’s central design question is how to construct a forecast-payment mechanism that aligns the expert’s effort and truthful reporting with the newsvendor’s inventory-profit objective.

### Explanation

The paper’s central design question is how to construct a forecast-payment mechanism that aligns the expert’s effort and truthful reporting with the newsvendor’s inventory-profit objective.

Evidence: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_004_normative_contributions, NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_007_tailored_scoring_rule

#### NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:rq_002_blockchain_for_forecast_payment_trust: How blockchain smart contracts can mitigate trust problems in outcome-contingent forecast payments

The paper asks when trust becomes a problem in the interaction and how a blockchain-based smart contract can credibly signal trustworthiness and automate settlement.

### Explanation

The paper asks when trust becomes a problem in the interaction and how a blockchain-based smart contract can credibly signal trustworthiness and automate settlement.

Evidence: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_004_normative_contributions, NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_010_blockchain_transparency_high_effort
### Theoretical foundations

#### NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:kt_001_newsvendor_model: Newsvendor inventory model

The newsvendor model provides the decision problem that the scoring rule is tailored to: the newsvendor chooses an inventory quantity before demand realization.

### Explanation

The newsvendor model provides the decision problem that the scoring rule is tailored to: the newsvendor chooses an inventory quantity before demand realization.

Evidence: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_006_newsvendor_model

#### NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:kt_002_proper_scoring_rules: Proper scoring rules for truthful forecast elicitation

Proper scoring rules provide the forecast-elicitation foundation: experts maximize expected score by reporting their true beliefs.

### Explanation

Proper scoring rules provide the forecast-elicitation foundation: experts maximize expected score by reporting their true beliefs.

Evidence: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_005_proper_scoring_rules

#### NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:kt_003_trust_and_trustworthiness: Trust and trustworthiness in forecast sharing and supply chains

The trust literature explains why a forecast provider may distrust a requester who observes the outcome and controls outcome-contingent payment.

### Explanation

The trust literature explains why a forecast provider may distrust a requester who observes the outcome and controls outcome-contingent payment.

Evidence: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_009_trust_in_forecast_sharing

#### NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:kt_004_blockchain_and_smart_contracts: Blockchain and smart contracts as distributed execution and immutable state infrastructure

Blockchain and smart contracts provide the technical substrate for decentralized escrow, immutable algorithms, transparent execution, and automated payment.

### Explanation

Blockchain and smart contracts provide the technical substrate for decentralized escrow, immutable algorithms, transparent execution, and automated payment.

Evidence: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_010_blockchain_transparency_high_effort, NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_011_design_principles_escrow_immutable
### Limitations

#### NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:lim_001_outcome_oracle_dependence: Outcome oracle dependence and manipulation risk

If the newsvendor is the only entity with access to the realized outcome and is not obliged to report it, the oracle can still be manipulated unless the design adds dispute resolution or decentralized outcome determination.

### Explanation

If the newsvendor is the only entity with access to the realized outcome and is not obliged to report it, the oracle can still be manipulated unless the design adds dispute resolution or decentralized outcome determination.

Evidence: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_019_oracles_and_disputes

#### NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:lim_002_expert_controlled_outcome_not_addressed: Expert-controlled outcome settings are outside the solution scope

The authors state that the solution does not apply when the expert determines or significantly influences the realized outcome.

### Explanation

The authors state that the solution does not apply when the expert determines or significantly influences the realized outcome.

Evidence: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_026_future_work_limitations

#### NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:lim_003_public_chain_cost_and_privacy_constraints: Public-chain cost volatility and public forecast visibility constraints

Using a public general-purpose blockchain such as Ethereum can create transaction-cost volatility and may be unsuitable when forecasts should remain confidential.

### Explanation

Using a public general-purpose blockchain such as Ethereum can create transaction-cost volatility and may be unsuitable when forecasts should remain confidential.

Evidence: NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_020_cost_public_blockchain, NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_021_permissioned_private_forecasts
### Contextual links excluded from the canonical graph

These source-preserved legacy links touch a research question/objective, theoretical foundation, limitation, or unresolved legacy record. They remain human-readable context only and are not canonical graph edges.

- `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:rel_001`: `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:prob_001_forecast_incentive_trust_problem` — **motivates** → `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:rq_001_align_forecaster_and_newsvendor_interests`; evidence `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_004_normative_contributions`; confidence high.
- `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:rel_002`: `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:prob_001_forecast_incentive_trust_problem` — **motivates** → `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:rq_002_blockchain_for_forecast_payment_trust`; evidence `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_004_normative_contributions`; confidence high.
- `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:rel_010`: `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:kt_001_newsvendor_model` — **derived from** → `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:prob_001_forecast_incentive_trust_problem`; evidence `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_006_newsvendor_model`; confidence high.
- `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:rel_011`: `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:kt_002_proper_scoring_rules` — **derived from** → `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:prob_001_forecast_incentive_trust_problem`; evidence `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_005_proper_scoring_rules`; confidence high.
- `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:rel_012`: `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:kt_003_trust_and_trustworthiness` — **derived from** → `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:prob_001_forecast_incentive_trust_problem`; evidence `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_009_trust_in_forecast_sharing`; confidence high.
- `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:rel_013`: `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:kt_004_blockchain_and_smart_contracts` — **derived from** → `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:prob_001_forecast_incentive_trust_problem`; evidence `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_010_blockchain_transparency_high_effort`; confidence high.
- `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:rel_058`: `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:lim_001_outcome_oracle_dependence` — **contributes to** → `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ok_004_deployment_fit_requires_cost_privacy_and_oracle_choices`; evidence `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_019_oracles_and_disputes`; confidence medium-high.
- `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:rel_059`: `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:lim_002_expert_controlled_outcome_not_addressed` — **contributes to** → `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ok_004_deployment_fit_requires_cost_privacy_and_oracle_choices`; evidence `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_026_future_work_limitations`; confidence medium-high.
- `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:rel_060`: `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:lim_003_public_chain_cost_and_privacy_constraints` — **contributes to** → `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ok_004_deployment_fit_requires_cost_privacy_and_oracle_choices`; evidence `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021:ev_020_cost_public_blockchain`; confidence medium-high.
