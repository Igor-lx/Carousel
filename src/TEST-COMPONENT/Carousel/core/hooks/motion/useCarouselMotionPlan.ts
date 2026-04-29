import { useMemo } from "react";

import type {
  CarouselMotionSettings,
  CarouselRepeatedClickSettings,
  ReleaseMotionConfig,
} from "../../model/diagnostic";
import type { AnimationMode, MoveReason } from "../../model/reducer";
import {
  getDurationByVirtualSpan,
  resolveCarouselMotionDuration,
} from "../../model/motion-duration";
import {
  type ReleaseMotionResult,
  velocityEngine,
} from "../../../../../shared";

interface UseCarouselMotionPlanProps {
  gesturePointerReleaseVelocity: number;
  segmentStartVirtualIndex: number;
  targetVirtualIndex: number;
  stepSize: number;
  stepDuration: number;
  releaseMotionConfig: ReleaseMotionConfig;
  moveReason: MoveReason;
  animationMode: AnimationMode;
  isDragging: boolean;
  isInstant: boolean;
  isRepeatedClickAdvance: boolean;
  motionSettings: CarouselMotionSettings;
  repeatedClickSettings: CarouselRepeatedClickSettings;
  autoplayDuration: number;
  jumpDuration: number;
}

interface UseCarouselMotionPlanResult {
  releaseMotion: ReleaseMotionResult;
  motionDuration: number;
}

export function useCarouselMotionPlan({
  gesturePointerReleaseVelocity,
  segmentStartVirtualIndex,
  targetVirtualIndex,
  stepSize,
  stepDuration,
  releaseMotionConfig,
  moveReason,
  animationMode,
  isDragging,
  isInstant,
  isRepeatedClickAdvance,
  motionSettings,
  repeatedClickSettings,
  autoplayDuration,
  jumpDuration,
}: UseCarouselMotionPlanProps): UseCarouselMotionPlanResult {
  const releaseMotion = useMemo(
    () =>
      velocityEngine.resolveReleaseMotion({
        gestureReleaseVelocity: gesturePointerReleaseVelocity,
        distanceToTarget: targetVirtualIndex - segmentStartVirtualIndex,
        baseDuration: getDurationByVirtualSpan({
          from: segmentStartVirtualIndex,
          to: targetVirtualIndex,
          stepSize,
          baseDuration: stepDuration,
        }),
        config: releaseMotionConfig,
      }),
    [
      gesturePointerReleaseVelocity,
      releaseMotionConfig,
      segmentStartVirtualIndex,
      stepDuration,
      stepSize,
      targetVirtualIndex,
    ],
  );

  const motionDuration = useMemo(
    () =>
      resolveCarouselMotionDuration({
        gestureReleaseDuration: releaseMotion.duration,
        moveReason,
        animationMode,
        isDragging,
        isInstant,
        isRepeatedClickAdvance,
        segmentStartVirtualIndex,
        targetVirtualIndex,
        stepSize,
        snapBackDuration: motionSettings.snapBackDuration,
        repeatedClickSpeedMultiplier: repeatedClickSettings.speedMultiplier,
        autoplayDuration,
        stepDuration,
        jumpDuration,
      }),
    [
      animationMode,
      autoplayDuration,
      isDragging,
      isInstant,
      isRepeatedClickAdvance,
      jumpDuration,
      motionSettings.snapBackDuration,
      moveReason,
      releaseMotion.duration,
      repeatedClickSettings.speedMultiplier,
      segmentStartVirtualIndex,
      stepDuration,
      stepSize,
      targetVirtualIndex,
    ],
  );

  return {
    releaseMotion,
    motionDuration,
  };
}
