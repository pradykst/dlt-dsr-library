/**
 * Placement maths for the paper picker popover, kept free of React and the DOM
 * so the responsive contract is directly testable.
 */

/** Preferred popover width (22rem), narrowed on viewports that cannot hold it. */
export const PAPER_SCOPE_POPOVER_PREFERRED_WIDTH = 352;
/** Never narrower than this, even on the smallest supported phone. */
export const PAPER_SCOPE_POPOVER_MINIMUM_WIDTH = 200;
/** Safe margin kept between the popover and every viewport edge. */
export const PAPER_SCOPE_POPOVER_VIEWPORT_MARGIN = 12;
/** Gap between the anchoring control and the popover. */
export const PAPER_SCOPE_POPOVER_ANCHOR_GAP = 8;
/** Preferred panel height; the paper list scrolls inside it. */
export const PAPER_SCOPE_POPOVER_MAX_HEIGHT = 384;
/** Below this the popover flips to whichever side of the anchor has more room. */
const COMFORTABLE_PANEL_HEIGHT = 240;
/** Absolute floor, so a very short viewport still shows the search field and a row. */
const MINIMUM_PANEL_HEIGHT = 132;

export interface PaperScopeAnchorRect {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/** Horizontal content region the popover should stay inside, when one applies. */
export interface PaperScopeBounds {
  left: number;
  right: number;
}

export interface PaperScopePopoverPlacement {
  left: number;
  width: number;
  maxHeight: number;
  /** Exactly one of `top` / `bottom` is set: the popover opens down or up. */
  top?: number;
  bottom?: number;
}

/**
 * Places the popover relative to the control that opened it, in viewport
 * coordinates.
 *
 * `bounds` is the content region the popover should stay inside on desktop
 * (the chat panel), so a control at the right edge of a narrow column does not
 * open a panel that floats far outside it. It is always intersected with the
 * viewport, and is optional: without it the viewport alone bounds the popover.
 *
 * Invariants, for any anchor position, any bounds, and any viewport:
 *   - `width` never exceeds the viewport minus a safe margin on both sides, so
 *     the popover can never widen the page or force horizontal scrolling;
 *   - the horizontal span stays inside the viewport, left-aligned to the
 *     control when it fits and right-aligned to it otherwise;
 *   - `maxHeight` never exceeds the free space on the chosen side, so a long
 *     paper list scrolls internally instead of running off-screen.
 */
export function paperScopePopoverPlacement(
  anchor: PaperScopeAnchorRect,
  viewportWidth: number,
  viewportHeight: number,
  bounds?: PaperScopeBounds,
): PaperScopePopoverPlacement {
  const margin = PAPER_SCOPE_POPOVER_VIEWPORT_MARGIN;
  // The usable horizontal region: the viewport inset by the safe margin, then
  // narrowed to the content region when one is supplied and is itself usable.
  const viewportLeft = margin;
  const viewportRight = Math.max(margin, viewportWidth - margin);
  const usable = bounds && bounds.right - bounds.left >= PAPER_SCOPE_POPOVER_MINIMUM_WIDTH
    ? {
        left: Math.max(viewportLeft, Math.min(bounds.left, viewportRight)),
        right: Math.min(viewportRight, Math.max(bounds.right, viewportLeft)),
      }
    : { left: viewportLeft, right: viewportRight };
  const region = Math.max(0, usable.right - usable.left);
  const width = Math.max(
    Math.min(PAPER_SCOPE_POPOVER_MINIMUM_WIDTH, viewportWidth),
    Math.min(PAPER_SCOPE_POPOVER_PREFERRED_WIDTH, region),
  );
  // Left-align with the control by default; flip to right alignment when that
  // would run past the region's right edge. The clamp afterwards is what
  // actually guarantees the invariant for anchors near either edge.
  const leftAligned = anchor.left;
  const rightAligned = anchor.right - width;
  const preferred = leftAligned + width <= usable.right ? leftAligned : rightAligned;
  const maximumLeft = Math.max(margin, viewportWidth - margin - width);
  const left = Math.min(
    Math.max(preferred, Math.min(usable.left, maximumLeft)),
    maximumLeft,
  );

  const gap = PAPER_SCOPE_POPOVER_ANCHOR_GAP;
  const spaceAbove = anchor.top - gap - margin;
  const spaceBelow = viewportHeight - anchor.bottom - gap - margin;
  // The composer sits at the bottom of the chat panel, so upward is the natural
  // direction; flip only when there is genuinely more room the other way.
  const openUp = spaceAbove >= COMFORTABLE_PANEL_HEIGHT || spaceAbove >= spaceBelow;
  const maxHeight = Math.max(
    MINIMUM_PANEL_HEIGHT,
    Math.min(PAPER_SCOPE_POPOVER_MAX_HEIGHT, openUp ? spaceAbove : spaceBelow),
  );

  return openUp
    ? {
        left,
        width,
        maxHeight,
        bottom: Math.max(margin, viewportHeight - anchor.top + gap),
      }
    : {
        left,
        width,
        maxHeight,
        top: Math.max(
          margin,
          Math.min(anchor.bottom + gap, viewportHeight - MINIMUM_PANEL_HEIGHT),
        ),
      };
}
