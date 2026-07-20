import { describe, expect, test } from "bun:test";

import {
  elementRadiusForModel,
  elementRadiusSymbols,
  hasElementRadius,
} from "../src/app/elementRadii";

describe("element radii", () => {
  test("resolves VESTA-compatible display radii in the frontend", () => {
    expect(elementRadiusForModel("O", "uniform")).toBeCloseTo(1);
    expect(elementRadiusForModel("O", "atomic")).toBeCloseTo(0.74);
    expect(elementRadiusForModel("O", "vdw")).toBeCloseTo(1.52);
    expect(elementRadiusForModel("O", "ionic")).toBeCloseTo(1.4);
    expect(elementRadiusForModel("Sr", "atomic")).toBeCloseTo(2.15);
  });

  test("reports coverage through frontend element symbols", () => {
    expect(hasElementRadius("O")).toBe(true);
    expect(hasElementRadius("Missing")).toBe(false);
    expect(elementRadiusSymbols()).toContain("XX");
  });

  test("falls back to the dummy XX radii for unknown elements", () => {
    // Superheavies such as Cm are absent from the radius table; loading such
    // a structure must not crash the scene.
    expect(elementRadiusForModel("Cm", "uniform")).toBeCloseTo(
      elementRadiusForModel("XX", "uniform"),
    );
    expect(elementRadiusForModel("Cm", "atomic")).toBeCloseTo(
      elementRadiusForModel("XX", "atomic"),
    );
  });
});
