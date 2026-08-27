import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import type {
  NativeOkfChatResponse,
  NativeOkfSourceCard,
} from "../../shared/chat-types.ts";
import { assistantResponseClipboardText } from "../../shared/assistant-copy.ts";
import {
  conceptHref,
  isSafeExternalHref,
} from "../../shared/links.ts";
import { TypeBadge } from "../TypeBadge.tsx";
import { GeneratedDiagramView } from "./GeneratedDiagramView.tsx";
import { CopyAssistantResponseButton } from "./CopyAssistantResponseButton.tsx";

function citationMarkdown(
  markdown: string,
  sources: readonly NativeOkfSourceCard[],
  anchorPrefix: string,
): string {
  const validIds = new Set(sources.map((source) => source.sourceId));
  return markdown.replace(
    /\[\[(S[1-9]\d*)\]\]/gu,
    (token, sourceId: string) =>
      validIds.has(sourceId)
        ? `[${sourceId}](#${anchorPrefix}-source-${sourceId})`
        : token,
  );
}

function answerComponents(anchorPrefix: string): Components {
  return {
    h1: ({ children }) => (
      <h3 className="mb-4 mt-7 font-serif text-2xl font-semibold text-ink first:mt-0">
        {children}
      </h3>
    ),
    h2: ({ children }) => (
      <h3 className="mb-3 mt-7 font-serif text-xl font-semibold text-ink first:mt-0">
        {children}
      </h3>
    ),
    h3: ({ children }) => (
      <h4 className="mb-2 mt-6 text-base font-semibold text-ink">
        {children}
      </h4>
    ),
    p: ({ children }) => (
      <p className="my-3 text-[0.97rem] leading-7 text-slate-700">{children}</p>
    ),
    a: ({ children, href }) => {
      if (href?.startsWith(`#${anchorPrefix}-source-`)) {
        return (
          <a
            href={href}
            className="mx-0.5 inline-flex translate-y-[-1px] rounded-full border border-blue/25 bg-blue/10 px-2 py-0.5 font-mono text-[0.72rem] font-bold leading-none text-blue no-underline transition hover:border-blue/50 hover:bg-blue/15 focus:outline-none focus:ring-2 focus:ring-blue/40"
            aria-label={`Open source ${String(children)}`}
          >
            {children}
          </a>
        );
      }
      if (href && isSafeExternalHref(href)) {
        return (
          <a
            href={href}
            rel="noopener noreferrer"
            target="_blank"
            className="font-medium text-blue underline decoration-blue/30 underline-offset-4 hover:text-ink"
          >
            {children}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        );
      }
      return <span>{children}</span>;
    },
    ul: ({ children }) => (
      <ul className="my-4 list-disc space-y-2 pl-6 text-[0.97rem] leading-7 text-slate-700">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="my-4 list-decimal space-y-2 pl-6 text-[0.97rem] leading-7 text-slate-700">
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="pl-1">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="my-5 border-l-4 border-blue/40 bg-blue/5 px-5 py-1 text-slate-700">
        {children}
      </blockquote>
    ),
    strong: ({ children }) => (
      <strong className="font-semibold text-ink">{children}</strong>
    ),
    code: ({ children, className }) => (
      <code
        className={
          className ??
          "rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.88em] text-slate-800"
        }
      >
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="my-5 overflow-x-auto rounded-xl bg-ink p-4 text-sm leading-6 text-slate-100">
        {children}
      </pre>
    ),
    table: ({ children }) => (
      <div className="my-5 overflow-x-auto rounded-xl border border-line">
        <table className="w-full border-collapse text-left text-sm">
          {children}
        </table>
      </div>
    ),
    th: ({ children }) => (
      <th className="border-b border-line bg-paper px-4 py-3 font-semibold text-ink">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="border-b border-line px-4 py-3 align-top text-slate-700">
        {children}
      </td>
    ),
    img: () => null,
  };
}

function SourceCard({
  source,
  anchorPrefix,
}: {
  source: NativeOkfSourceCard;
  anchorPrefix: string;
}) {
  const paperTitle =
    source.sourcePaper ?? (source.type === "paper" ? source.title : undefined);

  return (
    <article
      id={`${anchorPrefix}-source-${source.sourceId}`}
      className="scroll-mt-24 rounded-xl border border-line bg-white p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <a
          href={`#${anchorPrefix}-source-${source.sourceId}`}
          className="rounded-full border border-blue/25 bg-blue/10 px-2.5 py-1 font-mono text-[0.7rem] font-bold text-blue"
          aria-label={`Source ${source.sourceId}`}
        >
          {source.sourceId}
        </a>
        <TypeBadge type={source.type} />
      </div>

      <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
        Concept title
      </p>
      <h4 className="mt-1 text-sm font-semibold leading-5 text-ink">
        <Link
          href={conceptHref(source.conceptId)}
          className="hover:text-blue hover:underline hover:underline-offset-4"
        >
          {source.title}
        </Link>
      </h4>

      {paperTitle ? (
        <p className="mt-2 text-xs leading-5 text-muted">
          <span className="font-semibold text-ink">Paper:</span> {paperTitle}
        </p>
      ) : null}
      {source.description ? (
        <p className="mt-2 line-clamp-3 text-xs leading-5 text-muted">
          {source.description}
        </p>
      ) : null}

      <dl className="mt-3 border-t border-line pt-3">
        <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
          Concept path
        </dt>
        <dd className="mt-1">
          <Link
            href={conceptHref(source.conceptId)}
            className="break-all font-mono text-[0.7rem] leading-5 text-blue underline decoration-blue/25 underline-offset-2 hover:text-ink"
          >
            {source.conceptId}
          </Link>
        </dd>
      </dl>

      {source.resource && isSafeExternalHref(source.resource) ? (
        <a
          href={source.resource}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex text-xs font-semibold text-blue underline decoration-blue/30 underline-offset-4 hover:text-ink"
        >
          Open external resource
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      ) : null}
    </article>
  );
}

function SourceCollection({
  sources,
  anchorPrefix,
  collapsed,
}: {
  sources: readonly NativeOkfSourceCard[];
  anchorPrefix: string;
  collapsed: boolean;
}) {
  const content = (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {sources.map((source) => (
        <SourceCard
          key={source.sourceId}
          source={source}
          anchorPrefix={anchorPrefix}
        />
      ))}
    </div>
  );
  if (collapsed) {
    return (
      <details className="rounded-xl border border-line bg-paper">
        <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-ink">
          View {sources.length} grounding source{sources.length === 1 ? "" : "s"}
        </summary>
        <div className="border-t border-line p-4">{content}</div>
      </details>
    );
  }
  return (
    <section aria-label="Cited native OKF sources">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-blue">
            Sources
          </p>
          <h3 className="mt-1 font-serif text-xl font-semibold text-ink">
            Cited native concepts
          </h3>
        </div>
        <p className="text-xs text-muted">
          {sources.length} validated citation{sources.length === 1 ? "" : "s"}
        </p>
      </div>
      {content}
    </section>
  );
}

function diagnosticText(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "Retrieval diagnostics could not be displayed.";
  }
}

export function ChatAnswer({
  response,
  messageId,
}: {
  response: NativeOkfChatResponse;
  messageId: string;
}) {
  const anchorPrefix = `chat-${messageId}`;
  const primaryMarkdown = response.deterministicSummary ?? response.answerMarkdown;
  const markdown = citationMarkdown(
    primaryMarkdown,
    response.sources,
    anchorPrefix,
  );
  const evidenceFallback = response.diagramStatus === "evidence-fallback";
  const diagramFailed = response.diagramStatus === "failed";
  const showDiagnostics = response.retrievalDebug !== undefined;
  const clipboardText = assistantResponseClipboardText(primaryMarkdown);

  return (
    <div className="space-y-6">
      {response.insufficientContext ? (
        <div
          role="status"
          className="rounded-xl border border-amber/35 bg-amber/10 px-4 py-3 text-sm leading-6 text-slate-700"
        >
          <strong className="text-ink">Insufficient native OKF context.</strong>{" "}
          The local retrieval pipeline did not find enough grounded material for
          a supported answer.
        </div>
      ) : null}

      <div className="flex justify-end">
        <CopyAssistantResponseButton text={clipboardText} />
      </div>

      <article className="min-w-0">
        <ReactMarkdown
          components={answerComponents(anchorPrefix)}
          remarkPlugins={[remarkGfm]}
          skipHtml
          urlTransform={(url, key) => {
            if (key !== "href") return "";
            if (url.startsWith(`#${anchorPrefix}-source-`)) return url;
            return isSafeExternalHref(url) ? url : "";
          }}
        >
          {markdown}
        </ReactMarkdown>
      </article>

      {response.diagram ? (
        <div className="space-y-3">
          <GeneratedDiagramView diagram={response.diagram} sources={response.sources} />
          {evidenceFallback ? (
            <div
              role="status"
              className="rounded-xl border border-amber/35 bg-amber/10 px-4 py-3 text-sm leading-6 text-slate-700"
            >
              <strong className="text-ink">
                Supporting evidence map — not the requested synthesized flow.
              </strong>{" "}
              Only deterministic stored relationships are shown.
            </div>
          ) : null}
        </div>
      ) : diagramFailed ? (
        <div
          role="status"
          className="rounded-xl border border-amber/35 bg-amber/10 px-4 py-3 text-sm leading-6 text-slate-700"
        >
          No unvalidated diagram was displayed. Refine the problem or constraints
          before retrying synthesis.
        </div>
      ) : null}

      {response.warnings?.length ? (
        <div
          role="status"
          className="rounded-xl border border-amber/30 bg-amber/10 px-4 py-3"
        >
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-amber">
            Response notes
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-slate-700">
            {response.warnings.map((warning, index) => (
              <li key={`${warning}-${index}`}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {response.diagnosticCode &&
      (response.presentationMode === "safe-error" || diagramFailed) ? (
        <p className="text-xs text-muted">
          Diagnostic code: <code>{response.diagnosticCode}</code>
        </p>
      ) : null}

      {response.sources.length > 0 ? (
        <SourceCollection
          sources={response.sources}
          anchorPrefix={anchorPrefix}
          collapsed
        />
      ) : null}
      {showDiagnostics ? (
        <details className="rounded-xl border border-line bg-slate-950 text-slate-100">
          <summary className="cursor-pointer px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-slate-300">
            Development retrieval diagnostics
          </summary>
          <pre className="max-h-96 overflow-auto border-t border-slate-800 p-4 text-[0.7rem] leading-5">
            {diagnosticText(response.retrievalDebug)}
          </pre>
        </details>
      ) : null}
    </div>
  );
}
