"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { trackEvent } from "@/utils/analytics";

type Props = {
  paperId: string;
  targetTable: "papers" | "elements" | "relations" | "evidence";
  targetRowKey: string;
  targetField: string;
  oldValue: string;
  onClose: () => void;
  onSubmitted?: () => void;
};

export function SuggestionForm({ paperId, targetTable, targetRowKey, targetField, oldValue, onClose, onSubmitted }: Props) {
  const [proposedValue, setProposedValue] = useState(oldValue);
  const [reason, setReason] = useState("");
  const [evidenceNote, setEvidenceNote] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Reviewer");
  const [status, setStatus] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    setStatus(undefined);
    const response = await fetch("/api/workbench/change-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paper_id: paperId,
        target_table: targetTable,
        target_row_key: targetRowKey,
        target_field: targetField,
        old_value: oldValue,
        proposed_value: proposedValue,
        reason,
        evidence_note: evidenceNote,
        submitted_by_name: name,
        submitted_by_email: email,
        submitted_by_role: role
      })
    });
    const result = await response.json();
    setSubmitting(false);
    if (!response.ok) {
      setStatus(result.error ?? "Suggestion could not be submitted.");
      return;
    }
    setStatus("Change request committed.");
    trackEvent("reviewer_change_requested", {
      paper_id: paperId,
      target_table: targetTable,
      target_field: targetField
    });
    onSubmitted?.();
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink/30 p-2 sm:p-4">
      <div className="ml-auto h-full w-full max-w-xl overflow-y-auto border border-line bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-line p-5">
          <div>
            <h2 className="font-serif text-2xl text-ink">Request Change</h2>
            <p className="mt-1 text-xs uppercase tracking-[0.12em] text-muted">{targetTable}.{targetField}</p>
          </div>
          <button type="button" aria-label="Close change request form" className="border border-line p-2 text-muted hover:text-ink" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <Field label="Target row key"><Input value={targetRowKey} readOnly /></Field>
          <Field label="Old value">
            <textarea className="mp-mask min-h-24 w-full border border-line bg-paper px-3 py-2 text-sm text-muted outline-none" data-mp-block value={oldValue} readOnly />
          </Field>
          <Field label="Proposed value">
            <textarea className="mp-mask min-h-32 w-full border border-line bg-white px-3 py-2 text-sm outline-none focus:border-blue" data-mp-block value={proposedValue} onChange={(event) => setProposedValue(event.target.value)} />
          </Field>
          <Field label="Reason">
            <textarea className="mp-mask min-h-24 w-full border border-line bg-white px-3 py-2 text-sm outline-none focus:border-blue" data-mp-block value={reason} onChange={(event) => setReason(event.target.value)} />
          </Field>
          <Field label="Evidence note">
            <textarea className="mp-mask min-h-20 w-full border border-line bg-white px-3 py-2 text-sm outline-none focus:border-blue" data-mp-block value={evidenceNote} onChange={(event) => setEvidenceNote(event.target.value)} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name"><Input className="mp-mask" data-mp-block value={name} onChange={(event) => setName(event.target.value)} /></Field>
            <Field label="Email"><Input className="mp-mask" data-mp-block type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></Field>
          </div>
          <Field label="Role">
            <Select value={role} onChange={(event) => setRole(event.target.value)}>
              <option>Author</option>
              <option>Reviewer</option>
              <option>Admin</option>
              <option>Other</option>
            </Select>
          </Field>
          {status && <p className="border border-line bg-paper p-3 text-sm text-muted">{status}</p>}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" disabled={submitting || !proposedValue} onClick={submit}>{submitting ? "Committing..." : "Commit change request"}</Button>
            <button type="button" className="border border-line px-3 py-2 text-sm text-muted hover:text-ink" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</span>
      {children}
    </label>
  );
}
