"use client";

import { useEffect, useRef, useState } from "react";

import type { NativeOkfScopePaper } from "../../shared/paper-scope.ts";
import { ChatWorkbench } from "./ChatWorkbench.tsx";

export interface PaperChatLauncherProps {
  /** Canonical slug of the paper whose page this is. */
  paperId: string;
  paperTitle: string;
  papers: readonly NativeOkfScopePaper[];
}

/**
 * A tasteful bottom-right call to action on every paper page. Opens an in-page
 * chat drawer that is scoped to this paper — the researcher never has to
 * navigate away or repeat the paper title.
 */
export function PaperChatLauncher({
  paperId,
  paperTitle,
  papers,
}: PaperChatLauncherProps) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const launcherRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function close() {
    setOpen(false);
    launcherRef.current?.focus();
  }

  return (
    <>
      <button
        ref={launcherRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-research transition hover:bg-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 sm:bottom-6 sm:right-6"
      >
        <span aria-hidden="true">💬</span>
        Ask about this paper
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-ink/30"
          onClick={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="native-okf-paper-drawer-title"
            className="flex h-full w-full max-w-xl flex-col overflow-y-auto bg-paper shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-line bg-white px-4 py-3 sm:px-5">
              <div>
                <p
                  id="native-okf-paper-drawer-title"
                  className="text-xs font-bold uppercase tracking-[0.14em] text-blue"
                >
                  Ask about this paper
                </p>
                <p className="mt-1 text-sm font-semibold text-ink">{paperTitle}</p>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label="Close the paper chat"
                className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
              >
                Close ✕
              </button>
            </div>
            <div className="flex-1 px-3 py-4 sm:px-4">
              <ChatWorkbench
                papers={papers}
                lockedPaperId={paperId}
                variant="drawer"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
