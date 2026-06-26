import { parseOkfLibrary } from "./parser.ts";
import { buildOkfFlow } from "./flow.ts";
import type { OkfConcept, OkfConceptType, OkfKnowledgeBase, OkfRelation, OkfRelationPredicate } from "./schema.ts";

export type ConceptFilters = { paper_id?: string; tags?: string[]; query?: string; review_status?: string };

let cachedKb: OkfKnowledgeBase | null = null;

export function getOkfKnowledgeBase(force = false) {
  if (!cachedKb || force) cachedKb = parseOkfLibrary();
  return cachedKb;
}

export function getRelevantPapers(query: string, kb = getOkfKnowledgeBase()) {
  const terms = tokenize(query);
  return kb.papers
    .map((paper) => {
      const concepts = kb.concepts.filter((concept) => concept.paper_id === paper.paper_id);
      const haystack = [paper.title, paper.body_text, ...concepts.flatMap((concept) => [concept.title, concept.description, concept.body_text, concept.tags.join(" ")])].join(" ").toLowerCase();
      return { paper, score: scoreText(haystack, terms) };
    })
    .filter((item) => item.score > 0 || terms.length === 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.paper);
}

export function getConceptsByType(types: OkfConceptType[], filters: ConceptFilters = {}, kb = getOkfKnowledgeBase()) {
  const terms = tokenize(filters.query ?? "");
  return kb.concepts
    .filter((concept) => types.includes(concept.type))
    .filter((concept) => !filters.paper_id || concept.paper_id === filters.paper_id)
    .filter((concept) => !filters.review_status || concept.review_status === filters.review_status)
    .filter((concept) => !filters.tags?.length || filters.tags.some((tag) => concept.tags.includes(tag)))
    .map((concept) => ({ concept, score: scoreConcept(concept, terms) }))
    .filter((item) => terms.length === 0 || item.score > 0)
    .sort((a, b) => b.score - a.score || confidenceRank(b.concept.confidence) - confidenceRank(a.concept.confidence))
    .map((item) => item.concept);
}

export function getConceptsByPaper(paper_id: string, kb = getOkfKnowledgeBase()) {
  return kb.concepts.filter((concept) => concept.paper_id === paper_id);
}

export function getEvidenceForConcept(concept_id: string, kb = getOkfKnowledgeBase()) {
  return kb.evidence_items.filter((item) => item.concept_id === concept_id);
}

export function getRelationsForConcept(concept_id: string, kb = getOkfKnowledgeBase()) {
  return kb.relations.filter((relation) => relation.source_concept_id === concept_id || relation.target_concept_id === concept_id);
}

export function traverseDsrPath(startConcepts: OkfConcept[], allowedPredicates: OkfRelationPredicate[], kb = getOkfKnowledgeBase()) {
  const visited = new Set(startConcepts.map((concept) => concept.concept_id));
  const queue = [...startConcepts.map((concept) => concept.concept_id)];
  const relations: OkfRelation[] = [];
  while (queue.length && visited.size < 60) {
    const id = queue.shift()!;
    for (const relation of kb.relations) {
      if (relation.source_concept_id !== id || !allowedPredicates.includes(relation.predicate)) continue;
      relations.push(relation);
      if (!visited.has(relation.target_concept_id)) {
        visited.add(relation.target_concept_id);
        queue.push(relation.target_concept_id);
      }
    }
  }
  return {
    concepts: kb.concepts.filter((concept) => visited.has(concept.concept_id)),
    relations
  };
}

export function buildQuerySpecificFlow(query: string, selectedConcepts: OkfConcept[], kb = getOkfKnowledgeBase()) {
  return buildOkfFlow(query, selectedConcepts, kb);
}

export function retrieveForDesignQuery(query: string, kb = getOkfKnowledgeBase()) {
  const requirementMatches = getConceptsByType(["DesignRequirement", "Problem"], { query }, kb).slice(0, 6);
  const paperMatches = getRelevantPapers(query, kb).slice(0, 4);
  const paperIds = new Set(paperMatches.map((paper) => paper.paper_id));
  const seed = requirementMatches.length ? requirementMatches : kb.concepts.filter((concept) => paperIds.has(concept.paper_id) && ["DesignRequirement", "DesignPrinciple", "DesignFeature", "Artifact"].includes(concept.type)).slice(0, 8);
  const traversed = traverseDsrPath(seed, ["motivates", "requires", "addressed_by", "satisfies", "instantiates", "implements", "contributes_to", "supported_by"], kb);
  const concepts = uniqueConcepts([...seed, ...traversed.concepts]).slice(0, 24);
  const conceptIds = new Set(concepts.map((concept) => concept.concept_id));
  const relations = kb.relations.filter((relation) => conceptIds.has(relation.source_concept_id) && conceptIds.has(relation.target_concept_id));
  const evidence = kb.evidence_items.filter((item) => item.concept_id && conceptIds.has(item.concept_id));
  return { papers: paperMatches, concepts, relations, evidence };
}

export function tokenize(value: string) {
  return value.toLowerCase().split(/[^a-z0-9]+/).filter((term) => term.length > 2 && !["the", "and", "for", "with", "that", "what", "which", "use", "from", "prior", "paper", "papers"].includes(term));
}

function scoreConcept(concept: OkfConcept, terms: string[]) {
  const metadata = [concept.title, concept.type, concept.dsr_layer, concept.tags.join(" ")].join(" ").toLowerCase();
  const body = [concept.description, concept.body_text].join(" ").toLowerCase();
  return scoreText(metadata, terms) * 3 + scoreText(body, terms);
}

function scoreText(text: string, terms: string[]) {
  if (!terms.length) return 1;
  return terms.reduce((sum, term) => sum + (text.includes(term) ? 1 : 0), 0);
}

function uniqueConcepts(concepts: OkfConcept[]) {
  const seen = new Set<string>();
  return concepts.filter((concept) => {
    if (seen.has(concept.concept_id)) return false;
    seen.add(concept.concept_id);
    return true;
  });
}

function confidenceRank(value: string) {
  return value === "high" ? 3 : value === "medium" ? 2 : 1;
}






