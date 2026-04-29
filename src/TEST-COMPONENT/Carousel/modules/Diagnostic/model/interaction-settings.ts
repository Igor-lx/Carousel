import type { DevNoticeEntry } from "../../../../../shared";
import {
  AUTOPLAY_PAGINATION_FACTOR,
  HOVER_PAUSE_DELAY,
  VISIBILITY_THRESHOLD,
} from "../../../core/model/config";
import {
  DIAGNOSTIC_FALLBACK_INTERACTION_SETTINGS,
  MAX_VISIBILITY_THRESHOLD,
  MIN_VISIBILITY_THRESHOLD,
} from "./constraints";
import {
  DURATION_UNIT,
  getAllowedRangeReason,
  getDiagnosticFallbackReason,
  getNonNegativeDurationReason,
  isFiniteNumber,
  joinReasons,
} from "./diagnostic-validation";
import {
  normalizeAutoplayPaginationFactor,
  normalizeNonNegativeNumber,
  normalizeVisibilityThreshold,
} from "./normalization";

const getNonNegativeDurationFallbackReason = (
  value: unknown,
  fallbackValue: number,
) =>
  joinReasons(
    getNonNegativeDurationReason(value),
    !isFiniteNumber(value) || value < 0
      ? getDiagnosticFallbackReason(fallbackValue, DURATION_UNIT)
      : undefined,
  );

const getVisibilityThresholdReason = (value: unknown) =>
  isFiniteNumber(value)
    ? getAllowedRangeReason(
        MIN_VISIBILITY_THRESHOLD,
        MAX_VISIBILITY_THRESHOLD,
        "IntersectionObserver threshold range",
      )
    : joinReasons(
        "Expected a finite visibility threshold",
        getDiagnosticFallbackReason(
          DIAGNOSTIC_FALLBACK_INTERACTION_SETTINGS.visibilityThreshold,
        ),
      );

const getAutoplayPaginationFactorReason = (value: unknown) =>
  isFiniteNumber(value)
    ? `Clamped to strict internal range: ${Number.EPSILON}..${
        1 - Number.EPSILON
      } so pagination sync stays inside the motion duration`
    : joinReasons(
        "Expected a finite pagination factor",
        getDiagnosticFallbackReason(
          DIAGNOSTIC_FALLBACK_INTERACTION_SETTINGS.autoplayPaginationFactor,
        ),
      );

export const resolveInteractionSettings = () => {
  const hoverPauseDelay = normalizeNonNegativeNumber(
    HOVER_PAUSE_DELAY,
    DIAGNOSTIC_FALLBACK_INTERACTION_SETTINGS.hoverPauseDelay,
  );
  const visibilityThreshold = normalizeVisibilityThreshold(
    VISIBILITY_THRESHOLD,
    DIAGNOSTIC_FALLBACK_INTERACTION_SETTINGS.visibilityThreshold,
  );
  const autoplayPaginationFactor = normalizeAutoplayPaginationFactor(
    AUTOPLAY_PAGINATION_FACTOR,
    DIAGNOSTIC_FALLBACK_INTERACTION_SETTINGS.autoplayPaginationFactor,
  );
  const corrections: DevNoticeEntry[] = [];

  if (hoverPauseDelay !== HOVER_PAUSE_DELAY) {
    corrections.push({
      field: "HOVER_PAUSE_DELAY",
      provided: HOVER_PAUSE_DELAY,
      normalized: hoverPauseDelay,
      unit: DURATION_UNIT,
      reason: getNonNegativeDurationFallbackReason(
        HOVER_PAUSE_DELAY,
        DIAGNOSTIC_FALLBACK_INTERACTION_SETTINGS.hoverPauseDelay,
      ),
    });
  }

  if (visibilityThreshold !== VISIBILITY_THRESHOLD) {
    corrections.push({
      field: "VISIBILITY_THRESHOLD",
      provided: VISIBILITY_THRESHOLD,
      normalized: visibilityThreshold,
      reason: getVisibilityThresholdReason(VISIBILITY_THRESHOLD),
    });
  }

  if (autoplayPaginationFactor !== AUTOPLAY_PAGINATION_FACTOR) {
    corrections.push({
      field: "AUTOPLAY_PAGINATION_FACTOR",
      provided: AUTOPLAY_PAGINATION_FACTOR,
      normalized: autoplayPaginationFactor,
      reason: getAutoplayPaginationFactorReason(AUTOPLAY_PAGINATION_FACTOR),
    });
  }

  return {
    settings: {
      hoverPauseDelay,
      visibilityThreshold,
      autoplayPaginationFactor,
    },
    corrections,
  };
};
