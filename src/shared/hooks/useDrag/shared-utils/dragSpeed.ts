export interface DragSpeedConfig {
  velocityThreshold: number;
  rampEnd: number;
  minDurationRatio: number;
  minDuration: number;
  inertiaBoost: number;
  releaseAccelerationDistanceShare: number;
  releaseDecelerationDistanceShare: number;
}

export const DEFAULT_DRAG_SPEED_CONFIG: DragSpeedConfig = {
  velocityThreshold: 0.65,
  rampEnd: 2.1,
  minDurationRatio: 0.3,
  minDuration: 240,
  inertiaBoost: 1,
  releaseAccelerationDistanceShare: 0.35,
  releaseDecelerationDistanceShare: 0.65,
};

const smoothstep = (progress: number) =>
  progress * progress * (3 - 2 * progress);

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const getVelocityModifierWeight = (
  velocity: number,
  dragSpeedConfig: DragSpeedConfig,
) => {
  if (velocity <= dragSpeedConfig.velocityThreshold) return 0;
  if (velocity >= dragSpeedConfig.rampEnd) return 1;

  const range =
    dragSpeedConfig.rampEnd - dragSpeedConfig.velocityThreshold;
  if (range <= 0) return 1;

  const progress =
    (velocity - dragSpeedConfig.velocityThreshold) / range;

  return smoothstep(progress);
};

export const scaleVelocityToInertia = ({
  velocity,
  responseVelocity,
  dragSpeedConfig,
}: {
  velocity: number;
  responseVelocity?: number;
  dragSpeedConfig?: Partial<DragSpeedConfig>;
}) => {
  const resolvedDragSpeedConfig: DragSpeedConfig = {
    ...DEFAULT_DRAG_SPEED_CONFIG,
    ...dragSpeedConfig,
  };
  const safeVelocity = Math.abs(velocity);
  const safeResponseVelocity =
    typeof responseVelocity === "number" && Number.isFinite(responseVelocity)
      ? Math.abs(responseVelocity)
      : null;
  const rampVelocity = safeResponseVelocity !== null
    ? safeResponseVelocity
    : safeVelocity;

  if (!Number.isFinite(velocity) || safeVelocity <= 0) {
    return 0;
  }

  const weight = getVelocityModifierWeight(
    rampVelocity,
    resolvedDragSpeedConfig,
  );
  const safeBoost = Math.max(1, resolvedDragSpeedConfig.inertiaBoost);
  const amplifiedVelocity =
    safeVelocity * (1 + (safeBoost - 1) * weight);

  return Math.sign(velocity) * amplifiedVelocity;
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
  const releaseSpeed =
    Number.isFinite(releaseVelocity) ? Math.abs(releaseVelocity) : 0;
  const targetSpeed = Math.max(normalSpeed, releaseSpeed);

  if (!(targetSpeed > 0)) {
    return normalDuration;
  }

  const minGestureDuration = Math.min(
    normalDuration,
    Math.max(
      resolvedDragSpeedConfig.minDuration,
      normalDuration * resolvedDragSpeedConfig.minDurationRatio,
    ),
  );
  const velocityDuration = safeDistance / targetSpeed;

  return clamp(velocityDuration, minGestureDuration, normalDuration);
};
