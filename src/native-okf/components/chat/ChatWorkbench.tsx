"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  useRef,
  useState,
} from "react";

import type {
  NativeOkfChatHistoryMessage,
  NativeOkfChatRequest,
  NativeOkfChatResponse,
} from "../../shared/chat-types.ts";
import { ChatAnswer } from "./ChatAnswer.tsx";

const MAX_QUESTION_LENGTH = 2_000;
const MAX_CLIENT_HISTORY_CONTENT = 2_000;
const HISTORY_LIMIT = 8;

const STARTER_QUESTIONS = [
  "Compare two papers and explain where their design knowledge differs.",
  "Trace a design principle to the requirements and features linked to it.",
  "Summarize the reusable design knowledge for a research problem.",
  "Generate a grounded decision-support flow for a proposed artifact.",
] as const;

interface ChatEntry {
  id: string;
  role: "user" | "assistant";
  content: string;
  response?: NativeOkfChatResponse;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isChatResponse(value: unknown): value is NativeOkfChatResponse {
  if (!isRecord(value)) return false;
  return (
    typeof value.answerMarkdown === "string" &&
    Array.isArray(value.sources) &&
    value.sources.every(
      (source) =>
        isRecord(source) &&
        typeof source.sourceId === "string" &&
        typeof source.conceptId === "string" &&
        typeof source.title === "string" &&
        typeof source.type === "string",
    ) &&
    typeof value.insufficientContext === "boolean"
  );
}

function responseError(payload: unknown, status: number): string {
  if (isRecord(payload)) {
    if (typeof payload.error === "string" && payload.error.length <= 500) {
      return payload.error;
    }
    if (
      isRecord(payload.error) &&
      typeof payload.error.message === "string" &&
      payload.error.message.length <= 500
    ) {
      return payload.error.message;
    }
    if (typeof payload.message === "string" && payload.message.length <= 500) {
      return payload.message;
    }
  }

  if (status === 503) {
    return "The native OKF assistant is not configured on this server.";
  }
  if (status === 429) {
    return "The assistant is temporarily busy. Please wait a moment and try again.";
  }
  return "The native OKF assistant could not complete this request.";
}

function historyFromEntries(entries: readonly ChatEntry[]): NativeOkfChatHistoryMessage[] {
  return entries
    .map((entry) => ({
      role: entry.role,
      content: entry.content.slice(0, MAX_CLIENT_HISTORY_CONTENT),
    }))
    .slice(-HISTORY_LIMIT);
}

export function ChatWorkbench() {
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [question, setQuestion] = useState("");
  const [includeDiagram, setIncludeDiagram] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextId = useRef(1);
  const requestController = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const trimmedQuestion = question.trim();
  const invalidLength =
    trimmedQuestion.length > 0 && trimmedQuestion.length < 3;
  const overLimit = question.length > MAX_QUESTION_LENGTH;
  const canSubmit =
    !pending &&
    trimmedQuestion.length >= 3 &&
    question.length <= MAX_QUESTION_LENGTH;

  function makeId(prefix: "user" | "assistant"): string {
    const id = `${prefix}-${nextId.current}`;
    nextId.current += 1;
    return id;
  }

  async function submitQuestion(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (!canSubmit) return;

    const submittedQuestion = trimmedQuestion;
    const priorEntries = entries;
    const userEntry: ChatEntry = {
      id: makeId("user"),
      role: "user",
      content: submittedQuestion,
    };
    const request: NativeOkfChatRequest = {
      question: submittedQuestion,
      history: historyFromEntries(priorEntries),
      includeDiagram,
    };

    setEntries((current) => [...current, userEntry]);
    setQuestion("");
    setError(null);
    setPending(true);

    const controller = new AbortController();
    requestController.current = controller;

    try {
      const result = await fetch("/api/native-okf/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        cache: "no-store",
        signal: controller.signal,
      });

      const payload: unknown = await result.json().catch(() => undefined);
      if (!result.ok) {
        throw new Error(responseError(payload, result.status));
      }
      if (!isChatResponse(payload)) {
        throw new Error("The assistant returned an invalid response.");
      }

      const assistantEntry: ChatEntry = {
        id: makeId("assistant"),
        role: "assistant",
        content: payload.answerMarkdown,
        response: payload,
      };
      setEntries((current) => [...current, assistantEntry]);
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      setError(
        caught instanceof Error
          ? caught.message
          : "The native OKF assistant could not complete this request.",
      );
      setQuestion((current) => current || submittedQuestion);
    } finally {
      if (requestController.current === controller) {
        requestController.current = null;
        setPending(false);
      }
    }
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      void submitQuestion();
    }
  }

  function clearConversation() {
    requestController.current?.abort();
    requestController.current = null;
    setEntries([]);
    setQuestion("");
    setError(null);
    setPending(false);
    inputRef.current?.focus();
  }

  function selectStarter(questionText: string) {
    setQuestion(questionText);
    inputRef.current?.focus();
  }

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-research">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-paper px-4 py-3 sm:px-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue">
              Grounded native OKF assistant
            </p>
            <p className="mt-1 text-xs leading-5 text-muted">
              Local retrieval supplies the only knowledge context. Conversation
              history remains in this browser tab.
            </p>
          </div>
          <button
            type="button"
            onClick={clearConversation}
            disabled={entries.length === 0 && !pending && !error}
            className="rounded-full border border-line bg-white px-3.5 py-2 text-xs font-semibold text-ink transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
          >
            Clear conversation
          </button>
        </div>

        <div
          aria-busy={pending}
          className="min-h-[360px] space-y-6 px-4 py-6 sm:px-6 lg:px-8"
        >
          {entries.length === 0 ? (
            <div className="mx-auto max-w-3xl py-5 text-center">
              <div
                aria-hidden="true"
                className="mx-auto grid h-12 w-12 place-items-center rounded-full border border-blue/20 bg-blue/10 font-serif text-xl font-semibold text-blue"
              >
                OKF
              </div>
              <h2 className="mt-4 font-serif text-2xl font-semibold text-ink">
                Ask across the native research library
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted">
                Answers are generated from locally retrieved papers and concepts.
                Validated citations lead back to the canonical native OKF paths;
                diagrams distinguish stored knowledge from new synthesis.
              </p>

              <div className="mt-6 grid gap-2 text-left sm:grid-cols-2">
                {STARTER_QUESTIONS.map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => selectStarter(starter)}
                    className="rounded-xl border border-line bg-paper px-4 py-3 text-left text-sm font-medium leading-5 text-slate-700 transition hover:border-blue/35 hover:bg-blue/5 hover:text-ink"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ol className="space-y-7">
              {entries.map((entry) => (
                <li key={entry.id}>
                  {entry.role === "user" ? (
                    <article className="ml-auto max-w-3xl rounded-2xl rounded-br-md bg-ink px-5 py-4 text-white shadow-sm">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                        You
                      </p>
                      <p className="whitespace-pre-wrap text-sm leading-6">
                        {entry.content}
                      </p>
                    </article>
                  ) : (
                    <article className="rounded-2xl rounded-tl-md border border-line bg-white px-5 py-5 shadow-sm sm:px-6">
                      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-blue">
                        Native OKF assistant
                      </p>
                      {entry.response ? (
                        <ChatAnswer
                          response={entry.response}
                          messageId={entry.id}
                        />
                      ) : (
                        <p className="text-sm text-muted">{entry.content}</p>
                      )}
                    </article>
                  )}
                </li>
              ))}
            </ol>
          )}

          {pending ? (
            <div
              role="status"
              aria-live="polite"
              className="flex max-w-sm items-center gap-3 rounded-2xl rounded-tl-md border border-line bg-paper px-5 py-4 text-sm text-muted"
            >
              <span
                aria-hidden="true"
                className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue"
              />
              Retrieving native OKF context and drafting a grounded answer...
            </div>
          ) : null}

          {error ? (
            <div
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-rose-700">
                    Request failed
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-xs font-semibold text-rose-700 underline underline-offset-4"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <form
          onSubmit={(event) => void submitQuestion(event)}
          className="border-t border-line bg-paper px-4 py-4 sm:px-6"
        >
          <label
            htmlFor="native-okf-chat-question"
            className="text-xs font-bold uppercase tracking-[0.12em] text-ink"
          >
            Question
          </label>
          <div className="mt-2 rounded-xl border border-line bg-white p-2 shadow-sm focus-within:border-blue/50 focus-within:ring-2 focus-within:ring-blue/15">
            <textarea
              ref={inputRef}
              id="native-okf-chat-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              rows={3}
              maxLength={MAX_QUESTION_LENGTH + 1}
              disabled={pending}
              placeholder="Ask about papers, requirements, principles, features, relationships, or cross-paper synthesis..."
              className="block w-full resize-y border-0 bg-transparent px-2 py-2 text-sm leading-6 text-ink outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-2 pt-3">
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={includeDiagram}
                  onChange={(event) => setIncludeDiagram(event.target.checked)}
                  disabled={pending}
                  className="h-4 w-4 rounded border-slate-300 text-blue focus:ring-blue"
                />
                Include grounded diagram
              </label>

              <div className="flex items-center gap-3">
                <span
                  className={`font-mono text-[0.68rem] ${
                    overLimit ? "font-bold text-rose-700" : "text-muted"
                  }`}
                >
                  {question.length}/{MAX_QUESTION_LENGTH}
                </span>
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="inline-flex min-w-24 items-center justify-center rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {pending ? "Working..." : "Send"}
                </button>
              </div>
            </div>
          </div>

          {invalidLength || overLimit ? (
            <p className="mt-2 text-xs font-medium text-rose-700">
              {overLimit
                ? `Questions are limited to ${MAX_QUESTION_LENGTH.toLocaleString()} characters.`
                : "Enter a meaningful question of at least three characters."}
            </p>
          ) : (
            <p className="mt-2 text-xs leading-5 text-muted">
              Press Enter to send or Shift+Enter for a new line. No account or
              database history is used.
            </p>
          )}
        </form>
      </section>
    </div>
  );
}
