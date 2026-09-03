/**
 * Shared, deterministic node-box sizing for the semantic diagrams.
 *
 * The diagram components render fixed-width cards inside a graph layout engine
 * (ELK for the generated flow, a deterministic column engine for the paper map
 * and the fallback). The layout engine must be told how tall each card will be
 * BEFORE it runs, otherwise a card whose label wraps to more lines than the
 * engine reserved for it will either be clipped by the card boundary or overlap
 * its neighbours once React Flow paints the real content.
 *
 * These helpers estimate the wrapped line count for a label at a given text
 * width and convert it to a conservative card height. They deliberately keep a
 * per-component floor (the height short labels have always rendered at) and only
 * grow the card once a label genuinely needs more than the floor's worth of
 * lines, so short labels are never enlarged and long labels are never clipped.
 */

export interface WrappedLineCountOptions {
  /** Whole label characters that fit on one rendered line at this font. */
  charactersPerLine: number;
  /** Hard ceiling so one pathological label cannot explode the layout. */
  maxLines: number;
  /** Lower bound so a one-word label still reserves a readable card. */
  minLines?: number;
}

const WORD_SPLIT = /\s+/u;

/**
 * Greedy word-wrap line count. A single token longer than one line (a long
 * identifier or URL-like string) is allowed to break across as many lines as it
 * needs — the renderer uses `overflow-wrap: anywhere` for exactly this case — so
 * it contributes `ceil(token.length / charactersPerLine)` lines on its own.
 */
export function estimateWrappedLineCount(
  label: string,
  options: WrappedLineCountOptions,
): number {
  const perLine = Math.max(1, Math.floor(options.charactersPerLine));
  const minLines = Math.max(1, options.minLines ?? 1);
  const maxLines = Math.max(minLines, Math.floor(options.maxLines));
  const words = label.trim().split(WORD_SPLIT).filter((word) => word.length > 0);
  if (words.length === 0) return minLines;

  let lines = 1;
  let columnUsed = 0;
  for (const word of words) {
    if (word.length > perLine) {
      // Flush the current line, then let the long token span whole lines.
      if (columnUsed > 0) lines += 1;
      lines += Math.ceil(word.length / perLine) - 1;
      columnUsed = word.length % perLine || perLine;
      continue;
    }
    const needed = columnUsed === 0 ? word.length : columnUsed + 1 + word.length;
    if (needed > perLine) {
      lines += 1;
      columnUsed = word.length;
    } else {
      columnUsed = needed;
    }
  }
  return Math.min(maxLines, Math.max(minLines, lines));
}

export interface NodeBoxHeightOptions {
  /** Inner width available to the wrapping label, in CSS px. */
  labelWidth: number;
  /** Approximate rendered width of one label glyph at its font size/weight. */
  characterWidth: number;
  /** Label line box height, in CSS px. */
  lineHeight: number;
  /** Vertical px consumed by everything except the label (padding + header + footer rows). */
  chrome: number;
  /** The height short labels have always rendered at; never go below it. */
  minHeight: number;
  /** Hard ceiling on wrapped label lines. */
  maxLines: number;
  /** Lower bound on reserved label lines. */
  minLines?: number;
}

/**
 * Conservative card height for `label`. Returns `minHeight` for any label that
 * fits within the floor, and grows in whole line-height steps beyond it. The
 * result is rounded up to an even integer so repeated layout runs are stable.
 */
export function measuredNodeBoxHeight(
  label: string,
  options: NodeBoxHeightOptions,
): number {
  const charactersPerLine = options.labelWidth / options.characterWidth;
  const lines = estimateWrappedLineCount(label, {
    charactersPerLine,
    maxLines: options.maxLines,
    ...(options.minLines === undefined ? {} : { minLines: options.minLines }),
  });
  const contentHeight = options.chrome + lines * options.lineHeight;
  const height = Math.max(options.minHeight, contentHeight);
  return Math.ceil(height / 2) * 2;
}
