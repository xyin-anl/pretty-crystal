import { cn } from "@/lib/utils";

import type { CrystalCameraPrimaryDirection } from "../../../../model";
import { COMMON_PANEL_SECTION_TITLE_TEXT_CLASS } from "../styles";
import { RollControl } from "./RollControl";
import { ScreenAxisChooser } from "./ScreenAxisChooserLazy";

export function PrimaryAxisRollSection({
  onCameraPrimaryChange,
  onCameraRollChange,
  onCameraRollPreviewChange,
  onCameraRollPreviewStart,
  primary,
  rollDegrees,
}: {
  onCameraPrimaryChange: (primary: CrystalCameraPrimaryDirection) => void;
  onCameraRollChange: (rollDegrees: number) => void;
  onCameraRollPreviewChange: (rollDegrees: number) => void;
  onCameraRollPreviewStart: () => void;
  primary: CrystalCameraPrimaryDirection;
  rollDegrees: number;
}) {
  return (
    <section aria-labelledby="camera-axis-roll-label" className="mb-0.5 grid gap-1.5 px-1.5 pb-1">
      <div className="flex h-7 items-center justify-between gap-2">
        <h2
          id="camera-axis-roll-label"
          className={cn(COMMON_PANEL_SECTION_TITLE_TEXT_CLASS, "leading-tight text-muted-foreground")}
        >
          Primary Axis
        </h2>
      </div>
      <div className="-mt-2 grid min-h-[124px] grid-cols-2 items-center gap-3">
        <div className="flex min-w-0 translate-x-2 items-center justify-center">
          <ScreenAxisChooser
            ariaLabelledBy="camera-axis-roll-label"
            value={primary}
            onValueChange={onCameraPrimaryChange}
          />
        </div>

        <RollControl
          className="translate-x-1"
          value={rollDegrees}
          onPreviewValueChange={onCameraRollPreviewChange}
          onPreviewStart={onCameraRollPreviewStart}
          onValueChange={onCameraRollChange}
        />
      </div>
    </section>
  );
}
