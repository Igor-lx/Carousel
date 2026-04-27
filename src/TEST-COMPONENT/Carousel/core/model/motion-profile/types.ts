export interface MotionProfileZone {
  startDistanceProgress: number;
  endDistanceProgress: number;
  startTime: number;
  duration: number;
  startSpeed: number;
  endSpeed: number;
}

export interface MotionProfile {
  duration: number;
  zones: MotionProfileZone[];
}

export interface MotionProfileInput {
  distance: number;
  startSpeed: number;
  peakSpeed: number;
  endSpeed: number;
  accelerationDistanceShare: number;
  decelerationDistanceShare: number;
  targetDuration?: number;
}
