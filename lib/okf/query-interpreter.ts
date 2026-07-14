import { detectNamedPapers, inferPolicyThemes, inferRequestedTypes, normalizeText, tokenizePolicy } from "./policy.ts";
import { getOkfKnowledgeBase } from "./retrieval.ts";
import type { OkfChatIntent, OkfKnowledgeBase } from "./schema.ts";

const statsPattern = /\bhow many\b|\bcount\b|\bcounts\b|\bstatistics\b|\bstats\b|\bnumber of\b|\bdistribution\b/i;
const coveragePattern = /\bare all (?:the )?(?:loaded )?papers\b|\bwhich papers? (?:are|is) not\b|\bcoverage of (?:the )?library\b|\bwhat kinds? of papers\b|\b(?:library )?composition\b|\bpaper categor(?:y|ies|ization|isation)\b|\bdomain coverage\b|\bgeneral\/methodological\b|\bmethodological vs domain-specific\b|\bnot blockchain specific\b|\bnon[- ]blockchain\b|\bblockchain related\b.*\bnot\b|\bnot\b.*\b(?:lit|literature) in general\b|\bgeneral literature\b/i;
const overviewPattern = /list all papers|all papers in (?:the )?(?:okf )?library|what papers (?:are loaded|are available)|okf library overview|papers currently in (?:the )?(?:okf )?library/i;
const paperDiscoveryPattern = /\bfind (?:me )?(?:a )?papers?\b|\bwhich papers?\b|\bwhat papers? do we have\b|\bpapers? (?:that|which) (?:discuss|have|has|use|uses|address|contain|include)\b|\bpapers? with\b|\bpapers? about\b|\bpaper has\b|\bpaper which has\b|\bshow papers about\b|\bidentify papers?\b|\bwhere in the library\b|\bliterature (?:about|on|for)\b|\blit(?:erature)? in general\b/i;
const paperElementPattern = /\bshow\b|\blist\b|\bwhat\b|\bwhich\b|\bextract\b|\bgive me\b/i;
const flowPattern = /\bflow\b|\bgraph\b|\bpath\b|\btrace\b|\bmap\b|\bpathway\b|requirement\s*(?:->|to|\?)\s*principle\s*(?:->|to|\?)\s*feature|requirement principle feature|connect requirements? to features?|\brpf\b/i;
const evidencePattern = /\bevidence\b|\bsupports?\b|\bproof\b|\bproof from paper\b|\bsource for\b|\bwhere does (?:the )?paper say\b|\bcite\b|\bcitation\b/i;
const comparisonPattern = /\bcompare\b|\bdifference\b|\bversus\b|\bvs\b|\bsimilarities\b|\bdistinguish\b/i;
const lifecyclePattern = /\bimplementation lifecycle\b|\bdevelopment lifecycle\b|\bfrom requirements to smart contracts\b|\bdeploy\b|\bdeployment\b|\bmonitoring\b|\bmonitor\b|\bmaintenance\b|\btesting\b|\broles\b|\bmodels\b|\bmethod fragments\b|\bisdm\b/i;
const evaluationPattern = /\bevaluate\b|\bevaluation\b|\bvalidation\b|\bdemonstration\b|\bex-ante\b|\bex ante\b|\bex-post\b|\bex post\b|\bexperiment\b|\bcriteria\b/i;
const existencePattern = /\bdoes any paper\b|\bdo any papers\b|\bis there any paper\b|\bare there any papers\b|\bdo we have (?:any )?papers?\b|\bwhich papers? uses?\b|\bwhich papers? use\b|\buses?\b.*\bformal design principle\b/i;
const formalOnlyPattern = /\bformal\b.*\bdesign principles?\b|\bexplicit\b.*\bdesign principles?\b|\bstored\b.*\bdesign principles?\b|\bnamed\b.*\bdesign principles?\b/i;
const designReusePattern = /\bwhat should i reuse\b|\bwhat can i reuse\b|\breusable design knowledge\b|\breusable dsr\b|\breuse from (?:the )?(?:okf )?library\b|\bprinciples? (?:and )?(?:things|features|requirements|artifacts)?.*\breuse\b|\bthings? (?:i|we) can reuse\b|\bdesign (?:a|an|the)?\s*(?:application|app|system|architecture|artifact|protocol|platform|tool)\b|\bbuild (?:a|an|the)?\s*(?:application|app|system|architecture|artifact|protocol|platform|tool)\b|\bcreate (?:a|an|the)?\s*(?:application|app|system|architecture|artifact|protocol|platform|tool)\b|\bmake (?:a|an|the)?\s*(?:application|app|system|architecture|artifact|protocol|platform|tool)\b|\bi want to (?:create|build|make|design)\b|\bsolve(?:s)? the problem of\b|\bguide me\b|\bguidance\b|\brecommend(?:ation)?\b|\bdecision support\b/i;
const greetingPattern = /^(hello|hi|hey|good morning|good afternoon|good evening)\b[!.?\s]*$/i;
const vaguePattern = /^(what should i use|which is best|which principles are best|which principle is best|what is best|help|advise me)\??$/i;

export function detectDeterministicIntent(query: string, kb: OkfKnowledgeBase = getOkfKnowledgeBase()): OkfChatIntent {
  const q = normalizeText(query);
  const namedPapers = detectNamedPapers(query, kb);
  const requestedTypes = inferRequestedTypes(query);
  const asksReuse = asksDesignReuse(query);
  const asksFlow = flowPattern.test(query);
  const asksDiscovery = asksPaperDiscovery(query);

  if (isMeaninglessShortInput(query)) return "CLARIFICATION_QUERY";
  if (statsPattern.test(query)) return "LIBRARY_STATS_QUERY";
  if (coveragePattern.test(query)) return "LIBRARY_COVERAGE_QUERY";
  if (overviewPattern.test(query)) return "LIBRARY_OVERVIEW_QUERY";
  if (namedPapers.length && paperElementPattern.test(query) && requestedTypes.length && !asksFlow) return "PAPER_ELEMENT_QUERY";
  if (isFormalExistenceQuery(query)) return "NEGATIVE_OR_EXISTENCE_QUERY";
  if (asksFlow && asksNewSystemOrProblem(query)) return "DESIGN_REUSE_FLOW_QUERY";
  if (asksDiscovery && asksReuse && asksNewSystemOrProblem(query)) return "DESIGN_REUSE_QUERY";
  if (asksDiscovery) return "PAPER_DISCOVERY_QUERY";
  if (asksFlow) return "DSR_FLOW_QUERY";
  if (evidencePattern.test(query) && !asksReuse) return "EVIDENCE_QUERY";
  if (comparisonPattern.test(query)) return "COMPARISON_QUERY";
  if (lifecyclePattern.test(query)) return "IMPLEMENTATION_LIFECYCLE_QUERY";
  if (evaluationPattern.test(query)) return "EVALUATION_PLANNING_QUERY";
  if ((existencePattern.test(query) || /\bany paper\b/i.test(query)) && hasMeaningfulActionAndTheme(query, kb)) return "NEGATIVE_OR_EXISTENCE_QUERY";
  if (asksReuse && asksFlow) return "DESIGN_REUSE_FLOW_QUERY";
  if (asksReuse || /design|system|architecture|artifact|marketplace|protocol|trust|privacy|identity|application|app|platform|tool/.test(q)) return "DESIGN_REUSE_QUERY";
  return "CLARIFICATION_QUERY";
}

export function hasMeaningfulActionAndTheme(query: string, kb: OkfKnowledgeBase = getOkfKnowledgeBase()) {
  const q = normalizeText(query);
  if (!q || isMeaninglessShortInput(query)) return false;
  const hasAction = statsPattern.test(query)
    || coveragePattern.test(query)
    || overviewPattern.test(query)
    || paperDiscoveryPattern.test(query)
    || flowPattern.test(query)
    || evidencePattern.test(query)
    || comparisonPattern.test(query)
    || lifecyclePattern.test(query)
    || evaluationPattern.test(query)
    || existencePattern.test(query)
    || designReusePattern.test(query)
    || /\b(find|show|list|extract|create|build|design|solve|reuse|guide|compare|evaluate)\b/.test(q);
  const hasTheme = inferPolicyThemes(query).length > 0
    || inferRequestedTypes(query).length > 0
    || detectNamedPapers(query, kb).length > 0
    || tokenizePolicy(query).some((term) => !["want", "please", "pls", "guide"].includes(term));
  return hasAction && hasTheme;
}

export function isMessyNaturalLanguageQuery(query: string) {
  const q = normalizeText(query);
  return q.length > 80
    || /\bi want to\b|\bpls\b|\bplease\b|\bguide me\b|\bsolve(?:s)? the problem\b|\bwhat .* can .* reuse\b/.test(q)
    || q.split(/\s+/).length >= 12;
}

function asksPaperDiscovery(query: string) {
  return paperDiscoveryPattern.test(query) || /\bwhich paper has\b/i.test(query) || /\bfind me paper\b/i.test(query);
}

function asksDesignReuse(query: string) {
  return designReusePattern.test(query);
}

function asksNewSystemOrProblem(query: string) {
  const q = normalizeText(query);
  return asksDesignReuse(query) || /\b(application|app|system|protocol|platform|tool|marketplace)\b/.test(q) && /\b(create|build|design|solve|problem|guide|reuse)\b/.test(q);
}

function isFormalExistenceQuery(query: string) {
  return formalOnlyPattern.test(query) && (paperDiscoveryPattern.test(query) || existencePattern.test(query) || /\bwhich paper\b|\bfind\b/i.test(query));
}

function isMeaninglessShortInput(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return true;
  if (greetingPattern.test(trimmed)) return true;
  if (vaguePattern.test(trimmed)) return true;
  const q = normalizeText(trimmed);
  return q.split(/\s+/).length <= 2 && /^(help|start|hello|hi|hey|ok|okay)$/.test(q);
}
