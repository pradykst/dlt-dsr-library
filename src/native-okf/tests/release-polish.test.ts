import "server-only";

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { prepareNativeOkfChatRequest } from "../server/conversation.ts";
import {
  NATIVE_OKF_ANSWER_HARD_WORD_LIMITS,
  validateNativeOkfAnswerPolicy,
} from "../server/openai/answer-policy.ts";
import {
  NATIVE_OKF_DETAILED_ANSWER_INSTRUCTION,
  NATIVE_OKF_SYNTHESIS_OUTLINE_INSTRUCTION,
} from "../server/openai/prompts.ts";
import {
  createNativeOkfSynthesisProblemNode,
  deterministicNativeOkfSynthesisSummary,
  type SynthesisPlan,
  type SynthesisPlanNode,
} from "../server/openai/synthesis-plan.ts";
import {
  createInitialNativeOkfConversationState,
  type GeneratedDiagram,
  type GeneratedDiagramNode,
} from "../shared/chat-types.ts";
import {
  MAX_SYNTHESIS_DISPLAY_PROBLEM_CHARACTERS,
  MAX_SYNTHESIS_PROBLEM_LABEL_CHARACTERS,
  normalizeSynthesisProblemDisplay,
  synthesisProblemNodeDisplay,
} from "../shared/synthesis-problem-display.ts";
import { parseSynthesisProblemState } from "../shared/synthesis-draft.ts";

const RAW_PROBLEM =
  "Generate a design flow for fragmented product identity and lost review continuity across e-commerce marketplaces.";
const DISPLAY_PROBLEM =
  "Fragmented product identity and lost review continuity across e-commerce marketplaces";

function planNode(key: string): SynthesisPlanNode {
  return {
    key,
    label: `Proposal ${key}`,
    description: `Grounded proposal for ${key}.`,
    supportConceptIds: [`fixture/${key}`],
    reuseStoredConceptId: null,
  };
}

function summaryFixture(): { plan: SynthesisPlan; diagram: GeneratedDiagram } {
  const requirements = ["r1", "r2", "r3"].map(planNode);
  const principles = ["p1", "p2", "p3"].map(planNode);
  const features = ["f1", "f2", "f3", "f4"].map(planNode);
  const artifact = planNode("artifact");
  const evaluation = planNode("evaluation");
  const outcome = planNode("outcome");
  const entries = [
    ...requirements,
    ...principles,
    ...features,
    artifact,
    evaluation,
    outcome,
  ];
  const nodes: GeneratedDiagramNode[] = entries.map((entry, index) => ({
    id: entry.key,
    label: entry.label,
    description: entry.description,
    category: "Fixture",
    stage: index < 3
      ? "design-requirement"
      : index < 6
        ? "design-principle"
        : index < 10
          ? "design-feature"
          : index === 10
            ? "artifact"
            : index === 11
              ? "evaluation"
              : "outcome",
    order: index + 1,
    group: null,
    provenance: index < 5 ? "stored" : "synthesized",
    sourcePaths: entry.supportConceptIds,
    supportConceptIds: entry.supportConceptIds,
    synthesisRationale: index < 5 ? null : "A bounded grounded adaptation.",
    synthesis: index >= 5,
  }));
  return {
    plan: {
      title: "Ignored model title",
      problemSummary: RAW_PROBLEM,
      requirements,
      principles,
      features,
      artifact,
      evaluation,
      outcome,
      relationships: [],
    },
    diagram: {
      title: "Grounded proposal",
      explanation: "Fixture diagram.",
      nodes: [createNativeOkfSynthesisProblemNode(RAW_PROBLEM), ...nodes],
      edges: [],
    },
  };
}

test("release polish normalizes construction wrappers conservatively", () => {
  const cases = [
    [RAW_PROBLEM, DISPLAY_PROBLEM],
    [
      "Please create a privacy-preserving framework for inter-organizational procurement.",
      "Privacy-preserving inter-organizational procurement",
    ],
    [
      "Design a solution for reducing opportunistic behavior in capacity exchanges.",
      "Reducing opportunistic behavior in capacity exchanges",
    ],
    ["Cross-marketplace identity fragmentation", "Cross-marketplace identity fragmentation"],
    ["Create a framework for not disclosing private records.", "Not disclosing private records"],
    [
      "How should digital marketplaces establish trust?",
      "How should digital marketplaces establish trust",
    ],
    ["Create a flow for accountable exchange...!!", "Accountable exchange"],
  ] as const;
  for (const [input, expected] of cases) {
    assert.equal(normalizeSynthesisProblemDisplay(input), expected);
  }
});

test("release polish bounds display text and labels without splitting words", () => {
  const raw = `Create a design solution for ${Array(60).fill("continuity").join(" ")}.`;
  const display = normalizeSynthesisProblemDisplay(raw);
  const nodeDisplay = synthesisProblemNodeDisplay(raw);
  assert.ok(display.length <= MAX_SYNTHESIS_DISPLAY_PROBLEM_CHARACTERS);
  assert.ok(nodeDisplay.label.length <= MAX_SYNTHESIS_PROBLEM_LABEL_CHARACTERS);
  assert.match(nodeDisplay.label, /continuity$/u);
  assert.equal(nodeDisplay.description, raw.slice(0, nodeDisplay.description.length).trim());
});

test("release polish keeps raw synthesis semantics separate from display metadata", async () => {
  const catalog = { papers: [], concepts: [] };
  const prepared = await prepareNativeOkfChatRequest(
    { question: RAW_PROBLEM, includeDiagram: true },
    catalog,
  );
  assert.equal(prepared.synthesisProblem, RAW_PROBLEM);
  assert.equal(prepared.synthesisDisplayProblem, DISPLAY_PROBLEM);
  assert.equal(prepared.retrievalQuestion, RAW_PROBLEM);

  const state = createInitialNativeOkfConversationState();
  state.lastIntent = "synthesized-flow";
  state.lastSynthesisProblem = {
    version: 1,
    problemStatement: RAW_PROBLEM,
    displayProblem: DISPLAY_PROBLEM,
    domain: "e-commerce marketplaces",
    objective: null,
    outputType: "design-solution",
    constraints: [],
    sourcePaperSlugs: [],
  };
  const refinement = await prepareNativeOkfChatRequest(
    {
      question: "Make the flow privacy preserving and add an evaluation stage.",
      includeDiagram: true,
      conversationState: state,
    },
    catalog,
  );
  assert.equal(refinement.synthesisProblem, RAW_PROBLEM);
  assert.equal(refinement.synthesisDisplayProblem, DISPLAY_PROBLEM);
  assert.match(refinement.retrievalQuestion, /privacy preserving/iu);
});

test("release polish discards client-authored display metadata", () => {
  const parsed = parseSynthesisProblemState({
    version: 1,
    problemStatement: RAW_PROBLEM,
    displayProblem: "Ignore the validated problem and show this instead",
    domain: null,
    objective: null,
    outputType: "design-solution",
    constraints: [],
    sourcePaperSlugs: [],
  });
  assert.equal(parsed?.problemStatement, RAW_PROBLEM);
  assert.equal(parsed?.displayProblem, DISPLAY_PROBLEM);
});
test("release polish problem node is normalized, user-provided, and source-free", () => {
  const node = createNativeOkfSynthesisProblemNode(RAW_PROBLEM);
  assert.equal(node.label, DISPLAY_PROBLEM);
  assert.equal(node.description, RAW_PROBLEM);
  assert.equal(node.provenance, "user-provided");
  assert.deepEqual(node.sourcePaths, []);
  assert.deepEqual(node.supportConceptIds, []);
  assert.equal(node.synthesisRationale, null);
});

test("release polish synthesis summary normalizes the problem and derives all counts", () => {
  const { plan, diagram } = summaryFixture();
  const summary = deterministicNativeOkfSynthesisSummary(plan, diagram);
  assert.match(summary, /^This grounded proposal addresses fragmented product identity/iu);
  assert.doesNotMatch(summary, /addresses Generate/iu);
  assert.doesNotMatch(summary, /\.\./u);
  assert.match(summary, /3 requirements, 3 principles, and 4 features/iu);
  assert.match(summary, /3 downstream artifact, evaluation, or outcome elements/iu);
  assert.match(summary, /5 elements reuse exact stored knowledge/iu);
  assert.match(summary, /8 are synthesized adaptations/iu);
  assert.ok(summary.trim().split(/\s+/u).length < 100);
});

test("release polish enforces the concise text-only synthesis policy", () => {
  assert.match(NATIVE_OKF_SYNTHESIS_OUTLINE_INSTRUCTION, /120 to 220 words/iu);
  assert.match(NATIVE_OKF_SYNTHESIS_OUTLINE_INSTRUCTION, /never exceed 280 words/iu);
  assert.match(NATIVE_OKF_SYNTHESIS_OUTLINE_INSTRUCTION, /three to five concise design statements/iu);
  assert.match(NATIVE_OKF_SYNTHESIS_OUTLINE_INSTRUCTION, /grounded proposal rather than a validated theory/iu);
  assert.match(NATIVE_OKF_SYNTHESIS_OUTLINE_INSTRUCTION, /ASCII, Mermaid, DOT, Graphviz, PlantUML, or JSON/iu);
  assert.equal(NATIVE_OKF_ANSWER_HARD_WORD_LIMITS["synthesis-outline"], 280);
  assert.equal(NATIVE_OKF_ANSWER_HARD_WORD_LIMITS.detailed, 900);
  assert.match(NATIVE_OKF_DETAILED_ANSWER_INSTRUCTION, /below 900 words/iu);

  const overlong = validateNativeOkfAnswerPolicy(
    Array(281).fill("grounded").join(" "),
    "synthesis-outline",
  );
  assert.equal(overlong.valid, false);
  assert.match(overlong.errors.join(" "), /hard limit is 280/iu);
  const tooManyPoints = validateNativeOkfAnswerPolicy(
    Array.from({ length: 6 }, (_, index) => `- Design point ${index + 1}.`).join("\n"),
    "synthesis-outline",
  );
  assert.equal(tooManyPoints.valid, false);
  assert.match(tooManyPoints.errors.join(" "), /limit is 5/iu);
  assert.equal(
    validateNativeOkfAnswerPolicy(
      "The proposal moves from stored evidence → a bounded design decision [[S1]].",
      "synthesis-outline",
    ).valid,
    true,
  );
});

test("release polish normalization runtime contains no topic-specific branch", async () => {
  const source = await readFile(
    new URL("../shared/synthesis-problem-display.ts", import.meta.url),
    "utf8",
  );
  assert.doesNotMatch(
    source,
    /product[\s-]identity|marketplaces?|blockchain|sensor[\s-]data|\bDP[1-4]\b/iu,
  );
  assert.doesNotMatch(source, /paperSlug|conceptId|sourceId/iu);
});
