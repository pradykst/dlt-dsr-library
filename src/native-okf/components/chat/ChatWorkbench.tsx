"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  createInitialNativeOkfConversationState,
  MAX_NATIVE_OKF_MODEL_HISTORY_MESSAGE_CHARACTERS,
  MAX_NATIVE_OKF_MODEL_HISTORY_MESSAGES,
  nativeOkfVisibleHistoryExceedsModelContext,
  type NativeOkfChatHistoryMessage,
  type NativeOkfChatRequest,
  type NativeOkfChatResponse,
} from "../../shared/chat-types.ts";
import {
  clearNativeOkfChatSession,
  createNativeOkfLocalConversationId,
  readNativeOkfChatSession,
  writeNativeOkfChatSession,
} from "../../shared/chat-session.ts";
import {
  parseNativeOkfConversationState,
} from "../../shared/conversation-state.ts";
import { shouldShowNativeOkfEvaluationCallout } from "../../shared/evaluation-onboarding.ts";
import type { NativeOkfGuidedStarterPaper } from "../../shared/guided-starters.ts";
import { NATIVE_OKF_EVALUATION_SURVEY_URL } from "../../shared/public-links.ts";
import {
  applyManualDiagramToggle,
  diagramPreferenceForRequest,
  INITIAL_DIAGRAM_INTENT_TOGGLE_STATE,
  reconcileDiagramIntentToggle,
} from "../../shared/diagram-intent.ts";
import { NATIVE_OKF_API_ROUTES } from "../../shared/routes.ts";
import { ChatAnswer } from "./ChatAnswer.tsx";
import { GuidedChatStarters } from "./GuidedChatStarters.tsx";

const MAX_QUESTION_LENGTH = 2_000;

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
  if (
    (value.kind !== "answer" && value.kind !== "clarification") ||
    parseNativeOkfConversationState(value.conversationState) === null ||
    (value.kind === "clarification" &&
      (!isRecord(value.clarification) ||
        typeof value.clarification.question !== "string" ||
        typeof value.clarification.kind !== "string"))
  ) {
    return false;
  }

  return (
    [
      "text-primary",
      "diagram-primary",
      "clarification",
      "no-match",
      "safe-error",
    ].includes(String(value.presentationMode)) &&
    [
      null,
      "success",
      "evidence-fallback",
      "failed",
    ].includes(value.diagramStatus as null | string) &&
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

function nativeOkfChatErrorMessage(payload: unknown, status: number): string {
  if (status === 429) {
    return "The assistant is handling other requests. Please try again shortly.";
  }
  if (status === 503) {
    return "The native OKF assistant is temporarily unavailable.";
  }
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
  }
  return "The native OKF assistant could not complete this request.";
}

function historyFromEntries(entries: readonly ChatEntry[]): NativeOkfChatHistoryMessage[] {
  return entries
    .map((entry) => ({
      role: entry.role,
      content: entry.content.slice(
        0,
        MAX_NATIVE_OKF_MODEL_HISTORY_MESSAGE_CHARACTERS,
      ),
    }))
    .slice(-MAX_NATIVE_OKF_MODEL_HISTORY_MESSAGES);
}

export function ChatWorkbench({
  starterPapers,
}: {
  starterPapers: readonly NativeOkfGuidedStarterPaper[];
}) {
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [question, setQuestion] = useState("");
  const [diagramIntentToggle, setDiagramIntentToggle] = useState(
    INITIAL_DIAGRAM_INTENT_TOGGLE_STATE,
  );
  const [conversationState, setConversationState] = useState(
    createInitialNativeOkfConversationState,
  );
  const [conversationId, setConversationId] = useState("");
  const [sessionReady, setSessionReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startersOpen, setStartersOpen] = useState(true);
  const [surveyCalloutDismissed, setSurveyCalloutDismissed] = useState(false);
  const nextId = useRef(1);
  const requestController = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const skipNextSessionWrite = useRef(false);

  const trimmedQuestion = question.trim();
  const invalidLength =
    trimmedQuestion.length > 0 && trimmedQuestion.length < 3;
  const overLimit = question.length > MAX_QUESTION_LENGTH;
  const canSubmit =
    !pending &&
    trimmedQuestion.length >= 3 &&
    question.length <= MAX_QUESTION_LENGTH;
  const includeDiagram = diagramIntentToggle.enabled;
  const historyContextTruncated =
    nativeOkfVisibleHistoryExceedsModelContext(entries.length);

  function updateComposerQuestion(nextQuestion: string) {
    setQuestion(nextQuestion);
    setDiagramIntentToggle((current) =>
      reconcileDiagramIntentToggle(current, nextQuestion, true),
    );
  }

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      let restored = null;
      try {
        restored = readNativeOkfChatSession(window.sessionStorage);
      } catch {
        // The tab remains usable when browser storage is unavailable.
      }
      if (restored) {
        const restoredEntries = restored.messages.map((message) => {
          const candidate = message.response
            ? {
                ...message.response,
                conversationState: restored.conversationState,
              }
            : undefined;
          return {
            id: message.id,
            role: message.role,
            content: message.content,
            ...(candidate &&
              candidate.kind === "answer" &&
              isChatResponse(candidate)
              ? { response: candidate }
              : {}),
          } satisfies ChatEntry;
        });
        setEntries(restoredEntries);
        if (restoredEntries.length > 0) setStartersOpen(false);
        setConversationState(restored.conversationState);
        setDiagramIntentToggle(restored.diagramPreference);
        setConversationId(restored.conversationId);
        nextId.current = restoredEntries.length + 1;
      } else {
        setConversationId(createNativeOkfLocalConversationId());
      }
      setSessionReady(true);
    }, 0);
    return () => window.clearTimeout(restoreTimer);
  }, []);

  useEffect(() => {
    if (!sessionReady || conversationId === "") return;
    if (skipNextSessionWrite.current) {
      skipNextSessionWrite.current = false;
      return;
    }
    try {
      writeNativeOkfChatSession(window.sessionStorage, {
        version: 1,
        conversationId,
        messages: entries,
        conversationState,
        diagramPreference: diagramIntentToggle,
      });
    } catch {
      // In-memory conversation remains available when storage is blocked.
    }
  }, [
    conversationId,
    conversationState,
    diagramIntentToggle,
    entries,
    sessionReady,
  ]);

  function makeId(prefix: "user" | "assistant"): string {
    const id = `${prefix}-${nextId.current}`;
    nextId.current += 1;
    return id;
  }

  async function submitQuestion(
    event?: FormEvent<HTMLFormElement>,
    guidedSubmission?: { question: string; includeDiagram: boolean },
  ) {
    event?.preventDefault();
    const submittedQuestion = (
      guidedSubmission?.question ?? trimmedQuestion
    ).trim();
    if (
      pending ||
      submittedQuestion.length < 3 ||
      submittedQuestion.length > MAX_QUESTION_LENGTH
    ) return;
    const priorEntries = entries;
    const userEntry: ChatEntry = {
      id: makeId("user"),
      role: "user",
      content: submittedQuestion,
    };
    const request: NativeOkfChatRequest = {
      question: submittedQuestion,
      history: historyFromEntries(priorEntries),
      diagramPreference: diagramPreferenceForRequest(
        diagramIntentToggle,
        submittedQuestion,
      ),
      visibleHistoryMessageCount: priorEntries.length,
      conversationState,
    };
    if (guidedSubmission) {
      request.diagramPreference = guidedSubmission.includeDiagram
        ? "requested"
        : "auto";
    }

    setEntries((current) => [...current, userEntry]);
    setStartersOpen(false);
    setQuestion("");
    setDiagramIntentToggle(INITIAL_DIAGRAM_INTENT_TOGGLE_STATE);
    setError(null);
    setPending(true);

    const controller = new AbortController();
    requestController.current = controller;

    try {
      const result = await fetch(NATIVE_OKF_API_ROUTES.chat, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        cache: "no-store",
        signal: controller.signal,
      });

      const payload: unknown = await result.json().catch(() => undefined);
      if (!result.ok) {
          throw new Error(nativeOkfChatErrorMessage(payload, result.status));
      }
      if (!isChatResponse(payload)) {
        throw new Error("The assistant returned an invalid response.");
      }
      const nextConversationState = parseNativeOkfConversationState(
        payload.conversationState,
      );
      if (!nextConversationState) {
        throw new Error("The assistant returned invalid conversation state.");
      }
      setConversationState(nextConversationState);

      const assistantEntry: ChatEntry = {
        id: makeId("assistant"),
        role: "assistant",
        content: payload.answerMarkdown,
        ...(payload.kind === "answer"
          ? { response: payload }
          : {}),
      };
      setEntries((current) => [...current, assistantEntry]);
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      setError(
        caught instanceof Error
          ? caught.message
          : "The design knowledge assistant could not complete this request.",
      );
      updateComposerQuestion(submittedQuestion);
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
    skipNextSessionWrite.current = true;
    try {
      clearNativeOkfChatSession(window.sessionStorage);
    } catch {
      // In-memory reset still succeeds when browser storage is blocked.
    }
    setConversationState(createInitialNativeOkfConversationState());
    setDiagramIntentToggle(INITIAL_DIAGRAM_INTENT_TOGGLE_STATE);
    setConversationId(createNativeOkfLocalConversationId());
    nextId.current = 1;
    setEntries([]);
    setStartersOpen(true);
    setSurveyCalloutDismissed(false);
    updateComposerQuestion("");
    setError(null);
    setPending(false);
    inputRef.current?.focus();
  }

  function setGuidedDiagramDefault(enabled: boolean) {
    setDiagramIntentToggle((current) =>
      applyManualDiagramToggle(current, question, enabled),
    );
  }

  function askGuidedQuestion(
    questionText: string,
    requestedDiagram: boolean,
  ) {
    setDiagramIntentToggle((current) =>
      applyManualDiagramToggle(current, questionText, requestedDiagram),
    );
    void submitQuestion(undefined, {
      question: questionText,
      includeDiagram: requestedDiagram,
    });
  }

  const hasSubstantiveResponse = shouldShowNativeOkfEvaluationCallout(
    entries.flatMap((entry) => entry.response ? [entry.response] : []),
  );
  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-research">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-paper px-4 py-3 sm:px-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue">
              Design knowledge assistant
            </p>
            <p className="mt-1 text-xs leading-5 text-muted">
              Answers use retrieved library sources. Conversation content remains in this
              browser tab and is not stored by the server.
            </p>
          </div>
          <button
            type="button"
            onClick={clearConversation}
            aria-label="Start a new chat"
            disabled={entries.length === 0 && !pending && !error}
            className="rounded-full border border-line bg-white px-3.5 py-2 text-xs font-semibold text-ink transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
          >
            New chat
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
                Ask the design knowledge library
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted">
                Answers use retrieved papers and concepts. Citations link to library
                source records; diagrams distinguish stored knowledge from new synthesis.
              </p>

              <div className="mt-6 text-left">
                <GuidedChatStarters
                  papers={starterPapers}
                  currentDiagramEnabled={includeDiagram}
                  pending={pending}
                  onDefaultDiagramIntent={setGuidedDiagramDefault}
                  onAsk={askGuidedQuestion}
                />
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-line bg-slate-50 px-4 py-3">
                <button
                  type="button"
                  aria-expanded={startersOpen}
                  aria-controls="native-okf-reopened-starters"
                  disabled={pending}
                  onClick={() => setStartersOpen((current) => !current)}
                  className="text-sm font-semibold text-blue underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
                >
                  Guided starters
                </button>
                {startersOpen ? (
                  <div id="native-okf-reopened-starters" className="mt-3 min-w-0 max-w-full">
                    <GuidedChatStarters
                      papers={starterPapers}
                      currentDiagramEnabled={includeDiagram}
                      pending={pending}
                      onDefaultDiagramIntent={setGuidedDiagramDefault}
                      onAsk={askGuidedQuestion}
                    />
                  </div>
                ) : null}
              </div>
              {historyContextTruncated ? (
                <aside
                  role="status"
                  className="rounded-xl border border-amber/35 bg-amber/10 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="max-w-3xl text-xs leading-5 text-slate-700 sm:text-sm">
                      Earlier messages are no longer included in the assistant&apos;s
                      active context. Start a New chat if your next question depends on
                      them.
                    </p>
                    <button
                      type="button"
                      onClick={clearConversation}
                      className="rounded-full border border-amber/40 bg-white px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-amber hover:bg-amber/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
                    >
                      New chat
                    </button>
                  </div>
                </aside>
              ) : null}
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
                        Design knowledge assistant
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
            </>
          )}

          {hasSubstantiveResponse && !surveyCalloutDismissed ? (
            <aside
              aria-labelledby="native-okf-evaluation-callout-title"
              className="rounded-xl border border-blue/20 bg-blue/5 px-4 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="max-w-3xl">
                  <h2
                    id="native-okf-evaluation-callout-title"
                    className="text-sm font-semibold text-ink"
                  >
                    Help evaluate the library
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-slate-700 sm:text-sm">
                    After exploring the papers and design knowledge assistant, share your
                    feedback in the anonymous 5–8 minute evaluation survey.
                  </p>
                  <a
                    href={NATIVE_OKF_EVALUATION_SURVEY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open the anonymous evaluation survey in a new tab"
                    className="mt-2 inline-block text-sm font-semibold text-blue underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
                  >
                    Open evaluation survey ↗
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => setSurveyCalloutDismissed(true)}
                  aria-label="Dismiss evaluation survey invitation"
                  className="text-xs font-semibold text-muted underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
                >
                  Dismiss
                </button>
              </div>
            </aside>
          ) : null}
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
              Retrieving library sources and preparing a response...
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
                  onClick={() => {
                    setError(null);
                  }}
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
              onChange={(event) => updateComposerQuestion(event.target.value)}
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
                  onChange={(event) =>
                    setDiagramIntentToggle((current) =>
                      applyManualDiagramToggle(
                        current,
                        question,
                        event.target.checked,
                      ),
                    )
                  }
                  disabled={pending}
                  className="h-4 w-4 rounded border-slate-300 text-blue focus:ring-blue"
                />
                Include diagram
              </label>

              {diagramIntentToggle.enabled && diagramIntentToggle.autoEnabled ? (
                <span className="text-xs text-blue" role="status">
                  Diagram enabled based on your request.
                </span>
              ) : null}

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
              Press Enter to send or Shift+Enter for a new line. Questions,
              answers, and conversation focus are kept only in this tab session;
              they are not stored by the server.
            </p>
          )}
        </form>
      </section>
    </div>
  );
}
