# Native OKF evaluation onboarding

Phase 6D adds narrow onboarding and evaluation links around the accepted native OKF release. Chat orchestration, retrieval, contextual dialogue, citation validation, synthesis planning, diagram generation, quotas, access controls, and operational storage remain frozen.

## Guided chat workflows

The empty chat state offers exactly four researcher-controlled workflows:

1. **Explore a paper map** selects one canonical paper and submits a stored-map request through the existing chat handler with diagram intent enabled.
2. **Inspect design knowledge** selects one paper and one semantic category actually represented for that paper. It starts text-only, while the existing diagram control remains available.
3. **Compare two papers** selects two distinct canonical papers and creates a generic comparison question using both full titles. It starts text-only.
4. **Build a grounded solution** accepts a bounded researcher problem and submits a grounded decision-support-flow request with diagram intent enabled.

Opening a workflow, choosing a paper, choosing a category, or entering a problem performs no API or model request. The generated question is displayed before submission. A request is made only when the researcher presses **Ask this question**, and it uses the same submission path as a manually typed question.

After the first user message, the large starter area collapses to a small **Guided starters** control. Reopening it does not clear the transcript or conversation context. **New chat** clears transient starter selections by remounting the starter state, while preserving researcher access and canonical quota values.

## Repository-derived catalog

The chat server page obtains a bounded starter catalog from the existing native repository view model. Each entry contains only a canonical paper identifier, canonical title, and represented semantic categories. Papers are sorted deterministically by title.

Supported categories are design requirements, design principles, design features, design objectives, meta-requirements, and design goals. A category appears only when the selected paper represents it. The starter catalog contains no Markdown bodies and does not use legacy records, CSV, Supabase, `graph.json`, or old OKF APIs.

## Diagram allowance

Explore a paper map and Build a grounded solution are disabled when the current diagram allowance is exhausted. The UI explains that text-only questions remain available. Inspect design knowledge and Compare two papers remain usable. No client-side quota decrement is performed; the browser continues to use the canonical post-response and access-status snapshots.

## Evaluation survey

The external anonymous evaluation survey is linked from the desktop and mobile header, footer, Method page, and one compact chat callout shown after a substantive answer or diagram response. Clarification-only turns do not reveal the callout.

Every survey action:

- uses the one centralized public URL;
- opens explicitly in a new tab;
- uses `noopener noreferrer`;
- includes an accessible new-tab label;
- appends no questions, identifiers, access codes, sources, or tracking parameters.

The survey is not embedded, opened automatically, tracked by the server, or required before using the library. Dismissing the chat callout affects only the currently mounted chat view; survey completion is not stored.

## Privacy boundary

The starter catalog contains repository metadata only. Starter configuration stays in browser component state. Generated questions enter the existing chat request only after explicit submission. The survey receives no library or chat state. Existing conversation data remains bounded to `sessionStorage` in the current tab, while the server persists only access, quota, cost, and safe operational aggregates.

## Deployment hygiene

The release retains the production `start` command, required `NATIVE_OKF_PUBLIC_ORIGIN` deployment configuration, canonical routes, loop-free compatibility redirects, production retrieval-diagnostic gate, canonical-only sitemap, and administrator exclusion from public navigation. The survey is external and is not added to the sitemap.

The repository ignores Next build output, local environment files while allowing example files, runtime SQLite state and companions through the ignored runtime directory, generated coverage artifacts, local debug logs, and common browser-test output directories. Production deployment still assumes a persistent writable SQLite volume and a single application instance unless operational storage is replaced deliberately.

## Known limitations

- Starter categories reflect the current represented corpus, not completeness of the underlying publications.
- The workflows create bounded questions; they do not guarantee that retrieval will find sufficient evidence.
- The feedback-callout dismissal is not a survey-completion record and may reset after a page refresh.
- Generated synthesis remains a grounded proposal requiring researcher review, not validated theory or stored corpus knowledge.
