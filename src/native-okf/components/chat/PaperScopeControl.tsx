"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

import { nativeOkfChatScopePaperIds, type NativeOkfChatScope } from "../../shared/chat-types.ts";
import {
  findNativeOkfScopePaper,
  addNativeOkfScopePaper,
  removeNativeOkfScopePaper,
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

  const paperIds = nativeOkfChatScopePaperIds(scope);

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
    onScopeChange(addNativeOkfScopePaper(scope, paper.paperId));
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div ref={containerRef} className="flex min-w-0 max-w-full flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button ref={triggerRef} type="button" disabled={disabled}
          onClick={() => setOpen((current) => !current)} aria-haspopup="dialog" aria-expanded={open}
          className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink focus-visible:ring-2 focus-visible:ring-blue disabled:opacity-45">
          {paperIds.length ? `${paperIds.length} ${paperIds.length === 1 ? "paper" : "papers"} selected` : "All papers"}
          <span aria-hidden="true" className="ml-2 text-muted">▾</span>
        </button>
        {paperIds.length ? <button type="button" disabled={disabled} onClick={() => onScopeChange({ type: "corpus" })}
          className="text-xs font-semibold text-blue underline">All papers</button> : null}
      </div>
      {paperIds.length ? (
        <>
          <ul className="flex min-w-0 flex-wrap gap-1.5" aria-label="Selected papers">
            {paperIds.map((paperId, index) => {
              const title = findNativeOkfScopePaper(paperId, papers)?.title ?? paperId;
              return <li key={paperId} className="inline-flex min-w-0 max-w-full items-center gap-2 rounded-xl border border-blue/30 bg-blue/10 px-2.5 py-1.5 text-xs text-ink">
                <span className="shrink-0 font-semibold text-blue">{index + 1}</span>
                <span className="min-w-0 break-words [overflow-wrap:anywhere]" title={title}>{title}</span>
                <button type="button" disabled={disabled} onClick={() => onScopeChange(removeNativeOkfScopePaper(scope, paperId))}
                  aria-label={`Remove ${title}`} className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-base text-blue hover:bg-blue/20 focus-visible:ring-2 focus-visible:ring-blue">×</button>
              </li>;
            })}
          </ul>
          <p className="text-[0.68rem] leading-4 text-muted">Answers and citations are restricted to the selected papers.</p>
        </>
      ) : null}

      {open ? (
        <PaperScopePopover
          anchorRef={containerRef}
          boundsRef={boundsRef}
          papers={papers}
          heading="Add a paper"
          selectedPaperIds={paperIds}
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
