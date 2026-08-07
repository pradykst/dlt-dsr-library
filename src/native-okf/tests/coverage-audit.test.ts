import "server-only";

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import { getOkfBundle } from "../server/cache.ts";
import {
  buildCoverageAudit,
  formatCoverageAuditMarkdown,
} from "../server/coverage-audit.ts";

test("coverage audit includes all 34 papers and canonical type totals", async () => {
  const [report, bundle] = await Promise.all([
    buildCoverageAudit(),
    getOkfBundle(),
  ]);
  assert.equal(report.papers.length, 34);
  assert.equal(new Set(report.papers.map((paper) => paper.paperId)).size, 34);
  assert.equal(
    Object.values(report.distribution).reduce((sum, count) => sum + count, 0),
    34,
  );

  const auditedTotals = new Map<string, number>();
  for (const paper of report.papers) {
    for (const [type, count] of Object.entries(paper.countsByType)) {
      auditedTotals.set(type, (auditedTotals.get(type) ?? 0) + count);
    }
  }
  for (const [type, concepts] of bundle.conceptsByType) {
    if (type === "paper" || type === "reference") continue;
    assert.equal(auditedTotals.get(type), concepts.length, "type total: " + type);
  }
});

test("known text/category mismatches are audit warnings, not invented concepts", async () => {
  const report = await buildCoverageAudit();

  const consent = report.papers.find(
    (paper) => paper.paperId === "papers/consent-self-management-hie",
  );
  assert.ok(consent);
  assert.equal(
    consent.warnings.some((warning) =>
      /design requirements|design features/iu.test(warning.message)
    ),
    false,
  );

  const trust = report.papers.find(
    (paper) => paper.paperId === "papers/trust-enabling-capacity-exchange",
  );
  assert.ok(trust);
  assert.equal(
    trust.warnings.some((warning) =>
      /meta-requirements|design features/iu.test(warning.message)
    ),
    false,
  );

  const nil = report.papers.find(
    (paper) => paper.paperId === "papers/nil-marketplace-fair-inclusive",
  );
  assert.ok(nil);
  assert.equal(
    nil.warnings.some((warning) => /design requirements/iu.test(warning.message)),
    false,
  );

  const peerReview = report.papers.find(
    (paper) => paper.paperId === "papers/peer-review-token-incentives",
  );
  assert.ok(peerReview);
  assert.equal(
    peerReview.warnings.some((warning) =>
      /design requirements/iu.test(warning.message)
    ),
    false,
  );
});

test("audit separates valid OKF links from semantic coverage warnings", async () => {
  const report = await buildCoverageAudit();
  assert.equal(report.validity.nativeFormatValid, true);
  assert.equal(report.validity.internalLinksValid, true);
  assert.equal(report.validity.fatalValidationErrorCount, 0);
  assert.equal(report.validity.brokenLinkWarningCount, 0);
  assert.ok(report.papers.some((paper) => paper.warnings.length > 0));

  const markdown = formatCoverageAuditMarkdown(report);
  assert.match(markdown, /Semantic coverage complete: not asserted/u);
  assert.match(markdown, /Warnings are signals for researcher review/u);
});

test("audit is read-only and contains no model dependency", async () => {
  const bundle = await getOkfBundle();
  const before = bundle.concepts.map((concept) => [
    concept.id,
    concept.rawMarkdown,
  ] as const);
  await buildCoverageAudit();
  const after = bundle.concepts.map((concept) => [
    concept.id,
    concept.rawMarkdown,
  ] as const);
  assert.deepEqual(after, before);

  const source = await readFile(
    resolve(process.cwd(), "src/native-okf/server/coverage-audit.ts"),
    "utf8",
  );
  assert.doesNotMatch(source, /openai|responses\.create|generateNativeOkf/iu);
});

