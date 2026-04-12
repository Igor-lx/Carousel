import { useCallback, useRef, useEffect } from "react";
import type { CarouselExternalController } from "../model/context";
import type { Action, MoveReason, State } from "../model/reducer";
import { MIN_DURATION, VELOCITY_COEFFICIENT } from "../model/constants";
import {
  getCurrentVirtualIndexFromDOM,
  type CarouselLayout,
} from "../utilites";

interface ControllerProps {
  dispatch: React.Dispatch<Action>;
  finalize: () => void;
  onReset: () => void;
  enabled: boolean;
  externalController: React.RefObject<CarouselExternalController | null>;
  isMoving: boolean;
  baseSpeed: number;
  measureRef: React.RefObject<HTMLDivElement | null>;
  movingRef: React.RefObject<HTMLDivElement | null>;
  layout: CarouselLayout;
  state: State;
  windowStart: number;
}

interface ControllerResult {
  move: (step: number, moveReason?: MoveReason) => void;
  goTo: (index: number, moveReason?: MoveReason) => void;
  dragStart: () => void;
  dragSnap: () => void;
  finalize: () => void;
  activeSpeed: number;
}

export function useCarouselController({
  dispatch,
  finalize,
  onReset,
  enabled,
  externalController,
  isMoving,
  baseSpeed,
  measureRef,
  movingRef,
  layout,
  state,
  windowStart,
}: ControllerProps): ControllerResult {
  const durationRef = useRef(baseSpeed);
  const lastActionTimeRef = useRef(0);

  useEffect(() => {
    if (!isMoving) {
      durationRef.current = baseSpeed;
      lastActionTimeRef.current = 0;
    }
  }, [isMoving, baseSpeed]);

  const action = useCallback(
    (actionFn: () => void) => {
      onReset();
      actionFn();
    },
    [onReset],
  );

  const updateDuration = useCallback(
    (moveReason: MoveReason) => {
      const now = performance.now();
      const isQuickInput =
        now - lastActionTimeRef.current < durationRef.current + 50;

      if ((isMoving || isQuickInput) && moveReason === "click") {
        durationRef.current = Math.max(
          durationRef.current * VELOCITY_COEFFICIENT,
          MIN_DURATION,
        );
      }

      lastActionTimeRef.current = now;
    },
    [isMoving],
  );

  const move = useCallback(
    (step: number, moveReason: MoveReason = "unknown") => {
      if (!enabled) return;

      updateDuration(moveReason);

      if (externalController.current) {
        if (step > 0) {
          externalController.current.moveRight?.();
        } else if (step < 0) {
          externalController.current.moveLeft?.();
        }
      }

      action(() =>
        dispatch({
          type: "MOVE",
          step,
          moveReason,
          fromVirtualIndex: getCurrentVirtualIndexFromDOM({
            track: movingRef.current,
            viewport: measureRef.current,
            visibleSlides: layout.clampedVisible,
            windowStart,
            fallback: state.virtualIndex,
          }),
        }),
      );
    },
    [enabled, isMoving, action, dispatch, externalController, movingRef, measureRef, layout.clampedVisible, windowStart, state.virtualIndex, updateDuration],
  );

  const goTo = useCallback(
    (index: number, moveReason: MoveReason = "unknown") => {
      if (!enabled) return;
      updateDuration(moveReason);
      action(() =>
        dispatch({
          type: "GO_TO",
          target: index,
          moveReason,
          fromVirtualIndex: getCurrentVirtualIndexFromDOM({
            track: movingRef.current,
            viewport: measureRef.current,
            visibleSlides: layout.clampedVisible,
            windowStart,
            fallback: state.virtualIndex,
          }),
        }),
      );
    },
    [enabled, action, dispatch, movingRef, measureRef, layout.clampedVisible, windowStart, state.virtualIndex, updateDuration],
  );

  const dragStart = useCallback(() => {
    durationRef.current = baseSpeed;
    action(() =>
      dispatch({
        type: "START_DRAG",
        fromVirtualIndex: getCurrentVirtualIndexFromDOM({
          track: movingRef.current,
          viewport: measureRef.current,
          visibleSlides: layout.clampedVisible,
          windowStart,
          fallback: state.virtualIndex,
        }),
      }),
    );
  }, [action, baseSpeed, dispatch, movingRef, measureRef, layout.clampedVisible, windowStart, state.virtualIndex]);

  const dragSnap = useCallback(
    () => {
      dispatch({
        type: "END_DRAG_SNAP",
        fromVirtualIndex: getCurrentVirtualIndexFromDOM({
          track: movingRef.current,
          viewport: measureRef.current,
          visibleSlides: layout.clampedVisible,
          windowStart,
          fallback: state.virtualIndex,
        }),
      });
    },
    [dispatch, movingRef, measureRef, layout.clampedVisible, windowStart, state.virtualIndex],
  );

  const safeFinalize = useCallback(() => {
    onReset();
    finalize();
  }, [onReset, finalize]);

  return {
    move,
    goTo,
    dragStart,
    dragSnap,
    finalize: safeFinalize,
    activeSpeed: durationRef.current,
  };
}
