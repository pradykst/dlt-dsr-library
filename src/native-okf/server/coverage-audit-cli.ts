import "server-only";

import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  buildCoverageAudit,
  formatCoverageAuditMarkdown,
} from "./coverage-audit.ts";

const root = process.cwd();
const markdownPath = resolve(root, "docs/native-okf-coverage-audit.md");
const artifactDirectory = resolve(
  root,
  "artifacts/native-okf-coverage-audit",
);
const jsonPath = resolve(artifactDirectory, "latest.json");

async function main(): Promise<void> {
  const report = await buildCoverageAudit();
  await mkdir(artifactDirectory, { recursive: true });
  await Promise.all([
    writeFile(markdownPath, formatCoverageAuditMarkdown(report), "utf8"),
    writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, "utf8"),
  ]);

  const warningCount = report.papers.reduce(
    (total, paper) => total + paper.warnings.length,
    0,
  );
  console.log("Native OKF semantic coverage audit");
  console.log(`Papers inspected: ${report.papers.length}`);
  console.log(
    `Format/link validity: ${report.validity.nativeFormatValid && report.validity.internalLinksValid ? "valid" : "review required"}`,
  );
  console.log(`Potential representation warnings: ${warningCount}`);
  console.log(
    `Papers with potential missing explicit categories: ${report.papersWithPotentialMissingExplicitCategories.length}`,
  );
  console.log("Markdown report: docs/native-okf-coverage-audit.md");
  console.log(
    "Machine-readable artifact: artifacts/native-okf-coverage-audit/latest.json",
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Native OKF coverage audit failed: ${message}`);
  process.exitCode = 1;
});

