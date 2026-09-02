import "server-only";

import assert from "node:assert/strict";
import test from "node:test";

import {
  findExplicitNativeOkfPaperSlugs,
  loadNativeOkfConversationCatalog,
  prepareNativeOkfChatRequest,
  type NativeOkfConversationCatalog,
} from "../server/conversation.ts";
import {
  answerNativeOkfChat,
  validateNativeOkfChatRequest,
} from "../server/openai/chat.ts";

/**
 * Property tests over the live 34-paper corpus: no author name, title, or slug is
 * hardcoded here. Every assertion is derived from the repository's own frontmatter
 * at test time, per the project's anti-hardcoding policy.
 */

const catalogFixture = (async () => loadNativeOkfConversationCatalog())();

function authorSurname(fullName: string): string {
  const parts = fullName.trim().split(/\s+/u);
  return parts.at(-1) ?? fullName;
}

test("a full author name unique to one paper resolves that paper without any other cue", async () => {
  const catalog = await catalogFixture;
  let exercised = 0;
  for (const paper of catalog.papers) {
    for (const author of paper.authors ?? []) {
      if (author.length < 6) continue;
      const papersWithThisAuthor = catalog.papers.filter((candidate) =>
        (candidate.authors ?? []).includes(author)
      );
      // Real co-authorship across multiple corpus papers is expected to require
      // disambiguation, not a guess — exercised by the ambiguity test below instead.
      if (papersWithThisAuthor.length !== 1) continue;
      const slugs = findExplicitNativeOkfPaperSlugs(
        `What does ${author} propose?`,
        catalog,
      );
      assert.equal(slugs[0], paper.slug, `${author} -> ${paper.title}`);
      exercised += 1;
    }
  }
  assert.ok(exercised > 0, "expected at least one unique-author fixture from the live corpus");
});

test("author surname shorthand ('<surname> paper', 'paper by <surname>') resolves when unique in the corpus", async () => {
  const catalog = await catalogFixture;
  const slugsBySurname = new Map<string, Set<string>>();
  for (const paper of catalog.papers) {
    for (const author of paper.authors ?? []) {
      const surname = authorSurname(author);
      if (surname.length < 3) continue;
      const key = surname.toLocaleLowerCase("en");
      if (!slugsBySurname.has(key)) slugsBySurname.set(key, new Set());
      slugsBySurname.get(key)!.add(paper.slug);
    }
  }
  let exercised = 0;
  for (const [surname, slugs] of slugsBySurname) {
    if (slugs.size !== 1) continue;
    const slug = [...slugs][0]!;
    for (
      const phrasing of [
        `Show the ${surname} paper`,
        `What is the paper by ${surname} about?`,
      ]
    ) {
      const resolved = findExplicitNativeOkfPaperSlugs(phrasing, catalog);
      assert.equal(resolved[0], slug, `"${phrasing}" -> expected ${slug}`);
    }
    exercised += 1;
    if (exercised >= 25) break;
  }
  assert.ok(exercised > 0, "expected at least one unique-surname fixture from the live corpus");
});

test("a shared author name across two papers clarifies instead of silently guessing", async () => {
  const sharedAuthor = "Fixture Shared Author";
  const ambiguousCatalog: NativeOkfConversationCatalog = {
    papers: [
      {
        slug: "fixture-shared-a",
        conceptId: "papers/fixture-shared-a",
        title: "Fixture Study Alpha",
        authors: [sharedAuthor],
      },
      {
        slug: "fixture-shared-b",
        conceptId: "papers/fixture-shared-b",
        title: "Fixture Study Beta",
        authors: [sharedAuthor],
      },
    ],
    concepts: [],
  };
  const prepared = await prepareNativeOkfChatRequest(
    validateNativeOkfChatRequest({
      question: `What does ${sharedAuthor} propose in their paper?`,
    }),
    ambiguousCatalog,
  );
  assert.equal(prepared.clarification?.kind, "ambiguous-reference");
  assert.equal((prepared.clarification?.question.match(/\?/gu) ?? []).length, 1);
});

test("catalogs built without an authors field never crash paper resolution", async () => {
  const legacyCatalog: NativeOkfConversationCatalog = {
    papers: [
      {
        slug: "legacy-a",
        conceptId: "papers/legacy-a",
        title: "Legacy Paper Without Author Metadata",
      },
    ],
    concepts: [],
  };
  const slugs = findExplicitNativeOkfPaperSlugs(
    "What does the author propose in Legacy Paper Without Author Metadata?",
    legacyCatalog,
  );
  assert.equal(slugs[0], "legacy-a");
});

test("named two-paper comparisons with build/design vocabulary still route to MULTI_PAPER_QA, not synthesis", async () => {
  const catalog = await catalogFixture;
  const [first, second] = catalog.papers;
  assert.ok(first && second, "expected at least two catalog papers");
  const phrasings = [
    `Compare "${first!.title}" and "${second!.title}", focusing on their represented design knowledge, differences, similarities, reusable mechanisms, lessons, implications, and transferability.`,
    `Compare "${first!.title}" and "${second!.title}" and discuss which design approach transfers better to new settings.`,
  ];
  for (const question of phrasings) {
    const prepared = await prepareNativeOkfChatRequest(
      validateNativeOkfChatRequest({ question }),
      catalog,
    );
    assert.equal(prepared.queryMode, "MULTI_PAPER_QA", question);
    assert.equal(prepared.turnPlan.mode, "TEXT_QA", question);
    assert.notEqual(prepared.intent, "synthesized-flow", question);
    assert.deepEqual(
      [...prepared.explicitPaperSlugs].sort((left, right) => left.localeCompare(right, "en")),
      [first!.slug, second!.slug].sort((left, right) => left.localeCompare(right, "en")),
      question,
    );
  }
});

test("quoted paper titles never leak synthesis-trigger vocabulary into a natural comparison", async () => {
  // Regression: real paper titles routinely contain words like "Designing" or
  // "Privacy-Preserving" that used to trip synthesis-intent detection even when the
  // user's own sentence never asked to build anything — found via live acceptance
  // testing on real corpus title pairs, not a constructed edge case.
  const catalog = await catalogFixture;
  const papers = catalog.papers;
  assert.ok(papers.length >= 2, "expected at least two catalog papers");
  let exercised = 0;
  for (let i = 0; i + 1 < papers.length; i += 1) {
    const a = papers[i]!;
    const b = papers[i + 1]!;
    const question =
      `What do "${a.title}" and "${b.title}" have in common, and what is different about their approaches?`;
    const prepared = await prepareNativeOkfChatRequest(
      validateNativeOkfChatRequest({ question }),
      catalog,
    );
    assert.notEqual(prepared.intent, "synthesized-flow", question);
    exercised += 1;
  }
  assert.equal(exercised, papers.length - 1);
});

test("an ambiguous reference combined with a diagram request never crashes and never renders a diagram", async () => {
  // Regression: CLARIFICATION and SCOPE_GUARDRAIL both short-circuit before any
  // diagram is built, but turnPlan.includeDiagram used to keep the raw pre-clarification
  // diagram preference, disagreeing with diagramAction === "NONE" and throwing
  // "Native OKF resolved turn plan is inconsistent." Found via a real "<surname> paper
  // pls, diagram pls" acceptance request whose surname matched two corpus co-authors.
  const duplicateTitle = "Ambiguous Fixture Diagram Study";
  const ambiguousCatalog: NativeOkfConversationCatalog = {
    papers: [
      {
        slug: "fixture-diagram-a",
        conceptId: "papers/fixture-diagram-a",
        title: duplicateTitle,
      },
      {
        slug: "fixture-diagram-b",
        conceptId: "papers/fixture-diagram-b",
        title: duplicateTitle,
      },
    ],
    concepts: [],
  };
  const question = `Show the design map for ${duplicateTitle}, diagram please.`;
  const prepared = await prepareNativeOkfChatRequest(
    validateNativeOkfChatRequest({ question, includeDiagram: true }),
    ambiguousCatalog,
  );
  assert.equal(prepared.clarification?.kind, "ambiguous-reference");
  assert.equal(prepared.turnPlan.diagramAction, "NONE");
  assert.equal(prepared.turnPlan.includeDiagram, false);
  assert.equal(prepared.includeDiagram, prepared.turnPlan.includeDiagram);

  const response = await answerNativeOkfChat(
    { question, includeDiagram: true },
    { prepared },
  );
  assert.equal(response.kind, "clarification");
  assert.equal(response.diagramMode, null);
});

test("an explicit new-artifact request layered on a comparison still routes to design synthesis", async () => {
  const catalog = await catalogFixture;
  const [first, second] = catalog.papers;
  assert.ok(first && second, "expected at least two catalog papers");
  const question =
    `Compare "${first!.title}" and "${second!.title}" and combine them into a new artifact for my problem.`;
  const prepared = await prepareNativeOkfChatRequest(
    validateNativeOkfChatRequest({ question }),
    catalog,
  );
  assert.equal(prepared.intent, "synthesized-flow", question);
});

test("a bare 'show the map' request with no resolvable subject clarifies instead of answering an arbitrary topic", async () => {
  // Regression: GENERIC_DIAGRAM_PATTERN only recognized flow/flowchart/diagram/graph/
  // architecture, not "map" (the exact phrase the project's own behavioral contract
  // names), and didn't account for "me"/"the" before the noun. A subject-less "show me
  // the map" fell through to a full evidence-grounded answer on whatever topic retrieval
  // happened to surface, instead of asking who/what to map. Found via browser verification.
  const catalog = await catalogFixture;
  for (
    const question of [
      "show me the map",
      "show the map",
      "show me a diagram",
      "generate a flow",
    ]
  ) {
    const prepared = await prepareNativeOkfChatRequest(
      validateNativeOkfChatRequest({ question }),
      catalog,
    );
    assert.equal(prepared.clarification?.kind, "missing-domain", question);
  }
});

test("a diagram request naming a real paper never clarifies, regardless of the GENERIC_DIAGRAM_PATTERN fix", async () => {
  const catalog = await catalogFixture;
  const paper = catalog.papers[0]!;
  const prepared = await prepareNativeOkfChatRequest(
    validateNativeOkfChatRequest({
      question: `Show the full design map for "${paper.title}".`,
      includeDiagram: true,
    }),
    catalog,
  );
  assert.equal(prepared.clarification, null);
  assert.equal(prepared.focusedPaperSlugs[0], paper.slug);
});
