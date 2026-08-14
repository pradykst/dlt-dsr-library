import "server-only";

import assert from "node:assert/strict";
import test from "node:test";

import {
  clearOkfCacheForTests,
  getAllConcepts,
  getAllPapers,
  getConceptByPath,
  getConceptsByType,
  getOkfBundle,
  getPaperByPath,
} from "../server/index.ts";

test("repository exposes the canonical concepts and open-ended types", async () => {
  clearOkfCacheForTests();

  const [allConcepts, papers, references, unknownType] = await Promise.all([
    getAllConcepts(),
    getAllPapers(),
    getConceptsByType("reference"),
    getConceptsByType("producer-defined-type-that-is-not-in-this-bundle"),
  ]);

  assert.equal(allConcepts.length, 462);
  assert.equal(papers.length, 34);
  assert.equal(references.length, 2);
  assert.deepEqual(unknownType, []);
  assert.ok(papers.every((paper) => paper.type === "paper"));
});

test("paper lookup accepts a dynamically selected paper ID, path, and basename", async () => {
  const papers = await getAllPapers();
  const selectedPaper = papers.at(Math.floor(papers.length / 2));
  assert.ok(selectedPaper, "the integration fixture must contain at least one paper");

  const basename = selectedPaper.id.split("/").at(-1);
  assert.ok(basename);

  assert.equal((await getPaperByPath(selectedPaper.id))?.id, selectedPaper.id);
  assert.equal((await getPaperByPath(selectedPaper.filePath))?.id, selectedPaper.id);
  assert.equal((await getPaperByPath(basename))?.id, selectedPaper.id);
});

test("concept lookup normalizes bundle-relative IDs and Markdown paths", async () => {
  const expectedId = "papers/blockchain-iot-sensor-data";

  assert.equal((await getConceptByPath(expectedId))?.id, expectedId);
  assert.equal((await getConceptByPath(`${expectedId}.md`))?.id, expectedId);
  assert.equal((await getConceptByPath(`/${expectedId}.md#summary`))?.id, expectedId);
  assert.equal(await getConceptByPath("papers/not-present"), undefined);
  assert.equal(await getPaperByPath("design-knowledge/blockchain-iot-sensor-data-dp1"), undefined);
});

test("repository rejects path traversal and non-bundle lookup schemes", async () => {
  const unsafeLookups = [
    "../package.json",
    "papers/../../package.json",
    "..\\package.json",
    "%2e%2e/package.json",
    "C:/outside.md",
    "https://example.com/concept.md",
    "//server/share/concept.md",
    "bad%ZZpath",
    "\0outside",
  ];

  for (const lookup of unsafeLookups) {
    await assert.rejects(
      getConceptByPath(lookup),
      (error: unknown) => error instanceof RangeError,
      `expected lookup to be rejected: ${JSON.stringify(lookup)}`,
    );
  }
});

test("the process cache is stable until explicitly cleared", async () => {
  clearOkfCacheForTests();
  const first = await getOkfBundle();
  const second = await getOkfBundle();
  assert.equal(second, first);

  clearOkfCacheForTests();
  const reloaded = await getOkfBundle();
  assert.notEqual(reloaded, first);
  assert.equal(reloaded.concepts.length, first.concepts.length);
});
