import { useCallback, useEffect, useRef } from "react";

import {
  AUTO_BEZIER,
  JUMP_BEZIER,
  MOVE_BEZIER,
  SNAP_BACK_BEZIER,
} from "../model/config";
import type {
  CarouselMotionSettings,
  CarouselRepeatedClickSettings,
  ReleaseMotionConfig,
} from "../model/diagnostic";
import {
  createProfileSegment,
  sampleMotionProfile,
  type MotionProfile,
} from "../model/motion-profile";
import {
  getAverageSpeedForDistance,
  getSameDirectionSpeed,
  getSignedVelocity,
} from "../model/motion-speed";
import type { AnimationMode, MoveReason } from "../model/reducer";
import { applyTrackPositionStyle } from "../utilities";
import {
  useIsomorphicLayoutEffect,
  type ReleaseMotionResult,
} from "../../../../shared";

interface MotionProps {
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
  gestureReleaseMotion: ReleaseMotionResult;
  gestureUiReleaseVelocity: number;
  isRepeatedClickAdvance: boolean;
  followUpVirtualIndex: number | null;
  onComplete: () => void;
}

type MotionStrategyKind =
  | "easing"
  | "gesture-easing"
  | "gesture"
  | "repeated"
  | "repeated-follow-up"
  | "handoff";

type CubicBezier = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

type MotionSegmentBase = {
  strategy: MotionStrategyKind;
  from: number;
  to: number;
  duration: number;
  startedAt: number;
};

type EasingMotionSegment = MotionSegmentBase & {
  strategy: "easing" | "gesture-easing";
  easing: CubicBezier;
};

type ProfileMotionSegment = MotionSegmentBase & {
  strategy: "gesture" | "repeated" | "repeated-follow-up" | "handoff";
  profile: MotionProfile;
};

type MotionSegment = EasingMotionSegment | ProfileMotionSegment;

type MotionSample = {
  progress: number;
  position: number;
  velocity: number;
  target: number;
  strategy: MotionStrategyKind;
};

type HandoffSnapshot = {
  position: number;
  velocity: number;
  timestamp: number;
  target: number;
  strategy: MotionStrategyKind;
};

const LINEAR_BEZIER: CubicBezier = {
  x1: 0,
  y1: 0,
  x2: 1,
  y2: 1,
};

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const isEasingStrategy = (
  strategy: MotionStrategyKind,
): strategy is EasingMotionSegment["strategy"] =>
  strategy === "easing" || strategy === "gesture-easing";

const isEasingSegment = (
  segment: MotionSegment,
): segment is EasingMotionSegment => isEasingStrategy(segment.strategy);

const getBezier = (animMode: AnimationMode, reason: MoveReason) => {
  if (animMode === "jump") return JUMP_BEZIER;
  if (animMode === "snap") return SNAP_BACK_BEZIER;

  switch (reason) {
    case "autoplay":
      return AUTO_BEZIER;
    case "gesture":
    case "click":
    default:
      return MOVE_BEZIER;
  }
};

const parseBezier = (bezier: string): CubicBezier => {
  if (bezier.trim().toLowerCase() === "linear") {
    return LINEAR_BEZIER;
  }

  const match =
    /cubic-bezier\(\s*([+-]?\d*\.?\d+)\s*,\s*([+-]?\d*\.?\d+)\s*,\s*([+-]?\d*\.?\d+)\s*,\s*([+-]?\d*\.?\d+)/i.exec(
      bezier,
    );

  if (!match) {
    return LINEAR_BEZIER;
  }

  const x1 = Number.parseFloat(match[1] ?? "");
  const y1 = Number.parseFloat(match[2] ?? "");
  const x2 = Number.parseFloat(match[3] ?? "");
  const y2 = Number.parseFloat(match[4] ?? "");

  if (
    !Number.isFinite(x1) ||
    !Number.isFinite(y1) ||
    !Number.isFinite(x2) ||
    !Number.isFinite(y2)
  ) {
    return LINEAR_BEZIER;
  }

  return {
    x1: clamp(x1, 0, 1),
    y1,
    x2: clamp(x2, 0, 1),
    y2,
  };
};

const cubicBezierValue = (
  t: number,
  firstControlPoint: number,
  secondControlPoint: number,
) => {
  const inverse = 1 - t;

  return (
    3 * inverse * inverse * t * firstControlPoint +
    3 * inverse * t * t * secondControlPoint +
    t * t * t
  );
};

const cubicBezierDerivative = (
  t: number,
  firstControlPoint: number,
  secondControlPoint: number,
) => {
  const inverse = 1 - t;

  return (
    3 * inverse * inverse * firstControlPoint +
    6 * inverse * t * (secondControlPoint - firstControlPoint) +
    3 * t * t * (1 - secondControlPoint)
  );
};

const solveBezierT = (bezier: CubicBezier, progress: number) => {
  const target = clamp(progress, 0, 1);
  let t = target;

  for (let i = 0; i < 5; i += 1) {
    const x = cubicBezierValue(t, bezier.x1, bezier.x2);
    const derivative = cubicBezierDerivative(t, bezier.x1, bezier.x2);

    if (Math.abs(x - target) < 0.000001 || Math.abs(derivative) < 0.000001) {
      break;
    }

    t = clamp(t - (x - target) / derivative, 0, 1);
  }

  let lower = 0;
  let upper = 1;

  for (let i = 0; i < 8; i += 1) {
    const x = cubicBezierValue(t, bezier.x1, bezier.x2);
    if (Math.abs(x - target) < 0.000001) {
      break;
    }

    if (x < target) {
      lower = t;
    } else {
      upper = t;
    }

    t = (lower + upper) / 2;
  }

  return t;
};

const sampleBezier = (bezier: CubicBezier, progress: number) => {
  const t = solveBezierT(bezier, progress);
  const eased = clamp(cubicBezierValue(t, bezier.y1, bezier.y2), 0, 1);
  const dx = cubicBezierDerivative(t, bezier.x1, bezier.x2);
  const dy = cubicBezierDerivative(t, bezier.y1, bezier.y2);
  const slope = Math.abs(dx) > 0.000001 ? dy / dx : 0;

  return {
    progress: eased,
    slope: Number.isFinite(slope) ? slope : 0,
  };
};

const getNormalMoveSpeed = (stepSize: number, stepDuration: number) => {
  if (!(stepSize > 0) || !(stepDuration > 0)) {
    return 0;
  }

  return getAverageSpeedForDistance(stepSize, stepDuration);
};

const sampleSegment = (segment: MotionSegment, now: number): MotionSample => {
  const elapsed = Math.max(0, now - segment.startedAt);
  const progress =
    segment.duration > 0 ? Math.min(1, elapsed / segment.duration) : 1;
  const distance = segment.to - segment.from;

  if (progress >= 1) {
    if (isEasingSegment(segment)) {
      const { slope } = sampleBezier(segment.easing, 1);

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
    const eased = sampleBezier(segment.easing, progress);

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
  gestureReleaseMotion,
  gestureUiReleaseVelocity,
  isRepeatedClickAdvance,
  followUpVirtualIndex,
  onComplete,
}: MotionProps): void {
  const hasFollowUpStep = followUpVirtualIndex !== null;
  const epsilon = motionSettings.epsilon;
  const frameRef = useRef<number | null>(null);
  const completionFrameRef = useRef<number | null>(null);
  const activeSegmentRef = useRef<MotionSegment | null>(null);
  const handoffSnapshotRef = useRef<HandoffSnapshot | null>(null);
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
    (timestamp: number) => {
      const segment = activeSegmentRef.current;
      if (!segment) {
        return {
          progress: 1,
          position: currentPositionRef.current,
          velocity: velocityRef.current,
          target: currentPositionRef.current,
          strategy: "easing" as MotionStrategyKind,
        };
      }

      return sampleSegment(segment, timestamp);
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
    (handoffToFollowUp: boolean, handoffSnapshot?: HandoffSnapshot) => {
      cancelAnimation();
      const segment = activeSegmentRef.current;
      activeSegmentRef.current = null;
      applyPosition(currentVirtualIndex);
      cancelCompletion();

      if (handoffToFollowUp) {
        const sampled = handoffSnapshot ??
          (segment
            ? {
                ...sampleSegment(segment, performance.now()),
                timestamp: performance.now(),
              }
            : {
                position: currentVirtualIndex,
                velocity: velocityRef.current,
                timestamp: performance.now(),
                target: currentVirtualIndex,
                strategy: "easing" as MotionStrategyKind,
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

      const sampled = sampleSegment(segment, timestamp);
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
      gestureReleaseMotion.effectiveReleaseSpeed,
      gestureReleaseMotion.isInertialRelease,
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
    const nowState = previousSegment
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
              strategy: "gesture" as MotionStrategyKind,
            }
          : {
              progress: 0,
              position: currentPositionRef.current,
              velocity: velocityRef.current,
              target: currentVirtualIndex,
              strategy: "easing" as MotionStrategyKind,
            };
    const distance = currentVirtualIndex - nowState.position;

    if (Math.abs(distance) < epsilon) {
      finalizeMotion(hasFollowUpStep);
      return;
    }

    const startedAt = canReuseHandoffSnapshot ? handoffSnapshot.timestamp : now;
    const normalMoveSpeed =
      getNormalMoveSpeed(size, stepDuration) ||
      getAverageSpeedForDistance(distance, duration);
    const normalVelocity = getSignedVelocity(normalMoveSpeed, distance);
    const repeatedSpeedMultiplier = Math.max(1, repeatedClickSettings.speedMultiplier);
    const repeatedVelocity = getSignedVelocity(
      normalMoveSpeed * repeatedSpeedMultiplier,
      distance,
    );
    const gestureReleaseProfileVelocity = getSignedVelocity(
      gestureReleaseMotion.effectiveReleaseSpeed,
      distance,
    );
    const repeatedEndVelocity = hasFollowUpStep ? normalVelocity : 0;
    const isRepeatedFollowUp =
      canReuseHandoffSnapshot && handoffSnapshot?.strategy === "repeated";

    if (isRepeatedClickAdvance) {
      activeSegmentRef.current = createProfileSegment({
        strategy: "repeated",
        from: nowState.position,
        to: currentVirtualIndex,
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
    } else if (
      reason === "gesture" &&
      animMode !== "snap" &&
      gestureReleaseMotion.isInertialRelease
    ) {
      activeSegmentRef.current = createProfileSegment({
        strategy: "gesture",
        from: nowState.position,
        to: currentVirtualIndex,
        startedAt,
        currentVelocity: gestureReleaseProfileVelocity,
        peakVelocity: gestureReleaseProfileVelocity,
        endVelocity: 0,
        accelerationDistanceShare: 0,
        decelerationDistanceShare:
          releaseMotionConfig.releaseDecelerationDistanceShare,
        targetDuration: duration,
      });
    } else if (reason === "gesture" && animMode !== "snap") {
      activeSegmentRef.current = {
        strategy: "gesture-easing",
        from: nowState.position,
        to: currentVirtualIndex,
        duration,
        startedAt,
        easing: parseBezier(MOVE_BEZIER),
      };
    } else if (isRepeatedFollowUp) {
      activeSegmentRef.current = createProfileSegment({
        strategy: "repeated-follow-up",
        from: nowState.position,
        to: currentVirtualIndex,
        startedAt,
        currentVelocity: nowState.velocity,
        peakVelocity: normalVelocity,
        endVelocity: 0,
        accelerationDistanceShare: 0,
        decelerationDistanceShare:
          repeatedClickSettings.decelerationDistanceShare,
      });
    } else if (
      reason === "click" &&
      animMode !== "jump" &&
      getSameDirectionSpeed(nowState.velocity, distance) > epsilon
    ) {
      activeSegmentRef.current = createProfileSegment({
        strategy: "handoff",
        from: nowState.position,
        to: currentVirtualIndex,
        startedAt,
        currentVelocity: nowState.velocity,
        peakVelocity: normalVelocity,
        endVelocity: 0,
        accelerationDistanceShare: 0,
        decelerationDistanceShare: 1,
        targetDuration: duration,
      });
    } else {
      activeSegmentRef.current = {
        strategy: "easing",
        from: nowState.position,
        to: currentVirtualIndex,
        duration,
        startedAt,
        easing: parseBezier(getBezier(animMode, reason)),
      };
    }

    if (canReuseHandoffSnapshot) {
      handoffSnapshotRef.current = null;
      const currentSegment = activeSegmentRef.current;

      if (currentSegment) {
        const sampled = sampleSegment(currentSegment, now);
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
    gestureReleaseMotion.effectiveReleaseSpeed,
    gestureReleaseMotion.isInertialRelease,
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
