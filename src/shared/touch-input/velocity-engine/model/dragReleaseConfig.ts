import type { DragReleaseSpeedConfig } from "./dragReleaseTypes";

export const DEFAULT_DRAG_RELEASE_SPEED_CONFIG: DragReleaseSpeedConfig = {
  inertiaBoost: 1,
  releaseDecelerationDistanceShare: 0.65,
};

export const resolveDragReleaseSpeedConfig = (
  dragReleaseSpeedConfig?: Partial<DragReleaseSpeedConfig>,
): DragReleaseSpeedConfig => ({
  ...DEFAULT_DRAG_RELEASE_SPEED_CONFIG,
  ...dragReleaseSpeedConfig,
});
