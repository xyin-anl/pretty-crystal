import type { SceneSpec } from "../api/scene";
import type { CameraPoseSnapshot } from "../scene/cameraPose";
import type { RasterExportImage } from "../scene/exportRenderer";
import type {
  ComponentOpacityState,
  ComponentVisibilityState,
  ExportSettingsState,
  StyleState,
  UnitCellLineStyle,
} from "../model";
import {
  exportBackgroundColor,
  rasterFormatForExportFormat,
} from "./rasterCanvas";

const DARK_BACKGROUND_UNIT_CELL_LINE_COLOR = "#bbbbbb";

export async function renderExportRaster({
  cameraPose,
  componentOpacity,
  componentVisibility,
  framingScale = 1,
  lightStrength,
  settings,
  style,
  unitCellLineStyle,
  visibleScene,
  trainingOutputs,
}: {
  cameraPose: CameraPoseSnapshot;
  componentOpacity: ComponentOpacityState;
  componentVisibility: ComponentVisibilityState;
  framingScale?: number;
  lightStrength: number;
  settings: ExportSettingsState;
  style: StyleState;
  unitCellLineStyle: UnitCellLineStyle;
  visibleScene: SceneSpec;
  trainingOutputs?: readonly (
    | "atom_instances"
    | "bond_instances"
    | "depth"
    | "unit_cell_instances"
  )[];
}): Promise<RasterExportImage> {
  const { renderStructureRasterImage } = await import("../scene/exportRenderer");

  return renderStructureRasterImage({
    backgroundColor: exportBackgroundColor(settings.background),
    cameraPose,
    componentOpacity,
    frameScale: framingScale,
    height: settings.height,
    imageFormat: rasterFormatForExportFormat(settings.format),
    lightStrength,
    meshQuality: settings.meshQuality,
    scene: visibleScene,
    showAtoms: componentVisibility.atoms,
    showUnitCell: componentVisibility.unitCell,
    style,
    supersampling: settings.supersampling,
    unitCellLineColor:
      settings.background === "black" ? DARK_BACKGROUND_UNIT_CELL_LINE_COLOR : undefined,
    unitCellLineStyle,
    width: settings.width,
    trainingOutputs,
  });
}
