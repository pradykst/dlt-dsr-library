---
type: paper
title: "Blockchain-based token system for incentivizing peer review: A design science approach"
description: "The paper proposes formal design principles for peer-review incentive mechanisms and a concrete blockchain-based token system that lets editors offer incentives while reviewers flexibly utilize them, implemented through the design features of tokenization, immutability and decentralized storage."
resource: "https://doi.org/10.1016/j.dss.2025.114514"
authors: "Chad Anderson, Pratiksha Shrestha, Suman Bhunia, Arthur Carvalho, Younghwa Lee"
year: 2025
venue: "Decision Support Systems 197 (2025) 114514"
methodology: "Design science research; literature review and interviews with scholars; cost analysis; survey-based field study and qualitative interviews."
dsr_grid: true
dsr_solution_space: "Instantiation (prototype) plus a formal design theory (principles and features)."
tags:
  - peer-review-token-incentives
  - peer-review
  - incentives
  - tokenization
  - trust
  - design-science-research
  - blockchain
timestamp: '2026-07-16T00:00:00+00:00'
---

# Blockchain-based token system for incentivizing peer review: A design science approach

**Authors:** Chad Anderson, Pratiksha Shrestha, Suman Bhunia, Arthur Carvalho, Younghwa Lee  
**Venue:** Decision Support Systems 197 (2025) 114514  
**Link:** https://doi.org/10.1016/j.dss.2025.114514

## Summary

The paper proposes formal design principles for peer-review incentive mechanisms and a concrete blockchain-based token system that lets editors offer incentives while reviewers flexibly utilize them, implemented through the design features of tokenization, immutability and decentralized storage.

## Artifact

A blockchain-based token system enabling editors to offer flexible review incentives.

## Methodology

Design science research; literature review and interviews with scholars; cost analysis; survey-based field study and qualitative interviews.

## DSR grid

The six core dimensions of this DSR project, following the [DSR grid](../about-the-dsr-grid.md) (vom Brocke & Maedche, 2019):

* **Problem description.** Editors struggle to secure sufficient reviewers, leading to prolonged review times and potentially diminished review quality.
* **Input knowledge.** Self-determination theory (types of motivation/regulation) and Vroom's expectancy theory as justificatory knowledge; trust in IS use; tokenization; literature on peer review.
* **Research process.** Design science research: literature review and interviews with scholars, a cost analysis, and a survey-based field study with qualitative interviews.
* **Key concepts.** Peer review, design science, blockchain, incentives, flexibility, tokenization, trust.
* **Solution description.** A blockchain-based token system that lets editors offer flexible reviewer incentives through tokenization, immutability and decentralization. Solution-space representation: Instantiation (prototype) plus a formal design theory (principles and features).
* **Output knowledge.** Three design principles (incentives, flexibility, trust) and three design features, framed as a formal design theory for peer-review systems.

The *output knowledge* of this project is captured as the atomic design-knowledge concepts listed below.

## Design knowledge

* [Design principle DP1: Motivation-appropriate incentives](../design-knowledge/peer-review-token-incentives-dp1.md) - Provide incentives to reviewers that appeal to their specific motivations, since understanding and leveraging different types of motivation ensures the system effectively encourages participation.
* [Design principle DP2: Flexibility](../design-knowledge/peer-review-token-incentives-dp2.md) - Support customizable functionality that can accommodate varying incentive schemes depending on the specific needs and preferences of each journal, since flexibility increases the likelihood of securing enough willing reviewers while respecting the diversity in reviewer motivations.
* [Design principle DP3: Trust](../design-knowledge/peer-review-token-incentives-dp3.md) - Ensure that reviewers' identities are protected in blind review processes and that incentives are allocated properly, since trust in the peer review process is critical for maintaining the credibility of published research.

## Design features

Concrete, technology-specific realizations of the design principles in this artifact:

* [Design feature DF1: Tokenization](../design-knowledge/peer-review-token-incentives-df1.md) - Tokenization creates unique digital representations of incentives, with non-fungible and fungible tokens enabling different types of extrinsic incentive.
* [Design feature DF2: Immutability](../design-knowledge/peer-review-token-incentives-df2.md) - Blockchain immutability ensures that recorded incentive and reward data cannot be altered or deleted, guaranteeing integrity.
* [Design feature DF3: Decentralization](../design-knowledge/peer-review-token-incentives-df3.md) - Decentralized storage across a distributed network removes central authorities and single points of failure and avoids vendor lock-in.

# Citations
[1] Chad Anderson, Pratiksha Shrestha, Suman Bhunia, Arthur Carvalho, Younghwa Lee. Blockchain-based token system for incentivizing peer review: A design science approach. Decision Support Systems 197 (2025) 114514. https://doi.org/10.1016/j.dss.2025.114514
[2] Source document: Blockchain-based token system for incentivizing peer review.pdf
[3] Source evidence: DP1-DP3 tabled per Gregor et al. schema in Tables 3-5 (article p. 4-5); DF1-DF3 defined in Section 5 and explicitly linked to DP1-DP3 in Fig. 2 and accompanying prose (article p. 5), confirming no design-requirements layer exists in this paper.
