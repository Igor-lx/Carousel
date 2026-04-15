export const MIN_SPEED = 100;
export const MIN_DURATION = 300;
export const REPEATED_CLICK_ADVANCE_DURATION = 700;
export const REPEATED_CLICK_THRESHOLD_POSITION = 0.5;
export const REPEATED_CLICK_BEFORE_THRESHOLD_DESTINATION_POSITION = 0.9;
export const REPEATED_CLICK_AFTER_THRESHOLD_DESTINATION_POSITION = 0.65;
export const MIN_DELAY = 100;

export const ANIMATION_SAFETY_MARGIN = 30;
export const SNAP_BACK_TIME = 800;
export const HOVER_THRESHOLD = 150;
export const VISIBILITY_THRESHOLD = 0.2;
export const AUTOPLAY_PAGINATION_FACTOR = 0.4;

export const JUMP_BEZIER = "cubic-bezier(0.16, 1, 0.3, 1)";
export const MOVE_CLICK_BEZIER = "cubic-bezier(0.2, 0.9, 0.32, 1)";
export const MOVE_AUTO_BEZIER = "cubic-bezier(0.28, 0.72, 0.38, 1)";
export const MOVE_SWIPE_BEZIER = "cubic-bezier(0.14, 0.92, 0.24, 1)";
export const SNAP_BACK_BEZIER = "cubic-bezier(0.18, 0.82, 0.28, 1)";

export const CAROUSEL_SLOTS = ["pagination", "controls"] as const;

export const DRAG_SETTINGS_CONFIG = {
  RESISTANCE: 0.8,
  RESISTANCE_CURVATURE: 0.005,
  INTENT_THRESHOLD: 10,
  MAX_VELOCITY: 4,
  EMA_ALPHA: 0.72,
  SWIPE_THRESHOLD_RATIO: 0.2,
} as const;

export const DRAG_SPEED_CONFIG = {
  velocityThreshold: 0.65,
  rampEnd: 1.9,
  minDurationRatio: 0.2,
  minDuration: 160,
} as const;
