import { extend } from "@react-three/fiber";
import * as THREE from "three";
import { Quaternion } from "three";

import type { SceneSpec } from "../api/scene";
import { createFigureExportFiles } from "../app/exportFigure";
import { pxrdChartSvg, type PxrdPattern } from "../pxrd/pxrdChart";
import {
  ANIMATION_FRAME_COUNT_MAX,
  rejectOnWindowError,
  renderAnimationFrameImages,
  turntableQuaternion,
  type AnimationFrame,
} from "../scene/animationFrames";
import { COLOR_SCHEMES } from "../model/colorSchemes";
import { visibleSceneForComponents } from "../model";
import {
  createDefaultComponentOpacity,
  createDefaultComponentVisibility,
  createDefaultExportSettings,
  createDefaultStyle,
  createCustomColormapFromScheme,
  clampLightStrength,
  DEFAULT_UNIT_CELL_LINE_STYLE,
  EXPORT_BACKGROUND_OPTIONS,
  EXPORT_FORMAT_OPTIONS,
  EXPORT_LEGEND_LAYOUT_OPTIONS,
  EXPORT_SUPERSAMPLING_OPTIONS,
  MESH_QUALITY_OPTIONS,
  type ComponentOpacityState,
  type ComponentVisibilityState,
  type ExportSettingsState,
  type StyleState,
  type UnitCellLineStyle,
} from "../model";
import { materialPresetById } from "../model/materialPresets";
import {
  applyCrystalCameraRoll,
  computeCrystalCameraPose,
  createDefaultCrystalCameraState,
} from "../scene/crystalCamera";
import type { CrystalCameraState } from "../scene/crystalCamera";
import { computeSceneStructureLayout } from "../scene/sceneLayout";

const ATOM_RADIUS_MODELS = ["uniform", "atomic", "vdw", "ionic"] as const;
const BOND_COLOR_MODES = ["unicolor", "bicolor"] as const;
const SCREEN_DIRECTIONS = ["right", "upward", "outward"] as const;
const UNIT_CELL_LINE_STYLES = ["solid", "dashed"] as const;

export interface HeadlessRenderedFile {
  dataBase64: string;
  fileName: string;
  format: string;
}

export interface HeadlessRenderResult {
  files: HeadlessRenderedFile[];
}

interface HeadlessRenderInputs {
  cameraQuaternion: [number, number, number, number] | null;
  componentOpacity: ComponentOpacityState;
  componentVisibility: ComponentVisibilityState;
  exportSettings: ExportSettingsState;
  fileName: string | null;
  lightStrength: number;
  orientation: CrystalCameraState | null;
  rollDegrees: number;
  scene: SceneSpec;
  showCrystalAxisLabels: boolean;
  style: StyleState;
  unitCellLineStyle: UnitCellLineStyle;
}

export interface HeadlessAnimationResult {
  frames: string[];
  height: number;
  width: number;
}

declare global {
  interface Window {
    __prettyCrystalHeadless?: {
      renderPxrdChart: (payload: unknown) => string;
      renderStructureAnimation: (payload: unknown) => Promise<HeadlessAnimationResult>;
      renderStructureImage: (payload: unknown) => Promise<HeadlessRenderResult>;
      version: 1;
    };
  }
}

export function installHeadlessRenderBridge() {
  // The interactive app registers the Three.js element catalogue via <Canvas>;
  // headless mode never mounts one, so the export roots need it registered here.
  extend(THREE as unknown as Parameters<typeof extend>[0]);

  window.__prettyCrystalHeadless = {
    renderPxrdChart,
    renderStructureAnimation,
    renderStructureImage,
    version: 1,
  };
}

function renderPxrdChart(payload: unknown): string {
  const root = expectRecord(payload, "payload");
  assertKnownKeys(root, "payload", ["options", "pattern"]);

  const pattern = expectRecord(root.pattern, "payload.pattern");
  if (!Array.isArray(pattern.peaks)) {
    throw new Error("payload.pattern must be a PXRD pattern object.");
  }

  const options =
    root.options === undefined || root.options === null
      ? {}
      : expectRecord(root.options, "payload.options");

  return pxrdChartSvg(pattern as unknown as PxrdPattern, {
    fwhm: optionalNumber(options.fwhm, "payload.options.fwhm"),
    height: optionalNumber(options.height, "payload.options.height"),
    labelCount: optionalNumber(options.labelCount, "payload.options.labelCount"),
    showHklLabels:
      options.showHklLabels === undefined || options.showHklLabels === null
        ? undefined
        : expectBooleanValue(options.showHklLabels, "payload.options.showHklLabels"),
    title:
      options.title === undefined || options.title === null
        ? undefined
        : expectString(options.title, "payload.options.title"),
    width: optionalNumber(options.width, "payload.options.width"),
  });
}

function optionalNumber(data: unknown, path: string): number | undefined {
  if (data === undefined || data === null) {
    return undefined;
  }
  return expectNumber(data, path);
}

function expectBooleanValue(data: unknown, path: string): boolean {
  if (typeof data !== "boolean") {
    throw new Error(`${path} must be a boolean.`);
  }
  return data;
}

async function renderStructureImage(payload: unknown): Promise<HeadlessRenderResult> {
  const inputs = parseHeadlessRenderPayload(payload);
  const cameraQuaternion = resolveCameraQuaternion(inputs);

  const files = await rejectOnWindowError(
    createFigureExportFiles({
      cameraOrientationRef: { current: cameraQuaternion },
      componentOpacity: inputs.componentOpacity,
      componentVisibility: inputs.componentVisibility,
      fileName: inputs.fileName,
      lightStrength: inputs.lightStrength,
      scene: inputs.scene,
      settings: inputs.exportSettings,
      showCrystalAxisLabels: inputs.showCrystalAxisLabels,
      style: inputs.style,
      unitCellLineStyle: inputs.unitCellLineStyle,
    }),
  );

  return {
    files: await Promise.all(
      files.map(async (file) => ({
        dataBase64: await blobToBase64(file.blob),
        fileName: file.fileName,
        format: file.format,
      })),
    ),
  };
}

async function renderStructureAnimation(
  payload: unknown,
): Promise<HeadlessAnimationResult> {
  const root = expectRecord(payload, "payload");
  assertKnownKeys(root, "payload", ["animation", "fileName", "scenes", "settings"]);

  if (!Array.isArray(root.scenes) || root.scenes.length === 0) {
    throw new Error("payload.scenes must be a non-empty array of scene objects.");
  }
  const scenes = root.scenes.map((scene) => expectScene(scene));

  const animation =
    root.animation === undefined || root.animation === null
      ? {}
      : expectRecord(root.animation, "payload.animation");
  assertKnownKeys(animation, "payload.animation", ["turntableFrames"]);

  const turntableFrames =
    animation.turntableFrames === undefined
      ? null
      : expectNumber(animation.turntableFrames, "payload.animation.turntableFrames");
  if (turntableFrames !== null) {
    if (scenes.length !== 1) {
      throw new Error(
        "payload.animation.turntableFrames requires exactly one scene.",
      );
    }
    if (
      !Number.isInteger(turntableFrames) ||
      turntableFrames < 2 ||
      turntableFrames > ANIMATION_FRAME_COUNT_MAX
    ) {
      throw new Error(
        `payload.animation.turntableFrames must be an integer between 2 and ${ANIMATION_FRAME_COUNT_MAX}.`,
      );
    }
  } else if (scenes.length > ANIMATION_FRAME_COUNT_MAX) {
    throw new Error(
      `payload.scenes must contain at most ${ANIMATION_FRAME_COUNT_MAX} frames.`,
    );
  }

  const inputs = parseHeadlessRenderPayload({
    fileName: root.fileName,
    scene: scenes[0],
    settings: root.settings,
  });
  const baseQuaternion = resolveCameraQuaternion(inputs);

  const visibleScenes = scenes.map((scene) => {
    const visibleScene = visibleSceneForComponents(scene, inputs.componentVisibility);
    if (!visibleScene) {
      throw new Error("No structure is available to render.");
    }
    return visibleScene;
  });
  const frames: AnimationFrame[] =
    turntableFrames !== null
      ? Array.from({ length: turntableFrames }, (_, index) => ({
          quaternion: turntableQuaternion(
            baseQuaternion,
            (index / turntableFrames) * Math.PI * 2,
          ),
          scene: visibleScenes[0]!,
        }))
      : visibleScenes.map((scene) => ({ quaternion: baseQuaternion, scene }));

  const images = await renderAnimationFrameImages({
    componentOpacity: inputs.componentOpacity,
    exportSettings: inputs.exportSettings,
    frames,
    lightStrength: inputs.lightStrength,
    showAtoms: inputs.componentVisibility.atoms,
    showUnitCell: inputs.componentVisibility.unitCell,
    style: inputs.style,
    unitCellLineStyle: inputs.unitCellLineStyle,
  });

  return {
    frames: await Promise.all(images.map((image) => blobToBase64(image))),
    height: inputs.exportSettings.height,
    width: inputs.exportSettings.width,
  };
}

function resolveCameraQuaternion(inputs: HeadlessRenderInputs): Quaternion {
  if (inputs.cameraQuaternion) {
    return new Quaternion(...inputs.cameraQuaternion).normalize();
  }

  const vectors = inputs.scene.cell.vectors;
  const baseState = inputs.orientation ?? createDefaultCrystalCameraState(vectors);
  const state =
    inputs.rollDegrees !== 0
      ? applyCrystalCameraRoll(vectors, baseState, inputs.rollDegrees)
      : baseState;
  const span = computeSceneStructureLayout(inputs.scene).span;
  return computeCrystalCameraPose(vectors, state, span).quaternion.clone();
}

export function parseHeadlessRenderPayload(payload: unknown): HeadlessRenderInputs {
  const root = expectRecord(payload, "payload");
  assertKnownKeys(root, "payload", ["fileName", "scene", "settings"]);

  const scene = expectScene(root.scene);
  const fileName =
    root.fileName === undefined || root.fileName === null
      ? null
      : expectString(root.fileName, "payload.fileName");

  const settings =
    root.settings === undefined || root.settings === null
      ? {}
      : expectRecord(root.settings, "payload.settings");
  assertKnownKeys(settings, "payload.settings", [
    "componentOpacity",
    "componentVisibility",
    "export",
    "lightStrength",
    "orientation",
    "showCrystalAxisLabels",
    "style",
    "unitCellLineStyle",
  ]);

  const orientation = parseOrientation(settings.orientation, scene);

  return {
    cameraQuaternion: orientation.quaternion,
    componentOpacity: parseComponentOpacity(settings.componentOpacity),
    componentVisibility: parseComponentVisibility(settings.componentVisibility),
    exportSettings: parseExportSettings(settings.export),
    fileName,
    lightStrength:
      settings.lightStrength === undefined
        ? 1
        : clampLightStrength(
            expectNumber(settings.lightStrength, "payload.settings.lightStrength"),
          ),
    orientation: orientation.state,
    rollDegrees: orientation.rollDegrees,
    scene,
    showCrystalAxisLabels:
      settings.showCrystalAxisLabels === undefined
        ? true
        : expectBoolean(
            settings.showCrystalAxisLabels,
            "payload.settings.showCrystalAxisLabels",
          ),
    style: parseStyle(settings.style),
    unitCellLineStyle:
      settings.unitCellLineStyle === undefined
        ? DEFAULT_UNIT_CELL_LINE_STYLE
        : expectOneOf(
            settings.unitCellLineStyle,
            UNIT_CELL_LINE_STYLES,
            "payload.settings.unitCellLineStyle",
          ),
  };
}

function expectScene(data: unknown): SceneSpec {
  const scene = expectRecord(data, "payload.scene");
  if (!Array.isArray(scene.atoms) || !scene.cell) {
    throw new Error("payload.scene must be a Pretty Crystal scene JSON object.");
  }
  return scene as unknown as SceneSpec;
}

function parseStyle(data: unknown): StyleState {
  const style = createDefaultStyle();
  if (data === undefined || data === null) {
    return style;
  }

  const record = expectRecord(data, "payload.settings.style");
  assertKnownKeys(record, "payload.settings.style", [
    "asuGhostOpacity",
    "asuHighlight",
    "atomRadius",
    "atomRadiusModel",
    "bondColor",
    "bondColorMode",
    "bondThickness",
    "colorScheme",
    "distinguishSimilarColors",
    "elementColors",
    "fogAffectsUnitCell",
    "fogAmount",
    "fogEnabled",
    "fogStart",
    "latticePlane",
    "materialPreset",
    "vectorGlyphProperty",
    "vectorGlyphScale",
  ]);
  const path = "payload.settings.style";

  if (record.asuGhostOpacity !== undefined) {
    style.asuGhostOpacity = expectNumber(
      record.asuGhostOpacity,
      `${path}.asuGhostOpacity`,
    );
  }
  if (record.asuHighlight !== undefined) {
    style.asuHighlight = expectBoolean(record.asuHighlight, `${path}.asuHighlight`);
  }
  if (record.atomRadius !== undefined) {
    style.atomRadius = expectNumber(record.atomRadius, `${path}.atomRadius`);
  }
  if (record.atomRadiusModel !== undefined) {
    style.atomRadiusModel = expectOneOf(
      record.atomRadiusModel,
      ATOM_RADIUS_MODELS,
      `${path}.atomRadiusModel`,
    );
  }
  if (record.bondColor !== undefined) {
    style.bondColor = expectString(record.bondColor, `${path}.bondColor`);
  }
  if (record.bondColorMode !== undefined) {
    style.bondColorMode = expectOneOf(
      record.bondColorMode,
      BOND_COLOR_MODES,
      `${path}.bondColorMode`,
    );
  }
  if (record.bondThickness !== undefined) {
    style.bondThickness = expectNumber(record.bondThickness, `${path}.bondThickness`);
  }
  if (record.colorScheme !== undefined) {
    const colorScheme = expectString(record.colorScheme, `${path}.colorScheme`);
    if (!COLOR_SCHEMES.some((scheme) => scheme.id === colorScheme)) {
      throw new Error(
        `${path}.colorScheme must be one of ${COLOR_SCHEMES.map((scheme) => scheme.id).join(", ")}.`,
      );
    }
    style.colorScheme = colorScheme;
  }
  if (record.distinguishSimilarColors !== undefined) {
    style.distinguishSimilarColors = expectBoolean(
      record.distinguishSimilarColors,
      `${path}.distinguishSimilarColors`,
    );
  }
  if (record.fogAffectsUnitCell !== undefined) {
    style.fogAffectsUnitCell = expectBoolean(
      record.fogAffectsUnitCell,
      `${path}.fogAffectsUnitCell`,
    );
  }
  if (record.fogAmount !== undefined) {
    style.fogAmount = expectNumber(record.fogAmount, `${path}.fogAmount`);
  }
  if (record.fogEnabled !== undefined) {
    style.fogEnabled = expectBoolean(record.fogEnabled, `${path}.fogEnabled`);
  }
  if (record.fogStart !== undefined) {
    style.fogStart = expectNumber(record.fogStart, `${path}.fogStart`);
  }
  if (record.materialPreset !== undefined) {
    const materialPreset = expectString(record.materialPreset, `${path}.materialPreset`);
    materialPresetById(materialPreset);
    style.materialPreset = materialPreset;
  }
  if (record.latticePlane !== undefined && record.latticePlane !== null) {
    const planeRecord = expectRecord(record.latticePlane, `${path}.latticePlane`);
    assertKnownKeys(planeRecord, `${path}.latticePlane`, [
      "color",
      "h",
      "k",
      "l",
      "offsetPercent",
      "opacityPercent",
    ]);
    style.latticePlane = {
      ...(planeRecord.color === undefined || planeRecord.color === null
        ? {}
        : { color: expectString(planeRecord.color, `${path}.latticePlane.color`) }),
      h: expectNumber(planeRecord.h, `${path}.latticePlane.h`),
      k: expectNumber(planeRecord.k, `${path}.latticePlane.k`),
      l: expectNumber(planeRecord.l, `${path}.latticePlane.l`),
      offsetPercent:
        planeRecord.offsetPercent === undefined
          ? 50
          : expectNumber(planeRecord.offsetPercent, `${path}.latticePlane.offsetPercent`),
      ...(planeRecord.opacityPercent === undefined || planeRecord.opacityPercent === null
        ? {}
        : {
            opacityPercent: expectNumber(
              planeRecord.opacityPercent,
              `${path}.latticePlane.opacityPercent`,
            ),
          }),
    };
  }
  if (record.vectorGlyphProperty !== undefined && record.vectorGlyphProperty !== null) {
    style.vectorGlyphProperty = expectString(
      record.vectorGlyphProperty,
      `${path}.vectorGlyphProperty`,
    );
  }
  if (record.vectorGlyphScale !== undefined) {
    style.vectorGlyphScale = expectNumber(
      record.vectorGlyphScale,
      `${path}.vectorGlyphScale`,
    );
  }
  if (record.elementColors !== undefined) {
    const elementColors = expectRecord(record.elementColors, `${path}.elementColors`);
    const overrides: Record<string, string> = {};
    for (const [element, color] of Object.entries(elementColors)) {
      overrides[element] = expectString(color, `${path}.elementColors.${element}`);
    }

    const customColormap = createCustomColormapFromScheme(style.colorScheme);
    customColormap.elements = { ...customColormap.elements, ...overrides };
    style.colorSchemeMode = "custom";
    style.customColormap = customColormap;
  }

  return style;
}

function parseComponentVisibility(data: unknown): ComponentVisibilityState {
  const visibility = createDefaultComponentVisibility();
  if (data === undefined || data === null) {
    return visibility;
  }

  const record = expectRecord(data, "payload.settings.componentVisibility");
  const knownKeys = Object.keys(visibility);
  assertKnownKeys(record, "payload.settings.componentVisibility", knownKeys);
  for (const key of knownKeys) {
    const value = record[key];
    if (value !== undefined) {
      visibility[key as keyof ComponentVisibilityState] = expectBoolean(
        value,
        `payload.settings.componentVisibility.${key}`,
      );
    }
  }

  return visibility;
}

function parseComponentOpacity(data: unknown): ComponentOpacityState {
  const opacity = createDefaultComponentOpacity();
  if (data === undefined || data === null) {
    return opacity;
  }

  const record = expectRecord(data, "payload.settings.componentOpacity");
  const knownKeys = Object.keys(opacity);
  assertKnownKeys(record, "payload.settings.componentOpacity", knownKeys);
  for (const key of knownKeys) {
    const value = record[key];
    if (value !== undefined) {
      opacity[key as keyof ComponentOpacityState] = expectNumber(
        value,
        `payload.settings.componentOpacity.${key}`,
      );
    }
  }

  return opacity;
}

function parseExportSettings(data: unknown): ExportSettingsState {
  const settings = createDefaultExportSettings();
  if (data === undefined || data === null) {
    return settings;
  }

  const record = expectRecord(data, "payload.settings.export");
  assertKnownKeys(record, "payload.settings.export", [
    "background",
    "combineComponents",
    "components",
    "format",
    "height",
    "legendLayout",
    "meshQuality",
    "supersampling",
    "width",
  ]);
  const path = "payload.settings.export";

  if (record.background !== undefined) {
    settings.background = expectOneOf(
      record.background,
      EXPORT_BACKGROUND_OPTIONS,
      `${path}.background`,
    );
  }
  if (record.combineComponents !== undefined) {
    settings.combineComponents = expectBoolean(
      record.combineComponents,
      `${path}.combineComponents`,
    );
  }
  if (record.components !== undefined) {
    const components = expectRecord(record.components, `${path}.components`);
    const knownKeys = Object.keys(settings.components);
    assertKnownKeys(components, `${path}.components`, knownKeys);
    for (const key of knownKeys) {
      const value = components[key];
      if (value !== undefined) {
        settings.components[key as keyof ExportSettingsState["components"]] =
          expectBoolean(value, `${path}.components.${key}`);
      }
    }
  }
  if (record.format !== undefined) {
    settings.format = expectOneOf(record.format, EXPORT_FORMAT_OPTIONS, `${path}.format`);
  }
  if (record.height !== undefined) {
    settings.height = expectNumber(record.height, `${path}.height`);
  }
  if (record.legendLayout !== undefined) {
    settings.legendLayout = expectOneOf(
      record.legendLayout,
      EXPORT_LEGEND_LAYOUT_OPTIONS,
      `${path}.legendLayout`,
    );
  }
  if (record.meshQuality !== undefined) {
    settings.meshQuality = expectOneOf(
      record.meshQuality,
      MESH_QUALITY_OPTIONS,
      `${path}.meshQuality`,
    );
  }
  if (record.supersampling !== undefined) {
    settings.supersampling = expectOneOf(
      record.supersampling,
      EXPORT_SUPERSAMPLING_OPTIONS,
      `${path}.supersampling`,
    );
  }
  if (record.width !== undefined) {
    settings.width = expectNumber(record.width, `${path}.width`);
  }

  return settings;
}

function parseOrientation(
  data: unknown,
  scene: SceneSpec,
): {
  quaternion: [number, number, number, number] | null;
  rollDegrees: number;
  state: CrystalCameraState | null;
} {
  if (data === undefined || data === null) {
    return { quaternion: null, rollDegrees: 0, state: null };
  }

  const record = expectRecord(data, "payload.settings.orientation");
  assertKnownKeys(record, "payload.settings.orientation", [
    "direct",
    "primary",
    "quaternion",
    "reciprocal",
    "rollDegrees",
    "secondary",
  ]);
  const path = "payload.settings.orientation";

  if (record.quaternion !== undefined) {
    const otherKeys = Object.keys(record).filter((key) => key !== "quaternion");
    if (otherKeys.length > 0) {
      throw new Error(
        `${path}.quaternion cannot be combined with ${otherKeys.join(", ")}.`,
      );
    }
    return {
      quaternion: expectQuaternionTuple(record.quaternion, `${path}.quaternion`),
      rollDegrees: 0,
      state: null,
    };
  }

  const state = createDefaultCrystalCameraState(scene.cell.vectors);

  if (record.direct !== undefined) {
    state.direct = expectVectorTuple(record.direct, `${path}.direct`);
  }
  if (record.reciprocal !== undefined) {
    state.reciprocal = expectVectorTuple(record.reciprocal, `${path}.reciprocal`);
  }
  if (record.primary !== undefined) {
    state.primary = expectOneOf(record.primary, SCREEN_DIRECTIONS, `${path}.primary`);
  }
  if (record.secondary !== undefined) {
    state.secondary = expectOneOf(record.secondary, SCREEN_DIRECTIONS, `${path}.secondary`);
  }

  const rollDegrees =
    record.rollDegrees === undefined
      ? 0
      : expectNumber(record.rollDegrees, `${path}.rollDegrees`);

  return { quaternion: null, rollDegrees, state };
}

async function blobToBase64(blob: Blob): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not encode the rendered image."));
    reader.readAsDataURL(blob);
  });

  const separator = dataUrl.indexOf(",");
  if (separator < 0) {
    throw new Error("Could not encode the rendered image.");
  }
  return dataUrl.slice(separator + 1);
}

function expectRecord(data: unknown, path: string): Record<string, unknown> {
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    throw new Error(`${path} must be an object.`);
  }
  return data as Record<string, unknown>;
}

function assertKnownKeys(
  data: Record<string, unknown>,
  path: string,
  knownKeys: string[],
) {
  const allowedKeys = new Set(knownKeys);
  for (const key of Object.keys(data)) {
    if (!allowedKeys.has(key)) {
      throw new Error(`${path}.${key} is not supported.`);
    }
  }
}

function expectString(data: unknown, path: string): string {
  if (typeof data !== "string" || data.trim() === "") {
    throw new Error(`${path} must be a non-empty string.`);
  }
  return data;
}

function expectNumber(data: unknown, path: string): number {
  if (typeof data !== "number" || !Number.isFinite(data)) {
    throw new Error(`${path} must be a finite number.`);
  }
  return data;
}

function expectBoolean(data: unknown, path: string): boolean {
  if (typeof data !== "boolean") {
    throw new Error(`${path} must be a boolean.`);
  }
  return data;
}

function expectOneOf<T extends string | number>(
  data: unknown,
  options: readonly T[],
  path: string,
): T {
  if (!options.includes(data as T)) {
    throw new Error(`${path} must be one of ${options.join(", ")}.`);
  }
  return data as T;
}

function expectQuaternionTuple(
  data: unknown,
  path: string,
): [number, number, number, number] {
  if (
    Array.isArray(data) &&
    data.length === 4 &&
    data.every((entry) => typeof entry === "number" && Number.isFinite(entry))
  ) {
    return [data[0], data[1], data[2], data[3]];
  }
  throw new Error(`${path} must be a four-number array.`);
}

function expectVectorTuple(data: unknown, path: string): [number, number, number] {
  if (
    Array.isArray(data) &&
    data.length === 3 &&
    data.every((entry) => typeof entry === "number" && Number.isFinite(entry))
  ) {
    return [data[0], data[1], data[2]];
  }
  throw new Error(`${path} must be a three-number array.`);
}
