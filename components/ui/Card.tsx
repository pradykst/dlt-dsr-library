import { clsx } from "clsx";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={clsx("border border-line bg-white shadow-research", className)}>{children}</section>;
}
