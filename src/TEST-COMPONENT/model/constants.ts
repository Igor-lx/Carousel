export const MIN_SPEED = 100;
export const MIN_DURATION = 600;
export const VELOCITY_COEFFICIENT = 0.65;
export const MIN_DELAY = 100;

export const JUMP_BEZIER = "cubic-bezier(0.1, 1, 0.3, 1)";
export const MOVE_CLICK_BEZIER = "cubic-bezier(0.25, 0.9, 0.5, 1)";
export const MOVE_AUTO_BEZIER = "ease-in-out";
export const MOVE_SWIPE_BEZIER = "cubic-bezier(0.6, 0, 0.1, 1)";
export const SNAP_BACK_BEZIER = "cubic-bezier(0.25, 0.9, 0.5, 1)";
export const SNAP_BACK_TIME = 800;

export const ANIMATION_SAFETY_MARGIN = 30;

export const HOVER_THRESHOLD = 150;

export const VISIBILITY_THRESHOLD = 0.2;

export const PAGINATION_SWITCH_COEFFICIENT_AUTO = 0.5;
export const PAGINATION_SWITCH_COEFFICIENT_GESTURE = 0.35;
export const PAGINATION_SWITCH_COEFFICIENT_STEP = 0.33;

export const CAROUSEL_SLOTS = ["pagination", "controls"] as const;

export const GESTURE_CONFIG = {
  RESISTANCE: 0.8,
  RESISTANCE_CURVATURE: 0.005,
  INTENT_THRESHOLD: 10,
  MAX_VELOCITY: 4,
  EMA_ALPHA: 0.6,
  SWIPE_THRESHOLD_RATIO: 0.2,
} as const;
