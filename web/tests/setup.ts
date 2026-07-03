import { afterEach } from "bun:test";
import { GlobalRegistrator } from "@happy-dom/global-registrator";

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

// Evaluate @react-three/fiber (and three) once up front. Test files trigger
// lazy scene imports that can still be mid-evaluation when the next test file
// statically imports fiber; on CI that surfaces as bogus "Export named
// 'extend' not found" errors from bun's module loader.
await import("@react-three/fiber");

const { cleanup } = await import("@testing-library/react");

afterEach(() => {
  cleanup();
});
