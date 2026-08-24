# Native OKF release shell

## Release boundary

The production-facing shell presents the accepted native OKF implementation as the **DSR Knowledge Library**. It is a research prototype for inspecting linked design knowledge, performing bounded retrieval, and generating source-grounded synthesis. The release shell does not claim complete extraction, comprehensive DSR coverage, or authoritative model output.

The accepted paper Workbench, semantic design map, Raw links view, selected-node drawer, chat conversation and composer, source cards, and generated diagrams remain frozen. Phase 6B changes only the public homepage, global navigation and footer, public route integration, public metadata, release copy, and narrowly related responsive behavior.

The canonical bundle at `knowledge/okf` is also frozen. Coverage warnings are not repaired in this release phase; paper-by-paper curation follows separately.

## Canonical public routes

| Route | Purpose |
| --- | --- |
| `/` | Research-oriented landing page |
| `/library` | Paper and design-knowledge library |
| `/chat` | Grounded research assistant shell |
| `/papers/[slug]` | Paper Workbench |
| `/concepts/[...conceptId]` | Native concept page |
| `/method` | Public method, grounding, privacy, and limitations |

The public same-origin chat endpoint remains under `/api/native-okf/chat`. There is no second canonical chat API.

## Compatibility redirects

The former native-prefixed public routes temporarily redirect to the closest canonical route for the first canary release:

- `/native-okf` → `/library`
- `/native-okf/chat` → `/chat`
- `/native-okf/access` → `/chat`
- `/native-okf/papers/[slug]` → `/papers/[slug]`
- `/native-okf/concepts/[...conceptId]` → `/concepts/[...conceptId]`
- `/native-okf/admin/access` → controlled not found
- `/native-okf/admin` → controlled not found

Temporary redirects avoid permanent browser caching during rollback. Query parameters remain intact where the framework does not explicitly replace them. Redirect definitions are centralized and audited for loops.

## Legacy public-route handling

Legacy source remains on disk for rollback and historical comparison, but public navigation and canonical pages do not import it. Legacy route names are either redirected to the closest native replacement or sent to a controlled not-found response when no valid replacement exists. In particular, old exploration and Workbench entry points map to the library, while old chat and evaluation entry points map to grounded chat. Administrative navigation is never public.

Retained legacy OKF, Workbench, and evaluation API namespaces are shadowed by a native, no-store `404` response. Their source stays intact for rollback, but their implementations are not reachable and are never imported by canonical routes.

No legacy source is deleted in Phase 6B. Cleanup requires a later explicit acceptance decision.

## Homepage

The homepage is a focused research entry point rather than the full 34-paper listing. It contains:

1. a restrained hero with library and chat actions;
2. corpus metrics calculated from the current native repository;
3. concise researcher capabilities;
4. a conceptual native-OKF-to-validated-flow sequence;
5. a small, deterministic featured-paper selection based on linked concept coverage, with stable metadata tie-breaks;
6. a grounding and research-integrity statement;
7. a researcher-evaluation section; and
8. the global research footer.

The Requirements → Principles → Features motif is explicitly decorative. It is not presented as a stored paper result and does not imply that every paper contains those categories.

The public research notice is:

> This research prototype is undergoing knowledge-curation and researcher evaluation. Generated responses should be checked against the cited design knowledge and original publications.

## Navigation and footer

The global header contains only Home, Library, and Grounded Chat, with an accessible mobile menu and active-route indication.

The footer identifies the DSR Knowledge Library as a research prototype using native Open Knowledge Format in a Universität Leipzig research context. It links to the library, grounded chat, method and limitations, and the public privacy note. It contains no analytics, invented legal identity, social links, or administrator entry point.

## Method and privacy information

`/method` explains:

- the artifact purpose and native OKF representation;
- the difference between stored knowledge and generated synthesis;
- citation-ID and source-path validation;
- semantic paper design maps versus the technical Raw links view;
- corpus-curation limitations and no-match behavior;
- researcher-evaluation status; and
- the operational privacy boundary.

The server does not persist prompts, responses, history, or retrieved source text. The public page deliberately omits secret configuration and provider details.

## Frontend deployment checks

The non-secret release-readiness check validates the OKF bundle, dynamic homepage metrics, route-helper uniqueness, compatibility redirects, absence of public administrator navigation, production retrieval-debug protection, the optional chat kill switch, provider credential presence as a boolean only, Markdown discovery, route generation, output tracing, and absence of legacy imports from canonical code. It never calls OpenAI and never prints secret values.

Production verification covers canonical pages, compatibility redirects, anonymous same-origin chat, noindex/robots behavior, sitemap membership, responsive shell behavior, and discovery of all 245 Markdown documents.

## Deployment and rollback

The evaluation release has no researcher identity or database dependency. The public handler retains bounded request validation, same-origin checks, an emergency kill switch, and an identity-free in-process concurrency guard.

Rollback is intentionally simple:

1. disable paid chat using the environment kill switch;
2. pause operational calls in the private dashboard if available;
3. restore the previous route mapping and global shell from version control;
4. retain the native bundle, operational database, and legacy source unchanged; and
5. verify library readability before re-enabling any paid request path.

No route promotion should delete legacy files or rewrite Git history.

## Next phase

The next data phase is paper-by-paper curation across the 34-paper corpus. Researchers should review the coverage-audit warnings against original publications, then explicitly add or correct native concepts and relationships with provenance. Phase 6B neither infers nor creates missing design knowledge.
