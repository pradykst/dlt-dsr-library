import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { assistantResponseClipboardText } from "../shared/assistant-copy.ts";
import {
  createInitialNativeOkfConversationState,
  MAX_NATIVE_OKF_MODEL_HISTORY_MESSAGES,
  MAX_NATIVE_OKF_SYNTHESIS_DIAGRAM_EDGES,
  MAX_NATIVE_OKF_SYNTHESIS_DIAGRAM_NODES,
  nativeOkfVisibleHistoryExceedsModelContext,
  type GeneratedDiagram,
  type GeneratedDiagramEdge,
  type GeneratedDiagramNode,
  type SynthesisDraftState,
} from "../shared/chat-types.ts";
import { sanitizeGeneratedProse } from "../shared/generated-prose.ts";
import { getOkfBundle } from "../server/cache.ts";
import {
  loadNativeOkfConversationCatalog,
  prepareNativeOkfChatRequest,
} from "../server/conversation.ts";
import {
  associatedConceptsForPaper,
  buildPaperDesignMapFromBundle,
  projectSemanticEdges,
} from "../server/paper-design-map.ts";
import { retrieveOkfContext } from "../server/retrieval.ts";
import {
  DEFAULT_RETRIEVAL_LIMITS,
  MAX_RETRIEVAL_LIMITS,
} from "../server/retrieval-config.ts";
import type { RetrievalResult } from "../server/retrieval-types.ts";
import { userFacingRetrievalWarnings } from "../server/openai/chat.ts";
import { buildNativeOkfGroundedContext } from "../server/openai/context.ts";
import type { NativeOkfDiagramGrounding } from "../server/openai/diagram-grounding.ts";
import { DIAGRAM_LIMITS } from "../server/openai/diagram-schema.ts";
import { validateGeneratedDiagram } from "../server/openai/diagram-validation.ts";
import { NATIVE_OKF_DIAGRAM_INSTRUCTIONS } from "../server/openai/diagram.ts";
import {
  applyNativeOkfSynthesisRefinementPatch,
  NATIVE_OKF_SYNTHESIS_REFINEMENT_INSTRUCTIONS,
  validateNativeOkfSynthesisRefinementPatch,
  type SynthesisRefinementPatch,
} from "../server/openai/synthesis-refinement.ts";
import { NATIVE_OKF_SYSTEM_PROMPT } from "../server/openai/prompts.ts";
import {
  buildGroundedStoredSourceMap,
  buildStoredPaperDesignMap,
} from "../server/openai/stored-source-map.ts";
import {
  NATIVE_OKF_SYNTHESIS_PLAN_INSTRUCTIONS,
  SYNTHESIS_PLAN_LIMITS,
} from "../server/openai/synthesis-plan.ts";

function synthesizedNode(
  id: string,
  label: string,
  stage: GeneratedDiagramNode["stage"],
  order: number,
  support = "fixture/support",
): GeneratedDiagramNode {
  return {
    id,
    label,
    description: `${label} contributes to the grounded flow.`,
    category: stage,
    stage,
    order,
    group: null,
    provenance: "synthesized",
    sourcePaths: [support],
    supportConceptIds: [support],
    synthesisRationale: "Grounded by a current-turn stored concept.",
    synthesis: true,
  };
}

function userProblem(): GeneratedDiagramNode {
  return {
    id: "user-problem",
    label: "Research design problem",
    description: "The problem supplied by the researcher.",
    category: "User problem",
    stage: "problem",
    order: 0,
    group: null,
    provenance: "user-provided",
    sourcePaths: [],
    supportConceptIds: [],
    synthesisRationale: null,
    synthesis: false,
  };
}

function synthesizedEdge(source: string, target: string): GeneratedDiagramEdge {
  return {
    source,
    target,
    label: "informs",
    provenance: "synthesized",
    supportConceptIds: ["fixture/support"],
  };
}

const shapeGrounding: NativeOkfDiagramGrounding = {
  allowedConceptIds: new Set(["fixture/support"]),
  eligibleStoredConceptIds: new Set(["fixture/support"]),
  conceptsById: new Map([["fixture/support", {
    conceptId: "fixture/support",
    title: "Stored support",
    description: "Stored support description.",
    type: "design-principle",
    stage: "design-principle",
  }]]),
  storedRelations: [],
};

test("synthesis topology has no three-branch target and validates unequal many-to-many flows", () => {
  assert.equal(DIAGRAM_LIMITS.maxNodes, 48);
  assert.equal(DIAGRAM_LIMITS.maxEdges, 96);
  assert.equal(SYNTHESIS_PLAN_LIMITS.maxRenderedNodes, 48);
  assert.equal(SYNTHESIS_PLAN_LIMITS.maxRelationships, 96);
  assert.equal(MAX_NATIVE_OKF_SYNTHESIS_DIAGRAM_NODES, 48);
  assert.equal(MAX_NATIVE_OKF_SYNTHESIS_DIAGRAM_EDGES, 96);
  assert.match(NATIVE_OKF_DIAGRAM_INSTRUCTIONS, /Unequal stage sizes/);
  assert.match(NATIVE_OKF_SYNTHESIS_PLAN_INSTRUCTIONS, /many-to-many/);
  assert.match(NATIVE_OKF_SYNTHESIS_PLAN_INSTRUCTIONS, /not output targets/);
  assert.doesNotMatch(
    `${NATIVE_OKF_DIAGRAM_INSTRUCTIONS}\n${NATIVE_OKF_SYNTHESIS_PLAN_INSTRUCTIONS}`,
    /(?:7\s*(?:to|-)\s*12|three major parallel branches|two to four requirements|two to five features)/iu,
  );

  const nodes = [
    userProblem(),
    synthesizedNode("r1", "Requirement one", "design-requirement", 20),
    synthesizedNode("r2", "Requirement two", "design-requirement", 20),
    synthesizedNode("r3", "Requirement three", "design-requirement", 20),
    synthesizedNode("p1", "Principle one", "design-principle", 40),
    synthesizedNode("p2", "Principle two", "design-principle", 40),
    synthesizedNode("f1", "Feature one", "design-feature", 60),
    synthesizedNode("f2", "Feature two", "design-feature", 60),
    synthesizedNode("f3", "Feature three", "design-feature", 60),
    synthesizedNode("f4", "Feature four", "design-feature", 60),
  ];
  const edges = [
    synthesizedEdge("user-problem", "r1"),
    synthesizedEdge("user-problem", "r2"),
    synthesizedEdge("user-problem", "r3"),
    synthesizedEdge("r1", "p1"),
    synthesizedEdge("r1", "p2"),
    synthesizedEdge("r2", "p2"),
    synthesizedEdge("r3", "p2"),
    synthesizedEdge("p1", "f1"),
    synthesizedEdge("p1", "f2"),
    synthesizedEdge("p1", "f3"),
    synthesizedEdge("p1", "f4"),
    synthesizedEdge("p2", "f3"),
  ];
  const result = validateGeneratedDiagram(
    { title: "Dynamic topology", explanation: "Unequal grounded topology.", nodes, edges },
    shapeGrounding,
    { mode: "synthesized", requireRpfPath: false, requireDisplayedStoredSupport: false },
  );
  assert.equal(result.ok, true, result.ok ? "" : result.errors.join("\n"));
  assert.equal(nodes.filter((node) => node.stage === "design-requirement").length, 3);
  assert.equal(nodes.filter((node) => node.stage === "design-principle").length, 2);
  assert.equal(nodes.filter((node) => node.stage === "design-feature").length, 4);
});

async function refinementFixture() {
  const bundle = await getOkfBundle();
  const stored = [...bundle.conceptsById.values()].filter((concept) =>
    concept.type !== "paper" && concept.type !== "reference"
  );
  const oldSupport = stored[0]!;
  const freshSupport = stored[1]!;
  const grounding: NativeOkfDiagramGrounding = {
    allowedConceptIds: new Set([freshSupport.id]),
    eligibleStoredConceptIds: new Set([freshSupport.id]),
    conceptsById: new Map([[freshSupport.id, {
      conceptId: freshSupport.id,
      title: freshSupport.title ?? freshSupport.id,
      description: freshSupport.description ?? freshSupport.title ?? freshSupport.id,
      type: freshSupport.type,
      stage: "design-requirement",
    }]]),
    storedRelations: [],
  };
  const prior: SynthesisDraftState = {
    version: 1,
    problemStatement: "A generic cross-platform verification problem.",
    domain: "cross-platform verification",
    objective: null,
    constraints: [],
    nodes: [
      userProblem(),
      synthesizedNode("r1", "Existing requirement", "design-requirement", 20, oldSupport.id),
      synthesizedNode("p1", "Existing principle", "design-principle", 40, oldSupport.id),
      synthesizedNode("f1", "Existing feature", "design-feature", 60, oldSupport.id),
    ],
    edges: [
      { ...synthesizedEdge("user-problem", "r1"), supportConceptIds: [oldSupport.id] },
      { ...synthesizedEdge("r1", "p1"), supportConceptIds: [oldSupport.id] },
      { ...synthesizedEdge("p1", "f1"), supportConceptIds: [oldSupport.id] },
    ],
  };
  return { prior, grounding, oldSupportId: oldSupport.id, freshSupportId: freshSupport.id };
}

function emptyPatch(): SynthesisRefinementPatch {
  return { addNodes: [], updateNodes: [], removeNodeIds: [], addEdges: [], removeEdges: [] };
}

test("validated refinement patches preserve prior graph elements and ground new operations freshly", async () => {
  const { prior, grounding, freshSupportId } = await refinementFixture();
  const add = emptyPatch();
  add.addNodes.push({
    key: "governance-requirement",
    label: "Governance requirement",
    description: "Define accountable governance for the artifact.",
    category: "Design requirement",
    stage: "design-requirement",
    supportConceptIds: [freshSupportId],
    reuseStoredConceptId: null,
    synthesisRationale: "The fresh stored concept supports an accountable governance adaptation.",
  });
  add.addEdges.push({
    source: "user-problem",
    target: "refine-governance-requirement",
    label: "requires",
    supportConceptIds: [freshSupportId],
  });
  const added = await applyNativeOkfSynthesisRefinementPatch(
    prior,
    add,
    grounding,
    prior.problemStatement,
    false,
  );
  assert.equal(added.ok, true, added.ok ? "" : added.errors.join("\n"));
  if (!added.ok) return;
  assert.deepEqual(
    added.diagram.nodes.slice(0, prior.nodes.length),
    prior.nodes,
  );
  assert.deepEqual(
    added.diagram.edges.slice(0, prior.edges.length),
    prior.edges,
  );
  assert.ok(added.diagram.nodes.some((node) => node.id === "refine-governance-requirement"));

  const addEdge = emptyPatch();
  addEdge.addEdges.push({
    source: "r1",
    target: "f1",
    label: "also informs",
    supportConceptIds: [freshSupportId],
  });
  const edged = await applyNativeOkfSynthesisRefinementPatch(
    prior,
    addEdge,
    grounding,
    prior.problemStatement,
    false,
  );
  assert.equal(edged.ok, true);
  if (edged.ok) assert.deepEqual(edged.diagram.edges.slice(0, prior.edges.length), prior.edges);

  const unknownSupport = validateNativeOkfSynthesisRefinementPatch(
    {
      addNodes: [{ ...add.addNodes[0], supportConceptIds: ["not/current-turn"] }],
      updateNodes: [],
      removeNodeIds: [],
      addEdges: [],
      removeEdges: [],
    },
    grounding,
    "Add another requirement.",
  );
  assert.equal(unknownSupport.ok, false);
  assert.match(NATIVE_OKF_SYNTHESIS_REFINEMENT_INSTRUCTIONS, /fresh current-turn allowlist/);
  assert.match(NATIVE_OKF_SYNTHESIS_REFINEMENT_INSTRUCTIONS, /preserve every existing node and edge/iu);
});

test("explicit remove and replace patches affect only targeted graph elements", async () => {
  const { prior, grounding, freshSupportId } = await refinementFixture();
  const remove = validateNativeOkfSynthesisRefinementPatch(
    { ...emptyPatch(), removeNodeIds: ["f1"] },
    grounding,
    "Remove the feature from the proposal.",
  );
  assert.equal(remove.ok, true);
  if (!remove.ok) return;
  const removed = await applyNativeOkfSynthesisRefinementPatch(
    prior,
    remove.patch,
    grounding,
    prior.problemStatement,
    false,
  );
  assert.equal(removed.ok, true);
  if (removed.ok) {
    assert.deepEqual(removed.diagram.nodes.map((node) => node.id), ["user-problem", "r1", "p1"]);
    assert.deepEqual(removed.diagram.edges, prior.edges.slice(0, 2));
  }

  const replace = validateNativeOkfSynthesisRefinementPatch(
    {
      ...emptyPatch(),
      updateNodes: [{
        nodeId: "r1",
        label: "Revised requirement",
        description: "A targeted revised requirement.",
        category: "Design requirement",
        stage: "design-requirement",
        supportConceptIds: [freshSupportId],
        synthesisRationale: "Fresh evidence supports the targeted revision.",
      }],
    },
    grounding,
    "Replace the existing requirement with a revised requirement.",
  );
  assert.equal(replace.ok, true);
  if (!replace.ok) return;
  const replaced = await applyNativeOkfSynthesisRefinementPatch(
    prior,
    replace.patch,
    grounding,
    prior.problemStatement,
    false,
  );
  assert.equal(replaced.ok, true);
  if (replaced.ok) {
    assert.equal(replaced.diagram.nodes.find((node) => node.id === "r1")?.label, "Revised requirement");
    assert.deepEqual(replaced.diagram.nodes.filter((node) => node.id !== "r1"), prior.nodes.filter((node) => node.id !== "r1"));
    assert.deepEqual(replaced.diagram.edges, prior.edges);
  }
});

test("all paper maps are complete, category-complete, and deterministic", async () => {
  const bundle = await getOkfBundle();
  const papers = [...(bundle.conceptsByType.get("paper") ?? [])];
  assert.equal(papers.length, 34);
  for (const paper of papers) {
    const canonical = buildPaperDesignMapFromBundle(bundle, paper);
    const first = await buildStoredPaperDesignMap(paper.id);
    const second = await buildStoredPaperDesignMap(paper.id);
    assert.ok(first && second, paper.id);
    assert.deepEqual(first.nodes.map((node) => node.id), canonical.nodes.map((node) => node.id), paper.id);
    assert.deepEqual(
      first.edges.map((edge) => [edge.source, edge.target, edge.label]),
      canonical.edges.map((edge) => [edge.sourceId, edge.targetId, edge.label]),
      paper.id,
    );
    assert.deepEqual(second, first, paper.id);

    for (const kind of ["requirement", "principle", "feature"] as const) {
      const restricted = await buildStoredPaperDesignMap(paper.id, [kind]);
      assert.ok(restricted);
      const expected = associatedConceptsForPaper(bundle, paper).filter((concept) =>
        kind === "requirement"
          ? concept.type === "design-requirement"
          : kind === "principle"
            ? concept.type === "design-principle"
            : concept.type === "design-feature"
      );
      assert.deepEqual(
        new Set(restricted.nodes.map((node) => node.id)),
        new Set(expected.map((concept) => concept.id)),
        `${paper.id}:${kind}`,
      );
      const expectedIds = new Set(expected.map((concept) => concept.id));
      assert.ok(restricted.edges.every((edge) =>
        expectedIds.has(edge.source) && expectedIds.has(edge.target)
      ));
    }
  }

  const regressionPaper = papers.find((paper) =>
    paper.title === "Blockchain for the IoT: A Systematic Literature Review"
  ) ?? papers.find((paper) => /Blockchain for the IoT/iu.test(paper.title ?? ""));
  assert.ok(regressionPaper);
  const regressionMap = await buildStoredPaperDesignMap(regressionPaper.id);
  assert.equal(regressionMap?.nodes.length, 17);
  assert.equal(regressionMap?.edges.length, 14);
});

test("stored-map paraphrases route deterministically and New Chat has an empty draft", async () => {
  const catalog = await loadNativeOkfConversationCatalog();
  const paper = catalog.papers[0]!;
  for (const question of [
    `Give me the RPF diagram for ${paper.title}.`,
    `Map this paper: ${paper.title}.`,
    `Visualize the represented design knowledge of ${paper.title}.`,
  ]) {
    const prepared = await prepareNativeOkfChatRequest({ question }, catalog);
    assert.equal(prepared.queryMode, "STORED_PAPER_DIAGRAM", question);
    assert.equal(prepared.preferDeterministicPaperMap, true, question);
  }
  assert.equal(createInitialNativeOkfConversationState().latestValidatedSynthesisDraft, null);
});

test("narrow relationships may use two nodes while broad evidence expands canonical neighbors", async () => {
  const bundle = await getOkfBundle();
  const paper = [...(bundle.conceptsByType.get("paper") ?? [])].find((candidate) => {
    const concepts = associatedConceptsForPaper(bundle, candidate);
    return projectSemanticEdges(bundle, concepts).length > 0;
  });
  assert.ok(paper);
  const concepts = associatedConceptsForPaper(bundle, paper);
  const relation = projectSemanticEdges(bundle, concepts)[0]!;
  const source = bundle.conceptsById.get(relation.sourceId)!;
  const target = bundle.conceptsById.get(relation.targetId)!;
  const grounding: NativeOkfDiagramGrounding = {
    allowedConceptIds: new Set([source.id, target.id]),
    eligibleStoredConceptIds: new Set([source.id, target.id]),
    conceptsById: new Map([
      [source.id, { conceptId: source.id, title: source.title ?? source.id, description: source.description ?? source.id, type: source.type, stage: "design-requirement" }],
      [target.id, { conceptId: target.id, title: target.title ?? target.id, description: target.description ?? target.id, type: target.type, stage: "design-principle" }],
    ]),
    storedRelations: [relation],
  };
  const twoNode: GeneratedDiagram = {
    title: "Exact represented relationship",
    explanation: "The exact requested canonical relationship.",
    nodes: [
      { ...synthesizedNode(source.id, source.title ?? source.id, "design-requirement", 20, source.id), provenance: "stored", synthesis: false, synthesisRationale: null },
      { ...synthesizedNode(target.id, target.title ?? target.id, "design-principle", 40, target.id), provenance: "stored", synthesis: false, synthesisRationale: null },
    ],
    edges: [{ source: source.id, target: target.id, label: relation.label, provenance: "stored", supportConceptIds: [source.id, target.id] }],
  };
  assert.equal(validateGeneratedDiagram(twoNode, grounding, { mode: "stored" }).ok, true);

  const retrieval = await retrieveOkfContext("represented design knowledge relationships");
  const broad = await buildGroundedStoredSourceMap(retrieval);
  assert.ok(broad);
  assert.ok(broad.nodes.length > 2, `${broad.nodes.length} nodes`);
  assert.ok(broad.edges.length > 1, `${broad.edges.length} edges`);
});

test("increased serialized context protects required evidence and never sends raw whole-corpus Markdown", async () => {
  assert.equal(DEFAULT_RETRIEVAL_LIMITS.maxContextCharacters, 76_000);
  assert.equal(DEFAULT_RETRIEVAL_LIMITS.maxConcepts, 28);
  assert.equal(MAX_RETRIEVAL_LIMITS.maxContextCharacters, 80_000);
  const retrieval = await retrieveOkfContext("design knowledge relationships across blockchain artifacts");
  const context = buildNativeOkfGroundedContext(retrieval, "design knowledge relationships across blockchain artifacts");
  assert.ok(context.prompt.length <= retrieval.debug.limits.maxContextCharacters);
  assert.ok(context.sources.length <= DEFAULT_RETRIEVAL_LIMITS.maxConcepts);

  const bundle = await getOkfBundle();
  const rawCorpusCharacters = [...bundle.conceptsById.values()].reduce(
    (sum, concept) => sum + concept.markdownBody.length,
    0,
  );
  assert.ok(context.prompt.length < rawCorpusCharacters);
  assert.ok(context.sources.length < bundle.conceptsById.size);

  const required = retrieval.finalConcepts[0]!;
  const optional = {
    ...retrieval.finalConcepts[1]!,
    expansionDepth: 2 as const,
    markdownBody: "optional background ".repeat(400),
  };
  const minimalRetrieval: RetrievalResult = {
    ...retrieval,
    finalConcepts: [required],
    corpusOverview: { paperCount: 0, papers: [] },
    structuredAnalysis: undefined,
    debug: {
      ...retrieval.debug,
      limits: { ...retrieval.debug.limits, maxContextCharacters: 80_000 },
    },
  };
  const requiredOnly = buildNativeOkfGroundedContext(
    minimalRetrieval,
    "Required evidence",
    [required.conceptId],
  );
  const tightRetrieval: RetrievalResult = {
    ...minimalRetrieval,
    finalConcepts: [required, optional],
    debug: {
      ...minimalRetrieval.debug,
      limits: {
        ...minimalRetrieval.debug.limits,
        maxContextCharacters: requiredOnly.prompt.length + 200,
      },
    },
  };
  const tight = buildNativeOkfGroundedContext(
    tightRetrieval,
    "Required evidence",
    [required.conceptId],
  );
  assert.ok(tight.allowedConceptIds.has(required.conceptId));
  assert.equal(tight.allowedConceptIds.has(optional.conceptId), false);
  assert.equal(tight.packing?.optionalConceptsDropped, 1);
});

test("optional trimming is diagnostic while material required-evidence loss is actionable", async () => {
  const retrieval = await retrieveOkfContext("design knowledge relationships");
  const technical = {
    ...retrieval,
    warnings: ["One or more concepts were omitted because the context limit was exhausted."],
  };
  assert.deepEqual(userFacingRetrievalWarnings(technical, []), []);
  const retained = new Set(retrieval.finalConcepts.map((concept) => concept.conceptId));
  assert.deepEqual(
    userFacingRetrievalWarnings(technical, ["required/missing"], retained),
    ["Some directly requested stored records could not fit within the bounded answer context; narrow the paper or concept category and try again."],
  );
});

test("drawer, source disclosure, copy, and history UI expose the reviewed behavior", async () => {
  const presentation = await readFile(
    new URL("../components/chat/GeneratedDiagramPresentation.tsx", import.meta.url),
    "utf8",
  );
  const answer = await readFile(
    new URL("../components/chat/ChatAnswer.tsx", import.meta.url),
    "utf8",
  );
  const copyButton = await readFile(
    new URL("../components/chat/CopyAssistantResponseButton.tsx", import.meta.url),
    "utf8",
  );
  const workbench = await readFile(
    new URL("../components/chat/ChatWorkbench.tsx", import.meta.url),
    "utf8",
  );
  assert.match(presentation, /z-40[\s\S]*bg-white[\s\S]*opacity-100/);
  assert.doesNotMatch(presentation, /bg-white\/98/);
  assert.match(presentation, /Synthesized proposal/);
  assert.match(presentation, /not stored\s+directly in the source corpus/);
  assert.match(presentation, /Supporting stored concepts/);
  assert.match(presentation, /source\?\.title/);
  assert.match(presentation, /source\?\.sourcePaper/);
  assert.match(answer, /<CopyAssistantResponseButton/);
  assert.match(answer, /<SourceCollection[\s\S]*collapsed[\s\S]*\/>/);
  assert.match(copyButton, /navigator\.clipboard\.writeText/);
  assert.match(copyButton, /aria-live="polite"/);
  assert.match(copyButton, /Copied/);
  assert.match(workbench, /Earlier messages are no longer included/);
  assert.match(workbench, /nativeOkfVisibleHistoryExceedsModelContext/);

  const copied = assistantResponseClipboardText(
    "## Answer\n\n- Stored evidence [[S1]]\n- Ordinary S1 and S10 text stays [[S10]]",
  );
  assert.equal(copied, "## Answer\n\n- Stored evidence\n- Ordinary S1 and S10 text stays");
  assert.doesNotMatch(copied, /\[\[S\d+\]\]/u);
  assert.match(copied, /## Answer/);
  assert.match(copied, /- Stored evidence/);
  assert.doesNotMatch(copied, /Cited native concepts|Response notes|grounding sources/);

  assert.equal(nativeOkfVisibleHistoryExceedsModelContext(MAX_NATIVE_OKF_MODEL_HISTORY_MESSAGES), false);
  assert.equal(nativeOkfVisibleHistoryExceedsModelContext(MAX_NATIVE_OKF_MODEL_HISTORY_MESSAGES + 1), true);
  assert.match(workbench, /setEntries\(\[\]\)/);
  assert.match(workbench, /setConversationState\(createInitialNativeOkfConversationState\(\)\)/);
});

test("generated prose forbids em dashes while stored map code leaves source titles untouched", async () => {
  assert.match(NATIVE_OKF_SYSTEM_PROMPT, /Do not use em dashes/);
  assert.match(NATIVE_OKF_SYNTHESIS_PLAN_INSTRUCTIONS, /Do not use em dashes/);
  assert.equal(sanitizeGeneratedProse("Grounded proposal — with rationale."), "Grounded proposal - with rationale.");
  assert.doesNotMatch(sanitizeGeneratedProse("Grounded proposal — with rationale."), /—/u);
  assert.equal(
    sanitizeGeneratedProse(
      "The Paper — Exact Title supports a proposal — with rationale.",
      ["Paper — Exact Title"],
    ),
    "The Paper — Exact Title supports a proposal - with rationale.",
  );
  const storedMapSource = await readFile(
    new URL("../server/openai/stored-source-map.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(storedMapSource, /sanitizeGeneratedProse/);
});
