---
schema_version: "okf-dsr-v1"
type: "ConceptCollection"
paper_id: "BLOCKCHAIN_IOT_SDPS_2019"
extraction_status: "okf_draft"
review_status: "unreviewed"
---

# Canonical DSR Concepts

## Concept: BLOCKCHAIN_IOT_SDPS_2019:prob_001_iot_sensor_data_protection_problem
```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:prob_001_iot_sensor_data_protection_problem",
  "type": "Problem",
  "title": "IoT sensor data protection under integrity, privacy, scalability, and cost constraints",
  "description": "IoT data pipelines cross devices, services, organizations, and third parties. Sensor data can be manipulated at several stages, while raw data may be sensitive and high-volume.",
  "evidence": [
    "BLOCKCHAIN_IOT_SDPS_2019:ev_001_problem_context",
    "BLOCKCHAIN_IOT_SDPS_2019:ev_002_research_questions",
    "BLOCKCHAIN_IOT_SDPS_2019:ev_004_iot_attack_pipeline"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Explanation

The problem class is not simply "blockchain for IoT." It is the protection and certification of sensor data across a multistage IoT pipeline where adversaries may manipulate data, where data owners may need privacy control, and where the system must scale to large sensor-data volumes without becoming economically infeasible.

---

## Concept: BLOCKCHAIN_IOT_SDPS_2019:dr1_tamper_resistant_pipeline
```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:dr1_tamper_resistant_pipeline",
  "type": "Design Requirement",
  "title": "Enable tamper-resistant data generation, processing, and exchange",
  "description": "The SDPS should make the full IoT sensor-data pipeline resistant to manipulation.",
  "evidence": [
    "BLOCKCHAIN_IOT_SDPS_2019:ev_005_dr1",
    "BLOCKCHAIN_IOT_SDPS_2019:ev_006_table_1_requirements"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Reusable design logic

Use this requirement when a target system must prevent or detect manipulation of records across a multi-actor or multi-stage data pipeline.

---

## Concept: BLOCKCHAIN_IOT_SDPS_2019:dr2_privacy_preserving_pipeline
```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:dr2_privacy_preserving_pipeline",
  "type": "Design Requirement",
  "title": "Enable privacy-preserving data generation, processing, and exchange",
  "description": "The SDPS should preserve the privacy of the data owner while enabling sensor-data certification and exchange.",
  "evidence": [
    "BLOCKCHAIN_IOT_SDPS_2019:ev_007_dr2",
    "BLOCKCHAIN_IOT_SDPS_2019:ev_006_table_1_requirements"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Reusable design logic

Use this requirement when a system must make claims about data integrity without exposing all raw data to all participants.

---

## Concept: BLOCKCHAIN_IOT_SDPS_2019:dr3_large_data_volume_throughput
```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:dr3_large_data_volume_throughput",
  "type": "Design Requirement",
  "title": "Enable large data volume throughput",
  "description": "The SDPS should handle the large data volumes typical of IoT applications.",
  "evidence": [
    "BLOCKCHAIN_IOT_SDPS_2019:ev_008_dr3",
    "BLOCKCHAIN_IOT_SDPS_2019:ev_006_table_1_requirements"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Reusable design logic

Use this requirement when the artifact cannot place every raw data item directly on-chain because volume, velocity, latency, or cost would become problematic.

---

## Concept: BLOCKCHAIN_IOT_SDPS_2019:dr4_economic_feasibility
```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:dr4_economic_feasibility",
  "type": "Design Requirement",
  "title": "Ensure economic feasibility",
  "description": "The protection benefits of the SDPS should outweigh development and operational costs.",
  "evidence": [
    "BLOCKCHAIN_IOT_SDPS_2019:ev_009_dr4",
    "BLOCKCHAIN_IOT_SDPS_2019:ev_006_table_1_requirements"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Reusable design logic

Use this requirement when a DLT/blockchain design must justify why added cryptographic or ledger infrastructure does not make the artifact impractical.

---

## Concept: BLOCKCHAIN_IOT_SDPS_2019:dp1_source_to_sink_certification
```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:dp1_source_to_sink_certification",
  "type": "Design Principle",
  "title": "Sensor data are certified on the basis of source-to-sink protection",
  "description": "Protect data along the information chain from the source sensor to the final data recipient, so the data owner can be made accountable for provided data.",
  "evidence": [
    "BLOCKCHAIN_IOT_SDPS_2019:ev_010_dp1",
    "BLOCKCHAIN_IOT_SDPS_2019:ev_020_ex_post_dp1"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Reusable design logic

For any verifiable data-sharing system, protect or certify the record as early as possible in the processing chain and preserve evidence until the data recipient verifies it.

---

## Concept: BLOCKCHAIN_IOT_SDPS_2019:dp2_cross_validation_certification
```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:dp2_cross_validation_certification",
  "type": "Design Principle",
  "title": "Sensor data are certified on the basis of cross-validation",
  "description": "Use independent or complementary validation data and plausibility checks to reduce the risk that the sensor or its environment was manipulated.",
  "evidence": [
    "BLOCKCHAIN_IOT_SDPS_2019:ev_011_dp2",
    "BLOCKCHAIN_IOT_SDPS_2019:ev_021_ex_post_dp2"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Reusable design logic

Source-to-sink protection alone does not prove the real-world source was honest. A second signal or domain-specific plausibility rule should be used where manipulation of the source is possible.

---

## Concept: BLOCKCHAIN_IOT_SDPS_2019:dp3_data_owner_controlled_disclosure
```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:dp3_data_owner_controlled_disclosure",
  "type": "Design Principle",
  "title": "Data owners determine when and to what extent their certified data are communicated to others",
  "description": "Give data owners control over timing, recipient, and granularity of certified data disclosure.",
  "evidence": [
    "BLOCKCHAIN_IOT_SDPS_2019:ev_012_dp3",
    "BLOCKCHAIN_IOT_SDPS_2019:ev_022_ex_post_dp3"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Reusable design logic

When data are sensitive, the system should separate verification capability from unrestricted data disclosure.

---

## Concept: BLOCKCHAIN_IOT_SDPS_2019:dp4_linearly_scalable_architecture
```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:dp4_linearly_scalable_architecture",
  "type": "Design Principle",
  "title": "Data are certified on the basis of a linearly scalable system architecture",
  "description": "Use an architecture where performance and cost remain manageable as data volume increases.",
  "evidence": [
    "BLOCKCHAIN_IOT_SDPS_2019:ev_013_dp4",
    "BLOCKCHAIN_IOT_SDPS_2019:ev_023_ex_post_dp4"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Reusable design logic

Use a hybrid architecture when blockchain is useful for immutable verification, but raw high-volume data are too large, costly, or sensitive for direct on-chain storage.

---

## Concept: BLOCKCHAIN_IOT_SDPS_2019:df1_sensor_data_collection
```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:df1_sensor_data_collection",
  "type": "Design Feature",
  "title": "Sensor data collection",
  "description": "Collect primary sensor data from the source device or thing.",
  "evidence": [
    "BLOCKCHAIN_IOT_SDPS_2019:ev_014_design_features_mapping",
    "BLOCKCHAIN_IOT_SDPS_2019:ev_015_artifact_architecture"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

---

## Concept: BLOCKCHAIN_IOT_SDPS_2019:df2_cross_validation_data_collection
```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:df2_cross_validation_data_collection",
  "type": "Design Feature",
  "title": "Cross-validation sensor data collection",
  "description": "Collect additional validation data that can be used to cross-check the primary sensor data.",
  "evidence": [
    "BLOCKCHAIN_IOT_SDPS_2019:ev_014_design_features_mapping",
    "BLOCKCHAIN_IOT_SDPS_2019:ev_018_iteration_2_cross_validation"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

---

## Concept: BLOCKCHAIN_IOT_SDPS_2019:df3_blockchain_transaction_data_transmission
```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:df3_blockchain_transaction_data_transmission",
  "type": "Design Feature",
  "title": "Blockchain transaction and data transmission",
  "description": "Preprocess data, sign or hash it early in the data pipeline, and propagate verification information to the blockchain.",
  "evidence": [
    "BLOCKCHAIN_IOT_SDPS_2019:ev_014_design_features_mapping",
    "BLOCKCHAIN_IOT_SDPS_2019:ev_016_hash_on_chain_raw_off_chain"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

---

## Concept: BLOCKCHAIN_IOT_SDPS_2019:df4_data_storage_coordination
```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:df4_data_storage_coordination",
  "type": "Design Feature",
  "title": "Data storage coordination",
  "description": "Coordinate where raw data and verification data are stored across traditional storage and blockchain-based verification storage.",
  "evidence": [
    "BLOCKCHAIN_IOT_SDPS_2019:ev_014_design_features_mapping",
    "BLOCKCHAIN_IOT_SDPS_2019:ev_015_artifact_architecture"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

---

## Concept: BLOCKCHAIN_IOT_SDPS_2019:df5_raw_sensor_data_storage
```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:df5_raw_sensor_data_storage",
  "type": "Design Feature",
  "title": "Raw sensor data storage",
  "description": "Store encrypted raw sensor data off-chain in a scalable storage system.",
  "evidence": [
    "BLOCKCHAIN_IOT_SDPS_2019:ev_014_design_features_mapping",
    "BLOCKCHAIN_IOT_SDPS_2019:ev_016_hash_on_chain_raw_off_chain"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

---

## Concept: BLOCKCHAIN_IOT_SDPS_2019:df6_independent_verification_storage
```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:df6_independent_verification_storage",
  "type": "Design Feature",
  "title": "Blockchain-based hash storage",
  "description": "Store independent verification references, usually hashes or digital fingerprints, on-chain.",
  "evidence": [
    "BLOCKCHAIN_IOT_SDPS_2019:ev_014_design_features_mapping",
    "BLOCKCHAIN_IOT_SDPS_2019:ev_016_hash_on_chain_raw_off_chain"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

---

## Concept: BLOCKCHAIN_IOT_SDPS_2019:df7_access_right_management
```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:df7_access_right_management",
  "type": "Design Feature",
  "title": "Key and access right management",
  "description": "Manage access rights and keys so that only authorized parties can decrypt or access selected data.",
  "evidence": [
    "BLOCKCHAIN_IOT_SDPS_2019:ev_014_design_features_mapping",
    "BLOCKCHAIN_IOT_SDPS_2019:ev_019_iteration_3_usability_privacy"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

---

## Concept: BLOCKCHAIN_IOT_SDPS_2019:df8_sensor_data_certification
```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:df8_sensor_data_certification",
  "type": "Design Feature",
  "title": "Sensor data certification",
  "description": "Verify raw data against blockchain-stored hashes, check domain consistency, perform cross-validation, and issue a certificate.",
  "evidence": [
    "BLOCKCHAIN_IOT_SDPS_2019:ev_014_design_features_mapping",
    "BLOCKCHAIN_IOT_SDPS_2019:ev_015_artifact_architecture",
    "BLOCKCHAIN_IOT_SDPS_2019:ev_026_certification_process"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

---

## Concept: BLOCKCHAIN_IOT_SDPS_2019:df9_sensor_data_output
```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:df9_sensor_data_output",
  "type": "Design Feature",
  "title": "Sensor data output",
  "description": "Provide certified data or certificates to authorized data recipients according to the data owner’s sharing settings.",
  "evidence": [
    "BLOCKCHAIN_IOT_SDPS_2019:ev_014_design_features_mapping",
    "BLOCKCHAIN_IOT_SDPS_2019:ev_019_iteration_3_usability_privacy"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

---

## Concept: BLOCKCHAIN_IOT_SDPS_2019:art1_sdps_general_architecture
```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:art1_sdps_general_architecture",
  "type": "Artifact",
  "title": "General SDPS architecture",
  "description": "A hybrid architecture where sensor and validation data are captured from things, encrypted raw data are stored off-chain, hashes are stored on-chain, access rights are managed centrally, and certificates are generated for data recipients.",
  "evidence": [
    "BLOCKCHAIN_IOT_SDPS_2019:ev_015_artifact_architecture",
    "BLOCKCHAIN_IOT_SDPS_2019:ev_026_certification_process"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Architectural components

- Thing layer: sensor, validation sensor, preprocessing and transmission.
- Central infrastructure: storage service, secure mass storage, access management, certification service, retrieval service.
- Blockchain layer: blockchain-based hash storage for independent verification.
- External actors: data owner and data recipient.

---

## Concept: BLOCKCHAIN_IOT_SDPS_2019:art2_certificar_prototype
```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:art2_certificar_prototype",
  "type": "Artifact",
  "title": "CertifiCar prototype",
  "description": "A concrete SDPS instantiation for odometer-fraud prevention using odometer data, GPS validation data, cloud storage, Ethereum hash anchoring, verification logic, and a smartphone app.",
  "evidence": [
    "BLOCKCHAIN_IOT_SDPS_2019:ev_017_iteration_1_end_to_end",
    "BLOCKCHAIN_IOT_SDPS_2019:ev_018_iteration_2_cross_validation",
    "BLOCKCHAIN_IOT_SDPS_2019:ev_019_iteration_3_usability_privacy"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

---

## Concept: BLOCKCHAIN_IOT_SDPS_2019:eval1_iterative_prototype_evaluation
```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:eval1_iterative_prototype_evaluation",
  "type": "Evaluation",
  "title": "Three-cycle prototype evaluation",
  "description": "The artifact was iteratively developed and evaluated through three prototype cycles, moving from initial end-to-end processing to cross-validation and then stability/usability.",
  "evidence": [
    "BLOCKCHAIN_IOT_SDPS_2019:ev_017_iteration_1_end_to_end",
    "BLOCKCHAIN_IOT_SDPS_2019:ev_018_iteration_2_cross_validation",
    "BLOCKCHAIN_IOT_SDPS_2019:ev_019_iteration_3_usability_privacy",
    "BLOCKCHAIN_IOT_SDPS_2019:ev_027_table_2_prototype_evaluation"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

---

## Concept: BLOCKCHAIN_IOT_SDPS_2019:eval2_ex_post_evaluation
```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:eval2_ex_post_evaluation",
  "type": "Evaluation",
  "title": "Ex-post design evaluation across additional use cases",
  "description": "The authors evaluated the design beyond the odometer case using additional use cases in cold chains and energy microgrids, plus expert interviews.",
  "evidence": [
    "BLOCKCHAIN_IOT_SDPS_2019:ev_020_ex_post_dp1",
    "BLOCKCHAIN_IOT_SDPS_2019:ev_021_ex_post_dp2",
    "BLOCKCHAIN_IOT_SDPS_2019:ev_022_ex_post_dp3",
    "BLOCKCHAIN_IOT_SDPS_2019:ev_023_ex_post_dp4"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

---

## Concept: BLOCKCHAIN_IOT_SDPS_2019:ok1_sdps_design_theory
```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:ok1_sdps_design_theory",
  "type": "Output Knowledge",
  "title": "SDPS design theory",
  "description": "A design theory for privacy-preserving, tamper-resistant, scalable, and economically feasible IoT sensor-data protection systems.",
  "evidence": [
    "BLOCKCHAIN_IOT_SDPS_2019:ev_028_design_theory_components"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

### Testable propositions

- P1: The artifact enables tamper-resistant IoT sensor-data generation, processing, and exchange.
- P2: The artifact enables privacy-preserving IoT sensor-data generation, processing, and exchange.
- P3: The artifact can process large amounts of IoT sensor data.
- P4: The artifact’s positive effects are not negated by development and operational costs.

---

## Concept: BLOCKCHAIN_IOT_SDPS_2019:ok2_blockchain_sdps_usage_implications
```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:ok2_blockchain_sdps_usage_implications",
  "type": "Output Knowledge",
  "title": "Blockchain-based SDPS usage implications",
  "description": "Blockchain is especially useful in multiparty ecosystems with conflicting interests where a shared immutable ledger, decentralized control, and ready-to-use security protocols are valuable.",
  "evidence": [
    "BLOCKCHAIN_IOT_SDPS_2019:ev_024_blockchain_usage_implications"
  ],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```
