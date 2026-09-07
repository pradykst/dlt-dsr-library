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
  type NativeOkfChatScope,
} from "../../shared/chat-types.ts";
import {
  clearNativeOkfChatSession,
  createNativeOkfLocalConversationId,
  readNativeOkfChatSession,
  writeNativeOkfChatSession,
} from "../../shared/chat-session.ts";
import {
  compactNativeOkfConversationStateForRequest,
  parseNativeOkfConversationState,
} from "../../shared/conversation-state.ts";
import { shouldShowNativeOkfEvaluationCallout } from "../../shared/evaluation-onboarding.ts";
import { NATIVE_OKF_EVALUATION_SURVEY_URL } from "../../shared/public-links.ts";
import {
  findNativeOkfScopePaper,
  nativeOkfActiveMentionQuery,
  nativeOkfSlashCommand,
  type NativeOkfScopePaper,
} from "../../shared/paper-scope.ts";
import {
  applyManualDiagramToggle,
  diagramPreferenceForRequest,
  INITIAL_DIAGRAM_INTENT_TOGGLE_STATE,
  reconcileDiagramIntentToggle,
} from "../../shared/diagram-intent.ts";
import {
  NATIVE_OKF_API_ROUTES,
  NATIVE_OKF_PUBLIC_ROUTES,
} from "../../shared/routes.ts";
import { ChatAnswer } from "./ChatAnswer.tsx";
import { GuidedChatStarters } from "./GuidedChatStarters.tsx";
import { PaperScopeControl } from "./PaperScopeControl.tsx";
import { PaperScopePopover } from "./PaperScopePopover.tsx";

const MAX_QUESTION_LENGTH = 2_000;

interface ChatEntry {
  id: string;
  role: "user" | "assistant";
  content: string;
  response?: NativeOkfChatResponse;
  /** Set on a user turn whose request failed — kept visible as a distinct marker, never resent. */
  failed?: boolean;
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
  if (isRecord(payload)) {
    if (
      typeof payload.error === "string" &&
      payload.error.length > 0 &&
      payload.error.length <= 500
    ) {
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
  if (status === 429) {
    return "The assistant is handling other requests. Please try again shortly.";
  }
  if (status === 503) {
    return "The native OKF assistant is temporarily unavailable.";
  }
  return "The native OKF assistant could not complete this request.";
}

function historyFromEntries(entries: readonly ChatEntry[]): NativeOkfChatHistoryMessage[] {
  return entries
    .filter((entry) => !entry.failed)
    .map((entry) => ({
      role: entry.role,
      content: entry.content.slice(
        0,
        MAX_NATIVE_OKF_MODEL_HISTORY_MESSAGE_CHARACTERS,
      ),
    }))
    .slice(-MAX_NATIVE_OKF_MODEL_HISTORY_MESSAGES);
}

function parseResponseScope(value: unknown): NativeOkfChatScope | null {
  if (!isRecord(value)) return null;
  if (value.type === "corpus") return { type: "corpus" };
  if (value.type === "paper" && typeof value.paperId === "string" && value.paperId) {
    return { type: "paper", paperId: value.paperId };
  }
  return null;
}

export interface ChatWorkbenchProps {
  /** Canonical papers for the scope selector, `@` reference, and `/paper` command. */
  papers: readonly NativeOkfScopePaper[];
  /** Initial conversational scope (e.g. from `?paper=` or the paper-page drawer). */
  initialScope?: NativeOkfChatScope;
  /**
   * When set, this instance is bound to one paper's page: New Chat returns to
   * this paper rather than to All papers, and the scope selector is not shown.
   */
  lockedPaperId?: string;
  variant?: "page" | "drawer";
}

export function ChatWorkbench({
  papers,
  initialScope,
  lockedPaperId,
  variant = "page",
}: ChatWorkbenchProps) {
  const lockedScope: NativeOkfChatScope | null = lockedPaperId
    ? { type: "paper", paperId: lockedPaperId }
    : null;
  const startingScope: NativeOkfChatScope =
    lockedScope ?? initialScope ?? { type: "corpus" };

  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [question, setQuestion] = useState("");
  const [scope, setScope] = useState<NativeOkfChatScope>(startingScope);
  const [mentionState, setMentionState] = useState<
    { start: number; query: string } | null
  >(null);
  const [commandPickerOpen, setCommandPickerOpen] = useState(false);
  const [diagramIntentToggle, setDiagramIntentToggle] = useState(
    INITIAL_DIAGRAM_INTENT_TOGGLE_STATE,
  );
  const [conversationState, setConversationState] = useState(() => ({
    ...createInitialNativeOkfConversationState(),
    scope: startingScope,
  }));
  const [conversationId, setConversationId] = useState("");
  const [sessionReady, setSessionReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /**
   * An informational message about the composer itself (for example, a command
   * that does not apply in this chat). Kept separate from `error` so a "not
   * available here" explanation is never labelled as a failed request.
   */
  const [notice, setNotice] = useState<string | null>(null);
  const [startersOpen, setStartersOpen] = useState(true);
  const [surveyCalloutDismissed, setSurveyCalloutDismissed] = useState(false);
  const nextId = useRef(1);
  const requestController = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  /** Anchor for the `@` and `/paper` pickers: the composer box itself. */
  const composerRef = useRef<HTMLDivElement | null>(null);
  /** Content region every paper picker popover stays inside on desktop. */
  const panelRef = useRef<HTMLElement | null>(null);
  const skipNextSessionWrite = useRef(false);

  const sessionKey = lockedPaperId
    ? `native-okf-chat-session:paper:${lockedPaperId}`
    : undefined;

  const trimmedQuestion = question.trim();
  const slashCommand = nativeOkfSlashCommand(question);
  const invalidLength =
    trimmedQuestion.length > 0 && trimmedQuestion.length < 3 && !slashCommand;
  const overLimit = question.length > MAX_QUESTION_LENGTH;
  const canSubmit =
    !pending &&
    ((trimmedQuestion.length >= 3 && question.length <= MAX_QUESTION_LENGTH) ||
      slashCommand !== null);
  const includeDiagram = diagramIntentToggle.enabled;
  const historyContextTruncated =
    nativeOkfVisibleHistoryExceedsModelContext(entries.length);
  const activePaper = scope.type === "paper"
    ? findNativeOkfScopePaper(scope.paperId, papers)
    : undefined;

  function changeScope(next: NativeOkfChatScope) {
    if (lockedScope && next.type === "corpus") return;
    setScope(next);
    setConversationState((current) => ({ ...current, scope: next }));
  }

  function updateComposer(nextQuestion: string, caret?: number) {
    setQuestion(nextQuestion);
    setDiagramIntentToggle((current) =>
      reconcileDiagramIntentToggle(current, nextQuestion, true),
    );
    const caretPosition = caret ?? nextQuestion.length;
    setMentionState(
      lockedScope ? null : nativeOkfActiveMentionQuery(nextQuestion, caretPosition),
    );
    const command = nativeOkfSlashCommand(nextQuestion);
    setCommandPickerOpen(!lockedScope && command?.command === "paper");
  }

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      let restored = null;
      try {
        restored = readNativeOkfChatSession(window.sessionStorage, sessionKey);
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
        // An explicitly requested scope — the drawer's locked paper, or the
        // `?paper=` deep link behind "Open full chat" — is the researcher's
        // current intent and outranks whatever scope the restored tab session
        // was last left in. Without this, opening the full chat from a paper
        // drawer would silently land back in All papers whenever a previous
        // main-chat conversation existed in this tab.
        const restoredScope = lockedScope ?? initialScope ??
          restored.conversationState.scope;
        setConversationState({
          ...restored.conversationState,
          scope: restoredScope,
        });
        setScope(restoredScope);
        setDiagramIntentToggle(restored.diagramPreference);
        setConversationId(restored.conversationId);
        nextId.current = restoredEntries.length + 1;
      } else {
        setConversationId(createNativeOkfLocalConversationId());
      }
      setSessionReady(true);
    }, 0);
    return () => window.clearTimeout(restoreTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!sessionReady || conversationId === "") return;
    if (skipNextSessionWrite.current) {
      skipNextSessionWrite.current = false;
      return;
    }
    try {
      writeNativeOkfChatSession(
        window.sessionStorage,
        {
          version: 1,
          conversationId,
          messages: entries,
          conversationState,
          diagramPreference: diagramIntentToggle,
        },
        sessionKey,
      );
    } catch {
      // In-memory conversation remains available when storage is blocked.
    }
  }, [
    conversationId,
    conversationState,
    diagramIntentToggle,
    entries,
    sessionReady,
    sessionKey,
  ]);

  function makeId(prefix: "user" | "assistant"): string {
    const id = `${prefix}-${nextId.current}`;
    nextId.current += 1;
    return id;
  }

  function selectMentionPaper(paper: NativeOkfScopePaper) {
    if (mentionState) {
      const before = question.slice(0, mentionState.start);
      const after = question.slice(
        mentionState.start + 1 + mentionState.query.length,
      );
      const nextQuestion = `${before}${after}`.replace(/\s{2,}/gu, " ");
      updateComposer(nextQuestion, before.length);
    }
    changeScope({ type: "paper", paperId: paper.paperId });
    setMentionState(null);
    inputRef.current?.focus();
  }

  function selectCommandPaper(paper: NativeOkfScopePaper) {
    changeScope({ type: "paper", paperId: paper.paperId });
    updateComposer("");
    setCommandPickerOpen(false);
    inputRef.current?.focus();
  }

  async function submitQuestion(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const raw = question.trim();
    const command = nativeOkfSlashCommand(raw);
    if (command) {
      if (command.command === "all") {
        if (lockedScope) {
          // This instance is bound to one paper's page, so broadening is not
          // available here. Say so rather than swallowing the message silently,
          // and point at the affordance that does broaden.
          setNotice(
            "This paper chat stays with this paper. Use “Open full chat” to ask across all papers.",
          );
          return;
        }
        setNotice(null);
        changeScope({ type: "corpus" });
        updateComposer("");
      } else if (command.command === "new") {
        clearConversation();
      } else {
        setCommandPickerOpen(true);
      }
      return;
    }

    const submittedQuestion = raw;
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
      scope,
      diagramPreference: diagramPreferenceForRequest(
        diagramIntentToggle,
        submittedQuestion,
      ),
      visibleHistoryMessageCount: priorEntries.length,
      conversationState: compactNativeOkfConversationStateForRequest(
        conversationState,
      ),
    };

    setEntries((current) => [...current, userEntry]);
    setStartersOpen(false);
    setQuestion("");
    setDiagramIntentToggle(INITIAL_DIAGRAM_INTENT_TOGGLE_STATE);
    setMentionState(null);
    setCommandPickerOpen(false);
    setError(null);
    setNotice(null);
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
      const nextScope =
        parseResponseScope((payload as { scope?: unknown }).scope) ??
        nextConversationState.scope;
      setScope(lockedScope ?? nextScope);

      const assistantEntry: ChatEntry = {
        id: makeId("assistant"),
        role: "assistant",
        content: payload.answerMarkdown,
        ...(payload.kind === "answer" ? { response: payload } : {}),
      };
      setEntries((current) => [...current, assistantEntry]);
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      setError(
        caught instanceof Error
          ? caught.message
          : "The design knowledge assistant could not complete this request.",
      );
      setEntries((current) =>
        current.map((entry) =>
          entry.id === userEntry.id ? { ...entry, failed: true } : entry
        )
      );
      updateComposer(submittedQuestion);
    } finally {
      if (requestController.current === controller) {
        requestController.current = null;
        setPending(false);
      }
    }
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      (mentionState || commandPickerOpen) &&
      ["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(event.key)
    ) {
      // Let the open picker handle navigation keys.
      if (event.key === "Escape") {
        setMentionState(null);
        setCommandPickerOpen(false);
      }
      return;
    }
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
      clearNativeOkfChatSession(window.sessionStorage, sessionKey);
    } catch {
      // In-memory reset still succeeds when browser storage is blocked.
    }
    const resetScope = lockedScope ?? { type: "corpus" as const };
    setConversationState({
      ...createInitialNativeOkfConversationState(),
      scope: resetScope,
    });
    setScope(resetScope);
    setDiagramIntentToggle(INITIAL_DIAGRAM_INTENT_TOGGLE_STATE);
    setConversationId(createNativeOkfLocalConversationId());
    nextId.current = 1;
    setEntries([]);
    setStartersOpen(true);
    setSurveyCalloutDismissed(false);
    setMentionState(null);
    setCommandPickerOpen(false);
    updateComposer("");
    setError(null);
    setNotice(null);
    setPending(false);
    inputRef.current?.focus();
  }

  function prefillComposer(example: string) {
    updateComposer(example);
    setStartersOpen(false);
    inputRef.current?.focus();
  }

  const hasSubstantiveResponse = shouldShowNativeOkfEvaluationCallout(
    entries.flatMap((entry) => entry.response ? [entry.response] : []),
  );

  const openFullChatHref = scope.type === "paper"
    ? `${NATIVE_OKF_PUBLIC_ROUTES.chat}?paper=${
        encodeURIComponent(scope.paperId)
      }`
    : NATIVE_OKF_PUBLIC_ROUTES.chat;

  return (
    <div className="space-y-5">
      <section
        ref={panelRef}
        className="overflow-hidden rounded-2xl border border-line bg-white shadow-research"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-paper px-4 py-3 sm:px-5">
          <div>
            {variant === "drawer" ? (
              <p className="text-xs leading-5 text-muted">
                Answers stay grounded in this paper&apos;s canonical design
                knowledge and are kept only in this tab session.
              </p>
            ) : (
              <>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue">
                  Design knowledge assistant
                </p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Answers use retrieved library sources. Conversation content remains in this
                  browser tab and is not stored by the server.
                </p>
              </>
            )}
            {variant !== "drawer" ? (
              <p className="mt-2 inline-flex rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs leading-5 text-amber-950">
                Current corpus: Blockchain-related Design Science Research papers only.
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            {variant === "drawer" ? (
              <a
                href={openFullChatHref}
                className="rounded-full border border-line bg-white px-3.5 py-2 text-xs font-semibold text-ink transition hover:border-blue/40 hover:text-blue"
              >
                Open full chat ↗
              </a>
            ) : null}
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
        </div>

        <div
          aria-busy={pending}
          className="min-h-[320px] space-y-6 px-4 py-6 sm:px-6 lg:px-8"
        >
          {entries.length === 0 ? (
            <div className="mx-auto max-w-3xl py-4 text-center">
              <h2 className="font-serif text-2xl font-semibold text-ink">
                {variant === "drawer"
                  ? "Ask about this paper's design knowledge"
                  : "Ask the design knowledge library"}
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted">
                {variant === "drawer"
                  ? "Questions and answers are restricted to this paper's canonical design knowledge."
                  : "Answers use retrieved papers and concepts. Citations link to library source records; diagrams distinguish stored knowledge from new synthesis."}
              </p>

              {variant !== "drawer" ? (
                <div className="mt-6 text-left">
                  <GuidedChatStarters pending={pending} onPrefill={prefillComposer} />
                </div>
              ) : null}
            </div>
          ) : (
            <>
              {variant !== "drawer" ? (
                <div className="rounded-xl border border-line bg-slate-50 px-4 py-3">
                  <button
                    type="button"
                    aria-expanded={startersOpen}
                    aria-controls="native-okf-reopened-starters"
                    disabled={pending}
                    onClick={() => setStartersOpen((current) => !current)}
                    className="text-sm font-semibold text-blue underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue"
                  >
                    Corpus starters
                  </button>
                  {startersOpen ? (
                    <div id="native-okf-reopened-starters" className="mt-3 min-w-0 max-w-full">
                      <GuidedChatStarters pending={pending} onPrefill={prefillComposer} />
                    </div>
                  ) : null}
                </div>
              ) : null}
              <ol className="space-y-7">
                {entries.map((entry) => (
                  <li key={entry.id}>
                    {entry.role === "user" ? (
                      <article
                        className={`ml-auto max-w-3xl rounded-2xl rounded-br-md px-5 py-4 shadow-sm ${
                          entry.failed
                            ? "border border-dashed border-red-300 bg-white text-ink opacity-70"
                            : "bg-ink text-white"
                        }`}
                      >
                        <p
                          className={`mb-2 text-[10px] font-bold uppercase tracking-[0.14em] ${
                            entry.failed ? "text-red-500" : "text-slate-400"
                          }`}
                        >
                          {entry.failed ? "You · not sent" : "You"}
                        </p>
                        <p className="whitespace-pre-wrap text-sm leading-6">
                          {entry.content}
                        </p>
                        {entry.failed ? (
                          <p className="mt-2 text-xs text-red-500">
                            This message failed to send and was not answered. It has been
                            placed back in the composer to retry.
                          </p>
                        ) : null}
                      </article>
                    ) : (
                      <article className="rounded-2xl rounded-tl-md border border-line bg-white px-5 py-5 shadow-sm sm:px-6">
                        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-blue">
                          Design knowledge assistant
                        </p>
                        {entry.response ? (
                          <ChatAnswer response={entry.response} messageId={entry.id} />
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

          {hasSubstantiveResponse && !surveyCalloutDismissed && variant !== "drawer" ? (
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

          {notice ? (
            <div
              role="status"
              className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-amber-900">
                    Not available here
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{notice}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNotice(null)}
                  className="text-xs font-semibold text-amber-900 underline underline-offset-4"
                >
                  Dismiss
                </button>
              </div>
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
          {historyContextTruncated ? (
            <aside
              role="status"
              className="mb-3 rounded-xl border border-amber/35 bg-amber/10 px-4 py-3"
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

          <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-1">
              <label
                htmlFor="native-okf-chat-question"
                className="text-xs font-bold uppercase tracking-[0.12em] text-ink"
              >
                Question
              </label>
              {variant !== "drawer" ? (
                <p className="text-[0.68rem] leading-4 text-muted">
                  Tip: Use <span className="font-semibold text-ink">@</span> or{" "}
                  <span className="font-semibold text-ink">/paper</span> to select a
                  paper and chat only with its design knowledge.
                </p>
              ) : null}
            </div>
            {variant !== "drawer" ? (
              <PaperScopeControl
                papers={papers}
                scope={scope}
                onScopeChange={changeScope}
                disabled={pending}
                boundsRef={panelRef}
              />
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border border-blue/30 bg-blue/10 px-3 py-1 text-xs font-semibold text-ink">
                <span className="text-blue">Paper scope:</span>
                {activePaper?.title ?? lockedPaperId}
              </span>
            )}
          </div>

          <div
            ref={composerRef}
            className="rounded-xl border border-line bg-white p-2 shadow-sm focus-within:border-blue/50 focus-within:ring-2 focus-within:ring-blue/15"
          >
            {mentionState && !lockedScope ? (
              <PaperScopePopover
                anchorRef={composerRef}
                boundsRef={panelRef}
                papers={papers}
                heading="Reference a paper"
                initialQuery={mentionState.query}
                onSelect={selectMentionPaper}
                onClose={() => setMentionState(null)}
              />
            ) : null}
            {commandPickerOpen && !lockedScope ? (
              <PaperScopePopover
                anchorRef={composerRef}
                boundsRef={panelRef}
                papers={papers}
                heading="Select a paper"
                initialQuery={slashCommand?.command === "paper"
                  ? slashCommand.argument
                  : ""}
                onSelect={selectCommandPaper}
                onClose={() => setCommandPickerOpen(false)}
              />
            ) : null}
            <textarea
              ref={inputRef}
              id="native-okf-chat-question"
              value={question}
              onChange={(event) =>
                updateComposer(event.target.value, event.target.selectionStart ?? undefined)
              }
              onKeyDown={handleComposerKeyDown}
              rows={3}
              maxLength={MAX_QUESTION_LENGTH + 1}
              disabled={pending}
              placeholder={scope.type === "paper"
                ? "Ask about this paper — its requirements, principles, features, map, or relationships…"
                : "Ask about papers, requirements, principles, features, relationships, or cross-paper synthesis…"}
              className="block w-full resize-y border-0 bg-transparent px-2 py-2 text-sm leading-6 text-ink outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-2 pt-3">
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={includeDiagram}
                  onChange={(event) =>
                    setDiagramIntentToggle((current) =>
                      applyManualDiagramToggle(current, question, event.target.checked),
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
              Press Enter to send or Shift+Enter for a new line. Type{" "}
              {/* A locked paper chat cannot broaden, so it never offers /all. */}
              {lockedScope ? null : (
                <>
                  <span className="font-semibold">/all</span> to return to all
                  papers,{" "}
                </>
              )}
              <span className="font-semibold">/new</span> to start a new chat.
              Questions, answers, and conversation focus are kept only in this tab
              session; they are not stored by the server.
            </p>
          )}
        </form>
      </section>
    </div>
  );
}
