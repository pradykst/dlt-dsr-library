# OKF Flow Semantic Validation Audit

**Audit date:** 2026-07-16
**Schema:** `okf-dsr-v1`
**Presentation:** `workbench-v1`
**Status:** structural validation passed; every source mapping remains semantically unreviewed

## Scope and decision

This audit compares each stored OKF graph with the canonical concepts and relations, explicit legacy aliases where comparison data exists, and every candidate source figure or table identified during complete PDF inspection. Legacy data is comparison-only. It did not create, delete, reverse, or repair a canonical edge.

The deterministic validators report **9 papers, 0 structural errors, and 19 non-blocking legacy/manual-review warnings**. Runtime bundles contain **8 exact source views across 6 papers**, **21 explicit stored recommended paths**, and Full Relations for every paper. Source-view validation also checks the TEMPLATE view, producing 9 structurally valid projections in the schema-level report. No projector or Workbench component introduces an edge.

## Current presentation contract

- **Source Figure** is available only for an exact `graph.json.source_views` record. It projects precisely the stored nodes, edge IDs, layer order, and within-layer order.
- **Recommended Flow** is a compact stored projection selected from `graph.json.recommended_paths`. It is not described as a paper figure.
- **Full Relations / Advanced** exposes all canonical stored relations for the paper.
- Workbench and chatbot use the same generic immutable projector and deterministic layout.
- Structural success does not imply semantic review. All eight runtime source views remain `unreviewed`.

## Nine-paper outcome

| Paper | Exact source-view outcome | Runtime views | Recommended paths | Full relations | Structural result | Semantic status |
|---|---|---:|---:|---:|---|---|
| Blockchain IoT | A - Figure 3, complete R-P-F mapping | 1 | 3 | 32 | Pass | unreviewed |
| HIE consent | A - Figure 3, complete R-P-F mapping | 1 | 1 | 53 | Pass | unreviewed |
| Integrated ISDM | B - multi-axis lifecycle/role/model framework cannot be represented exactly by the current canonical layer contract | 0 | 3 | 105 | Pass | unreviewed |
| Newsvendor | B - formal figures are actor-message/process diagrams whose complete node and edge inventories are not canonical DSR concepts/relations | 0 | 1 | 51 | Pass | unreviewed |
| NIL marketplace | A - Figure 1, complete R-P-F mapping | 1 | 2 | 62 | Pass | unreviewed |
| Peer-review token | A - Figure 2, complete P-F mapping | 1 | 4 | 68 | Pass | unreviewed |
| Short End | A - Figure 1 R-P and Table 3 P-F mappings | 2 | 3 | 26 | Pass | unreviewed |
| SSI KYC | B - architecture and UML figures require actors, agents, lifelines, and messages absent from the canonical DSR graph | 0 | 1 | 85 | Pass | unreviewed |
| Trust capacity | A - Figure 3 R-P and Figure 6 P-F mappings | 2 | 3 | 95 | Pass | unreviewed |

Detailed candidate inventories, ordered node IDs, exact edge IDs, captions, pages, and Outcome B reasoning are recorded in `docs/OKF_SOURCE_VIEW_AUDIT.md`.

## Structural and provenance findings

- Every `graph.json` node ID exists in `dsr.md`.
- Every graph and source-view edge ID exists in `relations.yaml` with identical source, target, and predicate.
- Every recommended-path segment has an exact directed stored edge.
- Source-view endpoints are included in their stored node inventories; no inferred or query-generated edge appears.
- Repeated projections are byte-for-byte deterministic and pass layout validation without overlaps.
- The focused R-P-F matrix uses only stored graph/relation edges.
- Full Relations is available for all nine papers.
- This pass adds no concept, relation, graph node, or graph edge. It adds one Trust Figure 3 evidence record and points the 31 matching stored relations to it.
- Sixty-nine existing relations were corrected from `inferred` to `explicit-in-artifact`: HIE 13, Short End 11, Trust Capacity 45. Endpoints and predicates were unchanged.
- Low legacy matches and unresolved aliases remain warnings; they are not automatically promoted into canonical mappings.

## Source-reference decisions

| Paper | Candidate formal source | Exact mode decision |
|---|---|---|
| Blockchain IoT | Figure 3, PDF p. 13 | Exact Source Figure available |
| HIE consent | Figure 3, PDF p. 8 | Exact Source Figure available |
| Integrated ISDM | Figure 2, PDF p. 7; Appendix A | Source Figure unavailable; preserve multi-axis semantics for later schema/reviewer decision |
| Newsvendor | Figures 1 and 3; Requirements 1-4 | Source Figure unavailable; actor-message inventory is outside current canonical concepts |
| NIL marketplace | Figure 1, PDF p. 5 | Exact Source Figure available |
| Peer-review token | Figure 2, PDF p. 6 | Exact Source Figure available |
| Short End | Figure 1 and Table 3 | Two exact Source Figure views available |
| SSI KYC | Figures 3-5 and UML sequence views | Source Figure unavailable; complete architecture/lifeline inventory is not canonical |
| Trust capacity | Figures 3 and 6 | Two exact Source Figure views available |

## Manual-review queue

1. Independently compare the eight stored views with their cited source figures/tables, then record reviewer identity and timestamp before elevating status.
2. Obtain author/expert decisions before extending the canonical schema for actor-message diagrams, UML lifelines, or multi-axis lifecycle/role/model frameworks.
3. Resolve legacy aliases only when exact equivalence is established; do not add aliases to increase match counts.
4. Keep Outcome B papers honest: Recommended Flow and Full Relations remain available, but neither should be presented as an exact paper figure.

## Reproducibility

`npm run okf:validate:source-views`, `npm run okf:audit:source-views`, and `node --experimental-strip-types scripts/validate-okf-flows.ts --write` reproduce the structural reports. Full ID-level details are in `docs/OKF_SOURCE_VIEW_AUDIT.md`, `docs/OKF_SOURCE_VIEW_VALIDATION_REPORT.md`, and `docs/FLOW_VALIDATION_REPORT.md`.
