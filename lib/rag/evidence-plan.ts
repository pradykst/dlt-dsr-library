import type {
  RagAnswerSection,
  RagChunk,
  RagEvidencePlanItem,
  RagMatchClassification,
  RagQueryPlan,
  RagSource
} from "@/lib/rag/types";
import { normalizeLabel } from "@/lib/rag/retrieval";

const SECTION_TITLES = [
  "Direct answer",
  "Strong matches",
  "Partial or conceptual matches",
  "Not counted / weak evidence",
  "Limitations"
];

export function createEvidencePlan(chunks: RagChunk[], queryPlan: RagQueryPlan): RagEvidencePlanItem[] {
  return chunks.map((chunk, index) => {
    const classification = classifyEvidence(chunk, queryPlan);
    const evidenceText = chunk.evidence_quote?.trim() || chunk.content.trim();
    const matchStrength = Math.round(chunk.retrievalScore ?? fallbackStrength(classification));
    return {
      sourceIndex: index + 1,
      sourceId: `S${index + 1}`,
      chunkId: chunk.id,
      paperId: chunk.paper_id,
      paperTitle: chunk.paper_title || chunk.paper_id || "Untitled paper",
      elementType: chunk.element_type,
      elementLabel: chunk.element_label,
      relationType: chunk.relation_type,
      fromElementId: chunk.from_element_id,
      toElementId: chunk.to_element_id,
      evidenceText,
      snippet: truncate(evidenceText, 320),
      matchReason: chunk.matchReason || explainMatch(chunk, queryPlan, classification),
      matchStrength,
      classification,
      chunkType: chunk.chunk_type,
      retrievalKind: chunk.retrievalKind,
      pageNumber: chunk.page_number
    };
  });
}

export function attachPlanToSources(sources: RagSource[], plan: RagEvidencePlanItem[]): RagSource[] {
  const planBySource = new Map(plan.map((item) => [item.sourceIndex, item]));
  return sources.map((source) => {
    const item = planBySource.get(source.sourceIndex);
    if (!item) return source;
    return {
      ...source,
      matchClassification: item.classification,
      matchReason: item.matchReason,
      matchStrength: item.matchStrength,
      snippet: item.snippet
    };
  });
}

export function buildDeterministicSections(plan: RagEvidencePlanItem[], queryPlan: RagQueryPlan): RagAnswerSection[] {
  const formal = plan.filter((item) => item.classification === "formal_label_match");
  const strong = plan.filter((item) => item.classification === "strong_mechanism_match");
  const partial = plan.filter((item) => item.classification === "partial_or_related_match");
  const weak = plan.filter((item) => item.classification === "background_only" || item.classification === "insufficient_evidence");

  return SECTION_TITLES.map((title) => {
    if (title === "Direct answer") {
      return {
        title,
        items: [directAnswerSummary(formal, strong, partial, weak, queryPlan)]
      };
    }
    if (title === "Strong matches") {
      return {
        title,
        items: [...formal, ...strong].map(formatEvidenceItem)
      };
    }
    if (title === "Partial or conceptual matches") {
      return {
        title,
        items: partial.map(formatEvidenceItem)
      };
    }
    if (title === "Not counted / weak evidence") {
      return {
        title,
        items: weak.map(formatEvidenceItem)
      };
    }
    return {
      title,
      items: buildLimitations(plan, queryPlan)
    };
  }).filter((section) => section.items.length > 0);
}

export function formatEvidencePlanForPrompt(plan: RagEvidencePlanItem[]) {
  if (plan.length === 0) return "No evidence items were retrieved.";
  return plan.map((item) => [
    `[${item.sourceId}] ${item.paperTitle}`,
    `Paper ID: ${item.paperId ?? "not available"}`,
    `Classification: ${item.classification}`,
    `Match reason: ${item.matchReason}`,
    `Match strength: ${item.matchStrength}`,
    `Element: ${[item.elementType, item.elementLabel].filter(Boolean).join(" - ") || "not specified"}`,
    item.relationType ? `Relation: ${item.fromElementId ?? "unknown"} -> ${item.toElementId ?? "unknown"} via ${item.relationType}` : "Relation: none stated",
    `Evidence: ${item.snippet}`
  ].join("\n")).join("\n\n");
}

function classifyEvidence(chunk: RagChunk, queryPlan: RagQueryPlan): RagMatchClassification {
  const label = normalizeLabel(chunk.element_label);
  const content = normalizeLabel(`${chunk.content} ${chunk.evidence_quote ?? ""}`);
  const terms = queryPlan.searchTerms.map(normalizeLabel).filter(Boolean);
  const labelMatch = terms.length > 0 && terms.some((term) => label === term || containsPhrase(label, term) || containsPhrase(term, label));
  const contentMatch = terms.length > 0 && terms.some((term) => containsPhrase(content, term));

  if (chunk.retrievalKind === "explicit" && labelMatch) return "formal_label_match";
  if ((chunk.retrievalKind === "direct_relation" || chunk.retrievalKind === "evidence") && (contentMatch || Boolean(chunk.evidence_quote))) return "strong_mechanism_match";
  if (chunk.chunk_type === "relation" && chunk.relation_type) return "strong_mechanism_match";
  if (labelMatch || contentMatch || chunk.retrievalKind === "related" || chunk.retrievalKind === "semantic") return "partial_or_related_match";
  if (chunk.chunk_type === "paper") return "background_only";
  return "insufficient_evidence";
}

function explainMatch(chunk: RagChunk, queryPlan: RagQueryPlan, classification: RagMatchClassification) {
  const terms = queryPlan.searchTerms.length ? queryPlan.searchTerms.join(", ") : "the question terms";
  if (classification === "formal_label_match") return `Element label matches ${terms}.`;
  if (classification === "strong_mechanism_match" && chunk.relation_type) return `Connected relation/evidence supports a mechanism involving ${terms}.`;
  if (classification === "strong_mechanism_match") return `Evidence text supports a mechanism involving ${terms}.`;
  if (classification === "partial_or_related_match") return `Retrieved text is related to ${terms}, but does not prove a formal label match.`;
  if (classification === "background_only") return "Paper-level background may help interpret the topic but is not direct evidence.";
  return "Retrieved chunk does not contain enough structured evidence for the claim.";
}

function directAnswerSummary(
  formal: RagEvidencePlanItem[],
  strong: RagEvidencePlanItem[],
  partial: RagEvidencePlanItem[],
  weak: RagEvidencePlanItem[],
  queryPlan: RagQueryPlan
) {
  const formalPapers = uniquePapers(formal);
  const strongPapers = uniquePapers(strong);
  const partialPapers = uniquePapers(partial);
  const target = queryPlan.searchTerms.length ? queryPlan.searchTerms.join(", ") : "the requested concept";

  if (queryPlan.queryType === "corpus_count") {
    const matchedPapers = uniquePapers([...formal, ...strong, ...partial, ...weak]);
    const target = queryPlan.searchTerms.length ? queryPlan.searchTerms.join(", ") : "the requested paper criteria";
    return `${matchedPapers.length} paper(s) in the database match ${target} using paper metadata. ${matchedPapers.length ? `Matched papers: ${matchedPapers.join(", ")}.` : "No matching papers were found."}`;
  }

  if (formal.length || strong.length) {
    return [
      `${unique([...formalPapers, ...strongPapers]).length} paper-level match(es) have direct structured support for ${target}.`,
      formalPapers.length ? `Formal label matches: ${formalPapers.join(", ")}.` : "No formal label matches were retrieved.",
      strongPapers.length ? `Strong mechanism/evidence matches: ${strongPapers.join(", ")}.` : "No additional strong mechanism matches were retrieved.",
      partialPapers.length ? `Related but weaker matches need caution: ${partialPapers.join(", ")}.` : ""
    ].filter(Boolean).join(" ");
  }

  if (partial.length || weak.length) {
    return `The database returned related material for ${target}, but no retrieved item proves a formal or strong mechanism match. Treat this as a data/retrieval limitation, not as evidence that no paper uses the concept.`;
  }

  return `The database did not return evidence for ${target}.`;
}

function formatEvidenceItem(item: RagEvidencePlanItem) {
  const relation = item.relationType ? ` Relation: ${item.fromElementId ?? "unknown"} -> ${item.toElementId ?? "unknown"} via ${item.relationType}.` : "";
  const element = [item.elementType, item.elementLabel].filter(Boolean).join(" - ") || item.chunkType || "Evidence";
  return `${item.paperTitle}: ${element}. ${item.matchReason}${relation} [${item.sourceId}]`;
}

function buildLimitations(plan: RagEvidencePlanItem[], queryPlan: RagQueryPlan) {
  const limitations: string[] = [];
  if (!plan.some((item) => item.classification === "formal_label_match")) {
    limitations.push("No retrieved source provides a formal normalized label match for the requested concept.");
  }
  if (!plan.some((item) => item.evidenceText.trim())) {
    limitations.push("Retrieved rows do not include usable evidence text/snippets.");
  }
  if (queryPlan.queryType === "relation_path_explanation" && !plan.some((item) => item.relationType)) {
    limitations.push("No retrieved relation rows prove the requested path or flow.");
  }
  if (limitations.length === 0) {
    limitations.push("Answer is limited to retrieved workbench evidence and may miss papers with absent labels, weak extraction, missing embeddings, or missing relations.");
  }
  return limitations;
}

function fallbackStrength(classification: RagMatchClassification) {
  if (classification === "formal_label_match") return 100;
  if (classification === "strong_mechanism_match") return 85;
  if (classification === "partial_or_related_match") return 55;
  if (classification === "background_only") return 30;
  return 10;
}

function containsPhrase(value: string, phrase: string) {
  if (!value || !phrase) return false;
  return new RegExp(`(^|\\s)${escapeRegExp(phrase)}($|\\s)`).test(value) || value.includes(phrase);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function uniquePapers(items: RagEvidencePlanItem[]) {
  return unique(items.map((item) => item.paperTitle).filter(Boolean));
}

function unique(values: string[]) {
  return [...new Set(values)];
}

function truncate(value: string, maxLength: number) {
  const clean = value.trim().replace(/\s+/g, " ");
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength).trim()}...`;
}
