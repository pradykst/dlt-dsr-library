---
type: paper
title: "Designing a fair and inclusive digital asset-based name-image-likeness marketplace"
description: "Motivated by fairness and inclusiveness in student-athlete NIL monetization, the paper defines design requirements and three design principles - randomized royalty-paying collectible sales (inclusiveness), market-driven royalties (meritocracy), and blockchain as marketplace infrastructure - realized via NFTs and smart contracts."
resource: "https://doi.org/10.1016/j.dss.2025.114580"
authors: "Arthur Carvalho, Liudmila Zavolokina, Suman Bhunia, Gerhard Schwabe"
year: 2026
venue: "Decision Support Systems 201 (2026) 114580"
methodology: "Design science research; interviews with student-athletes; the inclusive-meritocratic fairness criterion; design features and evaluation."
dsr_grid: true
dsr_solution_space: "Instantiation plus design theory (requirements, principles and features)."
tags:
  - nil-marketplace-fair-inclusive
  - marketplace
  - fairness
  - nft
  - sports
  - design-science-research
  - blockchain
timestamp: '2026-07-16T00:00:00+00:00'
---

# Designing a fair and inclusive digital asset-based name-image-likeness marketplace

**Authors:** Arthur Carvalho, Liudmila Zavolokina, Suman Bhunia, Gerhard Schwabe  
**Venue:** Decision Support Systems 201 (2026) 114580  
**Link:** https://doi.org/10.1016/j.dss.2025.114580

## Summary

Motivated by fairness and inclusiveness in student-athlete NIL monetization, the paper defines design requirements and three design principles - randomized royalty-paying collectible sales (inclusiveness), market-driven royalties (meritocracy), and blockchain as marketplace infrastructure - realized via NFTs and smart contracts.

## Artifact

A blockchain/NFT-based name-image-likeness (NIL) marketplace for student-athletes.

## Methodology

Design science research; interviews with student-athletes; the inclusive-meritocratic fairness criterion; design features and evaluation.

## DSR grid

The six core dimensions of this DSR project, following the [DSR grid](../about-the-dsr-grid.md) (vom Brocke & Maedche, 2019):

* **Problem description.** Only a fraction of student-athletes profit from their name, image and likeness (NIL), raising fairness and inclusiveness concerns when sharing a limited amount of financial resources.
* **Input knowledge.** Fair division and distributive justice (including Aristotle's maxim); Roth's market-design theory; the possibility effect; the authors' inclusive-meritocratic fairness criterion; NFTs and smart contracts.
* **Research process.** Design science research: interviews with student-athletes, derivation of requirements, principles and features, and demonstration and evaluation.
* **Key concepts.** Blockchain, design science, fairness, inclusiveness, NIL, NFT.
* **Solution description.** An NFT-based NIL marketplace with randomized, royalty-paying primary sales and market-driven secondary-market royalties. Solution-space representation: Instantiation plus design theory (requirements, principles and features).
* **Output knowledge.** Five design requirements, three design principles and two design features satisfying inclusive-meritocratic fairness.

The *output knowledge* of this project is captured as the atomic design-knowledge concepts listed below.

## Design knowledge

### Design requirements (Fig. 1, Section 5.1)

* [Design requirement DR1: Inclusiveness](../design-knowledge/nil-marketplace-fair-inclusive-dr1.md) - NIL projects should provide all student-athletes with access to opportunities and resources.
* [Design requirement DR2: Meritocratic Allocation](../design-knowledge/nil-marketplace-fair-inclusive-dr2.md) - Relevant differences among student-athletes should be a driving factor when allocating NIL financial resources.
* [Design requirement DR3: Market Thickness](../design-knowledge/nil-marketplace-fair-inclusive-dr3.md) - Participants in market-based NIL projects should be able to find trading partners quickly.
* [Design requirement DR4: No Congestion](../design-knowledge/nil-marketplace-fair-inclusive-dr4.md) - Market-based NIL projects must overcome congestion by having fast transactions.
* [Design requirement DR5: Market Safety](../design-knowledge/nil-marketplace-fair-inclusive-dr5.md) - Market-based NIL initiatives must be safe for the student-athletes.

### Design principles (Section 5.2)

* [Design principle DP1: Plausible events (randomized collectible sales)](../design-knowledge/nil-marketplace-fair-inclusive-dp1.md) - Enable market-based randomized sales of royalty-paying collectibles so that every student-athlete has a non-zero chance of profiting from their NIL, satisfying the inclusiveness requirement via the possibility effect.
* [Design principle DP2: Market royalties (meritocratic allocation)](../design-knowledge/nil-marketplace-fair-inclusive-dp2.md) - Allow ex-post, market-driven adjustments to the initial allocation through royalties from secondary-market sales of collectibles, so that student-athletes are rewarded in proportion to relevant differences, satisfying meritocratic fairness.
* [Design principle DP3: Blockchain-based marketplace infrastructure](../design-knowledge/nil-marketplace-fair-inclusive-dp3.md) - Use blockchain technology as the foundational infrastructure - with transparent public ledgers and smart contracts - to create a well-functioning NIL collectibles marketplace that satisfies requirements for successful markets.

## Design features

Concrete, technology-specific realizations of the design principles in this artifact:

* [Design feature DF1: Primary Markets](../design-knowledge/nil-marketplace-fair-inclusive-df1.md) - Purchasing collectibles mints NFTs, and on monetary compensation a predetermined, hardcoded portion of the value is distributed as royalties among the associated student-athletes (randomized primary-market sales).
* [Design feature DF2: Market Exchanges](../design-knowledge/nil-marketplace-fair-inclusive-df2.md) - Minted NFTs that pay royalties to student-athletes can be traded in secondary markets; deterministic secondary-market sales implement the meritocratic-allocation principle.

Fig. 1 ("Design requirements (DR), principles (DP), and features (DF)", article p. 5) depicts an unambiguous, non-crossing DR->DP derivation: DR1->DP1, DR2->DP2, DR3/DR4/DR5->DP3, each also confirmed by explicit prose in Section 5.2 and Section 6.

# Citations
[1] Arthur Carvalho, Liudmila Zavolokina, Suman Bhunia, Gerhard Schwabe. Designing a fair and inclusive digital asset-based name-image-likeness marketplace. Decision Support Systems 201 (2026) 114580. https://doi.org/10.1016/j.dss.2025.114580
[2] Source document: Designing a fair and inclusive digital asset-based name-image-likeness marketplace.pdf
[3] Source evidence: Fig. 1 (article p. 5); Section 5.1 "Design requirements" (article pp. 4-5, DR#1-DR#5 individually numbered and labelled); Section 5.2 "Design principles" (article pp. 5-6); Section 6 "Design evaluation" (article p. 8, confirming the same DR->DP mapping in prose).
