import type { DevNoticeEntry } from "../../../../../shared";
import {
  REPEATED_CLICK_ACCELERATION_DISTANCE_SHARE,
  REPEATED_CLICK_DECELERATION_DISTANCE_SHARE,
  REPEATED_CLICK_DESTINATION_POSITION,
  REPEATED_CLICK_EPSILON,
  REPEATED_CLICK_SPEED_MULTIPLIER,
  REPEATED_CLICK_TOUCH_DESTINATION_POSITION,
} from "../../../core/model/config";
import {
  DIAGNOSTIC_FALLBACK_REPEATED_CLICK_SETTINGS,
  MAX_REPEATED_CLICK_DESTINATION_POSITION,
  MAX_REPEATED_CLICK_PROFILE_SHARE,
  MIN_REPEATED_CLICK_DESTINATION_POSITION,
  MIN_REPEATED_CLICK_PROFILE_SHARE,
  MIN_REPEATED_CLICK_SPEED_MULTIPLIER,
} from "./constraints";
import {
  getAllowedRangeReason,
  getDiagnosticFallbackReason,
  getInternalConstantNoticeMessage,
  isFiniteNumber,
  isPositiveFiniteNumber,
  joinReasons,
} from "./diagnostic-validation";
import {
  normalizeRepeatedClickDestination,
  normalizeRepeatedClickProfileShare,
} from "./normalization";

const OVERFLOW_PROFILE_DISTANCE_SHARES_NORMALIZED = {
  accelerationDistanceShare: 0.5,
  decelerationDistanceShare: 0.5,
} as const;

const getRepeatedClickDestinationReason = (
  value: unknown,
  fallbackValue: number,
) =>
  isFiniteNumber(value)
    ? getAllowedRangeReason(
        MIN_REPEATED_CLICK_DESTINATION_POSITION,
        MAX_REPEATED_CLICK_DESTINATION_POSITION,
        "destination position range",
      )
    : joinReasons(
        "Expected a finite destination position",
        getDiagnosticFallbackReason(fallbackValue),
      );

const getRepeatedClickProfileShareReason = (
  value: unknown,
  fallbackValue: number,
) =>
  isFiniteNumber(value)
    ? getAllowedRangeReason(
        MIN_REPEATED_CLICK_PROFILE_SHARE,
        MAX_REPEATED_CLICK_PROFILE_SHARE,
        "motion-profile share range",
      )
    : joinReasons(
        "Expected a finite motion-profile share",
        getDiagnosticFallbackReason(fallbackValue),
      );

export const resolveRepeatedClickSettings = () => {
  const destinationPosition = normalizeRepeatedClickDestination(
    REPEATED_CLICK_DESTINATION_POSITION,
    DIAGNOSTIC_FALLBACK_REPEATED_CLICK_SETTINGS.destinationPosition,
  );
  const touchDestinationPosition = normalizeRepeatedClickDestination(
    REPEATED_CLICK_TOUCH_DESTINATION_POSITION,
    DIAGNOSTIC_FALLBACK_REPEATED_CLICK_SETTINGS.touchDestinationPosition,
  );
  const speedMultiplier = REPEATED_CLICK_SPEED_MULTIPLIER;
  const accelerationDistanceShare = normalizeRepeatedClickProfileShare(
    REPEATED_CLICK_ACCELERATION_DISTANCE_SHARE,
    DIAGNOSTIC_FALLBACK_REPEATED_CLICK_SETTINGS.accelerationDistanceShare,
  );
  const decelerationDistanceShare = normalizeRepeatedClickProfileShare(
    REPEATED_CLICK_DECELERATION_DISTANCE_SHARE,
    DIAGNOSTIC_FALLBACK_REPEATED_CLICK_SETTINGS.decelerationDistanceShare,
  );
  const epsilon = REPEATED_CLICK_EPSILON;
  const corrections: DevNoticeEntry[] = [];

  if (destinationPosition !== REPEATED_CLICK_DESTINATION_POSITION) {
    corrections.push({
      field: "REPEATED_CLICK_DESTINATION_POSITION",
      provided: REPEATED_CLICK_DESTINATION_POSITION,
      normalized: destinationPosition,
      reason: getRepeatedClickDestinationReason(
        REPEATED_CLICK_DESTINATION_POSITION,
        DIAGNOSTIC_FALLBACK_REPEATED_CLICK_SETTINGS.destinationPosition,
      ),
    });
  }

  if (
    touchDestinationPosition !== REPEATED_CLICK_TOUCH_DESTINATION_POSITION
  ) {
    corrections.push({
      field: "REPEATED_CLICK_TOUCH_DESTINATION_POSITION",
      provided: REPEATED_CLICK_TOUCH_DESTINATION_POSITION,
      normalized: touchDestinationPosition,
      reason: getRepeatedClickDestinationReason(
        REPEATED_CLICK_TOUCH_DESTINATION_POSITION,
        DIAGNOSTIC_FALLBACK_REPEATED_CLICK_SETTINGS.touchDestinationPosition,
      ),
    });
  }

  if (
    !isFiniteNumber(REPEATED_CLICK_SPEED_MULTIPLIER) ||
    REPEATED_CLICK_SPEED_MULTIPLIER < MIN_REPEATED_CLICK_SPEED_MULTIPLIER
  ) {
    corrections.push({
      field: "REPEATED_CLICK_SPEED_MULTIPLIER",
      provided: REPEATED_CLICK_SPEED_MULTIPLIER,
      message: getInternalConstantNoticeMessage(
        `Expected a finite value >= ${MIN_REPEATED_CLICK_SPEED_MULTIPLIER}`,
      ),
    });
  }

  if (
    accelerationDistanceShare !== REPEATED_CLICK_ACCELERATION_DISTANCE_SHARE
  ) {
    corrections.push({
      field: "REPEATED_CLICK_ACCELERATION_DISTANCE_SHARE",
      provided: REPEATED_CLICK_ACCELERATION_DISTANCE_SHARE,
      normalized: accelerationDistanceShare,
      reason: getRepeatedClickProfileShareReason(
        REPEATED_CLICK_ACCELERATION_DISTANCE_SHARE,
        DIAGNOSTIC_FALLBACK_REPEATED_CLICK_SETTINGS.accelerationDistanceShare,
      ),
    });
  }

  if (
    decelerationDistanceShare !== REPEATED_CLICK_DECELERATION_DISTANCE_SHARE
  ) {
    corrections.push({
      field: "REPEATED_CLICK_DECELERATION_DISTANCE_SHARE",
      provided: REPEATED_CLICK_DECELERATION_DISTANCE_SHARE,
      normalized: decelerationDistanceShare,
      reason: getRepeatedClickProfileShareReason(
        REPEATED_CLICK_DECELERATION_DISTANCE_SHARE,
        DIAGNOSTIC_FALLBACK_REPEATED_CLICK_SETTINGS.decelerationDistanceShare,
      ),
    });
  }

  if (accelerationDistanceShare + decelerationDistanceShare > 1) {
    corrections.push({
      field: "REPEATED_CLICK_PROFILE_DISTANCE_SHARES",
      provided: {
        accelerationDistanceShare,
        decelerationDistanceShare,
      },
      normalized: OVERFLOW_PROFILE_DISTANCE_SHARES_NORMALIZED,
      reason:
        "Acceleration and deceleration shares must total 1 or less. Normalized to internal 50/50 fallback with no cruise segment",
    });
  }

  if (!isPositiveFiniteNumber(REPEATED_CLICK_EPSILON)) {
    corrections.push({
      field: "REPEATED_CLICK_EPSILON",
      provided: REPEATED_CLICK_EPSILON,
      message: getInternalConstantNoticeMessage(
        "Expected a finite positive value",
      ),
    });
  }

  return {
    settings: {
      destinationPosition,
      touchDestinationPosition,
      speedMultiplier,
      accelerationDistanceShare,
      decelerationDistanceShare,
      epsilon,
    },
    corrections,
  };
};
