import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import { GLASS_SURFACE_CLASS, TOOL_ICON_BUTTON_CLASS } from "../surface";

const FPS_OPTIONS = [5, 10, 15, 20, 30];

/** Playback controls for multi-structure trajectories. */
export function TrajectoryBar({
  activeFrameIndex,
  frameCount,
  isAligned,
  isLoading,
  onAlignChange,
  onFrameChange,
}: {
  activeFrameIndex: number;
  frameCount: number;
  isAligned: boolean;
  isLoading: boolean;
  onAlignChange: (aligned: boolean) => void;
  onFrameChange: (frameIndex: number) => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [fps, setFps] = useState(10);
  const frameRef = useRef(activeFrameIndex);
  frameRef.current = activeFrameIndex;

  useEffect(() => {
    if (!isPlaying || frameCount < 2) {
      return;
    }

    const interval = window.setInterval(() => {
      onFrameChange((frameRef.current + 1) % frameCount);
    }, 1000 / fps);
    return () => {
      window.clearInterval(interval);
    };
  }, [fps, frameCount, isPlaying, onFrameChange]);

  useEffect(() => {
    if (frameCount < 2) {
      setIsPlaying(false);
    }
  }, [frameCount]);

  if (frameCount < 2) {
    return null;
  }

  return (
    <TooltipProvider>
      <section
        aria-label="Trajectory playback"
        className={cn(
          "absolute bottom-[6rem] left-[calc(50%+9rem)] z-20 flex -translate-x-1/2 items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 shadow-lg shadow-foreground/10",
          GLASS_SURFACE_CLASS,
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          aria-label={isPlaying ? "Pause playback" : "Play trajectory"}
          className={TOOL_ICON_BUTTON_CLASS}
          onClick={() => setIsPlaying((currentIsPlaying) => !currentIsPlaying)}
        >
          {isPlaying ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
        </Button>
        <input
          aria-label="Trajectory frame"
          className="w-40 accent-foreground"
          max={frameCount - 1}
          min={0}
          onChange={(event) => {
            setIsPlaying(false);
            onFrameChange(Number(event.target.value));
          }}
          step={1}
          type="range"
          value={activeFrameIndex}
        />
        <span className="w-14 text-center font-mono text-[11px] tabular-nums text-muted-foreground">
          {activeFrameIndex + 1} / {frameCount}
        </span>
        <Select value={String(fps)} onValueChange={(value) => setFps(Number(value))}>
          <SelectTrigger
            aria-label="Playback speed"
            className="!h-6 w-[72px] rounded-md px-2 text-[11px]"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {FPS_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)} className="text-xs">
                  {option} fps
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Tooltip>
          <TooltipTrigger asChild>
            <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              Align
              <Switch
                checked={isAligned}
                aria-label="Align frames to the first structure"
                className="h-4 w-7 p-0.5"
                disabled={isLoading}
                thumbClassName="size-3 data-[state=checked]:translate-x-3"
                onCheckedChange={onAlignChange}
              />
            </label>
          </TooltipTrigger>
          <TooltipContent side="top">
            Map every frame onto the first structure&apos;s setting
            (StructureMatcher); use for structures from different sources, not
            for real trajectories.
          </TooltipContent>
        </Tooltip>
      </section>
    </TooltipProvider>
  );
}
