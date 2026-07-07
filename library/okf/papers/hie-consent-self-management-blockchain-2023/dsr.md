---
type: PaperDSRProfile
paper_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023
title: DSR profile for HIE consent self-management blockchain paper
review_status: reviewed
confidence: high
source_pdf: Blockchain innovation for consent self-management in health information exchanges.pdf
---


# DSR-OKF Profile

## Paper-level summary

The paper addresses the problem that patients cannot easily self-manage consent for protected health information exchange across fragmented HIE infrastructures. It derives design requirements around privacy, self-management, trust, compliance, and interoperability; maps them to blockchain-related design principles and features; and instantiates the design as a permissioned-blockchain Consent Self-Management DApp.


---

## Concept: prob_001_fragmented_hie_consent_self_management_problem

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:prob_001_fragmented_hie_consent_self_management_problem
type: Problem
dsr_layer: Problem
title: Fragmented HIE consent management limits patient self-management, trust, interoperability, and auditability
description: Current health information exchange consent processes rely on provider-collected forms, vary across localities, and do not reliably let patients manage and share consent status across disconnected HIEs.
tags:
- health-information-exchange
- patient-consent
- interoperability
- privacy
- trust
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_001_abstract_problem
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_002_intro_problem
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_006_current_hie_fragmentation
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_010_validated_design_problem
```

### Explanation

Current health information exchange consent processes rely on provider-collected forms, vary across localities, and do not reliably let patients manage and share consent status across disconnected HIEs.


---

## Concept: rq_001_self_managed_consent_across_distributed_hies

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rq_001_self_managed_consent_across_distributed_hies
type: ResearchQuestion
dsr_layer: Problem
title: How to enable patient consent self-management across distributed HIE systems
description: The paper asks how patients can self-manage consent for health information exchange across distributed systems without relying on a centralized authority.
tags:
- research-question
- consent-self-management
- distributed-systems
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_004_research_objective
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_010_validated_design_problem
```

### Explanation

The paper asks how patients can self-manage consent for health information exchange across distributed systems without relying on a centralized authority.


---

## Concept: rq_002_blockchain_for_private_trusted_auditable_consent

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:rq_002_blockchain_for_private_trusted_auditable_consent
type: ResearchQuestion
dsr_layer: Problem
title: How blockchain can support private, trusted, and auditable consent changes
description: The paper asks how a blockchain-backed design can keep consent changes private, trusted, interoperable, and auditable across HIEs.
tags:
- research-question
- blockchain
- auditability
- privacy
- trust
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_004_research_objective
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_017_blockchain_decision_path
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_018_permissioned_blockchain_fit
```

### Explanation

The paper asks how a blockchain-backed design can keep consent changes private, trusted, interoperable, and auditable across HIEs.


---

## Concept: dr_001_privacy_of_consent_status

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_001_privacy_of_consent_status
type: DesignRequirement
dsr_layer: Requirement
title: Protect privacy of patient consent status and PHI-sharing preferences
description: A consent self-management system should restrict access so that only authorized HIEs and providers can view a patient consent status.
tags:
- privacy
- authorization
- protected-health-information
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_011_privacy_requirement
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_016_design_principles_mapping
```

### Explanation

A consent self-management system should restrict access so that only authorized HIEs and providers can view a patient consent status.


---

## Concept: dr_002_patient_self_management

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_002_patient_self_management
type: DesignRequirement
dsr_layer: Requirement
title: Enable patients to self-manage consent status
description: Patients should be able to grant and revoke consent themselves rather than depending only on provider-site consent forms.
tags:
- self-management
- patient-control
- grant-consent
- revoke-consent
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_012_self_management_requirement
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_027_augments_existing_consent_processes
```

### Explanation

Patients should be able to grant and revoke consent themselves rather than depending only on provider-site consent forms.


---

## Concept: dr_003_patient_and_hie_trust

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_003_patient_and_hie_trust
type: DesignRequirement
dsr_layer: Requirement
title: Build patient and HIE trust through visibility and reliable consent handling
description: The system should help patients trust that their consent preferences are visible, current, and respected by exchange entities.
tags:
- trust
- visibility
- consent-status
- health-information-exchange
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_013_trust_requirement
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_028_privacy_control_preferences
```

### Explanation

The system should help patients trust that their consent preferences are visible, current, and respected by exchange entities.


---

## Concept: dr_004_regulatory_compliance_and_auditability

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_004_regulatory_compliance_and_auditability
type: DesignRequirement
dsr_layer: Requirement
title: Support regulatory compliance through auditable consent transaction history
description: Consent management should support compliance with variable consent regulations by maintaining a reliable audit trail of consent transactions.
tags:
- compliance
- auditability
- regulation
- transaction-history
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_014_compliance_requirement
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_016_design_principles_mapping
```

### Explanation

Consent management should support compliance with variable consent regulations by maintaining a reliable audit trail of consent transactions.


---

## Concept: dr_005_interoperability_across_fragmented_hies

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_005_interoperability_across_fragmented_hies
type: DesignRequirement
dsr_layer: Requirement
title: Enable interoperability of consent status across fragmented HIEs
description: Consent changes should be shareable across multiple HIEs despite fragmented health information infrastructures.
tags:
- interoperability
- fragmented-hie
- cross-hie-sharing
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_015_interoperability_requirement
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_029_hie_access_importance
```

### Explanation

Consent changes should be shareable across multiple HIEs despite fragmented health information infrastructures.


---

## Concept: dp_001_permissioned_view_of_consent_status

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dp_001_permissioned_view_of_consent_status
type: DesignPrinciple
dsr_layer: Principle
title: Only HIEs and providers with permission can view patient consent status
description: Maintain confidentiality by ensuring that consent status is visible only to authorized entities.
tags:
- design-principle
- permissioned-access
- confidentiality
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_016_design_principles_mapping
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_021_wallet_control_and_immutability
```

### Explanation

Maintain confidentiality by ensuring that consent status is visible only to authorized entities.


---

## Concept: dp_002_patient_only_changes_consent_status

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dp_002_patient_only_changes_consent_status
type: DesignPrinciple
dsr_layer: Principle
title: Only the patient can change their consent status
description: Preserve self-management by giving the patient exclusive authority to grant or revoke their own consent status.
tags:
- design-principle
- patient-control
- consent-change
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_016_design_principles_mapping
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_021_wallet_control_and_immutability
```

### Explanation

Preserve self-management by giving the patient exclusive authority to grant or revoke their own consent status.


---

## Concept: dp_003_auditable_consent_transaction_history

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dp_003_auditable_consent_transaction_history
type: DesignPrinciple
dsr_layer: Principle
title: Consent transaction history between patient and HIE must be auditable
description: Support trust and compliance by keeping an immutable history of consent transactions.
tags:
- design-principle
- auditability
- immutability
- compliance
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_016_design_principles_mapping
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_021_wallet_control_and_immutability
```

### Explanation

Support trust and compliance by keeping an immutable history of consent transactions.


---

## Concept: dp_004_cross_hie_communication_without_central_authority

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dp_004_cross_hie_communication_without_central_authority
type: DesignPrinciple
dsr_layer: Principle
title: HIEs should communicate consent status across HIEs without a central authority
description: Avoid centralized consent repositories by enabling HIEs to share consent status through a decentralized infrastructure.
tags:
- design-principle
- decentralization
- no-central-authority
- hie
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_016_design_principles_mapping
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_018_permissioned_blockchain_fit
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_022_distribution_and_decentralization
```

### Explanation

Avoid centralized consent repositories by enabling HIEs to share consent status through a decentralized infrastructure.


---

## Concept: dp_005_patient_shares_consent_changes_across_hies

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dp_005_patient_shares_consent_changes_across_hies
type: DesignPrinciple
dsr_layer: Principle
title: Enable patients to share consent-status changes across HIEs
description: Support interoperability by allowing a patient consent transaction to become available to relevant HIEs without separate provider-level submission at each location.
tags:
- design-principle
- distribution
- cross-hie-sharing
- patient-consent
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_016_design_principles_mapping
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_022_distribution_and_decentralization
```

### Explanation

Support interoperability by allowing a patient consent transaction to become available to relevant HIEs without separate provider-level submission at each location.


---

## Concept: df_001_encryption

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_001_encryption
type: DesignFeature
dsr_layer: Feature
title: Encryption for consent-management interactions
description: Use cryptographic mechanisms so consent interactions and identity use are protected against unauthorized access.
tags:
- encryption
- privacy
- cryptography
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_016_design_principles_mapping
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_020_wallet_encryption_key_management
```

### Explanation

Use cryptographic mechanisms so consent interactions and identity use are protected against unauthorized access.


---

## Concept: df_002_key_management

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_002_key_management
type: DesignFeature
dsr_layer: Feature
title: Key management through blockchain wallets
description: Use wallet-managed cryptographic keys to authenticate patients and sign consent transactions.
tags:
- key-management
- wallet
- digital-signature
- authentication
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_020_wallet_encryption_key_management
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_021_wallet_control_and_immutability
```

### Explanation

Use wallet-managed cryptographic keys to authenticate patients and sign consent transactions.


---

## Concept: df_003_immutable_consent_log

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_003_immutable_consent_log
type: DesignFeature
dsr_layer: Feature
title: Immutable consent transaction log
description: Represent consent grants and revocations as append-only transactions so previous changes are not erased.
tags:
- immutability
- audit-log
- append-only
- consent-history
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_021_wallet_control_and_immutability
```

### Explanation

Represent consent grants and revocations as append-only transactions so previous changes are not erased.


---

## Concept: df_004_decentralized_hie_network

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_004_decentralized_hie_network
type: DesignFeature
dsr_layer: Feature
title: Decentralized HIE blockchain network
description: Use decentralized blockchain nodes operated by HIEs to avoid a central consent authority.
tags:
- decentralization
- hie-nodes
- blockchain-network
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_018_permissioned_blockchain_fit
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_022_distribution_and_decentralization
```

### Explanation

Use decentralized blockchain nodes operated by HIEs to avoid a central consent authority.


---

## Concept: df_005_distributed_consent_status_replication

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_005_distributed_consent_status_replication
type: DesignFeature
dsr_layer: Feature
title: Distributed replication of consent transactions across HIE nodes
description: Share consent transactions across blockchain network nodes so HIEs can access near-real-time consent status.
tags:
- distribution
- replication
- near-real-time
- hie
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_022_distribution_and_decentralization
```

### Explanation

Share consent transactions across blockchain network nodes so HIEs can access near-real-time consent status.


---

## Concept: df_006_permissioned_blockchain_access_model

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_006_permissioned_blockchain_access_model
type: DesignFeature
dsr_layer: Feature
title: Permissioned blockchain access model
description: Use a permissioned blockchain because consent data should not be publicly accessible and participants have differentiated access roles.
tags:
- permissioned-blockchain
- access-control
- privacy
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_017_blockchain_decision_path
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_018_permissioned_blockchain_fit
```

### Explanation

Use a permissioned blockchain because consent data should not be publicly accessible and participants have differentiated access roles.


---

## Concept: df_007_smart_contract_consent_functions

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_007_smart_contract_consent_functions
type: DesignFeature
dsr_layer: Feature
title: Smart contract functions for adding, revoking, and querying consent
description: Deploy smart contract logic that lets users add consent data, revoke consent, and query consent status through controlled functions.
tags:
- smart-contract
- grant-consent
- revoke-consent
- query-consent
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_019_dapp_smart_contract_backend
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_021_wallet_control_and_immutability
```

### Explanation

Deploy smart contract logic that lets users add consent data, revoke consent, and query consent status through controlled functions.


---

## Concept: df_008_patient_facing_consent_dapp

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_008_patient_facing_consent_dapp
type: DesignFeature
dsr_layer: Feature
title: Patient-facing Consent Self-Management DApp
description: Provide a web-based interface for patients to authenticate, list providers, search providers, grant consent, and revoke consent.
tags:
- dapp
- user-interface
- patient-facing
- consent-management
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_019_dapp_smart_contract_backend
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_030_ui_prototype_screens
```

### Explanation

Provide a web-based interface for patients to authenticate, list providers, search providers, grant consent, and revoke consent.


---

## Concept: df_009_provider_search_and_consent_grant

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_009_provider_search_and_consent_grant
type: DesignFeature
dsr_layer: Feature
title: Provider search and consent-grant workflow
description: Allow patients to search for a provider identifier and grant consent through the DApp.
tags:
- provider-search
- grant-consent
- workflow
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_030_ui_prototype_screens
```

### Explanation

Allow patients to search for a provider identifier and grant consent through the DApp.


---

## Concept: df_010_consent_provider_list_and_revocation

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_010_consent_provider_list_and_revocation
type: DesignFeature
dsr_layer: Feature
title: Provider consent list and revocation workflow
description: Allow patients to view providers who have received consent and revoke consent from the same interface.
tags:
- provider-list
- revoke-consent
- consent-status
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_021_wallet_control_and_immutability
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_030_ui_prototype_screens
```

### Explanation

Allow patients to view providers who have received consent and revoke consent from the same interface.


---

## Concept: df_011_proof_of_authority_permissioned_ethereum

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_011_proof_of_authority_permissioned_ethereum
type: DesignFeature
dsr_layer: Feature
title: Proof-of-authority permissioned Ethereum deployment
description: Instantiate the DApp backend on a permissioned Ethereum network using proof-of-authority consensus for performance evaluation.
tags:
- proof-of-authority
- ethereum
- permissioned-network
- evaluation
confidence: medium-high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_023_performance_evaluation
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_024_cost_evaluation
```

### Explanation

Instantiate the DApp backend on a permissioned Ethereum network using proof-of-authority consensus for performance evaluation.


---

## Concept: art_001_consent_self_management_mockup

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:art_001_consent_self_management_mockup
type: Artifact
dsr_layer: Artifact
title: Consent self-management app mock-up
description: First-iteration proof-of-concept interface used to test whether potential patients preferred app-based consent self-management over provider-site forms.
tags:
- artifact
- mockup
- proof-of-concept
- survey
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_007_dsrm_two_iterations
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_009_consent_app_preference
```

### Explanation

First-iteration proof-of-concept interface used to test whether potential patients preferred app-based consent self-management over provider-site forms.


---

## Concept: art_002_blockchain_consent_self_management_dapp

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:art_002_blockchain_consent_self_management_dapp
type: Artifact
dsr_layer: Artifact
title: Blockchain-enabled Consent Self-Management DApp
description: Second-iteration blockchain DApp that lets patients manage consent status through a web interface connected to smart contracts and a permissioned blockchain.
tags:
- artifact
- dapp
- blockchain
- consent-management
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_019_dapp_smart_contract_backend
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_030_ui_prototype_screens
```

### Explanation

Second-iteration blockchain DApp that lets patients manage consent status through a web interface connected to smart contracts and a permissioned blockchain.


---

## Concept: art_003_permissioned_hie_consent_blockchain

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:art_003_permissioned_hie_consent_blockchain
type: Artifact
dsr_layer: Artifact
title: Permissioned HIE consent blockchain network
description: A permissioned blockchain infrastructure for HIEs to store, manage, and share consent status without a central authority.
tags:
- artifact
- permissioned-blockchain
- hie-network
- consent-registry
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_018_permissioned_blockchain_fit
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_023_performance_evaluation
```

### Explanation

A permissioned blockchain infrastructure for HIEs to store, manage, and share consent status without a central authority.


---

## Concept: eval_001_patient_survey_evaluation

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:eval_001_patient_survey_evaluation
type: Evaluation
dsr_layer: Evaluation
title: Survey evaluation of patient interest in consent self-management
description: The first design cycle evaluated app-based consent self-management with 200 MTurk participants and found strong preference for the app.
tags:
- evaluation
- survey
- patient-interest
- descriptive-evaluation
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_008_survey_design
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_009_consent_app_preference
```

### Explanation

The first design cycle evaluated app-based consent self-management with 200 MTurk participants and found strong preference for the app.


---

## Concept: eval_002_design_requirement_and_principle_mapping

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:eval_002_design_requirement_and_principle_mapping
type: Evaluation
dsr_layer: Evaluation
title: Design requirement and principle mapping evaluation
description: The paper derives requirements, principles, and features and uses a blockchain decision path to justify a permissioned blockchain design.
tags:
- evaluation
- design-principles
- blockchain-decision-path
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_016_design_principles_mapping
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_017_blockchain_decision_path
```

### Explanation

The paper derives requirements, principles, and features and uses a blockchain decision path to justify a permissioned blockchain design.


---

## Concept: eval_003_blockchain_performance_evaluation

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:eval_003_blockchain_performance_evaluation
type: Evaluation
dsr_layer: Evaluation
title: Permissioned blockchain performance evaluation
description: The technical evaluation tested a 50-node permissioned blockchain network and measured throughput and latency.
tags:
- evaluation
- performance
- throughput
- latency
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_023_performance_evaluation
```

### Explanation

The technical evaluation tested a 50-node permissioned blockchain network and measured throughput and latency.


---

## Concept: eval_004_cost_feasibility_evaluation

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:eval_004_cost_feasibility_evaluation
type: Evaluation
dsr_layer: Evaluation
title: Cost feasibility evaluation of running the consent blockchain network
description: The paper estimates monthly cloud infrastructure costs for running the prototype network.
tags:
- evaluation
- cost
- feasibility
- cloud-nodes
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_024_cost_evaluation
```

### Explanation

The paper estimates monthly cloud infrastructure costs for running the prototype network.


---

## Concept: ok_001_blockchain_backbone_for_consent_self_management

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ok_001_blockchain_backbone_for_consent_self_management
type: OutputKnowledge
dsr_layer: OutputKnowledge
title: Blockchain can serve as a backbone for patient consent self-management across HIEs
description: The paper contributes design knowledge showing how blockchain can support privacy, self-management, trust, compliance, and interoperability for HIE consent.
tags:
- output-knowledge
- blockchain
- consent-self-management
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_005_contributions
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_025_conclusion_design_knowledge
```

### Explanation

The paper contributes design knowledge showing how blockchain can support privacy, self-management, trust, compliance, and interoperability for HIE consent.


---

## Concept: ok_002_permissioned_blockchain_is_suitable_for_sensitive_consent_status

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ok_002_permissioned_blockchain_is_suitable_for_sensitive_consent_status
type: OutputKnowledge
dsr_layer: OutputKnowledge
title: Permissioned blockchains are suitable when consent data should not be public
description: The blockchain decision path concludes that permissioned blockchain fits HIE consent management because public access would violate privacy expectations and regulations.
tags:
- output-knowledge
- permissioned-blockchain
- privacy
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_017_blockchain_decision_path
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_018_permissioned_blockchain_fit
```

### Explanation

The blockchain decision path concludes that permissioned blockchain fits HIE consent management because public access would violate privacy expectations and regulations.


---

## Concept: ok_003_consent_self_management_can_augment_existing_provider_consent_processes

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ok_003_consent_self_management_can_augment_existing_provider_consent_processes
type: OutputKnowledge
dsr_layer: OutputKnowledge
title: Consent self-management apps can augment, not replace, existing provider-site processes
description: The paper states that the app need not be adopted by all patients and can provide an alternative for patients wanting more control and visibility.
tags:
- output-knowledge
- augmentation
- adoption
- workflow-fit
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_027_augments_existing_consent_processes
```

### Explanation

The paper states that the app need not be adopted by all patients and can provide an alternative for patients wanting more control and visibility.


---

## Concept: ok_004_design_generalizes_to_private_information_sharing_with_auditable_history

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ok_004_design_generalizes_to_private_information_sharing_with_auditable_history
type: OutputKnowledge
dsr_layer: OutputKnowledge
title: The design can generalize to self-management of private information requiring trusted sharing and immutable history
description: The authors explicitly state that the solution can generalize beyond consent to other private/confidential/sensitive information that must be shared in a trusted and auditable manner.
tags:
- output-knowledge
- generalization
- private-information
- auditability
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_007_dsrm_two_iterations
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_025_conclusion_design_knowledge
```

### Explanation

The authors explicitly state that the solution can generalize beyond consent to other private/confidential/sensitive information that must be shared in a trusted and auditable manner.


---

## Concept: kt_001_design_science_research_methodology

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:kt_001_design_science_research_methodology
type: KernelTheory
dsr_layer: KernelTheory
title: Design Science Research Methodology
description: The study follows Peffers et al.’s DSRM with problem identification, objectives, design and development, demonstration, evaluation, and communication.
tags:
- kernel-theory
- dsrm
- peffers
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_007_dsrm_two_iterations
```

### Explanation

The study follows Peffers et al.’s DSRM with problem identification, objectives, design and development, demonstration, evaluation, and communication.


---

## Concept: kt_002_privacy_self_management_and_consent

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:kt_002_privacy_self_management_and_consent
type: KernelTheory
dsr_layer: KernelTheory
title: Privacy self-management and consent rights
description: The design is grounded in patients’ rights to control consent for collection, use, and disclosure of private health information.
tags:
- kernel-theory
- privacy-self-management
- consent
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_012_self_management_requirement
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_011_privacy_requirement
```

### Explanation

The design is grounded in patients’ rights to control consent for collection, use, and disclosure of private health information.


---

## Concept: kt_003_blockchain_trust_by_design

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:kt_003_blockchain_trust_by_design
type: KernelTheory
dsr_layer: KernelTheory
title: Blockchain trust by design
description: The paper draws on blockchain’s decentralized authority, immutability, distributed ledger, and authentication to support trust and interoperability.
tags:
- kernel-theory
- blockchain
- trust-by-design
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_004_research_objective
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_017_blockchain_decision_path
```

### Explanation

The paper draws on blockchain’s decentralized authority, immutability, distributed ledger, and authentication to support trust and interoperability.


---

## Concept: kt_004_hie_interoperability_and_regulatory_fragmentation

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:kt_004_hie_interoperability_and_regulatory_fragmentation
type: KernelTheory
dsr_layer: KernelTheory
title: HIE interoperability and regulatory fragmentation
description: The design problem is shaped by disconnected HIEs, heterogeneous consent regulations, and the need to share consent status across organizations.
tags:
- kernel-theory
- hie
- interoperability
- regulation
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_006_current_hie_fragmentation
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_014_compliance_requirement
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_015_interoperability_requirement
```

### Explanation

The design problem is shaped by disconnected HIEs, heterogeneous consent regulations, and the need to share consent status across organizations.


---

## Concept: lim_001_convenience_sample_survey

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:lim_001_convenience_sample_survey
type: Limitation
dsr_layer: Limitation
title: Survey uses a convenience sample
description: The authors note that the MTurk participant demographics are not a perfect representation of the U.S. population.
tags:
- limitation
- survey
- sampling
confidence: medium-high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_026_limitations
```

### Explanation

The authors note that the MTurk participant demographics are not a perfect representation of the U.S. population.


---

## Concept: lim_002_context_specific_artifact

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:lim_002_context_specific_artifact
type: Limitation
dsr_layer: Limitation
title: Current artifact is context-specific
description: The authors acknowledge that the research produced a context-specific artifact and identify generalization as future work.
tags:
- limitation
- generalizability
- context-specific
confidence: medium-high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_025_conclusion_design_knowledge
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_026_limitations
```

### Explanation

The authors acknowledge that the research produced a context-specific artifact and identify generalization as future work.


---

## Concept: lim_003_prototype_not_fully_optimized

```yaml
concept_id: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:lim_003_prototype_not_fully_optimized
type: Limitation
dsr_layer: Limitation
title: Prototype network parameters were not substantially optimized
description: The technical evaluation reports useful throughput/cost figures but notes that no substantial effort was made to optimize blockchain network parameters.
tags:
- limitation
- performance
- optimization
confidence: medium-high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_024_cost_evaluation
```

### Explanation

The technical evaluation reports useful throughput/cost figures but notes that no substantial effort was made to optimize blockchain network parameters.
