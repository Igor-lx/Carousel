import type { DragEngineSample } from "../model/types";

export const createIdleSample = (
  width = 0,
  timestamp = 0,
): DragEngineSample => ({
  rawOffset: 0,
  offset: 0,
  rawVelocity: 0,
  velocity: 0,
  width,
  timestamp,
});
