---
type: paper
title: "Blockchain innovation for consent self-management in health information exchanges"
description: "Having established patients' desire to self-manage consent, the paper proposes a permissioned-blockchain solution enabling seamless sharing of patient consent across providers and HIEs, formalized through five design requirements, five design principles and five design features, and evaluated with a prototype."
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

Having established patients' desire to self-manage consent, the paper proposes a permissioned-blockchain solution enabling seamless sharing of patient consent across providers and HIEs, formalized through five design requirements, five design principles and five design features, and evaluated with a prototype.

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
* **Output knowledge.** Five design requirements, five design principles, and five design features for patient consent self-management across HIEs.

The *output knowledge* of this project is captured as the atomic design-knowledge concepts listed below.

## Design knowledge

* [Design requirement DR1: Privacy](../design-knowledge/consent-self-management-hie-dr1.md) - Patient consent self-management must support patients' privacy preferences, since the exposure of protected health information to unauthorized entities can be detrimental to patients and healthcare organizations are federally mandated to secure PHI privacy under HIPAA.
* [Design requirement DR2: Self-management](../design-knowledge/consent-self-management-hie-dr2.md) - The solution must support patients' self-management of their own consent data, reflecting patients' rights to notice, access, and consent over the collection, use and disclosure of their personal data.
* [Design requirement DR3: Trust](../design-knowledge/consent-self-management-hie-dr3.md) - The solution must build and maintain patient trust in health information exchange by giving patients control over and visibility into their consent relationships, since patient trust is critical to the rights patients have to control the sharing of their protected health information.
* [Design requirement DR4: Compliance](../design-knowledge/consent-self-management-hie-dr4.md) - The solution must have the flexibility to comply with the variable body of federal and state regulatory rules governing patient consent for PHI sharing, since healthcare providers must comply with these regulations for the patient data they manage.
* [Design requirement DR5: Interoperability](../design-knowledge/consent-self-management-hie-dr5.md) - The solution must be interoperable across the currently fragmented health information exchange infrastructure to enable full self-management of consent, since the range of HIE organizational forms is each designed to support connectivity for only a limited set of entities.
* [Design principle DP1: Authorization-restricted consent visibility](../design-knowledge/consent-self-management-hie-dp1.md) - Only HIEs and providers with authorization can view a patient's consent status, maintaining confidentiality.
* [Design principle DP2: Patient-only consent changes](../design-knowledge/consent-self-management-hie-dp2.md) - Only the patient can change their consent status, supporting self-management and engendering patient trust.
* [Design principle DP3: Auditable consent history](../design-knowledge/consent-self-management-hie-dp3.md) - The history of consent transactions between patients and the HIE must be auditable so that compliance with consent laws can be verified for all transactions.
* [Design principle DP4: Cross-HIE consent communication without central authority](../design-knowledge/consent-self-management-hie-dp4.md) - HIEs should be able to communicate consent status across HIEs without a central authority, supporting interoperability.
* [Design principle DP5: Patient-driven cross-HIE consent updates](../design-knowledge/consent-self-management-hie-dp5.md) - Enable patients to share changes in their consent status across HIEs.

## Design features

Concrete, technology-specific realizations of the design principles in this artifact:

* [Design feature DF1: Encryption](../design-knowledge/consent-self-management-hie-df1.md) - Blockchain wallets store and seamlessly use private keys to digitally sign blockchain transactions, providing encryption for consent transactions.
* [Design feature DF2: Key management](../design-knowledge/consent-self-management-hie-df2.md) - Blockchain wallets manage the cryptographic keys that authenticate users and facilitate the creation of blockchain transactions.
* [Design feature DF3: Immutability](../design-knowledge/consent-self-management-hie-df3.md) - Consent transactions are never erased; a previous transaction remains, and any change is added as a new transaction to the append-only blockchain data structure.
* [Design feature DF4: Decentralization](../design-knowledge/consent-self-management-hie-df4.md) - A user can connect and submit a consent transaction to a single HIE without the need for a central, trusted entity to mediate the exchange.
* [Design feature DF5: Distribution](../design-knowledge/consent-self-management-hie-df5.md) - A consent transaction submitted to a single HIE is shared with all blockchain network nodes (HIEs), eventually becoming available to all HIEs.

# Citations
[1] Chad Anderson, Arthur Carvalho, Mala Kaul, Jeffrey W. Merhout. Blockchain innovation for consent self-management in health information exchanges. Decision Support Systems 174 (2023) 114021. https://doi.org/10.1016/j.dss.2023.114021
[2] Source document: Blockchain innovation for consent self-management in health information exchanges.pdf
[3] Source evidence: Fig. 3 "Design requirements, principles, and features" (article p. 8) formally diagrams all 5 requirements (Sections 5.1-5.5, article p. 6-7), the existing 5 design principles, and 5 design features, with explicit arrows; Section 6 (article p. 7) gives the literal DR->DP prose mapping ("The requirement for privacy can be met through the design principle (DP1)..." etc.); Section 7 (article p. 7-9) gives the literal DP->DF prose mapping ("Blockchain wallets encapsulate the design features 'encryption' and 'key management' in Fig. 3 that satisfy DP1 and DP2"; "the design feature 'immutability' in Fig. 3 that satisfies DP3"; "the design features 'decentralization' and 'distribution' in Fig. 3 that satisfy DP4 and DP5"). This resolves a session-long blocker: `coverage-audit.test.ts` previously pinned this paper's missing DRs/DFs as an intended permanent warning; per explicit human authorization this session, the pinned assertion was narrowly updated to reflect the corpus now canonicalizing this paper's own formally diagrammed and textually cross-referenced design knowledge.
