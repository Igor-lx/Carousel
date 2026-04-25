export interface DragSpeedConfig {
  inertiaBoost: number;
  releaseDecelerationDistanceShare: number;
}

export const DEFAULT_DRAG_SPEED_CONFIG: DragSpeedConfig = {
  inertiaBoost: 1,
  releaseDecelerationDistanceShare: 0.65,
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const resolveDragSpeedConfig = (
  dragSpeedConfig?: Partial<DragSpeedConfig>,
): DragSpeedConfig => ({
  ...DEFAULT_DRAG_SPEED_CONFIG,
  ...dragSpeedConfig,
});

const getSafeSpeed = (speed: number) =>
  Number.isFinite(speed) ? Math.max(0, Math.abs(speed)) : 0;

const getBoostedReleaseSpeed = (
  releaseSpeed: number,
  dragSpeedConfig: DragSpeedConfig,
) => getSafeSpeed(releaseSpeed) * Math.max(0, dragSpeedConfig.inertiaBoost);

const getDecelerationDistanceShare = (dragSpeedConfig: DragSpeedConfig) =>
  clamp(
    Number.isFinite(dragSpeedConfig.releaseDecelerationDistanceShare)
      ? dragSpeedConfig.releaseDecelerationDistanceShare
      : DEFAULT_DRAG_SPEED_CONFIG.releaseDecelerationDistanceShare,
    0,
    1,
  );

export const resolveGestureReleaseSpeed = ({
  releaseSpeed,
  normalSpeed,
  dragSpeedConfig,
}: {
  releaseSpeed: number;
  normalSpeed: number;
  dragSpeedConfig?: Partial<DragSpeedConfig>;
}) => {
  const resolvedDragSpeedConfig = resolveDragSpeedConfig(dragSpeedConfig);
  const safeReleaseSpeed = getSafeSpeed(releaseSpeed);
  const safeNormalSpeed = getSafeSpeed(normalSpeed);

  if (!(safeReleaseSpeed > 0)) {
    return safeNormalSpeed;
  }

  if (safeReleaseSpeed <= safeNormalSpeed) {
    return safeNormalSpeed;
  }

  const boostedReleaseSpeed = getBoostedReleaseSpeed(
    safeReleaseSpeed,
    resolvedDragSpeedConfig,
  );

  if (!(safeNormalSpeed > 0)) {
    return boostedReleaseSpeed;
  }

  return Math.max(boostedReleaseSpeed, safeNormalSpeed);
};

export const resolveGestureReleaseDecelerationShare = ({
  releaseSpeed,
  normalSpeed,
  dragSpeedConfig,
}: {
  releaseSpeed: number;
  normalSpeed: number;
  dragSpeedConfig?: Partial<DragSpeedConfig>;
}) => {
  const resolvedDragSpeedConfig = resolveDragSpeedConfig(dragSpeedConfig);
  const safeReleaseSpeed = getSafeSpeed(releaseSpeed);
  const safeNormalSpeed = getSafeSpeed(normalSpeed);

  if (!(safeReleaseSpeed > safeNormalSpeed)) {
    return 0;
  }

  return getDecelerationDistanceShare(resolvedDragSpeedConfig);
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
  const resolvedDragSpeedConfig = resolveDragSpeedConfig(dragSpeedConfig);
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

  const decelerationShare = resolveGestureReleaseDecelerationShare({
    releaseSpeed: releaseVelocity,
    normalSpeed,
    dragSpeedConfig: resolvedDragSpeedConfig,
  });
  const velocityDuration =
    (safeDistance / targetSpeed) * (1 + decelerationShare);

  return Math.max(0, velocityDuration);
};
