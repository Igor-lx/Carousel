import { useMemo, type RefObject } from "react";
import { GESTURE_SPEED_CONFIG, SNAP_BACK_TIME } from "../model/constants";
import type { MoveReason, AnimationMode } from "../model/reducer";

const smoothstep = (progress: number) =>
  progress * progress * (3 - 2 * progress);

const getVelocityModifierWeight = (velocity: number) => {
  if (velocity <= GESTURE_SPEED_CONFIG.velocityThreshold) return 0;
  if (velocity >= GESTURE_SPEED_CONFIG.rampEnd) return 1;

  const progress =
    (velocity - GESTURE_SPEED_CONFIG.velocityThreshold) /
    (GESTURE_SPEED_CONFIG.rampEnd - GESTURE_SPEED_CONFIG.velocityThreshold);

  return smoothstep(progress);
};

const getGestureDuration = ({
  velocity,
  baseDuration,
}: {
  velocity: number;
  baseDuration: number;
}) => {
  if (!Number.isFinite(baseDuration) || baseDuration <= 0) {
    return baseDuration;
  }

  if (velocity <= GESTURE_SPEED_CONFIG.velocityThreshold) {
    return baseDuration;
  }

  const minGestureDuration = Math.min(
    baseDuration,
    Math.max(
      GESTURE_SPEED_CONFIG.minDuration,
      baseDuration * GESTURE_SPEED_CONFIG.minDurationRatio,
    ),
  );

  if (minGestureDuration >= baseDuration) {
    return baseDuration;
  }

  const weight = getVelocityModifierWeight(velocity);
  const scaledDuration =
    baseDuration - (baseDuration - minGestureDuration) * weight;

  return Math.max(minGestureDuration, Math.min(scaledDuration, baseDuration));
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
  viewportRef: _viewportRef,
  autoplayDuration,
  stepDuration,
  jumpDuration,
}: SpeedProps): number {
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
      }),
    [baseDuration, velocity],
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
