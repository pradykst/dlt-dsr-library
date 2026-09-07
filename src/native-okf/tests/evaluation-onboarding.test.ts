import "server-only";

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { getNativeOkfGuidedStarterPapers } from "../server/guided-starters.ts";
import { shouldShowNativeOkfEvaluationCallout } from "../shared/evaluation-onboarding.ts";
import {
  designKnowledgeStarterQuestion,
  groundedSolutionStarterQuestion,
  hasMeaningfulGuidedProblem,
  isGuidedQuestionWithinBounds,
  MAX_GUIDED_QUESTION_CHARACTERS,
  NATIVE_OKF_GUIDED_STARTER_KINDS,
  paperComparisonStarterQuestion,
  paperMapStarterQuestion,
  validateDistinctGuidedPapers,
} from "../shared/guided-starters.ts";
import { NATIVE_OKF_EVALUATION_SURVEY_URL } from "../shared/public-links.ts";

const root = process.cwd();

async function source(path: string): Promise<string> {
  return readFile(resolve(root, path), "utf8");
}

test("guided onboarding exposes exactly four repository workflows", () => {
  assert.deepEqual(NATIVE_OKF_GUIDED_STARTER_KINDS, [
    "paper-map",
    "design-knowledge",
    "paper-comparison",
    "grounded-solution",
  ]);
});

test("guided catalog contains all canonical papers in deterministic title order", async () => {
  const first = await getNativeOkfGuidedStarterPapers();
  const second = await getNativeOkfGuidedStarterPapers();
  assert.equal(first.length, 34);
  assert.deepEqual(first, second);
  assert.deepEqual(
    first.map((paper) => paper.title),
    first
      .map((paper) => paper.title)
      .toSorted((left, right) => left.localeCompare(right, "en")),
  );
  assert.equal(new Set(first.map((paper) => paper.id)).size, 34);
  for (const paper of first) {
    assert.deepEqual(Object.keys(paper).sort(), ["categories", "id", "title"]);
  }
});

test("category choices are repository-derived and omit absent categories", async () => {
  const papers = await getNativeOkfGuidedStarterPapers();
  const principlesOnly = papers.find(
    (paper) =>
      paper.categories.length === 1 &&
      paper.categories[0]?.type === "design-principle",
  );
  const objectivesOnly = papers.find(
    (paper) =>
      paper.categories.length === 1 &&
      paper.categories[0]?.type === "design-objective",
  );
  assert.ok(principlesOnly);
  assert.deepEqual(principlesOnly.categories.map((item) => item.type), [
    "design-principle",
  ]);
  assert.ok(objectivesOnly);
  assert.deepEqual(objectivesOnly.categories.map((item) => item.type), [
    "design-objective",
  ]);
  assert.equal(
    papers.flatMap((paper) => paper.categories).some((category) => !category.label),
    false,
  );
});

test("starter questions preserve canonical titles and researcher problem content", () => {
  const first = "A Canonical Paper: Design and Evidence";
  const second = "Another Canonical Paper — A Study";
  assert.equal(
    paperMapStarterQuestion(first),
    `Show the stored design map for "${first}".`,
  );
  assert.equal(
    designKnowledgeStarterQuestion(first, "design principles"),
    `What design principles are represented in "${first}", and how are they related?`,
  );
  assert.equal(
    paperComparisonStarterQuestion(first, second),
    `Compare "${first}" and "${second}", focusing on their represented design knowledge, important differences, and reusable mechanisms.`,
  );
  const problem = "reducing coordination gaps without removing human oversight";
  assert.equal(
    groundedSolutionStarterQuestion(problem),
    `Generate a decision-support flow for ${problem}.`,
  );
});

test("comparison and problem validation reject invalid configurations", () => {
  assert.equal(
    validateDistinctGuidedPapers("paper-a", "paper-a"),
    "Choose two distinct papers for the comparison.",
  );
  assert.equal(validateDistinctGuidedPapers("paper-a", "paper-b"), null);
  assert.equal(hasMeaningfulGuidedProblem("short"), false);
  assert.equal(
    hasMeaningfulGuidedProblem("A sufficiently meaningful problem"),
    true,
  );
  assert.equal(
    isGuidedQuestionWithinBounds("x".repeat(MAX_GUIDED_QUESTION_CHARACTERS)),
    true,
  );
  assert.equal(
    isGuidedQuestionWithinBounds("x".repeat(MAX_GUIDED_QUESTION_CHARACTERS + 1)),
    false,
  );
});

test("production starter logic contains no canonical paper-title or topic branches", async () => {
  const papers = await getNativeOkfGuidedStarterPapers();
  const starterSource = (
    await Promise.all([
      source("src/native-okf/shared/guided-starters.ts"),
      source("src/native-okf/server/guided-starters.ts"),
      source("src/native-okf/components/chat/GuidedChatStarters.tsx"),
    ])
  ).join("\n");
  for (const paper of papers) assert.equal(starterSource.includes(paper.title), false);
  for (const topic of [
    "product identity",
    "marketplaces",
    "cryptocurrency",
    "Blockchain for the IoT",
  ]) {
    assert.equal(starterSource.toLocaleLowerCase("en").includes(topic.toLocaleLowerCase("en")), false);
  }
});

test("corpus starter cards are the four capabilities and never the removed single-paper workflows", async () => {
  const { NATIVE_OKF_CORPUS_STARTERS } = await import(
    "../shared/corpus-starters.ts"
  );
  assert.deepEqual(
    NATIVE_OKF_CORPUS_STARTERS.map((starter: { label: string }) => starter.label),
    [
      "Find relevant design knowledge",
      "Discover reusable design patterns",
      "Compare two papers",
      "Build a design proposal",
    ],
  );
  for (const starter of NATIVE_OKF_CORPUS_STARTERS) {
    assert.ok(starter.description.length > 20, starter.label);
    assert.ok(starter.example.length > 20, starter.label);
  }
  const labels = NATIVE_OKF_CORPUS_STARTERS.map(
    (starter: { label: string }) => starter.label,
  );
  assert.equal(labels.includes("Explore a paper map"), false);
  assert.equal(labels.includes("Inspect design knowledge"), false);
});

test("starter component prefills editable examples and never auto-sends or calls an API", async () => {
  const component = await source(
    "src/native-okf/components/chat/GuidedChatStarters.tsx",
  );
  assert.match(component, /NATIVE_OKF_CORPUS_STARTERS/u);
  assert.match(component, /onPrefill\(starter\.example\)/u);
  assert.match(component, /<button/u);
  assert.doesNotMatch(component, /<select/u);
  assert.doesNotMatch(component, /\bfetch\s*\(/u);
  assert.doesNotMatch(component, /\/api\/native-okf/u);
  assert.doesNotMatch(component, /submitQuestion/u);
  assert.match(component, /nothing is\s*\n?\s*sent until you press Send/u);
});

test("New chat resets scope and conversation, and the @ / paper helper text is present", async () => {
  const workbench = await source(
    "src/native-okf/components/chat/ChatWorkbench.tsx",
  );
  assert.equal((workbench.match(/async function submitQuestion\(/gu) ?? []).length, 1);
  assert.match(workbench, /onPrefill=\{prefillComposer\}/u);
  assert.match(workbench, /setStartersOpen\(true\)/u);
  assert.match(workbench, /clearNativeOkfChatSession\(window\.sessionStorage, sessionKey\)/u);
  assert.doesNotMatch(workbench, /window\.localStorage/u);
  assert.match(workbench, /Use <span[^>]*>@<\/span> or\{" "\}\s*<span[^>]*>\/paper<\/span>/u);
  const clearStart = workbench.indexOf("function clearConversation()");
  const clearBody = workbench.slice(clearStart, clearStart + 900);
  // Main chat New Chat returns to All papers; drawer New Chat keeps its paper.
  assert.match(clearBody, /lockedScope \?\? \{ type: "corpus" as const \}/u);
  assert.match(clearBody, /setScope\(resetScope\)/u);
});

test("evaluation callout requires a substantive text or diagram answer", () => {
  assert.equal(shouldShowNativeOkfEvaluationCallout([]), false);
  assert.equal(
    shouldShowNativeOkfEvaluationCallout([
      { kind: "clarification", presentationMode: "clarification", insufficientContext: true },
    ]),
    false,
  );
  assert.equal(
    shouldShowNativeOkfEvaluationCallout([
      { kind: "answer", presentationMode: "no-match", insufficientContext: true },
    ]),
    false,
  );
  assert.equal(
    shouldShowNativeOkfEvaluationCallout([
      { kind: "answer", presentationMode: "text-primary", insufficientContext: false },
    ]),
    true,
  );
  assert.equal(
    shouldShowNativeOkfEvaluationCallout([
      { kind: "answer", presentationMode: "diagram-primary", insufficientContext: false },
    ]),
    true,
  );
});

test("survey URL is centralized and external links are safe and untracked", async () => {
  assert.equal(
    NATIVE_OKF_EVALUATION_SURVEY_URL,
    "https://www.soscisurvey.de/dlt-library-evaluation/",
  );
  assert.equal(new URL(NATIVE_OKF_EVALUATION_SURVEY_URL).search, "");
  const paths = [
    "src/native-okf/shared/public-links.ts",
    "components/layout/SiteHeader.tsx",
    "components/layout/SiteFooter.tsx",
    "src/native-okf/components/release/ReleaseMethod.tsx",
    "src/native-okf/components/chat/ChatWorkbench.tsx",
  ];
  const sources = await Promise.all(paths.map(source));
  assert.equal(
    sources.reduce(
      (count, item) => count + (item.match(/https:\/\/www\.soscisurvey\.de\/dlt-library-evaluation\//gu)?.length ?? 0),
      0,
    ),
    1,
  );
  for (const item of sources.slice(1)) {
    assert.match(item, /NATIVE_OKF_EVALUATION_SURVEY_URL/u);
    assert.match(item, /target="_blank"/u);
    assert.match(item, /rel="noopener noreferrer"/u);
  }
});

test("public navigation and Method evaluation copy meet the release boundary", async () => {
  const header = await source("components/layout/SiteHeader.tsx");
  const footer = await source("components/layout/SiteFooter.tsx");
  const method = await source("src/native-okf/components/release/ReleaseMethod.tsx");
  for (const label of [
    "Home",
    "Library",
    "Chat",
    "Give feedback",
  ]) assert.match(header, new RegExp(label, "u"));
  assert.doesNotMatch(header, />\s*Admin(?:istrator)?\s*</u);
  assert.match(footer, /Evaluation survey/u);
  assert.match(method, /evaluated with researchers/u);
  assert.match(method, /generated synthesis[\s\S]*researcher review/u);
  assert.match(method, /in a new tab/u);
});

test("deployment hygiene covers production start, ignored artifacts, and canonical sitemap", async () => {
  const packageJson = JSON.parse(await source("package.json")) as {
    scripts?: Record<string, string>;
  };
  assert.equal(packageJson.scripts?.start, "next start");
  const gitignore = await source(".gitignore");
  for (const pattern of [
    ".next/",
    ".env",
    "runtime/",
    "/runtime/",
    "/coverage",
    "*.log",
    "/test-results/",
    "/playwright-report/",
  ]) assert.match(gitignore, new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));
  const sitemap = await source("app/sitemap.ts");
  assert.doesNotMatch(sitemap, /soscisurvey/u);
  assert.doesNotMatch(sitemap, /\/admin/u);
});

test("the server chat page passes the bounded scope catalog without introducing an API", async () => {
  const page = await source("app/native-okf/chat/page.tsx");
  assert.match(page, /getNativeOkfScopePapers\(\)/u);
  assert.match(page, /<ChatWorkbench papers=\{scopePapers\}/u);
  assert.doesNotMatch(page, /fetch\(/u);
  assert.doesNotMatch(page, /fullText|markdownBody|rawBody/u);
});
