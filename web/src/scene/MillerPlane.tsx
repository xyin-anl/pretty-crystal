import { useMemo } from "react";
import { BufferAttribute, BufferGeometry, DoubleSide, Vector3 } from "three";

import {
  LATTICE_PLANE_COLOR,
  LATTICE_PLANE_OPACITY_PERCENT,
  type LatticePlaneState,
} from "../model";
import {
  hasLatticePlane,
  latticePlanePolygon,
  polygonTriangleFanPositions,
  type LatticePlaneSpec,
} from "./latticePlaneGeometry";
import { STRUCTURE_RENDER_ORDER } from "./renderOrder";
import type { VectorTuple } from "./viewMath";

/** Translucent (hkl) lattice-plane cut through the unit cell. */
export function MillerPlane({
  cellVectors,
  plane,
}: {
  cellVectors: VectorTuple[];
  plane: LatticePlaneState | null;
}) {
  const planeColor = plane?.color ?? LATTICE_PLANE_COLOR;
  const planeOpacity =
    Math.min(100, Math.max(0, plane?.opacityPercent ?? LATTICE_PLANE_OPACITY_PERCENT)) /
    100;
  const geometry = useMemo(() => {
    if (!hasLatticePlane(plane)) {
      return null;
    }
    const polygon = latticePlanePolygon(cellVectors, plane);
    if (!polygon) {
      return null;
    }

    const surface = new BufferGeometry();
    surface.setAttribute(
      "position",
      new BufferAttribute(polygonTriangleFanPositions(polygon), 3),
    );
    surface.computeVertexNormals();

    return { outlinePoints: polygon, surface };
  }, [cellVectors, plane]);

  if (!geometry) {
    return null;
  }

  return (
    <>
      <mesh
        geometry={geometry.surface}
        renderOrder={STRUCTURE_RENDER_ORDER.polyhedronSurface}
      >
        <meshBasicMaterial
          color={planeColor}
          depthWrite={false}
          opacity={planeOpacity}
          side={DoubleSide}
          transparent
        />
      </mesh>
      <Outline color={planeColor} points={geometry.outlinePoints} />
    </>
  );
}

function Outline({ color, points }: { color: string; points: Vector3[] }) {
  const geometry = useMemo(() => {
    const lineGeometry = new BufferGeometry();
    const positions = new Float32Array(points.length * 3);
    points.forEach((point, index) => {
      positions.set([point.x, point.y, point.z], index * 3);
    });
    lineGeometry.setAttribute("position", new BufferAttribute(positions, 3));
    return lineGeometry;
  }, [points]);

  return (
    <lineLoop geometry={geometry} renderOrder={STRUCTURE_RENDER_ORDER.polyhedronSurface}>
      <lineBasicMaterial color={color} transparent opacity={0.9} />
    </lineLoop>
  );
}
