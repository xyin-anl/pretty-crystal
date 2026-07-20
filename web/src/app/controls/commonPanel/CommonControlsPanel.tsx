import {
  ImageDown,
  Palette,
  View as DisplayIcon,
  type LucideIcon,
} from "lucide-react";
import {
  type CSSProperties,
  type Dispatch,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import type {
  AtomRadiusModel,
  BondAlgorithm,
  SupercellDimensions,
} from "../../../api/scene";
import type {
  ComponentOpacityState,
  ComponentVisibilityState,
  ExportProjectedSize,
  ExportSettingsState,
  MeshQuality,
  StyleState,
  UnitCellLineStyle,
} from "../../../model";
import type { AnimationExportFormat } from "../../hooks/useAnimationExport";
import { GLASS_SURFACE_CLASS } from "../../surface";
import { DisplayTabContent } from "./DisplayTab";
import { ExportTabContent } from "./ExportTab";
import { MaterialPresetTokenPreloadPool } from "./MaterialPresetToken3DLazy";
import { StyleTabContent } from "./StyleTab";

export type CommonPanelTab = "display" | "style" | "export";

interface TabIndicatorRect {
  left: number;
  width: number;
}

const COMMON_PANEL_TABS: {
  Icon: LucideIcon;
  label: string;
  value: CommonPanelTab;
}[] = [
  { Icon: DisplayIcon, label: "Display", value: "display" },
  { Icon: Palette, label: "Style", value: "style" },
  { Icon: ImageDown, label: "Export", value: "export" },
];

export function CommonControlsPanel({
  activeTab: targetActiveTab,
  componentOpacity,
  componentVisibility,
  exportError,
  exportProjectedSize,
  exportSettings,
  hasPolyhedra,
  isExporting,
  onComponentOpacityChange,
  onComponentVisibilityChange,
  onAtomRadiusModelChange,
  onActiveTabChange,
  animationExportProgress,
  onApplyRenderStyle,
  onCopyRenderStyle,
  onExport,
  onExportSeriesGif,
  onExportSettingsChange,
  onExportTurntableGif,
  onStyleChange,
  onSupercellChange,
  style,
  supercell,
  trajectoryFrameCount,
  vectorProperties,
  settings,
}: {
  activeTab: CommonPanelTab;
  componentOpacity: ComponentOpacityState;
  componentVisibility: ComponentVisibilityState;
  exportError: string | null;
  exportProjectedSize?: ExportProjectedSize;
  exportSettings: ExportSettingsState;
  hasPolyhedra: boolean;
  isExporting: boolean;
  onAtomRadiusModelChange: (atomRadiusModel: AtomRadiusModel) => void;
  onActiveTabChange?: (tab: CommonPanelTab) => void;
  onComponentOpacityChange: Dispatch<SetStateAction<ComponentOpacityState>>;
  onComponentVisibilityChange: Dispatch<SetStateAction<ComponentVisibilityState>>;
  animationExportProgress?: { frameCount: number; renderedFrames: number } | null;
  onApplyRenderStyle?: (file: File) => Promise<void>;
  onCopyRenderStyle?: () => Promise<boolean>;
  onExport: () => void;
  onExportSeriesGif?: (fps: number, format: AnimationExportFormat) => void;
  onExportSettingsChange: (settings: ExportSettingsState) => void;
  onExportTurntableGif?: (frameCount: number, fps: number, format: AnimationExportFormat) => void;
  onStyleChange: Dispatch<SetStateAction<StyleState>>;
  onSupercellChange?: (supercell: SupercellDimensions) => void;
  style: StyleState;
  supercell?: SupercellDimensions;
  trajectoryFrameCount?: number;
  vectorProperties?: string[];
  settings?: {
    bondAlgorithm: BondAlgorithm;
    isSceneLoading: boolean;
    lightStrength: number;
    onBondAlgorithmChange: (bondAlgorithm: BondAlgorithm) => void;
    onLightStrengthChange: (lightStrength: number) => void;
    onPreviewMeshQualityChange: (meshQuality: MeshQuality) => void;
    onShowCrystalAxisLabelsChange: (showCrystalAxisLabels: boolean) => void;
    onUnitCellLineStyleChange: (lineStyle: UnitCellLineStyle) => void;
    previewMeshQuality: MeshQuality;
    showCrystalAxisLabels: boolean;
    unitCellLineStyle: UnitCellLineStyle;
  };
}) {
  const tabTriggerRefs = useRef<Record<CommonPanelTab, HTMLButtonElement | null>>({
    display: null,
    export: null,
    style: null,
  });
  const contentRef = useRef<HTMLDivElement>(null);
  const [tabIndicatorRect, setTabIndicatorRect] = useState<TabIndicatorRect | null>(null);
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  const activeTab = targetActiveTab;
  const contentStyle = contentHeight === null
    ? undefined
    : ({ height: `${contentHeight}px` } as CSSProperties);
  const tabListStyle = {
    gridTemplateColumns: COMMON_PANEL_TABS.map(({ value }) =>
      value === activeTab ? "2fr" : "0.9fr",
    ).join(" "),
  } as const;

  useEffect(() => {
    const updateIndicatorRect = () => {
      const activeTrigger = tabTriggerRefs.current[activeTab];
      if (!activeTrigger) {
        return;
      }

      setTabIndicatorRect({
        left: activeTrigger.offsetLeft,
        width: activeTrigger.offsetWidth,
      });
    };

    updateIndicatorRect();
    const animationFrame = window.requestAnimationFrame(updateIndicatorRect);

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateIndicatorRect);
      return () => {
        window.cancelAnimationFrame(animationFrame);
        window.removeEventListener("resize", updateIndicatorRect);
      };
    }

    const resizeObserver = new ResizeObserver(updateIndicatorRect);
    for (const trigger of Object.values(tabTriggerRefs.current)) {
      if (trigger) {
        resizeObserver.observe(trigger);
      }
    }

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
    };
  }, [activeTab]);

  useEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement) {
      return;
    }

    function updateContentHeight() {
      const activeContent = contentElement?.querySelector<HTMLElement>(
        "[data-slot='tabs-content'][data-state='active']",
      );
      const nextHeight = activeContent?.scrollHeight ?? 0;

      setContentHeight(nextHeight > 0 ? nextHeight : null);
    }

    let resizeObserver: ResizeObserver | null = null;
    const animationFrame = window.requestAnimationFrame(() => {
      updateContentHeight();

      if (typeof ResizeObserver === "undefined") {
        return;
      }

      resizeObserver = new ResizeObserver(updateContentHeight);
      const activeContent = contentElement.querySelector<HTMLElement>(
        "[data-slot='tabs-content'][data-state='active']",
      );
      if (activeContent) {
        resizeObserver.observe(activeContent);
      }
    });
    window.addEventListener("resize", updateContentHeight);

    if (typeof ResizeObserver === "undefined") {
      return () => {
        window.cancelAnimationFrame(animationFrame);
        window.removeEventListener("resize", updateContentHeight);
      };
    }

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", updateContentHeight);
      resizeObserver?.disconnect();
    };
  }, [activeTab]);

  function handleTabValueChange(value: string) {
    const nextTab = value as CommonPanelTab;
    if (nextTab === activeTab) {
      return;
    }

    const currentHeight = contentRef.current?.getBoundingClientRect().height;
    if (currentHeight && currentHeight > 0) {
      setContentHeight(currentHeight);
    }

    onActiveTabChange?.(nextTab);
  }

  return (
    <TooltipProvider>
      <aside
        aria-label="Common controls"
        className={cn(
          "rounded-xl border px-3 py-2 shadow-xl shadow-foreground/10",
          GLASS_SURFACE_CLASS,
        )}
      >
        <MaterialPresetTokenPreloadPool />
        <Tabs
          value={activeTab}
          onValueChange={handleTabValueChange}
        >
          <TabsList
            className="relative grid !h-8 w-full overflow-hidden rounded-[10px] bg-muted/70 p-1 transition-[grid-template-columns] duration-[260ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
            style={tabListStyle}
          >
            {tabIndicatorRect ? (
              <span
                aria-hidden="true"
                data-slot="common-controls-active-indicator"
                className="pointer-events-none absolute inset-y-1 left-0 z-0 rounded-md bg-background shadow-sm transition-[transform,width] duration-[260ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
                style={{
                  transform: `translateX(${tabIndicatorRect.left}px)`,
                  width: tabIndicatorRect.width,
                }}
              />
            ) : null}
            {COMMON_PANEL_TABS.map(({ Icon, label, value }) => {
              const isActive = value === activeTab;
              const trigger = (
                <TabsTrigger
                  ref={(node) => {
                    tabTriggerRefs.current[value] = node;
                  }}
                  key={value}
                  value={value}
                  aria-label={label}
                  className={cn(
                    "z-10 !h-6 min-w-0 rounded-md !bg-transparent text-xs !shadow-none transition-[color,padding] duration-[260ms] ease-[cubic-bezier(0.16,1,0.3,1)] data-[state=active]:!bg-transparent data-[state=active]:!shadow-none motion-reduce:transition-none [&_svg]:size-3.5",
                    isActive ? "px-2 text-foreground" : "px-0.5 text-muted-foreground",
                  )}
                >
                  <Icon aria-hidden="true" />
                  <span
                    data-slot="common-controls-tab-label"
                    data-active={isActive ? "true" : "false"}
                    className={cn(
                      "overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-[260ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none",
                      isActive ? "max-w-16 opacity-100" : "max-w-0 opacity-0",
                    )}
                  >
                    {label}
                  </span>
                </TabsTrigger>
              );

              if (isActive) {
                return trigger;
              }

              return (
                <Tooltip key={value}>
                  <TooltipTrigger asChild>{trigger}</TooltipTrigger>
                  <TooltipContent side="top">{label}</TooltipContent>
                </Tooltip>
              );
            })}
          </TabsList>

          <div
            ref={contentRef}
            data-slot="common-controls-content"
            className="relative overflow-hidden transition-[height] duration-[260ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            style={contentStyle}
          >
            <TabsContent value="display">
              <DisplayTabContent
                bondAlgorithm={settings?.bondAlgorithm}
                hasPolyhedra={hasPolyhedra}
                isSceneLoading={settings?.isSceneLoading}
                onBondAlgorithmChange={settings?.onBondAlgorithmChange}
                onPreviewMeshQualityChange={settings?.onPreviewMeshQualityChange}
                onShowCrystalAxisLabelsChange={settings?.onShowCrystalAxisLabelsChange}
                onStyleChange={onStyleChange}
                onSupercellChange={onSupercellChange}
                previewMeshQuality={settings?.previewMeshQuality}
                showCrystalAxisLabels={settings?.showCrystalAxisLabels}
                style={style}
                supercell={supercell}
                visibility={componentVisibility}
                onVisibilityChange={onComponentVisibilityChange}
              />
            </TabsContent>
            <TabsContent value="style">
              <StyleTabContent
                componentOpacity={componentOpacity}
                componentVisibility={componentVisibility}
                hasPolyhedra={hasPolyhedra}
                lightStrength={settings?.lightStrength}
                onApplyRenderStyle={onApplyRenderStyle}
                onAtomRadiusModelChange={onAtomRadiusModelChange}
                onComponentOpacityChange={onComponentOpacityChange}
                onCopyRenderStyle={onCopyRenderStyle}
                onLightStrengthChange={settings?.onLightStrengthChange}
                onStyleChange={onStyleChange}
                onUnitCellLineStyleChange={settings?.onUnitCellLineStyleChange}
                style={style}
                unitCellLineStyle={settings?.unitCellLineStyle}
                vectorProperties={vectorProperties}
              />
            </TabsContent>
            <TabsContent value="export" className="pt-1.5">
              <ExportTabContent
                animationExportProgress={animationExportProgress}
                error={exportError}
                exportProjectedSize={exportProjectedSize}
                isExporting={isExporting}
                onExport={onExport}
                onExportSeriesGif={onExportSeriesGif}
                onExportTurntableGif={onExportTurntableGif}
                onSettingsChange={onExportSettingsChange}
                settings={exportSettings}
                trajectoryFrameCount={trajectoryFrameCount}
              />
            </TabsContent>
          </div>
        </Tabs>
      </aside>
    </TooltipProvider>
  );
}
