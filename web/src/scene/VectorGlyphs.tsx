import { useMemo } from "react";
import { Quaternion, Vector3 } from "three";

import type { AtomSpec } from "../api/scene";
import { VECTOR_GLYPH_COLOR } from "../model";
import type { ResolvedStructureMaterialFamily } from "./materialPresetResolver";
import { STRUCTURE_RENDER_ORDER } from "./renderOrder";
import { StructureMaterial } from "./StructureMaterial";

// The longest vector in the scene maps to this arrow length (in angstroms)
// at 100% glyph scale, keeping magnitudes comparable across properties.
const MAX_ARROW_LENGTH = 1.7;
const MIN_ARROW_LENGTH = 0.28;
const SHAFT_RADIUS_RATIO = 0.045;
const HEAD_RADIUS_RATIO = 0.13;
const HEAD_LENGTH_RATIO = 0.32;
const RADIAL_SEGMENTS = 12;
const UP = new Vector3(0, 1, 0);

interface ArrowInstance {
  key: string;
  length: number;
  position: [number, number, number];
  quaternion: Quaternion;
}

/**
 * Draws per-site vector properties (magnetic moments, forces) as arrows
 * through the atom centers, VESTA-style.
 */
export function VectorGlyphs({
  atoms,
  materialFamily,
  property,
  scalePercent,
}: {
  atoms: AtomSpec[];
  materialFamily: ResolvedStructureMaterialFamily;
  property: string;
  scalePercent: number;
}) {
  const arrows = useMemo<ArrowInstance[]>(() => {
    let maxMagnitude = 0;
    const vectors: Array<{ atom: AtomSpec; magnitude: number; vector: Vector3 }> = [];
    for (const atom of atoms) {
      const components = atom.siteVectors?.[property];
      if (!components) {
        continue;
      }

      const vector = new Vector3(...components);
      const magnitude = vector.length();
      if (magnitude <= 1e-9) {
        continue;
      }
      maxMagnitude = Math.max(maxMagnitude, magnitude);
      vectors.push({ atom, magnitude, vector });
    }
    if (maxMagnitude <= 0) {
      return [];
    }

    const lengthScale = (MAX_ARROW_LENGTH * scalePercent) / 100 / maxMagnitude;
    return vectors.map(({ atom, magnitude, vector }) => ({
      key: atom.id,
      length: Math.max(MIN_ARROW_LENGTH, magnitude * lengthScale),
      position: atom.position,
      quaternion: new Quaternion().setFromUnitVectors(UP, vector.clone().normalize()),
    }));
  }, [atoms, property, scalePercent]);

  if (arrows.length === 0) {
    return null;
  }

  return (
    <>
      {arrows.map((arrow) => (
        <Arrow key={arrow.key} arrow={arrow} materialFamily={materialFamily} />
      ))}
    </>
  );
}

function Arrow({
  arrow,
  materialFamily,
}: {
  arrow: ArrowInstance;
  materialFamily: ResolvedStructureMaterialFamily;
}) {
  const headLength = arrow.length * HEAD_LENGTH_RATIO;
  const shaftLength = arrow.length - headLength;
  const shaftRadius = arrow.length * SHAFT_RADIUS_RATIO;
  const headRadius = arrow.length * HEAD_RADIUS_RATIO;

  // The arrow is centered on the atom: it runs from -L/2 to +L/2 along the
  // vector direction so moments read as an axis through the site.
  return (
    <group position={arrow.position} quaternion={arrow.quaternion}>
      <mesh castShadow position={[0, -arrow.length / 2 + shaftLength / 2, 0]}>
        <cylinderGeometry
          args={[shaftRadius, shaftRadius, shaftLength, RADIAL_SEGMENTS]}
        />
        <StructureMaterial
          color={VECTOR_GLYPH_COLOR}
          depthWrite
          materialFamily={materialFamily}
          opacity={1}
          transparent={false}
        />
      </mesh>
      <mesh
        castShadow
        position={[0, arrow.length / 2 - headLength / 2, 0]}
        renderOrder={STRUCTURE_RENDER_ORDER.atomMesh}
      >
        <coneGeometry args={[headRadius, headLength, RADIAL_SEGMENTS]} />
        <StructureMaterial
          color={VECTOR_GLYPH_COLOR}
          depthWrite
          materialFamily={materialFamily}
          opacity={1}
          transparent={false}
        />
      </mesh>
    </group>
  );
}
