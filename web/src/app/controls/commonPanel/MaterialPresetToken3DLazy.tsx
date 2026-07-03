import { lazy, Suspense, type ComponentProps } from "react";

// The 3D material tokens render through react-three-fiber; deferring them
// keeps three.js out of the initial bundle.
const MaterialPresetToken3DInner = lazy(() =>
  import("./MaterialPresetToken3D").then((module) => ({
    default: module.MaterialPresetToken3D,
  })),
);
const MaterialPresetTokenPreloadPoolInner = lazy(() =>
  import("./MaterialPresetToken3D").then((module) => ({
    default: module.MaterialPresetTokenPreloadPool,
  })),
);

export function MaterialPresetToken3D(
  props: ComponentProps<typeof MaterialPresetToken3DInner>,
) {
  return (
    <Suspense fallback={<span aria-hidden="true" className="inline-flex size-4 shrink-0" />}>
      <MaterialPresetToken3DInner {...props} />
    </Suspense>
  );
}

export function MaterialPresetTokenPreloadPool() {
  return (
    <Suspense fallback={null}>
      <MaterialPresetTokenPreloadPoolInner />
    </Suspense>
  );
}
