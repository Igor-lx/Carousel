import { DEFAULT_DRAG_RELEASE_SPEED_CONFIG } from "./dragReleaseConfig";
import type { DragReleaseSpeedConfig } from "./dragReleaseTypes";
import { getSafeSpeed } from "./speed";

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export const getBoostedReleaseSpeed = (
  releaseSpeed: number,
  dragReleaseSpeedConfig: DragReleaseSpeedConfig,
) =>
  getSafeSpeed(releaseSpeed) *
  Math.max(0, dragReleaseSpeedConfig.inertiaBoost);

export const getReleaseDecelerationDistanceShare = (
  dragReleaseSpeedConfig: DragReleaseSpeedConfig,
) =>
  clamp(
    Number.isFinite(dragReleaseSpeedConfig.releaseDecelerationDistanceShare)
      ? dragReleaseSpeedConfig.releaseDecelerationDistanceShare
      : DEFAULT_DRAG_RELEASE_SPEED_CONFIG.releaseDecelerationDistanceShare,
    0,
    1,
  );
