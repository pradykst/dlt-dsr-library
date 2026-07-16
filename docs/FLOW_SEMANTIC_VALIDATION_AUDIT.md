# OKF Flow Semantic Validation Audit

**Audit date:** 2026-07-15  
**Schema:** `okf-dsr-v1`  
**Presentation:** `workbench-v1`  
**Status:** structural validation passed; semantic source mappings remain unreviewed

## Scope and decision

This audit compares each stored OKF graph with three sources where available:

1. exact canonical concepts and relations;
2. the archived static Workbench graph in `data/knowledge-base.ts` through explicit aliases only;
3. the source paper figure or table recorded in `graph.json.source_reference`.

Legacy data is comparison-only. It did not add, delete, reverse, or repair any canonical graph edge. A PDF figure location is provenance, not proof that every mapped node and relation has been semantically reviewed. All nine source references therefore remain `unreviewed`.

The deterministic validator reports **9 papers, 0 structural errors, 23 warnings**. Recommended Flow, Pathway Matrix, and Full Relations use exact stored `graph.json` or `relations.yaml` relations. Source Figure is a separate, stricter projection available only when a structurally valid `source_views` entry exists. No invented edge was found.

## Current presentation contract

- **Source Figure** projects exactly the stored source-view nodes, relations, layer order, and within-layer order. It never substitutes a recommended path and never claims semantic review merely because structural validation passes.
- **Recommended Flow** is a compact recommended stored pathway. It uses stored `recommended_paths` when available and otherwise a deterministic stored-relations projection.
- **Full Relations / Advanced** contains all canonical stored relations in scope.
- Workbench and chatbot share the same immutable projector. A deterministic ELK layered layout provides stable positions and crossing minimization; ordinary relations use direct border-to-border straight edges, with only minimal overlap-avoidance routing where necessary.
- Three current papers have complete curated Source Figure mappings; six retain Recommended Flow and Full Relations while awaiting manual source transcription. Every current source view remains semantically `unreviewed`.

## Per-paper comparison

`Legacy graph` counts only legacy flow node types that can map to the seven-layer model; its edge count includes all paper-scoped static edges. `Exact matches` require an exact canonical ID or an explicit term in `aliases.yaml`. Fuzzy matching is deliberately excluded.

| Paper | Legacy graph | Current stored graph | Exact legacy matches | Unresolved aliases | Canonical edge differences among mapped nodes | Stored flow source | Paper source reference | Structural result | Manual semantic review |
|---|---:|---:|---:|---:|---:|---|---|---|---|
| Blockchain IoT | 15 nodes / 16 edges | 23 nodes / 32 edges | 2 nodes / 0 edges | 13 | 0 missing, 0 predicate, 0 extra | `graph_json` | Figure 3, p. 13, ?Design Requirements, Principles, and Features? | Pass | Required |
| HIE consent | 18 / 21 | 33 / 53 | 2 / 0 | 16 | 0 / 0 / 0 | `graph_json` | Figure 3, p. 8, ?Design requirements, principles, and features? | Pass | Required |
| Integrated ISDM | Not mapped | 67 / 105 | Not available | Not available | Not available | `okf_relations_fallback` | Figure 2, p. 7, framework backbone and method fragments | Pass | Required; choose a reviewer main path |
| Newsvendor | Not mapped | 34 / 51 | Not available | Not available | Not available | `graph_json` | Figure 3, p. 8, ?Graphical description of the proposed solution? | Pass | Required |
| NIL marketplace | 13 / 14 | 31 / 60 | 1 / 0 | 11, plus 1 ambiguous | 0 / 0 / 0 | `okf_relations_fallback` | Figure 1, p. 5, DR/DP/DF relationships | Pass | Required; choose a reviewer main path |
| Peer-review token | 13 / 15 | 37 / 68 | 0 / 0 | 13 | 0 / 0 / 0 | `okf_relations_fallback` | Figure 2, p. 6, relationships between principles and features | Pass | Required; choose a reviewer main path |
| Short End | 12 / 12 | 17 / 23 | 2 / 1 | 10 | 0 / 0 / 0 | `graph_json` | Figures 1 and 2, p. 9, principles and system architecture | Pass | Required |
| SSI KYC | 9 / 10 | 41 / 85 | 1 / 0 | 8 | 0 / 0 / 0 | `graph_json` | Figure 4, p. 8, SSI-based KYC architecture | Pass | Required; confirm architecture-to-DSR mapping |
| Trust capacity | 8 / 8 | 55 / 95 | 0 / 0 | 8 | 0 / 0 / 0 | `okf_relations_fallback` | Figures 3 (p. 5) and 6 (p. 8), requirements/principles and features | Pass | Required; choose a reviewer main path |

## What the comparison establishes

- Every `graph.json` node ID exists in `dsr.md` with the same canonical type and title.
- Every graph edge ID exists in `relations.yaml` with the same source, target, and predicate.
- Every recommended-path step has an exact directed stored edge.
- Every Source Figure step is validated separately against its stored `source_views` node and relation inventory.
- The Pathway Matrix R-to-P-to-F view contains only real stored graph/relation edges.
- Workbench projection introduced no additional relation.
- The legacy comparison found no missing canonical edge or predicate mismatch between the small set of deterministically mapped legacy nodes.
- Low legacy match counts are alias-coverage warnings, not evidence that the canonical graph is wrong. They require manual review rather than automatic rewriting.

## Source-reference findings

| Paper ID | Type | Label / page | Validation status | Note |
|---|---|---|---|---|
| `BLOCKCHAIN_IOT_SDPS_2019` | paper figure | Figure 3 / 13 | unreviewed | Source caption identifies the DSR requirement-principle-feature figure. |
| `HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023` | paper figure | Figure 3 / 8 | unreviewed | Source caption identifies requirements, principles, and features. |
| `INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024` | paper figure | Figure 2 / 7 | unreviewed | Framework figure located; no reviewer-selected recommended path is stored. |
| `NEWSVENDOR_FORECASTING_SMART_CONTRACT_2021` | paper figure | Figure 3 / 8 | unreviewed | Proposed-solution figure located. |
| `NIL_NFT_MARKETPLACE_2026` | paper figure | Figure 1 / 5 | unreviewed | DR/DP/DF figure located; no reviewer-selected recommended path is stored. |
| `PEER_REVIEW_TOKEN_INCENTIVES_2025` | paper figure | Figure 2 / 6 | unreviewed | Principle-feature figure located; no reviewer-selected recommended path is stored. |
| `SHORT_END_STICK_2025` | paper figures | Figures 1 and 2 / 9 | unreviewed | Principle summary and architecture figures are recorded together. |
| `SSI_KYC_FRAMEWORK_2022` | paper figure | Figure 4 / 8 | unreviewed | Architecture figure located; semantic projection needs explicit review. |
| `TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024` | paper figures | Figures 3 and 6 / 5 and 8 | unreviewed | Requirements/principles and feature sources span two figures. |

## Manual-review queue

1. Review each curated Source Figure against the paper and keep it separate from Recommended Flow and record reviewer identity and date.
2. Select concise `recommended_paths` for Integrated ISDM, NIL, Peer Review Token, and Trust Capacity if the paper supports a defensible main path.
3. Resolve or deliberately document legacy aliases. Do not create an alias merely to increase match counts.
4. Confirm the SSI KYC architecture-to-DSR projection and the two-figure Trust Capacity projection.
5. Elevate a source reference to `internally_validated` only with compatible `reviewed_by` and `reviewed_at` metadata. Use `author_verified` only after verified author checking.

## Reproducibility

Run:

```powershell
node --experimental-strip-types scripts/validate-okf-flows.ts
node --experimental-strip-types scripts/validate-okf-flows.ts --write
```

The full ID-level match, unresolved-alias, recommended-path, and issue details are in `docs/FLOW_VALIDATION_REPORT.md`.
