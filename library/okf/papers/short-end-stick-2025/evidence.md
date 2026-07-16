---
schema_version: "okf-dsr-v1"
type: "EvidenceCollection"
paper_id: "SHORT_END_STICK_2025"
extraction_status: "okf_draft"
review_status: "unreviewed"
---

# Canonical Evidence Items

## Evidence: SHORT_END_STICK_2025:ev_001_paper_problem_two_sided_opportunism

```json
{
  "id": "SHORT_END_STICK_2025:ev_001_paper_problem_two_sided_opportunism",
  "supports": [
    "SHORT_END_STICK_2025:problem_two_sided_opportunism",
    "SHORT_END_STICK_2025:ok_001_two_sided_opportunism_problem"
  ],
  "source_location": "main article · page 2-4",
  "quote_or_summary": "The abstract and introduction define the problem as interorganizational information sharing based on sensitive data where information recipients fear manipulation and information providers fear poaching. The paper argues that existing countermeasures either fail to prevent both forms reliably or handle only one side at a time.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SHORT_END_STICK_2025:ev_002_research_question

```json
{
  "id": "SHORT_END_STICK_2025:ev_002_research_question",
  "supports": [
    "SHORT_END_STICK_2025"
  ],
  "source_location": "main article · page 4",
  "quote_or_summary": "The paper asks how to design an information system that enables interorganizational information sharing based on sensitive data while preventing both information poaching and information manipulation.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SHORT_END_STICK_2025:ev_003_dsrm_method

```json
{
  "id": "SHORT_END_STICK_2025:ev_003_dsrm_method",
  "supports": [
    "SHORT_END_STICK_2025:eval_001_demonstration_interviews",
    "SHORT_END_STICK_2025:eval_002_vignette_survey"
  ],
  "source_location": "main article · page 7-8",
  "quote_or_summary": "The method section states that the authors used design science research methodology, including problem identification, artifact instantiation, demonstration of efficacy, and evaluation of utility.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SHORT_END_STICK_2025:ev_004_design_requirements

```json
{
  "id": "SHORT_END_STICK_2025:ev_004_design_requirements",
  "supports": [
    "SHORT_END_STICK_2025:dr_001_prevent_information_manipulation",
    "SHORT_END_STICK_2025:dr_002_prevent_information_poaching"
  ],
  "source_location": "main article · page 7-9",
  "quote_or_summary": "The paper defines two design requirements: preventing information manipulation and preventing information poaching inside the system.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SHORT_END_STICK_2025:ev_005_dp1_storage_principle

```json
{
  "id": "SHORT_END_STICK_2025:ev_005_dp1_storage_principle",
  "supports": [
    "SHORT_END_STICK_2025:dp_001_manipulation_resistant_private_storage_with_integrity_proof"
  ],
  "source_location": "main article, Figure 1 and Section 4.1.1 · page 9",
  "quote_or_summary": "The data storage principle requires sensitive data to remain exclusively with the information provider while a manipulation-resistant proof of integrity is made available to the information recipient.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SHORT_END_STICK_2025:ev_006_dp2_processing_principle

```json
{
  "id": "SHORT_END_STICK_2025:ev_006_dp2_processing_principle",
  "supports": [
    "SHORT_END_STICK_2025:dp_002_nonreversible_reliable_independent_computation"
  ],
  "source_location": "main article, Section 4.1.2 · page 9-10",
  "quote_or_summary": "The data processing principle requires nonreversible, deterministic, independently executed functions that compute shared information from confidentially stored sensitive data.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SHORT_END_STICK_2025:ev_007_dp3_governance_principle

```json
{
  "id": "SHORT_END_STICK_2025:ev_007_dp3_governance_principle",
  "supports": [
    "SHORT_END_STICK_2025:dp_003_joint_approval_for_computation_mechanism_changes"
  ],
  "source_location": "main article, Section 4.1.3 · page 10",
  "quote_or_summary": "The governance principle requires joint approval for any changes to the mechanisms that compute shared information, preventing unilateral changes that would enable poaching or manipulation.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SHORT_END_STICK_2025:ev_008_figure1_summary_design_principles

```json
{
  "id": "SHORT_END_STICK_2025:ev_008_figure1_summary_design_principles",
  "supports": [
    "SHORT_END_STICK_2025:dr_001_prevent_information_manipulation",
    "SHORT_END_STICK_2025:dr_002_prevent_information_poaching",
    "SHORT_END_STICK_2025:dp_001_manipulation_resistant_private_storage_with_integrity_proof",
    "SHORT_END_STICK_2025:dp_002_nonreversible_reliable_independent_computation",
    "SHORT_END_STICK_2025:dp_003_joint_approval_for_computation_mechanism_changes"
  ],
  "source_location": "main article, Figure 1 · page 9",
  "quote_or_summary": "Figure 1 maps the two design requirements to three design-principle areas: data storage, data processing, and system governance.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SHORT_END_STICK_2025:ev_009_figure2_architecture

```json
{
  "id": "SHORT_END_STICK_2025:ev_009_figure2_architecture",
  "supports": [
    "SHORT_END_STICK_2025:artifact_001_hyperledger_fabric_two_sided_opportunism_solution",
    "SHORT_END_STICK_2025:df_001_private_data_collection_as_provider_only_sensitive_data_store",
    "SHORT_END_STICK_2025:df_002_public_hash_integrity_proof",
    "SHORT_END_STICK_2025:df_003_smart_contract_stress_factor_computation",
    "SHORT_END_STICK_2025:df_005_joint_governance_policy"
  ],
  "source_location": "main article, Figure 2 · page 9",
  "quote_or_summary": "Figure 2 shows the system architecture with the information provider, information recipient, proof of integrity, shared information, sensitive data, DP1/DP2 mechanisms, and a jointly governed system corresponding to DP3.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SHORT_END_STICK_2025:ev_010_instantiation_context_machine_tool_leasing

```json
{
  "id": "SHORT_END_STICK_2025:ev_010_instantiation_context_machine_tool_leasing",
  "supports": [
    "SHORT_END_STICK_2025:artifact_001_hyperledger_fabric_two_sided_opportunism_solution"
  ],
  "source_location": "main article, Section 4.2 · page 10-11",
  "quote_or_summary": "The artifact is instantiated in wear-based leasing contracts for machine tools, where machine tool users fear leakage of sensitive usage data and lessors need reliable machine wear information.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SHORT_END_STICK_2025:ev_011_hyperledger_fabric_selection

```json
{
  "id": "SHORT_END_STICK_2025:ev_011_hyperledger_fabric_selection",
  "supports": [
    "SHORT_END_STICK_2025:artifact_001_hyperledger_fabric_two_sided_opportunism_solution",
    "SHORT_END_STICK_2025:df_006_confidential_stress_channel",
    "SHORT_END_STICK_2025:df_007_peer_and_orderer_network_structure"
  ],
  "source_location": "main article, Section 4.3 · page 11",
  "quote_or_summary": "The authors chose Hyperledger Fabric 2.0 because of its confidentiality features and set up peer nodes, orderer nodes, and a StressChannel between machine tool user and lessor.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SHORT_END_STICK_2025:ev_012_private_data_collection_implementation

```json
{
  "id": "SHORT_END_STICK_2025:ev_012_private_data_collection_implementation",
  "supports": [
    "SHORT_END_STICK_2025:df_001_private_data_collection_as_provider_only_sensitive_data_store",
    "SHORT_END_STICK_2025:df_002_public_hash_integrity_proof"
  ],
  "source_location": "main article, Section 4.3 and Table 3 · page 11-12",
  "quote_or_summary": "The private data collection is restricted to the information provider and smart contract; it prevents lessor access to sensor data while providing a hash-based proof of integrity.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SHORT_END_STICK_2025:ev_013_smart_contract_implementation

```json
{
  "id": "SHORT_END_STICK_2025:ev_013_smart_contract_implementation",
  "supports": [
    "SHORT_END_STICK_2025:df_003_smart_contract_stress_factor_computation",
    "SHORT_END_STICK_2025:df_004_nonreversible_aggregation_function"
  ],
  "source_location": "main article, Section 4.3 and Table 3 · page 11-12",
  "quote_or_summary": "The smart contract computes a stress factor from confidential sensor data and stores the calculated factor on the shared ledger so it is available to both parties.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SHORT_END_STICK_2025:ev_014_joint_governance_implementation

```json
{
  "id": "SHORT_END_STICK_2025:ev_014_joint_governance_implementation",
  "supports": [
    "SHORT_END_STICK_2025:df_005_joint_governance_policy"
  ],
  "source_location": "main article, Section 4.3 and Table 3 · page 12",
  "quote_or_summary": "Hyperledger Fabric policies require approval from both parties for changes to the private data collection definition or the smart contract logic.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SHORT_END_STICK_2025:ev_015_figure3_artifact

```json
{
  "id": "SHORT_END_STICK_2025:ev_015_figure3_artifact",
  "supports": [
    "SHORT_END_STICK_2025:artifact_001_hyperledger_fabric_two_sided_opportunism_solution",
    "SHORT_END_STICK_2025:df_006_confidential_stress_channel",
    "SHORT_END_STICK_2025:df_007_peer_and_orderer_network_structure"
  ],
  "source_location": "main article, Figure 3 · page 12",
  "quote_or_summary": "Figure 3 depicts the artifact: a Hyperledger Fabric system, confidential StressChannel, machine tool user and lessor networks, sensor device, peers, orderers, sensor data private collection, hash, and stress factor.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SHORT_END_STICK_2025:ev_016_demonstration_interviews

```json
{
  "id": "SHORT_END_STICK_2025:ev_016_demonstration_interviews",
  "supports": [
    "SHORT_END_STICK_2025:eval_001_demonstration_interviews"
  ],
  "source_location": "main article, Section 5 and Table 4 · page 12-14",
  "quote_or_summary": "The demonstration uses 22 expert interviews with consortium members, external domain experts, and blockchain experts to evaluate whether the prototype addresses poaching, manipulation, and technological validity.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SHORT_END_STICK_2025:ev_017_dp1_demonstration_results

```json
{
  "id": "SHORT_END_STICK_2025:ev_017_dp1_demonstration_results",
  "supports": [
    "SHORT_END_STICK_2025:dp_001_manipulation_resistant_private_storage_with_integrity_proof",
    "SHORT_END_STICK_2025:df_001_private_data_collection_as_provider_only_sensitive_data_store",
    "SHORT_END_STICK_2025:df_002_public_hash_integrity_proof"
  ],
  "source_location": "main article, Section 5 · page 12-13",
  "quote_or_summary": "Machine tool users valued reduced unwanted analysis and data leakage, while lessors and manufacturers valued the proof of integrity and auditability of hash-based change detection.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SHORT_END_STICK_2025:ev_018_dp2_demonstration_results

```json
{
  "id": "SHORT_END_STICK_2025:ev_018_dp2_demonstration_results",
  "supports": [
    "SHORT_END_STICK_2025:dp_002_nonreversible_reliable_independent_computation",
    "SHORT_END_STICK_2025:df_003_smart_contract_stress_factor_computation",
    "SHORT_END_STICK_2025:df_004_nonreversible_aggregation_function"
  ],
  "source_location": "main article, Section 5 · page 13-14",
  "quote_or_summary": "Interviewees viewed the predefined aggregation into a stress factor as protecting sensitive sensor data while giving lessors a reliable value for lease-rate calculation.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SHORT_END_STICK_2025:ev_019_dp3_demonstration_results

```json
{
  "id": "SHORT_END_STICK_2025:ev_019_dp3_demonstration_results",
  "supports": [
    "SHORT_END_STICK_2025:dp_003_joint_approval_for_computation_mechanism_changes",
    "SHORT_END_STICK_2025:df_005_joint_governance_policy"
  ],
  "source_location": "main article, Section 5 · page 14",
  "quote_or_summary": "Interviewees valued distributed control over the information exchange; blockchain experts confirmed that smart contract initialization and changes required approval from both parties.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SHORT_END_STICK_2025:ev_020_survey_evaluation_design

```json
{
  "id": "SHORT_END_STICK_2025:ev_020_survey_evaluation_design",
  "supports": [
    "SHORT_END_STICK_2025:eval_002_vignette_survey"
  ],
  "source_location": "main article, Section 6 · page 14-16",
  "quote_or_summary": "The authors conducted a vignette-based survey with machine tool users and lessors to evaluate whether access to the system changes sharing and reliance intentions.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SHORT_END_STICK_2025:ev_021_survey_results

```json
{
  "id": "SHORT_END_STICK_2025:ev_021_survey_results",
  "supports": [
    "SHORT_END_STICK_2025:eval_002_vignette_survey",
    "SHORT_END_STICK_2025:ok_001_two_sided_opportunism_problem"
  ],
  "source_location": "main article, Section 6.4, Tables 7 and 8 · page 17-18",
  "quote_or_summary": "The survey finds that the system increases machine tool users' willingness to share both low- and high-sensitivity data and increases lessors' willingness to rely on provided information.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SHORT_END_STICK_2025:ev_022_contribution_design_blueprint

```json
{
  "id": "SHORT_END_STICK_2025:ev_022_contribution_design_blueprint",
  "supports": [
    "SHORT_END_STICK_2025:ok_002_design_blueprint_for_confidential_reliable_information_sharing"
  ],
  "source_location": "main article, Section 7.1 · page 18-19",
  "quote_or_summary": "The discussion states that the design principles constitute a generic approach to solving the two-sided opportunism problem and go beyond existing organizational and technical measures.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SHORT_END_STICK_2025:ev_023_contribution_blockchain_recombination

```json
{
  "id": "SHORT_END_STICK_2025:ev_023_contribution_blockchain_recombination",
  "supports": [
    "SHORT_END_STICK_2025:ok_003_blockchain_recombination_contribution"
  ],
  "source_location": "main article, Section 7.1 · page 19",
  "quote_or_summary": "The paper presents the technological contribution as a recombination of private data collections, smart contracts, and joint governance to achieve confidentiality and verifiability at the same time.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SHORT_END_STICK_2025:ev_024_limitations

```json
{
  "id": "SHORT_END_STICK_2025:ev_024_limitations",
  "supports": [
    "SHORT_END_STICK_2025"
  ],
  "source_location": "main article, Section 7.2 · page 20-21",
  "quote_or_summary": "The paper states boundary conditions: the solution is most effective when both parties fear opportunism; functions can be costly to define; blockchain integrity matters; the first-mile problem remains; and the utility evaluation is artificial.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SHORT_END_STICK_2025:ev_025_online_appendix_mitigation_strategies

```json
{
  "id": "SHORT_END_STICK_2025:ev_025_online_appendix_mitigation_strategies",
  "supports": [
    "SHORT_END_STICK_2025"
  ],
  "source_location": "online supplemental material, Appendix A",
  "quote_or_summary": "The online appendix reviews opportunism mitigation strategies, including contractual governance, relational governance, third parties, and technological solutions, and explains why blockchain work has mostly focused on information manipulation rather than poaching.",
  "evidence_type": "paraphrase"
}
```

---

## Evidence: SHORT_END_STICK_2025:ev_026_online_appendix_blockchain_mechanisms

```json
{
  "id": "SHORT_END_STICK_2025:ev_026_online_appendix_blockchain_mechanisms",
  "supports": [
    "SHORT_END_STICK_2025:df_001_private_data_collection_as_provider_only_sensitive_data_store"
  ],
  "source_location": "online supplemental material, Appendix B",
  "quote_or_summary": "The online appendix compares blockchain confidentiality mechanisms and identifies private data collections as providing fine-grained access to channel data and enabling smart contract processing of confidential data.",
  "evidence_type": "paraphrase"
}
```
