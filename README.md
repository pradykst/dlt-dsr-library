# DLT Design Science Knowledge Library

A polished Next.js research demo for visually organizing design-science knowledge in blockchain and DLT systems. The app traces how problem contexts motivate requirements, which are satisfied by design principles, implemented through features, instantiated in artifacts, evaluated through research methods, and generalized into reusable patterns.

## What the App Does

- Presents a high-level corpus overview for selected DLT design-science papers.
- Provides an interactive React Flow graph for exploring papers, problems, requirements, principles, features, artifacts, evaluations, capabilities, and patterns.
- Shows a reusable pattern library with evidence links back to source papers.
- Provides a paper lens route for every seeded paper at `/papers/[id]`.
- Includes a deterministic, rule-based flow builder for composing design paths from selected goals.
- Visualizes corpus coverage with a capability heatmap and design-science flow with a Sankey/alluvial view.

## Run Locally

```bash
npm install
npm run dev
```

For checks:

```bash
npm run lint
npm run build
```

## Main Routes

- `/` - home page with corpus stats, problem clusters, flow preview, sankey, heatmap, and featured patterns
- `/explore` - interactive knowledge graph with filters and detail panel
- `/patterns` - reusable DLT design pattern library
- `/papers/[id]` - synthesized design-science chain for one paper
- `/flow-builder` - rule-based design path generator
- `/methodology` - explanation of the library schema and V1 scope

## Data Model

The app is local-only. All seeded content lives in `data/knowledge-base.ts`, with strong shared types in `lib/types.ts`.

Core objects:

- `KnowledgeNode` for papers, problems, requirements, principles, features, artifacts, evaluations, capabilities, and patterns
- `KnowledgeEdge` for typed relationships such as `addresses`, `motivates`, `satisfies`, `implements`, `instantiated_in`, `evaluated_by`, `observed_in`, and `supports`
- `Paper` for bibliographic metadata and contribution summaries
- `Pattern` for reusable design abstractions
- `DesignGoal` for the rule-based flow builder

## Add a New Paper

1. Add a `Paper` object to `papers`.
2. Add a paper node implicitly by following the existing paper data shape.
3. Add problem, requirement, principle, feature, artifact, evaluation, and pattern nodes as needed.
4. Add `KnowledgeEdge` relationships that connect the new paper into the design-science chain.
5. Add capability coverage entries if the paper uses identifiable DLT mechanisms.

## Add a New Pattern

1. Add a `Pattern` object to `patterns`.
2. Link it to source papers with `observedInPaperIds`.
3. Link it to DLT capabilities with `relatedCapabilityIds`.
4. Add `observed_in` graph edges from the pattern to relevant papers.
5. Optionally connect related features to capabilities with `supports` edges.

## Known Limitations of V1

- The corpus is a concise seeded abstraction, not an exhaustive literature database.
- The flow builder is deterministic and rule-based; it does not infer beyond seeded relationships.
- Graph layout uses a simple type-column layout rather than a full academic ontology layout engine.
- No backend, authentication, database, import workflow, or citation manager integration is included.
- Evidence labels are synthesized from papers and should be reviewed before scholarly publication.
