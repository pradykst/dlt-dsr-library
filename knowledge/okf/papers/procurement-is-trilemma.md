---
type: paper
title: "Designing a blockchain-based information system for procurement processes - Balancing decentralization, scalability, and security while maintaining privacy"
description: "The paper designs a blockchain-based procurement IS that navigates the extended blockchain trilemma (decentralization, scalability, security, plus privacy) while preserving privacy, deriving five evaluated design objectives and two design principles: balance decentralization, scalability and security via a public chain plus Layer-2 scaling and decentralized inter-layer communication; and maintain that balance when privacy is required via efficient, resilient cryptography and minimized control points."
resource: "https://doi.org/10.1016/j.is.2026.102723"
authors: "Valeriya Arnold, Tobias Guggenberger, Jan Stramm, Nils Urbach"
year: 2026
venue: "Information Systems 140 (2026) 102723"
methodology: "Design science research (Peffers et al. 2007, six-step process): a structured literature review (Webster and Watson 2002) yielding a problem statement and five evaluated design objectives; iterative design and development of a prototype on the Aztec privacy roll-up over Ethereum; formative and summative evaluation via a quantitative viability assessment (throughput, latency, cost) and 16 semi-structured expert interviews; reflection yielding two prescriptive design principles."
dsr_grid: true
dsr_solution_space: "Instantiation (prototype) plus two design principles grounded in five evaluated design objectives."
tags:
  - procurement-is-trilemma
  - procurement
  - blockchain-trilemma
  - privacy
  - zero-knowledge
  - design-science-research
  - blockchain
timestamp: '2026-08-05T00:00:00+00:00'
---

# Designing a blockchain-based information system for procurement processes - Balancing decentralization, scalability, and security while maintaining privacy

**Authors:** Valeriya Arnold, Tobias Guggenberger, Jan Stramm, Nils Urbach
**Venue:** Information Systems 140 (2026) 102723
**Link:** https://doi.org/10.1016/j.is.2026.102723

## Summary

The paper designs a blockchain-based procurement IS that navigates the extended blockchain trilemma (decentralization, scalability, security, plus privacy) while preserving privacy, deriving five evaluated design objectives and two design principles: balance decentralization, scalability and security via a public chain plus Layer-2 scaling and decentralized inter-layer communication; and maintain that balance when privacy is required via efficient, resilient cryptography and minimized control points.

## Artifact

A public-permissionless, Layer-2 (rollup) blockchain-based procurement information system built on the Aztec privacy-preserving roll-up over Ethereum. Private functions execute off-chain in each user's Private Execution Environment (PXE), which generates zero-knowledge proofs (zk-SNARKs, via the PLONK protocol) attesting to the correctness of procurement actions without revealing prices, quantities, or counterparty identities; a sequencer network verifies and batches these proofs for finality on Ethereum L1. The prototype tokenizes purchase orders as regulation-compliant stablecoins (issued by a licensed financial institution under MiCAR), and orchestrates the procure-to-pay workflow (supplier discovery, private negotiation, ordering, settlement) through L1 (Solidity) and L2 (Noir) smart contracts, including Token, Token Portal, Inbox/Outbox/Rollup, Token Bridge, and Trade contracts.

## DSR grid

The six core dimensions of this DSR project, following the [DSR grid](../about-the-dsr-grid.md) (vom Brocke & Maedche, 2019):

* **Problem description.** Existing blockchain-based procurement systems rarely balance decentralization, scalability and security (the blockchain trilemma) while also maintaining the strict privacy required for sensitive commercial data (the extended blockchain trilemma) across inter-organizational processes.
* **Input knowledge.** The (extended) blockchain trilemma; Layer-2 (rollup) and zero-knowledge-proof research; procurement research; the Gregor et al. (2020) anatomy-of-a-design-principle formulation.
* **Research process.** Design science research: a structured literature review (34 papers) combined with 16 expert interviews yielding a problem statement and five evaluated design objectives; a prototype on Aztec/Ethereum (Layer-2 rollup with ZKPs); a quantitative viability assessment (throughput, latency, cost) and qualitative expert evaluation against the five design objectives.
* **Key concepts.** Blockchain, procurement, extended blockchain trilemma, privacy, design science research, zero-knowledge proofs.
* **Solution description.** A public-permissionless, Layer-2 procurement information system with zero-knowledge-proof-based privacy and minimized control points. Solution-space representation: Instantiation (prototype) plus two design principles grounded in five evaluated design objectives.
* **Output knowledge.** Five evaluated design objectives (DO1-DO5) and two design principles (DP1, DP2) - balancing the trilemma, and maintaining that balance under privacy requirements.

The *output knowledge* of this project is captured as the atomic design-knowledge concepts listed below.

## Design knowledge

* [Design objective DO1: Publicly accessible, interoperable blockchain infrastructure](../design-knowledge/procurement-is-trilemma-do1.md) - The artifact should leverage standardization efforts to enable enterprises to seamlessly integrate their ERP systems with publicly accessible, interoperable blockchain infrastructure.
* [Design objective DO2: Stable, regulation-compliant payment processing](../design-knowledge/procurement-is-trilemma-do2.md) - The artifact should embed stable and regulation-compliant payment processing into blockchain-based procurement workflows, enabling efficient and seamless value exchange among participants in both national and international contexts.
* [Design objective DO3: Strengthen dispute-resolution trust via permissionless blockchain](../design-knowledge/procurement-is-trilemma-do3.md) - The artifact should strengthen trust in procurement's dispute resolution processes without undermining trust in the underlying infrastructure by leveraging permissionless blockchain.
* [Design objective DO4: Infrastructure that scales with volume and users](../design-knowledge/procurement-is-trilemma-do4.md) - The artifact should be built on an infrastructure capable of scaling with growing transaction volumes and users.
* [Design objective DO5: Privacy-enabled while maintaining auditability](../design-knowledge/procurement-is-trilemma-do5.md) - The artifact should be privacy-enabled while maintaining the inherent auditability of blockchain records.
* [Design principle DP1: Balance decentralization, scalability and security](../design-knowledge/procurement-is-trilemma-dp1.md) - Principle of balancing the blockchain trilemma with a public Layer 1 as a trust anchor, a Layer 2 for scalability, and decentralized communication between layers.
* [Design principle DP2: Maintain the balance under privacy requirements](../design-knowledge/procurement-is-trilemma-dp2.md) - Principle of ensuring privacy while maintaining a balanced blockchain trilemma through efficient and resilient cryptography and minimized control mechanism.

# Citations
[1] Valeriya Arnold, Tobias Guggenberger, Jan Stramm, Nils Urbach. Designing a blockchain-based information system for procurement processes - Balancing decentralization, scalability, and security while maintaining privacy. Information Systems 140 (2026) 102723. https://doi.org/10.1016/j.is.2026.102723
[2] Source document: Designing a blockchain-based information system for procurement.pdf
[3] Source evidence: Table 3 ("Evaluated Design Objectives"), article p. 9; Table 6 ("Design Principle 1") and Table 7 ("Design Principle 2"), article p. 18-19.
