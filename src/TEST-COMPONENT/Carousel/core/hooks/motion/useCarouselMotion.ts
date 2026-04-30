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
  type CarouselMotionStrategy,
} from "../../model/motion-execution";
import type { AnimationMode, MoveReason } from "../../model/reducer";
import {
  useIsomorphicLayoutEffect,
  type NumericMotionController,
  type NumericMotionSample,
  type ReleaseMotionResult,
} from "../../../../../shared";

interface UseCarouselMotionProps {
  motionController: NumericMotionController<CarouselMotionStrategy>;
  currentPositionRef: React.MutableRefObject<number>;
  positionReaderRef: React.MutableRefObject<() => number>;
  enabled: boolean;
  startVirtualIndex: number;
  targetVirtualIndex: number;
  stepSize: number;
  stepDuration: number;
  motionSettings: CarouselMotionSettings;
  repeatedClickSettings: CarouselRepeatedClickSettings;
  releaseMotionConfig: ReleaseMotionConfig;
  isMoving: boolean;
  animationMode: AnimationMode;
  moveReason: MoveReason;
  motionDuration: number;
  releaseMotion: ReleaseMotionResult;
  gestureUiReleaseVelocity: number;
  isRepeatedClickAdvance: boolean;
  followUpVirtualIndex: number | null;
  onComplete: () => void;
}

const toCarouselMotionSample = (
  sample: NumericMotionSample<CarouselMotionStrategy>,
): CarouselMotionSample => ({
  progress: sample.progress,
  position: sample.value,
  velocity: sample.velocity,
  target: sample.target,
  strategy: sample.strategy,
});

const toHandoffSnapshot = (
  sample: NumericMotionSample<CarouselMotionStrategy>,
): CarouselMotionHandoffSnapshot => ({
  position: sample.value,
  velocity: sample.velocity,
  timestamp: sample.timestamp,
  target: sample.target,
  strategy: sample.strategy,
});

export function useCarouselMotion({
  motionController,
  currentPositionRef,
  positionReaderRef,
  enabled,
  startVirtualIndex,
  targetVirtualIndex,
  stepSize,
  stepDuration,
  motionSettings,
  repeatedClickSettings,
  releaseMotionConfig,
  isMoving,
  animationMode,
  moveReason,
  motionDuration,
  releaseMotion,
  gestureUiReleaseVelocity,
  isRepeatedClickAdvance,
  followUpVirtualIndex,
  onComplete,
}: UseCarouselMotionProps): void {
  const hasFollowUpStep = followUpVirtualIndex !== null;
  const epsilon = motionSettings.epsilon;
  const handoffSnapshotRef =
    useRef<CarouselMotionHandoffSnapshot | null>(null);
  const velocityRef = useRef(0);
  const lastPlanRef = useRef<string>("");

  const sampleMotionSegment = useCallback(
    (segment: CarouselMotionSegment, timestamp: number) => {
      const sample = sampleCarouselMotionSegment(segment, timestamp);

      return {
        progress: sample.progress,
        value: sample.position,
        velocity: sample.velocity,
        target: sample.target,
        strategy: sample.strategy,
      };
    },
    [],
  );

  const completeMotion = useCallback(
    (sample: NumericMotionSample<CarouselMotionStrategy>) => {
      currentPositionRef.current = sample.value;

      if (hasFollowUpStep) {
        handoffSnapshotRef.current = toHandoffSnapshot(sample);
        velocityRef.current = sample.velocity;
        onComplete();
        return;
      }

      handoffSnapshotRef.current = null;
      velocityRef.current = 0;
      onComplete();
    },
    [currentPositionRef, hasFollowUpStep, onComplete],
  );

  positionReaderRef.current = () => motionController.read().value;

  useIsomorphicLayoutEffect(
    () =>
      motionController.subscribe(
        (sample) => {
          currentPositionRef.current = sample.value;
          velocityRef.current = sample.velocity;
        },
        { emitCurrent: true },
      ),
    [currentPositionRef, motionController],
  );

  useIsomorphicLayoutEffect(() => {
    const planKey = [
      enabled,
      isMoving,
      animationMode,
      moveReason,
      motionDuration,
      releaseMotion.effectiveReleaseSpeed,
      releaseMotion.isInertialRelease,
      gestureUiReleaseVelocity,
      startVirtualIndex,
      targetVirtualIndex,
      isRepeatedClickAdvance,
      followUpVirtualIndex,
      stepDuration,
      repeatedClickSettings.speedMultiplier,
      repeatedClickSettings.accelerationDistanceShare,
      repeatedClickSettings.decelerationDistanceShare,
      epsilon,
    ].join(":");

    if (lastPlanRef.current === planKey) {
      return;
    }

    lastPlanRef.current = planKey;

    const completion = hasFollowUpStep ? "immediate" : "next-frame";

    if (!enabled) {
      motionController.snap(targetVirtualIndex, {
        strategy: "easing",
      });
      handoffSnapshotRef.current = null;
      velocityRef.current = 0;
      return;
    }

    if (!isMoving) {
      motionController.snap(targetVirtualIndex, {
        strategy: "easing",
      });
      handoffSnapshotRef.current = null;
      velocityRef.current = 0;
      return;
    }

    if (animationMode === "instant" || motionDuration <= 0) {
      motionController.snap(targetVirtualIndex, {
        strategy: "easing",
        onComplete: completeMotion,
        completion,
      });
      return;
    }

    const hasActiveSegment = motionController.isActive();
    const handoffSnapshot = handoffSnapshotRef.current;
    const canReuseHandoffSnapshot =
      !hasActiveSegment &&
      handoffSnapshot !== null &&
      Math.abs(handoffSnapshot.position - startVirtualIndex) < epsilon;
    const now = performance.now();
    const currentControllerSample = motionController.read();
    const nowState: CarouselMotionSample = hasActiveSegment
      ? toCarouselMotionSample(currentControllerSample)
      : canReuseHandoffSnapshot
        ? {
            progress: 0,
            position: handoffSnapshot.position,
            velocity: handoffSnapshot.velocity,
            target: handoffSnapshot.target,
            strategy: handoffSnapshot.strategy,
          }
        : moveReason === "gesture"
          ? {
              progress: 0,
              position: currentPositionRef.current,
              velocity: gestureUiReleaseVelocity,
              target: targetVirtualIndex,
              strategy: "gesture",
            }
          : {
              progress: 0,
              position: currentPositionRef.current,
              velocity: velocityRef.current,
              target: targetVirtualIndex,
              strategy: "easing",
            };
    const distance = targetVirtualIndex - nowState.position;

    if (Math.abs(distance) < epsilon) {
      motionController.snap(targetVirtualIndex, {
        strategy: nowState.strategy,
        velocity: nowState.velocity,
        onComplete: completeMotion,
        completion,
      });
      return;
    }

    const startedAt = canReuseHandoffSnapshot ? handoffSnapshot.timestamp : now;
    const isRepeatedFollowUp =
      canReuseHandoffSnapshot && handoffSnapshot?.strategy === "repeated";

    const segment = createCarouselMotionSegment({
      animationMode,
      moveReason,
      nowState,
      targetVirtualIndex,
      startedAt,
      stepSize,
      stepDuration,
      duration: motionDuration,
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
    }

    motionController.start({
      segment,
      sampler: sampleMotionSegment,
      onComplete: completeMotion,
      completion,
    });
  }, [
    animationMode,
    completeMotion,
    currentPositionRef,
    enabled,
    epsilon,
    followUpVirtualIndex,
    releaseMotion.effectiveReleaseSpeed,
    releaseMotion.isInertialRelease,
    gestureUiReleaseVelocity,
    hasFollowUpStep,
    isRepeatedClickAdvance,
    isMoving,
    motionController,
    motionDuration,
    moveReason,
    releaseMotion,
    releaseMotionConfig,
    repeatedClickSettings,
    sampleMotionSegment,
    startVirtualIndex,
    stepDuration,
    stepSize,
    targetVirtualIndex,
  ]);

  useEffect(
    () => () => {
      motionController.cancel();
    },
    [motionController],
  );
}
