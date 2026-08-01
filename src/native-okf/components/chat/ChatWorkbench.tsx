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
  type NativeOkfChatHistoryMessage,
  type NativeOkfChatRequest,
  type NativeOkfChatResponse,
  type NativeOkfPersonalQuotaMetadata,
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
  INITIAL_DIAGRAM_INTENT_TOGGLE_STATE,
  reconcileDiagramIntentToggle,
} from "../../shared/diagram-intent.ts";
import {
  NATIVE_OKF_API_ROUTES,
  NATIVE_OKF_PUBLIC_ROUTES,
} from "../../shared/routes.ts";
import {
  formatNativeOkfQuotaTime,
  nativeOkfChatErrorMessage,
  nativeOkfDiagramQuotaExhausted,
  readNativeOkfPersonalQuota,
  readNativeOkfResearchAccess,
  type ResearcherAccessState,
} from "./access-ui.ts";
import { ChatAnswer } from "./ChatAnswer.tsx";
import { GuidedChatStarters } from "./GuidedChatStarters.tsx";

const MAX_QUESTION_LENGTH = 2_000;
const MAX_CLIENT_HISTORY_CONTENT = 2_000;
const HISTORY_LIMIT = 8;

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
    typeof value.insufficientContext === "boolean" &&
    (value.quota === undefined ||
      readNativeOkfPersonalQuota(value.quota) !== null)
  );
}

class NativeOkfUiRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "NativeOkfUiRequestError";
    this.status = status;
  }
}

function historyFromEntries(entries: readonly ChatEntry[]): NativeOkfChatHistoryMessage[] {
  return entries
    .map((entry) => ({
      role: entry.role,
      content: entry.content.slice(0, MAX_CLIENT_HISTORY_CONTENT),
    }))
    .slice(-HISTORY_LIMIT);
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
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [quota, setQuota] =
    useState<NativeOkfPersonalQuotaMetadata | null>(null);
  const [accessState, setAccessState] =
    useState<ResearcherAccessState>("checking");
  const [diagramQuotaBlocked, setDiagramQuotaBlocked] = useState(false);
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
  const diagramQuotaExhausted =
    diagramQuotaBlocked || nativeOkfDiagramQuotaExhausted(quota);
  const includeDiagram = diagramIntentToggle.enabled;

  function updateComposerQuestion(nextQuestion: string) {
    setQuestion(nextQuestion);
    setDiagramIntentToggle((current) =>
      reconcileDiagramIntentToggle(
        current,
        nextQuestion,
        !diagramQuotaExhausted,
      ),
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

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      try {
        const response = await fetch(NATIVE_OKF_API_ROUTES.access, {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });
        if (!response.ok) {
          setAccessState(response.status === 503 ? "unavailable" : "required");
          setQuota(null);
          return;
        }

        const payload: unknown = await response.json().catch(() => undefined);
        const access = readNativeOkfResearchAccess(payload);
        if (!access) {
          setAccessState("unavailable");
          setQuota(null);
          return;
        }
        setAccessState(access.state);
        setQuota(access.quota);
        const accessDiagramExhausted =
          nativeOkfDiagramQuotaExhausted(access.quota);
        setDiagramQuotaBlocked(accessDiagramExhausted);
        if (accessDiagramExhausted) {
          setDiagramIntentToggle((current) => ({
            ...current,
            enabled: false,
            autoEnabled: false,
          }));
        }
      } catch (caught) {
        if (caught instanceof DOMException && caught.name === "AbortError") {
          return;
        }
        setAccessState("unavailable");
        setQuota(null);
      }
    })();

    return () => controller.abort();
  }, []);

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
      includeDiagram,
      conversationState,
    };
    if (guidedSubmission) {
      request.includeDiagram = guidedSubmission.includeDiagram;
    }

    setEntries((current) => [...current, userEntry]);
    setStartersOpen(false);
    updateComposerQuestion("");
    setError(null);
    setErrorStatus(null);
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
        if (
          result.status === 429 &&
          isRecord(payload) &&
          payload.code === "diagram_quota_exhausted"
        ) {
          setDiagramQuotaBlocked(true);
          setDiagramIntentToggle((current) => ({
            ...current,
            enabled: false,
            autoEnabled: false,
          }));
        }
        throw new NativeOkfUiRequestError(
          nativeOkfChatErrorMessage(payload, result.status),
          result.status,
        );
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
      const nextQuota = readNativeOkfPersonalQuota(payload.quota);
      if (nextQuota) {
        setQuota(nextQuota);
        setAccessState("authenticated");
        const nextDiagramExhausted =
          nativeOkfDiagramQuotaExhausted(nextQuota);
        setDiagramQuotaBlocked(nextDiagramExhausted);
        if (nextDiagramExhausted) {
          setDiagramIntentToggle((current) => ({
            ...current,
            enabled: false,
            autoEnabled: false,
          }));
        }
      }
      setEntries((current) => [...current, assistantEntry]);
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      if (caught instanceof NativeOkfUiRequestError) {
        setErrorStatus(caught.status);
        if (caught.status === 401) {
          setAccessState("required");
          setQuota(null);
        } else if (caught.status === 403) {
          setAccessState("expired");
          setQuota(null);
        } else if (caught.status === 503) {
          setAccessState("unavailable");
        }
      }
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
    setErrorStatus(null);
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
              browser tab; only access and usage counters are stored.
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

        {quota ? (
          <div
            aria-label="Personal chat allowance"
            className="border-b border-line bg-blue/5 px-4 py-3 sm:px-5"
          >
            <dl className="grid gap-2 text-xs text-slate-700 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <dt className="font-semibold text-ink">Questions remaining</dt>
                <dd>
                  {quota.questionsRemainingToday} today /{" "}
                  {quota.questionsRemainingTotal} total
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-ink">Diagrams remaining</dt>
                <dd>
                  {quota.diagramsRemainingToday} today /{" "}
                  {quota.diagramsRemainingTotal} total
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-ink">Daily reset</dt>
                <dd>{formatNativeOkfQuotaTime(quota.resetAtMs)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-ink">Access expires</dt>
                <dd>{formatNativeOkfQuotaTime(quota.accessExpiresAtMs)}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-slate-50 px-4 py-2.5 text-xs text-slate-700 sm:px-5">
            <p>
              {accessState === "checking"
                ? "Checking chat access..."
                : accessState === "disabled"
                  ? "Chat is disabled. The paper library remains available."
                  : accessState === "unavailable"
                    ? "Chat is temporarily unavailable."
                    : accessState === "expired"
                      ? "Chat access has expired."
                      : accessState === "revoked"
                        ? "Chat access was revoked."
                        : "Chat access is required for assistant answers."}
            </p>
            {accessState === "required" ||
            accessState === "expired" ||
            accessState === "revoked" ? (
              <a
                href={NATIVE_OKF_PUBLIC_ROUTES.access}
                className="font-semibold text-blue underline underline-offset-4"
              >
                Enter access code
              </a>
            ) : null}
          </div>
        )}

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
                  diagramQuotaExhausted={diagramQuotaExhausted}
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
                      diagramQuotaExhausted={diagramQuotaExhausted}
                      currentDiagramEnabled={includeDiagram}
                      pending={pending}
                      onDefaultDiagramIntent={setGuidedDiagramDefault}
                      onAsk={askGuidedQuestion}
                    />
                  </div>
                ) : null}
              </div>
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
                  {errorStatus === 401 || errorStatus === 403 ? (
                    <a
                      href={NATIVE_OKF_PUBLIC_ROUTES.access}
                      className="mt-2 inline-block text-xs font-semibold text-rose-800 underline underline-offset-4"
                    >
                      Enter access code
                    </a>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setErrorStatus(null);
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
              <label
                className={`inline-flex items-center gap-2 text-xs font-semibold text-slate-700 ${
                  diagramQuotaExhausted
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer"
                }`}
              >
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
                  disabled={pending || diagramQuotaExhausted}
                  aria-describedby={
                    diagramQuotaExhausted
                      ? "native-okf-diagram-quota"
                      : undefined
                  }
                  className="h-4 w-4 rounded border-slate-300 text-blue focus:ring-blue"
                />
                Include grounded diagram
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
            {diagramQuotaExhausted ? (
              <p
                id="native-okf-diagram-quota"
                className="px-2 pt-2 text-xs text-amber-800"
              >
                Diagram allowance is exhausted. Text-only questions remain available.
              </p>
            ) : null}
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
              they are not stored by the server or quota
              system.
            </p>
          )}
        </form>
      </section>
    </div>
  );
}
