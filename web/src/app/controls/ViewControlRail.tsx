import { Lock, MousePointer2, Rotate3d, RotateCcw, Unlock } from "lucide-react";
import {
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import {
  GLASS_SURFACE_CLASS,
  TOOL_ICON_BUTTON_ACTIVE_CLASS,
  TOOL_ICON_BUTTON_CLASS,
  TOOL_ICON_BUTTON_LOCK_FEEDBACK_A_CLASS,
  TOOL_ICON_BUTTON_LOCK_FEEDBACK_B_CLASS,
  TOOL_ICON_BUTTON_RESET_FEEDBACK_A_CLASS,
  TOOL_ICON_BUTTON_RESET_FEEDBACK_B_CLASS,
} from "../surface";
import type { CameraInteractionStore } from "../cameraInteractionStore";
import {
  clampDragSensitivity,
  dragSensitivityToSliderPosition,
  formatDragSensitivityPercent,
  formatZoomPercent,
  INTERACTION_MODE_OPTIONS,
  MAX_DRAG_SENSITIVITY,
  MIN_DRAG_SENSITIVITY,
  parseDragSensitivityPercentInput,
  parseZoomPercentInput,
  sliderPositionToDragSensitivity,
  sliderPositionToViewScale,
  snapDragSensitivitySliderPosition,
  snapZoomSliderPosition,
  viewScaleToSliderPosition,
  type InteractionMode,
} from "../viewState";
import { SettingRangeRow, SettingSelectRow } from "./commonPanel/settingRows";
import { OrientationTabContent } from "./commonPanel/OrientationTab";
import type {
  CrystalCameraPrimaryDirection,
  CrystalCameraScreenDirection,
  CrystalCameraState,
  VectorTuple,
} from "../../model";

const LOCKED_INTERACTION_FEEDBACK_ANIMATION_MS = 420;
const RESET_VIEW_FEEDBACK_ANIMATION_MS = 150;
const ZOOM_SLIDER_BLUR_DELAY_MS = 500;

/** Horizontal shortcut bar that sits under the main control panel. */
export function ViewControlRail({
  cameraInteractionStore,
  cameraState,
  cellVectors,
  className,
  dragSensitivity,
  interactionLocked,
  interactionMode,
  lockedInteractionFeedbackCount,
  onCameraPrimaryChange,
  onCameraRollChange,
  onCameraRollPreviewChange,
  onCameraRollPreviewStart,
  onCameraSecondaryChange,
  onCameraStateChange,
  onDragSensitivityChange,
  onInteractionLockedChange,
  onInteractionModeChange,
  onResetView,
}: {
  cameraInteractionStore: CameraInteractionStore;
  cameraState?: CrystalCameraState;
  cellVectors?: VectorTuple[];
  className?: string;
  dragSensitivity?: number;
  interactionLocked: boolean;
  interactionMode?: InteractionMode;
  lockedInteractionFeedbackCount: number;
  onCameraPrimaryChange?: (primary: CrystalCameraPrimaryDirection) => void;
  onCameraRollChange?: (rollDegrees: number) => void;
  onCameraRollPreviewChange?: (rollDegrees: number) => void;
  onCameraRollPreviewStart?: () => void;
  onCameraSecondaryChange?: (secondary: CrystalCameraScreenDirection) => void;
  onCameraStateChange?: (cameraState: CrystalCameraState) => void;
  onDragSensitivityChange?: (dragSensitivity: number) => void;
  onInteractionLockedChange: (interactionLocked: boolean) => void;
  onInteractionModeChange?: (interactionMode: InteractionMode) => void;
  onResetView: () => void;
}) {
  const viewScale = useSyncExternalStore(
    cameraInteractionStore.subscribeViewScale,
    cameraInteractionStore.getViewScaleSnapshot,
    cameraInteractionStore.getViewScaleSnapshot,
  );
  const [lockFeedbackPhase, setLockFeedbackPhase] = useState<"a" | "b" | null>(null);
  const [expandedSection, setExpandedSection] = useState<"pose" | "mouse" | null>(null);
  const isMouseSettingsOpen = expandedSection === "mouse";
  const isPoseOpen = expandedSection === "pose";
  const [resetFeedbackPhase, setResetFeedbackPhase] = useState<"a" | "b" | null>(null);
  const [zoomText, setZoomText] = useState(formatZoomPercent(viewScale));
  const lastLockFeedbackCountRef = useRef(0);
  const lockFeedbackTimeoutRef = useRef<number | null>(null);
  const resetFeedbackTickRef = useRef(0);
  const resetFeedbackTimeoutRef = useRef<number | null>(null);
  const zoomSliderRef = useRef<HTMLInputElement>(null);
  const zoomSliderBlurTimeoutRef = useRef<number | null>(null);
  const sliderPosition = viewScaleToSliderPosition(viewScale);
  const sliderValue = Math.round(sliderPosition * 1000);
  const visibleLockFeedbackPhase = interactionLocked ? lockFeedbackPhase : null;

  useEffect(() => {
    setZoomText(formatZoomPercent(viewScale));
  }, [viewScale]);

  useEffect(() => {
    if (lockedInteractionFeedbackCount === lastLockFeedbackCountRef.current) {
      return;
    }
    lastLockFeedbackCountRef.current = lockedInteractionFeedbackCount;
    if (lockedInteractionFeedbackCount === 0) {
      return;
    }

    setLockFeedbackPhase((phase) => (phase === "a" ? "b" : "a"));
    if (lockFeedbackTimeoutRef.current !== null) {
      window.clearTimeout(lockFeedbackTimeoutRef.current);
    }
    lockFeedbackTimeoutRef.current = window.setTimeout(() => {
      setLockFeedbackPhase(null);
      lockFeedbackTimeoutRef.current = null;
    }, LOCKED_INTERACTION_FEEDBACK_ANIMATION_MS);
  }, [lockedInteractionFeedbackCount]);

  useEffect(
    () => () => {
      if (lockFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(lockFeedbackTimeoutRef.current);
      }
      if (resetFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(resetFeedbackTimeoutRef.current);
      }
      if (zoomSliderBlurTimeoutRef.current !== null) {
        window.clearTimeout(zoomSliderBlurTimeoutRef.current);
      }
    },
    [],
  );

  function handleResetClick() {
    onResetView();
    resetFeedbackTickRef.current += 1;
    setResetFeedbackPhase(resetFeedbackTickRef.current % 2 === 0 ? "b" : "a");
    if (resetFeedbackTimeoutRef.current !== null) {
      window.clearTimeout(resetFeedbackTimeoutRef.current);
    }
    resetFeedbackTimeoutRef.current = window.setTimeout(() => {
      setResetFeedbackPhase(null);
      resetFeedbackTimeoutRef.current = null;
    }, RESET_VIEW_FEEDBACK_ANIMATION_MS);
  }

  function handleSliderChange(nextValue: number) {
    const snappedPosition = snapZoomSliderPosition(nextValue / 1000);
    cameraInteractionStore.requestViewScale(sliderPositionToViewScale(snappedPosition));

    if (zoomSliderBlurTimeoutRef.current !== null) {
      window.clearTimeout(zoomSliderBlurTimeoutRef.current);
    }
    zoomSliderBlurTimeoutRef.current = window.setTimeout(() => {
      zoomSliderRef.current?.blur();
      zoomSliderBlurTimeoutRef.current = null;
    }, ZOOM_SLIDER_BLUR_DELAY_MS);
  }

  function commitZoomText() {
    const parsedViewScale = parseZoomPercentInput(zoomText);
    if (parsedViewScale === null) {
      setZoomText(formatZoomPercent(viewScale));
      return;
    }
    cameraInteractionStore.requestViewScale(parsedViewScale);
  }

  function handleZoomKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      commitZoomText();
      event.currentTarget.blur();
    }
    if (event.key === "Escape") {
      setZoomText(formatZoomPercent(viewScale));
      event.currentTarget.blur();
    }
  }

  return (
    <TooltipProvider>
      <aside
        aria-label="View controls"
        className={cn(
          "flex w-full flex-col rounded-xl border px-2 py-1.5 shadow-xl shadow-foreground/10",
          GLASS_SURFACE_CLASS,
          className,
        )}
      >
        <div className="flex w-full items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Reset view"
              className={cn(
                TOOL_ICON_BUTTON_CLASS,
                resetFeedbackPhase === "a" ? TOOL_ICON_BUTTON_RESET_FEEDBACK_A_CLASS : null,
                resetFeedbackPhase === "b" ? TOOL_ICON_BUTTON_RESET_FEEDBACK_B_CLASS : null,
              )}
              onClick={handleResetClick}
            >
              <RotateCcw aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Reset view</TooltipContent>
        </Tooltip>

        {cameraState && cellVectors && onCameraStateChange ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Pose"
                aria-expanded={isPoseOpen}
                className={cn(
                  TOOL_ICON_BUTTON_CLASS,
                  isPoseOpen ? TOOL_ICON_BUTTON_ACTIVE_CLASS : "text-muted-foreground",
                )}
                onClick={() =>
                  setExpandedSection((section) => (section === "pose" ? null : "pose"))
                }
              >
                <Rotate3d aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Pose</TooltipContent>
          </Tooltip>
        ) : null}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={
                interactionLocked ? "Unlock mouse interaction" : "Lock mouse interaction"
              }
              aria-pressed={interactionLocked}
              className={cn(
                TOOL_ICON_BUTTON_CLASS,
                interactionLocked
                  ? TOOL_ICON_BUTTON_ACTIVE_CLASS
                  : "text-muted-foreground",
                visibleLockFeedbackPhase === "a" ? TOOL_ICON_BUTTON_LOCK_FEEDBACK_A_CLASS : null,
                visibleLockFeedbackPhase === "b" ? TOOL_ICON_BUTTON_LOCK_FEEDBACK_B_CLASS : null,
              )}
              onClick={() => onInteractionLockedChange(!interactionLocked)}
            >
              {interactionLocked ? <Lock aria-hidden="true" /> : <Unlock aria-hidden="true" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {interactionLocked ? "Unlock mouse interaction" : "Lock mouse interaction"}
          </TooltipContent>
        </Tooltip>

        {interactionMode && onInteractionModeChange && onDragSensitivityChange ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Mouse settings"
                aria-expanded={isMouseSettingsOpen}
                className={cn(
                  TOOL_ICON_BUTTON_CLASS,
                  isMouseSettingsOpen
                    ? TOOL_ICON_BUTTON_ACTIVE_CLASS
                    : "text-muted-foreground",
                )}
                onClick={() =>
                  setExpandedSection((section) => (section === "mouse" ? null : "mouse"))
                }
              >
                <MousePointer2 aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Mouse settings</TooltipContent>
          </Tooltip>
        ) : null}

        <input
          ref={zoomSliderRef}
          type="range"
          min={0}
          max={1000}
          step={1}
          value={sliderValue}
          aria-label="Zoom percentage"
          aria-valuetext={`${formatZoomPercent(viewScale)}%`}
          className="min-w-0 flex-1 accent-foreground"
          onChange={(event) => handleSliderChange(Number(event.target.value))}
        />

        <label className="zoom-percent-control group flex h-[22px] w-[46px] items-baseline justify-center gap-0 rounded-md border px-0.5 transition-[background-color,border-color,box-shadow] duration-150">
          <input
            aria-label="Zoom percentage input"
            className="w-8 bg-transparent text-right font-mono text-[11px] tabular-nums outline-none"
            inputMode="numeric"
            onBlur={commitZoomText}
            onChange={(event) => setZoomText(event.target.value)}
            onKeyDown={handleZoomKeyDown}
            value={zoomText}
          />
          <span className="text-[10px] text-muted-foreground">%</span>
        </label>
        </div>

        {isPoseOpen &&
        cameraState &&
        cellVectors &&
        onCameraPrimaryChange &&
        onCameraRollChange &&
        onCameraRollPreviewChange &&
        onCameraRollPreviewStart &&
        onCameraSecondaryChange &&
        onCameraStateChange ? (
          <div
            aria-label="Pose"
            role="group"
            className="mt-1.5 w-full border-t border-border/60 pt-1.5"
          >
            <OrientationTabContent
              cameraState={cameraState}
              cellVectors={cellVectors}
              onCameraPrimaryChange={onCameraPrimaryChange}
              onCameraRollPreviewChange={onCameraRollPreviewChange}
              onCameraRollPreviewStart={onCameraRollPreviewStart}
              onCameraRollChange={onCameraRollChange}
              onCameraSecondaryChange={onCameraSecondaryChange}
              onCameraStateChange={onCameraStateChange}
            />
          </div>
        ) : null}

        {isMouseSettingsOpen &&
        interactionMode &&
        onInteractionModeChange &&
        onDragSensitivityChange ? (
          <div
            aria-label="Mouse settings"
            role="group"
            className="mt-1.5 flex w-full flex-col gap-1.5 border-t border-border/60 pt-1.5"
          >
            <SettingSelectRow label="Mouse control">
              <Select
                value={interactionMode}
                onValueChange={(value) =>
                  onInteractionModeChange(value as InteractionMode)
                }
              >
                <SelectTrigger
                  size="sm"
                  aria-label="Mouse control"
                  className="!h-[26px] w-full bg-background !px-2 !py-0 text-xs"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" className="!bg-background !text-foreground">
                  <SelectGroup>
                    {INTERACTION_MODE_OPTIONS.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="min-h-[26px] py-1 text-xs"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </SettingSelectRow>
            <SettingRangeRow
              label="Drag sensitivity"
              value={dragSensitivity ?? 1}
              min={MIN_DRAG_SENSITIVITY}
              max={MAX_DRAG_SENSITIVITY}
              clampValue={clampDragSensitivity}
              formatPercent={formatDragSensitivityPercent}
              onValueChange={onDragSensitivityChange}
              parsePercentInput={parseDragSensitivityPercentInput}
              sliderPositionToValue={sliderPositionToDragSensitivity}
              snapSliderPosition={snapDragSensitivitySliderPosition}
              valueToSliderPosition={dragSensitivityToSliderPosition}
            />
          </div>
        ) : null}
      </aside>
    </TooltipProvider>
  );
}
