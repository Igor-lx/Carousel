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
      });
    },
    [baseVirtualIndex, layout.visibleSlidesCount, measureRef],
  );

  const resolveVirtualPointerVelocity = useCallback(
    (pointerVelocity: number) => {
      const viewport = measureRef.current;
      if (!viewport) return 0;

      const slotSize = getTrackSlotSize(viewport, layout.visibleSlidesCount);

      return getVirtualVelocityFromPointerVelocity(pointerVelocity, slotSize);
    },
    [layout.visibleSlidesCount, measureRef],
  );

  const startDrag = useCallback(() => {
    const dragOriginPosition = readCurrentPosition();
    const dragOriginPageIndex = getNearestPageIndex(dragOriginPosition, layout);

    dragOriginPageIndexRef.current = dragOriginPageIndex;
    dragOriginPositionRef.current = dragOriginPosition;
    dispatchAction({
      type: "START_DRAG",
      fromVirtualIndex: dragOriginPosition,
      targetPageIndex: dragOriginPageIndex,
    });
  }, [dispatchAction, layout, readCurrentPosition]);

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
        releaseDirection: payload.result,
        releasePosition,
        dragOriginPageIndex,
        layout,
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
