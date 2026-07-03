import type { Quaternion } from "three";

import {
  DEFAULT_COMPONENT_OPACITY,
  DEFAULT_COMPONENT_VISIBILITY,
  DEFAULT_EXPORT_SETTINGS,
  DEFAULT_STYLE,
  DEFAULT_UNIT_CELL_LINE_STYLE,
  type ComponentOpacityState,
  type ComponentVisibilityState,
  type ExportSettingsState,
  type StyleState,
  type UnitCellLineStyle,
} from "../model";

export interface RenderStyleExportInputs {
  cameraQuaternion: Quaternion;
  componentOpacity: ComponentOpacityState;
  componentVisibility: ComponentVisibilityState;
  exportSettings: ExportSettingsState;
  lightStrength: number;
  showCrystalAxisLabels: boolean;
  style: StyleState;
  unitCellLineStyle: UnitCellLineStyle;
}

/**
 * Serializes the current GUI state into the `prc render` style-file schema
 * (the shape accepted by the headless bridge's `payload.settings`).
 *
 * Only values that differ from the defaults are written, so the file stays
 * small and readable; the camera orientation is always included because the
 * default (standard pose) depends on the structure.
 */
export function buildRenderStyleSettings(
  inputs: RenderStyleExportInputs,
): Record<string, unknown> {
  const settings: Record<string, unknown> = {};

  const style = buildStyleSection(inputs.style);
  if (Object.keys(style).length > 0) {
    settings.style = style;
  }

  settings.orientation = {
    quaternion: [
      inputs.cameraQuaternion.x,
      inputs.cameraQuaternion.y,
      inputs.cameraQuaternion.z,
      inputs.cameraQuaternion.w,
    ],
  };

  const componentVisibility = diffRecord(
    inputs.componentVisibility,
    DEFAULT_COMPONENT_VISIBILITY,
  );
  if (Object.keys(componentVisibility).length > 0) {
    settings.componentVisibility = componentVisibility;
  }

  const componentOpacity = diffRecord(
    inputs.componentOpacity,
    DEFAULT_COMPONENT_OPACITY,
  );
  if (Object.keys(componentOpacity).length > 0) {
    settings.componentOpacity = componentOpacity;
  }

  const exportSettings = buildExportSection(inputs.exportSettings);
  if (Object.keys(exportSettings).length > 0) {
    settings.export = exportSettings;
  }

  if (inputs.lightStrength !== 1) {
    settings.lightStrength = inputs.lightStrength;
  }
  if (inputs.unitCellLineStyle !== DEFAULT_UNIT_CELL_LINE_STYLE) {
    settings.unitCellLineStyle = inputs.unitCellLineStyle;
  }
  if (!inputs.showCrystalAxisLabels) {
    settings.showCrystalAxisLabels = false;
  }

  return settings;
}

export function renderStyleSettingsJson(inputs: RenderStyleExportInputs): string {
  return `${JSON.stringify(buildRenderStyleSettings(inputs), null, 2)}\n`;
}

function buildStyleSection(style: StyleState): Record<string, unknown> {
  const section: Record<string, unknown> = {};
  const simpleKeys = [
    "asuGhostOpacity",
    "asuHighlight",
    "atomRadius",
    "atomRadiusModel",
    "bondColor",
    "bondColorMode",
    "bondThickness",
    "distinguishSimilarColors",
    "fogAffectsUnitCell",
    "fogAmount",
    "fogEnabled",
    "fogStart",
    "materialPreset",
    "vectorGlyphScale",
  ] as const;

  for (const key of simpleKeys) {
    if (style[key] !== DEFAULT_STYLE[key]) {
      section[key] = style[key];
    }
  }

  if (style.vectorGlyphProperty !== null) {
    section.vectorGlyphProperty = style.vectorGlyphProperty;
  }
  if (style.latticePlane !== null) {
    section.latticePlane = { ...style.latticePlane };
  }

  if (style.colorSchemeMode === "custom" && style.customColormap) {
    section.colorScheme = style.customColormap.baseColorScheme;
    section.elementColors = { ...style.customColormap.elements };
  } else if (style.colorScheme !== DEFAULT_STYLE.colorScheme) {
    section.colorScheme = style.colorScheme;
  }

  return section;
}

function buildExportSection(settings: ExportSettingsState): Record<string, unknown> {
  const section: Record<string, unknown> = {};
  const simpleKeys = [
    "background",
    "combineComponents",
    "format",
    "height",
    "legendLayout",
    "meshQuality",
    "supersampling",
    "width",
  ] as const;

  for (const key of simpleKeys) {
    if (settings[key] !== DEFAULT_EXPORT_SETTINGS[key]) {
      section[key] = settings[key];
    }
  }

  const components = diffRecord(
    settings.components,
    DEFAULT_EXPORT_SETTINGS.components,
  );
  if (Object.keys(components).length > 0) {
    section.components = components;
  }

  return section;
}

function diffRecord<T extends object>(value: T, defaults: T): Partial<T> {
  const diff: Partial<T> = {};
  for (const key of Object.keys(value) as Array<keyof T>) {
    if (value[key] !== defaults[key]) {
      diff[key] = value[key];
    }
  }
  return diff;
}
