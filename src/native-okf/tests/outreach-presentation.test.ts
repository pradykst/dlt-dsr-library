import "server-only";
import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";
import { getAllPapers } from "../server/repository.ts";
import { getPaperWorkbenchViewModel } from "../server/workbench.ts";
import { resolvePaperPublication, designKnowledgeGithubHref } from "../shared/paper-publication.ts";
import { CANONICAL_ROUTES, NATIVE_OKF_CANONICAL_REWRITES } from "../shared/routes.ts";

test("all canonical paper models use the same complete publication presentation", async () => {
  let doiCount = 0;
  let fallbackCount = 0;
  for (const paper of await getAllPapers()) {
    const view = await getPaperWorkbenchViewModel(paper.id.replace(/^papers\//u, ""));
    assert.ok(view);
    const publication = resolvePaperPublication(view.concept);
    assert.ok(publication.href, paper.id);
    if (paper.resource?.includes("doi.org/")) {
      doiCount++;
      assert.equal(publication.label, "DOI");
      assert.equal(publication.href, paper.resource);
    } else {
      fallbackCount++;
      assert.equal(publication.label, "Publication");
      assert.equal(publication.href?.replace(/\/$/u, ""), paper.resource?.replace(/\/$/u, ""));
    }
    assert.equal(publication.githubHref, designKnowledgeGithubHref(paper));
    assert.ok(publication.githubHref?.endsWith(`/knowledge/okf/${paper.filePath}`));
    await access(new URL(`../../../knowledge/okf/${paper.filePath}`, import.meta.url));
    assert.doesNotMatch(publication.text, /\.pdf|\.md|source evidence|filename/iu);
  }
  assert.ok(doiCount > 0 && fallbackCount > 0);
});

test("publication resolver handles missing, varied and unsafe metadata without borrowing cited DOIs", () => {
  const paper = { id: "papers/example", filePath: "papers/example.md", markdownBody: "## References\nhttps://doi.org/10.1234/unrelated", frontmatter: {} };
  assert.equal(resolvePaperPublication(paper).href, undefined);
  assert.equal(resolvePaperPublication(paper).text, "Publication link unavailable");
  assert.equal(resolvePaperPublication({ ...paper, frontmatter: { doi: "10.1234/example" } }).href, "https://doi.org/10.1234/example");
  assert.equal(resolvePaperPublication({ ...paper, frontmatter: { source_url: "https://publisher.example/paper" } }).href, "https://publisher.example/paper");
  assert.equal(resolvePaperPublication({ ...paper, resource: "javascript:alert(1)" }).href, undefined);
  assert.equal(designKnowledgeGithubHref({ ...paper, filePath: "papers/../secret.md" }), undefined);
});

test("legal routes replace method exposure and all pages share footer links", async () => {
  assert.deepEqual(Object.values(CANONICAL_ROUTES), ["/", "/library", "/chat", "/imprint", "/privacy"]);
  assert.ok(!NATIVE_OKF_CANONICAL_REWRITES.some(r => r.source === "/method"));
  await assert.rejects(access("app/native-okf/method/page.tsx"));
  for (const path of ["app/imprint/page.tsx", "app/privacy/page.tsx"]) await access(path);
  const footer = await readFile("components/layout/SiteFooter.tsx", "utf8");
  assert.match(footer, /label: "Imprint"/u);
  assert.match(footer, /label: "Privacy"/u);
  assert.doesNotMatch(footer, /Method and limitations|Privacy note/u);
  const page = await readFile("src/native-okf/components/WorkbenchView.tsx", "utf8");
  assert.doesNotMatch(page, /Open source resource|label: "DOI"/u);
  assert.match(page, /resolvePaperPublication\(concept\)/u);
  assert.match(await readFile("src/native-okf/components/chat/ChatWorkbench.tsx", "utf8"), /Generate mapping diagram/u);
});

test("legal pages retain project contact and omit removed institutional copy", async () => {
  const imprint = await readFile("app/imprint/page.tsx", "utf8");
  for (const detail of ["Research and project contact", "Max Gräser", "Research Assistant", "Information Systems Institute", "Chair of Application Systems", "Universität Leipzig", "Grimmaische Straße 12, Room I 230", "04109 Leipzig", "Germany", "+49 341 97 33605", "max.graeser@uni-leipzig.de"]) {
    assert.ok(imprint.includes(detail), detail);
  }
  assert.match(imprint, /<a href="https:\/\/www\.wifa\.uni-leipzig\.de\/impressum" target="_blank" rel="noopener noreferrer">Official Faculty legal notice<\/a>/u);
  assert.equal((imprint.match(/<section>/gu) ?? []).length, 1);
  assert.doesNotMatch(imprint, /Institution<|Legal form|Rector|Supervisory authority|VAT|Content responsibility|Ritterstraße|Dean:|Wigardstraße/iu);

  const privacy = await readFile("app/privacy/page.tsx", "utf8");
  assert.match(privacy, /<NativeOkfShell title="Privacy"/u);
  assert.match(privacy, /<p>Project contact: Max Gräser,/u);
  assert.doesNotMatch(privacy, /represented by the Rector Prof\. Dr\. Eva Inés Obergfell|Ritterstraße 26, 04109 Leipzig, Germany|is responsible for this research service/u);
});

test("product-owned UI strings contain no em dashes or paper-specific literals", async () => {
  const papers = await getAllPapers();
  async function checkDirectory(directory: string): Promise<void> {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = `${directory}/${entry.name}`;
      if (entry.isDirectory()) { await checkDirectory(path); continue; }
      if (!/\.tsx?$/u.test(path) || path.endsWith("generated-prose.ts")) continue;
      const source = await readFile(path, "utf8");
      const ast = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
      function visit(node: ts.Node) {
        if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isJsxText(node)) {
          assert.ok(!node.text.includes("\u2014"), `${path}: ${node.text}`);
          for (const paper of papers) {
            assert.ok(!node.text.includes(paper.id.replace(/^papers\//u, "")), `${path}: hardcoded ${paper.id}`);
            if (paper.title) assert.ok(!node.text.includes(paper.title), `${path}: hardcoded title`);
          }
        }
        ts.forEachChild(node, visit);
      }
      visit(ast);
    }
  }
  for (const directory of ["src/native-okf/components", "src/native-okf/shared", "components/layout", "app/imprint", "app/privacy"]) await checkDirectory(directory);
});

test("stored node height and title layout reserve consistent chrome", async () => {
  const source = await readFile("src/native-okf/components/PaperDesignMap.tsx", "utf8");
  assert.match(source, /data-stored-map-node/u);
  assert.match(source, /grid place-items-center/u);
  assert.match(source, /absolute right-3\.5 top-1/u);
  assert.match(source, /data-stored-map-title/u);
  assert.doesNotMatch(source, /flex flex-1 items-center py-2/u);
});
