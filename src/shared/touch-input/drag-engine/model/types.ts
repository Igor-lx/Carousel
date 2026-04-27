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

export interface DragEngineSample {
  rawOffset: number;
  offset: number;
  rawVelocity: number;
  velocity: number;
  width: number;
  timestamp: number;
}

export interface DragEngineReleaseResolution {
  result: DragEngineSwipeDirection;
  isQuickFlick: boolean;
  releaseVelocity: number;
}

export interface DragEngineEndPayload
  extends DragEngineSample,
    DragEngineReleaseResolution {
  wasDragging: boolean;
  wasCancelled: boolean;
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
  onDragStart?: (sample: DragEngineSample) => void;
  onDragMove?: (sample: DragEngineSample) => void;
  onDragEnd?: (payload: DragEngineEndPayload) => void;
  enabled?: boolean;
  measureRef: React.RefObject<HTMLElement | null>;
  config?: DragEngineConfig;
}

export interface DragEngineResult {
  isDragging: boolean;
  isInteracting: boolean;
  velocity: number;
  dragListeners: DragEngineListeners;
}
