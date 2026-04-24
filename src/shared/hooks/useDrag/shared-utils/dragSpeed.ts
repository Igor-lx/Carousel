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

export const mapVelocityToDuration = ({
  velocity,
  baseDuration,
  dragSpeedConfig,
}: {
  velocity: number;
  baseDuration: number;
  dragSpeedConfig?: Partial<DragSpeedConfig>;
}) => {
  const resolvedDragSpeedConfig: DragSpeedConfig = {
    ...DEFAULT_DRAG_SPEED_CONFIG,
    ...dragSpeedConfig,
  };
  const velocityMagnitude = Math.abs(velocity);

  if (!Number.isFinite(baseDuration) || baseDuration <= 0) {
    return baseDuration;
  }

  if (velocityMagnitude <= resolvedDragSpeedConfig.velocityThreshold) {
    return baseDuration;
  }

  const minGestureDuration = Math.min(
    baseDuration,
    Math.max(
      resolvedDragSpeedConfig.minDuration,
      baseDuration * resolvedDragSpeedConfig.minDurationRatio,
    ),
  );

  if (minGestureDuration >= baseDuration) {
    return baseDuration;
  }

  const weight = getVelocityModifierWeight(
    velocityMagnitude,
    resolvedDragSpeedConfig,
  );
  const scaledDuration =
    baseDuration - (baseDuration - minGestureDuration) * weight;

  return Math.max(minGestureDuration, Math.min(scaledDuration, baseDuration));
};
