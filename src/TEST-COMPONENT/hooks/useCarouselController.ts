import { useCallback, useRef } from "react";
import type { CarouselExternalController } from "../control";
import { DRAG_DURATION_RAMP_CONFIG } from "../model/config";
import type { Action, MoveReason } from "../model/reducer";
import {
  clamp,
  getAlignedVirtualIndex,
  getNearestPageIndex,
  getPageStart,
  getTrackSlotSize,
  normalizePageIndex,
  getVirtualIndexFromDragOffset,
  type CarouselLayout,
} from "../utilities";
import {
  scaleVelocityToInertia,
  type DragEndPayload,
} from "../../shared";

interface ControllerProps {
  dispatchAction: React.Dispatch<Action>;
  enabled: boolean;
  externalController: React.RefObject<CarouselExternalController | null>;
  measureRef: React.RefObject<HTMLDivElement | null>;
  layout: CarouselLayout;
  baseVirtualIndex: number;
  currentPositionRef: React.MutableRefObject<number>;
  applyDragPosition: (position: number) => void;
}

interface ControllerResult {
  move: (
    step: number,
    moveReason?: MoveReason,
    dragOffset?: number,
    skipExternalSync?: boolean,
  ) => void;
  goTo: (index: number, moveReason?: MoveReason) => void;
  startDrag: () => void;
  updateDrag: (dragOffset: number) => void;
  finishDrag: (payload: DragEndPayload) => void;
}

export function useCarouselController({
  dispatchAction,
  enabled,
  externalController,
  measureRef,
  layout,
  baseVirtualIndex,
  currentPositionRef,
  applyDragPosition,
}: ControllerProps): ControllerResult {
  const dragOriginPageIndexRef = useRef(0);

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

  const resolveReleaseVelocity = useCallback(
    (dragVelocity: number) => {
      const viewport = measureRef.current;
      if (!viewport) return 0;

      const slotSize = getTrackSlotSize(viewport, layout.clampedVisible);
      if (slotSize <= 0) return 0;

      const virtualVelocity = -dragVelocity / slotSize;

      return scaleVelocityToInertia({
        velocity: virtualVelocity,
        dragSpeedConfig: DRAG_DURATION_RAMP_CONFIG,
      });
    },
    [layout.clampedVisible, measureRef],
  );

  const move = useCallback(
    (
      step: number,
      moveReason: MoveReason = "unknown",
      dragOffset?: number,
      skipExternalSync = false,
    ) => {
      if (!enabled) return;

      const fromVirtualIndex = resolveFromVirtualIndex(dragOffset);

      if (!skipExternalSync) {
        syncExternalController(step);
      }

      dispatchAction({
        type: "MOVE",
        step,
        moveReason,
        fromVirtualIndex,
      });
    },
    [
      dispatchAction,
      enabled,
      resolveFromVirtualIndex,
      syncExternalController,
    ],
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
    const dragOriginPosition = currentPositionRef.current;
    const dragOriginIndex = getNearestPageIndex(dragOriginPosition, layout);

    dragOriginPageIndexRef.current = dragOriginIndex;
    dispatchAction({
      type: "START_DRAG",
      fromVirtualIndex: dragOriginPosition,
      targetIndex: dragOriginIndex,
    });
  }, [currentPositionRef, dispatchAction, layout]);

  const updateDrag = useCallback(
    (dragOffset: number) => {
      const position = resolveFromVirtualIndex(dragOffset);
      applyDragPosition(position);
    },
    [applyDragPosition, resolveFromVirtualIndex],
  );

  const finishDrag = useCallback(
    (payload: DragEndPayload) => {
      if (!enabled) return;

      const releasePosition = resolveFromVirtualIndex(payload.offset);
      const snapTargetIndex = getNearestPageIndex(releasePosition, layout);
      const dragOriginIndex = dragOriginPageIndexRef.current;
      let targetIndex = snapTargetIndex;
      let isSnap = true;

      if (!payload.wasCancelled) {
        if (payload.result === "LEFT") {
          targetIndex = layout.isFinite
            ? clamp(dragOriginIndex + 1, 0, layout.pageCount - 1)
            : normalizePageIndex(dragOriginIndex + 1, layout.pageCount);
          isSnap = targetIndex === dragOriginIndex;
        } else if (payload.result === "RIGHT") {
          targetIndex = layout.isFinite
            ? clamp(dragOriginIndex - 1, 0, layout.pageCount - 1)
            : normalizePageIndex(dragOriginIndex - 1, layout.pageCount);
          isSnap = targetIndex === dragOriginIndex;
        }
      }

      const targetVirtualIndex = layout.isFinite
        ? getPageStart(targetIndex, layout.clampedVisible)
        : getAlignedVirtualIndex(targetIndex, releasePosition, layout);

      applyDragPosition(releasePosition);

      dispatchAction({
        type: "END_DRAG",
        fromVirtualIndex: releasePosition,
        targetIndex,
        targetVirtualIndex,
        isSnap: isSnap || Math.abs(targetVirtualIndex - releasePosition) < 0.001,
        releaseVelocity: resolveReleaseVelocity(payload.velocity),
      });
    },
    [
      applyDragPosition,
      dispatchAction,
      enabled,
      layout,
      resolveFromVirtualIndex,
      resolveReleaseVelocity,
    ],
  );

  return {
    move,
    goTo,
    startDrag,
    updateDrag,
    finishDrag,
  };
}
