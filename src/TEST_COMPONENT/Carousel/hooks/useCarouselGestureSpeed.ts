import { useMemo } from "react";

const SPEED_CONFIG = {
  MIN_ALLOWED: 150,
  GESTURE_VELOCITY_THRESHOLD: 0.1,
  PHYSICAL_INERTIA_FACTOR: 1.2,
  SENSITIVITY_RAMP_START: 0.5,
  SENSITIVITY_RAMP_END: 2.0,
} as const;

interface GestureSpeedProps {
  readonly velocity: number;
  readonly baseSpeed: number;
  readonly containerWidth: number | undefined;
}

export function useCarouselGestureSpeed({
  velocity,
  baseSpeed,
  containerWidth,
}: GestureSpeedProps): number {
  return useMemo(() => {
    if (
      !containerWidth ||
      velocity <= SPEED_CONFIG.GESTURE_VELOCITY_THRESHOLD
    ) {
      return baseSpeed;
    }

    const rawPhysicalDuration =
      (containerWidth / velocity) * SPEED_CONFIG.PHYSICAL_INERTIA_FACTOR;

    const weight = Math.min(
      Math.max(
        (velocity - SPEED_CONFIG.SENSITIVITY_RAMP_START) /
          (SPEED_CONFIG.SENSITIVITY_RAMP_END -
            SPEED_CONFIG.SENSITIVITY_RAMP_START),
        0,
      ),
      1,
    );

    const mixedSpeed = baseSpeed * (1 - weight) + rawPhysicalDuration * weight;

    return Math.max(SPEED_CONFIG.MIN_ALLOWED, Math.min(mixedSpeed, baseSpeed));
  }, [velocity, baseSpeed, containerWidth]);
}
