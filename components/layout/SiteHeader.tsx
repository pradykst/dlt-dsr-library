"use client";

import { useState } from "react";
import Link from "next/link";
import { ClipboardCheck, Menu, Network, PanelsTopLeft, Sparkles, X } from "lucide-react";

const nav = [
  { label: "Explore", href: "/explore" },
  { label: "Patterns", href: "/patterns" },
  { label: "Workbench", href: "/workbench", icon: PanelsTopLeft, isNew: true },
  { label: "Feedback", href: "/desrist-evaluation", icon: ClipboardCheck, isNew: true },
  { label: "Flow Builder", href: "/flow-builder" }
  // Methodology route intentionally remains implemented but hidden from navigation for the conference demo.
];

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/92 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3" onClick={() => setIsOpen(false)}>
          <span className="grid h-10 w-10 shrink-0 place-items-center border border-blue/25 bg-white shadow-[0_8px_24px_rgba(79,111,145,0.12)]">
            <Network className="h-4 w-4 text-blue" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold tracking-[0.16em] text-ink">DLT Design Library</span>
            <span className="hidden text-xs text-muted sm:block">Reusable DSR grids and flows</span>
          </span>
        </Link>
        
        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 text-sm text-muted md:flex">
          {nav.map(({ label, href, icon: Icon, isNew }) => (
            <Link key={href} href={href} className="inline-flex shrink-0 items-center gap-1.5 border border-transparent px-3 py-2 transition hover:border-line hover:bg-white hover:text-ink">
              {Icon && <Icon className="h-3.5 w-3.5" />}
              <span className="leading-5">{label}</span>
              {isNew && (
                <sup className="-ml-1 inline-flex items-center gap-0.5 border border-blue/20 bg-blue/10 px-1 py-0.5 text-[8px] font-semibold uppercase leading-none tracking-[0.08em] text-blue shadow-[0_0_12px_rgba(79,111,145,0.28)]">
                  <Sparkles className="h-2 w-2" />
                  New
                </sup>
              )}
            </Link>
          ))}
        </nav>

        {/* Mobile Toggle */}
        <button type="button" className="flex h-10 w-10 items-center justify-center border border-line bg-white text-ink md:hidden transition hover:border-blue" onClick={() => setIsOpen(true)}>
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 border-b border-line bg-paper shadow-2xl md:hidden">
          <div className="flex h-12 items-center justify-between border-b border-line px-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Navigation</span>
            <button type="button" className="flex h-9 w-9 items-center justify-center border border-line bg-white text-ink transition hover:border-blue" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <nav className="grid gap-1 p-3 text-sm text-muted">
            {nav.map(({ label, href, icon: Icon, isNew }) => (
              <Link key={href} href={href} onClick={() => setIsOpen(false)} className="flex items-center gap-2.5 border border-transparent px-3 py-2.5 transition hover:border-line hover:bg-white hover:text-ink">
                {Icon && <Icon className="h-4 w-4" />}
                <span className="leading-5">{label}</span>
                {isNew && (
                  <sup className="ml-auto inline-flex items-center gap-0.5 border border-blue/20 bg-blue/10 px-1 py-0.5 text-[8px] font-semibold uppercase leading-none tracking-[0.08em] text-blue shadow-[0_0_12px_rgba(79,111,145,0.28)]">
                    <Sparkles className="h-2 w-2" />
                    New
                  </sup>
                )}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
