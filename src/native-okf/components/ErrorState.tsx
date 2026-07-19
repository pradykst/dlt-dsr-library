import Link from "next/link";

import { NATIVE_OKF_PUBLIC_ROUTES } from "../shared/routes.ts";

export interface ErrorStateProps {
  title?: string;
  message: string;
  actionHref?: string;
  actionLabel?: string;
}

export function ErrorState({
  title = "This OKF view could not be loaded",
  message,
  actionHref = NATIVE_OKF_PUBLIC_ROUTES.library,
  actionLabel = "Return to the OKF library",
}: ErrorStateProps) {
  return (
    <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-8">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-700">
        Native OKF error
      </p>
      <h2 className="mt-2 font-serif text-2xl font-semibold text-ink">
        {title}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-700">
        {message}
      </p>
      <Link
        className="mt-6 inline-flex rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2"
        href={actionHref}
      >
        {actionLabel}
      </Link>
    </div>
  );
}
