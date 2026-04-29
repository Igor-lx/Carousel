import { getSameDirectionSpeed } from "../motion-speed";
import { createMotionProfile } from "./math";
import type { MotionProfile } from "./types";

const MIN_PROFILE_SPEED = 0.000001;

export interface ProfileSegmentInput<Strategy extends string> {
  strategy: Strategy;
  from: number;
  to: number;
  startedAt: number;
  currentVelocity: number;
  peakVelocity: number;
  endVelocity: number;
  accelerationDistanceShare: number;
  decelerationDistanceShare: number;
  targetDuration?: number;
}

export interface ProfileSegment<Strategy extends string> {
  strategy: Strategy;
  from: number;
  to: number;
  duration: number;
  startedAt: number;
  profile: MotionProfile;
}

export const createProfileSegment = <Strategy extends string>({
  strategy,
  from,
  to,
  startedAt,
  currentVelocity,
  peakVelocity,
  endVelocity,
  accelerationDistanceShare,
  decelerationDistanceShare,
  targetDuration,
}: ProfileSegmentInput<Strategy>): ProfileSegment<Strategy> => {
  const distance = to - from;
  const startSpeed = getSameDirectionSpeed(currentVelocity, distance);
  const peakSpeed = Math.max(
    getSameDirectionSpeed(peakVelocity, distance),
    startSpeed,
    getSameDirectionSpeed(endVelocity, distance),
    MIN_PROFILE_SPEED,
  );
  const profile = createMotionProfile({
    distance,
    startSpeed,
    peakSpeed,
    endSpeed: getSameDirectionSpeed(endVelocity, distance),
    accelerationDistanceShare,
    decelerationDistanceShare,
    targetDuration,
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
