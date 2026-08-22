import { describe, expect, test } from "bun:test";
import { OrthographicCamera } from "three";

import type { SceneSpec } from "../src/api/scene";
import { createCameraPoseSnapshot } from "../src/scene/cameraPose";
import { structureRasterMetadata } from "../src/scene/exportRenderer";
import {
  instanceIdColor,
  instanceIdFromColor,
  unpackRgbaDepth,
} from "../src/scene/trainingPasses";

describe("training render annotations", () => {
  test("projects atom centers with exact camera matrices", () => {
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);
    const cameraPose = createCameraPoseSnapshot(camera.quaternion);

    const metadata = structureRasterMetadata({
      camera,
      cameraPose,
      exportFramePlan: {
        aspectRatio: 1,
        bounds: null,
        centerX: 0,
        centerY: 0,
        height: 100,
        width: 100,
        zoom: 1,
      },
      groupPosition: [0, 0, 0],
      height: 100,
      scene: sceneWithAtom([0, 0, 0]),
      showUnitCell: true,
      supersampling: 1,
      width: 100,
    });

    expect(metadata.camera.matrixLayout).toBe("row-major");
    expect(metadata.camera.near).toBe(0.1);
    expect(metadata.camera.far).toBe(10);
    expect(metadata.camera.projectionMatrix).toHaveLength(4);
    expect(metadata.camera.viewMatrix).toHaveLength(4);
    expect(metadata.frame.groupPosition).toEqual([0, 0, 0]);
    expect(metadata.atoms).toHaveLength(1);
    expect(metadata.atoms[0]?.xy[0]).toBeCloseTo(50, 8);
    expect(metadata.atoms[0]?.xy[1]).toBeCloseTo(50, 8);
    expect(metadata.atoms[0]?.cameraDepth).toBeCloseTo(5, 8);
    expect(metadata.atoms[0]?.withinFrame).toBe(true);
    expect(metadata.unitCell.rendered).toBe(true);
    expect(metadata.unitCell.vertices).toHaveLength(8);
    expect(metadata.unitCell.edges).toHaveLength(12);
    expect(metadata.unitCell.vertices[0]).toMatchObject({
      fractionalOffset: [0, 0, 0],
      vertexIndex: 0,
      xy: [50, 50],
    });
    expect(metadata.unitCell.vertices[7]?.fractionalOffset).toEqual([1, 1, 1]);
    expect(metadata.unitCell.edges[0]).toMatchObject({
      edgeIndex: 0,
      endVertexIndex: 1,
      startVertexIndex: 0,
      startXy: [50, 50],
    });
  });

  test("round-trips little-endian RGB24 atom instance IDs", () => {
    for (const instanceId of [1, 255, 256, 65_535, 65_536, 0xffffff]) {
      const color = instanceIdColor(instanceId);
      expect(instanceIdFromColor(...color)).toBe(instanceId);
    }
  });

  test("projects displayed bond endpoints with stable atom identities", () => {
    const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);

    const scene = sceneWithAtom([-0.5, 0, 0]);
    scene.atoms.push({
      ...scene.atoms[0]!,
      id: "Si-1",
      position: [0.5, 0, 0],
      siteId: "Si-1",
      siteIndex: 1,
    });
    scene.bonds.push({
      endAtomIndex: 1,
      startAtomIndex: 0,
      visibilityDependencies: [],
      visibilityDependencyGroups: [],
    });
    const metadata = structureRasterMetadata({
      camera,
      cameraPose: createCameraPoseSnapshot(camera.quaternion),
      exportFramePlan: {
        aspectRatio: 1,
        bounds: null,
        centerX: 0,
        centerY: 0,
        height: 100,
        width: 100,
        zoom: 1,
      },
      groupPosition: [0, 0, 0],
      height: 100,
      scene,
      showUnitCell: true,
      supersampling: 1,
      width: 100,
    });

    expect(metadata.displayBonds).toEqual([
      {
        bondIndex: 0,
        endAtomIndex: 1,
        endRenderAtomId: "Si-1",
        endXy: [75, 50],
        startAtomIndex: 0,
        startRenderAtomId: "Si-0",
        startXy: [25, 50],
        visibilityDependencies: [],
        visibilityDependencyGroups: [],
      },
    ]);
  });

  test("decodes the depth-pass background as normalized depth one", () => {
    expect(unpackRgbaDepth(255, 255, 255, 255)).toBeCloseTo(1, 8);
    expect(unpackRgbaDepth(0, 0, 0, 0)).toBe(0);
  });

  test("reports final-pixel frame values after supersampling", () => {
    const camera = new OrthographicCamera(-2, 2, 2, -2, 0.1, 10);
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);

    const metadata = structureRasterMetadata({
      camera,
      cameraPose: createCameraPoseSnapshot(camera.quaternion),
      exportFramePlan: {
        aspectRatio: 1,
        bounds: null,
        centerX: 40,
        centerY: -20,
        height: 200,
        width: 200,
        zoom: 6,
      },
      groupPosition: [0, 0, 0],
      height: 100,
      scene: sceneWithAtom([0, 0, 0]),
      showUnitCell: true,
      supersampling: 2,
      width: 100,
    });

    expect(metadata.frame.centerX).toBe(20);
    expect(metadata.frame.centerY).toBe(-10);
    expect(metadata.frame.zoom).toBe(3);
  });
});

function sceneWithAtom(position: [number, number, number]): SceneSpec {
  return {
    atoms: [
      {
        element: "Si",
        fractionalPosition: [0, 0, 0],
        id: "Si-0",
        imageOffset: [0, 0, 0],
        imageReasons: [],
        isPeriodicImage: false,
        position,
        siteId: "Si-0",
        siteIndex: 0,
        visibilityDependencies: [],
        visibilityDependencyGroups: [],
      },
    ],
    bonds: [],
    cell: {
      vectors: [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ],
    },
    polyhedra: [],
    summary: {
      atomCount: 1,
      cell: { a: "1", alpha: "90", b: "1", beta: "90", c: "1", gamma: "90" },
      formula: "Si",
      symmetry: {
        available: false,
        crystalSystem: null,
        latticeSystem: null,
        pointGroup: null,
        pointGroupSchoenflies: null,
        spaceGroup: null,
        spaceGroupNumber: null,
      },
    },
  };
}
