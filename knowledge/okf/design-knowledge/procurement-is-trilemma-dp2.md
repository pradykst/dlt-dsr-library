---
type: design-principle
title: "DP2 - Maintain the balance under privacy requirements"
description: "Principle of ensuring privacy while maintaining a balanced blockchain trilemma through efficient and resilient cryptography and minimized control mechanism."
resource: "https://doi.org/10.1016/j.is.2026.102723"
source_paper: "Designing a blockchain-based information system for procurement processes - Balancing decentralization, scalability, and security while maintaining privacy"
label: "DP2"
tags:
  - procurement-is-trilemma
  - design-principle
  - procurement
  - blockchain-trilemma
  - privacy
  - zero-knowledge
timestamp: '2026-08-05T00:00:00+00:00'
---

# Design principle DP2: Maintain the balance under privacy requirements

Principle of ensuring privacy while maintaining a balanced blockchain trilemma through efficient and resilient cryptography and minimized control mechanism.

**Aim, implementer, and user:** For developers and researchers of blockchain-based solutions (implementers), addressing use cases such as procurement (users), aiming to leverage their solution by integrating privacy while maintaining the equilibrium of the scalability, security, and decentralization trilemma (aim).

**Context:** In inter-organizational settings with trust, discontinuity, and inefficiency challenges, where privacy is additionally required.

**Mechanism 2.1:** Ensure that the chosen Layer 2 solution applies efficient ZKPs, with proof generation occurring in a secure off-chain environment. Rationale: because it safeguards privacy without compromising scalability, by ensuring confidential data handling in a secure environment, such as a Trusted Execution Environment, while enabling efficient proof generation.

**Mechanism 2.2:** Ensure that the chosen Layer 2 solution relies on ZKP protocols that provide long-term cryptographic resilience. Rationale: because it safeguards privacy without undermining security, ensuring that tamper-resistant and encrypted data on the blockchain remain resilient against potential adversaries, including quantum attacks.

**Mechanism 2.3:** Minimize reliance on centralized control structures within the smart contract ecosystem. Rationale: because it safeguards privacy without undermining decentralization, avoiding permissioned settings insofar as this remains consistent with prevailing regulatory obligations.

## Source paper

This design principle is proposed by [Designing a blockchain-based information system for procurement processes - Balancing decentralization, scalability, and security while maintaining privacy](../papers/procurement-is-trilemma.md) (Valeriya Arnold, Tobias Guggenberger, Jan Stramm, Nils Urbach, 2026).

## Addresses

* [Design objective DO5: Privacy-enabled while maintaining auditability](./procurement-is-trilemma-do5.md)

# Citations
[1] Valeriya Arnold, Tobias Guggenberger, Jan Stramm, Nils Urbach. Designing a blockchain-based information system for procurement processes - Balancing decentralization, scalability, and security while maintaining privacy. Information Systems 140 (2026) 102723. https://doi.org/10.1016/j.is.2026.102723
[2] Source document: Designing a blockchain-based information system for procurement.pdf
[3] Source evidence: Table 7 ("Design Principle 2"), article p. 19. The Addresses relationship is grounded in the explicit statement (article p. 18): "As outlined in DO5, privacy often plays a crucial role in business cases such as procurement... Design Principle 2 (DP2)... addresses a complementary gap concerning the integration of privacy into permissionless blockchain architectures."
