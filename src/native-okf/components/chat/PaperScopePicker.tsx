"use client";

import {
  type KeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  matchNativeOkfScopePapers,
  type NativeOkfScopePaper,
} from "../../shared/paper-scope.ts";

export interface PaperScopePickerProps {
  papers: readonly NativeOkfScopePaper[];
  onSelect: (paper: NativeOkfScopePaper) => void;
  onClose: () => void;
  initialQuery?: string;
  heading?: string;
  /**
   * Viewport-derived ceiling for the whole panel, supplied by
   * {@link PaperScopePopover}. The paper list scrolls inside it.
   */
  maxHeight?: number;
}

/**
 * The one canonical paper picker used by the visible scope selector, the `@`
 * paper reference, and the `/paper` command. Keyboard-navigable listbox: arrow
 * keys move the active option, Enter selects, Escape closes. An ambiguous query
 * always shows every match — a choice is never resolved silently.
 *
 * Sizing and anchoring belong to {@link PaperScopePopover}, which mounts this
 * component: the picker fills the bounded panel it is given and scrolls the
 * paper list inside it.
 */
export function PaperScopePicker({
  papers,
  onSelect,
  onClose,
  initialQuery = "",
  heading = "Select a paper",
  maxHeight,
}: PaperScopePickerProps) {
  const [query, setQuery] = useState(initialQuery);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listId = useId();
  const headingId = useId();

  // Every canonical paper stays reachable: the list is scrollable, so the limit
  // is the size of the repository-derived catalogue rather than a fixed page
  // size that would hide most of the library from a researcher who browses
  // instead of typing.
  const matches = useMemo(
    () => matchNativeOkfScopePapers(query, papers, papers.length),
    [query, papers],
  );

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  function commit(index: number) {
    const paper = matches[index];
    if (paper) onSelect(paper);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) =>
        matches.length === 0 ? 0 : (current + 1) % matches.length,
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        matches.length === 0
          ? 0
          : (current - 1 + matches.length) % matches.length,
      );
    } else if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(Math.max(0, matches.length - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      commit(activeIndex);
    } else if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  }

  return (
    <div
      role="dialog"
      aria-labelledby={headingId}
      style={maxHeight === undefined ? undefined : { maxHeight }}
      className="flex w-full flex-col rounded-xl border border-line bg-white p-2 shadow-research"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <p
        id={headingId}
        className="shrink-0 px-2 pb-1 pt-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-blue"
      >
        {heading}
      </p>
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded="true"
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          matches[activeIndex] ? `${listId}-option-${activeIndex}` : undefined
        }
        aria-label="Search papers by title or author"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search papers by title or author…"
        className="mb-1 block w-full shrink-0 rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-blue/50 focus:ring-2 focus:ring-blue/20"
      />
      <ul
        id={listId}
        role="listbox"
        aria-label="Papers"
        className="min-h-0 max-h-64 flex-1 overflow-y-auto"
      >
        {matches.length === 0 ? (
          <li className="px-3 py-3 text-sm text-muted">No matching paper.</li>
        ) : (
          matches.map((paper, index) => (
            <li
              key={paper.paperId}
              id={`${listId}-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
            >
              <button
                type="button"
                tabIndex={-1}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => onSelect(paper)}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm leading-5 transition ${
                  index === activeIndex
                    ? "bg-blue/10 text-ink"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span className="block break-words font-semibold text-ink">
                  {paper.title}
                </span>
                {paper.authors.length > 0 ? (
                  <span className="mt-0.5 block break-words text-xs text-muted">
                    {paper.authors.slice(0, 3).join(", ")}
                    {paper.authors.length > 3 ? " et al." : ""}
                  </span>
                ) : null}
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
