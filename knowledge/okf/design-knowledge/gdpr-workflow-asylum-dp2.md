---
type: design-principle
title: "DP2 - Use a highly secure off-chain mapping architecture for attribution"
description: "If a use case requires that data on the blockchain be attributable to a natural person, use a highly secure off-chain mapping architecture."
resource: "https://hdl.handle.net/10125/64234"
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

Certain use cases require that information propagated and stored on the blockchain can be attributed to a natural person. As Design Principle 1 also applies in these use cases, the information on the blockchain must not allow attribution without further information, and blockchain solution architects should employ a pseudonymization solution. The information required for attribution, such as a mapping of abstract blockchain IDs with specific IDs, has to remain off-chain and should be propagated using secure information channels. With such a solution, data controllers can rectify, through the propagation of rectification transactions, and they can erase, through the deletion of the information required for attribution.

## Source paper

This design principle is proposed by [How to Develop a GDPR-Compliant Blockchain Solution for Cross-Organizational Workflow Management: Evidence from the German Asylum Procedure](../papers/gdpr-workflow-asylum.md) (Florian Guggenmos, Annette Wenninger, Alexander Rieger, Gilbert Fridgen, Jannik Lockl, 2020).

## Addresses

* [Design principle DP1: Do not store personal data on a blockchain](./gdpr-workflow-asylum-dp1.md)

# Citations
[1] Florian Guggenmos, Annette Wenninger, Alexander Rieger, Gilbert Fridgen, Jannik Lockl. How to Develop a GDPR-Compliant Blockchain Solution for Cross-Organizational Workflow Management: Evidence from the German Asylum Procedure. HICSS 53 (2020). https://hdl.handle.net/10125/64234
[2] Source document: How to Develop a GDPR-Compliant Blockchain Solution for cross-organizational workflow management.pdf
[3] Source evidence: Section 5 ("Design principles for GDPR-compliant blockchain design"), "Design Principle 2: If a use case requires that data on the blockchain be attributable to a natural person, use a highly secure off-chain mapping architecture", article p. 4029-4030. Its explicit statement "As Design Principle 1 also applies in these use cases" is the source basis for the Addresses relationship to DP1.
