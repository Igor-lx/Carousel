import { useCallback, useEffect, useRef } from "react";

import {
  JUMP_BEZIER,
  MOVE_AUTO_BEZIER,
  MOVE_CLICK_BEZIER,
  MOVE_SWIPE_BEZIER,
  REPEATED_CLICK_ADVANCE_BEZIER,
  SNAP_BACK_BEZIER,
} from "../model/config";
import type { AnimationMode, MoveReason } from "../model/reducer";
import { getCarouselTransform } from "../utilities";
import { useIsomorphicLayoutEffect } from "../../shared";

interface MotionProps {
  trackRef: React.RefObject<HTMLDivElement | null>;
  currentPositionRef: React.MutableRefObject<number>;
  enabled: boolean;
  startVirtualIndex: number;
  currentVirtualIndex: number;
  windowStart: number;
  size: number;
  isMoving: boolean;
  animMode: AnimationMode;
  reason: MoveReason;
  duration: number;
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

const EPSILON = 0.0001;
const MAX_MONOTONIC_SPEED_FACTOR = 3;

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

  const match = /cubic-bezier\(\s*([+-]?\d*\.?\d+)\s*,\s*([+-]?\d*\.?\d+)/i.exec(
    bezier,
  );

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
) => {
  if (!Number.isFinite(velocity) || !Number.isFinite(distance) || duration <= 0) {
    return 0;
  }

  if (Math.abs(distance) < EPSILON) {
    return 0;
  }

  const direction = Math.sign(distance);
  if (direction === 0 || Math.sign(velocity) !== direction) {
    return 0;
  }

  const maxVelocity =
    (Math.abs(distance) / duration) * MAX_MONOTONIC_SPEED_FACTOR;

  return direction * Math.min(Math.abs(velocity), maxVelocity);
};

const getInitialVelocity = (
  currentVelocity: number,
  distance: number,
  duration: number,
  animMode: AnimationMode,
  reason: MoveReason,
  remainingDuration: number | null = null,
  bezier = getBezier(animMode, reason),
) => {
  const carriedVelocity = clampRetargetVelocity(
    currentVelocity,
    distance,
    duration,
  );

  if (remainingDuration !== null && remainingDuration > EPSILON) {
    const timeCompressionVelocity = clampRetargetVelocity(
      currentVelocity * (remainingDuration / duration),
      distance,
      duration,
    );

    if (Math.abs(timeCompressionVelocity) > EPSILON) {
      return timeCompressionVelocity;
    }
  }

  const slope = getBezierStartSlope(bezier);
  const desiredVelocity = clampRetargetVelocity(
    (distance / duration) * slope,
    distance,
    duration,
  );

  if (Math.abs(carriedVelocity) > EPSILON) {
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
  remainingDuration,
}: {
  currentVelocity: number;
  distance: number;
  duration: number;
  animMode: AnimationMode;
  reason: MoveReason;
  isRepeatedClickAdvance: boolean;
  remainingDuration: number | null;
}) => {
  if (isRepeatedClickAdvance) {
    return getDesiredVelocity(
      distance,
      duration,
      animMode,
      reason,
      REPEATED_CLICK_ADVANCE_BEZIER,
    );
  }

  return getInitialVelocity(
    currentVelocity,
    distance,
    duration,
    animMode,
    reason,
    remainingDuration,
  );
};

const getDesiredVelocity = (
  distance: number,
  duration: number,
  animMode: AnimationMode,
  reason: MoveReason,
  bezier = getBezier(animMode, reason),
) => {
  const slope = getBezierStartSlope(bezier);

  return clampRetargetVelocity(
    (distance / duration) * slope,
    distance,
    duration,
  );
};

const getJoinVelocity = ({
  distance,
  duration,
  initialVelocity,
  followUpDistance,
  followUpDuration,
  followUpTerminalVelocity,
}: {
  distance: number;
  duration: number;
  initialVelocity: number;
  followUpDistance: number;
  followUpDuration: number;
  followUpTerminalVelocity: number;
}) => {
  if (duration <= EPSILON || followUpDuration <= EPSILON) {
    return 0;
  }

  const direction = Math.sign(distance);

  if (
    direction === 0 ||
    Math.sign(followUpDistance) !== direction ||
    Math.abs(distance) < EPSILON ||
    Math.abs(followUpDistance) < EPSILON
  ) {
    return 0;
  }

  const safeInitialVelocity = clampRetargetVelocity(
    initialVelocity,
    distance,
    duration,
  );
  const safeFollowUpTerminalVelocity = clampRetargetVelocity(
    followUpTerminalVelocity,
    followUpDistance,
    followUpDuration,
  );
  const denominator = 4 * (1 / duration + 1 / followUpDuration);

  if (!Number.isFinite(denominator) || denominator <= EPSILON) {
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
  );

  return clampRetargetVelocity(
    clampedForCurrent,
    followUpDistance,
    followUpDuration,
  );
};

const getTerminalVelocity = ({
  distance,
  duration,
  initialVelocity,
  followUpVirtualIndex,
  followUpDuration,
  currentVirtualIndex,
}: {
  distance: number;
  duration: number;
  initialVelocity: number;
  followUpVirtualIndex: number | null;
  followUpDuration: number;
  currentVirtualIndex: number;
}) => {
  if (
    followUpVirtualIndex === null ||
    followUpDuration <= EPSILON ||
    duration <= EPSILON
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
  enabled,
  startVirtualIndex,
  currentVirtualIndex,
  windowStart,
  size,
  isMoving,
  animMode,
  reason,
  duration,
  isRepeatedClickAdvance,
  followUpVirtualIndex,
  followUpDuration,
  onComplete,
}: MotionProps): void {
  const hasFollowUpStep = followUpVirtualIndex !== null;
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

      const relativeIndex = position - windowStart;
      track.style.transform = `${getCarouselTransform(relativeIndex, size)} translateX(0px)`;
      track.style.transition = "none";
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

  const readCurrentState = useCallback(() => {
    const segment = activeSegmentRef.current;
    if (!segment) {
      return {
        position: currentPositionRef.current,
        velocity: velocityRef.current,
        progress: 1,
      };
    }

    const sampled = sampleSegment(segment, performance.now());
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
  }, [currentPositionRef]);

  const finalizeMotion = useCallback((
    handoffToFollowUp: boolean,
    handoffSnapshot?: HandoffSnapshot,
  ) => {
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
  }, [
    applyPosition,
    cancelAnimation,
    cancelCompletion,
    currentVirtualIndex,
    onComplete,
  ]);

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
    const planKey =
      `${enabled}:${isMoving}:${animMode}:${reason}:${duration}:${startVirtualIndex}:${currentVirtualIndex}:${isRepeatedClickAdvance}:${followUpVirtualIndex}:${followUpDuration}`;
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
      Math.abs(handoffSnapshot.position - startVirtualIndex) < EPSILON;
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
              position: startVirtualIndex,
              velocity: 0,
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
      Math.abs(previousTarget - currentVirtualIndex) < EPSILON;

    if (Math.abs(distance) < EPSILON) {
      finalizeMotion(hasFollowUpStep);
      return;
    }

    const initialVelocity = resolveInitialVelocity({
      currentVelocity: nowState.velocity,
      distance,
      duration,
      animMode,
      reason,
      isRepeatedClickAdvance,
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
    duration,
    enabled,
    finalizeMotion,
    followUpDuration,
    followUpVirtualIndex,
    isRepeatedClickAdvance,
    isMoving,
    currentPositionRef,
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
