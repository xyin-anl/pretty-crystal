import { COLOR_SCHEME_OPTIONS } from "./colorSchemes";
import { MATERIAL_PRESET_OPTIONS, type MaterialPresetId } from "./materialPresets";
import type { UnitCellLineStyle } from "./rendering";
import {
  clampDragSensitivity,
  clampLightStrength,
  type InteractionMode,
} from "./viewState";
import type { BondColorMode, StyleState } from "./appearance";

/**
 * Cross-session user preferences. These are "how I like the tool to behave"
 * settings, not per-structure figure state; anything scene-specific (opacity,
 * plane, supercell, camera pose, ...) intentionally stays out.
 */
export interface UserPreferences {
  bondColor: string;
  bondColorMode: BondColorMode;
  colorScheme: string;
  distinguishSimilarColors: boolean;
  dragSensitivity: number;
  interactionMode: InteractionMode;
  lightStrength: number;
  materialPreset: MaterialPresetId;
  showCrystalAxisLabels: boolean;
  unitCellLineStyle: UnitCellLineStyle;
}

const STORAGE_KEY = "pretty-crystal:preferences:v1";
const BOND_COLOR_PATTERN = /^#[\da-f]{6}$/i;

function storageArea(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Reads stored preferences, dropping any field that fails validation. */
export function loadUserPreferences(): Partial<UserPreferences> {
  const storage = storageArea();
  if (!storage) {
    return {};
  }

  let record: unknown;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    record = JSON.parse(raw);
  } catch {
    return {};
  }

  if (typeof record !== "object" || record === null) {
    return {};
  }

  const candidate = record as Record<string, unknown>;
  const preferences: Partial<UserPreferences> = {};

  if (
    typeof candidate.materialPreset === "string" &&
    MATERIAL_PRESET_OPTIONS.some((option) => option.value === candidate.materialPreset)
  ) {
    preferences.materialPreset = candidate.materialPreset as MaterialPresetId;
  }
  if (
    typeof candidate.colorScheme === "string" &&
    COLOR_SCHEME_OPTIONS.some((option) => option.value === candidate.colorScheme)
  ) {
    preferences.colorScheme = candidate.colorScheme;
  }
  if (candidate.bondColorMode === "unicolor" || candidate.bondColorMode === "bicolor") {
    preferences.bondColorMode = candidate.bondColorMode;
  }
  if (typeof candidate.bondColor === "string" && BOND_COLOR_PATTERN.test(candidate.bondColor)) {
    preferences.bondColor = candidate.bondColor.toLowerCase();
  }
  if (typeof candidate.distinguishSimilarColors === "boolean") {
    preferences.distinguishSimilarColors = candidate.distinguishSimilarColors;
  }
  if (candidate.unitCellLineStyle === "solid" || candidate.unitCellLineStyle === "dashed") {
    preferences.unitCellLineStyle = candidate.unitCellLineStyle;
  }
  if (typeof candidate.showCrystalAxisLabels === "boolean") {
    preferences.showCrystalAxisLabels = candidate.showCrystalAxisLabels;
  }
  if (candidate.interactionMode === "trackball" || candidate.interactionMode === "orbit") {
    preferences.interactionMode = candidate.interactionMode;
  }
  if (typeof candidate.dragSensitivity === "number" && Number.isFinite(candidate.dragSensitivity)) {
    preferences.dragSensitivity = clampDragSensitivity(candidate.dragSensitivity);
  }
  if (typeof candidate.lightStrength === "number" && Number.isFinite(candidate.lightStrength)) {
    preferences.lightStrength = clampLightStrength(candidate.lightStrength);
  }

  return preferences;
}

export function saveUserPreferences(preferences: UserPreferences): void {
  const storage = storageArea();
  if (!storage) {
    return;
  }

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Quota errors and private-mode restrictions are non-fatal.
  }
}

/** Applies the persisted style-related preferences on top of a style state. */
export function applyStylePreferences(
  style: StyleState,
  preferences: Partial<UserPreferences>,
): StyleState {
  return {
    ...style,
    bondColor: preferences.bondColor ?? style.bondColor,
    bondColorMode: preferences.bondColorMode ?? style.bondColorMode,
    colorScheme: preferences.colorScheme ?? style.colorScheme,
    distinguishSimilarColors:
      preferences.distinguishSimilarColors ?? style.distinguishSimilarColors,
    materialPreset: preferences.materialPreset ?? style.materialPreset,
  };
}

export function clearUserPreferences(): void {
  const storage = storageArea();
  if (!storage) {
    return;
  }

  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore.
  }
}
