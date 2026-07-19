import Link from "next/link";

import type { ReleaseHomeViewModel } from "../../server/release-home.ts";
import { NATIVE_OKF_PUBLIC_ROUTES as CANONICAL_ROUTES } from "../../shared/routes.ts";
import { ReleaseFeaturedPaper } from "./ReleaseFeaturedPaper";
import { ReleaseSemanticMotif } from "./ReleaseSemanticMotif";

const CAPABILITIES = [
  {
    title: "Inspect paper-level design maps",
    description:
      "View the native requirements, objectives, principles, and features stored for a paper, then inspect source paths and technical raw links.",
  },
  {
    title: "Search reusable design knowledge",
    description:
      "Retrieve linked concepts across the corpus and compare represented mechanisms, requirements, and design approaches.",
  },
  {
    title: "Generate grounded decision-support flows",
    description:
      "Combine retrieved knowledge into proposed artifact directions while keeping stored concepts visibly distinct from synthesis.",
  },
  {
    title: "Verify grounding",
    description:
      "Open cited native concepts, follow their source paths, and consult original publication resources where available.",
  },
] as const;

const SYSTEM_STEPS = [
  "Native OKF Markdown",
  "Local parser and graph",
  "Bounded retrieval",
  "Source-grounded synthesis",
  "Validated interactive flow",
] as const;

export function ReleaseHomepage({ viewModel }: { viewModel: ReleaseHomeViewModel }) {
  return (
    <main>
      <section className="overflow-hidden border-b border-slate-200/80 bg-[radial-gradient(circle_at_top_left,rgba(79,111,145,0.17),transparent_34%),radial-gradient(circle_at_85%_20%,rgba(119,101,143,0.13),transparent_28%)]">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.03fr_0.97fr] lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue">
              Open design knowledge for Design Science Research
            </p>
            <h1 className="mt-4 max-w-3xl font-serif text-4xl font-semibold leading-tight text-slate-950 sm:text-6xl">
              Explore, connect, and reuse design knowledge from DSR papers.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              The DSR Knowledge Library represents requirements, objectives, principles,
              features, and their relationships as linked native OKF concepts. Researchers
              can inspect individual papers, compare reusable knowledge across studies, and
              generate source-grounded decision-support flows.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={CANONICAL_ROUTES.library}
                className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm outline-none transition hover:bg-blue focus-visible:ring-2 focus-visible:ring-blue/40 focus-visible:ring-offset-2"
              >
                Browse the library
              </Link>
              <Link
                href={CANONICAL_ROUTES.chat}
                className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 outline-none transition hover:border-blue/50 hover:text-blue focus-visible:ring-2 focus-visible:ring-blue/30 focus-visible:ring-offset-2"
              >
                Open grounded chat
              </Link>
              <Link
                href={CANONICAL_ROUTES.access}
                className="rounded px-2 py-2 text-sm font-semibold text-blue outline-none hover:underline focus-visible:ring-2 focus-visible:ring-blue/30"
              >
                Request evaluation access
              </Link>
            </div>
          </div>
          <ReleaseSemanticMotif />
        </div>
      </section>

      <section aria-labelledby="corpus-metrics-title" className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 id="corpus-metrics-title" className="sr-only">Current corpus metrics</h2>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {viewModel.metricCards.map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
              <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                {metric.label}
              </dt>
              <dd className="mt-2 font-serif text-3xl font-semibold text-slate-950">
                {metric.value.toLocaleString("en")}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <SectionIntro
          eyebrow="Research workflows"
          title="What researchers can do"
          description="The interfaces expose what is currently represented without assuming that every paper contains every DSR category."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {CAPABILITIES.map((capability, index) => (
            <article key={capability.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-3 font-serif text-2xl font-semibold text-slate-950">
                {capability.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{capability.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50/80">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <SectionIntro
            eyebrow="Grounded architecture"
            title="How it works"
            description="The research workflow remains traceable from the local knowledge representation through retrieval and validated presentation."
          />
          <ol className="mt-8 grid gap-3 md:grid-cols-5">
            {SYSTEM_STEPS.map((step, index) => (
              <li key={step} className="relative rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold leading-6 text-slate-800 shadow-sm">
                <span className="block text-xs font-semibold text-blue">{index + 1}</span>
                <span className="mt-1 block">{step}</span>
                {index < SYSTEM_STEPS.length - 1 ? (
                  <span aria-hidden="true" className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 text-slate-400 md:block">→</span>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <SectionIntro
            eyebrow="Representative records"
            title="Featured papers"
            description="Selected deterministically from papers with richer linked native-concept coverage; this is not a scientific ranking."
          />
          <Link
            href={CANONICAL_ROUTES.library}
            className="rounded text-sm font-semibold text-blue outline-none hover:underline focus-visible:ring-2 focus-visible:ring-blue/30"
          >
            View all papers →
          </Link>
        </div>
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {viewModel.featuredPapers.map((paper) => (
            <ReleaseFeaturedPaper key={paper.id} paper={paper} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 sm:pb-16 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-2">
          <article className="rounded-3xl border border-slate-200 bg-slate-950 p-7 text-white sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
              Grounding and research integrity
            </p>
            <h2 className="mt-3 font-serif text-3xl font-semibold">Inspect the evidence behind a response.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Stored native concepts and generated synthesis are identified separately.
              Citations resolve to allowlisted source records, while no-match handling avoids
              outside-scope answers. Model output is research support, not an authoritative finding.
            </p>
            <Link
              href={CANONICAL_ROUTES.method}
              className="mt-6 inline-flex rounded text-sm font-semibold text-white underline decoration-slate-500 underline-offset-4 outline-none hover:decoration-white focus-visible:ring-2 focus-visible:ring-white/60"
            >
              Read the method and limitations
            </Link>
          </article>

          <article className="rounded-3xl border border-blue/20 bg-blue/5 p-7 sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue">
              Invited evaluation
            </p>
            <h2 className="mt-3 font-serif text-3xl font-semibold text-slate-950">
              Evaluate the research prototype
            </h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Invited researchers can use the grounded assistant under controlled access,
              quota, and privacy-preserving usage measurement. Questions and answers are not
              persisted by the operational quota system. Cited knowledge should still be checked.
            </p>
            <Link
              href={CANONICAL_ROUTES.access}
              className="mt-6 inline-flex rounded-full bg-blue px-5 py-3 text-sm font-semibold text-white outline-none transition hover:bg-slate-950 focus-visible:ring-2 focus-visible:ring-blue/40 focus-visible:ring-offset-2"
            >
              Enter evaluation access
            </Link>
          </article>
        </div>

        <aside className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-950">
          <strong>Research notice.</strong>{" "}
          This research prototype is undergoing knowledge-curation and researcher evaluation.
          Generated responses should be checked against the cited design knowledge and original publications.
        </aside>
      </section>
    </main>
  );
}

function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue">{eyebrow}</p>
      <h2 className="mt-2 font-serif text-3xl font-semibold text-slate-950 sm:text-4xl">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">{description}</p>
    </div>
  );
}
