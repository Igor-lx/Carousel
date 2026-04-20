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
  DRAG_CONFIG as DEFAULT_CONFIG,
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
} from "./model/utilites";

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
    () => ({ ...DEFAULT_CONFIG, ...config }) as Required<DragConfig>,
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
  });

  const setPhase = useCallback((phase: DragPhase) => {
    dispatch({ type: "SET_PHASE", phase });
  }, []);

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
          settingsSnapshot.EMA_ALPHA,
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
    (isCancel = false) => {
      const target = measureRef.current;
      const now = performance.now();
      const currentPhase = phaseRef.current;

      if (gesture.current.pointerId !== null && target) {
        try {
          target.releasePointerCapture(gesture.current.pointerId);
        } catch {}
      }

      if (currentPhase === "IDLE" || currentPhase === "COOLDOWN") {
        return;
      }

      const sample = {
        ...dragSampleRef.current,
        width: target?.offsetWidth ?? dragSampleRef.current.width,
        timestamp: now,
      };
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
      gesture.current.lastOffset = 0;
      gesture.current.pointerId = null;
    },
    [measureRef, onDragEnd, setPhase],
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

      if (interactiveTarget) {
        allowedClickTargetRef.current =
          now < lockUntilRef.current ? interactiveTarget : null;
        return;
      }

      allowedClickTargetRef.current = null;

      if (now < lockUntilRef.current) {
        return;
      }

      try {
        target.setPointerCapture(e.pointerId);
      } catch {}

      gesture.current = {
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastTime: now,
        lastOffset: 0,
        pointerId: e.pointerId,
      };
      dragSampleRef.current = createIdleSample(target.offsetWidth, now);
      setReleasedVelocity(0);
      setPhase("PRESS");
      onPressStart?.();
    },
    [enabled, onPressStart, setPhase],
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
    [createSample, onDragMove, onDragStart, setPhase, stopDragging],
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
      if (phaseRef.current === "DRAGGING" && e.cancelable) {
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
      onPointerUp: () => stopDragging(),
      onPointerCancel: () => stopDragging(true),
      onLostPointerCapture: () => stopDragging(true),
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
