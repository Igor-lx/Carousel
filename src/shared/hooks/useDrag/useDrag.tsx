import {
  useReducer,
  useRef,
  useCallback,
  useMemo,
  useEffect,
  useState,
} from "react";
import { initialState, dragReducer } from "./model/reducer";
import {
  DEFAULT_DRAG_CONFIG,
  SHARED_DRAG_STYLES,
} from "./model/settings";
import type {
  DragListeners,
  DragProps,
  DragResult,
  DragConfig,
  DragEndPayload,
  DragPhase,
  DragSample,
} from "./model/types";
import {
  calculateEMA,
  applyResistance,
  clampVelocityMagnitude,
  resolveDragRelease,
} from "./model/utilities";

const createIdleSample = (width = 0, timestamp = 0): DragSample => ({
  rawOffset: 0,
  offset: 0,
  rawVelocity: 0,
  velocity: 0,
  width,
  timestamp,
});

const INTERACTIVE_TARGET_SELECTOR = [
  "button",
  "input",
  "select",
  "textarea",
  "label",
  "a[href]",
  "summary",
  "[contenteditable='true']",
  "[role='button']",
  "[role='link']",
  "[role='checkbox']",
  "[role='radio']",
  "[role='switch']",
  "[role='tab']",
  "[data-drag-ignore='true']",
].join(",");

const getInteractiveTarget = (
  target: EventTarget | null,
  boundary: HTMLElement,
) => {
  if (!(target instanceof Element)) {
    return null;
  }

  const interactiveTarget = target.closest(INTERACTIVE_TARGET_SELECTOR);

  if (interactiveTarget === null || !boundary.contains(interactiveTarget)) {
    return null;
  }

  return interactiveTarget;
};

const getFrameAdjustedEmaAlpha = (alpha: number, dt: number) => {
  const safeAlpha = Math.max(0, Math.min(1, alpha));
  const frameCount = Math.max(1, dt / (1000 / 60));

  return 1 - Math.pow(1 - safeAlpha, frameCount);
};

const decayVelocity = (velocity: number, alpha: number, dt: number) =>
  calculateEMA(velocity, 0, getFrameAdjustedEmaAlpha(alpha, dt));

export function useDrag({
  onPressStart,
  onDragStart,
  onDragMove,
  onDragEnd,
  enabled = true,
  measureRef,
  config = {},
}: DragProps): DragResult {
  const settings = useMemo(
    () => ({ ...DEFAULT_DRAG_CONFIG, ...config }) as Required<DragConfig>,
    [config],
  );

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const [state, dispatch] = useReducer(dragReducer, initialState);
  const [releasedVelocity, setReleasedVelocity] = useState(0);

  const lockUntilRef = useRef<number>(0);
  const allowedClickTargetRef = useRef<Element | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const phaseRef = useRef(state.phase);
  const dragSampleRef = useRef(createIdleSample());
  useEffect(() => {
    phaseRef.current = state.phase;
  }, [state.phase]);

  const gesture = useRef({
    startX: 0,
    startY: 0,
    lastX: 0,
    lastTime: 0,
    lastOffset: 0,
    pointerId: null as number | null,
    hasPointerCapture: false,
    isDragActivated: false,
  });

  const setPhase = useCallback((phase: DragPhase) => {
    phaseRef.current = phase;
    dispatch({ type: "SET_PHASE", phase });
  }, []);

  const ensurePointerCapture = useCallback(
    (target: HTMLElement, pointerId: number) => {
      const currentGesture = gesture.current;

      if (currentGesture.hasPointerCapture) {
        return;
      }

      try {
        target.setPointerCapture(pointerId);
        currentGesture.hasPointerCapture = true;
      } catch {}
    },
    [],
  );

  const activateDragOwnership = useCallback(
    (target: HTMLElement, pointerId: number) => {
      const currentGesture = gesture.current;

      ensurePointerCapture(target, pointerId);

      if (!currentGesture.isDragActivated) {
        currentGesture.isDragActivated = true;
        onPressStart?.();
      }
    },
    [ensurePointerCapture, onPressStart],
  );

  const createSample = useCallback(
    (currentX: number, timestamp: number): DragSample => {
      const currentGesture = gesture.current;
      const settingsSnapshot = settingsRef.current;
      const rawOffset = currentX - currentGesture.startX;
      const offset = applyResistance(
        rawOffset,
        settingsSnapshot.RESISTANCE,
        settingsSnapshot.RESISTANCE_CURVATURE,
      );
      const dt = Math.max(1, timestamp - currentGesture.lastTime);
      const rawVelocity = clampVelocityMagnitude(
        (currentX - currentGesture.lastX) / dt,
        settingsSnapshot.MAX_VELOCITY,
      );
      const instantVelocity = clampVelocityMagnitude(
        (offset - currentGesture.lastOffset) / dt,
        settingsSnapshot.MAX_VELOCITY,
      );
      const velocity = clampVelocityMagnitude(
        calculateEMA(
          dragSampleRef.current.velocity,
          instantVelocity,
          getFrameAdjustedEmaAlpha(settingsSnapshot.EMA_ALPHA, dt),
        ),
        settingsSnapshot.MAX_VELOCITY,
      );
      const width = measureRef.current?.offsetWidth ?? dragSampleRef.current.width;

      currentGesture.lastX = currentX;
      currentGesture.lastTime = timestamp;
      currentGesture.lastOffset = offset;

      return {
        rawOffset,
        offset,
        rawVelocity,
        velocity,
        width,
        timestamp,
      };
    },
    [measureRef],
  );

  const stopDragging = useCallback(
    (isCancel = false, currentX?: number) => {
      const target = measureRef.current;
      const now = performance.now();
      const currentPhase = phaseRef.current;
      const currentGesture = gesture.current;

      if (currentGesture.hasPointerCapture && currentGesture.pointerId !== null && target) {
        try {
          target.releasePointerCapture(currentGesture.pointerId);
        } catch {}

        currentGesture.hasPointerCapture = false;
      }

      if (currentPhase === "IDLE" || currentPhase === "COOLDOWN") {
        return;
      }

      if (!currentGesture.isDragActivated) {
        setReleasedVelocity(0);
        allowedClickTargetRef.current = null;
        setPhase("IDLE");
        dragSampleRef.current = createIdleSample(target?.offsetWidth ?? 0, now);
        currentGesture.lastOffset = 0;
        currentGesture.pointerId = null;
        currentGesture.hasPointerCapture = false;
        currentGesture.isDragActivated = false;
        return;
      }

      const hasReleaseMovement =
        typeof currentX === "number" && currentX !== currentGesture.lastX;
      const sample = hasReleaseMovement
        ? createSample(currentX, now)
        : {
            ...dragSampleRef.current,
            rawVelocity: decayVelocity(
              dragSampleRef.current.rawVelocity,
              settingsRef.current.EMA_ALPHA,
              now - dragSampleRef.current.timestamp,
            ),
            velocity: decayVelocity(
              dragSampleRef.current.velocity,
              settingsRef.current.EMA_ALPHA,
              now - dragSampleRef.current.timestamp,
            ),
            width: target?.offsetWidth ?? dragSampleRef.current.width,
            timestamp: now,
          };
      dragSampleRef.current = sample;
      const wasDragging = currentPhase === "DRAGGING";
      const releaseResolution = resolveDragRelease(
        sample,
        settingsRef.current,
        !isCancel && wasDragging,
      );
      const payload: DragEndPayload = {
        ...sample,
        ...releaseResolution,
        wasDragging,
        wasCancelled: isCancel,
      };

      if (wasDragging) {
        setReleasedVelocity(sample.velocity);
        onDragEnd?.(payload);

        allowedClickTargetRef.current = null;
        lockUntilRef.current = now + settingsRef.current.COOLDOWN_MS;
        setPhase("COOLDOWN");

        if (timeoutRef.current !== null) {
          window.clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = window.setTimeout(() => {
          allowedClickTargetRef.current = null;
          setPhase("IDLE");
          timeoutRef.current = null;
        }, settingsRef.current.COOLDOWN_MS);
      } else {
        setReleasedVelocity(0);
        onDragEnd?.(payload);
        allowedClickTargetRef.current = null;
        setPhase("IDLE");
      }

      dragSampleRef.current = createIdleSample(target?.offsetWidth ?? 0, now);
      currentGesture.lastOffset = 0;
      currentGesture.pointerId = null;
      currentGesture.hasPointerCapture = false;
      currentGesture.isDragActivated = false;
    },
    [createSample, measureRef, onDragEnd, setPhase],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const now = performance.now();
      if (
        !enabled ||
        !e.isPrimary ||
        e.pointerType !== "touch" ||
        e.button !== 0
      )
        return;

      const target = e.currentTarget as HTMLElement;
      const interactiveTarget = getInteractiveTarget(e.target, target);

      if (interactiveTarget && now < lockUntilRef.current) {
        allowedClickTargetRef.current = interactiveTarget;
        return;
      }

      allowedClickTargetRef.current = null;

      if (now < lockUntilRef.current) {
        return;
      }

      gesture.current = {
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastTime: now,
        lastOffset: 0,
        pointerId: e.pointerId,
        hasPointerCapture: false,
        isDragActivated: false,
      };
      dragSampleRef.current = createIdleSample(target.offsetWidth, now);
      setReleasedVelocity(0);
      setPhase("PRESS");

      if (interactiveTarget) {
        // Keep pointer events flowing on interactive slide content so the drag
        // intent threshold can still be reached reliably on touch devices.
        ensurePointerCapture(target, e.pointerId);
      } else {
        activateDragOwnership(target, e.pointerId);
      }
    },
    [activateDragOwnership, enabled, ensurePointerCapture, setPhase],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const currentPhase = phaseRef.current;
      if (currentPhase === "IDLE" || currentPhase === "COOLDOWN") return;
      if (e.pointerId !== gesture.current.pointerId) return;

      const g = gesture.current;
      const now = performance.now();
      const dx = e.clientX - g.startX;
      const dy = e.clientY - g.startY;
      const s = settingsRef.current;

      if (currentPhase === "PRESS") {
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        if (absX > s.INTENT_THRESHOLD || absY > s.INTENT_THRESHOLD) {
          if (absY > absX) {
            stopDragging(true);
            return;
          }

          if (e.cancelable) {
            e.preventDefault();
          }

          activateDragOwnership(e.currentTarget as HTMLElement, e.pointerId);
          const sample = createSample(e.clientX, now);
          dragSampleRef.current = sample;
          setPhase("DRAGGING");
          onDragStart?.(sample);
          onDragMove?.(sample);
        }
        return;
      }

      if (e.cancelable) {
        e.preventDefault();
      }

      const sample = createSample(e.clientX, now);
      dragSampleRef.current = sample;
      onDragMove?.(sample);
    },
    [
      activateDragOwnership,
      createSample,
      onDragMove,
      onDragStart,
      setPhase,
      stopDragging,
    ],
  );

  useEffect(() => {
    const el = measureRef.current;
    if (!el || !enabled) return;

    const suppress = (e: MouseEvent) => {
      if (performance.now() >= lockUntilRef.current) {
        return;
      }

      const allowedClickTarget = allowedClickTargetRef.current;
      const isAllowedClick =
        allowedClickTarget instanceof Element &&
        e.target instanceof Node &&
        allowedClickTarget.contains(e.target);

      if (isAllowedClick) {
        allowedClickTargetRef.current = null;
        return;
      }

      e.preventDefault();
      e.stopPropagation();
    };

    const prevent = (e: TouchEvent) => {
      if (!e.cancelable) {
        return;
      }

      if (phaseRef.current === "DRAGGING") {
        e.preventDefault();
        return;
      }

      if (phaseRef.current !== "PRESS") {
        return;
      }

      const touch = e.touches[0];
      if (!touch) {
        return;
      }

      const dx = touch.clientX - gesture.current.startX;
      const dy = touch.clientY - gesture.current.startY;
      const threshold = settingsRef.current.INTENT_THRESHOLD;

      if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy)) {
        e.preventDefault();
      }
    };

    el.addEventListener("click", suppress, { capture: true });
    el.addEventListener("touchmove", prevent, { passive: false });

    return () => {
      el.removeEventListener("click", suppress, { capture: true });
      el.removeEventListener("touchmove", prevent);

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [enabled, measureRef]);

  const dragListeners: DragListeners = useMemo(() => {
    if (!enabled) return {};

    return {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: (e) => stopDragging(false, e.clientX),
      onPointerCancel: (e) => stopDragging(true, e.clientX),
      onLostPointerCapture: (e) => stopDragging(true, e.clientX),
      style: SHARED_DRAG_STYLES,
    };
  }, [enabled, handlePointerDown, handlePointerMove, stopDragging]);

  return {
    isDragging: state.phase === "DRAGGING",
    isInteracting: state.phase === "PRESS" || state.phase === "DRAGGING",
    velocity: releasedVelocity,
    dragListeners,
  };
}
