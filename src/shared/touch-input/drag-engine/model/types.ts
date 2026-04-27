import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";

export type DragEnginePhase = "IDLE" | "PRESS" | "DRAGGING" | "COOLDOWN";
export type DragEngineSwipeDirection = "LEFT" | "RIGHT" | "NONE";

export interface DragEngineState {
  phase: DragEnginePhase;
}

export type DragEngineAction = {
  type: "SET_PHASE";
  phase: DragEnginePhase;
};

export interface DragEngineMovePayload {
  uiOffset: number;
}

export interface DragEngineReleasePayload extends DragEngineMovePayload {
  result: DragEngineSwipeDirection;
  pointerReleaseVelocity: number;
  uiReleaseVelocity: number;
}

export interface DragEngineListeners {
  onPointerDown?: (e: ReactPointerEvent) => void;
  onPointerMove?: (e: ReactPointerEvent) => void;
  onPointerUp?: (e: ReactPointerEvent) => void;
  onPointerCancel?: (e: ReactPointerEvent) => void;
  onLostPointerCapture?: (e: ReactPointerEvent) => void;
  style?: CSSProperties;
}

export interface DragEngineConfig {
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

export interface DragEngineProps {
  onPressStart?: () => void;
  onDragStart?: (payload: DragEngineMovePayload) => void;
  onDragMove?: (payload: DragEngineMovePayload) => void;
  onRelease?: (payload: DragEngineReleasePayload) => void;
  enabled?: boolean;
  measureRef: React.RefObject<HTMLElement | null>;
  config?: DragEngineConfig;
}

export interface DragEngineResult {
  isDragging: boolean;
  isInteracting: boolean;
  dragListeners: DragEngineListeners;
}
