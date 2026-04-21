import {
  clampNumber,
  coerceClampedNumber,
  coerceNonNegativeNumber,
  coercePositiveNumber,
  isFiniteNumber,
} from "../../../../../shared/normalization";
import {
  HARD_ERROR_ALT_PLACEHOLDER,
  MAX_DRAG_DURATION_RATIO,
  MAX_DRAG_EMA_ALPHA,
  MAX_REPEATED_CLICK_DESTINATION_POSITION,
  MAX_VISIBILITY_THRESHOLD,
  MIN_AUTOPLAY_INTERVAL,
  MIN_DRAG_DURATION_RATIO,
  MIN_DRAG_EMA_ALPHA,
  MIN_REPEATED_CLICK_DESTINATION_POSITION,
  MIN_REPEATED_CLICK_SPEED_MULTIPLIER,
  MIN_VISIBLE_SLIDES,
  MIN_VISIBILITY_THRESHOLD,
} from "../config";

export const isValueProvided = (value: unknown) => typeof value !== "undefined";

export const normalizePositiveNumber = (value: unknown, safeValue: number) =>
  coercePositiveNumber(value, safeValue);

export const normalizeNonNegativeNumber = (
  value: unknown,
  safeValue: number,
) => coerceNonNegativeNumber(value, safeValue);

export const normalizePositiveDuration = (
  value: unknown,
  safeValue: number,
) => normalizePositiveNumber(value, safeValue);

export const normalizeVisibleSlidesCount = (
  value: unknown,
  safeValue: number,
) =>
  Math.max(
    MIN_VISIBLE_SLIDES,
    Math.floor(normalizePositiveNumber(value, safeValue)),
  );

export const normalizeAutoplayInterval = (
  value: unknown,
  safeValue: number,
) =>
  Math.max(
    MIN_AUTOPLAY_INTERVAL,
    normalizePositiveNumber(value, safeValue),
  );

export const normalizeRepeatedClickDestination = (
  value: unknown,
  safeValue: number,
) =>
  coerceClampedNumber(
    value,
    safeValue,
    MIN_REPEATED_CLICK_DESTINATION_POSITION,
    MAX_REPEATED_CLICK_DESTINATION_POSITION,
  );

export const normalizeRepeatedClickSpeedMultiplier = (
  value: unknown,
  safeValue: number,
) =>
  Math.max(
    MIN_REPEATED_CLICK_SPEED_MULTIPLIER,
    normalizePositiveNumber(value, safeValue),
  );

export const normalizeVisibilityThreshold = (
  value: unknown,
  safeValue: number,
) =>
  coerceClampedNumber(
    value,
    safeValue,
    MIN_VISIBILITY_THRESHOLD,
    MAX_VISIBILITY_THRESHOLD,
  );

export const normalizeAutoplayPaginationFactor = (
  value: unknown,
  safeValue: number,
) => {
  const source = isFiniteNumber(value) ? value : safeValue;

  return clampNumber(source, Number.EPSILON, 1 - Number.EPSILON);
};

export const normalizeDragEmaAlpha = (value: unknown, safeValue: number) =>
  coerceClampedNumber(
    value,
    safeValue,
    MIN_DRAG_EMA_ALPHA,
    MAX_DRAG_EMA_ALPHA,
  );

export const normalizeDragDurationRatio = (
  value: unknown,
  safeValue: number,
) =>
  coerceClampedNumber(
    value,
    safeValue,
    MIN_DRAG_DURATION_RATIO,
    MAX_DRAG_DURATION_RATIO,
  );

export const normalizeErrorAltPlaceholder = (
  value: unknown,
  fallback: string,
) => {
  if (typeof value === "string" && value.trim()) {
    return value;
  }

  if (typeof fallback === "string" && fallback.trim()) {
    return fallback;
  }

  return HARD_ERROR_ALT_PLACEHOLDER;
};
