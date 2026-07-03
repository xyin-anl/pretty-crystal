import { Info } from "lucide-react";
import {
  type ChangeEvent,
  type FocusEvent,
  Fragment,
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import type {
  CrystalCameraScreenDirection,
  CrystalCameraState,
  VectorTuple,
} from "../../../../model";
import { COMMON_PANEL_SECTION_TITLE_TEXT_CLASS } from "../styles";
import {
  cameraStateFromVectorEditorDraft,
  resetVectorEditorDraft,
  updateVectorEditorDraft,
  vectorEditorRows,
} from "./vectorEditorModel";

const PRIMARY_AXIS_TOKEN_COLOR = "#505050";
const VECTOR_AXIS_TOKEN_CLASS =
  "inline-flex h-6 w-7 items-center justify-center rounded-md px-0 text-xs font-bold italic leading-none shadow-sm";

export function VectorEditor({
  cameraState,
  cellVectors,
  onCameraSecondaryChange,
  onCameraStateChange,
}: {
  cameraState: CrystalCameraState;
  cellVectors: VectorTuple[];
  onCameraSecondaryChange: (secondary: CrystalCameraScreenDirection) => void;
  onCameraStateChange: (cameraState: CrystalCameraState) => void;
}) {
  const currentDraft = useMemo(() => resetVectorEditorDraft(cameraState), [cameraState]);
  const [draft, setDraft] = useState(currentDraft);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!isDirty) {
      setDraft(currentDraft);
    }
  }, [currentDraft, isDirty]);

  // Edits apply immediately whenever the draft parses to a valid pose; the
  // dirty flag keeps the typed text intact until focus leaves the fields.
  function updateDraft(row: "direct" | "reciprocal", index: number, value: string) {
    setIsDirty(true);
    const nextDraft = updateVectorEditorDraft(draft, row, index, value);
    setDraft(nextDraft);

    const nextState = cameraStateFromVectorEditorDraft({
      cameraState,
      cellVectors,
      draft: nextDraft,
    });
    if (nextState !== null) {
      onCameraStateChange(nextState);
    }
  }

  function resetDraft() {
    setDraft(currentDraft);
    setIsDirty(false);
  }

  function handleFieldBlur() {
    // Resync the formatted (possibly orthogonalized) values once editing ends.
    setIsDirty(false);
  }

  function handleFieldKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.currentTarget.blur();
      setIsDirty(false);
      return;
    }

    if (event.key === "Escape") {
      resetDraft();
      event.currentTarget.blur();
    }
  }

  return (
    <section aria-labelledby="camera-manual-label" className="mt-1 grid gap-1.5 px-1.5 pb-1">
      <div className="flex h-7 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1">
          <h2
            id="camera-manual-label"
            className={cn(COMMON_PANEL_SECTION_TITLE_TEXT_CLASS, "leading-tight text-muted-foreground")}
          >
            Manual input
          </h2>
          <Tooltip delayDuration={650}>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="Manual input rules"
                className="inline-flex size-4 items-center justify-center rounded-md text-muted-foreground/75 outline-none transition-colors hover:text-foreground focus-visible:ring-[2px] focus-visible:ring-ring/30"
              >
                <Info aria-hidden="true" className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-56">
              Changes apply instantly. The two vectors should be orthogonal. If not, primary
              is kept and secondary is orthogonalized.
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      <div className="grid gap-1">
        {vectorEditorRows(cameraState, draft).map((row) => (
          <VectorEditorRow
            basisLabels={row.basisLabels}
            isPrimaryAxis={row.isPrimaryAxis}
            key={row.row}
            label={row.label}
            secondaryOptions={row.secondaryOptions}
            secondaryValue={row.secondaryOptions ? cameraState.secondary : undefined}
            values={row.draft}
            onSecondaryChange={onCameraSecondaryChange}
            onValueChange={(index, value) => updateDraft(row.row, index, value)}
            onFieldBlur={handleFieldBlur}
            onKeyDown={handleFieldKeyDown}
          />
        ))}
      </div>
    </section>
  );
}

function VectorEditorRow({
  basisLabels,
  isPrimaryAxis,
  label,
  onFieldBlur,
  onKeyDown,
  onSecondaryChange,
  secondaryOptions,
  secondaryValue,
  onValueChange,
  values,
}: {
  basisLabels: readonly string[];
  isPrimaryAxis: boolean;
  label: string;
  onFieldBlur: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onSecondaryChange: (secondary: CrystalCameraScreenDirection) => void;
  secondaryOptions?: readonly {
    direction: CrystalCameraScreenDirection;
    letter: "X" | "Y" | "Z";
    label: "Right" | "Up" | "Out";
  }[];
  secondaryValue?: CrystalCameraScreenDirection;
  onValueChange: (index: number, value: string) => void;
  values: readonly string[];
}) {
  const secondaryToggleOption = secondaryOptions?.find(
    (option) => option.direction === secondaryValue,
  );
  const nextSecondaryDirection = secondaryOptions?.find(
    (option) => option.direction !== secondaryValue,
  )?.direction;
  const labelContent = isPrimaryAxis || !secondaryToggleOption || !nextSecondaryDirection ? (
    <span
      className={cn(
        VECTOR_AXIS_TOKEN_CLASS,
        isPrimaryAxis
          ? "text-white"
          : "bg-muted text-muted-foreground",
      )}
      style={isPrimaryAxis ? { backgroundColor: PRIMARY_AXIS_TOKEN_COLOR } : undefined}
    >
      {label}
    </span>
  ) : (
    <button
      type="button"
      aria-label={`${secondaryToggleOption.letter.toLowerCase()} secondary axis`}
      className={cn(
        VECTOR_AXIS_TOKEN_CLASS,
        "bg-muted text-muted-foreground transition-[background-color,color,box-shadow] hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-ring/25",
      )}
      onClick={() => onSecondaryChange(nextSecondaryDirection)}
    >
      {secondaryToggleOption.letter.toLowerCase()}
    </button>
  );

  return (
    <div
      className="relative -mx-1 grid grid-cols-[3rem_minmax(0,1fr)] items-center gap-1 rounded-md px-1 py-1"
      data-camera-vector-row={label.toLowerCase().replace(/\s+/g, "-")}
      data-primary-axis={isPrimaryAxis ? "true" : undefined}
    >
      {labelContent}
      <div className="grid min-w-0 grid-cols-[2.75rem_0.8rem_0.45rem_2.75rem_0.8rem_0.45rem_2.75rem_0.8rem] items-center gap-x-0.5">
        {basisLabels.map((basisLabel, index) => (
          <Fragment key={basisLabel}>
            <label className="contents">
              <VectorCoefficientInput
                accessibleLabel={`${label} ${basisLabel}`}
                value={values[index] ?? "0.00"}
                onFieldBlur={onFieldBlur}
                onValueChange={(value) => onValueChange(index, value)}
                onKeyDown={onKeyDown}
              />
              <span className="shrink-0 text-[0.68rem] font-semibold italic leading-none text-muted-foreground">
                {basisLabel}
              </span>
            </label>
            {index < basisLabels.length - 1 ? (
              <span
                aria-hidden="true"
                className="text-[0.68rem] font-semibold leading-none text-muted-foreground"
              >
                +
              </span>
            ) : null}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

function VectorCoefficientInput({
  accessibleLabel,
  onFieldBlur,
  onKeyDown,
  onValueChange,
  value,
}: {
  accessibleLabel: string;
  onFieldBlur: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onValueChange: (value: string) => void;
  value: string;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasEdited, setHasEdited] = useState(false);
  const valueAtFocusRef = useRef(value);
  const displayedValue = isFocused && !hasEdited ? "" : value;

  function handleFocus() {
    valueAtFocusRef.current = value;
    setIsFocused(true);
    setHasEdited(false);
  }

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    setIsFocused(false);
    setHasEdited(false);

    if (hasEdited && event.currentTarget.value.trim() === "") {
      onValueChange(valueAtFocusRef.current);
    }
    onFieldBlur();
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setHasEdited(true);
    onValueChange(event.target.value);
  }

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={displayedValue}
      aria-label={accessibleLabel}
      className="h-[22px] w-[2.75rem] min-w-0 px-1 text-right font-mono text-[0.68rem] tabular-nums focus-visible:border-ring/20 focus-visible:bg-background/80 focus-visible:ring-[1px] focus-visible:ring-ring/20 md:text-[0.68rem]"
      onBlur={handleBlur}
      onChange={handleChange}
      onFocus={handleFocus}
      onKeyDown={onKeyDown}
    />
  );
}
