import { AlertTriangleIcon, FolderOpen, ImageDown, RefreshCw, RotateCcw } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { AtomInspectorCard } from "./AtomInspectorCard";
import { CrystalMark } from "./CrystalMark";
import type { SceneSpec } from "../api/scene";
import { inspectedAtomInfoForId } from "./atomInspector";
import { LatticeScene } from "../scene/LatticeSceneLazy";
import { previewSafeAreaForViewport } from "../scene/sceneLayout";
import { ATOM_HIGHLIGHT_PULSE_MS } from "../scene/atomHighlight";
import { OrientationGizmo } from "../scene/OrientationGizmoLazy";
import {
  CommonControlsPanel,
  type CommonPanelTab,
} from "./controls/CommonControlsPanel";
import { ViewControlRail } from "./controls/ViewControlRail";
import { createCameraInteractionStore } from "./cameraInteractionStore";
import { deriveElementLegendEntries } from "./elementLegend";
import { renderStyleSettingsJson } from "../export/renderStyleExport";
import { useAnimationExport } from "./hooks/useAnimationExport";
import { useFigureExportController } from "./hooks/useFigureExportController";
import { useGlobalShortcuts } from "./hooks/useGlobalShortcuts";
import { useLockedInteractionFeedback } from "./hooks/useLockedInteractionFeedback";
import { usePreviewCameraCommands } from "./hooks/usePreviewCameraCommands";
import { useStructurePreview } from "./hooks/useStructurePreview";
import { ElementLegend } from "./legend/ElementLegend";
import { PxrdPanel } from "./pxrd/PxrdPanel";
import { TrajectoryBar } from "./trajectory/TrajectoryBar";
import {
  TRAJECTORY_DATA_PANEL_HEIGHT,
  TrajectoryDataPanel,
} from "./trajectory/TrajectoryDataPanel";
import {
  orientationGizmoContainerStyle,
  orientationGizmoSizeForViewport,
  useViewportSize,
} from "./layout/overlayLayout";
import { StructureSummaryCard } from "./panels/StructureSummaryCard";
import { ShortcutSheet } from "./ShortcutSheet";
import {
  applyStylePreferences,
  clearUserPreferences,
  createDefaultComponentOpacity,
  createDefaultComponentVisibility,
  createDefaultStyle,
  loadUserPreferences,
  saveUserPreferences,
  LATTICE_PLANE_COLOR,
  baseColorSchemeForStyle,
  DEFAULT_SHOW_CRYSTAL_AXIS_LABELS,
  DEFAULT_UNIT_CELL_LINE_STYLE,
  createCustomColormapFromScheme,
  defaultPreviewMeshQualityForScene,
  elementColorOverridesForStyle,
  type MeshQuality,
  type UnitCellLineStyle,
  hasPolyhedra,
  previewSafeAreaForInspector,
  sceneOffsetXForInspector,
  visibleSceneForComponents,
} from "../model";

interface ResetLoadedPreviewOptions {
  preserveActiveCommonPanelTab?: boolean;
  preserveInspectorOpen?: boolean;
  resetPreferences?: boolean;
}

const SAFE_AREA_ANIMATION_MS = 180;

/** Eases a numeric value toward its target so layout-driven camera refits
 * glide instead of jumping. Honors prefers-reduced-motion. */
function useAnimatedValue(target: number, durationMs: number): number {
  const [value, setValue] = useState(target);
  const valueRef = useRef(target);
  valueRef.current = value;

  useEffect(() => {
    if (valueRef.current === target) {
      return;
    }

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }

    const from = valueRef.current;
    const start = performance.now();
    let animationFrame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(from + (target - from) * eased);
      if (progress < 1) {
        animationFrame = requestAnimationFrame(tick);
      }
    };
    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [durationMs, target]);

  return value;
}

type ResetLoadedPreviewState = (
  nextScene: SceneSpec | null,
  options?: ResetLoadedPreviewOptions,
) => void;

export function App() {
  const [componentVisibility, setComponentVisibility] = useState(
    createDefaultComponentVisibility,
  );
  const [componentOpacity, setComponentOpacity] = useState(createDefaultComponentOpacity);
  const [style, setStyle] = useState(() =>
    applyStylePreferences(createDefaultStyle(), loadUserPreferences()),
  );
  const [previewMeshQuality, setPreviewMeshQuality] = useState<MeshQuality>(
    () => defaultPreviewMeshQualityForScene(null),
  );
  const [unitCellLineStyle, setUnitCellLineStyle] = useState<UnitCellLineStyle>(
    () => loadUserPreferences().unitCellLineStyle ?? DEFAULT_UNIT_CELL_LINE_STYLE,
  );
  const [showCrystalAxisLabels, setShowCrystalAxisLabels] = useState(
    () => loadUserPreferences().showCrystalAxisLabels ?? DEFAULT_SHOW_CRYSTAL_AXIS_LABELS,
  );
  const [inspectedAtomId, setInspectedAtomId] = useState<string | null>(null);
  const [pulseAtom, setPulseAtom] = useState<{ atomId: string; token: number } | null>(null);
  const [activeCommonPanelTab, setActiveCommonPanelTab] =
    useState<CommonPanelTab>("display");
  const [cameraInteractionStore] = useState(createCameraInteractionStore);
  const [isStructureSummaryCollapsed, setIsStructureSummaryCollapsed] = useState(true);
  // The PXRD panel stays mounted through the card's collapse animation so it
  // can shrink and fade with it instead of vanishing abruptly.
  const [isPxrdPanelMounted, setIsPxrdPanelMounted] = useState(false);
  const [isPxrdPanelVisible, setIsPxrdPanelVisible] = useState(false);
  const [isFileDragActive, setIsFileDragActive] = useState(false);
  const [isShortcutSheetOpen, setIsShortcutSheetOpen] = useState(false);
  const viewportSize = useViewportSize();
  // The docked PXRD panel lives outside the scrollable left column, so its
  // height has to track the summary card instead of relying on CSS insets.
  const summaryCardWrapperRef = useRef<HTMLDivElement>(null);
  const [summaryCardHeight, setSummaryCardHeight] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inspectedAtomIdRef = useRef<string | null>(null);
  const resetLoadedPreviewStateRef = useRef<ResetLoadedPreviewState>(() => {});
  const resetLoadedPreviewStateForPreview = useCallback<ResetLoadedPreviewState>(
    (nextScene, options) => {
      resetLoadedPreviewStateRef.current(nextScene, options);
    },
    [],
  );
  useEffect(() => {
    const element = summaryCardWrapperRef.current;
    if (!element || typeof ResizeObserver === "undefined") {
      return;
    }

    const updateHeight = () =>
      setSummaryCardHeight(element.getBoundingClientRect().height);
    updateHeight();
    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, []);
  const handlePreviewCleared = useCallback(() => {
    setInspectedAtomId(null);
    setPulseAtom(null);
    setIsStructureSummaryCollapsed(true);
  }, []);
  const handleBondAlgorithmSceneLoaded = useCallback((nextScene: SceneSpec) => {
    setInspectedAtomId(null);
    setPulseAtom(null);
    setPreviewMeshQuality(defaultPreviewMeshQualityForScene(nextScene));
  }, []);
  const {
    activeFrameIndex,
    bondAlgorithm,
    currentFile,
    errorMessage,
    errorSeverity,
    errorTitle,
    handleActiveFrameChange,
    handleBondAlgorithmChange,
    handleFileChange,
    loadStructureFiles,
    handleResetAllSettings,
    handleSupercellChange,
    handleTrajectoryAlignChange,
    isTrajectoryAligned,
    previewStatus,
    scene,
    selectedFileName,
    setErrorMessage,
    supercell,
    trajectoryFrames,
  } = useStructurePreview({
    onBondAlgorithmSceneLoaded: handleBondAlgorithmSceneLoaded,
    onPreviewCleared: handlePreviewCleared,
    resetLoadedPreviewState: resetLoadedPreviewStateForPreview,
  });
  const visibleScene = useMemo(
    () => visibleSceneForComponents(scene, componentVisibility),
    [componentVisibility, scene],
  );
  const inspectedAtomInfo = useMemo(
    () => inspectedAtomInfoForId(visibleScene, inspectedAtomId),
    [inspectedAtomId, visibleScene],
  );
  const hasVisibleScene = visibleScene !== null;
  const {
    cameraAnimatedCommandVersion,
    cameraCommandVersion,
    cameraControlsPanelState,
    cameraOrientationRef,
    cameraOrientationVersion,
    handleCameraCommandAnimationActiveChange,
    handleCameraControlsInteractionActiveChange,
    handleCameraOrientationChange,
    handleCameraPrimaryChange,
    handleCameraRollChange,
    handleCameraRollPreviewChange,
    handleCameraRollPreviewStart,
    handleCameraSecondaryChange,
    handleCameraStateChange,
    handleDragSensitivityChange,
    handleGizmoAxisClick,
    handleInteractionLockedChange,
    handleInteractionModeChange,
    handleLightStrengthChange,
    handleResetView,
    isCameraCommandAnimationActive,
    isCameraRollInteractionActive,
    orientationGizmoFrameRequestRef,
    requestOrientationGizmoFrame,
    resetCameraForScene,
    viewState,
  } = usePreviewCameraCommands({
    cameraInteractionStore,
    scene,
    visibleScene,
  });
  const {
    exportError,
    exportProjectedSize,
    exportSettings,
    handleExportFigure,
    handleExportSettingsChange,
    isExporting,
    resetExportState,
    setExportError,
    syncProjectedSizeForExportTab,
  } = useFigureExportController({
    cameraOrientationRef,
    componentOpacity,
    componentVisibility,
    lightStrength: viewState.lightStrength,
    scene,
    selectedFileName,
    showCrystalAxisLabels,
    style,
    unitCellLineStyle,
    visibleScene,
  });
  const {
    animationExportError,
    animationExportProgress,
    handleExportSeriesAnimation,
    handleExportTurntableAnimation,
  } = useAnimationExport({
    cameraOrientationRef,
    componentOpacity,
    componentVisibility,
    exportSettings,
    lightStrength: viewState.lightStrength,
    selectedFileName,
    style,
    trajectoryFrames,
    unitCellLineStyle,
    visibleScene,
  });

  useEffect(() => {
    if (animationExportError) {
      setErrorMessage(animationExportError);
    }
  }, [animationExportError, setErrorMessage]);

  const handleApplyRenderStyle = useCallback(
    async (file: File) => {
      if (!scene) {
        return;
      }

      try {
        const parsedSettings: unknown = JSON.parse(await file.text());
        const { parseHeadlessRenderPayload } = await import(
          "../headless/headlessRender"
        );
        const inputs = parseHeadlessRenderPayload({
          scene,
          settings: parsedSettings,
        });

        setStyle(inputs.style);
        setComponentOpacity(inputs.componentOpacity);
        setComponentVisibility(inputs.componentVisibility);
        handleExportSettingsChange(inputs.exportSettings);
        setUnitCellLineStyle(inputs.unitCellLineStyle);
        setShowCrystalAxisLabels(inputs.showCrystalAxisLabels);
        handleLightStrengthChange(inputs.lightStrength);

        if (inputs.cameraQuaternion) {
          const [{ stateWithPrimaryDirection }, { Quaternion }] = await Promise.all([
            import("../scene/crystalCamera"),
            import("three"),
          ]);
          handleCameraStateChange(
            stateWithPrimaryDirection(
              scene.cell.vectors,
              new Quaternion(...inputs.cameraQuaternion).normalize(),
              "outward",
            ),
          );
        } else if (inputs.orientation) {
          const { applyCrystalCameraRoll } = await import("../scene/crystalCamera");
          const orientationState =
            inputs.rollDegrees !== 0
              ? applyCrystalCameraRoll(
                  scene.cell.vectors,
                  inputs.orientation,
                  inputs.rollDegrees,
                )
              : inputs.orientation;
          handleCameraStateChange(orientationState);
        }
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? `Could not apply the style file: ${error.message}`
            : "Could not apply the style file.",
        );
      }
    },
    [
      handleCameraStateChange,
      handleExportSettingsChange,
      handleLightStrengthChange,
      scene,
      setErrorMessage,
    ],
  );

  const isStructureInfoExpanded = !isStructureSummaryCollapsed && scene !== null;
  useEffect(() => {
    if (isStructureInfoExpanded) {
      setIsPxrdPanelMounted(true);
      const frame = window.requestAnimationFrame(() => setIsPxrdPanelVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }

    setIsPxrdPanelVisible(false);
    const timeout = window.setTimeout(() => setIsPxrdPanelMounted(false), 340);
    return () => window.clearTimeout(timeout);
  }, [isStructureInfoExpanded]);

  const handleCopyRenderStyle = useCallback(async () => {
    try {
      const styleJson = renderStyleSettingsJson({
        cameraQuaternion: cameraOrientationRef.current,
        componentOpacity,
        componentVisibility,
        exportSettings,
        lightStrength: viewState.lightStrength,
        showCrystalAxisLabels,
        style,
        unitCellLineStyle,
      });
      await navigator.clipboard.writeText(styleJson);
      return true;
    } catch {
      setErrorMessage("Could not copy the render style to the clipboard.");
      return false;
    }
  }, [
    cameraOrientationRef,
    componentOpacity,
    componentVisibility,
    exportSettings,
    setErrorMessage,
    showCrystalAxisLabels,
    style,
    unitCellLineStyle,
    viewState.lightStrength,
  ]);
  const {
    handleSceneContextMenuCapture,
    handleScenePointerDownCapture,
    handleScenePointerEndCapture,
    handleScenePointerMoveCapture,
    handleSceneWheelCapture,
    lockedInteractionFeedbackCount,
    resetLockedInteractionFeedback,
    triggerLockedInteractionFeedback,
  } = useLockedInteractionFeedback({
    hasVisibleScene,
    interactionLocked: viewState.interactionLocked,
  });

  useEffect(() => {
    inspectedAtomIdRef.current = inspectedAtomId;
  }, [inspectedAtomId]);

  useEffect(() => {
    if (!pulseAtom) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setPulseAtom((currentPulseAtom) =>
        currentPulseAtom?.token === pulseAtom.token ? null : currentPulseAtom,
      );
    }, ATOM_HIGHLIGHT_PULSE_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [pulseAtom]);

  const resetLoadedPreviewState = useCallback(
    (
      nextScene: SceneSpec | null,
      options: ResetLoadedPreviewOptions = {},
    ) => {
      // "Reset all" wipes stored preferences back to factory defaults; loading
      // a new structure keeps the user's cross-session preferences.
      if (options.resetPreferences) {
        clearUserPreferences();
      }
      const preferences = options.resetPreferences ? {} : loadUserPreferences();
      setErrorMessage(null);
      resetExportState();
      setInspectedAtomId(null);
      setPulseAtom(null);
      if (!options.preserveInspectorOpen) {
          }
      setComponentVisibility(createDefaultComponentVisibility(nextScene));
      setComponentOpacity(createDefaultComponentOpacity());
      setStyle(applyStylePreferences(createDefaultStyle(), preferences));
      setPreviewMeshQuality(defaultPreviewMeshQualityForScene(nextScene));
      setUnitCellLineStyle(preferences.unitCellLineStyle ?? DEFAULT_UNIT_CELL_LINE_STYLE);
      setShowCrystalAxisLabels(
        preferences.showCrystalAxisLabels ?? DEFAULT_SHOW_CRYSTAL_AXIS_LABELS,
      );
      if (!options.preserveActiveCommonPanelTab) {
        setActiveCommonPanelTab("display");
      }
      resetLockedInteractionFeedback();
      setIsStructureSummaryCollapsed(true);
      resetCameraForScene(nextScene);
    },
    [
      resetCameraForScene,
      resetExportState,
      resetLockedInteractionFeedback,
    ],
  );

  useLayoutEffect(() => {
    resetLoadedPreviewStateRef.current = resetLoadedPreviewState;
  }, [resetLoadedPreviewState]);

  useEffect(() => {
    saveUserPreferences({
      bondColor: style.bondColor,
      bondColorMode: style.bondColorMode,
      colorScheme: style.colorScheme,
      distinguishSimilarColors: style.distinguishSimilarColors,
      dragSensitivity: viewState.dragSensitivity,
      interactionMode: viewState.interactionMode,
      lightStrength: viewState.lightStrength,
      materialPreset: style.materialPreset,
      showCrystalAxisLabels,
      unitCellLineStyle,
    });
  }, [
    showCrystalAxisLabels,
    style.bondColor,
    style.bondColorMode,
    style.colorScheme,
    style.distinguishSimilarColors,
    style.materialPreset,
    unitCellLineStyle,
    viewState.dragSensitivity,
    viewState.interactionMode,
    viewState.lightStrength,
  ]);



  const handleAtomPulse = useCallback((atomId: string) => {
    if (atomId === inspectedAtomIdRef.current) {
      return;
    }

    inspectedAtomIdRef.current = null;
    setInspectedAtomId(null);
    setPulseAtom((currentPulseAtom) => ({
      atomId,
      token: (currentPulseAtom?.token ?? 0) + 1,
    }));
  }, []);

  const handleAtomInspect = useCallback((atomId: string | null) => {
    inspectedAtomIdRef.current = atomId;
    setInspectedAtomId(atomId);
  }, []);

  const elementColorOverrides = useMemo(
    () =>
      scene
        ? elementColorOverridesForStyle(scene.atoms, style)
        : undefined,
    [scene, style],
  );
  const legendColorScheme = baseColorSchemeForStyle(style);
  const legendEntries = useMemo(
    () => deriveElementLegendEntries(scene, legendColorScheme, elementColorOverrides),
    [elementColorOverrides, legendColorScheme, scene],
  );
  const handleLegendElementColorChange = useCallback((element: string, color: string) => {
    setStyle((currentStyle) => {
      const draft =
        currentStyle.colorSchemeMode === "custom" && currentStyle.customColormap
          ? currentStyle.customColormap
          : createCustomColormapFromScheme(currentStyle.colorScheme);

      return {
        ...currentStyle,
        colorSchemeMode: "custom",
        colorScheme: draft.baseColorScheme,
        customColormap: {
          baseColorScheme: draft.baseColorScheme,
          elements: {
            ...draft.elements,
            [element]: color,
          },
        },
      };
    });
  }, []);
  const sceneOffsetX = 0;
  // Visual boxes (PXRD, trajectory data) stack above the structure and simply
  // reserve that space: the scene's safe area grows at the top so the
  // structure refits into the remaining viewport. Positioning beyond the fit
  // is user-controlled via pan (right-drag / Shift+drag) and zoom.
  const isTrajectoryLoaded = (trajectoryFrames?.length ?? 0) > 1;
  const visualStackGap = 16;
  const visualBoxHeights: number[] = [];
  if (isPxrdPanelVisible && scene) {
    visualBoxHeights.push(summaryCardHeight ?? 320);
  }
  if (isTrajectoryLoaded && scene) {
    visualBoxHeights.push(TRAJECTORY_DATA_PANEL_HEIGHT);
  }
  const visualStackBottom = visualBoxHeights.length
    ? 16 +
      visualBoxHeights.reduce((total, height) => total + height, 0) +
      visualStackGap * (visualBoxHeights.length - 1)
    : 0;
  const baseSafeArea = previewSafeAreaForInspector();
  const targetSafeAreaTop = visualStackBottom
    ? Math.max(baseSafeArea.top, visualStackBottom + visualStackGap)
    : baseSafeArea.top;
  const animatedSafeAreaTop = useAnimatedValue(targetSafeAreaTop, SAFE_AREA_ANIMATION_MS);
  const previewSafeArea = useMemo(
    () => ({ ...previewSafeAreaForInspector(), top: animatedSafeAreaTop }),
    [animatedSafeAreaTop],
  );
  const effectivePreviewSafeArea = useMemo(
    () => previewSafeAreaForViewport(previewSafeArea, viewportSize.width),
    [previewSafeArea, viewportSize.width],
  );
  const orientationGizmoSize = useMemo(
    () => orientationGizmoSizeForViewport(viewportSize, effectivePreviewSafeArea),
    [effectivePreviewSafeArea, viewportSize],
  );
  const hasLoadedScene = scene !== null && previewStatus !== "loading";
  const trajectoryFrameCount = trajectoryFrames?.length ?? 0;
  useGlobalShortcuts({
    onNextFrame:
      trajectoryFrameCount > 1
        ? () => handleActiveFrameChange(activeFrameIndex + 1)
        : undefined,
    onOpenFile: () => fileInputRef.current?.click(),
    onPreviousFrame:
      trajectoryFrameCount > 1
        ? () => handleActiveFrameChange(activeFrameIndex - 1)
        : undefined,
    onResetView: hasLoadedScene ? handleResetView : undefined,
    onSelectTab: hasLoadedScene ? setActiveCommonPanelTab : undefined,
    onToggleShortcutSheet: () => {
      setIsShortcutSheetOpen((isOpen) => !isOpen);
    },
  });

  const renderPreviewContextMenuContent = () => (
    <ContextMenuContent className="w-36">
      <ContextMenuGroup>
        <ContextMenuItem
          disabled={!scene || previewStatus === "loading"}
          onSelect={handleResetView}
        >
          <RotateCcw aria-hidden="true" />
          Reset view
          <span aria-hidden="true" className="ml-auto pl-4 font-mono text-2xs text-muted-foreground">
            R
          </span>
        </ContextMenuItem>
      </ContextMenuGroup>
      <ContextMenuSeparator />
      <ContextMenuGroup>
        <ContextMenuItem onSelect={() => fileInputRef.current?.click()}>
          <FolderOpen aria-hidden="true" />
          Open file
          <span aria-hidden="true" className="ml-auto pl-4 font-mono text-2xs text-muted-foreground">
            O
          </span>
        </ContextMenuItem>
        <ContextMenuItem
          disabled={!scene || isExporting || previewStatus === "loading"}
          onSelect={() => {
            void handleExportFigure();
          }}
        >
          <ImageDown aria-hidden="true" />
          Export figure
        </ContextMenuItem>
      </ContextMenuGroup>
      <ContextMenuSeparator />
      <ContextMenuGroup>
        <ContextMenuItem
          disabled={!scene || previewStatus === "loading"}
          onSelect={() => {
            void handleResetAllSettings();
          }}
        >
          <RefreshCw aria-hidden="true" />
          Reset all
        </ContextMenuItem>
      </ContextMenuGroup>
    </ContextMenuContent>
  );

  useEffect(() => {
    if (!inspectedAtomId) {
      return;
    }

    if (!visibleScene || !componentVisibility.atoms || !inspectedAtomInfo) {
      setInspectedAtomId(null);
    }
  }, [componentVisibility.atoms, inspectedAtomId, inspectedAtomInfo, visibleScene]);

  useEffect(() => {
    if (activeCommonPanelTab !== "export") {
      return;
    }

    syncProjectedSizeForExportTab();
  }, [activeCommonPanelTab, cameraOrientationVersion, syncProjectedSizeForExportTab]);

  return (
    <main
      className="relative h-dvh min-w-80 overflow-hidden bg-background text-foreground"
      onDragOver={(event) => {
        if (Array.from(event.dataTransfer.types).includes("Files")) {
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
          setIsFileDragActive(true);
        }
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setIsFileDragActive(false);
        }
      }}
      onDrop={(event) => {
        if (Array.from(event.dataTransfer.types).includes("Files")) {
          event.preventDefault();
          setIsFileDragActive(false);
          void loadStructureFiles(Array.from(event.dataTransfer.files));
        }
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        aria-label="Structure files"
        className="hidden"
        tabIndex={-1}
        onChange={(event) => void handleFileChange(event)}
      />

      {isFileDragActive ? (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-3 z-50 grid place-items-center rounded-2xl border-2 border-dashed border-foreground/35 bg-background/70"
        >
          <span className="rounded-full border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-lg">
            Drop structure files to open (multiple files load as frames)
          </span>
        </div>
      ) : null}

      <ContextMenu>
        <ContextMenuTrigger asChild>
          <section
            className="scene-stage absolute inset-0 transition-transform duration-[260ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
            style={{ transform: `translateX(${sceneOffsetX}px)` }}
            aria-label="Crystal structure preview"
            onPointerCancelCapture={handleScenePointerEndCapture}
            onContextMenuCapture={handleSceneContextMenuCapture}
            onPointerDownCapture={handleScenePointerDownCapture}
            onPointerMoveCapture={handleScenePointerMoveCapture}
            onPointerUpCapture={handleScenePointerEndCapture}
            onWheelCapture={handleSceneWheelCapture}
          >
            {visibleScene ? (
              <LatticeScene
                cameraAnimatedCommandVersion={cameraAnimatedCommandVersion}
                cameraCommandVersion={cameraCommandVersion}
                cameraState={viewState.camera}
                cameraOrientationRef={cameraOrientationRef}
                onCameraOrientationFrame={requestOrientationGizmoFrame}
                onCameraOrientationChange={handleCameraOrientationChange}
                onCameraCommandAnimationActiveChange={handleCameraCommandAnimationActiveChange}
                onCameraControlsInteractionActiveChange={
                  handleCameraControlsInteractionActiveChange
                }
                onAtomInspect={handleAtomInspect}
                onAtomPulse={handleAtomPulse}
                onLockedInteractionAttempt={triggerLockedInteractionFeedback}
                cameraInteractionStore={cameraInteractionStore}
                suspendCameraOrientationUpdates={
                  isCameraCommandAnimationActive || isCameraRollInteractionActive
                }
                interactionLocked={viewState.interactionLocked}
                interactionMode={viewState.interactionMode}
                layoutScene={trajectoryFrames?.[0] ?? scene ?? visibleScene}
                resetCounter={viewState.resetCounter}
                safeArea={previewSafeArea}
                scene={visibleScene}
                inspectedAtomId={inspectedAtomId}
                pulseAtomId={pulseAtom?.atomId ?? null}
                pulseToken={pulseAtom?.token ?? 0}
                previewMeshQuality={previewMeshQuality}
                componentOpacity={componentOpacity}
                dragSensitivity={viewState.dragSensitivity}
                lightStrength={viewState.lightStrength}
                style={style}
                showAtoms={componentVisibility.atoms}
                showUnitCell={componentVisibility.unitCell}
                unitCellLineStyle={unitCellLineStyle}
              />
            ) : (
              <div
                className="grid h-full w-full place-items-center bg-background text-sm text-muted-foreground"
                data-state={previewStatus}
              >
                {previewStatus === "loading" ? (
                  <span className="inline-flex flex-col items-center gap-3">
                    <CrystalMark
                      animated
                      data-testid="loading-structure-spinner"
                      className="size-9 shrink-0"
                    />
                    Loading structure
                  </span>
                ) : (
                  <div className="flex max-w-xs flex-col items-center gap-4 px-6 text-center">
                    <CrystalMark className="size-11 opacity-90" />
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium text-foreground">
                        Drop a structure file to preview
                      </p>
                      <p className="text-xs text-pretty leading-relaxed">
                        CIF, POSCAR, and other pymatgen-supported formats.
                        Multiple files load as trajectory frames.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 rounded-full px-3 text-xs"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Browse files
                    </Button>
                  </div>
                )}
              </div>
            )}
          </section>
        </ContextMenuTrigger>
        {renderPreviewContextMenuContent()}
      </ContextMenu>

      {visibleScene ? (
        <OrientationGizmo
          cameraOrientationRef={cameraOrientationRef}
          cellVectors={visibleScene.cell.vectors}
          className="absolute"
          frameRequestRef={orientationGizmoFrameRequestRef}
          onAxisClick={handleGizmoAxisClick}
          orientationVersion={cameraOrientationVersion}
          showLabels={showCrystalAxisLabels}
          style={orientationGizmoContainerStyle(effectivePreviewSafeArea, orientationGizmoSize)}
        />
      ) : null}

      {legendEntries.length > 0 ? (
        <ElementLegend
          entries={legendEntries}
          latticePlane={
            style.latticePlane
              ? {
                  color: style.latticePlane.color ?? LATTICE_PLANE_COLOR,
                  label: `(${style.latticePlane.h} ${style.latticePlane.k} ${style.latticePlane.l})`,
                }
              : null
          }
          offsetX={sceneOffsetX}
          onElementColorChange={handleLegendElementColorChange}
          onLatticePlaneColorChange={(color) =>
            setStyle((currentStyle) =>
              currentStyle.latticePlane
                ? {
                    ...currentStyle,
                    latticePlane: { ...currentStyle.latticePlane, color },
                  }
                : currentStyle,
            )
          }
          safeArea={previewSafeArea}
        />
      ) : null}

      {inspectedAtomInfo ? (
        <AtomInspectorCard
          colorScheme={legendColorScheme}
          colorOverrides={elementColorOverrides}
          info={inspectedAtomInfo}
          isInspectorOpen={false}
          onClose={() => setInspectedAtomId(null)}
        />
      ) : null}

      {scene ? (
        <TrajectoryBar
          activeFrameIndex={activeFrameIndex}
          frameCount={trajectoryFrames?.length ?? 0}
          isAligned={isTrajectoryAligned}
          isLoading={previewStatus === "loading"}
          onAlignChange={(aligned) => void handleTrajectoryAlignChange(aligned)}
          onFrameChange={handleActiveFrameChange}
        />
      ) : null}

      {scene && (isPxrdPanelMounted || isTrajectoryLoaded) ? (
        <div className="pointer-events-none absolute left-(--left-column-width) top-4 z-20 flex w-[700px] max-w-[calc(100vw-var(--left-column-width)-1rem)] flex-col">
          {isPxrdPanelMounted ? (
            // While visible the wrapper tracks the card height instantly (the
            // card's own expansion already animates); on hide the occupied
            // height eases to zero so the trajectory box glides up.
            <div
              className={cn(
                "pointer-events-auto overflow-hidden",
                "duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                isPxrdPanelVisible
                  ? "mb-4 translate-x-0 opacity-100 transition-[opacity,transform]"
                  : "pointer-events-none mb-0 -translate-x-2 opacity-0 transition-[height,margin,opacity,transform]",
              )}
              style={{ height: isPxrdPanelVisible ? (summaryCardHeight ?? 320) : 0 }}
            >
              <div style={{ height: summaryCardHeight ?? 320 }}>
                <PxrdPanel file={currentFile} fileName={selectedFileName} />
              </div>
            </div>
          ) : null}
          {isTrajectoryLoaded && trajectoryFrames ? (
            <div className="pointer-events-auto">
              <TrajectoryDataPanel
                activeFrameIndex={activeFrameIndex}
                frames={trajectoryFrames}
                onFrameChange={handleActiveFrameChange}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="pointer-events-none fixed inset-y-0 left-0 z-10 w-(--left-column-width) max-w-[100vw]">
        <div className="pointer-events-auto flex max-h-full flex-col gap-4 overflow-y-auto overscroll-contain p-4 [scrollbar-width:thin]">
          <div ref={summaryCardWrapperRef}>
            <StructureSummaryCard
              isCollapsed={isStructureSummaryCollapsed}
              onCollapsedChange={setIsStructureSummaryCollapsed}
              onOpenStructure={() => fileInputRef.current?.click()}
              previewStatus={previewStatus}
              scene={scene}
              selectedFileName={selectedFileName}
            />
          </div>

        {scene ? (
          <div>
            <CommonControlsPanel
              activeTab={activeCommonPanelTab}
              componentOpacity={componentOpacity}
              style={style}
              exportProjectedSize={exportProjectedSize ?? undefined}
              componentVisibility={componentVisibility}
              exportError={exportError}
              exportSettings={exportSettings}
              hasPolyhedra={hasPolyhedra(scene)}
              isExporting={isExporting}
              onActiveTabChange={setActiveCommonPanelTab}
              onAtomRadiusModelChange={(atomRadiusModel) => {
                setStyle((currentStyle) => ({ ...currentStyle, atomRadiusModel }));
              }}
              onComponentOpacityChange={setComponentOpacity}
              onCopyRenderStyle={handleCopyRenderStyle}
              animationExportProgress={animationExportProgress}
              onApplyRenderStyle={handleApplyRenderStyle}
              onExportSeriesGif={(fps, format) => void handleExportSeriesAnimation(fps, format)}
              onExportTurntableGif={(frameCount, fps, format) =>
                void handleExportTurntableAnimation(frameCount, fps, format)
              }
              onSupercellChange={handleSupercellChange}
              supercell={supercell}
              trajectoryFrameCount={trajectoryFrames?.length ?? 0}
              vectorProperties={scene?.vectorProperties}
              onExport={handleExportFigure}
              onExportSettingsChange={handleExportSettingsChange}
              onStyleChange={setStyle}
              onComponentVisibilityChange={setComponentVisibility}
              settings={{
                bondAlgorithm,
                isSceneLoading: previewStatus === "loading",
                lightStrength: viewState.lightStrength,
                onBondAlgorithmChange: (nextBondAlgorithm) => {
                  void handleBondAlgorithmChange(nextBondAlgorithm);
                },
                onLightStrengthChange: handleLightStrengthChange,
                onPreviewMeshQualityChange: setPreviewMeshQuality,
                onShowCrystalAxisLabelsChange: setShowCrystalAxisLabels,
                onUnitCellLineStyleChange: setUnitCellLineStyle,
                previewMeshQuality,
                showCrystalAxisLabels,
                unitCellLineStyle,
              }}
            />
          </div>
        ) : null}

        {scene ? (
          <ViewControlRail
            cameraState={cameraControlsPanelState}
            cellVectors={scene.cell.vectors}
            dragSensitivity={viewState.dragSensitivity}
            interactionLocked={viewState.interactionLocked}
            interactionMode={viewState.interactionMode}
            lockedInteractionFeedbackCount={lockedInteractionFeedbackCount}
            onCameraPrimaryChange={handleCameraPrimaryChange}
            onCameraRollPreviewChange={handleCameraRollPreviewChange}
            onCameraRollPreviewStart={handleCameraRollPreviewStart}
            onCameraRollChange={handleCameraRollChange}
            onCameraSecondaryChange={handleCameraSecondaryChange}
            onCameraStateChange={handleCameraStateChange}
            onDragSensitivityChange={handleDragSensitivityChange}
            onInteractionLockedChange={handleInteractionLockedChange}
            onInteractionModeChange={handleInteractionModeChange}
            onResetView={handleResetView}
            cameraInteractionStore={cameraInteractionStore}
          />
        ) : null}
        </div>
      </div>

      {errorMessage ? (
        <Alert
          variant={errorSeverity === "warning" ? "default" : "destructive"}
          className={cn(
            "fixed top-4 z-20 w-[320px] rounded-xl shadow-sm shadow-foreground/5",
            "animate-in fade-in-0 slide-in-from-top-1 duration-200 ease-out motion-reduce:animate-none",
            scene
              ? "left-[calc(var(--left-column-width)+58px)]"
              : "left-(--left-column-width)",
            "max-[760px]:left-4 max-[760px]:right-4 max-[760px]:top-[10rem] max-[760px]:w-auto",
          )}
          onDismiss={() => setErrorMessage(null)}
        >
          <AlertTriangleIcon aria-hidden="true" />
          <AlertTitle className="font-semibold">{errorTitle}</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      {isShortcutSheetOpen ? (
        <ShortcutSheet onClose={() => setIsShortcutSheetOpen(false)} />
      ) : null}
    </main>
  );
}
