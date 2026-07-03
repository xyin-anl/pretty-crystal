import { useCallback, useState, type RefObject } from "react";
import type { Quaternion } from "three";

import type { SceneSpec } from "../../api/scene";
import { exportFileStem } from "../../export/fileNames";
import { downloadBlob } from "../../export/zipExport";
import {
  visibleSceneForComponents,
  type ComponentOpacityState,
  type ComponentVisibilityState,
  type ExportSettingsState,
  type StyleState,
  type UnitCellLineStyle,
} from "../../model";
import type { AnimationFrame } from "../../scene/animationFrames";

export const DEFAULT_TURNTABLE_FRAME_COUNT = 60;
export const DEFAULT_ANIMATION_FPS = 15;

export interface AnimationExportProgress {
  frameCount: number;
  renderedFrames: number;
}

export type AnimationExportFormat = "gif" | "mp4";

/** Renders and downloads turntable/series animations from the current GUI state. */
export function useAnimationExport({
  cameraOrientationRef,
  componentOpacity,
  componentVisibility,
  exportSettings,
  lightStrength,
  selectedFileName,
  style,
  trajectoryFrames,
  unitCellLineStyle,
  visibleScene,
}: {
  cameraOrientationRef: RefObject<Quaternion>;
  componentOpacity: ComponentOpacityState;
  componentVisibility: ComponentVisibilityState;
  exportSettings: ExportSettingsState;
  lightStrength: number;
  selectedFileName: string | null;
  style: StyleState;
  trajectoryFrames: SceneSpec[] | null;
  unitCellLineStyle: UnitCellLineStyle;
  visibleScene: SceneSpec | null;
}) {
  const [animationExportProgress, setAnimationExportProgress] =
    useState<AnimationExportProgress | null>(null);
  const [animationExportError, setAnimationExportError] = useState<string | null>(null);

  const exportAnimation = useCallback(
    async (
      frames: AnimationFrame[],
      fps: number,
      suffix: string,
      format: AnimationExportFormat,
    ) => {
      if (frames.length === 0 || animationExportProgress) {
        return;
      }

      setAnimationExportError(null);
      setAnimationExportProgress({ frameCount: frames.length, renderedFrames: 0 });
      try {
        // The offscreen frame renderer and encoders load on demand.
        const { renderAnimationFrameImages } = await import("../../scene/animationFrames");
        const images = await renderAnimationFrameImages({
          componentOpacity,
          exportSettings,
          frames,
          lightStrength,
          onProgress: (renderedFrames, frameCount) =>
            setAnimationExportProgress({ frameCount, renderedFrames }),
          showAtoms: componentVisibility.atoms,
          showUnitCell: componentVisibility.unitCell,
          style,
          unitCellLineStyle,
        });
        const encoded =
          format === "mp4"
            ? await (await import("../../export/mp4Export")).encodeMp4FromImageBlobs(images, {
                fps,
              })
            : await (await import("../../export/gifExport")).encodeGifFromImageBlobs(images, {
                fps,
              });
        downloadBlob(encoded, `${exportFileStem(selectedFileName)}-${suffix}.${format}`);
      } catch (error) {
        setAnimationExportError(
          error instanceof Error ? error.message : "Could not export the animation.",
        );
      } finally {
        setAnimationExportProgress(null);
      }
    },
    [
      animationExportProgress,
      componentOpacity,
      componentVisibility.atoms,
      componentVisibility.unitCell,
      exportSettings,
      lightStrength,
      selectedFileName,
      style,
      unitCellLineStyle,
    ],
  );

  const handleExportTurntableAnimation = useCallback(
    async (frameCount: number, fps: number, format: AnimationExportFormat = "gif") => {
      if (!visibleScene) {
        return;
      }

      const { turntableQuaternion } = await import("../../scene/animationFrames");
      const baseQuaternion = cameraOrientationRef.current.clone();
      const frames = Array.from({ length: frameCount }, (_, index) => ({
        quaternion: turntableQuaternion(
          baseQuaternion,
          (index / frameCount) * Math.PI * 2,
        ),
        scene: visibleScene,
      }));
      await exportAnimation(frames, fps, "turntable", format);
    },
    [cameraOrientationRef, exportAnimation, visibleScene],
  );

  const handleExportSeriesAnimation = useCallback(
    async (fps: number, format: AnimationExportFormat = "gif") => {
      if (!trajectoryFrames || trajectoryFrames.length < 2) {
        return;
      }

      const baseQuaternion = cameraOrientationRef.current.clone();
      const frames: AnimationFrame[] = [];
      for (const frameScene of trajectoryFrames) {
        const visibleFrame = visibleSceneForComponents(frameScene, componentVisibility);
        if (visibleFrame) {
          frames.push({ quaternion: baseQuaternion, scene: visibleFrame });
        }
      }
      await exportAnimation(frames, fps, "series", format);
    },
    [cameraOrientationRef, componentVisibility, exportAnimation, trajectoryFrames],
  );

  return {
    animationExportError,
    animationExportProgress,
    handleExportSeriesAnimation,
    handleExportTurntableAnimation,
  };
}
