"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Activity, AlertTriangle, Bot, ChevronDown, ChevronRight, Database, Loader2, Send, SlidersHorizontal, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type { RagAnswerSection, RagChatDebug, RagChatResponse, RagMatchClassification, RagSource } from "@/lib/rag/types";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  sections?: RagAnswerSection[];
  sources?: RagSource[];
  debug?: RagChatDebug;
  error?: RagChatResponse["error"];
};

type ProviderStatus = {
  connected: boolean;
  provider?: string;
  model: string;
  latencyMs?: number;
  error?: string;
};

type RagStatusResponse = {
  chat: ProviderStatus;
  embedding: ProviderStatus;
  checkedAt: string;
};

const sampleQuestions = [
  "Which papers use tokenization as a design feature?",
  "Which papers use NFTs or digital collectibles?",
  "Which papers use smart contracts?",
  "Compare papers that use blockchain for trust versus incentives.",
  "Explain the design principle to design feature flow in the peer review token paper."
];

const elementTypes = [
  "Problem",
  "Requirement",
  "Design Principle",
  "Design Feature",
  "Artifact",
  "Evaluation",
  "Output Knowledge"
];

const isDev = process.env.NODE_ENV !== "production";

export function DsrChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [paperId, setPaperId] = useState("");
  const [elementType, setElementType] = useState("");
  const [chunkType, setChunkType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [ragStatus, setRagStatus] = useState<RagStatusResponse>();
  const [statusLoading, setStatusLoading] = useState(false);

  const apiMessages = useMemo(
    () => messages.map(({ role, content }) => ({ role, content })),
    [messages]
  );

  useEffect(() => {
    void refreshStatus();
  }, []);

  async function refreshStatus() {
    setStatusLoading(true);
    try {
      const response = await fetch("/api/rag/status", { cache: "no-store" });
      const result = await response.json() as RagStatusResponse;
      setRagStatus(result);
    } catch {
      setRagStatus(undefined);
    } finally {
      setStatusLoading(false);
    }
  }

  async function submitQuestion(event?: FormEvent<HTMLFormElement>, override?: string) {
    event?.preventDefault();
    const content = (override ?? question).trim();
    if (!content || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setQuestion("");
    setError(undefined);
    setLoading(true);

    try {
      const response = await fetch("/api/rag/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...apiMessages, { role: "user", content }],
          filters: {
            paper_id: paperId || undefined,
            element_type: elementType || undefined,
            chunk_type: chunkType || undefined
          }
        })
      });
      const result = await response.json() as RagChatResponse | { error?: string; details?: string };
      if (!response.ok && !("answerText" in result)) {
        throw new Error([result.error, result.details].filter(Boolean).join(" "));
      }

      if ("answerText" in result) {
        setMessages([...nextMessages, {
          role: "assistant",
          content: result.answerText,
          sections: result.sections ?? [],
          sources: result.sources ?? [],
          debug: result.debug,
          error: result.error
        }]);
        if (result.error) setError(result.error.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setMessages(nextMessages);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section className="min-w-0">
        <div className="mb-6">
          <Badge>RAG Workbench</Badge>
          <h1 className="mt-3 font-serif text-4xl text-ink">DSR Research Chatbot</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Ask questions across papers, DSR elements, relations, and evidence.</p>
        </div>

        <Card className="flex min-h-[620px] flex-col overflow-hidden bg-white">
          <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-5">
            {messages.length === 0 && (
              <div className="border border-dashed border-line bg-paper p-5">
                <h2 className="text-sm font-semibold text-ink">Start with a research question</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {sampleQuestions.map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      className="border border-line bg-white px-3 py-2 text-left text-xs leading-5 text-muted transition hover:border-blue hover:text-ink"
                      onClick={() => submitQuestion(undefined, sample)}
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <MessageBubble key={`${message.role}-${index}`} message={message} />
            ))}

            {loading && (
              <div className="flex items-center gap-2 border border-line bg-paper px-4 py-3 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin text-blue" />
                Retrieving exact labels, keywords, relations, evidence, and vector matches...
              </div>
            )}
          </div>

          {error && <div className="border-t border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <form className="border-t border-line bg-paper p-3 sm:p-4" onSubmit={submitQuestion}>
            <div className="flex flex-col gap-3 sm:flex-row">
              <textarea
                className="min-h-20 flex-1 resize-none border border-line bg-white px-3 py-2 text-sm leading-6 outline-none transition focus:border-blue"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ask about DSR elements, relations, evaluations, artifacts, or evidence..."
              />
              <Button type="submit" disabled={loading || !question.trim()} className="sm:self-end">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send
              </Button>
            </div>
          </form>
        </Card>
      </section>

      <aside className="space-y-4">
        <ProviderStatusCard status={ragStatus} loading={statusLoading} onRefresh={refreshStatus} />

        <Card className="bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <SlidersHorizontal className="h-4 w-4 text-blue" />
            Filters
          </div>
          <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Paper ID
            <Input className="mt-2 normal-case tracking-normal" value={paperId} onChange={(event) => setPaperId(event.target.value)} placeholder="Optional paper_id" />
          </label>
          <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Element Type
            <select className="mt-2 w-full border border-line bg-white px-3 py-2 text-sm normal-case tracking-normal text-ink outline-none focus:border-blue" value={elementType} onChange={(event) => setElementType(event.target.value)}>
              <option value="">Any element type</option>
              {elementTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Chunk Type
            <Input className="mt-2 normal-case tracking-normal" value={chunkType} onChange={(event) => setChunkType(event.target.value)} placeholder="Optional chunk_type" />
          </label>
        </Card>
        <Card className="bg-white p-4 text-sm leading-6 text-muted">
          Answers are grounded in retrieved workbench chunks. Weak or missing evidence is shown as a limitation instead of being promoted to a claim.
        </Card>
      </aside>
    </div>
  );
}

function ProviderStatusCard({ status, loading, onRefresh }: { status?: RagStatusResponse; loading: boolean; onRefresh: () => void }) {
  return (
    <Card className="bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Activity className="h-4 w-4 text-blue" />
          Model status
        </div>
        <button type="button" className="text-xs font-semibold text-blue disabled:opacity-50" onClick={onRefresh} disabled={loading}>
          {loading ? "Checking" : "Refresh"}
        </button>
      </div>
      <div className="mt-4 space-y-3">
        <ProviderStatusRow label="Chat" status={status?.chat} />
        <ProviderStatusRow label="Embedding" status={status?.embedding} />
      </div>
      <p className="mt-3 text-xs leading-5 text-muted">Status uses real API calls. Qwen should appear only here as the embedding model if LM Studio embeddings are configured.</p>
    </Card>
  );
}

function ProviderStatusRow({ label, status }: { label: string; status?: ProviderStatus }) {
  const connected = status?.connected;
  return (
    <div className="border border-line bg-paper p-3 text-xs leading-5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-ink">{label}</span>
        <span className={`border px-2 py-0.5 font-semibold ${connected ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
          {connected ? "Connected" : "Not connected"}
        </span>
      </div>
      <div className="mt-1 text-muted">{[status?.provider, status?.model].filter(Boolean).join(" / ") || "Not checked"}</div>
      {status?.latencyMs != null && <div className="text-muted">{status.latencyMs}ms</div>}
      {status?.error && <div className="mt-1 break-words text-red-700">{status.error}</div>}
    </div>
  );
}
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && <Avatar icon={<Bot className="h-4 w-4" />} />}
      <div className={`max-w-4xl border px-4 py-3 text-sm leading-6 ${isUser ? "border-blue/25 bg-blue/10 text-ink" : "border-line bg-paper text-ink"}`}>
        {message.error && <ErrorBanner error={message.error.message} />}
        <div className="space-y-2 text-[15px] leading-7">{renderRichText(message.content)}</div>
        {!isUser && message.sections && message.sections.length > 0 && <StructuredSections sections={message.sections} />}
        {!isUser && message.sources && message.sources.length > 0 && <SourcesPanel sources={message.sources} />}
        {!isUser && isDev && message.debug && <DebugPanel debug={message.debug} />}
      </div>
      {isUser && <Avatar icon={<UserRound className="h-4 w-4" />} />}
    </div>
  );
}

function StructuredSections({ sections }: { sections: RagAnswerSection[] }) {
  return (
    <div className="mt-4 space-y-3 border-t border-line pt-4">
      {sections.map((section) => (
        <section key={section.title} className="bg-white p-3">
          <h3 className="text-sm font-semibold text-ink">{section.title}</h3>
          <ul className="mt-2 space-y-2 text-sm leading-6 text-muted">
            {section.items.map((item, index) => <li key={`${section.title}-${index}`}>{renderRichInline(item)}</li>)}
          </ul>
        </section>
      ))}
    </div>
  );
}

function SourcesPanel({ sources }: { sources: RagSource[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4 border-t border-line pt-3">
      <button type="button" className="flex w-full items-center justify-between text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted" onClick={() => setOpen((value) => !value)}>
        <span className="flex items-center gap-2"><Database className="h-4 w-4 text-blue" /> Evidence and sources</span>
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
      {open && (
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full border-collapse text-xs leading-5">
            <thead>
              <tr className="border-b border-line text-left text-muted">
                <th className="py-2 pr-3 font-semibold">Source</th>
                <th className="py-2 pr-3 font-semibold">Paper</th>
                <th className="py-2 pr-3 font-semibold">Match</th>
                <th className="py-2 pr-3 font-semibold">Evidence</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => (
                <tr key={source.sourceIndex} className="border-b border-line/70 align-top">
                  <td className="py-3 pr-3 font-semibold text-blue">[{source.sourceId}]</td>
                  <td className="py-3 pr-3 text-ink">
                    <div className="font-semibold">{source.paperTitle}</div>
                    <div className="text-muted">{[source.elementType, source.elementLabel].filter(Boolean).join(" / ") || source.chunkType || "Source"}</div>
                    {source.relationType && <div className="text-muted">{source.fromElementId ?? "unknown"} to {source.toElementId ?? "unknown"} via {source.relationType}</div>}
                  </td>
                  <td className="py-3 pr-3"><MatchBadge classification={source.matchClassification} /></td>
                  <td className="max-w-md py-3 pr-3 text-muted">
                    <div>{source.matchReason}</div>
                    {source.snippet && <div className="mt-1 text-ink">{source.snippet}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ErrorBanner({ error }: { error: string }) {
  return (
    <div className="mb-3 flex items-start gap-2 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{error}</span>
    </div>
  );
}

function DebugPanel({ debug }: { debug: RagChatDebug }) {
  return (
    <details className="mt-4 border-t border-line pt-3 text-xs text-muted">
      <summary className="cursor-pointer font-semibold uppercase tracking-[0.12em]">Debug</summary>
      <dl className="mt-2 grid gap-1 sm:grid-cols-2">
        <DebugRow label="Query" value={debug.queryType} />
        <DebugRow label="Provider" value={debug.provider} />
        <DebugRow label="Model" value={debug.model} />
        <DebugRow label="Status" value={debug.answerStatus} />
        <DebugRow label="Retrieved" value={String(debug.retrievalCount)} />
        <DebugRow label="Latency" value={`${debug.latencyMs}ms`} />
      </dl>
      {debug.warnings && debug.warnings.length > 0 && <div className="mt-2 text-red-700">{debug.warnings.length} retrieval warning(s). Check server logs for details.</div>}
    </details>
  );
}

function DebugRow({ label, value }: { label: string; value: string }) {
  return <><dt className="font-semibold text-ink">{label}</dt><dd>{value}</dd></>;
}

function MatchBadge({ classification }: { classification?: RagMatchClassification }) {
  const label = matchLabel(classification);
  const className = classification === "formal_label_match"
    ? "border-green-200 bg-green-50 text-green-700"
    : classification === "strong_mechanism_match"
      ? "border-blue/30 bg-blue/10 text-blue"
      : classification === "partial_or_related_match"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-line bg-paper text-muted";

  return <span className={`inline-flex whitespace-nowrap border px-2 py-1 text-[11px] font-semibold ${className}`}>{label}</span>;
}

function matchLabel(classification?: RagMatchClassification) {
  if (classification === "formal_label_match") return "Formal label";
  if (classification === "strong_mechanism_match") return "Strong mechanism";
  if (classification === "partial_or_related_match") return "Partial/related";
  if (classification === "background_only") return "Weak/background";
  return "Insufficient";
}

function renderRichText(value: string) {
  return value.split(/\n{2,}/).filter(Boolean).map((block, blockIndex) => {
    const lines = block.split(/\n/).filter(Boolean);
    const bulletLines = lines.filter((line) => /^\s*[-*]\s+/.test(line));
    if (bulletLines.length === lines.length && lines.length > 0) {
      return (
        <ul key={`block-${blockIndex}`} className="ml-5 list-disc space-y-1">
          {lines.map((line, lineIndex) => <li key={`line-${blockIndex}-${lineIndex}`}>{renderRichInline(line.replace(/^\s*[-*]\s+/, ""))}</li>)}
        </ul>
      );
    }
    return <p key={`block-${blockIndex}`}>{renderRichInline(block)}</p>;
  });
}

function renderRichInline(value: string) {
  const parts = value.split(/(\*\*[^*]+\*\*|\[S\d+\])/g);
  return parts.map((part, index) => {
    if (/^\[S\d+\]$/.test(part)) {
      return <span key={`${part}-${index}`} className="mx-0.5 inline-flex border border-blue/30 bg-blue/10 px-1.5 py-0.5 text-[11px] font-semibold text-blue">{part}</span>;
    }
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return <strong key={`${part}-${index}`} className="font-semibold text-ink">{part.slice(2, -2)}</strong>;
    }
    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function Avatar({ icon }: { icon: ReactNode }) {
  return <div className="grid h-8 w-8 shrink-0 place-items-center border border-line bg-white text-blue">{icon}</div>;
}
