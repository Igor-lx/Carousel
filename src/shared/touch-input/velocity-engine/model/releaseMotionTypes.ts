export interface ReleaseMotionConfig {
  inertiaBoost: number;
  releaseDecelerationDistanceShare: number;
}

export interface ReleaseMotionPlan {
  releaseSpeed: number;
  minimumSpeed: number;
  boostedReleaseSpeed: number;
  effectiveReleaseSpeed: number;
  isFasterThanMinimumSpeed: boolean;
  decelerationDistanceShare: number;
}

export interface ReleaseMotionResult {
  effectiveReleaseSpeed: number;
  duration: number;
  isInertialRelease: boolean;
}
