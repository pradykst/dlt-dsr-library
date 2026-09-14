import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  PAPER_SCOPE_POPOVER_PREFERRED_WIDTH,
  PAPER_SCOPE_POPOVER_VIEWPORT_MARGIN,
  paperScopePopoverPlacement,
} from "../components/chat/paper-scope-popover-placement.ts";
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

test("@ and /paper reuse the one shared picker, popover, and resolver", async () => {
  const workbench = await source("components/chat/ChatWorkbench.tsx");
  const control = await source("components/chat/PaperScopeControl.tsx");
  const popover = await source("components/chat/PaperScopePopover.tsx");
  const picker = await source("components/chat/PaperScopePicker.tsx");
  const scope = await source("shared/paper-scope.ts");

  // The visible selector, the `@` reference, and the `/paper` command all mount
  // the same picker through the same positioning layer.
  assert.ok((workbench.match(/<PaperScopePopover/gu) ?? []).length >= 2);
  assert.match(control, /<PaperScopePopover/u);
  assert.doesNotMatch(workbench, /<PaperScopePicker/u);
  assert.doesNotMatch(control, /<PaperScopePicker/u);
  // Exactly one render site for the picker itself: no duplicate implementation.
  assert.equal((popover.match(/<PaperScopePicker/gu) ?? []).length, 1);
  // One resolver only.
  assert.match(picker, /matchNativeOkfScopePapers/u);
  assert.match(scope, /export function matchNativeOkfScopePapers/u);
  assert.doesNotMatch(picker, /function\s+\w*[Mm]atch\w*Papers/u);
});

/**
 * Regression: the picker used to be an absolutely positioned child of the
 * composer, left-aligned to a right-aligned control. Inside the chat panel's
 * rounded `overflow-hidden` card that clipped it, and where it overhung the
 * page it extended the document's scrollable width, so the popover looked
 * detached, was cut off, and could introduce a horizontal scrollbar. It is now
 * a viewport-positioned panel with a bounded, clamped placement.
 */
test("the picker popover is viewport-positioned and never sized by document flow", async () => {
  const popover = await source("components/chat/PaperScopePopover.tsx");
  const workbench = await source("components/chat/ChatWorkbench.tsx");
  const control = await source("components/chat/PaperScopeControl.tsx");
  const picker = await source("components/chat/PaperScopePicker.tsx");

  assert.match(popover, /position: "fixed"/u);
  assert.match(popover, /paperScopePopoverPlacement/u);
  // It stacks above the sticky site header (z-40).
  assert.match(popover, /className="z-50"/u);
  // No absolutely positioned picker wrapper survives in either mount site, and
  // no viewport-unit width that ignores where the control actually sits.
  assert.doesNotMatch(workbench, /absolute bottom-full/u);
  assert.doesNotMatch(control, /absolute bottom-full/u);
  assert.doesNotMatch(picker, /\d+vw/u);
  // The panel is bounded by the popover and scrolls its list internally.
  assert.match(picker, /maxHeight/u);
  assert.match(picker, /overflow-y-auto/u);
  assert.match(picker, /break-words/u);
});

test("popover placement stays inside the viewport at desktop, laptop, and mobile widths", () => {
  const margin = PAPER_SCOPE_POPOVER_VIEWPORT_MARGIN;
  const viewports = [
    { width: 1920, height: 1080 },
    { width: 1440, height: 900 },
    { width: 1280, height: 720 },
    { width: 1024, height: 640 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
    { width: 320, height: 568 },
  ];
  for (const viewport of viewports) {
    // Anchors at the far left, the middle, and the far right of the viewport,
    // plus near the top and near the bottom.
    const anchors = [
      { left: 0, right: 120, top: 40, bottom: 70 },
      { left: Math.max(0, viewport.width / 2 - 60), right: viewport.width / 2 + 60, top: viewport.height / 2, bottom: viewport.height / 2 + 30 },
      { left: Math.max(0, viewport.width - 140), right: viewport.width, top: viewport.height - 90, bottom: viewport.height - 60 },
    ];
    for (const anchor of anchors) {
      const placement = paperScopePopoverPlacement(anchor, viewport.width, viewport.height);
      const context = `${viewport.width}x${viewport.height} @ ${anchor.left}`;

      assert.ok(placement.width > 0, context);
      assert.ok(
        placement.width <= PAPER_SCOPE_POPOVER_PREFERRED_WIDTH,
        `${context}: never wider than the preferred width`,
      );
      assert.ok(
        placement.width <= Math.max(placement.width, viewport.width),
        `${context}: never wider than the viewport`,
      );
      assert.ok(placement.left >= 0, `${context}: never off the left edge`);
      assert.ok(
        placement.left + placement.width <= viewport.width,
        `${context}: never off the right edge (no horizontal page scrolling)`,
      );
      assert.ok(placement.maxHeight > 0, context);
      // Exactly one vertical anchor, and it stays on screen.
      assert.equal(
        (placement.top === undefined ? 0 : 1) + (placement.bottom === undefined ? 0 : 1),
        1,
        `${context}: exactly one vertical anchor`,
      );
      if (placement.top !== undefined) {
        assert.ok(placement.top >= margin && placement.top < viewport.height, context);
      } else {
        assert.ok(placement.bottom! >= margin && placement.bottom! < viewport.height, context);
      }
    }
  }
});

/**
 * Regression: on a wide desktop the chat panel is a centred column, so a
 * right-aligned control that still had viewport room to its right opened a
 * panel floating well outside the column and reading as detached. The popover
 * stays inside the content region it belongs to.
 */
test("popover placement stays inside the chat panel's content region on desktop", () => {
  // A 1920px viewport with a 1216px centred content column.
  const panel = { left: 352, right: 1568 };
  const control = { left: 1433, right: 1543, top: 700, bottom: 730 };
  const placement = paperScopePopoverPlacement(control, 1920, 1000, panel);

  assert.equal(placement.width, PAPER_SCOPE_POPOVER_PREFERRED_WIDTH);
  assert.ok(
    placement.left >= panel.left,
    "the popover starts inside the content region",
  );
  assert.ok(
    placement.left + placement.width <= panel.right,
    "the popover ends inside the content region",
  );
  // Right-aligned to the control it belongs to.
  assert.equal(placement.left + placement.width, control.right);

  // A full-width anchor inside the same panel keeps its natural left alignment.
  const composer = { left: 368, right: 1552, top: 700, bottom: 800 };
  const composerPlacement = paperScopePopoverPlacement(composer, 1920, 1000, panel);
  assert.equal(composerPlacement.left, composer.left);
  assert.ok(composerPlacement.left + composerPlacement.width <= panel.right);

  // A bounds region narrower than the minimum width is ignored in favour of the
  // viewport, so the popover is never squeezed into an unusable sliver.
  const sliver = paperScopePopoverPlacement(control, 1920, 1000, { left: 900, right: 940 });
  assert.ok(sliver.width >= 200);
  assert.ok(sliver.left >= 0 && sliver.left + sliver.width <= 1920);

  // Bounds wider than the viewport still cannot push the popover off-screen.
  const overflowing = paperScopePopoverPlacement(
    { left: 300, right: 380, top: 500, bottom: 530 },
    360,
    780,
    { left: -200, right: 900 },
  );
  assert.ok(overflowing.left >= 0);
  assert.ok(overflowing.left + overflowing.width <= 360);
});

test("popover placement flips alignment and direction instead of overflowing", () => {
  // A right-aligned control on a wide desktop: left-aligning the panel would
  // run past the right edge, so it right-aligns to the control instead.
  const rightControl = paperScopePopoverPlacement(
    { left: 1180, right: 1268, top: 600, bottom: 630 },
    1280,
    800,
  );
  assert.equal(rightControl.width, PAPER_SCOPE_POPOVER_PREFERRED_WIDTH);
  assert.equal(rightControl.left, 1268 - PAPER_SCOPE_POPOVER_PREFERRED_WIDTH);
  assert.ok(rightControl.bottom !== undefined, "opens upward from the composer");

  // A control near the top of a short viewport has no room above, so the panel
  // opens downward rather than off-screen.
  const topControl = paperScopePopoverPlacement(
    { left: 20, right: 140, top: 24, bottom: 54 },
    1280,
    800,
  );
  assert.ok(topControl.top !== undefined, "flips downward when there is no room above");

  // Narrow viewport: the panel is bounded by the viewport, not by 22rem.
  const mobile = paperScopePopoverPlacement(
    { left: 16, right: 130, top: 700, bottom: 730 },
    360,
    780,
  );
  assert.equal(mobile.width, 360 - PAPER_SCOPE_POPOVER_VIEWPORT_MARGIN * 2);
  assert.equal(mobile.left, PAPER_SCOPE_POPOVER_VIEWPORT_MARGIN);
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
  assert.match(control, /papers.*selected/u);
  assert.match(control, /Answers and citations are restricted to the selected papers\./u);
  assert.match(control, /aria-label=\{`Remove \$\{title\}`\}/u);
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
    /NATIVE_OKF_PUBLIC_ROUTES\.chat\}\?paper=\$\{\s*encodeURIComponent\(scope\.paperIds\[0\]!\)/u,
  );
  assert.doesNotMatch(workbench, /\?paper=\$\{[^}]*\btitle\b/u);
  const page = await readFile(
    new URL("../../../app/native-okf/chat/page.tsx", import.meta.url),
    "utf8",
  );
  assert.match(page, /resolvedSearchParams\.paper/u);
  assert.match(page, /\{ type: "papers", paperIds: \[requestedPaperId\] \}/u);
  // A noncanonical deep link fails closed.
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
