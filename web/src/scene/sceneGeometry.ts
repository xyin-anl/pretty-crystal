import { Vector3 } from "three/src/math/Vector3.js";

export { atomRadiusForModel } from "../model/elementRadii";
import { withDefaultCellVectors, type VectorTuple } from "./viewMath";

export const BOND_RADIUS = 0.1;
export const CELL_FRAME_COLOR = "#444444";
export const CELL_FRAME_LINE_WIDTH_PIXELS = 1;
export const CELL_CORNER_FRACTIONAL_OFFSETS = [
  [0, 0, 0],
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
  [1, 1, 0],
  [1, 0, 1],
  [0, 1, 1],
  [1, 1, 1],
] as const;
export const CELL_FRAME_VERTEX_INDEX_PAIRS = [
  [0, 1],
  [0, 2],
  [0, 3],
  [1, 4],
  [1, 5],
  [2, 4],
  [2, 6],
  [3, 5],
  [3, 6],
  [4, 7],
  [5, 7],
  [6, 7],
] as const;

export function cellCenter(vectors: VectorTuple[]): Vector3 {
  const [vectorA, vectorB, vectorC] = withDefaultCellVectors(vectors);

  return new Vector3(...vectorA)
    .add(new Vector3(...vectorB))
    .add(new Vector3(...vectorC))
    .multiplyScalar(0.5);
}

export function cellCorners(vectors: VectorTuple[]): Vector3[] {
  const [vectorA, vectorB, vectorC] = withDefaultCellVectors(vectors);
  const a = new Vector3(...vectorA);
  const b = new Vector3(...vectorB);
  const c = new Vector3(...vectorC);

  return CELL_CORNER_FRACTIONAL_OFFSETS.map(([offsetA, offsetB, offsetC]) =>
    a
      .clone()
      .multiplyScalar(offsetA)
      .add(b.clone().multiplyScalar(offsetB))
      .add(c.clone().multiplyScalar(offsetC)),
  );
}

export function cellFrameLinePositions(vectors: VectorTuple[]): number[] {
  const corners = cellCorners(vectors);
  return CELL_FRAME_VERTEX_INDEX_PAIRS.flatMap(([startIndex, endIndex]) => {
    const start = corners[startIndex];
    const end = corners[endIndex];
    if (!start || !end) {
      throw new Error("Unit-cell edge references a missing corner.");
    }
    return vectorEdge(start, end);
  });
}

export function centeredCellGroupPosition(vectors: VectorTuple[]): VectorTuple {
  const center = cellCenter(vectors);
  return [-center.x, -center.y, -center.z];
}

function vectorEdge(
  start: Vector3,
  end: Vector3,
): [number, number, number, number, number, number] {
  return [start.x, start.y, start.z, end.x, end.y, end.z];
}
