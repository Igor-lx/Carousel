import { type RefObject } from "react";
import {
  type DragEndPayload,
  type DragListeners,
  useDrag,
} from "../../shared";
import { DRAG_SETTINGS_CONFIG } from "../model/config";

interface GestureProps {
  onPressStart: () => void;
  onDragMove: (dragOffset: number) => void;
  onDragEnd: (payload: DragEndPayload) => void;
  enabled: boolean;
  measureRef: RefObject<HTMLDivElement | null>;
}

interface GestureResult {
  isDragging: boolean;
  isInteracting: boolean;
  dragListeners: DragListeners;
}

export function useCarouselGesture({
  onPressStart,
  onDragMove,
  onDragEnd,
  enabled,
  measureRef,
}: GestureProps): GestureResult {
  const { isDragging, isInteracting, dragListeners } = useDrag({
    enabled,
    measureRef,
    onPressStart,
    onDragMove: (sample) => {
      onDragMove(sample.offset);
    },
    config: DRAG_SETTINGS_CONFIG,
    onDragEnd,
  });

  return { isDragging, isInteracting, dragListeners };
}
