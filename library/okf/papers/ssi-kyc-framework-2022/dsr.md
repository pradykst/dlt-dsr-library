---
schema_version: "okf-dsr-v1"
type: "ConceptCollection"
paper_id: "SSI_KYC_FRAMEWORK_2022"
extraction_status: "okf_draft"
review_status: "unreviewed"
---

# Canonical DSR Concepts

## Concept: SSI_KYC_FRAMEWORK_2022:prob_001_costly_inefficient_privacy_sensitive_kyc
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:prob_001_costly_inefficient_privacy_sensitive_kyc",
  "type": "Problem",
  "title": "Costly, inefficient, repetitive, privacy-sensitive KYC processes",
  "description": "KYC processes burden banks and customers through repeated identity checks, manual work, poor customer experience, regulatory cost, and sensitive personal-data handling.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_001_abstract_problem_objective",
    "SSI_KYC_FRAMEWORK_2022:ev_002_intro_kyc_burden",
    "SSI_KYC_FRAMEWORK_2022:ev_007_kyc_process_steps",
    "SSI_KYC_FRAMEWORK_2022:ev_008_repeated_kyc_costs"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

KYC processes burden banks and customers through repeated identity checks, manual work, poor customer experience, regulatory cost, and sensitive personal-data handling.

---

## Concept: SSI_KYC_FRAMEWORK_2022:prob_002_centralized_ekyc_data_silos_and_market_power
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:prob_002_centralized_ekyc_data_silos_and_market_power",
  "type": "Problem",
  "title": "Centralized eKYC utilities create data-silo, surveillance, and market-power risks",
  "description": "Central eKYC utilities can improve efficiency but aggregate sensitive identity data and power in one provider or government utility, creating security, privacy, and trust barriers.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_003_central_utility_limits",
    "SSI_KYC_FRAMEWORK_2022:ev_009_centralized_eKYC_risks"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Central eKYC utilities can improve efficiency but aggregate sensitive identity data and power in one provider or government utility, creating security, privacy, and trust barriers.

---

## Concept: SSI_KYC_FRAMEWORK_2022:prob_003_blockchain_transparency_vs_personal_data_privacy
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:prob_003_blockchain_transparency_vs_personal_data_privacy",
  "type": "Problem",
  "title": "Blockchain transparency conflicts with personal-data privacy in eKYC",
  "description": "Blockchain can provide a neutral cross-organizational trust platform, but its transparency and append-only data structure make direct storage of personal KYC data unsuitable.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_004_blockchain_privacy_tension",
    "SSI_KYC_FRAMEWORK_2022:ev_010_dlt_limitations_for_personal_data"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Blockchain can provide a neutral cross-organizational trust platform, but its transparency and append-only data structure make direct storage of personal KYC data unsuitable.

---

## Concept: SSI_KYC_FRAMEWORK_2022:dr_001_efficiency
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:dr_001_efficiency",
  "type": "Design Requirement",
  "title": "Improve eKYC process efficiency",
  "description": "The eKYC framework should enable end-to-end digital processing, automation of manual steps, and standardized exchange of eKYC documents across institutions.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_015_design_objectives_overview",
    "SSI_KYC_FRAMEWORK_2022:ev_016_efficiency_objective"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The eKYC framework should enable end-to-end digital processing, automation of manual steps, and standardized exchange of eKYC documents across institutions.

---

## Concept: SSI_KYC_FRAMEWORK_2022:dr_002_regulatory_compliance
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:dr_002_regulatory_compliance",
  "type": "Design Requirement",
  "title": "Maintain regulatory compliance",
  "description": "The framework should satisfy KYC/AML regulation, GDPR data-protection obligations, and electronic identification and trust-services requirements such as eIDAS.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_017_regulatory_compliance_objective"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The framework should satisfy KYC/AML regulation, GDPR data-protection obligations, and electronic identification and trust-services requirements such as eIDAS.

---

## Concept: SSI_KYC_FRAMEWORK_2022:dr_003_decentralization
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:dr_003_decentralization",
  "type": "Design Requirement",
  "title": "Avoid central customer-data storage and lock-in",
  "description": "The framework should avoid centralized stores of customer identity data and avoid creating a dominant eKYC service provider or lock-in effects.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_018_decentralization_objective",
    "SSI_KYC_FRAMEWORK_2022:ev_033_evaluation_decentralization"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The framework should avoid centralized stores of customer identity data and avoid creating a dominant eKYC service provider or lock-in effects.

---

## Concept: SSI_KYC_FRAMEWORK_2022:dr_004_trust_in_reusable_kyc_documents
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:dr_004_trust_in_reusable_kyc_documents",
  "type": "Design Requirement",
  "title": "Establish trust in reusable KYC documents",
  "description": "Banks should be able to trust KYC credentials issued by other trusted institutions, verify their validity, and check that the presenting customer legitimately controls them.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_019_trust_objective",
    "SSI_KYC_FRAMEWORK_2022:ev_034_evaluation_trust"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Banks should be able to trust KYC credentials issued by other trusted institutions, verify their validity, and check that the presenting customer legitimately controls them.

---

## Concept: SSI_KYC_FRAMEWORK_2022:dr_005_privacy
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:dr_005_privacy",
  "type": "Design Requirement",
  "title": "Preserve privacy and data minimization",
  "description": "The framework should follow need-to-know and data-minimization principles so only required KYC data are disclosed to necessary parties.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_020_privacy_objective",
    "SSI_KYC_FRAMEWORK_2022:ev_035_evaluation_privacy"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The framework should follow need-to-know and data-minimization principles so only required KYC data are disclosed to necessary parties.

---

## Concept: SSI_KYC_FRAMEWORK_2022:dr_006_user_experience
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:dr_006_user_experience",
  "type": "Design Requirement",
  "title": "Provide usable customer experience and recovery support",
  "description": "The eKYC process should be low-complexity, support multiple interfaces, and provide backup, recovery, and support mechanisms for users managing wallets and credentials.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_021_user_experience_objective",
    "SSI_KYC_FRAMEWORK_2022:ev_036_evaluation_user_experience"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The eKYC process should be low-complexity, support multiple interfaces, and provide backup, recovery, and support mechanisms for users managing wallets and credentials.

---

## Concept: SSI_KYC_FRAMEWORK_2022:dp_001_use_blockchain_only_for_public_data
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:dp_001_use_blockchain_only_for_public_data",
  "type": "Design Principle",
  "title": "Utilize blockchain only for public data",
  "description": "Use blockchain only for public SSI information such as credential issuer data, schemas, public signing keys, and revocation registries; avoid storing natural persons’ DIDs, VCs, credential hashes, or personal data on-chain.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_010_dlt_limitations_for_personal_data",
    "SSI_KYC_FRAMEWORK_2022:ev_037_dp1_public_data_only"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Use blockchain only for public SSI information such as credential issuer data, schemas, public signing keys, and revocation registries; avoid storing natural persons’ DIDs, VCs, credential hashes, or personal data on-chain.

---

## Concept: SSI_KYC_FRAMEWORK_2022:dp_002_anticipate_ecosystem_of_various_ledgers
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:dp_002_anticipate_ecosystem_of_various_ledgers",
  "type": "Design Principle",
  "title": "Anticipate an ecosystem of various ledgers",
  "description": "Design SSI systems for a multi-ledger ecosystem by relying on open standards, interoperability mechanisms, universal resolvers, and cross-ledger governance.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_038_dp2_multiple_ledgers"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Design SSI systems for a multi-ledger ecosystem by relying on open standards, interoperability mechanisms, universal resolvers, and cross-ledger governance.

---

## Concept: SSI_KYC_FRAMEWORK_2022:dp_003_enable_decentralization_at_the_edge
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:dp_003_enable_decentralization_at_the_edge",
  "type": "Design Principle",
  "title": "Enable decentralization at the edge",
  "description": "Let users store and manage verifiable credentials on infrastructure of their choice, using edge agents, encrypted cloud agents, and user-controlled backup/recovery without creating central honey pots.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_039_dp3_decentralization_at_edge"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Let users store and manage verifiable credentials on infrastructure of their choice, using edge agents, encrypted cloud agents, and user-controlled backup/recovery without creating central honey pots.

---

## Concept: SSI_KYC_FRAMEWORK_2022:dp_004_customer_centered_ssi_control
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:dp_004_customer_centered_ssi_control",
  "type": "Design Principle",
  "title": "Place the customer at the center of identity data control",
  "description": "The framework should keep KYC-related credentials and identity data under customer control, with banks and issuers interacting through verifiable presentations rather than central databases.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_011_ssi_roles_components",
    "SSI_KYC_FRAMEWORK_2022:ev_025_customer_control_wallets"
  ],
  "confidence": "medium-high",
  "extraction_type": "inferred",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The framework should keep KYC-related credentials and identity data under customer control, with banks and issuers interacting through verifiable presentations rather than central databases.

---

## Concept: SSI_KYC_FRAMEWORK_2022:dp_005_reuse_verifiable_kyc_credentials
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:dp_005_reuse_verifiable_kyc_credentials",
  "type": "Design Principle",
  "title": "Enable reuse of verifiable KYC results",
  "description": "Once KYC is completed, the result should be issued as a verifiable credential that can be reused for future onboarding at trusted institutions.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_027_fast_onboarding",
    "SSI_KYC_FRAMEWORK_2022:ev_031_evaluation_efficiency"
  ],
  "confidence": "medium-high",
  "extraction_type": "inferred",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Once KYC is completed, the result should be issued as a verifiable credential that can be reused for future onboarding at trusted institutions.

---

## Concept: SSI_KYC_FRAMEWORK_2022:dp_006_bilateral_secure_disclosure
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:dp_006_bilateral_secure_disclosure",
  "type": "Design Principle",
  "title": "Use bilateral secure disclosure rather than shared raw-data repositories",
  "description": "The system should exchange KYC attributes through secure bilateral channels and selective disclosure rather than exposing raw identity data through central or on-chain stores.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_032_evaluation_regulatory",
    "SSI_KYC_FRAMEWORK_2022:ev_035_evaluation_privacy"
  ],
  "confidence": "medium-high",
  "extraction_type": "inferred",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The system should exchange KYC attributes through secure bilateral channels and selective disclosure rather than exposing raw identity data through central or on-chain stores.

---

## Concept: SSI_KYC_FRAMEWORK_2022:df_001_dids_and_did_documents
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:df_001_dids_and_did_documents",
  "type": "Design Feature",
  "title": "DIDs and DID documents",
  "description": "Use decentralized identifiers and DID documents to represent identity endpoints, service endpoints, and public key material needed for secure communication and credential verification.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_011_ssi_roles_components",
    "SSI_KYC_FRAMEWORK_2022:ev_026_completely_new_onboarding"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Use decentralized identifiers and DID documents to represent identity endpoints, service endpoints, and public key material needed for secure communication and credential verification.

---

## Concept: SSI_KYC_FRAMEWORK_2022:df_002_user_agents_and_digital_wallets
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:df_002_user_agents_and_digital_wallets",
  "type": "Design Feature",
  "title": "User agents and digital wallets",
  "description": "Use edge and cloud agents/wallets to store DIDs, keys, credentials, backups, permissions, and messages under customer control.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_011_ssi_roles_components",
    "SSI_KYC_FRAMEWORK_2022:ev_025_customer_control_wallets"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Use edge and cloud agents/wallets to store DIDs, keys, credentials, backups, permissions, and messages under customer control.

---

## Concept: SSI_KYC_FRAMEWORK_2022:df_003_verifiable_credentials_and_presentations
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:df_003_verifiable_credentials_and_presentations",
  "type": "Design Feature",
  "title": "Verifiable credentials and verifiable presentations",
  "description": "Use VCs to represent attested KYC documents and VPs to disclose only required claims while proving credential validity.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_012_vc_and_revocation_capabilities",
    "SSI_KYC_FRAMEWORK_2022:ev_023_architecture_overview"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Use VCs to represent attested KYC documents and VPs to disclose only required claims while proving credential validity.

---

## Concept: SSI_KYC_FRAMEWORK_2022:df_004_pairwise_dids_for_customer_bank_relationships
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:df_004_pairwise_dids_for_customer_bank_relationships",
  "type": "Design Feature",
  "title": "Pairwise DIDs for customer-bank relationships",
  "description": "Use pairwise DIDs for bilateral customer-bank interactions so customers can avoid globally correlatable identifiers in KYC interactions.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_013_pairwise_dids_privacy",
    "SSI_KYC_FRAMEWORK_2022:ev_027_fast_onboarding"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Use pairwise DIDs for bilateral customer-bank interactions so customers can avoid globally correlatable identifiers in KYC interactions.

---

## Concept: SSI_KYC_FRAMEWORK_2022:df_005_revocation_registries
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:df_005_revocation_registries",
  "type": "Design Feature",
  "title": "Privacy-preserving revocation registries",
  "description": "Use public revocation registries so banks can verify whether credentials used in KYC have been revoked without contacting the issuer directly.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_012_vc_and_revocation_capabilities",
    "SSI_KYC_FRAMEWORK_2022:ev_027_fast_onboarding"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Use public revocation registries so banks can verify whether credentials used in KYC have been revoked without contacting the issuer directly.

---

## Concept: SSI_KYC_FRAMEWORK_2022:df_006_credential_schemas_and_definitions
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:df_006_credential_schemas_and_definitions",
  "type": "Design Feature",
  "title": "Credential schemas and definitions",
  "description": "Publish and use agreed KYC credential schemas and credential definitions so banks can request and verify standardized KYC claims.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_024_public_ledger_role",
    "SSI_KYC_FRAMEWORK_2022:ev_027_fast_onboarding"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Publish and use agreed KYC credential schemas and credential definitions so banks can request and verify standardized KYC claims.

---

## Concept: SSI_KYC_FRAMEWORK_2022:df_007_qualified_electronic_certificates_and_eidas_bridge
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:df_007_qualified_electronic_certificates_and_eidas_bridge",
  "type": "Design Feature",
  "title": "Qualified electronic certificates and eIDAS bridge",
  "description": "Combine SSI credentials with eIDAS-supported qualified digital signatures or certificates where needed to increase legal acceptance of digital KYC credentials.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_017_regulatory_compliance_objective",
    "SSI_KYC_FRAMEWORK_2022:ev_022_objective_evaluation_interviews"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Combine SSI credentials with eIDAS-supported qualified digital signatures or certificates where needed to increase legal acceptance of digital KYC credentials.

---

## Concept: SSI_KYC_FRAMEWORK_2022:df_008_public_data_registry_on_ledger
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:df_008_public_data_registry_on_ledger",
  "type": "Design Feature",
  "title": "Public SSI registry on distributed ledger",
  "description": "Store only public SSI data such as issuer DIDs, public signing keys, credential definitions, schemas, and revocation registries on the distributed ledger.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_024_public_ledger_role",
    "SSI_KYC_FRAMEWORK_2022:ev_037_dp1_public_data_only"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Store only public SSI data such as issuer DIDs, public signing keys, credential definitions, schemas, and revocation registries on the distributed ledger.

---

## Concept: SSI_KYC_FRAMEWORK_2022:df_009_secure_connection_protocol
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:df_009_secure_connection_protocol",
  "type": "Design Feature",
  "title": "Secure pairwise connection protocol",
  "description": "Establish encrypted pairwise channels between customer wallet/agent and bank KYC service endpoint for exchanging proof requests, credentials, and presentations.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_026_completely_new_onboarding",
    "SSI_KYC_FRAMEWORK_2022:ev_027_fast_onboarding"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Establish encrypted pairwise channels between customer wallet/agent and bank KYC service endpoint for exchanging proof requests, credentials, and presentations.

---

## Concept: SSI_KYC_FRAMEWORK_2022:df_010_proof_request_and_non_revocation_proof
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:df_010_proof_request_and_non_revocation_proof",
  "type": "Design Feature",
  "title": "Proof requests with non-revocation checks",
  "description": "Use bank proof requests specifying required attributes, accepted issuers/schemas, nonce protection, and non-revocation requirements; customer wallets respond with VPs.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_027_fast_onboarding"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Use bank proof requests specifying required attributes, accepted issuers/schemas, nonce protection, and non-revocation requirements; customer wallets respond with VPs.

---

## Concept: SSI_KYC_FRAMEWORK_2022:df_011_kyc_interface_name_screening_risk_engine
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:df_011_kyc_interface_name_screening_risk_engine",
  "type": "Design Feature",
  "title": "KYC interface, name screening, and risk engine integration",
  "description": "Integrate the SSI proof flow with bank back-end name screening, risk assessment, enhanced due diligence, and account-opening processes.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_028_name_screening_and_risk"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Integrate the SSI proof flow with bank back-end name screening, risk assessment, enhanced due diligence, and account-opening processes.

---

## Concept: SSI_KYC_FRAMEWORK_2022:df_012_ongoing_monitoring_via_secure_channel
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:df_012_ongoing_monitoring_via_secure_channel",
  "type": "Design Feature",
  "title": "Ongoing monitoring through secure proof refresh",
  "description": "Use the established secure channel to request updated proofs, non-revocation status, or additional documents during ongoing monitoring.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_029_ongoing_monitoring"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Use the established secure channel to request updated proofs, non-revocation status, or additional documents during ongoing monitoring.

---

## Concept: SSI_KYC_FRAMEWORK_2022:df_013_local_bank_records_with_privacy_options
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:df_013_local_bank_records_with_privacy_options",
  "type": "Design Feature",
  "title": "Local bank records with privacy-preserving documentation options",
  "description": "Banks may locally store required KYC records for regulatory reasons while using VCs/VPs and ZKP-oriented approaches to support auditability and privacy where possible.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_030_record_keeping"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Banks may locally store required KYC records for regulatory reasons while using VCs/VPs and ZKP-oriented approaches to support auditability and privacy where possible.

---

## Concept: SSI_KYC_FRAMEWORK_2022:df_014_backup_recovery_and_support
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:df_014_backup_recovery_and_support",
  "type": "Design Feature",
  "title": "Backup, recovery, and support for SSI wallets",
  "description": "Provide backup, recovery, and support mechanisms so customers can recover from device loss or wallet problems while preserving user control.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_021_user_experience_objective",
    "SSI_KYC_FRAMEWORK_2022:ev_036_evaluation_user_experience",
    "SSI_KYC_FRAMEWORK_2022:ev_039_dp3_decentralization_at_edge"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Provide backup, recovery, and support mechanisms so customers can recover from device loss or wallet problems while preserving user control.

---

## Concept: SSI_KYC_FRAMEWORK_2022:df_015_universal_resolvers_and_cross_ledger_interoperability
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:df_015_universal_resolvers_and_cross_ledger_interoperability",
  "type": "Design Feature",
  "title": "Universal resolvers and cross-ledger interoperability",
  "description": "Use DID methods, universal resolvers, open standards, and governance arrangements to resolve identifiers and verify credentials across multiple ledgers.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_038_dp2_multiple_ledgers"
  ],
  "confidence": "medium-high",
  "extraction_type": "inferred",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Use DID methods, universal resolvers, open standards, and governance arrangements to resolve identifiers and verify credentials across multiple ledgers.

---

## Concept: SSI_KYC_FRAMEWORK_2022:art_001_ssi_based_ekyc_framework
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:art_001_ssi_based_ekyc_framework",
  "type": "Artifact",
  "title": "SSI-based eKYC framework",
  "description": "A framework for digital KYC processes built on blockchain-based SSI, including architecture, process flows, objectives, and evaluated design principles.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_023_architecture_overview",
    "SSI_KYC_FRAMEWORK_2022:ev_041_conclusion_contributions"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

A framework for digital KYC processes built on blockchain-based SSI, including architecture, process flows, objectives, and evaluated design principles.

---

## Concept: SSI_KYC_FRAMEWORK_2022:art_002_completely_new_onboarding_process
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:art_002_completely_new_onboarding_process",
  "type": "Artifact",
  "title": "Completely new onboarding process",
  "description": "A sequence for customers without an SSI wallet or prior KYC VC, including wallet setup, DID establishment, identity document verification, account opening, and credential issuance.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_026_completely_new_onboarding"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

A sequence for customers without an SSI wallet or prior KYC VC, including wallet setup, DID establishment, identity document verification, account opening, and credential issuance.

---

## Concept: SSI_KYC_FRAMEWORK_2022:art_003_fast_onboarding_process
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:art_003_fast_onboarding_process",
  "type": "Artifact",
  "title": "Fast onboarding process",
  "description": "A sequence for customers who already hold KYC-relevant VCs, enabling rapid account opening through proof request, verifiable presentation, revocation checks, and risk assessment.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_027_fast_onboarding"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

A sequence for customers who already hold KYC-relevant VCs, enabling rapid account opening through proof request, verifiable presentation, revocation checks, and risk assessment.

---

## Concept: SSI_KYC_FRAMEWORK_2022:art_004_new_to_kyc_hybrid_onboarding_process
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:art_004_new_to_kyc_hybrid_onboarding_process",
  "type": "Artifact",
  "title": "New-to-KYC hybrid onboarding process",
  "description": "A hybrid process for customers with an SSI wallet and some identity-related credentials but no accepted KYC credential, combining proof reuse with new document verification.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_027_fast_onboarding"
  ],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

A hybrid process for customers with an SSI wallet and some identity-related credentials but no accepted KYC credential, combining proof reuse with new document verification.

---

## Concept: SSI_KYC_FRAMEWORK_2022:art_005_ssi_kyc_architecture_model
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:art_005_ssi_kyc_architecture_model",
  "type": "Artifact",
  "title": "SSI-based KYC architecture model",
  "description": "The architecture model linking issuer, holder/customer, verifier/bank, agents, wallets, VC/VP flows, distributed ledger, KYC interface, storage, name screening, and risk engine.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_023_architecture_overview"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The architecture model linking issuer, holder/customer, verifier/bank, agents, wallets, VC/VP flows, distributed ledger, KYC interface, storage, name screening, and risk engine.

---

## Concept: SSI_KYC_FRAMEWORK_2022:eval_001_design_objectives_formative_interviews
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:eval_001_design_objectives_formative_interviews",
  "type": "Evaluation",
  "title": "Formative expert evaluation of design objectives",
  "description": "Three initial expert interviews evaluated whether objectives and requirements for eKYC were relevant and complete.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_014_dsrm_process",
    "SSI_KYC_FRAMEWORK_2022:ev_022_objective_evaluation_interviews"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Three initial expert interviews evaluated whether objectives and requirements for eKYC were relevant and complete.

---

## Concept: SSI_KYC_FRAMEWORK_2022:eval_002_framework_criteria_based_evaluation
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:eval_002_framework_criteria_based_evaluation",
  "type": "Evaluation",
  "title": "Criteria-based expert evaluation of the SSI-based eKYC framework",
  "description": "Six additional expert interviews evaluated the framework against efficiency, regulatory compliance, decentralization, trust, privacy, and user experience objectives.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_031_evaluation_efficiency",
    "SSI_KYC_FRAMEWORK_2022:ev_032_evaluation_regulatory",
    "SSI_KYC_FRAMEWORK_2022:ev_033_evaluation_decentralization",
    "SSI_KYC_FRAMEWORK_2022:ev_034_evaluation_trust",
    "SSI_KYC_FRAMEWORK_2022:ev_035_evaluation_privacy",
    "SSI_KYC_FRAMEWORK_2022:ev_036_evaluation_user_experience"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Six additional expert interviews evaluated the framework against efficiency, regulatory compliance, decentralization, trust, privacy, and user experience objectives.

---

## Concept: SSI_KYC_FRAMEWORK_2022:eval_003_regulatory_privacy_fit_assessment
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:eval_003_regulatory_privacy_fit_assessment",
  "type": "Evaluation",
  "title": "Regulatory and privacy fit assessment",
  "description": "The framework was evaluated against GDPR, eIDAS, AML/KYC expectations, and the privacy consequences of avoiding on-chain personal-data writes.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_032_evaluation_regulatory",
    "SSI_KYC_FRAMEWORK_2022:ev_037_dp1_public_data_only"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The framework was evaluated against GDPR, eIDAS, AML/KYC expectations, and the privacy consequences of avoiding on-chain personal-data writes.

---

## Concept: SSI_KYC_FRAMEWORK_2022:eval_004_practical_feasibility_and_utility_assessment
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:eval_004_practical_feasibility_and_utility_assessment",
  "type": "Evaluation",
  "title": "Practical feasibility and utility assessment",
  "description": "Expert feedback suggested that SSI-based eKYC can improve efficiency, trust, privacy, and user experience while requiring governance and adoption work.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_031_evaluation_efficiency",
    "SSI_KYC_FRAMEWORK_2022:ev_040_adoption_and_governance_challenges"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Expert feedback suggested that SSI-based eKYC can improve efficiency, trust, privacy, and user experience while requiring governance and adoption work.

---

## Concept: SSI_KYC_FRAMEWORK_2022:ok_001_blockchain_role_in_ssi_should_be_restrictive
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ok_001_blockchain_role_in_ssi_should_be_restrictive",
  "type": "Output Knowledge",
  "title": "Blockchain’s role in SSI should be restrictive and public-data-oriented",
  "description": "The paper generalizes that blockchain should not hold personal identity data in SSI systems; it should primarily act as a public registry for issuer keys, schemas, standards, and revocation information.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_037_dp1_public_data_only",
    "SSI_KYC_FRAMEWORK_2022:ev_041_conclusion_contributions"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The paper generalizes that blockchain should not hold personal identity data in SSI systems; it should primarily act as a public registry for issuer keys, schemas, standards, and revocation information.

---

## Concept: SSI_KYC_FRAMEWORK_2022:ok_002_ssi_can_decouple_identity_reuse_from_centralized_identity_providers
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ok_002_ssi_can_decouple_identity_reuse_from_centralized_identity_providers",
  "type": "Output Knowledge",
  "title": "SSI enables reusable identity without centralized identity providers",
  "description": "SSI can make KYC credentials reusable across banks without concentrating customer data in a central data utility or identity provider.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_005_ssi_as_alternative",
    "SSI_KYC_FRAMEWORK_2022:ev_033_evaluation_decentralization"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

SSI can make KYC credentials reusable across banks without concentrating customer data in a central data utility or identity provider.

---

## Concept: SSI_KYC_FRAMEWORK_2022:ok_003_fast_onboarding_pattern_for_reusable_credentials
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ok_003_fast_onboarding_pattern_for_reusable_credentials",
  "type": "Output Knowledge",
  "title": "Fast onboarding pattern for reusable KYC credentials",
  "description": "Customers with accepted KYC credentials can complete onboarding quickly through proof requests and verifiable presentations instead of repeating manual identification.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_027_fast_onboarding",
    "SSI_KYC_FRAMEWORK_2022:ev_031_evaluation_efficiency"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Customers with accepted KYC credentials can complete onboarding quickly through proof requests and verifiable presentations instead of repeating manual identification.

---

## Concept: SSI_KYC_FRAMEWORK_2022:ok_004_bilateral_vp_exchange_as_privacy_pattern
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ok_004_bilateral_vp_exchange_as_privacy_pattern",
  "type": "Output Knowledge",
  "title": "Bilateral verifiable presentation exchange as a privacy pattern",
  "description": "Bilateral encrypted channels and selective-disclosure VPs enable banks to request needed evidence without relying on central repositories or public exposure of raw identity data.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_035_evaluation_privacy",
    "SSI_KYC_FRAMEWORK_2022:ev_039_dp3_decentralization_at_edge"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

Bilateral encrypted channels and selective-disclosure VPs enable banks to request needed evidence without relying on central repositories or public exposure of raw identity data.

---

## Concept: SSI_KYC_FRAMEWORK_2022:ok_005_multi_ledger_ssi_interoperability_challenge
```json
{
  "id": "SSI_KYC_FRAMEWORK_2022:ok_005_multi_ledger_ssi_interoperability_challenge",
  "type": "Output Knowledge",
  "title": "SSI interoperability requires standards and cross-ledger governance",
  "description": "The paper generalizes that SSI systems must anticipate multiple ledgers, DID methods, and governance frameworks rather than assuming a single shared ledger.",
  "evidence": [
    "SSI_KYC_FRAMEWORK_2022:ev_038_dp2_multiple_ledgers",
    "SSI_KYC_FRAMEWORK_2022:ev_040_adoption_and_governance_challenges"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The paper generalizes that SSI systems must anticipate multiple ledgers, DID methods, and governance frameworks rather than assuming a single shared ledger.
