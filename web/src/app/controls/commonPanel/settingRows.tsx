import { type CSSProperties, type KeyboardEvent, type ReactNode, useEffect, useState } from "react";

import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import { useAutoBlurSlider } from "./sharedControls";

const INSPECTOR_BODY_TEXT_CLASS = "text-xs";
const INSPECTOR_SECTION_TITLE_CLASS =
  "text-2xs font-bold leading-tight text-muted-foreground";
const INSPECTOR_SELECT_TRIGGER_CLASS =
  "!h-[26px] w-full !px-2 !py-0 bg-background text-xs";
const INSPECTOR_SELECT_ITEM_CLASS = "min-h-[26px] py-1 text-xs";

export function SettingRowsSection({
  children,
  id,
  title,
}: {
  children: ReactNode;
  id: string;
  title: string;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className={INSPECTOR_SECTION_TITLE_CLASS}>
        {title}
      </h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

export function SettingRangeRow({
  clampValue,
  formatPercent,
  label,
  max,
  min,
  onValueChange,
  parsePercentInput,
  sliderPositionToValue,
  snapSliderPosition,
  value,
  valueToSliderPosition,
}: {
  clampValue: (value: number) => number;
  formatPercent: (value: number) => string;
  label: string;
  max: number;
  min: number;
  onValueChange: (value: number) => void;
  parsePercentInput: (value: string) => number | null;
  sliderPositionToValue: (position: number) => number;
  snapSliderPosition: (position: number) => number;
  value: number;
  valueToSliderPosition: (value: number) => number;
}) {
  const [valueText, setValueText] = useState(formatPercent(value));
  const sliderBlur = useAutoBlurSlider();
  const sliderPosition = valueToSliderPosition(value);
  const sliderValue = Math.round(sliderPosition * 1000);
  const sliderStyle = {
    "--opacity-slider-position": `${Math.min(100, Math.max(0, sliderPosition * 100))}%`,
  } as CSSProperties;

  useEffect(() => {
    setValueText(formatPercent(value));
  }, [formatPercent, value]);

  function commitValueText() {
    const nextValue = parsePercentInput(valueText);
    if (nextValue === null) {
      setValueText(formatPercent(value));
      return;
    }

    const clampedValue = clampValue(nextValue);
    setValueText(formatPercent(clampedValue));
    onValueChange(clampedValue);
  }

  function handleValueKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.currentTarget.blur();
      commitValueText();
      return;
    }

    if (event.key === "Escape") {
      setValueText(formatPercent(value));
      event.currentTarget.blur();
      return;
    }

    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const direction = event.key === "ArrowUp" ? 0.01 : -0.01;
      onValueChange(clampValue(value + direction));
    }
  }

  return (
    <label
      className={cn(
        "grid min-h-8 grid-cols-[minmax(0,1fr)_6.75rem_2.35rem] items-center gap-2",
        INSPECTOR_BODY_TEXT_CLASS,
      )}
    >
      <span className="min-w-0 truncate leading-tight text-foreground">{label}</span>
      <span className="opacity-slider-shell relative mr-3 h-5" style={sliderStyle}>
        <input
          type="range"
          aria-label={label}
          min={0}
          max={1000}
          step={1}
          value={sliderValue}
          aria-valuemin={Math.round(min * 100)}
          aria-valuemax={Math.round(max * 100)}
          aria-valuenow={Math.round(value * 100)}
          aria-valuetext={`${formatPercent(value)}%`}
          className="opacity-slider absolute inset-0 z-10 h-full w-full"
          ref={sliderBlur.ref}
          onChange={(event) => {
            const nextPosition = snapSliderPosition(Number(event.currentTarget.value) / 1000);
            onValueChange(sliderPositionToValue(nextPosition));
          }}
          onMouseDown={sliderBlur.handlePointerDown}
          onMouseUp={sliderBlur.handlePointerEnd}
          onPointerCancel={sliderBlur.handlePointerEnd}
          onPointerDown={sliderBlur.handlePointerDown}
          onPointerUp={sliderBlur.handlePointerEnd}
        />
        <span aria-hidden="true" className="opacity-slider-track pointer-events-none" />
        <span aria-hidden="true" className="opacity-slider-snap-marker pointer-events-none" />
        <span aria-hidden="true" className="opacity-slider-fill pointer-events-none" />
        <span aria-hidden="true" className="opacity-slider-thumb pointer-events-none" />
      </span>
      <span className="opacity-value-control group flex h-[22px] items-baseline justify-center gap-0 rounded-md border px-0.5 transition-[background-color,border-color,box-shadow] duration-150">
        <span className="sr-only">{label} value</span>
        <input
          type="text"
          inputMode="decimal"
          value={valueText}
          aria-label={`${label} value`}
          className="opacity-value-input h-full w-[1.35rem] border-0 bg-transparent px-0 text-right font-mono text-2xs leading-none tabular-nums outline-none"
          onBlur={commitValueText}
          onChange={(event) => setValueText(event.target.value)}
          onKeyDown={handleValueKeyDown}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none font-mono text-2xs font-normal leading-none text-muted-foreground"
        >
          %
        </span>
      </span>
    </label>
  );
}

export function SettingSwitchRow({
  checked,
  disabled = false,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div
      className={cn(
        "flex min-h-8 items-center justify-between gap-2",
        INSPECTOR_BODY_TEXT_CLASS,
        disabled ? "opacity-55" : null,
      )}
    >
      <span className="leading-tight text-foreground">{label}</span>
      <Switch
        checked={checked}
        disabled={disabled}
        aria-label={label}
        className="h-4 w-7 p-0.5"
        thumbClassName="size-3 data-[state=checked]:translate-x-3"
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
}

export function SettingSelectRow({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div
      className={cn(
        "grid min-h-8 grid-cols-[minmax(0,1fr)_9.5rem] items-center gap-2",
        INSPECTOR_BODY_TEXT_CLASS,
      )}
    >
      <span className="leading-tight text-foreground">{label}</span>
      {children}
    </div>
  );
}
