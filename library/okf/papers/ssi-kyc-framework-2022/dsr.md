---
type: PaperDSRProfile
paper_id: SSI_KYC_FRAMEWORK_2022
title: DSR profile for SSI-based eKYC framework paper
review_status: reviewed
confidence: high
source_pdf: Designing a framework.pdf
---

# DSR-OKF Profile

## Paper-level summary

The paper designs and evaluates a blockchain-based self-sovereign identity framework for digital KYC. The framework shifts reusable KYC credentials toward customer-controlled wallets and uses blockchain only for public trust infrastructure. It contributes a concrete eKYC architecture, onboarding process models, and three nascent design principles for blockchain-based SSI.


---

## Concept: prob_001_costly_inefficient_privacy_sensitive_kyc

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:prob_001_costly_inefficient_privacy_sensitive_kyc
type: Problem
dsr_layer: Problem
title: Costly, inefficient, repetitive, privacy-sensitive KYC processes
description: KYC processes burden banks and customers through repeated identity checks,
  manual work, poor customer experience, regulatory cost, and sensitive personal-data
  handling.
tags:
- KYC
- eKYC
- banking
- regtech
- customer-onboarding
- privacy
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_001_abstract_problem_objective
- SSI_KYC_FRAMEWORK_2022:ev_002_intro_kyc_burden
- SSI_KYC_FRAMEWORK_2022:ev_007_kyc_process_steps
- SSI_KYC_FRAMEWORK_2022:ev_008_repeated_kyc_costs
```

### Explanation

KYC processes burden banks and customers through repeated identity checks, manual work, poor customer experience, regulatory cost, and sensitive personal-data handling.

---

## Concept: prob_002_centralized_ekyc_data_silos_and_market_power

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:prob_002_centralized_ekyc_data_silos_and_market_power
type: Problem
dsr_layer: Problem
title: Centralized eKYC utilities create data-silo, surveillance, and market-power
  risks
description: Central eKYC utilities can improve efficiency but aggregate sensitive
  identity data and power in one provider or government utility, creating security,
  privacy, and trust barriers.
tags:
- centralized-identity
- data-silo
- market-power
- surveillance
- Aadhaar
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_003_central_utility_limits
- SSI_KYC_FRAMEWORK_2022:ev_009_centralized_eKYC_risks
```

### Explanation

Central eKYC utilities can improve efficiency but aggregate sensitive identity data and power in one provider or government utility, creating security, privacy, and trust barriers.

---

## Concept: prob_003_blockchain_transparency_vs_personal_data_privacy

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:prob_003_blockchain_transparency_vs_personal_data_privacy
type: Problem
dsr_layer: Problem
title: Blockchain transparency conflicts with personal-data privacy in eKYC
description: Blockchain can provide a neutral cross-organizational trust platform,
  but its transparency and append-only data structure make direct storage of personal
  KYC data unsuitable.
tags:
- blockchain
- GDPR
- right-to-erasure
- privacy
- personal-data
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_004_blockchain_privacy_tension
- SSI_KYC_FRAMEWORK_2022:ev_010_dlt_limitations_for_personal_data
```

### Explanation

Blockchain can provide a neutral cross-organizational trust platform, but its transparency and append-only data structure make direct storage of personal KYC data unsuitable.

---

## Concept: rq_001_design_ssi_based_ekyc_framework

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:rq_001_design_ssi_based_ekyc_framework
type: ResearchQuestion
dsr_layer: ResearchQuestion
title: How can blockchain-based SSI support the complete digital KYC process?
description: The paper designs and evaluates an architecture and process framework
  for eKYC built on blockchain-based self-sovereign identity.
tags:
- research-question
- SSI
- KYC-framework
- blockchain
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_005_ssi_as_alternative
- SSI_KYC_FRAMEWORK_2022:ev_006_research_goal
```

### Explanation

The paper designs and evaluates an architecture and process framework for eKYC built on blockchain-based self-sovereign identity.

---

## Concept: rq_002_derive_design_principles_for_blockchain_based_ssi

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:rq_002_derive_design_principles_for_blockchain_based_ssi
type: ResearchQuestion
dsr_layer: ResearchQuestion
title: What generic design principles guide blockchain-based SSI systems?
description: Beyond KYC, the paper derives nascent design principles for how blockchain
  should be used in SSI architectures.
tags:
- research-question
- design-principles
- SSI
- generalization
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_006_research_goal
- SSI_KYC_FRAMEWORK_2022:ev_041_conclusion_contributions
```

### Explanation

Beyond KYC, the paper derives nascent design principles for how blockchain should be used in SSI architectures.

---

## Concept: dr_001_efficiency

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:dr_001_efficiency
type: DesignRequirement
dsr_layer: Requirement
title: Improve eKYC process efficiency
description: The eKYC framework should enable end-to-end digital processing, automation
  of manual steps, and standardized exchange of eKYC documents across institutions.
tags:
- efficiency
- automation
- digital-processing
- standardized-exchange
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_015_design_objectives_overview
- SSI_KYC_FRAMEWORK_2022:ev_016_efficiency_objective
```

### Explanation

The eKYC framework should enable end-to-end digital processing, automation of manual steps, and standardized exchange of eKYC documents across institutions.

---

## Concept: dr_002_regulatory_compliance

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:dr_002_regulatory_compliance
type: DesignRequirement
dsr_layer: Requirement
title: Maintain regulatory compliance
description: The framework should satisfy KYC/AML regulation, GDPR data-protection
  obligations, and electronic identification and trust-services requirements such
  as eIDAS.
tags:
- regulatory-compliance
- AML
- GDPR
- eIDAS
- MLA
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_017_regulatory_compliance_objective
```

### Explanation

The framework should satisfy KYC/AML regulation, GDPR data-protection obligations, and electronic identification and trust-services requirements such as eIDAS.

---

## Concept: dr_003_decentralization

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:dr_003_decentralization
type: DesignRequirement
dsr_layer: Requirement
title: Avoid central customer-data storage and lock-in
description: The framework should avoid centralized stores of customer identity data
  and avoid creating a dominant eKYC service provider or lock-in effects.
tags:
- decentralization
- no-data-silo
- lock-in
- market-power
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_018_decentralization_objective
- SSI_KYC_FRAMEWORK_2022:ev_033_evaluation_decentralization
```

### Explanation

The framework should avoid centralized stores of customer identity data and avoid creating a dominant eKYC service provider or lock-in effects.

---

## Concept: dr_004_trust_in_reusable_kyc_documents

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:dr_004_trust_in_reusable_kyc_documents
type: DesignRequirement
dsr_layer: Requirement
title: Establish trust in reusable KYC documents
description: Banks should be able to trust KYC credentials issued by other trusted
  institutions, verify their validity, and check that the presenting customer legitimately
  controls them.
tags:
- trust
- reusable-KYC
- credential-validation
- authenticity
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_019_trust_objective
- SSI_KYC_FRAMEWORK_2022:ev_034_evaluation_trust
```

### Explanation

Banks should be able to trust KYC credentials issued by other trusted institutions, verify their validity, and check that the presenting customer legitimately controls them.

---

## Concept: dr_005_privacy

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:dr_005_privacy
type: DesignRequirement
dsr_layer: Requirement
title: Preserve privacy and data minimization
description: The framework should follow need-to-know and data-minimization principles
  so only required KYC data are disclosed to necessary parties.
tags:
- privacy
- need-to-know
- data-minimization
- selective-disclosure
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_020_privacy_objective
- SSI_KYC_FRAMEWORK_2022:ev_035_evaluation_privacy
```

### Explanation

The framework should follow need-to-know and data-minimization principles so only required KYC data are disclosed to necessary parties.

---

## Concept: dr_006_user_experience

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:dr_006_user_experience
type: DesignRequirement
dsr_layer: Requirement
title: Provide usable customer experience and recovery support
description: The eKYC process should be low-complexity, support multiple interfaces,
  and provide backup, recovery, and support mechanisms for users managing wallets
  and credentials.
tags:
- user-experience
- wallet-usability
- backup
- recovery
- support
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_021_user_experience_objective
- SSI_KYC_FRAMEWORK_2022:ev_036_evaluation_user_experience
```

### Explanation

The eKYC process should be low-complexity, support multiple interfaces, and provide backup, recovery, and support mechanisms for users managing wallets and credentials.

---

## Concept: dp_001_use_blockchain_only_for_public_data

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:dp_001_use_blockchain_only_for_public_data
type: DesignPrinciple
dsr_layer: Principle
title: Utilize blockchain only for public data
description: "Use blockchain only for public SSI information such as credential issuer\
  \ data, schemas, public signing keys, and revocation registries; avoid storing natural\
  \ persons\u2019 DIDs, VCs, credential hashes, or personal data on-chain."
tags:
- design-principle
- public-data-only
- minimal-blockchain
- GDPR
- SSI
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_010_dlt_limitations_for_personal_data
- SSI_KYC_FRAMEWORK_2022:ev_037_dp1_public_data_only
```

### Explanation

Use blockchain only for public SSI information such as credential issuer data, schemas, public signing keys, and revocation registries; avoid storing natural persons’ DIDs, VCs, credential hashes, or personal data on-chain.

---

## Concept: dp_002_anticipate_ecosystem_of_various_ledgers

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:dp_002_anticipate_ecosystem_of_various_ledgers
type: DesignPrinciple
dsr_layer: Principle
title: Anticipate an ecosystem of various ledgers
description: Design SSI systems for a multi-ledger ecosystem by relying on open standards,
  interoperability mechanisms, universal resolvers, and cross-ledger governance.
tags:
- design-principle
- multi-ledger
- interoperability
- universal-resolver
- standards
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_038_dp2_multiple_ledgers
```

### Explanation

Design SSI systems for a multi-ledger ecosystem by relying on open standards, interoperability mechanisms, universal resolvers, and cross-ledger governance.

---

## Concept: dp_003_enable_decentralization_at_the_edge

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:dp_003_enable_decentralization_at_the_edge
type: DesignPrinciple
dsr_layer: Principle
title: Enable decentralization at the edge
description: Let users store and manage verifiable credentials on infrastructure of
  their choice, using edge agents, encrypted cloud agents, and user-controlled backup/recovery
  without creating central honey pots.
tags:
- design-principle
- edge-decentralization
- wallets
- user-control
- cloud-agent
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_039_dp3_decentralization_at_edge
```

### Explanation

Let users store and manage verifiable credentials on infrastructure of their choice, using edge agents, encrypted cloud agents, and user-controlled backup/recovery without creating central honey pots.

---

## Concept: dp_004_customer_centered_ssi_control

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:dp_004_customer_centered_ssi_control
type: DesignPrinciple
dsr_layer: Principle
title: Place the customer at the center of identity data control
description: The framework should keep KYC-related credentials and identity data under
  customer control, with banks and issuers interacting through verifiable presentations
  rather than central databases.
tags:
- SSI
- customer-control
- holder-centric
- verifiable-presentation
confidence: medium-high
extraction_type: inferred
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_011_ssi_roles_components
- SSI_KYC_FRAMEWORK_2022:ev_025_customer_control_wallets
```

### Explanation

The framework should keep KYC-related credentials and identity data under customer control, with banks and issuers interacting through verifiable presentations rather than central databases.

---

## Concept: dp_005_reuse_verifiable_kyc_credentials

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:dp_005_reuse_verifiable_kyc_credentials
type: DesignPrinciple
dsr_layer: Principle
title: Enable reuse of verifiable KYC results
description: Once KYC is completed, the result should be issued as a verifiable credential
  that can be reused for future onboarding at trusted institutions.
tags:
- credential-reuse
- fast-onboarding
- interbank-collaboration
confidence: medium-high
extraction_type: inferred
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_027_fast_onboarding
- SSI_KYC_FRAMEWORK_2022:ev_031_evaluation_efficiency
```

### Explanation

Once KYC is completed, the result should be issued as a verifiable credential that can be reused for future onboarding at trusted institutions.

---

## Concept: dp_006_bilateral_secure_disclosure

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:dp_006_bilateral_secure_disclosure
type: DesignPrinciple
dsr_layer: Principle
title: Use bilateral secure disclosure rather than shared raw-data repositories
description: The system should exchange KYC attributes through secure bilateral channels
  and selective disclosure rather than exposing raw identity data through central
  or on-chain stores.
tags:
- bilateral-communication
- secure-channel
- selective-disclosure
- privacy
confidence: medium-high
extraction_type: inferred
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_032_evaluation_regulatory
- SSI_KYC_FRAMEWORK_2022:ev_035_evaluation_privacy
```

### Explanation

The system should exchange KYC attributes through secure bilateral channels and selective disclosure rather than exposing raw identity data through central or on-chain stores.

---

## Concept: df_001_dids_and_did_documents

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:df_001_dids_and_did_documents
type: DesignFeature
dsr_layer: Feature
title: DIDs and DID documents
description: Use decentralized identifiers and DID documents to represent identity
  endpoints, service endpoints, and public key material needed for secure communication
  and credential verification.
tags:
- DID
- DID-document
- public-key
- service-endpoint
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_011_ssi_roles_components
- SSI_KYC_FRAMEWORK_2022:ev_026_completely_new_onboarding
```

### Explanation

Use decentralized identifiers and DID documents to represent identity endpoints, service endpoints, and public key material needed for secure communication and credential verification.

---

## Concept: df_002_user_agents_and_digital_wallets

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:df_002_user_agents_and_digital_wallets
type: DesignFeature
dsr_layer: Feature
title: User agents and digital wallets
description: Use edge and cloud agents/wallets to store DIDs, keys, credentials, backups,
  permissions, and messages under customer control.
tags:
- wallet
- edge-agent
- cloud-agent
- key-management
- credential-storage
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_011_ssi_roles_components
- SSI_KYC_FRAMEWORK_2022:ev_025_customer_control_wallets
```

### Explanation

Use edge and cloud agents/wallets to store DIDs, keys, credentials, backups, permissions, and messages under customer control.

---

## Concept: df_003_verifiable_credentials_and_presentations

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:df_003_verifiable_credentials_and_presentations
type: DesignFeature
dsr_layer: Feature
title: Verifiable credentials and verifiable presentations
description: Use VCs to represent attested KYC documents and VPs to disclose only
  required claims while proving credential validity.
tags:
- VC
- VP
- KYC-document
- selective-disclosure
- attestation
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_012_vc_and_revocation_capabilities
- SSI_KYC_FRAMEWORK_2022:ev_023_architecture_overview
```

### Explanation

Use VCs to represent attested KYC documents and VPs to disclose only required claims while proving credential validity.

---

## Concept: df_004_pairwise_dids_for_customer_bank_relationships

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:df_004_pairwise_dids_for_customer_bank_relationships
type: DesignFeature
dsr_layer: Feature
title: Pairwise DIDs for customer-bank relationships
description: Use pairwise DIDs for bilateral customer-bank interactions so customers
  can avoid globally correlatable identifiers in KYC interactions.
tags:
- pairwise-DID
- privacy
- pseudonymity
- bilateral-relationship
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_013_pairwise_dids_privacy
- SSI_KYC_FRAMEWORK_2022:ev_027_fast_onboarding
```

### Explanation

Use pairwise DIDs for bilateral customer-bank interactions so customers can avoid globally correlatable identifiers in KYC interactions.

---

## Concept: df_005_revocation_registries

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:df_005_revocation_registries
type: DesignFeature
dsr_layer: Feature
title: Privacy-preserving revocation registries
description: Use public revocation registries so banks can verify whether credentials
  used in KYC have been revoked without contacting the issuer directly.
tags:
- revocation-registry
- non-revocation-proof
- credential-status
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_012_vc_and_revocation_capabilities
- SSI_KYC_FRAMEWORK_2022:ev_027_fast_onboarding
```

### Explanation

Use public revocation registries so banks can verify whether credentials used in KYC have been revoked without contacting the issuer directly.

---

## Concept: df_006_credential_schemas_and_definitions

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:df_006_credential_schemas_and_definitions
type: DesignFeature
dsr_layer: Feature
title: Credential schemas and definitions
description: Publish and use agreed KYC credential schemas and credential definitions
  so banks can request and verify standardized KYC claims.
tags:
- credential-schema
- credential-definition
- standardization
- KYC-claims
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_024_public_ledger_role
- SSI_KYC_FRAMEWORK_2022:ev_027_fast_onboarding
```

### Explanation

Publish and use agreed KYC credential schemas and credential definitions so banks can request and verify standardized KYC claims.

---

## Concept: df_007_qualified_electronic_certificates_and_eidas_bridge

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:df_007_qualified_electronic_certificates_and_eidas_bridge
type: DesignFeature
dsr_layer: Feature
title: Qualified electronic certificates and eIDAS bridge
description: Combine SSI credentials with eIDAS-supported qualified digital signatures
  or certificates where needed to increase legal acceptance of digital KYC credentials.
tags:
- eIDAS
- qualified-electronic-certificate
- legal-identity
- trust
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_017_regulatory_compliance_objective
- SSI_KYC_FRAMEWORK_2022:ev_022_objective_evaluation_interviews
```

### Explanation

Combine SSI credentials with eIDAS-supported qualified digital signatures or certificates where needed to increase legal acceptance of digital KYC credentials.

---

## Concept: df_008_public_data_registry_on_ledger

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:df_008_public_data_registry_on_ledger
type: DesignFeature
dsr_layer: Feature
title: Public SSI registry on distributed ledger
description: Store only public SSI data such as issuer DIDs, public signing keys,
  credential definitions, schemas, and revocation registries on the distributed ledger.
tags:
- ledger
- public-registry
- issuer-keys
- schemas
- revocation
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_024_public_ledger_role
- SSI_KYC_FRAMEWORK_2022:ev_037_dp1_public_data_only
```

### Explanation

Store only public SSI data such as issuer DIDs, public signing keys, credential definitions, schemas, and revocation registries on the distributed ledger.

---

## Concept: df_009_secure_connection_protocol

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:df_009_secure_connection_protocol
type: DesignFeature
dsr_layer: Feature
title: Secure pairwise connection protocol
description: Establish encrypted pairwise channels between customer wallet/agent and
  bank KYC service endpoint for exchanging proof requests, credentials, and presentations.
tags:
- secure-connection
- pairwise-channel
- encrypted-messaging
- agent-protocol
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_026_completely_new_onboarding
- SSI_KYC_FRAMEWORK_2022:ev_027_fast_onboarding
```

### Explanation

Establish encrypted pairwise channels between customer wallet/agent and bank KYC service endpoint for exchanging proof requests, credentials, and presentations.

---

## Concept: df_010_proof_request_and_non_revocation_proof

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:df_010_proof_request_and_non_revocation_proof
type: DesignFeature
dsr_layer: Feature
title: Proof requests with non-revocation checks
description: Use bank proof requests specifying required attributes, accepted issuers/schemas,
  nonce protection, and non-revocation requirements; customer wallets respond with
  VPs.
tags:
- proof-request
- nonce
- non-revocation
- verifiable-presentation
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_027_fast_onboarding
```

### Explanation

Use bank proof requests specifying required attributes, accepted issuers/schemas, nonce protection, and non-revocation requirements; customer wallets respond with VPs.

---

## Concept: df_011_kyc_interface_name_screening_risk_engine

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:df_011_kyc_interface_name_screening_risk_engine
type: DesignFeature
dsr_layer: Feature
title: KYC interface, name screening, and risk engine integration
description: Integrate the SSI proof flow with bank back-end name screening, risk
  assessment, enhanced due diligence, and account-opening processes.
tags:
- KYC-interface
- name-screening
- risk-engine
- enhanced-due-diligence
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_028_name_screening_and_risk
```

### Explanation

Integrate the SSI proof flow with bank back-end name screening, risk assessment, enhanced due diligence, and account-opening processes.

---

## Concept: df_012_ongoing_monitoring_via_secure_channel

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:df_012_ongoing_monitoring_via_secure_channel
type: DesignFeature
dsr_layer: Feature
title: Ongoing monitoring through secure proof refresh
description: Use the established secure channel to request updated proofs, non-revocation
  status, or additional documents during ongoing monitoring.
tags:
- ongoing-monitoring
- proof-refresh
- secure-channel
- risk-monitoring
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_029_ongoing_monitoring
```

### Explanation

Use the established secure channel to request updated proofs, non-revocation status, or additional documents during ongoing monitoring.

---

## Concept: df_013_local_bank_records_with_privacy_options

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:df_013_local_bank_records_with_privacy_options
type: DesignFeature
dsr_layer: Feature
title: Local bank records with privacy-preserving documentation options
description: Banks may locally store required KYC records for regulatory reasons while
  using VCs/VPs and ZKP-oriented approaches to support auditability and privacy where
  possible.
tags:
- record-keeping
- local-storage
- auditability
- ZKP
- privacy
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_030_record_keeping
```

### Explanation

Banks may locally store required KYC records for regulatory reasons while using VCs/VPs and ZKP-oriented approaches to support auditability and privacy where possible.

---

## Concept: df_014_backup_recovery_and_support

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:df_014_backup_recovery_and_support
type: DesignFeature
dsr_layer: Feature
title: Backup, recovery, and support for SSI wallets
description: Provide backup, recovery, and support mechanisms so customers can recover
  from device loss or wallet problems while preserving user control.
tags:
- backup
- recovery
- support
- wallet-usability
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_021_user_experience_objective
- SSI_KYC_FRAMEWORK_2022:ev_036_evaluation_user_experience
- SSI_KYC_FRAMEWORK_2022:ev_039_dp3_decentralization_at_edge
```

### Explanation

Provide backup, recovery, and support mechanisms so customers can recover from device loss or wallet problems while preserving user control.

---

## Concept: df_015_universal_resolvers_and_cross_ledger_interoperability

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:df_015_universal_resolvers_and_cross_ledger_interoperability
type: DesignFeature
dsr_layer: Feature
title: Universal resolvers and cross-ledger interoperability
description: Use DID methods, universal resolvers, open standards, and governance
  arrangements to resolve identifiers and verify credentials across multiple ledgers.
tags:
- universal-resolver
- cross-ledger
- interoperability
- DID-method
confidence: medium-high
extraction_type: inferred
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_038_dp2_multiple_ledgers
```

### Explanation

Use DID methods, universal resolvers, open standards, and governance arrangements to resolve identifiers and verify credentials across multiple ledgers.

---

## Concept: art_001_ssi_based_ekyc_framework

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:art_001_ssi_based_ekyc_framework
type: Artifact
dsr_layer: Artifact
title: SSI-based eKYC framework
description: A framework for digital KYC processes built on blockchain-based SSI,
  including architecture, process flows, objectives, and evaluated design principles.
tags:
- artifact
- framework
- SSI
- eKYC
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_023_architecture_overview
- SSI_KYC_FRAMEWORK_2022:ev_041_conclusion_contributions
```

### Explanation

A framework for digital KYC processes built on blockchain-based SSI, including architecture, process flows, objectives, and evaluated design principles.

---

## Concept: art_002_completely_new_onboarding_process

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:art_002_completely_new_onboarding_process
type: Artifact
dsr_layer: Artifact
title: Completely new onboarding process
description: A sequence for customers without an SSI wallet or prior KYC VC, including
  wallet setup, DID establishment, identity document verification, account opening,
  and credential issuance.
tags:
- artifact
- process
- new-onboarding
- UML
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_026_completely_new_onboarding
```

### Explanation

A sequence for customers without an SSI wallet or prior KYC VC, including wallet setup, DID establishment, identity document verification, account opening, and credential issuance.

---

## Concept: art_003_fast_onboarding_process

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:art_003_fast_onboarding_process
type: Artifact
dsr_layer: Artifact
title: Fast onboarding process
description: A sequence for customers who already hold KYC-relevant VCs, enabling
  rapid account opening through proof request, verifiable presentation, revocation
  checks, and risk assessment.
tags:
- artifact
- process
- fast-onboarding
- credential-reuse
- UML
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_027_fast_onboarding
```

### Explanation

A sequence for customers who already hold KYC-relevant VCs, enabling rapid account opening through proof request, verifiable presentation, revocation checks, and risk assessment.

---

## Concept: art_004_new_to_kyc_hybrid_onboarding_process

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:art_004_new_to_kyc_hybrid_onboarding_process
type: Artifact
dsr_layer: Artifact
title: New-to-KYC hybrid onboarding process
description: A hybrid process for customers with an SSI wallet and some identity-related
  credentials but no accepted KYC credential, combining proof reuse with new document
  verification.
tags:
- artifact
- process
- hybrid-onboarding
- new-to-KYC
confidence: high
extraction_type: explicit-in-artifact
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_027_fast_onboarding
```

### Explanation

A hybrid process for customers with an SSI wallet and some identity-related credentials but no accepted KYC credential, combining proof reuse with new document verification.

---

## Concept: art_005_ssi_kyc_architecture_model

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:art_005_ssi_kyc_architecture_model
type: Artifact
dsr_layer: Artifact
title: SSI-based KYC architecture model
description: The architecture model linking issuer, holder/customer, verifier/bank,
  agents, wallets, VC/VP flows, distributed ledger, KYC interface, storage, name screening,
  and risk engine.
tags:
- architecture
- model
- SSI
- KYC
- ledger
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_023_architecture_overview
```

### Explanation

The architecture model linking issuer, holder/customer, verifier/bank, agents, wallets, VC/VP flows, distributed ledger, KYC interface, storage, name screening, and risk engine.

---

## Concept: eval_001_design_objectives_formative_interviews

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:eval_001_design_objectives_formative_interviews
type: Evaluation
dsr_layer: Evaluation
title: Formative expert evaluation of design objectives
description: Three initial expert interviews evaluated whether objectives and requirements
  for eKYC were relevant and complete.
tags:
- evaluation
- formative
- expert-interviews
- objectives
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_014_dsrm_process
- SSI_KYC_FRAMEWORK_2022:ev_022_objective_evaluation_interviews
```

### Explanation

Three initial expert interviews evaluated whether objectives and requirements for eKYC were relevant and complete.

---

## Concept: eval_002_framework_criteria_based_evaluation

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:eval_002_framework_criteria_based_evaluation
type: Evaluation
dsr_layer: Evaluation
title: Criteria-based expert evaluation of the SSI-based eKYC framework
description: Six additional expert interviews evaluated the framework against efficiency,
  regulatory compliance, decentralization, trust, privacy, and user experience objectives.
tags:
- evaluation
- criteria-based
- expert-interviews
- framework
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_031_evaluation_efficiency
- SSI_KYC_FRAMEWORK_2022:ev_032_evaluation_regulatory
- SSI_KYC_FRAMEWORK_2022:ev_033_evaluation_decentralization
- SSI_KYC_FRAMEWORK_2022:ev_034_evaluation_trust
- SSI_KYC_FRAMEWORK_2022:ev_035_evaluation_privacy
- SSI_KYC_FRAMEWORK_2022:ev_036_evaluation_user_experience
```

### Explanation

Six additional expert interviews evaluated the framework against efficiency, regulatory compliance, decentralization, trust, privacy, and user experience objectives.

---

## Concept: eval_003_regulatory_privacy_fit_assessment

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:eval_003_regulatory_privacy_fit_assessment
type: Evaluation
dsr_layer: Evaluation
title: Regulatory and privacy fit assessment
description: The framework was evaluated against GDPR, eIDAS, AML/KYC expectations,
  and the privacy consequences of avoiding on-chain personal-data writes.
tags:
- evaluation
- regulatory
- GDPR
- eIDAS
- privacy
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_032_evaluation_regulatory
- SSI_KYC_FRAMEWORK_2022:ev_037_dp1_public_data_only
```

### Explanation

The framework was evaluated against GDPR, eIDAS, AML/KYC expectations, and the privacy consequences of avoiding on-chain personal-data writes.

---

## Concept: eval_004_practical_feasibility_and_utility_assessment

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:eval_004_practical_feasibility_and_utility_assessment
type: Evaluation
dsr_layer: Evaluation
title: Practical feasibility and utility assessment
description: Expert feedback suggested that SSI-based eKYC can improve efficiency,
  trust, privacy, and user experience while requiring governance and adoption work.
tags:
- evaluation
- utility
- feasibility
- expert-feedback
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_031_evaluation_efficiency
- SSI_KYC_FRAMEWORK_2022:ev_040_adoption_and_governance_challenges
```

### Explanation

Expert feedback suggested that SSI-based eKYC can improve efficiency, trust, privacy, and user experience while requiring governance and adoption work.

---

## Concept: ok_001_blockchain_role_in_ssi_should_be_restrictive

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:ok_001_blockchain_role_in_ssi_should_be_restrictive
type: OutputKnowledge
dsr_layer: OutputKnowledge
title: "Blockchain\u2019s role in SSI should be restrictive and public-data-oriented"
description: The paper generalizes that blockchain should not hold personal identity
  data in SSI systems; it should primarily act as a public registry for issuer keys,
  schemas, standards, and revocation information.
tags:
- output-knowledge
- minimal-blockchain
- SSI
- public-registry
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_037_dp1_public_data_only
- SSI_KYC_FRAMEWORK_2022:ev_041_conclusion_contributions
```

### Explanation

The paper generalizes that blockchain should not hold personal identity data in SSI systems; it should primarily act as a public registry for issuer keys, schemas, standards, and revocation information.

---

## Concept: ok_002_ssi_can_decouple_identity_reuse_from_centralized_identity_providers

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:ok_002_ssi_can_decouple_identity_reuse_from_centralized_identity_providers
type: OutputKnowledge
dsr_layer: OutputKnowledge
title: SSI enables reusable identity without centralized identity providers
description: SSI can make KYC credentials reusable across banks without concentrating
  customer data in a central data utility or identity provider.
tags:
- output-knowledge
- identity-reuse
- decentralization
- reusable-KYC
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_005_ssi_as_alternative
- SSI_KYC_FRAMEWORK_2022:ev_033_evaluation_decentralization
```

### Explanation

SSI can make KYC credentials reusable across banks without concentrating customer data in a central data utility or identity provider.

---

## Concept: ok_003_fast_onboarding_pattern_for_reusable_credentials

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:ok_003_fast_onboarding_pattern_for_reusable_credentials
type: OutputKnowledge
dsr_layer: OutputKnowledge
title: Fast onboarding pattern for reusable KYC credentials
description: Customers with accepted KYC credentials can complete onboarding quickly
  through proof requests and verifiable presentations instead of repeating manual
  identification.
tags:
- output-knowledge
- fast-onboarding
- verifiable-presentation
- process-pattern
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_027_fast_onboarding
- SSI_KYC_FRAMEWORK_2022:ev_031_evaluation_efficiency
```

### Explanation

Customers with accepted KYC credentials can complete onboarding quickly through proof requests and verifiable presentations instead of repeating manual identification.

---

## Concept: ok_004_bilateral_vp_exchange_as_privacy_pattern

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:ok_004_bilateral_vp_exchange_as_privacy_pattern
type: OutputKnowledge
dsr_layer: OutputKnowledge
title: Bilateral verifiable presentation exchange as a privacy pattern
description: Bilateral encrypted channels and selective-disclosure VPs enable banks
  to request needed evidence without relying on central repositories or public exposure
  of raw identity data.
tags:
- output-knowledge
- bilateral-exchange
- selective-disclosure
- privacy-pattern
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_035_evaluation_privacy
- SSI_KYC_FRAMEWORK_2022:ev_039_dp3_decentralization_at_edge
```

### Explanation

Bilateral encrypted channels and selective-disclosure VPs enable banks to request needed evidence without relying on central repositories or public exposure of raw identity data.

---

## Concept: ok_005_multi_ledger_ssi_interoperability_challenge

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:ok_005_multi_ledger_ssi_interoperability_challenge
type: OutputKnowledge
dsr_layer: OutputKnowledge
title: SSI interoperability requires standards and cross-ledger governance
description: The paper generalizes that SSI systems must anticipate multiple ledgers,
  DID methods, and governance frameworks rather than assuming a single shared ledger.
tags:
- output-knowledge
- interoperability
- multi-ledger
- governance
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_038_dp2_multiple_ledgers
- SSI_KYC_FRAMEWORK_2022:ev_040_adoption_and_governance_challenges
```

### Explanation

The paper generalizes that SSI systems must anticipate multiple ledgers, DID methods, and governance frameworks rather than assuming a single shared ledger.

---

## Concept: kt_001_peffers_dsrm

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:kt_001_peffers_dsrm
type: KernelTheory
dsr_layer: KernelTheory
title: Peffers et al. design science research methodology
description: The study uses Peffers et al. DSRM to structure problem identification,
  objectives, design and development, demonstration, evaluation, and communication.
tags:
- kernel-theory
- DSRM
- Peffers
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_014_dsrm_process
```

### Explanation

The study uses Peffers et al. DSRM to structure problem identification, objectives, design and development, demonstration, evaluation, and communication.

---

## Concept: kt_002_self_sovereign_identity

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:kt_002_self_sovereign_identity
type: KernelTheory
dsr_layer: KernelTheory
title: Self-sovereign identity
description: SSI provides the conceptual foundation for customer-controlled digital
  identities, DIDs, wallets, credentials, and selective disclosure.
tags:
- kernel-theory
- SSI
- decentralized-identity
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_011_ssi_roles_components
- SSI_KYC_FRAMEWORK_2022:ev_012_vc_and_revocation_capabilities
```

### Explanation

SSI provides the conceptual foundation for customer-controlled digital identities, DIDs, wallets, credentials, and selective disclosure.

---

## Concept: kt_003_verifiable_credentials_and_dids_standards

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:kt_003_verifiable_credentials_and_dids_standards
type: KernelTheory
dsr_layer: KernelTheory
title: DID and verifiable credential standards
description: The framework builds on DID and VC standards to create portable identifiers,
  attestations, and verifiable presentations for cross-organizational identity management.
tags:
- kernel-theory
- W3C
- DID
- VC
- standards
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_011_ssi_roles_components
- SSI_KYC_FRAMEWORK_2022:ev_012_vc_and_revocation_capabilities
```

### Explanation

The framework builds on DID and VC standards to create portable identifiers, attestations, and verifiable presentations for cross-organizational identity management.

---

## Concept: kt_004_gdpr_and_eidas_regulatory_context

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:kt_004_gdpr_and_eidas_regulatory_context
type: KernelTheory
dsr_layer: KernelTheory
title: GDPR, AML/KYC, and eIDAS regulatory context
description: The framework is shaped by AML/KYC due diligence obligations, GDPR privacy
  requirements, and eIDAS-compatible digital identification and trust services.
tags:
- kernel-theory
- GDPR
- AML
- eIDAS
- regulation
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_017_regulatory_compliance_objective
- SSI_KYC_FRAMEWORK_2022:ev_032_evaluation_regulatory
```

### Explanation

The framework is shaped by AML/KYC due diligence obligations, GDPR privacy requirements, and eIDAS-compatible digital identification and trust services.

---

## Concept: kt_005_blockchain_as_neutral_cross_organizational_infrastructure

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:kt_005_blockchain_as_neutral_cross_organizational_infrastructure
type: KernelTheory
dsr_layer: KernelTheory
title: Blockchain as neutral cross-organizational infrastructure
description: Blockchain is treated as a neutral infrastructure for public trust anchors
  and cross-organizational coordination, not as a general storage medium for personal
  data.
tags:
- kernel-theory
- blockchain
- cross-organizational
- neutral-platform
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_004_blockchain_privacy_tension
- SSI_KYC_FRAMEWORK_2022:ev_024_public_ledger_role
```

### Explanation

Blockchain is treated as a neutral infrastructure for public trust anchors and cross-organizational coordination, not as a general storage medium for personal data.

---

## Concept: lim_001_governance_and_adoption_challenges

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:lim_001_governance_and_adoption_challenges
type: Limitation
dsr_layer: Limitation
title: Governance and adoption challenges remain unresolved
description: The framework requires standards, credential issuers, bank cooperation,
  trusted issuers, governance frameworks, and sufficient adoption to overcome chicken-and-egg
  dynamics.
tags:
- limitation
- governance
- adoption
- network-effects
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_040_adoption_and_governance_challenges
```

### Explanation

The framework requires standards, credential issuers, bank cooperation, trusted issuers, governance frameworks, and sufficient adoption to overcome chicken-and-egg dynamics.

---

## Concept: lim_002_no_real_world_deployment_yet

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:lim_002_no_real_world_deployment_yet
type: Limitation
dsr_layer: Limitation
title: No real-world deployment evaluation yet
description: The framework is conceptually and expert-evaluated but has not yet been
  used in practice or evaluated in a real-world operational KYC setting.
tags:
- limitation
- real-world-evaluation
- deployment
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_042_limitations_real_world_eval
```

### Explanation

The framework is conceptually and expert-evaluated but has not yet been used in practice or evaluated in a real-world operational KYC setting.

---

## Concept: lim_003_regulatory_interpretation_uncertainty

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:lim_003_regulatory_interpretation_uncertainty
type: Limitation
dsr_layer: Limitation
title: Regulatory interpretation uncertainty
description: The design is aligned with GDPR and eIDAS objectives, but detailed legal
  assessment remains necessary because interpretations of encrypted, hashed, and identity-related
  data are still uncertain.
tags:
- limitation
- regulatory-uncertainty
- GDPR
- legal-analysis
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_032_evaluation_regulatory
```

### Explanation

The design is aligned with GDPR and eIDAS objectives, but detailed legal assessment remains necessary because interpretations of encrypted, hashed, and identity-related data are still uncertain.

---

## Concept: lim_004_wallet_usability_and_recovery_risk

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:lim_004_wallet_usability_and_recovery_risk
type: Limitation
dsr_layer: Limitation
title: Wallet usability and recovery risk
description: SSI places more responsibility on users for wallets, keys, backups, and
  recovery, creating usability and support challenges.
tags:
- limitation
- wallet
- usability
- recovery
- key-management
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_021_user_experience_objective
- SSI_KYC_FRAMEWORK_2022:ev_036_evaluation_user_experience
```

### Explanation

SSI places more responsibility on users for wallets, keys, backups, and recovery, creating usability and support challenges.

---

## Concept: lim_005_interbank_trust_and_standard_acceptance

```yaml
concept_id: SSI_KYC_FRAMEWORK_2022:lim_005_interbank_trust_and_standard_acceptance
type: Limitation
dsr_layer: Limitation
title: Interbank trust and credential acceptance require governance
description: Banks must agree on which credentials, schemas, issuers, and revocation
  registries they accept; the technical framework alone does not settle institutional
  trust rules.
tags:
- limitation
- interbank-trust
- credential-acceptance
- governance
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
- SSI_KYC_FRAMEWORK_2022:ev_034_evaluation_trust
- SSI_KYC_FRAMEWORK_2022:ev_040_adoption_and_governance_challenges
```

### Explanation

Banks must agree on which credentials, schemas, issuers, and revocation registries they accept; the technical framework alone does not settle institutional trust rules.
