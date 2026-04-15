import { useCallback } from "react";
import type { CarouselExternalController } from "../control";
import type { Action, MoveReason } from "../model/reducer";
import {
  getVirtualIndexFromDragOffset,
  type CarouselLayout,
} from "../utilities";

interface ControllerProps {
  dispatchAction: React.Dispatch<Action>;
  enabled: boolean;
  externalController: React.RefObject<CarouselExternalController | null>;
  measureRef: React.RefObject<HTMLDivElement | null>;
  layout: CarouselLayout;
  baseVirtualIndex: number;
  currentPositionRef: React.MutableRefObject<number>;
}

interface ControllerResult {
  move: (step: number, moveReason?: MoveReason, dragOffset?: number) => void;
  goTo: (index: number, moveReason?: MoveReason) => void;
  startDrag: () => void;
  snapDrag: (dragOffset?: number) => void;
}

export function useCarouselController({
  dispatchAction,
  enabled,
  externalController,
  measureRef,
  layout,
  baseVirtualIndex,
  currentPositionRef,
}: ControllerProps): ControllerResult {
  const resolveFromVirtualIndex = useCallback(
    (dragOffset?: number) => {
      if (typeof dragOffset === "number") {
        return getVirtualIndexFromDragOffset({
          baseVirtualIndex,
          dragOffset,
          viewport: measureRef.current,
          visibleSlidesNr: layout.clampedVisible,
          fallback: baseVirtualIndex,
        });
      }

      return currentPositionRef.current;
    },
    [
      baseVirtualIndex,
      currentPositionRef,
      layout.clampedVisible,
      measureRef,
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

      const fromVirtualIndex = resolveFromVirtualIndex(dragOffset);

      syncExternalController(step);

      dispatchAction({
        type: "MOVE",
        step,
        moveReason,
        fromVirtualIndex,
      });
    },
    [dispatchAction, enabled, resolveFromVirtualIndex, syncExternalController],
  );

  const goTo = useCallback(
    (index: number, moveReason: MoveReason = "unknown") => {
      if (!enabled) return;
      dispatchAction({
        type: "GO_TO",
        target: index,
        moveReason,
        fromVirtualIndex: resolveFromVirtualIndex(),
      });
    },
    [dispatchAction, enabled, resolveFromVirtualIndex],
  );

  const startDrag = useCallback(() => {
    dispatchAction({
      type: "START_DRAG",
      fromVirtualIndex: currentPositionRef.current,
    });
  }, [currentPositionRef, dispatchAction]);

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
  };
}
