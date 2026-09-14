import Link from "next/link";

import { paperHref } from "../shared/routes.ts";
import { formatConceptCount } from "../shared/presentation.ts";
import type { PaperCardDto } from "../shared/types.ts";

export function PaperCard({ paper }: { paper: PaperCardDto }) {
  return (
    <article className="h-full min-w-0">
      <Link
        href={paperHref(paper.id)}
        className="group flex h-full min-w-0 cursor-pointer flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm outline-none transition duration-200 hover:-translate-y-0.5 hover:border-blue/35 hover:shadow-lg focus-visible:border-blue focus-visible:ring-2 focus-visible:ring-blue/35 focus-visible:ring-offset-2 sm:p-6"
      >
        <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
          {paper.year ? <span>{paper.year}</span> : null}
          {paper.year && paper.venue ? <span aria-hidden="true">{"\u2022"}</span> : null}
          {paper.venue ? <span className="line-clamp-1">{paper.venue}</span> : null}
        </div>

        <h2 className="mt-3 font-serif text-xl font-semibold leading-snug text-slate-950 transition group-hover:text-blue sm:text-2xl">
          {paper.title}
        </h2>

        {paper.authors.length > 0 ? (
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {paper.authors.join(", ")}
          </p>
        ) : null}

        {paper.description ? (
          <p className="mt-4 line-clamp-4 text-sm leading-6 text-slate-700">
            {paper.description}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-1.5">
          {paper.tags.slice(0, 6).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600"
            >
              {tag}
            </span>
          ))}
          {paper.tags.length > 6 ? (
            <span className="rounded-full px-2 py-1 text-xs text-slate-500">
              +{paper.tags.length - 6}
            </span>
          ) : null}
        </div>

        <div className="mt-auto pt-6">
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Linked design knowledge
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {paper.linkedTypeCounts.map((entry) => (
                <span
                  key={entry.type}
                  title={entry.type}
                  className="rounded-md bg-white px-2 py-1 text-[11px] font-medium text-slate-600 shadow-sm ring-1 ring-slate-200"
                >
                  {formatConceptCount(entry.type, entry.count)}
                </span>
              ))}
            </div>
          </div>

          <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue transition group-hover:gap-3">
            Open paper <span aria-hidden="true">{"\u2192"}</span>
          </span>
        </div>
      </Link>
    </article>
  );
}
