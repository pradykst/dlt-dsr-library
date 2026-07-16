---
schema_version: "okf-dsr-v1"
type: "ConceptCollection"
paper_id: "SHORT_END_STICK_2025"
extraction_status: "okf_draft"
review_status: "unreviewed"
---

# Canonical DSR Concepts

## Concept: SHORT_END_STICK_2025:problem_two_sided_opportunism
```json
{
  "id": "SHORT_END_STICK_2025:problem_two_sided_opportunism",
  "type": "Problem",
  "title": "Two-sided opportunism in interorganizational information sharing",
  "description": "Organizations may avoid beneficial information sharing when the information provider fears that the recipient will misuse sensitive data, and the information recipient fears that the provider will manipulate or misrepresent the shared information.\n\nIn the paper's framing, the two forms are not independent. Measures that reduce one party's risk can increase the other party's risk. For example, making data visible helps the recipient detect manipulation but increases the provider's exposure to poaching. Hiding data protects the provider but prevents the recipient from verifying correctness.",
  "evidence": [],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

Organizations may avoid beneficial information sharing when the information provider fears that the recipient will misuse sensitive data, and the information recipient fears that the provider will manipulate or misrepresent the shared information.

In the paper's framing, the two forms are not independent. Measures that reduce one party's risk can increase the other party's risk. For example, making data visible helps the recipient detect manipulation but increases the provider's exposure to poaching. Hiding data protects the provider but prevents the recipient from verifying correctness.

---

## Concept: SHORT_END_STICK_2025:dr_001_prevent_information_manipulation
```json
{
  "id": "SHORT_END_STICK_2025:dr_001_prevent_information_manipulation",
  "type": "Design Requirement",
  "title": "Prevent information manipulation",
  "description": "The system must prevent the information provider from opportunistically changing stored data or influencing the computation of shared information in a way that misrepresents the underlying facts.",
  "evidence": [],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

The system must prevent the information provider from opportunistically changing stored data or influencing the computation of shared information in a way that misrepresents the underlying facts.

---

## Concept: SHORT_END_STICK_2025:dr_002_prevent_information_poaching
```json
{
  "id": "SHORT_END_STICK_2025:dr_002_prevent_information_poaching",
  "type": "Design Requirement",
  "title": "Prevent information poaching",
  "description": "The system must prevent the information recipient from accessing or inferring sensitive underlying data beyond the agreed shared information.",
  "evidence": [],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

The system must prevent the information recipient from accessing or inferring sensitive underlying data beyond the agreed shared information.

---

## Concept: SHORT_END_STICK_2025:dp_001_manipulation_resistant_private_storage_with_integrity_proof
```json
{
  "id": "SHORT_END_STICK_2025:dp_001_manipulation_resistant_private_storage_with_integrity_proof",
  "type": "Design Principle",
  "title": "Store sensitive data only with the information provider and create a proof of integrity for the recipient",
  "description": "Sensitive data should be stored in manipulation-resistant storage exclusively with the information provider. At the same time, the system should instantly create a manipulation-resistant proof of integrity that is available to the information recipient.",
  "evidence": [],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

Sensitive data should be stored in manipulation-resistant storage exclusively with the information provider. At the same time, the system should instantly create a manipulation-resistant proof of integrity that is available to the information recipient.

---

## Concept: SHORT_END_STICK_2025:dp_002_nonreversible_reliable_independent_computation
```json
{
  "id": "SHORT_END_STICK_2025:dp_002_nonreversible_reliable_independent_computation",
  "type": "Design Principle",
  "title": "Compute shared information through nonreversible, reliable, independently executed functions",
  "description": "The system should use nonreversible functions that are reliably and independently executed to compute shared information from confidentially stored sensitive data.",
  "evidence": [],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

The system should use nonreversible functions that are reliably and independently executed to compute shared information from confidentially stored sensitive data.

---

## Concept: SHORT_END_STICK_2025:dp_003_joint_approval_for_computation_mechanism_changes
```json
{
  "id": "SHORT_END_STICK_2025:dp_003_joint_approval_for_computation_mechanism_changes",
  "type": "Design Principle",
  "title": "Require joint approval for changes to computation mechanisms",
  "description": "Any change to mechanisms that compute shared information must require approval from both information provider and information recipient.",
  "evidence": [],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

Any change to mechanisms that compute shared information must require approval from both information provider and information recipient.

---

## Concept: SHORT_END_STICK_2025:df_001_private_data_collection_as_provider_only_sensitive_data_store
```json
{
  "id": "SHORT_END_STICK_2025:df_001_private_data_collection_as_provider_only_sensitive_data_store",
  "type": "Design Feature",
  "title": "Private data collection as provider-only sensitive data store",
  "description": "A Hyperledger Fabric private data collection is configured so that sensitive sensor data are accessible only to the information provider and the smart contract, not to the information recipient.",
  "evidence": [],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

A Hyperledger Fabric private data collection is configured so that sensitive sensor data are accessible only to the information provider and the smart contract, not to the information recipient.

---

## Concept: SHORT_END_STICK_2025:df_002_public_hash_integrity_proof
```json
{
  "id": "SHORT_END_STICK_2025:df_002_public_hash_integrity_proof",
  "type": "Design Feature",
  "title": "Public hash-based proof of integrity",
  "description": "The private data collection generates a hash of the sensitive data. The hash is made available on-chain as a proof of integrity. If the private data are altered, the system can detect the mismatch and inform the information recipient.",
  "evidence": [],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

The private data collection generates a hash of the sensitive data. The hash is made available on-chain as a proof of integrity. If the private data are altered, the system can detect the mismatch and inform the information recipient.

---

## Concept: SHORT_END_STICK_2025:df_003_smart_contract_stress_factor_computation
```json
{
  "id": "SHORT_END_STICK_2025:df_003_smart_contract_stress_factor_computation",
  "type": "Design Feature",
  "title": "Smart contract for stress-factor computation",
  "description": "A smart contract reads confidential sensor data from the private data collection, applies the predefined computation, and stores the resulting stress factor on the shared ledger.",
  "evidence": [],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

A smart contract reads confidential sensor data from the private data collection, applies the predefined computation, and stores the resulting stress factor on the shared ledger.

---

## Concept: SHORT_END_STICK_2025:df_004_nonreversible_aggregation_function
```json
{
  "id": "SHORT_END_STICK_2025:df_004_nonreversible_aggregation_function",
  "type": "Design Feature",
  "title": "Nonreversible aggregation function",
  "description": "The system computes abstract, context-specific shared information from sensitive data using a nonreversible function so that the information recipient cannot reconstruct the underlying data.",
  "evidence": [],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

The system computes abstract, context-specific shared information from sensitive data using a nonreversible function so that the information recipient cannot reconstruct the underlying data.

---

## Concept: SHORT_END_STICK_2025:df_005_joint_governance_policy
```json
{
  "id": "SHORT_END_STICK_2025:df_005_joint_governance_policy",
  "type": "Design Feature",
  "title": "Joint governance policy for changes",
  "description": "Hyperledger Fabric governance policies require both parties to approve changes to the private data collection definition or smart contract logic.",
  "evidence": [],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

Hyperledger Fabric governance policies require both parties to approve changes to the private data collection definition or smart contract logic.

---

## Concept: SHORT_END_STICK_2025:df_006_confidential_stress_channel
```json
{
  "id": "SHORT_END_STICK_2025:df_006_confidential_stress_channel",
  "type": "Design Feature",
  "title": "Confidential StressChannel for interorganizational exchange",
  "description": "The artifact uses a Hyperledger Fabric channel, called StressChannel, between the machine tool user's peer and the lessor's peer to coordinate exchange and maintain a private ledger for the shared information.",
  "evidence": [],
  "confidence": "high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

The artifact uses a Hyperledger Fabric channel, called StressChannel, between the machine tool user's peer and the lessor's peer to coordinate exchange and maintain a private ledger for the shared information.

---

## Concept: SHORT_END_STICK_2025:df_007_peer_and_orderer_network_structure
```json
{
  "id": "SHORT_END_STICK_2025:df_007_peer_and_orderer_network_structure",
  "type": "Design Feature",
  "title": "Peer and orderer network structure",
  "description": "The machine tool user and the lessor each operate peer infrastructure, while orderer nodes order transactions and support access-control duties for channels.",
  "evidence": [],
  "confidence": "medium-high",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

The machine tool user and the lessor each operate peer infrastructure, while orderer nodes order transactions and support access-control duties for channels.

---

## Concept: SHORT_END_STICK_2025:df_008_sensor_data_ingestion_interface
```json
{
  "id": "SHORT_END_STICK_2025:df_008_sensor_data_ingestion_interface",
  "type": "Design Feature",
  "title": "Sensor data ingestion interface",
  "description": "A web server provides a prototypical API for sensors and front-end components, connecting to the blockchain through gRPC.",
  "evidence": [],
  "confidence": "medium",
  "extraction_type": "explicit-in-artifact",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

A web server provides a prototypical API for sensors and front-end components, connecting to the blockchain through gRPC.

---

## Concept: SHORT_END_STICK_2025:artifact_001_hyperledger_fabric_two_sided_opportunism_solution
```json
{
  "id": "SHORT_END_STICK_2025:artifact_001_hyperledger_fabric_two_sided_opportunism_solution",
  "type": "Artifact",
  "title": "Hyperledger Fabric system for confidential and verifiable information sharing",
  "description": "The artifact is a blockchain-based shared information system for wear-based machine tool leasing. It uses Hyperledger Fabric 2.0, private data collections, smart contracts, and joint governance policies to share a reliable stress factor derived from confidential machine sensor data without revealing the underlying sensitive data to the lessor.\n\n\n1. A machine sensor produces data.\n2. Sensitive sensor data are stored in a private data collection under the machine tool user's control.\n3. A hash/proof of integrity is made visible for manipulation detection.\n4. A smart contract computes a stress factor from the confidential data.\n5. The stress factor is shared with the lessor and used for wear-based leasing.\n6. Changes to the data collection or computation logic require joint approval.",
  "evidence": [],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

The artifact is a blockchain-based shared information system for wear-based machine tool leasing. It uses Hyperledger Fabric 2.0, private data collections, smart contracts, and joint governance policies to share a reliable stress factor derived from confidential machine sensor data without revealing the underlying sensitive data to the lessor.


1. A machine sensor produces data.
2. Sensitive sensor data are stored in a private data collection under the machine tool user's control.
3. A hash/proof of integrity is made visible for manipulation detection.
4. A smart contract computes a stress factor from the confidential data.
5. The stress factor is shared with the lessor and used for wear-based leasing.
6. Changes to the data collection or computation logic require joint approval.

---

## Concept: SHORT_END_STICK_2025:eval_001_demonstration_interviews
```json
{
  "id": "SHORT_END_STICK_2025:eval_001_demonstration_interviews",
  "type": "Evaluation",
  "title": "Proof-of-concept demonstration through expert interviews",
  "description": "The paper demonstrates artifact efficacy using semistructured interviews with 22 experts, including machine tool users, lessors, machine manufacturers, consortium participants, and professional blockchain experts. The interviews assessed whether the artifact prevents information manipulation, prevents information poaching, and is technologically valid and novel.",
  "evidence": [],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

The paper demonstrates artifact efficacy using semistructured interviews with 22 experts, including machine tool users, lessors, machine manufacturers, consortium participants, and professional blockchain experts. The interviews assessed whether the artifact prevents information manipulation, prevents information poaching, and is technologically valid and novel.

---

## Concept: SHORT_END_STICK_2025:eval_002_vignette_survey
```json
{
  "id": "SHORT_END_STICK_2025:eval_002_vignette_survey",
  "type": "Evaluation",
  "title": "Proof-of-value vignette survey with machine tool users and lessors",
  "description": "The paper evaluates utility using a vignette-based survey with 85 machine tool users and 77 lessors. Results indicate that the system increases providers' willingness to share sensitive data and recipients' willingness to rely on shared information.",
  "evidence": [],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

The paper evaluates utility using a vignette-based survey with 85 machine tool users and 77 lessors. Results indicate that the system increases providers' willingness to share sensitive data and recipients' willingness to rely on shared information.

---

## Concept: SHORT_END_STICK_2025:ok_001_two_sided_opportunism_problem
```json
{
  "id": "SHORT_END_STICK_2025:ok_001_two_sided_opportunism_problem",
  "type": "Output Knowledge",
  "title": "Information poaching and manipulation as two sides of one problem",
  "description": "The paper conceptualizes information poaching and information manipulation as two interdependent forms of opportunism in interorganizational information sharing. Both must be addressed simultaneously because countermeasures against one may worsen the other.",
  "evidence": [],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

The paper conceptualizes information poaching and information manipulation as two interdependent forms of opportunism in interorganizational information sharing. Both must be addressed simultaneously because countermeasures against one may worsen the other.

---

## Concept: SHORT_END_STICK_2025:ok_002_design_blueprint_for_confidential_reliable_information_sharing
```json
{
  "id": "SHORT_END_STICK_2025:ok_002_design_blueprint_for_confidential_reliable_information_sharing",
  "type": "Output Knowledge",
  "title": "Design blueprint for reliable information sharing without revealing underlying data",
  "description": "The three design principles provide a reusable design blueprint for interorganizational systems that share verifiably truthful information derived from sensitive data without revealing the underlying data.",
  "evidence": [],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

The three design principles provide a reusable design blueprint for interorganizational systems that share verifiably truthful information derived from sensitive data without revealing the underlying data.

---

## Concept: SHORT_END_STICK_2025:ok_003_blockchain_recombination_contribution
```json
{
  "id": "SHORT_END_STICK_2025:ok_003_blockchain_recombination_contribution",
  "type": "Output Knowledge",
  "title": "Recombination of private data collections, smart contracts, and joint governance",
  "description": "The paper contributes to blockchain systems research by recombining Hyperledger Fabric private data collections, smart contracts, and joint governance in a novel way to address confidentiality and verifiability simultaneously.",
  "evidence": [],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

### Source-preserved explanation

The paper contributes to blockchain systems research by recombining Hyperledger Fabric private data collections, smart contracts, and joint governance in a novel way to address confidentiality and verifiability simultaneously.
