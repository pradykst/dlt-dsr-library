import type { OkfKnowledgeBase } from "./schema.ts";
import type { OkfChatResponse } from "./chat.ts";

export function validateChatResponse(response: OkfChatResponse, kb: OkfKnowledgeBase) {
  const warnings: string[] = [];
  const paperIds = new Set(kb.papers.map((paper) => paper.paper_id));
  const conceptIds = new Set(kb.concepts.map((concept) => concept.concept_id));
  const evidenceIds = new Set(kb.evidence_items.map((item) => item.evidence_id));

  for (const paper of response.source_papers) {
    if (!paperIds.has(paper.paper_id)) warnings.push(`Unknown cited paper removed or flagged: ${paper.paper_id}.`);
  }
  for (const evidence of response.evidence) {
    if (!evidenceIds.has(evidence.evidence_id)) warnings.push(`Unknown evidence item removed or flagged: ${evidence.evidence_id}.`);
    if (evidence.concept_id && !conceptIds.has(evidence.concept_id)) warnings.push(`Evidence ${evidence.evidence_id} references unknown concept ${evidence.concept_id}.`);
  }
  for (const card of [...response.requirements, ...response.principles, ...response.features, ...response.artifact_direction]) {
    if (card.concept_id && !conceptIds.has(card.concept_id)) warnings.push(`Recommendation card uses unknown concept ${card.concept_id}.`);
    if (!card.concept_id && card.evidence_ids.length === 0) warnings.push(`Recommendation card "${card.title}" has no concept or evidence link.`);
    for (const evidenceId of card.evidence_ids) {
      if (!evidenceIds.has(evidenceId)) warnings.push(`Recommendation card "${card.title}" cites unknown evidence ${evidenceId}.`);
    }
  }
  for (const node of response.flow.nodes) {
    if (node.concept_id && !conceptIds.has(node.concept_id)) warnings.push(`Flow node uses unknown concept ${node.concept_id}.`);
    if (node.paper_id && !paperIds.has(node.paper_id)) warnings.push(`Flow node uses unknown paper ${node.paper_id}.`);
    if (!node.concept_id && !node.query_generated && !node.evidence_id) warnings.push(`Flow node ${node.id} is neither stored nor query_generated.`);
  }
  return { ok: warnings.length === 0, warnings };
}
