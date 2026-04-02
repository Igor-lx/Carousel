export const WIDGET_DEFAULTS = {
  visibleDots: 5,
  dotSize: 24,
  dotGap: 30,
  delay: 0,
  duration: 2800,
  scaleFactor: 0.585,
  isFreezed: false,
} as const;

export const EDGE_DOT_DRIFT_FACTOR = 0.7;
export const MIN_DURATION = 600;
export const VELOCITY_COEFFICIENT = 0.65;
export const ANIMATION_END_BUFFER = 50;
export const DOTS_POOL_BUFFER = 4;
