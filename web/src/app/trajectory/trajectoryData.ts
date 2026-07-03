import type { SceneSpec } from "../../api/scene";

export type TrajectoryProperty = "volume" | "a" | "b" | "c";

export const TRAJECTORY_PROPERTY_OPTIONS: readonly {
  label: string;
  unit: string;
  value: TrajectoryProperty;
}[] = [
  { label: "Cell volume", unit: "Å³", value: "volume" },
  { label: "Lattice a", unit: "Å", value: "a" },
  { label: "Lattice b", unit: "Å", value: "b" },
  { label: "Lattice c", unit: "Å", value: "c" },
];

function vectorLength(vector: readonly number[]): number {
  return Math.hypot(vector[0] ?? 0, vector[1] ?? 0, vector[2] ?? 0);
}

function cellVolume(vectors: readonly (readonly number[])[]): number {
  const [a, b, c] = vectors;
  if (!a || !b || !c) {
    return 0;
  }
  const cross = [
    (b[1] ?? 0) * (c[2] ?? 0) - (b[2] ?? 0) * (c[1] ?? 0),
    (b[2] ?? 0) * (c[0] ?? 0) - (b[0] ?? 0) * (c[2] ?? 0),
    (b[0] ?? 0) * (c[1] ?? 0) - (b[1] ?? 0) * (c[0] ?? 0),
  ];
  return Math.abs(
    (a[0] ?? 0) * cross[0]! + (a[1] ?? 0) * cross[1]! + (a[2] ?? 0) * cross[2]!,
  );
}

/** Per-frame values of the selected lattice property. */
export function trajectoryPropertySeries(
  frames: readonly SceneSpec[],
  property: TrajectoryProperty,
): number[] {
  return frames.map((frame) => {
    const vectors = frame.cell.vectors;
    switch (property) {
      case "volume":
        return cellVolume(vectors);
      case "a":
        return vectorLength(vectors[0] ?? []);
      case "b":
        return vectorLength(vectors[1] ?? []);
      case "c":
        return vectorLength(vectors[2] ?? []);
    }
  });
}
