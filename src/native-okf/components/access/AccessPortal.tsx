"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";

import {
  NATIVE_OKF_API_ROUTES,
  NATIVE_OKF_PUBLIC_ROUTES,
} from "../../shared/routes.ts";

type AccessMode = "disabled" | "test" | "invite";

interface AccessQuota {
  questionsRemainingToday?: number;
  diagramsRemainingToday?: number;
  questionsRemainingTotal?: number;
  diagramsRemainingTotal?: number;
  resetAtMs?: number;
  accessExpiresAtMs?: number | null;
}

interface AccessResponse {
  chatEnabled: boolean;
  accessMode: AccessMode;
  authenticated: boolean;
  status: string;
  quota?: AccessQuota;
}

const STATUS_COPY: Record<string, string> = {
  authenticated: "Research access is active.",
  available: "Enter your evaluation access code.",
  disabled: "The grounded assistant is currently paused.",
  exhausted: "The available evaluation quota has been used.",
  expired: "This evaluation access has expired.",
  revoked: "This evaluation access is no longer active.",
  unauthenticated: "Enter your evaluation access code.",
};

function statusCopy(status: string, chatEnabled: boolean) {
  if (!chatEnabled) {
    return STATUS_COPY.disabled;
  }

  return STATUS_COPY[status] ?? "Research access is unavailable.";
}

function modeLabel(mode: AccessMode) {
  if (mode === "test") {
    return "Private test";
  }

  if (mode === "invite") {
    return "Invitation";
  }

  return "Disabled";
}

function formatDate(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function QuotaSummary({ quota }: { quota: AccessQuota }) {
  const expiry = formatDate(quota.accessExpiresAtMs);
  const reset = formatDate(quota.resetAtMs);
  const items = [
    ["Questions today", quota.questionsRemainingToday],
    ["Diagrams today", quota.diagramsRemainingToday],
    ["Questions total", quota.questionsRemainingTotal],
    ["Diagrams total", quota.diagramsRemainingTotal],
  ].filter((item): item is [string, number] => typeof item[1] === "number");

  if (items.length === 0 && !expiry && !reset) {
    return null;
  }

  return (
    <section
      aria-labelledby="native-okf-quota-title"
      className="rounded-2xl border border-line bg-slate-50 p-5"
    >
      <h2
        id="native-okf-quota-title"
        className="text-sm font-bold uppercase tracking-[0.14em] text-slate-600"
      >
        Remaining evaluation quota
      </h2>
      {items.length > 0 ? (
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {items.map(([label, value]) => (
            <div key={label} className="rounded-xl bg-white px-4 py-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {label}
              </dt>
              <dd className="mt-1 text-xl font-semibold text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {reset || expiry ? (
        <div className="mt-4 space-y-1 text-xs leading-5 text-slate-600">
          {reset ? <p>Daily quota resets {reset}.</p> : null}
          {expiry ? <p>Access expires {expiry}.</p> : null}
        </div>
      ) : null}
    </section>
  );
}

export function AccessPortal() {
  const [access, setAccess] = useState<AccessResponse | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const loadAccess = useCallback(async (signal?: AbortSignal) => {

    try {
      const response = await fetch(NATIVE_OKF_API_ROUTES.access, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        signal,
      });

      if (!response.ok) {
        throw new Error("Access status request failed.");
      }

      setAccess((await response.json()) as AccessResponse);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      setAccess(null);
      setNotice("Research access could not be checked. Please try again.");
    } finally {
      if (!signal?.aborted) {
        setBusy(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void loadAccess(controller.signal), 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadAccess]);

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedCode = code.trim();

    if (!normalizedCode) {
      setNotice("Enter an access code.");
      return;
    }

    setBusy(true);
    setNotice(null);

    try {
      const response = await fetch(NATIVE_OKF_API_ROUTES.access, {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: normalizedCode }),
      });

      setCode("");

      if (!response.ok) {
        setNotice("The access code could not be accepted.");
        return;
      }

      await loadAccess();
      setNotice("Research access status updated.");
    } catch {
      setCode("");
      setNotice("Research access could not be updated. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    setNotice(null);

    try {
      const response = await fetch(NATIVE_OKF_API_ROUTES.access, {
        method: "DELETE",
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Logout failed.");
      }

      await loadAccess();
      setNotice("Research access ended on this browser.");
    } catch {
      setNotice("Research access could not be ended. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue">
              Limited researcher evaluation
            </p>
            <h2 className="mt-2 font-serif text-3xl font-semibold text-ink">
              Grounded chat access
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Access controls apply only to the paid grounded assistant. The
              native paper and concept library remains available separately.
            </p>
          </div>
          {access ? (
            <span className="rounded-full border border-line bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
              {modeLabel(access.accessMode)}
            </span>
          ) : null}
        </div>

        <div
          aria-live="polite"
          className="mt-6 rounded-2xl border border-line bg-slate-50 px-4 py-3 text-sm text-slate-700"
        >
          {busy && !access
            ? "Checking research access..."
            : access
              ? statusCopy(access.status, access.chatEnabled)
              : "Research access status is unavailable."}
        </div>

        {notice ? (
          <p
            role="status"
            className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            {notice}
          </p>
        ) : null}

        {access?.authenticated && access.chatEnabled ? (
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={NATIVE_OKF_PUBLIC_ROUTES.chat}
              className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2"
            >
              Open grounded chat
            </Link>
            <button
              type="button"
              disabled={busy}
              onClick={() => void logout()}
              className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-blue/40 hover:text-blue focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              End access
            </button>
          </div>
        ) : access?.chatEnabled && access.accessMode !== "disabled" ? (
          <form className="mt-6 space-y-4" onSubmit={submitCode}>
            <div>
              <label
                htmlFor="native-okf-access-code"
                className="block text-sm font-semibold text-ink"
              >
                Evaluation access code
              </label>
              <input
                id="native-okf-access-code"
                type="password"
                autoComplete="one-time-code"
                required
                value={code}
                onChange={(event) => setCode(event.target.value)}
                disabled={busy}
                className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-base text-ink outline-none transition placeholder:text-slate-400 focus:border-blue focus:ring-2 focus:ring-blue/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                placeholder="Enter your code"
              />
            </div>
            <button
              type="submit"
              disabled={busy || code.trim().length === 0}
              className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Checking..." : "Continue"}
            </button>
          </form>
        ) : null}
      </section>

      {access?.authenticated && access.quota ? (
        <QuotaSummary quota={access.quota} />
      ) : null}
    </div>
  );
}

