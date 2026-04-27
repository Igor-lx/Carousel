import { resolveDragReleaseVelocityPlan } from "./dragReleasePlan";
import type { DragReleaseSpeedConfig } from "./dragReleaseTypes";

export const mapDragReleaseVelocityToDuration = ({
  distance,
  fallbackDuration,
  releaseVelocity,
  minimumSpeed = 0,
  dragReleaseSpeedConfig,
}: {
  distance: number;
  fallbackDuration: number;
  releaseVelocity: number;
  minimumSpeed?: number;
  dragReleaseSpeedConfig?: Partial<DragReleaseSpeedConfig>;
}) => {
  const safeDistance = Math.abs(distance);

  if (!(safeDistance > 0) || !(fallbackDuration > 0)) {
    return fallbackDuration;
  }

  const plan = resolveDragReleaseVelocityPlan({
    releaseSpeed: releaseVelocity,
    minimumSpeed,
    dragReleaseSpeedConfig,
  });
  const targetSpeed = plan.effectiveReleaseSpeed;

  if (!(targetSpeed > 0)) {
    return fallbackDuration;
  }

  const velocityDuration =
    (safeDistance / targetSpeed) * (1 + plan.decelerationDistanceShare);

  return Math.max(0, velocityDuration);
};
