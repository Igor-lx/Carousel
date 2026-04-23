export const DRAG_SETTINGS_CONFIG = {
  COOLDOWN_MS: 150,
  INTENT_THRESHOLD: 8,
  RESISTANCE: 0.5,
  RESISTANCE_CURVATURE: 0.004,
  MAX_VELOCITY: 4.5,
  EMA_ALPHA: 0.8,
  SWIPE_VELOCITY_LIMIT: 0.5,
  QUICK_SWIPE_MIN_OFFSET: 10,
  MIN_SWIPE_DISTANCE: 20,
  SWIPE_THRESHOLD_RATIO: 0.16,
  RELEASE_EPSILON: 0.001,
} as const;

export const DRAG_DURATION_RAMP_CONFIG = {
  velocityThreshold: 0.4,
  rampEnd: 1.35,
  minDurationRatio: 0.14,
  minDuration: 220,
  inertiaBoost: 4.6,
} as const;
