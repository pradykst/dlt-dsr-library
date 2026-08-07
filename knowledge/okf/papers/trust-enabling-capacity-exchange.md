---
type: paper
title: "Designing trust-enabling blockchain systems for the inter-organizational exchange of capacity"
description: "The paper derives and validates six design principles for establishing inter-organizational trust in capacity-exchange platforms - signaling of tender information, signaling of identity, authority and fairness, incentive mechanisms, screening functionality and reputation mechanism - instantiates them in an artifact and tests their effect on perceived trust."
resource: "https://doi.org/10.1016/j.dss.2024.114182"
authors: "Nick Grosse, Frederik Moeller, Thorsten Schoormann, Michael Henke"
year: 2024
venue: "Decision Support Systems 179 (2024) 114182"
methodology: "Design science research; two design iterations; meta-requirements from literature and interviews; experimental evaluation of perceived trust."
dsr_grid: true
dsr_solution_space: "Instantiation (prototype) plus experimentally validated design principles (design theory)."
tags:
  - trust-enabling-capacity-exchange
  - interorganizational
  - capacity-exchange
  - trust
  - platforms
  - design-science-research
  - blockchain
timestamp: '2026-07-16T00:00:00+00:00'
---

# Designing trust-enabling blockchain systems for the inter-organizational exchange of capacity

**Authors:** Nick Grosse, Frederik Moeller, Thorsten Schoormann, Michael Henke  
**Venue:** Decision Support Systems 179 (2024) 114182  
**Link:** https://doi.org/10.1016/j.dss.2024.114182

## Summary

The paper derives and validates six design principles for establishing inter-organizational trust in capacity-exchange platforms - signaling of tender information, signaling of identity, authority and fairness, incentive mechanisms, screening functionality and reputation mechanism - instantiates them in an artifact and tests their effect on perceived trust.

## Artifact

A blockchain-based capacity-exchange platform instantiating trust-enabling design principles.

## Methodology

Design science research; two design iterations; meta-requirements from literature and interviews; experimental evaluation of perceived trust.

## DSR grid

The six core dimensions of this DSR project, following the [DSR grid](../about-the-dsr-grid.md) (vom Brocke & Maedche, 2019):

* **Problem description.** Virtual capacity-exchange platforms are hindered by behavioral uncertainty and a lack of inter-organizational trust among anonymous participants.
* **Input knowledge.** Transaction cost economics and agency theory as kernel theories; trust theory (Riegelsberger et al.); mechanisms of signaling, screening, reputation and authority; blockchain.
* **Research process.** Design science research over two design iterations: meta-requirements from literature and interviews, instantiation in an artifact, and experimental evaluation of perceived trust.
* **Key concepts.** Blockchain, trust, capacity exchange, design principle, experiment, design science.
* **Solution description.** A blockchain-based capacity-exchange platform instantiating six trust-enabling design principles. Solution-space representation: Instantiation (prototype) plus experimentally validated design principles (design theory).
* **Output knowledge.** 19 meta-requirements (Fig. 3), six design principles for establishing inter-organizational trust (tender signaling, identity signaling, authority and fairness, incentives, screening, reputation), and 14 design features realizing them in a Solidity-based instantiation (Fig. 6).

The *output knowledge* of this project is captured as the atomic design-knowledge concepts listed below.

## Design knowledge

### Meta-requirements (Fig. 3)

* [MR-S1: Creation and management of tender](../design-knowledge/trust-enabling-capacity-exchange-mr-s1.md) - Specification dimension.
* [MR-S2: Cross-domain management](../design-knowledge/trust-enabling-capacity-exchange-mr-s2.md) - Specification dimension.
* [MR-I1: Search functions](../design-knowledge/trust-enabling-capacity-exchange-mr-i1.md) - Information dimension.
* [MR-I2: Identity management and verification](../design-knowledge/trust-enabling-capacity-exchange-mr-i2.md) - Information dimension.
* [MR-I3: Services to support the initiation process](../design-knowledge/trust-enabling-capacity-exchange-mr-i3.md) - Information dimension.
* [MR-N1: Possibility for intermediate connection](../design-knowledge/trust-enabling-capacity-exchange-mr-n1.md) - Negotiation dimension.
* [MR-N2: Heterogeneity of contracts](../design-knowledge/trust-enabling-capacity-exchange-mr-n2.md) - Negotiation dimension.
* [MR-N3: Function for final award of the contract](../design-knowledge/trust-enabling-capacity-exchange-mr-n3.md) - Negotiation dimension.
* [MR-F1: Conditions for fulfilling the payment](../design-knowledge/trust-enabling-capacity-exchange-mr-f1.md) - Fulfilment dimension.
* [MR-F2: Compliance with legal framework conditions](../design-knowledge/trust-enabling-capacity-exchange-mr-f2.md) - Fulfilment dimension.
* [MR-A1: Serious rating](../design-knowledge/trust-enabling-capacity-exchange-mr-a1.md) - After-Sales dimension.
* [MR-A2: Provision of decision relevant KPIs](../design-knowledge/trust-enabling-capacity-exchange-mr-a2.md) - After-Sales dimension.
* [MR-O1: Transparency and completeness of collected data relevant to transaction](../design-knowledge/trust-enabling-capacity-exchange-mr-o1.md) - Overlapping category.
* [MR-O2: Decentralization and Simultaneity](../design-knowledge/trust-enabling-capacity-exchange-mr-o2.md) - Overlapping category.
* [MR-O3: Communication services](../design-knowledge/trust-enabling-capacity-exchange-mr-o3.md) - Overlapping category.
* [MR-O4: Equality of participants](../design-knowledge/trust-enabling-capacity-exchange-mr-o4.md) - Overlapping category.
* [MR-O5: Interface compatibility and standards](../design-knowledge/trust-enabling-capacity-exchange-mr-o5.md) - Overlapping category.
* [MR-O6: Depictability of human interaction and role models](../design-knowledge/trust-enabling-capacity-exchange-mr-o6.md) - Overlapping category.
* [MR-O7: Encryption concepts](../design-knowledge/trust-enabling-capacity-exchange-mr-o7.md) - Overlapping category.

### Design principles (Table 2)

* [Design principle DP1: Signaling of tender-relevant information](../design-knowledge/trust-enabling-capacity-exchange-dp1.md) - Provide functions for customized creation of tenders and their linkage to a verified identity, revealing them simultaneously and in a distributed manner, to reduce uncertainty from vague specifications and missing identity assignments.
* [Design principle DP2: Signaling of identity-relevant information](../design-knowledge/trust-enabling-capacity-exchange-dp2.md) - Provide functions for decentralized storage, configuration and verification of identities to establish trust in each participant's identity, ensuring transparency and correctness of identity.
* [Design principle DP3: Authority and fairness](../design-knowledge/trust-enabling-capacity-exchange-dp3.md) - Provide functions for creating and decentrally storing contracts and their order-relevant contents, and for monitoring compliance and enforcing sanctions/rewards, providing a transparent data basis and traceable enforcement of countermeasures.
* [Design principle DP4: Incentive mechanisms](../design-knowledge/trust-enabling-capacity-exchange-dp4.md) - Make the value-adding benefits of cooperation and the imminent losses from violations transparent and observable to all participants, motivating them and deterring opportunistic behavior.
* [Design principle DP5: Screening functionality](../design-knowledge/trust-enabling-capacity-exchange-dp5.md) - Provide functions for depositing information, distributed and verified access, validity checking and searching/contacting participants, so that information obtained during retrieval is valid and trustworthy.
* [Design principle DP6: Reputation mechanism](../design-knowledge/trust-enabling-capacity-exchange-dp6.md) - Provide a reputation mechanism that, after the fulfillment stage, allows serious rating of each identity with decentralized collection and transparent processing/distribution of rating data, so participants can trust the reputation data.

### Design features (Fig. 6)

* [DF1.1: Creating a tender](../design-knowledge/trust-enabling-capacity-exchange-df1-1.md) - Implements DP1.
* [DF1.2: Distributing information relevant to tender](../design-knowledge/trust-enabling-capacity-exchange-df1-2.md) - Implements DP1.
* [DF2.1: Creating an identity](../design-knowledge/trust-enabling-capacity-exchange-df2-1.md) - Implements DP2.
* [DF2.2: Distributing information relevant to identity](../design-knowledge/trust-enabling-capacity-exchange-df2-2.md) - Implements DP2.
* [DF3.1: Ensuring authorized access](../design-knowledge/trust-enabling-capacity-exchange-df3-1.md) - Implements DP3.
* [DF3.2: Configuring permissions](../design-knowledge/trust-enabling-capacity-exchange-df3-2.md) - Implements DP3.
* [DF3.3: Prevention of fraud](../design-knowledge/trust-enabling-capacity-exchange-df3-3.md) - Implements DP3.
* [DF4.1: Enforcing rewards and incentive](../design-knowledge/trust-enabling-capacity-exchange-df4-1.md) - Implements DP4.
* [DF4.2: Ensuring traceability of enforced rewards and incentives](../design-knowledge/trust-enabling-capacity-exchange-df4-2.md) - Implements DP4.
* [DF5.1: Permitted access to information relevant to tender](../design-knowledge/trust-enabling-capacity-exchange-df5-1.md) - Implements DP5.
* [DF5.2: Permitted access to information relevant to identity](../design-knowledge/trust-enabling-capacity-exchange-df5-2.md) - Implements DP5.
* [DF5.3: Permitted access to information relevant to reputation](../design-knowledge/trust-enabling-capacity-exchange-df5-3.md) - Implements DP5.
* [DF6.1: Creating an individual assessment](../design-knowledge/trust-enabling-capacity-exchange-df6-1.md) - Implements DP6.
* [DF6.2: Distributing information relevant to the assessment](../design-knowledge/trust-enabling-capacity-exchange-df6-2.md) - Implements DP6.

Fig. 3's meta-requirement-to-design-principle mapping uses crossing, many-to-many connector lines with no accompanying explicit textual statement of which meta-requirement maps to which design principle, so no `Addresses` relationships are recorded between meta-requirements and design principles (per the corpus's relationship-fidelity rule against inferring relationships from unclear or crossing figure connectors). Fig. 6, in contrast, groups each design feature under exactly one design principle in a non-crossing tree layout, so `Implements` relationships are recorded for all 14 design features.

# Citations
[1] Nick Grosse, Frederik Moeller, Thorsten Schoormann, Michael Henke. Designing trust-enabling blockchain systems for the inter-organizational exchange of capacity. Decision Support Systems 179 (2024) 114182. https://doi.org/10.1016/j.dss.2024.114182
[2] Source document: designing trust enabling blockchain systems.pdf
[3] Source evidence: Fig. 3 "Formulation and categorization of meta-requirements and design principles" (article p. 5); Table 2 "Design principle overview" (article p. 6); Fig. 6 "Design features and their consideration in a blockchain-based instantiation using Solidity" (article p. 8).
