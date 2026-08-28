import Link from "next/link";
import { BookOpen, Home } from "lucide-react";

import { CANONICAL_ROUTES } from "@/src/native-okf/shared/routes";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl items-center px-4 py-16 sm:px-6">
      <section className="w-full border border-line bg-white p-7 shadow-[0_18px_50px_rgba(32,36,42,0.08)] sm:p-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue">
          Page not found
        </p>
        <h1 className="mt-3 font-serif text-3xl text-ink sm:text-4xl">
          This public route is not available.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">
          The research library and research assistant remain available through the current public routes.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href={CANONICAL_ROUTES.library}
            className="inline-flex items-center gap-2 bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
          >
            <BookOpen className="h-4 w-4" />
            Browse the library
          </Link>
          <Link
            href={CANONICAL_ROUTES.home}
            className="inline-flex items-center gap-2 border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-blue focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2"
          >
            <Home className="h-4 w-4" />
            Return home
          </Link>
        </div>
      </section>
    </main>
  );
}
