import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  matchNativeOkfScopePapers,
  nativeOkfActiveMentionQuery,
  nativeOkfSlashCommand,
  type NativeOkfScopePaper,
} from "../shared/paper-scope.ts";

const PAPERS: NativeOkfScopePaper[] = [
  { paperId: "blockchain-iot-sensor-data", title: "Blockchain for the IoT", authors: ["A. Researcher"] },
  { paperId: "consent-self-management-hie", title: "Consent self-management for health information exchange", authors: ["B. Author"] },
  { paperId: "ambivalence-trust-loyalty", title: "From ambivalence to trust: blockchain loyalty programs", authors: ["C. Writer"] },
  { paperId: "decentralized-procurement-logistics", title: "Decentralized procurement and logistics", authors: ["D. Scholar"] },
];

async function source(path: string): Promise<string> {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("the shared resolver returns every paper in title order for an empty query", () => {
  const matches = matchNativeOkfScopePapers("", PAPERS, 10);
  assert.equal(matches.length, PAPERS.length);
  assert.deepEqual(
    matches.map((paper) => paper.title),
    [...PAPERS.map((paper) => paper.title)].sort((left, right) =>
      left.toLocaleLowerCase("en").localeCompare(right.toLocaleLowerCase("en"), "en")
    ),
  );
});

test("the shared resolver ranks by title, token, and author, never silently picking one for an ambiguous query", () => {
  const consent = matchNativeOkfScopePapers("consent", PAPERS);
  assert.equal(consent[0]?.paperId, "consent-self-management-hie");

  const blockchain = matchNativeOkfScopePapers("blockchain", PAPERS);
  assert.ok(blockchain.length >= 2, "ambiguous query must surface all matches");
  assert.ok(
    blockchain.some((paper) => paper.paperId === "blockchain-iot-sensor-data") &&
      blockchain.some((paper) => paper.paperId === "ambivalence-trust-loyalty"),
  );

  assert.equal(
    matchNativeOkfScopePapers("procurement", PAPERS)[0]?.paperId,
    "decentralized-procurement-logistics",
  );
});

test("@ mention detection only fires on a live composer token", () => {
  assert.deepEqual(nativeOkfActiveMentionQuery("@", 1), { start: 0, query: "" });
  assert.deepEqual(nativeOkfActiveMentionQuery("tell me about @block", 20), {
    start: 14,
    query: "block",
  });
  assert.equal(nativeOkfActiveMentionQuery("email me at foo@bar.com", 23), null);
  assert.equal(nativeOkfActiveMentionQuery("@block ", 7), null);
});

test("slash-command detection covers /paper, /all, /new only", () => {
  assert.deepEqual(nativeOkfSlashCommand("/paper"), { command: "paper", argument: "" });
  assert.deepEqual(nativeOkfSlashCommand("/paper trust"), {
    command: "paper",
    argument: "trust",
  });
  assert.deepEqual(nativeOkfSlashCommand("/all"), { command: "all", argument: "" });
  assert.deepEqual(nativeOkfSlashCommand("/new"), { command: "new", argument: "" });
  assert.equal(nativeOkfSlashCommand("what is /paper"), null);
  assert.equal(nativeOkfSlashCommand("/compare a and b"), null);
});

test("@ and /paper reuse the one shared picker and resolver", async () => {
  const workbench = await source("components/chat/ChatWorkbench.tsx");
  const control = await source("components/chat/PaperScopeControl.tsx");
  const picker = await source("components/chat/PaperScopePicker.tsx");
  const scope = await source("shared/paper-scope.ts");

  // The visible selector, the `@` reference, and the `/paper` command all render
  // the same PaperScopePicker.
  assert.ok((workbench.match(/<PaperScopePicker/gu) ?? []).length >= 2);
  assert.match(control, /<PaperScopePicker/u);
  // One resolver only.
  assert.match(picker, /matchNativeOkfScopePapers/u);
  assert.match(scope, /export function matchNativeOkfScopePapers/u);
  assert.doesNotMatch(picker, /function\s+\w*[Mm]atch\w*Papers/u);
});

test("the picker is a keyboard-navigable listbox", async () => {
  const picker = await source("components/chat/PaperScopePicker.tsx");
  assert.match(picker, /role="combobox"/u);
  assert.match(picker, /role="listbox"/u);
  assert.match(picker, /role="option"/u);
  assert.match(picker, /aria-activedescendant/u);
  assert.match(picker, /"ArrowDown"/u);
  assert.match(picker, /"ArrowUp"/u);
  assert.match(picker, /"Enter"/u);
  assert.match(picker, /"Escape"/u);
});

test("the scope chip is explicit, restricted, and keyboard-removable", async () => {
  const control = await source("components/chat/PaperScopeControl.tsx");
  assert.match(control, /Paper scope:/u);
  assert.match(control, /Answers and citations are restricted to this paper\./u);
  assert.match(control, /aria-label="Clear paper scope and return to all papers"/u);
  assert.match(control, /All papers/u);
  assert.match(control, /onScopeChange\(\{ type: "corpus" \}\)/u);
});

test("every paper page exposes an in-page Ask about this paper drawer", async () => {
  const launcher = await source("components/chat/PaperChatLauncher.tsx");
  const workbench = await source("components/WorkbenchView.tsx");
  assert.match(launcher, /Ask about this paper/u);
  assert.match(launcher, /role="dialog"/u);
  assert.match(launcher, /aria-modal="true"/u);
  assert.match(launcher, /aria-label="Close the paper chat"/u);
  assert.match(launcher, /event\.key === "Escape"/u);
  assert.match(launcher, /lockedPaperId=\{paperId\}/u);
  assert.match(launcher, /variant="drawer"/u);
  assert.match(workbench, /<PaperChatLauncher/u);
  assert.match(workbench, /isPaper && scopePapers/u);
});

/**
 * Regression: the paper drawer is locked to its paper, so `/all` cannot work
 * there. Advertising it in the drawer's own footer while silently clearing the
 * composer told the researcher to do something that did nothing at all.
 */
test("a locked paper chat neither advertises nor silently swallows /all", async () => {
  const workbench = await source("components/chat/ChatWorkbench.tsx");
  // The hint is offered only when broadening is actually possible.
  assert.match(
    workbench,
    /\{lockedScope \? null : \(\s*<>\s*<span className="font-semibold">\/all<\/span>/u,
  );
  // A locked `/all` reports why instead of clearing the composer.
  const commandStart = workbench.indexOf('if (command.command === "all")');
  assert.ok(commandStart > 0, "the /all command branch must exist");
  const branch = workbench.slice(commandStart, commandStart + 700);
  // Reported as an informational notice, never as a failed request.
  assert.match(branch, /if \(lockedScope\) \{[\s\S]*?setNotice\(/u);
  assert.doesNotMatch(branch, /if \(lockedScope\) \{[\s\S]*?setError\(/u);
  const lockedGuard = branch.indexOf("if (lockedScope)");
  const clears = branch.indexOf('updateComposer("")');
  assert.ok(
    lockedGuard >= 0 && clears > lockedGuard,
    "the locked check must short-circuit before the composer is cleared",
  );
});

test("Open full chat from the drawer preserves the selected paper scope", async () => {
  const workbench = await source("components/chat/ChatWorkbench.tsx");
  assert.match(workbench, /Open full chat/u);
  // The handoff carries the canonical paperId on the canonical chat route; the
  // title is never used as identity and the path is never hand-written.
  assert.match(
    workbench,
    /NATIVE_OKF_PUBLIC_ROUTES\.chat\}\?paper=\$\{\s*encodeURIComponent\(scope\.paperId\)/u,
  );
  assert.doesNotMatch(workbench, /\?paper=\$\{[^}]*\btitle\b/u);
  const page = await readFile(
    new URL("../../../app/native-okf/chat/page.tsx", import.meta.url),
    "utf8",
  );
  assert.match(page, /resolvedSearchParams\.paper/u);
  assert.match(page, /\{ type: "paper", paperId: requestedPaperId \}/u);
  // A `?paper=` value that is not a canonical paper fails safe to corpus.
  assert.match(
    page,
    /scopePapers\.some\(\(paper\) => paper\.paperId === requestedPaperId\)/u,
  );
});

/**
 * Regression: an explicitly requested scope (the drawer's locked paper, or the
 * `?paper=` deep link behind "Open full chat") must outrank the scope stored in
 * a restored tab session. Otherwise opening the full chat from a paper drawer
 * silently lands back in All papers whenever a prior conversation exists in the
 * tab, contradicting the visible handoff.
 */
test("an explicitly requested scope outranks the restored session scope", async () => {
  const workbench = await source("components/chat/ChatWorkbench.tsx");
  assert.match(
    workbench,
    /const restoredScope = lockedScope \?\? initialScope \?\?\s*restored\.conversationState\.scope;/u,
  );
});

/**
 * Regression: the picker must reach every canonical paper when a researcher
 * browses without typing. A fixed page size silently hid most of the library.
 */
test("the picker offers every canonical paper for an empty browse query", async () => {
  const picker = await source("components/chat/PaperScopePicker.tsx");
  assert.match(picker, /matchNativeOkfScopePapers\(query, papers, papers\.length\)/u);

  const many: NativeOkfScopePaper[] = Array.from({ length: 34 }, (_, index) => ({
    paperId: `paper-${index}`,
    title: `Paper number ${index}`,
    authors: [],
  }));
  assert.equal(
    matchNativeOkfScopePapers("", many, many.length).length,
    many.length,
  );
});
