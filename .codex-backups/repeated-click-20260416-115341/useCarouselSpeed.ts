import { useMemo } from "react";
import {
  DRAG_SPEED_CONFIG,
  SNAP_BACK_TIME,
} from "../model/constants";
import type { MoveReason, AnimationMode } from "../model/reducer";
import { mapVelocityToDuration } from "../../shared";
import { SAFE_REPEATED_CLICK_SETTINGS } from "../utilities";

interface SpeedProps {
  reason: MoveReason;
  animMode: AnimationMode;
  isDragging: boolean;
  isInstant: boolean;
  velocity: number;
  isRepeatedClickAdvance: boolean;
  segmentStartVirtualIndex: number;
  targetVirtualIndex: number;
  stepSize: number;
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
  isRepeatedClickAdvance,
  segmentStartVirtualIndex,
  targetVirtualIndex,
  stepSize,
  autoplayDuration,
  stepDuration,
  jumpDuration,
}: SpeedProps): number {
  const getSegmentDurationBySpan = useMemo(
    () => (segmentStart: number, segmentEnd: number, baseDuration: number) => {
      if (stepSize <= 0) {
        return baseDuration;
      }

      const stepSpan = Math.abs(segmentEnd - segmentStart) / stepSize;

      return baseDuration * Math.max(0, stepSpan);
    },
    [stepSize],
  );

  const clickSegmentDuration = useMemo(
    () =>
      getSegmentDurationBySpan(
        segmentStartVirtualIndex,
        targetVirtualIndex,
        stepDuration,
      ),
    [
      getSegmentDurationBySpan,
      segmentStartVirtualIndex,
      stepDuration,
      targetVirtualIndex,
    ],
  );

  const repeatedClickAdvanceDuration = useMemo(
    () =>
      clickSegmentDuration / SAFE_REPEATED_CLICK_SETTINGS.speedMultiplier,
    [clickSegmentDuration],
  );

  const baseDuration = useMemo(() => {
    if (animMode === "snap") return SNAP_BACK_TIME;

    if (isInstant || animMode === "jump") return jumpDuration;

    switch (reason) {
      case "click":
        if (isRepeatedClickAdvance) {
          return repeatedClickAdvanceDuration;
        }
        return clickSegmentDuration;
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
    clickSegmentDuration,
    isRepeatedClickAdvance,
    isInstant,
    jumpDuration,
    repeatedClickAdvanceDuration,
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
