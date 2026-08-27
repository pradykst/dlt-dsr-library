"use client";

import { useEffect, useRef, useState } from "react";

export function CopyAssistantResponseButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<number | null>(null);

  useEffect(() => () => {
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current);
      resetTimer.current = window.setTimeout(() => setCopied(false), 2_000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => void copy()}
        aria-label={copied ? "Assistant response copied" : "Copy assistant response"}
        className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
      >
        {copied ? "Copied" : "Copy"}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {copied ? "Assistant response copied to clipboard." : ""}
      </span>
    </div>
  );
}
