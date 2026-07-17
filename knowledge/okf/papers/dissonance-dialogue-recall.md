---
type: paper
title: "From Dissonance to Dialogue: A Token-Based Approach to Bridge the Gap Between Manufacturers and Customers"
description: "The paper presents a token-based recall-communication system integrating ERP and blockchain, developing six design principles (and supporting design features) that improve recall coordination, traceability and co-value creation between manufacturers and customers."
resource: "https://doi.org/10.1145/3639058"
authors: "Norman Pytel, Christian Ziegler, Axel Winkelmann"
year: 2024
venue: "ACM Transactions on Management Information Systems 15(1), Article 3 (2024)"
methodology: "Design science research; three artifact iterations; qualitative evaluation with 14 industry experts."
dsr_grid: true
dsr_solution_space: "Instantiation plus a design theory (requirements, principles and features)."
tags:
  - dissonance-dialogue-recall
  - recall-communication
  - erp-integration
  - traceability
  - tokenization
  - design-science-research
  - blockchain
timestamp: '2026-07-16T00:00:00+00:00'
---

# From Dissonance to Dialogue: A Token-Based Approach to Bridge the Gap Between Manufacturers and Customers

**Authors:** Norman Pytel, Christian Ziegler, Axel Winkelmann  
**Venue:** ACM Transactions on Management Information Systems 15(1), Article 3 (2024)  
**Link:** https://doi.org/10.1145/3639058

## Summary

The paper presents a token-based recall-communication system integrating ERP and blockchain, developing six design principles (and supporting design features) that improve recall coordination, traceability and co-value creation between manufacturers and customers.

## Artifact

A token-based recall-communication system integrating ERP systems with blockchain.

## Methodology

Design science research; three artifact iterations; qualitative evaluation with 14 industry experts.

## DSR grid

The six core dimensions of this DSR project, following the [DSR grid](../about-the-dsr-grid.md) (vom Brocke & Maedche, 2019):

* **Problem description.** Recall communication and cooperation between manufacturers and customers is poor, as internal ERP-based traceability rarely extends past product delivery.
* **Input knowledge.** Socio-technical systems thinking; ERP traceability; the ANDON visual-management concept; token standards; the anatomy of a design principle (Gregor et al. 2020).
* **Research process.** Design science research over three artifact iterations, with a qualitative evaluation involving fourteen industry experts.
* **Key concepts.** Blockchain, recall communication, enterprise resource planning system, information system design.
* **Solution description.** A token-based recall-communication system integrating ERP systems with a permissionless blockchain. Solution-space representation: Instantiation plus a design theory (requirements, principles and features).
* **Output knowledge.** Five design requirements, six design principles and eight design features for interoperable recall communication.

The *output knowledge* of this project is captured as the atomic design-knowledge concepts listed below.

## Design knowledge

* [Design requirement DR1: Straightforward ERP mapping with essential on-chain data](../design-knowledge/dissonance-dialogue-recall-dr1.md) - The enterprise systems should be mapped straightforwardly, and only essential recall-communication data must be stored in the blockchain.
* [Design requirement DR2: Complete recall traceability path](../design-knowledge/dissonance-dialogue-recall-dr2.md) - The system should provide an entire recall traceability path to ensure synchronized communications between multiple organizations.
* [Design requirement DR3: Intuitive product- and health-state communication](../design-knowledge/dissonance-dialogue-recall-dr3.md) - The system should allow intuitive communication of product- and customer-health states.
* [Design requirement DR4: Interoperability with permissionless blockchain](../design-knowledge/dissonance-dialogue-recall-dr4.md) - The system should allow interoperability between enterprise systems and permissionless blockchain.
* [Design requirement DR5: Co-value creation with private customers](../design-knowledge/dissonance-dialogue-recall-dr5.md) - The system should allow co-value creation procedures between manufacturers and private customers.
* [Design principle DP1: ERP integration by extending data models](../design-knowledge/dissonance-dialogue-recall-dp1.md) - Integrate any ERP system by extending existing data models of required blockchain objects and recall tracing, promoting seamless communication between ERP and blockchain systems.
* [Design principle DP2: Multi-enterprise capture and historical owner analysis](../design-knowledge/dissonance-dialogue-recall-dp2.md) - Capture multiple enterprise systems and analyze historical owners using blockchain-ERP integration and recall tracing, fostering cross-organizational collaboration in recall processes.
* [Design principle DP3: Traceability with customer notifications](../design-knowledge/dissonance-dialogue-recall-dp3.md) - Enable traceability functions with customer wallet notifications and backward and forward ownership tracing to ensure synchronized communication for all related owners.
* [Design principle DP4: Interoperability across EVM-supported applications](../design-knowledge/dissonance-dialogue-recall-dp4.md) - Provide interoperability between EVM-supported software applications using recall tracing across organizational borders.
* [Design principle DP5: Customer participation in recall information](../design-knowledge/dissonance-dialogue-recall-dp5.md) - Implement mechanisms that allow customers to receive recall information and announce product defects, promoting active customer participation.
* [Design principle DP6: Co-value creation between manufacturers and customers](../design-knowledge/dissonance-dialogue-recall-dp6.md) - Foster co-value creation procedures between manufacturers and customers using inter-organizational data storage, product-defect announcements, recall-state management and ownership tracing.

## Design features

Concrete, technology-specific realizations of the design principles in this artifact:

* [Design feature DF1: Customer wallet notification for recall states](../design-knowledge/dissonance-dialogue-recall-df1.md) - Customers log in with an Ethereum wallet and receive notifications about recall states of products they own.
* [Design feature DF2: BC-ERP integration through objects](../design-knowledge/dissonance-dialogue-recall-df2.md) - Integration of enterprise systems with the blockchain through objects (TokenID, contract address, From/To owner, system) recorded in a movement table.
* [Design feature DF3: Recall tracing and product-state extension of the token](../design-knowledge/dissonance-dialogue-recall-df3.md) - A standard token interface that traces recalls and extends the product state as the token moves between organizations and customers.
* [Design feature DF4: Interorganizational BC-based data storage](../design-knowledge/dissonance-dialogue-recall-df4.md) - Inter-organizational blockchain-based data storage shared between manufacturers and customers.
* [Design feature DF5: Customer product-defect announcement](../design-knowledge/dissonance-dialogue-recall-df5.md) - A feature allowing customers to announce product defects and voluntarily report their health state.
* [Design feature DF6: Manufacturer product-defect announcement](../design-knowledge/dissonance-dialogue-recall-df6.md) - A feature allowing manufacturers to announce a defective product, initiating a forward recall that notifies all customers holding the token.
* [Design feature DF7: Manufacturer recall-state management](../design-knowledge/dissonance-dialogue-recall-df7.md) - A feature by which manufacturers set and manage recall states (e.g., 'Checked NOT OK') for affected products.
* [Design feature DF8: Backward and forward ownership tracing](../design-knowledge/dissonance-dialogue-recall-df8.md) - Smart-contract token-ownership tracing history enabling backward and forward tracing of previous manufacturers and owners for the recall process.

# Citations
[1] Norman Pytel, Christian Ziegler, Axel Winkelmann. From Dissonance to Dialogue: A Token-Based Approach to Bridge the Gap Between Manufacturers and Customers. ACM Transactions on Management Information Systems 15(1), Article 3 (2024). https://doi.org/10.1145/3639058
[2] Source document: From Dissonance to Dialogue - A Token-Based Approach.pdf
