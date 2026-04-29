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
  getNonNegativeDurationReason,
  isFiniteNumber,
} from "./diagnostic-validation";
import {
  normalizeAutoplayPaginationFactor,
  normalizeNonNegativeNumber,
  normalizeVisibilityThreshold,
} from "./normalization";

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
      reason: getNonNegativeDurationReason(HOVER_PAUSE_DELAY),
    });
  }

  if (visibilityThreshold !== VISIBILITY_THRESHOLD) {
    corrections.push({
      field: "VISIBILITY_THRESHOLD",
      provided: VISIBILITY_THRESHOLD,
      normalized: visibilityThreshold,
      reason: isFiniteNumber(VISIBILITY_THRESHOLD)
        ? `clamped to [${MIN_VISIBILITY_THRESHOLD}, ${MAX_VISIBILITY_THRESHOLD}]`
        : "expected a finite threshold between 0 and 1",
    });
  }

  if (autoplayPaginationFactor !== AUTOPLAY_PAGINATION_FACTOR) {
    corrections.push({
      field: "AUTOPLAY_PAGINATION_FACTOR",
      provided: AUTOPLAY_PAGINATION_FACTOR,
      normalized: autoplayPaginationFactor,
      reason: "expected a finite factor strictly between 0 and 1",
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
