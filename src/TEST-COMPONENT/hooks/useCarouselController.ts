import { useCallback, useEffect, useRef } from "react";
import type { CarouselExternalController } from "../control";
import type { Action, MoveReason, State } from "../model/reducer";
import { MIN_DURATION, VELOCITY_COEFFICIENT } from "../model/constants";
import {
  getCurrentVirtualIndexFromDOM,
  getVirtualIndexFromDragOffset,
  type CarouselLayout,
} from "../utilities";

interface ControllerProps {
  dispatchAction: React.Dispatch<Action>;
  finalizeStep: () => void;
  enabled: boolean;
  externalController: React.RefObject<CarouselExternalController | null>;
  isMoving: boolean;
  stepDuration: number;
  measureRef: React.RefObject<HTMLDivElement | null>;
  movingRef: React.RefObject<HTMLDivElement | null>;
  layout: CarouselLayout;
  state: State;
  windowStart: number;
}

interface ControllerResult {
  move: (step: number, moveReason?: MoveReason, dragOffset?: number) => void;
  goTo: (index: number, moveReason?: MoveReason) => void;
  startDrag: () => void;
  snapDrag: (dragOffset?: number) => void;
  finalizeStep: () => void;
  activeStepDuration: number;
}

export function useCarouselController({
  dispatchAction,
  finalizeStep,
  enabled,
  externalController,
  isMoving,
  stepDuration,
  measureRef,
  movingRef,
  layout,
  state,
  windowStart,
}: ControllerProps): ControllerResult {
  const durationRef = useRef(stepDuration);
  const lastActionTimeRef = useRef(0);

  useEffect(() => {
    if (!isMoving) {
      durationRef.current = stepDuration;
      lastActionTimeRef.current = 0;
    }
  }, [isMoving, stepDuration]);

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

  const getMeasuredVirtualIndex = useCallback(
    () =>
      getCurrentVirtualIndexFromDOM({
        track: movingRef.current,
        viewport: measureRef.current,
        visibleSlidesNr: layout.clampedVisible,
        windowStart,
        fallback: state.virtualIndex,
      }),
    [
      layout.clampedVisible,
      measureRef,
      movingRef,
      state.virtualIndex,
      windowStart,
    ],
  );

  const resolveFromVirtualIndex = useCallback(
    (dragOffset?: number) => {
      if (typeof dragOffset === "number") {
        return getVirtualIndexFromDragOffset({
          baseVirtualIndex: state.virtualIndex,
          dragOffset,
          viewport: measureRef.current,
          visibleSlidesNr: layout.clampedVisible,
          fallback: state.virtualIndex,
        });
      }

      return getMeasuredVirtualIndex();
    },
    [
      getMeasuredVirtualIndex,
      layout.clampedVisible,
      measureRef,
      state.virtualIndex,
    ],
  );

  const syncExternalController = useCallback(
    (step: number) => {
      if (step > 0) {
        externalController.current?.moveRight?.();
        return;
      }

      if (step < 0) {
        externalController.current?.moveLeft?.();
      }
    },
    [externalController],
  );

  const move = useCallback(
    (
      step: number,
      moveReason: MoveReason = "unknown",
      dragOffset?: number,
    ) => {
      if (!enabled) return;

      updateDuration(moveReason);
      syncExternalController(step);

      dispatchAction({
        type: "MOVE",
        step,
        moveReason,
        fromVirtualIndex: resolveFromVirtualIndex(dragOffset),
      });
    },
    [
      dispatchAction,
      enabled,
      resolveFromVirtualIndex,
      syncExternalController,
      updateDuration,
    ],
  );

  const goTo = useCallback(
    (index: number, moveReason: MoveReason = "unknown") => {
      if (!enabled) return;
      updateDuration(moveReason);
      dispatchAction({
        type: "GO_TO",
        target: index,
        moveReason,
        fromVirtualIndex: resolveFromVirtualIndex(),
      });
    },
    [dispatchAction, enabled, resolveFromVirtualIndex, updateDuration],
  );

  const startDrag = useCallback(() => {
    durationRef.current = stepDuration;
    dispatchAction({
      type: "START_DRAG",
      fromVirtualIndex: getMeasuredVirtualIndex(),
    });
  }, [dispatchAction, getMeasuredVirtualIndex, stepDuration]);

  const snapDrag = useCallback(
    (dragOffset?: number) => {
      dispatchAction({
        type: "END_DRAG_SNAP",
        fromVirtualIndex: resolveFromVirtualIndex(dragOffset),
      });
    },
    [dispatchAction, resolveFromVirtualIndex],
  );

  return {
    move,
    goTo,
    startDrag,
    snapDrag,
    finalizeStep,
    activeStepDuration: durationRef.current,
  };
}
