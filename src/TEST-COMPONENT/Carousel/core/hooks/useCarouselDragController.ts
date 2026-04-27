import { useCallback, useRef } from "react";

import type { Action } from "../model/reducer";
import {
  clamp,
  getAlignedVirtualIndex,
  getNearestPageIndex,
  getPageStart,
  getTrackSlotSize,
  getVirtualIndexFromDragOffset,
  normalizePageIndex,
  type CarouselLayout,
} from "../utilities";
import { type DragEngineReleasePayload } from "../../../../shared/touch-input";

interface UseCarouselDragControllerProps {
  dispatchAction: React.Dispatch<Action>;
  enabled: boolean;
  measureRef: React.RefObject<HTMLDivElement | null>;
  layout: CarouselLayout;
  baseVirtualIndex: number;
  dragReleaseEpsilon: number;
  currentPositionRef: React.MutableRefObject<number>;
  readCurrentPosition: () => number;
  applyDragPosition: (position: number) => void;
}

interface UseCarouselDragControllerResult {
  startDrag: () => void;
  updateDrag: (dragOffset: number) => void;
  finishDrag: (payload: DragEngineReleasePayload) => void;
}

const toVirtualPointerVelocity = (
  pointerVelocity: number,
  slotSize: number,
) => {
  if (!Number.isFinite(pointerVelocity) || !(slotSize > 0)) {
    return 0;
  }

  return -(pointerVelocity / slotSize);
};

export function useCarouselDragController({
  dispatchAction,
  enabled,
  measureRef,
  layout,
  baseVirtualIndex,
  dragReleaseEpsilon,
  currentPositionRef,
  readCurrentPosition,
  applyDragPosition,
}: UseCarouselDragControllerProps): UseCarouselDragControllerResult {
  const dragOriginPageIndexRef = useRef(0);
  const dragOriginPositionRef = useRef<number | null>(null);

  const resolveCurrentPosition = useCallback(() => {
    const position = readCurrentPosition();

    return Number.isFinite(position) ? position : currentPositionRef.current;
  }, [currentPositionRef, readCurrentPosition]);

  const resolveDragPosition = useCallback(
    (dragOffset: number) => {
      const dragOriginPosition = dragOriginPositionRef.current;
      const gestureBaseVirtualIndex =
        dragOriginPosition !== null ? dragOriginPosition : baseVirtualIndex;

      return getVirtualIndexFromDragOffset({
        baseVirtualIndex: gestureBaseVirtualIndex,
        dragOffset,
        viewport: measureRef.current,
        visibleSlidesNr: layout.clampedVisible,
        fallback: gestureBaseVirtualIndex,
      });
    },
    [baseVirtualIndex, layout.clampedVisible, measureRef],
  );

  const resolveVirtualPointerVelocity = useCallback(
    (pointerVelocity: number) => {
      const viewport = measureRef.current;
      if (!viewport) return 0;

      const slotSize = getTrackSlotSize(viewport, layout.clampedVisible);

      return toVirtualPointerVelocity(pointerVelocity, slotSize);
    },
    [layout.clampedVisible, measureRef],
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
      const position = resolveDragPosition(dragOffset);
      applyDragPosition(position);
    },
    [applyDragPosition, resolveDragPosition],
  );

  const finishDrag = useCallback(
    (payload: DragEngineReleasePayload) => {
      if (!enabled) return;

      const releasePosition = resolveDragPosition(payload.uiOffset);
      const snapTargetIndex = getNearestPageIndex(releasePosition, layout);
      const dragOriginIndex = dragOriginPageIndexRef.current;
      let targetIndex = snapTargetIndex;
      let isSnap = true;

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

      const targetVirtualIndex = layout.isFinite
        ? getPageStart(targetIndex, layout.clampedVisible)
        : getAlignedVirtualIndex(targetIndex, releasePosition, layout);

      applyDragPosition(releasePosition);

      dispatchAction({
        type: "END_DRAG",
        fromVirtualIndex: releasePosition,
        targetIndex,
        targetVirtualIndex,
        isSnap:
          isSnap ||
          Math.abs(targetVirtualIndex - releasePosition) < dragReleaseEpsilon,
        pointerReleaseVelocity: resolveVirtualPointerVelocity(
          payload.pointerReleaseVelocity,
        ),
        uiReleaseVelocity: resolveVirtualPointerVelocity(
          payload.uiReleaseVelocity,
        ),
      });

      dragOriginPositionRef.current = null;
    },
    [
      applyDragPosition,
      dispatchAction,
      dragReleaseEpsilon,
      enabled,
      layout,
      resolveDragPosition,
      resolveVirtualPointerVelocity,
    ],
  );

  return {
    startDrag,
    updateDrag,
    finishDrag,
  };
}
