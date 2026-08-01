"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BookOpen, Home, KeyRound, Menu, MessageSquareText, Network, X } from "lucide-react";

import { NATIVE_OKF_EVALUATION_SURVEY_URL } from "@/src/native-okf/shared/public-links";
import { CANONICAL_ROUTES } from "@/src/native-okf/shared/routes";

const nav = [
  { label: "Home", href: CANONICAL_ROUTES.home, icon: Home },
  { label: "Library", href: CANONICAL_ROUTES.library, icon: BookOpen },
  { label: "Chat", href: CANONICAL_ROUTES.chat, icon: MessageSquareText },
  { label: "Chat access", href: CANONICAL_ROUTES.access, icon: KeyRound },
];

function isActiveRoute(pathname: string, href: string): boolean {
  if (href === CANONICAL_ROUTES.home) return pathname === href;
  if (href === CANONICAL_ROUTES.library) {
    return pathname === href ||
      pathname.startsWith("/papers/") ||
      pathname.startsWith("/concepts/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/92 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3" onClick={() => setIsOpen(false)}>
          <span className="grid h-10 w-10 shrink-0 place-items-center border border-blue/25 bg-white shadow-[0_8px_24px_rgba(79,111,145,0.12)]">
            <Network className="h-4 w-4 text-blue" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold tracking-[0.12em] text-ink">DSR Knowledge Library</span>
            <span className="hidden text-xs text-muted lg:block">Reusable design knowledge and grounded research support</span>
          </span>
        </Link>
        
        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 text-sm text-muted xl:flex">
          {nav.map(({ label, href, icon: Icon }) => {
            const active = isActiveRoute(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 border px-3 py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 ${
                  active
                    ? "border-blue/25 bg-white text-ink"
                    : "border-transparent hover:border-line hover:bg-white hover:text-ink"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="leading-5">{label}</span>
              </Link>
            );
          })}
          <a
            href={NATIVE_OKF_EVALUATION_SURVEY_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Give feedback in the external evaluation survey; opens in a new tab"
            className="inline-flex shrink-0 items-center gap-1.5 border border-transparent px-3 py-2 transition hover:border-line hover:bg-white hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
          >
            <span className="leading-5">Give feedback {"\u2197"}</span>
          </a>
        </nav>

        {/* Mobile Toggle */}
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center border border-line bg-white text-ink transition hover:border-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 xl:hidden"
          aria-label={isOpen ? "Close navigation" : "Open navigation"}
          aria-controls="public-mobile-navigation"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div id="public-mobile-navigation" className="absolute left-0 right-0 top-full z-50 border-b border-line bg-paper shadow-2xl xl:hidden">
          <div className="flex h-12 items-center justify-between border-b border-line px-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Navigation</span>
            <button type="button" aria-label="Close navigation" className="flex h-9 w-9 items-center justify-center border border-line bg-white text-ink transition hover:border-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <nav className="grid gap-1 p-3 text-sm text-muted">
            {nav.map(({ label, href, icon: Icon }) => {
              const active = isActiveRoute(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2.5 border px-3 py-2.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue ${
                    active
                      ? "border-blue/25 bg-white text-ink"
                      : "border-transparent hover:border-line hover:bg-white hover:text-ink"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="leading-5">{label}</span>
                </Link>
              );
            })}
            <a
              href={NATIVE_OKF_EVALUATION_SURVEY_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Give feedback in the external evaluation survey; opens in a new tab"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 border border-transparent px-3 py-2.5 text-ink transition hover:border-line hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
            >
              <span className="leading-5">Give feedback {"\u2197"}</span>
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}



