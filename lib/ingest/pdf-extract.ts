import type { PdfExtractionResult } from "@/lib/ingest/parser-types";

export async function extractPdfText(file: File): Promise<PdfExtractionResult> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString();

  const data = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data }).promise;
  const pages = [];
  const extractionWarnings: string[] = [];

  for (let index = 1; index <= pdf.numPages; index += 1) {
    const page = await pdf.getPage(index);
    const content = await page.getTextContent();
    const text = textContentToLines(content.items as TextContentItem[]);
    if (!text) {
      extractionWarnings.push(`Page ${index} produced no text. Scanned PDFs may require OCR, which is not supported in V1.`);
    }
    pages.push({ pageNumber: index, text });
  }

  const fullText = pages.map((page) => page.text).join("\n\n");
  if (!fullText.trim()) {
    extractionWarnings.push("No selectable text was extracted. This PDF may be scanned; OCR is not supported in V1.");
  }

  return { pages, fullText, pageCount: pdf.numPages, extractionWarnings };
}

type TextContentItem = {
  str?: string;
  transform?: number[];
};

function textContentToLines(items: TextContentItem[]) {
  const positioned = items
    .map((item) => ({
      text: item.str?.replace(/\s+/g, " ").trim() ?? "",
      x: item.transform?.[4] ?? 0,
      y: Math.round(item.transform?.[5] ?? 0)
    }))
    .filter((item) => item.text);

  const rows = new Map<number, typeof positioned>();
  for (const item of positioned) {
    const existingY = Array.from(rows.keys()).find((y) => Math.abs(y - item.y) <= 2);
    const key = existingY ?? item.y;
    rows.set(key, [...(rows.get(key) ?? []), item]);
  }

  return Array.from(rows.entries())
    .sort(([a], [b]) => b - a)
    .map(([, row]) => row.sort((a, b) => a.x - b.x).map((item) => item.text).join(" ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}
