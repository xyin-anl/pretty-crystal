import { Download } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { fetchPxrdPattern, PxrdRequestError } from "../../api/pxrd";
import { downloadBlob } from "../../export/zipExport";
import {
  DEFAULT_PXRD_FWHM,
  pxrdChartSvg,
  pxrdPeaksCsv,
  type PxrdPattern,
} from "../../pxrd/pxrdChart";
import { TOOL_ICON_BUTTON_CLASS } from "../surface";

const WAVELENGTH_OPTIONS = [
  { label: "Cu Kα", value: "CuKa" },
  { label: "Cu Kα1", value: "CuKa1" },
  { label: "Mo Kα", value: "MoKa" },
  { label: "Co Kα", value: "CoKa" },
  { label: "Cr Kα", value: "CrKa" },
  { label: "Fe Kα", value: "FeKa" },
  { label: "Ag Kα", value: "AgKa" },
];
const PANEL_CHART_WIDTH = 800;
const PANEL_CHART_HEIGHT = 320;
const EXPORT_CHART_WIDTH = 1600;
const EXPORT_CHART_HEIGHT = 800;
const PNG_EXPORT_SCALE = 2;
const FWHM_MIN = 0.05;
const FWHM_MAX = 1.5;

export function PxrdPanel({
  file,
  fileName,
}: {
  file: File | null;
  fileName: string | null;
}) {
  const [pattern, setPattern] = useState<PxrdPattern | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [wavelength, setWavelength] = useState("CuKa");
  const [fwhm, setFwhm] = useState(DEFAULT_PXRD_FWHM);
  const [showHklLabels, setShowHklLabels] = useState(true);
  const [twoThetaRange, setTwoThetaRange] = useState<[number, number]>([5, 90]);

  useEffect(() => {
    if (!file) {
      setPattern(null);
      setError(
        "PXRD needs the Python backend. Start Pretty Crystal locally and load a structure file.",
      );
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    fetchPxrdPattern(file, {
      twoThetaMax: twoThetaRange[1],
      twoThetaMin: twoThetaRange[0],
      wavelength,
    })
      .then((nextPattern) => {
        if (!cancelled) {
          setPattern(nextPattern);
        }
      })
      .catch((requestError) => {
        if (!cancelled) {
          setPattern(null);
          setError(
            requestError instanceof PxrdRequestError
              ? requestError.message
              : "The PXRD pattern could not be computed.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [file, twoThetaRange, wavelength]);

  const chartSvg = useMemo(
    () =>
      pattern
        ? pxrdChartSvg(pattern, {
            fwhm,
            height: PANEL_CHART_HEIGHT,
            showHklLabels,
            width: PANEL_CHART_WIDTH,
          })
        : null,
    [fwhm, pattern, showHklLabels],
  );

  function exportSvgString(): string | null {
    if (!pattern) {
      return null;
    }
    return pxrdChartSvg(pattern, {
      fwhm,
      height: EXPORT_CHART_HEIGHT,
      showHklLabels,
      title: fileName ?? undefined,
      width: EXPORT_CHART_WIDTH,
    });
  }

  function handleDownloadSvg() {
    const svg = exportSvgString();
    if (!svg) {
      return;
    }
    downloadBlob(new Blob([svg], { type: "image/svg+xml" }), pxrdFileName("svg"));
  }

  async function handleDownloadPng() {
    const svg = exportSvgString();
    if (!svg) {
      return;
    }

    const blob = await svgToPngBlob(svg, EXPORT_CHART_WIDTH, EXPORT_CHART_HEIGHT);
    downloadBlob(blob, pxrdFileName("png"));
  }

  function handleDownloadCsv() {
    if (!pattern) {
      return;
    }
    downloadBlob(
      new Blob([pxrdPeaksCsv(pattern)], { type: "text/csv" }),
      pxrdFileName("csv"),
    );
  }

  function pxrdFileName(extension: string): string {
    const stem = fileName ? fileName.replace(/\.[^.]+$/, "") : "structure";
    return `${stem}-pxrd.${extension}`;
  }

  return (
    <TooltipProvider>
      <section
        aria-label="Powder X-ray diffraction pattern"
        className="flex h-full w-[700px] max-w-full flex-col overflow-hidden rounded-xl border border-foreground/10 bg-card px-4 pb-3 pt-2.5 shadow-xl shadow-foreground/10"

      >
      <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
        <Tabs value="pxrd" className="mr-1">
          <TabsList
            aria-label="Diffraction visuals"
            className="!h-auto gap-3 rounded-none border-0 bg-transparent p-0 shadow-none"
          >
            <TabsTrigger
              value="pxrd"
              className="!h-auto rounded-none border-0 !bg-transparent p-0 text-xs font-semibold !shadow-none data-[state=active]:text-foreground data-[state=inactive]:text-muted-foreground"
            >
              Powder XRD
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={wavelength} onValueChange={setWavelength}>
          <SelectTrigger
            aria-label="X-ray wavelength"
            className="!h-6 w-[104px] rounded-md px-2 text-xs"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {WAVELENGTH_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-xs">
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <label className="flex items-center gap-1.5 text-2xs text-muted-foreground">
          FWHM
          <input
            aria-label="Peak broadening FWHM in degrees"
            type="range"
            min={FWHM_MIN}
            max={FWHM_MAX}
            step={0.05}
            value={fwhm}
            className="h-1 w-24 accent-foreground"
            onChange={(event) => setFwhm(Number(event.target.value))}
          />
          <span className="w-9 font-mono tabular-nums">{fwhm.toFixed(2)}°</span>
        </label>
        <TwoThetaRangeInputs range={twoThetaRange} onCommit={setTwoThetaRange} />
        <label className="flex items-center gap-1 text-2xs text-muted-foreground">
          <input
            aria-label="Show hkl labels"
            checked={showHklLabels}
            className="accent-foreground"
            onChange={(event) => setShowHklLabels(event.target.checked)}
            type="checkbox"
          />
          hkl
        </label>
        <div className="ml-auto flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Download PXRD as SVG"
                className={TOOL_ICON_BUTTON_CLASS}
                disabled={!pattern}
                onClick={handleDownloadSvg}
              >
                <Download aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Download SVG (vector)</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Download PXRD as PNG"
                className={cn(TOOL_ICON_BUTTON_CLASS, "text-3xs font-semibold")}
                disabled={!pattern}
                onClick={() => {
                  void handleDownloadPng();
                }}
              >
                PNG
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Download PNG</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Download PXRD peaks as CSV"
                className={cn(TOOL_ICON_BUTTON_CLASS, "text-3xs font-semibold")}
                disabled={!pattern}
                onClick={handleDownloadCsv}
              >
                CSV
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              Download peak list (2θ, d-spacing, intensity, hkl) as CSV
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      <div className="flex min-h-[120px] min-w-0 flex-1 items-center justify-center">
        {chartSvg ? (
          <div
            data-testid="pxrd-chart"
            className="h-full w-full [&_svg]:h-full [&_svg]:w-full"
            // The SVG is generated locally by pxrdChartSvg from numeric data.
            dangerouslySetInnerHTML={{ __html: chartSvg }}
          />
        ) : (
          <p className="max-w-[420px] py-8 text-center text-xs text-muted-foreground">
            {isLoading ? "Computing the diffraction pattern ..." : error}
          </p>
        )}
      </div>
      </section>
    </TooltipProvider>
  );
}

function TwoThetaRangeInputs({
  onCommit,
  range,
}: {
  onCommit: (range: [number, number]) => void;
  range: [number, number];
}) {
  const [minText, setMinText] = useState(String(range[0]));
  const [maxText, setMaxText] = useState(String(range[1]));

  useEffect(() => {
    setMinText(String(range[0]));
    setMaxText(String(range[1]));
  }, [range]);

  function commit() {
    const min = Number.parseFloat(minText);
    const max = Number.parseFloat(maxText);
    if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max > 180 || min >= max) {
      setMinText(String(range[0]));
      setMaxText(String(range[1]));
      return;
    }
    if (min !== range[0] || max !== range[1]) {
      onCommit([min, max]);
    }
  }

  const inputClass =
    "h-6 w-11 rounded-md border border-input bg-transparent px-1 text-center text-2xs tabular-nums";

  return (
    <label className="flex items-center gap-1 text-2xs text-muted-foreground">
      2θ
      <input
        aria-label="Two theta minimum"
        className={inputClass}
        inputMode="numeric"
        onBlur={commit}
        onChange={(event) => setMinText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            commit();
            event.currentTarget.blur();
          }
        }}
        value={minText}
      />
      –
      <input
        aria-label="Two theta maximum"
        className={inputClass}
        inputMode="numeric"
        onBlur={commit}
        onChange={(event) => setMaxText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            commit();
            event.currentTarget.blur();
          }
        }}
        value={maxText}
      />
    </label>
  );
}

async function svgToPngBlob(svg: string, width: number, height: number): Promise<Blob> {
  const svgUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Could not rasterize the PXRD chart."));
      element.src = svgUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = width * PNG_EXPORT_SCALE;
    canvas.height = height * PNG_EXPORT_SCALE;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not rasterize the PXRD chart.");
    }
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Could not encode the PXRD chart PNG."));
        }
      }, "image/png");
    });
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}
