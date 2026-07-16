"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { fetchWorkbenchJson } from "@/lib/workbench/client";
import { workbenchChangeFields } from "@/lib/workbench/schema";
import type { WorkbenchChangeTargetType } from "@/lib/workbench/types";
import { trackEvent } from "@/utils/analytics";

type UiChangeTargetType = WorkbenchChangeTargetType | "presentation";

type Props = {
  paperId: string;
  targetType: UiChangeTargetType;
  targetId: string;
  field: string;
  currentValue: string;
  targetOkfPath?: string;
  allowTargetEdit?: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
};

type SubmitResponse = {
  ok: true;
  message: string;
  target_okf_path: string;
};

const targetTypes: UiChangeTargetType[] = ["paper", "presentation", "concept", "relation", "evidence", "graph"];

const presentationFields = [
  "card.domain_label",
  "card.artifact_summary",
  "card.dlt_role",
  "overview.abstract_summary",
  "overview.research_problem",
  "overview.research_objective",
  "overview.methodology",
  "overview.evaluation_method",
  "overview.key_contributions",
  "overview.design_knowledge_output",
  "dsr_summary_grid.problem",
  "dsr_summary_grid.input_knowledge",
  "dsr_summary_grid.research_process",
  "dsr_summary_grid.key_concepts",
  "dsr_summary_grid.solution",
  "dsr_summary_grid.output_knowledge",
  "additional_context.summary",
  "additional_context.limitations"
] as const;

export function SuggestionForm({
  paperId,
  targetType: initialTargetType,
  targetId: initialTargetId,
  field: initialField,
  currentValue,
  targetOkfPath,
  allowTargetEdit = false,
  onClose,
  onSubmitted
}: Props) {
  const [targetType, setTargetType] = useState<UiChangeTargetType>(initialTargetType);
  const [targetId, setTargetId] = useState(initialTargetId);
  const [field, setField] = useState(initialField);
  const [reportedCurrentValue, setReportedCurrentValue] = useState(currentValue);
  const [proposedValue, setProposedValue] = useState(currentValue);
  const [reason, setReason] = useState("");
  const [evidenceNote, setEvidenceNote] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Reviewer");
  const [status, setStatus] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const availableFields = useMemo<readonly string[]>(() => fieldsForTarget(targetType), [targetType]);

  function changeTargetType(nextType: UiChangeTargetType) {
    setTargetType(nextType);
    const fields = fieldsForTarget(nextType);
    setField(fields[0]);
    setReportedCurrentValue("");
    setProposedValue("");
  }

  async function submit() {
    setSubmitting(true);
    setStatus(undefined);
    try {
      const result = await fetchWorkbenchJson<SubmitResponse>("/api/workbench/change-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paper_id: paperId,
          target_type: targetType,
          target_id: targetId,
          field,
          current_value: reportedCurrentValue,
          target_okf_path: allowTargetEdit ? undefined : targetOkfPath,
          proposed_value: proposedValue,
          reason,
          evidence_note: evidenceNote,
          submitted_by_name: name,
          submitted_by_email: email,
          submitted_by_role: role
        })
      });
      setStatus(result.message);
      trackEvent("reviewer_change_requested", {
        paper_id: paperId,
        target_type: targetType,
        field
      });
      onSubmitted?.();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Suggestion could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = Boolean(targetId.trim() && field && proposedValue.trim() && reason.trim());

  return (
    <div className="fixed inset-0 z-50 bg-ink/30 p-2 sm:p-4">
      <div className="ml-auto h-full w-full max-w-xl overflow-y-auto border border-line bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-line p-5">
          <div>
            <h2 className="font-serif text-2xl text-ink">{targetType === "presentation" ? "Suggest a presentation edit" : "Report an OKF Issue"}</h2>
            <p className="mt-1 text-xs uppercase tracking-[0.12em] text-muted">{targetType}.{field}</p>
          </div>
          <button type="button" aria-label="Close change request form" className="border border-line p-2 text-muted hover:text-ink" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          <p className="border border-blue/20 bg-blue/5 p-3 text-sm leading-6 text-ink">
            This creates a review request only. Accepted reports produce a Git change to canonical OKF files followed by re-indexing; this form never overwrites facts in Supabase.
          </p>
          {allowTargetEdit ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Target type">
                <Select value={targetType} onChange={(event) => changeTargetType(event.target.value as UiChangeTargetType)}>
                  {targetTypes.map((type) => <option key={type} value={type}>{humanize(type)}</option>)}
                </Select>
              </Field>
              <Field label="Field">
                <Select value={field} onChange={(event) => setField(event.target.value)}>
                  {availableFields.map((candidate) => <option key={candidate} value={candidate}>{humanize(candidate)}</option>)}
                </Select>
              </Field>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Target type"><Input value={humanize(targetType)} readOnly /></Field>
              <Field label="Field"><Input value={humanize(field)} readOnly /></Field>
            </div>
          )}
          <Field label="Target ID"><Input value={targetId} readOnly={!allowTargetEdit} onChange={(event) => setTargetId(event.target.value)} /></Field>
          {targetOkfPath && !allowTargetEdit && <Field label="Target OKF file"><Input value={targetOkfPath} readOnly /></Field>}
          <Field label="Current value">
            <textarea className="mp-mask min-h-24 w-full border border-line bg-paper px-3 py-2 text-sm text-muted outline-none" data-mp-block value={reportedCurrentValue} readOnly={!allowTargetEdit} onChange={(event) => setReportedCurrentValue(event.target.value)} />
          </Field>
          <Field label="Proposed change">
            <textarea className="mp-mask min-h-32 w-full border border-line bg-white px-3 py-2 text-sm outline-none focus:border-blue" data-mp-block value={proposedValue} onChange={(event) => setProposedValue(event.target.value)} />
          </Field>
          <Field label="Reason">
            <textarea className="mp-mask min-h-24 w-full border border-line bg-white px-3 py-2 text-sm outline-none focus:border-blue" data-mp-block value={reason} onChange={(event) => setReason(event.target.value)} />
          </Field>
          <Field label="Evidence or source note">
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
            <Button type="button" disabled={submitting || !canSubmit} onClick={submit}>{submitting ? "Submitting..." : "Submit change request"}</Button>
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

function fieldsForTarget(targetType: UiChangeTargetType): readonly string[] {
  if (targetType === "presentation") return presentationFields;
  return workbenchChangeFields[targetType as keyof typeof workbenchChangeFields] ?? [];
}
function humanize(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}