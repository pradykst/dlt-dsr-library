# OKF Bundle: And No One Gets the Short End of the Stick

This folder contains a DSR-OKF profile for:

Bossler, L. F., Buchwald, A., & Spohrer, K. (2025). *And No One Gets the Short End of the Stick: A Blockchain-Based Approach to Solving the Two-Sided Opportunism Problem in Interorganizational Information Sharing*. Information Systems Research, 36(3), 1565-1586. https://doi.org/10.1287/isre.2022.0065

## Files

- `index.md`: paper-level metadata and scope.
- `dsr.md`: extracted DSR structure: problem, requirements, principles, features, artifact, evaluation, output knowledge, limitations.
- `evidence.md`: evidence-backed support items with page references and confidence levels.
- `relations.yaml`: typed Requirement -> Principle -> Feature -> Artifact -> Evaluation relations.
- `aliases.yaml`: synonyms and query expansion terms for retrieval.
- `graph.json`: lightweight graph representation for UI rendering.

## Review notes

- The extraction distinguishes **design requirements** from **design principles**. The paper explicitly defines two DRs and three DPs.
- The paper does not present a long DR -> DP -> DF table like the SDPS paper. Design features here are inferred from the artifact instantiation and Table 3 implementation details.
- `source-to-sink protection` is intentionally not stored as a design principle because the paper states it became a boundary condition, not a design principle.
- Evidence is mostly paraphrased to keep the repository clean and reviewable.
