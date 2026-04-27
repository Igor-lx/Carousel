import type { DragEngineSwipeDirection } from "../model/types";

export interface DragEngineInternalSample {
  rawPointerOffset: number;
  uiOffset: number;
  rawPointerVelocity: number;
  uiVelocity: number;
  width: number;
  timestamp: number;
}

export interface DragEngineReleaseResolution {
  result: DragEngineSwipeDirection;
  pointerReleaseVelocity: number;
}
