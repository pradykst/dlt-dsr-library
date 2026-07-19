"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useCallback, useEffect, useState } from "react";

import {
  NATIVE_OKF_API_ROUTES,
  NATIVE_OKF_PUBLIC_ROUTES,
} from "../../shared/routes.ts";

interface AdminSessionResponse {
  authenticated: boolean;
  status?: string;
}

export function AdminAccessPortal() {
  const [session, setSession] = useState<AdminSessionResponse | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const loadSession = useCallback(async (signal?: AbortSignal) => {

    try {
      const response = await fetch(NATIVE_OKF_API_ROUTES.adminSession, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        signal,
      });

      if (!response.ok) {
        throw new Error("Administrator session request failed.");
      }

      setSession((await response.json()) as AdminSessionResponse);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      setSession(null);
      setNotice("Administrator access could not be checked.");
    } finally {
      if (!signal?.aborted) {
        setBusy(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void loadSession(controller.signal), 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadSession]);

  async function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedCode = code.trim();

    if (!normalizedCode) {
      setNotice("Enter the administrator access code.");
      return;
    }

    setBusy(true);
    setNotice(null);

    try {
      const response = await fetch(NATIVE_OKF_API_ROUTES.adminSession, {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: normalizedCode }),
      });

      setCode("");

      if (!response.ok) {
        setNotice("Administrator access could not be granted.");
        return;
      }

      window.location.assign(NATIVE_OKF_PUBLIC_ROUTES.admin);
    } catch {
      setCode("");
      setNotice("Administrator access could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    setNotice(null);

    try {
      const response = await fetch(NATIVE_OKF_API_ROUTES.adminSession, {
        method: "DELETE",
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Administrator logout failed.");
      }

      setSession({ authenticated: false });
      setNotice("Administrator session ended.");
    } catch {
      setNotice("Administrator session could not be ended.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-xl rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue">
        Private administration
      </p>
      <h2 className="mt-2 font-serif text-3xl font-semibold text-ink">
        Evaluation controls
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        This private session exposes aggregate usage and invitation controls.
        It never displays research questions, generated answers, context,
        credentials, network addresses, or provider-account details.
      </p>

      <div
        aria-live="polite"
        className="mt-6 rounded-2xl border border-line bg-slate-50 px-4 py-3 text-sm text-slate-700"
      >
        {busy && !session
          ? "Checking administrator access..."
          : session?.authenticated
            ? "Administrator access is active."
            : "Administrator authentication is required."}
      </div>

      {notice ? (
        <p
          role="status"
          className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          {notice}
        </p>
      ) : null}

      {session?.authenticated ? (
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={NATIVE_OKF_PUBLIC_ROUTES.admin}
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2"
          >
            Open dashboard
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            disabled={busy}
            className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-blue/40 hover:text-blue focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            End administrator session
          </button>
        </div>
      ) : (
        <form className="mt-6 space-y-4" onSubmit={submitCode}>
          <div>
            <label
              htmlFor="native-okf-admin-code"
              className="block text-sm font-semibold text-ink"
            >
              Administrator access code
            </label>
            <input
              id="native-okf-admin-code"
              type="password"
              autoComplete="current-password"
              required
              value={code}
              onChange={(event) => setCode(event.target.value)}
              disabled={busy}
              className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-base text-ink outline-none transition placeholder:text-slate-400 focus:border-blue focus:ring-2 focus:ring-blue/20 disabled:cursor-not-allowed disabled:bg-slate-100"
              placeholder="Enter administrator code"
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
      )}
    </section>
  );
}

