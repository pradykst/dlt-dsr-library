---
type: design-principle
title: "DP - Principles for designing data-protection-compliant (forgetting) blockchains"
description: "The derived guidance for data-protection-compliant blockchains includes:"
resource: "https://hdl.handle.net/10125/59571"
source_paper: "Design of a forgetting blockchain: A possible way to accomplish GDPR compatibility"
label: "DP"
tags:
  - forgetting-blockchain-gdpr
  - design-principle
  - gdpr-privacy
  - blockchain-architecture
  - data-deletion
  - right-to-erasure
timestamp: '2026-07-16T00:00:00+00:00'
---

# Design principle DP: Principles for designing data-protection-compliant (forgetting) blockchains

The derived guidance for data-protection-compliant blockchains includes: combine an existing technique (state pruning) with a custom function to delete logs and other traces while enabling logging of predefined transactions in the persistent EVM state; keep durable data in the smart-contract state (via explicit logging) rather than in transactions, since transactions are transient; because the original genesis block no longer exists after deletion, bootstrap new or resynchronizing nodes from a recent block obtained and cross-checked from multiple trusted sources; set the data-deletion time to a reasonably long period (e.g., seven days) to accommodate node downtime; and restrict the approach to permissioned/restricted environments where financial and legal incentives (e.g., auditing) discourage participants from archiving deleted data, since network-wide deletion cannot be technically enforced.

## Source paper

This design principle is proposed by [Design of a forgetting blockchain: A possible way to accomplish GDPR compatibility](../papers/forgetting-blockchain-gdpr.md) (Simon Farshid, Andreas Reitz, 2019).

# Citations
[1] Simon Farshid, Andreas Reitz. Design of a forgetting blockchain: A possible way to accomplish GDPR compatibility. HICSS 52 (2019). https://hdl.handle.net/10125/59571
[2] Source document: Design of a forgetting blockchain.pdf
