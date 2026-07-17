---
type: paper
title: "Designing GDPR Compliant Credential Verification Using Blockchain: A Design Science Research Approach"
description: "The paper derives meta-requirements and three design principles for a GDPR-compliant blockchain-based credential verification system: use blockchain for trustworthy transparent verification with legitimate documents, use smart contracts to automate the process, and conform to GDPR via off-chain storage and zero-knowledge proofs."
resource: "https://aisel.aisnet.org/ecis2024/track16_fintech/track16_fintech/5"
authors: "Janne Parkkila, AKM Bahalul Haque, Jaakko Vuolasto, Anastasiia Gurzhii, Sami Hyrynsalmi, Najmul Islam"
year: 2024
venue: "ECIS 2024 Proceedings"
methodology: "Design science research; interviews; meta-requirements; prototype using off-chain storage and zero-knowledge proofs."
dsr_grid: true
dsr_solution_space: "Instantiation (prototype) plus meta-requirements and three design principles."
tags:
  - gdpr-credential-verification
  - identity-ssi
  - gdpr-privacy
  - credential-verification
  - zero-knowledge
  - design-science-research
  - blockchain
timestamp: '2026-07-16T00:00:00+00:00'
---

# Designing GDPR Compliant Credential Verification Using Blockchain: A Design Science Research Approach

**Authors:** Janne Parkkila, AKM Bahalul Haque, Jaakko Vuolasto, Anastasiia Gurzhii, Sami Hyrynsalmi, Najmul Islam  
**Venue:** ECIS 2024 Proceedings  
**Link:** https://aisel.aisnet.org/ecis2024/track16_fintech/track16_fintech/5

## Summary

The paper derives meta-requirements and three design principles for a GDPR-compliant blockchain-based credential verification system: use blockchain for trustworthy transparent verification with legitimate documents, use smart contracts to automate the process, and conform to GDPR via off-chain storage and zero-knowledge proofs.

## Artifact

A GDPR-compliant blockchain-based credential (certificate) verification system.

## Methodology

Design science research; interviews; meta-requirements; prototype using off-chain storage and zero-knowledge proofs.

## DSR grid

The six core dimensions of this DSR project, following the [DSR grid](../about-the-dsr-grid.md) (vom Brocke & Maedche, 2019):

* **Problem description.** Credential and certificate verification is manual, slow and costly, and blockchain-based solutions must comply with the GDPR.
* **Input knowledge.** Self-sovereign identity; zero-knowledge proofs; GDPR; off-chain storage; digital-identity-management literature.
* **Research process.** Design science research: interviews, derivation of meta-requirements, and a prototype using off-chain storage, ZKPs and Polygon ID.
* **Key concepts.** Self-sovereign identity, blockchain, zero-knowledge, GDPR compliance, digital identity.
* **Solution description.** A GDPR-compliant blockchain credential-verification system storing documents off-chain (hashes on-chain) and using ZKPs. Solution-space representation: Instantiation (prototype) plus meta-requirements and three design principles.
* **Output knowledge.** Four meta-requirements and three design principles for GDPR-compliant credential verification.

The *output knowledge* of this project is captured as the atomic design-knowledge concepts listed below.

## Design knowledge

* [Meta-requirement MR1: Verify with original documents](../design-knowledge/gdpr-credential-verification-mr1.md) - The verification system should only use the candidate's original documents to verify the credentials.
* [Meta-requirement MR2: Automated verification](../design-knowledge/gdpr-credential-verification-mr2.md) - The verification system should be automated to ensure quick turnaround time and reduce manual work.
* [Meta-requirement MR3: Easy-to-use, easily integrated interface](../design-knowledge/gdpr-credential-verification-mr3.md) - The verification system should have an easy-to-use interface for all kinds of users and be integrable into existing systems with minimal effort.
* [Meta-requirement MR4: Data-protection conformance](../design-knowledge/gdpr-credential-verification-mr4.md) - The verification system should conform to available data-protection and privacy regulations so that data ownership and access control are ensured.
* [Design principle DP1: Blockchain for trustworthy multi-party verification](../design-knowledge/gdpr-credential-verification-dp1.md) - Use blockchain to enable trustworthy and transparent user-credential verification with legitimate documents among multiple parties, since immutable entries and multi-party participation ensure only...
* [Design principle DP2: Smart contracts to automate verification](../design-knowledge/gdpr-credential-verification-dp2.md) - Use smart contracts to automate the whole process, remove manual intervention of third parties and ensure quick turnaround time.
* [Design principle DP3: GDPR conformance via off-chain storage and ZKPs](../design-knowledge/gdpr-credential-verification-dp3.md) - Conform to GDPR by storing actual documents off-chain (only hashes on-chain) and using zero-knowledge proofs and user-held identity so that data ownership and access control are ensured.

# Citations
[1] Janne Parkkila, AKM Bahalul Haque, Jaakko Vuolasto, Anastasiia Gurzhii, Sami Hyrynsalmi, Najmul Islam. Designing GDPR Compliant Credential Verification Using Blockchain: A Design Science Research Approach. ECIS 2024 Proceedings. https://aisel.aisnet.org/ecis2024/track16_fintech/track16_fintech/5
[2] Source document: Designing GDPR Compliant Credential Verification Using Blockchain.pdf
