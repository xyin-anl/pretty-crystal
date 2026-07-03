import { lazy, Suspense, type ComponentProps } from "react";

// The interactive scene pulls in three.js, react-three-fiber, and the
// postprocessing stack; loading it on demand keeps the initial bundle small.
const LatticeSceneInner = lazy(() =>
  import("./LatticeScene").then((module) => ({ default: module.LatticeScene })),
);

export function LatticeScene(props: ComponentProps<typeof LatticeSceneInner>) {
  return (
    <Suspense
      fallback={
        <div className="grid h-full w-full place-items-center bg-background text-sm text-muted-foreground">
          Loading renderer
        </div>
      }
    >
      <LatticeSceneInner {...props} />
    </Suspense>
  );
}
