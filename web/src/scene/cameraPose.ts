import { OrthographicCamera } from "three/src/cameras/OrthographicCamera.js";
import { Quaternion } from "three/src/math/Quaternion.js";
import { Vector3 } from "three/src/math/Vector3.js";

import type { VectorTuple } from "./viewMath";

export interface CameraPoseSnapshot {
  projection: "orthographic";
  quaternion: [number, number, number, number];
  target: VectorTuple;
}

const CAMERA_FORWARD = new Vector3(0, 0, -1);
const CAMERA_UP = new Vector3(0, 1, 0);

export function createCameraPoseSnapshot(
  orientation: Quaternion,
  target: VectorTuple = [0, 0, 0],
): CameraPoseSnapshot {
  return {
    projection: "orthographic",
    quaternion: [orientation.x, orientation.y, orientation.z, orientation.w],
    target,
  };
}

export function applyCameraPoseSnapshot(
  camera: {
    lookAt: (x: number, y: number, z: number) => void;
    position: Vector3;
    quaternion: Quaternion;
    up: Vector3;
  },
  pose: CameraPoseSnapshot,
  distance: number,
  span: number,
) {
  const quaternion = quaternionFromSnapshot(pose);
  const target = new Vector3(...pose.target);
  const forward = CAMERA_FORWARD.clone().applyQuaternion(quaternion).normalize();
  const up = CAMERA_UP.clone().applyQuaternion(quaternion).normalize();
  const cameraDistance = Math.max(4, distance);

  camera.position.copy(target).sub(forward.multiplyScalar(cameraDistance));
  camera.up.copy(up);
  camera.lookAt(...pose.target);
  camera.quaternion.copy(quaternion);

  // Duck-typed check: cameras may come from a different three module instance
  // (the renderer lives in a lazy-loaded chunk), so `instanceof` is unreliable.
  if ((camera as Partial<OrthographicCamera>).isOrthographicCamera) {
    const orthographicCamera = camera as OrthographicCamera;
    orthographicCamera.near = 0.01;
    orthographicCamera.far = Math.max(1000, cameraDistance + span * 8);
    orthographicCamera.updateProjectionMatrix();
  }
}

function quaternionFromSnapshot(pose: CameraPoseSnapshot): Quaternion {
  return new Quaternion(...pose.quaternion).normalize();
}
