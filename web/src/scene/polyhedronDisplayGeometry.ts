import { Float32BufferAttribute, Triangle, Vector3 } from "three";

import type { AtomSpec, PolyhedronSpec } from "../api/scene";
import { polyhedronGeometryFromAtoms } from "./structureGeometry";

const EDGE_THRESHOLD_ANGLE_DEGREES = 1;

export interface DisplayedPolyhedronSurfaceOwner {
  centerAtomIndex: number;
  faceIndex: number;
  faceVertexIndices: [number, number, number];
  polyhedronIndex: number;
}

export interface DisplayedPolyhedronSurface {
  atomIndices: [number, number, number];
  owners: DisplayedPolyhedronSurfaceOwner[];
  renderAtomIds: [string, string, string];
  surfaceIndex: number;
}

export interface DisplayedPolyhedronEdge {
  centerAtomIndex: number;
  edgeIndex: number;
  endAtomIndex: number;
  endPosition: [number, number, number];
  endRenderAtomId: string;
  polyhedronIndex: number;
  startAtomIndex: number;
  startPosition: [number, number, number];
  startRenderAtomId: string;
}

export interface DisplayedPolyhedronGeometry {
  edges: DisplayedPolyhedronEdge[];
  surfaces: DisplayedPolyhedronSurface[];
  validPolyhedronIndices: number[];
}

export function createDisplayedPolyhedronGeometry({
  atoms,
  polyhedra,
}: {
  atoms: AtomSpec[];
  polyhedra: PolyhedronSpec[];
}): DisplayedPolyhedronGeometry {
  const edges: DisplayedPolyhedronEdge[] = [];
  const surfaces: DisplayedPolyhedronSurface[] = [];
  const surfaceByKey = new Map<string, DisplayedPolyhedronSurface>();
  const validPolyhedronIndices: number[] = [];

  polyhedra.forEach((polyhedron, polyhedronIndex) => {
    if (!isValidPolyhedronForAtoms(polyhedron, atoms)) {
      return;
    }
    validPolyhedronIndices.push(polyhedronIndex);

    polyhedron.faces.forEach((face, faceIndex) => {
      const faceKey = polyhedronSurfaceFaceKey(polyhedron, atoms, face);
      if (!faceKey) {
        return;
      }
      const faceVertexIndices = [...face] as [number, number, number];
      const owner: DisplayedPolyhedronSurfaceOwner = {
        centerAtomIndex: polyhedron.centerAtomIndex,
        faceIndex,
        faceVertexIndices,
        polyhedronIndex,
      };
      const existing = surfaceByKey.get(faceKey);
      if (existing) {
        existing.owners.push(owner);
        return;
      }

      const atomIndices = faceVertexIndices.map(
        (vertexIndex) => polyhedron.hullAtomIndices[vertexIndex]!,
      ) as [number, number, number];
      const renderAtomIds = atomIndices.map((atomIndex) => atoms[atomIndex]!.id) as [
        string,
        string,
        string,
      ];
      const surface: DisplayedPolyhedronSurface = {
        atomIndices,
        owners: [owner],
        renderAtomIds,
        surfaceIndex: surfaces.length,
      };
      surfaceByKey.set(faceKey, surface);
      surfaces.push(surface);
    });

    for (const [startVertexIndex, endVertexIndex] of displayedEdgeVertexPairs(
      polyhedron,
      atoms,
    )) {
      const startAtomIndex = polyhedron.hullAtomIndices[startVertexIndex]!;
      const endAtomIndex = polyhedron.hullAtomIndices[endVertexIndex]!;
      const startAtom = atoms[startAtomIndex]!;
      const endAtom = atoms[endAtomIndex]!;
      edges.push({
        centerAtomIndex: polyhedron.centerAtomIndex,
        edgeIndex: edges.length,
        endAtomIndex,
        endPosition: float32Position(endAtom.position),
        endRenderAtomId: endAtom.id,
        polyhedronIndex,
        startAtomIndex,
        startPosition: float32Position(startAtom.position),
        startRenderAtomId: startAtom.id,
      });
    }
  });

  return { edges, surfaces, validPolyhedronIndices };
}

function isValidPolyhedronForAtoms(
  polyhedron: PolyhedronSpec,
  atoms: AtomSpec[],
): boolean {
  if (!atoms[polyhedron.centerAtomIndex] || polyhedron.faces.length === 0) {
    return false;
  }
  if (polyhedron.hullAtomIndices.some((atomIndex) => !atoms[atomIndex])) {
    return false;
  }
  return polyhedron.faces.every(
    (face) => polyhedronSurfaceFaceKey(polyhedron, atoms, face) !== null,
  );
}

function polyhedronSurfaceFaceKey(
  polyhedron: PolyhedronSpec,
  atoms: AtomSpec[],
  face: number[],
): string | null {
  if (
    face.length !== 3 ||
    new Set(face).size !== 3 ||
    face.some(
      (vertexIndex) =>
        !Number.isInteger(vertexIndex) ||
        vertexIndex < 0 ||
        vertexIndex >= polyhedron.hullAtomIndices.length,
    )
  ) {
    return null;
  }

  const vertexKeys: string[] = [];
  for (const vertexIndex of face) {
    const atomIndex = polyhedron.hullAtomIndices[vertexIndex];
    const atom = atomIndex === undefined ? undefined : atoms[atomIndex];
    if (
      !atom ||
      atom.position.some((coordinate: number) => !Number.isFinite(coordinate))
    ) {
      return null;
    }
    vertexKeys.push(
      atom.position.map((coordinate: number) => String(coordinate)).join(","),
    );
  }
  return vertexKeys.sort().join("|");
}

function displayedEdgeVertexPairs(
  polyhedron: PolyhedronSpec,
  atoms: AtomSpec[],
): [number, number][] {
  const geometry = polyhedronGeometryFromAtoms(polyhedron, atoms);
  if (!geometry) {
    return [];
  }

  try {
    const index = geometry.getIndex();
    const position = geometry.getAttribute("position");
    const indexCount = index?.count ?? position.count;
    const thresholdDot = Math.cos(
      (Math.PI / 180) * EDGE_THRESHOLD_ANGLE_DEGREES,
    );
    const triangle = new Triangle();
    const normal = new Vector3();
    const edgeData = new Map<
      string,
      { endVertexIndex: number; normal: Vector3; startVertexIndex: number } | null
    >();
    const edges: [number, number][] = [];

    for (let offset = 0; offset < indexCount; offset += 3) {
      const vertexIndices = [0, 1, 2].map((delta) =>
        index ? index.getX(offset + delta) : offset + delta,
      ) as [number, number, number];
      triangle.a.fromBufferAttribute(position, vertexIndices[0]);
      triangle.b.fromBufferAttribute(position, vertexIndices[1]);
      triangle.c.fromBufferAttribute(position, vertexIndices[2]);
      triangle.getNormal(normal);
      const vertexHashes = [triangle.a, triangle.b, triangle.c].map(positionHash);
      if (
        vertexHashes[0] === vertexHashes[1] ||
        vertexHashes[1] === vertexHashes[2] ||
        vertexHashes[2] === vertexHashes[0]
      ) {
        continue;
      }

      for (let edgeOffset = 0; edgeOffset < 3; edgeOffset += 1) {
        const nextOffset = (edgeOffset + 1) % 3;
        const startVertexIndex = vertexIndices[edgeOffset]!;
        const endVertexIndex = vertexIndices[nextOffset]!;
        const hash = `${vertexHashes[edgeOffset]}_${vertexHashes[nextOffset]}`;
        const reverseHash = `${vertexHashes[nextOffset]}_${vertexHashes[edgeOffset]}`;
        const reverseEdge = edgeData.get(reverseHash);
        if (reverseEdge) {
          if (normal.dot(reverseEdge.normal) <= thresholdDot) {
            edges.push([startVertexIndex, endVertexIndex]);
          }
          edgeData.set(reverseHash, null);
        } else if (!edgeData.has(hash)) {
          edgeData.set(hash, {
            endVertexIndex,
            normal: normal.clone(),
            startVertexIndex,
          });
        }
      }
    }

    for (const edge of edgeData.values()) {
      if (edge) {
        edges.push([edge.startVertexIndex, edge.endVertexIndex]);
      }
    }
    return edges;
  } finally {
    geometry.dispose();
  }
}

function positionHash(position: Vector3): string {
  const precision = 10_000;
  return [position.x, position.y, position.z]
    .map((coordinate) => Math.round(coordinate * precision))
    .join(",");
}

function float32Position(position: [number, number, number]): [number, number, number] {
  const attribute = new Float32BufferAttribute(position, 3);
  return [attribute.getX(0), attribute.getY(0), attribute.getZ(0)];
}
