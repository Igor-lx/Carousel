import {
  type PointerEvent as ReactPointerEvent,
  type CSSProperties,
  type RefObject,
} from "react";

export type DragGestureResult = "SWIPED_LEFT" | "SWIPED_RIGHT" | "NONE";
export type DragPhase = "IDLE" | "PENDING" | "DRAGGING";

export interface GestureContext {
  startX: number;
  startY: number;
  lastX: number;
  lastTime: number;
  velocity: number;
  offset: number;
}

export interface DragListeners {
  onPointerDown: (e: ReactPointerEvent) => void;
  onPointerMove: (e: ReactPointerEvent) => void;
  onPointerUp: (e: ReactPointerEvent) => void;
  onPointerCancel: (e: ReactPointerEvent) => void;
  onLostPointerCapture: (e: ReactPointerEvent) => void;
  style: CSSProperties;
}

export interface DragProps {
  onDragStart?: () => void;
  onDragEnd?: (result: DragGestureResult, velocity: number) => void;
  enabled?: boolean;
  measureRef: RefObject<HTMLDivElement | null>;
}

export interface DragResult {
  isDragging: boolean;
  velocity: number;
  getDragOffset: () => number;
  getClickFilter: (callback?: () => void) => void;
  dragListeners: DragListeners;
}
