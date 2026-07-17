---
type: paper
title: "Aligning the interests of newsvendors and forecasters through blockchain-based smart contracts and proper scoring rules"
description: "The paper proposes a proper scoring rule, tailored to the newsvendor's decision problem, that rewards a forecasting expert for higher effort, and shows that coding the rule as a blockchain-based smart contract lets the newsvendor signal trustworthiness while inducing the expert to exert more effort."
resource: "https://doi.org/10.1016/j.dss.2021.113626"
authors: "Arthur Carvalho, Majid Karimi"
year: 2021
venue: "Decision Support Systems 151 (2021) 113626"
methodology: "Design science research; formal analysis; Ethereum prototype (smart contract + DApp)."
dsr_grid: true
dsr_solution_space: "Instantiation (Ethereum prototype and DApp) plus design principles (nascent design theory)."
tags:
  - aligning-newsvendors-scoring-rules
  - supply-chain
  - forecasting
  - smart-contracts
  - trust
  - design-science-research
  - blockchain
timestamp: '2026-07-16T00:00:00+00:00'
---

# Aligning the interests of newsvendors and forecasters through blockchain-based smart contracts and proper scoring rules

**Authors:** Arthur Carvalho, Majid Karimi  
**Venue:** Decision Support Systems 151 (2021) 113626  
**Link:** https://doi.org/10.1016/j.dss.2021.113626

## Summary

The paper proposes a proper scoring rule, tailored to the newsvendor's decision problem, that rewards a forecasting expert for higher effort, and shows that coding the rule as a blockchain-based smart contract lets the newsvendor signal trustworthiness while inducing the expert to exert more effort. It concludes with a design and a fully functional Ethereum prototype.

## Artifact

Blockchain-based smart contract implementing a tailored proper scoring rule for demand-forecast elicitation.

## Methodology

Design science research; formal analysis; Ethereum prototype (smart contract + DApp).

## DSR grid

The six core dimensions of this DSR project, following the [DSR grid](../about-the-dsr-grid.md) (vom Brocke & Maedche, 2019):

* **Problem description.** In a newsvendor setting, the interests of the newsvendor and the forecasting expert are misaligned, and trust issues arise because the expert's ex-post payment depends on forecast accuracy tied to a future outcome that may be known only to the newsvendor.
* **Input knowledge.** Newsvendor/inventory theory and proper scoring rules; mechanism and incentive design; blockchain and smart contracts as prescriptive (design) knowledge.
* **Research process.** Design science research: formal derivation of a tailored proper scoring rule, followed by design and implementation of an Ethereum smart-contract prototype and a decentralized application (DApp), with analytical demonstration.
* **Key concepts.** Blockchain, forecasting, newsvendor, proper scoring rules, smart contracts, trust.
* **Solution description.** A tailored proper scoring rule coded as a blockchain-based smart contract, with escrow/payment governed in a decentralized, party-independent manner. Solution-space representation: Instantiation (Ethereum prototype and DApp) plus design principles (nascent design theory).
* **Output knowledge.** Two design principles - decentralized, party-independent control of the escrow/payment, and enforceable, immutable algorithmic contracts - demonstrated with a working prototype.

The *output knowledge* of this project is captured as the atomic design-knowledge concepts listed below.

## Design knowledge

* [Design principle DP1: Decentralized, party-independent control of the escrow/payment](../design-knowledge/aligning-newsvendors-scoring-rules-dp1.md) - The contract and its escrow/payment mechanism should be governed in a decentralized manner so that it is controlled by neither the newsvendor nor the expert;
* [Design principle DP2: Enforceable and immutable algorithmic contracts](../design-knowledge/aligning-newsvendors-scoring-rules-dp2.md) - Contracts between the newsvendor and the expert should be defined as enforceable and immutable algorithms;

# Citations
[1] Arthur Carvalho, Majid Karimi. Aligning the interests of newsvendors and forecasters through blockchain-based smart contracts and proper scoring rules. Decision Support Systems 151 (2021) 113626. https://doi.org/10.1016/j.dss.2021.113626
[2] Source document: Aligning the interests of newsvendors and forecasters through blockchain-based smart contracts and proper scoring rules.pdf
