import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";

export type DragPhase = "IDLE" | "PRESS" | "DRAGGING" | "COOLDOWN";
export type SwipeDirection = "LEFT" | "RIGHT" | "NONE";

export interface DragState {
  phase: DragPhase;
}

export type DragAction = {
  type: "SET_PHASE";
  phase: DragPhase;
};

export interface DragSample {
  rawOffset: number;
  offset: number;
  rawVelocity: number;
  velocity: number;
  width: number;
  timestamp: number;
}

export interface DragReleaseResolution {
  result: SwipeDirection;
  isQuickFlick: boolean;
  releaseVelocity: number;
}

export interface DragEndPayload extends DragSample, DragReleaseResolution {
  wasDragging: boolean;
  wasCancelled: boolean;
}

export interface DragListeners {
  onPointerDown?: (e: ReactPointerEvent) => void;
  onPointerMove?: (e: ReactPointerEvent) => void;
  onPointerUp?: (e: ReactPointerEvent) => void;
  onPointerCancel?: (e: ReactPointerEvent) => void;
  onLostPointerCapture?: (e: ReactPointerEvent) => void;
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
  onPressStart?: () => void;
  onDragStart?: (sample: DragSample) => void;
  onDragMove?: (sample: DragSample) => void;
  onDragEnd?: (payload: DragEndPayload) => void;
  enabled?: boolean;
  measureRef: React.RefObject<HTMLElement | null>;
  config?: DragConfig;
}

export interface DragResult {
  isDragging: boolean;
  isInteracting: boolean;
  velocity: number;
  dragListeners: DragListeners;
}
