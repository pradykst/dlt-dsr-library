---
schema_version: "okf-dsr-v1"
type: "ConceptCollection"
paper_id: "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023"
extraction_status: "okf_draft"
review_status: "unreviewed"
---

# Canonical DSR Concepts

## Concept: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:prob_001_fragmented_hie_consent_self_management_problem
```json
{
  "id": "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:prob_001_fragmented_hie_consent_self_management_problem",
  "type": "Problem",
  "title": "Fragmented HIE consent management limits patient self-management, trust, interoperability, and auditability",
  "description": "Current health information exchange consent processes rely on provider-collected forms, vary across localities, and do not reliably let patients manage and share consent status across disconnected HIEs.",
  "evidence": [
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_001_abstract_problem",
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_002_intro_problem",
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_006_current_hie_fragmentation",
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_010_validated_design_problem"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Current health information exchange consent processes rely on provider-collected forms, vary across localities, and do not reliably let patients manage and share consent status across disconnected HIEs.

---

## Concept: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_001_privacy_of_consent_status
```json
{
  "id": "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_001_privacy_of_consent_status",
  "type": "Design Requirement",
  "title": "Protect privacy of patient consent status and PHI-sharing preferences",
  "description": "A consent self-management system should restrict access so that only authorized HIEs and providers can view a patient consent status.",
  "evidence": [
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_011_privacy_requirement",
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_016_design_principles_mapping"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

A consent self-management system should restrict access so that only authorized HIEs and providers can view a patient consent status.

---

## Concept: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_002_patient_self_management
```json
{
  "id": "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_002_patient_self_management",
  "type": "Design Requirement",
  "title": "Enable patients to self-manage consent status",
  "description": "Patients should be able to grant and revoke consent themselves rather than depending only on provider-site consent forms.",
  "evidence": [
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_012_self_management_requirement",
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_027_augments_existing_consent_processes"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Patients should be able to grant and revoke consent themselves rather than depending only on provider-site consent forms.

---

## Concept: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_003_patient_and_hie_trust
```json
{
  "id": "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_003_patient_and_hie_trust",
  "type": "Design Requirement",
  "title": "Build patient and HIE trust through visibility and reliable consent handling",
  "description": "The system should help patients trust that their consent preferences are visible, current, and respected by exchange entities.",
  "evidence": [
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_013_trust_requirement",
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_028_privacy_control_preferences"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The system should help patients trust that their consent preferences are visible, current, and respected by exchange entities.

---

## Concept: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_004_regulatory_compliance_and_auditability
```json
{
  "id": "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_004_regulatory_compliance_and_auditability",
  "type": "Design Requirement",
  "title": "Support regulatory compliance through auditable consent transaction history",
  "description": "Consent management should support compliance with variable consent regulations by maintaining a reliable audit trail of consent transactions.",
  "evidence": [
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_014_compliance_requirement",
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_016_design_principles_mapping"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Consent management should support compliance with variable consent regulations by maintaining a reliable audit trail of consent transactions.

---

## Concept: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_005_interoperability_across_fragmented_hies
```json
{
  "id": "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dr_005_interoperability_across_fragmented_hies",
  "type": "Design Requirement",
  "title": "Enable interoperability of consent status across fragmented HIEs",
  "description": "Consent changes should be shareable across multiple HIEs despite fragmented health information infrastructures.",
  "evidence": [
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_015_interoperability_requirement",
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_029_hie_access_importance"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Consent changes should be shareable across multiple HIEs despite fragmented health information infrastructures.

---

## Concept: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dp_001_permissioned_view_of_consent_status
```json
{
  "id": "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dp_001_permissioned_view_of_consent_status",
  "type": "Design Principle",
  "title": "Only HIEs and providers with permission can view patient consent status",
  "description": "Maintain confidentiality by ensuring that consent status is visible only to authorized entities.",
  "evidence": [
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_016_design_principles_mapping",
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_021_wallet_control_and_immutability"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Maintain confidentiality by ensuring that consent status is visible only to authorized entities.

---

## Concept: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dp_002_patient_only_changes_consent_status
```json
{
  "id": "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dp_002_patient_only_changes_consent_status",
  "type": "Design Principle",
  "title": "Only the patient can change their consent status",
  "description": "Preserve self-management by giving the patient exclusive authority to grant or revoke their own consent status.",
  "evidence": [
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_016_design_principles_mapping",
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_021_wallet_control_and_immutability"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Preserve self-management by giving the patient exclusive authority to grant or revoke their own consent status.

---

## Concept: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dp_003_auditable_consent_transaction_history
```json
{
  "id": "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dp_003_auditable_consent_transaction_history",
  "type": "Design Principle",
  "title": "Consent transaction history between patient and HIE must be auditable",
  "description": "Support trust and compliance by keeping an immutable history of consent transactions.",
  "evidence": [
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_016_design_principles_mapping",
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_021_wallet_control_and_immutability"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Support trust and compliance by keeping an immutable history of consent transactions.

---

## Concept: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dp_004_cross_hie_communication_without_central_authority
```json
{
  "id": "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dp_004_cross_hie_communication_without_central_authority",
  "type": "Design Principle",
  "title": "HIEs should communicate consent status across HIEs without a central authority",
  "description": "Avoid centralized consent repositories by enabling HIEs to share consent status through a decentralized infrastructure.",
  "evidence": [
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_016_design_principles_mapping",
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_018_permissioned_blockchain_fit",
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_022_distribution_and_decentralization"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Avoid centralized consent repositories by enabling HIEs to share consent status through a decentralized infrastructure.

---

## Concept: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dp_005_patient_shares_consent_changes_across_hies
```json
{
  "id": "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:dp_005_patient_shares_consent_changes_across_hies",
  "type": "Design Principle",
  "title": "Enable patients to share consent-status changes across HIEs",
  "description": "Support interoperability by allowing a patient consent transaction to become available to relevant HIEs without separate provider-level submission at each location.",
  "evidence": [
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_016_design_principles_mapping",
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_022_distribution_and_decentralization"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Support interoperability by allowing a patient consent transaction to become available to relevant HIEs without separate provider-level submission at each location.

---

## Concept: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_001_encryption
```json
{
  "id": "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_001_encryption",
  "type": "Design Feature",
  "title": "Encryption for consent-management interactions",
  "description": "Use cryptographic mechanisms so consent interactions and identity use are protected against unauthorized access.",
  "evidence": [
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_016_design_principles_mapping",
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_020_wallet_encryption_key_management"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Use cryptographic mechanisms so consent interactions and identity use are protected against unauthorized access.

---

## Concept: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_002_key_management
```json
{
  "id": "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_002_key_management",
  "type": "Design Feature",
  "title": "Key management through blockchain wallets",
  "description": "Use wallet-managed cryptographic keys to authenticate patients and sign consent transactions.",
  "evidence": [
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_020_wallet_encryption_key_management",
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_021_wallet_control_and_immutability"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Use wallet-managed cryptographic keys to authenticate patients and sign consent transactions.

---

## Concept: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_003_immutable_consent_log
```json
{
  "id": "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_003_immutable_consent_log",
  "type": "Design Feature",
  "title": "Immutable consent transaction log",
  "description": "Represent consent grants and revocations as append-only transactions so previous changes are not erased.",
  "evidence": [
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_021_wallet_control_and_immutability"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Represent consent grants and revocations as append-only transactions so previous changes are not erased.

---

## Concept: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_004_decentralized_hie_network
```json
{
  "id": "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_004_decentralized_hie_network",
  "type": "Design Feature",
  "title": "Decentralized HIE blockchain network",
  "description": "Use decentralized blockchain nodes operated by HIEs to avoid a central consent authority.",
  "evidence": [
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_018_permissioned_blockchain_fit",
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_022_distribution_and_decentralization"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Use decentralized blockchain nodes operated by HIEs to avoid a central consent authority.

---

## Concept: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_005_distributed_consent_status_replication
```json
{
  "id": "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_005_distributed_consent_status_replication",
  "type": "Design Feature",
  "title": "Distributed replication of consent transactions across HIE nodes",
  "description": "Share consent transactions across blockchain network nodes so HIEs can access near-real-time consent status.",
  "evidence": [
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_022_distribution_and_decentralization"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Share consent transactions across blockchain network nodes so HIEs can access near-real-time consent status.

---

## Concept: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_006_permissioned_blockchain_access_model
```json
{
  "id": "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_006_permissioned_blockchain_access_model",
  "type": "Design Feature",
  "title": "Permissioned blockchain access model",
  "description": "Use a permissioned blockchain because consent data should not be publicly accessible and participants have differentiated access roles.",
  "evidence": [
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_017_blockchain_decision_path",
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_018_permissioned_blockchain_fit"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Use a permissioned blockchain because consent data should not be publicly accessible and participants have differentiated access roles.

---

## Concept: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_007_smart_contract_consent_functions
```json
{
  "id": "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_007_smart_contract_consent_functions",
  "type": "Design Feature",
  "title": "Smart contract functions for adding, revoking, and querying consent",
  "description": "Deploy smart contract logic that lets users add consent data, revoke consent, and query consent status through controlled functions.",
  "evidence": [
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_019_dapp_smart_contract_backend",
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_021_wallet_control_and_immutability"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Deploy smart contract logic that lets users add consent data, revoke consent, and query consent status through controlled functions.

---

## Concept: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_008_patient_facing_consent_dapp
```json
{
  "id": "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_008_patient_facing_consent_dapp",
  "type": "Design Feature",
  "title": "Patient-facing Consent Self-Management DApp",
  "description": "Provide a web-based interface for patients to authenticate, list providers, search providers, grant consent, and revoke consent.",
  "evidence": [
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_019_dapp_smart_contract_backend",
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_030_ui_prototype_screens"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Provide a web-based interface for patients to authenticate, list providers, search providers, grant consent, and revoke consent.

---

## Concept: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_009_provider_search_and_consent_grant
```json
{
  "id": "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_009_provider_search_and_consent_grant",
  "type": "Design Feature",
  "title": "Provider search and consent-grant workflow",
  "description": "Allow patients to search for a provider identifier and grant consent through the DApp.",
  "evidence": [
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_030_ui_prototype_screens"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Allow patients to search for a provider identifier and grant consent through the DApp.

---

## Concept: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_010_consent_provider_list_and_revocation
```json
{
  "id": "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_010_consent_provider_list_and_revocation",
  "type": "Design Feature",
  "title": "Provider consent list and revocation workflow",
  "description": "Allow patients to view providers who have received consent and revoke consent from the same interface.",
  "evidence": [
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_021_wallet_control_and_immutability",
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_030_ui_prototype_screens"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Allow patients to view providers who have received consent and revoke consent from the same interface.

---

## Concept: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_011_proof_of_authority_permissioned_ethereum
```json
{
  "id": "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:df_011_proof_of_authority_permissioned_ethereum",
  "type": "Design Feature",
  "title": "Proof-of-authority permissioned Ethereum deployment",
  "description": "Instantiate the DApp backend on a permissioned Ethereum network using proof-of-authority consensus for performance evaluation.",
  "evidence": [
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_023_performance_evaluation",
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_024_cost_evaluation"
  ],
  "confidence": "medium-high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Instantiate the DApp backend on a permissioned Ethereum network using proof-of-authority consensus for performance evaluation.

---

## Concept: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:art_001_consent_self_management_mockup
```json
{
  "id": "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:art_001_consent_self_management_mockup",
  "type": "Artifact",
  "title": "Consent self-management app mock-up",
  "description": "First-iteration proof-of-concept interface used to test whether potential patients preferred app-based consent self-management over provider-site forms.",
  "evidence": [
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_007_dsrm_two_iterations",
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_009_consent_app_preference"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

First-iteration proof-of-concept interface used to test whether potential patients preferred app-based consent self-management over provider-site forms.

---

## Concept: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:art_002_blockchain_consent_self_management_dapp
```json
{
  "id": "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:art_002_blockchain_consent_self_management_dapp",
  "type": "Artifact",
  "title": "Blockchain-enabled Consent Self-Management DApp",
  "description": "Second-iteration blockchain DApp that lets patients manage consent status through a web interface connected to smart contracts and a permissioned blockchain.",
  "evidence": [
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_019_dapp_smart_contract_backend",
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_030_ui_prototype_screens"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Second-iteration blockchain DApp that lets patients manage consent status through a web interface connected to smart contracts and a permissioned blockchain.

---

## Concept: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:art_003_permissioned_hie_consent_blockchain
```json
{
  "id": "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:art_003_permissioned_hie_consent_blockchain",
  "type": "Artifact",
  "title": "Permissioned HIE consent blockchain network",
  "description": "A permissioned blockchain infrastructure for HIEs to store, manage, and share consent status without a central authority.",
  "evidence": [
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_018_permissioned_blockchain_fit",
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_023_performance_evaluation"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

A permissioned blockchain infrastructure for HIEs to store, manage, and share consent status without a central authority.

---

## Concept: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:eval_001_patient_survey_evaluation
```json
{
  "id": "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:eval_001_patient_survey_evaluation",
  "type": "Evaluation",
  "title": "Survey evaluation of patient interest in consent self-management",
  "description": "The first design cycle evaluated app-based consent self-management with 200 MTurk participants and found strong preference for the app.",
  "evidence": [
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_008_survey_design",
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_009_consent_app_preference"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The first design cycle evaluated app-based consent self-management with 200 MTurk participants and found strong preference for the app.

---

## Concept: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:eval_002_design_requirement_and_principle_mapping
```json
{
  "id": "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:eval_002_design_requirement_and_principle_mapping",
  "type": "Evaluation",
  "title": "Design requirement and principle mapping evaluation",
  "description": "The paper derives requirements, principles, and features and uses a blockchain decision path to justify a permissioned blockchain design.",
  "evidence": [
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_016_design_principles_mapping",
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_017_blockchain_decision_path"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The paper derives requirements, principles, and features and uses a blockchain decision path to justify a permissioned blockchain design.

---

## Concept: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:eval_003_blockchain_performance_evaluation
```json
{
  "id": "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:eval_003_blockchain_performance_evaluation",
  "type": "Evaluation",
  "title": "Permissioned blockchain performance evaluation",
  "description": "The technical evaluation tested a 50-node permissioned blockchain network and measured throughput and latency.",
  "evidence": [
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_023_performance_evaluation"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The technical evaluation tested a 50-node permissioned blockchain network and measured throughput and latency.

---

## Concept: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:eval_004_cost_feasibility_evaluation
```json
{
  "id": "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:eval_004_cost_feasibility_evaluation",
  "type": "Evaluation",
  "title": "Cost feasibility evaluation of running the consent blockchain network",
  "description": "The paper estimates monthly cloud infrastructure costs for running the prototype network.",
  "evidence": [
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_024_cost_evaluation"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The paper estimates monthly cloud infrastructure costs for running the prototype network.

---

## Concept: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ok_001_blockchain_backbone_for_consent_self_management
```json
{
  "id": "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ok_001_blockchain_backbone_for_consent_self_management",
  "type": "Output Knowledge",
  "title": "Blockchain can serve as a backbone for patient consent self-management across HIEs",
  "description": "The paper contributes design knowledge showing how blockchain can support privacy, self-management, trust, compliance, and interoperability for HIE consent.",
  "evidence": [
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_005_contributions",
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_025_conclusion_design_knowledge"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The paper contributes design knowledge showing how blockchain can support privacy, self-management, trust, compliance, and interoperability for HIE consent.

---

## Concept: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ok_002_permissioned_blockchain_is_suitable_for_sensitive_consent_status
```json
{
  "id": "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ok_002_permissioned_blockchain_is_suitable_for_sensitive_consent_status",
  "type": "Output Knowledge",
  "title": "Permissioned blockchains are suitable when consent data should not be public",
  "description": "The blockchain decision path concludes that permissioned blockchain fits HIE consent management because public access would violate privacy expectations and regulations.",
  "evidence": [
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_017_blockchain_decision_path",
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_018_permissioned_blockchain_fit"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The blockchain decision path concludes that permissioned blockchain fits HIE consent management because public access would violate privacy expectations and regulations.

---

## Concept: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ok_003_consent_self_management_can_augment_existing_provider_consent_processes
```json
{
  "id": "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ok_003_consent_self_management_can_augment_existing_provider_consent_processes",
  "type": "Output Knowledge",
  "title": "Consent self-management apps can augment, not replace, existing provider-site processes",
  "description": "The paper states that the app need not be adopted by all patients and can provide an alternative for patients wanting more control and visibility.",
  "evidence": [
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_027_augments_existing_consent_processes"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The paper states that the app need not be adopted by all patients and can provide an alternative for patients wanting more control and visibility.

---

## Concept: HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ok_004_design_generalizes_to_private_information_sharing_with_auditable_history
```json
{
  "id": "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ok_004_design_generalizes_to_private_information_sharing_with_auditable_history",
  "type": "Output Knowledge",
  "title": "The design can generalize to self-management of private information requiring trusted sharing and immutable history",
  "description": "The authors explicitly state that the solution can generalize beyond consent to other private/confidential/sensitive information that must be shared in a trusted and auditable manner.",
  "evidence": [
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_007_dsrm_two_iterations",
    "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023:ev_025_conclusion_design_knowledge"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The authors explicitly state that the solution can generalize beyond consent to other private/confidential/sensitive information that must be shared in a trusted and auditable manner.
