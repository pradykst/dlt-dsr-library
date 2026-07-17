---
type: paper
title: "Developing Blockchain-enabled Marketplace Interfaces: A Design Science Research Study"
description: "Grounded in representation theory, the paper derives ten meta-requirements and six design principles for blockchain-enabled marketplace interfaces that balance simplicity and trustworthiness, foster learning, provide interoperable identity/reputation, support domain-specific visualizations, add plausibility checks, and enable privacy-preserving external storage."
resource: "https://aisel.aisnet.org/icis2023/blockchain/blockchain/1"
authors: "Tobias Koelbel, Ahmed Zekri, Christof Weinhardt"
year: 2023
venue: "ICIS 2023 Proceedings"
methodology: "Design science research; kernel theory (representation); expert interviews yielding meta-requirements; instantiation and evaluation."
dsr_grid: true
dsr_solution_space: "Instantiation (Open3D) plus a design theory (meta-requirements, principles, features)."
tags:
  - bemi-marketplace-interfaces
  - marketplace
  - user-interface
  - additive-manufacturing
  - hci
  - design-science-research
  - blockchain
timestamp: '2026-07-16T00:00:00+00:00'
---

# Developing Blockchain-enabled Marketplace Interfaces: A Design Science Research Study

**Authors:** Tobias Koelbel, Ahmed Zekri, Christof Weinhardt  
**Venue:** ICIS 2023 Proceedings  
**Link:** https://aisel.aisnet.org/icis2023/blockchain/blockchain/1

## Summary

Grounded in representation theory, the paper derives ten meta-requirements and six design principles for blockchain-enabled marketplace interfaces that balance simplicity and trustworthiness, foster learning, provide interoperable identity/reputation, support domain-specific visualizations, add plausibility checks, and enable privacy-preserving external storage.

## Artifact

A blockchain-enabled marketplace interface (BEMI); the Open3D marketplace instantiation.

## Methodology

Design science research; kernel theory (representation); expert interviews yielding meta-requirements; instantiation and evaluation.

## DSR grid

The six core dimensions of this DSR project, following the [DSR grid](../about-the-dsr-grid.md) (vom Brocke & Maedche, 2019):

* **Problem description.** Blockchain-enabled marketplaces are complex, and users need interfaces that balance simplicity and trustworthiness to interact with the system effectively.
* **Input knowledge.** The Theory of Effective Use (Burton-Jones & Grange) as the overarching kernel theory; affordances (Gibson); representation theory; interface-design literature.
* **Research process.** Design science research: a systematic literature review and expert interviews to synthesize meta-requirements, then instantiation (Open3D) and evaluation.
* **Key concepts.** Blockchain, B2B, interface, design science research, theory of effective use.
* **Solution description.** A blockchain-enabled marketplace interface (Open3D) realizing six design principles through sixteen design features. Solution-space representation: Instantiation (Open3D) plus a design theory (meta-requirements, principles, features).
* **Output knowledge.** Ten meta-requirements, six design principles and sixteen design features for blockchain marketplace interfaces.

The *output knowledge* of this project is captured as the atomic design-knowledge concepts listed below.

## Design knowledge

* [Design principle DP1: Prioritize simplicity while balancing trustworthiness](../design-knowledge/bemi-marketplace-interfaces-dp1.md) - Design BEMIs that prioritize simplicity and intuitiveness while balancing trustworthiness and usability to ensure a user experience that resembles traditional marketplaces.
* [Design principle DP2: Support learning and engagement via documentation](../design-knowledge/bemi-marketplace-interfaces-dp2.md) - Design BEMIs that support users' learning and engagement by providing comprehensive documentation to foster trust by transparency and stimulate innovation in decentralized communities.
* [Design principle DP3: Interoperable identity and reputation infrastructure](../design-knowledge/bemi-marketplace-interfaces-dp3.md) - Design BEMIs with an interoperable identity management and reputation infrastructure to increase trust between transaction partners and enable user empowerment with sovereign authentication methods.
* [Design principle DP4: Domain-specific graphical representations](../design-knowledge/bemi-marketplace-interfaces-dp4.md) - Design BEMIs with graphical representations and functions for CAM-specific perspectives so that users can seamlessly navigate multidimensionality and incorporate stakeholders' points of view.
* [Design principle DP5: Real-time plausibility checks and time-limited corrections](../design-knowledge/bemi-marketplace-interfaces-dp5.md) - Design BEMIs with real-time input plausibility checks to reduce the risk of errors and allow for time-limited corrections, given the irreversibility of finalized transactions.
* [Design principle DP6: External storage connectivity for privacy and scalability](../design-knowledge/bemi-marketplace-interfaces-dp6.md) - Design BEMIs with external storage connectivity to mitigate blockchain scalability issues and enable privacy-preserving data storage.

## Design features

Concrete, technology-specific realizations of the design principles in this artifact:

* [Design feature DF1: Landing page](../design-knowledge/bemi-marketplace-interfaces-df1.md) - A landing page that serves as the artifact's central point of contact, presenting system values, terms of use and a help center.
* [Design feature DF2: Clickable icons for interface customization](../design-knowledge/bemi-marketplace-interfaces-df2.md) - Clickable icons that allow interface customization such as language selection and settings.
* [Design feature DF3: Technical documentation and whitepapers](../design-knowledge/bemi-marketplace-interfaces-df3.md) - Access to technical documentation and whitepapers to promote transparency and support user learning.
* [Design feature DF4: Community engagement (DAO / SDK)](../design-knowledge/bemi-marketplace-interfaces-df4.md) - Community-engagement mechanisms letting users participate in governance via a DAO, build their own marketplace via an SDK, or join a Discord community.
* [Design feature DF5: Connect Wallet / SSI identity](../design-knowledge/bemi-marketplace-interfaces-df5.md) - A 'Connect Wallet' function integrating interoperable identity management through Self-Sovereign Identity wallets.
* [Design feature DF6: Reputation mechanisms](../design-knowledge/bemi-marketplace-interfaces-df6.md) - Reputation mechanisms integrated to build trust between participants in the decentralized marketplace.
* [Design feature DF7: Role-specific dashboards](../design-knowledge/bemi-marketplace-interfaces-df7.md) - Customizable supplier and demand dashboards connecting the marketplace backend and blockchain ecosystem to provide customized information.
* [Design feature DF8: Interactive dashboard features](../design-knowledge/bemi-marketplace-interfaces-df8.md) - Interactive dashboard features such as drilldown and filters.
* [Design feature DF9: Visual dashboard features](../design-knowledge/bemi-marketplace-interfaces-df9.md) - Visual dashboard features such as diagrams and images.
* [Design feature DF10: Error notification](../design-knowledge/bemi-marketplace-interfaces-df10.md) - An error-notification feature that informs users of possible errors in their interactions (e.g., null filter entities or invalid input values).
* [Design feature DF11: Process execution validation](../design-knowledge/bemi-marketplace-interfaces-df11.md) - A process-execution validation/confirmation feature (pop-up) ensuring users confirm actions, given the irreversibility of blockchain transactions.
* [Design feature DF12: Peer-to-peer database linking (IPFS)](../design-knowledge/bemi-marketplace-interfaces-df12.md) - Peer-to-peer database linking (e.g., IPFS) to integrate large data externally without compromising the security and scalability of the system.
* [Design feature DF13: Customized and trusted view](../design-knowledge/bemi-marketplace-interfaces-df13.md) - A customized and trusted dashboard view giving users a tailored, trustworthy overview of the marketplace.
* [Design feature DF14: Transaction history](../design-knowledge/bemi-marketplace-interfaces-df14.md) - Transaction-history information within dashboards (e.g., saved searches, recent transactions and reviews, and order-progress indicators).
* [Design feature DF15: Direct communication ('Contact')](../design-knowledge/bemi-marketplace-interfaces-df15.md) - A direct-communication feature (the 'Contact' button) enabling an off-chain communication channel between transaction partners.
* [Design feature DF16: Reserve capacity](../design-knowledge/bemi-marketplace-interfaces-df16.md) - A 'Reserve' button letting users reserve available capacity in the marketplace.

# Citations
[1] Tobias Koelbel, Ahmed Zekri, Christof Weinhardt. Developing Blockchain-enabled Marketplace Interfaces: A Design Science Research Study. ICIS 2023 Proceedings. https://aisel.aisnet.org/icis2023/blockchain/blockchain/1
[2] Source document: Developing Blockchain-enabled Marketplace Interfaces - A Design Science Research Study.pdf
