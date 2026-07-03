import { describe, expect, test } from "bun:test";

import {
  hklLabel,
  pxrdChartSvg,
  pxrdPeaksCsv,
  pxrdProfile,
  type PxrdPattern,
} from "../src/pxrd/pxrdChart";

describe("pxrd chart", () => {
  test("profile peaks at the reflection positions", () => {
    const pattern = testPattern();
    const { intensities, twoThetas } = pxrdProfile(pattern, 0.2);

    let maxIndex = 0;
    for (let index = 0; index < intensities.length; index += 1) {
      if (intensities[index]! > intensities[maxIndex]!) {
        maxIndex = index;
      }
    }

    expect(twoThetas[maxIndex]!).toBeCloseTo(32.0, 1);
    expect(Math.max(...intensities)).toBeCloseTo(1, 6);
  });

  test("renders a standalone svg with axes, curve, and labels", () => {
    const svg = pxrdChartSvg(testPattern(), { title: "NaCl.cif" });

    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg.endsWith("</svg>")).toBe(true);
    expect(svg).toContain("NaCl.cif");
    expect(svg).toContain("2θ (°) — CuKa");
    expect(svg).toContain("Intensity (a.u.)");
    expect(svg).toContain("(200)");
    expect(svg).toContain("<path d=\"M");
  });

  test("hides hkl labels when disabled", () => {
    const svg = pxrdChartSvg(testPattern(), { showHklLabels: false });
    expect(svg).not.toContain("(200)");
  });

  test("formats hkl labels with overlines for negative indices", () => {
    expect(hklLabel([2, 0, 0])).toBe("(200)");
    expect(hklLabel([1, -1, 0])).toBe("(11̅0)");
    expect(hklLabel([10, 0, 0])).toBe("( 10 00)");
  });

  test("escapes markup in titles", () => {
    const svg = pxrdChartSvg(testPattern(), { title: "<Fe> & O" });
    expect(svg).toContain("&lt;Fe&gt; &amp; O");
    expect(svg).not.toContain("<Fe>");
  });
});

describe("pxrd peaks csv", () => {
  test("serializes peaks with normalized intensities and hkl columns", () => {
    const csv = pxrdPeaksCsv(testPattern());
    const lines = csv.trim().split("\n");

    expect(lines[0]).toBe("# wavelength_angstrom,1.54184");
    expect(lines[1]).toBe("two_theta_deg,d_spacing_angstrom,intensity_rel,multiplicity,h,k,l");
    expect(lines[2]).toBe("27.6500,3.22000,8.000,8,1,1,1");
    expect(lines[3]).toBe("32.0000,2.79000,100.000,6,2,0,0");
    expect(lines[4]).toBe("45.9000,1.97000,65.000,12,2,2,0");
    expect(lines).toHaveLength(5);
  });
});

function testPattern(): PxrdPattern {
  return {
    peaks: [
      { dSpacing: 3.22, hkl: [1, 1, 1], intensity: 8, multiplicity: 8, twoTheta: 27.65 },
      { dSpacing: 2.79, hkl: [2, 0, 0], intensity: 100, multiplicity: 6, twoTheta: 32.0 },
      { dSpacing: 1.97, hkl: [2, 2, 0], intensity: 65, multiplicity: 12, twoTheta: 45.9 },
    ],
    twoThetaMax: 90,
    twoThetaMin: 5,
    wavelength: 1.54184,
    wavelengthLabel: "CuKa",
  };
}
