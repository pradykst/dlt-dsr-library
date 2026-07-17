export type CatchAllSegments = string | readonly string[] | null | undefined;

export function compareDisplayStrings(left: string, right: string): number {
  const foldedLeft = left.toLocaleLowerCase("en");
  const foldedRight = right.toLocaleLowerCase("en");
  if (foldedLeft < foldedRight) return -1;
  if (foldedLeft > foldedRight) return 1;
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

export function formatConceptType(type: string): string {
  const words = type.trim().split(/[-_\s]+/u).filter(Boolean);
  if (words.length === 0) return "Unknown";

  return words
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(" ");
}

export function fallbackTitleFromId(id: string): string {
  const segment = id.replace(/\.md$/iu, "").split("/").filter(Boolean).at(-1);
  return formatConceptType(segment ?? id);
}

/**
 * Converts a Next.js catch-all route value to a bundle-relative lookup key.
 * Encoded separators and traversal segments are rejected before the repository
 * sees them; missing optional catch-all values return undefined for not-found
 * handling.
 */
export function normalizeCatchAllSegments(
  value: CatchAllSegments,
): string | undefined {
  if (value === undefined || value === null) return undefined;

  const rawSegments = typeof value === "string"
    ? value.replaceAll("\\", "/").split("/")
    : [...value];
  const normalized: string[] = [];

  for (const rawSegment of rawSegments) {
    if (typeof rawSegment !== "string") {
      throw new TypeError("Catch-all route segments must be strings.");
    }
    if (rawSegment === "") continue;

    let segment: string;
    try {
      segment = decodeURIComponent(rawSegment);
    } catch {
      throw new RangeError("Catch-all route segments must use valid URL encoding.");
    }

    if (
      segment === "." ||
      segment === ".." ||
      segment.includes("/") ||
      segment.includes("\\") ||
      segment.includes("\0") ||
      segment.includes("?") ||
      segment.includes("#")
    ) {
      throw new RangeError("Unsafe catch-all route segment.");
    }
    if (segment.trim() === "") {
      throw new RangeError("Catch-all route segments may not be blank.");
    }

    normalized.push(segment);
  }

  return normalized.length > 0 ? normalized.join("/") : undefined;
}
