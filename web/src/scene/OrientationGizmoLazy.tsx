import { lazy, Suspense, type ComponentProps } from "react";

const OrientationGizmoInner = lazy(() =>
  import("./OrientationGizmo").then((module) => ({ default: module.OrientationGizmo })),
);

export function OrientationGizmo(props: ComponentProps<typeof OrientationGizmoInner>) {
  return (
    <Suspense fallback={null}>
      <OrientationGizmoInner {...props} />
    </Suspense>
  );
}
