---
type: paper
title: "An Architecture Using Payment Channel Networks for Blockchain-based Wi-Fi Sharing"
description: "The authors derive a comprehensive collection of 14 design principles for workable Wi-Fi sharing networks and propose a reference architecture combining a blockchain (for trust and immutable records) with payment channel networks (for fast, cheap micro-payments), augmenting current approaches with adequate accounting mechanisms."
resource: "https://doi.org/10.1145/3529097"
authors: "Christian Janiesch, Marcus Fischer, Florian Imgrund, Adrian Hofmann, Axel Winkelmann"
year: 2023
venue: "ACM Transactions on Management Information Systems 14(1), Article 1 (2023)"
methodology: "Design science research; requirements from a survey of risks/threats; scenario-based evaluation and workshop; proposed testable propositions."
dsr_grid: true
dsr_solution_space: "Instantiation (reference architecture) plus fourteen design principles (design theory)."
tags:
  - wifi-sharing-payment-channels
  - sharing-economy
  - telecommunications
  - payment-channels
  - architecture
  - design-science-research
  - blockchain
timestamp: '2026-07-16T00:00:00+00:00'
---

# An Architecture Using Payment Channel Networks for Blockchain-based Wi-Fi Sharing

**Authors:** Christian Janiesch, Marcus Fischer, Florian Imgrund, Adrian Hofmann, Axel Winkelmann  
**Venue:** ACM Transactions on Management Information Systems 14(1), Article 1 (2023)  
**Link:** https://doi.org/10.1145/3529097

## Summary

The authors derive a comprehensive collection of 14 design principles for workable Wi-Fi sharing networks and propose a reference architecture combining a blockchain (for trust and immutable records) with payment channel networks (for fast, cheap micro-payments), augmenting current approaches with adequate accounting mechanisms.

## Artifact

A multi-layer reference architecture for Wi-Fi sharing based on blockchain and payment channel networks.

## Methodology

Design science research; requirements from a survey of risks/threats; scenario-based evaluation and workshop; proposed testable propositions.

## DSR grid

The six core dimensions of this DSR project, following the [DSR grid](../about-the-dsr-grid.md) (vom Brocke & Maedche, 2019):

* **Problem description.** Wi-Fi sharing needs adequate accounting and security: trust-based approaches require intermediaries and cannot prevent malicious behavior, while security-based approaches lack accounting mechanisms and coverage.
* **Input knowledge.** Prior Wi-Fi sharing approaches (e.g., Leroy et al., Cao et al., Seufert et al.); the market engineering framework (Notheisen et al.); blockchain and payment channel networks.
* **Research process.** Design science research: requirements derived from a survey of risks, threats and related work; development of a multi-layer reference architecture; scenario-based evaluation and a workshop; formulation of testable propositions.
* **Key concepts.** Wi-Fi sharing, blockchain, payment channel networks, reference architecture, accounting mechanisms.
* **Solution description.** A multi-layer reference architecture combining a blockchain (trust, immutable records) with payment channel networks (fast, cheap micro-payments) and adequate accounting. Solution-space representation: Instantiation (reference architecture) plus fourteen design principles (design theory).
* **Output knowledge.** Fourteen design principles for secure, reliable Wi-Fi sharing networks with adequate accounting.

The *output knowledge* of this project is captured as the atomic design-knowledge concepts listed below.

## Design knowledge

* [Design principle DP1: Host bandwidth management module](../design-knowledge/wifi-sharing-payment-channels-dp1.md) - Provide the system with a module for hosts to manage and organize the provided bandwidth in order for the system to provide access to the Internet.
* [Design principle DP2: Private-network module without shared secret keys](../design-knowledge/wifi-sharing-payment-channels-dp2.md) - Provide the system with a module for users to initiate and maintain a private network without sharing secret keys in order to prevent decoding of the connection.
* [Design principle DP3: Route users to their private network](../design-knowledge/wifi-sharing-payment-channels-dp3.md) - Provide the system with a module that provides only bandwidth to the user while users are routed to their private network even if their identity is known, in order to prevent users from conducting...
* [Design principle DP4: Restrict user access to the host's infrastructure](../design-knowledge/wifi-sharing-payment-channels-dp4.md) - Provide the system with a module to restrict user access to the host's private network infrastructure even if the user's identity is known, in order to prevent fraudulent actions.
* [Design principle DP5: Clear access-point identification](../design-knowledge/wifi-sharing-payment-channels-dp5.md) - Provide the system with a module to identify access points clearly in order to prevent security-related threats such as eavesdropping or DNS-server phishing.
* [Design principle DP6: Tamper-proof transaction history via trusted intermediary](../design-knowledge/wifi-sharing-payment-channels-dp6.md) - Provide the system with a mutually trusted intermediary requiring a transaction history that records a user's data traffic, resource consumption and incurred costs, in order to ensure that connecti...
* [Design principle DP7: Minimize transaction costs](../design-knowledge/wifi-sharing-payment-channels-dp7.md) - Provide the system with a module to keep transaction costs to a minimum in order to prevent large numbers of micro-payments.
* [Design principle DP8: Fee-free instant payments](../design-knowledge/wifi-sharing-payment-channels-dp8.md) - Provide the system with a module to forgo transaction costs for the execution of instant payments in order to regulate the duration of the connection.
* [Design principle DP9: Mutually agreed usage cost](../design-knowledge/wifi-sharing-payment-channels-dp9.md) - Provide the system with a module to set up the transaction in order to enable host and user to mutually agree on the usage cost.
* [Design principle DP10: Pre-payment mechanism](../design-knowledge/wifi-sharing-payment-channels-dp10.md) - Provide the system with a module for pre-payment in order to increase quality of service and prevent risks of overcharging and repudiation.
* [Design principle DP11: Dynamic trust-score accounting](../design-knowledge/wifi-sharing-payment-channels-dp11.md) - Provide the system with accounting mechanisms using a dynamic trust-score in order to facilitate cooperative host behavior and ensure high service levels by rewarding hosts for cooperation or high...
* [Design principle DP12: Platform-independent protocol](../design-knowledge/wifi-sharing-payment-channels-dp12.md) - Provide the system with a protocol that is platform-independent in order to avoid lock-in effects and facilitate user adoption and scalability.
* [Design principle DP13: Incremental bandwidth with instant payment](../design-knowledge/wifi-sharing-payment-channels-dp13.md) - Provide the system with a protocol that incrementally increases provided bandwidth together with instant payment functionalities that transfer outstanding payments immediately to unlock further res...
* [Design principle DP14: Multiple simultaneous connections and billing](../design-knowledge/wifi-sharing-payment-channels-dp14.md) - Provide the system with a protocol for users to initiate any number of connections and for hosts to simultaneously bill users with multiple connections, in order to ensure connections without the r...

# Citations
[1] Christian Janiesch, Marcus Fischer, Florian Imgrund, Adrian Hofmann, Axel Winkelmann. An Architecture Using Payment Channel Networks for Blockchain-based Wi-Fi Sharing. ACM Transactions on Management Information Systems 14(1), Article 1 (2023). https://doi.org/10.1145/3529097
[2] Source document: An Architecture Using Payment Channel Networks for Blockchain-based Wi-Fi Sharing.pdf
