import "server-only";

import { getOkfBundle } from "./cache.ts";
import { getLibraryViewModel } from "./workbench.ts";
import type { PaperCardDto, TypeCountDto } from "../shared/types.ts";

export interface ReleaseMetric {
  label: string;
  value: number;
}

export interface ReleaseHomeViewModel {
  metrics: {
    paperCount: number;
    conceptCount: number;
    resolvedNativeLinkCount: number;
    representedTypeCount: number;
  };
  metricCards: ReleaseMetric[];
  typeCounts: TypeCountDto[];
  featuredPapers: PaperCardDto[];
}

const DEFAULT_FEATURED_PAPER_COUNT = 3;

function compareStrings(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function numericYear(value: string | undefined): number | undefined {
  if (!value || !/^\d{4}$/u.test(value)) return undefined;
  const year = Number(value);
  return Number.isSafeInteger(year) ? year : undefined;
}

/**
 * Selects representative papers from corpus structure, never named fixtures.
 * Richer linked-concept and native-type coverage comes first, followed by
 * recent dated records and a stable title/ID tie-break.
 */
export function selectRepresentativePapers(
  papers: readonly PaperCardDto[],
  limit = DEFAULT_FEATURED_PAPER_COUNT,
): PaperCardDto[] {
  const safeLimit = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 0;

  return [...papers]
    .sort((left, right) => {
      const linkedDifference = right.linkedConcepts.length - left.linkedConcepts.length;
      if (linkedDifference !== 0) return linkedDifference;

      const typeDifference = right.linkedTypeCounts.length - left.linkedTypeCounts.length;
      if (typeDifference !== 0) return typeDifference;

      const leftYear = numericYear(left.year);
      const rightYear = numericYear(right.year);
      if (leftYear !== undefined || rightYear !== undefined) {
        if (leftYear === undefined) return 1;
        if (rightYear === undefined) return -1;
        if (leftYear !== rightYear) return rightYear - leftYear;
      }

      return compareStrings(left.title, right.title) || compareStrings(left.id, right.id);
    })
    .slice(0, safeLimit);
}

export async function buildReleaseHomeViewModel(): Promise<ReleaseHomeViewModel> {
  const [bundle, library] = await Promise.all([getOkfBundle(), getLibraryViewModel()]);
  const resolvedNativeLinkCount = bundle.concepts.reduce(
    (count, concept) => count + concept.outgoingLinks.filter(
      (link) => link.resolved && !link.external,
    ).length,
    0,
  );
  const countsByType = new Map(
    library.typeCounts.map(({ type, count }) => [type, count]),
  );
  const metrics = {
    paperCount: library.paperCount,
    conceptCount: bundle.concepts.length,
    resolvedNativeLinkCount,
    representedTypeCount: bundle.conceptsByType.size,
  };

  return {
    metrics,
    metricCards: [
      { label: "Papers", value: metrics.paperCount },
      { label: "Requirements", value: countsByType.get("design-requirement") ?? 0 },
      { label: "Principles", value: countsByType.get("design-principle") ?? 0 },
      { label: "Features", value: countsByType.get("design-feature") ?? 0 },
    ],
    typeCounts: library.typeCounts,
    featuredPapers: selectRepresentativePapers(library.papers),
  };
}
