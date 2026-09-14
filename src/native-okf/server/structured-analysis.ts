import "server-only";

import { getOkfBundle } from "./cache.ts";
import {
  associatedConceptsForPaper,
  projectSemanticEdges,
  semanticTypeRank,
} from "./paper-design-map.ts";
import {
  nativeOkfRequestedKindForType,
  type NativeOkfRequestedConceptKind,
} from "./retrieval.ts";
import { buildNativeOkfGroundedContext } from "./openai/context.ts";
import type {
  FinalContextConcept,
  NativeOkfStructuredAnalysis,
  RetrievalResult,
  StructuredPaperEvidence,
} from "./retrieval-types.ts";
import type { OkfConcept } from "./types.ts";

const RELATIONSHIP_QUERY_PATTERN =
  /\b(?:map(?:s|ped|ping)?|mapping|address(?:es|ed|ing)?|implement(?:s|ed|ing|ation)?|support(?:s|ed|ing)?|satisf(?:y|ies|ied|ying)|connect(?:s|ed|ing)?|relationships?|links?|individual\s+mapping)\b/iu;
const ABSENCE_QUERY_PATTERN =
  /\b(?:no|not|without|lack(?:s|ed|ing)?|do(?:es)?\s+not|doesn['’]t|don['’]t|zero|absence|missing|false|correct\?)\b/iu;
const UNIVERSAL_PREMISE_PATTERN =
  /\b(?:all|every|each)\s+papers?\b|\bpapers?\s+all\b/iu;

export interface NativeOkfStructuredAnalysisFocus {
  question: string;
  paperConceptIds: readonly string[];
  requestedConceptKinds: readonly NativeOkfRequestedConceptKind[];
  corpusQuery: boolean;
  multiPaperComparison?: boolean;
}

function normalize(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/gu, " ");
}

function displayTitle(concept: OkfConcept): string {
  const label = typeof concept.frontmatter.label === "string"
    ? concept.frontmatter.label.trim()
    : "";
  return concept.title?.trim() ||
    label ||
    concept.headings.find((heading) => heading.depth === 1)?.text.trim() ||
    concept.id;
}

function exactTermFromQuestion(question: string): string | null {
  const normalized = question.normalize("NFKC");
  const patterns = [
    /\bwhere\s+(.{2,120}?)\s+(?:is|are)\s+(?:used|represented|treated|described)\s+as\b/iu,
    /\b(?:use|uses|using)\s+(.{2,120}?)\s+as\b/iu,
  ];
  for (const pattern of patterns) {
    const candidate = pattern.exec(normalized)?.[1];
    if (!candidate) continue;
    const term = normalize(candidate.replace(/^(?:a|an|the)\s+/iu, ""));
    if (term.length >= 3 && term.split(" ").length <= 8) return term;
  }
  return null;
}

function searchableText(concept: OkfConcept): string {
  return normalize([
    concept.title ?? "",
    concept.description ?? "",
    ...(concept.tags ?? []),
    ...concept.headings.map((heading) => heading.text),
    concept.markdownBody,
  ].join("\n"));
}

function explicitlyContainsTerm(concept: OkfConcept, exactTerm: string): boolean {
  const haystack = new Set(searchableText(concept).split(" "));
  const terms = exactTerm.split(" ").filter(Boolean);
  return terms.length > 0 && terms.every((term) => haystack.has(term));
}

function explicitlyRepresentsTerm(concept: OkfConcept, exactTerm: string): boolean {
  const identity = normalize([
    concept.title ?? "",
    typeof concept.frontmatter.label === "string"
      ? concept.frontmatter.label
      : "",
    ...(concept.tags ?? []),
    ...concept.headings
      .filter((heading) => heading.depth === 1)
      .map((heading) => heading.text),
  ].join("\n"));
  if (!identity) return false;
  const identityTerms = new Set(identity.split(" "));
  const exactTerms = exactTerm.split(" ").filter(Boolean);
  if (exactTerms.length === 0) return false;
  if (exactTerms.every((term) => identityTerms.has(term))) return true;
  const semanticHead = exactTerms.at(-1)!;
  return semanticHead.length >= 3 && identityTerms.has(semanticHead);
}

function canonicalTypeForKind(kind: NativeOkfRequestedConceptKind): string {
  return kind === "goal"
    ? "design-goal"
    : kind === "objective"
      ? "design-objective"
      : kind === "meta-requirement"
        ? "meta-requirement"
        : kind === "requirement"
          ? "design-requirement"
          : kind === "principle"
            ? "design-principle"
            : "design-feature";
}

function canonicalRelationshipKinds(
  requestedKinds: readonly NativeOkfRequestedConceptKind[],
): NativeOkfRequestedConceptKind[] {
  return [...new Set(requestedKinds)].sort((left, right) =>
    semanticTypeRank(canonicalTypeForKind(left)) -
      semanticTypeRank(canonicalTypeForKind(right)) ||
    left.localeCompare(right, "en")
  );
}

function requestedRelationshipLabel(question: string): string | null {
  if (/\bimplement(?:s|ed|ing|ation)?\b/iu.test(question)) return "implements";
  if (/\baddress(?:es|ed|ing)?\b/iu.test(question)) return "addresses";
  if (/\bsupport(?:s|ed|ing)?\b/iu.test(question)) return "supports";
  if (/\bsatisf(?:y|ies|ied|ying)\b/iu.test(question)) return "satisfies";
  return null;
}

function representedTypeCounts(concepts: readonly OkfConcept[]): Record<string, number> {
  const counts = new Map<string, number>();
  for (const concept of concepts) {
    counts.set(concept.type, (counts.get(concept.type) ?? 0) + 1);
  }
  return Object.fromEntries(
    [...counts].sort(([left], [right]) => left.localeCompare(right, "en")),
  );
}

function contextConcept(concept: OkfConcept): FinalContextConcept {
  const markdownBody = concept.markdownBody.slice(0, 1_200);
  const selectedMetadata: Record<string, string | string[]> = {};
  for (const key of ["year", "venue", "source_paper"] as const) {
    const value = concept.frontmatter[key];
    if (typeof value === "string" && value.trim()) {
      selectedMetadata[key] = value.trim().slice(0, 300);
    }
  }
  const base: FinalContextConcept = {
    conceptId: concept.id,
    type: concept.type,
    title: displayTitle(concept),
    ...(concept.description ? { description: concept.description.slice(0, 500) } : {}),
    path: concept.filePath,
    tags: [...new Set(concept.tags ?? [])].sort(),
    headings: concept.headings.slice(0, 12).map((heading) => heading.text.slice(0, 200)),
    markdownBody,
    selectedMetadata,
    score: 0,
    expansionDepth: 0,
    characterEstimate: 0,
  };
  return { ...base, characterEstimate: JSON.stringify(base).length };
}

function relationshipStatus(
  relevantConcepts: readonly OkfConcept[],
  requestedKinds: readonly NativeOkfRequestedConceptKind[],
  relationshipCount: number,
  relationshipQuery: boolean,
): StructuredPaperEvidence["relationshipStatus"] {
  if (!relationshipQuery || requestedKinds.length < 2) return "not-requested";
  const sourceKinds = new Set(requestedKinds.slice(0, -1));
  const targetKind = requestedKinds.at(-1)!;
  const hasSourceLayer = relevantConcepts.some((concept) => {
    const kind = nativeOkfRequestedKindForType(concept.type);
    return kind !== null && sourceKinds.has(kind);
  });
  const hasTargetLayer = relevantConcepts.some(
    (concept) => nativeOkfRequestedKindForType(concept.type) === targetKind,
  );
  if (!hasSourceLayer || !hasTargetLayer) return "missing-layer";
  return relationshipCount > 0 ? "mapped" : "unmapped";
}

function isRequestedRelationshipEdge(
  edge: { sourceId: string; targetId: string; label?: string },
  requestedKinds: readonly NativeOkfRequestedConceptKind[],
  conceptsById: ReadonlyMap<string, OkfConcept>,
  requestedLabel: string | null,
): boolean {
  if (requestedKinds.length < 2) return false;
  const sourceKinds = new Set(requestedKinds.slice(0, -1));
  const targetKind = requestedKinds.at(-1)!;
  const sourceKind = nativeOkfRequestedKindForType(
    conceptsById.get(edge.sourceId)?.type ?? "",
  );
  const edgeTargetKind = nativeOkfRequestedKindForType(
    conceptsById.get(edge.targetId)?.type ?? "",
  );
  return sourceKind !== null && sourceKinds.has(sourceKind) &&
    edgeTargetKind === targetKind &&
    (requestedLabel === null || edge.label === requestedLabel);
}

function corpusEvidenceConcepts(
  question: string,
  rows: readonly StructuredPaperEvidence[],
  conceptsById: ReadonlyMap<string, OkfConcept>,
  requestedKinds: readonly NativeOkfRequestedConceptKind[],
  exactTerm: string | null,
  relationshipQuery: boolean,
): OkfConcept[] {
  const orderedIds: string[] = [];
  if (exactTerm) {
    orderedIds.push(
      ...rows.flatMap((row) =>
        row.relevantConcepts
          .filter((concept) => concept.explicitTermMatch)
          .map((concept) => concept.conceptId)
      ),
    );
  } else if (relationshipQuery && ABSENCE_QUERY_PATTERN.test(question)) {
    orderedIds.push(
      ...rows
        .filter((row) => row.relationshipStatus === "unmapped")
        .map((row) => row.paperConceptId),
      ...rows
        .filter((row) => row.relationshipStatus === "mapped")
        .map((row) => row.paperConceptId),
    );
  } else if (UNIVERSAL_PREMISE_PATTERN.test(question) && requestedKinds.length > 0) {
    orderedIds.push(
      ...rows
        .filter((row) => row.relevantConcepts.length === 0)
        .map((row) => row.paperConceptId),
      ...rows.flatMap((row) => row.relevantConcepts.slice(0, 1).map((item) => item.conceptId)),
    );
  } else {
    orderedIds.push(
      ...rows.flatMap((row) => row.relevantConcepts.slice(0, 1).map((item) => item.conceptId)),
    );
  }
  const seen = new Set<string>();
  return orderedIds.flatMap((id) => {
    if (seen.has(id)) return [];
    seen.add(id);
    const concept = conceptsById.get(id);
    return concept ? [concept] : [];
  });
}

function fitStructuredRetrieval(
  retrieval: RetrievalResult,
  analysis: NativeOkfStructuredAnalysis,
  candidates: readonly FinalContextConcept[],
  question: string,
): Pick<RetrievalResult, "finalConcepts" | "contextCharacterEstimate" | "warnings" | "debug"> {
  const boundedCandidates = candidates.slice(0, retrieval.debug.limits.maxConcepts);
  const provisional: RetrievalResult = {
    ...retrieval,
    finalConcepts: boundedCandidates,
    structuredAnalysis: analysis,
  };
  const grounded = buildNativeOkfGroundedContext(provisional, question);
  const finalConcepts = boundedCandidates.filter((concept) =>
    grounded.allowedConceptIds.has(concept.conceptId)
  );
  const finalIds = new Set(finalConcepts.map((concept) => concept.conceptId));
  const omitted = candidates.filter((concept) => !finalIds.has(concept.conceptId));
  const droppedConcepts = [
    ...retrieval.debug.droppedConcepts.filter((item) => !finalIds.has(item.conceptId)),
    ...omitted.map((concept) => ({
      conceptId: concept.conceptId,
      reason: "context-limit" as const,
    })),
  ];
  const warnings = [...new Set([
    ...retrieval.warnings,
    ...(omitted.length > 0
      ? ["One or more concepts were omitted because the context limit was exhausted."]
      : []),
  ])];
  return {
    finalConcepts,
    contextCharacterEstimate: grounded.prompt.length,
    warnings,
    debug: { ...retrieval.debug, droppedConcepts },
  };
}

export async function applyNativeOkfStructuredAnalysis(
  retrieval: RetrievalResult,
  focus: NativeOkfStructuredAnalysisFocus,
): Promise<RetrievalResult> {
  const requestedKinds = [...new Set(focus.requestedConceptKinds)];
  const relationshipKinds = canonicalRelationshipKinds(requestedKinds);
  const relationshipLabel = requestedRelationshipLabel(focus.question);
  const comparisonSkeleton = focus.multiPaperComparison === true &&
    focus.paperConceptIds.length > 1;
  const relationshipQuery = RELATIONSHIP_QUERY_PATTERN.test(focus.question) ||
    requestedKinds.length >= 2 &&
      /\b(?:compare|comparison|between|level)\b/iu.test(focus.question);
  const exactTerm = exactTermFromQuestion(focus.question);
  const structuredCorpusSemantics = requestedKinds.length > 0 ||
    exactTerm !== null ||
    relationshipQuery && requestedKinds.length >= 2 ||
    comparisonSkeleton;
  const needsStructuredAnalysis = focus.corpusQuery
    ? structuredCorpusSemantics
    : focus.paperConceptIds.length > 0 && structuredCorpusSemantics;
  if (!needsStructuredAnalysis) return retrieval;

  const bundle = await getOkfBundle();
  const scopedPapers = focus.corpusQuery
    ? [...(bundle.conceptsByType.get("paper") ?? [])]
    : focus.paperConceptIds.flatMap((id) => {
        const paper = bundle.conceptsById.get(id);
        return paper?.type === "paper" ? [paper] : [];
      });
  if (scopedPapers.length === 0) return retrieval;

  const rows: StructuredPaperEvidence[] = scopedPapers
    .sort((left, right) => retrieval.completePaperContext
      ? focus.paperConceptIds.indexOf(left.id) - focus.paperConceptIds.indexOf(right.id)
      : displayTitle(left).localeCompare(displayTitle(right), "en"))
    .map((paper) => {
      const associated = associatedConceptsForPaper(bundle, paper);
      const requested = associated.filter((concept) => {
        const kind = nativeOkfRequestedKindForType(concept.type);
        return kind !== null && requestedKinds.includes(kind);
      });
      const termMatches = exactTerm
        ? [
            ...associated.filter((concept) =>
              explicitlyRepresentsTerm(concept, exactTerm)
            ),
            ...(explicitlyContainsTerm(paper, exactTerm) ? [paper] : []),
          ]
        : [];
      const relevant = exactTerm
        ? termMatches
        : comparisonSkeleton && requestedKinds.length === 0
          ? associated
          : requested;
      const projected = projectSemanticEdges(bundle, associated).filter((edge) => {
        if (comparisonSkeleton && requestedKinds.length === 0) return true;
        if (!relationshipQuery || relationshipKinds.length < 2) return false;
        return isRequestedRelationshipEdge(
          edge,
          relationshipKinds,
          bundle.conceptsById,
          relationshipLabel,
        );
      });
      const relationshipCount = projected.length;
      const conceptEvidence = relevant.map((concept) => ({
        conceptId: concept.id,
        title: displayTitle(concept),
        type: concept.type,
        paperConceptId: paper.id,
        explicitTermMatch: exactTerm !== null && (
          concept.type === "paper"
            ? explicitlyContainsTerm(concept, exactTerm)
            : explicitlyRepresentsTerm(concept, exactTerm)
        ),
      }));
      const compactConceptEvidence = focus.corpusQuery
        ? [...new Map(
            conceptEvidence.map((concept) => [concept.type, concept]),
          ).values()]
        : conceptEvidence;
      const relationshipEvidence = projected.map((edge) => ({
        sourceId: edge.sourceId,
        sourceType: bundle.conceptsById.get(edge.sourceId)?.type ?? "unknown",
        targetId: edge.targetId,
        targetType: bundle.conceptsById.get(edge.targetId)?.type ?? "unknown",
        label: edge.label,
      }));
      return {
        paperConceptId: paper.id,
        title: displayTitle(paper),
        representedTypeCounts: representedTypeCounts(associated),
        relevantConceptCount: conceptEvidence.length,
        relevantConcepts: compactConceptEvidence,
        relevantRelationshipCount: relationshipEvidence.length,
        relevantRelationships: focus.corpusQuery
          ? relationshipEvidence.slice(0, 3)
          : relationshipEvidence,
        relationshipStatus: relationshipStatus(
          relevant,
          relationshipKinds,
          relationshipCount,
          relationshipQuery,
        ),
        explicitTermMatchCount: termMatches.length,
      };
    });

  const visibleRows = exactTerm
    ? rows.filter((row) => row.explicitTermMatchCount > 0)
    : rows;
  const structuredAnalysis: NativeOkfStructuredAnalysis = {
    scope: focus.corpusQuery
      ? "corpus"
      : scopedPapers.length > 1
        ? "multi-paper"
        : "paper",
    checkedPaperCount: scopedPapers.length,
    exhaustiveForScope: true,
    requestedKinds,
    exactTerm,
    relationshipCheckComplete: relationshipQuery,
    absenceCheckComplete: exactTerm !== null ||
      relationshipQuery && ABSENCE_QUERY_PATTERN.test(focus.question),
    papers: visibleRows,
  };

  if (retrieval.completePaperContext) return { ...retrieval, structuredAnalysis };

  if (!focus.corpusQuery) {
    const fitted = fitStructuredRetrieval(
      retrieval,
      structuredAnalysis,
      retrieval.finalConcepts,
      focus.question,
    );
    return {
      ...retrieval,
      ...fitted,
      structuredAnalysis,
      noMatch: fitted.finalConcepts.length === 0 && visibleRows.length === 0,
    };
  }

  const evidence = corpusEvidenceConcepts(
    focus.question,
    visibleRows,
    bundle.conceptsById,
    requestedKinds,
    exactTerm,
    relationshipQuery,
  )
    .slice(0, retrieval.debug.limits.maxConcepts)
    .map(contextConcept);
  const fitted = fitStructuredRetrieval(
    retrieval,
    structuredAnalysis,
    evidence,
    focus.question,
  );
  return {
    ...retrieval,
    ...fitted,
    structuredAnalysis,
    noMatch: fitted.finalConcepts.length === 0,
  };
}
