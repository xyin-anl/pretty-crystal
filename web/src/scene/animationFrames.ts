import { Quaternion, Vector3 } from "three";

import type { SceneSpec } from "../api/scene";
import {
  exportBackgroundColor,
  rasterFormatForExportFormat,
} from "../export/rasterCanvas";
import type {
  ComponentOpacityState,
  ExportSettingsState,
  StyleState,
  UnitCellLineStyle,
} from "../model";
import { createCameraPoseSnapshot } from "./cameraPose";
import { computeStructureExportFramePlan } from "./exportFrame";
import { renderStructureRasterImage } from "./exportRenderer";
import { computeSceneLayout } from "./sceneLayout";

export const ANIMATION_FRAME_COUNT_MAX = 600;

export interface AnimationFrame {
  quaternion: Quaternion;
  scene: SceneSpec;
}

export interface RenderAnimationFrameImagesOptions {
  componentOpacity: ComponentOpacityState;
  exportSettings: ExportSettingsState;
  frames: AnimationFrame[];
  lightStrength: number;
  onProgress?: (renderedFrames: number, frameCount: number) => void;
  showAtoms: boolean;
  showUnitCell: boolean;
  style: StyleState;
  unitCellLineStyle: UnitCellLineStyle;
}

/**
 * Renders animation frames with one shared zoom/center so the structure stays
 * steady instead of re-fitting (and visibly pulsing) on every frame. Scenes
 * must already be visibility-filtered.
 */
export async function renderAnimationFrameImages({
  componentOpacity,
  exportSettings,
  frames,
  lightStrength,
  onProgress,
  showAtoms,
  showUnitCell,
  style,
  unitCellLineStyle,
}: RenderAnimationFrameImagesOptions): Promise<Blob[]> {
  const renderWidth = exportSettings.width * exportSettings.supersampling;
  const renderHeight = exportSettings.height * exportSettings.supersampling;

  let sharedZoom = Infinity;
  let unionMinX = Infinity;
  let unionMinY = Infinity;
  let unionMaxX = -Infinity;
  let unionMaxY = -Infinity;
  for (const frame of frames) {
    const layout = computeSceneLayout(frame.scene, style.atomRadiusModel);
    const plan = computeStructureExportFramePlan({
      cameraPose: createCameraPoseSnapshot(frame.quaternion),
      componentOpacity,
      groupPosition: layout.groupPosition,
      height: renderHeight,
      scene: frame.scene,
      showAtoms,
      showUnitCell,
      style,
      width: renderWidth,
    });
    sharedZoom = Math.min(sharedZoom, plan.zoom);
    if (plan.bounds) {
      unionMinX = Math.min(unionMinX, plan.bounds.minX);
      unionMinY = Math.min(unionMinY, plan.bounds.minY);
      unionMaxX = Math.max(unionMaxX, plan.bounds.maxX);
      unionMaxY = Math.max(unionMaxY, plan.bounds.maxY);
    }
  }
  const hasUnionBounds = [unionMinX, unionMinY, unionMaxX, unionMaxY].every(
    Number.isFinite,
  );
  const frameOverride = {
    centerX: hasUnionBounds ? (unionMinX + unionMaxX) / 2 : 0,
    centerY: hasUnionBounds ? (unionMinY + unionMaxY) / 2 : 0,
    zoom: Number.isFinite(sharedZoom) ? sharedZoom : 1,
  };

  const backgroundColor = exportBackgroundColor(exportSettings.background);
  const imageFormat = rasterFormatForExportFormat(
    exportSettings.format === "pdf" ? "png" : exportSettings.format,
  );
  const images: Blob[] = [];
  for (const frame of frames) {
    const image = await rejectOnWindowError(
      renderStructureRasterImage({
        backgroundColor,
        cameraPose: createCameraPoseSnapshot(frame.quaternion),
        componentOpacity,
        frameOverride,
        height: exportSettings.height,
        imageFormat,
        lightStrength,
        meshQuality: exportSettings.meshQuality,
        scene: frame.scene,
        showAtoms,
        showUnitCell,
        style,
        supersampling: exportSettings.supersampling,
        unitCellLineStyle,
        width: exportSettings.width,
      }),
    );
    images.push(image.blob);
    onProgress?.(images.length, frames.length);
  }

  return images;
}

// Orbits the camera around the axis that appears vertical on screen, so the
// structure spins in place like a turntable.
export function turntableQuaternion(base: Quaternion, angleRadians: number): Quaternion {
  const screenUpAxis = new Vector3(0, 1, 0).applyQuaternion(base).normalize();
  return new Quaternion()
    .setFromAxisAngle(screenUpAxis, angleRadians)
    .multiply(base)
    .normalize();
}

// Errors thrown asynchronously inside the React export root (e.g. during
// mount) surface as window "error" events rather than promise rejections;
// without this the render promise would hang forever.
export async function rejectOnWindowError<T>(work: Promise<T>): Promise<T> {
  let removeListeners = () => {};
  const failure = new Promise<never>((_, reject) => {
    const onError = (event: ErrorEvent) => {
      reject(event.error instanceof Error ? event.error : new Error(event.message));
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      reject(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      );
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    removeListeners = () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  });

  try {
    return await Promise.race([work, failure]);
  } finally {
    removeListeners();
  }
}
