import type { ReactNode } from "react";

export interface MetadataItem {
  label: string;
  value?: ReactNode;
}

export interface MetadataGridProps {
  items: MetadataItem[];
  className?: string;
}

export function MetadataGrid({ items, className = "" }: MetadataGridProps) {
  const visibleItems = items.filter(
    (item) =>
      item.value !== undefined && item.value !== null && item.value !== "",
  );

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <dl
      className={`grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 ${className}`}
    >
      {visibleItems.map((item) => (
        <div key={item.label} className="min-w-0 bg-white px-4 py-3.5">
          <dt className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-muted">
            {item.label}
          </dt>
          <dd className="mt-1 break-words text-sm leading-6 text-ink">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

