import type { Metadata } from "next";

import { PaperLibrary } from "@/src/native-okf/components/PaperLibrary";
import { getLibraryViewModel } from "@/src/native-okf/server/workbench";

export const runtime = "nodejs";
export const metadata: Metadata = {
  title: "Design knowledge library",
  description:
    "Browse research papers and represented design knowledge in the DSR Knowledge Library.",
  alternates: { canonical: "/library" },
};

export const dynamic = "force-dynamic";

export default async function NativeOkfLibraryPage() {
  const library = await getLibraryViewModel();

  return (
    <main>
      <section className="border-b border-slate-200/80 bg-[radial-gradient(circle_at_top_left,rgba(79,111,145,0.17),transparent_34%),radial-gradient(circle_at_85%_20%,rgba(119,101,143,0.13),transparent_28%)]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <h1 className="max-w-3xl font-serif text-4xl font-semibold leading-tight text-slate-950 sm:text-6xl">
            {library.title}
          </h1>
        </div>
      </section>

      <section id="papers" className="mx-auto max-w-7xl scroll-mt-6 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue">
              Paper library
            </p>
            <h2 className="mt-2 font-serif text-3xl font-semibold text-slate-950">
              Research papers
            </h2>
          </div>
          <p className="max-w-lg text-sm leading-6 text-slate-600">
            Search by title or publication metadata, then open a paper to inspect its represented design knowledge and semantic map.
          </p>
        </div>

        <PaperLibrary library={library} />
      </section>
    </main>
  );
}
