"use client";

import { FileText } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function PdfUploadPanel({
  file,
  doi,
  isProcessing,
  onFileChange,
  onDoiChange,
  onExtract
}: {
  file?: File;
  doi: string;
  isProcessing: boolean;
  onFileChange: (file?: File) => void;
  onDoiChange: (doi: string) => void;
  onExtract: () => void;
}) {
  return (
    <section className="border border-line bg-white p-5 shadow-research">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-blue" />
        <h2 className="font-serif text-xl text-ink">Upload and Parse</h2>
      </div>
      <label className="mt-5 block border border-dashed border-line bg-paper p-5 text-sm text-muted transition hover:border-blue">
        <span className="block font-medium text-ink">PDF file</span>
        <span className="mt-1 block text-xs leading-5">The PDF is parsed locally in your browser. V1 does not upload the file externally.</span>
        <input
          className="mt-4 block w-full text-sm"
          type="file"
          accept="application/pdf"
          onChange={(event) => onFileChange(event.target.files?.[0])}
        />
      </label>
      {file && <p className="mt-3 text-xs text-muted">Selected: {file.name} ({Math.round(file.size / 1024)} KB)</p>}
      <label className="mt-5 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
        DOI optional
        <Input className="mt-2" value={doi} onChange={(event) => onDoiChange(event.target.value)} placeholder="10.xxxx/example-doi" />
      </label>
      <Button className="mt-5 w-full" disabled={!file || isProcessing} onClick={onExtract}>
        {isProcessing ? "Extracting and verifying..." : "Extract and verify"}
      </Button>
      <p className="mt-4 border-l border-line pl-3 text-xs leading-5 text-muted">This V1 only previews extraction. It does not add the paper to the shared library.</p>
    </section>
  );
}
