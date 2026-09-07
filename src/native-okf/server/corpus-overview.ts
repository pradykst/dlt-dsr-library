import "server-only";

import { getOkfBundle } from "./cache.ts";
import type { OkfBundle, OkfConcept } from "./types.ts";
import type {
  CorpusOverview,
  CorpusPaperOverview,
} from "./retrieval-types.ts";

function compareStrings(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function scalarString(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return undefined;
}

function displayTitle(concept: OkfConcept): string {
  return concept.title?.trim() ||
    scalarString(concept.frontmatter.label) ||
    concept.headings.find((heading) => heading.depth === 1)?.text.trim() ||
    concept.id.split("/").at(-1) ||
    concept.id;
}

function linkedConceptIds(bundle: OkfBundle, paperId: string): string[] {
  const ids = new Set<string>();

  for (const link of bundle.outgoing.get(paperId) ?? []) {
    if (link.targetId && link.targetId !== paperId) ids.add(link.targetId);
  }
  for (const link of bundle.incoming.get(paperId) ?? []) {
    if (link.sourceId !== paperId) ids.add(link.sourceId);
  }

  return [...ids].sort(compareStrings);
}

function linkedTypeCounts(bundle: OkfBundle, paperId: string): Record<string, number> {
  const counts = new Map<string, number>();

  for (const id of linkedConceptIds(bundle, paperId)) {
    const concept = bundle.conceptsById.get(id);
    if (!concept) continue;
    counts.set(concept.type, (counts.get(concept.type) ?? 0) + 1);
  }

  return Object.fromEntries([...counts].sort(([left], [right]) => compareStrings(left, right)));
}

function paperOverview(bundle: OkfBundle, paper: OkfConcept): CorpusPaperOverview {
  const year = scalarString(paper.frontmatter.year);
  const venue = scalarString(paper.frontmatter.venue);

  return {
    conceptId: paper.id,
    title: displayTitle(paper),
    ...(year === undefined ? {} : { year }),
    ...(venue === undefined ? {} : { venue }),
    tags: [...new Set(paper.tags ?? [])].sort(compareStrings),
    linkedConceptCounts: linkedTypeCounts(bundle, paper.id),
  };
}

/** The compact overview line for a single paper, by its concept id. */
export function buildSinglePaperOverview(
  bundle: OkfBundle,
  paperConceptId: string,
): CorpusPaperOverview | undefined {
  const paper = bundle.conceptsById.get(paperConceptId);
  return paper && paper.type === "paper" ? paperOverview(bundle, paper) : undefined;
}

/**
 * Builds a compact, deterministic paper inventory from the native OKF graph.
 *
 * The overview intentionally omits Markdown bodies. It is suitable for
 * corpus-wide questions (for example, papers with zero concepts of a type)
 * without placing every paper document into detailed retrieval context.
 */
export async function buildCorpusOverview(): Promise<CorpusOverview> {
  const bundle = await getOkfBundle();
  const papers = (bundle.conceptsByType.get("paper") ?? [])
    .map((paper) => paperOverview(bundle, paper))
    .sort(
      (left, right) =>
        compareStrings(left.title.toLocaleLowerCase("en"), right.title.toLocaleLowerCase("en")) ||
        compareStrings(left.title, right.title) ||
        compareStrings(left.conceptId, right.conceptId),
    );

  return { paperCount: papers.length, papers };
}
