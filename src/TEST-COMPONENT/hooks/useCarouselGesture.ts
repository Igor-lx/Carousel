import { type RefObject } from "react";
import {
  type DragEndPayload,
  type DragListeners,
  useDrag,
} from "../../shared";
import { DRAG_SETTINGS_CONFIG } from "../model/config";

interface GestureProps {
  onPressStart: () => void;
  onDragStart: () => void;
  onDragMove: (dragOffset: number) => void;
  onDragEnd: (payload: DragEndPayload) => void;
  enabled: boolean;
  measureRef: RefObject<HTMLDivElement | null>;
}

interface GestureResult {
  isDragging: boolean;
  isInteracting: boolean;
  velocity: number;
  dragListeners: DragListeners;
}

export function useCarouselGesture({
  onPressStart,
  onDragStart,
  onDragMove,
  onDragEnd,
  enabled,
  measureRef,
}: GestureProps): GestureResult {
  const { isDragging, isInteracting, velocity, dragListeners } = useDrag({
    enabled,
    measureRef,
    onPressStart,
    onDragStart,
    onDragMove: (sample) => {
      onDragMove(sample.offset);
    },
    config: DRAG_SETTINGS_CONFIG,
    onDragEnd,
  });

  return { isDragging, isInteracting, velocity, dragListeners };
}
