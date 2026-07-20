import { useEffect, useRef } from "react";

import type { CommonPanelTab } from "../controls/commonPanel/CommonControlsPanel";

export interface GlobalShortcutHandlers {
  onNextFrame?: () => void;
  onOpenFile?: () => void;
  onPreviousFrame?: () => void;
  onResetView?: () => void;
  onSelectTab?: (tab: CommonPanelTab) => void;
  onToggleShortcutSheet?: () => void;
}

const SHORTCUT_TAB_BY_KEY: Record<string, CommonPanelTab> = {
  "1": "display",
  "2": "style",
  "3": "export",
};

// Shortcuts stay out of the way of text entry and of Radix widgets that run
// their own keyboard interactions (menus, listboxes, dialogs).
const SHORTCUT_EXEMPT_TARGET_SELECTOR = [
  "input",
  "textarea",
  "select",
  '[contenteditable="true"]',
  '[role="menu"]',
  '[role="listbox"]',
  '[role="dialog"]',
].join(", ");

/** Single-key application shortcuts. Handlers left undefined are inactive. */
export function useGlobalShortcuts(handlers: GlobalShortcutHandlers) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const target = event.target;
      if (target instanceof Element && target.closest(SHORTCUT_EXEMPT_TARGET_SELECTOR)) {
        return;
      }

      const {
        onNextFrame,
        onOpenFile,
        onPreviousFrame,
        onResetView,
        onSelectTab,
        onToggleShortcutSheet,
      } = handlersRef.current;

      const tab = SHORTCUT_TAB_BY_KEY[event.key];
      if (tab && onSelectTab) {
        event.preventDefault();
        onSelectTab(tab);
        return;
      }

      switch (event.key) {
        case "o":
        case "O":
          if (onOpenFile) {
            event.preventDefault();
            onOpenFile();
          }
          return;
        case "r":
        case "R":
          if (onResetView) {
            event.preventDefault();
            onResetView();
          }
          return;
        case "ArrowLeft":
          if (onPreviousFrame) {
            event.preventDefault();
            onPreviousFrame();
          }
          return;
        case "ArrowRight":
          if (onNextFrame) {
            event.preventDefault();
            onNextFrame();
          }
          return;
        case "?":
          if (onToggleShortcutSheet) {
            event.preventDefault();
            onToggleShortcutSheet();
          }
          return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
}
