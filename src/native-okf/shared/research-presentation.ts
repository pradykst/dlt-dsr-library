/** Presentation only. Canonical records and chat grounding retain their provenance. */
export function researcherMarkdown(markdown: string): string {
  let hiddenDepth = 0;
  return markdown.split(/\r?\n/u).filter((line) => {
    const heading = /^(#{1,6})\s+(.+?)\s*$/u.exec(line);
    if (heading) {
      const depth = heading[1]!.length;
      if (hiddenDepth && depth <= hiddenDepth) hiddenDepth = 0;
      if (/^(?:citations?|source evidence|source document|provenance)\s*$/iu.test(heading[2]!)) {
        hiddenDepth = depth;
      }
    }
    return !hiddenDepth;
  }).join("\n").trim();
}

/** Read the concept's narrative paragraph(s), without flattening its later sections. */
export function conceptNarrative(markdown: string, description?: string): string {
  const lines = markdown.split(/\r?\n/u);
  const firstHeading = lines.findIndex((line) => /^#\s+/u.test(line));
  const start = firstHeading < 0 ? 0 : firstHeading + 1;
  const nextHeading = lines.findIndex((line, index) => index >= start && /^#{1,6}\s+/u.test(line));
  return lines.slice(start, nextHeading < 0 ? undefined : nextHeading).join("\n").trim() || description?.trim() || "";
}

export function publicationDoi(resource?: string, markdown = ""): string | undefined {
  const candidates = [resource, ...[...markdown.matchAll(/https?:\/\/(?:dx\.)?doi\.org\/[^\s<>"\]]+/giu)].map((match) => {
    let url = match[0].replace(/[.,;]+$/u, "");
    while (url.endsWith(")") && (url.match(/\)/gu)?.length ?? 0) > (url.match(/\(/gu)?.length ?? 0)) url = url.slice(0, -1);
    return url;
  })];
  for (const candidate of candidates) {
    if (!candidate) continue;
    try {
      const url = new URL(candidate);
      if (/^(?:dx\.)?doi\.org$/iu.test(url.hostname) && /^\/10\.\d{4,9}\//u.test(url.pathname)) {
        return `https://doi.org${url.pathname}`;
      }
    } catch { /* Missing or non-URL publication metadata. */ }
  }
  return undefined;
}
