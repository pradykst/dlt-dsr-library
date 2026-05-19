import { clsx } from "clsx";

export function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center border border-line bg-paper px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted", className)}>
      {children}
    </span>
  );
}
