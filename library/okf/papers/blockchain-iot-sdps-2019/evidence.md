---
schema_version: "okf-dsr-v1"
type: "EvidenceCollection"
paper_id: "BLOCKCHAIN_IOT_SDPS_2019"
extraction_status: "okf_draft"
review_status: "unreviewed"
---

# Canonical Evidence Items

## Evidence: BLOCKCHAIN_IOT_SDPS_2019:ev_001_problem_context

```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:ev_001_problem_context",
  "supports": [
    "BLOCKCHAIN_IOT_SDPS_2019:prob_001_iot_sensor_data_protection_problem"
  ],
  "source_location": "Blockchain for the IoT.pdf · page 2 · Abstract and Introduction",
  "quote_or_summary": "The abstract frames the problem around IoT security and privacy, sensor-data integrity, and the need to guarantee privacy while protecting data.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: BLOCKCHAIN_IOT_SDPS_2019:ev_002_research_questions

```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:ev_002_research_questions",
  "supports": [
    "BLOCKCHAIN_IOT_SDPS_2019:prob_001_iot_sensor_data_protection_problem"
  ],
  "source_location": "Blockchain for the IoT.pdf · page 3 · Introduction",
  "quote_or_summary": "The paper explicitly asks three research questions about SDPS challenges and requirements, actionable design principles/features, and the value proposition and implications of blockchain-based SDPSs.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: BLOCKCHAIN_IOT_SDPS_2019:ev_003_core_paper_structure

```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:ev_003_core_paper_structure",
  "supports": [
    "BLOCKCHAIN_IOT_SDPS_2019:ok1_sdps_design_theory"
  ],
  "source_location": "Blockchain for the IoT.pdf · page 4 · Figure 1",
  "quote_or_summary": "Figure 1 structures the core paper as designing an SDPS through problem/design requirements, objectives/design principles, and design/design features, followed by prototype demonstration/evaluation and theory generation.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: BLOCKCHAIN_IOT_SDPS_2019:ev_004_iot_attack_pipeline

```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:ev_004_iot_attack_pipeline",
  "supports": [
    "BLOCKCHAIN_IOT_SDPS_2019:prob_001_iot_sensor_data_protection_problem"
  ],
  "source_location": "Blockchain for the IoT.pdf · page 5 · Security and Privacy in the Internet of Things",
  "quote_or_summary": "The paper explains that IoT systems are vulnerable because data can be attacked or manipulated at several points in the processing pipeline.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: BLOCKCHAIN_IOT_SDPS_2019:ev_005_dr1

```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:ev_005_dr1",
  "supports": [
    "BLOCKCHAIN_IOT_SDPS_2019:dr1_tamper_resistant_pipeline"
  ],
  "source_location": "Blockchain for the IoT.pdf · page 10 · 4.1 Developing Design Requirements",
  "quote_or_summary": "The first design requirement requires tamper-resistant data generation, processing, and exchange throughout the full IoT sensor-data pipeline.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: BLOCKCHAIN_IOT_SDPS_2019:ev_006_table_1_requirements

```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:ev_006_table_1_requirements",
  "supports": [
    "BLOCKCHAIN_IOT_SDPS_2019:dr1_tamper_resistant_pipeline",
    "BLOCKCHAIN_IOT_SDPS_2019:dr2_privacy_preserving_pipeline",
    "BLOCKCHAIN_IOT_SDPS_2019:dr3_large_data_volume_throughput",
    "BLOCKCHAIN_IOT_SDPS_2019:dr4_economic_feasibility"
  ],
  "source_location": "Blockchain for the IoT.pdf · page 11 · Table 1",
  "quote_or_summary": "Table 1 maps four SDPS challenges to four design requirements: tamper resistance, data-owner privacy, data throughput, and economic feasibility.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: BLOCKCHAIN_IOT_SDPS_2019:ev_007_dr2

```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:ev_007_dr2",
  "supports": [
    "BLOCKCHAIN_IOT_SDPS_2019:dr2_privacy_preserving_pipeline"
  ],
  "source_location": "Blockchain for the IoT.pdf · page 10 · 4.1 Developing Design Requirements",
  "quote_or_summary": "The second design requirement states that SDPSs must preserve the privacy of the corresponding data owner.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: BLOCKCHAIN_IOT_SDPS_2019:ev_008_dr3

```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:ev_008_dr3",
  "supports": [
    "BLOCKCHAIN_IOT_SDPS_2019:dr3_large_data_volume_throughput"
  ],
  "source_location": "Blockchain for the IoT.pdf · page 10 · 4.1 Developing Design Requirements",
  "quote_or_summary": "The third design requirement states that SDPSs must process the large data volumes typical of IoT applications.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: BLOCKCHAIN_IOT_SDPS_2019:ev_009_dr4

```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:ev_009_dr4",
  "supports": [
    "BLOCKCHAIN_IOT_SDPS_2019:dr4_economic_feasibility"
  ],
  "source_location": "Blockchain for the IoT.pdf · page 10 · 4.1 Developing Design Requirements",
  "quote_or_summary": "The fourth design requirement states that SDPSs should be economically feasible, especially given blockchain scalability and transaction-cost concerns.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: BLOCKCHAIN_IOT_SDPS_2019:ev_010_dp1

```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:ev_010_dp1",
  "supports": [
    "BLOCKCHAIN_IOT_SDPS_2019:dp1_source_to_sink_certification"
  ],
  "source_location": "Blockchain for the IoT.pdf · page 11 · 4.2 Deriving Design Principles",
  "quote_or_summary": "The paper derives source-to-sink certification from information asymmetry and certification logic, arguing that the information chain from source to final consumer must be protected.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: BLOCKCHAIN_IOT_SDPS_2019:ev_011_dp2

```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:ev_011_dp2",
  "supports": [
    "BLOCKCHAIN_IOT_SDPS_2019:dp2_cross_validation_certification"
  ],
  "source_location": "Blockchain for the IoT.pdf · page 11 · 4.2 Deriving Design Principles",
  "quote_or_summary": "The paper derives cross-validation certification because source-to-sink protection does not prevent manipulation of the sensor or sensor environment.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: BLOCKCHAIN_IOT_SDPS_2019:ev_012_dp3

```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:ev_012_dp3",
  "supports": [
    "BLOCKCHAIN_IOT_SDPS_2019:dp3_data_owner_controlled_disclosure"
  ],
  "source_location": "Blockchain for the IoT.pdf · page 12 · 4.2 Deriving Design Principles",
  "quote_or_summary": "The paper uses Westin's theory of privacy to justify giving data owners control over when and how their certified data are communicated.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: BLOCKCHAIN_IOT_SDPS_2019:ev_013_dp4

```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:ev_013_dp4",
  "supports": [
    "BLOCKCHAIN_IOT_SDPS_2019:dp4_linearly_scalable_architecture"
  ],
  "source_location": "Blockchain for the IoT.pdf · page 12 · 4.2 Deriving Design Principles",
  "quote_or_summary": "The paper uses IS success and net-benefit logic to justify a linearly scalable architecture for cost-efficient high-volume sensor-data protection.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: BLOCKCHAIN_IOT_SDPS_2019:ev_014_design_features_mapping

```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:ev_014_design_features_mapping",
  "supports": [
    "BLOCKCHAIN_IOT_SDPS_2019:df1_sensor_data_collection",
    "BLOCKCHAIN_IOT_SDPS_2019:df2_cross_validation_data_collection",
    "BLOCKCHAIN_IOT_SDPS_2019:df3_blockchain_transaction_data_transmission",
    "BLOCKCHAIN_IOT_SDPS_2019:df4_data_storage_coordination",
    "BLOCKCHAIN_IOT_SDPS_2019:df5_raw_sensor_data_storage",
    "BLOCKCHAIN_IOT_SDPS_2019:df6_independent_verification_storage",
    "BLOCKCHAIN_IOT_SDPS_2019:df7_access_right_management",
    "BLOCKCHAIN_IOT_SDPS_2019:df8_sensor_data_certification",
    "BLOCKCHAIN_IOT_SDPS_2019:df9_sensor_data_output"
  ],
  "source_location": "Blockchain for the IoT.pdf · page 13 · Figure 3 and Section 4.3",
  "quote_or_summary": "Figure 3 maps four design requirements to four design principles and nine design features grouped into capture data, store data, and provide data capabilities.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: BLOCKCHAIN_IOT_SDPS_2019:ev_015_artifact_architecture

```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:ev_015_artifact_architecture",
  "supports": [
    "BLOCKCHAIN_IOT_SDPS_2019:art1_sdps_general_architecture",
    "BLOCKCHAIN_IOT_SDPS_2019:df1_sensor_data_collection",
    "BLOCKCHAIN_IOT_SDPS_2019:df4_data_storage_coordination",
    "BLOCKCHAIN_IOT_SDPS_2019:df8_sensor_data_certification"
  ],
  "source_location": "Blockchain for the IoT.pdf · page 14 · Figure 4 and Section 4.3",
  "quote_or_summary": "Figure 4 presents a general SDPS architecture with sensors, validation sensors, preprocessing, cloud/raw storage, blockchain-based hash storage, access management, certification, retrieval, data owner, and data recipient.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: BLOCKCHAIN_IOT_SDPS_2019:ev_016_hash_on_chain_raw_off_chain

```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:ev_016_hash_on_chain_raw_off_chain",
  "supports": [
    "BLOCKCHAIN_IOT_SDPS_2019:df6_independent_verification_storage",
    "BLOCKCHAIN_IOT_SDPS_2019:df3_blockchain_transaction_data_transmission",
    "BLOCKCHAIN_IOT_SDPS_2019:df5_raw_sensor_data_storage"
  ],
  "source_location": "Blockchain for the IoT.pdf · page 13 · 4.3 Mapping Design Principles to Design Features",
  "quote_or_summary": "The paper explains that the system stores raw data off-chain while storing only hashes or digital fingerprints on-chain to preserve integrity, privacy, scalability, and cost feasibility.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: BLOCKCHAIN_IOT_SDPS_2019:ev_017_iteration_1_end_to_end

```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:ev_017_iteration_1_end_to_end",
  "supports": [
    "BLOCKCHAIN_IOT_SDPS_2019:art2_certificar_prototype",
    "BLOCKCHAIN_IOT_SDPS_2019:eval1_iterative_prototype_evaluation"
  ],
  "source_location": "Blockchain for the IoT.pdf · page 16 · 5.1 Iteration 1",
  "quote_or_summary": "The first iteration implemented end-to-end odometer data recording, processing, encrypted raw storage, blockchain hash storage, and an initial verification process.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: BLOCKCHAIN_IOT_SDPS_2019:ev_018_iteration_2_cross_validation

```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:ev_018_iteration_2_cross_validation",
  "supports": [
    "BLOCKCHAIN_IOT_SDPS_2019:df2_cross_validation_data_collection",
    "BLOCKCHAIN_IOT_SDPS_2019:art2_certificar_prototype",
    "BLOCKCHAIN_IOT_SDPS_2019:eval1_iterative_prototype_evaluation"
  ],
  "source_location": "Blockchain for the IoT.pdf · page 17 · 5.2 Iteration 2",
  "quote_or_summary": "The second iteration added GPS-based validation data to detect continuous odometer fraud and introduced queue-based processing for scalability and reliability.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: BLOCKCHAIN_IOT_SDPS_2019:ev_019_iteration_3_usability_privacy

```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:ev_019_iteration_3_usability_privacy",
  "supports": [
    "BLOCKCHAIN_IOT_SDPS_2019:df7_access_right_management",
    "BLOCKCHAIN_IOT_SDPS_2019:df9_sensor_data_output",
    "BLOCKCHAIN_IOT_SDPS_2019:art2_certificar_prototype",
    "BLOCKCHAIN_IOT_SDPS_2019:eval1_iterative_prototype_evaluation"
  ],
  "source_location": "Blockchain for the IoT.pdf · page 19 · 5.3 Iteration 3",
  "quote_or_summary": "The third iteration improved stability and added a smartphone app allowing data owners to create certificates and select the granularity of shared odometer data.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: BLOCKCHAIN_IOT_SDPS_2019:ev_020_ex_post_dp1

```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:ev_020_ex_post_dp1",
  "supports": [
    "BLOCKCHAIN_IOT_SDPS_2019:dp1_source_to_sink_certification",
    "BLOCKCHAIN_IOT_SDPS_2019:eval2_ex_post_evaluation"
  ],
  "source_location": "Blockchain for the IoT.pdf · page 21 · 6 Ex Post Evaluation",
  "quote_or_summary": "Ex-post interview participants broadly supported source-to-sink protection as a necessary basis for sensor-data validity, while noting full implementation is difficult in practice.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: BLOCKCHAIN_IOT_SDPS_2019:ev_021_ex_post_dp2

```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:ev_021_ex_post_dp2",
  "supports": [
    "BLOCKCHAIN_IOT_SDPS_2019:dp2_cross_validation_certification",
    "BLOCKCHAIN_IOT_SDPS_2019:eval2_ex_post_evaluation"
  ],
  "source_location": "Blockchain for the IoT.pdf · page 21 · 6 Ex Post Evaluation",
  "quote_or_summary": "Experts supported cross-validation because source-to-sink protection cannot eliminate every manipulation risk, especially when sensor readings or environments can be influenced.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: BLOCKCHAIN_IOT_SDPS_2019:ev_022_ex_post_dp3

```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:ev_022_ex_post_dp3",
  "supports": [
    "BLOCKCHAIN_IOT_SDPS_2019:dp3_data_owner_controlled_disclosure",
    "BLOCKCHAIN_IOT_SDPS_2019:eval2_ex_post_evaluation"
  ],
  "source_location": "Blockchain for the IoT.pdf · page 22 · 6 Ex Post Evaluation",
  "quote_or_summary": "Interview participants viewed the privacy-preserving mechanisms around controlled data communication as strong, while raising regulatory and revocation considerations.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: BLOCKCHAIN_IOT_SDPS_2019:ev_023_ex_post_dp4

```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:ev_023_ex_post_dp4",
  "supports": [
    "BLOCKCHAIN_IOT_SDPS_2019:dp4_linearly_scalable_architecture",
    "BLOCKCHAIN_IOT_SDPS_2019:eval2_ex_post_evaluation"
  ],
  "source_location": "Blockchain for the IoT.pdf · page 22 · 6 Ex Post Evaluation",
  "quote_or_summary": "Experts considered the hybrid blockchain-plus-traditional-infrastructure approach appropriate and necessary for scalability under current technology.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: BLOCKCHAIN_IOT_SDPS_2019:ev_024_blockchain_usage_implications

```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:ev_024_blockchain_usage_implications",
  "supports": [
    "BLOCKCHAIN_IOT_SDPS_2019:ok2_blockchain_sdps_usage_implications"
  ],
  "source_location": "Blockchain for the IoT.pdf · page 26 · Table 5",
  "quote_or_summary": "Table 5 links blockchain characteristics to SDPS advantages: shared immutable ledgers, decentralized systems, and ready-to-use security protocols and infrastructure.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: BLOCKCHAIN_IOT_SDPS_2019:ev_025_design_implications

```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:ev_025_design_implications",
  "supports": [
    "BLOCKCHAIN_IOT_SDPS_2019"
  ],
  "source_location": "Blockchain for the IoT.pdf · page 27 · Table 6",
  "quote_or_summary": "Table 6 states design implications for blockchain-based SDPSs: protect data early, use cross-validation, implement privacy above blockchain, and use hybrid architectures for scaling.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: BLOCKCHAIN_IOT_SDPS_2019:ev_026_certification_process

```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:ev_026_certification_process",
  "supports": [
    "BLOCKCHAIN_IOT_SDPS_2019:df8_sensor_data_certification",
    "BLOCKCHAIN_IOT_SDPS_2019:art1_sdps_general_architecture"
  ],
  "source_location": "Blockchain for the IoT.pdf · page 15 · Figure 5",
  "quote_or_summary": "Figure 5 details the certification process: retrieve raw data, calculate hashes, retrieve blockchain transactions, compare hashes, verify consistency, cross-validate, and issue a certificate with or without restrictions.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: BLOCKCHAIN_IOT_SDPS_2019:ev_027_table_2_prototype_evaluation

```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:ev_027_table_2_prototype_evaluation",
  "supports": [
    "BLOCKCHAIN_IOT_SDPS_2019:eval1_iterative_prototype_evaluation"
  ],
  "source_location": "Blockchain for the IoT.pdf · page 20 · Table 2",
  "quote_or_summary": "Table 2 summarizes the three prototype iterations, evaluations, and core results, including detection improvements, scalability/reliability work, and smartphone-app acceptance.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: BLOCKCHAIN_IOT_SDPS_2019:ev_028_design_theory_components

```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:ev_028_design_theory_components",
  "supports": [
    "BLOCKCHAIN_IOT_SDPS_2019:ok1_sdps_design_theory"
  ],
  "source_location": "Blockchain for the IoT.pdf · page 24 · Table 4",
  "quote_or_summary": "Table 4 presents the SDPS design theory using components such as purpose and scope, constructs, principles of form and function, artifact mutability, testable propositions, and justificatory knowledge.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: BLOCKCHAIN_IOT_SDPS_2019:ev_029_conclusion

```json
{
  "id": "BLOCKCHAIN_IOT_SDPS_2019:ev_029_conclusion",
  "supports": [
    "BLOCKCHAIN_IOT_SDPS_2019:ok1_sdps_design_theory"
  ],
  "source_location": "Blockchain for the IoT.pdf · page 28 · Conclusion",
  "quote_or_summary": "The conclusion states that the design supports tamper-resistant gathering, processing, and exchange of IoT sensor data in a privacy-preserving, scalable, and efficient manner.",
  "evidence_type": "paraphrase"
}
```
