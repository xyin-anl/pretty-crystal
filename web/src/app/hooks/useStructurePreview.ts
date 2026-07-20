import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  BACKEND_UNAVAILABLE_MESSAGE,
  BACKEND_UNAVAILABLE_TITLE,
  DEFAULT_BOND_ALGORITHM,
  DEFAULT_SUPERCELL,
  STATIC_SCENE_PREVIEW_NAME,
  defaultBondAlgorithmForScene,
  hasStaticScenePreview,
  isBackendUnavailablePreviewError,
  loadStaticScenePreview,
  StructurePreviewError,
  uploadStructurePreview,
  uploadTrajectoryPreview,
  type BondAlgorithm,
  type SceneSpec,
  type SupercellDimensions,
} from "../../api/scene";
import type { PreviewStatus } from "../previewState";

const MAX_STRUCTURE_UPLOAD_BYTES = 1 * 1024 * 1024;
const STRUCTURE_FILE_TOO_LARGE_MESSAGE = "File is too large to preview.";
const STRUCTURE_PARSE_ERROR_MESSAGE = "pymatgen could not parse this file.";

interface ResetLoadedPreviewOptions {
  preserveActiveCommonPanelTab?: boolean;
  preserveInspectorOpen?: boolean;
  resetPreferences?: boolean;
}

interface UseStructurePreviewOptions {
  onBondAlgorithmSceneLoaded: (nextScene: SceneSpec) => void;
  onPreviewCleared: () => void;
  resetLoadedPreviewState: (
    nextScene: SceneSpec | null,
    options?: ResetLoadedPreviewOptions,
  ) => void;
}

export function useStructurePreview({
  onBondAlgorithmSceneLoaded,
  onPreviewCleared,
  resetLoadedPreviewState,
}: UseStructurePreviewOptions) {
  const isStaticScenePreview = hasStaticScenePreview();
  const [scene, setScene] = useState<SceneSpec | null>(null);
  const [previewStatus, setPreviewStatus] = useState<PreviewStatus>(() =>
    isStaticScenePreview ? "loading" : "idle",
  );
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [bondAlgorithm, setBondAlgorithm] =
    useState<BondAlgorithm>(DEFAULT_BOND_ALGORITHM);
  const [supercell, setSupercell] = useState<SupercellDimensions>(DEFAULT_SUPERCELL);
  const [trajectoryFiles, setTrajectoryFiles] = useState<File[] | null>(null);
  const [trajectoryFrames, setTrajectoryFrames] = useState<SceneSpec[] | null>(null);
  const [activeFrameIndex, setActiveFrameIndex] = useState(0);
  const [isTrajectoryAligned, setIsTrajectoryAligned] = useState(false);
  // Concurrent uploads (e.g. dropping a file while one is loading) resolve in
  // any order; only the newest request may apply its result.
  const requestTokenRef = useRef(0);

  function startPreviewRequest(): () => boolean {
    const requestToken = ++requestTokenRef.current;
    return () => requestTokenRef.current === requestToken;
  }

  function clearTrajectoryState() {
    setTrajectoryFiles(null);
    setTrajectoryFrames(null);
    setActiveFrameIndex(0);
    setIsTrajectoryAligned(false);
  }

  useEffect(() => {
    if (!isStaticScenePreview) {
      return;
    }

    let isCurrent = true;

    async function loadExampleScene() {
      try {
        const nextScene = await loadStaticScenePreview();
        if (!isCurrent || !nextScene) {
          return;
        }

        setScene(nextScene);
        setSelectedFileName(STATIC_SCENE_PREVIEW_NAME);
        setBondAlgorithm(defaultBondAlgorithmForScene(nextScene));
        resetLoadedPreviewState(nextScene);
        setPreviewStatus("ready");
      } catch {
        if (!isCurrent) {
          return;
        }

        setScene(null);
        onPreviewCleared();
        setSelectedFileName(null);
        setPreviewStatus("error");
        setErrorMessage("Static example could not be loaded.");
      }
    }

    void loadExampleScene();

    return () => {
      isCurrent = false;
    };
  }, [isStaticScenePreview, onPreviewCleared, resetLoadedPreviewState]);

  const loadStructureFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) {
        return;
      }

      if (isStaticScenePreview) {
        setErrorMessage(BACKEND_UNAVAILABLE_MESSAGE);
        return;
      }

      const isCurrentRequest = startPreviewRequest();

      if (files.some((file) => file.size > MAX_STRUCTURE_UPLOAD_BYTES)) {
        setSelectedFileName(null);
        setPreviewStatus("error");
        setErrorMessage(STRUCTURE_FILE_TOO_LARGE_MESSAGE);
        setScene(null);
        setCurrentFile(null);
        clearTrajectoryState();
        onPreviewCleared();
        return;
      }

      const firstFile = files[0]!;
      setSelectedFileName(firstFile.name);
      setPreviewStatus("loading");
      setErrorMessage(null);
      setScene(null);
      setCurrentFile(firstFile);
      setBondAlgorithm(DEFAULT_BOND_ALGORITHM);
      setSupercell(DEFAULT_SUPERCELL);
      clearTrajectoryState();
      resetLoadedPreviewState(null);

      try {
        if (files.length === 1) {
          const nextScene = await uploadStructurePreview(firstFile);
          if (!isCurrentRequest()) {
            return;
          }
          setScene(nextScene);
          setBondAlgorithm(defaultBondAlgorithmForScene(nextScene));
          resetLoadedPreviewState(nextScene);
          setPreviewStatus("ready");
          return;
        }

        // Multiple files load as trajectory frames in the given order.
        const preview = await uploadTrajectoryPreview(files);
        if (!isCurrentRequest()) {
          return;
        }
        const firstFrame = preview.frames[0];
        if (!firstFrame) {
          throw new StructurePreviewError(STRUCTURE_PARSE_ERROR_MESSAGE);
        }
        setScene(firstFrame);
        setTrajectoryFiles(files);
        setTrajectoryFrames(preview.frames);
        setBondAlgorithm(defaultBondAlgorithmForScene(firstFrame));
        resetLoadedPreviewState(firstFrame);
        setPreviewStatus("ready");
      } catch (error) {
        if (!isCurrentRequest()) {
          return;
        }
        setScene(null);
        setCurrentFile(null);
        setSelectedFileName(null);
        clearTrajectoryState();
        onPreviewCleared();
        setPreviewStatus("error");
        setErrorMessage(
          isBackendUnavailablePreviewError(error)
            ? error.message
            : STRUCTURE_PARSE_ERROR_MESSAGE,
        );
      }
    },
    [isStaticScenePreview, onPreviewCleared, resetLoadedPreviewState],
  );

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      event.target.value = "";
      await loadStructureFiles(files);
    },
    [loadStructureFiles],
  );

  const reloadSceneWithOptions = useCallback(
    async ({
      nextBondAlgorithm,
      nextSupercell,
      onSceneLoaded,
    }: {
      nextBondAlgorithm: BondAlgorithm;
      nextSupercell: SupercellDimensions;
      onSceneLoaded?: (nextScene: SceneSpec) => void;
    }) => {
      if (!currentFile) {
        if (scene) {
          setErrorMessage(BACKEND_UNAVAILABLE_MESSAGE);
        }
        return;
      }

      const isCurrentRequest = startPreviewRequest();
      setPreviewStatus("loading");
      setErrorMessage(null);

      try {
        if (trajectoryFiles && trajectoryFiles.length > 1) {
          const preview = await uploadTrajectoryPreview(trajectoryFiles, {
            align: isTrajectoryAligned,
            bondAlgorithm: nextBondAlgorithm,
            supercell: nextSupercell,
          });
          if (!isCurrentRequest()) {
            return;
          }
          const frameIndex = Math.min(activeFrameIndex, preview.frames.length - 1);
          const nextScene = preview.frames[frameIndex];
          if (!nextScene) {
            throw new StructurePreviewError(STRUCTURE_PARSE_ERROR_MESSAGE);
          }
          setTrajectoryFrames(preview.frames);
          setActiveFrameIndex(frameIndex);
          setBondAlgorithm(nextBondAlgorithm);
          setSupercell(nextSupercell);
          setScene(nextScene);
          onSceneLoaded?.(nextScene);
          setPreviewStatus("ready");
          return;
        }

        const nextScene = await uploadStructurePreview(currentFile, {
          bondAlgorithm: nextBondAlgorithm,
          supercell: nextSupercell,
        });
        if (!isCurrentRequest()) {
          return;
        }
        setBondAlgorithm(nextBondAlgorithm);
        setSupercell(nextSupercell);
        setScene(nextScene);
        onSceneLoaded?.(nextScene);
        setPreviewStatus("ready");
      } catch (error) {
        if (!isCurrentRequest()) {
          return;
        }

        // Rejected options (e.g. a supercell above the atom limit) keep the
        // loaded structure and surface the reason.
        setPreviewStatus(scene ? "ready" : "error");
        setErrorMessage(
          error instanceof StructurePreviewError
            ? error.message
            : STRUCTURE_PARSE_ERROR_MESSAGE,
        );
      }
    },
    [activeFrameIndex, currentFile, isTrajectoryAligned, scene, trajectoryFiles],
  );

  const handleBondAlgorithmChange = useCallback(
    async (nextBondAlgorithm: BondAlgorithm) => {
      await reloadSceneWithOptions({
        nextBondAlgorithm,
        nextSupercell: supercell,
        onSceneLoaded: onBondAlgorithmSceneLoaded,
      });
    },
    [onBondAlgorithmSceneLoaded, reloadSceneWithOptions, supercell],
  );

  const handleSupercellChange = useCallback(
    async (nextSupercell: SupercellDimensions) => {
      await reloadSceneWithOptions({
        nextBondAlgorithm: bondAlgorithm,
        nextSupercell,
        onSceneLoaded: onBondAlgorithmSceneLoaded,
      });
    },
    [bondAlgorithm, onBondAlgorithmSceneLoaded, reloadSceneWithOptions],
  );

  // Frame switches must not reset the camera or settings: they only swap the
  // displayed scene so trajectory playback stays smooth.
  const handleActiveFrameChange = useCallback(
    (frameIndex: number) => {
      if (!trajectoryFrames || trajectoryFrames.length === 0) {
        return;
      }

      const clampedIndex = Math.min(
        trajectoryFrames.length - 1,
        Math.max(0, Math.round(frameIndex)),
      );
      const nextScene = trajectoryFrames[clampedIndex];
      if (!nextScene) {
        return;
      }

      setActiveFrameIndex(clampedIndex);
      setScene(nextScene);
      const frameFile = trajectoryFiles?.[clampedIndex];
      if (frameFile) {
        setCurrentFile(frameFile);
        setSelectedFileName(frameFile.name);
      }
    },
    [trajectoryFiles, trajectoryFrames],
  );

  const handleTrajectoryAlignChange = useCallback(
    async (nextAligned: boolean) => {
      if (!trajectoryFiles || trajectoryFiles.length < 2) {
        return;
      }

      const isCurrentRequest = startPreviewRequest();
      setPreviewStatus("loading");
      setErrorMessage(null);
      try {
        const preview = await uploadTrajectoryPreview(trajectoryFiles, {
          align: nextAligned,
          bondAlgorithm,
          supercell,
        });
        if (!isCurrentRequest()) {
          return;
        }
        const frameIndex = Math.min(activeFrameIndex, preview.frames.length - 1);
        const nextScene = preview.frames[frameIndex];
        if (!nextScene) {
          throw new StructurePreviewError(STRUCTURE_PARSE_ERROR_MESSAGE);
        }
        setTrajectoryFrames(preview.frames);
        setActiveFrameIndex(frameIndex);
        setIsTrajectoryAligned(nextAligned);
        setScene(nextScene);
        setPreviewStatus("ready");
      } catch (error) {
        if (!isCurrentRequest()) {
          return;
        }
        // Alignment failures keep the unaligned frames and surface the reason.
        setPreviewStatus(scene ? "ready" : "error");
        setErrorMessage(
          error instanceof StructurePreviewError
            ? error.message
            : STRUCTURE_PARSE_ERROR_MESSAGE,
        );
      }
    },
    [activeFrameIndex, bondAlgorithm, scene, supercell, trajectoryFiles],
  );

  const handleResetAllSettings = useCallback(async () => {
    if (!scene || previewStatus === "loading") {
      return;
    }

    const defaultBondAlgorithm = defaultBondAlgorithmForScene(scene);
    const isDefaultSupercellSelected =
      supercell[0] === 1 && supercell[1] === 1 && supercell[2] === 1;

    if ((bondAlgorithm === defaultBondAlgorithm && isDefaultSupercellSelected) || !currentFile) {
      setBondAlgorithm(defaultBondAlgorithm);
      setSupercell(DEFAULT_SUPERCELL);
      setPreviewStatus("ready");
      resetLoadedPreviewState(scene, {
        preserveActiveCommonPanelTab: true,
        preserveInspectorOpen: true,
        resetPreferences: true,
      });
      return;
    }

    const isCurrentRequest = startPreviewRequest();
    setPreviewStatus("loading");
    setErrorMessage(null);

    try {
      const nextScene = await uploadStructurePreview(currentFile);
      if (!isCurrentRequest()) {
        return;
      }
      setBondAlgorithm(defaultBondAlgorithmForScene(nextScene));
      setSupercell(DEFAULT_SUPERCELL);
      setScene(nextScene);
      resetLoadedPreviewState(nextScene, {
        preserveActiveCommonPanelTab: true,
        preserveInspectorOpen: true,
        resetPreferences: true,
      });
      setPreviewStatus("ready");
    } catch (error) {
      if (!isCurrentRequest()) {
        return;
      }
      setPreviewStatus(scene ? "ready" : "error");
      setErrorMessage(
        isBackendUnavailablePreviewError(error)
          ? error.message
          : STRUCTURE_PARSE_ERROR_MESSAGE,
      );
    }
  }, [bondAlgorithm, currentFile, previewStatus, resetLoadedPreviewState, scene, supercell]);

  // Backend unavailability is an environment warning; everything else is a
  // hard failure and renders in the destructive style.
  const errorSeverity: "warning" | "error" =
    errorMessage === BACKEND_UNAVAILABLE_MESSAGE ? "warning" : "error";

  const errorTitle = useMemo(() => {
    if (errorMessage === BACKEND_UNAVAILABLE_MESSAGE) {
      return BACKEND_UNAVAILABLE_TITLE;
    }
    if (
      errorMessage === STRUCTURE_PARSE_ERROR_MESSAGE ||
      errorMessage === STRUCTURE_FILE_TOO_LARGE_MESSAGE
    ) {
      return "Unsupported file";
    }

    // Server-provided messages (supercell limits, alignment failures) are not
    // about the file format.
    return "Preview failed";
  }, [errorMessage]);

  return {
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
    isStaticScenePreview,
    isTrajectoryAligned,
    previewStatus,
    scene,
    selectedFileName,
    setErrorMessage,
    supercell,
    trajectoryFileNames: trajectoryFiles?.map((file) => file.name) ?? null,
    trajectoryFrames,
  };
}
