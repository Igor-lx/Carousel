import { type RefObject } from "react";


import type { MoveReason } from "../model/reducer";
import { type DragListeners, useDrag } from "../../shared";


interface GestureProps {
  onMove: (step: number, reason: MoveReason) => void;
  onDragStart: () => void;
  onDragSnap: () => void;
  enabled: boolean;
  measureRef: RefObject<HTMLDivElement | null>;
}

interface GestureResult {
  isDragging: boolean;
  velocity: number;
  dragListeners: DragListeners;
  getDragOffset: () => number;
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
