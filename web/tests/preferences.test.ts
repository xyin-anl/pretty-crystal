import { beforeEach, describe, expect, test } from "bun:test";

import { createDefaultStyle } from "../src/model";
import {
  applyStylePreferences,
  clearUserPreferences,
  loadUserPreferences,
  saveUserPreferences,
  type UserPreferences,
} from "../src/model/preferences";

const STORAGE_KEY = "pretty-crystal:preferences:v1";

const VALID_PREFERENCES: UserPreferences = {
  bondColor: "#a1b2c3",
  bondColorMode: "unicolor",
  colorScheme: "jmol",
  distinguishSimilarColors: false,
  dragSensitivity: 1.5,
  interactionMode: "orbit",
  lightStrength: 1.4,
  materialPreset: "glossy",
  showCrystalAxisLabels: false,
  unitCellLineStyle: "dashed",
};

beforeEach(() => {
  window.localStorage.clear();
});

describe("user preferences", () => {
  test("round-trips a full preferences record", () => {
    saveUserPreferences(VALID_PREFERENCES);
    expect(loadUserPreferences()).toEqual(VALID_PREFERENCES);
  });

  test("returns empty preferences when nothing is stored", () => {
    expect(loadUserPreferences()).toEqual({});
  });

  test("drops invalid fields instead of failing", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        bondColor: "not-a-color",
        bondColorMode: "rainbow",
        colorScheme: "not-a-scheme",
        distinguishSimilarColors: "yes",
        dragSensitivity: Number.NaN,
        interactionMode: "flythrough",
        lightStrength: 1.2,
        materialPreset: "unknown-material",
        showCrystalAxisLabels: false,
        unitCellLineStyle: "dotted",
      }),
    );

    expect(loadUserPreferences()).toEqual({
      lightStrength: 1.2,
      showCrystalAxisLabels: false,
    });
  });

  test("clamps out-of-range numeric preferences", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ dragSensitivity: 100, lightStrength: 0.01 }),
    );

    const preferences = loadUserPreferences();
    expect(preferences.dragSensitivity).toBe(2);
    expect(preferences.lightStrength).toBe(0.5);
  });

  test("ignores corrupted JSON", () => {
    window.localStorage.setItem(STORAGE_KEY, "{not json");
    expect(loadUserPreferences()).toEqual({});
  });

  test("clearUserPreferences removes the record", () => {
    saveUserPreferences(VALID_PREFERENCES);
    clearUserPreferences();
    expect(loadUserPreferences()).toEqual({});
  });

  test("applyStylePreferences overrides only style-related fields", () => {
    const style = applyStylePreferences(createDefaultStyle(), {
      colorScheme: "jmol",
      materialPreset: "glossy",
    });

    expect(style.colorScheme).toBe("jmol");
    expect(style.materialPreset).toBe("glossy");
    expect(style.bondColorMode).toBe(createDefaultStyle().bondColorMode);
    expect(style.atomRadius).toBe(createDefaultStyle().atomRadius);
  });
});
