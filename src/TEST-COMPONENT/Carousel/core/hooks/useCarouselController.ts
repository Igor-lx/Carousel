import { useCallback, useRef } from "react";
import type { Action, MoveReason } from "../model/reducer";
import type { DragSpeedConfig } from "../../../../shared";
import {
  clamp,
  getAlignedVirtualIndex,
  getNearestPageIndex,
  getPageStart,
  scaleVirtualVelocityToPageVelocity,
  getTrackSlotSize,
  normalizePageIndex,
  getVirtualIndexFromDragOffset,
  type CarouselLayout,
} from "../utilities";
import {
  scaleVelocityToInertia,
  type DragEndPayload,
} from "../../../../shared/hooks/useDrag";

interface ControllerProps {
  dispatchAction: React.Dispatch<Action>;
  enabled: boolean;
  measureRef: React.RefObject<HTMLDivElement | null>;
  layout: CarouselLayout;
  baseVirtualIndex: number;
  dragDurationRampSettings: DragSpeedConfig;
  currentPositionRef: React.MutableRefObject<number>;
  readCurrentPosition: () => number;
  applyDragPosition: (position: number) => void;
}

interface ControllerResult {
  move: (
    step: number,
    moveReason?: MoveReason,
    dragOffset?: number,
  ) => void;
  goTo: (index: number, moveReason?: MoveReason) => void;
  startDrag: () => void;
  updateDrag: (dragOffset: number) => void;
  finishDrag: (payload: DragEndPayload) => void;
}

export function useCarouselController({
  dispatchAction,
  enabled,
  measureRef,
  layout,
  baseVirtualIndex,
  dragDurationRampSettings,
  currentPositionRef,
  readCurrentPosition,
  applyDragPosition,
}: ControllerProps): ControllerResult {
  const dragOriginPageIndexRef = useRef(0);
  const dragOriginPositionRef = useRef<number | null>(null);

  const resolveCurrentPosition = useCallback(() => {
    const position = readCurrentPosition();

    return Number.isFinite(position) ? position : currentPositionRef.current;
  }, [currentPositionRef, readCurrentPosition]);

  const resolveFromVirtualIndex = useCallback(
    (dragOffset?: number) => {
      const dragOriginPosition = dragOriginPositionRef.current;
      const gestureBaseVirtualIndex =
        dragOriginPosition !== null ? dragOriginPosition : baseVirtualIndex;

      if (typeof dragOffset === "number") {
        return getVirtualIndexFromDragOffset({
          baseVirtualIndex: gestureBaseVirtualIndex,
          dragOffset,
          viewport: measureRef.current,
          visibleSlidesNr: layout.clampedVisible,
          fallback: gestureBaseVirtualIndex,
        });
      }

      return resolveCurrentPosition();
    },
    [
      baseVirtualIndex,
      layout.clampedVisible,
      measureRef,
      resolveCurrentPosition,
    ],
  );

  const resolveReleaseVirtualVelocity = useCallback(
    (dragReleaseVelocity: number) => {
      const viewport = measureRef.current;
      if (!viewport) return 0;

      const slotSize = getTrackSlotSize(viewport, layout.clampedVisible);
      if (slotSize <= 0) return 0;

      const releaseVirtualVelocity = -dragReleaseVelocity / slotSize;
      const responseVelocity = scaleVirtualVelocityToPageVelocity(
        releaseVirtualVelocity,
        layout.clampedVisible,
      );

      return scaleVelocityToInertia({
        velocity: releaseVirtualVelocity,
        responseVelocity,
        dragSpeedConfig: dragDurationRampSettings,
      });
    },
    [dragDurationRampSettings, layout.clampedVisible, measureRef],
  );

  const move = useCallback(
    (
      step: number,
      moveReason: MoveReason = "unknown",
      dragOffset?: number,
    ) => {
      if (!enabled) return;

      const fromVirtualIndex = resolveFromVirtualIndex(dragOffset);

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
    const dragOriginPosition = resolveCurrentPosition();
    const dragOriginIndex = getNearestPageIndex(dragOriginPosition, layout);

    dragOriginPageIndexRef.current = dragOriginIndex;
    dragOriginPositionRef.current = dragOriginPosition;
    dispatchAction({
      type: "START_DRAG",
      fromVirtualIndex: dragOriginPosition,
      targetIndex: dragOriginIndex,
    });
  }, [dispatchAction, layout, resolveCurrentPosition]);

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
        releaseVelocity: resolveReleaseVirtualVelocity(payload.releaseVelocity),
      });

      dragOriginPositionRef.current = null;
    },
    [
      applyDragPosition,
      dispatchAction,
      enabled,
      layout,
      resolveFromVirtualIndex,
      resolveReleaseVirtualVelocity,
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
