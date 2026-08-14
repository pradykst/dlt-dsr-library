import Link from "next/link";
import type { ReactNode } from "react";

import type { ConceptSummaryDto } from "../shared/types.ts";
import { conceptHref } from "../shared/links.ts";
import { TypeBadge } from "./TypeBadge.tsx";

export interface ConceptCardProps {
  concept: ConceptSummaryDto;
  meta?: ReactNode;
  footer?: ReactNode;
  compact?: boolean;
  showTypeBadge?: boolean;
}

export function ConceptCard({
  concept,
  meta,
  footer,
  compact = false,
  showTypeBadge = true,
}: ConceptCardProps) {
  return (
    <article className="group flex h-full min-w-0 flex-col rounded-2xl border border-line bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue/40 hover:shadow-research">
      <Link
        className={`flex flex-1 flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-blue focus-visible:ring-offset-2 ${
          compact ? "p-4" : "p-5 sm:p-6"
        }`}
        href={conceptHref(concept.id)}
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {showTypeBadge ? (
            <TypeBadge type={concept.type} label={concept.typeLabel} />
          ) : null}
          {meta ? <div className="text-xs text-muted">{meta}</div> : null}
        </div>

        <h3
          className={`font-serif font-semibold leading-snug text-ink transition-colors group-hover:text-blue ${
            compact ? "text-lg" : "text-xl"
          }`}
        >
          {concept.title}
        </h3>
        {concept.description ? (
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">
            {concept.description}
          </p>
        ) : null}

        {concept.tags.length > 0 ? (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-5" aria-label="Tags">
            {concept.tags.slice(0, compact ? 2 : 4).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-slate-100 px-2 py-1 text-[0.68rem] font-medium text-slate-600"
              >
                {tag}
              </span>
            ))}
            {concept.tags.length > (compact ? 2 : 4) ? (
              <span className="px-1 py-1 text-[0.68rem] font-semibold text-muted">
                +{concept.tags.length - (compact ? 2 : 4)}
              </span>
            ) : null}
          </div>
        ) : null}
      </Link>
      {footer ? (
        <div className="border-t border-line px-5 py-3 text-sm text-muted">
          {footer}
        </div>
      ) : null}
    </article>
  );
}
