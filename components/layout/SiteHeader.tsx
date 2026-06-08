import Link from "next/link";
import { ClipboardCheck, Network, PanelsTopLeft, Sparkles } from "lucide-react";

const nav = [
  { label: "Explore", href: "/explore" },
  { label: "Patterns", href: "/patterns" },
  { label: "Workbench", href: "/workbench", icon: PanelsTopLeft, isNew: true },
  { label: "Feedback", href: "/desrist-evaluation", icon: ClipboardCheck, isNew: true },
  { label: "Flow Builder", href: "/flow-builder" }
  // Methodology route intentionally remains implemented but hidden from navigation for the conference demo.
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/92 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 place-items-center border border-ink/20 bg-white">
            <Network className="h-4 w-4 text-blue" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold tracking-[0.12em] text-ink">DLT DS Library</span>
            <span className="hidden text-xs text-muted sm:block">visual knowledge base for blockchain and DLT design research</span>
          </span>
        </Link>
        <nav className="flex max-w-full items-center gap-1 overflow-x-auto pb-1 text-sm text-muted md:pb-0">
          {nav.map(({ label, href, icon: Icon, isNew }) => (
            <Link key={href} href={href} className="inline-flex shrink-0 items-start gap-1.5 px-3 py-2 transition hover:bg-white hover:text-ink">
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
      </div>
    </header>
  );
}
