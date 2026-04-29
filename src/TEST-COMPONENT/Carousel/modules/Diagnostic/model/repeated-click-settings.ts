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
  getInternalConstantNoticeMessage,
  isFiniteNumber,
  isPositiveFiniteNumber,
} from "./diagnostic-validation";
import {
  normalizeRepeatedClickDestination,
  normalizeRepeatedClickProfileShare,
} from "./normalization";

const OVERFLOW_PROFILE_DISTANCE_SHARES_NORMALIZED = {
  accelerationDistanceShare: 0.5,
  decelerationDistanceShare: 0.5,
} as const;

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
      reason: isFiniteNumber(REPEATED_CLICK_DESTINATION_POSITION)
        ? `clamped to [${MIN_REPEATED_CLICK_DESTINATION_POSITION}, ${MAX_REPEATED_CLICK_DESTINATION_POSITION}]`
        : "expected a finite value between 0 and 1",
    });
  }

  if (
    touchDestinationPosition !== REPEATED_CLICK_TOUCH_DESTINATION_POSITION
  ) {
    corrections.push({
      field: "REPEATED_CLICK_TOUCH_DESTINATION_POSITION",
      provided: REPEATED_CLICK_TOUCH_DESTINATION_POSITION,
      normalized: touchDestinationPosition,
      reason: isFiniteNumber(REPEATED_CLICK_TOUCH_DESTINATION_POSITION)
        ? `clamped to [${MIN_REPEATED_CLICK_DESTINATION_POSITION}, ${MAX_REPEATED_CLICK_DESTINATION_POSITION}]`
        : "expected a finite value between 0 and 1",
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
        `expected a finite value greater than or equal to ${MIN_REPEATED_CLICK_SPEED_MULTIPLIER}`,
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
      reason: isFiniteNumber(REPEATED_CLICK_ACCELERATION_DISTANCE_SHARE)
        ? `clamped to [${MIN_REPEATED_CLICK_PROFILE_SHARE}, ${MAX_REPEATED_CLICK_PROFILE_SHARE}]`
        : "expected a finite value between 0 and 1",
    });
  }

  if (
    decelerationDistanceShare !== REPEATED_CLICK_DECELERATION_DISTANCE_SHARE
  ) {
    corrections.push({
      field: "REPEATED_CLICK_DECELERATION_DISTANCE_SHARE",
      provided: REPEATED_CLICK_DECELERATION_DISTANCE_SHARE,
      normalized: decelerationDistanceShare,
      reason: isFiniteNumber(REPEATED_CLICK_DECELERATION_DISTANCE_SHARE)
        ? `clamped to [${MIN_REPEATED_CLICK_PROFILE_SHARE}, ${MAX_REPEATED_CLICK_PROFILE_SHARE}]`
        : "expected a finite value between 0 and 1",
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
        "start + end distance shares exceed 1; runtime uses an even 50/50 acceleration/deceleration split with no cruise zone",
    });
  }

  if (!isPositiveFiniteNumber(REPEATED_CLICK_EPSILON)) {
    corrections.push({
      field: "REPEATED_CLICK_EPSILON",
      provided: REPEATED_CLICK_EPSILON,
      message: getInternalConstantNoticeMessage(
        "expected a finite positive value",
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
