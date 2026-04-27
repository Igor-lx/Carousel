import { resolveReleasePlan } from "./releaseMotionPlan";
import type { ReleaseMotionConfig } from "./releaseMotionTypes";

export const resolveReleaseDuration = ({
  distance,
  baseDuration,
  releaseVelocity,
  minimumSpeed = 0,
  releaseMotionConfig,
}: {
  distance: number;
  baseDuration: number;
  releaseVelocity: number;
  minimumSpeed?: number;
  releaseMotionConfig?: Partial<ReleaseMotionConfig>;
}) => {
  const safeDistance = Math.abs(distance);

  if (!(safeDistance > 0) || !(baseDuration > 0)) {
    return baseDuration;
  }

  const plan = resolveReleasePlan({
    releaseSpeed: releaseVelocity,
    minimumSpeed,
    releaseMotionConfig,
  });
  const targetSpeed = plan.effectiveReleaseSpeed;

  if (!(targetSpeed > 0)) {
    return baseDuration;
  }

  const velocityDuration =
    (safeDistance / targetSpeed) * (1 + plan.decelerationDistanceShare);

  return Math.max(0, velocityDuration);
};
