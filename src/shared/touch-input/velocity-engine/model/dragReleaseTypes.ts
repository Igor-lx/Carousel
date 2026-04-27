export interface DragReleaseSpeedConfig {
  inertiaBoost: number;
  releaseDecelerationDistanceShare: number;
}

export interface DragReleaseVelocityPlan {
  releaseSpeed: number;
  minimumSpeed: number;
  boostedReleaseSpeed: number;
  effectiveReleaseSpeed: number;
  isFasterThanMinimumSpeed: boolean;
  decelerationDistanceShare: number;
}
