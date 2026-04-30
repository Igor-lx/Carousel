import { useCallback, useRef } from "react";

import type { Action } from "../../model/reducer";
import {
  getNearestPageIndex,
  getTrackSlotSize,
  getVirtualVelocityFromPointerVelocity,
  getVirtualIndexFromDragOffset,
  resolveCarouselDragReleaseTarget,
} from "../../utilities";
import type { CarouselLayout } from "../../utilities";
import { type DragEngineReleasePayload } from "../../../../../shared/touch-input";

interface UseCarouselDragControllerProps {
  dispatchAction: React.Dispatch<Action>;
  enabled: boolean;
  measureRef: React.RefObject<HTMLDivElement | null>;
  layout: CarouselLayout;
  baseVirtualIndex: number;
  readCurrentPosition: () => number;
  applyDragPosition: (position: number) => void;
}

interface UseCarouselDragControllerResult {
  startDrag: () => void;
  updateDrag: (dragOffset: number) => void;
  finishDrag: (payload: DragEngineReleasePayload) => void;
}

export function useCarouselDragController({
  dispatchAction,
  enabled,
  measureRef,
  layout,
  baseVirtualIndex,
  readCurrentPosition,
  applyDragPosition,
}: UseCarouselDragControllerProps): UseCarouselDragControllerResult {
  const dragOriginPageIndexRef = useRef(0);
  const dragOriginPositionRef = useRef<number | null>(null);
  const cachedSlotSizeRef = useRef<number>(0);

  const resolveDragPosition = useCallback(
    (dragOffset: number) => {
      const dragOriginPosition = dragOriginPositionRef.current;
      const gestureBaseVirtualIndex =
        dragOriginPosition !== null ? dragOriginPosition : baseVirtualIndex;

      return getVirtualIndexFromDragOffset({
        baseVirtualIndex: gestureBaseVirtualIndex,
        dragOffset,
        viewport: measureRef.current,
        visibleSlidesCount: layout.visibleSlidesCount,
        fallback: gestureBaseVirtualIndex,
        slotSize: cachedSlotSizeRef.current,
      });
    },
    [baseVirtualIndex, layout.visibleSlidesCount, measureRef],
  );

  const resolveVirtualPointerVelocity = useCallback(
    (pointerVelocity: number) => {
      const slotSize =
        cachedSlotSizeRef.current ||
        (measureRef.current
          ? getTrackSlotSize(measureRef.current, layout.visibleSlidesCount)
          : 0);

      if (!(slotSize > 0)) return 0;

      return getVirtualVelocityFromPointerVelocity(pointerVelocity, slotSize);
    },
    [layout.visibleSlidesCount, measureRef],
  );

  const startDrag = useCallback(() => {
    const viewport = measureRef.current;
    if (viewport) {
      cachedSlotSizeRef.current = getTrackSlotSize(
        viewport,
        layout.visibleSlidesCount,
      );
    }

    const dragOriginPosition = readCurrentPosition();
    const dragOriginPageIndex = getNearestPageIndex(dragOriginPosition, layout);

    dragOriginPageIndexRef.current = dragOriginPageIndex;
    dragOriginPositionRef.current = dragOriginPosition;
    dispatchAction({
      type: "START_DRAG",
      fromVirtualIndex: dragOriginPosition,
      targetPageIndex: dragOriginPageIndex,
    });
  }, [dispatchAction, layout, measureRef, readCurrentPosition]);

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
      const dragOriginPageIndex = dragOriginPageIndexRef.current;
      const releaseTarget = resolveCarouselDragReleaseTarget({
        releasePosition,
        dragOriginPageIndex,
        layout,
        releaseDirection: payload.result,
      });

      applyDragPosition(releasePosition);

      dispatchAction({
        type: "END_DRAG",
        fromVirtualIndex: releasePosition,
        targetPageIndex: releaseTarget.targetPageIndex,
        targetVirtualIndex: releaseTarget.targetVirtualIndex,
        isSnap: releaseTarget.isSnap,
        pointerReleaseVelocity: resolveVirtualPointerVelocity(
          payload.pointerReleaseVelocity,
        ),
        uiReleaseVelocity: resolveVirtualPointerVelocity(
          payload.uiReleaseVelocity,
        ),
      });

      dragOriginPositionRef.current = null;
      cachedSlotSizeRef.current = 0;
    },
    [
      applyDragPosition,
      dispatchAction,
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
