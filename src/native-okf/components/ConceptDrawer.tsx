"use client";

import { useEffect, useId } from "react";

import type { GraphNodeDto } from "../shared/types.ts";
import { colorsForGraphType } from "./GraphLegend.tsx";

export interface ConceptDrawerProps {
  concept: GraphNodeDto | null;
  onClose: () => void;
}

export function ConceptDrawer({ concept, onClose }: ConceptDrawerProps) {
  const titleId = useId();

  useEffect(() => {
    if (!concept) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [concept, onClose]);

  if (!concept) return null;

  const colors = colorsForGraphType(concept.type);
  const summary = concept.markdownSummary?.trim() || concept.description?.trim();

  return (
    <aside
      role="dialog"
      aria-modal={false}
      aria-labelledby={titleId}
      className="absolute inset-y-0 right-0 z-20 flex w-full max-w-sm flex-col border-l border-line bg-paper shadow-2xl backdrop-blur-sm"
    >
      <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className="inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]"
              style={{
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text,
              }}
            >
              {concept.typeLabel}
            </span>
            {concept.seed ? (
              <span className="rounded-full border border-ink/20 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-ink">
                Seed
              </span>
            ) : null}
          </div>
          <h3 id={titleId} className="font-serif text-xl font-semibold leading-tight text-ink">
            {concept.title}
          </h3>
        </div>

        <button
          type="button"
          aria-label="Close concept details"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-white text-xl leading-none text-muted transition hover:border-ink/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-blue"
          onClick={onClose}
        >
          <span aria-hidden="true">×</span>
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
        <section aria-labelledby={`${titleId}-identity`}>
          <h4
            id={`${titleId}-identity`}
            className="text-xs font-semibold uppercase tracking-[0.14em] text-muted"
          >
            Bundle identity
          </h4>
          <dl className="mt-3 space-y-3 text-sm">
            <div>
              <dt className="text-xs font-medium text-muted">Concept ID</dt>
              <dd className="mt-1 break-all rounded-md border border-line bg-white px-3 py-2 font-mono text-xs text-ink">
                {concept.id}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted">Markdown path</dt>
              <dd className="mt-1 break-all font-mono text-xs text-ink">{concept.filePath}</dd>
            </div>
            {concept.label ? (
              <div>
                <dt className="text-xs font-medium text-muted">Producer label</dt>
                <dd className="mt-1 text-ink">{concept.label}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-xs font-medium text-muted">Native type</dt>
              <dd className="mt-1 break-all font-mono text-xs text-ink">{concept.type}</dd>
            </div>
          </dl>
        </section>

        <section className="mt-7 border-t border-line pt-5" aria-labelledby={`${titleId}-summary`}>
          <h4
            id={`${titleId}-summary`}
            className="text-xs font-semibold uppercase tracking-[0.14em] text-muted"
          >
            Markdown summary
          </h4>
          {summary ? (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-ink">{summary}</p>
          ) : (
            <p className="mt-3 text-sm italic leading-6 text-muted">
              No summary is available for this concept.
            </p>
          )}
        </section>

        {concept.tags.length > 0 ? (
          <section className="mt-7 border-t border-line pt-5" aria-labelledby={`${titleId}-tags`}>
            <h4
              id={`${titleId}-tags`}
              className="text-xs font-semibold uppercase tracking-[0.14em] text-muted"
            >
              Tags
            </h4>
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Concept tags">
              {concept.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-line bg-white px-2.5 py-1 text-xs text-muted"
                >
                  {tag}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>

      <footer className="border-t border-line px-5 py-3 text-xs leading-5 text-muted">
        This bounded preview contains only client-safe native OKF metadata.
      </footer>
    </aside>
  );
}

export default ConceptDrawer;
