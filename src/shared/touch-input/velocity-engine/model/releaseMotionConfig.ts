import type { ReleaseMotionConfig } from "./releaseMotionTypes";

export const DEFAULT_RELEASE_MOTION_CONFIG: ReleaseMotionConfig = {
  inertiaBoost: 1,
  releaseDecelerationDistanceShare: 0.65,
};

export const resolveReleaseMotionConfig = (
  releaseMotionConfig?: Partial<ReleaseMotionConfig>,
): ReleaseMotionConfig => ({
  ...DEFAULT_RELEASE_MOTION_CONFIG,
  ...releaseMotionConfig,
});
