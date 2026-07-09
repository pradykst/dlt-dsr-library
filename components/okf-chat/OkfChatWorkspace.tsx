"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowRight, BookOpen, CheckCircle2, ChevronDown, Clipboard, Filter, GitBranch, Loader2, MessageSquareWarning, Network, Send } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import type { OkfChatResponse } from "@/lib/okf/chat.ts";
import type { OkfConcept } from "@/lib/okf/schema.ts";

const exampleQuestions = [
  "Which papers help with privacy-preserving identity?",
  "Build a Requirement \u2192 Principle \u2192 Feature flow for Blockchain for the IoT.",
  "What design knowledge should I reuse for marketplace trust?"
];

const conceptGroups = [
  ["Requirements", "DesignRequirement"],
  ["Design Principles", "DesignPrinciple"],
  ["Design Features", "DesignFeature"],
  ["Artifact Patterns", "Artifact"],
  ["Evaluation Criteria / Evidence", "Evaluation"]
] as const;

type LlmHealth = { ok: boolean; provider: string; provider_configured?: boolean; provider_connected?: boolean; status?: number; error?: string };

export function OkfChatWorkspace() {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<OkfChatResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [correctionText, setCorrectionText] = useState("");
  const [correctionStatus, setCorrectionStatus] = useState("");
  const [selectedConceptId, setSelectedConceptId] = useState<string | undefined>();
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[] | undefined>();
  const [activeTab, setActiveTab] = useState("Answer");
  const [llmHealth, setLlmHealth] = useState<LlmHealth | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/health/llm")
      .then((result) => result.json())
      .then((payload) => { if (!cancelled) setLlmHealth(payload); })
      .catch(() => { if (!cancelled) setLlmHealth({ ok: false, provider: "groq", provider_configured: false, provider_connected: false }); });
    return () => { cancelled = true; };
  }, []);

  async function submit() {
    const trimmed = query.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setCorrectionStatus("");
    try {
      const result = await fetch("/api/okf/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed })
      });
      const payload = await result.json();
      setResponse(payload);
      setSelectedConceptId(undefined);
      setSelectedEvidenceIds(undefined);
      setActiveTab("Answer");
    } finally {
      setLoading(false);
    }
  }

  async function submitCorrection(targetId: string) {
    if (!correctionText.trim()) return;
    const result = await fetch("/api/okf/corrections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_type: "recommendation", target_id: targetId, correction_text: correctionText })
    });
    const payload = await result.json();
    setCorrectionStatus(payload.persisted ? "Issue report saved." : "Issue report captured locally; Supabase is not configured.");
    setCorrectionText("");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-line bg-white px-5 py-6 shadow-research sm:px-6">
        <div className="flex min-w-0 flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 max-w-3xl">
            <Badge>OKF decision support</Badge>
            <h1 className="mt-4 font-serif text-4xl leading-tight text-ink">DSR OKF Decision Assistant</h1>
            <p className="mt-3 text-sm leading-6 text-muted">Evidence-grounded design knowledge reuse across curated DSR papers.</p>
          </div>
          <LlmStatusBadge health={llmHealth} response={response} />
        </div>
      </section>

      <div className={`grid min-w-0 gap-6 ${response ? "min-[1050px]:grid-cols-[minmax(0,1fr)_minmax(320px,390px)]" : "mx-auto max-w-4xl"}`}>
        <div className="min-w-0 space-y-6">
          <AssistantWorkspace
            query={query}
            setQuery={setQuery}
            response={response}
            loading={loading}
            submit={submit}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedConceptId={selectedConceptId}
            setSelectedConceptId={setSelectedConceptId}
            selectedEvidenceIds={selectedEvidenceIds}
            setSelectedEvidenceIds={setSelectedEvidenceIds}
            correctionText={correctionText}
            setCorrectionText={setCorrectionText}
            submitCorrection={submitCorrection}
            correctionStatus={correctionStatus}
          />
        </div>
        {response && (
          <aside className="min-w-0 space-y-4 min-[1050px]:sticky min-[1050px]:top-24 min-[1050px]:max-h-[calc(100vh-96px)] min-[1050px]:overflow-auto">
            <SourcePapersPanel response={response} onSelectEvidenceIds={(ids) => { setSelectedEvidenceIds(ids); setSelectedConceptId(undefined); setActiveTab("Evidence"); }} />
            <EvidenceDrawer response={response} selectedConceptId={selectedConceptId} selectedEvidenceIds={selectedEvidenceIds} compact />
          </aside>
        )}
      </div>
    </div>
  );
}

function LlmStatusBadge({ health, response }: { health: LlmHealth | null; response: OkfChatResponse | null }) {
  const runtime = response?.runtime;
  const provider = providerLabel(runtime?.provider ?? health?.provider ?? "groq");
  const mode = runtime?.synthesis_mode;
  const configured = runtime?.provider_configured ?? health?.provider_configured ?? false;
  const connected = runtime?.provider_connected ?? health?.provider_connected ?? false;
  const label = providerStatusLabel(provider, mode, configured, connected);
  const tone = providerStatusTone(mode, configured, connected);
  return <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium ${tone}`} title={label}><CheckCircle2 className="h-4 w-4" /><span>{label}</span></div>;
}
function AssistantWorkspace({ query, setQuery, response, loading, submit, activeTab, setActiveTab, selectedConceptId, setSelectedConceptId, selectedEvidenceIds, setSelectedEvidenceIds, correctionText, setCorrectionText, submitCorrection, correctionStatus }: { query: string; setQuery: (value: string) => void; response: OkfChatResponse | null; loading: boolean; submit: () => void; activeTab: string; setActiveTab: (value: string) => void; selectedConceptId?: string; setSelectedConceptId: (id: string | undefined) => void; selectedEvidenceIds?: string[]; setSelectedEvidenceIds: (ids: string[] | undefined) => void; correctionText: string; setCorrectionText: (value: string) => void; submitCorrection: (targetId: string) => void; correctionStatus: string }) {
  return (
    <section className="min-w-0 rounded-lg border border-line bg-white shadow-research">
      <div className="space-y-5 p-4 sm:p-5">
        <ChatInputCard query={query} setQuery={setQuery} submit={submit} loading={loading} hasResponse={Boolean(response)} />
        {!response && !loading && <InitialEmptyState onPickQuestion={setQuery} />}
        {loading && <StageProgress response={response} loading={loading} />}
        {response && (
          <div className="min-w-0 space-y-5">
            {!loading && <details className="rounded-md border border-line bg-paper/60 p-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-ink">How this answer was built <ChevronDown className="h-4 w-4 text-muted" /></summary>
              <div className="mt-3"><StageProgress response={response} loading={loading} /></div>
            </details>}
            <Tabs tabs={["Answer", "Flow", "Evidence", "Retrieved Knowledge", "Debug"]} active={activeTab} onChange={setActiveTab} />
            {activeTab === "Answer" && <AnswerTab response={response} correctionText={correctionText} setCorrectionText={setCorrectionText} submitCorrection={submitCorrection} correctionStatus={correctionStatus} selectedConceptId={selectedConceptId} />}
            {activeTab === "Flow" && <DesignMovesFlow response={response} setActiveTab={setActiveTab} onSelectEvidenceIds={setSelectedEvidenceIds} />}
            {activeTab === "Evidence" && <EvidenceDrawer response={response} selectedConceptId={selectedConceptId} selectedEvidenceIds={selectedEvidenceIds} />}
            {activeTab === "Retrieved Knowledge" && <RetrievedKnowledgePanel response={response} onSelectConcept={(id) => { setSelectedConceptId(id); setSelectedEvidenceIds(undefined); }} />}
            {activeTab === "Debug" && <DebugTrace query={query} response={response} />}
          </div>
        )}
      </div>
    </section>
  );
}

function ChatInputCard({ query, setQuery, submit, loading, hasResponse }: { query: string; setQuery: (value: string) => void; submit: () => void; loading: boolean; hasResponse: boolean }) {
  return <div className={`rounded-lg border border-blue/20 bg-blue/5 p-3 ${hasResponse ? "" : "p-4"}`}><textarea className="max-h-[180px] min-h-24 w-full resize-y overflow-auto bg-transparent text-sm leading-6 text-ink outline-none placeholder:text-muted" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Describe the DSR design problem or paper question you want to investigate..." /><div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs leading-5 text-muted">Ask a design problem, paper-specific question, or DSR flow question.</p><Button type="button" onClick={submit} disabled={loading || !query.trim()}><Send className="h-4 w-4" /> {loading ? "Thinking" : "Ask assistant"}</Button></div></div>;
}

function InitialEmptyState({ onPickQuestion }: { onPickQuestion: (value: string) => void }) {
  return <div className="rounded-lg border border-line bg-paper p-4"><p className="text-sm leading-6 text-muted">Ask a design problem, paper-specific question, or DSR flow question.</p><div className="mt-3 flex flex-wrap gap-2">{exampleQuestions.map((question) => <button key={question} type="button" onClick={() => onPickQuestion(question)} className="rounded-full border border-line bg-white px-3 py-2 text-left text-xs font-medium text-ink transition hover:border-blue hover:bg-blue/5">{question}</button>)}</div></div>;
}

function StageProgress({ response, loading }: { response: OkfChatResponse | null; loading: boolean }) {
  const [activeStage, setActiveStage] = useState(0);
  useEffect(() => {
    if (!loading) return;
    const timer = window.setInterval(() => setActiveStage((value) => Math.min(value + 1, 4)), 900);
    return () => window.clearInterval(timer);
  }, [loading]);
  if (!loading && !response) return null;
  const stages = [
    ["Understanding query", "Interpreting the design problem and requested output."],
    ["Selecting sources", "Ranking papers by theme and task fit."],
    ["Retrieving OKF knowledge", "Collecting requirements, principles, features, and artifacts."],
    ["Checking evidence", "Linking design moves to evidence snippets and relations."],
    ["Synthesizing answer", "Preparing readable decision-support guidance."]
  ] as const;
  return <div className="rounded-lg border border-line bg-white p-3"><ol className="grid gap-2 min-[760px]:grid-cols-5">{stages.map(([title, detail], index) => {
    const complete = Boolean(response) || activeStage > index;
    const active = loading && activeStage === index;
    return <li key={title} className="min-w-0 rounded-md border border-line bg-paper/60 p-2"><div className="flex min-w-0 items-center gap-2 text-xs font-medium text-ink"><span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${complete ? "bg-green/10 text-green" : active ? "bg-blue/10 text-blue" : "bg-white text-muted"}`}>{active ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : complete ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}</span><span className="truncate">{title}</span></div><p className="mt-1 text-xs leading-5 text-muted">{detail}</p></li>;
  })}</ol>{response && <p className="mt-3 text-xs text-muted">{response.source_papers.length} source paper(s), {response.retrieved_concepts.length} OKF element(s), {response.evidence.length} evidence snippet(s). {synthesisStageLabel(response)}.</p>}</div>;
}

function AnswerTab({ response, correctionText, setCorrectionText, submitCorrection, correctionStatus, selectedConceptId }: { response: OkfChatResponse; correctionText: string; setCorrectionText: (value: string) => void; submitCorrection: (targetId: string) => void; correctionStatus: string; selectedConceptId?: string }) {
  const synthesis = response.llm_synthesis;
  const rawMarkdown = synthesis?.answer_markdown ?? response.answer;
  const markdown = stripSourcePaperTail(rawMarkdown, response.source_papers.map((paper) => paper.title));
  return <div className="min-w-0 space-y-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-xs font-medium text-muted">Final answer - {response.intent.replace(/_/g, " ").toLowerCase()}</div><h2 className="mt-1 font-serif text-2xl text-ink">Evidence-grounded DSR guidance</h2></div><div className="flex flex-wrap gap-2"><AnswerRuntimeBadge response={response} /><button type="button" onClick={() => navigator.clipboard?.writeText(markdown)} className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-xs font-medium text-ink hover:border-blue"><Clipboard className="h-4 w-4" /> Copy answer</button></div></div><MarkdownAnswer markdown={markdown} failed={Boolean(synthesis?.synthesis_mode?.startsWith("fallback_"))} /><div className="flex flex-col gap-3 rounded-lg border border-line bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap gap-2">{response.source_papers.slice(0, 4).map((paper) => <Badge key={paper.paper_id}>{shortPaperTitle(paper.title)}</Badge>)}</div><p className="mt-3 text-sm text-muted">Evidence details are available in the Evidence tab.</p></div><ReportIssueDrawer response={response} correctionText={correctionText} setCorrectionText={setCorrectionText} submitCorrection={submitCorrection} status={correctionStatus} selectedConceptId={selectedConceptId} /></div></div>;
}

function MarkdownAnswer({ markdown, failed }: { markdown: string; failed: boolean }) {
  const lines = markdown.split(/\r?\n/).filter((line) => line.trim().length > 0);
  return <article className={`min-w-0 rounded-lg border bg-white p-5 leading-7 shadow-sm ${failed ? "border-amber-300" : "border-line"}`}>{lines.map((line, index) => {
    const key = `md-${index}-${normalizeKey(line).slice(0, 32)}`;
    if (line.startsWith("# ")) return <h1 key={key} className="font-serif text-2xl leading-tight text-ink">{line.replace(/^#\s+/, "")}</h1>;
    if (line.startsWith("## ")) return <h2 key={key} className="mt-7 border-t border-line pt-5 text-base font-semibold text-ink">{line.replace(/^##\s+/, "")}</h2>;
    if (line.startsWith("### ")) return <h3 key={key} className="mt-5 rounded-md bg-paper px-3 py-2 text-sm font-semibold text-ink">{line.replace(/^###\s+/, "")}</h3>;
    if (/^\d+\.\s+/.test(line)) return <p key={key} className="mt-4 rounded-md bg-paper px-3 py-2 text-sm font-semibold leading-6 text-ink">{line}</p>;
    if (/^-\s+/.test(line)) return <p key={key} className="ml-2 border-l-2 border-blue/20 pl-3 text-sm leading-7 text-muted" dangerouslySetInnerHTML={{ __html: inlineMarkdown(line.replace(/^[-]\s+/, "")) }} />;
    return <p key={key} className="mt-3 [overflow-wrap:anywhere] text-sm leading-7 text-ink" dangerouslySetInnerHTML={{ __html: inlineMarkdown(line) }} />;
  })}</article>;
}

function inlineMarkdown(value: string) {
  return escapeHtml(value).replace(/\*\*(.+?)\*\*/g, "<strong class=\"text-ink font-semibold\">$1</strong>");
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function AnswerRuntimeBadge({ response }: { response: OkfChatResponse }) {
  const runtime = response.runtime;
  const provider = providerLabel(runtime?.provider);
  const mode = runtime?.synthesis_mode;
  const label = providerStatusLabel(provider, mode, runtime?.provider_configured ?? false, runtime?.provider_connected ?? false);
  const tone = providerStatusTone(mode, runtime?.provider_configured ?? false, runtime?.provider_connected ?? false);
  return <div className={`rounded-full border px-3 py-2 text-xs font-medium ${tone}`}>{label}</div>;
}
type FlowLayerLabel = "Requirement" | "Principle" | "Feature" | "Artifact";

const flowLayerStyles: Record<FlowLayerLabel, string> = {
  Requirement: "okf-flow-card-requirement border-[#cdb8ec] bg-[#E9DDF7]",
  Principle: "okf-flow-card-principle border-[#b7dfc2] bg-[#DFF3E5]",
  Feature: "okf-flow-card-feature border-[#e3c98f] bg-[#F4E2BF]",
  Artifact: "okf-flow-card-artifact border-[#bed0e8] bg-[#E4EEF9]"
};

function DesignMovesFlow({ response, setActiveTab, onSelectEvidenceIds }: { response: OkfChatResponse; setActiveTab: (tab: string) => void; onSelectEvidenceIds: (ids: string[] | undefined) => void }) {
  const rows = (response.flow_rows ?? []).slice(0, 7);
  const flowRequested = ["DSR_FLOW_QUERY", "DESIGN_REUSE_FLOW_QUERY", "DESIGN_REUSE_QUERY"].includes(response.intent);
  if (!flowRequested) return <section className="rounded-lg border border-line bg-white p-5 shadow-research"><div className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink"><GitBranch className="h-4 w-4 text-blue" /> Compact design move paths</div><p className="text-sm leading-6 text-muted">No flow requested for this answer.</p></section>;
  return <section className="rounded-lg border border-line bg-white p-5 shadow-research"><div className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink"><GitBranch className="h-4 w-4 text-blue" /> Compact design move paths</div>{rows.length ? <div className="space-y-3">{rows.map((row, index) => <div key={row.row_id || `flow-row-${index}`} className="min-w-0 rounded-md border border-line bg-paper/70 p-3"><div className="grid min-w-0 items-stretch gap-2 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)]"><FlowStep label="Requirement" value={row.requirement_label} /><FlowArrow /><FlowStep label="Principle" value={row.principle_label} /><FlowArrow /><FlowStep label="Feature" value={row.feature_label} /><FlowArrow /><FlowStep label="Artifact" value={row.artifact_pattern} /></div><div className="mt-3 flex flex-wrap items-center gap-2"><Badge>{row.adaptation_status}</Badge><Badge>{row.confidence}</Badge><button type="button" onClick={() => { onSelectEvidenceIds(row.evidence_ids); setActiveTab("Evidence"); }} className="rounded-md border border-line bg-white px-2 py-1 text-xs font-medium text-ink hover:border-blue">View evidence ({row.evidence_ids.length})</button></div></div>)}</div> : <p className="text-sm leading-6 text-muted">No relation-backed flow rows were returned for this answer.</p>}</section>;
}

function FlowArrow() {
  return <div className="flex items-center justify-center text-muted"><ArrowDown className="h-4 w-4 md:hidden" /><ArrowRight className="hidden h-4 w-4 md:block" /></div>;
}

function FlowStep({ label, value }: { label: FlowLayerLabel; value?: string }) {
  return <div data-dsr-layer={label} className={`min-w-0 rounded-md border p-2.5 text-ink ${flowLayerStyles[label]}`}><div className="text-[11px] font-semibold uppercase tracking-wide text-ink/70">{label}</div><div className="mt-1 [overflow-wrap:anywhere] text-xs font-semibold leading-5 text-ink">{value || "Not specified"}</div></div>;
}

function synthesisStageLabel(response: OkfChatResponse) {
  const provider = providerLabel(response.runtime?.provider);
  const mode = response.runtime?.synthesis_mode;
  if (mode === "groq" || mode === "featherless" || mode === "mock") return `${provider} synthesis used`;
  if (mode === "fallback_rate_limited") return `${provider} rate limit fallback`;
  if (mode === "fallback_provider_error") return `${provider} provider fallback; see Debug`;
  if (mode === "fallback_validation_error") return `${provider} validation fallback; see Debug`;
  if (mode === "structured_okf_answer") return "Structured OKF answer";
  if (response.runtime?.provider_connected) return `${provider} synthesis available`;
  return `${provider} compact fallback`;
}
function DebugTrace({ query, response }: { query: string; response: OkfChatResponse }) {
  const synthesis = response.llm_synthesis;
  const evidenceIds = response.evidence.map((item) => item.evidence_id);
  const paperIds = response.source_papers.map((paper) => paper.paper_id);
  const counts = response.retrieved_concepts.reduce<Record<string, number>>((acc, concept) => ({ ...acc, [concept.type]: (acc[concept.type] ?? 0) + 1 }), {});
  return <details className="rounded-lg border border-line bg-white p-4" open><summary className="cursor-pointer text-sm font-semibold text-ink">Debug / retrieval trace</summary><button type="button" onClick={() => navigator.clipboard?.writeText(JSON.stringify(response, null, 2))} className="mt-3 rounded-md border border-line bg-white px-3 py-2 text-xs font-medium text-ink hover:border-blue">Copy JSON debug</button><div className="mt-3 space-y-2 text-sm leading-6 text-muted"><p><strong className="text-ink">Query:</strong> {query}</p><p><strong className="text-ink">Intent:</strong> {response.intent}</p><p><strong className="text-ink">Provider:</strong> {response.runtime?.provider ?? "none"}; mode {response.runtime?.synthesis_mode ?? "none"}</p><p><strong className="text-ink">Provider status:</strong> {String(response.runtime?.provider_connected ?? false)}; status {response.runtime?.provider_status_code ?? "none"}; error type {response.runtime?.provider_error_type ?? "none"}; fallback {response.runtime?.fallback_reason ?? "none"}</p><p><strong className="text-ink">DB loaded from:</strong> {response.runtime?.db_loaded_from ?? "unknown"}{response.runtime?.db_error_message ? `; ${response.runtime.db_error_message}` : ""}</p><p><strong className="text-ink">Retrieved paper IDs:</strong> {paperIds.join(", ") || "none"}</p><p><strong className="text-ink">Concept counts:</strong> {JSON.stringify(counts)}</p><p><strong className="text-ink">Relations:</strong> {response.flow.edges.length}</p><details><summary className="cursor-pointer font-semibold text-ink">Evidence IDs ({evidenceIds.length})</summary><div className="mt-2 break-all text-xs leading-5">{evidenceIds.join(", ")}</div></details>{synthesis && <details><summary className="cursor-pointer font-semibold text-ink">Provider metadata and compact context</summary><pre className="mt-2 max-h-[520px] overflow-auto whitespace-pre-wrap rounded-md border border-line bg-paper p-3 text-xs leading-5 text-muted">{JSON.stringify({ provider_metadata: synthesis.provider_metadata, debug: synthesis.debug }, null, 2)}</pre></details>}{response.warnings.length > 0 && <p><strong className="text-ink">Warnings:</strong> {response.warnings.join("; ")}</p>}</div></details>;
}

function SourcePapersPanel({ response, onSelectEvidenceIds }: { response: OkfChatResponse | null; onSelectEvidenceIds: (ids: string[] | undefined) => void }) {
  return <Panel title="Source papers" icon={<BookOpen className="h-4 w-4 text-blue" />}>{response?.source_papers.length ? <div className="space-y-3">{response.source_papers.slice(0, 8).map((paper) => {
    const evidenceIds = response.evidence.filter((item) => item.paper_id === paper.paper_id).map((item) => item.evidence_id);
    const reason = sourcePaperReason(paper.role, paper.reason);
    return <div key={paper.paper_id} className="rounded-md border border-line p-3"><div className="[overflow-wrap:anywhere] text-sm font-semibold leading-5 text-ink" title={paper.title}>{shortPaperTitle(paper.title)}</div><div className="mt-2 flex flex-wrap gap-1.5"><Badge>{paper.role}</Badge>{response.intent === "PAPER_DISCOVERY_QUERY" && paper.match_strength && <Badge>{formatMatchStrength(paper.match_strength)} match</Badge>}</div>{reason && <p className="mt-2 text-xs leading-5 text-muted">{reason}</p>}<div className="mt-3 grid grid-cols-4 gap-1.5 text-xs text-muted"><Metric label="Req" value={paper.requirements_count} /><Metric label="Prin" value={paper.principles_count} /><Metric label="Feat" value={paper.features_count} /><Metric label="Evid" value={paper.evidence_count} /></div><button type="button" onClick={() => onSelectEvidenceIds(evidenceIds)} className="mt-3 rounded-md border border-line bg-white px-2 py-1 text-xs font-medium text-ink hover:border-blue">View evidence</button></div>;
  })}</div> : <Empty text="Ask a question to see source papers." />}</Panel>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded border border-line bg-paper px-2 py-1"><span className="font-semibold text-ink">{value}</span> {label}</div>;
}

function RetrievedKnowledgePanel({ response, onSelectConcept }: { response: OkfChatResponse | null; onSelectConcept: (id: string) => void }) {
  return <Panel title="Retrieved design knowledge" icon={<Network className="h-4 w-4 text-blue" />}>{conceptGroups.map(([label, type]) => <KnowledgeGroup key={type} label={label} concepts={dedupeConcepts((response?.retrieved_concepts ?? []).filter((concept) => concept.type === type))} response={response} onSelectConcept={onSelectConcept} />)}</Panel>;
}

function KnowledgeGroup({ label, concepts, response, onSelectConcept }: { label: string; concepts: OkfConcept[]; response: OkfChatResponse | null; onSelectConcept: (id: string) => void }) {
  return <details className="rounded-md border border-line bg-paper p-3"><summary className="cursor-pointer text-xs font-medium text-muted">{label} ({concepts.length})</summary>{concepts.length ? <div className="mt-3 space-y-2">{concepts.map((concept) => <KnowledgeCard key={concept.concept_id || `${concept.paper_id}-${normalizeKey(concept.title)}-${concept.type}`} concept={concept} response={response} onSelectConcept={onSelectConcept} />)}</div> : <p className="mt-3 text-sm text-muted">No retrieved items.</p>}</details>;
}

function KnowledgeCard({ concept, response, onSelectConcept }: { concept: OkfConcept; response: OkfChatResponse | null; onSelectConcept: (id: string) => void }) {
  const evidenceCount = response?.evidence.filter((item) => item.concept_id === concept.concept_id).length ?? 0;
  return <button type="button" onClick={() => onSelectConcept(concept.concept_id)} className="w-full rounded-md border border-line bg-white p-3 text-left transition hover:border-blue hover:bg-blue/5"><div className="[overflow-wrap:anywhere] text-sm font-semibold text-ink">{concept.title}</div><div className="mt-2 flex flex-wrap gap-1.5"><Badge>{shortPaper(concept.paper_id)}</Badge><Badge>{concept.type}</Badge><Badge>{concept.confidence}</Badge><Badge>{evidenceCount} evidence</Badge><Badge>{concept.review_status}</Badge></div><details className="mt-2 text-xs text-muted"><summary className="cursor-pointer">Details</summary><div className="mt-1 break-all">{concept.concept_id}</div></details></button>;
}

function EvidenceDrawer({ response, selectedConceptId, selectedEvidenceIds, compact = false }: { response: OkfChatResponse | null; selectedConceptId?: string; selectedEvidenceIds?: string[]; compact?: boolean }) {
  const [paperFilter, setPaperFilter] = useState("all");
  const paperTitles = new Map((response?.source_papers ?? []).map((paper) => [paper.paper_id, paper.title]));
  const conceptTitles = new Map((response?.retrieved_concepts ?? []).map((concept) => [concept.concept_id, concept.title]));
  const selectedEvidenceSet = selectedEvidenceIds?.length ? new Set(selectedEvidenceIds) : undefined;
  const evidence = (response?.evidence ?? [])
    .filter((item) => selectedEvidenceSet ? selectedEvidenceSet.has(item.evidence_id) : selectedConceptId ? item.concept_id === selectedConceptId : paperFilter !== "all" ? item.paper_id === paperFilter : false)
    .filter((item) => paperFilter === "all" || item.paper_id === paperFilter);
  const selectedConcept = response?.retrieved_concepts.find((concept) => concept.concept_id === selectedConceptId);
  return <Panel title="Evidence" icon={<BookOpen className="h-4 w-4 text-blue" />}><div className="flex items-center gap-2 rounded-md border border-line bg-paper p-2 text-xs text-muted"><Filter className="h-4 w-4 text-blue" /><select className="min-w-0 flex-1 bg-transparent outline-none" value={paperFilter} onChange={(event) => setPaperFilter(event.target.value)}><option value="all">All source papers</option>{(response?.source_papers ?? []).map((paper) => <option key={paper.paper_id} value={paper.paper_id}>{paper.title}</option>)}</select></div>{selectedEvidenceSet && <div className="rounded-md border border-blue/30 bg-blue/5 p-3"><div className="text-sm font-semibold text-ink">Selected flow evidence</div><div className="mt-1 text-xs text-muted">{selectedEvidenceSet.size} evidence reference(s) filtered from the answer row.</div></div>}{!selectedEvidenceSet && selectedConcept && <div className="rounded-md border border-blue/30 bg-blue/5 p-3"><div className="[overflow-wrap:anywhere] text-sm font-semibold text-ink">{selectedConcept.title}</div><div className="mt-1 text-xs text-muted">{selectedConcept.type} - {shortPaper(selectedConcept.paper_id)}</div></div>}{evidence.length ? <div className="space-y-3">{evidence.slice(0, compact ? 6 : 30).map((item) => <details key={item.evidence_id} className="rounded-md border border-line p-3" open><summary className="cursor-pointer [overflow-wrap:anywhere] text-sm font-semibold text-ink">{shortPaperTitle(paperTitles.get(item.paper_id) ?? shortPaper(item.paper_id))}</summary>{item.concept_id && <div className="mt-2 [overflow-wrap:anywhere] text-xs font-medium text-ink">{conceptTitles.get(item.concept_id) ?? "Retrieved concept"}</div>}<div className="mt-1 text-xs text-muted">{item.section || item.page_number ? `${item.section ?? "section unknown"}${item.page_number ? ` - page ${item.page_number}` : ""}` : "Matched element evidence"} {"\u00b7"} {item.confidence}</div><p className="mt-2 text-sm leading-6 text-ink">{item.quote ?? item.paraphrase}</p><details className="mt-2 text-xs text-muted"><summary className="cursor-pointer">Evidence details</summary><div className="mt-1 break-all">{item.evidence_id}</div>{item.concept_id && <div className="mt-1 break-all">{item.concept_id}</div>}</details></details>)}</div> : <Empty text="Select a design move or source paper to inspect evidence." />}</Panel>;
}

function ReportIssueDrawer({ response, correctionText, setCorrectionText, submitCorrection, status, selectedConceptId }: { response: OkfChatResponse; correctionText: string; setCorrectionText: (value: string) => void; submitCorrection: (targetId: string) => void; status: string; selectedConceptId?: string }) {
  const target = selectedConceptId ?? response.requirements[0]?.concept_id ?? response.retrieved_concepts[0]?.concept_id ?? "okf-response";
  return <details className="min-w-[220px]"><summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-xs font-medium text-ink hover:border-blue"><MessageSquareWarning className="h-4 w-4 text-blue" /> Report issue</summary><div className="mt-3 rounded-md border border-line bg-paper p-3"><textarea className="min-h-24 w-full resize-y rounded-md border border-line bg-white p-2 text-sm outline-none focus:border-blue" placeholder="Tell us what seems wrong or unsupported..." value={correctionText} onChange={(event) => setCorrectionText(event.target.value)} /><button type="button" className="mt-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-ink hover:border-blue" onClick={() => submitCorrection(target)}>Submit report</button>{status && <p className="mt-2 text-sm text-muted">{status}</p>}</div></details>;
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <section className="min-w-0 space-y-4 rounded-lg border border-line bg-white p-4 shadow-research"><div className="flex items-center gap-2 text-sm font-semibold text-ink">{icon}{title}</div>{children}</section>;
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm leading-6 text-muted">{text}</p>;
}

function sourcePaperReason(role: string, reason: string) {
  return normalizeKey(role) === normalizeKey(reason) ? undefined : reason;
}

function formatMatchStrength(strength: string) {
  return strength.charAt(0).toUpperCase() + strength.slice(1);
}

function stripSourcePaperTail(markdown: string, paperTitles: string[]) {
  const lines = markdown.replace(/\s+$/g, "").split(/\r?\n/);
  let index = lines.length - 1;
  while (index >= 0 && !lines[index].trim()) index -= 1;
  const tail: string[] = [];
  while (index >= 0 && isBarePaperTitleLine(lines[index], paperTitles)) {
    tail.unshift(lines[index]);
    index -= 1;
    while (index >= 0 && !lines[index].trim()) index -= 1;
  }
  if (tail.length < 2) return markdown;
  return lines.slice(0, index + 1).join("\n").trim();
}

function isBarePaperTitleLine(line: string, paperTitles: string[]) {
  const normalized = normalizePaperTitle(line.replace(/^\s*(?:[-*]|\d+[.)])\s+/, ""));
  return paperTitles.some((title) => {
    const full = normalizePaperTitle(title);
    const short = normalizePaperTitle(shortPaperTitle(title));
    return normalized === full || normalized === short;
  });
}

function normalizePaperTitle(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function shortPaper(paperId: string) {
  return paperId.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function shortPaperTitle(title: string) {
  return title.includes(":") ? title.split(":")[0] : title;
}

function dedupeConcepts(concepts: OkfConcept[]) {
  const seen = new Set<string>();
  return concepts.filter((concept) => {
    const key = concept.concept_id || `${concept.paper_id}-${normalizeKey(concept.title)}-${concept.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function providerStatusLabel(provider: string, mode: string | undefined, configured: boolean, connected: boolean) {
  if (mode === "groq" || mode === "featherless" || mode === "mock") return `${provider} connected · synthesis used`;
  if (mode === "fallback_rate_limited") return `${provider} connected · rate limit fallback`;
  if (mode === "fallback_provider_error") return `${provider} unavailable · compact fallback`;
  if (mode === "fallback_validation_error") return `${provider} connected · validation fallback`;
  if (mode === "structured_okf_answer") return configured ? `${provider} connected · structured OKF answer` : `${provider} not configured · structured OKF answer`;
  if (connected) return `${provider} connected · synthesis available`;
  return configured ? `${provider} unavailable · compact fallback` : `${provider} not configured · structured OKF answer`;
}

function providerStatusTone(mode: string | undefined, configured: boolean, connected: boolean) {
  if (mode === "groq" || mode === "featherless" || mode === "mock") return "border-green/30 bg-green/5 text-green";
  if (mode === "fallback_provider_error" || mode === "fallback_validation_error") return "border-red-200 bg-red-50 text-red-700";
  if (mode === "fallback_rate_limited") return "border-amber-300 bg-amber-50 text-amber-700";
  if (mode === "structured_okf_answer" && connected) return "border-blue/30 bg-blue/5 text-blue";
  if (connected) return "border-green/30 bg-green/5 text-green";
  return configured ? "border-red-200 bg-red-50 text-red-700" : "border-amber-300 bg-amber-50 text-amber-700";
}
function providerLabel(provider?: string) {
  if (provider === "groq") return "Groq";
  if (provider === "openai") return "OpenAI";
  if (provider === "featherless") return "Featherless";
  if (provider === "mock") return "Mock";
  return "Groq";
}




