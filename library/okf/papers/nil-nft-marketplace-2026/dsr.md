---
type: PaperDSRProfile
paper_id: NIL_NFT_MARKETPLACE_2026
title: DSR profile for NIL NFT marketplace paper
review_status: reviewed
confidence: high
source_pdf: Designing a fair and inclusive digital asset-based name-image-likeness
  marketplace.pdf
---

# DSR-OKF Profile

## Paper-level summary

The paper addresses fairness and inclusiveness concerns in NIL monetization by designing a blockchain-based NFT marketplace. The core pattern combines randomized minting in primary markets, deterministic royalties in secondary markets, and smart-contract-based royalty distribution. The design is evaluated through student-athlete interviews and informed argument against market-design requirements.


---

## Concept: prob_001_nil_fairness_inclusiveness_problem

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:prob_001_nil_fairness_inclusiveness_problem
type: Problem
dsr_layer: Problem
title: Uneven and exclusionary NIL monetization for student-athletes
description: NIL regulatory changes allow student-athletes to earn from personal brands,
  but benefits are expected to concentrate among famous athletes and popular sports,
  creating fairness and inclusiveness concerns.
tags:
- NIL
- fairness
- inclusiveness
- student-athletes
- resource-allocation
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_001_abstract_problem_solution
- NIL_NFT_MARKETPLACE_2026:ev_002_regulatory_change_and_opportunity
- NIL_NFT_MARKETPLACE_2026:ev_010_research_context_nil
```

### Explanation

NIL regulatory changes allow student-athletes to earn from personal brands, but benefits are expected to concentrate among famous athletes and popular sports, creating fairness and inclusiveness concerns.


---

## Concept: rq_001_design_fair_inclusive_nil_marketplace

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:rq_001_design_fair_inclusive_nil_marketplace
type: ResearchQuestion
dsr_layer: ResearchQuestion
title: How can a digital-asset marketplace allocate NIL resources fairly and inclusively?
description: The paper investigates how market-based digital asset systems can allocate
  limited NIL financial resources across student-athletes while combining broad access
  with meritocratic outcomes.
tags:
- research-question
- NIL
- market-design
- digital-assets
confidence: medium-high
extraction_type: inferred
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_001_abstract_problem_solution
- NIL_NFT_MARKETPLACE_2026:ev_011_dsrm_process
```

### Explanation

The paper investigates how market-based digital asset systems can allocate limited NIL financial resources across student-athletes while combining broad access with meritocratic outcomes.


---

## Concept: dr_001_inclusiveness

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:dr_001_inclusiveness
type: DesignRequirement
dsr_layer: Requirement
title: Inclusiveness
description: NIL projects should provide all student-athletes with access to opportunities
  and resources, so participation is not limited to already-famous athletes or high-revenue
  sports.
tags:
- requirement
- inclusiveness
- access
- all-athletes
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_006_inclusiveness_background
- NIL_NFT_MARKETPLACE_2026:ev_014_inclusiveness_requirement
```

### Explanation

NIL projects should provide all student-athletes with access to opportunities and resources, so participation is not limited to already-famous athletes or high-revenue sports.


---

## Concept: dr_002_meritocratic_allocation

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:dr_002_meritocratic_allocation
type: DesignRequirement
dsr_layer: Requirement
title: Meritocratic allocation
description: Relevant differences among student-athletes should influence the long-term
  allocation of NIL financial resources, rather than enforcing identical outcomes
  for all.
tags:
- requirement
- meritocracy
- fairness
- Aristotle
- resource-allocation
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_005_inclusive_meritocratic_definition
- NIL_NFT_MARKETPLACE_2026:ev_015_meritocratic_requirement
```

### Explanation

Relevant differences among student-athletes should influence the long-term allocation of NIL financial resources, rather than enforcing identical outcomes for all.


---

## Concept: dr_003_market_thickness

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:dr_003_market_thickness
type: DesignRequirement
dsr_layer: Requirement
title: Market thickness
description: Participants in market-based NIL projects should be able to quickly find
  trading partners or counterparties.
tags:
- requirement
- market-thickness
- liquidity
- market-design
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_009_market_design_conditions
- NIL_NFT_MARKETPLACE_2026:ev_016_market_requirements
```

### Explanation

Participants in market-based NIL projects should be able to quickly find trading partners or counterparties.


---

## Concept: dr_004_no_congestion

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:dr_004_no_congestion
type: DesignRequirement
dsr_layer: Requirement
title: No congestion
description: Market-based NIL projects should support sufficiently fast transactions
  to avoid marketplace congestion.
tags:
- requirement
- congestion
- transaction-speed
- market-design
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_009_market_design_conditions
- NIL_NFT_MARKETPLACE_2026:ev_016_market_requirements
```

### Explanation

Market-based NIL projects should support sufficiently fast transactions to avoid marketplace congestion.


---

## Concept: dr_005_market_safety

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:dr_005_market_safety
type: DesignRequirement
dsr_layer: Requirement
title: Market safety
description: Market-based NIL initiatives should be safe for student-athletes, especially
  against fraud, opaque third-party revenue distribution, and unreliable royalty handling.
tags:
- requirement
- safety
- fraud-prevention
- market-design
- royalty-safety
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_016_market_requirements
- NIL_NFT_MARKETPLACE_2026:ev_026_evaluation_against_requirements
```

### Explanation

Market-based NIL initiatives should be safe for student-athletes, especially against fraud, opaque third-party revenue distribution, and unreliable royalty handling.


---

## Concept: dp_001_plausible_events

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:dp_001_plausible_events
type: DesignPrinciple
dsr_layer: Principle
title: Plausible events
description: Use randomized primary-market collectible packs with royalties so every
  student-athlete has a non-zero chance of receiving NIL financial resources.
tags:
- design-principle
- randomization
- primary-market
- plausible-events
- inclusion
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_017_plausible_events_principle
```

### Explanation

Use randomized primary-market collectible packs with royalties so every student-athlete has a non-zero chance of receiving NIL financial resources.


---

## Concept: dp_002_market_royalties

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:dp_002_market_royalties
type: DesignPrinciple
dsr_layer: Principle
title: Market royalties
description: Use secondary-market transactions to create market-driven royalty flows,
  allowing more demanded collectibles and athletes to receive greater long-term rewards.
tags:
- design-principle
- royalties
- secondary-market
- meritocracy
- market-forces
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_018_market_royalties_principle
```

### Explanation

Use secondary-market transactions to create market-driven royalty flows, allowing more demanded collectibles and athletes to receive greater long-term rewards.


---

## Concept: dp_003_blockchain_based_marketplace

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:dp_003_blockchain_based_marketplace
type: DesignPrinciple
dsr_layer: Principle
title: Blockchain-based marketplace
description: Use blockchain technology as the backbone of market-based NIL initiatives
  so ownership, transactions, royalties, and marketplace operations can be transparent
  and automated.
tags:
- design-principle
- blockchain-marketplace
- smart-contract
- market-design
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_019_blockchain_marketplace_principle
```

### Explanation

Use blockchain technology as the backbone of market-based NIL initiatives so ownership, transactions, royalties, and marketplace operations can be transparent and automated.


---

## Concept: df_001_random_minting

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:df_001_random_minting
type: DesignFeature
dsr_layer: Feature
title: Random minting
description: Randomly mint NFTs in primary markets so purchases of packs can include
  collectibles associated with any student-athlete and distribute royalties broadly.
tags:
- design-feature
- random-minting
- NFT
- primary-market
- royalty
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_020_random_minting_feature
- NIL_NFT_MARKETPLACE_2026:ev_024_purchase_transaction_royalty_distribution
```

### Explanation

Randomly mint NFTs in primary markets so purchases of packs can include collectibles associated with any student-athlete and distribute royalties broadly.


---

## Concept: df_002_market_exchanges

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:df_002_market_exchanges
type: DesignFeature
dsr_layer: Feature
title: Market exchanges
description: Allow minted NFTs to be traded or sold in secondary markets, with royalties
  automatically paid when transactions involving collectibles occur.
tags:
- design-feature
- market-exchange
- secondary-market
- NFT-trading
- royalty
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_021_market_exchanges_feature
- NIL_NFT_MARKETPLACE_2026:ev_025_exchange_transaction_protocol
```

### Explanation

Allow minted NFTs to be traded or sold in secondary markets, with royalties automatically paid when transactions involving collectibles occur.


---

## Concept: df_003_nft_collectibles

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:df_003_nft_collectibles
type: DesignFeature
dsr_layer: Feature
title: NFT collectibles representing student-athlete NIL
description: Represent student-athletes through unique digital collectibles encoded
  as NFTs, enabling ownership, trading, and royalty logic tied to each athlete.
tags:
- NFT
- collectible
- NIL
- digital-asset
- student-athlete
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_008_nft_background
- NIL_NFT_MARKETPLACE_2026:ev_022_high_level_solution_architecture
```

### Explanation

Represent student-athletes through unique digital collectibles encoded as NFTs, enabling ownership, trading, and royalty logic tied to each athlete.


---

## Concept: df_004_smart_contract_royalty_distribution

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:df_004_smart_contract_royalty_distribution
type: DesignFeature
dsr_layer: Feature
title: Smart-contract royalty distribution
description: Use smart contracts to mint collectibles, execute purchases and exchanges,
  and automatically allocate predefined royalty fractions to associated student-athletes.
tags:
- smart-contract
- royalty
- automation
- payment
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_024_purchase_transaction_royalty_distribution
- NIL_NFT_MARKETPLACE_2026:ev_025_exchange_transaction_protocol
```

### Explanation

Use smart contracts to mint collectibles, execute purchases and exchanges, and automatically allocate predefined royalty fractions to associated student-athletes.


---

## Concept: df_005_wallet_based_fan_transactions

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:df_005_wallet_based_fan_transactions
type: DesignFeature
dsr_layer: Feature
title: Wallet-based fan transactions
description: Use blockchain wallets so fans connect to the DApp, sign purchase or
  exchange transactions, and receive ownership of collectibles.
tags:
- wallet
- fan-transaction
- signature
- ownership
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_023_dapp_prototype
- NIL_NFT_MARKETPLACE_2026:ev_024_purchase_transaction_royalty_distribution
```

### Explanation

Use blockchain wallets so fans connect to the DApp, sign purchase or exchange transactions, and receive ownership of collectibles.


---

## Concept: df_006_public_blockchain_nft_marketplace

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:df_006_public_blockchain_nft_marketplace
type: DesignFeature
dsr_layer: Feature
title: Public blockchain NFT marketplace infrastructure
description: Use a public blockchain network as the underlying infrastructure for
  transparent NFT ownership and smart-contract execution.
tags:
- public-blockchain
- Ethereum
- marketplace
- ownership
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_007_blockchain_and_smart_contract_background
- NIL_NFT_MARKETPLACE_2026:ev_023_dapp_prototype
```

### Explanation

Use a public blockchain network as the underlying infrastructure for transparent NFT ownership and smart-contract execution.


---

## Concept: df_007_dapp_marketplace_ui

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:df_007_dapp_marketplace_ui
type: DesignFeature
dsr_layer: Feature
title: Student-athletes collectibles DApp interface
description: Provide a web-based DApp where users connect wallets, view collectibles,
  purchase packs, and initiate exchanges.
tags:
- DApp
- marketplace-ui
- wallet-connect
- collectibles
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_023_dapp_prototype
- NIL_NFT_MARKETPLACE_2026:ev_025_exchange_transaction_protocol
```

### Explanation

Provide a web-based DApp where users connect wallets, view collectibles, purchase packs, and initiate exchanges.


---

## Concept: df_008_exchange_transaction_protocol

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:df_008_exchange_transaction_protocol
type: DesignFeature
dsr_layer: Feature
title: Two-party exchange transaction protocol
description: Support NFT-for-NFT, NFT-for-money, or mixed exchanges through an initialization/finalization
  transaction flow with unique transaction identifiers.
tags:
- exchange-protocol
- secondary-market
- transaction-id
- NFT-trade
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_025_exchange_transaction_protocol
```

### Explanation

Support NFT-for-NFT, NFT-for-money, or mixed exchanges through an initialization/finalization transaction flow with unique transaction identifiers.


---

## Concept: df_009_mutable_minting_probabilities_and_royalty_rates

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:df_009_mutable_minting_probabilities_and_royalty_rates
type: DesignFeature
dsr_layer: Feature
title: Mutable minting probabilities and royalty rates
description: Allow smart-contract parameters such as minting probabilities and royalty
  fractions to be adjusted for contextual fairness, scarcity, and deployment needs.
tags:
- artifact-mutability
- probability
- royalty-rate
- smart-contract
confidence: medium-high
extraction_type: inferred
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_031_artifact_mutability
```

### Explanation

Allow smart-contract parameters such as minting probabilities and royalty fractions to be adjusted for contextual fairness, scarcity, and deployment needs.


---

## Concept: df_010_anti_side_payment_and_wash_trade_controls

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:df_010_anti_side_payment_and_wash_trade_controls
type: DesignFeature
dsr_layer: Feature
title: Anti-side-payment and wash-trade controls
description: Potentially add transfer-floor and circular-transfer filters to reduce
  off-chain side payments, wash trading, and artificial demand manipulation.
tags:
- artifact-mutability
- anti-gaming
- floor-price
- wash-trade-filter
confidence: medium-high
extraction_type: inferred
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_031_artifact_mutability
```

### Explanation

Potentially add transfer-floor and circular-transfer filters to reduce off-chain side payments, wash trading, and artificial demand manipulation.


---

## Concept: art_001_fair_inclusive_nil_nft_marketplace

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:art_001_fair_inclusive_nil_nft_marketplace
type: Artifact
dsr_layer: Artifact
title: Fair and inclusive NIL NFT marketplace
description: A market-based information system that sells randomized NFT collectible
  packs in primary markets and supports secondary-market exchanges with automated
  royalties to student-athletes.
tags:
- artifact
- NIL-marketplace
- NFT-marketplace
- royalties
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_004_nft_royalty_solution_summary
- NIL_NFT_MARKETPLACE_2026:ev_022_high_level_solution_architecture
```

### Explanation

A market-based information system that sells randomized NFT collectible packs in primary markets and supports secondary-market exchanges with automated royalties to student-athletes.


---

## Concept: art_002_student_athlete_collectibles_dapp

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:art_002_student_athlete_collectibles_dapp
type: Artifact
dsr_layer: Artifact
title: Student-Athletes Collectibles DApp
description: A web-based prototype using Ethereum, wallets, and smart contracts to
  demonstrate wallet connection, collectible display, purchases, and exchanges.
tags:
- artifact
- DApp
- prototype
- student-athlete-collectibles
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_023_dapp_prototype
- NIL_NFT_MARKETPLACE_2026:ev_025_exchange_transaction_protocol
```

### Explanation

A web-based prototype using Ethereum, wallets, and smart contracts to demonstrate wallet connection, collectible display, purchases, and exchanges.


---

## Concept: art_003_primary_random_pack_market

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:art_003_primary_random_pack_market
type: Artifact
dsr_layer: Artifact
title: Primary random-pack market
description: The primary market mechanism where fans buy packs and smart contracts
  randomly mint collectibles associated with student-athletes, triggering royalty
  payments.
tags:
- artifact-pattern
- primary-market
- random-pack
- minting
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_020_random_minting_feature
- NIL_NFT_MARKETPLACE_2026:ev_024_purchase_transaction_royalty_distribution
```

### Explanation

The primary market mechanism where fans buy packs and smart contracts randomly mint collectibles associated with student-athletes, triggering royalty payments.


---

## Concept: art_004_secondary_exchange_market

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:art_004_secondary_exchange_market
type: Artifact
dsr_layer: Artifact
title: Secondary collectible exchange market
description: The secondary market mechanism where fans trade or sell minted collectibles
  and associated student-athletes receive royalties from monetary exchanges.
tags:
- artifact-pattern
- secondary-market
- exchange
- royalties
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_021_market_exchanges_feature
- NIL_NFT_MARKETPLACE_2026:ev_025_exchange_transaction_protocol
```

### Explanation

The secondary market mechanism where fans trade or sell minted collectibles and associated student-athletes receive royalties from monetary exchanges.


---

## Concept: eval_001_problem_validation_interviews

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:eval_001_problem_validation_interviews
type: Evaluation
dsr_layer: Evaluation
title: Problem-validation interviews with student-athletes
description: The authors interviewed 12 Division I student-athletes to validate that
  NIL benefits are expected to be uneven and concentrated among famous athletes and
  high-revenue sports.
tags:
- evaluation
- interviews
- problem-validation
- student-athletes
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_003_interviews_validate_problem
- NIL_NFT_MARKETPLACE_2026:ev_012_interview_sample
```

### Explanation

The authors interviewed 12 Division I student-athletes to validate that NIL benefits are expected to be uneven and concentrated among famous athletes and high-revenue sports.


---

## Concept: eval_002_artifact_functionality_against_requirements

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:eval_002_artifact_functionality_against_requirements
type: Evaluation
dsr_layer: Evaluation
title: Artifact functionality evaluation against design requirements
description: The paper evaluates whether the artifact satisfies inclusiveness, meritocratic
  allocation, market thickness, no congestion, and market safety requirements.
tags:
- evaluation
- requirements-fit
- informed-argument
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_026_evaluation_against_requirements
```

### Explanation

The paper evaluates whether the artifact satisfies inclusiveness, meritocratic allocation, market thickness, no congestion, and market safety requirements.


---

## Concept: eval_003_student_athlete_interview_evaluation

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:eval_003_student_athlete_interview_evaluation
type: Evaluation
dsr_layer: Evaluation
title: Student-athlete evaluation of artifact inclusiveness and meritocracy
description: The same stakeholder group evaluates whether randomized primary-market
  packs and secondary-market royalties can distribute NIL resources inclusively and
  fairly.
tags:
- evaluation
- qualitative
- student-athletes
- artifact-evaluation
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_027_student_athlete_evaluation_inclusiveness
- NIL_NFT_MARKETPLACE_2026:ev_028_student_athlete_evaluation_meritocracy
```

### Explanation

The same stakeholder group evaluates whether randomized primary-market packs and secondary-market royalties can distribute NIL resources inclusively and fairly.


---

## Concept: eval_004_informed_argument_market_conditions

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:eval_004_informed_argument_market_conditions
type: Evaluation
dsr_layer: Evaluation
title: Informed-argument evaluation of market thickness, congestion, and safety
description: The authors argue that random minting, evolving blockchain throughput,
  smart-contract automation, and blockchain transparency can address marketplace thickness,
  congestion, and safety.
tags:
- evaluation
- market-design
- informed-argument
- Roth
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_026_evaluation_against_requirements
```

### Explanation

The authors argue that random minting, evolving blockchain throughput, smart-contract automation, and blockchain transparency can address marketplace thickness, congestion, and safety.


---

## Concept: ok_001_inclusive_meritocratic_fairness_criterion

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:ok_001_inclusive_meritocratic_fairness_criterion
type: OutputKnowledge
dsr_layer: OutputKnowledge
title: Inclusive-meritocratic fairness criterion
description: A fairness criterion where all student-athletes have access to NIL financial
  resources and long-term allocation is adjusted based on individual merits and market
  demand.
tags:
- output-knowledge
- fairness
- inclusiveness
- meritocracy
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_005_inclusive_meritocratic_definition
```

### Explanation

A fairness criterion where all student-athletes have access to NIL financial resources and long-term allocation is adjusted based on individual merits and market demand.


---

## Concept: ok_002_nil_design_theory

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:ok_002_nil_design_theory
type: OutputKnowledge
dsr_layer: OutputKnowledge
title: Design theory for fair and inclusive market-based NIL systems
description: A prescriptive design theory for market-based information systems that
  share limited financial resources among players fairly and inclusively.
tags:
- output-knowledge
- design-theory
- NIL
- market-based-IS
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_030_design_theory_components
```

### Explanation

A prescriptive design theory for market-based information systems that share limited financial resources among players fairly and inclusively.


---

## Concept: ok_003_random_primary_and_deterministic_secondary_market_pattern

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:ok_003_random_primary_and_deterministic_secondary_market_pattern
type: OutputKnowledge
dsr_layer: OutputKnowledge
title: Random-primary plus deterministic-secondary royalty pattern
description: A reusable pattern combining randomized primary-market access with deterministic
  secondary-market royalties to balance inclusion and meritocratic allocation.
tags:
- output-knowledge
- design-pattern
- random-minting
- secondary-market-royalties
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_020_random_minting_feature
- NIL_NFT_MARKETPLACE_2026:ev_021_market_exchanges_feature
- NIL_NFT_MARKETPLACE_2026:ev_031_artifact_mutability
```

### Explanation

A reusable pattern combining randomized primary-market access with deterministic secondary-market royalties to balance inclusion and meritocratic allocation.


---

## Concept: ok_004_blockchain_marketplace_for_fair_inclusive_resource_distribution

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:ok_004_blockchain_marketplace_for_fair_inclusive_resource_distribution
type: OutputKnowledge
dsr_layer: OutputKnowledge
title: Blockchain marketplace for fair and inclusive resource distribution
description: Blockchain-based marketplaces can be designed to support fair and inclusive
  distribution of scarce financial resources where players, collectibles, and fans
  form the relevant system boundary.
tags:
- output-knowledge
- blockchain-marketplace
- resource-distribution
- social-good
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_026_evaluation_against_requirements
- NIL_NFT_MARKETPLACE_2026:ev_029_design_theory_boundary_conditions
```

### Explanation

Blockchain-based marketplaces can be designed to support fair and inclusive distribution of scarce financial resources where players, collectibles, and fans form the relevant system boundary.


---

## Concept: kt_001_aristotle_equality_principle

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:kt_001_aristotle_equality_principle
type: KernelTheory
dsr_layer: KernelTheory
title: Aristotle’s proportional equality principle
description: The paper uses the idea that equals should be treated equally and unequals
  unequally in proportion to relevant differences to justify meritocratic NIL allocation.
tags:
- kernel-theory
- Aristotle
- fairness
- proportional-equality
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_005_inclusive_meritocratic_definition
- NIL_NFT_MARKETPLACE_2026:ev_015_meritocratic_requirement
```

### Explanation

The paper uses the idea that equals should be treated equally and unequals unequally in proportion to relevant differences to justify meritocratic NIL allocation.


---

## Concept: kt_002_roth_market_design

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:kt_002_roth_market_design
type: KernelTheory
dsr_layer: KernelTheory
title: Roth’s market-design conditions
description: The paper uses Roth’s market design criteria—thickness, no congestion,
  and safety—as requirements for a well-functioning NIL marketplace.
tags:
- kernel-theory
- market-design
- Roth
- thickness
- congestion
- safety
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_009_market_design_conditions
- NIL_NFT_MARKETPLACE_2026:ev_016_market_requirements
```

### Explanation

The paper uses Roth’s market design criteria—thickness, no congestion, and safety—as requirements for a well-functioning NIL marketplace.


---

## Concept: kt_003_distributive_justice_and_fair_division

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:kt_003_distributive_justice_and_fair_division
type: KernelTheory
dsr_layer: KernelTheory
title: Distributive justice and fair-division concepts
description: The paper uses fairness as wealth/resource distribution and the cake-cutting
  metaphor to distinguish access to a resource from the size of each actor’s share.
tags:
- kernel-theory
- distributive-justice
- fair-division
- cake-cutting
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_005_inclusive_meritocratic_definition
```

### Explanation

The paper uses fairness as wealth/resource distribution and the cake-cutting metaphor to distinguish access to a resource from the size of each actor’s share.


---

## Concept: kt_004_possibility_effect

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:kt_004_possibility_effect
type: KernelTheory
dsr_layer: KernelTheory
title: Possibility effect under uncertainty
description: The paper uses the possibility effect to explain why random collectible
  packs can stimulate engagement even when the probability of obtaining a high-value
  item is small.
tags:
- kernel-theory
- possibility-effect
- randomization
- behavioral-economics
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_017_plausible_events_principle
```

### Explanation

The paper uses the possibility effect to explain why random collectible packs can stimulate engagement even when the probability of obtaining a high-value item is small.


---

## Concept: kt_005_design_science_methodology

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:kt_005_design_science_methodology
type: KernelTheory
dsr_layer: KernelTheory
title: Peffers et al. design science research methodology
description: The study follows the Peffers et al. six-phase DSR process to develop,
  demonstrate, evaluate, and communicate the NIL artifact and design theory.
tags:
- kernel-theory
- DSR
- Peffers
- design-science
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_011_dsrm_process
```

### Explanation

The study follows the Peffers et al. six-phase DSR process to develop, demonstrate, evaluate, and communicate the NIL artifact and design theory.


---

## Concept: lim_001_requires_players_and_fan_demand

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:lim_001_requires_players_and_fan_demand
type: Limitation
dsr_layer: Limitation
title: 'Boundary condition: requires players and fan demand'
description: The design assumes a population of players with specialized skills and
  a fan base that creates demand for collectibles; without demand, the marketplace
  cannot distribute meaningful resources.
tags:
- limitation
- boundary-condition
- fan-demand
- players
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_029_design_theory_boundary_conditions
```

### Explanation

The design assumes a population of players with specialized skills and a fan base that creates demand for collectibles; without demand, the marketplace cannot distribute meaningful resources.


---

## Concept: lim_002_technology_adoption_trust_and_usability

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:lim_002_technology_adoption_trust_and_usability
type: Limitation
dsr_layer: Limitation
title: Blockchain/NFT adoption, trust, and usability barriers
description: Student-athletes noted that many people do not understand cryptocurrency,
  NFTs, or NIL; adoption may depend on simple communication, trustworthy design, and
  usable interfaces.
tags:
- limitation
- adoption
- usability
- trust
- NFT-literacy
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_033_quantitative_validation_needed
```

### Explanation

Student-athletes noted that many people do not understand cryptocurrency, NFTs, or NIL; adoption may depend on simple communication, trustworthy design, and usable interfaces.


---

## Concept: lim_003_community_and_stakeholder_participation_needed

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:lim_003_community_and_stakeholder_participation_needed
type: Limitation
dsr_layer: Limitation
title: Need for fan community and institutional stakeholder participation
description: The solution depends on fans having reasons to buy collectibles and on
  institutions or athletic departments potentially tying tangible benefits and authenticity
  checks to collectible ownership.
tags:
- limitation
- community
- fan-engagement
- stakeholders
- authenticity
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_029_design_theory_boundary_conditions
```

### Explanation

The solution depends on fans having reasons to buy collectibles and on institutions or athletic departments potentially tying tangible benefits and authenticity checks to collectible ownership.


---

## Concept: lim_004_privacy_regulatory_and_speculation_risks

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:lim_004_privacy_regulatory_and_speculation_risks
type: Limitation
dsr_layer: Limitation
title: Privacy, regulatory, speculation, and exploitation risks
description: Public blockchain transparency, NFT price volatility, artificial scarcity,
  student-athlete consent, and emerging NIL regulations require careful governance
  and design adaptations.
tags:
- limitation
- privacy
- regulation
- speculation
- governance
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_032_ethical_regulatory_risks
```

### Explanation

Public blockchain transparency, NFT price volatility, artificial scarcity, student-athlete consent, and emerging NIL regulations require careful governance and design adaptations.


---

## Concept: lim_005_qualitative_evaluation_only

```yaml
concept_id: NIL_NFT_MARKETPLACE_2026:lim_005_qualitative_evaluation_only
type: Limitation
dsr_layer: Limitation
title: Need for quantitative and behavioral validation
description: The current evaluation is mainly qualitative; controlled experiments,
  simulations, and willingness-to-pay studies would strengthen evidence about user
  behavior, demand, and fairness outcomes.
tags:
- limitation
- evaluation
- quantitative-validation
- simulation
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- NIL_NFT_MARKETPLACE_2026:ev_033_quantitative_validation_needed
```

### Explanation

The current evaluation is mainly qualitative; controlled experiments, simulations, and willingness-to-pay studies would strengthen evidence about user behavior, demand, and fairness outcomes.
