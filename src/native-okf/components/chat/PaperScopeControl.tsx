"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

import type { NativeOkfChatScope } from "../../shared/chat-types.ts";
import {
  findNativeOkfScopePaper,
  type NativeOkfScopePaper,
} from "../../shared/paper-scope.ts";
import { PaperScopePopover } from "./PaperScopePopover.tsx";

export interface PaperScopeControlProps {
  papers: readonly NativeOkfScopePaper[];
  scope: NativeOkfChatScope;
  onScopeChange: (scope: NativeOkfChatScope) => void;
  disabled?: boolean;
  /** External trigger to open the picker (e.g. the `@` / `/paper` affordances). */
  requestOpenToken?: number;
  /** Content region the picker popover stays inside on desktop. */
  boundsRef?: RefObject<HTMLElement | null>;
}

export function PaperScopeControl({
  papers,
  scope,
  onScopeChange,
  disabled = false,
  requestOpenToken = 0,
  boundsRef,
}: PaperScopeControlProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const activePaper = scope.type === "paper"
    ? findNativeOkfScopePaper(scope.paperId, papers)
    : undefined;

  useEffect(() => {
    if (requestOpenToken > 0 && !disabled) setOpen(true);
  }, [requestOpenToken, disabled]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function selectPaper(paper: NativeOkfScopePaper) {
    onScopeChange({ type: "paper", paperId: paper.paperId });
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div ref={containerRef} className="inline-flex flex-col gap-1">
      {scope.type === "paper" ? (
        <div className="inline-flex items-center gap-1">
          <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-blue/30 bg-blue/10 py-1 pl-3 pr-1 text-xs font-semibold text-ink">
            <button
              ref={triggerRef}
              type="button"
              disabled={disabled}
              onClick={() => setOpen((current) => !current)}
              aria-haspopup="dialog"
              aria-expanded={open}
              className="truncate rounded-full outline-none focus-visible:ring-2 focus-visible:ring-blue disabled:cursor-not-allowed"
              title="Switch paper"
            >
              <span className="text-blue">Paper scope:</span>{" "}
              {activePaper?.title ?? scope.paperId}
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onScopeChange({ type: "corpus" })}
              aria-label="Clear paper scope and return to all papers"
              className="grid h-5 w-5 place-items-center rounded-full text-blue transition hover:bg-blue/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue disabled:cursor-not-allowed"
            >
              <span aria-hidden="true">×</span>
            </button>
          </span>
        </div>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue disabled:cursor-not-allowed disabled:opacity-45"
        >
          All papers
          <span aria-hidden="true" className="text-muted">▾</span>
        </button>
      )}

      {scope.type === "paper" ? (
        <p className="text-[0.68rem] leading-4 text-muted">
          Answers and citations are restricted to this paper.
        </p>
      ) : null}

      {open ? (
        <PaperScopePopover
          anchorRef={containerRef}
          boundsRef={boundsRef}
          papers={papers}
          heading={scope.type === "paper" ? "Switch paper" : "Select a paper"}
          onSelect={selectPaper}
          onClose={() => {
            setOpen(false);
            triggerRef.current?.focus();
          }}
        />
      ) : null}
    </div>
  );
}
