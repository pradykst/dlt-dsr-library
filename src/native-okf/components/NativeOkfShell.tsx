import Link from "next/link";
import type { ReactNode } from "react";

import { NATIVE_OKF_PUBLIC_ROUTES } from "../shared/routes.ts";

export interface NativeOkfBreadcrumb {
  label: string;
  href?: string;
}

export interface NativeOkfShellProps {
  title: string;
  eyebrow?: string;
  description?: string;
  breadcrumbs?: NativeOkfBreadcrumb[];
  actions?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
}

export function NativeOkfShell({
  title,
  eyebrow = "Native Open Knowledge Format",
  description,
  breadcrumbs = [],
  actions,
  aside,
  children,
}: NativeOkfShellProps) {
  return (
    <main className="research-grid min-h-[70vh] border-b border-line">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-7 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted">
          <Link
            className="transition-colors hover:text-blue"
            href={NATIVE_OKF_PUBLIC_ROUTES.library}
          >
            OKF library
          </Link>
          {breadcrumbs.map((item) => (
            <span key={`${item.href ?? "current"}-${item.label}`} className="contents">
              <span aria-hidden="true" className="text-line">
                /
              </span>
              {item.href ? (
                <Link className="transition-colors hover:text-blue" href={item.href}>
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="text-ink">
                  {item.label}
                </span>
              )}
            </span>
          ))}
        </nav>

        <header className="mb-8 border-b border-line pb-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-4xl">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-blue">
                {eyebrow}
              </p>
              <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
                {title}
              </h1>
              {description ? (
                <p className="mt-4 max-w-3xl text-base leading-7 text-muted sm:text-lg">
                  {description}
                </p>
              ) : null}
            </div>
            {actions ? (
              <div className="flex shrink-0 flex-wrap items-center gap-3">
                {actions}
              </div>
            ) : null}
          </div>
        </header>

        {aside ? (
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
            <div className="min-w-0">{children}</div>
            <aside className="min-w-0 lg:sticky lg:top-6">{aside}</aside>
          </div>
        ) : (
          children
        )}
      </div>
    </main>
  );
}

