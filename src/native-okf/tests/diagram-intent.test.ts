import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import {
  applyManualDiagramToggle,
  diagramPreferenceForRequest,
  inferDiagramIntent,
  INITIAL_DIAGRAM_INTENT_TOGGLE_STATE,
  reconcileDiagramIntentToggle,
} from "../shared/diagram-intent.ts";

const FLOW_QUESTION =
  "Generate a flow showing what design features implement source-to-sink certification.";
const FLOW_DIAGRAM_QUESTION =
  "Generate a flow diagram showing what design features implement source-to-sink certification.";

test("generic flow language enables diagram intent", () => {
  assert.equal(inferDiagramIntent(FLOW_QUESTION), true);
  assert.equal(inferDiagramIntent(FLOW_DIAGRAM_QUESTION), true);
});

test("generic intent detection is case-insensitive and covers supported forms", () => {
  const questions = [
    "DRAW A DIAGRAM",
    "Show a FLOWCHART",
    "Show a GRAPH",
    "Explain the ARCHITECTURE",
    "VISUALIZE the relationships",
    "VISUALISE the relationships",
    "Generate a DECISION-SUPPORT FLOW",
  ];
  for (const question of questions) {
    assert.equal(inferDiagramIntent(question), true, question);
  }
});

test("generic rendering verbs and imperative map quantifiers activate visual intent", () => {
  for (const question of [
    "Render the requirements, principles, and features map for a study.",
    "Chart the canonical design knowledge of this work.",
    "Show all formal layers and links for the paper.",
    "Map every stored concept and relationship in the publication.",
    "Lay out the represented relationships in this article.",
  ]) {
    assert.equal(inferDiagramIntent(question), true, question);
  }
});

test("non-visual questions and unrelated substrings do not trigger intent", () => {
  assert.equal(inferDiagramIntent("Compare two papers"), false);
  for (const question of [
    "Explain the workflow",
    "Describe overflow handling",
    "Compare graphite materials",
    "Discuss architectural choices",
    "Summarize visualization research",
  ]) {
    assert.equal(inferDiagramIntent(question), false, question);
  }
});

test("manual uncheck is respected for the same unchanged question", () => {
  const inferred = reconcileDiagramIntentToggle(
    INITIAL_DIAGRAM_INTENT_TOGGLE_STATE,
    FLOW_QUESTION,
  );
  assert.deepEqual(inferred, {
    enabled: true,
    autoEnabled: true,
    manuallyDisabledFor: null,
  });

  const manuallyDisabled = applyManualDiagramToggle(
    inferred,
    FLOW_QUESTION,
    false,
  );
  assert.equal(manuallyDisabled.enabled, false);
  assert.equal(manuallyDisabled.autoEnabled, false);
  assert.equal(
    reconcileDiagramIntentToggle(manuallyDisabled, FLOW_QUESTION).enabled,
    false,
  );
  assert.equal(
    reconcileDiagramIntentToggle(
      manuallyDisabled,
      `${FLOW_QUESTION} Please`,
    ).enabled,
    false,
  );
});

test("a materially changed diagram question can be suggested again", () => {
  const inferred = reconcileDiagramIntentToggle(
    INITIAL_DIAGRAM_INTENT_TOGGLE_STATE,
    FLOW_QUESTION,
  );
  const manuallyDisabled = applyManualDiagramToggle(
    inferred,
    FLOW_QUESTION,
    false,
  );
  const changed = reconcileDiagramIntentToggle(
    manuallyDisabled,
    "Visualize governance choices for a cross-organizational artifact.",
  );
  assert.equal(changed.enabled, true);
  assert.equal(changed.autoEnabled, true);
  assert.equal(changed.manuallyDisabledFor, null);
});

test("request preference distinguishes auto inference from explicit suppression", () => {
  assert.equal(
    diagramPreferenceForRequest(
      INITIAL_DIAGRAM_INTENT_TOGGLE_STATE,
      "Add another requirement to the active design.",
    ),
    "auto",
  );
  const inferred = reconcileDiagramIntentToggle(
    INITIAL_DIAGRAM_INTENT_TOGGLE_STATE,
    FLOW_QUESTION,
  );
  assert.equal(diagramPreferenceForRequest(inferred, FLOW_QUESTION), "requested");
  const suppressed = applyManualDiagramToggle(inferred, FLOW_QUESTION, false);
  assert.equal(diagramPreferenceForRequest(suppressed, FLOW_QUESTION), "suppressed");
  assert.equal(
    diagramPreferenceForRequest(suppressed, "Explain a different stored concept."),
    "auto",
  );
});

test("chat request payload sends tri-state preference and visible history context", async () => {
  const source = await readFile(
    resolve(process.cwd(), "src/native-okf/components/chat/ChatWorkbench.tsx"),
    "utf8",
  );
  assert.match(source, /const includeDiagram = diagramIntentToggle\.enabled/u);
  assert.match(source, /checked=\{includeDiagram\}/u);
  assert.match(
    source,
    /const request: NativeOkfChatRequest = \{[\s\S]*?diagramPreference:\s*diagramPreferenceForRequest\([\s\S]*?visibleHistoryMessageCount:\s*priorEntries\.length[\s\S]*?\};/u,
  );
  assert.match(source, /Diagram enabled based on your request\./u);
  assert.match(
    source,
    /setQuestion\(""\);\s*setDiagramIntentToggle\(INITIAL_DIAGRAM_INTENT_TOGGLE_STATE\);/u,
  );
  assert.doesNotMatch(source, /includeDiagram:\s*inferDiagramIntent/u);
  assert.doesNotMatch(source, /includeDiagram,\s*\n\s*conversationState/u);
});
