---
type: PaperDSRProfile
paper_id: BLOCKCHAIN_IOT_SDPS_2019
title: "DSR profile for Blockchain for the IoT"
review_status: reviewed
confidence: high
source_pdf: "Blockchain for the IoT.pdf"
---

# DSR-OKF Profile

## Paper-level summary

The paper develops a design theory for a blockchain-based Sensor Data Protection System (SDPS). The target problem class is IoT sensor-data generation, processing, and exchange where data may be manipulated across a multistage pipeline, while privacy, scalability, and economic feasibility remain necessary. The authors instantiate the design in CertifiCar, an odometer-fraud-prevention prototype, and evaluate the design through three iterative prototype cycles plus an ex-post evaluation using additional use cases.

---

## Concept: prob_001_iot_sensor_data_protection_problem

```yaml
concept_id: BLOCKCHAIN_IOT_SDPS_2019:prob_001_iot_sensor_data_protection_problem
type: Problem
dsr_layer: Problem
title: "IoT sensor data protection under integrity, privacy, scalability, and cost constraints"
description: "IoT data pipelines cross devices, services, organizations, and third parties. Sensor data can be manipulated at several stages, while raw data may be sensitive and high-volume."
tags: [iot, sensor-data, privacy, security, data-integrity, multiparty-ecosystem]
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
  - BLOCKCHAIN_IOT_SDPS_2019:ev_001_problem_context
  - BLOCKCHAIN_IOT_SDPS_2019:ev_002_research_questions
  - BLOCKCHAIN_IOT_SDPS_2019:ev_004_iot_attack_pipeline
```

### Explanation

The problem class is not simply "blockchain for IoT." It is the protection and certification of sensor data across a multistage IoT pipeline where adversaries may manipulate data, where data owners may need privacy control, and where the system must scale to large sensor-data volumes without becoming economically infeasible.

---

## Concept: rq_001_challenges_requirements

```yaml
concept_id: BLOCKCHAIN_IOT_SDPS_2019:rq_001_challenges_requirements
type: ResearchQuestion
dsr_layer: Problem
title: "RQ1: SDPS challenges and requirements"
description: "Identifies the fundamental IoT sensor-data protection challenges and derives system design requirements."
tags: [research-question, requirements, problem-identification]
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
  - BLOCKCHAIN_IOT_SDPS_2019:ev_002_research_questions
```

---

## Concept: rq_002_principles_features

```yaml
concept_id: BLOCKCHAIN_IOT_SDPS_2019:rq_002_principles_features
type: ResearchQuestion
dsr_layer: DesignKnowledge
title: "RQ2: Design principles and design features for SDPS"
description: "Derives actionable guidelines in the form of design principles and design features for SDPS development."
tags: [research-question, design-principles, design-features]
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
  - BLOCKCHAIN_IOT_SDPS_2019:ev_002_research_questions
```

---

## Concept: rq_003_blockchain_value_implications

```yaml
concept_id: BLOCKCHAIN_IOT_SDPS_2019:rq_003_blockchain_value_implications
type: ResearchQuestion
dsr_layer: DesignImplication
title: "RQ3: Blockchain value proposition and design implications"
description: "Clarifies when blockchain is valuable for SDPSs and what implications must be considered."
tags: [research-question, blockchain, design-implications]
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
  - BLOCKCHAIN_IOT_SDPS_2019:ev_002_research_questions
  - BLOCKCHAIN_IOT_SDPS_2019:ev_023_blockchain_usage_implications
  - BLOCKCHAIN_IOT_SDPS_2019:ev_024_design_implications
```

---

# Design Requirements

## Concept: dr1_tamper_resistant_pipeline

```yaml
concept_id: BLOCKCHAIN_IOT_SDPS_2019:dr1_tamper_resistant_pipeline
type: DesignRequirement
dsr_layer: Requirement
title: "Enable tamper-resistant data generation, processing, and exchange"
description: "The SDPS should make the full IoT sensor-data pipeline resistant to manipulation."
tags: [tamper-resistance, data-integrity, sensor-data, pipeline]
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
  - BLOCKCHAIN_IOT_SDPS_2019:ev_005_dr1
  - BLOCKCHAIN_IOT_SDPS_2019:ev_006_table_1_requirements
```

### Reusable design logic

Use this requirement when a target system must prevent or detect manipulation of records across a multi-actor or multi-stage data pipeline.

---

## Concept: dr2_privacy_preserving_pipeline

```yaml
concept_id: BLOCKCHAIN_IOT_SDPS_2019:dr2_privacy_preserving_pipeline
type: DesignRequirement
dsr_layer: Requirement
title: "Enable privacy-preserving data generation, processing, and exchange"
description: "The SDPS should preserve the privacy of the data owner while enabling sensor-data certification and exchange."
tags: [privacy, data-owner, disclosure-control, sensor-data]
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
  - BLOCKCHAIN_IOT_SDPS_2019:ev_007_dr2
  - BLOCKCHAIN_IOT_SDPS_2019:ev_006_table_1_requirements
```

### Reusable design logic

Use this requirement when a system must make claims about data integrity without exposing all raw data to all participants.

---

## Concept: dr3_large_data_volume_throughput

```yaml
concept_id: BLOCKCHAIN_IOT_SDPS_2019:dr3_large_data_volume_throughput
type: DesignRequirement
dsr_layer: Requirement
title: "Enable large data volume throughput"
description: "The SDPS should handle the large data volumes typical of IoT applications."
tags: [scalability, throughput, big-data, sensor-data]
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
  - BLOCKCHAIN_IOT_SDPS_2019:ev_008_dr3
  - BLOCKCHAIN_IOT_SDPS_2019:ev_006_table_1_requirements
```

### Reusable design logic

Use this requirement when the artifact cannot place every raw data item directly on-chain because volume, velocity, latency, or cost would become problematic.

---

## Concept: dr4_economic_feasibility

```yaml
concept_id: BLOCKCHAIN_IOT_SDPS_2019:dr4_economic_feasibility
type: DesignRequirement
dsr_layer: Requirement
title: "Ensure economic feasibility"
description: "The protection benefits of the SDPS should outweigh development and operational costs."
tags: [economic-feasibility, cost, scalability, net-benefits]
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
  - BLOCKCHAIN_IOT_SDPS_2019:ev_009_dr4
  - BLOCKCHAIN_IOT_SDPS_2019:ev_006_table_1_requirements
```

### Reusable design logic

Use this requirement when a DLT/blockchain design must justify why added cryptographic or ledger infrastructure does not make the artifact impractical.

---

# Design Principles

## Concept: dp1_source_to_sink_certification

```yaml
concept_id: BLOCKCHAIN_IOT_SDPS_2019:dp1_source_to_sink_certification
type: DesignPrinciple
dsr_layer: DesignPrinciple
title: "Sensor data are certified on the basis of source-to-sink protection"
description: "Protect data along the information chain from the source sensor to the final data recipient, so the data owner can be made accountable for provided data."
tags: [certification, source-to-sink, data-integrity, accountability]
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
  - BLOCKCHAIN_IOT_SDPS_2019:ev_010_dp1
  - BLOCKCHAIN_IOT_SDPS_2019:ev_019_ex_post_dp1
```

### Reusable design logic

For any verifiable data-sharing system, protect or certify the record as early as possible in the processing chain and preserve evidence until the data recipient verifies it.

---

## Concept: dp2_cross_validation_certification

```yaml
concept_id: BLOCKCHAIN_IOT_SDPS_2019:dp2_cross_validation_certification
type: DesignPrinciple
dsr_layer: DesignPrinciple
title: "Sensor data are certified on the basis of cross-validation"
description: "Use independent or complementary validation data and plausibility checks to reduce the risk that the sensor or its environment was manipulated."
tags: [cross-validation, plausibility-checks, certification, fraud-detection]
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
  - BLOCKCHAIN_IOT_SDPS_2019:ev_011_dp2
  - BLOCKCHAIN_IOT_SDPS_2019:ev_020_ex_post_dp2
```

### Reusable design logic

Source-to-sink protection alone does not prove the real-world source was honest. A second signal or domain-specific plausibility rule should be used where manipulation of the source is possible.

---

## Concept: dp3_data_owner_controlled_disclosure

```yaml
concept_id: BLOCKCHAIN_IOT_SDPS_2019:dp3_data_owner_controlled_disclosure
type: DesignPrinciple
dsr_layer: DesignPrinciple
title: "Data owners determine when and to what extent their certified data are communicated to others"
description: "Give data owners control over timing, recipient, and granularity of certified data disclosure."
tags: [privacy, selective-disclosure, access-control, data-owner-control]
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
  - BLOCKCHAIN_IOT_SDPS_2019:ev_012_dp3
  - BLOCKCHAIN_IOT_SDPS_2019:ev_021_ex_post_dp3
```

### Reusable design logic

When data are sensitive, the system should separate verification capability from unrestricted data disclosure.

---

## Concept: dp4_linearly_scalable_architecture

```yaml
concept_id: BLOCKCHAIN_IOT_SDPS_2019:dp4_linearly_scalable_architecture
type: DesignPrinciple
dsr_layer: DesignPrinciple
title: "Data are certified on the basis of a linearly scalable system architecture"
description: "Use an architecture where performance and cost remain manageable as data volume increases."
tags: [scalability, hybrid-architecture, cost-efficiency, blockchain]
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
  - BLOCKCHAIN_IOT_SDPS_2019:ev_013_dp4
  - BLOCKCHAIN_IOT_SDPS_2019:ev_022_ex_post_dp4
```

### Reusable design logic

Use a hybrid architecture when blockchain is useful for immutable verification, but raw high-volume data are too large, costly, or sensitive for direct on-chain storage.

---

# Design Features

## Concept: df1_sensor_data_collection

```yaml
concept_id: BLOCKCHAIN_IOT_SDPS_2019:df1_sensor_data_collection
type: DesignFeature
dsr_layer: DesignFeature
title: "Sensor data collection"
description: "Collect primary sensor data from the source device or thing."
tags: [data-capture, sensor, primary-data]
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
  - BLOCKCHAIN_IOT_SDPS_2019:ev_014_design_features_mapping
  - BLOCKCHAIN_IOT_SDPS_2019:ev_015_artifact_architecture
```

---

## Concept: df2_cross_validation_data_collection

```yaml
concept_id: BLOCKCHAIN_IOT_SDPS_2019:df2_cross_validation_data_collection
type: DesignFeature
dsr_layer: DesignFeature
title: "Cross-validation sensor data collection"
description: "Collect additional validation data that can be used to cross-check the primary sensor data."
tags: [cross-validation, validation-data, sensor]
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
  - BLOCKCHAIN_IOT_SDPS_2019:ev_014_design_features_mapping
  - BLOCKCHAIN_IOT_SDPS_2019:ev_017_iteration_2_cross_validation
```

---

## Concept: df3_blockchain_transaction_data_transmission

```yaml
concept_id: BLOCKCHAIN_IOT_SDPS_2019:df3_blockchain_transaction_data_transmission
type: DesignFeature
dsr_layer: DesignFeature
title: "Blockchain transaction and data transmission"
description: "Preprocess data, sign or hash it early in the data pipeline, and propagate verification information to the blockchain."
tags: [hashing, blockchain-transaction, preprocessing, data-transmission]
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
  - BLOCKCHAIN_IOT_SDPS_2019:ev_014_design_features_mapping
  - BLOCKCHAIN_IOT_SDPS_2019:ev_016_hash_on_chain_raw_off_chain
```

---

## Concept: df4_data_storage_coordination

```yaml
concept_id: BLOCKCHAIN_IOT_SDPS_2019:df4_data_storage_coordination
type: DesignFeature
dsr_layer: DesignFeature
title: "Data storage coordination"
description: "Coordinate where raw data and verification data are stored across traditional storage and blockchain-based verification storage."
tags: [storage-service, coordination, hybrid-architecture]
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
  - BLOCKCHAIN_IOT_SDPS_2019:ev_014_design_features_mapping
  - BLOCKCHAIN_IOT_SDPS_2019:ev_015_artifact_architecture
```

---

## Concept: df5_raw_sensor_data_storage

```yaml
concept_id: BLOCKCHAIN_IOT_SDPS_2019:df5_raw_sensor_data_storage
type: DesignFeature
dsr_layer: DesignFeature
title: "Raw sensor data storage"
description: "Store encrypted raw sensor data off-chain in a scalable storage system."
tags: [off-chain-storage, encrypted-storage, raw-data, cloud]
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
  - BLOCKCHAIN_IOT_SDPS_2019:ev_014_design_features_mapping
  - BLOCKCHAIN_IOT_SDPS_2019:ev_016_hash_on_chain_raw_off_chain
```

---

## Concept: df6_independent_verification_storage

```yaml
concept_id: BLOCKCHAIN_IOT_SDPS_2019:df6_independent_verification_storage
type: DesignFeature
dsr_layer: DesignFeature
title: "Blockchain-based hash storage"
description: "Store independent verification references, usually hashes or digital fingerprints, on-chain."
tags: [on-chain-hash, hash-anchoring, verification-storage, blockchain]
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
  - BLOCKCHAIN_IOT_SDPS_2019:ev_014_design_features_mapping
  - BLOCKCHAIN_IOT_SDPS_2019:ev_016_hash_on_chain_raw_off_chain
```

---

## Concept: df7_access_right_management

```yaml
concept_id: BLOCKCHAIN_IOT_SDPS_2019:df7_access_right_management
type: DesignFeature
dsr_layer: DesignFeature
title: "Key and access right management"
description: "Manage access rights and keys so that only authorized parties can decrypt or access selected data."
tags: [access-control, key-management, privacy, data-owner-control]
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
  - BLOCKCHAIN_IOT_SDPS_2019:ev_014_design_features_mapping
  - BLOCKCHAIN_IOT_SDPS_2019:ev_018_iteration_3_usability_privacy
```

---

## Concept: df8_sensor_data_certification

```yaml
concept_id: BLOCKCHAIN_IOT_SDPS_2019:df8_sensor_data_certification
type: DesignFeature
dsr_layer: DesignFeature
title: "Sensor data certification"
description: "Verify raw data against blockchain-stored hashes, check domain consistency, perform cross-validation, and issue a certificate."
tags: [certification, verification, hash-comparison, cross-validation]
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
  - BLOCKCHAIN_IOT_SDPS_2019:ev_014_design_features_mapping
  - BLOCKCHAIN_IOT_SDPS_2019:ev_015_artifact_architecture
  - BLOCKCHAIN_IOT_SDPS_2019:ev_025_certification_process
```

---

## Concept: df9_sensor_data_output

```yaml
concept_id: BLOCKCHAIN_IOT_SDPS_2019:df9_sensor_data_output
type: DesignFeature
dsr_layer: DesignFeature
title: "Sensor data output"
description: "Provide certified data or certificates to authorized data recipients according to the data owner’s sharing settings."
tags: [retrieval-service, output, certificate, selective-disclosure]
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
  - BLOCKCHAIN_IOT_SDPS_2019:ev_014_design_features_mapping
  - BLOCKCHAIN_IOT_SDPS_2019:ev_018_iteration_3_usability_privacy
```

---

# Artifact

## Concept: art1_sdps_general_architecture

```yaml
concept_id: BLOCKCHAIN_IOT_SDPS_2019:art1_sdps_general_architecture
type: Artifact
dsr_layer: Artifact
title: "General SDPS architecture"
description: "A hybrid architecture where sensor and validation data are captured from things, encrypted raw data are stored off-chain, hashes are stored on-chain, access rights are managed centrally, and certificates are generated for data recipients."
tags: [artifact-architecture, hybrid-architecture, blockchain, iot, certification]
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
  - BLOCKCHAIN_IOT_SDPS_2019:ev_015_artifact_architecture
  - BLOCKCHAIN_IOT_SDPS_2019:ev_025_certification_process
```

### Architectural components

- Thing layer: sensor, validation sensor, preprocessing and transmission.
- Central infrastructure: storage service, secure mass storage, access management, certification service, retrieval service.
- Blockchain layer: blockchain-based hash storage for independent verification.
- External actors: data owner and data recipient.

---

## Concept: art2_certificar_prototype

```yaml
concept_id: BLOCKCHAIN_IOT_SDPS_2019:art2_certificar_prototype
type: Artifact
dsr_layer: Artifact
title: "CertifiCar prototype"
description: "A concrete SDPS instantiation for odometer-fraud prevention using odometer data, GPS validation data, cloud storage, Ethereum hash anchoring, verification logic, and a smartphone app."
tags: [prototype, certificar, odometer-fraud, ethereum, gps, smartphone-app]
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
  - BLOCKCHAIN_IOT_SDPS_2019:ev_016_iteration_1_end_to_end
  - BLOCKCHAIN_IOT_SDPS_2019:ev_017_iteration_2_cross_validation
  - BLOCKCHAIN_IOT_SDPS_2019:ev_018_iteration_3_usability_privacy
```

---

# Evaluation

## Concept: eval1_iterative_prototype_evaluation

```yaml
concept_id: BLOCKCHAIN_IOT_SDPS_2019:eval1_iterative_prototype_evaluation
type: Evaluation
dsr_layer: Evaluation
title: "Three-cycle prototype evaluation"
description: "The artifact was iteratively developed and evaluated through three prototype cycles, moving from initial end-to-end processing to cross-validation and then stability/usability."
tags: [evaluation, field-test, interviews, workshops, iterative-design]
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
  - BLOCKCHAIN_IOT_SDPS_2019:ev_016_iteration_1_end_to_end
  - BLOCKCHAIN_IOT_SDPS_2019:ev_017_iteration_2_cross_validation
  - BLOCKCHAIN_IOT_SDPS_2019:ev_018_iteration_3_usability_privacy
  - BLOCKCHAIN_IOT_SDPS_2019:ev_026_table_2_prototype_evaluation
```

---

## Concept: eval2_ex_post_evaluation

```yaml
concept_id: BLOCKCHAIN_IOT_SDPS_2019:eval2_ex_post_evaluation
type: Evaluation
dsr_layer: Evaluation
title: "Ex-post design evaluation across additional use cases"
description: "The authors evaluated the design beyond the odometer case using additional use cases in cold chains and energy microgrids, plus expert interviews."
tags: [ex-post-evaluation, generalization, cold-chain, energy-microgrid, expert-interviews]
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
  - BLOCKCHAIN_IOT_SDPS_2019:ev_019_ex_post_dp1
  - BLOCKCHAIN_IOT_SDPS_2019:ev_020_ex_post_dp2
  - BLOCKCHAIN_IOT_SDPS_2019:ev_021_ex_post_dp3
  - BLOCKCHAIN_IOT_SDPS_2019:ev_022_ex_post_dp4
```

---

# Output Knowledge

## Concept: ok1_sdps_design_theory

```yaml
concept_id: BLOCKCHAIN_IOT_SDPS_2019:ok1_sdps_design_theory
type: OutputKnowledge
dsr_layer: OutputKnowledge
title: "SDPS design theory"
description: "A design theory for privacy-preserving, tamper-resistant, scalable, and economically feasible IoT sensor-data protection systems."
tags: [design-theory, sdps, blockchain, iot, output-knowledge]
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
  - BLOCKCHAIN_IOT_SDPS_2019:ev_027_design_theory_components
```

### Testable propositions

- P1: The artifact enables tamper-resistant IoT sensor-data generation, processing, and exchange.
- P2: The artifact enables privacy-preserving IoT sensor-data generation, processing, and exchange.
- P3: The artifact can process large amounts of IoT sensor data.
- P4: The artifact’s positive effects are not negated by development and operational costs.

---

## Concept: ok2_blockchain_sdps_usage_implications

```yaml
concept_id: BLOCKCHAIN_IOT_SDPS_2019:ok2_blockchain_sdps_usage_implications
type: OutputKnowledge
dsr_layer: DesignImplication
title: "Blockchain-based SDPS usage implications"
description: "Blockchain is especially useful in multiparty ecosystems with conflicting interests where a shared immutable ledger, decentralized control, and ready-to-use security protocols are valuable."
tags: [blockchain-implications, multiparty-ecosystem, immutable-ledger, decentralization]
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
  - BLOCKCHAIN_IOT_SDPS_2019:ev_023_blockchain_usage_implications
```

---

# Kernel Theories and Justificatory Knowledge

## Concept: kt1_information_asymmetry_certification

```yaml
concept_id: BLOCKCHAIN_IOT_SDPS_2019:kt1_information_asymmetry_certification
type: KernelTheory
dsr_layer: JustificatoryKnowledge
title: "Information asymmetry and certification"
description: "Information asymmetry theory is used to justify certification as a mechanism for reducing opportunistic manipulation and information deficits."
tags: [information-asymmetry, certification, opportunism, justificatory-knowledge]
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
  - BLOCKCHAIN_IOT_SDPS_2019:ev_010_dp1
  - BLOCKCHAIN_IOT_SDPS_2019:ev_011_dp2
```

---

## Concept: kt2_westin_privacy

```yaml
concept_id: BLOCKCHAIN_IOT_SDPS_2019:kt2_westin_privacy
type: KernelTheory
dsr_layer: JustificatoryKnowledge
title: "Westin's theory of privacy"
description: "Westin's theory is used to justify data-owner control over when, how, and to what extent data are communicated."
tags: [privacy-theory, westin, data-owner-control]
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
  - BLOCKCHAIN_IOT_SDPS_2019:ev_012_dp3
```

---

## Concept: kt3_delone_mclean_is_success

```yaml
concept_id: BLOCKCHAIN_IOT_SDPS_2019:kt3_delone_mclean_is_success
type: KernelTheory
dsr_layer: JustificatoryKnowledge
title: "DeLone and McLean IS success model"
description: "The notion of net benefits is used to justify the need for scalable and economically feasible SDPS design."
tags: [is-success, net-benefits, economic-feasibility, scalability]
confidence: high
extraction_type: explicit
review_status: reviewed
source_file: dsr.md
evidence:
  - BLOCKCHAIN_IOT_SDPS_2019:ev_013_dp4
```
