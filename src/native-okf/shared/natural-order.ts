import { compareDisplayStrings } from "./presentation.ts";

/**
 * One reusable natural-order comparator for researcher-facing lists of numbered
 * design-knowledge concepts.
 *
 * Lexical ordering places a "…10" label before a "…2" label because it compares
 * the strings character by character. This comparator instead splits each string
 * into alternating non-digit and digit runs and compares digit runs by numeric
 * value, so any "<letters><number>" style concept label — whatever its prefix,
 * and however many concepts a paper numbers — orders the way a reader expects.
 * It is intentionally generic: no concept prefix, paper, or maximum number is
 * hard-coded.
 *
 * For inputs with no digit runs, or once every compared run is equal, it falls
 * back to {@link compareDisplayStrings} and then to a raw comparison, so the
 * order stays total, deterministic, and stable for unusual labels, unknown
 * concept types, and labels with no recognizable numeric suffix.
 */

const DIGIT_RUN = /\d+/gu;

interface Chunk {
  /** The raw substring for this run. */
  readonly text: string;
  /** Numeric value when the run is all digits; `null` for a text run. */
  readonly value: number | null;
}

function toChunks(value: string): Chunk[] {
  const chunks: Chunk[] = [];
  let lastIndex = 0;
  for (const match of value.matchAll(DIGIT_RUN)) {
    const start = match.index;
    if (start > lastIndex) {
      chunks.push({ text: value.slice(lastIndex, start), value: null });
    }
    const digits = match[0];
    // Numbers past the safe-integer range fall back to a digit-count then
    // lexical comparison of the run, which still orders shorter runs first.
    const parsed = Number(digits);
    chunks.push({
      text: digits,
      value: Number.isSafeInteger(parsed) ? parsed : Number.POSITIVE_INFINITY,
    });
    lastIndex = start + digits.length;
  }
  if (lastIndex < value.length) {
    chunks.push({ text: value.slice(lastIndex), value: null });
  }
  return chunks;
}

/** Case- and separator-tolerant natural comparison of two display strings. */
export function compareNaturalOrder(left: string, right: string): number {
  const leftChunks = toChunks(left);
  const rightChunks = toChunks(right);
  const shared = Math.min(leftChunks.length, rightChunks.length);

  for (let index = 0; index < shared; index += 1) {
    const a = leftChunks[index]!;
    const b = rightChunks[index]!;
    const aNumeric = a.value !== null;
    const bNumeric = b.value !== null;

    if (aNumeric && bNumeric) {
      if (a.value !== b.value) return a.value! < b.value! ? -1 : 1;
      // Equal numeric value (e.g. "DR1" vs "DR01"): the shorter, unpadded run
      // sorts first so the ordering stays deterministic.
      if (a.text.length !== b.text.length) {
        return a.text.length < b.text.length ? -1 : 1;
      }
      continue;
    }

    if (aNumeric !== bNumeric) {
      // A numeric run sorts before a text run at the same position, so
      // "DR2" precedes "DR2a".
      return aNumeric ? -1 : 1;
    }

    const textComparison = compareDisplayStrings(a.text, b.text);
    if (textComparison !== 0) return textComparison;
  }

  if (leftChunks.length !== rightChunks.length) {
    return leftChunks.length < rightChunks.length ? -1 : 1;
  }

  // Every run compared equal — keep the order total and deterministic.
  return compareDisplayStrings(left, right) ||
    (left < right ? -1 : left > right ? 1 : 0);
}

/**
 * Natural order for a numbered design-knowledge concept, keyed on the most
 * label-like field available (an explicit producer `label` such as "DR10", the
 * display `title`, then the concept `id`). Concepts that never expose a
 * numbered token degrade to {@link compareNaturalOrder} on their title, which is
 * identical to the previous lexical behaviour for label-free strings.
 */
export function compareNumberedConceptOrder(
  left: { label?: string | null; title?: string | null; id?: string | null },
  right: { label?: string | null; title?: string | null; id?: string | null },
): number {
  const key = (concept: {
    label?: string | null;
    title?: string | null;
    id?: string | null;
  }): string =>
    (concept.label ?? "").trim() ||
    (concept.title ?? "").trim() ||
    (concept.id ?? "").trim();
  return compareNaturalOrder(key(left), key(right)) ||
    compareNaturalOrder((left.id ?? "").trim(), (right.id ?? "").trim());
}
