import "server-only";

import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import test from "node:test";

import { loadOkfBundle } from "../server/index.ts";
import { parseOkfMarkdown } from "../server/markdown.ts";
import type { OkfBundle } from "../server/types.ts";

const EXPECTED_TYPE_COUNTS = {
  "design-feature": 42,
  "design-goal": 3,
  "design-objective": 59,
  "design-principle": 114,
  "design-requirement": 28,
  "meta-requirement": 10,
  paper: 34,
  reference: 2,
} as const;

async function withTempBundle(
  files: Record<string, string | Uint8Array>,
  inspect: (bundleRoot: string) => Promise<void>,
): Promise<void> {
  const tempBase = resolve(tmpdir());
  const bundleRoot = await mkdtemp(join(tempBase, "native-okf-parser-"));

  try {
    for (const [filePath, contents] of Object.entries(files)) {
      const absolutePath = join(bundleRoot, ...filePath.split("/"));
      await mkdir(dirname(absolutePath), { recursive: true });
      await writeFile(absolutePath, contents);
    }
    await inspect(bundleRoot);
  } finally {
    const relativeToTemp = relative(tempBase, bundleRoot);
    assert.ok(relativeToTemp && !relativeToTemp.startsWith(".."));
    await rm(bundleRoot, { recursive: true, force: true });
  }
}

function countsByType(bundle: OkfBundle): Record<string, number> {
  return Object.fromEntries(
    [...bundle.conceptsByType].map(([type, concepts]) => [type, concepts.length]),
  );
}

test("canonical bundle parses as native OKF v0.1 with deterministic counts", async () => {
  const bundle = await loadOkfBundle({ bundlePath: "knowledge/okf" });

  assert.equal(bundle.rootPath, resolve(process.cwd(), "knowledge/okf"));
  assert.equal(bundle.okfVersion, "0.1");
  assert.equal(bundle.markdownFileCount, 296);
  assert.equal(bundle.reservedDocuments.length, 4);
  assert.equal(bundle.concepts.length, 292);
  assert.deepEqual(countsByType(bundle), EXPECTED_TYPE_COUNTS);
  assert.deepEqual(bundle.fatalErrors, []);
  assert.deepEqual(bundle.warnings, []);
});

test("concept IDs are normalized POSIX paths without the Markdown suffix", async () => {
  const bundle = await loadOkfBundle({ bundlePath: "knowledge/okf" });
  const ids = bundle.concepts.map((concept) => concept.id);

  assert.equal(new Set(ids).size, 292);
  assert.ok(ids.every((id) => !id.endsWith(".md")));
  assert.ok(ids.every((id) => !id.includes("\\")));
  assert.ok(bundle.concepts.every((concept) => concept.filePath === `${concept.id}.md`));
  assert.ok(bundle.conceptsById.has("papers/blockchain-iot-sensor-data"));
  assert.ok(bundle.conceptsById.has("design-knowledge/blockchain-iot-sensor-data-dp1"));
  assert.ok(bundle.conceptsById.has("design-knowledge/peer-review-token-incentives-df1"));
});

test("reserved filenames are documents, never concepts", async () => {
  const bundle = await loadOkfBundle({ bundlePath: "knowledge/okf" });

  assert.deepEqual(
    bundle.reservedDocuments.map((document) => document.filePath),
    ["design-knowledge/index.md", "index.md", "log.md", "papers/index.md"],
  );
  for (const reservedId of ["design-knowledge/index", "index", "log", "papers/index"]) {
    assert.equal(bundle.conceptsById.has(reservedId), false);
  }
  assert.ok(
    bundle.concepts.every(
      (concept) => !/(?:^|\/)(?:index|log)\.md$/u.test(concept.filePath),
    ),
  );
});

test("producer-defined frontmatter fields and source Markdown are preserved", async () => {
  const bundle = await loadOkfBundle({ bundlePath: "knowledge/okf" });
  const paper = bundle.conceptsById.get("papers/blockchain-iot-sensor-data");
  assert.ok(paper);

  assert.equal(
    paper.frontmatter.authors,
    "Mathieu Chanson, Andreas Bogner, Dominik Bilgeri, Elgar Fleisch, Felix Wortmann",
  );
  assert.equal(paper.frontmatter.year, 2019);
  assert.equal(paper.frontmatter.dsr_grid, true);
  assert.equal(
    paper.frontmatter.dsr_solution_space,
    "Design theory (requirements, principles and features) plus an instantiation (CertifiCar).",
  );
  assert.equal(typeof paper.frontmatter.methodology, "string");
  assert.match(paper.rawMarkdown, /^---\r?\ntype: paper/u);
  assert.doesNotMatch(paper.markdownBody, /^---/u);
  assert.equal(paper.headings[0]?.text, paper.title);
});

test("ordinary relative links resolve and retain their nearest heading hint", async () => {
  const bundle = await loadOkfBundle({ bundlePath: "knowledge/okf" });
  const principle = bundle.conceptsById.get(
    "design-knowledge/blockchain-iot-sensor-data-dp1",
  );
  assert.ok(principle);

  const sourcePaperLink = principle.outgoingLinks.find(
    (link) => link.rawTarget === "../papers/blockchain-iot-sensor-data.md",
  );
  assert.ok(sourcePaperLink);
  assert.equal(sourcePaperLink.targetId, "papers/blockchain-iot-sensor-data");
  assert.equal(sourcePaperLink.targetPath, "papers/blockchain-iot-sensor-data.md");
  assert.equal(sourcePaperLink.relationHint, "Source paper");
  assert.equal(sourcePaperLink.resolved, true);
  assert.equal(sourcePaperLink.broken, false);
});

test("unknown types, missing optional fields, and custom fields are accepted", async () => {
  await withTempBundle(
    {
      "index.md": "---\nokf_version: \"0.1\"\n---\n\n# Test bundle\n",
      "custom/minimal.md": [
        "---",
        "type: producer-defined-widget",
        "custom_number: 7",
        "custom_object:",
        "  enabled: true",
        "---",
        "",
        "# Minimal concept",
        "",
      ].join("\n"),
    },
    async (bundleRoot) => {
      const bundle = await loadOkfBundle({ bundlePath: bundleRoot });
      const concept = bundle.conceptsById.get("custom/minimal");
      assert.ok(concept);
      assert.equal(bundle.markdownFileCount, 2);
      assert.equal(concept.type, "producer-defined-widget");
      assert.equal(concept.title, undefined);
      assert.equal(concept.description, undefined);
      assert.equal(concept.resource, undefined);
      assert.equal(concept.tags, undefined);
      assert.equal(concept.timestamp, undefined);
      assert.equal(concept.frontmatter.custom_number, 7);
      assert.deepEqual(concept.frontmatter.custom_object, { enabled: true });
      assert.deepEqual(bundle.fatalErrors, []);
    },
  );
});

test("Markdown parsing distinguishes internal, external, fragment, and image links", () => {
  const parsed = parseOkfMarkdown(
    [
      "# Context",
      "",
      "[Bundle root](/target.md)",
      "[Relative](./peer.md)",
      "[Fragment](#same-page)",
      "![Image](./asset.png)",
      "[External](https://example.com/reference)",
    ].join("\n"),
    {
      sourceId: "nested/source",
      sourceFilePath: "nested/source.md",
    },
  );

  assert.equal(parsed.links.length, 3);
  assert.deepEqual(
    parsed.links.map((link) => ({
      rawTarget: link.rawTarget,
      targetId: link.targetId,
      external: link.external,
      relationHint: link.relationHint,
    })),
    [
      {
        rawTarget: "/target.md",
        targetId: "target",
        external: false,
        relationHint: "Context",
      },
      {
        rawTarget: "./peer.md",
        targetId: "nested/peer",
        external: false,
        relationHint: "Context",
      },
      {
        rawTarget: "https://example.com/reference",
        targetId: undefined,
        external: true,
        relationHint: "Context",
      },
    ],
  );
});
