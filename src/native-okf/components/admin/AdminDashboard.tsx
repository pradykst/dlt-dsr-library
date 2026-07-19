"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  NATIVE_OKF_API_ROUTES,
  NATIVE_OKF_PUBLIC_ROUTES,
} from "../../shared/routes.ts";

interface DailyUsage {
  utcDay: string;
  questions: number;
  diagrams: number;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
  modelCalls: number;
  microdollars: number;
}

interface InvitationLimits {
  dailyQuestions: number;
  dailyDiagrams: number;
  totalQuestions: number;
  totalDiagrams: number;
  requestsPerMinute: number;
  cooldownSeconds: number;
  maxConcurrent: number;
}

interface InvitationQuota {
  questionsUsedToday: number;
  diagramsUsedToday: number;
  questionsUsedTotal: number;
  diagramsUsedTotal: number;
  questionsRemainingToday: number;
  diagramsRemainingToday: number;
  questionsRemainingTotal: number;
  diagramsRemainingTotal: number;
  resetAtMs: number;
  accessExpiresAtMs: number | null;
}

interface InvitationSummary {
  id: string;
  label: string;
  status: string;
  expiresAtMs: number;
  revokedAtMs: number | null;
  quotas: InvitationLimits;
  quota: InvitationQuota;
  attributedMicrodollars: number;
  lastUsedAtMs: number | null;
  createdAtMs: number;
}

interface AdminDashboardResponse {
  chatEnabled: boolean;
  accessMode: string;
  modelLabel?: string;
  dailyBudgetMicrodollars: number;
  monthlyBudgetMicrodollars: number;
  generatedAtMs: number;
  daily: DailyUsage[];
  estimatedMicrodollarsToday: number;
  estimatedMicrodollarsThisMonth: number;
  questionsToday: number;
  diagramsToday: number;
  modelCallsToday: number;
  activeReservations: number;
  activeReservedMicrodollars: number;
  unreconciledUsageEvents: number;
  recentErrors: Array<{ category: string; count: number }>;
  operationalPaused: boolean;
  remainingDailyMicrodollars: number;
  remainingMonthlyMicrodollars: number;
  invitations: InvitationSummary[];
}

interface QuotaAdjustmentDraft {
  dailyQuestions: string;
  dailyDiagrams: string;
  totalQuestions: string;
  totalDiagrams: string;
}

type AdminMutation =
  | { action: "pause" | "resume" }
  | { action: "revoke"; invitationId: string }
  | { action: "extend"; invitationId: string; days: number }
  | {
      action: "adjust";
      invitationId: string;
      patch: {
        dailyQuestions: number;
        dailyDiagrams: number;
        totalQuestions: number;
        totalDiagrams: number;
      };
    };

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

const integerFormatter = new Intl.NumberFormat("en-US");

function formatUsd(microdollars: number) {
  if (!Number.isFinite(microdollars)) {
    return "Unavailable";
  }

  return usdFormatter.format(microdollars / 1_000_000);
}

function formatInteger(value: number) {
  return Number.isFinite(value) ? integerFormatter.format(value) : "Unavailable";
}

function formatDateTime(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "Never";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatStatus(value: string) {
  const normalized = value.trim().replaceAll("-", " ").replaceAll("_", " ");
  return normalized
    ? normalized.charAt(0).toUpperCase() + normalized.slice(1)
    : "Unknown";
}

function clampPercent(used: number, limit: number) {
  if (!Number.isFinite(used) || !Number.isFinite(limit) || limit <= 0) {
    return 0;
  }

  return Math.min(100, Math.max(0, (used / limit) * 100));
}

function BudgetCard({
  title,
  used,
  limit,
  remaining,
}: {
  title: string;
  used: number;
  limit: number;
  remaining: number;
}) {
  const percent = clampPercent(used, limit);

  return (
    <article className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        <span className="text-xs text-slate-500">
          {formatUsd(remaining)} remaining
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold text-ink">
        {formatUsd(used)}
        <span className="ml-2 text-sm font-normal text-slate-500">
          of {formatUsd(limit)}
        </span>
      </p>
      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-label={title}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
      >
        <div
          className="h-full rounded-full bg-blue"
          style={{ width: `${percent}%` }}
        />
      </div>
    </article>
  );
}

function Metric({
  label,
  value,
  note,
}: {
  label: string;
  value: string | number;
  note?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <dt className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </dt>
      <dd className="mt-2 text-2xl font-semibold text-ink">{value}</dd>
      {note ? <dd className="mt-1 text-xs text-slate-500">{note}</dd> : null}
    </div>
  );
}

function draftFor(invitation: InvitationSummary): QuotaAdjustmentDraft {
  return {
    dailyQuestions: String(invitation.quotas.dailyQuestions),
    dailyDiagrams: String(invitation.quotas.dailyDiagrams),
    totalQuestions: String(invitation.quotas.totalQuestions),
    totalDiagrams: String(invitation.quotas.totalDiagrams),
  };
}

function parseQuotaValue(value: string) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

export function AdminDashboard() {
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<QuotaAdjustmentDraft | null>(null);

  const loadDashboard = useCallback(async (signal?: AbortSignal) => {

    try {
      const response = await fetch(NATIVE_OKF_API_ROUTES.adminDashboard, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        signal,
      });

      if (response.status === 401 || response.status === 403) {
        window.location.replace(NATIVE_OKF_PUBLIC_ROUTES.adminAccess);
        return;
      }

      if (!response.ok) {
        throw new Error("Dashboard request failed.");
      }

      setDashboard((await response.json()) as AdminDashboardResponse);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      setDashboard(null);
      setNotice("The administrative snapshot could not be loaded.");
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void loadDashboard(controller.signal), 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadDashboard]);

  const invitationCounts = useMemo(() => {
    const counts = {
      active: 0,
      expired: 0,
      exhausted: 0,
      revoked: 0,
    };

    for (const invitation of dashboard?.invitations ?? []) {
      if (invitation.status in counts) {
        counts[invitation.status as keyof typeof counts] += 1;
      }
    }

    return counts;
  }, [dashboard?.invitations]);

  async function mutate(body: AdminMutation, successMessage: string) {
    setBusyAction(
      "invitationId" in body ? `${body.action}:${body.invitationId}` : body.action,
    );
    setNotice(null);

    try {
      const response = await fetch(NATIVE_OKF_API_ROUTES.adminMutations, {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.status === 401 || response.status === 403) {
        window.location.replace(NATIVE_OKF_PUBLIC_ROUTES.adminAccess);
        return;
      }

      if (!response.ok) {
        throw new Error("Administrative mutation failed.");
      }

      setNotice(successMessage);
      setAdjustingId(null);
      setDraft(null);
      await loadDashboard();
    } catch {
      setNotice("The requested administrative change could not be applied.");
    } finally {
      setBusyAction(null);
    }
  }

  async function logout() {
    setBusyAction("logout");
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

      window.location.assign(NATIVE_OKF_PUBLIC_ROUTES.adminAccess);
    } catch {
      setNotice("The administrator session could not be ended.");
      setBusyAction(null);
    }
  }

  function startAdjustment(invitation: InvitationSummary) {
    if (adjustingId === invitation.id) {
      setAdjustingId(null);
      setDraft(null);
      return;
    }

    setAdjustingId(invitation.id);
    setDraft(draftFor(invitation));
  }

  async function submitAdjustment(
    event: FormEvent<HTMLFormElement>,
    invitation: InvitationSummary,
  ) {
    event.preventDefault();

    if (!draft) {
      return;
    }

    const dailyQuestions = parseQuotaValue(draft.dailyQuestions);
    const dailyDiagrams = parseQuotaValue(draft.dailyDiagrams);
    const totalQuestions = parseQuotaValue(draft.totalQuestions);
    const totalDiagrams = parseQuotaValue(draft.totalDiagrams);

    if (
      dailyQuestions === null ||
      dailyDiagrams === null ||
      totalQuestions === null ||
      totalDiagrams === null
    ) {
      setNotice("Quota values must be non-negative whole numbers.");
      return;
    }

    await mutate(
      {
        action: "adjust",
        invitationId: invitation.id,
        patch: {
          dailyQuestions,
          dailyDiagrams,
          totalQuestions,
          totalDiagrams,
        },
      },
      "Invitation quota updated.",
    );
  }

  if (loading && !dashboard) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-line bg-white p-8 text-sm text-slate-600"
      >
        Loading the safe administrative snapshot...
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-rose-200 bg-rose-50 p-6"
      >
        <h2 className="font-serif text-2xl font-semibold text-ink">
          Dashboard unavailable
        </h2>
        <p className="mt-2 text-sm text-slate-700">
          No administrative content is available. Try the request again.
        </p>
        <button
          type="button"
          onClick={() => void loadDashboard()}
          className="mt-4 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2"
        >
          Retry
        </button>
      </div>
    );
  }

  const environmentOverride =
    !dashboard.chatEnabled || dashboard.accessMode === "disabled";
  const operationalPaused = dashboard.operationalPaused;

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue">
              Private aggregate controls
            </p>
            <h2 className="mt-2 font-serif text-3xl font-semibold text-ink">
              Evaluation administration
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              This dashboard intentionally excludes questions, answers, context,
              invitation credentials, network identifiers, provider keys, and
              account details.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!environmentOverride ? (
              <button
                type="button"
                disabled={busyAction !== null}
                onClick={() =>
                  void mutate(
                    { action: operationalPaused ? "resume" : "pause" },
                    operationalPaused
                      ? "Operational pause cleared."
                      : "Operational pause enabled.",
                  )
                }
                className={
                  operationalPaused
                    ? "rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 disabled:opacity-60"
                    : "rounded-full border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-800 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:opacity-60"
                }
              >
                {operationalPaused ? "Clear operational pause" : "Pause paid chat"}
              </button>
            ) : null}
            <button
              type="button"
              disabled={busyAction !== null}
              onClick={() => void logout()}
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 disabled:opacity-60"
            >
              End session
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
          <span
            className={
              environmentOverride || operationalPaused
                ? "rounded-full border border-amber-300 bg-amber-50 px-3 py-1 font-semibold text-amber-900"
                : "rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 font-semibold text-emerald-900"
            }
          >
            {environmentOverride
              ? "Environment override active"
              : operationalPaused
                ? "Operational pause active"
                : "Paid chat enabled"}
          </span>
          <span className="rounded-full border border-line bg-slate-50 px-3 py-1 text-slate-700">
            Operational store: {operationalPaused ? "paused" : "running"}
          </span>
          <span className="rounded-full border border-line bg-slate-50 px-3 py-1 text-slate-700">
            Mode: {formatStatus(dashboard.accessMode)}
          </span>
          <span className="rounded-full border border-line bg-slate-50 px-3 py-1 text-slate-700">
            Model: {dashboard.modelLabel || "Configured model"}
          </span>
          <span className="text-xs text-slate-500">
            Snapshot {formatDateTime(dashboard.generatedAtMs)}
          </span>
        </div>

        {notice ? (
          <p
            role="status"
            className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            {notice}
          </p>
        ) : null}
      </header>

      <section aria-labelledby="budget-title">
        <h2 id="budget-title" className="font-serif text-2xl font-semibold text-ink">
          Budgets
        </h2>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <BudgetCard
            title="Daily estimated usage"
            used={dashboard.estimatedMicrodollarsToday}
            limit={dashboard.dailyBudgetMicrodollars}
            remaining={dashboard.remainingDailyMicrodollars}
          />
          <BudgetCard
            title="Monthly estimated usage"
            used={dashboard.estimatedMicrodollarsThisMonth}
            limit={dashboard.monthlyBudgetMicrodollars}
            remaining={dashboard.remainingMonthlyMicrodollars}
          />
        </div>
      </section>

      <section aria-labelledby="overview-title">
        <h2
          id="overview-title"
          className="font-serif text-2xl font-semibold text-ink"
        >
          Today and operational state
        </h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Questions today" value={formatInteger(dashboard.questionsToday)} />
          <Metric label="Diagrams today" value={formatInteger(dashboard.diagramsToday)} />
          <Metric label="Model calls today" value={formatInteger(dashboard.modelCallsToday)} />
          <Metric
            label="Active reservations"
            value={formatInteger(dashboard.activeReservations)}
            note={formatUsd(dashboard.activeReservedMicrodollars)}
          />
          <Metric
            label="Unreconciled usage"
            value={formatInteger(dashboard.unreconciledUsageEvents)}
          />
          <Metric label="Active invitations" value={invitationCounts.active} />
          <Metric label="Exhausted invitations" value={invitationCounts.exhausted} />
          <Metric
            label="Expired or revoked"
            value={invitationCounts.expired + invitationCounts.revoked}
          />
        </dl>
      </section>

      <section aria-labelledby="errors-title">
        <h2 id="errors-title" className="font-serif text-2xl font-semibold text-ink">
          Recent aggregate errors
        </h2>
        {dashboard.recentErrors.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-line bg-white p-5 text-sm text-slate-600">
            No recent error categories were reported.
          </p>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {dashboard.recentErrors.map((error) => (
              <li
                key={error.category}
                className="rounded-2xl border border-line bg-white p-4"
              >
                <p className="text-sm font-semibold text-ink">
                  {formatStatus(error.category)}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatInteger(error.count)} occurrences
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="invitations-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              id="invitations-title"
              className="font-serif text-2xl font-semibold text-ink"
            >
              Invitations
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Only operational labels, status, quota, cost, and last-use time
              are shown.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadDashboard()}
            disabled={loading || busyAction !== null}
            className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 disabled:opacity-60"
          >
            Refresh snapshot
          </button>
        </div>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="min-w-[1080px] border-collapse text-left text-sm">
            <caption className="sr-only">
              Invitation status, quotas, cost, last use, and controls
            </caption>
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th scope="col" className="px-4 py-3">Invitation</th>
                <th scope="col" className="px-4 py-3">Status</th>
                <th scope="col" className="px-4 py-3">Expiry</th>
                <th scope="col" className="px-4 py-3">Daily quota</th>
                <th scope="col" className="px-4 py-3">Total quota</th>
                <th scope="col" className="px-4 py-3">Attributed cost</th>
                <th scope="col" className="px-4 py-3">Last used</th>
                <th scope="col" className="px-4 py-3">Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {dashboard.invitations.map((invitation, index) => {
                const rowBusy =
                  busyAction?.endsWith(`:${invitation.id}`) ?? false;
                const isRevoked = invitation.status === "revoked";

                return (
                  <tr key={invitation.id} className="align-top">
                    <th scope="row" className="px-4 py-4 font-semibold text-ink">
                      {invitation.label || `Invitation ${index + 1}`}
                      <span className="mt-1 block text-xs font-normal text-slate-500">
                        Created {formatDateTime(invitation.createdAtMs)}
                      </span>
                    </th>
                    <td className="px-4 py-4">
                      <span className="rounded-full border border-line bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                        {formatStatus(invitation.status)}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {formatDateTime(invitation.expiresAtMs)}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      <span className="block">
                        Questions: {invitation.quota.questionsUsedToday} used /{" "}
                        {invitation.quota.questionsRemainingToday} remaining
                      </span>
                      <span className="mt-1 block">
                        Diagrams: {invitation.quota.diagramsUsedToday} used /{" "}
                        {invitation.quota.diagramsRemainingToday} remaining
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      <span className="block">
                        Questions: {invitation.quota.questionsUsedTotal} used /{" "}
                        {invitation.quota.questionsRemainingTotal} remaining
                      </span>
                      <span className="mt-1 block">
                        Diagrams: {invitation.quota.diagramsUsedTotal} used /{" "}
                        {invitation.quota.diagramsRemainingTotal} remaining
                      </span>
                    </td>
                    <td className="px-4 py-4 font-medium text-ink">
                      {formatUsd(invitation.attributedMicrodollars)}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {formatDateTime(invitation.lastUsedAtMs)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex min-w-64 flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={busyAction !== null || isRevoked}
                          onClick={() =>
                            void mutate(
                              {
                                action: "revoke",
                                invitationId: invitation.id,
                              },
                              "Invitation revoked.",
                            )
                          }
                          className="rounded-full border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-800 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                          Revoke
                        </button>
                        <button
                          type="button"
                          disabled={busyAction !== null || isRevoked}
                          onClick={() =>
                            void mutate(
                              {
                                action: "extend",
                                invitationId: invitation.id,
                                days: 7,
                              },
                              "Invitation extended by seven days.",
                            )
                          }
                          className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 disabled:opacity-50"
                        >
                          +7 days
                        </button>
                        <button
                          type="button"
                          aria-expanded={adjustingId === invitation.id}
                          disabled={busyAction !== null || isRevoked}
                          onClick={() => startAdjustment(invitation)}
                          className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 disabled:opacity-50"
                        >
                          Adjust quota
                        </button>
                      </div>

                      {adjustingId === invitation.id && draft ? (
                        <form
                          className="mt-3 grid min-w-72 grid-cols-2 gap-3 rounded-xl border border-line bg-slate-50 p-3"
                          onSubmit={(event) =>
                            void submitAdjustment(event, invitation)
                          }
                        >
                          {(
                            [
                              ["dailyQuestions", "Daily questions"],
                              ["dailyDiagrams", "Daily diagrams"],
                              ["totalQuestions", "Total questions"],
                              ["totalDiagrams", "Total diagrams"],
                            ] as const
                          ).map(([field, label]) => (
                            <label
                              key={field}
                              className="text-xs font-semibold text-slate-700"
                            >
                              {label}
                              <input
                                type="number"
                                min={0}
                                step={1}
                                required
                                value={draft[field]}
                                onChange={(event) =>
                                  setDraft({
                                    ...draft,
                                    [field]: event.target.value,
                                  })
                                }
                                className="mt-1 w-full rounded-lg border border-line bg-white px-2 py-1.5 text-sm text-ink focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/20"
                              />
                            </label>
                          ))}
                          <button
                            type="submit"
                            disabled={rowBusy}
                            className="col-span-2 rounded-full bg-ink px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 disabled:opacity-50"
                          >
                            Save quota
                          </button>
                        </form>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
              {dashboard.invitations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-600">
                    No invitations are present.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="daily-usage-title">
        <h2
          id="daily-usage-title"
          className="font-serif text-2xl font-semibold text-ink"
        >
          Daily aggregate usage
        </h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="min-w-[780px] border-collapse text-left text-sm">
            <caption className="sr-only">
              Daily aggregate questions, diagrams, model calls, token counts,
              and estimated cost
            </caption>
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th scope="col" className="px-4 py-3">UTC day</th>
                <th scope="col" className="px-4 py-3">Questions</th>
                <th scope="col" className="px-4 py-3">Diagrams</th>
                <th scope="col" className="px-4 py-3">Model calls</th>
                <th scope="col" className="px-4 py-3">Input tokens</th>
                <th scope="col" className="px-4 py-3">Cached input</th>
                <th scope="col" className="px-4 py-3">Output tokens</th>
                <th scope="col" className="px-4 py-3">Estimated cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {dashboard.daily.map((day) => (
                <tr key={day.utcDay}>
                  <th scope="row" className="px-4 py-3 font-semibold text-ink">
                    {day.utcDay}
                  </th>
                  <td className="px-4 py-3">{formatInteger(day.questions)}</td>
                  <td className="px-4 py-3">{formatInteger(day.diagrams)}</td>
                  <td className="px-4 py-3">{formatInteger(day.modelCalls)}</td>
                  <td className="px-4 py-3">{formatInteger(day.inputTokens)}</td>
                  <td className="px-4 py-3">{formatInteger(day.cachedInputTokens)}</td>
                  <td className="px-4 py-3">{formatInteger(day.outputTokens)}</td>
                  <td className="px-4 py-3 font-medium">
                    {formatUsd(day.microdollars)}
                  </td>
                </tr>
              ))}
              {dashboard.daily.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-600">
                    No daily usage has been recorded.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

