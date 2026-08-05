---
type: design-feature
title: "DF3 - Immutability"
description: "Consent transactions are never erased; a previous transaction remains, and any change is added as a new transaction to the append-only blockchain data structure."
resource: "https://doi.org/10.1016/j.dss.2023.114021"
source_paper: "Blockchain innovation for consent self-management in health information exchanges"
label: "DF3"
tags:
  - consent-self-management-hie
  - design-feature
  - healthcare
  - consent-management
  - privacy
  - interoperability
timestamp: '2026-08-05T00:00:00+00:00'
---

# Design feature DF3: Immutability

Consent transactions are never erased; a previous transaction remains, and any change is added as a new transaction to the append-only blockchain data structure.

## Source paper

This design feature is a technology-specific realization proposed by [Blockchain innovation for consent self-management in health information exchanges](../papers/consent-self-management-hie.md) (Chad Anderson, Arthur Carvalho, Mala Kaul, Jeffrey W. Merhout, 2023).

## Implements

* [Design principle DP3: Auditable consent history](./consent-self-management-hie-dp3.md)

# Citations
[1] Chad Anderson, Arthur Carvalho, Mala Kaul, Jeffrey W. Merhout. Blockchain innovation for consent self-management in health information exchanges. Decision Support Systems 174 (2023) 114021. https://doi.org/10.1016/j.dss.2023.114021
[2] Source document: Blockchain innovation for consent self-management in health information exchanges.pdf
[3] Source evidence: Fig. 3 (article p. 8); Section 7, "Note that a previous transaction is never erased. Instead, a new one is added to the append-only data structure that blockchain is. This property highlights the design feature 'immutability' in Fig. 3 that satisfies DP3" (article p. 8).
