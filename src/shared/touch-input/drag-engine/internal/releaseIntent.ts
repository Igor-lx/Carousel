import type {
  DragEngineConfig,
  DragEngineSwipeDirection,
} from "../model/types";
import type {
  DragEngineInternalSample,
  DragEngineReleaseResolution,
} from "./types";
import { getSafeResistance } from "./resistance";

const isQuickFlickGesture = (
  rawPointerOffset: number,
  rawPointerVelocity: number,
  config: Required<DragEngineConfig>,
) =>
  Math.abs(rawPointerVelocity) >= config.SWIPE_VELOCITY_LIMIT &&
  Math.abs(rawPointerOffset) >= config.QUICK_SWIPE_MIN_OFFSET;

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
  rawPointerOffset: number,
  hasQuickFlickIntent: boolean,
  adaptedRawThreshold: number,
): DragEngineSwipeDirection => {
  if (hasQuickFlickIntent) {
    return rawPointerOffset < 0 ? "LEFT" : "RIGHT";
  }

  if (Math.abs(rawPointerOffset) >= adaptedRawThreshold) {
    return rawPointerOffset < 0 ? "LEFT" : "RIGHT";
  }

  return "NONE";
};

export const resolveDragRelease = (
  sample: Pick<
    DragEngineInternalSample,
    "rawPointerOffset" | "rawPointerVelocity" | "width"
  >,
  config: Required<DragEngineConfig>,
  canCommit = true,
): DragEngineReleaseResolution => {
  const hasQuickFlickIntent =
    canCommit &&
    isQuickFlickGesture(
      sample.rawPointerOffset,
      sample.rawPointerVelocity,
      config,
    );
  const adaptedRawThreshold = getAdaptedRawSwipeThreshold(sample.width, config);
  const result = canCommit
    ? getSwipeDirection(
        sample.rawPointerOffset,
        hasQuickFlickIntent,
        adaptedRawThreshold,
      )
    : "NONE";

  return {
    result,
    pointerReleaseVelocity: sample.rawPointerVelocity,
  };
};
