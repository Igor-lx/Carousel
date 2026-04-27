import { DEFAULT_RELEASE_MOTION_CONFIG } from "./releaseMotionConfig";
import type { ReleaseMotionConfig } from "./releaseMotionTypes";
import { getSafeSpeed } from "./speed";

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const getBoostedReleaseSpeed = (
  releaseSpeed: number,
  releaseMotionConfig: ReleaseMotionConfig,
) =>
  getSafeSpeed(releaseSpeed) *
  Math.max(0, releaseMotionConfig.inertiaBoost);

export const getReleaseDecelerationDistanceShare = (
  releaseMotionConfig: ReleaseMotionConfig,
) =>
  clamp(
    Number.isFinite(releaseMotionConfig.releaseDecelerationDistanceShare)
      ? releaseMotionConfig.releaseDecelerationDistanceShare
      : DEFAULT_RELEASE_MOTION_CONFIG.releaseDecelerationDistanceShare,
    0,
    1,
  );
