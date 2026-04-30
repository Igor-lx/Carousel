export const PAGINATION_WIDGET_DEFAULTS = {
  visibleDots: 5,
  dotSize: 24,
  dotGap: 30,
  delay: 0,
  duration: 2800,
  scaleFactor: 0.585,
  isStopped: false,
} as const;

export const EDGE_DOT_DRIFT_FACTOR = 0.9;

export const PAGINATION_WIDGET_LIMITS = {
  minVisibleDots: 3,
  maxVisibleDots: 101,
  minDotSize: 1,
  maxDotSize: 512,
  minDotGap: 0,
  maxDotGap: 512,
  minDelay: 0,
  maxDelay: 2_147_483_647,
  minDuration: 0,
  maxDuration: 2_147_483_647,
  minScaleFactor: 0.01,
  maxScaleFactor: 1,
} as const;
