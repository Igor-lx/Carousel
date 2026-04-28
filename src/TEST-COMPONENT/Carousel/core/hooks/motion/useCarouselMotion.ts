import { useCallback, useEffect, useRef } from "react";

import type {
  CarouselMotionSettings,
  CarouselRepeatedClickSettings,
  ReleaseMotionConfig,
} from "../../model/diagnostic";
import {
  createCarouselMotionSegment,
  sampleCarouselMotionSegment,
  type CarouselMotionHandoffSnapshot,
  type CarouselMotionSample,
  type CarouselMotionSegment,
} from "../../model/motion-execution";
import type { AnimationMode, MoveReason } from "../../model/reducer";
import { applyTrackPositionStyle } from "../../utilities";
import {
  useIsomorphicLayoutEffect,
  type ReleaseMotionResult,
} from "../../../../../shared";

interface UseCarouselMotionProps {
  trackRef: React.RefObject<HTMLDivElement | null>;
  currentPositionRef: React.MutableRefObject<number>;
  positionReaderRef: React.MutableRefObject<() => number>;
  enabled: boolean;
  startVirtualIndex: number;
  currentVirtualIndex: number;
  windowStart: number;
  size: number;
  stepDuration: number;
  motionSettings: CarouselMotionSettings;
  repeatedClickSettings: CarouselRepeatedClickSettings;
  releaseMotionConfig: ReleaseMotionConfig;
  isMoving: boolean;
  animMode: AnimationMode;
  reason: MoveReason;
  duration: number;
  releaseMotion: ReleaseMotionResult;
  gestureUiReleaseVelocity: number;
  isRepeatedClickAdvance: boolean;
  followUpVirtualIndex: number | null;
  onComplete: () => void;
}

export function useCarouselMotion({
  trackRef,
  currentPositionRef,
  positionReaderRef,
  enabled,
  startVirtualIndex,
  currentVirtualIndex,
  windowStart,
  size,
  stepDuration,
  motionSettings,
  repeatedClickSettings,
  releaseMotionConfig,
  isMoving,
  animMode,
  reason,
  duration,
  releaseMotion,
  gestureUiReleaseVelocity,
  isRepeatedClickAdvance,
  followUpVirtualIndex,
  onComplete,
}: UseCarouselMotionProps): void {
  const hasFollowUpStep = followUpVirtualIndex !== null;
  const epsilon = motionSettings.epsilon;
  const frameRef = useRef<number | null>(null);
  const completionFrameRef = useRef<number | null>(null);
  const activeSegmentRef = useRef<CarouselMotionSegment | null>(null);
  const handoffSnapshotRef =
    useRef<CarouselMotionHandoffSnapshot | null>(null);
  const velocityRef = useRef(0);
  const lastPlanRef = useRef<string>("");

  const applyPosition = useCallback(
    (position: number) => {
      currentPositionRef.current = position;

      const track = trackRef.current;
      if (!track) return;

      applyTrackPositionStyle(track, position, windowStart, size);
    },
    [size, trackRef, windowStart],
  );

  const cancelAnimation = useCallback(() => {
    if (frameRef.current !== null) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const cancelCompletion = useCallback(() => {
    if (completionFrameRef.current !== null) {
      window.cancelAnimationFrame(completionFrameRef.current);
      completionFrameRef.current = null;
    }
  }, []);

  const sampleCurrentState = useCallback(
    (timestamp: number): CarouselMotionSample => {
      const segment = activeSegmentRef.current;
      if (!segment) {
        return {
          progress: 1,
          position: currentPositionRef.current,
          velocity: velocityRef.current,
          target: currentPositionRef.current,
          strategy: "easing",
        };
      }

      return sampleCarouselMotionSegment(segment, timestamp);
    },
    [currentPositionRef],
  );

  const readCurrentPosition = useCallback(() => {
    const sampled = sampleCurrentState(performance.now());

    currentPositionRef.current = sampled.position;
    velocityRef.current = sampled.velocity;

    return sampled.position;
  }, [currentPositionRef, sampleCurrentState]);

  const readCurrentState = useCallback(() => {
    const sampled = sampleCurrentState(performance.now());
    currentPositionRef.current = sampled.position;
    velocityRef.current = sampled.velocity;

    if (sampled.progress >= 1) {
      activeSegmentRef.current = null;
    }

    return sampled;
  }, [currentPositionRef, sampleCurrentState]);

  positionReaderRef.current = readCurrentPosition;

  const finalizeMotion = useCallback(
    (
      handoffToFollowUp: boolean,
      handoffSnapshot?: CarouselMotionHandoffSnapshot,
    ) => {
      cancelAnimation();
      const segment = activeSegmentRef.current;
      activeSegmentRef.current = null;
      applyPosition(currentVirtualIndex);
      cancelCompletion();

      if (handoffToFollowUp) {
        const sampled = handoffSnapshot ??
          (segment
            ? {
                ...sampleCarouselMotionSegment(segment, performance.now()),
                timestamp: performance.now(),
              }
            : {
                position: currentVirtualIndex,
                velocity: velocityRef.current,
                timestamp: performance.now(),
                target: currentVirtualIndex,
                strategy: "easing",
              });

        handoffSnapshotRef.current = sampled;
        velocityRef.current = sampled.velocity;
        onComplete();
        return;
      }

      handoffSnapshotRef.current = null;
      velocityRef.current = 0;
      completionFrameRef.current = window.requestAnimationFrame(() => {
        completionFrameRef.current = null;
        onComplete();
      });
    },
    [
      applyPosition,
      cancelAnimation,
      cancelCompletion,
      currentVirtualIndex,
      onComplete,
    ],
  );

  const animate = useCallback(() => {
    cancelAnimation();

    const step = (timestamp: number) => {
      const segment = activeSegmentRef.current;
      if (!segment) {
        frameRef.current = null;
        return;
      }

      const sampled = sampleCarouselMotionSegment(segment, timestamp);
      velocityRef.current = sampled.velocity;
      applyPosition(sampled.position);

      if (sampled.progress >= 1) {
        frameRef.current = null;
        finalizeMotion(hasFollowUpStep, {
          position: sampled.position,
          velocity: sampled.velocity,
          timestamp,
          target: sampled.target,
          strategy: sampled.strategy,
        });
        return;
      }

      frameRef.current = window.requestAnimationFrame(step);
    };

    frameRef.current = window.requestAnimationFrame(step);
  }, [applyPosition, cancelAnimation, finalizeMotion, hasFollowUpStep]);

  useIsomorphicLayoutEffect(() => {
    const planKey = [
      enabled,
      isMoving,
      animMode,
      reason,
      duration,
      releaseMotion.effectiveReleaseSpeed,
      releaseMotion.isInertialRelease,
      gestureUiReleaseVelocity,
      startVirtualIndex,
      currentVirtualIndex,
      isRepeatedClickAdvance,
      followUpVirtualIndex,
      stepDuration,
      repeatedClickSettings.speedMultiplier,
      repeatedClickSettings.accelerationDistanceShare,
      repeatedClickSettings.decelerationDistanceShare,
      epsilon,
    ].join(":");

    if (lastPlanRef.current === planKey) {
      if (!isMoving) {
        applyPosition(currentPositionRef.current);
      }
      return;
    }

    lastPlanRef.current = planKey;
    cancelCompletion();

    if (!enabled) {
      cancelAnimation();
      activeSegmentRef.current = null;
      handoffSnapshotRef.current = null;
      velocityRef.current = 0;
      applyPosition(currentVirtualIndex);
      return;
    }

    if (!isMoving) {
      cancelAnimation();
      activeSegmentRef.current = null;
      handoffSnapshotRef.current = null;
      velocityRef.current = 0;
      applyPosition(currentVirtualIndex);
      return;
    }

    if (animMode === "instant" || duration <= 0) {
      finalizeMotion(hasFollowUpStep);
      return;
    }

    const previousSegment = activeSegmentRef.current;
    const handoffSnapshot = handoffSnapshotRef.current;
    const canReuseHandoffSnapshot =
      previousSegment === null &&
      handoffSnapshot !== null &&
      Math.abs(handoffSnapshot.position - startVirtualIndex) < epsilon;
    const now = performance.now();
    const nowState: CarouselMotionSample = previousSegment
      ? readCurrentState()
      : canReuseHandoffSnapshot
        ? {
            progress: 0,
            position: handoffSnapshot.position,
            velocity: handoffSnapshot.velocity,
            target: handoffSnapshot.target,
            strategy: handoffSnapshot.strategy,
          }
        : reason === "gesture"
          ? {
              progress: 0,
              position: currentPositionRef.current,
              velocity: gestureUiReleaseVelocity,
              target: currentVirtualIndex,
              strategy: "gesture",
            }
          : {
              progress: 0,
              position: currentPositionRef.current,
              velocity: velocityRef.current,
              target: currentVirtualIndex,
              strategy: "easing",
            };
    const distance = currentVirtualIndex - nowState.position;

    if (Math.abs(distance) < epsilon) {
      finalizeMotion(hasFollowUpStep);
      return;
    }

    const startedAt = canReuseHandoffSnapshot ? handoffSnapshot.timestamp : now;
    const isRepeatedFollowUp =
      canReuseHandoffSnapshot && handoffSnapshot?.strategy === "repeated";

    activeSegmentRef.current = createCarouselMotionSegment({
      animMode,
      reason,
      nowState,
      targetVirtualIndex: currentVirtualIndex,
      startedAt,
      stepSize: size,
      stepDuration,
      duration,
      releaseMotion,
      repeatedClickSettings,
      releaseMotionConfig,
      isRepeatedClickAdvance,
      isRepeatedFollowUp,
      hasFollowUpStep,
      epsilon,
    });

    if (canReuseHandoffSnapshot) {
      handoffSnapshotRef.current = null;
      const currentSegment = activeSegmentRef.current;

      if (currentSegment) {
        const sampled = sampleCarouselMotionSegment(currentSegment, now);
        velocityRef.current = sampled.velocity;
        applyPosition(sampled.position);
      }
    } else {
      applyPosition(nowState.position);
    }

    animate();
  }, [
    animate,
    animMode,
    applyPosition,
    cancelAnimation,
    cancelCompletion,
    currentVirtualIndex,
    currentPositionRef,
    duration,
    enabled,
    epsilon,
    finalizeMotion,
    followUpVirtualIndex,
    releaseMotion.effectiveReleaseSpeed,
    releaseMotion.isInertialRelease,
    gestureUiReleaseVelocity,
    hasFollowUpStep,
    isRepeatedClickAdvance,
    isMoving,
    readCurrentState,
    reason,
    repeatedClickSettings.decelerationDistanceShare,
    repeatedClickSettings.speedMultiplier,
    repeatedClickSettings.accelerationDistanceShare,
    size,
    startVirtualIndex,
    stepDuration,
  ]);

  useEffect(
    () => () => {
      cancelAnimation();
      cancelCompletion();
    },
    [cancelAnimation, cancelCompletion],
  );
}
