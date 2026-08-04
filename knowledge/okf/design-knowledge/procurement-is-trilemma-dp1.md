---
type: design-principle
title: "DP1 - Balance decentralization, scalability and security"
description: "Principle of balancing the blockchain trilemma with a public Layer 1 as a trust anchor, a Layer 2 for scalability, and decentralized communication between layers."
resource: "https://doi.org/10.1016/j.is.2026.102723"
source_paper: "Designing a blockchain-based information system for procurement processes - Balancing decentralization, scalability, and security while maintaining privacy"
label: "DP1"
tags:
  - procurement-is-trilemma
  - design-principle
  - procurement
  - blockchain-trilemma
  - privacy
  - zero-knowledge
timestamp: '2026-08-05T00:00:00+00:00'
---

# Design principle DP1: Balance decentralization, scalability and security

Principle of balancing the blockchain trilemma with a public Layer 1 as a trust anchor, a Layer 2 for scalability, and decentralized communication between layers.

**Aim, implementer, and user:** For developers and researchers of blockchain-based solutions (implementers), addressing business use cases such as procurement (users), aiming to leverage their solution by achieving a sustainable balance between scalability, security, and decentralization (aim).

**Context:** In inter-organizational settings with trust, discontinuity, and inefficiency challenges.

**Mechanism 1.1:** Build the design on a public permissionless Layer 1 blockchain, complemented by a Layer 2 protocol. Rationale: because it improves scalability while maintaining decentralization and security of the blockchain-based information system.

**Mechanism 1.2:** Ensure that the Layer 2 design integrates a decentralized communication infrastructure. Rationale: because it ensures decentralization across layers, instead of shifting centralization risks from the base Layer 1 to the scaling Layer 2, thereby retaining the security guarantees of Layer 1.

## Source paper

This design principle is proposed by [Designing a blockchain-based information system for procurement processes - Balancing decentralization, scalability, and security while maintaining privacy](../papers/procurement-is-trilemma.md) (Valeriya Arnold, Tobias Guggenberger, Jan Stramm, Nils Urbach, 2026).

## Addresses

* [Design objective DO1: Publicly accessible, interoperable blockchain infrastructure](./procurement-is-trilemma-do1.md)
* [Design objective DO2: Stable, regulation-compliant payment processing](./procurement-is-trilemma-do2.md)
* [Design objective DO3: Strengthen dispute-resolution trust via permissionless blockchain](./procurement-is-trilemma-do3.md)
* [Design objective DO4: Infrastructure that scales with volume and users](./procurement-is-trilemma-do4.md)

# Citations
[1] Valeriya Arnold, Tobias Guggenberger, Jan Stramm, Nils Urbach. Designing a blockchain-based information system for procurement processes - Balancing decentralization, scalability, and security while maintaining privacy. Information Systems 140 (2026) 102723. https://doi.org/10.1016/j.is.2026.102723
[2] Source document: Designing a blockchain-based information system for procurement.pdf
[3] Source evidence: Table 6 ("Design Principle 1"), article p. 18. The Addresses relationship is grounded in the explicit statement (article p. 18): "a public-permissionless infrastructure fosters standardization (DO1) and strengthens trust (DO3), while L2 rollups mitigate scalability challenges (DO4), thus contributing to efficient payments (DO2)."
