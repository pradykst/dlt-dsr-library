# DSR OKF Chatbot

## What DSR OKF is

The DSR OKF layer stores reviewed Design Science Research knowledge in a small local library of Markdown and YAML files. The chatbot retrieves concepts, evidence, and relations from those files, then builds recommendation flows such as Problem -> Requirement -> Principle -> Feature -> Artifact.

The LLM, when enabled later, only explains retrieved OKF data. It must not invent papers, graph nodes, relations, citations, or evidence.

## Folder structure

```text
library/okf/
  index.md
  papers/
    README.md
    paper-folder/
      index.md
      dsr.md
      evidence.md
      relations.yaml
```

Every Markdown file uses YAML frontmatter with at least:

```yaml
type: dsr
paper_id: PAPER_ID
title: Human title
review_status: draft
```

## Add a new paper

1. Create `library/okf/papers/my-paper/index.md` with paper metadata.
2. Add `dsr.md` sections such as `## DesignRequirement:req_001` and field lines for title, tags, confidence, extraction type, and review status.
3. Add `evidence.md` sections such as `## ev_001` with `concept_id`, `paraphrase`, optional quote, page, section, and confidence.
4. Add `relations.yaml` with allowed predicates only.
5. Run validation before indexing.

## Validate OKF

```bash
npm run okf:validate
```

The parser tolerates incomplete draft files and emits warnings instead of crashing.

## Index OKF

```bash
npm run okf:index
```

If Supabase env vars are available, the command upserts papers, concepts, evidence, and relations. Without Supabase env vars it prints a parse-only summary, which is useful for local development.

## Retrieval

The retrieval layer prioritizes exact metadata and keyword matches over concepts, then traverses stored OKF relations. It does not require a vector database for MVP and never creates unreviewed concepts as if they came from a paper.

## Graph and flow generation

The flow builder prefers this path:

```text
Problem -> Design Requirement -> Design Principle -> Design Feature -> Artifact
```

If the user supplies a new problem that is not in the OKF library, the flow includes a `query_generated` Problem node. That node is clearly marked and is not treated as paper evidence.

## Run locally

```bash
npm install
npm run dev
```

Open `/okf-chat`.

## Environment variables

```text
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
LLM_PROVIDER=none | featherless | groq | openai
FEATHERLESS_API_KEY=
GROQ_API_KEY=
OPENAI_API_KEY=
```

The app runs without any LLM key. `LLM_PROVIDER=none` is the deterministic baseline.

## API routes

- `GET /api/okf/papers`
- `GET /api/okf/papers/:paperId`
- `GET /api/okf/concepts`
- `GET /api/okf/graph?paperId=...`
- `POST /api/okf/chat`
- `POST /api/okf/flows`
- `POST /api/okf/corrections`

## Limitations

The included seed papers are draft placeholders with low-confidence evidence placeholders. Replace them with manually reviewed OKF content before treating recommendations as research evidence. The MVP LLM abstraction is intentionally conservative and returns deterministic output unless provider-specific synthesis is completed and validated.
