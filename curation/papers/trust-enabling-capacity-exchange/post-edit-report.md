# Post-edit report: trust-enabling-capacity-exchange

## Verified source

Nick Grosse, Frederik Moeller, Thorsten Schoormann, Michael Henke. "Designing trust-enabling blockchain systems for the inter-organizational exchange of capacity." Decision Support Systems 179 (2024) 114182. Source PDF: `designing trust enabling blockchain systems.pdf`, read in full.

## Final concept inventory

- 19 meta-requirements from Fig. 3.
- 6 design principles from Table 2.
- 14 design features from Fig. 6.
- 39 concepts total.

## Corrected Fig. 3 relationship determination

Section 4.1 explicitly says, "The meta-requirements relate to one or more design principles." Fig. 3 contains 45 vector connectors from individual MR rows to five cooperation-design targets. Direct extraction of their source and target coordinates makes the crossings traceable.

Four targets each identify a single principle: Authority and fairness (DP3), Incentive mechanism (DP4), Screening (DP5), and Reputation mechanism (DP6). The fifth target, Signaling, explicitly contains both DP1 and DP2; each of its eight incoming connectors is therefore expanded to both member principles in the canonical graph. This deterministic group expansion turns 45 source connectors into 53 MR-to-DP semantic edges.

No mapping was inferred from numbering, row order, thematic similarity, or visual proximity. The mappings come from the actual PDF connector endpoints and the target-box membership printed in Fig. 3.

## Final relationship inventory

- 53 `Addresses` edges from Fig. 3.
- 14 `Implements` edges from Fig. 6.
- 67 canonical semantic relationships total.

The prior conclusion that all Fig. 3 mappings were too ambiguous is superseded by this report.
