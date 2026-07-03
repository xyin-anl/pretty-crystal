import { type ThreeEvent } from "@react-three/fiber";
import { useCallback, useMemo } from "react";
import { DoubleSide } from "three";

import {
  atomSpeciesOccupancies,
  type AtomRadiusModel,
  type AtomSpec,
} from "../api/scene";
import {
  elementColorForScheme,
  type ElementColorOverrides,
} from "../model/colorSchemes";
import type { StyleState } from "../model";
import { atomRadiusForModel } from "./sceneGeometry";
import type { ResolvedStructureMaterialFamily } from "./materialPresetResolver";
import { STRUCTURE_RENDER_ORDER } from "./renderOrder";
import { StructureMaterial } from "./StructureMaterial";
import type { SceneMeshDetail } from "./StructureSceneObjects";
import { AtomSelectionRing } from "./AtomSelectionRing";
import { ATOM_SELECTION_RING_SELECTED_OPACITY, ATOM_SELECTION_RING_SELECTED_SCALE } from "./atomHighlight";

// The unfilled remainder of a partially occupied site renders as a neutral
// "vacancy" wedge, VESTA-style.
export const VACANCY_SECTOR_COLOR = "#dfe2e6";
const FULL_TURN = Math.PI * 2;
const MIN_SECTOR_FRACTION = 1e-3;

interface AtomSector {
  color: string;
  phiLength: number;
  phiStart: number;
}

/**
 * Renders sites with partial or mixed occupancy as pie-sliced spheres: one
 * sphere sector per species, plus a neutral sector for any vacancy fraction.
 * Ordered atoms stay in the instanced pipeline; only disordered sites pay for
 * individual meshes.
 */
export function DisorderedAtoms({
  atoms,
  colorScheme,
  colorOverrides,
  inspectedAtomId,
  interactionLocked,
  materialFamily,
  meshDetail,
  onInspect,
  onPulse,
  onLockedInteractionAttempt,
  opacity,
  radiusModel,
  radiusScale,
}: {
  atoms: AtomSpec[];
  colorScheme: StyleState["colorScheme"];
  colorOverrides?: ElementColorOverrides;
  inspectedAtomId: string | null;
  interactionLocked: boolean;
  materialFamily: ResolvedStructureMaterialFamily;
  meshDetail: SceneMeshDetail;
  onInspect?: (atomId: string | null) => void;
  onPulse?: (atomId: string) => void;
  onLockedInteractionAttempt?: () => void;
  opacity: number;
  radiusModel: AtomRadiusModel;
  radiusScale: number;
}) {
  const isTransparent = opacity < 1;
  const atomEntries = useMemo(
    () =>
      atoms.map((atom) => ({
        atom,
        radius: atomRadiusForModel(atom, radiusModel) * radiusScale,
        sectors: atomSectors(atom, colorScheme, colorOverrides),
      })),
    [atoms, colorOverrides, colorScheme, radiusModel, radiusScale],
  );

  const handleClick = useCallback(
    (atom: AtomSpec) => (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      if (interactionLocked) {
        return;
      }
      onPulse?.(atom.id);
    },
    [interactionLocked, onPulse],
  );

  const handleDoubleClick = useCallback(
    (atom: AtomSpec) => (event: ThreeEvent<MouseEvent>) => {
      event.stopPropagation();
      if (interactionLocked) {
        onLockedInteractionAttempt?.();
        return;
      }
      onInspect?.(atom.id);
    },
    [interactionLocked, onInspect, onLockedInteractionAttempt],
  );

  if (atomEntries.length === 0) {
    return null;
  }

  return (
    <>
      {atomEntries.map(({ atom, radius, sectors }) => (
        <group key={atom.id} position={atom.position}>
          {sectors.map((sector, sectorIndex) => (
            <SphereSector
              key={sectorIndex}
              color={sector.color}
              depthWrite={true}
              materialFamily={materialFamily}
              meshDetail={meshDetail}
              onClick={handleClick(atom)}
              onDoubleClick={handleDoubleClick(atom)}
              opacity={opacity}
              phiLength={sector.phiLength}
              phiStart={sector.phiStart}
              radius={radius}
              transparent={isTransparent}
            />
          ))}
          {inspectedAtomId === atom.id ? (
            <AtomSelectionRing
              opacity={ATOM_SELECTION_RING_SELECTED_OPACITY}
              position={[0, 0, 0]}
              radius={radius}
              scale={ATOM_SELECTION_RING_SELECTED_SCALE}
            />
          ) : null}
        </group>
      ))}
    </>
  );
}

function SphereSector({
  color,
  depthWrite,
  materialFamily,
  meshDetail,
  onClick,
  onDoubleClick,
  opacity,
  phiLength,
  phiStart,
  radius,
  transparent,
}: {
  color: string;
  depthWrite: boolean;
  materialFamily: ResolvedStructureMaterialFamily;
  meshDetail: SceneMeshDetail;
  onClick: (event: ThreeEvent<MouseEvent>) => void;
  onDoubleClick: (event: ThreeEvent<MouseEvent>) => void;
  opacity: number;
  phiLength: number;
  phiStart: number;
  radius: number;
  transparent: boolean;
}) {
  const isFullSphere = phiLength >= FULL_TURN - 1e-6;
  const capRotations = isFullSphere
    ? []
    : [capRotationY(phiStart), capRotationY(phiStart + phiLength)];

  return (
    <>
      <mesh
        castShadow
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        receiveShadow
        renderOrder={STRUCTURE_RENDER_ORDER.atomMesh}
      >
        <sphereGeometry
          args={[
            radius,
            Math.max(3, Math.ceil((meshDetail.sphereWidthSegments * phiLength) / FULL_TURN)),
            meshDetail.sphereHeightSegments,
            phiStart,
            phiLength,
          ]}
        />
        <StructureMaterial
          color={color}
          depthWrite={depthWrite}
          materialFamily={materialFamily}
          opacity={opacity}
          transparent={transparent}
        />
      </mesh>
      {capRotations.map((rotationY, capIndex) => (
        <mesh
          key={capIndex}
          onClick={onClick}
          onDoubleClick={onDoubleClick}
          renderOrder={STRUCTURE_RENDER_ORDER.atomMesh}
          rotation={[0, rotationY, 0]}
        >
          <circleGeometry
            args={[radius, meshDetail.sphereHeightSegments, -Math.PI / 2, Math.PI]}
          />
          <StructureMaterial
            color={color}
            depthWrite={depthWrite}
            materialFamily={materialFamily}
            opacity={opacity}
            side={DoubleSide}
            transparent={transparent}
          />
        </mesh>
      ))}
    </>
  );
}

// Three.js sphere sectors run around the +Y polar axis with the azimuth a
// mapping to the direction (-cos a, 0, sin a); a circle geometry lies in the
// XY plane with its flat edge on the Y axis, so rotating it by (pi - a)
// aligns the disc with the sector's cut plane.
function capRotationY(azimuth: number): number {
  return Math.PI - azimuth;
}

export function atomSectors(
  atom: AtomSpec,
  colorScheme: StyleState["colorScheme"],
  colorOverrides?: ElementColorOverrides,
): AtomSector[] {
  const species = atomSpeciesOccupancies(atom);
  const sectors: AtomSector[] = [];
  let phiStart = 0;

  for (const entry of species) {
    const fraction = Math.min(1, Math.max(0, entry.occupancy));
    if (fraction < MIN_SECTOR_FRACTION) {
      continue;
    }

    const phiLength = fraction * FULL_TURN;
    sectors.push({
      color: elementColorForScheme(entry.element, colorScheme, colorOverrides),
      phiLength,
      phiStart,
    });
    phiStart += phiLength;
  }

  if (phiStart < FULL_TURN - MIN_SECTOR_FRACTION * FULL_TURN) {
    sectors.push({
      color: VACANCY_SECTOR_COLOR,
      phiLength: FULL_TURN - phiStart,
      phiStart,
    });
  }

  return sectors;
}
