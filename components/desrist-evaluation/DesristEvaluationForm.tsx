"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  dltExperienceOptions,
  dsrExperienceOptions,
  improvementPriorityOptions,
  likertItems,
  roleOptions,
  usedSectionOptions,
  valuableUseCaseOptions,
  type DesristEvaluationPayload,
  type LikertKey,
  type SurveyOption
} from "@/lib/desrist-evaluation/survey";
import { trackSurveyCompleted, trackSurveyStarted } from "@/utils/analytics";

type SurveyState = {
  role: string;
  dsr_experience: string;
  dlt_experience: string;
  used_sections: string[];
  likert: Partial<Record<LikertKey, number>>;
  improvement_priorities: string[];
  most_valuable_use_case: string;
  most_useful_part: string;
  confusing_or_missing: string;
  feature_suggestion: string;
};

const initialState: SurveyState = {
  role: "",
  dsr_experience: "",
  dlt_experience: "",
  used_sections: [],
  likert: {},
  improvement_priorities: [],
  most_valuable_use_case: "",
  most_useful_part: "",
  confusing_or_missing: "",
  feature_suggestion: ""
};

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
    if (state.used_sections.length > 0) completed += 1;
    if (likertItems.every((item) => state.likert[item.key])) completed += 1;
    if (state.improvement_priorities.length > 0 && state.improvement_priorities.length <= 3 && state.most_valuable_use_case) completed += 1;
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
    const response = await fetch("/api/desrist-evaluation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    setSubmitting(false);

    if (!response.ok) {
      setSubmitError([result.error, Array.isArray(result.details) ? result.details.join(" ") : result.details].filter(Boolean).join(" "));
      return;
    }
    trackSurveyCompleted({
      role: payload.role,
      dsr_experience: payload.dsr_experience,
      dlt_experience: payload.dlt_experience,
      used_sections: payload.used_sections,
      most_valuable_use_case: payload.most_valuable_use_case,
      improvement_priorities: payload.improvement_priorities
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
        <h1 className="mt-3 font-serif text-4xl text-ink sm:text-5xl">Evaluate the DLT Design Knowledge Library</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          This 2 to 4 minute survey collects formative prototype feedback after interacting with the library. Please do not enter names, emails, or identifying details.
        </p>
      </header>
      <PrivacyNotice />

      <Card className="mb-5 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Progress</div>
            <div className="mt-1 text-sm text-ink">{completedSections} of 4 required sections complete</div>
          </div>
          <div className="h-2 w-full border border-line bg-paper sm:max-w-xs">
            <div className="h-full bg-blue transition-all" style={{ width: `${(completedSections / 4) * 100}%` }} />
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
        <SurveySection number="A" title="Participant Context">
          <SelectableCardGroup title="Your role" required value={state.role} options={roleOptions} onChange={(value) => setState((current) => ({ ...current, role: value }))} />
          <SelectableCardGroup title="DSR experience" required value={state.dsr_experience} options={dsrExperienceOptions} onChange={(value) => setState((current) => ({ ...current, dsr_experience: value }))} />
          <SelectableCardGroup title="DLT experience" required value={state.dlt_experience} options={dltExperienceOptions} onChange={(value) => setState((current) => ({ ...current, dlt_experience: value }))} />
        </SurveySection>

        <SurveySection number="B" title="Interaction Scope">
          <MultiSelectChips title="Which parts did you use or see?" required helper="Select at least one." values={state.used_sections} options={usedSectionOptions} onChange={(values) => setState((current) => ({ ...current, used_sections: values }))} />
        </SurveySection>

        <SurveySection number="C" title="Core Evaluation">
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

        <SurveySection number="D" title="Improvement Priorities">
          <MultiSelectChips title="Most important improvements" required helper="Select 1 to 3." values={state.improvement_priorities} options={improvementPriorityOptions} max={3} onChange={(values) => setState((current) => ({ ...current, improvement_priorities: values }))} />
          <SelectableCardGroup title="Most valuable use case" required value={state.most_valuable_use_case} options={valuableUseCaseOptions} onChange={(value) => setState((current) => ({ ...current, most_valuable_use_case: value }))} />
        </SurveySection>

        <SurveySection number="E" title="Optional Feedback">
          <TextAreaField label="Most useful part" value={state.most_useful_part} onChange={(value) => setState((current) => ({ ...current, most_useful_part: value }))} />
          <TextAreaField label="Confusing or missing" value={state.confusing_or_missing} onChange={(value) => setState((current) => ({ ...current, confusing_or_missing: value }))} />
          <TextAreaField label="Feature suggestion" value={state.feature_suggestion} onChange={(value) => setState((current) => ({ ...current, feature_suggestion: value }))} />
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

function MultiSelectChips({ title, required, helper, values, options, max, onChange }: {
  title: string;
  required?: boolean;
  helper?: string;
  values: string[];
  options: SurveyOption[];
  max?: number;
  onChange: (values: string[]) => void;
}) {
  function toggle(value: string) {
    if (values.includes(value)) {
      onChange(values.filter((item) => item !== value));
      return;
    }
    if (max && values.length >= max) return;
    onChange([...values, value]);
  }

  return (
    <fieldset>
      <legend className="text-sm font-semibold text-ink">{title}{required && <span className="text-red-700"> *</span>}</legend>
      {helper && <p className="mt-1 text-xs text-muted">{helper}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = values.includes(option.value);
          const disabled = Boolean(max && values.length >= max && !selected);
          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              className={selected ? "border border-blue bg-blue/10 px-3 py-2 text-sm font-medium text-ink" : "border border-line bg-paper px-3 py-2 text-sm text-muted hover:border-blue hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"}
              onClick={() => toggle(option.value)}
            >
              {option.label}
            </button>
          );
        })}
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
      <div className="mt-2 flex justify-between text-[11px] uppercase tracking-[0.12em] text-muted">
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
  if (state.used_sections.length < 1) errors.push("Select at least one section you used or saw.");
  if (!likertItems.every((item) => state.likert[item.key])) errors.push("Answer all core evaluation scale items.");
  if (state.improvement_priorities.length < 1) errors.push("Select at least one improvement priority.");
  if (state.improvement_priorities.length > 3) errors.push("Select no more than three improvement priorities.");
  if (!state.most_valuable_use_case) errors.push("Select the most valuable use case.");
  return errors;
}

function buildPayload(state: SurveyState): DesristEvaluationPayload {
  return {
    role: state.role,
    dsr_experience: state.dsr_experience,
    dlt_experience: state.dlt_experience,
    used_sections: state.used_sections,
    q_usefulness: state.likert.q_usefulness!,
    q_ease_understanding: state.likert.q_ease_understanding!,
    q_traceability: state.likert.q_traceability!,
    q_visual_clarity: state.likert.q_visual_clarity!,
    q_comparison_value: state.likert.q_comparison_value!,
    q_trust_credibility: state.likert.q_trust_credibility!,
    q_reuse_intention: state.likert.q_reuse_intention!,
    q_ecommerce_relevance: state.likert.q_ecommerce_relevance!,
    q_completeness: state.likert.q_completeness!,
    q_recommendation: state.likert.q_recommendation!,
    improvement_priorities: state.improvement_priorities,
    most_valuable_use_case: state.most_valuable_use_case,
    most_useful_part: state.most_useful_part,
    confusing_or_missing: state.confusing_or_missing,
    feature_suggestion: state.feature_suggestion,
    page_path: typeof window === "undefined" ? "/desrist-evaluation" : window.location.pathname
  };
}
