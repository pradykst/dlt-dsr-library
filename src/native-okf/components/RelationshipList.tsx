import Link from "next/link";

import { conceptHref, isSafeExternalHref } from "../shared/links.ts";
import type { RelationshipDto } from "../shared/types.ts";
import { EmptyState } from "./EmptyState.tsx";
import { TypeBadge } from "./TypeBadge.tsx";

export interface RelationshipListProps {
  relationships: RelationshipDto[];
  title?: string;
  emptyMessage?: string;
}

function relationshipHref(
  relationship: RelationshipDto,
): { href: string; external: boolean } | undefined {
  if (relationship.external) {
    return isSafeExternalHref(relationship.rawTarget)
      ? { href: relationship.rawTarget, external: true }
      : undefined;
  }
  if (!relationship.resolved || relationship.broken) {
    return undefined;
  }

  const endpointId =
    relationship.direction === "incoming"
      ? relationship.sourceId
      : relationship.targetId ?? relationship.targetPath;
  return endpointId
    ? { href: conceptHref(endpointId), external: false }
    : undefined;
}

export function RelationshipList({
  relationships,
  title,
  emptyMessage = "No relationships are recorded for this concept.",
}: RelationshipListProps) {
  if (relationships.length === 0) {
    return (
      <EmptyState
        compact
        title={title ?? "No relationships"}
        description={emptyMessage}
      />
    );
  }

  return (
    <section>
      {title ? (
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-serif text-2xl font-semibold text-ink">{title}</h2>
          <span className="font-mono text-xs text-muted">{relationships.length}</span>
        </div>
      ) : null}
      <ul className="space-y-3">
        {relationships.map((relationship, index) => {
          const destination = relationshipHref(relationship);
          const content = (
            <>
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line bg-paper text-sm text-muted"
                >
                  {relationship.direction === "incoming" ? "←" : "→"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium leading-6 text-ink">
                      {relationship.displayTitle}
                    </h3>
                    {relationship.displayType ? (
                      <TypeBadge type={relationship.displayType} />
                    ) : null}
                    {relationship.broken ? (
                      <span className="rounded-full bg-rose-100 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-rose-700">
                        Broken target
                      </span>
                    ) : null}
                    {relationship.external ? (
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-slate-600">
                        External
                      </span>
                    ) : null}
                  </div>
                  <dl className="mt-2 grid gap-x-3 gap-y-1 text-xs leading-5 text-muted sm:grid-cols-[auto_1fr]">
                    <div className="contents">
                      <dt className="font-semibold text-slate-500">Source</dt>
                      <dd className="break-words">{relationship.sourceTitle}</dd>
                    </div>
                    <div className="contents">
                      <dt className="font-semibold text-slate-500">Target</dt>
                      <dd className="break-words">{relationship.targetTitle}</dd>
                    </div>
                    <div className="contents">
                      <dt className="font-semibold text-slate-500">Link label</dt>
                      <dd className="break-words">
                        {relationship.label || "(empty label)"}
                      </dd>
                    </div>
                    <div className="contents">
                      <dt className="font-semibold text-slate-500">Status</dt>
                      <dd>
                        {relationship.broken
                          ? "Broken"
                          : relationship.resolved
                            ? "Resolved"
                            : "Unresolved"}
                      </dd>
                    </div>
                  </dl>
                  {relationship.relationHint ? (
                    <p className="mt-2 text-xs leading-5 text-muted">
                      Derived heading context: {relationship.relationHint}
                    </p>
                  ) : null}
                </div>
              </div>
            </>
          );

          return (
            <li
              key={`${relationship.direction}-${relationship.sourceId}-${relationship.rawTarget}-${index}`}
              className="rounded-xl border border-line bg-white transition-colors hover:border-blue/30"
            >
              {destination?.external ? (
                <a
                  className="flex p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue"
                  href={destination.href}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {content}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              ) : destination ? (
                <Link
                  className="flex p-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue"
                  href={destination.href}
                >
                  {content}
                </Link>
              ) : (
                <div className="flex p-4">{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
