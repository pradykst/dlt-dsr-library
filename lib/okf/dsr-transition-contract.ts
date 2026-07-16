import type { OkfConceptType, OkfRelationPredicate } from "./schema.ts";

export type CanonicalDsrTransition = {
  source: OkfConceptType;
  target: OkfConceptType;
  predicates: readonly OkfRelationPredicate[];
};

/**
 * Canonical adjacent transitions used by stored Workbench pathways and flow
 * validation. Relations outside this contract remain valid stored knowledge,
 * but they are not primary seven-layer DSR-path edges.
 */
export const canonicalDsrTransitions: readonly CanonicalDsrTransition[] = [
  { source: "Problem", target: "Design Requirement", predicates: ["motivates", "requires"] },
  { source: "Design Requirement", target: "Design Principle", predicates: ["addressed_by", "satisfies"] },
  { source: "Design Principle", target: "Design Feature", predicates: ["instantiates", "instantiated_by", "implements"] },
  { source: "Design Feature", target: "Artifact", predicates: ["implements", "contributes_to"] },
  { source: "Artifact", target: "Evaluation", predicates: ["evaluated_by"] },
  { source: "Evaluation", target: "Output Knowledge", predicates: ["supports", "contributes_to"] }
] as const;

const predicatesByTransition = new Map<string, ReadonlySet<string>>(
  canonicalDsrTransitions.map((transition) => [
    transitionKey(transition.source, transition.target),
    new Set<string>(transition.predicates)
  ])
);

export function allowedDsrTransitionPredicates(source: string, target: string): readonly string[] {
  return [...(predicatesByTransition.get(transitionKey(source, target)) ?? [])];
}

export function isCanonicalDsrTransition(source: string, target: string, predicate: string): boolean {
  return predicatesByTransition.get(transitionKey(source, target))?.has(predicate) ?? false;
}

export function hasCanonicalDsrLayerTransition(source: string, target: string): boolean {
  return predicatesByTransition.has(transitionKey(source, target));
}

function transitionKey(source: string, target: string) {
  return source + "\u0000" + target;
}