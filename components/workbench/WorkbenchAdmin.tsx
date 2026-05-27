"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { ChangeRequest } from "@/lib/workbench/types";

const statuses = ["pending", "accepted", "rejected", "needs_clarification", "all"];

export function WorkbenchAdmin() {
  const [adminSecret, setAdminSecret] = useState("");
  const [status, setStatus] = useState("pending");
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [message, setMessage] = useState<string>();
  const [decisionNote, setDecisionNote] = useState("");
  const [decidedBy, setDecidedBy] = useState("admin");
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setMessage(undefined);
    const response = await fetch(`/api/workbench/change-requests?status=${encodeURIComponent(status)}`, {
      headers: { "x-admin-secret": adminSecret }
    });
    const json = await response.json();
    setLoading(false);
    if (!response.ok) {
      setMessage(json.error ?? "Could not load change requests.");
      return;
    }
    setRequests(json.changeRequests);
  }

  async function decide(id: string, decision: "accepted" | "rejected" | "needs_clarification") {
    setMessage(undefined);
    const response = await fetch(`/api/workbench/change-requests/${id}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminSecret, decision, admin_decision_note: decisionNote, decided_by: decidedBy })
    });
    const json = await response.json();
    if (!response.ok) {
      setMessage(json.error ?? "Decision failed.");
      return;
    }
    setMessage(`Request ${id} marked ${json.status}.`);
    await load();
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/workbench" className="text-sm text-muted hover:text-ink">Back to Workbench</Link>
        <h1 className="mt-3 font-serif text-4xl text-ink">Admin Change Requests</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Review pending corrections. Accepted requests update the target Supabase field, then mark the request as accepted.</p>
      </div>
      <Card className="mb-5 p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_180px_auto]">
          <Input type="password" placeholder="Admin secret" value={adminSecret} onChange={(event) => setAdminSecret(event.target.value)} />
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>{statuses.map((item) => <option key={item}>{item}</option>)}</Select>
          <Input placeholder="Decided by" value={decidedBy} onChange={(event) => setDecidedBy(event.target.value)} />
          <Button type="button" disabled={!adminSecret || loading} onClick={load}>{loading ? "Loading..." : "Load requests"}</Button>
        </div>
        <textarea className="mt-3 min-h-20 w-full border border-line bg-white px-3 py-2 text-sm outline-none focus:border-blue" placeholder="Decision note" value={decisionNote} onChange={(event) => setDecisionNote(event.target.value)} />
        {message && <p className="mt-3 border border-line bg-paper p-3 text-sm text-muted">{message}</p>}
      </Card>
      <div className="space-y-4">
        {requests.map((request) => (
          <Card key={request.id} className="p-5">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{request.paper_id} / {request.target_table}.{request.target_field}</div>
                <h2 className="mt-2 font-serif text-2xl text-ink">{request.target_row_key}</h2>
              </div>
              <span className="border border-line bg-paper px-2 py-1 text-xs uppercase tracking-[0.12em] text-muted">{request.status}</span>
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <Block label="Old value" value={request.old_value} />
              <Block label="Proposed value" value={request.proposed_value} />
              <Block label="Reason" value={request.reason} />
              <Block label="Evidence note" value={request.evidence_note} />
              <Block label="Submitted by" value={`${request.submitted_by_name ?? ""} ${request.submitted_by_email ?? ""} ${request.submitted_by_role ?? ""}`} />
              <Block label="Created" value={request.created_at} />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" disabled={request.status !== "pending"} onClick={() => request.id && decide(request.id, "accepted")}>Accept</Button>
              <button className="border border-line bg-white px-3 py-2 text-sm font-medium text-ink hover:border-blue disabled:opacity-50" disabled={request.status !== "pending"} onClick={() => request.id && decide(request.id, "rejected")}>Reject</button>
              <button className="border border-line bg-white px-3 py-2 text-sm font-medium text-ink hover:border-blue disabled:opacity-50" disabled={request.status !== "pending"} onClick={() => request.id && decide(request.id, "needs_clarification")}>Needs clarification</button>
            </div>
          </Card>
        ))}
        {requests.length === 0 && <Card className="p-5 text-sm text-muted">No change requests loaded.</Card>}
      </div>
    </div>
  );
}

function Block({ label, value }: { label: string; value: string | null | undefined }) {
  return <div><div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</div><div className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink">{value || "NA"}</div></div>;
}
