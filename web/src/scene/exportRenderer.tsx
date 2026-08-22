import { createRoot, type RootState } from "@react-three/fiber";
import { useLayoutEffect } from "react";
import { Matrix4, OrthographicCamera, Quaternion, Vector3, type Camera } from "three";

import type { SceneSpec } from "../api/scene";
import type {
  ComponentOpacityState,
  ExportMeshQuality,
  ExportSupersampling,
  StyleState,
  UnitCellLineStyle,
} from "../model";
import type { CameraPoseSnapshot } from "./cameraPose";
import {
  EXPORT_SCENE_MESH_DETAIL_PRESETS,
} from "./StructureSceneObjects";
import { ExportSceneContent } from "./ExportSceneContent";
import { CameraHeadlight } from "./CameraHeadlight";
import {
  MaterialPresetEffects,
  materialPresetEffectsRequirePreload,
  preloadMaterialPresetEffects,
} from "./MaterialPresetEffects";
import { MaterialPresetLights } from "./MaterialPresetLights";
import { computeSceneLayout } from "./sceneLayout";
import { computeStructureExportFramePlan, type StructureExportFramePlan } from "./exportFrame";
import {
  resolveStructureMaterialFamiliesForStyle,
  resolveStructureMaterialFamilyForStyle,
} from "./materialPresetResolver";
import { DEFAULT_RENDERER_PARAMETERS } from "./rendererParameters";
import {
  renderStructureTrainingPasses,
  type StructureTrainingPasses,
} from "./trainingPasses";
import {
  CELL_CORNER_FRACTIONAL_OFFSETS,
  CELL_FRAME_VERTEX_INDEX_PAIRS,
  atomRadiusForModel,
  cellCorners,
} from "./sceneGeometry";
import {
  ORIENTATION_GIZMO_CAMERA_POSITION,
  ORIENTATION_GIZMO_LABEL_DISTANCE,
  ORIENTATION_GIZMO_SCALE,
  ORIENTATION_GIZMO_ZOOM_PER_CANVAS_PIXEL,
  StaticOrientationGizmoScene,
} from "./OrientationGizmo";
import {
  computeOrientationGizmoAxes,
  type OrientationGizmoAxisSpec,
} from "./orientationGizmoMath";

export const STRUCTURE_LINE_WIDTH_REFERENCE_RATIO = 0.001;
export const STRUCTURE_LINE_WIDTH_MIN_PIXELS = 1;

export interface RasterExportImage {
  blob: Blob;
  contentBounds?: RasterExportBounds;
  height: number;
  structureMetadata?: StructureRasterMetadata;
  trainingPasses?: StructureTrainingPasses;
  textItems?: RasterExportTextItem[];
  width: number;
}

export interface StructureRasterMetadata {
  atoms: ProjectedAtomAnnotation[];
  camera: StructureRasterCameraMetadata;
  displayBonds: ProjectedDisplayBondAnnotation[];
  frame: {
    centerX: number;
    centerY: number;
    groupPosition: [number, number, number];
    supersampling: number;
    zoom: number;
  };
  polyhedra: SceneSpec["polyhedra"];
  unitCell: ProjectedUnitCellAnnotation;
  training?: {
    atomInstances?: Omit<
      NonNullable<StructureTrainingPasses["atomInstances"]>,
      "annotations" | "blob"
    >;
    bondInstances?: Omit<
      NonNullable<StructureTrainingPasses["bondInstances"]>,
      "annotations" | "blob"
    >;
    depth?: Omit<NonNullable<StructureTrainingPasses["depth"]>, "data"> & {
      storageDtype: "float16";
    };
    unitCellInstances?: Omit<
      NonNullable<StructureTrainingPasses["unitCellInstances"]>,
      "annotations" | "blob"
    >;
  };
}

export interface StructureRasterCameraMetadata {
  height: number;
  matrixLayout: "row-major";
  position: [number, number, number];
  projection: "orthographic";
  projectionMatrix: number[][];
  quaternion: [number, number, number, number];
  target: [number, number, number];
  far: number;
  near: number;
  up: [number, number, number];
  viewMatrix: number[][];
  width: number;
}

export interface ProjectedAtomAnnotation {
  cameraDepth: number;
  clipDepth: number;
  element: string;
  imageOffset: [number, number, number];
  renderAtomId: string;
  siteId: string;
  siteIndex: number;
  withinFrame: boolean;
  xy: [number, number];
  instance?: import("./trainingPasses").AtomInstanceAnnotation;
}

export type ProjectedDisplayBondAnnotation = SceneSpec["bonds"][number] & {
  bondIndex: number;
  endRenderAtomId: string;
  endXy: [number, number];
  instance?: import("./trainingPasses").BondInstanceAnnotation;
  startRenderAtomId: string;
  startXy: [number, number];
};

export interface ProjectedUnitCellVertexAnnotation {
  cameraDepth: number;
  clipDepth: number;
  fractionalOffset: [number, number, number];
  vertexIndex: number;
  withinFrame: boolean;
  xy: [number, number];
}

export interface ProjectedUnitCellEdgeAnnotation {
  edgeIndex: number;
  endVertexIndex: number;
  endXy: [number, number];
  instance?: import("./trainingPasses").UnitCellEdgeInstanceAnnotation;
  startVertexIndex: number;
  startXy: [number, number];
}

export interface ProjectedUnitCellAnnotation {
  edges: ProjectedUnitCellEdgeAnnotation[];
  rendered: boolean;
  vertices: ProjectedUnitCellVertexAnnotation[];
}

export type RasterExportImageFormat = "jpg" | "png";

export interface RasterExportBounds {
  height: number;
  maxX: number;
  maxY: number;
  minX: number;
  minY: number;
  width: number;
}

export interface RasterExportTextItem {
  fontStyle?: "italic" | "normal";
  fontWeight?: number;
  label: string;
  size: number;
  x: number;
  y: number;
}

export interface RenderStructureRasterOptions {
  backgroundColor: string | null;
  cameraPose: CameraPoseSnapshot;
  componentOpacity: ComponentOpacityState;
  // Overrides the computed frame so animation frames share one zoom/center.
  frameOverride?: StructureExportFrameOverride;
  frameScale?: number;
  height: number;
  imageFormat: RasterExportImageFormat;
  lightStrength: number;
  meshQuality: ExportMeshQuality;
  scene: SceneSpec;
  showAtoms: boolean;
  showUnitCell: boolean;
  style: StyleState;
  supersampling: ExportSupersampling;
  unitCellLineColor?: string;
  unitCellLineStyle: UnitCellLineStyle;
  width: number;
  trainingOutputs?: readonly (
    | "atom_instances"
    | "bond_instances"
    | "depth"
    | "unit_cell_instances"
  )[];
}

export interface StructureExportFrameOverride {
  centerX: number;
  centerY: number;
  zoom: number;
}

export interface RenderCrystalAxesRasterOptions {
  backgroundColor: string | null;
  cameraPose: CameraPoseSnapshot;
  cellVectors: SceneSpec["cell"]["vectors"];
  cropPaddingRatio?: number;
  imageFormat: RasterExportImageFormat;
  includeLabelTextItems?: boolean;
  labelColor?: string;
  labelHaloColor?: string;
  showLabelHalo?: boolean;
  showLabels?: boolean;
  size: number;
  supersampling: ExportSupersampling;
}

export async function renderStructureRasterImage({
  backgroundColor,
  cameraPose,
  componentOpacity,
  frameOverride,
  frameScale = 1,
  height,
  imageFormat,
  lightStrength,
  meshQuality,
  scene,
  showAtoms,
  showUnitCell,
  style,
  supersampling,
  unitCellLineColor,
  unitCellLineStyle,
  width,
  trainingOutputs = [],
}: RenderStructureRasterOptions): Promise<RasterExportImage> {
  const renderWidth = width * supersampling;
  const renderHeight = height * supersampling;
  const canvas = document.createElement("canvas");
  canvas.width = renderWidth;
  canvas.height = renderHeight;
  canvas.style.cssText = [
    "position: fixed",
    "left: -10000px",
    "top: -10000px",
    `width: ${renderWidth}px`,
    `height: ${renderHeight}px`,
    "pointer-events: none",
  ].join(";");
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);

  const layout = computeSceneLayout(scene, style.atomRadiusModel);
  const materialFamily = resolveStructureMaterialFamilyForStyle(style);
  const materialFamilies = resolveStructureMaterialFamiliesForStyle(style);
  if (materialPresetEffectsRequirePreload(materialFamily.effects)) {
    await preloadMaterialPresetEffects();
  }
  const computedFramePlan = computeStructureExportFramePlan({
    cameraPose,
    componentOpacity,
    height: renderHeight,
    groupPosition: layout.groupPosition,
    scene,
    showAtoms,
    showUnitCell,
    style,
    width: renderWidth,
  });
  const exportFramePlan = frameOverride
    ? {
        ...computedFramePlan,
        centerX: frameOverride.centerX,
        centerY: frameOverride.centerY,
        zoom: frameOverride.zoom,
      }
    : {
        ...computedFramePlan,
        zoom: computedFramePlan.zoom * frameScale,
      };
  const meshDetail = EXPORT_SCENE_MESH_DETAIL_PRESETS[meshQuality];
  const lineWidthScale = structureLineWidthScale(exportFramePlan, supersampling);
  const root = createRoot(canvas);
  let rootState: RootState | null = null;
  let resolveMounted: (() => void) | null = null;
  const mounted = new Promise<void>((resolve) => {
    resolveMounted = resolve;
  });

  try {
    await root.configure({
      camera: {
        far: Math.max(1000, layout.standardPose.distance + layout.span * 8),
        near: 0.01,
        position: layout.standardPose.cameraPosition,
        zoom: 1,
      },
      dpr: 1,
      frameloop: "never",
      gl: DEFAULT_RENDERER_PARAMETERS,
      onCreated: (state) => {
        rootState = state;
        state.gl.setClearColor(backgroundColor ?? "#000000", backgroundColor ? 1 : 0);
      },
      orthographic: true,
      shadows: "soft",
      size: {
        height: renderHeight,
        left: 0,
        top: 0,
        width: renderWidth,
      },
    });

    const store = root.render(
      <>
        <MaterialPresetLights
          intensityScale={lightStrength}
          lighting={materialFamily.lighting}
          shadowExtent={layout.span}
        />
        <MaterialPresetEffects effects={materialFamily.effects} />
        <ExportSceneContent
          cameraPose={cameraPose}
          componentOpacity={componentOpacity}
          exportFramePlan={exportFramePlan}
          layout={layout}
          materialFamilies={materialFamilies}
          meshDetail={meshDetail}
          polyhedronEdgeLineWidthScale={lineWidthScale}
          scene={scene}
          showAtoms={showAtoms}
          showUnitCell={showUnitCell}
          style={style}
          unitCellLineColor={unitCellLineColor}
          unitCellLineStyle={unitCellLineStyle}
          unitCellLineWidthScale={lineWidthScale}
        />
        <RenderReady onReady={() => resolveMounted?.()} />
      </>,
    );

    await mounted;
    const state = rootState ?? store.getState();
    state.advance(performance.now(), true);
    state.advance(performance.now() + 16, true);

    const outputCanvas =
      supersampling === 1 ? canvas : downsampleCanvas(canvas, width, height);
    const blob = await canvasToRasterBlob(outputCanvas, imageFormat, backgroundColor);
    const structureMetadata = structureRasterMetadata({
      camera: state.camera,
      cameraPose,
      exportFramePlan,
      groupPosition: layout.groupPosition,
      height,
      scene,
      showUnitCell: showUnitCell && componentOpacity.unitCell > 0,
      supersampling,
      width,
    });
    let trainingPasses: StructureTrainingPasses | undefined;
    if (trainingOutputs.length > 0) {
      if (!(state.camera instanceof OrthographicCamera)) {
        throw new Error("Training supervision passes require an orthographic camera.");
      }
      const finalZoom = exportFramePlan.zoom / supersampling;
      const atomRadiusPixels = new Map(
        scene.atoms.map((atom) => [
          atom.id,
          atomRadiusForModel(atom, style.atomRadiusModel) *
            (style.atomRadius / 100) *
            finalZoom,
        ]),
      );
      trainingPasses = await renderStructureTrainingPasses({
        atomRadiusPixels,
        camera: state.camera,
        height,
        outputs: trainingOutputs,
        projectedAtoms: structureMetadata.atoms,
        projectedBonds: structureMetadata.displayBonds,
        projectedUnitCellEdges: structureMetadata.unitCell.edges,
        renderer: state.gl,
        scene: state.scene,
        width,
      });
      if (trainingPasses.atomInstances) {
        const instancesByAtomId = new Map(
          trainingPasses.atomInstances.annotations.map((annotation) => [
            annotation.renderAtomId,
            annotation,
          ]),
        );
        structureMetadata.atoms = structureMetadata.atoms.map((atom) => ({
          ...atom,
          instance: instancesByAtomId.get(atom.renderAtomId),
        }));
      }
      if (trainingPasses.bondInstances) {
        const instancesByBondIndex = new Map(
          trainingPasses.bondInstances.annotations.map((annotation) => [
            annotation.bondIndex,
            annotation,
          ]),
        );
        structureMetadata.displayBonds = structureMetadata.displayBonds.map((bond) => ({
          ...bond,
          instance: instancesByBondIndex.get(bond.bondIndex),
        }));
      }
      if (trainingPasses.unitCellInstances) {
        const instancesByEdgeIndex = new Map(
          trainingPasses.unitCellInstances.annotations.map((annotation) => [
            annotation.edgeIndex,
            annotation,
          ]),
        );
        structureMetadata.unitCell.edges = structureMetadata.unitCell.edges.map((edge) => ({
          ...edge,
          instance: instancesByEdgeIndex.get(edge.edgeIndex),
        }));
      }
      structureMetadata.training = {
        ...(trainingPasses.atomInstances
          ? {
              atomInstances: {
                backgroundId: trainingPasses.atomInstances.backgroundId,
                colorEncoding: trainingPasses.atomInstances.colorEncoding,
                occluderComponents: trainingPasses.atomInstances.occluderComponents,
              },
            }
          : {}),
        ...(trainingPasses.bondInstances
          ? {
              bondInstances: {
                backgroundId: trainingPasses.bondInstances.backgroundId,
                colorEncoding: trainingPasses.bondInstances.colorEncoding,
                occluderComponents: trainingPasses.bondInstances.occluderComponents,
                targetComponent: trainingPasses.bondInstances.targetComponent,
              },
            }
          : {}),
        ...(trainingPasses.depth
          ? {
              depth: {
                backgroundValue: trainingPasses.depth.backgroundValue,
                cameraDepthFormula: trainingPasses.depth.cameraDepthFormula,
                excludedGeometry: trainingPasses.depth.excludedGeometry,
                far: trainingPasses.depth.far,
                near: trainingPasses.depth.near,
                shape: trainingPasses.depth.shape,
                storageDtype: "float16" as const,
                transferDtype: trainingPasses.depth.transferDtype,
                transferByteOrder: trainingPasses.depth.transferByteOrder,
                valueConvention: trainingPasses.depth.valueConvention,
              },
            }
          : {}),
        ...(trainingPasses.unitCellInstances
          ? {
              unitCellInstances: {
                backgroundId: trainingPasses.unitCellInstances.backgroundId,
                colorEncoding: trainingPasses.unitCellInstances.colorEncoding,
                occluderComponents: trainingPasses.unitCellInstances.occluderComponents,
                targetComponent: trainingPasses.unitCellInstances.targetComponent,
              },
            }
          : {}),
      };
    }
    return {
      blob,
      contentBounds: structureFrameContentBounds(exportFramePlan, supersampling),
      height,
      structureMetadata,
      trainingPasses,
      width,
    };
  } finally {
    root.unmount();
    canvas.remove();
  }
}

export function structureRasterMetadata({
  camera,
  cameraPose,
  exportFramePlan,
  groupPosition,
  height,
  scene,
  showUnitCell,
  supersampling,
  width,
}: {
  camera: Camera;
  cameraPose: CameraPoseSnapshot;
  exportFramePlan: StructureExportFramePlan;
  groupPosition: [number, number, number];
  height: number;
  scene: SceneSpec;
  showUnitCell: boolean;
  supersampling: number;
  width: number;
}): StructureRasterMetadata {
  if (!(camera instanceof OrthographicCamera)) {
    throw new Error("Structure raster metadata requires an orthographic camera.");
  }
  camera.updateMatrixWorld(true);
  const position = camera.position.toArray() as [number, number, number];
  const up = camera.up.toArray() as [number, number, number];
  const quaternion = camera.quaternion.toArray() as [number, number, number, number];
  const groupOffset = new Vector3(...groupPosition);
  const projectPosition = (position: Vector3) => {
    const worldPosition = position.clone().add(groupOffset);
    const cameraPosition = worldPosition.clone().applyMatrix4(camera.matrixWorldInverse);
    const clipPosition = worldPosition.clone().project(camera);
    const x = ((clipPosition.x + 1) / 2) * width;
    const y = ((1 - clipPosition.y) / 2) * height;
    return {
      cameraDepth: -cameraPosition.z,
      clipDepth: clipPosition.z,
      withinFrame:
        x >= 0 &&
        x < width &&
        y >= 0 &&
        y < height &&
        clipPosition.z >= -1 &&
        clipPosition.z <= 1,
      xy: [x, y] as [number, number],
    };
  };
  const atoms = scene.atoms.map((atom): ProjectedAtomAnnotation => {
    const projected = projectPosition(new Vector3(...atom.position));
    return {
      cameraDepth: projected.cameraDepth,
      clipDepth: projected.clipDepth,
      element: atom.element,
      imageOffset: atom.imageOffset,
      renderAtomId: atom.id,
      siteId: atom.siteId,
      siteIndex: atom.siteIndex,
      withinFrame: projected.withinFrame,
      xy: projected.xy,
    };
  });
  const displayBonds = scene.bonds.map((bond, bondIndex): ProjectedDisplayBondAnnotation => {
    const startAtom = atoms[bond.startAtomIndex];
    const endAtom = atoms[bond.endAtomIndex];
    if (!startAtom || !endAtom) {
      throw new Error(`Display bond ${bondIndex} references a missing rendered atom.`);
    }
    return {
      ...bond,
      bondIndex,
      endRenderAtomId: endAtom.renderAtomId,
      endXy: endAtom.xy,
      startRenderAtomId: startAtom.renderAtomId,
      startXy: startAtom.xy,
    };
  });
  const vertices = cellCorners(scene.cell.vectors).map(
    (corner, vertexIndex): ProjectedUnitCellVertexAnnotation => ({
      ...projectPosition(corner),
      fractionalOffset: [...CELL_CORNER_FRACTIONAL_OFFSETS[vertexIndex]!] as [
        number,
        number,
        number,
      ],
      vertexIndex,
    }),
  );
  const unitCell: ProjectedUnitCellAnnotation = {
    edges: CELL_FRAME_VERTEX_INDEX_PAIRS.map(
      ([startVertexIndex, endVertexIndex], edgeIndex): ProjectedUnitCellEdgeAnnotation => ({
        edgeIndex,
        endVertexIndex,
        endXy: vertices[endVertexIndex]!.xy,
        startVertexIndex,
        startXy: vertices[startVertexIndex]!.xy,
      }),
    ),
    rendered: showUnitCell,
    vertices,
  };

  return {
    atoms,
    camera: {
      height,
      matrixLayout: "row-major",
      position,
      projection: "orthographic",
      projectionMatrix: matrixRows(camera.projectionMatrix),
      quaternion,
      target: cameraPose.target,
      far: camera.far,
      near: camera.near,
      up,
      viewMatrix: matrixRows(camera.matrixWorldInverse),
      width,
    },
    displayBonds,
    frame: {
      centerX: exportFramePlan.centerX / supersampling,
      centerY: exportFramePlan.centerY / supersampling,
      groupPosition,
      supersampling,
      zoom: exportFramePlan.zoom / supersampling,
    },
    polyhedra: scene.polyhedra,
    unitCell,
  };
}

function matrixRows(matrix: Matrix4): number[][] {
  const elements = matrix.elements;
  return Array.from({ length: 4 }, (_, row) =>
    Array.from({ length: 4 }, (_, column) => elements[column * 4 + row] ?? 0),
  );
}

export function structureLineWidthScale(
  framePlan: StructureExportFramePlan,
  supersampling: number,
): number {
  const referenceSize = structureFrameReferenceSize(framePlan, supersampling);
  const finalLineWidth = referenceSize
    ? Math.max(
        STRUCTURE_LINE_WIDTH_MIN_PIXELS,
        referenceSize * STRUCTURE_LINE_WIDTH_REFERENCE_RATIO,
      )
    : 2;

  return finalLineWidth * Math.max(1, supersampling);
}

function structureFrameContentBounds(
  framePlan: StructureExportFramePlan,
  supersampling: number,
): RasterExportBounds | undefined {
  const bounds = framePlan.bounds;
  if (!bounds) {
    return undefined;
  }

  const minX =
    ((bounds.minX - framePlan.centerX) * framePlan.zoom + framePlan.width / 2) / supersampling;
  const maxX =
    ((bounds.maxX - framePlan.centerX) * framePlan.zoom + framePlan.width / 2) / supersampling;
  const minY =
    (framePlan.height / 2 - (bounds.maxY - framePlan.centerY) * framePlan.zoom) /
    supersampling;
  const maxY =
    (framePlan.height / 2 - (bounds.minY - framePlan.centerY) * framePlan.zoom) /
    supersampling;

  return {
    height: Math.max(0, maxY - minY),
    maxX,
    maxY,
    minX,
    minY,
    width: Math.max(0, maxX - minX),
  };
}

function structureFrameReferenceSize(
  framePlan: StructureExportFramePlan,
  supersampling: number,
): number | null {
  const bounds = structureFrameContentBounds(framePlan, supersampling);
  if (!bounds || bounds.width <= 0 || bounds.height <= 0) {
    return null;
  }

  return Math.sqrt(bounds.width * bounds.height);
}

export async function renderCrystalAxesRasterImage({
  backgroundColor,
  cameraPose,
  cellVectors,
  cropPaddingRatio = 0.04,
  imageFormat,
  includeLabelTextItems,
  labelColor,
  labelHaloColor,
  showLabelHalo = true,
  showLabels = true,
  size,
  supersampling,
}: RenderCrystalAxesRasterOptions): Promise<RasterExportImage> {
  const includeProjectedTextItems = includeLabelTextItems ?? !showLabels;
  const renderSize = size * supersampling;
  const canvas = document.createElement("canvas");
  canvas.width = renderSize;
  canvas.height = renderSize;
  canvas.style.cssText = [
    "position: fixed",
    "left: -10000px",
    "top: -10000px",
    `width: ${renderSize}px`,
    `height: ${renderSize}px`,
    "pointer-events: none",
  ].join(";");
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);

  const axes = computeOrientationGizmoAxes(cellVectors);
  const root = createRoot(canvas);
  let rootState: RootState | null = null;
  let resolveMounted: (() => void) | null = null;
  const mounted = new Promise<void>((resolve) => {
    resolveMounted = resolve;
  });

  try {
    await root.configure({
      camera: {
        far: 20,
        near: 0.1,
        position: ORIENTATION_GIZMO_CAMERA_POSITION,
        zoom: renderSize * ORIENTATION_GIZMO_ZOOM_PER_CANVAS_PIXEL,
      },
      dpr: 1,
      frameloop: "never",
      gl: {
        ...DEFAULT_RENDERER_PARAMETERS,
        alpha: true,
      },
      onCreated: (state) => {
        rootState = state;
      },
      orthographic: true,
      size: {
        height: renderSize,
        left: 0,
        top: 0,
        width: renderSize,
      },
    });

    const store = root.render(
      <>
        <ambientLight intensity={0.68} />
        <CameraHeadlight />
        <StaticOrientationGizmoScene
          axes={axes}
          cameraPose={cameraPose}
          labelColor={labelColor}
          labelHaloColor={labelHaloColor}
          showLabelHalo={showLabelHalo}
          showLabels={showLabels}
        />
        <RenderReady onReady={() => resolveMounted?.()} />
      </>,
    );

    await mounted;
    const state = rootState ?? store.getState();
    state.advance(performance.now(), true);
    state.advance(performance.now() + 16, true);

    const projectedTextItems = crystalAxisTextItems({
      axes,
      cameraPose,
      crop: {
        sourceX: 0,
        sourceY: 0,
      },
      renderSize,
      rootState: state,
      supersampling,
    });
    const cropped = cropTransparentCanvas(
      canvas,
      cropPaddingRatio,
      includeProjectedTextItems ? textBounds(projectedTextItems) : [],
    );
    const textItems = includeProjectedTextItems
      ? projectedTextItems.map((item) => ({
          ...item,
          size: item.size / supersampling,
          x: (item.x - cropped.crop.sourceX) / supersampling,
          y: (item.y - cropped.crop.sourceY) / supersampling,
        }))
      : undefined;
    const outputCanvas =
      supersampling === 1
        ? cropped.canvas
        : downsampleCanvas(
            cropped.canvas,
            Math.max(1, Math.round(cropped.canvas.width / supersampling)),
            Math.max(1, Math.round(cropped.canvas.height / supersampling)),
          );
    const blob = await canvasToRasterBlob(outputCanvas, imageFormat, backgroundColor);
    return { blob, height: outputCanvas.height, textItems, width: outputCanvas.width };
  } finally {
    root.unmount();
    canvas.remove();
  }
}

function RenderReady({ onReady }: { onReady: () => void }) {
  useLayoutEffect(() => {
    onReady();
  }, [onReady]);

  return null;
}

function downsampleCanvas(sourceCanvas: HTMLCanvasElement, width: number, height: number) {
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = width;
  outputCanvas.height = height;
  const context = outputCanvas.getContext("2d");
  if (!context) {
    throw new Error("Could not prepare the export downsampling canvas.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(sourceCanvas, 0, 0, width, height);
  return outputCanvas;
}

function cropTransparentCanvas(
  sourceCanvas: HTMLCanvasElement,
  paddingRatio: number,
  extraBounds: Array<{ maxX: number; maxY: number; minX: number; minY: number }> = [],
) {
  const readableCanvas = document.createElement("canvas");
  readableCanvas.width = sourceCanvas.width;
  readableCanvas.height = sourceCanvas.height;
  const sourceContext = readableCanvas.getContext("2d", { willReadFrequently: true });
  if (!sourceContext) {
    throw new Error("Could not prepare the crystal axes crop canvas.");
  }

  sourceContext.drawImage(sourceCanvas, 0, 0);

  const image = sourceContext.getImageData(0, 0, readableCanvas.width, readableCanvas.height);
  const bounds = mergeBounds([
    alphaBounds(image.data, readableCanvas.width, readableCanvas.height),
    ...extraBounds,
  ]);
  if (!bounds) {
    return {
      canvas: sourceCanvas,
      crop: {
        sourceX: 0,
        sourceY: 0,
      },
    };
  }

  const contentWidth = bounds.maxX - bounds.minX + 1;
  const contentHeight = bounds.maxY - bounds.minY + 1;
  const padding = Math.max(
    1,
    Math.round(Math.max(contentWidth, contentHeight) * paddingRatio),
  );
  const sourceX = Math.max(0, Math.floor(bounds.minX - padding));
  const sourceY = Math.max(0, Math.floor(bounds.minY - padding));
  const sourceRight = Math.min(readableCanvas.width - 1, Math.ceil(bounds.maxX + padding));
  const sourceBottom = Math.min(readableCanvas.height - 1, Math.ceil(bounds.maxY + padding));
  const targetWidth = sourceRight - sourceX + 1;
  const targetHeight = sourceBottom - sourceY + 1;

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = targetWidth;
  outputCanvas.height = targetHeight;
  const outputContext = outputCanvas.getContext("2d");
  if (!outputContext) {
    throw new Error("Could not crop the crystal axes export canvas.");
  }

  outputContext.drawImage(
    readableCanvas,
    sourceX,
    sourceY,
    targetWidth,
    targetHeight,
    0,
    0,
    targetWidth,
    targetHeight,
  );
  return {
    canvas: outputCanvas,
    crop: {
      sourceX,
      sourceY,
    },
  };
}

function textBounds(textItems: RasterExportTextItem[]) {
  return textItems.map((item) => {
    const approximateWidth = item.label.length * item.size * 0.72;
    const approximateHeight = item.size;
    const minX = item.x - approximateWidth / 2;
    const maxX = item.x + approximateWidth / 2;
    const minY = item.y - approximateHeight / 2;
    const maxY = item.y + approximateHeight / 2;
    return {
      maxX,
      maxY,
      minX,
      minY,
    };
  });
}

function mergeBounds(
  bounds: Array<{ maxX: number; maxY: number; minX: number; minY: number } | null>,
) {
  const presentBounds = bounds.filter(
    (bound): bound is { maxX: number; maxY: number; minX: number; minY: number } =>
      bound !== null,
  );
  if (presentBounds.length === 0) {
    return null;
  }

  return presentBounds.reduce((merged, bound) => ({
    maxX: Math.max(merged.maxX, bound.maxX),
    maxY: Math.max(merged.maxY, bound.maxY),
    minX: Math.min(merged.minX, bound.minX),
    minY: Math.min(merged.minY, bound.minY),
  }));
}

function crystalAxisTextItems({
  axes,
  cameraPose,
  crop,
  renderSize,
  rootState,
  supersampling,
}: {
  axes: OrientationGizmoAxisSpec[];
  cameraPose: CameraPoseSnapshot;
  crop: { sourceX: number; sourceY: number };
  renderSize: number;
  rootState: RootState;
  supersampling: number;
}): RasterExportTextItem[] {
  const inverseRotation = new Quaternion(...cameraPose.quaternion).invert();

  return axes.map((axis) => {
    const worldPosition = new Vector3(...axis.direction)
      .multiplyScalar(ORIENTATION_GIZMO_LABEL_DISTANCE * ORIENTATION_GIZMO_SCALE)
      .applyQuaternion(inverseRotation);
    const projected = worldPosition.project(rootState.camera);
    return {
      fontStyle: "italic",
      fontWeight: 500,
      label: axis.label,
      size: 56 * supersampling,
      x: ((projected.x + 1) / 2) * renderSize - crop.sourceX,
      y: ((1 - projected.y) / 2) * renderSize - crop.sourceY,
    };
  });
}

function alphaBounds(data: Uint8ClampedArray, width: number, height: number) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3] ?? 0;
      if (alpha === 0) {
        continue;
      }

      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  return maxX >= minX && maxY >= minY
    ? {
        maxX,
        maxY,
        minX,
        minY,
      }
    : null;
}

function canvasToRasterBlob(
  canvas: HTMLCanvasElement,
  imageFormat: RasterExportImageFormat,
  backgroundColor: string | null,
): Promise<Blob> {
  const outputCanvas = canvasWithRasterBackground(canvas, imageFormat, backgroundColor);
  const mimeType = imageFormat === "jpg" ? "image/jpeg" : "image/png";
  const quality = imageFormat === "jpg" ? 0.95 : undefined;

  return new Promise((resolve, reject) => {
    outputCanvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(`Could not encode the exported ${imageFormat.toUpperCase()} image.`));
          return;
        }

        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
}

function canvasWithRasterBackground(
  canvas: HTMLCanvasElement,
  imageFormat: RasterExportImageFormat,
  backgroundColor: string | null,
) {
  if (backgroundColor === null && imageFormat === "png") {
    return canvas;
  }

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = canvas.width;
  outputCanvas.height = canvas.height;
  const context = outputCanvas.getContext("2d");
  if (!context) {
    throw new Error("Could not prepare the raster export background.");
  }

  context.fillStyle = backgroundColor ?? "#ffffff";
  context.fillRect(0, 0, outputCanvas.width, outputCanvas.height);
  context.drawImage(canvas, 0, 0);
  return outputCanvas;
}
