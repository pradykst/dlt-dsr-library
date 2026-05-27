"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

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
    setStatus("Suggestion submitted.");
    onSubmitted?.();
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink/30 p-4">
      <div className="ml-auto h-full max-w-xl overflow-y-auto border border-line bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-line p-5">
          <div>
            <h2 className="font-serif text-2xl text-ink">Suggest Correction</h2>
            <p className="mt-1 text-xs uppercase tracking-[0.12em] text-muted">{targetTable}.{targetField}</p>
          </div>
          <button type="button" aria-label="Close suggestion form" className="border border-line p-2 text-muted hover:text-ink" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <Field label="Target row key"><Input value={targetRowKey} readOnly /></Field>
          <Field label="Old value">
            <textarea className="min-h-24 w-full border border-line bg-paper px-3 py-2 text-sm text-muted outline-none" value={oldValue} readOnly />
          </Field>
          <Field label="Proposed value">
            <textarea className="min-h-32 w-full border border-line bg-white px-3 py-2 text-sm outline-none focus:border-blue" value={proposedValue} onChange={(event) => setProposedValue(event.target.value)} />
          </Field>
          <Field label="Reason">
            <textarea className="min-h-24 w-full border border-line bg-white px-3 py-2 text-sm outline-none focus:border-blue" value={reason} onChange={(event) => setReason(event.target.value)} />
          </Field>
          <Field label="Evidence note">
            <textarea className="min-h-20 w-full border border-line bg-white px-3 py-2 text-sm outline-none focus:border-blue" value={evidenceNote} onChange={(event) => setEvidenceNote(event.target.value)} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name"><Input value={name} onChange={(event) => setName(event.target.value)} /></Field>
            <Field label="Email"><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></Field>
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
          <div className="flex gap-2">
            <Button type="button" disabled={submitting || !proposedValue} onClick={submit}>{submitting ? "Submitting..." : "Submit suggestion"}</Button>
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
