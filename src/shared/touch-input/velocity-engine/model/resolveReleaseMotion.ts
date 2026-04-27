import { resolveReleaseDuration } from "./releaseMotionDuration";
import { resolveReleasePlan } from "./releaseMotionPlan";
import type {
  ReleaseMotionConfig,
  ReleaseMotionResult,
} from "./releaseMotionTypes";
import {
  getSameDirectionSpeed,
  getSafeSpeed,
} from "./speed";
import { toComponentUnitVelocity } from "./units";

const DEFAULT_RELEASE_DISTANCE = 1;

const getResolvedDistance = (
  distanceToTarget: number | undefined,
  gestureReleaseVelocity: number,
) => {
  if (
    typeof distanceToTarget === "number" &&
    Number.isFinite(distanceToTarget) &&
    distanceToTarget !== 0
  ) {
    return distanceToTarget;
  }

  const direction = Math.sign(gestureReleaseVelocity);

  return direction === 0
    ? DEFAULT_RELEASE_DISTANCE
    : DEFAULT_RELEASE_DISTANCE * direction;
};

export const resolveReleaseMotion = ({
  gestureReleaseVelocity,
  componentUnitSize,
  distanceToTarget,
  baseDuration,
  minimumSpeed,
  config,
}: {
  gestureReleaseVelocity: number;
  componentUnitSize?: number;
  distanceToTarget?: number;
  baseDuration: number;
  minimumSpeed?: number;
  config?: Partial<ReleaseMotionConfig>;
}): ReleaseMotionResult => {
  const resolvedGestureReleaseVelocity =
    typeof componentUnitSize === "number"
      ? toComponentUnitVelocity(gestureReleaseVelocity, componentUnitSize)
      : gestureReleaseVelocity;
  const resolvedDistance = getResolvedDistance(
    distanceToTarget,
    resolvedGestureReleaseVelocity,
  );
  const resolvedBaseDuration =
    Number.isFinite(baseDuration) && baseDuration > 0 ? baseDuration : 0;
  const resolvedMinimumSpeed =
    typeof minimumSpeed === "number"
      ? getSafeSpeed(minimumSpeed)
      : resolvedBaseDuration > 0
        ? Math.abs(resolvedDistance) / resolvedBaseDuration
        : 0;
  const releaseSpeed = getSameDirectionSpeed(
    resolvedGestureReleaseVelocity,
    resolvedDistance,
  );
  const plan = resolveReleasePlan({
    releaseSpeed,
    minimumSpeed: resolvedMinimumSpeed,
    releaseMotionConfig: config,
  });

  return {
    effectiveReleaseSpeed: plan.effectiveReleaseSpeed,
    duration: resolveReleaseDuration({
      distance: resolvedDistance,
      baseDuration: resolvedBaseDuration,
      releaseVelocity: releaseSpeed,
      minimumSpeed: resolvedMinimumSpeed,
      releaseMotionConfig: config,
    }),
    isInertialRelease: plan.isFasterThanMinimumSpeed,
  };
};
