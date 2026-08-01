import type { JsonObject } from "./types.ts";

export const PAPER_DSR_DIMENSIONS = [
  { key: "problem-description", title: "Problem description" },
  { key: "input-knowledge", title: "Input knowledge" },
  { key: "research-process", title: "Research process" },
  { key: "key-concepts", title: "Key concepts" },
  { key: "solution-description", title: "Solution description" },
  { key: "output-knowledge", title: "Output knowledge" },
] as const;

export const MISSING_DSR_DIMENSION_COPY =
  "Not currently represented in this library record.";

export interface PaperDsrDimension {
  key: (typeof PAPER_DSR_DIMENSIONS)[number]["key"];
  title: (typeof PAPER_DSR_DIMENSIONS)[number]["title"];
  content: string;
  represented: boolean;
}

export interface PaperPresentation {
  narrativeMarkdown: string;
  dsrDimensions: PaperDsrDimension[];
}

interface MarkdownSection {
  start: number;
  end: number;
  lines: string[];
}

function normalizedHeading(value: string): string {
  return value
    .replace(/[*_`]/gu, "")
    .replace(/\s+#+\s*$/u, "")
    .trim()
    .toLocaleLowerCase("en");
}

function markdownSection(
  lines: readonly string[],
  title: string,
): MarkdownSection | null {
  const target = title.toLocaleLowerCase("en");
  const start = lines.findIndex((line) => {
    const heading = line.match(/^(#{1,6})\s+(.+?)\s*$/u);
    return heading?.[1]?.length === 2 && normalizedHeading(heading[2] ?? "") === target;
  });
  if (start < 0) return null;

  const relativeEnd = lines.slice(start + 1).findIndex((line) => {
    const heading = line.match(/^(#{1,6})\s+/u);
    return Boolean(heading?.[1] && heading[1].length <= 2);
  });
  const end = relativeEnd < 0 ? lines.length : start + 1 + relativeEnd;
  return { start, end, lines: lines.slice(start + 1, end) };
}

function escapedRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function dimensionContent(
  sectionLines: readonly string[],
  title: string,
): string | null {
  const itemPattern = new RegExp(
    `^\\s*[-*+]\\s+\\*\\*${escapedRegExp(title)}[.:]?\\*\\*\\s*(.*)$`,
    "iu",
  );
  const start = sectionLines.findIndex((line) => itemPattern.test(line));
  if (start < 0) return null;

  const firstLine = sectionLines[start]?.match(itemPattern)?.[1]?.trim() ?? "";
  const continuation: string[] = [];
  for (let index = start + 1; index < sectionLines.length; index += 1) {
    const line = sectionLines[index] ?? "";
    if (/^\s{2,}\S/u.test(line)) {
      continuation.push(line.trim());
      continue;
    }
    break;
  }
  const content = [firstLine, ...continuation].filter(Boolean).join("\n").trim();
  return content || null;
}

export function buildPaperPresentation(markdownBody: string): PaperPresentation {
  const lines = markdownBody.split(/\r?\n/u);
  const dsrSection = markdownSection(lines, "DSR grid");
  const designKnowledgeSection = markdownSection(lines, "Design knowledge");
  const removedRanges = [dsrSection, designKnowledgeSection].filter(
    (section): section is MarkdownSection => section !== null,
  );
  const narrativeMarkdown = lines
    .filter(
      (_line, index) =>
        !removedRanges.some((section) => index >= section.start && index < section.end),
    )
    .join("\n")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();

  return {
    narrativeMarkdown,
    dsrDimensions: PAPER_DSR_DIMENSIONS.map((dimension) => {
      const content = dsrSection
        ? dimensionContent(dsrSection.lines, dimension.title)
        : null;
      return {
        ...dimension,
        content: content ?? MISSING_DSR_DIMENSION_COPY,
        represented: content !== null,
      };
    }),
  };
}

const TECHNICAL_PAPER_METADATA_KEYS = new Set([
  "absolutepath",
  "bundlepath",
  "filepath",
  "localpath",
  "modified",
  "modifiedat",
  "modificationtimestamp",
  "path",
  "rootpath",
  "timestamp",
]);

export function publicPaperFrontmatter(frontmatter: JsonObject): JsonObject {
  return Object.fromEntries(
    Object.entries(frontmatter).filter(([key]) => {
      const normalized = key.replace(/[^a-z0-9]/giu, "").toLocaleLowerCase("en");
      return !TECHNICAL_PAPER_METADATA_KEYS.has(normalized);
    }),
  );
}
