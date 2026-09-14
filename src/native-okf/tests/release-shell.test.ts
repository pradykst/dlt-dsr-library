import "server-only";

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import {
  buildReleaseHomeViewModel,
  selectRepresentativePapers,
} from "../server/release-home.ts";
import { conceptHref, resolveOkfMarkdownHref } from "../shared/links.ts";
import {
  CANONICAL_ROUTES,
  LEGACY_API_BLOCK_REWRITES,
  NATIVE_OKF_COMPATIBILITY_REDIRECTS,
  conceptRouteHref,
  paperHref,
  validateNativeOkfRouteIntegrity,
} from "../shared/routes.ts";
import type { PaperCardDto } from "../shared/types.ts";

const EXPECTED_COMPATIBILITY_REDIRECTS = new Map([
  ["/native-okf", "/library"],
  ["/native-okf/chat", "/chat"],
  ["/native-okf/access", "/chat"],
  ["/native-okf/papers/:slug", "/papers/:slug"],
  ["/native-okf/concepts/:conceptId*", "/concepts/:conceptId*"],
  ["/native-okf/admin/access", "/route-unavailable"],
  ["/native-okf/admin", "/route-unavailable"],
]);

async function source(relativePath: string): Promise<string> {
  return readFile(resolve(process.cwd(), relativePath), "utf8");
}

function paperFixture(
  id: string,
  linkedConceptCount: number,
  linkedTypeCount: number,
  year: string,
): PaperCardDto {
  return {
    id,
    filePath: `${id}.md`,
    type: "paper",
    typeLabel: "Paper",
    title: id,
    tags: [],
    authors: [],
    year,
    search: {
      title: id,
      description: "",
      authors: [],
      year,
      venue: "",
      tags: [],
    },
    linkedConcepts: Array.from({ length: linkedConceptCount }, (_, index) => ({
      id: `${id}/concept-${index}`,
      filePath: `${id}/concept-${index}.md`,
      type: "design-principle",
      typeLabel: "Design Principle",
      title: `Concept ${index}`,
      tags: [],
    })),
    linkedTypeCounts: Array.from({ length: linkedTypeCount }, (_, index) => ({
      type: `type-${index}`,
      label: `Type ${index}`,
      count: 1,
    })),
  };
}

test("release homepage metrics are derived from the canonical native bundle", async () => {
  const viewModel = await buildReleaseHomeViewModel();

  assert.deepEqual(viewModel.metrics, {
    paperCount: 34,
    conceptCount: 462,
    resolvedNativeLinkCount: 1325,
    representedTypeCount: 8,
  });
  assert.deepEqual(
    viewModel.metricCards.map(({ label, value }) => [label, value]),
    [
      ["Papers", 34],
      ["Requirements", 89],
      ["Principles", 127],
      ["Features", 61],
    ],
  );
});

test("representative-paper selection is generic, bounded, and deterministic", () => {
  const fixtures = [
    paperFixture("papers/zeta", 4, 2, "2025"),
    paperFixture("papers/alpha", 8, 2, "2020"),
    paperFixture("papers/beta", 8, 3, "2019"),
    paperFixture("papers/gamma", 8, 3, "2024"),
  ];
  const expected = ["papers/gamma", "papers/beta", "papers/alpha"];

  assert.deepEqual(
    selectRepresentativePapers(fixtures, 3).map((paper) => paper.id),
    expected,
  );
  assert.deepEqual(
    selectRepresentativePapers([...fixtures].reverse(), 3).map((paper) => paper.id),
    expected,
  );
  assert.deepEqual(selectRepresentativePapers(fixtures, -1), []);
});

test("homepage presents the research hero, canonical actions, and notice", async () => {
  const homepage = await source("src/native-okf/components/release/ReleaseHomepage.tsx");

  assert.match(homepage, /Explore, connect, and reuse design knowledge from DSR papers\./u);
  assert.match(homepage, /Browse the library/u);
  assert.match(homepage, /Open chat/u);
  assert.doesNotMatch(homepage, /Request evaluation access/u);
  assert.match(homepage, /CANONICAL_ROUTES\.library/u);
  assert.match(homepage, /CANONICAL_ROUTES\.chat/u);
  assert.match(
    homepage,
    /This research prototype is undergoing knowledge-curation and researcher evaluation\./u,
  );
  assert.match(
    homepage,
    /Generated responses should be checked against the cited design knowledge and original publications\./u,
  );

  for (const unsupportedClaim of [
    "complete extraction from every paper",
    "perfect semantic coverage",
    "comprehensive representation of all dsr literature",
    "automated truth",
    "superior to reading original papers",
  ]) {
    assert.equal(homepage.toLowerCase().includes(unsupportedClaim), false);
  }
});

test("canonical routes and temporary compatibility redirects are loop-free", () => {
  assert.deepEqual(CANONICAL_ROUTES, {
    home: "/",
    library: "/library",
    chat: "/chat",
    imprint: "/imprint",
    privacy: "/privacy",
  });
  assert.deepEqual(validateNativeOkfRouteIntegrity(), []);
  assert.deepEqual(
    LEGACY_API_BLOCK_REWRITES.map(({ source: routeSource, destination }) => [
      routeSource,
      destination,
    ]),
    [
      ["/api/okf/:path*", "/api/native-okf/retired"],
      ["/api/workbench/:path*", "/api/native-okf/retired"],
      ["/api/desrist-evaluation/:path*", "/api/native-okf/retired"],
    ],
  );

  const actual = new Map(
    NATIVE_OKF_COMPATIBILITY_REDIRECTS.map((redirect) => [
      redirect.source,
      redirect.destination,
    ]),
  );
  for (const [sourcePath, destination] of EXPECTED_COMPATIBILITY_REDIRECTS) {
    assert.equal(actual.get(sourcePath), destination);
    assert.notEqual(sourcePath, destination);
    assert.equal(
      NATIVE_OKF_COMPATIBILITY_REDIRECTS.find(
        (redirect) => redirect.source === sourcePath,
      )?.permanent,
      false,
    );
  }
});

test("global header and footer expose only the intended public navigation", async () => {
  const [header, footer] = await Promise.all([
    source("components/layout/SiteHeader.tsx"),
    source("components/layout/SiteFooter.tsx"),
  ]);

  for (const label of ["Home", "Library", "Chat"]) {
    assert.match(header, new RegExp(`label: "${label}"`, "u"));
  }
  assert.match(header, /Give feedback/u);
  assert.match(header, /aria-controls="public-mobile-navigation"/u);
  assert.match(header, /aria-expanded=\{isOpen\}/u);
  assert.match(footer, /Imprint/u);
  assert.doesNotMatch(footer, /Method and limitations/u);
  assert.match(footer, /label: "Privacy"/u);
  assert.doesNotMatch(footer, /Privacy note/u);

  const combined = `${header}\n${footer}`;
  for (const forbidden of [
    "Admin",
    "Explore",
    "Patterns",
    "Flow Builder",
    "OKF Chat",
    "Workbench",
    "NEW",
    "OLD",
  ]) {
    assert.equal(combined.includes(forbidden), false, `unexpected public shell label: ${forbidden}`);
  }
  assert.equal(combined.includes("CANONICAL_ROUTES.admin"), false);
});

test("legal pages provide institutional contact and operational privacy", async () => {
  const privacy = await source("app/privacy/page.tsx");
  const imprint = await source("app/imprint/page.tsx");
  assert.match(privacy, /OpenAI/);
  assert.match(privacy, /session storage/);
  assert.match(privacy, /operational|Operational/);
  assert.match(imprint, /DE 141510383/);
  assert.match(imprint, /max.graeser@uni-leipzig.de/);
});

test("sitemap source includes canonical public records and excludes private routes", async () => {
  const sitemap = await source("app/sitemap.ts");

  for (const routeName of ["home", "library", "chat", "imprint", "privacy"]) {
    assert.match(sitemap, new RegExp(`CANONICAL_ROUTES\\.${routeName}`, "u"));
  }
  assert.match(sitemap, /conceptPageHref\(concept\.id\)/u);
  assert.equal(sitemap.includes("CANONICAL_ROUTES.admin"), false);
  assert.doesNotMatch(sitemap, /["']\/api\//u);
  assert.doesNotMatch(sitemap, /["']\/native-okf/u);
});

test("paper, concept, and Markdown helpers now return canonical public routes", () => {
  assert.equal(
    paperHref("papers/blockchain-iot-sensor-data"),
    "/papers/blockchain-iot-sensor-data",
  );
  assert.equal(
    conceptRouteHref("design-knowledge/blockchain-iot-sensor-data-dp1"),
    "/concepts/design-knowledge/blockchain-iot-sensor-data-dp1",
  );
  assert.equal(
    conceptHref("papers/blockchain-iot-sensor-data.md"),
    "/papers/blockchain-iot-sensor-data",
  );
  assert.deepEqual(
    resolveOkfMarkdownHref(
      "../papers/blockchain-iot-sensor-data.md#summary",
      "design-knowledge/blockchain-iot-sensor-data-dp1.md",
    ),
    { href: "/papers/blockchain-iot-sensor-data#summary", external: false },
  );
});
