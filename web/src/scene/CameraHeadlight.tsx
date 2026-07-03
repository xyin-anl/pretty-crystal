import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import { DirectionalLight, Object3D, Vector3 } from "three";

import { PREVIEW_HEADLIGHT_INTENSITY } from "./renderAppearance";

const HEADLIGHT_TARGET = new Vector3(0, 0, 0);
const DEFAULT_CAMERA_RELATIVE_LIGHT_OFFSET = [0.32, 0.22, 0] as const;
const MIN_LIGHT_DISTANCE = 4;
const SHADOW_MAP_SIZE = 2048;
// The structure is centered at the headlight target, so the shadow camera
// must cover the bounding box diagonal (span * sqrt(3) / 2) plus padding.
const SHADOW_EXTENT_COVERAGE_RATIO = 0.9;
const SHADOW_EXTENT_PADDING = 1;

export function CameraHeadlight({
  castShadow = false,
  color,
  intensity = PREVIEW_HEADLIGHT_INTENSITY,
  intensityScale = 1,
  offset = DEFAULT_CAMERA_RELATIVE_LIGHT_OFFSET,
  shadowExtent = 10,
}: {
  castShadow?: boolean;
  color?: string | number;
  intensity?: number;
  intensityScale?: number;
  offset?: readonly [number, number, number];
  shadowExtent?: number;
}) {
  const { camera } = useThree();
  const lightRef = useRef<DirectionalLight | null>(null);
  const lightOffsetRef = useRef(new Vector3());
  const cameraRelativeLightOffset = useMemo(
    () => new Vector3(...offset),
    [offset],
  );
  const targetObject = useMemo(() => {
    const object = new Object3D();
    object.position.copy(HEADLIGHT_TARGET);
    return object;
  }, []);
  const shadowHalfExtent =
    Math.max(1, shadowExtent) * SHADOW_EXTENT_COVERAGE_RATIO + SHADOW_EXTENT_PADDING;

  useLayoutEffect(() => {
    const light = lightRef.current;
    if (!light || !castShadow) {
      return;
    }

    const shadowCamera = light.shadow.camera;
    shadowCamera.left = -shadowHalfExtent;
    shadowCamera.right = shadowHalfExtent;
    shadowCamera.top = shadowHalfExtent;
    shadowCamera.bottom = -shadowHalfExtent;
    shadowCamera.updateProjectionMatrix();
    light.shadow.needsUpdate = true;
  }, [castShadow, shadowHalfExtent]);

  useFrame(() => {
    const light = lightRef.current;
    if (!light) {
      return;
    }

    const lightDistance = Math.max(camera.position.distanceTo(HEADLIGHT_TARGET), MIN_LIGHT_DISTANCE);
    lightOffsetRef.current
      .copy(cameraRelativeLightOffset)
      .multiplyScalar(lightDistance)
      .applyQuaternion(camera.quaternion);

    light.position.copy(camera.position).add(lightOffsetRef.current);
    targetObject.position.copy(HEADLIGHT_TARGET);
    targetObject.updateMatrixWorld();

    if (castShadow) {
      const shadowCamera = light.shadow.camera;
      const shadowFar = light.position.distanceTo(HEADLIGHT_TARGET) + shadowHalfExtent * 2;
      if (Math.abs(shadowCamera.far - shadowFar) > 0.5) {
        shadowCamera.near = 0.1;
        shadowCamera.far = shadowFar;
        shadowCamera.updateProjectionMatrix();
        light.shadow.needsUpdate = true;
      }
    }
  });

  return (
    <>
      <primitive object={targetObject} />
      <directionalLight
        ref={lightRef}
        castShadow={castShadow}
        color={color}
        intensity={intensity * intensityScale}
        shadow-mapSize={[SHADOW_MAP_SIZE, SHADOW_MAP_SIZE]}
        shadow-normalBias={Math.max(0.02, shadowHalfExtent * 0.005)}
        target={targetObject}
      />
    </>
  );
}
