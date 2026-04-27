import type { DragEngineInternalSample } from "./types";

export const createIdleSample = (
  width = 0,
  timestamp = 0,
): DragEngineInternalSample => ({
  rawPointerOffset: 0,
  uiOffset: 0,
  rawPointerVelocity: 0,
  uiVelocity: 0,
  width,
  timestamp,
});
