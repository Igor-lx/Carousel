import { getMotionTimestamp } from "./motionClock";
import type { NumericMotionSample } from "./numericMotionTypes";

export const DEFAULT_NUMERIC_MOTION_STRATEGY = "idle";

export const createIdleNumericMotionSample = <Strategy extends string>(
  value: number,
  strategy: Strategy,
): NumericMotionSample<Strategy> => ({
  progress: 1,
  value,
  velocity: 0,
  target: value,
  strategy,
  timestamp: getMotionTimestamp(),
  phase: "idle",
});
