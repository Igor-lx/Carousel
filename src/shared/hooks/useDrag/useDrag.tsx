import { useState, useRef, useCallback, useMemo } from "react";
import { DRAG_CONFIG, STATIC_DRAG_STYLE, EMPTY_STYLE } from "./model/settings";
import type {
  DragResult,
  DragPhase,
  GestureContext,
  DragProps,
} from "./model/types";
import {
  detectSwipeResult,
  calculateVelocity,
  applyPhysics,
} from "./model/utilites";

export function useDrag({
  onDragEnd: onDrag,
  onDragStart,
  enabled = true,
  measureRef,
}: DragProps): DragResult {
  const [isDragging, setIsDragging] = useState(false);
  const offsetRef = useRef(0);
  const wasDraggedRef = useRef(false);

  const state = useRef({
    phase: "IDLE" as DragPhase,
    pointerId: null as number | null,
    width: 0,
    gesture: {
      startX: 0,
      startY: 0,
      lastX: 0,
      lastTime: 0,
      velocity: 0,
      offset: 0,
    } as GestureContext,
  });

  const getDragOffset = useCallback(() => offsetRef.current, []);

  const resetState = useCallback(
    (target?: HTMLElement | null) => {
      const s = state.current;
      const g = s.gesture;

      try {
        if (
          target &&
          s.pointerId !== null &&
          target.hasPointerCapture(s.pointerId)
        ) {
          target.releasePointerCapture(s.pointerId);
        }
      } catch {}

      if (enabled && s.phase === "DRAGGING") {
        const result = detectSwipeResult(g.offset, g.velocity, s.width);
        onDrag?.(result, g.velocity);
      }

      s.phase = "IDLE";
      s.pointerId = null;
      s.width = 0;

      g.startX = g.startY = g.lastX = g.lastTime = g.offset = 0;
      offsetRef.current = 0;

      requestAnimationFrame(() => {
        wasDraggedRef.current = false;
        g.velocity = 0;
      });

      setIsDragging(false);
    },
    [enabled, onDrag],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType !== "touch" || !enabled || !e.isPrimary) return;

      const s = state.current;
      const g = s.gesture;

      s.phase = "PENDING";
      s.pointerId = e.pointerId;
      s.width = measureRef.current?.offsetWidth ?? 0;
      wasDraggedRef.current = false;

      g.startX = g.lastX = e.clientX;
      g.startY = e.clientY;
      g.lastTime = e.timeStamp;
      g.velocity = g.offset = 0;

      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [enabled, measureRef],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const s = state.current;
      if (
        s.phase === "IDLE" ||
        s.pointerId === null ||
        e.pointerId !== s.pointerId
      )
        return;

      const g = s.gesture;
      const dx = e.clientX - g.startX;
      const dy = e.clientY - g.startY;

      if (s.phase === "PENDING") {
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);

        if (
          absX > DRAG_CONFIG.INTENT_THRESHOLD ||
          absY > DRAG_CONFIG.INTENT_THRESHOLD
        ) {
          if (absY > absX) {
            resetState(e.currentTarget as HTMLElement);
            return;
          }
          s.phase = "DRAGGING";
          wasDraggedRef.current = true;
          onDragStart?.();
          setIsDragging(true);
        } else return;
      }

      const dt = Math.max(1, e.timeStamp - g.lastTime);
      g.velocity = calculateVelocity(g.velocity, e.clientX - g.lastX, dt);
      g.lastX = e.clientX;
      g.lastTime = e.timeStamp;
      g.offset = dx;

      offsetRef.current = applyPhysics(dx, s.width);
    },
    [resetState, onDragStart],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      resetState(e.currentTarget as HTMLElement);
    },
    [resetState],
  );

  const handleLostCapture = useCallback(() => {
    if (state.current.phase !== "IDLE") {
      resetState(null);
    }
  }, [resetState]);

  const executeIfWasntDragged = useCallback((callback?: () => void) => {
    if (!wasDraggedRef.current) callback?.();
  }, []);

  const dragListeners = useMemo(
    () => ({
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
      onLostPointerCapture: handleLostCapture,
      style: enabled ? STATIC_DRAG_STYLE : EMPTY_STYLE,
    }),
    [
      enabled,
      handlePointerDown,
      handlePointerMove,
      handlePointerUp,
      handleLostCapture,
    ],
  );

  return {
    isDragging,
    velocity: state.current.gesture.velocity,
    dragListeners,
    getDragOffset,
    getClickFilter: executeIfWasntDragged,
  };
}
