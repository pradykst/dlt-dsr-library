import Link from "next/link";

import { NATIVE_OKF_EVALUATION_SURVEY_URL } from "@/src/native-okf/shared/public-links";
import { CANONICAL_ROUTES } from "@/src/native-okf/shared/routes";

const footerLinks = [
  { label: "Library", href: CANONICAL_ROUTES.library },
  { label: "Grounded Chat", href: CANONICAL_ROUTES.chat },
  { label: "Researcher Access", href: CANONICAL_ROUTES.access },
  { label: "Method and limitations", href: CANONICAL_ROUTES.method },
  { label: "Privacy note", href: `${CANONICAL_ROUTES.method}#privacy` },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white/45">
      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-7 text-xs text-muted sm:px-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-end lg:px-8">
        <div className="space-y-1">
          <p className="font-semibold tracking-[0.08em] text-ink">DSR Knowledge Library</p>
          <p>Research prototype · Native Open Knowledge Format</p>
          <p>Universität Leipzig research context</p>
        </div>
        <nav aria-label="Footer navigation" className="flex max-w-2xl flex-wrap gap-x-4 gap-y-2 md:justify-end">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={NATIVE_OKF_EVALUATION_SURVEY_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open the external evaluation survey in a new tab"
            className="transition hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
          >
            Evaluation survey {"\u2197"}
          </a>
        </nav>
      </div>
    </footer>
  );
}
