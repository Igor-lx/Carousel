export interface DragSpeedConfig {
  velocityThreshold: number;
  rampEnd: number;
  minDurationRatio: number;
  minDuration: number;
}

export const DEFAULT_DRAG_SPEED_CONFIG: DragSpeedConfig = {
  velocityThreshold: 0.65,
  rampEnd: 2.1,
  minDurationRatio: 0.3,
  minDuration: 240,
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

  if (!Number.isFinite(baseDuration) || baseDuration <= 0) {
    return baseDuration;
  }

  if (velocity <= resolvedDragSpeedConfig.velocityThreshold) {
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
    velocity,
    resolvedDragSpeedConfig,
  );
  const scaledDuration =
    baseDuration - (baseDuration - minGestureDuration) * weight;

  return Math.max(minGestureDuration, Math.min(scaledDuration, baseDuration));
};
