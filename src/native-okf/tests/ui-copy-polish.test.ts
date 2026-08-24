import "server-only";

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { getAllConcepts } from "../server/index.ts";
import { buildReleaseHomeViewModel } from "../server/release-home.ts";
import {
  getLibraryViewModel,
  getPaperWorkbenchViewModel,
} from "../server/workbench.ts";
import {
  designKnowledgeStarterQuestion,
  groundedSolutionStarterQuestion,
  paperComparisonStarterQuestion,
  paperMapStarterQuestion,
} from "../shared/guided-starters.ts";
import {
  buildPaperPresentation,
  MISSING_DSR_DIMENSION_COPY,
  PAPER_DSR_DIMENSIONS,
  publicPaperFrontmatter,
} from "../shared/paper-presentation.ts";
import type { LinkedConceptGroupDto } from "../shared/types.ts";

async function source(relativePath: string): Promise<string> {
  return readFile(resolve(process.cwd(), relativePath), "utf8");
}

function compact(value: string): string {
  return value.replace(/\s+/gu, " ").trim();
}

test("desktop, mobile, and footer navigation use the approved public labels", async () => {
  const [header, footer] = await Promise.all([
    source("components/layout/SiteHeader.tsx"),
    source("components/layout/SiteFooter.tsx"),
  ]);
  for (const label of ["Home", "Library", "Chat"]) {
    assert.match(header, new RegExp(`label: "${label}"`, "u"));
  }
  assert.doesNotMatch(header, /label: "Grounded Chat"|label: "Researcher Access"/u);
  assert.match(header, /public-mobile-navigation/u);
  assert.match(footer, /label: "Chat"/u);
  assert.doesNotMatch(footer, /label: "Chat access"/u);
  assert.doesNotMatch(footer, /Universität Leipzig research context/u);
  for (const item of [header, footer]) {
    assert.match(item, /target="_blank"/u);
    assert.match(item, /rel="noopener noreferrer"/u);
  }
});

test("homepage uses the approved hero and removes superseded public sections", async () => {
  const [homepage, motif] = await Promise.all([
    source("src/native-okf/components/release/ReleaseHomepage.tsx"),
    source("src/native-okf/components/release/ReleaseSemanticMotif.tsx"),
  ]);
  assert.match(
    compact(homepage),
    /The DSR Knowledge Library represents design knowledge in the form of requirements, principles, features, and their relationships\. Researchers can inspect individual papers, compare reusable knowledge across studies, and interact with a source-grounded chatbot\./u,
  );
  assert.match(homepage, /Browse the library/u);
  assert.match(homepage, /Open chat/u);
  for (const removed of [
    "Request evaluation access",
    "How it works",
    "Inspect the evidence behind a response.",
    "Evaluate the research prototype",
  ]) assert.equal(homepage.includes(removed), false);
  assert.match(motif, /Illustrative design-knowledge structure/u);
  assert.doesNotMatch(motif, /A visual motif, not a stored result/u);
});

test("homepage statistics are derived from canonical repository concept types", async () => {
  const [view, concepts] = await Promise.all([
    buildReleaseHomeViewModel(),
    getAllConcepts(),
  ]);
  const expected = new Map<string, number>();
  for (const concept of concepts) {
    expected.set(concept.type, (expected.get(concept.type) ?? 0) + 1);
  }
  assert.deepEqual(
    view.metricCards.map(({ label, value }) => [label, value]),
    [
      ["Papers", expected.get("paper") ?? 0],
      ["Requirements", expected.get("design-requirement") ?? 0],
      ["Principles", expected.get("design-principle") ?? 0],
      ["Features", expected.get("design-feature") ?? 0],
    ],
  );
});

test("library page removes version, bundle, and concept-statistics presentation", async () => {
  const libraryPage = await source("app/native-okf/page.tsx");
  assert.match(libraryPage, /Research papers/u);
  for (const removed of [
    "Native Google OKF",
    "Version {library.version}",
    "Browse the canonical Markdown bundle directly",
    "Paper concepts",
    "Design-knowledge concepts",
    "Native concept types",
    "Concept counts by native type",
  ]) assert.equal(libraryPage.includes(removed), false);
  assert.doesNotMatch(libraryPage, /library\.typeCounts\.map/u);
});

test("each library paper card is one semantic link with no nested anchors", async () => {
  const card = await source("src/native-okf/components/PaperCard.tsx");
  assert.equal((card.match(/<Link\b/gu) ?? []).length, 1);
  assert.equal((card.match(/<article\b/gu) ?? []).length, 1);
  assert.match(card, /<article[\s\S]*?<Link[\s\S]*?Open paper[\s\S]*?<\/Link>[\s\S]*?<\/article>/u);
  assert.doesNotMatch(card, /<a\b|Open paper Workbench/u);
  assert.match(card, /cursor-pointer/u);
  assert.match(card, /focus-visible:ring-2/u);
  assert.match(card, /hover:-translate-y-0\.5/u);
});

test("paper presentation derives all six DSR dimensions and removes raw duplicates", async () => {
  const library = await getLibraryViewModel();
  assert.equal(library.papers.length, 34);
  for (const paper of library.papers) {
    const view = await getPaperWorkbenchViewModel(paper.id);
    assert.ok(view);
    const presentation = buildPaperPresentation(
      view.concept.markdownBody,
      view.linkedGroups,
    );
    assert.deepEqual(
      presentation.dsrDimensions.map(({ title }) => title),
      PAPER_DSR_DIMENSIONS.map(({ title }) => title),
    );
    assert.equal(presentation.dsrDimensions.length, 6);
    assert.equal(
      presentation.dsrDimensions.every(({ content }) => content.trim().length > 0),
      true,
    );
    assert.doesNotMatch(presentation.narrativeMarkdown, /^## DSR grid\s*$/imu);
    assert.doesNotMatch(presentation.narrativeMarkdown, /^## Design knowledge\s*$/imu);
    for (const group of view.linkedGroups) {
      for (const concept of group.concepts) {
        assert.equal(
          presentation.narrativeMarkdown.includes(concept.filePath),
          false,
          `${paper.id} repeats ${concept.id} in Overview`,
        );
      }
    }
  }
});

test("missing DSR dimensions use the restrained library-record fallback", () => {
  const presentation = buildPaperPresentation("# Generic paper\n\n## Summary\n\nA summary.");
  assert.equal(presentation.dsrDimensions.length, 6);
  assert.equal(
    presentation.dsrDimensions.every(
      ({ content, represented }) =>
        content === MISSING_DSR_DIMENSION_COPY && represented === false,
    ),
    true,
  );
});

test("paper page keeps structured knowledge while hiding technical and relationship presentation", async () => {
  const [workbench, grid] = await Promise.all([
    source("src/native-okf/components/WorkbenchView.tsx"),
    source("src/native-okf/components/PaperDsrGrid.tsx"),
  ]);
  const paperLinks = workbench.match(/const PAPER_SECTION_LINKS = \[[\s\S]*?\] as const;/u)?.[0] ?? "";
  assert.doesNotMatch(paperLinks, /Relationships/u);
  assert.match(workbench, /\{!isPaper \? \([\s\S]*?id="relationships"/u);
  assert.match(workbench, /paperPresentation\?\.narrativeMarkdown/u);
  assert.match(workbench, /title=\{isPaper \? "Design knowledge"/u);
  assert.match(workbench, /publicPaperFrontmatter\(frontmatter\)/u);
  assert.match(grid, /md:grid-cols-2 lg:grid-cols-3/u);
  assert.match(grid, /String\(index \+ 1\)\.padStart\(2, "0"\)/u);
  for (const dimension of PAPER_DSR_DIMENSIONS) {
    assert.equal(workbench.includes(`title="${dimension.title}"`), false);
  }

  const filtered = publicPaperFrontmatter({
    title: "Generic paper",
    timestamp: "hidden",
    bundle_path: "hidden",
    filePath: "hidden",
    methodology: "kept",
  });
  assert.deepEqual(filtered, { title: "Generic paper", methodology: "kept" });
});

test("paper Overview omits linked formal inventories while structured cards and graph remain intact", async () => {
  const view = await getPaperWorkbenchViewModel("papers/blockchain-iot-sensor-data");
  assert.ok(view);
  const presentation = buildPaperPresentation(
    view.concept.markdownBody,
    view.linkedGroups,
  );

  assert.doesNotMatch(presentation.narrativeMarkdown, /^## Design features\s*$/imu);
  assert.doesNotMatch(presentation.narrativeMarkdown, /Design feature DF1:/u);
  assert.match(presentation.narrativeMarkdown, /^## Summary\s*$/mu);
  assert.doesNotMatch(presentation.narrativeMarkdown, /^# Blockchain for the IoT:/mu);

  assert.deepEqual(
    view.linkedGroups.map((group) => [group.type, group.count]),
    [
      ["design-feature", 9],
      ["design-principle", 4],
      ["design-requirement", 4],
    ],
  );
  assert.equal(view.paperDesignMap?.nodes.length, 17);
  assert.equal(view.paperDesignMap?.edges.length, 14);

  const workbench = await source("src/native-okf/components/WorkbenchView.tsx");
  assert.match(workbench, /buildPaperPresentation\(concept\.markdownBody, view\.linkedGroups\)/u);
  assert.match(workbench, /view\.linkedGroups\.map[\s\S]*?<ConceptCard/u);
});

test("formal inventory filtering is type-generic and retains ordinary narrative", () => {
  const concept = (
    id: string,
    filePath: string,
    type: string,
    typeLabel: string,
    title: string,
  ) => ({ id, filePath, type, typeLabel, title, tags: [] });
  const groups: LinkedConceptGroupDto[] = [
    {
      type: "design-principle",
      typeLabel: "Design Principle",
      count: 1,
      concepts: [concept(
        "design-knowledge/example-dp1",
        "design-knowledge/example-dp1.md",
        "design-principle",
        "Design Principle",
        "DP1 - Preserve narrative",
      )],
    },
    {
      type: "design-requirement",
      typeLabel: "Design Requirement",
      count: 1,
      concepts: [concept(
        "design-knowledge/example-dr1",
        "design-knowledge/example-dr1.md",
        "design-requirement",
        "Design Requirement",
        "DR1 - Retain evidence",
      )],
    },
  ];
  const presentation = buildPaperPresentation([
    "# Example paper",
    "",
    "**Authors:** Example Author",
    "**Venue:** Example Venue",
    "**Link:** https://example.test",
    "",
    "## Summary",
    "",
    "The artifact uses design features to satisfy its privacy objectives.",
    "",
    "## Design principles",
    "",
    "* [Design principle DP1: Preserve narrative](../design-knowledge/example-dp1.md)",
    "",
    "## Design requirements",
    "",
    "* [Design requirement DR1: Retain evidence](../design-knowledge/example-dr1.md)",
    "",
    "## Discussion",
    "",
    "Ordinary discussion remains.",
  ].join("\n"), groups);

  assert.match(
    presentation.narrativeMarkdown,
    /artifact uses design features to satisfy its privacy objectives/u,
  );
  assert.match(presentation.narrativeMarkdown, /Ordinary discussion remains/u);
  assert.doesNotMatch(presentation.narrativeMarkdown, /^## Design principles\s*$/imu);
  assert.doesNotMatch(presentation.narrativeMarkdown, /^## Design requirements\s*$/imu);
  assert.doesNotMatch(presentation.narrativeMarkdown, /DP1: Preserve narrative/u);
  assert.doesNotMatch(presentation.narrativeMarkdown, /DR1: Retain evidence/u);
});

test("type presentation does not repeat adjacent semantic labels", async () => {
  const [workbench, conceptCard, generatedDiagram] = await Promise.all([
    source("src/native-okf/components/WorkbenchView.tsx"),
    source("src/native-okf/components/ConceptCard.tsx"),
    source("src/native-okf/components/chat/GeneratedDiagramPresentation.tsx"),
  ]);
  assert.match(
    compact(workbench),
    /isPaper \? \( <TypeBadge type=\{concept\.type\} label=\{concept\.typeLabel\} \/> \) : null/u,
  );
  assert.match(workbench, /aria-label=\{`\$\{group\.count\} \$\{group\.typeLabel\}`\}/u);
  assert.doesNotMatch(
    workbench,
    /<TypeBadge type=\{group\.type\} label=\{group\.typeLabel\} count=\{group\.count\} \/>/u,
  );
  assert.match(workbench, /showTypeBadge=\{false\}/u);
  assert.match(conceptCard, /showTypeBadge = true/u);
  assert.match(conceptCard, /\{showTypeBadge \? \(/u);
  assert.match(
    generatedDiagram,
    /!equivalentSemanticLabels\(node\.category, node\.stage\)/u,
  );
});

test("chat page and assistant panel use concise researcher-facing copy", async () => {
  const [page, workbench] = await Promise.all([
    source("app/native-okf/chat/page.tsx"),
    source("src/native-okf/components/chat/ChatWorkbench.tsx"),
  ]);
  assert.match(page, /Chat with the design knowledge library/u);
  assert.match(
    page,
    /Ask about papers and represented design knowledge, compare studies, or build a source-grounded decision-support flow\./u,
  );
  assert.match(workbench, /Design knowledge assistant/u);
  assert.match(
    compact(workbench),
    /Answers use retrieved library sources\. Conversation content remains in this browser tab and is not stored by the server\./u,
  );
  assert.doesNotMatch(page, /Research library chat|Native OKF grounded assistant|Local retrieval selects/u);
  assert.doesNotMatch(workbench, /Grounded native OKF assistant/u);
});

test("guided starter question generation remains unchanged", () => {
  assert.equal(
    paperMapStarterQuestion("Paper A"),
    'Show the stored design map for "Paper A".',
  );
  assert.equal(
    designKnowledgeStarterQuestion("Paper A", "design principles"),
    'What design principles are represented in "Paper A", and how are they related?',
  );
  assert.equal(
    paperComparisonStarterQuestion("Paper A", "Paper B"),
    'Compare "Paper A" and "Paper B", focusing on their represented design knowledge, important differences, and reusable mechanisms.',
  );
  assert.equal(
    groundedSolutionStarterQuestion("a generic coordination problem"),
    "Generate a grounded decision-support flow for a generic coordination problem.",
  );
});

test("chat is presented directly without researcher access-code friction", async () => {
  const [page, workbench, routes] = await Promise.all([
    source("app/native-okf/chat/page.tsx"),
    source("src/native-okf/components/chat/ChatWorkbench.tsx"),
    source("src/native-okf/shared/routes.ts"),
  ]);
  assert.match(page, /ChatWorkbench/u);
  assert.match(workbench, /New chat/u);
  assert.match(routes, /source: "\/access",[\s\S]*?destination: NATIVE_OKF_PUBLIC_ROUTES\.chat/u);
  assert.doesNotMatch(
    `${page}\n${workbench}`,
    /access code|questions remaining|diagrams remaining|invitation-controlled/iu,
  );
});
