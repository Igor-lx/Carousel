import type {
  DragConfig,
  DragReleaseResolution,
  DragSample,
  SwipeDirection,
} from "./types";

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

const isQuickFlickGesture = (
  rawOffset: number,
  rawVelocity: number,
  config: Required<DragConfig>,
) =>
  Math.abs(rawVelocity) >= config.SWIPE_VELOCITY_LIMIT &&
  Math.abs(rawOffset) >= config.QUICK_SWIPE_MIN_OFFSET;

const getAdaptedRawSwipeThreshold = (
  width: number,
  config: Required<DragConfig>,
) => {
  const distanceThreshold = Math.max(
    config.MIN_SWIPE_DISTANCE,
    Math.max(0, width) * config.SWIPE_THRESHOLD_RATIO,
  );
  const resistanceFactor = 1 - getSafeResistance(config.RESISTANCE);

  return Math.max(
    config.MIN_SWIPE_DISTANCE,
    distanceThreshold * resistanceFactor,
  );
};

const getSwipeDirection = (
  rawOffset: number,
  isQuickFlick: boolean,
  adaptedRawThreshold: number,
): SwipeDirection => {
  if (isQuickFlick) {
    return rawOffset < 0 ? "LEFT" : "RIGHT";
  }

  if (Math.abs(rawOffset) >= adaptedRawThreshold) {
    return rawOffset < 0 ? "LEFT" : "RIGHT";
  }

  return "NONE";
};

export const resolveDragRelease = (
  sample: Pick<DragSample, "rawOffset" | "rawVelocity" | "velocity" | "width">,
  config: Required<DragConfig>,
  canCommit = true,
): DragReleaseResolution => {
  const isQuickFlick =
    canCommit &&
    isQuickFlickGesture(sample.rawOffset, sample.rawVelocity, config);
  const adaptedRawThreshold = getAdaptedRawSwipeThreshold(sample.width, config);
  const result = canCommit
    ? getSwipeDirection(sample.rawOffset, isQuickFlick, adaptedRawThreshold)
    : "NONE";

  return {
    result,
    isQuickFlick,
    releaseVelocity: sample.rawVelocity,
  };
};

export const clampVelocityMagnitude = clampMagnitude;
