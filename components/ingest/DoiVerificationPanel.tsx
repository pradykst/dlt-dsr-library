import { Badge } from "@/components/ui/Badge";
import type { ExtractedMetadata, VerificationResult } from "@/lib/ingest/parser-types";

const statusTone: Record<VerificationResult["status"], string> = {
  verified: "border-green/30 bg-green/10 text-green",
  "likely-match": "border-blue/30 bg-blue/10 text-blue",
  "partial-match": "border-amber/30 bg-amber/10 text-amber",
  "not-found": "border-amber/30 bg-amber/10 text-amber",
  "not-checked": "border-line bg-paper text-muted",
  mismatch: "border-red-300 bg-red-50 text-red-700"
};

export function DoiVerificationPanel({ metadata, verification, confidence }: { metadata?: ExtractedMetadata; verification?: VerificationResult; confidence?: number }) {
  return (
    <section className="border border-line bg-white p-5 shadow-research">
      <h2 className="font-serif text-xl text-ink">Scholarly Metadata Check</h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Metadata verification checks whether the detected DOI exists and whether registered DOI metadata appears to match the uploaded PDF. It does not judge scientific quality.
      </p>
      <div className="mt-4">
        {verification ? (
          <Badge className={statusTone[verification.status]}>{verification.status.replace("-", " ")}</Badge>
        ) : (
          <Badge>not run</Badge>
        )}
      </div>
      <p className="mt-3 text-sm text-ink">{verification?.message ?? "Upload a PDF and run extraction to check DOI metadata."}</p>
      <div className="mt-5 space-y-2 text-sm text-muted">
        <div><span className="font-medium text-ink">Detected DOI:</span> {metadata?.doi ?? verification?.doi ?? "none"}</div>
        <div><span className="font-medium text-ink">Title score:</span> {verification?.titleScore !== undefined ? verification.titleScore.toFixed(2) : "n/a"}</div>
        <div><span className="font-medium text-ink">Author score:</span> {verification?.authorScore !== undefined ? verification.authorScore.toFixed(2) : "n/a"}</div>
        <div><span className="font-medium text-ink">Year match:</span> {verification?.yearMatch === undefined ? "n/a" : verification.yearMatch ? "yes" : "no"}</div>
        <div><span className="font-medium text-ink">Parser confidence:</span> {confidence !== undefined ? `${Math.round(confidence * 100)}%` : "n/a"}</div>
      </div>
    </section>
  );
}
