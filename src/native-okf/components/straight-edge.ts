import type { XYPosition } from "reactflow";

function finitePoint(point: XYPosition): boolean {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

export function straightLinePath(points: readonly XYPosition[]): string {
  const finite = points.filter(finitePoint);
  if (finite.length < 2) return "";
  const start = finite[0]!;
  const end = finite[finite.length - 1]!;
  return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
}

export function straightLineMidpoint(
  points: readonly XYPosition[],
): XYPosition {
  const finite = points.filter(finitePoint);
  if (finite.length < 2) {
    return finite[0] ? { ...finite[0] } : { x: 0, y: 0 };
  }
  const start = finite[0]!;
  const end = finite[finite.length - 1]!;
  return {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
  };
}

