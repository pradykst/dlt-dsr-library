import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  inspectOkfHumanText,
  normalizeCanonicalText,
  normalizeSourceLocation,
  selectOkfDisplayText,
  type OkfTextIssueCode
} from "../lib/okf/text-hygiene.ts";
import { validateOkfTextLibrary } from "../lib/okf/text-hygiene-validator.ts";

type Fixture = {
  invalid: { code: OkfTextIssueCode; text: string; sourceLocation?: boolean }[];
  valid: string[];
};

const fixture = JSON.parse(fs.readFileSync(path.join(process.cwd(), "tests", "fixtures", "text-hygiene", "cases.json"), "utf8")) as Fixture;

test("neutral regression fixtures exercise each generic hygiene rule", () => {
  for (const item of fixture.invalid) {
    const codes = inspectOkfHumanText(item.text, { sourceLocation: item.sourceLocation }).map((finding) => finding.code);
    assert.ok(codes.includes(item.code), `${item.code} was not detected in ${JSON.stringify(item.text)}; received ${codes.join(", ")}`);
  }
  for (const text of fixture.valid) assert.deepEqual(inspectOkfHumanText(text), [], text);
});

test("source-location and canonical normalization are deterministic", () => {
  const source = "neutral-paper.pdf#page=4";
  const once = normalizeSourceLocation(source);
  assert.equal(once, "neutral-paper.pdf · page 4");
  assert.equal(normalizeSourceLocation(once), once);
  assert.equal(normalizeSourceLocation("neutral-paper.pdf ? page4"), "neutral-paper.pdf · page 4");
  assert.equal(normalizeCanonicalText("  Clean\u00a0 canonical   text  "), "Clean canonical text");
});

test("display text uses normalized canonical precedence and raw source last", () => {
  assert.equal(selectOkfDisplayText({
    normalizedText: "  Clean normalized text  ",
    canonicalDescription: "Canonical description",
    canonicalTitle: "Canonical title",
    rawSourceText: "Raw source text"
  }), "Clean normalized text");
  assert.equal(selectOkfDisplayText({ canonicalDescription: "Canonical description", canonicalTitle: "Canonical title", rawSourceText: "Raw source" }), "Canonical description");
  assert.equal(selectOkfDisplayText({ canonicalTitle: "Canonical title", rawSourceText: "Raw source" }), "Canonical title");
  assert.equal(selectOkfDisplayText({ rawSourceText: "Raw source" }), "Raw source");
});

test("verbatim evidence quotation is preserved and skipped by bundle validation", () => {
  const root = path.join(process.cwd(), ".okf-cache", "test-text-hygiene");
  const paper = path.join(root, "papers", "neutral-paper");
  fs.rmSync(root, { recursive: true, force: true });
  fs.mkdirSync(paper, { recursive: true });
  fs.writeFileSync(path.join(paper, "index.md"), `---\npaper_id: NEUTRAL_PAPER\ntitle: Neutral paper\n---\n\n# Neutral paper\n`, "utf8");
  const rawQuote = "Verbatim source keeps oddspacing.Next exactly.";
  fs.writeFileSync(path.join(paper, "evidence.md"), `---\npaper_id: NEUTRAL_PAPER\n---\n\n## Evidence: NEUTRAL_PAPER:ev_1\n\n\`\`\`json\n${JSON.stringify({ id: "NEUTRAL_PAPER:ev_1", supports: ["NEUTRAL_PAPER"], source_location: "neutral.pdf · page 1", quote_or_summary: rawQuote, evidence_type: "quote" }, null, 2)}\n\`\`\`\n`, "utf8");

  try {
    const result = validateOkfTextLibrary(root);
    assert.equal(result.verbatimQuoteCount, 1);
    assert.deepEqual(result.findings, []);
    assert.ok(fs.readFileSync(path.join(paper, "evidence.md"), "utf8").includes(rawQuote));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("all runtime OKF bundles and TEMPLATE pass deterministic text validation", () => {
  const first = validateOkfTextLibrary();
  const second = validateOkfTextLibrary();
  assert.equal(first.runtimePaperCount, 9);
  assert.equal(first.templateCount, 1);
  assert.deepEqual(first.findings, []);
  assert.deepEqual(second, first);
});

test("text-hygiene runtime contains no current-paper or query-specific replacement branches", () => {
  const runtime = ["lib/okf/text-hygiene.ts", "lib/okf/text-hygiene-validator.ts"]
    .map((file) => fs.readFileSync(path.join(process.cwd(), file), "utf8"))
    .join("\n");
  const ids = validateOkfTextLibrary().runtimePaperCount;
  assert.equal(ids, 9);
  assert.doesNotMatch(runtime, /if\s*\([^)]*(?:paperId|query)[^)]*===/);
  assert.doesNotMatch(runtime, /\.replace\([^\n]*(?:paperId|query)/);
});
