import Link from "next/link";
import { Network } from "lucide-react";

const nav = [
  ["Explore", "/explore"],
  ["Patterns", "/patterns"],
  ["Ingest", "/ingest"],
  ["Flow Builder", "/flow-builder"],
  ["Methodology", "/methodology"]
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/92 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center border border-ink/20 bg-white">
            <Network className="h-4 w-4 text-blue" />
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-[0.12em] text-ink">DLT DS Library</span>
            <span className="hidden text-xs text-muted sm:block">visual knowledge base for blockchain and DLT design research</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm text-muted">
          {nav.map(([label, href]) => (
            <Link key={href} href={href} className="px-3 py-2 transition hover:bg-white hover:text-ink">
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
