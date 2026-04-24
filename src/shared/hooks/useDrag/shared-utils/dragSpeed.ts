export interface DragSpeedConfig {
  inertiaBoostRampEndRatio: number;
  minDuration: number;
  inertiaBoost: number;
  releaseAccelerationDistanceShare: number;
  releaseDecelerationDistanceShare: number;
}

export const DEFAULT_DRAG_SPEED_CONFIG: DragSpeedConfig = {
  inertiaBoostRampEndRatio: 1.35,
  minDuration: 240,
  inertiaBoost: 1,
  releaseAccelerationDistanceShare: 0.35,
  releaseDecelerationDistanceShare: 0.65,
};

const smoothstep = (progress: number) =>
  progress * progress * (3 - 2 * progress);

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const getInertiaBoostWeight = (
  releaseSpeed: number,
  normalSpeed: number,
  dragSpeedConfig: DragSpeedConfig,
) => {
  if (!(normalSpeed > 0) || releaseSpeed <= normalSpeed) return 0;

  const rampEndRatio = Math.max(1, dragSpeedConfig.inertiaBoostRampEndRatio);
  if (rampEndRatio <= 1) return 1;

  const releaseRatio = releaseSpeed / normalSpeed;
  if (releaseRatio >= rampEndRatio) return 1;

  const progress = (releaseRatio - 1) / (rampEndRatio - 1);

  return smoothstep(progress);
};

export const resolveGestureReleaseSpeed = ({
  releaseSpeed,
  normalSpeed,
  dragSpeedConfig,
}: {
  releaseSpeed: number;
  normalSpeed: number;
  dragSpeedConfig?: Partial<DragSpeedConfig>;
}) => {
  const resolvedDragSpeedConfig: DragSpeedConfig = {
    ...DEFAULT_DRAG_SPEED_CONFIG,
    ...dragSpeedConfig,
  };
  const safeReleaseSpeed =
    Number.isFinite(releaseSpeed) ? Math.max(0, Math.abs(releaseSpeed)) : 0;
  const safeNormalSpeed =
    Number.isFinite(normalSpeed) ? Math.max(0, Math.abs(normalSpeed)) : 0;

  if (!(safeReleaseSpeed > 0)) {
    return safeNormalSpeed;
  }

  if (!(safeNormalSpeed > 0)) {
    return safeReleaseSpeed * Math.max(1, resolvedDragSpeedConfig.inertiaBoost);
  }

  if (safeReleaseSpeed <= safeNormalSpeed) {
    return safeNormalSpeed;
  }

  const weight = getInertiaBoostWeight(
    safeReleaseSpeed,
    safeNormalSpeed,
    resolvedDragSpeedConfig,
  );
  const safeBoost = Math.max(1, resolvedDragSpeedConfig.inertiaBoost);
  const boostedExcessSpeed =
    (safeReleaseSpeed - safeNormalSpeed) *
    (1 + (safeBoost - 1) * weight);

  return safeNormalSpeed + boostedExcessSpeed;
};

export const mapReleaseVelocityToDuration = ({
  distance,
  normalDuration,
  releaseVelocity,
  dragSpeedConfig,
}: {
  distance: number;
  normalDuration: number;
  releaseVelocity: number;
  dragSpeedConfig?: Partial<DragSpeedConfig>;
}) => {
  const resolvedDragSpeedConfig: DragSpeedConfig = {
    ...DEFAULT_DRAG_SPEED_CONFIG,
    ...dragSpeedConfig,
  };
  const safeDistance = Math.abs(distance);

  if (!(safeDistance > 0) || !(normalDuration > 0)) {
    return normalDuration;
  }

  const normalSpeed = safeDistance / normalDuration;
  const targetSpeed = resolveGestureReleaseSpeed({
    releaseSpeed: releaseVelocity,
    normalSpeed,
    dragSpeedConfig: resolvedDragSpeedConfig,
  });

  if (!(targetSpeed > 0)) {
    return normalDuration;
  }

  const minGestureDuration = Math.min(
    normalDuration,
    Math.max(0, resolvedDragSpeedConfig.minDuration),
  );
  const velocityDuration = safeDistance / targetSpeed;

  return clamp(velocityDuration, minGestureDuration, normalDuration);
};
