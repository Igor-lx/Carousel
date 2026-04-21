import {
  AUTOPLAY_PAGINATION_FACTOR,
  DEFAULT_SETTINGS,
  DRAG_DURATION_RAMP_CONFIG,
  DRAG_SETTINGS_CONFIG,
  HARD_DRAG_DURATION_RAMP_SETTINGS,
  HARD_DRAG_SETTINGS,
  HARD_INTERACTION_SETTINGS,
  HARD_MOTION_SETTINGS,
  HARD_REPEATED_CLICK_SETTINGS,
  MOTION_MONOTONIC_SPEED_FACTOR,
  REPEATED_CLICK_DESTINATION_POSITION,
  REPEATED_CLICK_SPEED_MULTIPLIER,
  SAFE_DURATION,
  SNAP_BACK_DURATION,
  VISIBILITY_THRESHOLD,
  HOVER_PAUSE_DELAY,
} from "../config";
import {
  normalizeAutoplayPaginationFactor,
  normalizeDragDurationRatio,
  normalizeDragEmaAlpha,
  normalizeNonNegativeNumber,
  normalizePositiveDuration,
  normalizePositiveNumber,
  normalizeRepeatedClickDestination,
  normalizeRepeatedClickSpeedMultiplier,
  normalizeVisibilityThreshold,
  normalizeVisibleSlidesCount,
} from "./helpers";

export const SAFE_DEFAULT_SETTINGS = {
  visibleSlidesNr: normalizeVisibleSlidesCount(
    DEFAULT_SETTINGS.visibleSlidesNr,
    1,
  ),
  durationAutoplay: normalizePositiveDuration(
    DEFAULT_SETTINGS.durationAutoplay,
    SAFE_DURATION,
  ),
  durationStep: normalizePositiveDuration(
    DEFAULT_SETTINGS.durationStep,
    SAFE_DURATION,
  ),
  durationJump: normalizePositiveDuration(
    DEFAULT_SETTINGS.durationJump,
    SAFE_DURATION,
  ),
  intervalAutoplay: normalizePositiveDuration(
    DEFAULT_SETTINGS.intervalAutoplay,
    SAFE_DURATION,
  ),
} as const;

export const SAFE_REPEATED_CLICK_SETTINGS = {
  destinationPosition: normalizeRepeatedClickDestination(
    REPEATED_CLICK_DESTINATION_POSITION,
    HARD_REPEATED_CLICK_SETTINGS.destinationPosition,
  ),
  speedMultiplier: normalizeRepeatedClickSpeedMultiplier(
    REPEATED_CLICK_SPEED_MULTIPLIER,
    HARD_REPEATED_CLICK_SETTINGS.speedMultiplier,
  ),
} as const;

export const SAFE_INTERACTION_SETTINGS = {
  hoverPauseDelay: normalizeNonNegativeNumber(
    HOVER_PAUSE_DELAY,
    HARD_INTERACTION_SETTINGS.hoverPauseDelay,
  ),
  visibilityThreshold: normalizeVisibilityThreshold(
    VISIBILITY_THRESHOLD,
    HARD_INTERACTION_SETTINGS.visibilityThreshold,
  ),
  autoplayPaginationFactor: normalizeAutoplayPaginationFactor(
    AUTOPLAY_PAGINATION_FACTOR,
    HARD_INTERACTION_SETTINGS.autoplayPaginationFactor,
  ),
} as const;

export const SAFE_DRAG_SETTINGS = {
  RESISTANCE: normalizeNonNegativeNumber(
    DRAG_SETTINGS_CONFIG.RESISTANCE,
    HARD_DRAG_SETTINGS.RESISTANCE,
  ),
  RESISTANCE_CURVATURE: normalizeNonNegativeNumber(
    DRAG_SETTINGS_CONFIG.RESISTANCE_CURVATURE,
    HARD_DRAG_SETTINGS.RESISTANCE_CURVATURE,
  ),
  INTENT_THRESHOLD: normalizeNonNegativeNumber(
    DRAG_SETTINGS_CONFIG.INTENT_THRESHOLD,
    HARD_DRAG_SETTINGS.INTENT_THRESHOLD,
  ),
  MAX_VELOCITY: normalizePositiveNumber(
    DRAG_SETTINGS_CONFIG.MAX_VELOCITY,
    HARD_DRAG_SETTINGS.MAX_VELOCITY,
  ),
  EMA_ALPHA: normalizeDragEmaAlpha(
    DRAG_SETTINGS_CONFIG.EMA_ALPHA,
    HARD_DRAG_SETTINGS.EMA_ALPHA,
  ),
  SWIPE_THRESHOLD_RATIO: normalizeNonNegativeNumber(
    DRAG_SETTINGS_CONFIG.SWIPE_THRESHOLD_RATIO,
    HARD_DRAG_SETTINGS.SWIPE_THRESHOLD_RATIO,
  ),
} as const;

const dragVelocityThreshold = normalizeNonNegativeNumber(
  DRAG_DURATION_RAMP_CONFIG.velocityThreshold,
  HARD_DRAG_DURATION_RAMP_SETTINGS.velocityThreshold,
);

export const SAFE_DRAG_DURATION_RAMP_SETTINGS = {
  velocityThreshold: dragVelocityThreshold,
  rampEnd: Math.max(
    dragVelocityThreshold,
    normalizeNonNegativeNumber(
      DRAG_DURATION_RAMP_CONFIG.rampEnd,
      HARD_DRAG_DURATION_RAMP_SETTINGS.rampEnd,
    ),
  ),
  minDurationRatio: normalizeDragDurationRatio(
    DRAG_DURATION_RAMP_CONFIG.minDurationRatio,
    HARD_DRAG_DURATION_RAMP_SETTINGS.minDurationRatio,
  ),
  minDuration: normalizePositiveDuration(
    DRAG_DURATION_RAMP_CONFIG.minDuration,
    HARD_DRAG_DURATION_RAMP_SETTINGS.minDuration,
  ),
  inertiaBoost: normalizeNonNegativeNumber(
    DRAG_DURATION_RAMP_CONFIG.inertiaBoost,
    HARD_DRAG_DURATION_RAMP_SETTINGS.inertiaBoost,
  ),
} as const;

export const SAFE_MOTION_SETTINGS = {
  monotonicSpeedFactor: normalizePositiveNumber(
    MOTION_MONOTONIC_SPEED_FACTOR,
    HARD_MOTION_SETTINGS.monotonicSpeedFactor,
  ),
  snapBackDuration: normalizePositiveDuration(
    SNAP_BACK_DURATION,
    HARD_MOTION_SETTINGS.snapBackDuration,
  ),
} as const;
