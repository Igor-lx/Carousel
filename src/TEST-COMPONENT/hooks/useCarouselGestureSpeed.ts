import { useMemo } from "react";

const GESTURE_SPEED_CONFIG = {
  minDuration: 150,
  velocityThreshold: 0.1,
  inertiaFactor: 1.2,
  rampStart: 0.5,
  rampEnd: 2.0,
} as const;

interface GestureSpeedProps {
  velocity: number;
  baseDuration: number;
  containerWidth: number | undefined;
}

const getVelocityBlendWeight = (velocity: number) =>
  Math.min(
    Math.max(
      (velocity - GESTURE_SPEED_CONFIG.rampStart) /
        (GESTURE_SPEED_CONFIG.rampEnd - GESTURE_SPEED_CONFIG.rampStart),
      0,
    ),
    1,
  );

export function useCarouselGestureSpeed({
  velocity,
  baseDuration,
  containerWidth,
}: GestureSpeedProps): number {
  return useMemo(() => {
    if (!containerWidth || velocity <= GESTURE_SPEED_CONFIG.velocityThreshold) {
      return baseDuration;
    }

    const rawPhysicalDuration =
      (containerWidth / velocity) * GESTURE_SPEED_CONFIG.inertiaFactor;
    const weight = getVelocityBlendWeight(velocity);

    const mixedDuration =
      baseDuration * (1 - weight) + rawPhysicalDuration * weight;

    return Math.max(
      GESTURE_SPEED_CONFIG.minDuration,
      Math.min(mixedDuration, baseDuration),
    );
  }, [velocity, baseDuration, containerWidth]);
}
