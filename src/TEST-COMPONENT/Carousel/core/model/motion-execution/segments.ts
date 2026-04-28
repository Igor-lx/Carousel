import { MOVE_BEZIER } from "../config";
import type {
  CarouselRepeatedClickSettings,
  ReleaseMotionConfig,
} from "../diagnostic";
import {
  createProfileSegment,
  sampleMotionProfile,
} from "../motion-profile";
import {
  getAverageSpeedForDistance,
  getSameDirectionSpeed,
  getSignedVelocity,
} from "../motion-speed";
import type { AnimationMode, MoveReason } from "../reducer";
import type { ReleaseMotionResult } from "../../../../../shared";
import {
  getCarouselMotionBezier,
  parseMotionBezier,
  sampleMotionBezier,
} from "./bezier";
import type {
  CarouselMotionSample,
  CarouselMotionSegment,
  EasingMotionSegment,
} from "./types";

const isEasingSegment = (
  segment: CarouselMotionSegment,
): segment is EasingMotionSegment =>
  segment.strategy === "easing" || segment.strategy === "gesture-easing";

const getNormalMoveSpeed = (stepSize: number, stepDuration: number) => {
  if (!(stepSize > 0) || !(stepDuration > 0)) {
    return 0;
  }

  return getAverageSpeedForDistance(stepSize, stepDuration);
};

export const sampleCarouselMotionSegment = (
  segment: CarouselMotionSegment,
  now: number,
): CarouselMotionSample => {
  const elapsed = Math.max(0, now - segment.startedAt);
  const progress =
    segment.duration > 0 ? Math.min(1, elapsed / segment.duration) : 1;
  const distance = segment.to - segment.from;

  if (progress >= 1) {
    if (isEasingSegment(segment)) {
      const { slope } = sampleMotionBezier(segment.easing, 1);

      return {
        progress,
        position: segment.to,
        velocity: (distance / segment.duration) * slope,
        target: segment.to,
        strategy: segment.strategy,
      };
    }

    const sampledProfile = sampleMotionProfile(
      segment.profile,
      segment.profile.duration,
      Math.abs(distance),
    );

    return {
      progress,
      position: segment.to,
      velocity: Math.sign(distance) * sampledProfile.speed,
      target: segment.to,
      strategy: segment.strategy,
    };
  }

  if (isEasingSegment(segment)) {
    const eased = sampleMotionBezier(segment.easing, progress);

    return {
      progress,
      position: segment.from + distance * eased.progress,
      velocity: (distance / segment.duration) * eased.slope,
      target: segment.to,
      strategy: segment.strategy,
    };
  }

  const sampledProfile = sampleMotionProfile(
    segment.profile,
    elapsed,
    Math.abs(distance),
  );

  return {
    progress,
    position: segment.from + distance * sampledProfile.distanceProgress,
    velocity: Math.sign(distance) * sampledProfile.speed,
    target: segment.to,
    strategy: segment.strategy,
  };
};

interface CreateCarouselMotionSegmentInput {
  animMode: AnimationMode;
  reason: MoveReason;
  nowState: CarouselMotionSample;
  targetVirtualIndex: number;
  startedAt: number;
  stepSize: number;
  stepDuration: number;
  duration: number;
  releaseMotion: ReleaseMotionResult;
  repeatedClickSettings: CarouselRepeatedClickSettings;
  releaseMotionConfig: ReleaseMotionConfig;
  isRepeatedClickAdvance: boolean;
  isRepeatedFollowUp: boolean;
  hasFollowUpStep: boolean;
  epsilon: number;
}

export const createCarouselMotionSegment = ({
  animMode,
  reason,
  nowState,
  targetVirtualIndex,
  startedAt,
  stepSize,
  stepDuration,
  duration,
  releaseMotion,
  repeatedClickSettings,
  releaseMotionConfig,
  isRepeatedClickAdvance,
  isRepeatedFollowUp,
  hasFollowUpStep,
  epsilon,
}: CreateCarouselMotionSegmentInput): CarouselMotionSegment => {
  const distance = targetVirtualIndex - nowState.position;
  const normalMoveSpeed =
    getNormalMoveSpeed(stepSize, stepDuration) ||
    getAverageSpeedForDistance(distance, duration);
  const normalVelocity = getSignedVelocity(normalMoveSpeed, distance);
  const repeatedSpeedMultiplier = Math.max(
    1,
    repeatedClickSettings.speedMultiplier,
  );
  const repeatedVelocity = getSignedVelocity(
    normalMoveSpeed * repeatedSpeedMultiplier,
    distance,
  );
  const gestureReleaseProfileVelocity = getSignedVelocity(
    releaseMotion.effectiveReleaseSpeed,
    distance,
  );
  const repeatedEndVelocity = hasFollowUpStep ? normalVelocity : 0;

  if (isRepeatedClickAdvance) {
    return createProfileSegment({
      strategy: "repeated",
      from: nowState.position,
      to: targetVirtualIndex,
      startedAt,
      currentVelocity: nowState.velocity,
      peakVelocity: repeatedVelocity,
      endVelocity: repeatedEndVelocity,
      accelerationDistanceShare:
        repeatedClickSettings.accelerationDistanceShare,
      decelerationDistanceShare:
        repeatedClickSettings.decelerationDistanceShare,
      targetDuration: duration,
    });
  }

  if (
    reason === "gesture" &&
    animMode !== "snap" &&
    releaseMotion.isInertialRelease
  ) {
    return createProfileSegment({
      strategy: "gesture",
      from: nowState.position,
      to: targetVirtualIndex,
      startedAt,
      currentVelocity: gestureReleaseProfileVelocity,
      peakVelocity: gestureReleaseProfileVelocity,
      endVelocity: 0,
      accelerationDistanceShare: 0,
      decelerationDistanceShare:
        releaseMotionConfig.releaseDecelerationDistanceShare,
      targetDuration: duration,
    });
  }

  if (reason === "gesture" && animMode !== "snap") {
    return {
      strategy: "gesture-easing",
      from: nowState.position,
      to: targetVirtualIndex,
      duration,
      startedAt,
      easing: parseMotionBezier(MOVE_BEZIER),
    };
  }

  if (isRepeatedFollowUp) {
    return createProfileSegment({
      strategy: "repeated-follow-up",
      from: nowState.position,
      to: targetVirtualIndex,
      startedAt,
      currentVelocity: nowState.velocity,
      peakVelocity: normalVelocity,
      endVelocity: 0,
      accelerationDistanceShare: 0,
      decelerationDistanceShare:
        repeatedClickSettings.decelerationDistanceShare,
    });
  }

  if (
    reason === "click" &&
    animMode !== "jump" &&
    getSameDirectionSpeed(nowState.velocity, distance) > epsilon
  ) {
    return createProfileSegment({
      strategy: "handoff",
      from: nowState.position,
      to: targetVirtualIndex,
      startedAt,
      currentVelocity: nowState.velocity,
      peakVelocity: normalVelocity,
      endVelocity: 0,
      accelerationDistanceShare: 0,
      decelerationDistanceShare: 1,
      targetDuration: duration,
    });
  }

  return {
    strategy: "easing",
    from: nowState.position,
    to: targetVirtualIndex,
    duration,
    startedAt,
    easing: parseMotionBezier(getCarouselMotionBezier(animMode, reason)),
  };
};
