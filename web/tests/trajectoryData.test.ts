import { describe, expect, test } from "bun:test";

import type { SceneSpec } from "../src/api/scene";
import { trajectoryPropertySeries } from "../src/app/trajectory/trajectoryData";

function frameWithCell(vectors: number[][]): SceneSpec {
  return { cell: { vectors } } as unknown as SceneSpec;
}

describe("trajectory property series", () => {
  const frames = [
    frameWithCell([
      [2, 0, 0],
      [0, 3, 0],
      [0, 0, 4],
    ]),
    frameWithCell([
      [4, 0, 0],
      [0, 3, 0],
      [3, 0, 4],
    ]),
  ];

  test("computes cell volume per frame", () => {
    expect(trajectoryPropertySeries(frames, "volume")).toEqual([24, 48]);
  });

  test("computes lattice vector lengths per frame", () => {
    expect(trajectoryPropertySeries(frames, "a")).toEqual([2, 4]);
    expect(trajectoryPropertySeries(frames, "b")).toEqual([3, 3]);
    expect(trajectoryPropertySeries(frames, "c")).toEqual([4, 5]);
  });
});
