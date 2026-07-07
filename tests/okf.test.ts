import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { readFileSync } from "node:fs";
import { answerOkfChat, routeOkfQuery, selectSourcePapers } from "../lib/okf/chat.ts";
import { synthesizeWithOptionalLlm } from "../lib/okf/llm.ts";
import { indexOkfKnowledgeBase } from "../lib/okf/indexer.ts";
import { parseOkfLibrary, validateKnowledgeBase } from "../lib/okf/parser.ts";
const fixtureRoot = path.join(process.cwd(), "tests", "fixtures", "okf");
const curatedFixtureRoot = path.join(process.cwd(), "tests", "fixtures", "curated-okf");

test("OKF parser reads fixture papers, concepts, evidence, and relations", () => {
  const kb = parseOkfLibrary(fixtureRoot);
  assert.equal(kb.papers.length, 1);
  assert.equal(kb.concepts.length, 5);
  assert.equal(kb.evidence_items.length, 1);
  assert.equal(kb.relations.length, 4);
  assert.equal(kb.warnings.length, 0);
});


test("OKF parser supports curated markdown concepts and local relation ids", () => {
  const kb = parseOkfLibrary(curatedFixtureRoot);
  assert.equal(kb.papers.length, 1);
  assert.equal(kb.concepts.length, 3);
  assert.equal(kb.evidence_items.length, 2);
  assert.equal(kb.relations.length, 2);
  assert.equal(kb.warnings.length, 0);
  assert.ok(kb.concepts.some((concept) => concept.concept_id === "CURATED_2026:dr_001_prevent_manipulation"));
  assert.ok(kb.concepts.some((concept) => concept.extraction_type === "explicit-in-artifact"));
  assert.ok(kb.relations.every((relation) => relation.source_concept_id.startsWith("CURATED_2026:")));
  assert.ok(kb.relations.some((relation) => relation.predicate === "instantiated_by"));
});

test("relation validation emits warnings instead of crashing", () => {
  const kb = parseOkfLibrary(fixtureRoot);
  kb.relations.push({ ...kb.relations[0], relation_id: "FIXTURE_2026:bad", target_concept_id: "FIXTURE_2026:missing" });
  validateKnowledgeBase(kb);
  assert.ok(kb.warnings.some((warning) => warning.message.includes("unknown target")));
});

test("indexing summary is idempotent without Supabase env vars", async () => {
  const kb = parseOkfLibrary(fixtureRoot);
  const one = await indexOkfKnowledgeBase(kb);
  const two = await indexOkfKnowledgeBase(kb);
  assert.equal(one.papers, two.papers);
  assert.equal(one.concepts, two.concepts);
  assert.equal(one.relations, two.relations);
});



test("OKF index script loads Next env before indexing", () => {
  const script = readFileSync(path.join(process.cwd(), "scripts", "okf-index.ts"), "utf8");
  assert.ok(script.includes('from "@next/env"'));
  assert.ok(script.includes("loadEnvConfig(process.cwd());"));
  assert.ok(script.indexOf("loadEnvConfig(process.cwd());") < script.indexOf("indexOkfKnowledgeBase(kb)"));
});

test("OKF database access uses prefixed table names", () => {
  const migration = readFileSync(path.join(process.cwd(), "supabase", "migrations", "20260626140000_okf_chatbot.sql"), "utf8");
  const indexer = readFileSync(path.join(process.cwd(), "lib", "okf", "indexer.ts"), "utf8");
  const correctionsRoute = readFileSync(path.join(process.cwd(), "app", "api", "okf", "corrections", "route.ts"), "utf8");
  const unprefixedTables = [
    "papers",
    "concepts",
    "evidence_items",
    "relations",
    "conversation_sessions",
    "session_design_state",
    "generated_flows",
    "flow_nodes",
    "flow_edges",
    "user_corrections"
  ];

  for (const table of unprefixedTables) {
    assert.equal(new RegExp(`create table if not exists ${table}\\b`).test(migration), false);
    assert.equal(new RegExp(`references ${table}\\(`).test(migration), false);
    assert.equal(indexer.includes(`"${table}"`), false);
    assert.equal(correctionsRoute.includes(`"${table}"`), false);
  }

  for (const table of ["okf_papers", "okf_concepts", "okf_evidence_items", "okf_relations", "okf_user_corrections"]) {
    assert.ok(migration.includes(table) || indexer.includes(table) || correctionsRoute.includes(table));
  }
});


test("paper-specific element query returns only the named paper and both requested types", async () => {
  const kb = parseOkfLibrary();
  const response = await answerOkfChat("Show me the design requirements and design principles from Blockchain for the IoT.", kb);
  assert.equal(response.intent, "DSR_ELEMENT_QUERY");
  assert.ok(response.retrieved_concepts.length > 0);
  assert.ok(response.retrieved_concepts.every((concept) => concept.paper_id === "BLOCKCHAIN_IOT_SDPS_2019"));
  assert.equal(response.retrieved_concepts.filter((concept) => concept.type === "DesignRequirement").length, 4);
  assert.equal(response.retrieved_concepts.filter((concept) => concept.type === "DesignPrinciple").length, 4);
});

test("flow query is classified and uses stored relations without requirement-to-requirement chaining", async () => {
  const kb = parseOkfLibrary();
  assert.equal(routeOkfQuery("Build a Requirement ? Principle ? Feature flow for tamper-resistant sensor data protection."), "DSR_FLOW_QUERY");
  const response = await answerOkfChat("Build a Requirement ? Principle ? Feature flow for tamper-resistant sensor data protection.", kb);
  assert.equal(response.intent, "DSR_FLOW_QUERY");
  const byId = new Map(response.flow.nodes.map((node) => [node.id, node]));
  assert.ok(response.flow.edges.length > 0);
  assert.ok(response.flow.edges.every((edge) => edge.relation_id || byId.get(edge.source)?.query_generated));
  assert.equal(response.flow.edges.some((edge) => byId.get(edge.source)?.type === "DesignRequirement" && byId.get(edge.target)?.type === "DesignRequirement"), false);
});

test("design recommendation query marks query-generated problem nodes", async () => {
  const kb = parseOkfLibrary();
  const response = await answerOkfChat("I need a marketplace system for manipulated product descriptions.", kb);
  assert.equal(response.intent, "DESIGN_RECOMMENDATION_QUERY");
  assert.ok(response.flow.nodes.some((node) => node.type === "Problem" && node.query_generated === true && !node.paper_id));
});

test("source paper metadata includes meaningful reason and counts", async () => {
  const kb = parseOkfLibrary();
  const response = await answerOkfChat("Show me the design requirements and design principles from Blockchain for the IoT.", kb);
  assert.equal(response.source_papers.length, 1);
  assert.equal(response.source_papers[0].paper_id, "BLOCKCHAIN_IOT_SDPS_2019");
  assert.equal(response.source_papers[0].reason, "matched requirement");
  assert.equal(response.source_papers[0].requirements_count, 4);
  assert.equal(response.source_papers[0].principles_count, 4);
  assert.ok(response.source_papers[0].evidence_count > 0);
});


test("feature element query does not mention zero requirements or principles", async () => {
  const kb = parseOkfLibrary();
  const response = await answerOkfChat("Show me the design features from Blockchain for the IoT.", kb);
  assert.equal(response.intent, "DSR_ELEMENT_QUERY");
  assert.equal(response.retrieved_concepts.filter((concept) => concept.type === "DesignFeature").length, 9);
  assert.match(response.answer, /9 design features/i);
  assert.equal(/0 design requirement|0 design principle/i.test(response.answer), false);
});

test("flow query answer summarizes branches instead of dumping all edges", async () => {
  const kb = parseOkfLibrary();
  const response = await answerOkfChat("Build a Requirement ? Principle ? Feature flow for tamper-resistant sensor data protection.", kb);
  assert.equal(response.intent, "DSR_FLOW_QUERY");
  assert.match(response.answer, /Summarized Requirement/i);
  assert.match(response.answer, /Full relation detail is available in the Flow tab/i);
  assert.ok(response.flow.edges.length > 8);
  assert.ok(response.answer.split("\n").length < response.flow.edges.length + 6);
});

const productIdentityQuery = "I want to design a cross-marketplace product identity and review-continuity protocol where the same exact product variant can be listed on multiple marketplaces, sellers can relist products, buyers can leave verified-purchase reviews, and competitors should not expose raw commercial data. Which reusable DSR design requirements, design principles, design features, and artifact patterns should I reuse from the OKF library? Build a concise Requirement -> Principle -> Feature -> Artifact flow, explain which papers support each part, show evidence, and clearly mark any product-identity-specific suggestions as query-generated.";

test("product identity query produces a structured decision-support answer without exact-query hardcoding", async () => {
  const kb = parseOkfLibrary();
  const response = await answerOkfChat(productIdentityQuery, kb);
  assert.equal(response.intent, "DESIGN_REUSE_FLOW_QUERY");
  assert.ok(response.answer_payload);
  assert.ok(response.answer_payload.design_moves.length >= 5);
  assert.ok(response.source_papers.length >= 5);
  assert.equal(response.answer.includes("No direct OKF card"), false);

  const implementation = [
    readFileSync(path.join(process.cwd(), "lib", "okf", "reuse.ts"), "utf8"),
    readFileSync(path.join(process.cwd(), "lib", "llm", "prompts", "dsrReuseSynthesis.ts"), "utf8"),
    readFileSync(path.join(process.cwd(), "lib", "llm", "featherless.ts"), "utf8")
  ].join("\n");
  assert.equal(implementation.includes(productIdentityQuery), false);
  assert.equal(/Product Identity & Description Integrity Registry/.test(implementation), false);
});

test("privacy-preserving decentralized identity query retrieves a well-shaped cross-paper candidate set", async () => {
  const kb = parseOkfLibrary();
  const query = "Which reusable design principles should I use for a privacy-preserving decentralized identity system where users control credentials and verifiers need auditability?";
  const papers = selectSourcePapers(query, kb, 8).map((paper) => paper.paper_id);
  assert.ok(papers.includes("SSI_KYC_FRAMEWORK_2022"));
  assert.ok(papers.includes("HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023"));
  assert.ok(papers.includes("BLOCKCHAIN_IOT_SDPS_2019"));
  const response = await synthesizeWithNoProvider(query, kb);
  assert.ok(response.answer_payload);
  assert.equal(response.answer_payload.synthesis_mode, "deterministic_fallback");
  assert.ok(response.answer_payload.design_moves.length >= 5);
  assert.ok(response.answer_payload.source_papers.length >= 5);
});

test("semantic rewording retrieves similar source papers without an exact query match", () => {
  const kb = parseOkfLibrary();
  const first = selectSourcePapers("privacy-preserving decentralized identity with user credentials and verifier auditability", kb, 6).map((paper) => paper.paper_id);
  const second = selectSourcePapers("auditable credential control for decentralized user identity and privacy", kb, 6).map((paper) => paper.paper_id);
  const overlap = first.filter((paperId) => second.includes(paperId));
  assert.ok(overlap.length >= 3, `expected overlapping sources, got ${first.join(", ")} vs ${second.join(", ")}`);
});

test("fallback answer markdown is compact and does not expose raw evidence ids", async () => {
  const kb = parseOkfLibrary();
  const response = await synthesizeWithNoProvider(productIdentityQuery, kb);
  assert.equal(response.runtime?.synthesis_mode, "deterministic_fallback");
  assert.match(response.answer, /compact|found|retrieved/i);
  assert.equal(/Requirement -> Principle -> Feature -> Artifact flow:\n\d+\. Requirement:/i.test(response.answer), false);
  for (const evidence of response.evidence.slice(0, 20)) assert.equal(response.answer.includes(evidence.evidence_id), false);
});

test("OKF chat UI renders Markdown only in the default answer tab", () => {
  const source = readFileSync(path.join(process.cwd(), "components", "okf-chat", "OkfChatWorkspace.tsx"), "utf8");
  assert.ok(source.includes("response.llm_synthesis"));
  assert.ok(source.includes("MarkdownAnswer"));
  assert.ok(source.includes("Evidence details are in the Evidence tab."));
  assert.ok(source.includes("Copy answer"));
  assert.equal(source.includes("payload.direct_answer"), false);
  assert.equal(source.includes("DesignMoveCards"), false);
  assert.equal(source.includes("GuidanceCards response"), false);
  assert.equal(source.includes("<MiniFlow response"), false);
});

test("OKF chat initial UI hides process boxes and tabs before the first answer", () => {
  const source = readFileSync(path.join(process.cwd(), "components", "okf-chat", "OkfChatWorkspace.tsx"), "utf8");
  assert.ok(source.includes("{loading && <StageProgress"));
  assert.ok(source.includes("{response ? ("));
  assert.ok(source.includes("How this answer was built"));
  assert.ok(source.includes("Ask a question to see source papers and evidence."));
  assert.equal(source.includes("Checking evidence"), false);
  assert.equal(source.includes("Waiting for a design or paper question"), false);
});

test("OKF chat progress uses five compact dynamic stages", () => {
  const source = readFileSync(path.join(process.cwd(), "components", "okf-chat", "OkfChatWorkspace.tsx"), "utf8");
  for (const stage of ["Understanding query", "Selecting source papers", "Retrieving DSR elements", "Building evidence-backed flow", "Synthesizing recommendation"]) assert.ok(source.includes(stage));
  assert.ok(source.includes("setActiveStage"));
  assert.equal(source.includes("Drafting recommendation"), false);
});

test("React keys are stable and not based only on title", () => {
  const source = readFileSync(path.join(process.cwd(), "components", "okf-chat", "OkfChatWorkspace.tsx"), "utf8");
  assert.ok(source.includes("key={paper.paper_id}"));
  assert.ok(source.includes("key={item.evidence_id}"));
  assert.ok(source.includes("key={concept.concept_id"));
  assert.ok(source.includes("dedupeConcepts"));
  assert.ok(source.includes("`${concept.paper_id}-${normalizeKey(concept.title)}-${concept.type}`"));
  assert.equal(source.includes("key={`${title}-${card.title}`"), false);
});

test("Featherless success becomes the primary synthesis mode", async () => {
  const kb = parseOkfLibrary();
  const deterministic = await answerOkfChat(productIdentityQuery, kb);
  const evidenceId = deterministic.evidence[0].evidence_id;
  const paperId = deterministic.source_papers[0].paper_id;
  const answer = {
    synthesis_mode: "featherless",
    title: "Grounded DSR reuse guidance",
    direct_answer: "Use the retrieved OKF evidence to combine identity, privacy, integrity, and lifecycle design knowledge.",
    design_moves: [{ id: "move-1", title: "Grounded identity move", what_to_build: "Build a credential-backed control point.", reused_requirement: "Use retrieved requirements.", reused_principle: "Use retrieved principles.", candidate_feature: "Use retrieved features.", artifact_pattern: "Use a retrieved artifact pattern.", supporting_paper_ids: [paperId], evidence_ids: [evidenceId], adaptation_status: "mixed", adaptation_note: "Adapted from retrieved OKF concepts only.", confidence: "medium" }],
    architecture_direction: "Keep claims grounded in selected evidence.",
    limitations: ["Validate adaptations in the target project."],
    source_papers: [{ paper_id: paperId, title: deterministic.source_papers[0].title, reason: deterministic.source_papers[0].reason, score: deterministic.source_papers[0].score ?? 0 }],
    evidence_refs: [{ evidence_id: evidenceId, paper_id: paperId, concept_id: deterministic.evidence[0].concept_id, excerpt: deterministic.evidence[0].paraphrase, confidence: deterministic.evidence[0].confidence }],
    query_generated_notes: ["Target-domain adaptation is mixed."]
  };
  await withMockedFeatherless(JSON.stringify(answer), async () => {
    const response = await synthesizeWithOptionalLlm(deterministic);
    assert.equal(response.answer_payload?.synthesis_mode, "featherless");
    assert.equal(response.runtime?.synthesis_mode, "featherless");
    assert.match(response.answer, /credential-backed control point/i);
  });
});

test("product identity source selection prefers relevant cross-paper sources and excludes unrelated token incentives", () => {
  const kb = parseOkfLibrary();
  const paperIds = selectSourcePapers(productIdentityQuery, kb, 8).map((paper) => paper.paper_id);
  for (const required of ["SHORT_END_STICK_2025", "BLOCKCHAIN_IOT_SDPS_2019", "SSI_KYC_FRAMEWORK_2022", "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024", "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024"]) {
    assert.ok(paperIds.includes(required), `missing ${required}`);
  }
  assert.equal(paperIds.includes("PEER_REVIEW_TOKEN_INCENTIVES_2025"), false);
});
test("product identity Groq answer is professional Markdown without raw IDs or patient-consent leakage", async () => {
  const kb = parseOkfLibrary();
  const deterministic = await answerOkfChat(productIdentityQuery, kb);
  const markdown = `# Recommendation
Prioritize product identity, privacy-preserving evidence, credentialed actors, review continuity, dispute governance, and implementation lifecycle controls. The OKF supports this through commercial-data privacy, SSI/KYC credentials, trust/reputation, tamper-resistant proof storage, and blockchain implementation lifecycle papers. Product-specific review gates are adaptations, not stored OKF constructs.

## Design moves to reuse
1. **What to build:** Canonical product identity and listing mapping integrity. **Reuse from OKF:** manipulation-resistant proof of integrity. **Supporting papers:** And No One Gets the Short End of the Stick; Blockchain for the IoT: Privacy-Preserving Protection of Sensor Data. **Evidence:** evidence supports proving integrity without exposing raw data. **Adaptation status:** mixed.
2. **What to build:** Privacy-preserving commercial evidence handling. **Reuse from OKF:** sensitive data stays with provider while proofs are shared. **Supporting papers:** And No One Gets the Short End of the Stick. **Evidence:** evidence supports private storage and verifiable sharing. **Adaptation status:** mixed.
3. **What to build:** Persistent seller, marketplace, and buyer identity credentials. **Reuse from OKF:** issuer-verifier-holder credentials, proof requests, and status checks. **Supporting papers:** Designing a Framework for Digital KYC Processes Built on Blockchain-Based Self-Sovereign Identity. **Evidence:** evidence supports reusable credentials and revocation/status registries. **Adaptation status:** mixed.
4. **What to build:** Verified-purchase review gate. **Reuse from OKF:** screening and reputation mechanisms. **Supporting papers:** Designing trust-enabling blockchain systems for the inter-organizational exchange of capacity. **Evidence:** evidence supports screening and reputation tied to persistent identity. **Adaptation status:** query-generated.
5. **What to build:** Dispute and correction governance. **Reuse from OKF:** authority/fairness and joint governance. **Supporting papers:** Designing trust-enabling blockchain systems for the inter-organizational exchange of capacity; And No One Gets the Short End of the Stick. **Evidence:** evidence supports governance for trusted interorganizational exchange. **Adaptation status:** mixed.
6. **What to build:** Implementation and evaluation lifecycle. **Reuse from OKF:** model, test, deploy, and maintain the blockchain artifact. **Supporting papers:** Towards an integrated framework for developing blockchain systems. **Evidence:** evidence supports lifecycle-driven implementation. **Adaptation status:** mixed.

## Suggested architecture direction
Use off-chain commercial records, on-chain hashes/status proofs, credential wallets, verifier checks, reputation continuity services, and governed correction workflows.

## What not to overclaim
- The OKF does not directly store this product identity protocol.
- Review continuity is adapted from credential, screening, and reputation patterns.`;
  await withMockedGroq(markdown, async () => {
    const response = await synthesizeWithOptionalLlm(deterministic);
    assert.match(response.answer, /^# Recommendation/);
    assert.equal(/:[a-z]+_\d+|:ev_/i.test(response.answer), false);
    assert.equal(/patient-facing consent management|Distributed replication of consent transactions|Immutable consent transaction log/i.test(response.answer), false);
    for (const phrase of ["Canonical product identity", "Privacy-preserving commercial evidence", "Persistent seller", "Verified-purchase review gate", "Implementation and evaluation lifecycle"]) {
      assert.match(response.answer, new RegExp(phrase, "i"));
    }
  });
});

test("Groq success becomes the primary synthesis mode", async () => {
  const kb = parseOkfLibrary();
  const deterministic = await answerOkfChat(productIdentityQuery, kb);
  const answer = `# Recommendation
Use the retrieved OKF papers to combine product identity credentials, privacy-preserving commercial evidence, review continuity, and implementation governance. Treat product-specific registry details as mixed or query-generated because the OKF stores reusable patterns rather than this exact marketplace construct.

## Design moves to reuse
1. **What to build:** Canonical product identity and listing mapping integrity. **Reuse from OKF:** proof of integrity and identity signaling. **Supporting papers:** And No One Gets the Short End of the Stick; Designing trust-enabling blockchain systems for the inter-organizational exchange of capacity. **Evidence:** selected evidence supports manipulation resistance, private data handling, and identity signaling. **Adaptation status:** mixed.
2. **What to build:** Privacy-preserving commercial evidence handling. **Reuse from OKF:** provider-held sensitive data with public integrity proof. **Supporting papers:** And No One Gets the Short End of the Stick; Blockchain for the IoT: Privacy-Preserving Protection of Sensor Data. **Evidence:** selected evidence supports keeping raw data off shared infrastructure while publishing verifiable proofs. **Adaptation status:** mixed.
3. **What to build:** Persistent seller, marketplace, and buyer credentials. **Reuse from OKF:** issuer-verifier-holder credentials and revocation/status checks. **Supporting papers:** Designing a Framework for Digital KYC Processes Built on Blockchain-Based Self-Sovereign Identity. **Evidence:** selected evidence supports reusable credentials, proof requests, and non-revocation checks. **Adaptation status:** mixed.
4. **What to build:** Verified-purchase review gate. **Reuse from OKF:** screening, reputation, and identity smart-contract modules. **Supporting papers:** Designing trust-enabling blockchain systems for the inter-organizational exchange of capacity. **Evidence:** selected evidence supports screening and reputation mechanisms tied to persistent identity. **Adaptation status:** query-generated.
5. **What to build:** Implementation and evaluation lifecycle. **Reuse from OKF:** modeling, testing, deployment, and maintenance activities. **Supporting papers:** Towards an integrated framework for developing blockchain systems. **Evidence:** selected evidence supports lifecycle roles and evaluation-oriented development. **Adaptation status:** mixed.

## Suggested architecture direction
Use a hybrid architecture: keep raw commercial records off-chain with the data owner, publish hashes/status proofs and credential schemas on shared infrastructure, and govern corrections or disputes through explicit marketplace authority rules.

## What not to overclaim
- The OKF does not directly store a product-identity registry.
- Verified-purchase review continuity is an adaptation from identity, screening, and reputation patterns.
- Do not claim raw commercial data privacy without validating access controls and governance.`;
  await withMockedGroq(answer, async () => {
    const response = await synthesizeWithOptionalLlm(deterministic);
    assert.equal(response.llm_synthesis?.synthesis_mode, "groq");
    assert.equal(response.runtime?.provider, "groq");
    assert.equal(response.runtime?.provider_connected, true);
    assert.match(response.answer, /# Recommendation/);
    assert.match(response.answer, /Verified-purchase review gate/i);
  });
});
test("Groq Markdown answer scrubs raw evidence and concept ids", async () => {
  const kb = parseOkfLibrary();
  const deterministic = await answerOkfChat(productIdentityQuery, kb);
  const rawMarkdown = "# Recommendation\nUse BLOCKCHAIN_IOT_SDPS_2019:dp1_source_to_sink_certification with ev_12345 and SHORT_END_STICK_2025:dp_001.\n\n## Design moves to reuse\n1. Build it.\n\n## Suggested architecture direction\nKeep it grounded.\n\n## What not to overclaim\nDo not overclaim.";
  await withMockedGroq(rawMarkdown, async () => {
    const response = await synthesizeWithOptionalLlm(deterministic);
    assert.equal(response.llm_synthesis?.synthesis_mode, "groq");
    assert.equal(/ev_\w+/i.test(response.answer), false);
    assert.equal(/BLOCKCHAIN_IOT_SDPS_2019:/i.test(response.answer), false);
    assert.equal(/SHORT_END_STICK_2025:/i.test(response.answer), false);
  });
});
test("Groq failure shows a marked compact retrieval fallback instead of raw debug", async () => {
  const kb = parseOkfLibrary();
  const deterministic = await answerOkfChat(productIdentityQuery, kb);
  await withMockedGroq(undefined, async () => {
    const response = await synthesizeWithOptionalLlm(deterministic);
    assert.equal(response.llm_synthesis?.synthesis_mode, "fallback_error");
    assert.match(response.answer, /^LLM synthesis failed; showing compact retrieval summary\./);
    assert.equal(/Evidence:\s*[^\n]*:ev_/i.test(response.answer), false);
    assert.ok(response.llm_synthesis?.debug?.fallback_reason);
  }, new Error("mock Groq outage"));
});
test("Featherless failure uses compact deterministic fallback with debug reason", async () => {
  const kb = parseOkfLibrary();
  const deterministic = await answerOkfChat(productIdentityQuery, kb);
  await withMockedFeatherless(undefined, async () => {
    const response = await synthesizeWithOptionalLlm(deterministic);
    assert.equal(response.answer_payload?.synthesis_mode, "deterministic_fallback");
    assert.equal(response.runtime?.synthesis_mode, "deterministic_fallback");
    assert.ok(response.runtime?.fallback_reason);
    assert.match(response.answer_payload?.direct_answer ?? "", /LLM synthesis failed/i);
    assert.equal(/Evidence:\s*[^\n]*:evidence/i.test(response.answer), false);
  }, new Error("mock timeout"));
});

test("Flow tab does not dump all retrieved graph nodes by default", () => {
  const source = readFileSync(path.join(process.cwd(), "components", "okf-chat", "OkfChatWorkspace.tsx"), "utf8");
  assert.ok(source.includes("Compact relation-backed flow"));
  assert.ok(source.includes("slice(0, 7)"));
  assert.equal(source.includes("LayeredFlow"), false);
});
test("LLM health endpoint is provider-neutral and does not expose Featherless fields for Groq", () => {
  const source = readFileSync(path.join(process.cwd(), "app", "api", "health", "llm", "route.ts"), "utf8");
  assert.ok(source.includes("GROQ_API_KEY"));
  assert.ok(source.includes("GROQ_MODEL"));
  assert.ok(source.includes("/chat/completions"));
  assert.equal(source.includes("featherless_configured"), false);
});
test("Featherless provider files enforce the new grounded JSON contract", () => {
  const provider = readFileSync(path.join(process.cwd(), "lib", "llm", "featherless.ts"), "utf8");
  const prompt = readFileSync(path.join(process.cwd(), "lib", "llm", "prompts", "dsrReuseSynthesis.ts"), "utf8");
  assert.ok(provider.includes("/chat/completions"));
  assert.ok(provider.includes("parseDecisionSupportJson"));
  assert.ok(provider.includes("unsupportedMoveEvidence"));
  assert.ok(prompt.includes("Do not invent papers, citations, evidence IDs, or OKF concepts"));
});

async function synthesizeWithNoProvider(query: string, kb = parseOkfLibrary()) {
  const previousProvider = process.env.LLM_PROVIDER;
  process.env.LLM_PROVIDER = "none";
  try {
    return await synthesizeWithOptionalLlm(await answerOkfChat(query, kb));
  } finally {
    if (previousProvider === undefined) delete process.env.LLM_PROVIDER;
    else process.env.LLM_PROVIDER = previousProvider;
  }
}

async function withMockedFeatherless(content: string | undefined, fn: () => Promise<void>, error?: Error) {
  const previousProvider = process.env.LLM_PROVIDER;
  const previousKey = process.env.FEATHERLESS_API_KEY;
  const previousModel = process.env.FEATHERLESS_MODEL;
  const previousFetch = globalThis.fetch;
  process.env.LLM_PROVIDER = "featherless";
  process.env.FEATHERLESS_API_KEY = "test-key";
  process.env.FEATHERLESS_MODEL = "test-model";
  globalThis.fetch = (async () => {
    if (error) throw error;
    return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
  try {
    await fn();
  } finally {
    globalThis.fetch = previousFetch;
    if (previousProvider === undefined) delete process.env.LLM_PROVIDER; else process.env.LLM_PROVIDER = previousProvider;
    if (previousKey === undefined) delete process.env.FEATHERLESS_API_KEY; else process.env.FEATHERLESS_API_KEY = previousKey;
    if (previousModel === undefined) delete process.env.FEATHERLESS_MODEL; else process.env.FEATHERLESS_MODEL = previousModel;
  }
}
async function withMockedGroq(content: string | undefined, fn: () => Promise<void>, error?: Error) {
  const previousProvider = process.env.LLM_PROVIDER;
  const previousChatProvider = process.env.CHAT_PROVIDER;
  const previousKey = process.env.GROQ_API_KEY;
  const previousModel = process.env.GROQ_MODEL;
  const previousBaseUrl = process.env.GROQ_BASE_URL;
  const previousFetch = globalThis.fetch;
  process.env.LLM_PROVIDER = "groq";
  process.env.CHAT_PROVIDER = "groq";
  process.env.GROQ_API_KEY = "test-key";
  process.env.GROQ_MODEL = "llama-3.3-70b-versatile";
  process.env.GROQ_BASE_URL = "https://api.groq.com/openai/v1";
  globalThis.fetch = (async () => {
    if (error) throw error;
    return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200, headers: { "Content-Type": "application/json" } });
  }) as typeof fetch;
  try {
    await fn();
  } finally {
    globalThis.fetch = previousFetch;
    if (previousProvider === undefined) delete process.env.LLM_PROVIDER; else process.env.LLM_PROVIDER = previousProvider;
    if (previousChatProvider === undefined) delete process.env.CHAT_PROVIDER; else process.env.CHAT_PROVIDER = previousChatProvider;
    if (previousKey === undefined) delete process.env.GROQ_API_KEY; else process.env.GROQ_API_KEY = previousKey;
    if (previousModel === undefined) delete process.env.GROQ_MODEL; else process.env.GROQ_MODEL = previousModel;
    if (previousBaseUrl === undefined) delete process.env.GROQ_BASE_URL; else process.env.GROQ_BASE_URL = previousBaseUrl;
  }
}