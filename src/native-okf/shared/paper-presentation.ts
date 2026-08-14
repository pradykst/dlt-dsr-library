import type { JsonObject, LinkedConceptGroupDto } from "./types.ts";

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

function equivalentSectionLabel(heading: string, typeLabel: string): boolean {
  const normalize = (value: string) => normalizedHeading(value)
    .replace(/[-_/]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
  const normalizedType = normalize(typeLabel);
  const normalizedSection = normalize(heading);
  return normalizedSection === normalizedType || normalizedSection === `${normalizedType}s`;
}

function linkedConceptInventorySection(
  lines: readonly string[],
  group: LinkedConceptGroupDto,
): MarkdownSection | null {
  const candidates = lines.flatMap((_line, index) => {
    const heading = lines[index]?.match(/^(##)\s+(.+?)\s*$/u);
    if (!heading || !equivalentSectionLabel(heading[2] ?? "", group.typeLabel)) {
      return [];
    }
    const relativeEnd = lines.slice(index + 1).findIndex((line) => /^#{1,2}\s+/u.test(line));
    const end = relativeEnd < 0 ? lines.length : index + 1 + relativeEnd;
    return [{ start: index, end, lines: lines.slice(index + 1, end) }];
  });
  const canonicalPaths = group.concepts.map((concept) => concept.filePath.replace(/\\/gu, "/"));
  return candidates.find((section) => {
    const destinations = section.lines
      .flatMap((line) => [...line.matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/gu)])
      .map((match) => (match[1] ?? "").split(/[?#]/u, 1)[0]?.replace(/\\/gu, "/") ?? "");
    return destinations.some((destination) =>
      canonicalPaths.some((path) => destination === path || destination.endsWith(`/${path}`))
    );
  }) ?? null;
}

function redundantPaperHeader(lines: readonly string[]): MarkdownSection | null {
  const start = lines.findIndex((line) => /^#\s+\S/u.test(line));
  if (start < 0) return null;
  const relativeEnd = lines.slice(start + 1).findIndex((line) => /^##\s+/u.test(line));
  if (relativeEnd < 0) return null;
  const end = start + 1 + relativeEnd;
  const preamble = lines.slice(start + 1, end).join("\n");
  if (!/^\s*\*\*Authors?:\*\*/imu.test(preamble)) return null;
  return { start, end, lines: lines.slice(start + 1, end) };
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

export function buildPaperPresentation(
  markdownBody: string,
  linkedGroups: readonly LinkedConceptGroupDto[] = [],
): PaperPresentation {
  const lines = markdownBody.split(/\r?\n/u);
  const dsrSection = markdownSection(lines, "DSR grid");
  const designKnowledgeSection = markdownSection(lines, "Design knowledge");
  const paperHeader = redundantPaperHeader(lines);
  const linkedInventorySections = linkedGroups
    .map((group) => linkedConceptInventorySection(lines, group))
    .filter((section): section is MarkdownSection => section !== null);
  const removedRanges = [
    paperHeader,
    dsrSection,
    designKnowledgeSection,
    ...linkedInventorySections,
  ].filter(
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
