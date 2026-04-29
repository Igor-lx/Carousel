import {
  PAGINATION_WIDGET_DEFAULTS,
  PAGINATION_WIDGET_LIMITS,
} from "./paginationWidgetConstants";
import type {
  PaginationWidgetProps,
  PaginationWidgetSpatialConfig,
} from "./paginationWidgetTypes";

export interface PaginationWidgetRuntimeConfig {
  visibleDots: number;
  spatial: PaginationWidgetSpatialConfig;
  delay: number;
  duration: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const finiteOrFallback = (value: number | undefined, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const normalizeOddIntegerInRange = (
  value: number | undefined,
  fallback: number,
  min: number,
  max: number,
) => {
  const finiteValue = finiteOrFallback(value, fallback);
  let integerValue = clamp(Math.floor(finiteValue), min, max);

  if (integerValue % 2 === 0) {
    integerValue = integerValue < max ? integerValue + 1 : integerValue - 1;
  }

  return integerValue;
};

const normalizePositiveNumberInRange = (
  value: number | undefined,
  fallback: number,
  min: number,
  max: number,
) => {
  const finiteValue = finiteOrFallback(value, fallback);
  const valueOrFallback = finiteValue >= min ? finiteValue : fallback;

  return clamp(valueOrFallback, min, max);
};

const normalizeNonNegativeNumberInRange = (
  value: number | undefined,
  fallback: number,
  min: number,
  max: number,
) => {
  const finiteValue = finiteOrFallback(value, fallback);
  const valueOrFallback = finiteValue >= min ? finiteValue : fallback;

  return clamp(valueOrFallback, min, max);
};

export const normalizePaginationWidgetVisibleDots = (
  visibleDots: number | undefined,
) =>
  normalizeOddIntegerInRange(
    visibleDots,
    PAGINATION_WIDGET_DEFAULTS.visibleDots,
    PAGINATION_WIDGET_LIMITS.minVisibleDots,
    PAGINATION_WIDGET_LIMITS.maxVisibleDots,
  );

export const normalizePaginationWidgetSpatialConfig = ({
  size,
  gap,
  scaleFactor,
}: PaginationWidgetSpatialConfig): PaginationWidgetSpatialConfig => ({
  size: normalizePositiveNumberInRange(
    size,
    PAGINATION_WIDGET_DEFAULTS.dotSize,
    PAGINATION_WIDGET_LIMITS.minDotSize,
    PAGINATION_WIDGET_LIMITS.maxDotSize,
  ),
  gap: normalizeNonNegativeNumberInRange(
    gap,
    PAGINATION_WIDGET_DEFAULTS.dotGap,
    PAGINATION_WIDGET_LIMITS.minDotGap,
    PAGINATION_WIDGET_LIMITS.maxDotGap,
  ),
  scaleFactor: normalizePositiveNumberInRange(
    scaleFactor,
    PAGINATION_WIDGET_DEFAULTS.scaleFactor,
    PAGINATION_WIDGET_LIMITS.minScaleFactor,
    PAGINATION_WIDGET_LIMITS.maxScaleFactor,
  ),
});

export const normalizePaginationWidgetDuration = (
  duration: number | undefined,
) =>
  normalizePositiveNumberInRange(
    duration,
    PAGINATION_WIDGET_DEFAULTS.duration,
    PAGINATION_WIDGET_LIMITS.minDuration,
    PAGINATION_WIDGET_LIMITS.maxDuration,
  );

export const normalizePaginationWidgetDurationOverride = (
  duration: number | null,
) => {
  if (
    typeof duration !== "number" ||
    !Number.isFinite(duration) ||
    duration <= 0
  ) {
    return null;
  }

  return clamp(
    duration,
    PAGINATION_WIDGET_LIMITS.minDuration,
    PAGINATION_WIDGET_LIMITS.maxDuration,
  );
};

export const normalizePaginationWidgetConfig = ({
  visibleDots,
  dotSize,
  dotGap,
  delay,
  duration,
  scaleFactor,
}: Pick<
  PaginationWidgetProps,
  "visibleDots" | "dotSize" | "dotGap" | "delay" | "duration" | "scaleFactor"
>): PaginationWidgetRuntimeConfig => ({
  visibleDots: normalizePaginationWidgetVisibleDots(visibleDots),
  spatial: normalizePaginationWidgetSpatialConfig({
    size: dotSize ?? PAGINATION_WIDGET_DEFAULTS.dotSize,
    gap: dotGap ?? PAGINATION_WIDGET_DEFAULTS.dotGap,
    scaleFactor: scaleFactor ?? PAGINATION_WIDGET_DEFAULTS.scaleFactor,
  }),
  delay: normalizeNonNegativeNumberInRange(
    delay,
    PAGINATION_WIDGET_DEFAULTS.delay,
    PAGINATION_WIDGET_LIMITS.minDelay,
    PAGINATION_WIDGET_LIMITS.maxDelay,
  ),
  duration: normalizePaginationWidgetDuration(duration),
});
