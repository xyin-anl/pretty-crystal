import {
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const LOCKED_INTERACTION_DRAG_THRESHOLD_PX = 4;
const LOCKED_INTERACTION_WHEEL_IDLE_MS = 150;
const REDISPATCHED_CONTEXT_MENU_EVENT = "__prettyCrystalRedispatchedContextMenu";
const RIGHT_DRAG_MENU_SUPPRESS_MS = 400;

interface LockedInteractionPointer {
  pointerId: number;
  startX: number;
  startY: number;
  triggered: boolean;
}

interface RightDragPointer {
  moved: boolean;
  pointerId: number;
  startX: number;
  startY: number;
}

interface PendingContextMenu {
  button: number;
  buttons: number;
  clientX: number;
  clientY: number;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
}

type RedispatchedContextMenuEvent = MouseEvent & {
  [REDISPATCHED_CONTEXT_MENU_EVENT]?: boolean;
};

interface UseLockedInteractionFeedbackOptions {
  hasVisibleScene: boolean;
  interactionLocked: boolean;
}

function isRedispatchedContextMenuEvent(event: MouseEvent): boolean {
  return Boolean((event as RedispatchedContextMenuEvent)[REDISPATCHED_CONTEXT_MENU_EVENT]);
}

function isCanvasContextMenuTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest("canvas") !== null;
}

function dispatchRedispatchedContextMenu(target: HTMLElement, init: PendingContextMenu) {
  const redispatchedEvent = new MouseEvent("contextmenu", {
    bubbles: true,
    cancelable: true,
    ...init,
  }) as RedispatchedContextMenuEvent;
  redispatchedEvent[REDISPATCHED_CONTEXT_MENU_EVENT] = true;
  target.dispatchEvent(redispatchedEvent);
}

function pendingContextMenuFromEvent(nativeEvent: MouseEvent): PendingContextMenu {
  return {
    button: nativeEvent.button,
    buttons: nativeEvent.buttons,
    clientX: nativeEvent.clientX,
    clientY: nativeEvent.clientY,
    ctrlKey: nativeEvent.ctrlKey,
    metaKey: nativeEvent.metaKey,
    shiftKey: nativeEvent.shiftKey,
  };
}

export function useLockedInteractionFeedback({
  hasVisibleScene,
  interactionLocked,
}: UseLockedInteractionFeedbackOptions) {
  const [lockedInteractionFeedbackCount, setLockedInteractionFeedbackCount] = useState(0);
  const lockedInteractionPointerRef = useRef<LockedInteractionPointer | null>(null);
  const lockedInteractionWheelIdleTimeoutRef = useRef<number | null>(null);
  // Right-button drags pan the structure, so the context menu opens only for
  // right-clicks without movement. macOS fires contextmenu on press, so the
  // menu request is parked until release proves it was a click.
  const rightDragPointerRef = useRef<RightDragPointer | null>(null);
  const pendingContextMenuRef = useRef<PendingContextMenu | null>(null);
  const lastRightDragEndRef = useRef<{ moved: boolean; time: number } | null>(null);

  const triggerLockedInteractionFeedback = useCallback(() => {
    setLockedInteractionFeedbackCount((count) => count + 1);
  }, []);

  const clearLockedInteractionWheelGate = useCallback(() => {
    if (lockedInteractionWheelIdleTimeoutRef.current === null) {
      return;
    }

    window.clearTimeout(lockedInteractionWheelIdleTimeoutRef.current);
    lockedInteractionWheelIdleTimeoutRef.current = null;
  }, []);

  const resetLockedInteractionFeedback = useCallback(() => {
    setLockedInteractionFeedbackCount(0);
    lockedInteractionPointerRef.current = null;
    clearLockedInteractionWheelGate();
  }, [clearLockedInteractionWheelGate]);

  useEffect(() => () => clearLockedInteractionWheelGate(), [clearLockedInteractionWheelGate]);

  useEffect(() => {
    if (!hasVisibleScene || !interactionLocked) {
      clearLockedInteractionWheelGate();
    }
  }, [clearLockedInteractionWheelGate, hasVisibleScene, interactionLocked]);

  const handleSceneWheelCapture = useCallback(() => {
    if (!hasVisibleScene || !interactionLocked) {
      clearLockedInteractionWheelGate();
      return;
    }

    if (lockedInteractionWheelIdleTimeoutRef.current === null) {
      triggerLockedInteractionFeedback();
    } else {
      window.clearTimeout(lockedInteractionWheelIdleTimeoutRef.current);
    }

    lockedInteractionWheelIdleTimeoutRef.current = window.setTimeout(() => {
      lockedInteractionWheelIdleTimeoutRef.current = null;
    }, LOCKED_INTERACTION_WHEEL_IDLE_MS);
  }, [
    clearLockedInteractionWheelGate,
    hasVisibleScene,
    interactionLocked,
    triggerLockedInteractionFeedback,
  ]);

  const handleScenePointerDownCapture = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button === 2 && isCanvasContextMenuTarget(event.target)) {
        rightDragPointerRef.current = {
          moved: false,
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
        };
        pendingContextMenuRef.current = null;
      }

      if (!hasVisibleScene || !interactionLocked || event.button !== 0) {
        lockedInteractionPointerRef.current = null;
        return;
      }

      lockedInteractionPointerRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        triggered: false,
      };
    },
    [hasVisibleScene, interactionLocked],
  );

  const handleScenePointerMoveCapture = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const rightDragPointer = rightDragPointerRef.current;
      if (
        rightDragPointer &&
        rightDragPointer.pointerId === event.pointerId &&
        !rightDragPointer.moved &&
        Math.hypot(
          event.clientX - rightDragPointer.startX,
          event.clientY - rightDragPointer.startY,
        ) >= LOCKED_INTERACTION_DRAG_THRESHOLD_PX
      ) {
        rightDragPointer.moved = true;
      }

      const lockedPointer = lockedInteractionPointerRef.current;
      if (
        !hasVisibleScene ||
        !interactionLocked ||
        !lockedPointer ||
        lockedPointer.pointerId !== event.pointerId ||
        lockedPointer.triggered
      ) {
        return;
      }

      const dragDistance = Math.hypot(
        event.clientX - lockedPointer.startX,
        event.clientY - lockedPointer.startY,
      );
      if (dragDistance < LOCKED_INTERACTION_DRAG_THRESHOLD_PX) {
        return;
      }

      lockedPointer.triggered = true;
      triggerLockedInteractionFeedback();
    },
    [hasVisibleScene, interactionLocked, triggerLockedInteractionFeedback],
  );

  const handleScenePointerEndCapture = useCallback((event: ReactPointerEvent<HTMLElement>) => {
    const rightDragPointer = rightDragPointerRef.current;
    if (rightDragPointer && rightDragPointer.pointerId === event.pointerId) {
      lastRightDragEndRef.current = {
        moved: rightDragPointer.moved,
        time: performance.now(),
      };
      const pendingContextMenu = pendingContextMenuRef.current;
      rightDragPointerRef.current = null;
      pendingContextMenuRef.current = null;
      if (!rightDragPointer.moved && pendingContextMenu) {
        dispatchRedispatchedContextMenu(event.currentTarget, pendingContextMenu);
      }
    }

    if (lockedInteractionPointerRef.current?.pointerId === event.pointerId) {
      lockedInteractionPointerRef.current = null;
    }
  }, []);

  const handleSceneContextMenuCapture = useCallback((event: ReactMouseEvent<HTMLElement>) => {
    const nativeEvent = event.nativeEvent;
    if (isRedispatchedContextMenuEvent(nativeEvent)) {
      return;
    }

    if (!isCanvasContextMenuTarget(event.target)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    // While the right button is still down (macOS fires contextmenu on
    // press), park the menu until release shows whether this was a pan.
    if (rightDragPointerRef.current) {
      pendingContextMenuRef.current = pendingContextMenuFromEvent(nativeEvent);
      return;
    }

    // Just after a right-drag pan (Windows/Linux fire contextmenu on
    // release), swallow the menu entirely.
    const lastRightDragEnd = lastRightDragEndRef.current;
    if (
      lastRightDragEnd?.moved &&
      performance.now() - lastRightDragEnd.time < RIGHT_DRAG_MENU_SUPPRESS_MS
    ) {
      return;
    }

    dispatchRedispatchedContextMenu(
      event.currentTarget,
      pendingContextMenuFromEvent(nativeEvent),
    );
  }, []);

  return {
    handleSceneContextMenuCapture,
    handleScenePointerDownCapture,
    handleScenePointerEndCapture,
    handleScenePointerMoveCapture,
    handleSceneWheelCapture,
    lockedInteractionFeedbackCount,
    resetLockedInteractionFeedback,
    triggerLockedInteractionFeedback,
  };
}
