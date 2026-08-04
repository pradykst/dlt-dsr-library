---
type: paper
title: "How to Develop a GDPR-Compliant Blockchain Solution for Cross-Organizational Workflow Management: Evidence from the German Asylum Procedure"
description: "Drawing on the German Federal Office for Migration and Refugees (BAMF) case, the paper presents two actionable design principles for GDPR-compliant blockchain solutions in cross-organizational workflow management: do not store personal data on a blockchain, and, where attribution is required, use a highly secure off-chain mapping architecture."
resource: "https://hdl.handle.net/10125/64234"
authors: "Florian Guggenmos, Annette Wenninger, Alexander Rieger, Gilbert Fridgen, Jannik Lockl"
year: 2020
venue: "HICSS 53 (2020)"
methodology: "Participatory action research: three AR cycles (privacy-sensitive prototype design; detailed GDPR-compliance analysis; design of a GDPR-compliant three-layer architecture) conducted with the German Federal Office for Migration and Refugees (BAMF); derivation of two tentative design principles."
dsr_grid: true
dsr_solution_space: "Instantiation (BAMF architecture) plus two tentative design principles."
tags:
  - gdpr-workflow-asylum
  - gdpr-privacy
  - cross-organizational
  - public-sector
  - workflow-management
  - design-science-research
  - blockchain
timestamp: '2026-07-16T00:00:00+00:00'
---

# How to Develop a GDPR-Compliant Blockchain Solution for Cross-Organizational Workflow Management: Evidence from the German Asylum Procedure

**Authors:** Florian Guggenmos, Annette Wenninger, Alexander Rieger, Gilbert Fridgen, Jannik Lockl  
**Venue:** HICSS 53 (2020)  
**Link:** https://hdl.handle.net/10125/64234

## Summary

Drawing on the German Federal Office for Migration and Refugees (BAMF) case, the paper presents two actionable design principles for GDPR-compliant blockchain solutions in cross-organizational workflow management: do not store personal data on a blockchain, and, where attribution is required, use a highly secure off-chain mapping architecture.

## Artifact

A GDPR-compliant blockchain solution for the German asylum procedure, piloted with two authorities (the BAMF and Saxony's central immigration authority, LDS) on a Hyperledger Fabric blockchain. The final architecture has three layers: layer one holds each authority's existing databases and workflow management systems; layer two (the adapter layer) holds blockchain adapters, which submit status-update events to the blockchain, and privacy services, which map each authority's own identifiers to the pseudonymous identifiers used on-chain; layer three is the blockchain itself, storing only pseudonymized events (status, timestamp, authority ID, pseudonymous identifier). Rectification is performed via a rectification transaction submitted to the blockchain; erasure is performed by deleting the identifying mapping in the privacy service, which depersonalizes (without deleting) the on-chain data.

## Methodology

Participatory action research: three AR cycles (privacy-sensitive prototype design; detailed GDPR-compliance analysis; design of a GDPR-compliant three-layer architecture) conducted with the German Federal Office for Migration and Refugees (BAMF); derivation of two tentative design principles.

## DSR grid

The six core dimensions of this DSR project, following the [DSR grid](../about-the-dsr-grid.md) (vom Brocke & Maedche, 2019):

* **Problem description.** Reconciling blockchain's tamper-resistant storage with the GDPR's rights to rectification and erasure in cross-organizational workflow management.
* **Input knowledge.** GDPR and privacy-by-design principles; pseudonymization approaches; the German BAMF asylum-procedure case; prior IS research on data-privacy management.
* **Research process.** Participatory action research: three AR cycles (privacy-sensitive prototype design; detailed GDPR-compliance analysis; design of a GDPR-compliant three-layer architecture) with the BAMF, from which two tentative design principles are derived.
* **Key concepts.** Blockchain, GDPR, cross-organizational workflow management, pseudonymization, asylum procedure.
* **Solution description.** A GDPR-compliant blockchain architecture that keeps personal data off-chain and, where attribution is required, uses a highly secure off-chain mapping. Solution-space representation: Instantiation (BAMF architecture) plus two tentative design principles.
* **Output knowledge.** Two actionable design principles for GDPR-compliant blockchain workflow design.

The *output knowledge* of this project is captured as the atomic design-knowledge concepts listed below.

## Design knowledge

* [Design principle DP1: Do not store personal data on a blockchain](../design-knowledge/gdpr-workflow-asylum-dp1.md) - Blockchain's paradigm of tamper-resistant storage jars profoundly with the right to rectification and erasure, so blockchain solution architects should keep personal data off-chain.
* [Design principle DP2: Use a highly secure off-chain mapping architecture for attribution](../design-knowledge/gdpr-workflow-asylum-dp2.md) - If a use case requires that data on the blockchain be attributable to a natural person, use a highly secure off-chain mapping architecture.

# Citations
[1] Florian Guggenmos, Annette Wenninger, Alexander Rieger, Gilbert Fridgen, Jannik Lockl. How to Develop a GDPR-Compliant Blockchain Solution for Cross-Organizational Workflow Management: Evidence from the German Asylum Procedure. HICSS 53 (2020). https://hdl.handle.net/10125/64234
[2] Source document: How to Develop a GDPR-Compliant Blockchain Solution for cross-organizational workflow management.pdf
[3] Source evidence: Section 5 ("Design principles for GDPR-compliant blockchain design"), Design Principle 1 and Design Principle 2, article p. 4029-4030.
