import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { readFileSync } from "node:fs";
import { answerOkfChat, routeOkfQuery } from "../lib/okf/chat.ts";
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

test("query router classifies deterministic intents", () => {
  assert.equal(routeOkfQuery("which papers use auditability"), "PAPER_LIST_QUERY");
  assert.equal(routeOkfQuery("what are the design principles"), "DSR_ELEMENT_QUERY");
  assert.equal(routeOkfQuery("show evidence for the claim"), "EVIDENCE_QUERY");
});

test("flow builder creates a query-generated problem if needed", () => {
  const kb = parseOkfLibrary(fixtureRoot);
  const selected = kb.concepts.filter((concept) => concept.type !== "Problem");
  const flow = buildOkfFlow("new problem", selected, kb);
  assert.equal(flow.nodes[0].query_generated, true);
  assert.ok(flow.edges.length > 0);
});

test("citation and evidence validator accepts deterministic chat output", async () => {
  const kb = parseOkfLibrary(fixtureRoot);
  const response = await answerOkfChat("Design a fixture system", kb);
  const validation = validateChatResponse(response, kb);
  assert.equal(validation.ok, true);
});


