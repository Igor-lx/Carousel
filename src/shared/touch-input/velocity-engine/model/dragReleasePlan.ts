import {
  resolveDragReleaseSpeedConfig,
} from "./dragReleaseConfig";
import {
  getBoostedReleaseSpeed,
  getReleaseDecelerationDistanceShare,
} from "./dragReleaseMath";
import type {
  DragReleaseSpeedConfig,
  DragReleaseVelocityPlan,
} from "./dragReleaseTypes";
import { getSafeSpeed } from "./speed";

export const resolveDragReleaseVelocityPlan = ({
  releaseSpeed,
  minimumSpeed = 0,
  dragReleaseSpeedConfig,
}: {
  releaseSpeed: number;
  minimumSpeed?: number;
  dragReleaseSpeedConfig?: Partial<DragReleaseSpeedConfig>;
}): DragReleaseVelocityPlan => {
  const resolvedDragReleaseSpeedConfig = resolveDragReleaseSpeedConfig(
    dragReleaseSpeedConfig,
  );
  const safeReleaseSpeed = getSafeSpeed(releaseSpeed);
  const safeMinimumSpeed = getSafeSpeed(minimumSpeed);
  const isFasterThanMinimumSpeed = safeReleaseSpeed > safeMinimumSpeed;
  const boostedReleaseSpeed = getBoostedReleaseSpeed(
    safeReleaseSpeed,
    resolvedDragReleaseSpeedConfig,
  );
  const effectiveReleaseSpeed =
    !isFasterThanMinimumSpeed
      ? safeMinimumSpeed
      : safeMinimumSpeed > 0
        ? Math.max(boostedReleaseSpeed, safeMinimumSpeed)
        : boostedReleaseSpeed;
  const decelerationDistanceShare =
    isFasterThanMinimumSpeed
      ? getReleaseDecelerationDistanceShare(resolvedDragReleaseSpeedConfig)
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
