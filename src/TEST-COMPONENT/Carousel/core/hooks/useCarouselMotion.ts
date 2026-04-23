import { useCallback, useEffect, useRef } from "react";

import {
  JUMP_BEZIER,
  MOVE_AUTO_BEZIER,
  MOVE_CLICK_BEZIER,
  MOVE_SWIPE_BEZIER,
  REPEATED_CLICK_BEZIER,
  SNAP_BACK_BEZIER,
} from "../model/config";
import type { CarouselMotionSettings } from "../model/diagnostic";
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
  motionSettings: CarouselMotionSettings;
  isMoving: boolean;
  animMode: AnimationMode;
  reason: MoveReason;
  duration: number;
  gestureReleaseVelocity: number;
  isRepeatedClickAdvance: boolean;
  followUpVirtualIndex: number | null;
  followUpDuration: number;
  onComplete: () => void;
}

type MotionSegment = {
  from: number;
  to: number;
  duration: number;
  startedAt: number;
  initialVelocity: number;
  terminalVelocity: number;
};

type HandoffSnapshot = {
  position: number;
  velocity: number;
  timestamp: number;
};

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

const getBezierStartSlope = (bezier: string) => {
  if (bezier.trim().toLowerCase() === "linear") {
    return 1;
  }

  const match =
    /cubic-bezier\(\s*([+-]?\d*\.?\d+)\s*,\s*([+-]?\d*\.?\d+)/i.exec(bezier);

  if (!match) return 0;

  const x1 = Number.parseFloat(match[1] ?? "");
  const y1 = Number.parseFloat(match[2] ?? "");

  if (!(x1 > 0) || !Number.isFinite(y1)) {
    return 0;
  }

  return y1 / x1;
};

const clampRetargetVelocity = (
  velocity: number,
  distance: number,
  duration: number,
  monotonicSpeedFactor: number,
  epsilon: number,
) => {
  if (
    !Number.isFinite(velocity) ||
    !Number.isFinite(distance) ||
    duration <= 0
  ) {
    return 0;
  }

  if (Math.abs(distance) < epsilon) {
    return 0;
  }

  const direction = Math.sign(distance);
  if (direction === 0 || Math.sign(velocity) !== direction) {
    return 0;
  }

  const maxVelocity = (Math.abs(distance) / duration) * monotonicSpeedFactor;

  return direction * Math.min(Math.abs(velocity), maxVelocity);
};

const getInitialVelocity = (
  currentVelocity: number,
  distance: number,
  duration: number,
  animMode: AnimationMode,
  reason: MoveReason,
  monotonicSpeedFactor: number,
  epsilon: number,
  remainingDuration: number | null = null,
  bezier = getBezier(animMode, reason),
) => {
  const carriedVelocity = clampRetargetVelocity(
    currentVelocity,
    distance,
    duration,
    monotonicSpeedFactor,
    epsilon,
  );

  if (remainingDuration !== null && remainingDuration > epsilon) {
    const timeCompressionVelocity = clampRetargetVelocity(
      currentVelocity * (remainingDuration / duration),
      distance,
      duration,
      monotonicSpeedFactor,
      epsilon,
    );

    if (Math.abs(timeCompressionVelocity) > epsilon) {
      return timeCompressionVelocity;
    }
  }

  const slope = getBezierStartSlope(bezier);
  const desiredVelocity = clampRetargetVelocity(
    (distance / duration) * slope,
    distance,
    duration,
    monotonicSpeedFactor,
    epsilon,
  );

  if (Math.abs(carriedVelocity) > epsilon) {
    return carriedVelocity;
  }

  return desiredVelocity;
};

const resolveInitialVelocity = ({
  currentVelocity,
  distance,
  duration,
  animMode,
  reason,
  isRepeatedClickAdvance,
  monotonicSpeedFactor,
  epsilon,
  remainingDuration,
}: {
  currentVelocity: number;
  distance: number;
  duration: number;
  animMode: AnimationMode;
  reason: MoveReason;
  isRepeatedClickAdvance: boolean;
  monotonicSpeedFactor: number;
  epsilon: number;
  remainingDuration: number | null;
}) => {
  if (isRepeatedClickAdvance) {
    return getDesiredVelocity(
      distance,
      duration,
      animMode,
      reason,
      monotonicSpeedFactor,
      epsilon,
      REPEATED_CLICK_BEZIER,
    );
  }

  return getInitialVelocity(
    currentVelocity,
    distance,
    duration,
    animMode,
    reason,
    monotonicSpeedFactor,
    epsilon,
    remainingDuration,
  );
};

const getDesiredVelocity = (
  distance: number,
  duration: number,
  animMode: AnimationMode,
  reason: MoveReason,
  monotonicSpeedFactor: number,
  epsilon: number,
  bezier = getBezier(animMode, reason),
) => {
  const slope = getBezierStartSlope(bezier);

  return clampRetargetVelocity(
    (distance / duration) * slope,
    distance,
    duration,
    monotonicSpeedFactor,
    epsilon,
  );
};

const getJoinVelocity = ({
  distance,
  duration,
  initialVelocity,
  followUpDistance,
  followUpDuration,
  followUpTerminalVelocity,
  monotonicSpeedFactor,
  epsilon,
}: {
  distance: number;
  duration: number;
  initialVelocity: number;
  followUpDistance: number;
  followUpDuration: number;
  followUpTerminalVelocity: number;
  monotonicSpeedFactor: number;
  epsilon: number;
}) => {
  if (duration <= epsilon || followUpDuration <= epsilon) {
    return 0;
  }

  const direction = Math.sign(distance);

  if (
    direction === 0 ||
    Math.sign(followUpDistance) !== direction ||
    Math.abs(distance) < epsilon ||
    Math.abs(followUpDistance) < epsilon
  ) {
    return 0;
  }

  const safeInitialVelocity = clampRetargetVelocity(
    initialVelocity,
    distance,
    duration,
    monotonicSpeedFactor,
    epsilon,
  );
  const safeFollowUpTerminalVelocity = clampRetargetVelocity(
    followUpTerminalVelocity,
    followUpDistance,
    followUpDuration,
    monotonicSpeedFactor,
    epsilon,
  );
  const denominator = 4 * (1 / duration + 1 / followUpDuration);

  if (!Number.isFinite(denominator) || denominator <= epsilon) {
    return 0;
  }

  const rawJoinVelocity =
    ((6 * distance) / (duration * duration) -
      (2 * safeInitialVelocity) / duration +
      (6 * followUpDistance) / (followUpDuration * followUpDuration) -
      (2 * safeFollowUpTerminalVelocity) / followUpDuration) /
    denominator;

  const clampedForCurrent = clampRetargetVelocity(
    rawJoinVelocity,
    distance,
    duration,
    monotonicSpeedFactor,
    epsilon,
  );

  return clampRetargetVelocity(
    clampedForCurrent,
    followUpDistance,
    followUpDuration,
    monotonicSpeedFactor,
    epsilon,
  );
};

const getTerminalVelocity = ({
  distance,
  duration,
  initialVelocity,
  followUpVirtualIndex,
  followUpDuration,
  currentVirtualIndex,
  monotonicSpeedFactor,
  epsilon,
}: {
  distance: number;
  duration: number;
  initialVelocity: number;
  followUpVirtualIndex: number | null;
  followUpDuration: number;
  currentVirtualIndex: number;
  monotonicSpeedFactor: number;
  epsilon: number;
}) => {
  if (
    followUpVirtualIndex === null ||
    followUpDuration <= epsilon ||
    duration <= epsilon
  ) {
    return 0;
  }

  const followUpDistance = followUpVirtualIndex - currentVirtualIndex;

  return getJoinVelocity({
    distance,
    duration,
    initialVelocity,
    followUpDistance,
    followUpDuration,
    followUpTerminalVelocity: 0,
    monotonicSpeedFactor,
    epsilon,
  });
};

const sampleSegment = (segment: MotionSegment, now: number) => {
  const elapsed = Math.max(0, now - segment.startedAt);
  const progress =
    segment.duration > 0 ? Math.min(1, elapsed / segment.duration) : 1;

  if (progress >= 1) {
    return {
      progress,
      position: segment.to,
      velocity: segment.terminalVelocity,
    };
  }

  const u = progress;
  const invDuration = segment.duration > 0 ? 1 / segment.duration : 0;
  const h00 = 2 * u * u * u - 3 * u * u + 1;
  const h10 = u * u * u - 2 * u * u + u;
  const h01 = -2 * u * u * u + 3 * u * u;
  const h11 = u * u * u - u * u;
  const h00Prime = (6 * u * u - 6 * u) * invDuration;
  const h10Prime = 3 * u * u - 4 * u + 1;
  const h01Prime = (-6 * u * u + 6 * u) * invDuration;
  const h11Prime = 3 * u * u - 2 * u;

  const position =
    h00 * segment.from +
    h10 * segment.duration * segment.initialVelocity +
    h01 * segment.to +
    h11 * segment.duration * segment.terminalVelocity;

  const velocity =
    h00Prime * segment.from +
    h10Prime * segment.initialVelocity +
    h01Prime * segment.to +
    h11Prime * segment.terminalVelocity;

  return {
    progress,
    position,
    velocity,
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
  motionSettings,
  isMoving,
  animMode,
  reason,
  duration,
  gestureReleaseVelocity,
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
          position: currentPositionRef.current,
          velocity: velocityRef.current,
          progress: 1,
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

    return {
      position: currentPositionRef.current,
      velocity: velocityRef.current,
      progress: sampled.progress,
    };
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
        const nextSnapshot = handoffSnapshot ?? {
          position: currentVirtualIndex,
          velocity: segment ? segment.terminalVelocity : velocityRef.current,
          timestamp: performance.now(),
        };
        handoffSnapshotRef.current = nextSnapshot;
        velocityRef.current = nextSnapshot.velocity;
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
        });
        return;
      }

      frameRef.current = window.requestAnimationFrame(step);
    };

    frameRef.current = window.requestAnimationFrame(step);
  }, [applyPosition, cancelAnimation, finalizeMotion, hasFollowUpStep]);

  useIsomorphicLayoutEffect(() => {
    const planKey = `${enabled}:${isMoving}:${animMode}:${reason}:${duration}:${gestureReleaseVelocity}:${startVirtualIndex}:${currentVirtualIndex}:${isRepeatedClickAdvance}:${followUpVirtualIndex}:${followUpDuration}:${motionSettings.monotonicSpeedFactor}:${epsilon}`;
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
    const previousTarget = previousSegment?.to;
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
            position: handoffSnapshot.position,
            velocity: handoffSnapshot.velocity,
            progress: 0,
          }
        : reason === "gesture"
          ? {
              position: currentPositionRef.current,
              velocity: gestureReleaseVelocity,
              progress: 0,
            }
          : {
              position: currentPositionRef.current,
              velocity: velocityRef.current,
              progress: 0,
            };
    const previousRemainingDuration =
      previousSegment && reason === "click"
        ? Math.max(0, previousSegment.duration * (1 - nowState.progress))
        : null;
    const distance = currentVirtualIndex - nowState.position;
    const isSameTargetClickRetarget =
      !isRepeatedClickAdvance &&
      reason === "click" &&
      previousTarget !== undefined &&
      Math.abs(previousTarget - currentVirtualIndex) < epsilon;

    if (Math.abs(distance) < epsilon) {
      finalizeMotion(hasFollowUpStep);
      return;
    }

    const initialVelocity = resolveInitialVelocity({
      currentVelocity:
        reason === "gesture" ? gestureReleaseVelocity : nowState.velocity,
      distance,
      duration,
      animMode,
      reason,
      isRepeatedClickAdvance,
      monotonicSpeedFactor: motionSettings.monotonicSpeedFactor,
      epsilon,
      remainingDuration: isSameTargetClickRetarget
        ? previousRemainingDuration
        : null,
    });
    const terminalVelocity = getTerminalVelocity({
      distance,
      duration,
      initialVelocity,
      followUpVirtualIndex,
      followUpDuration,
      currentVirtualIndex,
      monotonicSpeedFactor: motionSettings.monotonicSpeedFactor,
      epsilon,
    });

    activeSegmentRef.current = {
      from: nowState.position,
      to: currentVirtualIndex,
      duration,
      startedAt: canReuseHandoffSnapshot ? handoffSnapshot.timestamp : now,
      initialVelocity,
      terminalVelocity,
    };

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
    gestureReleaseVelocity,
    isRepeatedClickAdvance,
    isMoving,
    motionSettings.monotonicSpeedFactor,
    readCurrentState,
    reason,
    startVirtualIndex,
  ]);

  useEffect(
    () => () => {
      cancelAnimation();
      cancelCompletion();
    },
    [cancelAnimation, cancelCompletion],
  );
}
