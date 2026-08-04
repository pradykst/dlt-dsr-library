---
type: paper
title: "Overcoming the Data Transparency Trade-Off: Designing a Blockchain-Based Delivery Invoice System for the Construction Industry"
description: "The paper designs a blockchain-based delivery invoice system for construction that navigates the data-transparency trade-off of coopetition, structured around three design objectives (secure data exchange, collaboration, and competition) and derives three design principles from expert evaluation."
resource: "https://aisel.aisnet.org/wi2023/78"
authors: "Jonathan Lautenschlager, Jan Stramm, Tobias Guggenberger, Artur Roesch, Andre Schweizer"
year: 2023
venue: "Wirtschaftsinformatik 2023 Proceedings"
methodology: "Design science research; expert evaluation; addressing the coopetition data-transparency trade-off."
dsr_grid: true
dsr_solution_space: "Instantiation (prototype) plus three design objectives and three design principles."
tags:
  - delivery-invoice-transparency
  - construction
  - supply-chain
  - coopetition
  - invoicing
  - design-science-research
  - blockchain
timestamp: '2026-08-05T00:00:00+00:00'
---

# Overcoming the Data Transparency Trade-Off: Designing a Blockchain-Based Delivery Invoice System for the Construction Industry

**Authors:** Jonathan Lautenschlager, Jan Stramm, Tobias Guggenberger, Artur Roesch, Andre Schweizer  
**Venue:** Wirtschaftsinformatik 2023 Proceedings  
**Link:** https://aisel.aisnet.org/wi2023/78

## Summary

The paper designs a blockchain-based delivery invoice system for construction that navigates the data-transparency trade-off of coopetition, structured around three design objectives (secure data exchange, collaboration, and competition) and derives three design principles from expert evaluation.

## Artifact

A blockchain-based delivery invoice system (Hyperledger Fabric) for the construction industry.

## Methodology

Design science research; expert evaluation; addressing the coopetition data-transparency trade-off.

## DSR grid

The six core dimensions of this DSR project, following the [DSR grid](../about-the-dsr-grid.md) (vom Brocke & Maedche, 2019):

* **Problem description.** Blockchain-based delivery-invoice exchange in construction faces a data-transparency trade-off in coopetition: collaboration benefits versus protecting competitively sensitive data.
* **Input knowledge.** Coopetition; the data-protection goals of confidentiality, integrity, availability and authenticity; Hyperledger Fabric capabilities; construction and supply-chain-management literature.
* **Research process.** Design science research: literature-based derivation of design objectives during data collection, followed by nine expert ex-post interviews from which three design principles were derived.
* **Key concepts.** Blockchain technology, data transparency, delivery invoices, construction industry, supply chain management.
* **Solution description.** A Hyperledger Fabric delivery-invoice system that balances secure data exchange, collaboration and competition. Solution-space representation: Instantiation (prototype) plus three design objectives and three design principles.
* **Output knowledge.** Three design objectives (secure data exchange, collaboration, competition) and three design principles derived from expert evaluation.

The *output knowledge* of this project is captured as the atomic design-knowledge concepts listed below.

## Design knowledge

* [Design objective DO1: Secure data exchange](../design-knowledge/delivery-invoice-transparency-do1.md) - Ensure fundamentally secure data exchange within a decentralized infrastructure, focusing on the data-protection goals of confidentiality, integrity, availability and authenticity for delivery invoices.
* [Design objective DO2: Collaboration](../design-knowledge/delivery-invoice-transparency-do2.md) - Support the collaboration aspect of coopetition, using network effects (e.g., Hyperledger Fabric) to enhance the overall construction planning process between participants.
* [Design objective DO3: Competition](../design-knowledge/delivery-invoice-transparency-do3.md) - Account for the competition aspect of coopetition, using decentralized networks and access controls so that security, trust and transparency are strengthened without exposing competitively sensitive information.
* [Design principle DP1: Implement a decentralized solution when network effects outweigh complexity](../design-knowledge/delivery-invoice-transparency-dp1.md) - Implement a decentralized solution when the advantages of network effects in a coopetitive market outweigh the challenges of implementing such a complex solution.
* [Design principle DP2: Implement private data collections and private channels](../design-knowledge/delivery-invoice-transparency-dp2.md) - Implement private data collections and private channels to safeguard inter-organizational data exchange processes from being disclosed to unauthorized third parties.
* [Design principle DP3: Augment private data collections with additional privacy-preserving technologies](../design-knowledge/delivery-invoice-transparency-dp3.md) - To ensure complete confidentiality of data, it is necessary to augment private data collections and channels with additional privacy-preserving technologies.

# Citations
[1] Jonathan Lautenschlager, Jan Stramm, Tobias Guggenberger, Artur Roesch, Andre Schweizer. Overcoming the Data Transparency Trade-Off: Designing a Blockchain-Based Delivery Invoice System for the Construction Industry. Wirtschaftsinformatik 2023 Proceedings. https://aisel.aisnet.org/wi2023/78
[2] Source document: Overcoming the Data Transparency Trade-Off - Designing a Blockchain-Based Delivery Invoice System.pdf
[3] Source evidence: Section 4.1 ("Design objectives"), article p. 6-7, for DO1-DO3; Section 5 for DP1-DP3 (each with explicit "(DOx)" parenthetical citations back to the objectives), article p. 9-12.
