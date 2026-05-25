import { extractDoiFromText } from "@/lib/ingest/doi";
import type { DsrField, DsrGridExtraction, DsrParseResult, ExtractedMetadata, ParserDiagnostic, PdfExtractionResult } from "@/lib/ingest/parser-types";
import { detectSections, fieldFromQuote, linesOf, normalizeText, sectionsMatching, sentencesOf, topSentences, uniqueByLabel, wordSlice } from "@/lib/ingest/text-utils";

const problemTerms = ["problem", "challenge", "gap", "lack", "limited", "difficulty", "need", "objective", "research question"];
const inputTerms = ["theory", "framework", "literature", "prior research", "existing work", "kernel theory", "knowledge base"];
const processTerms = ["design science", "dsr", "dsrm", "peffers", "hevner", "action design research", "adr", "evaluation", "interviews", "survey", "case study", "prototype"];
const solutionTerms = ["artifact", "prototype", "system", "framework", "architecture", "dapp", "platform", "instantiation", "we designed", "we developed"];
const outputTerms = ["contribution", "design theory", "design principles", "guidelines", "framework", "implications", "we contribute", "our results suggest"];
const requirementTerms = ["requirement", "meta requirement", "objective", "design objective", "must", "should", "needs to", "we derive", "we identified the requirements"];
const principleTerms = ["design principle", "principle", "dp1", "dp 1", "prescriptive", "guideline", "the system should"];
const featureTerms = ["design feature", "feature", "blockchain feature", "smart contract", "token", "wallet", "hash", "off chain", "off-chain", "permissioned", "immutable", "decentralized", "encryption", "verifiable credential"];
const artifactTerms = ["artifact", "prototype", "system", "platform", "framework", "architecture", "instantiation", "dapp", "we developed", "we implemented"];
const evaluationTerms = ["evaluation", "demonstration", "field test", "interview", "survey", "experiment", "case study", "expert", "technical evaluation", "cost analysis"];

export function extractBasicMetadata(result: PdfExtractionResult): ExtractedMetadata {
  const firstPage = result.pages[0]?.text ?? "";
  const firstLines = linesOf(firstPage).slice(0, 60);
  const ignored = /doi|copyright|journal|available online|contents lists|elsevier|springer|issn|isbn|volume|issue|received|accepted|www\.|http|@/i;
  const abstractIndex = firstLines.findIndex((line) => /^abstract\b/i.test(line));
  const usableFrontMatter = firstLines
    .slice(0, abstractIndex > 0 ? abstractIndex : 45)
    .map((line) => line.replace(/\s*[•*]\s*/g, " ").trim())
    .filter((line) => !ignored.test(line) && line.length > 2);
  const titleCandidates = usableFrontMatter
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => isPlausibleTitleLine(line));
  const titleSeed = titleCandidates[0];
  const title = titleSeed
    ? [titleSeed.line, ...titleCandidates.filter((candidate) => candidate.index === titleSeed.index + 1 && candidate.line.length < 120).map((candidate) => candidate.line)].join(" ")
    : undefined;
  const titleIndex = titleSeed?.index ?? 0;
  const authorWindow = usableFrontMatter.slice(titleIndex + 1, titleIndex + 8);
  const authors = authorWindow
    .filter((line) => isPlausibleAuthorLine(line))
    .flatMap((line) => line.split(/\s*,\s*|\s+and\s+|\s{2,}/i))
    .map((line) => line.trim())
    .map((line) => line.replace(/\d+|\*|†|‡|§/g, "").trim())
    .filter((line) => /^[A-ZÀ-ÖØ-Þ][A-Za-zÀ-ÖØ-öø-ÿ' .-]{2,}$/.test(line))
    .filter((line) => line.split(/\s+/).length <= 5 && line.length > 3 && line.length < 80)
    .slice(0, 8);
  const abstractMatch = result.fullText.match(/abstract\s+([\s\S]{300,2200}?)(keywords|1\.?\s*introduction|introduction)/i);
  const keywordsMatch = result.fullText.match(/keywords?\s*[:\-]?\s+([A-Za-z0-9,; \-]{20,300})/i);
  const yearMatch = firstPage.match(/\b(19|20)\d{2}\b/);

  return {
    title,
    authors,
    year: yearMatch ? Number(yearMatch[0]) : undefined,
    doi: extractDoiFromText(result.fullText) ?? undefined,
    abstract: abstractMatch ? wordSlice(abstractMatch[1], 260) : undefined,
    keywords: keywordsMatch ? keywordsMatch[1].split(/[;,]/).map((item) => item.trim()).filter(Boolean).slice(0, 12) : []
  };
}

function isPlausibleTitleLine(line: string) {
  if (line.length < 18 || line.length > 180) return false;
  if (/[{}]|\babstract\b|\bkeywords?\b/i.test(line)) return false;
  if ((line.match(/\d/g) ?? []).length > line.length / 4) return false;
  const words = line.split(/\s+/);
  if (words.length < 4) return false;
  const lower = normalizeText(line);
  const metadataNoise = ["department", "university", "school", "faculty", "journal", "article", "homepage"];
  return !metadataNoise.some((term) => lower.includes(term));
}

function isPlausibleAuthorLine(line: string) {
  if (line.length < 5 || line.length > 180) return false;
  if (/\b(university|department|school|faculty|abstract|keywords?|journal|article|doi|http|www)\b/i.test(line)) return false;
  if (!/[A-ZÀ-ÖØ-Þ][a-zÀ-ÖØ-öø-ÿ'.-]+\s+[A-ZÀ-ÖØ-Þ][A-Za-zÀ-ÖØ-öø-ÿ'.-]+/.test(line)) return false;
  return (line.match(/[,;]/g) ?? []).length <= 12;
}

export function parseDsrPaper(input: PdfExtractionResult): DsrParseResult {
  const metadata = extractBasicMetadata(input);
  const sections = detectSections(input.pages);
  const diagnostics: ParserDiagnostic[] = [
    { level: "info", message: `${sections.length} sections detected by heading heuristics.` }
  ];
  input.extractionWarnings.forEach((message) => diagnostics.push({ level: "warning", message }));
  if (!metadata.doi) diagnostics.push({ level: "warning", message: "No DOI found in extracted text." });

  const dsrGrid = buildDsrGrid(input, metadata);
  const designFlow = buildDesignFlow(input, metadata);

  if (!designFlow.principles.length) diagnostics.push({ level: "warning", message: "No explicit design principles found; V1 may under-extract prescriptive logic." });
  if (!designFlow.evaluations.length) diagnostics.push({ level: "warning", message: "No explicit evaluation section or method terms found." });

  const allFields = [
    ...Object.values(dsrGrid).flat(),
    ...designFlow.problems,
    ...designFlow.requirements,
    ...designFlow.principles,
    ...designFlow.features,
    ...designFlow.artifacts,
    ...designFlow.evaluations,
    ...designFlow.patterns
  ];
  const overallConfidence = allFields.length ? allFields.reduce((sum, field) => sum + field.confidence, 0) / allFields.length : 0;
  if (overallConfidence < 0.55) diagnostics.push({ level: "warning", message: "Overall extraction confidence is low. Inspect evidence snippets before interpreting the flow." });

  return { metadata, dsrGrid, designFlow, diagnostics, overallConfidence };
}

function buildDsrGrid(input: PdfExtractionResult, metadata: ExtractedMetadata): DsrGridExtraction {
  const sections = detectSections(input.pages);
  const abstract = metadata.abstract ?? input.pages[0]?.text ?? "";
  const introText = sectionsMatching(sections, ["introduction", "problem", "objective"]).map((section) => section.text).join("\n");
  const backgroundText = sectionsMatching(sections, ["background", "related", "theoretical", "literature"]).map((section) => section.text).join("\n");
  const methodText = sectionsMatching(sections, ["method", "design science", "research methodology"]).map((section) => section.text).join("\n");
  const solutionText = sectionsMatching(sections, ["design", "artifact", "development", "architecture", "prototype"]).map((section) => section.text).join("\n");
  const outputText = sectionsMatching(sections, ["discussion", "contribution", "conclusion", "implication"]).map((section) => section.text).join("\n");

  return {
    problem: fieldsFromSentences("grid-problem", topSentences(`${abstract} ${introText}`, problemTerms, 3), input, "Problem", "problem keyword sentence in abstract/introduction"),
    inputKnowledge: fieldsFromSentences("grid-input", topSentences(backgroundText || input.fullText, inputTerms, 3), input, "Input knowledge", "theory/framework/literature keyword sentence"),
    researchProcess: fieldsFromSentences("grid-process", topSentences(methodText || input.fullText, processTerms, 3), input, "Research process", "DSR method and evaluation keyword sentence"),
    concepts: conceptFields(input, metadata),
    solution: fieldsFromSentences("grid-solution", topSentences(solutionText || input.fullText, solutionTerms, 3), input, "Solution", "artifact/prototype/system keyword sentence"),
    outputKnowledge: fieldsFromSentences("grid-output", topSentences(outputText || input.fullText, outputTerms, 3), input, "Output knowledge", "contribution/implication keyword sentence")
  };
}

function buildDesignFlow(input: PdfExtractionResult, metadata: ExtractedMetadata) {
  const sections = detectSections(input.pages);
  const abstractIntro = `${metadata.abstract ?? ""}\n${sectionsMatching(sections, ["introduction", "problem", "objective"]).map((section) => section.text).join("\n")}`;
  const requirementText = sectionsMatching(sections, ["requirement", "objective"]).map((section) => section.text).join("\n") || input.fullText;
  const principleText = sectionsMatching(sections, ["principle", "guideline"]).map((section) => section.text).join("\n") || input.fullText;
  const featureText = sectionsMatching(sections, ["feature", "design", "architecture", "development"]).map((section) => section.text).join("\n") || input.fullText;
  const artifactText = sectionsMatching(sections, ["artifact", "prototype", "architecture", "development"]).map((section) => section.text).join("\n") || input.fullText;
  const evaluationText = sectionsMatching(sections, ["evaluation", "demonstration"]).map((section) => section.text).join("\n") || input.fullText;

  const problems = fieldsFromSentences("flow-problem", topSentences(abstractIntro || input.fullText, problemTerms, 2), input, "Problem", "problem keyword sentence");
  const requirements = fieldsFromSentences("flow-req", topSentences(requirementText, requirementTerms, 4), input, "Requirement", "requirement/objective/modal keyword sentence");
  const principles = fieldsFromSentences("flow-principle", topSentences(principleText, principleTerms, 4), input, "Design principle", "design principle/guideline keyword sentence");
  const features = fieldsFromSentences("flow-feature", topSentences(featureText, featureTerms, 5), input, "Design feature", "DLT feature keyword sentence");
  const artifacts = fieldsFromSentences("flow-artifact", topSentences(artifactText, artifactTerms, 2), input, "Artifact", "artifact/prototype/system keyword sentence");
  const evaluations = fieldsFromSentences("flow-eval", topSentences(evaluationText, evaluationTerms, 3), input, "Evaluation", "evaluation method keyword sentence");
  const patterns = patternFields(input, metadata);

  return {
    problems,
    requirements,
    principles,
    features,
    artifacts,
    evaluations,
    patterns,
    edges: [
      ...connectEvery(problems, requirements, "motivates", 0.15),
      ...connectTop(requirements, principles, "satisfies"),
      ...connectTop(principles, features, "implements"),
      ...connectEvery(features, artifacts, "instantiates", 0.1),
      ...connectEvery(artifacts, evaluations, "evaluated by", 0.1),
      ...connectEvery(evaluations, patterns, "generalizes to", 0.15)
    ]
  };
}

function fieldsFromSentences(prefix: string, sentences: string[], input: PdfExtractionResult, section: string, rule: string) {
  return uniqueByLabel(sentences.map((sentence, index) => fieldFromQuote({
    id: `${prefix}-${index + 1}`,
    label: wordSlice(sentence.replace(/^(we|this paper|the system)\s+/i, ""), 14),
    quote: sentence,
    pages: input.pages,
    section,
    confidence: 0.62 + Math.min(0.25, sentence.length / 800),
    rule
  })), 4);
}

function conceptFields(input: PdfExtractionResult, metadata: ExtractedMetadata): DsrField[] {
  const dltTerms = ["blockchain", "DLT", "smart contract", "token", "wallet", "immutability", "decentralization", "SSI", "hash", "off-chain", "privacy", "artifact", "evaluation", "design principles"];
  const text = normalizeText(input.fullText);
  const found = [...metadata.keywords, ...dltTerms.filter((term) => text.includes(normalizeText(term)))].slice(0, 8);
  return found.map((term, index) => fieldFromQuote({
    id: `grid-concept-${index + 1}`,
    label: term,
    quote: term,
    pages: input.pages,
    section: "Concepts",
    confidence: metadata.keywords.includes(term) ? 0.78 : 0.58,
    rule: "keyword list or repeated DLT/DSR term"
  }));
}

function patternFields(input: PdfExtractionResult, metadata: ExtractedMetadata): DsrField[] {
  const titleAbstract = normalizeText(`${metadata.title ?? ""} ${metadata.abstract ?? ""}`);
  const full = normalizeText(input.fullText);
  const rules = [
    { label: "Off-chain data, on-chain proof", terms: ["off chain", "hash"], alt: ["anchor", "proof"] },
    { label: "Tokenized incentives", terms: ["token"], alt: ["nft", "reward", "incentive"] },
    { label: "Privacy-preserving auditability", terms: ["privacy"], alt: ["audit", "immutable", "traceability"] },
    { label: "Self-managed consent", terms: ["consent"], alt: ["patient", "user", "blockchain"] },
    { label: "IoT data certification", terms: ["sensor", "iot"], alt: ["certification", "integrity"] },
    { label: "Verifiable confidential processing", terms: ["private data"], alt: ["smart contract", "confidential"] },
    { label: "SSI-enabled reusable verification", terms: ["self sovereign identity"], alt: ["verifiable credential", "kyc"] },
    { label: "Lifecycle-aware blockchain development", terms: ["method engineering"], alt: ["development lifecycle", "isdm"] }
  ];
  return rules.flatMap((rule, index) => {
    const required = rule.terms.every((term) => full.includes(normalizeText(term)));
    const alternate = rule.alt.some((term) => full.includes(normalizeText(term)));
    if (!required && !alternate) return [];
    const inAbstract = [...rule.terms, ...rule.alt].some((term) => titleAbstract.includes(normalizeText(term)));
    const confidence = inAbstract ? 0.82 : required && alternate ? 0.68 : 0.48;
    return [fieldFromQuote({
      id: `flow-pattern-${index + 1}`,
      label: rule.label,
      quote: sentencesOf(input.fullText).find((sentence) => normalizeText(sentence).includes(normalizeText(rule.terms[0] ?? rule.alt[0]))) ?? rule.label,
      pages: input.pages,
      section: "Reusable pattern",
      confidence,
      rule: "deterministic DLT pattern keyword rule"
    })];
  });
}

function connectEvery(source: DsrField[], target: DsrField[], label: "motivates" | "instantiates" | "evaluated by" | "generalizes to", penalty: number) {
  return source.flatMap((left) => target.map((right) => ({
    sourceId: left.id,
    targetId: right.id,
    label,
    confidence: Math.max(0.1, ((left.confidence + right.confidence) / 2) - penalty)
  })));
}

function connectTop(source: DsrField[], target: DsrField[], label: "satisfies" | "implements") {
  return source.flatMap((left) => target.slice(0, 3).map((right) => ({
    sourceId: left.id,
    targetId: right.id,
    label,
    confidence: Math.max(0.1, ((left.confidence + right.confidence) / 2) - 0.15)
  })));
}
