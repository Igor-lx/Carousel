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
  readonly onPointerDown: (e: ReactPointerEvent) => void;
  readonly onPointerMove: (e: ReactPointerEvent) => void;
  readonly onPointerUp: (e: ReactPointerEvent) => void;
  readonly onPointerCancel: (e: ReactPointerEvent) => void;
  readonly onLostPointerCapture: (e: ReactPointerEvent) => void;
  readonly style: CSSProperties;
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
