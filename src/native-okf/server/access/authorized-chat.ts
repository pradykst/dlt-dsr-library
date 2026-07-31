import "server-only";

import { createHmac, randomUUID } from "node:crypto";

import type {
  NativeOkfChatResponse,
  NativeOkfPersonalQuotaMetadata,
} from "../../shared/chat-types.ts";
import {
  assembleNativeOkfContextualRetrieval,
  hasSufficientNativeOkfSynthesisGrounding,
  prepareNativeOkfChatRequest,
  type NativeOkfConversationCatalog,
} from "../conversation.ts";
import { isNativeOkfLiveDataRequest } from "../live-data-gate.ts";
import { retrieveOkfContext } from "../retrieval.ts";
import type { RetrievalResult } from "../retrieval-types.ts";
import {
  answerNativeOkfChat,
  validateNativeOkfChatRequest,
  type NativeOkfChatDependencies,
} from "../openai/chat.ts";
import {
  getOpenAiClient,
  type NativeOpenAiClient,
} from "../openai/client.ts";
import {
  readOpenAiEnvironment,
  type NativeOpenAiEnvironment,
} from "../openai/env.ts";
import { NativeOkfChatError } from "../openai/errors.ts";
import type { NativeOkfAccessConfig } from "./config.ts";
import {
  accessRequiredError,
  NativeOkfAccessError,
  reservationBlockError,
  servicePausedError,
  serviceUnavailableError,
} from "./errors.ts";
import { verifyResearcherSessionCookie } from "./sessions.ts";
import type { NativeOkfOperationalStore } from "./store.ts";
import {
  invitationStatus,
  type InvitationRecord,
  type NativeOkfSubjectKind,
  type QuotaLimits,
  type SubjectQuotaSnapshot,
} from "./types.ts";
import {
  calculateResponseCallEnvelopeMicrodollars,
  createUsageTrackingClient,
  NativeOkfUsageCollector,
  reconcileTrackedUsage,
} from "./usage.ts";

type RetrieveNativeOkfContext = (
  question: string,
) => Promise<RetrievalResult>;

type AnswerNativeOkfChat = (
  input: unknown,
  dependencies?: NativeOkfChatDependencies,
) => Promise<NativeOkfChatResponse>;

export interface AuthorizedNativeOkfChatDependencies {
  config: NativeOkfAccessConfig;
  getStore: () => NativeOkfOperationalStore;
  cookieHeader?: string | null;
  ipSubject: string;
  now?: () => number;
  retrieve?: RetrieveNativeOkfContext;
  conversationCatalog?: NativeOkfConversationCatalog;
  answer?: AnswerNativeOkfChat;
  loadOpenAiEnvironment?: () => NativeOpenAiEnvironment;
  getOpenAiClient?: (
    environment: NativeOpenAiEnvironment,
  ) => NativeOpenAiClient;
  createReservationId?: () => string;
}

interface AuthorizedSubject {
  subjectId: string;
  subjectKind: NativeOkfSubjectKind;
  invitationId: string | null;
  limits: QuotaLimits;
  accessExpiresAtMs: number;
}

function callStore<T>(operation: () => T): T {
  try {
    return operation();
  } catch (error) {
    if (error instanceof NativeOkfAccessError) throw error;
    throw serviceUnavailableError();
  }
}

export function assertNativeOkfChatEnvironmentEnabled(
  config: NativeOkfAccessConfig,
): void {
  if (!config.chatEnabled || config.accessMode === "disabled") {
    throw servicePausedError();
  }
}

export function assertNativeOkfChatOperationallyEnabled(
  store: NativeOkfOperationalStore,
): void {
  if (callStore(() => store.getOperationalPause())) {
    throw servicePausedError();
  }
}

export function createNativeOkfTestSubjectId(
  testAccessCode: string,
  sessionSecret: string,
): string {
  if (!testAccessCode || Buffer.byteLength(sessionSecret, "utf8") < 32) {
    throw serviceUnavailableError();
  }
  const digest = createHmac("sha256", sessionSecret)
    .update("native-okf:test-access-subject:v1:")
    .update(testAccessCode)
    .digest("hex");
  return `test:${digest}`;
}


function safeQuota(
  quota: SubjectQuotaSnapshot,
): NativeOkfPersonalQuotaMetadata {
  return {
    questionsRemainingToday: quota.questionsRemainingToday,
    diagramsRemainingToday: quota.diagramsRemainingToday,
    questionsRemainingTotal: quota.questionsRemainingTotal,
    diagramsRemainingTotal: quota.diagramsRemainingTotal,
    resetAtMs: quota.resetAtMs,
    accessExpiresAtMs: quota.accessExpiresAtMs,
  };
}

function withoutRetrievalDebug(
  response: NativeOkfChatResponse,
): NativeOkfChatResponse {
  const safeResponse = { ...response };
  delete safeResponse.retrievalDebug;
  return safeResponse;
}

function resolveInvitationSubject(
  invitation: InvitationRecord | null,
  sessionExpiresAtMs: number,
  nowMs: number,
): AuthorizedSubject {
  if (!invitation) {
    throw new NativeOkfAccessError(
      "access_revoked",
      403,
      "Researcher access is no longer valid.",
    );
  }
  const status = invitationStatus(invitation, nowMs);
  if (status === "expired") {
    throw new NativeOkfAccessError(
      "access_expired",
      403,
      "Researcher access has expired.",
    );
  }
  if (status === "revoked") {
    throw new NativeOkfAccessError(
      "access_revoked",
      403,
      "Researcher access is no longer valid.",
    );
  }
  return {
    subjectId: invitation.id,
    subjectKind: "invite",
    invitationId: invitation.id,
    limits: invitation.quotas,
    accessExpiresAtMs: Math.min(
      invitation.expiresAtMs,
      sessionExpiresAtMs,
    ),
  };
}

function resolveAuthorizedSubject(
  dependencies: AuthorizedNativeOkfChatDependencies,
  store: NativeOkfOperationalStore,
  nowMs: number,
): AuthorizedSubject {
  const secret = dependencies.config.sessionSecret;
  if (!secret) throw serviceUnavailableError();
  const verification = verifyResearcherSessionCookie(
    dependencies.cookieHeader,
    secret,
    nowMs,
  );
  if (!verification.valid) {
    if (verification.reason === "expired") {
      throw new NativeOkfAccessError(
        "access_expired",
        403,
        "Researcher access has expired.",
      );
    }
    throw accessRequiredError();
  }

  if (dependencies.config.accessMode === "test") {
    const testCode = dependencies.config.testAccessCode;
    if (!testCode) throw serviceUnavailableError();
    const expectedSubject = createNativeOkfTestSubjectId(testCode, secret);
    if (verification.payload.subjectId !== expectedSubject) {
      throw new NativeOkfAccessError(
        "access_revoked",
        403,
        "Researcher access is no longer valid.",
      );
    }
    return {
      subjectId: expectedSubject,
      subjectKind: "test",
      invitationId: null,
      limits: dependencies.config.testQuotas,
      accessExpiresAtMs: verification.payload.expiresAtMs,
    };
  }

  if (dependencies.config.accessMode === "invite") {
    const invitation = callStore(() =>
      store.getInvitation(verification.payload.subjectId),
    );
    return resolveInvitationSubject(
      invitation,
      verification.payload.expiresAtMs,
      nowMs,
    );
  }

  throw servicePausedError();
}

function errorCategory(error: unknown): string {
  if (error instanceof NativeOkfChatError) {
    return error.code.replaceAll("_", "-");
  }
  if (error instanceof NativeOkfAccessError) {
    return error.code.replaceAll("_", "-");
  }
  return "generation-failed";
}

function responseBudgetError(): NativeOkfChatError {
  return new NativeOkfChatError(
    "generation_failed",
    503,
    "The native OKF assistant is temporarily unavailable because its application safety allowance could not be reserved.",
  );
}


function reconcile(
  store: NativeOkfOperationalStore,
  reservationId: string,
  collector: NativeOkfUsageCollector,
  config: NativeOkfAccessConfig,
  reservedMicrodollars: number,
  completedAtMs: number,
  latencyMs: number,
  diagramDelivered: boolean,
  error: unknown | null,
): void {
  const reconciliation = reconcileTrackedUsage(
    collector.snapshot(),
    config.pricing,
    reservedMicrodollars,
  );
  if (reconciliation.envelopeExceeded) {
    // An envelope violation is a cost-safety invariant failure. Persistently
    // pause subsequent calls before recording the conservative actual charge.
    callStore(() => store.setOperationalPause(true, completedAtMs));
  }
  callStore(() =>
    store.reconcileReservation({
      reservationId,
      completedAtMs,
      usage: reconciliation.usage,
      diagramModelCalls: reconciliation.diagramModelCalls,
      diagramDelivered,
      actualMicrodollars: reconciliation.actualMicrodollars,
      usageUnreconciled: reconciliation.usageUnreconciled,
      latencyMs,
      outcomeCategory: error === null ? "completed" : "failed",
      errorCategory: reconciliation.envelopeExceeded
        ? "usage-envelope-exceeded"
        : error === null
          ? null
          : errorCategory(error),
    }),
  );
}

/**
 * The single paid native OKF execution boundary. No OpenAI environment or
 * client is loaded until local retrieval, session validation, and the atomic
 * monetary/quota reservation have succeeded.
 */
export async function answerAuthorizedNativeOkfChat(
  input: unknown,
  dependencies: AuthorizedNativeOkfChatDependencies,
): Promise<NativeOkfChatResponse> {
  assertNativeOkfChatEnvironmentEnabled(dependencies.config);
  const store = callStore(dependencies.getStore);
  assertNativeOkfChatOperationallyEnabled(store);

  const request = validateNativeOkfChatRequest(input);
  const clock = dependencies.now ?? Date.now;
  const requestStartedAtMs = clock();

  const abuse = callStore(() =>
    store.checkAndRecordAbuseAttempt({
      ipSubject: dependencies.ipSubject,
      nowMs: requestStartedAtMs,
      globalRequestsPerMinute:
        dependencies.config.globalRequestsPerMinute,
      ipRequestsPerHour: dependencies.config.ipRequestsPerHour,
    }),
  );
  if (!abuse.allowed) {
    throw new NativeOkfAccessError(
      "rate_limited",
      429,
      "Please wait before making another native OKF assistant request.",
      abuse.retryAfterMs,
    );
  }

  const prepared = await prepareNativeOkfChatRequest(
    request,
    dependencies.conversationCatalog,
  );
  if (
    prepared.clarification ||
    isNativeOkfLiveDataRequest(prepared.effectiveQuestion)
  ) {
    const response = await answerNativeOkfChat(request, { prepared });
    return withoutRetrievalDebug(response);
  }

  const retrieve = dependencies.retrieve ?? retrieveOkfContext;
  const rawRetrieval = await retrieve(prepared.retrievalQuestion);
  const restrictedRetrieval = await assembleNativeOkfContextualRetrieval(
    prepared,
    rawRetrieval,
  );
  const synthesisGroundingMissing =
    prepared.intent === "synthesized-flow" &&
    !hasSufficientNativeOkfSynthesisGrounding(restrictedRetrieval);
  const retrieval: RetrievalResult = synthesisGroundingMissing
    ? {
        ...restrictedRetrieval,
        noMatch: true,
        warnings: [
          ...restrictedRetrieval.warnings,
          "At least two relevant stored native concepts are required for synthesis.",
        ],
      }
    : restrictedRetrieval;
  const answer = dependencies.answer ?? answerNativeOkfChat;

  if (retrieval.noMatch) {
    const response = await answer(request, {
      retrieve: async () => retrieval,
      prepared,
    });
    return withoutRetrievalDebug(response);
  }

  const reservationNowMs = clock();
  const subject = resolveAuthorizedSubject(
    dependencies,
    store,
    reservationNowMs,
  );
  const includeDiagram = prepared.includeDiagram;
  const configuredReservationMicrodollars = includeDiagram
    ? dependencies.config.diagramRequestReserveMicrodollars
    : dependencies.config.textRequestReserveMicrodollars;
  let reservedMicrodollars = configuredReservationMicrodollars;
  let cumulativeResponseEnvelopeMicrodollars = 0;
  const reservationId =
    dependencies.createReservationId?.() ?? randomUUID();

  const reservationDecision = callStore(() =>
    store.reservePaidRequest({
      reservationId,
      subjectId: subject.subjectId,
      subjectKind: subject.subjectKind,
      invitationId: subject.invitationId,
      nowMs: reservationNowMs,
      expiresAtMs: reservationNowMs + dependencies.config.reservationTtlMs,
      includeDiagram,
      reserveMicrodollars: reservedMicrodollars,
      subjectLimits: subject.limits,
      applicationLimits: dependencies.config.applicationBudgets,
      accessExpiresAtMs: subject.accessExpiresAtMs,
    }),
  );
  if (!reservationDecision.allowed) {
    throw reservationBlockError(
      reservationDecision.reason,
      reservationDecision.retryAfterMs,
    );
  }

  let collector: NativeOkfUsageCollector | undefined;
  let settled = false;
  let executionError: unknown | null = null;
  try {
    if (prepared.preferDeterministicPaperMap) {
      collector = new NativeOkfUsageCollector();
      const response = await answer(request, {
        retrieve: async () => retrieval,
        prepared,
      });
      const completedAtMs = clock();
      reconcile(
        store,
        reservationId,
        collector,
        dependencies.config,
        reservedMicrodollars,
        completedAtMs,
        Math.max(0, completedAtMs - reservationNowMs),
        response.diagramStatus === "success" && response.diagram !== undefined,
        null,
      );
      settled = true;
      const quota = callStore(() =>
        store.getSubjectQuotaSnapshot({
          subjectId: subject.subjectId,
          nowMs: completedAtMs,
          limits: subject.limits,
          accessExpiresAtMs: subject.accessExpiresAtMs,
        }),
      );
      return {
        ...withoutRetrievalDebug(response),
        quota: safeQuota(quota),
      };
    }

    const environment = (
      dependencies.loadOpenAiEnvironment ?? readOpenAiEnvironment
    )();
    const baseClient = (
      dependencies.getOpenAiClient ?? getOpenAiClient
    )(environment);
    const tracked = createUsageTrackingClient(
      baseClient,
      undefined,
      {
        beforeResponseCall: (body) => {
          let callEnvelopeMicrodollars: number;
          try {
            callEnvelopeMicrodollars =
              calculateResponseCallEnvelopeMicrodollars(
                body,
                dependencies.config.pricing,
              );
          } catch {
            throw responseBudgetError();
          }

          const nextCumulativeEnvelope =
            cumulativeResponseEnvelopeMicrodollars +
            callEnvelopeMicrodollars;
          if (!Number.isSafeInteger(nextCumulativeEnvelope)) {
            throw responseBudgetError();
          }
          const requiredReservedMicrodollars = Math.max(
            configuredReservationMicrodollars,
            nextCumulativeEnvelope,
          );
          let increaseDecision;
          try {
            increaseDecision = callStore(() =>
              store.increaseReservationBudget({
                reservationId,
                nowMs: clock(),
                requiredReservedMicrodollars,
                applicationLimits:
                  dependencies.config.applicationBudgets,
              }),
            );
          } catch {
            throw responseBudgetError();
          }
          if (!increaseDecision.allowed) {
            throw responseBudgetError();
          }

          cumulativeResponseEnvelopeMicrodollars =
            nextCumulativeEnvelope;
          reservedMicrodollars =
            increaseDecision.reservation.reservedMicrodollars;
        },
      },
    );
    collector = tracked.collector;

    const response = await answer(request, {
      retrieve: async () => retrieval,
      prepared,
      environment,
      client: tracked.client,
    });
    const completedAtMs = clock();
    reconcile(
      store,
      reservationId,
      collector,
      dependencies.config,
      reservedMicrodollars,
      completedAtMs,
      Math.max(0, completedAtMs - reservationNowMs),
      response.diagramStatus === "success" && response.diagram !== undefined,
      null,
    );
    settled = true;

    const quota = callStore(() =>
      store.getSubjectQuotaSnapshot({
        subjectId: subject.subjectId,
        nowMs: completedAtMs,
        limits: subject.limits,
        accessExpiresAtMs: subject.accessExpiresAtMs,
      }),
    );
    return {
      ...withoutRetrievalDebug(response),
      quota: safeQuota(quota),
    };
  } catch (error) {
    executionError = error;
    if (!settled && collector) {
      const completedAtMs = clock();
      reconcile(
        store,
        reservationId,
        collector,
        dependencies.config,
        reservedMicrodollars,
        completedAtMs,
        Math.max(0, completedAtMs - reservationNowMs),
        false,
        error,
      );
      settled = true;
    }
    throw error;
  } finally {
    if (!settled) {
      const modelCalls = collector?.snapshot().modelCalls ?? 0;
      callStore(() =>
        store.releaseReservation({
          reservationId,
          releasedAtMs: clock(),
          releaseQuota: modelCalls === 0,
          outcomeCategory: "released",
          errorCategory:
            executionError === null
              ? "execution-not-started"
              : errorCategory(executionError),
        }),
      );
    }
  }
}
