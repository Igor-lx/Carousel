import { useMemo } from "react";
import type { MoveReason, AnimationMode } from "../model/reducer";
import { mapVelocityToDuration } from "../../../../shared/hooks/useDrag";
import {
  getDurationByVirtualSpan,
  scaleVirtualVelocityToPageVelocity,
} from "../utilities";
import {
  SAFE_DRAG_DURATION_RAMP_SETTINGS,
  SAFE_MOTION_SETTINGS,
  SAFE_REPEATED_CLICK_SETTINGS,
} from "../model/normalization";

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
      clickSegmentDuration / SAFE_REPEATED_CLICK_SETTINGS.speedMultiplier,
    [clickSegmentDuration],
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
      baseDuration: SAFE_MOTION_SETTINGS.snapBackDuration,
    });

    return Math.max(
      SAFE_DRAG_DURATION_RAMP_SETTINGS.minDuration,
      Math.min(SAFE_MOTION_SETTINGS.snapBackDuration, scaledDuration),
    );
  }, [
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
        dragSpeedConfig: SAFE_DRAG_DURATION_RAMP_SETTINGS,
      }),
    [baseDuration, stepSize, velocity],
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
      (distance * SAFE_MOTION_SETTINGS.monotonicSpeedFactor) /
      velocityMagnitude
    );
  }, [reason, segmentStartVirtualIndex, targetVirtualIndex, velocity]);

  return useMemo(() => {
    if (isDragging) return 0;

    if (animMode === "snap") return baseDuration;

    if (isInstant || animMode === "jump") return jumpDuration;
    if (reason === "gesture") {
      return Math.max(
        SAFE_DRAG_DURATION_RAMP_SETTINGS.minDuration,
        Math.min(velocityScaledDuration, velocityPreservingGestureDuration),
      );
    }

    return baseDuration;
  }, [
    animMode,
    baseDuration,
    velocityScaledDuration,
    isDragging,
    isInstant,
    jumpDuration,
    reason,
    velocityPreservingGestureDuration,
  ]);
}
