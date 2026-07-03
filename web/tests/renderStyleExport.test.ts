import { describe, expect, test } from "bun:test";
import { Quaternion } from "three";

import { parseHeadlessRenderPayload } from "../src/headless/headlessRender";
import { buildRenderStyleSettings } from "../src/export/renderStyleExport";
import {
  createDefaultComponentOpacity,
  createDefaultComponentVisibility,
  createDefaultExportSettings,
  createDefaultStyle,
  type UnitCellLineStyle,
} from "../src/model";

describe("render style export", () => {
  test("writes only non-default values plus the camera orientation", () => {
    const settings = buildRenderStyleSettings(defaultInputs());

    expect(Object.keys(settings)).toEqual(["orientation"]);
    expect(settings.orientation).toEqual({ quaternion: [0, 0, 0, 1] });
  });

  test("round-trips through the headless payload parser", () => {
    const inputs = defaultInputs();
    inputs.style = {
      ...inputs.style,
      atomRadius: 62,
      colorScheme: "jmol",
      materialPreset: "tachyon",
    };
    inputs.componentVisibility = {
      ...inputs.componentVisibility,
      polyhedra: true,
    };
    inputs.exportSettings = {
      ...inputs.exportSettings,
      background: "white",
      width: 1200,
    };
    inputs.lightStrength = 1.4;
    inputs.unitCellLineStyle = "dashed";
    inputs.cameraQuaternion = new Quaternion(0.1, 0.2, 0.3, 0.9).normalize();

    const settings = buildRenderStyleSettings(inputs);
    const parsed = parseHeadlessRenderPayload({ scene: validScene(), settings });

    expect(parsed.style.atomRadius).toBe(62);
    expect(parsed.style.colorScheme).toBe("jmol");
    expect(parsed.style.materialPreset).toBe("tachyon");
    expect(parsed.componentVisibility.polyhedra).toBe(true);
    expect(parsed.exportSettings.background).toBe("white");
    expect(parsed.exportSettings.width).toBe(1200);
    expect(parsed.lightStrength).toBe(1.4);
    expect(parsed.unitCellLineStyle).toBe("dashed");
    expect(parsed.cameraQuaternion).not.toBeNull();
    expect(parsed.cameraQuaternion?.[3]).toBeCloseTo(0.9 / Math.sqrt(0.95), 5);
  });

  test("exports custom element colors through the custom colormap", () => {
    const inputs = defaultInputs();
    inputs.style = {
      ...inputs.style,
      colorSchemeMode: "custom",
      customColormap: {
        baseColorScheme: "vesta",
        elements: { Fe: "#112233", O: "#445566" },
      },
    };

    const settings = buildRenderStyleSettings(inputs);
    const parsed = parseHeadlessRenderPayload({ scene: validScene(), settings });

    expect(parsed.style.colorSchemeMode).toBe("custom");
    expect(parsed.style.customColormap?.elements.Fe).toBe("#112233");
    expect(parsed.style.customColormap?.elements.O).toBe("#445566");
  });
});

function defaultInputs() {
  return {
    cameraQuaternion: new Quaternion(),
    componentOpacity: createDefaultComponentOpacity(),
    componentVisibility: createDefaultComponentVisibility(),
    exportSettings: createDefaultExportSettings(),
    lightStrength: 1,
    showCrystalAxisLabels: true,
    style: createDefaultStyle(),
    unitCellLineStyle: "solid" as UnitCellLineStyle,
  };
}

function validScene() {
  return {
    atoms: [],
    bonds: [],
    cell: {
      vectors: [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ],
    },
    polyhedra: [],
    summary: {
      atomCount: 0,
      cell: { a: "1", b: "1", c: "1", alpha: "90", beta: "90", gamma: "90" },
      formula: "X",
      symmetry: {
        available: false,
        crystalSystem: null,
        latticeSystem: null,
        pointGroup: null,
        pointGroupSchoenflies: null,
        spaceGroup: null,
        spaceGroupNumber: null,
      },
    },
  };
}
