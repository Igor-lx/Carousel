import {
  useReducer,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { initialState, dragEngineReducer } from "./model/reducer";
import {
  DEFAULT_DRAG_ENGINE_CONFIG,
  DRAG_ENGINE_STYLES,
} from "./model/config";
import type {
  DragEngineListeners,
  DragEngineProps,
  DragEngineResult,
  DragEngineConfig,
  DragEngineReleasePayload,
  DragEnginePhase,
  DragEngineMovePayload,
} from "./model/types";
import type { DragEngineInternalSample } from "./internal/types";
import { getInteractiveTarget } from "./internal/pointerTargets";
import { createIdleSample } from "./internal/samples";
import { applyResistance } from "./internal/resistance";
import {
  calculateEMA,
  clampVelocityMagnitude,
  decayReleaseVelocity,
  getFrameAdjustedEmaAlpha,
} from "./internal/velocitySampling";
import { resolveDragRelease } from "./internal/releaseIntent";

export function useDragEngine({
  onPressStart,
  onDragStart,
  onDragMove,
  onRelease,
  enabled = true,
  measureRef,
  config = {},
}: DragEngineProps): DragEngineResult {
  const settings = useMemo(
    () =>
      ({
        ...DEFAULT_DRAG_ENGINE_CONFIG,
        ...config,
      }) as Required<DragEngineConfig>,
    [config],
  );

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const [state, dispatch] = useReducer(dragEngineReducer, initialState);

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

  const setPhase = useCallback((phase: DragEnginePhase) => {
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

  const toMovePayload = useCallback(
    (sample: DragEngineInternalSample): DragEngineMovePayload => ({
      uiOffset: sample.uiOffset,
    }),
    [],
  );

  const createSample = useCallback(
    (currentX: number, timestamp: number): DragEngineInternalSample => {
      const currentGesture = gesture.current;
      const settingsSnapshot = settingsRef.current;
      const rawPointerOffset = currentX - currentGesture.startX;
      const uiOffset = applyResistance(
        rawPointerOffset,
        settingsSnapshot.RESISTANCE,
        settingsSnapshot.RESISTANCE_CURVATURE,
      );
      const dt = Math.max(1, timestamp - currentGesture.lastTime);
      const rawPointerVelocity = clampVelocityMagnitude(
        (currentX - currentGesture.lastX) / dt,
        settingsSnapshot.MAX_VELOCITY,
      );
      const instantUiVelocity = clampVelocityMagnitude(
        (uiOffset - currentGesture.lastOffset) / dt,
        settingsSnapshot.MAX_VELOCITY,
      );
      const uiVelocity = clampVelocityMagnitude(
        calculateEMA(
          dragSampleRef.current.uiVelocity,
          instantUiVelocity,
          getFrameAdjustedEmaAlpha(settingsSnapshot.EMA_ALPHA, dt),
        ),
        settingsSnapshot.MAX_VELOCITY,
      );
      const width =
        measureRef.current?.offsetWidth ?? dragSampleRef.current.width;

      currentGesture.lastX = currentX;
      currentGesture.lastTime = timestamp;
      currentGesture.lastOffset = uiOffset;

      return {
        rawPointerOffset,
        uiOffset,
        rawPointerVelocity,
        uiVelocity,
        width,
        timestamp,
      };
    },
    [measureRef],
  );

  const finishInteraction = useCallback(
    (isCancel = false, currentX?: number) => {
      const target = measureRef.current;
      const now = performance.now();
      const currentPhase = phaseRef.current;
      const currentGesture = gesture.current;

      if (
        currentGesture.hasPointerCapture &&
        currentGesture.pointerId !== null &&
        target
      ) {
        try {
          target.releasePointerCapture(currentGesture.pointerId);
        } catch {}

        currentGesture.hasPointerCapture = false;
      }

      if (currentPhase === "IDLE" || currentPhase === "COOLDOWN") {
        return;
      }

      if (!currentGesture.isDragActivated) {
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
            rawPointerVelocity: decayReleaseVelocity(
              dragSampleRef.current.rawPointerVelocity,
              settingsRef.current.EMA_ALPHA,
              now - dragSampleRef.current.timestamp,
            ),
            uiVelocity: decayReleaseVelocity(
              dragSampleRef.current.uiVelocity,
              settingsRef.current.EMA_ALPHA,
              now - dragSampleRef.current.timestamp,
            ),
            width: target?.offsetWidth ?? dragSampleRef.current.width,
            timestamp: now,
          };
      dragSampleRef.current = sample;
      const didReachDragPhase = currentPhase === "DRAGGING";
      const canCommitSwipeIntent = !isCancel && didReachDragPhase;
      const releaseResolution = resolveDragRelease(
        sample,
        settingsRef.current,
        canCommitSwipeIntent,
      );
      const payload: DragEngineReleasePayload = {
        uiOffset: sample.uiOffset,
        result: releaseResolution.result,
        pointerReleaseVelocity: releaseResolution.pointerReleaseVelocity,
        uiReleaseVelocity: sample.uiVelocity,
      };

      if (didReachDragPhase) {
        onRelease?.(payload);

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
        onRelease?.(payload);
        allowedClickTargetRef.current = null;
        setPhase("IDLE");
      }

      dragSampleRef.current = createIdleSample(target?.offsetWidth ?? 0, now);
      currentGesture.lastOffset = 0;
      currentGesture.pointerId = null;
      currentGesture.hasPointerCapture = false;
      currentGesture.isDragActivated = false;
    },
    [createSample, measureRef, onRelease, setPhase],
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
            finishInteraction(true);
            return;
          }

          if (e.cancelable) {
            e.preventDefault();
          }

          activateDragOwnership(e.currentTarget as HTMLElement, e.pointerId);
          const sample = createSample(e.clientX, now);
          dragSampleRef.current = sample;
          setPhase("DRAGGING");
          const payload = toMovePayload(sample);
          onDragStart?.(payload);
          onDragMove?.(payload);
        }
        return;
      }

      if (e.cancelable) {
        e.preventDefault();
      }

      const sample = createSample(e.clientX, now);
      dragSampleRef.current = sample;
      onDragMove?.(toMovePayload(sample));
    },
    [
      activateDragOwnership,
      createSample,
      onDragMove,
      onDragStart,
      setPhase,
      finishInteraction,
      toMovePayload,
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

  const dragListeners: DragEngineListeners = useMemo(() => {
    if (!enabled) return {};

    return {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: (e) => finishInteraction(false, e.clientX),
      onPointerCancel: (e) => finishInteraction(true, e.clientX),
      onLostPointerCapture: (e) => finishInteraction(true, e.clientX),
      style: DRAG_ENGINE_STYLES,
    };
  }, [enabled, handlePointerDown, handlePointerMove, finishInteraction]);

  return {
    isDragging: state.phase === "DRAGGING",
    isInteracting: state.phase === "PRESS" || state.phase === "DRAGGING",
    dragListeners,
  };
}
