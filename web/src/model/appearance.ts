import type { AtomRadiusModel, AtomSpec } from "../api/scene";
import {
  autoDistinctElementColorOverrides,
  DEFAULT_COLOR_SCHEME_ID,
  elementColorsForScheme,
  type ElementColorOverrides,
  type ColorScheme,
} from "./colorSchemes";
import {
  DEFAULT_MATERIAL_PRESET_ID,
  type MaterialPresetId,
} from "./materialPresets";

export const DEFAULT_BOND_COLOR = "#d2d2d2";

export type BondColorMode = "unicolor" | "bicolor";
export type ColorSchemeMode = "preset" | "custom";

export interface CustomColormap {
  baseColorScheme: ColorScheme;
  elements: Record<string, string>;
}

export interface StyleState {
  asuGhostOpacity: number;
  asuHighlight: boolean;
  latticePlane: LatticePlaneState | null;
  vectorGlyphProperty: string | null;
  vectorGlyphScale: number;
  atomRadius: number;
  atomRadiusModel: AtomRadiusModel;
  bondColor: string;
  bondColorMode: BondColorMode;
  bondThickness: number;
  colorScheme: ColorScheme;
  colorSchemeMode: ColorSchemeMode;
  customColormap: CustomColormap | null;
  distinguishSimilarColors: boolean;
  fogAffectsUnitCell: boolean;
  fogAmount: number;
  fogEnabled: boolean;
  fogStart: number;
  materialPreset: MaterialPresetId;
}

// Default opacity (percent) for atoms/bonds/polyhedra outside the asymmetric
// unit while the ASU highlight mode is active. Ghost atoms keep their element
// colors; only their transparency changes.
export const DEFAULT_ASU_GHOST_OPACITY = 15;
export const ASU_GHOST_OPACITY_MIN = 0;
export const ASU_GHOST_OPACITY_MAX = 100;

export const VECTOR_GLYPH_COLOR = "#d1495b";
export const VECTOR_GLYPH_SCALE_MIN = 10;
export const VECTOR_GLYPH_SCALE_MAX = 300;

export const LATTICE_PLANE_COLOR = "#4a7dbd";
export const LATTICE_PLANE_OPACITY_PERCENT = 32;

export interface LatticePlaneState {
  // Optional overrides; the defaults above apply when absent.
  color?: string;
  h: number;
  k: number;
  l: number;
  offsetPercent: number;
  opacityPercent?: number;
}

export const DEFAULT_STYLE: StyleState = {
  asuGhostOpacity: DEFAULT_ASU_GHOST_OPACITY,
  asuHighlight: false,
  latticePlane: null,
  vectorGlyphProperty: null,
  vectorGlyphScale: 100,
  atomRadius: 40,
  atomRadiusModel: "uniform",
  bondColor: DEFAULT_BOND_COLOR,
  bondColorMode: "bicolor",
  bondThickness: 100,
  colorScheme: DEFAULT_COLOR_SCHEME_ID,
  colorSchemeMode: "preset",
  customColormap: null,
  distinguishSimilarColors: true,
  fogAffectsUnitCell: false,
  fogAmount: 40,
  fogEnabled: true,
  fogStart: 40,
  materialPreset: DEFAULT_MATERIAL_PRESET_ID,
};

export const STYLE_SCALE_MIN: Pick<StyleState, "atomRadius" | "bondThickness"> = {
  atomRadius: 0,
  bondThickness: 0,
};

export const STYLE_SCALE_MAX: Pick<StyleState, "atomRadius" | "bondThickness"> = {
  atomRadius: 100,
  bondThickness: 200,
};

export const STYLE_FOG_AMOUNT_MIN = 0;
export const STYLE_FOG_AMOUNT_MAX = 100;
export const STYLE_FOG_START_MIN = 0;
export const STYLE_FOG_START_MAX = 100;

export function createDefaultStyle(): StyleState {
  return { ...DEFAULT_STYLE };
}

export function createCustomColormapFromScheme(
  colorScheme: ColorScheme,
): CustomColormap {
  return {
    baseColorScheme: colorScheme,
    elements: elementColorsForScheme(colorScheme),
  };
}

export function hasCustomColormapChanges(customColormap: CustomColormap): boolean {
  const baseElements = elementColorsForScheme(customColormap.baseColorScheme);
  const customElements = customColormap.elements;
  const elementSymbols = new Set([
    ...Object.keys(baseElements),
    ...Object.keys(customElements),
  ]);

  for (const element of elementSymbols) {
    if (customElements[element] !== baseElements[element]) {
      return true;
    }
  }

  return false;
}

export function baseColorSchemeForStyle(style: StyleState): ColorScheme {
  if (style.colorSchemeMode === "custom" && style.customColormap) {
    return style.customColormap.baseColorScheme;
  }
  return style.colorScheme;
}

export function elementColorOverridesForStyle(
  atoms: readonly AtomSpec[],
  style: StyleState,
): ElementColorOverrides | undefined {
  if (style.colorSchemeMode === "custom") {
    return style.customColormap?.elements;
  }

  return autoDistinctElementColorOverrides(
    atoms,
    style.colorScheme,
    style.distinguishSimilarColors,
  );
}
