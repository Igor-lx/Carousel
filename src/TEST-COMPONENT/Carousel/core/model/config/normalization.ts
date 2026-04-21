export const SAFE_DURATION = 100;
export const MIN_AUTOPLAY_INTERVAL = 100;
export const MIN_VISIBLE_SLIDES = 1;

export const MIN_REPEATED_CLICK_DESTINATION_POSITION = 0;
export const MAX_REPEATED_CLICK_DESTINATION_POSITION = 1;
export const MIN_REPEATED_CLICK_SPEED_MULTIPLIER = 1;

export const MIN_VISIBILITY_THRESHOLD = 0;
export const MAX_VISIBILITY_THRESHOLD = 1;
export const MIN_DRAG_EMA_ALPHA = 0;
export const MAX_DRAG_EMA_ALPHA = 1;
export const MIN_DRAG_DURATION_RATIO = 0;
export const MAX_DRAG_DURATION_RATIO = 1;

export const HARD_ERROR_ALT_PLACEHOLDER = "Downloading Error";

export const HARD_REPEATED_CLICK_SETTINGS = {
  destinationPosition: 0.65,
  speedMultiplier: 8,
} as const;

export const HARD_INTERACTION_SETTINGS = {
  hoverPauseDelay: 150,
  visibilityThreshold: 0.2,
  autoplayPaginationFactor: 0.4,
} as const;

export const HARD_DRAG_SETTINGS = {
  RESISTANCE: 0.5,
  RESISTANCE_CURVATURE: 0.004,
  INTENT_THRESHOLD: 8,
  MAX_VELOCITY: 4.5,
  EMA_ALPHA: 0.8,
  SWIPE_THRESHOLD_RATIO: 0.16,
} as const;

export const HARD_DRAG_DURATION_RAMP_SETTINGS = {
  velocityThreshold: 0.4,
  rampEnd: 1.35,
  minDurationRatio: 0.14,
  minDuration: 220,
  inertiaBoost: 4.6,
} as const;

export const HARD_MOTION_SETTINGS = {
  monotonicSpeedFactor: 3,
  snapBackDuration: 900,
} as const;
