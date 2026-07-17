const TYPE_STYLES: Record<string, string> = {
  paper: "border-blue/25 bg-blue/10 text-blue",
  reference: "border-slate-300 bg-slate-100 text-slate-700",
  "design-principle": "border-purple/25 bg-purple/10 text-purple",
  "design-feature": "border-green/25 bg-green/10 text-green",
  "design-objective": "border-amber/25 bg-amber/10 text-amber",
  "design-requirement": "border-rose-300 bg-rose-50 text-rose-700",
  "meta-requirement": "border-cyan-300 bg-cyan-50 text-cyan-800",
  "design-goal": "border-indigo-300 bg-indigo-50 text-indigo-700",
};

export interface TypeBadgeProps {
  type: string;
  label?: string;
  count?: number;
  className?: string;
}

export function formatOkfTypeLabel(type: string): string {
  return type
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function TypeBadge({
  type,
  label = formatOkfTypeLabel(type),
  count,
  className = "",
}: TypeBadgeProps) {
  const color =
    TYPE_STYLES[type.toLowerCase()] ??
    "border-slate-300 bg-white text-slate-700";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold leading-none ${color} ${className}`}
    >
      <span>{label}</span>
      {count !== undefined ? (
        <span className="font-mono text-[0.68rem] opacity-70">{count}</span>
      ) : null}
    </span>
  );
}

