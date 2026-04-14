import { useMemo, type RefObject } from "react";
import { SNAP_BACK_TIME } from "../model/constants";
import type { MoveReason, AnimationMode } from "../model/reducer";

const GESTURE_SPEED_CONFIG = {
  minDuration: 150,
  velocityThreshold: 0.1,
  inertiaFactor: 1.2,
  rampStart: 0.5,
  rampEnd: 2.0,
} as const;

const getVelocityBlendWeight = (velocity: number) =>
  Math.min(
    Math.max(
      (velocity - GESTURE_SPEED_CONFIG.rampStart) /
        (GESTURE_SPEED_CONFIG.rampEnd - GESTURE_SPEED_CONFIG.rampStart),
      0,
    ),
    1,
  );

const getGestureDuration = ({
  velocity,
  baseDuration,
  containerWidth,
}: {
  velocity: number;
  baseDuration: number;
  containerWidth: number | undefined;
}) => {
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
};

interface SpeedProps {
  reason: MoveReason;
  animMode: AnimationMode;
  isInteractive: boolean;
  isInstant: boolean;
  velocity: number;
  viewportRef: RefObject<HTMLElement | null>;
  autoplayDuration: number;
  stepDuration: number;
  jumpDuration: number;
}

export function useCarouselSpeed({
  reason,
  animMode,
  isInteractive,
  isInstant,
  velocity,
  viewportRef,
  autoplayDuration,
  stepDuration,
  jumpDuration,
}: SpeedProps): number {
  const viewportWidth = viewportRef.current?.offsetWidth;

  const baseDuration = useMemo(() => {
    if (animMode === "snap") return SNAP_BACK_TIME;

    if (isInstant || animMode === "jump") return jumpDuration;

    switch (reason) {
      case "click":
        return stepDuration;
      case "autoplay":
        return autoplayDuration;
      case "gesture":
        return stepDuration;
      default:
        return autoplayDuration;
    }
  }, [
    animMode,
    autoplayDuration,
    isInstant,
    jumpDuration,
    reason,
    stepDuration,
  ]);

  const dynamicDuration = useMemo(
    () =>
      getGestureDuration({
        velocity,
        baseDuration,
        containerWidth: viewportWidth,
      }),
    [baseDuration, velocity, viewportWidth],
  );

  return useMemo(() => {
    if (isInteractive) return 0;

    if (animMode === "snap") return baseDuration;

    if (isInstant || animMode === "jump") return jumpDuration;
    if (reason === "gesture") return dynamicDuration;

    return baseDuration;
  }, [
    animMode,
    baseDuration,
    dynamicDuration,
    isInteractive,
    isInstant,
    jumpDuration,
    reason,
  ]);
}
