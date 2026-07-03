import { describe, expect, test } from "bun:test";

import {
  hasLatticePlane,
  latticePlanePolygon,
  polygonTriangleFanPositions,
} from "../src/scene/latticePlaneGeometry";
import type { VectorTuple } from "../src/scene/viewMath";

const CUBIC_CELL: VectorTuple[] = [
  [4, 0, 0],
  [0, 4, 0],
  [0, 0, 4],
];

describe("miller plane", () => {
  test("detects empty plane specs", () => {
    expect(hasLatticePlane(null)).toBe(false);
    expect(hasLatticePlane({ h: 0, k: 0, l: 0, offsetPercent: 50 })).toBe(false);
    expect(hasLatticePlane({ h: 1, k: 0, l: 0, offsetPercent: 50 })).toBe(true);
  });

  test("(100) through the cell center is a square at x = a/2", () => {
    const polygon = latticePlanePolygon(CUBIC_CELL, {
      h: 1,
      k: 0,
      l: 0,
      offsetPercent: 50,
    });

    expect(polygon).not.toBeNull();
    expect(polygon!.length).toBe(4);
    for (const vertex of polygon!) {
      expect(vertex.x).toBeCloseTo(2, 9);
    }
  });

  test("(111) through the center is a hexagon in a cube", () => {
    const polygon = latticePlanePolygon(CUBIC_CELL, {
      h: 1,
      k: 1,
      l: 1,
      offsetPercent: 50,
    });

    expect(polygon).not.toBeNull();
    expect(polygon!.length).toBe(6);
    for (const vertex of polygon!) {
      expect(vertex.x + vertex.y + vertex.z).toBeCloseTo(6, 9);
    }
  });

  test("(111) at zero offset degenerates to a corner", () => {
    const polygon = latticePlanePolygon(CUBIC_CELL, {
      h: 1,
      k: 1,
      l: 1,
      offsetPercent: 0,
    });

    expect(polygon).toBeNull();
  });

  test("triangle fan covers the polygon", () => {
    const polygon = latticePlanePolygon(CUBIC_CELL, {
      h: 1,
      k: 1,
      l: 1,
      offsetPercent: 50,
    })!;
    const positions = polygonTriangleFanPositions(polygon);

    expect(positions.length).toBe((polygon.length - 2) * 9);
  });
});
