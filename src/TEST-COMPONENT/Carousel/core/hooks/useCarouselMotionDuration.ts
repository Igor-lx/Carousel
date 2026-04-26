import { useMemo } from "react";
import type { MoveReason, AnimationMode } from "../model/reducer";
import type {
  CarouselMotionSettings,
  CarouselRepeatedClickSettings,
} from "../model/diagnostic";
import type { DragReleaseSpeedConfig } from "../../../../shared";
import { mapDragReleaseVelocityToDuration } from "../../../../shared/velocity";
import {
  getDurationByVirtualSpan,
} from "../utilities";

interface MotionDurationProps {
  reason: MoveReason;
  animMode: AnimationMode;
  isDragging: boolean;
  isInstant: boolean;
  velocity: number;
  isRepeatedClickAdvance: boolean;
  segmentStartVirtualIndex: number;
  targetVirtualIndex: number;
  stepSize: number;
  dragReleaseSpeedConfig: DragReleaseSpeedConfig;
  motionSettings: CarouselMotionSettings;
  repeatedClickSettings: CarouselRepeatedClickSettings;
  autoplayDuration: number;
  stepDuration: number;
  jumpDuration: number;
}

export function useCarouselMotionDuration({
  reason,
  animMode,
  isDragging,
  isInstant,
  velocity,
  isRepeatedClickAdvance,
  segmentStartVirtualIndex,
  targetVirtualIndex,
  stepSize,
  dragReleaseSpeedConfig,
  motionSettings,
  repeatedClickSettings,
  autoplayDuration,
  stepDuration,
  jumpDuration,
}: MotionDurationProps): number {
  const clickSegmentDuration = useMemo(
    () =>
      getDurationByVirtualSpan({
        from: segmentStartVirtualIndex,
        to: targetVirtualIndex,
        stepSize,
        baseDuration: stepDuration,
      }),
    [
      segmentStartVirtualIndex,
      stepSize,
      stepDuration,
      targetVirtualIndex,
    ],
  );

  const repeatedClickAdvanceDuration = useMemo(
    () =>
      clickSegmentDuration /
      Math.max(1, repeatedClickSettings.speedMultiplier),
    [clickSegmentDuration, repeatedClickSettings.speedMultiplier],
  );

  const gestureSegmentDuration = useMemo(
    () =>
      getDurationByVirtualSpan({
        from: segmentStartVirtualIndex,
        to: targetVirtualIndex,
        stepSize,
        baseDuration: stepDuration,
      }),
    [
      segmentStartVirtualIndex,
      stepSize,
      stepDuration,
      targetVirtualIndex,
    ],
  );

  const snapSegmentDuration = motionSettings.snapBackDuration;

  const gestureReleaseDuration = useMemo(
    () =>
      mapDragReleaseVelocityToDuration({
        distance: targetVirtualIndex - segmentStartVirtualIndex,
        normalDuration: gestureSegmentDuration,
        releaseVelocity: velocity,
        dragReleaseSpeedConfig,
      }),
    [
      dragReleaseSpeedConfig,
      gestureSegmentDuration,
      segmentStartVirtualIndex,
      targetVirtualIndex,
      velocity,
    ],
  );

  const baseDuration = useMemo(() => {
    if (animMode === "snap") return snapSegmentDuration;

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
        return gestureReleaseDuration;
      default:
        return autoplayDuration;
    }
  }, [
    animMode,
    autoplayDuration,
    clickSegmentDuration,
    gestureReleaseDuration,
    gestureSegmentDuration,
    isRepeatedClickAdvance,
    isInstant,
    jumpDuration,
    repeatedClickAdvanceDuration,
    reason,
    snapSegmentDuration,
  ]);

  return useMemo(() => {
    if (isDragging) return 0;

    if (animMode === "snap") return baseDuration;

    if (isInstant || animMode === "jump") return jumpDuration;

    return baseDuration;
  }, [
    animMode,
    baseDuration,
    isDragging,
    isInstant,
    jumpDuration,
    reason,
  ]);
}
