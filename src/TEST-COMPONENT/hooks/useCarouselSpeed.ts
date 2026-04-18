import { useMemo } from "react";
import {
  DRAG_DURATION_RAMP_CONFIG,
  MOTION_MONOTONIC_SPEED_FACTOR,
  SNAP_BACK_DURATION,
} from "../model/config";
import type { MoveReason, AnimationMode } from "../model/reducer";
import { mapVelocityToDuration } from "../../shared";
import {
  SAFE_REPEATED_CLICK_SETTINGS,
  scaleVirtualVelocityToPageVelocity,
} from "../utilities";

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

  const gestureSegmentDuration = useMemo(
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

  const snapSegmentDuration = useMemo(() => {
    const scaledDuration = getSegmentDurationBySpan(
      segmentStartVirtualIndex,
      targetVirtualIndex,
      SNAP_BACK_DURATION,
    );

    return Math.max(
      DRAG_DURATION_RAMP_CONFIG.minDuration,
      Math.min(SNAP_BACK_DURATION, scaledDuration),
    );
  }, [
    getSegmentDurationBySpan,
    segmentStartVirtualIndex,
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
    stepDuration,
  ]);

  const dynamicDuration = useMemo(
    () =>
      mapVelocityToDuration({
        velocity: scaleVirtualVelocityToPageVelocity(velocity, stepSize),
        baseDuration,
        dragSpeedConfig: DRAG_DURATION_RAMP_CONFIG,
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
      (distance * MOTION_MONOTONIC_SPEED_FACTOR) /
      velocityMagnitude
    );
  }, [reason, segmentStartVirtualIndex, targetVirtualIndex, velocity]);

  return useMemo(() => {
    if (isDragging) return 0;

    if (animMode === "snap") return baseDuration;

    if (isInstant || animMode === "jump") return jumpDuration;
    if (reason === "gesture") {
      return Math.max(
        DRAG_DURATION_RAMP_CONFIG.minDuration,
        Math.min(dynamicDuration, velocityPreservingGestureDuration),
      );
    }

    return baseDuration;
  }, [
    animMode,
    baseDuration,
    dynamicDuration,
    isDragging,
    isInstant,
    jumpDuration,
    reason,
    velocityPreservingGestureDuration,
  ]);
}
