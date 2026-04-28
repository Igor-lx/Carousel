import type { DevNoticeEntry } from "../../../../../shared";
import {
  CAROUSEL_DRAG_CONFIG,
  CAROUSEL_DRAG_RELEASE_EPSILON,
  CAROUSEL_RELEASE_MOTION_CONFIG,
  MOTION_EPSILON,
  SNAP_BACK_DURATION,
} from "../../../core/model/config";
import {
  DIAGNOSTIC_FALLBACK_DRAG_CONFIG,
  DIAGNOSTIC_FALLBACK_MOTION_SETTINGS,
  DIAGNOSTIC_FALLBACK_RELEASE_MOTION_CONFIG,
  MAX_DRAG_EMA_ALPHA,
  MAX_REPEATED_CLICK_PROFILE_SHARE,
  MIN_DRAG_EMA_ALPHA,
  MIN_DRAG_INERTIA_BOOST,
  MIN_REPEATED_CLICK_PROFILE_SHARE,
} from "./contracts";
import {
  DURATION_UNIT,
  getInternalConstantNoticeMessage,
  getNonNegativeDurationReason,
  getPositiveDurationReason,
  isFiniteNumber,
  isFiniteNumberInRange,
  isNonNegativeFiniteNumber,
  isPositiveFiniteNumber,
} from "./diagnostic-common";
import {
  normalizeNonNegativeNumber,
  normalizePositiveDuration,
  normalizePositiveNumber,
  normalizeRepeatedClickProfileShare,
} from "./helpers";

export const resolveDragConfig = () => {
  const cooldownMs = normalizeNonNegativeNumber(
    CAROUSEL_DRAG_CONFIG.COOLDOWN_MS,
    DIAGNOSTIC_FALLBACK_DRAG_CONFIG.COOLDOWN_MS,
  );
  const resistance = CAROUSEL_DRAG_CONFIG.RESISTANCE;
  const resistanceCurvature = CAROUSEL_DRAG_CONFIG.RESISTANCE_CURVATURE;
  const intentThreshold = normalizeNonNegativeNumber(
    CAROUSEL_DRAG_CONFIG.INTENT_THRESHOLD,
    DIAGNOSTIC_FALLBACK_DRAG_CONFIG.INTENT_THRESHOLD,
  );
  const maxVelocity = normalizePositiveNumber(
    CAROUSEL_DRAG_CONFIG.MAX_VELOCITY,
    DIAGNOSTIC_FALLBACK_DRAG_CONFIG.MAX_VELOCITY,
  );
  const emaAlpha = CAROUSEL_DRAG_CONFIG.EMA_ALPHA;
  const swipeVelocityLimit = normalizeNonNegativeNumber(
    CAROUSEL_DRAG_CONFIG.SWIPE_VELOCITY_LIMIT,
    DIAGNOSTIC_FALLBACK_DRAG_CONFIG.SWIPE_VELOCITY_LIMIT,
  );
  const quickSwipeMinOffset = normalizeNonNegativeNumber(
    CAROUSEL_DRAG_CONFIG.QUICK_SWIPE_MIN_OFFSET,
    DIAGNOSTIC_FALLBACK_DRAG_CONFIG.QUICK_SWIPE_MIN_OFFSET,
  );
  const minSwipeDistance = normalizeNonNegativeNumber(
    CAROUSEL_DRAG_CONFIG.MIN_SWIPE_DISTANCE,
    DIAGNOSTIC_FALLBACK_DRAG_CONFIG.MIN_SWIPE_DISTANCE,
  );
  const swipeThresholdRatio = normalizeNonNegativeNumber(
    CAROUSEL_DRAG_CONFIG.SWIPE_THRESHOLD_RATIO,
    DIAGNOSTIC_FALLBACK_DRAG_CONFIG.SWIPE_THRESHOLD_RATIO,
  );
  const corrections: DevNoticeEntry[] = [];

  if (cooldownMs !== CAROUSEL_DRAG_CONFIG.COOLDOWN_MS) {
    corrections.push({
      field: "CAROUSEL_DRAG_CONFIG.COOLDOWN_MS",
      provided: CAROUSEL_DRAG_CONFIG.COOLDOWN_MS,
      normalized: cooldownMs,
      unit: DURATION_UNIT,
      reason: getNonNegativeDurationReason(CAROUSEL_DRAG_CONFIG.COOLDOWN_MS),
    });
  }

  if (!isFiniteNumberInRange(CAROUSEL_DRAG_CONFIG.RESISTANCE, 0, 1)) {
    corrections.push({
      field: "CAROUSEL_DRAG_CONFIG.RESISTANCE",
      provided: CAROUSEL_DRAG_CONFIG.RESISTANCE,
      message: getInternalConstantNoticeMessage(
        "expected a finite value between 0 and 1",
      ),
    });
  }

  if (!isNonNegativeFiniteNumber(CAROUSEL_DRAG_CONFIG.RESISTANCE_CURVATURE)) {
    corrections.push({
      field: "CAROUSEL_DRAG_CONFIG.RESISTANCE_CURVATURE",
      provided: CAROUSEL_DRAG_CONFIG.RESISTANCE_CURVATURE,
      message: getInternalConstantNoticeMessage(
        "expected a finite non-negative value",
      ),
    });
  }

  if (intentThreshold !== CAROUSEL_DRAG_CONFIG.INTENT_THRESHOLD) {
    corrections.push({
      field: "CAROUSEL_DRAG_CONFIG.INTENT_THRESHOLD",
      provided: CAROUSEL_DRAG_CONFIG.INTENT_THRESHOLD,
      normalized: intentThreshold,
      reason: "expected a finite non-negative value",
    });
  }

  if (maxVelocity !== CAROUSEL_DRAG_CONFIG.MAX_VELOCITY) {
    corrections.push({
      field: "CAROUSEL_DRAG_CONFIG.MAX_VELOCITY",
      provided: CAROUSEL_DRAG_CONFIG.MAX_VELOCITY,
      normalized: maxVelocity,
      reason: "expected a finite positive value",
    });
  }

  if (
    !isFiniteNumberInRange(
      CAROUSEL_DRAG_CONFIG.EMA_ALPHA,
      MIN_DRAG_EMA_ALPHA,
      MAX_DRAG_EMA_ALPHA,
    )
  ) {
    corrections.push({
      field: "CAROUSEL_DRAG_CONFIG.EMA_ALPHA",
      provided: CAROUSEL_DRAG_CONFIG.EMA_ALPHA,
      message: getInternalConstantNoticeMessage(
        `expected a finite value between ${MIN_DRAG_EMA_ALPHA} and ${MAX_DRAG_EMA_ALPHA}`,
      ),
    });
  }

  if (swipeVelocityLimit !== CAROUSEL_DRAG_CONFIG.SWIPE_VELOCITY_LIMIT) {
    corrections.push({
      field: "CAROUSEL_DRAG_CONFIG.SWIPE_VELOCITY_LIMIT",
      provided: CAROUSEL_DRAG_CONFIG.SWIPE_VELOCITY_LIMIT,
      normalized: swipeVelocityLimit,
      reason: "expected a finite non-negative value",
    });
  }

  if (quickSwipeMinOffset !== CAROUSEL_DRAG_CONFIG.QUICK_SWIPE_MIN_OFFSET) {
    corrections.push({
      field: "CAROUSEL_DRAG_CONFIG.QUICK_SWIPE_MIN_OFFSET",
      provided: CAROUSEL_DRAG_CONFIG.QUICK_SWIPE_MIN_OFFSET,
      normalized: quickSwipeMinOffset,
      reason: "expected a finite non-negative value",
    });
  }

  if (minSwipeDistance !== CAROUSEL_DRAG_CONFIG.MIN_SWIPE_DISTANCE) {
    corrections.push({
      field: "CAROUSEL_DRAG_CONFIG.MIN_SWIPE_DISTANCE",
      provided: CAROUSEL_DRAG_CONFIG.MIN_SWIPE_DISTANCE,
      normalized: minSwipeDistance,
      reason: "expected a finite non-negative value",
    });
  }

  if (swipeThresholdRatio !== CAROUSEL_DRAG_CONFIG.SWIPE_THRESHOLD_RATIO) {
    corrections.push({
      field: "CAROUSEL_DRAG_CONFIG.SWIPE_THRESHOLD_RATIO",
      provided: CAROUSEL_DRAG_CONFIG.SWIPE_THRESHOLD_RATIO,
      normalized: swipeThresholdRatio,
      reason: "expected a finite non-negative value",
    });
  }

  return {
    settings: {
      COOLDOWN_MS: cooldownMs,
      INTENT_THRESHOLD: intentThreshold,
      RESISTANCE: resistance,
      RESISTANCE_CURVATURE: resistanceCurvature,
      MAX_VELOCITY: maxVelocity,
      EMA_ALPHA: emaAlpha,
      SWIPE_VELOCITY_LIMIT: swipeVelocityLimit,
      QUICK_SWIPE_MIN_OFFSET: quickSwipeMinOffset,
      MIN_SWIPE_DISTANCE: minSwipeDistance,
      SWIPE_THRESHOLD_RATIO: swipeThresholdRatio,
    },
    corrections,
  };
};

export const resolveReleaseMotionConfig = () => {
  const inertiaBoost = CAROUSEL_RELEASE_MOTION_CONFIG.inertiaBoost;
  const releaseDecelerationDistanceShare = normalizeRepeatedClickProfileShare(
    CAROUSEL_RELEASE_MOTION_CONFIG.releaseDecelerationDistanceShare,
    DIAGNOSTIC_FALLBACK_RELEASE_MOTION_CONFIG.releaseDecelerationDistanceShare,
  );
  const corrections: DevNoticeEntry[] = [];

  if (
    !isFiniteNumber(CAROUSEL_RELEASE_MOTION_CONFIG.inertiaBoost) ||
    CAROUSEL_RELEASE_MOTION_CONFIG.inertiaBoost < MIN_DRAG_INERTIA_BOOST
  ) {
    corrections.push({
      field: "CAROUSEL_RELEASE_MOTION_CONFIG.inertiaBoost",
      provided: CAROUSEL_RELEASE_MOTION_CONFIG.inertiaBoost,
      message: getInternalConstantNoticeMessage(
        `expected a finite value greater than or equal to ${MIN_DRAG_INERTIA_BOOST}`,
      ),
    });
  }

  if (
    isFiniteNumber(CAROUSEL_RELEASE_MOTION_CONFIG.inertiaBoost) &&
    CAROUSEL_RELEASE_MOTION_CONFIG.inertiaBoost >= MIN_DRAG_INERTIA_BOOST &&
    CAROUSEL_RELEASE_MOTION_CONFIG.inertiaBoost < 1
  ) {
    corrections.push({
      field: "CAROUSEL_RELEASE_MOTION_CONFIG.inertiaBoost",
      provided: CAROUSEL_RELEASE_MOTION_CONFIG.inertiaBoost,
      message:
        "inertiaBoost below 1 is valid, but it intentionally weakens fast-release velocity; runtime still keeps slow releases at MOVE speed",
    });
  }

  if (
    releaseDecelerationDistanceShare !==
    CAROUSEL_RELEASE_MOTION_CONFIG.releaseDecelerationDistanceShare
  ) {
    corrections.push({
      field: "CAROUSEL_RELEASE_MOTION_CONFIG.releaseDecelerationDistanceShare",
      provided: CAROUSEL_RELEASE_MOTION_CONFIG.releaseDecelerationDistanceShare,
      normalized: releaseDecelerationDistanceShare,
      reason: isFiniteNumber(
        CAROUSEL_RELEASE_MOTION_CONFIG.releaseDecelerationDistanceShare,
      )
        ? `clamped to [${MIN_REPEATED_CLICK_PROFILE_SHARE}, ${MAX_REPEATED_CLICK_PROFILE_SHARE}]`
        : "expected a finite value between 0 and 1",
    });
  }

  return {
    settings: {
      inertiaBoost,
      releaseDecelerationDistanceShare,
    },
    corrections,
  };
};

export const resolveDragReleaseEpsilon = () => {
  const dragReleaseEpsilon = CAROUSEL_DRAG_RELEASE_EPSILON;
  const corrections: DevNoticeEntry[] = [];

  if (!isPositiveFiniteNumber(CAROUSEL_DRAG_RELEASE_EPSILON)) {
    corrections.push({
      field: "CAROUSEL_DRAG_RELEASE_EPSILON",
      provided: CAROUSEL_DRAG_RELEASE_EPSILON,
      message: getInternalConstantNoticeMessage(
        "expected a finite positive value",
      ),
    });
  }

  return {
    setting: dragReleaseEpsilon,
    corrections,
  };
};

export const resolveMotionSettings = () => {
  const snapBackDuration = normalizePositiveDuration(
    SNAP_BACK_DURATION,
    DIAGNOSTIC_FALLBACK_MOTION_SETTINGS.snapBackDuration,
  );
  const epsilon = MOTION_EPSILON;
  const corrections: DevNoticeEntry[] = [];

  if (snapBackDuration !== SNAP_BACK_DURATION) {
    corrections.push({
      field: "SNAP_BACK_DURATION",
      provided: SNAP_BACK_DURATION,
      normalized: snapBackDuration,
      unit: DURATION_UNIT,
      reason: getPositiveDurationReason(SNAP_BACK_DURATION),
    });
  }

  if (!isPositiveFiniteNumber(MOTION_EPSILON)) {
    corrections.push({
      field: "MOTION_EPSILON",
      provided: MOTION_EPSILON,
      message: getInternalConstantNoticeMessage(
        "expected a finite positive value",
      ),
    });
  }

  return {
    settings: {
      snapBackDuration,
      epsilon,
    },
    corrections,
  };
};
