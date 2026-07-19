import {
  conceptRouteHref,
  NATIVE_OKF_PUBLIC_ROUTES,
} from "./routes.ts";

const NATIVE_OKF_ROOT = NATIVE_OKF_PUBLIC_ROUTES.library;
const SAFE_EXTERNAL_SCHEMES = new Set(["http", "https", "mailto"]);
const RESERVED_DOCUMENT_IDS = new Set([
  "index",
  "log",
  "papers/index",
  "design-knowledge/index",
]);

export interface ResolvedOkfHref {
  href: string;
  external: boolean;
}

function normalizedScheme(value: string): string | undefined {
  const withoutControls = value.replace(/[\u0000-\u0020\u007f]+/gu, "");
  const match = /^([a-z][a-z\d+.-]*):/iu.exec(withoutControls);
  return match?.[1]?.toLowerCase();
}

function splitSuffix(value: string): { path: string; suffix: string } {
  const suffixIndex = value.search(/[?#]/u);
  return suffixIndex === -1
    ? { path: value, suffix: "" }
    : { path: value.slice(0, suffixIndex), suffix: value.slice(suffixIndex) };
}

function decodePath(value: string): string {
  try {
    return decodeURI(value);
  } catch {
    return value;
  }
}

function normalizeBundlePath(value: string): string | undefined {
  const segments = value.replaceAll("\\", "/").split("/");
  const normalized: string[] = [];

  for (const segment of segments) {
    if (!segment || segment === ".") {
      continue;
    }
    if (segment === "..") {
      if (normalized.length === 0) {
        return undefined;
      }
      normalized.pop();
      continue;
    }
    normalized.push(segment);
  }

  return normalized.join("/");
}

function sourceDirectory(sourceFilePath: string): string | undefined {
  const normalized = normalizeBundlePath(sourceFilePath);
  if (normalized === undefined) {
    return undefined;
  }
  const slashIndex = normalized.lastIndexOf("/");
  return slashIndex === -1 ? "" : normalized.slice(0, slashIndex);
}

/** Return the canonical public route for a normalized OKF concept ID. */
export function conceptHref(conceptIdOrPath: string): string {
  const { path: rawPath } = splitSuffix(conceptIdOrPath.trim());
  const normalized = normalizeBundlePath(
    decodePath(rawPath.replace(/^\/+/, "")),
  );
  if (normalized === undefined) {
    return NATIVE_OKF_ROOT;
  }

  const conceptId = normalized.replace(/\.md$/iu, "");
  if (!conceptId || RESERVED_DOCUMENT_IDS.has(conceptId.toLowerCase())) {
    return NATIVE_OKF_ROOT;
  }

  return conceptRouteHref(conceptId);
}

export function isSafeExternalHref(value: string): boolean {
  const scheme = normalizedScheme(value.trim());
  return scheme !== undefined && SAFE_EXTERNAL_SCHEMES.has(scheme);
}

/**
 * Resolve one Markdown destination into a safe native-library URL. Unsafe or
 * bundle-escaping destinations return undefined and must not be rendered as
 * navigable links.
 */
export function resolveOkfMarkdownHref(
  rawHref: string,
  sourceFilePath: string,
): ResolvedOkfHref | undefined {
  const href = rawHref.trim();
  if (!href) {
    return undefined;
  }

  const scheme = normalizedScheme(href);
  if (scheme !== undefined) {
    return SAFE_EXTERNAL_SCHEMES.has(scheme)
      ? { href, external: true }
      : undefined;
  }
  if (href.startsWith("//")) {
    return undefined;
  }
  if (href.startsWith("#") || href.startsWith("?")) {
    return { href, external: false };
  }

  const { path: rawTargetPath, suffix } = splitSuffix(href);
  const decodedTargetPath = decodePath(rawTargetPath).replaceAll("\\", "/");
  const directory = sourceDirectory(sourceFilePath);
  if (directory === undefined) {
    return undefined;
  }

  const candidate = decodedTargetPath.startsWith("/")
    ? decodedTargetPath.replace(/^\/+/, "")
    : [directory, decodedTargetPath].filter(Boolean).join("/");
  const targetPath = normalizeBundlePath(candidate);
  if (targetPath === undefined) {
    return undefined;
  }

  const extension = /\.([a-z\d]+)$/iu.exec(targetPath)?.[1]?.toLowerCase();
  if (extension !== undefined && extension !== "md") {
    return undefined;
  }

  return {
    href: `${conceptHref(targetPath)}${suffix}`,
    external: false,
  };
}

export { NATIVE_OKF_ROOT };
