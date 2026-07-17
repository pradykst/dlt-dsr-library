import type { ReactNode } from "react";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  compact?: boolean;
}

export function EmptyState({
  title,
  description,
  action,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={`rounded-2xl border border-dashed border-line bg-white/70 text-center ${
        compact ? "px-5 py-7" : "px-6 py-12"
      }`}
    >
      <div
        aria-hidden="true"
        className="mx-auto mb-4 grid h-10 w-10 place-items-center rounded-full border border-line bg-paper text-lg text-muted"
      >
        ∅
      </div>
      <h2 className="font-serif text-xl font-semibold text-ink">{title}</h2>
      {description ? (
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

