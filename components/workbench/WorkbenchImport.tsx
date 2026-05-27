"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Eye, EyeOff, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { parseCsvFile, validateWorkbenchRows } from "@/lib/workbench/csv";
import type { CsvKind, WorkbenchValidation } from "@/lib/workbench/csv";

type ParsedRows = Record<CsvKind, Record<string, string>[]>;

const labels: Record<CsvKind, string> = {
  papers: "Papers CSV",
  elements: "Elements CSV",
  relations: "Relations CSV",
  evidence: "Evidence CSV"
};

export function WorkbenchImport() {
  const [files, setFiles] = useState<Partial<Record<CsvKind, File>>>({});
  const [rows, setRows] = useState<ParsedRows>();
  const [adminSecret, setAdminSecret] = useState("");
  const [validation, setValidation] = useState<WorkbenchValidation>();
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [result, setResult] = useState<{ tone: "success" | "error"; title: string; details?: string }>();
  const [working, setWorking] = useState<"idle" | "validating" | "importing">("idle");
  const [showAdminSecret, setShowAdminSecret] = useState(false);

  async function validate() {
    setWorking("validating");
    setResult(undefined);
    const nextErrors: string[] = [];
    const parsed: ParsedRows = { papers: [], elements: [], relations: [], evidence: [] };
    for (const kind of Object.keys(labels) as CsvKind[]) {
      const file = files[kind];
      if (!file) {
        nextErrors.push(`${labels[kind]} is required.`);
        continue;
      }
      const output = await parseCsvFile(file);
      parsed[kind] = output.rows;
      nextErrors.push(...output.errors.map((error) => `${labels[kind]}: ${error}`));
    }
    setRows(parsed);
    setParseErrors(nextErrors);
    setValidation(validateWorkbenchRows(parsed));
    setWorking("idle");
  }

  async function importRows() {
    if (!rows || !validation || validation.errors.length) return;
    setWorking("importing");
    setResult(undefined);
    const response = await fetch("/api/workbench/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminSecret,
        papersRows: rows.papers,
        elementsRows: rows.elements,
        relationsRows: rows.relations,
        evidenceRows: rows.evidence
      })
    });
    const json = await response.json();
    setWorking("idle");
    if (!response.ok) {
      setResult({ tone: "error", title: json.error ?? "Import failed.", details: formatImportDetails(json.details) });
      return;
    }
    setResult({
      tone: "success",
      title: "Import completed",
      details: `${json.paper_id}: ${json.rows_elements} elements, ${json.rows_relations} relations, ${json.rows_evidence} evidence rows.`
    });
  }

  const allErrors = [...parseErrors, ...(validation?.errors ?? [])];
  const isWorking = working !== "idle";

  return (
    <div>
      <div className="mb-6">
        <Link href="/workbench" className="text-sm text-muted hover:text-ink">Back to Workbench</Link>
        <h1 className="mt-3 font-serif text-4xl text-ink">Import Single Paper DSR Dataset</h1>
        <p className="mt-2 text-sm leading-6 text-muted">Upload CSVs exported from the Excel extraction template.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <Card className="p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {(Object.keys(labels) as CsvKind[]).map((kind) => (
              <label key={kind} className="block border border-line bg-paper p-4">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">{labels[kind]}</span>
                <input type="file" accept=".csv,text/csv" className="w-full text-sm" onChange={(event) => setFiles((current) => ({ ...current, [kind]: event.target.files?.[0] }))} />
              </label>
            ))}
          </div>
          <label className="mt-4 block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">Admin Secret</span>
            <span className="flex border border-line bg-white focus-within:border-blue">
              <input
                className="w-full bg-white px-3 py-2 text-sm outline-none"
                type={showAdminSecret ? "text" : "password"}
                value={adminSecret}
                onChange={(event) => setAdminSecret(event.target.value)}
              />
              <button
                type="button"
                aria-label={showAdminSecret ? "Hide admin secret" : "Show admin secret"}
                className="grid w-11 place-items-center border-l border-line text-muted hover:text-ink"
                onClick={() => setShowAdminSecret((current) => !current)}
              >
                {showAdminSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </span>
          </label>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button type="button" disabled={isWorking} onClick={validate}>
              <CheckCircle2 className="h-4 w-4" />
              {working === "validating" ? "Validating..." : "Validate"}
            </Button>
            <Button type="button" disabled={isWorking || !validation || allErrors.length > 0 || !adminSecret} onClick={importRows}>
              <UploadCloud className="h-4 w-4" />
              {working === "importing" ? "Importing..." : "Import"}
            </Button>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="font-serif text-2xl text-ink">Validation</h2>
          {validation && (
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              {Object.entries(validation.counts).map(([key, count]) => <div key={key} className="border border-line bg-paper p-3"><span className="block text-xs uppercase tracking-[0.12em] text-muted">{key}</span>{count} rows</div>)}
            </div>
          )}
          <MessageList title="Errors" items={allErrors} tone="error" />
          <MessageList title="Warnings" items={validation?.warnings ?? []} tone="warning" />
          {working === "importing" && <ResultBox tone="pending" title="Importing dataset" details="Writing paper, elements, evidence, relations, and import log to Supabase." />}
          {result && <ResultBox tone={result.tone} title={result.title} details={result.details} />}
        </Card>
      </div>
    </div>
  );
}

function formatImportDetails(details: unknown) {
  return Array.isArray(details)
    ? details.join(" ")
    : typeof details === "string"
      ? details
      : details
        ? JSON.stringify(details)
        : "";
}

function MessageList({ title, items, tone }: { title: string; items: string[]; tone: "error" | "warning" }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-ink"><AlertTriangle className="h-4 w-4" />{title}</h3>
      <ul className={tone === "error" ? "mt-2 space-y-1 text-sm text-red-700" : "mt-2 space-y-1 text-sm text-amber"}>
        {items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
      </ul>
    </div>
  );
}

function ResultBox({ tone, title, details }: { tone: "success" | "error" | "pending"; title: string; details?: string }) {
  const className = tone === "error"
    ? "border-red-200 bg-red-50 text-red-800"
    : tone === "success"
      ? "border-green-200 bg-green-50 text-green-900"
      : "border-line bg-paper text-muted";
  return (
    <div className={`mt-4 max-w-full border p-3 text-sm ${className}`}>
      <div className="font-semibold text-ink">{title}</div>
      {details && <div className="mt-1 break-words leading-6">{details}</div>}
    </div>
  );
}
