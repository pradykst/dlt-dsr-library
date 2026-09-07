"use client";

import {
  NATIVE_OKF_CORPUS_STARTERS,
} from "../../shared/corpus-starters.ts";

interface GuidedChatStartersProps {
  pending: boolean;
  /** Populate an editable example into the composer. Never auto-sends. */
  onPrefill: (example: string) => void;
}

/**
 * Four corpus-wide capabilities. Selecting a card fills the composer with an
 * editable example so the researcher can adjust it before submitting.
 */
export function GuidedChatStarters({ pending, onPrefill }: GuidedChatStartersProps) {
  return (
    <section aria-label="Corpus-wide starters" className="min-w-0 max-w-full">
      <div className="grid min-w-0 gap-2 sm:grid-cols-2">
        {NATIVE_OKF_CORPUS_STARTERS.map((starter) => (
          <button
            key={starter.id}
            type="button"
            disabled={pending}
            onClick={() => onPrefill(starter.example)}
            className="min-w-0 rounded-xl border border-line bg-paper px-4 py-3 text-left transition hover:border-blue/35 hover:bg-blue/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue disabled:cursor-not-allowed disabled:opacity-55"
          >
            <span className="block text-sm font-semibold text-ink">
              {starter.label}
            </span>
            <span className="mt-1 block text-xs leading-5 text-muted">
              {starter.description}
            </span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs leading-5 text-muted">
        Selecting a card fills the composer with an editable example — nothing is
        sent until you press Send.
      </p>
    </section>
  );
}
