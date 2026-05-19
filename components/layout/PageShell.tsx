import { clsx } from "clsx";

export function PageShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <main className={clsx("mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8", className)}>{children}</main>;
}
