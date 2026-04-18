export const DRAG_SETTINGS_CONFIG = {
  RESISTANCE: 0.4, // Larger value -> stiffer drag feel.
  RESISTANCE_CURVATURE: 0.004, // Larger value -> resistance ramps up sooner on long drags.
  INTENT_THRESHOLD: 8, // Larger value -> later drag takeover.
  MAX_VELOCITY: 4.5, // Larger value -> wider release-speed response range.
  EMA_ALPHA: 0.8, // Larger value -> release speed reacts more to the latest move.
  SWIPE_THRESHOLD_RATIO: 0.16, // Larger value -> later swipe registration.
} as const;

export const DRAG_DURATION_RAMP_CONFIG = {
  velocityThreshold: 0.4, // Larger value -> fast-swipe response starts later.
  rampEnd: 1.35, // Smaller value -> max gesture response is reached sooner.
  minDurationRatio: 0.14, // Smaller value -> strong swipes settle faster.
  minDuration: 220, // Smaller value -> the fastest releases can finish sooner.
  inertiaBoost: 4.6, // Larger value -> stronger inertia response after release.
} as const;
