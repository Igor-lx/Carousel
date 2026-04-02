import { type RefObject } from "react";

import { useDrag, type DragListeners } from "../../../shared";
import type { MoveReason } from "../model/reducer";


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
}

export function useCarouselGesture({
  onMove,
  onDragStart,
  onDragSnap,
  enabled,
  measureRef,
}: GestureProps): GestureResult {
  const { isDragging, velocity, dragListeners, getDragOffset } = useDrag({
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

  return { isDragging, velocity, dragListeners, getDragOffset };
}
