import { describe, expect, test } from "bun:test";

import { parseHeadlessRenderPayload } from "../src/headless/headlessRender";

describe("headless render payload", () => {
  test("applies defaults when settings are omitted", () => {
    const inputs = parseHeadlessRenderPayload({ scene: validScene() });

    expect(inputs.fileName).toBeNull();
    expect(inputs.style.materialPreset).toBe("modern-matte");
    expect(inputs.componentVisibility.atoms).toBe(true);
    expect(inputs.componentVisibility.polyhedra).toBe(false);
    expect(inputs.componentOpacity.polyhedra).toBe(75);
    expect(inputs.exportSettings.width).toBe(2000);
    expect(inputs.exportSettings.format).toBe("png");
    expect(inputs.exportSettings.background).toBe("transparent");
    expect(inputs.lightStrength).toBe(1);
    expect(inputs.orientation).toBeNull();
    expect(inputs.unitCellLineStyle).toBe("solid");
  });

  test("parses style, export, and orientation settings", () => {
    const inputs = parseHeadlessRenderPayload({
      fileName: "NaCl.cif",
      scene: validScene(),
      settings: {
        export: {
          background: "white",
          format: "jpg",
          height: 700,
          meshQuality: "xhigh",
          supersampling: 4,
          width: 900,
        },
        orientation: {
          direct: [0, 1, 0],
          rollDegrees: 15,
        },
        style: {
          atomRadius: 55,
          elementColors: { Na: "#123456" },
          materialPreset: "tachyon",
        },
      },
    });

    expect(inputs.fileName).toBe("NaCl.cif");
    expect(inputs.style.materialPreset).toBe("tachyon");
    expect(inputs.style.atomRadius).toBe(55);
    expect(inputs.style.colorSchemeMode).toBe("custom");
    expect(inputs.style.customColormap?.elements.Na).toBe("#123456");
    expect(inputs.exportSettings.width).toBe(900);
    expect(inputs.exportSettings.height).toBe(700);
    expect(inputs.exportSettings.format).toBe("jpg");
    expect(inputs.exportSettings.supersampling).toBe(4);
    expect(inputs.orientation?.direct).toEqual([0, 1, 0]);
    expect(inputs.rollDegrees).toBe(15);
  });

  test("rejects unknown settings keys with a precise path", () => {
    expect(() =>
      parseHeadlessRenderPayload({
        scene: validScene(),
        settings: { style: { shininess: 1 } },
      }),
    ).toThrow("payload.settings.style.shininess is not supported.");
  });

  test("rejects unknown material presets", () => {
    expect(() =>
      parseHeadlessRenderPayload({
        scene: validScene(),
        settings: { style: { materialPreset: "unobtainium" } },
      }),
    ).toThrow('Unknown material preset ID "unobtainium".');
  });

  test("rejects invalid enum values", () => {
    expect(() =>
      parseHeadlessRenderPayload({
        scene: validScene(),
        settings: { export: { background: "plaid" } },
      }),
    ).toThrow("payload.settings.export.background must be one of");
  });

  test("rejects payloads without a scene", () => {
    expect(() => parseHeadlessRenderPayload({ scene: { cell: {} } })).toThrow(
      "payload.scene must be a Pretty Crystal scene JSON object.",
    );
  });
});

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
