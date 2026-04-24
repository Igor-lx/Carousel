import { useCallback, useEffect, useRef } from "react";

import {
  JUMP_BEZIER,
  MOVE_AUTO_BEZIER,
  MOVE_CLICK_BEZIER,
  MOVE_SWIPE_BEZIER,
  SNAP_BACK_BEZIER,
} from "../model/config";
import type {
  DragSpeedConfig,
  CarouselMotionSettings,
  CarouselRepeatedClickSettings,
} from "../model/diagnostic";
import type { AnimationMode, MoveReason } from "../model/reducer";
import { applyTrackPositionStyle } from "../utilities";
import { useIsomorphicLayoutEffect } from "../../../../shared";

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
  dragSpeedConfig: DragSpeedConfig;
  isMoving: boolean;
  animMode: AnimationMode;
  reason: MoveReason;
  duration: number;
  gestureReleaseVelocity: number;
  gestureReleaseMotionVelocity: number;
  isRepeatedClickAdvance: boolean;
  followUpVirtualIndex: number | null;
  followUpDuration: number;
  onComplete: () => void;
}

type MotionStrategyKind =
  | "easing"
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

type VelocityProfile = {
  duration: number;
  zones: VelocityProfileZone[];
};

type VelocityProfileZone = {
  startDistanceProgress: number;
  endDistanceProgress: number;
  startTime: number;
  duration: number;
  startSpeed: number;
  endSpeed: number;
};

type MotionSegmentBase = {
  strategy: MotionStrategyKind;
  from: number;
  to: number;
  duration: number;
  startedAt: number;
};

type EasingMotionSegment = MotionSegmentBase & {
  strategy: "easing";
  easing: CubicBezier;
};

type ProfileMotionSegment = MotionSegmentBase & {
  strategy: "gesture" | "repeated" | "repeated-follow-up" | "handoff";
  profile: VelocityProfile;
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

const smoothstep = (progress: number) =>
  progress * progress * (3 - 2 * progress);

const smoothstepIntegral = (progress: number) =>
  progress * progress * progress - 0.5 * progress * progress * progress * progress;

const lerp = (from: number, to: number, progress: number) =>
  from + (to - from) * progress;

const getBezier = (animMode: AnimationMode, reason: MoveReason) => {
  if (animMode === "jump") return JUMP_BEZIER;
  if (animMode === "snap") return SNAP_BACK_BEZIER;

  switch (reason) {
    case "gesture":
      return MOVE_SWIPE_BEZIER;
    case "autoplay":
      return MOVE_AUTO_BEZIER;
    case "click":
    default:
      return MOVE_CLICK_BEZIER;
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

const normalizeProfileShare = (value: number) =>
  Number.isFinite(value) ? clamp(value, 0, 1) : 0;

const getProfileShares = (
  startAcceleration: number,
  endDeceleration: number,
) => {
  let accelerationShare = normalizeProfileShare(startAcceleration);
  let decelerationShare = normalizeProfileShare(endDeceleration);
  const shapingShare = accelerationShare + decelerationShare;

  if (shapingShare > 1) {
    accelerationShare /= shapingShare;
    decelerationShare /= shapingShare;
  }

  return {
    accelerationShare,
    cruiseShare: Math.max(0, 1 - accelerationShare - decelerationShare),
    decelerationShare,
  };
};

const MIN_PROFILE_SPEED = 0.000001;

const getZoneDuration = (
  distance: number,
  startSpeed: number,
  endSpeed: number,
) => {
  if (!(distance > 0)) {
    return 0;
  }

  const averageSpeed = Math.max(
    MIN_PROFILE_SPEED,
    (Math.max(0, startSpeed) + Math.max(0, endSpeed)) * 0.5,
  );

  return distance / averageSpeed;
};

const getProfileDurationForPeakSpeed = ({
  distance,
  startSpeed,
  peakSpeed,
  endSpeed,
  accelerationShare,
  cruiseShare,
  decelerationShare,
}: {
  distance: number;
  startSpeed: number;
  peakSpeed: number;
  endSpeed: number;
  accelerationShare: number;
  cruiseShare: number;
  decelerationShare: number;
}) =>
  getZoneDuration(distance * accelerationShare, startSpeed, peakSpeed) +
  getZoneDuration(distance * cruiseShare, peakSpeed, peakSpeed) +
  getZoneDuration(distance * decelerationShare, peakSpeed, endSpeed);

const solvePeakSpeedForDuration = ({
  distance,
  targetDuration,
  startSpeed,
  peakSpeed,
  endSpeed,
  accelerationShare,
  cruiseShare,
  decelerationShare,
}: {
  distance: number;
  targetDuration: number;
  startSpeed: number;
  peakSpeed: number;
  endSpeed: number;
  accelerationShare: number;
  cruiseShare: number;
  decelerationShare: number;
}) => {
  if (!(distance > 0) || !(targetDuration > 0)) {
    return peakSpeed;
  }

  let lower = Math.max(MIN_PROFILE_SPEED, peakSpeed, startSpeed, endSpeed);
  let upper = lower;
  let upperDuration = getProfileDurationForPeakSpeed({
    distance,
    startSpeed,
    peakSpeed: upper,
    endSpeed,
    accelerationShare,
    cruiseShare,
    decelerationShare,
  });

  for (let i = 0; upperDuration > targetDuration && i < 24; i += 1) {
    upper *= 2;
    upperDuration = getProfileDurationForPeakSpeed({
      distance,
      startSpeed,
      peakSpeed: upper,
      endSpeed,
      accelerationShare,
      cruiseShare,
      decelerationShare,
    });
  }

  if (upperDuration > targetDuration) {
    return upper;
  }

  for (let i = 0; i < 24; i += 1) {
    const middle = (lower + upper) / 2;
    const middleDuration = getProfileDurationForPeakSpeed({
      distance,
      startSpeed,
      peakSpeed: middle,
      endSpeed,
      accelerationShare,
      cruiseShare,
      decelerationShare,
    });

    if (middleDuration > targetDuration) {
      lower = middle;
    } else {
      upper = middle;
    }
  }

  return upper;
};

const addProfileZone = (
  zones: VelocityProfileZone[],
  {
    distanceProgress,
    share,
    startSpeed,
    endSpeed,
    distance,
  }: {
    distanceProgress: number;
    share: number;
    startSpeed: number;
    endSpeed: number;
    distance: number;
  },
) => {
  if (share <= 0) {
    return distanceProgress;
  }

  const startTime =
    zones.length > 0
      ? zones[zones.length - 1]!.startTime + zones[zones.length - 1]!.duration
      : 0;
  const duration = getZoneDuration(distance * share, startSpeed, endSpeed);

  zones.push({
    startDistanceProgress: distanceProgress,
    endDistanceProgress: distanceProgress + share,
    startTime,
    duration,
    startSpeed,
    endSpeed,
  });

  return distanceProgress + share;
};

const createVelocityProfile = ({
  distance,
  startSpeed,
  peakSpeed,
  endSpeed,
  startAcceleration,
  endDeceleration,
  targetDuration,
  maxPeakSpeed,
}: {
  distance: number;
  startSpeed: number;
  peakSpeed: number;
  endSpeed: number;
  startAcceleration: number;
  endDeceleration: number;
  targetDuration?: number;
  maxPeakSpeed?: number;
}): VelocityProfile => {
  const safeDistance = Math.abs(distance);
  const safeStartSpeed = Math.max(0, startSpeed);
  const safePeakSpeed = Math.max(0.000001, peakSpeed);
  const safeEndSpeed = Math.max(0, endSpeed);
  const {
    accelerationShare,
    cruiseShare,
    decelerationShare,
  } = getProfileShares(startAcceleration, endDeceleration);
  const durationBoundPeakSpeed =
    typeof targetDuration === "number" && targetDuration > 0
      ? solvePeakSpeedForDuration({
          distance: safeDistance,
          targetDuration,
          startSpeed: safeStartSpeed,
          peakSpeed: safePeakSpeed,
          endSpeed: safeEndSpeed,
          accelerationShare,
          cruiseShare,
          decelerationShare,
        })
      : safePeakSpeed;
  const uncappedPeakSpeed = Math.max(
    safePeakSpeed,
    safeStartSpeed,
    safeEndSpeed,
    durationBoundPeakSpeed,
  );
  const resolvedPeakSpeed =
    typeof maxPeakSpeed === "number" && maxPeakSpeed > 0
      ? Math.max(
          safeStartSpeed,
          safeEndSpeed,
          Math.min(uncappedPeakSpeed, maxPeakSpeed),
        )
      : uncappedPeakSpeed;
  const zones: VelocityProfileZone[] = [];
  let distanceProgress = 0;

  distanceProgress = addProfileZone(zones, {
    distanceProgress,
    share: accelerationShare,
    startSpeed: safeStartSpeed,
    endSpeed: resolvedPeakSpeed,
    distance: safeDistance,
  });
  distanceProgress = addProfileZone(zones, {
    distanceProgress,
    share: cruiseShare,
    startSpeed: resolvedPeakSpeed,
    endSpeed: resolvedPeakSpeed,
    distance: safeDistance,
  });
  addProfileZone(zones, {
    distanceProgress,
    share: decelerationShare,
    startSpeed: resolvedPeakSpeed,
    endSpeed: safeEndSpeed,
    distance: safeDistance,
  });

  const duration =
    zones.length > 0
      ? zones[zones.length - 1]!.startTime + zones[zones.length - 1]!.duration
      : 0;

  return {
    duration,
    zones,
  };
};

const getProfileZoneDistanceProgress = (
  zone: VelocityProfileZone,
  localProgress: number,
  distance: number,
) => {
  if (!(distance > 0) || !(zone.duration > 0)) {
    return zone.endDistanceProgress;
  }

  const localDistance =
    zone.duration *
    (zone.startSpeed * localProgress +
      (zone.endSpeed - zone.startSpeed) *
        smoothstepIntegral(localProgress));

  return clamp(
    zone.startDistanceProgress + localDistance / distance,
    zone.startDistanceProgress,
    zone.endDistanceProgress,
  );
};

const sampleVelocityProfile = (
  profile: VelocityProfile,
  elapsed: number,
  distance: number,
) => {
  if (profile.zones.length === 0 || !(profile.duration > 0)) {
    return {
      distanceProgress: 1,
      speed: 0,
    };
  }

  const time = clamp(elapsed, 0, profile.duration);
  const zone =
    profile.zones.find(
      (candidate) =>
        time <= candidate.startTime + candidate.duration,
    ) ?? profile.zones[profile.zones.length - 1]!;
  const localProgress =
    zone.duration > 0
      ? clamp((time - zone.startTime) / zone.duration, 0, 1)
      : 1;

  return {
    distanceProgress: getProfileZoneDistanceProgress(
      zone,
      localProgress,
      distance,
    ),
    speed: lerp(zone.startSpeed, zone.endSpeed, smoothstep(localProgress)),
  };
};

const getSameDirectionSpeed = (velocity: number, distance: number) => {
  const direction = Math.sign(distance);

  if (
    direction === 0 ||
    !Number.isFinite(velocity) ||
    Math.sign(velocity) !== direction
  ) {
    return 0;
  }

  return Math.abs(velocity);
};

const getAverageSpeed = (distance: number, duration: number) => {
  if (!(duration > 0)) {
    return 0;
  }

  return Math.abs(distance) / duration;
};

const getSignedVelocity = (speed: number, distance: number) =>
  Math.sign(distance) * Math.max(0, speed);

const getNormalMoveSpeed = (stepSize: number, stepDuration: number) => {
  if (!(stepSize > 0) || !(stepDuration > 0)) {
    return 0;
  }

  return stepSize / stepDuration;
};

const createProfileSegment = ({
  strategy,
  from,
  to,
  startedAt,
  currentVelocity,
  peakVelocity,
  endVelocity,
  startAcceleration,
  endDeceleration,
  targetDuration,
  maxPeakVelocity,
}: {
  strategy: ProfileMotionSegment["strategy"];
  from: number;
  to: number;
  startedAt: number;
  currentVelocity: number;
  peakVelocity: number;
  endVelocity: number;
  startAcceleration: number;
  endDeceleration: number;
  targetDuration?: number;
  maxPeakVelocity?: number;
}): ProfileMotionSegment => {
  const distance = to - from;
  const startSpeed = getSameDirectionSpeed(currentVelocity, distance);
  const peakSpeed = Math.max(
    getSameDirectionSpeed(peakVelocity, distance),
    startSpeed,
    getSameDirectionSpeed(endVelocity, distance),
    MIN_PROFILE_SPEED,
  );
  const profile = createVelocityProfile({
    distance,
    startSpeed,
    peakSpeed,
    endSpeed: getSameDirectionSpeed(endVelocity, distance),
    startAcceleration,
    endDeceleration,
    targetDuration,
    maxPeakSpeed:
      typeof maxPeakVelocity === "number"
        ? getSameDirectionSpeed(maxPeakVelocity, distance)
        : undefined,
  });

  return {
    strategy,
    from,
    to,
    duration: profile.duration,
    startedAt,
    profile,
  };
};

const sampleSegment = (segment: MotionSegment, now: number): MotionSample => {
  const elapsed = Math.max(0, now - segment.startedAt);
  const progress =
    segment.duration > 0 ? Math.min(1, elapsed / segment.duration) : 1;
  const distance = segment.to - segment.from;

  if (progress >= 1) {
    if (segment.strategy === "easing") {
      const { slope } = sampleBezier(segment.easing, 1);

      return {
        progress,
        position: segment.to,
        velocity: (distance / segment.duration) * slope,
        target: segment.to,
        strategy: segment.strategy,
      };
    }

    const sampledProfile = sampleVelocityProfile(
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

  if (segment.strategy === "easing") {
    const eased = sampleBezier(segment.easing, progress);

    return {
      progress,
      position: segment.from + distance * eased.progress,
      velocity: (distance / segment.duration) * eased.slope,
      target: segment.to,
      strategy: segment.strategy,
    };
  }

  const sampledProfile = sampleVelocityProfile(
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
  dragSpeedConfig,
  isMoving,
  animMode,
  reason,
  duration,
  gestureReleaseVelocity,
  gestureReleaseMotionVelocity,
  isRepeatedClickAdvance,
  followUpVirtualIndex,
  followUpDuration,
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
      gestureReleaseVelocity,
      gestureReleaseMotionVelocity,
      startVirtualIndex,
      currentVirtualIndex,
      isRepeatedClickAdvance,
      followUpVirtualIndex,
      followUpDuration,
      stepDuration,
      repeatedClickSettings.speedMultiplier,
      repeatedClickSettings.startAcceleration,
      repeatedClickSettings.endDeceleration,
      dragSpeedConfig.releaseAccelerationDistanceShare,
      dragSpeedConfig.releaseDecelerationDistanceShare,
      dragSpeedConfig.inertiaBoost,
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
              velocity: gestureReleaseMotionVelocity,
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
      getAverageSpeed(distance, duration);
    const normalVelocity = getSignedVelocity(normalMoveSpeed, distance);
    const repeatedVelocity = getSignedVelocity(
      normalMoveSpeed * repeatedClickSettings.speedMultiplier,
      distance,
    );
    const gestureIntentSpeed = getSameDirectionSpeed(
      gestureReleaseVelocity,
      distance,
    );
    const gesturePeakSpeed = Math.max(
      normalMoveSpeed,
      gestureIntentSpeed,
      getSameDirectionSpeed(gestureReleaseMotionVelocity, distance),
    );
    const gesturePeakVelocity = getSignedVelocity(gesturePeakSpeed, distance);
    const maxGestureVelocity = getSignedVelocity(
      normalMoveSpeed * dragSpeedConfig.inertiaBoost,
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
        startAcceleration: repeatedClickSettings.startAcceleration,
        endDeceleration: repeatedClickSettings.endDeceleration,
      });
    } else if (
      reason === "gesture" &&
      animMode !== "snap"
    ) {
      activeSegmentRef.current = createProfileSegment({
        strategy: "gesture",
        from: nowState.position,
        to: currentVirtualIndex,
        startedAt,
        currentVelocity: gestureReleaseMotionVelocity,
        peakVelocity: gesturePeakVelocity,
        endVelocity: 0,
        startAcceleration: dragSpeedConfig.releaseAccelerationDistanceShare,
        endDeceleration: dragSpeedConfig.releaseDecelerationDistanceShare,
        targetDuration: duration,
        maxPeakVelocity: maxGestureVelocity,
      });
    } else if (isRepeatedFollowUp) {
      activeSegmentRef.current = createProfileSegment({
        strategy: "repeated-follow-up",
        from: nowState.position,
        to: currentVirtualIndex,
        startedAt,
        currentVelocity: nowState.velocity,
        peakVelocity: normalVelocity,
        endVelocity: 0,
        startAcceleration: 0,
        endDeceleration: repeatedClickSettings.endDeceleration,
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
        startAcceleration: 0,
        endDeceleration: 1,
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
    followUpDuration,
    followUpVirtualIndex,
    dragSpeedConfig.inertiaBoost,
    dragSpeedConfig.releaseAccelerationDistanceShare,
    dragSpeedConfig.releaseDecelerationDistanceShare,
    gestureReleaseMotionVelocity,
    gestureReleaseVelocity,
    hasFollowUpStep,
    isRepeatedClickAdvance,
    isMoving,
    readCurrentState,
    reason,
    repeatedClickSettings.endDeceleration,
    repeatedClickSettings.speedMultiplier,
    repeatedClickSettings.startAcceleration,
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
