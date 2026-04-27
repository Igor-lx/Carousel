import {
  resolveReleaseMotionConfig,
} from "./releaseMotionConfig";
import {
  getBoostedReleaseSpeed,
  getReleaseDecelerationDistanceShare,
} from "./releaseMotionMath";
import type {
  ReleaseMotionConfig,
  ReleaseMotionPlan,
} from "./releaseMotionTypes";
import { getSafeSpeed } from "./speed";

export const resolveReleasePlan = ({
  releaseSpeed,
  minimumSpeed = 0,
  releaseMotionConfig,
}: {
  releaseSpeed: number;
  minimumSpeed?: number;
  releaseMotionConfig?: Partial<ReleaseMotionConfig>;
}): ReleaseMotionPlan => {
  const resolvedReleaseMotionConfig = resolveReleaseMotionConfig(
    releaseMotionConfig,
  );
  const safeReleaseSpeed = getSafeSpeed(releaseSpeed);
  const safeMinimumSpeed = getSafeSpeed(minimumSpeed);
  const isFasterThanMinimumSpeed = safeReleaseSpeed > safeMinimumSpeed;
  const boostedReleaseSpeed = getBoostedReleaseSpeed(
    safeReleaseSpeed,
    resolvedReleaseMotionConfig,
  );
  const effectiveReleaseSpeed =
    !isFasterThanMinimumSpeed
      ? safeMinimumSpeed
      : safeMinimumSpeed > 0
        ? Math.max(boostedReleaseSpeed, safeMinimumSpeed)
        : boostedReleaseSpeed;
  const decelerationDistanceShare =
    isFasterThanMinimumSpeed
      ? getReleaseDecelerationDistanceShare(resolvedReleaseMotionConfig)
      : 0;

  return {
    releaseSpeed: safeReleaseSpeed,
    minimumSpeed: safeMinimumSpeed,
    boostedReleaseSpeed,
    effectiveReleaseSpeed,
    isFasterThanMinimumSpeed,
    decelerationDistanceShare,
  };
};
