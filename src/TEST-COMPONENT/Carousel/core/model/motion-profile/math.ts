import type {
  MotionProfile,
  MotionProfileInput,
  MotionProfileZone,
} from "./types";

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const smoothstep = (progress: number) =>
  progress * progress * (3 - 2 * progress);

const smoothstepIntegral = (progress: number) =>
  progress * progress * progress - 0.5 * progress * progress * progress * progress;

const lerp = (from: number, to: number, progress: number) =>
  from + (to - from) * progress;

const normalizeProfileShare = (value: number) =>
  Number.isFinite(value) ? clamp(value, 0, 1) : 0;

const getProfileShares = (
  accelerationDistanceShare: number,
  decelerationDistanceShare: number,
) => {
  let accelerationShare = normalizeProfileShare(accelerationDistanceShare);
  let decelerationShare = normalizeProfileShare(decelerationDistanceShare);
  const shapingShare = accelerationShare + decelerationShare;

  if (shapingShare > 1) {
    accelerationShare = 0.5;
    decelerationShare = 0.5;
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
  zones: MotionProfileZone[],
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

export const createMotionProfile = ({
  distance,
  startSpeed,
  peakSpeed,
  endSpeed,
  accelerationDistanceShare,
  decelerationDistanceShare,
  targetDuration,
}: MotionProfileInput): MotionProfile => {
  const safeDistance = Math.abs(distance);
  const safeStartSpeed = Math.max(0, startSpeed);
  const safePeakSpeed = Math.max(MIN_PROFILE_SPEED, peakSpeed);
  const safeEndSpeed = Math.max(0, endSpeed);
  const {
    accelerationShare,
    cruiseShare,
    decelerationShare,
  } = getProfileShares(
    accelerationDistanceShare,
    decelerationDistanceShare,
  );
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
  const resolvedPeakSpeed = Math.max(
    safePeakSpeed,
    safeStartSpeed,
    safeEndSpeed,
    durationBoundPeakSpeed,
  );
  const zones: MotionProfileZone[] = [];
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
  zone: MotionProfileZone,
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

export const sampleMotionProfile = (
  profile: MotionProfile,
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
