import { resolveReleasePlan } from "./releaseMotionPlan";
import type { ReleaseMotionConfig } from "./releaseMotionTypes";

export const resolveReleaseDuration = ({
  distance,
  fallbackDuration,
  releaseVelocity,
  minimumSpeed = 0,
  releaseMotionConfig,
}: {
  distance: number;
  fallbackDuration: number;
  releaseVelocity: number;
  minimumSpeed?: number;
  releaseMotionConfig?: Partial<ReleaseMotionConfig>;
}) => {
  const safeDistance = Math.abs(distance);

  if (!(safeDistance > 0) || !(fallbackDuration > 0)) {
    return fallbackDuration;
  }

  const plan = resolveReleasePlan({
    releaseSpeed: releaseVelocity,
    minimumSpeed,
    releaseMotionConfig,
  });
  const targetSpeed = plan.effectiveReleaseSpeed;

  if (!(targetSpeed > 0)) {
    return fallbackDuration;
  }

  const velocityDuration =
    (safeDistance / targetSpeed) * (1 + plan.decelerationDistanceShare);

  return Math.max(0, velocityDuration);
};
