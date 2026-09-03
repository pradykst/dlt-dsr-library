import { measuredNodeBoxHeight } from "./diagram-node-metrics.ts";

export const PAPER_DESIGN_NODE_WIDTH = 240;
/** Floor height: a title of up to three wrapped lines renders at exactly this. */
export const PAPER_DESIGN_NODE_HEIGHT = 92;
export const PAPER_DESIGN_NODE_GAP = 30;
export const PAPER_DESIGN_COLUMN_GAP = 150;
export const PAPER_DESIGN_OUTER_PADDING = 36;

/** px 14 semibold title, wrapping inside a 240px card with `px-3.5` horizontal padding. */
const PAPER_DESIGN_NODE_LABEL_METRICS = {
  labelWidth: PAPER_DESIGN_NODE_WIDTH - 28,
  characterWidth: 7.8,
  lineHeight: 20,
  chrome: PAPER_DESIGN_NODE_HEIGHT - 60,
  minHeight: PAPER_DESIGN_NODE_HEIGHT,
  maxLines: 6,
} as const;

/**
 * Conservative rendered height for one design-knowledge card. Short titles keep
 * the historical fixed height; a title that wraps past three lines (for example
 * a long multiline Design Principle label) grows the card so the deterministic
 * column layout reserves enough vertical space and nothing is clipped or
 * overlapped.
 */
export function paperDesignNodeHeight(title: string): number {
  return measuredNodeBoxHeight(title, PAPER_DESIGN_NODE_LABEL_METRICS);
}
