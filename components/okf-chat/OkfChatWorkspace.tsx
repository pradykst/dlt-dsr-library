"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, BookOpen, CheckCircle2, Network, Send, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { OkfChatResponse } from "@/lib/okf/chat.ts";
import type { OkfConcept } from "@/lib/okf/schema.ts";

const starterQuery = "I want to design a DLT-based system that helps marketplaces prevent inconsistent product identities and manipulated product descriptions. What design knowledge from prior DSR papers should I reuse?";
const conceptGroups = [
  ["Requirements", "DesignRequirement"],
  ["Design Principles", "DesignPrinciple"],
  ["Design Features", "DesignFeature"],
  ["Artifact Patterns", "Artifact"],
  ["Evaluation Criteria", "Evaluation"]
] as const;

export function OkfChatWorkspace() {
  const [query, setQuery] = useState(starterQuery);
  const [response, setResponse] = useState<OkfChatResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [correctionText, setCorrectionText] = useState("");
  const [correctionStatus, setCorrectionStatus] = useState("");

  async function submit() {
    setLoading(true);
    setCorrectionStatus("");
    const result = await fetch("/api/okf/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });
    setResponse(await result.json());
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
          <div className="flex items-center gap-2 border border-blue/20 bg-blue/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-blue">
            <CheckCircle2 className="h-4 w-4" /> Deterministic fallback active
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,0.9fr)]">
        <div className="space-y-6">
          <ChatTimeline query={query} setQuery={setQuery} response={response} loading={loading} submit={submit} />
          {response && <MiniFlow response={response} />}
          {response && <DsrGraphView response={response} />}
        </div>
        <aside className="space-y-6">
          <SourcePapersPanel response={response} />
          <RetrievedKnowledgePanel response={response} />
          <EvidenceDrawer response={response} />
          <CorrectionReviewInterface response={response} correctionText={correctionText} setCorrectionText={setCorrectionText} submitCorrection={submitCorrection} status={correctionStatus} />
        </aside>
      </div>
    </div>
  );
}

function ChatTimeline({ query, setQuery, response, loading, submit }: { query: string; setQuery: (value: string) => void; response: OkfChatResponse | null; loading: boolean; submit: () => void }) {
  return (
    <section className="border border-line bg-white shadow-research">
      <div className="border-b border-line px-5 py-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink"><SlidersHorizontal className="h-4 w-4 text-blue" /> ChatTimeline</div>
      </div>
      <div className="space-y-4 p-5">
        <textarea className="min-h-32 w-full border border-line bg-paper p-3 text-sm leading-6 outline-none focus:border-blue" value={query} onChange={(event) => setQuery(event.target.value)} />
        <Button type="button" onClick={submit} disabled={loading}><Send className="h-4 w-4" /> {loading ? "Retrieving OKF" : "Ask OKF assistant"}</Button>
        <div className="space-y-3">
          <Message role="User query" text={query} />
          {response && <Message role="Assistant reasoning stages" text={`Intent: ${response.intent}\nRetrieved ${response.retrieved_concepts.length} concepts, ${response.evidence.length} evidence items, and ${response.flow.edges.length} flow edges.`} />}
          {response && <Message role="Final recommendation" text={response.answer} />}
          {response?.warnings?.length ? <Message role="Validation warnings" text={response.warnings.join("\n")} warning /> : null}
        </div>
      </div>
    </section>
  );
}

function Message({ role, text, warning = false }: { role: string; text: string; warning?: boolean }) {
  return <div className={`border ${warning ? "border-amber-300 bg-amber-50" : "border-line bg-white"} p-3`}><div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{role}</div><p className="whitespace-pre-line text-sm leading-6 text-ink">{text}</p></div>;
}

function SourcePapersPanel({ response }: { response: OkfChatResponse | null }) {
  return <Panel title="SourcePapersPanel" icon={<BookOpen className="h-4 w-4 text-blue" />}>{response?.source_papers.length ? response.source_papers.map((paper) => <div key={paper.paper_id} className="border border-line p-3"><div className="text-sm font-semibold text-ink">{paper.title}</div><div className="mt-1 text-xs text-muted">{paper.paper_id}</div><Badge className="mt-2">{paper.role}</Badge></div>) : <Empty text="Ask a question to see matched papers." />}</Panel>;
}

function RetrievedKnowledgePanel({ response }: { response: OkfChatResponse | null }) {
  return <Panel title="RetrievedKnowledgePanel" icon={<Network className="h-4 w-4 text-blue" />}>{conceptGroups.map(([label, type]) => <KnowledgeGroup key={type} label={label} concepts={(response?.retrieved_concepts ?? []).filter((concept) => concept.type === type)} />)}</Panel>;
}

function KnowledgeGroup({ label, concepts }: { label: string; concepts: OkfConcept[] }) {
  return <div><div className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{label}</div>{concepts.length ? <div className="space-y-2">{concepts.map((concept) => <div key={concept.concept_id} className="border border-line p-2"><div className="text-sm font-medium text-ink">{concept.title}</div><div className="mt-1 text-xs text-muted">{concept.concept_id} · {concept.confidence}</div></div>)}</div> : <p className="text-sm text-muted">No retrieved items.</p>}</div>;
}

function MiniFlow({ response }: { response: OkfChatResponse }) {
  return <section className="border border-line bg-white p-5 shadow-research"><div className="mb-4 text-sm font-semibold text-ink">MiniFlow</div><div className="flex gap-3 overflow-x-auto pb-2">{response.flow.nodes.map((node, index) => <div key={node.id} className="flex items-center gap-3"><div className="min-w-48 border border-line bg-paper p-3"><div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{node.type}{node.query_generated ? " · query_generated" : ""}</div><div className="mt-2 text-sm font-semibold text-ink">{node.label}</div><div className="mt-2 text-xs text-muted">{node.confidence}</div></div>{index < response.flow.nodes.length - 1 && <span className="text-muted">→</span>}</div>)}</div></section>;
}

function DsrGraphView({ response }: { response: OkfChatResponse }) {
  const layout = useMemo(() => response.flow.nodes.map((node, index) => ({ node, x: 70 + index * 150, y: 80 + (index % 2) * 70 })), [response]);
  const byId = new Map(layout.map((item) => [item.node.id, item]));
  return <section className="border border-line bg-white p-5 shadow-research"><div className="mb-4 text-sm font-semibold text-ink">DsrGraphView</div><svg viewBox="0 0 980 260" className="h-72 w-full border border-line bg-paper">{response.flow.edges.map((edge) => { const source = byId.get(edge.source); const target = byId.get(edge.target); if (!source || !target) return null; return <g key={`${edge.source}-${edge.target}`}><line x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke="#6c7a89" strokeWidth="2" /><text x={(source.x + target.x) / 2} y={(source.y + target.y) / 2 - 8} textAnchor="middle" className="fill-slate-600 text-[10px]">{edge.predicate}</text></g>; })}{layout.map(({ node, x, y }) => <g key={node.id}><circle cx={x} cy={y} r="28" fill={node.query_generated ? "#fef3c7" : "#dbeafe"} stroke="#6c7a89" /><text x={x} y={y + 44} textAnchor="middle" className="fill-slate-800 text-[10px]"><tspan>{node.type}</tspan></text></g>)}</svg></section>;
}

function EvidenceDrawer({ response }: { response: OkfChatResponse | null }) {
  return <Panel title="EvidenceDrawer" icon={<BookOpen className="h-4 w-4 text-blue" />}>{response?.evidence.length ? response.evidence.map((item) => <details key={item.evidence_id} className="border border-line p-3" open><summary className="cursor-pointer text-sm font-semibold text-ink">{item.paper_id}</summary><div className="mt-2 text-xs text-muted">Matched element: {item.concept_id ?? "paper-level"}</div><p className="mt-2 text-sm leading-6 text-ink">{item.quote ?? item.paraphrase}</p><div className="mt-2 text-xs text-muted">Evidence: {item.evidence_id} · {item.confidence}</div></details>) : <Empty text="Evidence will appear with retrieved concepts." />}</Panel>;
}

function CorrectionReviewInterface({ response, correctionText, setCorrectionText, submitCorrection, status }: { response: OkfChatResponse | null; correctionText: string; setCorrectionText: (value: string) => void; submitCorrection: (targetId: string) => void; status: string }) {
  const target = response?.requirements[0]?.concept_id ?? response?.retrieved_concepts[0]?.concept_id ?? "okf-response";
  return <Panel title="CorrectionReviewInterface" icon={<AlertTriangle className="h-4 w-4 text-blue" />}><textarea className="min-h-24 w-full border border-line bg-paper p-2 text-sm outline-none focus:border-blue" placeholder="Mark a recommendation, concept, relation, or evidence item as wrong..." value={correctionText} onChange={(event) => setCorrectionText(event.target.value)} /><button type="button" className="mt-2 border border-line bg-white px-3 py-2 text-sm font-medium text-ink hover:border-blue" onClick={() => submitCorrection(target)} disabled={!response}>Submit correction</button>{status && <p className="mt-2 text-sm text-muted">{status}</p>}</Panel>;
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <section className="space-y-4 border border-line bg-white p-4 shadow-research"><div className="flex items-center gap-2 text-sm font-semibold text-ink">{icon}{title}</div>{children}</section>;
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm leading-6 text-muted">{text}</p>;
}
