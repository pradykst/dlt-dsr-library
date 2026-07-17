import "server-only";

import path from "node:path";

import type { LoadOkfBundleOptions } from "./types.ts";

export const DEFAULT_OKF_BUNDLE_PATH = "knowledge/okf";

export class OkfPathError extends Error {
  readonly code = "path-escape" as const;
  readonly inputPath: string;

  constructor(message: string, inputPath: string) {
    super(message);
    this.name = "OkfPathError";
    this.inputPath = inputPath;
  }
}

export type OkfLinkTargetResolution =
  | { kind: "ignored" }
  | { kind: "external" }
  | { kind: "internal"; targetId: string; targetPath: string };

export function normalizePosixSeparators(inputPath: string): string {
  return inputPath.replaceAll("\\", "/");
}

function assertSafeRelativeInput(inputPath: string): void {
  if (inputPath.includes("\0")) {
    throw new OkfPathError("OKF paths may not contain null bytes.", inputPath);
  }

  const posixPath = normalizePosixSeparators(inputPath);
  if (
    path.posix.isAbsolute(posixPath) ||
    /^[a-zA-Z]:\//u.test(posixPath)
  ) {
    throw new OkfPathError(
      `Path must be relative to the OKF bundle: ${inputPath}`,
      inputPath,
    );
  }
}

/** Normalize a bundle-relative path and reject lexical traversal. */
export function normalizeBundleRelativePath(inputPath: string): string {
  assertSafeRelativeInput(inputPath);

  const normalized = path.posix.normalize(normalizePosixSeparators(inputPath));
  if (normalized === ".." || normalized.startsWith("../")) {
    throw new OkfPathError(
      `Path escapes the OKF bundle root: ${inputPath}`,
      inputPath,
    );
  }

  return normalized === "." ? "" : normalized.replace(/^\.\//u, "");
}

export function resolveOkfBundleRoot(
  options: LoadOkfBundleOptions = {},
): string {
  const cwd = path.resolve(options.cwd ?? process.cwd());
  const configuredPath =
    options.bundlePath ??
    process.env.OKF_BUNDLE_PATH?.trim() ??
    DEFAULT_OKF_BUNDLE_PATH;

  return path.resolve(cwd, configuredPath || DEFAULT_OKF_BUNDLE_PATH);
}

export function isPathWithinBundle(
  bundleRoot: string,
  candidatePath: string,
): boolean {
  const root = path.resolve(bundleRoot);
  const candidate = path.resolve(candidatePath);
  const relative = path.relative(root, candidate);

  return (
    relative === "" ||
    (relative !== ".." &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative))
  );
}

/** Resolve an untrusted bundle-relative path without allowing escape. */
export function resolvePathWithinBundle(
  bundleRoot: string,
  relativePath: string,
): string {
  const normalized = normalizeBundleRelativePath(relativePath);
  const absolutePath = path.resolve(
    path.resolve(bundleRoot),
    ...normalized.split("/").filter(Boolean),
  );

  if (!isPathWithinBundle(bundleRoot, absolutePath)) {
    throw new OkfPathError(
      `Resolved path escapes the OKF bundle root: ${relativePath}`,
      relativePath,
    );
  }

  return absolutePath;
}

export function toBundleRelativePosixPath(
  bundleRoot: string,
  absolutePath: string,
): string {
  const root = path.resolve(bundleRoot);
  const candidate = path.resolve(absolutePath);
  if (!isPathWithinBundle(root, candidate)) {
    throw new OkfPathError(
      `File is outside the OKF bundle root: ${absolutePath}`,
      absolutePath,
    );
  }

  return normalizeBundleRelativePath(path.relative(root, candidate));
}

export function isMarkdownFilePath(filePath: string): boolean {
  return /\.md$/iu.test(filePath);
}

export function isReservedMarkdownPath(filePath: string): boolean {
  const basename = path.posix.basename(normalizePosixSeparators(filePath));
  return basename === "index.md" || basename === "log.md";
}

export function conceptIdFromFilePath(filePath: string): string {
  const normalized = normalizeBundleRelativePath(filePath);
  if (!isMarkdownFilePath(normalized)) {
    throw new OkfPathError(
      `Concept document path must end in .md: ${filePath}`,
      filePath,
    );
  }

  const conceptId = normalized.replace(/\.md$/iu, "");
  if (!conceptId) {
    throw new OkfPathError("Concept ID may not be empty.", filePath);
  }

  return conceptId;
}

function stripQueryAndFragment(target: string): string {
  const suffixIndex = target.search(/[?#]/u);
  return suffixIndex === -1 ? target : target.slice(0, suffixIndex);
}

function decodeUrlPath(target: string): string {
  try {
    return decodeURIComponent(target);
  } catch {
    return target;
  }
}

/** Normalize a repository API lookup supplied as either an ID or `.md` path. */
export function normalizeConceptLookup(pathOrId: string): string {
  const value = decodeUrlPath(stripQueryAndFragment(pathOrId.trim()));
  const withoutBundleSlash = normalizePosixSeparators(value).replace(/^\/+/, "");
  const normalized = normalizeBundleRelativePath(withoutBundleSlash);
  const conceptId = normalized.replace(/\.md$/iu, "");

  if (!conceptId) {
    throw new OkfPathError("Concept lookup may not be empty.", pathOrId);
  }

  return conceptId;
}

export function isExternalMarkdownTarget(rawTarget: string): boolean {
  const target = rawTarget.trim();
  return (
    target.startsWith("//") ||
    /^[a-zA-Z][a-zA-Z\d+.-]*:/u.test(target)
  );
}

/**
 * Classify and normalize a Markdown URL relative to its source document.
 * Existence is intentionally checked later, after all concepts are loaded.
 */
export function resolveOkfLinkTarget(
  sourceFilePath: string,
  rawTarget: string,
): OkfLinkTargetResolution {
  const target = rawTarget.trim();
  if (!target || target.startsWith("#") || target.startsWith("?")) {
    return { kind: "ignored" };
  }
  if (isExternalMarkdownTarget(target)) {
    return { kind: "external" };
  }

  const urlPath = decodeUrlPath(stripQueryAndFragment(target));
  if (!urlPath) {
    return { kind: "ignored" };
  }

  const normalizedSourcePath = normalizeBundleRelativePath(sourceFilePath);
  const relativeTarget = urlPath.startsWith("/")
    ? urlPath.replace(/^\/+/, "")
    : path.posix.join(
        path.posix.dirname(normalizedSourcePath),
        normalizePosixSeparators(urlPath),
      );
  const targetPath = normalizeBundleRelativePath(relativeTarget);
  if (!targetPath) {
    return { kind: "ignored" };
  }

  const targetId = isMarkdownFilePath(targetPath)
    ? conceptIdFromFilePath(targetPath)
    : targetPath;

  return { kind: "internal", targetId, targetPath };
}
