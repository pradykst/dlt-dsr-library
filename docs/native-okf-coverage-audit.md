# Native OKF coverage audit

This offline audit separates format/link validity from semantic coverage. Warnings are signals for researcher review, not proof that the canonical data is wrong. It never creates or modifies OKF concepts.

## Validity boundaries

- OKF version: 0.1
- Markdown files: 442
- Concepts: 438
- Papers: 34
- Native format valid: yes (0 fatal errors)
- Internal links valid: yes (0 broken-link warnings)
- Semantic coverage complete: not asserted; review the warnings below.

## Corpus distribution

- design-goal + design-principle: 1
- design-objective: 4
- design-objective + design-principle: 3
- design-objective + design-requirement + design-principle: 2
- design-objective + meta-requirement + design-principle: 1
- design-principle: 8
- design-principle + design-feature: 1
- design-requirement: 1
- design-requirement + design-principle: 2
- design-requirement + design-principle + design-feature: 5
- meta-requirement: 1
- meta-requirement + design-principle: 2
- meta-requirement + design-principle + design-feature: 2
- no associated design knowledge: 1

## Papers with potential missing explicit categories

- `papers/certified-data-chats-used-cars`
- `papers/cross-org-workflow-objectives`
- `papers/forgetting-blockchain-gdpr`
- `papers/quality-management-production`
- `papers/short-end-opportunism-sharing`

## Per-paper audit

### Aligning the interests of newsvendors and forecasters through blockchain-based smart contracts and proper scoring rules

- Paper ID: `papers/aligning-newsvendors-scoring-rules`
- Semantic relationships: 0
- Requirements present: no
- Principles present: yes
- Features present: no
- Objectives, goals, or meta-requirements present: no
- Native concept counts:
  - design-principle: 3
- Explicit count statements:
  - Three design principles: stated 3 design-principle
- Potential representation warnings:
  - none

### From ambivalence to trust: Using blockchain in customer loyalty programs

- Paper ID: `papers/ambivalence-trust-loyalty`
- Semantic relationships: 14
- Requirements present: yes
- Principles present: yes
- Features present: no
- Objectives, goals, or meta-requirements present: yes
- Native concept counts:
  - design-objective: 6
  - design-requirement: 14
  - design-principle: 4
- Explicit count statements:
  - six design objectives: stated 6 design-objective
  - four design principles: stated 4 design-principle
  - fourteen design requirements: stated 14 design-requirement
- Potential representation warnings:
  - none

### Developing Blockchain-enabled Marketplace Interfaces: A Design Science Research Study

- Paper ID: `papers/bemi-marketplace-interfaces`
- Semantic relationships: 26
- Requirements present: no
- Principles present: yes
- Features present: yes
- Objectives, goals, or meta-requirements present: yes
- Native concept counts:
  - meta-requirement: 10
  - design-principle: 8
  - design-feature: 16
- Explicit count statements:
  - sixteen design features: stated 16 design-feature
  - eight design principles: stated 8 design-principle
  - ten meta-requirements: stated 10 meta-requirement
- Potential representation warnings:
  - none

### Blockchain for the IoT: Privacy-Preserving Protection of Sensor Data

- Paper ID: `papers/blockchain-iot-sensor-data`
- Semantic relationships: 14
- Requirements present: yes
- Principles present: yes
- Features present: yes
- Objectives, goals, or meta-requirements present: no
- Native concept counts:
  - design-requirement: 4
  - design-principle: 4
  - design-feature: 9
- Explicit count statements:
  - nine design features: stated 9 design-feature
  - four design principles: stated 4 design-principle
  - four design requirements: stated 4 design-requirement
- Potential representation warnings:
  - none

### Designing the future of bond markets: Reducing transaction costs through tokenization

- Paper ID: `papers/bond-markets-tokenization-tac`
- Semantic relationships: 14
- Requirements present: no
- Principles present: yes
- Features present: no
- Objectives, goals, or meta-requirements present: yes
- Native concept counts:
  - design-objective: 5
  - meta-requirement: 7
  - design-principle: 5
- Explicit count statements:
  - five design objectives: stated 5 design-objective
  - five design principles: stated 5 design-principle
  - Seven meta-requirements: stated 7 meta-requirement
- Potential representation warnings:
  - none

### Certified data chats for future used car markets

- Paper ID: `papers/certified-data-chats-used-cars`
- Semantic relationships: 3
- Requirements present: no
- Principles present: yes
- Features present: no
- Objectives, goals, or meta-requirements present: yes
- Native concept counts:
  - design-goal: 3
  - design-principle: 3
- Explicit count statements:
  - Three design goals: stated 3 design-goal
  - three design principles: stated 3 design-principle
- Potential representation warnings:
  - [mentioned-category-missing] Paper text mentions design features, but no design-feature concept is associated with the paper.

### Blockchain innovation for consent self-management in health information exchanges

- Paper ID: `papers/consent-self-management-hie`
- Semantic relationships: 16
- Requirements present: yes
- Principles present: yes
- Features present: yes
- Objectives, goals, or meta-requirements present: no
- Native concept counts:
  - design-requirement: 5
  - design-principle: 5
  - design-feature: 5
- Explicit count statements:
  - 5 design features: stated 5 design-feature
  - five design features: stated 5 design-feature
  - 5 design principles: stated 5 design-principle
  - five design principles: stated 5 design-principle
  - Five design requirements: stated 5 design-requirement
- Potential representation warnings:
  - none

### Using Blockchain to Sustainably Manage Containers in International Shipping

- Paper ID: `papers/containers-shipping-sustainable`
- Semantic relationships: 0
- Requirements present: no
- Principles present: yes
- Features present: no
- Objectives, goals, or meta-requirements present: no
- Native concept counts:
  - design-principle: 2
- Explicit count statements:
  - none detected
- Potential representation warnings:
  - none

### Designing a cross-organizational identity management system: Utilizing SSI for the certification of retailer attributes

- Paper ID: `papers/cross-org-identity-ssi`
- Semantic relationships: 0
- Requirements present: no
- Principles present: yes
- Features present: no
- Objectives, goals, or meta-requirements present: yes
- Native concept counts:
  - design-objective: 8
  - design-principle: 4
- Explicit count statements:
  - eight design objectives: stated 8 design-objective
  - four design principles: stated 4 design-principle
- Potential representation warnings:
  - none

### Cross-Organizational Workflow Management Using Blockchain Technology - Towards Applicability, Auditability, and Automation

- Paper ID: `papers/cross-org-workflow-objectives`
- Semantic relationships: 0
- Requirements present: no
- Principles present: no
- Features present: no
- Objectives, goals, or meta-requirements present: yes
- Native concept counts:
  - design-objective: 10
- Explicit count statements:
  - Nine design objectives: stated 9 design-objective
- Potential representation warnings:
  - [explicit-count-conflict] Text states "Nine design objectives" (9), but 10 associated design-objective concepts are represented.

### Decentralized Procurement Mechanisms for Efficient Logistics Services Mapping - a Design Science Research Approach

- Paper ID: `papers/decentralized-procurement-logistics`
- Semantic relationships: 0
- Requirements present: no
- Principles present: yes
- Features present: no
- Objectives, goals, or meta-requirements present: no
- Native concept counts:
  - design-principle: 3
- Explicit count statements:
  - none detected
- Potential representation warnings:
  - none

### Overcoming the Data Transparency Trade-Off: Designing a Blockchain-Based Delivery Invoice System for the Construction Industry

- Paper ID: `papers/delivery-invoice-transparency`
- Semantic relationships: 5
- Requirements present: no
- Principles present: yes
- Features present: no
- Objectives, goals, or meta-requirements present: yes
- Native concept counts:
  - design-objective: 3
  - design-principle: 3
- Explicit count statements:
  - Three design objectives: stated 3 design-objective
  - three design principles: stated 3 design-principle
- Potential representation warnings:
  - none

### From Dissonance to Dialogue: A Token-Based Approach to Bridge the Gap Between Manufacturers and Customers

- Paper ID: `papers/dissonance-dialogue-recall`
- Semantic relationships: 28
- Requirements present: yes
- Principles present: yes
- Features present: yes
- Objectives, goals, or meta-requirements present: no
- Native concept counts:
  - design-requirement: 5
  - design-principle: 6
  - design-feature: 8
- Explicit count statements:
  - 8 design features: stated 8 design-feature
  - eight design features: stated 8 design-feature
  - 6 design principles: stated 6 design-principle
  - six design principles: stated 6 design-principle
  - 5 design requirements: stated 5 design-requirement
  - Five design requirements: stated 5 design-requirement
- Potential representation warnings:
  - none

### Blockchain-based digital rights management systems: Design principles for the music industry

- Paper ID: `papers/drm-music-industry`
- Semantic relationships: 9
- Requirements present: yes
- Principles present: yes
- Features present: yes
- Objectives, goals, or meta-requirements present: no
- Native concept counts:
  - design-requirement: 3
  - design-principle: 3
  - design-feature: 4
- Explicit count statements:
  - four design features: stated 4 design-feature
  - three design principles: stated 3 design-principle
  - Three design requirements: stated 3 design-requirement
- Potential representation warnings:
  - none

### Design of a forgetting blockchain: A possible way to accomplish GDPR compatibility

- Paper ID: `papers/forgetting-blockchain-gdpr`
- Semantic relationships: 0
- Requirements present: no
- Principles present: no
- Features present: no
- Objectives, goals, or meta-requirements present: no
- Native concept counts:
  - none
- Explicit count statements:
  - none detected
- Potential representation warnings:
  - [mentioned-category-missing] Paper text mentions design features, but no design-feature concept is associated with the paper.

### Designing GDPR Compliant Credential Verification Using Blockchain: A Design Science Research Approach

- Paper ID: `papers/gdpr-credential-verification`
- Semantic relationships: 5
- Requirements present: no
- Principles present: yes
- Features present: no
- Objectives, goals, or meta-requirements present: yes
- Native concept counts:
  - meta-requirement: 4
  - design-principle: 3
- Explicit count statements:
  - three design principles: stated 3 design-principle
  - Four meta-requirements: stated 4 meta-requirement
- Potential representation warnings:
  - none

### How to Develop a GDPR-Compliant Blockchain Solution for Cross-Organizational Workflow Management: Evidence from the German Asylum Procedure

- Paper ID: `papers/gdpr-workflow-asylum`
- Semantic relationships: 0
- Requirements present: no
- Principles present: yes
- Features present: no
- Objectives, goals, or meta-requirements present: no
- Native concept counts:
  - design-principle: 2
- Explicit count statements:
  - none detected
- Potential representation warnings:
  - none

### Design Principles for Blockchain-based Applications in Green Bond Reporting

- Paper ID: `papers/green-bond-reporting-dp`
- Semantic relationships: 0
- Requirements present: no
- Principles present: yes
- Features present: no
- Objectives, goals, or meta-requirements present: no
- Native concept counts:
  - design-principle: 6
- Explicit count statements:
  - Six design principles: stated 6 design-principle
- Potential representation warnings:
  - none

### Designing a Framework for Digital KYC Processes Built on Blockchain-Based Self-Sovereign Identity

- Paper ID: `papers/kyc-framework-ssi`
- Semantic relationships: 16
- Requirements present: yes
- Principles present: yes
- Features present: no
- Objectives, goals, or meta-requirements present: yes
- Native concept counts:
  - design-objective: 6
  - design-requirement: 16
  - design-principle: 3
- Explicit count statements:
  - six design objectives: stated 6 design-objective
  - three design principles: stated 3 design-principle
- Potential representation warnings:
  - none

### Know-Your-Customer (KYC) Requirements for Initial Coin Offerings: Toward Designing a Compliant-by-Design KYC-System Based on Blockchain Technology

- Paper ID: `papers/kyc-ico-requirements`
- Semantic relationships: 0
- Requirements present: no
- Principles present: no
- Features present: no
- Objectives, goals, or meta-requirements present: yes
- Native concept counts:
  - design-objective: 10
- Explicit count statements:
  - none detected
- Potential representation warnings:
  - none

### Requirements and Design Principles for Blockchain-enabled Matchmaking-Marketplaces in Additive Manufacturing

- Paper ID: `papers/matchmaking-additive-manufacturing`
- Semantic relationships: 12
- Requirements present: no
- Principles present: yes
- Features present: no
- Objectives, goals, or meta-requirements present: yes
- Native concept counts:
  - meta-requirement: 12
  - design-principle: 12
- Explicit count statements:
  - 12 design principles: stated 12 design-principle
  - twelve design principles: stated 12 design-principle
- Potential representation warnings:
  - none

### Meta-requirements for the Design of a Blockchain-enabled Multi-sided Platform for Sustainability and Circular Economy

- Paper ID: `papers/msp-sustainability-circular`
- Semantic relationships: 0
- Requirements present: no
- Principles present: no
- Features present: no
- Objectives, goals, or meta-requirements present: yes
- Native concept counts:
  - meta-requirement: 6
- Explicit count statements:
  - Six meta-requirements: stated 6 meta-requirement
- Potential representation warnings:
  - none

### Designing a fair and inclusive digital asset-based name-image-likeness marketplace

- Paper ID: `papers/nil-marketplace-fair-inclusive`
- Semantic relationships: 8
- Requirements present: yes
- Principles present: yes
- Features present: yes
- Objectives, goals, or meta-requirements present: no
- Native concept counts:
  - design-requirement: 5
  - design-principle: 3
  - design-feature: 2
- Explicit count statements:
  - two design features: stated 2 design-feature
  - three design principles: stated 3 design-principle
  - Five design requirements: stated 5 design-requirement
- Potential representation warnings:
  - none

### Blockchain-based token system for incentivizing peer review: A design science approach

- Paper ID: `papers/peer-review-token-incentives`
- Semantic relationships: 4
- Requirements present: no
- Principles present: yes
- Features present: yes
- Objectives, goals, or meta-requirements present: no
- Native concept counts:
  - design-principle: 3
  - design-feature: 3
- Explicit count statements:
  - three design features: stated 3 design-feature
  - Three design principles: stated 3 design-principle
- Potential representation warnings:
  - none

### Designing a blockchain-based information system for procurement processes - Balancing decentralization, scalability, and security while maintaining privacy

- Paper ID: `papers/procurement-is-trilemma`
- Semantic relationships: 5
- Requirements present: no
- Principles present: yes
- Features present: no
- Objectives, goals, or meta-requirements present: yes
- Native concept counts:
  - design-objective: 5
  - design-principle: 2
- Explicit count statements:
  - five design objectives: stated 5 design-objective
  - two design principles: stated 2 design-principle
- Potential representation warnings:
  - none

### Digging for Quality Management in Production Systems: A Solution Space for Blockchain Collaborations

- Paper ID: `papers/quality-management-production`
- Semantic relationships: 0
- Requirements present: no
- Principles present: yes
- Features present: no
- Objectives, goals, or meta-requirements present: no
- Native concept counts:
  - design-principle: 6
- Explicit count statements:
  - Six design principles: stated 6 design-principle
- Potential representation warnings:
  - [mentioned-category-missing] Paper text mentions design features, but no design-feature concept is associated with the paper.
  - [mentioned-category-missing] Paper text mentions design requirements, but no design-requirement concept is associated with the paper.
  - [mentioned-category-missing] Paper text mentions meta-requirements, but no meta-requirement concept is associated with the paper.

### Blockchain to Rule the Waves - Nascent Design Principles for Reducing Risk and Uncertainty in Decentralized Environments

- Paper ID: `papers/rule-the-waves-shipping`
- Semantic relationships: 0
- Requirements present: no
- Principles present: yes
- Features present: no
- Objectives, goals, or meta-requirements present: no
- Native concept counts:
  - design-principle: 4
- Explicit count statements:
  - none detected
- Potential representation warnings:
  - none

### And No One Gets the Short End of the Stick: A Blockchain-Based Approach to Solving the Two-Sided Opportunism Problem in Interorganizational Information Sharing

- Paper ID: `papers/short-end-opportunism-sharing`
- Semantic relationships: 6
- Requirements present: yes
- Principles present: yes
- Features present: no
- Objectives, goals, or meta-requirements present: no
- Native concept counts:
  - design-requirement: 2
  - design-principle: 3
- Explicit count statements:
  - Three design principles: stated 3 design-principle
- Potential representation warnings:
  - [mentioned-category-missing] Paper text mentions design features, but no design-feature concept is associated with the paper.

### Striking a balance: Designing a blockchain-based solution to navigate coopetition dynamics in supply chain management

- Paper ID: `papers/striking-balance-coopetition`
- Semantic relationships: 0
- Requirements present: no
- Principles present: no
- Features present: no
- Objectives, goals, or meta-requirements present: yes
- Native concept counts:
  - design-objective: 8
- Explicit count statements:
  - Eight design objectives: stated 8 design-objective
- Potential representation warnings:
  - none

### Trading Green Bonds Using Distributed Ledger Technology

- Paper ID: `papers/trading-green-bonds-dlt`
- Semantic relationships: 0
- Requirements present: yes
- Principles present: no
- Features present: no
- Objectives, goals, or meta-requirements present: no
- Native concept counts:
  - design-requirement: 14
- Explicit count statements:
  - none detected
- Potential representation warnings:
  - none

### Designing trust-enabling blockchain systems for the inter-organizational exchange of capacity

- Paper ID: `papers/trust-enabling-capacity-exchange`
- Semantic relationships: 14
- Requirements present: no
- Principles present: yes
- Features present: yes
- Objectives, goals, or meta-requirements present: yes
- Native concept counts:
  - meta-requirement: 19
  - design-principle: 6
  - design-feature: 14
- Explicit count statements:
  - 14 design features: stated 14 design-feature
  - six design principles: stated 6 design-principle
  - 19 meta-requirements: stated 19 meta-requirement
- Potential representation warnings:
  - none

### Unchaining Social Businesses - Blockchain as the Basic Technology of a Crowdlending Platform

- Paper ID: `papers/unchaining-social-crowdlending`
- Semantic relationships: 0
- Requirements present: no
- Principles present: no
- Features present: no
- Objectives, goals, or meta-requirements present: yes
- Native concept counts:
  - design-objective: 17
- Explicit count statements:
  - seventeen design objectives: stated 17 design-objective
- Potential representation warnings:
  - none

### An Architecture Using Payment Channel Networks for Blockchain-based Wi-Fi Sharing

- Paper ID: `papers/wifi-sharing-payment-channels`
- Semantic relationships: 38
- Requirements present: yes
- Principles present: yes
- Features present: no
- Objectives, goals, or meta-requirements present: no
- Native concept counts:
  - design-requirement: 10
  - design-principle: 14
- Explicit count statements:
  - 14 design principles: stated 14 design-principle
  - Fourteen design principles: stated 14 design-principle
  - 10 design requirements: stated 10 design-requirement
- Potential representation warnings:
  - none

### Yes, I Do: Marrying Blockchain Applications with GDPR

- Paper ID: `papers/yes-i-do-gdpr`
- Semantic relationships: 0
- Requirements present: no
- Principles present: yes
- Features present: no
- Objectives, goals, or meta-requirements present: no
- Native concept counts:
  - design-principle: 4
- Explicit count statements:
  - Four design principles: stated 4 design-principle
- Potential representation warnings:
  - none
