import Link from "next/link";

import { NATIVE_OKF_EVALUATION_SURVEY_URL } from "../../shared/public-links.ts";
import { NATIVE_OKF_PUBLIC_ROUTES as CANONICAL_ROUTES } from "../../shared/routes.ts";

const METHOD_SECTIONS = [
  {
    id: "purpose",
    title: "Purpose of the artifact",
    body: "The DSR Knowledge Library is a research prototype for inspecting and reusing represented design knowledge from a curated paper corpus. It supports exploration and comparison; it does not replace close reading of the original publications.",
  },
  {
    id: "representation",
    title: "Native OKF representation",
    body: "Paper records and producer-defined design-knowledge concepts are stored as native Open Knowledge Format Markdown. The local parser preserves open-ended frontmatter and resolves internal Markdown links into a directed graph without forcing every paper into one fixed DSR taxonomy.",
  },
  {
    id: "stored-and-synthesis",
    title: "Stored knowledge and generated synthesis",
    body: "Stored concepts come directly from the curated bundle. A generated flow may combine compatible stored knowledge into a proposed direction; those synthesis nodes are marked separately and must not be read as claims that a paper already contains the proposed artifact.",
  },
  {
    id: "grounding",
    title: "Grounding and citation validation",
    body: "Local retrieval selects a bounded set of native concepts. Backend code assigns citation IDs, checks generated citations against that allowlist, and validates every diagram source path. This supports traceability to concept records, not page-level verification of an original publication.",
  },
  {
    id: "paper-views",
    title: "Paper design maps and Raw links",
    body: "The default design map presents the semantic native types actually represented for a paper in readable columns. Raw links is a separate technical view of resolved Markdown relationships, including relationships that are intentionally omitted from the semantic projection.",
  },
  {
    id: "no-match",
    title: "No-match behavior",
    body: "When deterministic retrieval finds insufficient library evidence, the assistant returns an insufficient-context result without asking the model to answer from outside knowledge. Weak or absent context is not treated as permission to invent a response.",
  },
  {
    id: "limitations",
    title: "Corpus-curation limitations",
    body: "Native format and link validity do not imply complete semantic coverage. Some papers currently represent only a subset of the design requirements, objectives, principles, features, or other knowledge described by their publications. Coverage auditing reports potential gaps for later paper-by-paper curation; the interface does not fill them automatically.",
  },
  {
    id: "evaluation",
    title: "Researcher-evaluation status",
    body: "The prototype is being evaluated with researchers. Participants should explore the library and grounded assistant before responding in the external survey. Generated output remains non-authoritative, and generated synthesis remains subject to researcher review against cited concepts and the original papers.",
  },
  {
    id: "privacy",
    title: "Operational privacy",
    body: "Evaluation access is invitation-controlled. The operational access and quota store records counters, token usage, estimated cost, safe outcomes, and privacy-preserving identifiers. It does not persist questions, answers, conversation history, retrieved source text, or credentials. Chat history remains in bounded browser session storage for the current tab.",
  },
] as const;

export function ReleaseMethod() {
  return (
    <main>
      <section className="border-b border-slate-200/80 bg-[radial-gradient(circle_at_top_left,rgba(79,111,145,0.15),transparent_35%)]">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue">
            Method and limitations
          </p>
          <h1 className="mt-4 max-w-3xl font-serif text-4xl font-semibold leading-tight text-slate-950 sm:text-6xl">
            How the research prototype represents and grounds design knowledge.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
            This page explains the current artifact boundary, what its source validation can establish,
            and where researcher judgement and further corpus curation remain necessary.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={CANONICAL_ROUTES.library}
              className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white outline-none transition hover:bg-blue focus-visible:ring-2 focus-visible:ring-blue/40 focus-visible:ring-offset-2"
            >
              Browse the library
            </Link>
            <Link
              href={CANONICAL_ROUTES.chat}
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 outline-none transition hover:border-blue/50 hover:text-blue focus-visible:ring-2 focus-visible:ring-blue/30 focus-visible:ring-offset-2"
            >
              Open grounded chat
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8">
        <nav aria-label="On this page" className="self-start rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:sticky lg:top-24">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">On this page</p>
          <ul className="mt-3 space-y-1">
            {METHOD_SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="block rounded-lg px-2 py-1.5 text-sm text-slate-600 outline-none hover:bg-white hover:text-blue focus-visible:ring-2 focus-visible:ring-blue/30"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-5">
          {METHOD_SECTIONS.map((section) => (
            <section
              key={section.id}
              id={section.id}
              className="scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
            >
              <h2 className="font-serif text-2xl font-semibold text-slate-950 sm:text-3xl">
                {section.title}
              </h2>
              <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">{section.body}</p>
              {section.id === "evaluation" ? (
                <a
                  href={NATIVE_OKF_EVALUATION_SURVEY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Open the external evaluation survey in a new tab"
                  className="mt-4 inline-block text-sm font-semibold text-blue underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
                >
                  Open evaluation survey {"\u2197"}
                </a>
              ) : null}
            </section>
          ))}

          <aside className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-950">
            <strong>Research notice.</strong>{" "}
            This research prototype is undergoing knowledge-curation and researcher evaluation.
            Generated responses should be checked against the cited design knowledge and original publications.
          </aside>
        </div>
      </div>
    </main>
  );
}
