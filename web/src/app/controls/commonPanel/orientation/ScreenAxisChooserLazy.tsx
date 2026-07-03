import { lazy, Suspense, type ComponentProps } from "react";

// The axis chooser renders through react-three-fiber; loading it on demand
// keeps three.js out of the initial bundle.
const ScreenAxisChooserInner = lazy(() =>
  import("./ScreenAxisChooser").then((module) => ({
    default: module.ScreenAxisChooser,
  })),
);

export function ScreenAxisChooser(props: ComponentProps<typeof ScreenAxisChooserInner>) {
  return (
    <Suspense fallback={<span aria-hidden="true" className="block size-[104px]" />}>
      <ScreenAxisChooserInner {...props} />
    </Suspense>
  );
}
