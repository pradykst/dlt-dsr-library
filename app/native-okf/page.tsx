import { PaperLibrary } from "@/src/native-okf/components/PaperLibrary";
import { getLibraryViewModel } from "@/src/native-okf/server/workbench";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function NativeOkfLibraryPage() {
  const library = await getLibraryViewModel();

  return (
    <main>
      <section className="border-b border-slate-200/80 bg-[radial-gradient(circle_at_top_left,rgba(79,111,145,0.17),transparent_34%),radial-gradient(circle_at_85%_20%,rgba(119,101,143,0.13),transparent_28%)]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-blue">
              <span>Native Google OKF</span>
              {library.version ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Version {library.version}</span>
                </>
              ) : null}
            </div>
            <h1 className="mt-4 max-w-3xl font-serif text-4xl font-semibold leading-tight text-slate-950 sm:text-6xl">
              {library.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Browse the canonical Markdown bundle directly. Every paper, concept, and relationship below is derived from native OKF frontmatter and links.
            </p>
          </div>

          <dl className="mt-10 grid max-w-3xl gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard label="Paper concepts" value={library.paperCount} />
            <StatCard label="Design-knowledge concepts" value={library.designKnowledgeCount} />
            <StatCard label="Native concept types" value={library.typeCounts.length} />
          </dl>

          <div className="mt-7 flex flex-wrap gap-2" aria-label="Concept counts by native type">
            {library.typeCounts.map((entry) => (
              <span
                key={entry.type}
                title={entry.type}
                className="rounded-full border border-white/80 bg-white/75 px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm backdrop-blur"
              >
                {entry.label} <strong className="ml-1 text-slate-950">{entry.count}</strong>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="papers" className="mx-auto max-w-7xl scroll-mt-6 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
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
            Search producer metadata, then open any paper to inspect its Markdown, linked knowledge, relationships, and local graph.
          </p>
        </div>

        <PaperLibrary library={library} />
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/80 px-5 py-4 shadow-sm backdrop-blur">
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 font-serif text-3xl font-semibold text-slate-950">{value}</dd>
    </div>
  );
}
