import type { SwipeDirection, DragConfig } from "./types";


export const applyResistance = (
  offset: number,
  resistance: number,
  curvature: number,
): number => {
  const sign = Math.sign(offset);
  const abs = Math.abs(offset);
  return sign * (abs / (1 + abs * resistance * curvature));
};


export const calculateEMA = (
  prevV: number,
  instantV: number,
  alpha: number,
): number => {
  return prevV * (1 - alpha) + instantV * alpha;
};


export const getSwipeDirection = (
  offset: number,
  velocity: number,
  width: number,
  config: Required<DragConfig>,
): SwipeDirection => {
  const powerFactor = 1 - config.RESISTANCE;

  const adaptedThreshold = Math.max(
    config.MIN_SWIPE_DISTANCE,
    width * config.SWIPE_THRESHOLD_RATIO * powerFactor,
  );

  const isQuickFlick =
    velocity > config.SWIPE_VELOCITY_LIMIT &&
    Math.abs(offset) > config.QUICK_SWIPE_MIN_OFFSET;

  if (Math.abs(offset) > adaptedThreshold || isQuickFlick) {
    return offset < 0 ? "LEFT" : "RIGHT";
  }

  return "NONE";
};
