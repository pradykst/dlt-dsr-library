"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { fetchWorkbenchJson } from "@/lib/workbench/client";
import type { ChangeRequest } from "@/lib/workbench/types";

const statuses = ["open", "accepted_for_git_change", "rejected", "resolved_after_reindex", "all"];

export function WorkbenchAdmin() {
  const [adminSecret, setAdminSecret] = useState("");
  const [status, setStatus] = useState("open");
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [message, setMessage] = useState<string>();
  const [decisionNote, setDecisionNote] = useState("");
  const [decidedBy, setDecidedBy] = useState("admin");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setMessage(undefined);
    try {
      const result = await fetchWorkbenchJson<{ ok: true; changeRequests: ChangeRequest[] }>(
        `/api/workbench/change-requests?status=${encodeURIComponent(status)}`,
        { headers: { "x-admin-secret": adminSecret } }
      );
      setRequests(result.changeRequests);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load change requests.");
    } finally {
      setLoading(false);
    }
  }

  async function decide(id: string, decision: "accepted_for_git_change" | "rejected" | "resolved_after_reindex") {
    setMessage(undefined);
    try {
      const result = await fetchWorkbenchJson<{ ok: true; status: string; message: string }>(`/api/workbench/change-requests/${id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminSecret, decision, admin_decision_note: decisionNote, decided_by: decidedBy })
      });
      setMessage(result.message);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Decision failed.");
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/workbench" className="text-sm text-muted hover:text-ink">Back to Workbench</Link>
        <h1 className="mt-3 font-serif text-3xl text-ink sm:text-4xl">Admin Change Requests</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          Review reported OKF issues. Approval records that a Git change is required; it never updates canonical OKF facts directly in Supabase.
        </p>
      </div>
      <Card className="mb-5 p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_180px_auto]">
          <Input className="mp-mask" data-mp-block type="password" placeholder="Admin secret" value={adminSecret} onChange={(event) => setAdminSecret(event.target.value)} />
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>{statuses.map((item) => <option key={item}>{item}</option>)}</Select>
          <Input placeholder="Decision owner" value={decidedBy} onChange={(event) => setDecidedBy(event.target.value)} />
          <Button type="button" disabled={!adminSecret || loading} onClick={load}>{loading ? "Loading..." : "Load requests"}</Button>
        </div>
        <textarea className="mp-mask mt-3 min-h-20 w-full border border-line bg-white px-3 py-2 text-sm outline-none focus:border-blue" data-mp-block placeholder="Decision note / Git implementation guidance" value={decisionNote} onChange={(event) => setDecisionNote(event.target.value)} />
        {message && <p className="mt-3 border border-line bg-paper p-3 text-sm text-muted">{message}</p>}
      </Card>
      <div className="space-y-4">
        {requests.map((request) => (
          <Card key={request.id} className="p-5">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{request.paper_id} / {request.target_type}.{request.field}</div>
                <h2 className="mt-2 break-words font-serif text-xl text-ink sm:text-2xl">{request.target_id}</h2>
              </div>
              <span className="border border-line bg-paper px-2 py-1 text-xs uppercase tracking-[0.12em] text-muted">{request.status}</span>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <Block label="Current value" value={request.current_value} />
              <Block label="Proposed change" value={request.proposed_value} />
              <Block label="Reason" value={request.reason} />
              <Block label="Evidence note" value={request.evidence_note} />
              <Block label="Target OKF file" value={request.target_okf_path} />
              <Block label="Submitted by" value={`${request.submitted_by_name ?? ""} ${request.submitted_by_email ?? ""} ${request.submitted_by_role ?? ""}`} />
              <Block label="Created" value={request.created_at} />
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button type="button" disabled={request.status !== "open"} onClick={() => request.id && decide(request.id, "accepted_for_git_change")}>Approve for Git change</Button>
              <button className="border border-line bg-white px-3 py-2 text-sm font-medium text-ink hover:border-blue disabled:opacity-50" disabled={request.status !== "open"} onClick={() => request.id && decide(request.id, "rejected")}>Reject</button>
              <button className="border border-line bg-white px-3 py-2 text-sm font-medium text-ink hover:border-blue disabled:opacity-50" disabled={request.status !== "open"} onClick={() => request.id && decide(request.id, "resolved_after_reindex")}>Resolve after re-index</button>
            </div>
          </Card>
        ))}
        {requests.length === 0 && <Card className="p-5 text-sm text-muted">No change requests loaded.</Card>}
      </div>
    </div>
  );
}

function Block({ label, value }: { label: string; value: string | null | undefined }) {
  return <div><div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</div><div className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink">{value || "No value provided"}</div></div>;
}
