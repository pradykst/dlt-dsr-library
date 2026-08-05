import "server-only";

import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import test from "node:test";

import {
  loadOkfBundle,
  OkfBundleValidationError,
} from "../server/parser.ts";
import {
  formatOkfValidationReport,
  validateOkfBundle,
} from "../server/validation.ts";

const EXPECTED_TYPE_COUNTS = {
  "design-feature": 47,
  "design-goal": 3,
  "design-objective": 78,
  "design-principle": 124,
  "design-requirement": 73,
  "meta-requirement": 39,
  paper: 34,
  reference: 2,
} as const;

async function withTempBundle(
  files: Record<string, string | Uint8Array>,
  inspect: (bundleRoot: string) => Promise<void>,
): Promise<void> {
  const tempBase = resolve(tmpdir());
  const bundleRoot = await mkdtemp(join(tempBase, "native-okf-validation-"));

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

test("canonical bundle validation reports exact fixture totals", async () => {
  const report = await validateOkfBundle({ bundlePath: "knowledge/okf" });

  assert.equal(report.bundleRoot, resolve(process.cwd(), "knowledge/okf"));
  assert.equal(report.okfVersion, "0.1");
  assert.equal(report.markdownFileCount, 404);
  assert.equal(report.reservedFileCount, 4);
  assert.equal(report.conceptCount, 400);
  assert.deepEqual(report.countsByType, EXPECTED_TYPE_COUNTS);
  assert.equal(report.paperCount, 34);
  assert.equal(report.internalLinkCount, 1049);
  assert.equal(report.externalLinkCount, 0);
  assert.equal(report.brokenLinkWarningCount, 0);
  assert.equal(report.fatalValidationErrorCount, 0);
  assert.deepEqual(report.warnings, []);
  assert.deepEqual(report.fatalErrors, []);
});

test("validation formatting includes every required concise metric", async () => {
  const report = await validateOkfBundle({ bundlePath: "knowledge/okf" });
  const output = formatOkfValidationReport(report);

  for (const expectedLine of [
    `Bundle root: ${resolve(process.cwd(), "knowledge/okf")}`,
    "OKF version: 0.1",
    "Markdown files: 404",
    "Reserved files: 4",
    "Concepts: 400",
    "  paper: 34",
    "Papers: 34",
    "Internal links: 1049",
    "External links: 0",
    "Broken-link warnings: 0",
    "Fatal validation errors: 0",
  ]) {
    assert.match(output, new RegExp(expectedLine.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"), "u"));
  }
});

test("fatal document errors are structured while broken links remain warnings", async () => {
  const validConcept = [
    "---",
    "type: producer-defined-type",
    "custom_field: preserved",
    "---",
    "",
    "# Valid",
    "",
    "[Broken](./absent.md)",
    "[External](https://example.com/reference)",
    "",
  ].join("\n");
  const emptyType = ["---", "type: \"   \"", "---", "", "# Empty type", ""].join("\n");
  const malformedYaml = [
    "---",
    "type: [unterminated",
    "---",
    "",
    "# Malformed",
    "",
  ].join("\n");
  const pathEscape = [
    "---",
    "type: escape-test",
    "---",
    "",
    "# Escape",
    "",
    "[Outside](../outside.md)",
    "",
  ].join("\n");

  await withTempBundle(
    {
      "index.md": "---\nokf_version: \"0.1\"\n---\n\n# Validation fixture\n",
      "valid.md": validConcept,
      "missing-frontmatter.md": "# Missing frontmatter\n",
      "empty-type.md": emptyType,
      "malformed-yaml.md": malformedYaml,
      "invalid-utf8.md": new Uint8Array([0xff, 0xfe, 0x00]),
      "path-escape.md": pathEscape,
    },
    async (bundleRoot) => {
      const report = await validateOkfBundle({ bundlePath: bundleRoot });
      const fatalCodes = report.fatalErrors.map((issue) => issue.code).sort();

      assert.equal(report.markdownFileCount, 7);
      assert.equal(report.reservedFileCount, 1);
      assert.equal(report.conceptCount, 1);
      assert.deepEqual(report.countsByType, { "producer-defined-type": 1 });
      assert.equal(report.internalLinkCount, 1);
      assert.equal(report.externalLinkCount, 1);
      assert.equal(report.brokenLinkWarningCount, 1);
      assert.equal(report.fatalValidationErrorCount, 5);
      assert.deepEqual(fatalCodes, [
        "empty-type",
        "invalid-utf8",
        "malformed-yaml",
        "missing-frontmatter",
        "path-escape",
      ]);
      assert.deepEqual(
        report.warnings.map((issue) => ({
          severity: issue.severity,
          code: issue.code,
          sourceId: issue.sourceId,
          rawTarget: issue.rawTarget,
        })),
        [
          {
            severity: "warning",
            code: "broken-link",
            sourceId: "valid",
            rawTarget: "./absent.md",
          },
        ],
      );

      await assert.rejects(
        loadOkfBundle({ bundlePath: bundleRoot }),
        (error: unknown) => {
          assert.ok(error instanceof OkfBundleValidationError);
          assert.equal(error.bundle.fatalErrors.length, 5);
          return true;
        },
      );
    },
  );
});
