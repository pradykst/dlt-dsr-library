import Link from "next/link";
import type { ReactNode } from "react";

import { NATIVE_OKF_ROOT } from "../shared/links.ts";

export function NativeOkfRouteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href={NATIVE_OKF_ROOT}
              className="font-serif text-lg font-semibold tracking-tight outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-white/60 sm:text-xl"
            >
              Native OKF Library
            </Link>
            <span className="hidden rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200 sm:inline-flex">
              Isolated native implementation
            </span>
          </div>

          <nav aria-label="Native OKF navigation" className="flex items-center gap-1 text-sm">
            <Link
              href={NATIVE_OKF_ROOT}
              className="rounded-lg px-3 py-2 font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
            >
              Library
            </Link>
            <Link
              href={`${NATIVE_OKF_ROOT}#papers`}
              className="rounded-lg px-3 py-2 font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
            >
              Papers
            </Link>
            <span
              aria-disabled="true"
              title="Chat is intentionally disabled in this UI-only phase"
              className="cursor-not-allowed rounded-lg px-3 py-2 font-medium text-slate-500"
            >
              Chat <span className="text-[10px] uppercase tracking-wider">later</span>
            </span>
          </nav>
        </div>
      </header>

      <div className="border-b border-amber/20 bg-amber/10 px-4 py-2 text-center text-xs font-medium text-slate-700">
        Reads only the canonical <code className="font-mono">knowledge/okf</code> bundle through the isolated native server repository.
      </div>

      {children}
    </div>
  );
}
