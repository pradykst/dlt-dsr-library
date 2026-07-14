---
type: PaperDSRProfile
paper_id: SHORT_END_STICK_2025
title: "DSR Profile: And No One Gets the Short End of the Stick"
review_status: draft
confidence: high
source_file: dsr.md
---

# 1. Interpreted Design Problem

## problem_two_sided_opportunism

**Type:** Problem  
**Title:** Two-sided opportunism in interorganizational information sharing  
**Extraction type:** explicit  
**Confidence:** high

Organizations may avoid beneficial information sharing when the information provider fears that the recipient will misuse sensitive data, and the information recipient fears that the provider will manipulate or misrepresent the shared information.

In the paper's framing, the two forms are not independent. Measures that reduce one party's risk can increase the other party's risk. For example, making data visible helps the recipient detect manipulation but increases the provider's exposure to poaching. Hiding data protects the provider but prevents the recipient from verifying correctness.

**Problem class:** Interorganizational information sharing based on sensitive data where both parties face opportunism risk.

**Domain instantiation:** Wear-based machine tool leasing, where machine tool users possess sensitive usage and sensor data and lessors need reliable wear-and-tear information for lease-rate calculation.

---

# 2. Research Question

## rq_001

**Type:** ResearchQuestion  
**Title:** Design of an IS for simultaneous prevention of poaching and manipulation  
**Extraction type:** explicit  
**Confidence:** high

How should an information system be designed to enable interorganizational information sharing based on sensitive data while simultaneously preventing both information poaching and information manipulation?

---

# 3. Design Requirements

## dr_001_prevent_information_manipulation

**Type:** DesignRequirement  
**Title:** Prevent information manipulation  
**DSR layer:** Requirement  
**Extraction type:** explicit  
**Confidence:** high  
**Tags:** manipulation, information-integrity, reliability, opportunism

The system must prevent the information provider from opportunistically changing stored data or influencing the computation of shared information in a way that misrepresents the underlying facts.

**Operational meaning:** The recipient should be able to rely on shared information as verifiably truthful even without direct access to the sensitive underlying data.

## dr_002_prevent_information_poaching

**Type:** DesignRequirement  
**Title:** Prevent information poaching  
**DSR layer:** Requirement  
**Extraction type:** explicit  
**Confidence:** high  
**Tags:** poaching, confidentiality, sensitive-data, opportunism

The system must prevent the information recipient from accessing or inferring sensitive underlying data beyond the agreed shared information.

**Operational meaning:** The provider should be able to participate in information sharing without exposing sensitive production, process, or machine-use data.

---

# 4. Design Principles

## dp_001_manipulation_resistant_private_storage_with_integrity_proof

**Type:** DesignPrinciple  
**Title:** Store sensitive data only with the information provider and create a proof of integrity for the recipient  
**DSR layer:** Design Principle  
**Extraction type:** explicit  
**Confidence:** high  
**Supports requirements:** dr_001_prevent_information_manipulation, dr_002_prevent_information_poaching

Sensitive data should be stored in manipulation-resistant storage exclusively with the information provider. At the same time, the system should instantly create a manipulation-resistant proof of integrity that is available to the information recipient.

**Design logic:** The sensitive data remain inaccessible to the recipient, addressing poaching. The proof of integrity makes tampering visible to the recipient, addressing manipulation.

## dp_002_nonreversible_reliable_independent_computation

**Type:** DesignPrinciple  
**Title:** Compute shared information through nonreversible, reliable, independently executed functions  
**DSR layer:** Design Principle  
**Extraction type:** explicit  
**Confidence:** high  
**Supports requirements:** dr_001_prevent_information_manipulation, dr_002_prevent_information_poaching

The system should use nonreversible functions that are reliably and independently executed to compute shared information from confidentially stored sensitive data.

**Design logic:** Nonreversible functions prevent the recipient from backtracking to the underlying sensitive data. Reliable independent execution prevents the provider from manipulating the computation logic or output.

## dp_003_joint_approval_for_computation_mechanism_changes

**Type:** DesignPrinciple  
**Title:** Require joint approval for changes to computation mechanisms  
**DSR layer:** Design Principle  
**Extraction type:** explicit  
**Confidence:** high  
**Supports requirements:** dr_001_prevent_information_manipulation, dr_002_prevent_information_poaching

Any change to mechanisms that compute shared information must require approval from both information provider and information recipient.

**Design logic:** Joint approval prevents unilateral changes that either expose private data or alter aggregation logic in favor of one party.

---

# 5. Design Features / Artifact Mechanisms

The paper explicitly labels three design principles and describes their implementation in the artifact. The following design features are extracted from the artifact instantiation, Table 3, Figure 2, Figure 3, and the design-and-development section.

## df_001_private_data_collection_as_provider_only_sensitive_data_store

**Type:** DesignFeature  
**Title:** Private data collection as provider-only sensitive data store  
**DSR layer:** Design Feature  
**Extraction type:** explicit-in-artifact  
**Confidence:** high  
**Instantiates:** dp_001_manipulation_resistant_private_storage_with_integrity_proof

A Hyperledger Fabric private data collection is configured so that sensitive sensor data are accessible only to the information provider and the smart contract, not to the information recipient.

## df_002_public_hash_integrity_proof

**Type:** DesignFeature  
**Title:** Public hash-based proof of integrity  
**DSR layer:** Design Feature  
**Extraction type:** explicit-in-artifact  
**Confidence:** high  
**Instantiates:** dp_001_manipulation_resistant_private_storage_with_integrity_proof

The private data collection generates a hash of the sensitive data. The hash is made available on-chain as a proof of integrity. If the private data are altered, the system can detect the mismatch and inform the information recipient.

## df_003_smart_contract_stress_factor_computation

**Type:** DesignFeature  
**Title:** Smart contract for stress-factor computation  
**DSR layer:** Design Feature  
**Extraction type:** explicit-in-artifact  
**Confidence:** high  
**Instantiates:** dp_002_nonreversible_reliable_independent_computation

A smart contract reads confidential sensor data from the private data collection, applies the predefined computation, and stores the resulting stress factor on the shared ledger.

## df_004_nonreversible_aggregation_function

**Type:** DesignFeature  
**Title:** Nonreversible aggregation function  
**DSR layer:** Design Feature  
**Extraction type:** explicit  
**Confidence:** high  
**Instantiates:** dp_002_nonreversible_reliable_independent_computation

The system computes abstract, context-specific shared information from sensitive data using a nonreversible function so that the information recipient cannot reconstruct the underlying data.

## df_005_joint_governance_policy

**Type:** DesignFeature  
**Title:** Joint governance policy for changes  
**DSR layer:** Design Feature  
**Extraction type:** explicit-in-artifact  
**Confidence:** high  
**Instantiates:** dp_003_joint_approval_for_computation_mechanism_changes

Hyperledger Fabric governance policies require both parties to approve changes to the private data collection definition or smart contract logic.

## df_006_confidential_stress_channel

**Type:** DesignFeature  
**Title:** Confidential StressChannel for interorganizational exchange  
**DSR layer:** Design Feature  
**Extraction type:** explicit-in-artifact  
**Confidence:** high  
**Instantiates:** dp_002_nonreversible_reliable_independent_computation, dp_003_joint_approval_for_computation_mechanism_changes

The artifact uses a Hyperledger Fabric channel, called StressChannel, between the machine tool user's peer and the lessor's peer to coordinate exchange and maintain a private ledger for the shared information.

## df_007_peer_and_orderer_network_structure

**Type:** DesignFeature  
**Title:** Peer and orderer network structure  
**DSR layer:** Design Feature  
**Extraction type:** explicit-in-artifact  
**Confidence:** medium-high  
**Instantiates:** dp_003_joint_approval_for_computation_mechanism_changes

The machine tool user and the lessor each operate peer infrastructure, while orderer nodes order transactions and support access-control duties for channels.

## df_008_sensor_data_ingestion_interface

**Type:** DesignFeature  
**Title:** Sensor data ingestion interface  
**DSR layer:** Design Feature  
**Extraction type:** explicit-in-artifact  
**Confidence:** medium  
**Instantiates:** dp_001_manipulation_resistant_private_storage_with_integrity_proof

A web server provides a prototypical API for sensors and front-end components, connecting to the blockchain through gRPC.

---

# 6. Artifact

## artifact_001_hyperledger_fabric_two_sided_opportunism_solution

**Type:** Artifact  
**Title:** Hyperledger Fabric system for confidential and verifiable information sharing  
**DSR layer:** Artifact  
**Extraction type:** explicit  
**Confidence:** high

The artifact is a blockchain-based shared information system for wear-based machine tool leasing. It uses Hyperledger Fabric 2.0, private data collections, smart contracts, and joint governance policies to share a reliable stress factor derived from confidential machine sensor data without revealing the underlying sensitive data to the lessor.

**Core artifact flow:**

1. A machine sensor produces data.
2. Sensitive sensor data are stored in a private data collection under the machine tool user's control.
3. A hash/proof of integrity is made visible for manipulation detection.
4. A smart contract computes a stress factor from the confidential data.
5. The stress factor is shared with the lessor and used for wear-based leasing.
6. Changes to the data collection or computation logic require joint approval.

---

# 7. Evaluation

## eval_001_demonstration_interviews

**Type:** Evaluation  
**Title:** Proof-of-concept demonstration through expert interviews  
**DSR layer:** Evaluation  
**Extraction type:** explicit  
**Confidence:** high

The paper demonstrates artifact efficacy using semistructured interviews with 22 experts, including machine tool users, lessors, machine manufacturers, consortium participants, and professional blockchain experts. The interviews assessed whether the artifact prevents information manipulation, prevents information poaching, and is technologically valid and novel.

## eval_002_vignette_survey

**Type:** Evaluation  
**Title:** Proof-of-value vignette survey with machine tool users and lessors  
**DSR layer:** Evaluation  
**Extraction type:** explicit  
**Confidence:** high

The paper evaluates utility using a vignette-based survey with 85 machine tool users and 77 lessors. Results indicate that the system increases providers' willingness to share sensitive data and recipients' willingness to rely on shared information.

---

# 8. Output Knowledge / Design Theory Contribution

## ok_001_two_sided_opportunism_problem

**Type:** OutputKnowledge  
**Title:** Information poaching and manipulation as two sides of one problem  
**DSR layer:** Output Knowledge  
**Extraction type:** explicit  
**Confidence:** high

The paper conceptualizes information poaching and information manipulation as two interdependent forms of opportunism in interorganizational information sharing. Both must be addressed simultaneously because countermeasures against one may worsen the other.

## ok_002_design_blueprint_for_confidential_reliable_information_sharing

**Type:** OutputKnowledge  
**Title:** Design blueprint for reliable information sharing without revealing underlying data  
**DSR layer:** Output Knowledge  
**Extraction type:** explicit  
**Confidence:** high

The three design principles provide a reusable design blueprint for interorganizational systems that share verifiably truthful information derived from sensitive data without revealing the underlying data.

## ok_003_blockchain_recombination_contribution

**Type:** OutputKnowledge  
**Title:** Recombination of private data collections, smart contracts, and joint governance  
**DSR layer:** Output Knowledge  
**Extraction type:** explicit  
**Confidence:** high

The paper contributes to blockchain systems research by recombining Hyperledger Fabric private data collections, smart contracts, and joint governance in a novel way to address confidentiality and verifiability simultaneously.

---

# 9. Kernel Theories and Justificatory Knowledge

## kt_001_transaction_cost_economics_and_opportunism

**Type:** KernelTheory  
**Title:** Transaction cost economics and opportunism  
**Extraction type:** explicit  
**Confidence:** high

The paper builds on transaction cost economics and the concept of opportunism, especially selfish behavior with guile in interorganizational relationships.

## kt_002_information_poaching_and_information_manipulation_literature

**Type:** KernelTheory  
**Title:** Information poaching and information manipulation literature  
**Extraction type:** explicit  
**Confidence:** high

Prior literature on information poaching, manipulation, governance, and interorganizational information sharing grounds the problem identification.

## kt_003_blockchain_governance_and_smart_contracts

**Type:** KernelTheory  
**Title:** Blockchain governance, smart contracts, and private data collections  
**Extraction type:** explicit  
**Confidence:** high

The artifact is grounded in blockchain literature on manipulation-resistant storage, smart contract execution, governance, and Hyperledger Fabric confidentiality mechanisms.

---

# 10. Boundary Conditions and Limitations

## lim_001_best_when_both_sides_fear_opportunism

**Type:** Limitation  
**Title:** Most effective when both parties fear opportunism  
**Confidence:** high

The solution is most useful when both the information provider and information recipient simultaneously fear opportunistic behavior. If only one party faces opportunism risk, simpler systems may suffice.

## lim_002_nonreversible_function_definition_cost

**Type:** Limitation  
**Title:** Nonreversible functions can be costly to define  
**Confidence:** high

Jointly defining and approving appropriate nonreversible functions can be time-consuming and costly, so the approach fits better in relatively stable contexts where computation logic does not change frequently.

## lim_003_blockchain_network_integrity_dependency

**Type:** Limitation  
**Title:** Dependency on blockchain network integrity  
**Confidence:** high

The solution relies on the integrity and governance of the underlying permissioned blockchain network.

## lim_004_first_mile_problem

**Type:** Limitation  
**Title:** First-mile problem before data enter the shared IS  
**Confidence:** high

The artifact prevents manipulation only after data have entered the shared system. Hardware or upstream systems could still be manipulated before ingestion.

## lim_005_artificial_utility_evaluation

**Type:** Limitation  
**Title:** Artificial utility evaluation  
**Confidence:** high

The wider proof-of-value evaluation uses a vignette-based survey rather than a naturalistic deployment across many organizations.
