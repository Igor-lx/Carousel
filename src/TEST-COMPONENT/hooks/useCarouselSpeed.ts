import { useMemo, type RefObject } from "react";
import { useCarouselGestureSpeed } from "./useCarouselGestureSpeed";
import { SNAP_BACK_TIME } from "../model/constants";
import type { MoveReason, AnimationMode } from "../model/reducer";

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

  const dynamicDuration = useCarouselGestureSpeed({
    velocity,
    baseDuration,
    containerWidth: viewportWidth,
  });

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
