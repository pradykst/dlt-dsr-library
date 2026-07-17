import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { answerOkfChat, routeOkfQuery, selectSourcePapers } from "../lib/okf/chat.ts";
import { validateAuthoritativeReuseAnswerPlan } from "../lib/okf/answer-plan-validator.ts";
import { synthesizeWithOptionalLlm } from "../lib/okf/llm.ts";
import { isProviderResponseReachable } from "../lib/llm/provider.ts";
import { clearSuccessfulSynthesisCache } from "../lib/llm/runtime-policy.ts";
import { compactPromptSize } from "../lib/llm/structured-synthesis.ts";
import { buildMarkdownSynthesisContext } from "../lib/llm/groq.ts";
import { synthesizeWithFeatherless } from "../lib/llm/featherless.ts";
import { indexOkfKnowledgeBase, selectIndexedEvidenceConceptId, serializeOkfPaperMetadata } from "../lib/okf/indexer.ts";
import { getOkfDatabaseHealthStatus, getOkfKnowledgeBaseLoadMetadata, loadOkfKnowledgeBaseFromSupabase } from "../lib/okf/retrieval.ts";
import { getSupabaseServiceRoleClient, resolveSupabaseServerCredential, serviceRoleRestHeaders } from "../lib/supabase/server.ts";
import { parseOkfLibrary, validateKnowledgeBase } from "../lib/okf/parser.ts";
import { getWorkbenchFlowGraph, getWorkbenchPaper, getWorkbenchPapers, workbenchCanonicalTargetPath, workbenchChangeTargetExists } from "../lib/okf/workbench-adapter.ts";
import { OKF_PRESENTATION_VERSION, okfConceptTypes, type OkfKnowledgeBase } from "../lib/okf/schema.ts";
import { validateOkfFlows } from "../lib/okf/flow-validation.ts";
import { buildWorkbenchDsrMatrix } from "../lib/okf/workbench-matrix.ts";
import { isCanonicalDsrTransition } from "../lib/okf/dsr-transition-contract.ts";
import { requiredOkfBundleFiles, validateOkfSource, validateOkfTemplate } from "../lib/okf/source-validator.ts";
import { workbenchChangeFields } from "../lib/workbench/schema.ts";
import { GET as getWorkbenchPapersRoute } from "../app/api/workbench/papers/route.ts";
import { GET as getWorkbenchPaperRoute } from "../app/api/workbench/paper/[paperId]/route.ts";
import { projectStoredMainFlow, isStoredMainElementType } from "../lib/okf/stored-flow-projection.ts";
import { loadRecommendedStoredFlowPaths, loadStoredPaperFlowMetadata, projectStoredOkfFlow } from "../lib/okf/stored-flow.ts";
import "./presentation-migration.test.ts";
import "./source-view.test.ts";
import "./source-view-runtime.test.ts";
import "./text-hygiene.test.ts";
import "./flow-projection.test.ts";
import "./final-flow-regression.test.ts";
import "./chatbot-flow-context.test.ts";
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

test("canonical OKF parser preserves paper authors and multiline titles for Workbench metadata", () => {
  const kb = parseOkfLibrary();
  assert.equal(kb.papers.length, 9);
  assert.ok(kb.papers.every((paper) => (paper.authors?.length ?? 0) > 0));
  assert.equal(
    kb.papers.find((paper) => paper.paper_id === "PEER_REVIEW_TOKEN_INCENTIVES_2025")?.title,
    "Blockchain-based token system for incentivizing peer review: A design science approach"
  );
  assert.equal(
    kb.papers.find((paper) => paper.paper_id === "NIL_NFT_MARKETPLACE_2026")?.source_pdf_path,
    "Designing a fair and inclusive digital asset-based name-image-likeness marketplace.pdf"
  );
});

test("OKF Workbench adapter lists all papers and resolves IDs, slugs, and legacy route IDs", async () => {
  const kb = parseOkfLibrary();
  const papers = await getWorkbenchPapers({ knowledgeBase: kb });
  assert.equal(papers.length, 9);
  assert.ok(papers.every((paper) => paper.canonical_source === "okf" && paper.slug));

  const canonicalId = await getWorkbenchPaper("BLOCKCHAIN_IOT_SDPS_2019", { knowledgeBase: kb });
  const canonicalSlug = await getWorkbenchPaper("blockchain-iot-sdps-2019", { knowledgeBase: kb });
  assert.equal(canonicalId?.paper.paper_id, "BLOCKCHAIN_IOT_SDPS_2019");
  assert.equal(canonicalSlug?.paper.paper_id, "BLOCKCHAIN_IOT_SDPS_2019");

  const aliases: Record<string, string> = {
    "paper-iot-sdps": "BLOCKCHAIN_IOT_SDPS_2019",
    "paper-consent-hie": "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023",
    "paper-nil-marketplace": "NIL_NFT_MARKETPLACE_2026",
    "paper-peer-review-token": "PEER_REVIEW_TOKEN_INCENTIVES_2025",
    "paper-opportunism": "SHORT_END_STICK_2025",
    "paper-ssi-kyc": "SSI_KYC_FRAMEWORK_2022",
    "paper-trust-capacity": "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024"
  };
  for (const [alias, expectedPaperId] of Object.entries(aliases)) {
    assert.equal((await getWorkbenchPaper(alias, { knowledgeBase: kb }))?.paper.paper_id, expectedPaperId);
  }
});

test("Workbench DSR grid groups the seven canonical layers with evidence counts", async () => {
  const kb = parseOkfLibrary();
  const bundle = await getWorkbenchPaper("blockchain-iot-sdps-2019", { knowledgeBase: kb });
  assert.ok(bundle);
  const counts = Object.fromEntries((bundle.dsrGrid ?? []).map((group) => [group.key, group.concepts.length]));
  assert.deepEqual(counts, {
    Problem: 1,
    "Design Requirement": 4,
    "Design Principle": 4,
    "Design Feature": 9,
    Artifact: 2,
    Evaluation: 2,
    "Output Knowledge": 2
  });
  assert.ok((bundle.dsrGrid ?? []).flatMap((group) => group.concepts).every((concept) => typeof concept.evidence_count === "number"));
});

test("Workbench stored flows use compact explicit graph recommendations without invented edges", async () => {
  const kb = parseOkfLibrary();
  const canonicalRelationIds = new Set(kb.relations.map((relation) => relation.relation_id));
  for (const paper of kb.papers) {
    const flow = await getWorkbenchFlowGraph(paper.paper_id, { knowledgeBase: kb });
    const metadata = loadStoredPaperFlowMetadata(paper.paper_id);
    const expectedSource = metadata?.recommendedPaths.length ? "graph_json" : "okf_relations_fallback";
    assert.ok(flow, paper.paper_id);
    assert.equal(flow.stored_flow_source, expectedSource, paper.paper_id);
    assert.ok(flow.recommended.nodes.length <= 14, paper.paper_id + " recommended graph is not compact");
    const focusedBound = Math.max(8, metadata.recommendedPaths.length * 3);
    assert.ok(flow.focused.nodes.length <= focusedBound, paper.paper_id + " focused graph is not compact");

    for (const graph of [flow.recommended, flow.focused]) {
      const degree = new Map<string, number>();
      for (const relation of graph.relations) {
        assert.ok(canonicalRelationIds.has(relation.relation_id), relation.relation_id);
        assert.ok(relation.provenance === "graph_json" || relation.provenance === "okf_relation");
        degree.set(relation.source_node_id, (degree.get(relation.source_node_id) ?? 0) + 1);
        degree.set(relation.target_node_id, (degree.get(relation.target_node_id) ?? 0) + 1);
      }
      for (const node of graph.nodes) assert.ok((degree.get(node.element_id) ?? 0) > 0, node.element_id);
    }

    assert.ok(flow.focused.nodes.every((node) => (
      node.canonical_type === "Design Requirement"
      || node.canonical_type === "Design Principle"
      || node.canonical_type === "Design Feature"
    )));
    const focusedTypeById = new Map(flow.focused.nodes.map((node) => [node.element_id, node.canonical_type]));
    const hasRpfChain = flow.focused.nodes.some((node) => (
      node.canonical_type === "Design Principle"
      && flow.focused.relations.some((relation) => (
        relation.target_node_id === node.element_id
        && focusedTypeById.get(relation.source_node_id) === "Design Requirement"
      ))
      && flow.focused.relations.some((relation) => (
        relation.source_node_id === node.element_id
        && focusedTypeById.get(relation.target_node_id) === "Design Feature"
      ))
    ));
    assert.equal(hasRpfChain, true, paper.paper_id + " focused graph lacks a stored R-P-F path");
  }
});
test("Workbench stored flow falls back to canonical OKF relations when graph metadata is absent", async () => {
  const kb: OkfKnowledgeBase = {
    papers: [{
      schema_version: "okf-dsr-v1",
      paper_id: "WORKBENCH_FALLBACK_2099",
      slug: "workbench-fallback-2099",
      title: "Workbench fallback fixture",
      authors: ["Test Author"],
      year: 2099,
      research_problem: [],
      research_objective: [],
      research_questions: [],
      theoretical_foundations: [],
      evaluation_method: [],
      key_contributions: [],
      design_knowledge_output: [],
      limitations: [],
      extraction_status: "okf_draft",
      review_status: "unreviewed",
      author_check_status: "not_requested",
      source_file: "fixture/index.md"
    }],
    concepts: [
      workbenchFixtureConcept("dr", "Design Requirement", "Requirement"),
      workbenchFixtureConcept("dp", "Design Principle", "Principle"),
      workbenchFixtureConcept("df", "Design Feature", "Feature")
    ],
    relations: [
      {
        relation_id: "WORKBENCH_FALLBACK_2099:rel_1",
        source_concept_id: "WORKBENCH_FALLBACK_2099:dr",
        predicate: "addressed_by",
        target_concept_id: "WORKBENCH_FALLBACK_2099:dp",
        confidence: "high",
        extraction_type: "explicit",
        relation_scope: "paper_level",
        source_file: "fixture/relations.yaml"
      },
      {
        relation_id: "WORKBENCH_FALLBACK_2099:rel_2",
        source_concept_id: "WORKBENCH_FALLBACK_2099:dp",
        predicate: "instantiates",
        target_concept_id: "WORKBENCH_FALLBACK_2099:df",
        confidence: "high",
        extraction_type: "explicit",
        relation_scope: "paper_level",
        source_file: "fixture/relations.yaml"
      }
    ],
    evidence_items: [],
    warnings: []
  };
  const flow = await getWorkbenchFlowGraph("workbench-fallback-2099", { knowledgeBase: kb });
  assert.ok(flow);
  assert.equal(flow.stored_flow_source, "okf_relations_fallback");
  assert.equal(flow.recommended.nodes.length, 3);
  assert.equal(flow.recommended.relations.length, 2);
  assert.ok(flow.recommended.relations.every((relation) => relation.provenance === "okf_relation"));
});

test("Workbench paper API returns JSON for valid and invalid identifiers", async () => {
  await withTemporaryEnv({
    NEXT_PUBLIC_SUPABASE_URL: undefined,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: undefined,
    SUPABASE_SERVICE_ROLE_KEY: undefined
  }, async () => {
    const listResponse = await getWorkbenchPapersRoute();
    assert.equal(listResponse.status, 200);
    assert.match(listResponse.headers.get("content-type") ?? "", /application\/json/i);
    assert.equal((await listResponse.json()).papers.length, 9);

    const validResponse = await getWorkbenchPaperRoute(
      new Request("http://localhost/api/workbench/paper/blockchain-iot-sdps-2019"),
      { params: Promise.resolve({ paperId: "blockchain-iot-sdps-2019" }) }
    );
    assert.equal(validResponse.status, 200);
    assert.match(validResponse.headers.get("content-type") ?? "", /application\/json/i);
    assert.equal((await validResponse.json()).paper.paper_id, "BLOCKCHAIN_IOT_SDPS_2019");

    const invalidResponse = await getWorkbenchPaperRoute(
      new Request("http://localhost/api/workbench/paper/does-not-exist"),
      { params: Promise.resolve({ paperId: "does-not-exist" }) }
    );
    assert.equal(invalidResponse.status, 404);
    assert.match(invalidResponse.headers.get("content-type") ?? "", /application\/json/i);
    const invalid = await invalidResponse.json();
    assert.equal(invalid.error, "PAPER_NOT_FOUND");
    assert.equal(invalid.paperId, "does-not-exist");
    assert.equal(invalid.availablePapers.length, 9);
  });
});

test("Workbench runtime, navigation, parsing, and correction boundaries stay canonical", () => {
  const adapter = readFileSync(path.join(process.cwd(), "lib", "okf", "workbench-adapter.ts"), "utf8");
  const client = readFileSync(path.join(process.cwd(), "lib", "workbench", "client.ts"), "utf8");
  const landing = readFileSync(path.join(process.cwd(), "components", "workbench", "WorkbenchLanding.tsx"), "utf8");
  const legacyImport = readFileSync(path.join(process.cwd(), "components", "workbench", "WorkbenchImport.tsx"), "utf8");
  const home = readFileSync(path.join(process.cwd(), "app", "page.tsx"), "utf8");
  const decision = readFileSync(path.join(process.cwd(), "app", "api", "workbench", "change-requests", "[id]", "decision", "route.ts"), "utf8");

  assert.ok(adapter.includes("getOkfKnowledgeBaseForChat"));
  assert.equal(adapter.includes("supabase-browser"), false);
  assert.equal(adapter.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY"), false);
  assert.ok(client.includes('includes("application/json")'));
  assert.ok(client.includes("if (!response.ok)"));
  assert.equal(landing.includes('href="/workbench/import"'), false);
  assert.equal(landing.includes("Import CSVs"), false);
  assert.ok(legacyImport.includes("Legacy/Admin CSV Import"));
  assert.ok(legacyImport.includes("not canonical"));
  assert.equal(home.includes("Upload curated paper data"), false);
  assert.equal(decision.includes("updateTargetField"), false);
  assert.equal(decision.includes('.from("okf_'), false);
  assert.ok(decision.includes("canonical_data_modified: false"));
});

function workbenchFixtureConcept(id: string, type: "Design Requirement" | "Design Principle" | "Design Feature", title: string) {
  return {
    concept_id: "WORKBENCH_FALLBACK_2099:" + id,
    paper_id: "WORKBENCH_FALLBACK_2099",
    type,
    dsr_layer: type,
    title,
    description: title,
    body_text: title,
    evidence_ids: [],
    tags: [],
    confidence: "high" as const,
    extraction_type: "explicit" as const,
    review_status: "unreviewed" as const,
    source_file: "fixture/dsr.md",
    okf_path: "fixture/dsr.md"
  };
}

test("current canonical papers and concepts are unreviewed without explicit human review records", () => {
  const kb = parseOkfLibrary();
  assert.equal(kb.papers.length, 9);
  assert.ok(kb.papers.every((paper) => paper.review_status === "unreviewed"));
  assert.ok(kb.concepts.every((concept) => concept.review_status === "unreviewed"));
  for (const paper of kb.papers) {
    if (paper.review_status === "unreviewed") {
      assert.equal(paper.reviewed_by ?? null, null);
      assert.equal(paper.reviewed_at ?? null, null);
    }
  }
  const source = validateOkfSource();
  assert.equal(source.ok, true);
  assert.equal(source.errors.some((error) => /REVIEW_METADATA|CONCEPT_REVIEW_RECORD/.test(error.code)), false);
});

test("canonical TEMPLATE and all nine real bundles follow okf-dsr-v1", () => {
  const template = validateOkfTemplate();
  assert.equal(template.ok, true, template.errors.map((error) => `${error.code}: ${error.message}`).join("\n"));
  assert.deepEqual(template.counts, {
    papers: 1,
    concepts: 7,
    evidence: 1,
    relations: 6,
    graph_nodes: 7,
    graph_edges: 6,
    recommended_paths: 1
  });

  const source = validateOkfSource();
  assert.equal(source.ok, true, source.errors.map((error) => `${error.code}: ${error.message}`).join("\n"));
  assert.equal(source.counts.papers, 9);
  const kb = parseOkfLibrary();
  assert.equal(kb.papers.length, 9);
  assert.ok(kb.papers.every((paper) => paper.schema_version === "okf-dsr-v1"));
  assert.ok(kb.concepts.every((concept) => okfConceptTypes.includes(concept.type)));
});

test("strict source validation rejects noncanonical concept types but permits context metadata", () => {
  const forbiddenTypes = [
    { type: "Objective", existing: "Problem" },
    { type: "Requirement", existing: "Design Requirement" },
    { type: "KernelTheory", existing: "Problem" },
    { type: "Limitation", existing: "Problem" }
  ];

  for (const scenario of forbiddenTypes) {
    const tempRoot = path.join(mkdtempSync(path.join(tmpdir(), "okf-type-validator-")), "okf");
    try {
      cpSync(fixtureRoot, tempRoot, { recursive: true });
      const target = path.join(tempRoot, "papers", "fixture-paper", "dsr.md");
      const source = readFileSync(target, "utf8");
      writeFileSync(target, source.replace(`"type":"${scenario.existing}"`, `"type":"${scenario.type}"`), "utf8");
      const result = validateOkfSource(tempRoot);
      assert.equal(result.ok, false, scenario.type);
      assert.ok(result.errors.some((error) => error.code === "CONCEPT_TYPE_NONCANONICAL"), scenario.type);
    } finally {
      rmSync(path.dirname(tempRoot), { recursive: true, force: true });
    }
  }

  const metadataRoot = path.join(mkdtempSync(path.join(tmpdir(), "okf-context-validator-")), "okf");
  try {
    cpSync(fixtureRoot, metadataRoot, { recursive: true });
    const target = path.join(metadataRoot, "papers", "fixture-paper", "index.md");
    const source = readFileSync(target, "utf8")
      .replace("research_questions: []", 'research_questions: ["Placeholder research question"]')
      .replace("theoretical_foundations: []", 'theoretical_foundations: ["Placeholder kernel theory"]')
      .replace("limitations: []", 'limitations: ["Placeholder limitation"]');
    writeFileSync(target, source, "utf8");
    const result = validateOkfSource(metadataRoot);
    assert.equal(result.ok, true, result.errors.map((error) => error.code).join(", "));
  } finally {
    rmSync(path.dirname(metadataRoot), { recursive: true, force: true });
  }
});

test("strict source validation rejects missing files, dangling graph nodes, and alias type redefinitions", () => {
  const scenarios: Array<{
    expectedCode: string;
    mutate: (root: string) => void;
  }> = [
    {
      expectedCode: "REQUIRED_FILE_MISSING",
      mutate: (root) => rmSync(path.join(root, "papers", "fixture-paper", "README.md"))
    },
    {
      expectedCode: "GRAPH_NODE_UNKNOWN",
      mutate: (root) => {
        const target = path.join(root, "papers", "fixture-paper", "graph.json");
        const source = readFileSync(target, "utf8");
        writeFileSync(target, source.replace("FIXTURE_2026:prob_001", "FIXTURE_2026:unknown_node"), "utf8");
      }
    },
    {
      expectedCode: "ALIAS_KEYS",
      mutate: (root) => {
        const target = path.join(root, "papers", "fixture-paper", "aliases.yaml");
        const source = readFileSync(target, "utf8");
        writeFileSync(target, source.replace('"terms":', '"type":"Requirement","terms":'), "utf8");
      }
    },
    {
      expectedCode: "CONCEPT_EVIDENCE_UNKNOWN",
      mutate: (root) => {
        const target = path.join(root, "papers", "fixture-paper", "dsr.md");
        const source = readFileSync(target, "utf8");
        writeFileSync(target, source.replace("FIXTURE_2026:ev_001", "FIXTURE_2026:ev_missing"), "utf8");
      }
    },
    {
      expectedCode: "REVIEW_METADATA_MISSING",
      mutate: (root) => {
        const target = path.join(root, "papers", "fixture-paper", "index.md");
        const source = readFileSync(target, "utf8");
        writeFileSync(target, source.replace('review_status: "unreviewed"', 'review_status: "internally_reviewed"'), "utf8");
      }
    }
  ];

  for (const scenario of scenarios) {
    const tempRoot = path.join(mkdtempSync(path.join(tmpdir(), "okf-reference-validator-")), "okf");
    try {
      cpSync(fixtureRoot, tempRoot, { recursive: true });
      scenario.mutate(tempRoot);
      const result = validateOkfSource(tempRoot);
      assert.equal(result.ok, false, scenario.expectedCode);
      assert.ok(result.errors.some((error) => error.code === scenario.expectedCode), scenario.expectedCode);
    } finally {
      rmSync(path.dirname(tempRoot), { recursive: true, force: true });
    }
  }
});

test("Workbench cards and overview expose rich canonical metadata and safe review labels", async () => {
  const kb = parseOkfLibrary();
  const papers = await getWorkbenchPapers({ knowledgeBase: kb });
  assert.equal(papers.length, 9);
  for (const paper of papers) {
    assert.equal(paper.review_status, "unreviewed");
    assert.equal(paper.schema_version, "okf-dsr-v1");
    assert.ok("venue" in paper && "doi" in paper && "source_url" in paper);
    assert.ok("research_problem" in paper && "research_objective" in paper);
    assert.ok("evaluation_method" in paper && "key_contributions" in paper);
    assert.ok(paper.counts && paper.counts.concepts > 0);
    assert.ok(paper.counts && paper.counts.evidence >= 0 && paper.counts.relations > 0);
  }

  const ui = [
    readFileSync(path.join(process.cwd(), "components", "workbench", "WorkbenchLanding.tsx"), "utf8"),
    readFileSync(path.join(process.cwd(), "components", "workbench", "WorkbenchPaper.tsx"), "utf8")
  ].join("\n");
  assert.equal(/\bREVIEWED\b/.test(ui), false);
  assert.ok(ui.includes("Needs review"));
  assert.ok(ui.includes("Bibliographic metadata"));
  assert.ok(ui.includes("Evaluation and contribution"));
  assert.ok(ui.includes("Not recorded"));
});

test("Workbench preserves canonical full titles and validates Git-oriented correction targets", async () => {
  const kb = parseOkfLibrary();
  const papers = await getWorkbenchPapers({ knowledgeBase: kb });
  for (const paper of papers) {
    assert.equal(paper.title, kb.papers.find((candidate) => candidate.paper_id === paper.paper_id)?.title);
    const bundle = await getWorkbenchPaper(paper.paper_id, { knowledgeBase: kb });
    assert.ok(bundle);
    assert.ok(workbenchChangeTargetExists(bundle, "paper", paper.paper_id));
    assert.ok(workbenchChangeTargetExists(bundle, "graph", paper.slug ?? paper.paper_id));
    assert.equal(workbenchCanonicalTargetPath(bundle, "paper"), paper.canonical_paths?.index);
    assert.equal(workbenchCanonicalTargetPath(bundle, "graph"), paper.canonical_paths?.graph);
    assert.equal(workbenchChangeTargetExists(bundle, "concept", "missing-concept"), false);
  }
  assert.ok((workbenchChangeFields.paper as readonly string[]).includes("blockchain_dlt_role"));
  assert.equal((workbenchChangeFields.paper as readonly string[]).includes("dlt_role"), false);


});

test("runtime evidence indexing never writes a paper id into the concept foreign key", () => {
  const kb = parseOkfLibrary();
  const conceptIds = new Set(kb.concepts.map((concept) => concept.concept_id));
  const projected = kb.evidence_items.map((item) => selectIndexedEvidenceConceptId(item, conceptIds));
  assert.equal(projected.filter((conceptId) => conceptId === null).length, 27);
  assert.ok(projected.every((conceptId) => conceptId === null || conceptIds.has(conceptId)));
});
test("Workbench DSR matrix uses stored paths only and separates unmapped concepts", async () => {
  const kb = parseOkfLibrary();
  const relationIds = new Set(kb.relations.map((relation) => relation.relation_id));
  for (const paper of kb.papers) {
    const bundle = await getWorkbenchPaper(paper.paper_id, { knowledgeBase: kb });
    assert.ok(bundle?.dsrMatrix, paper.paper_id);
    const matrix = bundle.dsrMatrix;
    const conceptTypeById = new Map(kb.concepts.map((concept) => [concept.concept_id, concept.type]));
    assert.deepEqual(matrix.columns.map((column) => column.key), [...okfConceptTypes]);
    if (matrix.source === "stored_relations_fallback") {
      assert.ok(matrix.rows.length <= 12, paper.paper_id + " fallback matrix exceeds representative row cap");
      assert.equal(matrix.stats.selected_row_limit, 12);
      assert.equal(matrix.stats.selection_strategy, "coverage_representative");
    } else if (matrix.source === "graph_json_recommended_paths") {
      assert.equal(matrix.stats.selection_strategy, "recommended_paths");
      assert.equal(matrix.stats.omitted_candidate_path_count, 0, paper.paper_id + " recommended paths should be preserved");
    }
    assert.ok(matrix.rows.length > 0, paper.paper_id + " has no coherent matrix rows");
    const primaryIds = new Set(matrix.rows.flatMap((row) => row.concept_ids));
    assert.ok(matrix.additional_concepts.every((concept) => !primaryIds.has(concept.concept_id)));
    for (const row of matrix.rows) {
      assert.ok(row.segments.length > 0);
      for (const segment of row.segments) {
        assert.ok(segment.relation_ids.length > 0, segment.segment_id);
        assert.ok(segment.relation_ids.every((id) => relationIds.has(id)), idList(segment.relation_ids));
        const sourceType = conceptTypeById.get(segment.source_concept_id);
        const targetType = conceptTypeById.get(segment.target_concept_id);
        assert.ok(sourceType && targetType);
        assert.ok(segment.predicates.every((predicate) => isCanonicalDsrTransition(sourceType, targetType, predicate)), segment.segment_id);
      }
    }
  }
});

test("Workbench matrix excludes invalid predicates and non-adjacent stored transitions", () => {
  const concepts = [
    { id: "p", type: "Problem", title: "Problem" },
    { id: "dr", type: "Design Requirement", title: "Requirement" },
    { id: "dp", type: "Design Principle", title: "Principle" },
    { id: "df", type: "Design Feature", title: "Feature" }
  ];
  const matrix = buildWorkbenchDsrMatrix({
    paper_id: "MATRIX_CONTRACT",
    concepts,
    relations: [
      { id: "valid-rp", source: "dr", target: "dp", predicate: "addressed_by" },
      { id: "valid-pf", source: "dp", target: "df", predicate: "instantiates" },
      { id: "bad-predicate", source: "dr", target: "dp", predicate: "supports" },
      { id: "skip-layer", source: "dr", target: "df", predicate: "addressed_by" },
      { id: "backward", source: "df", target: "dp", predicate: "instantiates" }
    ],
    graph: {
      nodes: concepts.map((concept) => ({ id: concept.id, type: concept.type })),
      edges: [
        { id: "graph-bad-predicate", source: "dp", target: "df", predicate: "supports" },
        { id: "graph-skip-layer", source: "p", target: "dp", predicate: "motivates" }
      ],
      recommended_paths: []
    }
  });

  assert.equal(matrix.source, "stored_relations_fallback");
  assert.deepEqual(matrix.rows.map((row) => row.concept_ids), [["dr", "dp", "df"]]);
  assert.deepEqual(matrix.rows.flatMap((row) => row.segments.flatMap((segment) => segment.relation_ids)).sort(), ["valid-pf", "valid-rp"]);
  assert.equal(matrix.stats.stored_segment_count, 2);
  assert.ok(matrix.warnings.some((warning) => warning.includes("bad-predicate") && warning.includes("allow only")));
  assert.ok(matrix.warnings.some((warning) => warning.includes("skip-layer") && warning.includes("adjacent canonical")));
  assert.ok(matrix.warnings.some((warning) => warning.includes("backward") && warning.includes("adjacent canonical")));
  assert.ok(matrix.warnings.some((warning) => warning.includes("graph-bad-predicate") && warning.includes("allow only")));
  assert.ok(matrix.warnings.some((warning) => warning.includes("graph-skip-layer") && warning.includes("adjacent canonical")));
});

test("Workbench fallback matrix selects representative paths for stored concept and edge coverage", () => {
  const requirements = Array.from({ length: 5 }, (_, index) => ({
    id: `dr-${index + 1}`,
    type: "Design Requirement",
    title: `Requirement ${index + 1}`
  }));
  const features = Array.from({ length: 5 }, (_, index) => ({
    id: `df-${index + 1}`,
    type: "Design Feature",
    title: `Feature ${index + 1}`
  }));
  const principle = { id: "dp", type: "Design Principle", title: "Shared principle" };
  const matrix = buildWorkbenchDsrMatrix({
    paper_id: "MATRIX_COVERAGE",
    concepts: [...requirements, principle, ...features],
    relations: [
      ...requirements.map((requirement, index) => ({
        id: `rel-rp-${index + 1}`,
        source: requirement.id,
        target: principle.id,
        predicate: "addressed_by"
      })),
      ...features.map((feature, index) => ({
        id: `rel-pf-${index + 1}`,
        source: principle.id,
        target: feature.id,
        predicate: "instantiates"
      }))
    ],
    options: { maxFallbackRows: 5 }
  });

  assert.equal(matrix.source, "stored_relations_fallback");
  assert.equal(matrix.stats.candidate_path_count, 25);
  assert.equal(matrix.stats.primary_row_count, 5);
  assert.equal(matrix.stats.primary_concept_count, 11);
  assert.equal(matrix.stats.omitted_candidate_path_count, 20);
  assert.equal(matrix.stats.selected_row_limit, 5);
  assert.equal(matrix.stats.selection_strategy, "coverage_representative");
  assert.equal(matrix.stats.rows_truncated, true);
  assert.ok(matrix.warnings.some((warning) => warning.includes("representative path") && warning.includes("20 additional")));
});
test("flow validation passes all nine canonical bundles without structural errors", async () => {
  const report = await validateOkfFlows();
  assert.equal(report.summary.papers, 9);
  assert.equal(report.summary.failed, 0);
  assert.equal(report.summary.errors, 0);
  assert.ok(report.papers.every((paper) => paper.issues.every((issue) => issue.severity !== "error")));
});

test("corrections default UI is Git-oriented and keeps indexed fields read-only", () => {
  const source = readFileSync(path.join(process.cwd(), "components", "workbench", "WorkbenchPaper.tsx"), "utf8");
  const form = readFileSync(path.join(process.cwd(), "components", "workbench", "SuggestionForm.tsx"), "utf8");
  assert.ok(source.includes("Issue and change requests"));
  assert.ok(source.includes("Advanced indexed-field audit"));
  assert.ok(source.includes("read-only fields"));
  assert.ok(form.includes("Accepted reports produce a Git change"));
  assert.ok(form.includes("never overwrites facts in Supabase"));
  assert.equal(source.includes("editable fields"), false);
  const route = readFileSync(path.join(process.cwd(), "app", "api", "workbench", "change-request", "route.ts"), "utf8");
  assert.equal(route.includes("body.target_okf_path"), false);
  assert.ok(route.includes("workbenchChangeTargetExists"));
  assert.ok(route.includes("!reason"));
});

function idList(ids: string[]) {
  return ids.join(", ");
}
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



test("runtime OKF loader prefers the service role and never uses cookie or browser-session auth", async () => {
  const env: Record<string, string | undefined> = {
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_test",
    SUPABASE_SERVICE_ROLE_KEY: "sb_secret_test"
  };
  const credential = resolveSupabaseServerCredential(env);
  assert.equal(credential.key_type, "service_role");
  assert.equal(credential.service_role_key, "sb_secret_test");
  assert.equal(serviceRoleRestHeaders("sb_secret_test").Authorization, undefined);
  assert.equal(serviceRoleRestHeaders("header.payload.signature").Authorization, "Bearer header.payload.signature");

  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const fetchImpl = mockOkfRestFetch(calls);
  const kb = await loadOkfKnowledgeBaseFromSupabase({ env, fetchImpl });
  assert.equal(kb?.papers.length, 1);
  assert.equal(kb?.papers[0].last_indexed_at, "2026-07-14T10:00:00.000Z");
  assert.equal(kb?.papers[0].extraction_status, "indexed_from_canonical_okf");
  assert.equal(kb?.papers[0].review_status, "unreviewed");
  assert.deepEqual(kb?.evidence_items[0].supports, ["TEST_PAPER"]);
  assert.equal(kb?.evidence_items[0].concept_id, undefined);
  assert.equal(getOkfKnowledgeBaseLoadMetadata().key_type, "service_role");
  assert.equal(getOkfKnowledgeBaseLoadMetadata().db_loaded_from, "supabase");
  assert.equal(calls.length, 4);
  for (const call of calls) {
    const headers = new Headers(call.init?.headers);
    assert.equal(headers.get("apikey"), "sb_secret_test");
    assert.equal(headers.get("authorization"), null);
    assert.equal(headers.get("cookie"), null);
    assert.equal(call.init?.credentials, "omit");
    assert.equal(call.url.includes("sb_secret_test"), false);
    assert.equal(call.url.includes("sb_publishable_test"), false);
  }
});

test("Supabase JS service-role client sends modern sb_secret keys only as apikey", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const client = getSupabaseServiceRoleClient({
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "sb_secret_modern_test"
  }, captureSupabaseClientFetch(calls));

  const { error } = await client.from("okf_papers").select("paper_id").limit(1);
  assert.equal(error, null);
  assert.equal(calls.length, 1);
  const headers = new Headers(calls[0].init?.headers);
  assert.equal(headers.get("apikey"), "sb_secret_modern_test");
  assert.equal(headers.get("authorization"), null);
  assert.equal(calls[0].init?.credentials, "omit");
});

test("Supabase JS service-role client retains Authorization for legacy JWT keys", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const legacyJwt = "header.payload.signature";
  const client = getSupabaseServiceRoleClient({
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: legacyJwt
  }, captureSupabaseClientFetch(calls));

  const { error } = await client.from("okf_papers").select("paper_id").limit(1);
  assert.equal(error, null);
  assert.equal(calls.length, 1);
  const headers = new Headers(calls[0].init?.headers);
  assert.equal(headers.get("apikey"), legacyJwt);
  assert.equal(headers.get("authorization"), `Bearer ${legacyJwt}`);
  assert.equal(calls[0].init?.credentials, "omit");
});

function captureSupabaseClientFetch(calls: Array<{ url: string; init?: RequestInit }>): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    return new Response("[]", {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }) as typeof fetch;
}
test("health DB status reports service_role and Supabase row counts", async () => {
  const env: Record<string, string | undefined> = {
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_test",
    SUPABASE_SERVICE_ROLE_KEY: "sb_secret_test"
  };
  const status = await getOkfDatabaseHealthStatus({ env, fetchImpl: mockOkfRestFetch([]) });
  assert.equal(status.ok, true);
  assert.equal(status.connected, true);
  assert.equal(status.key_type, "service_role");
  assert.equal(status.db_loaded_from, "supabase");
  assert.equal(status.row_count, 1);
  assert.equal(status.papers, 1);
});

test("anon-only OKF health is explicit and never attempts a server library read", async () => {
  const env: Record<string, string | undefined> = {
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "sb_publishable_test"
  };
  let calls = 0;
  const fetchImpl = (async () => {
    calls += 1;
    throw new Error("Anon key must not be used for server OKF reads.");
  }) as typeof fetch;
  const status = await getOkfDatabaseHealthStatus({ env, fetchImpl });
  assert.equal(calls, 0);
  assert.equal(status.ok, false);
  assert.equal(status.key_type, "anon");
  assert.equal(status.db_loaded_from, "local_okf_fallback");
  assert.equal(status.row_count, 0);
  assert.equal(status.db_error_code, "SERVICE_ROLE_REQUIRED");
  assert.match(status.message ?? "", /anon|RLS|service role/i);
});

test("service-role PGRST303 keeps the clock-skew diagnostic and key classification", async () => {
  const env: Record<string, string | undefined> = {
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "header.payload.signature"
  };
  const previousWarn = console.warn;
  console.warn = () => undefined;
  try {
    const fetchImpl = (async () => new Response(JSON.stringify({
      code: "PGRST303",
      message: "JWT issued at future"
    }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    })) as typeof fetch;
    const status = await getOkfDatabaseHealthStatus({ env, fetchImpl });
    assert.equal(status.ok, false);
    assert.equal(status.key_type, "service_role");
    assert.equal(status.db_error_code, "PGRST303");
    assert.match(status.message ?? "", /local system clock may be out of sync/i);
  } finally {
    console.warn = previousWarn;
  }
});

function mockOkfRestFetch(calls: Array<{ url: string; init?: RequestInit }>): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, init });
    const table = new URL(url).pathname.split("/").at(-1);
    const rows = table === "okf_papers"
      ? [{ paper_id: "TEST_PAPER", title: "Test paper", review_status: "author_verified", author_check_status: "requested", reviewed_by: "Reviewer", reviewed_at: "2026-07-14T09:00:00.000Z", last_indexed_at: "2026-07-14T10:00:00.000Z" }]
      : table === "okf_evidence_items"
        ? [{ evidence_id: "TEST_EVIDENCE", paper_id: "TEST_PAPER", concept_id: null, supports: ["TEST_PAPER"], paraphrase: "Paper-level summary", quote_or_summary: "Paper-level summary", evidence_type: "summary", confidence: "medium" }]
        : [];
    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  }) as typeof fetch;
}

test("browser Supabase client remains anon-only", () => {
  const source = readFileSync(path.join(process.cwd(), "lib", "workbench", "supabase-browser.ts"), "utf8");
  assert.ok(source.includes("NEXT_PUBLIC_SUPABASE_ANON_KEY"));
  assert.equal(source.includes("SUPABASE_SERVICE_ROLE_KEY"), false);
  assert.equal(source.includes("getSupabaseServiceRoleClient"), false);
});

test("service-role Supabase access has a server-only boundary and no client import path", () => {
  const serverSource = readFileSync(path.join(process.cwd(), "lib", "supabase", "server.ts"), "utf8");
  assert.ok(serverSource.includes('typeof window !== "undefined"'));
  assert.ok(serverSource.includes("The Supabase service-role helper is server-only."));

  const clientFiles = ["app", "components", "lib"]
    .flatMap((root) => sourceFiles(path.join(process.cwd(), root)))
    .filter((file) => /^\s*["']use client["'];/m.test(readFileSync(file, "utf8")));
  assert.ok(clientFiles.length > 0);

  const forbiddenClientMarkers = [
    "SUPABASE_SERVICE_ROLE_KEY",
    "getSupabaseServiceRoleClient",
    "resolveSupabaseServerCredential",
    "serviceRoleRestHeaders",
    "supabase/server",
    "supabase-admin"
  ];
  for (const file of clientFiles) {
    const source = readFileSync(file, "utf8");
    for (const marker of forbiddenClientMarkers) {
      assert.equal(source.includes(marker), false, `${path.relative(process.cwd(), file)} exposes server-only marker ${marker}`);
    }
  }
});

function sourceFiles(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(root, entry.name);
    if (entry.isDirectory()) return sourceFiles(target);
    return entry.isFile() && /\.[cm]?[jt]sx?$/.test(entry.name) ? [target] : [];
  });
}

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
    assert.equal(new RegExp(`(?:from\\(|table:\\s*)["']${table}["']`).test(indexer), false);
    assert.equal(new RegExp(`\\.from\\(["']${table}["']\\)`).test(correctionsRoute), false);
  }

  for (const table of ["okf_papers", "okf_concepts", "okf_evidence_items", "okf_relations", "okf_user_corrections"]) {
    assert.ok(migration.includes(table) || indexer.includes(table) || correctionsRoute.includes(table));
  }
});


test("paper-specific element query returns only the named paper and both requested types", async () => {
  const kb = parseOkfLibrary();
  const response = await answerOkfChat("Show me the design requirements and design principles from Blockchain for the IoT.", kb);
  assert.equal(response.intent, "PAPER_ELEMENT_QUERY");
  assert.ok(response.retrieved_concepts.length > 0);
  assert.ok(response.retrieved_concepts.every((concept) => concept.paper_id === "BLOCKCHAIN_IOT_SDPS_2019"));
  assert.equal(response.retrieved_concepts.filter((concept) => concept.type === "Design Requirement").length, 4);
  assert.equal(response.retrieved_concepts.filter((concept) => concept.type === "Design Principle").length, 4);
});

test("flow query is classified and uses stored relations without requirement-to-requirement chaining", async () => {
  const kb = parseOkfLibrary();
  assert.equal(routeOkfQuery("Build a Requirement ? Principle ? Feature flow for tamper-resistant sensor data protection."), "DSR_FLOW_QUERY");
  const response = await answerOkfChat("Build a Requirement ? Principle ? Feature flow for tamper-resistant sensor data protection.", kb);
  assert.equal(response.intent, "DSR_FLOW_QUERY");
  assert.equal(response.flow_graph.mode, "stored_paper_flow");
  assert.equal(response.answer_plan?.query_plan.requested_output_shape, "flow_graph");
  assert.equal(response.answer_plan?.query_plan.requires_graph, true);
  const byId = new Map(response.flow.nodes.map((node) => [node.id, node]));
  assert.ok(response.flow.edges.length > 0);
  assert.ok(response.flow_graph.edges.every((edge) => edge.provenance === "stored" && edge.relation_id));
  assert.equal(response.flow.edges.some((edge) => byId.get(edge.source)?.type === "Design Requirement" && byId.get(edge.target)?.type === "Design Requirement"), false);
  for (const layer of ["Requirement", "Principle", "Feature", "Artifact"]) assert.ok(response.flow_graph.nodes.some((node) => node.layer === layer), layer);
});

test("design recommendation graph contains only canonical move projection nodes", async () => {
  const kb = parseOkfLibrary();
  const response = await answerOkfChat("I need a marketplace system for manipulated product descriptions.", kb);
  assert.equal(response.intent, "DESIGN_REUSE_QUERY");
  const moves = response.answer_plan?.design_moves ?? [];
  const labels = new Set(moves.flatMap((move) => [move.reused_requirement, move.reused_principle, move.candidate_feature, move.artifact_pattern]));
  assert.ok(moves.length >= 5 && moves.length <= 7);
  assert.equal(response.flow.nodes.some((node) => node.layer === "Problem"), false);
  assert.ok(response.flow.nodes.every((node) => labels.has(node.label)));
});

test("source paper metadata includes meaningful reason and counts", async () => {
  const kb = parseOkfLibrary();
  const response = await answerOkfChat("Show me the design requirements and design principles from Blockchain for the IoT.", kb);
  assert.equal(response.source_papers.length, 1);
  assert.equal(response.source_papers[0].paper_id, "BLOCKCHAIN_IOT_SDPS_2019");
  assert.equal(response.source_papers[0].reason, "Named paper hard filter.");
  assert.equal(response.source_papers[0].requirements_count, 4);
  assert.equal(response.source_papers[0].principles_count, 4);
  assert.ok(response.source_papers[0].evidence_count > 0);
});


test("feature element query does not mention zero requirements or principles", async () => {
  const kb = parseOkfLibrary();
  const response = await answerOkfChat("Show me the design features from Blockchain for the IoT.", kb);
  assert.equal(response.intent, "PAPER_ELEMENT_QUERY");
  assert.equal(response.retrieved_concepts.filter((concept) => concept.type === "Design Feature").length, 9);
  assert.match(response.answer, /9 design features/i);
  assert.equal(/0 design requirement|0 design principle/i.test(response.answer), false);
});

test("flow query answer summarizes branches instead of dumping all edges", async () => {
  const kb = parseOkfLibrary();
  const response = await answerOkfChat("Build a Requirement ? Principle ? Feature flow for tamper-resistant sensor data protection.", kb);
  assert.equal(response.intent, "DSR_FLOW_QUERY");
  assert.match(response.answer, /The layered graph is in the Flow tab/i);
  assert.match(response.answer, /Short branch summary/i);
  assert.equal(/Requirement -> Principle -> Feature rows/i.test(response.answer), false);
  assert.ok(response.flow_graph.edges.length > 0);
  assert.ok(response.answer.split("\n").length < 20);
  assert.ok(response.flow_graph.edges.every((edge) => !response.answer.includes(edge.id)));
});

test("paper-specific flow query uses only Blockchain IoT stored relations", async () => {
  const kb = parseOkfLibrary();
  const response = await answerOkfChat("Show the Requirement -> Principle -> Feature flow from Blockchain for the IoT.", kb);
  assert.equal(response.intent, "DSR_FLOW_QUERY");
  assert.deepEqual([...new Set(response.source_papers.map((paper) => paper.paper_id))], ["BLOCKCHAIN_IOT_SDPS_2019"]);
  assert.equal(response.flow_graph.mode, "stored_paper_flow");
  assert.equal(response.flow_graph.stored_flow_source, "graph_json");
  assert.ok(response.flow_graph.edges.length > 0);
  assert.ok(response.flow_graph.edges.every((edge) => edge.provenance === "stored"));
  assert.equal(response.flow_graph.edges.some((edge) => edge.provenance === "query_generated"), false);
  const graphNodeIds = new Set(response.flow_graph.nodes.map((node) => node.id));
  assert.ok((response.flow_rows ?? []).every((row) => row.concept_ids.every((id) => graphNodeIds.has(id))));
  assert.ok(response.retrieved_concepts.every((concept) => graphNodeIds.has(concept.concept_id)));
  assert.equal(response.answer.includes("Sensor data collection"), true);
  assert.equal(response.answer.includes("Blockchain transaction and data transmission"), false);
});
test("stored paper flow reports OKF-relations fallback when graph metadata is absent", async () => {
  const kb = parseOkfLibrary(fixtureRoot);
  const response = await answerOkfChat("Show the Requirement -> Principle -> Feature flow from Fixture Paper.", kb);
  assert.equal(response.intent, "DSR_FLOW_QUERY");
  assert.equal(response.flow_graph.mode, "stored_paper_flow");
  assert.equal(response.flow_graph.stored_flow_source, "okf_relations_fallback");
  assert.ok(response.flow_graph.edges.length > 0);
  assert.ok(response.flow_graph.edges.every((edge) => edge.provenance === "stored" && edge.relation_id));
});

test("chatbot stored flow exactly matches the shared recommended-path projection", async () => {
  const kb = parseOkfLibrary();
  const response = await answerOkfChat("Show the Requirement -> Principle -> Feature flow from Blockchain for the IoT.", kb);
  const flowPredicates = new Set(["motivates", "requires", "addressed_by", "satisfies", "instantiates", "instantiated_by", "implements", "evaluated_by", "supported_by", "supports", "derived_from", "contributes_to"]);
  const paperConcepts = kb.concepts.filter((concept) => concept.paper_id === "BLOCKCHAIN_IOT_SDPS_2019");
  const paths = loadRecommendedStoredFlowPaths("BLOCKCHAIN_IOT_SDPS_2019");
  const eligibleRelations = kb.relations
    .filter((relation) => relation.relation_scope !== "query_generated")
    .filter((relation) => flowPredicates.has(relation.predicate))
    .filter((relation) => paperConcepts.some((concept) => concept.concept_id === relation.source_concept_id) && paperConcepts.some((concept) => concept.concept_id === relation.target_concept_id));
  const expected = projectStoredMainFlow({
    nodes: paperConcepts.map((concept) => ({ id: concept.concept_id, type: concept.type })),
    relations: eligibleRelations.map((relation) => ({ id: relation.relation_id, source: relation.source_concept_id, target: relation.target_concept_id })),
    recommendedPaths: paths
  });
  const actualNodeIds = response.flow_graph.nodes.map((node) => node.concept_id).filter((id): id is string => Boolean(id)).sort();
  const actualRelationIds = response.flow_graph.edges.map((edge) => edge.relation_id).filter((id): id is string => Boolean(id)).sort();
  assert.equal(expected.source, "recommended_paths");
  assert.deepEqual(actualNodeIds, [...expected.nodeIds].sort());
  assert.deepEqual(actualRelationIds, [...expected.relationIds].sort());
  assert.ok(response.flow_graph.nodes.every((node) => node.provenance === "stored"));
  assert.ok(response.flow_graph.edges.every((edge) => edge.provenance === "stored" && edge.relation_id));
  assert.ok(response.flow_graph.edges.every((edge) => kb.relations.some((relation) => relation.relation_id === edge.relation_id && relation.source_concept_id === edge.source && relation.target_concept_id === edge.target)));
});

test("Supabase-backed OKF concepts resolve the same statically scoped graph metadata by paper id", async () => {
  const kb = parseOkfLibrary();
  const query = "Show the Requirement -> Principle -> Feature flow from Blockchain for the IoT.";
  const local = await answerOkfChat(query, kb);
  const supabaseBacked = {
    ...kb,
    papers: kb.papers.map((paper) => ({ ...paper, source_file: "supabase:okf_papers" })),
    concepts: kb.concepts.map((concept) => ({ ...concept, source_file: "supabase:okf_concepts" })),
    evidence_items: kb.evidence_items.map((item) => ({ ...item, source_file: "supabase:okf_evidence_items" })),
    relations: kb.relations.map((relation) => ({ ...relation, source_file: "supabase:okf_relations" }))
  };
  const remote = await answerOkfChat(query, supabaseBacked);
  assert.deepEqual(remote.flow_graph.nodes.map((node) => node.id), local.flow_graph.nodes.map((node) => node.id));
  assert.deepEqual(remote.flow_graph.edges.map((edge) => edge.id), local.flow_graph.edges.map((edge) => edge.id));
});

test("Workbench diagram metadata and chatbot stored metadata use the shared projection adapter", () => {
  const projection = projectStoredMainFlow({
    nodes: [
      { id: "dr", type: "Requirement", include: isStoredMainElementType("Requirement") },
      { id: "dp", type: "Design Principle", include: isStoredMainElementType("Design Principle") },
      { id: "df", type: "Design Feature", include: isStoredMainElementType("Design Feature") },
      { id: "artifact", type: "Artifact", include: isStoredMainElementType("Artifact") }
    ],
    relations: [
      { id: "main-1", source: "dr", target: "dp", diagramInclude: true, diagramView: "Main" },
      { id: "main-2", source: "dp", target: "df", diagramInclude: true },
      { id: "extended", source: "df", target: "artifact", diagramInclude: true, diagramView: "Extended" },
      { id: "hidden", source: "dr", target: "df", diagramInclude: false, diagramView: "Hidden" }
    ]
  });
  assert.equal(projection.source, "diagram_main");
  assert.deepEqual(projection.nodeIds, ["dr", "dp", "df"]);
  assert.deepEqual(projection.relationIds, ["main-1", "main-2"]);
  const fallback = projectStoredMainFlow({
    nodes: [
      { id: "dr", include: true },
      { id: "dp", include: true },
      { id: "df", include: true }
    ],
    relations: [{ id: "stored-1", source: "dr", target: "dp" }, { id: "stored-2", source: "dp", target: "df" }]
  });
  assert.equal(fallback.source, "stored_relations");
  assert.deepEqual(fallback.relationIds, ["stored-1", "stored-2"]);
  const adapterSource = readFileSync(path.join(process.cwd(), "lib", "okf", "workbench-adapter.ts"), "utf8");
  const workbenchSource = readFileSync(path.join(process.cwd(), "components", "workbench", "WorkbenchFlow.tsx"), "utf8");
  assert.ok(adapterSource.includes("projectRecommendedFlow("));
  assert.ok(adapterSource.includes("projectFullRelations("));
  assert.ok(adapterSource.includes("projectSourceView("));
  assert.ok(adapterSource.includes("loadStoredPaperFlowMetadata("));
  assert.ok(workbenchSource.includes("flowGraph"));
  assert.equal(workbenchSource.includes("projectStoredMainFlow"), false);
});

test("all nine papers have deterministic graph-metadata stored projections with no invented edges", () => {
  const kb = parseOkfLibrary();
  const predicates = [
    "motivates", "requires", "addressed_by", "satisfies", "instantiates", "instantiated_by",
    "implements", "evaluated_by", "supported_by", "supports", "derived_from", "contributes_to"
  ] as const;
  const metadataByPaper = kb.papers.map((paper) => [paper.paper_id, loadStoredPaperFlowMetadata(paper.paper_id)] as const);
  assert.equal(metadataByPaper.length, 9);
  assert.ok(metadataByPaper.every(([, metadata]) => metadata && metadata.graphNodes.length > 0 && metadata.graphEdges.length > 0));
  let recommendedCount = 0;
  let fallbackCount = 0;

  for (const [paperId, metadata] of metadataByPaper) {
    assert.ok(metadata);
    const paperConcepts = kb.concepts.filter((concept) => concept.paper_id === paperId);
    const projection = projectStoredOkfFlow(paperConcepts, kb, predicates, true);
    const source = projection.sources[paperId];
    const scoped = (id: string) => id.includes(":") ? id : `${paperId}:${id}`;
    const graphEdges = new Set(metadata.graphEdges.map((edge) => [scoped(edge.source), scoped(edge.target), edge.predicate ?? ""].join("\u0000")));
    assert.ok(projection.concepts.length > 0, `${paperId} nodes`);
    assert.ok(projection.relations.length > 0, `${paperId} edges`);
    assert.ok(projection.relations.every((relation) => graphEdges.has([relation.source_concept_id, relation.target_concept_id, relation.predicate].join("\u0000"))), `${paperId} graph edge parity`);
    assert.ok(projection.relations.every((relation) => kb.relations.some((stored) => stored.relation_id === relation.relation_id)), `${paperId} stored edges only`);

    if (metadata.recommendedPaths.length) {
      recommendedCount += 1;
      assert.equal(source, "recommended_paths", paperId);
    } else {
      fallbackCount += 1;
      assert.equal(source, "graph_main_layers", paperId);
      assert.ok(projection.concepts.every((concept) => isStoredMainElementType(concept.type)), `${paperId} main layers only`);
      assert.ok(projection.warnings.some((warning) => warning.includes("do not carry Workbench diagram flags")), paperId);
    }
  }
  assert.equal(recommendedCount, 9);
  assert.equal(fallbackCount, 0);
});
const productIdentityQuery = "I want to design a cross-marketplace product identity and review-continuity protocol where the same exact product variant can be listed on multiple marketplaces, sellers can relist products, buyers can leave verified-purchase reviews, and competitors should not expose raw commercial data. Which reusable DSR design requirements, design principles, design features, and artifact patterns should I reuse from the OKF library? Build a concise Requirement -> Principle -> Feature -> Artifact flow, explain which papers support each part, show evidence, and clearly mark any product-identity-specific suggestions as query-generated.";
const fragmentedProductFlowQuery = "Build a Requirement -> Principle -> Feature flow for an application that solves fragmented product data across manufacturers, sellers, and marketplaces. Reuse relevant OKF principles and features for product identity, data integrity, verification, and governance.";

test("product identity query produces a structured decision-support answer without exact-query hardcoding", async () => {
  const kb = parseOkfLibrary();
  const response = await answerOkfChat(productIdentityQuery, kb);
  assert.equal(response.intent, "DESIGN_REUSE_FLOW_QUERY");
  assert.ok(response.answer_payload);
  assert.ok(response.answer_payload.design_moves.length >= 5);
  assert.ok(response.source_papers.length >= 5);
  assert.equal(response.flow_graph.mode, "mixed_reuse_flow");
  for (const required of ["SHORT_END_STICK_2025", "SSI_KYC_FRAMEWORK_2022", "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024", "BLOCKCHAIN_IOT_SDPS_2019", "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024"]) assert.ok(response.flow_graph.nodes.some((node) => node.paper_id === required), required);
  assert.equal(response.flow_graph.nodes.some((node) => node.layer === "Problem"), false);
  assert.ok(response.flow_graph.edges.some((edge) => edge.provenance === "query_generated" || edge.provenance === "mixed"));
  assert.equal(response.answer.includes("No direct OKF card"), false);

  const implementation = [
    readFileSync(path.join(process.cwd(), "lib", "okf", "reuse.ts"), "utf8"),
    readFileSync(path.join(process.cwd(), "lib", "llm", "prompts", "dsrReuseSynthesis.ts"), "utf8"),
    readFileSync(path.join(process.cwd(), "lib", "llm", "gemini.ts"), "utf8"),
    readFileSync(path.join(process.cwd(), "lib", "llm", "groq.ts"), "utf8")
  ].join("\n");
  assert.equal(implementation.includes(productIdentityQuery), false);
  assert.equal(/Product Identity & Description Integrity Registry/.test(implementation), false);
});


test("audited fragmented-data flow graph is a complete projection of selected moves only", async () => {
  const response = await answerOkfChat(fragmentedProductFlowQuery, parseOkfLibrary());
  const moves = response.answer_plan?.design_moves ?? [];
  assert.equal(response.intent, "DESIGN_REUSE_FLOW_QUERY");
  assert.ok(moves.length >= 5 && moves.length <= 7);
  assert.equal(response.source_papers.some((paper) => paper.paper_id === "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023"), false);
  const graph = response.flow_graph;
  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  const visibleLayers = ["Requirement", "Principle", "Feature", "Artifact"] as const;
  for (const layer of visibleLayers) {
    const count = graph.nodes.filter((node) => node.layer === layer).length;
    assert.ok(count >= 1 && count <= 7, `${layer} count ${count}`);
  }
  const allowedLabels = new Set(moves.flatMap((move) => [move.reused_requirement, move.reused_principle, move.candidate_feature, move.artifact_pattern]));
  for (const node of graph.nodes.filter((item) => visibleLayers.includes(item.layer as typeof visibleLayers[number]))) {
    assert.ok(allowedLabels.has(node.label), `graph node is not from a selected move: ${node.label}`);
  }
  for (const edge of graph.edges) {
    assert.ok(nodeIds.has(edge.source) && nodeIds.has(edge.target), `dangling edge ${edge.id}`);
    if (edge.relation_id) assert.equal(edge.provenance, "stored");
  }
  for (const node of graph.nodes) {
    assert.ok(graph.edges.some((edge) => edge.source === node.id || edge.target === node.id), `orphan node ${node.id}`);
  }
  const connected = (sourceLabel: string, targetLabel: string) => {
    const sources = new Set(graph.nodes.filter((node) => node.label === sourceLabel).map((node) => node.id));
    const targets = new Set(graph.nodes.filter((node) => node.label === targetLabel).map((node) => node.id));
    return graph.edges.some((edge) => sources.has(edge.source) && targets.has(edge.target));
  };
  for (const move of moves) {
    assert.ok(connected(move.reused_requirement, move.reused_principle), `${move.id} requirement-principle`);
    assert.ok(connected(move.reused_principle, move.candidate_feature), `${move.id} principle-feature`);
    assert.ok(connected(move.candidate_feature, move.artifact_pattern), `${move.id} feature-artifact`);
  }
  const implementation = [
    readFileSync(path.join(process.cwd(), "lib", "okf", "reuse.ts"), "utf8"),
    readFileSync(path.join(process.cwd(), "lib", "okf", "flow.ts"), "utf8")
  ].join("\n");
  assert.equal(implementation.includes(fragmentedProductFlowQuery), false);
});

test("short product identity flow query produces a mixed reuse flow graph", async () => {
  const kb = parseOkfLibrary();
  const response = await answerOkfChat("Build a Requirement -> Principle -> Feature -> Artifact flow for a cross-marketplace product identity and review-continuity protocol.", kb);
  assert.equal(response.intent, "DESIGN_REUSE_FLOW_QUERY");
  assert.ok(response.flow_graph.mode === "mixed_reuse_flow" || response.flow_graph.mode === "query_generated_flow");
  for (const required of ["SHORT_END_STICK_2025", "SSI_KYC_FRAMEWORK_2022", "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024", "BLOCKCHAIN_IOT_SDPS_2019", "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024"]) assert.ok(response.source_papers.some((paper) => paper.paper_id === required), required);
  assert.equal(response.flow_graph.nodes.some((node) => node.layer === "Problem"), false);
  assert.ok(response.flow_graph.edges.some((edge) => edge.provenance === "query_generated" || edge.provenance === "mixed"));
  assert.equal(/\b[A-Z][A-Z0-9_]{2,}:[A-Za-z0-9_.:-]+\b/.test(response.answer), false);
});
test("design reuse answer is grounded in 5-7 canonical moves without benchmark-specific prose", async () => {
  const kb = parseOkfLibrary();
  const response = await answerOkfChat(productIdentityQuery, kb);
  const moves = response.answer_plan?.design_moves ?? [];
  assert.ok(moves.length >= 5 && moves.length <= 7);
  const evidenceById = new Map(response.evidence.map((item) => [item.evidence_id, item]));
  for (const move of moves) {
    assert.ok(move.id && move.title && move.what_to_build);
    assert.ok(move.reused_requirement && move.reused_principle && move.candidate_feature && move.artifact_pattern);
    assert.equal(new Set(move.evidence_ids).size, move.evidence_ids.length);
    assert.equal(move.evidence_summaries.length, move.evidence_ids.length);
    if (!move.evidence_ids.length) assert.equal(move.adaptation_status, "query_generated");
    for (const evidenceId of move.evidence_ids) {
      const evidence = evidenceById.get(evidenceId);
      assert.ok(evidence, evidenceId);
      assert.ok(move.supporting_paper_ids.includes(evidence.paper_id), `${evidenceId} paper mismatch`);
    }
  }
  assert.equal(/\nSource papers:\s*/i.test(response.answer), false);
  assert.equal(/patient-facing consent|consent self-management app|across HIEs/i.test(response.answer), false);
  assert.equal(/\b[A-Z][A-Z0-9_]{2,}:[A-Za-z0-9_.:-]+\b/.test(response.answer), false);
});

test("authoritative reuse-plan validation is terminal before no-provider rendering", async () => {
  const response = await answerOkfChat(productIdentityQuery, parseOkfLibrary());
  const plan = response.answer_plan;
  assert.ok(plan);
  assert.equal(validateAuthoritativeReuseAnswerPlan(plan).valid, true);

  const tooFew = { ...plan, design_moves: plan.design_moves.slice(0, 4), flow_rows: plan.flow_rows.slice(0, 4) };
  assert.equal(validateAuthoritativeReuseAnswerPlan(tooFew).valid, false);

  const firstMove = plan.design_moves[0];
  assert.ok(firstMove?.evidence_ids[0]);
  const duplicateEvidenceMove = {
    ...firstMove,
    evidence_ids: [firstMove.evidence_ids[0], firstMove.evidence_ids[0]],
    evidence_summaries: [firstMove.evidence_summaries[0], firstMove.evidence_summaries[0]]
  };
  const duplicateEvidence = {
    ...plan,
    design_moves: [duplicateEvidenceMove, ...plan.design_moves.slice(1)],
    flow_rows: plan.flow_rows.map((row, index) => index === 0 ? { ...row, evidence_ids: duplicateEvidenceMove.evidence_ids } : row)
  };
  assert.equal(validateAuthoritativeReuseAnswerPlan(duplicateEvidence).valid, false);

  const evidencePaperMismatchMove = { ...firstMove, supporting_paper_ids: [] };
  const evidencePaperMismatch = {
    ...plan,
    design_moves: [evidencePaperMismatchMove, ...plan.design_moves.slice(1)],
    flow_rows: plan.flow_rows.map((row, index) => index === 0 ? { ...row, supporting_papers: [] } : row)
  };
  assert.equal(validateAuthoritativeReuseAnswerPlan(evidencePaperMismatch).valid, false);

  const missingEvidenceConcept = structuredClone(plan);
  assert.ok(missingEvidenceConcept.evidence_pack[0]);
  delete missingEvidenceConcept.evidence_pack[0].concept_id;
  const missingConceptValidation = validateAuthoritativeReuseAnswerPlan(missingEvidenceConcept);
  assert.equal(missingConceptValidation.valid, false);
  assert.ok(missingConceptValidation.errors.some((error) => error.includes("lacks a canonical concept link")));

  const fixtureResponse = await synthesizeWithNoProvider(
    "Build a Requirement -> Principle -> Feature -> Artifact flow for a credential application using the available OKF knowledge.",
    parseOkfLibrary(fixtureRoot)
  );
  assert.equal(fixtureResponse.answer_plan?.synthesis_policy, "deterministic");
  assert.equal(fixtureResponse.answer_plan?.design_moves.length, 0);
  assert.equal(fixtureResponse.source_papers.length, 0);
  assert.equal(fixtureResponse.runtime?.provider_status?.outcome, "not_configured");
  assert.match(fixtureResponse.answer, /could not construct a valid 5-7-move/i);
  assert.ok(fixtureResponse.warnings.some((warning) => warning.includes("Authoritative AnswerPlan validation failed")));
});

test("narrow named-paper reuse queries backfill to five grounded moves without inventing OKF labels", async () => {
  const kb = parseOkfLibrary();
  const titles = [
    "Blockchain-based token system for incentivizing peer review: A design science approach",
    "Designing trust-enabling blockchain systems for the inter-organizational exchange of capacity"
  ];
  for (const title of titles) {
    const response = await answerOkfChat(`What design knowledge should I reuse from ${title}?`, kb);
    const plan = response.answer_plan;
    assert.equal(response.intent, "DESIGN_REUSE_QUERY");
    assert.ok(plan);
    assert.ok(plan.design_moves.length >= 5 && plan.design_moves.length <= 7, title);
    assert.equal(validateAuthoritativeReuseAnswerPlan(plan).valid, true, title);
    assert.equal(response.answer.includes("could not construct a valid 5-7-move"), false, title);
    const storedLabels = new Set(response.retrieved_concepts.map((concept) => concept.title));
    const evidenceById = new Map(plan.evidence_pack.map((evidence) => [evidence.evidence_id, evidence]));
    const rowById = new Map(plan.flow_rows.map((row) => [row.row_id, row]));
    for (const move of plan.design_moves) {
      for (const label of [move.reused_requirement, move.reused_principle, move.candidate_feature, move.artifact_pattern]) {
        assert.ok(storedLabels.has(label), `${title}: invented label ${label}`);
      }
      assert.ok(move.evidence_ids.length > 0, `${title}: ungrounded move ${move.id}`);
      const row = rowById.get(move.id);
      assert.ok(row);
      for (const evidenceId of move.evidence_ids) {
        const evidence = evidenceById.get(evidenceId);
        assert.ok(evidence?.concept_id, `${title}: missing evidence concept ${evidenceId}`);
        assert.equal(evidence.paper_id, move.supporting_paper_ids[0]);
        assert.ok(row.concept_ids.includes(evidence.concept_id), `${title}: evidence outside move ${evidenceId}`);
      }
    }
  }
});

test("authoritative reuse-plan validator rejects same-paper evidence swapped across moves", async () => {
  const response = await answerOkfChat(
    "What design knowledge should I reuse from Blockchain for the IoT: Privacy-Preserving Protection of Sensor Data?",
    parseOkfLibrary()
  );
  const plan = structuredClone(response.answer_plan);
  assert.ok(plan);
  assert.equal(validateAuthoritativeReuseAnswerPlan(plan).valid, true);
  const grounded = plan.design_moves.flatMap((move) => {
    const evidence = plan.evidence_pack.find((item) => item.evidence_id === move.evidence_ids[0]);
    return evidence ? [{ move, evidence }] : [];
  });
  const pair = grounded.flatMap((left, index) => grounded.slice(index + 1).map((right) => ({ left, right }))).find(({ left, right }) =>
    left.evidence.paper_id === right.evidence.paper_id
    && left.evidence.concept_id !== right.evidence.concept_id
    && !left.move.evidence_ids.includes(right.evidence.evidence_id)
    && !right.move.evidence_ids.includes(left.evidence.evidence_id)
  );
  assert.ok(pair);
  const { left, right } = pair;
  left.move.evidence_ids[0] = right.evidence.evidence_id;
  left.move.evidence_summaries[0] = right.evidence.excerpt;
  right.move.evidence_ids[0] = left.evidence.evidence_id;
  right.move.evidence_summaries[0] = left.evidence.excerpt;
  const leftRow = plan.flow_rows.find((row) => row.row_id === left.move.id);
  const rightRow = plan.flow_rows.find((row) => row.row_id === right.move.id);
  assert.ok(leftRow);
  assert.ok(rightRow);
  leftRow.evidence_ids = [...left.move.evidence_ids];
  rightRow.evidence_ids = [...right.move.evidence_ids];
  const validation = validateAuthoritativeReuseAnswerPlan(plan);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((error) => /evidence (?:is not linked|concept does not match)/i.test(error)));
});

test("product identity source paper cards separate role badge from reason sentence", async () => {
  const kb = parseOkfLibrary();
  const response = await answerOkfChat(productIdentityQuery, kb);
  const shortEnd = response.source_papers.find((paper) => paper.paper_id === "SHORT_END_STICK_2025");
  assert.ok(shortEnd);
  assert.equal(shortEnd.role, "COMMERCIAL-DATA PRIVACY");
  assert.notEqual(shortEnd.role.toLowerCase(), shortEnd.reason.toLowerCase());
  for (const paper of response.source_papers) assert.notEqual(paper.role.trim().toLowerCase(), paper.reason.trim().toLowerCase());
});

test("provider-neutral compact context contains only selected moves, source roles, and mapped evidence", async () => {
  const kb = parseOkfLibrary();
  const response = await answerOkfChat(productIdentityQuery, kb);
  const context = buildMarkdownSynthesisContext(response);
  const shortEnd = context.source_paper_roles.find((paper) => paper.paper_id === "SHORT_END_STICK_2025");
  assert.ok(shortEnd);
  assert.equal(shortEnd.role, "COMMERCIAL-DATA PRIVACY");
  assert.match(shortEnd.reason, /proof-of-integrity|provider-held sensitive data/i);
  assert.ok(context.selected_moves.length >= 5 && context.selected_moves.length <= 7);
  assert.equal(context.evidence_by_move.length, context.selected_moves.length);
  assert.ok(context.selected_moves.every((move) => !Object.prototype.hasOwnProperty.call(move, "title")));
  assert.ok(context.selected_moves.every((move) => move.target_domain_adaptation.title === undefined));
  assert.ok(context.evidence_by_move.every((entry) => entry.evidence.every((evidence) => !Object.prototype.hasOwnProperty.call(evidence, "paper_title"))));
  const serialized = JSON.stringify(context);
  const retainedEvidence = context.evidence_by_move.flatMap((entry) => entry.evidence);
  assert.ok(compactPromptSize(context) <= 12_000, `compact prompt was ${compactPromptSize(context)} characters`);
  assert.ok(retainedEvidence.length <= 15, `compact context retained ${retainedEvidence.length} evidence records`);
  assert.ok(context.evidence_by_move.every((entry) => entry.evidence.length <= 3));
  assert.ok(serialized.length < compactPromptSize(context));
  assert.ok(serialized.length <= 12_000, `compact context was ${serialized.length} characters`);
  assert.equal(serialized.includes('"answer_plan"'), false);
  assert.equal(serialized.includes('"evidence_pack"'), false);
  assert.equal(serialized.includes('"flow_graph"'), false);
  assert.deepEqual(Object.keys(context).sort(), ["answer_requirements", "evidence_by_move", "selected_moves", "source_paper_roles", "task", "user_question"]);
});

test("compact context globally deduplicates evidence ids and summaries across reuse queries", async () => {
  const kb = parseOkfLibrary();
  const queries = [
    "What design knowledge should I reuse for a fair inclusive marketplace?",
    "What design knowledge should I reuse for consent status and auditability?"
  ];
  for (const query of queries) {
    const response = await answerOkfChat(query, kb);
    assert.ok(response.intent === "DESIGN_REUSE_QUERY" || response.intent === "DESIGN_REUSE_FLOW_QUERY", query);
    const context = buildMarkdownSynthesisContext(response);
    const retainedEvidence = context.evidence_by_move.flatMap((entry) => entry.evidence);
    const evidenceIds = retainedEvidence.map((evidence) => evidence.evidence_id.toLowerCase());
    const snippetKeys = retainedEvidence.map((evidence) => evidence.snippet.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim());
    assert.equal(new Set(evidenceIds).size, evidenceIds.length, `${query}: duplicate evidence id`);
    assert.equal(new Set(snippetKeys).size, snippetKeys.length, `${query}: duplicate evidence summary`);

    const canonicalMoves = new Map((response.answer_plan?.design_moves ?? []).map((move) => [move.id, move]));
    const selectedMoves = new Map(context.selected_moves.map((move) => [move.move_id, move]));
    for (const entry of context.evidence_by_move) {
      const canonicalMove = canonicalMoves.get(entry.move_id);
      const selectedMove = selectedMoves.get(entry.move_id);
      assert.ok(canonicalMove && selectedMove, `${query}: missing canonical move ${entry.move_id}`);
      for (const evidence of entry.evidence) {
        assert.ok(canonicalMove.evidence_ids.includes(evidence.evidence_id), `${query}: evidence assigned to the wrong move`);
        assert.ok(selectedMove.supporting_paper_ids.includes(evidence.paper_id), `${query}: evidence paper is not a move supporter`);
      }
      if (!entry.evidence.length) {
        const hasStoredBasis = Object.values(selectedMove.stored_okf_reuse).some(Boolean);
        const safeQueryGenerated = selectedMove.adaptation_status === "query_generated" && (selectedMove.confidence === "low" || selectedMove.confidence === "medium");
        assert.ok(hasStoredBasis || safeQueryGenerated, `${query}: deduplication left an unexplainable move`);
      }
    }
  }
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
  assert.equal(response.answer_payload.synthesis_mode, "structured_okf_answer");
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

test("design-reuse fallback is readable, grounded, complete, and has no source-title tail", async () => {
  const kb = parseOkfLibrary();
  const response = await synthesizeWithNoProvider(productIdentityQuery, kb);
  assert.equal(response.runtime?.synthesis_mode, "structured_okf_answer");
  assert.equal(response.runtime?.provider, "none");
  assert.equal(response.runtime?.provider_configured, false);
  assert.equal(response.runtime?.provider_connected, false);
  assert.equal(response.runtime?.synthesis_attempted, false);
  assert.deepEqual(response.runtime?.provider_status, {
    provider: "none", configured: false, reachable: false, attempted: false, outcome: "not_configured",
    fallback_reason: "No live LLM provider is configured."
  });
  assert.match(response.answer, /compact|found|retrieved/i);
  assert.equal(/Requirement -> Principle -> Feature -> Artifact flow:\n\d+\. Requirement:/i.test(response.answer), false);
  for (const evidence of response.evidence.slice(0, 20)) assert.equal(response.answer.includes(evidence.evidence_id), false);
  assertNoNakedPaperTitleTail(response);
  assert.equal(/\bCombine\b/i.test(response.answer), false);
  const evidenceLines = response.answer.split(/\r?\n/).filter((line) => line.startsWith("- **Evidence basis:**"));
  assert.equal(evidenceLines.length, response.answer_payload?.design_moves.length);
  for (const line of evidenceLines) {
    assert.match(line, /[.!?]$/);
    assert.equal(/\.\.\.|\u2026/.test(line), false);
  }
  const architecture = response.answer.match(/## Suggested architecture direction\s*\n([\s\S]*?)\n## What not to overclaim/)?.[1] ?? "";
  const architectureBullets = architecture.split(/\r?\n/).filter((line) => line.startsWith("- "));
  assert.ok(architectureBullets.length >= 4 && architectureBullets.length <= 6);
  assert.ok(architectureBullets.every((line) => !/^-\s+(?:Combine|[^ ]+\.?$)/i.test(line)));
  assert.equal(response.answer.includes("Source papers:"), false);
  const finalAnswerLine = response.answer.trim().split(/\r?\n/).at(-1) ?? "";
  assert.equal(isBarePaperTitleLine(finalAnswerLine, response.source_papers.map((paper) => paper.title)), false);
});


test("deprecated Featherless fallback reports provider none as not configured", async () => {
  const deterministic = await answerOkfChat(productIdentityQuery, parseOkfLibrary());
  const response = await synthesizeWithFeatherless(deterministic);
  assert.equal(response.runtime?.provider, "none");
  assert.equal(response.runtime?.provider_configured, false);
  assert.equal(response.runtime?.provider_connected, false);
  assert.equal(response.runtime?.synthesis_attempted, false);
  assert.equal(response.runtime?.provider_status?.outcome, "not_configured");
  assert.equal(response.runtime?.provider_status?.reachable, false);
});

test("OKF chat UI renders Markdown only in the default answer tab", () => {
  const source = readFileSync(path.join(process.cwd(), "components", "okf-chat", "OkfChatWorkspace.tsx"), "utf8");
  assert.ok(source.includes("response.llm_synthesis"));
  assert.ok(source.includes("MarkdownAnswer"));
  assert.ok(source.includes("Evidence details are available in the Evidence tab."));
  assert.equal(source.includes("response.source_papers.slice(0, 4)"), false);
  assert.ok(source.includes("Copy answer"));
  assert.equal(source.includes("payload.direct_answer"), false);
  assert.equal(source.includes("DesignMoveCards"), false);
  assert.equal(source.includes("GuidanceCards response"), false);
  assert.equal(source.includes("<MiniFlow response"), false);
});

test("invalid provider schema has a clean main label while exact diagnostics remain in Debug", () => {
  const source = readFileSync(path.join(process.cwd(), "components", "okf-chat", "OkfChatWorkspace.tsx"), "utf8");
  const contract = readFileSync(path.join(process.cwd(), "lib", "llm", "structured-synthesis.ts"), "utf8");
  const labelBlock = source.slice(source.indexOf("function providerStatusLabel"), source.indexOf("function providerStatusTone"));
  const debugBlock = source.slice(source.indexOf("function DebugTrace"), source.indexOf("function SourcePapersPanel"));
  assert.ok(labelBlock.includes('return "LLM validation fallback"'));
  assert.ok(labelBlock.includes('return "LLM rate-limit fallback"'));
  assert.ok(labelBlock.includes('return "LLM unavailable \\u00b7 structured OKF answer"'));
  for (const rawDetail of ["http_status", "error_type", "schema_validation_failed", "fallback_reason"]) assert.equal(labelBlock.includes(rawDetail), false, rawDetail);
  for (const diagnostic of ["providerStatus.provider", "providerStatus.http_status", "providerStatus.error_type", "providerStatus.fallback_reason", "provider_metadata: synthesis.provider_metadata", "debug: synthesis.debug"]) assert.ok(debugBlock.includes(diagnostic), diagnostic);
  assert.ok(contract.includes('"schema_validation_failed"'));
  assert.equal(source.includes("providerStatusText"), false);
  assert.equal(source.includes("Groq 200 schema_validation_failed"), false);
  assert.equal(source.includes("Gemini 200 schema_validation_failed"), false);
});

test("OKF chat initial UI is clean and hides tabs/context before the first answer", () => {
  const source = readFileSync(path.join(process.cwd(), "components", "okf-chat", "OkfChatWorkspace.tsx"), "utf8");
  assert.ok(source.includes("DSR OKF Decision Assistant"));
  assert.ok(source.includes("Evidence-grounded design knowledge reuse across curated DSR papers."));
  assert.ok(source.includes("exampleQuestions"));
  assert.ok(source.includes("Ask a design problem, paper-specific question, or DSR flow question."));
  assert.ok(source.includes("{loading && <StageProgress"));
  assert.ok(source.includes("{response && ("));
  assert.ok(source.includes("How this answer was built"));
  assert.equal(source.includes("The MVP works without an LLM key"), false);
  assert.equal(source.includes("Ask a question to see source papers and evidence."), false);
  assert.equal(source.includes("CorrectionReviewInterface"), false);
});

test("OKF chat progress uses five compact dynamic stages", () => {
  const source = readFileSync(path.join(process.cwd(), "components", "okf-chat", "OkfChatWorkspace.tsx"), "utf8");
  for (const stage of ["Understanding query", "Selecting sources", "Retrieving OKF knowledge", "Checking evidence", "Synthesizing answer"]) assert.ok(source.includes(stage));
  assert.ok(source.includes("setActiveStage"));
  assert.ok(source.includes("Loader2"));
  assert.equal(source.includes("Drafting recommendation"), false);
});


test("OKF chat keeps correction review hidden behind report issue drawer", () => {
  const source = readFileSync(path.join(process.cwd(), "components", "okf-chat", "OkfChatWorkspace.tsx"), "utf8");
  assert.ok(source.includes("Report issue"));
  assert.ok(source.includes("ReportIssueDrawer"));
  assert.equal(source.includes("Correction review"), false);
  assert.equal(source.includes("<CorrectionReviewInterface"), false);
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

test("Gemini success becomes the primary synthesis mode", async () => {
  const kb = parseOkfLibrary();
  const deterministic = await answerOkfChat(productIdentityQuery, kb);
  const markdown = `# Recommendation
Use the retrieved OKF papers to combine product identity credentials, privacy-preserving evidence, review continuity, and implementation governance. Treat product-specific registry details as mixed or query-generated because the OKF stores reusable patterns rather than this exact marketplace construct.

## Design moves to reuse
1. **What to build:** Gemini grounded identity move. **Reuse from OKF:** credential-backed control point. **Supporting papers:** Designing a Framework for Digital KYC Processes Built on Blockchain-Based Self-Sovereign Identity. **Evidence:** selected evidence supports reusable credentials and status checks. **Adaptation status:** mixed.

## Suggested architecture direction
Keep claims grounded in selected evidence.

## What not to overclaim
- Do not introduce papers or evidence outside the retrieved OKF context.`;
  void markdown;
  await withMockedGemini(structuredSynthesisJson(deterministic, "Gemini grounded identity synthesis passed validation."), async () => {
    const response = await synthesizeWithOptionalLlm(deterministic);
    assert.equal(response.llm_synthesis?.synthesis_mode, "gemini");
    assert.equal(response.runtime?.provider, "gemini");
    assert.equal(response.runtime?.provider_connected, true);
    assert.match(response.answer, /^# Recommendation/);
    assert.match(response.answer, /Gemini grounded identity synthesis passed validation/i);
    assert.equal(response.runtime?.provider_status?.outcome, "synthesis_used");
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
  void markdown;
  await withMockedGroq(structuredSynthesisJson(deterministic, "Prioritize a grounded architecture based only on the selected canonical moves."), async () => {
    const response = await synthesizeWithOptionalLlm(deterministic);
    assert.match(response.answer, /^# Recommendation/);
    assert.equal(/:[a-z]+_\d+|:ev_/i.test(response.answer), false);
    assert.equal(/patient-facing consent management|Distributed replication of consent transactions|Immutable consent transaction log/i.test(response.answer), false);
    assert.match(response.answer, /## Design moves to reuse/);
    assert.equal(response.answer.includes("prompt context"), false);
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
  void answer;
  await withMockedGroq(structuredSynthesisJson(deterministic, "Groq grounded synthesis passed validation."), async () => {
    const response = await synthesizeWithOptionalLlm(deterministic);
    assert.equal(response.llm_synthesis?.synthesis_mode, "groq");
    assert.equal(response.runtime?.provider, "groq");
    assert.equal(response.runtime?.provider_connected, true);
    assert.match(response.answer, /# Recommendation/);
    assert.match(response.answer, /Groq grounded synthesis passed validation/i);
  });
});
test("Groq structured output with raw evidence and concept ids is rejected", async () => {
  const kb = parseOkfLibrary();
  const deterministic = await answerOkfChat(productIdentityQuery, kb);
  const rawOutput = structuredSynthesisJson(deterministic, "Use BLOCKCHAIN_IOT_SDPS_2019:dp1_source_to_sink_certification with ev_12345.");
  await withMockedGroq(rawOutput, async () => {
    const response = await synthesizeWithOptionalLlm(deterministic);
    assert.equal(response.llm_synthesis?.synthesis_mode, "fallback_validation_error");
    assert.equal(response.runtime?.provider_status?.outcome, "validation_error");
    assert.equal(response.answer, deterministic.answer);
    assert.equal(/ev_\w+|BLOCKCHAIN_IOT_SDPS_2019:/i.test(response.answer), false);
  });
});


test("Groq non-STOP finish reason is rejected and keeps the deterministic answer", async () => {
  const deterministic = await answerOkfChat(productIdentityQuery, parseOkfLibrary());
  await withMockedGroq(structuredSynthesisJson(deterministic), async () => {
    const response = await synthesizeWithOptionalLlm(deterministic);
    assert.equal(response.llm_synthesis?.synthesis_mode, "fallback_validation_error");
    assert.equal(response.runtime?.provider_status?.outcome, "validation_error");
    assert.equal(response.llm_synthesis?.debug?.finish_reason, "length");
    assert.equal(response.answer, deterministic.answer);
  }, undefined, "length");
});

test("Gemini 200 with MAX_TOKENS is rejected and keeps the deterministic answer", async () => {
  const deterministic = await answerOkfChat(productIdentityQuery, parseOkfLibrary());
  await withMockedGemini(structuredSynthesisJson(deterministic), async () => {
    const response = await synthesizeWithOptionalLlm(deterministic);
    assert.equal(response.llm_synthesis?.synthesis_mode, "fallback_validation_error");
    assert.equal(response.runtime?.provider_status?.outcome, "validation_error");
    assert.equal(response.runtime?.provider_status?.http_status, 200);
    assert.equal(response.answer, deterministic.answer);
    assert.equal(response.llm_synthesis?.debug?.finish_reason, "MAX_TOKENS");
  }, undefined, "MAX_TOKENS");
});


test("Gemini validation rejection is terminal and does not retry Groq", async () => {
  const deterministic = await answerOkfChat(productIdentityQuery, parseOkfLibrary());
  const geminiContent = structuredSynthesisJson(deterministic, "The prompt context has instructions that I will use before answering.");
  const geminiBody = {
    candidates: [{ content: { parts: [{ text: geminiContent }] }, finishReason: "STOP" }],
    usageMetadata: { promptTokenCount: 12, candidatesTokenCount: 8, totalTokenCount: 20 }
  };
  await withMockedGeminiErrorThenGroq(200, geminiBody, structuredSynthesisJson(deterministic), async (calls) => {
    const response = await synthesizeWithOptionalLlm(deterministic);
    assert.equal(calls(), 1);
    assert.equal(response.runtime?.provider, "gemini");
    assert.equal(response.llm_synthesis?.synthesis_mode, "fallback_validation_error");
    assert.equal(response.runtime?.provider_status?.outcome, "validation_error");
    assert.equal(response.answer, deterministic.answer);
  });
});

test("AnswerGuard rejects leak, quote-only, incomplete, unsupported-source, and title-tail output", async () => {
  const kb = parseOkfLibrary();
  const deterministic = await answerOkfChat(productIdentityQuery, kb);
  const base = structuredSynthesisObject(deterministic);
  const firstMove = deterministic.answer_plan?.design_moves[0];
  const allowedTitle = deterministic.source_papers[0]?.title;
  const unsupportedTitle = kb.papers.find((paper) => paper.paper_id === "PEER_REVIEW_TOKEN_INCENTIVES_2025")?.title;
  assert.ok(firstMove && allowedTitle && unsupportedTitle);
  const scenarios = [
    {
      name: "prompt leak",
      content: JSON.stringify({ ...base, opening_recommendation: "The prompt context has instructions that I will use before answering." })
    },
    {
      name: "quote-only concept title",
      content: JSON.stringify({ ...base, opening_recommendation: firstMove.title })
    },
    {
      name: "missing move explanation",
      content: JSON.stringify({ ...base, move_explanations: base.move_explanations.slice(1) })
    },
    {
      name: "missing required sections",
      content: JSON.stringify({ opening_recommendation: base.opening_recommendation, move_explanations: base.move_explanations })
    },
    {
      name: "unsupported paper title",
      content: JSON.stringify({ ...base, opening_recommendation: `Use the supplied moves together with ${unsupportedTitle}.` })
    },
    {
      name: "fabricated unquoted title-year citation",
      content: JSON.stringify({ ...base, opening_recommendation: "Use the supplied moves together with the Imaginary Ledger Governance Study (2029)." })
    },
    {
      name: "single source-title tail",
      content: JSON.stringify({ ...base, opening_recommendation: `Use the supplied moves as a bounded design.\nSource: ${allowedTitle}` })
    },
    {
      name: "annotated source-title tail",
      content: JSON.stringify({ ...base, opening_recommendation: `Use the supplied moves as a bounded design.\n${allowedTitle} (source paper)` })
    }
  ];
  for (const scenario of scenarios) {
    await withMockedGemini(scenario.content, async () => {
      const response = await synthesizeWithOptionalLlm(deterministic);
      assert.equal(response.llm_synthesis?.synthesis_mode, "fallback_validation_error", scenario.name);
      assert.equal(response.runtime?.provider_status?.outcome, "validation_error", scenario.name);
      assert.equal(response.answer, deterministic.answer, scenario.name);
    });
  }
});

test("AnswerGuard allows ordinary lowercase framework prose when move explanations are grounded", async () => {
  const deterministic = await answerOkfChat(productIdentityQuery, parseOkfLibrary());
  const allowedTitle = deterministic.source_papers.find((paper) => paper.paper_id === "SSI_KYC_FRAMEWORK_2022")?.title;
  assert.ok(allowedTitle);
  const openings = [
    "Use the supplied moves together as an ordinary framework for marketplace governance.",
    `Use ${allowedTitle} (2029) only as a selected source while keeping the design bounded.`
  ];
  for (const opening_recommendation of openings) {
    const content = JSON.stringify({
      ...structuredSynthesisObject(deterministic),
      opening_recommendation
    });
    await withMockedGemini(content, async () => {
      const response = await synthesizeWithOptionalLlm(deterministic);
      assert.equal(response.llm_synthesis?.synthesis_mode, "gemini");
      assert.equal(response.runtime?.provider_status?.outcome, "synthesis_used");
    });
  }
});

test("Groq failure shows a marked compact retrieval fallback instead of raw debug", async () => {
  const kb = parseOkfLibrary();
  const deterministic = await answerOkfChat(productIdentityQuery, kb);
  await withMockedGroq(undefined, async () => {
    const response = await synthesizeWithOptionalLlm(deterministic);
    assert.equal(response.llm_synthesis?.synthesis_mode, "fallback_provider_error");
    assert.equal(response.answer, deterministic.answer);
    assert.equal(response.runtime?.provider_status?.outcome, "provider_error");
    assert.equal(/Evidence:\s*[^\n]*:ev_/i.test(response.answer), false);
    assert.ok(response.llm_synthesis?.debug?.fallback_reason);
  }, new Error("mock Groq outage"));
});
test("Gemini 429 RESOURCE_EXHAUSTED produces rate-limit fallback without disconnecting provider", async () => {
  const kb = parseOkfLibrary();
  const deterministic = await answerOkfChat(productIdentityQuery, kb);
  await withMockedGeminiError(429, { error: { message: "Quota exceeded", status: "RESOURCE_EXHAUSTED" } }, async () => {
    const response = await synthesizeWithOptionalLlm(deterministic);
    assert.equal(response.llm_synthesis?.synthesis_mode, "fallback_rate_limited");
    assert.equal(response.runtime?.synthesis_mode, "fallback_rate_limited");
    assert.equal(response.runtime?.provider, "gemini");
    assert.equal(response.runtime?.provider_connected, true);
    assert.equal(response.runtime?.provider_status_code, 429);
    assert.equal(response.runtime?.provider_error_type, "RESOURCE_EXHAUSTED");
    assert.equal(response.answer, deterministic.answer);
    assert.equal(response.runtime?.provider_status?.outcome, "rate_limited");
    assert.equal(response.runtime?.provider_status?.reachable, true);
  });
});

test("Gemini 503 UNAVAILABLE high demand is treated as transient fallback", async () => {
  const kb = parseOkfLibrary();
  const deterministic = await answerOkfChat(productIdentityQuery, kb);
  await withMockedGeminiError(503, { error: { message: "This model is currently experiencing high demand. Please try again later.", status: "UNAVAILABLE" } }, async () => {
    const response = await synthesizeWithOptionalLlm(deterministic);
    assert.equal(response.llm_synthesis?.synthesis_mode, "fallback_rate_limited");
    assert.equal(response.runtime?.synthesis_mode, "fallback_rate_limited");
    assert.equal(response.runtime?.provider, "gemini");
    assert.equal(response.runtime?.provider_connected, true);
    assert.equal(response.runtime?.provider_status_code, 503);
    assert.equal(response.runtime?.provider_error_type, "UNAVAILABLE");
    assert.equal(response.answer, deterministic.answer);
    assert.equal(response.runtime?.provider_status?.outcome, "rate_limited");
  });
});

test("Gemini unavailable keeps the structured rate-limit fallback and does not retry a secondary provider", async () => {
  const deterministic = await answerOkfChat(productIdentityQuery, parseOkfLibrary());
  await withMockedGeminiErrorThenGroq(503, { error: { message: "This model is currently experiencing high demand. Please try again later.", status: "UNAVAILABLE" } }, structuredSynthesisJson(deterministic, "Groq secondary synthesis passed validation after the primary provider was unavailable."), async (calls) => {
    const response = await synthesizeWithOptionalLlm(deterministic);
    assert.equal(calls(), 1);
    assert.equal(response.llm_synthesis?.synthesis_mode, "fallback_rate_limited");
    assert.equal(response.runtime?.synthesis_mode, "fallback_rate_limited");
    assert.equal(response.runtime?.provider, "gemini");
    assert.equal(response.runtime?.provider_connected, true);
    assert.equal(response.runtime?.provider_status?.outcome, "rate_limited");
    assert.equal(response.answer, deterministic.answer);
  });
});
const plannerEligibleReuseQuery = "Need guidance for fragmented product identity, verification, and governance across marketplaces.";

test("optional planner 429 and 503 consume the one-call budget and propagate rate-limit fallback", async () => {
  for (const providerFailure of [
    { status: 429, type: "RESOURCE_EXHAUSTED", message: "Quota exceeded" },
    { status: 503, type: "UNAVAILABLE", message: "Model capacity unavailable" }
  ]) {
    await withGeminiEnv(async () => {
      await withTemporaryEnv({ OKF_LLM_QUERY_PLANNER_LIVE_TEST: "true" }, async () => {
        const previousFetch = globalThis.fetch;
        let calls = 0;
        globalThis.fetch = (async () => {
          calls += 1;
          if (calls > 1) throw new Error("planner failure must not trigger a synthesis request");
          return new Response(JSON.stringify({
            error: { message: providerFailure.message, status: providerFailure.type }
          }), { status: providerFailure.status, headers: { "Content-Type": "application/json" } });
        }) as typeof fetch;
        try {
          const deterministic = await answerOkfChat(plannerEligibleReuseQuery, parseOkfLibrary());
          const plannerStatus = deterministic.answer_plan?.query_plan.planner_status;
          assert.equal(plannerStatus?.outcome, "rate_limited");
          assert.equal(plannerStatus?.http_status, providerFailure.status);
          assert.equal(plannerStatus?.error_type, providerFailure.type);
          assert.ok((plannerStatus?.prompt_tokens ?? 0) > 0);

          const canonicalAnswer = deterministic.answer;
          const response = await synthesizeWithOptionalLlm(deterministic);
          assert.equal(calls, 1);
          assert.equal(response.answer, canonicalAnswer);
          assert.equal(response.runtime?.synthesis_mode, "fallback_rate_limited");
          assert.equal(response.runtime?.synthesis_attempted, false);
          assert.equal(response.runtime?.provider_status?.attempted, true);
          assert.equal(response.runtime?.provider_status?.reachable, true);
          assert.equal(response.runtime?.provider_status?.outcome, "rate_limited");
          const debugPlanner = response.llm_synthesis?.debug?.planner_status as { outcome?: string } | undefined;
          assert.equal(debugPlanner?.outcome, "rate_limited");
          assert.equal(response.answer.includes(providerFailure.type), false);
        } finally {
          globalThis.fetch = previousFetch;
        }
      });
    });
  }
});

test("successful optional planner records usage and skips a second live synthesis call", async () => {
  await withGeminiEnv(async () => {
    await withTemporaryEnv({
      OKF_LLM_QUERY_PLANNER_LIVE_TEST: "true",
      LLM_INPUT_COST_PER_MILLION: "1",
      LLM_OUTPUT_COST_PER_MILLION: "2"
    }, async () => {
      const previousFetch = globalThis.fetch;
      let calls = 0;
      globalThis.fetch = (async () => {
        calls += 1;
        if (calls > 1) throw new Error("successful planner must not trigger a synthesis request");
        const candidate = { intent: "DESIGN_REUSE_QUERY", confidence: "medium", requested_output_shape: "design_recommendation" };
        return new Response(JSON.stringify({
          candidates: [{ content: { parts: [{ text: JSON.stringify(candidate) }] }, finishReason: "STOP" }],
          usageMetadata: { promptTokenCount: 20, candidatesTokenCount: 10, totalTokenCount: 30 }
        }), { status: 200, headers: { "Content-Type": "application/json" } });
      }) as typeof fetch;
      try {
        const deterministic = await answerOkfChat(plannerEligibleReuseQuery, parseOkfLibrary());
        const plannerStatus = deterministic.answer_plan?.query_plan.planner_status;
        assert.equal(plannerStatus?.outcome, "success");
        assert.equal(plannerStatus?.total_tokens, 30);
        assert.equal(plannerStatus?.prompt_tokens_estimated, false);
        assert.ok((plannerStatus?.estimated_cost_usd ?? 0) > 0);
        const response = await synthesizeWithOptionalLlm(deterministic);
        assert.equal(calls, 1);
        assert.equal(response.answer, deterministic.answer);
        assert.equal(response.runtime?.synthesis_mode, "structured_okf_answer");
        assert.equal(response.runtime?.synthesis_attempted, false);
        assert.equal(response.runtime?.provider_status?.outcome, "synthesis_skipped");
        assert.equal(response.runtime?.provider_status?.attempted, true);
        assert.equal(response.runtime?.provider_status?.reachable, true);
      } finally {
        globalThis.fetch = previousFetch;
      }
    });
  });
});

test("prompt budget skips live synthesis before calling the provider", async () => {
  const deterministic = await answerOkfChat(productIdentityQuery, parseOkfLibrary());
  await withGroqEnv(async () => {
    const previousFetch = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = (async () => { calls += 1; throw new Error("provider must not be called"); }) as typeof fetch;
    try {
      await withTemporaryEnv({ LLM_MAX_PROMPT_CHARS: "1000" }, async () => {
        const response = await synthesizeWithOptionalLlm(deterministic);
        assert.equal(calls, 0);
        assert.equal(response.runtime?.synthesis_mode, "structured_okf_answer");
        assert.equal(response.runtime?.synthesis_attempted, false);
        assert.match(response.runtime?.fallback_reason ?? "", /context_too_large|context policy/i);
      });
    } finally {
      globalThis.fetch = previousFetch;
    }
  });
});

test("LLM_DISABLE_LIVE_SYNTHESIS skips a configured provider", async () => {
  const deterministic = await answerOkfChat(productIdentityQuery, parseOkfLibrary());
  await withGroqEnv(async () => {
    const previousFetch = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = (async () => { calls += 1; throw new Error("provider must not be called"); }) as typeof fetch;
    try {
      await withTemporaryEnv({ LLM_DISABLE_LIVE_SYNTHESIS: "true" }, async () => {
        const response = await synthesizeWithOptionalLlm(deterministic);
        assert.equal(calls, 0);
        assert.equal(response.runtime?.synthesis_attempted, false);
        assert.match(response.runtime?.fallback_reason ?? "", /LLM_DISABLE_LIVE_SYNTHESIS=true/);
      });
    } finally {
      globalThis.fetch = previousFetch;
    }
  });
});

test("test runs skip live synthesis unless the explicit live-test flag is enabled", async () => {
  const deterministic = await answerOkfChat(productIdentityQuery, parseOkfLibrary());
  await withGroqEnv(async () => {
    const previousFetch = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = (async () => { calls += 1; throw new Error("provider must not be called"); }) as typeof fetch;
    try {
      await withTemporaryEnv({ OKF_LLM_SYNTHESIS_LIVE_TEST: undefined, GROQ_LIVE_TEST: "false" }, async () => {
        const response = await synthesizeWithOptionalLlm(deterministic);
        assert.equal(calls, 0);
        assert.equal(response.runtime?.synthesis_attempted, false);
        assert.match(response.runtime?.fallback_reason ?? "", /disabled during tests unless explicitly enabled/i);
      });
    } finally {
      globalThis.fetch = previousFetch;
    }
  });
});

test("successful synthesis cache prevents a duplicate provider request for the same canonical plan", async () => {
  const deterministic = await answerOkfChat(productIdentityQuery, parseOkfLibrary());
  await withMockedGroq(structuredSynthesisJson(deterministic), async (calls) => {
    await withTemporaryEnv({ LLM_REQUEST_CACHE_TTL_MS: "86400000" }, async () => {
      clearSuccessfulSynthesisCache();
      const first = await synthesizeWithOptionalLlm(deterministic);
      const second = await synthesizeWithOptionalLlm(deterministic);
      assert.equal(calls(), 1);
      assert.equal(first.llm_synthesis?.debug?.cache_hit, false);
      assert.equal(second.llm_synthesis?.debug?.cache_hit, true);
      assert.equal(second.llm_synthesis?.provider_metadata.cache_hit, true);
      assert.equal(second.runtime?.synthesis_attempted, false);
    });
  });
});

test("schema-invalid provider output retains structured validation diagnostics only in Debug metadata", async () => {
  const deterministic = await answerOkfChat(productIdentityQuery, parseOkfLibrary());
  await withMockedGroq(JSON.stringify({ opening_recommendation: "Incomplete response" }), async (calls) => {
    const response = await synthesizeWithOptionalLlm(deterministic);
    assert.equal(calls(), 1);
    assert.equal(response.llm_synthesis?.synthesis_mode, "fallback_validation_error");
    assert.equal(response.runtime?.provider_error_type, "schema_validation_failed");
    assert.equal(response.llm_synthesis?.provider_metadata.error_type, "schema_validation_failed");
    const validationErrors = response.llm_synthesis?.debug?.validation_errors as Array<{ code: string; path: string; message: string }> | undefined;
    assert.ok(validationErrors && validationErrors.length > 0);
    assert.ok(validationErrors.every((error) => error.code && error.path && error.message));
    assert.equal(response.answer, deterministic.answer);
  });
});

test("deterministic stats query reports structured OKF answer with configured Groq and no live call", async () => {
  const kb = parseOkfLibrary();
  const deterministic = await answerOkfChat("How many papers are in the OKF library?", kb);
  let called = false;
  await withGroqEnv(async () => {
    const previousFetch = globalThis.fetch;
    globalThis.fetch = (async () => { called = true; throw new Error("live Groq should not be called for stats"); }) as typeof fetch;
    try {
      const response = await synthesizeWithOptionalLlm(deterministic);
      assert.equal(response.runtime?.synthesis_mode, "structured_okf_answer");
      assert.equal(response.runtime?.provider_configured, true);
      assert.equal(response.runtime?.provider_connected, false);
      assert.equal(response.runtime?.synthesis_attempted, false);
      assert.equal(response.runtime?.provider_status?.outcome, "synthesis_skipped");
      assert.equal(response.runtime?.provider_status?.reachable, false);
      assert.equal(called, false);
    } finally {
      globalThis.fetch = previousFetch;
    }
  });
});

test("deterministic stats query reports structured OKF answer with configured Gemini and no live call", async () => {
  const kb = parseOkfLibrary();
  const deterministic = await answerOkfChat("How many papers are in the OKF library?", kb);
  let called = false;
  await withGeminiEnv(async () => {
    const previousFetch = globalThis.fetch;
    globalThis.fetch = (async () => { called = true; throw new Error("live Gemini should not be called for stats"); }) as typeof fetch;
    try {
      const response = await synthesizeWithOptionalLlm(deterministic);
      assert.equal(response.runtime?.provider, "gemini");
      assert.equal(response.runtime?.synthesis_mode, "structured_okf_answer");
      assert.equal(response.runtime?.provider_configured, true);
      assert.equal(response.runtime?.provider_connected, false);
      assert.equal(response.runtime?.synthesis_attempted, false);
      assert.equal(response.runtime?.provider_status?.outcome, "synthesis_skipped");
      assert.equal(response.runtime?.provider_status?.reachable, false);
      assert.equal(called, false);
    } finally {
      globalThis.fetch = previousFetch;
    }
  });
});
test("Groq 429 produces rate-limit fallback without disconnecting provider", async () => {
  const kb = parseOkfLibrary();
  const deterministic = await answerOkfChat(productIdentityQuery, kb);
  await withMockedGroqError(429, { error: { message: "rate limit exceeded", type: "rate_limit_exceeded" } }, async () => {
    const response = await synthesizeWithOptionalLlm(deterministic);
    assert.equal(response.llm_synthesis?.synthesis_mode, "fallback_rate_limited");
    assert.equal(response.runtime?.synthesis_mode, "fallback_rate_limited");
    assert.equal(response.runtime?.provider_connected, true);
    assert.equal(response.runtime?.provider_status_code, 429);
    assert.equal(response.runtime?.provider_error_type, "rate_limit_exceeded");
    assert.equal(response.answer, deterministic.answer);
    assert.equal(response.runtime?.provider_status?.outcome, "rate_limited");
  });
});

test("Groq auth failure reports provider-error fallback", async () => {
  const kb = parseOkfLibrary();
  const deterministic = await answerOkfChat(productIdentityQuery, kb);
  await withMockedGroqError(401, { error: { message: "invalid api key", type: "invalid_request_error" } }, async () => {
    const response = await synthesizeWithOptionalLlm(deterministic);
    assert.equal(response.llm_synthesis?.synthesis_mode, "fallback_provider_error");
    assert.equal(response.runtime?.provider_connected, false);
    assert.equal(response.runtime?.provider_status_code, 401);
    assert.equal(response.runtime?.provider_error_type, "invalid_request_error");
    assert.equal(response.runtime?.provider_status?.reachable, false);
  });
});

test("mock LLM provider synthesizes offline without live fetch", async () => {
  const kb = parseOkfLibrary();
  const deterministic = await answerOkfChat(productIdentityQuery, kb);
  const previousProvider = process.env.LLM_PROVIDER;
  const previousMock = process.env.GROQ_MOCK;
  const previousFetch = globalThis.fetch;
  let called = false;
  process.env.LLM_PROVIDER = "mock";
  delete process.env.GROQ_MOCK;
  globalThis.fetch = (async () => { called = true; throw new Error("mock provider should not fetch"); }) as typeof fetch;
  try {
    const response = await synthesizeWithOptionalLlm(deterministic);
    assert.equal(response.runtime?.provider, "mock");
    assert.equal(response.runtime?.synthesis_mode, "mock");
    assert.equal(response.llm_synthesis?.synthesis_mode, "mock");
    assert.match(response.answer, /^# Recommendation|^# Mock OKF synthesis/);
    assert.equal(response.runtime?.provider_status?.outcome, "synthesis_used");
    assert.equal(response.llm_synthesis?.debug?.guard_outcome, "accepted");
    assert.equal(JSON.stringify(response.llm_synthesis?.debug).includes('"answer_plan"'), false);
    const compactContext = response.llm_synthesis?.debug?.compact_context as Record<string, unknown>;
    assert.deepEqual(Object.keys(compactContext).sort(), [
      "answer_requirements", "evidence_by_move", "selected_moves", "source_paper_roles", "task", "user_question"
    ]);
    assert.equal(response.runtime?.provider_status?.reachable, true);
    assert.equal(response.runtime?.provider_status?.attempted, true);
    assert.equal(called, false);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousProvider === undefined) delete process.env.LLM_PROVIDER; else process.env.LLM_PROVIDER = previousProvider;
    if (previousMock === undefined) delete process.env.GROQ_MOCK; else process.env.GROQ_MOCK = previousMock;
  }
});
test("provider reachability treats authentication failures as unreachable and transient responses as reachable", () => {
  assert.equal(isProviderResponseReachable(undefined), false);
  assert.equal(isProviderResponseReachable(401, "invalid_request_error"), false);
  assert.equal(isProviderResponseReachable(403, "permission_denied"), false);
  assert.equal(isProviderResponseReachable(400, "authentication_error"), false);
  assert.equal(isProviderResponseReachable(429, "rate_limit_exceeded"), true);
  assert.equal(isProviderResponseReachable(503, "UNAVAILABLE"), true);
  assert.equal(isProviderResponseReachable(200), true);
});

test("Flow tab renders a layered graph instead of row cards", () => {
  const source = readFileSync(path.join(process.cwd(), "components", "okf-chat", "OkfChatWorkspace.tsx"), "utf8");
  assert.ok(source.includes("DSR flow graph"));
  assert.ok(source.includes("ReactFlow"));
  assert.ok(source.includes("response.flow_graph"));
  assert.ok(source.includes("FlowGraph JSON"));
  assert.equal(source.includes("Compact design move paths"), false);
  assert.equal(source.includes("slice(0, 7)"), false);
  assert.ok(source.includes('data-layout-mode={flowWide ? "flow-wide" : "standard"}'));
  assert.ok(source.includes("okf-chat-layout--flow-wide"));
  assert.ok(source.includes("{response && !flowWide && ("));
  assert.ok(source.includes("h-[650px]"));
  assert.ok(source.includes("min-[1050px]:h-[720px]"));
  assert.ok(source.includes('className="h-full w-full"'));
  assert.ok(source.includes("fitViewOptions={{ padding: 0.16 }}"));
  assert.ok(source.includes("w-full min-w-0"));
  assert.equal(source.includes("h-[620px]"), false);
});
test("DB health and chat debug expose Supabase clock-skew fallback metadata", () => {
  const retrieval = readFileSync(path.join(process.cwd(), "lib", "okf", "retrieval.ts"), "utf8");
  const dbHealth = readFileSync(path.join(process.cwd(), "app", "api", "health", "db", "route.ts"), "utf8");
  const chatRoute = readFileSync(path.join(process.cwd(), "app", "api", "okf", "chat", "route.ts"), "utf8");
  const ui = readFileSync(path.join(process.cwd(), "components", "okf-chat", "OkfChatWorkspace.tsx"), "utf8");
  assert.ok(retrieval.includes("PGRST303"));
  assert.ok(retrieval.includes("Supabase rejected JWT: local system clock may be out of sync."));
  assert.ok(dbHealth.includes("getOkfDatabaseHealthStatus"));
  assert.equal(dbHealth.includes("cookies("), false);
  assert.equal(dbHealth.includes("auth.get"), false);
  assert.ok(chatRoute.includes("getOkfKnowledgeBaseLoadMetadata"));
  assert.ok(ui.includes("DB loaded from"));
});
test("LLM health endpoint supports Gemini without exposing key-bearing URLs", () => {
  const source = readFileSync(path.join(process.cwd(), "app", "api", "health", "llm", "route.ts"), "utf8");
  assert.ok(source.includes("GEMINI_API_KEY"));
  assert.ok(source.includes("GEMINI_MODEL"));
  assert.ok(source.includes("geminiGenerateContentUrl"));
  assert.ok(source.includes("gemini-generate-content"));
  assert.ok(source.includes("RESOURCE_EXHAUSTED"));
  assert.ok(source.includes("UNAVAILABLE"));
  assert.ok(source.includes("healthCache"));
  assert.ok(source.includes("health_mode"));
  assert.ok(source.includes("shouldRunLiveHealth"));
  assert.ok(source.includes('url.searchParams.get("live") === "1"'));
  assert.ok(source.includes("safeBaseUrl"));
  assert.equal(source.includes("key=${"), false);
  assert.equal(source.includes("FEATHERLESS_API_KEY"), false);
});
test("Gemini provider enforces compact structured synthesis and server rendering", () => {
  const provider = readFileSync(path.join(process.cwd(), "lib", "llm", "gemini.ts"), "utf8");
  const contract = readFileSync(path.join(process.cwd(), "lib", "llm", "structured-synthesis.ts"), "utf8");
  const router = readFileSync(path.join(process.cwd(), "lib", "okf", "llm.ts"), "utf8");
  const selector = readFileSync(path.join(process.cwd(), "lib", "llm", "provider.ts"), "utf8");
  const ui = readFileSync(path.join(process.cwd(), "components", "okf-chat", "OkfChatWorkspace.tsx"), "utf8");
  assert.ok(provider.includes("generateContent"));
  assert.ok(provider.includes("buildCompactSynthesisContext"));
  assert.ok(provider.includes("guardStructuredSynthesis"));
  assert.ok(provider.includes('responseMimeType: "application/json"'));
  assert.ok(provider.includes("responseSchema: geminiStructuredSynthesisResponseSchema"));
  assert.ok(provider.includes("projectGeminiResponseSchema(structuredSynthesisJsonSchema)"));
  assert.equal(provider.includes("soovereign"), false);
  assert.ok(provider.includes("RESOURCE_EXHAUSTED"));
  assert.ok(contract.includes("structuredLlmSynthesisSchema"));
  assert.ok(contract.includes("renderStructuredSynthesisMarkdown"));
  assert.ok(contract.includes("fallback_validation_error"));
  assert.ok(router.includes('configuredProvider === "gemini"'));
  assert.ok(selector.includes('"gemini"'));
  assert.equal(selector.includes('"featherless"'), false);
  assert.ok(ui.includes('return "LLM synthesis used"'));
  assert.ok(ui.includes('return "LLM validation fallback"'));
  assert.ok(ui.includes("provider_metadata: synthesis.provider_metadata"));
  assert.ok(ui.includes("response.answer"));
  assert.equal(ui.includes("providerStatusText"), false);
});

test("Gemini request schema projection removes unsupported additionalProperties recursively", async () => {
  const deterministic = await answerOkfChat(productIdentityQuery, parseOkfLibrary());
  const previousFetch = globalThis.fetch;
  let requestBody: unknown;

  await withGeminiEnv(async () => {
    globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
      requestBody = JSON.parse(String(init?.body ?? "{}"));
      return new Response(JSON.stringify({
        candidates: [{ content: { parts: [{ text: structuredSynthesisJson(deterministic) }] }, finishReason: "STOP" }],
        usageMetadata: { promptTokenCount: 12, candidatesTokenCount: 8, totalTokenCount: 20 }
      }), { status: 200, headers: { "Content-Type": "application/json" } });
    }) as typeof fetch;
    try {
      const response = await synthesizeWithOptionalLlm(deterministic);
      assert.equal(response.runtime?.synthesis_mode, "gemini");
    } finally {
      globalThis.fetch = previousFetch;
    }
  });

  assert.ok(requestBody && typeof requestBody === "object");
  const generationConfig = (requestBody as {
    generationConfig?: { responseSchema?: Record<string, unknown> };
  }).generationConfig;
  const schema = generationConfig?.responseSchema;
  assert.ok(schema);
  assert.equal(JSON.stringify(schema).includes('"additionalProperties"'), false);
  assert.deepEqual(schema.required, [
    "opening_recommendation",
    "move_explanations",
    "architecture_direction",
    "limitations"
  ]);

  const properties = schema.properties as Record<string, Record<string, unknown>>;
  const moveExplanations = properties.move_explanations;
  assert.equal(moveExplanations.minItems, 1);
  assert.equal(moveExplanations.maxItems, 7);
  const moveItem = moveExplanations.items as Record<string, unknown>;
  assert.deepEqual(moveItem.required, ["move_id", "what_to_build", "reuse_logic", "adaptation_boundary"]);
  assert.ok(moveItem.properties && typeof moveItem.properties === "object");
});


test("final evaluation queries Q1-Q4 follow the new answer policies", async () => {
  const kb = parseOkfLibrary();

  const q1 = await answerOkfChat(productIdentityQuery, kb);
  assert.equal(q1.intent, "DESIGN_REUSE_FLOW_QUERY");
  for (const required of ["SHORT_END_STICK_2025", "SSI_KYC_FRAMEWORK_2022", "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024", "BLOCKCHAIN_IOT_SDPS_2019", "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024"]) assert.ok(q1.source_papers.some((paper) => paper.paper_id === required), `Q1 missing ${required}`);
  assert.equal(q1.source_papers.some((paper) => paper.paper_id === "PEER_REVIEW_TOKEN_INCENTIVES_2025"), false);
  assert.ok(q1.answer_plan?.design_moves.length || q1.answer_payload?.design_moves.length);

  const q2 = await answerOkfChat("Find me papers that discuss privacy-preserving identity, credentials, and revocation.", kb);
  assert.equal(q2.intent, "PAPER_DISCOVERY_QUERY");
  assert.equal(q2.source_papers[0].paper_id, "SSI_KYC_FRAMEWORK_2022");
  assert.ok(q2.source_papers.some((paper) => paper.paper_id === "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023"));
  assert.notEqual(q2.source_papers[0].paper_id, "BLOCKCHAIN_IOT_SDPS_2019");
  assert.equal(/Suggested architecture|Recommendation/i.test(q2.answer), false);

  const q3 = await answerOkfChat("Show me the design requirements and design principles from Blockchain for the IoT.", kb);
  assert.equal(q3.intent, "PAPER_ELEMENT_QUERY");
  assert.deepEqual([...new Set(q3.retrieved_concepts.map((concept) => concept.paper_id))], ["BLOCKCHAIN_IOT_SDPS_2019"]);
  assert.equal(q3.retrieved_concepts.filter((concept) => concept.type === "Design Requirement").length, 4);
  assert.equal(q3.retrieved_concepts.filter((concept) => concept.type === "Design Principle").length, 4);

  const q4 = await answerOkfChat("Build a Requirement -> Principle -> Feature flow for tamper-resistant sensor data protection.", kb);
  assert.equal(q4.intent, "DSR_FLOW_QUERY");
  assert.equal(q4.source_papers[0].paper_id, "BLOCKCHAIN_IOT_SDPS_2019");
  const q4NodeIds = new Set(q4.flow_graph.nodes.map((node) => node.id));
  assert.ok((q4.flow_rows ?? []).length > 0);
  assert.ok((q4.flow_rows ?? []).every((row) => row.concept_ids.every((id) => q4NodeIds.has(id))));
  assert.equal(q4.answer.includes("Sensor data collection"), true);
  assert.equal(q4.flow_graph.mode, "stored_paper_flow");
  assert.match(q4.answer, /The layered graph is in the Flow tab/i);
  assert.equal(/Design moves to reuse/i.test(q4.answer), false);
});

test("final evaluation queries Q5-Q10 pick the correct primary DSR source", async () => {
  const kb = parseOkfLibrary();
  const cases = [
    ["What design knowledge should I reuse for sensitive commercial data where parties compute or verify without exposing raw data?", "SHORT_END_STICK_2025", /proof of integrity|proof-of-integrity|nonreversible|joint approval/i],
    ["What design knowledge should I reuse for a B2B capacity marketplace with trust, reputation, and screening?", "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024", /signaling|screening|reputation|authority|fairness|deterrence/i],
    ["How should I structure the implementation lifecycle for a blockchain-based artifact?", "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024", /analysis, preliminary design, detailed design, construction, transition, maintenance, and retirement/i],
    ["What design knowledge should I reuse for token incentives and reviewer motivation?", "PEER_REVIEW_TOKEN_INCENTIVES_2025", /token|incentive|reviewer|motivation|reward/i],
    ["What design knowledge should I reuse for a fair inclusive marketplace?", "NIL_NFT_MARKETPLACE_2026", /inclusive|fair|meritocratic|market thickness|market safety|random minting|royalt/i],
    ["What design knowledge should I reuse for consent status and auditability?", "HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023", /consent|status|audit|permission|interoperability/i]
  ] as const;

  for (const [query, primary, pattern] of cases) {
    const response = await answerOkfChat(query, kb);
    assert.equal(response.source_papers[0].paper_id, primary, query);
    assert.match(response.answer, pattern, query);
  }
});

test("library stats queries return exact OKF counts", async () => {
  const kb = parseOkfLibrary();
  const papers = await answerOkfChat("How many papers are in the OKF library?", kb);
  assert.equal(papers.intent, "LIBRARY_STATS_QUERY");
  assert.equal(papers.library_stats?.counts.papers, kb.papers.length);
  assert.match(papers.answer, new RegExp(`${kb.papers.length} paper`));

  const researchQuestions = await answerOkfChat("How many research questions are in the library?", kb);
  const objectiveCount = kb.papers.filter((paper) => paper.research_objective.length > 0).length;
  assert.equal(researchQuestions.library_stats?.counts.by_type.ResearchQuestion, undefined);
  assert.match(researchQuestions.answer, /not a canonical DSR concept type/i);
  assert.match(researchQuestions.answer, new RegExp(`${objectiveCount} paper`));

  const principles = await answerOkfChat("How many design principles are stored?", kb);
  const principleCount = kb.concepts.filter((concept) => concept.type === "Design Principle").length;
  assert.equal(principles.library_stats?.counts.by_type["Design Principle"], principleCount);
  assert.match(principles.answer, new RegExp(`${principleCount} design principle`));

  const ambiguous = await answerOkfChat("How many questions are in the library?", kb);
  assert.equal(ambiguous.intent, "LIBRARY_STATS_QUERY");
  assert.match(ambiguous.answer, /not a canonical DSR concept type/i);
  assert.match(ambiguous.answer, new RegExp(`${objectiveCount} paper`));
});
test("negative ZKP and library overview queries stay deterministic and honest", async () => {
  const kb = parseOkfLibrary();
  const negative = await answerOkfChat("Which paper uses zero-knowledge proofs as a formal design principle?", kb);
  assert.equal(negative.intent, "NEGATIVE_OR_EXISTENCE_QUERY");
  assert.match(negative.answer, /did not find a formal stored Design Principle/i);
  assert.equal(/formal stored design principle match\(es\):\n1\./i.test(negative.answer), false);

  const overview = await answerOkfChat("List all papers currently in the OKF library.", kb);
  assert.equal(overview.intent, "LIBRARY_OVERVIEW_QUERY");
  assert.equal(kb.papers.length, 9);
  assert.equal(overview.source_papers.length, kb.papers.length);
  for (const paper of kb.papers) assert.ok(overview.answer.includes(paper.title));
});

test("final query interpreter handles tokenization, product-data reuse, coverage, and greetings", async () => {
  const kb = parseOkfLibrary();

  const tokenisation = await answerOkfChat("which paper has tokenisation", kb);
  assert.equal(tokenisation.intent, "PAPER_DISCOVERY_QUERY");
  assert.notEqual(tokenisation.intent, "CLARIFICATION_QUERY");
  assert.equal(tokenisation.source_papers[0].paper_id, "PEER_REVIEW_TOKEN_INCENTIVES_2025");
  assert.equal(tokenisation.source_papers[0].match_strength, "strong");

  const tokens = await answerOkfChat("find me paper which has tokens", kb);
  assert.equal(tokens.intent, "PAPER_DISCOVERY_QUERY");
  assert.notEqual(tokens.intent, "CLARIFICATION_QUERY");
  assert.equal(tokens.source_papers[0].paper_id, "PEER_REVIEW_TOKEN_INCENTIVES_2025");
  assert.equal(tokens.source_papers[0].match_strength, "strong");

  const formalTokenization = await answerOkfChat("which paper has tokenization as a formal design principle", kb);
  assert.equal(formalTokenization.intent, "NEGATIVE_OR_EXISTENCE_QUERY");
  assert.match(formalTokenization.answer, /did not find a formal stored Design Principle/i);
  assert.equal(/formal stored design principle match\(es\):\n1\./i.test(formalTokenization.answer), false);
  assert.match(formalTokenization.answer, /Design Feature|Design Principle|Related stored OKF material/i);

  const fragmentedProductData = await answerOkfChat("i want to create an application which solves the problem of fragmented product data, what principles and things i can reuse from the library, pls guide me", kb);
  assert.equal(fragmentedProductData.intent, "DESIGN_REUSE_QUERY");
  assert.notEqual(fragmentedProductData.intent, "CLARIFICATION_QUERY");
  for (const required of ["BLOCKCHAIN_IOT_SDPS_2019", "SHORT_END_STICK_2025", "SSI_KYC_FRAMEWORK_2022", "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024", "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024"]) assert.ok(fragmentedProductData.source_papers.some((paper) => paper.paper_id === required), required);
  assert.ok((fragmentedProductData.answer_payload?.design_moves.length ?? 0) >= 5);
  assert.match(fragmentedProductData.answer, /Design moves to reuse|canonical product|fragmented|product/i);

  const coverage = await answerOkfChat("are all the papers blockchain related in the library, find papers in the library that are not blockchain specific but are lit in general", kb);
  assert.equal(coverage.intent, "LIBRARY_COVERAGE_QUERY");
  assert.match(coverage.answer, /all 9 paper\(s\) are blockchain\/DLT-related/i);
  assert.match(coverage.answer, /No clearly non-blockchain general literature paper is loaded/i);
  assert.equal(coverage.library_coverage?.categories.find((category) => category.category === "non-blockchain general literature")?.count, 0);
  assert.equal(/I found \d+ strong match/i.test(coverage.answer), false);

  const evaluationDiscovery = await answerOkfChat("what papers do we have about evaluation methods", kb);
  assert.ok(["PAPER_DISCOVERY_QUERY", "EVALUATION_PLANNING_QUERY"].includes(evaluationDiscovery.intent));
  assert.notEqual(evaluationDiscovery.intent, "NEGATIVE_OR_EXISTENCE_QUERY");

  const hello = await answerOkfChat("hello", kb);
  assert.equal(hello.intent, "CLARIFICATION_QUERY");
  assert.equal(hello.source_papers.length, 0);
  assert.equal(hello.retrieved_concepts.length, 0);
});
test("paper discovery variants rank sources without architecture recommendations", async () => {
  const kb = parseOkfLibrary();
  const discoveryQueries = [
    ["Which papers have design principles for reputation and screening?", "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024"],
    ["Which papers contain features for off-chain storage and on-chain hash storage?", "BLOCKCHAIN_IOT_SDPS_2019"],
    ["Find papers that have token incentives or reviewer rewards.", "PEER_REVIEW_TOKEN_INCENTIVES_2025"],
    ["Find papers about zero-knowledge proofs as a formal design principle.", "NEGATIVE_OR_EXISTENCE_QUERY"]
  ] as const;

  for (const [query, expected] of discoveryQueries) {
    const response = await answerOkfChat(query, kb);
    if (expected === "NEGATIVE_OR_EXISTENCE_QUERY") assert.equal(response.intent, expected);
    else {
      assert.equal(response.intent, "PAPER_DISCOVERY_QUERY");
      assert.equal(response.source_papers[0].paper_id, expected, query);
      assert.equal(/Suggested architecture|Design moves to reuse/i.test(response.answer), false);
    }
  }
});
test("paper discovery separates strong and partial privacy credential matches", async () => {
  const kb = parseOkfLibrary();
  const response = await answerOkfChat("Find me papers that discuss privacy-preserving identity, credentials, and revocation.", kb);
  assert.equal(response.intent, "PAPER_DISCOVERY_QUERY");
  const matches = new Map((response.answer_plan?.paper_matches ?? []).map((match) => [match.paper_id, match]));
  assert.equal(matches.get("SSI_KYC_FRAMEWORK_2022")?.match_strength, "strong");
  for (const paperId of ["HIE_CONSENT_SELF_MANAGEMENT_BLOCKCHAIN_2023", "BLOCKCHAIN_IOT_SDPS_2019", "INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024", "TRUST_CAPACITY_EXCHANGE_BLOCKCHAIN_2024"]) {
    assert.notEqual(matches.get(paperId)?.match_strength, "strong", paperId);
  }
  assert.ok((response.answer_plan?.paper_matches ?? []).some((match) => match.match_strength === "partial"));
  assert.ok((response.answer_plan?.paper_matches ?? []).filter((match) => match.match_strength === "strong").length < (response.answer_plan?.paper_matches ?? []).length);
  assert.ok(response.source_papers.every((paper) => paper.match_strength === "strong" || paper.match_strength === "partial"));
  assertNoNakedPaperTitleTail(response);
});

test("paper discovery marks sensitive commercial data sources with focused strength", async () => {
  const kb = parseOkfLibrary();
  const response = await answerOkfChat("Which papers help me design interorganizational information sharing where companies can compute or verify shared information without exposing raw sensitive commercial data?", kb);
  assert.equal(response.intent, "PAPER_DISCOVERY_QUERY");
  const matches = new Map((response.answer_plan?.paper_matches ?? []).map((match) => [match.paper_id, match]));
  assert.equal(response.source_papers[0].paper_id, "SHORT_END_STICK_2025");
  assert.equal(matches.get("SHORT_END_STICK_2025")?.match_strength, "strong");
  assert.equal(matches.get("SSI_KYC_FRAMEWORK_2022")?.match_strength, "partial");
  assert.notEqual(matches.get("INTEGRATED_BLOCKCHAIN_ISDM_FRAMEWORK_2024")?.match_strength, "strong");
  assertNoNakedPaperTitleTail(response);
});

test("default answers do not end with a naked source-paper title list", async () => {
  const kb = parseOkfLibrary();
  const queries = [
    "How many papers are in the OKF library?",
    "Find me papers that discuss privacy-preserving identity, credentials, and revocation.",
    "Show me the design requirements and design principles from Blockchain for the IoT.",
    "Build a Requirement -> Principle -> Feature flow for tamper-resistant sensor data protection.",
    "Show evidence for revocation in the SSI KYC framework.",
    "What design knowledge should I reuse for sensitive commercial data where parties compute or verify without exposing raw data?",
    productIdentityQuery,
    "How should I structure the implementation lifecycle for a blockchain artifact?"
  ];
  for (const query of queries) assertNoNakedPaperTitleTail(await answerOkfChat(query, kb));
});

test("DSR flow answer strips command phrase from the human-readable subject", async () => {
  const kb = parseOkfLibrary();
  const response = await answerOkfChat("Build a Requirement -> Principle -> Feature flow for tamper-resistant sensor data protection.", kb);
  assert.equal(response.intent, "DSR_FLOW_QUERY");
  assert.equal(response.flow_view?.resolved_mode, "recommended");
  assert.match(response.answer, /^This Recommended Flow/);
  assert.match(response.answer, /Recommended stored pathway|stored graph\.json recommended paths|stored OKF relation fallback/i);
  assert.equal(/Build a Requirement/i.test(response.answer), false);
});

test("implementation lifecycle answer includes all seven ISDM stages with roles and models", async () => {
  const kb = parseOkfLibrary();
  const response = await answerOkfChat("How should I structure the implementation lifecycle for a blockchain artifact?", kb);
  assert.equal(response.intent, "IMPLEMENTATION_LIFECYCLE_QUERY");
  for (const stage of ["Analysis", "Preliminary design", "Detailed design", "Construction", "Transition", "Maintenance", "Retirement"]) assert.match(response.answer, new RegExp(stage, "i"));
  for (const rolePattern of [
    /Include blockchain user and legal professional roles/i,
    /Include architect role/i,
    /Include security, core blockchain developer, and smart-contract developer roles/i,
    /Include integrator and auditor roles/i
  ]) assert.match(response.answer, rolePattern);
  for (const modelPattern of [
    /Model use cases, prototypes, and requirements/i,
    /Model smart contracts, base architecture, and forking/i,
    /Model data flow, interactions, consensus, and transactions/i,
    /Model executable smart contracts/i
  ]) assert.match(response.answer, modelPattern);
  assert.match(response.answer, /Treat domain-specific controls as adaptations layered onto the stored process, role, and modeling structure/i);
});

test("Flow tab uses layered graph classes, edge provenance classes, and non-flow empty state", () => {
  const source = readFileSync(path.join(process.cwd(), "components", "okf-chat", "OkfChatWorkspace.tsx"), "utf8");
  for (const token of ["flow-node--requirement", "flow-node--principle", "flow-node--feature", "flow-node--artifact", "flow-edge--stored", "flow-edge--query-generated", "flow-edge--mixed", "data-dsr-layer", "#E9DDF7", "#DFF3E5", "#F4E2BF", "#E4EEF9"]) assert.ok(source.includes(token), token);
  assert.ok(source.includes("nodes={reactNodes}"));
  assert.ok(source.includes("edges={reactEdges}"));
  assert.ok(source.includes("No flow requested for this answer."));
});

test("source paper panel keeps role and reason compact while exposing discovery strength", () => {
  const source = readFileSync(path.join(process.cwd(), "components", "okf-chat", "OkfChatWorkspace.tsx"), "utf8");
  assert.ok(source.includes("sourcePaperReason"));
  assert.ok(source.includes("paper.match_strength"));
  assert.ok(source.includes("formatMatchStrength(paper.match_strength)"));
  assert.equal(source.includes("{paper.reason}</p>"), false);
});

test("Groq Markdown answer scrubs naked source-paper title tails", async () => {
  const kb = parseOkfLibrary();
  const deterministic = await answerOkfChat(productIdentityQuery, kb);
  const titleTail = deterministic.source_papers.slice(0, 3).map((paper) => paper.title).join("\n");
  const markdown = `# Recommendation\nUse the retrieved OKF papers for grounded design guidance.\n\n## Design moves to reuse\n1. Build a grounded move.\n\n## Suggested architecture direction\nKeep it grounded.\n\n## What not to overclaim\n- Do not overclaim.\n\n${titleTail}`;
  await withMockedGroq(markdown, async () => {
    const response = await synthesizeWithOptionalLlm(deterministic);
    assertNoNakedPaperTitleTail(response);
  });
});
function assertNoNakedPaperTitleTail(response: Awaited<ReturnType<typeof answerOkfChat>>) {
  assert.equal(/\nSource papers:\s*/i.test(response.answer), false, response.intent);
  assert.equal(hasNakedPaperTitleTail(response.answer, response.source_papers.map((paper) => paper.title)), false, response.intent);
}

function hasNakedPaperTitleTail(markdown: string, paperTitles: string[]) {
  const lines = markdown.trim().split(/\r?\n/);
  let index = lines.length - 1;
  const tail: string[] = [];
  while (index >= 0 && isBarePaperTitleLine(lines[index], paperTitles)) {
    tail.unshift(lines[index]);
    index -= 1;
    while (index >= 0 && !lines[index].trim()) index -= 1;
  }
  return tail.length >= 2;
}

function isBarePaperTitleLine(line: string, paperTitles: string[]) {
  const normalized = normalizeTitleForTail(line.replace(/^\s*(?:[-*]|\d+[.)])\s+/, ""));
  return paperTitles.some((title) => normalized === normalizeTitleForTail(title) || normalized === normalizeTitleForTail(title.includes(":") ? title.split(":")[0] : title));
}

function normalizeTitleForTail(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function structuredSynthesisObject(response: Awaited<ReturnType<typeof answerOkfChat>>, opening = "Use the supplied design moves as a bounded, evidence-grounded architecture recommendation.") {
  const moves = response.answer_plan?.design_moves ?? response.answer_payload?.design_moves ?? [];
  assert.ok(moves.length >= 5 && moves.length <= 7, `expected 5-7 canonical moves, got ${moves.length}`);
  return {
    opening_recommendation: opening,
    move_explanations: moves.map((move) => {
      const evidenceById = new Map(response.evidence.map((item) => [item.evidence_id, item.paraphrase]));
      const reuseBasis = [
        move.reused_requirement,
        move.reused_principle,
        move.candidate_feature,
        ...move.evidence_ids.slice(0, 1).map((evidenceId) => evidenceById.get(evidenceId))
      ].filter((value): value is string => Boolean(value)).slice(0, 2);
      return {
        move_id: move.id,
        what_to_build: `Implement ${move.what_to_build} as the bounded ${move.title} capability.`,
        reuse_logic: `Ground the move in these supplied OKF elements: ${reuseBasis.join("; ")}.`,
        adaptation_boundary: `Preserve the stored basis for ${move.title} and validate its target-domain behavior separately.`
      };
    }),
    architecture_direction: [
      "Separate protected records, verification proofs, identity controls, governance, and operational monitoring.",
      "Keep every implementation choice traceable to the canonical move that justifies it."
    ],
    limitations: ["The supplied evidence supports reusable design logic, not a completed or evaluated target-domain artifact."]
  };
}

function structuredSynthesisJson(response: Awaited<ReturnType<typeof answerOkfChat>>, opening?: string) {
  return JSON.stringify(structuredSynthesisObject(response, opening));
}

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

async function withGeminiEnv(fn: () => Promise<void>) {
  const previousProvider = process.env.LLM_PROVIDER;
  const previousChatProvider = process.env.CHAT_PROVIDER;
  const previousKey = process.env.GEMINI_API_KEY;
  const previousModel = process.env.GEMINI_MODEL;
  const previousPlannerModel = process.env.GEMINI_PLANNER_MODEL;
  const previousLiveTest = process.env.GEMINI_LIVE_TEST;
  const previousDisable = process.env.GEMINI_DISABLE_LIVE_SYNTHESIS;
  const previousGroqKey = process.env.GROQ_API_KEY;
  const previousGroqModel = process.env.GROQ_MODEL;
  const previousGroqDisable = process.env.GROQ_DISABLE_LIVE_SYNTHESIS;
  const previousExplicitLiveTest = process.env.OKF_LLM_SYNTHESIS_LIVE_TEST;
  const previousGlobalDisable = process.env.LLM_DISABLE_LIVE_SYNTHESIS;
  const previousCacheTtl = process.env.LLM_REQUEST_CACHE_TTL_MS;
  process.env.LLM_PROVIDER = "gemini";
  process.env.CHAT_PROVIDER = "gemini";
  process.env.GEMINI_API_KEY = "test-gemini-key";
  process.env.GEMINI_MODEL = "gemini-2.5-flash";
  process.env.GEMINI_PLANNER_MODEL = "gemini-2.5-flash-lite";
  process.env.GEMINI_LIVE_TEST = "false";
  process.env.GEMINI_DISABLE_LIVE_SYNTHESIS = "false";
  delete process.env.GROQ_API_KEY;
  delete process.env.GROQ_MODEL;
  process.env.GROQ_DISABLE_LIVE_SYNTHESIS = "false";
  process.env.OKF_LLM_SYNTHESIS_LIVE_TEST = "true";
  process.env.LLM_DISABLE_LIVE_SYNTHESIS = "false";
  process.env.LLM_REQUEST_CACHE_TTL_MS = "0";
  clearSuccessfulSynthesisCache();
  try {
    await fn();
  } finally {
    if (previousProvider === undefined) delete process.env.LLM_PROVIDER; else process.env.LLM_PROVIDER = previousProvider;
    if (previousChatProvider === undefined) delete process.env.CHAT_PROVIDER; else process.env.CHAT_PROVIDER = previousChatProvider;
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = previousKey;
    if (previousModel === undefined) delete process.env.GEMINI_MODEL; else process.env.GEMINI_MODEL = previousModel;
    if (previousPlannerModel === undefined) delete process.env.GEMINI_PLANNER_MODEL; else process.env.GEMINI_PLANNER_MODEL = previousPlannerModel;
    if (previousLiveTest === undefined) delete process.env.GEMINI_LIVE_TEST; else process.env.GEMINI_LIVE_TEST = previousLiveTest;
    if (previousDisable === undefined) delete process.env.GEMINI_DISABLE_LIVE_SYNTHESIS; else process.env.GEMINI_DISABLE_LIVE_SYNTHESIS = previousDisable;
    if (previousGroqKey === undefined) delete process.env.GROQ_API_KEY; else process.env.GROQ_API_KEY = previousGroqKey;
    if (previousGroqModel === undefined) delete process.env.GROQ_MODEL; else process.env.GROQ_MODEL = previousGroqModel;
    if (previousGroqDisable === undefined) delete process.env.GROQ_DISABLE_LIVE_SYNTHESIS; else process.env.GROQ_DISABLE_LIVE_SYNTHESIS = previousGroqDisable;
    if (previousExplicitLiveTest === undefined) delete process.env.OKF_LLM_SYNTHESIS_LIVE_TEST; else process.env.OKF_LLM_SYNTHESIS_LIVE_TEST = previousExplicitLiveTest;
    if (previousGlobalDisable === undefined) delete process.env.LLM_DISABLE_LIVE_SYNTHESIS; else process.env.LLM_DISABLE_LIVE_SYNTHESIS = previousGlobalDisable;
    if (previousCacheTtl === undefined) delete process.env.LLM_REQUEST_CACHE_TTL_MS; else process.env.LLM_REQUEST_CACHE_TTL_MS = previousCacheTtl;
    clearSuccessfulSynthesisCache();
  }
}

async function withMockedGemini(content: string | undefined, fn: () => Promise<void>, error?: Error, finishReason = "STOP") {
  const previousFetch = globalThis.fetch;
  await withGeminiEnv(async () => {
    globalThis.fetch = (async () => {
      if (error) throw error;
      return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: content }] }, finishReason }], usageMetadata: { promptTokenCount: 12, candidatesTokenCount: 8, totalTokenCount: 20 } }), { status: 200, headers: { "Content-Type": "application/json" } });
    }) as typeof fetch;
    try {
      await fn();
    } finally {
      globalThis.fetch = previousFetch;
    }
  });
}

async function withMockedGeminiError(status: number, body: unknown, fn: () => Promise<void>) {
  const previousFetch = globalThis.fetch;
  await withGeminiEnv(async () => {
    globalThis.fetch = (async () => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })) as typeof fetch;
    try {
      await fn();
    } finally {
      globalThis.fetch = previousFetch;
    }
  });
}
async function withMockedGeminiErrorThenGroq(status: number, body: unknown, groqContent: string, fn: (calls: () => number) => Promise<void>) {
  const previousFetch = globalThis.fetch;
  let callCount = 0;
  await withGeminiEnv(async () => {
    process.env.GROQ_API_KEY = "test-groq-key";
    process.env.GROQ_MODEL = "llama-3.3-70b-versatile";
    process.env.GROQ_DISABLE_LIVE_SYNTHESIS = "false";
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      callCount += 1;
      const url = String(input);
      if (url.includes("generativelanguage.googleapis.com")) return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
      if (url.includes("/chat/completions")) return new Response(JSON.stringify({ choices: [{ message: { content: groqContent }, finish_reason: "stop" }], usage: { prompt_tokens: 12, completion_tokens: 8, total_tokens: 20 } }), { status: 200, headers: { "Content-Type": "application/json" } });
      throw new Error(`Unexpected provider URL in test: ${url}`);
    }) as typeof fetch;
    try {
      await fn(() => callCount);
    } finally {
      globalThis.fetch = previousFetch;
    }
  });
}

async function withGroqEnv(fn: () => Promise<void>) {
  const previousProvider = process.env.LLM_PROVIDER;
  const previousChatProvider = process.env.CHAT_PROVIDER;
  const previousKey = process.env.GROQ_API_KEY;
  const previousModel = process.env.GROQ_MODEL;
  const previousSafeMode = process.env.GROQ_DAILY_SAFE_MODE;
  const previousDisable = process.env.GROQ_DISABLE_LIVE_SYNTHESIS;
  const previousBaseUrl = process.env.GROQ_BASE_URL;
  const previousExplicitLiveTest = process.env.OKF_LLM_SYNTHESIS_LIVE_TEST;
  const previousGlobalDisable = process.env.LLM_DISABLE_LIVE_SYNTHESIS;
  const previousCacheTtl = process.env.LLM_REQUEST_CACHE_TTL_MS;
  process.env.LLM_PROVIDER = "groq";
  process.env.CHAT_PROVIDER = "groq";
  process.env.GROQ_API_KEY = "test-key";
  process.env.GROQ_MODEL = "llama-3.3-70b-versatile";
  process.env.GROQ_BASE_URL = "https://api.groq.com/openai/v1";
  process.env.GROQ_DAILY_SAFE_MODE = "false";
  process.env.GROQ_DISABLE_LIVE_SYNTHESIS = "false";
  process.env.OKF_LLM_SYNTHESIS_LIVE_TEST = "true";
  process.env.LLM_DISABLE_LIVE_SYNTHESIS = "false";
  process.env.LLM_REQUEST_CACHE_TTL_MS = "0";
  clearSuccessfulSynthesisCache();
  try {
    await fn();
  } finally {
    if (previousProvider === undefined) delete process.env.LLM_PROVIDER; else process.env.LLM_PROVIDER = previousProvider;
    if (previousChatProvider === undefined) delete process.env.CHAT_PROVIDER; else process.env.CHAT_PROVIDER = previousChatProvider;
    if (previousKey === undefined) delete process.env.GROQ_API_KEY; else process.env.GROQ_API_KEY = previousKey;
    if (previousModel === undefined) delete process.env.GROQ_MODEL; else process.env.GROQ_MODEL = previousModel;
    if (previousBaseUrl === undefined) delete process.env.GROQ_BASE_URL; else process.env.GROQ_BASE_URL = previousBaseUrl;
    if (previousSafeMode === undefined) delete process.env.GROQ_DAILY_SAFE_MODE; else process.env.GROQ_DAILY_SAFE_MODE = previousSafeMode;
    if (previousDisable === undefined) delete process.env.GROQ_DISABLE_LIVE_SYNTHESIS; else process.env.GROQ_DISABLE_LIVE_SYNTHESIS = previousDisable;
    if (previousExplicitLiveTest === undefined) delete process.env.OKF_LLM_SYNTHESIS_LIVE_TEST; else process.env.OKF_LLM_SYNTHESIS_LIVE_TEST = previousExplicitLiveTest;
    if (previousGlobalDisable === undefined) delete process.env.LLM_DISABLE_LIVE_SYNTHESIS; else process.env.LLM_DISABLE_LIVE_SYNTHESIS = previousGlobalDisable;
    if (previousCacheTtl === undefined) delete process.env.LLM_REQUEST_CACHE_TTL_MS; else process.env.LLM_REQUEST_CACHE_TTL_MS = previousCacheTtl;
    clearSuccessfulSynthesisCache();
  }
}
async function withMockedGroqError(status: number, body: unknown, fn: () => Promise<void>) {
  const previousFetch = globalThis.fetch;
  await withGroqEnv(async () => {
    globalThis.fetch = (async () => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })) as typeof fetch;
    try {
      await fn();
    } finally {
      globalThis.fetch = previousFetch;
    }
  });
}

async function withMockedGroq(content: string | undefined, fn: (calls: () => number) => Promise<void>, error?: Error, finishReason = "stop") {
  const previousFetch = globalThis.fetch;
  let callCount = 0;
  await withGroqEnv(async () => {
    globalThis.fetch = (async () => {
      callCount += 1;
      if (error) throw error;
      return new Response(JSON.stringify({ choices: [{ message: { content }, finish_reason: finishReason }] }), { status: 200, headers: { "Content-Type": "application/json" } });
    }) as typeof fetch;
    try {
      await fn(() => callCount);
    } finally {
      globalThis.fetch = previousFetch;
    }
  });
}
async function withTemporaryEnv(overrides: Record<string, string | undefined>, fn: () => Promise<void>) {
  const previous = new Map(Object.keys(overrides).map((name) => [name, process.env[name]]));
  for (const [name, value] of Object.entries(overrides)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
  try {
    await fn();
  } finally {
    for (const [name, value] of previous) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}
test("strict OKF source validation rejects runtime-invisible collection data and invalid source extraction status", () => {
  const cases: Array<{
    file: "dsr.md" | "evidence.md" | "index.md";
    expectedCode: string;
    mutate: (source: string) => string;
  }> = [
    {
      file: "dsr.md",
      expectedCode: "CONCEPT_SECTION_LEVEL_INVALID",
      mutate: (source) => source.replace("## Concept:", "### Concept:")
    },
    {
      file: "evidence.md",
      expectedCode: "EVIDENCE_JSON_INVALID",
      mutate: (source) => source.replace('"id":', '"id"')
    },
    {
      file: "dsr.md",
      expectedCode: "CONCEPT_COLLECTION_EMPTY",
      mutate: (source) => `${source.match(/^---\s*\r?\n[\s\S]*?\r?\n---\s*\r?\n?/)?.[0] ?? ""}# Canonical DSR Concepts\n`
    },
    {
      file: "index.md",
      expectedCode: "PAPER_SOURCE_EXTRACTION_STATUS_INVALID",
      mutate: (source) => source.replace('extraction_status: "okf_draft"', 'extraction_status: "indexed_from_canonical_okf"')
    }
  ];

  for (const scenario of cases) {
    const tempRoot = path.join(mkdtempSync(path.join(tmpdir(), "okf-v1-validator-")), "okf");
    try {
      cpSync(fixtureRoot, tempRoot, { recursive: true });
      const target = path.join(tempRoot, "papers", "fixture-paper", scenario.file);
      writeFileSync(target, scenario.mutate(readFileSync(target, "utf8")), "utf8");
      const result = validateOkfSource(tempRoot);
      assert.equal(result.ok, false, scenario.expectedCode);
      assert.ok(result.errors.some((error) => error.code === scenario.expectedCode), scenario.expectedCode);
    } finally {
      rmSync(path.dirname(tempRoot), { recursive: true, force: true });
    }
  }
});

test("OKF indexing fails closed before writes when parsing is incomplete", async () => {
  const kb = parseOkfLibrary(fixtureRoot);
  kb.warnings.push({ file: "fixture/dsr.md", message: "synthetic incomplete parse" });
  await assert.rejects(() => indexOkfKnowledgeBase(kb), /Refusing to index an OKF knowledge base with parser warnings/);

  const script = readFileSync(path.join(process.cwd(), "scripts", "okf-index.ts"), "utf8");
  assert.ok(script.includes("validateOkfSource"));
  assert.ok(script.indexOf("validateOkfSource()") < script.indexOf("indexOkfKnowledgeBase(kb)"));
});

test("OKF v1 migration removes legacy review checks before data normalization and couples author verification", () => {
  const migration = readFileSync(path.join(process.cwd(), "supabase", "migrations", "20260714090000_okf_dsr_v1.sql"), "utf8");
  assert.ok(migration.indexOf("drop constraint if exists okf_papers_review_status_check") < migration.indexOf("update okf_papers set review_status = 'unreviewed'"));
  assert.ok(migration.indexOf("drop constraint if exists okf_concepts_review_status_check") < migration.indexOf("update okf_concepts set review_status = 'unreviewed'"));
  assert.match(migration, /check \(\(review_status = 'author_verified'\) = \(author_check_status = 'verified'\)\)/);
});

test("runtime index preserves explicit review metadata and runtime extraction semantics", () => {
  const indexer = readFileSync(path.join(process.cwd(), "lib", "okf", "indexer.ts"), "utf8");
  assert.ok(indexer.includes('extraction_status: "indexed_from_canonical_okf"'));
  assert.ok(indexer.includes("reviewed_by: reviewByPaperId.get(concept.paper_id)?.reviewed_by ?? null"));
  assert.ok(indexer.includes("reviewed_at: reviewByPaperId.get(concept.paper_id)?.reviewed_at ?? null"));
});
test("canonical paper objectives are not inferred from research questions", () => {
  const kb = parseOkfLibrary();
  assert.equal(kb.papers.length, 9);
  assert.ok(kb.papers.every((paper) => paper.research_objective.length === 0));
  assert.ok(kb.papers.every((paper) => paper.research_questions.length > 0));
  const normalizer = readFileSync(path.join(process.cwd(), "scripts", "normalize-okf-v1.ts"), "utf8");
  assert.equal(normalizer.includes("research_objective: researchQuestions"), false);
  assert.ok(normalizer.includes("research_objective: stringArray(indexDocument.frontmatter.research_objective)"));
});

test("all production bundles and TEMPLATE use the exact eight-file presentation contract", () => {
  const required = [...requiredOkfBundleFiles].sort();
  assert.deepEqual(required, [
    "README.md", "aliases.yaml", "dsr.md", "evidence.md", "graph.json", "index.md", "presentation.yaml", "relations.yaml"
  ]);

  const papersRoot = path.join(process.cwd(), "library", "okf", "papers");
  const paperDirs = readdirSync(papersRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory());
  assert.equal(paperDirs.length, 9);
  for (const entry of paperDirs) {
    assert.deepEqual(readdirSync(path.join(papersRoot, entry.name)).sort(), required, entry.name);
  }
  assert.deepEqual(readdirSync(path.join(process.cwd(), "library", "okf", "TEMPLATE")).sort(), required);

  const source = validateOkfSource();
  const template = validateOkfTemplate();
  assert.equal(source.ok, true, source.errors.map((error) => `${error.code}: ${error.message}`).join("\n"));
  assert.equal(template.ok, true, template.errors.map((error) => `${error.code}: ${error.message}`).join("\n"));

  const kb = parseOkfLibrary();
  assert.equal(kb.papers.length, 9);
  assert.ok(kb.papers.every((paper) => paper.presentation?.presentation_version === OKF_PRESENTATION_VERSION));
  assert.ok(kb.papers.every((paper) => paper.presentation?.paper_id === paper.paper_id));
  assert.ok(kb.papers.every((paper) => paper.presentation?.dsr_summary_grid.key_concepts.length));
  assert.ok(kb.papers.every((paper) => paper.review_status === "unreviewed"));
});

test("strict presentation validation rejects versions, IDs, unknown keys, and literal placeholders", () => {
  const scenarios: Array<{ code: string; mutate: (source: string) => string }> = [
    {
      code: "PRESENTATION_VERSION_INVALID",
      mutate: (source) => source.replace("presentation_version: workbench-v1", "presentation_version: workbench-v2")
    },
    {
      code: "PRESENTATION_PAPER_MISMATCH",
      mutate: (source) => source.replace("paper_id: FIXTURE_2026", "paper_id: WRONG_2026")
    },
    {
      code: "PRESENTATION_KEYS",
      mutate: (source) => `${source}\nunexpected_key: true\n`
    },
    {
      code: "LITERAL_PLACEHOLDER_FORBIDDEN",
      mutate: (source) => source.replace('domain_label: "Testing"', 'domain_label: "Not recorded"')
    }
  ];

  for (const scenario of scenarios) {
    const result = validateFixtureMutation("presentation.yaml", scenario.mutate);
    assert.equal(result.ok, false, scenario.code);
    assert.ok(result.errors.some((error) => error.code === scenario.code), scenario.code);
  }
});

test("strict presentation validation rejects missing and unknown nested keys", () => {
  const scenarios: Array<{ code: string; mutate: (source: string) => string }> = [
    {
      code: "PRESENTATION_CARD_KEYS",
      mutate: (source) => source.replace(', dlt_role: null}', "}")
    },
    {
      code: "PRESENTATION_CARD_KEYS",
      mutate: (source) => source.replace('dlt_role: null}', 'dlt_role: null, review_status: "unreviewed"}')
    }
  ];

  for (const scenario of scenarios) {
    const result = validateFixtureMutation("presentation.yaml", scenario.mutate);
    assert.equal(result.ok, false, scenario.code);
    assert.ok(result.errors.some((error) => error.code === scenario.code), scenario.code);
  }
});

test("empty presentation arrays require a field-specific migration note", () => {
  const emptyEvaluation = (source: string, note: string) => source
    .replace('evaluation_method: ["Fixture evaluation"]', "evaluation_method: []")
    .replace("migration_notes: []", `migration_notes: [${JSON.stringify(note)}]`);

  const unrelated = validateFixtureMutation("presentation.yaml", (source) => emptyEvaluation(source, "General migration completed."));
  assert.equal(unrelated.ok, false);
  const issue = unrelated.errors.find((error) => error.code === "PRESENTATION_EMPTY_ARRAY_UNEXPLAINED");
  assert.ok(issue);
  assert.match(issue.message, /overview\.evaluation_method/);

  const fieldSpecific = validateFixtureMutation("presentation.yaml", (source) => emptyEvaluation(
    source,
    "overview.evaluation_method: the source records no evaluation method."
  ));
  assert.equal(fieldSpecific.ok, true, fieldSpecific.errors.map((error) => `${error.code}: ${error.message}`).join("\n"));
});
test("strict graph source-reference validation rejects unknown keys, status values, and unrecorded review elevation", () => {
  const base = {
    type: "paper_figure",
    label: "Figure 1",
    page: 1,
    caption: "Fixture flow.",
    validation_status: "unreviewed",
    validation_notes: null
  };
  const scenarios: Array<{ code: string; source: Record<string, unknown> }> = [
    { code: "GRAPH_SOURCE_REFERENCE_KEYS", source: { ...base, unexpected: true } },
    { code: "GRAPH_SOURCE_REFERENCE_STATUS_INVALID", source: { ...base, validation_status: "reviewed" } },
    { code: "GRAPH_SOURCE_REFERENCE_REVIEW_METADATA_MISSING", source: { ...base, validation_status: "internally_validated" } }
  ];

  for (const scenario of scenarios) {
    const result = validateFixtureMutation("graph.json", (source) => {
      const graph = JSON.parse(source) as Record<string, unknown>;
      graph.source_reference = scenario.source;
      return `${JSON.stringify(graph, null, 2)}\n`;
    });
    assert.equal(result.ok, false, scenario.code);
    assert.ok(result.errors.some((error) => error.code === scenario.code), scenario.code);
  }
});

test("Workbench adapter and runtime index expose canonical presentation and source-reference data", async () => {
  const kb = parseOkfLibrary();
  const papers = await getWorkbenchPapers({ knowledgeBase: kb });
  assert.equal(papers.length, 9);
  assert.ok(papers.every((paper) => paper.presentation?.presentation_version === "workbench-v1"));
  assert.ok(papers.every((paper) => paper.presentation?.card.dlt_role?.trim()));
  assert.ok(papers.every((paper) => paper.doi_url?.startsWith("https://doi.org/")));

  const bundle = await getWorkbenchPaper("blockchain-iot-sdps-2019", { knowledgeBase: kb });
  assert.ok(bundle?.presentation);
  assert.equal(bundle.paper.domain, bundle.presentation.card.domain_label);
  assert.equal(bundle.paper.artifact_type, bundle.presentation.card.artifact_summary);
  assert.equal(bundle.paper.blockchain_dlt_role, bundle.presentation.card.dlt_role);
  assert.equal(bundle.paper.problem_description, bundle.presentation.dsr_summary_grid.problem);
  assert.equal(bundle.paper.canonical_paths?.presentation, "library/okf/papers/blockchain-iot-sdps-2019/presentation.yaml");
  assert.equal(bundle.flowGraph?.source_reference?.label, "Figure 3");
  assert.equal(bundle.flowGraph?.source_reference?.validation_status, "unreviewed");

  const canonical = kb.papers.find((paper) => paper.paper_id === "BLOCKCHAIN_IOT_SDPS_2019");
  assert.ok(canonical);
  const indexedMetadata = serializeOkfPaperMetadata(canonical);
  assert.deepEqual(indexedMetadata.graph_source_reference, canonical.graph_source_reference);
  const indexerSource = readFileSync(path.join(process.cwd(), "lib", "okf", "indexer.ts"), "utf8");
  assert.ok(indexerSource.includes("paper_metadata: serializeOkfPaperMetadata(paper)"));
  assert.ok(indexerSource.includes("presentation: paper.presentation ?? null"));
});

test("Workbench presentation UI defaults to Design Summary and keeps machine detail in advanced modes", () => {
  const paperSource = readFileSync(path.join(process.cwd(), "components", "workbench", "WorkbenchPaper.tsx"), "utf8");
  const landingSource = readFileSync(path.join(process.cwd(), "components", "workbench", "WorkbenchLanding.tsx"), "utf8");
  const flowSource = readFileSync(path.join(process.cwd(), "components", "workbench", "WorkbenchFlow.tsx"), "utf8");
  assert.ok(paperSource.includes('useState<"summary" | "matrix" | "catalog">("summary")'));
  assert.ok(paperSource.includes('data-workbench-dsr-default="design-summary"'));
  for (const heading of ["Problem", "Input Knowledge", "Research Process", "Key Concepts", "Solution", "Output Knowledge"]) {
    assert.ok(paperSource.includes(`title: "${heading}"`), heading);
  }
  assert.ok(paperSource.includes("Pathway Matrix"));
  assert.ok(paperSource.includes("Concept Catalog"));
  const summaryStart = paperSource.indexOf("function DesignSummary");
  const summaryEnd = paperSource.indexOf("function SummaryCard", summaryStart);
  const summarySource = paperSource.slice(summaryStart, summaryEnd);
  assert.equal(summarySource.includes("element_id"), false);
  assert.equal(summarySource.includes("evidence_count"), false);
  assert.ok(landingSource.includes("paper.presentation?.card"));
  assert.ok(landingSource.includes("Open DOI"));
  assert.equal(landingSource.includes('>Not recorded<'), false);
  assert.ok(flowSource.includes("sourceReference"));
  assert.ok(flowSource.includes("semantic"));
});

test("normal Workbench runtime has no legacy CSV dependency and corrections support presentation Git targets", () => {
  const runtimeFiles = [
    "lib/okf/workbench-adapter.ts",
    "app/api/workbench/papers/route.ts",
    "app/api/workbench/paper/[paperId]/route.ts",
    "components/workbench/WorkbenchLanding.tsx",
    "components/workbench/WorkbenchPaper.tsx",
    "components/workbench/WorkbenchFlow.tsx"
  ];
  for (const file of runtimeFiles) {
    const source = readFileSync(path.join(process.cwd(), file), "utf8");
    assert.equal(source.includes("lib/workbench/csv"), false, file);
    assert.equal(source.includes("papaparse"), false, file);
  }
  assert.ok(workbenchChangeFields.presentation.includes("dsr_summary_grid.problem"));
  assert.ok(workbenchChangeFields.presentation.includes("additional_context.limitations"));

  const migration = readFileSync(path.join(process.cwd(), "scripts", "migrate-legacy-presentation-to-okf.ts"), "utf8");
  assert.ok(migration.includes('presentation_version: "workbench-v1"'));
  assert.ok(migration.includes("if (fs.existsSync(file) && fs.readFileSync(file, \"utf8\") === content) return false"));
  assert.equal(migration.includes("new Date("), false);
});

test("presentation architecture preserves canonical and contextual data counts", () => {
  const kb = parseOkfLibrary();
  assert.equal(kb.concepts.length, 351);
  assert.equal(kb.relations.length, 577);
  assert.equal(kb.evidence_items.length, 306);
  const contextualClaims = kb.papers.reduce((count, paper) => (
    count + paper.research_questions.length + paper.theoretical_foundations.length + paper.limitations.length
  ), 0);
  assert.equal(contextualClaims, 92);

  const contextualRelations = kb.papers.reduce((count, paper) => {
    const lines = readFileSync(paper.source_file, "utf8").split(/\r?\n/);
    return count + lines.filter((line) => line.startsWith(`- ${String.fromCharCode(96)}`) && line.includes(":rel_")).length;
  }, 0);
  assert.equal(contextualRelations, 183);
});

function validateFixtureMutation(fileName: "presentation.yaml" | "graph.json", mutate: (source: string) => string) {
  const tempRoot = path.join(mkdtempSync(path.join(tmpdir(), "okf-presentation-validator-")), "okf");
  try {
    cpSync(fixtureRoot, tempRoot, { recursive: true });
    const target = path.join(tempRoot, "papers", "fixture-paper", fileName);
    writeFileSync(target, mutate(readFileSync(target, "utf8")), "utf8");
    return validateOkfSource(tempRoot);
  } finally {
    rmSync(path.dirname(tempRoot), { recursive: true, force: true });
  }
}
