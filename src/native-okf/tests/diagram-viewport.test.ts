import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  calculateDiagramViewport,
  GENERATED_DIAGRAM_FIT_MAX_ZOOM,
  GENERATED_DIAGRAM_FIT_MIN_ZOOM,
  GENERATED_DIAGRAM_FIT_SCREEN_PADDING,
  type DiagramViewportBounds,
  type DiagramViewportTransform,
} from "../components/chat/diagram-viewport.ts";

const SCREEN_PADDING = GENERATED_DIAGRAM_FIT_SCREEN_PADDING;
const HORIZONTAL_BOUNDS: DiagramViewportBounds = {
  x: 32,
  y: 32,
  width: 1_928,
  height: 570,
};
const HORIZONTAL_VIEWPORT = { width: 1_080, height: 720 };
const VERTICAL_BOUNDS: DiagramViewportBounds = {
  x: 32,
  y: 32,
  width: 915,
  height: 1_256,
};

function screenPoint(
  point: { x: number; y: number },
  transform: DiagramViewportTransform,
): { x: number; y: number } {
  return {
    x: point.x * transform.zoom + transform.x,
    y: point.y * transform.zoom + transform.y,
  };
}

function assertPointInsideViewport(
  point: { x: number; y: number },
  viewport: { width: number; height: number },
  tolerance = 0.001,
): void {
  assert.ok(point.x >= SCREEN_PADDING - tolerance, `${point.x} is left of padding`);
  assert.ok(
    point.x <= viewport.width - SCREEN_PADDING + tolerance,
    `${point.x} is right of padding`,
  );
  assert.ok(point.y >= SCREEN_PADDING - tolerance, `${point.y} is above padding`);
  assert.ok(
    point.y <= viewport.height - SCREEN_PADDING + tolerance,
    `${point.y} is below padding`,
  );
}

describe("generated diagram viewport fitting", () => {
  it("fits a roughly 1900px horizontal graph below the former 0.62 floor", () => {
    const transform = calculateDiagramViewport(
      HORIZONTAL_BOUNDS,
      HORIZONTAL_VIEWPORT,
      SCREEN_PADDING,
    );

    assert.ok(transform.zoom < 0.62);
    assert.ok(transform.zoom >= GENERATED_DIAGRAM_FIT_MIN_ZOOM);
    assert.equal(transform.contentFits, true);
  });

  it("keeps the complete first and last node rectangles inside the padded viewport", () => {
    const transform = calculateDiagramViewport(
      HORIZONTAL_BOUNDS,
      HORIZONTAL_VIEWPORT,
      SCREEN_PADDING,
    );
    const firstNode = { x: 32, y: 220, width: 224, height: 112 };
    const lastNode = { x: 1_736, y: 220, width: 224, height: 112 };

    for (const rectangle of [firstNode, lastNode]) {
      assertPointInsideViewport(
        screenPoint({ x: rectangle.x, y: rectangle.y }, transform),
        HORIZONTAL_VIEWPORT,
      );
      assertPointInsideViewport(
        screenPoint(
          {
            x: rectangle.x + rectangle.width,
            y: rectangle.y + rectangle.height,
          },
          transform,
        ),
        HORIZONTAL_VIEWPORT,
      );
    }
  });

  it("keeps every routed edge point inside the fitted viewport", () => {
    const transform = calculateDiagramViewport(
      HORIZONTAL_BOUNDS,
      HORIZONTAL_VIEWPORT,
      SCREEN_PADDING,
    );
    const routedPoints = [
      { x: 32, y: 317 },
      { x: 410, y: 317 },
      { x: 410, y: 48 },
      { x: 1_150, y: 48 },
      { x: 1_150, y: 546 },
      { x: 1_960, y: 546 },
    ];

    for (const point of routedPoints) {
      assertPointInsideViewport(
        screenPoint(point, transform),
        HORIZONTAL_VIEWPORT,
      );
    }
  });

  it("is deterministic for identical bounds and viewport dimensions", () => {
    const first = calculateDiagramViewport(
      HORIZONTAL_BOUNDS,
      HORIZONTAL_VIEWPORT,
      SCREEN_PADDING,
    );
    const second = calculateDiagramViewport(
      HORIZONTAL_BOUNDS,
      HORIZONTAL_VIEWPORT,
      SCREEN_PADDING,
    );

    assert.deepEqual(second, first);
  });

  it("fits both horizontal and vertical layouts and centers them", () => {
    const horizontal = calculateDiagramViewport(
      HORIZONTAL_BOUNDS,
      HORIZONTAL_VIEWPORT,
      SCREEN_PADDING,
    );
    const vertical = calculateDiagramViewport(
      VERTICAL_BOUNDS,
      HORIZONTAL_VIEWPORT,
      SCREEN_PADDING,
    );

    assert.equal(horizontal.contentFits, true);
    assert.equal(vertical.contentFits, true);

    for (const [bounds, transform] of [
      [HORIZONTAL_BOUNDS, horizontal],
      [VERTICAL_BOUNDS, vertical],
    ] as const) {
      const fittedCenter = screenPoint(
        {
          x: bounds.x + bounds.width / 2,
          y: bounds.y + bounds.height / 2,
        },
        transform,
      );
      assert.ok(Math.abs(fittedCenter.x - HORIZONTAL_VIEWPORT.width / 2) < 0.001);
      assert.ok(Math.abs(fittedCenter.y - HORIZONTAL_VIEWPORT.height / 2) < 0.001);
    }
  });

  it("uses the safe minimum without non-finite values in tiny containers", () => {
    const transform = calculateDiagramViewport(
      HORIZONTAL_BOUNDS,
      { width: 5, height: 7 },
      SCREEN_PADDING,
    );

    assert.equal(transform.zoom, GENERATED_DIAGRAM_FIT_MIN_ZOOM);
    assert.equal(transform.contentFits, false);
    assert.ok(transform.zoom > 0);
    assert.ok(Number.isFinite(transform.x));
    assert.ok(Number.isFinite(transform.y));
    assert.ok(transform.x >= 0);
    assert.ok(transform.y >= 0);
    assert.ok(Number.isFinite(transform.requiredZoom));
  });

  it("does not exceed the configured maximum in very large containers", () => {
    const transform = calculateDiagramViewport(
      { x: 32, y: 32, width: 400, height: 200 },
      { width: 6_000, height: 4_000 },
      SCREEN_PADDING,
    );

    assert.equal(transform.zoom, GENERATED_DIAGRAM_FIT_MAX_ZOOM);
    assert.equal(transform.contentFits, true);
  });

  it("honors caller-provided zoom limits", () => {
    const transform = calculateDiagramViewport(
      HORIZONTAL_BOUNDS,
      HORIZONTAL_VIEWPORT,
      SCREEN_PADDING,
      { minZoom: 0.42, maxZoom: 1.25 },
    );

    assert.ok(transform.zoom >= 0.42);
    assert.ok(transform.zoom <= 1.25);
  });
});
