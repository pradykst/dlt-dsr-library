---
type: paper
title: "Design of a forgetting blockchain: A possible way to accomplish GDPR compatibility"
description: "The paper builds a proof-of-concept 'forgetting' blockchain that maintains most key blockchain features while deleting old data to support GDPR, and derives principles for designing data-protection-compliant blockchains."
resource: "https://hdl.handle.net/10125/59571"
authors: "Simon Farshid, Andreas Reitz"
year: 2019
venue: "HICSS 52 (2019)"
methodology: "Design science research; prototype (state pruning plus custom deletion function); expert evaluation."
dsr_grid: true
dsr_solution_space: "Instantiation (proof-of-concept prototype) plus derived design principles/lessons."
tags:
  - forgetting-blockchain-gdpr
  - gdpr-privacy
  - blockchain-architecture
  - data-deletion
  - right-to-erasure
  - design-science-research
  - blockchain
timestamp: '2026-07-16T00:00:00+00:00'
---

# Design of a forgetting blockchain: A possible way to accomplish GDPR compatibility

**Authors:** Simon Farshid, Andreas Reitz  
**Venue:** HICSS 52 (2019)  
**Link:** https://hdl.handle.net/10125/59571

## Summary

The paper builds a proof-of-concept 'forgetting' blockchain that maintains most key blockchain features while deleting old data to support GDPR, and derives principles for designing data-protection-compliant blockchains.

## Artifact

A working proof-of-concept prototype of a blockchain that deletes predefined data after a predefined time.

## Methodology

Design science research; prototype (state pruning plus custom deletion function); expert evaluation.

## DSR grid

The six core dimensions of this DSR project, following the [DSR grid](../about-the-dsr-grid.md) (vom Brocke & Maedche, 2019):

* **Problem description.** Blockchain immutability conflicts with the need - and the GDPR requirement - to delete submitted data once it is no longer needed.
* **Input knowledge.** GDPR and the right to erasure; the state-pruning technique; weak subjectivity; exaptation as a DSR contribution type.
* **Research process.** Design science research: a proof-of-concept prototype (state pruning plus a custom deletion function), evaluated with domain experts.
* **Key concepts.** Blockchain, GDPR, data deletion, right to erasure, state pruning.
* **Solution description.** A 'forgetting' blockchain prototype that deletes predefined data after a predefined time while retaining most key blockchain features. Solution-space representation: Instantiation (proof-of-concept prototype) plus derived design principles/lessons.
* **Output knowledge.** Design principles and lessons for designing data-protection-compliant (forgetting) blockchains.

The *output knowledge* of this project is captured as the atomic design-knowledge concepts listed below.

## Design knowledge

* [Design principle DP: Principles for designing data-protection-compliant (forgetting) blockchains](../design-knowledge/forgetting-blockchain-gdpr-dp.md) - The derived guidance for data-protection-compliant blockchains includes:

# Citations
[1] Simon Farshid, Andreas Reitz. Design of a forgetting blockchain: A possible way to accomplish GDPR compatibility. HICSS 52 (2019). https://hdl.handle.net/10125/59571
[2] Source document: Design of a forgetting blockchain.pdf
