import "server-only";

import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { extname, relative, resolve } from "node:path";
import test from "node:test";

import {
  conceptHref,
  isSafeExternalHref,
  NATIVE_OKF_ROOT,
  resolveOkfMarkdownHref,
} from "../shared/links.ts";
import {
  equivalentSemanticLabels,
  fallbackTitleFromId,
  formatConceptType,
  normalizeCatchAllSegments,
  titleWithoutRepeatedProducerLabel,
} from "../shared/presentation.ts";

test("catch-all normalization retains the complete bundle-relative path", () => {
  assert.equal(
    normalizeCatchAllSegments([
      "design-knowledge",
      "blockchain-iot-sensor-data-dp1",
    ]),
    "design-knowledge/blockchain-iot-sensor-data-dp1",
  );
  assert.equal(
    normalizeCatchAllSegments("papers\\aligning-newsvendors-scoring-rules"),
    "papers/aligning-newsvendors-scoring-rules",
  );
  assert.equal(
    normalizeCatchAllSegments(["%64esign-knowledge", "peer-review-token-incentives-df1"]),
    "design-knowledge/peer-review-token-incentives-df1",
  );
  assert.equal(normalizeCatchAllSegments(undefined), undefined);
  assert.equal(normalizeCatchAllSegments(null), undefined);
  assert.equal(normalizeCatchAllSegments([]), undefined);
  assert.equal(normalizeCatchAllSegments(["", "papers", "", "paper-id"]), "papers/paper-id");
});

test("catch-all normalization rejects traversal and encoded separators", () => {
  const unsafeValues = [
    ["..", "outside"],
    ["%2e%2e", "outside"],
    ["design-knowledge", "%2Foutside"],
    ["design-knowledge", "%5Coutside"],
    ["design-knowledge", "with?query"],
    ["design-knowledge", "with#fragment"],
    ["design-knowledge", "\0outside"],
    ["design-knowledge", "   "],
    ["bad%ZZencoding"],
  ] as const;

  for (const value of unsafeValues) {
    assert.throws(
      () => normalizeCatchAllSegments(value),
      RangeError,
      `expected unsafe catch-all value to fail: ${JSON.stringify(value)}`,
    );
  }
});

test("internal Markdown destinations rewrite to canonical paper and concept routes", () => {
  assert.deepEqual(
    resolveOkfMarkdownHref(
      "../papers/blockchain-iot-sensor-data.md#summary",
      "design-knowledge/blockchain-iot-sensor-data-dp1.md",
    ),
    {
      href: "/papers/blockchain-iot-sensor-data#summary",
      external: false,
    },
  );
  assert.deepEqual(
    resolveOkfMarkdownHref(
      "./blockchain-iot-sensor-data-dr1.md?view=compact",
      "design-knowledge/blockchain-iot-sensor-data-dp1.md",
    ),
    {
      href: "/concepts/design-knowledge/blockchain-iot-sensor-data-dr1?view=compact",
      external: false,
    },
  );
  assert.deepEqual(
    resolveOkfMarkdownHref("#addresses", "design-knowledge/example.md"),
    { href: "#addresses", external: false },
  );
  assert.equal(conceptHref("papers/blockchain-iot-sensor-data.md"),
    "/papers/blockchain-iot-sensor-data");
  assert.equal(conceptHref("design-knowledge/example.md"),
    "/concepts/design-knowledge/example");
  assert.equal(conceptHref("papers/index.md"), NATIVE_OKF_ROOT);
});

test("safe external Markdown URLs pass and unsafe destinations are rejected", () => {
  const sourcePath = "design-knowledge/example.md";

  for (const href of [
    "javascript:alert(1)",
    "java\nscript:alert(1)",
    "data:text/html,unsafe",
    "vbscript:msgbox(1)",
    "file:///outside.md",
    "//example.com/protocol-relative",
    "../../outside.md",
    "%2e%2e/%2e%2e/outside.md",
    "./image.png",
    "",
  ]) {
    assert.equal(
      resolveOkfMarkdownHref(href, sourcePath),
      undefined,
      `expected unsafe Markdown destination to fail: ${JSON.stringify(href)}`,
    );
  }

  assert.deepEqual(resolveOkfMarkdownHref("https://example.com/paper", sourcePath), {
    href: "https://example.com/paper",
    external: true,
  });
  assert.deepEqual(resolveOkfMarkdownHref("mailto:author@example.com", sourcePath), {
    href: "mailto:author@example.com",
    external: true,
  });
  assert.equal(isSafeExternalHref(" HTTPS://example.com "), true);
  assert.equal(isSafeExternalHref("javascript:alert(1)"), false);
});

test("unknown producer-defined types receive generic readable presentation", () => {
  assert.equal(formatConceptType("quantum_widget--alpha"), "Quantum Widget Alpha");
  assert.equal(formatConceptType("  producer defined type  "), "Producer Defined Type");
  assert.equal(formatConceptType(""), "Unknown");
  assert.equal(
    fallbackTitleFromId("producer-space/custom_widget.md"),
    "Custom Widget",
  );
});

test("producer labels remain visible once without changing source titles", () => {
  assert.equal(
    titleWithoutRepeatedProducerLabel("DP1 - Decentralized control", "DP1"),
    "Decentralized control",
  );
  assert.equal(
    titleWithoutRepeatedProducerLabel("MDR4 — Integrate object events", "MDR4"),
    "Integrate object events",
  );
  assert.equal(
    titleWithoutRepeatedProducerLabel("S#IA: Preserve source syntax", "S#IA"),
    "Preserve source syntax",
  );
  assert.equal(
    titleWithoutRepeatedProducerLabel("DF3.1 - Detailed feature", "DF3.1"),
    "Detailed feature",
  );
  assert.equal(
    titleWithoutRepeatedProducerLabel("DF3.1 - Detailed feature", "DF3"),
    "DF3.1 - Detailed feature",
  );
  assert.equal(
    titleWithoutRepeatedProducerLabel("Cross-organizational trust", "DP1"),
    "Cross-organizational trust",
  );
  assert.equal(titleWithoutRepeatedProducerLabel("DP1", "DP1"), "DP1");
});

test("semantic label comparison ignores formatting but preserves distinct categories", () => {
  assert.equal(equivalentSemanticLabels("Design Principle", "design-principle"), true);
  assert.equal(equivalentSemanticLabels("Meta Requirement", "meta_requirement"), true);
  assert.equal(equivalentSemanticLabels("Producer Type A", "producer-type-a"), true);
  assert.equal(equivalentSemanticLabels("Design Principle", "Design Feature"), false);
});

const AUDITED_EXTENSIONS = new Set([".cjs", ".js", ".jsx", ".json", ".mjs", ".ts", ".tsx"]);
const CONFIGURATION_FILES = [
  "eslint.config.mjs",
  "next.config.ts",
  "package-lock.json",
  "package.json",
  "postcss.config.mjs",
  "tailwind.config.ts",
  "tsconfig.json",
] as const;

async function collectAuditFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const absolutePath = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectAuditFiles(absolutePath));
    } else if (entry.isFile() && AUDITED_EXTENSIONS.has(extname(entry.name).toLowerCase())) {
      files.push(absolutePath);
    }
  }

  return files;
}

function importedSpecifiers(source: string): string[] {
  const specifiers: string[] = [];
  const patterns = [
    /\bfrom\s+["']([^"']+)["']/gu,
    /\bimport\s+["']([^"']+)["']/gu,
    /\b(?:import|require)\s*\(\s*["']([^"']+)["']/gu,
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      if (match[1]) specifiers.push(match[1]);
    }
  }
  return specifiers;
}

test("native routes, native source, and permitted configuration have isolated imports", async () => {
  const cwd = process.cwd();
  const scopedFiles = [
    ...await collectAuditFiles(resolve(cwd, "app/native-okf")),
    ...await collectAuditFiles(resolve(cwd, "src/native-okf")),
    ...CONFIGURATION_FILES.map((filePath) => resolve(cwd, filePath)),
  ];
  const serializedArtifactPattern = new RegExp(["graph", "json"].join("\\."), "iu");
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

  for (const absolutePath of [...new Set(scopedFiles)].sort()) {
    const source = await readFile(absolutePath, "utf8");
    const displayPath = relative(cwd, absolutePath).replaceAll("\\", "/");

    if (serializedArtifactPattern.test(source)) {
      violations.push(`${displayPath}: accesses a forbidden serialized graph artifact`);
    }

    for (const specifier of importedSpecifiers(source)) {
      const normalized = specifier.replaceAll("\\", "/").toLowerCase();
      const forbiddenPart = forbiddenImportParts.find((part) => normalized.includes(part));
      if (forbiddenPart) {
        violations.push(`${displayPath}: forbidden import ${JSON.stringify(specifier)}`);
      }
    }
  }

  assert.deepEqual(violations, []);
});
