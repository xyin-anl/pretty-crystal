export interface PxrdPeak {
  dSpacing: number;
  hkl: number[];
  intensity: number;
  multiplicity: number;
  twoTheta: number;
}

export interface PxrdPattern {
  peaks: PxrdPeak[];
  twoThetaMax: number;
  twoThetaMin: number;
  wavelength: number;
  wavelengthLabel: string;
}

export interface PxrdChartOptions {
  fwhm?: number;
  height?: number;
  labelCount?: number;
  lineColor?: string;
  mixing?: number;
  showHklLabels?: boolean;
  showTicks?: boolean;
  title?: string;
  width?: number;
}

export const DEFAULT_PXRD_FWHM = 0.25;
const DEFAULT_WIDTH = 920;
const DEFAULT_HEIGHT = 460;
const DEFAULT_LINE_COLOR = "#2f3640";
const AXIS_COLOR = "#4b5563";
const GRID_COLOR = "#e5e7eb";
const LABEL_COLOR = "#6b7280";
const PROFILE_SAMPLES = 1800;
const DEFAULT_LABEL_COUNT = 8;
const MIN_LABEL_SPACING_PX = 34;
const FONT_STACK =
  "'Geist', 'Helvetica Neue', Arial, sans-serif";

/**
 * Samples the pseudo-Voigt broadened powder pattern on a uniform 2θ grid.
 * Intensities are normalized so the strongest point equals 1.
 */
export function pxrdProfile(
  pattern: PxrdPattern,
  fwhm: number,
  mixing = 0.5,
  samples = PROFILE_SAMPLES,
): { intensities: Float64Array; twoThetas: Float64Array } {
  const twoThetas = new Float64Array(samples);
  const intensities = new Float64Array(samples);
  const range = pattern.twoThetaMax - pattern.twoThetaMin;
  const safeFwhm = Math.max(0.01, fwhm);
  const gammaLorentz = safeFwhm / 2;
  const sigmaGauss = safeFwhm / (2 * Math.sqrt(2 * Math.log(2)));
  const eta = Math.min(1, Math.max(0, mixing));
  // Peaks further than this many FWHMs away contribute negligibly.
  const cutoff = safeFwhm * 40;

  for (let index = 0; index < samples; index += 1) {
    twoThetas[index] = pattern.twoThetaMin + (range * index) / (samples - 1);
  }

  for (const peak of pattern.peaks) {
    for (let index = 0; index < samples; index += 1) {
      const delta = twoThetas[index]! - peak.twoTheta;
      if (Math.abs(delta) > cutoff) {
        continue;
      }

      const lorentz = 1 / (1 + (delta / gammaLorentz) ** 2);
      const gauss = Math.exp(-(delta * delta) / (2 * sigmaGauss * sigmaGauss));
      intensities[index]! += peak.intensity * (eta * lorentz + (1 - eta) * gauss);
    }
  }

  let maxIntensity = 0;
  for (let index = 0; index < samples; index += 1) {
    maxIntensity = Math.max(maxIntensity, intensities[index]!);
  }
  if (maxIntensity > 0) {
    for (let index = 0; index < samples; index += 1) {
      intensities[index]! /= maxIntensity;
    }
  }

  return { intensities, twoThetas };
}

/** Renders a publication-style PXRD chart as a standalone SVG document. */
export function pxrdChartSvg(
  pattern: PxrdPattern,
  options: PxrdChartOptions = {},
): string {
  const width = options.width ?? DEFAULT_WIDTH;
  const height = options.height ?? DEFAULT_HEIGHT;
  const fwhm = options.fwhm ?? DEFAULT_PXRD_FWHM;
  const lineColor = options.lineColor ?? DEFAULT_LINE_COLOR;
  const showHklLabels = options.showHklLabels ?? true;
  const showTicks = options.showTicks ?? true;
  const margin = { bottom: 52, left: 58, right: 18, top: options.title ? 40 : 20 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const range = pattern.twoThetaMax - pattern.twoThetaMin;

  const xFor = (twoTheta: number) =>
    margin.left + ((twoTheta - pattern.twoThetaMin) / range) * plotWidth;
  const yFor = (normalizedIntensity: number) =>
    margin.top + plotHeight * (1 - normalizedIntensity * 0.94);

  const { intensities, twoThetas } = pxrdProfile(pattern, fwhm, options.mixing);
  const pathPoints: string[] = [];
  for (let index = 0; index < twoThetas.length; index += 1) {
    const command = index === 0 ? "M" : "L";
    pathPoints.push(
      `${command}${xFor(twoThetas[index]!).toFixed(2)},${yFor(intensities[index]!).toFixed(2)}`,
    );
  }

  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" ` +
      `width="${width}" height="${height}" role="img" aria-label="Powder X-ray diffraction pattern">`,
  );

  if (options.title) {
    parts.push(
      `<text x="${margin.left}" y="22" font-family="${FONT_STACK}" font-size="15" ` +
        `font-weight="600" fill="${lineColor}">${escapeXml(options.title)}</text>`,
    );
  }

  if (showTicks) {
    const tickStep = niceTickStep(range);
    const firstTick = Math.ceil(pattern.twoThetaMin / tickStep) * tickStep;
    for (let tick = firstTick; tick <= pattern.twoThetaMax + 1e-9; tick += tickStep) {
      const x = xFor(tick);
      parts.push(
        `<line x1="${x.toFixed(2)}" y1="${margin.top}" x2="${x.toFixed(2)}" ` +
          `y2="${margin.top + plotHeight}" stroke="${GRID_COLOR}" stroke-width="1"/>`,
      );
      parts.push(
        `<line x1="${x.toFixed(2)}" y1="${margin.top + plotHeight}" x2="${x.toFixed(2)}" ` +
          `y2="${margin.top + plotHeight + 5}" stroke="${AXIS_COLOR}" stroke-width="1"/>`,
      );
      parts.push(
        `<text x="${x.toFixed(2)}" y="${margin.top + plotHeight + 20}" text-anchor="middle" ` +
          `font-family="${FONT_STACK}" font-size="12" fill="${AXIS_COLOR}">${formatTick(tick)}</text>`,
      );
    }
  }

  // Axes.
  parts.push(
    `<line x1="${margin.left}" y1="${margin.top + plotHeight}" ` +
      `x2="${margin.left + plotWidth}" y2="${margin.top + plotHeight}" ` +
      `stroke="${AXIS_COLOR}" stroke-width="1.25"/>`,
  );
  parts.push(
    `<line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" ` +
      `y2="${margin.top + plotHeight}" stroke="${AXIS_COLOR}" stroke-width="1.25"/>`,
  );

  // Profile curve.
  parts.push(
    `<path d="${pathPoints.join(" ")}" fill="none" stroke="${lineColor}" ` +
      `stroke-width="1.6" stroke-linejoin="round"/>`,
  );

  if (showHklLabels) {
    parts.push(...hklLabelElements(pattern, options, xFor, yFor, fwhm));
  }

  // Axis titles.
  parts.push(
    `<text x="${margin.left + plotWidth / 2}" y="${height - 12}" text-anchor="middle" ` +
      `font-family="${FONT_STACK}" font-size="14" fill="${AXIS_COLOR}">2θ (°) — ${escapeXml(pattern.wavelengthLabel)}</text>`,
  );
  parts.push(
    `<text x="16" y="${margin.top + plotHeight / 2}" text-anchor="middle" ` +
      `transform="rotate(-90 16 ${margin.top + plotHeight / 2})" ` +
      `font-family="${FONT_STACK}" font-size="14" fill="${AXIS_COLOR}">Intensity (a.u.)</text>`,
  );

  parts.push("</svg>");
  return parts.join("\n");
}

function hklLabelElements(
  pattern: PxrdPattern,
  options: PxrdChartOptions,
  xFor: (twoTheta: number) => number,
  yFor: (normalizedIntensity: number) => number,
  fwhm: number,
): string[] {
  const labelCount = options.labelCount ?? DEFAULT_LABEL_COUNT;
  const strongestPeaks = [...pattern.peaks]
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, labelCount);
  const maxIntensity = Math.max(...pattern.peaks.map((peak) => peak.intensity), 1);
  const placedXs: number[] = [];
  const elements: string[] = [];

  for (const peak of strongestPeaks.sort((a, b) => a.twoTheta - b.twoTheta)) {
    const x = xFor(peak.twoTheta);
    if (placedXs.some((placedX) => Math.abs(placedX - x) < MIN_LABEL_SPACING_PX)) {
      continue;
    }
    placedXs.push(x);

    // Broadening spreads intensity, so the drawn peak height is approximate;
    // anchoring at the stick intensity keeps labels above the curve.
    const y = yFor(Math.min(1, peak.intensity / maxIntensity)) - 8;
    elements.push(
      `<text x="${x.toFixed(2)}" y="${Math.max(12, y).toFixed(2)}" text-anchor="middle" ` +
        `font-family="${FONT_STACK}" font-size="11" fill="${LABEL_COLOR}">${hklLabel(peak.hkl)}</text>`,
    );
  }

  void fwhm;
  return elements;
}

/** Serializes the peak list as CSV with intensities normalized to 100. */
export function pxrdPeaksCsv(pattern: PxrdPattern): string {
  const maxIntensity = Math.max(
    ...pattern.peaks.map((peak) => peak.intensity),
    Number.EPSILON,
  );
  const lines = [
    `# wavelength_angstrom,${pattern.wavelength}`,
    "two_theta_deg,d_spacing_angstrom,intensity_rel,multiplicity,h,k,l",
    ...pattern.peaks.map((peak) => {
      const [h = 0, k = 0, l = 0] = peak.hkl;
      return [
        peak.twoTheta.toFixed(4),
        peak.dSpacing.toFixed(5),
        ((peak.intensity / maxIntensity) * 100).toFixed(3),
        String(peak.multiplicity),
        String(h),
        String(k),
        String(l),
      ].join(",");
    }),
  ];
  return `${lines.join("\n")}\n`;
}

export function hklLabel(hkl: number[]): string {
  const digits = hkl.map((index) => {
    const digit = Math.abs(index) > 9 ? ` ${Math.abs(index)} ` : String(Math.abs(index));
    return index < 0 ? `${digit}̅` : digit;
  });
  return `(${digits.join("")})`;
}

function niceTickStep(range: number): number {
  const target = range / 9;
  const candidates = [1, 2, 5, 10, 15, 20, 30];
  for (const candidate of candidates) {
    if (candidate >= target) {
      return candidate;
    }
  }
  return 30;
}

function formatTick(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
