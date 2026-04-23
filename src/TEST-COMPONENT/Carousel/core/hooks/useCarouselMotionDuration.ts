import { useMemo } from "react";
import type { MoveReason, AnimationMode } from "../model/reducer";
import type {
  CarouselMotionSettings,
  CarouselRepeatedClickSettings,
} from "../model/diagnostic";
import type { DragSpeedConfig } from "../../../../shared";
import { mapVelocityToDuration } from "../../../../shared/hooks/useDrag";
import {
  getDurationByVirtualSpan,
  scaleVirtualVelocityToPageVelocity,
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
  dragSpeedConfig: DragSpeedConfig;
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
  dragSpeedConfig,
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
    () => clickSegmentDuration / repeatedClickSettings.speedMultiplier,
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

  const snapSegmentDuration = useMemo(() => {
    const scaledDuration = getDurationByVirtualSpan({
      from: segmentStartVirtualIndex,
      to: targetVirtualIndex,
      stepSize,
      baseDuration: motionSettings.snapBackDuration,
    });

    return Math.max(
      dragSpeedConfig.minDuration,
      Math.min(motionSettings.snapBackDuration, scaledDuration),
    );
  }, [
    dragSpeedConfig.minDuration,
    motionSettings.snapBackDuration,
    segmentStartVirtualIndex,
    stepSize,
    targetVirtualIndex,
  ]);

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
        return gestureSegmentDuration;
      default:
        return autoplayDuration;
    }
  }, [
    animMode,
    autoplayDuration,
    clickSegmentDuration,
    gestureSegmentDuration,
    isRepeatedClickAdvance,
    isInstant,
    jumpDuration,
    repeatedClickAdvanceDuration,
    reason,
    snapSegmentDuration,
  ]);

  const velocityScaledDuration = useMemo(
    () =>
      mapVelocityToDuration({
        velocity: scaleVirtualVelocityToPageVelocity(velocity, stepSize),
        baseDuration,
        dragSpeedConfig,
      }),
    [baseDuration, dragSpeedConfig, stepSize, velocity],
  );

  const velocityPreservingGestureDuration = useMemo(() => {
    if (reason !== "gesture") {
      return Infinity;
    }

    const distance = Math.abs(targetVirtualIndex - segmentStartVirtualIndex);
    const velocityMagnitude = Math.abs(velocity);

    if (!(distance > 0) || !(velocityMagnitude > 0)) {
      return Infinity;
    }

    return (
      (distance * motionSettings.monotonicSpeedFactor) / velocityMagnitude
    );
  }, [
    motionSettings.monotonicSpeedFactor,
    reason,
    segmentStartVirtualIndex,
    targetVirtualIndex,
    velocity,
  ]);

  return useMemo(() => {
    if (isDragging) return 0;

    if (animMode === "snap") return baseDuration;

    if (isInstant || animMode === "jump") return jumpDuration;
    if (reason === "gesture") {
      return Math.max(
        dragSpeedConfig.minDuration,
        Math.min(velocityScaledDuration, velocityPreservingGestureDuration),
      );
    }

    return baseDuration;
  }, [
    animMode,
    baseDuration,
    dragSpeedConfig.minDuration,
    velocityScaledDuration,
    isDragging,
    isInstant,
    jumpDuration,
    reason,
    velocityPreservingGestureDuration,
  ]);
}
