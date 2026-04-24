import {
  clampNumber,
  coerceClampedNumber,
  coerceNonNegativeNumber,
  coercePositiveNumber,
  isFiniteNumber,
} from "../../../../../shared/value-resolution";
import {
  HARD_ERROR_ALT_PLACEHOLDER,
  MAX_REPEATED_CLICK_DESTINATION_POSITION,
  MAX_REPEATED_CLICK_PROFILE_SHARE,
  MAX_VISIBILITY_THRESHOLD,
  MIN_AUTOPLAY_INTERVAL,
  MIN_REPEATED_CLICK_DESTINATION_POSITION,
  MIN_REPEATED_CLICK_PROFILE_SHARE,
  MIN_VISIBLE_SLIDES,
  MIN_VISIBILITY_THRESHOLD,
} from "./contracts";

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

export const normalizePositiveInteger = (
  value: unknown,
  safeValue: number,
  minValue = 1,
) =>
  Math.max(
    minValue,
    Math.floor(normalizePositiveNumber(value, safeValue)),
  );

export const normalizeVisibleSlidesCount = (
  value: unknown,
  safeValue: number,
  minVisibleSlides = MIN_VISIBLE_SLIDES,
) => normalizePositiveInteger(value, safeValue, minVisibleSlides);

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

export const normalizeRepeatedClickProfileShare = (
  value: unknown,
  safeValue: number,
) =>
  coerceClampedNumber(
    value,
    safeValue,
    MIN_REPEATED_CLICK_PROFILE_SHARE,
    MAX_REPEATED_CLICK_PROFILE_SHARE,
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
