import type { PaperDsrDimension } from "../shared/paper-presentation.ts";
import { MarkdownDocument } from "./MarkdownDocument.tsx";

export function PaperDsrGrid({
  dimensions,
  sourceFilePath,
}: {
  dimensions: readonly PaperDsrDimension[];
  sourceFilePath: string;
}) {
  return (
    <div className="grid items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3">
      {dimensions.map((dimension, index) => (
        <article
          key={dimension.key}
          className="h-full min-w-0 rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6"
        >
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue">
            {String(index + 1).padStart(2, "0")}
          </p>
          <h3 className="mt-3 font-serif text-xl font-semibold leading-snug text-ink">
            {dimension.title}
          </h3>
          <MarkdownDocument
            markdown={dimension.content}
            sourceFilePath={sourceFilePath}
            className="mt-3 [&_p]:my-0 [&_p]:text-sm [&_p]:leading-6"
          />
        </article>
      ))}
    </div>
  );
}
