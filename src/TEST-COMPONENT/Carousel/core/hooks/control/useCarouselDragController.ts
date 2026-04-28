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
  dragReleaseEpsilon: number;
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
  dragReleaseEpsilon,
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

      return getVirtualVelocityFromPointerVelocity(pointerVelocity, slotSize);
    },
    [layout.clampedVisible, measureRef],
  );

  const startDrag = useCallback(() => {
    const dragOriginPosition = readCurrentPosition();
    const dragOriginIndex = getNearestPageIndex(dragOriginPosition, layout);

    dragOriginPageIndexRef.current = dragOriginIndex;
    dragOriginPositionRef.current = dragOriginPosition;
    dispatchAction({
      type: "START_DRAG",
      fromVirtualIndex: dragOriginPosition,
      targetIndex: dragOriginIndex,
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
      const dragOriginIndex = dragOriginPageIndexRef.current;
      const releaseTarget = resolveCarouselDragReleaseTarget({
        releaseDirection: payload.result,
        releasePosition,
        dragOriginPageIndex: dragOriginIndex,
        layout,
        dragReleaseEpsilon,
      });

      applyDragPosition(releasePosition);

      dispatchAction({
        type: "END_DRAG",
        fromVirtualIndex: releasePosition,
        targetIndex: releaseTarget.targetIndex,
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
