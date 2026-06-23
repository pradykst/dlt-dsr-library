const DEFAULT_QUERIES = [
  { type: "corpus_count", query: "How many papers are blockchain based?" },
  { type: "corpus_count", query: "How many papers discuss healthcare or HIE?" },
  { type: "paper_lookup", query: "Find papers about peer review incentives." },
  { type: "paper_lookup", query: "Which papers are about SSI or KYC?" },
  { type: "concept_usage", query: "Which papers use smart contracts?" },
  { type: "concept_usage", query: "Which papers use NFTs or digital collectibles?" },
  { type: "element_type_lookup", query: "Which papers use tokenization as a design feature?" },
  { type: "element_type_lookup", query: "Which papers use consent management as a design feature?" },
  { type: "comparison", query: "Compare papers that use blockchain for trust versus incentives." },
  { type: "comparison", query: "Compare papers that use SSI/KYC versus consent management." },
  { type: "relation_flow", query: "Explain the design principle to design feature flow in the peer review token paper." },
  { type: "relation_flow", query: "How are requirements linked to design features in the consent management paper?" },
  { type: "paper_summary", query: "Summarize the peer review token paper." },
  { type: "paper_summary", query: "Summarize the SSI KYC paper." },
  { type: "evidence_check", query: "Is immutable logging already present in the database?" },
  { type: "evidence_check", query: "What evidence supports data certification?" },
  { type: "gap_analysis", query: "Which papers have weak or indirect evidence for token-based mechanisms?" },
  { type: "gap_analysis", query: "Where is the evidence insufficient for blockchain incentives?" },
  { type: "decision_support", query: "Which blockchain design approach should I study for incentive alignment?" },
  { type: "decision_support", query: "Which papers best support a literature review section on blockchain-based trust?" }
];

const baseUrl = (process.env.RAG_EVAL_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const outputPath = process.env.RAG_EVAL_OUTPUT ?? "data/rag-chatbot-eval-results.json";

const results = [];

for (const item of DEFAULT_QUERIES) {
  const query = item.query;
  const startedAt = Date.now();
  try {
    const response = await fetch(`${baseUrl}/api/rag/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: query }] })
    });
    const payload = await response.json();
    const sources = Array.isArray(payload.sources) ? payload.sources : [];
    const returnedPapers = [...new Set(sources.map((source) => source.paperTitle).filter(Boolean))];
    const classifications = summarizeClassifications(sources);
    const citationsAvailable = sources.length > 0 && sources.every((source) => source.sourceId);
    const failureCause = inferFailureCause(payload, sources);

    const result = {
      expectedType: item.type,
      actualType: payload.debug?.queryType,
      query,
      ok: response.ok,
      status: response.status,
      latencyMs: Date.now() - startedAt,
      returnedPapers,
      classifications,
      citationsAvailable,
      answerLookedCorrect: "manual_review_required",
      likelyFailureCause: failureCause,
      debug: payload.debug,
      error: payload.error,
      answerText: payload.answerText,
      sections: payload.sections
    };
    results.push(result);
    printSummary(result);
  } catch (error) {
    const result = {
      expectedType: item.type,
      actualType: "request_failed",
      query,
      ok: false,
      latencyMs: Date.now() - startedAt,
      returnedPapers: [],
      classifications: {},
      citationsAvailable: false,
      answerLookedCorrect: "manual_review_required",
      likelyFailureCause: "backend_or_network_error",
      error: error instanceof Error ? error.message : String(error)
    };
    results.push(result);
    printSummary(result);
  }
}

await writeOutput(outputPath, {
  createdAt: new Date().toISOString(),
  baseUrl,
  results
});

console.log(`\nSaved structured eval output to ${outputPath}`);

function summarizeClassifications(sources) {
  return sources.reduce((acc, source) => {
    const key = source.matchClassification ?? "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function inferFailureCause(payload, sources) {
  if (payload?.error?.code?.startsWith("llm")) return "LLM composition";
  if (payload?.debug?.answerStatus === "no_evidence") return "retrieval_or_missing_DB_evidence";
  if (payload?.debug?.warnings?.length) return "retrieval_or_embedding_warning";
  if (sources.length === 0) return "missing_DB_evidence_or_bad_labels";
  if (sources.every((source) => ["background_only", "insufficient_evidence"].includes(source.matchClassification))) return "weak_CSV_extraction_or_missing_relations";
  return "manual_review_required";
}

function printSummary(result) {
  console.log(`\n# [${result.expectedType} -> ${result.actualType}] ${result.query}`);
  console.log(`status=${result.status ?? "ERR"} ok=${result.ok} latencyMs=${result.latencyMs}`);
  console.log(`papers=${result.returnedPapers.length ? result.returnedPapers.join(" | ") : "none"}`);
  console.log(`classifications=${JSON.stringify(result.classifications)}`);
  console.log(`citations=${result.citationsAvailable ? "yes" : "no"} likelyFailureCause=${result.likelyFailureCause}`);
}

async function writeOutput(path, value) {
  const { mkdir, writeFile } = await import("node:fs/promises");
  const { dirname } = await import("node:path");
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
