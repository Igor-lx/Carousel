import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";

export type DragPhase = "IDLE" | "START" | "DRAGGING" | "COOLDOWN";
export type SwipeDirection = "LEFT" | "RIGHT" | "NONE";

export interface DragState {
  phase: DragPhase;
  offset: number;
  velocity: number;
}

export type DragAction =
  | { type: "SET_START" }
  | { type: "SET_DRAG"; offset: number; velocity: number }
  | { type: "SET_IDLE" }
  | { type: "SET_COOLDOWN" };

export interface DragListeners {
  onPointerDown?: (e: ReactPointerEvent) => void;
  onPointerMove?: (e: ReactPointerEvent) => void;
  onPointerUp?: () => void;
  onPointerCancel?: () => void;
  onLostPointerCapture?: () => void;
  style?: CSSProperties;
}

export interface DragConfig {
  COOLDOWN_MS?: number;
  INTENT_THRESHOLD?: number;
  RESISTANCE?: number;
  RESISTANCE_CURVATURE?: number;
  MAX_VELOCITY?: number;
  EMA_ALPHA?: number;
  SWIPE_VELOCITY_LIMIT?: number;
  QUICK_SWIPE_MIN_OFFSET?: number;
  MIN_SWIPE_DISTANCE?: number;
  SWIPE_THRESHOLD_RATIO?: number;
}

export interface DragProps {
  onDragStart?: () => void;
  onDragEnd?: (result: SwipeDirection, velocity: number, dragOffset: number) => void;
  enabled?: boolean;
  measureRef: React.RefObject<HTMLElement | null>;
  config?: DragConfig;
}

export interface DragResult {
  isDragging: boolean;
  offset: number;
  velocity: number;
  dragListeners: DragListeners;
}
