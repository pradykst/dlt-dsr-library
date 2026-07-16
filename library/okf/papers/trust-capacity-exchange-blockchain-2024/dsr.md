---
schema_version: "okf-dsr-v1"
type: "ConceptCollection"
paper_id: "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024"
extraction_status: "okf_draft"
review_status: "unreviewed"
---

# Canonical DSR Concepts

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:prob_001_low_trust_in_capacity_exchange
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:prob_001_low_trust_in_capacity_exchange",
  "type": "Problem",
  "title": "Low inter-organizational trust hinders virtual capacity exchange",
  "description": "Virtual capacity exchange platforms can mitigate capacity volatility, but behavioral uncertainties and lack of trust among anonymous market participants create coordination costs and limit platform effectiveness.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_001_abstract_problem_trust_capacity",
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_003_intro_transaction_costs"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Virtual capacity exchange platforms can mitigate capacity volatility, but behavioral uncertainties and lack of trust among anonymous market participants create coordination costs and limit platform effectiveness.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:prob_002_capacity_volatility_and_transaction_costs
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:prob_002_capacity_volatility_and_transaction_costs",
  "type": "Problem",
  "title": "Capacity volatility creates transaction-cost pressure in industrial networks",
  "description": "Rapid environmental change and complex supply-chain networks create fluctuating capacity utilization and demand for market-like exchange mechanisms, but transaction costs must be controlled.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_002_intro_capacity_volatility",
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_003_intro_transaction_costs"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Rapid environmental change and complex supply-chain networks create fluctuating capacity utilization and demand for market-like exchange mechanisms, but transaction costs must be controlled.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_001_creation_and_management_of_tender
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_001_creation_and_management_of_tender",
  "type": "Design Requirement",
  "title": "Creation and management of tender",
  "description": "The platform must support creating, storing, and managing precise tenders for requested or offered capacity.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_012_mr_specification"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The platform must support creating, storing, and managing precise tenders for requested or offered capacity.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_002_cross_domain_management
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_002_cross_domain_management",
  "type": "Design Requirement",
  "title": "Cross-domain management",
  "description": "The platform must support tender and capacity exchange across organizational and domain boundaries.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_012_mr_specification"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The platform must support tender and capacity exchange across organizational and domain boundaries.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_003_search_functions
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_003_search_functions",
  "type": "Design Requirement",
  "title": "Search functions",
  "description": "The platform must enable participants to search for capacity offers, demand, or counterparties.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_013_mr_information"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The platform must enable participants to search for capacity offers, demand, or counterparties.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_004_identity_management_and_verification
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_004_identity_management_and_verification",
  "type": "Design Requirement",
  "title": "Identity management and verification",
  "description": "The platform must manage and verify participant identities to reduce uncertainty about counterparties.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_013_mr_information"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The platform must manage and verify participant identities to reduce uncertainty about counterparties.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_005_initiation_support_services
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_005_initiation_support_services",
  "type": "Design Requirement",
  "title": "Services to support the initiation process",
  "description": "The platform must provide services that help participants initiate exchange relationships and begin negotiations.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_013_mr_information"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The platform must provide services that help participants initiate exchange relationships and begin negotiations.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_006_intermediate_connection
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_006_intermediate_connection",
  "type": "Design Requirement",
  "title": "Possibility for intermediate connection",
  "description": "The platform must allow intermediate connections and interaction options during negotiation.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_014_mr_negotiation"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The platform must allow intermediate connections and interaction options during negotiation.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_007_contract_heterogeneity
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_007_contract_heterogeneity",
  "type": "Design Requirement",
  "title": "Heterogeneity of contracts",
  "description": "The platform must support different contract structures and negotiation arrangements for capacity exchange.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_014_mr_negotiation"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The platform must support different contract structures and negotiation arrangements for capacity exchange.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_008_final_award_function
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_008_final_award_function",
  "type": "Design Requirement",
  "title": "Function for final award of the contract",
  "description": "The platform must support final awarding and settlement of capacity-exchange contracts.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_014_mr_negotiation"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The platform must support final awarding and settlement of capacity-exchange contracts.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_009_payment_fulfilment_conditions
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_009_payment_fulfilment_conditions",
  "type": "Design Requirement",
  "title": "Conditions for fulfilling the payment",
  "description": "The platform must specify, monitor, and enforce payment-fulfilment conditions.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_015_mr_fulfilment"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The platform must specify, monitor, and enforce payment-fulfilment conditions.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_010_legal_framework_compliance
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_010_legal_framework_compliance",
  "type": "Design Requirement",
  "title": "Compliance with legal framework conditions",
  "description": "The platform must support legal and contractual compliance during fulfilment.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_015_mr_fulfilment"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The platform must support legal and contractual compliance during fulfilment.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_011_serious_rating
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_011_serious_rating",
  "type": "Design Requirement",
  "title": "Serious rating",
  "description": "The platform must support serious and reliable rating after exchange completion.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_016_mr_after_sales"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The platform must support serious and reliable rating after exchange completion.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_012_decision_relevant_kpis
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_012_decision_relevant_kpis",
  "type": "Design Requirement",
  "title": "Provision of decision-relevant KPIs",
  "description": "The platform must provide KPIs that support future decisions and reputation assessment.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_016_mr_after_sales"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The platform must provide KPIs that support future decisions and reputation assessment.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_013_transaction_transparency_completeness
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_013_transaction_transparency_completeness",
  "type": "Design Requirement",
  "title": "Transparency and completeness of transaction-relevant data",
  "description": "The platform must make transaction-relevant data transparent and complete for authorized participants.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_017_mr_overlapping"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The platform must make transaction-relevant data transparent and complete for authorized participants.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_014_decentralization_and_simultaneity
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_014_decentralization_and_simultaneity",
  "type": "Design Requirement",
  "title": "Decentralization and simultaneity",
  "description": "The platform must support decentralized and simultaneous availability of relevant transaction data.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_017_mr_overlapping"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The platform must support decentralized and simultaneous availability of relevant transaction data.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_015_communication_services
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_015_communication_services",
  "type": "Design Requirement",
  "title": "Communication services",
  "description": "The platform must support communication services needed for exchange and coordination.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_017_mr_overlapping"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The platform must support communication services needed for exchange and coordination.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_016_equality_of_participants
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_016_equality_of_participants",
  "type": "Design Requirement",
  "title": "Equality of participants",
  "description": "The platform must preserve equality among participants and avoid unfair privilege in exchange interactions.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_017_mr_overlapping"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The platform must preserve equality among participants and avoid unfair privilege in exchange interactions.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_017_interface_compatibility_and_standards
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_017_interface_compatibility_and_standards",
  "type": "Design Requirement",
  "title": "Interface compatibility and standards",
  "description": "The platform must support compatible interfaces and standards for practical adoption.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_017_mr_overlapping"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The platform must support compatible interfaces and standards for practical adoption.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_018_human_interaction_and_role_models
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_018_human_interaction_and_role_models",
  "type": "Design Requirement",
  "title": "Depictability of human interaction and role models",
  "description": "The platform must represent human interactions and role models in a way participants can understand and evaluate.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_017_mr_overlapping"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The platform must represent human interactions and role models in a way participants can understand and evaluate.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_019_encryption_concepts
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dr_019_encryption_concepts",
  "type": "Design Requirement",
  "title": "Encryption concepts",
  "description": "The platform must include encryption concepts for secure information handling.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_017_mr_overlapping"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The platform must include encryption concepts for secure information handling.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_001_signaling_tender_information
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_001_signaling_tender_information",
  "type": "Design Principle",
  "title": "Signal information relevant to the tender",
  "description": "Provide functions for customized tender creation, link the tender to verified identities, and reveal tender information simultaneously and distributively to authorized participants.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_018_dp1_table"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Provide functions for customized tender creation, link the tender to verified identities, and reveal tender information simultaneously and distributively to authorized participants.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_002_signaling_identity_information
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_002_signaling_identity_information",
  "type": "Design Principle",
  "title": "Signal information relevant to identity",
  "description": "Provide decentralized identity storage, configuration, and verification functions so participants can trust identity information during initiation and information stages.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_019_dp2_table"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Provide decentralized identity storage, configuration, and verification functions so participants can trust identity information during initiation and information stages.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_003_authority_and_fairness
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_003_authority_and_fairness",
  "type": "Design Principle",
  "title": "Maintain authority and fairness in cooperation",
  "description": "Provide decentralized contract storage, monitoring of agreed terms, and enforcement of sanctions or rewards so cooperation partners cannot be unfairly disadvantaged.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_020_dp3_table"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Provide decentralized contract storage, monitoring of agreed terms, and enforcement of sanctions or rewards so cooperation partners cannot be unfairly disadvantaged.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_004_incentive_mechanisms
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_004_incentive_mechanisms",
  "type": "Design Principle",
  "title": "Use incentive mechanisms to deter opportunism",
  "description": "Expose cooperation benefits and losses from violations through transparent data observable by participants, motivating cooperation and discouraging opportunistic behavior.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_021_dp4_table"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Expose cooperation benefits and losses from violations through transparent data observable by participants, motivating cooperation and discouraging opportunistic behavior.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_005_screening_functionality
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_005_screening_functionality",
  "type": "Design Principle",
  "title": "Provide screening functionality for trustworthy information retrieval",
  "description": "Provide functions for depositing information, distributed and verified access, checking validity, searching information, and contacting participants.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_022_dp5_table"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Provide functions for depositing information, distributed and verified access, checking validity, searching information, and contacting participants.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_006_reputation_mechanism
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:dp_006_reputation_mechanism",
  "type": "Design Principle",
  "title": "Provide a transparent reputation mechanism",
  "description": "Provide serious rating, decentralized collection of rating-relevant data, transparent processing, and distribution of reputation information to participants.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_023_dp6_table",
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_040_reputation_deterrence"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Provide serious rating, decentralized collection of rating-relevant data, transparent processing, and distribution of reputation information to participants.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_001_creating_a_tender
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_001_creating_a_tender",
  "type": "Design Feature",
  "title": "Creating a tender",
  "description": "Support creation of a tender object for requested or offered capacity in the smart-contract-backed platform.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure",
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_028_df_dp_mapping"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Support creation of a tender object for requested or offered capacity in the smart-contract-backed platform.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_002_distributing_tender_information
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_002_distributing_tender_information",
  "type": "Design Feature",
  "title": "Distributing information relevant to tender",
  "description": "Distribute tender-relevant information to authorized participants through the platform and blockchain-backed data access pattern.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Distribute tender-relevant information to authorized participants through the platform and blockchain-backed data access pattern.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_003_creating_an_identity
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_003_creating_an_identity",
  "type": "Design Feature",
  "title": "Creating an identity",
  "description": "Support identity creation and registration for platform participants.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Support identity creation and registration for platform participants.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_004_distributing_identity_information
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_004_distributing_identity_information",
  "type": "Design Feature",
  "title": "Distributing information relevant to identity",
  "description": "Distribute identity-relevant information so counterparties can verify who participates in a transaction.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Distribute identity-relevant information so counterparties can verify who participates in a transaction.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_005_ensuring_authorized_access
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_005_ensuring_authorized_access",
  "type": "Design Feature",
  "title": "Ensuring authorized access",
  "description": "Restrict access and execution rights so only authorized users can perform protected platform actions.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure",
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_039_permission_require_statements"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Restrict access and execution rights so only authorized users can perform protected platform actions.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_006_configuring_permissions
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_006_configuring_permissions",
  "type": "Design Feature",
  "title": "Configuring permissions",
  "description": "Configure permissions in smart contracts and platform functions to prevent unauthorized interactions.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure",
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_039_permission_require_statements"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Configure permissions in smart contracts and platform functions to prevent unauthorized interactions.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_007_prevention_of_fraud
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_007_prevention_of_fraud",
  "type": "Design Feature",
  "title": "Prevention of fraud",
  "description": "Prevent fraudulent platform behavior such as bidding on one’s own tender or acting under a wrong identity.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_032_test_posttest_results"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Prevent fraudulent platform behavior such as bidding on one’s own tender or acting under a wrong identity.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_008_enforcing_rewards_and_incentive
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_008_enforcing_rewards_and_incentive",
  "type": "Design Feature",
  "title": "Enforcing rewards and incentive",
  "description": "Enforce rewards, sanctions, or incentive-relevant outcomes according to pre-defined platform rules.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure",
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_021_dp4_table"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Enforce rewards, sanctions, or incentive-relevant outcomes according to pre-defined platform rules.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_009_traceability_of_rewards_and_incentives
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_009_traceability_of_rewards_and_incentives",
  "type": "Design Feature",
  "title": "Ensuring traceability of enforced rewards and incentives",
  "description": "Make incentive enforcement and reward-relevant events traceable to support deterrence and accountability.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Make incentive enforcement and reward-relevant events traceable to support deterrence and accountability.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_010_permitted_access_tender_information
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_010_permitted_access_tender_information",
  "type": "Design Feature",
  "title": "Permitted access to tender information",
  "description": "Allow participants to read tender-relevant information when they have permitted access.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Allow participants to read tender-relevant information when they have permitted access.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_011_permitted_access_identity_information
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_011_permitted_access_identity_information",
  "type": "Design Feature",
  "title": "Permitted access to identity information",
  "description": "Allow participants to read identity-relevant information when they have permitted access.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Allow participants to read identity-relevant information when they have permitted access.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_012_permitted_access_reputation_information
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_012_permitted_access_reputation_information",
  "type": "Design Feature",
  "title": "Permitted access to reputation information",
  "description": "Allow participants to read reputation-relevant information when they have permitted access.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Allow participants to read reputation-relevant information when they have permitted access.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_013_creating_individual_assessment
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_013_creating_individual_assessment",
  "type": "Design Feature",
  "title": "Creating an individual assessment",
  "description": "Enable participants to create individual ratings or assessments after an exchange.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure",
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_040_reputation_deterrence"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Enable participants to create individual ratings or assessments after an exchange.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_014_distributing_assessment_information
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_014_distributing_assessment_information",
  "type": "Design Feature",
  "title": "Distributing information relevant to the assessment",
  "description": "Distribute assessment and reputation data transparently to participants.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Distribute assessment and reputation data transparently to participants.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_015_smart_contract_tender_identity_reputation_modules
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_015_smart_contract_tender_identity_reputation_modules",
  "type": "Design Feature",
  "title": "Tender, identity, and reputation smart contracts",
  "description": "Implement tender, identity, and reputation modules as smart contracts embedded in the application layer.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_025_instantiation_smart_contracts"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Implement tender, identity, and reputation modules as smart contracts embedded in the application layer.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_016_blockchain_testnet_and_smart_contracts
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:df_016_blockchain_testnet_and_smart_contracts",
  "type": "Design Feature",
  "title": "Ethereum/Remix/Solidity test-network implementation",
  "description": "Use Ethereum-compatible smart contracts, Solidity, Remix IDE, proof-of-authority test network, Web3 frontend, and MetaMask accounts to instantiate and test the trust mechanisms.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_026_permissioned_testnet",
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_038_ethereum_design_details"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Use Ethereum-compatible smart contracts, Solidity, Remix IDE, proof-of-authority test network, Web3 frontend, and MetaMask accounts to instantiate and test the trust mechanisms.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:art_001_blockchain_based_capacity_exchange_prototype
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:art_001_blockchain_based_capacity_exchange_prototype",
  "type": "Artifact",
  "title": "Blockchain-based capacity exchange prototype",
  "description": "A blockchain-based prototype for inter-organizational exchange of capacity, instantiated in the paper through a 3D-printer capacity exchange scenario.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_025_instantiation_smart_contracts",
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_029_ex_post_method"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

A blockchain-based prototype for inter-organizational exchange of capacity, instantiated in the paper through a 3D-printer capacity exchange scenario.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:art_002_decentralized_negotiation_platform
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:art_002_decentralized_negotiation_platform",
  "type": "Artifact",
  "title": "Decentralized negotiation platform for 3D-printer capacity",
  "description": "A Web3 frontend and smart-contract-backed demonstrator through which participants navigate a simplified transaction lifecycle for 3D-printer capacity exchange.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_025_instantiation_smart_contracts",
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

A Web3 frontend and smart-contract-backed demonstrator through which participants navigate a simplified transaction lifecycle for 3D-printer capacity exchange.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:art_003_smart_contract_modules
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:art_003_smart_contract_modules",
  "type": "Artifact",
  "title": "Tender, identity, and reputation smart-contract modules",
  "description": "Three smart-contract modules handle tender information, identity information, and reputation/assessment information.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_025_instantiation_smart_contracts"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Three smart-contract modules handle tender information, identity information, and reputation/assessment information.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:art_004_experimental_manipulated_prototype
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:art_004_experimental_manipulated_prototype",
  "type": "Artifact",
  "title": "Manipulated prototype for trust-effect testing",
  "description": "A manipulated prototype version intentionally violates design principles to test whether perceived trust decreases when blockchain is poorly designed.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_032_test_posttest_results"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

A manipulated prototype version intentionally violates design principles to test whether perceived trust decreases when blockchain is poorly designed.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:eval_001_two_iteration_dsr_design
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:eval_001_two_iteration_dsr_design",
  "type": "Evaluation",
  "title": "Two-iteration DSR design and evaluation process",
  "description": "The study uses a DSR process with requirements grounding, design-principle formulation, ex-ante evaluation, artifact instantiation, ex-post experimental evaluation, and reflection.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_008_research_design_overview",
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_010_interview_sampling"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The study uses a DSR process with requirements grounding, design-principle formulation, ex-ante evaluation, artifact instantiation, ex-post experimental evaluation, and reflection.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:eval_002_ex_ante_design_principle_evaluation
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:eval_002_ex_ante_design_principle_evaluation",
  "type": "Evaluation",
  "title": "Ex-ante evaluation of design principles",
  "description": "The design principles are evaluated before instantiation using accessibility, importance, novelty, actability, guidance, and effectiveness criteria.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_024_ex_ante_evaluation"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The design principles are evaluated before instantiation using accessibility, importance, novelty, actability, guidance, and effectiveness criteria.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:eval_003_pretest_posttest_experiment
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:eval_003_pretest_posttest_experiment",
  "type": "Evaluation",
  "title": "Pretest-posttest experiment with control and test groups",
  "description": "A subject-based experiment uses control and test groups with non-manipulated and manipulated prototype variants to evaluate perceived trust.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_029_ex_post_method"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

A subject-based experiment uses control and test groups with non-manipulated and manipulated prototype variants to evaluate perceived trust.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:eval_004_pretest_high_trust_observation
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:eval_004_pretest_high_trust_observation",
  "type": "Evaluation",
  "title": "Pretest shows high perceived trust for full design-principle implementation",
  "description": "In the pretest, participants using the full, non-manipulated design-principle implementation report high perceived trust.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_030_pretest_results"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

In the pretest, participants using the full, non-manipulated design-principle implementation report high perceived trust.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:eval_005_control_group_steady_trust
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:eval_005_control_group_steady_trust",
  "type": "Evaluation",
  "title": "Control-group posttest shows steady perceived trust",
  "description": "The control group repeats the non-manipulated prototype and reports stable trust ratings, supporting the consistency of the non-manipulated implementation.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_031_control_posttest_results"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The control group repeats the non-manipulated prototype and reports stable trust ratings, supporting the consistency of the non-manipulated implementation.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:eval_006_manipulated_test_group_trust_collapse
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:eval_006_manipulated_test_group_trust_collapse",
  "type": "Evaluation",
  "title": "Manipulated prototype sharply reduces perceived trust",
  "description": "The manipulated prototype version creates wrong identity, self-bidding, incorrect payment, and self-rating opportunities; perceived trust collapses in the test group.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_032_test_posttest_results"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The manipulated prototype version creates wrong identity, self-bidding, incorrect payment, and self-rating opportunities; perceived trust collapses in the test group.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ok_001_meta_requirements_for_capacity_exchange
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ok_001_meta_requirements_for_capacity_exchange",
  "type": "Output Knowledge",
  "title": "Nineteen meta-requirements for trust-enabling capacity exchange",
  "description": "The paper contributes 19 meta-requirements organized across transaction lifecycle categories for inter-organizational capacity exchange platforms.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_011_meta_requirements_overview"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The paper contributes 19 meta-requirements organized across transaction lifecycle categories for inter-organizational capacity exchange platforms.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ok_002_six_design_principles_for_interorganizational_trust
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ok_002_six_design_principles_for_interorganizational_trust",
  "type": "Output Knowledge",
  "title": "Six design principles for inter-organizational trust",
  "description": "The paper formulates six design principles around signaling, authority/fairness, incentives, screening, and reputation for trust-enabling exchange platforms.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_035_research_contributions"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The paper formulates six design principles around signaling, authority/fairness, incentives, screening, and reputation for trust-enabling exchange platforms.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ok_003_blockchain_design_features_for_trust_principles
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ok_003_blockchain_design_features_for_trust_principles",
  "type": "Output Knowledge",
  "title": "Blockchain design features instantiate trust principles",
  "description": "The paper contributes a mapping from design principles to blockchain-based design features and a smart-contract instantiation.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_027_design_features_figure"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The paper contributes a mapping from design principles to blockchain-based design features and a smart-contract instantiation.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ok_004_blockchain_does_not_automatically_create_trust
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ok_004_blockchain_does_not_automatically_create_trust",
  "type": "Output Knowledge",
  "title": "Blockchain does not automatically create trust",
  "description": "The experiment shows that blockchain can reduce trust when design principles are violated; trust depends on correct design rather than mere blockchain use.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_033_ex_post_summary",
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_037_conclusion"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The experiment shows that blockchain can reduce trust when design principles are violated; trust depends on correct design rather than mere blockchain use.

---

## Concept: TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ok_005_design_principles_are_interdependent
```json
{
  "id": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ok_005_design_principles_are_interdependent",
  "type": "Output Knowledge",
  "title": "Trust-enabling design principles are interdependent",
  "description": "The paper argues that the design principles affect each other and must be implemented holistically, not as isolated features.",
  "evidence": [
    "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024:ev_034_principle_interdependence"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The paper argues that the design principles affect each other and must be implemented holistically, not as isolated features.
