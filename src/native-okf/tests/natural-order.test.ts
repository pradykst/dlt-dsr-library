import assert from "node:assert/strict";
import test from "node:test";

import {
  compareNaturalOrder,
  compareNumberedConceptOrder,
} from "../shared/natural-order.ts";

function shuffled<T>(values: readonly T[]): T[] {
  // Deterministic reversal is enough to prove the comparator, not the input order.
  return [...values].reverse();
}

test("orders DR1..DR14 numerically so DR10 never precedes DR2", () => {
  const expected = Array.from({ length: 14 }, (_, index) => `DR${index + 1}`);
  const sorted = shuffled(expected).sort(compareNaturalOrder);
  assert.deepEqual(sorted, expected);

  // Guard the specific regression from the researcher's report.
  assert.ok(sorted.indexOf("DR2") < sorted.indexOf("DR10"));
  assert.ok(sorted.indexOf("DR9") < sorted.indexOf("DR10"));
  assert.ok(sorted.indexOf("DR10") < sorted.indexOf("DR11"));
});

test("orders titled concepts (\"DR10 - ...\") the same way", () => {
  const titles = [
    "DR1 - Tamper-proof storage",
    "DR2 - Accessible display",
    "DR9 - Ninth requirement",
    "DR10 - High uptime",
    "DR11 - Eleventh requirement",
    "DR14 - Fourteenth requirement",
  ];
  const sorted = shuffled(titles).sort(compareNaturalOrder);
  assert.deepEqual(sorted, titles);
});

test("handles the common concept prefixes generically", () => {
  for (const prefix of ["MR", "DR", "DO", "DP", "DF"]) {
    const expected = [1, 2, 10].map((n) => `${prefix}${n}`);
    const sorted = shuffled(expected).sort(compareNaturalOrder);
    assert.deepEqual(sorted, expected, `prefix ${prefix}`);
  }
});

test("supports other numbered design-knowledge labels", () => {
  assert.deepEqual(
    ["MDR10", "MDR2", "MDR1"].sort(compareNaturalOrder),
    ["MDR1", "MDR2", "MDR10"],
  );
  assert.deepEqual(
    ["MR-S10", "MR-S2", "MR-S1"].sort(compareNaturalOrder),
    ["MR-S1", "MR-S2", "MR-S10"],
  );
  assert.deepEqual(
    ["A1.10", "A1.2", "A1.1"].sort(compareNaturalOrder),
    ["A1.1", "A1.2", "A1.10"],
  );
});

test("falls back to a stable deterministic order for non-numbered labels", () => {
  const labels = [
    "Accountability",
    "accountability",
    "Traceability",
    "Verifiability",
  ];
  const first = shuffled(labels).sort(compareNaturalOrder);
  const second = [...labels].sort(compareNaturalOrder);
  assert.deepEqual(first, second);
  // Case-folded primary order, exact string as the tie-break.
  assert.deepEqual(first, [
    "Accountability",
    "accountability",
    "Traceability",
    "Verifiability",
  ]);
});

test("mixed numbered and unnumbered labels keep numbered ones grouped by value", () => {
  const sorted = ["DR10", "Introduction", "DR2", "DR1", "Appendix"].sort(
    compareNaturalOrder,
  );
  assert.deepEqual(sorted, ["Appendix", "DR1", "DR2", "DR10", "Introduction"]);
});

test("unknown/empty inputs never throw and stay total", () => {
  assert.equal(compareNaturalOrder("", ""), 0);
  assert.equal(compareNaturalOrder("DR1", "DR1"), 0);
  assert.ok(compareNaturalOrder("", "DR1") < 0);
  assert.ok(compareNaturalOrder("DR1", "") > 0);
});

test("compareNumberedConceptOrder prefers the label, then title, then id", () => {
  const concepts = [
    { label: "DR10", title: "DR10 - Tenth", id: "design-knowledge/x-dr10" },
    { label: "DR2", title: "DR2 - Second", id: "design-knowledge/x-dr2" },
    { label: "DR1", title: "DR1 - First", id: "design-knowledge/x-dr1" },
  ];
  const sorted = shuffled(concepts).sort(compareNumberedConceptOrder);
  assert.deepEqual(
    sorted.map((concept) => concept.label),
    ["DR1", "DR2", "DR10"],
  );
});

test("compareNumberedConceptOrder recovers ordering from the id suffix", () => {
  // Concepts with no label and a label-free title fall through to the id, whose
  // "-dr10" style suffix still orders numerically.
  const concepts = [
    { title: "Same prose title", id: "design-knowledge/x-dr10" },
    { title: "Same prose title", id: "design-knowledge/x-dr2" },
    { title: "Same prose title", id: "design-knowledge/x-dr1" },
  ];
  const sorted = shuffled(concepts).sort(compareNumberedConceptOrder);
  assert.deepEqual(
    sorted.map((concept) => concept.id),
    [
      "design-knowledge/x-dr1",
      "design-knowledge/x-dr2",
      "design-knowledge/x-dr10",
    ],
  );
});

test("14+ concept regression: full reverse input still yields natural order", () => {
  const expected = Array.from({ length: 18 }, (_, index) => ({
    label: `DF${index + 1}`,
    title: `DF${index + 1} - feature ${index + 1}`,
    id: `design-knowledge/paper-df${index + 1}`,
  }));
  const sorted = [...expected].reverse().sort(compareNumberedConceptOrder);
  assert.deepEqual(
    sorted.map((concept) => concept.label),
    expected.map((concept) => concept.label),
  );
});
