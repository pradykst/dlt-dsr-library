import "server-only";

import assert from "node:assert/strict";
import { isAbsolute, win32 } from "node:path";
import test from "node:test";

import {
  GET as debugGet,
  POST as debugPost,
  runtime as debugRuntime,
} from "../../../app/api/native-okf/retrieval-debug/route.ts";
import { buildCorpusOverview } from "../server/corpus-overview.ts";
import { getAllPapers } from "../server/index.ts";
import { retrieveOkfContext } from "../server/retrieval.ts";
import {
  clearOkfSearchCacheForTests,
  searchOkf,
} from "../server/search.ts";
import type {
  FinalContextConcept,
  RetrievalResult,
} from "../server/retrieval-types.ts";

const QUERIES = {
  tokenization: "Which papers use tokenization?",
  privacy: "What design principles address privacy?",
  consent: "What does the library say about patient consent self-management?",
  trustComparison:
    "Compare the trust mechanisms in: Designing trust-enabling blockchain systems for the inter-organizational exchange of capacity and And No One Gets the Short End of the Stick",
  interoperability: "Which papers discuss interoperability?",
  sourceToSink: "What design features implement source-to-sink certification?",
  noRequirements: "Which papers contain no design requirements?",
  fragmentedProducts:
    "How can fragmented product data and product identities across multiple marketplaces be addressed using reusable design knowledge from the library?",
  nonsense: "flarble quux nebula toothbrush protocol",
} as const;

const retrievalCache = new Map<string, Promise<RetrievalResult>>();

function retrieve(query: string): Promise<RetrievalResult> {
  const existing = retrievalCache.get(query);
  if (existing) return existing;
  const pending = retrieveOkfContext(query);
  retrievalCache.set(query, pending);
  return pending;
}

function selectedIds(result: RetrievalResult): Set<string> {
  return new Set([
    ...result.seedResults.map((concept) => concept.conceptId),
    ...result.expandedResults.map((concept) => concept.conceptId),
    ...result.finalConcepts.map((concept) => concept.conceptId),
  ]);
}

function finalIds(result: RetrievalResult): Set<string> {
  return new Set(result.finalConcepts.map((concept) => concept.conceptId));
}

function assertRelativePaths(result: RetrievalResult): void {
  for (const item of [
    ...result.seedResults,
    ...result.expandedResults,
    ...result.finalConcepts,
  ]) {
    assert.equal(isAbsolute(item.path), false, `absolute path exposed for ${item.conceptId}`);
    assert.equal(win32.isAbsolute(item.path), false, `Windows path exposed for ${item.conceptId}`);
  }
}

test("native lexical search is deterministic and diagnostically ranked", async () => {
  clearOkfSearchCacheForTests();
  const first = await searchOkf(QUERIES.tokenization, { limit: 12 });
  clearOkfSearchCacheForTests();
  const second = await searchOkf(QUERIES.tokenization, { limit: 12 });

  assert.deepEqual(
    first.results.map((result) => result.conceptId),
    second.results.map((result) => result.conceptId),
  );
  assert.deepEqual(
    first.results.map((result) => result.matchSource),
    second.results.map((result) => result.matchSource),
  );
  assert.ok(first.results.length > 0);
  assert.ok(first.results.every((result, index, values) =>
    index === 0 || (values[index - 1]?.score ?? 0) >= result.score));
  assert.ok(first.results.every((result) => Number.isFinite(result.score) && result.score > 0));
  assert.equal(first.diagnostics.indexedConceptCount, 241);
  assert.equal(first.diagnostics.candidateCount >= first.results.length, true);
  assert.equal(first.diagnostics.meaningfulTermCount, first.meaningfulTerms.length);
  assertRelativePaths({
    normalizedQuestion: first.normalizedQuery,
    seedResults: first.results,
    expandedResults: [],
    finalConcepts: [],
    corpusOverview: { paperCount: 0, papers: [] },
    warnings: [],
    confidence: 0,
    noMatch: false,
    debug: {
      limits: {
        lexicalSeedLimit: 0,
        firstHopLimit: 0,
        secondHopLimit: 0,
        maxConcepts: 0,
        maxContextCharacters: 0,
        maxGraphDepth: 0,
        includeIncoming: false,
        includeOutgoing: false,
      },
      meaningfulTokens: [],
      searchDiagnostics: first.diagnostics,
      expansionPaths: [],
      droppedConcepts: [],
      secondHopUsed: false,
      secondHopReason: "",
      candidateCount: 0,
    },
    contextCharacterEstimate: 0,
  });
});

test("tokenization retrieval selects both peer-review and bond-market evidence", async () => {
  const result = await retrieve(QUERIES.tokenization);
  const selected = selectedIds(result);

  assert.equal(result.noMatch, false);
  for (const expectedId of [
    "papers/peer-review-token-incentives",
    "design-knowledge/peer-review-token-incentives-df1",
    "papers/bond-markets-tokenization-tac",
  ]) {
    assert.ok(selected.has(expectedId), `missing tokenization evidence ${expectedId}`);
  }
  assert.ok(
    result.seedResults
      .slice(0, 8)
      .some((candidate) => candidate.conceptId === "papers/bond-markets-tokenization-tac"),
  );
  assertRelativePaths(result);
});

test("privacy retrieval spans blockchain IoT and consent design principles", async () => {
  const result = await retrieve(QUERIES.privacy);
  const principles = result.finalConcepts.filter(
    (concept) => concept.type === "design-principle",
  );

  assert.equal(result.noMatch, false);
  assert.ok(principles.length >= 2);
  assert.ok(
    principles.some((concept) => concept.conceptId.includes("blockchain-iot-sensor-data")),
    "missing a blockchain IoT privacy principle",
  );
  assert.ok(
    principles.some((concept) => concept.conceptId.includes("consent-self-management-hie")),
    "missing a consent self-management privacy principle",
  );
});

test("patient consent retrieval includes its paper and linked principles", async () => {
  const result = await retrieve(QUERIES.consent);
  const ids = finalIds(result);

  assert.equal(result.noMatch, false);
  assert.ok(ids.has("papers/consent-self-management-hie"));
  assert.ok(
    result.finalConcepts.some(
      (concept) =>
        concept.type === "design-principle" &&
        concept.conceptId.startsWith("design-knowledge/consent-self-management-hie-"),
    ),
  );
});

test("exact-title trust comparison retains both papers and their principles", async () => {
  const papers = await getAllPapers();
  const trustPaper = papers.find(
    (paper) =>
      paper.title ===
      "Designing trust-enabling blockchain systems for the inter-organizational exchange of capacity",
  );
  const shortEndPaper = papers.find((paper) =>
    paper.title?.startsWith("And No One Gets the Short End of the Stick:"));
  assert.ok(trustPaper);
  assert.ok(shortEndPaper);
  assert.equal(trustPaper.id, "papers/trust-enabling-capacity-exchange");
  assert.equal(shortEndPaper.id, "papers/short-end-opportunism-sharing");

  const result = await retrieve(QUERIES.trustComparison);
  const ids = finalIds(result);
  assert.ok(ids.has(trustPaper.id));
  assert.ok(ids.has(shortEndPaper.id));

  for (const paper of [trustPaper, shortEndPaper]) {
    const family = paper.id.replace(/^papers\//u, "");
    assert.ok(
      result.finalConcepts.some(
        (concept) =>
          concept.type === "design-principle" &&
          concept.conceptId.startsWith(`design-knowledge/${family}-`),
      ),
      `missing linked principles for ${paper.id}`,
    );
  }
});

test("interoperability retrieval returns multiple defensible paper concepts", async () => {
  const result = await retrieve(QUERIES.interoperability);
  const papers = result.finalConcepts.filter((concept) => concept.type === "paper");

  assert.equal(result.noMatch, false);
  assert.ok(papers.length >= 2);
  assert.equal(new Set(papers.map((paper) => paper.conceptId)).size, papers.length);
});

test("source-to-sink retrieval keeps the principle and all implementing features", async () => {
  const result = await retrieve(QUERIES.sourceToSink);
  const ids = finalIds(result);

  for (const expectedId of [
    "design-knowledge/blockchain-iot-sensor-data-dp1",
    "design-knowledge/blockchain-iot-sensor-data-df1",
    "design-knowledge/blockchain-iot-sensor-data-df3",
    "design-knowledge/blockchain-iot-sensor-data-df6",
  ]) {
    assert.ok(ids.has(expectedId), `missing source-to-sink context ${expectedId}`);
  }
});

test("corpus overview computes papers with zero design requirements", async () => {
  const [overview, retrieval] = await Promise.all([
    buildCorpusOverview(),
    retrieve(QUERIES.noRequirements),
  ]);
  const withoutRequirements = overview.papers.filter(
    (paper) => (paper.linkedConceptCounts["design-requirement"] ?? 0) === 0,
  );

  assert.equal(overview.paperCount, 34);
  assert.equal(overview.papers.length, 34);
  assert.ok(withoutRequirements.length > 0);
  assert.ok(withoutRequirements.length < overview.paperCount);
  assert.deepEqual(retrieval.corpusOverview, overview);
  assert.ok(retrieval.finalConcepts.length < overview.paperCount);
  assert.ok(
    overview.papers.every((paper) =>
      !Object.hasOwn(paper as unknown as object, "markdownBody")),
  );
});

function searchableConceptText(concept: FinalContextConcept): string {
  return [
    concept.conceptId,
    concept.title,
    concept.description,
    concept.sourcePaper,
    ...concept.tags,
    ...Object.values(concept.selectedMetadata).flat(),
  ]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLocaleLowerCase("en");
}

test("fragmented product retrieval spans multiple paper families and reusable signals", async () => {
  const result = await retrieve(QUERIES.fragmentedProducts);
  const combined = result.finalConcepts.map(searchableConceptText).join(" ");
  const signals = [
    /marketplace/u,
    /identit/u,
    /interoperab/u,
    /trust|trusted/u,
    /information[\s-]+sharing/u,
    /privacy/u,
    /governance/u,
    /cross[\s-]+organi[sz]ational/u,
  ];
  const matchedSignals = signals.filter((signal) => signal.test(combined));
  const paperFamilies = new Set(
    result.finalConcepts.flatMap((concept) => [
      ...(concept.type === "paper" ? [concept.conceptId] : []),
      ...(concept.sourcePaper ? [concept.sourcePaper] : []),
    ]),
  );

  assert.equal(result.noMatch, false);
  assert.ok(paperFamilies.size >= 3);
  assert.ok(matchedSignals.length >= 3);
});

test("nonsense query returns an inspectable no-match without detailed context", async () => {
  const result = await retrieve(QUERIES.nonsense);

  assert.equal(result.noMatch, true);
  assert.deepEqual(result.finalConcepts, []);
  assert.deepEqual(result.expandedResults, []);
  assert.equal(result.contextCharacterEstimate, 0);
  assert.ok(result.confidence >= 0 && result.confidence <= 1);
  assert.ok(result.debug.meaningfulTokens.length > 0);
  assert.equal(typeof result.debug.secondHopReason, "string");
  assert.ok(result.debug.searchDiagnostics.meaningfulTermCount > 0);
});

test("bounded retrieval reports deterministic dropped-concept reasons", async () => {
  const result = await retrieveOkfContext(QUERIES.sourceToSink, {
    lexicalSeedLimit: 8,
    firstHopLimit: 1,
    secondHopLimit: 0,
    maxConcepts: 1,
    maxContextCharacters: 2_500,
    maxGraphDepth: 1,
  });
  const allowedReasons = new Set([
    "seed-limit",
    "hop-limit",
    "deduplicated",
    "context-limit",
    "concept-limit",
    "weak-match",
    "unresolved",
  ]);

  assert.equal(result.debug.limits.maxConcepts, 1);
  assert.equal(result.debug.limits.firstHopLimit, 1);
  assert.equal(result.debug.secondHopUsed, false);
  assert.ok(result.debug.candidateCount >= result.seedResults.length);
  assert.ok(result.debug.droppedConcepts.length > 0);
  assert.ok(result.debug.droppedConcepts.every((item) => allowedReasons.has(item.reason)));
  assert.ok(
    result.debug.droppedConcepts.some(
      (item) => item.reason === "hop-limit" || item.reason === "concept-limit",
    ),
  );
});

test("development debug GET/POST serialize diagnostics without host paths", async () => {
  const mutableEnvironment = process.env as Record<string, string | undefined>;
  const originalEnvironment = mutableEnvironment.NODE_ENV;
  mutableEnvironment.NODE_ENV = "development";

  try {
    assert.equal(debugRuntime, "nodejs");
    const getResponse = await debugGet(
      new Request(`http://localhost/api/native-okf/retrieval-debug?q=${encodeURIComponent(QUERIES.tokenization)}`),
    );
    const getText = await getResponse.text();
    const getBody = JSON.parse(getText) as RetrievalResult;
    assert.equal(getResponse.status, 200);
    assert.ok(Array.isArray(getBody.seedResults));
    assert.ok(Array.isArray(getBody.debug.droppedConcepts));
    assert.equal(getText.includes(process.cwd()), false);
    assert.doesNotMatch(getText, /[a-z]:\\\\/iu);

    const postResponse = await debugPost(
      new Request("http://localhost/api/native-okf/retrieval-debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: QUERIES.nonsense,
          options: { maxConcepts: 2, maxGraphDepth: 1 },
        }),
      }),
    );
    const postBody = await postResponse.json() as RetrievalResult;
    assert.equal(postResponse.status, 200);
    assert.equal(postBody.noMatch, true);
    assert.ok(Array.isArray(postBody.debug.droppedConcepts));

    const invalidResponse = await debugPost(
      new Request("http://localhost/api/native-okf/retrieval-debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "", options: "invalid" }),
      }),
    );
    assert.equal(invalidResponse.status, 400);

    mutableEnvironment.NODE_ENV = "production";
    const productionResponse = await debugGet(
      new Request("http://localhost/api/native-okf/retrieval-debug?q=tokenization"),
    );
    assert.equal(productionResponse.status, 404);
    assert.deepEqual(await productionResponse.json(), { error: "Not found" });
  } finally {
    if (originalEnvironment === undefined) delete mutableEnvironment.NODE_ENV;
    else mutableEnvironment.NODE_ENV = originalEnvironment;
  }
});
