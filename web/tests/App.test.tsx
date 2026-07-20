import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { ReactNode } from "react";
import { Quaternion, Vector3 } from "three";

import type { AtomSpec, SceneSpec } from "../src/api/scene";
import type {
  CreateFigureExportOptions,
  FigureExportFile,
} from "../src/app/exportFigure";
import {
  createFigureExportZipBlob as actualCreateFigureExportZipBlob,
  createZipBlob as actualCreateZipBlob,
} from "../src/app/exportFigure";
import {
  STRUCTURE_ATOM_COUNT_THRESHOLD,
  type ExportFormat,
} from "../src/model";
import { MATERIAL_PRESET_OPTIONS } from "../src/model/materialPresets";
import { createAppTestHarness } from "./helpers/appHarness";

class MockControls {
  enabled = true;
  maxZoom = Infinity;
  minZoom = 0;
  mouseButtons: Record<string, unknown> = {};
  noPan = false;
  noRotate = false;
  noZoom = false;
  target = new Vector3();
  touches: Record<string, unknown> = {};

  addEventListener() {}

  dispose() {}

  handleResize() {}

  removeEventListener() {}

  update() {}
}

class MockOrbitControls extends MockControls {}

class MockTrackballControls extends MockControls {}

class MockCamera {
  far = 1000;
  near = 0.01;
  position = new Vector3();
  quaternion = new Quaternion();
  up = new Vector3(0, 1, 0);

  lookAt() {}

  updateProjectionMatrix() {}
}

mock.module("@react-three/fiber", () => {
  return {
    Canvas: ({
      camera: _camera,
      children: _children,
      gl: _gl,
      orthographic: _orthographic,
      ...props
    }: {
      camera?: unknown;
      children: ReactNode;
      gl?: unknown;
      orthographic?: boolean;
    }) => (
      <canvas
        data-render-backend="webgl"
        onContextMenu={(event) => event.stopPropagation()}
        {...props}
      />
    ),
    useFrame: () => {},
    createRoot: () => ({
      configure: async () => {},
      render: () => ({
        getState: () => ({
          advance: () => {},
          gl: {
            domElement: document.createElement("canvas"),
            render: () => {},
          },
          scene: {},
        }),
      }),
      unmount: () => {},
    }),
    useThree: () => ({
      camera: new MockCamera(),
      gl: {
        domElement: document.createElement("canvas"),
      },
      invalidate: () => {},
      size: {
        height: 768,
        width: 1024,
      },
    }),
  };
});

mock.module("three/examples/jsm/controls/OrbitControls.js", () => ({
  OrbitControls: MockOrbitControls,
}));

mock.module("three/examples/jsm/controls/TrackballControls.js", () => ({
  TrackballControls: MockTrackballControls,
}));

mock.module("../src/scene/OrientationGizmo", () => ({
  OrientationGizmo: ({
    onAxisClick,
    showLabels = true,
  }: {
    onAxisClick?: (axis: "a" | "b" | "c") => void;
    showLabels?: boolean;
  }) => (
    <div
      data-show-labels={String(showLabels)}
      data-testid="mock-orientation-gizmo"
    >
      <button type="button" onClick={() => onAxisClick?.("a")}>
        gizmo a
      </button>
      <button type="button" onClick={() => onAxisClick?.("c")}>
        gizmo c
      </button>
    </div>
  ),
  ORIENTATION_GIZMO_CAMERA_POSITION: [0, 0, 5],
  ORIENTATION_GIZMO_LABEL_DISTANCE: 1.3,
  ORIENTATION_GIZMO_SCALE: 1.36,
  ORIENTATION_GIZMO_ZOOM_PER_CANVAS_PIXEL: 53 / 588,
  StaticOrientationGizmoScene: () => null,
}));

let exportRequests: CreateFigureExportOptions[] = [];
let exportDirectDownloads: { file: FigureExportFile; sourceFileName: string | null }[] = [];
let exportZipDownloads: { files: FigureExportFile[]; sourceFileName: string | null }[] = [];
let exportFailure: Error | null = null;

async function createFigureExportFilesMock(
  options: CreateFigureExportOptions,
): Promise<FigureExportFile[]> {
  exportRequests.push(options);
  if (exportFailure) {
    throw exportFailure;
  }

  if (options.settings.combineComponents) {
    return [
      {
        blob: new Blob(["combined"], {
          type: exportMimeType(options.settings.format),
        }),
        fileName: `NaCl.${options.settings.format}`,
        format: options.settings.format,
      },
    ];
  }

  const files: FigureExportFile[] = [];
  if (options.settings.components.structure) {
    files.push({
      blob: new Blob([options.settings.format], {
        type: exportMimeType(options.settings.format),
      }),
      fileName: `NaCl.${options.settings.format}`,
      format: options.settings.format,
    });
  }
  if (options.settings.components.crystalAxes) {
    files.push({
      blob: new Blob(["crystal axes"], {
        type: exportMimeType(options.settings.format),
      }),
      fileName: `NaCl-crystal-axes.${options.settings.format}`,
      format: options.settings.format,
    });
  }
  if (options.settings.components.legend) {
    files.push({
      blob: new Blob(["legend"], {
        type: exportMimeType(options.settings.format),
      }),
      fileName: `NaCl-legend.${options.settings.format}`,
      format: options.settings.format,
    });
  }
  return files;
}

function exportMimeType(format: ExportFormat) {
  if (format === "pdf") {
    return "application/pdf";
  }

  return format === "jpg" ? "image/jpeg" : "image/png";
}

async function downloadFigureExportZipMock(
  files: FigureExportFile[],
  sourceFileName: string | null,
) {
  exportZipDownloads.push({ files, sourceFileName });
}

async function downloadFigureExportFilesMock(
  files: FigureExportFile[],
  sourceFileName: string | null,
) {
  if (files.length === 1) {
    exportDirectDownloads.push({ file: files[0]!, sourceFileName });
    return;
  }

  exportZipDownloads.push({ files, sourceFileName });
}

mock.module("../src/app/exportFigure", () => ({
  createFigureExportFiles: createFigureExportFilesMock,
  createFigureExportZipBlob: actualCreateFigureExportZipBlob,
  createZipBlob: actualCreateZipBlob,
  downloadFigureExportFiles: downloadFigureExportFilesMock,
  downloadFigureExportZip: downloadFigureExportZipMock,
}));

const { App } = await import("../src/app/App");
const { createDefaultCrystalCameraState } = await import("../src/scene/crystalCamera");
const appHarness = createAppTestHarness(App);
const {
  errorResponse,
  fetchCalls,
  getFileInput,
  htmlResponse,
  jsonResponse,
  openPreviewContextMenu,
  queueFetchResponse,
  structureFile,
} = appHarness;

async function renderLoadedStructure(user: ReturnType<typeof userEvent.setup>, scene = sceneWithPeriodicImages()) {
  await appHarness.renderLoadedStructure(user, scene);
}

beforeEach(() => {
  window.localStorage.clear();
  Object.defineProperty(navigator, "gpu", {
    configurable: true,
    value: undefined,
  });
  appHarness.resetFetchMock();
  exportDirectDownloads = [];
  exportZipDownloads = [];
  exportFailure = null;
  exportRequests = [];
});

describe("App", () => {
  test("starts with an empty preview and a compact structure card", () => {
    render(<App />);

    expect(screen.getByText("Drop a structure file to preview").isConnected).toBe(true);
    expect(screen.queryByTestId("lattice-canvas")).toBeNull();
    expect(screen.queryByRole("button", { name: "Sidebar" })).toBeNull();

    const structureCard = screen.getByRole("complementary", { name: "Current structure" });
    expect(within(structureCard).getByText("Pretty Crystal").isConnected).toBe(true);
    const openButton = within(structureCard).getByRole("button", { name: "Open structure" });
    expect(openButton.isConnected).toBe(true);
    expect((openButton as HTMLButtonElement).disabled).toBe(false);
    expect(within(structureCard).queryByText("File")).toBeNull();
    expect(within(structureCard).queryByText("No file selected")).toBeNull();
    expect(structureCard.querySelector("[data-slot='separator']")).toBeNull();
  });

  test("uploads a structure and renders the summary, legend, and view controls", async () => {
    const user = userEvent.setup();
    const scene = sceneWithPeriodicImages();
    const file = structureFile();
    queueFetchResponse(jsonResponse(scene));

    render(<App />);

    await user.upload(getFileInput(), file);

    await waitFor(() => expect(fetchCalls).toHaveLength(1));
    const uploadRequest = fetchCalls[0]!;
    expect(uploadRequest.input).toBe("/api/structure-preview");
    expect(uploadRequest.init?.body).toBe(file);
    expect(uploadRequest.init?.method).toBe("POST");
    expect(uploadRequest.init?.headers).toEqual({
      "content-type": "chemical/x-cif",
      "x-pretty-crystal-filename": "NaCl.cif",
    });

    expect((await screen.findByTestId("lattice-canvas")).isConnected).toBe(true);
    expect(screen.getByTestId("mock-orientation-gizmo").isConnected).toBe(true);

    const structureCard = screen.getByRole("complementary", { name: "Current structure" });
    expect(structureCard.querySelector("[data-slot='separator']")).not.toBeNull();
    expect(within(structureCard).getByText("NaCl.cif").isConnected).toBe(true);
    expect(within(structureCard).getByText("NaCl").isConnected).toBe(true);
    expect(within(structureCard).getByText("2").isConnected).toBe(true);
    expect(within(structureCard).getByText("Space group").isConnected).toBe(true);
    expect(within(structureCard).getByText("Point group").isConnected).toBe(true);
    expect(within(structureCard).getByText("Crystal system").isConnected).toBe(true);
    expect(within(structureCard).getAllByText("N/A")).toHaveLength(3);

    const legend = screen.getByRole("navigation", { name: "Element legend" });
    expect(within(legend).getByText("Na").isConnected).toBe(true);
    expect(within(legend).getByText("Cl").isConnected).toBe(true);
    expect(screen.getByRole("complementary", { name: "View controls" }).isConnected).toBe(true);
    const commonControls = screen.getByRole("complementary", { name: "Common controls" });
    const materialTokenPreloadPool = commonControls.querySelector(
      "[data-slot='material-preset-token-preload-pool']",
    );
    expect(materialTokenPreloadPool).not.toBeNull();
    expect(
      materialTokenPreloadPool?.querySelectorAll("[data-slot='material-preset-token-renderer']").length,
    ).toBe(MATERIAL_PRESET_OPTIONS.length);
    const displayTab = within(commonControls).getByRole("tab", { name: "Display" });
    expect(displayTab.isConnected).toBe(true);
    expect(within(commonControls).queryByRole("heading", { name: "Display" })).toBeNull();
    expect(within(commonControls).getByText("Periodic images").isConnected).toBe(true);
    expect(
      commonControls.querySelector("[data-slot='common-controls-content']")?.className,
    ).not.toContain("h-[");
    const polyhedraCheckbox = within(commonControls).getByRole("checkbox", {
      name: "Polyhedra",
    }) as HTMLButtonElement;
    expect(polyhedraCheckbox.disabled).toBe(false);
    expect(polyhedraCheckbox.getAttribute("aria-checked")).toBe("false");
    expect(
      within(commonControls)
        .getAllByRole("checkbox")
        .map((checkbox) => checkbox.getAttribute("aria-label")),
    ).toEqual(["Atoms", "Bonds", "Unit cell", "Polyhedra"]);
  });

  test("initializes uploaded structure camera controls from the uploaded cell", async () => {
    const user = userEvent.setup();
    const scene = sceneWithPeriodicImages();
    scene.cell.vectors = [
      [10, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];
    const defaultCamera = createDefaultCrystalCameraState(scene.cell.vectors);
    queueFetchResponse(jsonResponse(scene));

    render(<App />);

    await user.upload(getFileInput(), structureFile());
    await screen.findByTestId("lattice-canvas");
    const viewControls = screen.getByRole("complementary", { name: "View controls" });
    await user.click(within(viewControls).getByRole("button", { name: "Pose" }));

    expect(
      within(viewControls).getByRole("textbox", { name: "z a" }),
    ).toHaveProperty("value", defaultCamera.direct[0].toFixed(2));
    expect(
      within(viewControls).getByRole("textbox", { name: "z b" }),
    ).toHaveProperty("value", defaultCamera.direct[1].toFixed(2));
    expect(
      within(viewControls).getByRole("textbox", { name: "z c" }),
    ).toHaveProperty("value", defaultCamera.direct[2].toFixed(2));
  });

  test("keeps preview quality in the settings sidebar without rendering backend toggles", async () => {
    const user = userEvent.setup();

    await renderLoadedStructure(user);

    const commonControls = screen.getByRole("complementary", { name: "Common controls" });
    expect(
      within(commonControls).queryByRole("combobox", {
        name: "Atom rendering mode",
      }),
    ).toBeNull();

    expect(within(commonControls).getByRole("heading", { name: "Preview" })).toBeTruthy();
    expect(
      within(commonControls).queryByRole("combobox", {
        name: "Atom rendering mode",
      }),
    ).toBeNull();
    expect(
      within(commonControls).queryByRole("combobox", {
        name: "Bond rendering mode",
      }),
    ).toBeNull();
    const previewMeshSelect = within(commonControls).getByRole("combobox", {
      name: "Preview quality",
    });

    expect(previewMeshSelect.textContent).toContain("Medium");

    await user.click(previewMeshSelect);
    await user.click(await screen.findByRole("option", { name: "XHigh" }));

    expect(
      within(commonControls).getByRole("combobox", { name: "Preview quality" }).textContent,
    ).toContain("XHigh");
  });

  test("defaults large preview structures to low mesh quality", async () => {
    const user = userEvent.setup();

    await renderLoadedStructure(
      user,
      sceneWithPeriodicImages({
        atomCount: STRUCTURE_ATOM_COUNT_THRESHOLD,
      }),
    );

    const commonControls = screen.getByRole("complementary", { name: "Common controls" });
    expect(
      within(commonControls).queryByRole("combobox", {
        name: "Atom rendering mode",
      }),
    ).toBeNull();
    expect(
      within(commonControls).queryByRole("combobox", { name: "Bond rendering mode" }),
    ).toBeNull();
    expect(
      within(commonControls).getByRole("combobox", { name: "Preview quality" }).textContent,
    ).toContain("Low");
  });

  test("shows CrystalNN as the automatic default for small uploaded structures", async () => {
    const user = userEvent.setup();
    queueFetchResponse(jsonResponse(sceneWithPeriodicImages({ atomCount: 5 })));

    render(<App />);

    await user.upload(getFileInput(), structureFile("large.cif"));

    await waitFor(() => expect(fetchCalls).toHaveLength(1));
    expect(fetchCalls[0]?.input).toBe("/api/structure-preview");

    expect(screen.getByRole("combobox", { name: "Bonding algorithm" }).textContent).toContain(
      "CrystalNN",
    );
  });

  test("offers open and export from the preview context menu", async () => {
    const user = userEvent.setup();

    await renderLoadedStructure(user);

    const fileInput = getFileInput();
    const originalClick = fileInput.click;
    let fileInputClickCount = 0;
    fileInput.click = () => {
      fileInputClickCount += 1;
    };

    try {
      await openPreviewContextMenu();
      await user.click(await screen.findByRole("menuitem", { name: "Open file" }));

      expect(fileInputClickCount).toBe(1);

      await openPreviewContextMenu();
      await user.click(await screen.findByRole("menuitem", { name: "Export figure" }));

      await waitFor(() => expect(exportRequests).toHaveLength(1));
      expect(exportRequests[0]?.settings.format).toBe("png");
      expect(exportDirectDownloads[0]?.sourceFileName).toBe("NaCl.cif");
      expect(exportDirectDownloads[0]?.file.fileName).toBe("NaCl.png");
    } finally {
      fileInput.click = originalClick;
    }
  });

  test("resets local preview settings from the context menu without reuploading", async () => {
    const user = userEvent.setup();

    await renderLoadedStructure(
      user,
      sceneWithPeriodicImages({ atomCount: STRUCTURE_ATOM_COUNT_THRESHOLD }),
    );

    const commonControls = screen.getByRole("complementary", { name: "Common controls" });
    await user.click(within(commonControls).getByRole("checkbox", { name: "Atoms" }));
    await user.click(within(commonControls).getByRole("tab", { name: "Style" }));
    await user.click(within(commonControls).getByRole("combobox", { name: "Color scheme" }));
    await user.click(await screen.findByRole("option", { name: "Jmol" }));
    await user.click(screen.getByRole("button", { name: "Mouse settings" }));
    await user.click(await screen.findByRole("combobox", { name: "Mouse control" }));
    await user.click(await screen.findByRole("option", { name: "Orbit" }));
    fireEvent.change(screen.getByRole("slider", { name: "Drag sensitivity" }), {
      target: { value: "1000" },
    });
    await user.click(screen.getByRole("button", { name: "Mouse settings" }));
    expect(screen.queryByRole("combobox", { name: "Mouse control" })).toBeNull();

    await openPreviewContextMenu();
    await user.click(await screen.findByRole("menuitem", { name: "Reset all" }));

    expect(fetchCalls).toHaveLength(1);

    const resetControls = screen.getByRole("complementary", { name: "Common controls" });
    expect(resetControls).toBe(commonControls);
    expect(
      within(resetControls).getByRole("tab", { name: "Style" }).getAttribute("aria-selected"),
    ).toBe("true");
    expect(
      within(resetControls).getByRole("combobox", { name: "Color scheme" }).textContent,
    ).toContain("VESTA Soft");
    await user.click(within(resetControls).getByRole("tab", { name: "Display" }));
    expect(
      within(resetControls)
        .getByRole("checkbox", { name: "Atoms" })
        .getAttribute("aria-checked"),
    ).toBe("true");

    await user.click(screen.getByRole("button", { name: "Mouse settings" }));
    expect(
      (await screen.findByRole("combobox", { name: "Mouse control" })).textContent,
    ).toContain("Trackball");
    expect(
      screen.getByRole("slider", { name: "Drag sensitivity" }).getAttribute("value"),
    ).toBe("500");
  });

  test("shows a compact spinner while a structure is loading", async () => {
    const user = userEvent.setup();
    let resolveScene: (scene: SceneSpec) => void = () => {};
    const scenePromise = new Promise<SceneSpec>((resolve) => {
      resolveScene = resolve;
    });
    queueFetchResponse({
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => scenePromise,
      ok: true,
    } as Response);

    render(<App />);
    await user.upload(getFileInput(), structureFile());

    expect(screen.getByText("Loading structure").isConnected).toBe(true);
    const spinner = screen.getByTestId("loading-structure-spinner");
    expect(spinner.className).toContain("crystal-mark-draw");

    resolveScene(sceneWithPeriodicImages());

    await screen.findByTestId("lattice-canvas");
  });

  test("does not restore a previously uploaded scene after the app remounts", async () => {
    const user = userEvent.setup();
    queueFetchResponse(jsonResponse(sceneWithPeriodicImages()));
    const { unmount } = render(<App />);

    await user.upload(getFileInput(), structureFile());
    await screen.findByTestId("lattice-canvas");

    unmount();
    render(<App />);

    expect(fetchCalls).toHaveLength(1);
    expect(screen.getByText("Drop a structure file to preview").isConnected).toBe(true);
    expect(screen.queryByTestId("lattice-canvas")).toBeNull();
    expect(screen.queryByText("NaCl.cif")).toBeNull();
  });

  test("loads structures dropped anywhere on the app", async () => {
    queueFetchResponse(jsonResponse(sceneWithPeriodicImages()));
    render(<App />);

    const main = screen.getByRole("main");
    const file = structureFile();
    const dataTransfer = {
      types: ["Files"],
      files: [file],
      dropEffect: "none",
    };

    fireEvent.dragOver(main, { dataTransfer });
    expect(screen.getByText(/Drop structure files to open/).isConnected).toBe(true);

    fireEvent.drop(main, { dataTransfer });

    await screen.findByTestId("lattice-canvas");
    expect(screen.queryByText(/Drop structure files to open/)).toBeNull();
    expect(fetchCalls[0]?.input).toBe("/api/structure-preview");
    expect(screen.getByText("NaCl.cif").isConnected).toBe(true);
  });

  test("persists style preferences across remounts and clears them on reset all", async () => {
    const user = userEvent.setup();
    queueFetchResponse(jsonResponse(sceneWithPeriodicImages()));
    const { unmount } = render(<App />);

    await user.upload(getFileInput(), structureFile());
    await screen.findByTestId("lattice-canvas");

    const commonControls = screen.getByRole("complementary", { name: "Common controls" });
    await user.click(within(commonControls).getByRole("tab", { name: "Style" }));
    await user.click(within(commonControls).getByRole("combobox", { name: "Color scheme" }));
    await user.click(await screen.findByRole("option", { name: "Jmol" }));
    expect(
      within(commonControls).getByRole("combobox", { name: "Color scheme" }).textContent,
    ).toContain("Jmol");

    unmount();

    // A fresh session starts with the persisted preference applied.
    queueFetchResponse(jsonResponse(sceneWithPeriodicImages()));
    const second = render(<App />);
    await user.upload(getFileInput(), structureFile());
    await screen.findByTestId("lattice-canvas");
    const secondControls = screen.getByRole("complementary", { name: "Common controls" });
    await user.click(within(secondControls).getByRole("tab", { name: "Style" }));
    expect(
      within(secondControls).getByRole("combobox", { name: "Color scheme" }).textContent,
    ).toContain("Jmol");

    // Reset all wipes the stored preference back to the factory default.
    await openPreviewContextMenu();
    await user.click(await screen.findByRole("menuitem", { name: "Reset all" }));
    expect(
      within(secondControls).getByRole("combobox", { name: "Color scheme" }).textContent,
    ).toContain("VESTA Soft");

    second.unmount();
    render(<App />);
    expect(window.localStorage.getItem("pretty-crystal:preferences:v1")).not.toContain(
      '"colorScheme":"jmol"',
    );
  });

  test("lets display controls change image visibility and inspector settings change rotation mode", async () => {
    const user = userEvent.setup();

    await renderLoadedStructure(
      user,
      sceneWithPeriodicImages({ atomCount: STRUCTURE_ATOM_COUNT_THRESHOLD }),
    );

    const boundaryAtomSwitch = screen.getByRole("switch", {
      name: "Cell-boundary atoms",
    });
    expect((boundaryAtomSwitch as HTMLButtonElement).disabled).toBe(false);
    expect(boundaryAtomSwitch.getAttribute("aria-checked")).toBe("true");

    await user.click(boundaryAtomSwitch);

    expect(boundaryAtomSwitch.getAttribute("aria-checked")).toBe("false");

    const oneHopSwitch = screen.getByRole("switch", {
      name: "One-hop bonded atoms",
    });
    expect(oneHopSwitch.getAttribute("aria-checked")).toBe("false");

    await user.click(oneHopSwitch);

    expect(oneHopSwitch.getAttribute("aria-checked")).toBe("true");

    const legend = screen.getByRole("navigation", { name: "Element legend" });
    expect(legend.getAttribute("style")).toContain("calc(50% + 122px)");
    expect(screen.queryByRole("button", { name: "Sidebar" })).toBeNull();

    const inspector = screen.getByRole("complementary", { name: "Common controls" });
    expect(within(inspector).queryByRole("tab", { name: "Settings" })).toBeNull();
    expect(within(inspector).queryByText("Renderer")).toBeNull();
    expect(within(inspector).queryByRole("combobox", { name: "Renderer" })).toBeNull();
    expect(
      within(inspector).queryByRole("combobox", { name: "Atom rendering mode" }),
    ).toBeNull();
    expect(
      within(inspector).queryByRole("combobox", { name: "Bond rendering mode" }),
    ).toBeNull();
    expect(within(inspector).queryByRole("switch", { name: "Show FPS" })).toBeNull();
    expect(screen.queryByTestId("fps-overlay")).toBeNull();

    expect(screen.getByTestId("lattice-canvas").getAttribute("data-render-backend")).toBe(
      "webgl",
    );

    await user.click(screen.getByRole("button", { name: "Mouse settings" }));
    const interactionSelect = await screen.findByRole("combobox", { name: "Mouse control" });
    expect(interactionSelect.textContent).toContain("Trackball");
    const dragSensitivitySlider = screen.getByRole("slider", {
      name: "Drag sensitivity",
    });
    expect(dragSensitivitySlider.getAttribute("min")).toBe("0");
    expect(dragSensitivitySlider.getAttribute("max")).toBe("1000");
    expect(dragSensitivitySlider.getAttribute("value")).toBe("500");
    expect(dragSensitivitySlider.getAttribute("aria-valuemin")).toBe("50");
    expect(dragSensitivitySlider.getAttribute("aria-valuemax")).toBe("200");
    expect(dragSensitivitySlider.getAttribute("aria-valuenow")).toBe("100");
    expect(dragSensitivitySlider.getAttribute("aria-valuetext")).toBe("100%");
    const dragSensitivityValueInput = screen.getByRole("textbox", {
      name: "Drag sensitivity value",
    });
    expect(dragSensitivityValueInput.getAttribute("value")).toBe("100");

    await user.keyboard("{Escape}");
    await user.click(within(inspector).getByRole("tab", { name: "Style" }));
    const lightStrengthSlider = within(inspector).getByRole("slider", {
      name: "Light strength",
    });
    expect(lightStrengthSlider.getAttribute("min")).toBe("50");
    expect(lightStrengthSlider.getAttribute("max")).toBe("200");
    expect(lightStrengthSlider.getAttribute("value")).toBe("100");
    const lightStrengthValueInput = within(inspector).getByRole("textbox", {
      name: "Light strength value",
    });
    expect(lightStrengthValueInput.getAttribute("value")).toBe("100");

    fireEvent.change(lightStrengthSlider, { target: { value: "200" } });

    expect(
      within(inspector).getByRole("slider", { name: "Light strength" }).getAttribute(
        "value",
      ),
    ).toBe("200");
    expect(
      within(inspector).getByRole("textbox", { name: "Light strength value" }).getAttribute(
        "value",
      ),
    ).toBe("200");

    await user.click(await screen.findByRole("combobox", { name: "Mouse control" }));
    await user.click(await screen.findByRole("option", { name: "Orbit" }));

    expect(
      (await screen.findByRole("combobox", { name: "Mouse control" })).textContent,
    ).toContain("Orbit");
  });

  test("exports without carrying renderer state", async () => {
    const user = userEvent.setup();

    await renderLoadedStructure(user);
    expect(fetchCalls).toHaveLength(1);
    expect(screen.getByTestId("lattice-canvas").getAttribute("data-render-backend")).toBe(
      "webgl",
    );

    const commonControls = screen.getByRole("complementary", { name: "Common controls" });
    expect(within(commonControls).queryByRole("combobox", { name: "Renderer" })).toBeNull();

    const showCrystalAxisLabelsSwitch = within(commonControls).getByRole("switch", {
      name: "Crystal axis labels",
    });
    expect(showCrystalAxisLabelsSwitch.getAttribute("aria-checked")).toBe("true");
    expect(screen.getByTestId("mock-orientation-gizmo").getAttribute("data-show-labels")).toBe(
      "true",
    );
    await user.click(showCrystalAxisLabelsSwitch);
    expect(showCrystalAxisLabelsSwitch.getAttribute("aria-checked")).toBe("false");
    expect(screen.getByTestId("mock-orientation-gizmo").getAttribute("data-show-labels")).toBe(
      "false",
    );

    await user.click(within(commonControls).getByRole("tab", { name: "Style" }));
    const depthCueingUnitCellSwitch = within(commonControls).getByRole("switch", {
      name: "Apply depth cueing to unit cell",
    });
    const distinguishSimilarColorsSwitch = within(commonControls).getByRole("switch", {
      name: "Distinguish similar colors",
    });
    expect(depthCueingUnitCellSwitch.getAttribute("aria-checked")).toBe("false");
    expect(distinguishSimilarColorsSwitch.getAttribute("aria-checked")).toBe("true");
    await user.click(within(commonControls).getByText("Distinguish colors"));
    expect(distinguishSimilarColorsSwitch.getAttribute("aria-checked")).toBe("true");
    await user.click(depthCueingUnitCellSwitch);
    expect(depthCueingUnitCellSwitch.getAttribute("aria-checked")).toBe("true");
    await user.click(distinguishSimilarColorsSwitch);
    expect(distinguishSimilarColorsSwitch.getAttribute("aria-checked")).toBe("false");
    await user.click(distinguishSimilarColorsSwitch);
    expect(distinguishSimilarColorsSwitch.getAttribute("aria-checked")).toBe("true");

    const unitCellLineSelect = within(commonControls).getByRole("combobox", {
      name: "Unit cell line style",
    });
    expect(unitCellLineSelect.textContent).toContain("Solid");
    await user.click(unitCellLineSelect);
    await user.click(await screen.findByRole("option", { name: "Dashed" }));

    expect(fetchCalls).toHaveLength(1);
    expect(screen.getByTestId("lattice-canvas").getAttribute("data-render-backend")).toBe(
      "webgl",
    );

    await user.click(within(commonControls).getByRole("tab", { name: "Export" }));
    await user.click(within(commonControls).getByRole("button", { name: "Export PNG" }));
    await waitFor(() => expect(exportRequests).toHaveLength(1));

    expect(exportDirectDownloads[0]?.sourceFileName).toBe("NaCl.cif");
    expect(exportDirectDownloads[0]?.file.fileName).toBe("NaCl.png");
    expect(exportZipDownloads).toHaveLength(0);
    expect(exportRequests[0]?.showCrystalAxisLabels).toBe(false);
    expect(exportRequests[0]?.unitCellLineStyle).toBe("dashed");
    expect(exportRequests[0]?.style.fogAffectsUnitCell).toBe(true);
    expect(exportRequests[0]?.style.distinguishSimilarColors).toBe(true);
  });

  test("toggles polyhedra independently from atoms, bonds, and unit cell", async () => {
    const user = userEvent.setup();

    await renderLoadedStructure(user);

    const commonControls = screen.getByRole("complementary", { name: "Common controls" });
    const atomsCheckbox = within(commonControls).getByRole("checkbox", {
      name: "Atoms",
    });
    const bondsCheckbox = within(commonControls).getByRole("checkbox", {
      name: "Bonds",
    });
    const unitCellCheckbox = within(commonControls).getByRole("checkbox", {
      name: "Unit cell",
    });
    const polyhedraCheckbox = within(commonControls).getByRole("checkbox", {
      name: "Polyhedra",
    });

    expect(polyhedraCheckbox.getAttribute("aria-checked")).toBe("false");
    await user.click(polyhedraCheckbox);
    expect(polyhedraCheckbox.getAttribute("aria-checked")).toBe("true");

    await user.click(atomsCheckbox);
    expect(atomsCheckbox.getAttribute("aria-checked")).toBe("false");
    expect(polyhedraCheckbox.getAttribute("aria-checked")).toBe("true");

    await user.click(polyhedraCheckbox);
    expect(polyhedraCheckbox.getAttribute("aria-checked")).toBe("false");
    expect(atomsCheckbox.getAttribute("aria-checked")).toBe("false");

    await user.click(bondsCheckbox);
    await user.click(unitCellCheckbox);
    expect(bondsCheckbox.getAttribute("aria-checked")).toBe("false");
    expect(unitCellCheckbox.getAttribute("aria-checked")).toBe("false");
    expect(polyhedraCheckbox.getAttribute("aria-checked")).toBe("false");
  });

  test("shows disabled unchecked Polyhedra control when the scene has no polyhedra", async () => {
    const user = userEvent.setup();

    await renderLoadedStructure(user, sceneWithPeriodicImages({ polyhedra: false }));

    const polyhedraCheckbox = screen.getByRole("checkbox", {
      name: "Polyhedra",
    }) as HTMLButtonElement;
    expect(polyhedraCheckbox.disabled).toBe(true);
    expect(polyhedraCheckbox.getAttribute("aria-checked")).toBe("false");
  });

  test("manages component opacity with clamped numeric input and opacity-only reset", async () => {
    const user = userEvent.setup();

    await renderLoadedStructure(user);

    const commonControls = screen.getByRole("complementary", { name: "Common controls" });
    // Show polyhedra and hide atoms via the Display tab checkboxes first.
    const polyhedraCheckbox = within(commonControls).getByRole("checkbox", {
      name: "Polyhedra",
    });
    await user.click(polyhedraCheckbox);
    expect(polyhedraCheckbox.getAttribute("aria-checked")).toBe("true");
    const atomsCheckbox = within(commonControls).getByRole("checkbox", { name: "Atoms" });
    await user.click(atomsCheckbox);
    expect(atomsCheckbox.getAttribute("aria-checked")).toBe("false");

    await user.click(within(commonControls).getByRole("tab", { name: "Style" }));
    const resetOpacityButton = within(commonControls).getByRole("button", {
      name: "Reset opacity",
    }) as HTMLButtonElement;
    const atomsOpacityInput = within(commonControls).getByRole("textbox", {
      name: "Atoms opacity value",
    }) as HTMLInputElement;
    const atomsOpacitySlider = within(commonControls).getByRole("slider", {
      name: "Atoms opacity",
    }) as HTMLInputElement;
    const unitCellOpacityInput = within(commonControls).getByRole("textbox", {
      name: "Unit cell opacity value",
    }) as HTMLInputElement;
    const bondsOpacityInput = within(commonControls).getByRole("textbox", {
      name: "Bonds opacity value",
    }) as HTMLInputElement;
    const polyhedraOpacityInput = within(commonControls).getByRole("textbox", {
      name: "Polyhedra opacity value",
    }) as HTMLInputElement;
    const polyhedraOpacitySlider = within(commonControls).getByRole("slider", {
      name: "Polyhedra opacity",
    }) as HTMLInputElement;

    expect(resetOpacityButton.disabled).toBe(false);
    expect(atomsOpacityInput.value).toBe("100");
    expect(atomsOpacityInput.parentElement?.textContent).toContain("%");
    expect(bondsOpacityInput.value).toBe("100");
    expect(polyhedraOpacityInput.value).toBe("75");
    expect(polyhedraOpacitySlider.max).toBe("100");

    // Hidden atoms disable the opacity row without touching its value.
    expect(atomsOpacityInput.disabled).toBe(true);
    expect(atomsOpacitySlider.disabled).toBe(true);

    await user.clear(polyhedraOpacityInput);
    await user.type(polyhedraOpacityInput, "80%{Enter}");

    expect(polyhedraOpacityInput.value).toBe("80");
    expect(polyhedraOpacitySlider.value).toBe("80");

    fireEvent.change(polyhedraOpacitySlider, { target: { value: "99" } });

    expect(polyhedraOpacityInput.value).toBe("100");
    expect(polyhedraOpacitySlider.value).toBe("100");

    await user.clear(unitCellOpacityInput);
    await user.type(unitCellOpacityInput, "20{Enter}");

    expect(unitCellOpacityInput.value).toBe("20");

    await user.clear(unitCellOpacityInput);
    await user.type(unitCellOpacityInput, "-20{Enter}");

    expect(unitCellOpacityInput.value).toBe("20");

    await user.click(resetOpacityButton);

    expect(unitCellOpacityInput.value).toBe("100");
    expect(bondsOpacityInput.value).toBe("100");
    expect(polyhedraOpacityInput.value).toBe("75");
    expect(resetOpacityButton.className).toContain("tool-icon-button-reset-feedback");
    await waitFor(() =>
      expect(resetOpacityButton.className).not.toContain("tool-icon-button-reset-feedback"),
    );
    expect(resetOpacityButton.disabled).toBe(false);

    // The reset only touches opacity; the Display visibility toggles keep state.
    await user.click(within(commonControls).getByRole("tab", { name: "Display" }));
    expect(
      within(commonControls).getByRole("checkbox", { name: "Atoms" }).getAttribute(
        "aria-checked",
      ),
    ).toBe("false");
  });

  test("lets style controls scale sizes and choose bond color mode", async () => {
    const user = userEvent.setup();

    await renderLoadedStructure(user);

    const commonControls = screen.getByRole("complementary", { name: "Common controls" });
    await user.click(within(commonControls).getByRole("tab", { name: "Style" }));

    expect(within(commonControls).getByText("Size").isConnected).toBe(true);
    const atomRadiusModelButton = within(commonControls).getByRole("button", {
      name: "Atom radius model: Uniform",
    });
    const atomRadiusSlider = within(commonControls).getByRole("slider", {
      name: "Atom scale",
    }) as HTMLInputElement;
    const atomRadiusInput = within(commonControls).getByRole("textbox", {
      name: "Atom scale value",
    }) as HTMLInputElement;
    const bondThicknessSlider = within(commonControls).getByRole("slider", {
      name: "Bond scale",
    }) as HTMLInputElement;
    const bondThicknessInput = within(commonControls).getByRole("textbox", {
      name: "Bond scale value",
    }) as HTMLInputElement;
    const bondStyleSelect = within(commonControls).getByRole("combobox", {
      name: "Bond style",
    });
    const colorSchemeSelect = within(commonControls).getByRole("combobox", {
      name: "Color scheme",
    });
    const materialSelect = within(commonControls).getByRole("combobox", {
      name: "Material",
    });
    const fogSwitch = within(commonControls).getByRole("switch", {
      name: "Depth cueing",
    });
    const fogStartSlider = within(commonControls).getByRole("slider", {
      name: "Depth cueing start",
    }) as HTMLInputElement;
    const fogStartInput = within(commonControls).getByRole("textbox", {
      name: "Depth cueing start value",
    }) as HTMLInputElement;
    const fogAmountSlider = within(commonControls).getByRole("slider", {
      name: "Depth cueing amount",
    }) as HTMLInputElement;
    const fogAmountInput = within(commonControls).getByRole("textbox", {
      name: "Depth cueing amount value",
    }) as HTMLInputElement;
    const resetFogButton = within(commonControls).getByRole("button", {
      name: "Reset depth cueing",
    }) as HTMLButtonElement;

    expect(atomRadiusSlider.min).toBe("0");
    expect(atomRadiusSlider.max).toBe("100");
    expect(atomRadiusSlider.value).toBe("40");
    expect(atomRadiusInput.value).toBe("40");
    expect(atomRadiusInput.parentElement?.textContent).toContain("%");
    expect(bondThicknessSlider.max).toBe("200");
    expect(bondThicknessSlider.value).toBe("100");
    expect(bondThicknessInput.value).toBe("100");
    expect(commonControls.querySelectorAll(".opacity-slider-snap-marker")).toHaveLength(0);
    expect(within(commonControls).getByText("Atom").isConnected).toBe(true);
    expect(materialSelect.textContent).toContain("Modern Matte");
    expect(bondStyleSelect.textContent).toContain("Bicolor");
    expect(within(commonControls).queryByRole("button", { name: "Bond color" })).toBeNull();
    expect(colorSchemeSelect.textContent).toContain("VESTA Soft");
    await user.click(colorSchemeSelect);
    expect(await screen.findByRole("option", { name: "Custom" })).toBeTruthy();
    await user.click(await screen.findByRole("option", { name: "Custom" }));
    expect(colorSchemeSelect.textContent).toContain("Custom");
    expect((screen.getByLabelText("Na color value") as HTMLInputElement).value).toBe("#e7d15f");
    await user.click(colorSchemeSelect);
    await user.click(await screen.findByRole("option", { name: "Jmol" }));
    await user.click(colorSchemeSelect);
    await user.click(await screen.findByRole("option", { name: "Custom" }));
    expect((screen.getByLabelText("Na color value") as HTMLInputElement).value).toBe("#ab5cf2");
    await user.click(colorSchemeSelect);
    await user.click(await screen.findByRole("option", { name: "VESTA Soft" }));
    expect(fogSwitch.getAttribute("aria-checked")).toBe("true");
    expect(fogStartSlider.value).toBe("40");
    expect(fogStartInput.value).toBe("40");
    expect(fogAmountSlider.value).toBe("40");
    expect(fogAmountInput.value).toBe("40");
    expect(fogStartSlider.disabled).toBe(false);
    expect(fogStartInput.disabled).toBe(false);
    expect(fogAmountSlider.disabled).toBe(false);
    expect(fogAmountInput.disabled).toBe(false);

    await user.click(atomRadiusModelButton);
    expect(await screen.findByRole("listbox", { name: "Atom radius model" })).toBeTruthy();
    await user.click(await screen.findByRole("option", { name: "Van der Waals" }));

    expect(fetchCalls).toHaveLength(1);
    expect(atomRadiusModelButton.getAttribute("aria-label")).toBe(
      "Atom radius model: Van der Waals",
    );

    await user.click(bondStyleSelect);
    expect(await screen.findByRole("option", { name: "Bicolor" })).toBeTruthy();
    expect(screen.queryByRole("option", { name: "Uniform (2D)" })).toBeNull();
    await user.click(await screen.findByRole("option", { name: "Unicolor" }));

    expect(bondStyleSelect.textContent).toContain("Unicolor");
    expect(
      within(within(commonControls).getByText("Material").closest("div") ?? commonControls)
        .queryByRole("button", { name: "Bond color" }),
    ).toBeNull();
    const bondColorButton = within(
      within(commonControls).getByText("Bond style").closest("div") ?? commonControls,
    ).getByRole("button", {
      name: "Bond color",
    });
    await user.click(bondColorButton);
    const bondColorInput = within(
      within(commonControls).getByText("Bond style").closest("div") ?? commonControls,
    ).getByLabelText("Bond color value") as HTMLInputElement;
    expect(bondColorInput.type).toBe("color");
    expect(bondColorInput.value).toBe("#d2d2d2");
    fireEvent.change(bondColorInput, { target: { value: "#999999" } });
    expect(bondColorInput.value).toBe("#999999");
    expect(screen.queryByLabelText("Alpha transparency percentage")).toBeNull();
    await user.click(bondStyleSelect);
    await user.click(await screen.findByRole("option", { name: "Bicolor" }));
    expect(bondStyleSelect.textContent).toContain("Bicolor");
    expect(within(commonControls).queryByRole("button", { name: "Bond color" })).toBeNull();
    await user.click(bondStyleSelect);
    await user.click(await screen.findByRole("option", { name: "Unicolor" }));
    expect(
      (
        within(
          within(commonControls).getByText("Bond style").closest("div") ?? commonControls,
        ).getByLabelText("Bond color value") as HTMLInputElement
      ).value,
    ).toBe("#d2d2d2");
    expect(fetchCalls).toHaveLength(1);

    const sodiumColorButton = screen.getByRole("button", { name: "Set Na color" });
    expect(sodiumColorButton.isConnected).toBe(true);
    const sodiumColorInput = screen.getByLabelText("Na color value") as HTMLInputElement;
    expect(sodiumColorInput.value).toBe("#e7d15f");
    const sodiumShowPicker = mock(() => {});
    Object.defineProperty(sodiumColorInput, "showPicker", {
      configurable: true,
      value: sodiumShowPicker,
    });
    await user.click(sodiumColorButton);
    expect(sodiumShowPicker).toHaveBeenCalledTimes(1);
    await user.click(sodiumColorButton);
    expect(sodiumShowPicker).toHaveBeenCalledTimes(1);
    fireEvent.change(sodiumColorInput, { target: { value: "#112233" } });
    expect(colorSchemeSelect.textContent).toContain("Custom");

    await user.click(colorSchemeSelect);
    await user.click(await screen.findByRole("option", { name: "Jmol" }));
    expect(colorSchemeSelect.textContent).toContain("Jmol");

    await user.click(colorSchemeSelect);
    await user.click(await screen.findByRole("option", { name: "Custom" }));
    expect(colorSchemeSelect.textContent).toContain("Custom");
    expect(sodiumColorInput.value).toBe("#112233");

    await user.click(colorSchemeSelect);
    await user.click(await screen.findByRole("option", { name: "Jmol" }));

    expect(colorSchemeSelect.textContent).toContain("Jmol");
    expect(fetchCalls).toHaveLength(1);

    fireEvent.change(fogStartSlider, { target: { value: "18" } });
    fireEvent.change(fogAmountSlider, { target: { value: "72" } });

    expect(fogStartInput.value).toBe("18");
    expect(fogStartSlider.value).toBe("18");
    expect(fogAmountInput.value).toBe("72");
    expect(fogAmountSlider.value).toBe("72");

    fireEvent.change(atomRadiusSlider, { target: { value: "100" } });

    expect(atomRadiusInput.value).toBe("100");
    expect(atomRadiusSlider.value).toBe("100");

    fireEvent.change(atomRadiusSlider, { target: { value: "44" } });

    expect(atomRadiusInput.value).toBe("44");
    expect(atomRadiusSlider.value).toBe("44");

    await user.clear(bondThicknessInput);
    await user.type(bondThicknessInput, "240{Enter}");

    expect(bondThicknessInput.value).toBe("200");
    expect(bondThicknessSlider.value).toBe("200");

    await user.clear(bondThicknessInput);
    await user.type(bondThicknessInput, "240{Enter}");

    expect(bondThicknessInput.value).toBe("200");
    expect(bondThicknessSlider.value).toBe("200");

    await user.clear(atomRadiusInput);
    await user.type(atomRadiusInput, "50{Enter}");

    expect(atomRadiusInput.value).toBe("50");
    expect(atomRadiusSlider.value).toBe("50");

    await user.clear(atomRadiusInput);
    await user.type(atomRadiusInput, "-10{Enter}");

    expect(atomRadiusInput.value).toBe("50");
    expect(atomRadiusSlider.value).toBe("50");

    const resetScaleButton = within(commonControls).getByRole("button", {
      name: "Reset scale",
    }) as HTMLButtonElement;
    await user.click(resetScaleButton);

    expect(resetScaleButton.className).toContain("tool-icon-button-reset-feedback");
    expect(atomRadiusInput.value).toBe("40");
    expect(atomRadiusSlider.value).toBe("40");
    expect(bondThicknessInput.value).toBe("100");
    expect(bondThicknessSlider.value).toBe("100");
    expect(atomRadiusModelButton.getAttribute("aria-label")).toBe(
      "Atom radius model: Van der Waals",
    );
    expect(bondStyleSelect.textContent).toContain("Unicolor");
    expect(colorSchemeSelect.textContent).toContain("Jmol");
    expect(fogSwitch.getAttribute("aria-checked")).toBe("true");
    expect(fogStartInput.value).toBe("18");
    expect(fogAmountInput.value).toBe("72");

    await user.click(resetFogButton);

    expect(resetFogButton.className).toContain("tool-icon-button-reset-feedback");
    expect(fogSwitch.getAttribute("aria-checked")).toBe("true");
    expect(fogStartInput.value).toBe("40");
    expect(fogStartSlider.value).toBe("40");
    expect(fogAmountInput.value).toBe("40");
    expect(fogAmountSlider.value).toBe("40");
    expect(fogStartSlider.disabled).toBe(false);
    expect(fogStartInput.disabled).toBe(false);
    expect(fogAmountSlider.disabled).toBe(false);
    expect(fogAmountInput.disabled).toBe(false);
  });

  test("selects material presets without re-uploading or changing other style controls", async () => {
    const user = userEvent.setup();

    await renderLoadedStructure(user);

    const commonControls = screen.getByRole("complementary", { name: "Common controls" });
    await user.click(within(commonControls).getByRole("tab", { name: "Style" }));

    const materialSelect = within(commonControls).getByRole("combobox", {
      name: "Material",
    });
    const bondStyleSelect = within(commonControls).getByRole("combobox", {
      name: "Bond style",
    });
    const colorSchemeSelect = within(commonControls).getByRole("combobox", {
      name: "Color scheme",
    });

    await user.click(bondStyleSelect);
    await user.click(await screen.findByRole("option", { name: "Unicolor" }));
    await user.click(colorSchemeSelect);
    await user.click(await screen.findByRole("option", { name: "Jmol" }));

    const atomsOpacityInput = within(commonControls).getByRole("textbox", {
      name: "Atoms opacity value",
    }) as HTMLInputElement;
    await user.clear(atomsOpacityInput);
    await user.type(atomsOpacityInput, "64{Enter}");

    const nextMaterialSelect = within(commonControls).getByRole("combobox", {
      name: "Material",
    });
    const nextBondStyleSelect = within(commonControls).getByRole("combobox", {
      name: "Bond style",
    });
    const nextColorSchemeSelect = within(commonControls).getByRole("combobox", {
      name: "Color scheme",
    });
    await user.click(nextMaterialSelect);
    await user.click(await screen.findByRole("option", { name: "Glossy" }));

    expect(nextMaterialSelect.textContent).toContain("Glossy");
    expect(nextBondStyleSelect.textContent).toContain("Unicolor");
    expect(nextColorSchemeSelect.textContent).toContain("Jmol");
    expect(fetchCalls).toHaveLength(1);

    expect(atomsOpacityInput.value).toBe("64");
  });

  test("lets export controls update settings and route PNG and PDF actions", async () => {
    const user = userEvent.setup();

    await renderLoadedStructure(user);

    const commonControls = screen.getByRole("complementary", { name: "Common controls" });
    await user.click(within(commonControls).getByRole("tab", { name: "Export" }));

    expect(within(commonControls).queryByText("No controls")).toBeNull();
    const widthInput = within(commonControls).getByRole("textbox", {
      name: "Export width",
    }) as HTMLInputElement;
    const heightInput = within(commonControls).getByRole("textbox", {
      name: "Export height",
    }) as HTMLInputElement;
    const twoXSupersampling = within(commonControls).getByRole("tab", {
      name: "2x supersampling",
    });
    const oneXSupersampling = within(commonControls).getByRole("tab", {
      name: "1x supersampling",
    });
    const highMeshQuality = within(commonControls).getByRole("tab", {
      name: "High 3D Mesh Quality",
    });
    const xHighMeshQuality = within(commonControls).getByRole("tab", {
      name: "XHigh 3D Mesh Quality",
    });
    const resetQualityButton = within(commonControls).getByRole("button", {
      name: "Reset render settings",
    }) as HTMLButtonElement;
    const formatSelect = within(commonControls).getByRole("combobox", {
      name: "Format",
    });
    let backgroundButton = within(commonControls).getByRole("button", {
      name: "Background: Transparent",
    });
    const exportPngButton = within(commonControls).getByRole("button", {
      name: "Export PNG",
    });
    const structureCheckbox = within(commonControls).getByRole("checkbox", {
      name: "Export Structure",
    });
    const crystalAxesCheckbox = within(commonControls).getByRole("checkbox", {
      name: "Export Crystal axes",
    });
    const legendCheckbox = within(commonControls).getByRole("checkbox", {
      name: "Export Legend",
    });
    const combineSwitch = within(commonControls).getByRole("switch", {
      name: "Combine selected components",
    });
    const legendLayoutSelect = within(commonControls).getByRole("combobox", {
      name: "Legend layout",
    });

    expect(widthInput.value).toBe("2000");
    expect(heightInput.value).toBe("2000");
    expect(structureCheckbox.getAttribute("aria-checked")).toBe("true");
    expect(crystalAxesCheckbox.getAttribute("aria-checked")).toBe("false");
    expect(legendCheckbox.getAttribute("aria-checked")).toBe("false");
    expect(combineSwitch.getAttribute("aria-checked")).toBe("true");
    expect(legendLayoutSelect.textContent).toContain("Horizontal");
    expect(legendLayoutSelect.getAttribute("disabled")).not.toBeNull();
    expect(twoXSupersampling.getAttribute("aria-selected")).toBe("true");
    expect(highMeshQuality.getAttribute("aria-selected")).toBe("true");
    expect(formatSelect.textContent).toContain("PNG");
    expect(exportPngButton.isConnected).toBe(true);

    await user.click(combineSwitch);
    expect(combineSwitch.getAttribute("aria-checked")).toBe("false");

    await user.click(crystalAxesCheckbox);
    await user.click(legendCheckbox);
    expect(legendLayoutSelect.getAttribute("disabled")).toBeNull();
    await user.click(legendLayoutSelect);
    await user.click(await screen.findByRole("option", { name: "Vertical" }));
    await user.click(backgroundButton);
    expect(await screen.findByText("Background")).toBeTruthy();
    await user.click(await screen.findByRole("option", { name: "Black" }));
    backgroundButton = within(commonControls).getByRole("button", {
      name: "Background: Black",
    });
    expect(backgroundButton.isConnected).toBe(true);

    await user.click(exportPngButton);
    await waitFor(() => expect(exportRequests).toHaveLength(1));

    expect(exportRequests[0]?.settings.format).toBe("png");
    expect(exportRequests[0]?.settings.background).toBe("black");
    expect(exportRequests[0]?.settings.components).toEqual({
      legend: true,
      crystalAxes: true,
      structure: true,
    });
    expect(exportRequests[0]?.settings.legendLayout).toBe("vertical");
    expect(exportRequests[0]?.settings.supersampling).toBe(2);
    expect(exportZipDownloads[0]?.sourceFileName).toBe("NaCl.cif");
    expect(exportZipDownloads[0]?.files.map((file) => file.fileName)).toEqual([
      "NaCl.png",
      "NaCl-crystal-axes.png",
      "NaCl-legend.png",
    ]);

    await user.clear(widthInput);
    await user.type(widthInput, "3000{Enter}");

    expect(widthInput.value).toBe("3000");
    expect(heightInput.value).toBe("2000");

    await user.click(
      within(commonControls).getByRole("button", { name: "Lock aspect ratio" }),
    );
    await user.clear(heightInput);
    await user.type(heightInput, "1000{Enter}");

    expect(widthInput.value).toBe("1084");
    expect(heightInput.value).toBe("1000");

    await user.click(oneXSupersampling);
    await user.click(xHighMeshQuality);
    await user.click(formatSelect);
    await user.click(await screen.findByRole("option", { name: "PDF" }));
    expect(formatSelect.textContent).toContain("PDF");
    backgroundButton = within(commonControls).getByRole("button", {
      name: "Background: Black",
    });
    expect(oneXSupersampling.getAttribute("aria-selected")).toBe("true");
    expect(xHighMeshQuality.getAttribute("aria-selected")).toBe("true");

    await user.click(resetQualityButton);

    expect(resetQualityButton.className).toContain("tool-icon-button-reset-feedback");
    expect(widthInput.value).toBe("2000");
    expect(heightInput.value).toBe("2000");
    expect(twoXSupersampling.getAttribute("aria-selected")).toBe("true");
    expect(highMeshQuality.getAttribute("aria-selected")).toBe("true");
    expect(formatSelect.textContent).toContain("PDF");
    backgroundButton = within(commonControls).getByRole("button", {
      name: "Background: Black",
    });
    expect(
      within(commonControls).getByRole("button", { name: "Lock aspect ratio" }).isConnected,
    ).toBe(true);

    const exportPdfButton = within(commonControls).getByRole("button", {
      name: "Export PDF",
    });
    await user.click(exportPdfButton);
    await waitFor(() => expect(exportRequests).toHaveLength(2));

    expect(exportRequests[1]?.settings).toMatchObject({
      aspectRatioLocked: false,
      background: "black",
      format: "pdf",
      height: 2000,
      meshQuality: "high",
      supersampling: 2,
      width: 2000,
    });
    expect(exportZipDownloads[1]?.sourceFileName).toBe("NaCl.cif");
    expect(exportZipDownloads[1]?.files.map((file) => file.fileName)).toEqual([
      "NaCl.pdf",
      "NaCl-crystal-axes.pdf",
      "NaCl-legend.pdf",
    ]);

    await user.click(formatSelect);
    await user.click(await screen.findByRole("option", { name: "JPG" }));
    expect(formatSelect.textContent).toContain("JPG");
    backgroundButton = within(commonControls).getByRole("button", {
      name: "Background: Black",
    });
    await user.click(backgroundButton);
    expect(screen.queryByRole("option", { name: "Transparent" })).toBeNull();
    await user.click(await screen.findByRole("option", { name: "White" }));
    backgroundButton = within(commonControls).getByRole("button", {
      name: "Background: White",
    });
    expect(backgroundButton.isConnected).toBe(true);

    const exportJpgButton = within(commonControls).getByRole("button", {
      name: "Export JPG",
    });
    await user.click(exportJpgButton);
    await waitFor(() => expect(exportRequests).toHaveLength(3));

    expect(exportRequests[2]?.settings).toMatchObject({
      background: "white",
      format: "jpg",
    });
    expect(exportZipDownloads[2]?.files.map((file) => file.fileName)).toEqual([
      "NaCl.jpg",
      "NaCl-crystal-axes.jpg",
      "NaCl-legend.jpg",
    ]);

    await user.click(combineSwitch);
    await user.click(exportJpgButton);
    await waitFor(() => expect(exportRequests).toHaveLength(4));

    expect(exportRequests[3]?.settings.combineComponents).toBe(true);
    expect(exportDirectDownloads[0]?.sourceFileName).toBe("NaCl.cif");
    expect(exportDirectDownloads[0]?.file.fileName).toBe("NaCl.jpg");
  });

  test("shows recoverable export errors without losing the loaded scene", async () => {
    const user = userEvent.setup();

    await renderLoadedStructure(user);
    exportFailure = new Error("WebGL export failed.");

    const commonControls = screen.getByRole("complementary", { name: "Common controls" });
    await user.click(within(commonControls).getByRole("tab", { name: "Export" }));
    await user.click(within(commonControls).getByRole("button", { name: "Export PNG" }));

    await waitFor(() =>
      expect(
        within(commonControls)
          .getByRole("status")
          .getAttribute("aria-label"),
      ).toContain("WebGL export failed."),
    );
    expect(screen.getByTestId("lattice-canvas").isConnected).toBe(true);
    expect(exportDirectDownloads).toHaveLength(0);
    expect(exportZipDownloads).toHaveLength(0);
  });

  test("uses a single sliding active indicator for tab animation", async () => {
    const user = userEvent.setup();

    await renderLoadedStructure(user);

    const commonControls = screen.getByRole("complementary", { name: "Common controls" });
    const content = commonControls.querySelector("[data-slot='common-controls-content']");
    expect(content?.className).toContain("transition-[height]");
    expect(content?.className).not.toContain("h-[");
    expect(content?.className).not.toContain("min-h");
    const activeIndicator = commonControls.querySelector(
      "[data-slot='common-controls-active-indicator']",
    ) as HTMLElement | null;
    const tabsList = commonControls.querySelector("[data-slot='tabs-list']") as HTMLElement | null;
    expect(tabsList?.style.gridTemplateColumns).toContain("2fr");
    expect(activeIndicator).not.toBeNull();
    expect(
      within(commonControls)
        .getAllByRole("tab")
        .map((tab) => tab.getAttribute("aria-label")),
    ).toEqual(["Display", "Style", "Export"]);
    const displayTab = within(commonControls).getByRole("tab", { name: "Display" });
    const styleTab = within(commonControls).getByRole("tab", { name: "Style" });
    expect(displayTab.style.flexGrow).toBe("");
    expect(styleTab.style.flexGrow).toBe("");
    expect(styleTab.className).not.toContain("transition-[flex-grow");
    expect(
      styleTab.querySelector("[data-slot='common-controls-tab-label']")?.className,
    ).toContain("max-w-0");

    await user.click(styleTab);

    expect(content?.className).not.toContain("h-[");
    expect(within(commonControls).getByRole("tab", { name: "Style" }).textContent).toContain(
      "Style",
    );
    expect(tabsList?.style.gridTemplateColumns).toContain("2fr");
    expect(
      within(commonControls)
        .getByRole("tab", { name: "Style" })
        .querySelector("[data-slot='common-controls-tab-label']")
        ?.className,
    ).toContain("max-w-16");
    expect(
      within(commonControls)
        .getByRole("tab", { name: "Display" })
        .querySelector("[data-slot='common-controls-tab-label']")
        ?.className,
    ).toContain("max-w-0");

    await user.click(within(commonControls).getByRole("tab", { name: "Display" }));

    expect(content?.className).not.toContain("h-[");
  });

  test("shows crystal camera controls with fixed manual vector editing", async () => {
    const user = userEvent.setup();

    await renderLoadedStructure(user);

    const commonControls = screen.getByRole("complementary", { name: "View controls" });
    await user.click(within(commonControls).getByRole("button", { name: "Pose" }));

    expect(within(commonControls).queryByText("No controls")).toBeNull();
    expect(within(commonControls).getByText("Primary Axis").isConnected).toBe(true);
    expect(within(commonControls).queryByText("Primary direction")).toBeNull();
    expect(
      within(commonControls).getByRole("button", { name: "Z Out" }).getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      within(commonControls).getByRole("button", { name: "X Right" }).getAttribute("aria-pressed"),
    ).toBe("false");
    expect(within(commonControls).getByRole("slider", { name: "Roll" }).getAttribute("aria-valuenow"))
      .toBe("344");
    expect(within(commonControls).getByRole("slider", { name: "Roll" }).getAttribute("aria-valuemin"))
      .toBe("0");
    expect(within(commonControls).getByRole("slider", { name: "Roll" }).getAttribute("aria-valuemax"))
      .toBe("360");
    const initialRollInput = within(commonControls).getByRole("textbox", {
      name: "Roll value",
    }) as HTMLInputElement;
    expect(initialRollInput).toHaveProperty("value", "344");
    expect(initialRollInput.style.width).toBe("3ch");
    expect(initialRollInput.nextElementSibling?.textContent).toBe("°");
    const rollSlider = within(commonControls).getByRole("slider", { name: "Roll" });
    expect(rollSlider.className).not.toContain("focus-visible:ring-[3px]");
    expect(
      rollSlider.querySelector("[data-slot='angle-slider-thumb']")?.className,
    ).toContain("group-focus-visible:ring-[2px]");

    expect(within(commonControls).getByText("Manual input").isConnected).toBe(true);
    expect(
      within(commonControls).getByRole("button", { name: "Manual input rules" }).isConnected,
    ).toBe(true);
    expect(
      within(commonControls)
        .getAllByRole("textbox")
        .map((textbox) => textbox.getAttribute("aria-label")),
    ).toEqual([
      "Zoom percentage input",
      "Roll value",
      "z a",
      "z b",
      "z c",
      "y a*",
      "y b*",
      "y c*",
    ]);
    expect(
      within(commonControls).getByRole("textbox", { name: "z a" }),
    ).toHaveProperty("value", "1.00");
    expect(
      within(commonControls).getByRole("textbox", { name: "z b" }),
    ).toHaveProperty("value", "0.33");
    expect(
      within(commonControls).getByRole("textbox", { name: "z c" }),
    ).toHaveProperty("value", "0.17");
    expect(
      within(commonControls).getByRole("textbox", { name: "y b*" }),
    ).toHaveProperty("value", "-0.05");
    expect(
      within(commonControls).getByRole("textbox", { name: "y c*" }),
    ).toHaveProperty("value", "1.00");
    expect(
      within(commonControls).getByRole("button", { name: "y secondary axis" }).textContent,
    ).toBe("y");
    expect(
      within(commonControls)
        .getByRole("textbox", { name: "z a" })
        .closest('[data-camera-vector-row="z"]')
        ?.getAttribute("data-primary-axis"),
    ).toBe("true");
    expect(
      within(commonControls)
        .getByRole("textbox", { name: "y a*" })
        .closest('[data-camera-vector-row="y"]')
        ?.hasAttribute("data-primary-axis"),
    ).toBe(false);
  });

  test("formats roll controls as zero to 360 degrees", async () => {
    const user = userEvent.setup();

    await renderLoadedStructure(user);

    const commonControls = screen.getByRole("complementary", { name: "View controls" });
    await user.click(within(commonControls).getByRole("button", { name: "Pose" }));

    const rollInput = within(commonControls).getByRole("textbox", {
      name: "Roll value",
    }) as HTMLInputElement;
    await user.click(rollInput);

    expect(rollInput.value).toBe("");
    expect(rollInput.style.width).toBe("1ch");

    await user.tab();

    expect(rollInput.value).toBe("344");

    await user.click(rollInput);
    await user.type(rollInput, "-90{Enter}");

    expect(rollInput.value).toBe("270");
    expect(rollInput.style.width).toBe("3ch");
    expect(rollInput.nextElementSibling?.textContent).toBe("°");
    expect(
      within(commonControls).getByRole("slider", { name: "Roll" }).getAttribute("aria-valuenow"),
    ).toBe("270");

    await user.click(rollInput);
    await user.type(rollInput, "-0.00001{Enter}");

    expect(rollInput.value).toBe("0");
    expect(rollInput.style.width).toBe("1ch");
    expect(
      within(commonControls).getByRole("slider", { name: "Roll" }).getAttribute("aria-valuenow"),
    ).toBe("0");

    expect(
      within(commonControls).queryByRole("button", { name: "Reset roll" }),
    ).toBeNull();
  });

  test("applies camera vector edits instantly and restores formatting on blur", async () => {
    const user = userEvent.setup();

    await renderLoadedStructure(user);

    const commonControls = screen.getByRole("complementary", { name: "View controls" });
    await user.click(within(commonControls).getByRole("button", { name: "Pose" }));

    // The batch reset/apply buttons are gone; edits apply as you type.
    expect(
      within(commonControls).queryByRole("button", { name: "Reset vectors draft" }),
    ).toBeNull();
    expect(
      within(commonControls).queryByRole("button", { name: "Apply vectors" }),
    ).toBeNull();

    const outwardA = within(commonControls).getByRole("textbox", {
      name: "z a",
    }) as HTMLInputElement;
    const outwardC = within(commonControls).getByRole("textbox", {
      name: "z c",
    }) as HTMLInputElement;

    await user.click(outwardA);
    expect(outwardA.value).toBe("");

    await user.tab();
    expect(outwardA.value).toBe("1.00");

    await user.clear(outwardA);
    await user.type(outwardA, "1");

    // The typed text stays while focused; the other coefficients hold.
    expect(outwardA.value).toBe("1");
    expect(outwardC.value).toBe("0.17");

    await user.tab();

    // Blur restores the formatted representation of the applied pose.
    expect(outwardA.value).toBe("1.00");
    expect(outwardC.value).toBe("0.17");

    await user.clear(outwardA);
    await user.type(outwardA, "not-a-number");
    await user.tab();

    expect(outwardA.value).toBe("1.00");
  });

  test("swaps camera vector bases when primary direction changes", async () => {
    const user = userEvent.setup();

    await renderLoadedStructure(user);

    const commonControls = screen.getByRole("complementary", { name: "View controls" });
    await user.click(within(commonControls).getByRole("button", { name: "Pose" }));
    await user.click(within(commonControls).getByRole("button", { name: "Y Up" }));

    expect(
      within(commonControls).getByRole("button", { name: "Y Up" }).getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      within(commonControls)
        .getAllByRole("textbox")
        .map((textbox) => textbox.getAttribute("aria-label")),
    ).toEqual([
      "Zoom percentage input",
      "Roll value",
      "y a",
      "y b",
      "y c",
      "z a*",
      "z b*",
      "z c*",
    ]);
    expect(within(commonControls).getByRole("textbox", { name: "y b" }).isConnected)
      .toBe(true);
    expect(within(commonControls).getByRole("textbox", { name: "z c*" }).isConnected)
      .toBe(true);
    expect(
      within(commonControls)
        .getByRole("textbox", { name: "y b" })
        .closest('[data-camera-vector-row="y"]')
        ?.getAttribute("data-primary-axis"),
    ).toBe("true");
    expect(
      within(commonControls)
        .getByRole("textbox", { name: "z c*" })
        .closest('[data-camera-vector-row="z"]')
        ?.hasAttribute("data-primary-axis"),
    ).toBe(false);
    expect(within(commonControls).queryByRole("textbox", { name: "z c" })).toBeNull();

    await user.click(within(commonControls).getByRole("button", { name: "z secondary axis" }));

    expect(
      within(commonControls)
        .getAllByRole("textbox")
        .map((textbox) => textbox.getAttribute("aria-label")),
    ).toEqual([
      "Zoom percentage input",
      "Roll value",
      "y a",
      "y b",
      "y c",
      "x a*",
      "x b*",
      "x c*",
    ]);
    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 240));
    });

    expect(
      within(commonControls).getByRole("textbox", { name: "Roll value" }),
    ).toHaveProperty("value", "27");
  });

  test("routes gizmo clicks through the selected camera primary direction", async () => {
    const user = userEvent.setup();

    await renderLoadedStructure(user);

    await user.click(screen.getByRole("button", { name: "gizmo a" }));
    const commonControls = screen.getByRole("complementary", { name: "View controls" });
    await user.click(within(commonControls).getByRole("button", { name: "Pose" }));

    expect(
      within(commonControls).getByRole("textbox", { name: "z a" }),
    ).toHaveProperty("value", "1.00");
    expect(
      within(commonControls).getByRole("textbox", { name: "z c" }),
    ).toHaveProperty("value", "0.00");

    await user.click(within(commonControls).getByRole("button", { name: "Y Up" }));
    await user.click(screen.getByRole("button", { name: "gizmo c" }));

    expect(
      within(commonControls).getByRole("textbox", { name: "y c" }),
    ).toHaveProperty("value", "1.00");
  });

  test("starts with collapsed extended structure details and toggles them from the card", async () => {
    const user = userEvent.setup();

    await renderLoadedStructure(user);

    const structureCard = screen.getByRole("complementary", { name: "Current structure" });
    const detailsRegion = structureCard.querySelector(
      "[data-slot='structure-summary-details']",
    ) as HTMLElement | null;
    const detailsBody = structureCard.querySelector(
      "[data-slot='structure-summary-details-body']",
    ) as HTMLElement | null;
    const expandButton = within(structureCard).getByRole("button", {
      name: "Show details and PXRD",
    });

    expect(expandButton.getAttribute("aria-expanded")).toBe("false");
    expect(detailsRegion?.className).toContain("transition-[grid-template-rows]");
    expect(detailsRegion?.className).toContain("grid-rows-[0fr]");
    expect(detailsBody?.className).toContain("pt-0");

    await user.click(expandButton);

    const collapseButton = within(structureCard).getByRole("button", {
      name: "Hide details and PXRD",
    });
    expect(collapseButton.getAttribute("aria-expanded")).toBe("true");
    expect(detailsRegion?.className).toContain("grid-rows-[1fr]");
    expect(detailsBody?.className).toContain("pt-2.5");

    await user.click(collapseButton);

    expect(
      within(structureCard)
        .getByRole("button", { name: "Show details and PXRD" })
        .getAttribute("aria-expanded"),
    ).toBe("false");
    expect(detailsRegion?.className).toContain("grid-rows-[0fr]");
    expect(detailsBody?.className).toContain("pt-0");
  });

  test("keeps manually expanded structure details open when controls overflow the viewport", async () => {
    const user = userEvent.setup();

    await renderLoadedStructure(user);

    const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = () => ({
      bottom: 4096,
      height: 4096,
      left: 0,
      right: 296,
      top: 0,
      width: 296,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    } as DOMRect);

    try {
      const structureCard = screen.getByRole("complementary", { name: "Current structure" });
      const expandButton = within(structureCard).getByRole("button", {
        name: "Show details and PXRD",
      });

      await user.click(expandButton);
      fireEvent(window, new Event("resize"));

      await waitFor(() => {
        const collapseButton = within(structureCard).getByRole("button", {
          name: "Hide details and PXRD",
        });
        expect(collapseButton.getAttribute("aria-expanded")).toBe("true");
      });
    } finally {
      Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    }
  });

  test("keeps atom radius model local and reuploads when the bond algorithm changes", async () => {
    const user = userEvent.setup();

    await renderLoadedStructure(user);
    const commonControls = screen.getByRole("complementary", { name: "Common controls" });
    const polyhedraCheckbox = within(commonControls).getByRole("checkbox", {
      name: "Polyhedra",
    });
    await user.click(polyhedraCheckbox);
    await user.click(within(commonControls).getByRole("tab", { name: "Style" }));
    const atomRadiusModelButton = within(commonControls).getByRole("button", {
      name: "Atom radius model: Uniform",
    });
    await user.click(atomRadiusModelButton);
    await user.click(await screen.findByRole("option", { name: "Van der Waals" }));

    expect(fetchCalls).toHaveLength(1);

    await user.click(within(commonControls).getByRole("tab", { name: "Display" }));
    queueFetchResponse(jsonResponse(sceneWithPeriodicImages()));

    await user.click(screen.getByRole("combobox", { name: "Bonding algorithm" }));
    await user.click(await screen.findByRole("option", { name: "Minimum distance" }));

    await waitFor(() => expect(fetchCalls).toHaveLength(2));
    expect(fetchCalls[1]?.input).toBe(
      "/api/structure-preview?bondAlgorithm=minimum-distance",
    );
    expect(fetchCalls[1]?.init?.body).toBeInstanceOf(File);
    expect(polyhedraCheckbox.getAttribute("aria-checked")).toBe("true");

    queueFetchResponse(jsonResponse(sceneWithPeriodicImages()));
    await user.click(screen.getByRole("combobox", { name: "Bonding algorithm" }));
    await user.click(await screen.findByRole("option", { name: "CrystalNN" }));

    await waitFor(() => expect(fetchCalls).toHaveLength(3));
    expect(fetchCalls[2]?.input).toBe("/api/structure-preview?bondAlgorithm=crystal-nn");
    expect(fetchCalls[2]?.init?.body).toBeInstanceOf(File);
  });

  test("reuploads on reset all only when the current bond algorithm is not default", async () => {
    const user = userEvent.setup();

    await renderLoadedStructure(user);
    queueFetchResponse(jsonResponse(sceneWithPeriodicImages({ atomCount: 6 })));

    await user.click(screen.getByRole("combobox", { name: "Bonding algorithm" }));
    await user.click(await screen.findByRole("option", { name: "Minimum distance" }));

    await waitFor(() => expect(fetchCalls).toHaveLength(2));
    expect(fetchCalls[1]?.input).toBe(
      "/api/structure-preview?bondAlgorithm=minimum-distance",
    );
    expect(screen.getByRole("combobox", { name: "Bonding algorithm" }).textContent).toContain(
      "Minimum distance",
    );

    const commonControls = screen.getByRole("complementary", { name: "Common controls" });
    await user.click(within(commonControls).getByRole("checkbox", { name: "Atoms" }));
    await user.click(within(commonControls).getByRole("tab", { name: "Style" }));
    queueFetchResponse(jsonResponse(sceneWithPeriodicImages()));

    await openPreviewContextMenu();
    await user.click(await screen.findByRole("menuitem", { name: "Reset all" }));

    await waitFor(() => expect(fetchCalls).toHaveLength(3));
    expect(fetchCalls[2]?.input).toBe("/api/structure-preview");
    expect(fetchCalls[2]?.init?.body).toBeInstanceOf(File);

    const resetCommonControls = screen.getByRole("complementary", {
      name: "Common controls",
    });
    expect(
      within(resetCommonControls)
        .getByRole("tab", { name: "Style" })
        .getAttribute("aria-selected"),
    ).toBe("true");
    await user.click(within(resetCommonControls).getByRole("tab", { name: "Display" }));
    expect(
      screen.getByRole("checkbox", { name: "Atoms" }).getAttribute("aria-checked"),
    ).toBe("true");
    expect(screen.getByRole("combobox", { name: "Bonding algorithm" }).textContent).toContain(
      "CrystalNN",
    );
  });

  test("keeps the loaded scene when recomputing structure data fails", async () => {
    const user = userEvent.setup();

    await renderLoadedStructure(user);
    await user.click(screen.getByRole("combobox", { name: "Bonding algorithm" }));
    await user.click(await screen.findByRole("option", { name: "Minimum distance" }));

    await waitFor(() => expect(fetchCalls).toHaveLength(2));
    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Python backend is unavailable");
    expect(screen.getByTestId("lattice-canvas").isConnected).toBe(true);
    expect(screen.getByRole("combobox", { name: "Bonding algorithm" }).textContent).toContain(
      "CrystalNN",
    );
  });

  test("keeps view controls wired to lock, zoom, and reset state", async () => {
    const user = userEvent.setup();

    await renderLoadedStructure(user);

    await user.click(screen.getByRole("button", { name: "Lock mouse interaction" }));

    expect(
      screen.getByRole("button", { name: "Unlock mouse interaction" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("true");

    const zoomInput = screen.getByRole("textbox", { name: "Zoom percentage input" });
    const commonControls = screen.getByRole("complementary", { name: "View controls" });
    await user.click(within(commonControls).getByRole("button", { name: "Pose" }));
    const rollInput = within(commonControls).getByRole("textbox", {
      name: "Roll value",
    }) as HTMLInputElement;
    const standardViewRoll = rollInput.value;

    await user.clear(zoomInput);
    await user.type(zoomInput, "250{Enter}");

    expect((zoomInput as HTMLInputElement).value).toBe("250");

    await user.click(screen.getByRole("button", { name: "Reset view" }));

    expect((zoomInput as HTMLInputElement).value).toBe("100");
    expect(rollInput.value).toBe(standardViewRoll);
  });

  test("shows API parse errors without leaving a stale scene behind", async () => {
    const user = userEvent.setup();
    queueFetchResponse(errorResponse("Could not parse bad.cif: long backend parser detail."));

    render(<App />);

    await user.upload(getFileInput(), structureFile("bad.cif"));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Unsupported file");
    expect(alert.textContent).toContain("pymatgen could not parse this file.");
    expect(alert.textContent).not.toContain("bad.cif");
    expect(alert.textContent).not.toContain("long backend parser detail");
    const alertIcon = alert.querySelector("svg");
    expect(alertIcon).not.toBeNull();
    expect(alertIcon?.getAttribute("class")).toContain("lucide-triangle-alert");
    const structureCard = screen.getByRole("complementary", { name: "Current structure" });
    expect(alert.parentElement?.tagName).toBe("MAIN");
    expect(within(structureCard).queryByRole("alert")).toBeNull();
    expect(screen.queryByText("File")).toBeNull();
    expect(screen.queryByText("bad.cif")).toBeNull();
    expect(screen.getByText("Drop a structure file to preview").isConnected).toBe(true);
    expect(screen.queryByTestId("lattice-canvas")).toBeNull();
    expect(screen.queryByRole("button", { name: "Sidebar" })).toBeNull();
  });

  test("keeps the loaded scene when the server rejects new display options", async () => {
    const user = userEvent.setup();

    await renderLoadedStructure(user);
    queueFetchResponse(
      errorResponse(
        "A 6x6x6 supercell of this structure would contain 21600 atoms, above the 20000-atom limit.",
      ),
    );

    await user.click(screen.getByRole("combobox", { name: "Bonding algorithm" }));
    await user.click(await screen.findByRole("option", { name: "Minimum distance" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Preview failed");
    expect(alert.textContent).toContain("above the 20000-atom limit");
    expect(alert.textContent).not.toContain("Unsupported file");
    expect(alert.textContent).not.toContain("pymatgen could not parse this file.");

    // The structure stays loaded and the committed algorithm is unchanged.
    expect(screen.getByTestId("lattice-canvas").isConnected).toBe(true);
    const structureCard = screen.getByRole("complementary", { name: "Current structure" });
    expect(within(structureCard).getByText("NaCl.cif").isConnected).toBe(true);
    expect(
      screen.getByRole("combobox", { name: "Bonding algorithm" }).textContent,
    ).toContain("CrystalNN");

    // Let pending async work (lazy scene imports, paced animation frames)
    // land inside act before the next test renders.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 32));
    });
  });

  test("ignores a stale upload that resolves after a newer one", async () => {
    const user = userEvent.setup();

    render(<App />);

    // The first upload's response stays pending until the second completes.
    let releaseStaleResponse: () => void = () => {};
    const staleResponseReleased = new Promise<void>((resolve) => {
      releaseStaleResponse = resolve;
    });
    const staleScene = sceneWithPeriodicImages({ atomCount: 8 });
    queueFetchResponse({
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => {
        await staleResponseReleased;
        return staleScene;
      },
      ok: true,
    } as Response);
    await user.upload(getFileInput(), structureFile("first.cif"));

    queueFetchResponse(jsonResponse(sceneWithPeriodicImages({ atomCount: 2 })));
    await user.upload(getFileInput(), structureFile("second.cif"));
    await screen.findByTestId("lattice-canvas");

    releaseStaleResponse();
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const structureCard = screen.getByRole("complementary", { name: "Current structure" });
    expect(within(structureCard).getByText("second.cif").isConnected).toBe(true);
    expect(within(structureCard).getByText("2").isConnected).toBe(true);
    expect(within(structureCard).queryByText("8")).toBeNull();

    // Let pending async work (lazy scene imports, paced animation frames)
    // land inside act before the next test renders.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 32));
    });
  });

  test("shows a backend unavailable alert when the Python server cannot be reached", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.upload(getFileInput(), structureFile());

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Python backend is unavailable");
    expect(alert.textContent).toContain(
      "Start Pretty Crystal locally to upload or recompute structures.",
    );
    expect(alert.textContent).not.toContain("Backend is unavailable.");
    expect(alert.textContent).not.toContain("Unsupported file");
    expect(fetchCalls).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "Dismiss alert" }));

    expect(screen.queryByRole("alert")).toBeNull();
  });

  test("shows a backend unavailable alert when a static host returns an HTML API miss", async () => {
    const user = userEvent.setup();
    queueFetchResponse(htmlResponse(405));

    render(<App />);

    await user.upload(getFileInput(), structureFile());

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Python backend is unavailable");
    expect(alert.textContent).toContain(
      "Start Pretty Crystal locally to upload or recompute structures.",
    );
    expect(alert.textContent).not.toContain("Backend is unavailable.");
    expect(alert.textContent).not.toContain("pymatgen could not parse this file.");
  });

  test("shows a backend unavailable alert when a static fallback returns HTML as 200", async () => {
    const user = userEvent.setup();
    queueFetchResponse(htmlResponse(200));

    render(<App />);

    await user.upload(getFileInput(), structureFile());

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Python backend is unavailable");
    expect(alert.textContent).not.toContain("pymatgen could not parse this file.");
  });

  test("rejects oversized files before uploading", async () => {
    const user = userEvent.setup();

    render(<App />);

    const largeFile = new File(
      [new Uint8Array(1 * 1024 * 1024 + 1)],
      "movie.mp4",
      { type: "video/mp4" },
    );
    await user.upload(getFileInput(), largeFile);

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Unsupported file");
    expect(alert.textContent).toContain("File is too large to preview.");
    expect(screen.queryByText("File")).toBeNull();
    expect(screen.queryByText("movie.mp4")).toBeNull();
    expect(fetchCalls).toHaveLength(0);
    expect(screen.getByText("Drop a structure file to preview").isConnected).toBe(true);
  });

  test("shows non-fatal analysis warnings while keeping the scene visible", async () => {
    const user = userEvent.setup();
    queueFetchResponse(
      jsonResponse({
        ...sceneWithPeriodicImages(),
        warnings: [
          {
            code: "bond-analysis-failed",
            message: "Bond analysis with CrystalNN failed: neighbor graph unavailable",
          },
        ],
      }),
    );

    render(<App />);
    await user.upload(getFileInput(), structureFile());

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Bond analysis with CrystalNN failed",
    );
    const alert = screen.getByRole("alert");
    expect(alert.querySelector("svg")?.getAttribute("class")).toContain(
      "lucide-triangle-alert",
    );
    expect(screen.getByTestId("lattice-canvas").isConnected).toBe(true);

    await user.click(screen.getByRole("button", { name: "Dismiss alert" }));

    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByTestId("lattice-canvas").isConnected).toBe(true);
  });
});

function sceneWithPeriodicImages({
  atomCount = 2,
  polyhedra = true,
}: {
  atomCount?: number;
  polyhedra?: boolean;
} = {}): SceneSpec {
  return {
    atoms: [
      atom("Na-0", "Na", [0, 0, 0], [], []),
      atom("Na-0-image-1-0-0", "Na", [1, 0, 0], ["boundary"], [["boundaryAtoms"]]),
      atom("Cl-1", "Cl", [0, 0, 0], [], []),
      atom(
        "Cl-1-image-0--1-0",
        "Cl",
        [0, -1, 0],
        ["bonded"],
        [["oneHopBondedAtoms"]],
      ),
    ],
    bonds: [
      {
        startAtomIndex: 0,
        endAtomIndex: 2,
        visibilityDependencies: [],
        visibilityDependencyGroups: [],
      },
      {
        startAtomIndex: 0,
        endAtomIndex: 3,
        visibilityDependencies: ["oneHopBondedAtoms"],
        visibilityDependencyGroups: [["oneHopBondedAtoms"]],
      },
    ],
    polyhedra: polyhedra
      ? [
          polyhedron([0, 2]),
          polyhedron([0, 3, 2]),
        ]
      : [],
    cell: {
      vectors: [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ],
    },
    summary: {
      atomCount,
      cell: {
        a: "1.00",
        alpha: "90.00",
        b: "1.00",
        beta: "90.00",
        c: "1.00",
        gamma: "90.00",
      },
      formula: "NaCl",
      symmetry: {
        available: false,
        crystalSystem: null,
        latticeSystem: null,
        pointGroup: null,
        pointGroupSchoenflies: null,
        spaceGroup: null,
        spaceGroupNumber: null,
      },
    },
  };
}

function polyhedron(hullAtomIndices: number[]): SceneSpec["polyhedra"][number] {
  return {
    centerAtomIndex: hullAtomIndices[0]!,
    hullAtomIndices,
    faces: hullAtomIndices.length >= 3 ? [[0, 1, 2]] : [],
    visibilityDependencies: [],
    visibilityDependencyGroups: [],
  };
}

function atom(
  id: string,
  element: string,
  imageOffset: [number, number, number],
  imageReasons: AtomSpec["imageReasons"],
  visibilityDependencyGroups: AtomSpec["visibilityDependencyGroups"],
): AtomSpec {
  const isPeriodicImage = imageOffset.some((value) => value !== 0);
  const visibilityDependencies = Array.from(new Set(visibilityDependencyGroups.flat()));
  const siteId = id.split("-image-", 1)[0]!;
  const siteIndex = Number(siteId.match(/-(\d+)/)?.[1] ?? 0);
  return {
    element,
    fractionalPosition: imageOffset,
    id,
    imageOffset,
    isPeriodicImage,
    imageReasons,
    visibilityDependencies,
    visibilityDependencyGroups,
    position: imageOffset,
    siteId,
    siteIndex,
  };
}
