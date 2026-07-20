import { Check, ChevronDown, ClipboardCopy, FileUp, RotateCcw } from "lucide-react";
import {
  type CSSProperties,
  type Dispatch,
  type KeyboardEvent,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import type { AtomRadiusModel } from "../../../api/scene";
import {
  COLOR_SCHEME_OPTIONS,
  colorSchemeTokenStyle,
  type ColorScheme,
} from "../../../model/colorSchemes";
import {
  MATERIAL_PRESET_OPTIONS,
  type MaterialPresetId,
} from "../../../model/materialPresets";
import {
  COMPONENT_OPACITY_MAX,
  LATTICE_PLANE_OPACITY_PERCENT,
  VECTOR_GLYPH_SCALE_MAX,
  VECTOR_GLYPH_SCALE_MIN,
  STYLE_FOG_AMOUNT_MAX,
  STYLE_FOG_AMOUNT_MIN,
  STYLE_FOG_START_MAX,
  STYLE_FOG_START_MIN,
  STYLE_SCALE_MAX,
  STYLE_SCALE_MIN,
  createDefaultComponentOpacity,
  createDefaultStyle,
  createCustomColormapFromScheme,
  DEFAULT_BOND_COLOR,
  hasCustomColormapChanges,
  type BondColorMode,
  type ComponentOpacityState,
  type ComponentVisibilityState,
  type StyleState,
  type UnitCellLineStyle,
} from "../../../model";
import {
  TOOL_ICON_BUTTON_CLASS,
  TOOL_ICON_BUTTON_RESET_FEEDBACK_A_CLASS,
  TOOL_ICON_BUTTON_RESET_FEEDBACK_B_CLASS,
} from "../../surface";
import { TOOL_ICON_BUTTON_FEEDBACK_ANIMATION_MS } from "./controlFeedback";
import {
  PercentSliderRow,
  clampOpacityValue,
  clampPercentValue,
  formatOpacityValue,
  parseOpacityInput,
  snapSliderOpacityValue,
  useAutoBlurSlider,
} from "./sharedControls";
import {
  clampLightStrength,
  MAX_LIGHT_STRENGTH,
  MIN_LIGHT_STRENGTH,
} from "../../viewState";
import {
  COMMON_PANEL_BODY_TEXT_CLASS,
  COMMON_PANEL_FIELD_LABEL_TEXT_CLASS,
  COMMON_PANEL_ROW_STACK_CLASS,
  COMMON_PANEL_SECTION_TITLE_TEXT_CLASS,
} from "./styles";
import { MaterialPresetToken3D } from "./MaterialPresetToken3DLazy";

const BOND_COLOR_OPTIONS: { label: string; value: BondColorMode }[] = [
  { label: "Unicolor", value: "unicolor" },
  { label: "Bicolor", value: "bicolor" },
];
const CUSTOM_COLOR_SCHEME_VALUE = "__custom";
const NATIVE_COLOR_VALUE_PATTERN = /^#[\da-fA-F]{6}$/;
const ATOM_RADIUS_MODEL_OPTIONS: {
  menuLabel: string;
  value: AtomRadiusModel;
}[] = [
  { menuLabel: "Uniform", value: "uniform" },
  { menuLabel: "Atomic", value: "atomic" },
  { menuLabel: "Van der Waals", value: "vdw" },
  { menuLabel: "Ionic", value: "ionic" },
];
const BY_ATOM_TOKEN_STYLE = { background: "linear-gradient(90deg, #f58c9a 0 50%, #78a7ff 50% 100%)" } as const;
const CUSTOM_COLOR_SCHEME_TOKEN_STYLE = {
  background:
    "linear-gradient(90deg, oklch(78% 0.17 24) 0%, oklch(80% 0.18 92) 28%, oklch(78% 0.17 168) 60%, oklch(76% 0.18 268) 100%)",
  boxShadow:
    "inset 0 0 0 1px oklch(100% 0 0 / 0.35), inset 0 1px 0 oklch(100% 0 0 / 0.28)",
} satisfies CSSProperties;

export function StyleTabContent({
  componentOpacity,
  componentVisibility,
  hasPolyhedra = false,
  lightStrength,
  onApplyRenderStyle,
  onAtomRadiusModelChange,
  onComponentOpacityChange,
  onCopyRenderStyle,
  onLightStrengthChange,
  onStyleChange,
  onUnitCellLineStyleChange,
  style,
  unitCellLineStyle,
  vectorProperties = [],
}: {
  componentOpacity?: ComponentOpacityState;
  componentVisibility?: ComponentVisibilityState;
  hasPolyhedra?: boolean;
  lightStrength?: number;
  onApplyRenderStyle?: (file: File) => Promise<void>;
  onAtomRadiusModelChange: (atomRadiusModel: AtomRadiusModel) => void;
  onComponentOpacityChange?: Dispatch<SetStateAction<ComponentOpacityState>>;
  onCopyRenderStyle?: () => Promise<boolean>;
  onLightStrengthChange?: (lightStrength: number) => void;
  onStyleChange: Dispatch<SetStateAction<StyleState>>;
  onUnitCellLineStyleChange?: (lineStyle: UnitCellLineStyle) => void;
  style: StyleState;
  unitCellLineStyle?: UnitCellLineStyle;
  vectorProperties?: string[];
}) {
  function setStyleScale(key: keyof typeof STYLE_SCALE_MIN, value: number) {
    onStyleChange((currentStyle) => ({
      ...currentStyle,
      [key]: clampPercentValue(value, STYLE_SCALE_MIN[key], STYLE_SCALE_MAX[key]),
    }));
  }

  function setAtomRadiusModel(atomRadiusModel: AtomRadiusModel) {
    onAtomRadiusModelChange(atomRadiusModel);
  }

  function setBondColorMode(bondColorMode: BondColorMode) {
    onStyleChange((currentStyle) => ({
      ...currentStyle,
      bondColor:
        bondColorMode === "bicolor"
          ? DEFAULT_BOND_COLOR
          : currentStyle.bondColor,
      bondColorMode,
    }));
  }

  function setBondColor(bondColor: string) {
    onStyleChange((currentStyle) => ({
      ...currentStyle,
      bondColor,
    }));
  }

  function setColorScheme(value: string) {
    onStyleChange((currentStyle) => {
      if (value === CUSTOM_COLOR_SCHEME_VALUE) {
        const customColormap =
          currentStyle.customColormap ??
          createCustomColormapFromScheme(currentStyle.colorScheme);

        return {
          ...currentStyle,
          colorScheme: customColormap.baseColorScheme,
          colorSchemeMode: "custom",
          customColormap,
        };
      }

      return {
        ...currentStyle,
        colorScheme: value,
        colorSchemeMode: "preset",
        customColormap:
          currentStyle.customColormap &&
          hasCustomColormapChanges(currentStyle.customColormap)
            ? currentStyle.customColormap
            : null,
      };
    });
  }

  function setMaterialPreset(materialPreset: MaterialPresetId) {
    onStyleChange((currentStyle) => ({
      ...currentStyle,
      materialPreset,
    }));
  }

  function setFogEnabled(fogEnabled: boolean) {
    onStyleChange((currentStyle) => ({
      ...currentStyle,
      fogEnabled,
    }));
  }

  function setFogStart(fogStart: number) {
    onStyleChange((currentStyle) => ({
      ...currentStyle,
      fogStart: clampPercentValue(
        fogStart,
        STYLE_FOG_START_MIN,
        STYLE_FOG_START_MAX,
      ),
    }));
  }

  function setFogAmount(fogAmount: number) {
    onStyleChange((currentStyle) => ({
      ...currentStyle,
      fogAmount: clampPercentValue(
        fogAmount,
        STYLE_FOG_AMOUNT_MIN,
        STYLE_FOG_AMOUNT_MAX,
      ),
    }));
  }

  function setOpacity(key: keyof ComponentOpacityState, value: number) {
    onComponentOpacityChange?.((currentOpacity) => ({
      ...currentOpacity,
      [key]: clampOpacityValue(value, COMPONENT_OPACITY_MAX[key]),
    }));
  }

  const [resetFeedbackPhase, setResetFeedbackPhase] = useState<"a" | "b" | null>(null);
  const resetFeedbackTickRef = useRef(0);
  const resetFeedbackTimeoutRef = useRef<number | null>(null);
  const [fogResetFeedbackPhase, setFogResetFeedbackPhase] = useState<"a" | "b" | null>(null);
  const fogResetFeedbackTickRef = useRef(0);
  const fogResetFeedbackTimeoutRef = useRef<number | null>(null);
  const [opacityResetFeedbackPhase, setOpacityResetFeedbackPhase] = useState<"a" | "b" | null>(
    null,
  );
  const opacityResetFeedbackTickRef = useRef(0);
  const opacityResetFeedbackTimeoutRef = useRef<number | null>(null);
  const selectedMaterialPresetOption =
    MATERIAL_PRESET_OPTIONS.find((option) => option.value === style.materialPreset) ??
    MATERIAL_PRESET_OPTIONS[0];
  const selectedColorSchemeValue =
    style.colorSchemeMode === "custom" && style.customColormap
      ? CUSTOM_COLOR_SCHEME_VALUE
      : style.colorScheme;

  useEffect(
    () => () => {
      if (resetFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(resetFeedbackTimeoutRef.current);
      }
      if (fogResetFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(fogResetFeedbackTimeoutRef.current);
      }
      if (opacityResetFeedbackTimeoutRef.current !== null) {
        window.clearTimeout(opacityResetFeedbackTimeoutRef.current);
      }
    },
    [],
  );

  function handleResetOpacityClick() {
    onComponentOpacityChange?.(createDefaultComponentOpacity());

    if (opacityResetFeedbackTimeoutRef.current !== null) {
      window.clearTimeout(opacityResetFeedbackTimeoutRef.current);
    }

    opacityResetFeedbackTickRef.current += 1;
    setOpacityResetFeedbackPhase(
      opacityResetFeedbackTickRef.current % 2 === 0 ? "b" : "a",
    );
    opacityResetFeedbackTimeoutRef.current = window.setTimeout(() => {
      setOpacityResetFeedbackPhase(null);
      opacityResetFeedbackTimeoutRef.current = null;
    }, TOOL_ICON_BUTTON_FEEDBACK_ANIMATION_MS);
  }

  function handleResetScaleClick() {
    onStyleChange((currentStyle) => ({
      ...currentStyle,
      atomRadius: createDefaultStyle().atomRadius,
      bondThickness: createDefaultStyle().bondThickness,
    }));

    if (resetFeedbackTimeoutRef.current !== null) {
      window.clearTimeout(resetFeedbackTimeoutRef.current);
    }

    resetFeedbackTickRef.current += 1;
    setResetFeedbackPhase(resetFeedbackTickRef.current % 2 === 0 ? "b" : "a");
    resetFeedbackTimeoutRef.current = window.setTimeout(() => {
      setResetFeedbackPhase(null);
      resetFeedbackTimeoutRef.current = null;
    }, TOOL_ICON_BUTTON_FEEDBACK_ANIMATION_MS);
  }

  function handleResetFogClick() {
    onStyleChange((currentStyle) => ({
      ...currentStyle,
      fogAmount: createDefaultStyle().fogAmount,
      fogStart: createDefaultStyle().fogStart,
    }));

    if (fogResetFeedbackTimeoutRef.current !== null) {
      window.clearTimeout(fogResetFeedbackTimeoutRef.current);
    }

    fogResetFeedbackTickRef.current += 1;
    setFogResetFeedbackPhase(fogResetFeedbackTickRef.current % 2 === 0 ? "b" : "a");
    fogResetFeedbackTimeoutRef.current = window.setTimeout(() => {
      setFogResetFeedbackPhase(null);
      fogResetFeedbackTimeoutRef.current = null;
    }, TOOL_ICON_BUTTON_FEEDBACK_ANIMATION_MS);
  }

  return (
    <div className="flex flex-col gap-2.5">
      {componentOpacity && componentVisibility && onComponentOpacityChange ? (
        <>
          <section aria-labelledby="style-components-label">
            <div className="grid grid-cols-[1fr_2.35rem] items-center gap-2 px-1.5">
              <h2
                id="style-components-label"
                className={cn(COMMON_PANEL_SECTION_TITLE_TEXT_CLASS, "leading-tight text-muted-foreground")}
              >
                Objects opacity
              </h2>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Reset opacity"
                      className={cn(
                        TOOL_ICON_BUTTON_CLASS,
                        opacityResetFeedbackPhase === "a"
                          ? TOOL_ICON_BUTTON_RESET_FEEDBACK_A_CLASS
                          : null,
                        opacityResetFeedbackPhase === "b"
                          ? TOOL_ICON_BUTTON_RESET_FEEDBACK_B_CLASS
                          : null,
                      )}
                      onClick={handleResetOpacityClick}
                    >
                      <RotateCcw aria-hidden="true" />
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">Reset opacity</TooltipContent>
              </Tooltip>
            </div>

            <div className={cn("mt-1", COMMON_PANEL_ROW_STACK_CLASS)}>
              <ComponentOpacityRow
                disabled={!componentVisibility.atoms}
                label="Atoms"
                max={COMPONENT_OPACITY_MAX.atoms}
                value={componentOpacity.atoms}
                onOpacityChange={(value) => setOpacity("atoms", value)}
              />
              <ComponentOpacityRow
                disabled={!componentVisibility.bonds}
                label="Bonds"
                max={COMPONENT_OPACITY_MAX.bonds}
                value={componentOpacity.bonds}
                onOpacityChange={(value) => setOpacity("bonds", value)}
              />
              <ComponentOpacityRow
                disabled={!componentVisibility.unitCell}
                label="Unit cell"
                max={COMPONENT_OPACITY_MAX.unitCell}
                value={componentOpacity.unitCell}
                onOpacityChange={(value) => setOpacity("unitCell", value)}
              />
              <ComponentOpacityRow
                disabled={!hasPolyhedra || !componentVisibility.polyhedra}
                label="Polyhedra"
                max={COMPONENT_OPACITY_MAX.polyhedra}
                value={componentOpacity.polyhedra}
                onOpacityChange={(value) => setOpacity("polyhedra", value)}
              />
              <ComponentOpacityRow
                disabled={!style.latticePlane}
                label="Lattice plane"
                max={100}
                value={style.latticePlane?.opacityPercent ?? LATTICE_PLANE_OPACITY_PERCENT}
                onOpacityChange={(value) =>
                  onStyleChange((currentStyle) =>
                    currentStyle.latticePlane
                      ? {
                          ...currentStyle,
                          latticePlane: {
                            ...currentStyle.latticePlane,
                            opacityPercent: value,
                          },
                        }
                      : currentStyle,
                  )
                }
              />
            </div>
          </section>

          <Separator />
        </>
      ) : null}

      <section aria-labelledby="style-size-label">
        <div className="grid grid-cols-[minmax(5.5rem,1fr)_6.75rem_2.35rem] items-center gap-2 px-1.5">
          <h2
            id="style-size-label"
            className={cn(COMMON_PANEL_SECTION_TITLE_TEXT_CLASS, "leading-tight text-muted-foreground")}
          >
            Size
          </h2>
          <span aria-hidden="true" />
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Reset scale"
                  className={cn(
                    TOOL_ICON_BUTTON_CLASS,
                    resetFeedbackPhase === "a" ? TOOL_ICON_BUTTON_RESET_FEEDBACK_A_CLASS : null,
                    resetFeedbackPhase === "b" ? TOOL_ICON_BUTTON_RESET_FEEDBACK_B_CLASS : null,
                  )}
                  onClick={handleResetScaleClick}
                >
                  <RotateCcw aria-hidden="true" />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">Reset scale</TooltipContent>
          </Tooltip>
        </div>

        <div className={cn("mt-1", COMMON_PANEL_ROW_STACK_CLASS)}>
          <PercentSliderRow
            accessibleLabel="Atom"
            label={(
              <AtomRadiusModelPopover
                value={style.atomRadiusModel}
                onValueChange={setAtomRadiusModel}
              />
            )}
            max={STYLE_SCALE_MAX.atomRadius}
            min={STYLE_SCALE_MIN.atomRadius}
            value={style.atomRadius}
            onValueChange={(value) => setStyleScale("atomRadius", value)}
          />
          <PercentSliderRow
            accessibleLabel="Bond"
            label="Bond"
            max={STYLE_SCALE_MAX.bondThickness}
            min={STYLE_SCALE_MIN.bondThickness}
            value={style.bondThickness}
            onValueChange={(value) => setStyleScale("bondThickness", value)}
          />
        </div>
      </section>

      <Separator />

      <section aria-labelledby="style-fog-label">
        <div className="grid grid-cols-[minmax(5.5rem,1fr)_6.75rem_2.35rem] items-center gap-2 px-1.5">
          <div className="col-span-2 flex min-w-0 items-center gap-2">
            <h2
              id="style-fog-label"
              className={cn(COMMON_PANEL_SECTION_TITLE_TEXT_CLASS, "whitespace-nowrap leading-tight text-muted-foreground")}
            >
              Depth cueing
            </h2>
            <Switch
              checked={style.fogEnabled}
              aria-label="Depth cueing"
              className="h-4 w-7 p-0.5"
              thumbClassName="size-3 data-[state=checked]:translate-x-3"
              onCheckedChange={setFogEnabled}
            />
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="flex justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Reset depth cueing"
                  className={cn(
                    TOOL_ICON_BUTTON_CLASS,
                    fogResetFeedbackPhase === "a"
                      ? TOOL_ICON_BUTTON_RESET_FEEDBACK_A_CLASS
                      : null,
                    fogResetFeedbackPhase === "b"
                      ? TOOL_ICON_BUTTON_RESET_FEEDBACK_B_CLASS
                      : null,
                  )}
                  onClick={handleResetFogClick}
                >
                  <RotateCcw aria-hidden="true" />
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">Reset depth cueing</TooltipContent>
          </Tooltip>
        </div>
        <div className={cn("mt-1", COMMON_PANEL_ROW_STACK_CLASS, style.fogEnabled ? null : "opacity-55")}>
          <PercentSliderRow
            accessibleLabel="Depth cueing"
            allowZero
            disabled={!style.fogEnabled}
            label="Start"
            max={STYLE_FOG_START_MAX}
            min={STYLE_FOG_START_MIN}
            value={style.fogStart}
            valueLabel="start"
            onValueChange={setFogStart}
          />
          <PercentSliderRow
            accessibleLabel="Depth cueing"
            allowZero
            disabled={!style.fogEnabled}
            label="Amount"
            max={STYLE_FOG_AMOUNT_MAX}
            min={STYLE_FOG_AMOUNT_MIN}
            value={style.fogAmount}
            valueLabel="amount"
            onValueChange={setFogAmount}
          />
          <div
            className={cn(
              "grid min-h-7 grid-cols-[minmax(5.5rem,1fr)_auto] items-center gap-2 rounded-md px-1.5",
              COMMON_PANEL_BODY_TEXT_CLASS,
            )}
          >
            <span
              className="min-w-0 truncate leading-tight"
              title="Also fade the unit cell lines with distance, not just atoms and bonds."
            >
              Affects unit cell
            </span>
            <Switch
              checked={style.fogAffectsUnitCell}
              disabled={!style.fogEnabled}
              aria-label="Apply depth cueing to unit cell"
              className="h-4 w-7 p-0.5"
              thumbClassName="size-3 data-[state=checked]:translate-x-3"
              onCheckedChange={(checked) =>
                onStyleChange((currentStyle) => ({
                  ...currentStyle,
                  fogAffectsUnitCell: checked,
                }))
              }
            />
          </div>
        </div>
      </section>

      <Separator />

      <div className="flex flex-col gap-0.5">
        {vectorProperties.length > 0 ? (
          <div
            className={cn(
              "grid min-h-8 grid-cols-[minmax(5.5rem,1fr)_9.5rem] items-center gap-2 rounded-md px-1.5",
              COMMON_PANEL_BODY_TEXT_CLASS,
            )}
          >
            <span className="min-w-0 truncate leading-tight">Vectors</span>
            <Select
              value={style.vectorGlyphProperty ?? "none"}
              onValueChange={(value) =>
                onStyleChange((currentStyle) => ({
                  ...currentStyle,
                  vectorGlyphProperty: value === "none" ? null : value,
                }))
              }
            >
              <SelectTrigger
                size="sm"
                aria-label="Site vector glyphs"
                className={cn("!h-6 w-full !px-2 !py-0", COMMON_PANEL_BODY_TEXT_CLASS)}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className="!bg-background !text-foreground">
                <SelectGroup>
                  <SelectItem value="none" className="text-xs">
                    None
                  </SelectItem>
                  {vectorProperties.map((property) => (
                    <SelectItem key={property} value={property} className="text-xs">
                      {property}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        ) : null}
        {vectorProperties.length > 0 && style.vectorGlyphProperty ? (
          <PercentSliderRow
            accessibleLabel="Vector glyph"
            label="Vector scale"
            max={VECTOR_GLYPH_SCALE_MAX}
            min={VECTOR_GLYPH_SCALE_MIN}
            onValueChange={(value) =>
              onStyleChange((currentStyle) => ({
                ...currentStyle,
                vectorGlyphScale: clampPercentValue(
                  value,
                  VECTOR_GLYPH_SCALE_MIN,
                  VECTOR_GLYPH_SCALE_MAX,
                ),
              }))
            }
            value={style.vectorGlyphScale}
            valueLabel="scale"
          />
        ) : null}
        <div
          className={cn(
            "grid min-h-8 grid-cols-[minmax(5.5rem,1fr)_9.5rem] items-center gap-2 rounded-md px-1.5",
            COMMON_PANEL_BODY_TEXT_CLASS,
          )}
        >
          <span className="min-w-0 truncate leading-tight">Material</span>
          <Select
            value={style.materialPreset}
            onValueChange={(value) => setMaterialPreset(value)}
          >
            <SelectTrigger
              size="sm"
              aria-label="Material"
              className={cn("!h-6 w-full !px-2 !py-0", COMMON_PANEL_BODY_TEXT_CLASS)}
            >
              {selectedMaterialPresetOption ? (
                <MaterialPresetOptionLabel
                  label={selectedMaterialPresetOption.label}
                  value={selectedMaterialPresetOption.value}
                />
              ) : null}
            </SelectTrigger>
            <SelectContent
              position="popper"
              className="!bg-background !text-foreground"
            >
              <SelectGroup>
                {MATERIAL_PRESET_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    textValue={option.label}
                    className={cn(
                      "min-h-6 justify-start py-0.5 *:[span]:last:min-w-0 *:[span]:last:flex-1 *:[span]:last:justify-start",
                      COMMON_PANEL_BODY_TEXT_CLASS,
                    )}
                  >
                    <MaterialPresetOptionLabel
                      label={option.label}
                      value={option.value}
                    />
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <PercentSliderRow
          accessibleLabel="Light"
          label="Light strength"
          max={Math.round(MAX_LIGHT_STRENGTH * 100)}
          min={Math.round(MIN_LIGHT_STRENGTH * 100)}
          onValueChange={(value) =>
            onLightStrengthChange?.(clampLightStrength(value / 100))
          }
          value={Math.round((lightStrength ?? 1) * 100)}
          valueLabel="strength"
        />

        <div
          className={cn(
            "grid min-h-8 grid-cols-[minmax(5.5rem,1fr)_9.5rem] items-center gap-2 rounded-md px-1.5",
            COMMON_PANEL_BODY_TEXT_CLASS,
          )}
        >
          <span className="flex min-w-0 items-center gap-1.5 leading-tight">
            <span className="min-w-0 truncate">Bond style</span>
            {style.bondColorMode === "unicolor" ? (
              <BondColorPicker
                value={style.bondColor}
                onValueChange={setBondColor}
              />
            ) : null}
          </span>
          <Select
            value={style.bondColorMode}
            onValueChange={(value) => setBondColorMode(value as BondColorMode)}
          >
            <SelectTrigger
              size="sm"
              aria-label="Bond style"
              className={cn("!h-6 w-full !px-2 !py-0", COMMON_PANEL_BODY_TEXT_CLASS)}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              position="popper"
              className="!bg-background !text-foreground"
            >
              <SelectGroup>
                {BOND_COLOR_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    textValue={option.label}
                    className={cn("min-h-6 py-0.5", COMMON_PANEL_BODY_TEXT_CLASS)}
                  >
                    <BondStyleOptionLabel
                      label={option.label}
                      unicolorColor={style.bondColor}
                      value={option.value}
                    />
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {unitCellLineStyle && onUnitCellLineStyleChange ? (
          <div
            className={cn(
              "grid min-h-8 grid-cols-[minmax(5.5rem,1fr)_9.5rem] items-center gap-2 rounded-md px-1.5",
              COMMON_PANEL_BODY_TEXT_CLASS,
            )}
          >
            <span className="min-w-0 truncate leading-tight">Cell line style</span>
            <Select
              value={unitCellLineStyle}
              onValueChange={(value) =>
                onUnitCellLineStyleChange(value as UnitCellLineStyle)
              }
            >
              <SelectTrigger
                size="sm"
                aria-label="Unit cell line style"
                className={cn("!h-6 w-full !px-2 !py-0", COMMON_PANEL_BODY_TEXT_CLASS)}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" className="!bg-background !text-foreground">
                <SelectGroup>
                  <SelectItem value="solid" className="text-xs">
                    Solid
                  </SelectItem>
                  <SelectItem value="dashed" className="text-xs">
                    Dashed
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div
          className={cn(
            "grid min-h-8 grid-cols-[minmax(5.5rem,1fr)_9.5rem] items-center gap-2 rounded-md px-1.5",
            COMMON_PANEL_BODY_TEXT_CLASS,
          )}
        >
          <span className="min-w-0 truncate leading-tight">Color scheme</span>
          <Select
            value={selectedColorSchemeValue}
            onValueChange={setColorScheme}
          >
            <SelectTrigger
              size="sm"
              aria-label="Color scheme"
              className={cn("!h-6 w-full !px-2 !py-0", COMMON_PANEL_BODY_TEXT_CLASS)}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              position="popper"
              className="!bg-background !text-foreground"
            >
              <SelectGroup>
                {COLOR_SCHEME_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    textValue={option.label}
                    className={cn("min-h-6 py-0.5", COMMON_PANEL_BODY_TEXT_CLASS)}
                  >
                    <ColorSchemeOptionLabel
                      label={option.label}
                      value={option.value}
                    />
                  </SelectItem>
                ))}
                <SelectItem
                  value={CUSTOM_COLOR_SCHEME_VALUE}
                  textValue="Custom"
                  className={cn("min-h-6 py-0.5", COMMON_PANEL_BODY_TEXT_CLASS)}
                >
                  <CustomColorSchemeOptionLabel />
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div
          className={cn(
            "grid min-h-8 grid-cols-[minmax(5.5rem,1fr)_auto] items-center gap-2 rounded-md px-1.5",
            COMMON_PANEL_BODY_TEXT_CLASS,
          )}
        >
          <span
            className="min-w-0 truncate leading-tight"
            title="Automatically shift the colors of elements that would look nearly identical in the selected color scheme."
          >
            Distinguish colors
          </span>
          <Switch
            checked={style.distinguishSimilarColors}
            disabled={style.colorSchemeMode === "custom"}
            aria-label="Distinguish similar colors"
            className="h-4 w-7 p-0.5"
            thumbClassName="size-3 data-[state=checked]:translate-x-3"
            onCheckedChange={(checked) =>
              onStyleChange((currentStyle) => ({
                ...currentStyle,
                distinguishSimilarColors: checked,
              }))
            }
          />
        </div>
      </div>

      {onCopyRenderStyle || onApplyRenderStyle ? (
        <>
          <Separator />
          <div className="mb-1 flex items-center gap-1.5 px-1.5">
            <span
              className={cn(COMMON_PANEL_FIELD_LABEL_TEXT_CLASS, "text-muted-foreground")}
              title="Save the current look as a reusable style file, or load one back. Style files also drive batch rendering (prc render --style)."
            >
              Style file
            </span>
            {onCopyRenderStyle ? (
              <CopyRenderStyleButton onCopyRenderStyle={onCopyRenderStyle} />
            ) : null}
            {onApplyRenderStyle ? (
              <ApplyRenderStyleButton onApplyRenderStyle={onApplyRenderStyle} />
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}

function AtomRadiusModelPopover({
  onValueChange,
  value,
}: {
  onValueChange: (value: AtomRadiusModel) => void;
  value: AtomRadiusModel;
}) {
  const [open, setOpen] = useState(false);
  const selectedOption = ATOM_RADIUS_MODEL_OPTIONS.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <span className="inline-flex min-w-0 items-center gap-1">
        <span className="min-w-0 truncate">Atom</span>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Atom radius model: ${selectedOption?.menuLabel ?? "Unknown"}`}
            aria-haspopup="listbox"
            className={cn(
              TOOL_ICON_BUTTON_CLASS,
              "size-5 rounded-[7px] border-input [&_svg]:size-3",
            )}
          >
            <ChevronDown aria-hidden="true" />
          </Button>
        </PopoverTrigger>
      </span>
      <PopoverContent
        align="start"
        className="w-40"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <div
          className={cn(
            "px-2 pb-1 pt-1.5 leading-none text-muted-foreground",
            COMMON_PANEL_BODY_TEXT_CLASS,
          )}
        >
          Atom radius model
        </div>
        <div role="listbox" aria-label="Atom radius model" className="grid gap-0.5">
          {ATOM_RADIUS_MODEL_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={cn(
                "flex h-7 w-full items-center gap-2 rounded-sm px-2 text-left outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground",
                COMMON_PANEL_BODY_TEXT_CLASS,
                option.value === value
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-foreground",
              )}
              onClick={() => {
                onValueChange(option.value);
                setOpen(false);
              }}
            >
              <Check
                aria-hidden="true"
                className={cn(
                  "size-3 shrink-0",
                  option.value === value ? "opacity-100" : "opacity-0",
                )}
              />
              <span className="min-w-0 truncate">{option.menuLabel}</span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function MaterialPresetOptionLabel({
  label,
  value,
}: {
  label: string;
  value: MaterialPresetId;
}) {
  return (
    <span className="flex w-full min-w-0 items-center justify-start gap-2 text-left">
      <MaterialPresetToken3D presetId={value} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </span>
  );
}

function BondStyleOptionLabel({
  label,
  unicolorColor,
  value,
}: {
  label: string;
  unicolorColor: string;
  value: BondColorMode;
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <span
        aria-hidden="true"
        className="h-3 w-6 shrink-0 rounded-full border border-border"
        style={bondStyleTokenStyle(value, unicolorColor)}
      />
      <span className="min-w-0 truncate">{label}</span>
    </span>
  );
}

function bondStyleTokenStyle(
  value: BondColorMode,
  unicolorColor: string,
): CSSProperties | undefined {
  if (value === "unicolor") {
    return { background: nativeColorValue(unicolorColor) };
  }
  if (value === "bicolor") {
    return BY_ATOM_TOKEN_STYLE;
  }
  return undefined;
}

function BondColorPicker({
  onValueChange,
  value,
}: {
  onValueChange: (value: string) => void;
  value: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const nativeValue = nativeColorValue(value);

  function handleOpenPicker() {
    const input = inputRef.current;

    if (!input) {
      return;
    }

    try {
      if (typeof input.showPicker === "function") {
        input.showPicker();
        return;
      }
    } catch {
      // Fall through to the click fallback for browsers that expose but reject showPicker.
    }

    input.click();
  }

  return (
    <span className="relative inline-flex size-[18px] shrink-0">
      <button
        type="button"
        aria-label="Bond color"
        className="inline-flex size-[18px] shrink-0 items-center justify-center rounded-md bg-transparent p-0 outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        onClick={handleOpenPicker}
      >
        <span
          aria-hidden="true"
          className="size-[18px] rounded-md border border-foreground/5 shadow-[0_0_0_1px_rgba(40,40,40,0.015),0_1px_1px_rgba(40,40,40,0.03)]"
          style={{ background: nativeValue }}
        />
      </button>
      <input
        ref={inputRef}
        type="color"
        aria-label="Bond color value"
        tabIndex={-1}
        value={nativeValue}
        className="pointer-events-none absolute size-px opacity-0"
        onChange={(event) => onValueChange(event.target.value)}
      />
    </span>
  );
}

function nativeColorValue(value: string) {
  if (NATIVE_COLOR_VALUE_PATTERN.test(value)) {
    return value.toLowerCase();
  }
  return DEFAULT_BOND_COLOR;
}

function ColorSchemeOptionLabel({
  label,
  value,
}: {
  label: string;
  value: ColorScheme;
}) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <span
        aria-hidden="true"
        className="h-3 w-6 shrink-0 rounded-full border border-border"
        style={colorSchemeTokenStyle(value)}
      />
      <span className="min-w-0 truncate">{label}</span>
    </span>
  );
}

function CustomColorSchemeOptionLabel() {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <span
        aria-hidden="true"
        className="h-3 w-6 shrink-0 rounded-full border border-border"
        style={CUSTOM_COLOR_SCHEME_TOKEN_STYLE}
      />
      <span className="min-w-0 truncate">Custom</span>
    </span>
  );
}

function ComponentOpacityRow({
  disabled = false,
  label,
  max,
  onOpacityChange,
  value,
}: {
  disabled?: boolean;
  label: string;
  max: number;
  onOpacityChange: (opacity: number) => void;
  value: number;
}) {
  const [opacityText, setOpacityText] = useState(formatOpacityValue(value));
  const sliderBlur = useAutoBlurSlider();
  const sliderPosition = max > 0 ? value / max : 0;
  const sliderStyle = {
    "--opacity-slider-position": `${Math.min(100, Math.max(0, sliderPosition * 100))}%`,
  } as CSSProperties;
  const inputDisabled = disabled;

  useEffect(() => {
    setOpacityText(formatOpacityValue(value));
  }, [value]);

  function handleOpacityTextChange(nextText: string) {
    setOpacityText(nextText);
    const nextOpacity = parseOpacityInput(nextText);
    if (nextOpacity !== null && nextOpacity >= 0 && nextOpacity <= max) {
      onOpacityChange(nextOpacity);
    }
  }

  function commitOpacityText() {
    const nextOpacity = parseOpacityInput(opacityText);
    if (nextOpacity === null) {
      setOpacityText(formatOpacityValue(value));
      return;
    }

    const clampedOpacity = clampOpacityValue(nextOpacity, max);
    setOpacityText(formatOpacityValue(clampedOpacity));
    onOpacityChange(clampedOpacity);
  }

  function handleOpacityKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.currentTarget.blur();
      commitOpacityText();
      return;
    }

    if (event.key === "Escape") {
      setOpacityText(formatOpacityValue(value));
      event.currentTarget.blur();
      return;
    }

    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      const direction = event.key === "ArrowUp" ? 1 : -1;
      onOpacityChange(clampOpacityValue(value + direction, max));
    }
  }

  return (
    <div
      className={cn(
        "grid h-7 min-w-0 grid-cols-[minmax(5.5rem,1fr)_6.75rem_2.35rem] items-center gap-2 rounded-md px-1.5 transition-colors",
        COMMON_PANEL_BODY_TEXT_CLASS,
        disabled ? "text-muted-foreground/55" : "hover:bg-accent/60",
      )}
    >
      <span className={cn("min-w-0 truncate leading-tight", disabled ? "text-muted-foreground/60" : null)}>
        {label}
      </span>

      <div
        className="opacity-slider-shell relative mr-3 h-5"
        data-disabled={inputDisabled ? "true" : "false"}
        style={sliderStyle}
      >
        <input
          type="range"
          min={0}
          max={max}
          step={1}
          value={value}
          disabled={inputDisabled}
          aria-label={`${label} opacity`}
          aria-valuetext={`${formatOpacityValue(value)}%`}
          className="opacity-slider absolute inset-0 z-10 h-full w-full"
          ref={sliderBlur.ref}
          onChange={(event) =>
            onOpacityChange(snapSliderOpacityValue(Number(event.target.value), max))
          }
          onMouseDown={sliderBlur.handlePointerDown}
          onMouseUp={sliderBlur.handlePointerEnd}
          onPointerCancel={sliderBlur.handlePointerEnd}
          onPointerDown={sliderBlur.handlePointerDown}
          onPointerUp={sliderBlur.handlePointerEnd}
        />
        <span aria-hidden="true" className="opacity-slider-track pointer-events-none" />
        <span aria-hidden="true" className="opacity-slider-fill pointer-events-none" />
        <span aria-hidden="true" className="opacity-slider-thumb pointer-events-none" />
      </div>

      <label
        className="opacity-value-control group flex h-[22px] items-baseline justify-center gap-0 rounded-md border px-0.5 transition-[background-color,border-color,box-shadow] duration-150"
        data-disabled={inputDisabled ? "true" : "false"}
      >
        <span className="sr-only">{label} opacity value</span>
        <input
          type="text"
          inputMode="numeric"
          value={opacityText}
          disabled={inputDisabled}
          aria-label={`${label} opacity value`}
          className="opacity-value-input h-full w-[1.35rem] border-0 bg-transparent px-0 text-center font-mono text-2xs leading-none tabular-nums outline-none"
          onBlur={commitOpacityText}
          onChange={(event) => handleOpacityTextChange(event.target.value)}
          onKeyDown={handleOpacityKeyDown}
        />
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none font-mono text-2xs font-normal leading-none text-muted-foreground",
            inputDisabled ? "text-muted-foreground/60" : null,
          )}
        >
          %
        </span>
      </label>
    </div>
  );
}

function ApplyRenderStyleButton({
  onApplyRenderStyle,
}: {
  onApplyRenderStyle: (file: File) => Promise<void>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>
          <input
            ref={fileInputRef}
            accept=".json,application/json"
            aria-label="Render style JSON file"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) {
                void onApplyRenderStyle(file);
              }
            }}
            tabIndex={-1}
            type="file"
          />
          <Button
            size="sm"
            variant="outline"
            aria-label="Apply a render style JSON file"
            className="h-6 gap-1 rounded-full px-2 text-2xs [&_svg]:size-3"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileUp data-icon="inline-start" aria-hidden="true" />
            Load
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top">
        Apply a style JSON (from the Copy button or `prc render --style`)
      </TooltipContent>
    </Tooltip>
  );
}

function CopyRenderStyleButton({
  onCopyRenderStyle,
}: {
  onCopyRenderStyle: () => Promise<boolean>;
}) {
  const [copied, setCopied] = useState(false);
  const copiedTimeoutRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (copiedTimeoutRef.current !== null) {
        window.clearTimeout(copiedTimeoutRef.current);
      }
    },
    [],
  );

  async function handleClick() {
    const didCopy = await onCopyRenderStyle();
    if (!didCopy) {
      return;
    }

    setCopied(true);
    if (copiedTimeoutRef.current !== null) {
      window.clearTimeout(copiedTimeoutRef.current);
    }
    copiedTimeoutRef.current = window.setTimeout(() => {
      copiedTimeoutRef.current = null;
      setCopied(false);
    }, 1600);
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          aria-label="Copy render style JSON"
          className="h-6 gap-1 rounded-full px-2 text-2xs [&_svg]:size-3"
          onClick={() => {
            void handleClick();
          }}
        >
          {copied ? (
            <Check data-icon="inline-start" aria-hidden="true" />
          ) : (
            <ClipboardCopy data-icon="inline-start" aria-hidden="true" />
          )}
          {copied ? "Copied" : "Copy"}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">
        Copy the current style as JSON for `prc render --style`
      </TooltipContent>
    </Tooltip>
  );
}
