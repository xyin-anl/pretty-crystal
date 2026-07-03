import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./app/App";
import "./styles/global.css";

// Headless mode is used by the `prc render` CLI: it skips the interactive UI
// and exposes a render bridge on `window` for the browser driver.
if (new URLSearchParams(window.location.search).get("headless") === "1") {
  void import("./headless/headlessRender").then(({ installHeadlessRenderBridge }) => {
    installHeadlessRenderBridge();
  });
} else {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
