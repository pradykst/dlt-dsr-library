import "server-only";

import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import test from "node:test";
import type { Response } from "openai/resources/responses/responses";

import { getOkfBundle } from "../server/cache.ts";
import {
  assembleNativeOkfContextualRetrieval,
  findExplicitNativeOkfPaperSlugs,
  loadNativeOkfConversationCatalog,
  prepareNativeOkfChatRequest,
  type NativeOkfConversationCatalog,
} from "../server/conversation.ts";
import {
  associatedConceptsForPaper,
  buildPaperDesignMapFromBundle,
  compareSemanticConcepts,
} from "../server/paper-design-map.ts";
import {
  answerNativeOkfChat,
  validateNativeOkfChatRequest,
} from "../server/openai/chat.ts";
import type { NativeOpenAiClient } from "../server/openai/client.ts";
import { validateAnswerCitations } from "../server/openai/citations.ts";
import {
  buildNativeOkfGroundedContext,
  buildNativeOkfModelInput,
} from "../server/openai/context.ts";
import type { NativeOpenAiEnvironment } from "../server/openai/env.ts";
import { buildStoredPaperDesignMap } from "../server/openai/stored-source-map.ts";
import {
  retrieveOkfContext,
  type NativeOkfRequestedConceptKind,
} from "../server/retrieval.ts";
import type { RetrievalResult } from "../server/retrieval-types.ts";
import type { OkfBundle, OkfConcept } from "../server/types.ts";
import type { NativeOkfConversationState } from "../shared/chat-types.ts";

const MAX_CONTEXT_CHARACTERS = 35_000;
const PAPER_MARKDOWN_LIMIT = 300;

const ENVIRONMENT: NativeOpenAiEnvironment = {
  apiKey: "mock-only-not-a-live-key",
  model: "mock-model",
  reasoningEffort: "low",
  moderationEnabled: false,
  maxOutputTokens: 800,
  diagramMaxOutputTokens: 4_096,
};

interface CategorySpec {
  type: string;
  kind: NativeOkfRequestedConceptKind;
  phrase: string;
}

const CATEGORY_SPECS: readonly CategorySpec[] = [
  { type: "design-goal", kind: "goal", phrase: "design goals" },
  { type: "design-objective", kind: "objective", phrase: "design objectives" },
  { type: "meta-requirement", kind: "meta-requirement", phrase: "meta-requirements" },
  { type: "design-requirement", kind: "requirement", phrase: "design requirements" },
  { type: "design-principle", kind: "principle", phrase: "design principles" },
  { type: "design-feature", kind: "feature", phrase: "design features" },
];

const REQUIRED_STRUCTURES = new Set([
  "design-feature+design-principle+design-requirement",
  "design-feature+design-principle",
  "design-principle",
  "design-objective",
  "design-goal+design-principle",
  "design-requirement",
  "design-principle+design-requirement",
  "meta-requirement",
  "design-principle+meta-requirement",
]);

interface CorpusRow {
  slug: string;
  title: string;
  paper: OkfConcept;
  associated: OkfConcept[];
  counts: ReadonlyMap<string, number>;
  structure: string;
}

interface CorpusFixture {
  bundle: OkfBundle;
  catalog: NativeOkfConversationCatalog;
  rows: CorpusRow[];
}

const corpusFixture = (async (): Promise<CorpusFixture> => {
  const [bundle, catalog] = await Promise.all([
    getOkfBundle(),
    loadNativeOkfConversationCatalog(),
  ]);
  const rows = catalog.papers.map((entry) => {
    const paper = bundle.conceptsById.get(entry.conceptId);
    assert.ok(paper, `Missing paper concept ${entry.conceptId}.`);
    const associated = associatedConceptsForPaper(bundle, paper);
    const counts = new Map<string, number>();
    for (const concept of associated) {
      counts.set(concept.type, (counts.get(concept.type) ?? 0) + 1);
    }
    return {
      slug: entry.slug,
      title: entry.title,
      paper,
      associated,
      counts,
      structure: [...counts.keys()].sort().join("+"),
    };
  });
  return { bundle, catalog, rows };
})();

function categoryQuestion(row: CorpusRow, spec: CategorySpec): string {
  return `What ${spec.phrase} are represented in ${row.title}?`;
}

async function resolveRetrieval(
  question: string,
  options: {
    catalog?: NativeOkfConversationCatalog;
    conversationState?: NativeOkfConversationState;
  } = {},
): Promise<{
  prepared: Awaited<ReturnType<typeof prepareNativeOkfChatRequest>>;
  raw: RetrievalResult;
  retrieval: RetrievalResult;
}> {
  const request = validateNativeOkfChatRequest({
    question,
    ...(options.conversationState
      ? { conversationState: options.conversationState }
      : {}),
  });
  const prepared = await prepareNativeOkfChatRequest(
    request,
    options.catalog,
  );
  const raw = await retrieveOkfContext(prepared.retrievalQuestion);
  const retrieval = await assembleNativeOkfContextualRetrieval(prepared, raw);
  return { prepared, raw, retrieval };
}

function selectedFor(row: CorpusRow, spec: CategorySpec): OkfConcept[] {
  return row.associated
    .filter((concept) => concept.type === spec.type)
    .sort(compareSemanticConcepts);
}

function emptyState(
  paperSlug: string,
  conceptIds: readonly string[],
): NativeOkfConversationState {
  return {
    version: 1,
    activePaperSlugs: [paperSlug],
    activeConceptIds: [...conceptIds].slice(0, 8),
    activeSourceIds: [...conceptIds].slice(0, 12),
    lastIntent: "answer",
    lastDiagramRequested: false,
    pendingClarification: null,
    synthesisDraft: null,
  };
}

function sourceContents(request: unknown): string {
  if (!request || typeof request !== "object") return "";
  const input = (request as { input?: unknown }).input;
  if (!Array.isArray(input)) return "";
  return input.flatMap((message) => {
    if (!message || typeof message !== "object") return [];
    const content = (message as { content?: unknown }).content;
    return typeof content === "string" ? [content] : [];
  }).join("\n");
}

function mockedResponseClient(
  outputs: readonly string[],
  requests: unknown[],
): NativeOpenAiClient {
  let cursor = 0;
  return {
    responses: {
      create: async (request: unknown) => {
        requests.push(request);
        const output = outputs[cursor++];
        if (output === undefined) throw new Error("Unexpected mocked model call.");
        return {
          id: `mock-corpus-response-${cursor}`,
          object: "response",
          created_at: 0,
          model: "mock-model",
          output: [],
          output_text: output,
          status: "completed",
        } as unknown as Response;
      },
    },
    moderations: {
      create: async () => ({ results: [{ flagged: false }] }) as never,
    },
  } as unknown as NativeOpenAiClient;
}

function productionFiles(root: string): string[] {
  return readdirSync(root).flatMap((name) => {
    const path = join(root, name);
    const relativePath = relative(resolve("."), path).replaceAll("\\", "/");
    if (/\/(?:tests?|fixtures?)\//u.test(`/${relativePath}/`)) return [];
    const stats = statSync(path);
    if (stats.isDirectory()) return productionFiles(path);
    return /\.(?:ts|tsx)$/u.test(path) ? [path] : [];
  });
}

test("corpus static audit finds zero regression-paper or topic strings in canonical runtime logic", () => {
  const roots = [resolve("src/native-okf"), resolve("app/api/native-okf")];
  const exactPatterns = [
    /blockchain-iot/iu,
    /Blockchain for the IoT/u,
    /source-to-sink/iu,
    /\bDP[1-4]\b/u,
    /sensor-data/iu,
    /design-knowledge\/blockchain-iot-sensor-data/iu,
    /papers\/blockchain-iot-sensor-data/iu,
  ];
  const exactMatches = roots.flatMap(productionFiles).flatMap((path) => {
    const source = readFileSync(path, "utf8");
    return exactPatterns.flatMap((pattern) =>
      pattern.test(source) ? [`${relative(resolve("."), path)}: ${pattern.source}`] : []
    );
  });
  assert.deepEqual(exactMatches, []);

  const runtimePaths = [
    "src/native-okf/server/conversation.ts",
    "src/native-okf/server/retrieval.ts",
    "src/native-okf/server/openai/chat.ts",
    "src/native-okf/server/openai/citations.ts",
    "src/native-okf/server/openai/context.ts",
    "src/native-okf/server/openai/stored-source-map.ts",
    "src/native-okf/server/access/authorized-chat.ts",
    "src/native-okf/server/access/memory-store.ts",
    "src/native-okf/shared/diagram-intent.ts",
  ];
  const effectiveConditionMatches = runtimePaths.flatMap((path) => {
    const source = readFileSync(resolve(path), "utf8");
    return /blockchain|sensor[\s-]*data|source[\s-]*to[\s-]*sink|\bDP[1-4]\b/iu.test(source)
      ? [path]
      : [];
  });
  assert.deepEqual(effectiveConditionMatches, []);
});

test("all 34 repository papers resolve by canonical title stably without prior state", async () => {
  const { catalog, rows } = await corpusFixture;
  assert.equal(rows.length, 34);
  for (const row of rows) {
    const question = `Summarize the stored design knowledge in ${row.title}.`;
    const first = findExplicitNativeOkfPaperSlugs(question, catalog);
    const second = findExplicitNativeOkfPaperSlugs(question, catalog);
    assert.equal(first[0], row.slug, row.title);
    assert.deepEqual(second, first, row.title);
    const prepared = await prepareNativeOkfChatRequest(
      validateNativeOkfChatRequest({ question }),
      catalog,
    );
    assert.equal(prepared.request.conversationState, undefined);
    assert.equal(prepared.focusedPaperSlugs[0], row.slug, row.title);
  }
});

test("title normalization is corpus-derived and preserves genuine ambiguity", async () => {
  const { catalog, rows } = await corpusFixture;
  let unambiguousSubtitleOmissions = 0;
  for (const row of rows) {
    const punctuationFree = row.title.replace(/[^\p{L}\p{N}\s]/gu, " ");
    const variants = new Set([
      row.title.toLocaleLowerCase("en"),
      row.title.toLocaleUpperCase("en"),
      punctuationFree,
      row.title.replace(/\s+/gu, "   "),
      row.title.replaceAll("-", "–"),
      `${row.title} design principles framework requirements features objectives marketplace`,
    ]);
    for (const variant of variants) {
      const slugs = findExplicitNativeOkfPaperSlugs(
        `What is represented in ${variant}?`,
        catalog,
      );
      assert.equal(slugs[0], row.slug, `${row.title} via ${variant}`);
    }
    const shortTitle = row.title.split(/[:–—]/u, 1)[0]?.trim() ?? "";
    if (shortTitle.length >= 8 && shortTitle !== row.title) {
      const slugs = findExplicitNativeOkfPaperSlugs(shortTitle, catalog);
      if (slugs.length === 1 && slugs[0] === row.slug) {
        unambiguousSubtitleOmissions += 1;
      }
    }
  }
  assert.ok(unambiguousSubtitleOmissions > 0);

  const duplicateTitle = "Shared Research Framework";
  const ambiguousCatalog: NativeOkfConversationCatalog = {
    papers: [
      { slug: "fixture-alpha", conceptId: "papers/fixture-alpha", title: duplicateTitle },
      { slug: "fixture-beta", conceptId: "papers/fixture-beta", title: duplicateTitle },
    ],
    concepts: [],
  };
  const prepared = await prepareNativeOkfChatRequest(
    validateNativeOkfChatRequest({
      question: `What design principles are represented in ${duplicateTitle}?`,
    }),
    ambiguousCatalog,
  );
  assert.equal(prepared.clarification?.kind, "ambiguous-reference");
  assert.equal(prepared.clarification?.question, "Which paper are you referring to?");
  assert.equal((prepared.clarification?.question.match(/\?/gu) ?? []).length, 1);
});

test("an explicit title replaces stale unrelated paper focus for every paper", async () => {
  const { catalog, rows } = await corpusFixture;
  for (const [index, row] of rows.entries()) {
    const stale = rows[(index + 1) % rows.length]!;
    const state = emptyState(
      stale.slug,
      stale.associated.map((concept) => concept.id),
    );
    const prepared = await prepareNativeOkfChatRequest(
      validateNativeOkfChatRequest({
        question: `What is represented in ${row.title}?`,
        conversationState: state,
      }),
      catalog,
    );
    assert.deepEqual(prepared.focusedPaperSlugs, [row.slug], row.title);
    assert.ok(!prepared.retrievalQuestion.includes(stale.slug), row.title);
  }
});

test("all represented paper/category combinations retain requested evidence first", async () => {
  const { rows } = await corpusFixture;
  let combinations = 0;
  for (const row of rows) {
    for (const spec of CATEGORY_SPECS) {
      const selected = selectedFor(row, spec);
      if (selected.length === 0) continue;
      combinations += 1;
      const { prepared, retrieval } = await resolveRetrieval(
        categoryQuestion(row, spec),
      );
      assert.deepEqual(prepared.explicitPaperSlugs, [row.slug], row.title);
      assert.deepEqual(prepared.requestedConceptKinds, [spec.kind], row.title);
      const expectedIds = selected.map((concept) => concept.id);
      const finalIds = retrieval.finalConcepts.map((concept) => concept.conceptId);
      assert.deepEqual(finalIds.slice(0, expectedIds.length), expectedIds, `${row.title}: ${spec.type}`);
      assert.equal(finalIds[expectedIds.length], row.paper.id, `${row.title}: paper metadata order`);
      assert.ok(expectedIds.every((id) => finalIds.includes(id)), row.title);
      assert.ok(retrieval.finalConcepts.every((concept) =>
        concept.conceptId === row.paper.id || row.associated.some((item) => item.id === concept.conceptId)
      ), row.title);
      assert.ok(retrieval.contextCharacterEstimate <= MAX_CONTEXT_CHARACTERS);
      const context = buildNativeOkfGroundedContext(
        retrieval,
        categoryQuestion(row, spec),
        expectedIds,
      );
      assert.ok(expectedIds.every((id) => context.allowedConceptIds.has(id)));
      assert.ok(expectedIds.every((id) => context.requiredConceptIds?.has(id)));
      assert.ok(expectedIds.every((id) => context.prompt.includes(id)));
    }
  }
  const expectedCombinations = rows.reduce((sum, row) =>
    sum + CATEGORY_SPECS.filter((spec) => (row.counts.get(spec.type) ?? 0) > 0).length,
  0);
  assert.equal(combinations, expectedCombinations);
});

test("all absent paper/category combinations avoid fabrication and cross-paper borrowing", async () => {
  const { rows } = await corpusFixture;
  let absentCombinations = 0;
  for (const row of rows) {
    for (const spec of CATEGORY_SPECS) {
      if ((row.counts.get(spec.type) ?? 0) > 0) continue;
      absentCombinations += 1;
      const { prepared, retrieval } = await resolveRetrieval(
        categoryQuestion(row, spec),
      );
      assert.deepEqual(prepared.explicitPaperSlugs, [row.slug], row.title);
      assert.ok(!retrieval.finalConcepts.some((concept) => concept.type === spec.type), `${row.title}: ${spec.type}`);
      assert.ok(retrieval.finalConcepts.every((concept) =>
        concept.conceptId === row.paper.id || row.associated.some((item) => item.id === concept.conceptId)
      ), `${row.title}: borrowed evidence for ${spec.type}`);
    }
  }
  const expectedAbsentCombinations = rows.reduce((sum, row) =>
    sum + CATEGORY_SPECS.filter((spec) => (row.counts.get(spec.type) ?? 0) === 0).length,
  0);
  assert.equal(absentCombinations, expectedAbsentCombinations);
});

test("assistant history remains conversational context and never becomes retrieval evidence", async () => {
  const { catalog, rows } = await corpusFixture;
  const row = rows.find((candidate) => candidate.associated.length > 0)!;
  const spec = CATEGORY_SPECS.find((candidate) => (row.counts.get(candidate.type) ?? 0) > 0)!;
  const question = categoryQuestion(row, spec);
  const marker = "ASSISTANT_ONLY_EVIDENCE_MARKER_6C2_2";
  const withHistory = validateNativeOkfChatRequest({
    question,
    history: [{ role: "assistant", content: marker }],
  });
  const withoutHistory = validateNativeOkfChatRequest({ question });
  const preparedWith = await prepareNativeOkfChatRequest(withHistory, catalog);
  const preparedWithout = await prepareNativeOkfChatRequest(withoutHistory, catalog);
  assert.equal(preparedWith.retrievalQuestion, preparedWithout.retrievalQuestion);
  assert.ok(!preparedWith.retrievalQuestion.includes(marker));
  const raw = await retrieveOkfContext(preparedWith.retrievalQuestion);
  const retrieval = await assembleNativeOkfContextualRetrieval(preparedWith, raw);
  assert.ok(!retrieval.finalConcepts.some((concept) => concept.markdownBody.includes(marker)));
  const context = buildNativeOkfGroundedContext(retrieval, question);
  const input = buildNativeOkfModelInput(withHistory.history ?? [], context);
  assert.equal(input[0]?.content, marker);
  assert.ok(!input.at(-1)?.content.includes(marker));
});

test("the dynamic structural-diversity matrix covers every repository shape without invented columns", async () => {
  const { rows } = await corpusFixture;
  const structures = new Set(rows.map((row) => row.structure));
  assert.deepEqual(structures, REQUIRED_STRUCTURES);
  for (const structure of REQUIRED_STRUCTURES) {
    const row = rows
      .filter((candidate) => candidate.structure === structure)
      .sort((left, right) => right.associated.length - left.associated.length)[0];
    assert.ok(row, structure);
    const represented = CATEGORY_SPECS.find((spec) => (row.counts.get(spec.type) ?? 0) > 0)!;
    const absent = CATEGORY_SPECS.find((spec) => (row.counts.get(spec.type) ?? 0) === 0);
    const { retrieval } = await resolveRetrieval(categoryQuestion(row, represented));
    const requestedIds = selectedFor(row, represented).map((concept) => concept.id);
    assert.deepEqual(
      retrieval.finalConcepts.slice(0, requestedIds.length).map((concept) => concept.conceptId),
      requestedIds,
    );
    const semanticMap = buildPaperDesignMapFromBundle((await corpusFixture).bundle, row.paper);
    const storedMap = await buildStoredPaperDesignMap(row.paper.id);
    assert.ok(storedMap, row.title);
    assert.equal(storedMap.nodes.length, semanticMap.nodes.length, row.title);
    assert.equal(storedMap.edges.length, semanticMap.edges.length, row.title);
    assert.ok(storedMap.nodes.every((node) => node.provenance === "stored" && node.synthesis === false));
    assert.ok(storedMap.edges.every((edge) => edge.provenance === "stored"));
    if (absent) {
      assert.ok(!semanticMap.columns.some((column) => column.type === absent.type), `${row.title}: ${absent.type}`);
    }
  }
});

test("all 34 deterministic stored maps equal repository-derived semantic projections", async () => {
  const { bundle, rows } = await corpusFixture;
  let nodeTotal = 0;
  let edgeTotal = 0;
  for (const row of rows) {
    const semanticMap = buildPaperDesignMapFromBundle(bundle, row.paper);
    const storedMap = await buildStoredPaperDesignMap(row.paper.id);
    assert.ok(storedMap, row.title);
    nodeTotal += semanticMap.nodes.length;
    edgeTotal += semanticMap.edges.length;
    assert.deepEqual(storedMap.nodes.map((node) => node.id), semanticMap.nodes.map((node) => node.id), row.title);
    assert.deepEqual(
      storedMap.edges.map((edge) => [edge.source, edge.target, edge.label]),
      semanticMap.edges.map((edge) => [edge.sourceId, edge.targetId, edge.label]),
      row.title,
    );
    assert.ok(semanticMap.columns.every((column) => column.nodeIds.length > 0));
    assert.deepEqual(
      new Set(semanticMap.columns.map((column) => column.type)),
      new Set(row.associated.map((concept) => concept.type)),
    );
    assert.ok(semanticMap.nodes.every((node) => !/^(?:paper|reference|catalogue|backlink)$/iu.test(node.type)));
    assert.ok(storedMap.nodes.every((node) =>
      node.provenance === "stored" &&
      node.synthesis === false &&
      node.synthesisRationale === null &&
      node.supportConceptIds.length > 0
    ));
    assert.ok(storedMap.edges.every((edge) =>
      edge.provenance === "stored" && edge.supportConceptIds.length > 0
    ));
  }
  assert.equal(nodeTotal, rows.reduce((sum, row) => sum + row.associated.length, 0));
  assert.equal(
    edgeTotal,
    rows.reduce((sum, row) =>
      sum + buildPaperDesignMapFromBundle(bundle, row.paper).edges.length,
    0),
  );
});

test("requested-category-first packing is generic across large and sparse paper shapes", async () => {
  const { bundle, rows } = await corpusFixture;
  const maxByType = (type: string): CorpusRow => rows
    .filter((row) => (row.counts.get(type) ?? 0) > 0)
    .sort((left, right) => (right.counts.get(type) ?? 0) - (left.counts.get(type) ?? 0))[0]!;
  const broadest = [...rows].sort((left, right) => {
    const breadth = (row: CorpusRow) =>
      row.paper.markdownBody.length +
      (bundle.outgoing.get(row.paper.id)?.length ?? 0) * 1_000 +
      (bundle.incoming.get(row.paper.id)?.length ?? 0) * 1_000;
    return breadth(right) - breadth(left);
  })[0]!;
  const cases: Array<[CorpusRow, CategorySpec]> = [
    [maxByType("design-feature"), CATEGORY_SPECS.find((spec) => spec.type === "design-feature")!],
    [rows.filter((row) => row.structure === "design-principle").sort((a, b) => b.associated.length - a.associated.length)[0]!, CATEGORY_SPECS.find((spec) => spec.type === "design-principle")!],
    [maxByType("design-objective"), CATEGORY_SPECS.find((spec) => spec.type === "design-objective")!],
    [maxByType("meta-requirement"), CATEGORY_SPECS.find((spec) => spec.type === "meta-requirement")!],
    [broadest, CATEGORY_SPECS.find((spec) => (broadest.counts.get(spec.type) ?? 0) > 0)!],
  ];
  for (const [row, spec] of cases) {
    const selected = selectedFor(row, spec);
    const { retrieval } = await resolveRetrieval(categoryQuestion(row, spec));
    const finalIds = retrieval.finalConcepts.map((concept) => concept.conceptId);
    assert.deepEqual(finalIds.slice(0, selected.length), selected.map((concept) => concept.id), row.title);
    assert.equal(finalIds[selected.length], row.paper.id, row.title);
    assert.ok(selected.every((concept) => finalIds.includes(concept.id)), row.title);
    assert.ok(selected.every((concept) => !retrieval.debug.droppedConcepts.some((item) => item.conceptId === concept.id)), row.title);
    const packedPaper = retrieval.finalConcepts.find((concept) => concept.conceptId === row.paper.id);
    assert.ok(packedPaper, row.title);
    if (row.paper.markdownBody.length > PAPER_MARKDOWN_LIMIT) {
      assert.ok(packedPaper.markdownBody.length <= PAPER_MARKDOWN_LIMIT, row.title);
    }
    assert.ok(retrieval.contextCharacterEstimate <= MAX_CONTEXT_CHARACTERS);
    const truncatedWarning = retrieval.warnings.includes(
      "One or more Markdown bodies were truncated to fit the context limit.",
    );
    const actuallyTruncated = retrieval.finalConcepts.some((concept) => {
      const canonical = bundle.conceptsById.get(concept.conceptId);
      return canonical !== undefined && concept.markdownBody.length < canonical.markdownBody.length;
    });
    assert.equal(truncatedWarning, actuallyTruncated, row.title);
    const omittedWarning = retrieval.warnings.includes(
      "One or more concepts were omitted because the context limit was exhausted.",
    );
    assert.equal(
      omittedWarning,
      retrieval.debug.droppedConcepts.some((item) => item.reason === "context-limit"),
      row.title,
    );
  }
});

test("generic citation strictness applies to dynamically selected papers and categories", async () => {
  const { rows } = await corpusFixture;
  const samples = [...new Set(rows.map((row) => row.structure))]
    .slice(0, 6)
    .map((structure) => rows.find((row) => row.structure === structure)!);
  for (const row of samples) {
    const spec = CATEGORY_SPECS.find((candidate) => (row.counts.get(candidate.type) ?? 0) > 0)!;
    const selected = selectedFor(row, spec);
    const { retrieval } = await resolveRetrieval(categoryQuestion(row, spec));
    const requiredIds = selected.map((concept) => concept.id);
    const context = buildNativeOkfGroundedContext(retrieval, categoryQuestion(row, spec), requiredIds);
    const requestedSources = context.sources.filter((source) => requiredIds.includes(source.conceptId));
    const valid = validateAnswerCitations(
      requestedSources.map((source) => `Evidence [[${source.sourceId}]].`).join(" "),
      context,
    );
    assert.equal(valid.needsRepair, false, row.title);
    const invented = validateAnswerCitations(
      `${requestedSources.map((source) => `[[${source.sourceId}]]`).join(" ")} [[S999]]`,
      context,
    );
    assert.equal(invented.needsRepair, true, row.title);
    assert.deepEqual(invented.unknownSourceIds, ["S999"]);
    const paperSource = context.sources.find((source) => source.conceptId === row.paper.id);
    assert.ok(paperSource, row.title);
    const paperOnly = validateAnswerCitations(`Catalogue only [[${paperSource.sourceId}]].`, context);
    assert.equal(paperOnly.needsRepair, true, row.title);
  }
});

test("citation repair receives only the current retrieval allowlist", async () => {
  const { bundle, rows } = await corpusFixture;
  const row = rows.find((candidate) => candidate.structure === "design-feature+design-principle")!;
  const spec = CATEGORY_SPECS.find((candidate) => candidate.type === "design-feature")!;
  const selected = selectedFor(row, spec);
  const question = categoryQuestion(row, spec);
  const { prepared, raw, retrieval } = await resolveRetrieval(question);
  const context = buildNativeOkfGroundedContext(
    retrieval,
    question,
    selected.map((concept) => concept.id),
  );
  const paperSource = context.sources.find((source) => source.conceptId === row.paper.id);
  const requestedSource = context.sources.find((source) => source.conceptId === selected[0]?.id);
  assert.ok(paperSource);
  assert.ok(requestedSource);
  const requests: unknown[] = [];
  const result = await answerNativeOkfChat(
    { question },
    {
      prepared,
      retrieve: async () => raw,
      environment: ENVIRONMENT,
      client: mockedResponseClient([
        `Catalogue-only answer [[${paperSource.sourceId}]].`,
        `Direct requested evidence [[${requestedSource.sourceId}]].`,
      ], requests),
    },
  );
  assert.equal(requests.length, 2);
  assert.ok(result.sources.some((source) => source.conceptId === selected[0]?.id));
  const repairContent = sourceContents(requests[1]);
  const repairPaths = new Set(
    [...repairContent.matchAll(/<OKF_SOURCE id="S\d+" path="([^"]+)">/gu)]
      .map((match) => match[1]!),
  );
  assert.deepEqual(repairPaths, new Set(retrieval.finalConcepts.map((concept) => concept.conceptId)));
  assert.ok(!repairContent.includes("ASSISTANT_ONLY_EVIDENCE_MARKER_6C2_2"));
  assert.ok([...repairPaths].every((id) => bundle.conceptsById.has(id)));
});

test("required acceptance shapes are discovered from the repository rather than production slugs", async () => {
  const { rows } = await corpusFixture;
  const peerReview = rows.find((row) => /peer[\s-]*review|token[\s-]*incentive/iu.test(row.title));
  const consentHie = rows.find((row) => /consent[\s-]*self[\s-]*management|health information exchange|\bHIE\b/iu.test(row.title));
  const objectivePaper = rows.find((row) => (row.counts.get("design-objective") ?? 0) > 0);
  const metaPaper = rows.find((row) => (row.counts.get("meta-requirement") ?? 0) > 0);
  const secondRpf = rows
    .filter((row) => row.structure === "design-feature+design-principle+design-requirement")
    .sort((left, right) => right.associated.length - left.associated.length)[0];
  assert.ok(peerReview);
  assert.ok(consentHie);
  assert.ok(objectivePaper);
  assert.ok(metaPaper);
  assert.ok(secondRpf);

  for (const type of ["design-principle", "design-feature"] as const) {
    const spec = CATEGORY_SPECS.find((candidate) => candidate.type === type)!;
    const { retrieval } = await resolveRetrieval(categoryQuestion(peerReview, spec));
    assert.ok(selectedFor(peerReview, spec).every((concept) =>
      retrieval.finalConcepts.some((item) => item.conceptId === concept.id)
    ));
  }
  assert.equal(peerReview.counts.get("design-requirement") ?? 0, 0);
  const absentRequirement = await resolveRetrieval(
    categoryQuestion(peerReview, CATEGORY_SPECS.find((spec) => spec.type === "design-requirement")!),
  );
  assert.ok(!absentRequirement.retrieval.finalConcepts.some((concept) => concept.type === "design-requirement"));

  const consentPrinciples = CATEGORY_SPECS.find((spec) => spec.type === "design-principle")!;
  const consentResult = await resolveRetrieval(categoryQuestion(consentHie, consentPrinciples));
  assert.deepEqual(consentResult.prepared.explicitPaperSlugs, [consentHie.slug]);
  assert.ok(consentResult.retrieval.finalConcepts.every((concept) =>
    concept.conceptId === consentHie.paper.id || consentHie.associated.some((item) => item.id === concept.conceptId)
  ));

  for (const [row, type] of [
    [objectivePaper, "design-objective"],
    [metaPaper, "meta-requirement"],
  ] as const) {
    const spec = CATEGORY_SPECS.find((candidate) => candidate.type === type)!;
    const selected = selectedFor(row, spec);
    const { retrieval } = await resolveRetrieval(categoryQuestion(row, spec));
    assert.deepEqual(
      retrieval.finalConcepts.slice(0, selected.length).map((concept) => concept.conceptId),
      selected.map((concept) => concept.id),
    );
  }

  const semanticMap = buildPaperDesignMapFromBundle((await corpusFixture).bundle, secondRpf.paper);
  const storedMap = await buildStoredPaperDesignMap(secondRpf.paper.id);
  assert.ok(storedMap);
  assert.equal(storedMap.nodes.length, semanticMap.nodes.length);
  assert.equal(storedMap.edges.length, semanticMap.edges.length);
});

test("mutation resistance keeps title resolution and packing independent of known paper text", async () => {
  const { catalog, rows } = await corpusFixture;
  const row = rows
    .filter((candidate) => (candidate.counts.get("design-feature") ?? 0) > 0)
    .sort((left, right) => right.associated.length - left.associated.length)[0]!;
  const spec = CATEGORY_SPECS.find((candidate) => candidate.type === "design-feature")!;
  const generatedTitles = [
    "Trust Data Marketplace Design Framework",
    "Blockchain Marketplace Framework for Shared Data",
  ];
  for (const title of generatedTitles) {
    const fixtureCatalog: NativeOkfConversationCatalog = {
      papers: catalog.papers.map((paper) =>
        paper.slug === row.slug ? { ...paper, title } : paper
      ),
      concepts: catalog.concepts,
    };
    const { prepared, retrieval } = await resolveRetrieval(
      `What ${spec.phrase} are represented in ${title}?`,
      { catalog: fixtureCatalog },
    );
    assert.deepEqual(prepared.explicitPaperSlugs, [row.slug], title);
    assert.deepEqual(
      retrieval.finalConcepts.slice(0, selectedFor(row, spec).length).map((concept) => concept.conceptId),
      selectedFor(row, spec).map((concept) => concept.id),
      title,
    );
  }
});