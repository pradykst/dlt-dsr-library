"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { BookOpen, CheckCircle2, ChevronDown, Clipboard, Filter, GitBranch, Loader2, MessageSquareWarning, Network, Send } from "lucide-react";
import ReactFlow, { Background, Controls, MarkerType, type Edge, type Node } from "reactflow";
import "reactflow/dist/style.css";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs } from "@/components/ui/Tabs";
import type { OkfChatResponse } from "@/lib/okf/chat.ts";
import type { OkfConcept } from "@/lib/okf/schema.ts";
import type { LlmProviderOutcome, LlmProviderStatus } from "@/lib/llm/provider.ts";

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

type ProviderStatusView = Omit<LlmProviderStatus, "provider"> & { provider: string };
type LlmHealth = Partial<Omit<LlmProviderStatus, "provider">> & { ok: boolean; provider: string; provider_configured?: boolean; provider_connected?: boolean; status?: number; error?: string; provider_error_type?: string; health_cached?: boolean; health_stale?: boolean; health_mode?: "passive" | "live" | "mock" };

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
      .catch(() => { if (!cancelled) setLlmHealth({ ok: false, provider: "none", configured: false, reachable: false, attempted: false, outcome: "not_configured" }); });
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
  if (!health && !response) return <div className="inline-flex items-center gap-2 rounded-full border border-line bg-white px-3 py-2 text-xs font-medium text-muted" title="LLM provider status is loading"><CheckCircle2 className="h-4 w-4" /><span>LLM status pending</span></div>;
  const status = response ? providerStatusForResponse(response) : providerStatusForHealth(health);
  const label = providerStatusLabel(status);
  const tone = providerStatusTone(status);
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
  const status = providerStatusForResponse(response);
  const failed = status.outcome === "rate_limited" || status.outcome === "validation_error" || status.outcome === "provider_error";
  return <div className="min-w-0 space-y-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="text-xs font-medium text-muted">Final answer - {response.intent.replace(/_/g, " ").toLowerCase()}</div><h2 className="mt-1 font-serif text-2xl text-ink">Evidence-grounded DSR guidance</h2></div><div className="flex flex-wrap gap-2"><AnswerRuntimeBadge response={response} /><button type="button" onClick={() => navigator.clipboard?.writeText(response.answer)} className="inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-xs font-medium text-ink hover:border-blue"><Clipboard className="h-4 w-4" /> Copy answer</button></div></div><MarkdownAnswer markdown={response.answer} failed={failed} /><div className="flex flex-col gap-3 rounded-lg border border-line bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap gap-2">{response.source_papers.slice(0, 4).map((paper) => <Badge key={paper.paper_id}>{shortPaperTitle(paper.title)}</Badge>)}</div><p className="mt-3 text-sm text-muted">Evidence details are available in the Evidence tab.</p></div><ReportIssueDrawer response={response} correctionText={correctionText} setCorrectionText={setCorrectionText} submitCorrection={submitCorrection} status={correctionStatus} selectedConceptId={selectedConceptId} /></div></div>;
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
  const status = providerStatusForResponse(response);
  const label = providerStatusLabel(status);
  const tone = providerStatusTone(status);
  return <div className={`rounded-full border px-3 py-2 text-xs font-medium ${tone}`}>{label}</div>;
}
type FlowLayerLabel = "Requirement" | "Principle" | "Feature" | "Artifact";
type FlowGraphSelection = { kind: "node"; id: string } | { kind: "edge"; id: string } | null;

type GraphNode = OkfChatResponse["flow_graph"]["nodes"][number];
type GraphEdge = OkfChatResponse["flow_graph"]["edges"][number];

const visibleFlowLayers: FlowLayerLabel[] = ["Requirement", "Principle", "Feature", "Artifact"];
const flowEdgeClassNames = { stored: "flow-edge--stored", mixed: "flow-edge--mixed", query_generated: "flow-edge--query-generated" } as const;
const flowLayerStyles: Record<FlowLayerLabel, { className: string; background: string; border: string }> = {
  Requirement: { className: "flow-node--requirement", background: "#E9DDF7", border: "#cdb8ec" },
  Principle: { className: "flow-node--principle", background: "#DFF3E5", border: "#b7dfc2" },
  Feature: { className: "flow-node--feature", background: "#F4E2BF", border: "#e3c98f" },
  Artifact: { className: "flow-node--artifact", background: "#E4EEF9", border: "#bed0e8" }
};

function DesignMovesFlow({ response, setActiveTab, onSelectEvidenceIds }: { response: OkfChatResponse; setActiveTab: (tab: string) => void; onSelectEvidenceIds: (ids: string[] | undefined) => void }) {
  const graph = response.flow_graph ?? response.flow;
  const [selection, setSelection] = useState<FlowGraphSelection>(null);
  const flowRequested = response.intent === "DSR_FLOW_QUERY" || response.intent === "DESIGN_REUSE_FLOW_QUERY";
  const visibleGraphNodes = useMemo(() => graph.nodes.filter((node) => visibleFlowLayers.includes(node.layer as FlowLayerLabel)), [graph.nodes]);
  const visibleNodeIds = useMemo(() => new Set(visibleGraphNodes.map((node) => node.id)), [visibleGraphNodes]);
  const reactNodes: Node[] = useMemo(() => {
    const rowCount = new Map<string, number>();
    return visibleGraphNodes.map((node) => {
      const layer = node.layer as FlowLayerLabel;
      const column = visibleFlowLayers.indexOf(layer);
      const row = rowCount.get(layer) ?? 0;
      rowCount.set(layer, row + 1);
      const style = flowLayerStyles[layer];
      return {
        id: node.id,
        position: { x: column * 275, y: row * 118 },
        data: { label: <FlowGraphNodeLabel node={node} /> },
        className: `flow-node ${style.className} flow-node--${node.provenance.replace("_", "-")}`,
        style: {
          width: 210,
          minHeight: 78,
          border: `1px solid ${style.border}`,
          borderRadius: 6,
          background: style.background,
          color: "#20242a",
          fontSize: 12,
          lineHeight: 1.35,
          whiteSpace: "normal",
          overflowWrap: "anywhere",
          padding: 10,
          boxShadow: selection?.kind === "node" && selection.id === node.id ? "0 0 0 3px rgba(32, 36, 42, 0.16)" : "none"
        } satisfies CSSProperties
      };
    });
  }, [selection, visibleGraphNodes]);
  const reactEdges: Edge[] = useMemo(() => graph.edges
    .filter((edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target))
    .map((edge) => {
      const focused = selection?.kind === "edge" && selection.id === edge.id;
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: "smoothstep",
        label: focused ? readablePredicate(edge.predicate) : undefined,
        className: `flow-edge ${flowEdgeClassNames[edge.provenance]}`,
        markerEnd: { type: MarkerType.ArrowClosed, color: focused ? "#20242a" : edgeColor(edge.provenance) },
        style: {
          stroke: focused ? "#20242a" : edgeColor(edge.provenance),
          strokeWidth: focused ? 3 : edge.provenance === "stored" ? 2.2 : 2,
          strokeDasharray: edgeDash(edge.provenance),
          opacity: focused ? 0.95 : 0.72
        },
        labelStyle: { fill: "#20242a", fontSize: 10, fontWeight: 700 },
        labelBgStyle: { fill: "#ffffff", fillOpacity: 0.94 },
        labelBgPadding: [4, 3] as [number, number]
      };
    }), [graph.edges, selection, visibleNodeIds]);

  if (!flowRequested || !visibleGraphNodes.length) {
    return <section className="rounded-lg border border-line bg-white p-5 shadow-research"><div className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink"><GitBranch className="h-4 w-4 text-blue" /> DSR flow graph</div><p className="text-sm leading-6 text-muted">No flow requested for this answer.</p></section>;
  }

  const selectedNode = selection?.kind === "node" ? graph.nodes.find((node) => node.id === selection.id) : undefined;
  const selectedEdge = selection?.kind === "edge" ? graph.edges.find((edge) => edge.id === selection.id) : undefined;

  return <section className="rounded-lg border border-line bg-white p-5 shadow-research"><div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"><div><div className="flex items-center gap-2 text-sm font-semibold text-ink"><GitBranch className="h-4 w-4 text-blue" /> DSR flow graph</div><p className="mt-2 text-xs leading-5 text-muted">{flowModeNotice(graph.mode)}</p></div><FlowLegend /></div><div className="grid min-w-0 gap-0 xl:grid-cols-[minmax(0,1fr)_310px]"><div className="h-[620px] min-w-0 border border-line bg-paper/50"><ReactFlow nodes={reactNodes} edges={reactEdges} fitView minZoom={0.28} nodesDraggable={false} onNodeClick={(_, node) => { const graphNode = graph.nodes.find((item) => item.id === node.id); setSelection({ kind: "node", id: node.id }); onSelectEvidenceIds(graphNode?.evidence_ids.length ? graphNode.evidence_ids : undefined); }} onEdgeClick={(_, edge) => { const graphEdge = graph.edges.find((item) => item.id === edge.id); setSelection({ kind: "edge", id: edge.id }); onSelectEvidenceIds(graphEdge?.evidence_ids.length ? graphEdge.evidence_ids : undefined); }} onPaneClick={() => { setSelection(null); onSelectEvidenceIds(undefined); }}><Background color="#d8d6cc" gap={28} /><Controls /></ReactFlow></div><FlowGraphInspector node={selectedNode} edge={selectedEdge} graph={graph} setActiveTab={setActiveTab} onSelectEvidenceIds={onSelectEvidenceIds} /></div></section>;
}

function FlowGraphNodeLabel({ node }: { node: GraphNode }) {
  return <div data-dsr-layer={node.layer} className="min-w-0"><div className="text-[10px] font-semibold uppercase tracking-wide text-ink/65">{node.layer}</div><div className="mt-1 [overflow-wrap:anywhere] text-xs font-semibold leading-5 text-ink">{node.label}</div><div className="mt-2 flex flex-wrap gap-1"><span className="rounded-sm border border-ink/10 bg-white/55 px-1.5 py-0.5 text-[10px] font-medium text-ink/70">{node.provenance}</span><span className="rounded-sm border border-ink/10 bg-white/55 px-1.5 py-0.5 text-[10px] font-medium text-ink/70">{node.confidence}</span></div></div>;
}

function FlowGraphInspector({ node, edge, graph, setActiveTab, onSelectEvidenceIds }: { node?: GraphNode; edge?: GraphEdge; graph: OkfChatResponse["flow_graph"]; setActiveTab: (tab: string) => void; onSelectEvidenceIds: (ids: string[] | undefined) => void }) {
  const selected = node ?? edge;
  if (!selected) return <aside className="min-h-[220px] border border-line bg-white p-4 text-sm leading-6 text-muted xl:border-l-0">Click a graph node or edge to filter the evidence panel.</aside>;
  const evidenceIds = selected.evidence_ids ?? [];
  const source = edge ? graph.nodes.find((item) => item.id === edge.source) : undefined;
  const target = edge ? graph.nodes.find((item) => item.id === edge.target) : undefined;
  return <aside className="max-h-[620px] min-h-[220px] overflow-y-auto border border-line bg-white p-4 xl:border-l-0"><Badge>{selected.provenance}</Badge><h3 className="mt-3 [overflow-wrap:anywhere] text-base font-semibold leading-6 text-ink">{node ? node.label : `${source?.label ?? "Source"} -> ${target?.label ?? "Target"}`}</h3><div className="mt-3 space-y-2 text-xs leading-5 text-muted"><p><strong className="text-ink">Confidence:</strong> {selected.confidence}</p>{edge && <p><strong className="text-ink">Relation:</strong> {readablePredicate(edge.predicate)}</p>}{node?.short_description && <p>{node.short_description}</p>}<p><strong className="text-ink">Evidence refs:</strong> {evidenceIds.length}</p></div>{evidenceIds.length > 0 && <button type="button" onClick={() => { onSelectEvidenceIds(evidenceIds); setActiveTab("Evidence"); }} className="mt-4 rounded-md border border-line bg-paper px-3 py-2 text-xs font-medium text-ink hover:border-blue">Open evidence</button>}</aside>;
}

function FlowLegend() {
  return <div className="flex flex-wrap gap-2">{visibleFlowLayers.map((layer) => <span key={layer} className="inline-flex items-center gap-2 rounded-sm border border-line bg-paper px-2 py-1 text-[11px] uppercase tracking-wide text-muted"><span className="h-2.5 w-2.5 border border-ink/20" style={{ background: flowLayerStyles[layer].background }} />{layer}</span>)}<span className="inline-flex items-center gap-2 rounded-sm border border-line bg-paper px-2 py-1 text-[11px] uppercase tracking-wide text-muted"><span className="h-px w-5 bg-[#4f6f91]" />Stored</span><span className="inline-flex items-center gap-2 rounded-sm border border-line bg-paper px-2 py-1 text-[11px] uppercase tracking-wide text-muted"><span className="h-px w-5 border-t border-dashed border-[#8a6f35]" />Generated</span></div>;
}

function flowModeNotice(mode: string) {
  if (mode === "stored_paper_flow") return "Stored OKF relations are rendered as solid edges. Node and edge clicks filter evidence.";
  if (mode === "mixed_reuse_flow") return "This flow is partly query-generated from retrieved OKF design knowledge. Stored edges are solid; mixed/generated edges are visually distinguished.";
  return "This flow is query-generated from retrieved OKF design knowledge and should be treated as a design hypothesis.";
}

function edgeColor(provenance: string) {
  if (provenance === "stored") return "#4f6f91";
  if (provenance === "mixed") return "#7a6f58";
  return "#8a6f35";
}

function edgeDash(provenance: string) {
  if (provenance === "query_generated") return "6 5";
  if (provenance === "mixed") return "2 4";
  return undefined;
}

function readablePredicate(value: string) {
  return value.replace(/_/g, " ");
}

function synthesisStageLabel(response: OkfChatResponse) {
  const status = providerStatusForResponse(response);
  const provider = providerLabel(status.provider);
  if (status.outcome === "synthesis_used") return `${provider} synthesis used`;
  if (status.outcome === "rate_limited") return `${provider} rate limit fallback`;
  if (status.outcome === "provider_error") return `${provider} provider fallback; see Debug`;
  if (status.outcome === "validation_error") return `${provider} validation fallback; see Debug`;
  if (status.outcome === "synthesis_skipped") return `${provider} synthesis skipped`;
  return "Structured OKF answer";
}
function DebugTrace({ query, response }: { query: string; response: OkfChatResponse }) {
  const synthesis = response.llm_synthesis;
  const providerStatus = providerStatusForResponse(response);
  const evidenceIds = response.evidence.map((item) => item.evidence_id);
  const paperIds = response.source_papers.map((paper) => paper.paper_id);
  const counts = response.retrieved_concepts.reduce<Record<string, number>>((acc, concept) => ({ ...acc, [concept.type]: (acc[concept.type] ?? 0) + 1 }), {});
  return <details className="rounded-lg border border-line bg-white p-4" open><summary className="cursor-pointer text-sm font-semibold text-ink">Debug / retrieval trace</summary><button type="button" onClick={() => navigator.clipboard?.writeText(JSON.stringify(response, null, 2))} className="mt-3 rounded-md border border-line bg-white px-3 py-2 text-xs font-medium text-ink hover:border-blue">Copy JSON debug</button><div className="mt-3 space-y-2 text-sm leading-6 text-muted"><p><strong className="text-ink">Query:</strong> {query}</p><p><strong className="text-ink">Intent:</strong> {response.intent}</p><p><strong className="text-ink">Provider:</strong> {providerStatus.provider}; outcome {providerStatus.outcome}</p><p><strong className="text-ink">Provider status:</strong> configured {String(providerStatus.configured)}; reachable {String(providerStatus.reachable)}; attempted {String(providerStatus.attempted)}; HTTP {providerStatus.http_status ?? "none"}; error type {providerStatus.error_type ?? "none"}; fallback {providerStatus.fallback_reason ?? "none"}</p><p><strong className="text-ink">DB loaded from:</strong> {response.runtime?.db_loaded_from ?? "unknown"}{response.runtime?.db_error_message ? `; ${response.runtime.db_error_message}` : ""}</p><p><strong className="text-ink">Retrieved paper IDs:</strong> {paperIds.join(", ") || "none"}</p><p><strong className="text-ink">Concept counts:</strong> {JSON.stringify(counts)}</p><p><strong className="text-ink">Relations:</strong> {response.flow.edges.length}</p><details><summary className="cursor-pointer font-semibold text-ink">Evidence IDs ({evidenceIds.length})</summary><div className="mt-2 break-all text-xs leading-5">{evidenceIds.join(", ")}</div></details><details><summary className="cursor-pointer font-semibold text-ink">FlowGraph JSON</summary><pre className="mt-2 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-md border border-line bg-paper p-3 text-xs leading-5 text-muted">{JSON.stringify(response.flow_graph ?? response.flow, null, 2)}</pre></details>{synthesis && <details><summary className="cursor-pointer font-semibold text-ink">Provider metadata and compact context</summary><pre className="mt-2 max-h-[520px] overflow-auto whitespace-pre-wrap rounded-md border border-line bg-paper p-3 text-xs leading-5 text-muted">{JSON.stringify({ provider_metadata: synthesis.provider_metadata, debug: synthesis.debug }, null, 2)}</pre></details>}{response.warnings.length > 0 && <p><strong className="text-ink">Warnings:</strong> {response.warnings.join("; ")}</p>}</div></details>;
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

function providerStatusForResponse(response: OkfChatResponse): ProviderStatusView {
  const runtime = response.runtime;
  if (runtime?.provider_status) return runtime.provider_status;
  const provider = runtime?.provider ?? response.llm_synthesis?.provider_metadata.provider ?? "none";
  const configured = runtime?.provider_configured ?? provider === "mock";
  const attempted = runtime?.synthesis_attempted ?? false;
  const httpStatus = runtime?.provider_status_code ?? response.llm_synthesis?.provider_metadata.status;
  const errorType = runtime?.provider_error_type ?? response.llm_synthesis?.provider_metadata.error_type;
  const outcome = legacyProviderOutcome(runtime?.synthesis_mode ?? response.llm_synthesis?.synthesis_mode, provider, configured, attempted, httpStatus);
  return {
    provider,
    configured,
    reachable: runtime?.provider_connected ?? (attempted && httpStatus !== undefined),
    attempted,
    http_status: httpStatus,
    outcome,
    error_type: errorType,
    fallback_reason: runtime?.fallback_reason
  };
}

function providerStatusForHealth(health: LlmHealth | null): ProviderStatusView {
  if (!health) return { provider: "none", configured: false, reachable: false, attempted: false, outcome: "not_configured" };
  const configured = health.configured ?? health.provider_configured ?? false;
  const reachable = health.reachable ?? health.provider_connected ?? false;
  const attempted = health.attempted ?? (health.health_mode === "live" && configured);
  const httpStatus = health.http_status ?? health.status;
  const errorType = health.error_type ?? health.provider_error_type;
  const outcome = health.outcome ?? legacyHealthOutcome(health.provider, configured, reachable, attempted, httpStatus, errorType);
  return { provider: health.provider, configured, reachable, attempted, http_status: httpStatus, outcome, error_type: errorType, fallback_reason: health.fallback_reason ?? health.error };
}

function legacyProviderOutcome(mode: string | undefined, provider: string, configured: boolean, attempted: boolean, status?: number): LlmProviderOutcome {
  if (mode === "gemini" || mode === "groq" || mode === "mock" || mode === "featherless") return "synthesis_used";
  if (mode === "fallback_rate_limited") return "rate_limited";
  if (mode === "fallback_validation_error") return "validation_error";
  if (mode === "fallback_provider_error") return "provider_error";
  if (mode === "structured_okf_answer") return configured && provider !== "none" ? "synthesis_skipped" : "not_configured";
  if (provider === "none" || !configured) return "not_configured";
  if (!attempted) return "configured";
  return status !== undefined ? "reachable" : "provider_error";
}

function legacyHealthOutcome(provider: string, configured: boolean, reachable: boolean, attempted: boolean, status?: number, errorType?: string): LlmProviderOutcome {
  if (provider === "none" || !configured) return "not_configured";
  if (!attempted) return "configured";
  if (status === 429 || /rate.limit|resource.exhausted/i.test(errorType ?? "")) return "rate_limited";
  return reachable ? "reachable" : "provider_error";
}

function providerStatusLabel(status: ProviderStatusView) {
  const separator = "\u00b7";
  const provider = providerStatusText(status);
  if (status.outcome === "not_configured") return status.provider === "none" ? `No LLM configured ${separator} structured OKF answer` : `${provider} not configured ${separator} structured OKF answer`;
  if (status.outcome === "configured") return `${provider} configured ${separator} availability not checked`;
  if (status.outcome === "reachable") return `${provider} ${separator} reachable`;
  if (status.outcome === "synthesis_skipped") return `${provider} configured ${separator} synthesis skipped`;
  if (status.outcome === "synthesis_used") return `${provider} ${separator} synthesis used`;
  if (status.outcome === "rate_limited") return `${provider} ${separator} rate limit fallback`;
  if (status.outcome === "validation_error") return `${provider} ${separator} validation fallback`;
  return `${provider} ${separator} provider fallback`;
}

function providerStatusText(status: ProviderStatusView) {
  const provider = providerLabel(status.provider);
  if (status.http_status && status.error_type) return `${provider} ${status.http_status} ${status.error_type}`;
  if (status.http_status) return `${provider} ${status.http_status}`;
  if (status.error_type) return `${provider} ${status.error_type}`;
  return provider;
}

function providerStatusTone(status: ProviderStatusView) {
  if (status.outcome === "synthesis_used" || status.outcome === "reachable") return "border-green/30 bg-green/5 text-green";
  if (status.outcome === "configured" || status.outcome === "synthesis_skipped") return "border-blue/30 bg-blue/5 text-blue";
  if (status.outcome === "provider_error" || status.outcome === "validation_error") return "border-red-200 bg-red-50 text-red-700";
  return "border-amber-300 bg-amber-50 text-amber-700";
}

function providerLabel(provider?: string) {
  if (provider === "gemini") return "Gemini";
  if (provider === "groq") return "Groq";
  if (provider === "mock") return "Mock";
  if (provider === "none" || !provider) return "No LLM";
  return "LLM";
}


