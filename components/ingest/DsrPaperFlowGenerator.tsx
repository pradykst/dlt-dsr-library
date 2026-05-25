"use client";

import { useMemo, useState } from "react";
import { Download, Clipboard, Check } from "lucide-react";
import { DoiVerificationPanel } from "@/components/ingest/DoiVerificationPanel";
import { DsrGridPreview } from "@/components/ingest/DsrGridPreview";
import { ExtractedEvidencePanel } from "@/components/ingest/ExtractedEvidencePanel";
import { ExtractionSummary } from "@/components/ingest/ExtractionSummary";
import { IngestSankeyFlow } from "@/components/ingest/IngestSankeyFlow";
import { ParserDiagnostics } from "@/components/ingest/ParserDiagnostics";
import { PdfUploadPanel } from "@/components/ingest/PdfUploadPanel";
import { Button } from "@/components/ui/Button";
import { compareMetadata, fetchCrossrefMetadata, normalizeDoi } from "@/lib/ingest/doi";
import { parseDsrPaper } from "@/lib/ingest/deterministic-dsr-parser";
import { extractPdfText } from "@/lib/ingest/pdf-extract";
import type { DsrField, DsrParseResult, GeneratedIngestJson, PdfExtractionResult, VerificationResult } from "@/lib/ingest/parser-types";

const defaultVerification: VerificationResult = { status: "not-checked", message: "No DOI detected" };

export function DsrPaperFlowGenerator() {
  const [file, setFile] = useState<File | undefined>();
  const [doi, setDoi] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string>();
  const [error, setError] = useState<string>();
  const [extraction, setExtraction] = useState<PdfExtractionResult>();
  const [parseResult, setParseResult] = useState<DsrParseResult>();
  const [verification, setVerification] = useState<VerificationResult>();
  const [selectedField, setSelectedField] = useState<DsrField>();
  const [copied, setCopied] = useState(false);

  const exportJson = useMemo<GeneratedIngestJson | undefined>(() => {
    if (!parseResult) return undefined;
    return {
      metadata: parseResult.metadata,
      verification: verification ?? defaultVerification,
      dsrGrid: parseResult.dsrGrid,
      designFlow: parseResult.designFlow,
      diagnostics: parseResult.diagnostics,
      generatedAt: new Date().toISOString()
    };
  }, [parseResult, verification]);

  const runExtraction = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(undefined);
    setSelectedField(undefined);
    try {
      setStatus("Extracting PDF text locally...");
      const extracted = await extractPdfText(file);
      setExtraction(extracted);
      setStatus("Running deterministic DSR parser...");
      const parsed = parseDsrPaper(extracted);
      const detectedDoi = doi.trim() ? normalizeDoi(doi) : parsed.metadata.doi;
      const metadata = { ...parsed.metadata, doi: detectedDoi };
      const parseWithDoi = { ...parsed, metadata };
      setParseResult(parseWithDoi);

      if (detectedDoi) {
        setStatus("Checking DOI metadata in Crossref...");
        const crossref = await fetchCrossrefMetadata(detectedDoi);
        setVerification(compareMetadata(metadata, crossref));
      } else {
        setVerification(defaultVerification);
      }
      setStatus("Extraction complete.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Extraction failed.");
      setStatus(undefined);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyJson = async () => {
    if (!exportJson) return;
    await navigator.clipboard.writeText(JSON.stringify(exportJson, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const downloadJson = () => {
    if (!exportJson) return;
    const blob = new Blob([JSON.stringify(exportJson, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `${parseResult?.metadata.doi?.replace(/[^\w.-]+/g, "_") || "dsr-paper-flow"}.json`;
    link.click();
    URL.revokeObjectURL(href);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-5 lg:grid-cols-[390px_1fr]">
        <div className="space-y-5">
          <PdfUploadPanel file={file} doi={doi} isProcessing={isProcessing} onFileChange={setFile} onDoiChange={setDoi} onExtract={runExtraction} />
          {status && <div className="border border-line bg-paper px-4 py-3 text-sm text-muted">{status}</div>}
          {error && <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        </div>
        <div className="space-y-5">
          <DoiVerificationPanel metadata={parseResult?.metadata} verification={verification} confidence={parseResult?.overallConfidence} />
          <ExtractionSummary extraction={extraction} metadata={parseResult?.metadata} />
        </div>
      </div>

      {exportJson && (
        <div className="flex flex-wrap justify-end gap-2">
          <Button onClick={copyJson}>{copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />} Copy generated JSON</Button>
          <Button onClick={downloadJson}><Download className="h-4 w-4" /> Download generated JSON</Button>
        </div>
      )}

      <DsrGridPreview grid={parseResult?.dsrGrid} selectedId={selectedField?.id} onSelect={setSelectedField} />
      <IngestSankeyFlow flow={parseResult?.designFlow} selectedId={selectedField?.id} onSelect={setSelectedField} />
      <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
        <ExtractedEvidencePanel field={selectedField} />
        <ParserDiagnostics extraction={extraction} parseResult={parseResult} verification={verification} />
      </div>
    </div>
  );
}
