"use client";

import { useCallback, useLayoutEffect, useRef, useState, type RefObject } from "react";

import {
  PAPER_SCOPE_POPOVER_MAX_HEIGHT,
  PAPER_SCOPE_POPOVER_PREFERRED_WIDTH,
  paperScopePopoverPlacement,
  type PaperScopePopoverPlacement,
} from "./paper-scope-popover-placement.ts";
import { PaperScopePicker, type PaperScopePickerProps } from "./PaperScopePicker.tsx";

export interface PaperScopePopoverProps extends PaperScopePickerProps {
  /** The control the popover is visually anchored to. */
  anchorRef: RefObject<HTMLElement | null>;
  /**
   * Optional content region (the chat panel) the popover stays inside on
   * desktop, so a right-aligned control does not open a panel floating outside
   * the column. Always intersected with the viewport.
   */
  boundsRef?: RefObject<HTMLElement | null>;
}

function measurePlacement(
  anchorRef: RefObject<HTMLElement | null>,
  boundsRef?: RefObject<HTMLElement | null>,
): PaperScopePopoverPlacement | null {
  const anchor = anchorRef.current;
  if (typeof document === "undefined" || !anchor) return null;
  const root = document.documentElement;
  const bounds = boundsRef?.current?.getBoundingClientRect();
  return paperScopePopoverPlacement(
    anchor.getBoundingClientRect(),
    // The layout viewport, excluding any classic scrollbar gutter, so the
    // popover is never tucked underneath it.
    root.clientWidth,
    root.clientHeight,
    bounds ? { left: bounds.left, right: bounds.right } : undefined,
  );
}

/**
 * The one positioning layer for the canonical {@link PaperScopePicker}. The
 * visible scope selector, the `@` reference, and the `/paper` command all mount
 * the picker through here, so anchoring, bounded width, viewport clamping, and
 * internal list scrolling are defined exactly once.
 *
 * The panel is viewport-positioned (`position: fixed`) rather than absolutely
 * positioned inside the chat panel. The composer lives inside a rounded
 * `overflow-hidden` card, which clips an absolutely positioned child and, when
 * that child overhangs the page, extends the document's scrollable width. A
 * fixed panel is neither clipped by that card nor part of any scrollable
 * overflow region, so the picker can never be cut off, widen the page, or
 * introduce a horizontal scrollbar. No ancestor of the composer establishes a
 * containing block (no transform, filter, perspective, or contain), so the
 * viewport really is this panel's reference frame.
 */
export function PaperScopePopover({
  anchorRef,
  boundsRef,
  ...pickerProps
}: PaperScopePopoverProps) {
  // Measured from the anchor, which is already mounted when this popover first
  // renders. Placing it on the very first render matters: a placeholder render
  // would have to hide the panel, and a hidden panel cannot take focus, so the
  // picker's search field would silently lose its autofocus.
  const [placement, setPlacement] = useState<PaperScopePopoverPlacement | null>(
    () => measurePlacement(anchorRef, boundsRef),
  );
  const frame = useRef(0);

  const measure = useCallback(() => {
    const next = measurePlacement(anchorRef, boundsRef);
    if (next) setPlacement(next);
  }, [anchorRef, boundsRef]);

  useLayoutEffect(() => {
    measure();
    const schedule = () => {
      window.cancelAnimationFrame(frame.current);
      frame.current = window.requestAnimationFrame(measure);
    };
    window.addEventListener("resize", schedule);
    // Capture phase, so scrolling any ancestor re-anchors, not just the page.
    window.addEventListener("scroll", schedule, true);
    return () => {
      window.cancelAnimationFrame(frame.current);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
    };
  }, [measure]);

  return (
    <div
      data-testid="paper-scope-popover"
      style={{
        position: "fixed",
        left: placement?.left ?? 0,
        width: placement?.width ?? PAPER_SCOPE_POPOVER_PREFERRED_WIDTH,
        ...(placement?.top === undefined ? {} : { top: placement.top }),
        ...(placement?.bottom === undefined ? {} : { bottom: placement.bottom }),
      }}
      className="z-50"
    >
      <PaperScopePicker
        {...pickerProps}
        maxHeight={placement?.maxHeight ?? PAPER_SCOPE_POPOVER_MAX_HEIGHT}
      />
    </div>
  );
}
