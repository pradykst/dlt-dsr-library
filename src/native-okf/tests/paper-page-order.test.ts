import "server-only";

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  CONCEPT_WORKBENCH_SECTIONS,
  PAPER_WORKBENCH_SECTIONS,
  workbenchSectionEyebrow,
  workbenchSectionIds,
} from "../shared/workbench-sections.ts";
import { getPaperWorkbenchViewModel } from "../server/workbench.ts";

const WORKBENCH_VIEW_PATH = fileURLToPath(
  new URL("../components/WorkbenchView.tsx", import.meta.url),
);

test("paper page places the design map above Design knowledge", () => {
  const ids = workbenchSectionIds("paper");
  assert.ok(
    ids.indexOf("graph") < ids.indexOf("design-knowledge"),
    "Paper design map must precede Design knowledge",
  );
  assert.deepEqual(ids, [
    "overview",
    "dsr-grid",
    "graph",
    "design-knowledge",
    "raw-metadata",
  ]);
  // No duplicate section ids (the map is rendered once).
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(
    PAPER_WORKBENCH_SECTIONS.find((section) => section.id === "graph")?.navLabel,
    "Paper design map",
  );
});

test("concept page section order is unchanged", () => {
  const ids = workbenchSectionIds("concept");
  assert.deepEqual(ids, [
    "overview",
    "design-knowledge",
    "relationships",
    "graph",
    "raw-metadata",
  ]);
  assert.ok(ids.indexOf("design-knowledge") < ids.indexOf("graph"));
  assert.ok(CONCEPT_WORKBENCH_SECTIONS.some((section) => section.id === "relationships"));
});

test("eyebrow numbers follow section position", () => {
  assert.equal(workbenchSectionEyebrow("paper", "overview"), "01");
  assert.equal(workbenchSectionEyebrow("paper", "graph"), "03");
  assert.equal(workbenchSectionEyebrow("paper", "design-knowledge"), "04");
  assert.equal(workbenchSectionEyebrow("paper", "raw-metadata"), "05");
  assert.equal(workbenchSectionEyebrow("concept", "design-knowledge"), "02");
  assert.equal(workbenchSectionEyebrow("concept", "graph"), "04");
});

test("WorkbenchView renders the map section before Design knowledge for papers", async () => {
  const source = await readFile(WORKBENCH_VIEW_PATH, "utf8");

  const paperBranch = source.slice(source.indexOf("isPaper ? ("));
  const graphIndex = paperBranch.indexOf("{graphSection}");
  const designIndex = paperBranch.indexOf("{designKnowledgeSection}");
  assert.ok(graphIndex >= 0 && designIndex >= 0);
  assert.ok(
    graphIndex < designIndex,
    "paper render branch must place graphSection before designKnowledgeSection",
  );

  // The paper design map component is referenced exactly once — not duplicated.
  const mapReferences = source.match(/<PaperGraphViews/gu) ?? [];
  assert.equal(mapReferences.length, 1);

  // The graceful no-map fallback is preserved.
  assert.ok(source.includes("view.paperDesignMap ? ("));
  assert.ok(source.includes("<NativeOkfGraph"));
});

test("a canonical paper still exposes a renderable design map", async () => {
  const view = await getPaperWorkbenchViewModel("blockchain-iot-sensor-data");
  assert.ok(view);
  assert.equal(view.kind, "paper");
  assert.ok(view.paperDesignMap, "expected a renderable paper design map");
});
