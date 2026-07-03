import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { readFileSync } from "node:fs";
import { analyzeOkfQuery, answerOkfChat, routeOkfQuery, selectSourcePapers } from "../lib/okf/chat.ts";
import { buildOkfFlow } from "../lib/okf/flow.ts";
import { indexOkfKnowledgeBase } from "../lib/okf/indexer.ts";
import { parseOkfLibrary, validateKnowledgeBase } from "../lib/okf/parser.ts";
import { validateChatResponse } from "../lib/okf/validator.ts";

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

test("design recommendation for product-description trust includes Short End principles", async () => {
  const kb = parseOkfLibrary();
  const response = await answerOkfChat("I want marketplace product-description trust controls that prevent manipulation and poaching.", kb);
  assert.equal(response.intent, "DESIGN_RECOMMENDATION_QUERY");
  assert.ok(response.principles.some((card) => card.paper_id === "SHORT_END_STICK_2025"));
  assert.ok(response.artifact_direction.some((card) => card.paper_id === "query_generated" || /artifact|registry/i.test(card.title)));
});

test("OKF chat UI keeps debug trace out of the default answer surface", () => {
  const source = readFileSync(path.join(process.cwd(), "components", "okf-chat", "OkfChatWorkspace.tsx"), "utf8");
  assert.ok(source.includes('"Answer", "Flow", "Evidence", "Retrieved Knowledge", "Debug"'));
  assert.ok(source.includes("Debug / retrieval trace"));
  assert.equal(source.includes('role="Assistant reasoning stages"'), false);
});

test("evidence drawer has no random selected item on initial response load", () => {
  const source = readFileSync(path.join(process.cwd(), "components", "okf-chat", "OkfChatWorkspace.tsx"), "utf8");
  assert.ok(source.includes("setSelectedConceptId(undefined);"));
  assert.equal(source.includes("setSelectedConceptId(payload.flow"), false);
  assert.ok(source.includes("Select a concept card to inspect its evidence."));
});

test("query router classifies deterministic intents", () => {
  assert.equal(routeOkfQuery("which papers use auditability"), "PAPER_LIST_QUERY");
  assert.equal(routeOkfQuery("what are the design principles"), "DSR_ELEMENT_QUERY");
  assert.equal(routeOkfQuery("show evidence for the claim"), "EVIDENCE_QUERY");
});

test("flow builder creates a query-generated problem if needed", () => {
  const kb = parseOkfLibrary(fixtureRoot);
  const selected = kb.concepts.filter((concept) => concept.type !== "Problem");
  const flow = buildOkfFlow("new problem", selected, kb, { includeQueryProblem: true });
  assert.equal(flow.nodes[0].query_generated, true);
  assert.ok(flow.edges.length > 0);
});

test("citation and evidence validator accepts deterministic chat output", async () => {
  const kb = parseOkfLibrary(fixtureRoot);
  const response = await answerOkfChat("Design a fixture system", kb);
  const validation = validateChatResponse(response, kb);
  assert.equal(validation.ok, true);
});



const productIdentityQuery = "I want to design a cross-marketplace product identity and review-continuity protocol where the same exact product variant can be listed on multiple marketplaces, sellers can relist products, buyers can leave verified-purchase reviews, and competitors should not expose raw commercial data. Which reusable DSR design requirements, design principles, design features, and artifact patterns should I reuse from the OKF library? Build a concise Requirement -> Principle -> Feature -> Artifact flow, explain which papers support each part, show evidence, and clearly mark any product-identity-specific suggestions as query-generated.";

function augmentedKb() {
  const kb = parseOkfLibrary();
  const paperSeeds = [
    ["SSI_KYC_2021", "Designing a Framework for Digital KYC Processes Built on Blockchain-Based Self-Sovereign Identity", "credential issuer revocation status decentralized identity wallet KYC SSI"],
    ["TRUST_CAPACITY_2020", "Designing trust-enabling blockchain systems for the inter-organizational exchange of capacity", "identity reputation screening authority fairness deterrence seller review trust"],
    ["CONSENT_HIE_2020", "Blockchain innovation for consent self-management in health information exchanges", "consent status sharing interoperability audit user-controlled"],
    ["INTEGRATED_BLOCKCHAIN_SYSTEMS_2021", "Towards an integrated framework for developing blockchain systems", "lifecycle development implementation evaluation testing smart contract monitoring roles"],
    ["GS1_GERMANY_BLOCKCHAIN_2020", "GS1 Germany blockchain white paper and pallet exchange blockchain pilot", "GS1 GTIN GLN ECLASS standard identifier governance variant pallet use case"]
  ];
  for (const [paper_id, title, text] of paperSeeds) {
    kb.papers.push({ paper_id, title, review_status: "draft", source_file: "test", body_text: text });
    for (const [suffix, type] of [["req", "DesignRequirement"], ["dp", "DesignPrinciple"], ["df", "DesignFeature"], ["art", "Artifact"], ["ev", "Evaluation"]] as const) {
      const concept_id = `${paper_id}:${suffix}_001`;
      kb.concepts.push({ concept_id, paper_id, type, dsr_layer: type, title: `${title} ${type}`, description: text, body_text: text, tags: text.split(" ").slice(0, 8), confidence: "medium", extraction_type: "explicit", review_status: "draft", source_file: "test" });
      kb.evidence_items.push({ evidence_id: `${concept_id}:evidence`, paper_id, concept_id, paraphrase: `${title} supports ${text}.`, confidence: "medium", source_file: "test" });
    }
  }
  return kb;
}

test("product identity query is classified as design_reuse_flow and cross-paper", () => {
  const kb = augmentedKb();
  const plan = analyzeOkfQuery(productIdentityQuery, routeOkfQuery(productIdentityQuery), kb);
  assert.equal(plan.task_type, "design_reuse_flow");
  assert.equal(plan.isCrossPaper, true);
  assert.equal(plan.output_shape, "Requirement -> Principle -> Feature -> Artifact");
});

test("source selection returns at least five papers for product identity query", () => {
  const kb = augmentedKb();
  const papers = selectSourcePapers(productIdentityQuery, kb, 8);
  assert.ok(papers.length >= 5);
  assert.ok(papers.some((paper) => /Short End/i.test(paper.title)));
  assert.ok(papers.some((paper) => /KYC|Self-Sovereign/i.test(paper.title)));
});

test("reuse flow answer has multi-paper rows and query-generated adaptations", async () => {
  const kb = augmentedKb();
  const response = await answerOkfChat(productIdentityQuery, kb);
  assert.equal(response.intent, "DESIGN_REUSE_FLOW_QUERY");
  assert.ok((response.flow_rows ?? []).length >= 6);
  assert.ok((response.flow_rows ?? []).some((row) => row.supporting_papers.length > 1));
  assert.ok((response.flow_rows ?? []).every((row) => row.adaptation_status === "mixed" || row.adaptation_status === "query_generated"));
  assert.equal(response.answer.includes("No direct OKF card"), false);
  const evidenceIds = new Set(response.evidence.map((item) => item.evidence_id));
  for (const row of response.flow_rows ?? []) for (const id of row.evidence_ids) assert.ok(evidenceIds.has(id));
});

test("Featherless provider files enforce grounded JSON synthesis", () => {
  const provider = readFileSync(path.join(process.cwd(), "lib", "llm", "featherless.ts"), "utf8");
  const prompt = readFileSync(path.join(process.cwd(), "lib", "llm", "prompts", "dsrReuseSynthesis.ts"), "utf8");
  assert.ok(provider.includes("/chat/completions"));
  assert.ok(provider.includes("answerPayloadSchema.parse"));
  assert.ok(prompt.includes("Never claim that a paper supports something"));
});
