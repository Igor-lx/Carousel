import { useCallback, useEffect, useRef } from "react";

import {
  JUMP_BEZIER,
  MOVE_AUTO_BEZIER,
  MOVE_CLICK_BEZIER,
  MOVE_SWIPE_BEZIER,
  SNAP_BACK_BEZIER,
} from "../model/constants";
import type { AnimationMode, MoveReason } from "../model/reducer";
import { getCarouselTransform } from "../utilities";
import { useIsomorphicLayoutEffect } from "../../shared";

interface MotionProps {
  trackRef: React.RefObject<HTMLDivElement | null>;
  enabled: boolean;
  startVirtualIndex: number;
  currentVirtualIndex: number;
  windowStart: number;
  size: number;
  isMoving: boolean;
  animMode: AnimationMode;
  reason: MoveReason;
  duration: number;
  onComplete: () => void;
}

interface MotionResult {
  getCurrentVirtualIndex: () => number;
}

type MotionSegment = {
  from: number;
  to: number;
  duration: number;
  startedAt: number;
  initialVelocity: number;
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
) => {
  const carriedVelocity = clampRetargetVelocity(
    currentVelocity,
    distance,
    duration,
  );

  if (Math.abs(carriedVelocity) > EPSILON) {
    return carriedVelocity;
  }

  const slope = getBezierStartSlope(getBezier(animMode, reason));

  return clampRetargetVelocity(
    (distance / duration) * slope,
    distance,
    duration,
  );
};

const sampleSegment = (segment: MotionSegment, now: number) => {
  const elapsed = Math.max(0, now - segment.startedAt);
  const progress =
    segment.duration > 0 ? Math.min(1, elapsed / segment.duration) : 1;

  if (progress >= 1) {
    return {
      progress,
      position: segment.to,
      velocity: 0,
    };
  }

  const u = progress;
  const invDuration = segment.duration > 0 ? 1 / segment.duration : 0;
  const h00 = 2 * u * u * u - 3 * u * u + 1;
  const h10 = u * u * u - 2 * u * u + u;
  const h01 = -2 * u * u * u + 3 * u * u;
  const h00Prime = (6 * u * u - 6 * u) * invDuration;
  const h10Prime = 3 * u * u - 4 * u + 1;
  const h01Prime = (-6 * u * u + 6 * u) * invDuration;

  const position =
    h00 * segment.from +
    h10 * segment.duration * segment.initialVelocity +
    h01 * segment.to;

  const velocity =
    h00Prime * segment.from +
    h10Prime * segment.initialVelocity +
    h01Prime * segment.to;

  return {
    progress,
    position,
    velocity,
  };
};

export function useCarouselMotion({
  trackRef,
  enabled,
  startVirtualIndex,
  currentVirtualIndex,
  windowStart,
  size,
  isMoving,
  animMode,
  reason,
  duration,
  onComplete,
}: MotionProps): MotionResult {
  const frameRef = useRef<number | null>(null);
  const completionFrameRef = useRef<number | null>(null);
  const activeSegmentRef = useRef<MotionSegment | null>(null);
  const positionRef = useRef(startVirtualIndex);
  const velocityRef = useRef(0);
  const lastPlanRef = useRef<string>("");

  const applyPosition = useCallback(
    (position: number) => {
      positionRef.current = position;

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
        position: positionRef.current,
        velocity: velocityRef.current,
      };
    }

    const sampled = sampleSegment(segment, performance.now());
    positionRef.current = sampled.position;
    velocityRef.current = sampled.velocity;

    if (sampled.progress >= 1) {
      activeSegmentRef.current = null;
    }

    return {
      position: positionRef.current,
      velocity: velocityRef.current,
    };
  }, []);

  const finalizeMotion = useCallback(() => {
    cancelAnimation();
    activeSegmentRef.current = null;
    velocityRef.current = 0;
    applyPosition(currentVirtualIndex);
    cancelCompletion();
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

    const step = () => {
      const segment = activeSegmentRef.current;
      if (!segment) {
        frameRef.current = null;
        return;
      }

      const sampled = sampleSegment(segment, performance.now());
      velocityRef.current = sampled.velocity;
      applyPosition(sampled.position);

      if (sampled.progress >= 1) {
        frameRef.current = null;
        finalizeMotion();
        return;
      }

      frameRef.current = window.requestAnimationFrame(step);
    };

    frameRef.current = window.requestAnimationFrame(step);
  }, [applyPosition, cancelAnimation, finalizeMotion]);

  useIsomorphicLayoutEffect(() => {
    const planKey =
      `${enabled}:${isMoving}:${animMode}:${reason}:${duration}:${startVirtualIndex}:${currentVirtualIndex}`;
    if (lastPlanRef.current === planKey) {
      if (!isMoving) {
        applyPosition(positionRef.current);
      }
      return;
    }

    lastPlanRef.current = planKey;
    cancelCompletion();

    if (!enabled) {
      cancelAnimation();
      activeSegmentRef.current = null;
      velocityRef.current = 0;
      applyPosition(currentVirtualIndex);
      return;
    }

    if (!isMoving) {
      cancelAnimation();
      activeSegmentRef.current = null;
      velocityRef.current = 0;
      applyPosition(currentVirtualIndex);
      return;
    }

    if (animMode === "instant" || duration <= 0) {
      finalizeMotion();
      return;
    }

    const nowState = activeSegmentRef.current
      ? readCurrentState()
      : {
          position: startVirtualIndex,
          velocity: 0,
        };
    const distance = currentVirtualIndex - nowState.position;

    if (Math.abs(distance) < EPSILON) {
      finalizeMotion();
      return;
    }

    activeSegmentRef.current = {
      from: nowState.position,
      to: currentVirtualIndex,
      duration,
      startedAt: performance.now(),
      initialVelocity: getInitialVelocity(
        nowState.velocity,
        distance,
        duration,
        animMode,
        reason,
      ),
    };

    applyPosition(nowState.position);
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
    isMoving,
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

  return {
    getCurrentVirtualIndex: () => readCurrentState().position,
  };
}
