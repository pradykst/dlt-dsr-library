---
type: paper
title: "Blockchain innovation for consent self-management in health information exchanges"
description: "Having established patients' desire to self-manage consent, the paper proposes a permissioned-blockchain solution enabling seamless sharing of patient consent across providers and HIEs, formalized through design requirements, principles and features and evaluated with a prototype."
resource: "https://doi.org/10.1016/j.dss.2023.114021"
authors: "Chad Anderson, Arthur Carvalho, Mala Kaul, Jeffrey W. Merhout"
year: 2023
venue: "Decision Support Systems 174 (2023) 114021"
methodology: "Design science research; patient survey of willingness to self-manage consent; instantiated prototype; quantitative evaluation."
dsr_grid: true
dsr_solution_space: "Instantiation (prototype) plus design principles (nascent design theory)."
tags:
  - consent-self-management-hie
  - healthcare
  - consent-management
  - privacy
  - interoperability
  - design-science-research
  - blockchain
timestamp: '2026-07-16T00:00:00+00:00'
---

# Blockchain innovation for consent self-management in health information exchanges

**Authors:** Chad Anderson, Arthur Carvalho, Mala Kaul, Jeffrey W. Merhout  
**Venue:** Decision Support Systems 174 (2023) 114021  
**Link:** https://doi.org/10.1016/j.dss.2023.114021

## Summary

Having established patients' desire to self-manage consent, the paper proposes a permissioned-blockchain solution enabling seamless sharing of patient consent across providers and HIEs, formalized through design requirements, principles and features and evaluated with a prototype.

## Artifact

A blockchain-based, self-managed patient consent system for health information exchanges (HIEs).

## Methodology

Design science research; patient survey of willingness to self-manage consent; instantiated prototype; quantitative evaluation.

## DSR grid

The six core dimensions of this DSR project, following the [DSR grid](../about-the-dsr-grid.md) (vom Brocke & Maedche, 2019):

* **Problem description.** Patients lack effective means to self-manage consent for sharing protected health information, and interoperability gaps and regulatory heterogeneity across health information exchanges (HIEs) compound the problem.
* **Input knowledge.** Digital patient-consent-management literature; trust; decision models for assessing blockchain suitability; HIE architectures and regulation.
* **Research process.** Design science research: a survey of patients' willingness to self-manage consent, followed by an instantiated prototype and quantitative evaluation.
* **Key concepts.** Patient consent, health information exchange, blockchain, protected health information, trust.
* **Solution description.** A permissioned-blockchain, self-managed patient consent system enabling seamless cross-HIE sharing of consent. Solution-space representation: Instantiation (prototype) plus design principles (nascent design theory).
* **Output knowledge.** Five design principles for patient consent self-management across HIEs.

The *output knowledge* of this project is captured as the atomic design-knowledge concepts listed below.

## Design knowledge

* [Design principle DP1: Authorization-restricted consent visibility](../design-knowledge/consent-self-management-hie-dp1.md) - Only HIEs and providers with authorization can view a patient's consent status, maintaining confidentiality.
* [Design principle DP2: Patient-only consent changes](../design-knowledge/consent-self-management-hie-dp2.md) - Only the patient can change their consent status, supporting self-management and engendering patient trust.
* [Design principle DP3: Auditable consent history](../design-knowledge/consent-self-management-hie-dp3.md) - The history of consent transactions between patients and the HIE must be auditable so that compliance with consent laws can be verified for all transactions.
* [Design principle DP4: Cross-HIE consent communication without central authority](../design-knowledge/consent-self-management-hie-dp4.md) - HIEs should be able to communicate consent status across HIEs without a central authority, supporting interoperability.
* [Design principle DP5: Patient-driven cross-HIE consent updates](../design-knowledge/consent-self-management-hie-dp5.md) - Enable patients to share changes in their consent status across HIEs.

# Citations
[1] Chad Anderson, Arthur Carvalho, Mala Kaul, Jeffrey W. Merhout. Blockchain innovation for consent self-management in health information exchanges. Decision Support Systems 174 (2023) 114021. https://doi.org/10.1016/j.dss.2023.114021
[2] Source document: Blockchain innovation for consent self-management in health information exchanges.pdf
