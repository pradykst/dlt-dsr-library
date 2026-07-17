---
type: design-principle
title: "DP2 - Use a highly secure off-chain mapping architecture for attribution"
description: "If a use case requires that data on the blockchain be attributable to a natural person, employ pseudonymization:"
resource: "https://hdl.handle.net/10125/64253"
source_paper: "How to Develop a GDPR-Compliant Blockchain Solution for Cross-Organizational Workflow Management: Evidence from the German Asylum Procedure"
label: "DP2"
tags:
  - gdpr-workflow-asylum
  - design-principle
  - gdpr-privacy
  - cross-organizational
  - public-sector
  - workflow-management
timestamp: '2026-07-16T00:00:00+00:00'
---

# Design principle DP2: Use a highly secure off-chain mapping architecture for attribution

If a use case requires that data on the blockchain be attributable to a natural person, employ pseudonymization: keep the attribution mapping off-chain and propagate it over secure channels, so controllers can rectify (via rectification transactions) and erase (by deleting the mapping information).

## Source paper

This design principle is proposed by [How to Develop a GDPR-Compliant Blockchain Solution for Cross-Organizational Workflow Management: Evidence from the German Asylum Procedure](../papers/gdpr-workflow-asylum.md) (Florian Guggenmos, Annette Wenninger, Alexander Rieger, Gilbert Fridgen, Jannik Lockl, 2020).

## Addresses

* [Design principle DP1: Do not store personal data on a blockchain](./gdpr-workflow-asylum-dp1.md)

# Citations
[1] Florian Guggenmos, Annette Wenninger, Alexander Rieger, Gilbert Fridgen, Jannik Lockl. How to Develop a GDPR-Compliant Blockchain Solution for Cross-Organizational Workflow Management: Evidence from the German Asylum Procedure. HICSS 53 (2020). https://hdl.handle.net/10125/64253
[2] Source document: How to Develop a GDPR-Compliant Blockchain Solution for cross-organizational workflow management.pdf
