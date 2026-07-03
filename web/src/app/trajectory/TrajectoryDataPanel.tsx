import { useMemo, useState, type PointerEvent } from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { SceneSpec } from "../../api/scene";
import {
  TRAJECTORY_PROPERTY_OPTIONS,
  trajectoryPropertySeries,
  type TrajectoryProperty,
} from "./trajectoryData";

// Matches the collapsed structure info card so the top row reads as one line.
export const TRAJECTORY_DATA_PANEL_HEIGHT = 141;

const CHART_WIDTH = 800;
const CHART_HEIGHT = 112;
const CHART_MARGIN = { bottom: 16, left: 62, right: 12, top: 6 };

/** Per-frame lattice data chart synced with the trajectory timeline. */
export function TrajectoryDataPanel({
  activeFrameIndex,
  frames,
  onFrameChange,
}: {
  activeFrameIndex: number;
  frames: readonly SceneSpec[];
  onFrameChange: (frameIndex: number) => void;
}) {
  const [property, setProperty] = useState<TrajectoryProperty>("volume");
  const option = TRAJECTORY_PROPERTY_OPTIONS.find((entry) => entry.value === property)!;
  const values = useMemo(
    () => trajectoryPropertySeries(frames, property),
    [frames, property],
  );

  const plot = useMemo(() => {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || Math.abs(max) * 0.01 || 1;
    const innerWidth = CHART_WIDTH - CHART_MARGIN.left - CHART_MARGIN.right;
    const innerHeight = CHART_HEIGHT - CHART_MARGIN.top - CHART_MARGIN.bottom;
    const xFor = (index: number) =>
      CHART_MARGIN.left + (values.length > 1 ? (index / (values.length - 1)) * innerWidth : 0);
    const yFor = (value: number) =>
      CHART_MARGIN.top + (1 - (value - min) / span) * innerHeight;
    return {
      innerWidth,
      max,
      min,
      points: values.map((value, index) => `${xFor(index)},${yFor(value)}`).join(" "),
      xFor,
      yFor,
    };
  }, [values]);

  function frameIndexFromPointer(event: PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const chartX = ((event.clientX - rect.left) / rect.width) * CHART_WIDTH;
    const ratio = (chartX - CHART_MARGIN.left) / plot.innerWidth;
    return Math.min(
      values.length - 1,
      Math.max(0, Math.round(ratio * (values.length - 1))),
    );
  }

  function handlePointer(event: PointerEvent<SVGSVGElement>) {
    if (event.buttons !== 1 && event.type !== "pointerdown") {
      return;
    }
    onFrameChange(frameIndexFromPointer(event));
  }

  const formatValue = (value: number) =>
    Math.abs(value) >= 1000 ? value.toFixed(0) : value.toFixed(2);

  return (
    <section
      aria-label="Trajectory data"
      style={{ height: TRAJECTORY_DATA_PANEL_HEIGHT }}
      className="flex w-[700px] flex-col overflow-hidden rounded-xl border border-foreground/10 bg-card px-4 pb-2.5 pt-2.5 shadow-xl shadow-foreground/10"
    >
      <div className="mb-1 flex items-center gap-2">
        <h2 className="text-xs font-semibold text-foreground">Trajectory data</h2>
        <Select
          value={property}
          onValueChange={(value) => setProperty(value as TrajectoryProperty)}
        >
          <SelectTrigger
            aria-label="Trajectory property"
            className="!h-6 w-[128px] rounded-md px-2 text-xs"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectGroup>
              {TRAJECTORY_PROPERTY_OPTIONS.map((entry) => (
                <SelectItem key={entry.value} value={entry.value} className="text-xs">
                  {entry.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <span className="ml-auto font-mono text-[11px] tabular-nums text-muted-foreground">
          {formatValue(values[activeFrameIndex] ?? 0)} {option.unit}
        </span>
      </div>
      <svg
        aria-label={`${option.label} per frame`}
        role="img"
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="h-full w-full cursor-crosshair touch-none select-none"
        onPointerDown={handlePointer}
        onPointerMove={handlePointer}
      >
        <line
          x1={CHART_MARGIN.left}
          x2={CHART_WIDTH - CHART_MARGIN.right}
          y1={CHART_HEIGHT - CHART_MARGIN.bottom}
          y2={CHART_HEIGHT - CHART_MARGIN.bottom}
          className="stroke-foreground/25"
          strokeWidth={1}
        />
        <line
          x1={CHART_MARGIN.left}
          x2={CHART_MARGIN.left}
          y1={CHART_MARGIN.top}
          y2={CHART_HEIGHT - CHART_MARGIN.bottom}
          className="stroke-foreground/25"
          strokeWidth={1}
        />
        <text
          x={CHART_MARGIN.left - 6}
          y={CHART_MARGIN.top + 8}
          textAnchor="end"
          className="fill-muted-foreground font-mono text-[12px] tabular-nums"
        >
          {formatValue(plot.max)}
        </text>
        <text
          x={CHART_MARGIN.left - 6}
          y={CHART_HEIGHT - CHART_MARGIN.bottom}
          textAnchor="end"
          className="fill-muted-foreground font-mono text-[12px] tabular-nums"
        >
          {formatValue(plot.min)}
        </text>
        <text
          x={CHART_MARGIN.left}
          y={CHART_HEIGHT - 5}
          textAnchor="middle"
          className="fill-muted-foreground font-mono text-[12px] tabular-nums"
        >
          1
        </text>
        <text
          x={CHART_WIDTH - CHART_MARGIN.right}
          y={CHART_HEIGHT - 5}
          textAnchor="middle"
          className="fill-muted-foreground font-mono text-[12px] tabular-nums"
        >
          {values.length}
        </text>
        <polyline
          fill="none"
          points={plot.points}
          className="stroke-foreground/80"
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
        {values.map((value, index) => (
          <circle
            key={index}
            cx={plot.xFor(index)}
            cy={plot.yFor(value)}
            r={index === activeFrameIndex ? 4 : 2}
            className={
              index === activeFrameIndex
                ? "fill-foreground"
                : "fill-foreground/45"
            }
          />
        ))}
        <line
          x1={plot.xFor(activeFrameIndex)}
          x2={plot.xFor(activeFrameIndex)}
          y1={CHART_MARGIN.top}
          y2={CHART_HEIGHT - CHART_MARGIN.bottom}
          className="stroke-foreground/30"
          strokeDasharray="3 3"
          strokeWidth={1}
        />
      </svg>
    </section>
  );
}
