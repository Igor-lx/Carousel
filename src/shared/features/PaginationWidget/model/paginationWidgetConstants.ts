export const PAGINATION_WIDGET_DEFAULTS = {
  visibleDots: 5,
  dotSize: 24,
  dotGap: 30,
  delay: 0,
  duration: 2800,
  scaleFactor: 0.585,
  isFreezed: false,
} as const;

export const EDGE_DOT_DRIFT_FACTOR = 0.6;
export const MIN_DURATION = 400;
export const VELOCITY_COEFFICIENT = 0.7;
export const ANIMATION_END_BUFFER = 30;
export const DOTS_OUTSIDE_BUFFER = 1;

export const PAGINATION_WIDGET_LIMITS = {
  minVisibleDots: 3,
  maxVisibleDots: 101,
  minDotSize: 1,
  maxDotSize: 512,
  minDotGap: 0,
  maxDotGap: 512,
  minDelay: 0,
  maxDelay: 2_147_483_647,
  minDuration: 1,
  maxDuration: 2_147_483_647 - ANIMATION_END_BUFFER,
  minScaleFactor: 0.01,
  maxScaleFactor: 1,
} as const;
