import "server-only";

import { parseOkfBundle } from "./parser.ts";
import type {
  LoadOkfBundleOptions,
  OkfBundle,
  OkfValidationReport,
} from "./types.ts";

export function createOkfValidationReport(
  bundle: OkfBundle,
): OkfValidationReport {
  const countsByType = Object.fromEntries(
    [...bundle.conceptsByType.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([type, concepts]) => [type, concepts.length]),
  );

  const links = bundle.concepts.flatMap((concept) => concept.outgoingLinks);
  const internalLinkCount = links.filter((link) => !link.external).length;
  const externalLinkCount = links.filter((link) => link.external).length;
  const brokenLinkWarningCount = bundle.warnings.filter(
    (warning) => warning.code === "broken-link",
  ).length;

  return {
    bundleRoot: bundle.rootPath,
    okfVersion: bundle.okfVersion,
    markdownFileCount: bundle.markdownFileCount,
    reservedFileCount: bundle.reservedDocuments.length,
    conceptCount: bundle.concepts.length,
    countsByType,
    paperCount: bundle.conceptsByType.get("paper")?.length ?? 0,
    internalLinkCount,
    externalLinkCount,
    brokenLinkWarningCount,
    fatalValidationErrorCount: bundle.fatalErrors.length,
    warnings: [...bundle.warnings],
    fatalErrors: [...bundle.fatalErrors],
  };
}

export async function validateOkfBundle(
  options: LoadOkfBundleOptions = {},
): Promise<OkfValidationReport> {
  const bundle = await parseOkfBundle(options);
  return createOkfValidationReport(bundle);
}

export function formatOkfValidationReport(report: OkfValidationReport): string {
  const typeCounts = Object.entries(report.countsByType)
    .map(([type, count]) => `  ${type}: ${count}`)
    .join("\n");

  return [
    "Native OKF validation",
    `Bundle root: ${report.bundleRoot}`,
    `OKF version: ${report.okfVersion ?? "not declared"}`,
    `Markdown files: ${report.markdownFileCount}`,
    `Reserved files: ${report.reservedFileCount}`,
    `Concepts: ${report.conceptCount}`,
    "Concepts by type:",
    typeCounts || "  (none)",
    `Papers: ${report.paperCount}`,
    `Internal links: ${report.internalLinkCount}`,
    `External links: ${report.externalLinkCount}`,
    `Broken-link warnings: ${report.brokenLinkWarningCount}`,
    `Fatal validation errors: ${report.fatalValidationErrorCount}`,
  ].join("\n");
}
