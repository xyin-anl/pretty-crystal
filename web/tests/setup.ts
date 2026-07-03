import { afterEach, mock } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

// @react-three/fiber has no package.json "exports" map, so bun resolves it to
// its CJS main entry, which requires the CJS three build while app code
// imports the ESM build — evaluating three twice ("Multiple instances of
// Three.js being imported"). Pin fiber to its ESM dist so tests share one
// three instance, matching the vite build.
mock.module("@react-three/fiber", () =>
  // @ts-expect-error -- untyped dist path; the package types live on the bare specifier
  import("@react-three/fiber/dist/react-three-fiber.esm.js"),
);

GlobalRegistrator.register({
  url: "http://127.0.0.1:5173",
});

// happy-dom backs requestAnimationFrame with setImmediate, so time-based
// animation loops (RollControl, useAnimatedValue) tick thousands of times in
// their ~180ms window and trip React's nested-update guard. Pace frames at
// ~60fps like a real browser.
const FRAME_MS = 16;
const pacedRequestAnimationFrame: typeof window.requestAnimationFrame = (callback) =>
  window.setTimeout(() => callback(performance.now()), FRAME_MS) as unknown as number;
const pacedCancelAnimationFrame: typeof window.cancelAnimationFrame = (id) => {
  window.clearTimeout(id);
};
window.requestAnimationFrame = pacedRequestAnimationFrame;
window.cancelAnimationFrame = pacedCancelAnimationFrame;
globalThis.requestAnimationFrame = pacedRequestAnimationFrame;
globalThis.cancelAnimationFrame = pacedCancelAnimationFrame;

const { cleanup } = await import("@testing-library/react");

afterEach(() => {
  cleanup();
});
