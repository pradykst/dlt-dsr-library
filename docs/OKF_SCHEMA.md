# OKF DSR Canonical Schema

## Status

`okf-dsr-v1` is the frozen machine-readable schema for the DSR library. New paper bundles must validate against this version before they are indexed or used by the Workbench or chatbot.

OKF files in Git are canonical. Supabase is a runtime index and must not be edited as the source of truth. Accepted corrections require an OKF Git change followed by re-indexing.

Human-readable prose may use domain terminology freely. Machine-readable fields, keys, types, statuses, IDs, and graph references must use the exact values defined below.

## Required bundle structure

Every paper has exactly this structure:

```text
library/okf/papers/<slug>/
  README.md
  index.md
  presentation.yaml
  dsr.md
  evidence.md
  relations.yaml
  aliases.yaml
  graph.json
```

No additional files are allowed inside a canonical paper bundle. Supporting source PDFs remain outside the bundle and are referenced by filename in `index.md` and evidence source locations.

The reusable bundle at `library/okf/TEMPLATE/` is validated by the same source validator but is deliberately outside `papers/`, so it is never parsed or indexed as a real paper. Copy it into `papers/<slug>/`, rename its identifiers, and replace every placeholder before adding a paper.

## Exact key registry

Unknown keys and missing keys fail validation. Key names are case-sensitive.

| File or record | Exact machine-readable keys |
|---|---|
| `README.md` | No machine-readable block; human instructions and bundle summary only |
| `index.md` frontmatter | `schema_version`, `type`, `paper_id`, `slug`, `title`, `short_title`, `authors`, `year`, `venue`, `doi`, `doi_url`, `source_url`, `source_pdf_filename`, `domain_context`, `abstract`, `research_problem`, `research_objective`, `research_questions`, `artifact_type`, `blockchain_dlt_role`, `methodology`, `theoretical_foundations`, `evaluation_method`, `key_contributions`, `design_knowledge_output`, `limitations`, `notes`, `extraction_status`, `review_status`, `author_check_status`, `reviewed_by`, `reviewed_at` |
| `presentation.yaml` | `presentation_version`, `paper_id`, `card`, `overview`, `dsr_summary_grid`, `additional_context`, `provenance`; nested exact keys are defined below |
| `dsr.md` frontmatter | `schema_version`, `type`, `paper_id`, `extraction_status`, `review_status` |
| Concept object | `id`, `type`, `title`, `description`, `evidence`, `confidence`, `extraction_type`, `review_status` |
| `evidence.md` frontmatter | `schema_version`, `type`, `paper_id`, `extraction_status`, `review_status` |
| Evidence object | `id`, `supports`, `source_location`, `quote_or_summary`, `evidence_type` |
| `relations.yaml` document | `schema_version`, `paper_id`, `relations` |
| Relation object | `id`, `source`, `target`, `predicate`, `evidence`, `confidence`, `extraction_type` |
| `aliases.yaml` document | `schema_version`, `paper_id`, `aliases` |
| Alias object | `target_id`, `terms` |
| `graph.json` document | `schema_version`, `paper_id`, `title`, optional `source_reference`, optional `source_views`, `nodes`, `edges`, `recommended_paths` |
| Graph node | `id`, `type`, `title` |
| Graph edge | `id`, `source`, `target`, `predicate` |
| Graph source reference | `type`, `label`, `page`, `caption`, `validation_status`, `validation_notes` |

## Normative field types and nullability

The following tables are normative. `T | null` means the key is still required but its value may be YAML/JSON `null`. `T[]` means an array whose items all have type `T`; whether it may be empty is stated explicitly. Literal values and enum values are case-sensitive.

`README.md` has no machine-readable fields. It is a required human-readable Markdown file only.

### `index.md` frontmatter

| Key | Exact type | Nullability and constraints |
|---|---|---|
| `schema_version` | literal string `okf-dsr-v1` | Required; never null |
| `type` | literal string `Paper` | Required; never null |
| `paper_id` | nonempty string | Required; stable canonical uppercase identifier |
| `slug` | nonempty string | Required; exactly matches the bundle directory name |
| `title` | nonempty string | Required |
| `short_title` | string \| null | Required key; null when unavailable |
| `authors` | string[] | Required, nonempty; every item is nonempty |
| `year` | positive integer | Required |
| `venue` | string \| null | Required key; null when unavailable |
| `doi` | raw DOI string \| null | Required key; never store a DOI URL here |
| `doi_url` | string \| null | Required key; when `doi` exists, exactly `https://doi.org/<doi>` |
| `source_url` | string \| null | Required key; null when unavailable |
| `source_pdf_filename` | string \| null | Required key; canonical source-PDF filename field |
| `domain_context` | string \| null | Required key; canonical paper domain/context field |
| `abstract` | string \| null | Required key; null when unavailable |
| `research_problem` | string[] | Required; may be empty |
| `research_objective` | string[] | Required; may be empty; metadata only |
| `research_questions` | string[] | Required; may be empty; metadata only |
| `artifact_type` | string \| null | Required key; null when unavailable |
| `blockchain_dlt_role` | string \| null | Required key; null when unavailable |
| `methodology` | string \| null | Required key; null when unavailable |
| `theoretical_foundations` | string[] | Required; may be empty; metadata only |
| `evaluation_method` | string[] | Required; may be empty |
| `key_contributions` | string[] | Required; may be empty |
| `design_knowledge_output` | string[] | Required; may be empty |
| `limitations` | string[] | Required; may be empty; metadata only |
| `notes` | string \| null | Required key; null when unavailable |
| `extraction_status` | literal string `okf_draft` | Canonical Git bundle value; runtime projections use `indexed_from_canonical_okf` |
| `review_status` | `unreviewed` \| `internally_reviewed` \| `author_verified` | Required |
| `author_check_status` | `not_requested` \| `requested` \| `verified` \| `disputed` | Required |
| `reviewed_by` | string \| null | Required key; nonempty for elevated review status |
| `reviewed_at` | string \| null | Required key; nonempty for elevated review status |

`source_pdf_filename` is the sole canonical source-PDF machine field; `source_pdf`, `source_pdf_path`, and similar synonyms are not allowed in frontmatter. `domain_context` is the sole canonical domain/context machine field; `domain`, `context`, and `domain/context` are prose labels only and are not permitted keys. Contextual links that are not part of the canonical graph are preserved in the human-readable `index.md` body or the documented presentation context, not in an undeclared `contextual_links` machine key.

### `presentation.yaml`

| Path | Exact type | Nullability and constraints |
|---|---|---|
| `presentation_version` | literal string `workbench-v1` | Required; never null |
| `paper_id` | nonempty string | Required; equals `index.md.paper_id` |
| `card` | object | Required; exact nested keys only |
| `card.domain_label` | nonempty string | Required |
| `card.artifact_summary` | string \| null | Required key; null when genuinely unavailable |
| `card.dlt_role` | string \| null | Required key; null when genuinely unavailable |
| `overview` | object | Required; exact nested keys only |
| `overview.abstract_summary` | string \| null | Required key |
| `overview.research_problem` | nonempty string | Required |
| `overview.research_objective` | string \| null | Required key |
| `overview.methodology` | string \| null | Required key |
| `overview.evaluation_method` | string[] | Required; each item nonempty; an empty array requires its own field-specific migration note |
| `overview.key_contributions` | string[] | Required; each item nonempty; an empty array requires its own field-specific migration note |
| `overview.design_knowledge_output` | string[] | Required; each item nonempty; an empty array requires its own field-specific migration note |
| `dsr_summary_grid` | object | Required; exact nested keys only |
| `dsr_summary_grid.problem` | nonempty string | Required |
| `dsr_summary_grid.input_knowledge` | nonempty string | Required |
| `dsr_summary_grid.research_process` | nonempty string | Required |
| `dsr_summary_grid.key_concepts` | nonempty string[] | Required; at least one item |
| `dsr_summary_grid.solution` | nonempty string | Required |
| `dsr_summary_grid.output_knowledge` | nonempty string | Required |
| `additional_context` | object | Required; exact nested keys only |
| `additional_context.summary` | nonempty string | Required |
| `additional_context.limitations` | string[] | Required; each item nonempty; an empty array requires its own field-specific migration note |
| `provenance` | object | Required; exact nested keys only |
| `provenance.migrated_from_legacy_csv` | boolean | Required |
| `provenance.source_fields` | object map of field-path to nonempty source string | Required; keys must be approved presentation field paths |
| `provenance.migration_notes` | string[] | Required; may be empty unless a source-dependent array is empty |

For an empty source-dependent array, a migration note must begin with that array's exact field path followed by a colon, for example `overview.evaluation_method: the source records no evaluation method.` One general or unrelated note cannot justify multiple missing fields.

### `dsr.md`

| Record | Key | Exact type | Nullability and constraints |
|---|---|---|---|
| Frontmatter | `schema_version` | literal string `okf-dsr-v1` | Required |
| Frontmatter | `type` | literal string `ConceptCollection` | Required |
| Frontmatter | `paper_id` | nonempty string | Required; equals `index.md.paper_id` |
| Frontmatter | `extraction_status` | literal string `okf_draft` | Required |
| Frontmatter | `review_status` | canonical review-status enum | Required; equals paper status |
| Concept | `id` | scoped nonempty string | Required and globally unique |
| Concept | `type` | canonical seven-value concept-type enum | Required |
| Concept | `title` | nonempty string | Required |
| Concept | `description` | nonempty string | Required |
| Concept | `evidence` | string[] | Required; may be empty; every ID must resolve in this bundle |
| Concept | `confidence` | canonical confidence enum | Required |
| Concept | `extraction_type` | canonical extraction-type enum | Required |
| Concept | `review_status` | canonical review-status enum | Required; elevated values require a covering paper review record |

### `evidence.md`

| Record | Key | Exact type | Nullability and constraints |
|---|---|---|---|
| Frontmatter | `schema_version` | literal string `okf-dsr-v1` | Required |
| Frontmatter | `type` | literal string `EvidenceCollection` | Required |
| Frontmatter | `paper_id` | nonempty string | Required; equals `index.md.paper_id` |
| Frontmatter | `extraction_status` | literal string `okf_draft` | Required |
| Frontmatter | `review_status` | canonical review-status enum | Required; equals paper status |
| Evidence | `id` | scoped nonempty string | Required and globally unique |
| Evidence | `supports` | nonempty string[] | Required; targets canonical concepts or the containing paper ID |
| Evidence | `source_location` | nonempty string | Required |
| Evidence | `quote_or_summary` | nonempty string | Required |
| Evidence | `evidence_type` | `quote` \| `paraphrase` \| `summary` | Required |

### `relations.yaml`

| Record | Key | Exact type | Nullability and constraints |
|---|---|---|---|
| Document | `schema_version` | literal string `okf-dsr-v1` | Required |
| Document | `paper_id` | nonempty string | Required; equals `index.md.paper_id` |
| Document | `relations` | relation object[] | Required; may be empty |
| Relation | `id` | scoped nonempty string | Required and globally unique |
| Relation | `source` | canonical concept ID string | Required; must resolve in this bundle |
| Relation | `target` | canonical concept ID string | Required; must resolve in this bundle |
| Relation | `predicate` | canonical predicate enum | Required; direction is significant |
| Relation | `evidence` | evidence ID string \| null | Required key; referenced ID must resolve |
| Relation | `confidence` | canonical confidence enum | Required |
| Relation | `extraction_type` | canonical extraction-type enum | Required |

### `aliases.yaml`

| Record | Key | Exact type | Nullability and constraints |
|---|---|---|---|
| Document | `schema_version` | literal string `okf-dsr-v1` | Required |
| Document | `paper_id` | nonempty string | Required; equals `index.md.paper_id` |
| Document | `aliases` | alias object[] | Required; may be empty |
| Alias | `target_id` | paper or canonical concept ID string | Required; must resolve in this bundle |
| Alias | `terms` | nonempty string[] | Required; at least one item |

### `graph.json`

| Record | Key | Exact type | Nullability and constraints |
|---|---|---|---|
| Document | `schema_version` | literal string `okf-dsr-v1` | Required |
| Document | `paper_id` | nonempty string | Required; equals `index.md.paper_id` |
| Document | `title` | nonempty string | Required |
| Document | `source_reference` | source-reference object | Optional root key; exact nested keys when present |
| Document | `nodes` | graph-node object[] | Required; may be empty |
| Document | `edges` | graph-edge object[] | Required; may be empty |
| Document | `recommended_paths` | string[][] | Required; may be empty; each path has at least two node IDs |
| Node | `id` | canonical concept ID string | Required; must resolve in `dsr.md` |
| Node | `type` | canonical seven-value concept-type enum | Required; exactly matches the concept |
| Node | `title` | nonempty string | Required; exactly matches the concept |
| Edge | `id` | canonical relation ID string | Required; must resolve in `relations.yaml` |
| Edge | `source` | declared graph-node ID string | Required; exactly matches the relation |
| Edge | `target` | declared graph-node ID string | Required; exactly matches the relation |
| Edge | `predicate` | canonical predicate enum | Required; exactly matches the relation |
| Source reference | `type` | `paper_figure` \| `paper_table` \| `okf_relations_projection` | Required when the object is present |
| Source reference | `label` | string \| null | Required key |
| Source reference | `page` | positive integer \| null | Required key |
| Source reference | `caption` | string \| null | Required key |
| Source reference | `validation_status` | `unreviewed` \| `internally_validated` \| `author_verified` | Required; elevated values require review metadata |
| Source reference | `validation_notes` | string \| null | Required key |
## `README.md` contract and example

`README.md` is human-readable only. It must not define alternate machine types, IDs, relations, or status semantics. It should identify the paper, summarize the bundle, and remind curators that Git OKF files are canonical.

```markdown
# OKF bundle: Example paper

Canonical paper ID: `EXAMPLE_2026`

This bundle contains source-grounded DSR concepts, evidence, relations, aliases,
and a stored graph. Canonical changes are made in these Git files and then indexed.
```

## Identifiers

- `paper_id` is the stable uppercase paper identifier.
- Every concept, evidence item, and relation ID is paper-scoped: `<paper_id>:<local_id>`.
- IDs are immutable after publication unless a deliberate migration is performed.
- Graph node IDs must equal canonical concept IDs.
- Graph edge IDs must equal canonical relation IDs.
- Aliases may help resolve legacy or natural-language names, but aliases never create alternate canonical IDs or types.

## Paper metadata (`index.md`)

`index.md` begins with YAML frontmatter. Values are written as JSON-compatible scalars or arrays so parsing is deterministic. The exact keys are:

```yaml
---
schema_version: "okf-dsr-v1"
type: "Paper"
paper_id: "EXAMPLE_2026"
slug: "example-2026"
title: "Example paper"
short_title: "Example"
authors: ["A. Author", "B. Author"]
year: 2026
venue: "Example Journal"
doi: "10.0000/example"
doi_url: "https://doi.org/10.0000/example"
source_url: null
source_pdf_filename: "example.pdf"
domain_context: "Example domain"
abstract: null
research_problem: ["Problem statement"]
research_objective: ["Research objective"]
research_questions: ["RQ1: Example question"]
artifact_type: "Example artifact"
blockchain_dlt_role: "Integrity commitment"
methodology: "Design science research"
theoretical_foundations: []
evaluation_method: ["Prototype evaluation"]
key_contributions: ["Contribution"]
design_knowledge_output: ["Design principles"]
limitations: []
notes: null
extraction_status: "okf_draft"
review_status: "unreviewed"
author_check_status: "not_requested"
reviewed_by: null
reviewed_at: null
---
```

Missing scalar metadata is represented as `null`; missing list metadata is represented as `[]`. Do not invent DOI, venue, method, evaluation, or contribution values. `research_objective` is paper metadata only and is not a DSR concept type. Research questions must not be copied into `research_objective`; leave the objective array empty unless an exact objective is recorded in the source metadata.

## Human presentation profile (`presentation.yaml`)

`presentation.yaml` is a second canonical layer with version `workbench-v1`. It contains researcher-facing synthesis for Workbench cards, Overview, and the default Design Summary. It does not define concept IDs, graph types, relations, evidence, confidence, or review status. Those remain authoritative in `dsr.md`, `relations.yaml`, `evidence.md`, `graph.json`, and `index.md`.

The root keys are exactly:

- `presentation_version`
- `paper_id`
- `card`
- `overview`
- `dsr_summary_grid`
- `additional_context`
- `provenance`

The nested keys are exact:

| Object | Required keys |
|---|---|
| `card` | `domain_label`, `artifact_summary`, `dlt_role` |
| `overview` | `abstract_summary`, `research_problem`, `research_objective`, `methodology`, `evaluation_method`, `key_contributions`, `design_knowledge_output` |
| `dsr_summary_grid` | `problem`, `input_knowledge`, `research_process`, `key_concepts`, `solution`, `output_knowledge` |
| `additional_context` | `summary`, `limitations` |
| `provenance` | `migrated_from_legacy_csv`, `source_fields`, `migration_notes` |

Example:

```yaml
presentation_version: workbench-v1
paper_id: EXAMPLE_2026
card:
  domain_label: Product information exchange
  artifact_summary: A verifiable product-record registry and review workflow.
  dlt_role: Anchors integrity commitments while detailed records remain off chain.
overview:
  abstract_summary: The study develops and evaluates a verifiable information-sharing artifact.
  research_problem: Participants cannot reliably detect inconsistent product records across organizational boundaries.
  research_objective: Design and evaluate a shared verification architecture.
  methodology: Design science research.
  evaluation_method:
    - Prototype demonstration and expert evaluation.
  key_contributions:
    - Design knowledge for cross-organizational record verification.
  design_knowledge_output:
    - Requirements, principles, and implementable features.
dsr_summary_grid:
  problem: Product records are fragmented and inconsistently governed.
  input_knowledge: Integrity, identity, and inter-organizational governance literature.
  research_process: Iterative design, prototype construction, and evaluation.
  key_concepts:
    - Verifiable identity and credentials.
    - Off-chain records with on-chain integrity commitments.
  solution: A governed registry, verification lifecycle, and evidence store.
  output_knowledge: Reusable design requirements, principles, and features.
additional_context:
  summary: The profile summarizes the source-grounded design contribution for reviewer use.
  limitations:
    - Evaluation was limited to the recorded study setting.
provenance:
  migrated_from_legacy_csv: false
  source_fields:
    card.domain_label: index.md#domain_context
    dsr_summary_grid.problem: paper synthesis
  migration_notes:
    - Profile created from canonical paper metadata and source-grounded synthesis.
```

Rules:

- `presentation_version` is exactly `workbench-v1`, and `paper_id` matches `index.md`.
- Unknown root or nested keys fail validation.
- `problem`, `input_knowledge`, `research_process`, `solution`, `output_knowledge`, `card.domain_label`, `overview.research_problem`, and `additional_context.summary` are nonempty.
- `key_concepts` is a nonempty string array.
- `evaluation_method`, `key_contributions`, `design_knowledge_output`, and `limitations` are arrays. An empty array is permitted only when the absence is genuine and explained by a provenance migration note.
- Optional unavailable scalar fields use YAML `null`.
- Literal placeholders such as `Not recorded`, `N/A`, `Unknown`, `TODO`, `-`, and whitespace-only strings are forbidden.
- Legacy migration is provenance, not review. The paper remains `unreviewed` until an explicit human review record exists in `index.md`.

## Canonical concept model (`dsr.md`)

The only allowed machine-readable concept types are:

1. `Problem`
2. `Design Requirement`
3. `Design Principle`
4. `Design Feature`
5. `Artifact`
6. `Evaluation`
7. `Output Knowledge`

Types such as `Requirement`, `Req`, `Objective`, `Goal`, `Mechanism`, `Solution`, `Implementation`, `Finding`, `Contribution`, `ResearchQuestion`, `KernelTheory`, and `Limitation` are not canonical concept types. They may appear in prose, paper metadata, or aliases only.

`dsr.md` has this exact collection frontmatter:

```yaml
---
schema_version: "okf-dsr-v1"
type: "ConceptCollection"
paper_id: "EXAMPLE_2026"
extraction_status: "okf_draft"
review_status: "unreviewed"
---
```

Each level-two concept section contains one `json` code block with exactly these keys:

```json
{
  "id": "EXAMPLE_2026:dr_001",
  "type": "Design Requirement",
  "title": "Protect record integrity",
  "description": "The system should make unauthorized record changes detectable.",
  "evidence": ["EXAMPLE_2026:ev_001"],
  "confidence": "high",
  "extraction_type": "explicit",
  "review_status": "unreviewed"
}
```

Prose may follow the JSON block for explanation. Prose does not add machine-readable keys, types, evidence, or relations.

## Canonical evidence model (`evidence.md`)

`evidence.md` uses collection type `EvidenceCollection` with the same `schema_version`, `paper_id`, `extraction_status`, and `review_status` keys as `dsr.md`.

Each evidence section contains one `json` block with exactly these keys:

```json
{
  "id": "EXAMPLE_2026:ev_001",
  "supports": ["EXAMPLE_2026:dr_001"],
  "source_location": "example.pdf · page 12 · Design requirements",
  "quote_or_summary": "The paper states that unauthorized changes must be detectable.",
  "evidence_type": "paraphrase"
}
```

Rules:

- `supports` is a nonempty array of canonical concept IDs or the containing `paper_id` for paper-level evidence.
- `source_location` and `quote_or_summary` are nonempty.
- Allowed `evidence_type` values are `quote`, `paraphrase`, and `summary`.
- `concept_ids`, `concept_id`, and other synonyms are not canonical keys.

## Canonical relation model (`relations.yaml`)

`relations.yaml` is stored in JSON syntax, which is a valid YAML subset. This gives the `.yaml` file deterministic parsing and exact-key validation.

The document has exactly `schema_version`, `paper_id`, and `relations`. Every relation has exactly:

```json
{
  "id": "EXAMPLE_2026:rel_001",
  "source": "EXAMPLE_2026:dr_001",
  "target": "EXAMPLE_2026:dp_001",
  "predicate": "addressed_by",
  "evidence": "EXAMPLE_2026:ev_001",
  "confidence": "high",
  "extraction_type": "explicit"
}
```

`evidence` may be `null` when no relation-specific evidence item is recorded. Both endpoints must be canonical concepts from the same paper bundle.

Allowed predicates are:

- `motivates`
- `requires`
- `addressed_by`
- `satisfies`
- `instantiates`
- `implements`
- `evaluated_by`
- `supported_by`
- `derived_from`
- `contrasts_with`
- `generalizes_to`
- `contributes_to`
- `instantiated_by`
- `supports`

Predicate direction is significant. The validator does not reverse or invent relations.

## Canonical aliases (`aliases.yaml`)

`aliases.yaml` is JSON-compatible YAML with exactly `schema_version`, `paper_id`, and `aliases`. Each alias has exactly:

```json
{
  "target_id": "EXAMPLE_2026:dr_001",
  "terms": ["integrity requirement", "tamper detection"]
}
```

`target_id` must identify the paper or one canonical concept in that bundle. Aliases are retrieval aids only.

## Canonical stored graph (`graph.json`)

`graph.json` has exactly these top-level keys:

- `schema_version`
- `paper_id`
- `title`
- optional `source_reference`
- optional `source_views`
- `nodes`
- `edges`
- `recommended_paths`

Example:

```json
{
  "schema_version": "okf-dsr-v1",
  "paper_id": "EXAMPLE_2026",
  "title": "Recommended stored flow",
  "source_reference": {
    "type": "paper_figure",
    "label": "Figure 2",
    "page": 7,
    "caption": "Stored design flow.",
    "validation_status": "unreviewed",
    "validation_notes": "Source located; semantic mapping still requires manual review."
  },
  "nodes": [
    {
      "id": "EXAMPLE_2026:dr_001",
      "type": "Design Requirement",
      "title": "Protect record integrity"
    },
    {
      "id": "EXAMPLE_2026:dp_001",
      "type": "Design Principle",
      "title": "Commit verifiable integrity proofs"
    }
  ],
  "edges": [
    {
      "id": "EXAMPLE_2026:rel_001",
      "source": "EXAMPLE_2026:dr_001",
      "target": "EXAMPLE_2026:dp_001",
      "predicate": "addressed_by"
    }
  ],
  "recommended_paths": [
    ["EXAMPLE_2026:dr_001", "EXAMPLE_2026:dp_001"]
  ]
}
```

Graph rules:

- Every node ID exists in `dsr.md`; node `type` and `title` exactly match that concept.
- Every edge ID exists in `relations.yaml`; source, target, and predicate exactly match that relation.
- Every edge endpoint is declared in `nodes`.
- Every consecutive pair in a recommended path has a stored graph edge in that direction.
- A recommended path contains at least two nodes.
- The UI may project, filter, or focus stored nodes and edges, but it must not introduce alternate stored semantics or invented edges.
- Concepts omitted from a recommended path remain available as additional concepts; omission does not delete them from the canonical source.
- `source_reference.type` is `paper_figure`, `paper_table`, or `okf_relations_projection`.
- Its `validation_status` is `unreviewed`, `internally_validated`, or `author_verified`.
- Elevated validation requires explicit compatible paper review metadata; migration or structural validation alone never elevates semantic status.
- Source provenance is descriptive and does not authorize graph-only nodes or edges.

### Optional exact source views

`source_views` is a backward-compatible optional array. Each entry transcribes one complete formal paper figure or table using canonical concepts and canonical relations. It is data, not a UI cache: it cannot redefine a concept, relation, predicate, or provenance claim.

A source view has exactly:

- `source_view_id`
- `title`
- `view_type`
- `source_reference`
- `layers`
- `edge_ids`
- `ordering`
- `layout`

Example:

```json
"source_views": [
  {
    "source_view_id": "formal_model",
    "title": "Formal model shown in the paper",
    "view_type": "paper_figure",
    "source_reference": {
      "type": "paper_figure",
      "label": "Figure 2",
      "page": 7,
      "caption": "Exact caption from the source.",
      "validation_status": "unreviewed",
      "validation_notes": "Complete transcription awaiting human semantic review.",
      "reviewed_by": null,
      "reviewed_at": null,
      "author_verification": null
    },
    "layers": [
      {
        "concept_type": "Design Requirement",
        "node_ids": ["EXAMPLE_2026:dr_001"]
      },
      {
        "concept_type": "Design Principle",
        "node_ids": ["EXAMPLE_2026:dp_001"]
      }
    ],
    "edge_ids": ["EXAMPLE_2026:rel_001"],
    "ordering": {
      "layer_order": ["Design Requirement", "Design Principle"],
      "node_order": {
        "Design Requirement": ["EXAMPLE_2026:dr_001"],
        "Design Principle": ["EXAMPLE_2026:dp_001"]
      }
    },
    "layout": {
      "direction": "LEFT_TO_RIGHT",
      "preserve_source_order": true,
      "semantic_parity": false,
      "ordering_parity": true,
      "visual_parity": "automatic_approximation"
    }
  }
]
```

Nested keys are exact:

| Object | Exact keys |
|---|---|
| source reference | `type`, `label`, `page`, `caption`, `validation_status`, `validation_notes`, `reviewed_by`, `reviewed_at`, `author_verification` |
| author verification | `author_name`, `verification_record` |
| layer | `concept_type`, `node_ids` |
| ordering | `layer_order`, `node_order` |
| layout | `direction`, `preserve_source_order`, `semantic_parity`, `ordering_parity`, `visual_parity` |

Allowed values:

- `view_type` and `source_reference.type`: `paper_figure` or `paper_table`; they must match.
- `validation_status`: `unreviewed`, `internally_validated`, or `author_verified`.
- `layout.direction`: `LEFT_TO_RIGHT`, `RIGHT_TO_LEFT`, `TOP_TO_BOTTOM`, or `BOTTOM_TO_TOP`.
- `layout.visual_parity`: `automatic_approximation` or `manually_validated`.

Source-view invariants:

- `source_view_id` is unique inside the paper.
- Every node exists in `dsr.md`, belongs to the paper, and has the canonical type declared by its layer.
- Every relation exists in `relations.yaml`, belongs to the paper, and has both endpoints inside the source-view node set.
- Relations must be `explicit` or `explicit-in-artifact`. Inferred and query-generated relations are forbidden.
- Each layer is declared once, each node occurs once, `layer_order` contains every declared layer once, and `node_order` repeats every layer's exact stored node order.
- Unknown keys are invalid at every nested level.
- `internally_validated` requires `reviewed_by` and `reviewed_at`.
- `author_verified` additionally requires an `author_verification` object with `author_name` and `verification_record`.
- `manually_validated` visual parity requires an elevated review state and reviewer metadata.
- Structural validity never changes semantic review status. Automated migration, transcription, or a passing validator cannot mark a source view reviewed.
- `semantic_parity` is a curator assertion, not a result derived by the structural validator. Keep it false when parity has not been established.
- `automatic_approximation` preserves semantic order but does not claim pixel-identical reproduction.

Do not create `source_views` automatically from `recommended_paths`, all stored relations, legacy CSV, PDF proximity, or an LLM suggestion. If a complete source mapping cannot be verified, omit it and record the gap in `docs/OKF_SOURCE_VIEW_AUDIT.md`.

### Flow-view semantics

The three presentation modes are distinct:

- **Source Figure:** available only for a structurally valid stored source view; projects exactly its node IDs, relation IDs, layer order, and within-layer order. It performs no ranking, compaction, inference, or R->P->F coercion.
- **Recommended Flow:** a readable stored pathway from `recommended_paths`, or a deterministic subset of stored relations when paths are absent. Its subtitle is "Recommended stored pathway" and it never claims source-figure parity.
- **Full Relations / Advanced:** all stored canonical relations in scope, including explicit, explicit-in-artifact, and inferred relations. Query-generated relations are excluded from stored-paper Workbench views.

A paper without a complete source view still supports Recommended Flow and Full Relations. Source labels and captions must never leak onto a projection that contains relations outside that source view.

### Shared projection and rendering contract

Workbench and chatbot flow requests resolve through the same provider-neutral projector. The projector is immutable and may select only stored node and relation IDs. A deterministic ELK layered layout assigns canonical partitions, preserves stored source order for Source Figure, and applies ELK crossing minimization to other stored views. It uses content-aware node heights, fixed layer spacing, and stable hashed border-handle IDs; no random placement or competing layout engine is used.

Directed relations render border-to-border with a closed target arrowhead. Ordinary relations use straight paths. Only genuinely parallel relations may use a low-curvature Bézier path to remain distinguishable. Orthogonal, Manhattan, staircase, shared-trunk, and center-to-center routing are prohibited. Provenance affects styling only: explicit relations are solid, explicit-in-artifact relations remain solid and distinct, inferred stored relations are dashed, and query-generated styling is reserved for chatbot-generated flows. The Workbench canvas is full-width, scalable, and exposes fit, reset, selection reset, relation-label, pan/zoom, and fullscreen controls.

## Controlled values

### Review status

Allowed `review_status` values:

- `unreviewed`
- `internally_reviewed`
- `author_verified`

`internally_reviewed` and `author_verified` require nonempty `reviewed_by` and `reviewed_at` paper metadata. Collection status must match its paper record. A concept may remain `unreviewed`; a non-unreviewed concept must be covered by a compatible paper review record, and `author_verified` also requires `author_check_status: "verified"`. Extraction confidence is never mapped to review status.

### Author check status

Allowed `author_check_status` values:

- `not_requested`
- `requested`
- `verified`
- `disputed`

### Extraction status

Allowed `extraction_status` values:

- `okf_draft`
- `indexed_from_canonical_okf`

Canonical source bundles currently use `okf_draft`. `indexed_from_canonical_okf` describes a runtime/indexed projection, not human review.

### Confidence

Allowed extraction-confidence values:

- `high`
- `medium-high`
- `medium`
- `low`

Confidence records extraction certainty only. It does not mean expert review or author verification.

### Extraction type

Allowed `extraction_type` values:

- `explicit`
- `inferred`
- `explicit-in-artifact`

An inferred relation must still be recorded explicitly in the canonical OKF source before a stored graph may use it. The Workbench must not infer new links in the browser.

## Validation and normalization

Run:

```bash
npm run okf:validate
npm run okf:validate:strict
```
npm run okf:validate:source-views
npm run okf:audit:source-views

Both commands execute strict source validation and fail on:

- missing or unexpected bundle files;
- a missing or invalid reusable `library/okf/TEMPLATE/` bundle;
- a missing or malformed `presentation.yaml`, a version or paper-ID mismatch, or unknown presentation keys;
- a forbidden literal placeholder or an empty required presentation summary;
- an empty presentation array without a provenance note explaining genuine absence;
- malformed or unknown `source_reference` keys, type, status, or elevated status without review metadata;
- malformed or unknown `source_views` keys, incomplete ordering, duplicate nodes/edges, wrong paper ownership, dangling references, or endpoints outside the declared view;
- inferred/query-generated Source Figure edges or unsupported semantic/visual validation claims;
- a runtime bundle whose exact eight-file structure differs from the template;
- non-array graph `nodes`, `edges`, or `recommended_paths`;
- missing, extra, or synonymous machine-readable keys;
- noncanonical concept types, predicates, statuses, confidence values, or extraction types;
- unscoped or duplicate IDs;
- unknown concept/evidence/relation references;
- graph nodes or edges not backed by canonical concepts/relations;
- invalid recommended paths;
- reviewed status without review metadata;
- parser warnings;
- missing, malformed, misheaded, or runtime-invisible concept/evidence JSON sections;
- empty concept or evidence collections.

The one-time migration command is:

```bash
npm run okf:normalize:v1
```

The one-time human-presentation migration command is:

```bash
npm run okf:migrate-presentation
```

It is idempotent for `okf-dsr-v1` bundles. It must not be used to invent DSR facts. Legacy-only Research Question, Kernel Theory, and Limitation records are preserved as paper-level prose/metadata rather than being silently retyped as one of the seven canonical DSR layers. Legacy links touching those records are likewise retained in a clearly labelled human-readable context section, but they are excluded from canonical relations and graphs.

## Adding a paper

Before indexing a new paper:

1. Create all eight required files, including `presentation.yaml`.
2. Use the exact schema version, keys, concept types, and controlled values above.
3. Record only source-supported concepts and relations.
4. Keep research objectives and questions in paper metadata and create the separate human presentation profile.
5. Create graph nodes/edges only from canonical concepts/relations.
6. Run regular, strict, and flow validation.
7. Review the Workbench presentation and stored-flow provenance manually.
8. Commit the OKF Git change, then re-index Supabase.

For the full production workflow, use `docs/OKF_PAPER_GENERATION_GUIDE.md`.
