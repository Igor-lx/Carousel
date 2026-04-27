import type {
  DragEngineConfig,
  DragEngineReleaseResolution,
  DragEngineSample,
  DragEngineSwipeDirection,
} from "../model/types";
import { getSafeResistance } from "./resistance";

const isQuickFlickGesture = (
  rawOffset: number,
  rawVelocity: number,
  config: Required<DragEngineConfig>,
) =>
  Math.abs(rawVelocity) >= config.SWIPE_VELOCITY_LIMIT &&
  Math.abs(rawOffset) >= config.QUICK_SWIPE_MIN_OFFSET;

const getAdaptedRawSwipeThreshold = (
  width: number,
  config: Required<DragEngineConfig>,
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
): DragEngineSwipeDirection => {
  if (isQuickFlick) {
    return rawOffset < 0 ? "LEFT" : "RIGHT";
  }

  if (Math.abs(rawOffset) >= adaptedRawThreshold) {
    return rawOffset < 0 ? "LEFT" : "RIGHT";
  }

  return "NONE";
};

export const resolveDragRelease = (
  sample: Pick<
    DragEngineSample,
    "rawOffset" | "rawVelocity" | "velocity" | "width"
  >,
  config: Required<DragEngineConfig>,
  canCommit = true,
): DragEngineReleaseResolution => {
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
