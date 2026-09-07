import { compareDisplayStrings } from "./presentation.ts";

/**
 * A canonical paper as offered by the scope selector, the `@` paper reference,
 * and the `/paper` command. `paperId` is the canonical slug — the trusted
 * identity. `title` and `authors` are display/search metadata only.
 */
export interface NativeOkfScopePaper {
  paperId: string;
  title: string;
  authors: string[];
}

export interface NativeOkfScopePaperMatch extends NativeOkfScopePaper {
  score: number;
}

function tokens(value: string): string[] {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .split(/[^\p{L}\p{N}]+/u)
    .filter((token) => token.length > 0);
}

/**
 * The single resolver shared by every paper-selection entry point. Given a raw
 * query (possibly empty), it ranks the canonical papers by title/token/author
 * match. An empty query returns every paper in title order. Callers must never
 * silently resolve an ambiguous query — if more than one paper is returned, the
 * researcher chooses.
 */
export function matchNativeOkfScopePapers(
  query: string,
  papers: readonly NativeOkfScopePaper[],
  limit = 8,
): NativeOkfScopePaperMatch[] {
  const trimmed = query.trim();
  const queryTokens = tokens(trimmed);
  const ordered = [...papers].sort(
    (left, right) =>
      compareDisplayStrings(left.title, right.title) ||
      compareDisplayStrings(left.paperId, right.paperId),
  );

  if (queryTokens.length === 0) {
    return ordered.slice(0, limit).map((paper) => ({ ...paper, score: 0 }));
  }

  const normalizedQuery = trimmed.toLocaleLowerCase("en");
  const scored = ordered.flatMap((paper) => {
    const titleLower = paper.title.toLocaleLowerCase("en");
    const titleTokens = new Set(tokens(paper.title));
    const authorTokens = new Set(paper.authors.flatMap(tokens));
    let score = 0;
    if (titleLower.includes(normalizedQuery)) score += 6;
    if (titleLower.startsWith(normalizedQuery)) score += 4;
    for (const token of queryTokens) {
      if (titleTokens.has(token)) score += 3;
      else if ([...titleTokens].some((candidate) => candidate.startsWith(token))) {
        score += 2;
      } else if (authorTokens.has(token)) score += 2;
      else if (paper.paperId.includes(token)) score += 1;
    }
    return score > 0 ? [{ ...paper, score }] : [];
  });

  return scored
    .sort(
      (left, right) =>
        right.score - left.score ||
        compareDisplayStrings(left.title, right.title),
    )
    .slice(0, limit);
}

/** The scope paper whose slug matches, if any. */
export function findNativeOkfScopePaper(
  paperId: string,
  papers: readonly NativeOkfScopePaper[],
): NativeOkfScopePaper | undefined {
  return papers.find((paper) => paper.paperId === paperId);
}

/**
 * A composer `@` mention token being typed: the `@` plus the word characters
 * immediately after the caret. Returns `null` when the caret is not in a live
 * mention (so an email address or a mid-word `@` never opens the picker).
 */
export function nativeOkfActiveMentionQuery(
  text: string,
  caret: number,
): { start: number; query: string } | null {
  const upto = text.slice(0, caret);
  const match = /(?:^|\s)@([\p{L}\p{N}-]*)$/u.exec(upto);
  if (!match) return null;
  return {
    start: caret - match[1]!.length - 1,
    query: match[1]!,
  };
}

/** Detects the `/paper`, `/all`, and `/new` slash commands typed alone. */
export function nativeOkfSlashCommand(
  text: string,
): { command: "paper" | "all" | "new"; argument: string } | null {
  const match = /^\s*\/(paper|all|new)\b[ \t]*(.*)$/iu.exec(text);
  if (!match) return null;
  return {
    command: match[1]!.toLocaleLowerCase("en") as "paper" | "all" | "new",
    argument: match[2]!.trim(),
  };
}
