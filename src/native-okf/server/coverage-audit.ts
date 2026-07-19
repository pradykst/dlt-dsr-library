import "server-only";

import { getOkfBundle } from "./cache.ts";
import {
  associatedConceptsForPaper,
  projectSemanticEdges,
  semanticTypeRank,
} from "./paper-design-map.ts";
import type { OkfBundle, OkfConcept } from "./types.ts";
import { createOkfValidationReport } from "./validation.ts";

export type CoverageWarningCode =
  | "mentioned-category-missing"
  | "explicit-count-conflict"
  | "metadata-concept-not-linked"
  | "conflicting-source-paper"
  | "principle-implementation-unresolved"
  | "dsr-claim-without-design-knowledge";

export interface CoverageCountStatement {
  type: string;
  statedCount: number;
  text: string;
}

export interface CoverageWarning {
  code: CoverageWarningCode;
  message: string;
}

export interface PaperCoverageAudit {
  paperId: string;
  title: string;
  countsByType: Record<string, number>;
  semanticRelationshipCount: number;
  hasRequirements: boolean;
  hasPrinciples: boolean;
  hasFeatures: boolean;
  hasObjectivesGoalsOrMetaRequirements: boolean;
  explicitCountStatements: CoverageCountStatement[];
  warnings: CoverageWarning[];
}

export interface CoverageAuditReport {
  validity: {
    okfVersion?: string;
    markdownFileCount: number;
    conceptCount: number;
    paperCount: number;
    fatalValidationErrorCount: number;
    brokenLinkWarningCount: number;
    nativeFormatValid: boolean;
    internalLinksValid: boolean;
  };
  distribution: Record<string, number>;
  papersWithPotentialMissingExplicitCategories: string[];
  papers: PaperCoverageAudit[];
}

const COUNT_WORDS: Readonly<Record<string, number>> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
};

const CATEGORY_PATTERNS: ReadonlyArray<{
  type: string;
  expression: RegExp;
  phrase: string;
}> = [
  {
    type: "design-requirement",
    expression: /\bdesign[\s-]+requirements?\b/iu,
    phrase: "design requirements",
  },
  {
    type: "design-feature",
    expression: /\b(?:design|instantiation)[\s-]+features?\b|\bdesign\b[^\n.!?]{0,100}\bfeatures?\b|\binstantiat(?:e|es|ed|ing|ion)\b[^\n.!?]{0,100}\b(?:artifact|features?)\b/iu,
    phrase: "design features",
  },
  {
    type: "meta-requirement",
    expression: /\bmeta[\s-]+requirements?\b/iu,
    phrase: "meta-requirements",
  },
  {
    type: "design-objective",
    expression: /\bdesign[\s-]+objectives?\b/iu,
    phrase: "design objectives",
  },
];

function compareStrings(left: string, right: string): number {
  return left.localeCompare(right, "en");
}

function displayTitle(concept: OkfConcept): string {
  return concept.title?.trim() ||
    concept.headings.find((heading) => heading.depth === 1)?.text.trim() ||
    concept.id;
}

function scalarProducerText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (
    Array.isArray(value) &&
    value.length <= 20 &&
    value.every(
      (entry) =>
        typeof entry === "string" ||
        typeof entry === "number" ||
        typeof entry === "boolean",
    )
  ) {
    return value.join(" ");
  }
  return "";
}

function paperAuditText(paper: OkfConcept): string {
  const producerText = [
    paper.frontmatter.methodology,
    paper.frontmatter.description,
    paper.frontmatter.dsr_grid,
    paper.frontmatter.dsr_solution_space,
  ]
    .map(scalarProducerText)
    .filter(Boolean)
    .join("\n");
  return [
    paper.title ?? "",
    paper.description ?? "",
    producerText,
    paper.markdownBody,
  ].join("\n");
}

function countForType(
  countsByType: Readonly<Record<string, number>>,
  type: string,
): number {
  return countsByType[type] ?? 0;
}

function explicitCountStatements(text: string): CoverageCountStatement[] {
  const statements: CoverageCountStatement[] = [];
  const countPattern =
    "(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|\\d{1,2})";
  const categories = [
    ["design-requirement", "design[\\s-]+requirements?"],
    ["design-principle", "design[\\s-]+principles?"],
    ["design-feature", "design[\\s-]+features?"],
    ["meta-requirement", "meta[\\s-]+requirements?"],
    ["design-objective", "design[\\s-]+objectives?"],
    ["design-goal", "design[\\s-]+goals?"],
  ] as const;

  for (const [type, categoryPattern] of categories) {
    const expression = new RegExp(
      `\\b${countPattern}\\s+${categoryPattern}\\b`,
      "giu",
    );
    for (const match of text.matchAll(expression)) {
      const rawCount = match[1]?.toLocaleLowerCase("en") ?? "";
      const statedCount = /^\d+$/u.test(rawCount)
        ? Number(rawCount)
        : COUNT_WORDS[rawCount];
      if (statedCount === undefined) continue;
      statements.push({
        type,
        statedCount,
        text: match[0].replace(/\s+/gu, " ").trim(),
      });
    }
  }

  const unique = new Map<string, CoverageCountStatement>();
  for (const statement of statements) {
    const key = `${statement.type}\0${statement.statedCount}\0${statement.text.toLocaleLowerCase("en")}`;
    unique.set(key, statement);
  }

  return [...unique.values()].sort(
    (left, right) =>
      compareStrings(left.type, right.type) ||
      left.statedCount - right.statedCount ||
      compareStrings(left.text, right.text),
  );
}

function sourcePaperValue(concept: OkfConcept): string | undefined {
  return typeof concept.frontmatter.source_paper === "string" &&
      concept.frontmatter.source_paper.trim() !== ""
    ? concept.frontmatter.source_paper.trim()
    : undefined;
}

function normalizeReference(value: string): string {
  return value
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/\.md$/u, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function sourcePaperMatches(concept: OkfConcept, paper: OkfConcept): boolean {
  const sourcePaper = sourcePaperValue(concept);
  if (!sourcePaper) return false;
  const expected = new Set(
    [
      paper.id,
      paper.filePath,
      paper.id.split("/").at(-1) ?? "",
      paper.title ?? "",
      displayTitle(paper),
    ].map(normalizeReference),
  );
  return expected.has(normalizeReference(sourcePaper));
}

function countsByType(concepts: readonly OkfConcept[]): Record<string, number> {
  const counts = new Map<string, number>();
  for (const concept of concepts) {
    counts.set(concept.type, (counts.get(concept.type) ?? 0) + 1);
  }
  return Object.fromEntries(
    [...counts.entries()].sort(
      ([left], [right]) =>
        semanticTypeRank(left) - semanticTypeRank(right) ||
        compareStrings(left, right),
    ),
  );
}

function paperWarnings(
  bundle: OkfBundle,
  paper: OkfConcept,
  concepts: readonly OkfConcept[],
  counts: Readonly<Record<string, number>>,
  countStatements: readonly CoverageCountStatement[],
): CoverageWarning[] {
  const warnings: CoverageWarning[] = [];
  const text = paperAuditText(paper);

  for (const category of CATEGORY_PATTERNS) {
    if (category.expression.test(text) && countForType(counts, category.type) === 0) {
      warnings.push({
        code: "mentioned-category-missing",
        message:
          `Paper text mentions ${category.phrase}, but no ${category.type} concept is associated with the paper.`,
      });
    }
  }

  for (const statement of countStatements) {
    const actual = countForType(counts, statement.type);
    if (statement.statedCount !== actual) {
      warnings.push({
        code: "explicit-count-conflict",
        message:
          `Text states ${JSON.stringify(statement.text)} (${statement.statedCount}), but ${actual} associated ${statement.type} concepts are represented.`,
      });
    }
  }

  const directLinkedIds = new Set(
    (bundle.outgoing.get(paper.id) ?? [])
      .map((link) => link.targetId)
      .filter((id): id is string => Boolean(id)),
  );
  for (const concept of concepts) {
    if (sourcePaperMatches(concept, paper) && !directLinkedIds.has(concept.id)) {
      warnings.push({
        code: "metadata-concept-not-linked",
        message:
          `${concept.id} declares this source paper in metadata, but the paper does not link back to it.`,
      });
    }
  }

  for (const id of directLinkedIds) {
    const concept = bundle.conceptsById.get(id);
    if (
      !concept ||
      concept.type === "paper" ||
      concept.type === "reference" ||
      !sourcePaperValue(concept) ||
      sourcePaperMatches(concept, paper)
    ) {
      continue;
    }
    warnings.push({
      code: "conflicting-source-paper",
      message:
        `The paper links ${concept.id}, but its source_paper metadata identifies a different paper.`,
    });
  }

  for (const principle of concepts.filter(
    (concept) => concept.type === "design-principle",
  )) {
    const declaresImplementation = principle.headings.some((heading) =>
      /^implement(?:s|ed|ing)?(?:\s+by)?$/iu.test(heading.text.trim())
    );
    if (!declaresImplementation) continue;
    const resolvedFeature = [
      ...(bundle.outgoing.get(principle.id) ?? []),
      ...(bundle.incoming.get(principle.id) ?? []),
    ].some((link) => {
      const otherId =
        link.sourceId === principle.id ? link.targetId : link.sourceId;
      return otherId
        ? bundle.conceptsById.get(otherId)?.type === "design-feature"
        : false;
    });
    if (!resolvedFeature) {
      warnings.push({
        code: "principle-implementation-unresolved",
        message:
          `${principle.id} has an Implements/Implemented-by heading but no resolved design-feature relationship.`,
      });
    }
  }

  const claimsDsrDesignKnowledge =
    /\b(?:DSR[\s-]+grid|design[\s-]+theor(?:y|ies))\b/iu.test(text);
  if (claimsDsrDesignKnowledge && concepts.length === 0) {
    warnings.push({
      code: "dsr-claim-without-design-knowledge",
      message:
        "Paper text claims a DSR grid or design theory, but no associated design-knowledge concepts are represented.",
    });
  }

  return warnings.sort(
    (left, right) =>
      compareStrings(left.code, right.code) ||
      compareStrings(left.message, right.message),
  );
}

function distributionKey(counts: Readonly<Record<string, number>>): string {
  const types = Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([type]) => type)
    .sort(
      (left, right) =>
        semanticTypeRank(left) - semanticTypeRank(right) ||
        compareStrings(left, right),
    );
  return types.length > 0 ? types.join(" + ") : "no associated design knowledge";
}

export function buildCoverageAuditFromBundle(
  bundle: OkfBundle,
): CoverageAuditReport {
  const validation = createOkfValidationReport(bundle);
  const papers = [...(bundle.conceptsByType.get("paper") ?? [])]
    .sort((left, right) => compareStrings(left.id, right.id))
    .map((paper): PaperCoverageAudit => {
      const concepts = associatedConceptsForPaper(bundle, paper);
      const counts = countsByType(concepts);
      const statements = explicitCountStatements(paperAuditText(paper));
      return {
        paperId: paper.id,
        title: displayTitle(paper),
        countsByType: counts,
        semanticRelationshipCount: projectSemanticEdges(bundle, concepts).length,
        hasRequirements: countForType(counts, "design-requirement") > 0,
        hasPrinciples: countForType(counts, "design-principle") > 0,
        hasFeatures: countForType(counts, "design-feature") > 0,
        hasObjectivesGoalsOrMetaRequirements:
          countForType(counts, "design-objective") > 0 ||
          countForType(counts, "design-goal") > 0 ||
          countForType(counts, "meta-requirement") > 0,
        explicitCountStatements: statements,
        warnings: paperWarnings(bundle, paper, concepts, counts, statements),
      };
    });

  const distribution = new Map<string, number>();
  for (const paper of papers) {
    const key = distributionKey(paper.countsByType);
    distribution.set(key, (distribution.get(key) ?? 0) + 1);
  }

  return {
    validity: {
      ...(validation.okfVersion ? { okfVersion: validation.okfVersion } : {}),
      markdownFileCount: validation.markdownFileCount,
      conceptCount: validation.conceptCount,
      paperCount: validation.paperCount,
      fatalValidationErrorCount: validation.fatalValidationErrorCount,
      brokenLinkWarningCount: validation.brokenLinkWarningCount,
      nativeFormatValid: validation.fatalValidationErrorCount === 0,
      internalLinksValid: validation.brokenLinkWarningCount === 0,
    },
    distribution: Object.fromEntries(
      [...distribution.entries()].sort(([left], [right]) =>
        compareStrings(left, right)
      ),
    ),
    papersWithPotentialMissingExplicitCategories: papers
      .filter((paper) =>
        paper.warnings.some(
          (warning) =>
            warning.code === "mentioned-category-missing" ||
            warning.code === "explicit-count-conflict",
        )
      )
      .map((paper) => paper.paperId),
    papers,
  };
}

export async function buildCoverageAudit(): Promise<CoverageAuditReport> {
  return buildCoverageAuditFromBundle(await getOkfBundle());
}

export function formatCoverageAuditMarkdown(
  report: CoverageAuditReport,
): string {
  const distributionLines = Object.entries(report.distribution).map(
    ([combination, count]) => `- ${combination}: ${count}`,
  );
  const missingLines =
    report.papersWithPotentialMissingExplicitCategories.length > 0
      ? report.papersWithPotentialMissingExplicitCategories.map(
          (paperId) => `- \`${paperId}\``,
        )
      : ["- None detected."];

  const paperSections = report.papers.map((paper) => {
    const typeCounts = Object.entries(paper.countsByType)
      .map(([type, count]) => `  - ${type}: ${count}`)
      .join("\n") || "  - none";
    const statements = paper.explicitCountStatements
      .map(
        (statement) =>
          `  - ${statement.text}: stated ${statement.statedCount} ${statement.type}`,
      )
      .join("\n") || "  - none detected";
    const warnings = paper.warnings
      .map((warning) => `  - [${warning.code}] ${warning.message}`)
      .join("\n") || "  - none";

    return [
      `### ${paper.title}`,
      "",
      `- Paper ID: \`${paper.paperId}\``,
      `- Semantic relationships: ${paper.semanticRelationshipCount}`,
      `- Requirements present: ${paper.hasRequirements ? "yes" : "no"}`,
      `- Principles present: ${paper.hasPrinciples ? "yes" : "no"}`,
      `- Features present: ${paper.hasFeatures ? "yes" : "no"}`,
      `- Objectives, goals, or meta-requirements present: ${paper.hasObjectivesGoalsOrMetaRequirements ? "yes" : "no"}`,
      "- Native concept counts:",
      typeCounts,
      "- Explicit count statements:",
      statements,
      "- Potential representation warnings:",
      warnings,
    ].join("\n");
  });

  return [
    "# Native OKF coverage audit",
    "",
    "This offline audit separates format/link validity from semantic coverage. Warnings are signals for researcher review, not proof that the canonical data is wrong. It never creates or modifies OKF concepts.",
    "",
    "## Validity boundaries",
    "",
    `- OKF version: ${report.validity.okfVersion ?? "not declared"}`,
    `- Markdown files: ${report.validity.markdownFileCount}`,
    `- Concepts: ${report.validity.conceptCount}`,
    `- Papers: ${report.validity.paperCount}`,
    `- Native format valid: ${report.validity.nativeFormatValid ? "yes" : "no"} (${report.validity.fatalValidationErrorCount} fatal errors)`,
    `- Internal links valid: ${report.validity.internalLinksValid ? "yes" : "no"} (${report.validity.brokenLinkWarningCount} broken-link warnings)`,
    "- Semantic coverage complete: not asserted; review the warnings below.",
    "",
    "## Corpus distribution",
    "",
    ...distributionLines,
    "",
    "## Papers with potential missing explicit categories",
    "",
    ...missingLines,
    "",
    "## Per-paper audit",
    "",
    ...paperSections.flatMap((section) => [section, ""]),
  ].join("\n").trimEnd() + "\n";
}

