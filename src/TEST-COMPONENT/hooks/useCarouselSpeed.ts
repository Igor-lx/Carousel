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
  durationAutoplay: number;
  durationStep: number;
  durationJump: number;
}

export function useCarouselSpeed({
  reason,
  animMode,
  isInteractive,
  isInstant,
  velocity,
  viewportRef,
  durationAutoplay,
  durationStep,
  durationJump,
}: SpeedProps): number {
  const containerWidth = viewportRef.current?.offsetWidth;

  const baseDuration = useMemo(() => {
    if (animMode === "snap") return SNAP_BACK_TIME;

    if (isInstant || animMode === "jump") return durationJump;

    switch (reason) {
      case "click":
        return durationStep;
      case "autoplay":
        return durationAutoplay;
      case "gesture":
        return durationStep;
      default:
        return durationAutoplay;
    }
  }, [
    reason,
    animMode,
    isInstant,
    durationStep,
    durationAutoplay,
    durationJump,
  ]);

  const dynamicDuration = useCarouselGestureSpeed({
    velocity,
    baseDuration,
    containerWidth,
  });

  return useMemo(() => {
    if (isInteractive) return 0;

    if (animMode === "snap") return baseDuration;

    if (isInstant || animMode === "jump") return durationJump;
    if (reason === "gesture") return dynamicDuration;

    return baseDuration;
  }, [
    isInteractive,
    isInstant,
    reason,
    animMode,
    dynamicDuration,
    baseDuration,
    durationJump,
  ]);
}
