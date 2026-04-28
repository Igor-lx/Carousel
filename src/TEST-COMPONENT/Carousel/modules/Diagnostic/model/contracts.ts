export const SAFE_DURATION = 100;
export const MIN_AUTOPLAY_INTERVAL = 100;
export const MIN_VISIBLE_SLIDES = 1;
export const MIN_RENDER_WINDOW_BUFFER_MULTIPLIER = 1;
export const MAX_REASONABLE_JUMP_DURATION = 3000;

export const MIN_REPEATED_CLICK_DESTINATION_POSITION = 0;
export const MAX_REPEATED_CLICK_DESTINATION_POSITION = 1;
export const MIN_REPEATED_CLICK_SPEED_MULTIPLIER = 1;
export const MIN_REPEATED_CLICK_PROFILE_SHARE = 0;
export const MAX_REPEATED_CLICK_PROFILE_SHARE = 1;

export const MIN_VISIBILITY_THRESHOLD = 0;
export const MAX_VISIBILITY_THRESHOLD = 1;
export const MIN_DRAG_EMA_ALPHA = 0;
export const MAX_DRAG_EMA_ALPHA = 1;
export const MIN_DRAG_INERTIA_BOOST = 0;

export const DIAGNOSTIC_FALLBACK_ERROR_ALT_PLACEHOLDER = "Downloading Error";

export const DIAGNOSTIC_FALLBACK_REPEATED_CLICK_SETTINGS = {
  destinationPosition: 0.65,
  touchDestinationPosition: 0.99,
  speedMultiplier: 3,
  accelerationDistanceShare: 0.5,
  decelerationDistanceShare: 0.5,
} as const;

export const DIAGNOSTIC_FALLBACK_INTERACTION_SETTINGS = {
  hoverPauseDelay: 150,
  visibilityThreshold: 0.2,
  autoplayPaginationFactor: 0.4,
} as const;

export const DIAGNOSTIC_FALLBACK_DRAG_CONFIG = {
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
} as const;

export const DIAGNOSTIC_FALLBACK_RELEASE_MOTION_CONFIG = {
  inertiaBoost: 1,
  releaseDecelerationDistanceShare: 0.65,
} as const;

export const DIAGNOSTIC_FALLBACK_MOTION_SETTINGS = {
  snapBackDuration: 900,
} as const;
