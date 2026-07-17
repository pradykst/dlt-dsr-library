import "server-only";

import matter from "gray-matter";

import type { OkfFatalErrorCode, OkfFrontmatter } from "./types.ts";

type FrontmatterErrorCode = Extract<
  OkfFatalErrorCode,
  "missing-frontmatter" | "malformed-yaml" | "empty-type"
>;

export class OkfFrontmatterError extends Error {
  readonly code: FrontmatterErrorCode;
  readonly filePath?: string;
  readonly cause?: unknown;

  constructor(
    code: FrontmatterErrorCode,
    message: string,
    filePath?: string,
    cause?: unknown,
  ) {
    super(message);
    this.name = "OkfFrontmatterError";
    this.code = code;
    this.filePath = filePath;
    this.cause = cause;
  }
}

export interface ParsedOkfFrontmatter {
  frontmatter: OkfFrontmatter;
  markdownBody: string;
  hasFrontmatter: true;
}

export interface ParsedOptionalFrontmatter {
  frontmatter: Record<string, unknown>;
  markdownBody: string;
  hasFrontmatter: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sourceForParsing(rawMarkdown: string): string {
  return rawMarkdown.charCodeAt(0) === 0xfeff
    ? rawMarkdown.slice(1)
    : rawMarkdown;
}

function hasClosingFrontmatterDelimiter(rawMarkdown: string): boolean {
  const source = sourceForParsing(rawMarkdown);
  const openingLineEnd = source.indexOf("\n");
  if (openingLineEnd === -1) {
    return false;
  }

  return /(?:^|\n)---[\t ]*(?:\r?\n|$)/u.test(source.slice(openingLineEnd + 1));
}

export function hasYamlFrontmatter(rawMarkdown: string): boolean {
  return /^\uFEFF?---[\t ]*(?:\r?\n|$)/u.test(rawMarkdown);
}

function parseMatter(
  rawMarkdown: string,
  filePath?: string,
): ParsedOptionalFrontmatter {
  if (!hasYamlFrontmatter(rawMarkdown)) {
    return {
      frontmatter: {},
      markdownBody: rawMarkdown,
      hasFrontmatter: false,
    };
  }

  if (!hasClosingFrontmatterDelimiter(rawMarkdown)) {
    throw new OkfFrontmatterError(
      "malformed-yaml",
      `YAML frontmatter has no closing delimiter${filePath ? ` in ${filePath}` : ""}.`,
      filePath,
    );
  }

  try {
    const parsed = matter(sourceForParsing(rawMarkdown));

    return {
      frontmatter: isRecord(parsed.data) ? parsed.data : {},
      markdownBody: parsed.content,
      hasFrontmatter: true,
    };
  } catch (error) {
    if (error instanceof OkfFrontmatterError) {
      throw error;
    }

    throw new OkfFrontmatterError(
      "malformed-yaml",
      `Malformed YAML frontmatter${filePath ? ` in ${filePath}` : ""}.`,
      filePath,
      error,
    );
  }
}

/**
 * Parse a concept document. Concept frontmatter and a non-empty string `type`
 * are the only schema requirements imposed here.
 */
export function parseOkfFrontmatter(
  rawMarkdown: string,
  filePath?: string,
): ParsedOkfFrontmatter {
  const parsed = parseMatter(rawMarkdown, filePath);
  if (!parsed.hasFrontmatter) {
    throw new OkfFrontmatterError(
      "missing-frontmatter",
      `Concept document is missing YAML frontmatter${
        filePath ? `: ${filePath}` : "."
      }`,
      filePath,
    );
  }

  const rawType = parsed.frontmatter.type;
  if (typeof rawType !== "string" || !rawType.trim()) {
    throw new OkfFrontmatterError(
      "empty-type",
      `Concept document has an empty or non-string type${
        filePath ? `: ${filePath}` : "."
      }`,
      filePath,
    );
  }

  return {
    frontmatter: {
      ...parsed.frontmatter,
      type: rawType.trim(),
    },
    markdownBody: parsed.markdownBody,
    hasFrontmatter: true,
  };
}

/** Parse a reserved document, where frontmatter and `type` are optional. */
export function parseOptionalFrontmatter(
  rawMarkdown: string,
  filePath?: string,
): ParsedOptionalFrontmatter {
  return parseMatter(rawMarkdown, filePath);
}
