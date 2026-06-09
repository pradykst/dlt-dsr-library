"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  dltExperienceOptions,
  dsrExperienceOptions,
  likertItems,
  roleOptions,
  type DesristEvaluationPayload,
  type LikertKey,
  type SurveyOption
} from "@/lib/desrist-evaluation/survey";
import { trackSurveyCompleted, trackSurveyStarted } from "@/utils/analytics";

type SurveyState = {
  role: string;
  dsr_experience: string;
  dlt_experience: string;
  likert: Partial<Record<LikertKey, number>>;
  most_useful_part: string;
  confusing_or_missing: string;
  improvement_suggestion: string;
};

const initialState: SurveyState = {
  role: "",
  dsr_experience: "",
  dlt_experience: "",
  likert: {},
  most_useful_part: "",
  confusing_or_missing: "",
  improvement_suggestion: ""
};
const submitAttempts = 3;
const submitTimeoutMs = 15000;

export function DesristEvaluationForm() {
  const [state, setState] = useState<SurveyState>(initialState);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  useEffect(() => {
    trackSurveyStarted();
  }, []);

  const completedSections = useMemo(() => {
    let completed = 0;
    if (state.role && state.dsr_experience && state.dlt_experience) completed += 1;
    if (likertItems.every((item) => state.likert[item.key])) completed += 1;
    return completed;
  }, [state]);

  async function submit() {
    if (submitting || submitted) return;
    const validationErrors = validateState(state);
    setErrors(validationErrors);
    setSubmitError(undefined);
    if (validationErrors.length) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitting(true);
    const payload = buildPayload(state);
    const result = await submitEvaluation(payload);
    setSubmitting(false);

    if (!result.ok) {
      setSubmitError(result.message);
      return;
    }
    trackSurveyCompleted({
      role: payload.role,
      dsr_experience: payload.dsr_experience,
      dlt_experience: payload.dlt_experience
    });
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (submitted) {
    return (
      <Card className="mx-auto max-w-3xl p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center border border-green/40 bg-green/10">
          <CheckCircle2 className="h-6 w-6 text-green" />
        </div>
        <h1 className="mt-5 font-serif text-4xl text-ink">Thank you</h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted">
          Thank you for evaluating the DLT Design Knowledge Library. Your feedback will help improve the next design iteration.
        </p>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <Badge>DESRIST 2026 Evaluation</Badge>
        <h1 className="mt-3 font-serif text-3xl text-ink sm:text-5xl">Evaluate the DLT Design Knowledge Library</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          This 2 to 4 minute survey collects formative prototype feedback after interacting with the library. Please do not enter names, emails, or identifying details.
        </p>
      </header>
      <PrivacyNotice />

      <Card className="mb-5 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Progress</div>
            <div className="mt-1 text-sm text-ink">{completedSections} of 2 required sections complete</div>
          </div>
          <div className="h-2 w-full border border-line bg-paper sm:max-w-xs">
            <div className="h-full bg-blue transition-all" style={{ width: `${(completedSections / 2) * 100}%` }} />
          </div>
        </div>
      </Card>

      {errors.length > 0 && (
        <Card className="mb-5 border-red-200 bg-red-50 p-4">
          <h2 className="text-sm font-semibold text-red-800">Please complete the required items</h2>
          <ul className="mt-2 space-y-1 text-sm text-red-700">
            {errors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </Card>
      )}

      <div className="space-y-5">
        <SurveySection number="1" title="Participant Context">
          <SelectableCardGroup title="Your role" required value={state.role} options={roleOptions} onChange={(value) => setState((current) => ({ ...current, role: value }))} />
          <SelectableCardGroup title="DSR experience" required value={state.dsr_experience} options={dsrExperienceOptions} onChange={(value) => setState((current) => ({ ...current, dsr_experience: value }))} />
          <SelectableCardGroup title="DLT experience" required value={state.dlt_experience} options={dltExperienceOptions} onChange={(value) => setState((current) => ({ ...current, dlt_experience: value }))} />
        </SurveySection>

        <SurveySection number="2" title="Core Evaluation">
          <div className="space-y-4">
            {likertItems.map((item, index) => (
              <LikertScale
                key={item.key}
                index={index + 1}
                label={item.label}
                value={state.likert[item.key]}
                onChange={(value) => setState((current) => ({ ...current, likert: { ...current.likert, [item.key]: value } }))}
              />
            ))}
          </div>
        </SurveySection>

        <SurveySection number="3" title="Optional Feedback">
          <TextAreaField label="What was the most useful part of the library?" value={state.most_useful_part} onChange={(value) => setState((current) => ({ ...current, most_useful_part: value }))} />
          <TextAreaField label="What was confusing, missing, or difficult to understand?" value={state.confusing_or_missing} onChange={(value) => setState((current) => ({ ...current, confusing_or_missing: value }))} />
          <TextAreaField label="What should we improve first for the next version?" value={state.improvement_suggestion} onChange={(value) => setState((current) => ({ ...current, improvement_suggestion: value }))} />
        </SurveySection>
      </div>

      {submitError && <Card className="mt-5 border-red-200 bg-red-50 p-4 text-sm text-red-700">{submitError}</Card>}
      <div className="sticky bottom-0 mt-6 border border-line bg-paper/95 p-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-muted">Submission stores structured survey responses only. No name, email, or IP address is requested.</p>
          <Button type="button" disabled={submitting || submitted} onClick={submit} className="w-full sm:w-auto">
            {submitting ? "Submitting..." : "Submit Evaluation"}
          </Button>
        </div>
      </div>
    </div>
  );
}

async function submitEvaluation(payload: DesristEvaluationPayload): Promise<{ ok: true } | { ok: false; message: string }> {
  let lastMessage = "Could not submit survey response. Please check the connection and try again.";

  for (let attempt = 1; attempt <= submitAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), submitTimeoutMs);

    try {
      const response = await fetch("/api/desrist-evaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      const result = await safeJson(response);
      if (response.ok) return { ok: true };

      lastMessage = [result?.error, Array.isArray(result?.details) ? result.details.join(" ") : result?.details]
        .filter(Boolean)
        .join(" ") || `Submission failed with status ${response.status}.`;
      if (response.status < 500) return { ok: false, message: lastMessage };
    } catch (error) {
      lastMessage = error instanceof DOMException && error.name === "AbortError"
        ? "The submission timed out. Please try again."
        : "The submission could not reach the server. Please check the connection and try again.";
    } finally {
      window.clearTimeout(timeout);
    }

    if (attempt < submitAttempts) await wait(600 * attempt);
  }

  return { ok: false, message: lastMessage };
}

async function safeJson(response: Response): Promise<{ error?: string; details?: string | string[] } | null> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function SurveySection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-8 w-8 place-items-center border border-line bg-paper text-xs font-semibold text-muted">{number}</span>
        <h2 className="font-serif text-2xl text-ink">{title}</h2>
      </div>
      <div className="space-y-5">{children}</div>
    </Card>
  );
}

function PrivacyNotice() {
  return (
    <Card className="mb-5 border-blue/20 bg-blue/5 p-4">
      <p className="text-sm leading-6 text-muted">
        This research demo uses privacy-preserving analytics and session replay to improve the DSR Knowledge Library. Text inputs are masked and no names or emails are required.
      </p>
    </Card>
  );
}

function SelectableCardGroup({ title, required, value, options, onChange }: {
  title: string;
  required?: boolean;
  value: string;
  options: SurveyOption[];
  onChange: (value: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-ink">{title}{required && <span className="text-red-700"> *</span>}</legend>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => (
          <label key={option.value} className={value === option.value ? "border border-blue bg-blue/10 p-3 text-sm text-ink" : "border border-line bg-paper p-3 text-sm text-muted hover:border-blue hover:text-ink"}>
            <input className="sr-only" type="radio" name={title} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} />
            <span className="font-medium">{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function LikertScale({ index, label, value, onChange }: { index: number; label: string; value?: number; onChange: (value: number) => void }) {
  return (
    <fieldset className="border border-line bg-paper p-4">
      <legend className="sr-only">{label}</legend>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <p className="max-w-2xl text-sm leading-6 text-ink"><span className="font-semibold">{index}.</span> {label}</p>
        <div className="grid grid-cols-5 gap-1">
          {[1, 2, 3, 4, 5].map((score) => (
            <label key={score} className={value === score ? "grid h-10 w-10 place-items-center border border-ink bg-ink text-sm font-semibold text-white" : "grid h-10 w-10 place-items-center border border-line bg-white text-sm font-semibold text-muted hover:border-blue hover:text-ink"}>
              <input className="sr-only" type="radio" name={`likert-${index}`} checked={value === score} onChange={() => onChange(score)} />
              {score}
            </label>
          ))}
        </div>
      </div>
      <div className="mt-2 flex justify-between gap-4 text-[10px] uppercase tracking-[0.08em] text-muted sm:text-[11px] sm:tracking-[0.12em]">
        <span>Strongly disagree</span>
        <span>Strongly agree</span>
      </div>
    </fieldset>
  );
}

function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <textarea
        className="mp-mask mt-2 min-h-24 w-full border border-line bg-white px-3 py-2 text-sm leading-6 outline-none transition focus:border-blue"
        data-mp-block
        maxLength={1000}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <span className="mt-1 block text-xs text-muted">{value.length}/1000 characters</span>
    </label>
  );
}

function validateState(state: SurveyState) {
  const errors: string[] = [];
  if (!state.role) errors.push("Select your role.");
  if (!state.dsr_experience) errors.push("Select your DSR experience.");
  if (!state.dlt_experience) errors.push("Select your DLT experience.");
  if (!likertItems.every((item) => state.likert[item.key])) errors.push("Answer all core evaluation scale items.");
  return errors;
}

function buildPayload(state: SurveyState): DesristEvaluationPayload {
  return {
    role: state.role,
    dsr_experience: state.dsr_experience,
    dlt_experience: state.dlt_experience,
    q_usefulness: state.likert.q_usefulness!,
    q_ease_understanding: state.likert.q_ease_understanding!,
    q_traceability: state.likert.q_traceability!,
    q_visual_clarity: state.likert.q_visual_clarity!,
    q_reuse_intention: state.likert.q_reuse_intention!,
    most_useful_part: state.most_useful_part,
    confusing_or_missing: state.confusing_or_missing,
    improvement_suggestion: state.improvement_suggestion,
    page_path: typeof window === "undefined" ? "/desrist-evaluation" : window.location.pathname
  };
}
