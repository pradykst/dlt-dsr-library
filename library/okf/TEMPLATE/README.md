# Canonical OKF paper template

This is the reusable `okf-dsr-v1` paper bundle template. It contains placeholder records only; none of its text is a research claim.

To create a paper bundle:

1. Copy this directory to `library/okf/papers/<paper-slug>/`.
2. Replace every `TEMPLATE_PAPER` and `template-paper` identifier consistently.
3. Replace or remove all placeholder metadata and records using source-supported information.
4. Keep all eight required files, including `presentation.yaml`, and the exact machine-readable keys.
5. Keep `review_status: "unreviewed"` until an explicit review record exists.
6. Run `npm run okf:validate:strict` before indexing.

`graph.json.source_views` is optional in real bundles. Keep the included example only when a complete formal paper figure or table can be transcribed using existing canonical concepts and relations. Never generate a source view from recommended paths or infer missing arrows. Leave validation status `unreviewed` until an explicit human review record exists.

Source Figure mode preserves the stored layers and node order, while the runtime layout remains an automatic visual approximation. A manually validated visual-parity status records a reviewer's comparison; this schema does not store UI coordinates or claim pixel-identical reproduction. Recommended Flow and Full Relations are separate projections and must not be presented as the paper's exact figure.

Do not add the template itself to `library/okf/papers/`; runtime parsing and indexing intentionally ignore `library/okf/TEMPLATE/`.
