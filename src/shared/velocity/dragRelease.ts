import { getAverageSpeedForDistance, getSafeSpeed } from "./speed";

export interface DragReleaseSpeedConfig {
  inertiaBoost: number;
  releaseDecelerationDistanceShare: number;
}

export const DEFAULT_DRAG_RELEASE_SPEED_CONFIG: DragReleaseSpeedConfig = {
  inertiaBoost: 1,
  releaseDecelerationDistanceShare: 0.65,
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const resolveDragReleaseSpeedConfig = (
  dragReleaseSpeedConfig?: Partial<DragReleaseSpeedConfig>,
): DragReleaseSpeedConfig => ({
  ...DEFAULT_DRAG_RELEASE_SPEED_CONFIG,
  ...dragReleaseSpeedConfig,
});

const getBoostedReleaseSpeed = (
  releaseSpeed: number,
  dragReleaseSpeedConfig: DragReleaseSpeedConfig,
) =>
  getSafeSpeed(releaseSpeed) *
  Math.max(0, dragReleaseSpeedConfig.inertiaBoost);

const getDecelerationDistanceShare = (
  dragReleaseSpeedConfig: DragReleaseSpeedConfig,
) =>
  clamp(
    Number.isFinite(dragReleaseSpeedConfig.releaseDecelerationDistanceShare)
      ? dragReleaseSpeedConfig.releaseDecelerationDistanceShare
      : DEFAULT_DRAG_RELEASE_SPEED_CONFIG.releaseDecelerationDistanceShare,
    0,
    1,
  );

export const resolveDragReleaseSpeed = ({
  releaseSpeed,
  normalSpeed,
  dragReleaseSpeedConfig,
}: {
  releaseSpeed: number;
  normalSpeed: number;
  dragReleaseSpeedConfig?: Partial<DragReleaseSpeedConfig>;
}) => {
  const resolvedDragReleaseSpeedConfig = resolveDragReleaseSpeedConfig(
    dragReleaseSpeedConfig,
  );
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
    resolvedDragReleaseSpeedConfig,
  );

  if (!(safeNormalSpeed > 0)) {
    return boostedReleaseSpeed;
  }

  return Math.max(boostedReleaseSpeed, safeNormalSpeed);
};

export const resolveDragReleaseDecelerationShare = ({
  releaseSpeed,
  normalSpeed,
  dragReleaseSpeedConfig,
}: {
  releaseSpeed: number;
  normalSpeed: number;
  dragReleaseSpeedConfig?: Partial<DragReleaseSpeedConfig>;
}) => {
  const resolvedDragReleaseSpeedConfig = resolveDragReleaseSpeedConfig(
    dragReleaseSpeedConfig,
  );
  const safeReleaseSpeed = getSafeSpeed(releaseSpeed);
  const safeNormalSpeed = getSafeSpeed(normalSpeed);

  if (!(safeReleaseSpeed > safeNormalSpeed)) {
    return 0;
  }

  return getDecelerationDistanceShare(resolvedDragReleaseSpeedConfig);
};

export const mapDragReleaseVelocityToDuration = ({
  distance,
  normalDuration,
  releaseVelocity,
  dragReleaseSpeedConfig,
}: {
  distance: number;
  normalDuration: number;
  releaseVelocity: number;
  dragReleaseSpeedConfig?: Partial<DragReleaseSpeedConfig>;
}) => {
  const resolvedDragReleaseSpeedConfig = resolveDragReleaseSpeedConfig(
    dragReleaseSpeedConfig,
  );
  const safeDistance = Math.abs(distance);

  if (!(safeDistance > 0) || !(normalDuration > 0)) {
    return normalDuration;
  }

  const normalSpeed = getAverageSpeedForDistance(safeDistance, normalDuration);
  const targetSpeed = resolveDragReleaseSpeed({
    releaseSpeed: releaseVelocity,
    normalSpeed,
    dragReleaseSpeedConfig: resolvedDragReleaseSpeedConfig,
  });

  if (!(targetSpeed > 0)) {
    return normalDuration;
  }

  const decelerationShare = resolveDragReleaseDecelerationShare({
    releaseSpeed: releaseVelocity,
    normalSpeed,
    dragReleaseSpeedConfig: resolvedDragReleaseSpeedConfig,
  });
  const velocityDuration =
    (safeDistance / targetSpeed) * (1 + decelerationShare);

  return Math.max(0, velocityDuration);
};
