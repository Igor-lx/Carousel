import { type RefObject } from "react";
import type { MoveReason } from "../model/reducer";
import { type DragListeners, useDrag } from "../../shared";
import { GESTURE_CONFIG } from "../model/constants";

interface GestureProps {
  onMove: (step: number, reason: MoveReason, dragOffset?: number) => void;
  onDragStart: () => void;
  onDragSnap: (dragOffset?: number) => void;
  enabled: boolean;
  measureRef: RefObject<HTMLDivElement | null>;
}

interface GestureResult {
  isDragging: boolean;
  velocity: number;
  dragListeners: DragListeners;
  offset: number;
}

export function useCarouselGesture({
  onMove,
  onDragStart,
  onDragSnap,
  enabled,
  measureRef,
}: GestureProps): GestureResult {
  const { isDragging, velocity, dragListeners, offset } = useDrag({
    enabled,
    measureRef,
    onDragStart,
    config: GESTURE_CONFIG,
    onDragEnd: (result, _velocity, dragOffset) => {
      if (result === "LEFT") {
        onMove(1, "gesture", dragOffset);
      } else if (result === "RIGHT") {
        onMove(-1, "gesture", dragOffset);
      } else {
        onDragSnap(dragOffset);
      }
    },
  });

  return { isDragging, velocity, dragListeners, offset };
}
