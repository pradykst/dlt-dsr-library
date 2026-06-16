"use client";

import { FormEvent, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Bot, Loader2, Send, SlidersHorizontal, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type { RagSource } from "@/lib/rag/types";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  sources?: RagSource[];
};

const sampleQuestions = [
  "Which papers use tokenization as a design feature?",
  "Compare trust-related design principles across papers.",
  "What evaluation methods are used across the library?",
  "Show requirements linked to interoperability.",
  "What artifact was proposed in the peer-review token paper?"
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

export function DsrChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [paperId, setPaperId] = useState("");
  const [elementType, setElementType] = useState("");
  const [chunkType, setChunkType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  const apiMessages = useMemo(
    () => messages.map(({ role, content }) => ({ role, content })),
    [messages]
  );

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
      const result = await response.json();
      if (!response.ok) throw new Error([result.error, result.details].filter(Boolean).join(" "));

      setMessages([...nextMessages, {
        role: "assistant",
        content: result.answer,
        sources: result.sources ?? []
      }]);
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
              <div className="rounded-none border border-dashed border-line bg-paper p-5">
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
              <div className="flex items-center gap-2 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                Retrieving DSR chunks and drafting an evidence-grounded answer. Local models can take a few minutes...
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
          Answers are generated only from chunks returned by the workbench vector search. Missing embeddings, database RPCs, or LLM settings are reported as server errors.
        </Card>
      </aside>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && <Avatar icon={<Bot className="h-4 w-4" />} />}
      <div className={`max-w-3xl border px-4 py-3 text-sm leading-6 ${isUser ? "border-blue/25 bg-blue/10 text-ink" : "border-line bg-paper text-ink"}`}>
        <div className="whitespace-pre-wrap">{message.content}</div>
        {!isUser && message.sources && message.sources.length > 0 && <SourcesPanel sources={message.sources} />}
      </div>
      {isUser && <Avatar icon={<UserRound className="h-4 w-4" />} />}
    </div>
  );
}

function SourcesPanel({ sources }: { sources: RagSource[] }) {
  return (
    <div className="mt-4 space-y-2 border-t border-line pt-3">
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Sources</div>
      {sources.map((source) => (
        <div key={source.sourceIndex} className="border border-line bg-white p-3 text-xs leading-5 text-muted">
          <div className="font-semibold text-ink">[S{source.sourceIndex}] {source.paperTitle}</div>
          {source.retrievalKind && <div>Match: {formatMatchKind(source.retrievalKind)}</div>}
          <div>{[source.elementType, source.elementId, source.elementLabel].filter(Boolean).join(" / ") || "Element not specified"}</div>
          {source.relationType && <div>Relation: {source.fromElementId ?? "unknown"} to {source.toElementId ?? "unknown"} via {source.relationType}</div>}
          {source.chunkType && <div>Chunk: {source.chunkType}</div>}
          {source.pageNumber && <div>Page: {source.pageNumber}</div>}
          {source.evidenceQuote && <div className="mt-1 text-ink">Evidence: {source.evidenceQuote}</div>}
        </div>
      ))}
    </div>
  );
}

function Avatar({ icon }: { icon: ReactNode }) {
  return <div className="grid h-8 w-8 shrink-0 place-items-center border border-line bg-white text-blue">{icon}</div>;
}

function formatMatchKind(kind: NonNullable<RagSource["retrievalKind"]>) {
  return kind.replace("_", " ");
}
