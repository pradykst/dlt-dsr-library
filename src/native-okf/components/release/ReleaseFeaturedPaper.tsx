import Link from "next/link";

import { paperHref } from "../../shared/routes.ts";
import type { PaperCardDto } from "../../shared/types.ts";

export function ReleaseFeaturedPaper({ paper }: { paper: PaperCardDto }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
        {paper.year ? <span>{paper.year}</span> : null}
        {paper.year && paper.venue ? <span aria-hidden="true">·</span> : null}
        {paper.venue ? <span>{paper.venue}</span> : null}
      </div>
      <h3 className="mt-3 font-serif text-xl font-semibold leading-snug text-slate-950">
        <Link
          href={paperHref(paper.id)}
          className="rounded outline-none transition hover:text-blue focus-visible:ring-2 focus-visible:ring-blue/30"
        >
          {paper.title}
        </Link>
      </h3>
      <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Stored native concept counts">
        {paper.linkedTypeCounts.map((entry) => (
          <span
            key={entry.type}
            className="rounded-md bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200"
          >
            {entry.label} · {entry.count}
          </span>
        ))}
      </div>
      {paper.tags.length > 0 ? (
        <div className="mt-auto flex flex-wrap gap-1.5 pt-5" aria-label="Paper tags">
          {paper.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-500"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}
    </article>
  );
}
