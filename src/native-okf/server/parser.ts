import "server-only";

import { readFile, stat } from "node:fs/promises";
import { TextDecoder } from "node:util";

import fastGlob from "fast-glob";

import { parseOkfFrontmatter, parseOptionalFrontmatter } from "./frontmatter.ts";
import { buildOkfBundle } from "./graph.ts";
import { parseOkfMarkdown } from "./markdown.ts";
import {
  conceptIdFromFilePath,
  isReservedMarkdownPath,
  normalizeBundleRelativePath,
  OkfPathError,
  resolveOkfBundleRoot,
  resolvePathWithinBundle,
} from "./paths.ts";
import type {
  LoadOkfBundleOptions,
  OkfBundle,
  OkfConcept,
  OkfFrontmatter,
  OkfReservedDocument,
  OkfValidationIssue,
} from "./types.ts";
import { OkfFrontmatterError } from "./frontmatter.ts";

const UTF8_DECODER = new TextDecoder("utf-8", { fatal: true });

function compareStrings(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function fatalIssue(
  code: OkfValidationIssue["code"],
  message: string,
  filePath?: string,
  details: Pick<OkfValidationIssue, "sourceId" | "rawTarget"> = {},
): OkfValidationIssue {
  return {
    severity: "fatal",
    code,
    message,
    ...(filePath === undefined ? {} : { filePath }),
    ...details,
  };
}

async function readUtf8Markdown(
  absolutePath: string,
  filePath: string,
  fatalErrors: OkfValidationIssue[],
): Promise<string | undefined> {
  let bytes: Uint8Array;
  try {
    bytes = await readFile(absolutePath);
  } catch (error) {
    const detail = error instanceof Error ? ` ${error.message}` : "";
    fatalErrors.push(
      fatalIssue(
        "unreadable-file",
        `Unable to read Markdown file "${filePath}".${detail}`,
        filePath,
      ),
    );
    return undefined;
  }

  try {
    return UTF8_DECODER.decode(bytes);
  } catch {
    fatalErrors.push(
      fatalIssue(
        "invalid-utf8",
        `Markdown file is not valid UTF-8: "${filePath}".`,
        filePath,
      ),
    );
    return undefined;
  }
}

function frontmatterString(
  frontmatter: OkfFrontmatter,
  field: string,
): string | undefined {
  const value = frontmatter[field];
  return typeof value === "string" ? value : undefined;
}

function frontmatterTags(frontmatter: OkfFrontmatter): string[] | undefined {
  const value = frontmatter.tags;
  return Array.isArray(value) && value.every((tag) => typeof tag === "string")
    ? [...value]
    : undefined;
}

function recordParsingError(
  error: unknown,
  filePath: string,
  fatalErrors: OkfValidationIssue[],
  sourceId?: string,
): void {
  if (error instanceof OkfFrontmatterError) {
    fatalErrors.push(
      fatalIssue(error.code, error.message, filePath, { sourceId }),
    );
    return;
  }

  if (error instanceof OkfPathError) {
    fatalErrors.push(
      fatalIssue("path-escape", error.message, filePath, {
        sourceId,
        rawTarget: error.inputPath,
      }),
    );
    return;
  }

  const message = error instanceof Error ? error.message : String(error);
  fatalErrors.push(
    fatalIssue(
      "unreadable-file",
      `Unable to parse Markdown file "${filePath}": ${message}`,
      filePath,
      { sourceId },
    ),
  );
}

async function discoverMarkdownFiles(
  rootPath: string,
  fatalErrors: OkfValidationIssue[],
): Promise<string[]> {
  try {
    const rootStat = await stat(rootPath);
    if (!rootStat.isDirectory()) {
      fatalErrors.push(
        fatalIssue(
          "unreadable-file",
          `OKF bundle root is not a directory: "${rootPath}".`,
          ".",
        ),
      );
      return [];
    }

    const files = await fastGlob("**/*.md", {
      cwd: rootPath,
      absolute: false,
      onlyFiles: true,
      unique: true,
      dot: true,
      followSymbolicLinks: false,
      suppressErrors: false,
    });

    return files
      .map((filePath) => normalizeBundleRelativePath(filePath))
      .sort(compareStrings);
  } catch (error) {
    const detail = error instanceof Error ? ` ${error.message}` : "";
    fatalErrors.push(
      fatalIssue(
        "unreadable-file",
        `Unable to enumerate OKF bundle root "${rootPath}".${detail}`,
        ".",
      ),
    );
    return [];
  }
}

export async function parseOkfBundle(
  options: LoadOkfBundleOptions = {},
): Promise<OkfBundle> {
  const rootPath = resolveOkfBundleRoot(options);
  const fatalErrors: OkfValidationIssue[] = [];
  const warnings: OkfValidationIssue[] = [];
  const filePaths = await discoverMarkdownFiles(rootPath, fatalErrors);
  const concepts: OkfConcept[] = [];
  const reservedDocuments: OkfReservedDocument[] = [];
  const conceptFilesById = new Map<string, string>();
  let okfVersion: string | undefined;

  for (const filePath of filePaths) {
    let absolutePath: string;
    try {
      absolutePath = resolvePathWithinBundle(rootPath, filePath);
    } catch (error) {
      recordParsingError(error, filePath, fatalErrors);
      continue;
    }

    const rawMarkdown = await readUtf8Markdown(
      absolutePath,
      filePath,
      fatalErrors,
    );
    if (rawMarkdown === undefined) continue;

    if (isReservedMarkdownPath(filePath)) {
      try {
        const parsed = parseOptionalFrontmatter(rawMarkdown, filePath);
        const markdown = parseOkfMarkdown(parsed.markdownBody, {
          sourceId: filePath.replace(/\.md$/u, ""),
          sourceFilePath: filePath,
        });
        const document: OkfReservedDocument = {
          filePath,
          absolutePath,
          frontmatter: parsed.frontmatter,
          rawMarkdown,
          markdownBody: parsed.markdownBody,
          headings: markdown.headings,
        };
        reservedDocuments.push(document);

        if (filePath === "index.md") {
          const declaredVersion = parsed.frontmatter.okf_version;
          if (typeof declaredVersion === "string") {
            okfVersion = declaredVersion;
          }
        }
      } catch (error) {
        recordParsingError(error, filePath, fatalErrors);
      }
      continue;
    }

    let conceptId: string;
    try {
      conceptId = conceptIdFromFilePath(filePath);
    } catch (error) {
      recordParsingError(error, filePath, fatalErrors);
      continue;
    }

    const existingFile = conceptFilesById.get(conceptId);
    if (existingFile !== undefined) {
      fatalErrors.push(
        fatalIssue(
          "duplicate-concept-id",
          `Duplicate normalized concept ID "${conceptId}" in "${existingFile}" and "${filePath}".`,
          filePath,
          { sourceId: conceptId },
        ),
      );
      continue;
    }
    conceptFilesById.set(conceptId, filePath);

    try {
      const parsed = parseOkfFrontmatter(rawMarkdown, filePath);
      const markdown = parseOkfMarkdown(parsed.markdownBody, {
        sourceId: conceptId,
        sourceFilePath: filePath,
      });
      const frontmatter = parsed.frontmatter;
      concepts.push({
        id: conceptId,
        filePath,
        absolutePath,
        type: frontmatter.type,
        title: frontmatterString(frontmatter, "title"),
        description: frontmatterString(frontmatter, "description"),
        resource: frontmatterString(frontmatter, "resource"),
        tags: frontmatterTags(frontmatter),
        timestamp: frontmatterString(frontmatter, "timestamp"),
        frontmatter,
        rawMarkdown,
        markdownBody: parsed.markdownBody,
        headings: markdown.headings,
        outgoingLinks: markdown.links,
        incomingLinks: [],
      });
    } catch (error) {
      recordParsingError(error, filePath, fatalErrors, conceptId);
    }
  }

  return buildOkfBundle({
    rootPath,
    okfVersion,
    markdownFileCount: filePaths.length,
    concepts,
    reservedDocuments,
    warnings,
    fatalErrors,
  });
}

export class OkfBundleValidationError extends Error {
  readonly bundle: OkfBundle;

  constructor(bundle: OkfBundle) {
    super(
      `OKF bundle validation failed with ${bundle.fatalErrors.length} fatal error${
        bundle.fatalErrors.length === 1 ? "" : "s"
      }.`,
    );
    this.name = "OkfBundleValidationError";
    this.bundle = bundle;
  }
}

export async function loadOkfBundle(
  options: LoadOkfBundleOptions = {},
): Promise<OkfBundle> {
  const bundle = await parseOkfBundle(options);
  if (bundle.fatalErrors.length > 0) {
    throw new OkfBundleValidationError(bundle);
  }
  return bundle;
}
