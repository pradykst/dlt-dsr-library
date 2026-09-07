/**
 * The researcher-facing section order for the workbench detail view, kept as one
 * pure descriptor list so the in-page navigation and the rendered section order
 * cannot drift apart (and can be asserted without a DOM renderer).
 *
 * On a paper page the Paper design map is the high-level overview, so it sits
 * directly below the metadata/summary and above the detailed Design knowledge
 * cards. Concept pages are unchanged: linked concepts, then relationships, then
 * the local graph.
 */

export interface WorkbenchSectionDescriptor {
  /** Anchor id used for `#`-links and `scroll-mt` targets. */
  readonly id: string;
  /** Label shown in the sticky section navigation. */
  readonly navLabel: string;
}

export const PAPER_WORKBENCH_SECTIONS: readonly WorkbenchSectionDescriptor[] = [
  { id: "overview", navLabel: "Overview" },
  { id: "dsr-grid", navLabel: "DSR grid" },
  { id: "graph", navLabel: "Paper design map" },
  { id: "design-knowledge", navLabel: "Design knowledge" },
  { id: "raw-metadata", navLabel: "Publication metadata" },
];

export const CONCEPT_WORKBENCH_SECTIONS: readonly WorkbenchSectionDescriptor[] = [
  { id: "overview", navLabel: "Overview" },
  { id: "design-knowledge", navLabel: "Linked concepts" },
  { id: "relationships", navLabel: "Relationships" },
  { id: "graph", navLabel: "Graph" },
  { id: "raw-metadata", navLabel: "Raw metadata" },
];

export function workbenchSectionIds(
  kind: "paper" | "concept",
): string[] {
  return (kind === "paper"
    ? PAPER_WORKBENCH_SECTIONS
    : CONCEPT_WORKBENCH_SECTIONS
  ).map((section) => section.id);
}

/**
 * The 1-indexed eyebrow number for a section, derived from its position so the
 * rendered "01 / 02 / …" labels always match the section order above.
 */
export function workbenchSectionEyebrow(
  kind: "paper" | "concept",
  id: string,
): string {
  const index = workbenchSectionIds(kind).indexOf(id);
  return String(index + 1).padStart(2, "0");
}
