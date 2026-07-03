import {
  type Dispatch,
  type KeyboardEvent,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

import {
  BOND_ALGORITHM_OPTIONS,
  type BondAlgorithm,
  type SupercellDimensions,
} from "../../../api/scene";
import {
  ASU_GHOST_OPACITY_MAX,
  ASU_GHOST_OPACITY_MIN,
  MESH_QUALITY_LABELS,
  MESH_QUALITY_OPTIONS,
  SUPERCELL_DIMENSION_MAX,
  type ComponentVisibilityState,
  type LatticePlaneState,
  type MeshQuality,
  type StyleState,
} from "../../../model";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PercentSliderRow, clampPercentValue } from "./sharedControls";
import {
  COMMON_PANEL_BODY_TEXT_CLASS,
  COMMON_PANEL_SECTION_TITLE_TEXT_CLASS,
} from "./styles";

const DEFAULT_LATTICE_PLANE: LatticePlaneState = {
  h: 1,
  k: 1,
  l: 1,
  offsetPercent: 50,
};

/**
 * Parses Miller indices from "1 1 1", "1,1,1", or compact "111" / "1-10"
 * notation. Returns null when the text is not three integers or all zeros.
 */
export function parseMillerIndicesInput(text: string): [number, number, number] | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  const tokens = trimmed.split(/[\s,]+/).filter(Boolean);
  let indices: number[];
  if (tokens.length === 3) {
    indices = tokens.map((token) => Number.parseInt(token, 10));
  } else if (tokens.length === 1) {
    indices = Array.from(tokens[0]!.matchAll(/-?\d/g), (match) =>
      Number.parseInt(match[0], 10),
    );
  } else {
    return null;
  }

  if (indices.length !== 3 || indices.some((index) => !Number.isFinite(index))) {
    return null;
  }
  if (indices.every((index) => index === 0)) {
    return null;
  }

  return [indices[0]!, indices[1]!, indices[2]!];
}

export function DisplayTabContent({
  bondAlgorithm,
  hasPolyhedra = false,
  isSceneLoading = false,
  onBondAlgorithmChange,
  onPreviewMeshQualityChange,
  onShowCrystalAxisLabelsChange,
  onStyleChange,
  onSupercellChange,
  onVisibilityChange,
  previewMeshQuality,
  showCrystalAxisLabels,
  style,
  supercell,
  visibility,
}: {
  bondAlgorithm?: BondAlgorithm;
  hasPolyhedra?: boolean;
  isSceneLoading?: boolean;
  onBondAlgorithmChange?: (bondAlgorithm: BondAlgorithm) => void;
  onPreviewMeshQualityChange?: (meshQuality: MeshQuality) => void;
  onShowCrystalAxisLabelsChange?: (showCrystalAxisLabels: boolean) => void;
  onStyleChange?: Dispatch<SetStateAction<StyleState>>;
  onSupercellChange?: (supercell: SupercellDimensions) => void;
  onVisibilityChange: Dispatch<SetStateAction<ComponentVisibilityState>>;
  previewMeshQuality?: MeshQuality;
  showCrystalAxisLabels?: boolean;
  style?: StyleState;
  supercell?: SupercellDimensions;
  visibility: ComponentVisibilityState;
}) {
  function setVisibility(key: keyof ComponentVisibilityState, value: boolean) {
    onVisibilityChange((currentVisibility) => ({
      ...currentVisibility,
      [key]: value,
    }));
  }

  return (
    <div className="flex flex-col gap-1.5">
      <section aria-labelledby="display-objects-label">
        <h2
          id="display-objects-label"
          className={cn(COMMON_PANEL_SECTION_TITLE_TEXT_CLASS, "leading-tight text-muted-foreground")}
        >
          Objects
        </h2>
        <div className="mt-1.5 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-1">
          <ObjectVisibilityCheckbox
            checked={visibility.atoms}
            label="Atoms"
            onCheckedChange={(checked) => setVisibility("atoms", checked)}
          />
          <ObjectVisibilityCheckbox
            checked={visibility.bonds}
            label="Bonds"
            onCheckedChange={(checked) => setVisibility("bonds", checked)}
          />
          <ObjectVisibilityCheckbox
            checked={visibility.unitCell}
            label="Unit cell"
            onCheckedChange={(checked) => setVisibility("unitCell", checked)}
          />
          <ObjectVisibilityCheckbox
            checked={hasPolyhedra && visibility.polyhedra}
            disabled={!hasPolyhedra}
            label="Polyhedra"
            onCheckedChange={(checked) => setVisibility("polyhedra", checked)}
          />
        </div>
      </section>

      <Separator className="my-1" />

      <section aria-labelledby="image-components-label">
        <h2
          id="image-components-label"
          className={cn(COMMON_PANEL_SECTION_TITLE_TEXT_CLASS, "leading-tight text-muted-foreground")}
        >
          Periodic images
        </h2>
        <div className="mt-1.5 flex flex-col gap-1">
          <ImageSwitchRow
            checked={visibility.boundaryAtoms}
            label="Cell-boundary atoms"
            onCheckedChange={(checked) => setVisibility("boundaryAtoms", checked)}
          />
          <ImageSwitchRow
            checked={visibility.oneHopBondedAtoms}
            label="One-hop bonded atoms"
            onCheckedChange={(checked) => setVisibility("oneHopBondedAtoms", checked)}
          />
        </div>
      </section>

      {supercell && onSupercellChange ? (
        <>
          <Separator className="my-1" />
          <section aria-labelledby="supercell-label">
            <h2
              id="supercell-label"
              className={cn(
                COMMON_PANEL_SECTION_TITLE_TEXT_CLASS,
                "leading-tight text-muted-foreground",
              )}
            >
              Supercell
            </h2>
            <div className="mt-1.5 flex items-center gap-1 px-1.5">
              {(["a", "b", "c"] as const).map((axisLabel, axisIndex) => (
                <SupercellDimensionInput
                  key={axisLabel}
                  axisLabel={axisLabel}
                  onCommit={(dimension) => {
                    const nextSupercell: SupercellDimensions = [...supercell];
                    nextSupercell[axisIndex] = dimension;
                    if (nextSupercell.join() !== supercell.join()) {
                      onSupercellChange(nextSupercell);
                    }
                  }}
                  value={supercell[axisIndex]!}
                />
              ))}
            </div>
          </section>
        </>
      ) : null}

      {bondAlgorithm && onBondAlgorithmChange ? (
        <>
          <Separator className="my-1" />
          <section aria-labelledby="display-structure-label">
            <h2
              id="display-structure-label"
              className={cn(
                COMMON_PANEL_SECTION_TITLE_TEXT_CLASS,
                "leading-tight text-muted-foreground",
              )}
            >
              Structure
            </h2>
            <div className="mt-1.5 flex flex-col gap-1 px-1.5">
              <div
                className={cn(
                  "grid min-h-7 grid-cols-[minmax(5.5rem,1fr)_8.5rem] items-center gap-2",
                  COMMON_PANEL_BODY_TEXT_CLASS,
                )}
              >
                <span className="min-w-0 truncate leading-tight">Bonding</span>
                <Select
                  value={bondAlgorithm}
                  disabled={isSceneLoading}
                  onValueChange={(value) => onBondAlgorithmChange(value as BondAlgorithm)}
                >
                  <SelectTrigger
                    size="sm"
                    aria-label="Bonding algorithm"
                    className={cn("!h-6 w-full !px-2 !py-0", COMMON_PANEL_BODY_TEXT_CLASS)}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" className="!bg-background !text-foreground">
                    <SelectGroup>
                      {BOND_ALGORITHM_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value} className="text-xs">
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              {style && onStyleChange ? (
                <div
                  className={cn(
                    "grid min-h-7 grid-cols-[minmax(5.5rem,1fr)_auto] items-center gap-2",
                    COMMON_PANEL_BODY_TEXT_CLASS,
                  )}
                >
                  <span
                    className="min-w-0 truncate leading-tight"
                    title="Show only the symmetry-unique atoms at full opacity and ghost all symmetry-equivalent copies."
                  >
                    Asymmetric unit
                  </span>
                  <Switch
                    checked={style.asuHighlight}
                    aria-label="Highlight the asymmetric unit"
                    className="h-4 w-7 p-0.5"
                    thumbClassName="size-3 data-[state=checked]:translate-x-3"
                    onCheckedChange={(checked) =>
                      onStyleChange((currentStyle) => ({
                        ...currentStyle,
                        asuHighlight: checked,
                      }))
                    }
                  />
                </div>
              ) : null}
            </div>
            {style?.asuHighlight && onStyleChange ? (
              <div className="mt-1">
                <PercentSliderRow
                  accessibleLabel="Ghost atom"
                  allowZero
                  label="Ghost opacity"
                  max={ASU_GHOST_OPACITY_MAX}
                  min={ASU_GHOST_OPACITY_MIN}
                  onValueChange={(value) =>
                    onStyleChange((currentStyle) => ({
                      ...currentStyle,
                      asuGhostOpacity: clampPercentValue(
                        value,
                        ASU_GHOST_OPACITY_MIN,
                        ASU_GHOST_OPACITY_MAX,
                      ),
                    }))
                  }
                  value={style.asuGhostOpacity}
                  valueLabel="opacity"
                />
              </div>
            ) : null}
          </section>

          {style && onStyleChange ? (
            <>
              <Separator className="my-1" />
              <LatticePlaneSection style={style} onStyleChange={onStyleChange} />
            </>
          ) : null}

          {previewMeshQuality && onPreviewMeshQualityChange ? (
            <>
              <Separator className="my-1" />
              <section aria-labelledby="display-preview-label">
                <h2
                  id="display-preview-label"
                  className={cn(
                    COMMON_PANEL_SECTION_TITLE_TEXT_CLASS,
                    "leading-tight text-muted-foreground",
                  )}
                >
                  Preview
                </h2>
                <div className="mt-1.5 flex flex-col gap-1 px-1.5">
                  <div
                    className={cn(
                      "grid min-h-7 grid-cols-[minmax(5.5rem,1fr)_8.5rem] items-center gap-2",
                      COMMON_PANEL_BODY_TEXT_CLASS,
                    )}
                  >
                    <span
                      className="min-w-0 truncate leading-tight"
                      title="Sphere and cylinder smoothness of the interactive preview. Lower detail keeps large structures responsive; exports have their own mesh detail."
                    >
                      Mesh detail
                    </span>
                    <Select
                      value={previewMeshQuality}
                      onValueChange={(value) =>
                        onPreviewMeshQualityChange(value as MeshQuality)
                      }
                    >
                      <SelectTrigger
                        size="sm"
                        aria-label="Preview quality"
                        className={cn("!h-6 w-full !px-2 !py-0", COMMON_PANEL_BODY_TEXT_CLASS)}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper" className="!bg-background !text-foreground">
                        <SelectGroup>
                          {MESH_QUALITY_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option} className="text-xs">
                              {MESH_QUALITY_LABELS[option]}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  {onShowCrystalAxisLabelsChange ? (
                    <div
                      className={cn(
                        "grid min-h-7 grid-cols-[minmax(5.5rem,1fr)_auto] items-center gap-2",
                        COMMON_PANEL_BODY_TEXT_CLASS,
                      )}
                    >
                      <span className="min-w-0 truncate leading-tight">Crystal axis labels</span>
                      <Switch
                        checked={showCrystalAxisLabels ?? true}
                        aria-label="Crystal axis labels"
                        className="h-4 w-7 p-0.5"
                        thumbClassName="size-3 data-[state=checked]:translate-x-3"
                        onCheckedChange={onShowCrystalAxisLabelsChange}
                      />
                    </div>
                  ) : null}
                </div>
              </section>
            </>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function LatticePlaneSection({
  onStyleChange,
  style,
}: {
  onStyleChange: Dispatch<SetStateAction<StyleState>>;
  style: StyleState;
}) {
  const plane = style.latticePlane;
  const lastPlaneRef = useRef<LatticePlaneState>(plane ?? DEFAULT_LATTICE_PLANE);
  const [hklText, setHklText] = useState(plane ? `${plane.h} ${plane.k} ${plane.l}` : "");
  const [offsetText, setOffsetText] = useState(String(plane?.offsetPercent ?? 50));

  useEffect(() => {
    if (plane) {
      lastPlaneRef.current = plane;
    }
    setHklText(plane ? `${plane.h} ${plane.k} ${plane.l}` : "");
    setOffsetText(String(plane?.offsetPercent ?? 50));
  }, [plane]);

  function handleToggle(checked: boolean) {
    onStyleChange((currentStyle) => ({
      ...currentStyle,
      latticePlane: checked ? { ...lastPlaneRef.current } : null,
    }));
  }

  function applyPlane(indices: [number, number, number], offsetPercent: number) {
    onStyleChange((currentStyle) =>
      currentStyle.latticePlane
        ? {
            ...currentStyle,
            latticePlane: {
              ...currentStyle.latticePlane,
              h: indices[0],
              k: indices[1],
              l: indices[2],
              offsetPercent,
            },
          }
        : currentStyle,
    );
  }

  function parsedOffsetPercent(text: string): number | null {
    const parsed = Number.parseFloat(text);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
      return null;
    }
    return parsed;
  }

  function handleHklChange(text: string) {
    setHklText(text);
    if (!plane) {
      return;
    }

    const indices = parseMillerIndicesInput(text);
    if (indices) {
      applyPlane(indices, plane.offsetPercent);
    }
  }

  function handleOffsetChange(text: string) {
    setOffsetText(text);
    if (!plane) {
      return;
    }

    const offsetPercent = parsedOffsetPercent(text);
    if (offsetPercent !== null) {
      applyPlane([plane.h, plane.k, plane.l], offsetPercent);
    }
  }

  function commit() {
    if (!plane) {
      return;
    }

    const indices = parseMillerIndicesInput(hklText) ?? [plane.h, plane.k, plane.l];
    setHklText(`${indices[0]} ${indices[1]} ${indices[2]}`);
    const offsetPercent = parsedOffsetPercent(offsetText) ?? plane.offsetPercent;
    setOffsetText(String(offsetPercent));
    applyPlane([indices[0]!, indices[1]!, indices[2]!], offsetPercent);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      commit();
      event.currentTarget.blur();
    }
  }

  return (
    <section aria-labelledby="display-plane-label">
      <div className="flex items-center justify-between gap-2 pr-1.5">
        <h2
          id="display-plane-label"
          className={cn(COMMON_PANEL_SECTION_TITLE_TEXT_CLASS, "leading-tight text-muted-foreground")}
          title="Draw a crystallographic (hkl) plane through the unit cell. Set its color and opacity in the Style tab."
        >
          Lattice plane
        </h2>
        <Switch
          checked={plane !== null}
          aria-label="Show lattice plane"
          className="h-4 w-7 p-0.5"
          thumbClassName="size-3 data-[state=checked]:translate-x-3"
          onCheckedChange={handleToggle}
        />
      </div>
      {plane ? (
        <div className="mt-1.5 flex flex-col gap-1 px-1.5">
          <div
            className={cn(
              "grid min-h-7 grid-cols-[minmax(5.5rem,1fr)_8.5rem] items-center gap-2",
              COMMON_PANEL_BODY_TEXT_CLASS,
            )}
          >
            <span
              className="min-w-0 truncate leading-tight"
              title="Three Miller indices, e.g. 111 or 1 0 -1."
            >
              Miller indices
            </span>
            <Input
              aria-label="Lattice plane Miller indices"
              className="!h-6 w-full px-1.5 text-center text-xs tabular-nums"
              onBlur={commit}
              onChange={(event) => handleHklChange(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="1 1 1"
              value={hklText}
            />
          </div>
          <div
            className={cn(
              "grid min-h-7 grid-cols-[minmax(5.5rem,1fr)_8.5rem] items-center gap-2",
              COMMON_PANEL_BODY_TEXT_CLASS,
            )}
          >
            <span
              className="min-w-0 truncate leading-tight"
              title="Slides the plane through the cell from 0% to 100%."
            >
              Offset %
            </span>
            <Input
              aria-label="Lattice plane offset percent"
              className="!h-6 w-full px-1.5 text-center text-xs tabular-nums"
              inputMode="numeric"
              onBlur={commit}
              onChange={(event) => handleOffsetChange(event.target.value)}
              onKeyDown={handleKeyDown}
              value={offsetText}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function SupercellDimensionInput({
  axisLabel,
  onCommit,
  value,
}: {
  axisLabel: string;
  onCommit: (dimension: number) => void;
  value: number;
}) {
  const [text, setText] = useState(String(value));

  useEffect(() => {
    setText(String(value));
  }, [value]);

  function handleChange(nextText: string) {
    setText(nextText);
    const parsed = Number.parseInt(nextText, 10);
    if (Number.isFinite(parsed) && parsed >= 1 && parsed <= SUPERCELL_DIMENSION_MAX) {
      onCommit(parsed);
    }
  }

  function commit() {
    const parsed = Number.parseInt(text, 10);
    if (!Number.isFinite(parsed)) {
      setText(String(value));
      return;
    }

    const clamped = Math.min(SUPERCELL_DIMENSION_MAX, Math.max(1, parsed));
    setText(String(clamped));
    onCommit(clamped);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      commit();
      event.currentTarget.blur();
    }
    if (event.key === "Escape") {
      setText(String(value));
      event.currentTarget.blur();
    }
  }

  return (
    <label
      className={cn(
        COMMON_PANEL_BODY_TEXT_CLASS,
        "flex flex-1 items-center gap-1.5 text-muted-foreground",
      )}
    >
      <span className="font-mono italic">{axisLabel}</span>
      <Input
        aria-label={`Supercell ${axisLabel} repetitions`}
        className="h-6 px-1.5 text-center text-xs tabular-nums"
        inputMode="numeric"
        min={1}
        max={SUPERCELL_DIMENSION_MAX}
        onBlur={commit}
        onChange={(event) => handleChange(event.target.value)}
        onKeyDown={handleKeyDown}
        type="number"
        value={text}
      />
    </label>
  );
}

function ObjectVisibilityCheckbox({
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
    <label
      className={cn(
        "flex h-7 min-w-0 items-center gap-2 rounded-md px-1.5 transition-colors",
        COMMON_PANEL_BODY_TEXT_CLASS,
        disabled ? "cursor-not-allowed text-muted-foreground/55" : "cursor-pointer hover:bg-accent/60",
      )}
    >
      <Checkbox
        checked={checked}
        disabled={disabled}
        aria-label={label}
        className="size-3.5 rounded-[3px]"
        iconClassName="size-3"
        onCheckedChange={(nextChecked) => onCheckedChange(nextChecked === true)}
      />
      <span className="min-w-0 truncate leading-tight">{label}</span>
    </label>
  );
}

function ImageSwitchRow({
  checked,
  label,
  onCheckedChange,
}: {
  checked: boolean;
  label: string;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={cn(
        "flex h-6 items-center justify-between gap-1.5 rounded-md px-1.5 transition-colors hover:bg-accent/60",
        COMMON_PANEL_BODY_TEXT_CLASS,
      )}
    >
      <span className="min-w-0 truncate leading-tight">{label}</span>
      <Switch
        checked={checked}
        aria-label={label}
        className="h-4 w-7 p-0.5"
        thumbClassName="size-3 data-[state=checked]:translate-x-3"
        onCheckedChange={onCheckedChange}
      />
    </label>
  );
}
