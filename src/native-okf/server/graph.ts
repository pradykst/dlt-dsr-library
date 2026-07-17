import "server-only";

import type {
  OkfBundle,
  OkfConcept,
  OkfLink,
  OkfReservedDocument,
  OkfValidationIssue,
} from "./types.ts";

export interface BuildOkfBundleOptions {
  rootPath: string;
  okfVersion?: string;
  markdownFileCount: number;
  concepts: OkfConcept[];
  reservedDocuments: OkfReservedDocument[];
  warnings?: OkfValidationIssue[];
  fatalErrors?: OkfValidationIssue[];
}

function compareStrings(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function compareConcepts(left: OkfConcept, right: OkfConcept): number {
  return compareStrings(left.id, right.id) || compareStrings(left.filePath, right.filePath);
}

function isFragmentOnly(rawTarget: string): boolean {
  return rawTarget.trimStart().startsWith("#");
}

function duplicateIssueAlreadyExists(
  issues: OkfValidationIssue[],
  conceptId: string,
): boolean {
  return issues.some(
    (issue) =>
      issue.code === "duplicate-concept-id" &&
      (issue.sourceId === conceptId || issue.message.includes(`"${conceptId}"`)),
  );
}

/**
 * Finalizes parser output into an immutable-in-practice bundle snapshot.
 *
 * Markdown parsing identifies candidate internal targets. This layer resolves
 * those candidates against the complete bundle, builds graph indexes, and
 * derives incoming backlinks. External and fragment-only links remain on their
 * source concept for consumers, but are deliberately excluded from graph maps.
 */
export function buildOkfBundle(options: BuildOkfBundleOptions): OkfBundle {
  const inputConcepts = [...options.concepts].sort(compareConcepts);
  const reservedDocuments = [...options.reservedDocuments].sort((left, right) =>
    compareStrings(left.filePath, right.filePath),
  );
  const fatalErrors = [...(options.fatalErrors ?? [])];
  const warnings = [...(options.warnings ?? [])];

  const sourceConceptsById = new Map<string, OkfConcept>();
  const sourceConceptsByPath = new Map<string, OkfConcept>();

  for (const concept of inputConcepts) {
    const existing = sourceConceptsById.get(concept.id);
    if (existing) {
      if (!duplicateIssueAlreadyExists(fatalErrors, concept.id)) {
        fatalErrors.push({
          severity: "fatal",
          code: "duplicate-concept-id",
          message: `Duplicate normalized concept ID "${concept.id}".`,
          filePath: concept.filePath,
          sourceId: concept.id,
        });
      }
      continue;
    }

    sourceConceptsById.set(concept.id, concept);
    sourceConceptsByPath.set(concept.filePath, concept);
  }

  const reservedPaths = new Set(reservedDocuments.map((document) => document.filePath));

  const concepts = inputConcepts.map((concept): OkfConcept => {
    const outgoingLinks = concept.outgoingLinks.map((link): OkfLink => {
      if (link.external || isFragmentOnly(link.rawTarget)) {
        return {
          ...link,
          resolved: false,
          broken: false,
        };
      }

      const targetConcept =
        (link.targetId ? sourceConceptsById.get(link.targetId) : undefined) ??
        (link.targetPath ? sourceConceptsByPath.get(link.targetPath) : undefined);

      if (targetConcept) {
        return {
          ...link,
          targetId: targetConcept.id,
          targetPath: targetConcept.filePath,
          resolved: true,
          broken: false,
        };
      }

      if (link.targetPath && reservedPaths.has(link.targetPath)) {
        return {
          ...link,
          targetId: undefined,
          resolved: true,
          broken: false,
        };
      }

      // A path-escape has no candidate target and is already a fatal parser
      // issue. Only well-formed internal candidates become broken warnings.
      if (!link.targetId && !link.targetPath) {
        return {
          ...link,
          resolved: false,
          broken: false,
        };
      }

      warnings.push({
        severity: "warning",
        code: "broken-link",
        message: `Broken internal link from "${concept.id}" to "${link.rawTarget}".`,
        filePath: concept.filePath,
        sourceId: concept.id,
        rawTarget: link.rawTarget,
      });

      return {
        ...link,
        resolved: false,
        broken: true,
      };
    });

    return {
      ...concept,
      outgoingLinks,
      incomingLinks: [],
    };
  });

  const conceptsById = new Map<string, OkfConcept>();
  const conceptsByType = new Map<string, OkfConcept[]>();
  const outgoing = new Map<string, OkfLink[]>();
  const incoming = new Map<string, OkfLink[]>();

  for (const concept of concepts) {
    if (!conceptsById.has(concept.id)) {
      conceptsById.set(concept.id, concept);
    }

    const conceptsOfType = conceptsByType.get(concept.type) ?? [];
    conceptsOfType.push(concept);
    conceptsByType.set(concept.type, conceptsOfType);

    if (!outgoing.has(concept.id)) outgoing.set(concept.id, []);
    if (!incoming.has(concept.id)) incoming.set(concept.id, []);
  }

  for (const concept of concepts) {
    const graphLinks = outgoing.get(concept.id);
    if (!graphLinks) continue;

    for (const link of concept.outgoingLinks) {
      if (!link.resolved || !link.targetId) continue;

      const targetConcept = conceptsById.get(link.targetId);
      const incomingLinks = incoming.get(link.targetId);
      if (!targetConcept || !incomingLinks) continue;

      graphLinks.push(link);
      incomingLinks.push(link);
      targetConcept.incomingLinks.push(link);
    }
  }

  return {
    rootPath: options.rootPath,
    okfVersion: options.okfVersion,
    markdownFileCount: options.markdownFileCount,
    concepts,
    conceptsById,
    conceptsByType,
    outgoing,
    incoming,
    reservedDocuments,
    warnings,
    fatalErrors,
  };
}
