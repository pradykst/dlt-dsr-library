"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, BookOpen, CheckCircle2, Clipboard, Filter, GitBranch, Network, Send } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import type { OkfChatResponse } from "@/lib/okf/chat.ts";
import type { OkfConcept } from "@/lib/okf/schema.ts";

const starterQuery = "I want to design a DLT-based system that helps marketplaces prevent inconsistent product identities and manipulated product descriptions. What design knowledge from prior DSR papers should I reuse?";
const conceptGroups = [
  ["Requirements", "DesignRequirement"],
  ["Design Principles", "DesignPrinciple"],
  ["Design Features", "DesignFeature"],
  ["Artifact Patterns", "Artifact"],
  ["Evaluation Criteria / Evaluation Evidence", "Evaluation"]
] as const;
type LlmHealth = { ok: boolean; provider: string; provider_configured?: boolean; provider_connected?: boolean };



export function OkfChatWorkspace() {
  const [query, setQuery] = useState(starterQuery);
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
      .catch(() => { if (!cancelled) setLlmHealth({ ok: false, provider: "unknown", provider_configured: false, provider_connected: false }); });
    return () => { cancelled = true; };
  }, []);

  async function submit() {
    setLoading(true);
    setCorrectionStatus("");
    const result = await fetch("/api/okf/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });
    const payload = await result.json();
    setResponse(payload);
    setSelectedConceptId(undefined);
    setSelectedEvidenceIds(undefined);
    setActiveTab("Answer");
    setLoading(false);
  }

  async function submitCorrection(targetId: string) {
    if (!correctionText.trim()) return;
    const result = await fetch("/api/okf/corrections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_type: "recommendation", target_id: targetId, correction_text: correctionText })
    });
    const payload = await result.json();
    setCorrectionStatus(payload.persisted ? "Correction saved." : "Correction captured locally; Supabase is not configured.");
    setCorrectionText("");
  }

  return (
    <div className="space-y-6">
      <section className="border border-line bg-white px-5 py-6 shadow-research sm:px-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Badge>OKF decision support</Badge>
            <h1 className="mt-4 font-serif text-4xl leading-tight text-ink">DSR OKF Chat</h1>
            <p className="mt-3 text-sm leading-6 text-muted">Evidence-backed design recommendations from curated OKF paper bundles. The MVP works without an LLM key.</p>
          </div>
          <LlmStatusBadge health={llmHealth} />
        </div>
      </section>

      <div className={`grid gap-6 min-[1050px]:grid-cols-[minmax(0,1fr)_minmax(360px,420px)] ${response ? "" : "mx-auto max-w-6xl"}`}>
        <div className="space-y-6">
          <AssistantWorkspace query={query} setQuery={setQuery} response={response} loading={loading} submit={submit} activeTab={activeTab} setActiveTab={setActiveTab} selectedConceptId={selectedConceptId} setSelectedConceptId={setSelectedConceptId} selectedEvidenceIds={selectedEvidenceIds} setSelectedEvidenceIds={setSelectedEvidenceIds} />
        </div>
        <aside className="min-w-0 space-y-6 min-[1050px]:sticky min-[1050px]:top-24 min-[1050px]:max-h-[calc(100vh-96px)] min-[1050px]:overflow-auto">
          <SourcePapersPanel response={response} onSelectEvidenceIds={(ids) => { setSelectedEvidenceIds(ids); setSelectedConceptId(undefined); }} />
          <EvidenceDrawer response={response} selectedConceptId={selectedConceptId} selectedEvidenceIds={selectedEvidenceIds} />
          {response && <details className="border border-line bg-white p-4 shadow-research">
            <summary className="cursor-pointer text-sm font-semibold text-ink">Retrieved design knowledge</summary>
            <div className="mt-4"><RetrievedKnowledgePanel response={response} onSelectConcept={setSelectedConceptId} /></div>
          </details>}
          {response && <CorrectionReviewInterface response={response} correctionText={correctionText} setCorrectionText={setCorrectionText} submitCorrection={submitCorrection} status={correctionStatus} selectedConceptId={selectedConceptId} />}
        </aside>
      </div>
    </div>
  );
}

function LlmStatusBadge({ health }: { health: LlmHealth | null }) {
  const connected = health?.provider_connected ?? false;
  const provider = providerLabel(health?.provider);
  const label = !health ? "Checking LLM" : connected ? `${provider} connected` : `${provider} not connected`;
  const detail = !health ? "LLM health pending" : connected ? "LLM synthesis available" : "Compact fallback active";
  return (
    <div className={`flex items-center gap-2 border px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] ${connected ? "border-green/30 bg-green/5 text-green" : "border-amber-300 bg-amber-50 text-amber-700"}`} title={detail}>
      <CheckCircle2 className="h-4 w-4" />
      <span>{label}</span>
      <span className="normal-case tracking-normal opacity-75">{detail}</span>
    </div>
  );
}

function AssistantWorkspace({ query, setQuery, response, loading, submit, activeTab, setActiveTab, selectedConceptId, setSelectedConceptId, selectedEvidenceIds, setSelectedEvidenceIds }: { query: string; setQuery: (value: string) => void; response: OkfChatResponse | null; loading: boolean; submit: () => void; activeTab: string; setActiveTab: (value: string) => void; selectedConceptId?: string; setSelectedConceptId: (id: string | undefined) => void; selectedEvidenceIds?: string[]; setSelectedEvidenceIds: (ids: string[] | undefined) => void }) {
  return (
    <section className="flex min-h-[720px] flex-col border border-line bg-white shadow-research">
      <div className="border-b border-line bg-paper px-5 py-4">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">DSR decision-support assistant</div>
        <h2 className="mt-1 font-serif text-2xl text-ink">OKF Conversation</h2>
      </div>
      <div className="space-y-5 p-4 sm:p-5">
        <div className="ml-auto max-w-[92%] border border-blue/20 bg-blue/5 p-3">
          <textarea className="max-h-[180px] min-h-24 w-full resize-y overflow-auto bg-transparent text-sm leading-6 text-ink outline-none" value={query} onChange={(event) => setQuery(event.target.value)} />
          <div className="mt-3 flex justify-end"><Button type="button" onClick={submit} disabled={loading}><Send className="h-4 w-4" /> {loading ? "Retrieving OKF" : "Ask OKF assistant"}</Button></div>
        </div>
        {loading && <StageProgress response={response} loading={loading} />}
        {response ? (
          <div className="space-y-5">
            {!loading && <details className="border border-line bg-white p-3">
              <summary className="cursor-pointer text-sm font-semibold text-ink">How this answer was built</summary>
              <div className="mt-3"><StageProgress response={response} loading={loading} /></div>
            </details>}
            <Tabs tabs={["Answer", "Flow", "Evidence", "Retrieved Knowledge", "Debug"]} active={activeTab} onChange={setActiveTab} />
            {activeTab === "Answer" && <AnswerTab response={response} onSelectConcept={setSelectedConceptId} setActiveTab={setActiveTab} onSelectEvidenceIds={setSelectedEvidenceIds} />}
            {activeTab === "Flow" && <DesignMovesFlow response={response} setActiveTab={setActiveTab} onSelectEvidenceIds={setSelectedEvidenceIds} />}
            {activeTab === "Evidence" && <EvidenceDrawer response={response} selectedConceptId={selectedConceptId} selectedEvidenceIds={selectedEvidenceIds} />}
            {activeTab === "Retrieved Knowledge" && <RetrievedKnowledgePanel response={response} onSelectConcept={setSelectedConceptId} />}
            {activeTab === "Debug" && <DebugTrace query={query} response={response} />}
          </div>
        ) : (
          <div className="border border-line bg-paper p-4 text-sm leading-6 text-muted">Ask a question to get a concise OKF-backed recommendation.</div>
        )}
      </div>
    </section>
  );
}

function StageProgress({ response, loading }: { response: OkfChatResponse | null; loading: boolean }) {
  const [activeStage, setActiveStage] = useState(0);
  useEffect(() => {
    if (!loading) return;
    const timer = window.setInterval(() => setActiveStage((value) => Math.min(value + 1, 4)), 850);
    return () => window.clearInterval(timer);
  }, [loading]);
  if (!loading && !response) return null;
  const stages = ["Understanding query", "Selecting source papers", "Retrieving DSR elements", "Building evidence-backed flow", "Synthesizing recommendation"];
  return <div className="overflow-hidden border border-line bg-white p-3"><div className="flex flex-wrap items-center gap-2">{stages.map((title, index) => {
    const complete = Boolean(response) || activeStage > index;
    const active = loading && activeStage === index;
    return <div key={title} className={`flex min-w-[150px] flex-1 items-center gap-2 border px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] ${complete ? "border-green/30 bg-green/5 text-green" : active ? "border-blue/30 bg-blue/5 text-blue" : "border-line bg-paper text-muted"}`}><span className={`flex h-4 w-4 items-center justify-center rounded-full ${active ? "animate-pulse bg-blue/20" : complete ? "bg-green/15" : "bg-muted/10"}`}>{complete ? <CheckCircle2 className="h-3 w-3" /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}</span><span>{title}</span></div>;
  })}</div>{response && <p className="mt-2 text-xs text-muted">{response.source_papers.length} source paper(s), {response.retrieved_concepts.length} compact OKF element(s), {response.evidence.length} evidence snippet(s). {synthesisStageLabel(response)}.</p>}</div>;
}

function AnswerTab({ response }: { response: OkfChatResponse; onSelectConcept: (id: string) => void; setActiveTab: (tab: string) => void; onSelectEvidenceIds: (ids: string[] | undefined) => void }) {
  const synthesis = response.llm_synthesis;
  const markdown = synthesis?.answer_markdown ?? response.answer;
  return (
    <div className="demo-message-in min-w-0 space-y-4 border border-line bg-paper p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Final recommendation</div>
          <h3 className="mt-2 font-serif text-2xl text-ink">Evidence-grounded DSR guidance</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <AnswerRuntimeBadge response={response} />
          <button type="button" onClick={() => navigator.clipboard?.writeText(markdown)} className="inline-flex items-center gap-2 border border-line bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink hover:border-blue"><Clipboard className="h-4 w-4" /> Copy answer</button>
        </div>
      </div>
      <MarkdownAnswer markdown={markdown} failed={synthesis?.synthesis_mode === "fallback_error"} />
      <section className="border border-line bg-white p-4">
        <div className="flex flex-wrap gap-2">{response.source_papers.slice(0, 8).map((paper) => <Badge key={paper.paper_id}>{paper.title}</Badge>)}</div>
        <p className="mt-3 text-sm text-muted">Evidence details are in the Evidence tab.</p>
      </section>
    </div>
  );
}

function MarkdownAnswer({ markdown, failed }: { markdown: string; failed: boolean }) {
  const lines = markdown.split(/\r?\n/).filter((line) => line.trim().length > 0);
  return <article className={`border bg-white p-5 ${failed ? "border-amber-300" : "border-line"}`}>{lines.map((line, index) => {
    const key = `md-${index}-${normalizeKey(line).slice(0, 32)}`;
    if (line.startsWith("# ")) return <h1 key={key} className="font-serif text-2xl text-ink">{line.replace(/^#\s+/, "")}</h1>;
    if (line.startsWith("## ")) return <h2 key={key} className="mt-5 text-sm font-semibold uppercase tracking-[0.12em] text-muted">{line.replace(/^##\s+/, "")}</h2>;
    if (/^\d+\.\s+/.test(line)) return <p key={key} className="mt-3 text-sm font-semibold leading-6 text-ink">{line}</p>;
    if (/^-\s+/.test(line)) return <p key={key} className="ml-4 text-sm leading-6 text-muted">{line}</p>;
    return <p key={key} className="mt-2 text-sm leading-6 text-ink">{line}</p>;
  })}</article>;
}
function AnswerRuntimeBadge({ response }: { response: OkfChatResponse }) {
  const runtime = response.runtime;
  const provider = providerLabel(runtime?.provider);
  const usedSynthesis = runtime?.synthesis_mode === "groq" || runtime?.synthesis_mode === "featherless";
  const failed = runtime?.synthesis_mode === "fallback_error";
  const label = usedSynthesis ? `${provider} connected \u00b7 synthesis used` : failed && runtime?.provider_connected ? `${provider} connected \u00b7 synthesis failed` : `${provider} not connected`;
  return <div className={`border px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] ${usedSynthesis ? "border-green/30 bg-green/5 text-green" : "border-amber-300 bg-amber-50 text-amber-700"}`}>{label}</div>;
}
function DesignMovesFlow({ response, setActiveTab, onSelectEvidenceIds }: { response: OkfChatResponse; setActiveTab: (tab: string) => void; onSelectEvidenceIds: (ids: string[] | undefined) => void }) {
  const rows = (response.flow_rows ?? []).slice(0, 7);
  return <section className="border border-line bg-white p-5 shadow-research"><div className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink"><GitBranch className="h-4 w-4 text-blue" /> Compact relation-backed flow</div>{rows.length ? <div className="space-y-3">{rows.map((row, index) => <div key={row.row_id || `flow-row-${index}`} className="grid gap-3 border border-line bg-paper p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]"><FlowStep label="Requirement" value={row.requirement_label} /><FlowStep label="Principle" value={row.principle_label} /><FlowStep label="Feature" value={row.feature_label} /><FlowStep label="Artifact" value={row.artifact_pattern} /><div className="md:col-span-4 flex flex-wrap items-center gap-2"><Badge>{row.adaptation_status}</Badge><Badge>{row.confidence}</Badge><button type="button" onClick={() => { onSelectEvidenceIds(row.evidence_ids); setActiveTab("Evidence"); }} className="border border-line bg-white px-2 py-1 text-xs font-medium text-ink hover:border-blue">View evidence ({row.evidence_ids.length})</button></div></div>)}</div> : <p className="text-sm leading-6 text-muted">Flow is partially query-generated from retrieved OKF concepts.</p>}</section>;
}
function FlowStep({ label, value }: { label: string; value?: string }) {
  return <div className="min-w-0 border border-line bg-white p-2"><div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</div><div className="mt-1 text-xs font-medium leading-5 text-ink">{value ?? "Not specified"}</div></div>;
}

function synthesisStageLabel(response: OkfChatResponse) {
  const provider = providerLabel(response.runtime?.provider);
  if (response.runtime?.synthesis_mode === "groq") return `${provider} synthesis used`;
  if (response.runtime?.synthesis_mode === "fallback_error") return `${provider} synthesis failed; see Debug`;
  if (response.runtime?.provider_connected) return `${provider} synthesis available`;
  return `${provider} not connected`;
}
function DebugTrace({ query, response }: { query: string; response: OkfChatResponse }) {
  const synthesis = response.llm_synthesis;
  const evidenceIds = response.evidence.map((item) => item.evidence_id);
  const paperIds = response.source_papers.map((paper) => paper.paper_id);
  const counts = response.retrieved_concepts.reduce<Record<string, number>>((acc, concept) => ({ ...acc, [concept.type]: (acc[concept.type] ?? 0) + 1 }), {});
  return <details className="border border-line bg-white p-4" open><summary className="cursor-pointer text-sm font-semibold text-ink">Debug / retrieval trace</summary><button type="button" onClick={() => navigator.clipboard?.writeText(JSON.stringify(response, null, 2))} className="mt-3 border border-line bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink hover:border-blue">Copy JSON debug</button><div className="mt-3 space-y-2 text-sm leading-6 text-muted"><p><strong className="text-ink">Query:</strong> {query}</p><p><strong className="text-ink">Intent:</strong> {response.intent}</p><p><strong className="text-ink">Provider:</strong> {response.runtime?.provider ?? "none"}; mode {response.runtime?.synthesis_mode ?? "none"}</p><p><strong className="text-ink">Provider status:</strong> {String(response.runtime?.provider_connected ?? false)}; fallback {response.runtime?.fallback_reason ?? "none"}</p><p><strong className="text-ink">Retrieved paper IDs:</strong> {paperIds.join(", ") || "none"}</p><p><strong className="text-ink">Concept counts:</strong> {JSON.stringify(counts)}</p><p><strong className="text-ink">Relations:</strong> {response.flow.edges.length}</p><details><summary className="cursor-pointer font-semibold text-ink">Evidence IDs ({evidenceIds.length})</summary><div className="mt-2 break-all text-xs leading-5">{evidenceIds.join(", ")}</div></details>{synthesis && <details><summary className="cursor-pointer font-semibold text-ink">Provider metadata and compact context</summary><pre className="mt-2 max-h-[520px] overflow-auto whitespace-pre-wrap border border-line bg-paper p-3 text-xs leading-5 text-muted">{JSON.stringify({ provider_metadata: synthesis.provider_metadata, debug: synthesis.debug }, null, 2)}</pre></details>}{response.warnings.length > 0 && <p><strong className="text-ink">Warnings:</strong> {response.warnings.join("; ")}</p>}</div></details>;
}
function SourcePapersPanel({ response, onSelectEvidenceIds }: { response: OkfChatResponse | null; onSelectEvidenceIds: (ids: string[] | undefined) => void }) {
  return <Panel title="Source papers" icon={<BookOpen className="h-4 w-4 text-blue" />}>{response?.source_papers.length ? response.source_papers.map((paper) => {
    const evidenceIds = response.evidence.filter((item) => item.paper_id === paper.paper_id).map((item) => item.evidence_id);
    return <div key={paper.paper_id} className="border border-line p-3"><div className="text-sm font-semibold leading-5 text-ink">{paper.title}</div><div className="mt-2 flex flex-wrap gap-1.5"><Badge>{paper.role}</Badge></div><p className="mt-2 text-xs leading-5 text-muted">{paper.reason}</p><div className="mt-3 grid grid-cols-4 gap-1.5 text-xs text-muted"><Metric label="Req" value={paper.requirements_count} /><Metric label="Prin" value={paper.principles_count} /><Metric label="Feat" value={paper.features_count} /><Metric label="Evid" value={paper.evidence_count} /></div><button type="button" onClick={() => onSelectEvidenceIds(evidenceIds)} className="mt-3 border border-line bg-white px-2 py-1 text-xs font-medium text-ink hover:border-blue">View evidence</button></div>;
  }) : <Empty text="Ask a question to see source papers and evidence." />}</Panel>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="border border-line bg-paper px-2 py-1"><span className="font-semibold text-ink">{value}</span> {label}</div>;
}

function RetrievedKnowledgePanel({ response, onSelectConcept }: { response: OkfChatResponse | null; onSelectConcept: (id: string) => void }) {
  return <Panel title="Retrieved design knowledge" icon={<Network className="h-4 w-4 text-blue" />}>{conceptGroups.map(([label, type]) => <KnowledgeGroup key={type} label={label} concepts={dedupeConcepts((response?.retrieved_concepts ?? []).filter((concept) => concept.type === type))} response={response} onSelectConcept={onSelectConcept} />)}</Panel>;
}

function KnowledgeGroup({ label, concepts, response, onSelectConcept }: { label: string; concepts: OkfConcept[]; response: OkfChatResponse | null; onSelectConcept: (id: string) => void }) {
  return <details className="border border-line bg-paper p-3"><summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label} ({concepts.length})</summary>{concepts.length ? <div className="mt-3 space-y-2">{concepts.map((concept) => <KnowledgeCard key={concept.concept_id || `${concept.paper_id}-${normalizeKey(concept.title)}-${concept.type}`} concept={concept} response={response} onSelectConcept={onSelectConcept} />)}</div> : <p className="mt-3 text-sm text-muted">No retrieved items.</p>}</details>;
}

function KnowledgeCard({ concept, response, onSelectConcept }: { concept: OkfConcept; response: OkfChatResponse | null; onSelectConcept: (id: string) => void }) {
  const evidenceCount = response?.evidence.filter((item) => item.concept_id === concept.concept_id).length ?? 0;
  return <button type="button" onClick={() => onSelectConcept(concept.concept_id)} className="w-full border border-line p-3 text-left transition hover:border-blue hover:bg-blue/5"><div className="text-sm font-semibold text-ink">{concept.title}</div><div className="mt-2 flex flex-wrap gap-1.5"><Badge>{shortPaper(concept.paper_id)}</Badge><Badge>{concept.type}</Badge><Badge>{concept.confidence}</Badge><Badge>{evidenceCount} evidence</Badge><Badge>{concept.review_status}</Badge></div><details className="mt-2 text-xs text-muted"><summary className="cursor-pointer">Details</summary><div className="mt-1 break-all">{concept.concept_id}</div></details></button>;
}

function EvidenceDrawer({ response, selectedConceptId, selectedEvidenceIds }: { response: OkfChatResponse | null; selectedConceptId?: string; selectedEvidenceIds?: string[] }) {
  const [paperFilter, setPaperFilter] = useState("all");
  const paperTitles = new Map((response?.source_papers ?? []).map((paper) => [paper.paper_id, paper.title]));
  const conceptTitles = new Map((response?.retrieved_concepts ?? []).map((concept) => [concept.concept_id, concept.title]));
  const selectedEvidenceSet = selectedEvidenceIds?.length ? new Set(selectedEvidenceIds) : undefined;
  const evidence = (response?.evidence ?? [])
    .filter((item) => selectedEvidenceSet ? selectedEvidenceSet.has(item.evidence_id) : selectedConceptId ? item.concept_id === selectedConceptId : paperFilter !== "all" ? item.paper_id === paperFilter : false)
    .filter((item) => paperFilter === "all" || item.paper_id === paperFilter);
  const selectedConcept = response?.retrieved_concepts.find((concept) => concept.concept_id === selectedConceptId);
  return <Panel title="Evidence" icon={<BookOpen className="h-4 w-4 text-blue" />}><div className="flex items-center gap-2 border border-line bg-paper p-2 text-xs text-muted"><Filter className="h-4 w-4 text-blue" /><select className="min-w-0 flex-1 bg-transparent outline-none" value={paperFilter} onChange={(event) => setPaperFilter(event.target.value)}><option value="all">All source papers</option>{(response?.source_papers ?? []).map((paper) => <option key={paper.paper_id} value={paper.paper_id}>{paper.title}</option>)}</select></div>{selectedEvidenceSet && <div className="border border-blue/30 bg-blue/5 p-3"><div className="text-sm font-semibold text-ink">Selected flow evidence</div><div className="mt-1 text-xs text-muted">{selectedEvidenceSet.size} evidence reference(s) filtered from the answer row.</div></div>}{!selectedEvidenceSet && selectedConcept && <div className="border border-blue/30 bg-blue/5 p-3"><div className="text-sm font-semibold text-ink">{selectedConcept.title}</div><div className="mt-1 text-xs text-muted">{selectedConcept.type} - {shortPaper(selectedConcept.paper_id)}</div></div>}{evidence.length ? evidence.map((item) => <details key={item.evidence_id} className="border border-line p-3" open><summary className="cursor-pointer text-sm font-semibold text-ink">{paperTitles.get(item.paper_id) ?? shortPaper(item.paper_id)}</summary>{item.concept_id && <div className="mt-2 text-xs font-medium text-ink">{conceptTitles.get(item.concept_id) ?? "Retrieved concept"}</div>}<div className="mt-1 text-xs text-muted">{item.section || item.page_number ? `${item.section ?? "section unknown"}${item.page_number ? ` - page ${item.page_number}` : ""}` : "Matched element evidence"} {"\u00b7"} {item.confidence}</div><p className="mt-2 text-sm leading-6 text-ink">{item.quote ?? item.paraphrase}</p><details className="mt-2 text-xs text-muted"><summary className="cursor-pointer">Evidence details</summary><div className="mt-1 break-all">{item.evidence_id}</div>{item.concept_id && <div className="mt-1 break-all">{item.concept_id}</div>}</details></details>) : <Empty text={response ? "Select a design move or source paper to inspect evidence." : "Ask a question to see source papers and evidence."} />}</Panel>;
}
function CorrectionReviewInterface({ response, correctionText, setCorrectionText, submitCorrection, status, selectedConceptId }: { response: OkfChatResponse | null; correctionText: string; setCorrectionText: (value: string) => void; submitCorrection: (targetId: string) => void; status: string; selectedConceptId?: string }) {
  const target = selectedConceptId ?? response?.requirements[0]?.concept_id ?? response?.retrieved_concepts[0]?.concept_id ?? "okf-response";
  return <Panel title="Correction review" icon={<AlertTriangle className="h-4 w-4 text-blue" />}><textarea className="min-h-24 w-full border border-line bg-paper p-2 text-sm outline-none focus:border-blue" placeholder="Mark a recommendation, concept, relation, or evidence item as wrong..." value={correctionText} onChange={(event) => setCorrectionText(event.target.value)} /><button type="button" className="mt-2 border border-line bg-white px-3 py-2 text-sm font-medium text-ink hover:border-blue" onClick={() => submitCorrection(target)} disabled={!response}>Submit correction</button>{status && <p className="mt-2 text-sm text-muted">{status}</p>}</Panel>;
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <section className="space-y-4 border border-line bg-white p-4 shadow-research"><div className="flex items-center gap-2 text-sm font-semibold text-ink">{icon}{title}</div>{children}</section>;
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm leading-6 text-muted">{text}</p>;
}

function shortPaper(paperId: string) {
  return paperId.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
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
function providerLabel(provider?: string) {
  if (provider === "groq") return "Groq";
  if (provider === "openai") return "OpenAI";
  if (provider === "featherless") return "Featherless";
  return "LLM";
}
