import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  isSafeExternalHref,
  resolveOkfMarkdownHref,
} from "../shared/links.ts";

export interface MarkdownDocumentProps {
  markdown: string;
  sourceFilePath: string;
  className?: string;
}

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="mb-5 mt-10 font-serif text-3xl font-semibold leading-tight text-ink first:mt-0">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-3 mt-9 border-b border-line pb-2 font-serif text-2xl font-semibold leading-tight text-ink first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-7 font-serif text-xl font-semibold leading-snug text-ink">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="mb-2 mt-6 text-base font-bold leading-6 text-ink">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="my-4 text-[0.97rem] leading-7 text-slate-700">{children}</p>
  ),
  a: ({ children, href, title, className }) => {
    if (!href) {
      return <span className="text-slate-700">{children}</span>;
    }

    const linkClassName = `font-medium text-blue underline decoration-blue/30 underline-offset-4 transition-colors hover:text-ink hover:decoration-ink ${
      className ?? ""
    }`;
    if (isSafeExternalHref(href)) {
      return (
        <a
          className={linkClassName}
          href={href}
          rel="noopener noreferrer"
          target="_blank"
          title={title}
        >
          {children}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      );
    }
    if (href.startsWith("#") || href.startsWith("?")) {
      return (
        <a className={linkClassName} href={href} title={title}>
          {children}
        </a>
      );
    }

    return (
      <Link className={linkClassName} href={href} title={title}>
        {children}
      </Link>
    );
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
    <blockquote className="my-6 border-l-4 border-blue/40 bg-blue/5 px-5 py-1 italic text-slate-700">
      {children}
    </blockquote>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-ink">{children}</strong>
  ),
  hr: () => <hr className="my-8 border-line" />,
  pre: ({ children }) => (
    <pre className="my-6 overflow-x-auto rounded-xl bg-ink p-4 text-sm leading-6 text-slate-100">
      {children}
    </pre>
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
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto rounded-xl border border-line">
      <table className="w-full border-collapse text-left text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-slate-100 text-ink">{children}</thead>
  ),
  th: ({ children }) => (
    <th className="border-b border-line px-4 py-3 font-semibold">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border-b border-line px-4 py-3 align-top text-slate-700 last:border-b-0">
      {children}
    </td>
  ),
  img: () => null,
};

export function MarkdownDocument({
  markdown,
  sourceFilePath,
  className = "",
}: MarkdownDocumentProps) {
  return (
    <article className={`min-w-0 ${className}`}>
      <ReactMarkdown
        components={markdownComponents}
        remarkPlugins={[remarkGfm]}
        skipHtml
        urlTransform={(url, key) => {
          if (key !== "href") {
            return "";
          }
          return resolveOkfMarkdownHref(url, sourceFilePath)?.href ?? "";
        }}
      >
        {markdown}
      </ReactMarkdown>
    </article>
  );
}
