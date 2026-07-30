import "server-only";

import type { NativeOkfSourceCard } from "../../shared/chat-types.ts";
import type { NativeOkfGroundedContext } from "./context.ts";

const CITATION_TOKEN = /\[\[([^\]\r\n]{1,64})\]\]/gu;

export interface ValidatedAnswerCitations {
  answerMarkdown: string;
  citedSourceIds: string[];
  sources: NativeOkfSourceCard[];
  unknownSourceIds: string[];
  needsRepair: boolean;
  warnings: string[];
}

export function parseCitationSourceIds(answerMarkdown: string): string[] {
  const sourceIds: string[] = [];
  const seen = new Set<string>();
  for (const match of answerMarkdown.matchAll(CITATION_TOKEN)) {
    const sourceId = match[1];
    if (!sourceId || seen.has(sourceId)) continue;
    seen.add(sourceId);
    sourceIds.push(sourceId);
  }
  return sourceIds;
}

export function validateAnswerCitations(
  answerMarkdown: string,
  context: NativeOkfGroundedContext,
): ValidatedAnswerCitations {
  const citedSourceIds: string[] = [];
  const unknownSourceIds: string[] = [];
  const cited = new Set<string>();
  const unknown = new Set<string>();

  const cleaned = answerMarkdown.replace(
    CITATION_TOKEN,
    (token: string, sourceId: string) => {
      if (!context.sourceById.has(sourceId)) {
        if (!unknown.has(sourceId)) {
          unknown.add(sourceId);
          unknownSourceIds.push(sourceId);
        }
        return "";
      }
      if (!cited.has(sourceId)) {
        cited.add(sourceId);
        citedSourceIds.push(sourceId);
      }
      return token;
    },
  );

  const requiredConceptIds = context.requiredConceptIds ?? new Set<string>();
  const hasRequiredCitation = requiredConceptIds.size === 0 ||
    citedSourceIds.some((sourceId) => {
      const source = context.sourceById.get(sourceId);
      return source !== undefined &&
        requiredConceptIds.has(source.conceptId);
    });

  const warnings: string[] = [];
  if (unknownSourceIds.length > 0) {
    warnings.push(
      `Removed unknown citation source IDs: ${unknownSourceIds.join(", ")}.`,
    );
  }
  if (citedSourceIds.length === 0) {
    warnings.push("The generated answer did not contain a valid native OKF citation.");
  }
  if (citedSourceIds.length > 0 && !hasRequiredCitation) {
    warnings.push(
      "The generated answer did not cite a directly requested native OKF concept.",
    );
  }

  return {
    answerMarkdown: cleaned,
    citedSourceIds,
    sources: citedSourceIds.flatMap((sourceId) => {
      const source = context.sourceById.get(sourceId);
      return source ? [source.card] : [];
    }),
    unknownSourceIds,
    needsRepair: unknownSourceIds.length > 0 || citedSourceIds.length === 0 || !hasRequiredCitation,
    warnings,
  };
}
