# Native OKF rebuild boundaries

This phase implements Google Open Knowledge Format (OKF) v0.1 directly from the canonical Markdown bundle. It is intentionally isolated from every earlier OKF implementation in this repository.

## Canonical data

- The canonical bundle is `knowledge/okf` relative to the repository root.
- Server code resolves the bundle from `process.cwd()` and `OKF_BUNDLE_PATH`, with `knowledge/okf` as the default.
- The Markdown files and YAML frontmatter in the canonical bundle are source data and must not be rewritten by the native implementation.

## Native source namespace

- All native implementation and test modules live under `src/native-okf/`.
- Native filesystem access is server-only and uses Node.js filesystem APIs.
- Internal paths and concept IDs use normalized POSIX separators.
- Bundle path resolution must reject any path that escapes the configured bundle root.

## Quarantined legacy areas

The native implementation must not inspect, import, copy, modify, or derive behavior from legacy OKF code or data. Quarantined areas include old OKF chatbot and Workbench code, `library/okf`, Supabase and migrations, RAG or vector retrieval, answer plans and deterministic answer composers, generated flows, source views, `graph.json`, CSV migration, legacy parsers, old OKF APIs, evidence projectors, and compatibility adapters.

No module under `src/native-okf/` may import any legacy OKF module or any Supabase, database, migration, RAG, generated-flow, AnswerPlan, CSV, source-view, or `graph.json` module.

## Permitted existing files

Only the following existing repository surfaces may inform this phase:

- `package.json` and the active package-manager lockfile;
- `tsconfig.json` and generic package/workspace configuration;
- Next.js, ESLint, Tailwind, and PostCSS configuration;
- the root app layout and global CSS/theme files when relevant;
- the canonical `knowledge/okf/**` bundle.

Environment files and files containing secrets must never be read.

## Lifecycle and Git rules

- Legacy cleanup occurs only after the native implementation has been reviewed and accepted.
- No legacy file is deleted, renamed, or refactored during this phase.
- No commit, merge, push, reset, rebase, stash, or branch switch occurs without explicit approval.
- Phase 2 concerns—including UI, retrieval, OpenAI, chat, diagrams, Supabase, and migration—remain out of scope.

## Current UI-only phase

The later native Workbench request supersedes only the earlier UI exclusion. It authorizes isolated routes and components under the native namespace; retrieval, OpenAI, chatbot behavior, Supabase, migration, and legacy cleanup remain out of scope.
