import { Vector3 } from "three";

import type { VectorTuple } from "./viewMath";

export interface LatticePlaneSpec {
  h: number;
  k: number;
  l: number;
  // Position of the plane through the cell, in percent: 0 touches the lowest
  // cell corner along the plane normal, 100 the highest.
  offsetPercent: number;
}

const CUBE_CORNERS: VectorTuple[] = [
  [0, 0, 0],
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
  [1, 1, 0],
  [1, 0, 1],
  [0, 1, 1],
  [1, 1, 1],
];
const CUBE_EDGES: Array<[number, number]> = [
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
];
const INTERSECTION_EPSILON = 1e-9;
const DEDUPE_EPSILON = 1e-6;

export function hasLatticePlane(plane: LatticePlaneSpec | null): plane is LatticePlaneSpec {
  return plane !== null && (plane.h !== 0 || plane.k !== 0 || plane.l !== 0);
}

/**
 * Computes the polygon where the (hkl) lattice plane cuts the unit cell, as
 * Cartesian vertices ordered around the polygon. Returns null when the plane
 * misses the cell or degenerates.
 *
 * The plane satisfies h*x + k*y + l*z = c in fractional coordinates; the
 * offset maps linearly onto the range of c spanned by the cell corners.
 */
export function latticePlanePolygon(
  cellVectors: VectorTuple[],
  plane: LatticePlaneSpec,
): Vector3[] | null {
  if (!hasLatticePlane(plane) || cellVectors.length !== 3) {
    return null;
  }

  const levels = CUBE_CORNERS.map(
    (corner) => plane.h * corner[0] + plane.k * corner[1] + plane.l * corner[2],
  );
  const minLevel = Math.min(...levels);
  const maxLevel = Math.max(...levels);
  if (maxLevel - minLevel < INTERSECTION_EPSILON) {
    return null;
  }

  const offset = Math.min(100, Math.max(0, plane.offsetPercent)) / 100;
  const level = minLevel + (maxLevel - minLevel) * offset;

  const fractionalPoints: VectorTuple[] = [];
  for (const [startIndex, endIndex] of CUBE_EDGES) {
    const startLevel = levels[startIndex]!;
    const endLevel = levels[endIndex]!;
    if (
      (startLevel - level) * (endLevel - level) > INTERSECTION_EPSILON ||
      Math.abs(endLevel - startLevel) < INTERSECTION_EPSILON
    ) {
      if (Math.abs(startLevel - level) < INTERSECTION_EPSILON) {
        pushUnique(fractionalPoints, CUBE_CORNERS[startIndex]!);
      }
      if (Math.abs(endLevel - level) < INTERSECTION_EPSILON) {
        pushUnique(fractionalPoints, CUBE_CORNERS[endIndex]!);
      }
      continue;
    }

    const t = (level - startLevel) / (endLevel - startLevel);
    if (t < -INTERSECTION_EPSILON || t > 1 + INTERSECTION_EPSILON) {
      continue;
    }
    const start = CUBE_CORNERS[startIndex]!;
    const end = CUBE_CORNERS[endIndex]!;
    pushUnique(fractionalPoints, [
      start[0] + (end[0] - start[0]) * t,
      start[1] + (end[1] - start[1]) * t,
      start[2] + (end[2] - start[2]) * t,
    ]);
  }

  if (fractionalPoints.length < 3) {
    return null;
  }

  const cartesianPoints = fractionalPoints.map((point) =>
    fractionalToCartesian(point, cellVectors),
  );
  return sortAroundCentroid(cartesianPoints);
}

/** Builds a triangle-fan position buffer for the polygon. */
export function polygonTriangleFanPositions(polygon: Vector3[]): Float32Array {
  const triangleCount = polygon.length - 2;
  const positions = new Float32Array(triangleCount * 9);
  for (let index = 0; index < triangleCount; index += 1) {
    const a = polygon[0]!;
    const b = polygon[index + 1]!;
    const c = polygon[index + 2]!;
    positions.set([a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z], index * 9);
  }
  return positions;
}

function fractionalToCartesian(
  point: VectorTuple,
  cellVectors: VectorTuple[],
): Vector3 {
  const result = new Vector3();
  for (let axis = 0; axis < 3; axis += 1) {
    result.x += point[axis]! * cellVectors[axis]![0];
    result.y += point[axis]! * cellVectors[axis]![1];
    result.z += point[axis]! * cellVectors[axis]![2];
  }
  return result;
}

function pushUnique(points: VectorTuple[], candidate: VectorTuple) {
  for (const point of points) {
    if (
      Math.abs(point[0] - candidate[0]) < DEDUPE_EPSILON &&
      Math.abs(point[1] - candidate[1]) < DEDUPE_EPSILON &&
      Math.abs(point[2] - candidate[2]) < DEDUPE_EPSILON
    ) {
      return;
    }
  }
  points.push(candidate);
}

function sortAroundCentroid(points: Vector3[]): Vector3[] | null {
  const centroid = points
    .reduce((sum, point) => sum.add(point), new Vector3())
    .divideScalar(points.length);

  // Build an orthonormal basis in the polygon plane from the first edge and
  // the polygon normal.
  const first = points[0]!.clone().sub(centroid);
  if (first.lengthSq() < DEDUPE_EPSILON) {
    return null;
  }
  const u = first.normalize();
  let normal: Vector3 | null = null;
  for (let index = 1; index < points.length; index += 1) {
    const candidate = points[index]!.clone().sub(centroid).cross(u);
    if (candidate.lengthSq() > DEDUPE_EPSILON) {
      normal = candidate.normalize();
      break;
    }
  }
  if (!normal) {
    return null;
  }
  const v = normal.clone().cross(u).normalize();

  return points
    .map((point) => {
      const relative = point.clone().sub(centroid);
      return { angle: Math.atan2(relative.dot(v), relative.dot(u)), point };
    })
    .sort((a, b) => a.angle - b.angle)
    .map((entry) => entry.point);
}
