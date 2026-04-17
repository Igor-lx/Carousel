import type { SwipeDirection, DragConfig } from "./types";

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(value, max));

const clampMagnitude = (value: number, limit: number) => {
  if (!Number.isFinite(value) || !(limit > 0)) {
    return 0;
  }

  return Math.sign(value) * Math.min(Math.abs(value), limit);
};

const getSafeResistance = (resistance: number) => clamp(resistance, 0, 1);

export const applyResistance = (
  offset: number,
  resistance: number,
  curvature: number,
): number => {
  const sign = Math.sign(offset);
  const abs = Math.abs(offset);
  const safeResistance = getSafeResistance(resistance);
  const resistanceStrength =
    safeResistance <= 0
      ? 0
      : safeResistance / Math.max(1 - safeResistance, 0.001);

  return (
    sign *
    (abs /
      (1 + abs * Math.max(0, curvature) * resistanceStrength))
  );
};

export const calculateEMA = (
  prevV: number,
  instantV: number,
  alpha: number,
): number => {
  return prevV * (1 - alpha) + instantV * alpha;
};

export const getSwipeDirection = (
  rawOffset: number,
  rawVelocity: number,
  width: number,
  config: Required<DragConfig>,
): SwipeDirection => {
  const distanceThreshold = Math.max(
    config.MIN_SWIPE_DISTANCE,
    Math.max(0, width) * config.SWIPE_THRESHOLD_RATIO,
  );
  const adaptedThreshold = Math.abs(
    applyResistance(
      distanceThreshold,
      config.RESISTANCE,
      config.RESISTANCE_CURVATURE,
    ),
  );

  const isQuickFlick =
    Math.abs(rawVelocity) >= config.SWIPE_VELOCITY_LIMIT &&
    Math.abs(rawOffset) >= config.QUICK_SWIPE_MIN_OFFSET;

  if (Math.abs(rawOffset) >= distanceThreshold || isQuickFlick) {
    return rawOffset < 0 ? "LEFT" : "RIGHT";
  }

  const resistedOffset = applyResistance(
    rawOffset,
    config.RESISTANCE,
    config.RESISTANCE_CURVATURE,
  );

  if (Math.abs(resistedOffset) >= adaptedThreshold) {
    return rawOffset < 0 ? "LEFT" : "RIGHT";
  }

  return "NONE";
};

export const clampVelocityMagnitude = clampMagnitude;
