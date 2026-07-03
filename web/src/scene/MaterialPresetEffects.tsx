import { useEffect, useState } from "react";

import type {
  MaterialPresetEffect,
  MaterialPresetProps,
} from "../model/materialPresets";

const AO_QUALITY_LEVELS = ["performance", "low", "medium", "high", "ultra"] as const;
type AmbientOcclusionQuality = (typeof AO_QUALITY_LEVELS)[number];

export interface AmbientOcclusionProps {
  aoRadius?: number;
  aoSamples?: number;
  color?: string;
  denoiseRadius?: number;
  denoiseSamples?: number;
  depthAwareUpsampling?: boolean;
  distanceFalloff?: number;
  halfRes?: boolean;
  intensity?: number;
  quality?: AmbientOcclusionQuality;
  screenSpaceRadius?: boolean;
}

type EffectsModule = typeof import("./AmbientOcclusionEffect");

// The postprocessing stack is loaded on demand so presets without effects do
// not pay its bundle cost. Export renderers must await
// preloadMaterialPresetEffects() before rendering so the composer mounts on
// the first committed frame.
let loadedEffectsModule: EffectsModule | null = null;
let effectsModulePromise: Promise<EffectsModule> | null = null;

export function preloadMaterialPresetEffects(): Promise<EffectsModule> {
  effectsModulePromise ??= import("./AmbientOcclusionEffect").then((module) => {
    loadedEffectsModule = module;
    return module;
  });

  return effectsModulePromise;
}

export function materialPresetEffectsRequirePreload(
  effects: MaterialPresetEffect[],
): boolean {
  return effects.length > 0 && !loadedEffectsModule;
}

export function MaterialPresetEffects({
  effects,
}: {
  effects: MaterialPresetEffect[];
}) {
  const ambientOcclusion = effects.find(
    (effect) => effect.type === "ambientOcclusion",
  );
  const [effectsModule, setEffectsModule] = useState(loadedEffectsModule);

  useEffect(() => {
    if (!ambientOcclusion || effectsModule) {
      return;
    }

    let cancelled = false;
    void preloadMaterialPresetEffects().then((module) => {
      if (!cancelled) {
        setEffectsModule(module);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [ambientOcclusion, effectsModule]);

  if (!ambientOcclusion || !effectsModule) {
    return null;
  }

  return (
    <effectsModule.AmbientOcclusionEffect
      ambientOcclusion={resolveAmbientOcclusionProps(
        ambientOcclusion.props,
        "ambientOcclusion.props",
      )}
    />
  );
}

export function resolveAmbientOcclusionProps(
  props: MaterialPresetProps,
  path: string,
): AmbientOcclusionProps {
  const resolved: AmbientOcclusionProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null) {
      continue;
    }

    switch (key) {
      case "aoRadius":
      case "aoSamples":
      case "denoiseRadius":
      case "denoiseSamples":
      case "distanceFalloff":
      case "intensity":
        resolved[key] = expectNumber(value, `${path}.${key}`);
        break;
      case "depthAwareUpsampling":
      case "halfRes":
      case "screenSpaceRadius":
        resolved[key] = expectBoolean(value, `${path}.${key}`);
        break;
      case "color":
        resolved.color = expectString(value, `${path}.${key}`);
        break;
      case "quality":
        resolved.quality = expectQuality(value, `${path}.${key}`);
        break;
      default:
        throw new Error(`${path}.${key} is not supported.`);
    }
  }

  return resolved;
}

function expectNumber(data: unknown, path: string): number {
  if (typeof data !== "number" || !Number.isFinite(data)) {
    throw new Error(`${path} must be a finite number.`);
  }
  return data;
}

function expectBoolean(data: unknown, path: string): boolean {
  if (typeof data !== "boolean") {
    throw new Error(`${path} must be a boolean.`);
  }
  return data;
}

function expectString(data: unknown, path: string): string {
  if (typeof data !== "string" || data.trim() === "") {
    throw new Error(`${path} must be a non-empty string.`);
  }
  return data;
}

function expectQuality(data: unknown, path: string): AmbientOcclusionQuality {
  if (
    typeof data !== "string" ||
    !AO_QUALITY_LEVELS.includes(data as AmbientOcclusionQuality)
  ) {
    throw new Error(`${path} must be one of ${AO_QUALITY_LEVELS.join(", ")}.`);
  }
  return data as AmbientOcclusionQuality;
}
