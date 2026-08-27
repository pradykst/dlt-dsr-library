/**
 * Produces the plain clipboard payload from the original answer Markdown.
 * Source cards and response-note UI are excluded by construction because the
 * caller passes answer Markdown only.
 */
export function assistantResponseClipboardText(markdown: string): string {
  return markdown
    .replace(/[ \t]*\[\[S[1-9]\d*\]\]/gu, "")
    .replace(/[ \t]+$/gmu, "")
    .replace(/ {2,}/gu, " ")
    .trim();
}
