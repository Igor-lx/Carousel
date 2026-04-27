import { useMemo } from "react";

import type {
  CarouselMotionSettings,
  CarouselRepeatedClickSettings,
  ReleaseMotionConfig,
} from "../model/diagnostic";
import type { AnimationMode, MoveReason } from "../model/reducer";
import {
  getDurationByVirtualSpan,
} from "../utilities";
import {
  type ReleaseMotionResult,
  velocityEngine,
} from "../../../../shared";
import { useCarouselMotionDuration } from "./useCarouselMotionDuration";

interface UseCarouselMotionPlanProps {
  gesturePointerReleaseVelocity: number;
  segmentStartVirtualIndex: number;
  targetVirtualIndex: number;
  stepSize: number;
  stepDuration: number;
  releaseMotionConfig: ReleaseMotionConfig;
  reason: MoveReason;
  animMode: AnimationMode;
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
  reason,
  animMode,
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

  const motionDuration = useCarouselMotionDuration({
    gestureReleaseDuration: releaseMotion.duration,
    reason,
    animMode,
    isDragging,
    isInstant,
    isRepeatedClickAdvance,
    segmentStartVirtualIndex,
    targetVirtualIndex,
    stepSize,
    motionSettings,
    repeatedClickSettings,
    autoplayDuration,
    stepDuration,
    jumpDuration,
  });

  return {
    releaseMotion,
    motionDuration,
  };
}
