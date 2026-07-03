import { atomSpeciesOccupancies, type SceneSpec } from "../api/scene";
import {
  type ElementColorOverrides,
  elementColorForScheme,
  type ColorScheme,
} from "./colorSchemes";

export interface ElementLegendEntry {
  color: string;
  element: string;
}

export function deriveElementLegendEntries(
  scene: SceneSpec | null,
  colorScheme: ColorScheme = "vesta-soft",
  colorOverrides?: ElementColorOverrides,
): ElementLegendEntry[] {
  if (!scene) {
    return [];
  }

  const entries: ElementLegendEntry[] = [];
  const seenElements = new Set<string>();
  for (const atom of scene.atoms) {
    if (atom.isPeriodicImage) {
      continue;
    }

    for (const { element } of atomSpeciesOccupancies(atom)) {
      if (seenElements.has(element)) {
        continue;
      }

      seenElements.add(element);
      entries.push({
        color: elementColorForScheme(element, colorScheme, colorOverrides),
        element,
      });
    }
  }

  return entries;
}
