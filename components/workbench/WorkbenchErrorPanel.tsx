"use client";

import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { workbenchErrorDetails } from "@/lib/workbench/client";

export function WorkbenchErrorPanel({ error }: { error: unknown }) {
  const details = workbenchErrorDetails(error);
  return (
    <Card className="border-red-200 bg-red-50/40 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
        <div className="min-w-0">
          <h2 className="font-serif text-xl text-ink">Workbench could not load this view</h2>
          <p className="mt-2 text-sm leading-6 text-red-800">{details.message}</p>
          <dl className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
            <Detail label="Route" value={details.route} />
            <Detail label="Status" value={details.status ? `${details.status} ${details.statusText}`.trim() : details.statusText} />
            <Detail label="Error code" value={details.code} />
            <Detail label="Content type" value={details.contentType} />
          </dl>
          {details.bodyPreview && (
            <div className="mt-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">Response preview</div>
              <pre className="mt-1 max-h-28 overflow-auto whitespace-pre-wrap break-words border border-red-200 bg-white p-3 text-xs text-ink">{details.bodyPreview}</pre>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt className="font-semibold uppercase tracking-[0.1em] text-muted">{label}</dt><dd className="mt-1 break-words text-ink">{value}</dd></div>;
}
