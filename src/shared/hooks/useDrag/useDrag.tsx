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
} from "./model/types";
import {
  getSwipeDirection,
  calculateEMA,
  applyResistance,
} from "./model/utilites";

export function useDrag({
  onDragStart,
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
  const timeoutRef = useRef<number | null>(null);
  const phaseRef = useRef(state.phase);
  useEffect(() => {
    phaseRef.current = state.phase;
  }, [state.phase]);

  const gesture = useRef({
    startX: 0,
    startY: 0,
    lastX: 0,
    lastTime: 0,
    pointerId: null as number | null,
  });

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

      if (currentPhase === "DRAGGING" && !isCancel) {
        setReleasedVelocity(state.velocity);

        const result = getSwipeDirection(
          state.offset,
          state.velocity,
          target?.offsetWidth ?? 0,
          settingsRef.current,
        );
        onDragEnd?.(result, state.velocity);

        lockUntilRef.current = now + settingsRef.current.COOLDOWN_MS;
        dispatch({ type: "SET_COOLDOWN" });

        if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
        timeoutRef.current = window.setTimeout(() => {
          dispatch({ type: "SET_IDLE" });
          timeoutRef.current = null;
        }, settingsRef.current.COOLDOWN_MS);
      } else {
        setReleasedVelocity(0);
        dispatch({ type: "SET_IDLE" });
      }

      gesture.current.pointerId = null;
    },
    [measureRef, onDragEnd, state.offset, state.velocity],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const now = performance.now();
      if (
        !enabled ||
        !e.isPrimary ||
        e.pointerType !== "touch" ||
        e.button !== 0 ||
        now < lockUntilRef.current
      )
        return;

      const target = e.currentTarget as HTMLElement;
      try {
        target.setPointerCapture(e.pointerId);
      } catch {}

      gesture.current = {
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastTime: now,
        pointerId: e.pointerId,
      };
      dispatch({ type: "SET_START" });
    },
    [enabled],
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

      if (currentPhase === "START") {
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        if (absX > s.INTENT_THRESHOLD || absY > s.INTENT_THRESHOLD) {
          if (absY > absX) {
            stopDragging(true);
            return;
          }
          onDragStart?.();
          dispatch({ type: "SET_DRAG", offset: 0, velocity: 0 });
        }
        return;
      }

      const dt = Math.max(1, now - g.lastTime);
      const instantV = Math.abs((e.clientX - g.lastX) / dt);
      const velocity = calculateEMA(state.velocity, instantV, s.EMA_ALPHA);

      g.lastX = e.clientX;
      g.lastTime = now;

      dispatch({
        type: "SET_DRAG",
        offset: applyResistance(dx, s.RESISTANCE, s.RESISTANCE_CURVATURE),
        velocity: Math.min(velocity, s.MAX_VELOCITY),
      });
    },
    [onDragStart, stopDragging, state.velocity],
  );

  useEffect(() => {
    const el = measureRef.current;
    if (!el || !enabled) return;

    const suppress = (e: MouseEvent) => {
      if (performance.now() < lockUntilRef.current) {
        e.preventDefault();
        e.stopPropagation();
      }
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
  }, [enabled, handlePointerDown, handlePointerMove, stopDragging, state.phase]);

  return {
    isDragging: state.phase === "DRAGGING",
    offset: state.offset,
    velocity: state.phase === "DRAGGING" ? state.velocity : releasedVelocity,
    dragListeners,
  };
}
