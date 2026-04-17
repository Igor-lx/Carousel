export const DRAG_SETTINGS_CONFIG = {
  RESISTANCE: 0.5,
  RESISTANCE_CURVATURE: 0.005,
  INTENT_THRESHOLD: 10,
  MAX_VELOCITY: 4,
  EMA_ALPHA: 0.72,
  SWIPE_THRESHOLD_RATIO: 0.2,
} as const;

export const DRAG_DURATION_RAMP_CONFIG = {
  velocityThreshold: 0.65,
  rampEnd: 1.9,
  minDurationRatio: 0.2,
  minDuration: 160,
  inertiaBoost: 1,
} as const;
