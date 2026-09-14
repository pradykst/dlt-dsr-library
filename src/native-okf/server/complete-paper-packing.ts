import "server-only";

/**
 * Remove only duplicate representation: the title, source-paper bibliographic
 * section, citation appendix, and pure concept-link inventories. Identities,
 * publication metadata and canonical relationships are serialized separately.
 * All other narrative paragraphs and headings remain verbatim.
 */
export function compactCompletePaperMarkdown(markdown: string, metadata: Record<string, string | string[]> = {}, representedDescriptions: ReadonlySet<string> = new Set(), sourceIdByConceptId: ReadonlyMap<string, string> = new Map()): string {
  const sections = markdown.split(/(?=^#{1,6}\s+)/mu);
  return sections.flatMap((section) => {
    const [heading, ...lines] = section.split(/\r?\n/u);
    if (/^#{1,6}\s+(?:citations?|source paper)\s*$/iu.test(heading ?? "")) return [];
    const body = lines.flatMap((line) => {
      const linkedConcept = /^\s*[-*+]\s+\[[^\]]+\]\(([^)]*\.md)\)(?:\s*[-:]\s+(.*?))?\s*$/u.exec(line);
      if (linkedConcept) {
        const annotation = linkedConcept[2];
        if (!annotation || representedDescriptions.has(annotation)) return [];
        const id = linkedConcept[1]!.replace(/^(?:\.\.\/)+/u, "").replace(/\.md$/u, "");
        const sourceId = sourceIdByConceptId.get(id);
        if (sourceId) return [`${sourceId}: ${annotation}`];
      }
      const field = /^\*\*(Authors?|Venue|Link):\*\*\s*(.*?)\s*$/iu.exec(line);
      if (!field) return [line];
      const key = field[1]!.toLowerCase() === "link" ? "resource" : field[1]!.toLowerCase().replace(/^author$/u, "authors");
      const stored = metadata[key];
      return field[2] !== (Array.isArray(stored) ? stored.join(", ") : stored) ? [line] : [];
    });
    if (!body.some((line) => line.trim())) return [];
    return [(heading?.startsWith("# ") ? body : [heading ?? "", ...body]).join("\n").trim()];
  }).filter(Boolean).join("\n\n");
}
