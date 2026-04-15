import { useMemo } from "react";
import { DRAG_SPEED_CONFIG, SNAP_BACK_TIME } from "../model/constants";
import type { MoveReason, AnimationMode } from "../model/reducer";
import { mapVelocityToDuration } from "../../shared";

interface SpeedProps {
  reason: MoveReason;
  animMode: AnimationMode;
  isDragging: boolean;
  isInstant: boolean;
  velocity: number;
  autoplayDuration: number;
  stepDuration: number;
  jumpDuration: number;
}

export function useCarouselSpeed({
  reason,
  animMode,
  isDragging,
  isInstant,
  velocity,
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
      mapVelocityToDuration({
        velocity,
        baseDuration,
        dragSpeedConfig: DRAG_SPEED_CONFIG,
      }),
    [baseDuration, velocity],
  );

  return useMemo(() => {
    if (isDragging) return 0;

    if (animMode === "snap") return baseDuration;

    if (isInstant || animMode === "jump") return jumpDuration;
    if (reason === "gesture") return dynamicDuration;

    return baseDuration;
  }, [
    animMode,
    baseDuration,
    dynamicDuration,
    isDragging,
    isInstant,
    jumpDuration,
    reason,
  ]);
}
