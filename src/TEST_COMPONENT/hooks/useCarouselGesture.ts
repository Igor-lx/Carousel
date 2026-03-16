import { type RefObject } from "react";

import { useDragTouchHoriz, type DragListeners } from "../../utilites_global";
import type { MoveReason } from "../types/reducer.types";

interface GestureProps {
  readonly onMove: (step: number, reason: MoveReason) => void;
  readonly onDragStart: () => void;
  readonly onDragSnap: () => void;
  readonly enabled: boolean;
  readonly measureRef: RefObject<HTMLDivElement | null>;
}

interface GestureResult {
  readonly isDragging: boolean;
  readonly velocity: number;
  readonly dragListeners: DragListeners;
  readonly getDragOffset: () => number;
  readonly getClickFilter: (callback?: () => void) => void;
}

export function useCarouselGesture({
  onMove,
  onDragStart,
  onDragSnap,
  enabled,
  measureRef,
}: GestureProps): GestureResult {
  const { isDragging, velocity, dragListeners, getDragOffset, getClickFilter } =
    useDragTouchHoriz({
      enabled,
      measureRef,
      onDragStart: () => {
        onDragStart();
      },

      onDragEnd: (result) => {
        if (result === "SWIPED_LEFT") {
          onMove(1, "gesture");
        } else if (result === "SWIPED_RIGHT") {
          onMove(-1, "gesture");
        } else {
          onDragSnap();
        }
      },
    });

  return { isDragging, velocity, dragListeners, getDragOffset, getClickFilter };
}
