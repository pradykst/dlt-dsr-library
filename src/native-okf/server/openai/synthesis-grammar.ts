import "server-only";

import {
  synthesisEdgeStructuralClass,
  synthesisPrimaryLayer,
  type DiagramEdgeProvenance,
  type DiagramNodeProvenance,
  type DiagramStage,
  type SynthesisEdgeStructuralClass,
  type SynthesisPrimaryLayer,
} from "../../shared/chat-types.ts";

/** Minimal node view the grammar needs; GeneratedDiagramNode is assignable. */
export interface SynthesisGrammarNode {
  id: string;
  stage: DiagramStage;
  provenance: DiagramNodeProvenance;
  label: string;
}

/** Minimal edge view the grammar needs; GeneratedDiagramEdge is assignable. */
export interface SynthesisGrammarEdge {
  source: string;
  target: string;
  /** The relationship type from the closed controlled vocabulary. */
  label: string;
  provenance: DiagramEdgeProvenance;
}

/**
 * Deterministic grammar for a synthesized DESIGN PROPOSAL graph.
 *
 * Single source of truth for the PRIMARY vs SECONDARY relation grammar and the
 * primary connectivity invariants from the DSR methodological brief. It operates
 * on the already-converted proposal graph (proposal nodes + proposal edges) and
 * is NEVER applied to stored paper maps.
 *
 * PRIMARY design flow is the FIXED SEMANTIC ONTOLOGY, independent of which
 * layers a particular graph happens to populate:
 *
 *   Problem -> Requirement -> Design Principle -> Design Feature -> Artifact
 *   Artifact -> Evaluation        (optional post-artifact attachment)
 *   Artifact -> Outcome           (optional post-artifact attachment)
 *   Evaluation -> Outcome         (optional)
 *
 * A primary edge is legal ONLY when its two endpoints are adjacent semantic
 * roles in that ontology. `Requirement -> Feature` is invalid even when the
 * graph contains zero Principle nodes: that is a structurally incomplete
 * proposal (`illegal-primary-edge:requirement->feature` + `missing-principle-layer`).
 *
 * SECONDARY dependencies express same-role ordering only. They never satisfy a
 * primary parent/child requirement, never complete a primary path, and are not
 * counted in Problem->Requirement->Principle->Feature->Artifact coverage:
 *
 *   Design Principle -> Design Principle   "depends on"
 *   Design Feature   -> Design Feature     "depends on"
 *   Design Feature   -> Design Feature     "interoperates with"
 *
 * The grammar has ZERO assumptions about equal layer counts, one-to-one
 * mappings, or a fixed number of branches. Any cardinality (1/1/1, 2/4/3,
 * 5/2/6, 3/5/2, ...) is structurally legal when every node satisfies primary
 * connectivity, and many-to-many primary edges are expected.
 */

export interface SynthesisGrammarOptions {
  /**
   * The researcher asked for a complete proposed solution / diagram. Adds the
   * unconditional "layer must contain at least one node" invariants for
   * requirement, principle, feature, and artifact. Independent of this flag, an
   * edge that skips a semantic role over an empty layer is always illegal.
   */
  requireFullProposal: boolean;
}

/** Fixed ordinal of each semantic role in the primary design-knowledge ontology. */
const PRIMARY_LAYER_INDEX: Readonly<Record<SynthesisPrimaryLayer, number>> = {
  problem: 0,
  requirement: 1,
  principle: 2,
  feature: 3,
  artifact: 4,
  evaluation: 5,
  outcome: 6,
};

/** Exhaustive set of legal PRIMARY (source role -> target role) transitions. */
const LEGAL_PRIMARY_TRANSITIONS: ReadonlySet<string> = new Set([
  "problem->requirement",
  "requirement->principle",
  "principle->feature",
  "feature->artifact",
  "artifact->evaluation",
  "artifact->outcome",
  "evaluation->outcome",
]);

/** Legal SECONDARY (source role -> target role) transitions, by structural role. */
const LEGAL_SECONDARY_TRANSITIONS: ReadonlySet<string> = new Set([
  "principle->principle",
  "feature->feature",
]);

/** Core layers that a full proposal must populate, and that a skip may never cross while empty. */
const CORE_LAYERS: readonly SynthesisPrimaryLayer[] = [
  "requirement",
  "principle",
  "feature",
];

// -- Bounded, deterministic semantic-role heuristics -------------------------
// These flag only unambiguous role violations. Genuinely ambiguous natural
// language (for example "provide selective disclosure", which can be a
// principle or a feature depending on context) is left to the generation and
// repair prompt contracts, not keyword matching.

const MECHANISM_LEAD_PATTERN =
  /^(?:use|adopt|deploy|implement|integrate|build|install|configure|apply|leverage|utili[sz]e|run|enable\s+via)\b/iu;
const BARE_TECHNOLOGY_PATTERN =
  /^(?:a\s+)?(?:ipfs|blockchain|dlt|smart\s+contracts?|dids?|verifiable\s+credentials?|kafka|graphql|rest\s+api|oauth|jwt|zk[\s-]?snarks?|merkle\s+trees?)\.?$/iu;
const ABSTRACT_QUALITY_PATTERN =
  /^(?:privacy|trust|security|interoperability|traceability|transparency|accountability|autonomy|scalability|usability|resilience|fairness|integrity|confidentiality|reliability)\.?$/iu;

export function synthesisNodeRoleViolation(
  node: Pick<SynthesisGrammarNode, "label" | "stage">,
): string | null {
  const layer = synthesisPrimaryLayer(node.stage);
  const label = node.label.trim();
  if (layer === "requirement") {
    if (MECHANISM_LEAD_PATTERN.test(label) || BARE_TECHNOLOGY_PATTERN.test(label)) {
      return "invalid-node-role:requirement-is-mechanism";
    }
  }
  if (layer === "principle" && BARE_TECHNOLOGY_PATTERN.test(label)) {
    return "invalid-node-role:principle-names-technology";
  }
  if (layer === "feature" && ABSTRACT_QUALITY_PATTERN.test(label)) {
    return "invalid-node-role:feature-too-abstract";
  }
  return null;
}

// -- Problem space vs solution space ----------------------------------------
// The Problem node states the undesirable current state, deficiency, need, or
// opportunity that motivates the design. The Artifact node names the designed
// solution. Naming the problem after the solution collapses the two spaces and
// makes the proposal methodologically unreadable, so the deterministic check
// below is a backstop behind correct field separation upstream.
//
// It is deliberately narrow. Problem and artifact labels routinely and
// legitimately share domain vocabulary ("Fragmented identity records across
// marketplaces" / "Cross-marketplace identity resolution service"), and words
// like system, platform, marketplace, trust, or identity are never themselves
// evidence of conflation. Only two shapes are rejected: the same phrase up to
// cosmetic differences, and the artifact's own multi-word name reproduced
// verbatim inside the problem label.

export const SYNTHESIS_PROBLEM_ARTIFACT_CONFLATION_CODE =
  "problem-label-restates-artifact";

/** Closed list of function words; no domain vocabulary is ever removed. */
const LABEL_FUNCTION_WORDS: ReadonlySet<string> = new Set([
  "a", "an", "the", "and", "or", "of", "for", "to", "in", "on", "at", "by",
  "as", "from", "into", "with", "without", "across", "between", "within",
  "that", "this", "these", "those", "its", "their", "is", "are", "be",
]);

/**
 * Content tokens of a label: case, punctuation, hyphenation, diacritic form,
 * function words, and simple plurals are all normalized away, so only the
 * substantive wording remains.
 */
export function synthesisLabelContentTokens(label: string): string[] {
  return label
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/u)
    .filter((token) => token !== "" && !LABEL_FUNCTION_WORDS.has(token))
    .map((token) =>
      token.length > 3 && token.endsWith("s") && !token.endsWith("ss")
        ? token.slice(0, -1)
        : token
    );
}

function containsRun(
  haystack: readonly string[],
  needle: readonly string[],
): boolean {
  if (needle.length === 0 || needle.length > haystack.length) return false;
  for (let start = 0; start + needle.length <= haystack.length; start += 1) {
    if (needle.every((token, offset) => haystack[start + offset] === token)) {
      return true;
    }
  }
  return false;
}

/**
 * Returns the conflation diagnostic when the Problem label is really the
 * Artifact's name, and `null` for every legitimate pairing, including ones that
 * share substantial domain vocabulary.
 */
export function synthesisProblemArtifactConflation(
  problemLabel: string,
  artifactLabels: readonly string[],
): string | null {
  const problem = synthesisLabelContentTokens(problemLabel);
  if (problem.length === 0) return null;
  const problemTokens = new Set(problem);
  for (const artifactLabel of artifactLabels) {
    const artifact = synthesisLabelContentTokens(artifactLabel);
    if (artifact.length === 0) continue;
    // The same phrase up to word order, plural, hyphenation, or casing.
    if (
      artifact.length === problem.length &&
      artifact.every((token) => problemTokens.has(token))
    ) {
      return SYNTHESIS_PROBLEM_ARTIFACT_CONFLATION_CODE;
    }
    // The artifact's own multi-word name, verbatim, inside the problem label:
    // the problem node has been given the solution's name plus qualifiers. The
    // reverse containment is not rejected, because an artifact legitimately
    // names the problem domain it addresses.
    if (artifact.length >= 2 && containsRun(problem, artifact)) {
      return SYNTHESIS_PROBLEM_ARTIFACT_CONFLATION_CODE;
    }
  }
  return null;
}

// -- Grammar evaluation ------------------------------------------------------

export interface SynthesisGrammarInput {
  nodes: readonly SynthesisGrammarNode[];
  edges: readonly SynthesisGrammarEdge[];
}

interface ClassifiedEdge {
  structuralClass: SynthesisEdgeStructuralClass | null;
  sourceLayer: SynthesisPrimaryLayer | null;
  targetLayer: SynthesisPrimaryLayer | null;
  sourceId: string;
  targetId: string;
}

/** True when this edge is a legal, adjacency-respecting PRIMARY design-flow edge. */
function isLegalPrimaryEdge(edge: ClassifiedEdge): boolean {
  return (
    edge.structuralClass === "primary" &&
    edge.sourceLayer !== null &&
    edge.targetLayer !== null &&
    LEGAL_PRIMARY_TRANSITIONS.has(`${edge.sourceLayer}->${edge.targetLayer}`)
  );
}

/**
 * Returns a de-duplicated list of precise diagnostic codes for the synthesized
 * proposal grammar. An empty list means the topology is grammatically valid.
 */
export function synthesisGrammarDiagnostics(
  input: SynthesisGrammarInput,
  options: SynthesisGrammarOptions,
): string[] {
  const diagnostics: string[] = [];
  const nodeById = new Map(input.nodes.map((node) => [node.id, node]));

  // 1. Evidence is not topology. A synthesized proposal graph contains proposal
  //    nodes and proposal edges only; stored concepts stay inspectable as
  //    evidence (citations, source cards, evidence drawer), never as vertices
  //    or edges.
  if (input.nodes.some((node) => node.provenance === "stored")) {
    diagnostics.push("evidence-used-as-topology:stored-node");
  }
  if (input.edges.some((edge) => edge.provenance === "stored")) {
    diagnostics.push("evidence-used-as-topology:stored-edge");
  }

  // 2. Bounded semantic-role validation.
  for (const node of input.nodes) {
    if (synthesisPrimaryLayer(node.stage) === "problem") continue;
    const violation = synthesisNodeRoleViolation(node);
    if (violation) diagnostics.push(violation);
  }

  // 3. Problem space stays distinct from solution space.
  const problemNode = input.nodes.find(
    (node) => synthesisPrimaryLayer(node.stage) === "problem",
  );
  if (problemNode) {
    const conflation = synthesisProblemArtifactConflation(
      problemNode.label,
      input.nodes
        .filter((node) => synthesisPrimaryLayer(node.stage) === "artifact")
        .map((node) => node.label),
    );
    if (conflation) diagnostics.push(conflation);
  }

  const classified: ClassifiedEdge[] = input.edges.map((edge) => {
    const source = nodeById.get(edge.source);
    const target = nodeById.get(edge.target);
    return {
      structuralClass: synthesisEdgeStructuralClass(edge.label),
      sourceLayer: source ? synthesisPrimaryLayer(source.stage) : null,
      targetLayer: target ? synthesisPrimaryLayer(target.stage) : null,
      sourceId: edge.source,
      targetId: edge.target,
    };
  });

  const presentLayers = new Set<SynthesisPrimaryLayer>();
  for (const node of input.nodes) {
    const layer = synthesisPrimaryLayer(node.stage);
    if (layer) presentLayers.add(layer);
  }

  // 4. Edge grammar (fixed ontology, not "next present layer").
  for (const edge of classified) {
    const { structuralClass, sourceLayer, targetLayer } = edge;
    if (sourceLayer === null || targetLayer === null) {
      // Unknown/missing endpoint: reported separately by validateGeneratedDiagram.
      continue;
    }
    const transition = `${sourceLayer}->${targetLayer}`;

    if (structuralClass === null) {
      // Not in the closed controlled relationship vocabulary.
      diagnostics.push("unknown-relationship-type");
      continue;
    }

    if (structuralClass === "secondary") {
      if (!LEGAL_SECONDARY_TRANSITIONS.has(transition)) {
        diagnostics.push("invalid-secondary-edge");
      }
      // Secondary edges never participate in primary transitions or coverage.
      continue;
    }

    // Primary edge.
    if (LEGAL_PRIMARY_TRANSITIONS.has(transition)) continue;

    const from = PRIMARY_LAYER_INDEX[sourceLayer];
    const to = PRIMARY_LAYER_INDEX[targetLayer];
    if (to === from) {
      diagnostics.push(`illegal-primary-edge:${sourceLayer}->${targetLayer}`);
    } else if (to < from) {
      diagnostics.push("backward-primary-edge");
    } else {
      // Forward but not adjacent: a skipped semantic role.
      diagnostics.push(`illegal-primary-edge:${sourceLayer}->${targetLayer}`);
      diagnostics.push("skipped-primary-layer");
      for (const core of CORE_LAYERS) {
        const coreIndex = PRIMARY_LAYER_INDEX[core];
        if (coreIndex > from && coreIndex < to && !presentLayers.has(core)) {
          diagnostics.push(`missing-${core}-layer`);
        }
      }
    }
  }

  // 5. Connectivity invariants. Only legal adjacency-respecting primary edges
  //    count towards parent/child coverage.
  const primaryParentLayers = new Map<string, Set<SynthesisPrimaryLayer>>();
  const primaryChildLayers = new Map<string, Set<SynthesisPrimaryLayer>>();
  for (const edge of classified) {
    if (!isLegalPrimaryEdge(edge)) continue;
    (primaryParentLayers.get(edge.targetId) ??
      primaryParentLayers.set(edge.targetId, new Set()).get(edge.targetId)!)
      .add(edge.sourceLayer!);
    (primaryChildLayers.get(edge.sourceId) ??
      primaryChildLayers.set(edge.sourceId, new Set()).get(edge.sourceId)!)
      .add(edge.targetLayer!);
  }

  const nodesInLayer = (layer: SynthesisPrimaryLayer) =>
    input.nodes.filter((node) => synthesisPrimaryLayer(node.stage) === layer);

  if (options.requireFullProposal) {
    for (const core of CORE_LAYERS) {
      if (!presentLayers.has(core)) diagnostics.push(`missing-${core}-layer`);
    }
    if (!presentLayers.has("artifact")) {
      diagnostics.push("missing-artifact-layer");
    }
  }

  const requiresParent: ReadonlyArray<
    [SynthesisPrimaryLayer, SynthesisPrimaryLayer, string]
  > = [
    ["requirement", "problem", "orphan-requirement"],
    ["principle", "requirement", "orphan-principle"],
    ["feature", "principle", "orphan-feature"],
    ["artifact", "feature", "artifact-without-feature"],
  ];
  for (const [childLayer, parentLayer, code] of requiresParent) {
    for (const node of nodesInLayer(childLayer)) {
      if (!primaryParentLayers.get(node.id)?.has(parentLayer)) {
        diagnostics.push(code);
        break;
      }
    }
  }

  // Every feature must contribute to the artifact when one is present.
  if (nodesInLayer("artifact").length > 0) {
    for (const feature of nodesInLayer("feature")) {
      if (!primaryChildLayers.get(feature.id)?.has("artifact")) {
        diagnostics.push("feature-not-composing-artifact");
        break;
      }
    }
  }

  return [...new Set(diagnostics)];
}
