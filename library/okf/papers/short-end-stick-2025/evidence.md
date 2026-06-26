---
type: EvidenceSet
paper_id: SHORT_END_STICK_2025
title: "Evidence Set: And No One Gets the Short End of the Stick"
review_status: draft
confidence: high
source_file: evidence.md
---

# Evidence Items

## ev_001_paper_problem_two_sided_opportunism

**Supports:** problem_two_sided_opportunism, ok_001_two_sided_opportunism_problem  
**Source:** main article  
**PDF pages:** 2-4  
**Article pages:** 1565-1567  
**Evidence type:** paraphrase  
**Confidence:** high

The abstract and introduction define the problem as interorganizational information sharing based on sensitive data where information recipients fear manipulation and information providers fear poaching. The paper argues that existing countermeasures either fail to prevent both forms reliably or handle only one side at a time.

## ev_002_research_question

**Supports:** rq_001  
**Source:** main article  
**PDF page:** 4  
**Article page:** 1567  
**Evidence type:** paraphrase  
**Confidence:** high

The paper asks how to design an information system that enables interorganizational information sharing based on sensitive data while preventing both information poaching and information manipulation.

## ev_003_dsrm_method

**Supports:** eval_001_demonstration_interviews, eval_002_vignette_survey  
**Source:** main article  
**PDF pages:** 7-8  
**Article pages:** 1570-1571  
**Evidence type:** paraphrase  
**Confidence:** high

The method section states that the authors used design science research methodology, including problem identification, artifact instantiation, demonstration of efficacy, and evaluation of utility.

## ev_004_design_requirements

**Supports:** dr_001_prevent_information_manipulation, dr_002_prevent_information_poaching  
**Source:** main article  
**PDF pages:** 7-9  
**Article pages:** 1570-1572  
**Evidence type:** paraphrase  
**Confidence:** high

The paper defines two design requirements: preventing information manipulation and preventing information poaching inside the system.

## ev_005_dp1_storage_principle

**Supports:** dp_001_manipulation_resistant_private_storage_with_integrity_proof  
**Source:** main article, Figure 1 and Section 4.1.1  
**PDF page:** 9  
**Article page:** 1572  
**Evidence type:** paraphrase  
**Confidence:** high

The data storage principle requires sensitive data to remain exclusively with the information provider while a manipulation-resistant proof of integrity is made available to the information recipient.

## ev_006_dp2_processing_principle

**Supports:** dp_002_nonreversible_reliable_independent_computation  
**Source:** main article, Section 4.1.2  
**PDF pages:** 9-10  
**Article pages:** 1572-1573  
**Evidence type:** paraphrase  
**Confidence:** high

The data processing principle requires nonreversible, deterministic, independently executed functions that compute shared information from confidentially stored sensitive data.

## ev_007_dp3_governance_principle

**Supports:** dp_003_joint_approval_for_computation_mechanism_changes  
**Source:** main article, Section 4.1.3  
**PDF page:** 10  
**Article page:** 1573  
**Evidence type:** paraphrase  
**Confidence:** high

The governance principle requires joint approval for any changes to the mechanisms that compute shared information, preventing unilateral changes that would enable poaching or manipulation.

## ev_008_figure1_summary_design_principles

**Supports:** dr_001_prevent_information_manipulation, dr_002_prevent_information_poaching, dp_001_manipulation_resistant_private_storage_with_integrity_proof, dp_002_nonreversible_reliable_independent_computation, dp_003_joint_approval_for_computation_mechanism_changes  
**Source:** main article, Figure 1  
**PDF page:** 9  
**Article page:** 1572  
**Evidence type:** figure-paraphrase  
**Confidence:** high

Figure 1 maps the two design requirements to three design-principle areas: data storage, data processing, and system governance.

## ev_009_figure2_architecture

**Supports:** artifact_001_hyperledger_fabric_two_sided_opportunism_solution, df_001_private_data_collection_as_provider_only_sensitive_data_store, df_002_public_hash_integrity_proof, df_003_smart_contract_stress_factor_computation, df_005_joint_governance_policy  
**Source:** main article, Figure 2  
**PDF page:** 9  
**Article page:** 1572  
**Evidence type:** figure-paraphrase  
**Confidence:** high

Figure 2 shows the system architecture with the information provider, information recipient, proof of integrity, shared information, sensitive data, DP1/DP2 mechanisms, and a jointly governed system corresponding to DP3.

## ev_010_instantiation_context_machine_tool_leasing

**Supports:** artifact_001_hyperledger_fabric_two_sided_opportunism_solution  
**Source:** main article, Section 4.2  
**PDF pages:** 10-11  
**Article pages:** 1573-1574  
**Evidence type:** paraphrase  
**Confidence:** high

The artifact is instantiated in wear-based leasing contracts for machine tools, where machine tool users fear leakage of sensitive usage data and lessors need reliable machine wear information.

## ev_011_hyperledger_fabric_selection

**Supports:** artifact_001_hyperledger_fabric_two_sided_opportunism_solution, df_006_confidential_stress_channel, df_007_peer_and_orderer_network_structure  
**Source:** main article, Section 4.3  
**PDF page:** 11  
**Article page:** 1574  
**Evidence type:** paraphrase  
**Confidence:** high

The authors chose Hyperledger Fabric 2.0 because of its confidentiality features and set up peer nodes, orderer nodes, and a StressChannel between machine tool user and lessor.

## ev_012_private_data_collection_implementation

**Supports:** df_001_private_data_collection_as_provider_only_sensitive_data_store, df_002_public_hash_integrity_proof  
**Source:** main article, Section 4.3 and Table 3  
**PDF pages:** 11-12  
**Article pages:** 1574-1575  
**Evidence type:** paraphrase  
**Confidence:** high

The private data collection is restricted to the information provider and smart contract; it prevents lessor access to sensor data while providing a hash-based proof of integrity.

## ev_013_smart_contract_implementation

**Supports:** df_003_smart_contract_stress_factor_computation, df_004_nonreversible_aggregation_function  
**Source:** main article, Section 4.3 and Table 3  
**PDF pages:** 11-12  
**Article pages:** 1574-1575  
**Evidence type:** paraphrase  
**Confidence:** high

The smart contract computes a stress factor from confidential sensor data and stores the calculated factor on the shared ledger so it is available to both parties.

## ev_014_joint_governance_implementation

**Supports:** df_005_joint_governance_policy  
**Source:** main article, Section 4.3 and Table 3  
**PDF page:** 12  
**Article page:** 1575  
**Evidence type:** paraphrase  
**Confidence:** high

Hyperledger Fabric policies require approval from both parties for changes to the private data collection definition or the smart contract logic.

## ev_015_figure3_artifact

**Supports:** artifact_001_hyperledger_fabric_two_sided_opportunism_solution, df_006_confidential_stress_channel, df_007_peer_and_orderer_network_structure  
**Source:** main article, Figure 3  
**PDF page:** 12  
**Article page:** 1575  
**Evidence type:** figure-paraphrase  
**Confidence:** high

Figure 3 depicts the artifact: a Hyperledger Fabric system, confidential StressChannel, machine tool user and lessor networks, sensor device, peers, orderers, sensor data private collection, hash, and stress factor.

## ev_016_demonstration_interviews

**Supports:** eval_001_demonstration_interviews  
**Source:** main article, Section 5 and Table 4  
**PDF pages:** 12-14  
**Article pages:** 1575-1577  
**Evidence type:** paraphrase  
**Confidence:** high

The demonstration uses 22 expert interviews with consortium members, external domain experts, and blockchain experts to evaluate whether the prototype addresses poaching, manipulation, and technological validity.

## ev_017_dp1_demonstration_results

**Supports:** dp_001_manipulation_resistant_private_storage_with_integrity_proof, df_001_private_data_collection_as_provider_only_sensitive_data_store, df_002_public_hash_integrity_proof  
**Source:** main article, Section 5  
**PDF pages:** 12-13  
**Article pages:** 1575-1576  
**Evidence type:** paraphrase  
**Confidence:** high

Machine tool users valued reduced unwanted analysis and data leakage, while lessors and manufacturers valued the proof of integrity and auditability of hash-based change detection.

## ev_018_dp2_demonstration_results

**Supports:** dp_002_nonreversible_reliable_independent_computation, df_003_smart_contract_stress_factor_computation, df_004_nonreversible_aggregation_function  
**Source:** main article, Section 5  
**PDF pages:** 13-14  
**Article pages:** 1576-1577  
**Evidence type:** paraphrase  
**Confidence:** high

Interviewees viewed the predefined aggregation into a stress factor as protecting sensitive sensor data while giving lessors a reliable value for lease-rate calculation.

## ev_019_dp3_demonstration_results

**Supports:** dp_003_joint_approval_for_computation_mechanism_changes, df_005_joint_governance_policy  
**Source:** main article, Section 5  
**PDF page:** 14  
**Article page:** 1577  
**Evidence type:** paraphrase  
**Confidence:** high

Interviewees valued distributed control over the information exchange; blockchain experts confirmed that smart contract initialization and changes required approval from both parties.

## ev_020_survey_evaluation_design

**Supports:** eval_002_vignette_survey  
**Source:** main article, Section 6  
**PDF pages:** 14-16  
**Article pages:** 1577-1579  
**Evidence type:** paraphrase  
**Confidence:** high

The authors conducted a vignette-based survey with machine tool users and lessors to evaluate whether access to the system changes sharing and reliance intentions.

## ev_021_survey_results

**Supports:** eval_002_vignette_survey, ok_001_two_sided_opportunism_problem  
**Source:** main article, Section 6.4, Tables 7 and 8  
**PDF pages:** 17-18  
**Article pages:** 1580-1581  
**Evidence type:** paraphrase  
**Confidence:** high

The survey finds that the system increases machine tool users' willingness to share both low- and high-sensitivity data and increases lessors' willingness to rely on provided information.

## ev_022_contribution_design_blueprint

**Supports:** ok_002_design_blueprint_for_confidential_reliable_information_sharing  
**Source:** main article, Section 7.1  
**PDF pages:** 18-19  
**Article pages:** 1581-1582  
**Evidence type:** paraphrase  
**Confidence:** high

The discussion states that the design principles constitute a generic approach to solving the two-sided opportunism problem and go beyond existing organizational and technical measures.

## ev_023_contribution_blockchain_recombination

**Supports:** ok_003_blockchain_recombination_contribution  
**Source:** main article, Section 7.1  
**PDF page:** 19  
**Article page:** 1582  
**Evidence type:** paraphrase  
**Confidence:** high

The paper presents the technological contribution as a recombination of private data collections, smart contracts, and joint governance to achieve confidentiality and verifiability at the same time.

## ev_024_limitations

**Supports:** lim_001_best_when_both_sides_fear_opportunism, lim_002_nonreversible_function_definition_cost, lim_003_blockchain_network_integrity_dependency, lim_004_first_mile_problem, lim_005_artificial_utility_evaluation  
**Source:** main article, Section 7.2  
**PDF pages:** 20-21  
**Article pages:** 1583-1584  
**Evidence type:** paraphrase  
**Confidence:** high

The paper states boundary conditions: the solution is most effective when both parties fear opportunism; functions can be costly to define; blockchain integrity matters; the first-mile problem remains; and the utility evaluation is artificial.

## ev_025_online_appendix_mitigation_strategies

**Supports:** kt_002_information_poaching_and_information_manipulation_literature  
**Source:** online supplemental material, Appendix A  
**Supplement pages:** 1-6  
**Evidence type:** paraphrase  
**Confidence:** medium-high

The online appendix reviews opportunism mitigation strategies, including contractual governance, relational governance, third parties, and technological solutions, and explains why blockchain work has mostly focused on information manipulation rather than poaching.

## ev_026_online_appendix_blockchain_mechanisms

**Supports:** kt_003_blockchain_governance_and_smart_contracts, df_001_private_data_collection_as_provider_only_sensitive_data_store  
**Source:** online supplemental material, Appendix B  
**Supplement pages:** 6-7  
**Evidence type:** paraphrase  
**Confidence:** medium-high

The online appendix compares blockchain confidentiality mechanisms and identifies private data collections as providing fine-grained access to channel data and enabling smart contract processing of confidential data.
