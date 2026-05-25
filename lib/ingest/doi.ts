import type { CrossrefMetadata, ExtractedMetadata, VerificationResult } from "@/lib/ingest/parser-types";
import { jaccardSimilarity, normalizeText, surname } from "@/lib/ingest/text-utils";

const doiRegex = /\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i;

export function extractDoiFromText(text: string): string | null {
  const match = text.match(doiRegex);
  return match ? normalizeDoi(match[0]) : null;
}

export function normalizeDoi(doi: string): string {
  return doi
    .trim()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/^doi:\s*/i, "")
    .replace(/[)\].,;]+$/g, "")
    .toLowerCase();
}

export async function fetchCrossrefMetadata(doi: string): Promise<CrossrefMetadata | null> {
  const normalized = normalizeDoi(doi);
  const response = await fetch(`https://api.crossref.org/works/${encodeURIComponent(normalized)}`);
  if (!response.ok) return null;
  const payload = await response.json() as {
    message?: {
      DOI?: string;
      title?: string[];
      author?: Array<{ given?: string; family?: string }>;
      published?: { "date-parts"?: number[][] };
      "published-print"?: { "date-parts"?: number[][] };
      "published-online"?: { "date-parts"?: number[][] };
      "container-title"?: string[];
      publisher?: string;
      URL?: string;
    };
  };
  const message = payload.message;
  if (!message?.DOI) return null;
  const dateParts = message.published?.["date-parts"] ?? message["published-print"]?.["date-parts"] ?? message["published-online"]?.["date-parts"];
  return {
    doi: normalizeDoi(message.DOI),
    title: message.title?.[0],
    authors: message.author?.map((author) => [author.given, author.family].filter(Boolean).join(" ")) ?? [],
    year: dateParts?.[0]?.[0],
    venue: message["container-title"]?.[0],
    publisher: message.publisher,
    url: message.URL
  };
}

export function compareMetadata(extracted: ExtractedMetadata, crossref: CrossrefMetadata | null): VerificationResult {
  const doi = extracted.doi ?? crossref?.doi;
  if (!doi) {
    return { status: "not-checked", message: "No DOI detected" };
  }
  if (!crossref) {
    return { status: "not-found", doi, message: "DOI not found in Crossref" };
  }

  const titleScore = extracted.title && crossref.title ? jaccardSimilarity(extracted.title, crossref.title) : undefined;
  const pdfSurnames = new Set(extracted.authors.map(surname).filter(Boolean));
  const crossrefSurnames = new Set(crossref.authors.map(surname).filter(Boolean));
  const matchedAuthors = Array.from(pdfSurnames).filter((name) => crossrefSurnames.has(name)).length;
  const authorScore = crossrefSurnames.size ? matchedAuthors / crossrefSurnames.size : undefined;
  const yearMatch = extracted.year && crossref.year ? extracted.year === crossref.year : undefined;

  if ((titleScore ?? 0) >= 0.85 && (authorScore ?? 0) >= 0.6) {
    return { status: "verified", doi, titleScore, authorScore, yearMatch, message: "DOI metadata verified", crossref };
  }
  if ((titleScore ?? 0) >= 0.7) {
    return { status: "likely-match", doi, titleScore, authorScore, yearMatch, message: "PDF metadata likely matches DOI", crossref };
  }
  if (extracted.title && (titleScore ?? 0) < 0.45) {
    return { status: "mismatch", doi, titleScore, authorScore, yearMatch, message: "DOI found, but metadata match is weak", crossref };
  }
  return {
    status: "partial-match",
    doi,
    titleScore,
    authorScore,
    yearMatch,
    message: `DOI found, but metadata extraction is limited${extracted.title ? ` (${normalizeText(extracted.title).slice(0, 48)})` : ""}`,
    crossref
  };
}
