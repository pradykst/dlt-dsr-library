---
type: paper
title: "Requirements and Design Principles for Blockchain-enabled Matchmaking-Marketplaces in Additive Manufacturing"
description: "Synthesizing literature, practice and expert interviews, the paper explores 27 mandatory requirements, six optional requirements and formulates 12 design principles for blockchain-enabled B2B matchmaking marketplaces in additive manufacturing, spanning identity, data security, traceability, supply/demand information, interfaces, reputation, matchmaking, agreements, settlement and governance."
resource: "https://hdl.handle.net/10125/103293"
authors: "Tobias Koelbel, Marcel Linkenheil"
year: 2023
venue: "HICSS 56 (2023)"
methodology: "Design science research; systematic literature review, practice analysis, and expert interviews (302 codes)."
dsr_grid: true
dsr_solution_space: "Model / design theory (requirements and design principles); no full instantiation."
tags:
  - matchmaking-additive-manufacturing
  - marketplace
  - additive-manufacturing
  - b2b
  - matchmaking
  - design-science-research
  - blockchain
timestamp: '2026-07-16T00:00:00+00:00'
---

# Requirements and Design Principles for Blockchain-enabled Matchmaking-Marketplaces in Additive Manufacturing

**Authors:** Tobias Koelbel, Marcel Linkenheil  
**Venue:** HICSS 56 (2023)  
**Link:** https://hdl.handle.net/10125/103293

## Summary

Synthesizing literature, practice and expert interviews, the paper explores 27 mandatory requirements, six optional requirements and formulates 12 design principles for blockchain-enabled B2B matchmaking marketplaces in additive manufacturing, spanning identity, data security, traceability, supply/demand information, interfaces, reputation, matchmaking, agreements, settlement and governance.

## Artifact

Requirements and design principles for blockchain-enabled matchmaking marketplaces (BEMs) in additive manufacturing.

## Methodology

Design science research; systematic literature review, practice analysis, and expert interviews (302 codes).

## DSR grid

The six core dimensions of this DSR project, following the [DSR grid](../about-the-dsr-grid.md) (vom Brocke & Maedche, 2019):

* **Problem description.** Blockchain-enabled B2B matchmaking marketplaces - promising in additive manufacturing - have limited practical impact and scarce academic design guidelines.
* **Input knowledge.** Veit's marketplace interaction phases; grounded-theory coding (Corbin & Strauss); the Chandra et al. principle-formulation structure; additive-manufacturing and marketplace literature.
* **Research process.** Design science research combining a systematic literature review, analysis of practical projects, and expert interviews (302 codes) to formulate requirements and principles.
* **Key concepts.** B2B, marketplace, blockchain, additive manufacturing, design science research.
* **Solution description.** Requirements and design principles for blockchain-enabled B2B matchmaking marketplaces in additive manufacturing. Solution-space representation: Model / design theory (requirements and design principles); no full instantiation.
* **Output knowledge.** 27 mandatory requirements, six optional requirements and twelve design principles.

The *output knowledge* of this project is captured as the atomic design-knowledge concepts listed below.

## Design knowledge

* [Meta-requirement MR1: ID Attributes](../design-knowledge/matchmaking-additive-manufacturing-mr1.md) - BEM agents require digital identities (IDs), including company IDs, 3D printer machine IDs, and product IDs, to interact with each other and be identifiable.
* [Meta-requirement MR2: ID Features](../design-knowledge/matchmaking-additive-manufacturing-mr2.md) - BEM identities require features to describe actors: the ability to map affiliation and hierarchy constructs, distinctive levels of stakeholder anonymity, and rule-based access for independent third parties to trace relationships.
* [Meta-requirement MR3: Data Security & Integrity](../design-knowledge/matchmaking-additive-manufacturing-mr3.md) - Data exchange in BEMs requires user sovereignty and tamper-free exchange, storing only the necessary minimum of sensitive business data on-chain as a persistent trust anchor.
* [Meta-requirement MR4: Data Traceability](../design-knowledge/matchmaking-additive-manufacturing-mr4.md) - BEMs require ex-post transparency: production parameters must be documented persistently and be accessible to authorized actors for quality assurance.
* [Meta-requirement MR5: Supply Side Information](../design-knowledge/matchmaking-additive-manufacturing-mr5.md) - The supply side must provide information about production and material parameters, certificates, and their capability, capacity and bids.
* [Meta-requirement MR6: Demand Side Information](../design-knowledge/matchmaking-additive-manufacturing-mr6.md) - The demand side must specify its request via product and production specification and an indication of its willingness to pay.
* [Meta-requirement MR7: User Interface](../design-knowledge/matchmaking-additive-manufacturing-mr7.md) - BEMs require customizable filtering options and both a machine-to-machine (M2M) and a human-machine (HMI) interface.
* [Meta-requirement MR8: Reputation System](../design-knowledge/matchmaking-additive-manufacturing-mr8.md) - BEMs require a reputation system covering company metrics, printer ratings, and individual preference prioritization.
* [Meta-requirement MR9: Supply & Demand Matchmaking](../design-knowledge/matchmaking-additive-manufacturing-mr9.md) - Supply and demand matchmaking must preserve process anonymity, not disclosing sensitive data until the matchmaking process is complete, and be semi-automatic.
* [Meta-requirement MR10: Transaction Agreement](../design-knowledge/matchmaking-additive-manufacturing-mr10.md) - BEMs require hybrid pricing and negotiation mechanisms to reach a transaction agreement in the matchmaking process.
* [Meta-requirement MR11: Terms & Conditions](../design-knowledge/matchmaking-additive-manufacturing-mr11.md) - BEMs must ensure automated execution of terms and conditions via smart contracts and support dual incentives and payments, using both cryptographic tokens and fiat currencies.
* [Meta-requirement MR12: Governance](../design-knowledge/matchmaking-additive-manufacturing-mr12.md) - BEM governance must be shaped openly and transparently, balancing cooperation and competition among stakeholders, and ensuring interoperability with other marketplaces.
* [Design principle DP1: Sovereign, pseudonymous IDs](../design-knowledge/matchmaking-additive-manufacturing-dp1.md) - Design BEMs that allow each actor to manage their sovereign and pseudonymous IDs.
* [Design principle DP2: Sovereign credential wallets](../design-knowledge/matchmaking-additive-manufacturing-dp2.md) - Design BEMs that support sovereign wallets that may hold certificates and other ID credentials to qualitatively and quantitatively describe actors.
* [Design principle DP3: Minimal on-chain sensitive data](../design-knowledge/matchmaking-additive-manufacturing-dp3.md) - Design BEMs to prevent unauthorized access to sensitive business data and store only a necessary minimum as a persistent blockchain trust anchor.
* [Design principle DP4: Persistent manufacturing-data logging](../design-knowledge/matchmaking-additive-manufacturing-dp4.md) - Design BEMs that require manufacturers to persistently log manufacturing data for ex-post transparency and quality assurance.
* [Design principle DP5: Supplier service-offering information](../design-knowledge/matchmaking-additive-manufacturing-dp5.md) - Design BEMs that require manufacturers to provide information about their service offerings and specify their individual preferences.
* [Design principle DP6: Consumer service-request specification](../design-knowledge/matchmaking-additive-manufacturing-dp6.md) - Design BEMs that enable consumers to specify their service requests via customizable functionalities and filter options.
* [Design principle DP7: Ambidextrous interfaces with data screening](../design-knowledge/matchmaking-additive-manufacturing-dp7.md) - Design BEMs with ambidextrous user interfaces (manual HMI and automated M2M) and functionality to screen marketplace data.
* [Design principle DP8: Preference-filterable reputation system](../design-knowledge/matchmaking-additive-manufacturing-dp8.md) - Design BEMs with a reputation system where consumers can filter different criteria according to their individual preferences.
* [Design principle DP9: Demand-driven semi-automated matchmaking](../design-knowledge/matchmaking-additive-manufacturing-dp9.md) - Design BEMs as demand-driven marketplaces with semi-automated matchmaking functions where consumers receive suggestions for matching producers and select the final producer based on their preferences without disclosing sensitive data.
* [Design principle DP10: Hybrid pricing and negotiation](../design-knowledge/matchmaking-additive-manufacturing-dp10.md) - Design agreements in BEMs as hybrid systems that support individual pricing and negotiation.
* [Design principle DP11: Automated contract execution with hybrid payments](../design-knowledge/matchmaking-additive-manufacturing-dp11.md) - Design BEMs that allow for automated contract execution with cryptographic token incentives and payment options using fiat currencies.
* [Design principle DP12: Interoperability and consortial standards](../design-knowledge/matchmaking-additive-manufacturing-dp12.md) - Design BEMs to support interoperability and free market access to those who follow consortially defined standards and rules.

# Citations
[1] Tobias Koelbel, Marcel Linkenheil. Requirements and Design Principles for Blockchain-enabled Matchmaking-Marketplaces in Additive Manufacturing. HICSS 56 (2023). https://hdl.handle.net/10125/103293
[2] Source document: Requirements and Design Principles for Blockchain-enabled matchmaking marketplaces.pdf
[3] Source evidence: MR1-MR12 tabled in Table 3 (article p. 5358, "Synthesizing Description of Design Rationales"), with each MR row explicitly mapped 1:1 to its corresponding DP in the same table row; DP1-DP12 individually stated in Section 4 (article pp. 5356-5360). The paper also enumerates 27 numbered mandatory sub-requirements (e.g., MR1.1-MR1.3) and 6 optional requirements (OR1-OR6) inline in the body text; these finer-grained items are not separately tabled and are represented here at Table 3's own authoritative row granularity (MR1-MR12), consistent with this session's practice of using an authoritative table's own granularity when a paper provides one.
