import type { DsrField, PaperSection, PdfPageText } from "@/lib/ingest/parser-types";

export function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

export function tokenSet(value?: string) {
  return new Set(normalizeText(value ?? "").split(" ").filter((token) => token.length > 2));
}

export function jaccardSimilarity(a?: string, b?: string) {
  const left = tokenSet(a);
  const right = tokenSet(b);
  if (!left.size || !right.size) return 0;
  const intersection = Array.from(left).filter((token) => right.has(token)).length;
  const union = new Set([...Array.from(left), ...Array.from(right)]).size;
  return intersection / union;
}

export function surname(value: string) {
  const clean = normalizeText(value);
  const parts = clean.split(" ").filter(Boolean);
  return parts.at(-1) ?? clean;
}

export function linesOf(text: string) {
  return text.split(/\r?\n/).map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean);
}

export function sentencesOf(text: string) {
  return text.replace(/\s+/g, " ").split(/(?<=[.!?])\s+(?=[A-Z0-9])/).map((item) => item.trim()).filter((item) => item.length > 30);
}

export function wordSlice(text: string, count: number) {
  return text.split(/\s+/).filter(Boolean).slice(0, count).join(" ");
}

export function confidenceBadge(value: number) {
  if (value >= 0.75) return "high";
  if (value >= 0.55) return "medium";
  return "low";
}

export function findPageForQuote(pages: PdfPageText[], quote: string) {
  const needle = normalizeText(wordSlice(quote, 12));
  return pages.find((page) => normalizeText(page.text).includes(needle))?.pageNumber;
}

export function fieldFromQuote(args: {
  id: string;
  label: string;
  quote: string;
  pages: PdfPageText[];
  section?: string;
  confidence: number;
  rule: string;
}): DsrField {
  return {
    id: args.id,
    label: args.label,
    synthesizedText: args.label,
    sourceQuote: wordSlice(args.quote, 70),
    pageNumber: findPageForQuote(args.pages, args.quote),
    section: args.section,
    confidence: Math.max(0.1, Math.min(0.95, args.confidence)),
    extractionRule: args.rule
  };
}

const commonHeadings = [
  "introduction", "background", "related work", "theoretical background", "methodology", "research methodology",
  "method", "design science research", "problem identification", "objectives", "requirements", "design requirements",
  "meta requirements", "design principles", "design features", "artifact", "design and development", "demonstration",
  "evaluation", "discussion", "contributions", "limitations", "conclusion"
];

function isHeading(line: string) {
  const normalized = normalizeText(line);
  if (normalized.length < 4 || normalized.length > 90) return false;
  if (/^\d+(\.\d+)*\s+[A-Z][A-Za-z -]{2,}$/.test(line)) return true;
  if (commonHeadings.some((heading) => normalized === heading || normalized.endsWith(` ${heading}`))) return true;
  const words = line.split(/\s+/);
  const titleCaseWords = words.filter((word) => /^[A-Z][a-z-]+$/.test(word)).length;
  return words.length <= 6 && titleCaseWords >= Math.max(1, words.length - 1);
}

export function detectSections(pages: PdfPageText[]): PaperSection[] {
  const sections: PaperSection[] = [];
  let current: PaperSection = { title: "Front matter", normalizedTitle: "front matter", text: "", startPage: 1 };

  for (const page of pages) {
    for (const line of linesOf(page.text)) {
      if (isHeading(line)) {
        current.endPage = page.pageNumber;
        if (current.text.trim()) sections.push(current);
        current = {
          title: line.replace(/^\d+(\.\d+)*\s*/, ""),
          normalizedTitle: normalizeText(line.replace(/^\d+(\.\d+)*\s*/, "")),
          text: "",
          startPage: page.pageNumber
        };
      } else {
        current.text += `${line}\n`;
      }
    }
  }
  if (current.text.trim()) {
    current.endPage = pages.at(-1)?.pageNumber;
    sections.push(current);
  }
  return sections;
}

export function sectionsMatching(sections: PaperSection[], terms: string[]) {
  return sections.filter((section) => terms.some((term) => section.normalizedTitle.includes(term)));
}

export function topSentences(text: string, keywords: string[], limit = 3) {
  const normalizedKeywords = keywords.map(normalizeText);
  return sentencesOf(text)
    .map((sentence) => ({
      sentence,
      score: normalizedKeywords.reduce((score, keyword) => score + (normalizeText(sentence).includes(keyword) ? 1 : 0), 0)
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || b.sentence.length - a.sentence.length)
    .slice(0, limit)
    .map((item) => item.sentence);
}

export function uniqueByLabel(fields: DsrField[], limit = 4) {
  const seen = new Set<string>();
  return fields.filter((field) => {
    const key = normalizeText(field.label).slice(0, 80);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, limit);
}
