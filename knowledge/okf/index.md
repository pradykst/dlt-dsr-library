---
okf_version: "0.1"
---

# Blockchain Design Knowledge Library

An Open Knowledge Format (OKF) bundle capturing the design knowledge of 34 Design Science Research papers on blockchain-based information systems. The library represents each paper as a concept and each piece of prescriptive design knowledge (design principle, requirement, meta-requirement, objective, or goal) as an atomic, cross-linked concept.

**Contents:** 34 papers and 205 design-knowledge concepts (42 design feature(s), 3 design goal(s), 20 design objective(s), 115 design principle(s), 15 design requirement(s), 10 meta-requirement(s)).

This is the **DSR-grid edition** of the bundle: every paper concept additionally carries a six-dimension [DSR grid](about-the-dsr-grid.md) (vom Brocke & Maedche, 2019) describing its problem, input knowledge, research process, key concepts, solution and output knowledge in a standardized, comparable form.

## Sections

* [About design knowledge](about-design-knowledge.md) - what design knowledge is and how the five concept types in this bundle relate. Start here if you are new to Design Science Research.
* [About the DSR grid](about-the-dsr-grid.md) - the six-dimension framework (vom Brocke & Maedche, 2019) used to describe each paper in a standardized, comparable way.
* [Papers](papers/index.md) - one concept per source paper, grouped by application domain.
* [Design knowledge](design-knowledge/index.md) - atomic design principles, requirements, meta-requirements, objectives, goals and design features, grouped by source paper.

## How this bundle is organized

Every non-index Markdown file is an OKF concept document with YAML frontmatter carrying a `type` field. Paper concepts (`type: paper`) link forward to the design-knowledge concepts they contribute; design-knowledge concepts link back to their source paper and, where applicable, to the requirements they address. Consumers can compute "cited by" backlinks from these forward links. Provenance to the original PDF is recorded in each concept's `resource` field and Citations section.
