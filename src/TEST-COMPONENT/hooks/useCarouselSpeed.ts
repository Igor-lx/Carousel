import { useMemo, type RefObject } from "react";
import { useCarouselGestureSpeed } from ".";
import { SNAP_BACK_TIME } from "../model/constants";
import type { MoveReason, AnimationMode } from "../model/reducer";

interface SpeedProps {
  reason: MoveReason;
  animMode: AnimationMode;
  isInteractive: boolean;
  isInstant: boolean;
  velocity: number;
  trackRef: RefObject<HTMLElement | null>;
  speedAuto: number;
  speedStep: number;
  speedJump: number;
}

export function useCarouselSpeed({
  reason,
  animMode,
  isInteractive,
  isInstant,
  velocity,
  trackRef,
  speedAuto,
  speedStep,
  speedJump,
}: SpeedProps): number {
  const containerWidth = trackRef.current?.offsetWidth;

  const baseSpeed = useMemo(() => {
    if (animMode === "snap") return SNAP_BACK_TIME;

    if (isInstant) return speedJump;

    switch (reason) {
      case "click":
        return speedStep;
      case "autoplay":
        return speedAuto;
      case "gesture":
        return speedStep;
      default:
        return speedAuto;
    }
  }, [reason, animMode, isInstant, speedStep, speedAuto, speedJump]);

  const dynamicSpeed = useCarouselGestureSpeed({
    velocity,
    baseSpeed,
    containerWidth,
  });

  return useMemo(() => {
    if (isInteractive) return 0;

    if (animMode === "snap") return baseSpeed;

    if (isInstant) return speedJump;
    if (reason === "gesture") return dynamicSpeed;

    return baseSpeed;
  }, [
    isInteractive,
    isInstant,
    reason,
    animMode,
    dynamicSpeed,
    baseSpeed,
    speedJump,
  ]);
}
