import { useMemo } from "react";
import type { MoveReason, AnimationMode } from "../model/reducer";
import type {
  CarouselMotionSettings,
  CarouselRepeatedClickSettings,
} from "../model/diagnostic";
import {
  type ReleaseMotionConfig,
  velocityEngine,
} from "../../../../shared";
import {
  getDurationByVirtualSpan,
} from "../utilities";

interface MotionDurationProps {
  reason: MoveReason;
  animMode: AnimationMode;
  isDragging: boolean;
  isInstant: boolean;
  pointerReleaseVelocity: number;
  isRepeatedClickAdvance: boolean;
  segmentStartVirtualIndex: number;
  targetVirtualIndex: number;
  stepSize: number;
  releaseMotionConfig: ReleaseMotionConfig;
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
  pointerReleaseVelocity,
  isRepeatedClickAdvance,
  segmentStartVirtualIndex,
  targetVirtualIndex,
  stepSize,
  releaseMotionConfig,
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
    () => {
      const gestureDistance = targetVirtualIndex - segmentStartVirtualIndex;
      const minimumSpeed = velocityEngine.speed.getAverageSpeedForDistance(
        gestureDistance,
        gestureSegmentDuration,
      );

      return velocityEngine.release.resolveDuration({
        distance: gestureDistance,
        fallbackDuration: gestureSegmentDuration,
        releaseVelocity: pointerReleaseVelocity,
        minimumSpeed,
        releaseMotionConfig,
      });
    },
    [
      releaseMotionConfig,
      gestureSegmentDuration,
      segmentStartVirtualIndex,
      targetVirtualIndex,
      pointerReleaseVelocity,
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
