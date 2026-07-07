"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, BookOpen, CheckCircle2, GitBranch, Network, Send } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import type { OkfChatResponse } from "@/lib/okf/chat.ts";
import type { OkfConcept, OkfFlowNode } from "@/lib/okf/schema.ts";

const starterQuery = "I want to design a DLT-based system that helps marketplaces prevent inconsistent product identities and manipulated product descriptions. What design knowledge from prior DSR papers should I reuse?";
const conceptGroups = [
  ["Requirements", "DesignRequirement"],
  ["Design Principles", "DesignPrinciple"],
  ["Design Features", "DesignFeature"],
  ["Artifact Patterns", "Artifact"],
  ["Evaluation Criteria / Evaluation Evidence", "Evaluation"]
] as const;
type LlmHealth = { ok: boolean; provider: string; featherless_configured: boolean };

const flowColumns = [
  ["Problem", ["Problem", "ResearchQuestion"]],
  ["Requirements", ["DesignRequirement"]],
  ["Principles", ["DesignPrinciple"]],
  ["Features", ["DesignFeature"]],
  ["Artifact", ["Artifact"]],
  ["Evaluation", ["Evaluation"]],
  ["Output Knowledge", ["OutputKnowledge", "KernelTheory", "Limitation"]]
] as const;

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
      .catch(() => { if (!cancelled) setLlmHealth({ ok: false, provider: "unknown", featherless_configured: false }); });
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

      <div className="grid gap-6 min-[1050px]:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
        <div className="space-y-6">
          <AssistantWorkspace query={query} setQuery={setQuery} response={response} loading={loading} submit={submit} activeTab={activeTab} setActiveTab={setActiveTab} selectedConceptId={selectedConceptId} setSelectedConceptId={setSelectedConceptId} selectedEvidenceIds={selectedEvidenceIds} setSelectedEvidenceIds={setSelectedEvidenceIds} />
        </div>
        <aside className="min-w-0 space-y-6 min-[1050px]:sticky min-[1050px]:top-24 min-[1050px]:max-h-[calc(100vh-96px)] min-[1050px]:overflow-auto">
          <SourcePapersPanel response={response} />
          <EvidenceDrawer response={response} selectedConceptId={selectedConceptId} selectedEvidenceIds={selectedEvidenceIds} />
          <details className="border border-line bg-white p-4 shadow-research">
            <summary className="cursor-pointer text-sm font-semibold text-ink">Retrieved design knowledge</summary>
            <div className="mt-4"><RetrievedKnowledgePanel response={response} onSelectConcept={setSelectedConceptId} /></div>
          </details>
          <CorrectionReviewInterface response={response} correctionText={correctionText} setCorrectionText={setCorrectionText} submitCorrection={submitCorrection} status={correctionStatus} selectedConceptId={selectedConceptId} />
        </aside>
      </div>
    </div>
  );
}

function LlmStatusBadge({ health }: { health: LlmHealth | null }) {
  const connected = health?.provider === "featherless" && health.featherless_configured;
  const label = !health ? "Checking Featherless" : connected ? "Featherless connected" : "Featherless not connected";
  const detail = !health ? "LLM health pending" : connected ? "LLM synthesis enabled" : "Deterministic fallback active";
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
        <StageProgress response={response} loading={loading} />
        {response ? (
          <div className="space-y-5">
            <Tabs tabs={["Answer", "Flow", "Evidence", "Retrieved Knowledge", "Debug"]} active={activeTab} onChange={setActiveTab} />
            {activeTab === "Answer" && <AnswerTab response={response} onSelectConcept={setSelectedConceptId} setActiveTab={setActiveTab} onSelectEvidenceIds={setSelectedEvidenceIds} />}
            {activeTab === "Flow" && <DsrGraphView response={response} onSelectConcept={setSelectedConceptId} />}
            {activeTab === "Evidence" && <EvidenceDrawer response={response} selectedConceptId={selectedConceptId} selectedEvidenceIds={selectedEvidenceIds} />}
            {activeTab === "Retrieved Knowledge" && <RetrievedKnowledgePanel response={response} onSelectConcept={setSelectedConceptId} />}
            {activeTab === "Debug" && <DebugTrace query={query} response={response} />}
          </div>
        ) : (
          <div className="border border-line bg-paper p-4 text-sm leading-6 text-muted">Ask a design question to retrieve OKF-backed requirements, principles, features, artifacts, evidence, and a query-specific DSR flow.</div>
        )}
      </div>
    </section>
  );
}

function StageProgress({ response, loading }: { response: OkfChatResponse | null; loading: boolean }) {
  const stages = [
    ["Understanding query", response ? "Detected the requested DSR task and output shape." : "Waiting for a design or paper question."],
    ["Selecting source papers", response ? `${response.source_papers.length} source paper panel item(s) prepared.` : "Matching paper titles, aliases, and concept metadata."],
    ["Retrieving DSR elements", response ? `${response.retrieved_concepts.length} OKF concept(s) retrieved.` : "Looking for requirements, principles, features, artifacts, and evaluations."],
    ["Building flow", response ? `${response.flow.edges.length} stored relation edge(s) used.` : "Constructing only relation-backed DSR paths."],
    ["Checking evidence", response ? `${response.evidence.length} evidence item(s) linked.` : "Validating evidence and citations."],
    ["Drafting recommendation", response ? "Deterministic recommendation ready." : "Preparing a readable researcher-facing answer."]
  ];
  return <div className="grid gap-2 md:grid-cols-3">{stages.map(([title, body], index) => <div key={title} className={`border p-3 ${response || loading ? "border-blue/25 bg-blue/5" : "border-line bg-paper"}`}><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.1em] text-ink"><span className={`h-2 w-2 ${response || (loading && index < 3) ? "bg-blue" : "bg-muted/40"}`} />{title}</div><p className="mt-2 text-xs leading-5 text-muted">{body}</p></div>)}</div>;
}

function AnswerTab({ response, onSelectConcept, setActiveTab, onSelectEvidenceIds }: { response: OkfChatResponse; onSelectConcept: (id: string) => void; setActiveTab: (tab: string) => void; onSelectEvidenceIds: (ids: string[] | undefined) => void }) {
  return <div className="demo-message-in min-w-0 space-y-5 border border-line bg-paper p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Final recommendation</div><h3 className="mt-2 font-serif text-2xl text-ink">Evidence-backed design guidance</h3></div><button type="button" onClick={() => navigator.clipboard?.writeText(response.answer)} className="border border-line bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink hover:border-blue">Copy answer markdown</button></div><AnswerText answer={response.answer} /><FlowRows response={response} setActiveTab={setActiveTab} onSelectEvidenceIds={onSelectEvidenceIds} /><GuidanceCards response={response} onSelectConcept={onSelectConcept} /><EvaluationCriteria response={response} /><MiniFlow response={response} onSelectConcept={onSelectConcept} /></div>;
}

function AnswerText({ answer }: { answer: string }) {
  const [first, ...rest] = answer.split("\n\n");
  return <div className="border border-line bg-white p-4"><p className="text-sm font-medium leading-6 text-ink">{first}</p>{rest.length > 0 && <div className="mt-4 space-y-3 text-sm leading-6 text-muted">{rest.map((part) => <p key={part} className="whitespace-pre-line">{part}</p>)}</div>}</div>;
}

function FlowRows({ response, setActiveTab, onSelectEvidenceIds }: { response: OkfChatResponse; setActiveTab: (tab: string) => void; onSelectEvidenceIds: (ids: string[] | undefined) => void }) {
  const rows = response.flow_rows ?? response.answer_payload?.flow_rows ?? [];
  if (!rows.length) return null;
  return <section className="border border-line bg-white p-4"><h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Requirement {"->"} Principle {"->"} Feature {"->"} Artifact rows</h4><div className="mt-3 space-y-3">{rows.map((row) => <div key={row.row_id} className="min-w-0 border border-line bg-paper p-3"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="text-sm font-semibold text-ink">{row.requirement_label}</div><p className="mt-2 [overflow-wrap:anywhere] text-xs leading-5 text-muted">{row.principle_label} {"->"} {row.feature_label} {"->"} {row.artifact_pattern}</p></div><button type="button" onClick={() => { onSelectEvidenceIds(row.evidence_ids); setActiveTab("Evidence"); }} className="shrink-0 border border-line bg-white px-2 py-1 text-xs font-medium text-ink hover:border-blue">View evidence ({row.evidence_ids.length})</button></div><div className="mt-2 flex flex-wrap gap-1.5"><Badge>{row.adaptation_status}</Badge><Badge>{row.confidence}</Badge>{row.supporting_papers.map((paper) => <Badge key={`${row.row_id}-${paper}`}>{shortPaper(paper)}</Badge>)}</div><details className="mt-2"><summary className="cursor-pointer text-xs font-semibold text-muted">Evidence ids and adaptation</summary><p className="mt-2 text-xs leading-5 text-muted">{row.adaptation_text}</p><div className="mt-1 break-all text-xs text-muted">{row.evidence_ids.join(", ") || "No linked evidence"}</div></details></div>)}</div></section>;
}
function GuidanceCards({ response, onSelectConcept }: { response: OkfChatResponse; onSelectConcept: (id: string) => void }) {
  const groups = [["Recommended requirements", response.requirements], ["Reusable design principles", response.principles], ["Candidate features", response.features], ["Artifact direction", response.artifact_direction]] as const;
  return <div className="grid gap-3 md:grid-cols-2">{groups.map(([title, cards]) => <section key={title} className="border border-line bg-white p-3"><h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">{title}</h4><div className="mt-3 space-y-2">{cards.length ? cards.map((card) => <button key={`${title}-${card.title}`} type="button" onClick={() => card.concept_id && onSelectConcept(card.concept_id)} className="w-full border border-line bg-paper p-3 text-left hover:border-blue"><div className="text-sm font-semibold text-ink">{card.title}</div><div className="mt-2 flex flex-wrap gap-1"><Badge>{card.paper_id === "query_generated" ? "query_generated" : card.paper_id ?? "OKF"}</Badge><Badge>{card.confidence}</Badge><Badge>{card.evidence_ids.length} evidence</Badge></div></button>) : <p className="text-sm text-muted">Available in flow rows or retrieved knowledge.</p>}</div></section>)}</div>;
}

function EvaluationCriteria({ response }: { response: OkfChatResponse }) {
  const criteria = [
    ["Comprehensiveness", response.retrieved_concepts.length >= 6 ? "Multiple relevant DSR elements were retrieved." : "The answer uses a narrow set of retrieved elements."],
    ["Generality", response.source_papers.length > 1 ? "The recommendation abstracts across more than one paper." : "The answer is scoped to one primary paper unless cross-paper reuse was requested."],
    ["Soundness", response.evidence.length > 0 && response.flow.edges.length > 0 ? "Recommendations are linked to evidence and stored relations." : "Evidence or stored relation coverage is limited."]
  ];
  return <section className="border border-line bg-white p-4"><h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Evaluation criteria</h4><div className="mt-3 grid gap-3 md:grid-cols-3">{criteria.map(([label, body]) => <div key={label} className="border border-green/30 bg-green/5 p-3"><div className="text-sm font-semibold text-ink">{label}</div><p className="mt-2 text-xs leading-5 text-muted">{body}</p></div>)}</div></section>;
}

function DebugTrace({ query, response }: { query: string; response: OkfChatResponse }) {
  return <details className="border border-line bg-white p-4" open><summary className="cursor-pointer text-sm font-semibold text-ink">Debug / retrieval trace</summary><button type="button" onClick={() => navigator.clipboard?.writeText(JSON.stringify(response, null, 2))} className="mt-3 border border-line bg-white px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink hover:border-blue">Copy JSON debug</button><div className="mt-3 space-y-2 text-sm leading-6 text-muted"><p><strong className="text-ink">Query:</strong> {query}</p><p><strong className="text-ink">Intent:</strong> {response.intent}</p><p><strong className="text-ink">Retrieved:</strong> {response.retrieved_concepts.length} concepts, {response.evidence.length} evidence items, {response.flow.edges.length} flow edges.</p>{response.warnings.length > 0 && <p><strong className="text-ink">Warnings:</strong> {response.warnings.join("; ")}</p>}</div></details>;
}

function SourcePapersPanel({ response }: { response: OkfChatResponse | null }) {
  return <Panel title="Source papers" icon={<BookOpen className="h-4 w-4 text-blue" />}>{response?.source_papers.length ? response.source_papers.map((paper) => <div key={paper.paper_id} className="border border-line p-3"><div className="text-sm font-semibold text-ink">{paper.title}</div><div className="mt-1 text-xs text-muted">{paper.paper_id}</div><div className="mt-2 flex flex-wrap gap-1.5"><Badge>{paper.reason}</Badge><Badge>{paper.role}</Badge></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted"><Metric label="Req" value={paper.requirements_count} /><Metric label="Prin" value={paper.principles_count} /><Metric label="Feat" value={paper.features_count} /><Metric label="Evid" value={paper.evidence_count} /></div></div>) : <Empty text="Ask a question to see matched papers." />}</Panel>;
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="border border-line bg-paper px-2 py-1"><span className="font-semibold text-ink">{value}</span> {label}</div>;
}

function RetrievedKnowledgePanel({ response, onSelectConcept }: { response: OkfChatResponse | null; onSelectConcept: (id: string) => void }) {
  return <Panel title="Retrieved design knowledge" icon={<Network className="h-4 w-4 text-blue" />}>{conceptGroups.map(([label, type]) => <KnowledgeGroup key={type} label={label} concepts={(response?.retrieved_concepts ?? []).filter((concept) => concept.type === type)} response={response} onSelectConcept={onSelectConcept} />)}</Panel>;
}

function KnowledgeGroup({ label, concepts, response, onSelectConcept }: { label: string; concepts: OkfConcept[]; response: OkfChatResponse | null; onSelectConcept: (id: string) => void }) {
  return <div><div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</div>{concepts.length ? <div className="space-y-2">{concepts.map((concept) => <KnowledgeCard key={concept.concept_id} concept={concept} response={response} onSelectConcept={onSelectConcept} />)}</div> : <p className="text-sm text-muted">No retrieved items.</p>}</div>;
}

function KnowledgeCard({ concept, response, onSelectConcept }: { concept: OkfConcept; response: OkfChatResponse | null; onSelectConcept: (id: string) => void }) {
  const evidenceCount = response?.evidence.filter((item) => item.concept_id === concept.concept_id).length ?? 0;
  return <button type="button" onClick={() => onSelectConcept(concept.concept_id)} className="w-full border border-line p-3 text-left transition hover:border-blue hover:bg-blue/5"><div className="text-sm font-semibold text-ink">{concept.title}</div><div className="mt-2 flex flex-wrap gap-1.5"><Badge>{shortPaper(concept.paper_id)}</Badge><Badge>{concept.type}</Badge><Badge>{concept.confidence}</Badge><Badge>{evidenceCount} evidence</Badge><Badge>{concept.review_status}</Badge></div><details className="mt-2 text-xs text-muted"><summary className="cursor-pointer">Details</summary><div className="mt-1 break-all">{concept.concept_id}</div></details></button>;
}

function MiniFlow({ response, onSelectConcept }: { response: OkfChatResponse; onSelectConcept: (id: string) => void }) {
  return <section className="border border-line bg-white p-5 shadow-research"><div className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink"><GitBranch className="h-4 w-4 text-blue" /> MiniFlow</div><LayeredFlow response={response} compact onSelectConcept={onSelectConcept} /></section>;
}

function DsrGraphView({ response, onSelectConcept }: { response: OkfChatResponse; onSelectConcept: (id: string) => void }) {
  return <section className="border border-line bg-white p-5 shadow-research"><div className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink"><Network className="h-4 w-4 text-blue" /> DsrGraphView</div><LayeredFlow response={response} onSelectConcept={onSelectConcept} /></section>;
}

function LayeredFlow({ response, compact = false, onSelectConcept }: { response: OkfChatResponse; compact?: boolean; onSelectConcept: (id: string) => void }) {
  const nodesById = new Map(response.flow.nodes.map((node) => [node.id, node]));
  const columns = flowColumns.map(([label, types]) => ({ label, nodes: response.flow.nodes.filter((node) => (types as readonly string[]).includes(node.type)) }));
  return <div className="overflow-x-auto pb-2"><div className="grid min-w-[1120px] grid-cols-7 gap-3">{columns.map((column) => <div key={column.label} className="border border-line bg-paper/70 p-2"><div className="mb-2 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{column.label}</div><div className="space-y-2">{column.nodes.length ? column.nodes.map((node) => <FlowCard key={node.id} node={node} response={response} nodesById={nodesById} compact={compact} onSelectConcept={onSelectConcept} />) : <div className="border border-dashed border-line bg-white p-2 text-center text-xs text-muted">No node</div>}</div></div>)}</div></div>;
}

function FlowCard({ node, response, nodesById, compact, onSelectConcept }: { node: OkfFlowNode; response: OkfChatResponse; nodesById: Map<string, OkfFlowNode>; compact: boolean; onSelectConcept: (id: string) => void }) {
  const outgoing = response.flow.edges.filter((edge) => edge.source === node.id && nodesById.has(edge.target));
  const concept = response.retrieved_concepts.find((item) => item.concept_id === node.concept_id);
  return <button type="button" onClick={() => node.concept_id && onSelectConcept(node.concept_id)} className={`w-full border p-2 text-left transition hover:border-blue ${node.query_generated ? "border-amber-300 bg-amber-50" : "border-line bg-white"}`}><div className="text-xs font-semibold text-ink">{node.label}</div><div className="mt-1 flex flex-wrap gap-1"><span className="border border-line bg-paper px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em] text-muted">{node.query_generated ? "query_generated" : node.type}</span>{node.paper_id && <span className="border border-line bg-paper px-1.5 py-0.5 text-[10px] text-muted">{shortPaper(node.paper_id)}</span>}<span className="border border-line bg-paper px-1.5 py-0.5 text-[10px] text-muted">{node.confidence}</span></div>{!compact && concept?.description && <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted">{concept.description}</p>}{outgoing.length > 0 && <div className="mt-2 space-y-1">{outgoing.map((edge) => <div key={`${edge.source}-${edge.target}-${edge.relation_id ?? edge.predicate}`} className="text-[11px] leading-4 text-blue" title={edge.predicate}>? {nodesById.get(edge.target)?.label}</div>)}</div>}</button>;
}

function EvidenceDrawer({ response, selectedConceptId, selectedEvidenceIds }: { response: OkfChatResponse | null; selectedConceptId?: string; selectedEvidenceIds?: string[] }) {
  const paperTitles = new Map((response?.source_papers ?? []).map((paper) => [paper.paper_id, paper.title]));
  const selectedEvidenceSet = selectedEvidenceIds?.length ? new Set(selectedEvidenceIds) : undefined;
  const evidence = response?.evidence.filter((item) => selectedEvidenceSet ? selectedEvidenceSet.has(item.evidence_id) : !selectedConceptId || item.concept_id === selectedConceptId) ?? [];
  const selectedConcept = response?.retrieved_concepts.find((concept) => concept.concept_id === selectedConceptId);
  return <Panel title="Evidence" icon={<BookOpen className="h-4 w-4 text-blue" />}>{selectedEvidenceSet && <div className="border border-blue/30 bg-blue/5 p-3"><div className="text-sm font-semibold text-ink">Selected flow-row evidence</div><div className="mt-1 text-xs text-muted">{selectedEvidenceSet.size} evidence reference(s) filtered from the answer row.</div></div>}{!selectedEvidenceSet && selectedConcept && <div className="border border-blue/30 bg-blue/5 p-3"><div className="text-sm font-semibold text-ink">{selectedConcept.title}</div><div className="mt-1 text-xs text-muted">{selectedConcept.type} ? {shortPaper(selectedConcept.paper_id)}</div></div>}{evidence.length ? evidence.map((item) => <details key={item.evidence_id} className="border border-line p-3" open><summary className="cursor-pointer text-sm font-semibold text-ink">{paperTitles.get(item.paper_id) ?? shortPaper(item.paper_id)}</summary><div className="mt-2 text-xs text-muted">{item.section || item.page_number ? `${item.section ?? "section unknown"}${item.page_number ? ` ? page ${item.page_number}` : ""}` : "Matched element evidence"}</div><p className="mt-2 text-sm leading-6 text-ink">{item.quote ?? item.paraphrase}</p><details className="mt-2 text-xs text-muted"><summary className="cursor-pointer">Details</summary><div className="mt-1 break-all">{item.evidence_id}</div>{item.concept_id && <div className="mt-1 break-all">{item.concept_id}</div>}</details></details>) : <Empty text="Select a concept card to inspect its evidence." />}</Panel>;
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
  if (paperId === "BLOCKCHAIN_IOT_SDPS_2019") return "Blockchain IoT SDPS";
  if (paperId === "SHORT_END_STICK_2025") return "Short End Stick";
  return paperId;
}










