import "server-only";

import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";
import test from "node:test";

import {
  clearOkfSearchCacheForTests,
  searchOkf,
} from "../server/search.ts";

test("exact title and bundle path queries receive explicit boost evidence", async () => {
  const title =
    "Designing trust-enabling blockchain systems for the inter-organizational exchange of capacity";
  const [titleSearch, pathSearch] = await Promise.all([
    searchOkf(title),
    searchOkf("papers/blockchain-iot-sensor-data.md"),
  ]);

  assert.equal(titleSearch.results[0]?.conceptId, "papers/trust-enabling-capacity-exchange");
  assert.ok(titleSearch.results[0]?.matchSource.includes("exact-title"));
  assert.equal(titleSearch.diagnostics.hasExactTitleMatch, true);

  assert.equal(pathSearch.results[0]?.conceptId, "papers/blockchain-iot-sensor-data");
  assert.ok(pathSearch.results[0]?.matchSource.includes("exact-path"));
  assert.equal(pathSearch.diagnostics.hasExactPathMatch, true);
  assert.equal(pathSearch.results[0]?.path, "papers/blockchain-iot-sensor-data.md");
});

test("prefix matching is available but can be disabled deterministically", async () => {
  const [withPrefix, withoutPrefix] = await Promise.all([
    searchOkf("interoperab", { prefix: true, fuzzy: false, limit: 12 }),
    searchOkf("interoperab", { prefix: false, fuzzy: false, limit: 12 }),
  ]);

  assert.ok(withPrefix.results.length > 0);
  assert.equal(withPrefix.diagnostics.hasPrefixMatch, true);
  assert.equal(withPrefix.diagnostics.hasFuzzyMatch, false);
  assert.deepEqual(withoutPrefix.results, []);
  assert.equal(withoutPrefix.diagnostics.hasPrefixMatch, false);
});

test("modest fuzzy matching recovers a one-edit misspelling", async () => {
  const [withFuzzy, withoutFuzzy] = await Promise.all([
    searchOkf("tokeniztion", { prefix: false, fuzzy: true, limit: 12 }),
    searchOkf("tokeniztion", { prefix: false, fuzzy: false, limit: 12 }),
  ]);

  assert.ok(withFuzzy.results.length > 0);
  assert.equal(withFuzzy.diagnostics.hasFuzzyMatch, true);
  assert.ok(
    withFuzzy.results.some(
      (result) => result.conceptId === "design-knowledge/peer-review-token-incentives-df1",
    ),
  );
  assert.deepEqual(withoutFuzzy.results, []);
});

test("quoted phrases are retained as inspectable ranking evidence", async () => {
  const response = await searchOkf('"source-to-sink certification"', { limit: 12 });

  assert.deepEqual(response.quotedPhrases, ["source to sink certification"]);
  assert.equal(
    response.results[0]?.conceptId,
    "design-knowledge/blockchain-iot-sensor-data-dp1",
  );
  assert.ok(response.results[0]?.matchSource.includes("quoted-phrase"));
  assert.ok(response.results.some((result) => result.matchSource.includes("quoted-phrase")));
});

test("native type filters accept open strings without a fixed enum", async () => {
  const [features, producerDefinedType] = await Promise.all([
    searchOkf("tokenization", { types: ["design-feature"], limit: 20 }),
    searchOkf("tokenization", { types: ["producer-defined-unknown"], limit: 20 }),
  ]);

  assert.ok(features.results.length > 0);
  assert.ok(features.results.every((result) => result.type === "design-feature"));
  assert.ok(
    features.results.some(
      (result) => result.conceptId === "design-knowledge/peer-review-token-incentives-df1",
    ),
  );
  assert.deepEqual(producerDefinedType.results, []);
  assert.equal(producerDefinedType.diagnostics.candidateCount, 0);
});

test("stop-word-only input produces an empty diagnostic response", async () => {
  const response = await searchOkf("what is the and of");

  assert.equal(response.normalizedQuery, "what is the and of");
  assert.deepEqual(response.meaningfulTerms, []);
  assert.deepEqual(response.results, []);
  assert.equal(response.diagnostics.meaningfulTermCount, 0);
  assert.equal(response.diagnostics.candidateCount, 0);
});

test("equal-score candidates use stable concept-ID tie-breaking", async () => {
  clearOkfSearchCacheForTests();
  const first = await searchOkf("meta-requirement", { prefix: false, fuzzy: false, limit: 50 });
  clearOkfSearchCacheForTests();
  const second = await searchOkf("meta-requirement", { prefix: false, fuzzy: false, limit: 50 });

  assert.deepEqual(
    first.results.map((result) => result.conceptId),
    second.results.map((result) => result.conceptId),
  );

  const idsByScore = new Map<number, string[]>();
  for (const result of first.results) {
    const group = idsByScore.get(result.score) ?? [];
    group.push(result.conceptId);
    idsByScore.set(result.score, group);
  }
  const tiedGroups = [...idsByScore.values()].filter((group) => group.length > 1);
  assert.ok(tiedGroups.length > 0, "fixture should exercise at least one score tie");
  for (const group of tiedGroups) {
    assert.deepEqual(group, [...group].sort());
  }
});

async function nativeApiFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const absolutePath = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...await nativeApiFiles(absolutePath));
    else if (entry.isFile() && /\.[cm]?[jt]sx?$/iu.test(entry.name)) files.push(absolutePath);
  }
  return files;
}

function importSpecifiers(source: string): string[] {
  const specifiers: string[] = [];
  for (const expression of [
    /\bfrom\s+["']([^"']+)["']/gu,
    /\bimport\s+["']([^"']+)["']/gu,
    /\b(?:import|require)\s*\(\s*["']([^"']+)["']/gu,
  ]) {
    for (const match of source.matchAll(expression)) {
      if (match[1]) specifiers.push(match[1]);
    }
  }
  return specifiers;
}

test("native API routes preserve the native isolation boundary", async () => {
  const cwd = process.cwd();
  const files = await nativeApiFiles(resolve(cwd, "app/api/native-okf"));
  const serializedArtifact = new RegExp(["graph", "json"].join("\\."), "iu");
  const forbiddenImportParts = [
    "supabase",
    "migrations",
    "database",
    "library/okf",
    "/lib/okf",
    "/api/okf",
    "okf-chat",
    "okf-workbench",
    "/legacy/",
    "answer-plan",
    "generated-flow",
    "source-view",
    "/rag/",
    "/csv/",
    ["graph", "json"].join("."),
  ];
  const violations: string[] = [];

  assert.ok(files.length > 0, "expected at least one native API route");
  for (const absolutePath of files) {
    const source = await readFile(absolutePath, "utf8");
    const displayPath = relative(cwd, absolutePath).replaceAll("\\", "/");
    if (serializedArtifact.test(source)) {
      violations.push(`${displayPath}: forbidden serialized graph access`);
    }
    for (const specifier of importSpecifiers(source)) {
      const normalized = specifier.replaceAll("\\", "/").toLowerCase();
      if (forbiddenImportParts.some((part) => normalized.includes(part))) {
        violations.push(`${displayPath}: forbidden import ${JSON.stringify(specifier)}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});
